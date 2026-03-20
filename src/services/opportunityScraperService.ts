/**
 * Opportunity Scraper Service
 * Aggregates business news from RSS feeds and identifies energy opportunities
 */

import type {
  Opportunity,
  OpportunitySignal,
  IndustryType,
  ScraperResult,
} from "../types/opportunity";

// RSS feed sources
const NEWS_SOURCES = [
  {
    name: "Google News - Business Construction",
    url: "https://news.google.com/rss/search?q=business+construction+opening&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Factory Expansion",
    url: "https://news.google.com/rss/search?q=factory+expansion+manufacturing&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Data Center",
    url: "https://news.google.com/rss/search?q=data+center+opening+construction&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Warehouse Logistics",
    url: "https://news.google.com/rss/search?q=warehouse+logistics+opening&hl=en-US&gl=US&ceid=US:en",
  },
];

// Keywords that signal opportunities
const SIGNAL_KEYWORDS: Record<OpportunitySignal, string[]> = {
  construction: ["construction", "building", "under construction", "groundbreaking"],
  expansion: ["expansion", "expanding", "expand", "growing", "growth"],
  new_opening: ["opening", "opened", "new facility", "new location", "launching"],
  funding: ["funding", "investment", "raised", "capital", "financing"],
  acquisition: ["acquired", "acquisition", "merger", "purchase"],
  sustainability_initiative: ["sustainability", "renewable", "green", "carbon neutral", "net zero"],
  energy_upgrade: ["energy efficiency", "power upgrade", "electrical", "energy management"],
  facility_upgrade: ["modernization", "renovation", "upgrade", "retrofit"],
};

// High-value industries for energy projects
const INDUSTRY_KEYWORDS: Record<IndustryType, string[]> = {
  data_center: ["data center", "server farm", "cloud infrastructure", "colocation"],
  manufacturing: ["manufacturing", "factory", "plant", "production facility"],
  logistics: ["warehouse", "distribution center", "logistics", "fulfillment center"],
  hospitality: ["hotel", "resort", "restaurant", "hospitality"],
  healthcare: ["hospital", "medical center", "healthcare facility", "clinic"],
  retail: ["retail", "shopping center", "supermarket", "store"],
  education: ["school", "university", "campus", "education"],
  automotive: ["automotive", "car manufacturing", "assembly plant", "dealership"],
  other: [],
};

/**
 * Parse RSS feed and extract articles
 */
async function parseRSSFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url);
    const text = await response.text();

    // Simple RSS parser (in production, use a library like rss-parser)
    const items: any[] = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    const matches = text.matchAll(itemRegex);

    for (const match of matches) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const description = itemXml.match(/<description>(.*?)<\/description>/)?.[1] || "";
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      items.push({
        title: decodeHTMLEntities(title),
        link: decodeHTMLEntities(link),
        description: decodeHTMLEntities(description),
        pubDate,
      });
    }

    return items;
  } catch (error) {
    console.error(`Error parsing RSS feed ${url}:`, error);
    return [];
  }
}

/**
 * Decode HTML entities in text
 */
function decodeHTMLEntities(text: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  return doc.documentElement.textContent || text;
}

/**
 * Detect signals in article text
 */
function detectSignals(text: string): OpportunitySignal[] {
  const signals: OpportunitySignal[] = [];
  const lowerText = text.toLowerCase();

  for (const [signal, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      signals.push(signal as OpportunitySignal);
    }
  }

  return signals;
}

/**
 * Detect industry from article text
 */
function detectIndustry(text: string): IndustryType | undefined {
  const lowerText = text.toLowerCase();

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return industry as IndustryType;
    }
  }

  return undefined;
}

/**
 * Extract company name from article (simple heuristic)
 */
function extractCompanyName(title: string, description: string): string {
  // Look for patterns like "Company Name announces..." or "Company Name to..."
  const patterns = [
    /^([A-Z][A-Za-z0-9\s&]+?)\s+(announces|to|plans|opens|expands)/,
    /([A-Z][A-Za-z0-9\s&]+?)\s+(Inc\.|LLC|Corp\.|Corporation|Ltd\.)/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  // Fallback: first few words of title
  return title.split(" ").slice(0, 3).join(" ");
}

/**
 * Calculate confidence score based on signals and industry match
 */
function calculateConfidence(signals: OpportunitySignal[], industry?: IndustryType): number {
  let score = 0;

  // High-value industries get bonus points
  const highValueIndustries: IndustryType[] = [
    "data_center",
    "manufacturing",
    "logistics",
    "healthcare",
  ];
  if (industry && highValueIndustries.includes(industry)) {
    score += 30;
  } else if (industry) {
    score += 10;
  }

  // Multiple signals = higher confidence
  score += signals.length * 15;

  // Specific high-value signals
  const highValueSignals: OpportunitySignal[] = [
    "construction",
    "new_opening",
    "expansion",
    "energy_upgrade",
  ];
  const hasHighValueSignal = signals.some((s) => highValueSignals.includes(s));
  if (hasHighValueSignal) {
    score += 20;
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Main scraper function - aggregates opportunities from all sources
 */
export async function scrapeOpportunities(): Promise<ScraperResult> {
  const allOpportunities: Opportunity[] = [];
  const seenUrls = new Set<string>();
  let duplicates = 0;

  console.log("🔍 Starting opportunity scraper...");

  for (const source of NEWS_SOURCES) {
    console.log(`Fetching from: ${source.name}`);

    const articles = await parseRSSFeed(source.url);

    for (const article of articles) {
      // Skip duplicates
      if (seenUrls.has(article.link)) {
        duplicates++;
        continue;
      }
      seenUrls.add(article.link);

      // Combine title and description for analysis
      const fullText = `${article.title} ${article.description}`;

      // Detect signals
      const signals = detectSignals(fullText);

      // Skip if no relevant signals
      if (signals.length === 0) {
        continue;
      }

      // Detect industry
      const industry = detectIndustry(fullText);

      // Extract company name
      const companyName = extractCompanyName(article.title, article.description);

      // Calculate confidence
      const confidence = calculateConfidence(signals, industry);

      // Create opportunity
      const opportunity: Opportunity = {
        id: crypto.randomUUID(),
        company_name: companyName,
        description: article.description || article.title,
        source_url: article.link,
        source_name: source.name,
        signals,
        industry,
        confidence_score: confidence,
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      allOpportunities.push(opportunity);
    }
  }

  // Sort by confidence score (highest first)
  allOpportunities.sort((a, b) => b.confidence_score - a.confidence_score);

  console.log(
    `✅ Scraping complete: ${allOpportunities.length} opportunities found (${duplicates} duplicates skipped)`
  );

  return {
    opportunities: allOpportunities,
    source: "news_aggregator",
    timestamp: new Date().toISOString(),
    total_found: allOpportunities.length,
    duplicates_skipped: duplicates,
  };
}

/**
 * Filter opportunities by criteria
 */
export function filterOpportunities(
  opportunities: Opportunity[],
  filter: {
    minConfidence?: number;
    industries?: IndustryType[];
    signals?: OpportunitySignal[];
  }
): Opportunity[] {
  return opportunities.filter((opp) => {
    if (filter.minConfidence && opp.confidence_score < filter.minConfidence) {
      return false;
    }

    if (filter.industries && filter.industries.length > 0) {
      if (!opp.industry || !filter.industries.includes(opp.industry)) {
        return false;
      }
    }

    if (filter.signals && filter.signals.length > 0) {
      if (!opp.signals.some((s) => filter.signals!.includes(s))) {
        return false;
      }
    }

    return true;
  });
}
