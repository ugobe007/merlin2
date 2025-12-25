#!/usr/bin/env node
/**
 * TEST PARSING IMPROVEMENTS
 * =========================
 * 
 * Test the improved price and topic extraction logic
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

// Import the improved functions (would need to be converted to ESM)
// For now, we'll test with actual database data

async function testParsingImprovements() {
  console.log('🧪 Testing Parsing Improvements...\n');
  
  // Get recent articles
  const { data: articles, error } = await supabase
    .from('scraped_articles')
    .select('id, title, full_content, prices_extracted, topics, equipment_mentioned')
    .order('fetched_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('❌ Error fetching articles:', error.message);
    return;
  }
  
  if (!articles || articles.length === 0) {
    console.log('⚠️  No articles found to test');
    return;
  }
  
  console.log(`📊 Analyzing ${articles.length} recent articles...\n`);
  
  // Analyze extraction rates
  const withPrices = articles.filter(a => 
    a.prices_extracted && Array.isArray(a.prices_extracted) && a.prices_extracted.length > 0
  );
  const withTopics = articles.filter(a => 
    a.topics && Array.isArray(a.topics) && a.topics.length > 0
  );
  const withEquipment = articles.filter(a => 
    a.equipment_mentioned && Array.isArray(a.equipment_mentioned) && a.equipment_mentioned.length > 0
  );
  
  const priceRate = (withPrices.length / articles.length) * 100;
  const topicRate = (withTopics.length / articles.length) * 100;
  const equipmentRate = (withEquipment.length / articles.length) * 100;
  
  console.log('📈 Current Extraction Rates:');
  console.log(`   Price: ${priceRate.toFixed(1)}% (${withPrices.length}/${articles.length})`);
  console.log(`   Topic: ${topicRate.toFixed(1)}% (${withTopics.length}/${articles.length})`);
  console.log(`   Equipment: ${equipmentRate.toFixed(1)}% (${withEquipment.length}/${articles.length})`);
  
  // Show sample articles with prices
  if (withPrices.length > 0) {
    console.log('\n💰 Sample Articles with Prices:');
    withPrices.slice(0, 3).forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.title?.substring(0, 60)}...`);
      console.log(`      Prices: ${JSON.stringify(a.prices_extracted)}`);
    });
  } else {
    console.log('\n⚠️  No articles with extracted prices found');
    console.log('   This indicates price extraction needs improvement');
  }
  
  // Show articles without prices but with equipment (potential missed opportunities)
  const missedOpportunities = articles.filter(a => 
    (!a.prices_extracted || a.prices_extracted.length === 0) &&
    a.equipment_mentioned && a.equipment_mentioned.length > 0
  );
  
  if (missedOpportunities.length > 0) {
    console.log(`\n🔍 Found ${missedOpportunities.length} articles with equipment but no prices:`);
    console.log('   These are potential opportunities for improved extraction');
    missedOpportunities.slice(0, 3).forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.title?.substring(0, 60)}...`);
      console.log(`      Equipment: ${a.equipment_mentioned?.join(', ')}`);
      // Check if content contains price-like patterns
      const content = (a.full_content || '').toLowerCase();
      const hasPricePattern = /\$\d+|\d+\s*dollar|\d+\s*per\s*kwh|\d+\s*per\s*kw/.test(content);
      console.log(`      Contains price pattern: ${hasPricePattern ? '✅' : '❌'}`);
    });
  }
  
  // Recommendations
  console.log('\n' + '═'.repeat(60));
  console.log('💡 Recommendations:');
  
  if (priceRate < 30) {
    console.log('   ⚠️  Price extraction is below 30% - CRITICAL');
    console.log('      - Check if HTML stripping is working');
    console.log('      - Verify regex patterns match article formats');
    console.log('      - Consider adding more flexible patterns');
  } else if (priceRate < 50) {
    console.log('   ⚠️  Price extraction is below 50% - needs improvement');
    console.log('      - Review articles without prices');
    console.log('      - Expand pattern matching');
  } else {
    console.log('   ✅ Price extraction is above 50% - good!');
  }
  
  if (topicRate < 50) {
    console.log('   ⚠️  Topic extraction is below 50% - needs improvement');
    console.log('      - Expand keyword lists');
    console.log('      - Improve fuzzy matching');
  } else {
    console.log('   ✅ Topic extraction is above 50% - good!');
  }
  
  console.log('═'.repeat(60) + '\n');
}

testParsingImprovements().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

