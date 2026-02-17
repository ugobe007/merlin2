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
    
    roofUsableFactor: 0.45,
    carportUsableFactor: 0.90,
    solarDensity: 0.015,  // 15 W/sqft installed density (NREL commercial rooftop standard)
    
    defaultSystemSize: 'small',
    typicalRoofArea: {
      min: 3000,
      max: 8000,
      typical: 5500
    },
    typicalCarportArea: {
      min: 1500,
      max: 4000,
      typical: 2800
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 15,
    
    assumptions: [
      '45% roof usable — car wash roofs have significant HVAC, water equipment, vents, and access paths',
      '90% carport usable — purpose-built solar canopy over vacuum/queue areas, minor losses for columns',
      '15 W/sqft installed density (NREL commercial rooftop standard, 400W panels with spacing)',
      'South-facing orientation preferred for maximum generation',
      '15° tilt angle optimized for car wash latitudes and snow load',
      'Rooftop max: ~37 kW typical (5,500 sqft × 45% usable × 15 W/sqft)',
      'Canopy adds: ~38 kW (2,800 sqft × 90% × 15 W/sqft) — essential for major operators'
    ],
    notes: 'Car wash rooftops typically support only 30-40 kW of solar (constrained by building footprint and rooftop equipment). Canopy solar over vacuum/queue areas is a must-have for major operators, adding 30-50+ kW. Combined roof + canopy: 70-90 kW typical.'
  },
  
  hotel_hospitality: {
    industry: 'hotel_hospitality',
    displayName: 'Hotel & Hospitality',
    
    roofUsableFactor: 0.35,
    carportUsableFactor: 0.90,
    solarDensity: 0.015,  // 15 W/sqft installed density (NREL standard)
    
    defaultSystemSize: 'large',
    typicalRoofArea: {
      min: 10000,
      max: 50000,
      typical: 20000
    },
    typicalCarportArea: {
      min: 5000,
      max: 20000,
      typical: 10000
    },
    
    recommendedOrientation: 'south',
    tiltAngle: 10,
    
    assumptions: [
      '35% roof usable — multi-story hotels have cooling towers, elevator penthouses, pool equipment, and significant rooftop HVAC',
      '90% carport usable — guest parking shade structures (purpose-built solar canopy)',
      '15 W/sqft installed density (NREL commercial rooftop standard)',
      'South-facing orientation for consistent generation',
      '10° tilt angle for hotel applications',
      'Rooftop max: ~105 kW typical (20,000 sqft footprint × 35% usable × 15 W/sqft)',
      'Parking canopy adds: ~135 kW (10,000 sqft × 90% × 15 W/sqft)'
    ],
    notes: 'Hotels have high 24/7 energy demand. Rooftop solar is limited by HVAC equipment and multi-story footprint constraints. Parking canopy solar is highly recommended for hotels with guest parking. Combined roof + canopy: 200-300 kW typical for mid-size hotels.'
  },
  
  retail: {
    industry: 'retail',
    displayName: 'Retail',
    
    roofUsableFactor: 0.70,
    carportUsableFactor: 0.90,
    solarDensity: 0.015,  // 15 W/sqft installed density (NREL standard)
    
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
      '70% roof usable — big box stores have clean flat roofs with minimal equipment',
      '90% carport usable — customer parking shade structures',
      '15 W/sqft installed density (NREL commercial rooftop standard)',
      'South-facing for maximum generation',
      '5° tilt angle minimizes wind load on large commercial roofs',
      'Rooftop max: ~525 kW typical (50,000 sqft × 70% × 15 W/sqft)',
      'Parking canopy adds: ~270 kW (20,000 sqft × 90% × 15 W/sqft)'
    ],
    notes: 'Large retail stores are excellent solar candidates with extensive flat roof area. Parking canopy solar provides customer shade while generating power. Combined roof + canopy: 500-800 kW typical.'
  },
  
  warehouse_logistics: {
    industry: 'warehouse_logistics',
    displayName: 'Warehouse & Logistics',
    
    roofUsableFactor: 0.80,
    carportUsableFactor: 0.90,
    solarDensity: 0.015,  // 15 W/sqft installed density (NREL standard)
    
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
      '80% roof usable — warehouses have the cleanest, flattest roofs of any commercial building',
      '90% carport usable — truck/trailer parking and loading dock covers',
      '15 W/sqft installed density (NREL commercial rooftop standard)',
      'South-facing for maximum generation',
      '5° tilt angle for minimal wind resistance on massive roofs',
      'Rooftop max: ~1,200 kW typical (100,000 sqft × 80% × 15 W/sqft)',
      'Dock canopy adds: ~540 kW (40,000 sqft × 90% × 15 W/sqft)'
    ],
    notes: 'Warehouses offer the largest rooftop solar potential in commercial real estate. 1+ MW rooftop systems are common. Battery storage enables load shifting for material handling equipment.'
  },
  
  manufacturing: {
    industry: 'manufacturing',
    displayName: 'Manufacturing',
    
    roofUsableFactor: 0.55,
    carportUsableFactor: 0.90,
    solarDensity: 0.015,  // 15 W/sqft installed density (NREL standard)
    
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
      '55% roof usable — manufacturing facilities have exhaust stacks, cranes, overhead doors, and heavy HVAC',
      '90% carport usable — employee and shipping/receiving parking',
      '15 W/sqft installed density (NREL commercial rooftop standard)',
      'South-facing for maximum generation',
      '10° tilt angle for manufacturing applications',
      'Rooftop max: ~619 kW typical (75,000 sqft × 55% × 15 W/sqft)',
      'Parking canopy adds: ~338 kW (25,000 sqft × 90% × 15 W/sqft)'
    ],
    notes: 'Manufacturing facilities benefit from solar + storage to reduce demand charges from heavy machinery. Roof obstructions (exhaust, cranes) reduce usable area vs warehouse. Combined roof + canopy: 600-1,000 kW typical.'
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
