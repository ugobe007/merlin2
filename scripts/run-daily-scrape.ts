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
 * Improvements (April 2026):
 * - Concurrent processing (CONCURRENCY=5 sources in parallel)
 * - Retry logic with exponential backoff for 429 / 503
 * - User-Agent rotation to reduce 403 bot blocks
 * - Auto-deactivate sources with 5+ consecutive 404 failures
 * - Improved price extraction patterns (see marketDataParser.ts)
 *
 * Created: December 10, 2025
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseRSSFeed, classifyContent, extractPrices } from '../src/services/marketDataParser';

// ============================================================================
// CONSTANTS
// ============================================================================

const CONCURRENCY = 5;           // parallel sources at a time
const REQUEST_TIMEOUT_MS = 15000; // 15s per request
const RETRY_DELAYS_MS = [2000, 6000]; // backoff for 429/503 (2 retries)
const MAX_CONSECUTIVE_404S = 5;   // deactivate source after this many consecutive 404s

/** Rotating User-Agents — reduces 403 blocks from bot-detection middleware */
const USER_AGENTS = [
  'Mozilla/5.0 (compatible; Merlin-BESS/1.0; +https://merlinenergy.net/market-data)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Feedfetcher-Google; (+http://www.google.com/feedfetcher.html)',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

let uaIndex = 0;
function nextUA(): string {
  return USER_AGENTS[uaIndex++ % USER_AGENTS.length];
}

// ============================================================================
// RETRY FETCH
// ============================================================================

/** Fetch with automatic retry on 429 / 503 and configurable timeout */
async function fetchWithRetry(url: string, retries = RETRY_DELAYS_MS.length): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': nextUA(),
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Retry on rate-limit or service-unavailable
      if ((res.status === 429 || res.status === 503) && attempt < retries) {
        const delay = RETRY_DELAYS_MS[attempt];
        console.log(`    ↻ HTTP ${res.status} — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      return res;
    } catch (err: any) {
      clearTimeout(timer);
      if (attempt < retries && err?.name !== 'AbortError') {
        const delay = RETRY_DELAYS_MS[attempt];
        console.log(`    ↻ Network error — retrying in ${delay / 1000}s`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================================================
// CONCURRENCY POOL
// ============================================================================

/** Run tasks with a max concurrency limit */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

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
  process.exit(1);
}

const isServiceRole = SUPABASE_KEY.length > 200;
if (!isServiceRole) {
  console.warn('⚠️  WARNING: Using anon key. Inserts may fail due to RLS.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// PROCESS ONE SOURCE
// ============================================================================

interface SourceResult {
  name: string;
  articlesFound: number;
  articlesSaved: number;
  pricesExtracted: number;
  error?: string;
  skipped?: number;
}

async function processSource(source: any, index: number, total: number): Promise<SourceResult> {
  const result: SourceResult = { name: source.name, articlesFound: 0, articlesSaved: 0, pricesExtracted: 0 };
  console.log(`  [${index + 1}/${total}] ${source.name}`);

  try {
    const response = await fetchWithRetry(source.feed_url);

    if (!response.ok) {
      const err = `HTTP ${response.status}: ${response.statusText}`;

      // Auto-deactivate sources that persistently 404
      if (response.status === 404) {
        const newErrorCount = (source.fetch_error_count || 0) + 1;
        if (newErrorCount >= MAX_CONSECUTIVE_404S) {
          console.log(`    🚫 Auto-deactivating "${source.name}" — ${newErrorCount} consecutive 404s`);
          await supabase
            .from('market_data_sources')
            .update({ is_active: false, last_fetch_status: 'deactivated', last_fetch_at: new Date().toISOString() })
            .eq('id', source.id);
          result.error = `${err} (auto-deactivated after ${newErrorCount} failures)`;
          return result;
        }
      }

      throw new Error(err);
    }

    const xml = await response.text();
    const items = parseRSSFeed(xml);
    result.articlesFound = items.length;

    // Bulk-check for duplicates: fetch existing URLs in one query
    const urls = items.map(i => i.link).filter(Boolean);
    const { data: existingRows } = await supabase
      .from('scraped_articles')
      .select('url')
      .in('url', urls.slice(0, 500)); // Supabase IN limit

    const existingSet = new Set((existingRows || []).map((r: any) => r.url));
    const newItems = items.filter(i => i.link && !existingSet.has(i.link));
    result.skipped = items.length - newItems.length;

    for (const item of newItems) {
      const fullText = `${item.title} ${item.content || item.description || ''}`;
      const classification = classifyContent(fullText);
      const prices = extractPrices(fullText, classification.equipment);

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
          p_relevance_score: classification.relevanceScore || 0.5,
        });

      if (insertError) {
        console.error(`    ❌ Insert failed: ${insertError.message}`);
        continue;
      }

      if (data) {
        result.articlesSaved++;

        for (const price of prices) {
          await supabase.from('collected_market_prices').insert({
            source_id: source.id,
            equipment_type: price.equipment,
            price_per_unit: price.price,
            unit: price.unit,
            currency: price.currency || 'USD',
            confidence_score: price.confidence,
            price_date: item.pubDate
              ? new Date(item.pubDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            raw_text: price.context,
            extraction_method: 'regex',
          });
          result.pricesExtracted++;
        }
      }
    }

    console.log(`    ✓ ${result.articlesSaved} new / ${result.skipped} dup / ${result.pricesExtracted} prices`);

    // Update source + job status
    await Promise.all([
      supabase.from('market_data_sources').update({
        last_fetch_at: new Date().toISOString(),
        last_fetch_status: 'success',
        fetch_error_count: 0,
      }).eq('id', source.id),

      supabase.from('scrape_jobs').upsert({
        source_id: source.id,
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        items_found: result.articlesFound,
        items_new: result.articlesSaved,
        prices_extracted: result.pricesExtracted,
        last_error: null,
      }, { onConflict: 'source_id' }),
    ]);

  } catch (err: any) {
    const errorMsg = err?.message ?? 'Unknown error';
    result.error = errorMsg;
    console.log(`    ❌ ${errorMsg}`);

    await Promise.all([
      supabase.from('market_data_sources').update({
        last_fetch_at: new Date().toISOString(),
        last_fetch_status: 'failed',
        fetch_error_count: (source.fetch_error_count || 0) + 1,
      }).eq('id', source.id),

      supabase.from('scrape_jobs').upsert({
        source_id: source.id,
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
        last_error: errorMsg,
      }, { onConflict: 'source_id' }),
    ]);
  }

  return result;
}

// ============================================================================
// MAIN SCRAPE FUNCTION
// ============================================================================

async function runDailyScrape() {
  console.log('========================================');
  console.log('Starting Daily Market Data Scrape');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Concurrency: ${CONCURRENCY} parallel sources`);
  console.log('========================================\n');

  const { data: sources, error } = await supabase
    .from('market_data_sources')
    .select('*')
    .eq('is_active', true)
    .eq('source_type', 'rss_feed')
    .not('feed_url', 'is', null)
    .order('reliability_score', { ascending: false });

  if (error || !sources) {
    console.error('Failed to fetch sources:', error?.message);
    return { sourcesProcessed: 0, articlesFound: 0, articlesSaved: 0, pricesExtracted: 0, errors: [] };
  }

  console.log(`Found ${sources.length} active RSS sources\n`);

  const tasks = sources.map((source: any, i: number) =>
    () => processSource(source, i, sources.length)
  );

  const sourceResults = await runWithConcurrency(tasks, CONCURRENCY);

  // Aggregate
  const results = {
    sourcesProcessed: 0,
    articlesFound: 0,
    articlesSaved: 0,
    pricesExtracted: 0,
    errors: [] as string[],
  };

  for (const r of sourceResults) {
    results.articlesFound += r.articlesFound;
    results.articlesSaved += r.articlesSaved;
    results.pricesExtracted += r.pricesExtracted;
    if (r.error) {
      results.errors.push(`${r.name}: ${r.error}`);
    } else {
      results.sourcesProcessed++;
    }
  }

  console.log('\n========================================');
  console.log('SCRAPE COMPLETE');
  console.log('========================================');
  console.log(`Sources processed: ${results.sourcesProcessed} / ${sources.length}`);
  console.log(`Articles found:    ${results.articlesFound}`);
  console.log(`Articles saved:    ${results.articlesSaved}`);
  console.log(`Prices extracted:  ${results.pricesExtracted}`);
  console.log(`Errors:            ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nFailed sources:');
    results.errors.forEach(e => console.log(`  - ${e}`));
  }

  return results;
}

// ============================================================================
// RUN
// ============================================================================

runDailyScrape()
  .then(results => {
    const allFailed = results.sourcesProcessed === 0 && results.errors.length > 0;
    const noItemsFound = results.articlesFound === 0 && results.sourcesProcessed > 0;

    if (allFailed) {
      console.error('\n🚨 ALL sources failed. Exiting with error.');
      process.exit(1);
    } else if (noItemsFound) {
      console.warn('\n⚠️ Sources responded but returned zero articles.');
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
