/**
 * STEP 3 ENVELOPE TELEMETRY SERVICE
 * ===================================
 *
 * Created: February 8, 2026 — Move 7
 *
 * PURPOSE:
 *   Persist a SIGNATURE-ONLY summary of each Step 3 envelope.
 *   No full quote data. No PII. One table, one insert.
 *
 * WHAT IT CAPTURES:
 *   - traceId, industry, schemaKey, calculatorId
 *   - peakKW, dutyCycle, confidence
 *   - invariantsAllPassed + failed invariant keys
 *   - policyEvents counts by code + max severity
 *   - top 3 contributors (key, kW, share)
 *   - version stamps (wizard version, pricing version)
 *
 * WHAT IT REVEALS:
 *   - Which industries are "estimate-heavy" (low confidence)
 *   - Which policy codes fire most often (heatmap by industry)
 *   - Regressions before a founder complains
 *   - Where defaults dominate (SSOT_INPUT_MISSING frequency)
 *
 * DOCTRINE:
 *   - Fire-and-forget — NEVER blocks UI
 *   - Signature queries only — no full quote or PII
 *   - Fails silently — telemetry errors are swallowed
 */

import type { LoadProfileEnvelope } from "../step3/loadProfile";
import type { PolicyEvent, PolicyCodeType } from "../step3/policyTaxonomy";
import { summarizePolicyEvents } from "../step3/policyTaxonomy";
import { devInfo, devWarn } from '../debug/devLog';

// ============================================================================
// Types
// ============================================================================

/**
 * The telemetry payload — exactly what goes into one DB row.
 * Flat, serializable, no nested objects deeper than 1 level.
 */
export type Step3TelemetryPayload = {
  // --- Identity ---
  traceId: string;
  sessionId?: string;

  // --- Schema version (for migration safety) ---
  schemaVersion: number;
  buildStamp: string;

  // --- Industry context ---
  industry: string;
  schemaKey: string;
  calculatorId: string;
  templateKey: string;

  // --- Load profile signature ---
  peakKW: number;
  avgKW: number;
  dutyCycle: number;
  energyKWhPerDay: number;
  confidence: string;

  // --- Quality signals ---
  invariantsAllPassed: boolean;
  failedInvariantKeys: string[];
  missingTier1Count: number;
  warningCount: number;

  // --- Policy event summary ---
  policyEventTotal: number;
  policyEventCountByCode: Record<string, number>;
  policyEventMaxSeverity: "info" | "warn" | "error" | "none";

  // --- Top contributors (display-ready) ---
  topContributors: Array<{
    key: string;
    kW: number;
    share: number;
  }>;
  contributorCount: number;

  // --- Version stamps ---
  wizardVersion: string;
  createdAt: string;
};

// ============================================================================
// Payload Builder
// ============================================================================

const WIZARD_VERSION = "v7.1.0";
const SCHEMA_VERSION = 1;
const BUILD_STAMP = `${WIZARD_VERSION}+move8`;

/**
 * Build the telemetry payload from a sealed LoadProfileEnvelope.
 * Pure function — no side effects.
 */
export function buildTelemetryPayload(
  envelope: LoadProfileEnvelope,
  sessionId?: string,
): Step3TelemetryPayload {
  // Policy event summary
  const eventCounts = summarizePolicyEvents(envelope.policyEvents);
  const maxSev = getMaxSeverity(envelope.policyEvents);

  // Failed invariant keys
  const failedKeys = envelope.invariants
    .filter((inv) => !inv.passed)
    .map((inv) => inv.rule);

  // Top 3 contributors (stable sort: by kW desc, then alpha)
  const topContributors = [...envelope.contributors]
    .sort((a, b) => b.kW - a.kW || a.key.localeCompare(b.key))
    .slice(0, 3)
    .map((c) => ({ key: c.key, kW: round2(c.kW), share: round2(c.share) }));

  return {
    traceId: (envelope.trace as any)?.slug ?? envelope.trace?.canonicalSlug ?? `${envelope.industrySlug}-${Date.now()}`,
    sessionId,

    schemaVersion: SCHEMA_VERSION,
    buildStamp: BUILD_STAMP,

    industry: envelope.industrySlug,
    schemaKey: envelope.schemaKey,
    calculatorId: envelope.calculatorId,
    templateKey: envelope.templateKey,

    peakKW: round2(envelope.peakKW),
    avgKW: round2(envelope.avgKW),
    dutyCycle: round4(envelope.dutyCycle),
    energyKWhPerDay: round2(envelope.energyKWhPerDay),
    confidence: envelope.confidence,

    invariantsAllPassed: envelope.invariantsAllPassed,
    failedInvariantKeys: failedKeys,
    missingTier1Count: envelope.missingTier1.length,
    warningCount: envelope.warnings.length,

    policyEventTotal: envelope.policyEvents.length,
    policyEventCountByCode: eventCounts as Record<string, number>,
    policyEventMaxSeverity: maxSev,

    topContributors,
    contributorCount: envelope.contributors.filter((c) => c.kW > 0).length,

    wizardVersion: WIZARD_VERSION,
    createdAt: envelope.createdAt,
  };
}

// ============================================================================
// Persistence (Supabase direct insert)
// ============================================================================

/**
 * Persist a Step 3 envelope summary to `step3_envelopes_log`.
 *
 * Fire-and-forget. Never throws. Never blocks UI.
 * Falls back to console.info in development.
 */
export async function persistEnvelopeTelemetry(
  payload: Step3TelemetryPayload,
): Promise<void> {
  try {
    // Development: log to console
    if (import.meta.env.DEV) {
      devInfo("[Step3 Telemetry]", {
        industry: payload.industry,
        peakKW: payload.peakKW,
        confidence: payload.confidence,
        policyEvents: payload.policyEventTotal,
        maxSeverity: payload.policyEventMaxSeverity,
        topContributors: payload.topContributors.map((c) => `${c.key}:${c.kW}kW`),
      });
      return;
    }

    // Production: Supabase insert (lazy import to avoid loading in dev)
    const { supabase } = await import("@/services/supabaseClient");
    if (!supabase) return;

    const { error } = await (supabase as any).from("step3_envelopes_log").insert({
      trace_id: payload.traceId,
      session_id: payload.sessionId,
      schema_version: payload.schemaVersion,
      build_stamp: payload.buildStamp,
      industry: payload.industry,
      schema_key: payload.schemaKey,
      calculator_id: payload.calculatorId,
      template_key: payload.templateKey,
      peak_kw: payload.peakKW,
      avg_kw: payload.avgKW,
      duty_cycle: payload.dutyCycle,
      energy_kwh_per_day: payload.energyKWhPerDay,
      confidence: payload.confidence,
      invariants_all_passed: payload.invariantsAllPassed,
      failed_invariant_keys: payload.failedInvariantKeys,
      missing_tier1_count: payload.missingTier1Count,
      warning_count: payload.warningCount,
      policy_event_total: payload.policyEventTotal,
      policy_event_counts: payload.policyEventCountByCode,
      policy_event_max_severity: payload.policyEventMaxSeverity,
      top_contributors: payload.topContributors,
      contributor_count: payload.contributorCount,
      wizard_version: payload.wizardVersion,
      created_at: payload.createdAt,
    });

    if (error) {
      // Silently fail — telemetry should never break UX
      devWarn("[Step3 Telemetry] Insert failed:", error.message);
    }
  } catch {
    // Swallow all errors
  }
}

/**
 * One-shot convenience: build payload + persist.
 * The function your hook calls.
 */
export async function logStep3Envelope(
  envelope: LoadProfileEnvelope,
  sessionId?: string,
): Promise<void> {
  const payload = buildTelemetryPayload(envelope, sessionId);
  await persistEnvelopeTelemetry(payload);
}

// ============================================================================
// Helpers
// ============================================================================

function getMaxSeverity(
  events: readonly PolicyEvent[],
): "info" | "warn" | "error" | "none" {
  if (events.length === 0) return "none";
  if (events.some((e) => e.severity === "error")) return "error";
  if (events.some((e) => e.severity === "warn")) return "warn";
  return "info";
}

function round2(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function round4(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 10000) / 10000 : 0;
}
