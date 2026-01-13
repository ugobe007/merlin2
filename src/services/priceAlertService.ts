/**
 * Energy Price Alert Service
 * Collects and analyzes energy pricing data from news articles and industry announcements
 * Integrates with OpenAI scouting to extract pricing information
 *
 * Data Sources:
 * - Wood Mackenzie Power & Renewables (https://www.woodmac.com/industry/power-and-renewables/)
 * - BloombergNEF (https://about.bnef.com)
 * - Benchmark Mineral Intelligence (https://www.benchmarkminerals.com)
 * - Energy Storage News (https://www.energy-storage.news)
 * - ESS News (https://www.ess-news.com)
 * - EIA (https://www.eia.gov)
 * - EIA Wholesale Markets (https://www.eia.gov/electricity/wholesalemarkets/)
 * - Utility Dive (https://www.utilitydive.com)
 * - Canary Media / Greentech Media (https://www.canarymedia.com)
 */

import { supabase } from "./supabase";
// import { INDUSTRY_NEWS_SOURCES } from './aiDataCollectionService'; // Not exported

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface EnergyPriceAlert {
  id?: string;
  alertType: "battery_kwh" | "battery_mwh" | "solar_watt" | "wind_kw" | "market_trend";
  alertLevel: "info" | "good_deal" | "excellent_deal" | "warning" | "critical";
  priceValue: number;
  priceUnit: string;
  currency: string;
  dealName?: string;
  projectSizeMw?: number;
  projectLocation?: string;
  vendorCompany?: string;
  sourceTitle: string;
  sourceUrl?: string;
  sourcePublisher?: string;
  publishDate?: string;
  dealSummary?: string;
  marketImpact?: string;
  priceTrend?: "declining" | "stable" | "rising";
  relevanceScore: number;
  industrySector?: string;
  technologyType?: string;
  baselinePrice?: number;
  priceDifferencePercent?: number;
  isBelowMarket: boolean;
  verified: boolean;
}

export interface PriceTrend {
  id?: string;
  trendType: string;
  timePeriod: "daily" | "weekly" | "monthly" | "quarterly";
  periodStart: string;
  periodEnd: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  medianPrice?: number;
  sampleSize: number;
  priceChangePercent?: number;
  trendDirection: "declining" | "stable" | "rising";
  confidenceLevel: "low" | "medium" | "high";
  region: string;
}

export interface NewsArticle {
  title: string;
  url?: string;
  publisher?: string;
  publishDate?: string;
  content: string;
  summary?: string;
}

// =====================================================
// BASELINE PRICING (for comparison) - Q1 2026 Market
// =====================================================

const BASELINE_PRICES = {
  battery_kwh_utility: 115.0, // $/kWh for utility-scale (≥3 MW)
  battery_kwh_commercial: 175.0, // $/kWh for commercial (100kW-3MW)
  battery_kwh_residential: 275.0, // $/kWh for small commercial (<100kW)
  battery_mwh_utility: 115000, // $/MWh installed (utility-scale)
  solar_watt: 0.95, // $/W installed (commercial)
  wind_kw: 1500.0, // $/kW installed
};

// =====================================================
// PRICE EXTRACTION & ANALYSIS
// =====================================================

/**
 * Extract pricing information from news article using pattern matching and AI
 */
export function extractPricingFromArticle(article: NewsArticle): EnergyPriceAlert[] {
  const alerts: EnergyPriceAlert[] = [];

  const text = `${article.title} ${article.content || ""} ${article.summary || ""}`.toLowerCase();

  // Pattern 1: $/kWh pricing (e.g., "$125/kWh", "$125 per kWh")
  const kwhPattern = /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*kwh/gi;
  let match;

  while ((match = kwhPattern.exec(text)) !== null) {
    const priceValue = parseFloat(match[1]);
    const baselinePrice = determineBaselinePrice(article, "kwh");
    const priceDiff = ((priceValue - baselinePrice) / baselinePrice) * 100;

    alerts.push({
      alertType: "battery_kwh",
      alertLevel: determineAlertLevel(priceDiff, "below"),
      priceValue,
      priceUnit: "kwh",
      currency: "USD",
      sourceTitle: article.title,
      sourceUrl: article.url,
      sourcePublisher: article.publisher,
      publishDate: article.publishDate,
      dealSummary: extractDealContext(article, match.index),
      priceTrend: determinePriceTrend(priceDiff),
      relevanceScore: calculateRelevanceScore(article, "battery_kwh"),
      baselinePrice,
      priceDifferencePercent: priceDiff,
      isBelowMarket: priceDiff < -5,
      verified: false,
    });
  }

  // Pattern 2: $/MWh project costs (e.g., "$500,000/MWh", "$500k per MWh")
  const mwhPattern = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:k|m|million)?\s*(?:\/|per)\s*mwh/gi;

  while ((match = mwhPattern.exec(text)) !== null) {
    let priceValue = parseFloat(match[1].replace(/,/g, ""));

    // Handle k/m multipliers
    if (match[0].includes("million") || match[0].includes("m")) {
      priceValue *= 1000000;
    } else if (match[0].includes("k")) {
      priceValue *= 1000;
    }

    const baselinePrice = BASELINE_PRICES.battery_mwh_utility;
    const priceDiff = ((priceValue - baselinePrice) / baselinePrice) * 100;

    alerts.push({
      alertType: "battery_mwh",
      alertLevel: determineAlertLevel(priceDiff, "below"),
      priceValue,
      priceUnit: "mwh",
      currency: "USD",
      sourceTitle: article.title,
      sourceUrl: article.url,
      sourcePublisher: article.publisher,
      publishDate: article.publishDate,
      dealSummary: extractDealContext(article, match.index),
      priceTrend: determinePriceTrend(priceDiff),
      relevanceScore: calculateRelevanceScore(article, "battery_mwh"),
      baselinePrice,
      priceDifferencePercent: priceDiff,
      isBelowMarket: priceDiff < -5,
      verified: false,
    });
  }

  // Pattern 3: Total project cost (e.g., "$50 million for 100MW/400MWh")
  const projectPattern =
    /\$\s*(\d+(?:\.\d{1,2})?)\s*(million|m|billion|b).*?(\d+(?:\.\d{1,2})?)\s*mw.*?(\d+(?:\.\d{1,2})?)\s*mwh/gi;

  while ((match = projectPattern.exec(text)) !== null) {
    let totalCost = parseFloat(match[1]);
    const multiplier = match[2].toLowerCase();
    const powerMw = parseFloat(match[3]);
    const energyMwh = parseFloat(match[4]);

    if (multiplier.includes("billion") || multiplier === "b") {
      totalCost *= 1000000000;
    } else if (multiplier.includes("million") || multiplier === "m") {
      totalCost *= 1000000;
    }

    const pricePerMwh = totalCost / energyMwh;
    const pricePerKwh = pricePerMwh / 1000;
    const baselinePrice = BASELINE_PRICES.battery_kwh_utility;
    const priceDiff = ((pricePerKwh - baselinePrice) / baselinePrice) * 100;

    alerts.push({
      alertType: "battery_kwh",
      alertLevel: determineAlertLevel(priceDiff, "below"),
      priceValue: pricePerKwh,
      priceUnit: "kwh",
      currency: "USD",
      projectSizeMw: powerMw,
      sourceTitle: article.title,
      sourceUrl: article.url,
      sourcePublisher: article.publisher,
      publishDate: article.publishDate,
      dealSummary: `$${totalCost.toLocaleString()} project for ${powerMw}MW/${energyMwh}MWh system`,
      marketImpact: generateMarketImpact(pricePerKwh, baselinePrice, powerMw),
      priceTrend: determinePriceTrend(priceDiff),
      relevanceScore: calculateRelevanceScore(article, "battery_kwh"),
      baselinePrice,
      priceDifferencePercent: priceDiff,
      isBelowMarket: priceDiff < -5,
      verified: false,
    });
  }

  // Extract vendor and location information
  alerts.forEach((alert) => {
    alert.vendorCompany = extractVendor(text);
    alert.projectLocation = extractLocation(text);
    alert.industrySector = determineIndustrySector(article);
    alert.technologyType = extractTechnologyType(text);
  });

  return alerts;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function determineBaselinePrice(article: NewsArticle, unit: string): number {
  const text = article.title.toLowerCase() + (article.content || "").toLowerCase();

  if (unit === "kwh") {
    if (text.includes("utility") || text.includes("utility-scale") || /\d+\s*mw/.test(text)) {
      return BASELINE_PRICES.battery_kwh_utility;
    } else if (text.includes("commercial") || text.includes("c&i")) {
      return BASELINE_PRICES.battery_kwh_commercial;
    } else if (text.includes("residential") || text.includes("home")) {
      return BASELINE_PRICES.battery_kwh_residential;
    }
    return BASELINE_PRICES.battery_kwh_utility; // default
  }

  return BASELINE_PRICES.battery_mwh_utility;
}

function determineAlertLevel(
  priceDiff: number,
  direction: "below" | "above"
): EnergyPriceAlert["alertLevel"] {
  if (direction === "below") {
    if (priceDiff <= -20) return "excellent_deal";
    if (priceDiff <= -10) return "good_deal";
    if (priceDiff <= -5) return "info";
  } else {
    if (priceDiff >= 20) return "critical";
    if (priceDiff >= 10) return "warning";
  }
  return "info";
}

function determinePriceTrend(priceDiff: number): "declining" | "stable" | "rising" {
  if (priceDiff < -5) return "declining";
  if (priceDiff > 5) return "rising";
  return "stable";
}

function calculateRelevanceScore(article: NewsArticle, alertType: string): number {
  let score = 50; // base score

  const text = (article.title + " " + (article.content || "")).toLowerCase();

  // Boost for direct pricing mentions
  if (text.includes("$/kwh") || text.includes("per kwh")) score += 20;
  if (text.includes("pricing") || text.includes("cost")) score += 10;

  // Boost for vendor mentions
  const vendors = [
    "tesla",
    "discovery energy",
    "lion energy",
    "byd",
    "catl",
    "lg",
    "samsung",
    "fluence",
  ];
  if (vendors.some((v) => text.includes(v))) score += 15;

  // Boost for project scale
  if (/\d+\s*mw/.test(text)) score += 10;

  // Boost for recent news (within 30 days)
  if (article.publishDate) {
    const daysOld = (Date.now() - new Date(article.publishDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) score += 15;
    else if (daysOld < 30) score += 10;
    else if (daysOld < 90) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

function extractDealContext(article: NewsArticle, matchIndex: number): string {
  const text = article.content || article.title;
  const contextLength = 200;
  const start = Math.max(0, matchIndex - contextLength / 2);
  const end = Math.min(text.length, matchIndex + contextLength / 2);

  return "..." + text.substring(start, end).trim() + "...";
}

function extractVendor(text: string): string | undefined {
  const vendors = [
    "Tesla Energy",
    "Discovery Energy",
    "LiON Energy",
    "SimpliPhi Power",
    "Great Power",
    "BYD",
    "CATL",
    "LG Energy Solution",
    "Samsung SDI",
    "Fluence",
    "Powin",
    "Wartsila",
    "GE Vernova",
    "Siemens Energy",
    "Sungrow",
    "Envision AESC",
    "EVE Energy",
    "Northvolt",
  ];

  for (const vendor of vendors) {
    if (text.toLowerCase().includes(vendor.toLowerCase())) {
      return vendor;
    }
  }

  return undefined;
}

function extractLocation(text: string): string | undefined {
  const states = [
    "California",
    "Texas",
    "New York",
    "Florida",
    "Arizona",
    "Nevada",
    "Colorado",
    "Massachusetts",
    "Hawaii",
    "Oregon",
    "Washington",
  ];

  for (const state of states) {
    if (text.toLowerCase().includes(state.toLowerCase())) {
      return `${state}, USA`;
    }
  }

  if (text.includes("USA") || text.includes("United States")) {
    return "USA";
  }

  return undefined;
}

function determineIndustrySector(article: NewsArticle): string {
  const text = (article.title + " " + (article.content || "")).toLowerCase();

  if (text.includes("utility") || text.includes("grid")) return "utility";
  if (text.includes("commercial") || text.includes("c&i")) return "commercial";
  if (text.includes("residential") || text.includes("home")) return "residential";
  if (text.includes("industrial") || text.includes("manufacturing")) return "industrial";

  // Default to utility for large projects
  if (/\d+\s*mw/.test(text)) {
    const mwMatch = text.match(/(\d+)\s*mw/);
    if (mwMatch && parseFloat(mwMatch[1]) >= 10) return "utility";
  }

  return "commercial";
}

function extractTechnologyType(text: string): string {
  if (text.includes("lfp") || text.includes("lifepo4") || text.includes("lithium iron phosphate")) {
    return "lfp";
  }
  if (text.includes("nmc") || text.includes("lithium nickel")) return "nmc";
  if (text.includes("flow battery")) return "flow";
  if (text.includes("sodium")) return "sodium-ion";

  return "lithium-ion"; // default
}

function generateMarketImpact(
  pricePerKwh: number,
  baselinePrice: number,
  projectSizeMw: number
): string {
  const priceDiff = ((pricePerKwh - baselinePrice) / baselinePrice) * 100;

  let impact = "";

  if (priceDiff < -15) {
    impact = "Significant - ";
  } else if (priceDiff < -5) {
    impact = "Moderate - ";
  } else {
    impact = "Limited - ";
  }

  if (projectSizeMw >= 100) {
    impact += "Large utility-scale deployment signals market maturity and cost competitiveness.";
  } else if (projectSizeMw >= 10) {
    impact += "Mid-scale project demonstrates commercial viability at competitive pricing.";
  } else {
    impact += "Small-scale deployment provides pricing reference for similar projects.";
  }

  return impact;
}

/**
 * Validate if URL is from trusted industry source
 */
export function isValidIndustrySource(url: string): { valid: boolean; source?: string } {
  if (!url) return { valid: false };

  const urlLower = url.toLowerCase();

  const INDUSTRY_NEWS_SOURCES_LOCAL = [
    { name: "Energy Storage News", url: "https://www.energy-storage.news" },
    { name: "PV Magazine", url: "https://www.pv-magazine.com" },
    { name: "Canary Media", url: "https://www.canarymedia.com" },
  ];

  for (const source of INDUSTRY_NEWS_SOURCES_LOCAL) {
    const sourceDomain = source.url
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    if (urlLower.includes(sourceDomain)) {
      return { valid: true, source: source.name };
    }
  }

  // Additional trusted sources
  const additionalSources = [
    { domain: "pv-magazine", name: "PV Magazine" },
    { domain: "renewableenergyworld.com", name: "Renewable Energy World" },
    { domain: "greentechmedia.com", name: "Greentech Media" },
    { domain: "power-technology.com", name: "Power Technology" },
  ];

  // Extended additional sources
  const extendedSources = [
    { domain: "sandia.gov", name: "Sandia National Laboratories" },
    { domain: "epri.com", name: "EPRI" },
    { domain: "tethys.pnnl.gov", name: "Tethys (PNNL)" },
    { domain: "enlit.world", name: "Enlit" },
    { domain: "sciencedirect.com", name: "ScienceDirect - Journal of Energy Storage" },
    { domain: "energystoragejournal.com", name: "Energy Storage Journal" },
    { domain: "microgridknowledge.com", name: "Microgrid Knowledge" },
    { domain: "energy.mit.edu", name: "MIT Energy Initiative" },
    { domain: "energyvault.com", name: "Energy Vault" },
    { domain: "se.com", name: "Schneider Electric" },
    { domain: "sam.nrel.gov", name: "NREL - SAM" },
  ];

  for (const source of extendedSources) {
    if (urlLower.includes(source.domain)) {
      return { valid: true, source: source.name };
    }
  }

  for (const source of additionalSources) {
    if (urlLower.includes(source.domain)) {
      return { valid: true, source: source.name };
    }
  }

  return { valid: false };
}

/**
 * Get all configured industry news sources
 */
export function getIndustryNewsSources() {
  const INDUSTRY_NEWS_SOURCES = [
    { name: "Energy Storage News", url: "https://www.energy-storage.news" },
    { name: "PV Magazine", url: "https://www.pv-magazine.com" },
    { name: "Canary Media", url: "https://www.canarymedia.com" },
  ];
  return INDUSTRY_NEWS_SOURCES.map((source: any) => ({
    name: source.name,
    url: source.url,
    categories: source.category.join(", "),
    subscriptionRequired: source.subscriptionRequired,
    apiAvailable: source.apiAvailable,
  }));
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

/**
 * Save price alert to database
 */
export async function savePriceAlert(
  alert: EnergyPriceAlert
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("energy_price_alerts")
      .insert({
        alert_type: alert.alertType,
        alert_level: alert.alertLevel,
        price_value: alert.priceValue,
        price_unit: alert.priceUnit,
        currency: alert.currency,
        deal_name: alert.dealName,
        project_size_mw: alert.projectSizeMw,
        project_location: alert.projectLocation,
        vendor_company: alert.vendorCompany,
        source_title: alert.sourceTitle,
        source_url: alert.sourceUrl,
        source_publisher: alert.sourcePublisher,
        publish_date: alert.publishDate,
        deal_summary: alert.dealSummary,
        market_impact: alert.marketImpact,
        price_trend: alert.priceTrend,
        relevance_score: alert.relevanceScore,
        industry_sector: alert.industrySector,
        technology_type: alert.technologyType,
        baseline_price: alert.baselinePrice,
        price_difference_percent: alert.priceDifferencePercent,
        is_below_market: alert.isBelowMarket,
        verified: alert.verified,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving price alert:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Price alert saved:", data.id);
    return { success: true, id: data.id };
  } catch (err) {
    console.error("Database error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Fetch recent price alerts
 */
export async function getRecentPriceAlerts(
  limit: number = 10,
  alertType?: string,
  verifiedOnly: boolean = true
): Promise<EnergyPriceAlert[]> {
  try {
    let query = supabase
      .from("energy_price_alerts")
      .select("*")
      .order("publish_date", { ascending: false })
      .limit(limit);

    if (verifiedOnly) {
      query = query.eq("verified", true);
    }

    if (alertType) {
      query = query.eq("alert_type", alertType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching price alerts:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      alertType: row.alert_type,
      alertLevel: row.alert_level,
      priceValue: row.price_value,
      priceUnit: row.price_unit,
      currency: row.currency,
      dealName: row.deal_name,
      projectSizeMw: row.project_size_mw,
      projectLocation: row.project_location,
      vendorCompany: row.vendor_company,
      sourceTitle: row.source_title,
      sourceUrl: row.source_url,
      sourcePublisher: row.source_publisher,
      publishDate: row.publish_date,
      dealSummary: row.deal_summary,
      marketImpact: row.market_impact,
      priceTrend: row.price_trend,
      relevanceScore: row.relevance_score,
      industrySector: row.industry_sector,
      technologyType: row.technology_type,
      baselinePrice: row.baseline_price,
      priceDifferencePercent: row.price_difference_percent,
      isBelowMarket: row.is_below_market,
      verified: row.verified,
    }));
  } catch (err) {
    console.error("Database error:", err);
    return [];
  }
}

/**
 * Get excellent deals (below market pricing)
 */
export async function getExcellentDeals(limit: number = 5): Promise<EnergyPriceAlert[]> {
  try {
    const { data, error } = await supabase
      .from("energy_price_alerts")
      .select("*")
      .eq("alert_level", "excellent_deal")
      .eq("verified", true)
      .order("relevance_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching excellent deals:", error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      alertType: row.alert_type,
      alertLevel: row.alert_level,
      priceValue: row.price_value,
      priceUnit: row.price_unit,
      currency: row.currency,
      dealName: row.deal_name,
      projectSizeMw: row.project_size_mw,
      projectLocation: row.project_location,
      vendorCompany: row.vendor_company,
      sourceTitle: row.source_title,
      sourceUrl: row.source_url,
      sourcePublisher: row.source_publisher,
      publishDate: row.publish_date,
      dealSummary: row.deal_summary,
      marketImpact: row.market_impact,
      priceTrend: row.price_trend,
      relevanceScore: row.relevance_score,
      industrySector: row.industry_sector,
      technologyType: row.technology_type,
      baselinePrice: row.baseline_price,
      priceDifferencePercent: row.price_difference_percent,
      isBelowMarket: row.is_below_market,
      verified: row.verified,
    }));
  } catch (err) {
    console.error("Database error:", err);
    return [];
  }
}

/**
 * Process news articles from OpenAI scouting and extract price alerts
 */
export async function processNewsForPriceAlerts(articles: NewsArticle[]): Promise<number> {
  let alertsCreated = 0;

  for (const article of articles) {
    const alerts = extractPricingFromArticle(article);

    for (const alert of alerts) {
      // Only save high-relevance alerts
      if (alert.relevanceScore >= 60) {
        const result = await savePriceAlert(alert);
        if (result.success) {
          alertsCreated++;
        }
      }
    }
  }

  console.log(`✅ Created ${alertsCreated} price alerts from ${articles.length} articles`);
  return alertsCreated;
}
