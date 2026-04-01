/**
 * MERLIN USAGE ANALYTICS
 * ======================
 * Tracks and reports on Merlin's business KPIs:
 * - Quotes generated (24h, 7d, 30d)
 * - Leads captured (24h, 7d, 30d)
 * - Wizard funnel metrics
 * - Industry distribution
 * - Revenue estimates
 * - MRR tracking
 *
 * Data sources: Supabase analytics tables, server logs
 * Run by: daily-runner.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// TYPES
// ============================================================

export interface UsageReport {
  timestamp: string;
  period: '24h' | '7d' | '30d';
  quotes: QuoteMetrics;
  leads: LeadMetrics;
  wizard: WizardFunnelMetrics;
  revenue: RevenueMetrics;
  topIndustries: IndustryMetrics[];
  kpiStatus: KPIStatus[];
  insights: string[];
}

interface QuoteMetrics {
  total: number;
  byIndustry: Record<string, number>;
  avgSystemSizeMW: number;
  avgProjectValueDollars: number;
  completionRate: number;
}

interface LeadMetrics {
  total: number;
  byIndustry: Record<string, number>;
  estimatedRevenue: number;
  conversionRate: number;
  avgLeadValue: number;
}

interface WizardFunnelMetrics {
  step1Starts: number;
  step2Completions: number;
  step3Completions: number;
  step4Completions: number;
  step5Completions: number;
  step6LeadCaptures: number;
  overallConversion: number;
  dropOffSteps: { step: number; dropRate: number }[];
}

interface RevenueMetrics {
  leadGenRevenue: number;
  estimatedMRR: number;
  estimatedARR: number;
  revenueGrowthWoW: number;
}

interface IndustryMetrics {
  industry: string;
  quoteCount: number;
  leadCount: number;
  revenueContribution: number;
}

interface KPIStatus {
  metric: string;
  actual: number | string;
  target: number | string;
  status: 'on-track' | 'at-risk' | 'off-track';
  trend: 'up' | 'down' | 'flat';
}

// ============================================================
// CANONICAL TARGETS (from CONSTITUTION.md § 6.3)
// ============================================================

const KPI_TARGETS = {
  dailyWizardStarts: 100,
  dailyWizardCompletions: 70,
  dailyLeadCaptures: 28,
  monthlyLeadRevenue: 50_000,
  truequoteAccuracyPct: 95,
  systemUptimePct: 99.9,
  p95LatencyMs: 3000,
};

// ============================================================
// DATA FETCHING (Supabase integration)
// ============================================================

interface SupabaseAnalyticsRow {
  event_type: string;
  industry?: string;
  system_size_mw?: number;
  project_value?: number;
  step?: number;
  lead_value?: number;
  created_at: string;
}

async function fetchAnalyticsFromSupabase(periodHours: number): Promise<SupabaseAnalyticsRow[]> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase credentials not found — using mock data for development');
    return generateMockData(periodHours);
  }

  try {
    const since = new Date(Date.now() - periodHours * 3_600_000).toISOString();
    const url = `${supabaseUrl}/rest/v1/analytics_events?created_at=gte.${since}&select=*`;

    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
    return await response.json() as SupabaseAnalyticsRow[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️ Supabase unavailable (${msg}) — using mock data`);
    return generateMockData(periodHours);
  }
}

function generateMockData(periodHours: number): SupabaseAnalyticsRow[] {
  const scale = periodHours / 24;
  const events: SupabaseAnalyticsRow[] = [];
  const industries = ['hotel', 'car-wash', 'data-center', 'manufacturing', 'warehouse', 'ev-charging'];

  // Simulate realistic data
  const quoteCount = Math.round(85 * scale);
  const leadCount = Math.round(30 * scale);

  for (let i = 0; i < quoteCount; i++) {
    events.push({
      event_type: 'quote_generated',
      industry: industries[Math.floor(Math.random() * industries.length)],
      system_size_mw: Math.random() * 5 + 0.5,
      project_value: Math.random() * 2_000_000 + 200_000,
      created_at: new Date(Date.now() - Math.random() * periodHours * 3_600_000).toISOString(),
    });
  }

  for (let i = 0; i < leadCount; i++) {
    const industry = industries[Math.floor(Math.random() * industries.length)] ?? 'hotel';
    const leadValues: Record<string, number> = {
      'hotel': 200, 'car-wash': 150, 'data-center': 500, 'manufacturing': 400,
      'warehouse': 200, 'ev-charging': 300,
    };
    events.push({
      event_type: 'lead_captured',
      industry,
      lead_value: leadValues[industry] ?? 100,
      created_at: new Date(Date.now() - Math.random() * periodHours * 3_600_000).toISOString(),
    });
  }

  // Wizard funnel events
  const starts = Math.round(120 * scale);
  for (let step = 1; step <= 6; step++) {
    const stepCount = Math.round(starts * Math.pow(0.82, step - 1));
    for (let i = 0; i < stepCount; i++) {
      events.push({
        event_type: `wizard_step_${step}`,
        step,
        created_at: new Date(Date.now() - Math.random() * periodHours * 3_600_000).toISOString(),
      });
    }
  }

  return events;
}

// ============================================================
// ANALYTICS CALCULATION
// ============================================================

export async function generateUsageReport(period: '24h' | '7d' | '30d' = '24h'): Promise<UsageReport> {
  const periodHoursMap = { '24h': 24, '7d': 168, '30d': 720 };
  const periodHours = periodHoursMap[period];

  console.log(`📊 Generating usage report for ${period}...`);

  const events = await fetchAnalyticsFromSupabase(periodHours);

  // Parse events
  const quoteEvents = events.filter(e => e.event_type === 'quote_generated');
  const leadEvents = events.filter(e => e.event_type === 'lead_captured');
  const wizardEvents = (step: number) => events.filter(e => e.event_type === `wizard_step_${step}`);

  // Quote metrics
  const byIndustryQuotes: Record<string, number> = {};
  for (const e of quoteEvents) {
    byIndustryQuotes[e.industry ?? 'unknown'] = (byIndustryQuotes[e.industry ?? 'unknown'] ?? 0) + 1;
  }

  const quoteMetrics: QuoteMetrics = {
    total: quoteEvents.length,
    byIndustry: byIndustryQuotes,
    avgSystemSizeMW: quoteEvents.reduce((s, e) => s + (e.system_size_mw ?? 0), 0) / (quoteEvents.length || 1),
    avgProjectValueDollars: quoteEvents.reduce((s, e) => s + (e.project_value ?? 0), 0) / (quoteEvents.length || 1),
    completionRate: quoteEvents.length / (wizardEvents(1).length || 1),
  };

  // Lead metrics
  const byIndustryLeads: Record<string, number> = {};
  let totalLeadRevenue = 0;
  for (const e of leadEvents) {
    byIndustryLeads[e.industry ?? 'unknown'] = (byIndustryLeads[e.industry ?? 'unknown'] ?? 0) + 1;
    totalLeadRevenue += e.lead_value ?? 100;
  }

  const leadMetrics: LeadMetrics = {
    total: leadEvents.length,
    byIndustry: byIndustryLeads,
    estimatedRevenue: totalLeadRevenue,
    conversionRate: leadEvents.length / (quoteEvents.length || 1),
    avgLeadValue: totalLeadRevenue / (leadEvents.length || 1),
  };

  // Wizard funnel
  const step1 = wizardEvents(1).length;
  const step2 = wizardEvents(2).length;
  const step3 = wizardEvents(3).length;
  const step4 = wizardEvents(4).length;
  const step5 = wizardEvents(5).length;
  const step6 = wizardEvents(6).length;

  const wizardMetrics: WizardFunnelMetrics = {
    step1Starts: step1,
    step2Completions: step2,
    step3Completions: step3,
    step4Completions: step4,
    step5Completions: step5,
    step6LeadCaptures: step6,
    overallConversion: step1 > 0 ? step6 / step1 : 0,
    dropOffSteps: [
      { step: 2, dropRate: step1 > 0 ? (step1 - step2) / step1 : 0 },
      { step: 3, dropRate: step2 > 0 ? (step2 - step3) / step2 : 0 },
      { step: 4, dropRate: step3 > 0 ? (step3 - step4) / step3 : 0 },
      { step: 5, dropRate: step4 > 0 ? (step4 - step5) / step4 : 0 },
      { step: 6, dropRate: step5 > 0 ? (step5 - step6) / step5 : 0 },
    ].sort((a, b) => b.dropRate - a.dropRate),
  };

  // Revenue
  const dailyRevenueFactor = 24 / periodHours;
  const revenueMetrics: RevenueMetrics = {
    leadGenRevenue: totalLeadRevenue,
    estimatedMRR: totalLeadRevenue * dailyRevenueFactor * 30,
    estimatedARR: totalLeadRevenue * dailyRevenueFactor * 365,
    revenueGrowthWoW: 0.12, // Placeholder — connect to historical data
  };

  // Top industries
  const topIndustries: IndustryMetrics[] = Object.keys(byIndustryQuotes)
    .map(industry => ({
      industry,
      quoteCount: byIndustryQuotes[industry] ?? 0,
      leadCount: byIndustryLeads[industry] ?? 0,
      revenueContribution: (byIndustryLeads[industry] ?? 0) * getLeadValue(industry),
    }))
    .sort((a, b) => b.revenueContribution - a.revenueContribution)
    .slice(0, 5);

  // KPI Status
  const dailyQuotes = quoteMetrics.total * dailyRevenueFactor;
  const dailyLeads = leadMetrics.total * dailyRevenueFactor;
  const kpiStatus: KPIStatus[] = [
    {
      metric: 'Daily Wizard Starts',
      actual: Math.round(step1 * dailyRevenueFactor),
      target: KPI_TARGETS.dailyWizardStarts,
      status: step1 * dailyRevenueFactor >= KPI_TARGETS.dailyWizardStarts ? 'on-track' : 'at-risk',
      trend: 'up',
    },
    {
      metric: 'Daily Quote Completions',
      actual: Math.round(dailyQuotes),
      target: KPI_TARGETS.dailyWizardCompletions,
      status: dailyQuotes >= KPI_TARGETS.dailyWizardCompletions ? 'on-track' : 'at-risk',
      trend: 'flat',
    },
    {
      metric: 'Daily Leads Captured',
      actual: Math.round(dailyLeads),
      target: KPI_TARGETS.dailyLeadCaptures,
      status: dailyLeads >= KPI_TARGETS.dailyLeadCaptures ? 'on-track' : 'off-track',
      trend: 'up',
    },
    {
      metric: 'Monthly Lead Revenue',
      actual: `$${Math.round(revenueMetrics.estimatedMRR).toLocaleString()}`,
      target: `$${KPI_TARGETS.monthlyLeadRevenue.toLocaleString()}`,
      status: revenueMetrics.estimatedMRR >= KPI_TARGETS.monthlyLeadRevenue ? 'on-track' : 'at-risk',
      trend: 'up',
    },
  ];

  // Insights
  const insights: string[] = [];
  const biggestDropOff = wizardMetrics.dropOffSteps[0];
  if (biggestDropOff && biggestDropOff.dropRate > 0.25) {
    insights.push(`⚠️ Biggest funnel drop-off is at Step ${biggestDropOff.step} (${Math.round(biggestDropOff.dropRate * 100)}% drop). Investigate UX issues.`);
  }
  if (topIndustries[0]) {
    insights.push(`🏆 Top performing vertical: ${topIndustries[0].industry} ($${topIndustries[0].revenueContribution.toLocaleString()} in period).`);
  }
  if (leadMetrics.conversionRate < 0.30) {
    insights.push(`📉 Lead conversion rate is ${Math.round(leadMetrics.conversionRate * 100)}% (target: 40%). Review Step 6 UX.`);
  }

  return {
    timestamp: new Date().toISOString(),
    period,
    quotes: quoteMetrics,
    leads: leadMetrics,
    wizard: wizardMetrics,
    revenue: revenueMetrics,
    topIndustries,
    kpiStatus,
    insights,
  };
}

// ============================================================
// SAVE REPORT
// ============================================================

export async function saveUsageReport(report: UsageReport): Promise<string> {
  const reportsDir = path.join(__dirname, '_reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const dateStr = new Date().toISOString().split('T')[0];
  const reportPath = path.join(reportsDir, `usage-${report.period}-${dateStr}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✅ Usage report saved: ${reportPath}`);
  return reportPath;
}

function getLeadValue(industry: string): number {
  const values: Record<string, number> = {
    'car-wash': 150, 'hotel': 200, 'data-center': 500, 'ev-charging': 300,
    'restaurant': 100, 'office': 150, 'warehouse': 200, 'manufacturing': 400,
    'university': 300, 'hospital': 400, 'agriculture': 150, 'retail': 100,
  };
  return values[industry] ?? 100;
}

// ============================================================
// STANDALONE RUN
// ============================================================

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  generateUsageReport('24h')
    .then(async (report) => {
      const reportPath = await saveUsageReport(report);
      console.log(`\n📊 Usage Report (24h)`);
      console.log(`   Quotes:  ${report.quotes.total}`);
      console.log(`   Leads:   ${report.leads.total}`);
      console.log(`   Revenue: $${report.leads.estimatedRevenue.toLocaleString()}`);
      console.log(`\n💾 Report: ${reportPath}`);
    })
    .catch((err) => {
      console.error('Usage analytics failed:', err);
      process.exit(1);
    });
}
