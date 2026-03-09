#!/usr/bin/env node
import { Client } from 'pg';

console.log('============================================================');
console.log('SCRAPER TEST - Version 2.0.0 (Direct PostgreSQL)');
console.log('This bypasses PostgREST schema cache entirely');
console.log('============================================================');
console.log('');

const SUPABASE_URL = process.env.SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('✅ Credentials found');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Password: ${DB_PASSWORD.slice(0, 4)}...`);
console.log('');

// Extract database connection from Supabase URL
// Supabase URL format: https://xxxxx.supabase.co
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

async function testInsert() {
  console.log('📝 Attempting test INSERT via direct PostgreSQL...');
  
  const testArticle = {
    title: 'Test Article ' + new Date().toISOString(),
    url: 'https://test.com/article-' + Date.now(),
    excerpt: 'Test excerpt',
    content: 'Test content',
    equipment_mentioned: ['bess'],
    relevance_score: 0.5,
    is_processed: true
  };
  
  console.log('   Article:', JSON.stringify(testArticle, null, 2));
  
  // Use direct database connection (not pooler)
  const connectionString = `postgresql://postgres:${DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL directly');
    
    const result = await client.query(
      `INSERT INTO scraped_articles (title, url, excerpt, content, equipment_mentioned, relevance_score, is_processed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, scraped_at`,
      [
        testArticle.title,
        testArticle.url,
        testArticle.excerpt,
        testArticle.content,
        testArticle.equipment_mentioned,
        testArticle.relevance_score,
        testArticle.is_processed
      ]
    );
    
    console.log('✅ INSERT SUCCEEDED!');
    console.log('   ID:', result.rows[0].id);
    console.log('   Scraped at:', result.rows[0].scraped_at);
    
    // Clean up test data
    await client.query('DELETE FROM scraped_articles WHERE url = $1', [testArticle.url]);
    console.log('✅ Test data cleaned up');
    
    await client.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ INSERT FAILED!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Stack:', error.stack);
    if (client) await client.end().catch(() => {});
    process.exit(1);
  }
}

testInsert();
