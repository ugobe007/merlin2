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
    'peak-shaving', 'backup-power', 'TOU-arbitrage', 'solar-self-consumption', 'demand-charge-reduction'
  ]).default('peak-shaving').describe('Primary application for the BESS'),
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

async function generateQuote(input: z.infer<typeof QuoteInputSchema>) {
  // In production, this would call the actual Merlin API
  // For the MCP server, we calculate with the canonical algorithm

  const { industry, peakDemandKw, monthlyBillDollars, zipCode, primaryUseCase, hasSolar } = input;

  // Canonical TrueQuote™ estimation (simplified for MCP — full version in unifiedQuoteCalculator.ts)
  const industryDemandFactor: Record<string, number> = {
    'car-wash': 0.55, 'hotel': 0.40, 'data-center': 0.90, 'ev-charging': 0.60,
    'restaurant': 0.30, 'office': 0.35, 'warehouse': 0.25, 'manufacturing': 0.55,
    'university': 0.40, 'hospital': 0.85, 'agriculture': 0.20, 'retail': 0.30,
  };

  const factor = industryDemandFactor[industry] ?? 0.35;
  const recommendedSizeMW = (peakDemandKw * factor) / 1000;
  const roundedSizeMW = Math.ceil(recommendedSizeMW * 4) / 4; // round to nearest 0.25 MW
  const durationHours = primaryUseCase === 'backup-power' ? 8 : 4;

  // Cost estimates (NREL StoreFAST 2024 benchmarks)
  const bessCapexPerKwh = 350; // $/kWh — 2024 commercial BESS
  const systemCapacityKwh = roundedSizeMW * 1000 * durationHours;
  const totalCostDollars = systemCapacityKwh * bessCapexPerKwh * 1.35; // + BOS/install

  const itcCredit = totalCostDollars * 0.30;
  const netCostDollars = totalCostDollars - itcCredit;

  // Savings estimate based on monthly bill
  const demandSavingsPercent = 0.20; // 15-25% typical demand charge reduction
  const annualBill = monthlyBillDollars * 12;
  const annualSavingsDollars = annualBill * demandSavingsPercent;

  const paybackYears = netCostDollars / annualSavingsDollars;

  // NPV at 7% discount rate, 25-year horizon
  const discountRate = 0.07;
  const escalationRate = 0.035; // 3.5% utility rate escalation
  let npv = -netCostDollars;
  for (let year = 1; year <= 25; year++) {
    npv += annualSavingsDollars * Math.pow(1 + escalationRate, year) / Math.pow(1 + discountRate, year);
  }

  const co2AvoidedTons = (systemCapacityKwh * 250) / 1000; // ~250 cycles/year, ~1kg CO2/kWh avoided

  return {
    recommendation: {
      systemSizeMW: roundedSizeMW,
      durationHours,
      batteryChemistry: 'LFP (Lithium Iron Phosphate)',
      primaryUseCase,
    },
    financials: {
      totalInstalledCost: Math.round(totalCostDollars),
      itcCredit: Math.round(itcCredit),
      netCostAfterITC: Math.round(netCostDollars),
      annualSavings: Math.round(annualSavingsDollars),
      simplePayback: Math.round(paybackYears * 10) / 10,
      npv25Year: Math.round(npv),
      irrEstimate: `${Math.round((annualSavingsDollars / netCostDollars) * 100)}%`,
      co2AvoidedTonsPerYear: Math.round(co2AvoidedTons),
    },
    disclaimer: '±15% accuracy. Based on NREL ATB 2024 benchmarks. Full analysis via Merlin Pro at merlinpro.energy',
    nextStep: `Visit merlinpro.energy or call our sales team for a full TrueQuote™ analysis with your actual utility rate data for ${zipCode}.`,
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
      const srv = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      await srv.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', server: 'merlin-mcp-agent', version: '1.0.0' });
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
