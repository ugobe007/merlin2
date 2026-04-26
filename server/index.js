import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import placesRouter from './routes/places.js';
import locationRouter from './routes/location.js';
import templatesRouter from './routes/templates.js';
import telemetryRouter from './routes/telemetry.js';
import demoRouter from './routes/demo.js';
import quoteRouter from './routes/quote.js';
import salesAgentRouter from './routes/sales-agent.js';

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

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
app.use('/api', demoRouter);

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Merlin API running on port ${PORT}`);
  console.log(`📍 Places endpoints: http://localhost:${PORT}/api/places`);
  console.log(`🌎 Location endpoints: http://localhost:${PORT}/api/location`);
  console.log(`📋 Template endpoints: http://localhost:${PORT}/api/templates`);
  console.log(`📊 Telemetry endpoints: http://localhost:${PORT}/api/telemetry`);
});
