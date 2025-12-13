/**
 * WIZARD TYPES
 * =============
 * 
 * TypeScript types and interfaces for the StreamlinedWizard components.
 * Extracted from StreamlinedWizard.tsx during December 2025 refactor.
 */

import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import type { GeographicRecommendation } from '@/services/geographicIntelligenceService';
import type { PremiumConfiguration } from '@/services/premiumConfigurationService';

// Re-export imported types for convenience
export type { PremiumConfiguration };

// ============================================
// PROPS INTERFACES
// ============================================

export interface StreamlinedWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  onOpenAdvanced?: () => void;
  // Support for vertical landing pages (hotel, car-wash, ev-charging)
  // When provided, wizard auto-selects the use case and skips to Section 3
  initialUseCase?: string;  // e.g., 'hotel', 'car-wash', 'ev-charging'
  initialState?: string;    // US state (e.g., 'California')
  initialData?: Record<string, any>;  // Pre-filled answers (e.g., { numberOfRooms: 150 })
}

// ============================================
// WIZARD STATE
// ============================================

export interface EstimatedCost {
  battery: number;
  solar: number;
  wind: number;
  generator: number;
  evChargers: number;
  evChargersL1: number;
  evChargersL2: number;
  evChargersDCFC: number;
  evChargersHPC: number;
  installation: number;
  total: number;
}

export interface WizardState {
  // Section 1: Location
  zipCode: string;
  state: string;
  geoRecommendations: GeographicRecommendation | null;
  electricityRate: number;
  
  // Section 2: Industry
  selectedIndustry: string;
  industryName: string;
  useCaseId: string; // UUID from database
  
  // Section 3: Facility Details - dynamic from database
  customQuestions: any[]; // Fetched from custom_questions table
  useCaseData: Record<string, any>; // Answers to custom questions
  facilitySize: number; // sq ft or rooms or kW depending on industry
  
  // Section 4: Goals
  goals: string[];
  wantsSolar: boolean;
  wantsWind: boolean;
  wantsGenerator: boolean;
  wantsBackupPower: boolean;
  wantsEVCharging: boolean;
  
  // Existing EV chargers (current infrastructure)
  hasExistingEV: boolean | null;
  existingEVL1: number;
  existingEVL2: number;
  existingEVL3: number;
  existingEVPowerSource: 'grid' | 'solar-grid' | 'solar-only' | 'generator';
  
  // Wind turbines
  windTurbineKW: number;
  
  // Backup generator
  generatorKW: number;
  generatorFuel: 'diesel' | 'natural-gas' | 'propane';
  generatorType: 'traditional' | 'linear';
  
  // Grid connection status
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive';
  
  // Section 5: Configuration
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  durationHours: number;
  
  // Calculated peak demand (from facility details)
  peakDemandKW: number;
  
  // EV Chargers
  evChargersL1: number;
  evChargersL2: number;
  evChargersDCFC: number;
  evChargersHPC: number;
  
  // Section 6: Quote
  quoteResult: QuoteResult | null;
  isCalculating: boolean;
  
  // Real-time cost estimates
  estimatedCost: EstimatedCost;
}

// ============================================
// RFQ STATE
// ============================================

export interface RFQFormState {
  projectName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectTimeline: 'immediate' | '3-months' | '6-months' | '12-months';
}

// ============================================
// PREMIUM COMPARISON
// ============================================

export interface PremiumComparison {
  standard: { totalCost: number; breakdown: Record<string, number> };
  premium: { totalCost: number; breakdown: Record<string, number> };
  delta: { totalCost: number; percentage: number };
  valueProposition: string[];
}

// ============================================
// SECTION PROPS INTERFACES
// ============================================

// ============================================
// SECTION PROPS INTERFACES
// ============================================
// NOTE: These are reference types. Each section component may define its own
// more specific interface. These are exported for documentation and reuse.

/**
 * Base props that all sections share
 */
export interface BaseSectionProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
}

/**
 * Section 0: Welcome + Location
 * Collects user location via zip code or state selection.
 */
export interface WelcomeLocationSectionProps extends BaseSectionProps {
  onZipChange: (zip: string) => Promise<void>;
  onStateSelect: (state: string) => void;
  onContinueGuided: () => void;
  onOpenAdvanced?: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

/**
 * Section 1: Industry Selection
 * Shows available use cases grouped by category.
 */
export interface IndustrySectionProps {
  wizardState: WizardState;
  availableUseCases: any[];
  isLoadingUseCases: boolean;
  groupedUseCases: Record<string, any[]>;
  onIndustrySelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
  onBack: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

/**
 * Section 2: Facility Details
 * Dynamic custom questions per industry from database.
 */
export interface FacilityDetailsSectionProps extends BaseSectionProps {
  currentSection: number;
  initializedFromVertical: boolean;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Section 3: Goals & Add-ons
 * User selects project goals and additional equipment (solar, wind, EV, etc).
 */
export interface GoalsSectionProps extends BaseSectionProps {
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Section 4: System Configuration
 * Battery sizing, solar, wind, generator settings with real-time cost display.
 */
export interface ConfigurationSectionProps extends BaseSectionProps {
  centralizedState: any;
  onBack: () => void;
  onGenerateQuote: () => Promise<void>;
  onShowPowerProfileExplainer: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

/**
 * Section 5: Quote Results
 * Final quote display with download/export options and RFQ submission.
 */
export interface QuoteResultsSectionProps extends BaseSectionProps {
  currentSection: number;
  sectionRef?: (el: HTMLDivElement | null) => void;
  premiumConfig: PremiumConfiguration | null;
  premiumComparison: PremiumComparison | null;
  onBack: () => void;
  onStartNew: () => void;
}

// ============================================
// UTILITY TYPES
// ============================================

export type WizardSection = 'location' | 'industry' | 'facility' | 'goals' | 'configuration' | 'quote';

export interface CustomQuestion {
  id: string;
  use_case_id: string;
  field_name: string;
  label: string;
  question_type: 'number' | 'select' | 'text' | 'boolean';
  options?: string[];
  default_value?: string;
  min_value?: number;
  max_value?: number;
  step?: number;
  unit?: string;
  help_text?: string;
  display_order: number;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_WIZARD_STATE: WizardState = {
  zipCode: '',
  state: '',
  geoRecommendations: null,
  electricityRate: 0.12,
  selectedIndustry: '',
  industryName: '',
  useCaseId: '',
  customQuestions: [],
  useCaseData: {},
  facilitySize: 25000,
  goals: [],
  wantsSolar: false,
  wantsWind: false,
  wantsGenerator: false,
  wantsBackupPower: false,
  wantsEVCharging: false,
  hasExistingEV: null,
  existingEVL1: 0,
  existingEVL2: 0,
  existingEVL3: 0,
  existingEVPowerSource: 'grid',
  windTurbineKW: 0,
  generatorKW: 0,
  generatorFuel: 'natural-gas',
  generatorType: 'traditional',
  gridConnection: 'on-grid',
  batteryKW: 0,
  batteryKWh: 0,
  solarKW: 0,
  durationHours: 4,
  peakDemandKW: 500, // Default estimate until facility details calculated
  evChargersL1: 0,
  evChargersL2: 0,
  evChargersDCFC: 0,
  evChargersHPC: 0,
  quoteResult: null,
  isCalculating: false,
  estimatedCost: {
    battery: 0,
    solar: 0,
    wind: 0,
    generator: 0,
    evChargers: 0,
    evChargersL1: 0,
    evChargersL2: 0,
    evChargersDCFC: 0,
    evChargersHPC: 0,
    installation: 0,
    total: 0,
  },
};

export const DEFAULT_RFQ_FORM: RFQFormState = {
  projectName: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  projectTimeline: 'immediate',
};
