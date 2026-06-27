import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const { extractCompanyName, isJunk } = await import('../server/services/opportunity-scraper.js');

const SHOULD_BE_NULL = [
  ['Big Tech',                     'Big Tech companies face antitrust scrutiny'],
  ["Massachusetts' 1.5-GW energy", "Massachusetts' 1.5-GW energy storage project moves forward"],
  ['Large-scale renewable energy',  'Large-scale renewable energy project starts construction'],
  ['Jamaica',                       'Jamaica expands its solar program'],
  ['Ontario',                       'Ontario announces new energy initiative'],
  ['School-Based Solar Energy',     'School-Based Solar Energy program launches this fall'],
  ['East Alabama factory',          'East Alabama factory expansion creates 200 jobs'],
  ['U.S. Factory Activity',         'U.S. Factory Activity rises in May report'],
  ['US Manufacturing',              'US Manufacturing output drops for third month'],
  ["Ohio's data center",            "Ohio's data center build announced by state"],
  ['Medical device maker',          'Medical device maker expands campus in Indiana'],
  ['Hennessey Goes Big',            'Hennessey Goes Big with $15 million factory expansion'],
  ['Factory of factories',          "Factory of factories: China's manufacturers join wave"],
  ['Massachusetts Energy Storage',  'Massachusetts Energy Storage initiative advances'],
  ['Tesla prepares',                'Tesla prepares to expand Giga Texas with new production plant'],
  ['Pine Island Google',            'Pine Island Google data center expansion approved'],
  ['1.5-GW Battery Project',        '1.5-GW Battery Project awarded in Texas'],
];

const SHOULD_PASS = [
  ['Radius Logistics',          'Radius Logistics opens new warehouse in Texas'],
  ['Radius Logistics (opening stripped)', 'Radius Logistics opening new facility in Texas'],
  ['FuelCell Energy',           'FuelCell Energy announces new project in Connecticut'],
  ['Georgia Power',             'Georgia Power utility expands grid infrastructure'],
  ['Fluence Energy',            'Fluence Energy wins 200MW storage contract'],
  ['Dominion Energy',           'Dominion Energy secures $500M in funding'],
  ['FST Logistics',             "Ohio's FST Logistics to expand its distribution center"],
  ['CATL',                      'CATL announces new battery gigafactory'],
  ['Xcel Energy',               'Xcel Energy starts solar project in Colorado'],
  ['Microsoft',                 'Microsoft opens new data center campus'],
  ['Tesla',                     'Tesla expands Gigafactory production capacity'],
  // Note: single-word companies like "Novva" pass via KNOWN_ENTITIES → scoreCompanyName=95 in scraper
];

console.log('\n── SHOULD BE NULL (junk) ──────────────────────────────────────');
let fail = 0;
for (const [label, title] of SHOULD_BE_NULL) {
  const r = extractCompanyName(title, '');
  const ok = r === null;
  console.log(`${ok ? '✅' : '❌'} null   [${label}] → ${JSON.stringify(r)}`);
  if (!ok) fail++;
}

console.log('\n── SHOULD PASS (valid companies) ──────────────────────────────');
for (const [label, title] of SHOULD_PASS) {
  const r = extractCompanyName(title, '');
  const ok = r !== null;
  console.log(`${ok ? '✅' : '❌'} pass   [${label}] → ${JSON.stringify(r)}`);
  if (!ok) fail++;
}

const total = SHOULD_BE_NULL.length + SHOULD_PASS.length;
console.log(`\nResult: ${total - fail}/${total} passed — ${fail} failure(s)\n`);
process.exit(fail > 0 ? 1 : 0);
// (test file)
