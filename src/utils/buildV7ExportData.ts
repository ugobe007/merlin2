/**
 * V7 → QuoteExportData Mapper
 * ============================
 *
 * Maps WizardV7 state + QuoteOutput → QuoteExportData for PDF/Word/Excel export.
 * This is the SINGLE bridge between V7's data shape and the export templates.
 *
 * DOCTRINE:
 * - All field mapping logic lives HERE, not in Step4 or export utils
 * - Safe defaults for missing values (never throws on partial quotes)
 * - TrueQuote™ fields populated when available
 */

import type { QuoteExportData } from "@/utils/quoteExportUtils";
import type { WizardState as WizardV7State, QuoteOutput } from "@/wizard/v7/hooks/useWizardV7";
import { getIndustryLabel } from "@/wizard/v7/industryMeta";

/**
 * Generate a deterministic quote number from session + timestamp
 */
function generateQuoteNumber(sessionId: string): string {
  const prefix = "MQ";
  const hash = sessionId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${prefix}-${dateStr}-${hash}`;
}

/**
 * Build QuoteExportData from V7 wizard state.
 *
 * Safe for partial quotes (Layer A only, no pricing, etc.)
 */
export function buildV7ExportData(state: WizardV7State): QuoteExportData {
  const quote: QuoteOutput = state.quote ?? {};
  const freeze = state.pricingFreeze;
  const industryLabel = getIndustryLabel(state.industry ?? "other");

  // Location string
  const locationParts = [
    state.location?.city,
    state.location?.state,
    state.location?.postalCode,
  ].filter(Boolean);
  const locationStr = locationParts.length
    ? locationParts.join(", ")
    : (state.location?.formattedAddress ?? "Location TBD");

  // Sizing: prefer equipment breakdown, then freeze, then load profile
  const bessKW = quote.bessKW ?? (freeze?.powerMW ? freeze.powerMW * 1000 : quote.peakLoadKW) ?? 0;
  const bessKWh = quote.bessKWh ?? (freeze?.mwh ? freeze.mwh * 1000 : 0);
  const durationHours = quote.durationHours ?? freeze?.hours ?? 4;
  const storageMW = bessKW / 1000;
  const storageMWh = bessKWh > 0 ? bessKWh / 1000 : storageMW * durationHours;

  const quoteNumber = generateQuoteNumber(state.sessionId);

  return {
    // ─── Project Information ──────────────────────────────────────
    projectName: `${industryLabel} — BESS System`,
    location: locationStr,
    applicationType: "Commercial",
    useCase: industryLabel,
    quoteNumber,
    quoteDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),

    // ─── System Specifications ────────────────────────────────────
    storageSizeMW: storageMW,
    storageSizeMWh: storageMWh,
    durationHours,
    chemistry: "LiFePO4",
    roundTripEfficiency: 85,
    installationType: "Ground Mount",
    gridConnection: freeze?.gridMode ?? "Grid-Tied",

    // ─── Electrical Specifications ────────────────────────────────
    systemVoltage: 480,
    dcVoltage: 800,
    inverterType: "PCS",
    numberOfInverters: Math.max(1, Math.ceil(bessKW / 500)),
    inverterRating: bessKW,
    inverterEfficiency: 96,
    switchgearType: "AC Switchgear",
    switchgearRating: bessKW * 1.25,
    bmsType: "Distributed",
    transformerRequired: true,
    transformerRating: bessKW,
    transformerVoltage: "480V/13.8kV",

    // ─── Performance & Operations ─────────────────────────────────
    cyclesPerYear: 365,
    warrantyYears: 15,
    utilityRate: state.locationIntel?.utilityRate ?? 0.12,
    demandCharge: state.locationIntel?.demandCharge ?? 15,

    // ─── Renewables ───────────────────────────────────────────────
    solarPVIncluded: (quote.solarKW ?? 0) > 0,
    solarCapacityKW: quote.solarKW ?? 0,
    solarPanelType: "Monocrystalline",
    solarPanelEfficiency: 21,
    windTurbineIncluded: false,

    // ─── Financial ────────────────────────────────────────────────
    systemCost: quote.grossCost ?? quote.capexUSD ?? 0,

    // ─── V7 TrueQuote™ Extensions ─────────────────────────────────

    // Load Profile (Layer A)
    loadProfile:
      quote.peakLoadKW != null
        ? {
            baseLoadKW: quote.baseLoadKW ?? 0,
            peakLoadKW: quote.peakLoadKW ?? 0,
            energyKWhPerDay: quote.energyKWhPerDay ?? 0,
          }
        : undefined,

    // Financial Analysis (Layer B)
    financialAnalysis:
      quote.pricingComplete && quote.annualSavingsUSD != null
        ? {
            annualSavingsUSD: quote.annualSavingsUSD,
            paybackYears: quote.roiYears ?? 0,
            npv: quote.npv ?? undefined,
            irr: quote.irr ?? undefined,
            demandChargeSavings: quote.demandChargeSavings ?? undefined,
          }
        : undefined,

    // TrueQuote™ Confidence
    trueQuoteConfidence: quote.confidence
      ? {
          overall: quote.confidence.overall,
          location: quote.confidence.location,
          industry: quote.confidence.industry,
          profileCompleteness: quote.confidence.profileCompleteness,
          userInputs: quote.confidence.userInputs,
          defaultsUsed: quote.confidence.defaultsUsed,
        }
      : undefined,

    // TrueQuote™ Validation (kW contributors)
    trueQuoteValidation: quote.trueQuoteValidation
      ? {
          version: quote.trueQuoteValidation.version,
          dutyCycle: quote.trueQuoteValidation.dutyCycle,
          kWContributors: quote.trueQuoteValidation.kWContributors,
          kWContributorShares: quote.trueQuoteValidation.kWContributorShares,
          assumptions: quote.trueQuoteValidation.assumptions,
        }
      : undefined,

    // Pricing Snapshot ID
    pricingSnapshotId: quote.pricingSnapshotId ?? undefined,

    showAiNote: false,
  };
}
