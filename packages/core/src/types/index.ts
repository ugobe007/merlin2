/**
 * Core Types - Shared across all Merlin packages
 * ==============================================
 * 
 * These types ensure consistency across vertical sites and maintain
 * TrueQuote compliance.
 */

// Re-export from calculations
export type {
  QuoteInput,
  QuoteResult
} from '../calculations/unifiedQuoteCalculator';

export type {
  FinancialCalculationInput,
  FinancialCalculationResult
} from '../calculations/centralizedCalculations';

export type {
  EquipmentBreakdown,
  EquipmentBreakdownOptions
} from '../calculations/equipmentCalculations';

// Re-export from validation
export type {
  ValidationResult,
  ValidationIssue
} from '../validation/calculationValidator';

export type {
  TrueQuoteComplianceResult
} from '../validation/trueQuoteValidator';

// Re-export from pricing
export type {
  BatteryPricing,
  SolarPricing,
  InverterPricing
} from '../pricing/unifiedPricingService';

export type {
  MarketPriceSummary
} from '../pricing/marketDataIntegration';




