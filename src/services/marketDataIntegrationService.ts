/**
 * Market Data Integration Service
 * ================================
 *
 * Integrates real-time market data from RSS feeds and data sources
 * into the unified pricing service.
 *
 * Data Flow:
 * 1. RSS feeds → rssAutoFetchService → extracted pricing
 * 2. Extracted pricing → market_pricing_data table
 * 3. market_pricing_data → marketDataIntegrationService
 * 4. marketDataIntegrationService → unifiedPricingService
 *
 * Pricing Priority (highest to lowest):
 * 1. Recent market data (< 30 days) with high confidence
 * 2. pricing_configurations database table
 * 3. NREL ATB 2024 fallbacks
 *
 * Created: December 10, 2025
 */

import { supabase } from "./supabaseClient";

// ============================================
// INTERFACES
// ============================================

export interface MarketPriceData {
  equipmentType: "bess" | "solar" | "wind" | "generator" | "inverter" | "ev-charger";
  pricePerUnit: number;
  unitType: "$/kWh" | "$/kW" | "$/W" | "$/unit";
  dataSource: string;
  dataDate: Date;
  confidence: "high" | "medium" | "low";
  region: string;
  systemScale?: "residential" | "commercial" | "utility";
  metadata?: Record<string, any>;
}

export interface MarketPriceSummary {
  equipmentType: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  dataPointCount: number;
  lastUpdated: Date;
  priceChange30d?: number; // Percentage change
  sources: string[];
}

export interface MarketDataSource {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  sourceType: "rss_feed" | "api" | "web_scrape" | "data_provider" | "government" | "manufacturer";
  equipmentCategories: string[];
  contentType: string;
  reliabilityScore: number;
  isActive: boolean;
  lastFetchAt?: Date;
}

// ============================================
// CACHE MANAGEMENT
// ============================================

interface MarketDataCache {
  prices: Map<string, MarketPriceSummary>;
  sources: MarketDataSource[];
  lastCacheUpdate: Date;
  cacheExpiryMinutes: number;
}

let marketCache: MarketDataCache = {
  prices: new Map(),
  sources: [],
  lastCacheUpdate: new Date(0),
  cacheExpiryMinutes: 30, // Refresh every 30 minutes
};

function isCacheValid(): boolean {
  const now = new Date();
  const cacheAge = (now.getTime() - marketCache.lastCacheUpdate.getTime()) / 1000 / 60;
  return cacheAge < marketCache.cacheExpiryMinutes;
}

// ============================================
// DATABASE FUNCTIONS
// ============================================

/**
 * Get all active market data sources
 */
export async function getMarketDataSources(): Promise<MarketDataSource[]> {
  if (isCacheValid() && marketCache.sources.length > 0) {
    return marketCache.sources;
  }

  try {
    const { data, error } = await supabase
      .from("market_data_sources")
      .select("*")
      .eq("is_active", true)
      .order("reliability_score", { ascending: false });

    if (error) {
      console.error("Failed to fetch market data sources:", error);
      return [];
    }

    const sources: MarketDataSource[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      feedUrl: row.feed_url,
      sourceType: row.source_type,
      equipmentCategories: row.equipment_categories || [],
      contentType: row.content_type,
      reliabilityScore: row.reliability_score || 3,
      isActive: row.is_active,
      lastFetchAt: row.last_fetch_at ? new Date(row.last_fetch_at) : undefined,
    }));

    marketCache.sources = sources;
    marketCache.lastCacheUpdate = new Date();

    return sources;
  } catch (error) {
    console.error("Error fetching market data sources:", error);
    return [];
  }
}

/**
 * Get RSS feed sources for a specific equipment type
 */
export async function getRSSSourcesForEquipment(
  equipmentType: string
): Promise<MarketDataSource[]> {
  const allSources = await getMarketDataSources();
  return allSources.filter(
    (source) =>
      source.sourceType === "rss_feed" &&
      source.feedUrl &&
      (source.equipmentCategories.includes(equipmentType) ||
        source.equipmentCategories.includes("all"))
  );
}

/**
 * Get latest market prices for an equipment type
 * UPDATED Feb 2026: Now reads from BOTH collected_market_prices (fresh scraper data)
 * AND market_pricing_data (legacy seed data) for full coverage.
 */
export async function getMarketPrices(
  equipmentType: "bess" | "solar" | "wind" | "generator" | "inverter" | "ev-charger",
  region: string = "north-america",
  maxAgeDays: number = 90
): Promise<MarketPriceData[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    // ─── Primary: collected_market_prices (fresh scraper data) ───
    const { data: freshData, error: freshError } = await supabase
      .from("collected_market_prices")
      .select("*")
      .eq("equipment_type", equipmentType)
      .gte("price_date", cutoffStr)
      .order("price_date", { ascending: false })
      .limit(100);

    if (freshError) {
      console.warn(
        `[MarketData] collected_market_prices query failed for ${equipmentType}:`,
        freshError.message
      );
    }

    // ─── Secondary: market_pricing_data (legacy seed / manual entries) ───
    const { data: legacyData, error: legacyError } = await supabase
      .from("market_pricing_data")
      .select("*")
      .eq("equipment_type", equipmentType)
      .gte("data_date", cutoffStr)
      .order("data_date", { ascending: false })
      .limit(100);

    if (legacyError) {
      console.warn(
        `[MarketData] market_pricing_data query failed for ${equipmentType}:`,
        legacyError.message
      );
    }

    // ─── Merge results (fresh data takes priority via higher confidence) ───
    const results: MarketPriceData[] = [];

    // Map fresh collected prices
    for (const row of freshData || []) {
      // Skip China/CNY prices that skew BESS averages (Fix #5)
      if (equipmentType === "bess" && row.currency === "CNY") continue;
      if (
        equipmentType === "bess" &&
        row.region &&
        /china|cn|asia/i.test(row.region) &&
        row.price_per_unit < 80
      )
        continue;

      results.push({
        equipmentType: row.equipment_type,
        pricePerUnit: row.price_per_unit,
        unitType: `$/${row.unit}` as MarketPriceData["unitType"],
        dataSource: `scraped:${row.source_id?.slice(0, 8) || "unknown"}`,
        dataDate: new Date(row.price_date),
        confidence:
          row.confidence_score >= 0.7 ? "high" : row.confidence_score >= 0.4 ? "medium" : "low",
        region: row.region || region,
        systemScale: row.technology === "utility" ? "utility" : "commercial",
        metadata: { sourceTable: "collected_market_prices", isVerified: row.is_verified },
      });
    }

    // Map legacy pricing data (lower confidence since it may be stale)
    for (const row of legacyData || []) {
      results.push({
        equipmentType: row.equipment_type,
        pricePerUnit: row.price_per_unit,
        unitType: `$/${row.unit_type}` as MarketPriceData["unitType"],
        dataSource: row.data_source,
        dataDate: new Date(row.data_date),
        confidence: row.confidence_level || "low",
        region: row.region,
        systemScale: row.metadata?.scale,
        metadata: { ...row.metadata, sourceTable: "market_pricing_data" },
      });
    }

    return results;
  } catch (error) {
    console.error(`Error fetching market prices for ${equipmentType}:`, error);
    return [];
  }
}

/**
 * Get market price summary with statistics
 */
export async function getMarketPriceSummary(
  equipmentType: "bess" | "solar" | "wind" | "generator" | "inverter" | "ev-charger",
  region: string = "north-america"
): Promise<MarketPriceSummary | null> {
  // Check cache first
  const cacheKey = `${equipmentType}-${region}`;
  if (isCacheValid() && marketCache.prices.has(cacheKey)) {
    return marketCache.prices.get(cacheKey)!;
  }

  const prices = await getMarketPrices(equipmentType, region, 90);

  if (prices.length === 0) {
    return null;
  }

  // Filter out non-USD / non-regional prices that may skew averages
  const filteredPrices = prices.filter((p) => {
    // For BESS, exclude suspiciously low prices (likely China cell-only, not system)
    if (equipmentType === "bess" && p.pricePerUnit < 60) return false;
    return true;
  });

  // Weight prices by confidence and recency
  const pricesToUse = filteredPrices.length > 0 ? filteredPrices : prices;
  const weightedPrices = pricesToUse.map((p) => {
    const confidenceWeight = p.confidence === "high" ? 1.0 : p.confidence === "medium" ? 0.7 : 0.4;
    const daysSince = (Date.now() - p.dataDate.getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.3, 1 - daysSince / 90); // Decay over 90 days
    return {
      price: p.pricePerUnit,
      weight: confidenceWeight * recencyWeight,
      source: p.dataSource,
    };
  });

  // Calculate weighted average
  const totalWeight = weightedPrices.reduce((sum, p) => sum + p.weight, 0);
  const weightedAverage =
    weightedPrices.reduce((sum, p) => sum + p.price * p.weight, 0) / totalWeight;

  // Calculate other statistics
  const priceValues = pricesToUse.map((p) => p.pricePerUnit).sort((a, b) => a - b);
  const medianIndex = Math.floor(priceValues.length / 2);
  const medianPrice =
    priceValues.length % 2 === 0
      ? (priceValues[medianIndex - 1] + priceValues[medianIndex]) / 2
      : priceValues[medianIndex];

  // Get unique sources
  const sources = [...new Set(pricesToUse.map((p) => p.dataSource))];

  // Calculate 30-day price change
  const recentPrices = pricesToUse.filter(
    (p) => Date.now() - p.dataDate.getTime() < 30 * 24 * 60 * 60 * 1000
  );
  const olderPrices = pricesToUse.filter(
    (p) =>
      Date.now() - p.dataDate.getTime() >= 30 * 24 * 60 * 60 * 1000 &&
      Date.now() - p.dataDate.getTime() < 90 * 24 * 60 * 60 * 1000
  );

  let priceChange30d: number | undefined;
  if (recentPrices.length > 0 && olderPrices.length > 0) {
    const recentAvg =
      recentPrices.reduce((sum, p) => sum + p.pricePerUnit, 0) / recentPrices.length;
    const olderAvg = olderPrices.reduce((sum, p) => sum + p.pricePerUnit, 0) / olderPrices.length;
    priceChange30d = ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  const summary: MarketPriceSummary = {
    equipmentType,
    averagePrice: Math.round(weightedAverage * 100) / 100,
    minPrice: Math.min(...priceValues),
    maxPrice: Math.max(...priceValues),
    medianPrice: Math.round(medianPrice * 100) / 100,
    dataPointCount: pricesToUse.length,
    lastUpdated: pricesToUse[0]?.dataDate || new Date(),
    priceChange30d,
    sources,
  };

  // Update cache
  marketCache.prices.set(cacheKey, summary);

  return summary;
}

/**
 * Save new market pricing data point
 */
export async function saveMarketPrice(data: MarketPriceData): Promise<boolean> {
  try {
    const { error } = await supabase.from("market_pricing_data").insert({
      equipment_type: data.equipmentType,
      price_per_unit: data.pricePerUnit,
      unit_type: data.unitType.replace("$/", ""),
      data_source: data.dataSource,
      data_date: data.dataDate.toISOString().split("T")[0],
      confidence_level: data.confidence,
      region: data.region,
      metadata: data.metadata || {},
    });

    if (error) {
      console.error("Failed to save market price:", error);
      return false;
    }

    // Invalidate cache
    const cacheKey = `${data.equipmentType}-${data.region}`;
    marketCache.prices.delete(cacheKey);

    return true;
  } catch (error) {
    console.error("Error saving market price:", error);
    return false;
  }
}

/**
 * Update last fetch status for a data source
 */
export async function updateSourceFetchStatus(
  sourceId: string,
  status: "success" | "failed" | "partial",
  dataPointCount?: number
): Promise<void> {
  try {
    await supabase
      .from("market_data_sources")
      .update({
        last_fetch_at: new Date().toISOString(),
        last_fetch_status: status,
        fetch_error_count:
          status === "failed" ? supabase.rpc("increment_error_count", { source_id: sourceId }) : 0,
        total_data_points: dataPointCount
          ? supabase.rpc("add_data_points", { source_id: sourceId, count: dataPointCount })
          : undefined,
      })
      .eq("id", sourceId);
  } catch (error) {
    console.error("Error updating source fetch status:", error);
  }
}

// ============================================
// PRICING INTEGRATION
// ============================================

/**
 * Get market-adjusted price for equipment
 * Combines market data with SSOT defaults
 */
export async function getMarketAdjustedPrice(
  equipmentType: "bess" | "solar" | "wind" | "generator",
  defaultPrice: number,
  region: string = "north-america"
): Promise<{
  price: number;
  source: "market" | "default";
  confidence: "high" | "medium" | "low";
  marketTrend?: string;
  dataPoints?: number;
}> {
  const marketSummary = await getMarketPriceSummary(equipmentType, region);

  // If no market data or low data points, use default
  if (!marketSummary || marketSummary.dataPointCount < 3) {
    return {
      price: defaultPrice,
      source: "default",
      confidence: "medium",
    };
  }

  // If market data is significantly different (>30%), investigate
  const priceDiff = Math.abs(marketSummary.averagePrice - defaultPrice) / defaultPrice;

  if (priceDiff > 0.3) {
    // Large discrepancy - log for review but use weighted average
    console.warn(
      `[MarketData] Large price discrepancy for ${equipmentType}: market=$${marketSummary.averagePrice}, default=$${defaultPrice}`
    );

    // Use weighted average: 70% market, 30% default for high confidence data
    const blendedPrice =
      marketSummary.dataPointCount >= 10
        ? marketSummary.averagePrice * 0.7 + defaultPrice * 0.3
        : marketSummary.averagePrice * 0.5 + defaultPrice * 0.5;

    return {
      price: Math.round(blendedPrice * 100) / 100,
      source: "market",
      confidence: marketSummary.dataPointCount >= 10 ? "high" : "medium",
      marketTrend:
        marketSummary.priceChange30d !== undefined
          ? `${marketSummary.priceChange30d > 0 ? "+" : ""}${marketSummary.priceChange30d.toFixed(1)}% (30d)`
          : undefined,
      dataPoints: marketSummary.dataPointCount,
    };
  }

  // Market and default are aligned - use market data
  return {
    price: marketSummary.averagePrice,
    source: "market",
    confidence: marketSummary.dataPointCount >= 10 ? "high" : "medium",
    marketTrend:
      marketSummary.priceChange30d !== undefined
        ? `${marketSummary.priceChange30d > 0 ? "+" : ""}${marketSummary.priceChange30d.toFixed(1)}% (30d)`
        : undefined,
    dataPoints: marketSummary.dataPointCount,
  };
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Add a new market data source
 */
export async function addMarketDataSource(
  source: Omit<MarketDataSource, "id">
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("market_data_sources")
      .insert({
        name: source.name,
        url: source.url,
        feed_url: source.feedUrl,
        source_type: source.sourceType,
        equipment_categories: source.equipmentCategories,
        content_type: source.contentType,
        reliability_score: source.reliabilityScore,
        is_active: source.isActive,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to add market data source:", error);
      return null;
    }

    // Clear cache
    marketCache.sources = [];

    return data?.id || null;
  } catch (error) {
    console.error("Error adding market data source:", error);
    return null;
  }
}

/**
 * Update an existing market data source
 */
export async function updateMarketDataSource(
  id: string,
  updates: Partial<Omit<MarketDataSource, "id">>
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.feedUrl !== undefined) updateData.feed_url = updates.feedUrl;
    if (updates.sourceType !== undefined) updateData.source_type = updates.sourceType;
    if (updates.equipmentCategories !== undefined)
      updateData.equipment_categories = updates.equipmentCategories;
    if (updates.contentType !== undefined) updateData.content_type = updates.contentType;
    if (updates.reliabilityScore !== undefined)
      updateData.reliability_score = updates.reliabilityScore;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase.from("market_data_sources").update(updateData).eq("id", id);

    if (error) {
      console.error("Failed to update market data source:", error);
      return false;
    }

    // Clear cache
    marketCache.sources = [];

    return true;
  } catch (error) {
    console.error("Error updating market data source:", error);
    return false;
  }
}

/**
 * Delete a market data source
 */
export async function deleteMarketDataSource(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("market_data_sources").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete market data source:", error);
      return false;
    }

    // Clear cache
    marketCache.sources = [];

    return true;
  } catch (error) {
    console.error("Error deleting market data source:", error);
    return false;
  }
}

/**
 * Clear all caches
 */
export function clearMarketDataCache(): void {
  marketCache = {
    prices: new Map(),
    sources: [],
    lastCacheUpdate: new Date(0),
    cacheExpiryMinutes: 30,
  };
}

// ============================================
// PRICING POLICIES
// ============================================

export interface PricingPolicy {
  id: string;
  name: string;
  description?: string;
  equipmentType: string;
  sourceWeights: Record<string, number>;
  frequencyWeights: Record<string, number>;
  reliabilityMultiplier: number;
  ageDecayFactor: number;
  industryFloor?: Record<string, number>;
  industryCeiling?: Record<string, number>;
  industryGuidanceWeight: number;
  outlierStdThreshold: number;
  minDataPoints: number;
  regionalMultipliers: Record<string, number>;
  isActive: boolean;
  priority: number;
}

/**
 * Get pricing policies from database
 */
export async function getPricingPolicies(equipmentType?: string): Promise<PricingPolicy[]> {
  try {
    let query = supabase
      .from("pricing_policies")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (equipmentType) {
      query = query.or(`equipment_type.eq.${equipmentType},equipment_type.eq.all`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch pricing policies:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      equipmentType: row.equipment_type,
      sourceWeights: row.source_weights || {},
      frequencyWeights: row.frequency_weights || {},
      reliabilityMultiplier: row.reliability_multiplier || 1.0,
      ageDecayFactor: row.age_decay_factor || 0.02,
      industryFloor: row.industry_floor,
      industryCeiling: row.industry_ceiling,
      industryGuidanceWeight: row.industry_guidance_weight || 0.4,
      outlierStdThreshold: row.outlier_std_threshold || 2.0,
      minDataPoints: row.min_data_points || 3,
      regionalMultipliers: row.regional_multipliers || {},
      isActive: row.is_active,
      priority: row.priority || 0,
    }));
  } catch (error) {
    console.error("Error fetching pricing policies:", error);
    return [];
  }
}

/**
 * Get the active policy for an equipment type
 */
export async function getActivePricingPolicy(equipmentType: string): Promise<PricingPolicy | null> {
  const policies = await getPricingPolicies(equipmentType);
  return (
    policies.find((p) => p.equipmentType === equipmentType) ||
    policies.find((p) => p.equipmentType === "all") ||
    null
  );
}

/**
 * Calculate weighted price using database policy and collected prices
 * This calls the database function calculate_weighted_price()
 */
export async function calculateWeightedPrice(
  equipmentType: "bess" | "solar" | "wind" | "generator" | "inverter" | "ev-charger",
  region: string = "north-america",
  capacityMW: number = 1.0,
  technology?: string
): Promise<{
  weightedPrice: number;
  sampleCount: number;
  confidence: number;
  floorPrice: number;
  ceilingPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
} | null> {
  try {
    const { data, error } = await supabase.rpc("calculate_weighted_price", {
      p_equipment_type: equipmentType,
      p_region: region,
      p_capacity_mw: capacityMW,
      p_technology: technology || null,
    });

    if (error) {
      console.error("Failed to calculate weighted price:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      weightedPrice: parseFloat(result.weighted_price) || 0,
      sampleCount: result.sample_count || 0,
      confidence: parseFloat(result.confidence) || 0,
      floorPrice: parseFloat(result.floor_price) || 0,
      ceilingPrice: parseFloat(result.ceiling_price) || 0,
      priceRangeLow: parseFloat(result.price_range_low) || 0,
      priceRangeHigh: parseFloat(result.price_range_high) || 0,
    };
  } catch (error) {
    console.error("Error calculating weighted price:", error);
    return null;
  }
}

/**
 * Save collected price data point
 */
export async function saveCollectedPrice(data: {
  sourceId: string;
  equipmentType: string;
  pricePerUnit: number;
  unit: string;
  currency?: string;
  region?: string;
  capacityRangeMin?: number;
  capacityRangeMax?: number;
  technology?: string;
  productName?: string;
  confidenceScore?: number;
  priceDate: Date;
  rawText?: string;
  extractionMethod?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("collected_market_prices").insert({
      source_id: data.sourceId,
      equipment_type: data.equipmentType,
      price_per_unit: data.pricePerUnit,
      unit: data.unit,
      currency: data.currency || "USD",
      region: data.region,
      capacity_range_min: data.capacityRangeMin,
      capacity_range_max: data.capacityRangeMax,
      technology: data.technology,
      product_name: data.productName,
      confidence_score: data.confidenceScore || 0.5,
      price_date: data.priceDate.toISOString().split("T")[0],
      raw_text: data.rawText,
      extraction_method: data.extractionMethod || "manual",
    });

    if (error) {
      console.error("Failed to save collected price:", error);
      return false;
    }

    // Invalidate price cache
    marketCache.prices.clear();

    return true;
  } catch (error) {
    console.error("Error saving collected price:", error);
    return false;
  }
}

/**
 * Get collected prices for an equipment type
 */
export async function getCollectedPrices(
  equipmentType: string,
  options?: {
    region?: string;
    technology?: string;
    maxAgeDays?: number;
    verifiedOnly?: boolean;
  }
): Promise<
  Array<{
    id: string;
    sourceId: string;
    equipmentType: string;
    pricePerUnit: number;
    unit: string;
    region?: string;
    technology?: string;
    productName?: string;
    confidenceScore: number;
    isVerified: boolean;
    priceDate: Date;
    extractedAt: Date;
  }>
> {
  try {
    let query = supabase
      .from("collected_market_prices")
      .select("*")
      .eq("equipment_type", equipmentType)
      .order("price_date", { ascending: false });

    if (options?.region) {
      query = query.eq("region", options.region);
    }
    if (options?.technology) {
      query = query.eq("technology", options.technology);
    }
    if (options?.verifiedOnly) {
      query = query.eq("is_verified", true);
    }
    if (options?.maxAgeDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.maxAgeDays);
      query = query.gte("price_date", cutoffDate.toISOString().split("T")[0]);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error("Failed to fetch collected prices:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      equipmentType: row.equipment_type,
      pricePerUnit: row.price_per_unit,
      unit: row.unit,
      region: row.region,
      technology: row.technology,
      productName: row.product_name,
      confidenceScore: row.confidence_score || 0.5,
      isVerified: row.is_verified || false,
      priceDate: new Date(row.price_date),
      extractedAt: new Date(row.extracted_at),
    }));
  } catch (error) {
    console.error("Error fetching collected prices:", error);
    return [];
  }
}

/**
 * Verify a collected price (admin function)
 */
export async function verifyCollectedPrice(id: string, notes?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("collected_market_prices")
      .update({
        is_verified: true,
        verification_notes: notes,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to verify collected price:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying collected price:", error);
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

export { isCacheValid, marketCache };
