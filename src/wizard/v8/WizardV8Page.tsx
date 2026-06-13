/**
 * =============================================================================
 * WIZARD V8 — PAGE SHELL
 * =============================================================================
 *
 * Uses WizardShellV7 for the 2-column Merlin layout:
 *   LEFT RAIL (360px): Merlin advisor panel — avatar, narration, intel cards
 *   RIGHT PANEL (flex): horizontal step progress bar + step content
 *
 * This shell is intentionally thin — it only:
 *   1. Resolves per-step advisor narration (getAdvisorContent)
 *   2. Passes nav props (canGoBack, canGoNext, nextLabel, nextHint)
 *   3. Routes the active step component as children
 *
 * Navigation policy:
//   Steps 1, 2, 4 (Add-ons), 5 (MagicFit) — self-advance via their own buttons/card clicks.
//     Shell Next button is kept disabled (canGoNext=false) so it doesn't conflict.
//   Step 3 (Profile) — shell Next button is the primary CTA (enabled when baseLoadKW > 0).
//   Step 6 (Quote) — terminal (no Next).
 *
 * Route: /v8
 * =============================================================================
 */

import React, { Suspense, lazy, useEffect, useMemo } from "react";
import { useWizardV8 } from "./useWizardV8";
import type { WizardStep, IndustrySlug } from "./wizardState";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";
import { EV_PACKAGE_COUNTS } from "./addonSizing";

// Lazy-load all steps — Step0 (mode select) is the true entry point and is
// eagerly imported above. Step1 is preloaded immediately so it feels instant.
const loadStep1V8 = () => import("./steps/Step1V8");
const loadStep2V8 = () => import("./steps/Step2V8");
const loadStep3V8 = () => import("./steps/Step3V8");
const loadStep35V8 = () => import("./steps/Step3_5V8");
const loadStep4V8 = () => import("./steps/Step4V8");

const Step1V8 = lazy(loadStep1V8);
const Step2V8 = lazy(loadStep2V8);
const Step3V8 = lazy(loadStep3V8);
const Step3_5V8 = lazy(loadStep35V8);
const Step4V8 = lazy(loadStep4V8);
const Step5V8 = lazy(() => import("./steps/Step5V8"));

const HERO_INTAKE_STORAGE_KEY = "merlin_hero_intake_v1";

const VALID_INDUSTRY_SLUGS = new Set<IndustrySlug>([
  "hotel",
  "car_wash",
  "ev_charging",
  "office",
  "retail",
  "restaurant",
  "warehouse",
  "manufacturing",
  "data_center",
  "hospital",
  "healthcare",
  "gas_station",
  "truck_stop",
  "apartment",
  "cold_storage",
  "college",
  "government",
  "airport",
  "casino",
  "microgrid",
  "residential",
  "agricultural",
  "shopping_center",
  "indoor_farm",
  "fitness_center",
  "gym",
  "other",
]);

function toIndustrySlug(value: string | null | undefined): IndustrySlug | null {
  if (!value) return null;
  return VALID_INDUSTRY_SLUGS.has(value as IndustrySlug) ? (value as IndustrySlug) : null;
}

// Step labels — index 0 = step 0 (Mode Select), index 1 = step 1 (Location), etc.
// Note: Step 3.5 (Add-ons) is inserted between Profile and MagicFit
const STEP_LABELS = [
  "Site",
  "Facility",
  "Load Profile",
  "Stack Scope",
  "Energy Stack",
  "Your Quote",
];

// Map WizardStep (1|2|3|3.5|4|5|6) → display index (0-5) for WizardShellV7.
// Step 0 (Mode Select) renders outside the shell — no progress bar needed.
// Shell uses integer indices for progress bar; 3.5/4 both map to 3 (Add-ons slot).
function wizardStepToDisplayIndex(step: number): number {
  if (step <= 3) return step - 1; // 1→0, 2→1, 3→2 (Profile)
  if (step === 3.5 || step === 4) return 3; // Add-ons
  if (step === 5) return 4; // MagicFit
  return 5; // Quote
}

// ── Accent helpers ────────────────────────────────────────────────────────────
const ACCENT = "#4F8CFF";
const T = {
  secondary: "rgba(245,248,255,0.84)",
  muted: "rgba(226,232,240,0.68)",
};

function hi(text: string): React.ReactNode {
  return <span style={{ color: ACCENT }}>{text}</span>;
}
function bullet(text: string): React.ReactNode {
  return (
    <div
      key={text}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: T.secondary,
        lineHeight: 1.45,
      }}
    >
      <span style={{ color: ACCENT, fontSize: 10, flexShrink: 0 }}>●</span>
      {text}
    </div>
  );
}

// ── Per-step advisor content rendered in the left rail ────────────────────────
type S = ReturnType<typeof useWizardV8>["state"];

function getAdvisorContent(
  step: number,
  opts: {
    industry: S["industry"];
    baseLoadKW: number;
    peakLoadKW: number;
    intel: S["intel"];
    business: S["business"];
    tiers: S["tiers"];
    selectedTierIndex: number | null;
  }
): React.ReactNode {
  const { industry, baseLoadKW, peakLoadKW, intel, business, tiers, selectedTierIndex } = opts;
  switch (step) {
    case 0:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Welcome to Merlin Energy.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Choose your path: Get a {hi("free AI-powered quote")} in 3 minutes, or access{" "}
            {hi("ProStack™")} for full engineering control over your energy system.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              "Guided Wizard is always free",
              "ProStack™ for complex projects",
              "All quotes include StackQuote™ sources",
            ].map(bullet)}
          </div>
        </div>
      );

    case 1:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            {intel ? "Here's what I found." : "Let's find your facility."}
          </div>
          {intel ? (
            <>
              <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
                Your local utility is {hi(intel.utilityProvider)} at{" "}
                {hi(`$${intel.utilityRate.toFixed(2)}/kWh`)}. Solar grade is {hi(intel.solarGrade)}{" "}
                — {intel.peakSunHours.toFixed(2)} peak sun hours per day.
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "rgba(62,207,142,0.06)",
                  border: "1px solid rgba(62,207,142,0.22)",
                  marginTop: 4,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "rgba(62,207,142,0.6)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    Rate
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: ACCENT,
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    }}
                  >
                    ${intel.utilityRate.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>/kWh</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "rgba(62,207,142,0.6)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    Solar
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: ACCENT,
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    }}
                  >
                    {intel.solarGrade}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {intel.peakSunHours.toFixed(2)}h / day
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {["Business name helps auto-detect industry", "Skip to select manually"].map(
                  bullet
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.6 }}>
                I'll pull live data for your location and build a {hi("real financial model")}.
              </div>
              {/* Live data slots — waiting for ZIP to populate */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                {(
                  [
                    { icon: "⚡", label: "Utility Rate", hint: "$/kWh" },
                    { icon: "☀️", label: "Solar Irradiance", hint: "grade + h/day" },
                    { icon: "📊", label: "Demand Charge", hint: "$/kW" },
                    { icon: "🎯", label: "StackQuote™", hint: "~90 sec" },
                  ] as const
                ).map(({ icon, label, hint }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 9,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.secondary }}>
                        {label}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(62,207,142,0.50)",
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {hint}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(62,207,142,0.05)",
                  border: "1px solid rgba(62,207,142,0.18)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.38)",
                  lineHeight: 1.5,
                }}
              >
                No vendor. No sales call. No account needed.
              </div>
            </>
          )}
        </div>
      );

    case 2:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Choose your industry.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Each industry has distinct energy patterns. I'll apply the right {hi("load benchmarks")}{" "}
            and sizing standards for your facility type.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {["ASHRAE load benchmarks", "CBECS energy intensity", "Industry-specific defaults"].map(
              bullet
            )}
          </div>
        </div>
      );

    case 3: {
      const industryLabel = industry ? industry.replace(/_/g, " ") : "your facility";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Facility profile.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Questions are pre-filled with {hi(`${industryLabel} industry defaults`)}. Accept them or
            review — the more accurate your inputs, the better your quote.
          </div>
          {baseLoadKW > 0 && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: "rgba(62,207,142,0.06)",
                border: "1px solid rgba(62,207,142,0.22)",
                marginTop: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "rgba(62,207,142,0.7)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Estimated Peak Load
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: ACCENT,
                  letterSpacing: "-0.5px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ~{Math.round(baseLoadKW).toLocaleString()} kW
              </div>
            </div>
          )}
        </div>
      );
    }

    case 4:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
            Build the add-ons that make your {hi("Energy Stack")} work harder.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Solar changes energy cost. EV charging can add revenue. Generator capacity changes
            resilience. Use this step to accept Merlin&apos;s baseline or push the stack toward more
            capacity before quote optimization.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            {[
              "Start with solar: accept the recommended kW, then use Advanced Solar Coverage for carport/canopy expansion.",
              "Use Panel Grade Settings when roof area is tight or you want premium solar types.",
              "Only add EV or generator if revenue, fleet needs, or outage risk justify the scope.",
            ].map(bullet)}
          </div>
          {peakLoadKW > 0 && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, rgba(79,138,255,0.10), rgba(155,109,255,0.08))",
                border: "1px solid rgba(79,138,255,0.26)",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "#38bdf8",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Your Peak Load
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#a78bfa",
                  letterSpacing: "-0.5px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {Math.round(peakLoadKW).toLocaleString()} kW
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                Add-ons should support this load without distracting from BESS ROI.
              </div>
            </div>
          )}
        </div>
      );

    case 5:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.35 }}>
            Review your official Energy Stack quote.
          </div>
          <div style={{ fontSize: 13.5, color: T.secondary, lineHeight: 1.6 }}>
            This is the product recommendation: a Merlin Energy Stack tuned to your{" "}
            {hi("utility cost, peak demand, and backup-power goals")}.
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(79,138,255,0.10)",
              border: "1px solid rgba(79,138,255,0.26)",
              color: "rgba(245,248,255,0.90)",
              fontSize: 12.5,
              lineHeight: 1.55,
            }}
          >
            Move the optimization slider to see how cost, resilience, and annual savings change
            before selecting the quote.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 2 }}>
            {[
              "Quote variants show cost vs. resilience tradeoffs",
              "Savings update as the stack changes",
              "Select the option you want Merlin to finalize",
            ].map(bullet)}
          </div>
        </div>
      );

    case 6: {
      // Pick the recommended tier (index 1 = middle) or the user's selection
      const recIdx = selectedTierIndex ?? 1;
      const tier = tiers?.[recIdx];
      const bizName = business?.name;
      const fmt$ = (n: number) =>
        n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1_000)}K`;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Greeting */}
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.35 }}>
            {bizName ? (
              <>{hi(bizName)} — your StackQuote™ is ready.</>
            ) : (
              "Your StackQuote™ is ready."
            )}
          </div>

          {/* ROI snapshot card */}
          {tier && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(62,207,142,0.06)",
                border: "1px solid rgba(62,207,142,0.22)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Annual savings hero */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "rgba(62,207,142,0.75)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Annual Savings
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: ACCENT, lineHeight: 1 }}>
                  {fmt$(tier.annualSavings)}
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: T.secondary, marginLeft: 4 }}
                  >
                    /yr
                  </span>
                </div>
              </div>
              {/* Payback + ITC row */}
              <div style={{ fontSize: 12.5, color: T.secondary, lineHeight: 1.55 }}>
                Payback in {hi(`${tier.paybackYears.toFixed(1)} yrs`)} · Net cost{" "}
                {hi(fmt$(tier.netCost))} after {hi(`${Math.round(tier.itcRate * 100)}% ITC`)}
              </div>
              {/* 10-Year ROI */}
              {tier.roi10Year > 0 && (
                <div style={{ fontSize: 12, color: T.muted }}>
                  10-year ROI: {hi(`${Math.round(tier.roi10Year)}%`)}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 12.5, color: T.secondary, lineHeight: 1.6 }}>
            Your energy stack is configured and sized for your facility. Review the financial
            details and {hi("download your StackQuote™")} to share with your team.
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ── Navigation gates ──────────────────────────────────────────────────────────
// Steps 1, 2, 4 self-advance → shell Next stays disabled (canGoNext=false).
// Step 3 uses the shell Next as primary CTA.
// Step 5 is final step with export buttons - no Next button needed.
function resolveCanGoNext(step: number, state: S): boolean {
  if (step === 3) return state.baseLoadKW > 0;
  if (step === 4) return true; // Add-ons: always continuable
  if (step === 5) return state.selectedTierIndex !== null && state.tiersStatus === "ready"; // MagicFit: tier selected + build complete
  return false;
}

const NEXT_LABELS: Partial<Record<number, string>> = {
  3: "Choose add-ons →",
  4: "Build my Energy Stack →",
  5: "See your quote →",
};

const NEXT_HINTS: Partial<Record<number, string>> = {
  1: "Select your industry",
  3: "Solar, generator & EV options",
  4: "MagicFit sizes your system",
  5: "Review your StackQuote™",
};

// ── Spinner fallback ──────────────────────────────────────────────────────────
function SpinnerFallback() {
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "2px solid #3ECF8E",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "merlin-spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WizardV8Page() {
  const { state, actions } = useWizardV8();
  const step = state.step;

  // Read URL params on mount.
  // Widget CTA path: /wizard?industry=hotel&state=Nevada&zip=89052
  //   → skip Step 0, land on Step 1 with ZIP pre-filled and intel fetch already fired,
  //     industry pre-set so Step 2 opens with the card already highlighted.
  // Deep-link path: /wizard?step=3 → jump to that step directly (dev / share links).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get("source");
    const industryParam = params.get("industry");
    const zipParam = params.get("zip");
    const stepParam = params.get("step");

    if (sourceParam === "hero-stacking-cta") {
      let heroDraft: {
        zip?: string;
        industry?: string;
        businessTypeLabel?: string;
        businessName?: string;
        address?: string;
        placeId?: string;
      } = {};

      try {
        heroDraft = JSON.parse(sessionStorage.getItem(HERO_INTAKE_STORAGE_KEY) ?? "{}");
        sessionStorage.removeItem(HERO_INTAKE_STORAGE_KEY);
      } catch {
        heroDraft = {};
      }

      const slug = toIndustrySlug(industryParam ?? heroDraft.industry) ?? "other";
      const zip = zipParam ?? heroDraft.zip ?? "";

      actions.hydrateHeroIntake({
        zip,
        industry: slug,
        businessTypeLabel: heroDraft.businessTypeLabel,
        businessName: heroDraft.businessName,
        address: heroDraft.address,
        placeId: heroDraft.placeId,
      });

      return;
    }

    if (industryParam || zipParam) {
      // ── Widget CTA seed ──────────────────────────────────────────────────
      // Skip the mode-select screen entirely — user already stated intent.
      actions.goToStep(1 as WizardStep);

      // Pre-populate ZIP → setLocationRaw fires the debounced intel fetch
      // (utility rate, solar grade, demand windows) so Step 1 shows results
      // the moment it renders, no extra user action needed.
      if (zipParam) {
        actions.setLocationRaw(zipParam);
      }

      // Pre-populate industry → Step 2 will render with the card pre-selected.
      // Widget slugs match IndustrySlug exactly (hotel, car_wash, retail, etc.).
      if (industryParam) {
        const slug = toIndustrySlug(industryParam) ?? "other";
        actions.setIndustry(slug);
      }

      return; // don't process ?step= when widget params are present
    }

    // ── Manual deep-link (dev / share links) ────────────────────────────────
    if (stepParam) {
      const targetStep = parseInt(stepParam, 10);
      if (!isNaN(targetStep) && targetStep >= 0 && targetStep <= 6) {
        actions.goToStep(targetStep as WizardStep);
      }
    } else {
      // No URL params at all — go straight to Step 1 (location)
      actions.goToStep(1 as WizardStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally mount-only: URL params are read once; actions is a stable ref

  useEffect(() => {
    // Step 0 → preload Step1 immediately (16 kB, hides lazy latency)
    if (step === 0) {
      void loadStep1V8();
      return;
    }

    if (
      step === 1 &&
      state.business?.detectedIndustry &&
      (state.business.confidence ?? 0) >= 0.75
    ) {
      void loadStep2V8();
      void loadStep3V8();
      void loadStep35V8();
      void loadStep4V8();
      return;
    }

    if (step === 2) {
      void loadStep3V8();
      return;
    }

    if (step === 3) {
      void loadStep35V8();
      void loadStep4V8();
    }
  }, [step, state.business?.detectedIndustry, state.business?.confidence]);

  // Memoize advisor sidebar content — getAdvisorContent builds React nodes, so
  // calling it inline would create fresh objects on every state dispatch.
  // Dep array lists exactly the fields getAdvisorContent reads — no disable needed.
  const advisorContent = useMemo(
    () =>
      getAdvisorContent(step, {
        industry: state.industry,
        baseLoadKW: state.baseLoadKW,
        peakLoadKW: state.peakLoadKW,
        intel: state.intel,
        business: state.business,
        tiers: state.tiers,
        selectedTierIndex: state.selectedTierIndex,
      }),

    [
      step,
      state.industry,
      state.baseLoadKW,
      state.peakLoadKW,
      state.intel,
      state.business,
      state.tiers,
      state.selectedTierIndex,
    ]
  );

  // Step 0 is no longer a real landing — useEffect advances to step 1 on mount.
  // Render a brief spinner so there's no stale render before the effect fires.
  if (step === 0) {
    return <SpinnerFallback />;
  }

  return (
    <div style={{ position: "relative" }}>
      <WizardShellV7
        currentStep={wizardStepToDisplayIndex(step)}
        stepLabels={STEP_LABELS}
        canGoBack={step > 1}
        canGoNext={resolveCanGoNext(step, state)}
        isNextLoading={(step === 4 || step === 5) && state.tiersStatus === "fetching"}
        onBack={actions.goBack}
        onSwitchToProStack={() => {
          // Serialize wizard state to sessionStorage so ProStack can hydrate from it
          try {
            sessionStorage.setItem(
              "merlin_wizard_handoff",
              JSON.stringify({
                industry: state.industry,
                zip: state.location?.zip,
                city: state.location?.city,
                baseLoadKW: state.baseLoadKW,
                peakLoadKW: state.peakLoadKW,
                solarKW: state.solarKW,
                step3Answers: state.step3Answers,
                business: state.business,
                intel: state.intel,
                fromStep: state.step,
              })
            );
          } catch {
            // sessionStorage unavailable — proceed anyway
          }
          window.location.href = "/quote-builder?from=wizard";
        }}
        onNext={() => {
          if (step === 4) {
            // ── Persist Step 3.5 Add-on configuration before advancing ────────
            // Solar + Generator: kW already committed to state via setAddonConfig on CONFIRM
            const committedSolarKW = state.wantsSolar ? state.solarKW : 0;
            const committedGenKW = state.wantsGenerator ? state.generatorKW : 0;

            // EV Chargers — counts from SSOT (addonSizing.EV_PACKAGE_COUNTS)
            // "custom" mode writes directly to state.level2Chargers/dcfcChargers via setAddonConfig
            const evScope = (state.step3Answers?.evScope as string) ?? "pkg_pro";
            let evCounts: { level2: number; dcfc: number };
            if (evScope === "custom") {
              // Custom mode: counts already committed to state via setAddonConfig
              evCounts = state.wantsEVCharging
                ? { level2: state.level2Chargers, dcfc: state.dcfcChargers }
                : { level2: 0, dcfc: 0 };
            } else {
              const pkgCounts =
                (EV_PACKAGE_COUNTS as Record<string, { l2: number; dcfc: number }>)[evScope] ??
                EV_PACKAGE_COUNTS.pkg_pro;
              evCounts = state.wantsEVCharging
                ? { level2: pkgCounts.l2, dcfc: pkgCounts.dcfc }
                : { level2: 0, dcfc: 0 };
            }

            // Commit all four in one dispatch
            actions.setAddonConfig({
              solarKW: committedSolarKW,
              generatorKW: committedGenKW,
              linearGeneratorKW: state.linearGeneratorKW ?? 0,
              level2Chargers: evCounts.level2,
              dcfcChargers: evCounts.dcfc,
              hpcChargers: state.wantsEVCharging ? state.hpcChargers : 0,
            });
            actions.setAnswer("step3_5Visited", true);
            actions.goToStep(5);
          } else {
            actions.goToStep((step + 1) as WizardStep);
          }
        }}
        nextLabel={NEXT_LABELS[step]}
        nextHint={NEXT_HINTS[step]}
        advisorContent={advisorContent}
        railWidth={step >= 3 && step <= 4 ? 680 : 520}
        telemetry={
          state.intel
            ? {
                rate: state.intel.utilityRate,
                demand: state.intel.demandCharge,
                solar: state.intel.peakSunHours,
                grade: state.intel.solarGrade,
                utility: state.intel.utilityProvider,
              }
            : undefined
        }
      >
        {/* Error banner */}
        {state.error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ color: "#f87171", fontSize: 13, flex: 1 }}>{state.error.message}</span>
            <button
              onClick={actions.clearError}
              style={{
                color: "#f87171",
                fontSize: 18,
                lineHeight: 1,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Step router */}
        <Suspense fallback={<SpinnerFallback />}>
          {step === 1 && <Step1V8 state={state} actions={actions} />}
          {step === 2 && <Step2V8 state={state} actions={actions} />}
          {step === 3 && <Step3V8 state={state} actions={actions} />}
          {step === 4 && <Step3_5V8 state={state} actions={actions} />}
          {step === 5 && <Step4V8 state={state} actions={actions} />}
          {step === 6 && <Step5V8 state={state} actions={actions} />}
        </Suspense>
      </WizardShellV7>
    </div>
  );
}
