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

function cleanCompanyName(rawName) {
  if (!rawName || typeof rawName !== 'string') return null;

  const cleaned = rawName
    .trim()
    .replace(/\s+CEO$/i, '')
    .replace(/^\W+|\W+$/g, '')
    .replace(/\s+/g, ' ');

  const knownShortNames = new Set(['PECO', 'AES', 'ABB', 'GE', 'GM', 'IBM', 'CPS', 'Xcel']);
  if (cleaned.length < 5 && !knownShortNames.has(cleaned)) return null;
  if (cleaned.includes(',')) return null;
  if (/[<>{}[\]\\|@]/.test(cleaned)) return null;
  if (/https?:\/\//i.test(cleaned)) return null;
  if (/^\d/.test(cleaned) || /^\d+$/.test(cleaned)) return null;
  if (!/[a-zA-Z]/.test(cleaned)) return null;
  if (cleaned.split(/\s+/).length > 6) return null;
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 8) return null;

  const genericWords = new Set([
    'new',
    'data',
    'green',
    'first',
    'how',
    'building',
    'opening',
    'construction',
    'expansion',
    'announces',
    'celebrates',
    'acquires',
    'starts',
    'request',
    'rfp',
    'rfq',
    'alert',
  ]);

  if (genericWords.has(cleaned.toLowerCase())) return null;
  if (/^(how|why|what|when|where|who|top|best|inside|even|bill|senate|house|republicans|lawmakers|white house|data center|electricity costs|going green)\s+/i.test(cleaned)) return null;
  if (/^new\s+/i.test(cleaned) && !/\b(Energy|Power|Solar|Battery|Storage|Systems|Technologies|Tech|Industries|Group|Corp|Company|Co)\b/i.test(cleaned)) return null;
  if (/\s+(opens?|announces?|starts?|acquires?|expands?)$/i.test(cleaned)) return null;
  if (/\b(seeks?|seeking|denies?|says?|files?|halts?|rewrites?|pledges?|responds?|aims?|forces?|push|probe|protects?|question|questions|selling|proposes?|vows?|issues?|expands?)\b/i.test(cleaned)) return null;
  if (/\b(alert|advocate|boom|companies|process|project|policymakers|lawmakers)\b/i.test(cleaned)) return null;

  return cleaned;
}

function hasBuyerLikeName(companyName) {
  return /\b(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Power|Utilities|Utility|Solar|Battery|Storage|Logistics|Automotive|Manufacturing|Microsoft|Amazon|Google|Meta|PECO|NYSERDA|Eskom|Xcel|Duke|CIE|Leeward)\b/i.test(companyName);
}

function extractCompanyName(title, description) {
  const cleanedTitle = cleanGoogleNewsTitle(title);
  const patterns = [
    /^([^:]+?)\s+(opens?|announces?|starts?|expands?|celebrates?|builds?|building|acquires?|launches?|plans?|seeks?|seeking|reopens?|proposes?|vows?|issues?)\s/i,
    /^([^:]+?)\s+to\s+(open|build|expand|acquire|start|launch|invest|develop|meet|sign)\s/i,
    /^([^:]+?)\s+(is|are)\s+(opening|building|expanding|acquiring|developing)\s/i,
    /^([^:]+?)['’]s\s+(new|latest|planned)\s/i,
    /^([^:]+?)['’]s\s+/i,
    /^([^:—–-]+?)\s*[:—–-]\s/u,
  ];

  for (const text of [cleanedTitle, description]) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const candidate = cleanCompanyName(match?.[1]);
      if (candidate) return candidate;
    }
  }

  const fallback = cleanCompanyName(cleanedTitle.split(/\s+/).slice(0, 3).join(' '));
  if (/\b(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Logistics|Automotive|Microsoft|Amazon|Google|Meta|PECO|NYSERDA|Eskom|Xcel|Duke)\b/i.test(fallback || '')) {
    return fallback;
  }

  return null;
}

function scoreCompanyName(name) {
  let score = 50;
  if (name.length >= 10 && name.length <= 50) score += 20;
  if (name.split(/\s+/).length >= 2) score += 15;
  if (/\b(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Logistics)\b/i.test(name)) score += 15;
  if (/[A-Z]/.test(name) && /[a-z]/.test(name)) score += 10;
  return Math.max(0, Math.min(100, score));
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
