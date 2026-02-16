/**
 * VENDOR API KEY SERVICE
 * ======================
 * Manages vendor API key lifecycle: creation, validation, revocation, usage tracking.
 * 
 * Architecture:
 * - API keys stored hashed in Supabase (vendor_api_keys table)
 * - Key format: mk_{env}_{32_random_chars} (e.g., mk_live_a1b2c3d4...)
 * - HMAC secrets for webhook signing
 * - Rate limiting tracked per key
 * 
 * Created: Feb 16, 2026
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type {
  VendorApiKey,
  VendorWebhook,
  ApiKeyScope,
  WebhookEvent,
  VendorApiUsageMetrics,
  PricingFeedEntry,
} from '@/types/commerce';

// =====================================================
// API KEY GENERATION
// =====================================================

/**
 * Generate a cryptographically random API key
 * Format: mk_{environment}_{32 random hex chars}
 */
function generateApiKey(environment: 'live' | 'test' = 'live'): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  return `mk_${environment}_${hex}`;
}

/**
 * Generate a webhook signing secret
 */
function generateWebhookSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash an API key for storage (SHA-256)
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get key prefix for display (first 12 chars + ...)
 */
function getKeyPrefix(key: string): string {
  return key.substring(0, 12) + '...';
}

// =====================================================
// API KEY CRUD
// =====================================================

const DEFAULT_SCOPES: ApiKeyScope[] = ['pricing:read', 'products:read', 'rfq:read'];

/**
 * Create a new API key for a vendor
 * Returns the full key (only shown once) + the stored metadata
 */
export async function createApiKey(
  vendorId: string,
  name: string,
  options?: {
    scopes?: ApiKeyScope[];
    environment?: 'live' | 'test';
    expiresInDays?: number;
    rateLimitPerMinute?: number;
    rateLimitPerDay?: number;
  }
): Promise<{ key: string; metadata: VendorApiKey } | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[VendorAPI] Supabase not configured');
    return null;
  }

  const environment = options?.environment ?? 'test';
  const fullKey = generateApiKey(environment);
  const keyHash = await hashApiKey(fullKey);
  const keyPrefix = getKeyPrefix(fullKey);
  const scopes = options?.scopes ?? DEFAULT_SCOPES;

  const expiresAt = options?.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 86400000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('vendor_api_keys')
    .insert({
      vendor_id: vendorId,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      name,
      scopes,
      environment,
      is_active: true,
      expires_at: expiresAt,
      rate_limit_per_minute: options?.rateLimitPerMinute ?? 60,
      rate_limit_per_day: options?.rateLimitPerDay ?? 1000,
      total_requests: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[VendorAPI] Failed to create API key:', error.message);
    return null;
  }

  return {
    key: fullKey, // Only returned on creation!
    metadata: mapDbToApiKey(data),
  };
}

/**
 * List all API keys for a vendor (keys are hashed, only prefix shown)
 */
export async function listApiKeys(vendorId: string): Promise<VendorApiKey[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('vendor_api_keys')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[VendorAPI] Failed to list API keys:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbToApiKey);
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, vendorId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('vendor_api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', keyId)
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('[VendorAPI] Failed to revoke key:', error.message);
    return false;
  }

  return true;
}

/**
 * Validate an API key and return associated vendor + scopes
 * Used by Edge Functions to authenticate API requests
 */
export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; vendorId?: string; scopes?: ApiKeyScope[]; keyId?: string }> {
  if (!isSupabaseConfigured()) return { valid: false };

  const keyHash = await hashApiKey(key);

  const { data, error } = await supabase
    .from('vendor_api_keys')
    .select('id, vendor_id, scopes, is_active, expires_at, rate_limit_per_minute, rate_limit_per_day')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) return { valid: false };
  if (!data.is_active) return { valid: false };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false };

  // Track usage
  await supabase
    .from('vendor_api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      total_requests: (data as Record<string, unknown>).total_requests
        ? Number((data as Record<string, unknown>).total_requests) + 1
        : 1,
    })
    .eq('id', data.id);

  return {
    valid: true,
    vendorId: data.vendor_id,
    scopes: data.scopes as ApiKeyScope[],
    keyId: data.id,
  };
}

// =====================================================
// WEBHOOK MANAGEMENT
// =====================================================

/**
 * Register a webhook endpoint for a vendor
 */
export async function createWebhook(
  vendorId: string,
  url: string,
  events: WebhookEvent[]
): Promise<VendorWebhook | null> {
  if (!isSupabaseConfigured()) return null;

  const secret = generateWebhookSecret();

  const { data, error } = await supabase
    .from('vendor_webhooks')
    .insert({
      vendor_id: vendorId,
      url,
      events,
      secret,
      is_active: true,
      failure_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[VendorAPI] Failed to create webhook:', error.message);
    return null;
  }

  return {
    id: data.id,
    vendorId: data.vendor_id,
    url: data.url,
    events: data.events as WebhookEvent[],
    secret, // Only returned on creation
    isActive: data.is_active,
    failureCount: data.failure_count,
    lastDeliveryAt: data.last_delivery_at,
    lastDeliveryStatus: data.last_delivery_status,
    createdAt: data.created_at,
  };
}

/**
 * List webhooks for a vendor
 */
export async function listWebhooks(vendorId: string): Promise<VendorWebhook[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('vendor_webhooks')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[VendorAPI] Failed to list webhooks:', error.message);
    return [];
  }

  return (data ?? []).map((w) => ({
    id: w.id,
    vendorId: w.vendor_id,
    url: w.url,
    events: w.events as WebhookEvent[],
    secret: '••••••••', // Never expose after creation
    isActive: w.is_active,
    failureCount: w.failure_count,
    lastDeliveryAt: w.last_delivery_at,
    lastDeliveryStatus: w.last_delivery_status,
    createdAt: w.created_at,
  }));
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string, vendorId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase
    .from('vendor_webhooks')
    .delete()
    .eq('id', webhookId)
    .eq('vendor_id', vendorId);

  return !error;
}

// =====================================================
// PRICING FEED INTEGRATION
// =====================================================

/**
 * Submit pricing data via API (called from vendor systems)
 */
export async function submitPricingFeed(
  vendorId: string,
  entries: PricingFeedEntry[]
): Promise<{ accepted: number; rejected: number; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return { accepted: 0, rejected: 0, errors: ['Supabase not configured'] };
  }

  const results = { accepted: 0, rejected: 0, errors: [] as string[] };

  for (const entry of entries) {
    // Validate entry
    if (!entry.productType || !entry.pricePerUnit || entry.pricePerUnit <= 0) {
      results.rejected++;
      results.errors.push(`Invalid entry: ${entry.sku || 'unknown'} — missing product type or price`);
      continue;
    }

    const { error } = await supabase.from('vendor_products').insert({
      vendor_id: vendorId,
      product_category: entry.productType,
      model: entry.model,
      manufacturer: entry.manufacturer,
      price_per_kwh: entry.unit === 'kWh' ? entry.pricePerUnit : null,
      price_per_kw: entry.unit === 'kW' ? entry.pricePerUnit : null,
      lead_time_weeks: entry.leadTimeWeeks,
      warranty_years: entry.warrantyYears,
      specifications: entry.specifications ?? {},
      status: 'pending',
      submitted_date: new Date().toISOString(),
    });

    if (error) {
      results.rejected++;
      results.errors.push(`DB error for ${entry.sku}: ${error.message}`);
    } else {
      results.accepted++;
    }
  }

  return results;
}

/**
 * Get API usage metrics for a vendor
 */
export async function getApiUsageMetrics(
  vendorId: string,
  period: 'day' | 'week' | 'month' = 'month'
): Promise<VendorApiUsageMetrics> {
  // For now, aggregate from vendor_api_keys + vendor_products
  const keys = await listApiKeys(vendorId);
  const totalRequests = keys.reduce((sum, k) => sum + k.totalRequests, 0);
  const lastUsed = keys
    .filter((k) => k.lastUsedAt)
    .sort((a, b) => (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? ''))
    [0]?.lastUsedAt;

  return {
    vendorId,
    period,
    apiCalls: totalRequests,
    pricingSubmissions: 0, // TODO: count from vendor_products
    rfqResponses: 0,       // TODO: count from rfq_responses
    webhookDeliveries: 0,  // TODO: count from webhook_delivery_log
    webhookFailures: 0,
    lastActivity: lastUsed ?? new Date().toISOString(),
  };
}

// =====================================================
// HELPERS
// =====================================================

function mapDbToApiKey(row: Record<string, unknown>): VendorApiKey {
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    keyPrefix: row.key_prefix as string,
    keyHash: row.key_hash as string,
    name: row.name as string,
    scopes: (row.scopes as ApiKeyScope[]) ?? DEFAULT_SCOPES,
    environment: (row.environment as 'live' | 'test') ?? 'test',
    isActive: row.is_active as boolean,
    lastUsedAt: row.last_used_at as string | undefined,
    expiresAt: row.expires_at as string | undefined,
    rateLimitPerMinute: (row.rate_limit_per_minute as number) ?? 60,
    rateLimitPerDay: (row.rate_limit_per_day as number) ?? 1000,
    totalRequests: (row.total_requests as number) ?? 0,
    createdAt: row.created_at as string,
    revokedAt: row.revoked_at as string | undefined,
  };
}

// =====================================================
// EXPORT CONVENIENCE
// =====================================================

export const vendorApiKeyService = {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  validateApiKey,
  createWebhook,
  listWebhooks,
  deleteWebhook,
  submitPricingFeed,
  getApiUsageMetrics,
};

export default vendorApiKeyService;
