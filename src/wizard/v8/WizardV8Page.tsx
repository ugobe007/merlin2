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
import type { WizardStep } from "./wizardState";
import { Step0V8_ModeSelect } from "./steps/Step0V8_ModeSelect";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";
import { estimateSolarKW, estimateGenKW, defaultGeneratorScope, type SolarScopeId, type GeneratorScopeId } from "./addonSizing";

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

// Step labels — index 0 = step 0 (Mode Select), index 1 = step 1 (Location), etc.
// Note: Step 3.5 (Add-ons) is inserted between Profile and MagicFit
const STEP_LABELS = ["Mode", "Location", "Industry", "Profile", "Add-ons", "MagicFit", "Quote"];

// Map WizardStep (0|1|2|3|3.5|4|5|6) → display index (0-6) for WizardShellV7.
// Shell uses integer indices for progress bar; 3.5 must map to 4 (Add-ons slot).
function wizardStepToDisplayIndex(step: number): number {
  if (step <= 3) return step;          // 0→0, 1→1, 2→2, 3→3 (Profile)
  if (step === 3.5) return 4;          // 3.5 → 4 (Add-ons)
  if (step === 4) return 4;            // step=4 also renders Step3_5V8 → 4
  if (step === 5) return 5;            // MagicFit
  return 6;                            // Quote
}

// ── Accent helpers ────────────────────────────────────────────────────────────
const ACCENT = "#3ECF8E";
const T = {
  secondary: "rgba(255,255,255,0.60)",
  muted: "rgba(255,255,255,0.35)",
};

function hi(text: string): React.ReactNode {
  return <span style={{ color: ACCENT }}>{text}</span>;
}
function bullet(text: string): React.ReactNode {
  return (
    <div
      key={text}
      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.secondary }}
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
  opts: { industry: S["industry"]; baseLoadKW: number; peakLoadKW: number; intel: S["intel"] }
): React.ReactNode {
  const { industry, baseLoadKW, peakLoadKW, intel } = opts;
  switch (step) {
    case 0:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Welcome to Merlin Energy.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Choose your path: Get a {hi("free AI-powered quote")} in 3 minutes, or access{" "}
            {hi("ProQuote™")} for full engineering control over your energy system.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              "Guided Wizard is always free",
              "ProQuote™ for complex projects",
              "All quotes include TrueQuote™ sources",
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
                {hi(`$${intel.utilityRate.toFixed(2)}/kWh`)}. Solar grade is{" "}
                {hi(intel.solarGrade)} — {intel.peakSunHours} peak sun hours per day.
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
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(62,207,142,0.6)", marginBottom: 4, textTransform: "uppercase" }}>Rate</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT, fontVariantNumeric: "tabular-nums", fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
                    ${intel.utilityRate.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>/kWh</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(62,207,142,0.6)", marginBottom: 4, textTransform: "uppercase" }}>Solar</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT, fontVariantNumeric: "tabular-nums", fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
                    {intel.solarGrade}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{intel.peakSunHours}h / day</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {["Business name helps auto-detect industry", "Skip to select manually"].map(bullet)}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
                I'll use your location to look up {hi("local utility rates")} and{" "}
                {hi("solar irradiance")} — two of the biggest factors in your savings estimate.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {["Utility rates by zip code", "Peak demand windows", "Solar potential score"].map(bullet)}
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
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Customize your scope.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Add-ons are optional but can significantly improve your ROI. Merlin has pre-selected
            the most common upgrades for{" "}
            {hi(industry ? industry.replace(/_/g, " ") : "your facility")}.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              "Solar: Based on electricity rates & space",
              "Generator: Based on grid reliability",
              "EV Charging: Based on facility type",
            ].map(bullet)}
          </div>
          {peakLoadKW > 0 && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: "rgba(62,207,142,0.06)",
                border: "1px solid rgba(62,207,142,0.22)",
                marginTop: 8,
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
                Your Peak Load
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
                {Math.round(peakLoadKW).toLocaleString()} kW
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                All recommendations sized from this baseline
              </div>
            </div>
          )}
        </div>
      );

    case 5:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            What's your priority?
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            I'll build three quote tiers — each with different{" "}
            {hi("battery size, solar pairing, and payback period")}.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              "Save More — max bill reduction",
              "Best Balance — savings + resilience",
              "Full Power — grid independence",
            ].map(bullet)}
          </div>
        </div>
      );

    case 6:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Your quote is ready.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Three tiers tailored to your facility. Each shows{" "}
            {hi("cost, annual savings, and payback")}. Pick the one that fits.
          </div>
        </div>
      );

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
  if (step === 4) return true;                              // Add-ons: always continuable
  if (step === 5) return state.selectedTierIndex !== null;  // MagicFit: must pick a tier
  return false;
}

const NEXT_LABELS: Partial<Record<number, string>> = {
  3: "Choose add-ons →",
  4: "Build my tiers →",
  5: "See your quote →",
};

const NEXT_HINTS: Partial<Record<number, string>> = {
  1: "Select your industry",
  3: "Solar, generator & EV options",
  4: "MagicFit sizes your system",
  5: "Review your TrueQuote™",
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

  // Read URL params on mount (for deep linking like /wizard-v8?step=3&industry=car_wash)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step");
    const industryParam = params.get("industry");

    if (stepParam) {
      const targetStep = parseInt(stepParam, 10);
      if (!isNaN(targetStep) && targetStep >= 0 && targetStep <= 6) {
        actions.goToStep(targetStep as WizardStep);

        // If industry provided, pre-populate it
        if (industryParam && targetStep >= 3 && import.meta.env.DEV) {
          // Set industry silently (without triggering navigation)
          // This will be picked up when step 3 renders
          console.log("[WizardV8Page] Pre-populating industry from URL:", industryParam);
        }
      }
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
    () => getAdvisorContent(step, {
      industry: state.industry,
      baseLoadKW: state.baseLoadKW,
      peakLoadKW: state.peakLoadKW,
      intel: state.intel,
    }),
    [step, state.industry, state.baseLoadKW, state.peakLoadKW, state.intel]
  );

  return (
    <div style={{ position: "relative" }}>
      <WizardShellV7
        currentStep={wizardStepToDisplayIndex(step)}
        stepLabels={STEP_LABELS}
        canGoBack={step > 0}
        canGoNext={resolveCanGoNext(step, state)}
        onBack={actions.goBack}
        onNext={() => {
          if (step === 4) {
            // ── Persist Step 3.5 Add-on configuration before advancing ────────
            // Solar
            const solarScope = ((state.step3Answers?.solarScope as SolarScopeId | undefined) ?? "roof_canopy");
            const committedSolarKW = state.wantsSolar
              ? estimateSolarKW(solarScope, state)
              : 0;

            // Generator
            const generatorScope = ((state.step3Answers?.generatorScope as GeneratorScopeId | undefined) ?? defaultGeneratorScope(state));
            const committedGenKW = state.wantsGenerator
              ? estimateGenKW(generatorScope, state)
              : 0;

            // EV Chargers
            const evScope = (state.step3Answers?.evScope as string) ?? "pkg_pro";
            const EV_COUNTS: Record<string, { level2: number; dcfc: number }> = {
              // legacy scope IDs
              small:     { level2: 4,  dcfc: 0 },
              medium:    { level2: 8,  dcfc: 2 },
              large:     { level2: 12, dcfc: 4 },
              // new package IDs
              pkg_basic: { level2: 4,  dcfc: 0 },
              pkg_pro:   { level2: 6,  dcfc: 2 },
              pkg_fleet: { level2: 6,  dcfc: 4 },
            };
            const evCounts = state.wantsEVCharging
              ? (EV_COUNTS[evScope] ?? { level2: 8, dcfc: 2 })
              : { level2: 0, dcfc: 0 };

            // Commit all three in one dispatch
            actions.setAddonConfig({
              solarKW: committedSolarKW,
              generatorKW: committedGenKW,
              level2Chargers: evCounts.level2,
              dcfcChargers: evCounts.dcfc,
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
          {step === 0 && (
            <Step0V8_ModeSelect
              onSelectMode={(mode) => {
                if (mode === "wizard") {
                  actions.goToStep(1 as WizardStep);
                } else if (mode === "proquote") {
                  window.location.href = "/pro-quote";
                } else if (mode === "upload") {
                  window.location.href = "/upload-quote";
                }
              }}
            />
          )}
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
