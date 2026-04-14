// Quick smoke-test for the new edge function extractPrices patterns
const pats = {
  kwh: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*k[Ww]h/gi,
  mwh: /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per|a)\s*M[Ww]h/gi,
  battery_nl: /battery.*?(?:cost|price|pricing)s?\s*(?:at|of|to|is|are|fell|dropped|reached)\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|\/|a)?\s*k(?:ilo)?wh/gi,
  costs_nl: /costs?\s+(?:fell|dropped|declined)\s+\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:per|a)\s*kwh/gi,
  lcos: /(?:lcos|levelized\s+cost\s+of\s+(?:storage|energy))\s*(?:of|at|:)?\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:\/|per)?\s*[Mk][Ww]h/gi,
  proj: /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:million|billion)\s+(?:[^$\d]+)?\s*(\d+(?:\.\d{1,2})?)\s*[Mm][Ww]h/gi,
};

// Match the edge function's _detectEquipment logic
function hasBESS(lower) {
  return (
    lower.includes('battery') || lower.includes('bess') || lower.includes('energy storage') ||
    lower.includes('utility-scale storage') || lower.includes('lcos') ||
    lower.includes('levelized cost') ||
    (lower.includes('storage') && (lower.includes('/kwh') || lower.includes('per kwh')))
  );
}

function extractBESS(text) {
  const found = [];
  const lower = text.toLowerCase();
  if (!hasBESS(lower)) return found;
  const dup = (p, u) => found.some(x => Math.abs(x.price - p) < 1 && x.unit === u);

  for (const [name, pat] of Object.entries(pats)) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(text)) !== null) {
      if (name === 'proj') {
        const d = parseFloat(m[1]);
        const w = parseFloat(m[2]);
        const mult = m[0].toLowerCase().includes('billion') ? 1e9 : 1e6;
        const derived = (d * mult) / (w * 1000);
        if (derived > 50 && derived < 2000 && !dup(Math.round(derived), 'kWh'))
          found.push({ pat: name, price: Math.round(derived), unit: 'kWh', conf: 0.6 });
      } else {
        const raw = parseFloat(m[1].replace(/,/g, ''));
        const isMWh = m[0].toLowerCase().includes('mwh');
        // FIX: store $/MWh as $/MWh (guard 20-500), not converted to $/kWh
        if (isMWh) {
          if (raw > 20 && raw < 500 && !dup(raw, 'MWh'))
            found.push({ pat: name, price: raw, unit: 'MWh', conf: 0.75 });
        } else {
          if (raw > 50 && raw < 2000 && !dup(raw, 'kWh'))
            found.push({ pat: name, price: raw, unit: 'kWh', conf: 0.8 });
        }
      }
    }
  }
  return found;
}

const tests = [
  'Battery storage costs fell to $150 per kWh last quarter',
  'The project LCOS is $85/MWh according to BloombergNEF',
  'NextEra awarded a $200 million 400 MWh battery project in Texas',
  'BESS pricing reached $180/kWh installed capacity',
  'Utility-scale storage at $250 per kWh is now competitive',
  'Energy storage systems are priced at $300/kWh for commercial projects',
  'The bess system cost $120 per kWh for this deployment',
  'The $50 million 200 MWh project will serve the grid',
  'AES raises $1.2 billion for a 500 MWh battery facility',
  'Consumer EV sales rose 20% in Q1 — Tesla Model 3 range improved',
  'Mercedes EQS gets a big upgrade but still has problems',
];

for (const t of tests) {
  const found = extractBESS(t);
  const label = found.length
    ? found.map(f => `$${f.price}/${f.unit} via ${f.pat}(conf:${f.conf})`).join(', ')
    : '— no price';
  console.log(`${found.length ? '✅' : '  '} ${t.slice(0, 60)}`);
  if (found.length) console.log(`     ${label}`);
}
