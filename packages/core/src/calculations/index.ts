/**
 * Calculations Module - SSOT Export
 * ==================================
 * 
 * Exports all calculation functions - Single Source of Truth.
 */

export {
  calculateQuote,
  estimatePayback,
  type QuoteInput,
  type QuoteResult
} from './unifiedQuoteCalculator';

export {
  calculateFinancialMetrics,
  type FinancialCalculationInput,
  type FinancialCalculationResult
} from './centralizedCalculations';

export {
  calculateEquipmentBreakdown,
  type EquipmentBreakdown,
  type EquipmentBreakdownOptions
} from './equipmentCalculations';

export {
  QuoteEngine
} from './QuoteEngine';

export {
  calculateHotelPower,
  calculateCarWashPower,
  calculateEVChargingPower,
  calculateDatacenterPower,
  type PowerCalculationResult
} from './useCasePowerCalculations';

