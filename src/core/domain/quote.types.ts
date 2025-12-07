/**
 * Quote Domain Types
 * ==================
 * Core types for BESS quote generation, baseline calculations, and use cases.
 * 
 * These types define the structure of quotes, baselines, and use case templates.
 * Part of the core domain layer - no dependencies on infrastructure or UI.
 */

// ============================================
// USE CASE TEMPLATE TYPES
// ============================================

export interface Equipment {
  name: string;
  powerKw: number;
  dutyCycle: number; // 0.0 to 1.0 (percentage as decimal)
  description?: string;
}

export interface PowerProfile {
  typicalLoadKw: number;
  peakLoadKw: number;
  profileType: 'constant' | 'peaked' | 'seasonal' | 'variable';
  dailyOperatingHours: number;
  peakHoursStart?: string; // Format: "HH:MM"
  peakHoursEnd?: string;
  operatesWeekends: boolean;
  seasonalVariation?: number; // Multiplier for seasonal changes (e.g., 1.3 = 30% higher in summer)
}

export interface FinancialParameters {
  demandChargeSensitivity: number; // Multiplier: 1.0 = average, >1.0 = more sensitive
  energyCostMultiplier: number; // Multiplier: 1.0 = average, >1.0 = higher costs
  typicalSavingsPercent: number; // Expected savings percentage
  roiAdjustmentFactor: number; // ROI multiplier: <1.0 = faster ROI
  
  // Optional special factors
  occupancyFactor?: number; // For hotels, offices (0.0-1.0)
  productionEfficiency?: number; // For manufacturing (0.0-1.0)
  peakDemandPenalty?: number; // Additional cost factor for peak demand
  
  // Incentive eligibility
  incentives?: {
    [key: string]: number; // e.g., { "agriculture": 0.15, "sustainability": 0.10 }
  };
}

export interface CustomQuestion {
  id: string;
  question?: string;
  label?: string; // Alternative to question (for compatibility)
  type: 'number' | 'select' | 'multiselect' | 'multi-select' | 'boolean' | 'percentage';
  default: string | number | boolean | string[];
  unit?: string; // e.g., "sq ft", "rooms", "kW"
  suffix?: string; // Alternative to unit (for compatibility)
  placeholder?: string;
  options?: (string | { value: string; label: string; powerKw?: number })[]; // Support power values in options
  
  // Conditional logic
  conditional?: {
    field?: string;
    operator?: '>' | '==' | '<' | '>=' | '!=' | '<=';
    value?: any;
    dependsOn?: string; // Legacy format
  };
  
  // How this question impacts the calculation
  impactType: 'multiplier' | 'additionalLoad' | 'factor' | 'power_add' | 'solar_flag' | 'solar_sizing' | 'design_priority' | 'none';
  impactsField?: 'equipmentPower' | 'systemSize' | 'energyCostMultiplier' | 'occupancyFactor';
  multiplierValue?: number;
  additionalLoadKw?: number; // For number inputs (e.g., kW per EV port)
  
  helpText?: string;
  required?: boolean;
}

export interface UseCaseTemplate {
  // Basic Information
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Emoji or icon name
  image?: string; // Path to use case image
  category: 'commercial' | 'industrial' | 'institutional' | 'agricultural' | 'residential';
  
  // Access Control
  requiredTier: 'free' | 'semi_premium' | 'premium';
  isActive: boolean;
  displayOrder: number;
  
  // Power Profile
  powerProfile: PowerProfile;
  
  // Equipment List
  equipment: Equipment[];
  
  // Financial Parameters
  financialParams: FinancialParameters;
  
  // Recommended Applications
  recommendedApplications: string[]; // e.g., ["peak_shaving", "demand_response"]
  
  // Custom Questions (use case specific)
  customQuestions?: CustomQuestion[];
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string; // Admin user ID
  usageCount?: number; // How many quotes generated
  averageROI?: number; // Average ROI for this use case
}

export interface UseCaseResponse {
  [questionId: string]: string | number | boolean;
}

// ============================================
// BASELINE CALCULATION
// ============================================

export interface BaselineCalculationResult {
  powerMW: number;
  durationHrs: number;
  solarMW: number;
  description?: string;
  dataSource?: string;
  // Grid and generation requirements
  gridConnection?: string;
  gridCapacity?: number;
  peakDemandMW?: number;
  generationRequired?: boolean;
  generationRecommendedMW?: number;
  generationReason?: string;
  // Grid-Synk Industry Standard Calculations
  industryStandard?: {
    requiredBatteryCapacityMWh: number; // After DoD, Static, Cycle efficiency
    usableBatteryCapacityMWh: number; // Actual usable capacity
    cRateValidation: boolean; // Whether C-Rate limits are met
    maxChargePowerMW: number; // Max charging power based on C-Rate
    fullChargeTimeHours: number; // Time to fully charge battery
    recommendedBatteryModel?: string; // e.g., "2x 3727.36kWh"
    recommendedPCS?: string; // e.g., "2x 1.25MW PCS"
  };
}

// ============================================
// QUESTIONNAIRE & CONFIGURATION
// ============================================

export interface QuestionnaireConfig {
  useCaseId: string;
  useCaseName: string;
  questions: CustomQuestion[];
  totalQuestions: number;
  requiredQuestions: number;
  estimatedTime: number; // minutes
  category: string;
}

export interface CalculationResponse {
  success: boolean;
  baseline?: BaselineCalculationResult;
  pricing?: any; // Future: Define pricing types in v3.0
  error?: string;
  warnings?: string[];
}

// ============================================
// DATABASE ROW TYPES (FROM SUPABASE)
// ============================================

// Re-export from database.types.ts (will be moved here gradually)
export type UseCaseRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  category: 'commercial' | 'industrial' | 'institutional' | 'agricultural' | 'residential' | 'utility';
  required_tier: 'free' | 'semi_premium' | 'premium';
  is_active: boolean;
  display_order: number;
  industry_standards: any;
  validation_sources: string[] | null;
  usage_count: number;
  average_roi: number | null;
  average_payback_years: number | null;
  last_used: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export interface UseCaseWithConfiguration extends UseCaseRow {
  configurations?: any[]; // Future: Define configuration type in v3.0
  customQuestions?: CustomQuestion[];
}

export interface DetailedUseCase extends UseCaseRow {
  configurations: any[];
  equipment: Equipment[];
  customQuestions: CustomQuestion[];
  recommendedApplications: string[];
}

// ============================================
// DATA INTEGRATION
// ============================================

export interface GetUseCaseParams {
  slug?: string;
  id?: string;
  includeConfigurations?: boolean;
  includeEquipment?: boolean;
  includeQuestions?: boolean;
  tier?: 'free' | 'semi_premium' | 'premium';
}

export interface UseCaseWithCalculations extends UseCaseRow {
  baseline?: BaselineCalculationResult;
  pricing?: any;
  financialMetrics?: any;
}
