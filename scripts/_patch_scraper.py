#!/usr/bin/env python3
"""Patch opportunity-scraper.js with 5-stage pipeline."""

filepath = '/Users/robertchristopher/merlin2/server/services/opportunity-scraper.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

assert 'cleanGoogleNewsTitle' in lines[128], f"Line 129 unexpected: {lines[128]!r}"
assert 'detectSignals' in lines[229], f"Line 230 unexpected: {lines[229]!r}"

HEAD = lines[:128]   # lines 1-128 (indices 0-127)
TAIL = lines[229:]   # lines 230-383 (index 229+)

NEW_BLOCK = r"""function cleanGoogleNewsTitle(title = '') {
  return stripHtml(title).replace(/\s+-\s+[^-]+$/u, '').trim();
}

// ── Stage 2: Ontologies ─────────────────────────────────────────────────────
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

// ── Stage 3: Logic Engine (raw candidate extraction) ────────────────────────
function extractRawCandidate(title, description) {
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
      // Strip trailing verbs that slipped into the capture group
      const stripped = match[1].replace(TRAILING_VERBS, '').trim();
      return stripped || match[1].trim();
    }
  }

  // Fallback: first 1-3 words of title if they contain a known suffix or entity
  const words = cleanedTitle.split(/\s+/);
  for (let n = 3; n >= 1; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }

  return null;
}

// ── Stage 4: Junk Filter ────────────────────────────────────────────────────
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
  if (/\b(?:completes|office|grew up|up here)\b/i.test(t)) return true;
  if (TRAILING_VERBS.test(t)) return true;
  if (/^new\s+/i.test(t) && !/\b(?:Energy|Power|Solar|Battery|Storage|Systems|Technologies|Tech|Industries|Group|Corp|Company|Co)\b/i.test(t)) return true;

  return false;
}

// ── Stage 5: Quality Engine ──────────────────────────────────────────────────
function scoreCompanyName(name) {
  if (isJunk(name)) return 0;
  let score = 40;

  if (KNOWN_ENTITIES.has(name)) return 95;

  if (name.length >= 8 && name.length <= 50) score += 15;

  const wordCount = name.split(/\s+/).length;
  if (wordCount >= 2) score += 15;
  if (wordCount >= 3) score += 5;

  if ([...COMPANY_SUFFIXES].some((s) => new RegExp(`\\b${s}\\b`, 'i').test(name))) score += 20;
  if (/[A-Z]/.test(name) && /[a-z]/.test(name)) score += 10;
  if (/\b(?:Energy|Power|Solar|Battery|Storage|Grid|Renewables|Utilities)\b/i.test(name)) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ── Thin compatibility wrappers ──────────────────────────────────────────────
function cleanCompanyName(rawName) {
  const candidate = (rawName || '').trim().replace(/\s+CEO$/i, '').replace(/^\W+|\W+$/g, '').replace(/\s+/g, ' ');
  return isJunk(candidate) ? null : candidate;
}

function hasBuyerLikeName(companyName) {
  if (!companyName) return false;
  if (KNOWN_ENTITIES.has(companyName)) return true;
  return [...COMPANY_SUFFIXES].some((s) => new RegExp(`\\b${s}\\b`, 'i').test(companyName));
}

function extractCompanyName(title, description) {
  const raw = extractRawCandidate(title, description);
  return cleanCompanyName(raw);
}

"""

new_lines = HEAD + [NEW_BLOCK] + TAIL

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

# Verify
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

checks = [
    'COMPANY_SUFFIXES',
    'KNOWN_ENTITIES',
    'TRAILING_VERBS',
    'GENERIC_DESCRIPTOR_PATTERN',
    'extractRawCandidate',
    'isJunk',
    'scoreCompanyName',
    'cleanCompanyName',
    'hasBuyerLikeName',
    'extractCompanyName',
    'detectSignals',
    'detectIndustry',
]

all_ok = True
for check in checks:
    if check not in content:
        print(f"MISSING: {check}")
        all_ok = False

if all_ok:
    print(f"SUCCESS — all {len(checks)} symbols present. File length: {len(content)} bytes.")
else:
    print("FAILED — some symbols missing.")
