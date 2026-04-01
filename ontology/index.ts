/**
 * MERLIN ONTOLOGY INDEX
 * =====================
 * TypeScript exports for all ontological libraries.
 * Import domain knowledge from here to build type-safe,
 * ontology-aware features.
 */

// Ontology files are loaded at runtime via fs.readFileSync in Node context
// or via fetch in browser context. This module exports the typed helpers.
// Raw JSON-LD files: ontology/energy-domain.jsonld, business-domain.jsonld, technical-domain.jsonld

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OntologyGraph = { '@context': Record<string, unknown>; '@graph': any[] };

function loadOntology(path: string): OntologyGraph {
  // In Node.js environments (agents, scripts), use synchronous require
  // In browser, these are fetched via API or bundled
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(path) as OntologyGraph;
  } catch {
    return { '@context': {}, '@graph': [] };
  }
}

const energyDomain = loadOntology('./energy-domain.jsonld');
const businessDomain = loadOntology('./business-domain.jsonld');
const technicalDomain = loadOntology('./technical-domain.jsonld');

export { energyDomain, businessDomain, technicalDomain };

// ============================================================
// ONTOLOGY QUERY HELPERS
// ============================================================

type JsonLdNode = {
  '@id': string;
  '@type'?: string;
  'rdfs:label'?: string;
  'rdfs:comment'?: string;
  [key: string]: unknown;
};

type JsonLdGraph = {
  '@context': Record<string, unknown>;
  '@graph': JsonLdNode[];
};

/**
 * Look up a node in an ontology by its @id
 */
export function getNodeById(ontology: JsonLdGraph, nodeId: string): JsonLdNode | undefined {
  return ontology['@graph'].find((node: JsonLdNode) => node['@id'] === nodeId);
}

/**
 * Get the canonical label for a Merlin concept
 */
export function getConceptLabel(conceptId: string): string {
  const allGraphs = [
    ...energyDomain['@graph'],
    ...businessDomain['@graph'],
    ...technicalDomain['@graph'],
  ] as JsonLdNode[];

  const node = allGraphs.find((n: JsonLdNode) => n['@id'] === conceptId);
  return (node?.['rdfs:label'] as string) ?? conceptId;
}

/**
 * Get the canonical description for a Merlin concept
 */
export function getConceptDescription(conceptId: string): string {
  const allGraphs = [
    ...energyDomain['@graph'],
    ...businessDomain['@graph'],
    ...technicalDomain['@graph'],
  ] as JsonLdNode[];

  const node = allGraphs.find((n: JsonLdNode) => n['@id'] === conceptId);
  return (node?.['rdfs:comment'] as string) ?? '';
}

// ============================================================
// LLM CONTEXT BUILDER
// ============================================================

/**
 * Build a rich context string for LLMs.
 * Inject this into system prompts to ensure LLMs understand
 * Merlin's domain properly.
 */
export function buildLLMContext(domains: ('energy' | 'business' | 'technical')[] = ['energy', 'business', 'technical']): string {
  const sections: string[] = [];

  sections.push(`# Merlin Energy Platform — LLM Domain Context`);
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push('');

  if (domains.includes('energy')) {
    sections.push(`## Energy Domain Concepts`);
    sections.push('');
    sections.push('**BESS (Battery Energy Storage System):** Electrochemical storage system. Key properties: storageSizeMW, durationHours, batteryChemistry, roundTripEfficiency.');
    sections.push('**TrueQuote™:** Merlin proprietary 47-variable BESS sizing engine. SSOT: unifiedQuoteCalculator.ts. Accuracy: ≥95%.');
    sections.push('**Use Cases:** peak-shaving, demand-charge-reduction, TOU-arbitrage, backup-power, solar-self-consumption.');
    sections.push('**Financial Metrics:** NPV (25yr), IRR, simple payback, LCOE, ITC (30% federal credit).');
    sections.push('**Authoritative Sources:** NREL ATB 2024, NREL StoreFAST, DOE/Sandia, EIA Commercial Rates.');
    sections.push('');
  }

  if (domains.includes('business')) {
    sections.push(`## Business Domain Concepts`);
    sections.push('');
    sections.push('**Products:** Merlin Pro (SaaS, $299-999/mo), SMB Verticals (lead gen $50-500/lead), Partner API (planned).');
    sections.push('**Customers:** EPCs, Battery Integrators, SMB Operators, Battery Manufacturers.');
    sections.push('**18 Verticals:** car-wash, hotel, data-center, ev-charging, restaurant, office, warehouse, manufacturing, university, hospital, agriculture, retail, + 6 planned.');
    sections.push('**Revenue:** SaaS (85% margin) + Lead Gen (60% margin). Target: $600K ARR SaaS + $2.5M lead gen.');
    sections.push('**Competitors:** Homer Energy (complex, no lead gen), EnerNOC (enterprise-only), Excel calculators (inaccurate).');
    sections.push('**Key KPIs:** wizard starts, completions, leads captured, MRR, TrueQuote accuracy, uptime.');
    sections.push('');
  }

  if (domains.includes('technical')) {
    sections.push(`## Technical Architecture`);
    sections.push('');
    sections.push('**Stack:** React 18 + TypeScript 5 + Vite (frontend), Node.js + Express (backend), Supabase (DB), Fly.io + Vercel (deploy).');
    sections.push('**SSOT Rule:** ALL calculations → unifiedQuoteCalculator.ts. NEVER duplicate calculation logic.');
    sections.push('**Layer Separation:** Components render only. Services calculate. Hooks connect them. Never mix layers.');
    sections.push('**Protected Files:** unifiedQuoteCalculator.ts, benchmarkSources.ts, pricingServiceV45.ts — Level 3 access only.');
    sections.push('**Testing:** Vitest (unit), Playwright (E2E). Run: npm run typecheck && npm run lint && npm run test.');
    sections.push('**Wizard:** Current = WizardV8. V6/V7 are deprecated. Do not touch deprecated versions.');
    sections.push('');
  }

  sections.push(`## Non-Violatable Policies`);
  sections.push('POLICY-001: SSOT — all calcs via unifiedQuoteCalculator.ts');
  sections.push('POLICY-002: No bypassing validation schemas');
  sections.push('POLICY-006: TypeScript strict — no any types');
  sections.push('POLICY-007: No business logic in components');
  sections.push('POLICY-011: Always use degradation modeling');
  sections.push('POLICY-015: Use conservative (p50) projections only');
  sections.push('');
  sections.push('**See .merlin-meta/CONSTITUTION.md for complete policy list.**');

  return sections.join('\n');
}

// ============================================================
// TYPED DOMAIN KNOWLEDGE EXPORTS
// ============================================================

export const ENERGY_USE_CASES = [
  'peak-shaving',
  'demand-charge-reduction',
  'TOU-arbitrage',
  'backup-power',
  'solar-self-consumption',
  'frequency-regulation',
  'voltage-support',
  'microgrid',
  'ev-charging-support',
  'load-shifting',
] as const;

export type EnergyUseCase = typeof ENERGY_USE_CASES[number];

export const BESS_CHEMISTRIES = {
  LFP: { efficiency: 0.92, cycleLife: 15, safety: 'high' },
  NMC: { efficiency: 0.95, cycleLife: 10, safety: 'medium' },
  LFMP: { efficiency: 0.93, cycleLife: 18, safety: 'high' },
} as const;

export const MERLIN_VERTICALS = {
  'car-wash': { leadValue: 150, avgProjectSize: 500_000, status: 'active' },
  'hotel': { leadValue: 200, avgProjectSize: 800_000, status: 'active' },
  'data-center': { leadValue: 500, avgProjectSize: 5_000_000, status: 'active' },
  'ev-charging': { leadValue: 300, avgProjectSize: 750_000, status: 'active' },
  'restaurant': { leadValue: 100, avgProjectSize: 200_000, status: 'active' },
  'office': { leadValue: 150, avgProjectSize: 400_000, status: 'active' },
  'warehouse': { leadValue: 200, avgProjectSize: 600_000, status: 'active' },
  'manufacturing': { leadValue: 400, avgProjectSize: 2_000_000, status: 'active' },
  'university': { leadValue: 300, avgProjectSize: 1_500_000, status: 'active' },
  'hospital': { leadValue: 400, avgProjectSize: 2_000_000, status: 'active' },
  'agriculture': { leadValue: 150, avgProjectSize: 350_000, status: 'active' },
  'retail': { leadValue: 100, avgProjectSize: 300_000, status: 'active' },
} as const;

export type MerlinVertical = keyof typeof MERLIN_VERTICALS;
