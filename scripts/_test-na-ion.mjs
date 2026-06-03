import { extractPrices, classifyContent } from '../src/services/marketDataParser.ts';

const texts = [
  'HiNa Energy sodium-ion battery cells are priced at $92/kWh for residential projects',
  'SVOLT Energy announced its Na-ion pack cost of $85 per kWh for utility storage',
  'BYD sodium-ion technology quoted at $78/kWh by industry analysts',
  'Sodium-ion battery pricing fell to $95/kWh according to BloombergNEF',
  'Cell cost reached $110/kWh as production scales at Altris AB facility',
  'Na-ion cells priced at $90/kWh are now competitive with LFP',
  'Solar PV capex fell to $0.24/W in Q1 2026 as module prices dropped',
  'Solar capex of $800/kW was reported in the latest NREL study',
];

for (const t of texts) {
  const eq = classifyContent(t);
  const prices = extractPrices(t, []);
  console.log('TEXT:', t.slice(0, 72));
  console.log('  Equipment:', eq.equipment.join(',') || 'none', '| Topics:', eq.topics.join(',') || 'none');
  console.log('  Prices:', prices.length ? prices.map(p => `$${p.price}/${p.unit}(conf:${p.confidence})`).join(', ') : 'NONE');
  console.log();
}
