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
import { getIndustryMeta } from "@/wizard/v7/industryMeta";
import { useMerlinData } from "@/wizard/v7/memory/useMerlinData";
import { generateMerlinInsights } from "@/wizard/v7/memory/generateMerlinInsights";

// 🤖 AI Agent for self-healing monitoring
import { wizardAIAgent } from "@/services/wizardAIAgentV2";
import { wizardHealthMonitor } from "@/services/wizardHealthMonitor";

// 📇 Persistent business card (follows user through steps 2-4)
import { PersistentBusinessCard } from "@/components/wizard/v7/shared/PersistentBusinessCard";

// 🔧 Debug Panel (dev-only: Ctrl+Shift+D)
import V7DebugPanel from "@/components/wizard/v7/debug/V7DebugPanel";

// ✅ SSOT Gates (Feb 1, 2026)
import { 
  getGateForStep,
  getStepIndex,
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
  Step4OptionsV7,
  Step5MagicFitV7,
  Step6ResultsV7,
} from "@/components/wizard/v7/steps";

// ⚠️ STEP_ORDER removed — import WIZARD_STEP_ORDER from wizardStepGates.ts (SSOT)

// ✅ Single source of truth: labels (used by shell)
const STEP_LABELS = ["Location", "Industry", "Profile", "Options", "MagicFit", "Quote"] as const;

// Next hints (base — overridden dynamically for location step)
const NEXT_HINTS: Record<WizardStepId, string> = {
  location: "industry + load profile → savings estimate",
  industry: "load profile → savings estimate",
  profile: "options → MagicFit → quote",
  options: "MagicFit recommendations → quote",
  magicfit: "your final quote",
  results: "finalize your quote",
};

// Contextual Next button labels (base — overridden dynamically for location step)
const NEXT_LABELS: Record<WizardStepId, string> = {
  location: "Choose Industry →",
  industry: "Build Profile →",
  profile: "See Options →",
  options: "Continue to MagicFit →",
  magicfit: "See My Quote →",
  results: "Done",
};

function WizardV7Page() {
  const wizard = useWizardV7();
  const { state } = wizard;
  const merlinData = useMerlinData(state);

  // 🤖 Start AI Agent for self-healing monitoring (Feb 4, 2026)
  useEffect(() => {
    wizardAIAgent.start();
    console.log('🤖 [WizardV7] AI Agent started');
    
    return () => {
      wizardAIAgent.stop();
      console.log('🤖 [WizardV7] AI Agent stopped');
    };
  }, []);

  // ✅ DEBUG: Log step transitions to verify navigation (Feb 10, 2026)
  useEffect(() => {
    console.log('[WizardV7] step =', state.step, 'locationConfirmed =', state.locationConfirmed, 'goalsConfirmed =', state.goalsConfirmed, 'isBusy =', state.isBusy);
  }, [state.step, state.locationConfirmed, state.goalsConfirmed, state.isBusy]);

  // ─── MERLIN MEMORY NAVIGATOR ─────────────────────────────────────────────
  // Replaces the fragile auto-advance useEffect (removed Feb 11, 2026).
  // Instead of checking 15+ transient reducer flags, we subscribe to Memory:
  //   - Memory has location + goals → leave Step 1
  //   - Memory has industry → leave Step 2
  // The reducer still handles *within-step* UI (edit-clears-confirmation, etc.)
  // but Memory is the SSOT for *cross-step* data flow.
  // ──────────────────────────────────────────────────────────────────────────

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

  // ✅ Robust 0-index mapping — uses WIZARD_STEP_ORDER from gates SSOT
  const currentStep = useMemo(() => {
    const idx = getStepIndex(state.step as WizardStepId);
    return idx >= 0 ? idx : 0;
  }, [state.step]);

  // ✅ Dynamic hint for location step (Feb 11, 2026)
  const nextHint = useMemo(() => {
    if (state.step === "location") {
      const industryDetected = state.industryLocked && state.industry && state.industry !== "auto";
      if (state.locationConfirmed && state.goalsConfirmed && industryDetected) {
        return "load profile → savings estimate";
      }
      if (state.locationConfirmed && !state.goalsConfirmed) {
        return "set your goals → load profile → savings estimate";
      }
    }
    return (NEXT_HINTS[state.step as WizardStepId] ?? "") as string;
  }, [state.step, state.locationConfirmed, state.goalsConfirmed, state.industryLocked, state.industry]);

  // ✅ Dynamic label for location step (Feb 11, 2026)
  const nextLabel = useMemo(() => {
    if (state.step === "location") {
      const industryDetected = state.industryLocked && state.industry && state.industry !== "auto";
      if (state.locationConfirmed && state.goalsConfirmed && industryDetected) {
        return "Continue to Profile →";
      }
      if (state.locationConfirmed && !state.goalsConfirmed) {
        return "Set Goals & Continue →";
      }
      if (state.locationConfirmed && state.goalsConfirmed) {
        return "Choose Industry →";
      }
    }
    return (NEXT_LABELS[state.step as WizardStepId] ?? "Next Step") as string;
  }, [state.step, state.locationConfirmed, state.goalsConfirmed, state.industryLocked, state.industry]);

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
    
    // MagicFit uses internal tier selection, no shell Next
    if (state.step === "magicfit") {
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

  const handleNext = async () => {
    if (state.step === "location") {
      if (state.businessCard && !state.businessConfirmed) return;

      // ✅ FIX Feb 11: If location already confirmed (business path), don't re-submit.
      // Just request the goals modal if goals aren't confirmed yet.
      if (state.locationConfirmed && !state.goalsConfirmed) {
        wizard.requestGoalsModal();
        return;
      }

      // ✅ FIX Feb 11: Everything confirmed — advance without re-submitting
      if (state.locationConfirmed && state.goalsConfirmed) {
        // Skip industry when already locked
        if (state.industryLocked && state.industry && state.industry !== "auto") {
          wizard.goToStep("profile");
        } else {
          wizard.goToStep("industry");
        }
        return;
      }

      // ✅ FIX Feb 2026: Call submitLocation to properly resolve city/state + intel
      // submitLocation handles: resolveLocation → primeLocationIntel → inferIndustry → navigation
      await wizard.submitLocation(state.locationRawInput ?? "");
      return;
    }

    if (state.step === "industry") {
      wizard.goToStep("profile");
      return;
    }

    if (state.step === "profile") {
      console.log("[WizardV7Page] handleNext: Calling wizard.submitStep3()");
      wizard.submitStep3();
      return;
    }

    if (state.step === "options") {
      wizard.goToStep("magicfit");
      return;
    }
  };

  const handleBack = () => {
    wizard.goBack();
  };

  // TrueQuote verified status - true once we have results
  const isVerified = state.step === "results" && !state.isBusy;

  // ============================================================================
  // STEP 3 ADVISOR — Real-time progress from curated resolver (Feb 2, 2026)
  // ============================================================================
  const step3Advisor = useMemo(() => {
    if (state.step !== "profile") return null;

    // ✅ CRITICAL FIX (Feb 10, 2026): Use effectiveIndustry from template (retail → hotel mapping)
    const effectiveIndustry =
      (state.step3Template as any)?.effectiveIndustry ||
      (state.step3Template as any)?.selectedIndustry ||
      state.industry ||
      "other";

    const answers = (state.step3Answers ?? {}) as Record<string, unknown>;

    const schema = resolveStep3Schema(String(effectiveIndustry));

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
  // RIGHT PANEL — Advisor with Memory-Driven Insights (Feb 11, 2026)
  // ============================================================================
  // Blends step-specific progress data (step3 questionnaire, step4 pricing)
  // with cross-slot intelligence from generateMerlinInsights().
  // ============================================================================
  const rightPanel = useMemo(() => {
    // Generate cross-slot insights from Memory
    const insights = generateMerlinInsights(merlinData, state.step);

    // Results: verified TrueQuote with financial summary
    if (state.step === "results" && step4Advisor) {
      const { pricingStatus, pricingComplete, capexUSD, annualSavingsUSD, roiYears, bessKWh, peakLoadKW } = step4Advisor;
      
      const bullets: string[] = [];
      
      if (pricingStatus === "pending") {
        bullets.push("Calculating your TrueQuote™...");
      } else if (pricingStatus === "timed_out") {
        bullets.push("Pricing timed out — load profile available.");
        bullets.push("Use Retry button to try again.");
      } else if (pricingStatus === "error") {
        bullets.push("Pricing error — use Retry button below.");
      } else if (pricingComplete) {
        if (capexUSD) bullets.push(`Investment: ${capexUSD}`);
        if (annualSavingsUSD) bullets.push(`Annual Savings: ${annualSavingsUSD}`);
        if (roiYears) bullets.push(`Payback: ${roiYears}`);
        if (bessKWh) bullets.push(`BESS: ${bessKWh}`);
        if (bullets.length === 0) {
          bullets.push("Quote calculated — see details below.");
        }
      } else {
        if (peakLoadKW) bullets.push(`Peak Load: ${peakLoadKW}`);
        bullets.push("Load profile ready — financials pending.");
      }
      
      // Append Memory-driven insights (cross-slot intelligence)
      for (const insight of insights.bullets) {
        if (bullets.length < 6) bullets.push(insight);
      }

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
      
      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle="Your TrueQuote™ Results"
          badges={badges}
          bullets={bullets}
          progressPct={pricingComplete ? 100 : (pricingStatus === "pending" ? 50 : 25)}
        />
      );
    }

    // Step 3: Real-time progress from curated resolver + Memory insights
    if (state.step === "profile" && step3Advisor) {
      const pct = step3Advisor.progressPct;
      const remaining = step3Advisor.missing.length;

      const bullets: string[] = [];
      if (pct === 0) {
        bullets.push("Because each industry has different peak loads, your answers shape the system size.");
      } else if (remaining > 0) {
        bullets.push(`${remaining} field${remaining === 1 ? "" : "s"} remaining — almost there.`);
      } else {
        bullets.push("✅ All required fields complete. Ready for your options.");
      }
      // Add Memory cross-slot insights
      for (const insight of insights.bullets) {
        if (bullets.length < 4) bullets.push(insight);
      }

      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle={step3Advisor.schema.displayName}
          badges={[
            { 
              label: `${step3Advisor.answeredCount}/${step3Advisor.visibleRequiredCount} complete`, 
              tone: step3Advisor.missing.length ? "amber" : "green" 
            },
          ]}
          progressPct={step3Advisor.progressPct}
          bullets={bullets}
          missing={step3Advisor.missing.slice(0, 6)}
        />
      );
    }

    // Location step: fine-grained state detection + Memory intel
    if (state.step === "location") {
      const hasZip = !!state.locationRawInput?.trim();
      const hasLocation = !!state.location;
      const hasBusiness = !!state.businessCard;
      const needsConfirm = hasBusiness && !state.businessConfirmed;

      let subtitle = "Let's start with your location";
      const bullets: string[] = [];
      let badgeLabel = "getting started";
      let badgeTone: "green" | "amber" | "blue" = "blue";

      const hasIntel = !!(state.locationIntel?.utilityRate || state.locationIntel?.peakSunHours);
      const intelAttempted = !!(
        state.locationIntel?.utilityStatus === "ready" ||
        state.locationIntel?.utilityStatus === "error" ||
        state.locationIntel?.solarStatus === "ready" ||
        state.locationIntel?.solarStatus === "error"
      );

      if (!hasZip) {
        bullets.push("Because utility rates vary by region, your ZIP code unlocks local pricing and solar data.");
        bullets.push("This takes about 10 seconds — then we'll size your system.");
      } else if (!hasLocation && !hasIntel && !intelAttempted) {
        subtitle = "Looking up your area…";
        badgeLabel = "analyzing";
        badgeTone = "amber";
        bullets.push("Pulling utility data, solar irradiance, and weather profile for your area…");
      } else if (!hasLocation && !hasIntel && intelAttempted) {
        subtitle = "ZIP recognized ✓";
        badgeLabel = "ready";
        badgeTone = "amber";
        bullets.push("Couldn't find local utility data for this ZIP — we'll use regional estimates.");
        bullets.push("Hit Next to choose your industry.");
      } else if (needsConfirm) {
        subtitle = "Business detected";
        badgeLabel = "business found";
        badgeTone = "green";
        bullets.push("Because confirming your business helps auto-detect your industry and tailor the analysis.");
        bullets.push("Not your business? Skip it and choose your industry next.");
      } else {
        subtitle = hasLocation ? "Location locked in ✓" : "Location data loaded ✓";
        badgeLabel = "ready";
        badgeTone = "green";
        // Use Memory insights instead of manual intel formatting
        for (const insight of insights.bullets) {
          if (bullets.length < 4) bullets.push(insight);
        }
        if (bullets.length === 0) {
          bullets.push("Add your business name for better accuracy, or continue to choose your industry.");
        }
      }

      return (
        <V7AdvisorPanel
          title="Merlin Advisor"
          subtitle={subtitle}
          badges={[{ label: badgeLabel, tone: badgeTone }]}
          bullets={bullets}
        />
      );
    }

    // All other steps: fully Memory-driven insights
    // Industry, Options, MagicFit — use generateMerlinInsights entirely
    const fallbackBullets = insights.bullets.length > 0
      ? insights.bullets
      : [
          gate.canContinue
            ? "You're all set — hit Next to continue."
            : gate.reason ?? "Complete this step to continue.",
        ];

    // Step-specific supplemental bullets
    if (state.step === "industry") {
      const hasIndustry = state.industry && state.industry !== "auto";
      const industryLabel = hasIndustry ? getIndustryMeta(state.industry).label : null;
      if (state.industryLocked && hasIndustry) {
        fallbackBullets.unshift(`Because your business looks like ${industryLabel}, Merlin pre-selected it. Change it if needed.`);
      } else if (!hasIndustry) {
        fallbackBullets.unshift("Because load profiles differ by industry, this choice shapes your system sizing.");
      }
    }

    if (state.step === "magicfit" && insights.bullets.length === 0) {
      if (state.goals.length > 0) {
        const goalNames = state.goals.map(g => g.replace(/_/g, " ")).join(", ");
        fallbackBullets.unshift(`Because you prioritize ${goalNames}, Merlin sized three options to match.`);
      }
      fallbackBullets.push("Starter = fast payback. Perfect Fit = balanced. Beast Mode = maximum savings.");
    }

    if (state.step === "options" && insights.bullets.length === 0) {
      fallbackBullets.push("Adding solar cuts daytime energy costs. A generator provides outage protection.");
    }

    // Add nudge if available
    if (insights.nudge && fallbackBullets.length < 5) {
      fallbackBullets.push(insights.nudge);
    }

    return (
      <V7AdvisorPanel
        title="Merlin Advisor"
        subtitle={insights.subtitle}
        badges={insights.badges}
        bullets={fallbackBullets.slice(0, 5)}
      />
    );
  }, [state.step, step3Advisor, step4Advisor, gate.canContinue, gate.reason, merlinData, state.locationRawInput, state.location, state.businessCard, state.businessConfirmed, state.locationIntel, state.industry, state.industryLocked, state.goals]);

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

      {/* 📇 Persistent Business Card — visible on steps 2-6 */}
      {state.step !== "location" && <PersistentBusinessCard state={state} />}

      {/* Step Router */}
      {state.step === "location" && (
        <Step1LocationV7
          state={state}
          actions={{
            updateLocationRaw: wizard.updateLocationRaw,
            submitLocation: wizard.submitLocation,
            primeLocationIntel: wizard.primeLocationIntel,
            toggleGoal: wizard.toggleGoal,
            confirmGoals: wizard.confirmGoals,
            confirmBusiness: wizard.confirmBusiness,
            skipBusiness: wizard.skipBusiness,
            setBusinessDraft: wizard.setBusinessDraft,
            setLocationConfirmed: wizard.confirmLocation,
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

      {state.step === "options" && (
        <Step4OptionsV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            goToStep: wizard.goToStep,
            recalculateWithAddOns: wizard.recalculateWithAddOns,
          }}
        />
      )}

      {state.step === "magicfit" && (
        <Step5MagicFitV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            goToStep: wizard.goToStep,
            updateQuote: wizard.updateQuote,
          }}
        />
      )}

      {state.step === "results" && (
        <Step6ResultsV7
          state={state}
          actions={{
            goBack: wizard.goBack,
            resetSession: wizard.resetSession,
            goToStep: wizard.goToStep,
            // Phase 6: Pricing retry (non-blocking)
            retryPricing: wizard.retryPricing,
            // Phase 8: System add-ons (solar/generator/wind)
            recalculateWithAddOns: wizard.recalculateWithAddOns,
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