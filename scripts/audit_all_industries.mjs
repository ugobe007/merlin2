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

// Check calculator coverage — each industry should have a dedicated calculator
import { readdirSync } from 'fs';

const calculatorsDir = join(rootDir, 'src/services/calculators');
const calculatorFiles = readdirSync(calculatorsDir).filter(f => f.endsWith('.ts'));

// Map calculator filenames to industry slugs they cover
const CALCULATOR_SLUG_MAP = {
  'hotel16QCalculator.ts': 'hotel',
  'hotelIntegration.ts': 'hotel',
  'carWash16QCalculator.ts': 'car_wash',
  'carWashIntegration.ts': 'car_wash',
  'evCharging16QCalculator.ts': 'ev_charging',
  'evChargingIntegration.ts': 'ev_charging',
  'evCalculator.ts': 'ev_charging',
  'dataCenter16QCalculator.ts': 'data_center',
  'dataCenterIntegration.ts': 'data_center',
  'hospital16QCalculator.ts': 'hospital',
  'hospitalIntegration.ts': 'hospital',
  'office16QCalculator.ts': 'office',
  'officeIntegration.ts': 'office',
  'truckStop16QCalculator.ts': 'truck_stop',
  'truckStopIntegration.ts': 'truck_stop',
  'manufacturing16QCalculator.ts': 'manufacturing',
  'manufacturingIntegration.ts': 'manufacturing',
  'retail16QCalculator.ts': 'retail',
  'retailIntegration.ts': 'retail',
  'restaurant16QCalculator.ts': 'restaurant',
  'restaurantIntegration.ts': 'restaurant',
  'agriculture16QCalculator.ts': 'agriculture',
  'agricultureIntegration.ts': 'agriculture',
  'warehouse16QCalculator.ts': 'warehouse',
  'warehouseIntegration.ts': 'warehouse',
  'college16QCalculator.ts': 'college',
  'collegeIntegration.ts': 'college',
  'bessCalculator.ts': 'shared',
  'solarCalculator.ts': 'shared',
  'financialCalculator.ts': 'shared',
  'generatorCalculator.ts': 'shared',
  'loadCalculator.ts': 'shared',
  'siteScoreCalculator.ts': 'shared',
};

const coveredSlugs = new Set(
  calculatorFiles
    .map(f => CALCULATOR_SLUG_MAP[f])
    .filter(slug => slug && slug !== 'shared')
);

console.log(`\nDedicated calculators found for ${coveredSlugs.size} industries:\n`);
Array.from(coveredSlugs).forEach((slug, idx) => {
  console.log(`${idx + 1}. ${slug}`);
});

console.log(`\nCalculator files present (${calculatorFiles.length} total):`);
calculatorFiles.forEach(f => console.log(`  • ${f}`));

// --- GAP ANALYSIS ---
// Re-parse registry industries
const registryMatch2 = industryProfilesIndex.match(/export const INDUSTRY_REGISTRY.*?\[([\s\S]*?)\];/);
if (registryMatch2) {
  const registryContent2 = registryMatch2[1];
  const industryIds = Array.from(registryContent2.matchAll(/id:\s*['"]([^'"]+)['"]/g)).map(m => m[1]);
  const statusMatches = [...registryContent2.matchAll(/status:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('GAP ANALYSIS: INDUSTRY_REGISTRY vs Calculator Coverage');
  console.log('═'.repeat(80));
  console.log('');
  
  let gaps = 0;
  industryIds.forEach((id, idx) => {
    const status = statusMatches[idx] || 'unknown';
    const hasCoverage = coveredSlugs.has(id);
    const icon = hasCoverage ? '✅' : (status === 'active' ? '❌ MISSING' : '⚠️  PENDING');
    console.log(`  ${icon.padEnd(14)} ${id.padEnd(20)} [${status}]`);
    if (!hasCoverage && status === 'active') gaps++;
  });
  
  console.log('');
  if (gaps === 0) {
    console.log('✅ All ACTIVE industries have calculator coverage.');
  } else {
    console.log(`❌ ${gaps} active industry/industries MISSING dedicated calculators!`);
  }
}

console.log('\n');
console.log('═'.repeat(80));
console.log('NEXT STEPS:');
console.log('1. Run SQL query to get all use_case slugs from database');
console.log('2. Compare industry profiles vs TrueQuote Engine configs');
console.log('3. Check database field names for each industry');
console.log('4. Identify field name mismatches');
console.log('');
