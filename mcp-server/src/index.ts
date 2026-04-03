#!/usr/bin/env node
/**
 * MERLIN MCP SALES AGENT SERVER
 * ==============================
 * Model Context Protocol server that acts as an intelligent sales
 * representative for the Merlin Energy platform.
 *
 * This server exposes Merlin's TrueQuote™ engine and business knowledge
 * to any MCP-compatible AI client (Claude Desktop, custom agents, etc.)
 *
 * Capabilities:
 * - Generate BESS quotes in real-time
 * - Answer energy ROI questions with data
 * - Look up industry benchmarks and case studies
 * - Qualify leads and route them appropriately
 * - Provide competitor comparisons
 * - Generate professional proposals
 *
 * See: .merlin-meta/CONSTITUTION.md for policies
 * See: ontology/ for domain knowledge
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express from 'express';
import 'dotenv/config';
import { validateApiKey, trackUsage, createApiKey, getUsageStats } from './commerce.js';

// ============================================================
// TOOL SCHEMAS
// ============================================================

const QuoteInputSchema = z.object({
  industry: z.enum([
    'car-wash', 'hotel', 'data-center', 'ev-charging', 'restaurant',
    'office', 'warehouse', 'manufacturing', 'university', 'hospital',
    'agriculture', 'retail'
  ]).describe('Industry vertical of the prospect'),
  peakDemandKw: z.number().min(50).max(50_000).describe('Peak electrical demand in kilowatts'),
  monthlyBillDollars: z.number().min(100).max(500_000).describe('Average monthly utility bill in dollars'),
  zipCode: z.string().regex(/^\d{5}$/).describe('5-digit US ZIP code'),
  primaryUseCase: z.enum([
    'peak-shaving', 'backup-power', 'TOU-arbitrage', 'solar-self-consumption',
    'demand-charge-reduction', 'ups-backup'
  ]).default('peak-shaving').describe('Primary application for the BESS. Use ups-backup for hospitals, data centers, or any facility requiring uninterruptible power (100% critical-load coverage, ≥4h duration).'),
  hasSolar: z.boolean().default(false).describe('Does the facility have or plan solar?'),
  solarMW: z.number().optional().describe('Existing/planned solar size in MW'),
  desiredPaybackYears: z.number().min(1).max(20).optional().describe('Target payback period'),
});

const LeadQualifySchema = z.object({
  companyName: z.string().describe('Company name'),
  industry: z.string().describe('Industry type'),
  annualRevenue: z.number().optional().describe('Approximate annual revenue in USD'),
  numberOfLocations: z.number().default(1).describe('Number of facilities'),
  decisionTimeline: z.enum(['immediate', '3-months', '6-months', '12-months', 'exploring']).describe('Purchasing timeline'),
  currentPain: z.string().describe('Primary energy challenge they are trying to solve'),
  contactInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
});

const CompetitorCompareSchema = z.object({
  competitor: z.enum(['homer-energy', 'enernoc', 'excel-calculator', 'other']).describe('Competitor to compare against'),
  context: z.string().optional().describe('Specific comparison context or objection being raised'),
});

const ProposalSchema = z.object({
  prospectName: z.string().describe('Prospect company name'),
  industry: z.string().describe('Industry vertical'),
  systemSizeMW: z.number().describe('Recommended BESS size in MW'),
  durationHours: z.number().describe('BESS duration in hours'),
  totalCostDollars: z.number().describe('Total installed cost in USD'),
  annualSavingsDollars: z.number().describe('Annual savings in USD'),
  paybackYears: z.number().describe('Simple payback period'),
  npvDollars: z.number().describe('25-year NPV in USD'),
  irrPercent: z.number().describe('IRR as percentage'),
  format: z.enum(['executive-summary', 'detailed-proposal', 'one-pager']).default('executive-summary'),
});

const BenchmarkLookupSchema = z.object({
  category: z.enum(['bess-cost', 'solar-cost', 'utility-rates', 'roi-by-industry', 'market-size']).describe('Category of benchmark data'),
  industry: z.string().optional().describe('Specific industry for industry-specific benchmarks'),
});

const RegisterAgentSchema = z.object({
  agentName: z.string().min(2).describe('Your AI agent or company name'),
  email: z.string().email().describe('Contact email — used for billing and quota alerts'),
  plan: z.enum(['free', 'starter', 'pro']).default('free').describe(
    'Access tier: free=10 quotes/mo, starter=100/mo ($49), pro=1000/mo ($199)'
  ),
});

const CheckUsageSchema = z.object({
  apiKey: z.string().describe('Your mk_live_... API key to check quota for'),
});

// ============================================================
// SALES KNOWLEDGE BASE
// ============================================================

const SALES_KB = {
  productOverview: `
Merlin is the only platform combining enterprise-grade BESS quoting with SMB lead generation at scale.

MERLIN PRO (SaaS):
- $299-999/month subscription
- For EPCs, integrators, battery companies
- Instant TrueQuote™ calculations in <5 seconds
- 18x faster than manual process
- 47-variable proprietary algorithm
- NREL ATB 2024 benchmark-backed

SMB VERTICALS (Lead Gen):
- Industry-specific sites (car wash, hotel, data center, etc.)
- Generates qualified leads at $50-500 each
- 18 industry verticals live
- Proprietary load profiles per industry
`,

  keyDifferentiators: [
    'TrueQuote™: 47-variable algorithm, ≥95% accuracy vs actual installed systems',
    '18x faster than manual BESS quoting (5 min vs 90 hrs)',
    'Dual revenue model: only platform doing SaaS AND lead gen',
    'Benchmark-backed: every number traceable to NREL/DOE sources',
    'Industry-specific load profiles for 18 verticals',
    'Real utility rate data (6,000+ rate schedules)',
    'Machine learning improves with every quote',
  ],

  competitorMatrix: {
    'homer-energy': {
      theirStrengths: 'Detailed simulation, NREL credibility, used by engineers',
      theirWeaknesses: 'Complex software, $3K-15K/yr, 12-18 hours per quote, no SMB vertical, no lead gen',
      merlinAdvantages: '18x faster, purpose-built for quoting vs research, SMB lead gen, $299/mo',
      bestResponseTo: 'We\'re complementary to Homer — Homer for deep research, Merlin for rapid commercial quoting and business development',
    },
    'enernoc': {
      theirStrengths: 'Enterprise relationships, demand response expertise',
      theirWeaknesses: 'Enterprise-only, not self-serve, high implementation cost, no SMB focus',
      merlinAdvantages: 'SMB accessible, instant self-serve, 10x lower cost, lead generation capability',
    },
    'excel-calculator': {
      theirStrengths: 'Free, familiar',
      theirWeaknesses: 'Manual, no real tariff data, no degradation modeling, not auditable, 90+ hours',
      merlinAdvantages: 'Automated, benchmark-backed, audit trail, 5 minutes vs 90 hours',
    },
  },

  industryROIBenchmarks: {
    'car-wash': { payback: '4-6 years', savings: '$30K-80K/year', primaryDriver: 'demand charges from compressors' },
    'hotel': { payback: '5-7 years', savings: '$50K-150K/year', primaryDriver: 'demand charges + TOU arbitrage' },
    'data-center': { payback: '3-5 years', savings: '$200K-500K/year', primaryDriver: 'demand charges + backup power' },
    'manufacturing': { payback: '3-5 years', savings: '$100K-400K/year', primaryDriver: 'demand charges from production equipment' },
    'restaurant': { payback: '5-8 years', savings: '$20K-60K/year', primaryDriver: 'demand charges from kitchen equipment' },
  },

  commonObjections: {
    'too expensive': 'With ITC at 30%, federal incentives reduce cost by $150K-300K on typical installations. Average payback is 4-7 years with 25-year NPV of 2-4x installed cost.',
    'not sure it works for us': 'We\'ve built industry-specific load profiles for 18 different business types. Your industry\'s ROI is pre-calculated based on real utility data in your ZIP code.',
    'already have a consultant': 'Merlin makes your consultant 18x faster. They still bring the expertise — we handle the quoting math in seconds instead of days.',
    'battery technology is changing': 'Our system accounts for LFP degradation curves and you can model upgrades. The economics are locked in based on TODAY\'s utility rates and your usage.',
    'not the right time': 'ITC is at 30% and may step down. Utility rates are rising ~3-5%/year. Every year of delay = higher rates and lower incentives.',
  },
};

// ============================================================
// TOOL IMPLEMENTATIONS
// ============================================================

// Interface for the /api/quote response shape
interface TierResult {
  label: string;
  equipment: { solarKW: number; bessKW: number; bessKWh: number; durationHrs: number; generatorKW: number };
  costs: { totalInvestment: number; federalITC: number; netInvestment: number };
  savings: { netAnnualSavings: number; demandChargeSavings: number; solarSavings: number };
  roi: { paybackYears: number; npv25Year: number; year1ROI: number };
}

async function generateQuote(input: z.infer<typeof QuoteInputSchema>) {
  const { industry, peakDemandKw, monthlyBillDollars, zipCode, primaryUseCase, hasSolar, solarMW } = input;
  const apiBase = process.env.MERLIN_API_URL || 'https://merlinenergy.net';
  const startMs = Date.now();

  // Map MCP primaryUseCase → quote engine bessApplication
  const applicationMap: Record<string, string> = {
    'peak-shaving':              'peak_shaving',
    'backup-power':              'resilience',
    'TOU-arbitrage':             'arbitrage',
    'solar-self-consumption':    'peak_shaving',
    'demand-charge-reduction':   'peak_shaving',
    'ups-backup':                'ups',       // full critical-load UPS coverage
  };

  // Map MCP industry slugs → quote engine industry keys
  const industryMap: Record<string, string> = {
    'car-wash':      'car_wash',
    'data-center':   'data_center',
    'ev-charging':   'ev_charging',
    'hotel':         'hotel',
    'restaurant':    'restaurant',
    'office':        'office',
    'warehouse':     'warehouse',
    'manufacturing': 'manufacturing',
    'university':    'university',
    'hospital':      'healthcare',
    'agriculture':   'default',
    'retail':        'retail',
  };

  // Estimate electricity rate from monthly bill + peak demand
  // kWh ≈ peakKW × 0.40 load factor × 730 hours/month
  const estimatedKwhPerMonth = peakDemandKw * 0.40 * 730;
  const estimatedElecRate = estimatedKwhPerMonth > 0
    ? Math.min(0.35, Math.max(0.08, monthlyBillDollars / estimatedKwhPerMonth))
    : 0.12;

  const body: Record<string, unknown> = {
    industry:        industryMap[industry] ?? industry,
    location:        zipCode,
    peakLoadKW:      peakDemandKw,
    bessApplication: applicationMap[primaryUseCase] ?? 'peak_shaving',
    electricityRate: Math.round(estimatedElecRate * 1000) / 1000,
  };

  if (hasSolar && solarMW) {
    body.solarKW = Math.round(solarMW * 1000);
  }

  const response = await fetch(`${apiBase}/api/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer mcp-internal',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Quote API returned HTTP ${response.status}. Is merlinenergy.net reachable?`);
  }

  const data = await response.json() as {
    ok: boolean;
    location: { formattedAddress: string; stateCode: string };
    solar: { peakSunHours: number; source: string };
    tiers: { starter: TierResult; recommended: TierResult; complete: TierResult };
    meta: { computeMs: number };
  };

  if (!data.ok) throw new Error('Quote engine returned an error response');

  const rec = data.tiers.recommended;
  const st  = data.tiers.starter;
  const com = data.tiers.complete;

  return {
    source:     'LIVE — Merlin TrueQuote™ v4.5 (NREL PVWatts v8)',
    location:   data.location.formattedAddress,
    solar: {
      peakSunHours: data.solar.peakSunHours,
      source:       data.solar.source,
    },
    recommendation: {
      systemSizeMW:    rec.equipment.bessKW / 1000,
      systemKW:        rec.equipment.bessKW,
      systemKWh:       rec.equipment.bessKWh,
      durationHours:   rec.equipment.durationHrs,
      solarKW:         rec.equipment.solarKW,
      generatorKW:     rec.equipment.generatorKW,
      batteryChemistry: 'LFP (Lithium Iron Phosphate)',
      primaryUseCase,
    },
    financials: {
      totalInstalledCost: rec.costs.totalInvestment,
      itcCredit:          rec.costs.federalITC,
      netCostAfterITC:    rec.costs.netInvestment,
      annualSavings:      rec.savings.netAnnualSavings,
      demandChargeSavings: rec.savings.demandChargeSavings,
      solarSavings:       rec.savings.solarSavings,
      simplePayback:      rec.roi.paybackYears,
      npv25Year:          rec.roi.npv25Year,
      year1ROI:           `${rec.roi.year1ROI}%`,
    },
    allTiers: {
      starter: {
        size:         `${st.equipment.bessKW}kW / ${st.equipment.bessKWh}kWh`,
        netCost:      st.costs.netInvestment,
        annualSavings: st.savings.netAnnualSavings,
        paybackYears:  st.roi.paybackYears,
      },
      recommended: {
        size:         `${rec.equipment.bessKW}kW / ${rec.equipment.bessKWh}kWh`,
        netCost:      rec.costs.netInvestment,
        annualSavings: rec.savings.netAnnualSavings,
        paybackYears:  rec.roi.paybackYears,
      },
      complete: {
        size:         `${com.equipment.bessKW}kW / ${com.equipment.bessKWh}kWh`,
        netCost:      com.costs.netInvestment,
        annualSavings: com.savings.netAnnualSavings,
        paybackYears:  com.roi.paybackYears,
      },
    },
    computeMs:  Date.now() - startMs,
    disclaimer: 'Live TrueQuote™ v4.5. Powered by NREL PVWatts v8 + NREL ATB 2024. Accuracy ±15%.',
    nextStep:   `Full site analysis with actual utility rate data: merlinpro.energy`,
  };
}

function qualifyLead(input: z.infer<typeof LeadQualifySchema>) {
  const { industry, annualRevenue, numberOfLocations, decisionTimeline, currentPain } = input;

  let score = 0;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  // Scoring logic
  if (['immediate', '3-months'].includes(decisionTimeline)) { score += 30; reasons.push('Urgent timeline'); }
  else if (decisionTimeline === '6-months') { score += 20; reasons.push('Active planning'); }
  else { score += 5; reasons.push('Early exploration'); }

  if (numberOfLocations > 5) { score += 20; reasons.push('Multi-site = high deal value'); }
  else if (numberOfLocations > 1) { score += 10; reasons.push('Multi-location'); }

  if ((annualRevenue ?? 0) > 5_000_000) { score += 25; reasons.push('Revenue indicates budget authority'); }
  else if ((annualRevenue ?? 0) > 1_000_000) { score += 15; reasons.push('Mid-market budget'); }

  const highValueIndustries = ['data-center', 'manufacturing', 'hospital', 'university'];
  if (highValueIndustries.includes(industry)) { score += 15; reasons.push('High-value vertical'); }

  if (currentPain.toLowerCase().includes('demand') || currentPain.toLowerCase().includes('peak')) {
    score += 10; reasons.push('Aligned pain: demand charges — core Merlin use case');
  }

  let tier: 'hot' | 'warm' | 'nurture';
  let action: string;

  if (score >= 70) {
    tier = 'hot';
    action = 'Immediate outreach — schedule demo within 24 hours';
    recommendations.push('Send TrueQuote™ analysis for their ZIP code + industry');
    recommendations.push('Highlight ITC timeline urgency');
    recommendations.push('Offer Merlin Pro trial');
  } else if (score >= 40) {
    tier = 'warm';
    action = 'Schedule follow-up within 1 week';
    recommendations.push('Send industry ROI case study');
    recommendations.push('Add to email nurture sequence');
    recommendations.push('Offer free quick quote via SMB vertical site');
  } else {
    tier = 'nurture';
    action = 'Add to newsletter and 90-day nurture campaign';
    recommendations.push('Send Merlin Energy Insider newsletter');
    recommendations.push('Check back at 90-day mark');
  }

  return { score, tier, action, reasons, recommendations };
}

function compareCompetitor(input: z.infer<typeof CompetitorCompareSchema>) {
  const comp = SALES_KB.competitorMatrix[input.competitor as keyof typeof SALES_KB.competitorMatrix];
  if (!comp) {
    return { summary: 'Unknown competitor. Merlin\'s key advantages: speed (18x faster), accuracy (95%+), dual business model (SaaS + lead gen), and SMB accessibility.' };
  }
  return {
    theirStrengths: comp.theirStrengths,
    theirWeaknesses: comp.theirWeaknesses,
    merlinAdvantages: comp.merlinAdvantages,
    suggestedResponse: 'bestResponseTo' in comp ? comp.bestResponseTo : undefined,
  };
}

function generateProposal(input: z.infer<typeof ProposalSchema>) {
  const { prospectName, industry, systemSizeMW, durationHours, totalCostDollars, annualSavingsDollars, paybackYears, npvDollars, irrPercent, format } = input;

  const itc = totalCostDollars * 0.30;
  const netCost = totalCostDollars - itc;

  if (format === 'one-pager') {
    return {
      title: `Merlin TrueQuote™ — ${prospectName}`,
      sections: {
        system: `${systemSizeMW} MW / ${durationHours}h BESS (${systemSizeMW * 1000 * durationHours} kWh)`,
        totalCost: `$${totalCostDollars.toLocaleString()} installed`,
        itcCredit: `$${itc.toLocaleString()} (30% ITC)`,
        netCost: `$${netCost.toLocaleString()} net investment`,
        annualSavings: `$${annualSavingsDollars.toLocaleString()}/year`,
        payback: `${paybackYears.toFixed(1)} years`,
        npv: `$${npvDollars.toLocaleString()} (25-year NPV)`,
        irr: `${irrPercent.toFixed(1)}% IRR`,
      },
      footer: 'Powered by Merlin TrueQuote™ | merlinpro.energy | ±15% accuracy | NREL ATB 2024 benchmarks',
    };
  }

  return {
    title: `Battery Energy Storage Proposal — ${prospectName}`,
    executiveSummary: `${prospectName} can deploy a ${systemSizeMW} MW / ${durationHours}-hour BESS system to address ${industry}-specific energy challenges. The system generates $${annualSavingsDollars.toLocaleString()} in annual savings with a ${paybackYears.toFixed(1)}-year payback and $${npvDollars.toLocaleString()} in 25-year value. After the 30% ITC, your net investment is $${netCost.toLocaleString()}.`,
    systemDesign: {
      capacity: `${systemSizeMW * 1000 * durationHours} kWh`,
      power: `${systemSizeMW * 1000} kW`,
      duration: `${durationHours} hours`,
      chemistry: 'LFP (Lithium Iron Phosphate) — Highest safety rating, 15-year cycle life',
      warranty: '10-year system warranty standard',
    },
    financialSummary: {
      totalInstalledCost: `$${totalCostDollars.toLocaleString()}`,
      investmentTaxCredit: `$${itc.toLocaleString()} (30% of installed cost, IRA 2022)`,
      netInvestment: `$${netCost.toLocaleString()}`,
      annualSavings: `$${annualSavingsDollars.toLocaleString()}`,
      paybackPeriod: `${paybackYears.toFixed(1)} years`,
      irr: `${irrPercent.toFixed(1)}%`,
      npv25Year: `$${npvDollars.toLocaleString()}`,
      roiMultiple: `${(npvDollars / netCost).toFixed(1)}x return on investment`,
    },
    nextSteps: [
      'Complete full site assessment (1 day, no cost)',
      'Request actual utility bills for precise TOU analysis',
      'Get multiple vendor bids through Merlin\'s installer network',
      'Apply for utility incentive programs (state + local)',
      'Finalize design and engineering (2-4 weeks)',
    ],
    disclaimer: 'This proposal is based on Merlin TrueQuote™ analysis using NREL ATB 2024 benchmarks. Actual results ±15%. Not a substitute for detailed engineering study. Powered by Merlin Energy Platform.',
  };
}

function getBenchmarks(input: z.infer<typeof BenchmarkLookupSchema>) {
  const benchmarkData: Record<string, unknown> = {
    'bess-cost': {
      source: 'NREL StoreFAST 2024 + BloombergNEF BNEF 2024',
      commercialBESS: '$280-420/kWh installed (2024)',
      utilitySclae: '$200-280/kWh installed (2024)',
      trend: 'Declining 8-12% per year',
      LFPPremium: 'LFP 5-10% premium over NMC but 50% longer cycle life',
    },
    'solar-cost': {
      source: 'NREL ATB 2024',
      commercial: '$0.90-1.20/W installed (2024)',
      utility: '$0.70-0.90/W installed (2024)',
      trend: 'Flat to slight decline; supply chain stabilizing',
    },
    'utility-rates': {
      source: 'EIA Commercial Electricity Data 2024',
      nationalAverage: '$0.124/kWh commercial',
      demandCharges: '$10-40/kW/month (varies widely by utility)',
      rateEscalation: '3-5% per year historical',
      peakRates: 'TOU peak can be 2-3x off-peak in CA, NY, MA',
    },
    'roi-by-industry': {
      source: 'Merlin TrueQuote™ database + NREL benchmarks',
      data: SALES_KB.industryROIBenchmarks,
    },
    'market-size': {
      source: 'BloombergNEF, Wood Mackenzie 2024',
      usBessMarket: '$15B by 2030 (CAGR 25%)',
      commercialSegment: '35% of total market',
      smbOpportunity: '500,000+ SMBs with favorable BESS economics',
      merlinTAM: '$2B+ addressable market for SMB lead gen + SaaS',
    },
  };

  const data = benchmarkData[input.category];
  if (!data) {
    return { error: `Unknown benchmark category: ${input.category}` };
  }

  if (input.industry && input.category === 'roi-by-industry') {
    const industryData = SALES_KB.industryROIBenchmarks[input.industry as keyof typeof SALES_KB.industryROIBenchmarks];
    return industryData ?? { error: `No benchmark data for industry: ${input.industry}` };
  }

  return data;
}

// ============================================================
// MCP SERVER SETUP
// ============================================================

function createServer() {
const server = new McpServer({
  name: 'merlin-sales-agent',
  version: '1.0.0',
});

// --- TOOLS ---

server.tool(
  'generate_truequote',
  'Generate a TrueQuote™ BESS recommendation and ROI analysis for a prospect. Use this when a prospect wants to know if battery storage makes sense for their facility.',
  QuoteInputSchema.shape,
  async (input) => {
    try {
      const result = await generateQuote(input as z.infer<typeof QuoteInputSchema>);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'qualify_lead',
  'Qualify a sales lead and determine urgency tier (hot/warm/nurture). Returns a score, recommended actions, and routing decision.',
  LeadQualifySchema.shape,
  async (input) => {
    const result = qualifyLead(input as z.infer<typeof LeadQualifySchema>);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  'compare_competitor',
  'Get a competitive analysis comparing Merlin against a specific competitor. Use when handling objections or competitive situations.',
  CompetitorCompareSchema.shape,
  async (input) => {
    const result = compareCompetitor(input as z.infer<typeof CompetitorCompareSchema>);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  'generate_proposal',
  'Generate a professional BESS proposal document for a prospect. Formats: executive-summary, detailed-proposal, or one-pager.',
  ProposalSchema.shape,
  async (input) => {
    const result = generateProposal(input as z.infer<typeof ProposalSchema>);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  'get_benchmarks',
  'Retrieve authoritative energy market benchmark data (BESS costs, solar costs, utility rates, ROI by industry, market size).',
  BenchmarkLookupSchema.shape,
  async (input) => {
    const result = getBenchmarks(input as z.infer<typeof BenchmarkLookupSchema>);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }
);

server.tool(
  'handle_objection',
  'Get the best Merlin response to a common sales objection.',
  { objection: z.string().describe('The objection raised by the prospect') },
  async ({ objection }) => {
    const lowerObj = objection.toLowerCase();
    let response = 'Great question. Let me share some data that may help...';

    for (const [key, val] of Object.entries(SALES_KB.commonObjections)) {
      if (lowerObj.includes(key.split(' ')[0])) {
        response = val;
        break;
      }
    }

    return {
      content: [{ type: 'text' as const, text: response }],
    };
  }
);

server.tool(
  'get_daily_deal',
  "Get today's featured industry BESS deal — a pre-calculated TrueQuote for a rotating industry vertical. Returns the deal data plus a ready-to-post LinkedIn post copy.",
  {
    date: z.string().optional().describe('ISO date (YYYY-MM-DD) — defaults to today'),
  },
  async ({ date }) => {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { content: [{ type: 'text' as const, text: 'Supabase not configured on this server.' }], isError: true };
    }

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/daily_deals?deal_date=eq.${targetDate}&order=id.desc&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      );
      const rows = await res.json() as Record<string, unknown>[];

      if (!rows.length) {
        return { content: [{ type: 'text' as const, text: `No daily deal found for ${targetDate}. Run agents/daily-deal.ts to generate one.` }] };
      }

      const deal = rows[0];
      const emoji: Record<string, string> = {
        'car-wash': '🚗', 'hotel': '🏨', 'data-center': '🖥️', 'hospital': '🏥',
        'manufacturing': '🏭', 'restaurant': '🍔', 'grocery': '🛒', 'office': '🏢',
        'ev-charging': '⚡', 'warehouse': '📦', 'school': '🎓', 'cannabis': '🌿',
        'fitness-center': '💪', 'cold-storage': '🧊', 'brewery': '🍺', 'laundry': '👕',
        'parking': '🅿️', 'retail': '🛍️',
      };
      const e = emoji[deal.industry_id as string] ?? '⚡';
      const gross = deal.gross_cost_dollars as number;
      const net = deal.net_cost_dollars as number;
      const savings = deal.annual_savings as number;
      const payback = deal.payback_years as number;
      const npv = deal.npv_25yr as number;
      const itc = gross - net;

      const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : `$${(n/1000).toFixed(0)}K`;

      const linkedInPost = (deal.linkedin_post as string | null) ??
`${e} Today's BESS Deal of the Day: ${deal.industry_label}

${deal.tagline ?? ''}

${deal.market_hook ?? ''}

📊 The numbers:
• System: ${deal.system_size_mw} MW · ${deal.duration_hours}h storage
• Gross cost: ${fmt(gross)} → ${fmt(net)} after ITC
• Annual savings: ${fmt(savings)}
• Payback: ${payback} years
• 25yr NPV: ${fmt(npv)}

Every day we feature a new industry. Every quote is calculated live using NREL data, DOE frameworks, and real utility rates.

Run your own TrueQuote™ in 5 minutes → merlinpro.energy

#EnergyStorage #BESS #CleanEnergy #${(deal.industry_label as string).replace(/[^A-Za-z]/g, '')} #MerlinEnergy`;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            date: targetDate,
            industry: deal.industry_label,
            emoji: e,
            tagline: deal.tagline,
            system: `${deal.system_size_mw} MW · ${deal.duration_hours}h`,
            grossCost: fmt(gross),
            netCost: fmt(net),
            itcCredit: fmt(itc),
            annualSavings: fmt(savings),
            paybackYears: payback,
            npv25yr: fmt(npv),
            discordMessageId: deal.discord_message_id,
            linkedInPost,
          }, null, 2),
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${String(err)}` }], isError: true };
    }
  }
);

server.tool(
  'register_agent',
  'Register your AI agent with Merlin to get an API key for calling TrueQuote™. Free tier = 10 quotes/month. Returns a key — save it immediately, it is shown once.',
  RegisterAgentSchema.shape,
  async (input) => {
    try {
      const result = await createApiKey({
        ownerName: input.agentName,
        ownerEmail: input.email,
        plan: input.plan ?? 'free',
      });
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            apiKey: result.rawKey,
            keyPrefix: result.keyPrefix,
            plan: result.plan,
            monthlyQuota: result.monthlyQuota,
            warning: '⚠️  Save this key immediately — it will NOT be shown again.',
            httpUsage: `Authorization: Bearer ${result.rawKey}`,
            upgrade: result.upgradePath,
          }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Registration error: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  'check_usage',
  'Check how many TrueQuote™ API calls you have used this month and your remaining quota.',
  CheckUsageSchema.shape,
  async ({ apiKey }) => {
    try {
      const stats = await getUsageStats(apiKey);
      if (!stats) {
        return {
          content: [{ type: 'text' as const, text: 'Invalid API key or key not found. Register at merlinpro.energy/api-keys' }],
          isError: true,
        };
      }
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            plan:            stats.plan,
            monthlyPrice:    stats.monthlyPrice === 0 ? 'Free' : `$${stats.monthlyPrice}/month`,
            usageThisMonth:  stats.usageThisMonth,
            quota:           stats.quota,
            remainingCalls:  stats.remainingCalls,
            percentUsed:     `${stats.percentUsed}%`,
            recentCalls:     stats.recentCalls.slice(0, 5),
            upgrade:         stats.upgradeUrl,
          }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error fetching usage: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// --- RESOURCES ---

server.resource(
  'merlin-product-overview',
  'merlin://products/overview',
  async () => ({
    contents: [{
      uri: 'merlin://products/overview',
      mimeType: 'text/plain',
      text: SALES_KB.productOverview,
    }],
  })
);

server.resource(
  'merlin-differentiators',
  'merlin://sales/differentiators',
  async () => ({
    contents: [{
      uri: 'merlin://sales/differentiators',
      mimeType: 'application/json',
      text: JSON.stringify(SALES_KB.keyDifferentiators, null, 2),
    }],
  })
);

server.resource(
  'merlin-industry-benchmarks',
  'merlin://data/industry-benchmarks',
  async () => ({
    contents: [{
      uri: 'merlin://data/industry-benchmarks',
      mimeType: 'application/json',
      text: JSON.stringify(SALES_KB.industryROIBenchmarks, null, 2),
    }],
  })
);

server.resource(
  'merlin-objection-handlers',
  'merlin://sales/objections',
  async () => ({
    contents: [{
      uri: 'merlin://sales/objections',
      mimeType: 'application/json',
      text: JSON.stringify(SALES_KB.commonObjections, null, 2),
    }],
  })
);

// --- PROMPTS ---

server.prompt(
  'sales-call-opener',
  'Generate an opening for a Merlin sales call based on prospect context',
  {
    prospectName: z.string().describe('Prospect company name'),
    industry: z.string().describe('Industry vertical'),
    referralSource: z.string().optional().describe('How they found us'),
  },
  ({ prospectName, industry, referralSource }) => ({
    messages: [{
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `You are a Merlin Energy sales representative. Generate a warm, professional, data-driven opening for a sales call with ${prospectName}, a ${industry} operator${referralSource ? ` who came to us via ${referralSource}` : ''}. 

Key points to hit:
1. Acknowledge their specific industry pain points
2. Tease the ROI numbers without overwhelming
3. Position Merlin as uniquely qualified (5 minutes vs 90 hours, industry-specific)
4. Ask a qualifying question to open the dialogue

Keep it under 3 minutes. Be human, not scripted.`,
      },
    }],
  })
);

server.prompt(
  'executive-pitch',
  'Generate a 60-second executive pitch for Merlin',
  {
    audience: z.enum(['investor', 'EPC-executive', 'SMB-owner', 'battery-manufacturer']).describe('Target audience'),
  },
  ({ audience }) => ({
    messages: [{
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `You are Robert Christopher, founder of Merlin Energy. Generate a compelling 60-second pitch for a ${audience}.

Merlin facts to weave in:
- TrueQuote™: 47-variable BESS algorithm, ≥95% accuracy, 5 minutes vs 90 hours
- 18 industry verticals, each with proprietary load profiles
- Dual revenue: SaaS ($299-999/mo) + lead gen ($50-500/lead)
- Target: $600K ARR SaaS + $2.5M lead gen
- Only platform combining enterprise BESS quoting with SMB lead generation

Make it confident, specific, and memorable. End with a clear ask.`,
      },
    }],
  })
);

  return server;
} // end createServer()

// ============================================================
// START SERVER
// ============================================================

async function main() {
  const port = process.env.PORT;

  if (port) {
    // HTTP mode — for Railway / Smithery deployment
    const app = express();
    app.use(express.json());

    app.post('/mcp', async (req, res) => {
      const startMs = Date.now();
      let keyId: string | null = null;

      // ── API key auth ───────────────────────────────────────────────────
      const rawKey = ((req.headers.authorization as string) || '')
        .replace(/^Bearer\s+/i, '').trim();

      if (rawKey) {
        const { key, error } = await validateApiKey(rawKey);
        if (!key) {
          res.status(401).json({
            error:   error ?? 'Invalid API key',
            code:    'INVALID_API_KEY',
            register: 'Get a free key at merlinpro.energy/api-keys',
          });
          return;
        }
        keyId = key.id;
      } else if (process.env.REQUIRE_API_KEY === 'true') {
        res.status(401).json({
          error:    'API key required. Include: Authorization: Bearer mk_live_...',
          code:     'MISSING_API_KEY',
          register: 'Register free at merlinpro.energy/api-keys or use the register_agent MCP tool',
        });
        return;
      }

      // ── Capture tool name for usage log ────────────────────────────────
      const toolName = (req.body as { params?: { name?: string } })?.params?.name ?? 'unknown';

      // ── Dispatch to MCP transport ───────────────────────────────────────
      const srv = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await srv.connect(transport);
      await transport.handleRequest(req, res, req.body);

      // ── Track usage after response ──────────────────────────────────────
      if (keyId) {
        const body = req.body as { params?: { arguments?: { industry?: string; zipCode?: string } } };
        await trackUsage(keyId, toolName, {
          industry:   body?.params?.arguments?.industry,
          location:   body?.params?.arguments?.zipCode,
          responseMs: Date.now() - startMs,
        });
      }
    });

    app.get('/health', (_req, res) => {
      res.json({
        status:  'ok',
        server:  'merlin-mcp-agent',
        version: '1.0.0',
        auth:    process.env.REQUIRE_API_KEY === 'true' ? 'required' : 'optional',
      });
    });

    // Discord Interactions Endpoint — handles verification ping + slash command routing
    // Set this URL in Discord Developer Portal → General Information → Interactions Endpoint URL:
    // https://merlin-mcp-agent-production.up.railway.app/discord/interactions
    app.post('/discord/interactions', (req, res) => {
      const { type } = req.body as { type: number };
      // Type 1 = PING (Discord verifying the endpoint)
      if (type === 1) {
        res.json({ type: 1 }); // PONG
        return;
      }
      // All other interactions handled by the Gateway bot (bot.ts)
      // This endpoint just satisfies the Developer Portal requirement
      res.status(400).json({ error: 'Use the Gateway bot for interactions' });
    });

    app.listen(parseInt(port), () => {
      console.log(`🧙 Merlin MCP Sales Agent running on HTTP port ${port}`);
    });
  } else {
    // stdio mode — for Claude Desktop / npx usage
    const srv = createServer();
    const transport = new StdioServerTransport();
    await srv.connect(transport);
    console.error('🧙 Merlin MCP Sales Agent running on stdio');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
