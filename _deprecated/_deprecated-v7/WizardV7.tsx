/**
 * WIZARDV7 - Next Generation Quote Wizard (Vineet's Vision)
 *
 * Canonical updates:
 * - Global TrueQuote modal manager (single modal, mode-based)
 * - Window event bus: any badge can open TrueQuote without prop threading
 * - Location Intelligence odometer in Step 1
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWizardV7 } from "./hooks/useWizardV7";

// Steps (Vineet's 7-step flow)
import Step1LocationV7 from "./steps/Step1LocationV7";
import Step2Goals from "./steps/Step2Goals";
import Step3DetailsV7 from "./steps/Step3DetailsV7";

// Shared
import BottomNavigation from "./shared/BottomNavigation";

// Existing modal - now exports types
import TrueQuoteModal, {
  type TrueQuoteModalMode,
  type TrueQuoteProofPayload,
} from "@/components/shared/TrueQuoteModal";

// ---- Typed window events (no prop threading) -----------------
type TrueQuoteOpenDetail = {
  mode?: TrueQuoteModalMode;
  payload?: Partial<TrueQuoteProofPayload>;
};

declare global {
  interface WindowEventMap {
    "truequote:open": CustomEvent<TrueQuoteOpenDetail>;
    "truequote:close": Event;
  }
}

// ---- Shallow merge helper for payload overriding --------------
function mergeProofPayload(
  base: TrueQuoteProofPayload,
  override?: Partial<TrueQuoteProofPayload>
): TrueQuoteProofPayload {
  // Doctrine: never accept anything but a real object payload
  const safeBase: TrueQuoteProofPayload = base ?? {};

  if (!override) return safeBase;

  return {
    ...safeBase,
    ...override,
    location: { ...(safeBase.location || {}), ...(override.location || {}) },
    business: { ...(safeBase.business || {}), ...(override.business || {}) },
    locationIntel: { ...(safeBase.locationIntel || {}), ...(override.locationIntel || {}) },
    outputs: override.outputs ?? safeBase.outputs,
    assumptions: override.assumptions ?? safeBase.assumptions,
    sources: override.sources ?? safeBase.sources,
  };
}

export default function WizardV7() {
  const {
    // Step control
    currentStep,
    goBack,
    goNext,
    canProceed,

    // Core state
    location,
    setLocation,
    industry,
    setIndustry,
    selectedGoals,
    toggleGoal,
    answers,
    setAnswers,

    // Calculations
    assessment,
    locationIntel,

    // ✅ Pricing freeze (session deterministic)
    pricingConfig,
    pricingStatus,

    // TrueQuote (hook helpers)
    getTrueQuoteProofPayload,
  } = useWizardV7();

  /**
   * Global TrueQuote modal (single modal; mode switches content)
   * Triggered by window events so we don't have to thread props through every step.
   *
   * Dispatch from anywhere:
   *   window.dispatchEvent(new CustomEvent('truequote:open', { detail: { mode:'about' } }))
   *   window.dispatchEvent(new CustomEvent('truequote:open', { detail: { mode:'proof', payload:{...partial} } }))
   */
  const [trueQuoteOpen, setTrueQuoteOpen] = useState(false);
  const [trueQuoteMode, setTrueQuoteMode] = useState<TrueQuoteModalMode>("about");
  const [trueQuotePayload, setTrueQuotePayload] = useState<TrueQuoteProofPayload | undefined>(
    undefined
  );

  // Canonical proof payload recomputes when frozen pricing changes
  const canonicalProofPayload = useMemo(() => {
    return getTrueQuoteProofPayload();
  }, [getTrueQuoteProofPayload, pricingStatus, pricingConfig]);

  // Prevent stale-closure issues in the event handler
  const canonicalProofRef = useRef<TrueQuoteProofPayload | undefined>(canonicalProofPayload);
  useEffect(() => {
    canonicalProofRef.current = canonicalProofPayload;
  }, [canonicalProofPayload]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as WindowEventMap["truequote:open"]).detail || {};
      const mode: TrueQuoteModalMode = detail.mode === "proof" ? "proof" : "about";

      if (mode === "about") {
        setTrueQuoteMode("about");
        setTrueQuotePayload(undefined);
        setTrueQuoteOpen(true);
        return;
      }

      // proof mode - merge caller's partial payload with canonical base
      // Always use getTrueQuoteProofPayload() as fallback (never empty {})
      const base = canonicalProofRef.current ?? getTrueQuoteProofPayload();
      const merged = mergeProofPayload(base, detail.payload);

      setTrueQuoteMode("proof");
      setTrueQuotePayload(merged);
      setTrueQuoteOpen(true);
    };

    const onClose = () => setTrueQuoteOpen(false);

    window.addEventListener("truequote:open", onOpen);
    window.addEventListener("truequote:close", onClose);

    return () => {
      window.removeEventListener("truequote:open", onOpen);
      window.removeEventListener("truequote:close", onClose);
    };
  }, [getTrueQuoteProofPayload]); // stable ref - no listener churn

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #070a11 0%, #0c1019 100%)',
        color: '#fff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Dark Gradient Background with Centered Card */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-slate-900 to-blue-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,40,200,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(40,80,200,0.08),transparent_50%)]" />

        {/* Centered Glowing Card */}
        <div className="relative w-full max-w-7xl h-[85vh] bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/20 overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-2xl opacity-50" />

          {/* Card content */}
          <div className="relative h-full flex flex-col">
            {/* Step content area - NO overflow here, let steps manage their own scroll */}
            <div className="flex-1 min-h-0 flex flex-col">
              {/* Step 1: Location */}
              {currentStep === 1 && (
                <div className="flex-1 min-h-0 overflow-y-auto p-8">
                  <Step1LocationV7
                    location={location}
                    setLocation={setLocation}
                    industry={industry}
                    setIndustry={setIndustry}
                    locationIntel={locationIntel}
                  />
                </div>
              )}

              {/* Step 2: Goals & Industry - needs flex-1 for grid layout */}
              {currentStep === 2 && (
                <div className="flex-1 min-h-0">
                  <Step2Goals
                    location={location}
                    selectedGoals={selectedGoals}
                    toggleGoal={toggleGoal}
                    assessment={assessment}
                    industry={industry}
                    setIndustry={setIndustry}
                  />
                </div>
              )}

              {/* Step 3: Details - needs flex-1 for proper height */}
              {currentStep === 3 && (
                <div className="flex-1 min-h-0">
                  <Step3DetailsV7
                    industry={industry}
                    location={location}
                    locationIntel={locationIntel}
                    answers={answers}
                    setAnswers={setAnswers}
                    onComplete={goNext}
                    onBack={goBack}
                    // ✅ Pricing freeze props
                    pricingConfig={pricingConfig}
                    pricingStatus={pricingStatus}
                  />
                </div>
              )}

              {/* Steps > 3: Coming soon */}
              {currentStep > 3 && (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚧</div>
                    <div className="text-2xl font-bold mb-2">Step {currentStep} Coming Soon</div>
                    <p className="text-slate-400">Details → Options → System → Quote</p>
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Footer row (no wrapper — BottomNavigation owns its border/bg) */}
            <BottomNavigation
              currentStep={currentStep}
              goBack={goBack}
              goNext={goNext}
              canProceed={canProceed}
            />
          </div>
        </div>
      </div>

      {/* ✅ Global TrueQuote Modal (single instance) - fully typed, no wrapper needed */}
      <TrueQuoteModal
        isOpen={trueQuoteOpen}
        onClose={() => setTrueQuoteOpen(false)}
        mode={trueQuoteMode}
        payload={trueQuotePayload}
      />
    </div>
  );
}

// ---- DEV-ONLY: Event bus smoke test ----
if (import.meta.env.DEV) {
  (window as any).__tq = {
    openAbout: () =>
      window.dispatchEvent(new CustomEvent("truequote:open", { detail: { mode: "about" } })),
    openProof: (payload?: any) =>
      window.dispatchEvent(
        new CustomEvent("truequote:open", { detail: { mode: "proof", payload } })
      ),
    close: () => window.dispatchEvent(new Event("truequote:close")),
  };
}
