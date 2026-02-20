/**
 * SmartWizard Configuration Validator
 * Ensures all required configurations are present before the wizard can run
 */

export interface SolarConfig {
  enabled?: boolean;
  capacity?: number;
  solarSpaceAcres?: number; // Add solarSpaceAcres property
  // Add other solar config properties as needed
}

export interface GeneratorConfig {
  enabled?: boolean;
  capacity?: number;
  // Add other generator config properties as needed
}

export interface WindConfig {
  enabled?: boolean;
  capacity?: number;
  // Add other wind config properties as needed
}

export interface BessConfig {
  capacity?: number;
  power?: number;
  capacityMWh?: number; // Add alternative property names
  powerMW?: number; // to support different naming conventions
  durationHours?: number; // Add duration hours
  // Add other BESS config properties as needed
}

export interface SmartWizardConfigs {
  solarConfig?: SolarConfig;
  generatorConfig?: GeneratorConfig;
  windConfig?: WindConfig;
  bessConfig?: BessConfig;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates that all required configurations are present and properly initialized
 */
export function validateSmartWizardConfigs(configs: SmartWizardConfigs): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if configs object exists
  if (!configs) {
    errors.push("Configs object is null or undefined");
    return { isValid: false, errors, warnings };
  }

  // Validate solar config
  if (configs.solarConfig === undefined) {
    warnings.push("solarConfig is undefined - will use default values");
  }

  // Validate generator config
  if (configs.generatorConfig === undefined) {
    warnings.push("generatorConfig is undefined - will use default values");
  }

  // Validate wind config
  if (configs.windConfig === undefined) {
    warnings.push("windConfig is undefined - will use default values");
  }

  // Validate BESS config
  if (configs.bessConfig === undefined) {
    warnings.push("bessConfig is undefined - will use default values");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Provides default configurations to prevent undefined errors
 */
export function getDefaultConfigs(): SmartWizardConfigs {
  return {
    solarConfig: {
      enabled: false,
      capacity: 0,
    },
    generatorConfig: {
      enabled: false,
      capacity: 0,
    },
    windConfig: {
      enabled: false,
      capacity: 0,
    },
    bessConfig: {
      capacity: 0,
      power: 0,
    },
  };
}

/**
 * Merges provided configs with defaults to ensure all properties exist
 */
export function ensureCompleteConfigs(configs: Partial<SmartWizardConfigs>): SmartWizardConfigs {
  const defaults = getDefaultConfigs();

  return {
    solarConfig: { ...defaults.solarConfig, ...configs.solarConfig },
    generatorConfig: { ...defaults.generatorConfig, ...configs.generatorConfig },
    windConfig: { ...defaults.windConfig, ...configs.windConfig },
    bessConfig: { ...defaults.bessConfig, ...configs.bessConfig },
  };
}

/**
 * Logs validation results for debugging
 */
export function logValidationResults(validation: ValidationResult) {
  if (!validation.isValid) {
    console.error("❌ [SmartWizard Config Validation] Failed:", validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️ [SmartWizard Config Validation] Warnings:", validation.warnings);
  }

  if (validation.isValid && validation.warnings.length === 0) {
    if (import.meta.env.DEV) console.log("✅ [SmartWizard Config Validation] All configs valid");
  }
}
