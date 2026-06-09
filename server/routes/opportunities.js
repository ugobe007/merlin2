import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { runOpportunityScraper } from '../services/opportunity-scraper.js';

const router = express.Router();

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

router.get('/opportunities', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const status = req.query.status;

    let query = supabase
      .from('opportunities')
      .select('*', { count: 'exact' })
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: data || [], count: count || 0 });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load opportunities',
    });
  }
});

router.post('/scraper/run', async (req, res) => {
  try {
    const result = await runOpportunityScraper({
      minConfidence: Number(req.body?.minConfidence || 50),
      maxPerSource: Number(req.body?.maxPerSource || 75),
    });

    res.json(result);
  } catch (error) {
    try {
      const supabase = getSupabaseClient();
      await supabase.from('scraper_runs').insert({
        source: 'news_aggregator',
        total_found: 0,
        duplicates_skipped: 0,
        status: 'failed',
        error_message: error.message || 'Unknown scraper error',
      });
    } catch (logError) {
      console.warn('[opportunities] Failed to log scraper error', logError);
    }

    res.status(500).json({
      success: false,
      message: 'Scraper failed',
      error: error.message || 'Unknown scraper error',
    });
  }
});

export default router;
