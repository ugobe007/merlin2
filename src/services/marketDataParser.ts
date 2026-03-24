/**
 * Market Data Parser — Pure Parsing Library
 *
 * Zero-dependency TypeScript: no imports, no browser APIs, no import.meta.env.
 * Safe to import from both browser (Vite) and Node.js (scripts/).
 *
 * Canonical source for:
 *   - RSS/Atom parsing
 *   - Content classification (equipment, topics)
 *   - Price extraction ($/kWh, $/W, $/kW, $/unit)
 *   - Regulation extraction (ITC, IRA, tariffs)
 *
 * Used by:
 *   - src/services/marketDataScraper.ts  (browser/Vite service)
 *   - scripts/run-daily-scrape.ts        (Node.js CLI / GitHub Actions)
 *
 * Created: February 25, 2026 (extracted from marketDataScraper.ts)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  content?: string;
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

// ============================================================================
// EQUIPMENT KEYWORDS
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
    // --- Supply Chain Manufacturers (BESS Cells) ---
    "lg energy solution",
    "samsung sdi",
    "panasonic",
    "aesc",
    "envision energy",
    "byd",
    "catl",
    "sk on",
    "ford blueoval",
    "ess inc",
    "form energy",
    "eve energy",
    "natron energy",
    "trina storage",
    "gotion high-tech",
    "gotion",
    "hithium",
    "calb",
    "rept battero",
    "lishen",
    "pylontech",
    // --- Supply Chain Manufacturers (BESS Systems) ---
    "tesla energy",
    "fluence",
    "gridstack",
    "ge vernova storage",
    "flexgen",
    "generac pwrcell",
    "sungrow storage",
    "lion energy",
    "sonnen",
    "powin",
    "crrc",
    "canadian solar e-storage",
    "wartsila",
    "wärtsilä",
    "simpliphi",
    "eos energy",
    "hyperstrong",
    "sigenergy",
    "narada power",
    "fortress power",
    "alphaess",
    "tecloman",
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
    // --- Supply Chain Manufacturers (Solar Panels - PV Modules) ---
    "first solar",
    "qcells",
    "hanwha qcells",
    "jinkosolar",
    "canadian solar",
    "silfab solar",
    "ja solar",
    "trina solar",
    "longi green energy",
    "longi",
    "rec group",
    "t1 energy",
    "freyr",
    "meyer burger",
    "goldi solar",
    "rayzon solar",
    "illuminate usa",
    "heliene",
    "renewsys",
    "tata power solar",
    "maxeon",
    "tongwei",
    "astronergy",
    "chint",
    "emmvee",
    "jakson solar",
    "huasun energy",
    "saatvik",
    "gautam solar",
    "seg solar",
    "mission solar",
    "suniva",
    "auxin solar",
    "risen energy",
    "boviet solar",
    "reliance solar",
    "aiko solar",
    "adani solar",
    "waaree",
    "gcl si",
    "das solar",
    "dmegc",
    "vikram solar",
    "yingli solar",
    // --- Supply Chain (Solar Racking & Carports) ---
    "nextracker",
    "array technologies",
    "ironridge",
    "unirac",
    "gamechange solar",
    "snapnrack",
    "omco solar",
    "valmont solar",
    "ftc solar",
    "soltec",
    "k2 systems",
    "arctech solar",
    "trina tracker",
    "m bar c construction",
    "parasol structures",
    "quest renewables",
    "baja carports",
    "rbi solar",
    "polar racking",
    "schletter",
    "kern solar structures",
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
    // --- Supply Chain Manufacturers (Gas & Diesel Generators) ---
    "cummins",
    "caterpillar",
    "kohler",
    "generac",
    "siemens energy",
    "ge vernova",
    "waukesha",
    "innio",
    "jenbacher",
    "mtu",
    "rolls-royce power",
    "blue star power",
    "briggs stratton",
    "atlas copco",
    "john deere power",
    "detroit diesel",
    "himoinsa",
    "perkins",
    "doosan",
    "yanmar",
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
    // --- Supply Chain Manufacturers (Solar Inverters) ---
    "schneider electric",
    "siemens",
    "enphase",
    "abb",
    "fimer",
    "ge vernova",
    "solaredge",
    "sungrow",
    "tmeic",
    "delta electronics",
    "huawei fusionsolar",
    "sma",
    "sma solar",
    "fronius",
    "epc power",
    "power electronics",
    "ginlong",
    "solis",
    "goodwe",
    "aiswei",
    "solplanet",
    "growatt",
    "tbea",
    "deye",
    "sofar",
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
    "supercharger",
    "chargepoint",
    "electrify america",
    "evgo",
    "tritium",
    "hpc",
    "high power charging",
    // --- Supply Chain Manufacturers (EV Chargers L2 & DCFC) ---
    "tesla wall connector",
    "siemens versicharge",
    "clippercreek",
    "eaton ev",
    "bosch ev",
    "leviton ev",
    "evercharge",
    "autel energy",
    "webasto",
    "blink charging",
    "emporia energy",
    "wallbox",
    "juicebox",
    "enel x",
    "flo",
    "evbox",
    "grizzl-e",
    "incharge energy",
    "btc power",
    "sk signet",
    "kempower",
    "alpitronic",
    "heliox",
    "ekoenergetyka",
    "efacec",
    "i-charging",
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
  // BESS: $XXX/kWh, $XXX per kWh - ENHANCED
  bess_kwh: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*k[Ww]h/gi,
  // BESS: Battery costs fell/dropped/declined to $XXX
  bess_cost: /(?:battery|bess|storage)\s+(?:cost|price|pricing)s?\s+(?:fell|dropped|declined|reached|at|to|of)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k[Ww]h/gi,
  // BESS: $XXX/kW installed
  bess_kw: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)\s*(?:installed)?/gi,
  // Solar: $X.XX/W, $X.XX per watt - ENHANCED  
  solar_watt: /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
  // Solar: module pricing at $X.XX/W
  solar_module: /(?:module|panel|solar)\s+(?:cost|price|pricing)s?\s+(?:at|of|to|reached)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
  // Solar: $XXX/kW - ENHANCED
  solar_kw: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)\s*(?:installed)?/gi,
  // Inverter: $XXX/kW
  inverter_kw: /(?:inverter|pcs)\s+(?:cost|price|pricing)s?\s+(?:at|of|to|reached)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*kW(?!h)/gi,
  // General: $X million, $X billion - ENHANCED
  project_cost: /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:million|billion|M|B)(?:\s+(?:project|investment|contract|deal))?/gi,
  // EV: $X,XXX per charger/unit - ENHANCED
  ev_unit: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station|port)/gi,
  // General percentage
  percentage: /(\d+(?:\.\d{1,2})?)\s*%/gi,
  // Transformer/switchgear: $XXX,XXX per unit
  equipment_unit: /\$\s*(\d+(?:,\d{3})*)\s*(?:per|\/)\s*(?:transformer|unit|switchgear)/gi,
};

// ============================================================================
// RSS PARSER
// ============================================================================

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

/**
 * Parse RSS 2.0 and Atom feed XML into a normalized array of items.
 * Returns empty array (never throws) on malformed input.
 */
export function parseRSSFeed(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  if (!xml || typeof xml !== "string") return items;

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;

  // RSS 2.0
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

  // Atom
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

// ============================================================================
// CONTENT CLASSIFIER
// ============================================================================

/**
 * Classify text content by energy equipment type and topic.
 * Returns equipment categories, topic tags, and a 0-1 relevance score.
 */
export function classifyContent(text: string): {
  equipment: string[];
  topics: string[];
  relevanceScore: number;
} {
  const cleanText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const textLower = cleanText.toLowerCase();
  const equipment: string[] = [];
  const topics: string[] = [];
  let relevanceScore = 0;

  // Equipment detection — word-boundary matching
  for (const [category, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    const matches = keywords.filter((kw) => {
      const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("\\b" + escaped + "\\b", "i").test(textLower);
    });
    if (matches.length > 0) {
      equipment.push(category);
      relevanceScore += matches.length * 0.1;
    }
  }

  // Topic detection
  const topicPatterns: Array<{
    topic: string;
    patterns: string[];
    score: number;
  }> = [
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

  for (const { topic, patterns, score } of topicPatterns) {
    const hits = patterns.filter((p) => {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("\\b" + escaped + "\\b", "i").test(textLower);
    });
    if (hits.length > 0 && !topics.includes(topic)) {
      topics.push(topic);
      relevanceScore += score;
    }
  }

  // Additional context signals
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

  return { equipment, topics, relevanceScore: Math.min(1, relevanceScore) };
}

// ============================================================================
// PRICE EXTRACTOR
// ============================================================================

function preprocessTextForPrices(text: string): string {
  let cleaned = text.replace(/<[^>]*>/g, " ");
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  return cleaned.replace(/\s+/g, " ").trim();
}

function detectEquipmentFromText(text: string): string[] {
  const equipment: string[] = [];
  if (text.includes("battery") || text.includes("bess") || text.includes("energy storage") ||
      text.includes("utility-scale storage") || text.includes("c&i storage") ||
      (text.includes("storage") && (text.includes("/kwh") || text.includes("per kwh"))))
    equipment.push("bess");
  if (text.includes("solar") || text.includes("photovoltaic") || text.includes("pv "))
    equipment.push("solar");
  if (text.includes("wind") || text.includes("wind turbine")) equipment.push("wind");
  if (text.includes("generator") || text.includes("genset")) equipment.push("generator");
  if (text.includes("ev charger") || text.includes("charging station"))
    equipment.push("ev-charger");
  if (text.includes("inverter")) equipment.push("inverter");
  return equipment;
}

/**
 * Extract structured price data from article text.
 * Handles $/kWh (BESS), $/W and $/kW (solar), $/kW (wind/generator), $/unit (EV).
 * Auto-detects equipment from text if `equipment` array is empty.
 */
export function extractPrices(text: string, equipment: string[]): ExtractedPrice[] {
  const prices: ExtractedPrice[] = [];
  const cleanText = preprocessTextForPrices(text);
  const textLower = cleanText.toLowerCase();
  const detectedEquipment = equipment.length > 0 ? equipment : detectEquipmentFromText(textLower);

  // ── BESS $/kWh ────────────────────────────────────────────────────────────
  if (
    detectedEquipment.includes("bess") ||
    textLower.includes("battery") ||
    textLower.includes("energy storage") ||
    textLower.includes("bess")
  ) {
    const bessPatterns = [
      PRICE_PATTERNS.bess_kwh,
      PRICE_PATTERNS.bess_cost,
      PRICE_PATTERNS.bess_kw,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/|a)\s*kwh/gi,
      /(?:cost|price|priced|pricing|priced\s+at)\s*(?:at|of|is|are|to)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
      /battery.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      /storage.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      /bess.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      // "costs fell to $120 per kilowatt-hour"
      /costs?\s+(?:fell|dropped|declined|decreased|reduced|dropped\s+to)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|a)\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      // "at $350/kWh installed"  
      /at\s+\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kwh\s*installed/gi,
    ];
    for (const pattern of bessPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 50 && price < 2000) {
          const context = cleanText.slice(
            Math.max(0, match.index - 100),
            Math.min(cleanText.length, match.index + match[0].length + 100)
          );
          if (
            !prices.some(
              (p) => p.equipment === "bess" && Math.abs(p.price - price) < 1 && p.unit === "kWh"
            )
          ) {
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

  // ── Solar $/W and $/kW ────────────────────────────────────────────────────
  if (
    detectedEquipment.includes("solar") ||
    textLower.includes("solar") ||
    textLower.includes("photovoltaic") ||
    textLower.includes("pv ")
  ) {
    const solarPatterns = [
      PRICE_PATTERNS.solar_watt,
      PRICE_PATTERNS.solar_module,
      PRICE_PATTERNS.solar_kw,
      /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*[Ww](?:att)?/gi,
      /(\d+(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/|a)\s*[Ww](?:att)?/gi,
      /(?:cost|price|priced|pricing|priced\s+at)\s*(?:at|of|is|are|to)?\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*[Ww](?:att)?/gi,
      /solar.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /module.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /panel.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kw(?!h)\s*(?:installed)?/gi,
      // "module prices at $0.25/W"
      /prices?\s+(?:at|of|reached)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
      // "solar pricing: $1.51/W"
      /pricing[:\s]+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
    ];
    for (const pattern of solarPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        const isPerWatt =
          match[0].toLowerCase().includes("watt") ||
          match[0].toLowerCase().includes("/w") ||
          (price >= 0.1 && price <= 5);
        const isPerKW =
          match[0].toLowerCase().includes("/kw") &&
          !match[0].toLowerCase().includes("kwh") &&
          price >= 100 &&
          price <= 5000;
        const context = cleanText.slice(
          Math.max(0, match.index - 100),
          Math.min(cleanText.length, match.index + match[0].length + 100)
        );
        if (isPerWatt && price > 0.1 && price < 5) {
          if (
            !prices.some(
              (p) => p.equipment === "solar" && Math.abs(p.price - price) < 0.01 && p.unit === "W"
            )
          ) {
            prices.push({
              equipment: "solar",
              price,
              unit: "W",
              currency: "USD",
              context,
              confidence: 0.8,
            });
          }
        } else if (isPerKW) {
          if (
            !prices.some(
              (p) => p.equipment === "solar" && Math.abs(p.price - price) < 1 && p.unit === "kW"
            )
          ) {
            prices.push({
              equipment: "solar",
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

  // ── Generator $/kW ────────────────────────────────────────────────────────
  if (
    detectedEquipment.includes("generator") ||
    textLower.includes("generator") ||
    textLower.includes("genset")
  ) {
    const genRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kw(?!h)/gi;
    genRegex.lastIndex = 0;
    let match;
    while ((match = genRegex.exec(cleanText)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 200 && price < 2000) {
        const context = cleanText.slice(
          Math.max(0, match.index - 100),
          Math.min(cleanText.length, match.index + match[0].length + 100)
        );
        if (
          !prices.some(
            (p) => p.equipment === "generator" && Math.abs(p.price - price) < 1 && p.unit === "kW"
          )
        ) {
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

  // ── Wind $/kW ─────────────────────────────────────────────────────────────
  if (
    detectedEquipment.includes("wind") ||
    textLower.includes("wind turbine") ||
    textLower.includes("wind farm")
  ) {
    const windRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kw(?!h)/gi;
    windRegex.lastIndex = 0;
    let match;
    while ((match = windRegex.exec(cleanText)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 500 && price < 5000) {
        const context = cleanText.slice(
          Math.max(0, match.index - 100),
          Math.min(cleanText.length, match.index + match[0].length + 100)
        );
        if (
          !prices.some(
            (p) => p.equipment === "wind" && Math.abs(p.price - price) < 1 && p.unit === "kW"
          )
        ) {
          prices.push({
            equipment: "wind",
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

  // ── EV Charger $/unit ─────────────────────────────────────────────────────
  if (
    detectedEquipment.includes("ev-charger") ||
    textLower.includes("ev charger") ||
    textLower.includes("charging station")
  ) {
    const evRegex =
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station|port)/gi;
    evRegex.lastIndex = 0;
    let match;
    while ((match = evRegex.exec(cleanText)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 100 && price < 500000) {
        const context = cleanText.slice(
          Math.max(0, match.index - 100),
          Math.min(cleanText.length, match.index + match[0].length + 100)
        );
        if (
          !prices.some(
            (p) =>
              p.equipment === "ev-charger" && Math.abs(p.price - price) < 1 && p.unit === "unit"
          )
        ) {
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

  return prices;
}

// ============================================================================
// REGULATION EXTRACTOR
// ============================================================================

/**
 * Extract mentions of regulatory programs (ITC, IRA, net metering, tariffs).
 */
export function extractRegulations(text: string): ExtractedRegulation[] {
  const regulations: ExtractedRegulation[] = [];
  const textLower = text.toLowerCase();

  if (textLower.includes("itc") || textLower.includes("investment tax credit")) {
    const percentMatch = text.match(/(\d+)\s*%\s*(?:itc|investment tax credit)/i);
    regulations.push({
      name: "Investment Tax Credit (ITC)",
      type: "tax_credit",
      detail: percentMatch ? `${percentMatch[1]}% ITC` : "ITC mentioned",
      jurisdiction: "federal",
    });
  }

  if (textLower.includes("ptc") || textLower.includes("production tax credit")) {
    regulations.push({
      name: "Production Tax Credit (PTC)",
      type: "tax_credit",
      detail: "PTC mentioned",
      jurisdiction: "federal",
    });
  }

  if (textLower.includes("inflation reduction act") || textLower.includes(" ira ")) {
    regulations.push({
      name: "Inflation Reduction Act",
      type: "incentive",
      detail: "IRA provisions mentioned",
      jurisdiction: "federal",
    });
  }

  if (textLower.includes("net metering") || textLower.includes("nem")) {
    regulations.push({
      name: "Net Metering",
      type: "net_metering",
      detail: "Net metering policy mentioned",
    });
  }

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
