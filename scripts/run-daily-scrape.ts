/**
 * Daily Market Data Scraper - Cron Job Script
 * 
 * Run this script daily to fetch market data from all configured sources.
 * Can be triggered via:
 * - Supabase Edge Function (recommended for production)
 * - GitHub Actions scheduled workflow
 * - Local cron job for development
 * 
 * Usage:
 *   npx tsx scripts/run-daily-scrape.ts
 * 
 * Created: December 10, 2025
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Prefer SERVICE_ROLE_KEY for write operations (bypasses RLS)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  console.error('Set VITE_SUPABASE_URL and either:');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (recommended for write operations)');
  console.error('  - VITE_SUPABASE_ANON_KEY (read-only, will fail on inserts)');
  process.exit(1);
}

// Check if using service role key (starts differently than anon key)
const isServiceRole = SUPABASE_KEY.length > 200;  // Service role keys are longer
if (!isServiceRole) {
  console.warn('⚠️  WARNING: Using anon key. Inserts may fail due to RLS.');
  console.warn('   For production, set SUPABASE_SERVICE_ROLE_KEY in your environment.');
  console.warn('');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// EQUIPMENT KEYWORDS
// ============================================================================

const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  bess: ['battery energy storage', 'bess', 'battery storage', 'lithium-ion', 'lfp', 'nmc', 'megapack'],
  solar: ['solar', 'pv', 'photovoltaic', 'solar panel', 'solar module', 'bifacial'],
  wind: ['wind turbine', 'wind farm', 'wind power', 'offshore wind', 'onshore wind'],
  generator: ['generator', 'diesel generator', 'natural gas generator', 'genset'],
  'linear-generator': ['linear generator', 'mainspring', 'fuel cell', 'bloom energy'],
  inverter: ['inverter', 'solar inverter', 'microinverter', 'string inverter'],
  transformer: ['transformer', 'power transformer', 'distribution transformer'],
  switchgear: ['switchgear', 'circuit breaker', 'mv switchgear'],
  'ev-charger': ['ev charger', 'charging station', 'dcfc', 'dc fast', 'level 2', 'supercharger'],
  bms: ['battery management system', 'bms', 'cell balancing'],
  microgrid: ['microgrid', 'micro-grid', 'islanded', 'grid-forming'],
  'hybrid-system': ['hybrid system', 'solar+storage', 'co-located']
};

// ============================================================================
// RSS PARSER
// ============================================================================

function parseRSSFeed(xml: string): Array<{
  title: string;
  link: string;
  description: string;
  pubDate: string;
  content: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
    content: string;
  }> = [];
  
  // RSS 2.0 format
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link') || extractAttr(itemXml, 'link', 'href'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      content: extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'description')
    });
  }
  
  // Atom format
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    items.push({
      title: extractTag(entryXml, 'title'),
      link: extractAttr(entryXml, 'link', 'href'),
      description: extractTag(entryXml, 'summary'),
      pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated'),
      content: extractTag(entryXml, 'content') || extractTag(entryXml, 'summary')
    });
  }
  
  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  
  const simpleMatch = simpleRegex.exec(xml);
  return simpleMatch ? simpleMatch[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i');
  const match = regex.exec(xml);
  return match ? match[1] : '';
}

// ============================================================================
// CONTENT CLASSIFIER
// ============================================================================

function classifyContent(text: string): {
  equipment: string[];
  topics: string[];
  relevanceScore: number;
} {
  const textLower = text.toLowerCase();
  const equipment: string[] = [];
  const topics: string[] = [];
  let relevanceScore = 0;
  
  for (const [category, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    const matches = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      equipment.push(category);
      relevanceScore += matches.length * 0.1;
    }
  }
  
  if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('$/')) {
    topics.push('pricing');
    relevanceScore += 0.3;
  }
  if (textLower.includes('regulation') || textLower.includes('policy') || textLower.includes('incentive')) {
    topics.push('policy');
    relevanceScore += 0.2;
  }
  if (textLower.includes('tariff') || textLower.includes('trade')) {
    topics.push('tariffs');
    relevanceScore += 0.2;
  }
  if (textLower.includes('market') || textLower.includes('forecast')) {
    topics.push('market_trends');
  }
  
  return { equipment, topics, relevanceScore: Math.min(1, relevanceScore) };
}

// ============================================================================
// PRICE EXTRACTOR
// ============================================================================

function extractPrices(text: string, equipment: string[]): Array<{
  equipment: string;
  price: number;
  unit: string;
  context: string;
  confidence: number;
}> {
  const prices: Array<{
    equipment: string;
    price: number;
    unit: string;
    context: string;
    confidence: number;
  }> = [];
  
  // BESS $/kWh
  if (equipment.includes('bess')) {
    const bessRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kWh/gi;
    let match;
    while ((match = bessRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 50 && price < 2000) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'bess',
          price,
          unit: 'kWh',
          context: text.slice(start, end),
          confidence: 0.8
        });
      }
    }
  }
  
  // Solar $/W
  if (equipment.includes('solar')) {
    const solarRegex = /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi;
    let match;
    while ((match = solarRegex.exec(text)) !== null) {
      const price = parseFloat(match[1]);
      if (price > 0.10 && price < 5) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'solar',
          price,
          unit: 'W',
          context: text.slice(start, end),
          confidence: 0.8
        });
      }
    }
  }
  
  // Generator $/kW
  if (equipment.includes('generator')) {
    const genRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kw(?!h)/gi;
    let match;
    while ((match = genRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 200 && price < 2000) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'generator',
          price,
          unit: 'kW',
          context: text.slice(start, end),
          confidence: 0.7
        });
      }
    }
  }

  // Wind $/kW
  if (equipment.includes('wind')) {
    const windRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kw(?!h)/gi;
    let match;
    while ((match = windRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 500 && price < 5000) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'wind',
          price,
          unit: 'kW',
          context: text.slice(start, end),
          confidence: 0.65
        });
      }
    }
  }

  // Inverter $/kW
  if (equipment.includes('inverter')) {
    const invRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kw(?!h)/gi;
    let match;
    while ((match = invRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 30 && price < 500) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'inverter',
          price,
          unit: 'kW',
          context: text.slice(start, end),
          confidence: 0.65
        });
      }
    }
  }

  // Transformer $/kVA
  if (equipment.includes('transformer')) {
    const xfmrRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kva/gi;
    let match;
    while ((match = xfmrRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 15 && price < 200) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'transformer',
          price,
          unit: 'kVA',
          context: text.slice(start, end),
          confidence: 0.6
        });
      }
    }
  }

  // EV Charger $/unit
  if (equipment.includes('ev-charger')) {
    const evRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station|port)/gi;
    let match;
    while ((match = evRegex.exec(text)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 100 && price < 500000) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(text.length, match.index + match[0].length + 100);
        prices.push({
          equipment: 'ev-charger',
          price,
          unit: 'unit',
          context: text.slice(start, end),
          confidence: 0.7
        });
      }
    }
  }
  
  return prices;
}

// ============================================================================
// MAIN SCRAPE FUNCTION
// ============================================================================

async function runDailyScrape() {
  console.log('========================================');
  console.log('Starting Daily Market Data Scrape');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================\n');
  
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
    .not('feed_url', 'is', null)
    .order('reliability_score', { ascending: false });
  
  if (error || !sources) {
    console.error('Failed to fetch sources:', error?.message);
    return results;
  }
  
  console.log(`Found ${sources.length} RSS sources to process\n`);
  
  for (const source of sources) {
    console.log(`\n[${results.sourcesProcessed + 1}/${sources.length}] Processing: ${source.name}`);
    console.log(`  URL: ${source.feed_url}`);
    
    try {
      // Fetch RSS feed
      const response = await fetch(source.feed_url, {
        headers: {
          'User-Agent': 'Merlin-BESS-QuoteBuilder/1.0 (market-data-aggregator)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        signal: AbortSignal.timeout(30000)  // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const xml = await response.text();
      const items = parseRSSFeed(xml);
      
      console.log(`  Found ${items.length} items`);
      results.articlesFound += items.length;
      
      let savedCount = 0;
      let pricesCount = 0;
      
      for (const item of items) {
        // Check if already exists
        const { data: existing } = await supabase
          .from('scraped_articles')
          .select('id')
          .eq('url', item.link)
          .single();
        
        if (existing) continue;
        
        // Classify content
        const fullText = `${item.title} ${item.content}`;
        const classification = classifyContent(fullText);
        const prices = extractPrices(fullText, classification.equipment);
        
        // Save article
        const { error: insertError } = await supabase
          .from('scraped_articles')
          .insert({
            source_id: source.id,
            title: item.title,
            url: item.link,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            summary: item.description?.slice(0, 500),
            full_content: item.content,
            topics: classification.topics,
            equipment_mentioned: classification.equipment,
            regions_mentioned: source.regions || ['global'],
            companies_mentioned: [],
            prices_extracted: prices,
            regulations_mentioned: [],
            relevance_score: classification.relevanceScore,
            is_processed: true
          });
        
        if (!insertError) {
          savedCount++;
          
          // Save extracted prices
          for (const price of prices) {
            await supabase.from('collected_market_prices').insert({
              source_id: source.id,
              equipment_type: price.equipment,
              price_per_unit: price.price,
              unit: price.unit,
              currency: 'USD',
              confidence_score: price.confidence,
              price_date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              raw_text: price.context,
              extraction_method: 'regex'
            });
            pricesCount++;
          }
        }
      }
      
      console.log(`  Saved ${savedCount} new articles, ${pricesCount} prices`);
      results.articlesSaved += savedCount;
      results.pricesExtracted += pricesCount;
      
      // Update source status
      await supabase
        .from('market_data_sources')
        .update({
          last_fetch_at: new Date().toISOString(),
          last_fetch_status: 'success',
          fetch_error_count: 0
        })
        .eq('id', source.id);
      
      results.sourcesProcessed++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.log(`  ❌ Error: ${errorMsg}`);
      results.errors.push(`${source.name}: ${errorMsg}`);
      
      // Update source with error
      await supabase
        .from('market_data_sources')
        .update({
          last_fetch_at: new Date().toISOString(),
          last_fetch_status: 'failed',
          fetch_error_count: (source.fetch_error_count || 0) + 1
        })
        .eq('id', source.id);
    }
  }
  
  // Print summary
  console.log('\n========================================');
  console.log('SCRAPE COMPLETE');
  console.log('========================================');
  console.log(`Sources processed: ${results.sourcesProcessed}`);
  console.log(`Articles found: ${results.articlesFound}`);
  console.log(`Articles saved: ${results.articlesSaved}`);
  console.log(`Prices extracted: ${results.pricesExtracted}`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  return results;
}

// ============================================================================
// RUN
// ============================================================================

runDailyScrape()
  .then(results => {
    console.log('\nExiting with results:', JSON.stringify(results, null, 2));
    // Only fail if ZERO sources succeeded OR zero articles saved AND there were errors
    // Previously: any single error = exit 1, which caused GitHub Actions to always fail
    const totalSources = results.sourcesProcessed + results.errors.length;
    const allFailed = results.sourcesProcessed === 0 && results.errors.length > 0;
    const noData = results.articlesSaved === 0 && totalSources > 0;
    
    if (allFailed) {
      console.error('\n🚨 ALL sources failed. Exiting with error.');
      process.exit(1);
    } else if (noData && results.errors.length > 0) {
      console.warn('\n⚠️ No articles saved despite processing sources. Exiting with error.');
      process.exit(1);
    } else {
      if (results.errors.length > 0) {
        console.warn(`\n⚠️ ${results.errors.length} source(s) had errors, but ${results.sourcesProcessed} succeeded. Treating as partial success.`);
      }
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
