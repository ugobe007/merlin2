/**
 * Market Data Scraper Service
 *
 * Daily scraping of RSS feeds and web sources for:
 * - BESS pricing and configurations (hybrid, microgrid)
 * - Solar, Wind pricing
 * - Generators (combustion, linear)
 * - Inverters, Transformers, Switchgear
 * - DC/AC Panels
 * - EV Chargers (Level 1, 2, DCFC/HPC)
 * - ESS, BMS
 * - AI Energy Management
 * - Regulations and incentives
 *
 * Created: December 10, 2025
 */

import { supabase } from "./supabaseClient";

// Pure parsing functions — imported from the canonical zero-dependency parser.
// This prevents drift between the browser service and the Node.js CLI script.
// See: src/services/marketDataParser.ts
import {
  EQUIPMENT_KEYWORDS,
  PRICE_PATTERNS,
  parseRSSFeed,
  classifyContent,
  extractPrices,
  extractRegulations,
  type ExtractedPrice,
  type ExtractedRegulation,
} from "./marketDataParser";
export type { RSSItem, ExtractedPrice, ExtractedRegulation } from "./marketDataParser";
export {
  EQUIPMENT_KEYWORDS,
  PRICE_PATTERNS,
  parseRSSFeed,
  classifyContent,
  extractPrices,
  extractRegulations,
};

// ============================================================================
// TYPES
// ============================================================================

export interface MarketDataSource {
  id: string;
  name: string;
  url: string;
  feed_url: string | null;
  source_type: "rss_feed" | "api" | "web_scrape" | "data_provider" | "government" | "manufacturer";
  equipment_categories: string[];
  content_type: string;
  regions: string[];
  reliability_score: number;
  data_frequency: string;
  scrape_config: Record<string, unknown>;
  is_active: boolean;
  last_fetch_at: string | null;
  last_fetch_status: string | null;
}

export interface ScrapeJob {
  id: string;
  source_id: string;
  job_type: "rss_fetch" | "web_scrape" | "api_call" | "price_extraction" | "regulation_check";
  schedule_cron: string;
  is_enabled: boolean;
  priority: number;
  last_run_at: string | null;
  last_run_status: string | null;
}

export interface ScrapedArticle {
  id?: string;
  source_id: string;
  title: string;
  url: string;
  author?: string;
  published_at?: string;
  summary?: string;
  full_content?: string;
  topics: string[];
  equipment_mentioned: string[];
  regions_mentioned: string[];
  companies_mentioned: string[];
  prices_extracted: ExtractedPrice[];
  regulations_mentioned: ExtractedRegulation[];
  relevance_score: number;
  sentiment?: "positive" | "negative" | "neutral";
  is_processed: boolean;
}

// MAIN SCRAPER SERVICE
// ============================================================================

/**
 * Fetch and process RSS feed
 */
export async function fetchRSSFeed(source: MarketDataSource): Promise<ScrapedArticle[]> {
  if (!source.feed_url) {
    throw new Error(`No feed URL for source: ${source.name}`);
  }

  try {
    // Fetch RSS feed
    const response = await fetch(source.feed_url, {
      headers: {
        "User-Agent": "Merlin-BESS-QuoteBuilder/1.0 (market-data-aggregator)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const items = parseRSSFeed(xml);

    // Process each item
    const articles: ScrapedArticle[] = items.map((item) => {
      const content = item.content || item.description || "";
      // Combine title and content for better extraction
      const fullText = `${item.title} ${content}`;

      const classification = classifyContent(fullText);
      // Extract prices with improved preprocessing
      const prices = extractPrices(fullText, classification.equipment);
      const regulations = extractRegulations(fullText);

      // Debug logging in development
      if (import.meta.env.DEV && prices.length > 0) {
        console.log(`💰 Extracted ${prices.length} price(s) from: ${item.title?.substring(0, 60)}`);
      }

      return {
        source_id: source.id,
        title: item.title,
        url: item.link,
        author: item.author,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        summary: item.description?.slice(0, 500),
        full_content: content,
        topics: classification.topics,
        equipment_mentioned: classification.equipment,
        regions_mentioned: source.regions,
        companies_mentioned: [],
        prices_extracted: prices,
        regulations_mentioned: regulations,
        relevance_score: classification.relevanceScore,
        is_processed: true,
      };
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS for ${source.name}:`, error);
    throw error;
  }
}

/**
 * Save scraped articles to database
 */
export async function saveScrapedArticles(
  articles: ScrapedArticle[]
): Promise<{ saved: number; skipped: number }> {
  let saved = 0;
  let skipped = 0;

  for (const article of articles) {
    // Check if URL already exists
    const { data: existing } = await supabase
      .from("scraped_articles")
      .select("id")
      .eq("url", article.url)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    // Insert new article
    const { error } = await (supabase as any).from("scraped_articles").insert({
      source_id: article.source_id,
      title: article.title,
      url: article.url,
      author: article.author,
      published_at: article.published_at,
      summary: article.summary,
      full_content: article.full_content,
      topics: article.topics,
      equipment_mentioned: article.equipment_mentioned,
      regions_mentioned: article.regions_mentioned,
      companies_mentioned: article.companies_mentioned,
      prices_extracted: article.prices_extracted,
      regulations_mentioned: article.regulations_mentioned,
      relevance_score: article.relevance_score,
      sentiment: article.sentiment,
      is_processed: article.is_processed,
    });

    if (error) {
      console.error(`Error saving article ${article.url}:`, error);
    } else {
      saved++;

      // If prices were extracted, also save to collected_market_prices
      for (const price of article.prices_extracted) {
        await supabase.from("collected_market_prices").insert({
          source_id: article.source_id,
          equipment_type: price.equipment,
          price_per_unit: price.price,
          unit: price.unit,
          currency: price.currency,
          confidence_score: price.confidence,
          price_date: article.published_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          raw_text: price.context,
          extraction_method: "regex",
        });
      }
    }
  }

  return { saved, skipped };
}

/**
 * Update scrape job status
 */
export async function updateScrapeJobStatus(
  sourceId: string,
  status: "success" | "partial" | "failed",
  itemsFound: number,
  itemsNew: number,
  pricesExtracted: number,
  error?: string
): Promise<void> {
  await supabase
    .from("scrape_jobs")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_status: status,
      items_found: itemsFound,
      items_new: itemsNew,
      prices_extracted: pricesExtracted,
      last_error: error,
      consecutive_failures: status === "failed" ? (supabase.rpc as any)("increment_failures") : 0,
    })
    .eq("source_id", sourceId);

  // Also update the source's last fetch status
  await supabase
    .from("market_data_sources")
    .update({
      last_fetch_at: new Date().toISOString(),
      last_fetch_status: status,
    })
    .eq("id", sourceId);
}

/**
 * Get all enabled scrape jobs that are due to run
 */
export async function getDueScrapeJobs(): Promise<ScrapeJob[]> {
  const { data, error } = await supabase
    .from("scrape_jobs")
    .select("*, market_data_sources(*)")
    .eq("is_enabled", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching scrape jobs:", error);
    return [];
  }

  return (data as unknown as ScrapeJob[]) || [];
}

/**
 * Run all due scrape jobs
 */
export async function runDailyScrape(): Promise<{
  sourcesProcessed: number;
  articlesFound: number;
  articlesSaved: number;
  pricesExtracted: number;
  errors: string[];
}> {
  const results = {
    sourcesProcessed: 0,
    articlesFound: 0,
    articlesSaved: 0,
    pricesExtracted: 0,
    errors: [] as string[],
  };

  // Get all active RSS sources
  const { data: sources, error } = await supabase
    .from("market_data_sources")
    .select("*")
    .eq("is_active", true)
    .eq("source_type", "rss_feed")
    .not("feed_url", "is", null);

  if (error || !sources) {
    results.errors.push(`Failed to fetch sources: ${error?.message}`);
    return results;
  }

  // Process each source
  for (const source of sources) {
    try {
      console.log(`Processing: ${source.name}`);

      const articles = await fetchRSSFeed(source as MarketDataSource);
      results.articlesFound += articles.length;

      const { saved, skipped } = await saveScrapedArticles(articles);
      results.articlesSaved += saved;

      const pricesCount = articles.reduce((sum, a) => sum + a.prices_extracted.length, 0);
      results.pricesExtracted += pricesCount;

      await updateScrapeJobStatus(source.id, "success", articles.length, saved, pricesCount);
      results.sourcesProcessed++;

      // Rate limiting: wait between sources
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      results.errors.push(`${source.name}: ${errorMsg}`);
      await updateScrapeJobStatus(source.id, "failed", 0, 0, 0, errorMsg);
    }
  }

  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const marketDataScraper = {
  fetchRSSFeed,
  saveScrapedArticles,
  updateScrapeJobStatus,
  getDueScrapeJobs,
  runDailyScrape,
  classifyContent,
  extractPrices,
  extractRegulations,
  parseRSSFeed,
};

export default marketDataScraper;
