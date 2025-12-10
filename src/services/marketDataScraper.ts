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

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketDataSource {
  id: string;
  name: string;
  url: string;
  feed_url: string | null;
  source_type: 'rss_feed' | 'api' | 'web_scrape' | 'data_provider' | 'government' | 'manufacturer';
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
  job_type: 'rss_fetch' | 'web_scrape' | 'api_call' | 'price_extraction' | 'regulation_check';
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
  sentiment?: 'positive' | 'negative' | 'neutral';
  is_processed: boolean;
}

export interface ExtractedPrice {
  equipment: string;
  price: number;
  unit: string;
  currency: string;
  context: string;
  confidence: number;
}

export interface ExtractedRegulation {
  name: string;
  type: string;
  detail: string;
  effective_date?: string;
  jurisdiction?: string;
}

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  content?: string;
}

// ============================================================================
// EQUIPMENT KEYWORDS FOR CLASSIFICATION
// ============================================================================

export const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  bess: [
    'battery energy storage', 'bess', 'battery storage', 'energy storage system',
    'lithium-ion', 'lfp', 'nmc', 'battery pack', 'megapack', 'powerpack',
    'grid-scale battery', 'utility-scale storage', 'c&i storage'
  ],
  solar: [
    'solar', 'pv', 'photovoltaic', 'solar panel', 'solar module', 'solar array',
    'monocrystalline', 'polycrystalline', 'bifacial', 'solar farm', 'rooftop solar'
  ],
  wind: [
    'wind turbine', 'wind farm', 'wind power', 'offshore wind', 'onshore wind',
    'wind energy', 'wind project', 'vestas', 'siemens gamesa', 'ge wind'
  ],
  generator: [
    'generator', 'diesel generator', 'natural gas generator', 'backup power',
    'standby generator', 'prime power', 'genset', 'cummins', 'caterpillar', 'kohler'
  ],
  'linear-generator': [
    'linear generator', 'mainspring', 'fuel cell', 'bloom energy', 'solid oxide'
  ],
  inverter: [
    'inverter', 'power inverter', 'solar inverter', 'string inverter', 'central inverter',
    'microinverter', 'hybrid inverter', 'sma', 'solaredge', 'enphase', 'fronius'
  ],
  transformer: [
    'transformer', 'power transformer', 'distribution transformer', 'step-up transformer',
    'step-down transformer', 'pad-mounted', 'substation transformer'
  ],
  switchgear: [
    'switchgear', 'circuit breaker', 'disconnect switch', 'mv switchgear',
    'medium voltage', 'switchboard', 'motor control center'
  ],
  'ev-charger': [
    'ev charger', 'electric vehicle charger', 'charging station', 'dcfc', 'dc fast',
    'level 2', 'level 3', 'supercharger', 'chargepoint', 'electrify america',
    'evgo', 'tritium', 'hpc', 'high power charging'
  ],
  bms: [
    'battery management system', 'bms', 'cell balancing', 'state of charge',
    'soc', 'soh', 'state of health', 'thermal management'
  ],
  microgrid: [
    'microgrid', 'micro-grid', 'islanded', 'grid-forming', 'distributed energy',
    'der', 'community microgrid', 'campus microgrid', 'military microgrid'
  ],
  'hybrid-system': [
    'hybrid system', 'solar+storage', 'wind+storage', 'solar-plus-storage',
    'co-located', 'coupled system', 'integrated system'
  ]
};

// ============================================================================
// PRICE EXTRACTION PATTERNS
// ============================================================================

export const PRICE_PATTERNS = {
  // BESS: $XXX/kWh, $XXX per kWh
  bess_kwh: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kWh/gi,
  // BESS: $XXX/kW
  bess_kw: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi,
  // Solar: $X.XX/W, $X.XX per watt
  solar_watt: /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi,
  // Solar: $XXX/kW
  solar_kw: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi,
  // General: $X million, $X billion
  project_cost: /\$\s*(\d+(?:\.\d{1,2})?)\s*(million|billion|M|B)/gi,
  // EV: $X,XXX per charger/unit
  ev_unit: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station)/gi,
  // General percentage
  percentage: /(\d+(?:\.\d{1,2})?)\s*%/gi
};

// ============================================================================
// RSS PARSER
// ============================================================================

/**
 * Parse RSS/Atom feed XML into articles
 */
export function parseRSSFeed(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based parser (in production, use a proper XML parser)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;  // Atom format
  
  let match;
  
  // RSS 2.0 format
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link') || extractAttr(itemXml, 'link', 'href'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      author: extractTag(itemXml, 'author') || extractTag(itemXml, 'dc:creator'),
      content: extractTag(itemXml, 'content:encoded')
    });
  }
  
  // Atom format
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    items.push({
      title: extractTag(entryXml, 'title'),
      link: extractAttr(entryXml, 'link', 'href'),
      description: extractTag(entryXml, 'summary'),
      pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated'),
      author: extractTag(entryXml, 'name'),
      content: extractTag(entryXml, 'content')
    });
  }
  
  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i');
  const match = regex.exec(xml);
  return match ? match[1] : '';
}

// ============================================================================
// CONTENT CLASSIFIER
// ============================================================================

/**
 * Classify content by equipment type and extract topics
 */
export function classifyContent(text: string): {
  equipment: string[];
  topics: string[];
  relevanceScore: number;
} {
  const textLower = text.toLowerCase();
  const equipment: string[] = [];
  const topics: string[] = [];
  let relevanceScore = 0;
  
  // Check each equipment category
  for (const [category, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    const matches = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      equipment.push(category);
      relevanceScore += matches.length * 0.1;
    }
  }
  
  // Extract topics based on common themes
  if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('$/')) {
    topics.push('pricing');
    relevanceScore += 0.3;
  }
  if (textLower.includes('project') || textLower.includes('install') || textLower.includes('deploy')) {
    topics.push('projects');
  }
  if (textLower.includes('regulation') || textLower.includes('policy') || textLower.includes('incentive') || textLower.includes('itc') || textLower.includes('tax credit')) {
    topics.push('policy');
    relevanceScore += 0.2;
  }
  if (textLower.includes('tariff') || textLower.includes('trade') || textLower.includes('import')) {
    topics.push('tariffs');
    relevanceScore += 0.2;
  }
  if (textLower.includes('market') || textLower.includes('forecast') || textLower.includes('outlook')) {
    topics.push('market_trends');
  }
  if (textLower.includes('technology') || textLower.includes('innovation') || textLower.includes('breakthrough')) {
    topics.push('technology');
  }
  
  return {
    equipment,
    topics,
    relevanceScore: Math.min(1, relevanceScore)
  };
}

// ============================================================================
// PRICE EXTRACTOR
// ============================================================================

/**
 * Extract pricing data from text content
 */
export function extractPrices(text: string, equipment: string[]): ExtractedPrice[] {
  const prices: ExtractedPrice[] = [];
  
  // BESS $/kWh
  if (equipment.includes('bess') || equipment.includes('ess')) {
    let match;
    while ((match = PRICE_PATTERNS.bess_kwh.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 50 && price < 2000) {  // Sanity check for BESS pricing
        // Get context (surrounding text)
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        const context = text.slice(start, end);
        
        prices.push({
          equipment: 'bess',
          price,
          unit: 'kWh',
          currency: 'USD',
          context,
          confidence: 0.8
        });
      }
    }
  }
  
  // Solar $/W
  if (equipment.includes('solar')) {
    let match;
    while ((match = PRICE_PATTERNS.solar_watt.exec(text)) !== null) {
      const price = parseFloat(match[1]);
      if (price > 0.10 && price < 5) {  // Sanity check for solar $/W
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        const context = text.slice(start, end);
        
        prices.push({
          equipment: 'solar',
          price,
          unit: 'W',
          currency: 'USD',
          context,
          confidence: 0.8
        });
      }
    }
  }
  
  // EV charger pricing
  if (equipment.includes('ev-charger')) {
    let match;
    while ((match = PRICE_PATTERNS.ev_unit.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 100 && price < 500000) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        const context = text.slice(start, end);
        
        prices.push({
          equipment: 'ev-charger',
          price,
          unit: 'unit',
          currency: 'USD',
          context,
          confidence: 0.7
        });
      }
    }
  }
  
  return prices;
}

// ============================================================================
// REGULATION EXTRACTOR
// ============================================================================

/**
 * Extract regulatory mentions from text
 */
export function extractRegulations(text: string): ExtractedRegulation[] {
  const regulations: ExtractedRegulation[] = [];
  const textLower = text.toLowerCase();
  
  // ITC mentions
  if (textLower.includes('itc') || textLower.includes('investment tax credit')) {
    const percentMatch = text.match(/(\d+)\s*%\s*(?:itc|investment tax credit)/i);
    regulations.push({
      name: 'Investment Tax Credit (ITC)',
      type: 'tax_credit',
      detail: percentMatch ? `${percentMatch[1]}% ITC` : 'ITC mentioned',
      jurisdiction: 'federal'
    });
  }
  
  // PTC mentions
  if (textLower.includes('ptc') || textLower.includes('production tax credit')) {
    regulations.push({
      name: 'Production Tax Credit (PTC)',
      type: 'tax_credit',
      detail: 'PTC mentioned',
      jurisdiction: 'federal'
    });
  }
  
  // IRA mentions
  if (textLower.includes('inflation reduction act') || textLower.includes(' ira ')) {
    regulations.push({
      name: 'Inflation Reduction Act',
      type: 'incentive',
      detail: 'IRA provisions mentioned',
      jurisdiction: 'federal'
    });
  }
  
  // Net metering
  if (textLower.includes('net metering') || textLower.includes('nem')) {
    regulations.push({
      name: 'Net Metering',
      type: 'net_metering',
      detail: 'Net metering policy mentioned'
    });
  }
  
  // Tariffs
  if (textLower.includes('tariff') && (textLower.includes('china') || textLower.includes('import'))) {
    regulations.push({
      name: 'Import Tariffs',
      type: 'tariff',
      detail: 'Trade tariffs on energy equipment'
    });
  }
  
  return regulations;
}

// ============================================================================
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
        'User-Agent': 'Merlin-BESS-QuoteBuilder/1.0 (market-data-aggregator)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const xml = await response.text();
    const items = parseRSSFeed(xml);
    
    // Process each item
    const articles: ScrapedArticle[] = items.map(item => {
      const content = item.content || item.description || '';
      const fullText = `${item.title} ${content}`;
      
      const classification = classifyContent(fullText);
      const prices = extractPrices(fullText, classification.equipment);
      const regulations = extractRegulations(fullText);
      
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
        is_processed: true
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
export async function saveScrapedArticles(articles: ScrapedArticle[]): Promise<{ saved: number; skipped: number }> {
  let saved = 0;
  let skipped = 0;
  
  for (const article of articles) {
    // Check if URL already exists
    const { data: existing } = await supabase
      .from('scraped_articles')
      .select('id')
      .eq('url', article.url)
      .single();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Insert new article
    const { error } = await supabase
      .from('scraped_articles')
      .insert({
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
        is_processed: article.is_processed
      });
    
    if (error) {
      console.error(`Error saving article ${article.url}:`, error);
    } else {
      saved++;
      
      // If prices were extracted, also save to collected_market_prices
      for (const price of article.prices_extracted) {
        await supabase.from('collected_market_prices').insert({
          source_id: article.source_id,
          equipment_type: price.equipment,
          price_per_unit: price.price,
          unit: price.unit,
          currency: price.currency,
          confidence_score: price.confidence,
          price_date: article.published_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          raw_text: price.context,
          extraction_method: 'regex'
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
  status: 'success' | 'partial' | 'failed',
  itemsFound: number,
  itemsNew: number,
  pricesExtracted: number,
  error?: string
): Promise<void> {
  await supabase
    .from('scrape_jobs')
    .update({
      last_run_at: new Date().toISOString(),
      last_run_status: status,
      items_found: itemsFound,
      items_new: itemsNew,
      prices_extracted: pricesExtracted,
      last_error: error,
      consecutive_failures: status === 'failed' ? supabase.rpc('increment_failures') : 0
    })
    .eq('source_id', sourceId);
  
  // Also update the source's last fetch status
  await supabase
    .from('market_data_sources')
    .update({
      last_fetch_at: new Date().toISOString(),
      last_fetch_status: status
    })
    .eq('id', sourceId);
}

/**
 * Get all enabled scrape jobs that are due to run
 */
export async function getDueScrapeJobs(): Promise<ScrapeJob[]> {
  const { data, error } = await supabase
    .from('scrape_jobs')
    .select('*, market_data_sources(*)')
    .eq('is_enabled', true)
    .order('priority', { ascending: false });
  
  if (error) {
    console.error('Error fetching scrape jobs:', error);
    return [];
  }
  
  return data || [];
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
    errors: [] as string[]
  };
  
  // Get all active RSS sources
  const { data: sources, error } = await supabase
    .from('market_data_sources')
    .select('*')
    .eq('is_active', true)
    .eq('source_type', 'rss_feed')
    .not('feed_url', 'is', null);
  
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
      
      await updateScrapeJobStatus(source.id, 'success', articles.length, saved, pricesCount);
      results.sourcesProcessed++;
      
      // Rate limiting: wait between sources
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      results.errors.push(`${source.name}: ${errorMsg}`);
      await updateScrapeJobStatus(source.id, 'failed', 0, 0, 0, errorMsg);
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
  parseRSSFeed
};

export default marketDataScraper;
