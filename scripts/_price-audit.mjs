/**
 * Price extraction audit + backfill
 * - Audits existing articles that contain price text
 * - Runs the extractPrices logic (ported inline, Node-compatible)
 * - Backfills prices_extracted for any articles where extraction now succeeds
 */
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.fvmpmozybmtzjvikrctq.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'YSyHG0FABFExsH9P',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  family: 4
});

// ── Inline price extractor (ported from marketDataParser.ts) ─────────────────

const PRICE_PATTERNS = {
  bess_kwh:    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*k[Ww]h/gi,
  bess_mwh:    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*M[Ww]h/gi,
  bess_kw:     /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)\s*(?:installed)?/gi,
  solar_watt:  /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
  solar_kw:    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi,
  ev_unit:     /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*(?:charger|unit|station|port)/gi,
};

const BESS_GENERIC = [
  /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
  /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/|a)\s*kwh/gi,
  /(?:cost|price|priced|pricing)\s*(?:at|of|is|are|to)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
  /battery.*?(?:cost|price)s?\s*(?:at|of|to|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*kwh/gi,
  /storage.*?(?:cost|price)s?\s*(?:at|of|to|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*kwh/gi,
  /costs?\s+(?:fell|dropped|declined|decreased|reduced)\s+to\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|a)\s*kwh/gi,
];

function preprocessText(text) {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function extractPrices(rawText) {
  const prices = [];
  const cleanText = preprocessText(rawText);
  const textLower = cleanText.toLowerCase();

  const isBESS = /battery|bess|energy storage|lithium|kwh/i.test(textLower);
  const isSolar = /solar|photovoltaic|\bpv\b/i.test(textLower);

  const pushPrice = (equipment, price, unit, context, confidence) => {
    if (!prices.some(p => p.equipment === equipment && Math.abs(p.price - price) < 0.01 && p.unit === unit)) {
      prices.push({ equipment, price, unit, currency: 'USD', context: context.slice(0, 200), confidence });
    }
  };

  // BESS $/kWh
  if (isBESS) {
    const allPatterns = [PRICE_PATTERNS.bess_kwh, ...BESS_GENERIC];
    for (const pattern of allPatterns) {
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(cleanText)) !== null) {
        const raw = parseFloat(m[1].replace(/,/g, ''));
        const price = m[0].toLowerCase().includes('mwh') ? raw / 1000 : raw;
        if (price > 50 && price < 2000) {
          const ctx = cleanText.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
          pushPrice('bess', price, 'kWh', ctx, 0.8);
        }
      }
    }
    // $/MWh → convert
    PRICE_PATTERNS.bess_mwh.lastIndex = 0;
    let m;
    while ((m = PRICE_PATTERNS.bess_mwh.exec(cleanText)) !== null) {
      const raw = parseFloat(m[1].replace(/,/g, ''));
      const price = raw / 1000;
      if (price > 50 && price < 2000) {
        const ctx = cleanText.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
        pushPrice('bess', price, 'kWh', ctx, 0.75);
      }
    }
  }

  // Solar $/W
  if (isSolar) {
    PRICE_PATTERNS.solar_watt.lastIndex = 0;
    let m;
    while ((m = PRICE_PATTERNS.solar_watt.exec(cleanText)) !== null) {
      const price = parseFloat(m[1]);
      if (price > 0.1 && price < 5) {
        const ctx = cleanText.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
        pushPrice('solar', price, 'W', ctx, 0.8);
      }
    }
    // $/kW installed
    PRICE_PATTERNS.solar_kw.lastIndex = 0;
    while ((m = PRICE_PATTERNS.solar_kw.exec(cleanText)) !== null) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price > 100 && price < 5000) {
        const ctx = cleanText.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
        pushPrice('solar', price, 'kW', ctx, 0.75);
      }
    }
  }

  return prices;
}

// ── Main ─────────────────────────────────────────────────────────────────────

await client.connect();
console.log('✅ Connected\n');

// 1. Audit: how many articles contain price text
const auditRow = await client.query(`
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE prices_extracted IS NOT NULL AND jsonb_array_length(prices_extracted) > 0) as already_extracted,
    COUNT(*) FILTER (WHERE content IS NOT NULL AND content != '') as has_content,
    COUNT(*) FILTER (WHERE
      (title || ' ' || COALESCE(content,'') || ' ' || COALESCE(excerpt,'')) 
      ~* '\\$/kWh|\\$[0-9]+[^a-zA-Z]*per[^a-zA-Z]*kWh|[0-9]+\\$/kWh|\\$/W\\s|\\$/MWh|per kWh|per kwh|\\$/w '
    ) as has_price_text
  FROM scraped_articles
`);
console.log('=== AUDIT ===');
console.log(auditRow.rows[0]);
console.log();

// 2. Get all articles with content (or title) to attempt extraction
const articlesRes = await client.query(`
  SELECT id, title, COALESCE(content,'') as content, COALESCE(excerpt,'') as excerpt,
         equipment_mentioned
  FROM scraped_articles
  WHERE prices_extracted IS NULL 
     OR jsonb_array_length(prices_extracted) = 0
  ORDER BY scraped_at DESC
`);

console.log(`Processing ${articlesRes.rows.length} articles for price extraction...\n`);

let updated = 0;
let withPrices = 0;
const errors = [];

for (const row of articlesRes.rows) {
  const fullText = `${row.title} ${row.content} ${row.excerpt}`;
  const prices = extractPrices(fullText);

  if (prices.length > 0) {
    try {
      await client.query(
        `UPDATE scraped_articles SET prices_extracted = $1::jsonb WHERE id = $2`,
        [JSON.stringify(prices), row.id]
      );
      withPrices++;
      updated++;
      console.log(`  ✅ ${row.title.slice(0, 70)}`);
      prices.forEach(p => console.log(`     → ${p.equipment} $${p.price}/${p.unit} (conf: ${p.confidence})`));
    } catch (err) {
      errors.push(`${row.id}: ${err.message}`);
    }
  }
}

console.log(`\n=== BACKFILL COMPLETE ===`);
console.log(`Articles updated with prices: ${updated}`);
console.log(`Errors: ${errors.length}`);
if (errors.length) errors.forEach(e => console.log(' ', e));

// 3. Final count
const finalRow = await client.query(`
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE prices_extracted IS NOT NULL AND jsonb_array_length(prices_extracted) > 0) as with_prices
  FROM scraped_articles
`);
console.log('\n=== FINAL STATE ===');
console.log(finalRow.rows[0]);

await client.end();
console.log('\n✅ Done');
