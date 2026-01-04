/**
 * Use Case Template System
 * Defines the structure for dynamic, admin-manageable use cases
 */

export interface Equipment {
  name: string;
  powerKw: number;
  dutyCycle: number; // 0.0 to 1.0 (percentage as decimal)
  description?: string;
}

export interface PowerProfile {
  typicalLoadKw: number;
  peakLoadKw: number;
  profileType: "constant" | "peaked" | "seasonal" | "variable";
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
  type:
    | "number"
    | "select"
    | "multiselect"
    | "multi-select"
    | "boolean"
    | "percentage"
    | "slider"
    | "compound"
    | "text";
  default: string | number | boolean | string[] | Record<string, any>;
  unit?: string; // e.g., "sq ft", "rooms", "kW"
  suffix?: string; // Alternative to unit (for compatibility)
  placeholder?: string;

  // Options for select, multiselect, and compound types
  options?: (
    | string
    | {
        value: string;
        label: string;
        powerKw?: number;
        energyFactor?: number; // Legacy field for deprecated templates
        // Compound-specific fields
        hasAmount?: boolean; // Show numeric input when enabled
        amountUnit?: string; // Unit label for amount (e.g., "seats", "chargers")
        defaultAmount?: number; // Default amount value
        minAmount?: number; // Min for amount input
        maxAmount?: number; // Max for amount input
        helpText?: string; // Help text shown when enabled
      }
  )[];

  // Slider-specific fields
  min_value?: number;
  max_value?: number;
  step_value?: number;

  // Conditional logic
  conditional?: {
    field?: string;
    operator?: ">" | "==" | "<" | ">=" | "!=" | "<=";
    value?: any;
    dependsOn?: string; // Legacy format
  };

  // How this question impacts the calculation
  impactType:
    | "multiplier"
    | "additionalLoad"
    | "factor"
    | "power_add"
    | "solar_flag"
    | "solar_sizing"
    | "design_priority"
    | "none";
  impactsField?: "equipmentPower" | "systemSize" | "energyCostMultiplier" | "occupancyFactor";
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
  category: "commercial" | "industrial" | "institutional" | "agricultural" | "residential";

  // Access Control
  requiredTier: "free" | "semi_premium" | "premium";
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

/**
 * Helper function to calculate total power from equipment list
 */
export function calculateTotalPower(equipment: Equipment[]): {
  installedCapacity: number;
  typicalLoad: number;
  peakLoad: number;
} {
  const installedCapacity = equipment.reduce((sum, eq) => sum + eq.powerKw, 0);
  const typicalLoad = equipment.reduce((sum, eq) => sum + eq.powerKw * eq.dutyCycle, 0);
  const peakLoad = installedCapacity; // Assume all equipment can run simultaneously

  return { installedCapacity, typicalLoad, peakLoad };
}

/**
 * Apply custom question responses to use case parameters
 */
export function applyCustomResponses(
  template: UseCaseTemplate,
  responses: UseCaseResponse
): UseCaseTemplate {
  const modifiedTemplate = { ...template };

  if (!template.customQuestions) return modifiedTemplate;

  template.customQuestions.forEach((question) => {
    const response = responses[question.id];
    if (response === undefined) return;

    switch (question.impactType) {
      case "multiplier":
        if (question.impactsField === "equipmentPower") {
          // Scale all equipment power by response value
          modifiedTemplate.equipment = template.equipment.map((eq) => ({
            ...eq,
            powerKw: eq.powerKw * (Number(response) || 1),
          }));
        } else if (question.impactsField === "systemSize") {
          // Scale system size recommendation
          modifiedTemplate.powerProfile.typicalLoadKw *= Number(response) || 1;
          modifiedTemplate.powerProfile.peakLoadKw *= Number(response) || 1;
        }
        break;

      case "additionalLoad":
        if (question.additionalLoadKw && response === true) {
          modifiedTemplate.powerProfile.typicalLoadKw += question.additionalLoadKw;
          modifiedTemplate.powerProfile.peakLoadKw += question.additionalLoadKw;
        }
        break;

      case "factor":
        if (question.impactsField === "energyCostMultiplier") {
          modifiedTemplate.financialParams.energyCostMultiplier *= Number(response) / 100 || 1;
        } else if (question.impactsField === "occupancyFactor") {
          modifiedTemplate.financialParams.occupancyFactor = Number(response) / 100;
        }
        break;
    }
  });

  return modifiedTemplate;
}
