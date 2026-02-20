/**
 * Step 3 Integration Layer
 *
 * Connects the new Complete Step 3 with existing Step3Details
 * Provides smooth migration path and backward compatibility
 * 
 * ✅ NEW: Car Wash 16Q Integration (Jan 2026)
 * Detects car-wash industry and calculates power metrics in real-time
 * 
 * ✅ Jan 26, 2026: Added type safety to prevent functional updater misuse
 */
import React, { useEffect, useRef } from "react";
import { CompleteStep3Component } from "./CompleteStep3Component";
import { assertNoDerivedFieldsInStep3 } from "./v6/utils/wizardStateValidator";
import { validateStep3Contract } from "./v6/step3/validateStep3Contract";
import { calculateCarWashFromAnswers } from "@/services/calculators/carWashIntegration";
import { calculateHotelFromAnswers } from "@/services/calculators/hotelIntegration";
import { calculateTruckStopFromAnswers } from "@/services/calculators/truckStopIntegration";
import { calculateEVChargingFromAnswers } from "@/services/calculators/evChargingIntegration";
import { calculateHospitalFromAnswers } from "@/services/calculators/hospitalIntegration";
import { calculateDataCenterFromAnswers } from "@/services/calculators/dataCenterIntegration";
import { calculateOfficeFromAnswers } from "@/services/calculators/officeIntegration";
import { applyTemplateDefaults } from "@/services/templates";

// ============================================================================
// TYPE SAFETY: Prevent functional updater misuse
// ============================================================================

/**
 * ✅ Type guard: Only accepts object patches, NOT functional updaters
 * This makes `patchState((prev) => ...)` a TypeScript ERROR
 */
type Patch<T> = Partial<T> & { __noFunctionalUpdater?: never };
type PatchFn<T> = (patch: Patch<T>) => void;

// ============================================================================
// CANONICALIZED STATE WRITER: Single source of truth for contract fields
// ============================================================================

/**
 * Builds a state patch with contract fields in dual-write pattern.
 * Used by BOTH pre-pricing and post-pricing branches to avoid drift.
 * 
 * @param state - Current wizard state (for spreading existing fields)
 * @param answers - Raw questionnaire answers
 * @param opts - Optional: facilityFields (industry-specific), loadAnchor (power estimate)
 * @returns State patch ready for patchState()
 */
function writeStep3ContractFields(
  state: WizardStep3State,
  answers: Record<string, unknown>,
  opts: {
    facilityFields?: Record<string, unknown>;
    loadAnchor?: { kw: number; source: string; meta?: Record<string, unknown> };
    industryMetrics?: NormalizedIndustryMetrics;
  } = {}
): Patch<WizardStep3State> {
  const { facilityFields = {}, loadAnchor, industryMetrics } = opts;

  return {
    useCaseData: {
      ...state.useCaseData,
      // Keep current inputs if they exist (don't overwrite user answers)
      inputs: state.useCaseData?.inputs || {},
      industryMetrics,
    },

    // ✅ CURRENT SHAPE (what WizardV6 uses)
    facilityDetails: {
      ...((state as any).facilityDetails || {}),
      ...facilityFields,
    },
    calculations: {
      ...((state as any).calculations || {}),
      ...(loadAnchor ? { loadAnchor } : {}),
    },

    // ✅ LEGACY/CONTRACT SHAPE (what validator checks)
    facility: {
      ...((state as any).facility || {}),
      ...facilityFields,
    },
    calculated: {
      ...((state as any).calculated || {}),
      ...(loadAnchor ? { loadAnchor } : {}),
    },
  } as Patch<WizardStep3State>;
}

// ✅ Patch 2 (Jan 23, 2026): Normalized metrics type for consistent shape across all industries
type NormalizedIndustryMetrics = {
  industrySlug: string;
  calculator: string;
  peakKW?: number;
  dailyKWh?: number;
  bessKW?: number;
  bessKWh?: number;
  annualSavings?: number;
  confidence?: number;
  pricingFingerprint: string;
  pricingStatus?: "ready" | "fallback";
};

/**
 * Normalizes calculator outputs to a consistent shape for Step3DetailsV7.
 * Handles different field names across calculators (peakKW vs peakDemandKW, etc.)
 */
function normalizeIndustryMetrics(
  industry: string,
  raw: any,
  pricingFingerprint: string,
  pricingStatus?: any
): NormalizedIndustryMetrics | undefined {
  if (!raw) return undefined;

  // Common aliases across calculators
  const peakKW = raw.peakKW ?? raw.peakDemandKW ?? raw.peak_kw;
  const dailyKWh = raw.dailyKWh ?? raw.daily_kwh;
  const bessKW = raw.bessKW ?? raw.recommendedBESSKW ?? raw.bess_kw ?? (raw.bessMW ? raw.bessMW * 1000 : undefined);
  const bessKWh = raw.bessKWh ?? raw.recommendedBESSKWh ?? raw.bess_kwh;

  // Savings aliases
  const annualSavings =
    raw.annualSavings ??
    raw.estimatedSavings?.annualSavings ??
    raw.estimatedSavings?.annual_savings;

  const confidence = raw.confidence ?? raw.confidenceScore ?? raw.confidence_score;

  return {
    industrySlug: industry,
    calculator: `${industry}-16Q`,
    peakKW: typeof peakKW === "number" ? peakKW : undefined,
    dailyKWh: typeof dailyKWh === "number" ? dailyKWh : undefined,
    bessKW: typeof bessKW === "number" ? bessKW : undefined,
    bessKWh: typeof bessKWh === "number" ? bessKWh : undefined,
    annualSavings: typeof annualSavings === "number" ? annualSavings : undefined,
    confidence: typeof confidence === "number" ? confidence : undefined,
    pricingFingerprint,
    pricingStatus,
  };
}

type WizardStep3State = {
  industry?: string;
  businessSizeTier?: "small" | "medium" | "large" | "enterprise";
  questionnaireDepth?: "minimal" | "standard" | "detailed";
  // ✅ Patch 4 (Jan 23, 2026): Tightened useCaseData type
  useCaseData?: {
    inputs?: Record<string, unknown>;
    industryMetrics?: NormalizedIndustryMetrics;
    template?: any; // Step 3 industry template bundle
    [k: string]: unknown;
  };
  // ✅ Pricing freeze (Jan 23, 2026)
  pricingConfig?: unknown;
  pricingStatus?: "idle" | "loading" | "ready" | "fallback";
};

interface Step3IntegrationProps {
  state?: WizardStep3State;
  /** ✅ Type-safe patch function - rejects functional updaters */
  patchState?: PatchFn<WizardStep3State>;
  updateState?: PatchFn<WizardStep3State>; // Alias for backward compatibility
  onComplete?: (data: unknown) => void;
  initialData?: Record<string, unknown>;
  onBack?: () => void;
  onNext?: (quoteData: { answers: Record<string, unknown>; timestamp: string }) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function Step3Integration({
  state = {},
  patchState,
  updateState, // Backward compatibility alias
  onComplete,
  initialData = {},
  onBack,
  onNext,
  onValidityChange,
}: Step3IntegrationProps) {
  // Use patchState if provided, otherwise fall back to updateState for backward compatibility
  const patch = patchState || updateState;
  // ✅ SSOT FIX (Jan 24, 2026): NO local answers state!
  // Step3Integration is now a pure "pipe" - it reads from wizard SSOT only.
  // This eliminates the dual-state divergence bug where UI shows answers but wizard store is empty.
  const answers =
    (state.useCaseData?.inputs as Record<string, unknown>) ||
    (initialData as Record<string, unknown>) ||
    {};
  // ✅ REMOVED: isComplete state - no longer needed, WizardV6 handles navigation

  // ✅ TEMPLATE HYDRATION: Scoped by industry to prevent cross-industry pollution
  // Tracks which industry was hydrated (null = none, string = industry slug)
  const hydratedIndustryRef = useRef<string | null>(null);

  // ============================================================================
  // TEMPLATE-BASED DEFAULTS (one-shot hydration, scoped per industry)
  // ============================================================================
  useEffect(() => {
    const template = state.useCaseData?.template;
    const industry = state.industry?.toLowerCase().replace(/_/g, "-");

    // Reset hydration flag if industry changed (prevents pollution)
    if (industry && hydratedIndustryRef.current && hydratedIndustryRef.current !== industry) {
      if (import.meta.env.DEV) {
        console.log("[Step3] Industry changed:", hydratedIndustryRef.current, "->", industry, "(hydration reset)");
      }
      hydratedIndustryRef.current = null;
    }

    // Only hydrate once per industry, when template arrives and answers are sparse
    if (template && hydratedIndustryRef.current !== industry && industry) {
      const answeredCount = Object.values(answers).filter(
        (v) => v != null && v !== ""
      ).length;

      // Only hydrate if user hasn't already answered much (≤2 fields)
      if (answeredCount <= 2) {
        const hydrated = applyTemplateDefaults(industry, answers, template);

        // Check if hydration actually added anything
        const newKeys = Object.keys(hydrated).filter(
          (k) => hydrated[k] != null && answers[k] == null
        );

        if (newKeys.length > 0) {
          hydratedIndustryRef.current = industry;
          if (import.meta.env.DEV) {
            console.log("[Step3] HYDRATED from template:", newKeys, `(industry: ${industry})`);
          }
          // ✅ SSOT FIX: Write ONLY to wizard store (no local state)
          patch?.({
            useCaseData: {
              ...state.useCaseData,
              inputs: hydrated,
            },
          });
        } else {
          // Mark as "checked" even if no defaults applied (prevent re-checking)
          hydratedIndustryRef.current = industry;
        }
      } else {
        // Too many answers - mark as "checked" to prevent re-checking
        hydratedIndustryRef.current = industry;
      }
    }
  }, [state.useCaseData?.template, state.industry, answers]);

  // ============================================================================
  // INTEGRATION HOOKS
  // ============================================================================

  // Sync answers with parent component (debounced to prevent infinite loops)
  const answersStableRef = useRef<string>(JSON.stringify(answers));
  
  useEffect(() => {
    // Only update if answers actually changed (deep comparison via JSON)
    const answersJSON = JSON.stringify(answers);
    const answersChanged = answersStableRef.current !== answersJSON;

    if (!answersChanged) {
      // No change - don't run calculations
      return;
    }
    
    // Update stable ref FIRST to prevent re-entry
    answersStableRef.current = answersJSON;

    if (!patch) return;
      
      // ✅ NEW: Industry-Specific 16Q Calculator Integration (Jan 2026)
      // Calculate power metrics in real-time for all 7 top revenue industries
      let industryMetrics = null;
      const industry = state.industry?.toLowerCase().replace(/_/g, '-');
      
      // ✅ PRICING FREEZE GUARD (Jan 23, 2026)
      // "No pricing, no math" - compute boundary protection
      const pricingConfig = state?.pricingConfig;
      const pricingStatus = state?.pricingStatus;
      
      // Block compute if pricing is still loading/idle
      if (pricingStatus === "loading" || pricingStatus === "idle") {
        if (import.meta.env.DEV) {
          console.warn("[Step3Integration] Compute skipped: pricing still loading/idle");
        }
        // Don't compute metrics yet - wait for pricing to be ready
        return;
      }
      
      // ✅ BRIDGE (Jan 25, 2026): ALWAYS write contract fields, even without pricingConfig
      // The validator needs facility.* and calculated.loadAnchor regardless of pricing
      
      // --- INDUSTRY-SPECIFIC FACILITY FIELDS ---
      const facilityFields: Record<string, unknown> = {};
      
      // Car wash: bayCount
      const bayCountRaw = answers.bayTunnelCount ?? answers.bayCount ?? answers.bays;
      if (Number.isFinite(Number(bayCountRaw))) {
        facilityFields.bayCount = Number(bayCountRaw);
      }
      
      if (import.meta.env.DEV) {
        console.log("[Step3Integration/bridge] Car Wash Fields:", {
          bayTunnelCount: answers.bayTunnelCount,
          bayCount: answers.bayCount,
          bays: answers.bays,
          bayCountRaw,
          finalBayCount: facilityFields.bayCount,
          allAnswers: answers
        });
      }
      
      // Hospital: bedCount
      const bedCountRaw = answers.bedCount ?? answers.numberOfBeds;
      if (Number.isFinite(Number(bedCountRaw))) {
        facilityFields.bedCount = Number(bedCountRaw);
      }
      
      // Hotel: roomCount
      const roomCountRaw = answers.roomCount ?? answers.numberOfRooms ?? answers.hotelRooms;
      if (Number.isFinite(Number(roomCountRaw))) {
        facilityFields.roomCount = Number(roomCountRaw);
      }
      
      // Data center: rackCount
      const rackCountRaw = answers.rackCount ?? answers.numberOfRacks;
      if (Number.isFinite(Number(rackCountRaw))) {
        facilityFields.rackCount = Number(rackCountRaw);
      }
      
      // Truck stop: fuelPumpCount
      const fuelPumpCountRaw = answers.fuelPumpCount ?? answers.numberOfPumps;
      if (Number.isFinite(Number(fuelPumpCountRaw))) {
        facilityFields.fuelPumpCount = Number(fuelPumpCountRaw);
      }
      
      // EV charging: dcfcChargerCount (database uses level2Count, dcfc50Count, dcfcHighCount)
      const level2Count = Number(answers.level2Count || 0);
      const dcfc50Count = Number(answers.dcfc50Count || 0);
      const dcfcHighCount = Number(answers.dcfcHighCount || 0);
      const totalEVChargers = level2Count + dcfc50Count + dcfcHighCount;
      
      if (import.meta.env.DEV) {
        console.log("[Step3Integration/bridge] EV Charging Fields:", {
          level2Count: answers.level2Count,
          dcfc50Count: answers.dcfc50Count,
          dcfcHighCount: answers.dcfcHighCount,
          totalEVChargers,
          facilityFieldsSet: totalEVChargers > 0,
          allAnswers: Object.keys(answers)
        });
      }
      
      if (totalEVChargers > 0) {
        facilityFields.dcfcChargerCount = totalEVChargers;
      }
      
      // ===== ADDITIONAL INDUSTRIES (DATABASE FIELD NAMES) =====
      
      // Warehouse: warehouseSqFt
      const warehouseSqFtRaw = answers.warehouseSqFt ?? answers.warehouseSquareFeet;
      if (Number.isFinite(Number(warehouseSqFtRaw))) {
        facilityFields.warehouseSqFt = Number(warehouseSqFtRaw);
      }
      
      // Manufacturing: manufacturingSqFt
      const manufacturingSqFtRaw = answers.manufacturingSqFt ?? answers.manufacturingSquareFeet;
      if (Number.isFinite(Number(manufacturingSqFtRaw))) {
        facilityFields.manufacturingSqFt = Number(manufacturingSqFtRaw);
      }
      
      // Office: officeSqFt
      const officeSqFtRaw = answers.officeSqFt ?? answers.officeSquareFeet;
      if (Number.isFinite(Number(officeSqFtRaw))) {
        facilityFields.officeSqFt = Number(officeSqFtRaw);
      }
      
      // Retail: retailSqFt
      const retailSqFtRaw = answers.retailSqFt ?? answers.retailSquareFeet ?? answers.storeSqFt;
      if (Number.isFinite(Number(retailSqFtRaw))) {
        facilityFields.retailSqFt = Number(retailSqFtRaw);
      }
      
      // Apartment: totalUnits
      const totalUnitsRaw = answers.totalUnits ?? answers.unitCount ?? answers.numberOfUnits;
      if (Number.isFinite(Number(totalUnitsRaw))) {
        facilityFields.totalUnits = Number(totalUnitsRaw);
      }
      
      // Agricultural: farmAcres
      const farmAcresRaw = answers.farmAcres ?? answers.totalAcres ?? answers.acres;
      if (Number.isFinite(Number(farmAcresRaw))) {
        facilityFields.farmAcres = Number(farmAcresRaw);
      }
      
      // Airport: annualPassengers
      const annualPassengersRaw = answers.annualPassengers ?? answers.passengers ?? answers.passengerCount;
      if (Number.isFinite(Number(annualPassengersRaw))) {
        facilityFields.annualPassengers = Number(annualPassengersRaw);
      }
      
      // Casino: gamingFloorSqFt
      const gamingFloorSqFtRaw = answers.gamingFloorSqFt ?? answers.gamingSquareFeet ?? answers.casinoFloorSqFt;
      if (Number.isFinite(Number(gamingFloorSqFtRaw))) {
        facilityFields.gamingFloorSqFt = Number(gamingFloorSqFtRaw);
      }
      
      // Cold Storage: refrigeratedSqFt
      const refrigeratedSqFtRaw = answers.refrigeratedSqFt ?? answers.coldStorageSqFt ?? answers.refrigeratedSquareFeet;
      if (Number.isFinite(Number(refrigeratedSqFtRaw))) {
        facilityFields.refrigeratedSqFt = Number(refrigeratedSqFtRaw);
      }
      
      // Shopping Center: mallSqFt
      const mallSqFtRaw = answers.mallSqFt ?? answers.shoppingCenterSqFt ?? answers.glaSqFt;
      if (Number.isFinite(Number(mallSqFtRaw))) {
        facilityFields.mallSqFt = Number(mallSqFtRaw);
      }
      
      // College: studentPopulation
      const studentPopulationRaw = answers.studentPopulation ?? answers.students ?? answers.enrollment;
      if (Number.isFinite(Number(studentPopulationRaw))) {
        facilityFields.studentPopulation = Number(studentPopulationRaw);
      }
      
      // Gas Station: fuelPositions
      const fuelPositionsRaw = answers.fuelPositions ?? answers.numberOfFuelPositions ?? answers.pumpPositions;
      if (Number.isFinite(Number(fuelPositionsRaw))) {
        facilityFields.fuelPositions = Number(fuelPositionsRaw);
      }
      
      // Indoor Farm: totalSqFt (indoor-farm uses this field name)
      const totalSqFtRaw = answers.totalSqFt ?? answers.farmSquareFeet;
      if (Number.isFinite(Number(totalSqFtRaw))) {
        facilityFields.totalSqFt = Number(totalSqFtRaw);
      }
      
      // Generic: squareFeet (fallback for industries without specific field)
      const sqftRaw = answers.squareFeet ?? answers.squareFootage ?? answers.facilitySqFt;
      if (Number.isFinite(Number(sqftRaw))) {
        facilityFields.squareFeet = Number(sqftRaw);
      }
      
      // Operating hours (multiple field names)
      const opHoursRaw = answers.operatingHours ?? answers.operatingSchedule ?? answers.hoursOfOperation;
      if (Number.isFinite(Number(opHoursRaw))) {
        facilityFields.operatingHours = Number(opHoursRaw);
      }
      
      if (import.meta.env.DEV) {
        console.log("[Step3Integration/bridge] Operating Hours Check:", {
          operatingHours: answers.operatingHours,
          operatingSchedule: answers.operatingSchedule,
          hoursOfOperation: answers.hoursOfOperation,
          opHoursRaw,
          finalOperatingHours: facilityFields.operatingHours
        });
      }

      // Basic load estimate from WizardV6's power gauge (runs independently of Step3Integration)
      // ✅ FIX (Jan 26, 2026): Check correct powerGauge path
      const estimatedPeakKW =
        (state as any).calculations?.powerGauge?.peakDemandKW ??
        (state as any).calculations?.base?.peakDemandKW ??
        (state as any).calculations?.peakDemandKW;
      const hasBasicLoadAnchor = Number.isFinite(estimatedPeakKW) && estimatedPeakKW > 0;

      if (import.meta.env.DEV && (Object.keys(facilityFields).length > 0 || hasBasicLoadAnchor)) {
        console.log("[Step3Integration] Basic bridge (pre-pricing):", {
          facilityFields,
          estimatedPeakKW,
          hasBasicLoadAnchor,
        });
      }

      // ✅ HARDENED: Block compute if pricing config is missing entirely
      // (regardless of answers count - prevents future refactor mistakes)
      if (!pricingConfig) {
        if (import.meta.env.DEV) {
          console.warn("[Step3Integration] Compute skipped: pricingConfig is null");
        }
        
        // ✅ USE CANONICAL HELPER (Jan 26, 2026): Single source of truth for state writes
        const statePatch = writeStep3ContractFields(state, answers, {
          facilityFields,
          loadAnchor: hasBasicLoadAnchor
            ? {
                kw: estimatedPeakKW!,
                source: "wizard_power_gauge",
                meta: { industry: state.industry, note: "Pre-pricing estimate" },
              }
            : undefined,
          industryMetrics: undefined,
        });
        
        patch?.(statePatch);
        
        // ✅ RUNTIME INVARIANT (Jan 26, 2026): "Validator can't lie"
        if (import.meta.env.DEV) {
          queueMicrotask(() => {
            const s = (window as any).__step3?.getState?.();
            const v = s ? validateStep3Contract(s as any) : null;
            console.log(
              "[Step3Contract/pre-pricing]",
              v?.ok ? "✅ OK" : "⛔ BLOCKED",
              { 
                missing: v?.missingRequired, 
                completeness: v?.completenessPct + "%",
                facilityFields: (s as any)?.facility,
                calculated: (s as any)?.calculated
              }
            );
          });
        }
        return;
      }
      
      // ✅ HARDENED: Type-safe fingerprint extraction (never breaks on shape change)
      const version =
        pricingConfig && typeof pricingConfig === "object" && "version" in pricingConfig
          ? String((pricingConfig as Record<string, unknown>).version)
          : "unknown";
      const pricingFingerprint = `v${version}-${pricingStatus}`;
      
      if (Object.keys(answers).length > 0) {
        // ✅ WIRING DOCTRINE: Log calculator selection for debugging template/key drift
        if (import.meta.env.DEV) {
          console.log("[Step3] CALCULATOR", { industry, answerCount: Object.keys(answers).length });
          // Template identity
          console.log("[Step3] template:", state.useCaseData?.template?.id || state.useCaseData?.template?.useCase || state.useCaseData?.template?.name || "none");
          // Answer key drift detection
          console.log("[Step3] inputs keys:", Object.keys(answers).slice(0, 20));
        }

        // ✅ WIRING DOCTRINE: Pass compute context to all calculators
        // This locks the contract so template-based enhancements can't silently regress
        const computeCtx = {
          template: state.useCaseData?.template,
          pricingConfig,
          pricingStatus,
        };

        // ✅ HARDENED: Truth serum - instantly see if ctx arrived correctly
        if (import.meta.env.DEV) {
          console.log("[Step3] ctx:", {
            hasTemplate: !!state.useCaseData?.template,
            pricingStatus,
            hasPricingConfig: !!pricingConfig,
          });
        }

        switch (industry) {
          case 'car-wash':
            industryMetrics = calculateCarWashFromAnswers(answers, computeCtx);
            break;
          case 'hotel':
            industryMetrics = calculateHotelFromAnswers(answers, computeCtx);
            break;
          case 'truck-stop':
            industryMetrics = calculateTruckStopFromAnswers(answers, computeCtx);
            break;
          case 'ev-charging':
            industryMetrics = calculateEVChargingFromAnswers(answers, computeCtx);
            break;
          case 'hospital':
            industryMetrics = calculateHospitalFromAnswers(answers, computeCtx);
            break;
          case 'data-center':
            industryMetrics = calculateDataCenterFromAnswers(answers, computeCtx);
            break;
          case 'office':
            industryMetrics = calculateOfficeFromAnswers(answers, computeCtx);
            break;
        }
      }
      
      // ✅ Patch 2 (Jan 23, 2026): Normalize metrics to consistent shape
      const normalized = normalizeIndustryMetrics(
        industry ?? "unknown",
        industryMetrics,
        pricingFingerprint,
        pricingStatus
      );

      // ✅ WIRING DOCTRINE: Log metrics for debugging
      if (import.meta.env.DEV && normalized) {
        console.log("[Step3] metrics:", { peak: normalized.peakKW, daily: normalized.dailyKWh, bessKW: normalized.bessKW });
      }

      // ✅ BRIDGE (Jan 25, 2026): Enhanced contract fields from pricing-dependent calculations
      // This runs AFTER pricingConfig check, so it writes the most accurate loadAnchor
      const loadAnchorKW = normalized?.peakKW || (normalized as any)?.peakDemandKW;
      const hasEnhancedLoadAnchor = Number.isFinite(loadAnchorKW) && loadAnchorKW! > 0;

      if (import.meta.env.DEV && hasEnhancedLoadAnchor) {
        console.log("[Step3Integration] Enhanced bridge (post-pricing):", {
          loadAnchorKW,
          source: industry === 'car-wash' ? 'car_wash_estimator' : 'industry_calculator',
        });
      }

      // ✅ USE CANONICAL HELPER (Jan 26, 2026): Single source of truth for state writes
      const statePatch = writeStep3ContractFields(state, answers, {
        facilityFields,
        loadAnchor: hasEnhancedLoadAnchor
          ? {
              kw: loadAnchorKW!,
              source: industry === 'car-wash' ? 'car_wash_estimator' : 'industry_calculator',
              meta: { peakKW: normalized?.peakKW, bessKW: normalized?.bessKW },
            }
          : undefined,
        industryMetrics: normalized,
      });
      
      patch?.(statePatch);
      
      // ✅ RUNTIME INVARIANT (Jan 26, 2026): "Validator can't lie"
      if (import.meta.env.DEV && hasEnhancedLoadAnchor) {
        queueMicrotask(() => {
          const s = (window as any).__step3?.getState?.();
          const v = s ? validateStep3Contract(s as any) : null;
          console.log(
            "[Step3Contract/post-pricing]",
            v?.ok ? "✅ OK" : "⛔ BLOCKED",
            { 
              missing: v?.missingRequired, 
              completeness: v?.completenessPct + "%",
              facilityFields: (s as any)?.facility,
              calculated: (s as any)?.calculated,
              calculations: (s as any)?.calculations
            }
          );
        });
      }
  // ✅ FIX (Jan 26, 2026 evening): CRITICAL - Do NOT include state.useCaseData in deps!
  // This effect WRITES to state.useCaseData via patch(), so including it causes infinite loop.
  // answersStableRef guards against running when answers haven't actually changed.
  // Only re-run when external factors change (industry switch, pricing ready).
  }, [patch, state.industry, state.pricingConfig, state.pricingStatus]);

  // Handle completion - ✅ FIXED (Jan 24, 2026): Just call onNext, no overlay
  // WizardV6 has its own navigation - the overlay was blocking progression
  const handleComplete = () => {
    // ✅ OPTION A (RECOMMENDED): Step 3 only stores raw inputs
    // TrueQuote is SSOT for derived values (estimatedAnnualKwh, peakDemandKw)
    // These will be computed by TrueQuoteEngineV2 in Step 5

    // ✅ INVARIANT A: Build the next state and assert no derived fields
    const nextState = {
      ...state,
      useCaseData: {
        ...state.useCaseData,
        inputs: answers,
        // NOTE: estimatedAnnualKwh and peakDemandKw will be computed by TrueQuote in Step 5
        // This ensures TrueQuote is the single source of truth for all calculations
      },
    };

    // ✅ CONTRACT INVARIANT A: Block any attempt to persist derived fields into useCaseData
    // Validates the actual next state you intend to commit
    if (import.meta.env.DEV) {
      assertNoDerivedFieldsInStep3(nextState);
    }

    // Update state with ONLY raw inputs (no derived calculations)
    if (patchState) {
      patchState({
        useCaseData: nextState.useCaseData,
      });
    }

    // Call onComplete if provided
    onComplete?.(nextState.useCaseData);

    // ✅ FIXED: Just call onNext - no overlay, no extra clicks
    if (onNext) {
      onNext({
        answers,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // ✅ SSOT FIX: No handleAnswersChange needed - CompleteStep3Component writes directly to wizard store

  // ============================================================================
  // RENDER
  // ============================================================================

  // ✅ DEV: Register state for smoke test
  if (import.meta.env.DEV && patch) {
    (window as any).__step3_register?.(state, patch);
  }

  return (
    <div className="relative">
      {/* Complete Step 3 Component */}
      <CompleteStep3Component
        state={state}
        updateState={patch as any}
        initialAnswers={answers}
        onAnswersChange={(newAnswers) => {
          // ✅ SSOT FIX: Always push into wizard store
          patch?.({
            useCaseData: {
              ...state.useCaseData,
              inputs: newAnswers,
            },
          });
        }}
        onComplete={handleComplete}
        onBack={onBack}
        onNext={() => handleComplete()}
        onValidityChange={onValidityChange}
      />
      {/* ✅ REMOVED (Jan 24, 2026): Completion overlay was blocking navigation
          WizardV6 has its own floating navigation - no overlay needed */}
    </div>
  );
}

// ============================================================================
// QUOTE SUMMARY CARD - REMOVED
// ============================================================================
// ✅ REMOVED: QuoteSummaryCard component
// Step 3 no longer computes derived values - TrueQuote is SSOT
// Quote summary will be shown in Step 5 after TrueQuote computes results

// ============================================================================
// DEV-ONLY: Step 3 Wiring Smoke Test
// ============================================================================
// Usage in console:
//   __step3.injectAnswers({ bayCount: 6, operatingHours: 14 })
//   __step3.getState()
// This catches template/key drift immediately without clicking through UI.
if (import.meta.env.DEV) {
  let _step3State: WizardStep3State | null = null;
  let _step3UpdateState: ((updates: Partial<WizardStep3State>) => void) | null = null;

  // Hook to capture state/patchState from component
  (window as any).__step3_register = (
    state: WizardStep3State,
    patchState: (updates: Partial<WizardStep3State>) => void
  ) => {
    _step3State = state;
    _step3UpdateState = patchState;
  };

  (window as any).__step3 = {
    injectAnswers: (answers: Record<string, unknown>) => {
      if (!_step3UpdateState) {
        console.error("[Step3] No patchState registered. Navigate to Step 3 first.");
        return;
      }
      _step3UpdateState({
        useCaseData: {
          ...(_step3State?.useCaseData || {}),
          inputs: answers,
        },
      });
      if (import.meta.env.DEV) console.log("[Step3] Injected answers:", answers);
    },
    getState: () => {
      if (!_step3State) {
        console.error("[Step3] No state registered. Navigate to Step 3 first.");
        return null;
      }
      return _step3State;
    },
    getInputs: () => _step3State?.useCaseData?.inputs || {},
    getMetrics: () => _step3State?.useCaseData?.industryMetrics || null,
  };
}

export default Step3Integration;
