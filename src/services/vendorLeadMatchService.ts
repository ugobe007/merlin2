/**
 * =============================================================================
 * VENDOR LEAD MATCH SERVICE
 * =============================================================================
 *
 * Scores every unmatched opportunity for BESS / solar / generator fit,
 * routes qualified leads to the right vendors, writes rows to vendor_leads,
 * and fires email + webhook notifications.
 *
 * Called nightly by agents/lead-matcher.ts (via daily-runner.ts Step 5).
 * Can also be called on-demand from the admin dashboard.
 *
 * Design:
 *   - Pure server-side (Node.js / tsx) — uses SUPABASE SERVICE_ROLE_KEY
 *   - Idempotent: UNIQUE(opportunity_id, vendor_id) constraint prevents dupes
 *   - Non-blocking: notifications are fire-and-forget; DB writes are primary
 *   - Score threshold is vendor-configurable (vendors.lead_min_score)
 *
 * Scoring model (0–100 per category):
 *   BESS    — energy_project, bess_procurement, rfq, high_utility_exposure,
 *             data_center / manufacturing / hospital / cold_storage industries
 *   Solar   — solar_procurement, sustainability_initiative, energy_project,
 *             construction, retail / education / hospitality industries
 *   Generator — generator_procurement, construction, expansion,
 *               backup_power, hospital / data_center / manufacturing
 * =============================================================================
 */

import { type SupabaseClient } from "@supabase/supabase-js";
import type { OpportunitySignal, IndustryType } from "../types/opportunity";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadScore {
  bess: number;
  solar: number;
  generator: number;
  overall: number;
  category: "bess" | "solar" | "generator" | "multi";
}

export interface VendorLead {
  id?: string;
  opportunity_id: string;
  vendor_id: string;
  bess_score: number;
  solar_score: number;
  generator_score: number;
  overall_score?: number;
  lead_category: "bess" | "solar" | "generator" | "multi";
  signals: string[];
  industry?: string | null;
  company_name?: string | null;
  source_url?: string | null;
  description?: string | null;
  status: "new" | "sent" | "viewed" | "contacted" | "won" | "lost" | "archived";
  notified_at?: string | null;
}

interface ScoredOpportunity {
  id: string;
  company_name: string;
  description: string;
  source_url: string;
  signals: OpportunitySignal[];
  industry?: IndustryType | null;
  confidence_score: number;
  score: LeadScore;
}

interface Vendor {
  id: string;
  company_name: string;
  email: string;
  notification_email?: string | null;
  webhook_url?: string | null;
  specialty: "battery" | "solar" | "generator" | "inverter" | "ems" | "bos" | "epc" | "integrator";
  status: "approved" | "pending" | "suspended";
  lead_min_score: number;
}

export interface LeadMatchResult {
  opportunitiesScanned: number;
  opportunitiesQualified: number;
  leadsCreated: number;
  leadsAlreadyExisted: number;
  notificationsSent: number;
  notificationErrors: number;
  byCategory: { bess: number; solar: number; generator: number; multi: number };
  topLeads: Array<{
    id: string;
    company: string;
    score: number;
    category: string;
    vendors: number;
  }>;
  errors: string[];
}

// ─── Score weights ─────────────────────────────────────────────────────────────

const BESS_SIGNAL_SCORES: Partial<Record<OpportunitySignal, number>> = {
  bess_procurement: 40,
  rfq: 30,
  procurement_awarded: 22, // award = active market, co-vendor / expansion opp
  energy_project: 22,
  high_utility_exposure: 18,
  construction: 12,
  funding: 10,
  expansion: 8,
  facility_upgrade: 8,
  energy_upgrade: 15,
  permit_filed: 14,
  interconnection_application: 20,
  sustainability_initiative: 8,
  // Phase 4
  microgrid_procurement: 38,
  virtual_power_plant: 22,
  c_and_i_solar: 15,
};

const BESS_INDUSTRY_BONUS: Partial<Record<IndustryType, number>> = {
  data_center: 20,
  manufacturing: 18,
  healthcare: 16,
  hospital: 16, // hospital is its own IndustryType distinct from healthcare
  cold_storage: 15,
  logistics: 12,
  truck_stop: 14, // high demand-charge exposure from 24/7 EV charging + HVAC
  car_wash: 12, // peak-demand spikes from high-draw equipment
  automotive: 10,
  education: 8,
  hospitality: 8,
  retail: 6,
  gym: 8, // peak-demand spikes during peak hours
  agricultural: 7,
};

const SOLAR_SIGNAL_SCORES: Partial<Record<OpportunitySignal, number>> = {
  solar_procurement: 40,
  c_and_i_solar: 42,
  procurement_awarded: 18,
  sustainability_initiative: 25,
  energy_project: 20,
  construction: 15,
  new_opening: 12,
  funding: 10,
  expansion: 8,
  facility_upgrade: 10,
  energy_upgrade: 12,
  permit_filed: 14,
  rfq: 20,
  microgrid_procurement: 18, // microgrids almost always include solar
  virtual_power_plant: 14,
};

const SOLAR_INDUSTRY_BONUS: Partial<Record<IndustryType, number>> = {
  retail: 18,
  education: 18,
  hospitality: 15,
  manufacturing: 12,
  logistics: 12,
  healthcare: 10,
  automotive: 10,
  data_center: 8,
};

const GENERATOR_SIGNAL_SCORES: Partial<Record<OpportunitySignal, number>> = {
  generator_procurement: 40,
  procurement_awarded: 20,
  construction: 22,
  expansion: 18,
  new_opening: 15,
  facility_upgrade: 12,
  energy_upgrade: 10,
  high_utility_exposure: 12,
  funding: 8,
  rfq: 25,
  permit_filed: 16,
  microgrid_procurement: 28, // microgrids need dispatchable backup — generators are key
};

const GENERATOR_INDUSTRY_BONUS: Partial<Record<IndustryType, number>> = {
  healthcare: 22,
  data_center: 22,
  manufacturing: 18,
  logistics: 14,
  education: 12,
  hospitality: 10,
  automotive: 10,
  retail: 6,
};

// ─── Scoring engine ────────────────────────────────────────────────────────────

export function scoreOpportunity(
  signals: OpportunitySignal[],
  industry: IndustryType | null | undefined,
  description: string
): LeadScore {
  const descLower = (description ?? "").toLowerCase();

  // ── Live text-based anchor detection ────────────────────────────────────────
  // Scoring must NOT rely solely on stored signals because existing DB rows were
  // scraped before Phase 2/3/4 keywords were added. We detect procurement intent
  // directly from description text so stale signals can't create false negatives
  // OR false positives.

  const textHasBESS =
    /battery.storage|energy.storage|\bbess\b|megapack|powerwall|peak.shav|\bstorage\b.{0,30}\b(?:rfp|rfq|project)\b/i.test(
      descLower
    );

  const textHasBESSProcurement =
    textHasBESS &&
    /\brfp\b|\brfq\b|rfps|rfqs|procurement|solicitation|\bbid\b|\baward\b|request.for.proposal/i.test(
      descLower
    );

  // Solar: "solar" within 100 chars of a procurement keyword (either order)
  const textHasSolarProcurement =
    /solar.{0,100}(?:rfp|rfq|procurement|\bppa\b|install|\bbid\b|award|contract)|(?:rfp|rfq|procurement|\bppa\b|\bbid\b|award|contract).{0,100}solar/i.test(
      descLower
    );

  const textHasGenerator =
    /\bgenerator\b|genset|standby.power|backup.power|diesel.gen|emergency.power|critical.load|\bups\b.*power/i.test(
      descLower
    );

  // Completion text detection — already-deployed projects should not be routed as hot leads
  const textIsCompletion =
    /\b(?:commercial\s+operation|enters?\s+commercial|comes?\s+online|came\s+online|goes?\s+live|went\s+live|now\s+operational|has\s+been\s+(?:installed|deployed|commissioned|completed|energized)|already\s+(?:installed|operational|complete)|installation\s+(?:complete|finished))\b/i.test(
      descLower
    );

  // Supplement stored signals with live detections (handles stale DB rows)
  const effectiveSignals = new Set(signals);
  if (textHasBESSProcurement) effectiveSignals.add("bess_procurement" as OpportunitySignal);
  if (textHasSolarProcurement) effectiveSignals.add("solar_procurement" as OpportunitySignal);
  if (textHasGenerator) effectiveSignals.add("generator_procurement" as OpportunitySignal);

  // "energy storage" + energy_project signal = BESS project (energy storage IS BESS).
  // Promote to bess_procurement so it qualifies for vendor routing.
  // Exception: don't promote completion articles (project already done).
  if (
    textHasBESS &&
    !textIsCompletion &&
    (signals.includes("energy_project") ||
      signals.includes("procurement_awarded") ||
      signals.includes("funding"))
  ) {
    effectiveSignals.add("bess_procurement" as OpportunitySignal);
  }

  // ── Signal-based promotion ────────────────────────────────────────────────
  // The scraper sets signals from article keyword detection — those signals ARE
  // the evidence. Promote to procurement context even when the RSS description
  // is too short to contain exact "battery storage" / "solar" text.
  // Guard: skip completion articles (already-deployed = market intel, not lead).
  if (!textIsCompletion) {
    // RFQ + any energy signal = active energy-sector procurement
    if (
      signals.includes("rfq") &&
      (signals.includes("energy_project") ||
        signals.includes("sustainability_initiative") ||
        signals.includes("high_utility_exposure"))
    ) {
      effectiveSignals.add("bess_procurement" as OpportunitySignal);
    }
    // High utility exposure + energy project = facility buyer seeking cost relief
    if (signals.includes("high_utility_exposure") && signals.includes("energy_project")) {
      effectiveSignals.add("bess_procurement" as OpportunitySignal);
    }
    // Description mentions "solar" + has any energy signal = solar project lead
    if (
      /\bsolar\b/i.test(descLower) &&
      (signals.includes("energy_project") ||
        signals.includes("rfq") ||
        signals.includes("sustainability_initiative"))
    ) {
      effectiveSignals.add("solar_procurement" as OpportunitySignal);
    }
  }
  const sigs = Array.from(effectiveSignals) as OpportunitySignal[];

  // BESS score
  let bess = 0;
  for (const sig of sigs) bess += BESS_SIGNAL_SCORES[sig] ?? 0;
  if (industry) bess += BESS_INDUSTRY_BONUS[industry] ?? 0;
  if (textHasBESS) bess += 12;
  if (/\bkwh\b|\bmwh\b|storage.capacity|c-rate/i.test(descLower)) bess += 8;
  // Co-occurrence bonuses (use effective sigs)
  if (sigs.includes("microgrid_procurement") && sigs.includes("bess_procurement")) bess += 14;
  if (sigs.includes("virtual_power_plant") && sigs.includes("bess_procurement")) bess += 12;
  if (sigs.includes("c_and_i_solar") && sigs.includes("bess_procurement")) bess += 10;
  if (sigs.includes("permit_filed") && sigs.includes("construction")) bess += 8;
  if (sigs.includes("interconnection_application") && industry) bess += 10;

  // Solar score
  let solar = 0;
  for (const sig of sigs) solar += SOLAR_SIGNAL_SCORES[sig] ?? 0;
  if (industry) solar += SOLAR_INDUSTRY_BONUS[industry] ?? 0;
  if (/\bsolar\b|photovoltaic|\bpv\b|rooftop.solar|solar.panel/i.test(descLower)) solar += 12;
  if (/\bkwp\b|\bmwp\b|\bppa\b|power.purchase.agreement/i.test(descLower)) solar += 8;
  if (sigs.includes("c_and_i_solar") && sigs.includes("solar_procurement")) solar += 10;
  if (sigs.includes("c_and_i_solar") && sigs.includes("sustainability_initiative")) solar += 8;
  if (sigs.includes("microgrid_procurement") && sigs.includes("solar_procurement")) solar += 8;

  // Generator score
  let generator = 0;
  for (const sig of sigs) generator += GENERATOR_SIGNAL_SCORES[sig] ?? 0;
  if (industry) generator += GENERATOR_INDUSTRY_BONUS[industry] ?? 0;
  if (textHasGenerator) generator += 14;
  if (/\bkva\b|\bkw.generator|emergency.power|critical.load/i.test(descLower)) generator += 8;
  if (sigs.includes("microgrid_procurement") && sigs.includes("generator_procurement"))
    generator += 12;
  if (sigs.includes("permit_filed") && sigs.includes("construction")) generator += 8;

  // ── Anchor guards ────────────────────────────────────────────────────────────
  // A category scores ZERO unless there is direct evidence of procurement or
  // relevant technology in the article. This eliminates crane factories,
  // logistics warehouse expansions, and general sustainability news.

  const hasBESSAnchor =
    sigs.includes("bess_procurement") ||
    sigs.includes("interconnection_application") ||
    sigs.includes("microgrid_procurement") ||
    sigs.includes("virtual_power_plant") ||
    textHasBESS; // article must at least mention BESS/battery storage

  const hasSolarAnchor =
    sigs.includes("solar_procurement") || sigs.includes("c_and_i_solar") || textHasSolarProcurement; // solar keyword near procurement keyword

  const hasGeneratorAnchor = sigs.includes("generator_procurement") || textHasGenerator; // article must mention generator/backup power

  if (!hasBESSAnchor) bess = 0;
  if (!hasSolarAnchor) solar = 0;
  if (!hasGeneratorAnchor) generator = 0;

  // Completion penalty: already-deployed projects are market intelligence,
  // not active procurement leads. Halve scores so they only qualify if very strong.
  if (textIsCompletion) {
    bess = Math.floor(bess * 0.45);
    solar = Math.floor(solar * 0.45);
    generator = Math.floor(generator * 0.45);
  }

  // Cap at 100
  bess = Math.min(bess, 100);
  solar = Math.min(solar, 100);
  generator = Math.min(generator, 100);
  const overall = Math.max(bess, solar, generator);

  // Category — "multi" when two categories are within 15 points of each other above threshold
  const sorted = [
    { cat: "bess", score: bess },
    { cat: "solar", score: solar },
    { cat: "generator", score: generator },
  ].sort((a, b) => b.score - a.score);

  let category: LeadScore["category"] = sorted[0].cat as LeadScore["category"];
  if (sorted[0].score >= 50 && sorted[1].score >= 50 && sorted[0].score - sorted[1].score <= 15) {
    category = "multi";
  }

  return { bess, solar, generator, overall, category };
}

// ─── Notification helpers ──────────────────────────────────────────────────────

async function sendLeadEmail(
  vendor: Vendor,
  leads: ScoredOpportunity[],
  resendApiKey: string
): Promise<boolean> {
  const recipientEmail = vendor.notification_email ?? vendor.email;
  if (!recipientEmail || !resendApiKey) return false;

  const leadRows = leads
    .slice(0, 10)
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">
            <strong>${escapeHtml(l.company_name)}</strong>
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">
            ${escapeHtml(l.industry ?? "—")}
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">
            <span style="background:#4ade80;color:#052e16;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:700;">
              ${l.score.overall}
            </span>
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">
            ${escapeHtml(l.score.category.toUpperCase())}
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">
            <a href="${escapeHtml(l.source_url)}" style="color:#4f8aff;">View source</a>
          </td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Merlin Leads</title></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#111a3e,#1a2a5e);padding:28px 32px;">
      <div style="font-size:22px;font-weight:800;color:#9b6dff;letter-spacing:-0.5px;">⚡ Merlin Energy</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.72);margin-top:6px;">New qualified leads for ${escapeHtml(vendor.company_name)}</div>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:15px;color:#374151;margin:0 0 20px;">
        We found <strong>${leads.length} new opportunity${leads.length === 1 ? "" : "s"}</strong> that match your <strong>${vendor.specialty}</strong> specialty.
        ${leads.length > 10 ? ` Showing top 10 by score.` : ""}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px 10px;text-align:left;color:#475569;">Company</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Industry</th>
            <th style="padding:8px 10px;text-align:center;color:#475569;">Score</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Type</th>
            <th style="padding:8px 10px;text-align:left;color:#475569;">Source</th>
          </tr>
        </thead>
        <tbody>${leadRows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #4ade80;">
        <div style="font-size:13px;color:#166534;">
          💡 Scores 80+ indicate high BESS/solar/generator procurement intent. Reach out early — these leads are fresh.
        </div>
      </div>
      <div style="margin-top:24px;text-align:center;">
        <a href="https://merlinenergy.net/vendor/leads" style="display:inline-block;background:#9b6dff;color:#fff;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;">
          View All Leads in Dashboard →
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#9ca3af;text-align:center;">
      Merlin Energy Intelligence · You're receiving this because you're an approved vendor.
      <a href="https://merlinenergy.net/vendor/settings" style="color:#9b6dff;">Manage notification settings</a>
    </div>
  </div>
</body>
</html>`;

  try {
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ?? "Merlin Energy Leads <leads@merlinenergy.net>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipientEmail],
        subject: `⚡ ${leads.length} New ${vendor.specialty.toUpperCase()} Lead${leads.length === 1 ? "" : "s"} — Merlin Energy`,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.warn(`  ⚠ Resend error (${res.status}) to ${recipientEmail}:`, JSON.stringify(body));
    }
    return res.ok;
  } catch (err) {
    console.warn(`  ⚠ Resend network error to ${recipientEmail}:`, (err as Error).message);
    return false;
  }
}

async function sendLeadWebhook(vendor: Vendor, leads: ScoredOpportunity[]): Promise<boolean> {
  if (!vendor.webhook_url) return false;
  try {
    const res = await fetch(vendor.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Merlin-Event": "new_leads" },
      body: JSON.stringify({
        event: "new_leads",
        vendor_id: vendor.id,
        vendor_name: vendor.company_name,
        lead_count: leads.length,
        leads: leads.map((l) => ({
          opportunity_id: l.id,
          company_name: l.company_name,
          industry: l.industry,
          signals: l.signals,
          bess_score: l.score.bess,
          solar_score: l.score.solar,
          generator_score: l.score.generator,
          overall_score: l.score.overall,
          category: l.score.category,
          source_url: l.source_url,
          description: l.description?.slice(0, 300),
        })),
        timestamp: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeHtml(str: string | null | undefined): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Main matching function ────────────────────────────────────────────────────

/**
 * Run the full lead-matching pipeline:
 *   1. Fetch opportunities that have no vendor_leads rows yet (or all if rerun=true)
 *   2. Score each one for BESS / solar / generator
 *   3. For each approved vendor whose specialty matches and score >= their threshold
 *      → upsert vendor_leads row
 *      → collect for batched notification
 *   4. Send one batched email per vendor (not per lead)
 */
export async function runLeadMatching(
  supabase: SupabaseClient,
  opts: {
    resendApiKey?: string;
    minScore?: number; // global floor (default 50)
    rerun?: boolean; // re-score already-matched opportunities
    dryRun?: boolean; // score + log but don't write or notify
    limit?: number; // max opportunities to process (default 500)
  } = {}
): Promise<LeadMatchResult> {
  const { resendApiKey = "", minScore = 65, rerun = false, dryRun = false, limit = 500 } = opts;

  const result: LeadMatchResult = {
    opportunitiesScanned: 0,
    opportunitiesQualified: 0,
    leadsCreated: 0,
    leadsAlreadyExisted: 0,
    notificationsSent: 0,
    notificationErrors: 0,
    byCategory: { bess: 0, solar: 0, generator: 0, multi: 0 },
    topLeads: [],
    errors: [],
  };

  // ── 1. Fetch active vendors ────────────────────────────────────────────────
  // Select only columns guaranteed to exist pre-migration; new columns (notification_email,
  // webhook_url, lead_min_score) are added by migration 20260625_vendor_leads_pipeline.sql.
  // We fetch them separately with a fallback so the service works before migration is applied.
  const { data: vendorsRaw, error: vendorErr } = await supabase
    .from("vendors")
    .select("id,company_name,email,specialty,status")
    .eq("status", "approved")
    .in("specialty", ["battery", "solar", "generator", "integrator", "epc"]);

  if (vendorErr || !vendorsRaw?.length) {
    result.errors.push(`No active vendors: ${vendorErr?.message ?? "empty result"}`);
    return result;
  }

  // Try to fetch new columns added by migration — silently fall back to defaults if missing
  const enrichedVendors: Vendor[] = await Promise.all(
    (vendorsRaw as Omit<Vendor, "notification_email" | "webhook_url" | "lead_min_score">[]).map(
      async (v) => {
        try {
          const { data } = await supabase
            .from("vendors")
            .select("notification_email,webhook_url,lead_min_score")
            .eq("id", v.id)
            .maybeSingle();
          return {
            ...v,
            notification_email: data?.notification_email ?? null,
            webhook_url: data?.webhook_url ?? null,
            lead_min_score: data?.lead_min_score ?? 60,
          } as Vendor;
        } catch {
          return {
            ...v,
            notification_email: null,
            webhook_url: null,
            lead_min_score: 60,
          } as Vendor;
        }
      }
    )
  );

  const vendors = enrichedVendors;
  console.log(`  → ${vendors.length} approved vendors`);

  // ── 2. Fetch unmatched opportunities ──────────────────────────────────────
  let query = supabase
    .from("opportunities")
    .select("id,company_name,description,source_url,signals,industry,confidence_score")
    .order("confidence_score", { ascending: false })
    .limit(limit);

  if (!rerun) {
    // Only fetch opportunities not yet in vendor_leads
    const { data: matchedIds } = await supabase.from("vendor_leads").select("opportunity_id");
    const seen = new Set((matchedIds ?? []).map((r: any) => r.opportunity_id));
    if (seen.size > 0) {
      query = query.not("id", "in", `(${[...seen].map((id) => `"${id}"`).join(",")})`);
    }
  }

  const { data: opps, error: oppErr } = await query;
  if (oppErr) {
    result.errors.push(`Opportunity fetch failed: ${oppErr.message}`);
    return result;
  }

  result.opportunitiesScanned = opps?.length ?? 0;
  console.log(`  → ${result.opportunitiesScanned} opportunities to score`);

  // ── 3. Score every opportunity ────────────────────────────────────────────
  const scored: ScoredOpportunity[] = [];

  for (const opp of opps ?? []) {
    const score = scoreOpportunity(
      (opp.signals ?? []) as OpportunitySignal[],
      opp.industry as IndustryType | null,
      opp.description ?? ""
    );
    if (score.overall >= minScore) {
      scored.push({ ...opp, score });
      result.opportunitiesQualified++;
      result.byCategory[score.category]++;
    }
  }

  // Track top leads for summary
  result.topLeads = scored
    .sort((a, b) => b.score.overall - a.score.overall)
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      company: l.company_name,
      score: l.score.overall,
      category: l.score.category,
      vendors: 0, // filled below
    }));

  // Fill vendor counts from DB (pure read — runs in dry-run too so summary is accurate)
  {
    const topOppIds = result.topLeads.map((tl) => tl.id).filter(Boolean) as string[];
    if (topOppIds.length > 0) {
      const { data: vlCounts } = await supabase
        .from("vendor_leads")
        .select("opportunity_id")
        .in("opportunity_id", topOppIds);
      const countMap = new Map<string, number>();
      for (const row of (vlCounts ?? []) as { opportunity_id: string }[]) {
        countMap.set(row.opportunity_id, (countMap.get(row.opportunity_id) ?? 0) + 1);
      }
      for (const tl of result.topLeads) {
        tl.vendors = countMap.get(tl.id) ?? 0;
      }
    }
  }

  if (dryRun) {
    console.log("  [DRY RUN] Would write", scored.length, "leads");
    return result;
  }

  // ── 4. Route leads → vendors and upsert rows ──────────────────────────────
  // Map vendor_id → list of scored opps to notify about
  const vendorBatch = new Map<string, { vendor: Vendor; leads: ScoredOpportunity[] }>();

  for (const vendor of vendors) {
    vendorBatch.set(vendor.id, { vendor, leads: [] });
  }

  const SPECIALTY_TO_CATEGORY: Record<string, Array<keyof LeadScore & string>> = {
    battery: ["bess"],
    solar: ["solar"],
    generator: ["generator"],
    integrator: ["bess", "solar", "generator"],
    epc: ["bess", "solar", "generator"],
  };

  for (const opp of scored) {
    for (const vendor of vendors) {
      const vendorThreshold = Math.max(vendor.lead_min_score ?? 60, minScore);
      const cats = SPECIALTY_TO_CATEGORY[vendor.specialty] ?? [];

      // Find the best score for this vendor's specialty
      const relevantScore = Math.max(
        ...cats.map((c) => (opp.score[c as keyof LeadScore] as number) ?? 0)
      );

      if (relevantScore < vendorThreshold) continue;

      // Derive category from vendor perspective
      const cat = cats.length === 1 ? cats[0] : (opp.score.category as string);

      const leadRow: VendorLead = {
        opportunity_id: opp.id,
        vendor_id: vendor.id,
        bess_score: opp.score.bess,
        solar_score: opp.score.solar,
        generator_score: opp.score.generator,
        overall_score: opp.score.overall,
        lead_category: (cat as VendorLead["lead_category"]) ?? "bess",
        signals: opp.signals ?? [],
        industry: opp.industry ?? null,
        company_name: opp.company_name,
        source_url: opp.source_url,
        description: opp.description?.slice(0, 500) ?? null,
        status: "new",
        notified_at: null,
      };

      const { data: inserted, error: upsertErr } = await supabase
        .from("vendor_leads")
        .upsert(leadRow, { onConflict: "opportunity_id,vendor_id", ignoreDuplicates: true })
        .select("id")
        .maybeSingle();

      if (upsertErr) {
        result.errors.push(
          `Upsert failed (${opp.company_name} → ${vendor.company_name}): ${upsertErr.message}`
        );
        continue;
      }

      if (inserted?.id) {
        result.leadsCreated++;
        vendorBatch.get(vendor.id)!.leads.push(opp);

        // Audit event
        await supabase.from("vendor_lead_events").insert({
          lead_id: inserted.id,
          event_type: "created",
          actor: "system",
          metadata: { overall_score: opp.score.overall, category: opp.score.category },
        });
      } else {
        result.leadsAlreadyExisted++;
      }
    }
  }

  // ── 5. Send batched notifications ─────────────────────────────────────────
  for (const { vendor, leads } of vendorBatch.values()) {
    if (leads.length === 0) continue;

    let notified = false;
    const leadIds = await supabase
      .from("vendor_leads")
      .select("id")
      .eq("vendor_id", vendor.id)
      .in(
        "opportunity_id",
        leads.map((l) => l.id)
      )
      .then(({ data }) => (data ?? []).map((r: any) => r.id));

    // Email
    if (resendApiKey) {
      const ok = await sendLeadEmail(vendor, leads, resendApiKey);
      if (ok) {
        notified = true;
        result.notificationsSent++;

        // Mark as sent
        await supabase
          .from("vendor_leads")
          .update({ status: "sent", notified_at: new Date().toISOString() })
          .eq("vendor_id", vendor.id)
          .in(
            "opportunity_id",
            leads.map((l) => l.id)
          );

        // Audit events
        for (const lid of leadIds) {
          await supabase.from("vendor_lead_events").insert({
            lead_id: lid,
            event_type: "email_sent",
            actor: "system",
            metadata: { recipient: vendor.notification_email ?? vendor.email },
          });
        }
      } else {
        result.notificationErrors++;
      }
    }

    // Webhook fallback / supplement
    if (vendor.webhook_url) {
      const ok = await sendLeadWebhook(vendor, leads);
      if (ok) {
        notified = true;
        result.notificationsSent++;
        for (const lid of leadIds) {
          await supabase.from("vendor_lead_events").insert({
            lead_id: lid,
            event_type: "webhook_sent",
            actor: "system",
            metadata: { webhook_url: vendor.webhook_url },
          });
        }
      } else if (vendor.webhook_url) {
        result.notificationErrors++;
      }
    }

    if (!notified) {
      const contactEmail = vendor.notification_email ?? vendor.email;
      if (!resendApiKey && contactEmail) {
        console.warn(
          `  ⚠️  Skipped email for ${vendor.company_name} (${contactEmail}) — RESEND_API_KEY not configured`
        );
      } else if (!contactEmail && !vendor.webhook_url) {
        console.warn(`  ⚠️  No notification channel configured for vendor: ${vendor.company_name}`);
      }
    }
  }

  return result;
}
