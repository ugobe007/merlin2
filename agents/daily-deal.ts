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
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { TwitterApi } from 'twitter-api-v2';

// ─────────────────────────────────────────────────────────────
// MCP CLIENT — calls the live Railway MCP server via plain fetch
// No SDK required — Railway speaks JSON-RPC over HTTP POST
// ─────────────────────────────────────────────────────────────

const RAILWAY_MCP = 'https://merlin-mcp-agent-production.up.railway.app/mcp';

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(RAILWAY_MCP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MCP call failed: ${res.status} ${err.slice(0, 200)}`);
  }

  // Railway may return SSE (text/event-stream) or plain JSON
  const contentType = res.headers.get('content-type') ?? '';
  let body: string;

  if (contentType.includes('text/event-stream')) {
    // Read SSE stream and grab the first data: line
    body = await res.text();
    const dataLine = body.split('\n').find(l => l.startsWith('data:'));
    if (!dataLine) throw new Error('MCP SSE response had no data line');
    body = dataLine.slice(5).trim();
  } else {
    body = await res.text();
  }

  const json = JSON.parse(body) as { result?: { content?: Array<{ type: string; text: string }> }; error?: { message: string } };
  if (json.error) throw new Error(`MCP error: ${json.error.message}`);

  const text = json.result?.content?.[0]?.text;
  return text ? JSON.parse(text) : json.result;
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
  postedToX: boolean;
  xTweetId?: string;
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
    input: { industry: 'data-center',      peakDemandKw: 1800, monthlyBillDollars: 95000, zipCode: '20148', primaryUseCase: 'peak-shaving',   hasSolar: false },
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
    input: { industry: 'hospital',         peakDemandKw: 2200, monthlyBillDollars: 110000, zipCode: '60601', primaryUseCase: 'peak-shaving',  hasSolar: true  },
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
// CONTENT DATA — fun facts + ZIP→state lookup
// ─────────────────────────────────────────────────────────────

/**
 * Surprising / curiosity-triggering fact for each industry.
 * Leads every LinkedIn post and Discord embed — replaces dry openers
 * with something a reader actually wants to share.
 */
const FUN_FACTS: Record<string, string> = {
  'car-wash':       'A single high-volume tunnel car wash uses more electricity in a day than 40 average American homes — mostly from compressors and conveyor motors that spike hardest during rush hour.',
  'hotel':          'Hotels use 50% more energy per square foot than office buildings — yet most of that cost is driven by a handful of peak HVAC moments, not continuous base load. One bad August afternoon sets your rate for the month.',
  'data-center':    'Global data centers now consume more electricity than the entire United Kingdom. That number doubles roughly every four years — and enterprise tenants are starting to demand 24/7 clean-energy certificates to prove it isn\'t coal.',
  'hospital':       'The average US hospital spends $680,000/year on electricity alone — more than most facilities spend on medical equipment maintenance. And that bill is mostly set by peak surgical hours, not round-the-clock base load.',
  'manufacturing':  'US manufacturers collectively pay $110 billion in electricity bills annually. A single motor startup lasts milliseconds — but that millisecond can set your billing peak for 730 hours. The utility is not sorry about it.',
  'restaurant':     'A commercial kitchen uses 5× more energy per square foot than any other commercial space — and up to 80% of that energy escapes as heat. The fryers and ovens driving the lunch rush are also setting your utility bill for the month.',
  'grocery':        'The refrigeration system in a single large supermarket runs 24/7/365 and consumes enough electricity to power roughly 1,000 average homes. It never sleeps — and the utility charges peak rates for the moments it works hardest.',
  'office':         'US office buildings are physically empty — lights off, HVAC minimal — about 65% of the time. Yet demand charges are set by the peak occupancy moment, not the average. You\'re paying full freight for a building that\'s dark most of the week.',
  'ev-charging':    'Adding 10 × 150 kW DC fast chargers to a parking lot is the electrical equivalent of plugging in a small factory. Most utility transformers serving US parking structures were designed in the 1980s and were not built for this.',
  'warehouse':      'At peak shift-change, a large e-commerce fulfillment center charging its electric forklift fleet can draw enough power to run a small town. The spike lasts 20 minutes. The demand charge bill lasts all month.',
  'school':         'US K-12 schools spend $8 billion on energy every year — more than on textbooks and school supplies combined. Most of that bill is determined by a handful of hot June days when the AC runs full blast and the building is half-empty.',
  'cannabis':       'Indoor cannabis cultivation uses roughly 1% of all US electricity — the same as 1.7 million homes — mostly for grow lighting running 18 hours a day. It\'s one of the most energy-intensive agricultural operations per square foot on earth.',
  'fitness-center': 'A single commercial treadmill uses as much electricity as 3 refrigerators. The average gym has 80+ of them, all running simultaneously during the after-work rush — the exact moment when utility demand rates are highest.',
  'cold-storage':   'The global cold chain consumes more energy than commercial aviation. Here in the US, cold storage operators pay some of the highest energy costs per square foot of any building type — mostly from compressor demand spikes.',
  'brewery':        'Brewing a single barrel of craft beer requires enough electricity to run a home for nearly two days — mostly for heating the mash tun and crash-cooling fermentation tanks. On brew days, a craft brewery\'s load profile looks like a small factory.',
  'laundry':        'When 40 industrial washing machines start simultaneously at shift change, the demand spike lasts seconds — but sets the billing peak for 730 hours. The utility measures it in real time. Most operators have no idea it\'s happening.',
  'parking':        'US surface parking lots cover more land area than the entire state of Connecticut. Cities are mandating EV charging in all of them — and almost no transformer serving a parking structure was designed for that load.',
  'retail':         'Walmart\'s annual electricity bill is approximately $1 billion — making it one of the top utility customers in the United States. Your regional big-box neighbors have the same cost structure, just at smaller scale. And the same fix applies.',
};

/** Resolve a ZIP code to a 2-letter state abbreviation for post context */
const ZIP_STATE: Record<string, string> = {
  '33101': 'FL', '90210': 'CA', '20148': 'VA', '60601': 'IL', '43215': 'OH',
  '77001': 'TX', '85001': 'AZ', '10001': 'NY', '94102': 'CA', '45202': 'OH',
  '78201': 'TX', '80203': 'CO', '30301': 'GA', '35201': 'AL', '97201': 'OR',
  '60290': 'IL',
};
function zipToState(zip: string): string { return ZIP_STATE[zip] ?? 'US'; }

/**
 * Global energy stories — curious, human, surprising.
 * One of these rotates into every LinkedIn post and Discord embed.
 * Not about selling. About being worth following.
 */
const WORLD_FACTS: string[] = [
  '🌍 The entire island of El Hierro in Spain\'s Canary Islands runs on 100% renewable energy — a mix of wind and pumped hydro. When the wind blows hard, they pump water uphill. When it\'s calm, they let it fall back down through turbines. Engineering as patience.',
  '☀️ The Ouarzazate Solar Power Station in Morocco — one of the largest concentrated solar plants on earth — powers over 1 million homes and exports electricity north into Europe. It sits in the Sahara, which receives more solar energy in 6 hours than humanity uses in a year.',
  '🌋 Iceland heats 90% of its homes with geothermal energy pulled directly from volcanic rock beneath the island. Their average household heating bill is a fraction of what comparable Nordic countries pay. The volcano is the utility.',
  '💧 Norway generates 98% of its electricity from hydropower — and exports the surplus to Germany, the Netherlands, and the UK via undersea cables. When European wind drops, Norway\'s fjords are the backup battery.',
  '🏘️ In 2014, the village of Dharnai in Bihar, India became the first village in the country to run entirely on solar power — ending 30 years of energy poverty without a single grid connection. The villagers now sell excess power back to neighboring towns.',
  '🌬️ Denmark generates more electricity from wind than its citizens consume — regularly hitting 100%+ wind penetration. On the windiest days, they export power to Sweden and Germany at negative prices, paying neighbors to take it.',
  '🏔️ Bhutan is one of the only carbon-negative countries on earth. It generates far more clean hydropower than it needs, exports the surplus to India, and uses the revenue to fund free healthcare and education. Its constitution requires 60% forest cover — forever.',
  '🌊 Tidal turbines installed in the Bay of Fundy, Canada — where tides swing 16 meters, the highest in the world — generate predictable, clockwork electricity twice a day, every day, regardless of weather. The ocean is more reliable than the sun.',
  '⚡ South Australia, once notorious for blackouts, installed the Tesla Hornsdale Power Reserve in 2017 — the world\'s largest lithium-ion battery at the time. It responded to grid frequency events 100× faster than traditional gas peakers and saved the state $150M in its first two years.',
  '🚢 The MS Roald Amundsen — a Norwegian expedition ship — is the world\'s first hybrid electric cruise vessel capable of sailing through Arctic ice on battery power alone, in complete silence, without disturbing wildlife.',
  '🌿 Rwanda produces biogas from methane naturally released by Lake Kivu — a deep volcanic lake — and pipes it to homes and industries nearby. The lake holds enough dissolved gas to power the country for decades. They\'re essentially mining an underground swamp.',
  '🏗️ The Three Gorges Dam in China produces more electricity annually than any structure ever built by humans — 88.2 billion kWh in 2020 alone. That\'s enough to power New York City for 8 years straight.',
  '🐄 In rural India, thousands of villages run on biogas produced from cow dung collected in community digesters. A single family\'s three cows can produce enough gas for cooking and lighting — replacing kerosene, cutting indoor air pollution, and leaving rich fertilizer as a byproduct.',
  '🌞 The Cochin International Airport in Kerala, India was the world\'s first airport to run entirely on solar power — 46,000 panels on the roof and surrounding land. It became carbon-neutral in 2015 and now earns money selling surplus power back to the grid.',
  '🏝️ The Tokelau Islands in the South Pacific — population 1,500, middle of the ocean — became the first nation in the world to run 100% on solar and coconut oil biodiesel. They ripped out their diesel generators in 2012 and never looked back.',
  '🌬️ Inner Mongolia in China hosts the world\'s largest single wind farm — Gansu Wind Farm — a cluster of turbines so vast it can be seen from space. On a good day it generates more power than some small countries consume in a week.',
  '🔋 In 2017, the German Energiewende produced so much wind and solar on a sunny spring Sunday that electricity prices went negative for several hours. Power companies literally paid industrial customers to use electricity so the grid wouldn\'t destabilize.',
  '🌡️ Kenya derives over 75% of its electricity from geothermal, hydro, and wind — one of the cleanest electricity mixes on the continent. The Olkaria Geothermal Plant in the Rift Valley has been running since 1981 and keeps expanding. Turns out sitting on a continental rift is a competitive advantage.',
  '🌊 Portugal ran on 100% renewable electricity — wind, solar, and hydro — for six consecutive days in 2016. No coal, no gas, no nuclear. The lights stayed on. They\'ve been pushing the record further ever since.',
  '🚆 Piezoelectric tiles installed under turnstiles at Tokyo\'s Shibuya train station generate electricity from footsteps — 400,000 commuters per day compress the tiles, and the energy lights the station\'s displays. The commute literally powers the commute.',
  '☀️ The Atacama Desert in Chile has the highest solar irradiance measured anywhere on earth — panels there produce 50% more electricity per year than the same panel installed in Germany. Chile is now building solar plants to export hydrogen to Asia.',
  '🏙️ Masdar City in Abu Dhabi was designed from scratch as a zero-carbon, zero-waste city in the middle of the desert. It runs on rooftop solar, wind towers that cool streets without AC, and a driverless electric pod transit system operating entirely underground.',
  '🐟 Off the coast of Scotland, tidal stream turbines anchored to the seabed spin silently in the current of the Pentland Firth — one of the fastest tidal channels on earth. Marine biologists report fish schooling around the turbine bases. The reef effect was not planned.',
  '💡 Bangladesh has installed over 6 million solar home systems in rural areas — more off-grid solar installations than any other country. Villages that had no electricity 15 years ago now charge phones, run small businesses, and have evening study hours for children.',
  '🌏 Costa Rica ran on 100% renewable electricity for over 300 days in 2019 — mostly hydro, with wind and geothermal filling gaps. They\'ve been powered almost entirely by renewables since 2014. Population: 5 million. Deforestation reversed. Tourists doubled.',
  '⛽ Uruguay transformed its electricity grid from 27% renewable to 95% renewable in just 10 years — without nuclear, without massive subsidies, and while keeping prices lower than the regional average. The government just removed the monopoly and let wind developers compete.',
  '🌅 Floating solar panels installed on reservoirs in India\'s Rajasthan state do two useful things simultaneously: they generate electricity AND they reduce evaporation from the reservoir below by up to 30%. One installation. Two problems solved.',
  '🏔️ Nepal\'s micro-hydro program has brought electricity to hundreds of mountain villages unreachable by the national grid — using small rivers, bamboo pipes, and turbines small enough to carry on foot up a Himalayan trail. Energy infrastructure that fits in a backpack.',
  '🔆 Saudi Arabia — historically 100% fossil fuels — is now building Al-Ula Solar, one of the largest solar projects on earth, in a region that gets 9+ hours of full sun daily. Even oil states are reading the same math everyone else is.',
  '🌿 The small Pacific island nation of Tonga generates electricity from coconut shells. The shells are gasified in a small reactor, the gas runs a generator, and the ash becomes fertilizer. Nothing is wasted. The entire energy system fits inside a shipping container.',
];

/** Pick a world fact by day-of-year so it rotates daily */
function pickWorldFact(dayOfYear: number): string {
  return WORLD_FACTS[dayOfYear % WORLD_FACTS.length];
}

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

  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const worldFact = pickWorldFact(dayOfYear);

  return {
    embeds: [
      {
        title: `${deal.emoji} Deal of the Day — ${deal.label}`,
        description: `**${deal.tagline}**\n\n${deal.marketHook}`,
        color: 0xF97316, // Merlin orange
        fields: [
          // Curiosity hook — leads the embed
          { name: '💡 Did You Know?',    value: FUN_FACTS[deal.id] ?? deal.marketHook,          inline: false },
          // Global energy story of the day
          { name: '🌍 Energy Around the World', value: worldFact,                              inline: false },
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

  // Allow soft-disable without removing the webhook URL
  // Set DISCORD_POSTING_ENABLED=false to pause Discord posts
  if (process.env.DISCORD_POSTING_ENABLED === 'false') {
    console.log('   ⏸️  Discord posting is disabled (DISCORD_POSTING_ENABLED=false) — skipping.');
    return null;
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

function generateLinkedInPost(deal: DealProfile, quote: MCPQuoteResult, dateStr: string): string {
  const fin  = quote.financials;
  const rec  = quote.recommendation;
  const fmt  = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  const itc  = fin.totalInstalledCost - fin.netCostAfterITC;
  const itcPct = fin.itcPercentage ? Math.round(fin.itcPercentage * 100) : 30;
  const tag  = deal.label.replace(/[^A-Za-z]/g, '');
  const state = zipToState(deal.input.zipCode);
  const fact  = FUN_FACTS[deal.id] ?? deal.marketHook;

  // Rotate across 4 post formats by day-of-year so the feed stays fresh
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const template = day % 4;

  const sys  = deal.input.hasSolar
    ? `${rec.systemSizeMW} MW BESS · ${rec.durationHours}h + solar`
    : `${rec.systemSizeMW} MW BESS · ${rec.durationHours}h`;

  const nums = [
    `• System: ${sys}`,
    `• Cost: ${fmt(fin.totalInstalledCost)} → ${fmt(fin.netCostAfterITC)} after ${itcPct}% ITC (saves ${fmt(itc)})`,
    `• Annual savings: ${fmt(fin.annualSavings)}`,
    `• Payback: ${fin.simplePayback} yrs · 25-yr NPV: ${fmt(fin.npv25Year)}`,
  ].join('\n');

  const tags = `#EnergyStorage #BESS #${tag} #CleanEnergy #DemandCharges #MerlinEnergy`;

  // ── Template A: Fun fact first, then numbers ──────────────────
  if (template === 0) {
    return [
      `${deal.emoji} Here's something most people in ${deal.label.toLowerCase()} don't know:`,
      ``,
      fact,
      ``,
      deal.marketHook,
      ``,
      `So what does the fix actually cost? We ran the numbers.`,
      ``,
      `Merlin TrueQuote™ · ${deal.label} · ${state} · ${dateStr}`,
      nums,
      ``,
      `Every figure is calculated live — NREL data, real utility rates for that ZIP, no filler.`,
      ``,
      deal.ctaLine,
      ``,
      tags,
    ].join('\n');
  }

  // ── Template B: Pain-first, rhetorical opener ─────────────────
  if (template === 1) {
    return [
      `${deal.emoji} Quick question for every ${deal.label} operator reading this:`,
      ``,
      `How much of your electric bill is demand charges?`,
      ``,
      `For most, it's 30–50% — and it's determined by a single peak moment, not your average usage.`,
      ``,
      fact,
      ``,
      `Here's what a BESS-forward strategy looks like in practice:`,
      ``,
      nums,
      ``,
      `${deal.painPoint}`,
      ``,
      deal.ctaLine,
      ``,
      tags,
    ].join('\n');
  }

  // ── Template C: Global → local hook, numbers as proof ────────
  if (template === 2) {
    return [
      `${deal.emoji} ${deal.tagline}`,
      ``,
      fact,
      ``,
      `${deal.marketHook}`,
      ``,
      `Here's the math for a representative ${deal.label} in ${state}:`,
      ``,
      nums,
      ``,
      `No estimates. No vendor markups baked in. Just NREL benchmark data`,
      `and real utility rates for that ZIP — calculated fresh this morning.`,
      ``,
      deal.ctaLine,
      ``,
      tags,
    ].join('\n');
  }

  // ── Template D: World energy story first, US industry tie-in second ──
  const worldFact = pickWorldFact(day);

  return [
    `🌍 Energy story of the day:`,
    ``,
    worldFact,
    ``,
    `---`,
    ``,
    `The same physics applies here at home.`,
    ``,
    `${deal.emoji} Today's vertical: ${deal.label} in ${state}`,
    ``,
    fact,
    ``,
    `The numbers for a site like yours:`,
    nums,
    ``,
    deal.ctaLine,
    ``,
    `#EnergyStorage #GlobalEnergy #CleanEnergy #${tag} #BESS #MerlinEnergy`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// X (TWITTER) — @Merlin_Energy
// ─────────────────────────────────────────────────────────────

/**
 * Build a 3-tweet thread for X. Each tweet ≤ 280 chars.
 *
 * Tweet 1: Hook — world fact or industry fact (alternates daily)
 * Tweet 2: The numbers — tight, scannable
 * Tweet 3: CTA + hashtags → merlinpro.energy
 */
function generateXThread(deal: DealProfile, quote: MCPQuoteResult): string[] {
  const fin  = quote.financials;
  const rec  = quote.recommendation;
  const fmt  = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
  const day  = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const state = zipToState(deal.input.zipCode);
  const tag  = deal.label.replace(/[^A-Za-z]/g, '');

  // Alternate: even days = world fact hook, odd days = industry fact hook
  const rawFact = day % 2 === 0 ? pickWorldFact(day) : (FUN_FACTS[deal.id] ?? deal.marketHook);
  // Trim to 270 chars max for tweet 1 (leave room for punctuation)
  const hook = rawFact.length > 270 ? rawFact.slice(0, 267) + '...' : rawFact;

  const sys = deal.input.hasSolar
    ? `${rec.systemSizeMW} MW BESS + solar · ${rec.durationHours}h`
    : `${rec.systemSizeMW} MW BESS · ${rec.durationHours}h`;

  const tweet2 = [
    `${deal.emoji} ${deal.label} · ${state} — what the math looks like:`,
    ``,
    `System: ${sys}`,
    `After ITC: ${fmt(fin.netCostAfterITC)}`,
    `Annual savings: ${fmt(fin.annualSavings)}`,
    `Payback: ${fin.simplePayback} yrs  ·  NPV: ${fmt(fin.npv25Year)}`,
  ].join('\n');

  const tweet3 = `Every number is calculated live — NREL data, real utility rates for that ZIP. No vendor estimates.\n\nRun yours free → merlinpro.energy\n\n#BESS #CleanEnergy #${tag} #MerlinEnergy`;

  return [hook, tweet2, tweet3];
}

/**
 * Post a tweet thread to @Merlin_Energy using OAuth 1.0a.
 *
 * Required env vars (from developer.x.com → your app → Keys & Tokens):
 *   X_API_KEY        — API Key (Consumer Key)
 *   X_API_SECRET     — API Key Secret (Consumer Secret)
 *   X_ACCESS_TOKEN   — Access Token for @Merlin_Energy
 *   X_ACCESS_SECRET  — Access Token Secret for @Merlin_Energy
 */
async function postToX(thread: string[]): Promise<string | null> {
  if (process.env.DRY_RUN === 'true') {
    console.log('   🔵 [DRY RUN] X thread skipped — copy logged below:');
    thread.forEach((t, i) => console.log(`\n--- Tweet ${i + 1} ---\n${t}`));
    return 'dry-run-x';
  }

  const apiKey       = process.env.X_API_KEY;
  const apiSecret    = process.env.X_API_SECRET;
  const accessToken  = process.env.X_ACCESS_TOKEN;
  const accessSecret = process.env.X_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn('   ⚠️  X not configured — set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET');
    return null;
  }

  const client = new TwitterApi({ appKey: apiKey, appSecret: apiSecret, accessToken, accessSecret });

  try {
    let replyToId: string | undefined;
    let firstId:   string | undefined;

    for (const text of thread) {
      const res = await client.v2.tweet(
        text,
        replyToId ? { reply: { in_reply_to_tweet_id: replyToId } } : {},
      );
      if (!firstId)  firstId  = res.data.id;
      replyToId = res.data.id;
    }

    return firstId ?? null;
  } catch (err) {
    console.error('[DailyDeal] X post failed:', (err as Error).message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// EMAIL FALLBACK — when LinkedIn org page is not yet configured
// ─────────────────────────────────────────────────────────────

/**
 * Email a LinkedIn post draft to Robert so he can manually post it
 * to the Merlin Energy company page.
 *
 * Requires env vars:
 *   SMTP_USER       — Gmail address to send FROM (e.g. your-app@gmail.com)
 *   SMTP_PASS       — Gmail App Password (not your regular password)
 *                     Generate at: https://myaccount.google.com/apppasswords
 *   LINKEDIN_EMAIL_TO — recipient address (defaults to ugobe07@gmail.com)
 */
async function emailLinkedInPost(postText: string, subject: string): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const primaryRecipient = process.env.LINKEDIN_EMAIL_TO ?? 'ugobe07@gmail.com';
  const ccRecipient = process.env.ALERT_EMAIL_CC ?? 'vkapila2004@gmail.com';
  const recipient = `${primaryRecipient}, ${ccRecipient}`;

  if (!smtpUser || !smtpPass) {
    console.warn('   ⚠️  Email not configured (set SMTP_USER + SMTP_PASS) — printing post to console instead:');
    console.log('\n' + '═'.repeat(55));
    console.log(`📧 [WOULD EMAIL TO: ${recipient}]`);
    console.log(`Subject: ${subject}`);
    console.log('─'.repeat(55));
    console.log(postText);
    console.log('═'.repeat(55) + '\n');
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpUser, pass: smtpPass },
  });

  const htmlBody = `
    <div style="font-family: system-ui, sans-serif; max-width: 680px; margin: 0 auto;">
      <div style="background: #F97316; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 18px;">⚡ Merlin Daily Deal — LinkedIn Post Ready</h2>
      </div>
      <div style="background: #fafafa; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="color: #6b7280; font-size: 14px; margin-top: 0;">
          Copy the post below and paste it to the
          <strong><a href="https://www.linkedin.com/company/merlin-energy-bess">Merlin Energy LinkedIn page</a></strong>.
        </p>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #111827;">
${postText}
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
          Generated by Merlin TrueQuote™ · merlinpro.energy
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Merlin Energy Agent" <${smtpUser}>`,
      to: recipient,
      subject,
      text: `LinkedIn Post Ready — copy and paste to Merlin Energy page:\n\n${postText}`,
      html: htmlBody,
    });
    console.log(`   📧 Email sent to: ${recipient}`);
    return true;
  } catch (err) {
    console.error('   ❌ Email send failed:', (err as Error).message);
    return false;
  }
}

async function postToLinkedIn(postText: string, dateStr: string, industryLabel: string): Promise<string | null> {
  const emailSubject = `[Merlin LinkedIn Post] ${dateStr} — ${industryLabel}`;

  if (process.env.DRY_RUN === 'true') {
    console.log('   🔵 [DRY RUN] LinkedIn post skipped — copy logged below:');
    console.log(postText);
    return 'dry-run-linkedin';
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  // Only post to the Merlin Energy company page — never to personal profile.
  // LINKEDIN_ORG_URN must be set (e.g. urn:li:organization:112979004) and the
  // access token must have the w_organization_social scope.
  // If ORG_URN is not set → email the post to Robert for manual publishing.
  const orgUrn = process.env.LINKEDIN_ORG_URN;

  if (!orgUrn) {
    console.warn('   ⚠️  LINKEDIN_ORG_URN not set — emailing post instead of publishing to personal profile.');
    await emailLinkedInPost(postText, emailSubject);
    return null;
  }

  if (!accessToken) {
    console.warn('   ⚠️  LINKEDIN_ACCESS_TOKEN not set — emailing post as fallback.');
    await emailLinkedInPost(postText, emailSubject);
    return null;
  }

  const body = {
    author: orgUrn,
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
    console.error('[DailyDeal] LinkedIn company page post failed:', res.status, err.slice(0, 200));
    console.log('   📧 Falling back to email — sending post to Robert for manual publishing...');
    await emailLinkedInPost(postText, `[FAILED — Manual Post Needed] ${emailSubject}`);
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
// FINANCIAL GUARDRAILS
// ─────────────────────────────────────────────────────────────

interface GuardResult { ok: boolean; reasons: string[] }

/**
 * Parses benchmark strings like '3–5 years' and '$200K–$500K/yr' and
 * validates computed financials against hard limits before any post goes live.
 *
 * Hard limits (block publishing):
 *   1. NPV (25yr) is negative
 *   2. Simple payback > 2× the benchmark max payback year
 *   3. Annual savings < 50% of the benchmark minimum savings
 *   4. IRR < 3%
 */
function validateFinancials(
  deal: DealProfile,
  fin: MCPQuoteResult['financials'],
): GuardResult {
  const reasons: string[] = [];

  // ── 1. NPV must be positive ───────────────────────────────
  if (fin.npv25Year < 0) {
    reasons.push(`Negative NPV (${usd(fin.npv25Year)}) — deal destroys value over 25 years`);
  }

  // ── 2. Parse payback benchmark ceiling ────────────────────
  // e.g. '3–5 years' → maxBenchmarkPayback = 5
  const paybackMatch = deal.roiBenchmark.paybackRange.match(/(\d+)/g);
  if (paybackMatch && paybackMatch.length >= 2) {
    const maxBenchmarkPayback = parseFloat(paybackMatch[paybackMatch.length - 1]);
    const hardPaybackCeiling = maxBenchmarkPayback * 2; // 2× tolerance
    if (fin.simplePayback > hardPaybackCeiling) {
      reasons.push(
        `Payback ${fin.simplePayback}yr exceeds 2× benchmark ceiling of ${maxBenchmarkPayback}yr (limit: ${hardPaybackCeiling}yr)`
      );
    }
  }

  // ── 3. Parse savings benchmark floor ──────────────────────
  // e.g. '$200K–$500K/yr' → minBenchmarkSavings = 200_000
  const savingsMatch = deal.roiBenchmark.savingsRange.match(/\$(\d+(?:\.\d+)?)(K|M)?/gi);
  if (savingsMatch && savingsMatch.length >= 1) {
    const parseAmount = (s: string): number => {
      const num = parseFloat(s.replace(/[^0-9.]/g, ''));
      const suffix = s.slice(-1).toUpperCase();
      return suffix === 'M' ? num * 1_000_000 : suffix === 'K' ? num * 1_000 : num;
    };
    const minBenchmarkSavings = parseAmount(savingsMatch[0]);
    const hardSavingsFloor = minBenchmarkSavings * 0.5; // 50% tolerance
    if (fin.annualSavings < hardSavingsFloor) {
      reasons.push(
        `Annual savings ${usd(fin.annualSavings)} is below 50% of benchmark minimum ${usd(minBenchmarkSavings)} (floor: ${usd(hardSavingsFloor)})`
      );
    }
  }

  // ── 4. IRR floor ──────────────────────────────────────────
  const irrNum = typeof fin.irrEstimate === 'string'
    ? parseFloat(fin.irrEstimate)
    : fin.irrEstimate;
  if (!isNaN(irrNum) && irrNum < 3) {
    reasons.push(`IRR ${irrNum}% is below minimum acceptable threshold of 3%`);
  }

  return { ok: reasons.length === 0, reasons };
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

  // ── Quote + guardrail loop: try scheduled industry, then up to 2 fallbacks ─
  // If multiple industries all fail guardrails, the engine itself is likely
  // broken — we alert and bail rather than posting any data.
  const MAX_ATTEMPTS = 3;
  const failLog: Array<{ industry: DealProfile; reasons: string[]; fin: MCPQuoteResult['financials'] }> = [];

  let chosenIndustry: DealProfile = industry;
  let chosenQuote: MCPQuoteResult | null = null;
  const attemptIdx = INDUSTRIES.indexOf(industry);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = attempt === 0
      ? industry
      : INDUSTRIES[(attemptIdx + attempt) % INDUSTRIES.length];

    if (attempt > 0) {
      console.log(`\n   🔁 Fallback attempt ${attempt}: ${candidate.emoji} ${candidate.label}`);
      console.log(`   ZIP: ${candidate.input.zipCode} | Peak: ${candidate.input.peakDemandKw} kW | Bill: $${candidate.input.monthlyBillDollars}/mo`);
    }

    console.log('   🔄 Calling TrueQuote™ via MCP...');
    let raw: MCPQuoteResult;
    try {
      raw = await callTool('generate_truequote', {
        industry:           candidate.input.industry,
        peakDemandKw:       candidate.input.peakDemandKw,
        monthlyBillDollars: candidate.input.monthlyBillDollars,
        zipCode:            candidate.input.zipCode,
        primaryUseCase:     candidate.input.primaryUseCase,
        hasSolar:           candidate.input.hasSolar,
      }) as MCPQuoteResult;
    } catch (err) {
      failLog.push({ industry: candidate, reasons: [`MCP call threw: ${String(err)}`], fin: {} as MCPQuoteResult['financials'] });
      continue;
    }

    const candidateFin = raw.financials;
    const candidateRec = raw.recommendation;
    console.log(`   ✅ Quote complete — System: ${candidateRec.systemSizeMW} MW · ${candidateRec.durationHours}h`);
    console.log(`      Cost: ${usd(candidateFin.totalInstalledCost)} gross → ${usd(candidateFin.netCostAfterITC)} after ITC`);
    console.log(`      Savings: ${usd(candidateFin.annualSavings)}/yr · ${candidateFin.simplePayback}yr payback · NPV ${usd(candidateFin.npv25Year)}`);

    const guard = validateFinancials(candidate, candidateFin);
    if (guard.ok) {
      chosenIndustry = candidate;
      chosenQuote    = raw;
      if (attempt > 0) {
        console.log(`   ✅ Guardrails passed on fallback: ${candidate.label} (original: ${industry.label})`);
        // Notify Robert that a substitution happened
        const subMsg = [
          `ℹ️  Merlin Daily Deal — Industry substitution on ${dateStr}`,
          ``,
          `Scheduled: ${industry.label}  →  Published: ${candidate.label}`,
          ``,
          `Original failure reasons:`,
          ...failLog.flatMap(f => [`  [${f.industry.label}]`, ...f.reasons.map(r => `    • ${r}`)]),
          ``,
          `The substituted deal passed all guardrails and was posted normally.`,
        ].join('\n');
        await emailLinkedInPost(subMsg, `ℹ️  Daily Deal substituted — ${industry.label} → ${candidate.label}`);
      } else {
        console.log(`   ✅ Financial guardrails passed (payback ${candidateFin.simplePayback}yr, NPV ${usd(candidateFin.npv25Year)})`);
      }
      break;
    }

    // This candidate failed — log it and decide if it looks like an engine problem
    failLog.push({ industry: candidate, reasons: guard.reasons, fin: candidateFin });
    console.warn(`   ⚠️  Guardrails FAILED for ${candidate.label}: ${guard.reasons.join(' | ')}`);
  }

  // If no candidate passed, determine root cause and alert
  if (!chosenQuote) {
    const allNegativeNPV = failLog.every(f => f.fin.npv25Year !== undefined && f.fin.npv25Year < 0);
    const engineSuspect  = failLog.length >= 2 && allNegativeNPV;

    const alertLines = [
      engineSuspect
        ? `🔥 Merlin Daily Deal — ENGINE MAY BE BROKEN (${dateStr})`
        : `🚨 Merlin Daily Deal — Publishing BLOCKED (${dateStr})`,
      ``,
      engineSuspect
        ? `${failLog.length} different industries all returned negative NPV — this points to a systematic engine error, not a profile issue.`
        : `All ${failLog.length} industry attempt(s) failed financial guardrails.`,
      ``,
      `Failed attempts:`,
      ...failLog.map(f => [
        `  [${f.industry.label}]`,
        `    Reasons: ${f.reasons.join(' | ')}`,
        `    Savings: ${usd(f.fin.annualSavings ?? 0)} · Payback: ${f.fin.simplePayback ?? '?'}yr · NPV: ${usd(f.fin.npv25Year ?? 0)} · IRR: ${f.fin.irrEstimate ?? '?'}%`,
      ].join('\n')),
      ``,
      `No posts were made to Discord, LinkedIn, or X.`,
      engineSuspect
        ? `ACTION REQUIRED: Check the TrueQuote engine / MCP server for systematic errors.`
        : `ACTION REQUIRED: Review the industry profile inputs and re-run via workflow_dispatch.`,
    ].join('\n');

    console.error(`\n${alertLines}\n`);
    await emailLinkedInPost(
      alertLines,
      engineSuspect
        ? `🔥 Daily Deal ENGINE ERROR — all ${failLog.length} industries failed guardrails`
        : `🚨 Daily Deal BLOCKED — guardrails failed after ${failLog.length} attempt(s)`,
    );

    return {
      date: dateStr,
      industry,
      quote: failLog[0]?.fin ? { financials: failLog[0].fin, recommendation: {} } as MCPQuoteResult : {} as MCPQuoteResult,
      postedToDiscord: false,
      postedToX: false,
      savedToSupabase: false,
    };
  }

  const quote = chosenQuote;
  // ──────────────────────────────────────────────────────────────────────────

  // Use whichever industry passed guardrails (may be a fallback)
  Object.assign(industry, chosenIndustry);

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
  console.log('   💼 Posting to LinkedIn company page...');
  const linkedInId = await postToLinkedIn(linkedInPost, dateStr, industry.label);
  if (linkedInId) {
    console.log(`   ✅ Posted to LinkedIn company page (ID: ${linkedInId})`);
  } else {
    console.log('   ⚠️  LinkedIn post emailed to Robert or skipped — check logs above');
  }

  // Post to X (@Merlin_Energy)
  const xThread = generateXThread(industry, quote);
  console.log('   🐦 Posting to X (@Merlin_Energy)...');
  const xTweetId = await postToX(xThread);
  const postedToX = xTweetId !== null;
  if (postedToX) {
    console.log(`   ✅ Posted to X (tweet ID: ${xTweetId})`);
  } else {
    console.log('   ⚠️  X post skipped or failed — configure X_API_KEY + X_ACCESS_TOKEN');
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
    postedToX,
    xTweetId: xTweetId ?? undefined,
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
      console.log(`\nResult: ${deal.postedToDiscord ? '✅ Posted' : '⚠️  Not posted'} to Discord | ${deal.postedToX ? '✅ Posted' : '⚠️  Not posted'} to X | ${deal.savedToSupabase ? '✅ Saved' : '⚠️  Not saved'} to Supabase`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DailyDeal] Fatal error:', err);
      process.exit(1);
    });
}

