/**
 * Safe Config Updaters for SmartWizard
 * Provides safe fallbacks for config update functions that may not be defined
 */

import type {
  SolarConfig,
  GeneratorConfig,
  WindConfig,
  BessConfig,
} from "./smartWizardConfigValidator";

export interface ConfigUpdaters {
  updateSolarConfig?: (config: Partial<SolarConfig>) => void;
  updateGeneratorConfig?: (config: Partial<GeneratorConfig>) => void;
  updateWindConfig?: (config: Partial<WindConfig>) => void;
  updateBessConfig?: (config: Partial<BessConfig>) => void;
  setSolarConfig?: (config: SolarConfig) => void;
  setGeneratorConfig?: (config: GeneratorConfig) => void;
  setWindConfig?: (config: WindConfig) => void;
  setBessConfig?: (config: BessConfig) => void;
}

/**
 * Creates safe wrapper functions that won't throw ReferenceError
 */
export function createSafeConfigUpdaters(updaters: ConfigUpdaters) {
  return {
    /**
     * Safely update solar configuration
     */
    updateSolarConfig: (config: Partial<SolarConfig>) => {
      try {
        if (updaters.updateSolarConfig) {
          updaters.updateSolarConfig(config);
        } else if (updaters.setSolarConfig) {
          // Fallback to setSolarConfig if updateSolarConfig doesn't exist
          console.warn("⚠️ updateSolarConfig not found, using setSolarConfig instead");
          // Note: This may require merging with existing config
          updaters.setSolarConfig(config as SolarConfig);
        } else {
          console.error("❌ No solar config updater function available");
        }
      } catch (error) {
        console.error("❌ Error updating solar config:", error);
      }
    },

    /**
     * Safely update generator configuration
     */
    updateGeneratorConfig: (config: Partial<GeneratorConfig>) => {
      try {
        if (updaters.updateGeneratorConfig) {
          updaters.updateGeneratorConfig(config);
        } else if (updaters.setGeneratorConfig) {
          console.warn("⚠️ updateGeneratorConfig not found, using setGeneratorConfig instead");
          updaters.setGeneratorConfig(config as GeneratorConfig);
        } else {
          console.error("❌ No generator config updater function available");
        }
      } catch (error) {
        console.error("❌ Error updating generator config:", error);
      }
    },

    /**
     * Safely update wind configuration
     */
    updateWindConfig: (config: Partial<WindConfig>) => {
      try {
        if (updaters.updateWindConfig) {
          updaters.updateWindConfig(config);
        } else if (updaters.setWindConfig) {
          console.warn("⚠️ updateWindConfig not found, using setWindConfig instead");
          updaters.setWindConfig(config as WindConfig);
        } else {
          console.error("❌ No wind config updater function available");
        }
      } catch (error) {
        console.error("❌ Error updating wind config:", error);
      }
    },

    /**
     * Safely update BESS configuration
     */
    updateBessConfig: (config: Partial<BessConfig>) => {
      try {
        if (updaters.updateBessConfig) {
          updaters.updateBessConfig(config);
        } else if (updaters.setBessConfig) {
          console.warn("⚠️ updateBessConfig not found, using setBessConfig instead");
          updaters.setBessConfig(config as BessConfig);
        } else {
          console.error("❌ No BESS config updater function available");
        }
      } catch (error) {
        console.error("❌ Error updating BESS config:", error);
      }
    },
  };
}

/**
 * Validates that required updater functions are available
 */
export function validateConfigUpdaters(updaters: ConfigUpdaters): {
  isValid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!updaters.updateSolarConfig && !updaters.setSolarConfig) {
    missing.push("updateSolarConfig or setSolarConfig");
  }
  if (!updaters.updateGeneratorConfig && !updaters.setGeneratorConfig) {
    missing.push("updateGeneratorConfig or setGeneratorConfig");
  }
  if (!updaters.updateWindConfig && !updaters.setWindConfig) {
    missing.push("updateWindConfig or setWindConfig");
  }
  if (!updaters.updateBessConfig && !updaters.setBessConfig) {
    missing.push("updateBessConfig or setBessConfig");
  }

  if (missing.length > 0) {
    console.warn("⚠️ [Config Updaters] Missing functions:", missing);
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
