/**
 * ISO Market Service
 * ==================
 * Database-driven ISO/RTO market prices for ancillary services revenue calculations
 *
 * Table: iso_market_prices
 * Update Frequency: Monthly (prices volatile)
 * Source: CAISO OASIS, ERCOT, PJM, NYISO, ISO-NE, MISO
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface ISOMarketPrice {
  id: string;
  iso_rto: "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO";
  service_type: "frequency_regulation" | "spinning_reserves" | "capacity" | "energy_arbitrage";
  price_per_mw_year: number;
  price_per_mwh: number | null;
  utilization_rate: number;
  typical_capacity_factor: number;
  min_duration_hours: number;
  min_power_mw: number;
  qualification_requirements: string;
  market_trend: "increasing" | "stable" | "decreasing";
  data_source: string;
  effective_date: string;
  notes: string | null;
}

export interface AncillaryRevenueEstimate {
  isoRto: string;
  serviceType: string;
  annualRevenue: number;
  revenuePerKWYear: number;
  utilizationRate: number;
  capacityFactor: number;
  meetsRequirements: boolean;
  requirementGaps: string[];
}

export interface TotalRevenueProjection {
  iso: string;
  systemSizeKW: number;
  durationHours: number;
  services: AncillaryRevenueEstimate[];
  totalAnnualRevenue: number;
  totalRevenuePerKWYear: number;
  bestOpportunity: string;
  riskLevel: "low" | "medium" | "high";
  marketOutlook: string;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 1000 * 60 * 15; // 15 minutes (market prices change)
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
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Get all ISO market prices
 */
export async function getAllISOPrices(): Promise<ISOMarketPrice[]> {
  const cacheKey = "all_iso_prices";
  const cached = getCached<ISOMarketPrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("iso_market_prices")
      .select("*")
      .order("iso_rto", { ascending: true });

    if (error) {
      console.error("Error fetching ISO prices:", error);
      return [];
    }

    const prices = data as unknown as ISOMarketPrice[];
    setCache(cacheKey, prices);
    return prices;
  } catch (err) {
    console.error("Failed to fetch ISO prices:", err);
    return [];
  }
}

/**
 * Get prices for a specific ISO/RTO
 */
export async function getISOPrices(
  isoRto: "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO"
): Promise<ISOMarketPrice[]> {
  const cacheKey = `iso_prices_${isoRto}`;
  const cached = getCached<ISOMarketPrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("iso_market_prices")
      .select("*")
      .eq("iso_rto", isoRto)
      .order("price_per_mw_year", { ascending: false });

    if (error) {
      console.error("Error fetching ISO prices:", error);
      return [];
    }

    const prices = data as unknown as ISOMarketPrice[];
    setCache(cacheKey, prices);
    return prices;
  } catch (err) {
    console.error("Failed to fetch ISO prices:", err);
    return [];
  }
}

/**
 * Get prices for a specific service type across all ISOs
 */
export async function getServicePrices(
  serviceType: "frequency_regulation" | "spinning_reserves" | "capacity" | "energy_arbitrage"
): Promise<ISOMarketPrice[]> {
  const cacheKey = `service_prices_${serviceType}`;
  const cached = getCached<ISOMarketPrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from("iso_market_prices")
      .select("*")
      .eq("service_type", serviceType)
      .order("price_per_mw_year", { ascending: false });

    if (error) {
      console.error("Error fetching service prices:", error);
      return [];
    }

    const prices = data as unknown as ISOMarketPrice[];
    setCache(cacheKey, prices);
    return prices;
  } catch (err) {
    console.error("Failed to fetch service prices:", err);
    return [];
  }
}

/**
 * Get best ISO for a given service type
 */
export async function getBestISOForService(
  serviceType: "frequency_regulation" | "spinning_reserves" | "capacity" | "energy_arbitrage"
): Promise<ISOMarketPrice | null> {
  const prices = await getServicePrices(serviceType);
  if (prices.length === 0) return null;

  // Return highest price (best revenue opportunity)
  return prices[0];
}

// ============================================================================
// REVENUE CALCULATIONS
// ============================================================================

/**
 * Map state to ISO/RTO
 */
export function getISOFromState(
  state: string
): "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO" | null {
  const isoMapping: Record<string, "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO"> = {
    // CAISO
    CA: "CAISO",
    California: "CAISO",

    // ERCOT
    TX: "ERCOT",
    Texas: "ERCOT",

    // PJM (13 states + DC)
    PA: "PJM",
    NJ: "PJM",
    MD: "PJM",
    DE: "PJM",
    VA: "PJM",
    WV: "PJM",
    OH: "PJM",
    KY: "PJM",
    NC: "PJM",
    TN: "PJM",
    IN: "PJM",
    IL: "PJM",
    MI: "PJM",
    DC: "PJM",
    Pennsylvania: "PJM",
    "New Jersey": "PJM",
    Maryland: "PJM",
    Delaware: "PJM",
    Virginia: "PJM",
    "West Virginia": "PJM",
    Ohio: "PJM",
    Kentucky: "PJM",
    "North Carolina": "PJM",

    // NYISO
    NY: "NYISO",
    "New York": "NYISO",

    // ISO-NE
    CT: "ISO-NE",
    MA: "ISO-NE",
    RI: "ISO-NE",
    NH: "ISO-NE",
    VT: "ISO-NE",
    ME: "ISO-NE",
    Connecticut: "ISO-NE",
    Massachusetts: "ISO-NE",
    "Rhode Island": "ISO-NE",
    "New Hampshire": "ISO-NE",
    Vermont: "ISO-NE",
    Maine: "ISO-NE",

    // MISO (15 states)
    MN: "MISO",
    IA: "MISO",
    MO: "MISO",
    WI: "MISO",
    AR: "MISO",
    LA: "MISO",
    MS: "MISO",
    ND: "MISO",
    SD: "MISO",
    MT: "MISO",
    Minnesota: "MISO",
    Iowa: "MISO",
    Missouri: "MISO",
    Wisconsin: "MISO",
    Arkansas: "MISO",
    Louisiana: "MISO",
    Mississippi: "MISO",
    "North Dakota": "MISO",
    "South Dakota": "MISO",
    Montana: "MISO",
  };

  return isoMapping[state] || null;
}

/**
 * Calculate revenue estimate for a single service
 */
export async function calculateServiceRevenue(params: {
  iso: "CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO";
  serviceType: "frequency_regulation" | "spinning_reserves" | "capacity" | "energy_arbitrage";
  systemSizeKW: number;
  durationHours: number;
}): Promise<AncillaryRevenueEstimate | null> {
  const { iso, serviceType, systemSizeKW, durationHours } = params;

  const prices = await getISOPrices(iso);
  const servicePrice = prices.find((p) => p.service_type === serviceType);

  if (!servicePrice) {
    return null;
  }

  const systemSizeMW = systemSizeKW / 1000;
  const requirementGaps: string[] = [];

  // Check requirements
  const meetsMinPower = systemSizeMW >= servicePrice.min_power_mw;
  const meetsDuration = durationHours >= servicePrice.min_duration_hours;

  if (!meetsMinPower) {
    requirementGaps.push(`Min power: ${servicePrice.min_power_mw} MW required`);
  }
  if (!meetsDuration) {
    requirementGaps.push(`Min duration: ${servicePrice.min_duration_hours}h required`);
  }

  const meetsRequirements = meetsMinPower && meetsDuration;

  // Calculate revenue
  const eligibleMW = meetsRequirements ? systemSizeMW : 0;
  const annualRevenue = eligibleMW * servicePrice.price_per_mw_year * servicePrice.utilization_rate;
  const revenuePerKWYear = annualRevenue / systemSizeKW;

  return {
    isoRto: iso,
    serviceType,
    annualRevenue,
    revenuePerKWYear,
    utilizationRate: servicePrice.utilization_rate,
    capacityFactor: servicePrice.typical_capacity_factor,
    meetsRequirements,
    requirementGaps,
  };
}

/**
 * Calculate total ancillary revenue projection for a BESS
 */
export async function calculateTotalAncillaryRevenue(params: {
  state: string;
  systemSizeKW: number;
  durationHours: number;
}): Promise<TotalRevenueProjection | null> {
  const { state, systemSizeKW, durationHours } = params;

  const iso = getISOFromState(state);
  if (!iso) {
    console.warn(`No ISO found for state: ${state}`);
    return null;
  }

  const serviceTypes: Array<
    "frequency_regulation" | "spinning_reserves" | "capacity" | "energy_arbitrage"
  > = ["frequency_regulation", "spinning_reserves", "capacity", "energy_arbitrage"];

  const services = await Promise.all(
    serviceTypes.map((serviceType) =>
      calculateServiceRevenue({ iso, serviceType, systemSizeKW, durationHours })
    )
  );

  const validServices = services.filter((s) => s !== null) as AncillaryRevenueEstimate[];

  // Calculate totals
  const totalAnnualRevenue = validServices
    .filter((s) => s.meetsRequirements)
    .reduce((sum, s) => sum + s.annualRevenue, 0);

  const totalRevenuePerKWYear = totalAnnualRevenue / systemSizeKW;

  // Find best opportunity
  const bestService = validServices
    .filter((s) => s.meetsRequirements)
    .sort((a, b) => b.annualRevenue - a.annualRevenue)[0];

  const bestOpportunity = bestService?.serviceType || "none";

  // Determine risk level based on market trends
  const prices = await getISOPrices(iso);
  const increasingTrends = prices.filter((p) => p.market_trend === "increasing").length;
  const decreasingTrends = prices.filter((p) => p.market_trend === "decreasing").length;

  let riskLevel: "low" | "medium" | "high" = "medium";
  let marketOutlook = "Stable market conditions";

  if (increasingTrends > decreasingTrends) {
    riskLevel = "low";
    marketOutlook = "Growing demand for ancillary services";
  } else if (decreasingTrends > increasingTrends) {
    riskLevel = "high";
    marketOutlook = "Price pressure from increasing competition";
  }

  return {
    iso,
    systemSizeKW,
    durationHours,
    services: validServices,
    totalAnnualRevenue,
    totalRevenuePerKWYear,
    bestOpportunity,
    riskLevel,
    marketOutlook,
  };
}

/**
 * Compare revenue potential across all ISOs
 */
export async function compareISORevenue(params: {
  systemSizeKW: number;
  durationHours: number;
}): Promise<
  Array<{
    iso: string;
    totalRevenue: number;
    revenuePerKWYear: number;
    topServices: string[];
  }>
> {
  const isos: Array<"CAISO" | "ERCOT" | "PJM" | "NYISO" | "ISO-NE" | "MISO"> = [
    "CAISO",
    "ERCOT",
    "PJM",
    "NYISO",
    "ISO-NE",
    "MISO",
  ];

  const comparisons = await Promise.all(
    isos.map(async (iso) => {
      const prices = await getISOPrices(iso);
      const systemSizeMW = params.systemSizeKW / 1000;

      let totalRevenue = 0;
      const topServices: string[] = [];

      prices.forEach((price) => {
        const meetsMinPower = systemSizeMW >= price.min_power_mw;
        const meetsDuration = params.durationHours >= price.min_duration_hours;

        if (meetsMinPower && meetsDuration) {
          const revenue = systemSizeMW * price.price_per_mw_year * price.utilization_rate;
          totalRevenue += revenue;
          topServices.push(price.service_type);
        }
      });

      return {
        iso,
        totalRevenue,
        revenuePerKWYear: totalRevenue / params.systemSizeKW,
        topServices,
      };
    })
  );

  // Sort by revenue potential
  return comparisons.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get frequency regulation prices (most valuable for BESS)
 */
export async function getFrequencyRegulationPrices(): Promise<
  Array<{
    iso: string;
    pricePerMWYear: number;
    utilizationRate: number;
    trend: string;
  }>
> {
  const prices = await getServicePrices("frequency_regulation");

  return prices.map((p) => ({
    iso: p.iso_rto,
    pricePerMWYear: p.price_per_mw_year,
    utilizationRate: p.utilization_rate,
    trend: p.market_trend,
  }));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getAllISOPrices,
  getISOPrices,
  getServicePrices,
  getBestISOForService,
  getISOFromState,
  calculateServiceRevenue,
  calculateTotalAncillaryRevenue,
  compareISORevenue,
  getFrequencyRegulationPrices,
};
