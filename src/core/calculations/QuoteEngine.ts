/**
 * QUOTE ENGINE - SINGLE SOURCE OF TRUTH ORCHESTRATOR
 * ===================================================
 *
 * This is THE entry point for all quote calculations in Merlin.
 *
 * VERSION HISTORY:
 * - 2.0.0 (Dec 6, 2025): Added caching, versioning, enhanced validation
 * - 1.0.0 (Dec 6, 2025): Initial SSOT orchestrator
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
 * @version 2.0.0
 * @date December 6, 2025
 */

import {
  calculateQuote,
  estimatePayback,
  type QuoteInput,
  type QuoteResult,
} from "@/services/unifiedQuoteCalculator";

import {
  calculateUseCasePower,
  calculateHotelPowerSimple,
  calculateCarWashPowerSimple,
  type HotelPowerSimpleInput,
  type HotelPowerSimpleResult,
  type CarWashPowerSimpleInput,
  type CarWashPowerSimpleResult,
  type PowerCalculationResult,
} from "@/services/useCasePowerCalculations";

import {
  calculateEVChargingPowerSimple,
  calculateEVHubPower,
  calculateEVHubBESSSize,
  type EVChargingPowerSimpleInput,
  type EVChargingPowerSimpleResult,
  type EVChargerConfig,
  type EVHubPowerResult,
} from "@/services/evChargingCalculations";

import {
  calculateFinancialMetrics,
  type FinancialCalculationInput,
  type FinancialCalculationResult,
} from "@/services/centralizedCalculations";

import {
  calculateEquipmentBreakdown,
  type EquipmentBreakdown,
  type EquipmentBreakdownOptions,
} from "@/utils/equipmentCalculations";

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
  EVHubPowerResult,
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
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// EXTENDED QUOTE RESULT WITH VERSIONING
// ============================================================================

export interface VersionedQuoteResult extends QuoteResult {
  metadata: QuoteResult["metadata"] & {
    engineVersion: string;
    cacheHit: boolean;
  };
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

interface CacheEntry {
  result: QuoteResult;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
const MAX_CACHE_SIZE = 100; // Maximum cache entries

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
  // VERSIONING
  // ==========================================================================

  /**
   * Engine version - bump when calculation logic changes.
   * Used for tracking historical quotes and debugging.
   */
  static readonly VERSION = "2.0.0";

  /**
   * Version changelog for documentation.
   */
  static readonly VERSION_HISTORY = {
    "2.0.0": "Added caching, versioning, enhanced validation (Dec 6, 2025)",
    "1.0.0": "Initial SSOT orchestrator (Dec 6, 2025)",
  };

  // ==========================================================================
  // CACHING
  // ==========================================================================

  /**
   * Quote result cache for expensive calculations.
   * Key: JSON-serialized input params
   * Value: Cached result with timestamp
   */
  private static quoteCache = new Map<string, CacheEntry>();

  /**
   * Generate a cache key from input parameters.
   */
  private static getCacheKey(input: QuoteInput): string {
    // Only cache on stable parameters (exclude timestamps, random values)
    const stableInput = {
      storageSizeMW: input.storageSizeMW,
      durationHours: input.durationHours,
      solarMW: input.solarMW || 0,
      windMW: input.windMW || 0,
      generatorMW: input.generatorMW || 0,
      generatorFuelType: input.generatorFuelType || "natural-gas",
      fuelCellMW: input.fuelCellMW || 0,
      fuelCellType: input.fuelCellType || "hydrogen",
      location: input.location || "California",
      electricityRate: input.electricityRate || 0.15,
      gridConnection: input.gridConnection || "on-grid",
      useCase: input.useCase || "general",
    };
    return JSON.stringify(stableInput);
  }

  /**
   * Check if a cache entry is still valid.
   */
  private static isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_TTL_MS;
  }

  /**
   * Clean up expired cache entries.
   */
  private static cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.quoteCache.entries()) {
      if (now - entry.timestamp >= CACHE_TTL_MS) {
        this.quoteCache.delete(key);
      }
    }

    // Enforce max size (LRU-style: delete oldest)
    if (this.quoteCache.size > MAX_CACHE_SIZE) {
      const entriesToDelete = this.quoteCache.size - MAX_CACHE_SIZE;
      const keys = Array.from(this.quoteCache.keys()).slice(0, entriesToDelete);
      keys.forEach((key) => this.quoteCache.delete(key));
    }
  }

  /**
   * Clear the quote cache (useful for testing or after pricing updates).
   */
  static clearCache(): void {
    this.quoteCache.clear();
    if (import.meta.env.DEV) console.log("🧹 [QuoteEngine] Cache cleared");
  }

  /**
   * Get cache statistics for monitoring.
   */
  static getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.quoteCache.size,
      maxSize: MAX_CACHE_SIZE,
      ttlMs: CACHE_TTL_MS,
    };
  }

  // ==========================================================================
  // QUOTE GENERATION
  // ==========================================================================

  /**
   * Generate a complete quote with equipment breakdown and financial metrics.
   *
   * THIS IS THE PRIMARY METHOD FOR GENERATING QUOTES.
   *
   * Features:
   * - Caching: Results cached for 5 minutes to improve performance
   * - Versioning: Each result includes engine version for tracking
   * - Validation: Input validated before calculation
   *
   * @param input - Quote input parameters
   * @param options - Optional configuration
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
  static async generateQuote(
    input: QuoteInput,
    options: { skipCache?: boolean; skipValidation?: boolean } = {}
  ): Promise<VersionedQuoteResult> {
    const { skipCache = false, skipValidation = false } = options;

    // ✅ COMMIT 5: Structured error handling for consistent Red Box UI
    try {
      // Validate input unless explicitly skipped
      if (!skipValidation) {
        const validation = this.validateInput(input);
        if (!validation.valid) {
          throw new Error(`Invalid quote input: ${validation.errors.join(", ")}`);
        }
        if (validation.warnings.length > 0) {
          console.warn("⚠️ [QuoteEngine] Validation warnings:", validation.warnings);
        }
      }

      // Check cache first (unless skipped)
      const cacheKey = this.getCacheKey(input);
      if (!skipCache) {
        const cached = this.quoteCache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
          if (import.meta.env.DEV) console.log("✅ [QuoteEngine] Cache hit");
          return {
            ...cached.result,
            metadata: {
              ...cached.result.metadata,
              engineVersion: this.VERSION,
              cacheHit: true,
            },
          };
        }
      }

      if (import.meta.env.DEV) {
        console.log("🔮 [QuoteEngine] Generating quote:", {
          storageSizeMW: input.storageSizeMW,
          durationHours: input.durationHours,
          useCase: input.useCase,
          location: input.location,
          version: this.VERSION,
        });
      }

      // Generate fresh quote
      const result = await calculateQuote(input);

      // Cache the result
      this.quoteCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // Clean up old entries periodically
      if (Math.random() < 0.1) {
        // 10% chance to trigger cleanup
        this.cleanCache();
      }

      return {
        ...result,
        metadata: {
          ...result.metadata,
          engineVersion: this.VERSION,
          cacheHit: false,
        },
      };
    } catch (err) {
      // Keep this loud in dev; still throws so UI can handle it consistently
      console.error("❌ [QuoteEngine] generateQuote failed:", err);

      // Re-throw to preserve stack trace / error boundaries upstream
      throw err;
    }
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
    if (import.meta.env.DEV)
      console.log("⚡ [QuoteEngine] Quick estimate:", {
        storageSizeMW,
        durationHours,
        electricityRate,
      });

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
    if (import.meta.env.DEV) console.log("⚡ [QuoteEngine] Calculating power for:", useCase);

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
    console.warn(
      "⚠️ [QuoteEngine] Direct financial calculation - prefer generateQuote() for full orchestration"
    );

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
    gridConnection: "on-grid" | "off-grid" | "limited" | "unreliable" | "expensive" = "on-grid",
    location: string = "California",
    options?: EquipmentBreakdownOptions
  ): Promise<EquipmentBreakdown> {
    console.warn(
      "⚠️ [QuoteEngine] Direct equipment calculation - prefer generateQuote() for full orchestration"
    );

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
  static getSystemCategory(storageSizeMW: number): "residential" | "commercial" | "utility" {
    if (storageSizeMW < 0.05) return "residential"; // < 50 kW
    if (storageSizeMW < 1.0) return "commercial"; // < 1 MW (C&I)
    return "utility"; // >= 1 MW
  }

  /**
   * Validate quote input parameters with comprehensive checks.
   *
   * @param input - Quote input to validate
   * @returns Validation result with errors and warnings
   *
   * @example
   * const validation = QuoteEngine.validateInput({ storageSizeMW: 0.5 });
   * if (!validation.valid) {
   *   console.error('Errors:', validation.errors);
   * }
   * if (validation.warnings.length > 0) {
   *   console.warn('Warnings:', validation.warnings);
   * }
   */
  static validateInput(input: Partial<QuoteInput>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ==========================================================================
    // REQUIRED FIELD VALIDATION (ERRORS)
    // ==========================================================================

    // Storage size validation
    if (input.storageSizeMW === undefined || input.storageSizeMW === null) {
      errors.push("storageSizeMW is required");
    } else if (input.storageSizeMW <= 0) {
      errors.push("storageSizeMW must be positive");
    } else if (input.storageSizeMW > 1000) {
      errors.push("storageSizeMW exceeds maximum (1000 MW)");
    }

    // Duration validation
    if (input.durationHours === undefined || input.durationHours === null) {
      errors.push("durationHours is required");
    } else if (input.durationHours <= 0) {
      errors.push("durationHours must be positive");
    } else if (input.durationHours > 24) {
      errors.push("durationHours exceeds maximum (24 hours)");
    }

    // ==========================================================================
    // OPTIONAL FIELD VALIDATION (ERRORS FOR INVALID VALUES)
    // ==========================================================================

    // Electricity rate
    if (input.electricityRate !== undefined && input.electricityRate < 0) {
      errors.push("electricityRate cannot be negative");
    }

    // Renewables/generators (must be non-negative)
    if (input.solarMW !== undefined && input.solarMW < 0) {
      errors.push("solarMW cannot be negative");
    }

    if (input.windMW !== undefined && input.windMW < 0) {
      errors.push("windMW cannot be negative");
    }

    if (input.generatorMW !== undefined && input.generatorMW < 0) {
      errors.push("generatorMW cannot be negative");
    }

    if (input.fuelCellMW !== undefined && input.fuelCellMW < 0) {
      errors.push("fuelCellMW cannot be negative");
    }

    // Grid connection type
    if (
      input.gridConnection &&
      !["on-grid", "off-grid", "limited", "unreliable", "expensive"].includes(input.gridConnection)
    ) {
      errors.push(
        'gridConnection must be "on-grid", "off-grid", "limited", "unreliable", or "expensive"'
      );
    }

    // Generator fuel type
    if (
      input.generatorFuelType &&
      !["diesel", "natural-gas", "dual-fuel"].includes(input.generatorFuelType)
    ) {
      errors.push('generatorFuelType must be "diesel", "natural-gas", or "dual-fuel"');
    }

    // Fuel cell type
    if (
      input.fuelCellType &&
      !["hydrogen", "natural-gas-fc", "solid-oxide"].includes(input.fuelCellType)
    ) {
      errors.push('fuelCellType must be "hydrogen", "natural-gas-fc", or "solid-oxide"');
    }

    // ==========================================================================
    // WARNINGS (NON-BLOCKING)
    // ==========================================================================

    // Duration outside typical range
    if (input.durationHours && (input.durationHours < 1 || input.durationHours > 12)) {
      warnings.push(`durationHours (${input.durationHours}h) is outside typical range (1-12h)`);
    }

    // Very small systems
    if (input.storageSizeMW && input.storageSizeMW < 0.01) {
      warnings.push(
        `storageSizeMW (${input.storageSizeMW} MW = ${input.storageSizeMW * 1000} kW) is very small`
      );
    }

    // Very large systems
    if (input.storageSizeMW && input.storageSizeMW > 100) {
      warnings.push(`storageSizeMW (${input.storageSizeMW} MW) is utility-scale - verify inputs`);
    }

    // High electricity rate
    if (input.electricityRate && input.electricityRate > 0.5) {
      warnings.push(`electricityRate ($${input.electricityRate}/kWh) is unusually high`);
    }

    // Low electricity rate
    if (input.electricityRate && input.electricityRate < 0.05) {
      warnings.push(`electricityRate ($${input.electricityRate}/kWh) is unusually low`);
    }

    // Solar larger than storage
    if (input.solarMW && input.storageSizeMW && input.solarMW > input.storageSizeMW * 3) {
      warnings.push(
        `solarMW (${input.solarMW} MW) is large relative to storage (${input.storageSizeMW} MW)`
      );
    }

    // Generator larger than storage
    if (input.generatorMW && input.storageSizeMW && input.generatorMW > input.storageSizeMW * 2) {
      warnings.push(
        `generatorMW (${input.generatorMW} MW) is large relative to storage (${input.storageSizeMW} MW)`
      );
    }

    // Off-grid without generator or renewables
    if (
      input.gridConnection === "off-grid" &&
      !input.solarMW &&
      !input.windMW &&
      !input.generatorMW &&
      !input.fuelCellMW
    ) {
      warnings.push(
        "Off-grid system has no generation source (solar, wind, generator, or fuel cell)"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default QuoteEngine;
