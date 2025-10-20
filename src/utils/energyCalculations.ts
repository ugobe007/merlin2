// Utility rates and fuel costs by region/location

export interface UtilityRates {
  electricityRateKWh: number; // $/kWh
  peakRateKWh: number; // $/kWh during peak hours
  offPeakRateKWh: number; // $/kWh during off-peak
  demandChargeKW: number; // $/kW per month
  dieselPriceGallon: number; // $/gallon
  naturalGasPriceTherm: number; // $/therm
  currency: string;
}

export const UTILITY_RATES: { [key: string]: UtilityRates } = {
  'United States': {
    electricityRateKWh: 0.14,
    peakRateKWh: 0.22,
    offPeakRateKWh: 0.08,
    demandChargeKW: 15.00,
    dieselPriceGallon: 3.85,
    naturalGasPriceTherm: 1.20,
    currency: 'USD',
  },
  'Canada': {
    electricityRateKWh: 0.12,
    peakRateKWh: 0.18,
    offPeakRateKWh: 0.07,
    demandChargeKW: 12.00,
    dieselPriceGallon: 4.20,
    naturalGasPriceTherm: 0.95,
    currency: 'CAD',
  },
  'Mexico': {
    electricityRateKWh: 0.10,
    peakRateKWh: 0.16,
    offPeakRateKWh: 0.06,
    demandChargeKW: 10.00,
    dieselPriceGallon: 3.50,
    naturalGasPriceTherm: 1.10,
    currency: 'MXN',
  },
  'United Kingdom': {
    electricityRateKWh: 0.32,
    peakRateKWh: 0.42,
    offPeakRateKWh: 0.15,
    demandChargeKW: 18.00,
    dieselPriceGallon: 7.50,
    naturalGasPriceTherm: 1.50,
    currency: 'GBP',
  },
  'Germany': {
    electricityRateKWh: 0.38,
    peakRateKWh: 0.48,
    offPeakRateKWh: 0.20,
    demandChargeKW: 20.00,
    dieselPriceGallon: 7.80,
    naturalGasPriceTherm: 1.80,
    currency: 'EUR',
  },
  'France': {
    electricityRateKWh: 0.20,
    peakRateKWh: 0.28,
    offPeakRateKWh: 0.12,
    demandChargeKW: 15.00,
    dieselPriceGallon: 7.20,
    naturalGasPriceTherm: 1.40,
    currency: 'EUR',
  },
  'Spain': {
    electricityRateKWh: 0.26,
    peakRateKWh: 0.35,
    offPeakRateKWh: 0.14,
    demandChargeKW: 16.00,
    dieselPriceGallon: 6.80,
    naturalGasPriceTherm: 1.35,
    currency: 'EUR',
  },
  'Italy': {
    electricityRateKWh: 0.28,
    peakRateKWh: 0.37,
    offPeakRateKWh: 0.16,
    demandChargeKW: 17.00,
    dieselPriceGallon: 7.00,
    naturalGasPriceTherm: 1.45,
    currency: 'EUR',
  },
  'Netherlands': {
    electricityRateKWh: 0.24,
    peakRateKWh: 0.32,
    offPeakRateKWh: 0.13,
    demandChargeKW: 16.00,
    dieselPriceGallon: 7.40,
    naturalGasPriceTherm: 1.55,
    currency: 'EUR',
  },
  'Australia': {
    electricityRateKWh: 0.25,
    peakRateKWh: 0.35,
    offPeakRateKWh: 0.12,
    demandChargeKW: 14.00,
    dieselPriceGallon: 5.20,
    naturalGasPriceTherm: 1.25,
    currency: 'AUD',
  },
  'Japan': {
    electricityRateKWh: 0.22,
    peakRateKWh: 0.30,
    offPeakRateKWh: 0.14,
    demandChargeKW: 18.00,
    dieselPriceGallon: 5.80,
    naturalGasPriceTherm: 1.60,
    currency: 'JPY',
  },
  'South Korea': {
    electricityRateKWh: 0.11,
    peakRateKWh: 0.16,
    offPeakRateKWh: 0.07,
    demandChargeKW: 12.00,
    dieselPriceGallon: 4.90,
    naturalGasPriceTherm: 1.15,
    currency: 'KRW',
  },
  'China': {
    electricityRateKWh: 0.08,
    peakRateKWh: 0.12,
    offPeakRateKWh: 0.05,
    demandChargeKW: 8.00,
    dieselPriceGallon: 4.20,
    naturalGasPriceTherm: 0.85,
    currency: 'CNY',
  },
  'India': {
    electricityRateKWh: 0.07,
    peakRateKWh: 0.11,
    offPeakRateKWh: 0.04,
    demandChargeKW: 7.00,
    dieselPriceGallon: 3.90,
    naturalGasPriceTherm: 0.75,
    currency: 'INR',
  },
  'Brazil': {
    electricityRateKWh: 0.18,
    peakRateKWh: 0.26,
    offPeakRateKWh: 0.10,
    demandChargeKW: 13.00,
    dieselPriceGallon: 4.50,
    naturalGasPriceTherm: 1.05,
    currency: 'BRL',
  },
  'Other': {
    electricityRateKWh: 0.15,
    peakRateKWh: 0.22,
    offPeakRateKWh: 0.09,
    demandChargeKW: 12.00,
    dieselPriceGallon: 4.00,
    naturalGasPriceTherm: 1.10,
    currency: 'USD',
  },
};

// Solar space requirements
export const SOLAR_SPACE_REQUIREMENTS = {
  sqFtPerKW: 150, // Average 100-200 sq ft per kW
  sqMetersPerKW: 14, // ~14 square meters per kW
  panelWattage: 400, // Watts per panel
  panelAreaSqFt: 20, // Square feet per panel
};

// Generator fuel consumption
export interface GeneratorFuelConsumption {
  dieselGallonsPerHour: number; // Gallons per hour at full load
  naturalGasThermPerHour: number; // Therms per hour at full load
}

export const getGeneratorFuelConsumption = (generatorMW: number, fuelType: 'diesel' | 'natural-gas'): number => {
  // Approximate fuel consumption rates
  if (fuelType === 'diesel') {
    // ~0.06 gallons per kWh at full load
    return generatorMW * 1000 * 0.06;
  } else {
    // ~0.008 therms per kWh at full load (natural gas)
    return generatorMW * 1000 * 0.008;
  }
};

export const calculateAnnualFuelCost = (
  generatorMW: number,
  fuelType: 'diesel' | 'natural-gas',
  annualRunHours: number,
  location: string
): number => {
  const rates = UTILITY_RATES[location] || UTILITY_RATES['Other'];
  const fuelConsumptionPerHour = getGeneratorFuelConsumption(generatorMW, fuelType);
  
  if (fuelType === 'diesel') {
    return fuelConsumptionPerHour * annualRunHours * rates.dieselPriceGallon;
  } else {
    return fuelConsumptionPerHour * annualRunHours * rates.naturalGasPriceTherm;
  }
};

export const calculateEnergySavings = (
  batteryMWh: number,
  cyclesPerDay: number,
  location: string,
  peakShavingPercent: number = 0.7 // 70% of cycles during peak hours
): number => {
  const rates = UTILITY_RATES[location] || UTILITY_RATES['Other'];
  const dailyEnergyKWh = batteryMWh * 1000 * cyclesPerDay;
  const annualEnergyKWh = dailyEnergyKWh * 365;
  
  // Calculate peak shaving savings
  const peakShavingKWh = annualEnergyKWh * peakShavingPercent;
  const offPeakKWh = annualEnergyKWh * (1 - peakShavingPercent);
  
  const peakSavings = peakShavingKWh * (rates.peakRateKWh - rates.offPeakRateKWh);
  const demandSavings = (batteryMWh * 1000) * rates.demandChargeKW * 12; // Monthly demand charge reduction
  
  return peakSavings + demandSavings;
};

export const calculateROITimeline = (
  totalCost: number,
  annualSavings: number,
  annualFuelCosts: number,
  years: number = 20
): { year: number; cumulativeSavings: number; netPosition: number; roiPercent: number }[] => {
  const timeline = [];
  let cumulativeSavings = 0;
  
  for (let year = 1; year <= years; year++) {
    const yearSavings = annualSavings - annualFuelCosts;
    cumulativeSavings += yearSavings;
    const netPosition = cumulativeSavings - totalCost;
    const roiPercent = (cumulativeSavings / totalCost) * 100;
    
    timeline.push({
      year,
      cumulativeSavings,
      netPosition,
      roiPercent,
    });
  }
  
  return timeline;
};

export const findPaybackYear = (roiTimeline: ReturnType<typeof calculateROITimeline>): number => {
  const paybackPoint = roiTimeline.find(point => point.netPosition >= 0);
  return paybackPoint ? paybackPoint.year : roiTimeline.length;
};
