/**
 * User and Authentication Types
 * Centralized type definitions for user profiles, authentication, and team management
 */

// Compare & Configure types (Step 3 - December 2025)
export type {
  MerlinRecommendation,
  UserConfiguration,
  CompareConfigState,
  SliderConfig,
  SliderRanges,
  CompareConfigureSectionProps,
  BESSApplication,
  FinancialInputs,
  FinancialResult,
} from './compareConfig';

// Magic Fit™ types (Step 4 - December 2025)
export type {
  ScenarioType,
  ScenarioEquipment,
  ScenarioFinancials,
  ScenarioConfig,
  Step3Config,
  MagicFitSectionProps,
  ScenarioCardProps,
  SelectedConfigSummaryProps,
  TrueQuoteVerificationProps,
  ScenarioComparison,
  ScenarioInputs,
  CurrentConfig,
} from './magicFit';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user' | 'viewer';
  company?: string;
  phone?: string;
  title?: string;
  jobTitle?: string;
  avatar?: string;
  profilePhoto?: string;
  linkedIn?: string; // Match authService field name
  website?: string;
  companyWebsite?: string;
  bio?: string;
  tier?: 'free' | 'professional' | 'enterprise_pro' | 'business';
  accountType?: 'individual' | 'company';
  companyRole?: 'owner' | 'admin' | 'member';
  profileVisibility?: 'public' | 'private';
  publicProfileSlug?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  logo?: string;
  address?: string;
  phone?: string;
  seatsUsed?: number;
  seatLimit?: number;
  createdAt?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  jobTitle?: string;
  role: 'admin' | 'user' | 'viewer';
  companyRole?: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
  invitedAt?: string;
  joinedAt?: string;
  lastActive?: string;
}

/**
 * Pricing and Equipment Types
 */

export interface EquipmentBreakdown {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  category?: 'battery' | 'solar' | 'wind' | 'generator' | 'controls' | 'electronics';
}

export interface SystemDetails {
  manufacturer?: string;
  model?: string;
  capacity?: number;
  efficiency?: number;
  warranty?: number;
  specifications?: Record<string, any>;
}

export interface PricingBreakdown {
  equipment: EquipmentBreakdown[];
  labor: number;
  shipping: number;
  installation: number;
  permitting: number;
  contingency: number;
  subtotal: number;
  taxCredit?: number;
  incentives?: number;
  total: number;
  systemDetails?: SystemDetails;
}

/**
 * Data Integration Types
 */

export interface PowerProfile {
  peakDemand: number; // MW
  averageLoad: number; // MW
  loadFactor: number; // 0-1
  hourlyProfile?: number[]; // 24 hours
  seasonalVariation?: {
    summer: number;
    winter: number;
    spring: number;
    fall: number;
  };
}

export interface FinancialParams {
  electricityRate: number; // $/kWh
  demandCharge: number; // $/kW/month
  escalationRate: number; // %
  discountRate: number; // %
  projectLifetime: number; // years
  taxRate?: number; // %
  incentives?: {
    federal?: number;
    state?: number;
    local?: number;
    utility?: number;
  };
}

export interface SolarCompatibility {
  roofArea: number; // sq ft
  usableArea: number; // sq ft
  orientation: 'south' | 'southeast' | 'southwest' | 'east' | 'west';
  tilt: number; // degrees
  shading: 'none' | 'minimal' | 'moderate' | 'heavy';
  structuralCapacity: boolean;
  solarIrradiance: number; // kWh/m²/day
  recommendedCapacity: number; // MW
}

export interface CustomQuestion {
  id: string;
  question: string;
  answer?: string | number | boolean; // Optional because DB may not have answers yet
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  required?: boolean;
}

export interface IndustryStandards {
  industryType: string;
  typicalLoadProfile: string;
  peakHours: string[];
  seasonality: 'high' | 'medium' | 'low';
  loadVariability: number; // 0-1
  recommendations: {
    batterySize: string;
    duration: string;
    solarRatio: string;
  };
}

export interface EnrichedUseCaseData {
  useCase: string;
  facilitySize: number;
  operatingHours: number;
  peakLoad?: number;
  powerProfile: PowerProfile;
  financialParams: FinancialParams;
  solarCompatibility: SolarCompatibility;
  customQuestions: CustomQuestion[];
  timestamp: string;
  industryStandards: IndustryStandards;
}

export interface CalculationResults {
  financial: {
    netCapex: number;
    annualRevenue: number;
    annualSavings: number;
    paybackYears: number;
    roi: number;
    npv?: number;
    irr?: number;
  };
  sizing: {
    batteryMW: number;
    durationHours: number;
    energyMWh: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
  };
  performance: {
    cyclesPerYear: number;
    degradationRate: number;
    roundtripEfficiency: number;
    capacityFactor: number;
  };
}

/**
 * System Configuration Types
 */

export interface SystemConfig {
  id: string;
  key: string;
  value: any; // This stays as 'any' since config values can be anything
  description?: string;
  category?: string;
  updatedAt?: string;
}

/**
 * Wizard State Types (for quoteAdapter)
 */

export interface UseCaseData {
  [key: string]: string | number | boolean | undefined;
  facilitySize?: number;
  operatingHours?: number;
  peakLoad?: number;
  numberOfChargers?: number;
  level2Chargers?: number;
  level2Power?: number;
  dcFastChargers?: number;
  dcFastPower?: number;
  peakConcurrency?: number;
}

export interface WizardState {
  selectedTemplate?: string;
  selectedIndustry?: string;
  useCaseData: UseCaseData;
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  electricityRate: number;
  demandCharge: number;
  selectedState: string;
  selectedUtility: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Cache Types
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Log Entry Types (for future logging service)
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

// Savings Scout™ types
export type {
  OpportunityStatus,
  Opportunity,
  SavingsScoutProps,
  StateUtilityData,
  SolarResourceData,
  SavingsScoutResult,
} from './savingsScout';
