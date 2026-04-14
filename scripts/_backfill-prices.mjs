/**
 * _backfill-prices.mjs
 * Re-extract prices from all scraped_articles that currently have prices_extracted = []
 * Uses the same patterns as the updated edge function.
 *
 * Usage: node scripts/_backfill-prices.mjs [--dry-run] [--limit 200]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = (() => { const i = args.indexOf('--limit'); return i !== -1 ? parseInt(args[i+1], 10) : 500; })();
const BATCH = 20;

const env = Object.fromEntries(
  readFileSync('/Users/robertchristopher/merlin3/.env', 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);

const sb = createClient('https://fvmpmozybmtzjvikrctq.supabase.co', env['VITE_SUPABASE_ANON_KEY']);

// ── Helpers ─────────────────────────────────────────────────────────────────
function preprocessText(text) {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function detectEquipment(text) {
  const eq = [];
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

function extractPrices(text, equipment = []) {
  const prices = [];
  const clean = preprocessText(text);
  const lower = clean.toLowerCase();
  const eq = equipment.length > 0 ? equipment : detectEquipment(lower);

  const ctx = (idx, len) => clean.slice(Math.max(0, idx - 80), Math.min(clean.length, idx + len + 80));
  const dup = (e, p, u) => prices.some(x => x.equipment === e && Math.abs(x.price - p) < 1 && x.unit === u);

  // ── BESS ──────────────────────────────────────────────────────────────────
  if (eq.includes('bess') || lower.includes('battery') || lower.includes('energy storage') ||
      lower.includes('bess') || lower.includes('lcos') || lower.includes('levelized cost')) {
    const bessPatterns = [
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*k[Ww]h/gi,
      /(?:battery|bess|storage)\s+(?:cost|price|pricing)s?\s+(?:fell|dropped|declined|reached|at|to|of)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k[Ww]h/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*M[Ww]h/gi,
      /(?:lcos|levelized\s+cost\s+of\s+(?:storage|energy|electricity))\s*(?:of|at|is|are|was|:)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:to\s+\$?\s*\d+(?:,\d{3})*(?:\.\d{1,2})?)?\s*(?:\/|per|a)?\s*[Mk][Ww]h/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
      /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*dollars?\s*(?:per|\/|a)\s*kwh/gi,
      /(?:cost|price|priced|pricing)\s*(?:at|of|is|are|to)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)\s*kwh/gi,
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
          if (raw > 20 && raw < 500 && !dup('bess', raw, 'MWh'))
            prices.push({ equipment: 'bess', price: raw, unit: 'MWh', context: ctx(m.index, m[0].length), confidence: 0.75 });
        } else {
          if (raw > 50 && raw < 2000 && !dup('bess', raw, 'kWh'))
            prices.push({ equipment: 'bess', price: raw, unit: 'kWh', context: ctx(m.index, m[0].length), confidence: 0.8 });
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
        if (derived > 50 && derived < 2000 && !dup('bess', Math.round(derived), 'kWh'))
          prices.push({ equipment: 'bess', price: Math.round(derived), unit: 'kWh', context: `[derived] ${ctx(pm.index, pm[0].length)}`, confidence: 0.6 });
      }
    }
  }

  // ── Solar ─────────────────────────────────────────────────────────────────
  if (eq.includes('solar') || lower.includes('solar') || lower.includes('photovoltaic') || lower.includes('pv ')) {
    const solarPatterns = [
      /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*[Ww](?:att)?/gi,
      /(?:module|panel|solar)\s+(?:cost|price|pricing)s?\s+(?:at|of|to|reached)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
      /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)\s*(?:installed)?/gi,
      /(?:ppa|auction|bid|contract)\s+(?:price|rate|at)\s+\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*[Ww](?:att)?/gi,
      /solar.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*[Ww](?:att)?/gi,
    ];
    for (const pat of solarPatterns) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(clean)) !== null) {
        const price = parseFloat(m[1].replace(/,/g, ''));
        const isMWh = m[0].toLowerCase().includes('mwh');
        const isPerKW = m[0].toLowerCase().includes('/kw') && !isMWh && price >= 100 && price <= 5000;
        if (isPerKW && !dup('solar', price, 'kW'))
          prices.push({ equipment: 'solar', price, unit: 'kW', context: ctx(m.index, m[0].length), confidence: 0.7 });
        else if (!isPerKW && price > 0.1 && price < 5 && !dup('solar', price, 'W'))
          prices.push({ equipment: 'solar', price, unit: 'W', context: ctx(m.index, m[0].length), confidence: 0.8 });
      }
    }
  }

  // ── Wind ──────────────────────────────────────────────────────────────────
  if (eq.includes('wind') || lower.includes('wind turbine') || lower.includes('wind farm')) {
    const windPat = /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)\s*kW(?!h)/gi;
    windPat.lastIndex = 0;
    let m;
    while ((m = windPat.exec(clean)) !== null) {
      const price = parseFloat(m[1].replace(/,/g, ''));
      if (price > 500 && price < 5000 && !dup('wind', price, 'kW'))
        prices.push({ equipment: 'wind', price, unit: 'kW', context: ctx(m.index, m[0].length), confidence: 0.7 });
    }
  }

  return prices;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n🔄  Backfilling prices for up to ${LIMIT} articles${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);

// Fetch articles with empty prices_extracted that have content
const { data: articles, error } = await sb
  .from('scraped_articles')
  .select('id, title, content, equipment_mentioned')
  .eq('prices_extracted', '[]')
  .not('content', 'is', null)
  .order('created_at', { ascending: false })
  .limit(LIMIT);

if (error) { console.error('Fetch error:', error.message); process.exit(1); }

console.log(`Found ${articles.length} articles with no prices.\n`);

let updated = 0, extracted = 0, skipped = 0;

for (let i = 0; i < articles.length; i += BATCH) {
  const batch = articles.slice(i, i + BATCH);
  const updates = [];

  for (const article of batch) {
    const text = [article.title, article.content].filter(Boolean).join(' ');
    const equipment = article.equipment_mentioned ?? [];
    const prices = extractPrices(text, equipment);

    if (prices.length > 0) {
      extracted += prices.length;
      if (!DRY_RUN) {
        updates.push({ id: article.id, prices });
      } else {
        const preview = prices.map(p => `$${p.price}/${p.unit}(${p.equipment})`).join(', ');
        console.log(`  [DRY] ${article.title?.slice(0, 60)} → ${preview}`);
      }
    } else {
      skipped++;
    }
  }

  if (!DRY_RUN && updates.length > 0) {
    for (const u of updates) {
      const { error: upErr } = await sb
        .from('scraped_articles')
        .update({ prices_extracted: u.prices })
        .eq('id', u.id);
      if (upErr) {
        console.error(`  ❌ Update failed for ${u.id}: ${upErr.message}`);
      } else {
        updated++;
        const preview = u.prices.map(p => `$${p.price}/${p.unit}(${p.equipment})`).join(', ');
        console.log(`  ✅ ${u.id.slice(0, 8)}…  [${preview}]`);
      }
    }
  }

  process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, articles.length)}/${articles.length}`);
}

console.log(`\n\n── BACKFILL COMPLETE ──────────────────────────────────────`);
console.log(`  Articles scanned: ${articles.length}`);
console.log(`  With new prices:  ${DRY_RUN ? '(dry run)' : updated}`);
console.log(`  Prices extracted: ${extracted}`);
console.log(`  No prices found:  ${skipped}`);
if (DRY_RUN) console.log('\n  Re-run without --dry-run to commit changes.');
