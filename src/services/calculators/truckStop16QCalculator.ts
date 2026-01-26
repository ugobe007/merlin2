/**
 * TRUCK STOP 16Q CALCULATOR SERVICE
 * 
 * Fueling position + amenity-based load reconstruction
 * Feeds WizardV6 and WizardV7 with accurate BESS sizing
 * 
 * Engineering Approach:
 * 1. Fueling position topology (diesel, DEF, reefer fuel)
 * 2. Amenity loads (restaurant, showers, laundry, store, maintenance)
 * 3. Refrigeration loads (reefer parking, cold storage)
 * 4. EV charging integration (future-proofing)
 * 5. BESS sizing (IEEE 4538388 ratio + TrueQuote™)
 */

import { BESS_POWER_RATIOS } from '@/components/wizard/v6/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface TruckStop16QInput {
  // Topology (Q1-Q2)
  truckStopType: 'basic_fuel' | 'travel_center' | 'truck_plaza' | 'fleet_facility' | 'mega_center';
  fuelingPositions: string; // '1-4', '5-8', '9-16', '17-32', '33+'
  
  // Infrastructure (Q3-Q4)
  electricalServiceSize: '400' | '800' | '1600' | '2000' | '3000+' | 'not_sure';
  voltageLevel: '208' | '240' | '277_480' | '480_3phase' | 'not_sure';
  
  // Equipment (Q5-Q7)
  majorFacilities: string[]; // ['restaurant', 'showers', 'laundry', 'convenience_store', 'truck_wash', 'maintenance_bays', 'reefer_parking', 'scales', 'ev_charging']
  refrigerationLoad: 'none' | 'minimal' | 'moderate' | 'extensive';
  largestLoad: string; // '<50', '50-100', '100-250', '250-500', '500+'
  
  // Operations (Q8-Q11)
  dailyTrafficVolume: string; // '<100', '100-250', '250-500', '500-1000', '1000+'
  peakTrafficHours: string; // 'early_morning', 'morning', 'midday', 'evening', 'night', 'variable'
  operatingHours: '16-20' | '20-24' | '24/7_basic' | '24/7_full';
  reeferUtilization: string; // 'none', '<25%', '25-50%', '50-75%', '75-100%'
  
  // Financial (Q12-Q13)
  monthlyElectricitySpend: string; // '<10000', '10000-25000', '25000-50000', '50000-100000', '100000+'
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  
  // Resilience (Q14-Q15)
  powerQualityIssues: string[]; // ['voltage_fluctuations', 'demand_penalties', 'transformer_overload', 'reefer_trips', 'none']
  outageSensitivity: 'critical' | 'high' | 'moderate' | 'low';
  
  // Planning (Q16)
  expansionPlans: string[]; // ['add_ev_charging', 'more_reefer_spots', 'expand_restaurant', 'add_truck_wash', 'solar_canopy', 'none']
}

export interface TruckStop16QResult {
  // Power Metrics
  peakKW: number;
  baseLoadKW: number;
  
  // BESS Sizing
  bessKWh: number;
  bessMW: number;
  durationHours: number;
  
  // Confidence & Methodology
  confidence: number;
  methodology: string;
  auditTrail: Array<{
    standard: string;
    value: number;
    description: string;
    url: string;
  }>;
  
  // Load Profile
  loadProfile: {
    baseLoadKW: number;
    peakHour: number;
    dailyKWh: number;
    reeferContribution: number;
  };
  
  // Financial Estimates
  estimatedSavings: {
    demandChargeReduction: number;
    arbitragePotential: number;
    annualSavings: number;
  };
  
  // Recommendations
  warnings: string[];
  recommendations: string[];
}

// =============================================================================
// ENGINEERING DATABASE
// =============================================================================

/**
 * Truck stop type baseline profiles (kW)
 * Source: National Association of Truck Stop Operators (NATSO), industry data
 */
const TRUCK_STOP_PROFILES = {
  basic_fuel: {
    baseKW: 50,          // Pumps, basic lighting, POS
    peakMultiplier: 1.3,
    description: 'Basic fueling only, minimal amenities',
  },
  travel_center: {
    baseKW: 150,         // Full restaurant, showers, store
    peakMultiplier: 1.5,
    description: 'Full service with restaurant and amenities',
  },
  truck_plaza: {
    baseKW: 200,         // Large restaurant, extensive facilities
    peakMultiplier: 1.6,
    description: 'Large facility with extensive amenities',
  },
  fleet_facility: {
    baseKW: 100,         // Fleet operations, maintenance
    peakMultiplier: 1.4,
    description: 'Private fleet facility with maintenance',
  },
  mega_center: {
    baseKW: 300,         // Massive facility, multiple restaurants
    peakMultiplier: 1.8,
    description: 'Mega center with multiple restaurants and services',
  },
};

/**
 * Fueling position power requirements (kW per position)
 * Includes pumps, lighting, canopy
 */
const FUELING_POSITION_POWER = {
  diesel_pump: 5,        // High-flow diesel pump
  def_pump: 2,           // Diesel exhaust fluid
  lighting_per_island: 3,
  canopy_hvac: 10,
};

/**
 * Facility amenity power requirements (kW)
 */
const AMENITY_POWER = {
  restaurant: 100,              // Kitchen, HVAC, dining area
  showers: 40,                  // Water heaters, HVAC
  laundry: 60,                  // Washers, dryers
  convenience_store: 30,        // Refrigeration, lighting, HVAC
  truck_wash: 80,               // Pumps, blowers, heaters
  maintenance_bays: 50,         // Tools, lighting, lifts
  reefer_parking: 0,            // Calculated separately
  scales: 5,                    // Scale electronics
  ev_charging: 100,             // Fast charging stations (diversity-adjusted)
};

/**
 * Refrigeration (reefer) power requirements
 * Reefer parking spots for temperature-controlled trailers
 */
const REEFER_POWER = {
  none: 0,
  minimal: 50,        // 5-10 spots @ 7 kW each with diversity
  moderate: 150,      // 15-25 spots
  extensive: 300,     // 30+ spots
};

// =============================================================================
// MAIN CALCULATOR
// =============================================================================

export function calculateTruckStop16Q(input: TruckStop16QInput): TruckStop16QResult {
  // 1. Base load from truck stop type
  const profile = TRUCK_STOP_PROFILES[input.truckStopType];
  let baseLoad = profile.baseKW;
  
  // 2. Fueling position load
  const positionCount = parseFuelingPositions(input.fuelingPositions);
  const fuelingLoad = positionCount * (FUELING_POSITION_POWER.diesel_pump + 
                                       FUELING_POSITION_POWER.def_pump + 
                                       FUELING_POSITION_POWER.lighting_per_island);
  baseLoad += fuelingLoad;
  
  // 3. Amenity loads
  let amenityLoad = 0;
  input.majorFacilities.forEach(facility => {
    amenityLoad += AMENITY_POWER[facility as keyof typeof AMENITY_POWER] || 0;
  });
  baseLoad += amenityLoad;
  
  // 4. Refrigeration load (reefer parking)
  const reeferLoad = REEFER_POWER[input.refrigerationLoad];
  const reeferUtilization = parseReeferUtilization(input.reeferUtilization);
  const activeReeferLoad = reeferLoad * reeferUtilization;
  
  // 5. Total nameplate load
  const nameplateLoad = baseLoad + activeReeferLoad;
  
  // 6. Calculate peak demand with diversity
  const peakKW = Math.round(nameplateLoad * profile.peakMultiplier);
  
  // 7. Base load (24/7 operation for truck stops)
  const baseLoadKW = Math.round(peakKW * 0.65); // 65% base load (lighting, refrigeration, minimal HVAC)
  
  // 8. BESS sizing - IEEE 4538388 standard (40% for peak shaving)
  const bessRatio = BESS_POWER_RATIOS.peak_shaving || 0.40;
  const bessMW = (peakKW * bessRatio) / 1000;
  
  // 9. Duration sizing (4 hours standard)
  const durationHours = 4;
  const bessKWh = Math.round(bessMW * 1000 * durationHours);
  
  // 10. Daily energy calculation
  // Truck stops have relatively flat load profile (24/7 operation)
  const peakHours = 8; // 8 hours peak traffic
  const dailyKWh = Math.round(baseLoadKW * 16 + peakKW * peakHours);
  
  // 11. Financial estimates
  const demandCharge = 25; // $/kW/month typical for truck stops (higher than average)
  const demandChargeReduction = Math.round(bessMW * 1000 * demandCharge * 12);
  
  const rateStructure = input.utilityRateStructure;
  const rateMultiplier = 
    rateStructure === 'flat' ? 0.5 :
    rateStructure === 'tou' ? 0.8 :
    rateStructure === 'demand' ? 1.0 :
    rateStructure === 'tou_demand' ? 1.2 : 0.8;
  
  const arbitragePotential = Math.round(bessKWh * 0.10 * 365 * 0.6 * rateMultiplier);
  const annualSavings = demandChargeReduction + arbitragePotential;
  
  // 12. Confidence scoring
  let confidence = 0.70;
  
  if (input.electricalServiceSize !== 'not_sure') confidence += 0.05;
  if (input.monthlyElectricitySpend !== 'not_sure') confidence += 0.05;
  if (input.majorFacilities.length >= 4) confidence += 0.05;
  if (input.utilityRateStructure !== 'not_sure') confidence += 0.05;
  
  confidence = Math.min(0.90, confidence);
  
  // 13. Methodology
  const methodology = `Truck stop reconstruction: ${input.truckStopType} (${profile.baseKW} kW base) + ${positionCount} fueling positions (${fuelingLoad} kW) + amenities (${amenityLoad} kW) + reefer parking (${Math.round(activeReeferLoad)} kW) × ${profile.peakMultiplier}x diversity = ${peakKW} kW peak. BESS sized at ${(bessRatio * 100).toFixed(0)}% of peak per IEEE 4538388.`;
  
  // 14. Warnings
  const warnings: string[] = [];
  
  if (input.electricalServiceSize !== 'not_sure') {
    const serviceKW = parseServiceSize(input.electricalServiceSize);
    if (peakKW > serviceKW) {
      warnings.push(`Peak load (${peakKW} kW) exceeds service rating (${serviceKW} kW). Service upgrade required.`);
    }
  }
  
  if (activeReeferLoad > 200 && !input.majorFacilities.includes('reefer_parking')) {
    warnings.push('High refrigeration load detected but reefer parking not listed in facilities.');
  }
  
  if (input.expansionPlans.includes('add_ev_charging') && peakKW > 800) {
    warnings.push('Adding EV charging to already high load may require service upgrade and load management.');
  }
  
  // 15. Recommendations
  const recommendations: string[] = [];
  
  if (demandChargeReduction > 30000) {
    recommendations.push('Excellent BESS ROI potential with high demand charges at truck stops.');
  }
  
  if (activeReeferLoad > 100) {
    recommendations.push('Reefer parking load management with BESS can reduce peak demand by 20-30%.');
  }
  
  if (input.expansionPlans.includes('solar_canopy')) {
    recommendations.push('Solar canopy over fueling islands + BESS offers best ROI and provides shade.');
  }
  
  if (input.majorFacilities.includes('ev_charging') || input.expansionPlans.includes('add_ev_charging')) {
    recommendations.push('BESS enables higher power EV charging without service upgrade.');
  }
  
  if (input.operatingHours === '24/7_full' && baseLoadKW > 300) {
    recommendations.push('24/7 operation with high base load is ideal for demand charge reduction.');
  }
  
  // Return result
  return {
    peakKW,
    baseLoadKW,
    bessKWh,
    bessMW,
    durationHours,
    confidence,
    methodology,
    auditTrail: [
      {
        standard: 'IEEE 4538388, MDPI Energies 11(8):2048',
        value: bessRatio,
        description: `BESS/Peak ratio for commercial peak shaving (${(bessRatio * 100).toFixed(0)}%)`,
        url: 'https://ieeexplore.ieee.org/document/4538388',
      },
      {
        standard: 'NATSO Industry Standards',
        value: profile.peakMultiplier,
        description: `${input.truckStopType} diversity factor (${profile.peakMultiplier}x)`,
        url: 'https://www.natso.com',
      },
    ],
    loadProfile: {
      baseLoadKW,
      peakHour: parseHour(input.peakTrafficHours),
      dailyKWh,
      reeferContribution: Math.round(activeReeferLoad),
    },
    estimatedSavings: {
      demandChargeReduction,
      arbitragePotential,
      annualSavings,
    },
    warnings,
    recommendations,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseFuelingPositions(range: string): number {
  const map: Record<string, number> = {
    '1-4': 3,
    '5-8': 6,
    '9-16': 12,
    '17-32': 24,
    '33+': 40,
  };
  return map[range] || 6;
}

function parseReeferUtilization(range: string): number {
  const map: Record<string, number> = {
    'none': 0,
    '<25%': 0.20,
    '25-50%': 0.37,
    '50-75%': 0.62,
    '75-100%': 0.87,
  };
  return map[range] || 0;
}

function parseServiceSize(size: string): number {
  const map: Record<string, number> = {
    '400': 96,
    '800': 192,
    '1600': 384,
    '2000': 480,
    '3000+': 720,
  };
  return map[size] || 384;
}

function parseHour(period: string): number {
  const map: Record<string, number> = {
    'early_morning': 6,
    'morning': 9,
    'midday': 13,
    'evening': 18,
    'night': 22,
    'variable': 13,
  };
  return map[period] || 13;
}

/**
 * Quick estimate for UI previews
 */
export function estimateTruckStopQuick(
  truckStopType: string,
  positions: number
): { peakKW: number; bessKWh: number; confidence: number } {
  const profile = TRUCK_STOP_PROFILES[truckStopType as keyof typeof TRUCK_STOP_PROFILES] || TRUCK_STOP_PROFILES.travel_center;
  const baseLoad = profile.baseKW + positions * 10;
  const peakKW = Math.round(baseLoad * profile.peakMultiplier);
  const bessRatio = BESS_POWER_RATIOS.peak_shaving || 0.40;
  const bessKWh = Math.round(peakKW * bessRatio * 4);
  
  return {
    peakKW,
    bessKWh,
    confidence: 0.65,
  };
}
