/**
 * BESS Sizing Calculations - Core Layer
 * 
 * Pure calculation functions for Battery Energy Storage System sizing.
 * Based on Grid-Synk industry standards.
 * 
 * All functions in this module are pure (no side effects, no I/O).
 */

export {
  // Types
  type BatteryPerformanceParams,
  type CRateParams,
  type BatteryModel,
  type PCSModel,
  type TransformerModel,
  type BESSSizingInput,
  type BESSSizingResult,
  type SolarDesignParams,
  type SolarDesignResult,
  
  // Constants
  DEFAULT_BATTERY_PERFORMANCE,
  DEFAULT_CRATE,
  STANDARD_BATTERY_MODELS,
  STANDARD_PCS_MODELS,
  STANDARD_TRANSFORMER_MODELS,
  
  // Functions
  calculateBESSSizing,
  calculateSolarModuleSeries
} from './bessCalculator';
