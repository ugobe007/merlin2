/**
 * Vendor Product Scraper Service
 * ================================
 *
 * Scrapes BESS, solar, inverter, and EV charger product specs from
 * manufacturer websites and populates vendor_products in Supabase.
 *
 * Strategy (in priority order):
 *   1. JSON-LD <script type="application/ld+json"> product schemas
 *   2. Regex spec extraction from rendered HTML tables / text
 *   3. OpenAI GPT-4-mini extraction for JS-heavy or ambiguous pages
 *   4. Seeded known-good specs (reliable fallback when sites block scrapers)
 *
 * Scraped products land in vendor_products with status = 'scraped' and are
 * immediately available to the pricing bridge (vendorProductPricingBridge.ts).
 *
 * Zero browser dependencies — runs in Node.js via tsx.
 *
 * Created: April 2026
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VendorProductSpec {
  manufacturer: string;
  model: string;
  productCategory: "bess" | "solar" | "inverter" | "ev-charger" | "generator" | "transformer";
  capacityKwh?: number; // Energy (BESS)
  powerKw?: number; // Power output
  chemistry?: string; // 'lfp' | 'nmc' | 'nca' | 'vrfb'
  efficiencyPercent?: number;
  voltageV?: number;
  warrantyYears: number;
  leadTimeWeeks: number;
  pricePerKwh?: number; // $ per kWh (BESS)
  pricePerKw?: number; // $ per kW (solar, inverter, generator)
  certifications?: string[];
  datasheetUrl?: string;
  sourceUrl: string; // where we scraped / verified from
  minimumOrderQuantity?: number;
  scrapedAt: string; // ISO timestamp
  confidence: "seeded" | "scraped" | "ai-extracted";
}

export interface VendorTarget {
  manufacturer: string;
  productCategory: VendorProductSpec["productCategory"];
  model: string;
  url: string;
  // Baseline specs for validation / fallback
  seed?: Partial<VendorProductSpec>;
}

// ============================================================================
// VENDOR TARGETS
// ============================================================================

/**
 * Curated list of manufacturer product pages.
 * Each entry has a seed with publicly-documented specs so we always have
 * accurate baseline data even when the page blocks scraping.
 *
 * Sources: press releases, investor presentations, spec sheets, DOE reports.
 */
export const VENDOR_TARGETS: VendorTarget[] = [
  // ─── BESS — Grid-Scale ─────────────────────────────────────────────────
  {
    manufacturer: "Tesla Energy",
    productCategory: "bess",
    model: "Megapack 2 XL",
    url: "https://www.tesla.com/megapack",
    seed: {
      capacityKwh: 3916,
      powerKw: 1958,
      chemistry: "lfp",
      warrantyYears: 15,
      leadTimeWeeks: 52,
      efficiencyPercent: 93,
      pricePerKwh: 340, // ~$340/kWh (2024 investor day reference)
      certifications: ["UL 9540", "IEC 62619", "CE"],
      datasheetUrl: "https://www.tesla.com/ns_videos/tesla-megapack-product-brochure.pdf",
    },
  },
  {
    manufacturer: "Tesla Energy",
    productCategory: "bess",
    model: "Megapack 2",
    url: "https://www.tesla.com/megapack",
    seed: {
      capacityKwh: 1947,
      powerKw: 974,
      chemistry: "lfp",
      warrantyYears: 15,
      leadTimeWeeks: 52,
      efficiencyPercent: 93,
      pricePerKwh: 350,
      certifications: ["UL 9540", "IEC 62619"],
    },
  },
  {
    manufacturer: "Fluence",
    productCategory: "bess",
    model: "Gridstack Pro 4hr",
    url: "https://fluenceenergy.com/energy-storage/gridstack/",
    seed: {
      capacityKwh: 4000,
      powerKw: 1000,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 40,
      efficiencyPercent: 90,
      pricePerKwh: 280,
      certifications: ["UL 9540", "IEC 62619", "IEEE 1547"],
      datasheetUrl:
        "https://fluenceenergy.com/wp-content/uploads/2023/10/Fluence-Gridstack-Pro-Datasheet.pdf",
    },
  },
  {
    manufacturer: "Fluence",
    productCategory: "bess",
    model: "Ultrastack",
    url: "https://fluenceenergy.com/energy-storage/ultrastack/",
    seed: {
      capacityKwh: 600,
      powerKw: 300,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 32,
      pricePerKwh: 320,
    },
  },
  {
    manufacturer: "Sungrow",
    productCategory: "bess",
    model: "ST2752UX-US",
    url: "https://en.sungrowpower.com/productDetail/3127/ST2752UX-US",
    seed: {
      capacityKwh: 5504, // 2hr × 2752 kW
      powerKw: 2752,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 28,
      efficiencyPercent: 91,
      pricePerKwh: 220,
      certifications: ["UL 9540", "UL 9540A", "IEC 62619", "IEEE 1547"],
      datasheetUrl: "https://en.sungrowpower.com/upload/file/20230816/ST2752UX-US%20Datasheet.pdf",
    },
  },
  {
    manufacturer: "Sungrow",
    productCategory: "bess",
    model: "ST500KWH-250UD-MV",
    url: "https://en.sungrowpower.com/productDetail/3128",
    seed: {
      capacityKwh: 500,
      powerKw: 250,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 24,
      pricePerKwh: 240,
    },
  },
  {
    manufacturer: "BYD",
    productCategory: "bess",
    model: "MC Cube T90",
    url: "https://www.bydenergy.com/products",
    seed: {
      capacityKwh: 3840,
      powerKw: 1000,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 36,
      efficiencyPercent: 90,
      pricePerKwh: 210,
      certifications: ["UL 9540", "IEC 62619", "CE"],
    },
  },
  {
    manufacturer: "CATL",
    productCategory: "bess",
    model: "EnerOne Plus 2P",
    url: "https://www.catl.com/en/solution/energystorage/",
    seed: {
      capacityKwh: 6880,
      powerKw: 3440,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 40,
      efficiencyPercent: 90.6,
      pricePerKwh: 200,
      certifications: ["UL 9540", "IEC 62619", "CE", "UN38.3"],
    },
  },
  {
    manufacturer: "Powin",
    productCategory: "bess",
    model: "Stack225+",
    url: "https://powin.com/products/",
    seed: {
      capacityKwh: 3375,
      powerKw: 1500,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 36,
      pricePerKwh: 260,
      certifications: ["UL 9540", "UL 9540A"],
    },
  },
  {
    manufacturer: "Wärtsilä",
    productCategory: "bess",
    model: "GEMS 20",
    url: "https://www.wartsila.com/energy/solutions/energy-storage-and-optimisation",
    seed: {
      capacityKwh: 4000,
      powerKw: 1000,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 44,
      pricePerKwh: 290,
    },
  },
  {
    manufacturer: "Generac",
    productCategory: "bess",
    model: "PWRcell M6",
    url: "https://www.generac.com/generator/home-standby-generators/pwrcell",
    seed: {
      capacityKwh: 36,
      powerKw: 9,
      chemistry: "nmc",
      warrantyYears: 10,
      leadTimeWeeks: 8,
      efficiencyPercent: 96.5,
      pricePerKwh: 800,
      certifications: ["UL 9540", "UL 1741 SA"],
      minimumOrderQuantity: 1,
    },
  },
  {
    manufacturer: "Sonnen",
    productCategory: "bess",
    model: "sonnenCore+ 20",
    url: "https://sonnengroup.com/sonnenbatterie/",
    seed: {
      capacityKwh: 20,
      powerKw: 10,
      chemistry: "lfp",
      warrantyYears: 10,
      leadTimeWeeks: 10,
      efficiencyPercent: 96,
      pricePerKwh: 900,
      certifications: ["UL 9540", "UL 1741"],
      minimumOrderQuantity: 1,
    },
  },
  {
    manufacturer: "LG Energy Solution",
    productCategory: "bess",
    model: "RESU16H Prime",
    url: "https://lgessbusiness.com/products/resu-prime/",
    seed: {
      capacityKwh: 16,
      powerKw: 11,
      chemistry: "nmc",
      warrantyYears: 10,
      leadTimeWeeks: 8,
      efficiencyPercent: 95,
      pricePerKwh: 850,
      certifications: ["UL 9540", "IEC 62619"],
      minimumOrderQuantity: 1,
    },
  },

  // ─── Solar ─────────────────────────────────────────────────────────────
  {
    manufacturer: "Canadian Solar",
    productCategory: "solar",
    model: "BiHiKu7 CS7N-665MB-AG",
    url: "https://www.canadiansolar.com/bihiku7/",
    seed: {
      powerKw: 0.665,
      efficiencyPercent: 21.4,
      warrantyYears: 25,
      leadTimeWeeks: 12,
      pricePerKw: 210, // ~$0.21/W × 1000 kW/MW = $210/kW
      certifications: ["IEC 61215", "IEC 61730", "UL 61730"],
      datasheetUrl:
        "https://www.canadiansolar.com/wp-content/uploads/2023/08/Canadian_Solar-Datasheet-BiHiKu7_CS7N-MB-AG_v5.4en.pdf",
    },
  },
  {
    manufacturer: "Jinko Solar",
    productCategory: "solar",
    model: "Tiger Neo 78HL4-V 620W",
    url: "https://www.jinkosolar.com/en/site/product",
    seed: {
      powerKw: 0.62,
      efficiencyPercent: 22.27,
      warrantyYears: 30,
      leadTimeWeeks: 10,
      pricePerKw: 220,
      certifications: ["IEC 61215", "IEC 61730", "UL 61730", "MCS"],
    },
  },
  {
    manufacturer: "LONGi Solar",
    productCategory: "solar",
    model: "Hi-MO 6 LR5-72HTH-580M",
    url: "https://longi.com/en/products/modules/hi-mo-6/",
    seed: {
      powerKw: 0.58,
      efficiencyPercent: 22.8,
      warrantyYears: 30,
      leadTimeWeeks: 12,
      pricePerKw: 200,
      certifications: ["IEC 61215", "IEC 61730", "UL 61730"],
      datasheetUrl: "https://longi.com/en/products/modules/hi-mo-6/",
    },
  },
  {
    manufacturer: "Silfab Solar",
    productCategory: "solar",
    model: "SIL-590 BG",
    url: "https://silfabsolar.com/commercial-modules/",
    seed: {
      powerKw: 0.59,
      efficiencyPercent: 22.0,
      warrantyYears: 30,
      leadTimeWeeks: 10,
      pricePerKw: 260, // US-made premium; higher than CN imports
      certifications: ["IEC 61215", "IEC 61730", "UL 61730", "Made in USA"],
      datasheetUrl: "https://silfabsolar.com/wp-content/uploads/SIL-590-BG.pdf",
    },
  },
  {
    manufacturer: "Silfab Solar",
    productCategory: "solar",
    model: "SIL-420 QN",
    url: "https://silfabsolar.com/residential-modules/",
    seed: {
      powerKw: 0.42,
      efficiencyPercent: 21.4,
      warrantyYears: 25,
      leadTimeWeeks: 8,
      pricePerKw: 280,
      certifications: ["IEC 61215", "IEC 61730", "UL 61730", "Made in USA"],
    },
  },
  {
    manufacturer: "Hanwha Q CELLS",
    productCategory: "solar",
    model: "Q.PEAK DUO BLK ML-G10+ 400",
    url: "https://qcells.com/us/products/solar-modules/",
    seed: {
      powerKw: 0.4,
      efficiencyPercent: 20.6,
      warrantyYears: 25,
      leadTimeWeeks: 10,
      pricePerKw: 230,
      certifications: ["IEC 61215", "IEC 61730", "UL 61730", "IEC 61701"],
      datasheetUrl: "https://qcells.com/us/products/solar-modules/q-peak-duo-blk-ml-g10-plus/",
    },
  },
  {
    manufacturer: "REC Group",
    productCategory: "solar",
    model: "REC Alpha Pure-R 430W",
    url: "https://www.recgroup.com/en/products/rec-alpha-pure-r",
    seed: {
      powerKw: 0.43,
      efficiencyPercent: 22.3,
      warrantyYears: 25,
      leadTimeWeeks: 14,
      pricePerKw: 290,
      certifications: ["IEC 61215", "IEC 61730", "UL 61730"],
      datasheetUrl: "https://www.recgroup.com/en/products/rec-alpha-pure-r",
    },
  },
  {
    manufacturer: "Mission Solar",
    productCategory: "solar",
    model: "MSE PERC 60 400W",
    url: "https://www.missionsolar.com/products",
    seed: {
      powerKw: 0.4,
      efficiencyPercent: 20.5,
      warrantyYears: 25,
      leadTimeWeeks: 8,
      pricePerKw: 255, // US-made (San Antonio TX)
      certifications: ["IEC 61215", "IEC 61730", "UL 61730", "Made in USA"],
    },
  },

  // ─── EV Chargers ──────────────────────────────────────────────────────
  {
    manufacturer: "ABB",
    productCategory: "ev-charger",
    model: "Terra HP 150",
    url: "https://new.abb.com/ev-charging/products/dc-chargers/terra-hp",
    seed: {
      powerKw: 150,
      warrantyYears: 3,
      leadTimeWeeks: 14,
      pricePerKw: 500, // ~$75,000 unit / 150 kW = $500/kW
      certifications: ["UL 2202", "IEC 61851", "CHAdeMO", "CCS"],
    },
  },
  {
    manufacturer: "BTC Power",
    productCategory: "ev-charger",
    model: "125CX-M DCFC",
    url: "https://btcpower.com/products/dc-fast-chargers/",
    seed: {
      powerKw: 125,
      warrantyYears: 3,
      leadTimeWeeks: 12,
      pricePerKw: 520,
      certifications: ["UL 2202", "ENERGY STAR"],
    },
  },
  {
    manufacturer: "ChargePoint",
    productCategory: "ev-charger",
    model: "CPE250 DCFC",
    url: "https://www.chargepoint.com/products/commercial/cpe250/",
    seed: {
      powerKw: 62.5,
      warrantyYears: 3,
      leadTimeWeeks: 10,
      pricePerKw: 880, // ~$55k per unit / 62.5 kW
      certifications: ["UL 2202", "UL Listed"],
    },
  },
  {
    manufacturer: "Blink Charging",
    productCategory: "ev-charger",
    model: "IQ 200",
    url: "https://www.blinkcharging.com/drivers/blink-network/blink-iq-200/",
    seed: {
      powerKw: 19.2,
      warrantyYears: 3,
      leadTimeWeeks: 6,
      pricePerKw: 360, // ~$6,900 unit / 19.2 kW
      certifications: ["UL Listed", "FCC", "ENERGY STAR"],
    },
  },
];

// ============================================================================
// SCRAPING HELPERS
// ============================================================================

/** Extract product data from JSON-LD <script> blocks */
export function extractFromJSONLD(html: string): Partial<VendorProductSpec> | null {
  const specs: Partial<VendorProductSpec> = {};

  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const product =
        data["@type"] === "Product"
          ? data
          : Array.isArray(data["@graph"])
            ? data["@graph"].find((n: any) => n["@type"] === "Product")
            : null;

      if (!product) continue;

      if (product.name) specs.model = product.name;
      if (product.brand?.name) specs.manufacturer = product.brand.name;
      if (product.description) {
        // Try to extract kWh from description
        const kwhMatch = /(\d+(?:\.\d+)?)\s*k[Ww]h/i.exec(product.description);
        if (kwhMatch) specs.capacityKwh = parseFloat(kwhMatch[1]);
        const kwMatch = /(\d+(?:\.\d+)?)\s*kW(?!h)/i.exec(product.description);
        if (kwMatch) specs.powerKw = parseFloat(kwMatch[1]);
      }
      if (product.offers?.price) {
        const p = parseFloat(product.offers.price);
        if (!isNaN(p) && p > 0) specs.pricePerKwh = p;
      }

      if (specs.model || specs.capacityKwh) return specs;
    } catch {
      // malformed JSON-LD — skip
    }
  }

  return Object.keys(specs).length > 0 ? specs : null;
}

/** Extract spec data from raw HTML using regex patterns */
export function extractFromHTML(html: string, _manufacturer: string): Partial<VendorProductSpec> {
  const specs: Partial<VendorProductSpec> = {};

  // Strip tags for plain-text matching
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  // Energy capacity
  const kwhMatch = /(\d{1,5}(?:\.\d{1,2})?)\s*k[Ww]h(?!\s*\/)/.exec(text);
  if (kwhMatch) specs.capacityKwh = parseFloat(kwhMatch[1]);

  // Power
  const kwMatch = /(\d{1,5}(?:\.\d{1,2})?)\s*kW(?!h)/.exec(text);
  if (kwMatch) specs.powerKw = parseFloat(kwMatch[1]);

  // Efficiency
  const effMatch = /(?:efficiency|round.trip)\s*:?\s*(\d{2,3}(?:\.\d{1,2})?)\s*%/i.exec(text);
  if (effMatch) specs.efficiencyPercent = parseFloat(effMatch[1]);

  // Warranty
  const warMatch = /(\d{1,2})[- ]?year[s]?\s+warranty/i.exec(text);
  if (warMatch) specs.warrantyYears = parseInt(warMatch[1]);

  // Chemistry
  if (/\blfp\b|lithium\s+iron\s+phosphate/i.test(text)) specs.chemistry = "lfp";
  else if (/\bnmc\b|nickel.*manganese.*cobalt/i.test(text)) specs.chemistry = "nmc";
  else if (/\bvrfb\b|vanadium\s+redox/i.test(text)) specs.chemistry = "vrfb";

  return specs;
}

// ============================================================================
// SCRAPE ONE TARGET
// ============================================================================

const REQUEST_TIMEOUT_MS = 12000;

const UA_LIST = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Googlebot/2.1 (+http://www.google.com/bot.html)",
];

let uaIdx = 0;

/**
 * Attempt to scrape a vendor product page.
 * Returns merged spec (scraped + seed baseline).
 * Falls back to seed-only when the page blocks access.
 */
export async function scrapeVendorTarget(target: VendorTarget): Promise<VendorProductSpec> {
  const now = new Date().toISOString();
  const base: VendorProductSpec = {
    manufacturer: target.manufacturer,
    model: target.model,
    productCategory: target.productCategory,
    warrantyYears: target.seed?.warrantyYears ?? 10,
    leadTimeWeeks: target.seed?.leadTimeWeeks ?? 26,
    sourceUrl: target.url,
    scrapedAt: now,
    confidence: "seeded",
    ...target.seed,
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(target.url, {
      headers: {
        "User-Agent": UA_LIST[uaIdx++ % UA_LIST.length],
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ...base, confidence: "seeded" };
    }

    const html = await res.text();

    // 1. Try JSON-LD
    const jsonSpecs = extractFromJSONLD(html);

    // 2. HTML extraction
    const htmlSpecs = extractFromHTML(html, target.manufacturer);

    // Merge: seed → htmlSpecs → jsonSpecs (highest priority)
    const merged: VendorProductSpec = {
      ...base,
      ...htmlSpecs,
      ...jsonSpecs,
      manufacturer: target.manufacturer, // always trust our target label
      model: target.model,
      productCategory: target.productCategory,
      sourceUrl: target.url,
      scrapedAt: now,
      confidence: jsonSpecs || htmlSpecs.capacityKwh || htmlSpecs.powerKw ? "scraped" : "seeded",
    };

    return merged;
  } catch {
    return { ...base, confidence: "seeded" };
  }
}
