/**
 * Vendor Validation Service
 * =========================
 *
 * Validates vendor product pricing against market benchmarks.
 * Used for automated approval workflow.
 *
 * Validation Checks:
 * 1. Price within market range (±20% of market average)
 * 2. Required fields present
 * 3. Certifications valid
 * 4. Pricing consistency (price per kWh/kW reasonable)
 *
 * Created: December 25, 2025
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getMarketPriceSummary } from "./marketDataIntegrationService";

// ============================================================================
// TYPES
// ============================================================================

export interface VendorProductValidation {
  productId: string;
  isValid: boolean;
  score: number; // 0-1, where 1 = perfect, 0.8+ = auto-approve
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: "error" | "warning";
  field: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// ============================================================================
// MARKET BENCHMARKS
// ============================================================================

/**
 * Get market benchmark prices for equipment types
 * These are fallback values if market data is unavailable
 */
function getMarketBenchmarks(): Record<string, { min: number; max: number; avg: number }> {
  return {
    battery: {
      min: 80, // $/kWh - Very competitive
      max: 200, // $/kWh - Premium
      avg: 135, // $/kWh - Market average (Q4 2025)
    },
    inverter: {
      min: 80, // $/kW
      max: 200, // $/kW
      avg: 140, // $/kW
    },
    ems: {
      min: 50, // $/kW
      max: 150, // $/kW
      avg: 100, // $/kW
    },
    bos: {
      min: 0.1, // 10% of equipment cost
      max: 0.3, // 30% of equipment cost
      avg: 0.2, // 20% of equipment cost
    },
    container: {
      min: 500, // $/unit
      max: 2000, // $/unit
      avg: 1200, // $/unit
    },
  };
}

// ============================================================================
// VALIDATE VENDOR PRODUCT
// ============================================================================

/**
 * Validate a vendor product submission
 * Returns validation score and issues
 */
export async function validateVendorPricing(product: {
  product_category: "battery" | "inverter" | "ems" | "bos" | "container";
  manufacturer: string;
  model: string;
  capacity_kwh?: number;
  power_kw?: number;
  price_per_kwh?: number;
  price_per_kw?: number;
  lead_time_weeks: number;
  warranty_years: number;
  certifications?: string[];
}): Promise<VendorProductValidation> {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationWarning[] = [];
  const recommendations: string[] = [];
  let score = 1.0; // Start with perfect score, deduct for issues

  // ========================================================================
  // CHECK 1: Required Fields
  // ========================================================================
  if (!product.manufacturer || product.manufacturer.trim().length === 0) {
    issues.push({
      type: "error",
      field: "manufacturer",
      message: "Manufacturer is required",
      severity: "critical",
    });
    score -= 0.3;
  }

  if (!product.model || product.model.trim().length === 0) {
    issues.push({
      type: "error",
      field: "model",
      message: "Model is required",
      severity: "critical",
    });
    score -= 0.3;
  }

  if (!product.lead_time_weeks || product.lead_time_weeks < 1) {
    issues.push({
      type: "error",
      field: "lead_time_weeks",
      message: "Lead time must be at least 1 week",
      severity: "high",
    });
    score -= 0.2;
  }

  if (!product.warranty_years || product.warranty_years < 1) {
    issues.push({
      type: "error",
      field: "warranty_years",
      message: "Warranty must be at least 1 year",
      severity: "high",
    });
    score -= 0.2;
  }

  // ========================================================================
  // CHECK 2: Pricing Validation
  // ========================================================================
  const category = product.product_category;
  let pricePerUnit: number | undefined;
  let capacity: number | undefined;

  if (category === "battery") {
    pricePerUnit = product.price_per_kwh;
    capacity = product.capacity_kwh;

    if (!pricePerUnit) {
      issues.push({
        type: "error",
        field: "price_per_kwh",
        message: "Price per kWh is required for battery products",
        severity: "critical",
      });
      score -= 0.3;
    } else if (pricePerUnit <= 0) {
      issues.push({
        type: "error",
        field: "price_per_kwh",
        message: "Price per kWh must be greater than 0",
        severity: "critical",
      });
      score -= 0.3;
    }
  } else if (category === "inverter" || category === "ems") {
    pricePerUnit = product.price_per_kw;
    capacity = product.power_kw;

    if (!pricePerUnit) {
      issues.push({
        type: "error",
        field: "price_per_kw",
        message: `Price per kW is required for ${category} products`,
        severity: "critical",
      });
      score -= 0.3;
    } else if (pricePerUnit <= 0) {
      issues.push({
        type: "error",
        field: "price_per_kw",
        message: "Price per kW must be greater than 0",
        severity: "critical",
      });
      score -= 0.3;
    }
  }

  // ========================================================================
  // CHECK 3: Price Range Validation (Market Benchmarks)
  // ========================================================================
  if (pricePerUnit && (category === "battery" || category === "inverter" || category === "ems")) {
    try {
      // Try to get market data first
      let marketAvg: number | null = null;
      let marketMin: number | null = null;
      let marketMax: number | null = null;

      if (isSupabaseConfigured()) {
        // Map category to equipment type for market data lookup
        const equipmentTypeMap: Record<
          string,
          "bess" | "inverter" | "solar" | "wind" | "generator" | "ev-charger"
        > = {
          battery: "bess",
          inverter: "inverter",
          ems: "inverter", // EMS pricing similar to inverters
          bos: "bess", // BOS pricing similar to batteries
          container: "bess", // Container pricing similar to batteries
        };
        const equipmentType = equipmentTypeMap[category] || "bess";
        const marketSummary = await getMarketPriceSummary(equipmentType, "north-america");

        if (marketSummary) {
          marketAvg = marketSummary.averagePrice;
          marketMin = marketSummary.minPrice;
          marketMax = marketSummary.maxPrice;
        }
      }

      // Fallback to benchmarks if market data unavailable
      if (!marketAvg) {
        const benchmarks = getMarketBenchmarks();
        const benchmark = benchmarks[category];
        marketAvg = benchmark.avg;
        marketMin = benchmark.min;
        marketMax = benchmark.max;
      }

      // Calculate price deviation from market average
      const priceDeviation = ((pricePerUnit - marketAvg) / marketAvg) * 100;
      const deviationAbs = Math.abs(priceDeviation);

      // Check if price is within acceptable range (±20%)
      if (deviationAbs > 20) {
        if (pricePerUnit < marketMin! * 0.8) {
          // Price too low - possible error or unsustainable pricing
          issues.push({
            type: "warning",
            field: category === "battery" ? "price_per_kwh" : "price_per_kw",
            message: `Price is ${deviationAbs.toFixed(1)}% below market average. This may be an error or unsustainable pricing.`,
            severity: "high",
          });
          score -= 0.15;
          recommendations.push(
            "Verify pricing is correct. Very low prices may indicate data entry error."
          );
        } else if (pricePerUnit > marketMax! * 1.2) {
          // Price too high - may not be competitive
          warnings.push({
            field: category === "battery" ? "price_per_kwh" : "price_per_kw",
            message: `Price is ${deviationAbs.toFixed(1)}% above market average.`,
            suggestion: "Consider if premium features justify the higher price.",
          });
          score -= 0.1;
        }
      } else if (deviationAbs > 10) {
        // Within range but notable deviation
        warnings.push({
          field: category === "battery" ? "price_per_kwh" : "price_per_kw",
          message: `Price is ${deviationAbs.toFixed(1)}% ${priceDeviation > 0 ? "above" : "below"} market average.`,
          suggestion: "This is acceptable but may affect competitiveness.",
        });
        score -= 0.05;
      }

      // Check if price is within absolute bounds
      if (marketMin && pricePerUnit < marketMin * 0.5) {
        issues.push({
          type: "error",
          field: category === "battery" ? "price_per_kwh" : "price_per_kw",
          message: `Price is extremely low (${pricePerUnit.toFixed(2)}). This likely indicates an error.`,
          severity: "critical",
        });
        score -= 0.3;
      }

      if (marketMax && pricePerUnit > marketMax * 2) {
        issues.push({
          type: "warning",
          field: category === "battery" ? "price_per_kwh" : "price_per_kw",
          message: `Price is extremely high (${pricePerUnit.toFixed(2)}). Verify this is correct.`,
          severity: "high",
        });
        score -= 0.2;
      }
    } catch (error) {
      console.error("Error validating price against market data:", error);
      // Don't fail validation if market data check fails
      warnings.push({
        field: "pricing",
        message: "Could not validate pricing against market data.",
        suggestion: "Manual review recommended.",
      });
    }
  }

  // ========================================================================
  // CHECK 4: Capacity/Power Validation
  // ========================================================================
  if (category === "battery" && capacity) {
    if (capacity < 1) {
      issues.push({
        type: "error",
        field: "capacity_kwh",
        message: "Battery capacity must be at least 1 kWh",
        severity: "high",
      });
      score -= 0.15;
    } else if (capacity > 100000) {
      warnings.push({
        field: "capacity_kwh",
        message: "Battery capacity is very large. Verify this is correct.",
        suggestion: "Confirm capacity is in kWh, not Wh or MWh.",
      });
      score -= 0.05;
    }
  }

  if ((category === "inverter" || category === "ems") && capacity) {
    if (capacity < 1) {
      issues.push({
        type: "error",
        field: "power_kw",
        message: "Power rating must be at least 1 kW",
        severity: "high",
      });
      score -= 0.15;
    } else if (capacity > 10000) {
      warnings.push({
        field: "power_kw",
        message: "Power rating is very large. Verify this is correct.",
        suggestion: "Confirm power is in kW, not W or MW.",
      });
      score -= 0.05;
    }
  }

  // ========================================================================
  // CHECK 5: Lead Time Validation
  // ========================================================================
  if (product.lead_time_weeks > 52) {
    warnings.push({
      field: "lead_time_weeks",
      message: "Lead time is over 1 year. This may affect competitiveness.",
      suggestion: "Consider if this is accurate or if expedited options are available.",
    });
    score -= 0.05;
  }

  if (product.lead_time_weeks < 1) {
    issues.push({
      type: "error",
      field: "lead_time_weeks",
      message: "Lead time must be at least 1 week",
      severity: "high",
    });
    score -= 0.2;
  }

  // ========================================================================
  // CHECK 6: Warranty Validation
  // ========================================================================
  if (product.warranty_years > 20) {
    warnings.push({
      field: "warranty_years",
      message: "Warranty period is unusually long. Verify this is correct.",
      suggestion: "Confirm warranty terms and conditions.",
    });
    score -= 0.05;
  }

  if (product.warranty_years < 1) {
    issues.push({
      type: "error",
      field: "warranty_years",
      message: "Warranty must be at least 1 year",
      severity: "high",
    });
    score -= 0.2;
  }

  // ========================================================================
  // CHECK 7: Certifications (if provided)
  // ========================================================================
  if (product.certifications && product.certifications.length > 0) {
    const validCertifications = ["UL9540", "IEC 62619", "UN38.3", "CE", "FCC", "IEEE"];
    const invalidCerts = product.certifications.filter(
      (cert) => !validCertifications.some((v) => cert.toUpperCase().includes(v))
    );

    if (invalidCerts.length > 0) {
      warnings.push({
        field: "certifications",
        message: `Some certifications may not be standard: ${invalidCerts.join(", ")}`,
        suggestion: "Verify certification names are correct.",
      });
      score -= 0.05;
    }
  }

  // ========================================================================
  // FINAL SCORE CALCULATION
  // ========================================================================
  score = Math.max(0, Math.min(1, score)); // Clamp between 0 and 1

  // Determine if product should be auto-approved
  const isValid = score >= 0.8 && issues.filter((i) => i.severity === "critical").length === 0;

  // Add recommendations based on score
  if (score < 0.8) {
    recommendations.push("Product requires manual review before approval.");
  } else if (score >= 0.9) {
    recommendations.push("Product meets all validation criteria. Auto-approval recommended.");
  } else {
    recommendations.push("Product is mostly valid but has minor issues. Review recommended.");
  }

  return {
    productId: product.model || "unknown",
    isValid,
    score,
    issues,
    warnings,
    recommendations,
  };
}

/**
 * Validate vendor product by ID (fetches from database)
 */
export async function validateVendorProductById(
  productId: string
): Promise<VendorProductValidation> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { data: product, error } = await supabase
      .from("vendor_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error || !product) {
      throw new Error("Product not found");
    }

    return await validateVendorPricing({
      product_category: product.product_category as "battery" | "inverter" | "ems" | "bos" | "container",
      manufacturer: product.manufacturer,
      model: product.model,
      capacity_kwh: product.capacity_kwh ? Number(product.capacity_kwh) : undefined,
      power_kw: product.power_kw ? Number(product.power_kw) : undefined,
      price_per_kwh: product.price_per_kwh ? Number(product.price_per_kwh) : undefined,
      price_per_kw: product.price_per_kw ? Number(product.price_per_kw) : undefined,
      lead_time_weeks: product.lead_time_weeks,
      warranty_years: product.warranty_years,
      certifications: product.certifications || [],
    });
  } catch (error) {
    console.error("Error validating vendor product:", error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const vendorValidationService = {
  validateVendorPricing,
  validateVendorProductById,
  getMarketBenchmarks,
};

export default vendorValidationService;
