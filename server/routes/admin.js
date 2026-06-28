/**
 * Admin Stats Route
 * GET /api/admin/stats
 *
 * Uses the service-role key so it bypasses RLS and can count across all users,
 * quotes, and subscriptions. Never expose the service-role key to the browser.
 */
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service-role credentials');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Tier → monthly revenue estimate
const TIER_MRR = {
  free: 0,
  FREE: 0,
  starter: 49,
  pro: 99,
  advanced: 149,
  business: 199,
  // legacy aliases from earlier code
  semi_premium: 49,
  premium: 199,
};

router.get('/admin/stats', async (req, res) => {
  try {
    const sb = getServiceClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // user_profiles is the canonical table. Column is `plan`, not `tier`.
    // There is no legacy `users` table in this schema.
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    // user_profiles is the canonical table. Column is `plan`, not `tier`.
    // There is no legacy `users` table in this schema.
    const [profilesRes, quotesTodayRes, totalQuotesRes, totalLeadsRes,
           signupsTodayRes, signupsWeekRes, signupsPrevWeekRes] = await Promise.all([
      sb.from('user_profiles').select('email, plan, role'),
      sb
        .from('saved_quotes')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      sb.from('saved_quotes').select('id', { count: 'exact', head: true }),
      sb
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'qualified'),
      // Signup velocity — used by AI growth loop
      sb.from('user_profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      sb.from('user_profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString()),
      sb.from('user_profiles').select('id', { count: 'exact', head: true })
        .gte('created_at', prevWeekStart.toISOString())
        .lt('created_at', weekStart.toISOString()),
    ]);

    // user_profiles is the only source of truth
    const allUsers = profilesRes.data ?? [];
    const totalUsers = allUsers.length;

    // `plan` column: 'free' = free, anything else = paid
    const freeUsers = allUsers.filter(
      (u) => !u.plan || u.plan.toLowerCase() === 'free'
    ).length;
    const paidUsers = allUsers.filter(
      (u) => u.plan && u.plan.toLowerCase() !== 'free'
    );

    const tierBreakdown = {};
    for (const u of allUsers) {
      const t = (u.plan || 'free').toLowerCase();
      tierBreakdown[t] = (tierBreakdown[t] ?? 0) + 1;
    }

    // MRR = sum of plan price for each paid user
    const monthlyRevenue = paidUsers.reduce((sum, u) => {
      const t = (u.plan || 'free').toLowerCase();
      return sum + (TIER_MRR[t] ?? 0);
    }, 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        freeUsers,
        paidUsers: paidUsers.length,
        tierBreakdown,
        quotesGeneratedToday: quotesTodayRes.count ?? 0,
        totalQuotes: totalQuotesRes.count ?? 0,
        qualifiedLeads: totalLeadsRes.count ?? 0,
        monthlyRevenue,
        activePaidSubs: paidUsers.length,
        // Signup velocity — consumed by AI growth loop & admin dashboard
        signupsToday:    signupsTodayRes.count    ?? 0,
        signupsThisWeek: signupsWeekRes.count     ?? 0,
        signupsPrevWeek: signupsPrevWeekRes.count ?? 0,
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── In-memory growth loop job state (same fire-and-forget pattern as lead-matcher)
let _growthJob = {
  running: false, startedAt: null, finishedAt: null, success: null, error: null,
};

// POST /api/admin/run-growth-loop  — kick off the growth loop agent
router.post('/admin/run-growth-loop', async (req, res) => {
  if (_growthJob.running) {
    return res.status(409).json({ success: false, message: 'Growth loop already running', startedAt: _growthJob.startedAt });
  }

  const { spawn } = await import('child_process');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));

  _growthJob = { running: true, startedAt: new Date().toISOString(), finishedAt: null, success: null, error: null };

  res.status(202).json({
    success: true,
    message: 'Growth loop started — poll GET /api/admin/growth-loop-status',
    startedAt: _growthJob.startedAt,
    machineId: process.env.FLY_MACHINE_ID ?? null,
  });

  let stderr = '';
  const child = spawn('node', ['agents/growth-loop.mjs'], {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env },
  });

  child.stdout.on('data', (c) => process.stdout.write(c));
  child.stderr.on('data', (c) => { stderr += c.toString(); process.stderr.write(c); });
  child.on('close', (code) => {
    _growthJob = { running: false, startedAt: _growthJob.startedAt,
                   finishedAt: new Date().toISOString(), success: code === 0,
                   error: code !== 0 ? stderr.slice(-300) : null };
    console.log(`[growth-loop] finished code=${code}`);
  });
  child.on('error', (e) => {
    _growthJob = { ..._growthJob, running: false, finishedAt: new Date().toISOString(), success: false, error: e.message };
  });
});

// GET /api/admin/growth-loop-status
router.get('/admin/growth-loop-status', (_req, res) => res.json(_growthJob));

// GET /api/admin/growth-reports  — last N reports from DB
router.get('/admin/growth-reports', async (req, res) => {
  try {
    const sb = getServiceClient();
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const { data, error } = await sb
      .from('growth_reports')
      .select('id, ran_at, site_health_score, total_users, total_quotes, friction_signals, growth_brief')
      .order('ran_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ success: true, reports: data ?? [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/growth-actions — recent AI copy changes (for rollback UI)
router.get('/admin/growth-actions', async (req, res) => {
  try {
    const sb = getServiceClient();
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const { data, error } = await sb
      .from('growth_actions')
      .select('id, ran_at, copy_key, old_value, new_value, rationale, rolled_back')
      .order('ran_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ success: true, actions: data ?? [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/rollback-copy — restore a single key to its previous value
router.post('/admin/rollback-copy', async (req, res) => {
  const { actionId, copyKey } = req.body ?? {};
  if (!actionId || !copyKey) return res.status(400).json({ success: false, error: 'actionId and copyKey required' });
  try {
    const sb = getServiceClient();
    // Fetch the action to get old_value
    const { data: action, error: aErr } = await sb
      .from('growth_actions').select('old_value, rolled_back').eq('id', actionId).maybeSingle();
    if (aErr || !action) return res.status(404).json({ success: false, error: 'Action not found' });
    if (action.rolled_back) return res.status(409).json({ success: false, error: 'Already rolled back' });

    // Restore previous value (or delete row if there was no previous)
    if (action.old_value != null) {
      await sb.from('site_copy').update({
        value: action.old_value, updated_by: 'human-rollback', updated_at: new Date().toISOString(),
      }).eq('key', copyKey);
    } else {
      await sb.from('site_copy').delete().eq('key', copyKey);
    }

    // Mark action as rolled back
    await sb.from('growth_actions').update({ rolled_back: true, rolled_back_at: new Date().toISOString() }).eq('id', actionId);
    res.json({ success: true, restoredValue: action.old_value ?? '(deleted)' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/site-copy — current live copy (for admin preview)
router.get('/admin/site-copy', async (req, res) => {
  try {
    const sb = getServiceClient();
    const { data, error } = await sb.from('site_copy').select('*').order('key');
    if (error) throw error;
    res.json({ success: true, copy: data ?? [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/growth-suggestions — list pending + recently reviewed suggestions
router.get('/admin/growth-suggestions', async (req, res) => {
  try {
    const sb = getServiceClient();
    const status = req.query.status ?? 'pending'; // pending | approved | rejected | all
    let query = sb
      .from('growth_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(req.query.limit ?? 50));
    if (status !== 'all') query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, suggestions: data ?? [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/approve-suggestion — approve a suggestion (applies copy changes immediately)
router.post('/admin/approve-suggestion', async (req, res) => {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ success: false, error: 'id required' });
  try {
    const sb = getServiceClient();
    const { data: suggestion, error: sErr } = await sb
      .from('growth_suggestions').select('*').eq('id', id).maybeSingle();
    if (sErr || !suggestion) return res.status(404).json({ success: false, error: 'Suggestion not found' });
    if (suggestion.status !== 'pending') {
      return res.status(409).json({ success: false, error: `Already ${suggestion.status}` });
    }

    // For copy suggestions: apply the change to site_copy immediately
    if (suggestion.type === 'copy' && suggestion.copy_key && suggestion.copy_value) {
      const ALLOWED_KEYS = new Set([
        'hero_headline_prefix','hero_accent_lines','hero_subtext','hero_badge_text',
        'hero_proof_items','hero_cta_primary','hero_cta_secondary','modal_headline',
        'modal_subtext','modal_cta_text','modal_social_proof','nav_cta_text',
      ]);
      if (!ALLOWED_KEYS.has(suggestion.copy_key)) {
        return res.status(400).json({ success: false, error: 'Copy key not in allowlist' });
      }
      const { data: cur } = await sb
        .from('site_copy').select('value').eq('key', suggestion.copy_key).maybeSingle();
      const { error: uErr } = await sb.from('site_copy').upsert({
        key:            suggestion.copy_key,
        value:          suggestion.copy_value,
        previous_value: cur?.value ?? null,
        updated_at:     new Date().toISOString(),
        updated_by:     'human-approved',
        rationale:      suggestion.rationale,
      });
      if (uErr) throw uErr;
      await sb.from('growth_actions').insert({
        copy_key:  suggestion.copy_key,
        old_value: cur?.value ?? null,
        new_value: suggestion.copy_value,
        rationale: suggestion.rationale,
        report_id: suggestion.report_id ?? null,
      });
    }

    await sb.from('growth_suggestions').update({
      status:      suggestion.type === 'copy' ? 'applied' : 'approved',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);

    res.json({ success: true, applied: suggestion.type === 'copy' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/reject-suggestion
router.post('/admin/reject-suggestion', async (req, res) => {
  const { id, note } = req.body ?? {};
  if (!id) return res.status(400).json({ success: false, error: 'id required' });
  try {
    const sb = getServiceClient();
    const { data: suggestion, error: sErr } = await sb
      .from('growth_suggestions').select('status').eq('id', id).maybeSingle();
    if (sErr || !suggestion) return res.status(404).json({ success: false, error: 'Not found' });
    if (suggestion.status !== 'pending') {
      return res.status(409).json({ success: false, error: `Already ${suggestion.status}` });
    }
    await sb.from('growth_suggestions').update({
      status:        'rejected',
      reviewed_at:   new Date().toISOString(),
      reviewed_note: note ?? null,
    }).eq('id', id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
