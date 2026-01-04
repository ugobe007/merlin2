/**
 * MERLIN WIZARD V6 - Type Definitions
 * ====================================
 * All types in ONE place. No hunting.
 * 
 * Created: December 28, 2025
 */

// ============================================================================
// WIZARD STATE - Single source of truth
// ============================================================================

export interface WizardState {
  // Step 1: Location & Goals
  zipCode: string;
  state: string;
  city: string;
  goals: EnergyGoal[];
  solarData?: { sunHours: number; rating: string }; // Solar irradiance data for location
  country?: string;
  electricityRate?: number;
  currency?: string;
  
  // Step 2: Industry
  industry: string;
  industryName: string;
  
  // Step 3: Facility Details
  facilityDetails: FacilityDetails;
  
  // Step 4: Opportunities (upsells)
  opportunities: OpportunitySelections;
  
  // Step 5: Selected Power Level
  selectedPowerLevel: PowerLevel | null;

  // Step 4: Options selections
  selectedOptions?: string[];
  solarTier?: string | null;
  evTier?: string | null;
  customSolarKw?: number;
  customEvL2?: number;
  customEvDcfc?: number;
  customEvUltraFast?: number;  // Ultra-Fast chargers (250-350 kW)
  customGeneratorKw?: number;
  generatorFuel?: 'natural-gas' | 'diesel';

  // Step 4: Options selections
  useCaseData: Record<string, any>;
  
  // Calculated (populated in Step 5)
  calculations: SystemCalculations | null;
}

// ============================================================================
// STEP 1: Location & Goals
// ============================================================================

export type EnergyGoal = 
  | 'reduce_costs'
  | 'backup_power'  
  | 'sustainability'
  | 'grid_independence'  // NEW
  | 'peak_shaving'       // NEW
  | 'generate_revenue';  // NEW (replaces ev_ready)

// NOTE: ENERGY_GOALS array is now defined in Step1Location.tsx
// This export is kept for backward compatibility but may be deprecated
export const ENERGY_GOALS: { id: EnergyGoal; label: string; icon: string }[] = [
  { id: 'reduce_costs', label: 'Reduce Energy Costs', icon: '💰' },
  { id: 'backup_power', label: 'Backup Power Protection', icon: '🔋' },
  { id: 'sustainability', label: 'Sustainability / Net Zero', icon: '🌱' },
  { id: 'grid_independence', label: 'Grid Independence', icon: '🏠' },
  { id: 'peak_shaving', label: 'Peak Shaving', icon: '⚡' },
  { id: 'generate_revenue', label: 'Generate Revenue', icon: '💵' },
];

// ============================================================================
// STEP 2: Industry
// ============================================================================

export interface IndustryOption {
  slug: string;
  name: string;
  icon: string;
  description: string;
  image?: string;
}

export const INDUSTRIES: IndustryOption[] = [
  { slug: 'hotel', name: 'Hotel / Hospitality', icon: '🏨', description: 'Hotels, resorts, motels' },
  { slug: 'car_wash', name: 'Car Wash', icon: '🚗', description: 'Tunnel, express, full-service' },
  { slug: 'ev_charging', name: 'EV Charging Hub', icon: '⚡', description: 'Charging stations, fleet depots' },
  { slug: 'manufacturing', name: 'Manufacturing', icon: '🏭', description: 'Factories, industrial facilities' },
  { slug: 'data_center', name: 'Data Center', icon: '💾', description: 'Server farms, colocation' },
  { slug: 'hospital', name: 'Hospital / Healthcare', icon: '🏥', description: 'Hospitals, clinics, labs' },
  { slug: 'retail', name: 'Retail / Commercial', icon: '🏪', description: 'Stores, shopping centers' },
  { slug: 'office', name: 'Office Building', icon: '🏢', description: 'Corporate offices, coworking' },
  { slug: 'college', name: 'College / University', icon: '🎓', description: 'Campus facilities' },
  { slug: 'warehouse', name: 'Warehouse / Logistics', icon: '📦', description: 'Distribution centers' },
  { slug: 'restaurant', name: 'Restaurant', icon: '🍽️', description: 'Restaurants, food service' },
  { slug: 'agriculture', name: 'Agriculture', icon: '🌾', description: 'Farms, indoor growing' },
];

// ============================================================================
// STEP 3: Facility Details
// ============================================================================

export interface FacilityDetails {
  // Common to all industries
  squareFootage: number;
  operatingHours: number;       // hours per day
  operatingDays: number;        // days per week
  gridConnectionKW: number;     // existing grid connection
  
  // Industry-specific (optional)
  roomCount?: number;           // Hotels
  tunnelCount?: number;         // Car Wash
  chargerCount?: number;        // EV Charging
  rackCount?: number;           // Data Center
  bedCount?: number;            // Hospital
  
  // For solar sizing
  rooftopSquareFootage?: number;
  parkingSquareFootage?: number;
}

// ============================================================================
// STEP 4: Opportunities (The Upsell)
// ============================================================================

export interface OpportunitySelections {
  wantsSolar: boolean;
  wantsEV: boolean;
  wantsGenerator: boolean;
}

export interface OpportunityInfo {
  id: keyof OpportunitySelections;
  name: string;
  icon: string;
  description: string;
  benefit: string;
}

// ============================================================================
// STEP 5: Power Levels (Magic Fit)
// ============================================================================

export type PowerLevel = 'starter' | 'perfect_fit' | 'beast_mode';

export interface PowerLevelConfig {
  id: PowerLevel;
  name: string;
  tagline: string;
  multiplier: number;  // Applied to base calculation
  durationHours: number;
  color: string;
  recommended?: boolean;
}

export const POWER_LEVELS: PowerLevelConfig[] = [
  {
    id: 'starter',
    name: 'STARTER',
    tagline: 'Smart & efficient',
    multiplier: 0.7,
    durationHours: 3,
    color: 'cyan',
  },
  {
    id: 'perfect_fit',
    name: 'PERFECT FIT',
    tagline: "Merlin's pick ⭐",
    multiplier: 1.0,
    durationHours: 4,
    color: 'purple',
    recommended: true,
  },
  {
    id: 'beast_mode',
    name: 'BEAST MODE',
    tagline: 'Maximum savings',
    multiplier: 1.5,
    durationHours: 6,
    color: 'orange',
  },
];

// ============================================================================
// CALCULATIONS
// ============================================================================

export interface SystemCalculations {
  // BESS (always included)
  bessKW: number;
  bessKWh: number;
  
  // Optional add-ons
  solarKW: number;
  evChargers: number;
  generatorKW: number;
  
  // Financials
  totalInvestment: number;
  annualSavings: number;
  paybackYears: number;
  tenYearROI: number;
  
  // After incentives
  federalITC: number;          // ITC amount
  federalITCRate?: number;     // ITC percentage (e.g., 0.30 for 30%)
  netInvestment: number;       // After ITC
  
  // Quote metadata
  quoteId?: string;            // Unique quote identifier
  pricingSources?: string[];   // Data source attribution
  
  // Utility rate info
  utilityName?: string;        // Utility company name
  utilityRate?: number;        // $/kWh
  demandCharge?: number;       // $/kW
  hasTOU?: boolean;            // Time-of-use pricing available
}

// ============================================================================
// INITIAL STATE
// ============================================================================

export const INITIAL_WIZARD_STATE: WizardState = {
  zipCode: '',
  state: '',
  city: '',
  goals: [],
  industry: '',
  industryName: '',
  facilityDetails: {
    squareFootage: 0,
    operatingHours: 12,
    operatingDays: 7,
    gridConnectionKW: 0,
  },
  opportunities: {
    wantsSolar: false,
    wantsEV: false,
    wantsGenerator: false,
  },
  selectedPowerLevel: null,
  selectedOptions: ["solar"],
  solarTier: "recommended",
  evTier: null,
  useCaseData: {},
  calculations: null,
};
// STEP DEFINITIONS
// ============================================================================

export interface StepDefinition {
  number: number;
  name: string;
  path: string;
}

export const WIZARD_STEPS: StepDefinition[] = [
  { number: 1, name: 'Location', path: 'location' },
  { number: 2, name: 'Industry', path: 'industry' },
  { number: 3, name: 'Details', path: 'details' },
  { number: 4, name: 'Options', path: 'options' },
  { number: 5, name: 'System', path: 'system' },
  { number: 6, name: 'Quote', path: 'quote' },
];
