/**
 * ⚠️ DEPRECATED - DO NOT USE FOR NEW CODE
 * 
 * Wizard utility functions
 * 
 * @deprecated This file is deprecated as of Dec 2025. Use:
 * - calculateUseCasePower() from src/services/useCasePowerCalculations.ts for power calculations
 * - calculateDatabaseBaseline() from src/services/baselineService.ts for baseline sizing
 * - POWER_DENSITY_STANDARDS from src/services/useCasePowerCalculations.ts for power density values
 * 
 * ⚠️ WARNING: This file has VALUES THAT DIFFER from the SSOT:
 * - warehouse: 5 W/sqft here vs 2.0 W/sqft in SSOT
 * - retail: 10 W/sqft here vs 8.0 W/sqft in SSOT
 * - hospital: 20 W/sqft here vs 10 kW/bed (different units!) in SSOT
 * 
 * DO NOT USE THESE VALUES - they may produce incorrect calculations!
 * 
 * Old purpose (no longer applicable):
 * - Power density calculations by building type
 * - Scale factor calculations for different industries
 * - Building-specific power requirements
 * - Use case specific sizing helpers
 */

// Log deprecation warning at runtime
if (typeof window !== 'undefined') {
  console.warn(
    '⚠️ DEPRECATED: wizardHelpers.ts is deprecated. ' +
    'Use calculateUseCasePower() from useCasePowerCalculations.ts instead. ' +
    'Values in this file may be INCORRECT and differ from SSOT.'
  );
}

/**
 * @deprecated Use calculateUseCasePower() from useCasePowerCalculations.ts instead
 * Calculate power density by building type (W/sq ft)
 * 
 * ⚠️ VALUES MAY BE INCORRECT - see useCasePowerCalculations.ts for authoritative values
 * 
 * @param buildingType - The type of building/facility
 * @param subType - Optional sub-type for more specific calculations
 * @returns Power density in W/sq ft
 */
export function getPowerDensity(buildingType: string, subType?: string): number {
  switch (buildingType) {
    case 'hotel':
      return 9; // 8-10 W/sq ft (24/7 operation, HVAC, kitchen, laundry)
    case 'datacenter':
    case 'data-center':
      return 150; // 100-200 W/sq ft (high-density IT loads)
    case 'tribal-casino':
    case 'casino':
      return 15; // 12-18 W/sq ft (gaming, lighting, 24/7 HVAC)
    case 'logistics-center':
    case 'warehouse':
      if (subType === 'cold-storage') return 25; // 20-30 W/sq ft (refrigeration)
      if (subType === 'fulfillment') return 8; // 6-10 W/sq ft (automation, conveyors)
      return 5; // 3-7 W/sq ft (standard warehouse)
    case 'shopping-center':
    case 'retail':
      return 10; // 8-12 W/sq ft (retail, HVAC, lighting)
    case 'office':
      return 6; // 5-7 W/sq ft (lighting, computers, HVAC)
    case 'hospital':
      return 20; // 18-25 W/sq ft (medical equipment, 24/7 operation)
    case 'indoor-farm':
      return 35; // 30-40 W/sq ft (grow lights, climate control)
    case 'cold-storage':
      return 25; // 20-30 W/sq ft (refrigeration loads)
    case 'manufacturing':
      return 12; // 10-15 W/sq ft (machinery, varies widely)
    case 'airport':
      return 8; // 6-10 W/sq ft (terminals, baggage, HVAC)
    case 'college':
    case 'university':
      return 7; // 5-9 W/sq ft (classrooms, labs, dorms)
    case 'apartment':
    case 'residential':
      return 4; // 3-5 W/sq ft (residential loads)
    case 'car-wash':
      return 18; // 15-20 W/sq ft (high water heating, pumps)
    default:
      return 7; // Generic commercial baseline
  }
}

/**
 * Calculate scale factor based on use case data
 * Converts facility size metrics into a standardized scale multiplier
 * 
 * @param selectedTemplate - Industry template ID
 * @param useCaseData - User answers from use case questionnaire
 * @returns Scale factor (typically 0.5 - 5.0)
 */
export function getScaleFactor(selectedTemplate: string, useCaseData: { [key: string]: any }): number {
  let scale = 1; // Default scale
  
  switch (selectedTemplate) {
    case 'hotel':
      scale = parseInt(useCaseData.numRooms) || 100; // Number of rooms
      return scale / 100; // Convert to scale factor (per 100 rooms)
      
    case 'car-wash':
      return parseInt(useCaseData.numBays) || 3; // Number of wash bays
      
    case 'hospital':
      scale = parseInt(useCaseData.bedCount) || 200; // Number of beds
      return scale / 100; // Convert to scale factor (per 100 beds)
      
    case 'college':
    case 'university':
      scale = parseInt(useCaseData.enrollment) || 5000; // Student enrollment
      return scale / 1000; // Convert to thousands
      
    case 'apartment':
    case 'residential':
      scale = parseInt(useCaseData.numUnits) || 100; // Number of units
      return scale / 100; // Convert to scale factor (per 100 units)
      
    case 'datacenter':
    case 'data-center':
      return parseInt(useCaseData.capacity) || 5; // MW capacity
      
    case 'airport':
      return parseInt(useCaseData.annual_passengers) || 5; // Million passengers
      
    case 'manufacturing':
      return parseInt(useCaseData.numLines) || parseInt(useCaseData.production_lines) || 2; // Production lines
      
    case 'warehouse':
    case 'logistics':
    case 'logistics-center':
      scale = parseInt(useCaseData.facility_size) || 100; // Thousand sq ft
      return scale / 100; // Convert to scale factor
      
    case 'retail':
    case 'shopping-center':
      scale = parseInt(useCaseData.store_size) || 50; // Thousand sq ft
      return scale / 10; // Convert to scale factor
      
    case 'casino':
    case 'tribal-casino':
      scale = parseInt(useCaseData.gaming_floor_size) || 50000; // Gaming floor sq ft
      return scale / 50000; // Convert to scale factor
      
    case 'agricultural':
    case 'farm':
      scale = parseInt(useCaseData.farm_size) || 1000; // Acres
      return scale / 1000; // Convert to thousands
      
    case 'indoor-farm':
      scale = parseInt(useCaseData.growing_area) || 10000; // Growing area sq ft
      return scale / 10000; // Convert to scale factor
      
    case 'cold-storage':
      scale = parseInt(useCaseData.storage_volume) || parseInt(useCaseData.capacity) || 50000; // Storage volume
      return scale / 50000; // Convert to scale factor
      
    case 'microgrid':
    case 'community':
      scale = parseInt(useCaseData.numBuildings) || parseInt(useCaseData.homes) || 50; // Buildings/homes
      return scale / 50; // Convert to scale factor
      
    default:
      return 1; // Default scale
  }
}

/**
 * Calculate storage sizing for EV charging stations
 * Specialized logic for EV charging use cases with different charger types
 * 
 * @param useCaseData - EV charging configuration data
 * @returns Storage configuration {powerMW, durationHrs}
 */
export function calculateEVChargingStorage(useCaseData: { [key: string]: any }): {
  powerMW: number;
  durationHrs: number;
} {
  const level2Count = parseInt(useCaseData.level2Chargers) || 0;
  const level2Power = parseFloat(useCaseData.level2Power) || 11; // kW per charger
  const dcFastCount = parseInt(useCaseData.dcFastChargers) || 0;
  const dcFastPower = parseFloat(useCaseData.dcFastPower) || 150; // kW per charger
  const peakConcurrency = parseInt(useCaseData.peakConcurrency) || 50; // % charging simultaneously
  
  // Calculate total charging capacity
  const totalLevel2Power = (level2Count * level2Power) / 1000; // Convert to MW
  const totalDCFastPower = (dcFastCount * dcFastPower) / 1000; // Convert to MW
  const totalChargingPower = totalLevel2Power + totalDCFastPower;
  
  // Storage sizing: 60-80% of total charging power for demand management
  // Plus concurrency factor (how many charge simultaneously)
  const concurrencyFactor = Math.min(peakConcurrency / 100, 0.8); // Max 80% concurrency
  const demandManagementSize = totalChargingPower * concurrencyFactor * 0.7; // 70% for demand shaving
  
  // Minimum 0.5MW, maximum practical size based on charger count
  const calculatedPowerMW = Math.max(0.5, Math.min(demandManagementSize, totalChargingPower * 0.8));
  
  // Duration: 2-4 hours for peak demand management and grid arbitrage
  const calculatedDurationHrs = Math.max(2, Math.min(4, 3));
  
  return {
    powerMW: Math.round(calculatedPowerMW * 10) / 10, // Round to 1 decimal
    durationHrs: calculatedDurationHrs
  };
}

/**
 * Format building/facility size for display
 * Intelligently formats different size metrics with appropriate units
 * 
 * @param useCaseData - Use case data containing size information
 * @param template - Industry template ID
 * @returns Formatted size string (e.g., "100,000 sq ft", "200 beds")
 */
export function formatFacilitySize(useCaseData: { [key: string]: any }, template: string): string {
  switch (template) {
    case 'hotel':
      const rooms = parseInt(useCaseData.numRooms) || 0;
      return `${rooms.toLocaleString()} rooms`;
      
    case 'hospital':
      const beds = parseInt(useCaseData.bedCount) || 0;
      return `${beds.toLocaleString()} beds`;
      
    case 'college':
    case 'university':
      const students = parseInt(useCaseData.enrollment) || 0;
      return `${students.toLocaleString()} students`;
      
    case 'apartment':
      const units = parseInt(useCaseData.numUnits) || 0;
      return `${units.toLocaleString()} units`;
      
    case 'warehouse':
    case 'logistics':
      const warehouseSqFt = parseInt(useCaseData.facility_size) || 0;
      return `${(warehouseSqFt * 1000).toLocaleString()} sq ft`;
      
    case 'retail':
      const storeSqFt = parseInt(useCaseData.store_size) || 0;
      return `${(storeSqFt * 1000).toLocaleString()} sq ft`;
      
    case 'manufacturing':
      const lines = parseInt(useCaseData.numLines) || parseInt(useCaseData.production_lines) || 0;
      return `${lines} production lines`;
      
    case 'car-wash':
      const bays = parseInt(useCaseData.numBays) || 0;
      return `${bays} wash bays`;
      
    case 'ev-charging':
      const level2 = parseInt(useCaseData.level2Chargers) || 0;
      const dcFast = parseInt(useCaseData.dcFastChargers) || 0;
      const total = level2 + dcFast;
      return `${total} chargers (${level2} L2, ${dcFast} DC Fast)`;
      
    default:
      const buildingSize = parseInt(useCaseData.buildingSize) || parseInt(useCaseData.facilitySize) || 0;
      if (buildingSize > 0) {
        return `${buildingSize.toLocaleString()} sq ft`;
      }
      return 'N/A';
  }
}

/**
 * Validate use case data completeness
 * Check if user has provided required information for their selected template
 * 
 * @param selectedTemplate - Industry template ID
 * @param useCaseData - User answers from questionnaire
 * @returns True if use case data is complete and valid
 */
export function validateUseCaseData(selectedTemplate: string, useCaseData: { [key: string]: any }): boolean {
  if (!selectedTemplate || Object.keys(useCaseData).length === 0) {
    return false;
  }
  
  // Check for template-specific required fields
  switch (selectedTemplate) {
    case 'hotel':
      return !!(useCaseData.numRooms && parseInt(useCaseData.numRooms) > 0);
      
    case 'hospital':
      return !!(useCaseData.bedCount && parseInt(useCaseData.bedCount) > 0);
      
    case 'college':
      return !!(useCaseData.enrollment && parseInt(useCaseData.enrollment) > 0);
      
    case 'apartment':
      return !!(useCaseData.numUnits && parseInt(useCaseData.numUnits) > 0);
      
    case 'datacenter':
      return !!(useCaseData.capacity && parseFloat(useCaseData.capacity) > 0);
      
    case 'manufacturing':
      return !!(useCaseData.numLines || useCaseData.production_lines);
      
    case 'car-wash':
      return !!(useCaseData.numBays && parseInt(useCaseData.numBays) > 0);
      
    case 'ev-charging':
      const hasChargers = (parseInt(useCaseData.level2Chargers) || 0) > 0 || 
                         (parseInt(useCaseData.dcFastChargers) || 0) > 0;
      return hasChargers;
      
    default:
      // For custom/other templates, any data is considered valid
      return Object.keys(useCaseData).length > 0;
  }
}

/**
 * Get friendly industry name from template ID
 * 
 * @param templateId - Industry template identifier
 * @returns Human-readable industry name
 */
export function getIndustryDisplayName(templateId: string): string {
  const nameMap: Record<string, string> = {
    'hotel': 'Hotel & Hospitality',
    'hospital': 'Healthcare & Hospital',
    'college': 'College & University',
    'apartment': 'Multifamily Residential',
    'datacenter': 'Data Center',
    'data-center': 'Data Center',
    'manufacturing': 'Manufacturing',
    'warehouse': 'Warehouse & Distribution',
    'logistics': 'Logistics Center',
    'retail': 'Retail & Shopping',
    'office': 'Office Building',
    'car-wash': 'Car Wash',
    'casino': 'Casino & Gaming',
    'tribal-casino': 'Tribal Casino',
    'indoor-farm': 'Indoor Agriculture',
    'cold-storage': 'Cold Storage',
    'airport': 'Airport & Transportation',
    'microgrid': 'Microgrid & Community',
    'ev-charging': 'EV Charging Station',
    'agricultural': 'Agricultural & Farming'
  };
  
  return nameMap[templateId] || templateId.split('-').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
}
