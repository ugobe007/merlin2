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

function getAdvisorContent(step: number, state: S): React.ReactNode {
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
            Let's find your facility.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            I'll use your location to look up {hi("local utility rates")} and{" "}
            {hi("solar irradiance")} — two of the biggest factors in your savings estimate.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {["Utility rates by zip code", "Peak demand windows", "Solar potential score"].map(
              bullet
            )}
          </div>
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
      const industry = state.industry ? state.industry.replace(/_/g, " ") : "your facility";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Facility profile.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Questions are pre-filled with {hi(`${industry} industry defaults`)}. Accept them or
            review — the more accurate your inputs, the better your quote.
          </div>
          {state.baseLoadKW > 0 && (
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
                ~{Math.round(state.baseLoadKW).toLocaleString()} kW
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
            {hi(state.industry ? state.industry.replace(/_/g, " ") : "your facility")}.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {[
              "Solar: Based on electricity rates & space",
              "Generator: Based on grid reliability",
              "EV Charging: Based on facility type",
            ].map(bullet)}
          </div>
          {state.peakLoadKW > 0 && (
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
                {Math.round(state.peakLoadKW).toLocaleString()} kW
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
        if (industryParam && targetStep >= 3) {
          // Set industry silently (without triggering navigation)
          // This will be picked up when step 3 renders
          console.log("[WizardV8Page] Pre-populating industry from URL:", industryParam);
        }
      }
    }
  }, []); // Run once on mount

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
  // Only re-compute when the values it actually renders change.
  const advisorContent = useMemo(
    () => getAdvisorContent(step, state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, state.baseLoadKW, state.peakLoadKW, state.industry,
     state.wantsSolar, state.wantsGenerator, state.wantsEVCharging]
  );

  return (
    <div style={{ position: "relative" }}>
      {/* Reset button - top right */}
      <button
        onClick={() => {
          if (confirm("Start over? This will clear all your answers.")) {
            actions.reset();
          }
        }}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          padding: "8px 16px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(8,11,20,0.85)",
          backdropFilter: "blur(12px)",
          color: "rgba(255,255,255,0.65)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
          e.currentTarget.style.background = "rgba(8,11,20,0.95)";
          e.currentTarget.style.color = "#f87171";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          e.currentTarget.style.background = "rgba(8,11,20,0.85)";
          e.currentTarget.style.color = "rgba(255,255,255,0.65)";
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        Start Over
      </button>

      <WizardShellV7
        currentStep={wizardStepToDisplayIndex(step)}
        stepLabels={STEP_LABELS}
        canGoBack={step > 0}
        canGoNext={resolveCanGoNext(step, state)}
        onBack={actions.goBack}
        onNext={() => {
          if (step === 4) {
            // Persist EV charger counts + mark Add-ons visited before advancing
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
            if (state.wantsEVCharging) {
              const counts = EV_COUNTS[evScope] ?? { level2: 8, dcfc: 2 };
              actions.setAddonConfig({ level2Chargers: counts.level2, dcfcChargers: counts.dcfc });
            } else {
              actions.setAddonConfig({ level2Chargers: 0, dcfcChargers: 0 });
            }
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
