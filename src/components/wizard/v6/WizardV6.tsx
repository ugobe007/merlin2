import React, { useState, useCallback, useMemo, useEffect } from "react";
import { RotateCcw, X, ChevronLeft, ChevronRight, Zap, Sun, Shield } from "lucide-react";

import type { WizardState } from "./types";
import { INITIAL_WIZARD_STATE, POWER_LEVELS } from "./types";
import { bufferService } from "@/services/bufferService";
import { buildStep3Snapshot } from "./step3/buildStep3Snapshot";

// MerlinAdvisor Rail System (Phase 1 - Jan 16, 2026)
import { AdvisorPublisher } from "./advisor/AdvisorPublisher";
import { AdvisorRail } from "./advisor/AdvisorRail";
import { FloatingBatteryProgress } from "./advisor/FloatingBatteryProgress";
import { PowerGaugeWidget } from "./advisor/PowerGaugeWidget";

// TrueQuote™ Brand Assets (Jan 20, 2026)
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";
import { TelemetryChip } from "@/components/shared/TelemetryChip";

// Intelligence Layer (Phase 1: Adaptive UX - Jan 18, 2026)
import {
  suggestGoals,
  inferIndustry,
  getPrimaryWeatherImpact,
  calculateValueTeaser,
  type IntelligenceContext,
} from "@/services/intelligence";

// Site Score™ Calculator (Jan 18, 2026 - Merlin IP)
import {
  calculateSiteScore,
  estimateSiteScore,
  type SiteScoreResult,
} from "@/services/calculators/siteScoreCalculator";

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
// import { EnhancedLocationStep } from "../steps/EnhancedLocationStep.v2"; // DEPRECATED - See Step1Location
// import { Step1Location } from "./steps/Step1Location"; // DEPRECATED - See Step1AdvisorLed
// import { Step1LocationRedesign } from "./steps/Step1LocationRedesign"; // DEPRECATED - See Step1AdvisorLed
import { Step1AdvisorLed } from "./steps/Step1AdvisorLed"; // ✅ ADVISOR-LED: 2-panel design (Jan 19, 2026)
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
      <div className="relative bg-white/5 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
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
            className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
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

  // Intelligence Layer State (Jan 18, 2026 - Phase 1: Adaptive UX)
  const [intelligence, setIntelligence] = useState<IntelligenceContext>({});

  // Site Score™ State (Jan 18, 2026 - Merlin IP)
  const [siteScore, setSiteScore] = useState<SiteScoreResult | null>(null);

  // Step validity tracking (Jan 16, 2026 - Step 3→4→5 fix)
  const [step3Valid, setStep3Valid] = useState(false);
  const [step4Valid, setStep4Valid] = useState(false);

  // Blocked feedback state (Jan 19, 2026 - Shows message when Next is blocked)
  const [showBlockedFeedback, setShowBlockedFeedback] = useState(false);

  // REMOVED: Power details panel (Jan 20, 2026 - User requested removal)

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

  // ============================================================================
  // REAL-TIME POWER ESTIMATES (Jan 20, 2026)
  // Calculates estimated peak demand from Step 3 inputs for PowerGaugeWidget
  // Uses industry-specific heuristics - NOT SSOT (TrueQuote is SSOT in Step 5)
  // ============================================================================
  const estimatedPowerMetrics = useMemo(() => {
    const inputs = (state.useCaseData?.inputs || {}) as Record<string, unknown>;
    const industry = state.industry || state.detectedIndustry || '';
    
    // Default: Use TrueQuote values if available (post-Step 5)
    if (state.calculations?.base?.peakDemandKW && state.calculations.base.peakDemandKW > 0) {
      return {
        peakDemandKW: state.calculations.base.peakDemandKW,
        bessKW: state.calculations.selected?.bessKW || state.calculations.base.peakDemandKW * 0.4,
        source: 'truequote' as const,
      };
    }
    
    // Industry-specific quick estimates from Step 3 inputs
    let estimatedPeakKW = 0;
    
    // Hotels: rooms × 2-4 kW/room
    if (industry.includes('hotel')) {
      const rooms = Number(inputs.roomCount || inputs.numberOfRooms || inputs.facilitySize || 150);
      const hotelClass = String(inputs.hotelClass || inputs.facilityType || 'midscale');
      const kWPerRoom = hotelClass.includes('luxury') ? 4 : hotelClass.includes('upscale') ? 3 : 2;
      estimatedPeakKW = rooms * kWPerRoom * 0.75; // 75% diversity factor
    }
    // Hospitals: beds × 5-10 kW/bed
    else if (industry.includes('hospital')) {
      const beds = Number(inputs.bedCount || inputs.numberOfBeds || inputs.facilitySize || 200);
      estimatedPeakKW = beds * 7.5 * 0.85; // 85% diversity factor
    }
    // Data Centers: IT load × PUE
    else if (industry.includes('data') && industry.includes('center')) {
      const itLoadKW = Number(inputs.totalITLoad || inputs.powerCapacity || 5000);
      const pue = Number(inputs.pue || 1.5);
      estimatedPeakKW = itLoadKW * pue;
    }
    // Car Wash: bays × 30-80 kW/bay
    else if (industry.includes('car') && industry.includes('wash')) {
      const bays = Number(inputs.bayCount || inputs.numberOfBays || 4);
      const washType = String(inputs.washType || inputs.facilityType || 'automatic');
      const kWPerBay = washType.includes('tunnel') ? 80 : washType.includes('automatic') ? 50 : 30;
      estimatedPeakKW = bays * kWPerBay;
    }
    // EV Charging: chargers × power rating
    else if (industry.includes('ev') || industry.includes('charging')) {
      const l2 = Number(inputs.level2Chargers || inputs.l2Count || 12);
      const dcfc = Number(inputs.dcfcChargers || inputs.dcfcCount || 8);
      const hpc = Number(inputs.hpcChargers || inputs.hpcCount || 0);
      estimatedPeakKW = (l2 * 7.2 + dcfc * 150 + hpc * 350) * 0.6; // 60% concurrency
    }
    // Manufacturing: sqft × 15-40 W/sqft
    else if (industry.includes('manufacturing') || industry.includes('industrial')) {
      const sqft = Number(inputs.squareFootage || inputs.facilitySqFt || 100000);
      estimatedPeakKW = sqft * 0.025; // 25 W/sqft average
    }
    // Warehouse: sqft × 5-15 W/sqft
    else if (industry.includes('warehouse') || industry.includes('logistics')) {
      const sqft = Number(inputs.warehouseSqFt || inputs.squareFootage || 200000);
      const coldStorage = inputs.hasColdStorage || inputs.refrigeratedArea;
      estimatedPeakKW = sqft * (coldStorage ? 0.02 : 0.008); // 8-20 W/sqft
    }
    // Office: sqft × 8-15 W/sqft
    else if (industry.includes('office')) {
      const sqft = Number(inputs.squareFootage || inputs.facilitySqFt || 50000);
      estimatedPeakKW = sqft * 0.012; // 12 W/sqft average
    }
    // Retail/Shopping: sqft × 20-40 W/sqft
    else if (industry.includes('retail') || industry.includes('shopping')) {
      const sqft = Number(inputs.squareFootage || inputs.retailSqFt || 100000);
      estimatedPeakKW = sqft * 0.025; // 25 W/sqft
    }
    // College/University: students × 1-2 kW/student
    else if (industry.includes('college') || industry.includes('university')) {
      const students = Number(inputs.studentPopulation || inputs.enrollment || 10000);
      estimatedPeakKW = students * 1.5;
    }
    // Airport: passengers/year ÷ 1000
    else if (industry.includes('airport')) {
      const passengers = Number(inputs.annualPassengers || 5000000);
      estimatedPeakKW = passengers / 500; // ~2 W per annual passenger
    }
    // Casino: gaming sqft × 40-60 W/sqft
    else if (industry.includes('casino')) {
      const sqft = Number(inputs.gamingFloorSqft || inputs.squareFootage || 100000);
      estimatedPeakKW = sqft * 0.05; // 50 W/sqft
    }
    // Restaurant: sqft × 50-100 W/sqft
    else if (industry.includes('restaurant')) {
      const sqft = Number(inputs.squareFootage || inputs.diningAreaSqft || 5000);
      estimatedPeakKW = sqft * 0.075; // 75 W/sqft
    }
    // Apartment: units × 3-5 kW/unit
    else if (industry.includes('apartment') || industry.includes('residential')) {
      const units = Number(inputs.unitCount || inputs.numberOfUnits || 100);
      estimatedPeakKW = units * 4 * 0.6; // 60% diversity
    }
    // Default fallback: businessSizeTier-based estimate
    else {
      const tierDefaults: Record<string, number> = {
        small: 100,
        medium: 500,
        large: 2000,
        enterprise: 10000,
      };
      estimatedPeakKW = tierDefaults[state.businessSizeTier || 'medium'] || 500;
    }
    
    // Ensure minimum reasonable value
    estimatedPeakKW = Math.max(50, estimatedPeakKW);
    
    // BESS sizing: typically 30-50% of peak demand for peak shaving
    const bessKW = estimatedPeakKW * 0.4;
    
    return {
      peakDemandKW: Math.round(estimatedPeakKW),
      bessKW: Math.round(bessKW),
      source: 'estimate' as const,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.industry,
    state.detectedIndustry,
    state.businessSizeTier,
    // Stringify inputs to detect deep changes (object reference doesn't trigger re-render)
    JSON.stringify(state.useCaseData?.inputs),
    state.calculations?.base?.peakDemandKW,
    state.calculations?.selected?.bessKW,
  ]);

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

  // ============================================================================
  // INTELLIGENCE LAYER ORCHESTRATION (Jan 18, 2026 - Phase 1: Adaptive UX)
  // Trigger when ZIP + industry + weather data is available
  // ============================================================================

  useEffect(() => {
    const zipCode = state.zipCode;
    const stateCode = state.state;
    const businessName = state.businessName;
    const industrySlug = state.industry || state.detectedIndustry;
    const weatherRisk = state.weatherData?.extremes?.toLowerCase().replace(/\s+/g, "_"); // "Extreme Heat" → "extreme_heat"

    // Require minimum data to run intelligence
    if (!zipCode || !stateCode || !industrySlug || zipCode.length !== 5) {
      return;
    }

    console.log("[Intelligence] Orchestrating intelligence layer:", {
      zipCode,
      stateCode,
      industrySlug,
      weatherRisk,
    });

    // Run all intelligence services in parallel (non-blocking)
    Promise.all([
      // 1. Industry Inference (from business name)
      businessName
        ? inferIndustry({ businessName })
        : Promise.resolve({ success: true, data: null }),

      // 2. Goal Suggestion (from industry + climate + grid)
      weatherRisk
        ? suggestGoals({
            zipCode,
            industrySlug,
            climateRisk: weatherRisk,
            gridStress: undefined, // TODO: Add grid stress detection later
          })
        : Promise.resolve({ success: true, data: [] }),

      // 3. Weather Impact Translation (from weather risk + industry)
      weatherRisk ? getPrimaryWeatherImpact({ weatherRisk, industrySlug }) : Promise.resolve(null),

      // 4. Value Teaser (peer benchmarks)
      calculateValueTeaser({
        zipCode,
        state: stateCode,
        industrySlug,
        climateProfile: weatherRisk || "moderate",
      }),
    ])
      .then(([industryResult, goalsResult, weatherImpact, valueTeaserResult]) => {
        console.log("[Intelligence] Results:", {
          industry: industryResult.data,
          goals: goalsResult.data,
          weatherImpact,
          valueTeaser: valueTeaserResult.data,
        });

        // Update intelligence context for AdvisorRail
        setIntelligence({
          inferredIndustry: industryResult.data || undefined,
          suggestedGoals: Array.isArray(goalsResult.data) ? goalsResult.data : undefined,
          weatherImpact: weatherImpact ? [weatherImpact] : undefined,
          valueTeaser: valueTeaserResult.data || undefined,
        });
      })
      .catch((err) => {
        console.error("[Intelligence] Orchestration failed:", err);
      });
  }, [
    state.zipCode,
    state.state,
    state.businessName,
    state.industry,
    state.detectedIndustry,
    state.weatherData?.extremes,
  ]);

  // ============================================================================
  // SITE SCORE™ CALCULATION (Jan 18, 2026 - Merlin IP)
  // Calculate Site Score when we have location + industry + utility data
  // ============================================================================

  useEffect(() => {
    const zipCode = state.zipCode;
    const stateCode = state.state;
    const industrySlug = state.industry || state.detectedIndustry;
    const electricityRate = state.electricityRate ?? state.calculations?.base?.utilityRate;
    const demandCharge = state.calculations?.base?.demandCharge ?? 15;
    const hasTOU = state.calculations?.base?.hasTOU ?? false;

    // Early exit: need at least ZIP + state for quick estimate
    if (!zipCode || zipCode.length !== 5 || !stateCode) {
      return;
    }

    // If we don't have industry yet, use quick estimate
    if (!industrySlug) {
      const quickScore = estimateSiteScore(stateCode, "office"); // Default to office
      console.log("[SiteScore™] Quick estimate (no industry):", quickScore);
      setSiteScore({
        totalScore: quickScore.estimatedScore,
        scoreLabel: quickScore.estimatedLabel,
        merlinSays: quickScore.quickInsight,
        keyDrivers: [],
        suggestedGoals: [],
        economicOpportunity: {
          score: 0,
          breakdown: {
            rateLevel: 0,
            rateTrajectory: 0,
            demandChargeSeverity: 0,
            touSpread: 0,
            incentivesAvailable: 0,
          },
          insights: [],
        },
        siteFit: {
          score: 0,
          breakdown: { powerDensityMatch: 0, solarPotential: 0, loadProfileFit: 0 },
          insights: [],
        },
        riskResilience: {
          score: 0,
          breakdown: { gridReliability: 0, climateExposure: 0, businessCriticality: 0 },
          insights: [],
        },
        feasibility: {
          score: 0,
          breakdown: { permittingComplexity: 0, interconnectionQueue: 0, constructionAccess: 0 },
          insights: [],
        },
        calculatedAt: new Date().toISOString(),
        dataConfidence: "low",
        dataSources: [],
      });
      return;
    }

    // Full calculation with industry
    try {
      const result = calculateSiteScore({
        zipCode,
        state: stateCode,
        industry: industrySlug as Parameters<typeof calculateSiteScore>[0]["industry"],
        electricityRate: electricityRate ?? 0.12,
        demandCharge: demandCharge,
        hasTOU: hasTOU,
        // peakRate and offPeakRate not available in CalculationsBase - skip
        utilityName: state.calculations?.base?.utilityName,
        estimatedPeakKW: state.calculations?.base?.peakDemandKW,
      });

      console.log("[SiteScore™] Full calculation:", {
        totalScore: result.totalScore,
        label: result.scoreLabel,
        merlinSays: result.merlinSays,
      });

      setSiteScore(result);
    } catch (err) {
      console.error("[SiteScore™] Calculation failed:", err);
    }
  }, [
    state.zipCode,
    state.state,
    state.industry,
    state.detectedIndustry,
    state.electricityRate,
    state.calculations?.base?.utilityRate,
    state.calculations?.base?.demandCharge,
    state.calculations?.base?.hasTOU,
    state.calculations?.base?.utilityName,
    state.calculations?.base?.peakDemandKW,
  ]);

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
      // Step 3 validation gate - don't advance if not valid
      if (prev === 3 && !step3Valid) {
        console.log("⚠️ Step 3 not valid yet - cannot advance");
        // Show feedback to user
        setShowBlockedFeedback(true);
        setTimeout(() => setShowBlockedFeedback(false), 3000);
        return prev; // Stay on Step 3
      }
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
      // Always go to the previous step (no more skipping)
      // User can click step indicators to jump to any completed step
      console.log(`🔙 Going back from Step ${prev} to Step ${back}`);
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
          <Step1AdvisorLed
            state={state}
            updateState={updateState}
            onGoToStep2={() => goToStep(2)}
            onNext={() => {
              // Auto-skip to Step 3 if business detected
              if (state.detectedIndustry) {
                goToStep(3);
              } else {
                goNext();
              }
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
      <div className="fixed inset-0 bg-gradient-to-br from-[#050B16] via-[#071226] to-[#050B16]">
        {/* INTEGRATED GLASS SHELL: AdvisorRail + Step content - FULL WIDTH */}
        <div className={`w-full px-6 ${currentStep === 1 ? "py-3" : "py-6"}`}>
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            {/* Glow blobs */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -top-20 -right-28 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

            {/* Glass sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/12 via-white/5 to-transparent" />

            {/* Inner glass lip */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.35)]" />

            {/* TOP: Intelligence Header - Capital-Grade Instrument Panel (Jan 20, 2026) */}
            {state.zipCode && state.electricityRate && (
              <div className="relative border-b border-white/10 bg-gradient-to-r from-slate-800/40 via-slate-900/50 to-slate-800/40 backdrop-blur-sm">
                <div className="h-[100px] px-6 flex items-center gap-5">
                  {/* LEFT: Merlin Identity + TrueQuote Anchor + Model Active */}
                  <div className="flex items-center gap-3 min-w-[280px]">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-lg">🧙</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-white font-semibold text-sm leading-none">
                        Merlin Intelligence
                      </div>
                      <div className="flex items-center gap-2">
                        <TrueQuoteBadgeCanonical showTooltip={false} />
                        {/* Model Active Indicator - Green glow = system is ON */}
                        <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md bg-transparent text-emerald-300 border-2 border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.6),0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,1)] animate-pulse" />
                          <span className="font-bold tracking-wide">Model Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CENTER: Simplified Telemetry - Only essential metrics visible */}
                  <div className="flex-1 flex items-center gap-5 justify-start">
                    {/* CLUSTER 1: ECONOMICS (Rate only) */}
                    <div className="flex items-center gap-2">
                      <TelemetryChip
                        icon={Zap}
                        value={`$${state.electricityRate?.toFixed(3) || "0.000"}`}
                        unit="/kWh"
                        iconColor="cyan"
                        hierarchy="primary"
                      />
                    </div>

                    {/* CLUSTER 2: ENVIRONMENT/YIELD (Sun + Grid) */}
                    <div className="flex items-center gap-2">
                      {state.solarData?.sunHours && (
                        <TelemetryChip
                          icon={Sun}
                          value={state.solarData.sunHours.toFixed(1)}
                          unit="hrs/day"
                          iconColor="amber"
                          hierarchy="secondary"
                        />
                      )}
                      <TelemetryChip
                        icon={Shield}
                        label="Grid:"
                        value={state.weatherData?.extremes ? "Moderate" : "Reliable"}
                        iconColor="emerald"
                        hierarchy="secondary"
                      />
                    </div>

                    {/* CLUSTER 3: POWER GAUGE - Inline mini speedometer */}
                    <div className="flex items-center">
                      <PowerGaugeWidget
                        batteryKW={estimatedPowerMetrics.bessKW}
                        peakLoadKW={estimatedPowerMetrics.peakDemandKW}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* RIGHT: Location + Site Score */}
                  <div className="text-right min-w-[120px] max-w-[180px] flex-shrink-0">
                    <div className="text-white text-sm font-medium leading-tight truncate">
                      {state.zipCode} • {state.state}
                    </div>
                    {siteScore && (
                      <div className="text-xs mt-0.5">
                        <span className="text-slate-400">Score: </span>
                        <span
                          className={`font-bold ${
                            siteScore.scoreLabel === "exceptional" ||
                            siteScore.scoreLabel === "strong"
                              ? "text-emerald-400"
                              : siteScore.scoreLabel === "good"
                                ? "text-amber-400"
                                : "text-orange-400"
                          }`}
                        >
                          {siteScore.totalScore}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* POWER DETAILS PANEL REMOVED - User requested removal (Jan 20, 2026) */}
              </div>
            )}

            {/* ======================================================================
                2-COLUMN LAYOUT: AdvisorRail (LEFT) + Wizard Content (RIGHT)
                ====================================================================== */}
            <div className="relative flex h-[calc(100vh-108px)] flex-col lg:flex-row">
              {/* FLOATING BATTERY PROGRESS - Top right, always visible */}
              <FloatingBatteryProgress
                currentStep={currentStep}
                onNavigate={(step) => setCurrentStep(step)}
              />

              {/* LEFT: Cockpit - Wider and more integrated */}
              <div className="lg:w-[450px] lg:flex-shrink-0 border-white/10 lg:border-r">
                <div className="h-full p-6 overflow-y-auto">
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
                        businessName: state.businessName,
                      },
                      utility: {
                        rate: state.electricityRate ?? state.calculations?.base?.utilityRate,
                        demandCharge: state.calculations?.base?.demandCharge ?? 15,
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
                      config: {
                        solarKW: state.customSolarKw ?? state.calculations?.selected?.solarKW ?? 0,
                        batteryKWh: state.calculations?.selected?.bessKWh ?? 0,
                        batteryHours:
                          state.calculations?.selected?.bessKWh &&
                          state.calculations?.selected?.bessKW
                            ? state.calculations.selected.bessKWh /
                              state.calculations.selected.bessKW
                            : 0,
                        inverterKW: state.calculations?.selected?.bessKW ?? 0,
                        // Use estimatedPowerMetrics for real-time updates during Step 3
                        peakLoadKW: estimatedPowerMetrics.peakDemandKW,
                        backupRequired: state.goals?.includes("backup_power") ?? false,
                      },
                      // Phase 1: Intelligence Layer (Jan 18, 2026)
                      intelligence,
                      // Site Score™ (Jan 18, 2026 - Merlin IP)
                      siteScore,
                    }}
                  />
                </div>
              </div>

              {/* RIGHT: Workspace */}
              <div className="flex-1 min-w-0">
                <div className="h-full overflow-y-auto p-6 pb-28">{renderStep()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING NAVIGATION BAR - Always visible (Jan 18, 2026) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="w-full px-6 pb-4">
            {/* Blocked feedback message (Jan 19, 2026) */}
            {showBlockedFeedback && currentStep === 3 && (
              <div className="mb-3 flex justify-center pointer-events-auto">
                <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm animate-pulse">
                  ⚠️ Please complete required questions before continuing
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pointer-events-auto">
              {/* Back button */}
              <button
                onClick={goBack}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                  currentStep === 1
                    ? "bg-slate-800/80 text-slate-500 cursor-not-allowed"
                    : "bg-slate-800/90 text-white hover:bg-slate-700 border border-white/10 backdrop-blur-sm"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              {/* Spacer - navigation is now just Back + Next */}
              <div className="flex-1">
                {/* Outcome hint - only show on Step 1 */}
                {currentStep === 1 && (
                  <div className="text-xs text-slate-500 text-center">
                    Next: industry + load profile → savings estimate
                  </div>
                )}
              </div>

              {/* Next button */}
              <button
                onClick={goNext}
                disabled={currentStep === 6}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  currentStep === 6
                    ? "bg-slate-800/80 text-slate-500 cursor-not-allowed"
                    : showBlockedFeedback && currentStep === 3
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white animate-pulse"
                      : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                }`}
              >
                {currentStep === 5 ? "View Quote" : "Next Step"}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
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
