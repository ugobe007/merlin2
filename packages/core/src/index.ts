/**
 * @merlin/core - Core Services Package
 * =====================================
 * 
 * Single Source of Truth (SSOT) for all calculations and TrueQuote validation.
 * 
 * This package contains:
 * - Quote calculation engine (SSOT)
 * - TrueQuote validation service
 * - Pricing services (market-driven)
 * - Equipment calculations
 * - Financial metrics
 * 
 * IMPORTANT: All vertical sites MUST use this package for calculations
 * to maintain SSOT and TrueQuote compliance.
 * 
 * Version: 1.0.0
 * Date: December 25, 2025
 */

// ============================================================================
// CALCULATIONS (SSOT)
// ============================================================================

export {
  calculateQuote,
  estimatePayback,
  type QuoteInput,
  type QuoteResult
} from './calculations/unifiedQuoteCalculator';

export {
  calculateFinancialMetrics,
  type FinancialCalculationInput,
  type FinancialCalculationResult
} from './calculations/centralizedCalculations';

export {
  calculateEquipmentBreakdown,
  type EquipmentBreakdown,
  type EquipmentBreakdownOptions
} from './calculations/equipmentCalculations';

export {
  QuoteEngine
} from './calculations/QuoteEngine';

// ============================================================================
// VALIDATION (TrueQuote)
// ============================================================================

export {
  validateQuote,
  type ValidationResult,
  type ValidationIssue
} from './validation/calculationValidator';

export {
  checkTrueQuoteCompliance,
  type TrueQuoteComplianceResult
} from './validation/trueQuoteValidator';

// ============================================================================
// PRICING (Market-Driven)
// ============================================================================

export {
  getBatteryPricing,
  getSolarPricing,
  getInverterPricing,
  type BatteryPricing,
  type SolarPricing,
  type InverterPricing
} from './pricing/unifiedPricingService';

export {
  getMarketPriceSummary,
  type MarketPriceSummary
} from './pricing/marketDataIntegration';

// ============================================================================
// POWER CALCULATIONS
// ============================================================================

export {
  calculateHotelPower,
  calculateCarWashPower,
  calculateEVChargingPower,
  calculateDatacenterPower,
  type PowerCalculationResult
} from './calculations/useCasePowerCalculations';

// ============================================================================
// CONSTANTS (Database-Backed)
// ============================================================================

export {
  getConstant,
  getAllConstants,
  type CalculationConstant
} from './constants/calculationConstantsService';

// ============================================================================
// TYPES
// ============================================================================

export type {
  QuoteInput,
  QuoteResult,
  EquipmentBreakdown,
  FinancialCalculationResult,
  ValidationResult,
  TrueQuoteComplianceResult
} from './types';




