import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const NEWS_SOURCES = [
  {
    name: 'Google News - Business Construction',
    url: 'https://news.google.com/rss/search?q=business+construction+opening&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News - Factory Expansion',
    url: 'https://news.google.com/rss/search?q=factory+expansion+manufacturing&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News - Data Center',
    url: 'https://news.google.com/rss/search?q=data+center+opening+construction&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News - Warehouse Logistics',
    url: 'https://news.google.com/rss/search?q=warehouse+logistics+opening&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News - Energy RFQ RFP',
    url: 'https://news.google.com/rss/search?q=(RFQ+OR+RFP+OR+%22request+for+proposal%22)+(%22battery+storage%22+OR+solar+OR+microgrid+OR+%22energy+storage%22)&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News - Commercial Energy Projects',
    url: 'https://news.google.com/rss/search?q=(%22energy+project%22+OR+%22solar+project%22+OR+%22battery+storage+project%22+OR+microgrid)+(%22commercial%22+OR+facility+OR+campus+OR+plant)&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Google News - Utility Rate Exposure',
    url: 'https://news.google.com/rss/search?q=(%22high+electricity+rates%22+OR+%22utility+rate+increase%22+OR+%22demand+charges%22+OR+%22power+costs%22)+(%22data+center%22+OR+manufacturing+OR+warehouse+OR+hospital+OR+hotel)&hl=en-US&gl=US&ceid=US:en',
  },
];

const SIGNAL_KEYWORDS = {
  construction: ['construction', 'building', 'under construction', 'groundbreaking'],
  expansion: ['expansion', 'expanding', 'expand', 'growing', 'growth'],
  new_opening: ['opening', 'opened', 'new facility', 'new location', 'launching'],
  funding: ['funding', 'investment', 'raised', 'capital', 'financing'],
  acquisition: ['acquired', 'acquisition', 'merger', 'purchase'],
  sustainability_initiative: ['sustainability', 'renewable', 'green', 'carbon neutral', 'net zero'],
  energy_upgrade: ['energy efficiency', 'power upgrade', 'electrical', 'energy management'],
  facility_upgrade: ['modernization', 'renovation', 'upgrade', 'retrofit'],
  rfq: [
    'rfq',
    'rfp',
    'request for quote',
    'request for quotation',
    'request for proposal',
    'invitation to bid',
    'bid solicitation',
    'seeking proposals',
    'procurement',
    'tender',
  ],
  energy_project: [
    'energy project',
    'battery storage project',
    'bess project',
    'solar project',
    'microgrid project',
    'onsite power',
    'distributed energy',
    'energy resilience',
    'backup power project',
    'peak shaving',
    'demand response',
  ],
  high_utility_exposure: [
    'high electricity rates',
    'utility rate increase',
    'rising utility costs',
    'power costs',
    'energy costs',
    'electricity costs',
    'demand charges',
    'peak demand charges',
    'time-of-use rates',
    'tou rates',
    'grid constraints',
    'power shortage',
  ],
};

const INDUSTRY_KEYWORDS = {
  data_center: ['data center', 'server farm', 'cloud infrastructure', 'colocation'],
  manufacturing: ['manufacturing', 'factory', 'plant', 'production facility', 'industrial facility'],
  logistics: ['warehouse', 'distribution center', 'logistics', 'fulfillment center'],
  hospitality: ['hotel', 'resort', 'restaurant', 'hospitality'],
  healthcare: ['hospital', 'medical center', 'healthcare facility', 'clinic'],
  retail: ['retail', 'shopping center', 'supermarket', 'store', 'grocery'],
  education: ['school', 'university', 'campus', 'education', 'college'],
  automotive: ['automotive', 'car manufacturing', 'assembly plant', 'dealership', 'ev charging'],
  other: [],
};

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 MerlinEnergyBot/1.0 (+https://merlinenergy.net)',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
  },
});

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for opportunity scraper');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanGoogleNewsTitle(title = '') {
  return stripHtml(title).replace(/\s+-\s+[^-]+$/u, '').trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// ONTOLOGICAL INFERENCE ENGINE v2
// ═══════════════════════════════════════════════════════════════════════════
//
// PHILOSOPHY: Headlines follow a Subject → VERB → Object sentence model.
//   The VERB is the anchor point.  Everything BEFORE it = subject candidate.
//   The subject must classify as a named ORG — not a GEO location, DESC
//   phrase, or sentence fragment — before we accept it as a company name.
//
// ONTOLOGIES USED:
//   VERB_BOUNDARY  — action verbs marking the subject / predicate split
//   GEO_NAMES      — geographic names that cannot be company names alone
//   DESC_ONTOLOGY  — descriptor / metric / category patterns (not an org)
//   ORG_SUFFIX     — linguistic markers that positively identify an org
//   KNOWN_ORGS     — curated set of validated company names
//
// INFERENCE FLOW  inferCompanyName(title):
//   1. Find first verb → extract subject to the LEFT of it
//   2. Strip geographic possessive prefix ("Ohio's X" → "X")
//   3. classifyAsOrg(subject) — strict NER-like validation
//   4. If strict pass fails, scan subject for embedded known org
//   5. Fallback passes: possessive pattern, colon separator, word scan
//
// ═══════════════════════════════════════════════════════════════════════════

// ── 2a. VERB ONTOLOGY ────────────────────────────────────────────────────────
// The first verb that matches marks the predicate boundary.
// "to <verb>" constructs are listed first so they beat bare verb matches
// (regex returns the leftmost match, so "to expand" at pos 14 beats
//  "expand" alone at pos 17).

const VERB_BOUNDARY = new RegExp('\\b(?:' + [
  // Infinitive constructs (leftmost priority)
  'to\\s+(?:open|build|launch|expand|install|deploy|develop|construct|start|begin|invest|acquire)',
  'will\\s+(?:open|build|launch|expand|install|deploy|develop|construct|start|invest)',
  'is\\s+(?:set|ready|expected|planning|moving|opening|building|launching)',
  // Procurement / contracting
  'award(?:ed|s|ing)?', 'select(?:ed|s|ing)?', 'sign(?:ed|s|ing)?',
  'approv(?:ed|es?|ing)', 'authoriz(?:ed|es?|ing)',
  'procur(?:ed|es?|ing)', 'purchas(?:ed|es?|ing)', 'acquir(?:ed|es?|ing)',
  'buy(?:s|ing)', 'order(?:ed|s|ing)?',
  'solicit(?:ed|s|ing)?', 'tender(?:ed|s|ing)?', 'bid(?:s|ding)?',
  // Construction / deployment
  'breaks?\\s+ground', 'groundbreak(?:s|ing)?',
  'inaugurat(?:ed|es?|ing)', 'commission(?:ed|s|ing)?',
  'launch(?:ed|es?|ing)', 'open(?:ed|s|ing)',
  'deploy(?:ed|s|ing)', 'install(?:ed|s|ing)',
  'build(?:s|ing)', 'construct(?:ed|s|ing)',
  'develop(?:ed|s|ing)', 'complet(?:ed|es?|ing)', 'deliver(?:ed|s|ing)',
  'start(?:ed|s|ing)', 'begin(?:s|ning)',
  // Announcement / planning
  'announc(?:ed|es?|ing)', 'unveil(?:ed|s|ing)', 'reveal(?:ed|s|ing)',
  'propos(?:ed|es?|ing)', 'plan(?:ned|s|ning)',
  'seek(?:s|ing)', 'aim(?:s|ing)', 'fil(?:ed|es?|ing)', 'submit(?:s|ted|ting)',
  // Expansion / growth
  'expand(?:ed|s|ing)', 'grow(?:s|ing)', 'scal(?:ed|es?|ing)',
  'doubl(?:ed|es?|ing)', 'tripl(?:ed|es?|ing)', 'add(?:s|ing)',
  // Financial
  'rais(?:ed|es?|ing)', 'secur(?:ed|es?|ing)', 'fund(?:s|ing)',
  'invest(?:ed|s|ing)', 'receiv(?:ed|es?|ing)', 'win(?:s|ning)', 'clos(?:ed|es?|ing)',
  // Action verbs that mark the predicate boundary even if not procurement
  'goes', 'going', 'prepar(?:ed|es?|ing)', 'target(?:s|ing)',
  'warn(?:s|ing)', 'fac(?:ed|es?|ing)', 'fight(?:s|ing)',
  'mov(?:ed|es?|ing)', 'shift(?:s|ing)', 'turn(?:s|ing)',
  'ey(?:es?|ing)', 'bet(?:s|ting)', 'hit(?:s|ting)',
  'cut(?:s|ting)', 'drop(?:s|ping)', 'surg(?:es?|ing)', 'push(?:es?|ing)',
  'rac(?:es?|ing)',
].join('|') + ')\\b', 'i');

// ── 2b. GEO ONTOLOGY ─────────────────────────────────────────────────────────
// Named geographic entities.  A subject that IS ONLY a geo name → rejected.
// Compounds with org suffixes ("Georgia Power") pass via ORG_SUFFIX check first.

const GEO_NAMES = new Set([
  // ─ US States ─
  'alabama','alaska','arizona','arkansas','california','colorado',
  'connecticut','delaware','florida','georgia','hawaii','idaho',
  'illinois','indiana','iowa','kansas','kentucky','louisiana',
  'maine','maryland','massachusetts','michigan','minnesota',
  'mississippi','missouri','montana','nebraska','nevada',
  'new hampshire','new jersey','new mexico','new york',
  'north carolina','north dakota','ohio','oklahoma','oregon',
  'pennsylvania','rhode island','south carolina','south dakota',
  'tennessee','texas','utah','vermont','virginia',
  'washington','west virginia','wisconsin','wyoming',
  'carolina','dakota','hampshire','jersey',
  // ─ Major US Cities ─
  'new york city','los angeles','chicago','houston','phoenix',
  'philadelphia','san antonio','san diego','dallas','san jose',
  'austin','jacksonville','fort worth','columbus','charlotte',
  'indianapolis','san francisco','seattle','denver','washington dc',
  'nashville','oklahoma city','el paso','boston','portland',
  'las vegas','memphis','louisville','baltimore','milwaukee',
  'albuquerque','tucson','fresno','sacramento','mesa','kansas city',
  'atlanta','omaha','colorado springs','raleigh','long beach',
  'virginia beach','minneapolis','tampa','new orleans','honolulu',
  'anaheim','lexington','stockton','corpus christi','riverside',
  'detroit','cleveland','pittsburgh','miami','orlando',
  // ─ Countries ─
  'china','india','usa','uk','germany','france','italy','spain',
  'japan','korea','australia','canada','mexico','brazil','russia',
  'oman','uae','europe','africa','asia','middle east',
  'philippines','indonesia','vietnam','thailand','malaysia','singapore',
  'kuwait','qatar','bahrain','jordan','egypt','nigeria','ghana',
  'pakistan','bangladesh','sri lanka','nepal','turkey','israel',
  'sweden','norway','denmark','finland','netherlands','belgium',
  'switzerland','austria','poland','czechia','portugal','greece',
  'ireland','scotland','wales','england','new zealand','south africa',
  'argentina','chile','colombia','peru','venezuela',
  'saudi arabia','el salvador','costa rica',
  // ─ Caribbean / Central America ─
  'jamaica','trinidad','barbados','haiti','cuba','bahamas',
  'panama','honduras','guatemala','nicaragua',
  // ─ Canadian Provinces ─
  'ontario','alberta','quebec','british columbia','manitoba',
  'saskatchewan','nova scotia','new brunswick','newfoundland',
  // ─ Geographic regions ─
  'northeast','northwest','southeast','southwest','midwest',
  'new england','great plains','gulf coast','pacific northwest',
  'mountain west','deep south','sun belt',
  // ─ Other commonly misextracted geo phrases ─
  'pine island','pine ridge','pine valley',
]);

// ── 2c. DESCRIPTOR ONTOLOGY ──────────────────────────────────────────────────
// Patterns that classify a phrase as a description/metric/category, not an org.
// NOTE: ORG_SUFFIX check runs BEFORE these to protect "National Battery Corp".

const DESC_ONTOLOGY = [
  // Scale / basis: "large-scale", "utility-scale", "school-based"
  /^(?:large|small|medium|utility|grid|commercial|industrial|community|school|hospital|facility|residential|municipal|federal|national|state|local|regional|global)[-\s](?:scale|based|wide|grade|level|owned|operated|funded|led|sponsored)\b/i,
  // "Big X" industry shorthands: "Big Tech", "Big Oil"
  /^big\s+(?:tech|oil|gas|banks?|auto|pharma|energy|solar|retail|box|four|three|five)\b/i,
  // National/US + generic sector noun
  /^(?:u\.?s\.?|uk|eu|american|federal|national|global)\s+(?:factory|factories|manufacturing|energy|storage|solar|power|grid|market|activity|output|production|industry|sector|logistics|utility|utilities)\b/i,
  // Embedded energy/power measurements: "1.5-GW", "200 MW"
  /\b\d+(?:\.\d+)?[-\s]?(?:GW|MW|kW|KW|MWh|kWh|GWh|TWh)\b/i,
  // Renewable adjective + energy noun
  /^(?:renewable|clean|green|sustainable|offshore|onshore|distributed|grid-scale|utility-scale|community|rooftop|floating|agrivoltaic|bifacial)\s+(?:energy|power|solar|wind|battery|storage|hydrogen)\b/i,
  // Category nouns as subject
  /^(?:data\s*center|factory|factories|facility|facilities|plant|warehouse|campus|hospital|school|university|government|utility|utilities|public|private)\b/i,
  // Construction / event / report nouns
  /^(?:construction|groundbreaking|expansion|opening|development|initiative|program|project|activity|activities|sector|market|industry|output|report|analysis|update|alert|study|research|news|commentary)\b/i,
  // Ends with role / occupation noun (not an org identifier)
  /\b(?:makers?|providers?|developers?|operators?|players?|builders?|manufacturers?|owners?|investors?|policymakers?|stakeholders?|workforce|activity|activities|output)\s*$/i,
  // Directional prefix + location + category noun
  /^(?:east|west|north|south|central|greater|upper|lower|inner|outer)\s+[a-z]+\s+(?:factory|facility|campus|plant|center|area|region|county|district|zone|project|logistics)\b/i,
];

// ── 2d. ORG ONTOLOGY ─────────────────────────────────────────────────────────
// Positive markers of a named organization.

const ORG_SUFFIX = /\b(?:Inc\.?|LLC|Ltd\.?|Corp(?:oration)?\.?|Company|Co\.?|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Power|Electric|Gas|Utilities?|Utility|Solar|Battery|Storage|Logistics|Automotive|Manufacturing|Partners|Holdings|Ventures|Capital|Associates|Enterprises|Systems|Networks|Innovation|Resources|Properties|Renewables?|Financial|Authority|Institute|Foundation|Works?|Dynamics|Infrastructure|Mobility)\b/i;

// Per-word form of ORG_SUFFIX — used to find the rightmost suffix token in a phrase
const _ORG_WORD_RE = /^(?:Inc\.?|LLC|Ltd\.?|Corp(?:oration)?\.?|Company|Co\.?|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Power|Electric|Gas|Utilities?|Utility|Solar|Battery|Storage|Logistics|Automotive|Manufacturing|Partners|Holdings|Ventures|Capital|Associates|Enterprises|Systems|Networks|Innovation|Resources|Properties|Renewables?|Financial|Authority|Institute|Foundation|Works?|Dynamics|Infrastructure|Mobility)\.?$/i;

/**
 * Trim trailing words that follow the rightmost ORG_SUFFIX token.
 * "Powerbank Corporation Achieves" → "Powerbank Corporation"
 * "Radius Logistics opening"       → "Radius Logistics"
 * "REC Solar CEO announces"         → "REC Solar"
 */
function _trimToOrgSuffix(text) {
  const words = text.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    if (_ORG_WORD_RE.test(words[i])) {
      return words.slice(0, i + 1).join(' ');
    }
  }
  return text; // no suffix found, return as-is
}

// Short uppercase org tokens (would fail length check without special casing)
const SHORT_KNOWN = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel', 'BYD', 'Eos', 'Stem', 'Amp', 'RWE']);

// Curated known company names (no standard suffix required)
const KNOWN_ORGS = new Set([
  'CATL', 'BYD', 'Tesla', 'Fluence', 'Sungrow', 'Huawei', 'Samsung SDI',
  'LG Energy', 'Origis Energy', 'Recurrent Energy', 'GridStor', 'Enel',
  'NextEra', 'AES', 'Orsted', 'ENGIE', 'Iberdrola', 'Eskom',
  'NYSERDA', 'Duke Energy', 'Xcel Energy', 'Dominion Energy', 'Entergy',
  'National Grid', 'Avangrid', 'Exelon', 'Constellation', 'PECO',
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Walmart',
  'Target', 'Home Depot', 'FedEx', 'UPS', 'Boeing', 'Ford', 'GM',
  'Novva', 'Pivot', 'Crusoe', 'Lancium', 'Nautilus', 'Leviathan',
  'Enchanted', 'Powin', 'Eos', 'Stem', 'Convergent', 'Amp', 'Ameresco',
  'Greenbacker', 'Altus', 'Clearway', 'Invenergy', 'RWE', 'Ormat',
]);

// Product/technology acronyms that look like company names but aren't
const NOT_A_COMPANY_ACRONYM = new Set(['BESS', 'PV', 'EV', 'DER', 'VPP', 'BTM', 'FTM', 'ISO', 'RTO', 'PPA', 'REC', 'ITC', 'PTC', 'RFP', 'RFQ']);

// ── 2e. CORE INFERENCE FUNCTIONS ─────────────────────────────────────────────

/**
 * Hard-reject patterns — always a descriptor even when an ORG_SUFFIX word
 * appears inside the phrase.  These run BEFORE ORG_SUFFIX to prevent
 * "1.5-GW Battery Project" or "Big Tech companies" from being accepted
 * just because "Battery" / "Tech" are in the suffix list.
 */
function _isHardDescriptor(text) {
  return (
    // Starts with an energy/power measurement: "1.5-GW Battery", "200 MW Storage"
    /^\d+(?:\.\d+)?[-\s]?(?:GW|MW|kW|KW|MWh|kWh|GWh|TWh)\b/i.test(text) ||
    // "Big Tech / Big Oil / Big Auto" — industry category shorthands
    /^big\s+(?:tech|oil|gas|banks?|auto|pharma|energy|solar|retail|box)\b/i.test(text) ||
    // US/American + generic sector noun (e.g. "US Manufacturing output")
    /^(?:u\.?s\.?|uk|eu|american)\s+(?:manufacturing|factory|factories|output|activity|market)\b/i.test(text) ||
    // Scale/basis descriptors: "school-based", "large-scale", "utility-scale"
    /^(?:large|small|medium|utility|grid|school|hospital|community|industrial|commercial)[-\s](?:scale|based)\b/i.test(text) ||
    // Renewable adjective + category noun: "school-based solar energy program"
    /^school[-\s]based\s+/i.test(text)
  );
}

/**
 * Strict NER-like classifier: is this EXACT phrase a named organization?
 *
 * Inference order (ACCEPT first, then REJECT):
 *   1. Known org / short-known exact match → ACCEPT  (no further checks)
 *   2. Hard-reject descriptors → REJECT  (measurement, "Big Tech", etc.;
 *      run before ORG_SUFFIX so "1.5-GW Battery Project" is not accepted
 *      just because "Battery" appears in the ORG_SUFFIX list)
 *   3. Has ORG_SUFFIX marker → ACCEPT
 *   4. Strip geo possessive prefix, recheck 1–3
 *   5. Geographic entity → REJECT
 *   6. Descriptor phrase (full DESC_ONTOLOGY) → REJECT
 *   7. Starts lowercase / no uppercase → REJECT
 *   8. Contains predicate-only verbs → REJECT
 *   9. Modal verbs / article / pronoun openers → REJECT
 *  10. 4+ words without org suffix → REJECT
 *  11. 2–3 word proper noun with non-category last word → ACCEPT
 *  12. Single word: camelCase brand or 2–5 char acronym → ACCEPT
 *
 * @param {string} phrase
 * @returns {string|null}
 */
function classifyAsOrg(phrase) {
  if (!phrase || typeof phrase !== 'string') return null;
  let t = phrase.trim().replace(/[,;.]+$/, '').replace(/\s+/g, ' ').trim();
  if (!t || t.length < 2) return null;

  // 1. Known org — immediate accept (no further checks needed)
  if (KNOWN_ORGS.has(t) || SHORT_KNOWN.has(t)) return t;

  // 2. Hard-reject descriptors — always a descriptor even if an ORG_SUFFIX word appears.
  if (_isHardDescriptor(t)) return null;

  // 3. Strip geographic possessive prefix BEFORE ORG_SUFFIX
  //    so "Ohio's FST Logistics" → "FST Logistics", not "Ohio's FST Logistics"
  const stripped = _stripGeoPossessive(t);
  if (stripped !== t) {
    t = stripped.trim();
    if (!t || t.length < 2) return null;
    if (KNOWN_ORGS.has(t) || SHORT_KNOWN.has(t)) return t;
    if (_isHardDescriptor(t)) return null;
  }

  // 4. ORG_SUFFIX match — accept as named org, trimmed to the suffix word
  //    "Powerbank Corporation Achieves" → "Powerbank Corporation"
  //    "Radius Logistics opening"       → "Radius Logistics"
  //    Protects "Georgia Power", "FST Logistics", "National Battery Corp"
  if (ORG_SUFFIX.test(t)) return _trimToOrgSuffix(t);

  // 5. Geographic entity → reject
  if (_isGeoEntity(t)) return null;

  // 6. Descriptor phrase (full DESC_ONTOLOGY) → reject
  if (_isDescriptor(t)) return null;

  // 7. No uppercase letter / starts lowercase → not a proper noun
  if (!/[A-Z]/.test(t) || /^[a-z]/.test(t)) return null;

  // 8. Contains predicate-only action verbs → sentence fragment, not a subject
  if (/\b(?:goes|going|rolls?|rolling|doubles|prepares?|targets?|warns?|fac(?:es?|ing)|fights?|surg(?:es?|ing)|rac(?:es?|ing)|cut(?:s|ting)|drop(?:s|ping)|ey(?:es?|ing)|bet(?:s|ting)|hit(?:s|ting)|makes?|gets?|takes?|puts?|sets?|keeps?|holds?|leads?|shows?|turns?|gives?|seeks?|needs?|rises?|falls?|push(?:es?|ing)|shift(?:s|ing)|fight(?:s|ing)|mov(?:es?|ing)|struggling|slashing|forcing|pledging|finding)\b/i.test(t)) return null;

  // 9. Modal verbs / pronouns / articles → headline fragment
  if (/\b(?:would|could|should|may|might|must|shall)\b/i.test(t)) return null;
  if (/^(?:the|a|an|this|these|those|we|they|he|she|it|i|you|our|their)\b/i.test(t)) return null;

  const words = t.split(/\s+/);
  const wordCount = words.length;

  // 10. 4+ words without ORG_SUFFIX → almost certainly a sentence fragment
  if (wordCount >= 4) return null;

  // 11. 2–3 word proper noun (Title Case, last word not a generic category noun)
  if (wordCount >= 2 && /^[A-Z]/.test(t)) {
    const lastWord = words[wordCount - 1];
    const isCategoryNoun = /^(?:activity|activities|market|sector|industry|program|initiative|project|zone|area|region|county|district|report|update|news|analysis|study|alert|center|factory|facility|plant|campaign|committee|coalition|workforce|policymakers?|makers?|providers?|developers?|operators?|players?|builders?|manufacturers?|owners?|investors?|output|story|release)\s*$/i.test(lastWord);
    if (!isCategoryNoun) return t;
    return null;
  }

  // 12. Single-word rules (geo + desc already filtered above)
  if (wordCount === 1) {
    if (NOT_A_COMPANY_ACRONYM.has(t.toUpperCase())) return null;
    // All-caps acronym 2-8 chars: "PECO", "ABB", "AES", "NYCEDC", "ENGIE"
    if (/^[A-Z]{2,8}$/.test(t)) return t;
    // camelCase or alphanumeric brand: "FluxPower", "L3Harris", "NovaBMS"
    if (/^[A-Z][a-zA-Z0-9]*[A-Z]/.test(t) && t.length >= 4) return t;
    // Title Case proper noun (3+ chars): "Toyota", "Enbridge", "Maersk", "Hadrian"
    // Geographic and descriptor filters above already rejected geo/category nouns.
    if (/^[A-Z][a-z]{2,}$/.test(t)) return t;
    return null;
  }

  return null;
}

/**
 * Check if a phrase is a geographic entity.
 * Compounds with org suffixes ("Georgia Power") pass — ORG_SUFFIX check in
 * classifyAsOrg runs first and returns early before this is called.
 */
function _isGeoEntity(text) {
  const lower = text.toLowerCase().replace(/[''\u2019]s?\s*$/, '').trim();
  // Exact full-phrase match
  if (GEO_NAMES.has(lower)) return true;
  // "State/City of X"
  if (/^(?:state|city|county|town|village|province|region|district)\s+of\s+/i.test(text)) return true;
  // Single-word geo name
  const words = text.split(/\s+/);
  if (words.length === 1 && GEO_NAMES.has(lower)) return true;
  // Multi-word phrase starting with a geo name (not guarded by org suffix)
  if (words.length > 1 && !ORG_SUFFIX.test(text)) {
    const lowerWords = lower.split(/\s+/);
    for (let n = Math.min(lowerWords.length - 1, 3); n >= 1; n--) {
      const prefix = lowerWords.slice(0, n).join(' ');
      if (GEO_NAMES.has(prefix)) return true;
    }
  }
  return false;
}

/** Check if a phrase is a descriptor (adjective, metric, category noun). */
function _isDescriptor(text) {
  return DESC_ONTOLOGY.some((p) => p.test(text));
}

/**
 * Strip a geographic possessive prefix.
 * "Ohio's FST Logistics" → "FST Logistics"
 * "New York's ConEd" → "New York" is geo → "ConEd"
 */
function _stripGeoPossessive(text) {
  const m = text.match(/^((?:[A-Z][a-zA-Z]+)(?:\s+[A-Z][a-zA-Z]+)?)['''\u2019]s?\s+(.+)/u);
  if (!m) return text;
  if (GEO_NAMES.has(m[1].toLowerCase())) return m[2].trim();
  return text;
}

/**
 * Scan a phrase for an embedded known org name.
 * "Pine Island Google" → "Google" (length ≥ 4)
 * Used ONLY in inferCompanyName, not in the strict classifyAsOrg.
 */
function _scanForKnownOrg(text) {
  for (const k of KNOWN_ORGS) {
    if (k.length >= 4 && text.includes(k)) return k;
  }
  for (const k of SHORT_KNOWN) {
    if (text.split(/\s+/).includes(k)) return k;
  }
  return null;
}

// ── 2f. VERB-ANCHORED INFERENCE ENGINE ───────────────────────────────────────

/**
 * Infer a company name from a headline using ontological inference.
 *
 * Extraction passes (in order):
 *   1. VERB BOUNDARY — find first action verb, take subject to the left
 *      "Tesla announces new Gigafactory" → verb "announces" → subject "Tesla"
 *   2. POSSESSIVE — "Company's new facility" → extract possessor
 *   3. SEPARATOR  — "Company: headline" → extract before colon/dash
 *   4. KNOWN SCAN — scan first 1-3 words for a known org name
 *   5. DESCRIPTION fallback — repeat Pass 1 on description text
 *
 * Each pass tries classifyAsOrg() (strict), then _scanForKnownOrg() (lenient).
 */
function inferCompanyName(title, description) {
  const text = cleanGoogleNewsTitle(title || '');

  // ── Pass 1: Verb-boundary ─────────────────────────────────────────────────
  const verbMatch = text.match(VERB_BOUNDARY);
  if (verbMatch && verbMatch.index > 2) {
    const raw = _cleanSubject(text.slice(0, verbMatch.index));
    const stripped = _stripGeoPossessive(raw);
    const classified = classifyAsOrg(stripped);
    if (classified) return classified;
    const scanned = _scanForKnownOrg(stripped);
    if (scanned) return scanned;
  }

  // ── Pass 2: Possessive ────────────────────────────────────────────────────
  const posMatch = text.match(/^(.+?)['''\u2019]s?\s+(?:new|latest|planned|first|second|\d|proposed|announced)\s/i);
  if (posMatch) {
    const stripped = _stripGeoPossessive(posMatch[1].trim());
    const classified = classifyAsOrg(stripped);
    if (classified) return classified;
  }

  // ── Pass 3: Separator ─────────────────────────────────────────────────────
  const sepMatch = text.match(/^(.+?)\s*[:—–]\s/u);
  if (sepMatch) {
    const stripped = _stripGeoPossessive(sepMatch[1].trim());
    const classified = classifyAsOrg(stripped);
    if (classified) return classified;
  }

  // ── Pass 4: Known org in first 1-3 words ─────────────────────────────────
  const words = text.split(/\s+/);
  for (let n = 3; n >= 1; n--) {
    const chunk = words.slice(0, n).join(' ');
    if (KNOWN_ORGS.has(chunk) || SHORT_KNOWN.has(chunk)) return chunk;
  }

  // ── Pass 5: Retry on description text ────────────────────────────────────
  if (description) {
    const desc = stripHtml(description).slice(0, 200);
    const dMatch = desc.match(VERB_BOUNDARY);
    if (dMatch && dMatch.index > 2) {
      const raw = _cleanSubject(desc.slice(0, dMatch.index));
      const classified = classifyAsOrg(_stripGeoPossessive(raw));
      if (classified) return classified;
    }
  }

  return null;
}

/** Strip trailing prepositions / articles from an extracted subject. */
function _cleanSubject(text) {
  return text
    .replace(/[,;.]+$/, '')
    .replace(/\s+(?:to|of|in|for|at|by|on|the|a|an)\s*$/i, '')
    .trim();
}

// ── 2g. QUALITY SCORER ───────────────────────────────────────────────────────

export function scoreCompanyName(name) {
  if (!name || typeof name !== 'string') return 0;
  const t = name.trim();
  if (!classifyAsOrg(t)) return 0;

  if (KNOWN_ORGS.has(t) || SHORT_KNOWN.has(t)) return 95;

  let score = 40;
  if (t.length >= 8 && t.length <= 50) score += 15;

  const wordCount = t.split(/\s+/).length;
  if (wordCount >= 2) score += 15;
  if (wordCount >= 3) score += 5;

  if (ORG_SUFFIX.test(t)) score += 20;
  if (/[A-Z]/.test(t) && /[a-z]/.test(t)) score += 10;
  if (/\b(?:Energy|Power|Solar|Battery|Storage|Grid|Renewables?|Utilities?)\b/i.test(t)) score += 5;

  return Math.max(0, Math.min(100, score));
}

// ── 2h. PUBLIC INTERFACE ─────────────────────────────────────────────────────

/** True if the name looks like it belongs to a real buyer entity. */
function hasBuyerLikeName(companyName) {
  if (!companyName) return false;
  if (KNOWN_ORGS.has(companyName) || SHORT_KNOWN.has(companyName)) return true;
  return ORG_SUFFIX.test(companyName);
}

/**
 * Primary extraction entry point.
 * Uses verb-anchored ontological inference to extract a company name.
 */
export function extractCompanyName(title, description) {
  return inferCompanyName(title, description);
}

/**
 * Returns true when the string is NOT a valid organization name.
 * Powered by classifyAsOrg() — replaces the old ad-hoc rule list.
 */
export function isJunk(name) {
  if (!name || typeof name !== 'string') return true;
  return classifyAsOrg(name.trim()) === null;
}

/**
 * Normalize a stored company name to its canonical form.
 * Strips geographic possessives ("Ohio's X" → "X") and trims trailing verbs
 * after an org suffix ("Powerbank Corporation Achieves" → "Powerbank Corporation").
 * Returns the cleaned name string, or null if the name is junk.
 * Used by the cleanup script to repair existing DB values.
 */
export function normalizeCompanyName(name) {
  if (!name || typeof name !== 'string') return null;
  let t = name.trim().replace(/[,;.]+$/, '').replace(/\s+/g, ' ').trim();
  // Strip geo possessive prefix ("Ohio's FST Logistics" → "FST Logistics")
  const stripped = _stripGeoPossessive(t);
  if (stripped !== t) t = stripped;
  // Trim to org suffix if present ("Radius Logistics opening" → "Radius Logistics")
  if (ORG_SUFFIX.test(t)) t = _trimToOrgSuffix(t);
  // Validate through the full NER classifier
  return classifyAsOrg(t);
}

function detectSignals(text) {
  const lowerText = text.toLowerCase();
  return Object.entries(SIGNAL_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => lowerText.includes(keyword)))
    .map(([signal]) => signal);
}

function detectIndustry(text) {
  const lowerText = text.toLowerCase();
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) return industry;
  }
  return null;
}

function calculateConfidence(signals, industry) {
  let score = 0;
  if (['data_center', 'manufacturing', 'logistics', 'healthcare'].includes(industry)) score += 30;
  else if (industry) score += 10;

  score += signals.length * 15;

  if (signals.some((signal) => ['construction', 'new_opening', 'expansion', 'energy_upgrade', 'rfq', 'energy_project', 'high_utility_exposure'].includes(signal))) score += 20;
  if (signals.includes('rfq')) score += 25;
  if (signals.includes('energy_project')) score += 20;
  if (signals.includes('high_utility_exposure')) score += 15;
  if (signals.includes('high_utility_exposure') && industry) score += 10;

  return Math.min(score, 100);
}

async function scrapeSource(source) {
  const feed = await parser.parseURL(source.url);
  return (feed.items || []).map((item) => {
    const title = cleanGoogleNewsTitle(item.title || '');
    const description = stripHtml(item.contentSnippet || item.content || item.summary || title);
    return {
      title,
      description,
      link: item.link || item.guid,
      pubDate: item.pubDate || item.isoDate,
      sourceName: source.name,
    };
  });
}

export async function scrapeOpportunities({ minConfidence = 50, maxPerSource = 75 } = {}) {
  const opportunities = [];
  const seenUrls = new Set();
  let duplicates = 0;
  const sourceResults = [];

  for (const source of NEWS_SOURCES) {
    try {
      const articles = (await scrapeSource(source)).slice(0, maxPerSource);
      let matched = 0;

      for (const article of articles) {
        if (!article.link || seenUrls.has(article.link)) {
          duplicates += 1;
          continue;
        }
        seenUrls.add(article.link);

        const fullText = `${article.title} ${article.description}`;
        const signals = detectSignals(fullText);
        if (signals.length === 0) continue;

        const companyName = extractCompanyName(article.title, article.description);
        if (!companyName) continue;

        if (signals.length === 1 && signals.includes('high_utility_exposure') && !hasBuyerLikeName(companyName)) {
          continue;
        }

        const nameQuality = scoreCompanyName(companyName);
        if (nameQuality < 50) continue;

        const industry = detectIndustry(fullText);
        const confidenceScore = Math.round(calculateConfidence(signals, industry) * 0.8 + nameQuality * 0.2);
        if (confidenceScore < minConfidence) continue;

        matched += 1;
        opportunities.push({
          company_name: companyName,
          description: article.description || article.title,
          source_url: article.link,
          source_name: source.name,
          signals,
          industry,
          confidence_score: Math.min(confidenceScore, 100),
          status: 'new',
        });
      }

      sourceResults.push({ source: source.name, fetched: articles.length, matched });
    } catch (error) {
      sourceResults.push({ source: source.name, fetched: 0, matched: 0, error: error.message });
    }
  }

  opportunities.sort((a, b) => b.confidence_score - a.confidence_score);

  return {
    opportunities,
    source: 'news_aggregator',
    timestamp: new Date().toISOString(),
    total_found: opportunities.length,
    duplicates_skipped: duplicates,
    source_results: sourceResults,
  };
}

export async function runOpportunityScraper(options = {}) {
  const supabase = getSupabaseClient();
  const result = await scrapeOpportunities(options);

  let newOpportunities = 0;
  let duplicatesSkipped = result.duplicates_skipped;

  for (const opportunity of result.opportunities) {
    const { error: insertError } = await supabase.from('opportunities').insert(opportunity);

    if (!insertError) {
      newOpportunities += 1;
      continue;
    }

    if (insertError.code === '23505') {
      duplicatesSkipped += 1;
      continue;
    }

    throw insertError;
  }

  await supabase.from('scraper_runs').insert({
    source: result.source,
    total_found: result.total_found,
    duplicates_skipped: duplicatesSkipped,
    status: 'success',
  });

  return {
    success: true,
    message: `Found ${result.total_found} opportunities, saved ${newOpportunities} new ones`,
    data: {
      total_found: result.total_found,
      new_opportunities: newOpportunities,
      duplicates_skipped: duplicatesSkipped,
      source_results: result.source_results,
    },
  };
}
