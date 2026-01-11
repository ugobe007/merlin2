/**
 * TRUEQUOTE ENGINE V2
 * The Prime Sub Contractor - Calculation SSOT
 *
 * RESPONSIBILITIES:
 * 1. Receive MerlinRequest from orchestrator
 * 2. Run all calculators (load, BESS, solar, generator, EV, financials)
 * 3. Delegate to Magic Fit for 3 optimized options
 * 4. Authenticate Magic Fit's proposal
 * 5. Return TrueQuoteAuthenticatedResult
 *
 * ARCHITECTURE:
 * - This is a SLIM orchestrator (~200 lines)
 * - All calculations delegated to dedicated calculator modules
 * - All constants from database via calculationConstantsService
 * - Magic Fit is a sub-contractor that must get approval
 *
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 * Version: 2.0.0
 */

import type {
  MerlinRequest,
  TrueQuoteBaseCalculation,
  TrueQuoteAuthenticatedResult,
  TrueQuoteRejection,
} from "./contracts";
import { generateQuoteId, generateVerificationHash } from "./contracts";

// Calculators
import { calculateLoad } from "./calculators/loadCalculator";
import { calculateBESS } from "./calculators/bessCalculator";
import { calculateSolar, getSolarRating } from "./calculators/solarCalculator";
import { calculateGenerator, isHighRiskWeatherState } from "./calculators/generatorCalculator";
import { calculateEV } from "./calculators/evCalculator";
import { calculateFinancials } from "./calculators/financialCalculator";

// Magic Fit
import { generateMagicFitProposal, type UserPreferences } from "./MagicFit";

// Validator
import { authenticateProposal } from "./validators/proposalValidator";

// Constants
import { STATE_SUN_HOURS } from "./data/constants";

// Version
const ENGINE_VERSION = "2.0.0";

/**
 * Process a quote request from Merlin (the orchestrator)
 *
 * This is the main entry point for the new architecture.
 */
export async function processQuote(
  request: MerlinRequest
): Promise<TrueQuoteAuthenticatedResult | TrueQuoteRejection> {
  console.log("═══════════════════════════════════════════════════════");
  console.log("🔷 TrueQuote v2: Processing quote request");
  console.log("═══════════════════════════════════════════════════════");
  console.log("📍 Location:", request.location.state, request.location.zipCode);
  console.log("🏭 Industry:", request.facility.industry);
  console.log("🎯 Goals:", request.goals);

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Calculate Load
  // ─────────────────────────────────────────────────────────────
  const loadResult = calculateLoad({
    industry: request.facility.industry,
    useCaseData: request.facility.useCaseData,
  });
  console.log("⚡ Load:", loadResult.peakDemandKW, "kW peak");

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Calculate BESS
  // ─────────────────────────────────────────────────────────────
  const bessResult = calculateBESS({
    peakDemandKW: loadResult.peakDemandKW,
    annualConsumptionKWh: loadResult.annualConsumptionKWh,
    industry: request.facility.industry,
    useCaseData: request.facility.useCaseData,
    goals: request.goals,
  });
  console.log("🔋 BESS:", bessResult.powerKW, "kW /", bessResult.energyKWh, "kWh");

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Calculate Solar
  // ─────────────────────────────────────────────────────────────
  const sunHours = STATE_SUN_HOURS[request.location.state] || 5.0;
  const solarResult = calculateSolar({
    peakDemandKW: loadResult.peakDemandKW,
    annualConsumptionKWh: loadResult.annualConsumptionKWh,
    industry: request.facility.industry,
    useCaseData: request.facility.useCaseData,
    state: request.location.state,
    sunHoursPerDay: sunHours,
    userInterested: request.preferences.solar.interested,
    customSizeKw: request.preferences.solar.customSizeKw,
  });
  console.log(
    "☀️ Solar:",
    solarResult.capacityKW,
    "kW",
    solarResult.recommended ? "(recommended)" : ""
  );
  if (solarResult.isRoofConstrained) {
    console.log("⚠️ Solar ROOF CONSTRAINED:", {
      ideal: solarResult.idealCapacityKW + " kW",
      maxRoof: solarResult.maxRoofCapacityKW + " kW",
      gap: solarResult.solarGapKW + " kW (consider carport)",
    });
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Calculate Generator
  // ─────────────────────────────────────────────────────────────
  const generatorResult = calculateGenerator({
    peakDemandKW: loadResult.peakDemandKW,
    bessKW: bessResult.powerKW,
    industry: request.facility.industry,
    state: request.location.state,
    useCaseData: request.facility.useCaseData,
    userInterested: request.preferences.generator.interested,
    customSizeKw: request.preferences.generator.customSizeKw,
    fuelType: request.preferences.generator.fuelType,
  });
  console.log(
    "⛽ Generator:",
    generatorResult.capacityKW,
    "kW",
    generatorResult.recommended ? "(recommended)" : ""
  );

  // ─────────────────────────────────────────────────────────────
  // STEP 5: Calculate EV Charging
  // ─────────────────────────────────────────────────────────────
  const evResult = calculateEV({
    industry: request.facility.industry,
    useCaseData: request.facility.useCaseData,
    userInterested: request.preferences.ev.interested,
    l2Count: request.preferences.ev.l2Count,
    dcfcCount: request.preferences.ev.dcfcCount,
    ultraFastCount: request.preferences.ev.ultraFastCount,
  });
  console.log("🔌 EV:", evResult.totalChargers, "chargers /", evResult.totalPowerKW, "kW");

  // ─────────────────────────────────────────────────────────────
  // STEP 6: Calculate Financials
  // ─────────────────────────────────────────────────────────────
  const financialResult = calculateFinancials({
    bessCost: bessResult.estimatedCost,
    solarCost: solarResult.estimatedCost,
    generatorCost: generatorResult.estimatedCost,
    evCost: evResult.estimatedCost,
    bessKW: bessResult.powerKW,
    bessKWh: bessResult.energyKWh,
    solarKW: solarResult.capacityKW,
    solarAnnualKWh: solarResult.annualProductionKWh,
    generatorKW: generatorResult.capacityKW,
    electricityRate: 0.12, // TODO: Get from utility service
    demandCharge: 15, // TODO: Get from utility service
    state: request.location.state,
  });
  console.log(
    "💰 Financials: $" + financialResult.netCost.toLocaleString(),
    "net cost,",
    financialResult.simplePaybackYears,
    "yr payback"
  );

  // ─────────────────────────────────────────────────────────────
  // STEP 7: Build Base Calculation
  // ─────────────────────────────────────────────────────────────
  const baseCalculation: TrueQuoteBaseCalculation = {
    load: {
      peakDemandKW: loadResult.peakDemandKW,
      annualConsumptionKWh: loadResult.annualConsumptionKWh,
      averageDailyKWh: loadResult.averageDailyKWh,
      loadProfile: loadResult.loadProfile,
    },
    bess: {
      powerKW: bessResult.powerKW,
      energyKWh: bessResult.energyKWh,
      durationHours: bessResult.durationHours,
      chemistry: bessResult.chemistry,
      efficiency: bessResult.efficiency,
      warrantyYears: bessResult.warrantyYears,
      estimatedCost: bessResult.estimatedCost,
      costPerKwh: bessResult.costPerKwh,
    },
    solar: {
      recommended: solarResult.recommended,
      capacityKW: solarResult.capacityKW,
      type: solarResult.type,
      annualProductionKWh: solarResult.annualProductionKWh,
      capacityFactor: solarResult.capacityFactor,
      estimatedCost: solarResult.estimatedCost,
      costPerWatt: solarResult.costPerWatt,
      roofAreaSqFt: solarResult.roofAreaSqFt,
      // NEW: Roof constraint fields (Jan 6, 2026)
      idealCapacityKW: solarResult.idealCapacityKW,
      maxRoofCapacityKW: solarResult.maxRoofCapacityKW,
      solarGapKW: solarResult.solarGapKW,
      isRoofConstrained: solarResult.isRoofConstrained,
    },
    generator: {
      recommended: generatorResult.recommended,
      reason: generatorResult.reason,
      capacityKW: generatorResult.capacityKW,
      fuelType: generatorResult.fuelType,
      runtimeHours: generatorResult.runtimeHours,
      estimatedCost: generatorResult.estimatedCost,
    },
    ev: {
      recommended: evResult.recommended,
      l2Count: evResult.l2.count,
      l2PowerKW: evResult.l2.powerKW,
      dcfcCount: evResult.dcfc.count,
      dcfcPowerKW: evResult.dcfc.powerKW,
      ultraFastCount: evResult.ultraFast.count,
      ultraFastPowerKW: evResult.ultraFast.powerKW,
      totalPowerKW: evResult.totalPowerKW,
      estimatedCost: evResult.estimatedCost,
    },
    utility: {
      name: "Unknown", // TODO: Get from utility service
      rate: 0.12,
      demandCharge: 15,
      hasTOU: false,
    },
    location: {
      sunHoursPerDay: sunHours,
      solarRating: getSolarRating(sunHours),
      climateZone: request.location.state,
      isHighRiskWeather: isHighRiskWeatherState(request.location.state),
      weatherRiskReason: isHighRiskWeatherState(request.location.state)
        ? "Hurricane/severe storm zone"
        : undefined,
    },
    financials: {
      totalEquipmentCost: financialResult.totalEquipmentCost,
      installationCost: financialResult.installationCost,
      totalInvestment: financialResult.totalInvestment,
      federalITC: financialResult.federalITC,
      federalITCRate: financialResult.federalITCRate,
      estimatedStateIncentives: financialResult.estimatedStateIncentives,
      netCost: financialResult.netCost,
      annualSavings: financialResult.annualSavings,
      simplePaybackYears: financialResult.simplePaybackYears,
      fiveYearROI: financialResult.fiveYearROI,
      twentyFiveYearNPV: financialResult.twentyFiveYearNPV,
    },
  };

  // ─────────────────────────────────────────────────────────────
  // STEP 8: Delegate to Magic Fit
  // ─────────────────────────────────────────────────────────────
  console.log("");
  console.log("🪄 Delegating to Magic Fit...");

  // Build user preferences from request
  const userPreferences: UserPreferences = {
    solar: {
      interested: request.preferences.solar.interested,
      customSizeKw: request.preferences.solar.customSizeKw,
    },
    generator: {
      interested: request.preferences.generator.interested,
      customSizeKw: request.preferences.generator.customSizeKw,
      fuelType: request.preferences.generator.fuelType,
    },
    ev: {
      interested: request.preferences.ev.interested,
    },
    hasNaturalGasLine: request.facility.useCaseData?.hasNaturalGasLine || false,
  };

  console.log("🪄 User preferences:", {
    solar: userPreferences.solar.interested,
    generator: userPreferences.generator.interested,
    ev: userPreferences.ev.interested,
    hasNaturalGasLine: userPreferences.hasNaturalGasLine,
  });

  const magicFitProposal = generateMagicFitProposal(
    baseCalculation,
    request.goals,
    userPreferences
  );

  // ─────────────────────────────────────────────────────────────
  // STEP 9: Authenticate Magic Fit's Proposal
  // ─────────────────────────────────────────────────────────────
  console.log("");
  console.log("🔐 Authenticating proposal...");
  const authResult = authenticateProposal(baseCalculation, magicFitProposal);

  if ("rejected" in authResult && authResult.rejected) {
    console.error("❌ TrueQuote: Proposal REJECTED");
    return authResult as TrueQuoteRejection;
  }

  // Type guard passed - authResult is AuthenticationResult
  const authenticatedOptions = (
    authResult as {
      authenticated: true;
      options: typeof authResult extends { options: infer O } ? O : never;
    }
  ).options;

  // ─────────────────────────────────────────────────────────────
  // STEP 10: Build Authenticated Result
  // ─────────────────────────────────────────────────────────────
  const quoteId = generateQuoteId();

  const result: TrueQuoteAuthenticatedResult = {
    verification: {
      verified: true,
      verifiedAt: new Date().toISOString(),
      verificationHash: generateVerificationHash(magicFitProposal),
      trueQuoteVersion: ENGINE_VERSION,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    quoteId,
    requestId: request.requestId,
    baseCalculation,
    options: authenticatedOptions,
    incentives: {
      federal: {
        itcAmount: financialResult.federalITC,
        itcRate: financialResult.federalITCRate,
        itcEligibleCost: financialResult.itcEligibleCost,
      },
      state: {
        totalAmount: financialResult.estimatedStateIncentives,
        programs: [],
      },
      utility: {
        totalAmount: 0,
        programs: [],
      },
      totalIncentives: financialResult.federalITC + financialResult.estimatedStateIncentives,
    },
    facility: {
      industry: request.facility.industry,
      industryName: request.facility.industryName,
      location: `${request.location.city || ""} ${request.location.state}`.trim(),
      peakDemandKW: loadResult.peakDemandKW,
      annualConsumptionKWh: loadResult.annualConsumptionKWh,
    },
    warnings: [],
    notes: [
      `Quote generated by TrueQuote Engine v${ENGINE_VERSION}`,
      `Magic Fit optimized for: ${request.goals.join(", ")}`,
    ],
  };

  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ TrueQuote v2: Quote authenticated!");
  console.log("📋 Quote ID:", quoteId);
  console.log("═══════════════════════════════════════════════════════");

  return result;
}

/**
 * Quick validation that engine is working
 */
export function getEngineInfo(): { version: string; status: string } {
  return {
    version: ENGINE_VERSION,
    status: "operational",
  };
}
