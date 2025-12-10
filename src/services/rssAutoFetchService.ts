/**
 * RSS Auto-Fetch Service
 * Automatically fetches news from RSS feeds of industry sources
 * Processes articles for price alerts using AI
 * Extracts pricing, configuration, and market trend data for AI/ML database
 * 
 * Updated: December 10, 2025 - Now uses database-driven sources via market_data_sources table
 * 
 * Note: In browser environment, RSS feeds are fetched via a CORS proxy
 * In production, consider using a backend service or serverless function
 */

import { processNewsForPriceAlerts } from './priceAlertService';
import { processBatchForAI, type RSSArticle as AIRSSArticle } from './rssToAIDatabase';
import { getMarketDataSources, type MarketDataSource } from './marketDataIntegrationService';

// CORS proxy for browser-based RSS fetching (use your own proxy in production)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

interface RSSSource {
  name: string;
  url: string;
  feedUrl: string;
  category: 'market' | 'technology' | 'policy' | 'company';
  enabled: boolean;
  equipmentCategories?: string[];
}

/**
 * RSS feeds for free industry sources
 * DEPRECATED: Now uses database-driven sources from market_data_sources table
 * Kept as fallback if database is unavailable
 */
export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'Energy Storage News',
    url: 'https://www.energy-storage.news',
    feedUrl: 'https://www.energy-storage.news/feed/',
    category: 'market',
    enabled: true,
    equipmentCategories: ['bess']
  },
  {
    name: 'ESS News (Energy Storage & Solar News)',
    url: 'https://www.essnews.com.au',
    feedUrl: 'https://www.essnews.com.au/feed/',
    category: 'market',
    enabled: true,
    equipmentCategories: ['bess', 'solar']
  },
  {
    name: 'Microgrid Knowledge',
    url: 'https://www.microgridknowledge.com',
    feedUrl: 'https://www.microgridknowledge.com/feed/',
    category: 'technology',
    enabled: true,
    equipmentCategories: ['bess', 'solar', 'generator']
  },
  {
    name: 'Energy Storage Journal',
    url: 'https://www.energystoragejournal.com',
    feedUrl: 'https://www.energystoragejournal.com/feed/',
    category: 'market',
    enabled: true,
    equipmentCategories: ['bess']
  },
  {
    name: 'PV Magazine (Energy Storage Section)',
    url: 'https://pv-magazine-usa.com',
    feedUrl: 'https://pv-magazine-usa.com/category/energy-storage/feed/',
    category: 'technology',
    enabled: true,
    equipmentCategories: ['solar', 'bess']
  },
  {
    name: 'Utility Dive (Energy Storage)',
    url: 'https://www.utilitydive.com',
    feedUrl: 'https://www.utilitydive.com/feeds/news/',
    category: 'market',
    enabled: true,
    equipmentCategories: ['all']
  },
  {
    name: 'Renewable Energy World',
    url: 'https://www.renewableenergyworld.com',
    feedUrl: 'https://www.renewableenergyworld.com/feed/',
    category: 'technology',
    enabled: true,
    equipmentCategories: ['solar', 'wind', 'bess']
  },
  {
    name: 'CleanTechnica',
    url: 'https://cleantechnica.com',
    feedUrl: 'https://cleantechnica.com/feed/',
    category: 'technology',
    enabled: true,
    equipmentCategories: ['solar', 'bess', 'ev-charger']
  },
  {
    name: 'GTM (Greentech Media)',
    url: 'https://www.greentechmedia.com',
    feedUrl: 'https://www.greentechmedia.com/rss',
    category: 'market',
    enabled: true,
    equipmentCategories: ['bess', 'solar', 'wind']
  },
  {
    name: 'Energy Vault Newsroom',
    url: 'https://www.energyvault.com/newsroom',
    feedUrl: 'https://www.energyvault.com/newsroom/rss.xml',
    category: 'company',
    enabled: true,
    equipmentCategories: ['bess']
  }
];

/**
 * Get RSS sources from database, with fallback to hardcoded sources
 */
async function getRSSSources(): Promise<RSSSource[]> {
  try {
    const dbSources = await getMarketDataSources();
    const rssSources = dbSources.filter(s => s.sourceType === 'rss_feed' && s.feedUrl);
    
    if (rssSources.length > 0) {
      if (import.meta.env.DEV) { console.log(`📊 Using ${rssSources.length} RSS sources from database`); }
      return rssSources.map(s => ({
        name: s.name,
        url: s.url,
        feedUrl: s.feedUrl!,
        category: mapContentTypeToCategory(s.contentType),
        enabled: s.isActive,
        equipmentCategories: s.equipmentCategories
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch RSS sources from database, using fallback:', error);
  }
  
  // Fallback to hardcoded sources
  return RSS_SOURCES.filter(s => s.enabled);
}

function mapContentTypeToCategory(contentType: string): 'market' | 'technology' | 'policy' | 'company' {
  switch (contentType) {
    case 'pricing':
    case 'market_trends':
      return 'market';
    case 'product_specs':
      return 'technology';
    case 'policy':
      return 'policy';
    default:
      return 'market';
  }
}

interface FetchedArticle {
  title: string;
  link: string;
  pubDate: Date;
  content: string;
  source: string;
  category: string;
  equipmentCategories?: string[];
}

/**
 * Fetch articles from a single RSS feed
 * Uses browser-compatible XML parsing with CORS proxy
 */
async function fetchFromRSS(source: RSSSource): Promise<FetchedArticle[]> {
  try {
    // Fetch RSS feed via CORS proxy
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(source.feedUrl)}`, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Parse XML in browser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parse errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parse error');
    }

    // Extract items from RSS or Atom feed
    const items = xmlDoc.querySelectorAll('item, entry');
    const articles: FetchedArticle[] = [];

    items.forEach((item, index) => {
      if (index >= 10) return; // Limit to 10 articles

      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || 
                   item.querySelector('link')?.getAttribute('href') || '';
      const pubDateStr = item.querySelector('pubDate, published, updated')?.textContent;
      const content = item.querySelector('description, content, summary')?.textContent || 
                     item.querySelector('content\\:encoded')?.textContent || '';

      if (title && link) {
        articles.push({
          title: title.trim(),
          link: link.trim(),
          pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
          content: content.replace(/<[^>]*>/g, '').trim().slice(0, 1000), // Strip HTML, limit length
          source: source.name,
          category: source.category
        });
      }
    });

    return articles;
  } catch (error) {
    console.error(`Failed to fetch RSS from ${source.name}:`, error);
    return [];
  }
}

/**
 * Fetch articles from all enabled RSS sources
 * Now uses database-driven sources with fallback to hardcoded list
 */
export async function fetchAllRSSFeeds(): Promise<FetchedArticle[]> {
  // Get sources from database or fallback
  const enabledSources = await getRSSSources();
  
  if (import.meta.env.DEV) { console.log(`📡 Fetching from ${enabledSources.length} RSS sources...`); }
  
  const results = await Promise.allSettled(
    enabledSources.map(source => fetchFromRSS(source))
  );

  const allArticles: FetchedArticle[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      // Add equipment categories to articles for better filtering
      const articlesWithCategories = result.value.map(article => ({
        ...article,
        equipmentCategories: enabledSources[index].equipmentCategories
      }));
      allArticles.push(...articlesWithCategories);
      if (import.meta.env.DEV) { console.log(`✅ ${enabledSources[index].name}: ${result.value.length} articles`); }
    } else {
      console.error(`❌ ${enabledSources[index].name}: ${result.reason}`);
    }
  });

  // Sort by date (newest first)
  allArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  
  if (import.meta.env.DEV) { console.log(`📊 Total articles fetched: ${allArticles.length}`); }
  
  return allArticles;
}

/**
 * Fetch articles for a specific equipment type
 */
export async function fetchRSSFeedsForEquipment(equipmentType: string): Promise<FetchedArticle[]> {
  const allSources = await getRSSSources();
  const relevantSources = allSources.filter(source => 
    source.equipmentCategories?.includes(equipmentType) || 
    source.equipmentCategories?.includes('all')
  );
  
  if (import.meta.env.DEV) { console.log(`📡 Fetching ${equipmentType} from ${relevantSources.length} RSS sources...`); }
  
  const results = await Promise.allSettled(
    relevantSources.map(source => fetchFromRSS(source))
  );

  const allArticles: FetchedArticle[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const articlesWithCategories = result.value.map(article => ({
        ...article,
        equipmentCategories: relevantSources[index].equipmentCategories
      }));
      allArticles.push(...articlesWithCategories);
    }
  });

  allArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  
  return allArticles;
}

/**
 * Filter articles to find those likely containing pricing information
 */
function filterForPricingArticles(articles: FetchedArticle[]): FetchedArticle[] {
  const pricingKeywords = [
    'price', 'pricing', 'cost', 'kwh', '$/kwh', 'mwh',
    'contract', 'award', 'deal', 'project',
    'installation', 'deployment', 'capacity',
    'battery', 'storage', 'bess', 'lfp', 'lithium'
  ];

  return articles.filter(article => {
    const searchText = `${article.title} ${article.content}`.toLowerCase();
    return pricingKeywords.some(keyword => searchText.includes(keyword));
  });
}

/**
 * Process fetched articles and create price alerts
 * Also extracts data for AI/ML training database
 */
export async function processRSSArticles(articles: FetchedArticle[]): Promise<void> {
  if (import.meta.env.DEV) { console.log('🔍 Filtering articles for pricing information...'); }
  
  const pricingArticles = filterForPricingArticles(articles);
  
  if (import.meta.env.DEV) { console.log(`📈 Found ${pricingArticles.length} articles with potential pricing info`); }
  
  // Convert to format for AI database processing
  const aiArticles: AIRSSArticle[] = articles.map(article => ({
    title: article.title,
    link: article.link,
    pubDate: article.pubDate,
    content: article.content,
    source: article.source,
    category: article.category
  }));
  
  // Process for AI/ML database (pricing, config, trends)
  if (import.meta.env.DEV) { console.log('🤖 Processing articles for AI/ML database...'); }
  try {
    const aiResults = await processBatchForAI(aiArticles);
    if (import.meta.env.DEV) { console.log(`✅ AI Database Update: ${aiResults.pricingDataPoints} pricing + ${aiResults.configDataPoints} configs + ${aiResults.trendDataPoints} trends`); }
  } catch (error) {
    console.error('❌ AI database processing failed:', error);
  }
  
  // Convert to format expected by processNewsForPriceAlerts
  const newsItems = pricingArticles.map(article => ({
    title: article.title,
    url: article.link,
    summary: article.content.slice(0, 500), // First 500 chars as summary
    content: article.content, // Full content
    source: article.source,
    publishDate: article.pubDate.toISOString(),
    category: article.category
  }));

  // Process in batches to avoid overwhelming the AI service
  const batchSize = 5;
  for (let i = 0; i < newsItems.length; i += batchSize) {
    const batch = newsItems.slice(i, i + batchSize);
    if (import.meta.env.DEV) { console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newsItems.length / batchSize)}...`); }
    
    try {
      await processNewsForPriceAlerts(batch);
      // Wait 2 seconds between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error processing batch:', error);
    }
  }
  
  if (import.meta.env.DEV) { console.log('✅ RSS article processing complete'); }
}

/**
 * Run the complete RSS fetch and process cycle
 */
export async function runRSSFetchCycle(): Promise<{
  articlesFound: number;
  alertsCreated: number;
  errors: number;
}> {
  try {
    if (import.meta.env.DEV) { console.log('🚀 Starting RSS fetch cycle...'); }
    
    const articles = await fetchAllRSSFeeds();
    
    await processRSSArticles(articles);
    
    return {
      articlesFound: articles.length,
      alertsCreated: 0, // This would need to be tracked in processNewsForPriceAlerts
      errors: 0
    };
  } catch (error) {
    console.error('❌ RSS fetch cycle failed:', error);
    throw error;
  }
}

/**
 * Schedule automatic RSS fetching
 * @param intervalHours - How often to fetch (default: 6 hours)
 */
export function scheduleRSSFetching(intervalHours: number = 6): () => void {
  if (import.meta.env.DEV) { console.log(`⏰ Scheduling RSS fetching every ${intervalHours} hours`); }
  
  // Run immediately on startup
  runRSSFetchCycle().catch(error => {
    console.error('Initial RSS fetch failed:', error);
  });
  
  // Schedule recurring fetches
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const intervalId = setInterval(() => {
    runRSSFetchCycle().catch(error => {
      console.error('Scheduled RSS fetch failed:', error);
    });
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    if (import.meta.env.DEV) { console.log('🛑 Stopping RSS fetch scheduling'); }
    clearInterval(intervalId);
  };
}

/**
 * Get RSS feed health status
 */
export async function checkRSSFeedHealth(): Promise<{
  source: string;
  status: 'ok' | 'error';
  articlesFound?: number;
  error?: string;
}[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.filter(s => s.enabled).map(async source => {
      const articles = await fetchFromRSS(source);
      return {
        source: source.name,
        status: 'ok' as const,
        articlesFound: articles.length
      };
    })
  );
  
  return results.map((result, index) => {
    const source = RSS_SOURCES.filter(s => s.enabled)[index];
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        source: source.name,
        status: 'error' as const,
        error: String(result.reason)
      };
    }
  });
}

/**
 * Enable or disable a specific RSS source
 */
export function toggleRSSSource(sourceName: string, enabled: boolean): void {
  const source = RSS_SOURCES.find(s => s.name === sourceName);
  if (source) {
    source.enabled = enabled;
    if (import.meta.env.DEV) { console.log(`${enabled ? '✅ Enabled' : '⏸️  Disabled'} RSS source: ${sourceName}`); }
  }
}
