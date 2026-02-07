/**
 * Wizard V7 — Web Page Surface (Fly.io Quality Bar)
 *
 * - SSOT: useWizardV7() orchestrates all state + transitions
 * - Steps are dumb: they render state + emit intents
 * - Shell provides: Merlin Rail + TrueQuote badge + Navigation
 * 
 * ✅ FEB 1, 2026: Navigation now uses wizardStepGates.ts (SSOT)
 * Each step gates on ONLY its own completion criteria.
 * No cross-step dependencies. No pricing/DB/async blocking.
 */

import React, { useMemo, useEffect } from "react";
import { useWizardV7 } from "@/wizard/v7/hooks/useWizardV7";
import { V7_ENABLE_GATED_STEP3, V7_USE_CURATED_STEP3 } from "@/wizard/v7/featureFlags";
import WizardShellV7 from "@/components/wizard/v7/shared/WizardShellV7";
import WizardErrorBoundary from "@/components/wizard/v7/shared/WizardErrorBoundary";
import V7AdvisorPanel from "@/components/wizard/v7/shared/V7AdvisorPanel";
import { resolveStep3Schema } from "@/wizard/v7/schema/curatedFieldsResolver";

// 🤖 AI Agent for self-healing monitoring
import { wizardAIAgent } from "@/services/wizardAIAgentV2";
import { wizardHealthMonitor } from "@/services/wizardHealthMonitor";

// 🔧 Debug Panel (dev-only: Ctrl+Shift+D)
import V7DebugPanel from "@/components/wizard/v7/debug/V7DebugPanel";

// ✅ SSOT Gates (Feb 1, 2026)
import { 
  getGateForStep, 
  type WizardStepId,
  type WizardGateState,
} from "@/wizard/v7/gates";

// Dumb step components
import {
  Step1LocationV7,
  Step2IndustryV7,
  Step3ProfileV7,
  Step3ProfileV7Curated,
  Step3GatedV7,
  Step4ResultsV7,
} from "@/components/wizard/v7/steps";

// ✅ SINGLE SOURCE OF TRUTH: step order
const STEP_ORDER = ["location", "industry", "profile", "results"] as const;
type StepKey = (typeof STEP_ORDER)[number];

// ✅ Single source of truth: labels (used by shell)
const STEP_LABELS = ["Location", "Industry", "Profile", "Quote"] as const;

// Next hints
const NEXT_HINTS: Record<StepKey, string> = {
  location: "industry + load profile → savings estimate",
  industry: "load profile → savings estimate",
  profile: "savings estimate → MagicFit",
  results: "finalize your quote",
};

// Contextual Next button labels
const NEXT_LABELS: Record<StepKey, string> = {
  location: "Choose Industry →",
  industry: "Build Profile →",
  profile: "See Results →",
  results: "Done",
};

function WizardV7Page() {
  const wizard = useWizardV7();
  const { state } = wizard;

  // 🤖 Start AI Agent for self-healing monitoring (Feb 4, 2026)
  useEffect(() => {
    wizardAIAgent.start();
    console.log('🤖 [WizardV7] AI Agent started');
    
    return () => {
      wizardAIAgent.stop();
      console.log('🤖 [WizardV7] AI Agent stopped');
    };
  }, []);

  // Track gate validation issues for AI agent
  useEffect(() => {
    const sessionId = `v7-${Date.now()}`;
    wizardHealthMonitor.track('gate_check', state.step, {
      location: state.location,
      locationRawInput: state.locationRawInput,
      locationConfirmed: state.locationConfirmed,
      industry: state.industry,
    }, sessionId);
  }, [state.step, state.location, state.locationRawInput, state.industry]);

  // ✅ Robust 0-index mapping (no magic fallbacks to industry)
  const currentStep = useMemo(() => {
    const idx = STEP_ORDER.indexOf(state.step as StepKey);
    return idx >= 0 ? idx : 0;
  }, [state.step]);

  const nextHint = (NEXT_HINTS[state.step as StepKey] ?? "") as string;
  const nextLabel = (NEXT_LABELS[state.step as StepKey] ?? "Next Step") as string;

  // ============================================================================
  // GATE CHECK — SSOT (Feb 1, 2026)
  // ============================================================================
  // Each step gates on ONLY its own completion criteria.
  // No cross-step dependencies. No pricing. No DB. No async.
  // ============================================================================
  
  const gateState: WizardGateState = useMemo(() => ({
    location: state.location ? {
      zip: state.location.postalCode,
      postalCode: state.location.postalCode,
      formattedAddress: state.location.formattedAddress,
    } : null,
    locationRawInput: state.locationRawInput ?? '',
    locationConfirmed: state.locationConfirmed,
    industry: state.industry,
    step3Answers: (state.step3Answers ?? {}) as Record<string, unknown>,
    step3Complete: state.step3Complete,
    step3Template: state.step3Template ? {
      questions: (state.step3Template.questions ?? []).map(q => ({
        id: q.id,
        required: q.required,
      })),
    } : null,
  }), [
    state.location,
    state.locationRawInput,
    state.locationConfirmed,
    state.industry,
    state.step3Answers,
    state.step3Complete,
    state.step3Template,
  ]);

  const gate = useMemo(() => {
    return getGateForStep(state.step as WizardStepId, gateState);
  }, [state.step, gateState]);

  // 🔒 HARD INVARIANT — NO SILENT DEAD-ENDS
  if (!gate.canContinue && !gate.reason) {
    console.error("Wizard invariant violated: blocked with no reason", {
      step: state.step,
      gateState,
    });
  }

  // Can we proceed? SSOT gate decides (with isBusy override)
  const canGoNext = useMemo(() => {
    // Always block during async operations
    if (state.isBusy) return false;
    
    // Business confirmation is a special case (not in gate)
    // If business was detected but not confirmed, block
    if (state.step === "location" && state.businessCard && !state.businessConfirmed) {
      return false;
    }
    
    // Step 3 uses its own submit button, so shell Next is disabled
    if (state.step === "profile") {
      return false;
    }
    
    // Results step has no Next
    if (state.step === "results") {
      return false;
    }

    // Otherwise, delegate to gate
    return gate.canContinue;
  }, [
    state.isBusy,
    state.step,
    state.businessCard,
    state.businessConfirmed,
    gate.canContinue,
  ]);

  const canGoBack = currentStep > 0 && !state.isBusy;

  const handleNext = () => {
    if (state.step === "location") {
      if (state.businessCard && !state.businessConfirmed) return;

      // SSOT: if industry locked, skip industry step
      if (state.industryLocked && state.industry !== "auto") {
        wizard.goToStep("profile");
      } else {
        wizard.goToStep("industry");
      }
      return;
    }

    if (state.step === "industry") {
      wizard.goToStep("profile");
      return;
    }

    if (state.step === "profile") {
      wizard.submitStep3();
      return;
    }
  };

  const handleBack = () => {
    wizard.goBack();
  };

  // TrueQuote verified status - true once we have results
  const isVerified = state.step === "results" && !state.isBusy;

  // Gate reason for debug display
  const gateReason = gate.reason;

  // ============================================================================
  // STEP 3 ADVISOR — Real-time progress from curated resolver (Feb 2, 2026)
  // ============================================================================
  const step3Advisor = useMemo(() => {
    if (state.step !== "profile") return null;

    const industry = (state.industry ?? "other") as string;
    const answers = (state.step3Answers ?? {}) as Record<string, unknown>;

    const schema = resolveStep3Schema(industry);

    // isAnswered: same logic as Step3ProfileV7Curated (SSOT)
    const isAnswered = (v: unknown) => {
      if (v === null || v === undefined) return false;
      if (typeof v === "string") return v.trim().length > 0;
      if (typeof v === "number") return Number.isFinite(v);
      if (typeof v === "boolean") return true;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v as object).length > 0;
      return true;
    };

    // Visibility check: fail-open (same as Step3 hardening)
    const isVisible = (q: { conditionalLogic?: { dependsOn?: string; showIf?: (v: unknown) => boolean } }) => {
      const c = q?.conditionalLogic;
      if (!c?.dependsOn || typeof c.showIf !== "function") return true;
      try {
        return !!c.showIf(answers[c.dependsOn]);
      } catch {
        return true; // fail-open
      }
    };

    const isReq = (q: { required?: boolean; validation?: { required?: boolean } }) =>
      (q.required ?? q.validation?.required ?? false) === true;

    const visibleRequired = schema.questions.filter(isReq).filter(isVisible);
    const missing = visibleRequired.filter(q => !isAnswered(answers[q.id])).map(q => q.id);

    const answeredCount = Math.max(0, visibleRequired.length - missing.length);
    const pct = visibleRequired.length === 0 ? 100 : (answeredCount / visibleRequired.length) * 100;

    return {
      schema,
      missing,
      progressPct: pct,
      answeredCount,
      visibleRequiredCount: visibleRequired.length,
    };
  }, [state.step, state.industry, state.step3Answers]);

  // ============================================================================
  // STEP 4 ADVISOR — Real-time financial summary (Feb 3, 2026)
  // ============================================================================
  const step4Advisor = useMemo(() => {
    if (state.step !== "results") return null;
    
    const quote = state.quote;
    const pricingStatus = state.pricingStatus ?? "idle";
    const pricingComplete = quote?.pricingComplete ?? false;
    
    // Format USD with null safety
    const fmtUSD = (n?: number | null): string | null => {
      if (n === null || n === undefined) return null;
      if (!Number.isFinite(n)) return null;
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n);
      } catch {
        return `$${Math.round(n)}`;
      }
    };

    // Track input fallbacks for transparency ("why these numbers?")
    const inputFallbacks = (quote as { inputFallbacks?: Record<string, { value: unknown; reason: string }> })?.inputFallbacks;
    const fallbackLines: string[] = [];
    if (inputFallbacks?.electricityRate) {
      fallbackLines.push(`Rate: $${inputFallbacks.electricityRate.value}/kWh (${inputFallbacks.electricityRate.reason})`);
    }
    if (inputFallbacks?.demandCharge) {
      fallbackLines.push(`Demand: $${inputFallbacks.demandCharge.value}/kW (${inputFallbacks.demandCharge.reason})`);
    }
    if (inputFallbacks?.location) {
      fallbackLines.push(`Location: ${inputFallbacks.location.value} (${inputFallbacks.location.reason})`);
    }
    
    return {
      pricingStatus,
      pricingComplete,
      capexUSD: fmtUSD(quote?.capexUSD as number | null | undefined),
      annualSavingsUSD: fmtUSD(quote?.annualSavingsUSD as number | null | undefined),
      roiYears: quote?.roiYears ? `${Number(quote.roiYears).toFixed(1)} years` : null,
      bessKWh: quote?.bessKWh ? `${Math.round(quote.bessKWh as number)} kWh` : null,
      peakLoadKW: quote?.peakLoadKW ? `${Math.round(quote.peakLoadKW as number)} kW` : null,
      pricingSnapshotId: quote?.pricingSnapshotId as string | undefined,
      fallbackLines,
    };
  }, [state.step, state.quote, state.pricingStatus]);

  // ============================================================================
  // RIGHT PANEL — Advisor (Feb 2, 2026)
  // ============================================================================
  const rightPanel = useMemo(() => {
    // Results: verified TrueQuote with financial summary
    if (state.step === "results" && step4Advisor) {
      const { pricingStatus, pricingComplete, capexUSD, annualSavingsUSD, roiYears, bessKWh, peakLoadKW, pricingSnapshotId, fallbackLines } = step4Advisor;
      
      // Build dynamic bullets based on what data is available
      const bullets: string[] = [];
      
      if (pricingStatus === "pending") {
        bullets.push("⏳ Calculating your TrueQuote™...");
      } else if (pricingStatus === "timed_out") {
        bullets.push("⏱️ Pricing timed out — load profile available");
        bullets.push("Use Retry button to try again");
      } else if (pricingStatus === "error") {
        bullets.push("⚠️ Pricing error — use Retry button below");
      } else if (pricingComplete) {
        if (capexUSD) bullets.push(`💰 Investment: ${capexUSD}`);
        if (annualSavingsUSD) bullets.push(`📈 Annual Savings: ${annualSavingsUSD}`);
        if (roiYears) bullets.push(`⏱️ Payback: ${roiYears}`);
        if (bessKWh) bullets.push(`🔋 BESS: ${bessKWh}`);
        if (bullets.length === 0) {
          bullets.push("Quote calculated — see details below");
        }
        // Show fallbacks used (transparency: "why these numbers?")
        if (fallbackLines.length > 0) {
          bullets.push("ℹ️ Default inputs used:");
          fallbackLines.forEach(line => bullets.push(`  • ${line}`));
        }
      } else {
        if (peakLoadKW) bullets.push(`⚡ Peak Load: ${peakLoadKW}`);
        bullets.push("Load profile ready — financials pending");
        // Show what's missing
        if (fallbackLines.length > 0) {
          bullets.push("ℹ️ Using default values for:");
          fallbackLines.forEach(line => bullets.push(`  • ${line}`));
        }
      }
      
      // Status badges
      const badges: Array<{ label: string; tone: "green" | "amber" | "violet" | "blue" }> = [];
      
      if (pricingStatus === "ok" && pricingComplete) {
        badges.push({ label: "TrueQuote™ • Verified", tone: "green" });
      } else if (pricingStatus === "pending") {
        badges.push({ label: "calculating...", tone: "blue" });
      } else if (pricingStatus === "timed_out") {
        badges.push({ label: "timed out", tone: "amber" });
      } else if (pricingStatus === "error") {
        badges.push({ label: "pricing error", tone: "amber" });
      } else {
        badges.push({ label: "load profile only", tone: "amber" });
      }
      
      if (pricingSnapshotId) {
        badges.push({ label: `snap:${pricingSnapshotId.slice(5, 13)}`, tone: "violet" });
      }
      
      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle="Results • Step 4"
          badges={badges}
          bullets={bullets}
          progressPct={pricingComplete ? 100 : (pricingStatus === "pending" ? 50 : 25)}
        />
      );
    }

    // Results fallback (no advisor data)
    if (state.step === "results") {
      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle="TrueQuote™ • Verified"
          badges={[
            { label: "quote-ready", tone: "green" },
            { label: gate.canContinue ? "gate: ok" : "gate: blocked", tone: gate.canContinue ? "green" : "amber" },
          ]}
          bullets={[
            "Review your savings breakdown below.",
            "Download PDF or request a consultation.",
          ]}
        />
      );
    }

    // Step 3: Real-time progress from curated resolver
    if (state.step === "profile" && step3Advisor) {
      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle={`${step3Advisor.schema.displayName} • Step 3`}
          badges={[
            { label: `source: ${step3Advisor.schema.source}`, tone: "violet" },
            { 
              label: `required: ${step3Advisor.answeredCount}/${step3Advisor.visibleRequiredCount}`, 
              tone: step3Advisor.missing.length ? "amber" : "green" 
            },
            { label: gate.canContinue ? "gate: ok" : "gate: blocked", tone: gate.canContinue ? "green" : "amber" },
          ]}
          progressPct={step3Advisor.progressPct}
          bullets={[
            "Progress only counts required fields you can see.",
            "Conditional visibility fails open — no deadlocks.",
          ]}
          missing={step3Advisor.missing.slice(0, 12)} // keep it readable
        />
      );
    }

    // Location step: location-specific guidance
    if (state.step === "location") {
      const hasZip = !!state.locationRawInput?.trim();
      const hasLocation = !!state.location;
      const hasBusiness = !!state.businessCard;
      const needsConfirm = hasBusiness && !state.businessConfirmed;

      const bullets: string[] = [];
      if (!hasZip) {
        bullets.push("Enter your ZIP code to unlock utility rates, solar potential & incentives.");
        bullets.push("Merlin auto-detects your state, climate zone & grid region.");
      } else if (!hasLocation) {
        bullets.push("Resolving your location…");
      } else if (needsConfirm) {
        bullets.push("Confirm your business to auto-detect industry.");
        bullets.push("Or skip and choose industry manually.");
      } else {
        bullets.push("✅ Location locked.");
        if (state.locationIntel?.utilityRate) {
          bullets.push(`⚡ Utility rate: $${state.locationIntel.utilityRate.toFixed(4)}/kWh`);
        }
        if (state.locationIntel?.peakSunHours) {
          bullets.push(`☀️ Solar: ${state.locationIntel.peakSunHours.toFixed(1)} peak sun hours`);
        }
        bullets.push("Click Next to choose your industry.");
      }

      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle="Location • Step 1"
          badges={[
            { label: hasLocation ? "location: set" : "location: needed", tone: hasLocation ? "green" : "amber" },
            { label: gate.canContinue ? "gate: ok" : "gate: blocked", tone: gate.canContinue ? "green" : "amber" },
          ]}
          bullets={bullets}
        />
      );
    }

    // Industry step: guide the choice
    if (state.step === "industry") {
      const locLine = state.location
        ? [state.location.city, state.location.state].filter(Boolean).join(", ")
        : "Unknown";

      const bullets: string[] = [
        `📍 Location: ${locLine}`,
        "Select the industry that best matches your facility.",
        "This determines your load profile, peak demand, and savings model.",
      ];

      if (state.industryLocked && state.industry !== "auto") {
        bullets.push(`✅ Industry auto-detected: ${state.industry}. Click Next to skip.`);
      }

      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle="Industry • Step 2"
          badges={[
            { label: state.industry && state.industry !== "auto" ? `industry: ${state.industry}` : "industry: needed", tone: state.industry && state.industry !== "auto" ? "green" : "amber" },
            { label: gate.canContinue ? "gate: ok" : "gate: blocked", tone: gate.canContinue ? "green" : "amber" },
          ]}
          bullets={bullets}
        />
      );
    }

    // Fallback (shouldn't reach here, but safe)
    return (
      <V7AdvisorPanel
        title="Merlin Advisor"
        subtitle={`Step: ${state.step}`}
        badges={[
          { label: gate.canContinue ? "gate: ok" : "gate: blocked", tone: gate.canContinue ? "green" : "amber" },
        ]}
        bullets={[
          gate.canContinue
            ? "You're clear to proceed to the next step."
            : gate.reason ?? "Complete this step to continue.",
        ]}
      />
    );
  }, [state.step, step3Advisor, step4Advisor, gate.canContinue, gate.reason]);

  return (
    <div data-wizard-version="v7" className="w-full h-full">
      <WizardShellV7
        currentStep={currentStep}         // 0-index internal
        stepLabels={[...STEP_LABELS]}     // ✅ shell no longer has its own steps list
        nextHint={nextHint}
        nextLabel={nextLabel}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        isNextLoading={state.isBusy}
        onBack={handleBack}
        onNext={handleNext}
        isVerified={isVerified}
        advisorContent={rightPanel}    // ✅ Advisor panel in left rail
      >
        {/* DEV-ONLY: Gate Debug Panel */}
        {import.meta.env.DEV && !gate.canContinue && gateReason && (
          <div
            data-testid="wizard-gate-debug"
            data-step={state.step}
            data-reason={gateReason}
            style={{
              padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.25)",
            marginBottom: 16,
            fontSize: 13,
            color: "rgba(251, 191, 36, 0.9)",
            fontFamily: "monospace",
          }}
        >
          <strong>Gate blocked:</strong> {gateReason} (step: {state.step})
        </div>
      )}

      {/* Error overlay */}
      {state.error?.message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 14, color: "rgba(239, 68, 68, 0.9)" }}>
            {state.error.message}
          </span>
          <button
            onClick={wizard.clearError}
            style={{
              background: "none",
              border: "none",
              color: "rgba(239, 68, 68, 0.7)",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Step Router */}
      {state.step === "location" && (
        <Step1LocationV7
          state={state}
          actions={{
            updateLocationRaw: wizard.updateLocationRaw,
            submitLocation: wizard.submitLocation,
            primeLocationIntel: wizard.primeLocationIntel,
            confirmBusiness: wizard.confirmBusiness,
            skipBusiness: wizard.skipBusiness,
            setBusinessDraft: wizard.setBusinessDraft,
          }}
        />
      )}

      {state.step === "industry" && (
        <Step2IndustryV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            selectIndustry: wizard.selectIndustry,
          }}
        />
      )}

      {/* Step 3: Profile (feature-flagged between Profile, Curated, and Gated) */}
      {/* Priority: Gated > Curated > Basic Profile */}
      {state.step === "profile" && !V7_ENABLE_GATED_STEP3 && V7_USE_CURATED_STEP3 && (
        <Step3ProfileV7Curated
          state={state}
          actions={{
            // MINIMAL CONTRACT (Feb 2, 2026): Same as Step3ProfileV7
            setStep3Answer: wizard.setStep3Answer,
            submitStep3: wizard.submitStep3,
            goBack: wizard.goBack,
          }}
        />
      )}

      {/* Fallback: Basic Step 3 Profile (when curated is disabled) */}
      {state.step === "profile" && !V7_ENABLE_GATED_STEP3 && !V7_USE_CURATED_STEP3 && (
        <Step3ProfileV7
          state={state}
          actions={{
            // MINIMAL CONTRACT (Feb 1, 2026): Only methods Step3ProfileV7 actually uses
            // We DO NOT pass canApplyDefaults/canResetToDefaults — they were causing crashes
            setStep3Answer: wizard.setStep3Answer,
            submitStep3: wizard.submitStep3,
            goBack: wizard.goBack,
          }}
        />
      )}

      {/* Step 3 Gated: 4-part questionnaire (behind feature flag) */}
      {/* NOTE: Gated Step3 requires template format IndustryTemplateV1 and additional SSOT actions */}
      {/* These are provided via wizard hook when V7_ENABLE_GATED_STEP3=true */}
      {state.step === "profile" && V7_ENABLE_GATED_STEP3 && (
        <Step3GatedV7
          template={state.step3Template as Parameters<typeof Step3GatedV7>[0]['template']}
          answers={state.step3Answers}
          onAnswerChange={wizard.setStep3Answer}
          onResetPart={(partId: string) => wizard.resetToDefaults({ partId })}
          onDefaultsApplied={wizard.markDefaultsApplied}
          hasDefaultsApplied={wizard.hasDefaultsApplied}
          canResetToDefaults={wizard.canResetToDefaults}
          canApplyDefaults={wizard.canApplyDefaults}
          applyStep3Defaults={(partId: string) => wizard.resetToDefaults({ partId })} // Map to resetToDefaults
          getDefaultForQuestion={wizard.getDefaultForQuestion}
          onComplete={wizard.submitStep3}
          onBack={wizard.goBack}
          lifeSignals={wizard.lifeSignals}
          selectedIndustrySlug={state.industry}
          industryDisplayName={state.step3Template?.selectedIndustry || state.industry}
          isBusy={state.isBusy}
        />
      )}

      {state.step === "results" && (
        <Step4ResultsV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            resetSession: wizard.resetSession,
            goToStep: wizard.goToStep,
            // Phase 6: Pricing retry (non-blocking)
            retryPricing: wizard.retryPricing,
          }}
        />
      )}
      </WizardShellV7>

      {/* 🔧 Debug Panel — Dev-only, toggle with Ctrl+Shift+D */}
      <V7DebugPanel state={state} />
    </div>
  );
}
// Wrap export with error boundary for crash protection
export default function WizardV7PageWithBoundary() {
  return (
    <WizardErrorBoundary>
      <WizardV7Page />
    </WizardErrorBoundary>
  );
}