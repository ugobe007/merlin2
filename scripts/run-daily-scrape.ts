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
import { parseRSSFeed, classifyContent, extractPrices } from '../src/services/marketDataParser';

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

// Parsing functions (parseRSSFeed, classifyContent, extractPrices) are now
// imported from ../src/services/marketDataParser - the canonical zero-dependency
// implementation shared by both this script and marketDataScraper.ts (browser).

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
            excerpt: item.description?.slice(0, 500),  // FIXED: was 'summary'
            content: item.content,  // FIXED: was 'full_content'
            topics: classification.topics,
            equipment_mentioned: classification.equipment,
            prices_extracted: prices,
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
        } else {
          // Log INSERT errors for debugging
          console.error(`  ❌ Failed to insert article: ${item.title?.slice(0, 50)}...`);
          console.error(`     Error: ${insertError.message}`);
          console.error(`     Details: ${JSON.stringify(insertError, null, 2)}`);
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

      // Update scrape_jobs tracking (Issue 3 fix — this table was orphaned)
      await supabase.from('scrape_jobs').upsert({
        source_id: source.id,
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        items_found: items.length,
        items_new: savedCount,
        prices_extracted: pricesCount,
        last_error: null,
      }, { onConflict: 'source_id' });

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

      // Update scrape_jobs tracking (Issue 3 fix)
      await supabase.from('scrape_jobs').upsert({
        source_id: source.id,
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
        last_error: errorMsg,
      }, { onConflict: 'source_id' });
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
