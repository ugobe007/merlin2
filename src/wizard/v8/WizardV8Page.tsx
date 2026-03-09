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
 *   Steps 1, 2, 4 — self-advance via their own internal buttons/card clicks.
 *     Shell Next button is kept disabled (canGoNext=false) so it doesn't conflict.
 *   Steps 3 and 5 — shell Next button is the primary CTA.
 *   Step 6 — terminal (no Next).
 *
 * Route: /v8
 * =============================================================================
 */

import React, { Suspense, lazy } from "react";
import { useWizardV8 } from "./useWizardV8";
import type { WizardStep } from "./wizardState";
import { Step1V8 } from "./steps/Step1V8";
import { Step0V8_ModeSelect } from "./steps/Step0V8_ModeSelect";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";

// Lazy-load steps 2–5 so Step 1 renders instantly on first visit
const Step2V8 = lazy(() => import("./steps/Step2V8"));
const Step3V8 = lazy(() => import("./steps/Step3V8"));
const Step3_5V8 = lazy(() => import("./steps/Step3_5V8_RANGEBUTTONS")); // NEW: Range button version
const Step4V8 = lazy(() => import("./steps/Step4V8"));
const Step5V8 = lazy(() => import("./steps/Step5V8"));

// Step labels — index 0 = step 0 (Mode Select), index 1 = step 1 (Location), etc.
const STEP_LABELS = ["Mode", "Location", "Industry", "Profile", "MagicFit", "Quote"];

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

    case 5:
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
            Compare your options.
          </div>
          <div style={{ fontSize: 13, color: T.secondary, lineHeight: 1.65 }}>
            Three tiers tailored to your facility. Each shows{" "}
            {hi("cost, annual savings, and payback")}. Pick the one that fits.
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
            Every number is sourced from {hi("NREL, IRS, and live market data")}. Download the PDF
            or share with your team.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {["TrueQuote™ verified sources", "IRA 2022 ITC breakdown", "25-year NPV & IRR"].map(
              bullet
            )}
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
  return false;
}

const NEXT_LABELS: Partial<Record<number, string>> = {
  3: "Build my quote →",
};

const NEXT_HINTS: Partial<Record<number, string>> = {
  1: "Select your industry",
  3: "Goal selection",
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

  // DEBUG: Log step and state
  console.log("[V8 WizardV8Page render] step:", step, {
    hasLocation: !!state.location,
    hasBusiness: !!state.business,
    hasIndustry: !!state.industry,
  });

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
        currentStep={step} // Now steps align: 0=Mode, 1=Location, etc.
        stepLabels={STEP_LABELS}
        canGoBack={step > 0}
        canGoNext={resolveCanGoNext(step, state)}
        onBack={actions.goBack}
        onNext={() => actions.goToStep((step + 1) as WizardStep)}
        nextLabel={NEXT_LABELS[step]}
        nextHint={NEXT_HINTS[step]}
        advisorContent={getAdvisorContent(step, state)}
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
                  // TODO: Implement upload flow
                  alert("Upload quote feature coming soon!");
                }
              }}
            />
          )}
          {step === 1 && <Step1V8 state={state} actions={actions} />}
          {step === 2 && <Step2V8 state={state} actions={actions} />}
          {step === 3 && <Step3V8 state={state} actions={actions} />}
          {step === 3.5 && <Step3_5V8 state={state} actions={actions} />}
          {step === 4 && <Step4V8 state={state} actions={actions} />}
          {step === 5 && <Step5V8 state={state} actions={actions} />}
        </Suspense>
      </WizardShellV7>
    </div>
  );
}
