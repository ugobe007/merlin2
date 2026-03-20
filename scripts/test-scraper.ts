/**
 * Simple test to verify Supabase connection and INSERT works
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('='.repeat(60));
console.log('SCRAPER TEST - Version 1.0.0');
console.log('This script SHOULD appear in GitHub Actions');
console.log('='.repeat(60));
console.log('');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

console.log('✅ Credentials found');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_KEY.slice(0, 20)}...`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
  console.log('📝 Attempting test INSERT via RPC function (bypasses PostgREST cache)...');
  
  const testArticle = {
    p_source_id: null,
    p_title: 'Test Article ' + new Date().toISOString(),
    p_url: 'https://test.com/article-' + Date.now(),
    p_author: null,
    p_published_at: new Date().toISOString(),
    p_excerpt: 'Test excerpt',
    p_content: 'Test content',
    p_topics: [],
    p_equipment_mentioned: ['bess'],
    p_relevance_score: 0.5,
    p_is_processed: true,
    p_prices_extracted: [],
    p_regulations_mentioned: []
  };
  
  console.log('   Article:', JSON.stringify(testArticle, null, 2));
  
  const { data, error } = await supabase
    .rpc('insert_scraped_article', testArticle);
  
  if (error) {
    console.error('❌ INSERT FAILED!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', JSON.stringify(error.details));
    console.error('   Hint:', error.hint);
    process.exit(1);
  }
  
  console.log('✅ INSERT SUCCEEDED!');
  console.log('   Data:', JSON.stringify(data, null, 2));
  
  // Clean up test data
  if (data && data[0]) {
    await supabase.from('scraped_articles').delete().eq('id', data[0].id);
    console.log('🗑️  Test article deleted');
  }
}

testInsert().catch(err => {
  console.error('💥 Exception:', err);
  process.exit(1);
});
