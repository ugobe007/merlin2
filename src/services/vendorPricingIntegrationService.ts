/**
 * Vendor Pricing Integration Service
 * ===================================
 *
 * Integrates approved vendor product pricing into the unified pricing system.
 *
 * Flow:
 * 1. Vendor submits product → vendor_products table (status: 'pending')
 * 2. Admin approves → status: 'approved'
 * 3. This service syncs approved products to equipment_pricing table
 * 4. unifiedPricingService uses vendor pricing as priority source
 *
 * Created: December 25, 2025
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface VendorProductPricing {
  id: string;
  vendorId: string;
  productCategory: "battery" | "inverter" | "ems" | "bos" | "container";
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

export interface EquipmentPricingRecord {
  equipment_type: string;
  manufacturer: string;
  model: string;
  price_per_kwh?: number;
  price_per_kw?: number;
  capacity_kwh?: number;
  power_kw?: number;
  lead_time_weeks: number;
  warranty_years: number;
  certifications?: string[];
  vendor_id?: string;
  source: "vendor_submission";
  confidence_score: number;
  effective_date: string;
  expires_at?: string;
}

// ============================================================================
// SYNC APPROVED VENDOR PRODUCTS TO EQUIPMENT PRICING
// ============================================================================

/**
 * Sync approved vendor products to equipment_pricing table
 * This makes vendor pricing available to unifiedPricingService
 */
export async function syncApprovedVendorProducts(): Promise<{
  synced: number;
  errors: number;
  skipped: number;
}> {
  if (!isSupabaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn("⚠️ Supabase not configured - cannot sync vendor pricing");
    }
    return { synced: 0, errors: 0, skipped: 0 };
  }

  try {
    // Get all approved vendor products
    const { data: vendorProducts, error: fetchError } = await supabase
      .from("vendor_products")
      .select("*")
      .eq("status", "approved")
      .order("approved_at", { ascending: false });

    if (fetchError) {
      console.error("❌ Failed to fetch approved vendor products:", fetchError);
      return { synced: 0, errors: 1, skipped: 0 };
    }

    if (!vendorProducts || vendorProducts.length === 0) {
      if (import.meta.env.DEV) {
        console.log("ℹ️ No approved vendor products to sync");
      }
      return { synced: 0, errors: 0, skipped: 0 };
    }

    let synced = 0;
    let errors = 0;
    let skipped = 0;

    // Sync each approved product
    for (const product of vendorProducts) {
      try {
        // Map vendor product to equipment_pricing format
        const equipmentPricing: EquipmentPricingRecord = {
          equipment_type: mapProductCategoryToEquipmentType(product.product_category),
          manufacturer: product.manufacturer,
          model: product.model,
          price_per_kwh: product.price_per_kwh ? Number(product.price_per_kwh) : undefined,
          price_per_kw: product.price_per_kw ? Number(product.price_per_kw) : undefined,
          capacity_kwh: product.capacity_kwh ? Number(product.capacity_kwh) : undefined,
          power_kw: product.power_kw ? Number(product.power_kw) : undefined,
          lead_time_weeks: product.lead_time_weeks,
          warranty_years: product.warranty_years,
          certifications: product.certifications || [],
          vendor_id: product.vendor_id,
          source: "vendor_submission",
          confidence_score: 0.9, // High confidence for approved vendor data
          effective_date: product.approved_at || product.created_at,
          expires_at: getExpirationDate(product.approved_at || product.created_at), // 90 days
        };

        // Check if record already exists (by manufacturer + model + vendor_id)
        const { data: existing } = await supabase
          .from("equipment_pricing")
          .select("id")
          .eq("manufacturer", equipmentPricing.manufacturer)
          .eq("model", equipmentPricing.model)
          .eq("vendor_id", equipmentPricing.vendor_id)
          .eq("source", "vendor_submission")
          .single();

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from("equipment_pricing")
            .update(equipmentPricing)
            .eq("id", existing.id);

          if (updateError) {
            console.error(
              `❌ Failed to update equipment_pricing for ${product.model}:`,
              updateError
            );
            errors++;
          } else {
            synced++;
            if (import.meta.env.DEV) {
              console.log(`✅ Updated equipment_pricing: ${product.manufacturer} ${product.model}`);
            }
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from("equipment_pricing")
            .insert(equipmentPricing);

          if (insertError) {
            // Check if it's a constraint error (table might not exist yet)
            if (
              insertError.message.includes("does not exist") ||
              insertError.message.includes("relation")
            ) {
              if (import.meta.env.DEV) {
                console.warn(
                  `⚠️ equipment_pricing table not found - skipping sync for ${product.model}`
                );
              }
              skipped++;
            } else {
              console.error(
                `❌ Failed to insert equipment_pricing for ${product.model}:`,
                insertError
              );
              errors++;
            }
          } else {
            synced++;
            if (import.meta.env.DEV) {
              console.log(
                `✅ Synced vendor product to equipment_pricing: ${product.manufacturer} ${product.model}`
              );
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error syncing vendor product ${product.id}:`, error);
        errors++;
      }
    }

    if (import.meta.env.DEV) {
      console.log(
        `📊 Vendor pricing sync complete: ${synced} synced, ${errors} errors, ${skipped} skipped`
      );
    }

    return { synced, errors, skipped };
  } catch (error) {
    console.error("❌ Fatal error in syncApprovedVendorProducts:", error);
    return { synced: 0, errors: 1, skipped: 0 };
  }
}

/**
 * Map vendor product category to equipment type for equipment_pricing table
 */
function mapProductCategoryToEquipmentType(
  category: "battery" | "inverter" | "ems" | "bos" | "container"
): string {
  const mapping: Record<string, string> = {
    battery: "bess",
    inverter: "inverter",
    ems: "ems",
    bos: "bos",
    container: "container",
  };
  return mapping[category] || category;
}

/**
 * Get expiration date (90 days from approval)
 */
function getExpirationDate(approvedDate: string): string {
  const date = new Date(approvedDate);
  date.setDate(date.getDate() + 90); // 90 days validity
  return date.toISOString().split("T")[0];
}

// ============================================================================
// GET VENDOR PRICING FOR EQUIPMENT TYPE
// ============================================================================

/**
 * Get vendor pricing for a specific equipment type and capacity
 * Used by unifiedPricingService as priority source
 */
export async function getVendorPricing(
  equipmentType:
    | "bess"
    | "solar"
    | "wind"
    | "generator"
    | "inverter"
    | "ev-charger"
    | "ems"
    | "bos"
    | "container",
  capacityKwh?: number,
  powerKw?: number
): Promise<VendorProductPricing | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Map equipment type to product category
    const productCategory = mapEquipmentTypeToProductCategory(equipmentType);
    if (!productCategory) {
      return null; // Equipment type not supported by vendors
    }

    // Build query
    let query = supabase
      .from("vendor_products")
      .select("*")
      .eq("status", "approved")
      .eq("product_category", productCategory)
      .order("approved_at", { ascending: false })
      .limit(10); // Get most recent approved products

    // Filter by capacity if provided
    if (capacityKwh) {
      // Find products within 20% of requested capacity
      const minCapacity = capacityKwh * 0.8;
      const maxCapacity = capacityKwh * 1.2;
      query = query.gte("capacity_kwh", minCapacity).lte("capacity_kwh", maxCapacity);
    }

    // Filter by power if provided
    if (powerKw) {
      const minPower = powerKw * 0.8;
      const maxPower = powerKw * 1.2;
      query = query.gte("power_kw", minPower).lte("power_kw", maxPower);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Failed to fetch vendor pricing:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Return the most recent approved product that matches
    const product = data[0];
    return {
      id: product.id,
      vendorId: product.vendor_id,
      productCategory: product.product_category,
      manufacturer: product.manufacturer,
      model: product.model,
      capacityKwh: product.capacity_kwh ? Number(product.capacity_kwh) : undefined,
      powerKw: product.power_kw ? Number(product.power_kw) : undefined,
      pricePerKwh: product.price_per_kwh ? Number(product.price_per_kwh) : undefined,
      pricePerKw: product.price_per_kw ? Number(product.price_per_kw) : undefined,
      leadTimeWeeks: product.lead_time_weeks,
      warrantyYears: product.warranty_years,
      certifications: product.certifications || [],
      approvedAt: new Date(product.approved_at || product.created_at),
    };
  } catch (error) {
    console.error("❌ Error fetching vendor pricing:", error);
    return null;
  }
}

/**
 * Map equipment type to vendor product category
 */
function mapEquipmentTypeToProductCategory(
  equipmentType: string
): "battery" | "inverter" | "ems" | "bos" | "container" | null {
  const mapping: Record<string, "battery" | "inverter" | "ems" | "bos" | "container"> = {
    bess: "battery",
    battery: "battery",
    inverter: "inverter",
    ems: "ems",
    bos: "bos",
    container: "container",
  };
  return mapping[equipmentType] || null;
}

// ============================================================================
// AUTO-SYNC ON PRODUCT APPROVAL
// ============================================================================

/**
 * Sync a single vendor product when it's approved
 * Called by admin approval workflow
 */
export async function syncVendorProductOnApproval(productId: string): Promise<boolean> {
  try {
    // Get the approved product
    const { data: product, error: fetchError } = await supabase
      .from("vendor_products")
      .select("*")
      .eq("id", productId)
      .eq("status", "approved")
      .single();

    if (fetchError || !product) {
      console.error("❌ Failed to fetch approved product:", fetchError);
      return false;
    }

    // Sync to equipment_pricing
    const result = await syncApprovedVendorProducts();

    if (result.synced > 0) {
      if (import.meta.env.DEV) {
        console.log(
          `✅ Auto-synced approved vendor product: ${product.manufacturer} ${product.model}`
        );
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error syncing vendor product on approval:", error);
    return false;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const vendorPricingIntegrationService = {
  syncApprovedVendorProducts,
  getVendorPricing,
  syncVendorProductOnApproval,
};

export default vendorPricingIntegrationService;
