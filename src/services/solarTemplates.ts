/**
 * Industry Solar Templates
 * SSOT for solar capacity calculations by industry
 * 
 * Each template defines:
 * - Roof usable factor (% of roof actually available for solar)
 * - Carport usable factor (% of parking area usable)
 * - Solar density (kW per sq ft)
 * - Industry-specific assumptions
 */

export interface IndustrySolarTemplate {
  industry: string;
  displayName: string;
  
  // Calculation factors
  roofUsableFactor: number;      // 0-1 (percentage of roof usable)
  carportUsableFactor: number;   // 0-1 (percentage of carport usable)
  solarDensity: number;          // kW per sq ft installed
  
  // System sizing guidance
  defaultSystemSize: 'small' | 'medium' | 'large' | 'xlarge';
  typicalRoofArea: { min: number; max: number; typical: number };
  typicalCarportArea: { min: number; max: number; typical: number };
  
  // Configuration
  recommendedOrientation: 'south' | 'east-west' | 'flat';
  tiltAngle: number;  // degrees
  
  // Documentation
  assumptions: string[];
  notes: string;
}

export const SOLAR_TEMPLATES: Record<string, IndustrySolarTemplate> = {
  car_wash: {
    industry: 'car_wash',
    displayName: 'Car Wash',
    
    roofUsableFactor: 0.65,
    carportUsableFactor: 1.0,
    solarDensity: 0.150,  // 150W per sq ft
    
    defaultSystemSize: 'medium',
    typicalRoofArea: {
      min: 3000,
      max: 8000,
      typical: 5000
    },
    typicalCarportArea: {
      min: 1000,
      max: 3000,
      typical: 1500
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 15,
    
    assumptions: [
      '65% roof usable - accounts for HVAC units, vents, access paths, and setback requirements',
      '100% carport usable - purpose-built structure with no obstructions',
      'Modern 400W panels at 150W per sq ft installed density',
      'South-facing orientation preferred for maximum generation',
      '15° tilt angle optimized for car wash latitudes and snow load'
    ],
    notes: 'Car washes are ideal for solar due to high daytime energy usage coinciding with peak solar generation. Vacuum stations and water heating are the primary loads.'
  },
  
  hotel_hospitality: {
    industry: 'hotel_hospitality',
    displayName: 'Hotel & Hospitality',
    
    roofUsableFactor: 0.55,
    carportUsableFactor: 1.0,
    solarDensity: 0.150,
    
    defaultSystemSize: 'large',
    typicalRoofArea: {
      min: 10000,
      max: 50000,
      typical: 25000
    },
    typicalCarportArea: {
      min: 5000,
      max: 15000,
      typical: 8000
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 10,
    
    assumptions: [
      '55% roof usable - cooling towers, elevator penthouses, and rooftop equipment reduce available space',
      '100% carport usable - guest parking shade structures',
      'Modern 400W panels at 150W per sq ft installed density',
      'South-facing orientation for consistent generation',
      '10° tilt angle for hotel applications'
    ],
    notes: 'Hotels have high 24/7 energy demand. Solar paired with battery storage can reduce peak demand charges from HVAC and hot water systems.'
  },
  
  retail: {
    industry: 'retail',
    displayName: 'Retail',
    
    roofUsableFactor: 0.75,
    carportUsableFactor: 1.0,
    solarDensity: 0.150,
    
    defaultSystemSize: 'large',
    typicalRoofArea: {
      min: 20000,
      max: 100000,
      typical: 50000
    },
    typicalCarportArea: {
      min: 10000,
      max: 40000,
      typical: 20000
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 5,
    
    assumptions: [
      '75% roof usable - big box stores typically have minimal rooftop equipment',
      '100% carport usable - customer parking structures',
      'Modern 400W panels at 150W per sq ft installed density',
      'South-facing for maximum generation',
      '5° tilt angle minimizes wind load on large commercial roofs'
    ],
    notes: 'Large retail stores are excellent solar candidates with extensive roof area and high daytime energy demand for HVAC and refrigeration.'
  },
  
  warehouse_logistics: {
    industry: 'warehouse_logistics',
    displayName: 'Warehouse & Logistics',
    
    roofUsableFactor: 0.80,
    carportUsableFactor: 1.0,
    solarDensity: 0.150,
    
    defaultSystemSize: 'xlarge',
    typicalRoofArea: {
      min: 50000,
      max: 200000,
      typical: 100000
    },
    typicalCarportArea: {
      min: 20000,
      max: 80000,
      typical: 40000
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 5,
    
    assumptions: [
      '80% roof usable - warehouses have the cleanest roofs of any commercial building type',
      '100% carport usable - truck/trailer parking and loading dock covers',
      'Modern 400W panels at 150W per sq ft installed density',
      'South-facing for maximum generation',
      '5° tilt angle for minimal wind resistance on massive roofs'
    ],
    notes: 'Warehouses offer the largest solar potential due to extensive roof area. Battery storage enables load shifting for material handling equipment.'
  },
  
  manufacturing: {
    industry: 'manufacturing',
    displayName: 'Manufacturing',
    
    roofUsableFactor: 0.60,
    carportUsableFactor: 1.0,
    solarDensity: 0.150,
    
    defaultSystemSize: 'large',
    typicalRoofArea: {
      min: 30000,
      max: 150000,
      typical: 75000
    },
    typicalCarportArea: {
      min: 10000,
      max: 50000,
      typical: 25000
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 10,
    
    assumptions: [
      '60% roof usable - manufacturing facilities have significant rooftop HVAC, exhaust systems, and cranes',
      '100% carport usable - employee and shipping/receiving parking',
      'Modern 400W panels at 150W per sq ft installed density',
      'South-facing for maximum generation',
      '10° tilt angle for manufacturing applications'
    ],
    notes: 'Manufacturing facilities benefit from solar + storage to reduce demand charges from heavy machinery loads. Load shifting capabilities are critical.'
  }
};

/**
 * Get solar template for an industry
 */
export function getSolarTemplate(industry: string): IndustrySolarTemplate {
  return SOLAR_TEMPLATES[industry] || SOLAR_TEMPLATES.car_wash;
}

/**
 * System size categories
 */
export function getSystemSizeCategory(kW: number): string {
  if (kW < 25) return 'Small';
  if (kW < 100) return 'Medium';
  if (kW < 250) return 'Large';
  return 'Extra Large';
}

/**
 * Annual generation estimate (kWh)
 * Assumes 1,200 hours peak sun equivalent per year (national average)
 */
export function estimateAnnualGeneration(kW: number): number {
  const PEAK_SUN_HOURS_PER_YEAR = 1200;
  return kW * PEAK_SUN_HOURS_PER_YEAR;
}
