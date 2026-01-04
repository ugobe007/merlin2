/**
 * TRUEQUOTE VERIFY - INTEGRATION HOOK
 * ====================================
 * 
 * ⚠️ SSOT COMPLIANT - January 2026 Refactor
 * 
 * This hook generates TrueQuote worksheet data from wizard state
 * for the TrueQuote Verify Badge component.
 * 
 * CRITICAL: ALL calculations come from TrueQuoteEngine.ts
 * NO duplicate configs, NO local calculations
 */

import { useMemo } from "react";
import type {
  TrueQuoteWorksheetData,
  CalculationStep,
  DeviationReport,
  SourceCitation,
} from "@/components/wizard/v6/components/TrueQuoteVerifyBadge";

// ============================================================================
// SSOT IMPORTS - Use TrueQuoteEngine for ALL calculations
// ============================================================================
import { calculateTrueQuote } from "@/services/TrueQuoteEngine";
import { TRUEQUOTE_CONSTANTS } from "@/services/data/constants";
import { mapWizardStateToTrueQuoteInput } from "@/components/wizard/v6/utils/trueQuoteMapper";

// ============================================================================
// REMOVED: Local INDUSTRY_CONFIGS - This was an SSOT violation!
// All industry configs now come from TrueQuoteEngine.INDUSTRY_CONFIGS
// ============================================================================

// Source citations (these are static metadata, OK to keep here)
const SOURCES: SourceCitation[] = [
  {
    id: "nrel_atb",
    shortName: "NREL ATB 2024",
    fullName: "Annual Technology Baseline",
    organization: "National Renewable Energy Laboratory",
    year: 2024,
    url: "https://atb.nrel.gov/electricity/2024/",
    usedFor: ["BESS costs", "Solar costs", "Performance metrics"],
  },
  {
    id: "eia_rates",
    shortName: "EIA 2024",
    fullName: "State Electricity Profiles",
    organization: "U.S. Energy Information Administration",
    year: 2024,
    url: "https://www.eia.gov/electricity/state/",
    usedFor: ["Electricity rates", "Demand charges"],
  },
  {
    id: "uptime",
    shortName: "Uptime Institute",
    fullName: "Tier Standard: Topology",
    organization: "Uptime Institute",
    year: 2024,
    url: "https://uptimeinstitute.com/tiers",
    usedFor: ["Data center classification", "Uptime requirements"],
  },
  {
    id: "ashrae",
    shortName: "ASHRAE",
    fullName: "ASHRAE Handbook - HVAC Applications",
    organization: "ASHRAE",
    year: 2023,
    usedFor: ["Power benchmarks", "PUE standards"],
  },
  {
    id: "irs_itc",
    shortName: "IRS 48E",
    fullName: "Investment Tax Credit",
    organization: "Internal Revenue Service",
    year: 2022,
    usedFor: ["Federal ITC calculation (30%)"],
  },
  {
    id: "nrel_nsrdb",
    shortName: "NREL NSRDB",
    fullName: "National Solar Radiation Database",
    organization: "NREL",
    year: 2024,
    url: "https://nsrdb.nrel.gov/",
    usedFor: ["Peak sun hours", "Solar irradiance"],
  },
];

/**
 * Hook to generate TrueQuote worksheet data from wizard state
 * 
 * SSOT: Uses TrueQuoteEngine.calculate() for ALL calculations
 * This ensures the Verify modal shows the EXACT same values as the wizard
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTrueQuote(wizardState: any): TrueQuoteWorksheetData {
  return useMemo(() => {
    const deviations: DeviationReport[] = [];
    
    // ========================================
    // STEP 1: Call TrueQuoteEngine (SSOT)
    // ========================================
    let trueQuoteResult;
    let trueQuoteInput;
    
    try {
      trueQuoteInput = mapWizardStateToTrueQuoteInput(wizardState);
      trueQuoteResult = calculateTrueQuote(trueQuoteInput);
      
      console.log('✅ useTrueQuote: TrueQuoteEngine result:', {
        peakDemandKW: trueQuoteResult.results.peakDemandKW,
        bessKW: trueQuoteResult.results.bess.powerKW,
        bessKWh: trueQuoteResult.results.bess.energyKWh,
      });
    } catch (error) {
      console.error('❌ useTrueQuote: TrueQuoteEngine failed:', error);
      
      // Return empty worksheet if engine fails
      return {
        quoteId: wizardState.calculations?.quoteId || "ERROR",
        generatedAt: new Date().toISOString(),
        engineVersion: "2.0.0",
        inputs: {
          location: {
            zipCode: wizardState.zipCode || "",
            state: wizardState.state || "",
            utilityTerritory: "Unknown",
            electricityRate: 0.12,
            electricityRateSource: "Default",
            demandChargeRate: 15,
            demandChargeSource: "Default",
            sunHours: 5,
            sunHoursSource: "Default",
          },
          industry: {
            type: wizardState.industry || "unknown",
            typeName: wizardState.industryName || "Unknown",
            subtype: "default",
            subtypeName: "Default",
            facilityDetails: wizardState.useCaseData || {},
          },
        },
        calculationSteps: [],
        results: {
          peakDemandKW: 0,
          bessKW: 0,
          bessKWh: 0,
          totalInvestment: 0,
          federalITC: 0,
          netCost: 0,
          annualSavings: 0,
          paybackYears: 0,
        },
        deviations: [{
          field: "Calculation",
          displayed: 0,
          calculated: 0,
          deviationPercent: 100,
          severity: "critical",
          explanation: `TrueQuote Engine calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recommendation: "Please go back to Step 3 and enter facility details",
        }],
        sources: SOURCES,
      };
    }
    
    // ========================================
    // STEP 2: Extract calculation steps from TrueQuoteEngine result
    // The engine already provides detailed steps!
    // ========================================
    const steps: CalculationStep[] = trueQuoteResult.calculationSteps.map(step => ({
      stepNumber: step.stepNumber,
      category: step.category,
      name: step.name,
      description: step.description,
      formula: step.formula,
      calculation: step.calculation,
      inputs: step.inputs.map(input => ({
        name: input.name,
        value: input.value,
        unit: input.unit,
        source: input.source,
      })),
      output: step.output,
      benchmark: step.benchmark,
      notes: step.notes,
    }));
    
    // ========================================
    // STEP 3: Check for deviations between displayed and calculated
    // Compare what the user sees vs what TrueQuote calculated
    // ========================================
    
    // Check if wizard state has calculations (from Step 5)
    const displayedCalcs = wizardState.calculations;
    
    if (displayedCalcs) {
      // Check BESS deviation
      if (displayedCalcs.bessKW && trueQuoteResult.results.bess.powerKW > 0) {
        const bessDeviation = Math.abs(displayedCalcs.bessKW - trueQuoteResult.results.bess.powerKW) / trueQuoteResult.results.bess.powerKW * 100;
        
        // Only flag if deviation is significant (>15%)
        if (bessDeviation > TRUEQUOTE_CONSTANTS.DEVIATION_WARN_PERCENT) {
          deviations.push({
            field: "BESS Power",
            displayed: displayedCalcs.bessKW,
            calculated: trueQuoteResult.results.bess.powerKW,
            deviationPercent: Math.round(bessDeviation),
            severity: bessDeviation > TRUEQUOTE_CONSTANTS.DEVIATION_CRITICAL_PERCENT ? "critical" : "warning",
            explanation: "Displayed BESS power differs from calculated value",
            recommendation: "This may be due to power level multiplier selection",
          });
        }
      }
      
      // Check Generator deviation (only if required but not selected)
      const generatorRequired = trueQuoteResult.results.generator?.required;
      const generatorSelected = displayedCalcs.generatorKW > 0 || wizardState.selectedOptions?.includes('generator');
      
      if (generatorRequired && !generatorSelected) {
        deviations.push({
          field: "Generator",
          displayed: 0,
          calculated: trueQuoteResult.results.generator?.capacityKW || 0,
          deviationPercent: 100,
          severity: "critical",
          explanation: `This facility type requires backup generation but none was selected`,
          recommendation: `Add ${(trueQuoteResult.results.generator?.capacityKW || 0).toLocaleString()} kW backup generator for uptime compliance`,
        });
      }
    }
    
    // ========================================
    // STEP 4: Build the worksheet data structure
    // ========================================
    const result = trueQuoteResult.results;
    const inputs = trueQuoteResult.inputs;
    
    return {
      quoteId: trueQuoteResult.quoteId,
      generatedAt: trueQuoteResult.generatedAt,
      engineVersion: trueQuoteResult.engineVersion,
      
      inputs: {
        location: {
          zipCode: wizardState.zipCode || "", // Get from wizardState since LocationData doesn't have zipCode
          state: inputs.location.state,
          utilityTerritory: inputs.location.utilityName,
          electricityRate: inputs.location.electricityRate,
          electricityRateSource: "EIA 2024 / Utility Tariff",
          demandChargeRate: inputs.location.demandChargeRate,
          demandChargeSource: "Utility Tariff",
          sunHours: inputs.location.sunHours,
          sunHoursSource: "NREL NSRDB",
        },
        industry: {
          type: inputs.industry.type,
          typeName: inputs.industry.typeName,
          subtype: inputs.industry.subtype,
          subtypeName: inputs.industry.subtypeName,
          facilityDetails: inputs.industry.facilityData,
        },
      },
      
      calculationSteps: steps,
      
      results: {
        peakDemandKW: result.peakDemandKW,
        bessKW: result.bess.powerKW,
        bessKWh: result.bess.energyKWh,
        solarKWp: result.solar?.capacityKWp,
        generatorKW: result.generator?.capacityKW,
        evChargingKW: result.evCharging?.totalPowerKW,
        evChargers: result.evCharging 
          ? result.evCharging.level2Count + result.evCharging.dcFastCount + result.evCharging.ultraFastCount 
          : undefined,
        totalInvestment: result.financial.totalInvestment,
        federalITC: result.financial.federalITC,
        netCost: result.financial.netCost,
        annualSavings: result.financial.annualSavings,
        paybackYears: result.financial.paybackYears,
      },
      
      deviations,
      sources: trueQuoteResult.sources.length > 0 ? trueQuoteResult.sources : SOURCES,
    };
  }, [wizardState]);
}

export default useTrueQuote;
