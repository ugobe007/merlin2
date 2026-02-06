import React, { useCallback, useMemo, useEffect, useRef, useState } from "react";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";
import {
  useWizardV7,
  type WizardState,
  type WizardStep,
  getPhase,
} from "@/wizard/v7/hooks/useWizardV7";

/**
 * ⚠️ IMPORT GATE FUNCTION FOR ADVISOR PANEL
 * This ensures advisor panel uses EXACT SAME logic as navigation gates.
 * Any mismatch causes "ZIP entered but gate still blocked" bug.
 */
function stepCanProceed(state: WizardState, step: WizardStep): { ok: boolean; reason?: string } {
  // ✅ FIX (Feb 5, 2026): ZIP is location. City/state are enrichment.
  // Hoist ZIP normalization so all step gates can use it.
  const zip = state.location?.zip || state.location?.postalCode || state.locationRawInput || "";
  const normalizedZip = zip.replace(/\D/g, "");
  const hasLoc = !!state.location || normalizedZip.length >= 5;

  if (step === "location") {
    if (normalizedZip.length >= 5) return { ok: true };
    if (state.location?.formattedAddress) return { ok: true };
    return { ok: false, reason: "Please enter a valid ZIP/postal code." };
  }
  if (step === "industry") {
    if (!hasLoc) return { ok: false, reason: "ZIP code missing." };
    if (state.industry === "auto") return { ok: false, reason: "Industry not selected." };
    return { ok: true };
  }
  if (step === "profile") {
    if (!hasLoc) return { ok: false, reason: "ZIP code missing." };
    if (state.industry === "auto") return { ok: false, reason: "Industry missing." };
    if (!state.step3Template) return { ok: false, reason: "Template missing." };
    return { ok: true };
  }
  return { ok: false, reason: "Unknown step." };
}
import { wizardAIAgent } from "@/services/wizardAIAgentV2";
import { wizardHealthMonitor } from "@/services/wizardHealthMonitor";

// Step components (fixed paths)
import Step1LocationV7 from "@/components/wizard/v7/steps/Step1LocationV7";
import Step2IndustryV7 from "@/components/wizard/v7/steps/Step2IndustryV7";
import Step3ProfileV7 from "@/components/wizard/v7/steps/Step3ProfileV7";
import Step4ResultsV7 from "@/components/wizard/v7/steps/Step4ResultsV7";
import WizardHealthDashboard from "@/components/wizard/v7/admin/WizardHealthDashboardV2";

/**
 * WizardV7Page
 * - SSOT page-level router
 * - Owns WizardShellV7 wiring
 * - Steps are "dumb": render + emit intents only
 *
 * URL CONTRACT (Feb 2, 2026):
 * - /wizard → ALWAYS starts at Step 1 (location), clears any persisted state
 * - /wizard?resume=1 → Allows resuming from persisted state
 * - /wizard?step=industry|profile|results → Debug jump (dev only)
 */
export default function WizardV7Page() {
  // AI Agent Health Dashboard state
  const [showHealthDashboard, setShowHealthDashboard] = useState(false);

  const {
    state,
    progress,
    gates,

    goBack,
    goToStep,
    resetSession,

    // Step 1
    updateLocationRaw,
    submitLocation,
    primeLocationIntel,
    setBusinessDraft,
    confirmBusiness,
    skipBusiness,

    // Step 2
    selectIndustry,

    // Step 3
    setStep3Answer,
    setStep3Answers,
    submitStep3,
    submitStep3Partial, // Escape hatch for incomplete
    // SSOT callbacks for defaults tracking (Feb 1, 2026)
    hasDefaultsApplied,
    markDefaultsApplied,
    resetToDefaults,

    // Step 4: pricing retry
    retryPricing,
    retryTemplate,
    retryTemplate,

    clearError,

    // next step resolver (SSOT)
    nextStep,
  } = useWizardV7();

  // ---------------------------------------------------------------------------
  // FRESH START CONTRACT (Feb 2, 2026)
  // The fresh start logic is now handled in useWizardV7 hydration:
  // - Default /wizard ALWAYS starts at Step 1, clears localStorage
  // - Only ?resume=1 allows resuming from localStorage
  // - ?step=X allows debug jumps (dev only, handled below)
  // ---------------------------------------------------------------------------
  const debugJumpApplied = useRef(false);
  const sessionId = useRef(`session-${Date.now()}`);

  // ---------------------------------------------------------------------------
  // AI AGENT INTEGRATION (Feb 4, 2026)
  // - Monitors wizard health in development
  // - Detects dual validation systems, bottlenecks, error spikes
  // - Access dashboard via /wizard?health=1
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🤖 [Wizard AI Agent] Starting health monitoring...");
      wizardAIAgent.start(30000); // Check every 30 seconds

      // Check if health dashboard requested via URL
      const params = new URLSearchParams(window.location.search);
      if (params.get("health") === "1") {
        console.log("📊 [Wizard Health Dashboard] Opening dashboard...");
        setShowHealthDashboard(true);
      }
    }

    return () => {
      if (import.meta.env.DEV) {
        console.log("🤖 [Wizard AI Agent] Stopping health monitoring...");
        wizardAIAgent.stop();
      }
    };
  }, []);

  // Track wizard events for health monitoring
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Track step enter
    wizardHealthMonitor.track(
      "step_enter",
      state.step,
      {
        location: state.location,
        locationConfirmed: state.locationConfirmed,
        industry: state.industry,
        step3Answers: Object.keys(state.step3Answers).length,
      },
      sessionId.current
    );

    // Track gate checks
    wizardHealthMonitor.track(
      "gate_check",
      state.step,
      {
        canProceed: canNext,
        gateState: {
          canGoIndustry: gates.canGoIndustry,
          canGoProfile: gates.canGoProfile,
        },
        state: {
          location: state.location,
          locationConfirmed: state.locationConfirmed,
          industry: state.industry,
        },
      },
      sessionId.current
    );
  }, [
    state.step,
    state.location,
    state.locationConfirmed,
    state.industry,
    state.step3Answers,
    canNext,
    gates,
  ]);

  useEffect(() => {
    if (debugJumpApplied.current) return;
    debugJumpApplied.current = true;

    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get("step") as "location" | "industry" | "profile" | "results" | null;

    if (stepParam && import.meta.env.DEV) {
      console.log("[V7 Debug] Jump to step:", stepParam);
      goToStep(stepParam);
    }
  }, [goToStep]);

  // ---------------------------------------------------------------------------
  // Top-level Next / Back wiring (Shell buttons)
  // ---------------------------------------------------------------------------

  const canBack = state.stepHistory.length > 1;

  const canNext = useMemo(() => {
    if (state.step === "location") return gates.canGoIndustry; // stepCanProceed(location)
    if (state.step === "industry") return gates.canGoProfile; // stepCanProceed(industry)
    if (state.step === "profile") return true; // Step 3 uses its own Submit button
    if (state.step === "results") return false;
    return false;
  }, [state.step, gates.canGoIndustry, gates.canGoProfile]);

  const handleBack = useCallback(() => {
    clearError();
    goBack();
  }, [clearError, goBack]);

  const handleNext = useCallback(() => {
    clearError();

    // IMPORTANT:
    // - Step 1/2 navigation happens through goToStep which enforces SSOT gates
    // - Step 3 "Next" is disabled (we use a Generate Quote action inside Step 3)
    const target = nextStep();
    if (!target) return;

    if (state.step === "profile") {
      // Step 3 should not use shell Next
      return;
    }

    void goToStep(target);
  }, [clearError, goToStep, nextStep, state.step]);

  const _handleJump = useCallback(
    (n: number | string) => {
      // Optional: map dots to steps, but keep monotonic gating enforced by goToStep
      // 1=location, 2=industry, 3=profile, 4=results
      const idx = typeof n === "number" ? n : Number(n);
      if (idx === 1) return void goToStep("location");
      if (idx === 2) return void goToStep("industry");
      if (idx === 3) return void goToStep("profile");
      if (idx === 4) return void goToStep("results");
    },
    [goToStep]
  );

  // ---------------------------------------------------------------------------
  // Title + label
  // ---------------------------------------------------------------------------

  const _title = "Merlin™ — Energy + BESS Advisor";

  const _stepMeta = useMemo(() => {
    const labelByStep: Record<string, string> = {
      location: "Confirm your site",
      industry: "Choose your industry",
      profile: "Tell us about your load",
      results: "Your TrueQuote™ options",
    };

    // progress.stepIndex is 0..3
    const index = progress.stepIndex + 1;

    return {
      index,
      count: progress.stepCount,
      label: labelByStep[state.step] ?? "Wizard",
    };
  }, [progress.stepIndex, progress.stepCount, state.step]);

  // ---------------------------------------------------------------------------
  // Merlin Advisor Narration (left rail — single voice)
  // ---------------------------------------------------------------------------
  // Phase-aware: Steps 1-3 = "modeling" (soft guidance), Step 4 = "truequote" (accuracy lock)

  const advisorContent = useMemo(() => {
    const gateResult = stepCanProceed(state, state.step);
    const phase = getPhase(state.step);

    // =========================================================================
    // Canonical Advisor Narration Scripts (Feb 6, 2026)
    // Deterministic, mode-aware, honest about TrueQuote™ vs Estimate.
    // Each step has 3-4 states keyed off observable wizard state fields.
    // =========================================================================
    const getNarration = (): { message: string; tone: "guide" | "ready" | "lock" } => {
      // ----- Step 1: Location (ZIP) -----
      if (state.step === "location") {
        const rawDigits = (state.locationRawInput || "").replace(/\D/g, "");
        const hasZip = rawDigits.length >= 5;
        const isPartial = rawDigits.length > 0 && rawDigits.length < 5;

        // ZIP invalid (partial or non-numeric attempt)
        if (isPartial) {
          return {
            message:
              "I need a valid 5-digit ZIP to continue. Example: 90210. If you're outside the U.S., tell me and we'll switch modes.",
            tone: "guide",
          };
        }
        // No input yet (initial)
        if (!hasZip) {
          return {
            message:
              "Where should I model your site? Enter a 5-digit ZIP code. I'll use it to pull local utility patterns and weather context.",
            tone: "guide",
          };
        }
        // ZIP entered but intel not yet back (validating)
        if (!state.locationIntel) {
          return {
            message: "Checking that ZIP… If anything looks off, you can correct it and try again.",
            tone: "guide",
          };
        }
        // ZIP valid + intel loaded
        return {
          message:
            "Perfect. Location locked. Next I'll tailor the questionnaire to your facility type.",
          tone: "ready",
        };
      }

      // ----- Step 2: Industry selection (critical path) -----
      if (state.step === "industry") {
        // No industry selected yet
        if (!state.industry || state.industry === "auto") {
          return {
            message:
              "Pick your facility type. This determines your TrueQuote™ profile — the questions I ask and the physics model behind your numbers.",
            tone: "guide",
          };
        }
        // Industry selected, template loading in progress
        if (state.isBusy && state.busyLabel?.toLowerCase().includes("template")) {
          return {
            message: "Loading your industry profile… This should take a moment.",
            tone: "guide",
          };
        }
        // Fallback mode triggered (API down / template not found)
        if (state.templateMode === "fallback") {
          return {
            message:
              "I couldn't load your industry profile right now. No problem — I'm switching to a general facility questionnaire so you can keep moving. You'll get a solid estimate, and we can retry the industry profile anytime to upgrade to TrueQuote™.",
            tone: "guide",
          };
        }
        // Industry loaded successfully
        return {
          message:
            "Great — industry profile loaded. Now I'll ask the minimum set of questions needed for a TrueQuote-grade result.",
          tone: "ready",
        };
      }

      // ----- Step 3: Profile questions (industry vs fallback) -----
      if (state.step === "profile") {
        const answered = Object.keys(state.step3Answers).length;
        const total = state.step3Template?.questions?.length ?? 0;
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

        // Fallback mode
        if (state.templateMode === "fallback") {
          return {
            message:
              "We're in Estimate Mode using a general facility template. Answer what you can — this gives a reliable ballpark. When the industry profile loads, we'll swap in the TrueQuote™ questionnaire and keep your answers.",
            tone: "guide",
          };
        }

        // Industry mode — low progress
        if (pct < 30) {
          return {
            message:
              "These questions tune the model to your site. Answer what you know — every response tightens accuracy and reduces assumptions. If you're unsure, choose the closest option; I'll mark anything that's an assumption.",
            tone: "guide",
          };
        }
        // Industry mode — good progress
        if (pct < 80) {
          return {
            message: `Good progress (${pct}% complete). I have enough to model your system — keep going for a tighter estimate.`,
            tone: "guide",
          };
        }
        // Industry mode — nearly complete
        return {
          message:
            "Profile looks solid. When you're ready, hit Generate Quote and I'll run TrueQuote™ validation.",
          tone: "ready",
        };
      }

      // ----- Step 4: Results (TrueQuote™ honesty) -----
      if (state.step === "results") {
        // TrueQuote™ claim requires BOTH conditions:
        // 1. templateMode === "industry" (not generic fallback)
        // 2. confidence.industry === "v1" (validated template, not fallback confidence)
        const isTrueQuoteEligible =
          state.templateMode === "industry" && state.quote?.confidence?.industry === "v1";

        if (!isTrueQuoteEligible) {
          return {
            message:
              "This is a preliminary estimate based on a general facility model. For a TrueQuote™ with full source attribution, try reloading the industry profile.",
            tone: "guide",
          };
        }
        return {
          message:
            "Your TrueQuote™ has been generated with full source attribution. Every number is traceable.",
          tone: "lock",
        };
      }

      return { message: "", tone: "guide" as const };
    };

    const { message, tone } = getNarration();

    const toneColor =
      tone === "ready" ? "#4ade80" : tone === "lock" ? "#f9a825" : "rgba(232, 235, 243, 0.85)";

    return (
      <>
        {/* Narration */}
        <div
          style={{
            fontSize: 14,
            color: toneColor,
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          {message}
        </div>

        {/* Phase indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase" as const,
            background:
              phase === "truequote" ? "rgba(249, 168, 37, 0.15)" : "rgba(79, 140, 255, 0.1)",
            color: phase === "truequote" ? "#f9a825" : "rgba(79, 140, 255, 0.8)",
          }}
        >
          {phase === "truequote" ? "◎ TrueQuote™ Zone" : "◎ Modeling"}
        </div>

        {/* Location intelligence (when available) */}
        {state.locationIntel && (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {state.locationIntel.utilityRate != null && (
              <div style={{ color: "rgba(74, 222, 128, 0.8)" }}>
                ⚡ Rate: ${state.locationIntel.utilityRate}/kWh
              </div>
            )}
            {state.locationIntel.demandCharge != null && (
              <div style={{ color: "rgba(74, 222, 128, 0.8)" }}>
                📊 Demand: ${state.locationIntel.demandCharge}/kW
              </div>
            )}
            {state.locationIntel.solarGrade && (
              <div style={{ color: "rgba(74, 222, 128, 0.8)" }}>
                ☀️ Solar: Grade {state.locationIntel.solarGrade}
              </div>
            )}
          </div>
        )}

        {/* Confidence badge (results step only) */}
        {state.step === "results" && state.quote?.confidence && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              background:
                state.quote.confidence.overall === "high"
                  ? "rgba(74, 222, 128, 0.1)"
                  : state.quote.confidence.overall === "medium"
                    ? "rgba(251, 191, 36, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
              color:
                state.quote.confidence.overall === "high"
                  ? "#4ade80"
                  : state.quote.confidence.overall === "medium"
                    ? "#fbbf24"
                    : "#ef4444",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Confidence: {state.quote.confidence.overall.toUpperCase()}
            </div>
            <div style={{ opacity: 0.8 }}>
              {state.quote.confidence.userInputs} user inputs ·{" "}
              {state.quote.confidence.defaultsUsed} defaults
              {state.quote.confidence.industry === "fallback" && " · generic template"}
            </div>
          </div>
        )}

        {/* DEV: gate debug */}
        {import.meta.env.DEV && (
          <div style={{ marginTop: 10, fontSize: 11, color: "rgba(232,235,243,0.35)" }}>
            gate: {gateResult.ok ? "ok" : `blocked (${gateResult.reason})`} · step: {state.step}
          </div>
        )}
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.* fields are listed individually for perf
  }, [
    state.step,
    state.locationRawInput,
    state.location,
    state.locationIntel,
    state.industry,
    state.isBusy,
    state.busyLabel,
    state.step3Answers,
    state.step3Template,
    state.templateMode,
    state.quote,
  ]);

  // Step 1 actions object — must match Step1LocationV7's Actions type exactly
  const step1Actions = useMemo(
    () => ({
      updateLocationRaw,
      submitLocation,
      primeLocationIntel,
      confirmBusiness,
      skipBusiness,
      setBusinessDraft,
    }),
    [
      updateLocationRaw,
      submitLocation,
      primeLocationIntel,
      confirmBusiness,
      skipBusiness,
      setBusinessDraft,
    ]
  );

  const right = useMemo(() => {
    switch (state.step) {
      case "location":
        return <Step1LocationV7 state={state} actions={step1Actions} />;

      case "industry":
        return <Step2IndustryV7 state={state} actions={{ selectIndustry, goBack }} />;

      case "profile":
        return (
          <Step3ProfileV7
            state={state}
            actions={{
              goBack,
              setStep3Answer,
              setStep3Answers,
              submitStep3,
              submitStep3Partial, // Escape hatch for incomplete
              retryTemplate, // Upgrade fallback → industry without losing answers
              // SSOT callbacks for defaults tracking (Feb 1, 2026)
              hasDefaultsApplied,
              markDefaultsApplied,
              resetToDefaults,
            }}
          />
        );

      case "results":
        return (
          <Step4ResultsV7
            state={state}
            actions={{
              goBack,
              resetSession,
              goToStep,
              retryPricing,
              retryTemplate,
            }}
          />
        );

      default:
        return null;
    }
  }, [
    state,
    step1Actions,
    resetSession,
    selectIndustry,
    setStep3Answer,
    setStep3Answers,
    submitStep3,
    submitStep3Partial,
    hasDefaultsApplied,
    markDefaultsApplied,
    resetToDefaults,
    goBack,
    goToStep,
    retryPricing,
    retryTemplate,
  ]);

  // For Step 3, we want the shell "Next" disabled to force the Generate Quote action.
  const shellCanNext = state.step === "profile" ? false : canNext;

  // Show health dashboard if requested via URL
  if (showHealthDashboard && import.meta.env.DEV) {
    return <WizardHealthDashboard />;
  }

  // Step labels for progress rail
  const stepLabels = ["Location", "Industry", "Profile", "Quote"];

  // Current step index (0-based)
  const currentStepIndex =
    state.step === "location"
      ? 0
      : state.step === "industry"
        ? 1
        : state.step === "profile"
          ? 2
          : state.step === "results"
            ? 3
            : 0;

  return (
    <WizardShellV7
      currentStep={currentStepIndex}
      stepLabels={stepLabels}
      canGoBack={canBack}
      canGoNext={shellCanNext}
      onBack={handleBack}
      onNext={handleNext}
      advisorContent={advisorContent}
    >
      {right}
    </WizardShellV7>
  );
}
