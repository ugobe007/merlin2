/**
 * Market Data Scraper Service
 *
 * Daily scraping of RSS feeds and web sources for:
 * - BESS pricing and configurations (hybrid, microgrid)
 * - Solar, Wind pricing
 * - Generators (combustion, linear)
 * - Inverters, Transformers, Switchgear
 * - DC/AC Panels
 * - EV Chargers (Level 1, 2, DCFC/HPC)
 * - ESS, BMS
 * - AI Energy Management
 * - Regulations and incentives
 *
 * Created: December 10, 2025
 */

import { supabase } from "./supabaseClient";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketDataSource {
  id: string;
  name: string;
  url: string;
  feed_url: string | null;
  source_type: "rss_feed" | "api" | "web_scrape" | "data_provider" | "government" | "manufacturer";
  equipment_categories: string[];
  content_type: string;
  regions: string[];
  reliability_score: number;
  data_frequency: string;
  scrape_config: Record<string, unknown>;
  is_active: boolean;
  last_fetch_at: string | null;
  last_fetch_status: string | null;
}

export interface ScrapeJob {
  id: string;
  source_id: string;
  job_type: "rss_fetch" | "web_scrape" | "api_call" | "price_extraction" | "regulation_check";
  schedule_cron: string;
  is_enabled: boolean;
  priority: number;
  last_run_at: string | null;
  last_run_status: string | null;
}

export interface ScrapedArticle {
  id?: string;
  source_id: string;
  title: string;
  url: string;
  author?: string;
  published_at?: string;
  summary?: string;
  full_content?: string;
  topics: string[];
  equipment_mentioned: string[];
  regions_mentioned: string[];
  companies_mentioned: string[];
  prices_extracted: ExtractedPrice[];
  regulations_mentioned: ExtractedRegulation[];
  relevance_score: number;
  sentiment?: "positive" | "negative" | "neutral";
  is_processed: boolean;
}

export interface ExtractedPrice {
  equipment: string;
  price: number;
  unit: string;
  currency: string;
  context: string;
  confidence: number;
}

export interface ExtractedRegulation {
  name: string;
  type: string;
  detail: string;
  effective_date?: string;
  jurisdiction?: string;
}

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  content?: string;
}

// ============================================================================
// EQUIPMENT KEYWORDS FOR CLASSIFICATION
// ============================================================================

export const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  bess: [
    "battery energy storage",
    "bess",
    "battery storage",
    "energy storage system",
    "lithium-ion",
    "lfp",
    "nmc",
    "battery pack",
    "megapack",
    "powerpack",
    "grid-scale battery",
    "utility-scale storage",
    "c&i storage",
  ],
  solar: [
    "solar",
    "pv",
    "photovoltaic",
    "solar panel",
    "solar module",
    "solar array",
    "monocrystalline",
    "polycrystalline",
    "bifacial",
    "solar farm",
    "rooftop solar",
  ],
  wind: [
    "wind turbine",
    "wind farm",
    "wind power",
    "offshore wind",
    "onshore wind",
    "wind energy",
    "wind project",
    "vestas",
    "siemens gamesa",
    "ge wind",
  ],
  generator: [
    "generator",
    "diesel generator",
    "natural gas generator",
    "backup power",
    "standby generator",
    "prime power",
    "genset",
    "cummins",
    "caterpillar",
    "kohler",
  ],
  "linear-generator": [
    "linear generator",
    "mainspring",
    "fuel cell",
    "bloom energy",
    "solid oxide",
  ],
  inverter: [
    "inverter",
    "power inverter",
    "solar inverter",
    "string inverter",
    "central inverter",
    "microinverter",
    "hybrid inverter",
    "sma",
    "solaredge",
    "enphase",
    "fronius",
  ],
  transformer: [
    "transformer",
    "power transformer",
    "distribution transformer",
    "step-up transformer",
    "step-down transformer",
    "pad-mounted",
    "substation transformer",
  ],
  switchgear: [
    "switchgear",
    "circuit breaker",
    "disconnect switch",
    "mv switchgear",
    "medium voltage",
    "switchboard",
    "motor control center",
  ],
  "ev-charger": [
    "ev charger",
    "electric vehicle charger",
    "charging station",
    "dcfc",
    "dc fast",
    "level 2",
    "level 3",
    "supercharger",
    "chargepoint",
    "electrify america",
    "evgo",
    "tritium",
    "hpc",
    "high power charging",
  ],
  bms: [
    "battery management system",
    "bms",
    "cell balancing",
    "state of charge",
    "soc",
    "soh",
    "state of health",
    "thermal management",
  ],
  microgrid: [
    "microgrid",
    "micro-grid",
    "islanded",
    "grid-forming",
    "distributed energy",
    "der",
    "community microgrid",
    "campus microgrid",
    "military microgrid",
  ],
  "hybrid-system": [
    "hybrid system",
    "solar+storage",
    "wind+storage",
    "solar-plus-storage",
    "co-located",
    "coupled system",
    "integrated system",
  ],
};

// ============================================================================
// PRICE EXTRACTION PATTERNS
// ============================================================================

export const PRICE_PATTERNS = {
  // BESS: $XXX/kWh, $XXX per kWh
  bess_kwh: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kWh/gi,
  // BESS: $XXX/kW
  bess_kw: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi,
  // Solar: $X.XX/W, $X.XX per watt
  solar_watt: /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi,
  // Solar: $XXX/kW
  solar_kw: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi,
  // General: $X million, $X billion
  project_cost: /\$\s*(\d+(?:\.\d{1,2})?)\s*(million|billion|M|B)/gi,
  // EV: $X,XXX per charger/unit
  ev_unit: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station)/gi,
  // General percentage
  percentage: /(\d+(?:\.\d{1,2})?)\s*%/gi,
};

// ============================================================================
// RSS PARSER
// ============================================================================

/**
 * Parse RSS/Atom feed XML into articles
 */
export function parseRSSFeed(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Simple regex-based parser (in production, use a proper XML parser)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi; // Atom format

  let match;

  // RSS 2.0 format
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, "title"),
      link: extractTag(itemXml, "link") || extractAttr(itemXml, "link", "href"),
      description: extractTag(itemXml, "description"),
      pubDate: extractTag(itemXml, "pubDate"),
      author: extractTag(itemXml, "author") || extractTag(itemXml, "dc:creator"),
      content: extractTag(itemXml, "content:encoded"),
    });
  }

  // Atom format
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    items.push({
      title: extractTag(entryXml, "title"),
      link: extractAttr(entryXml, "link", "href"),
      description: extractTag(entryXml, "summary"),
      pubDate: extractTag(entryXml, "published") || extractTag(entryXml, "updated"),
      author: extractTag(entryXml, "name"),
      content: extractTag(entryXml, "content"),
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const match = regex.exec(xml);
  return match ? (match[1] || match[2] || "").trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, "i");
  const match = regex.exec(xml);
  return match ? match[1] : "";
}

// ============================================================================
// CONTENT CLASSIFIER
// ============================================================================

/**
 * Classify content by equipment type and extract topics
 * IMPROVED: Better keyword matching and topic detection
 */
export function classifyContent(text: string): {
  equipment: string[];
  topics: string[];
  relevanceScore: number;
} {
  // Preprocess text: strip HTML, normalize
  const cleanText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const textLower = cleanText.toLowerCase();
  const equipment: string[] = [];
  const topics: string[] = [];
  let relevanceScore = 0;

  // Check each equipment category with improved matching
  for (const [category, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    // Use word boundary matching for better accuracy
    const matches = keywords.filter((kw) => {
      const keywordLower = kw.toLowerCase();
      // Exact word match (better accuracy) - escape special regex chars
      const escapedKeyword = keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const wordBoundaryRegex = new RegExp("\\b" + escapedKeyword + "\\b", "i");
      return wordBoundaryRegex.test(textLower);
    });
    if (matches.length > 0) {
      equipment.push(category);
      relevanceScore += matches.length * 0.1;
    }
  }

  // Expanded topic detection with fuzzy matching
  const topicPatterns: Array<{ topic: string; patterns: string[]; score: number }> = [
    {
      topic: "pricing",
      patterns: [
        "price",
        "cost",
        "$/",
        "dollar",
        "pricing",
        "priced at",
        "costs",
        "affordable",
        "expensive",
        "cheap",
        "budget",
      ],
      score: 0.3,
    },
    {
      topic: "projects",
      patterns: [
        "project",
        "install",
        "deploy",
        "construction",
        "development",
        "announcement",
        "commission",
        "operational",
      ],
      score: 0.15,
    },
    {
      topic: "policy",
      patterns: [
        "regulation",
        "policy",
        "incentive",
        "itc",
        "tax credit",
        "rebate",
        "subsidy",
        "government",
        "federal",
        "state",
        "legislation",
        "bill",
      ],
      score: 0.2,
    },
    {
      topic: "tariffs",
      patterns: ["tariff", "trade", "import", "export", "duty", "customs", "trade war"],
      score: 0.2,
    },
    {
      topic: "market-trends",
      patterns: [
        "market",
        "forecast",
        "outlook",
        "trend",
        "growth",
        "decline",
        "demand",
        "supply",
        "capacity",
        "industry",
      ],
      score: 0.15,
    },
    {
      topic: "technology",
      patterns: [
        "technology",
        "innovation",
        "breakthrough",
        "advancement",
        "new tech",
        "cutting edge",
        "next generation",
        "patent",
      ],
      score: 0.1,
    },
    {
      topic: "financing",
      patterns: [
        "financing",
        "funding",
        "investment",
        "capital",
        "loan",
        "lease",
        "ppa",
        "power purchase agreement",
        "financier",
      ],
      score: 0.15,
    },
    {
      topic: "manufacturing",
      patterns: [
        "manufacture",
        "factory",
        "production",
        "facility",
        "plant",
        "assembly",
        "supply chain",
      ],
      score: 0.1,
    },
    {
      topic: "grid",
      patterns: [
        "grid",
        "utility",
        "transmission",
        "distribution",
        "interconnection",
        "net metering",
        "grid-tied",
      ],
      score: 0.15,
    },
    {
      topic: "sustainability",
      patterns: [
        "sustainability",
        "carbon",
        "emission",
        "renewable",
        "clean energy",
        "green",
        "climate",
        "environmental",
      ],
      score: 0.1,
    },
    {
      topic: "performance",
      patterns: [
        "efficiency",
        "performance",
        "output",
        "capacity",
        "rating",
        "specification",
        "specs",
        "warranty",
      ],
      score: 0.1,
    },
    {
      topic: "partnership",
      patterns: [
        "partnership",
        "collaboration",
        "joint venture",
        "alliance",
        "agreement",
        "deal",
        "contract",
      ],
      score: 0.1,
    },
  ];

  // Detect topics with improved matching
  for (const { topic, patterns, score } of topicPatterns) {
    const matches = patterns.filter((pattern) => {
      // Use word boundary for better matching - escape special regex chars
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp("\\b" + escapedPattern + "\\b", "i");
      return regex.test(textLower);
    });

    if (matches.length > 0) {
      // Avoid duplicates
      if (!topics.includes(topic)) {
        topics.push(topic);
        relevanceScore += score;
      }
    }
  }

  // Additional context-based topic detection
  if (textLower.includes("megawatt") || textLower.includes("mw ") || textLower.includes(" mw")) {
    if (!topics.includes("projects")) topics.push("projects");
  }

  if (
    textLower.includes("percent") ||
    textLower.includes("%") ||
    textLower.includes("percentage")
  ) {
    if (!topics.includes("market-trends")) topics.push("market-trends");
  }

  return {
    equipment,
    topics,
    relevanceScore: Math.min(1, relevanceScore),
  };
}

// ============================================================================
// PRICE EXTRACTOR
// ============================================================================

/**
 * Preprocess text for price extraction
 * Strips HTML, normalizes whitespace, and preserves price patterns
 */
function preprocessTextForPrices(text: string): string {
  // Remove HTML tags but preserve content
  let cleaned = text.replace(/<[^>]*>/g, " ");
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

/**
 * Extract pricing data from text content
 * IMPROVED: Works even without equipment detection, uses better preprocessing
 */
export function extractPrices(text: string, equipment: string[]): ExtractedPrice[] {
  const prices: ExtractedPrice[] = [];

  // Preprocess text: strip HTML, normalize
  const cleanText = preprocessTextForPrices(text);
  const textLower = cleanText.toLowerCase();

  // Detect equipment from text if not provided
  const detectedEquipment = equipment.length > 0 ? equipment : detectEquipmentFromText(textLower);

  // Expanded BESS price patterns
  const bessPatterns = [
    PRICE_PATTERNS.bess_kwh,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kwh/gi,
    /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/)\s*kwh/gi,
    /(?:cost|price|priced|pricing)\s*(?:at|of)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kwh/gi,
    /battery.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kwh/gi,
    /storage.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kwh/gi,
  ];

  // Extract BESS prices
  if (
    detectedEquipment.includes("bess") ||
    detectedEquipment.includes("ess") ||
    textLower.includes("battery") ||
    textLower.includes("energy storage") ||
    textLower.includes("bess")
  ) {
    for (const pattern of bessPatterns) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 50 && price < 2000) {
          // Sanity check for BESS pricing
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          // Avoid duplicates
          const isDuplicate = prices.some(
            (p) => p.equipment === "bess" && Math.abs(p.price - price) < 1 && p.unit === "kWh"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "bess",
              price,
              unit: "kWh",
              currency: "USD",
              context,
              confidence: 0.8,
            });
          }
        }
      }
    }
  }

  // Expanded Solar price patterns
  const solarPatterns = [
    PRICE_PATTERNS.solar_watt,
    /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/)\s*[Ww](?:att)?/gi,
    /(\d+(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/)\s*[Ww](?:att)?/gi,
    /(?:cost|price|priced|pricing)\s*(?:at|of)?\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/)\s*[Ww](?:att)?/gi,
    /solar.*?\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/)\s*[Ww](?:att)?/gi,
    /pv.*?\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/)\s*[Ww](?:att)?/gi,
    // $/kW patterns for solar
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
  ];

  // Extract Solar prices
  if (
    detectedEquipment.includes("solar") ||
    textLower.includes("solar") ||
    textLower.includes("photovoltaic") ||
    textLower.includes("pv ")
  ) {
    for (const pattern of solarPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        // Check if it's $/W (0.1-5) or $/kW (100-5000)
        const isPerWatt =
          match[0].toLowerCase().includes("watt") ||
          match[0].toLowerCase().includes("/w") ||
          (price >= 0.1 && price <= 5);
        const isPerKW =
          match[0].toLowerCase().includes("/kw") &&
          !match[0].toLowerCase().includes("kwh") &&
          price >= 100 &&
          price <= 5000;

        if (isPerWatt && price > 0.1 && price < 5) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) => p.equipment === "solar" && Math.abs(p.price - price) < 0.01 && p.unit === "W"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "solar",
              price,
              unit: "W",
              currency: "USD",
              context,
              confidence: 0.8,
            });
          }
        } else if (isPerKW && price >= 100 && price <= 5000) {
          // Convert $/kW to $/W for consistency
          const pricePerWatt = price / 1000;
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) =>
              p.equipment === "solar" && Math.abs(p.price - pricePerWatt) < 0.01 && p.unit === "W"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "solar",
              price: pricePerWatt,
              unit: "W",
              currency: "USD",
              context,
              confidence: 0.75,
            });
          }
        }
      }
    }
  }

  // EV charger pricing
  const evPatterns = [
    PRICE_PATTERNS.ev_unit,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*(?:charger|unit|station|port)/gi,
    /(?:cost|price|priced)\s*(?:at|of)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*(?:charger|unit|station)/gi,
    /ev.*?charger.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/gi,
  ];

  if (
    detectedEquipment.includes("ev-charger") ||
    textLower.includes("ev charger") ||
    textLower.includes("electric vehicle charging")
  ) {
    for (const pattern of evPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 100 && price < 500000) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) =>
              p.equipment === "ev-charger" && Math.abs(p.price - price) < 100 && p.unit === "unit"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "ev-charger",
              price,
              unit: "unit",
              currency: "USD",
              context,
              confidence: 0.7,
            });
          }
        }
      }
    }
  }

  // Generator pricing ($/kW)
  if (
    detectedEquipment.includes("generator") ||
    textLower.includes("generator") ||
    textLower.includes("genset")
  ) {
    const genPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
      /generator.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
    ];

    for (const pattern of genPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 200 && price < 2000) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) => p.equipment === "generator" && Math.abs(p.price - price) < 50 && p.unit === "kW"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "generator",
              price,
              unit: "kW",
              currency: "USD",
              context,
              confidence: 0.7,
            });
          }
        }
      }
    }
  }

  // ─── Wind pricing ($/kW) ───
  if (
    detectedEquipment.includes("wind") ||
    textLower.includes("wind turbine") ||
    textLower.includes("wind farm") ||
    textLower.includes("wind power")
  ) {
    const windPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
      /wind.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
      /(?:cost|price|priced)\s*(?:at|of)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h).*?wind/gi,
    ];

    for (const pattern of windPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 500 && price < 5000) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) => p.equipment === "wind" && Math.abs(p.price - price) < 100 && p.unit === "kW"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "wind",
              price,
              unit: "kW",
              currency: "USD",
              context,
              confidence: 0.65,
            });
          }
        }
      }
    }
  }

  // ─── Inverter pricing ($/kW) ───
  if (
    detectedEquipment.includes("inverter") ||
    textLower.includes("inverter") ||
    textLower.includes("pcs") ||
    textLower.includes("power conversion")
  ) {
    const inverterPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
      /inverter.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
      /pcs.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h)/gi,
    ];

    for (const pattern of inverterPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 30 && price < 500) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) => p.equipment === "inverter" && Math.abs(p.price - price) < 20 && p.unit === "kW"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "inverter",
              price,
              unit: "kW",
              currency: "USD",
              context,
              confidence: 0.65,
            });
          }
        }
      }
    }
  }

  // ─── Transformer pricing ($/kVA) ───
  if (
    detectedEquipment.includes("transformer") ||
    textLower.includes("transformer") ||
    textLower.includes("substation")
  ) {
    const transformerPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kva/gi,
      /transformer.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kva/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*kw(?!h).*?transformer/gi,
    ];

    for (const pattern of transformerPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 15 && price < 200) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) =>
              p.equipment === "transformer" && Math.abs(p.price - price) < 10 && p.unit === "kVA"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "transformer",
              price,
              unit: "kVA",
              currency: "USD",
              context,
              confidence: 0.6,
            });
          }
        }
      }
    }
  }

  // ─── Switchgear pricing ($/unit) ───
  if (
    detectedEquipment.includes("switchgear") ||
    textLower.includes("switchgear") ||
    textLower.includes("circuit breaker")
  ) {
    const switchgearPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/)\s*(?:unit|panel|bay|section)/gi,
      /switchgear.*?\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/gi,
    ];

    for (const pattern of switchgearPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 5000 && price < 500000) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(cleanText.length, match.index + match[0].length + 100);
          const context = cleanText.slice(start, end);

          const isDuplicate = prices.some(
            (p) =>
              p.equipment === "switchgear" && Math.abs(p.price - price) < 1000 && p.unit === "unit"
          );

          if (!isDuplicate) {
            prices.push({
              equipment: "switchgear",
              price,
              unit: "unit",
              currency: "USD",
              context,
              confidence: 0.55,
            });
          }
        }
      }
    }
  }

  return prices;
}

/**
 * Detect equipment from text if not already detected
 */
function detectEquipmentFromText(text: string): string[] {
  const equipment: string[] = [];

  if (
    text.includes("battery") ||
    text.includes("bess") ||
    text.includes("energy storage") ||
    text.includes("energy storage system")
  ) {
    equipment.push("bess");
  }
  if (
    text.includes("solar") ||
    text.includes("photovoltaic") ||
    text.includes("pv ") ||
    text.includes("solar panel")
  ) {
    equipment.push("solar");
  }
  if (text.includes("wind") || text.includes("wind turbine")) {
    equipment.push("wind");
  }
  if (text.includes("generator") || text.includes("genset")) {
    equipment.push("generator");
  }
  if (
    text.includes("ev charger") ||
    text.includes("electric vehicle charging") ||
    text.includes("charging station")
  ) {
    equipment.push("ev-charger");
  }
  if (text.includes("inverter")) {
    equipment.push("inverter");
  }

  return equipment;
}

// ============================================================================
// REGULATION EXTRACTOR
// ============================================================================

/**
 * Extract regulatory mentions from text
 */
export function extractRegulations(text: string): ExtractedRegulation[] {
  const regulations: ExtractedRegulation[] = [];
  const textLower = text.toLowerCase();

  // ITC mentions
  if (textLower.includes("itc") || textLower.includes("investment tax credit")) {
    const percentMatch = text.match(/(\d+)\s*%\s*(?:itc|investment tax credit)/i);
    regulations.push({
      name: "Investment Tax Credit (ITC)",
      type: "tax_credit",
      detail: percentMatch ? `${percentMatch[1]}% ITC` : "ITC mentioned",
      jurisdiction: "federal",
    });
  }

  // PTC mentions
  if (textLower.includes("ptc") || textLower.includes("production tax credit")) {
    regulations.push({
      name: "Production Tax Credit (PTC)",
      type: "tax_credit",
      detail: "PTC mentioned",
      jurisdiction: "federal",
    });
  }

  // IRA mentions
  if (textLower.includes("inflation reduction act") || textLower.includes(" ira ")) {
    regulations.push({
      name: "Inflation Reduction Act",
      type: "incentive",
      detail: "IRA provisions mentioned",
      jurisdiction: "federal",
    });
  }

  // Net metering
  if (textLower.includes("net metering") || textLower.includes("nem")) {
    regulations.push({
      name: "Net Metering",
      type: "net_metering",
      detail: "Net metering policy mentioned",
    });
  }

  // Tariffs
  if (
    textLower.includes("tariff") &&
    (textLower.includes("china") || textLower.includes("import"))
  ) {
    regulations.push({
      name: "Import Tariffs",
      type: "tariff",
      detail: "Trade tariffs on energy equipment",
    });
  }

  return regulations;
}

// ============================================================================
// MAIN SCRAPER SERVICE
// ============================================================================

/**
 * Fetch and process RSS feed
 */
export async function fetchRSSFeed(source: MarketDataSource): Promise<ScrapedArticle[]> {
  if (!source.feed_url) {
    throw new Error(`No feed URL for source: ${source.name}`);
  }

  try {
    // Fetch RSS feed
    const response = await fetch(source.feed_url, {
      headers: {
        "User-Agent": "Merlin-BESS-QuoteBuilder/1.0 (market-data-aggregator)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const items = parseRSSFeed(xml);

    // Process each item
    const articles: ScrapedArticle[] = items.map((item) => {
      const content = item.content || item.description || "";
      // Combine title and content for better extraction
      const fullText = `${item.title} ${content}`;

      const classification = classifyContent(fullText);
      // Extract prices with improved preprocessing
      const prices = extractPrices(fullText, classification.equipment);
      const regulations = extractRegulations(fullText);

      // Debug logging in development
      if (import.meta.env.DEV && prices.length > 0) {
        console.log(`💰 Extracted ${prices.length} price(s) from: ${item.title?.substring(0, 60)}`);
      }

      return {
        source_id: source.id,
        title: item.title,
        url: item.link,
        author: item.author,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        summary: item.description?.slice(0, 500),
        full_content: content,
        topics: classification.topics,
        equipment_mentioned: classification.equipment,
        regions_mentioned: source.regions,
        companies_mentioned: [],
        prices_extracted: prices,
        regulations_mentioned: regulations,
        relevance_score: classification.relevanceScore,
        is_processed: true,
      };
    });

    return articles;
  } catch (error) {
    console.error(`Error fetching RSS for ${source.name}:`, error);
    throw error;
  }
}

/**
 * Save scraped articles to database
 */
export async function saveScrapedArticles(
  articles: ScrapedArticle[]
): Promise<{ saved: number; skipped: number }> {
  let saved = 0;
  let skipped = 0;

  for (const article of articles) {
    // Check if URL already exists
    const { data: existing } = await supabase
      .from("scraped_articles")
      .select("id")
      .eq("url", article.url)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    // Insert new article
    const { error } = await supabase.from("scraped_articles").insert({
      source_id: article.source_id,
      title: article.title,
      url: article.url,
      author: article.author,
      published_at: article.published_at,
      summary: article.summary,
      full_content: article.full_content,
      topics: article.topics,
      equipment_mentioned: article.equipment_mentioned,
      regions_mentioned: article.regions_mentioned,
      companies_mentioned: article.companies_mentioned,
      prices_extracted: article.prices_extracted,
      regulations_mentioned: article.regulations_mentioned,
      relevance_score: article.relevance_score,
      sentiment: article.sentiment,
      is_processed: article.is_processed,
    });

    if (error) {
      console.error(`Error saving article ${article.url}:`, error);
    } else {
      saved++;

      // If prices were extracted, also save to collected_market_prices
      for (const price of article.prices_extracted) {
        await supabase.from("collected_market_prices").insert({
          source_id: article.source_id,
          equipment_type: price.equipment,
          price_per_unit: price.price,
          unit: price.unit,
          currency: price.currency,
          confidence_score: price.confidence,
          price_date: article.published_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          raw_text: price.context,
          extraction_method: "regex",
        });
      }
    }
  }

  return { saved, skipped };
}

/**
 * Update scrape job status
 */
export async function updateScrapeJobStatus(
  sourceId: string,
  status: "success" | "partial" | "failed",
  itemsFound: number,
  itemsNew: number,
  pricesExtracted: number,
  error?: string
): Promise<void> {
  await supabase
    .from("scrape_jobs")
    .update({
      last_run_at: new Date().toISOString(),
      last_run_status: status,
      items_found: itemsFound,
      items_new: itemsNew,
      prices_extracted: pricesExtracted,
      last_error: error,
      consecutive_failures: status === "failed" ? supabase.rpc("increment_failures") : 0,
    })
    .eq("source_id", sourceId);

  // Also update the source's last fetch status
  await supabase
    .from("market_data_sources")
    .update({
      last_fetch_at: new Date().toISOString(),
      last_fetch_status: status,
    })
    .eq("id", sourceId);
}

/**
 * Get all enabled scrape jobs that are due to run
 */
export async function getDueScrapeJobs(): Promise<ScrapeJob[]> {
  const { data, error } = await supabase
    .from("scrape_jobs")
    .select("*, market_data_sources(*)")
    .eq("is_enabled", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching scrape jobs:", error);
    return [];
  }

  return data || [];
}

/**
 * Run all due scrape jobs
 */
export async function runDailyScrape(): Promise<{
  sourcesProcessed: number;
  articlesFound: number;
  articlesSaved: number;
  pricesExtracted: number;
  errors: string[];
}> {
  const results = {
    sourcesProcessed: 0,
    articlesFound: 0,
    articlesSaved: 0,
    pricesExtracted: 0,
    errors: [] as string[],
  };

  // Get all active RSS sources
  const { data: sources, error } = await supabase
    .from("market_data_sources")
    .select("*")
    .eq("is_active", true)
    .eq("source_type", "rss_feed")
    .not("feed_url", "is", null);

  if (error || !sources) {
    results.errors.push(`Failed to fetch sources: ${error?.message}`);
    return results;
  }

  // Process each source
  for (const source of sources) {
    try {
      console.log(`Processing: ${source.name}`);

      const articles = await fetchRSSFeed(source as MarketDataSource);
      results.articlesFound += articles.length;

      const { saved, skipped } = await saveScrapedArticles(articles);
      results.articlesSaved += saved;

      const pricesCount = articles.reduce((sum, a) => sum + a.prices_extracted.length, 0);
      results.pricesExtracted += pricesCount;

      await updateScrapeJobStatus(source.id, "success", articles.length, saved, pricesCount);
      results.sourcesProcessed++;

      // Rate limiting: wait between sources
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      results.errors.push(`${source.name}: ${errorMsg}`);
      await updateScrapeJobStatus(source.id, "failed", 0, 0, 0, errorMsg);
    }
  }

  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const marketDataScraper = {
  fetchRSSFeed,
  saveScrapedArticles,
  updateScrapeJobStatus,
  getDueScrapeJobs,
  runDailyScrape,
  classifyContent,
  extractPrices,
  extractRegulations,
  parseRSSFeed,
};

export default marketDataScraper;
