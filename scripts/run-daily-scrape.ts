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

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseRSSFeed, classifyContent, extractPrices } from '../src/services/marketDataParser';

// Load environment variables from .env file
config();

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
      let skippedCount = 0;  // Track duplicates
      
      console.log(`  Processing ${items.length} items from this source...`);
      
      for (const item of items) {
        console.log(`  [LOOP] Processing item: ${item.title?.slice(0, 30)}...`);
        
        // Check if already exists (maybeSingle returns null if not found, no error)
        const { data: existing, error: checkError } = await supabase
          .from('scraped_articles')
          .select('id')
          .eq('url', item.link)
          .maybeSingle();  // FIXED: was .single() which errors on 0 rows
        
        console.log(`  [DUP CHECK] existing=${!!existing}, checkError=${!!checkError}`);
        
        if (checkError) {
          console.error(`  ⚠️ Error checking duplicate for ${item.link}: ${checkError.message}`);
          continue;
        }
        
        if (existing) {
          skippedCount++;
          continue;
        }
        
        // Classify content
        const fullText = `${item.title} ${item.content}`;
        const classification = classifyContent(fullText);
        const prices = extractPrices(fullText, classification.equipment);
        
        // DEBUG: Log before INSERT to verify we reach this point
        console.log(`  → Attempting INSERT for: ${item.title?.slice(0, 40)}...`);
        
        // Use raw SQL function to completely bypass PostgREST schema cache
        const { data, error: insertError } = await supabase
          .rpc('insert_article_raw', {
            p_source_id: source.id,
            p_title: item.title || 'Untitled',
            p_url: item.link,
            p_excerpt: item.description?.slice(0, 500) || '',
            p_content: item.content || '',
            p_published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            p_equipment_mentioned: classification.equipment || [],
            p_topics: classification.topics || [],
            p_relevance_score: classification.relevanceScore || 0.5
          });
        
        if (insertError) {
          // Log INSERT errors for debugging
          console.error(`\n  ❌ INSERT FAILED for: ${item.title?.slice(0, 60)}...`);
          console.error(`     URL: ${item.link}`);
          console.error(`     Error message: ${insertError.message}`);
          console.error(`     Error code: ${insertError.code}`);
          console.error(`     Error details: ${JSON.stringify(insertError.details)}`);
          console.error(`     Error hint: ${insertError.hint}`);
          console.error(`     Full error: ${JSON.stringify(insertError, null, 2)}\n`);
          continue;
        }
        
        if (data) {
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
      
      console.log(`  Saved ${savedCount} new articles, ${pricesCount} prices (skipped ${skippedCount} duplicates)`);
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
    // Failure conditions:
    //   1. ALL sources failed (nothing worked at all)
    //   2. Zero articles found total (feeds returned nothing — possible auth/config issue)
    // NOT a failure:
    //   - Some sources 403/429 while others succeed (common for public RSS)
    //   - Articles saved = 0 because all are duplicates (DB is already current — healthy!)
    const allFailed = results.sourcesProcessed === 0 && results.errors.length > 0;
    const noItemsFound = results.articlesFound === 0 && results.sourcesProcessed > 0;

    if (allFailed) {
      console.error('\n🚨 ALL sources failed. Exiting with error.');
      process.exit(1);
    } else if (noItemsFound) {
      console.warn('\n⚠️ Sources responded but returned zero articles — possible feed config issue.');
      process.exit(1);
    } else {
      if (results.errors.length > 0) {
        console.warn(`\n⚠️ ${results.errors.length} source(s) had errors, but ${results.sourcesProcessed} succeeded.`);
      }
      if (results.articlesSaved === 0 && results.articlesFound > 0) {
        console.log(`\nℹ️  All ${results.articlesFound} articles already in DB — database is current. ✅`);
      }
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
