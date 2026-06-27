import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const { extractCompanyName, isJunk, normalizeCompanyName } = await import('../server/services/opportunity-scraper.js');

// ── SHOULD_BE_NULL: extractCompanyName must return null ─────────────────────
// These are headlines where the "obvious noun phrase" is NOT a company name.
// The verb-anchored inference engine should reject them at classifyAsOrg().
const SHOULD_BE_NULL = [
  // Industry shorthands / descriptor phrases
  ['Big Tech',                     'Big Tech companies face antitrust scrutiny'],
  ['Large-scale renewable energy',  'Large-scale renewable energy project starts construction'],
  ['School-Based Solar Energy',     'School-Based Solar Energy program launches this fall'],
  // Bare geographic names (no org suffix)
  ['Jamaica',                       'Jamaica expands its solar program'],
  ['Ontario',                       'Ontario announces new energy initiative'],
  // Geographic possessive + category noun
  ["Massachusetts' 1.5-GW energy", "Massachusetts' 1.5-GW energy storage project moves forward"],
  ["Ohio's data center",            "Ohio's data center build announced by state"],
  // Role/occupation nouns masquerading as company names
  ['Medical device maker',          'Medical device maker expands campus in Indiana'],
  // Directional + location + category
  ['East Alabama factory',          'East Alabama factory expansion creates 200 jobs'],
  // National/generic sector activity
  ['U.S. Factory Activity',         'U.S. Factory Activity rises in May report'],
  ['US Manufacturing',              'US Manufacturing output drops for third month'],
  ['Massachusetts Energy Storage',  'Massachusetts Energy Storage initiative advances'],
  // Factory of factories — no clear company subject
  ['Factory of factories',          "Factory of factories: China's manufacturers join wave"],
  // Measurement-first headlines
  ['1.5-GW Battery Project',        '1.5-GW Battery Project awarded in Texas'],
];

// ── SHOULD_PASS: extractCompanyName must return a non-null company name ─────
// Note: the label shows the EXPECTED return value; actual string checked is r !== null.
const SHOULD_PASS = [
  // Standard "Company opens/launches/announces" headlines
  ['Radius Logistics',                'Radius Logistics opens new warehouse in Texas'],
  ['Radius Logistics (opening)',      'Radius Logistics opening new facility in Texas'],
  ['FuelCell Energy',                 'FuelCell Energy announces new project in Connecticut'],
  ['Fluence Energy',                  'Fluence Energy wins 200MW storage contract'],
  ['Dominion Energy',                 'Dominion Energy secures $500M in funding'],
  ['Xcel Energy',                     'Xcel Energy starts solar project in Colorado'],
  ['Microsoft',                       'Microsoft opens new data center campus'],
  ['Tesla',                           'Tesla expands Gigafactory production capacity'],
  // Correctly strips geographic possessive prefix
  ['FST Logistics (from Ohio\'s ...)', "Ohio's FST Logistics to expand its distribution center"],
  // State + corporate suffix = valid company name
  ['Georgia Power',                   'Georgia Power utility expands grid infrastructure'],
  // Known single-word entities
  ['CATL',                            'CATL announces new battery gigafactory'],
  // New engine: properly separates subject from verb phrase
  ['Tesla (from "Tesla prepares")',   'Tesla prepares to expand Giga Texas with new production plant'],
  // Energy-domain org suffixes
  ['Ameresco',                        'Ameresco selected for $40M solar project'],
  ['Invenergy',                       'Invenergy secures financing for new wind farm'],
  // New engine correctly extracts subject from verb-anchored headline
  ['Hennessey (from "Goes Big" title)', 'Hennessey Goes Big with $15 million factory expansion'],
  // Geographic + known brand (returns "Google", tested separately below)
  ['Google (from "Pine Island Google")', 'Pine Island Google data center expansion approved'],
];

console.log('\n── SHOULD_BE_NULL (junk / not a company name) ─────────────────');
let fail = 0;
for (const [label, title] of SHOULD_BE_NULL) {
  const r = extractCompanyName(title, '');
  const ok = r === null;
  console.log(`${ok ? '✅' : '❌'} null   [${label}] → ${JSON.stringify(r)}`);
  if (!ok) fail++;
}

console.log('\n── SHOULD_PASS (valid company extracted) ───────────────────────');
for (const [label, title] of SHOULD_PASS) {
  const r = extractCompanyName(title, '');
  const ok = r !== null;
  console.log(`${ok ? '✅' : '❌'} pass   [${label}] → ${JSON.stringify(r)}`);
  if (!ok) fail++;
}

const total = SHOULD_BE_NULL.length + SHOULD_PASS.length;
console.log(`\nResult: ${total - fail}/${total} passed — ${fail} failure(s)\n`);

// ── NORMALIZE: stored DB names that need cleaning ────────────────────────────
// normalizeCompanyName(storedName) should return the canonical cleaned form.
const NORMALIZE_CASES = [
  // [storedDbName, expectedCanonical]
  ['Powerbank Corporation Achieves',  'Powerbank Corporation'],
  ["Ohio's FST Logistics",            'FST Logistics'],
  ['Radius Logistics opening',        'Radius Logistics'],
  ['REC Solar CEO announces',         'REC Solar'],
  ['Crane Worldwide Logistics expands', 'Crane Worldwide Logistics'],
  ['Duke Energy secures',             'Duke Energy'],
];

console.log('── NORMALIZE (stored name → canonical) ────────────────────────');
let nfail = 0;
for (const [stored, expected] of NORMALIZE_CASES) {
  const r = normalizeCompanyName(stored);
  const ok = r === expected;
  console.log(`${ok ? '✅' : '❌'} [${stored}] → ${JSON.stringify(r)} (expected ${JSON.stringify(expected)})`);
  if (!ok) nfail++;
}
const ntotal = NORMALIZE_CASES.length;
console.log(`\nNormalize: ${ntotal - nfail}/${ntotal} passed — ${nfail} failure(s)\n`);

process.exit((fail > 0 || nfail > 0) ? 1 : 0);
