import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Supabase Edge Function: Daily Market Data Scraper
 * 
 * This function scrapes RSS feeds and extracts market pricing data.
 * Scheduled to run daily via Supabase cron.
 * 
 * Equipment types tracked:
 * - BESS, Solar, Wind, Generators (combustion + linear)
 * - Inverters, Transformers, Switchgear
 * - DC/AC Panels, EV Chargers (L1, L2, DCFC)
 * - ESS, BMS, AI Energy Management
 * - Microgrids, Hybrid Systems
 * 
 * Also tracks regulations and incentives.
 * 
 * Created: December 10, 2025
 */

const EQUIPMENT_KEYWORDS: Record<string, string[]> = {
  bess: ['battery energy storage', 'bess', 'battery storage', 'lithium-ion', 'lfp', 'nmc', 'megapack',
    'energy storage system', 'grid storage', 'utility storage', 'mwh storage', 'gwh storage',
    'four-hour storage', '4-hour storage', 'long duration storage', 'grid-scale battery'],
  solar: ['solar', 'pv', 'photovoltaic', 'solar panel', 'solar module', 'solar farm', 'solar project',
    'solar plant', 'solar array', 'bifacial', 'solar capex', 'solar installation',
    'utility-scale solar', 'commercial solar', 'industrial solar', 'rooftop solar'],
  wind: ['wind turbine', 'wind farm', 'wind power', 'offshore wind', 'onshore wind',
    'wind energy', 'wind project', 'wind capacity', 'wind installation'],
  generator: ['generator', 'diesel generator', 'natural gas generator', 'backup generator',
    'standby generator', 'genset', 'emergency power', 'prime power'],
  'linear-generator': ['linear generator', 'mainspring', 'fuel cell', 'hydrogen generator'],
  inverter: ['inverter', 'solar inverter', 'microinverter', 'string inverter', 'central inverter',
    'power converter', 'pcs', 'power conversion system'],
  transformer: ['transformer', 'power transformer', 'distribution transformer', 'substation'],
  switchgear: ['switchgear', 'circuit breaker', 'protection relay', 'electrical panel'],
  'ev-charger': ['ev charger', 'charging station', 'dcfc', 'dc fast charge', 'level 2 charger',
    'commercial ev charging', 'fleet charging', 'workplace charging', 'charging infrastructure'],
  bms: ['battery management system', 'bms', 'battery monitoring', 'cell balancing'],
  microgrid: ['microgrid', 'micro-grid', 'islanded', 'distributed energy', 'virtual power plant',
    'vpp', 'demand response', 'behind-the-meter'],
  'hybrid-system': ['hybrid system', 'solar+storage', 'solar-plus-storage', 'solar and storage',
    'wind-solar', 'combined system', 'hybrid plant']
};

// ══════════════════════════════════════════════════════════════════════════════
// 3-GATE PIPELINE
//   Gate 1 — Junk Filter:          consumer/automotive noise → discard
//   Gate 2 — Opportunity Check:    real company + real project/transaction → keep
//   Gate 3 — Extraction Pipeline:  classify topics, extract prices, save to DB
// ══════════════════════════════════════════════════════════════════════════════

// ─── Gate 1: Consumer / automotive noise ─────────────────────────────────────
const CONSUMER_NOISE_PATTERNS: RegExp[] = [
  /\be-?bike\b/i,
  /\bscooter\b/i,
  /electric\s+(?:motorcycle|moped|skateboard|bicycle|boat|ferry|ship|plane|aircraft|van|truck|car|suv|sedan|hatchback|pickup)\b/i,
  /\bFSD\b|\bfull\s+self.driving\b/i,
  /\bTesla\s+(?:model\s+[sxy3]|cybertruck|roadster|semi|plaid)\b/i,
  /\brivian\s+r[12]\b/i,
  /(?:honda|hyundai|toyota|nissan|ford|chevy|bmw|audi|volvo|kia|mazda|volkswagen|vw)\s+(?:ev|electric|ioniq|bz|leaf|bolt|mach)\b/i,
  /\bEV\s+(?:sales|review|test\s+drive|range|ownership|rebate|tax\s+credit)\b/i,
  /\bconsumer\s+(?:ev|electric)\b/i,
  /\bpodcast\b.*\b(?:ev|tesla|electric\s+car)\b/i,
  /\bused\s+ev\b/i,
  /\bcharging\s+speed\b|\bmiles\s+of\s+range\b/i,
  /\bhands.on\b|\bfirst\s+drive\b|\btest\s+drive\b|\blong.term\s+review\b/i,
  /\bearnings\s+(?:call|report|beat|miss)\b|\bstock\s+(?:price|market|rally|drop)\b/i,
  /\bshare\s+price\b|\bmarket\s+cap\b|\binvestor\s+day\b/i,
];

// Commercial signals that override the noise filter
const COMMERCIAL_OVERRIDE = /\b(?:utility.scale|grid.scale|commercial|industrial|power\s+plant|mw\b|gw\b|gwh|mwh|capacity\s+factor|power\s+purchase|ppa|offtake|c&i|fleet\s+charg|workplace\s+charg|campus\s+charg)\b/i;

/** Gate 1: true = junk, discard immediately */
function isConsumerNoise(title: string, content: string): boolean {
  const combined = `${title} ${content.slice(0, 500)}`;
  if (!CONSUMER_NOISE_PATTERNS.some(p => p.test(combined))) return false;
  return !COMMERCIAL_OVERRIDE.test(combined);
}

// ─── Gate 2: Commercial opportunity validator ─────────────────────────────────
// Signals that identify a real company operating in the energy space
const COMPANY_SIGNALS = /\b(?:nextera|aes\b|orsted|rwe\b|enel\b|sunpower|first\s+solar|enphase|solarwinds|tesla\s+energy|fluence|powin|eos\b|stem\b|nec\s+energy|samsung\s+sdi|lg\s+energy|catl\b|byd\b|panasonic|siemens\s+energy|ge\s+vernova|schneider|abb\b|eaton\b|cummins\b|caterpillar\b|generac|pge\b|pg&e|sce\b|con\s*ed|duke\s+energy|dominion\b|entergy\b|exelon\b|constellation\b|nrg\b|vistra\b|talen\b|cleco\b|ica\s+fluor|bechtel\b|black\s+&\s+veatch|burn\s+stewart|strata\s+solar|cypress\s+creek|invenergy|clearway|sPower|engie\b|total\s*energies|bp\b|shell\s+energy|chevron\b|exxon\b|equinor\b|calpine\b|amp\s+solar|terra-gen|leeward|avangrid|berkshire\s+hathaway\s+energy|pattern\s+energy|sempra|xcel\s+energy|avista\b|idaho\s+power|evergy\b|aps\b|pso\b|swepco\b)\b/i;

// Project-scale indicators (MW/GW + number, or MWh/GWh)
const PROJECT_SCALE = /\b\d+(?:\.\d+)?\s*(?:mw|gw|gwh|mwh|kw|kwh)\b/i;

// Commercial transaction signals
const TRANSACTION_SIGNALS = /\b(?:contract|award(?:ed)?|ppa|power\s+purchase\s+agreement|offtake|procurement|tender|rfp|rfi|bid|selected|commissioned|broke\s+ground|financial\s+close|reached\s+cod|interconnection\s+agreement|grid\s+connection)\b/i;

// Commercial buyer / facility type signals
const BUYER_SIGNALS = /\b(?:data\s+center|hospital|municipality|school\s+district|campus|warehouse|manufacturing\s+facility|military\s+base|airport|port\b|commercial\s+building|office\s+park|industrial\s+park|shopping\s+center|grocery|hotel\b|resort\b|brewery|refinery|mine\b|mining\b|wastewater|water\s+treatment|transit\s+authority|transit\s+depot|bus\s+depot|fleet\s+depot|utility\s+customer|c&i\s+customer)\b/i;

// Signals that confirm market/price data worth ingesting even without a named project
const MARKET_DATA_SIGNALS = /\b(?:\$\s*\d+(?:\.\d+)?\s*(?:\/|per)\s*(?:kwh|mwh|kw|mw|watt|w\b)|lcoe|capex\s+(?:fell|rose|dropped|increased|declined)|module\s+price|battery\s+price|panel\s+cost|installation\s+cost|levelized\s+cost)\b/i;

interface GateResult {
  pass: boolean;
  gate?: 1 | 2;
  reason: string;
}

/**
 * 3-Gate pipeline gate: decides whether to run the extraction pipeline.
 * Returns { pass: true } if the article should be processed, or
 * { pass: false, gate, reason } with the gate number that rejected it.
 */
function evaluatePipelineGates(title: string, content: string): GateResult {
  const combined = `${title} ${content.slice(0, 800)}`;

  // ── Gate 1: Junk filter ────────────────────────────────────────────────────
  if (isConsumerNoise(title, content)) {
    return { pass: false, gate: 1, reason: 'consumer-noise' };
  }

  // ── Gate 2: Is this a real commercial opportunity? ─────────────────────────
  // Pass if ANY two of the five positive signal groups fire, OR if there is
  // concrete market-price data (always worth ingesting for the pricing pipeline)
  if (MARKET_DATA_SIGNALS.test(combined)) {
    return { pass: true, reason: 'market-price-data' };
  }

  let positiveGroups = 0;
  if (COMPANY_SIGNALS.test(combined))    positiveGroups++;
  if (PROJECT_SCALE.test(combined))      positiveGroups++;
  if (TRANSACTION_SIGNALS.test(combined)) positiveGroups++;
  if (BUYER_SIGNALS.test(combined))      positiveGroups++;
  // Also count equipment keywords as a positive group
  const hasEquipment = Object.values(EQUIPMENT_KEYWORDS).some(kws =>
    kws.some(kw => combined.toLowerCase().includes(kw.toLowerCase()))
  );
  if (hasEquipment) positiveGroups++;

  if (positiveGroups < 2) {
    return {
      pass: false,
      gate: 2,
      reason: `insufficient-signals (${positiveGroups}/2 needed: company=${COMPANY_SIGNALS.test(combined)}, scale=${PROJECT_SCALE.test(combined)}, transaction=${TRANSACTION_SIGNALS.test(combined)}, buyer=${BUYER_SIGNALS.test(combined)}, equipment=${hasEquipment})`
    };
  }

  return { pass: true, reason: `${positiveGroups}-positive-groups` };
}

function parseRSSFeed(xml: string): Array<{
  title: string;
  link: string;
  description: string;
  pubDate: string;
  content: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
    content: string;
  }> = [];
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    items.push({
      title: extractTag(itemXml, 'title'),
      link: extractTag(itemXml, 'link') || extractAttr(itemXml, 'link', 'href'),
      description: extractTag(itemXml, 'description'),
      pubDate: extractTag(itemXml, 'pubDate'),
      content: extractTag(itemXml, 'content:encoded') || extractTag(itemXml, 'description')
    });
  }
  
  // Atom format
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    items.push({
      title: extractTag(entryXml, 'title'),
      link: extractAttr(entryXml, 'link', 'href'),
      description: extractTag(entryXml, 'summary'),
      pubDate: extractTag(entryXml, 'published') || extractTag(entryXml, 'updated'),
      content: extractTag(entryXml, 'content') || extractTag(entryXml, 'summary')
    });
  }
  
  return items;
}

function extractTag(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const simpleRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();
  
  const simpleMatch = simpleRegex.exec(xml);
  return simpleMatch ? simpleMatch[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["']`, 'i');
  const match = regex.exec(xml);
  return match ? match[1] : '';
}

function classifyContent(text: string): {
  equipment: string[];
  topics: string[];
  relevanceScore: number;
} {
  const textLower = text.toLowerCase();
  const equipment: string[] = [];
  const topics: string[] = [];
  let relevanceScore = 0;
  
  for (const [category, keywords] of Object.entries(EQUIPMENT_KEYWORDS)) {
    const matches = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      equipment.push(category);
      relevanceScore += matches.length * 0.1;
    }
  }
  
  // Pricing topics
  if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('$/') ||
      textLower.includes('capex') || textLower.includes('opex') || textLower.includes('per kwh') ||
      textLower.includes('per mwh') || textLower.includes('per watt')) {
    topics.push('pricing');
    relevanceScore += 0.3;
  }
  // Policy / regulation
  if (textLower.includes('regulation') || textLower.includes('policy') || textLower.includes('incentive') ||
      textLower.includes('tariff') || textLower.includes('ira ') || textLower.includes('investment tax credit') ||
      textLower.includes('itc') || textLower.includes('ceqa') || textLower.includes('ferc') ||
      textLower.includes('legislation') || textLower.includes('mandate') || textLower.includes('subsidy')) {
    topics.push('policy');
    relevanceScore += 0.2;
  }
  // Grid / infrastructure
  if (textLower.includes('grid') || textLower.includes('interconnect') || textLower.includes('substation') ||
      textLower.includes('transmission') || textLower.includes('utility') || textLower.includes('iso ') ||
      textLower.includes('rto ') || textLower.includes('capacity market') || textLower.includes('ancillary')) {
    topics.push('grid');
    relevanceScore += 0.15;
  }
  // Project / market news
  if (textLower.includes('mw ') || textLower.includes('mwh ') || textLower.includes('gw ') ||
      textLower.includes('gwh ') || textLower.includes('project') || textLower.includes('deployment') ||
      textLower.includes('installation') || textLower.includes('contract') || textLower.includes('award') ||
      textLower.includes('capacity')) {
    topics.push('projects');
    relevanceScore += 0.1;
  }
  // Market / supply chain
  if (textLower.includes('supply chain') || textLower.includes('manufacturing') || textLower.includes('production') ||
      textLower.includes('market share') || textLower.includes('shipment') || textLower.includes('gigafactory') ||
      textLower.includes('factory') || textLower.includes('vendor') || textLower.includes('supplier')) {
    topics.push('manufacturing');
    relevanceScore += 0.1;
  }
  // Financing / investment
  if (textLower.includes('financing') || textLower.includes('investment') || textLower.includes('ppa') ||
      textLower.includes('power purchase') || textLower.includes('offtake') || textLower.includes('funding') ||
      textLower.includes('loan') || textLower.includes('bond') || textLower.includes('equity')) {
    topics.push('financing');
    relevanceScore += 0.1;
  }
  // Performance / technology
  if (textLower.includes('efficiency') || textLower.includes('performance') || textLower.includes('degradation') ||
      textLower.includes('lifespan') || textLower.includes('cycle life') || textLower.includes('capacity factor') ||
      textLower.includes('roundtrip') || textLower.includes('energy density')) {
    topics.push('performance');
    relevanceScore += 0.1;
  }
  // Sustainability / ESG
  if (textLower.includes('carbon') || textLower.includes('emission') || textLower.includes('sustainability') ||
      textLower.includes('net zero') || textLower.includes('decarboniz') || textLower.includes('renewable')) {
    topics.push('sustainability');
    relevanceScore += 0.05;
  }

  // No classification at all → score is 0, not a default 0.5
  return { equipment, topics, relevanceScore: Math.min(1, relevanceScore) };
}

// ── Price extractor helpers ──────────────────────────────────────────────────
function _preprocessText(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function _detectEquipment(text: string): string[] {
  const eq: string[] = [];
  if (text.includes('battery') || text.includes('bess') || text.includes('energy storage') ||
      text.includes('utility-scale storage') || text.includes('lcos') ||
      text.includes('levelized cost') ||
      (text.includes('storage') && (text.includes('/kwh') || text.includes('per kwh'))))
    eq.push('bess');
  if (text.includes('solar') || text.includes('photovoltaic') || text.includes('pv '))
    eq.push('solar');
  if (text.includes('wind turbine') || text.includes('wind farm')) eq.push('wind');
  if (text.includes('generator') || text.includes('genset')) eq.push('generator');
  if (text.includes('ev charger') || text.includes('charging station')) eq.push('ev-charger');
  return eq;
}

function extractPrices(text: string, equipment: string[]): Array<{
  equipment: string;
  price: number;
  unit: string;
  context: string;
  confidence: number;
}> {
  type P = { equipment: string; price: number; unit: string; context: string; confidence: number };
  const prices: P[] = [];
  const clean = _preprocessText(text);
  const lower = clean.toLowerCase();
  const eq = equipment.length > 0 ? equipment : _detectEquipment(lower);

  const ctx = (idx: number, len: number) =>
    clean.slice(Math.max(0, idx - 100), Math.min(clean.length, idx + len + 100));
  const dup = (e: string, p: number, u: string) =>
    prices.some(x => x.equipment === e && Math.abs(x.price - p) < 1 && x.unit === u);

  // ── BESS $/kWh ─────────────────────────────────────────────────────────────
  if (eq.includes('bess') || lower.includes('battery') || lower.includes('energy storage') ||
      lower.includes('bess') || lower.includes('lcos') || lower.includes('levelized cost')) {
    const bessPatterns: RegExp[] = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*k[Ww]h/gi,
      /(?:battery|bess|storage)\s+(?:cost|price|pricing)s?\s+(?:fell|dropped|declined|reached|at|to|of)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k[Ww]h/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)\s*(?:installed)?/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*M[Ww]h/gi,
      /(?:lcos|levelized\s+cost\s+of\s+(?:storage|energy|electricity))\s*(?:of|at|:)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:to\s+\$?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?)?\s*(?:\/|per|a)?\s*[Mk][Ww]h/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/|a)\s*kwh/gi,
      /(?:cost|price|priced|pricing|priced\s+at)\s*(?:at|of|is|are|to)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
      /battery.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      /storage.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      /costs?\s+(?:fell|dropped|declined|decreased|reduced|dropped\s+to)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|a)\s*k(?:ilo)?[Ww](?:att)?[Hh](?:our)?/gi,
      /at\s+\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kwh\s*installed/gi,
    ];
    for (const pat of bessPatterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(clean)) !== null) {
        const raw = parseFloat(m[1].replace(/,/g, ''));
        const isMWh = m[0].toLowerCase().includes('mwh');
        if (isMWh) {
          // $/MWh prices (LCOS, auction bids) — store as-is, guard: 20–500 $/MWh
          if (raw > 20 && raw < 500 && !dup('bess', raw, 'MWh')) {
            prices.push({ equipment: 'bess', price: raw, unit: 'MWh', context: ctx(m.index, m[0].length), confidence: 0.75 });
          }
        } else {
          // $/kWh capital cost — guard: 50–2000 $/kWh
          if (raw > 50 && raw < 2000 && !dup('bess', raw, 'kWh')) {
            prices.push({ equipment: 'bess', price: raw, unit: 'kWh', context: ctx(m.index, m[0].length), confidence: 0.8 });
          }
        }
      }
    }
    // Project-cost-derived: "$50 million 200 MWh" → $/kWh
    const projPat = /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:million|billion|M|B)\s+(?:[^$\d]+)?\s*(\d+(?:\.\d{1,2})?)\s*[Mm][Ww]h/gi;
    projPat.lastIndex = 0;
    let pm;
    while ((pm = projPat.exec(clean)) !== null) {
      const dollarAmt = parseFloat(pm[1]);
      const mwhAmt = parseFloat(pm[2]);
      const mult = pm[0].toLowerCase().includes('billion') ? 1e9 : 1e6;
      if (dollarAmt > 0 && mwhAmt > 0) {
        const derived = (dollarAmt * mult) / (mwhAmt * 1000);
        if (derived > 50 && derived < 2000 && !dup('bess', Math.round(derived), 'kWh')) {
          prices.push({ equipment: 'bess', price: Math.round(derived), unit: 'kWh', context: `[derived] ${ctx(pm.index, pm[0].length)}`, confidence: 0.6 });
        }
      }
    }
  }

  // ── Solar $/W and $/kW ─────────────────────────────────────────────────────
  if (eq.includes('solar') || lower.includes('solar') || lower.includes('photovoltaic') || lower.includes('pv ')) {
    const solarPatterns: RegExp[] = [
      /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
      /(?:module|panel|solar)\s+(?:cost|price|pricing)s?\s+(?:at|of|to|reached)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)\s*(?:installed)?/gi,
      /(?:ppa|auction|bid|contract)\s+(?:price|rate|at)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi,
      /(\d+(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/|a)\s*[Ww](?:att)?/gi,
      /(?:cost|price|priced|pricing)\s*(?:at|of|is|are|to)?\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*[Ww](?:att)?/gi,
      /solar.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /module.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /prices?\s+(?:at|of|reached)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
    ];
    for (const pat of solarPatterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(clean)) !== null) {
        const price = parseFloat(m[1].replace(/,/g, ''));
        const isPerWatt = m[0].toLowerCase().includes('watt') || m[0].toLowerCase().includes('/w') || (price >= 0.1 && price <= 5);
        const isPerKW = m[0].toLowerCase().includes('/kw') && !m[0].toLowerCase().includes('kwh') && price >= 100 && price <= 5000;
        if (isPerWatt && price > 0.1 && price < 5 && !dup('solar', price, 'W')) {
          prices.push({ equipment: 'solar', price, unit: 'W', context: ctx(m.index, m[0].length), confidence: 0.8 });
        } else if (isPerKW && !dup('solar', price, 'kW')) {
          prices.push({ equipment: 'solar', price, unit: 'kW', context: ctx(m.index, m[0].length), confidence: 0.7 });
        }
      }
    }
  }

  // ── Wind $/kW ──────────────────────────────────────────────────────────────
  if (eq.includes('wind') || lower.includes('wind turbine') || lower.includes('wind farm')) {
    const windPat = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi;
    windPat.lastIndex = 0;
    let m;
    while ((m = windPat.exec(clean)) !== null) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price > 500 && price < 5000 && !dup('wind', price, 'kW')) {
        prices.push({ equipment: 'wind', price, unit: 'kW', context: ctx(m.index, m[0].length), confidence: 0.7 });
      }
    }
  }

  // ── Generator $/kW ─────────────────────────────────────────────────────────
  if (eq.includes('generator') || lower.includes('generator') || lower.includes('genset')) {
    const genPat = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi;
    genPat.lastIndex = 0;
    let m;
    while ((m = genPat.exec(clean)) !== null) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price > 200 && price < 2000 && !dup('generator', price, 'kW')) {
        prices.push({ equipment: 'generator', price, unit: 'kW', context: ctx(m.index, m[0].length), confidence: 0.7 });
      }
    }
  }

  // ── EV Charger $/unit ──────────────────────────────────────────────────────
  if (eq.includes('ev-charger') || lower.includes('ev charger') || lower.includes('charging station')) {
    const evPat = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station|port)/gi;
    evPat.lastIndex = 0;
    let m;
    while ((m = evPat.exec(clean)) !== null) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price > 100 && price < 500000 && !dup('ev-charger', price, 'unit')) {
        prices.push({ equipment: 'ev-charger', price, unit: 'unit', context: ctx(m.index, m[0].length), confidence: 0.7 });
      }
    }
  }

  return prices;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Starting daily market data scrape...');
    
    const results = {
      sourcesProcessed: 0,
      articlesFound: 0,
      gate1Skipped: 0,
      gate2Skipped: 0,
      articlesSaved: 0,
      pricesExtracted: 0,
      errors: [] as string[]
    };
    
    // Get all active RSS sources
    const { data: sources, error } = await supabase
      .from('market_data_sources')
      .select('*')
      .eq('is_active', true)
      .eq('source_type', 'rss_feed')
      .not('feed_url', 'is', null)
      .order('reliability_score', { ascending: false })
      .limit(50);  // Limit to prevent timeout
    
    if (error || !sources) {
      throw new Error(`Failed to fetch sources: ${error?.message}`);
    }
    
    console.log(`Found ${sources.length} RSS sources`);
    
    for (const source of sources) {
      try {
        console.log(`Processing: ${source.name}`);
        
        const response = await fetch(source.feed_url, {
          headers: {
            'User-Agent': 'Merlin-BESS-QuoteBuilder/1.0',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const xml = await response.text();
        const items = parseRSSFeed(xml);
        results.articlesFound += items.length;
        
        for (const item of items.slice(0, 20)) {  // Limit items per source
          const { data: existing } = await supabase
            .from('scraped_articles')
            .select('id')
            .eq('url', item.link)
            .single();
          
          if (existing) continue;
          
          const fullText = `${item.title} ${item.content}`;

          // ══════════════════════════════════════════════════════════════
          // 3-GATE PIPELINE
          // ══════════════════════════════════════════════════════════════
          // Gate 1 + Gate 2 evaluated together:
          const gate = evaluatePipelineGates(item.title, item.content);
          if (!gate.pass) {
            console.log(`  [GATE ${gate.gate} SKIP] ${gate.reason}: ${item.title.slice(0, 60)}`);
            if (gate.gate === 1) results.gate1Skipped++;
            else results.gate2Skipped++;
            continue;
          }
          // ── Gate 3: Extraction pipeline ──────────────────────────────
          const classification = classifyContent(fullText);
          const prices = extractPrices(fullText, classification.equipment);

          const { error: insertError } = await supabase
            .from('scraped_articles')
            .insert({
              source_id: source.id,
              title: item.title,
              url: item.link,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              excerpt: item.description?.slice(0, 500),
              content: item.content,
              topics: classification.topics,
              equipment_mentioned: classification.equipment,
              prices_extracted: prices,
              relevance_score: classification.relevanceScore,
              is_processed: true
            });
          
          if (!insertError) {
            results.articlesSaved++;
            
            for (const price of prices) {
              await supabase.from('collected_market_prices').insert({
                source_id: source.id,
                equipment_type: price.equipment,
                price_per_unit: price.price,
                unit: price.unit,
                currency: 'USD',
                confidence_score: price.confidence,
                price_date: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                raw_text: price.context,
                extraction_method: 'regex'
              });
              results.pricesExtracted++;
            }
          }
        }
        
        // Update source status
        await supabase
          .from('market_data_sources')
          .update({
            last_fetch_at: new Date().toISOString(),
            last_fetch_status: 'success',
            fetch_error_count: 0
          })
          .eq('id', source.id);
        
        results.sourcesProcessed++;
        
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`${source.name}: ${errorMsg}`);
        
        await supabase
          .from('market_data_sources')
          .update({
            last_fetch_at: new Date().toISOString(),
            last_fetch_status: 'failed'
          })
          .eq('id', source.id);
      }
    }
    
    console.log('Scrape complete:', results);
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
