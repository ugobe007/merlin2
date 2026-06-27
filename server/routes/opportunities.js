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

// ── In-memory job state for the lead matcher ──────────────────────────────────
// Persists the last run result and tracks whether a run is in progress.
// Resets on server restart (acceptable — short-lived state only).
let _matcherJob = {
  running:   false,
  startedAt: null,
  finishedAt: null,
  success:   null,
  summary:   null,
  log:       null,
  error:     null,
};

// ── POST /api/leads/run-matcher ───────────────────────────────────────────────
// Kicks off the lead-matcher agent in the background and returns 202 immediately.
// The matcher can take several minutes for large opportunity sets — holding the
// HTTP connection open causes proxy timeouts on Fly.io (default ~60 s).
//
// Body params (all optional):
//   rerun    {boolean} – re-score already-matched opportunities
//   minScore {number}  – qualification threshold (default 65)
//   dryRun   {boolean} – score only, no writes (useful for previewing)
//
// Poll GET /api/leads/matcher-status for the result.
router.post('/leads/run-matcher', async (req, res) => {
  if (_matcherJob.running) {
    return res.status(409).json({
      success: false,
      message: 'Lead matcher is already running',
      startedAt: _matcherJob.startedAt,
    });
  }

  const { spawn } = await import('child_process');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');

  const __dirname = dirname(fileURLToPath(import.meta.url));

  const args = ['agents/lead-matcher.mjs'];
  if (req.body?.rerun)    args.push('--rerun');
  if (req.body?.dryRun)   args.push('--dry-run');
  if (req.body?.minScore) args.push(`--min-score=${Number(req.body.minScore)}`);

  _matcherJob = { running: true, startedAt: new Date().toISOString(),
                  finishedAt: null, success: null, summary: null, log: null, error: null };

  // Respond immediately — do not await the child process.
  // Include machineId so the client can pin all /matcher-status polls to THIS
  // machine via the fly-force-instance-id header (avoids cross-machine memory mismatch).
  res.status(202).json({
    success: true,
    message: 'Lead matcher started — poll GET /api/leads/matcher-status for results',
    startedAt: _matcherJob.startedAt,
    machineId: process.env.FLY_MACHINE_ID ?? null,
  });

  // ── Background child process (no timeout — matcher can take several minutes) ─
  let stdout = '';
  let stderr = '';

  const child = spawn('node', args, {
    cwd: resolve(__dirname, '..'), // /app/server — agents/ is at server/agents/
    env: { ...process.env },
  });

  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  child.on('close', (code) => {
    const summaryMatch = stdout.match(/Scanned\s+(\d+).+?(\d+)\s+qualified.+?(\d+)\s+new\s+leads/i);
    _matcherJob = {
      running:    false,
      startedAt:  _matcherJob.startedAt,
      finishedAt: new Date().toISOString(),
      success:    code === 0,
      summary: summaryMatch ? {
        scanned:   Number(summaryMatch[1]),
        qualified: Number(summaryMatch[2]),
        newLeads:  Number(summaryMatch[3]),
      } : null,
      log:   stdout.slice(-3000),
      error: code !== 0 ? (stderr || `Non-zero exit: ${code}`).slice(0, 500) : null,
    };
    console.log(`[lead-matcher] finished code=${code} scanned=${_matcherJob.summary?.scanned ?? '?'} qualified=${_matcherJob.summary?.qualified ?? '?'} newLeads=${_matcherJob.summary?.newLeads ?? '?'}`);
  });

  child.on('error', (err) => {
    _matcherJob = { ..._matcherJob, running: false, finishedAt: new Date().toISOString(),
                    success: false, error: err.message };
    console.error('[lead-matcher] spawn error:', err.message);
  });
});

// ── GET /api/leads/matcher-status ─────────────────────────────────────────────
// Returns the current or last-completed lead-matcher job state.
router.get('/leads/matcher-status', (_req, res) => {
  res.json(_matcherJob);
});

export default router;
