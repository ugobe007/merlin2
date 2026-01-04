/**
 * COMPARE CONFIG TYPES
 * ====================
 *
 * TypeScript interfaces for Step 3: Compare & Configure
 * The "Mind Twist" - two-column comparison of Merlin's recommendation vs user config
 *
 * @created December 2025
 */

// ============================================================================
// MERLIN'S RECOMMENDATION
// ============================================================================

export interface MerlinRecommendation {
  // Equipment
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  solarKW: number;
  windKW: number;
  generatorKW: number;

  // Financials (from SSOT)
  netInvestment: number;
  annualSavings: number;
  paybackYears: number;
  roi25Year: number;

  // Metadata
  reasoning: string;
  confidence: "high" | "medium" | "low";
}

// ============================================================================
// USER CONFIGURATION
// ============================================================================

export interface UserConfiguration {
  // Equipment (user-adjustable except BESS)
  solarKW: number;
  windKW: number;
  generatorKW: number;
  durationHours: number;

  // BESS (auto-calculated, NOT user-adjustable)
  batteryKW: number; // Calculated from peak demand
  batteryKWh: number; // Calculated from duration + efficiency

  // Financials (auto-calculated from SSOT)
  netInvestment: number;
  annualSavings: number;
  paybackYears: number;
  roi25Year: number;
}

// ============================================================================
// COMPONENT STATE
// ============================================================================

export interface CompareConfigState {
  merlinPick: MerlinRecommendation;
  userConfig: UserConfiguration;
  selectedSource: "merlin" | "user" | null;
  showBESSExplainer: boolean;
  hasUserModified: boolean;
}

// ============================================================================
// SLIDER CONFIGURATION
// ============================================================================

export interface SliderConfig {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  tooltip?: string;
}

export interface SliderRanges {
  solar: { min: number; max: number; step: number };
  wind: { min: number; max: number; step: number };
  generator: { min: number; max: number; step: number };
  duration: { min: number; max: number; step: number };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface CompareConfigureSectionProps {
  // From previous steps
  peakDemandKW: number;
  state: string;
  electricityRate: number;
  demandChargePerKW: number;
  primaryApplication: string;

  // From Step 2
  initialSolarKW: number;
  initialWindKW: number;
  initialGeneratorKW: number;

  // Callbacks
  onAcceptConfig: (config: UserConfiguration, source: "merlin" | "user") => void;
  onAdvancedQuoteBuilder: () => void;
}

// ============================================================================
// BESS APPLICATION TYPES
// ============================================================================

export type BESSApplication =
  | "peak-shaving"
  | "backup"
  | "tou-optimization"
  | "solar-consumption"
  | "ev-charging"
  | "grid-independence"
  | "demand-response"
  | "frequency-regulation";

// ============================================================================
// FINANCIAL INPUTS/OUTPUTS
// ============================================================================

export interface FinancialInputs {
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  windKW: number;
  generatorKW: number;
  state: string;
  electricityRate: number;
  demandChargePerKW: number;
}

export interface FinancialResult {
  // Costs
  batteryCost: number;
  solarCost: number;
  windCost: number;
  generatorCost: number;
  installationCost: number;
  grossCost: number;
  incentives: number; // 30% ITC
  netInvestment: number;

  // Savings
  peakShavingSavings: number;
  solarSavings: number;
  touArbitrageSavings: number;
  annualSavings: number;

  // ROI
  paybackYears: number;
  roi25Year: number;
  npv25Year: number;

  // Source tracking (TrueQuote™)
  sources: {
    batteryCost: string;
    solarCost: string;
    incentives: string;
    savingsMethodology: string;
  };
}
