/**
 * TELEMETRY ENDPOINT — V7 Contract Health Monitoring
 * ===================================================
 * 
 * Purpose: Receive contract execution telemetry from frontend
 * Privacy: NO PII storage, rate-limited, fire-and-forget
 * 
 * POST /api/telemetry
 * - Validates event structure
 * - Logs to console (can upgrade to DB/metrics later)
 * - Returns 204 No Content (fire-and-forget)
 * 
 * Created: January 26, 2026
 */

import express from 'express';

const router = express.Router();

/**
 * Rate limiting (simple in-memory counter)
 * In production, use Redis or a proper rate limiter
 */
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_EVENTS_PER_WINDOW = 100; // 100 events per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  const limit = rateLimiter.get(key);
  
  // Reset window if expired
  if (now > limit.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  // Check limit
  if (limit.count >= MAX_EVENTS_PER_WINDOW) {
    return false;
  }
  
  // Increment
  limit.count++;
  return true;
}

/**
 * Validate telemetry event structure
 */
function isValidTelemetryEvent(body) {
  if (!body || typeof body !== 'object') return false;
  
  const validEvents = [
    'v7_contract_run_started',
    'v7_contract_validation_failed',
    'v7_contract_run_succeeded',
    'v7_contract_run_failed',
    'v7_contract_warning_emitted',
  ];
  
  if (!validEvents.includes(body.event)) return false;
  if (!body.sessionId || typeof body.sessionId !== 'string') return false;
  if (!body.timestamp || typeof body.timestamp !== 'string') return false;
  if (!body.industry || typeof body.industry !== 'string') return false;
  
  return true;
}

/**
 * POST /api/telemetry
 * Fire-and-forget telemetry ingestion
 */
router.post('/', (req, res) => {
  try {
    // Rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    // Validate event
    if (!isValidTelemetryEvent(req.body)) {
      return res.status(400).json({ error: 'Invalid telemetry event structure' });
    }
    
    const event = req.body;
    
    // Log to console (structured JSON for parsing)
    // In production, send to:
    // - Datadog / New Relic / Honeycomb
    // - Supabase telemetry table
    // - CloudWatch Logs / Stackdriver
    console.log('[V7 Telemetry]', JSON.stringify({
      ...event,
      receivedAt: new Date().toISOString(),
      ip: ip.substring(0, 10), // Truncate IP for privacy
    }));
    
    // Detect critical issues (for alerts)
    if (event.event === 'v7_contract_validation_failed') {
      console.warn(`⚠️ [V7 Critical] Template validation failed: ${event.industry} ${event.templateVersion} - ${event.errorMessage}`);
    }
    
    if (event.event === 'v7_contract_run_failed') {
      console.error(`🚨 [V7 Critical] Contract execution failed: ${event.industry} ${event.calculatorId} - ${event.errorCode}: ${event.errorMessage}`);
    }
    
    // Fire-and-forget: return 204 No Content immediately
    res.status(204).end();
    
  } catch (err) {
    // Never expose internal errors to client
    console.error('[Telemetry Error]', err.message);
    res.status(204).end(); // Still return 204 (best-effort)
  }
});

/**
 * GET /api/telemetry/health
 * Health check for telemetry endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'contract-telemetry',
    version: 'v7.0.0',
    rateLimit: {
      windowMs: RATE_LIMIT_WINDOW_MS,
      maxEvents: MAX_EVENTS_PER_WINDOW,
    },
  });
});

export default router;
