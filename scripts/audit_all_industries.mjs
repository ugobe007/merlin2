/**
 * Complete Industry Audit Script
 * 
 * Identifies ALL industries/use cases and their status:
 * 1. Industry profile file exists?
 * 2. TrueQuote Engine config exists?
 * 3. Database field names (need SQL query)
 * 4. Field name mismatches
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('═'.repeat(80));
console.log('COMPLETE INDUSTRY AUDIT');
console.log('═'.repeat(80));
console.log('');

// Read industry profiles index
const industryProfilesIndex = readFileSync(
  join(rootDir, 'src/services/industryProfiles/index.ts'),
  'utf-8'
);

// Extract INDUSTRY_REGISTRY
const registryMatch = industryProfilesIndex.match(/export const INDUSTRY_REGISTRY.*?\[([\s\S]*?)\];/);
if (registryMatch) {
  const registryContent = registryMatch[1];
  const industryMatches = registryContent.matchAll(/id:\s*['"]([^'"]+)['"]/g);
  
  const industries = Array.from(industryMatches).map(m => m[1]);
  
  console.log(`Found ${industries.length} industries in INDUSTRY_REGISTRY:\n`);
  industries.forEach((id, idx) => {
    console.log(`${idx + 1}. ${id}`);
  });
} else {
  console.log('Could not parse INDUSTRY_REGISTRY');
}

console.log('\n');

// Check TrueQuote Engine
const trueQuoteEngine = readFileSync(
  join(rootDir, 'src/services/TrueQuoteEngine.ts'),
  'utf-8'
);

const configMatches = trueQuoteEngine.matchAll(/(\w+_CONFIG):\s*IndustryConfig\s*=/g);
const trueQuoteIndustries = Array.from(configMatches).map(m => {
  const configName = m[1];
  // Extract slug from config
  const slugMatch = trueQuoteEngine.match(
    new RegExp(`${configName}[\\s\\S]*?slug:\\s*['"]([^'"]+)['"]`)
  );
  return slugMatch ? slugMatch[1] : configName;
});

console.log(`\nTrueQuote Engine has configs for ${trueQuoteIndustries.length} industries:\n`);
trueQuoteIndustries.forEach((slug, idx) => {
  console.log(`${idx + 1}. ${slug}`);
});

console.log('\n');
console.log('═'.repeat(80));
console.log('NEXT STEPS:');
console.log('1. Run SQL query to get all use_case slugs from database');
console.log('2. Compare industry profiles vs TrueQuote Engine configs');
console.log('3. Check database field names for each industry');
console.log('4. Identify field name mismatches');
console.log('');
