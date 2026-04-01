/**
 * MERLIN DISCORD WEBHOOK UTILITY
 * ================================
 * Send lead alerts and quote events to a Discord channel via webhook.
 * Import this anywhere in the app — no bot process required.
 *
 * Usage:
 *   import { sendLeadAlert, sendQuoteAlert } from '../discord/webhook.js';
 *
 *   // After qualify_lead:
 *   await sendLeadAlert({ companyName: 'Acme Hotel', industry: 'hotel', score: 82, tier: 'hot', ... });
 *
 *   // After generate_truequote:
 *   await sendQuoteAlert({ industry: 'car-wash', systemSizeMW: 0.5, totalCostDollars: 450000, ... });
 *
 * Setup: set DISCORD_LEAD_WEBHOOK_URL in .env (see discord/README.md)
 */

const WEBHOOK_URL = process.env.DISCORD_LEAD_WEBHOOK_URL;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface LeadAlert {
  companyName: string;
  industry: string;
  score: number;
  tier: 'hot' | 'warm' | 'nurture';
  decisionTimeline?: string;
  currentPain?: string;
  numberOfLocations?: number;
  source?: string;
  action?: string;
  recommendations?: string[];
}

export interface QuoteAlert {
  companyName?: string;
  industry: string;
  zipCode?: string;
  systemSizeMW: number;
  systemCapacityKwh?: number;
  totalCostDollars: number;
  netCostDollars?: number;
  annualSavingsDollars: number;
  paybackYears: number;
  npvDollars?: number;
}

export interface ProposalAlert {
  companyName: string;
  format: string;
  industry: string;
  systemSizeMW: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function tierEmoji(tier: string): string {
  return tier === 'hot' ? '🔥' : tier === 'warm' ? '🌤️' : '❄️';
}

function tierColor(tier: string): number {
  return tier === 'hot' ? 0xFF4444 : tier === 'warm' ? 0xFFAA00 : 0x4488FF;
}

function usd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

async function postWebhook(payload: object): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn('[Merlin Discord] DISCORD_LEAD_WEBHOOK_URL not set — skipping webhook');
    return;
  }
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[Merlin Discord] Webhook failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('[Merlin Discord] Webhook error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// LEAD ALERT — call after qualify_lead
// ─────────────────────────────────────────────────────────────

export async function sendLeadAlert(lead: LeadAlert): Promise<void> {
  const fields = [
    { name: 'Score',     value: `**${lead.score}/100** — ${lead.tier.toUpperCase()}`, inline: true },
    { name: 'Industry',  value: lead.industry, inline: true },
    ...(lead.numberOfLocations && lead.numberOfLocations > 1
      ? [{ name: 'Locations', value: String(lead.numberOfLocations), inline: true }]
      : []),
    ...(lead.decisionTimeline
      ? [{ name: 'Timeline', value: lead.decisionTimeline, inline: true }]
      : []),
    ...(lead.currentPain
      ? [{ name: 'Pain Point', value: lead.currentPain, inline: false }]
      : []),
    ...(lead.action
      ? [{ name: '⚡ Next Action', value: lead.action, inline: false }]
      : []),
    ...(lead.recommendations?.length
      ? [{ name: 'Recommendations', value: lead.recommendations.map(r => `• ${r}`).join('\n'), inline: false }]
      : []),
    ...(lead.source
      ? [{ name: 'Source', value: lead.source, inline: true }]
      : []),
  ];

  await postWebhook({
    username: 'Merlin Lead Bot',
    embeds: [{
      title: `${tierEmoji(lead.tier)} New Lead — ${lead.companyName}`,
      color: tierColor(lead.tier),
      fields,
      footer: { text: 'Merlin Lead Intelligence • merlinpro.energy' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ─────────────────────────────────────────────────────────────
// QUOTE ALERT — call after generate_truequote
// ─────────────────────────────────────────────────────────────

export async function sendQuoteAlert(quote: QuoteAlert): Promise<void> {
  await postWebhook({
    username: 'Merlin Quote Bot',
    embeds: [{
      title: `⚡ TrueQuote™ Generated${quote.companyName ? ` — ${quote.companyName}` : ''}`,
      color: 0xF97316,
      fields: [
        { name: 'Industry',      value: quote.industry, inline: true },
        ...(quote.zipCode ? [{ name: 'ZIP', value: quote.zipCode, inline: true }] : []),
        { name: 'System Size',   value: `${quote.systemSizeMW} MW${quote.systemCapacityKwh ? ` · ${quote.systemCapacityKwh.toLocaleString()} kWh` : ''}`, inline: true },
        { name: 'Total Cost',    value: usd(quote.totalCostDollars), inline: true },
        ...(quote.netCostDollars
          ? [{ name: 'After ITC', value: usd(quote.netCostDollars), inline: true }]
          : []),
        { name: 'Annual Savings', value: usd(quote.annualSavingsDollars), inline: true },
        { name: 'Payback',        value: `${quote.paybackYears.toFixed(1)} years`, inline: true },
        ...(quote.npvDollars
          ? [{ name: 'NPV (25yr)', value: usd(quote.npvDollars), inline: true }]
          : []),
      ],
      footer: { text: 'Merlin TrueQuote™ • merlinpro.energy' },
      timestamp: new Date().toISOString(),
    }],
  });
}

// ─────────────────────────────────────────────────────────────
// PROPOSAL ALERT — call after generate_proposal
// ─────────────────────────────────────────────────────────────

export async function sendProposalAlert(proposal: ProposalAlert): Promise<void> {
  await postWebhook({
    username: 'Merlin Proposal Bot',
    embeds: [{
      title: `📄 Proposal Generated — ${proposal.companyName}`,
      color: 0x8B5CF6,
      fields: [
        { name: 'Format',      value: proposal.format,                      inline: true },
        { name: 'Industry',    value: proposal.industry,                    inline: true },
        { name: 'System Size', value: `${proposal.systemSizeMW} MW`,        inline: true },
      ],
      footer: { text: 'Merlin Proposals • merlinpro.energy' },
      timestamp: new Date().toISOString(),
    }],
  });
}
