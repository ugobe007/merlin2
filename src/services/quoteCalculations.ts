import { calculateSystemCost, calculateBESSPricing } from './advancedFinancialModeling';

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

// Mock UTILITY_RATES for calculation service
const UTILITY_RATES: { [key: string]: any } = {
  'United States': {
    peakRateKWh: 0.25,
    offPeakRateKWh: 0.12,
    demandChargeKW: 15.0
  }
};

export function calculateBessQuote(inputs: CalculationInputs): CalculationResults {
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

  // Get realistic system sizing based on application requirements
  const systemCost = calculateSystemCost(powerMW, standbyHours, selectedCountry, true, useCase.toLowerCase().replace(/\s+/g, '-'));
  const totalMWh = powerMW * standbyHours; // Use calculated energy capacity
  const actualDuration = standbyHours; // Use specified duration
  const pcsKW = powerMW * 1000;
  const actualPcsFactor = gridMode === 'Off-grid' ? offGridPcsFactor : onGridPcsFactor;
  const adjustedPcsKw = pcsKW * actualPcsFactor;
  
  // Use dynamic pricing system based on market data
  const dynamicPricing = calculateBESSPricing(powerMW, standbyHours, selectedCountry, false);
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
  
  // Use realistic utility rates for ROI calculation
  const utilityData = UTILITY_RATES['United States']; // Default to US rates
  const dailyCycles = 1; // 1 full charge/discharge cycle per day
  const annualEnergyMWh = totalMWh * dailyCycles * 365;
  
  // Peak shaving savings: arbitrage between peak and off-peak
  const peakShavingValue = (utilityData.peakRateKWh - utilityData.offPeakRateKWh);
  const peakShavingSavings = annualEnergyMWh * 1000 * peakShavingValue * 0.7; // 70% peak offset
  
  // Demand charge reduction: avoid peak demand charges
  const demandChargeSavings = (powerMW * 1000) * utilityData.demandChargeKW * 12;
  
  const annualSavings = peakShavingSavings + demandChargeSavings;
  const roiYears = annualSavings > 0 ? grandCapEx / annualSavings : Infinity;

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
    peakShavingValue,
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