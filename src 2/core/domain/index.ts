/**
 * Core Domain Types - Barrel Export
 * ==================================
 * Central export point for all domain types in the core layer.
 * 
 * Usage:
 * import { FinancialCalculationInput, BatteryPricing, UseCaseTemplate } from '@/core/domain';
 */

// Financial types
export type {
  CalculationConstants,
  FinancialCalculationInput,
  FinancialCalculationResult,
  SensitivityAnalysisResult,
  RiskAnalysisResult,
  ScenarioAnalysisResult,
  AdvancedFinancialMetrics
} from './financial.types';

// Equipment types
export type {
  BatteryPricing,
  InverterPricing,
  TransformerPricing,
  SolarPricing,
  WindPricing,
  GeneratorPricing,
  EquipmentCosts,
  InstallationCosts,
  ProjectCosts,
  PricingBreakdown,
  PowerInverter,
  Transformer,
  Switchgear,
  PowerConditioner,
  Controller,
  ScadaSystem,
  EnergyManagementSystem,
  AutomationSystem,
  GeneratorSpecification,
  UnifiedPricingCache
} from './equipment.types';

// Quote and use case types
export type {
  Equipment,
  PowerProfile,
  FinancialParameters,
  CustomQuestion,
  UseCaseTemplate,
  UseCaseResponse,
  BaselineCalculationResult,
  QuestionnaireConfig,
  CalculationResponse,
  UseCaseRow,
  UseCaseWithConfiguration,
  DetailedUseCase,
  GetUseCaseParams,
  UseCaseWithCalculations
} from './quote.types';
