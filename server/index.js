import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';
import placesRouter from './routes/places.js';
import locationRouter from './routes/location.js';
import templatesRouter from './routes/templates.js';
import telemetryRouter from './routes/telemetry.js';
import demoRouter from './routes/demo.js';
import quoteRouter from './routes/quote.js';
import salesAgentRouter from './routes/sales-agent.js';
import epcRouter from './routes/epc.js';
import partnerApiRouter from './routes/partner-api.js';
import wizardWorkflowRouter from './routes/wizard-workflow.js';
import opportunitiesRouter from './routes/opportunities.js';
import adminRouter from './routes/admin.js';
import marketNewsRouter from './routes/market-news.js';

// Load environment variables from server/.env, then root .env for local scripts
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS middleware (for local development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Routes
app.use('/api/places', placesRouter);
app.use('/api/location', locationRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/quote', quoteRouter);
app.use('/api/sales-agent', salesAgentRouter);
app.use('/api/epc', epcRouter);
app.use('/api/partner', partnerApiRouter);
app.use('/api/wizard', wizardWorkflowRouter);
app.use('/api', opportunitiesRouter);
app.use('/api', adminRouter);
app.use('/api', demoRouter);
app.use('/api', marketNewsRouter);

// Health check — used by smoke tests and uptime monitors
app.get('/api/health', async (req, res) => {
  const checks = {};
  let allOk = true;

  // Check Google Maps key is configured
  checks.googleMaps = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
    ? 'configured'
    : 'missing';

  // Check Supabase is configured and reachable
  const sbUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!sbUrl || sbUrl.includes('placeholder')) {
    checks.supabase = 'misconfigured — placeholder URL detected';
    allOk = false;
  } else {
    try {
      const resp = await fetch(`${sbUrl}/rest/v1/`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
        signal: AbortSignal.timeout(4000),
      });
      checks.supabase = resp.ok || resp.status === 404 ? 'reachable' : `error-${resp.status}`;
    } catch (e) {
      checks.supabase = `unreachable: ${e.message}`;
      allOk = false;
    }
  }

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    service: 'merlin-api',
    checks,
    uptime: Math.round(process.uptime()),
    ts: new Date().toISOString(),
  });
});

// Legacy health path (keep for Railway/Fly health checks)
app.get('/health', (_req, res) => res.redirect('/api/health'));

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Merlin API running on port ${PORT}`);
    console.log(`📍 Places endpoints: http://localhost:${PORT}/api/places`);
    console.log(`🌎 Location endpoints: http://localhost:${PORT}/api/location`);
    console.log(`📋 Template endpoints: http://localhost:${PORT}/api/templates`);
    console.log(`📊 Telemetry endpoints: http://localhost:${PORT}/api/telemetry`);
    console.log(`🤝 Partner API: http://localhost:${PORT}/api/partner/v1/health`);

    // ── AI Growth Loop — daily at 3am Pacific (11am UTC) ────────────────────
    // Only run on the primary Fly machine to avoid duplicate runs.
    // Uses node-cron (bundled in server/node_modules).
    // The agent: analyses site health + funnel + market → writes copy to site_copy table.
    const isPrimaryMachine =
      !process.env.FLY_MACHINE_ID ||                     // local dev
      process.env.FLY_MACHINE_ID === process.env.FLY_PRIMARY_MACHINE_ID || // explicit primary
      process.env.GROWTH_LOOP_ENABLED === 'true';        // override flag

    if (isPrimaryMachine) {
      cron.schedule('0 11 * * *', async () => {  // 11:00 UTC = 3:00am PT (PDT)
        console.log('[cron] Starting daily growth loop...');
        try {
          const { spawn } = await import('child_process');
          const child = spawn('node', ['agents/growth-loop.mjs'], {
            cwd: __dirname,
            env: { ...process.env },
            stdio: 'inherit',
          });
          child.on('close', (code) => console.log(`[cron] Growth loop exited code=${code}`));
          child.on('error', (e) => console.error('[cron] Growth loop spawn error:', e.message));
        } catch (e) {
          console.error('[cron] Growth loop failed to start:', e);
        }
      }, { timezone: 'UTC' });
      console.log('🤖 Growth loop scheduled: daily at 03:00 PT (11:00 UTC)');
    } else {
      console.log('ℹ️  Growth loop cron skipped on secondary machine');
    }
  });
}

export default app;
