/**
 * Equipment Vendor Service
 * ========================
 * Database-driven equipment vendor and pricing lookups
 *
 * Tables: equipment_vendors, ev_charger_catalog
 * Update Frequency: Quarterly
 * Source: NREL ATB, Vendor websites
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface EquipmentVendor {
  id: string;
  vendor_name: string;
  vendor_type: "battery_cell" | "battery_system" | "inverter" | "transformer" | "bms";
  country_of_origin: string;
  product_name: string;
  product_model: string;
  capacity_kwh: number | null;
  capacity_kw: number | null;
  price_per_unit: number;
  price_unit: "$/kWh" | "$/kW" | "$/unit" | "$/kVA";
  min_order_quantity: number;
  chemistry: "LFP" | "NMC" | "NCA" | null;
  cycle_life: number | null;
  round_trip_efficiency: number | null;
  depth_of_discharge: number | null;
  warranty_years: number | null;
  calendar_life_years: number | null;
  ul_listed: boolean;
  ul_certifications: string[];
  lead_time_weeks: number | null;
  region_availability: string[];
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  data_source: string;
  effective_date: string;
}

export interface EVCharger {
  id: string;
  charger_class: "Level2" | "DCFC" | "HPC";
  charger_type: string;
  power_kw: number;
  hardware_cost_min: number;
  hardware_cost_max: number;
  hardware_cost_typical: number;
  install_cost_min: number;
  install_cost_max: number;
  install_cost_typical: number;
  make_ready_cost_min: number;
  make_ready_cost_max: number;
  make_ready_cost_typical: number;
  voltage: number;
  amperage: number;
  connector_type: string;
  simultaneous_charging: boolean;
  efficiency: number;
  typical_utilization: number;
  sessions_per_day: number;
  typical_rate_per_kwh: number;
  typical_session_fee: number;
  typical_session_kwh: number;
  example_vendors: string[];
  data_source: string;
}

export interface EquipmentQuote {
  vendorName: string;
  productName: string;
  productModel: string;
  tier: string;
  unitPrice: number;
  priceUnit: string;
  totalPrice: number;
  quantity: number;
  leadTimeWeeks: number | null;
  warranty: number | null;
  chemistry: string | null;
  efficiency: number | null;
}

export interface BESSEquipmentBreakdown {
  batteries: EquipmentQuote[];
  inverters: EquipmentQuote[];
  transformers: EquipmentQuote[];
  totalBatteryCost: number;
  totalInverterCost: number;
  totalTransformerCost: number;
  grandTotal: number;
  averagePricePerKWh: number;
  recommendedVendor: string;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const cache: Map<string, { data: unknown; timestamp: number }> = new Map();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// BATTERY SYSTEM FUNCTIONS
// ============================================================================

/**
 * Get all battery system vendors
 */
export async function getBatteryVendors(
  tier?: "Tier 1" | "Tier 2" | "Tier 3"
): Promise<EquipmentVendor[]> {
  const cacheKey = `battery_vendors_${tier || "all"}`;
  const cached = getCached<EquipmentVendor[]>(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from("equipment_vendors")
      .select("*")
      .eq("vendor_type", "battery_system")
      .order("price_per_unit", { ascending: true });

    if (tier) {
      query = query.eq("tier", tier);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching battery vendors:", error);
      return [];
    }

    const vendors = data as EquipmentVendor[];
    setCache(cacheKey, vendors);
    return vendors;
  } catch (err) {
    console.error("Failed to fetch battery vendors:", err);
    return [];
  }
}

/**
 * Get battery pricing by capacity tier
 */
export async function getBatteryPricingBySize(systemSizeKWh: number): Promise<{
  tier1Price: number;
  tier2Price: number;
  averagePrice: number;
  recommendedVendors: EquipmentVendor[];
}> {
  const vendors = await getBatteryVendors();

  // Filter by availability for the size
  const tier1 = vendors.filter((v) => v.tier === "Tier 1");
  const tier2 = vendors.filter((v) => v.tier === "Tier 2");

  const tier1Avg =
    tier1.length > 0 ? tier1.reduce((sum, v) => sum + v.price_per_unit, 0) / tier1.length : 280;

  const tier2Avg =
    tier2.length > 0 ? tier2.reduce((sum, v) => sum + v.price_per_unit, 0) / tier2.length : 230;

  const overallAvg =
    vendors.length > 0
      ? vendors.reduce((sum, v) => sum + v.price_per_unit, 0) / vendors.length
      : 250;

  // Recommend based on size
  const recommendedVendors =
    systemSizeKWh >= 5000
      ? tier1 // Large projects use Tier 1
      : tier2; // Smaller projects can use Tier 2

  return {
    tier1Price: tier1Avg,
    tier2Price: tier2Avg,
    averagePrice: overallAvg,
    recommendedVendors: recommendedVendors.slice(0, 3),
  };
}

// ============================================================================
// INVERTER FUNCTIONS
// ============================================================================

/**
 * Get all inverter vendors
 */
export async function getInverterVendors(): Promise<EquipmentVendor[]> {
  const cacheKey = "inverter_vendors";
  const cached = getCached<EquipmentVendor[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("equipment_vendors")
      .select("*")
      .eq("vendor_type", "inverter")
      .order("price_per_unit", { ascending: true });

    if (error) {
      console.error("Error fetching inverter vendors:", error);
      return [];
    }

    const vendors = data as EquipmentVendor[];
    setCache(cacheKey, vendors);
    return vendors;
  } catch (err) {
    console.error("Failed to fetch inverter vendors:", err);
    return [];
  }
}

/**
 * Get inverter pricing
 */
export async function getInverterPricing(): Promise<{
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}> {
  const vendors = await getInverterVendors();

  if (vendors.length === 0) {
    return { averagePrice: 32, minPrice: 28, maxPrice: 35 };
  }

  const prices = vendors.map((v) => v.price_per_unit);
  return {
    averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

// ============================================================================
// TRANSFORMER FUNCTIONS
// ============================================================================

/**
 * Get all transformer vendors
 */
export async function getTransformerVendors(): Promise<EquipmentVendor[]> {
  const cacheKey = "transformer_vendors";
  const cached = getCached<EquipmentVendor[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("equipment_vendors")
      .select("*")
      .eq("vendor_type", "transformer")
      .order("price_per_unit", { ascending: true });

    if (error) {
      console.error("Error fetching transformer vendors:", error);
      return [];
    }

    const vendors = data as EquipmentVendor[];
    setCache(cacheKey, vendors);
    return vendors;
  } catch (err) {
    console.error("Failed to fetch transformer vendors:", err);
    return [];
  }
}

// ============================================================================
// EV CHARGER FUNCTIONS
// ============================================================================

/**
 * Get all EV chargers
 */
export async function getEVChargers(): Promise<EVCharger[]> {
  const cacheKey = "ev_chargers";
  const cached = getCached<EVCharger[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("ev_charger_catalog")
      .select("*")
      .order("power_kw", { ascending: true });

    if (error) {
      console.error("Error fetching EV chargers:", error);
      return [];
    }

    const chargers = data as EVCharger[];
    setCache(cacheKey, chargers);
    return chargers;
  } catch (err) {
    console.error("Failed to fetch EV chargers:", err);
    return [];
  }
}

/**
 * Get EV charger by type
 */
export async function getEVChargerByType(chargerType: string): Promise<EVCharger | null> {
  try {
    const { data, error } = await supabase
      .from("ev_charger_catalog")
      .select("*")
      .eq("charger_type", chargerType)
      .single();

    if (error) {
      console.error("Error fetching EV charger:", error);
      return null;
    }

    return data as EVCharger;
  } catch (err) {
    console.error("Failed to fetch EV charger:", err);
    return null;
  }
}

/**
 * Get EV chargers by class (Level2, DCFC, HPC)
 */
export async function getEVChargersByClass(
  chargerClass: "Level2" | "DCFC" | "HPC"
): Promise<EVCharger[]> {
  try {
    const { data, error } = await supabase
      .from("ev_charger_catalog")
      .select("*")
      .eq("charger_class", chargerClass)
      .order("power_kw", { ascending: true });

    if (error) {
      console.error("Error fetching EV chargers by class:", error);
      return [];
    }

    return data as EVCharger[];
  } catch (err) {
    console.error("Failed to fetch EV chargers:", err);
    return [];
  }
}

/**
 * Calculate EV charger costs for a project
 */
export async function calculateEVChargerCosts(config: {
  level2Count?: number;
  level2Power?: number;
  dcfcCount?: number;
  dcfcPower?: number;
  hpcCount?: number;
  hpcPower?: number;
}): Promise<{
  level2Cost: number;
  dcfcCost: number;
  hpcCost: number;
  totalHardwareCost: number;
  totalInstallCost: number;
  totalMakeReadyCost: number;
  grandTotal: number;
  chargerDetails: Array<{
    type: string;
    count: number;
    unitCost: number;
    totalCost: number;
  }>;
}> {
  const chargers = await getEVChargers();

  let level2Cost = 0;
  let dcfcCost = 0;
  let hpcCost = 0;
  let totalHardware = 0;
  let totalInstall = 0;
  let totalMakeReady = 0;
  const details: Array<{ type: string; count: number; unitCost: number; totalCost: number }> = [];

  // Level 2 chargers
  if (config.level2Count && config.level2Count > 0) {
    const power = config.level2Power || 11;
    const charger =
      chargers.find((c) => c.charger_class === "Level2" && c.power_kw >= power) ||
      chargers.find((c) => c.charger_class === "Level2");

    if (charger) {
      const unitCost =
        charger.hardware_cost_typical +
        charger.install_cost_typical +
        charger.make_ready_cost_typical;
      level2Cost = unitCost * config.level2Count;
      totalHardware += charger.hardware_cost_typical * config.level2Count;
      totalInstall += charger.install_cost_typical * config.level2Count;
      totalMakeReady += charger.make_ready_cost_typical * config.level2Count;
      details.push({
        type: `Level 2 (${charger.power_kw}kW)`,
        count: config.level2Count,
        unitCost,
        totalCost: level2Cost,
      });
    }
  }

  // DCFC chargers
  if (config.dcfcCount && config.dcfcCount > 0) {
    const power = config.dcfcPower || 150;
    const charger =
      chargers.find((c) => c.charger_class === "DCFC" && c.power_kw >= power) ||
      chargers.find((c) => c.charger_class === "DCFC");

    if (charger) {
      const unitCost =
        charger.hardware_cost_typical +
        charger.install_cost_typical +
        charger.make_ready_cost_typical;
      dcfcCost = unitCost * config.dcfcCount;
      totalHardware += charger.hardware_cost_typical * config.dcfcCount;
      totalInstall += charger.install_cost_typical * config.dcfcCount;
      totalMakeReady += charger.make_ready_cost_typical * config.dcfcCount;
      details.push({
        type: `DCFC (${charger.power_kw}kW)`,
        count: config.dcfcCount,
        unitCost,
        totalCost: dcfcCost,
      });
    }
  }

  // HPC chargers
  if (config.hpcCount && config.hpcCount > 0) {
    const power = config.hpcPower || 350;
    const charger =
      chargers.find((c) => c.charger_class === "HPC" && c.power_kw >= power) ||
      chargers.find((c) => c.charger_class === "HPC");

    if (charger) {
      const unitCost =
        charger.hardware_cost_typical +
        charger.install_cost_typical +
        charger.make_ready_cost_typical;
      hpcCost = unitCost * config.hpcCount;
      totalHardware += charger.hardware_cost_typical * config.hpcCount;
      totalInstall += charger.install_cost_typical * config.hpcCount;
      totalMakeReady += charger.make_ready_cost_typical * config.hpcCount;
      details.push({
        type: `HPC (${charger.power_kw}kW)`,
        count: config.hpcCount,
        unitCost,
        totalCost: hpcCost,
      });
    }
  }

  return {
    level2Cost,
    dcfcCost,
    hpcCost,
    totalHardwareCost: totalHardware,
    totalInstallCost: totalInstall,
    totalMakeReadyCost: totalMakeReady,
    grandTotal: totalHardware + totalInstall + totalMakeReady,
    chargerDetails: details,
  };
}

// ============================================================================
// COMPLETE BESS EQUIPMENT BREAKDOWN
// ============================================================================

/**
 * Get complete BESS equipment breakdown with vendor options
 */
export async function getBESSEquipmentBreakdown(params: {
  systemSizeKWh: number;
  systemSizeKW: number;
  preferTier1?: boolean;
}): Promise<BESSEquipmentBreakdown> {
  const { systemSizeKWh, systemSizeKW, preferTier1 = true } = params;

  // Get all vendors
  const batteryVendors = await getBatteryVendors(preferTier1 ? "Tier 1" : undefined);
  const inverterVendors = await getInverterVendors();
  const transformerVendors = await getTransformerVendors();

  // Calculate battery quotes
  const batteryQuotes: EquipmentQuote[] = batteryVendors.slice(0, 3).map((v) => ({
    vendorName: v.vendor_name,
    productName: v.product_name,
    productModel: v.product_model,
    tier: v.tier,
    unitPrice: v.price_per_unit,
    priceUnit: v.price_unit,
    totalPrice: v.price_per_unit * systemSizeKWh,
    quantity: Math.ceil(systemSizeKWh / (v.capacity_kwh || 3000)),
    leadTimeWeeks: v.lead_time_weeks,
    warranty: v.warranty_years,
    chemistry: v.chemistry,
    efficiency: v.round_trip_efficiency,
  }));

  // Calculate inverter quotes
  const inverterQuotes: EquipmentQuote[] = inverterVendors.slice(0, 2).map((v) => ({
    vendorName: v.vendor_name,
    productName: v.product_name,
    productModel: v.product_model,
    tier: v.tier,
    unitPrice: v.price_per_unit,
    priceUnit: v.price_unit,
    totalPrice: v.price_per_unit * systemSizeKW,
    quantity: Math.ceil(systemSizeKW / (v.capacity_kw || 3000)),
    leadTimeWeeks: v.lead_time_weeks,
    warranty: v.warranty_years,
    chemistry: null,
    efficiency: v.round_trip_efficiency,
  }));

  // Calculate transformer quotes
  const transformerQuotes: EquipmentQuote[] = transformerVendors.slice(0, 2).map((v) => ({
    vendorName: v.vendor_name,
    productName: v.product_name,
    productModel: v.product_model,
    tier: v.tier,
    unitPrice: v.price_per_unit,
    priceUnit: v.price_unit,
    totalPrice: v.price_per_unit * systemSizeKW * 1.1, // 10% oversizing for transformer
    quantity: Math.ceil(systemSizeKW / (v.capacity_kw || 3000)),
    leadTimeWeeks: v.lead_time_weeks,
    warranty: v.warranty_years,
    chemistry: null,
    efficiency: v.round_trip_efficiency,
  }));

  // Calculate totals using cheapest option for each
  const totalBatteryCost =
    batteryQuotes.length > 0
      ? Math.min(...batteryQuotes.map((q) => q.totalPrice))
      : systemSizeKWh * 250;

  const totalInverterCost =
    inverterQuotes.length > 0
      ? Math.min(...inverterQuotes.map((q) => q.totalPrice))
      : systemSizeKW * 32;

  const totalTransformerCost =
    transformerQuotes.length > 0
      ? Math.min(...transformerQuotes.map((q) => q.totalPrice))
      : systemSizeKW * 20;

  const grandTotal = totalBatteryCost + totalInverterCost + totalTransformerCost;
  const averagePrice = grandTotal / systemSizeKWh;

  // Get recommended vendor (best value Tier 1)
  const recommendedVendor =
    batteryQuotes.find((q) => q.tier === "Tier 1")?.vendorName ||
    batteryQuotes[0]?.vendorName ||
    "CATL";

  return {
    batteries: batteryQuotes,
    inverters: inverterQuotes,
    transformers: transformerQuotes,
    totalBatteryCost,
    totalInverterCost,
    totalTransformerCost,
    grandTotal,
    averagePricePerKWh: averagePrice,
    recommendedVendor,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getBatteryVendors,
  getBatteryPricingBySize,
  getInverterVendors,
  getInverterPricing,
  getTransformerVendors,
  getEVChargers,
  getEVChargerByType,
  getEVChargersByClass,
  calculateEVChargerCosts,
  getBESSEquipmentBreakdown,
};
