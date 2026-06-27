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

const TRAILING_NOISE = /\s+(?:opens?|announces?|starts?|expands?|builds?|acquires?|launches?|plans?|seeks?|proposes?|vows?|brings?|inaugurates?|completes?|celebrates?|unveils?|selects?|awards?|breaks|signs?|closes?|reaches?|secures?|wins?|gets?|reveals?|receives?|to|in|for|by|at|of|the|a|an|and|or|is|are|has|have|was|were|will|set|said|plans?|said?)\s*$/i;
// Keep TRAILING_VERBS as alias for isJunk checks
const TRAILING_VERBS = TRAILING_NOISE;

const GENERIC_DESCRIPTOR_PATTERN = /^(?:global|major|leading|top|large|small|a\s+|the\s+|local|regional|national|international)\s+(?:energy|solar|power|battery|utility|grid|firm|company|companies|provider|developer|operator|owner|investor|player|giant)\b/i;

const SHORT_KNOWN = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel', 'BYD']);

const JUNK_SINGLE_WORDS = new Set([
  // Countries / territories
  'china', 'india', 'usa', 'uk', 'germany', 'france', 'italy', 'spain',
  'japan', 'korea', 'australia', 'canada', 'mexico', 'brazil', 'russia',
  'oman', 'uae', 'saudiarabia', 'europe', 'africa', 'asia',
  'philippines', 'indonesia', 'vietnam', 'thailand', 'malaysia', 'singapore',
  'kuwait', 'qatar', 'bahrain', 'jordan', 'egypt', 'nigeria', 'ghana',
  'pakistan', 'bangladesh', 'srilanka', 'nepal', 'turkey', 'israel',
  'sweden', 'norway', 'denmark', 'finland', 'netherlands', 'belgium',
  'switzerland', 'austria', 'poland', 'czechia', 'portugal', 'greece',
  // US States
  'ohio', 'texas', 'california', 'florida', 'nevada', 'arizona', 'georgia',
  'virginia', 'carolina', 'michigan', 'illinois', 'indiana', 'kentucky',
  // Generic nouns / sentence starters
  'commentary', 'construction', 'groundbreaking', 'expansion', 'opening',
  'analysis', 'report', 'update', 'alert', 'study', 'research', 'news',
]);

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
      const stripped = match[1].replace(TRAILING_NOISE, '').trim();
      return stripped || match[1].trim();
    }
  }

  // Fallback: first 1-3 words of title if they contain a known suffix or entity
  const words = cleanedTitle.split(/\s+/);
  // Require 2+ words for suffix match (prevents bare "Energy", "Solar", etc.)
  for (let n = 3; n >= 2; n--) {
    const candidate = words.slice(0, n).join(' ');
    if (KNOWN_ENTITIES.has(candidate)) return candidate;
    if ([...COMPANY_SUFFIXES].some((s) => candidate.endsWith(s))) return candidate;
  }
  // Single-word only if it's a known proper entity (e.g. "Amazon", "Tesla")
  if (words.length >= 1 && KNOWN_ENTITIES.has(words[0])) return words[0];

  return null;
}

// ── Stage 4: Junk Filter ────────────────────────────────────────────────────
function isJunk(name) {
  if (!name || typeof name !== 'string') return true;
  const t = name.trim();
  if (!t) return true;

  if (t.length < 4 && !SHORT_KNOWN.has(t)) return true;
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
  if (/\b(?:seeks?|seeking|requests?|denies?|says?|files?|halts?|rewrites?|pledges?|responds?|aims?|forces?|push|probe|protects?|proposes?|vows?|grew|grow|grown|selling)\b/i.test(t)) return true;
  if (/\b(?:alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(t)) return true;
  if (/\b(?:developer|developers|provider|providers|player|operator|operators)\b/i.test(t)) return true;
  if (/\b(?:completes|office|grew up|up here)\b/i.test(t)) return true;
  if (TRAILING_NOISE.test(t)) return true;
  // Single word: only allow if known entity or SHORT_KNOWN
  if (t.split(/\s+/).length === 1 && !SHORT_KNOWN.has(t)) {
    if (JUNK_SINGLE_WORDS.has(t.toLowerCase())) return true;
  }
  // Modal verbs → headline fragment, not a company name
  if (/\b(?:would|could|should|will|may|might|must|shall)\b/i.test(t)) return true;
  // Headline-style verbs that signal the text is a sentence, not a company
  if (/\b(?:sees|gaining|gaining from|surging|threatens|threaten|targets?|warns?|weighs?|mulls?|nears?|paves?|spurs?)\b/i.test(t)) return true;
  // "and" joining two names → not a single company
  if (/\s+and\s+/i.test(t)) return true;
  // Starts with article/construction fragment words
  if (/^(?:construction|groundbreaking|expansion|opening|massive|huge|enormous|record)\s/i.test(t)) return true;
  if (/^new\s+/i.test(t) && !/\b(?:Energy|Power|Solar|Battery|Storage|Systems|Technologies|Tech|Industries|Group|Corp|Company|Co)\b/i.test(t)) return true;

  // Structural: 4+ word name not ending in a recognized corporate suffix → sentence fragment
  const words = t.split(/\s+/);
  if (words.length >= 4) {
    const lastWord = words[words.length - 1];
    const CORP_SUFFIX_RE = /^(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Power|Utilities|Utility|Solar|Battery|Storage|Logistics|Automotive|Manufacturing|Partners|Holdings|Ventures|Capital|Associates|Enterprises)\.?$/i;
    if (!CORP_SUFFIX_RE.test(lastWord)) return true;
  }

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
