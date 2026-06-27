/**
 * Standalone runner for the opportunity scraper.
 * Pulls business leads from Google News RSS feeds into the opportunities table.
 * Usage: npx tsx scripts/run-opportunity-scraper.ts
 */
import 'dotenv/config';
import { runOpportunityScraper } from '../server/services/opportunity-scraper.js';

console.log('========================================');
console.log('Starting Opportunity Scraper');
console.log(`Time: ${new Date().toISOString()}`);
console.log('========================================\n');

const result = await runOpportunityScraper({ minConfidence: 50, maxPerSource: 75 });

console.log('\n========================================');
console.log('OPPORTUNITY SCRAPE COMPLETE');
console.log('========================================');
console.log(JSON.stringify(result, null, 2));
