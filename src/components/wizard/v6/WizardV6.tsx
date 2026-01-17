import React, { useState, useCallback, useMemo, useEffect } from "react";
import { RotateCcw, X } from "lucide-react";

import type { WizardState, EnergyGoal } from "./types";
import { INITIAL_WIZARD_STATE, POWER_LEVELS } from "./types";
import { bufferService } from "@/services/bufferService";
import { buildStep3Snapshot } from "./step3/buildStep3Snapshot";

// MerlinAdvisor Rail System (Phase 1 - Jan 16, 2026)
import { AdvisorPublisher } from "./advisor/AdvisorPublisher";
import { AdvisorRail } from "./advisor/AdvisorRail";

// ============================================================================
// DEEP MERGE HELPER - Prevents nested state corruption
// ============================================================================

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = Array.isArray(base) ? [...(base as unknown[])] : { ...(base as object) };

  for (const [k, v] of Object.entries(patch as object)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prev = (base as any)[k];

    // arrays: replace (don't merge)
    if (Array.isArray(v)) {
      out[k] = v;
      continue;
    }

    // objects: recurse
    if (isPlainObject(v) && isPlainObject(prev)) {
      out[k] = deepMerge(prev, v);
      continue;
    }

    // primitives / null / undefined: assign
    out[k] = v;
  }

  return out as T;
}
import RequestQuoteModal from "@/components/modals/RequestQuoteModal";

import { Step3Details } from "./steps/Step3Details";
// Removed: Step3HotelEnergy - all industries now use Step3Details (scrolling questionnaire)
import { Step4Options } from "./steps/Step4Options";
import { Step5MagicFit } from "./steps/Step5MagicFit";
import { Step6Quote } from "./steps/Step6Quote";

// Enhanced components (Jan 15, 2026)
import { EnhancedLocationStep } from "../steps/EnhancedLocationStep.v2";
import { EnhancedStep2Industry } from "./steps/EnhancedStep2Industry";

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

    // ✅ FIXED: Calculate step from state safely (Jan 16, 2026)
    const saved = bufferService.load();
    if (saved) {
      // Basic progression rules (safer than "has some keys")
      const hasStep1 = saved.zipCode?.length === 5 && saved.state;
      const hasStep2 = !!saved.industry;
      const hasStep3 = saved.useCaseData && Object.keys(saved.useCaseData).length > 0;
      const hasStep4 = Array.isArray(saved.selectedOptions) && saved.selectedOptions.length > 0;
      const hasStep5 = !!saved.calculations;
      const hasStep6 = !!saved.calculations && !!saved.selectedPowerLevel;

      let step = 1;
      if (hasStep1) step = 2;
      if (hasStep2) step = 3;
      if (hasStep3) step = 4;
      if (hasStep4) step = 5;
      if (hasStep5) step = 6;
      if (!hasStep6) step = Math.min(step, 5);

      const calculatedStep = Math.max(1, Math.min(step, 6));
      console.log("📊 Restored wizard state - starting at Step", calculatedStep);
      return calculatedStep;
    }

    console.log("✅ No saved state - starting at Step 1");
    return 1; // Always default to Step 1
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);

  // Step validity tracking (Jan 16, 2026 - Step 3→4→5 fix)
  const [step3Valid, setStep3Valid] = useState(false);
  const [step4Valid, setStep4Valid] = useState(false);

  // ✅ RESTORE FIX: Validate snapshot before allowing Step 4+ restore (Jan 16, 2026)
  useEffect(() => {
    if (currentStep >= 4) {
      const snap = buildStep3Snapshot(state);
      const step3IsValid = snap.missing.length === 0 || snap.confidencePct >= 70;

      if (!step3IsValid) {
        console.warn("⚠️ Restore teleport blocked: Step 3 invalid, forcing back");
        setCurrentStep(3);
      }
    }
  }, [currentStep, state]); // ✅ FIXED: Re-run on step change

  // ✅ FIX #2: Auto-validate Step 4 once loaded (Jan 16, 2026)
  // IMPORTANT: Step 4 is OPT-IN for add-ons (solar/EV/generator).
  // It's always considered valid because no selections are required.
  // User selections flow to Step 5 via safeState and are included in quotes.
  // DO NOT add validation here unless product requirements change.
  useEffect(() => {
    if (currentStep === 4) {
      setStep4Valid(true); // Step 4 is always valid once loaded
    }
  }, [currentStep]);

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

  // FIXED: Use deep merge to prevent nested state corruption (Jan 16, 2026)
  const updateState = useCallback(
    (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => {
      setState((prev) => {
        const patch = typeof updates === "function" ? updates(prev) : updates;
        return deepMerge(prev, patch);
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
  const goToStep = useCallback((step: number) => setCurrentStep(step), []);

  // Build Step 3 snapshot (Jan 16, 2026 - Step 3→4→5 fix)
  // Steps 4 & 5 read from this snapshot, NOT raw state
  const step3Snapshot = useMemo(() => buildStep3Snapshot(state), [state]);

  // ✅ DEBUG PANEL: Toggle with ?debug=1 (Jan 16, 2026)
  const _showDebug = new URLSearchParams(window.location.search).get("debug") === "1";

  // Calculate values for MerlinBar (unified command center)
  const _merlinBarProps = useMemo(() => {
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
      selectedTier: state.selectedPowerLevel as "efficient" | "balanced" | "maximum" | undefined,
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

  const _canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return state.zipCode.length === 5 && state.state !== "" && state.goals.length >= 2;
      case 2:
        // Industry must be selected AND business size tier must be set
        return state.industry !== "" && state.businessSizeTier !== undefined;
      case 3:
        // ✅ FIXED: Real Step 3 gating (Jan 16, 2026)
        return step3Valid;
      case 4:
        // ✅ FIXED: Real Step 4 gating (Jan 16, 2026)
        return step4Valid;
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
        return (
          <EnhancedLocationStep
            onNext={(data) => {
              updateState({
                businessName: data.businessName,
                businessAddress: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                electricityRate: data.utilityRate,
                solarData: {
                  sunHours: data.sunHours,
                  rating: data.sunHours > 5.5 ? "Excellent" : data.sunHours > 4.5 ? "Good" : "Fair",
                },
                goals: data.goals as EnergyGoal[],
                detectedIndustry: data.detectedInfo?.industrySlug,
                industry: data.detectedInfo?.industrySlug || "",
                industryName: data.detectedInfo?.industrySlug || "",
              });
              // Auto-skip to Step 3 if business detected
              if (data.detectedInfo?.industrySlug) {
                goToStep(3);
              } else {
                goNext();
              }
            }}
            onUtilityDataUpdate={(utilityData) => {
              // Update MerlinBar immediately when zip entered
              updateState({
                state: utilityData.state,
                electricityRate: utilityData.rate,
                solarData: {
                  sunHours: utilityData.sunHours,
                  rating:
                    utilityData.sunHours > 5.5
                      ? "Excellent"
                      : utilityData.sunHours > 4.5
                        ? "Good"
                        : "Fair",
                },
              });
            }}
          />
        );
      case 2:
        return (
          <EnhancedStep2Industry
            state={state}
            updateState={updateState}
            onNext={() => goToStep(3)}
          />
        );
      case 3:
        return (
          <Step3Details
            state={state}
            updateState={updateState}
            onBack={goBack}
            onNext={() => {
              // Hard gate here too (belt + suspenders)
              if (!step3Valid) return;
              goToStep(4);
            }}
            onValidityChange={setStep3Valid}
          />
        );
      case 4:
        return (
          <Step4Options state={state} updateState={updateState} step3Snapshot={step3Snapshot} />
        );
      case 5:
        return (
          <Step5MagicFit
            state={state}
            updateState={updateState}
            goToStep={goToStep}
            step3Snapshot={step3Snapshot}
          />
        );
      case 6:
        return <Step6Quote state={state} />;
      default:
        return null;
    }
  };

  return (
    <AdvisorPublisher
      currentStep={currentStep}
      options={{ clearOnStepChange: true, enableWarnings: true }}
    >
      <div className="fixed inset-0 overflow-y-auto bg-[#0b1626]">
        {/* TWO-COLUMN GRID LAYOUT (Vineet's spec) */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* LEFT RAIL: MerlinAdvisor with step progress (col-span-4 on lg+) */}
            <div className="col-span-12 lg:col-span-4">
              <AdvisorRail
                currentStep={currentStep}
                totalSteps={6}
                onNavigate={goToStep}
                context={{
                  location: {
                    zip: state.zipCode,
                    city: state.city,
                    state: state.state,
                    utilityName: state.calculations?.base?.utilityName,
                  },
                  utility: {
                    rate: state.electricityRate ?? state.calculations?.base?.utilityRate,
                    demandCharge: state.calculations?.base?.demandCharge,
                    hasTOU: state.calculations?.base?.hasTOU,
                  },
                  solar: {
                    sunHours: state.solarData?.sunHours,
                    rating: state.solarData?.rating,
                  },
                  weather: {
                    profile: state.weatherData?.profile,
                    extremes: state.weatherData?.extremes,
                  },
                  opportunities: {
                    arbitrage: state.calculations?.base?.hasTOU ? "High" : "Medium",
                    backup: state.goals?.includes("backup_power"),
                    smoothing: state.goals?.includes("peak_shaving"),
                  },
                }}
              />
            </div>

            {/* MAIN STAGE: Step content (col-span-8 on lg+) */}
            <div className="col-span-12 lg:col-span-8">{renderStep()}</div>
          </div>
        </div>

        {/* Start Over Confirmation Modal */}
        <StartOverModal
          isOpen={showStartOverModal}
          onClose={() => setShowStartOverModal(false)}
          onConfirm={handleStartOver}
        />

        {/* Request Quote Modal */}
        {currentStep === 6 && state.calculations && state.selectedPowerLevel && (
          <RequestQuoteModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            quoteData={{
              storageSizeMW: state.calculations.selected.bessKW / 1000,
              durationHours:
                POWER_LEVELS.find((l) => l.id === state.selectedPowerLevel)?.durationHours || 4,
              energyCapacity: state.calculations.selected.bessKWh / 1000,
              solarMW:
                state.calculations.selected.solarKW > 0
                  ? state.calculations.selected.solarKW / 1000
                  : 0,
              totalCost: state.calculations.selected.totalInvestment,
              industryName: state.industryName,
              location: `${state.city || ""} ${state.state || ""}`.trim() || state.zipCode,
            }}
          />
        )}
      </div>
    </AdvisorPublisher>
  );
}
