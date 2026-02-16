/**
 * Vendor Data to ML Training Service
 * ===================================
 *
 * Feeds approved vendor product pricing into the ML training data pipeline.
 *
 * Flow:
 * 1. Vendor product approved → vendor_products table (status: 'approved')
 * 2. This service creates entry in ai_training_data table
 * 3. ML processing service analyzes vendor data along with RSS feed data
 * 4. Price trends and insights include vendor pricing
 *
 * Created: December 25, 2025
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface VendorMLTrainingData {
  productId: string;
  vendorId: string;
  productCategory: string;
  manufacturer: string;
  model: string;
  capacityKwh?: number;
  powerKw?: number;
  pricePerKwh?: number;
  pricePerKw?: number;
  leadTimeWeeks: number;
  warrantyYears: number;
  certifications?: string[];
  approvedAt: Date;
}

// ============================================================================
// ADD VENDOR DATA TO ML TRAINING
// ============================================================================

/**
 * Add approved vendor product to ML training data
 * Called when vendor product is approved
 */
export async function addVendorDataToMLTraining(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ Supabase not configured - cannot add vendor data to ML training");
    }
    return false;
  }

  try {
    // Get the approved vendor product
    const { data: product, error: fetchError } = await supabase
      .from("vendor_products")
      .select("*")
      .eq("id", productId)
      .eq("status", "approved")
      .single();

    if (fetchError || !product) {
      console.error("❌ Failed to fetch approved vendor product:", fetchError);
      return false;
    }

    // Map product category to product type for ML
    const productType = mapProductCategoryToMLType(product.product_category as "battery" | "inverter" | "ems" | "bos" | "container");
    if (!productType) {
      if (import.meta.env.DEV) {
        console.warn(
          `⚠️ Product category ${product.product_category} not supported for ML training`
        );
      }
      return false;
    }

    // Determine price per unit based on product type
    let pricePerUnit: number | undefined;
    let capacity: number | undefined;
    let capacityUnit: string = "kWh";

    if (product.product_category === "battery") {
      pricePerUnit = product.price_per_kwh ? Number(product.price_per_kwh) : undefined;
      capacity = product.capacity_kwh ? Number(product.capacity_kwh) : undefined;
      capacityUnit = "kWh";
    } else if (product.product_category === "inverter") {
      pricePerUnit = product.price_per_kw ? Number(product.price_per_kw) : undefined;
      capacity = product.power_kw ? Number(product.power_kw) : undefined;
      capacityUnit = "kW";
    } else {
      // For other categories, use available pricing
      pricePerUnit = (product.price_per_kwh || product.price_per_kw) ?? undefined;
      capacity = (product.capacity_kwh || product.power_kw) ?? undefined;
    }

    if (!pricePerUnit) {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ No pricing data for vendor product ${productId}`);
      }
      return false;
    }

    // Check if this product already exists in ML training data
    const { data: existing } = await supabase
      .from("ai_training_data")
      .select("id")
      .eq("data_type", "pricing")
      .eq("product_type", productType)
      .eq("manufacturer", product.manufacturer)
      .eq("model_name", product.model)
      .eq("source", "vendor_submission")
      .eq("vendor_id", product.vendor_id)
      .single();

    // Prepare ML training data entry
    const mlTrainingData = {
      data_type: "pricing",
      product_type: productType,
      manufacturer: product.manufacturer,
      model_name: product.model,
      data_json: {
        capacity: capacity,
        capacityUnit: capacityUnit,
        pricePerUnit: pricePerUnit,
        priceUnit: product.product_category === "battery" ? "$/kWh" : "$/kW",
        leadTimeWeeks: product.lead_time_weeks,
        warrantyYears: product.warranty_years,
        certifications: product.certifications || [],
        vendorId: product.vendor_id,
        productId: product.id,
        approvedAt: product.approved_at || product.created_at,
        rawText: `Vendor submission: ${product.manufacturer} ${product.model}`,
      },
      source: "vendor_submission",
      confidence_score: 0.9, // High confidence for approved vendor data
      vendor_id: product.vendor_id,
      processed_for_ml: false, // Will be processed by ML service
      created_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from("ai_training_data")
        .update(mlTrainingData)
        .eq("id", existing.id);

      if (updateError) {
        console.error("❌ Failed to update ML training data:", updateError);
        return false;
      }

      if (import.meta.env.DEV) {
        console.log(
          `✅ Updated ML training data for vendor product: ${product.manufacturer} ${product.model}`
        );
      }
    } else {
      // Insert new entry
      const { error: insertError } = await supabase.from("ai_training_data").insert(mlTrainingData);

      if (insertError) {
        // Check if table exists
        if (
          insertError.message.includes("does not exist") ||
          insertError.message.includes("relation")
        ) {
          if (import.meta.env.DEV) {
            console.warn(
              "⚠️ ai_training_data table not found - skipping ML training data creation"
            );
          }
          return false;
        }
        console.error("❌ Failed to insert ML training data:", insertError);
        return false;
      }

      if (import.meta.env.DEV) {
        console.log(
          `✅ Added vendor product to ML training data: ${product.manufacturer} ${product.model}`
        );
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error adding vendor data to ML training:", error);
    return false;
  }
}

/**
 * Map vendor product category to ML product type
 */
function mapProductCategoryToMLType(
  category: "battery" | "inverter" | "ems" | "bos" | "container"
): string | null {
  const mapping: Record<string, string> = {
    battery: "battery",
    inverter: "inverter",
    ems: "ems",
    bos: "bos",
    container: "container",
  };
  return mapping[category] || null;
}

/**
 * Batch add multiple vendor products to ML training
 * Useful for initial sync or bulk updates
 */
export async function batchAddVendorDataToMLTraining(
  productIds: string[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const productId of productIds) {
    const result = await addVendorDataToMLTraining(productId);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  if (import.meta.env.DEV) {
    console.log(`📊 Batch ML training data sync: ${success} success, ${failed} failed`);
  }

  return { success, failed };
}

/**
 * Sync all approved vendor products to ML training data
 * Useful for initial setup or periodic sync
 */
export async function syncAllApprovedVendorProductsToML(): Promise<{
  synced: number;
  errors: number;
  skipped: number;
}> {
  if (!isSupabaseConfigured()) {
    return { synced: 0, errors: 0, skipped: 0 };
  }

  try {
    // Get all approved vendor products
    const { data: products, error: fetchError } = await supabase
      .from("vendor_products")
      .select("id")
      .eq("status", "approved");

    if (fetchError) {
      console.error("❌ Failed to fetch approved vendor products:", fetchError);
      return { synced: 0, errors: 1, skipped: 0 };
    }

    if (!products || products.length === 0) {
      if (import.meta.env.DEV) {
        console.log("ℹ️ No approved vendor products to sync to ML training");
      }
      return { synced: 0, errors: 0, skipped: 0 };
    }

    const result = await batchAddVendorDataToMLTraining(products.map((p) => p.id));

    return {
      synced: result.success,
      errors: result.failed,
      skipped: 0,
    };
  } catch (error) {
    console.error("❌ Error syncing vendor products to ML training:", error);
    return { synced: 0, errors: 1, skipped: 0 };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const vendorDataToMLService = {
  addVendorDataToMLTraining,
  batchAddVendorDataToMLTraining,
  syncAllApprovedVendorProductsToML,
};

export default vendorDataToMLService;
