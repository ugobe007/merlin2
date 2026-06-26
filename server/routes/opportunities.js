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

// ── POST /api/leads/run-matcher ───────────────────────────────────────────────
// Runs the lead-matcher agent (agents/lead-matcher.ts) to score all unmatched
// opportunities, create vendor_leads rows, and send vendor notifications.
//
// Body params (all optional):
//   rerun    {boolean} – re-score already-matched opportunities
//   minScore {number}  – qualification threshold (default 65)
//   dryRun   {boolean} – score only, no writes (useful for previewing)
router.post('/leads/run-matcher', async (req, res) => {
  const { spawn } = await import('child_process');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(__dirname, '../..');

  const args = ['tsx', 'agents/lead-matcher.ts'];
  if (req.body?.rerun)   args.push('--rerun');
  if (req.body?.dryRun)  args.push('--dry-run');
  if (req.body?.minScore) args.push(`--min-score=${Number(req.body.minScore)}`);

  let stdout = '';
  let stderr = '';

  const child = spawn('npx', args, {
    cwd: projectRoot,
    env: { ...process.env },
    timeout: 120_000, // 2-minute cap
  });

  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  child.on('close', (code) => {
    // Parse summary line from agent output: "Scanned N | M qualified | K new leads"
    const summaryMatch = stdout.match(/Scanned\s+(\d+).+?(\d+)\s+qualified.+?(\d+)\s+new\s+leads/i);
    res.status(code === 0 ? 200 : 500).json({
      success: code === 0,
      message: code === 0 ? 'Lead matcher completed' : 'Lead matcher failed',
      summary: summaryMatch ? {
        scanned:    Number(summaryMatch[1]),
        qualified:  Number(summaryMatch[2]),
        newLeads:   Number(summaryMatch[3]),
      } : null,
      log: stdout.slice(-3000), // last 3 KB of output
      error: code !== 0 ? (stderr || 'Non-zero exit').slice(0, 500) : undefined,
    });
  });

  child.on('error', (err) => {
    res.status(500).json({ success: false, message: 'Failed to start lead matcher', error: err.message });
  });
});

export default router;
