/**
 * Manual Scraper Test Script
 * Run this to test the opportunity scraper and populate the database
 * Usage: node --loader ts-node/esm src/scripts/testScraper.ts
 */

import { runOpportunityScraper } from "../api/opportunityScraper";

async function main() {
  console.log("🧙‍♂️ Merlin Opportunity Scraper Test\n");
  console.log("=====================================\n");

  const result = await runOpportunityScraper();

  console.log("\n=====================================");
  console.log("📊 RESULTS:");
  console.log("=====================================");
  console.log(`Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`Message: ${result.message}`);

  if (result.data) {
    console.log(`\nTotal Found: ${result.data.total_found}`);
    console.log(`New Opportunities: ${result.data.new_opportunities}`);
    console.log(`Duplicates Skipped: ${result.data.duplicates_skipped}`);
  }

  if (result.error) {
    console.error(`\nError: ${result.error}`);
  }

  console.log("\n✨ View opportunities at: https://merlin2.fly.dev/opportunities");
  console.log("=====================================\n");
}

main().catch(console.error);
