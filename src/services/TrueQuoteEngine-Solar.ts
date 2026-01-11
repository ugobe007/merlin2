/**
 * TrueQuoteEngine v2.1.0 - Solar Capacity Calculations
 * SSOT for all solar sizing calculations
 * 
 * This module is the SINGLE SOURCE OF TRUTH for solar capacity calculations.
 * UI components MUST NOT perform calculations - they only display results from this engine.
 */

import { getSolarTemplate, getSystemSizeCategory, estimateAnnualGeneration } from './solarTemplates';

// ============================================================================
// TYPES
// ============================================================================

export interface SolarCapacityInput {
  industry: string;
  roofArea: number;
  roofUnit: 'sqft' | 'sqm';
  carportInterest?: 'yes' | 'no' | 'unsure';
  carportArea?: number;
  carportUnit?: 'sqft' | 'sqm';
}

export interface CalculationStep {
  formula: string;
  inputs: Record<string, any>;
  result: number;
  unit: string;
  notes?: string;
}

export interface SolarCapacityResult {
  // Normalized inputs
  roofArea: number;
  roofUnit: 'sqft';
  carportArea: number;
  carportUnit: 'sqft';
  carportInterest: 'yes' | 'no' | 'unsure';
  
  // Calculated values - ROOF
  roofSolarUsable: number;          // sq ft usable for solar
  roofSolarKW: number;              // kW capacity from roof
  roofUsableFactor: number;         // % factor used
  
  // Calculated values - CARPORT
  carportSolarUsable: number;       // sq ft usable for carport solar
  carportSolarKW: number;           // kW capacity from carport
  carportUsableFactor: number;      // % factor used
  
  // Calculated values - TOTAL
  totalSolarArea: number;           // Total sq ft
  totalSolarKW: number;             // Total kW capacity
  systemSizeCategory: string;       // Small | Medium | Large | Extra Large
  annualGenerationKWh: number;      // Annual kWh generation
  
  // Template metadata
  industryTemplate: string;
  templateVersion: string;
  
  // Calculation audit trail
  calculations: {
    roofUsable: CalculationStep;
    roofGeneration: CalculationStep;
    carportUsable?: CalculationStep;
    carportGeneration?: CalculationStep;
    totalArea: CalculationStep;
    totalGeneration: CalculationStep;
    annualGeneration: CalculationStep;
  };
  
  // TrueQuote metadata
  calculatedAt: string;
  engineVersion: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ENGINE_VERSION = 'TrueQuoteEngine v2.1.0';
const TEMPLATE_VERSION = '1.0.0';

// Unit conversion constants
const SQM_TO_SQFT = 10.764;

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate solar capacity for a facility
 * 
 * This is the SINGLE SOURCE OF TRUTH for solar calculations.
 * All solar capacity values displayed in the UI must come from this function.
 * 
 * @param input - Facility solar inputs
 * @returns Complete solar capacity calculation with audit trail
 */
export function calculateSolarCapacity(input: SolarCapacityInput): SolarCapacityResult {
  // Get industry template (SSOT for calculation factors)
  const template = getSolarTemplate(input.industry);
  
  // Step 1: Normalize all inputs to sq ft
  const roofAreaSqFt = normalizeArea(input.roofArea, input.roofUnit);
  const carportAreaSqFt = input.carportArea 
    ? normalizeArea(input.carportArea, input.carportUnit || 'sqft')
    : 0;
  
  // Step 2: Calculate roof solar capacity
  const roofSolarUsable = roofAreaSqFt * template.roofUsableFactor;
  const roofSolarKW = roofSolarUsable * template.solarDensity;
  
  // Step 3: Calculate carport solar capacity (if applicable)
  let carportSolarUsable = 0;
  let carportSolarKW = 0;
  const includeCarport = input.carportInterest !== 'no' && carportAreaSqFt > 0;
  
  if (includeCarport) {
    carportSolarUsable = carportAreaSqFt * template.carportUsableFactor;
    carportSolarKW = carportSolarUsable * template.solarDensity;
  }
  
  // Step 4: Calculate totals
  const totalSolarArea = roofSolarUsable + carportSolarUsable;
  const totalSolarKW = roofSolarKW + carportSolarKW;
  
  // Step 5: System categorization
  const systemSizeCategory = getSystemSizeCategory(totalSolarKW);
  const annualGenerationKWh = estimateAnnualGeneration(totalSolarKW);
  
  // Step 6: Build audit trail
  const calculations = {
    roofUsable: {
      formula: 'roofArea × roofUsableFactor',
      inputs: {
        roofArea: roofAreaSqFt,
        roofUsableFactor: template.roofUsableFactor
      },
      result: roofSolarUsable,
      unit: 'sqft',
      notes: `Using ${(template.roofUsableFactor * 100).toFixed(0)}% usable factor for ${template.displayName} industry`
    },
    roofGeneration: {
      formula: 'roofSolarUsable × solarDensity',
      inputs: {
        roofSolarUsable: roofSolarUsable,
        solarDensity: template.solarDensity
      },
      result: roofSolarKW,
      unit: 'kW',
      notes: `Using ${template.solarDensity} kW per sq ft (modern 400-500W commercial panels)`
    },
    ...(includeCarport && {
      carportUsable: {
        formula: 'carportArea × carportUsableFactor',
        inputs: {
          carportArea: carportAreaSqFt,
          carportUsableFactor: template.carportUsableFactor
        },
        result: carportSolarUsable,
        unit: 'sqft',
        notes: `Using ${(template.carportUsableFactor * 100).toFixed(0)}% usable factor for carport structures`
      },
      carportGeneration: {
        formula: 'carportSolarUsable × solarDensity',
        inputs: {
          carportSolarUsable: carportSolarUsable,
          solarDensity: template.solarDensity
        },
        result: carportSolarKW,
        unit: 'kW'
      }
    }),
    totalArea: {
      formula: 'roofSolarUsable + carportSolarUsable',
      inputs: {
        roofSolarUsable: roofSolarUsable,
        carportSolarUsable: carportSolarUsable
      },
      result: totalSolarArea,
      unit: 'sqft'
    },
    totalGeneration: {
      formula: 'roofSolarKW + carportSolarKW',
      inputs: {
        roofSolarKW: roofSolarKW,
        carportSolarKW: carportSolarKW
      },
      result: totalSolarKW,
      unit: 'kW'
    },
    annualGeneration: {
      formula: 'totalSolarKW × peakSunHoursPerYear',
      inputs: {
        totalSolarKW: totalSolarKW,
        peakSunHoursPerYear: 1200
      },
      result: annualGenerationKWh,
      unit: 'kWh',
      notes: 'Assumes 1,200 peak sun hours per year (national average)'
    }
  };
  
  // Step 7: Return complete result
  return {
    // Normalized inputs
    roofArea: roofAreaSqFt,
    roofUnit: 'sqft',
    carportArea: carportAreaSqFt,
    carportUnit: 'sqft',
    carportInterest: input.carportInterest || 'no',
    
    // Roof calculations
    roofSolarUsable,
    roofSolarKW,
    roofUsableFactor: template.roofUsableFactor,
    
    // Carport calculations
    carportSolarUsable,
    carportSolarKW,
    carportUsableFactor: template.carportUsableFactor,
    
    // Total calculations
    totalSolarArea,
    totalSolarKW,
    systemSizeCategory,
    annualGenerationKWh,
    
    // Metadata
    industryTemplate: template.industry,
    templateVersion: TEMPLATE_VERSION,
    
    // Audit trail
    calculations,
    
    // TrueQuote metadata
    calculatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize area to square feet
 */
function normalizeArea(area: number, unit: 'sqft' | 'sqm'): number {
  return unit === 'sqm' ? area * SQM_TO_SQFT : area;
}

/**
 * Calculate monthly savings estimate (rough approximation)
 * Assumes $0.12/kWh average electricity rate
 */
export function estimateMonthlySavings(annualKWh: number, electricityRate: number = 0.12): number {
  return (annualKWh * electricityRate) / 12;
}

/**
 * Calculate 10-year savings
 */
export function estimate10YearSavings(annualKWh: number, electricityRate: number = 0.12): number {
  // Factor in 3% annual electricity rate increase
  let totalSavings = 0;
  let currentRate = electricityRate;
  
  for (let year = 0; year < 10; year++) {
    totalSavings += annualKWh * currentRate;
    currentRate *= 1.03;  // 3% annual increase
  }
  
  return totalSavings;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate solar capacity inputs
 */
 
// ============================================================================
// EQUIPMENT LOAD CALCULATIONS (Car Wash)
// ============================================================================

/**
 * Equipment Load Result
 */
export interface EquipmentLoadResult {
  loads: {
    kiosks: number;
    conveyor: number;
    brushes: number;
    blowers: number;
    heatedDryerBonus: number;
    pumps: number;
    centralVacuum: number;
    roSystem: number;
    airCompressor: number;
    tunnelLighting: number;
    exteriorSignage: number;
    officeFacilities: number;
  };
  totalPeakDemand: number;
  averageDemand: number;
  annualConsumption: number;
}

/**
 * Calculate equipment load for car wash facilities
 * Converts equipment specifications to power requirements (kW)
 * 
 * @param useCaseData - Equipment data from questionnaire answers
 * @returns Equipment load breakdown and totals
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function calculateEquipmentLoad(useCaseData: Record<string, any>): EquipmentLoadResult {
  // Helper: Convert HP to kW (1 HP = 0.746 kW)
  const hpToKw = (hp: number): number => hp * 0.746;
  
  // Helper: Get kW from option with kW property
  const getKwFromOption = (value: string, options?: Array<{ value: string; kW?: number }>): number => {
    if (!options) return 0;
    const option = options.find(opt => opt.value === value);
    return option?.kW || 0;
  };

  // Kiosks (payment stations)
  const kioskCount = Number(useCaseData.kioskCount) || 2;
  const kiosks = kioskCount * 0.5; // 0.5 kW each

  // Conveyor motor (from buttons question)
  const conveyorMotorHP = useCaseData.conveyorMotorHP || '10';
  const conveyor = getKwFromOption(conveyorMotorHP, [
    { value: '5', kW: 3.7 },
    { value: '10', kW: 7.5 },
    { value: '15', kW: 11.2 }
  ]);

  // Brush motors (increment_box)
  const brushMotorCount = Number(useCaseData.brushMotorCount) || 15;
  const brushKwPerMotor = 3; // Average 3 HP = 2.24 kW, but using 3 kW for margin
  const brushes = brushMotorCount * brushKwPerMotor;

  // High-pressure pumps (increment_box)
  const pumpCount = Number(useCaseData.highPressurePumpCount) || 3;
  const pumpKwPerPump = 15 * 0.746; // 15 HP average = 11.19 kW
  const pumps = pumpCount * pumpKwPerPump;

  // Blowers (increment_box)
  const blowerCount = Number(useCaseData.blowerCount) || 10;
  const blowerKwPerBlower = 12 * 0.746; // 12 HP average = 8.95 kW
  const blowers = blowerCount * blowerKwPerBlower;

  // Heated dryer bonus (conditional)
  const heatedDryerBonus = useCaseData.heatedDryers === 'yes' ? 40 : 0;

  // Central vacuum (slider in HP)
  const centralVacuumHP = Number(useCaseData.centralVacuumHP) || 30;
  const centralVacuum = hpToKw(centralVacuumHP);

  // RO System (from buttons question)
  const roPumpHP = useCaseData.roPumpHP || 'medium';
  const roSystem = getKwFromOption(roPumpHP, [
    { value: 'none', kW: 0 },
    { value: 'small', kW: 3.7 },
    { value: 'medium', kW: 7.5 },
    { value: 'large', kW: 11.2 }
  ]);

  // Air compressor (from buttons question)
  const airCompressorHP = useCaseData.airCompressorHP || 'medium';
  const airCompressor = getKwFromOption(airCompressorHP, [
    { value: 'small', kW: 3.7 },
    { value: 'medium', kW: 7.5 },
    { value: 'large', kW: 11.2 }
  ]);

  // Tunnel lighting (from buttons question)
  const tunnelLighting = getKwFromOption(useCaseData.tunnelLighting || 'enhanced', [
    { value: 'basic', kW: 5 },
    { value: 'enhanced', kW: 8 },
    { value: 'premium', kW: 15 }
  ]);

  // Exterior signage (from buttons question)
  const exteriorSignage = getKwFromOption(useCaseData.exteriorSignage || 'basic', [
    { value: 'basic', kW: 5 },
    { value: 'premium', kW: 10 },
    { value: 'signature', kW: 20 }
  ]);

  // Office facilities (multiselect - sum kW values)
  const officeFacilities = Array.isArray(useCaseData.officeFacilities) 
    ? useCaseData.officeFacilities.reduce((sum: number, facility: string) => {
        const facilityKw: Record<string, number> = {
          office: 2,
          breakroom: 3,
          bathroom: 1,
          security: 0.5
        };
        return sum + (facilityKw[facility] || 0);
      }, 0)
    : 0;

  // Calculate totals
  const loads = {
    kiosks,
    conveyor,
    brushes,
    blowers,
    heatedDryerBonus,
    pumps,
    centralVacuum,
    roSystem,
    airCompressor,
    tunnelLighting,
    exteriorSignage,
    officeFacilities
  };

  const totalPeakDemand = Object.values(loads).reduce((sum, kW) => sum + kW, 0);
  const averageDemand = totalPeakDemand * 0.7; // 70% load factor (not all equipment runs simultaneously)

  // Calculate annual consumption (needs operating hours and days per week)
  const operatingHours = Number(useCaseData.operatingHours) || 12;
  const daysPerWeek = Number(useCaseData.daysPerWeek) || 7;
  const annualConsumption = averageDemand * operatingHours * daysPerWeek * 52;

  return {
    loads,
    totalPeakDemand,
    averageDemand,
    annualConsumption
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validateSolarInputs(input: Partial<SolarCapacityInput>): string[] {
  const errors: string[] = [];
  
  if (!input.industry) {
    errors.push('Industry is required');
  }
  
  if (!input.roofArea || input.roofArea <= 0) {
    errors.push('Roof area must be greater than 0');
  }
  
  if (input.roofArea && input.roofArea > 1000000) {
    errors.push('Roof area seems unusually large (>1,000,000 sq ft). Please verify.');
  }
  
  if (!input.roofUnit || !['sqft', 'sqm'].includes(input.roofUnit)) {
    errors.push('Roof unit must be sqft or sqm');
  }
  
  if (input.carportInterest && !['yes', 'no', 'unsure'].includes(input.carportInterest)) {
    errors.push('Carport interest must be yes, no, or unsure');
  }
  
  if (input.carportInterest !== 'no' && input.carportArea && input.carportArea > 500000) {
    errors.push('Carport area seems unusually large (>500,000 sq ft). Please verify.');
  }
  
  return errors;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getSolarTemplate,
  getSystemSizeCategory,
  estimateAnnualGeneration
} from './solarTemplates';
