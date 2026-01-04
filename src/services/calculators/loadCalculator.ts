/**
 * LOAD CALCULATOR
 * Calculates peak demand and energy consumption based on facility data
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import { TRUEQUOTE_CONSTANTS } from '../TrueQuoteEngine';
import type { Industry } from '../contracts';

export interface LoadCalculationInput {
  industry: Industry;
  useCaseData: Record<string, any>;
}

export interface LoadCalculationResult {
  peakDemandKW: number;
  annualConsumptionKWh: number;
  averageDailyKWh: number;
  loadFactor: number;  // 0-1, ratio of average to peak
  loadProfile: 'flat' | 'peaky' | 'seasonal';
  calculationMethod: string;
  breakdown: {
    category: string;
    kW: number;
    percentage: number;
  }[];
}

// Industry-specific watts per unit
const INDUSTRY_LOAD_FACTORS: Record<string, {
  method: 'per_unit' | 'per_sqft' | 'fixed';
  unitName?: string;
  wattsPerUnit?: number;
  wattsPerSqft?: number;
  baseKW?: number;
  loadFactor: number;
  profile: 'flat' | 'peaky' | 'seasonal';
}> = {
  hotel: {
    method: 'per_unit',
    unitName: 'rooms',
    wattsPerUnit: 2500, // 2.5 kW per room average
    loadFactor: 0.45,
    profile: 'peaky',
  },
  car_wash: {
    method: 'per_sqft',
    wattsPerSqft: 25, // High power density
    loadFactor: 0.35,
    profile: 'peaky',
  },
  data_center: {
    method: 'per_sqft',
    wattsPerSqft: 150, // Very high power density
    loadFactor: 0.85,
    profile: 'flat',
  },
  manufacturing: {
    method: 'per_sqft',
    wattsPerSqft: 30,
    loadFactor: 0.55,
    profile: 'peaky',
  },
  hospital: {
    method: 'per_unit',
    unitName: 'beds',
    wattsPerUnit: 8000, // 8 kW per bed
    loadFactor: 0.65,
    profile: 'flat',
  },
  retail: {
    method: 'per_sqft',
    wattsPerSqft: 15,
    loadFactor: 0.40,
    profile: 'peaky',
  },
  office: {
    method: 'per_sqft',
    wattsPerSqft: 12,
    loadFactor: 0.35,
    profile: 'peaky',
  },
  warehouse: {
    method: 'per_sqft',
    wattsPerSqft: 8,
    loadFactor: 0.50,
    profile: 'flat',
  },
  restaurant: {
    method: 'per_sqft',
    wattsPerSqft: 50, // High due to kitchen equipment
    loadFactor: 0.30,
    profile: 'peaky',
  },
  college: {
    method: 'per_sqft',
    wattsPerSqft: 18,
    loadFactor: 0.40,
    profile: 'seasonal',
  },
  ev_charging: {
    method: 'fixed',
    baseKW: 500, // Will be overridden by charger count
    loadFactor: 0.25,
    profile: 'peaky',
  },
};

/**
 * Calculate facility load based on industry and facility data
 */
export function calculateLoad(input: LoadCalculationInput): LoadCalculationResult {
  const config = INDUSTRY_LOAD_FACTORS[input.industry] || {
    method: 'per_sqft',
    wattsPerSqft: 15,
    loadFactor: 0.40,
    profile: 'flat' as const,
  };

  let peakDemandKW = 0;
  let calculationMethod = '';
  const breakdown: LoadCalculationResult['breakdown'] = [];

  // Calculate base load based on method
  switch (config.method) {
    case 'per_unit': {
      const units = extractUnitCount(input.industry, input.useCaseData);
      peakDemandKW = (units * (config.wattsPerUnit || 2500)) / 1000;
      calculationMethod = `${units} ${config.unitName} × ${config.wattsPerUnit} W`;
      breakdown.push({
        category: `Base (${config.unitName})`,
        kW: peakDemandKW,
        percentage: 100,
      });
      break;
    }
    case 'per_sqft': {
      const sqft = input.useCaseData.squareFootage || input.useCaseData.totalSqFt || 50000;
      peakDemandKW = (sqft * (config.wattsPerSqft || 15)) / 1000;
      calculationMethod = `${sqft.toLocaleString()} sqft × ${config.wattsPerSqft} W/sqft`;
      breakdown.push({
        category: 'Base (sqft)',
        kW: peakDemandKW,
        percentage: 100,
      });
      break;
    }
    case 'fixed': {
      peakDemandKW = config.baseKW || 500;
      calculationMethod = `Fixed base: ${peakDemandKW} kW`;
      break;
    }
  }

  // Apply industry-specific modifiers
  peakDemandKW = applyModifiers(peakDemandKW, input.industry, input.useCaseData, breakdown);

  // Calculate consumption
  const hoursPerYear = 8760;
  const annualConsumptionKWh = peakDemandKW * hoursPerYear * config.loadFactor;
  const averageDailyKWh = annualConsumptionKWh / 365;

  // Normalize breakdown percentages
  const totalKW = breakdown.reduce((sum, b) => sum + b.kW, 0);
  breakdown.forEach(b => {
    b.percentage = Math.round((b.kW / totalKW) * 100);
  });

  return {
    peakDemandKW: Math.round(peakDemandKW),
    annualConsumptionKWh: Math.round(annualConsumptionKWh),
    averageDailyKWh: Math.round(averageDailyKWh),
    loadFactor: config.loadFactor,
    loadProfile: config.profile,
    calculationMethod,
    breakdown,
  };
}

/**
 * Extract unit count based on industry
 */
function extractUnitCount(industry: Industry, data: Record<string, any>): number {
  switch (industry) {
    case 'hotel':
      return data.roomCount || data.numberOfRooms || data.rooms || data.guestRooms || 100;
    case 'hospital':
      return data.bedCount || data.beds || data.licensedBeds || 200;
    case 'college':
      return data.students || data.enrollment || 5000;
    default:
      return 100;
  }
}

/**
 * Apply industry-specific modifiers to base load
 */
function applyModifiers(
  baseKW: number,
  industry: Industry,
  data: Record<string, any>,
  breakdown: LoadCalculationResult['breakdown']
): number {
  let total = baseKW;

  // Hotel modifiers
  if (industry === 'hotel') {
    if (data.hasRestaurant || data.restaurant) {
      const restaurantKW = baseKW * 0.15;
      total += restaurantKW;
      breakdown.push({ category: 'Restaurant', kW: restaurantKW, percentage: 0 });
    }
    if (data.hasPool || data.pool) {
      const poolKW = baseKW * 0.08;
      total += poolKW;
      breakdown.push({ category: 'Pool', kW: poolKW, percentage: 0 });
    }
    if (data.hasSpa || data.spa) {
      const spaKW = baseKW * 0.05;
      total += spaKW;
      breakdown.push({ category: 'Spa', kW: spaKW, percentage: 0 });
    }
    if (data.conferenceRooms || data.meetingSpaces) {
      const confKW = baseKW * 0.10;
      total += confKW;
      breakdown.push({ category: 'Conference', kW: confKW, percentage: 0 });
    }
  }

  // Car wash modifiers
  if (industry === 'car_wash') {
    const tunnels = data.tunnelCount || data.bays || 1;
    if (tunnels > 1) {
      total *= (1 + (tunnels - 1) * 0.4); // Each additional tunnel adds 40%
    }
    if (data.hasVacuums || data.vacuumStations) {
      const vacKW = 15 * (data.vacuumStations || 10);
      total += vacKW;
      breakdown.push({ category: 'Vacuums', kW: vacKW, percentage: 0 });
    }
  }

  // Hospital modifiers
  if (industry === 'hospital') {
    if (data.operatingRooms) {
      const orKW = data.operatingRooms * 50; // 50 kW per OR
      total += orKW;
      breakdown.push({ category: 'Operating Rooms', kW: orKW, percentage: 0 });
    }
    if (data.icuBeds) {
      const icuKW = data.icuBeds * 15; // 15 kW per ICU bed
      total += icuKW;
      breakdown.push({ category: 'ICU', kW: icuKW, percentage: 0 });
    }
    if (data.imagingEquipment) {
      const imgKW = 100; // CT, MRI, etc.
      total += imgKW;
      breakdown.push({ category: 'Imaging', kW: imgKW, percentage: 0 });
    }
  }

  // Data center modifiers
  if (industry === 'data_center') {
    const pue = data.pue || 1.5; // Power Usage Effectiveness
    total *= pue;
  }

  return total;
}
