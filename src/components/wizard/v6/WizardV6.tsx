import React, { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { WizardState } from "./types";
import { INITIAL_WIZARD_STATE, POWER_LEVELS } from "./types";
import { bufferService } from "@/services/bufferService";
import { buildStep3Snapshot } from "./step3/buildStep3Snapshot";
import { validateStep3Contract } from "./step3/validateStep3Contract";
import { validateStep3Dynamic, validateStep3Sync } from "./step3/validateStep3Dynamic"; // V7 architecture

// Feature flag for database-driven validation (Jan 26, 2026)
const USE_DATABASE_VALIDATOR = import.meta.env.VITE_USE_DATABASE_VALIDATOR === 'true' || false;

// MerlinAdvisor Rail System (Phase 1 - Jan 16, 2026)
import { AdvisorPublisher } from "./advisor/AdvisorPublisher";
import { AdvisorRail } from "./advisor/AdvisorRail";

// Energy Metrics Header (Jan 25, 2026) - Persistent location intelligence
import { EnergyMetricsHeader } from "./EnergyMetricsHeader";

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

// TrueQuote™ Sizing Engine (Jan 21, 2026 - Phase 5)
import { computeTrueQuoteSizing, type TrueQuoteSizing } from "@/services/truequote";
import { calculateModelConfidence } from "./types";

// ============================================================================
// DEEP MERGE HELPER - Prevents nested state corruption
// ============================================================================

import { isPlainObject, deepMerge } from "./wizardV6Utils";

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

import StartOverModal from "./StartOverModal";
import { computeEstimatedPowerMetrics } from "./wizardV6PowerCalc";

// ============================================================================

export default function WizardV6() {
  // ⚠️ TRIPWIRE: V6 is RETIRED from modals (Feb 2, 2026)
  // This should ONLY mount via /wizard-v6 explicit route
  useEffect(() => {
    if (import.meta.env.DEV) {
      const isLegacyRoute = window.location.pathname === "/wizard-v6";
      if (!isLegacyRoute) {
        console.error(
          "🚨 [V6 TRIPWIRE] WizardV6 mounted outside /wizard-v6!\n" +
          "   Current path: " + window.location.pathname + "\n" +
          "   V6 is RETIRED. All CTAs should open V7.\n" +
          "   Check ModalManager.tsx or ModalRenderer.tsx for regressions."
        );
      } else {
        console.warn("[V6] WizardV6 mounted via /wizard-v6 (legacy route - OK)");
      }
    }
  }, []);

  // ✅ FIXED: Check URL parameter to force fresh start
  // If ?fresh=true or wizard is accessed directly, clear all persisted state
  const shouldStartFresh = (() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("fresh") === "true" || urlParams.get("new") === "true";
  })();

  // ✅ FIXED: Clear persisted state on mount if this is a fresh start
  // This ensures "Get my free quote" always starts at Step 1
  useEffect(() => {
    if (shouldStartFresh && typeof window !== "undefined") {
      bufferService.clear();
      if (import.meta.env.DEV) console.log("✅ Cleared persisted wizard state for fresh start");
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
      if (import.meta.env.DEV) console.log("✅ Starting fresh at Step 1 (shouldStartFresh=true)");
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
      if (import.meta.env.DEV) console.log("📊 Restored wizard state - starting at Step", calculatedStep);
      return calculatedStep;
    }

    if (import.meta.env.DEV) console.log("✅ No saved state - starting at Step 1");
    return 1; // Always default to Step 1
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStartOverModal, setShowStartOverModal] = useState(false);

  // Intelligence Layer State (Jan 18, 2026 - Phase 1: Adaptive UX)
  const [intelligence, setIntelligence] = useState<IntelligenceContext>({});

  // Site Score™ State (Jan 18, 2026 - Merlin IP)
  const [siteScore, setSiteScore] = useState<SiteScoreResult | null>(null);

  // Step validity tracking (Jan 16, 2026 - Step 3→4→5 fix)
  const [_step3Valid, setStep3Valid] = useState(false);
  // ✅ FIX (Jan 25, 2026): Only setter used, validation via step3Contract
  // ✅ REMOVED (Jan 24, 2026): step4Valid state - Step 4 is ALWAYS valid (opt-in add-ons)

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

  // ✅ REMOVED (Jan 24, 2026): Step 4 auto-validate useEffect
  // Step 4 is ALWAYS valid - it's opt-in for add-ons (solar/EV/generator).
  // No selections are required. User selections flow to Step 5 via safeState.

  // ============================================================================
  // REAL-TIME POWER ESTIMATES (Jan 20, 2026) - COMPREHENSIVE VERSION
  // Calculates estimated peak demand from Step 3 inputs for PowerGaugeWidget
  // Uses ALL DB custom_questions fields - audit: scripts/audit-questionnaire-data-flow.mjs
  // ============================================================================

  // Extract inputs hash for dependency tracking (avoids complex expression in deps)
  // ============================================================================
  // REAL-TIME POWER ESTIMATES — extracted to wizardV6PowerCalc.ts (Op5 Feb 2026)
  // See wizardV6PowerCalc.ts for the full per-industry calculation logic.
  // ============================================================================

  // Extract inputs hash for dependency tracking (avoids complex expression in deps)
  const inputsHash = JSON.stringify(state.useCaseData?.inputs);

  const estimatedPowerMetrics = useMemo(
    () => computeEstimatedPowerMetrics(state),
    [
      state.industry,
      state.detectedIndustry,
      state.businessSizeTier,
      // Use pre-computed hash to detect deep changes
      inputsHash,
      state.calculations?.base?.peakDemandKW,
      state.calculations?.selected?.bessKW,
      // Progressive Model fields (Jan 21, 2026) - enable micro-prompt refinements
      state.serviceSize,
      state.hvacType,
      state.hasDemandCharge,
      state.demandChargeBand,
    ]
  );

  // ============================================================================
  // TRUEQUOTE™ LIVE SIZING ENGINE (Jan 21, 2026 - Phase 5)
  // Computes recommended BESS sizing with confidence-aware bands
  // Updates in real-time as user answers micro-prompts
  // Now displayed in Step 6 (Results) - Jan 21, 2026
  // ============================================================================

  const trueQuoteSizing = useMemo<TrueQuoteSizing | null>(() => {
    const industry = state.industry || state.detectedIndustry;

    // Need at least peak demand to compute sizing
    if (!estimatedPowerMetrics.peakDemandKW || estimatedPowerMetrics.peakDemandKW < 10) {
      return null;
    }

    // Calculate model confidence from progressive model state
    const modelConfidence = calculateModelConfidence(
      state.serviceSize,
      state.hasDemandCharge,
      state.demandChargeBand,
      state.hvacType,
      state.hasBackupGenerator,
      state.generatorCapacityBand,
      industry?.includes("hospital") || industry?.includes("data") // Show generator for critical industries
    );

    // Infer grid capacity from service size (if not directly provided)
    const SERVICE_SIZE_CAPACITY: Record<string, number> = {
      "200A-single": 48,
      "400A-three": 277,
      "800A-three": 553,
      "1000A-plus": 1000,
    };
    const inferredGridCapacity =
      state.serviceSize && state.serviceSize !== "unsure"
        ? SERVICE_SIZE_CAPACITY[state.serviceSize] || 0
        : 0;

    // Infer generator capacity from band
    const GENERATOR_BAND_KW: Record<string, number> = {
      "under-50": 35,
      "50-150": 100,
      "150-500": 300,
      "500-plus": 750,
    };
    const inferredGeneratorKW =
      state.generatorCapacityBand && state.generatorCapacityBand !== "not-sure"
        ? GENERATOR_BAND_KW[state.generatorCapacityBand] || 0
        : 0;

    // HVAC multiplier from type
    const HVAC_MULTIPLIERS: Record<string, number> = {
      rtu: 1.0,
      chiller: 1.15,
      "heat-pump": 0.9,
    };
    const hvacMultiplier =
      state.hvacType && state.hvacType !== "not-sure"
        ? HVAC_MULTIPLIERS[state.hvacType] || 1.0
        : 1.0;

    return computeTrueQuoteSizing({
      gridCapacityKW: inferredGridCapacity || undefined,
      peakDemandKW: estimatedPowerMetrics.peakDemandKW,
      demandChargeBand: state.demandChargeBand,
      hvacMultiplier,
      generatorCapacityKW: inferredGeneratorKW || undefined,
      hasBackupGenerator: state.hasBackupGenerator,
      goals: state.goals,
      industry,
      confidence: modelConfidence.score,
    });
  }, [
    state.industry,
    state.detectedIndustry,
    state.serviceSize,
    state.hasDemandCharge,
    state.demandChargeBand,
    state.hvacType,
    state.hasBackupGenerator,
    state.generatorCapacityBand,
    state.goals,
    estimatedPowerMetrics.peakDemandKW,
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

    if (import.meta.env.DEV) console.log("[Intelligence] Orchestrating intelligence layer:", {
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
        if (import.meta.env.DEV) console.log("[Intelligence] Results:", {
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
      if (import.meta.env.DEV) console.log("[SiteScore™] Quick estimate (no industry):", quickScore);
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

      if (import.meta.env.DEV) console.log("[SiteScore™] Full calculation:", {
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
      // ✅ GATING FIX (Jan 24, 2026): Block advancing if current step isn't complete
      // This prevents users from blasting through incomplete steps
      if (!_canProceed()) {
        if (import.meta.env.DEV) console.log(`⚠️ Step ${prev} blocked - requirements not met`);
        setShowBlockedFeedback(true);
        setTimeout(() => setShowBlockedFeedback(false), 3000);
        return prev;
      }

      // ✅ CONTRACT (Jan 24, 2026): Step 3 validation uses contract validator
      if (prev === 3 && !step3Contract.ok) {
        if (import.meta.env.DEV) console.log("⚠️ Step 3 not valid - cannot advance. Missing:", step3Contract.missing);
        setShowBlockedFeedback(true);
        setTimeout(() => setShowBlockedFeedback(false), 3000);
        return prev;
      }

      // Skip Step 2 (Industry Selection) if industry was auto-detected from business lookup
      // ✅ FIX 3 (Jan 24, 2026): Use hasIndustry for deterministic skip
      if (prev === 1 && hasIndustry) {
        if (import.meta.env.DEV) console.log("🧙 Skipping Step 2 - Industry detected:", state.industry || state.detectedIndustry);
        return 3; // Go directly to Step 3 (Details)
      }

      return Math.min(prev + 1, 6);
    });

  const goBack = () =>
    setCurrentStep((prev) => {
      const back = prev - 1;
      // Always go to the previous step (no more skipping)
      // User can click step indicators to jump to any completed step
      if (import.meta.env.DEV) console.log(`🔙 Going back from Step ${prev} to Step ${back}`);
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

  // ✅ FIX 1 (Jan 24, 2026): Step 5/6 "calcs ready" watchdog
  // Prevents "quote page but empty numbers" - the most common wizard failure
  const hasValidCalcs = useMemo(() => {
    const c = state.calculations?.selected;
    const b = state.calculations?.base;
    if (!c || !b) return false;

    // These fields MUST exist for Step 6 to render meaningfully
    const ok =
      (b.peakDemandKW ?? 0) > 0 &&
      (c.bessKW ?? 0) > 0 &&
      (c.bessKWh ?? 0) > 0 &&
      (c.totalInvestment ?? 0) > 0;

    return ok;
  }, [state.calculations]);

  // ✅ FIX 3 (Jan 24, 2026): Deterministic industry detection
  // Prevents timing-dependent skip behavior
  const hasIndustry = !!(state.industry || state.detectedIndustry);

  // ✅ FIX 5 (Jan 24, 2026): Step-specific blocked feedback messages
  const blockedMessage = useMemo(() => {
    switch (currentStep) {
      case 1: return "Add your ZIP + state and choose at least 2 goals.";
      case 2: return "Select your industry and business size.";
      case 3: return "Complete the required questions to continue.";
      case 5: return "Pick a power level to generate your quote.";
      default: return "Please complete the required fields before continuing.";
    }
  }, [currentStep]);

  // ✅ CONTRACT VALIDATOR (Jan 24, 2026 → Jan 26, 2026): The ONLY authority for Step 3 validity
  // V6: Hardcoded validator (validateStep3Contract)
  // V7: Database-driven validator (validateStep3Dynamic)
  // Toggle via VITE_USE_DATABASE_VALIDATOR=true
  const [step3Contract, setStep3Contract] = useState(() => validateStep3Sync(state));
  
  useEffect(() => {
    if (USE_DATABASE_VALIDATOR) {
      // Async database-driven validation
      validateStep3Dynamic(state).then(result => {
        setStep3Contract(result);
        
        if (import.meta.env.DEV) {
          console.log('📋 Step 3 Contract (V7 Database):', {
            ok: result.ok,
            completeness: result.completenessPct + '%',
            confidence: result.confidencePct + '%',
            hasLoadAnchor: result.hasLoadAnchor,
            missingRequired: result.missingRequired,
            industry: result.industry,
          });
        }
      });
    } else {
      // Synchronous hardcoded validation (V6)
      const result = validateStep3Contract(state);
      setStep3Contract(result);
      
      if (import.meta.env.DEV) {
        // ✅ ENHANCED DEBUG (Jan 26, 2026 evening): Show WHY validation fails
        const inputsCount = Object.keys(state.useCaseData?.inputs || {}).length;
        console.group('📋 Step 3 Contract (V6 Hardcoded)');
        console.log('OK:', result.ok);
        console.log('Completeness:', result.completenessPct + '%');
        console.log('Confidence:', result.confidencePct + '%');
        console.log('Has Load Anchor:', result.hasLoadAnchor);
        console.log('Missing Required:', result.missingRequired);
        console.log('Industry:', state.industry || state.detectedIndustry);
        console.log('Inputs Count:', inputsCount);
        console.log('Inputs:', state.useCaseData?.inputs);
        console.groupEnd();
      }
    }
  }, [state, USE_DATABASE_VALIDATOR]);

  const _canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        // ✅ FIX (Feb 5, 2026): Don't gate on state.state — async lookup may not have
        // resolved yet, and hardcoded fallback doesn't cover all states.
        // Bulletproof rule: valid 5-digit ZIP + 2 goals = Continue unlocked.
        return /^\d{5}$/.test(state.zipCode) && state.goals.length >= 2;
      case 2:
        // Industry must be selected AND business size tier must be set
        return state.industry !== "" && state.businessSizeTier !== undefined;
      case 3: {
        // ✅ CONTRACT (Jan 24, 2026): Use contract validator, not UI-reported step3Valid
        // This ensures Step 3 can't lie about validity
        const can = step3Contract.ok;
        // ✅ DEBUG (Jan 25, 2026): Log when Continue is blocked
        if (!can && import.meta.env.DEV) {
          console.warn('⛔ Continue BLOCKED at Step 3:', {
            contractOk: step3Contract.ok,
            missingRequired: step3Contract.missingRequired,
            completeness: step3Contract.completenessPct + '%',
            inputsInState: Object.keys(state.useCaseData?.inputs || {}).length,
          });
        } else if (can && import.meta.env.DEV) {
          console.log('✅ Continue ENABLED at Step 3:', {
            contractOk: step3Contract.ok,
            completeness: step3Contract.completenessPct + '%',
          });
        }
        return can;
      }
      case 4:
        // ✅ FIX 2 (Jan 24, 2026): Step 4 is ALWAYS valid (opt-in add-ons)
        return true;
      case 5:
        // ✅ FIX 1 (Jan 24, 2026): Use hasValidCalcs to prevent empty quote pages
        return state.selectedPowerLevel !== null && hasValidCalcs;
      case 6:
        return state.selectedPowerLevel !== null && hasValidCalcs;
      default:
        return false;
    }
  };

  // ✅ GATING FIX (Jan 24, 2026): Wire _canProceed to actual navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const canProceed = useMemo(() => _canProceed(), [currentStep, step3Contract.ok, state, hasValidCalcs]);

  // ✅ DIAGNOSTIC (Feb 1, 2026): Compute WHY Next is disabled - ROOT CAUSE PRECEDENCE
  // Returns ONLY the first/root blocking condition for clean diagnostics
  // This makes Playwright tests stable and errors actionable
  const nextDisabledReason = useMemo((): string | null => {
    if (currentStep === 6) return 'final-step'; // Not really "disabled", just hidden

    switch (currentStep) {
      case 1: {
        // Root-cause precedence: ZIP → goals (state resolves async, don't gate on it)
        if (!/^\d{5}$/.test(state.zipCode)) return 'zip-incomplete';
        if (state.goals.length < 2) return 'goals-need-2';
        return null;
      }
      case 2: {
        // Root-cause precedence: industry → size tier
        if (state.industry === '') return 'industry-missing';
        if (state.businessSizeTier === undefined) return 'size-tier-missing';
        return null;
      }
      case 3: {
        if (!step3Contract.ok) {
          // For Step 3, provide more detail since it's complex
          if (step3Contract.missingRequired?.length > 0) {
            return `missing:${step3Contract.missingRequired[0]}`; // First missing field
          }
          return 'step3-contract-failed';
        }
        return null;
      }
      case 4:
        // Step 4 is always valid (opt-in add-ons)
        return null;
      case 5: {
        // Root-cause precedence: power level → calcs
        if (state.selectedPowerLevel === null) return 'power-level-not-selected';
        if (!hasValidCalcs) return 'calcs-invalid';
        return null;
      }
      default:
        return 'unknown-step';
    }
  }, [currentStep, state.zipCode, state.state, state.goals.length, state.industry, 
      state.businessSizeTier, step3Contract, state.selectedPowerLevel, hasValidCalcs]);

  // ✅ DIAGNOSTIC (Jan 28, 2026): Log when Next stays disabled for > 2s after user activity
  // Helps debug Playwright tests that timeout waiting for Next to enable
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!nextDisabledReason) return; // Not disabled, nothing to log
    if (currentStep === 6) return; // Final step, expected

    const timer = setTimeout(() => {
      console.warn(`⚠️ [DIAGNOSTIC] Next disabled for >2s at Step ${currentStep}:`, {
        reason: nextDisabledReason,
        zipCode: state.zipCode,
        state: state.state,
        goalsCount: state.goals.length,
        industry: state.industry,
        businessSizeTier: state.businessSizeTier,
        selectedPowerLevel: state.selectedPowerLevel,
        step3Contract: step3Contract.ok ? 'OK' : step3Contract.missingRequired,
        hasValidCalcs,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [nextDisabledReason, currentStep, state.zipCode, state.state, state.goals.length,
      state.industry, state.businessSizeTier, state.selectedPowerLevel, step3Contract, hasValidCalcs]);

  // ✅ FIX (Jan 25, 2026): flashBlocked removed - feedback now shown via canProceed check
  // setShowBlockedFeedback controlled directly in goNext()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1AdvisorLed
            state={state}
            updateState={updateState}
            onGoToStep2={() => goToStep(2)}
            onNext={() => {
              // ✅ FIX 3 (Jan 24, 2026): Use hasIndustry for deterministic skip
              if (hasIndustry) {
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
              // ✅ CONTRACT (Jan 24, 2026): Use contract validator for hard gating
              if (!step3Contract.ok) {
                if (import.meta.env.DEV) console.log("⚠️ Step 3 onNext blocked - missing:", step3Contract.missing);
                return;
              }
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
        return <Step6Quote state={state} trueQuoteSizing={trueQuoteSizing} />;
      default:
        return null;
    }
  };

  return (
    <AdvisorPublisher
      currentStep={currentStep}
      options={{ clearOnStepChange: true, enableWarnings: true }}
    >
      <div data-wizard-version="v6" className="fixed inset-0 bg-gradient-to-br from-[#050B16] via-[#071226] to-[#050B16]">
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

            {/* OLD Intelligence Header REMOVED - Replaced by EnergyMetricsHeader (Jan 25, 2026) */}

            {/* ✅ ENERGY METRICS - Persistent location intelligence (Jan 25, 2026) */}
            <EnergyMetricsHeader metrics={state.energyMetrics || null} />

            {/* ======================================================================
                2-COLUMN LAYOUT: AdvisorRail (LEFT) + Wizard Content (RIGHT)
                ====================================================================== */}
            <div className="relative flex h-[calc(100vh-108px)] flex-col lg:flex-row">
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
                      // Progressive Model (Jan 21, 2026 - TrueQuote™ Accuracy)
                      progressiveModel: (() => {
                        // Calculate model confidence using the SSOT function
                        const industry = state.industry || state.detectedIndustry;
                        const showGenerator =
                          industry?.includes("hospital") ||
                          industry?.includes("data") ||
                          industry?.includes("critical");
                        const modelConf = calculateModelConfidence(
                          state.serviceSize,
                          state.hasDemandCharge,
                          state.demandChargeBand,
                          state.hvacType,
                          state.hasBackupGenerator,
                          state.generatorCapacityBand,
                          showGenerator
                        );

                        return {
                          serviceSize: state.serviceSize,
                          gridCapacityKW:
                            state.serviceSize && state.serviceSize !== "unsure"
                              ? (
                                  {
                                    "200A-single": 48,
                                    "400A-three": 277,
                                    "800A-three": 553,
                                    "1000A-plus": 1000,
                                  } as Record<string, number>
                                )[state.serviceSize]
                              : undefined,
                          hasDemandCharge: state.hasDemandCharge,
                          demandChargeBand: state.demandChargeBand,
                          hvacType: state.hvacType,
                          hvacMultiplier:
                            state.hvacType && state.hvacType !== "not-sure"
                              ? (
                                  { rtu: 1.0, chiller: 1.15, "heat-pump": 0.9 } as Record<
                                    string,
                                    number
                                  >
                                )[state.hvacType]
                              : undefined,
                          hasBackupGenerator: state.hasBackupGenerator,
                          generatorCapacityKW:
                            state.generatorCapacityBand &&
                            state.generatorCapacityBand !== "not-sure"
                              ? (
                                  { "under-100": 50, "100-500": 250, "500-plus": 750 } as Record<
                                    string,
                                    number
                                  >
                                )[state.generatorCapacityBand]
                              : undefined,
                          // Phase 4: Numeric confidence from TrueQuote™ SSOT
                          modelConfidenceScore: modelConf.score,
                          modelCompleteness: modelConf.completeness,
                          lastLearningMessage: modelConf.lastLearningMessage,
                          // Legacy (deprecated)
                          confidence:
                            modelConf.score >= 75
                              ? ("high" as const)
                              : modelConf.score >= 55
                                ? ("medium" as const)
                                : ("low" as const),
                          fieldsAnswered: (state.progressiveFieldsAnswered || []).length,
                        };
                      })(),
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
            {/* Blocked feedback message - shows for ALL steps (Jan 24, 2026) */}
            {showBlockedFeedback && (
              <div className="mb-3 flex justify-center pointer-events-auto">
                <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm animate-pulse">
                  ⚠️ {blockedMessage}
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

              {/* Next button - disabled when step requirements not met (Jan 24, 2026) */}
              {/* ✅ DIAGNOSTIC (Jan 28, 2026): data-disabled-reason for Playwright debugging */}
              <div className="relative group">
                <button
                  onClick={goNext}
                  disabled={currentStep === 6 || !canProceed}
                  data-testid="wizard-next-button"
                  data-disabled-reason={nextDisabledReason || undefined}
                  data-step={currentStep}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                    currentStep === 6 || !canProceed
                      ? "bg-slate-800/80 text-slate-500 cursor-not-allowed"
                      : showBlockedFeedback
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white animate-pulse"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  }`}
                >
                  {currentStep === 5 ? "View Quote" : "Next Step"}
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* DEV-only: Show why disabled as tooltip */}
                {import.meta.env.DEV && nextDisabledReason && (
                  <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-red-900/95 text-red-200 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border border-red-700">
                      <div className="font-bold text-red-300 mb-1">🚫 Next Disabled:</div>
                      <code className="text-red-100">{nextDisabledReason}</code>
                    </div>
                  </div>
                )}
              </div>
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
