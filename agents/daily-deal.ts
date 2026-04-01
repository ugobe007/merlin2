#!/usr/bin/env node
/**
 * MERLIN DAILY DEAL AGENT
 * ========================
 * Runs every morning after the daily runner.
 * Picks today's featured industry, calculates a TrueQuote™ for a
 * representative site, and posts a "Deal of the Day" embed to Discord.
 *
 * Rotates across 18 industries — one per day, cycling by day-of-year.
 *
 * Schedule: runs inside daily-runner.ts as Step 6 (after newsletter).
 * Can also run standalone: npx tsx agents/daily-deal.ts
 *
 * Calls the live Railway MCP endpoint (same as the Discord bot) to avoid
 * Vite-specific imports (import.meta.env) that break in Node.js scripts.
 *
 * Authority Level: Level 1 (Safe Writes — no SSOT modifications)
 */

import 'dotenv/config';
import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// MCP CLIENT — calls the live Railway MCP server
// ─────────────────────────────────────────────────────────────

const MCP_URL = process.env.MERLIN_MCP_URL ?? 'https://merlin-mcp-agent-production.up.railway.app/mcp';

let _mcp: McpClient | null = null;

async function getMcp(): Promise<McpClient> {
  if (_mcp) return _mcp;
  _mcp = new McpClient({ name: 'merlin-daily-deal', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  await _mcp.connect(transport);
  return _mcp;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    const mcp = await getMcp();
    const result = await mcp.callTool({ name, arguments: args });
    const text = (result.content as Array<{ type: string; text: string }>)?.[0]?.text;
    return text ? JSON.parse(text) : result;
  } catch (err) {
    _mcp = null;
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// MINIMAL TYPES — matches MCP generate_truequote response shape
// ─────────────────────────────────────────────────────────────

interface MCPQuoteResult {
  recommendation: {
    systemSizeMW: number;
    durationHours: number;
    primaryUseCase?: string;
    batteryChemistry?: string;
  };
  financials: {
    totalInstalledCost: number;
    netCostAfterITC: number;
    annualSavings: number;
    simplePayback: number;
    npv25Year: number;
    irrEstimate: string | number;
    co2AvoidedTonsPerYear?: number;
    itcPercentage?: number;
  };
  disclaimer?: string;
  nextStep?: string;
  pricingSource?: string;
}

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

/** Inputs passed to the MCP generate_truequote tool */
export interface DealInput {
  industry: string;
  peakDemandKw: number;
  monthlyBillDollars: number;
  zipCode: string;
  primaryUseCase: string;
  hasSolar: boolean;
}

export interface DealProfile {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
  marketHook: string;  // One-line market intelligence signal
  painPoint: string;   // Primary financial pain
  ctaLine: string;     // End-of-embed CTA
  input: DealInput;
  roiBenchmark: {
    paybackRange: string;
    savingsRange: string;
    primaryDriver: string;
  };
}

export interface DailyDeal {
  date: string;
  industry: DealProfile;
  quote: MCPQuoteResult;
  postedToDiscord: boolean;
  discordMessageId?: string;
  savedToSupabase: boolean;
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY ROTATION — 18 VERTICALS
// Representative inputs for a mid-sized site in each vertical.
// ZIP codes chosen for high-demand-charge utility territory.
// ─────────────────────────────────────────────────────────────

const INDUSTRIES: DealProfile[] = [
  // 0 — Car Wash
  {
    id: 'car-wash',
    label: 'Car Wash',
    emoji: '🚗',
    tagline: 'Kill the demand spike. Keep the tunnels running.',
    marketHook: 'Tunnel car washes draw 400–800 kW in burst loads — one of the highest demand-charge exposure profiles in commercial real estate.',
    painPoint: 'Demand charges from compressors & conveyor systems can represent 40–60% of the total electric bill.',
    ctaLine: 'Run a TrueQuote™ for your car wash portfolio → merlinpro.energy',
    input: { industry: 'car-wash',         peakDemandKw: 450,  monthlyBillDollars: 18000, zipCode: '33101', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '4–6 years', savingsRange: '$30K–$80K/yr', primaryDriver: 'demand charge reduction' },
  },
  // 1 — Hotel
  {
    id: 'hotel',
    label: 'Hotel',
    emoji: '🏨',
    tagline: 'Lower your energy bill. Raise your ESG score.',
    marketHook: 'Hotels face dual exposure: TOU arbitrage opportunity (high evening occupancy) + demand spikes from HVAC and laundry equipment.',
    painPoint: 'Peak HVAC & pool heating in summer drives demand charges up to $22/kW in coastal markets.',
    ctaLine: 'Get a hotel-specific BESS quote → merlinpro.energy',
    input: { industry: 'hotel',            peakDemandKw: 650,  monthlyBillDollars: 32000, zipCode: '90210', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '5–7 years', savingsRange: '$50K–$150K/yr', primaryDriver: 'demand charges + TOU arbitrage' },
  },
  // 2 — Data Center
  {
    id: 'data-center',
    label: 'Data Center',
    emoji: '🖥️',
    tagline: 'Backup power that also pays for itself.',
    marketHook: 'Hyperscalers commit to 24/7 CFE by 2030 — colocation and edge data centers are scrambling to catch up with on-site storage.',
    painPoint: 'Colocation facilities pay $25–35/kW in demand charges PLUS carry expensive diesel gen sets for backup.',
    ctaLine: 'Replace diesel with BESS — get your quote → merlinpro.energy',
    input: { industry: 'data-center',      peakDemandKw: 1800, monthlyBillDollars: 95000, zipCode: '20148', primaryUseCase: 'backup-power',   hasSolar: false },
    roiBenchmark: { paybackRange: '3–5 years', savingsRange: '$200K–$500K/yr', primaryDriver: 'demand charges + backup power replacement' },
  },
  // 3 — Hospital
  {
    id: 'hospital',
    label: 'Hospital',
    emoji: '🏥',
    tagline: 'Mission-critical uptime. BESS-backed resilience.',
    marketHook: 'CMS regulators are tightening backup power requirements. Hospitals face $1M+ penalties for grid outages. BESS satisfies both code AND economics.',
    painPoint: 'Large MRI, surgical suites, and HVAC create 2–4 MW demand spikes with near-zero tolerance for interruption.',
    ctaLine: 'BESS + backup power for healthcare → merlinpro.energy',
    input: { industry: 'hospital',         peakDemandKw: 2200, monthlyBillDollars: 110000, zipCode: '60601', primaryUseCase: 'backup-power',  hasSolar: true  },
    roiBenchmark: { paybackRange: '4–6 years', savingsRange: '$150K–$350K/yr', primaryDriver: 'demand charges + backup power avoidance' },
  },
  // 4 — Manufacturing
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    emoji: '🏭',
    tagline: 'Absorb motor startup spikes. Slash demand charges.',
    marketHook: 'Reshoring boom: US manufacturing floor space up 28% since 2022 — new plants are commissioning with BESS day one to avoid demand charge penalties.',
    painPoint: 'Motor startups, welding, and press operations create 1–5 ms demand spikes that set peak demand for the entire month.',
    ctaLine: 'Industrial BESS quote → merlinpro.energy',
    input: { industry: 'manufacturing',    peakDemandKw: 1400, monthlyBillDollars: 65000, zipCode: '43215', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '3–5 years', savingsRange: '$100K–$400K/yr', primaryDriver: 'demand charge from production equipment' },
  },
  // 5 — Restaurant / QSR
  {
    id: 'restaurant',
    label: 'Restaurant / QSR',
    emoji: '🍔',
    tagline: 'Lunch rush demand spikes are costing you. Stop it.',
    marketHook: 'National QSR chains are piloting BESS across 50-store portfolios to flatten demand and qualify for utility demand response incentives.',
    painPoint: 'Commercial kitchen equipment during lunch rush (11am–1pm) sets monthly peak demand for all 730 hours.',
    ctaLine: 'QSR energy optimization quote → merlinpro.energy',
    input: { industry: 'restaurant',       peakDemandKw: 120,  monthlyBillDollars: 6500,  zipCode: '77001', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '5–8 years', savingsRange: '$20K–$60K/yr', primaryDriver: 'demand charge from kitchen equipment' },
  },
  // 6 — Grocery
  {
    id: 'grocery',
    label: 'Grocery Store',
    emoji: '🛒',
    tagline: 'Refrigeration loads are relentless. Manage them.',
    marketHook: 'Grocery chains commit to net-zero refrigerants AND grid emissions — BESS sits at the intersection of both mandates.',
    painPoint: 'Refrigeration compressors run 24/7 — demand charges for grocery are among the highest $/sqft of any commercial building type.',
    ctaLine: 'Grocery BESS + solar quote → merlinpro.energy',
    input: { industry: 'grocery',          peakDemandKw: 400,  monthlyBillDollars: 22000, zipCode: '85001', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '4–7 years', savingsRange: '$40K–$100K/yr', primaryDriver: 'refrigeration demand charges' },
  },
  // 7 — Office Building
  {
    id: 'office',
    label: 'Office Building',
    emoji: '🏢',
    tagline: 'LEED score + lower opex. BESS does both.',
    marketHook: 'Return-to-office has stalled but HVAC must run for air quality compliance — landlords eat the demand charge bill regardless of occupancy.',
    painPoint: 'HVAC startup during morning ramp (7–9am) creates a demand spike that determines the monthly demand charge rate.',
    ctaLine: 'Commercial office BESS quote → merlinpro.energy',
    input: { industry: 'office',           peakDemandKw: 400,  monthlyBillDollars: 20000, zipCode: '10001', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '5–8 years', savingsRange: '$35K–$80K/yr', primaryDriver: 'HVAC demand charges' },
  },
  // 8 — EV Charging Hub
  {
    id: 'ev-charging',
    label: 'EV Charging Hub',
    emoji: '⚡',
    tagline: "Add 10 fast chargers. Don't upgrade your transformer.",
    marketHook: "NEVI grants are flooding the market — but utilities can't keep up. BESS lets EV hubs deploy fast without $500K transformer upgrades.",
    painPoint: 'Each 150 kW DC fast charger adds 150 kW to peak demand — 10 chargers = 1.5 MW demand spike on the utility.',
    ctaLine: 'EV charging hub BESS sizing → merlinpro.energy',
    input: { industry: 'ev-charging',      peakDemandKw: 1000, monthlyBillDollars: 55000, zipCode: '94102', primaryUseCase: 'ev-charging',   hasSolar: true  },
    roiBenchmark: { paybackRange: '4–6 years', savingsRange: '$80K–$180K/yr', primaryDriver: 'demand charges + transformer upgrade avoidance' },
  },
  // 9 — Warehouse
  {
    id: 'warehouse',
    label: 'Warehouse / Logistics',
    emoji: '📦',
    tagline: 'Dock door motors + EV forklifts = massive demand spikes.',
    marketHook: 'E-commerce fulfillment centers are electrifying their fleets — BESS absorbs the charging load and prevents demand charge explosions.',
    painPoint: 'Forklift charging during shift change creates sharp demand spikes that can triple the monthly demand charge.',
    ctaLine: 'Warehouse BESS quote → merlinpro.energy',
    input: { industry: 'warehouse',        peakDemandKw: 600,  monthlyBillDollars: 28000, zipCode: '45202', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '4–6 years', savingsRange: '$50K–$120K/yr', primaryDriver: 'fleet charging demand spikes' },
  },
  // 10 — School
  {
    id: 'school',
    label: 'School / University',
    emoji: '🎓',
    tagline: "Cafeteria + HVAC at 8am. It's expensive. Fix it.",
    marketHook: 'K-12 districts are combining Inflation Reduction Act direct-pay ITC (≥30%) with BESS to eliminate demand charges and teach clean energy.',
    painPoint: 'School buildings sit idle 40% of the year but pay demand charges based on peak days in June when AC is full blast.',
    ctaLine: 'K-12 / university BESS + solar quote → merlinpro.energy',
    input: { industry: 'school',           peakDemandKw: 280,  monthlyBillDollars: 12000, zipCode: '78201', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '4–7 years', savingsRange: '$25K–$70K/yr', primaryDriver: 'demand charges + direct-pay ITC' },
  },
  // 11 — Cannabis
  {
    id: 'cannabis',
    label: 'Cannabis Cultivation',
    emoji: '🌿',
    tagline: 'Grow lights run 18 hours. Your demand charge does too.',
    marketHook: 'Vertical cannabis farms pay 2–3x commercial rates in many states — BESS + solar is the #1 operating cost lever available.',
    painPoint: 'Indoor grow lighting creates flat, round-the-clock loads that generate massive demand charges without demand management.',
    ctaLine: 'Cannabis cultivation energy quote → merlinpro.energy',
    input: { industry: 'cannabis',         peakDemandKw: 420,  monthlyBillDollars: 35000, zipCode: '80203', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '3–5 years', savingsRange: '$60K–$150K/yr', primaryDriver: 'grow light demand charges at premium rates' },
  },
  // 12 — Fitness Center
  {
    id: 'fitness-center',
    label: 'Fitness Center',
    emoji: '💪',
    tagline: 'Peak hour = peak demand. BESS smooths both.',
    marketHook: 'National gym chains (Planet Fitness, Life Time) are rolling out BESS as a brand differentiator — "this gym runs on clean energy."',
    painPoint: 'After-work rush (5–8pm) runs HVAC, pools, saunas, and cardio equipment simultaneously — setting monthly peak demand.',
    ctaLine: 'Fitness center BESS + solar quote → merlinpro.energy',
    input: { industry: 'fitness-center',   peakDemandKw: 200,  monthlyBillDollars: 9000,  zipCode: '30301', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '5–7 years', savingsRange: '$18K–$45K/yr', primaryDriver: 'HVAC demand charges during peak hours' },
  },
  // 13 — Cold Storage
  {
    id: 'cold-storage',
    label: 'Cold Storage',
    emoji: '🧊',
    tagline: 'Compressors never stop. Demand charges never stop either.',
    marketHook: 'Food supply chain disruptions are pushing cold storage operators toward on-site backup power — BESS solves reliability AND economics.',
    painPoint: 'Refrigeration compressors are 24/7 base loads with defrost cycles creating sharp 15-minute demand spikes that set billing peak.',
    ctaLine: 'Cold storage BESS + resilience quote → merlinpro.energy',
    input: { industry: 'cold-storage',     peakDemandKw: 600,  monthlyBillDollars: 26000, zipCode: '35201', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '4–7 years', savingsRange: '$45K–$100K/yr', primaryDriver: 'refrigeration demand charges' },
  },
  // 14 — Brewery
  {
    id: 'brewery',
    label: 'Brewery',
    emoji: '🍺',
    tagline: 'Brew day demand spikes are killing your margins.',
    marketHook: 'Craft breweries are energy-intensive at small scale — BESS enables them to compete with larger operations on operating cost.',
    painPoint: 'Mash tun heating and chilling equipment on brew day creates demand spikes 3–5x normal baseline.',
    ctaLine: 'Brewery energy optimization quote → merlinpro.energy',
    input: { industry: 'brewery',          peakDemandKw: 180,  monthlyBillDollars: 8000,  zipCode: '97201', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '5–8 years', savingsRange: '$15K–$40K/yr', primaryDriver: 'demand spikes on brew days' },
  },
  // 15 — Laundry
  {
    id: 'laundry',
    label: 'Laundromat / Commercial Laundry',
    emoji: '👕',
    tagline: 'Industrial washers are demand charge machines.',
    marketHook: 'Commercial laundry operators with 50+ machine facilities are adopting BESS to qualify for utility demand response programs worth $5K–$30K/year.',
    painPoint: 'Industrial washers draw 15–20 kW each — 40 machines starting simultaneously hits 600–800 kW for seconds that set monthly peak.',
    ctaLine: 'Commercial laundry BESS quote → merlinpro.energy',
    input: { industry: 'laundry',          peakDemandKw: 280,  monthlyBillDollars: 11000, zipCode: '60290', primaryUseCase: 'peak-shaving',  hasSolar: false },
    roiBenchmark: { paybackRange: '5–8 years', savingsRange: '$20K–$55K/yr', primaryDriver: 'demand charges from washer motor startups' },
  },
  // 16 — Parking Garage
  {
    id: 'parking',
    label: 'Parking Garage',
    emoji: '🅿️',
    tagline: 'Add EV charging. Skip the transformer upgrade.',
    marketHook: 'Cities are mandating EV-ready parking — BESS lets operators deploy Level 2 + DCFC charging without hitting utility demand charge penalties.',
    painPoint: 'Parking garages have very low base loads but new EV mandates create sudden 200–500 kW demand spikes from charging.',
    ctaLine: 'EV-ready parking garage BESS quote → merlinpro.energy',
    input: { industry: 'parking',          peakDemandKw: 400,  monthlyBillDollars: 18000, zipCode: '10001', primaryUseCase: 'ev-charging',   hasSolar: false },
    roiBenchmark: { paybackRange: '5–8 years', savingsRange: '$30K–$80K/yr', primaryDriver: 'EV charging demand management' },
  },
  // 17 — Retail / Big Box
  {
    id: 'retail',
    label: 'Retail / Big Box',
    emoji: '🛍️',
    tagline: 'Black Friday demand charges last all year.',
    marketHook: 'Retail ESG mandates are driving chains to commit to 100% clean energy — BESS + rooftop solar is the fastest path for big-box stores.',
    painPoint: "HVAC, lighting, and refrigeration in retail creates a consistent peak that's hard to shed without affecting customer experience.",
    ctaLine: 'Retail chain BESS + solar quote → merlinpro.energy',
    input: { industry: 'retail',           peakDemandKw: 450,  monthlyBillDollars: 21000, zipCode: '85001', primaryUseCase: 'peak-shaving',  hasSolar: true  },
    roiBenchmark: { paybackRange: '4–6 years', savingsRange: '$40K–$100K/yr', primaryDriver: 'HVAC + refrigeration demand charges' },
  },
];

// ─────────────────────────────────────────────────────────────
// DEAL SELECTION
// ─────────────────────────────────────────────────────────────

/** Pick today's industry by rotating via day-of-year */
function getTodayIndustry(): DealProfile {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return INDUSTRIES[dayOfYear % INDUSTRIES.length];
}

/** Format dollar amounts */
function usd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

// ─────────────────────────────────────────────────────────────
// DISCORD WEBHOOK PAYLOAD
// ─────────────────────────────────────────────────────────────

function buildDiscordPayload(deal: DealProfile, quote: MCPQuoteResult, dateStr: string): object {
  const rec = quote.recommendation;
  const fin = quote.financials;
  const sizeMW  = rec.systemSizeMW;
  const dur     = rec.durationHours;
  const kWh     = Math.round(sizeMW * 1000 * dur);
  const itcPct  = fin.itcPercentage ? `${Math.round(fin.itcPercentage * 100)}%` : '30%';
  const irrVal  = typeof fin.irrEstimate === 'number'
    ? `${(fin.irrEstimate * 100).toFixed(1)}%`
    : String(fin.irrEstimate);

  const hasSolar = deal.input.hasSolar;
  const systemDesc = hasSolar
    ? `${sizeMW} MW BESS · ${kWh.toLocaleString()} kWh · ${dur}h duration + solar`
    : `${sizeMW} MW BESS · ${kWh.toLocaleString()} kWh · ${dur}h duration`;

  return {
    embeds: [
      {
        title: `${deal.emoji} Deal of the Day — ${deal.label}`,
        description: `**${deal.tagline}**\n\n${deal.marketHook}`,
        color: 0xF97316, // Merlin orange
        fields: [
          // Quote financials
          { name: '📐 System',           value: systemDesc,                                    inline: false },
          { name: '💰 Gross Cost',       value: usd(fin.totalInstalledCost),                   inline: true  },
          { name: `🏛️ After ITC (${itcPct})`, value: usd(fin.netCostAfterITC),               inline: true  },
          { name: '📈 Annual Savings',   value: usd(fin.annualSavings),                        inline: true  },
          { name: '⏱️ Payback',          value: `${fin.simplePayback} years`,                  inline: true  },
          { name: '📊 NPV (25yr)',       value: usd(fin.npv25Year),                            inline: true  },
          { name: '📉 IRR',              value: irrVal,                                        inline: true  },
          ...(fin.co2AvoidedTonsPerYear
            ? [{ name: '🌱 CO₂ Avoided', value: `${fin.co2AvoidedTonsPerYear.toLocaleString()} tons/yr`, inline: true }]
            : []),
          // Benchmark context
          { name: '📋 Industry Range',
            value: `Payback: **${deal.roiBenchmark.paybackRange}** · Savings: **${deal.roiBenchmark.savingsRange}**`,
            inline: false },
          { name: '🔍 Primary Driver',   value: deal.painPoint,                                inline: false },
          // CTA
          { name: '🚀 Take Action',      value: deal.ctaLine,                                  inline: false },
        ],
        footer: {
          text: `Merlin TrueQuote™ · ${dateStr} · NREL ATB 2024 benchmark-backed · merlinpro.energy`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// POST TO DISCORD
// ─────────────────────────────────────────────────────────────

async function postToDiscord(payload: object): Promise<string | null> {
  if (process.env.DRY_RUN === 'true') {
    console.log('   🔵 [DRY RUN] Discord post skipped — payload logged to console');
    console.log(JSON.stringify(payload, null, 2));
    return 'dry-run-discord';
  }

  // Prefer a dedicated daily-deal webhook; fall back to lead webhook
  const webhookUrl = process.env.DISCORD_DAILY_DEAL_WEBHOOK_URL
    ?? process.env.DISCORD_LEAD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[DailyDeal] No Discord webhook URL set — skipping post.');
    return null;
  }

  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(`[DailyDeal] Webhook failed: ${res.status} ${await res.text()}`);
    return null;
  }

  const data = await res.json() as { id?: string };
  return data.id ?? null;
}

// ─────────────────────────────────────────────────────────────
// SAVE TO SUPABASE
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// LINKEDIN POST GENERATOR
// ─────────────────────────────────────────────────────────────

function generateLinkedInPost(deal: DealProfile, quote: MCPQuoteResult, _dateStr: string): string {
  const fin = quote.financials;
  const rec = quote.recommendation;
  const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  const itc = fin.totalInstalledCost - fin.netCostAfterITC;
  const tag = deal.label.replace(/[^A-Za-z]/g, '');

  return [
    `${deal.emoji} Deal of the Day: ${deal.label}`,
    ``,
    `"${deal.tagline}"`,
    ``,
    deal.marketHook,
    ``,
    `📊 Today's TrueQuote™ numbers:`,
    `• System: ${rec.systemSizeMW} MW · ${rec.durationHours}h battery storage`,
    `• Gross installed cost: ${fmt(fin.totalInstalledCost)}`,
    `• After federal ITC (${fin.itcPercentage ?? 30}%): ${fmt(fin.netCostAfterITC)} — saving ${fmt(itc)}`,
    `• Annual savings: ${fmt(fin.annualSavings)}`,
    `• Payback period: ${fin.simplePayback} years`,
    `• 25-year NPV: ${fmt(fin.npv25Year)}`,
    ``,
    `Every day we feature a new industry vertical. Every number is calculated live`,
    `using NREL data, DOE frameworks, and actual utility rates for that ZIP code.`,
    `No estimates. No guesswork. Just math.`,
    ``,
    `Run your own TrueQuote™ in 5 minutes → merlinpro.energy`,
    ``,
    `#EnergyStorage #BESS #BatteryStorage #CleanEnergy #${tag} #DemandCharges #MerlinEnergy #TrueQuote`,
  ].join('\n');
}

async function postToLinkedIn(postText: string): Promise<string | null> {
  if (process.env.DRY_RUN === 'true') {
    console.log('   🔵 [DRY RUN] LinkedIn post skipped — copy logged below:');
    console.log(postText);
    return 'dry-run-linkedin';
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  // LINKEDIN_ORG_URN  → posts to Merlin Energy company page (e.g. urn:li:organization:12345)
  // LINKEDIN_PERSON_URN → posts to personal profile (e.g. urn:li:person:ABC123)
  // Set LINKEDIN_ORG_URN (+ token with w_organization_social scope) to post as the company.
  const authorUrn = process.env.LINKEDIN_ORG_URN ?? process.env.LINKEDIN_PERSON_URN;

  if (!accessToken || !authorUrn) {
    console.warn('   ⚠️  LinkedIn not configured — set LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORG_URN (company page) or LINKEDIN_PERSON_URN (personal profile)');
    return null;
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: postText },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[DailyDeal] LinkedIn post failed:', res.status, err.slice(0, 200));
    return null;
  }

  const postId = res.headers.get('x-restli-id') ?? 'posted';
  return postId;
}

async function saveDealToSupabase(deal: DealProfile, quote: MCPQuoteResult, dateStr: string, messageId: string | null, linkedInPost: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[DailyDeal] Supabase credentials not set — skipping save.');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const fin = quote.financials;
  const rec = quote.recommendation;

  const row = {
    deal_date:            dateStr,
    industry_id:          deal.id,
    industry_label:       deal.label,
    system_size_mw:       rec.systemSizeMW,
    duration_hours:       rec.durationHours,
    solar_mw:             deal.input.hasSolar ? 0.3 : 0,
    zip_code:             deal.input.zipCode,
    gross_cost_dollars:   Math.round(fin.totalInstalledCost),
    net_cost_dollars:     Math.round(fin.netCostAfterITC),
    annual_savings:       Math.round(fin.annualSavings),
    payback_years:        fin.simplePayback,
    npv_25yr:             Math.round(fin.npv25Year),
    irr:                  typeof fin.irrEstimate === 'number' ? fin.irrEstimate : null,
    discord_message_id:   messageId,
    tagline:              deal.tagline,
    market_hook:          deal.marketHook,
    linkedin_post:        linkedInPost,
    quote_json:           JSON.stringify(quote),
  };

  const { error } = await supabase
    .from('daily_deals')
    .upsert(row, { onConflict: 'deal_date,industry_id' });

  if (error) {
    console.error('[DailyDeal] Supabase upsert failed:', error.message);
    return false;
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// MAIN ORCHESTRATOR
// ─────────────────────────────────────────────────────────────

export async function runDailyDeal(overrideIndustryId?: string): Promise<DailyDeal> {
  const dateStr = new Date().toISOString().split('T')[0];
  const startMs = Date.now();

  // Select industry
  const industry = overrideIndustryId
    ? (INDUSTRIES.find(i => i.id === overrideIndustryId) ?? getTodayIndustry())
    : getTodayIndustry();

  console.log(`\n${'─'.repeat(55)}`);
  console.log(`⚡ MERLIN DAILY DEAL — ${dateStr}`);
  console.log(`   Industry: ${industry.emoji} ${industry.label}`);
  console.log(`   ZIP: ${industry.input.zipCode} | Peak: ${industry.input.peakDemandKw} kW | Bill: $${industry.input.monthlyBillDollars}/mo`);
  console.log(`${'─'.repeat(55)}`);

  // Call MCP generate_truequote tool
  console.log('   🔄 Calling TrueQuote™ via MCP...');
  const raw = await callTool('generate_truequote', {
    industry:           industry.input.industry,
    peakDemandKw:       industry.input.peakDemandKw,
    monthlyBillDollars: industry.input.monthlyBillDollars,
    zipCode:            industry.input.zipCode,
    primaryUseCase:     industry.input.primaryUseCase,
    hasSolar:           industry.input.hasSolar,
  }) as MCPQuoteResult;

  const quote = raw;
  const fin = quote.financials;
  const rec = quote.recommendation;

  console.log(`   ✅ Quote complete in ${Date.now() - startMs}ms`);
  console.log(`      System: ${rec.systemSizeMW} MW · ${rec.durationHours}h`);
  console.log(`      Cost: ${usd(fin.totalInstalledCost)} gross → ${usd(fin.netCostAfterITC)} after ITC`);
  console.log(`      Savings: ${usd(fin.annualSavings)}/yr · ${fin.simplePayback}yr payback · NPV ${usd(fin.npv25Year)}`);

  // Build and post Discord embed
  const payload = buildDiscordPayload(industry, quote, dateStr);
  console.log('   📤 Posting to Discord...');
  const messageId = await postToDiscord(payload);
  const postedToDiscord = messageId !== null;
  if (postedToDiscord) {
    console.log(`   ✅ Posted to Discord (message ID: ${messageId})`);
  } else {
    console.log('   ⚠️  Discord post skipped or failed');
  }

  // Generate LinkedIn post copy
  const linkedInPost = generateLinkedInPost(industry, quote, dateStr);
  console.log('   💼 Posting to LinkedIn...');
  const linkedInId = await postToLinkedIn(linkedInPost);
  if (linkedInId) {
    console.log(`   ✅ Posted to LinkedIn (ID: ${linkedInId})`);
  } else {
    console.log('   ⚠️  LinkedIn post skipped or failed (configure LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN)');
  }

  // Save to Supabase
  console.log('   💾 Saving to Supabase...');
  const savedToSupabase = await saveDealToSupabase(industry, quote, dateStr, messageId, linkedInPost);
  if (savedToSupabase) {
    console.log('   ✅ Saved to Supabase daily_deals table');
  } else {
    console.log('   ⚠️  Supabase save skipped or failed');
  }

  const deal: DailyDeal = {
    date: dateStr,
    industry,
    quote,
    postedToDiscord,
    discordMessageId: messageId ?? undefined,
    savedToSupabase,
  };

  console.log(`${'─'.repeat(55)}`);
  console.log(`🏁 Daily deal complete in ${Date.now() - startMs}ms`);

  return deal;
}

// ─────────────────────────────────────────────────────────────
// STANDALONE ENTRY POINT
// Run: npx tsx agents/daily-deal.ts
// Run specific industry: DAILY_DEAL_INDUSTRY=hotel npx tsx agents/daily-deal.ts
// ─────────────────────────────────────────────────────────────

const isMain = process.argv[1]?.endsWith('daily-deal.ts')
  || process.argv[1]?.endsWith('daily-deal.js');

if (isMain) {
  const overrideId = process.env.DAILY_DEAL_INDUSTRY;
  runDailyDeal(overrideId)
    .then((deal) => {
      console.log(`\nResult: ${deal.postedToDiscord ? '✅ Posted' : '⚠️  Not posted'} to Discord | ${deal.savedToSupabase ? '✅ Saved' : '⚠️  Not saved'} to Supabase`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DailyDeal] Fatal error:', err);
      process.exit(1);
    });
}

