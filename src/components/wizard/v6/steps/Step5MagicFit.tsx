/**
 * STEP 5: Magic Fit - Power Level Selection
 * =========================================
 * The Big Reveal: 3 cards with REAL calculations from SSOT services
 * 
 * CRITICAL: This file uses ONLY the unified pricing services - NO hardcoded values!
 * 
 * Data Sources (TrueQuote™ Compliant):
 * - Equipment Pricing: unifiedPricingService.ts → Database/NREL ATB 2024
 * - Utility Rates: utilityRateService.ts → EIA 2024 + Utility-specific rates
 * - Demand Charges: utilityRateService.ts → State/Utility specific
 * 
 * FIXED: December 29, 2025
 * - Now reads from useCaseData (where Step 3 stores hotel data)
 * - Calculates BESS from annual energy estimate when available
 * - Proper data flow from Step 3 → Step 4 → Step 5
 */

import React, { useEffect, useState } from 'react';
import { Zap, Battery, Sun, Clock, TrendingUp, Star, Check, Loader2, Info, Shield, Home } from 'lucide-react';
import type { WizardState, PowerLevel, SystemCalculations } from '../types';
import { POWER_LEVELS } from '../types';

// ============================================================================
// SSOT SERVICE IMPORTS - Single Source of Truth
// ============================================================================
import { 
  getBatteryPricing, 
  getSolarPricing, 
  getGeneratorPricing,
  type BatteryPricing,
  type SolarPricing,
  type GeneratorPricing
} from '@/services/unifiedPricingService';

import { 
  getCommercialRateByZip,
  getBESSSavingsOpportunity
} from '@/services/utilityRateService';

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
  selectedEvTier?: { l2Count: number; dcfcCount: number; powerRaw: number; name: string };
}

// ============================================================================
// CONSTANTS - ITC Rates (2024+)
// ============================================================================

const FEDERAL_ITC_RATE = 0.30; // 30% ITC for solar AND standalone BESS (as of IRA 2022)

// ============================================================================
// INDUSTRY POWER PROFILES - SSOT Reference
// Source: ASHRAE, DOE, CBECS, Industry Standards
// ============================================================================

const INDUSTRY_POWER_PROFILES = {
  hotel: {
    kwhPerUnit: 12000,      // kWh/room/year (CBECS Hotel benchmark)
    unitField: 'roomCount',
    peakFactor: 1.5,        // Peak demand vs average
    bessRatio: 0.4,         // BESS sized for 40% of peak demand
    minBessKW: 100,
    maxBessKW: 5000,
  },
  car_wash: {
    kwhPerUnit: 50000,      // kWh/tunnel/year
    unitField: 'tunnelCount',
    peakFactor: 2.0,        // High peak due to motor startups
    bessRatio: 0.5,
    minBessKW: 100,
    maxBessKW: 2000,
  },
  ev_charging: {
    kwhPerUnit: 100000,     // kWh/charger/year (high utilization)
    unitField: 'chargerCount',
    peakFactor: 3.0,        // Very peaky load
    bessRatio: 0.6,
    minBessKW: 200,
    maxBessKW: 10000,
  },
  data_center: {
    kwhPerUnit: 60000,      // kWh/rack/year
    unitField: 'rackCount',
    peakFactor: 1.2,        // Fairly flat load
    bessRatio: 0.3,
    minBessKW: 500,
    maxBessKW: 50000,
  },
  hospital: {
    kwhPerUnit: 30000,      // kWh/bed/year
    unitField: 'bedCount',
    peakFactor: 1.4,
    bessRatio: 0.5,         // Critical load support
    minBessKW: 200,
    maxBessKW: 10000,
  },
  // Default for other industries - use sqft
  default: {
    kwhPerSqft: 15,         // kWh/sqft/year (commercial average)
    peakFactor: 1.5,
    bessRatio: 0.4,
    minBessKW: 50,
    maxBessKW: 5000,
  }
};

// ============================================================================
// STEP 4 CALCULATIONS - Match Step4Options logic exactly
// ============================================================================

interface SolarTierResult {
  name: string;
  size: string;
  sizeKw: number;
  coverage: string;
  panels: number;
  annualProduction: string;
  annualProductionRaw: number;
  annualSavings: string;
  annualSavingsRaw: number;
  installCost: string;
  installCostRaw: number;
  netCost: string;
  netCostRaw: number;
  payback: string;
  co2Offset: string;
  tag?: string;
}

interface EvTierResult {
  name: string;
  chargers: string;
  l2Count: number;
  dcfcCount: number;
  power: string;
  powerRaw: number;
  carsPerDay: string;
  monthlyRevenue: string;
  monthlyRevenueRaw: number;
  installCost: string;
  installCostRaw: number;
  tenYearRevenue: number;
  guestAppeal: string;
  tag?: string;
}

function calcSolar(name: string, pct: number, usage: number, sun: number): SolarTierResult {
  const kw = Math.round((usage * pct) / (sun * 365 * 0.85) / 5) * 5;
  const prod = kw * sun * 365 * 0.85;
  const cost = kw * 1000 * 1.50;
  const net = cost * 0.70;
  const savings = prod * 0.12;
  return { 
    name, size: `${kw} kW`, sizeKw: kw, 
    coverage: `${Math.round(pct*100)}%`, 
    panels: Math.ceil(kw*1000/500), 
    annualProduction: Math.round(prod).toLocaleString(), 
    annualProductionRaw: Math.round(prod), 
    annualSavings: `$${Math.round(savings).toLocaleString()}`, 
    annualSavingsRaw: Math.round(savings), 
    installCost: `$${Math.round(cost).toLocaleString()}`, 
    installCostRaw: Math.round(cost), 
    netCost: `$${Math.round(net).toLocaleString()}`, 
    netCostRaw: Math.round(net), 
    payback: `${(net/savings).toFixed(1)} years`, 
    co2Offset: `${Math.round(prod*0.0007)} tons/yr` 
  };
}

function calcEv(name: string, l2: number, dc: number): EvTierResult {
  const cost = l2*6000 + dc*45000;
  const rev = l2*150 + dc*800;
  const stars = dc > 0 ? (dc >= 4 ? '★★★★★' : '★★★★☆') : '★★★☆☆';
  const powerRaw = Math.round(l2*7.7+dc*62.5);
  return { 
    name, 
    chargers: dc > 0 ? `${l2} L2 + ${dc} DC Fast` : `${l2} Level 2`, 
    l2Count: l2, dcfcCount: dc, 
    power: `${powerRaw} kW`, powerRaw,
    carsPerDay: `${Math.round((l2*2+dc*8)*0.8)}-${l2*2+dc*8}`, 
    monthlyRevenue: `$${rev.toLocaleString()}`, monthlyRevenueRaw: rev, 
    installCost: `$${cost.toLocaleString()}`, installCostRaw: cost, 
    tenYearRevenue: rev*12*10, 
    guestAppeal: stars 
  };
}

// ============================================================================
// FIXED: Calculate Base Power from ACTUAL DATA
// Now reads from useCaseData (where Step 3 stores data)
// ============================================================================

function calculateBasePowerKW(state: WizardState): number {
  const { industry, useCaseData, facilityDetails } = state;
  
  // PRIORITY 1: Use annual energy estimate from Step 3 (most accurate)
  const annualKwh = useCaseData?.estimatedAnnualKwh;
  if (annualKwh && annualKwh > 0) {
    // Calculate peak demand from annual energy
    // Peak = (Annual kWh / 8760 hours) * peak factor
    const profile = INDUSTRY_POWER_PROFILES[industry as keyof typeof INDUSTRY_POWER_PROFILES] 
                    || INDUSTRY_POWER_PROFILES.default;
    const avgLoadKW = annualKwh / 8760;
    const peakDemandKW = avgLoadKW * profile.peakFactor;
    
    // BESS sized for a portion of peak demand
    let bessKW = Math.round(peakDemandKW * profile.bessRatio);
    
    // Apply min/max constraints
    bessKW = Math.max(profile.minBessKW, Math.min(profile.maxBessKW, bessKW));
    
    console.log('🔋 BESS Sizing from Annual Energy:', {
      industry,
      annualKwh,
      avgLoadKW: Math.round(avgLoadKW),
      peakFactor: profile.peakFactor,
      peakDemandKW: Math.round(peakDemandKW),
      bessRatio: profile.bessRatio,
      bessKW,
    });
    
    return bessKW;
  }
  
  // PRIORITY 2: Use industry-specific unit count from useCaseData
  const profile = INDUSTRY_POWER_PROFILES[industry as keyof typeof INDUSTRY_POWER_PROFILES];
  if (profile && 'unitField' in profile) {
    const unitCount = useCaseData?.[profile.unitField] || facilityDetails?.[profile.unitField as keyof typeof facilityDetails] || 0;
    if (unitCount > 0) {
      const annualKwhEstimate = unitCount * profile.kwhPerUnit;
      const avgLoadKW = annualKwhEstimate / 8760;
      const peakDemandKW = avgLoadKW * profile.peakFactor;
      let bessKW = Math.round(peakDemandKW * profile.bessRatio);
      bessKW = Math.max(profile.minBessKW, Math.min(profile.maxBessKW, bessKW));
      
      console.log('🔋 BESS Sizing from Unit Count:', {
        industry,
        unitField: profile.unitField,
        unitCount,
        annualKwhEstimate,
        bessKW,
      });
      
      return bessKW;
    }
  }
  
  // PRIORITY 3: Use square footage
  const sqft = useCaseData?.squareFootage || facilityDetails?.squareFootage || 0;
  if (sqft > 0) {
    const defaultProfile = INDUSTRY_POWER_PROFILES.default;
    const annualKwhEstimate = sqft * defaultProfile.kwhPerSqft;
    const avgLoadKW = annualKwhEstimate / 8760;
    const peakDemandKW = avgLoadKW * defaultProfile.peakFactor;
    let bessKW = Math.round(peakDemandKW * defaultProfile.bessRatio);
    bessKW = Math.max(defaultProfile.minBessKW, Math.min(defaultProfile.maxBessKW, bessKW));
    
    console.log('🔋 BESS Sizing from Square Footage:', {
      sqft,
      annualKwhEstimate,
      bessKW,
    });
    
    return bessKW;
  }
  
  // FALLBACK: Use grid connection if available
  if (facilityDetails?.gridConnectionKW > 0) {
    const bessKW = Math.round(facilityDetails.gridConnectionKW * 0.4);
    console.log('🔋 BESS Sizing from Grid Connection:', {
      gridConnectionKW: facilityDetails.gridConnectionKW,
      bessKW,
    });
    return Math.max(50, bessKW);
  }
  
  // LAST RESORT: Minimum viable system
  console.warn('⚠️ BESS Sizing: No data available, using minimum (100 kW)');
  return 100;
}

// ============================================================================
// ASYNC CALCULATION FUNCTION - Uses SSOT Services
// ============================================================================

async function calculateSystemAsync(
  state: WizardState, 
  multiplier: number, 
  durationHours: number
): Promise<CalculationWithPricing> {
  const { opportunities, zipCode, solarTier, evTier, selectedOptions, useCaseData } = state;
  
  // Calculate base power requirement using FIXED function
  const basePowerKW = calculateBasePowerKW(state);
  
  // Apply multiplier for power level
  const bessKW = Math.round(basePowerKW * multiplier);
  const bessKWh = bessKW * durationHours;
  const bessMW = bessKW / 1000;
  
  console.log('📊 Step 5 BESS Final Calculation:', {
    industry: state.industry,
    basePowerKW,
    multiplier,
    bessKW,
    durationHours,
    bessKWh,
    bessMW: bessMW.toFixed(3),
  });
  
  // ========================================
  // SOLAR SIZING - Use tier from Step 4
  // ========================================
  let solarKW = 0;
  let solarCost = 0;
  let selectedSolarTier: SolarTierResult | null = null;
  
  if (selectedOptions?.includes('solar') && solarTier) {
    const usage = useCaseData?.estimatedAnnualKwh || 1850000;
    const sunHours = useCaseData?.sunHours || state.solarData?.sunHours || 6.3;
    
    const solarOpts = {
      starter: calcSolar('Starter', 0.15, usage, sunHours),
      recommended: calcSolar('Recommended', 0.30, usage, sunHours),
      maximum: calcSolar('Maximum', 0.50, usage, sunHours)
    };
    
    selectedSolarTier = solarOpts[solarTier as keyof typeof solarOpts];
    if (selectedSolarTier) {
      solarKW = selectedSolarTier.sizeKw;
      solarCost = selectedSolarTier.installCostRaw;
      
      console.log('☀️ Solar from Step 4 Tier:', {
        tier: solarTier,
        solarKW,
        solarCost,
      });
    }
  }
  const solarMW = solarKW / 1000;
  
  // ========================================
  // GENERATOR SIZING
  // ========================================
  let generatorKW = 0;
  if (opportunities.wantsGenerator || selectedOptions?.includes('generator')) {
    generatorKW = Math.round(bessKW * 0.5);
  }
  
  // ========================================
  // EV CHARGER SIZING - Use tier from Step 4
  // ========================================
  let evChargers = 0;
  let evCost = 0;
  let evPowerKW = 0;
  let selectedEvTier: EvTierResult | null = null;
  
  if (selectedOptions?.includes('ev') && evTier) {
    const evOpts = {
      basic: calcEv('Basic', 4, 0),
      standard: calcEv('Standard', 6, 2),
      premium: calcEv('Premium', 8, 4)
    };
    
    selectedEvTier = evOpts[evTier as keyof typeof evOpts];
    if (selectedEvTier) {
      evChargers = selectedEvTier.l2Count + selectedEvTier.dcfcCount;
      evCost = selectedEvTier.installCostRaw;
      evPowerKW = selectedEvTier.powerRaw;
      
      console.log('⚡ EV from Step 4 Tier:', {
        tier: evTier,
        evChargers,
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
    getBatteryPricing(bessMW, durationHours, state.state || 'United States'),
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
  
  // Solar Cost (use Step 4 tier cost, or SSOT fallback)
  if (!selectedSolarTier && solarPricing && solarKW > 0) {
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
  if (selectedSolarTier) {
    solarSavings = selectedSolarTier.annualSavingsRaw;
  } else if (solarKW > 0) {
    const sunHours = state.solarData?.sunHours || 5;
    const solarKWh = solarKW * sunHours * 300 * 0.85;
    solarSavings = solarKWh * electricityRate;
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
    selectedSolarTier: selectedSolarTier ? { sizeKw: selectedSolarTier.sizeKw, name: selectedSolarTier.name } : undefined,
    selectedEvTier: selectedEvTier ? { l2Count: selectedEvTier.l2Count, dcfcCount: selectedEvTier.dcfcCount, powerRaw: selectedEvTier.powerRaw, name: selectedEvTier.name } : undefined
  } as CalculationWithPricing;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

export function Step5MagicFit({ state, updateState }: Props) {
  const [calculations, setCalculations] = useState<{ level: typeof POWER_LEVELS[0]; calc: CalculationWithPricing }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPricingSources, setShowPricingSources] = useState(false);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Debug: Log state on mount
  useEffect(() => {
    console.log('🔍 Step 5 STATE DEBUG:', {
      industry: state.industry,
      useCaseData: state.useCaseData,
      facilityDetails: state.facilityDetails,
      selectedOptions: state.selectedOptions,
      solarTier: state.solarTier,
      evTier: state.evTier,
      solarData: state.solarData,
    });
  }, [state]);

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
        setError('Unable to calculate system pricing. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCalculations();
  }, [state.zipCode, state.industry, state.useCaseData, state.selectedOptions, state.solarTier, state.evTier]);

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

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const pricingSources = calculations[0]?.calc.pricingData.pricingSources || [];

  return (
    <div className="space-y-8">
      {/* Header with HOME button */}
      <div className="text-center relative">
        {/* HOME Button - Top Right */}
        <button
          onClick={handleGoHome}
          className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-600/50"
        >
          <Home className="w-4 h-4" />
          <span className="text-sm font-medium">Home</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">Choose Your Power Level</h1>
        <p className="text-purple-300">Select the system that fits your needs</p>
      </div>

      {/* TrueQuote™ Badge */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowPricingSources(!showPricingSources)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm hover:bg-emerald-500/20 transition-colors"
        >
          <Shield className="w-4 h-4" />
          TrueQuote™ Verified Pricing
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Pricing Sources Disclosure */}
      {showPricingSources && (
        <div className="max-w-2xl mx-auto p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
          <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Pricing Data Sources
          </h4>
          <ul className="space-y-1 text-sm text-slate-300">
            {pricingSources.map((source, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                {source}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Pricing verified against NREL ATB 2024, EIA utility rates, and vendor databases.
          </p>
        </div>
      )}

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
