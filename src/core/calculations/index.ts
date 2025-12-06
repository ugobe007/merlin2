/**
 * Core Calculations Module
 * ========================
 * 
 * Central export point for all calculation-related functionality.
 * 
 * Usage:
 * ```typescript
 * import { QuoteEngine } from '@/core/calculations';
 * 
 * const quote = await QuoteEngine.generateQuote({ ... });
 * ```
 */

export { QuoteEngine, default } from './QuoteEngine';

// Re-export all types for convenience
export type {
  QuoteInput,
  QuoteResult,
  QuickEstimate,
  PowerResult,
  ValidationResult,
  VersionedQuoteResult,
  HotelPowerSimpleInput,
  HotelPowerSimpleResult,
  CarWashPowerSimpleInput,
  CarWashPowerSimpleResult,
  EVChargingPowerSimpleInput,
  EVChargingPowerSimpleResult,
  FinancialCalculationInput,
  FinancialCalculationResult,
  EquipmentBreakdown,
  EquipmentBreakdownOptions,
  PowerCalculationResult,
  EVChargerConfig,
  EVHubPowerResult,
  EVHubBESSRecommendation
} from './QuoteEngine';
