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

    const [usersRes, quotesTodayRes, totalQuotesRes, totalLeadsRes] = await Promise.all([
      // All users with their tier
      sb.from('user_profiles').select('tier'),
      // Quotes created today
      sb
        .from('saved_quotes')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      // Total quotes ever
      sb.from('saved_quotes').select('id', { count: 'exact', head: true }),
      // Qualified leads (opportunities)
      sb
        .from('opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'qualified'),
    ]);

    const allUsers = usersRes.data ?? [];
    const totalUsers = allUsers.length;

    // Count by tier (handle both 'FREE'/'free' and new tiers)
    const freeUsers = allUsers.filter(
      (u) => !u.tier || u.tier.toLowerCase() === 'free'
    ).length;
    const paidUsers = allUsers.filter(
      (u) => u.tier && u.tier.toLowerCase() !== 'free'
    );

    const tierBreakdown = {};
    for (const u of allUsers) {
      const t = (u.tier || 'free').toLowerCase();
      tierBreakdown[t] = (tierBreakdown[t] ?? 0) + 1;
    }

    // MRR = sum of tier price for each paid user
    const monthlyRevenue = paidUsers.reduce((sum, u) => {
      const t = (u.tier || 'free').toLowerCase();
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
      },
    });
  } catch (err) {
    console.error('[admin/stats]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
