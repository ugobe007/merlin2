#!/usr/bin/env node
/**
 * SQL Migration Runner using Supabase pg package
 * Usage: node scripts/run-migration-pg.mjs <migration-file.sql>
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fvmpmozybmtzjvikrctq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigration(filePath) {
  console.log(`\n🚀 Running migration: ${filePath}\n`);
  
  let sql;
  try {
    sql = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`❌ Could not read file: ${filePath}`);
    process.exit(1);
  }
  
  // Extract just the INSERT statements for market_data_sources
  // (DDL needs to be run via Supabase Dashboard)
  
  console.log('📋 Checking if tables exist...\n');
  
  // Check market_data_sources
  const { data: sources, error: sourcesErr } = await supabase
    .from('market_data_sources')
    .select('count')
    .limit(1);
  
  if (sourcesErr) {
    console.log('⚠️  market_data_sources table check:', sourcesErr.message);
  } else {
    console.log('✅ market_data_sources table exists');
  }
  
  // Check if scraped_articles exists
  const { data: articles, error: articlesErr } = await supabase
    .from('scraped_articles')
    .select('count')
    .limit(1);
  
  if (articlesErr && articlesErr.code === '42P01') {
    console.log('⚠️  scraped_articles table does NOT exist - need to create via Dashboard');
    console.log('\n📋 Please run the full SQL in Supabase Dashboard SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/sql/new\n');
    return false;
  } else if (articlesErr) {
    console.log('⚠️  scraped_articles check:', articlesErr.message);
  } else {
    console.log('✅ scraped_articles table exists');
  }
  
  // Check regulatory_updates
  const { data: regs, error: regsErr } = await supabase
    .from('regulatory_updates')
    .select('count')
    .limit(1);
  
  if (regsErr && regsErr.code === '42P01') {
    console.log('⚠️  regulatory_updates table does NOT exist');
  } else if (regsErr) {
    console.log('⚠️  regulatory_updates check:', regsErr.message);
  } else {
    console.log('✅ regulatory_updates table exists');
  }
  
  // Check scrape_jobs
  const { data: jobs, error: jobsErr } = await supabase
    .from('scrape_jobs')
    .select('count')
    .limit(1);
  
  if (jobsErr && jobsErr.code === '42P01') {
    console.log('⚠️  scrape_jobs table does NOT exist');
  } else if (jobsErr) {
    console.log('⚠️  scrape_jobs check:', jobsErr.message);
  } else {
    console.log('✅ scrape_jobs table exists');
  }
  
  console.log('\n' + '═'.repeat(60));
  
  // If tables exist, try to insert the new sources
  if (!articlesErr || articlesErr.code !== '42P01') {
    console.log('\n📋 Inserting new market data sources...\n');
    
    const newSources = [
      // Transformers & Switchgear
      { name: 'T&D World', url: 'https://www.tdworld.com', feed_url: 'https://www.tdworld.com/rss.xml', source_type: 'rss_feed', equipment_categories: ['transformer', 'switchgear'], content_type: 'mixed', regions: ['global'], reliability_score: 4, data_frequency: 'daily', notes: 'Transmission & distribution equipment news.' },
      { name: 'Power Engineering', url: 'https://www.power-eng.com', feed_url: 'https://www.power-eng.com/feed/', source_type: 'rss_feed', equipment_categories: ['transformer', 'switchgear', 'generator'], content_type: 'mixed', regions: ['global'], reliability_score: 4, data_frequency: 'daily', notes: 'Power generation and T&D equipment.' },
      { name: 'Microgrid Knowledge', url: 'https://www.microgridknowledge.com', feed_url: 'https://www.microgridknowledge.com/feed/', source_type: 'rss_feed', equipment_categories: ['microgrid', 'hybrid-system', 'bess'], content_type: 'mixed', regions: ['global'], reliability_score: 4, data_frequency: 'daily', notes: 'Microgrid news, projects, and technology.' },
      // Manufacturers
      { name: 'Mainspring Energy', url: 'https://mainspringenergy.com/', source_type: 'manufacturer', equipment_categories: ['linear-generator', 'generator'], content_type: 'product_specs', regions: ['north-america'], reliability_score: 4, data_frequency: 'quarterly', notes: 'Linear generator technology.' },
      { name: 'Electrify America', url: 'https://www.electrifyamerica.com/', source_type: 'manufacturer', equipment_categories: ['ev-charger'], content_type: 'product_specs', regions: ['north-america'], reliability_score: 4, data_frequency: 'quarterly', notes: 'DC fast charging network.' },
      { name: 'Tritium', url: 'https://tritiumcharging.com/', source_type: 'manufacturer', equipment_categories: ['ev-charger'], content_type: 'product_specs', regions: ['global'], reliability_score: 4, data_frequency: 'quarterly', notes: 'DC fast charger manufacturer.' },
      // Regulatory
      { name: 'DSIRE', url: 'https://www.dsireusa.org/', source_type: 'government', equipment_categories: ['all'], content_type: 'policy', regions: ['north-america'], reliability_score: 5, data_frequency: 'weekly', notes: 'US renewable energy incentives database.' },
      { name: 'FERC News', url: 'https://www.ferc.gov/news-events', feed_url: 'https://www.ferc.gov/rss.xml', source_type: 'government', equipment_categories: ['all'], content_type: 'policy', regions: ['north-america'], reliability_score: 5, data_frequency: 'daily', notes: 'Federal Energy Regulatory Commission.' },
    ];
    
    for (const source of newSources) {
      const { error } = await supabase
        .from('market_data_sources')
        .upsert(source, { onConflict: 'name' });
      
      if (error) {
        console.log(`⚠️  ${source.name}: ${error.message}`);
      } else {
        console.log(`✅ ${source.name}`);
      }
    }
    
    // Count total sources
    const { count } = await supabase
      .from('market_data_sources')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total market data sources: ${count}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Migration check complete!');
  console.log('═'.repeat(60) + '\n');
  
  return true;
}

const filePath = process.argv[2] || 'database/migrations/20251210_expanded_equipment_scraping.sql';
runMigration(filePath).then(ok => process.exit(ok ? 0 : 1));
