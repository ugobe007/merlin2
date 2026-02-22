import { useState, useEffect, useCallback } from "react";

interface WizardConfigHookParams {
  show: boolean;
  onStorageSizeChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  setSolarMW: (value: number) => void;
  setIncludeRenewables: (value: boolean) => void;
  setSolarPVIncluded: (value: boolean) => void;
  setSolarCapacityKW: (value: number) => void;
  setGeneratorMW: (value: number) => void;
  setGeneratorIncluded: (value: boolean) => void;
  setGeneratorCapacityKW: (value: number) => void;
  setLocation: (value: string) => void;
  setUtilityRate: (value: number) => void;
  setUseCase: (value: string) => void;
  setProjectName: (value: string) => void;
}

/**
 * WIZARD CONFIG LOADING HOOK
 *
 * Manages loading configuration from StreamlinedWizard via sessionStorage.
 * Checks for saved config and provides method to load it into the component.
 *
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 1F, Feb 2026)
 *
 * @returns hasWizardConfig - Whether config exists in sessionStorage
 * @returns loadWizardConfig - Function to load and apply the config
 */
export function useWizardConfig(params: WizardConfigHookParams) {
  const {
    show,
    onStorageSizeChange,
    onDurationChange,
    setSolarMW,
    setIncludeRenewables,
    setSolarPVIncluded,
    setSolarCapacityKW,
    setGeneratorMW,
    setGeneratorIncluded,
    setGeneratorCapacityKW,
    setLocation,
    setUtilityRate,
    setUseCase,
    setProjectName,
  } = params;

  const [hasWizardConfig, setHasWizardConfig] = useState(false);

  // Check if wizard config exists in sessionStorage
  useEffect(() => {
    setHasWizardConfig(!!sessionStorage.getItem("advancedBuilderConfig"));
  }, [show]);

  // Load wizard values from sessionStorage
  const loadWizardConfig = useCallback(() => {
    try {
      const configData = sessionStorage.getItem("advancedBuilderConfig");
      if (configData) {
        const config = JSON.parse(configData);
        console.log("✅ Loading wizard config into Advanced Builder:", config);

        // Set battery/storage values (convert kW to MW)
        if (config.batteryKW) {
          const batteryMW = config.batteryKW / 1000;
          onStorageSizeChange(batteryMW);
        }

        // Set duration
        if (config.durationHours) {
          onDurationChange(config.durationHours);
        }

        // Set solar (convert kW to MW)
        if (config.solarKW && config.solarKW > 0) {
          setSolarMW(config.solarKW / 1000);
          setIncludeRenewables(true);
          setSolarPVIncluded(true);
          setSolarCapacityKW(config.solarKW);
        }

        // Set generator (convert kW to MW and enable)
        if (config.generatorKW && config.generatorKW > 0) {
          setGeneratorMW(config.generatorKW / 1000);
          setIncludeRenewables(true);
          setGeneratorIncluded(true);
          setGeneratorCapacityKW(config.generatorKW);
        }

        // Set location/state
        if (config.state) {
          setLocation(config.state);
        }

        // Set utility rate
        if (config.electricityRate) {
          setUtilityRate(config.electricityRate);
        }

        // Set use case
        if (config.selectedIndustry) {
          setUseCase(config.selectedIndustry.replace(/-/g, "-"));
        }

        // Set project name if available
        if (config.selectedIndustry) {
          setProjectName(
            `${config.selectedIndustry.charAt(0).toUpperCase() + config.selectedIndustry.slice(1).replace(/-/g, " ")} Project`
          );
        }

        // Clear sessionStorage after loading
        sessionStorage.removeItem("advancedBuilderConfig");
        setHasWizardConfig(false);
      }
    } catch (error) {
      console.error("❌ Error loading wizard config:", error);
    }
  }, [
    onStorageSizeChange,
    onDurationChange,
    setSolarMW,
    setIncludeRenewables,
    setSolarPVIncluded,
    setSolarCapacityKW,
    setGeneratorMW,
    setGeneratorIncluded,
    setGeneratorCapacityKW,
    setLocation,
    setUtilityRate,
    setUseCase,
    setProjectName,
  ]);

  return { hasWizardConfig, loadWizardConfig };
}
