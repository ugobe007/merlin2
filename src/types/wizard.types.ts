/**
 * Wizard Type Definitions
 * ================================
 * Single source of truth for all wizard types
 * Used by StreamlinedWizard and all wizard-related services
 *
 * Created: 2025-11-24
 * Updated: 2025-12-01 - Consolidated from SmartWizardV3.types.ts
 */

import type { PowerGapAnalysis } from "@/services/powerGapAnalysis";

// ============================================================================
// DOMAIN TYPES - What the wizard manages
// ============================================================================

export interface BessSizing {
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;
  solarMWp?: number;
  windMW?: number;
  generatorMW?: number;
}

export interface EVConfiguration {
  enabled: boolean;
  chargers: number;
  kwPerCharger: number;
  totalMW: number;
}

export interface UseCaseAnswers {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface QuoteConfiguration {
  // Use Case Selection
  useCaseSlug: string | null;
  useCaseAnswers: UseCaseAnswers;

  // Sizing
  sizing: BessSizing;

  // Location & Pricing
  location: string;
  electricityRate: number;

  // Renewables
  wantsSolar: boolean;
  solarSpaceAcres: number;
  wantsEV: boolean;
  evConfig: EVConfiguration;

  // Grid
  gridConnection: "reliable" | "unreliable" | "none";
}

// ============================================================================
// WIZARD STATE - UI state for wizard flow
// ============================================================================

export interface WizardUIState {
  currentStep: number;
  showIntro: boolean;
  showCompletePage: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// COMPLETE WIZARD STATE - Everything the wizard needs
// ============================================================================

export interface SmartWizardState {
  // Domain data
  config: QuoteConfiguration;

  // UI state
  ui: WizardUIState;

  // Calculated results
  currentQuote: any | null;
  powerGapAnalysis: PowerGapAnalysis | null;

  // Available options (from database)
  availableUseCases: any[];
  useCaseDetails: any | null;
}

// ============================================================================
// WIZARD ACTIONS - All possible state mutations
// ============================================================================

export interface WizardActions {
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipIntro: () => void;

  // Use Case
  selectUseCase: (slug: string) => void;
  updateAnswers: (answers: Partial<UseCaseAnswers>) => void;
  calculateBaseline: () => Promise<void>;
  calculatePowerGap: () => Promise<void>;

  // Sizing
  updateSizing: (updates: Partial<BessSizing>) => void;

  // Location
  updateLocation: (location: string) => void;
  updateElectricityRate: (rate: number) => void;

  // Renewables
  toggleSolar: (enabled: boolean) => void;
  updateSolarSpaceAcres: (acres: number) => void;
  toggleEV: (enabled: boolean) => void;
  updateEVConfig: (config: Partial<EVConfiguration>) => void;

  // Grid
  updateGridConnection: (connection: "reliable" | "unreliable" | "none") => void;

  // Quote
  buildQuote: () => Promise<void>;
  reset: () => void;

  // Lifecycle
  initialize: () => Promise<void>;
}

// ============================================================================
// HOOK RETURN TYPE - What useSmartWizard returns
// ============================================================================

export interface UseSmartWizardReturn {
  // State
  state: SmartWizardState;

  // Actions
  actions: WizardActions;

  // Computed values (derived from state)
  computed: {
    canGoNext: boolean;
    canGoPrevious: boolean;
    isStepValid: boolean;
    totalSteps: number;
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface StreamlinedWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
  startInAdvancedMode?: boolean;
  onOpenAdvancedQuoteBuilder?: () => void;
  skipIntro?: boolean;
}

// ============================================================================
// STEP COMPONENT PROPS - Shared props for all step components
// ============================================================================

export interface BaseStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export interface Step1Props extends BaseStepProps {
  selectedTemplate: string | null;
  availableTemplates: any[];
  onSelectTemplate: (slug: string) => void;
}

export interface Step2Props extends BaseStepProps {
  useCaseSlug: string | null;
  answers: UseCaseAnswers;
  useCaseDetails: any;
  onUpdateAnswers: (answers: Partial<UseCaseAnswers>) => void;
}

export interface Step3Props extends BaseStepProps {
  sizing: BessSizing;
  onUpdateSizing: (updates: Partial<BessSizing>) => void;
}

export interface Step4Props extends BaseStepProps {
  location: string;
  electricityRate: number;
  onUpdateLocation: (location: string) => void;
  onUpdateRate: (rate: number) => void;
}

export interface Step5Props extends BaseStepProps {
  quote: any;
  onEdit: (step: number) => void;
}
