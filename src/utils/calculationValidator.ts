/**
 * Calculation Validation Layer
 * 
 * Purpose: Validate local calculations against centralized service
 * Mode: Development only - zero performance impact in production
 * Strategy: Non-blocking validation, log warnings for >5% variance
 * 
 * @created 2025-11-21
 * @see CALCULATION_RECONCILIATION_STRATEGY.md
 */

import { calculateFinancialMetrics } from '@/services/centralizedCalculations';

export interface ValidationResult {
  isValid: boolean;
  variance: number;
  localValue: number;
  centralValue: number;
  message: string;
  source: string;
  timestamp: number;
}

/**
 * Validates financial calculations against central service
 * 
 * @param localResult - Calculation result from component/service
 * @param inputs - Input parameters for central calculation
 * @param source - Source identifier (e.g., "SmartWizardV2", "AdvancedQuoteBuilder")
 * @returns Validation result or null if in production
 * 
 * @example
 * ```typescript
 * const localPayback = totalCost / annualSavings;
 * 
 * await validateFinancialCalculation(
 *   { paybackYears: localPayback },
 *   { storageSizeMW: 2.0, durationHours: 4, electricityRate: 0.12 },
 *   'MyComponent.calculateCosts'
 * );
 * ```
 */
export async function validateFinancialCalculation(
  localResult: {
    paybackYears?: number;
    roi10Year?: number;
    roi25Year?: number;
    annualSavings?: number;
    netCost?: number;
    npv?: number;
    irr?: number;
  },
  inputs: {
    storageSizeMW: number;
    durationHours: number;
    location: string;
    electricityRate: number;
    solarMW?: number;
    equipmentCost?: number;
    installationCost?: number;
    includeNPV?: boolean;
  },
  source: string
): Promise<ValidationResult | null> {
  
  // Only validate in development mode
  if (import.meta.env.PROD) {
    return null;
  }
  
  try {
    // Get central calculation
    const central = await calculateFinancialMetrics({
      ...inputs,
      includeNPV: inputs.includeNPV ?? true
    });
    
    // Determine which metric to validate (prioritize what's available)
    let metricName: string;
    let localValue: number;
    let centralValue: number;
    
    if (localResult.paybackYears !== undefined && central.paybackYears !== undefined) {
      metricName = 'paybackYears';
      localValue = localResult.paybackYears;
      centralValue = central.paybackYears;
    } else if (localResult.npv !== undefined && central.npv !== undefined) {
      metricName = 'npv';
      localValue = localResult.npv;
      centralValue = central.npv;
    } else if (localResult.annualSavings !== undefined && central.annualSavings !== undefined) {
      metricName = 'annualSavings';
      localValue = localResult.annualSavings;
      centralValue = central.annualSavings;
    } else if (localResult.roi10Year !== undefined && central.roi10Year !== undefined) {
      metricName = 'roi10Year';
      localValue = localResult.roi10Year;
      centralValue = central.roi10Year;
    } else {
      // No comparable metrics found
      console.log(`ℹ️ ${source}: No comparable metrics for validation`);
      return null;
    }
    
    // Calculate variance
    const variance = centralValue !== 0 
      ? Math.abs((localValue - centralValue) / centralValue)
      : 0;
    
    const result: ValidationResult = {
      isValid: variance < 0.05, // 5% tolerance
      variance,
      localValue,
      centralValue,
      source,
      timestamp: Date.now(),
      message: variance > 0.05 
        ? `⚠️ ${source}: ${metricName} calculation off by ${(variance * 100).toFixed(1)}%`
        : `✅ ${source}: ${metricName} calculation validated`
    };
    
    // Log results with detail
    if (!result.isValid) {
      console.warn(result.message, {
        metric: metricName,
        local: localValue,
        central: centralValue,
        variance: `${(variance * 100).toFixed(2)}%`,
        inputs,
        localResult,
        centralResult: {
          paybackYears: central.paybackYears,
          npv: central.npv,
          irr: central.irr,
          annualSavings: central.annualSavings
        }
      });
    } else {
      console.log(result.message, {
        metric: metricName,
        variance: `${(variance * 100).toFixed(2)}%`
      });
    }
    
    // Dispatch event for optional monitoring dashboard
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('calculationValidation', { detail: result })
      );
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${source}: Validation failed`, error);
    return null;
  }
}

/**
 * Validation decorator for calculation functions
 * Wraps existing functions with validation layer
 * 
 * @param fn - Function to wrap
 * @param source - Source identifier
 * @param extractInputs - Function to extract validation inputs from function args
 * @returns Wrapped function with validation
 * 
 * @example
 * ```typescript
 * const calculateCosts = withValidation(
 *   async (powerMW, durationHrs) => {
 *     return { paybackYears: 8.5 };
 *   },
 *   'MyComponent.calculateCosts',
 *   ([powerMW, durationHrs]) => ({
 *     storageSizeMW: powerMW,
 *     durationHours: durationHrs,
 *     electricityRate: 0.12
 *   })
 * );
 * ```
 */
export function withValidation<T extends (...args: any[]) => any>(
  fn: T,
  source: string,
  extractInputs: (args: Parameters<T>) => any
): T {
  return (async (...args: Parameters<T>) => {
    // Execute original function
    const result = await fn(...args);
    
    // Validate in background (don't block)
    if (!import.meta.env.PROD) {
      const inputs = extractInputs(args);
      validateFinancialCalculation(result, inputs, source)
        .catch(err => console.error('Validation error:', err));
    }
    
    return result;
  }) as T;
}

/**
 * Batch validation for multiple calculations
 * Useful when testing multiple scenarios
 * 
 * @param validations - Array of validation configurations
 * @returns Array of validation results
 */
export async function batchValidate(
  validations: Array<{
    localResult: any;
    inputs: any;
    source: string;
  }>
): Promise<ValidationResult[]> {
  if (import.meta.env.PROD) {
    return [];
  }
  
  const results = await Promise.all(
    validations.map(({ localResult, inputs, source }) =>
      validateFinancialCalculation(localResult, inputs, source)
    )
  );
  
  return results.filter((r): r is ValidationResult => r !== null);
}

/**
 * Get validation statistics
 * Useful for monitoring calculation health
 */
export function getValidationStats(results: ValidationResult[]) {
  const failed = results.filter(r => !r.isValid);
  const avgVariance = results.length > 0
    ? results.reduce((sum, r) => sum + r.variance, 0) / results.length
    : 0;
  
  return {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    avgVariance,
    avgVariancePercent: (avgVariance * 100).toFixed(2) + '%',
    sources: [...new Set(results.map(r => r.source))],
    failedSources: [...new Set(failed.map(r => r.source))]
  };
}
