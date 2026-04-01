/**
 * MERLIN NEWSLETTER GENERATOR
 * ============================
 * Generates the daily/weekly "Merlin Energy Insider" newsletter.
 * Combines system health, usage data, energy market news,
 * and AI-generated insights into a professional email.
 *
 * Powered by OpenAI GPT-4 for content generation.
 * Informed by ontology/ domain knowledge.
 *
 * Run by: daily-runner.ts
 * Output: agents/_reports/newsletter-{date}.html + .json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { HealthCheckResult } from './health-monitor.ts';
import type { UsageReport } from './usage-analytics.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// TYPES
// ============================================================

export interface NewsletterContent {
  date: string;
  subject: string;
  preheader: string;
  sections: NewsletterSection[];
  htmlBody: string;
  plainTextBody: string;
  metadata: {
    generatedAt: string;
    healthScore: number;
    quotesGenerated24h: number;
    leadsGenerated24h: number;
    aiGenerated: boolean;
  };
}

interface NewsletterSection {
  id: string;
  title: string;
  content: string;
  type: 'stat' | 'insight' | 'news' | 'alert' | 'action';
  priority: 'high' | 'medium' | 'low';
}

// ============================================================
// ENERGY MARKET NEWS (RSS / API)
// ============================================================

interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  relevance: 'high' | 'medium' | 'low';
}

async function fetchEnergyNews(): Promise<NewsItem[]> {
  // In production, integrate with energyNewsService.ts and rssAutoFetchService.ts
  // For now, return curated placeholder structure
  return [
    {
      title: 'NREL ATB 2025 Preview: BESS Costs Projected to Fall Another 12%',
      summary: 'NREL\'s upcoming Annual Technology Baseline suggests continued LFP cost declines driven by manufacturing scale.',
      url: 'https://atb.nrel.gov/',
      source: 'NREL',
      relevance: 'high',
    },
    {
      title: 'IRA Domestic Content Bonus: New Guidance for 2026',
      summary: 'IRS releases updated guidance on domestic content bonus credits under the Inflation Reduction Act.',
      url: 'https://www.irs.gov/',
      source: 'IRS / DOE',
      relevance: 'high',
    },
    {
      title: 'California PG&E Rate Increase: Commercial Demand Charges Up 8%',
      summary: 'PG&E files for rate increase effective Q2 2026, increasing commercial demand charges by 8% — BESS payback improves.',
      url: 'https://www.pge.com/',
      source: 'PG&E',
      relevance: 'high',
    },
  ];
}

// ============================================================
// AI CONTENT GENERATION
// ============================================================

async function generateAIInsights(
  health: HealthCheckResult,
  usage: UsageReport,
  news: NewsItem[]
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return generateRulesBasedInsights(health, usage, news);
  }

  const prompt = `You are the Merlin Energy AI, generating the daily "Merlin Energy Insider" briefing for founder Robert Christopher.

SYSTEM STATUS:
- Health Score: ${health.score}/100 (${health.overall})
- Action Items: ${health.actionItems.slice(0, 3).join('; ')}

USAGE (24H):
- Quotes Generated: ${usage.quotes.total}
- Leads Captured: ${usage.leads.total}
- Lead Revenue: $${usage.leads.estimatedRevenue.toLocaleString()}
- Biggest Wizard Drop-off: Step ${usage.wizard.dropOffSteps[0]?.step ?? 'N/A'}
- Top Industry: ${usage.topIndustries[0]?.industry ?? 'N/A'}

KPI STATUS:
${usage.kpiStatus.map(k => `- ${k.metric}: ${k.actual} (target: ${k.target}) [${k.status}]`).join('\n')}

ENERGY MARKET NEWS:
${news.map(n => `- ${n.title} (${n.source})`).join('\n')}

Write a concise, intelligent 3-paragraph daily briefing for Robert:
1. Business Performance Summary (specific numbers, trends, what's working)
2. System Health & Technical Priority (what needs fixing today)
3. Market Intelligence & Strategic Opportunity (how today's news affects Merlin)

Be specific, data-driven, and actionable. No fluff. Robert is a busy founder who needs signal, not noise.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? generateRulesBasedInsights(health, usage, news);
  } catch (err) {
    console.warn('OpenAI not available, using rules-based insights:', err);
    return generateRulesBasedInsights(health, usage, news);
  }
}

function generateRulesBasedInsights(health: HealthCheckResult, usage: UsageReport, news: NewsItem[]): string {
  const lines: string[] = [];

  // Paragraph 1: Business
  lines.push(`📊 **Business Performance:** In the last 24 hours, Merlin generated ${usage.quotes.total} TrueQuote™ analyses and captured ${usage.leads.total} leads ($${usage.leads.estimatedRevenue.toLocaleString()} in revenue). ` +
    `Top performing vertical: ${usage.topIndustries[0]?.industry ?? 'N/A'}. ` +
    `Lead conversion rate: ${Math.round(usage.leads.conversionRate * 100)}% vs 40% target. ` +
    `Wizard completion: ${Math.round(usage.wizard.overallConversion * 100)}% overall.`);

  // Paragraph 2: Technical
  const techStatus = health.overall === 'healthy' ? 'All systems green.' :
    health.overall === 'degraded' ? `${health.actionItems[0]}` :
    `🚨 CRITICAL: ${health.actionItems[0]}`;
  lines.push(`🔧 **System Health (${health.score}/100):** ${techStatus} Biggest wizard drop-off at Step ${usage.wizard.dropOffSteps[0]?.step ?? 'N/A'} (${Math.round((usage.wizard.dropOffSteps[0]?.dropRate ?? 0) * 100)}% leave here). ${health.actionItems.length > 1 ? `Other items: ${health.actionItems[1]}` : ''}`);

  // Paragraph 3: Market
  const topNews = news.find(n => n.relevance === 'high');
  lines.push(`🌎 **Market Intelligence:** ${topNews ? `${topNews.title} — ${topNews.summary}` : 'No major energy news today.'} Rate increases in key markets continue to improve BESS ROI. Recommend updating utility rate data for Q2 2026.`);

  return lines.join('\n\n');
}

// ============================================================
// HTML EMAIL GENERATION
// ============================================================

function generateHTMLEmail(content: Omit<NewsletterContent, 'htmlBody' | 'plainTextBody'>, aiInsights: string, news: NewsItem[]): string {
  const { date, sections, metadata } = content;

  const healthEmoji = metadata.healthScore >= 90 ? '🟢' : metadata.healthScore >= 70 ? '🟡' : '🔴';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Merlin Energy Insider — ${date}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 0; }
    .wrapper { max-width: 640px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #0f6b3c 100%); padding: 32px; color: white; }
    .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.8; font-size: 14px; }
    .health-banner { padding: 16px 32px; background: ${metadata.healthScore >= 90 ? '#d1fae5' : metadata.healthScore >= 70 ? '#fef9c3' : '#fee2e2'}; border-left: 4px solid ${metadata.healthScore >= 90 ? '#10b981' : metadata.healthScore >= 70 ? '#f59e0b' : '#ef4444'}; }
    .health-banner p { margin: 0; font-size: 14px; font-weight: 600; }
    .section { padding: 24px 32px; border-bottom: 1px solid #e5e7eb; }
    .section h2 { margin: 0 0 12px; font-size: 16px; color: #111827; font-weight: 700; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 16px 0; }
    .stat-box { background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-box .value { font-size: 28px; font-weight: 800; color: #1e3a5f; }
    .stat-box .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .insight-box { background: #eff6ff; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    .action-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .kpi-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-yellow { background: #fef9c3; color: #92400e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .news-item { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .news-item h3 { margin: 0 0 4px; font-size: 14px; color: #111827; }
    .news-item p { margin: 0; font-size: 13px; color: #6b7280; }
    .footer { padding: 24px 32px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🧙 Merlin Energy Insider</h1>
      <p>Daily briefing for Robert Christopher — ${date}</p>
    </div>

    <div class="health-banner">
      <p>${healthEmoji} System Health: ${metadata.healthScore}/100 &nbsp;|&nbsp; 📊 Quotes (24h): ${metadata.quotesGenerated24h} &nbsp;|&nbsp; 🎯 Leads (24h): ${metadata.leadsGenerated24h}</p>
    </div>

    <div class="section">
      <h2>🤖 AI Daily Briefing</h2>
      <div class="insight-box">${aiInsights.replace(/\*\*/g, '')}</div>
    </div>

    <div class="section">
      <h2>📊 24-Hour Stats</h2>
      <div class="stats-grid">
        ${sections.filter(s => s.type === 'stat').map(s => `
        <div class="stat-box">
          <div class="value">${s.content}</div>
          <div class="label">${s.title}</div>
        </div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2>🎯 KPI Dashboard</h2>
      ${sections.filter(s => s.type === 'insight').map(s => `
      <div class="kpi-row">
        <span>${s.title}</span>
        <span class="badge badge-${s.priority === 'high' ? 'green' : s.priority === 'medium' ? 'yellow' : 'red'}">${s.content}</span>
      </div>`).join('')}
    </div>

    <div class="section">
      <h2>⚡ Action Items</h2>
      ${sections.filter(s => s.type === 'alert').map(s => `
      <div class="action-item">
        <span>${s.priority === 'high' ? '🚨' : '⚠️'}</span>
        <span><strong>${s.title}:</strong> ${s.content}</span>
      </div>`).join('') || '<p style="color:#6b7280;font-size:14px">✅ No critical action items today.</p>'}
    </div>

    <div class="section">
      <h2>🌎 Energy Market News</h2>
      ${news.map(n => `
      <div class="news-item">
        <h3>${n.title} <span style="font-size:11px;color:#6b7280">[${n.source}]</span></h3>
        <p>${n.summary}</p>
      </div>`).join('')}
    </div>

    <div class="footer">
      <p>Merlin Energy Insider — Powered by TrueQuote™ AI | merlinpro.energy</p>
      <p>Generated at ${metadata.generatedAt} | ${metadata.aiGenerated ? 'AI-assisted' : 'Rules-based'} content</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================
// MAIN GENERATOR
// ============================================================

export async function generateNewsletter(
  health: HealthCheckResult,
  usage: UsageReport
): Promise<NewsletterContent> {
  console.log('📰 Generating Merlin Energy Insider newsletter...');

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const news = await fetchEnergyNews();
  const aiInsights = await generateAIInsights(health, usage, news);

  // Build sections
  const sections: NewsletterSection[] = [
    // Stat sections
    { id: 'quotes', title: 'Quotes Generated', content: String(usage.quotes.total), type: 'stat', priority: 'medium' },
    { id: 'leads', title: 'Leads Captured', content: String(usage.leads.total), type: 'stat', priority: 'medium' },
    { id: 'revenue', title: 'Lead Revenue', content: `$${usage.leads.estimatedRevenue.toLocaleString()}`, type: 'stat', priority: 'high' },

    // KPI insights
    ...usage.kpiStatus.map(kpi => ({
      id: kpi.metric.toLowerCase().replace(/\s/g, '-'),
      title: kpi.metric,
      content: `${kpi.actual} / ${kpi.target}`,
      type: 'insight' as const,
      priority: kpi.status === 'on-track' ? 'high' as const : kpi.status === 'at-risk' ? 'medium' as const : 'low' as const,
    })),

    // Alerts
    ...health.actionItems.map((item, i) => ({
      id: `alert-${i}`,
      title: item.includes('CRITICAL') ? 'Critical Issue' : 'Warning',
      content: item.replace(/^\S+\s*/, ''),
      type: 'alert' as const,
      priority: item.includes('CRITICAL') ? 'high' as const : 'medium' as const,
    })),
  ];

  const baseContent = {
    date,
    subject: `🧙 Merlin Daily: ${health.score}/100 health | ${usage.quotes.total} quotes | ${usage.leads.total} leads`,
    preheader: `${health.overall === 'healthy' ? '✅ All systems green' : health.overall === 'degraded' ? '⚠️ Some warnings' : '🚨 Critical issues'} — ${usage.leads.estimatedRevenue.toLocaleString()} in lead revenue today`,
    sections,
    metadata: {
      generatedAt: new Date().toISOString(),
      healthScore: health.score,
      quotesGenerated24h: usage.quotes.total,
      leadsGenerated24h: usage.leads.total,
      aiGenerated: !!process.env.OPENAI_API_KEY,
    },
  };

  const htmlBody = generateHTMLEmail(baseContent, aiInsights, news);
  const plainTextBody = `MERLIN ENERGY INSIDER — ${date}\n\n${aiInsights}\n\nHealth Score: ${health.score}/100\nQuotes: ${usage.quotes.total}\nLeads: ${usage.leads.total}\nRevenue: $${usage.leads.estimatedRevenue.toLocaleString()}\n\nAction Items:\n${health.actionItems.join('\n')}`;

  return { ...baseContent, htmlBody, plainTextBody };
}

// ============================================================
// SAVE NEWSLETTER
// ============================================================

export async function saveNewsletter(content: NewsletterContent): Promise<{ htmlPath: string; jsonPath: string }> {
  const reportsDir = path.join(__dirname, '_reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const dateStr = new Date().toISOString().split('T')[0];
  const htmlPath = path.join(reportsDir, `newsletter-${dateStr}.html`);
  const jsonPath = path.join(reportsDir, `newsletter-${dateStr}.json`);

  fs.writeFileSync(htmlPath, content.htmlBody);
  fs.writeFileSync(jsonPath, JSON.stringify({ ...content, htmlBody: '[see .html file]' }, null, 2));

  console.log(`✅ Newsletter saved: ${htmlPath}`);
  return { htmlPath, jsonPath };
}

// ============================================================
// EMAIL DELIVERY
// ============================================================

export async function sendNewsletter(content: NewsletterContent, recipientEmail: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (!resendKey && !sendgridKey) {
    console.warn('⚠️ No email provider configured. Newsletter saved locally only.');
    return false;
  }

  try {
    if (resendKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Merlin AI <agent@merlinpro.energy>',
          to: recipientEmail,
          subject: content.subject,
          html: content.htmlBody,
          text: content.plainTextBody,
        }),
      });
      if (response.ok) {
        console.log(`✅ Newsletter sent to ${recipientEmail} via Resend`);
        return true;
      }
    }
  } catch (err) {
    console.error('Email delivery failed:', err);
  }
  return false;
}
