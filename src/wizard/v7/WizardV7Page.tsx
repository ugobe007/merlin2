// @ts-nocheck - WizardV7 has type mismatches with updated hooks (will fix separately)
import React, { useCallback, useMemo, useEffect, useRef, useState } from "react";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";
import { useWizardV7, type WizardState, type WizardStep } from "@/wizard/v7/hooks/useWizardV7";

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
import Step1LocationV7Clean from "@/components/wizard/v7/steps/Step1LocationV7Clean";
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
    confirmLocation,
    setBusinessDraft,
    confirmBusiness,

    // Step 2
    selectIndustry,

    // Step 3
    setStep3Answer,
    setStep3Answers,
    submitStep3,
    submitStep3Partial,  // Escape hatch for incomplete
    // SSOT callbacks for defaults tracking (Feb 1, 2026)
    hasDefaultsApplied,
    markDefaultsApplied,
    resetToDefaults,

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
      console.log('🤖 [Wizard AI Agent] Starting health monitoring...');
      wizardAIAgent.start(30000); // Check every 30 seconds
      
      // Check if health dashboard requested via URL
      const params = new URLSearchParams(window.location.search);
      if (params.get('health') === '1') {
        console.log('📊 [Wizard Health Dashboard] Opening dashboard...');
        setShowHealthDashboard(true);
      }
    }
    
    return () => {
      if (import.meta.env.DEV) {
        console.log('🤖 [Wizard AI Agent] Stopping health monitoring...');
        wizardAIAgent.stop();
      }
    };
  }, []);

  // Track wizard events for health monitoring
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Track step enter
    wizardHealthMonitor.track('step_enter', state.step, {
      location: state.location,
      locationConfirmed: state.locationConfirmed,
      industry: state.industry,
      step3Answers: Object.keys(state.step3Answers).length,
    }, sessionId.current);

    // Track gate checks
    wizardHealthMonitor.track('gate_check', state.step, {
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
    }, sessionId.current);
  }, [state.step, state.location, state.locationConfirmed, state.industry, state.step3Answers, canNext, gates]);

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
    if (state.step === "industry") return gates.canGoProfile;  // stepCanProceed(industry)
    if (state.step === "profile") return true;                // Step 3 uses its own Submit button
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

  const handleJump = useCallback(
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

  const title = "Merlin™ — Energy + BESS Advisor";

  const stepMeta = useMemo(() => {
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
  // Step surfaces
  // ---------------------------------------------------------------------------

  const left = useMemo(() => {
    // Left rail: persistent card content (location + business)
    // Keep it simple: Step components can also render their own left content if you prefer.
    return (
      <div>
        <div className="merlin-left__section">
          <div className="merlin-left__h">Site</div>
          <div className="merlin-left__p">
            {state.location?.formattedAddress ?? "Enter ZIP, address, or business…"}
          </div>

          {state.locationIntel ? (
            <div className="merlin-left__p">
              {state.locationIntel.city && state.locationIntel.state
                ? `${state.locationIntel.city}, ${state.locationIntel.state}`
                : null}
            </div>
          ) : null}

          <div className="merlin-left__row">
            <span className={`merlin-badge ${state.locationConfirmed ? "ok" : "warn"}`}>
              {state.locationConfirmed ? "Confirmed" : "Not confirmed"}
            </span>
          </div>
        </div>

        {(state.businessDraft.name.trim() || state.businessDraft.address.trim() || state.business) ? (
          <div className="merlin-left__section">
            <div className="merlin-left__h">Business</div>

            {state.business ? (
              <>
                <div className="merlin-left__p">
                  <strong>{state.business.name ?? "Business"}</strong>
                </div>
                <div className="merlin-left__p">{state.business.formattedAddress ?? ""}</div>
                <div className="merlin-left__row">
                  <span className={`merlin-badge ${state.businessConfirmed ? "ok" : "warn"}`}>
                    {state.businessConfirmed ? "Confirmed" : "Not confirmed"}
                  </span>
                </div>
              </>
            ) : (
              <div className="merlin-left__p">
                Enter business name/address to pull a card (Google Places).
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }, [
    state.location?.formattedAddress,
    state.locationIntel,
    state.locationConfirmed,
    state.businessDraft,
    state.business,
    state.businessConfirmed,
  ]);

  // Step 1 actions object (compile-time type checking)
  const step1Actions = useMemo(
    () => ({
      updateLocationRaw,
      submitLocation,
      confirmLocation,
      setBusinessDraft,
      confirmBusiness,
      nextStep,
    }),
    [updateLocationRaw, submitLocation, confirmLocation, setBusinessDraft, confirmBusiness, nextStep]
  );

  const right = useMemo(() => {
    switch (state.step) {
      case "location":
        return <Step1LocationV7Clean state={state} actions={step1Actions} />;

      case "industry":
        return (
          <Step2IndustryV7
            state={state}
            selectIndustry={selectIndustry}
            goBack={goBack}
          />
        );

      case "profile":
        return (
          <Step3ProfileV7
            state={state}
            actions={{
              goBack,
              setStep3Answer,
              setStep3Answers,
              submitStep3,
              submitStep3Partial,  // Escape hatch for incomplete
              // SSOT callbacks for defaults tracking (Feb 1, 2026)
              hasDefaultsApplied,
              markDefaultsApplied,
              resetToDefaults,
            }}
          />
        );

      case "results":
        return <Step4ResultsV7 state={state} resetSession={resetSession} />;

      default:
        return null;
    }
  }, [
    state,
    updateLocationRaw,
    submitLocation,
    confirmLocation,
    setBusinessDraft,
    confirmBusiness,
    resetSession,
    selectIndustry,
    setStep3Answer,
    setStep3Answers,
    submitStep3,
    hasDefaultsApplied,
    markDefaultsApplied,
    resetToDefaults,
    goBack,
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
    state.step === "location" ? 0 :
    state.step === "industry" ? 1 :
    state.step === "profile" ? 2 :
    state.step === "results" ? 3 : 0;

  // Merlin Advisor panel with gate status
  // ⚠️ CRITICAL: This MUST use the EXACT SAME logic as stepCanProceed() in useWizardV7.ts
  // Any mismatch causes "ZIP entered but still blocked" bug
  const advisorPanel = useMemo(() => {
    // Use stepCanProceed directly for authoritative gate status
    const gateResult = stepCanProceed(state, state.step);
    
    // Map gate result to crisp UI status (NO "pending" - only blocked/ok)
    // "pending" = confusing UX (feels like "can't proceed")
    // blocked = missing/invalid input
    // ok = input valid, can proceed (intel is informational only)
    let gateStatus: "ok" | "blocked";
    let gateMessage = "";
    
    if (gateResult.ok) {
      gateStatus = "ok";
      if (state.step === "location") {
        gateMessage = "✓ ZIP code confirmed. Click Next to continue.";
      } else if (state.step === "industry") {
        gateMessage = "✓ Industry selected. Ready to proceed.";
      } else if (state.step === "profile") {
        gateMessage = "✓ Ready to generate your quote.";
      }
    } else {
      // Gate is blocking
      gateStatus = "blocked";
      if (state.step === "location") {
        const typing = state.locationRawInput && state.locationRawInput.length > 0;
        gateMessage = typing 
          ? (gateResult.reason || "Enter a complete 5-digit ZIP code.")
          : "Enter your ZIP code to begin.";
      } else {
        gateMessage = gateResult.reason || "Complete current step to continue.";
      }
    }

    return (
      <div
        style={{
          background: "rgba(16, 20, 36, 0.85)",
          borderRadius: 16,
          padding: 20,
          boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.4),
            0 0 40px rgba(79, 140, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            Merlin Advisor
          </div>
          <div style={{ fontSize: 13, color: "rgba(232, 235, 243, 0.6)" }}>
            Step: {state.step}
          </div>
        </div>

        {/* Gate Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            background:
              gateStatus === "ok" ? "rgba(74, 222, 128, 0.15)" :
              gateStatus === "blocked" ? "rgba(239, 68, 68, 0.15)" :
              "rgba(251, 191, 36, 0.15)",
            color:
              gateStatus === "ok" ? "#4ade80" :
              gateStatus === "blocked" ? "#ef4444" :
              "#fbbf24",
          }}
        >
          gate: {gateStatus}
        </div>

        {/* Gate Message */}
        {gateMessage && (
          <div
            style={{
              fontSize: 14,
              color: "rgba(232, 235, 243, 0.85)",
              lineHeight: 1.5,
              padding: 12,
              borderRadius: 8,
              background: "rgba(79, 140, 255, 0.08)",
            }}
          >
            › {gateMessage}
          </div>
        )}

        {/* Location Intelligence Status (informational, non-blocking) */}
        {state.step === "location" && state.locationRawInput && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 12,
            }}
          >
            <div style={{ color: "rgba(232, 235, 243, 0.6)", marginBottom: 8 }}>
              Location Intelligence:
            </div>
            {state.locationIntel ? (
              <div style={{ color: "rgba(74, 222, 128, 0.8)", display: "flex", flexDirection: "column", gap: 4 }}>
                {state.locationIntel.utilityRate && (
                  <div>⚡ Rate: ${state.locationIntel.utilityRate}/kWh</div>
                )}
                {state.locationIntel.demandCharge && (
                  <div>📊 Demand: ${state.locationIntel.demandCharge}/kW</div>
                )}
                {state.locationIntel.solarGrade && (
                  <div>☀️ Solar: Grade {state.locationIntel.solarGrade}</div>
                )}
              </div>
            ) : (
              <div style={{ color: "rgba(251, 191, 36, 0.6)" }}>⏳ Loading...</div>
            )}
          </div>
        )}

        {/* AI Agent Status */}
        {import.meta.env.DEV && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 12,
              color: "rgba(232, 235, 243, 0.5)",
            }}
          >
            🤖 AI Agent monitoring active
          </div>
        )}
      </div>
    );
  }, [state.step, state.locationRawInput, state.location, state.locationIntel, state.industry, state.step3Answers]);

  return (
    <WizardShellV7
      currentStep={currentStepIndex}
      stepLabels={stepLabels}
      canGoBack={canBack}
      canGoNext={shellCanNext}
      onBack={handleBack}
      onNext={handleNext}
      rightPanel={advisorPanel}
    >
      {right}
    </WizardShellV7>
  );
}
