#!/usr/bin/env node
/**
 * TEST SCRAPER AND PARSING ENGINES
 * ================================
 * 
 * Quick test to verify scraper and parsing are working
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScraper() {
  console.log('🔍 Testing Scraper and Parsing Engines...\n');
  
  // Test 1: Check if tables exist
  console.log('1. Checking database tables...');
  try {
    const { error: sourcesError } = await supabase.from('market_data_sources').select('id').limit(1);
    const { error: articlesError } = await supabase.from('scraped_articles').select('id').limit(1);
    const { error: jobsError } = await supabase.from('scrape_jobs').select('id').limit(1);
    
    if (sourcesError) {
      console.log('   ❌ market_data_sources table missing or inaccessible');
      console.log(`      Error: ${sourcesError.message}`);
    } else {
      console.log('   ✅ market_data_sources table exists');
    }
    
    if (articlesError) {
      console.log('   ❌ scraped_articles table missing or inaccessible');
      console.log(`      Error: ${articlesError.message}`);
    } else {
      console.log('   ✅ scraped_articles table exists');
    }
    
    if (jobsError) {
      console.log('   ❌ scrape_jobs table missing or inaccessible');
      console.log(`      Error: ${jobsError.message}`);
    } else {
      console.log('   ✅ scrape_jobs table exists');
    }
  } catch (error) {
    console.error('   ❌ Database connection failed:', error.message);
  }
  
  // Test 2: Check for active RSS sources
  console.log('\n2. Checking for active RSS sources...');
  try {
    const { data: sources, error } = await supabase
      .from('market_data_sources')
      .select('id, name, feed_url, is_active, last_fetch_at, last_fetch_status')
      .eq('is_active', true)
      .eq('source_type', 'rss_feed')
      .not('feed_url', 'is', null);
    
    if (error) {
      console.log(`   ❌ Error fetching sources: ${error.message}`);
    } else if (!sources || sources.length === 0) {
      console.log('   ⚠️  No active RSS sources found');
      console.log('      You need to add RSS sources to the market_data_sources table');
    } else {
      console.log(`   ✅ Found ${sources.length} active RSS source(s):`);
      sources.forEach((s, i) => {
        const lastFetch = s.last_fetch_at ? new Date(s.last_fetch_at).toLocaleString() : 'Never';
        const status = s.last_fetch_status || 'unknown';
        console.log(`      ${i + 1}. ${s.name}`);
        console.log(`         URL: ${s.feed_url}`);
        console.log(`         Last fetch: ${lastFetch} (${status})`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 3: Check for scraped articles
  console.log('\n3. Checking scraped articles...');
  try {
    const { data: articles, error } = await supabase
      .from('scraped_articles')
      .select('id, title, source_id, published_at, prices_extracted, topics, equipment_mentioned')
      .order('fetched_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log(`   ❌ Error fetching articles: ${error.message}`);
    } else if (!articles || articles.length === 0) {
      console.log('   ⚠️  No scraped articles found');
      console.log('      The scraper may not have run yet');
    } else {
      console.log(`   ✅ Found ${articles.length} recent article(s):`);
      articles.forEach((a, i) => {
        const prices = a.prices_extracted?.length || 0;
        const topics = a.topics?.length || 0;
        const equipment = a.equipment_mentioned?.length || 0;
        console.log(`      ${i + 1}. ${a.title?.substring(0, 60) || 'Untitled'}...`);
        console.log(`         Prices: ${prices}, Topics: ${topics}, Equipment: ${equipment}`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 4: Check scrape jobs
  console.log('\n4. Checking scrape jobs...');
  try {
    const { data: jobs, error } = await supabase
      .from('scrape_jobs')
      .select('id, job_type, last_run_at, last_run_status, items_found, items_new, prices_extracted')
      .eq('is_enabled', true)
      .order('last_run_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log(`   ❌ Error fetching jobs: ${error.message}`);
    } else if (!jobs || jobs.length === 0) {
      console.log('   ⚠️  No enabled scrape jobs found');
    } else {
      console.log(`   ✅ Found ${jobs.length} enabled job(s):`);
      jobs.forEach((j, i) => {
        const lastRun = j.last_run_at ? new Date(j.last_run_at).toLocaleString() : 'Never';
        const status = j.last_run_status || 'unknown';
        console.log(`      ${i + 1}. ${j.job_type} - ${status}`);
        console.log(`         Last run: ${lastRun}`);
        console.log(`         Found: ${j.items_found || 0}, New: ${j.items_new || 0}, Prices: ${j.prices_extracted || 0}`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Test 5: Test parsing logic (if we have articles)
  console.log('\n5. Testing parsing quality...');
  try {
    const { data: articles, error } = await supabase
      .from('scraped_articles')
      .select('prices_extracted, topics, equipment_mentioned')
      .limit(50);
    
    if (error || !articles || articles.length === 0) {
      console.log('   ⚠️  No articles to test parsing on');
    } else {
      const withPrices = articles.filter(a => a.prices_extracted && a.prices_extracted.length > 0);
      const withTopics = articles.filter(a => a.topics && a.topics.length > 0);
      const withEquipment = articles.filter(a => a.equipment_mentioned && a.equipment_mentioned.length > 0);
      
      const priceRate = (withPrices.length / articles.length) * 100;
      const topicRate = (withTopics.length / articles.length) * 100;
      const equipmentRate = (withEquipment.length / articles.length) * 100;
      
      console.log(`   📊 Parsing Quality (${articles.length} articles):`);
      console.log(`      Price extraction: ${priceRate.toFixed(1)}% (${withPrices.length}/${articles.length})`);
      console.log(`      Topic extraction: ${topicRate.toFixed(1)}% (${withTopics.length}/${articles.length})`);
      console.log(`      Equipment extraction: ${equipmentRate.toFixed(1)}% (${withEquipment.length}/${articles.length})`);
      
      if (priceRate < 30) {
        console.log('   ⚠️  Low price extraction rate - parsing may need improvement');
      } else if (priceRate >= 50) {
        console.log('   ✅ Good price extraction rate');
      }
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Scraper and Parsing Test Complete');
  console.log('═'.repeat(60) + '\n');
}

testScraper().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

