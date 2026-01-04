/**
 * magicFit.ts
 *
 * Type definitions for Step 4: Magic Fit™ Scenarios
 * Three pre-optimized scenarios: Essentials, Balanced, Max Savings
 *
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

// ============================================================================
// SCENARIO TYPES
// ============================================================================

export type ScenarioType = "essentials" | "balanced" | "max-savings";

export interface ScenarioEquipment {
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  solarKW: number;
  windKW: number;
  generatorKW: number;
}

export interface ScenarioFinancials {
  netInvestment: number;
  annualSavings: number;
  paybackYears: number;
  roi25Year: number;
  backupHours: number;
}

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  tagline: string;
  icon: string;
  isRecommended: boolean;

  // Equipment configuration
  equipment: ScenarioEquipment;

  // Financial metrics (from SSOT)
  financials: ScenarioFinancials;

  // Marketing content
  highlights: string[];
  reasoning: string;
}

// ============================================================================
// STEP 3 CONFIGURATION (passed from previous step)
// ============================================================================

export interface Step3Config {
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  solarKW: number;
  windKW: number;
  generatorKW: number;
  netInvestment: number;
  annualSavings: number;
  paybackYears: number;
  roi25Year: number;
  source: "merlin" | "user";
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface MagicFitSectionProps {
  // From previous wizard steps
  peakDemandKW: number;
  state: string;
  electricityRate: number;
  demandChargePerKW: number;
  primaryApplication: string;

  // From Step 3 (user's custom config or Merlin's pick)
  step3Config: Step3Config;

  // Facility details for display
  facilityName: string; // e.g., "150-room luxury hotel"

  // Callbacks
  onSelectScenario: (scenario: ScenarioConfig) => void;
  onUseStep3Config: () => void;
  onGenerateQuote: () => void;
  onAdvancedQuoteBuilder: () => void;
}

export interface ScenarioCardProps {
  scenario: ScenarioConfig;
  isSelected: boolean;
  onSelect: () => void;
  comparison: ScenarioComparison;
}

export interface SelectedConfigSummaryProps {
  config: {
    source: string;
    batteryKW: number;
    batteryKWh: number;
    durationHours: number;
    solarKW: number;
    windKW: number;
    generatorKW: number;
    netInvestment: number;
    annualSavings: number;
    paybackYears: number;
    roi25Year: number;
  };
}

export interface TrueQuoteVerificationProps {
  state: string;
}

// ============================================================================
// SCENARIO COMPARISON
// ============================================================================

export interface ScenarioComparison {
  lowestCost: ScenarioType;
  fastestPayback: ScenarioType;
  highestSavings: ScenarioType;
  bestROI: ScenarioType;
}

// ============================================================================
// SCENARIO GENERATION INPUTS
// ============================================================================

export interface ScenarioInputs {
  peakDemandKW: number;
  state: string;
  electricityRate: number;
  demandChargePerKW: number;
  primaryApplication: string;
}

// ============================================================================
// CURRENT CONFIG (for display)
// ============================================================================

export interface CurrentConfig {
  source: string;
  batteryKW: number;
  batteryKWh: number;
  durationHours: number;
  solarKW: number;
  windKW: number;
  generatorKW: number;
  netInvestment: number;
  annualSavings: number;
  paybackYears: number;
  roi25Year: number;
}
