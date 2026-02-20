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

    // Equipment Cost Breakdown (Feb 2026)
    equipmentCosts: quote.equipmentCosts
      ? {
          batteryCost: quote.equipmentCosts.batteryCost,
          batteryPerKWh: quote.equipmentCosts.batteryPerKWh,
          inverterCost: quote.equipmentCosts.inverterCost,
          inverterPerKW: quote.equipmentCosts.inverterPerKW,
          transformerCost: quote.equipmentCosts.transformerCost,
          switchgearCost: quote.equipmentCosts.switchgearCost,
          solarCost: quote.equipmentCosts.solarCost,
          solarPerWatt: quote.equipmentCosts.solarPerWatt,
          generatorCost: quote.equipmentCosts.generatorCost,
          generatorPerKW: quote.equipmentCosts.generatorPerKW,
          installationCost: quote.equipmentCosts.installationCost,
          totalEquipmentCost: quote.equipmentCosts.totalEquipmentCost,
          allInPerKW: quote.equipmentCosts.allInPerKW,
          allInPerKWh: quote.equipmentCosts.allInPerKWh,
        }
      : undefined,

    // ─── Advanced Analytics from SSOT metadata (Feb 2026) ─────────
    // Dynamic ITC breakdown (replaces hardcoded 30%)
    itcBreakdown: quote.metadata?.itcDetails
      ? {
          totalRate: quote.metadata.itcDetails.totalRate,
          creditAmount: quote.metadata.itcDetails.creditAmount,
          baseRate: quote.metadata.itcDetails.baseRate,
          prevailingWageBonus: quote.metadata.itcDetails.qualifications?.prevailingWage ? 0.24 : 0,
          energyCommunityBonus: quote.metadata.itcDetails.qualifications?.energyCommunity ? 0.10 : 0,
          domesticContentBonus: quote.metadata.itcDetails.qualifications?.domesticContent ? 0.10 : 0,
          lowIncomeBonus: quote.metadata.itcDetails.qualifications?.lowIncome ? 0.10 : 0,
          source: quote.metadata.itcDetails.source,
        }
      : undefined,

    // 8760 hourly simulation savings
    hourlySavingsBreakdown: quote.metadata?.advancedAnalysis?.hourlySimulation
      ? {
          annualSavings: quote.metadata.advancedAnalysis.hourlySimulation.annualSavings,
          touArbitrageSavings: quote.metadata.advancedAnalysis.hourlySimulation.touArbitrageSavings,
          peakShavingSavings: quote.metadata.advancedAnalysis.hourlySimulation.peakShavingSavings,
          demandChargeSavings: quote.metadata.advancedAnalysis.hourlySimulation.demandChargeSavings,
          solarSelfConsumptionSavings: quote.metadata.advancedAnalysis.hourlySimulation.solarSelfConsumptionSavings,
          equivalentCycles: quote.metadata.advancedAnalysis.hourlySimulation.equivalentCycles,
          capacityFactor: quote.metadata.advancedAnalysis.hourlySimulation.capacityFactor,
          source: quote.metadata.advancedAnalysis.hourlySimulation.source,
        }
      : undefined,

    // Risk analysis P10/P50/P90
    riskAnalysis: quote.metadata?.advancedAnalysis?.riskAnalysis
      ? {
          npvP10: quote.metadata.advancedAnalysis.riskAnalysis.npvP10,
          npvP50: quote.metadata.advancedAnalysis.riskAnalysis.npvP50,
          npvP90: quote.metadata.advancedAnalysis.riskAnalysis.npvP90,
          irrP10: quote.metadata.advancedAnalysis.riskAnalysis.irrP10,
          irrP50: quote.metadata.advancedAnalysis.riskAnalysis.irrP50,
          irrP90: quote.metadata.advancedAnalysis.riskAnalysis.irrP90,
          paybackP10: quote.metadata.advancedAnalysis.riskAnalysis.paybackP10,
          paybackP50: quote.metadata.advancedAnalysis.riskAnalysis.paybackP50,
          paybackP90: quote.metadata.advancedAnalysis.riskAnalysis.paybackP90,
          probabilityPositiveNPV: quote.metadata.advancedAnalysis.riskAnalysis.probabilityPositiveNPV,
          valueAtRisk95: quote.metadata.advancedAnalysis.riskAnalysis.valueAtRisk95,
          source: quote.metadata.advancedAnalysis.riskAnalysis.source,
        }
      : undefined,

    // Solar production from PVWatts
    solarProductionDetail: quote.metadata?.solarProduction
      ? {
          annualProductionKWh: quote.metadata.solarProduction.annualProductionKWh,
          capacityFactor: quote.metadata.solarProduction.capacityFactorPct,
          monthlyProductionKWh: quote.metadata.solarProduction.monthlyProductionKWh,
          source: quote.metadata.solarProduction.source,
        }
      : undefined,

    // Battery degradation curve
    degradationDetail: quote.metadata?.degradation
      ? {
          chemistry: quote.metadata.degradation.chemistry,
          year10CapacityPct: quote.metadata.degradation.year10CapacityPct,
          year25CapacityPct: quote.metadata.degradation.year25CapacityPct,
          warrantyYears: quote.metadata.degradation.warrantyPeriod,
          financialImpactPct: quote.metadata.degradation.financialImpactPct,
          source: quote.metadata.degradation.source,
        }
      : undefined,

    // Utility rate attribution
    utilityRateDetail: quote.metadata?.utilityRates
      ? {
          utilityName: quote.metadata.utilityRates.utilityName,
          electricityRate: quote.metadata.utilityRates.electricityRate,
          demandCharge: quote.metadata.utilityRates.demandCharge,
          source: quote.metadata.utilityRates.source,
          confidence: quote.metadata.utilityRates.confidence,
        }
      : undefined,

    showAiNote: false,
  };
}
