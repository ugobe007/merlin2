/**
 * Shared TypeScript interfaces for ProQuote components
 * Extracted from AdvancedQuoteBuilder.tsx refactoring (Feb 2026)
 */

import type { FinancialCalculationResult } from "@/services/centralizedCalculations";

// ═══════════════════════════════════════════════════════════════════
// VIEW MODES
// ═══════════════════════════════════════════════════════════════════

export type ViewMode =
  | "landing"
  | "custom-config"
  | "interactive-dashboard"
  | "professional-model"
  | "upload"
  | "upload-first";

// ═══════════════════════════════════════════════════════════════════
// PROJECT INFO
// ═══════════════════════════════════════════════════════════════════

export interface ProjectInfo {
  projectName?: string;
  projectLocation?: string;
  projectGoals?: string;
  projectSchedule?: string;
  userName?: string;
  email?: string;
  userId?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export interface SystemConfig {
  storageSizeMW: number;
  durationHours: number;
  chemistry: string;
  installationType: string;
  gridConnection: string;
  inverterEfficiency: number;
}

// ═══════════════════════════════════════════════════════════════════
// APPLICATION SETTINGS
// ═══════════════════════════════════════════════════════════════════

export interface ApplicationConfig {
  applicationType: string;
  useCase: string;
  projectName: string;
  location: string;
}

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL PARAMETERS
// ═══════════════════════════════════════════════════════════════════

export interface FinancialParams {
  utilityRate: number;
  demandCharge: number;
  cyclesPerYear: number;
  warrantyYears: number;
}

// ═══════════════════════════════════════════════════════════════════
// ELECTRICAL SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════

export interface ElectricalSpecs {
  systemVoltage: number;
  dcVoltage: number;
  inverterType: string;
  inverterManufacturer: string;
  inverterRating: number;
  pcsQuoteSeparately: boolean;
  numberOfInvertersInput: number;
  systemWattsInput: number | "";
  systemAmpsACInput: number | "";
  systemAmpsDCInput: number | "";
}

// ═══════════════════════════════════════════════════════════════════
// RENEWABLES CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

export interface SolarConfig {
  solarPVIncluded: boolean;
  solarCapacityKW: number;
  solarPanelType: string;
  solarPanelEfficiency: number;
  solarInverterType: string;
  solarInstallType: "rooftop" | "canopy" | "ground-mount" | "mixed";
  solarRoofSpaceSqFt: number;
  solarCanopySqFt: number;
  solarGroundAcres: number;
  solarPeakSunHours: number;
  solarTrackingType: "fixed" | "single-axis" | "dual-axis";
}

export interface WindConfig {
  windTurbineIncluded: boolean;
  windCapacityKW: number;
  windTurbineType: string;
  windClassRating: number;
  windTurbineCount: number;
  windHubHeight: number;
  windTerrain: "open" | "suburban" | "coastal" | "complex";
}

export interface FuelCellConfig {
  fuelCellIncluded: boolean;
  fuelCellCapacityKW: number;
  fuelCellType: string;
  fuelType: string;
}

export interface GeneratorConfig {
  generatorIncluded: boolean;
  generatorCapacityKW: number;
  generatorFuelTypeSelected: "natural-gas" | "diesel" | "dual-fuel" | "linear";
  generatorUseCases: string[];
  generatorRedundancy: boolean;
  generatorSpaceAvailable: boolean;
}

export interface EVChargersConfig {
  evChargersIncluded: boolean;
  evLevel2Count: number;
  evDCFCCount: number;
  evHPCCount: number;
  evChargersPerStation: 1 | 2;
  evAdditionalPowerKW: number;
}

export interface RenewablesConfig {
  includeRenewables: boolean;
  solar: SolarConfig;
  wind: WindConfig;
  fuelCell: FuelCellConfig;
  generator: GeneratorConfig;
  evChargers: EVChargersConfig;
}

// ═══════════════════════════════════════════════════════════════════
// PROFESSIONAL FINANCIAL MODEL
// ═══════════════════════════════════════════════════════════════════

export interface ProfessionalModelConfig {
  selectedISORegion: "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO" | "SPP";
  projectLeverage: number; // % debt
  interestRate: number; // %
  loanTermYears: number;
}

// ═══════════════════════════════════════════════════════════════════
// COMPLETE CONFIGURATION (ALL SECTIONS)
// ═══════════════════════════════════════════════════════════════════

export interface CompleteProQuoteConfig {
  system: SystemConfig;
  application: ApplicationConfig;
  financial: FinancialParams;
  electrical: ElectricalSpecs;
  renewables: RenewablesConfig;
  professionalModel: ProfessionalModelConfig;
  projectInfo: ProjectInfo | null;
}

// ═══════════════════════════════════════════════════════════════════
// CALCULATION STATE
// ═══════════════════════════════════════════════════════════════════

export interface CalculationState {
  financialMetrics: FinancialCalculationResult | null;
  isCalculating: boolean;
  professionalModel: any | null; // Type from professionalFinancialModel
  isGeneratingModel: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════

export interface SystemConfigSectionProps {
  config: SystemConfig;
  onUpdate: (updates: Partial<SystemConfig>) => void;
  storageSizeMWh: number;
  calculationState: CalculationState;
}

export interface ApplicationSectionProps {
  config: ApplicationConfig;
  onUpdate: (updates: Partial<ApplicationConfig>) => void;
}

export interface FinancialSectionProps {
  params: FinancialParams;
  onUpdate: (updates: Partial<FinancialParams>) => void;
  onOpenProfessionalModel: () => void;
}

export interface ElectricalSectionProps {
  specs: ElectricalSpecs;
  onUpdate: (updates: Partial<ElectricalSpecs>) => void;
  systemConfig: SystemConfig;
}

export interface RenewablesSectionProps {
  config: RenewablesConfig;
  onUpdate: (updates: Partial<RenewablesConfig>) => void;
}
