/**
 * HOTEL 16Q CALCULATOR SERVICE
 * 
 * Room-based load reconstruction from 16 standardized questions
 * Feeds WizardV6 and WizardV7 with accurate BESS sizing
 * 
 * Engineering Approach:
 * 1. Room-based baseline (hotel class + room count)
 * 2. Amenity loads (pool, restaurant, spa, fitness, EV charging)
 * 3. HVAC system type and efficiency
 * 4. Occupancy factor (seasonality)
 * 5. BESS sizing (IEEE 4538388 ratio + TrueQuote™)
 */

import { BESS_POWER_RATIOS } from '@/components/wizard/v6/constants';

// =============================================================================
// TYPES
// =============================================================================

export interface Hotel16QInput {
  // Topology (Q1-Q2)
  hotelClass: 'economy' | 'midscale' | 'upscale' | 'luxury' | 'resort';
  roomCount: string; // '50-100', '100-150', '150-250', '250-500', '500+'
  
  // Infrastructure (Q3-Q4)
  electricalServiceSize: '400' | '800' | '1600' | '2000+' | 'not_sure';
  voltageLevel: '208' | '240' | '277_480' | '480_3phase' | 'not_sure';
  
  // Equipment (Q5-Q7)
  majorAmenities: string[]; // ['pool', 'restaurant', 'spa', 'fitness_center', 'ev_charging', 'conference_center', 'kitchen', 'laundry_onsite']
  hvacSystem: 'window_units' | 'central_ac' | 'vrf_vav' | 'geothermal' | 'mixed';
  waterHeating: 'electric_tank' | 'electric_on_demand' | 'gas' | 'solar_thermal' | 'heat_pump';
  
  // Operations (Q8-Q11)
  averageOccupancy: '<50%' | '50-70%' | '70-85%' | '85-95%' | '>95%';
  peakSeasonMonths: string; // '3-4', '5-6', '7-9', '10-12'
  operatingHours: 'front_desk_only' | 'limited_services' | 'full_service_limited' | 'full_service_24hr';
  peakCheckInTime: 'morning' | 'afternoon' | 'evening' | 'variable';
  
  // Financial (Q12-Q13)
  monthlyElectricitySpend: string; // '<5000', '5000-15000', '15000-30000', '30000-75000', '75000+'
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  
  // Resilience (Q14-Q15)
  backupPowerNeeds: string[]; // ['emergency_lighting', 'elevators', 'fire_safety', 'hvac_partial', 'kitchen', 'full_operations', 'none']
  outageSensitivity: 'critical' | 'high' | 'moderate' | 'low';
  
  // Planning (Q16)
  expansionPlans: string[]; // ['add_rooms', 'add_ev_chargers', 'add_restaurant', 'add_conference', 'add_spa', 'solar', 'none']
}

export interface Hotel16QResult {
  // Power Metrics
  peakKW: number;
  baseLoadKW: number;
  
  // BESS Sizing
  bessKWh: number;
  bessMW: number;
  durationHours: number;
  
  // Confidence & Methodology
  confidence: number; // 0.70-0.90
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
    peakHour: number; // 0-23
    dailyKWh: number;
    occupancyFactor: number;
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
 * Hotel class baseline power profiles (kW per room)
 * Source: ASHRAE Handbook, Energy Star Portfolio Manager, CBECS
 */
const HOTEL_CLASS_PROFILES = {
  economy: {
    kWPerRoom: 2.5,      // Basic HVAC, lighting, TV
    peakFactor: 1.4,     // Lower diversity
    description: 'Limited service, basic amenities',
  },
  midscale: {
    kWPerRoom: 3.5,      // Standard HVAC, mini-fridge, better lighting
    peakFactor: 1.5,
    description: 'Full service, breakfast, meeting rooms',
  },
  upscale: {
    kWPerRoom: 5.0,      // Better HVAC, larger rooms, more electronics
    peakFactor: 1.6,
    description: 'Full service, restaurant, fitness center',
  },
  luxury: {
    kWPerRoom: 7.5,      // High-end HVAC, premium amenities, larger suites
    peakFactor: 1.8,
    description: 'Full service, spa, fine dining, concierge',
  },
  resort: {
    kWPerRoom: 10.0,     // Extensive amenities, pools, multiple restaurants
    peakFactor: 2.0,
    description: 'Destination resort, extensive facilities',
  },
};

/**
 * Amenity power requirements (kW)
 * Source: Industry data, equipment manufacturer specs
 */
const AMENITY_POWER = {
  pool: 50,                  // Pumps, heaters, lighting
  restaurant: 75,            // Kitchen equipment, HVAC, lighting
  spa: 40,                   // Heaters, pumps, lighting
  fitness_center: 30,        // Equipment, HVAC, lighting
  ev_charging: 50,           // 7.2 kW × 7 chargers with diversity
  conference_center: 60,     // AV, HVAC, lighting
  kitchen: 100,              // Commercial kitchen equipment
  laundry_onsite: 80,        // Washers, dryers, hot water
};

/**
 * HVAC system efficiency multipliers
 */
const HVAC_MULTIPLIERS = {
  window_units: 1.3,         // Inefficient
  central_ac: 1.0,           // Baseline
  vrf_vav: 0.75,            // Variable refrigerant flow / variable air volume
  geothermal: 0.6,          // Most efficient
  mixed: 1.1,               // Average of mixed systems
};

/**
 * Water heating power requirements (kW)
 */
const WATER_HEATING_POWER = {
  electric_tank: 50,         // Standard tank heaters
  electric_on_demand: 40,    // Tankless, lower average load
  gas: 10,                   // Minimal electric (controls)
  solar_thermal: 15,         // Electric backup
  heat_pump: 25,             // Efficient heat pump water heater
};

// =============================================================================
// MAIN CALCULATOR
// =============================================================================

/**
 * Calculate hotel power metrics and BESS sizing from 16Q answers
 */
export function calculateHotel16Q(input: Hotel16QInput): Hotel16QResult {
  // Parse room count
  const roomCountMid = parseRoomCount(input.roomCount);
  
  // 1. Base load from room count and hotel class
  const profile = HOTEL_CLASS_PROFILES[input.hotelClass];
  const baseRoomLoad = roomCountMid * profile.kWPerRoom;
  
  // 2. Add amenity loads
  let amenityLoad = 0;
  input.majorAmenities.forEach(amenity => {
    amenityLoad += AMENITY_POWER[amenity as keyof typeof AMENITY_POWER] || 0;
  });
  
  // 3. Add water heating load
  const waterHeatingLoad = WATER_HEATING_POWER[input.waterHeating];
  
  // 4. Calculate total nameplate load
  const nameplateLoad = baseRoomLoad + amenityLoad + waterHeatingLoad;
  
  // 5. Apply HVAC efficiency multiplier
  const hvacMultiplier = HVAC_MULTIPLIERS[input.hvacSystem];
  const hvacAdjustedLoad = nameplateLoad * hvacMultiplier;
  
  // 6. Apply occupancy factor
  const occupancyFactor = parseOccupancy(input.averageOccupancy);
  const occupancyAdjustedLoad = hvacAdjustedLoad * occupancyFactor;
  
  // 7. Calculate peak demand (diversity factor from hotel class)
  const peakKW = Math.round(occupancyAdjustedLoad * profile.peakFactor);
  
  // 8. Calculate base load (70% of peak for hotels - constant HVAC, lighting)
  const baseLoadKW = Math.round(peakKW * 0.7);
  
  // 9. BESS sizing - IEEE 4538388 standard (40% for peak shaving)
  const bessRatio = BESS_POWER_RATIOS.peak_shaving || 0.40;
  const bessMW = (peakKW * bessRatio) / 1000;
  
  // 10. Duration sizing (4 hours standard for peak shaving)
  const durationHours = 4;
  const bessKWh = Math.round(bessMW * 1000 * durationHours);
  
  // 11. Daily energy calculation
  const dailyKWh = Math.round(baseLoadKW * 24 + (peakKW - baseLoadKW) * 12); // 12 hours peak
  
  // 12. Financial estimates
  const demandCharge = 20; // $/kW/month typical for hotels
  const demandChargeReduction = Math.round(bessMW * 1000 * demandCharge * 12);
  
  const rateStructure = input.utilityRateStructure;
  const rateMultiplier = 
    rateStructure === 'flat' ? 0.5 :
    rateStructure === 'tou' ? 0.8 :
    rateStructure === 'demand' ? 1.0 :
    rateStructure === 'tou_demand' ? 1.2 : 0.8;
  
  const arbitragePotential = Math.round(bessKWh * 0.10 * 365 * 0.5 * rateMultiplier);
  const annualSavings = demandChargeReduction + arbitragePotential;
  
  // 13. Confidence scoring (base 0.70)
  let confidence = 0.70;
  
  // Bonuses
  if (input.electricalServiceSize !== 'not_sure') confidence += 0.05;
  if (input.monthlyElectricitySpend !== 'not_sure') confidence += 0.05;
  if (input.majorAmenities.length >= 3) confidence += 0.05;
  if (input.utilityRateStructure !== 'not_sure') confidence += 0.05;
  
  // Cap at 0.90
  confidence = Math.min(0.90, confidence);
  
  // 14. Build methodology string
  const methodology = `Room-based reconstruction: ${input.hotelClass} hotel (${profile.kWPerRoom} kW/room × ${roomCountMid} rooms) × ${occupancyFactor.toFixed(2)} occupancy × ${profile.peakFactor}x diversity = ${peakKW} kW peak. HVAC efficiency: ${hvacMultiplier}x. Amenities add ${amenityLoad} kW. BESS sized at ${(bessRatio * 100).toFixed(0)}% of peak per IEEE 4538388 standard.`;
  
  // 15. Warnings
  const warnings: string[] = [];
  
  // Check service size constraint
  if (input.electricalServiceSize !== 'not_sure') {
    const serviceKW = parseServiceSize(input.electricalServiceSize);
    if (peakKW > serviceKW) {
      warnings.push(`Peak load (${peakKW} kW) exceeds service rating (${serviceKW} kW). Service upgrade may be required.`);
    }
  }
  
  // Backup power warning
  if (input.backupPowerNeeds.includes('full_operations') && durationHours < 8) {
    warnings.push('Full operations backup requires larger BESS (8+ hours). Consider generator integration.');
  }
  
  // 16. Recommendations
  const recommendations: string[] = [];
  
  if (demandChargeReduction > 20000) {
    recommendations.push('Excellent BESS ROI potential with high demand charges.');
  }
  
  if (input.majorAmenities.includes('ev_charging')) {
    recommendations.push('EV charger load management can reduce peak demand by 20-30%.');
  }
  
  if (input.hvacSystem === 'window_units' || input.hvacSystem === 'central_ac') {
    recommendations.push('HVAC upgrade to VRF/VAV could reduce energy consumption by 25%.');
  }
  
  if (input.expansionPlans.includes('solar')) {
    recommendations.push('Solar + BESS combination offers best ROI for hotels with daytime peak loads.');
  }
  
  if (occupancyFactor < 0.65) {
    recommendations.push('Lower occupancy reduces BESS ROI. Consider energy efficiency improvements first.');
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
        standard: 'ASHRAE Handbook - Hospitality',
        value: profile.kWPerRoom,
        description: `${input.hotelClass} hotel power density (${profile.kWPerRoom} kW/room)`,
        url: 'https://www.ashrae.org',
      },
    ],
    loadProfile: {
      baseLoadKW,
      peakHour: 18, // 6 PM typical hotel peak (evening check-in, dinner, activities)
      dailyKWh,
      occupancyFactor,
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

function parseRoomCount(range: string): number {
  const map: Record<string, number> = {
    '50-100': 75,
    '100-150': 125,
    '150-250': 200,
    '250-500': 375,
    '500+': 600,
  };
  return map[range] || 125;
}

function parseOccupancy(range: string): number {
  const map: Record<string, number> = {
    '<50%': 0.40,
    '50-70%': 0.60,
    '70-85%': 0.77,
    '85-95%': 0.90,
    '>95%': 0.97,
  };
  return map[range] || 0.77;
}

function parseServiceSize(size: string): number {
  const map: Record<string, number> = {
    '400': 96,    // 400A @ 240V
    '800': 192,   // 800A @ 240V
    '1600': 384,  // 1600A @ 240V
    '2000+': 480, // 2000A @ 240V
  };
  return map[size] || 192;
}

/**
 * Quick estimate for UI previews (without full 16Q data)
 */
export function estimateHotelQuick(
  hotelClass: string,
  roomCount: number
): { peakKW: number; bessKWh: number; confidence: number } {
  const profile = HOTEL_CLASS_PROFILES[hotelClass as keyof typeof HOTEL_CLASS_PROFILES] || HOTEL_CLASS_PROFILES.midscale;
  const baseLoad = roomCount * profile.kWPerRoom;
  const peakKW = Math.round(baseLoad * profile.peakFactor * 0.77); // Assume 77% occupancy
  const bessRatio = BESS_POWER_RATIOS.peak_shaving || 0.40;
  const bessKWh = Math.round(peakKW * bessRatio * 4);
  
  return {
    peakKW,
    bessKWh,
    confidence: 0.65, // Lower confidence without full data
  };
}
