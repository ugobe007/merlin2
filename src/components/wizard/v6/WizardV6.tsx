import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ArrowLeft, ArrowRight, Home, Sparkles, RotateCcw, X } from "lucide-react";

import type { WizardState } from "./types";
import { INITIAL_WIZARD_STATE, WIZARD_STEPS, POWER_LEVELS } from "./types";
import { bufferService } from "@/services/bufferService";
import RequestQuoteModal from "@/components/modals/RequestQuoteModal";

import { Step1Location } from "./steps/Step1Location";
import { Step2Industry } from "./steps/Step2Industry";
import { Step3Details } from "./steps/Step3Details";
// Removed: Step3HotelEnergy - all industries now use Step3Details (scrolling questionnaire)
import { Step4Options } from "./steps/Step4Options";
import { Step5MagicFit } from "./steps/Step5MagicFit";
import { Step6Quote } from "./steps/Step6Quote";
import { MerlinBar } from "./MerlinBar";

// ============================================================================
// START OVER CONFIRMATION MODAL
// ============================================================================

interface StartOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function StartOverModal({ isOpen, onClose, onConfirm }: StartOverModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-white text-center mb-2">Start Over?</h2>
        <p className="text-slate-400 text-center mb-6">
          Your progress will be reset and you'll return to Industry Selection.
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            Yes, Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD COMPONENT
// ============================================================================

export default function WizardV6() {
  // ✅ FIXED: Check URL parameter to force fresh start
  // If ?fresh=true or wizard is accessed directly, clear all persisted state
  const shouldStartFresh = (() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("fresh") === "true" || urlParams.get("new") === "true";
  })();

  // ✅ FIXED: Clear persisted state on mount if this is a fresh start
  // This ensures "Get my free quote" always starts at Step 1
  React.useEffect(() => {
    if (shouldStartFresh && typeof window !== "undefined") {
      bufferService.clear();
      console.log("✅ Cleared persisted wizard state for fresh start");
    }
  }, [shouldStartFresh]);

  // Load state from bufferService on mount
  const [state, setState] = useState<WizardState>(() => {
    // If starting fresh, always use initial state
    if (shouldStartFresh) {
      return INITIAL_WIZARD_STATE;
    }

    // Try to load from buffer service
    const saved = bufferService.load();
    if (saved) {
      return { ...INITIAL_WIZARD_STATE, ...saved };
    }

    return INITIAL_WIZARD_STATE;
  });

  // Calculate initial step from state
  const [currentStep, setCurrentStep] = useState(() => {
    // ✅ FIXED: Always start at Step 1 for fresh starts
    if (shouldStartFresh) {
      console.log("✅ Starting fresh at Step 1 (shouldStartFresh=true)");
      return 1;
    }

    // Calculate step from state
    const saved = bufferService.load();
    if (saved) {
      // Calculate step based on state progression
      let step = 1;
      if (saved.industry) step = 2;
      if (saved.useCaseData && Object.keys(saved.useCaseData).length > 0) step = 3;
      if (saved.selectedOptions && saved.selectedOptions.length > 0) step = 4;
      if (saved.calculations) step = 5;
      if (saved.calculations && saved.selectedPowerLevel) step = 6;
      const calculatedStep = Math.max(1, Math.min(step, 6));
      console.log("📊 Restored wizard state - starting at Step", calculatedStep);
      return calculatedStep;
    }

    console.log("✅ No saved state - starting at Step 1");
    return 1; // Always default to Step 1
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);

  // Auto-save state to bufferService whenever it changes (debounced)
  useEffect(() => {
    bufferService.autoSave(state, 1000); // 1 second debounce
  }, [state]);

  // Save state immediately on step change (no debounce)
  useEffect(() => {
    bufferService.save(state);
  }, [currentStep, state]);

  // Save on page unload (immediate, no debounce)
  useEffect(() => {
    const handleBeforeUnload = () => {
      bufferService.save(state);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state]);

  // FIXED: Use functional updates to prevent race conditions with nested objects
  const updateState = useCallback(
    (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => {
      setState((prev) => {
        const updatesObj = typeof updates === "function" ? updates(prev) : updates;
        return { ...prev, ...updatesObj };
      });
    },
    []
  );

  const goNext = () =>
    setCurrentStep((prev) => {
      const next = prev + 1;
      // Skip Step 2 (Industry Selection) if industry was auto-detected from business lookup
      if (prev === 1 && state.detectedIndustry && state.industry) {
        console.log("🧙 Skipping Step 2 - Industry auto-detected:", state.industry);
        return 3; // Go directly to Step 3 (Details)
      }
      return Math.min(next, 6);
    });

  const goBack = () =>
    setCurrentStep((prev) => {
      const back = prev - 1;
      // When going back from Step 3, skip Step 2 if industry was auto-detected
      if (prev === 3 && state.detectedIndustry && state.industry) {
        console.log("🧙 Skipping Step 2 on back - Industry auto-detected");
        return 1; // Go back to Step 1
      }
      return Math.max(back, 1);
    });
  const goToStep = (step: number) => setCurrentStep(step);

  // Calculate values for MerlinBar (unified command center)
  const merlinBarProps = useMemo(() => {
    // Base data from Step 5 calculations.base (SSOT)
    const annualUsage = state.calculations?.base?.annualConsumptionKWh || 0;
    const peakDemand = state.calculations?.base?.peakDemandKW || 0;
    const utilityRate = state.calculations?.base?.utilityRate || 0.12;
    const demandRate = state.calculations?.base?.demandCharge || 15;

    const annualEnergySpend = annualUsage * utilityRate;
    const peakDemandCharges = peakDemand * demandRate * 12;

    // System sizes from state or calculations
    const solarKw = state.customSolarKw || state.calculations?.selected?.solarKW || 0;
    const bessKwh = state.calculations?.selected?.bessKWh || 0;
    const generatorKw = state.customGeneratorKw || state.calculations?.selected?.generatorKW || 0;
    const evL2Count = state.customEvL2 || state.calculations?.selected?.evChargers || 0;
    const evDcfcCount = state.customEvDcfc || 0;

    // Flags
    const hasSolar = state.selectedOptions?.includes("solar") || false;
    const hasGenerator = state.selectedOptions?.includes("generator") || false;
    const hasEv = state.selectedOptions?.includes("ev") || false;

    return {
      // Location data
      state: state.state,
      city: state.city,
      sunHours: state.solarData?.sunHours,
      electricityRate: state.electricityRate || utilityRate,
      solarRating: state.solarData?.rating,
      
      // Goals & Industry
      goals: state.goals,
      industry: state.industry,
      industryName: state.industryName,
      
      // Options & Equipment
      hasSolar,
      hasGenerator,
      hasEv,
      solarKw,
      bessKwh,
      generatorKw,
      generatorFuel: state.generatorFuel || "natural-gas",
      evL2Count,
      evDcfcCount,
      
      // Baseline data
      annualEnergySpend,
      peakDemandCharges,
      annualUsageKwh: annualUsage,
      
      // Selection state
      selectedTier: state.selectedPowerLevel as 'efficient' | 'balanced' | 'maximum' | undefined,
      annualSavings: state.calculations?.selected?.annualSavings,
      
      // Callbacks
      onJumpToStep: goToStep,
    };
  }, [state, goToStep]);

  // Start Over: Reset state and go to Step 1
  const handleStartOver = () => {
    bufferService.clear();
    setState(INITIAL_WIZARD_STATE);
    setCurrentStep(1); // Go back to Location (Step 1)
    setShowStartOverModal(false);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return state.zipCode.length === 5 && state.state !== "" && state.goals.length >= 2;
      case 2:
        return state.industry !== "";
      case 3:
        return true; // Database-driven questions handle their own validation
      case 4:
        return true; // Step4Options handles its own validation with forced decisions
      case 5:
        return state.selectedPowerLevel !== null && state.calculations !== null;
      case 6:
        return state.calculations !== null && state.selectedPowerLevel !== null;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Location state={state} updateState={updateState} />;
      case 2:
        return <Step2Industry state={state} updateState={updateState} />;
      case 3:
        return <Step3Details state={state} updateState={updateState} onNext={() => goToStep(4)} />;
      case 4:
        return <Step4Options state={state} updateState={updateState} />;
      case 5:
        return <Step5MagicFit state={state} updateState={updateState} goToStep={goToStep} />;
      case 6:
        return <Step6Quote state={state} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER - Fixed at top with z-index 100
          ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/20"
        style={{ zIndex: 100 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + Start Over */}
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Home className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">Merlin</span>
            </a>

            {/* Start Over Button */}
            <button
              onClick={() => setShowStartOverModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start Over</span>
            </button>
          </div>

          {/* Right: Step indicator */}
          <div className="text-purple-300 text-sm">Step {currentStep} of 6</div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Step Navigation */}
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between text-xs">
          {WIZARD_STEPS.map((step) => (
            <button
              key={step.number}
              onClick={() => step.number < currentStep && goToStep(step.number)}
              className={`transition-colors ${
                step.number === currentStep
                  ? "text-white font-semibold"
                  : step.number < currentStep
                    ? "text-purple-400 hover:text-purple-300 cursor-pointer"
                    : "text-slate-500"
              }`}
            >
              {step.name}
            </button>
          ))}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          MERLIN BAR - Unified command center, shows on all steps
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto">
        <MerlinBar currentStep={currentStep} {...merlinBarProps} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT - Scrollable area with padding for fixed footer
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 py-8" style={{ paddingBottom: "120px" }}>
        {renderStep()}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER - Fixed at bottom with HIGH z-index
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-md border-t border-purple-500/30"
        style={{ zIndex: 9999 }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={goBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-700 text-white hover:bg-slate-600"
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>

          {/* Step Indicator */}
          <div className="text-slate-400 text-sm">Step {currentStep} of 6</div>

          {/* Continue / Get Quote Button */}
          {currentStep < 6 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 shadow-lg shadow-purple-500/25"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Sparkles className="w-5 h-5" /> Get Official Quote
            </button>
          )}
        </div>
      </footer>

      {/* Start Over Confirmation Modal */}
      <StartOverModal
        isOpen={showStartOverModal}
        onClose={() => setShowStartOverModal(false)}
        onConfirm={handleStartOver}
      />

      {/* Request Quote Modal - only show when on step 6 */}
      {currentStep === 6 && state.calculations && state.selectedPowerLevel && (
        <RequestQuoteModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          quoteData={{
            storageSizeMW: state.calculations.selected.bessKW / 1000,
            durationHours:
              POWER_LEVELS.find((l) => l.id === state.selectedPowerLevel)?.durationHours || 4,
            energyCapacity: state.calculations.selected.bessKWh / 1000,
            solarMW: state.calculations.selected.solarKW > 0 ? state.calculations.selected.solarKW / 1000 : 0,
            totalCost: state.calculations.selected.totalInvestment,
            industryName: state.industryName,
            location: `${state.city || ""} ${state.state || ""}`.trim() || state.zipCode,
          }}
        />
      )}
    </div>
  );
}
