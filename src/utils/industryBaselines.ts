/**
 * @deprecated This file is DEPRECATED as of Phase 24 baseline service migration
 * 
 * ⚠️ DO NOT USE THIS FILE FOR NEW CODE ⚠️
 * 
 * Use `/src/services/baselineService.ts` instead, which provides:
 * - Database-driven calculations (single source of truth)
 * - Consistency between wizard and AI recommendations
 * - Easy updates without code changes
 * - Proper async/await patterns
 * 
 * This file contains hardcoded values that can diverge from database values.
 * It is kept for reference only and will be removed in a future update.
 * 
 * Migration Status:
 * - ✅ SmartWizardV2 migrated to baselineService.ts
 * - ✅ aiOptimizationService migrated to baselineService.ts
 * - ⏳ Remaining files to migrate: See BASELINE_SERVICE_MIGRATION.md
 * 
 * ---
 * 
 * Authoritative Industry Baseline Calculations (LEGACY)
 * 
 * SINGLE SOURCE OF TRUTH for all power sizing calculations across the platform.
 * 
 * Data Sources:
 * - NREL Commercial Reference Buildings
 * - ASHRAE 90.1 Standards
 * - DOE/EIA CBECS (Commercial Buildings Energy Consumption Survey)
 * - IEEE 2450 Battery Energy Storage Standards
 * - Real-world deployment data from EPRI Energy Storage Database
 * 
 * Last Updated: Q4 2025
 */

export interface IndustryBaseline {
  industry: string;
  powerMWPerUnit: number; // Power per unit (e.g., MW per room, MW per sq ft)
  scaleUnit: string; // The unit type (rooms, sq_ft, MW_IT_load, etc.)
  typicalDurationHrs: number;
  solarRatio: number; // Ratio of solar to battery capacity
  description: string;
  dataSource: string;
}

/**
 * Industry baseline power calculations
 * All values validated against authoritative sources
 * 
 * @deprecated Use calculateDatabaseBaseline() from baselineService.ts instead
 */
export const INDUSTRY_BASELINES: Record<string, IndustryBaseline> = {
  // HOSPITALITY & COMMERCIAL
  'hotel': {
    industry: 'Hotel',
    powerMWPerUnit: 0.00293, // 2.93 kW per room (CBECS hospitality median: 440kW/150 rooms)
    scaleUnit: 'rooms',
    typicalDurationHrs: 4,
    solarRatio: 1.0,
    description: 'Based on ASHRAE 90.1 Lodging Standards & CBECS 2018 Hospitality Data',
    dataSource: 'CBECS 2018, ASHRAE 90.1, src/data/useCaseTemplates.ts line 560'
  },
  
  'casino': {
    industry: 'Casino',
    powerMWPerUnit: 3.0, // Base for typical casino
    scaleUnit: 'facility',
    typicalDurationHrs: 12,
    solarRatio: 0.8,
    description: '24/7 operations with high energy density',
    dataSource: 'NREL Commercial Reference Buildings'
  },
  
  'shopping-center': {
    industry: 'Shopping Center',
    powerMWPerUnit: 0.000025, // 25 W per sq ft (CBECS retail median)
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 6,
    solarRatio: 1.5,
    description: 'Retail operations with daytime peaks',
    dataSource: 'CBECS 2018 Retail/Mall Data'
  },
  
  // HEALTHCARE
  'hospital': {
    industry: 'Hospital',
    powerMWPerUnit: 0.000035, // 35 W per sq ft (CBECS healthcare)
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 8,
    solarRatio: 1.0,
    description: '24/7 critical operations with high reliability requirements',
    dataSource: 'CBECS 2018 Healthcare, ASHRAE 90.1 Healthcare'
  },
  
  'medical-office': {
    industry: 'Medical Office',
    powerMWPerUnit: 0.000022, // 22 W per sq ft
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 6,
    solarRatio: 1.2,
    description: 'Outpatient facilities with business hours operation',
    dataSource: 'CBECS 2018 Outpatient Healthcare'
  },
  
  // OFFICE & COMMERCIAL
  'office': {
    industry: 'Office Building',
    powerMWPerUnit: 0.000018, // 18 W per sq ft (CBECS office median)
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 4,
    solarRatio: 1.0,
    description: 'Standard commercial office with business hours',
    dataSource: 'CBECS 2018 Office Buildings, ASHRAE 90.1'
  },
  
  // INDUSTRIAL & MANUFACTURING
  'manufacturing': {
    industry: 'Manufacturing',
    powerMWPerUnit: 1.5, // Per production line base
    scaleUnit: 'production_lines',
    typicalDurationHrs: 6,
    solarRatio: 1.2,
    description: 'Shift operations with high equipment loads',
    dataSource: 'DOE Industrial Assessment Centers Database'
  },
  
  'data-center': {
    industry: 'Data Center',
    powerMWPerUnit: 1.0, // Per MW of IT load (PUE factor built in)
    scaleUnit: 'IT_load_MW',
    typicalDurationHrs: 8,
    solarRatio: 0.6,
    description: '24/7 operations with critical uptime requirements',
    dataSource: 'Uptime Institute, ASHRAE TC 9.9 Data Center Standards'
  },
  
  'cold-storage': {
    industry: 'Cold Storage',
    powerMWPerUnit: 0.8, // Temperature-critical facility
    scaleUnit: 'facility',
    typicalDurationHrs: 12,
    solarRatio: 1.5,
    description: 'Refrigeration with extended outage protection needs',
    dataSource: 'ASHRAE Refrigeration Handbook'
  },
  
  'warehouse': {
    industry: 'Warehouse',
    powerMWPerUnit: 0.000003, // 3 W per sq ft
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 6,
    solarRatio: 1.8,
    description: 'Distribution operations with moderate energy use',
    dataSource: 'CBECS 2018 Warehouse/Storage'
  },
  
  // RESIDENTIAL & MULTI-TENANT
  'apartment': {
    industry: 'Apartment Complex',
    powerMWPerUnit: 0.0025, // 2.5 kW per unit
    scaleUnit: 'units',
    typicalDurationHrs: 4,
    solarRatio: 1.3,
    description: 'Multi-family residential with common areas',
    dataSource: 'EIA RECS 2020, Multi-family Buildings'
  },
  
  // TRANSPORTATION & EV
  'ev-charging': {
    industry: 'EV Charging Station',
    powerMWPerUnit: 1.0, // Calculated based on charger mix
    scaleUnit: 'calculated',
    typicalDurationHrs: 2,
    solarRatio: 1.0,
    description: 'Calculated from Level 2 and DC Fast charger specifications',
    dataSource: 'DOE Alt Fuels Data Center, src/data/useCaseTemplates.ts line 143'
  },
  
  'airport': {
    industry: 'Airport',
    powerMWPerUnit: 0.00004, // 40 W per sq ft
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 8,
    solarRatio: 1.0,
    description: '24/7 operations with high energy density',
    dataSource: 'FAA Airport Energy Studies'
  },
  
  // AGRICULTURE
  'indoor-farm': {
    industry: 'Indoor Farm (CEA)',
    powerMWPerUnit: 0.000045, // 45 W per sq ft growing area
    scaleUnit: 'sq_ft_growing',
    typicalDurationHrs: 12,
    solarRatio: 2.0,
    description: 'Controlled Environment Agriculture with 24/7 lighting and climate control',
    dataSource: 'src/data/useCaseTemplates.ts line 777, CEA industry data'
  },
  
  'agriculture': {
    industry: 'Agricultural Operations',
    powerMWPerUnit: 1.0, // Per facility
    scaleUnit: 'facility',
    typicalDurationHrs: 6,
    solarRatio: 2.0,
    description: 'Irrigation, processing, and cold storage',
    dataSource: 'USDA Agricultural Energy Studies'
  },
  
  // RETAIL & SERVICE
  'car-wash': {
    industry: 'Car Wash',
    powerMWPerUnit: 0.053, // 53 kW per bay (from useCaseTemplates.ts line 49)
    scaleUnit: 'bays',
    typicalDurationHrs: 3,
    solarRatio: 1.8,
    description: 'High peak demand from wash equipment and water heaters',
    dataSource: 'NREL Commercial Buildings, src/data/useCaseTemplates.ts line 43-49'
  },
  
  'retail': {
    industry: 'Retail Store',
    powerMWPerUnit: 0.000020, // 20 W per sq ft
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 4,
    solarRatio: 1.3,
    description: 'Retail operations with daytime peaks',
    dataSource: 'CBECS 2018 Retail Buildings'
  },
  
  // EDUCATION
  'university': {
    industry: 'University Campus',
    powerMWPerUnit: 0.000025, // 25 W per sq ft
    scaleUnit: 'sq_ft',
    typicalDurationHrs: 5,
    solarRatio: 1.3,
    description: 'Educational facilities with variable occupancy',
    dataSource: 'CBECS 2018 Education Buildings, ASHRAE Schools Standards'
  }
};

/**
 * Calculate industry-appropriate baseline configuration
 * 
 * @deprecated Use calculateDatabaseBaseline() from /src/services/baselineService.ts instead
 * 
 * This function uses hardcoded values and is no longer maintained.
 * The new baselineService provides database-driven calculations that ensure
 * consistency between wizard and AI recommendations.
 * 
 * @param industry - Industry type (must match key in INDUSTRY_BASELINES)
 * @param scale - Scale value (number of rooms, sq ft, etc.)
 * @param useCaseData - Optional additional data for complex calculations
 * @returns Recommended power (MW), duration (hrs), and solar (MW)
 */
export function calculateIndustryBaseline(
  industry: string,
  scale: number,
  useCaseData?: Record<string, any>
): {
  powerMW: number;
  durationHrs: number;
  solarMW: number;
  description: string;
  dataSource: string;
} {
  const baseline = INDUSTRY_BASELINES[industry];
  
  if (!baseline) {
    console.warn(`No baseline found for industry: ${industry}. Using generic defaults.`);
    return {
      powerMW: 2.0,
      durationHrs: 4,
      solarMW: 2.0,
      description: 'Generic baseline - no specific industry data available',
      dataSource: 'Default fallback'
    };
  }
  
  let powerMW: number;
  
  // Special case: EV charging requires calculation from charger mix
  if (industry === 'ev-charging' && useCaseData) {
    const level2Count = parseInt(useCaseData.level2Chargers) || 0;
    const level2Power = parseFloat(useCaseData.level2Power) || 11; // kW
    const dcFastCount = parseInt(useCaseData.dcFastChargers) || 0;
    const dcFastPower = parseFloat(useCaseData.dcFastPower) || 150; // kW
    const concurrency = Math.min(parseInt(useCaseData.peakConcurrency) || 50, 80) / 100;
    
    const totalLevel2 = (level2Count * level2Power) / 1000; // MW
    const totalDCFast = (dcFastCount * dcFastPower) / 1000; // MW
    const totalCharging = totalLevel2 + totalDCFast;
    
    console.log('🔌 EV Charging Calculation:', {
      level2Count,
      level2Power,
      dcFastCount,
      dcFastPower,
      concurrency,
      totalLevel2,
      totalDCFast,
      totalCharging
    });
    
    // Battery sized for demand management (60-70% of peak with concurrency)
    powerMW = Math.max(0.5, Math.min(totalCharging * concurrency * 0.7, totalCharging * 0.8));
    
    console.log('🔋 Recommended Battery Size:', powerMW, 'MW');
  } else {
    // Standard calculation: baseline * scale
    powerMW = baseline.powerMWPerUnit * scale;
  }
  
  // Apply reasonable bounds
  powerMW = Math.max(0.5, Math.min(powerMW, 50)); // Min 0.5 MW, Max 50 MW
  powerMW = Math.round(powerMW * 10) / 10; // Round to 1 decimal
  
  const durationHrs = baseline.typicalDurationHrs;
  const solarMW = Math.round(powerMW * baseline.solarRatio * 10) / 10;
  
  return {
    powerMW,
    durationHrs,
    solarMW,
    description: baseline.description,
    dataSource: baseline.dataSource
  };
}

/**
 * Get human-readable unit description
 */
export function getScaleUnitDescription(industry: string): string {
  const baseline = INDUSTRY_BASELINES[industry];
  if (!baseline) return 'units';
  
  const unitMap: Record<string, string> = {
    'rooms': 'guest rooms',
    'sq_ft': 'square feet',
    'facility': 'facility',
    'units': 'apartment units',
    'bays': 'wash bays',
    'production_lines': 'production lines',
    'IT_load_MW': 'MW of IT load',
    'calculated': 'charger configuration',
    'sq_ft_growing': 'sq ft of growing area'
  };
  
  return unitMap[baseline.scaleUnit] || baseline.scaleUnit;
}
