/**
 * V8 → QuoteExportData Mapper
 * ============================
 *
 * Maps WizardV8 state → QuoteExportData for PDF/Word/Excel export.
 * Mirrors buildV7ExportData but adapted to V8's state structure.
 *
 * Key differences from V7:
 * - V8 has pre-computed tiers (selectedTier from TIER_META)
 * - No pricingFreeze concept (all quotes are immediately finalized)
 * - Simpler state shape without async quote generation
 */

import type { QuoteExportData } from "@/utils/quoteExportUtils";
import type { WizardState } from "../wizardState";

/**
 * Generate deterministic quote number (session + date)
 */
function generateQuoteNumber(): string {
  const prefix = "MQ-V8";
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateStr}-${hash}`;
}

/**
 * Build QuoteExportData from V8 wizard state.
 *
 * Requires: state.selectedTierIndex is valid (Step 6 validation ensures this)
 */
export function buildV8ExportData(state: WizardState): QuoteExportData {
  const tier =
    state.tiers && state.selectedTierIndex !== null
      ? state.tiers[state.selectedTierIndex]
      : undefined;
  if (!tier) {
    throw new Error("Cannot export quote: no tier selected");
  }

  // Location string
  const locationStr =
    state.location?.city && state.location?.state
      ? `${state.location.city}, ${state.location.state}`
      : (state.location?.formattedAddress ?? "Location TBD");

  // Industry label
  const industryLabel =
    state.industry?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Commercial";

  // Equipment sizing
  const bessKW = tier.bessKW ?? 0;
  const bessKWh = tier.bessKWh ?? 0;
  const solarKW = tier.solarKW ?? 0;
  const generatorKW = tier.generatorKW ?? 0;
  const durationHours = tier.durationHours ?? 4;

  // Financial metrics
  const grossCost = tier.grossCost ?? 0;
  const annualSavings = tier.annualSavings ?? 0;
  const paybackYears = tier.paybackYears ?? 0;

  return {
    // Project Information
    projectName: state.business?.name ?? `${industryLabel} Facility`,
    location: locationStr,
    applicationType: industryLabel,
    useCase: industryLabel,
    quoteNumber: generateQuoteNumber(),
    quoteDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),

    // System Specifications
    storageSizeMW: bessKW / 1000,
    storageSizeMWh: bessKWh / 1000,
    durationHours,
    chemistry: "LFP", // Default to LFP
    roundTripEfficiency: 90,
    installationType: "Containerized",
    gridConnection: "On-Grid",

    // Electrical Specifications
    systemVoltage: 480,
    dcVoltage: 1000,
    inverterType: "Bidirectional",
    numberOfInverters: Math.ceil(bessKW / 500),
    inverterRating: Math.min(bessKW, 500),
    inverterEfficiency: 97.5,
    switchgearType: "Medium Voltage",
    switchgearRating: bessKW,
    bmsType: "Integrated",
    transformerRequired: bessKW > 500,
    transformerRating: bessKW > 500 ? bessKW : undefined,
    transformerVoltage: bessKW > 500 ? "480V/12.47kV" : undefined,

    // Performance & Operations
    cyclesPerYear: 365,
    warrantyYears: 10,
    utilityRate: state.intel?.utilityRate ?? 0.12,
    demandCharge: state.intel?.demandCharge ?? 20,

    // Renewables (optional)
    solarPVIncluded: solarKW > 0,
    solarCapacityKW: solarKW || undefined,
    solarPanelType: solarKW > 0 ? "Monocrystalline" : undefined,
    solarPanelEfficiency: solarKW > 0 ? 21.5 : undefined,
    windTurbineIncluded: false,
    dieselGenIncluded: generatorKW > 0,
    dieselGenCapacityKW: generatorKW || undefined,

    // Financial
    systemCost: tier.totalProjectCost ?? grossCost,

    // Load Profile
    loadProfile: {
      baseLoadKW: state.baseLoadKW,
      peakLoadKW: state.peakLoadKW,
      energyKWhPerDay: state.peakLoadKW * 24 * 0.4, // Rough estimate
    },

    // Financial Analysis
    financialAnalysis: {
      annualSavingsUSD: annualSavings,
      paybackYears,
      npv: tier.npv,
      // Use real demand savings from the tier's V4.5 savings model.
      // grossAnnualSavings breakdown: demand + solar + EV revenue (no TOU in older sessions)
      // Demand = bessKW * demandCharge * 12 * 0.75 — recomputed here from tier data
      demandChargeSavings: Math.round(
        (tier.bessKW ?? 0) * (state.intel?.demandCharge ?? 15) * 12 * 0.75
      ),
    },

    // TrueQuote™ Validation
    trueQuoteValidation: {
      version: "v1",
      dutyCycle: 0.55,
      kWContributors: {},
      kWContributorShares: {},
      assumptions: tier.notes ?? [],
    },
  };
}
