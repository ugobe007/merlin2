import express from 'express';
import crypto from 'crypto';

const router = express.Router();

const RATE_LIMITS = {
  starter: 100,
  professional: 500,
  enterprise: 5000,
};

const rateLimitStore = new Map();

function createToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function readToken(token) {
  const parts = token.split('.');
  const payload = parts.length === 3 ? parts[1] : parts[0];
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized — Bearer token required' });
    return;
  }

  try {
    const payload = readToken(header.slice('Bearer '.length));
    req.partner = {
      partnerId: String(payload.sub || 'unknown'),
      tier: payload.tier || 'starter',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function rateLimitMiddleware(req, res, next) {
  const partner = req.partner;
  if (!partner) {
    next();
    return;
  }

  const limit = RATE_LIMITS[partner.tier] || RATE_LIMITS.starter;
  const now = Date.now();
  const key = partner.partnerId;
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 3600000 });
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - 1);
    next();
    return;
  }

  if (current.count >= limit) {
    res.status(429).json({ error: 'Rate limit exceeded', retryAfter: Math.ceil((current.resetAt - now) / 1000) });
    return;
  }

  current.count += 1;
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - current.count);
  next();
}

function getLeadValue(industry) {
  const values = {
    'car-wash': 150,
    hotel: 200,
    'data-center': 500,
    'ev-charging': 300,
    restaurant: 100,
    office: 150,
    warehouse: 200,
    manufacturing: 400,
    university: 300,
    hospital: 400,
    agriculture: 150,
    retail: 100,
  };
  return values[industry] || 100;
}

async function fireWebhook(url, event, payload) {
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET || 'default')
    .update(body)
    .digest('hex');

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merlin-Signature': `sha256=${signature}`,
      'X-Merlin-Event': event,
    },
    body,
  });
}

router.post('/auth/token', (req, res) => {
  const { apiKey, apiSecret } = req.body || {};
  const expectedKey = process.env.PARTNER_API_KEY;
  const expectedSecret = process.env.PARTNER_API_SECRET;

  if (!apiKey || !apiSecret) {
    res.status(400).json({ error: 'apiKey and apiSecret required' });
    return;
  }

  if (expectedKey && expectedSecret && (apiKey !== expectedKey || apiSecret !== expectedSecret)) {
    res.status(401).json({ error: 'Invalid partner credentials' });
    return;
  }

  const payload = createToken({ sub: apiKey, tier: process.env.PARTNER_API_TIER || 'professional', iat: Date.now() });
  res.json({ accessToken: `merlin.${payload}.signature`, expiresIn: 3600, tokenType: 'Bearer' });
});

router.get('/v1/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', benchmarkVersion: 'nrel-atb-2024-v1.2', timestamp: new Date().toISOString() });
});

router.get('/v1/industries', (_req, res) => {
  res.json([
    'car-wash',
    'hotel',
    'data-center',
    'ev-charging',
    'restaurant',
    'office',
    'warehouse',
    'manufacturing',
    'university',
    'hospital',
    'agriculture',
    'retail',
  ].map((slug) => ({ slug, leadValue: getLeadValue(slug), status: 'active' })));
});

router.post('/v1/quotes', authMiddleware, rateLimitMiddleware, async (req, res) => {
  const input = req.body || {};
  const errors = [];
  if (!input.industry) errors.push('industry is required');
  if (!input.peakDemandKw || Number(input.peakDemandKw) < 50) errors.push('peakDemandKw must be >= 50');
  if (!input.monthlyBillDollars || Number(input.monthlyBillDollars) < 100) errors.push('monthlyBillDollars must be >= 100');
  if (!input.zipCode || !/^\d{5}$/.test(String(input.zipCode))) errors.push('zipCode must be 5 digits');

  if (errors.length) {
    res.status(400).json({ error: 'Validation failed', details: errors.map((message) => ({ message })) });
    return;
  }

  const factors = {
    'car-wash': 0.35,
    hotel: 0.4,
    'data-center': 0.9,
    'ev-charging': 0.45,
    restaurant: 0.3,
    office: 0.35,
    warehouse: 0.25,
    manufacturing: 0.55,
    university: 0.4,
    hospital: 0.85,
    agriculture: 0.2,
    retail: 0.3,
  };
  const factor = factors[input.industry] || 0.35;
  const systemSizeMW = Math.ceil(((Number(input.peakDemandKw) * factor) / 1000) * 4) / 4;
  const durationHours = input.primaryUseCase === 'backup-power' ? 8 : 4;
  const systemSizeKwh = systemSizeMW * 1000 * durationHours;
  const totalCost = systemSizeKwh * 380 * 1.35;
  const netCost = totalCost * 0.7;
  const annualSavings = Number(input.monthlyBillDollars) * 12 * 0.2;
  const result = {
    quoteId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    recommendation: { systemSizeMW, systemSizeKwh, durationHours, batteryChemistry: 'LFP' },
    financials: {
      totalInstalledCostDollars: Math.round(totalCost),
      netCostAfterITCDollars: Math.round(netCost),
      annualSavingsDollars: Math.round(annualSavings),
      simplePaybackYears: Math.round((netCost / annualSavings) * 10) / 10,
    },
    partnerId: req.partner?.partnerId,
  };

  if (input.webhookUrl) {
    fireWebhook(input.webhookUrl, 'quote.created', result).catch((error) => console.error('[partner-api] webhook failed', error));
  }

  res.json(result);
});

router.post('/v1/leads', authMiddleware, rateLimitMiddleware, (req, res) => {
  const lead = req.body || {};
  if (!lead.industry || !lead.contact?.email) {
    res.status(400).json({ error: 'contact.email and industry are required' });
    return;
  }

  res.status(201).json({
    leadId: crypto.randomUUID(),
    status: 'captured',
    estimatedContactTime: 'Within 24 business hours',
    leadValue: getLeadValue(lead.industry),
  });
});

router.post('/v1/webhooks', authMiddleware, (req, res) => {
  const { url, events, secret } = req.body || {};
  if (!url || !Array.isArray(events) || !events.length) {
    res.status(400).json({ error: 'url and events array required' });
    return;
  }

  res.status(201).json({
    webhookId: crypto.randomUUID(),
    url,
    events,
    signingKey: secret || crypto.randomBytes(32).toString('hex'),
  });
});

export default router;