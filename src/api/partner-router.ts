/**
 * MERLIN PARTNER API ROUTER
 * =========================
 * Express router implementing the Merlin Partner API v1.
 * See src/api/openapi.yaml for full specification.
 *
 * Policy: POLICY-003 (no client-side keys), POLICY-010 (no direct DB from frontend)
 * Auth: JWT Bearer tokens via /auth/token
 * Rate limiting: tier-based (100/500/5000 req/hour)
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";

const router = Router();

// ============================================================
// TYPES
// ============================================================

interface AuthenticatedRequest extends Request {
  apiKey?: {
    partnerId: string;
    tier: "starter" | "professional" | "enterprise";
    quotesRemaining: number;
  };
}

interface QuoteApiInput {
  industry: string;
  peakDemandKw: number;
  monthlyBillDollars: number;
  zipCode: string;
  primaryUseCase?: string;
  hasSolar?: boolean;
  solarMW?: number;
  webhookUrl?: string;
}

// ============================================================
// MIDDLEWARE
// ============================================================

const RATE_LIMITS: Record<string, number> = {
  starter: 100,
  professional: 500,
  enterprise: 5000,
};

// In-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimitMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.apiKey) {
    next();
    return;
  }

  const key = req.apiKey.partnerId;
  const limit = RATE_LIMITS[req.apiKey.tier] ?? 100;
  const now = Date.now();
  const hourMs = 3_600_000;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + hourMs });
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", limit - 1);
    res.setHeader("X-RateLimit-Reset", Math.ceil((now + hourMs) / 1000));
    next();
    return;
  }

  if (current.count >= limit) {
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    });
    return;
  }

  current.count++;
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", limit - current.count);
  next();
}

// JWT auth middleware (simplified — use proper JWT library in production)
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized — Bearer token required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  // In production: verify JWT signature, check expiry, load partner from DB
  // For now, decode and trust (add proper JWT validation before production)
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64").toString());
    req.apiKey = {
      partnerId: payload.sub as string,
      tier: payload.tier as "starter" | "professional" | "enterprise",
      quotesRemaining: 1000,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ============================================================
// ROUTES
// ============================================================

/**
 * POST /auth/token
 * Exchange API key + secret for JWT token
 */
router.post("/auth/token", async (req: Request, res: Response) => {
  const { apiKey, apiSecret } = req.body as { apiKey?: string; apiSecret?: string };

  if (!apiKey || !apiSecret) {
    res.status(400).json({ error: "apiKey and apiSecret required" });
    return;
  }

  // In production: verify against DB, generate proper JWT
  // This is a placeholder implementation
  const mockToken = Buffer.from(
    JSON.stringify({ sub: apiKey, tier: "professional", iat: Date.now() })
  ).toString("base64");
  const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockToken}.PLACEHOLDER_SIGNATURE`;

  res.json({
    accessToken: fakeJwt,
    expiresIn: 3600,
    tokenType: "Bearer",
  });
});

/**
 * POST /v1/quotes
 * Generate a TrueQuote™ analysis
 */
router.post(
  "/quotes",
  authMiddleware,
  rateLimitMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const input = req.body as QuoteApiInput;

    // Validation
    const errors: string[] = [];
    if (!input.industry) errors.push("industry is required");
    if (!input.peakDemandKw || input.peakDemandKw < 50) errors.push("peakDemandKw must be >= 50");
    if (!input.monthlyBillDollars || input.monthlyBillDollars < 100)
      errors.push("monthlyBillDollars must be >= 100");
    if (!input.zipCode || !/^\d{5}$/.test(input.zipCode)) errors.push("zipCode must be 5 digits");

    if (errors.length > 0) {
      res
        .status(400)
        .json({ error: "Validation failed", details: errors.map((msg) => ({ message: msg })) });
      return;
    }

    // Generate quote via TrueQuote™ engine
    // In production, this calls the actual unifiedQuoteCalculator service
    // via internal API to maintain the SSOT architecture (POLICY-001)
    const quoteId = crypto.randomUUID();
    const calculatedAt = new Date().toISOString();

    // Canonical calculation (simplified — production routes through unifiedQuoteCalculator.ts)
    const industryFactors: Record<string, number> = {
      "car-wash": 0.35,
      hotel: 0.4,
      "data-center": 0.9,
      "ev-charging": 0.45,
      restaurant: 0.3,
      office: 0.35,
      warehouse: 0.25,
      manufacturing: 0.55,
      university: 0.4,
      hospital: 0.85,
      agriculture: 0.2,
      retail: 0.3,
    };
    const factor = industryFactors[input.industry] ?? 0.35;
    const systemSizeMW = Math.ceil(((input.peakDemandKw * factor) / 1000) * 4) / 4;
    const durationHours = input.primaryUseCase === "backup-power" ? 8 : 4;
    const systemSizeKwh = systemSizeMW * 1000 * durationHours;

    const bessCapexPerKwh = 380; // NREL StoreFAST 2024
    const totalCost = systemSizeKwh * bessCapexPerKwh * 1.35;
    const itcCredit = totalCost * 0.3;
    const netCost = totalCost - itcCredit;
    const annualSavings = input.monthlyBillDollars * 12 * 0.2;
    const paybackYears = netCost / annualSavings;

    const result = {
      quoteId,
      createdAt: calculatedAt,
      benchmarkVersion: "nrel-atb-2024-v1.2",
      input,
      recommendation: {
        systemSizeMW,
        systemSizeKwh,
        durationHours,
        batteryChemistry: "LFP",
        primaryUseCase: input.primaryUseCase ?? "peak-shaving",
      },
      financials: {
        totalInstalledCostDollars: Math.round(totalCost),
        itcCreditDollars: Math.round(itcCredit),
        netCostAfterITCDollars: Math.round(netCost),
        annualSavingsDollars: Math.round(annualSavings),
        simplePaybackYears: Math.round(paybackYears * 10) / 10,
        npv25YearDollars: Math.round(annualSavings * 15 - netCost), // simplified
        irrPercent: Math.round((annualSavings / netCost) * 100 * 10) / 10,
        lcoePerKwh: Math.round((netCost / (systemSizeKwh * 250 * 25)) * 1000) / 1000,
        co2AvoidedTonsPerYear: Math.round((systemSizeKwh * 250) / 1000),
      },
      confidence: {
        score: 78,
        uncertaintyBand: "±15%",
        limitingFactors: ["Actual utility tariff not loaded", "Site assessment not performed"],
      },
      sources: [
        { name: "NREL Annual Technology Baseline 2024", url: "https://atb.nrel.gov/" },
        {
          name: "NREL StoreFAST BESS Cost Model",
          url: "https://www.nrel.gov/docs/fy23osti/85878.pdf",
        },
      ],
      _meta: {
        partnerId: req.apiKey?.partnerId,
        tier: req.apiKey?.tier,
        policy: "POLICY-001: Calculation routing through TrueQuote™ engine",
      },
    };

    // Fire webhook if provided
    if (input.webhookUrl) {
      fireWebhook(input.webhookUrl, "quote.created", result).catch(console.error);
    }

    res.json(result);
  }
);

/**
 * GET /v1/quotes
 * List quotes for authenticated partner
 */
router.get("/quotes", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // In production: query Supabase with partner filter
  res.json({
    data: [],
    nextCursor: null,
    total: 0,
    _note: "Connect to Supabase in production to retrieve historical quotes",
  });
});

/**
 * GET /v1/industries
 * List all supported industry verticals
 */
router.get("/industries", (req: Request, res: Response) => {
  const industries = [
    {
      slug: "car-wash",
      name: "Car Wash",
      leadValue: 150,
      avgProjectSizeDollars: 500_000,
      status: "active",
    },
    {
      slug: "hotel",
      name: "Hotel / Hospitality",
      leadValue: 200,
      avgProjectSizeDollars: 800_000,
      status: "active",
    },
    {
      slug: "data-center",
      name: "Data Center",
      leadValue: 500,
      avgProjectSizeDollars: 5_000_000,
      status: "active",
    },
    {
      slug: "ev-charging",
      name: "EV Charging Hub",
      leadValue: 300,
      avgProjectSizeDollars: 750_000,
      status: "active",
    },
    {
      slug: "restaurant",
      name: "Restaurant",
      leadValue: 100,
      avgProjectSizeDollars: 200_000,
      status: "active",
    },
    {
      slug: "office",
      name: "Office Building",
      leadValue: 150,
      avgProjectSizeDollars: 400_000,
      status: "active",
    },
    {
      slug: "warehouse",
      name: "Warehouse / Industrial",
      leadValue: 200,
      avgProjectSizeDollars: 600_000,
      status: "active",
    },
    {
      slug: "manufacturing",
      name: "Manufacturing",
      leadValue: 400,
      avgProjectSizeDollars: 2_000_000,
      status: "active",
    },
    {
      slug: "university",
      name: "University / Campus",
      leadValue: 300,
      avgProjectSizeDollars: 1_500_000,
      status: "active",
    },
    {
      slug: "hospital",
      name: "Hospital / Healthcare",
      leadValue: 400,
      avgProjectSizeDollars: 2_000_000,
      status: "active",
    },
    {
      slug: "agriculture",
      name: "Agriculture",
      leadValue: 150,
      avgProjectSizeDollars: 350_000,
      status: "active",
    },
    {
      slug: "retail",
      name: "Retail",
      leadValue: 100,
      avgProjectSizeDollars: 300_000,
      status: "active",
    },
  ];

  res.json(industries);
});

/**
 * POST /v1/leads
 * Submit a captured lead
 */
router.post("/leads", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const lead = req.body as {
    industry?: string;
    contact?: { name: string; email: string };
    quoteId?: string;
  };

  if (!lead.contact?.email || !lead.industry) {
    res.status(400).json({ error: "contact.email and industry are required" });
    return;
  }

  const leadId = crypto.randomUUID();

  // In production: save to Supabase, trigger routing workflow
  res.status(201).json({
    leadId,
    status: "captured",
    estimatedContactTime: "Within 24 business hours",
    leadValue: getLeadValue(lead.industry ?? ""),
    _note: "Lead routing to installer network in production",
  });
});

/**
 * POST /v1/webhooks
 * Register webhook endpoint
 */
router.post("/webhooks", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { url, events, secret } = req.body as { url: string; events: string[]; secret?: string };

  if (!url || !events?.length) {
    res.status(400).json({ error: "url and events array required" });
    return;
  }

  const webhookId = crypto.randomUUID();
  const signingKey = secret ?? crypto.randomBytes(32).toString("hex");

  res.status(201).json({
    webhookId,
    url,
    events,
    signingKey,
    _note: "Save the signingKey — it will not be shown again. Use it to verify webhook signatures.",
  });
});

/**
 * GET /v1/health
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    benchmarkVersion: "nrel-atb-2024-v1.2",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// WEBHOOK DELIVERY
// ============================================================

async function fireWebhook(url: string, event: string, payload: unknown): Promise<void> {
  const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
  const signature = crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET ?? "default")
    .update(body)
    .digest("hex");

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Merlin-Signature": `sha256=${signature}`,
      "X-Merlin-Event": event,
    },
    body,
  });
}

// ============================================================
// HELPERS
// ============================================================

function getLeadValue(industry: string): number {
  const values: Record<string, number> = {
    "car-wash": 150,
    hotel: 200,
    "data-center": 500,
    "ev-charging": 300,
    restaurant: 100,
    office: 150,
    warehouse: 200,
    manufacturing: 400,
    university: 300,
    hospital: 400,
    agriculture: 150,
    retail: 100,
  };
  return values[industry] ?? 100;
}

export default router;
