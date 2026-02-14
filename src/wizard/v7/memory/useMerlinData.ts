/**
 * useMerlinData() — Memory-First Data Access Hook
 * ==================================================
 * 
 * THE BRIDGE: Steps 4/5/6 use this hook to read cross-step data.
 * It reads from Merlin Memory first, falls back to reducer state.
 * 
 * WHY:
 *   The reducer carries 80+ fields of step-specific UI state (isBusy,
 *   locationConfirmed, goalsModalRequested, etc.). Steps 4/5/6 only need
 *   ~15 durable data fields (peakLoadKW, goals, industry, location, quote).
 *   This hook gives them exactly that — clean, typed, from the SSOT.
 * 
 * MIGRATION PATH:
 *   Phase 1 (now): Steps call useMerlinData(state) — Memory-first, state fallback
 *   Phase 2 (future): Steps call useMerlinData() — Memory only, no reducer
 *   Phase 3 (future): Reducer shrinks to UI-only state (isBusy, step, errors)
 * 
 * USAGE:
 *   const data = useMerlinData(state);
 *   data.peakLoadKW       // from Memory profile or reducer quote
 *   data.location.state   // from Memory location or reducer location
 *   data.goals            // from Memory goals or reducer goals
 *   data.industry         // from Memory industry or reducer industry
 *   data.quote            // from Memory quote or reducer quote
 *   data.addOns           // from Memory addOns or reducer step4AddOns
 *   data.isMemoryBacked   // true if Memory has the data (not falling back)
 *   data.report           // latest TrueQuote™ validation report
 * 
 * Created: Feb 11, 2026
 */

import { useMemo } from "react";
import { useMerlinMemory } from "./useMerlinMemory";
import { merlinMemory } from "./merlinMemory";
import type { TrueQuoteReport } from "./truequoteValidator";

// ============================================================================
// TYPES
// ============================================================================

/** The clean, typed data surface that downstream steps consume */
export interface MerlinData {
  // ── Location ────────────────────────────────────────────────────────────
  location: {
    zip: string;
    state: string;
    city: string;
    formattedAddress: string;
    lat?: number;
    lng?: number;
  };
  utilityRate: number;       // $/kWh
  demandCharge: number;      // $/kW
  peakSunHours: number;

  // ── Goals ───────────────────────────────────────────────────────────────
  goals: string[];

  // ── Industry ────────────────────────────────────────────────────────────
  industry: string;          // canonical slug
  industryInferred: boolean;
  industryConfidence: number;

  // ── Profile ─────────────────────────────────────────────────────────────
  peakLoadKW: number;
  avgLoadKW: number;
  energyKWhPerDay: number;
  dutyCycle: number;
  contributors: Record<string, number>;
  profileAnswers: Record<string, unknown>;

  // ── Sizing ──────────────────────────────────────────────────────────────
  bessKWh: number;
  bessKW: number;
  durationHours: number;

  // ── Add-ons ─────────────────────────────────────────────────────────────
  addOns: {
    includeSolar: boolean;
    solarKW: number;
    includeGenerator: boolean;
    generatorKW: number;
    generatorFuelType: string;
    includeWind: boolean;
    windKW: number;
  };

  // ── Quote ───────────────────────────────────────────────────────────────
  quote: {
    capexUSD: number;
    annualSavingsUSD: number;
    paybackYears: number;
    npv?: number;
    irr?: number;
    roiYears?: number;
    pricingComplete: boolean;
  } | null;

  // ── Weather & Climate (NEW Feb 11, 2026) ────────────────────────────────
  weather: {
    profile: string;           // "Hot & Humid", "Temperate", etc.
    extremes: string;          // "Frequent heatwaves", etc.
    avgTempF?: number;
    heatingDegreeDays?: number;
    coolingDegreeDays?: number;
  } | null;

  // ── Solar Resource (NEW Feb 11, 2026) ───────────────────────────────────
  solar: {
    peakSunHours: number;
    capacityFactor: number;    // 0-1
    grade: string;             // "A", "A-", "B+", etc.
    annualProductionKWh?: number;
    monthlyProductionKWh?: number[];
    annualIrradiance?: number;
  } | null;

  // ── Financial Model (NEW Feb 11, 2026) ──────────────────────────────────
  financials: {
    // Cost breakdown
    equipmentCost: number;
    totalProjectCost: number;
    taxCredit: number;
    netCost: number;
    // Savings breakdown
    annualSavings: number;
    demandChargeSavings?: number;
    touArbitrageSavings?: number;
    // Return metrics
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    npv: number;
    irr: number;
    // ITC
    itcRate?: number;
    itcAmount?: number;
    // Degradation
    year10CapacityPct?: number;
    year25CapacityPct?: number;
    // Risk
    npvP10?: number;
    npvP90?: number;
    probabilityPositiveNPV?: number;
  } | null;

  // ── Session Telemetry (NEW Feb 11, 2026) ────────────────────────────────
  session: {
    startedAt: number;
    totalStepsCompleted: number;
    quoteGenerations: number;
    addOnChanges: number;
    lastActiveAt: number;
    durationSec: number;       // computed: lastActiveAt - startedAt
  } | null;

  // ── Meta ─────────────────────────────────────────────────────────────────
  isMemoryBacked: boolean;     // true = Memory has data (not falling back)
  filledSlots: string[];       // which Memory slots are populated
  report: TrueQuoteReport | null; // latest TrueQuote™ validation
  checksum: string | null;     // memory state hash
}

// ============================================================================
// FALLBACK EXTRACTORS (bridge from reducer state)
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractLocationFromState(state: any) {
  return {
    zip: state?.location?.postalCode || state?.locationRawInput || "",
    state: state?.location?.state || "",
    city: state?.location?.city || "",
    formattedAddress: state?.location?.formattedAddress || "",
    lat: state?.location?.lat,
    lng: state?.location?.lng,
  };
}

function extractUtilityFromState(state: any) {
  return {
    utilityRate: state?.locationIntel?.utilityRate ?? state?.locationIntel?.electricityRate ?? 0.12,
    demandCharge: state?.locationIntel?.demandCharge ?? 15,
    peakSunHours: state?.locationIntel?.peakSunHours ?? 5.0,
  };
}

function extractQuoteFromState(state: any) {
  if (!state?.quote) return null;
  const q = state.quote;
  return {
    capexUSD: q.capexUSD ?? 0,
    annualSavingsUSD: q.annualSavingsUSD ?? 0,
    paybackYears: q.paybackYears ?? q.roiYears ?? 0,
    npv: q.npv,
    irr: q.irr,
    roiYears: q.roiYears,
    pricingComplete: q.pricingComplete ?? false,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Memory-first data access for wizard steps.
 * 
 * @param state - The reducer state (Phase 1 fallback). Will be optional in Phase 2.
 * @returns MerlinData — clean, typed, always-populated data surface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMerlinData(state?: any): MerlinData {
  // Subscribe to all Memory slots we care about
  const memLocation = useMerlinMemory("location");
  const memGoals = useMerlinMemory("goals");
  const memIndustry = useMerlinMemory("industry");
  const memProfile = useMerlinMemory("profile");
  const memSizing = useMerlinMemory("sizing");
  const memAddOns = useMerlinMemory("addOns");
  const memQuote = useMerlinMemory("quote");
  const memWeather = useMerlinMemory("weather");
  const memSolar = useMerlinMemory("solar");
  const memFinancials = useMerlinMemory("financials");
  const memSession = useMerlinMemory("session");

  return useMemo(() => {
    const hasMemory = memLocation != null || memProfile != null;

    // ── Location (Memory → State fallback) ──────────────────────────────
    const location = memLocation
      ? {
          zip: memLocation.zip,
          state: memLocation.state || "",
          city: memLocation.city || "",
          formattedAddress: memLocation.formattedAddress || "",
          lat: memLocation.lat,
          lng: memLocation.lng,
        }
      : extractLocationFromState(state);

    const utilityRate = memLocation?.utilityRate ?? extractUtilityFromState(state).utilityRate;
    const demandCharge = memLocation?.demandCharge ?? extractUtilityFromState(state).demandCharge;
    const peakSunHours = memLocation?.peakSunHours ?? extractUtilityFromState(state).peakSunHours;

    // ── Goals (Memory → State fallback) ─────────────────────────────────
    const goals = memGoals?.selected ?? state?.goals ?? [];

    // ── Industry (Memory → State fallback) ──────────────────────────────
    const industry = memIndustry?.slug ?? state?.industry ?? "auto";
    const industryInferred = memIndustry?.inferred ?? state?.industryLocked ?? false;
    const industryConfidence = memIndustry?.confidence ?? (industryInferred ? 0.9 : 1.0);

    // ── Profile (Memory → State fallback) ───────────────────────────────
    // ⚠️ Use || (not ??) so that 0 falls through to state.quote.
    // Memory profile may have 0 if written before async pricing completes.
    const peakLoadKW = memProfile?.peakLoadKW || state?.quote?.peakLoadKW || 0;
    const avgLoadKW = memProfile?.avgLoadKW || state?.quote?.baseLoadKW || 0;
    const energyKWhPerDay = memProfile?.energyKWhPerDay || state?.quote?.energyKWhPerDay || 0;
    const dutyCycle = memProfile?.dutyCycle ?? 0.5;
    const contributors = memProfile?.contributors ?? {};
    const profileAnswers = memProfile?.answers ?? state?.step3Answers ?? {};

    // ── Sizing (Memory → State fallback) ────────────────────────────────
    const bessKWh = memSizing?.bessKWh ?? state?.quote?.bessKWh ?? 0;
    const bessKW = memSizing?.bessKW ?? state?.quote?.bessKW ?? 0;
    const durationHours = memSizing?.durationHours ?? state?.quote?.durationHours ?? 4;

    // ── Add-ons (Memory → State fallback) ───────────────────────────────
    const addOns = memAddOns
      ? {
          includeSolar: memAddOns.includeSolar,
          solarKW: memAddOns.solarKW,
          includeGenerator: memAddOns.includeGenerator,
          generatorKW: memAddOns.generatorKW,
          generatorFuelType: memAddOns.generatorFuelType ?? "natural-gas",
          includeWind: memAddOns.includeWind,
          windKW: memAddOns.windKW,
        }
      : {
          includeSolar: state?.step4AddOns?.includeSolar ?? state?.includeSolar ?? false,
          solarKW: state?.step4AddOns?.solarKW ?? 0,
          includeGenerator: state?.step4AddOns?.includeGenerator ?? state?.includeGenerator ?? false,
          generatorKW: state?.step4AddOns?.generatorKW ?? 0,
          generatorFuelType: state?.step4AddOns?.generatorFuelType ?? "natural-gas",
          includeWind: state?.step4AddOns?.includeWind ?? state?.includeWind ?? false,
          windKW: state?.step4AddOns?.windKW ?? 0,
        };

    // ── Quote (Memory → State fallback) ─────────────────────────────────
    const quote = memQuote
      ? {
          capexUSD: memQuote.capexUSD ?? 0,
          annualSavingsUSD: memQuote.annualSavingsUSD ?? memQuote.annualSavings ?? 0,
          paybackYears: memQuote.paybackYears ?? 0,
          npv: memQuote.npv,
          irr: memQuote.irr,
          roiYears: memQuote.paybackYears,
          pricingComplete: true,
        }
      : extractQuoteFromState(state);

    // ── Meta ─────────────────────────────────────────────────────────────
    const filledSlots: string[] = [];
    if (memLocation) filledSlots.push("location");
    if (memGoals) filledSlots.push("goals");
    if (memIndustry) filledSlots.push("industry");
    if (memProfile) filledSlots.push("profile");
    if (memSizing) filledSlots.push("sizing");
    if (memAddOns) filledSlots.push("addOns");
    if (memQuote) filledSlots.push("quote");
    if (memWeather) filledSlots.push("weather");
    if (memSolar) filledSlots.push("solar");
    if (memFinancials) filledSlots.push("financials");
    if (memSession) filledSlots.push("session");

    // ── Weather (Memory only — no state fallback) ───────────────────────
    const weather = memWeather
      ? {
          profile: memWeather.profile ?? "",
          extremes: memWeather.extremes ?? "",
          avgTempF: memWeather.avgTempF,
          heatingDegreeDays: memWeather.heatingDegreeDays,
          coolingDegreeDays: memWeather.coolingDegreeDays,
        }
      : null;

    // ── Solar (Memory only — no state fallback) ─────────────────────────
    const solar = memSolar
      ? {
          peakSunHours: memSolar.peakSunHours ?? peakSunHours,
          capacityFactor: memSolar.capacityFactor ?? (memSolar.peakSunHours ? memSolar.peakSunHours / 24 : 0.17),
          grade: memSolar.grade ?? "B",
          annualProductionKWh: memSolar.annualProductionKWh,
          monthlyProductionKWh: memSolar.monthlyProductionKWh,
          annualIrradiance: memSolar.annualIrradiance,
        }
      : null;

    // ── Financials (Memory only — no state fallback) ────────────────────
    const financials = memFinancials
      ? {
          equipmentCost: memFinancials.equipmentCost,
          totalProjectCost: memFinancials.totalProjectCost,
          taxCredit: memFinancials.taxCredit,
          netCost: memFinancials.netCost,
          annualSavings: memFinancials.annualSavings,
          demandChargeSavings: memFinancials.demandChargeSavings,
          touArbitrageSavings: memFinancials.touArbitrageSavings,
          paybackYears: memFinancials.paybackYears,
          roi10Year: memFinancials.roi10Year,
          roi25Year: memFinancials.roi25Year,
          npv: memFinancials.npv,
          irr: memFinancials.irr,
          itcRate: memFinancials.itcRate,
          itcAmount: memFinancials.itcAmount,
          year10CapacityPct: memFinancials.year10CapacityPct,
          year25CapacityPct: memFinancials.year25CapacityPct,
          npvP10: memFinancials.npvP10,
          npvP90: memFinancials.npvP90,
          probabilityPositiveNPV: memFinancials.probabilityPositiveNPV,
        }
      : null;

    // ── Session (Memory only — computed fields) ─────────────────────────
    const session = memSession
      ? {
          startedAt: memSession.startedAt,
          totalStepsCompleted: memSession.totalStepsCompleted,
          quoteGenerations: memSession.quoteGenerations,
          addOnChanges: memSession.addOnChanges,
          lastActiveAt: memSession.lastActiveAt,
          durationSec: Math.round((memSession.lastActiveAt - memSession.startedAt) / 1000),
        }
      : null;

    return {
      location,
      utilityRate,
      demandCharge,
      peakSunHours,
      goals,
      industry,
      industryInferred,
      industryConfidence,
      peakLoadKW,
      avgLoadKW,
      energyKWhPerDay,
      dutyCycle,
      contributors,
      profileAnswers,
      bessKWh,
      bessKW,
      durationHours,
      addOns,
      quote,
      weather,
      solar,
      financials,
      session,
      isMemoryBacked: hasMemory,
      filledSlots,
      report: merlinMemory.lastReport,
      checksum: merlinMemory.checksum,
    };
  }, [memLocation, memGoals, memIndustry, memProfile, memSizing, memAddOns, memQuote, memWeather, memSolar, memFinancials, memSession, state]);
}

// ============================================================================
// PROQUOTE BRIDGE — Seed AdvancedQuoteBuilder from Memory
// ============================================================================

/**
 * Get initial values for ProQuote/AdvancedQuoteBuilder from Merlin Memory.
 * Call this when opening ProQuote to pre-fill fields from the wizard session.
 * 
 * Returns null if no Memory data exists (cold start).
 * 
 * @example
 * const seed = getProQuoteSeed();
 * if (seed) {
 *   setStorageSizeMW(seed.storageSizeMW);
 *   setDurationHours(seed.durationHours);
 *   setLocation(seed.location);
 *   // ... etc
 * }
 */
export function getProQuoteSeed(): {
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  generatorMW: number;
  generatorFuelType: string;
  windMW: number;
  location: string;
  zipCode: string;
  electricityRate: number;
  demandCharge: number;
  useCase: string;
  peakLoadKW: number;
} | null {
  const loc = merlinMemory.get("location");
  const profile = merlinMemory.get("profile");
  const sizing = merlinMemory.get("sizing");
  const industry = merlinMemory.get("industry");
  const addOns = merlinMemory.get("addOns");

  // Need at least location + some sizing data
  if (!loc && !sizing && !profile) return null;

  return {
    storageSizeMW: (sizing?.bessKW ?? 0) / 1000,
    durationHours: sizing?.durationHours ?? 4,
    solarMW: (addOns?.solarKW ?? sizing?.solarKW ?? 0) / 1000,
    generatorMW: (addOns?.generatorKW ?? sizing?.generatorKW ?? 0) / 1000,
    generatorFuelType: addOns?.generatorFuelType ?? "natural-gas",
    windMW: (addOns?.windKW ?? sizing?.windKW ?? 0) / 1000,
    location: loc?.state ?? "",
    zipCode: loc?.zip ?? "",
    electricityRate: loc?.utilityRate ?? 0.12,
    demandCharge: loc?.demandCharge ?? 15,
    useCase: industry?.slug ?? "commercial",
    peakLoadKW: profile?.peakLoadKW ?? 0,
  };
}
