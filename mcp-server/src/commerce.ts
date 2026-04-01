/**
 * MCP Agent Commerce Layer
 * ========================
 * API key management, usage metering, and rate limiting
 * for agent-to-agent interactions with Merlin's TrueQuote™ engine.
 *
 * Plans:
 *   free        — 10 quotes/month  (AI agent exploration, no charge)
 *   starter     — 100 quotes/month ($49/mo)
 *   pro         — 1,000 quotes/month ($199/mo)
 *   enterprise  — unlimited (custom contract)
 *
 * Key format: mk_live_<32 random hex chars>
 * Storage: SHA-256 hash stored in Supabase mcp_api_keys table
 */

import { createHash, randomBytes } from 'crypto';

// ============================================================
// CONFIG
// ============================================================

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const PLAN_QUOTAS: Record<string, number> = {
  free: 10,
  starter: 100,
  pro: 1000,
  enterprise: 999_999,
};

const PLAN_MONTHLY_PRICE: Record<string, number> = {
  free: 0,
  starter: 49,
  pro: 199,
  enterprise: 0, // custom
};

// ============================================================
// TYPES
// ============================================================

export interface MerlinApiKey {
  id: string;
  key_prefix: string;
  owner_name: string;
  owner_email: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  monthly_quota: number;
  usage_this_month: number;
  last_reset_at: string;
  is_active: boolean;
  created_at: string;
  stripe_customer_id?: string;
}

export interface CreateKeyResult {
  rawKey: string;      // shown ONCE — agent must save this
  keyPrefix: string;   // safe to display (no secret)
  keyId: string;
  plan: string;
  monthlyQuota: number;
  upgradePath: string;
}

export interface UsageStats {
  plan: string;
  monthlyPrice: number;
  usageThisMonth: number;
  quota: number;
  remainingCalls: number;
  percentUsed: number;
  recentCalls: RecentCall[];
  upgradeUrl: string;
}

export interface RecentCall {
  tool_name: string;
  industry?: string;
  location?: string;
  response_ms?: number;
  created_at: string;
}

// ============================================================
// SUPABASE HELPERS
// ============================================================

async function sbFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured (missing SUPABASE_URL / SUPABASE_ANON_KEY)');
  }
  const url = path.startsWith('http') ? path : `${supabaseUrl}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=representation',
      ...(options.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ([] as unknown as T);
}

// ============================================================
// KEY MANAGEMENT
// ============================================================

/** SHA-256 hash of the raw key for storage */
export function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/** Generate a new raw API key */
function generateRawKey(): string {
  return `mk_live_${randomBytes(16).toString('hex')}`;
}

/** Create a new API key in Supabase. Returns raw key (shown once only). */
export async function createApiKey(params: {
  ownerName: string;
  ownerEmail: string;
  plan?: string;
}): Promise<CreateKeyResult> {
  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.substring(0, 14); // "mk_live_ab12cd"
  const plan = params.plan ?? 'free';
  const monthlyQuota = PLAN_QUOTAS[plan] ?? PLAN_QUOTAS.free;

  const rows = await sbFetch<MerlinApiKey[]>('/mcp_api_keys', {
    method: 'POST',
    body: JSON.stringify({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      owner_name: params.ownerName,
      owner_email: params.ownerEmail,
      plan,
      monthly_quota: monthlyQuota,
      usage_this_month: 0,
      last_reset_at: new Date().toISOString(),
      is_active: true,
    }),
  });

  const keyId = rows[0]?.id ?? 'unknown';

  return {
    rawKey,
    keyPrefix,
    keyId,
    plan,
    monthlyQuota,
    upgradePath: plan === 'free'
      ? 'Upgrade to Starter (100/mo, $49): merlinpro.energy/api-keys'
      : plan === 'starter'
      ? 'Upgrade to Pro (1000/mo, $199): merlinpro.energy/api-keys'
      : 'Contact sales@merlinpro.energy for Enterprise pricing',
  };
}

/** Validate a raw API key — returns key record or null + error string */
export async function validateApiKey(rawKey: string): Promise<{
  key: MerlinApiKey | null;
  error?: string;
}> {
  // Dev/stdio shortcut: no Supabase configured → allow with dev grant
  if (!supabaseUrl || !supabaseKey) {
    return {
      key: {
        id: 'dev',
        key_prefix: 'dev',
        owner_name: 'Dev',
        owner_email: 'dev@localhost',
        plan: 'enterprise',
        monthly_quota: 999_999,
        usage_this_month: 0,
        last_reset_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };
  }

  const keyHash = hashKey(rawKey);

  let rows: MerlinApiKey[];
  try {
    rows = await sbFetch<MerlinApiKey[]>(
      `/mcp_api_keys?key_hash=eq.${keyHash}&is_active=eq.true&select=*`
    );
  } catch (e) {
    console.error('[commerce] validateApiKey fetch error:', e);
    return { key: null, error: 'Key validation service unavailable' };
  }

  if (!rows || rows.length === 0) {
    return { key: null, error: 'Invalid API key. Register at merlinpro.energy/api-keys' };
  }

  const key = rows[0];

  // Monthly reset check
  const lastReset = new Date(key.last_reset_at);
  const now = new Date();
  if (
    lastReset.getMonth() !== now.getMonth() ||
    lastReset.getFullYear() !== now.getFullYear()
  ) {
    await sbFetch(`/mcp_api_keys?id=eq.${key.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ usage_this_month: 0, last_reset_at: now.toISOString() }),
    }).catch(() => {});
    key.usage_this_month = 0;
  }

  // Quota check
  if (key.usage_this_month >= key.monthly_quota) {
    const upgrades: Record<string, string> = {
      free: 'Upgrade to Starter (100/mo, $49): merlinpro.energy/api-keys',
      starter: 'Upgrade to Pro (1000/mo, $199): merlinpro.energy/api-keys',
      pro: 'Contact sales@merlinpro.energy for Enterprise',
    };
    return {
      key: null,
      error: `Monthly quota of ${key.monthly_quota} calls exceeded for plan '${key.plan}'. ${upgrades[key.plan] ?? 'Contact support.'}`,
    };
  }

  return { key };
}

/** Atomically increment usage counter and log the call */
export async function trackUsage(
  keyId: string,
  toolName: string,
  meta: { industry?: string; location?: string; responseMs?: number }
): Promise<void> {
  if (!supabaseUrl || !supabaseKey || keyId === 'dev') return;

  try {
    // Log the tool call
    await sbFetch('/mcp_usage_log', {
      method: 'POST',
      body: JSON.stringify({
        key_id: keyId,
        tool_name: toolName,
        industry: meta.industry ?? null,
        location: meta.location ?? null,
        response_ms: meta.responseMs ?? null,
        created_at: new Date().toISOString(),
      }),
    });

    // Atomic increment via RPC
    await sbFetch(`${supabaseUrl}/rest/v1/rpc/increment_mcp_usage`, {
      method: 'POST',
      body: JSON.stringify({ p_key_id: keyId }),
    });
  } catch (e) {
    // Non-fatal — don't block the agent response
    console.error('[commerce] trackUsage error:', e);
  }
}

/** Get usage stats for a validated key */
export async function getUsageStats(rawKey: string): Promise<UsageStats | null> {
  const { key, error } = await validateApiKey(rawKey);
  if (!key || error) return null;

  let recentCalls: RecentCall[] = [];
  try {
    recentCalls = await sbFetch<RecentCall[]>(
      `/mcp_usage_log?key_id=eq.${key.id}&order=created_at.desc&limit=10` +
        `&select=tool_name,industry,location,response_ms,created_at`
    );
  } catch {
    recentCalls = [];
  }

  const percentUsed = key.monthly_quota > 0
    ? Math.round((key.usage_this_month / key.monthly_quota) * 100)
    : 0;

  const upgrades: Record<string, string> = {
    free: 'merlinpro.energy/api-keys (Starter: 100/mo for $49)',
    starter: 'merlinpro.energy/api-keys (Pro: 1000/mo for $199)',
    pro: 'sales@merlinpro.energy (Enterprise: unlimited)',
    enterprise: 'You are on the highest tier',
  };

  return {
    plan: key.plan,
    monthlyPrice: PLAN_MONTHLY_PRICE[key.plan] ?? 0,
    usageThisMonth: key.usage_this_month,
    quota: key.monthly_quota,
    remainingCalls: Math.max(0, key.monthly_quota - key.usage_this_month),
    percentUsed,
    recentCalls,
    upgradeUrl: upgrades[key.plan] ?? 'merlinpro.energy/api-keys',
  };
}
