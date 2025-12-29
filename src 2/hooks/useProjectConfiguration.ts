import { useState, useCallback } from 'react';

/**
 * Project Configuration Hook
 * 
 * Manages all project-level configuration state including:
 * - Project identification (name, location)
 * - Application type and use case
 * - Battery chemistry and performance specs
 * - Financial parameters (utility rates, demand charges)
 * - Installation preferences
 * 
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.2)
 */

export interface ProjectConfiguration {
  // Project Identification
  projectName: string;
  location: string;
  applicationType: string;
  useCase: string;
  
  // Battery Specifications
  chemistry: string;
  roundTripEfficiency: number;
  warrantyYears: number;
  cyclesPerYear: number;
  
  // Financial Parameters
  utilityRate: number;
  demandCharge: number;
  
  // Installation Details
  installationType: string;
  gridConnection: string;
  inverterEfficiency: number;
}

export interface ProjectConfigurationSetters {
  setProjectName: (value: string) => void;
  setLocation: (value: string) => void;
  setApplicationType: (value: string) => void;
  setUseCase: (value: string) => void;
  setChemistry: (value: string) => void;
  setRoundTripEfficiency: (value: number) => void;
  setWarrantyYears: (value: number) => void;
  setCyclesPerYear: (value: number) => void;
  setUtilityRate: (value: number) => void;
  setDemandCharge: (value: number) => void;
  setInstallationType: (value: string) => void;
  setGridConnection: (value: string) => void;
  setInverterEfficiency: (value: number) => void;
}

export interface UseProjectConfigurationReturn {
  config: ProjectConfiguration;
  setters: ProjectConfigurationSetters;
  resetToDefaults: () => void;
}

const DEFAULT_CONFIG: ProjectConfiguration = {
  projectName: '',
  location: '',
  applicationType: 'commercial',
  useCase: 'peak-shaving',
  chemistry: 'lfp',
  roundTripEfficiency: 90,
  warrantyYears: 10,
  cyclesPerYear: 365,
  utilityRate: 0.12,
  demandCharge: 15,
  installationType: 'outdoor',
  gridConnection: 'ac-coupled',
  inverterEfficiency: 96,
};

export function useProjectConfiguration(
  initialConfig?: Partial<ProjectConfiguration>
): UseProjectConfigurationReturn {
  // Merge initial config with defaults
  const initial = { ...DEFAULT_CONFIG, ...initialConfig };
  
  // Project Identification
  const [projectName, setProjectName] = useState(initial.projectName);
  const [location, setLocation] = useState(initial.location);
  const [applicationType, setApplicationType] = useState(initial.applicationType);
  const [useCase, setUseCase] = useState(initial.useCase);
  
  // Battery Specifications
  const [chemistry, setChemistry] = useState(initial.chemistry);
  const [roundTripEfficiency, setRoundTripEfficiency] = useState(initial.roundTripEfficiency);
  const [warrantyYears, setWarrantyYears] = useState(initial.warrantyYears);
  const [cyclesPerYear, setCyclesPerYear] = useState(initial.cyclesPerYear);
  
  // Financial Parameters
  const [utilityRate, setUtilityRate] = useState(initial.utilityRate);
  const [demandCharge, setDemandCharge] = useState(initial.demandCharge);
  
  // Installation Details
  const [installationType, setInstallationType] = useState(initial.installationType);
  const [gridConnection, setGridConnection] = useState(initial.gridConnection);
  const [inverterEfficiency, setInverterEfficiency] = useState(initial.inverterEfficiency);
  
  // Reset all values to defaults
  const resetToDefaults = useCallback(() => {
    setProjectName(DEFAULT_CONFIG.projectName);
    setLocation(DEFAULT_CONFIG.location);
    setApplicationType(DEFAULT_CONFIG.applicationType);
    setUseCase(DEFAULT_CONFIG.useCase);
    setChemistry(DEFAULT_CONFIG.chemistry);
    setRoundTripEfficiency(DEFAULT_CONFIG.roundTripEfficiency);
    setWarrantyYears(DEFAULT_CONFIG.warrantyYears);
    setCyclesPerYear(DEFAULT_CONFIG.cyclesPerYear);
    setUtilityRate(DEFAULT_CONFIG.utilityRate);
    setDemandCharge(DEFAULT_CONFIG.demandCharge);
    setInstallationType(DEFAULT_CONFIG.installationType);
    setGridConnection(DEFAULT_CONFIG.gridConnection);
    setInverterEfficiency(DEFAULT_CONFIG.inverterEfficiency);
  }, []);
  
  return {
    config: {
      projectName,
      location,
      applicationType,
      useCase,
      chemistry,
      roundTripEfficiency,
      warrantyYears,
      cyclesPerYear,
      utilityRate,
      demandCharge,
      installationType,
      gridConnection,
      inverterEfficiency,
    },
    setters: {
      setProjectName,
      setLocation,
      setApplicationType,
      setUseCase,
      setChemistry,
      setRoundTripEfficiency,
      setWarrantyYears,
      setCyclesPerYear,
      setUtilityRate,
      setDemandCharge,
      setInstallationType,
      setGridConnection,
      setInverterEfficiency,
    },
    resetToDefaults,
  };
}
