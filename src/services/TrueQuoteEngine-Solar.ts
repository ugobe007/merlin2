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
      notes: `Using ${(template.solarDensity * 1000).toFixed(0)} W per sq ft installed density (NREL commercial standard, 400W panels with spacing)`
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
