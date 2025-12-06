/**
 * QUOTE ENGINE - SINGLE SOURCE OF TRUTH ORCHESTRATOR
 * ===================================================
 * 
 * This is THE entry point for all quote calculations in Merlin.
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         QuoteEngine                             │
 * │                   (Facade / Orchestrator)                       │
 * └─────────────────────────────────┬───────────────────────────────┘
 *                                   │
 *          ┌────────────────────────┼────────────────────────┐
 *          ▼                        ▼                        ▼
 * ┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
 * │  Power/Demand   │    │  Equipment/Pricing  │    │   Financial     │
 * │  Calculations   │    │    Calculations     │    │   Calculations  │
 * └─────────────────┘    └─────────────────────┘    └─────────────────┘
 *         │                        │                        │
 *         ▼                        ▼                        ▼
 * useCasePower       equipmentCalculations     centralizedCalculations
 * Calculations.ts    .ts + unifiedPricing      .ts
 *                    Service.ts
 * 
 * USAGE:
 * ```typescript
 * import { QuoteEngine } from '@/core/calculations/QuoteEngine';
 * 
 * // Generate a complete quote
 * const quote = await QuoteEngine.generateQuote({
 *   storageSizeMW: 0.5,
 *   durationHours: 4,
 *   location: 'California',
 *   electricityRate: 0.20,
 *   useCase: 'hotel'
 * });
 * 
 * // Quick estimate for UI preview
 * const estimate = await QuoteEngine.quickEstimate(0.5, 4, 0.20);
 * 
 * // Calculate power requirements for a use case
 * const power = QuoteEngine.calculatePower('hotel', { rooms: 150 });
 * ```
 * 
 * SSOT COMPLIANCE:
 * - All financial calculations go through centralizedCalculations.ts
 * - All equipment pricing goes through equipmentCalculations.ts
 * - All power calculations go through useCasePowerCalculations.ts
 * - No component should bypass this engine for quotes
 * 
 * @version 1.0.0
 * @date December 6, 2025
 */

import { 
  calculateQuote, 
  estimatePayback,
  type QuoteInput, 
  type QuoteResult 
} from '@/services/unifiedQuoteCalculator';

import { 
  calculateUseCasePower,
  calculateHotelPowerSimple,
  calculateCarWashPowerSimple,
  type HotelPowerSimpleInput,
  type HotelPowerSimpleResult,
  type CarWashPowerSimpleInput,
  type CarWashPowerSimpleResult,
  type PowerCalculationResult
} from '@/services/useCasePowerCalculations';

import {
  calculateEVChargingPowerSimple,
  calculateEVHubPower,
  calculateEVHubBESSSize,
  type EVChargingPowerSimpleInput,
  type EVChargingPowerSimpleResult,
  type EVChargerConfig,
  type EVHubPowerResult
} from '@/services/evChargingCalculations';

import {
  calculateFinancialMetrics,
  type FinancialCalculationInput,
  type FinancialCalculationResult
} from '@/services/centralizedCalculations';

import {
  calculateEquipmentBreakdown,
  type EquipmentBreakdown,
  type EquipmentBreakdownOptions
} from '@/utils/equipmentCalculations';

// ============================================================================
// RE-EXPORT TYPES FOR CONVENIENCE
// ============================================================================

export type { 
  QuoteInput, 
  QuoteResult,
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
  EVHubPowerResult
};

// ============================================================================
// QUICK ESTIMATE TYPES
// ============================================================================

export interface QuickEstimate {
  paybackYears: number;
  annualSavings: number;
  estimatedCost: number;
}

// ============================================================================
// BESS RECOMMENDATION TYPE (inline - not exported from evChargingCalculations)
// ============================================================================

export interface EVHubBESSRecommendation {
  recommendedPowerMW: number;
  recommendedEnergyMWh: number;
  durationHours: number;
  reasoning: string;
}

// ============================================================================
// POWER CALCULATION UNION TYPE
// ============================================================================

export type PowerResult = 
  | HotelPowerSimpleResult 
  | CarWashPowerSimpleResult 
  | EVChargingPowerSimpleResult
  | PowerCalculationResult;

// ============================================================================
// QUOTE ENGINE CLASS - THE FACADE
// ============================================================================

/**
 * QuoteEngine - The single source of truth for all quote calculations.
 * 
 * This static class provides a unified API for:
 * - Generating complete quotes
 * - Quick estimates for UI previews
 * - Power/demand calculations by use case
 * - Equipment breakdown
 * - Financial metrics
 * 
 * All methods delegate to the appropriate SSOT services.
 */
export class QuoteEngine {
  
  // ==========================================================================
  // QUOTE GENERATION
  // ==========================================================================
  
  /**
   * Generate a complete quote with equipment breakdown and financial metrics.
   * 
   * THIS IS THE PRIMARY METHOD FOR GENERATING QUOTES.
   * 
   * @param input - Quote input parameters
   * @returns Complete quote with costs, equipment, and financials
   * 
   * @example
   * const quote = await QuoteEngine.generateQuote({
   *   storageSizeMW: 0.5,
   *   durationHours: 4,
   *   location: 'California',
   *   electricityRate: 0.20,
   *   useCase: 'hotel',
   *   solarMW: 0.1,
   *   generatorMW: 0.2,
   *   generatorFuelType: 'diesel'
   * });
   */
  static async generateQuote(input: QuoteInput): Promise<QuoteResult> {
    console.log('🔮 [QuoteEngine] Generating quote:', {
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours,
      useCase: input.useCase,
      location: input.location
    });
    
    return calculateQuote(input);
  }
  
  /**
   * Quick estimate for UI previews - does NOT generate full equipment breakdown.
   * Use for real-time sliders and preview cards only.
   * 
   * @param storageSizeMW - Battery storage size in MW
   * @param durationHours - Duration in hours
   * @param electricityRate - Electricity rate in $/kWh (default 0.15)
   * @returns Quick estimate with payback, savings, and cost
   * 
   * @example
   * const estimate = await QuoteEngine.quickEstimate(0.5, 4, 0.20);
   * // Use for real-time UI feedback
   */
  static async quickEstimate(
    storageSizeMW: number,
    durationHours: number,
    electricityRate: number = 0.15
  ): Promise<QuickEstimate> {
    console.log('⚡ [QuoteEngine] Quick estimate:', { storageSizeMW, durationHours, electricityRate });
    
    return estimatePayback(storageSizeMW, durationHours, electricityRate);
  }
  
  // ==========================================================================
  // POWER CALCULATIONS
  // ==========================================================================
  
  /**
   * Calculate power requirements for a specific use case.
   * 
   * Routes to the appropriate SSOT calculator based on use case slug.
   * 
   * @param useCase - Use case slug (e.g., 'hotel', 'car-wash', 'ev-charging')
   * @param data - Use case specific data
   * @returns Power calculation result
   * 
   * @example
   * const hotelPower = QuoteEngine.calculatePower('hotel', { 
   *   rooms: 150, 
   *   hotelClass: 'upscale',
   *   amenities: ['pool', 'restaurant']
   * });
   */
  static calculatePower(useCase: string, data: Record<string, unknown>): PowerCalculationResult {
    console.log('⚡ [QuoteEngine] Calculating power for:', useCase);
    
    return calculateUseCasePower(useCase, data);
  }
  
  /**
   * Calculate hotel power requirements (simple landing page version).
   * 
   * @param input - Hotel power input parameters
   * @returns Hotel power calculation result
   */
  static calculateHotelPower(input: HotelPowerSimpleInput): HotelPowerSimpleResult {
    return calculateHotelPowerSimple(input);
  }
  
  /**
   * Calculate car wash power requirements (simple landing page version).
   * 
   * @param input - Car wash power input parameters
   * @returns Car wash power calculation result
   */
  static calculateCarWashPower(input: CarWashPowerSimpleInput): CarWashPowerSimpleResult {
    return calculateCarWashPowerSimple(input);
  }
  
  /**
   * Calculate EV charging power requirements (simple landing page version).
   * 
   * @param input - EV charging power input parameters
   * @returns EV charging power calculation result
   */
  static calculateEVChargingPower(input: EVChargingPowerSimpleInput): EVChargingPowerSimpleResult {
    return calculateEVChargingPowerSimple(input);
  }
  
  // ==========================================================================
  // EV HUB CALCULATIONS (ADVANCED)
  // ==========================================================================
  
  /**
   * Calculate EV hub power requirements (advanced configuration).
   * 
   * @param config - EV hub configuration
   * @param concurrencyPercent - Concurrency factor (default 70%)
   * @returns EV hub power calculation result
   */
  static calculateEVHubPower(
    config: EVChargerConfig, 
    concurrencyPercent: number = 70
  ): EVHubPowerResult {
    return calculateEVHubPower(config, concurrencyPercent);
  }
  
  /**
   * Calculate recommended BESS size for an EV hub.
   * 
   * @param powerResult - Power result from calculateEVHubPower
   * @returns BESS sizing recommendation
   */
  static calculateEVHubBESSSize(powerResult: EVHubPowerResult): EVHubBESSRecommendation {
    return calculateEVHubBESSSize(powerResult);
  }
  
  // ==========================================================================
  // FINANCIAL CALCULATIONS (DIRECT ACCESS - USE WITH CAUTION)
  // ==========================================================================
  
  /**
   * Calculate financial metrics directly.
   * 
   * ⚠️ WARNING: Prefer using generateQuote() which orchestrates both 
   * equipment and financial calculations correctly.
   * 
   * Use this only when you already have equipment costs from another source.
   * 
   * @param input - Financial calculation input
   * @returns Financial metrics including NPV, IRR, payback
   */
  static async calculateFinancials(
    input: FinancialCalculationInput
  ): Promise<FinancialCalculationResult> {
    console.warn('⚠️ [QuoteEngine] Direct financial calculation - prefer generateQuote() for full orchestration');
    
    return calculateFinancialMetrics(input);
  }
  
  // ==========================================================================
  // EQUIPMENT CALCULATIONS (DIRECT ACCESS - USE WITH CAUTION)
  // ==========================================================================
  
  /**
   * Calculate equipment breakdown directly.
   * 
   * ⚠️ WARNING: Prefer using generateQuote() which orchestrates both 
   * equipment and financial calculations correctly.
   * 
   * Use this only when you need equipment breakdown without financial metrics.
   * 
   * @param storageSizeMW - Battery storage size in MW
   * @param durationHours - Duration in hours
   * @param solarMW - Solar capacity in MW (optional)
   * @param windMW - Wind capacity in MW (optional)
   * @param generatorMW - Generator capacity in MW (optional)
   * @param industryContext - Industry context for specialized pricing
   * @param gridConnection - Grid connection type
   * @param location - Location for regional pricing
   * @param options - Extended equipment options (fuel type, fuel cell, etc.)
   * @returns Equipment breakdown with costs
   */
  static async calculateEquipment(
    storageSizeMW: number,
    durationHours: number,
    solarMW: number = 0,
    windMW: number = 0,
    generatorMW: number = 0,
    industryContext?: { selectedIndustry?: string; useCaseData?: unknown },
    gridConnection: 'on-grid' | 'off-grid' | 'limited' = 'on-grid',
    location: string = 'California',
    options?: EquipmentBreakdownOptions
  ): Promise<EquipmentBreakdown> {
    console.warn('⚠️ [QuoteEngine] Direct equipment calculation - prefer generateQuote() for full orchestration');
    
    return calculateEquipmentBreakdown(
      storageSizeMW,
      durationHours,
      solarMW,
      windMW,
      generatorMW,
      industryContext,
      gridConnection,
      location,
      options
    );
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  /**
   * Get system category based on storage size.
   * 
   * @param storageSizeMW - Storage size in MW
   * @returns System category: 'residential', 'commercial', or 'utility'
   */
  static getSystemCategory(storageSizeMW: number): 'residential' | 'commercial' | 'utility' {
    if (storageSizeMW < 0.05) return 'residential';  // < 50 kW
    if (storageSizeMW < 1.0) return 'commercial';     // < 1 MW (C&I)
    return 'utility';                                  // >= 1 MW
  }
  
  /**
   * Validate quote input parameters.
   * 
   * @param input - Quote input to validate
   * @returns Validation result with errors if any
   */
  static validateInput(input: Partial<QuoteInput>): { 
    valid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    if (!input.storageSizeMW || input.storageSizeMW <= 0) {
      errors.push('storageSizeMW must be a positive number');
    }
    
    if (!input.durationHours || input.durationHours <= 0) {
      errors.push('durationHours must be a positive number');
    }
    
    if (input.durationHours && (input.durationHours < 1 || input.durationHours > 12)) {
      errors.push('durationHours should be between 1 and 12 hours');
    }
    
    if (input.electricityRate && input.electricityRate < 0) {
      errors.push('electricityRate cannot be negative');
    }
    
    if (input.solarMW && input.solarMW < 0) {
      errors.push('solarMW cannot be negative');
    }
    
    if (input.windMW && input.windMW < 0) {
      errors.push('windMW cannot be negative');
    }
    
    if (input.generatorMW && input.generatorMW < 0) {
      errors.push('generatorMW cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default QuoteEngine;
