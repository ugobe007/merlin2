import { calculateSystemCost, calculateBESSPricing } from './advancedFinancialModeling';
import { getCalculationConstants } from './centralizedCalculations';

interface CalculationInputs {
  powerMW: number;
  standbyHours: number;
  selectedCountry: string;
  useCase: string;
  gridMode: string;
  batteryKwh: number;
  pcsKw: number;
  bosPercent: number;
  epcPercent: number;
  offGridPcsFactor: number;
  onGridPcsFactor: number;
  generatorMW: number;
  genKw: number;
  solarMWp: number;
  solarKwp: number;
  windMW: number;
  windKw: number;
}

interface CalculationResults {
  // System specifications
  totalMWh: number;
  actualDuration: number;
  pcsKW: number;
  adjustedPcsKw: number;
  
  // Cost components
  batterySubtotal: number;
  pcsSubtotal: number;
  bosAmount: number;
  epcAmount: number;
  bessCapEx: number;
  
  // Additional components
  generatorSubtotal: number;
  solarSubtotal: number;
  windSubtotal: number;
  
  // Tariffs and totals
  batteryTariff: number;
  otherTariff: number;
  totalTariffs: number;
  grandCapEx: number;
  
  // ROI calculations
  annualEnergyMWh: number;
  peakShavingValue: number;
  peakShavingSavings: number;
  demandChargeSavings: number;
  annualSavings: number;
  roiYears: number;
  
  // Dynamic pricing
  dynamicBatteryKwh: number;
  effectiveBatteryKwh: number;
}

export async function calculateBessQuote(inputs: CalculationInputs): Promise<CalculationResults> {
  const {
    powerMW,
    standbyHours,
    selectedCountry,
    useCase,
    gridMode,
    batteryKwh,
    pcsKw,
    bosPercent,
    epcPercent,
    offGridPcsFactor,
    onGridPcsFactor,
    generatorMW,
    genKw,
    solarMWp,
    solarKwp,
    windMW,
    windKw
  } = inputs;

  // 🔥 LOAD CONSTANTS FROM DATABASE - Single source of truth
  const constants = await getCalculationConstants();
  console.log('📊 calculateBessQuote using database constants:', {
    peakShavingMultiplier: constants.peak_shaving_multiplier,
    demandChargeMonthly: constants.demand_charge_monthly_per_mw,
    gridServiceRevenue: constants.grid_service_revenue_per_mw
  });

  // Get realistic system sizing based on application requirements (NOW ASYNC - database-backed)
  const systemCost = await calculateSystemCost(powerMW, standbyHours, selectedCountry, true, useCase.toLowerCase().replace(/\s+/g, '-'));
  const totalMWh = powerMW * standbyHours; // Use calculated energy capacity
  const actualDuration = standbyHours; // Use specified duration
  const pcsKW = powerMW * 1000;
  const actualPcsFactor = gridMode === 'Off-grid' ? offGridPcsFactor : onGridPcsFactor;
  const adjustedPcsKw = pcsKW * actualPcsFactor;
  
  // Use dynamic pricing system based on market data (NOW ASYNC - database-backed)
  const dynamicPricing = await calculateBESSPricing(powerMW, standbyHours, selectedCountry, false);
  const dynamicBatteryKwh = dynamicPricing.adjustedBatteryPrice;
  
  // Use dynamic pricing unless manually overridden to a much higher value
  const effectiveBatteryKwh = batteryKwh > 160 ? batteryKwh : dynamicBatteryKwh;
  
  const batterySubtotal = totalMWh * 1000 * effectiveBatteryKwh;
  const pcsSubtotal = pcsKW * pcsKw;
  const bosAmount = (batterySubtotal + pcsSubtotal) * bosPercent;
  const epcAmount = (batterySubtotal + pcsSubtotal + bosAmount) * epcPercent;
  const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
  
  const generatorSubtotal = generatorMW * 1000 * genKw;
  const solarSubtotal = solarMWp * 1000 * (solarKwp / 1000);
  const windSubtotal = windMW * 1000 * (windKw / 1000);
  
  const batteryTariff = bessCapEx * 0.21;
  const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * 0.06;
  const totalTariffs = batteryTariff + otherTariff;
  
  const grandCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
  
  // 🔥 USE DATABASE CONSTANTS FOR REVENUE CALCULATIONS - Single source of truth
  const annualCycles = constants.annual_cycles || 365;
  const annualEnergyMWh = totalMWh * annualCycles;
  
  // Peak shaving savings: Use database formula ($/MW-year converted to annual)
  const peakShavingMultiplier = constants.peak_shaving_multiplier || 365;
  const peakShavingSavings = powerMW * peakShavingMultiplier * 1000; // Convert MW to kW
  
  // Demand charge reduction: Use database formula ($/MW-month * 12 months)
  const demandChargeMonthly = constants.demand_charge_monthly_per_mw || 15000;
  const demandChargeSavings = powerMW * demandChargeMonthly * 12 / 1000; // Already in $/MW-month
  
  // Grid services revenue: Use database formula
  const gridServiceRevenue = powerMW * (constants.grid_service_revenue_per_mw || 30000);
  
  // Solar/wind savings
  const solarSavings = solarMWp * (constants.solar_capacity_factor || 1500) * 0.12; // $0.12/kWh default
  const windSavings = windMW * (constants.wind_capacity_factor || 2500) * 0.12;
  
  const annualSavings = peakShavingSavings + demandChargeSavings + gridServiceRevenue + solarSavings + windSavings;
  const roiYears = annualSavings > 0 ? grandCapEx / annualSavings : 999;
  
  console.log('💰 calculateBessQuote results:', {
    peakShavingSavings,
    demandChargeSavings,
    gridServiceRevenue,
    annualSavings,
    roiYears,
    dataSource: 'database'
  });

  return {
    // System specifications
    totalMWh,
    actualDuration,
    pcsKW,
    adjustedPcsKw,
    
    // Cost components
    batterySubtotal,
    pcsSubtotal,
    bosAmount,
    epcAmount,
    bessCapEx,
    
    // Additional components
    generatorSubtotal,
    solarSubtotal,
    windSubtotal,
    
    // Tariffs and totals
    batteryTariff,
    otherTariff,
    totalTariffs,
    grandCapEx,
    
    // ROI calculations
    annualEnergyMWh,
    peakShavingValue: peakShavingMultiplier, // Return the multiplier used
    peakShavingSavings,
    demandChargeSavings,
    annualSavings,
    roiYears,
    
    // Dynamic pricing
    dynamicBatteryKwh,
    effectiveBatteryKwh
  };
}

// Currency symbol helper function
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'INR': '₹',
    'BRL': 'R$',
    'MXN': 'MX$',
    'KRW': '₩',
  };
  return symbols[currency] || '$';
}