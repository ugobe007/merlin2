/**
 * Unit test for the 5-stage name extraction pipeline.
 * Run with: node scripts/_test_extraction.mjs
 */

// We need to test the internal functions. Since they're not exported,
// we'll test via the public scrapeOpportunities with a patched NEWS_SOURCES.

// Instead, inline-replicate the logic from the file to validate the regexes:
const COMPANY_SUFFIXES = new Set([
  'Inc', 'LLC', 'Ltd', 'Corp', 'Corporation', 'Company', 'Co', 'Group',
  'Industries', 'International', 'Solutions', 'Services', 'Technologies',
  'Tech', 'Energy', 'Power', 'Utilities', 'Utility', 'Solar', 'Battery',
  'Storage', 'Logistics', 'Automotive', 'Manufacturing', 'Partners',
  'Holdings', 'Ventures', 'Capital', 'Associates', 'Enterprises',
]);

const KNOWN_ENTITIES = new Set([
  'CATL', 'BYD', 'Tesla', 'Fluence', 'Sungrow', 'Huawei', 'Samsung SDI',
  'LG Energy', 'Origis Energy', 'Recurrent Energy', 'GridStor', 'Enel',
  'NextEra', 'AES', 'Orsted', 'ENGIE', 'Iberdrola', 'Eskom',
  'NYSERDA', 'Duke Energy', 'Xcel Energy', 'Dominion Energy', 'Entergy',
  'National Grid', 'Avangrid', 'Exelon', 'Constellation', 'PECO',
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Walmart',
  'Target', 'Home Depot', 'FedEx', 'UPS', 'Boeing', 'Ford', 'GM',
]);

const TRAILING_VERBS = /\s+(?:opens?|announces?|starts?|expands?|builds?|acquires?|launches?|plans?|seeks?|proposes?|vows?|brings?|inaugurates?|completes?|celebrates?|unveils?|selects?|awards?|breaks|signs?|closes?|reaches?|secures?|wins?|gets?|reveals?|receives?)\s*$/i;

const GENERIC_DESCRIPTOR_PATTERN = /^(?:global|major|leading|top|large|small|a\s+|the\s+|local|regional|national|international)\s+(?:energy|solar|power|battery|utility|grid|firm|company|companies|provider|developer|operator|owner|investor|player|giant)\b/i;

const SHORT_KNOWN = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel', 'BYD']);

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function cleanGoogleNewsTitle(title = '') {
  return stripHtml(title).replace(/\s+-\s+[^-]+$/u, '').trim();
}

function extractRawCandidate(title, description = '') {
  const cleanedTitle = cleanGoogleNewsTitle(title);
  const patterns = [
    /^([^:]+?)\s+(?:opens?|announces?|starts?|expands?|celebrates?|builds?|building|acquires?|launches?|plans?|seeks?|seeking|reopens?|proposes?|vows?|issues?|brings?|inaugurates?)\s/i,
    /^([^:]+?)\s+to\s+(?:open|build|expand|acquire|start|launch|invest|develop|meet|sign)\s/i,
    /^([^:]+?)\s+(?:is|are)\s+(?:opening|building|expanding|acquiring|developing)\s/i,
    /^([^:]+?)['\u2019]s\s+(?:new|latest|planned)\s/i,
    /^([^:]+?)['\u2019]s\s+/i,
    /^([^:\u2014\u2013-]+?)\s*[:\u2014\u2013-]\s/u,
  ];

  for (const text of [cleanedTitle, description]) {
    if (!text) continue;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (!match) continue;
      const stripped = match[1].replace(TRAILING_VERBS, '').trim();
      return stripped || match[1].trim();
    }
  }

  const words = cleanedTitle.split(/\s+/);
  for (let n = 3; n >= 2; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }
  if (words.length >= 1 && KNOWN_ENTITIES.has(words[0])) return words[0];
  return null;
}

function isJunk(name) {
  if (!name || typeof name !== 'string') return true;
  const t = name.trim();
  if (!t) return true;
  if (t.length < 4) return true;
  if (t.split(/\s+/).length > 7) return true;
  if (/[<>{}[\]\\|@]/.test(t)) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/,/.test(t)) return true;
  if (/^\d/.test(t)) return true;
  if (!/[a-zA-Z]/.test(t)) return true;
  if (t === t.toUpperCase() && t.length > 8 && !SHORT_KNOWN.has(t)) return true;
  if (!/[A-Z]/.test(t)) return true;
  if (GENERIC_DESCRIPTOR_PATTERN.test(t)) return true;
  if (/^(?:we|they|he|she|it|our|their|his|her|its|i|you|your)\b/i.test(t)) return true;
  if (/^(?:how|why|what|when|where|who|top|best|inside|even|bill|senate|house|republicans|lawmakers|white house|data center|going green)\s/i.test(t)) return true;
  if (/\b(?:seeks?|seeking|denies?|says?|files?|halts?|rewrites?|pledges?|responds?|aims?|forces?|push|probe|protects?|proposes?|vows?|grew|grow|grown|selling)\b/i.test(t)) return true;
  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;
  if (/\b(?:developer|developers|provider|providers|player|operator|operators)\b/i.test(t)) return true;
  if (/\b(?:completes|office|grew up|up here)\b/i.test(t)) return true;
  if (TRAILING_VERBS.test(t)) return true;
  if (/^new\s+/i.test(t) && !/\b(?:Energy|Power|Solar|Battery|Storage|Systems|Technologies|Tech|Industries|Group|Corp|Company|Co)\b/i.test(t)) return true;
  return false;
}

function extractCompanyName(title, description = '') {
  const raw = extractRawCandidate(title, description);
  if (!raw) return null;
  const candidate = raw.trim().replace(/\s+CEO$/i, '').replace(/^\W+|\W+$/g, '').replace(/\s+/g, ' ');
  return isJunk(candidate) ? null : candidate;
}

// ── Test cases ───────────────────────────────────────────────────────────────
const cases = [
  // [title, expectedResult]  null = should be filtered out
  ['Origis Energy Brings New Solar Farm Online',         'Origis Energy'],
  ['Recurrent Energy Inaugurates 200MW Project',         'Recurrent Energy'],
  ['Global energy giant announces expansion',            null],
  ['We grew up here and built a factory',                null],
  ['Energy Office Completes Microgrid Project',          null],
  ['Tesla Energy announces 500MW BESS project in Texas', 'Tesla Energy'],
  ['Amazon opens new fulfillment center in Ohio',        'Amazon'],
  ['Fluence Energy secures contract for grid storage',   'Fluence Energy'],
  ['Duke Energy is expanding its battery fleet',         'Duke Energy'],
  ['New solar developer expands grid',                   null],
  ['Major solar firm builds 300MW plant',                null],
  ['Constellation Energy plans new nuclear restart',     'Constellation Energy'],
  ['Nextracker opens second U.S. factory',               'Nextracker'],
  ['Leading energy company completes acquisition',       null],
];

let pass = 0;
let fail = 0;

for (const [title, expected] of cases) {
  const got = extractCompanyName(title);
  const ok = got === expected;
  const icon = ok ? '✓' : '✗';
  if (ok) pass++;
  else fail++;
  console.log(`${icon} "${title}"`);
  if (!ok) console.log(`    expected: ${JSON.stringify(expected)}`);
  console.log(`    got:      ${JSON.stringify(got)}`);
}

console.log(`\n${pass}/${cases.length} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
