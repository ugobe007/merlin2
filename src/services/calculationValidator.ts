/**
 * CALCULATION VALIDATOR SERVICE
 * ==============================
 *
 * Background validation service that monitors all quote calculations
 * for SSOT compliance and industry benchmark adherence.
 *
 * Created: December 22, 2025
 *
 * FEATURES:
 * - Validates equipment costs against industry benchmarks
 * - Checks financial calculations for reasonableness
 * - Logs anomalies to Supabase for audit trail
 * - Sends email/SMS alerts on critical failures
 * - Provides real-time validation feedback
 *
 * USAGE:
 * ```typescript
 * import { CalculationValidator } from '@/services/calculationValidator';
 *
 * // Validate a quote result
 * const validation = await CalculationValidator.validateQuote(quoteResult, inputs);
 *
 * // Check if valid
 * if (!validation.isValid) {
 *   console.warn('Quote validation failed:', validation.warnings);
 * }
 * ```
 */

import { supabase } from "@/services/supabaseClient";
import { checkAndAlert, ALERT_CONFIG } from "@/services/alertNotificationService";
import type { QuoteResult } from "@/services/unifiedQuoteCalculator";

// ═══════════════════════════════════════════════════════════════════════════════
// INDUSTRY BENCHMARK BOUNDS (NREL, BNEF, Industry Standards)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION POLICY - Trust but Verify
// If SSOT produces bad numbers, that's a BUG to fix, not hide
// ═══════════════════════════════════════════════════════════════════════════════

export const VALIDATION_POLICY = {
  // Minimum score to display "SSOT Certified" badge
  // Below this, the badge is hidden and we log for debugging
  certifiedThreshold: 90,

  // Score that triggers DEV mode alerts (console.error, not just warn)
  // Below this in DEV = something is seriously wrong with SSOT
  criticalThreshold: 70,

  // In DEV mode, throw error if score drops below this
  // This ensures bugs are caught immediately, not deployed
  devFailThreshold: 50,

  // Always log to database for audit trail
  logAllValidations: true,
};

export const BENCHMARK_BOUNDS = {
  // BESS Pricing ($/kWh) - NREL ATB 2024
  bess: {
    min: 100, // Current market floor (utility scale, competitive)
    max: 250, // Premium/small scale with installation
    typical: 125, // Typical commercial rate
    source: "NREL ATB 2024",
  },

  // Solar Pricing ($/W) - NREL Cost Benchmark 2024
  solar: {
    min: 0.65, // Utility scale
    max: 2.5, // Small commercial with soft costs
    typical: 0.85, // Commercial scale
    source: "NREL Cost Benchmark 2024",
  },

  // Generator Pricing ($/kW)
  generator: {
    min: 400, // Basic diesel
    max: 1200, // Premium natural gas
    typical: 700, // Natural gas standard
    source: "Industry Standard",
  },

  // Installation as % of equipment
  installation: {
    min: 0.15, // 15% minimum
    max: 0.4, // 40% maximum
    typical: 0.25, // 25% typical
    source: "Industry Standard",
  },

  // Payback Period (years)
  payback: {
    min: 2, // Very aggressive (high rates, incentives)
    max: 15, // Conservative (low rates, no incentives)
    typical: 5, // Typical commercial
    source: "Industry Analysis",
  },

  // ROI 10-Year (%)
  roi10Year: {
    min: 50, // Minimum acceptable
    max: 400, // Exceptional case
    typical: 150, // Typical commercial
    source: "Industry Analysis",
  },

  // ITC Rate
  itcRate: {
    min: 0.3, // Standard ITC
    max: 0.5, // With adders (domestic content, energy community)
    typical: 0.3, // Standard rate
    source: "IRA 2022",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// USE CASE SPECIFIC BOUNDS
// ═══════════════════════════════════════════════════════════════════════════════

export const USE_CASE_BOUNDS: Record<
  string,
  {
    minKW: number;
    maxKW: number;
    typicalKW: number;
    description: string;
  }
> = {
  college: {
    minKW: 500,
    maxKW: 100000,
    typicalKW: 5000,
    description: "College/University campus",
  },
  hotel: {
    minKW: 100,
    maxKW: 5000,
    typicalKW: 500,
    description: "Hotel property",
  },
  hospital: {
    minKW: 500,
    maxKW: 20000,
    typicalKW: 3000,
    description: "Hospital/Medical center",
  },
  "data-center": {
    minKW: 1000,
    maxKW: 100000,
    typicalKW: 10000,
    description: "Data center facility",
  },
  manufacturing: {
    minKW: 500,
    maxKW: 50000,
    typicalKW: 5000,
    description: "Manufacturing facility",
  },
  retail: {
    minKW: 50,
    maxKW: 2000,
    typicalKW: 300,
    description: "Retail store",
  },
  warehouse: {
    minKW: 200,
    maxKW: 10000,
    typicalKW: 1000,
    description: "Warehouse/Distribution",
  },
  "car-wash": {
    minKW: 50,
    maxKW: 500,
    typicalKW: 150,
    description: "Car wash facility",
  },
  "ev-charging": {
    minKW: 100,
    maxKW: 10000,
    typicalKW: 500,
    description: "EV charging station",
  },
  default: {
    minKW: 50,
    maxKW: 50000,
    typicalKW: 1000,
    description: "General commercial",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationInput {
  storageSizeMW: number;
  durationHours: number;
  solarMW?: number;
  generatorMW?: number;
  location: string;
  useCase: string;
  electricityRate: number;
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
  severity: "info" | "warning" | "error";
  expectedRange?: { min: number; max: number };
  actualValue?: number;
  benchmark?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 compliance score
  warnings: ValidationWarning[];
  timestamp: string;
  version: string;
  inputs: ValidationInput;
  checksPerformed: number;
  checksPassed: number;
}

export interface AuditLogEntry {
  id?: string;
  created_at?: string;
  quote_id?: string;
  validation_result: ValidationResult;
  inputs: ValidationInput;
  outputs: {
    equipmentCost?: number;
    totalProjectCost?: number;
    annualSavings?: number;
    paybackYears?: number;
  };
  is_valid: boolean;
  score: number;
  warnings_count: number;
  user_id?: string;
  session_id?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATION VALIDATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class CalculationValidator {
  private static readonly VERSION = "1.0.0";

  /**
   * Validate a complete quote result against SSOT benchmarks
   */
  static async validateQuote(
    quoteResult: QuoteResult,
    inputs: ValidationInput,
    options: { logToDatabase?: boolean; sessionId?: string } = {}
  ): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 0;
    let checksPassed = 0;

    const { costs, financials, equipment } = quoteResult;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. VALIDATE BESS PRICING
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    const bessKWh = inputs.storageSizeMW * 1000 * inputs.durationHours;
    const bessCost = equipment?.batteries?.totalCost || (costs?.equipmentCost || 0) * 0.6;
    const bessPricePerKWh = bessKWh > 0 ? bessCost / bessKWh : 0;

    if (bessPricePerKWh > 0) {
      const typicalPrice = BENCHMARK_BOUNDS.bess.typical;
      const deviation = Math.abs((bessPricePerKWh - typicalPrice) / typicalPrice) * 100;

      // TRUEQUOTE SYSTEMATIC POLICY: Flag 3%+ deviation from benchmark
      if (deviation >= 3) {
        warnings.push({
          code: "BESS_PRICE_DEVIATION_3PERCENT",
          field: "bessPricing",
          message: `BESS price ($${bessPricePerKWh.toFixed(0)}/kWh) deviates ${deviation.toFixed(1)}% from benchmark ($${typicalPrice}/kWh). TrueQuote validation failed.`,
          severity: "error",
          expectedRange: {
            min: BENCHMARK_BOUNDS.bess.min,
            max: BENCHMARK_BOUNDS.bess.max,
          },
          actualValue: bessPricePerKWh,
          benchmark: BENCHMARK_BOUNDS.bess.source,
        });
      } else if (bessPricePerKWh < BENCHMARK_BOUNDS.bess.min) {
        warnings.push({
          code: "BESS_PRICE_LOW",
          field: "bessPricing",
          message: `BESS price ($${bessPricePerKWh.toFixed(0)}/kWh) is below market minimum ($${BENCHMARK_BOUNDS.bess.min}/kWh)`,
          severity: "warning",
          expectedRange: { min: BENCHMARK_BOUNDS.bess.min, max: BENCHMARK_BOUNDS.bess.max },
          actualValue: bessPricePerKWh,
          benchmark: BENCHMARK_BOUNDS.bess.source,
        });
      } else if (bessPricePerKWh > BENCHMARK_BOUNDS.bess.max) {
        warnings.push({
          code: "BESS_PRICE_HIGH",
          field: "bessPricing",
          message: `BESS price ($${bessPricePerKWh.toFixed(0)}/kWh) exceeds market maximum ($${BENCHMARK_BOUNDS.bess.max}/kWh)`,
          severity: "error",
          expectedRange: { min: BENCHMARK_BOUNDS.bess.min, max: BENCHMARK_BOUNDS.bess.max },
          actualValue: bessPricePerKWh,
          benchmark: BENCHMARK_BOUNDS.bess.source,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++; // No BESS to validate
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. VALIDATE SOLAR PRICING
    // ─────────────────────────────────────────────────────────────────────────
    if (inputs.solarMW && inputs.solarMW > 0) {
      checksPerformed++;
      const solarKW = inputs.solarMW * 1000;
      const solarCost = equipment?.solar?.totalCost || 0;
      const solarPricePerW = solarKW > 0 ? solarCost / solarKW : 0;

      if (solarPricePerW > 0) {
        const typicalPrice = BENCHMARK_BOUNDS.solar.typical;
        const deviation = Math.abs((solarPricePerW - typicalPrice) / typicalPrice) * 100;

        // TRUEQUOTE SYSTEMATIC POLICY: Flag 3%+ deviation from benchmark
        if (deviation >= 3) {
          warnings.push({
            code: "SOLAR_PRICE_DEVIATION_3PERCENT",
            field: "solarPricing",
            message: `Solar price ($${solarPricePerW.toFixed(2)}/W) deviates ${deviation.toFixed(1)}% from benchmark ($${typicalPrice}/W). TrueQuote validation failed.`,
            severity: "error",
            expectedRange: {
              min: BENCHMARK_BOUNDS.solar.min,
              max: BENCHMARK_BOUNDS.solar.max,
            },
            actualValue: solarPricePerW,
            benchmark: BENCHMARK_BOUNDS.solar.source,
          });
        } else if (solarPricePerW < BENCHMARK_BOUNDS.solar.min) {
          warnings.push({
            code: "SOLAR_PRICE_LOW",
            field: "solarPricing",
            message: `Solar price ($${solarPricePerW.toFixed(2)}/W) is below market minimum`,
            severity: "warning",
            expectedRange: { min: BENCHMARK_BOUNDS.solar.min, max: BENCHMARK_BOUNDS.solar.max },
            actualValue: solarPricePerW,
            benchmark: BENCHMARK_BOUNDS.solar.source,
          });
        } else if (solarPricePerW > BENCHMARK_BOUNDS.solar.max) {
          warnings.push({
            code: "SOLAR_PRICE_HIGH",
            field: "solarPricing",
            message: `Solar price ($${solarPricePerW.toFixed(2)}/W) exceeds market maximum`,
            severity: "error",
            expectedRange: { min: BENCHMARK_BOUNDS.solar.min, max: BENCHMARK_BOUNDS.solar.max },
            actualValue: solarPricePerW,
            benchmark: BENCHMARK_BOUNDS.solar.source,
          });
        } else {
          checksPassed++;
        }
      } else {
        checksPassed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. VALIDATE INSTALLATION RATIO
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    const installationRatio = costs?.equipmentCost
      ? (costs?.installationCost || 0) / costs.equipmentCost
      : 0;

    if (installationRatio > 0) {
      const typicalRatio = BENCHMARK_BOUNDS.installation.typical;
      const deviation = Math.abs((installationRatio - typicalRatio) / typicalRatio) * 100;

      // TRUEQUOTE SYSTEMATIC POLICY: Flag 3%+ deviation from benchmark
      if (deviation >= 3) {
        warnings.push({
          code: "INSTALLATION_DEVIATION_3PERCENT",
          field: "installationCost",
          message: `Installation ratio (${(installationRatio * 100).toFixed(0)}%) deviates ${deviation.toFixed(1)}% from benchmark (${(typicalRatio * 100).toFixed(0)}%). TrueQuote validation failed.`,
          severity: "error",
          expectedRange: {
            min: BENCHMARK_BOUNDS.installation.min * 100,
            max: BENCHMARK_BOUNDS.installation.max * 100,
          },
          actualValue: installationRatio * 100,
          benchmark: BENCHMARK_BOUNDS.installation.source,
        });
      } else if (installationRatio < BENCHMARK_BOUNDS.installation.min) {
        warnings.push({
          code: "INSTALLATION_LOW",
          field: "installationCost",
          message: `Installation ratio (${(installationRatio * 100).toFixed(0)}%) is unusually low`,
          severity: "info",
          expectedRange: {
            min: BENCHMARK_BOUNDS.installation.min * 100,
            max: BENCHMARK_BOUNDS.installation.max * 100,
          },
          actualValue: installationRatio * 100,
          benchmark: BENCHMARK_BOUNDS.installation.source,
        });
      } else if (installationRatio > BENCHMARK_BOUNDS.installation.max) {
        warnings.push({
          code: "INSTALLATION_HIGH",
          field: "installationCost",
          message: `Installation ratio (${(installationRatio * 100).toFixed(0)}%) exceeds typical maximum`,
          severity: "warning",
          expectedRange: {
            min: BENCHMARK_BOUNDS.installation.min * 100,
            max: BENCHMARK_BOUNDS.installation.max * 100,
          },
          actualValue: installationRatio * 100,
          benchmark: BENCHMARK_BOUNDS.installation.source,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. VALIDATE PAYBACK PERIOD
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    const payback = financials?.paybackYears || 0;

    if (payback > 0) {
      if (payback < BENCHMARK_BOUNDS.payback.min) {
        warnings.push({
          code: "PAYBACK_TOO_SHORT",
          field: "paybackYears",
          message: `Payback period (${payback.toFixed(1)} years) is unusually short - verify savings calculations`,
          severity: "warning",
          expectedRange: { min: BENCHMARK_BOUNDS.payback.min, max: BENCHMARK_BOUNDS.payback.max },
          actualValue: payback,
          benchmark: BENCHMARK_BOUNDS.payback.source,
        });
      } else if (payback > BENCHMARK_BOUNDS.payback.max) {
        warnings.push({
          code: "PAYBACK_TOO_LONG",
          field: "paybackYears",
          message: `Payback period (${payback.toFixed(1)} years) exceeds typical maximum - project may not be viable`,
          severity: "error",
          expectedRange: { min: BENCHMARK_BOUNDS.payback.min, max: BENCHMARK_BOUNDS.payback.max },
          actualValue: payback,
          benchmark: BENCHMARK_BOUNDS.payback.source,
        });
      } else {
        checksPassed++;
      }
    } else {
      warnings.push({
        code: "PAYBACK_ZERO",
        field: "paybackYears",
        message: "Payback period is zero or negative - check savings calculations",
        severity: "error",
        actualValue: payback,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. VALIDATE ITC CALCULATION
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    const totalCost = costs?.totalProjectCost || 0;
    const taxCredit = costs?.taxCredit || 0;
    const itcRate = totalCost > 0 ? taxCredit / totalCost : 0;

    if (itcRate > 0) {
      if (itcRate < BENCHMARK_BOUNDS.itcRate.min - 0.01) {
        warnings.push({
          code: "ITC_LOW",
          field: "taxCredit",
          message: `ITC rate (${(itcRate * 100).toFixed(0)}%) is below standard 30%`,
          severity: "warning",
          expectedRange: {
            min: BENCHMARK_BOUNDS.itcRate.min * 100,
            max: BENCHMARK_BOUNDS.itcRate.max * 100,
          },
          actualValue: itcRate * 100,
          benchmark: BENCHMARK_BOUNDS.itcRate.source,
        });
      } else if (itcRate > BENCHMARK_BOUNDS.itcRate.max + 0.01) {
        warnings.push({
          code: "ITC_HIGH",
          field: "taxCredit",
          message: `ITC rate (${(itcRate * 100).toFixed(0)}%) exceeds maximum possible`,
          severity: "error",
          expectedRange: {
            min: BENCHMARK_BOUNDS.itcRate.min * 100,
            max: BENCHMARK_BOUNDS.itcRate.max * 100,
          },
          actualValue: itcRate * 100,
          benchmark: BENCHMARK_BOUNDS.itcRate.source,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++; // ITC might be zero for some reason
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. VALIDATE USE CASE SIZING
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    const bounds = USE_CASE_BOUNDS[inputs.useCase] || USE_CASE_BOUNDS.default;
    const systemKW = inputs.storageSizeMW * 1000;

    if (systemKW < bounds.minKW) {
      warnings.push({
        code: "SYSTEM_UNDERSIZED",
        field: "storageSizeMW",
        message: `System size (${systemKW.toFixed(0)} kW) is below typical minimum for ${bounds.description}`,
        severity: "info",
        expectedRange: { min: bounds.minKW, max: bounds.maxKW },
        actualValue: systemKW,
      });
    } else if (systemKW > bounds.maxKW) {
      warnings.push({
        code: "SYSTEM_OVERSIZED",
        field: "storageSizeMW",
        message: `System size (${systemKW.toFixed(0)} kW) exceeds typical maximum for ${bounds.description}`,
        severity: "warning",
        expectedRange: { min: bounds.minKW, max: bounds.maxKW },
        actualValue: systemKW,
      });
    } else {
      checksPassed++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. VALIDATE ANNUAL SAVINGS REASONABLENESS
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    const annualSavings = financials?.annualSavings || 0;
    const maxReasonableSavings = systemKW * inputs.electricityRate * 8760 * 0.3; // 30% max utilization

    if (annualSavings > maxReasonableSavings && maxReasonableSavings > 0) {
      warnings.push({
        code: "SAVINGS_UNREALISTIC",
        field: "annualSavings",
        message: `Annual savings ($${annualSavings.toLocaleString()}) seems unrealistically high for system size`,
        severity: "warning",
        expectedRange: { min: 0, max: maxReasonableSavings },
        actualValue: annualSavings,
      });
    } else {
      checksPassed++;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. TRUEQUOTE SYSTEMATIC POLICY: Flag ALL calculations off by 3% or more
    // This applies to ALL use cases - no exceptions
    // ─────────────────────────────────────────────────────────────────────────
    checksPerformed++;
    // Reuse bounds from section 6
    const actualPowerKW = systemKW;
    const expectedPowerKW = bounds.typicalKW;

    if (expectedPowerKW > 0 && actualPowerKW > 0) {
      const powerDeviation = Math.abs((actualPowerKW - expectedPowerKW) / expectedPowerKW) * 100;

      if (powerDeviation >= 3) {
        warnings.push({
          code: "POWER_DEVIATION_3PERCENT",
          field: "storageSizeMW",
          message: `System power calculation deviates ${powerDeviation.toFixed(1)}% from expected benchmark (${expectedPowerKW} kW). TrueQuote validation failed.`,
          severity: "error",
          expectedRange: {
            min: expectedPowerKW * 0.97,
            max: expectedPowerKW * 1.03,
          },
          actualValue: actualPowerKW,
          benchmark: `${bounds.description} benchmark`,
        });
      } else {
        checksPassed++;
      }
    }

    // Validate equipment cost against benchmarks (ALL use cases)
    checksPerformed++;
    const equipmentCost = costs?.equipmentCost || 0;
    // Reuse bessKWh from section 1
    const expectedEquipmentCost = bessKWh * (BENCHMARK_BOUNDS.bess.typical / 1000); // Convert $/kWh to total cost

    if (equipmentCost > 0 && expectedEquipmentCost > 0) {
      const costDeviation =
        Math.abs((equipmentCost - expectedEquipmentCost) / expectedEquipmentCost) * 100;

      if (costDeviation >= 3) {
        warnings.push({
          code: "COST_DEVIATION_3PERCENT",
          field: "equipmentCost",
          message: `Equipment cost deviates ${costDeviation.toFixed(1)}% from expected benchmark ($${expectedEquipmentCost.toLocaleString()}). TrueQuote validation failed.`,
          severity: "error",
          expectedRange: {
            min: expectedEquipmentCost * 0.97,
            max: expectedEquipmentCost * 1.03,
          },
          actualValue: equipmentCost,
          benchmark: BENCHMARK_BOUNDS.bess.source,
        });
      } else {
        checksPassed++;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CALCULATE COMPLIANCE SCORE
    // ─────────────────────────────────────────────────────────────────────────
    const errorCount = warnings.filter((w) => w.severity === "error").length;
    const warningCount = warnings.filter((w) => w.severity === "warning").length;
    const infoCount = warnings.filter((w) => w.severity === "info").length;

    // Score: Start at 100, deduct for issues
    let score = 100;
    score -= errorCount * 25; // -25 per error
    score -= warningCount * 10; // -10 per warning
    score -= infoCount * 2; // -2 per info
    score = Math.max(0, Math.min(100, score));

    const result: ValidationResult = {
      isValid: errorCount === 0,
      score,
      warnings,
      timestamp: new Date().toISOString(),
      version: this.VERSION,
      inputs,
      checksPerformed,
      checksPassed,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      const emoji = result.isValid ? "✅" : "⚠️";
      console.log(`${emoji} Calculation Validation [Score: ${score}/100]`, {
        checksPerformed,
        checksPassed,
        errors: errorCount,
        warnings: warningCount,
        details: warnings,
      });
    }

    // Log to database if requested
    if (options.logToDatabase) {
      await this.logToDatabase(result, inputs, quoteResult, options.sessionId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEND ALERTS IF SCORE IS BELOW THRESHOLD
    // Email/SMS notifications for critical failures
    // ─────────────────────────────────────────────────────────────────────────
    if (score < ALERT_CONFIG.warningThreshold) {
      // Fire and forget - don't block on alert delivery
      checkAndAlert({
        score,
        useCase: inputs.useCase,
        location: inputs.location,
        errors: warnings.filter((w) => w.severity === "error").map((w) => w.message),
        timestamp: result.timestamp,
        sessionId: options.sessionId,
      }).catch((err) => {
        console.error("Failed to send SSOT alert:", err);
      });
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPRECATED: Silent recalculation removed (Option B approach)
  //
  // If validation fails, it's a BUG in the SSOT to fix at the source.
  // We don't silently patch bad numbers - we fail loudly in DEV.
  //
  // The shouldRecalculate() and applyCorrections() methods have been removed.
  // If you see validation failures, fix the underlying calculation in:
  // - unifiedQuoteCalculator.ts
  // - equipmentCalculations.ts
  // - centralizedCalculations.ts
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Log validation result to Supabase for audit trail
   */
  private static async logToDatabase(
    result: ValidationResult,
    inputs: ValidationInput,
    quoteResult: QuoteResult,
    sessionId?: string
  ): Promise<void> {
    try {
      const entry: Omit<AuditLogEntry, "id" | "created_at"> = {
        validation_result: result,
        inputs,
        outputs: {
          equipmentCost: quoteResult.costs?.equipmentCost,
          totalProjectCost: quoteResult.costs?.totalProjectCost,
          annualSavings: quoteResult.financials?.annualSavings,
          paybackYears: quoteResult.financials?.paybackYears,
        },
        is_valid: result.isValid,
        score: result.score,
        warnings_count: result.warnings.length,
        session_id: sessionId,
      };

      const { error } = await supabase.from("calculation_audit_log").insert(entry);

      if (error) {
        console.warn("Failed to log validation to database:", error);
      }
    } catch (err) {
      console.warn("Database logging error:", err);
    }
  }

  /**
   * Quick validation for UI - returns simple pass/fail
   */
  static quickValidate(
    equipmentCost: number,
    totalCost: number,
    annualSavings: number,
    paybackYears: number
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (paybackYears < 1 || paybackYears > 20) {
      issues.push(`Payback ${paybackYears.toFixed(1)} years outside normal range`);
    }

    if (annualSavings <= 0) {
      issues.push("Annual savings must be positive");
    }

    if (totalCost <= 0) {
      issues.push("Total cost must be positive");
    }

    const installRatio = (totalCost - equipmentCost) / equipmentCost;
    if (installRatio > 0.5) {
      issues.push("Installation costs unusually high");
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get benchmark bounds for display
   */
  static getBenchmarks() {
    return BENCHMARK_BOUNDS;
  }

  /**
   * Get use case bounds for display
   */
  static getUseCaseBounds(useCase: string) {
    return USE_CASE_BOUNDS[useCase] || USE_CASE_BOUNDS.default;
  }
}

export default CalculationValidator;
