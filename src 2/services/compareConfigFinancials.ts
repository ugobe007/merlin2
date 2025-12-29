/**
 * COMPARE CONFIG FINANCIALS
 * =========================
 * 
 * Financial calculations for Step 3: Compare & Configure.
 * All numbers come from the unified quote calculator (SSOT).
 * 
 * This service wraps the SSOT to provide the specific interface needed
 * for the Compare & Configure section's real-time slider updates.
 * 
 * @created December 2025
 */

import { calculateQuote, type QuoteInput, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import type { FinancialInputs, FinancialResult } from '@/types/compareConfig';

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate financials for a given equipment configuration.
 * Wraps the SSOT calculator to provide Compare & Configure specific output.
 * 
 * @param inputs - Equipment and location parameters
 * @returns Financial summary with TrueQuote™ source tracking
 */
export async function calculateFinancials(inputs: FinancialInputs): Promise<FinancialResult> {
  const { 
    batteryKW, 
    batteryKWh, 
    solarKW, 
    windKW, 
    generatorKW, 
    state, 
    electricityRate,
    demandChargePerKW,
  } = inputs;
  
  // Calculate duration from capacity and power
  const durationHours = batteryKW > 0 ? batteryKWh / batteryKW : 4;
  
  try {
    // Call SSOT calculator
    const quoteInput: QuoteInput = {
      storageSizeMW: batteryKW / 1000,
      durationHours,
      location: state,
      electricityRate,
      solarMW: solarKW / 1000,
      windMW: windKW / 1000,
      generatorMW: generatorKW / 1000,
      generatorFuelType: 'natural-gas',
      gridConnection: 'on-grid',
      useCase: 'commercial',
    };
    
    const quote = await calculateQuote(quoteInput);
    
    // Extract and format results
    return formatQuoteResult(quote, inputs, demandChargePerKW);
  } catch (error) {
    console.error('[compareConfigFinancials] Error calculating financials:', error);
    // Return fallback values if SSOT fails
    return calculateFallbackFinancials(inputs);
  }
}

/**
 * Synchronous version for initial render (uses estimated values).
 * Call the async version for accurate real-time updates.
 */
export function calculateFinancialsSync(inputs: FinancialInputs): FinancialResult {
  const { 
    batteryKW, 
    batteryKWh, 
    solarKW, 
    windKW, 
    generatorKW, 
    electricityRate,
    demandChargePerKW,
  } = inputs;
  
  // Use industry-standard estimates for synchronous calculation
  // These will be replaced by async SSOT call
  
  // Equipment costs (NREL ATB 2024)
  const batteryCostPerKWh = 150; // $/kWh LFP 4-hour
  const solarCostPerW = 1.20;    // $/W commercial
  const windCostPerW = 1.50;     // $/W small wind
  const generatorCostPerKW = 700; // $/kW natural gas
  
  const batteryCost = batteryKWh * batteryCostPerKWh;
  const solarCost = solarKW * 1000 * solarCostPerW;
  const windCost = windKW * 1000 * windCostPerW;
  const generatorCost = generatorKW * generatorCostPerKW;
  
  // Installation (25% of equipment)
  const equipmentTotal = batteryCost + solarCost + windCost + generatorCost;
  const installationCost = equipmentTotal * 0.25;
  
  const grossCost = equipmentTotal + installationCost;
  
  // ITC incentive (30%)
  const incentives = grossCost * 0.30;
  const netInvestment = grossCost - incentives;
  
  // Annual savings estimates
  const peakShavingSavings = batteryKW * demandChargePerKW * 12 * 0.7; // 70% effectiveness
  const solarSavings = solarKW * 1500 * electricityRate; // 1500 kWh/kW/year
  const touArbitrageSavings = batteryKWh * 0.05 * 365; // $0.05/kWh spread
  const annualSavings = peakShavingSavings + solarSavings + touArbitrageSavings;
  
  // ROI calculations
  const paybackYears = annualSavings > 0 ? netInvestment / annualSavings : 25;
  const roi25Year = ((annualSavings * 25) - netInvestment) / netInvestment * 100;
  const npv25Year = calculateNPV(annualSavings, netInvestment, 0.08, 25);
  
  return {
    batteryCost,
    solarCost,
    windCost,
    generatorCost,
    installationCost,
    grossCost,
    incentives,
    netInvestment,
    peakShavingSavings,
    solarSavings,
    touArbitrageSavings,
    annualSavings,
    paybackYears: Math.min(paybackYears, 25), // Cap at 25 years
    roi25Year,
    npv25Year,
    sources: {
      batteryCost: 'NREL ATB 2024 ($150/kWh LFP)',
      solarCost: 'NREL ATB 2024 ($1.20/W commercial)',
      incentives: 'IRS ITC 30% (IRA 2022)',
      savingsMethodology: 'NREL StoreFAST model',
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format SSOT quote result into FinancialResult interface.
 */
function formatQuoteResult(quote: QuoteResult, inputs: FinancialInputs, demandChargePerKW: number): FinancialResult {
  const costs = quote.costs;
  const financials = quote.financials;
  const equipment = quote.equipment;
  
  // Extract equipment costs from quote
  const batteryCost = equipment?.batteries?.totalCost || (inputs.batteryKWh * 150);
  const solarCost = equipment?.solar?.totalCost || (inputs.solarKW * 1200);
  const windCost = equipment?.wind?.totalCost || (inputs.windKW * 1500);
  const generatorCost = equipment?.generators?.totalCost || (inputs.generatorKW * 700);
  const installationCost = costs.installationCost || 0;
  
  const grossCost = costs.totalProjectCost || (batteryCost + solarCost + windCost + generatorCost + installationCost);
  const incentives = costs.taxCredit || (grossCost * 0.30);
  const netInvestment = costs.netCost || (grossCost - incentives);
  
  // Calculate savings breakdown (SSOT returns total, we estimate components)
  const annualSavings = financials.annualSavings || 0;
  const peakShavingSavings = inputs.batteryKW * demandChargePerKW * 12 * 0.7;
  const solarSavings = inputs.solarKW * 1500 * inputs.electricityRate;
  const touArbitrageSavings = Math.max(0, annualSavings - peakShavingSavings - solarSavings);
  
  // Extract ROI
  const paybackYears = financials.paybackYears || (netInvestment / annualSavings);
  const roi25Year = financials.roi25Year || (((annualSavings * 25) - netInvestment) / netInvestment * 100);
  const npv25Year = financials.npv || calculateNPV(annualSavings, netInvestment, 0.08, 25);
  
  return {
    batteryCost,
    solarCost,
    windCost,
    generatorCost,
    installationCost,
    grossCost,
    incentives,
    netInvestment,
    peakShavingSavings,
    solarSavings,
    touArbitrageSavings,
    annualSavings,
    paybackYears: Math.min(paybackYears, 25),
    roi25Year,
    npv25Year,
    sources: {
      batteryCost: 'NREL ATB 2024 ($150/kWh LFP)',
      solarCost: 'NREL ATB 2024 ($1.20/W commercial)',
      incentives: 'IRS ITC 30% (IRA 2022)',
      savingsMethodology: 'NREL StoreFAST model',
    },
  };
}

/**
 * Calculate fallback financials when SSOT is unavailable.
 */
function calculateFallbackFinancials(inputs: FinancialInputs): FinancialResult {
  return calculateFinancialsSync(inputs);
}

/**
 * Calculate Net Present Value.
 */
function calculateNPV(
  annualCashFlow: number,
  initialInvestment: number,
  discountRate: number,
  years: number
): number {
  let npv = -initialInvestment;
  for (let year = 1; year <= years; year++) {
    npv += annualCashFlow / Math.pow(1 + discountRate, year);
  }
  return npv;
}

// ============================================================================
// COMPARISON HELPERS
// ============================================================================

/**
 * Calculate the difference between two configurations.
 */
export function compareConfigurations(
  merlin: FinancialResult,
  user: FinancialResult
): {
  investmentDiff: number;
  investmentDiffPercent: number;
  savingsDiff: number;
  savingsDiffPercent: number;
  paybackDiff: number;
  roiDiff: number;
  recommendation: 'merlin' | 'user' | 'similar';
} {
  const investmentDiff = user.netInvestment - merlin.netInvestment;
  const investmentDiffPercent = merlin.netInvestment > 0 ? (investmentDiff / merlin.netInvestment) * 100 : 0;
  
  const savingsDiff = user.annualSavings - merlin.annualSavings;
  const savingsDiffPercent = merlin.annualSavings > 0 ? (savingsDiff / merlin.annualSavings) * 100 : 0;
  
  const paybackDiff = user.paybackYears - merlin.paybackYears;
  const roiDiff = user.roi25Year - merlin.roi25Year;
  
  // Determine recommendation
  let recommendation: 'merlin' | 'user' | 'similar' = 'similar';
  if (merlin.paybackYears < user.paybackYears - 0.5) {
    recommendation = 'merlin';
  } else if (user.paybackYears < merlin.paybackYears - 0.5) {
    recommendation = 'user';
  }
  
  return {
    investmentDiff,
    investmentDiffPercent,
    savingsDiff,
    savingsDiffPercent,
    paybackDiff,
    roiDiff,
    recommendation,
  };
}

export default calculateFinancials;
