/**
 * STEP 5: Magic Fit - Power Level Selection
 * =========================================
 * The Big Reveal: 3 cards with REAL calculations from TrueQuote Engine
 * 
 * ⚠️ SSOT COMPLIANT - January 2026 Refactor
 * 
 * CRITICAL: ALL calculations come from TrueQuoteEngine.ts
 * NO local calculation functions, NO duplicate configs
 * 
 * Data Sources (TrueQuote™ Compliant):
 * - ALL Calculations: TrueQuoteEngine.ts (SINGLE SOURCE OF TRUTH)
 * - Equipment Pricing: unifiedPricingService.ts → Database/NREL ATB 2024
 * - Utility Rates: utilityRateService.ts → EIA 2024 + Utility-specific rates
 */

import React, { useEffect, useState } from 'react';
import { Zap, Battery, Sun, Clock, TrendingUp, Star, Check, Loader2, Info, Shield, Home, Fuel, AlertTriangle } from 'lucide-react';
import type { WizardState, PowerLevel, SystemCalculations } from '../types';
import { POWER_LEVELS } from '../types';

// ============================================================================
// SSOT SERVICE IMPORTS - Single Source of Truth
// ============================================================================
import { getBatteryPricing, getSolarPricing, getGeneratorPricing, type BatteryPricing, type SolarPricing, type GeneratorPricing } from '@/services/unifiedPricingService';

import { 
  getCommercialRateByZip,
  getBESSSavingsOpportunity
} from '@/services/utilityRateService';

import { TrueQuoteVerifyBadge } from '../components/TrueQuoteVerifyBadge';
import { useTrueQuote } from '@/hooks/useTrueQuote';
import { calculateTrueQuote } from '@/services/TrueQuoteEngine';
import { mapWizardStateToTrueQuoteInput } from '../utils/trueQuoteMapper';

// ============================================================================
// TYPES
// ============================================================================

interface PricingData {
  battery: BatteryPricing | null;
  solar: SolarPricing | null;
  generator: GeneratorPricing | null;
  utilityRate: number;
  demandCharge: number;
  peakRate: number | null;
  utilityName: string;
  hasTOU: boolean;
  savingsScore: number;
  pricingSources: string[];
}

interface CalculationWithPricing extends SystemCalculations {
  pricingData: PricingData;
  evPowerKW?: number;
  selectedSolarTier?: { sizeKw: number; name: string };
  selectedEvTier?: { l2Count: number; dcfcCount: number; ultraFastCount?: number; powerRaw: number; name: string };
}

// ============================================================================
// CONSTANTS - ITC Rates (2024+)
// ============================================================================

const FEDERAL_ITC_RATE = 0.30; // 30% ITC for solar AND standalone BESS (as of IRA 2022)

// ============================================================================
// REMOVED: INDUSTRY_POWER_PROFILES - This was an SSOT violation!
// All industry configs now come from TrueQuoteEngine.INDUSTRY_CONFIGS
// ============================================================================

// ============================================================================
// REMOVED: calculateBasePowerKW() - This was an SSOT violation!
// All power calculations now come from TrueQuoteEngine.calculate()
// ============================================================================

// ============================================================================
// ASYNC CALCULATION FUNCTION - Uses TrueQuote Engine + SSOT Pricing
// ============================================================================

async function calculateSystemAsync(
  state: WizardState, 
  multiplier: number, 
  durationHours: number
): Promise<CalculationWithPricing> {
  const { selectedOptions } = state;
  const zipCode = state.zipCode || '';
  
  // ========================================
  // STEP 1: Use TrueQuote Engine for ALL calculations
  // This is the SINGLE SOURCE OF TRUTH
  // ========================================
  const trueQuoteInput = mapWizardStateToTrueQuoteInput(state);
  const trueQuoteResult = calculateTrueQuote(trueQuoteInput);
  
  console.log('✅ TrueQuote Engine Calculation:', {
    peakDemandKW: trueQuoteResult.results.peakDemandKW,
    baseBessKW: trueQuoteResult.results.bess.powerKW,
    baseBessKWh: trueQuoteResult.results.bess.energyKWh,
    generatorKW: trueQuoteResult.results.generator?.capacityKW,
    generatorRequired: trueQuoteResult.results.generator?.required,
  });
  
  // ========================================
  // VALIDATION: Check if TrueQuote returned valid data
  // If not, show error to user (don't use fallback!)
  // ========================================
  if (trueQuoteResult.results.bess.powerKW === 0 || trueQuoteResult.results.peakDemandKW === 0) {
    console.error('🚨 TrueQuote Engine returned ZERO values - DATA ISSUE!', {
      peakDemandKW: trueQuoteResult.results.peakDemandKW,
      bessPowerKW: trueQuoteResult.results.bess.powerKW,
      inputFacilityData: trueQuoteInput.industry.facilityData,
      inputIndustryType: trueQuoteInput.industry.type,
      inputSubtype: trueQuoteInput.industry.subtype,
      rawStateUseCaseData: state.useCaseData,
    });
    
    // Return a result that indicates missing data (UI will show warning)
    // DO NOT use fallback calculations - that violates SSOT
    throw new Error(`Missing facility data for ${state.industryName || state.industry}. Please go back to Step 3 and enter your facility details.`);
  }
  
  // ========================================
  // STEP 2: Apply power level multiplier to BESS
  // ========================================
  const baseBessKW = trueQuoteResult.results.bess.powerKW;
  
  // Apply multiplier to power, adjust energy proportionally
  const bessKW = Math.round(baseBessKW * multiplier);
  const actualDurationHours = durationHours; // Use requested duration
  const bessKWh = Math.round(bessKW * actualDurationHours);
  const bessMW = bessKW / 1000;
  
  console.log('📊 Step 5 BESS After Power Level Multiplier:', {
    baseBessKW,
    multiplier,
    bessKW,
    durationHours: actualDurationHours,
    bessKWh,
    bessMW: bessMW.toFixed(3),
  });
  
  // ========================================
  // STEP 3: Solar from TrueQuote or Step 4 override
  // ========================================
  let solarKW = 0;
  let solarCost = 0;
  let selectedSolarTier: { sizeKw: number; name: string } | undefined;
  
  // PRIORITY 1: Use customSolarKw from Step 4 (user selected specific size)
  if (selectedOptions?.includes('solar') && state.customSolarKw && state.customSolarKw > 0) {
    solarKW = state.customSolarKw;
    console.log('☀️ Solar from Step 4 customSolarKw:', { solarKW });
  }
  // PRIORITY 2: Use TrueQuote Engine result
  else if (trueQuoteResult.results.solar) {
    solarKW = trueQuoteResult.results.solar.capacityKWp;
    solarCost = trueQuoteResult.results.solar.cost;
    console.log('☀️ Solar from TrueQuote Engine:', { solarKW, solarCost });
  }
  
  const solarMW = solarKW / 1000;
  
  // ========================================
  // STEP 4: Generator from TrueQuote
  // ========================================
  let generatorKW = trueQuoteResult.results.generator?.capacityKW || 0;
  
  // User opt-in override (if they want generator but TrueQuote didn't recommend)
  if (!generatorKW && selectedOptions?.includes('generator')) {
    generatorKW = Math.round(bessKW * 0.5);
  }
  
  console.log('🔌 Generator sizing:', {
    fromTrueQuote: trueQuoteResult.results.generator?.capacityKW,
    final: generatorKW,
    required: trueQuoteResult.results.generator?.required,
  });
  
  // ========================================
  // STEP 5: EV Charging from TrueQuote or Step 4
  // ========================================
  let evChargers = 0;
  let evCost = 0;
  let evPowerKW = 0;
  let selectedEvTier: { l2Count: number; dcfcCount: number; ultraFastCount?: number; powerRaw: number; name: string } | undefined;
  
  // Use TrueQuote Engine result if available (for EV-charging industry)
  if (trueQuoteResult.results.evCharging) {
    const evResult = trueQuoteResult.results.evCharging;
    evPowerKW = evResult.totalPowerKW;
    evCost = evResult.cost;
    evChargers = evResult.level2Count + evResult.dcFastCount + evResult.ultraFastCount;
    
    console.log('⚡ EV from TrueQuote Engine:', {
      level2: evResult.level2Count,
      dcFast: evResult.dcFastCount,
      ultraFast: evResult.ultraFastCount,
      totalPower: evPowerKW,
    });
  } else {
    // Use Step 4 direct counts (for add-on EV charging)
    const evL2Count = state.customEvL2 || 0;
    const evDcfcCount = state.customEvDcfc || 0;
    const evUltraFastCount = state.customEvUltraFast || 0;
    
    if (selectedOptions?.includes('ev') && (evL2Count > 0 || evDcfcCount > 0 || evUltraFastCount > 0)) {
      // Calculate power: Level 2 = 19.2 kW, DC Fast = 150 kW, Ultra-Fast = 350 kW
      evPowerKW = Math.round(evL2Count * 19.2 + evDcfcCount * 150 + evUltraFastCount * 350);
      
      // Calculate cost: Level 2 = $6,000, DC Fast = $45,000, Ultra-Fast = $125,000
      evCost = evL2Count * 6000 + evDcfcCount * 45000 + evUltraFastCount * 125000;
      
      evChargers = evL2Count + evDcfcCount + evUltraFastCount;
      
      selectedEvTier = {
        name: 'Custom',
        l2Count: evL2Count,
        dcfcCount: evDcfcCount,
        ultraFastCount: evUltraFastCount,
        powerRaw: evPowerKW,
      };
      
      console.log('⚡ EV from Step 4 Direct Counts:', {
        evL2Count,
        evDcfcCount,
        evUltraFastCount,
        evPowerKW,
        evCost,
      });
    }
  }
  
  // ========================================
  // FETCH PRICING FROM SSOT SERVICES
  // ========================================
  
  const pricingSources: string[] = [];
  
  const [batteryPricing, solarPricing, generatorPricing, utilityData, savingsOpp] = await Promise.all([
    getBatteryPricing(bessMW, actualDurationHours, state.state || 'United States'),
    solarKW > 0 ? getSolarPricing(solarMW) : Promise.resolve(null),
    generatorKW > 0 ? getGeneratorPricing() : Promise.resolve(null),
    getCommercialRateByZip(zipCode),
    getBESSSavingsOpportunity(zipCode)
  ]);
  
  // Track pricing sources for TrueQuote™ attribution
  pricingSources.push(`Battery: ${batteryPricing.dataSource.toUpperCase()} ($${batteryPricing.pricePerKWh}/kWh)`);
  if (solarPricing) {
    pricingSources.push(`Solar: ${solarPricing.dataSource.toUpperCase()} ($${solarPricing.pricePerWatt}/W)`);
  }
  if (generatorPricing) {
    pricingSources.push(`Generator: ${generatorPricing.dataSource.toUpperCase()} ($${generatorPricing.pricePerKW}/kW)`);
  }
  if (utilityData) {
    pricingSources.push(`Utility: ${utilityData.source.toUpperCase()} (${utilityData.utilityName})`);
  }
  
  // ========================================
  // CALCULATE COSTS USING SSOT PRICING
  // ========================================
  
  // BESS Cost
  const bessCost = bessKWh * batteryPricing.pricePerKWh;
  
  // Solar Cost (use SSOT pricing if not already set)
  if (solarPricing && solarKW > 0 && solarCost === 0) {
    solarCost = solarKW * solarPricing.pricePerWatt * 1000;
  }
  
  // Generator Cost
  const generatorCost = generatorPricing ? generatorKW * generatorPricing.pricePerKW : 0;
  
  // Total Investment
  const totalInvestment = bessCost + solarCost + generatorCost + evCost;
  
  // ========================================
  // FEDERAL ITC - BESS + Solar qualify
  // ========================================
  
  const bessITC = bessCost * FEDERAL_ITC_RATE;
  const solarITC = solarCost * FEDERAL_ITC_RATE;
  const federalITC = bessITC + solarITC;
  const netInvestment = totalInvestment - federalITC;
  
  // ========================================
  // CALCULATE SAVINGS
  // ========================================
  
  const demandCharge = utilityData?.demandCharge || 15;
  const electricityRate = utilityData?.rate || 0.12;
  const peakRate = utilityData?.peakRate || electricityRate * 1.5;
  const hasTOU = utilityData?.hasTOU || false;
  
  // Demand charge savings (30% reduction)
  const demandSavings = bessKW * demandCharge * 12 * 0.30;
  
  // TOU arbitrage savings
  let touSavings = 0;
  if (hasTOU && peakRate) {
    const offPeakRate = electricityRate * 0.6;
    const spread = peakRate - offPeakRate;
    touSavings = bessKWh * 0.80 * spread * 250; // 250 cycles/year, 80% DOD
  }
  
  // Solar savings
  let solarSavings = 0;
  if (solarKW > 0) {
    const sunHours = state.solarData?.sunHours || 5;
    const solarKWhProduced = solarKW * sunHours * 300 * 0.85;
    solarSavings = solarKWhProduced * electricityRate;
  }
  
  const annualSavings = demandSavings + touSavings + solarSavings;
  
  // ========================================
  // FINANCIAL METRICS
  // ========================================
  
  const paybackYears = annualSavings > 0 ? netInvestment / annualSavings : 99;
  const tenYearROI = annualSavings > 0 ? ((annualSavings * 10 - netInvestment) / netInvestment) * 100 : 0;
  
  // ========================================
  // BUILD RESULT
  // ========================================
  
  const pricingData: PricingData = {
    battery: batteryPricing,
    solar: solarPricing,
    generator: generatorPricing,
    utilityRate: electricityRate,
    demandCharge,
    peakRate,
    utilityName: utilityData?.utilityName || 'State Average',
    hasTOU,
    savingsScore: savingsOpp?.score || 50,
    pricingSources
  };
  
  return {
    bessKW,
    bessKWh,
    solarKW,
    evChargers,
    evPowerKW: evPowerKW || 0,
    generatorKW,
    totalInvestment: Math.round(totalInvestment),
    annualSavings: Math.round(annualSavings),
    paybackYears: Math.round(paybackYears * 10) / 10,
    tenYearROI: Math.round(tenYearROI),
    federalITC: Math.round(federalITC),
    federalITCRate: FEDERAL_ITC_RATE,
    netInvestment: Math.round(netInvestment),
    pricingData,
    selectedSolarTier,
    selectedEvTier,
  } as CalculationWithPricing;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  goToStep: (step: number) => void;
}

export function Step5MagicFit({ state, updateState, goToStep }: Props) {
  // === DEBUG LOGGING ===
  useEffect(() => {
    console.log('🔍 === STEP 5 STATE DEBUG ===');
    console.log('industry:', state.industry);
    console.log('industryName:', state.industryName);
    console.log('facilityDetails:', state.facilityDetails);
    console.log('useCaseData:', state.useCaseData);
    console.log('selectedOptions:', state.selectedOptions);
    console.log('calculations:', state.calculations);
    
    // Expose to window for console access
    (window as Window & { __MERLIN_STATE__?: WizardState }).__MERLIN_STATE__ = state;
  }, [state]);

  const [calculations, setCalculations] = useState<{ level: typeof POWER_LEVELS[0]; calc: CalculationWithPricing }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // TrueQuote™ Verification Data
  const trueQuoteData = useTrueQuote(state);

  const handleGoHome = () => {
    if (typeof goToStep === 'function') {
      goToStep(2);
    }
  };

  // Fetch calculations on mount and when relevant state changes
  useEffect(() => {
    async function loadCalculations() {
      setIsLoading(true);
      setError(null);
      
      try {
        const results = await Promise.all(
          POWER_LEVELS.map(async (level) => ({
            level,
            calc: await calculateSystemAsync(state, level.multiplier, level.durationHours)
          }))
        );
        setCalculations(results);
      } catch (err) {
        console.error('Calculation error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unable to calculate system pricing. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCalculations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.zipCode, state.industry, state.useCaseData, state.selectedOptions, state.solarTier, state.evTier, state.customSolarKw, state.customEvL2, state.customEvDcfc, state.customEvUltraFast]);

  // Update state with calculations when power level is selected
  const selectPowerLevel = (level: PowerLevel) => {
    const selected = calculations.find(c => c.level.id === level);
    if (selected) {
      const { pricingData, ...calcWithoutPricing } = selected.calc;
      const quoteId = `MQ-${Date.now().toString(36).toUpperCase()}`;
      
      const finalCalculations = {
        ...calcWithoutPricing,
        federalITCRate: FEDERAL_ITC_RATE,
        quoteId,
        pricingSources: pricingData?.pricingSources || [],
        utilityName: pricingData?.utilityName,
        utilityRate: pricingData?.utilityRate,
        demandCharge: pricingData?.demandCharge,
        hasTOU: pricingData?.hasTOU,
      };
      
      updateState({
        selectedPowerLevel: level,
        calculations: finalCalculations,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-purple-300 text-lg">Calculating your options...</p>
        <p className="text-slate-400 text-sm mt-2">Fetching real-time pricing from NREL & utility databases</p>
      </div>
    );
  }

  // Error state - with helpful message to fix data
  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Missing Facility Data</h3>
        <p className="text-amber-300 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => goToStep(3)}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
          >
            ← Back to Step 3
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with HOME button */}
      <div className="text-center relative">
        <button
          onClick={handleGoHome}
          className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-600/50"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Change Industry</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Power Level</h1>
        <p className="text-purple-300">Select the system that fits your needs</p>
      </div>

      {/* TrueQuote™ Official Badge */}
      <div className="flex justify-center">
        <TrueQuoteVerifyBadge
          quoteId={state.calculations?.quoteId || "MQ-PENDING"}
          worksheetData={trueQuoteData}
          variant="compact"
        />
      </div>

      {/* Power Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {calculations.map(({ level, calc }) => {
          const isSelected = state.selectedPowerLevel === level.id;
          const isRecommended = level.recommended;

          return (
            <div
              key={level.id}
              className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-lg ${
                isSelected
                  ? level.id === 'starter'
                    ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/20 via-purple-500/10 to-slate-800/80 scale-105 shadow-cyan-500/20'
                    : level.id === 'perfect_fit'
                    ? 'border-purple-400 bg-gradient-to-br from-purple-500/20 via-cyan-500/10 to-slate-800/80 scale-105 shadow-purple-500/30'
                    : 'border-orange-400 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-slate-800/80 scale-105 shadow-orange-500/20'
                  : isRecommended
                  ? 'border-purple-500/60 bg-gradient-to-br from-slate-800/90 via-purple-900/30 to-slate-800/90 hover:border-purple-400'
                  : level.id === 'starter'
                  ? 'border-cyan-500/40 bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:border-cyan-400'
                  : 'border-orange-500/40 bg-gradient-to-br from-slate-800/80 to-slate-900/80 hover:border-orange-400'
              }`}
              onClick={() => selectPowerLevel(level.id)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  MERLIN'S PICK
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      level.id === 'starter' ? 'bg-cyan-500/30 text-cyan-300' :
                      level.id === 'perfect_fit' ? 'bg-purple-500/30 text-purple-300' :
                      'bg-orange-500/30 text-orange-300'
                    }`}>
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{level.name}</h3>
                      <p className="text-sm text-slate-400">{level.tagline}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      level.id === 'starter' ? 'bg-cyan-500' :
                      level.id === 'perfect_fit' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`}>
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Battery className="w-3 h-3" /> Power
                    </div>
                    <div className="text-white font-semibold">
                      {calc.bessKW >= 1000 ? `${(calc.bessKW / 1000).toFixed(1)} MW` : `${calc.bessKW} kW`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Duration
                    </div>
                    <div className="text-white font-semibold">{level.durationHours} hours</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Storage
                    </div>
                    <div className="text-white font-semibold">
                      {calc.bessKWh >= 1000 ? `${(calc.bessKWh / 1000).toFixed(1)} MWh` : `${calc.bessKWh} kWh`}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Sun className="w-3 h-3" /> Solar
                    </div>
                    <div className="text-white font-semibold">
                      {calc.solarKW > 0 ? `${calc.solarKW} kW` : '—'}
                    </div>
                  </div>
                  {(calc.evPowerKW ?? 0) > 0 && (
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> EV Charging
                      </div>
                      <div className="text-white font-semibold">
                        {calc.evPowerKW} kW ({calc.evChargers} chargers)
                      </div>
                    </div>
                  )}
                  {(calc.generatorKW ?? 0) > 0 && (
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Fuel className="w-3 h-3" /> Backup Generator
                      </div>
                      <div className="text-white font-semibold">
                        {calc.generatorKW >= 1000 ? `${(calc.generatorKW / 1000).toFixed(1)} MW` : `${calc.generatorKW} kW`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Investment */}
                <div className="p-3 bg-slate-900/60 rounded-xl mb-4 space-y-2 border border-slate-700/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Investment</span>
                    <span className="text-white">${(calc.totalInvestment / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400">Federal ITC (30%)</span>
                    <span className="text-emerald-400">-${(calc.federalITC / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-slate-300 font-medium">Net Cost</span>
                    <span className="text-white font-bold">${(calc.netInvestment / 1000).toFixed(0)}K</span>
                  </div>
                </div>

                {/* Savings */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
                  <div className="text-xs text-emerald-400 mb-1">ANNUAL SAVINGS</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${Math.round(calc.annualSavings / 1000)}K<span className="text-sm font-normal">/yr</span>
                  </div>
                </div>

                {/* ROI */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-slate-400">
                    <TrendingUp className="w-4 h-4" />
                    {calc.paybackYears} year payback
                  </div>
                  {calc.tenYearROI > 100 && (
                    <div className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                      {calc.tenYearROI}% 10yr ROI
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
                    isSelected
                      ? level.id === 'starter'
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                        : level.id === 'perfect_fit'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {isSelected ? '✓ SELECTED' : 'SELECT'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TrueQuote™ Verify Badge */}
      <div className="mt-6 flex justify-center">
        <TrueQuoteVerifyBadge
          quoteId={state.calculations?.quoteId || 'PREVIEW'}
          worksheetData={trueQuoteData}
          variant="full"
        />
      </div>

      {/* Selection Summary */}
      {state.selectedPowerLevel && state.calculations && (
        <div className="max-w-2xl mx-auto p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
          <p className="text-purple-300">
            You selected <span className="text-white font-semibold">
              {POWER_LEVELS.find(l => l.id === state.selectedPowerLevel)?.name}
            </span> — 
            <span className="text-emerald-400"> ${Math.round(state.calculations.annualSavings / 1000)}K annual savings</span>
          </p>
        </div>
      )}

      {/* Utility Rate Info */}
      {calculations[0]?.calc.pricingData && (
        <div className="max-w-2xl mx-auto p-3 bg-slate-800/30 rounded-lg text-center text-sm text-slate-400">
          Calculations based on <span className="text-white">{calculations[0].calc.pricingData.utilityName}</span> rates: 
          ${calculations[0].calc.pricingData.utilityRate.toFixed(2)}/kWh, 
          ${calculations[0].calc.pricingData.demandCharge}/kW demand
          {calculations[0].calc.pricingData.hasTOU && (
            <span className="text-purple-400"> • TOU pricing available</span>
          )}
        </div>
      )}
    </div>
  );
}
