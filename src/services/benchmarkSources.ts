/**
 * BENCHMARK SOURCES - Single Source of Truth for Data Attribution
 * 
 * Merlin Platform: Every number in a quote must be traceable to a documented,
 * authoritative source. This file maintains the canonical reference for all
 * pricing data, calculation methodologies, and technical specifications.
 * 
 * @module benchmarkSources
 * @version 1.0.0
 * @date 2025-12-10
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface BenchmarkSource {
  id: string;
  name: string;
  organization: string;
  type: 'primary' | 'secondary' | 'certification' | 'utility';
  url?: string;
  publicationDate: string;
  retrievalDate: string;
  vintage: string;           // e.g., "2024 Q4", "FY2024"
  lastVerified: string;
  notes?: string;
}

export interface PricingBenchmark {
  value: number;
  unit: string;
  sourceId: string;
  scenario?: 'conservative' | 'moderate' | 'advanced';
  confidence: 'high' | 'medium' | 'low';
  validFrom: string;
  validUntil?: string;
  deviationNotes?: string;   // Why this differs from national benchmark
}

export interface MethodologyReference {
  id: string;
  name: string;
  sourceId: string;
  formulaDescription: string;
  variables: string[];
  nrelAlignment: boolean;
  doeSandiaCitation?: string;
}

export interface QuoteAuditMetadata {
  generatedAt: string;
  benchmarkVersion: string;
  sourcesUsed: string[];
  methodologyVersion: string;
  assumptions: Record<string, any>;
  deviations: Array<{
    lineItem: string;
    benchmarkValue: number;
    appliedValue: number;
    reason: string;
  }>;
}

// =============================================================================
// AUTHORITATIVE SOURCES (Approved)
// =============================================================================

export const AUTHORITATIVE_SOURCES: Record<string, BenchmarkSource> = {
  // PRIMARY REFERENCES
  'nrel-atb-2024': {
    id: 'nrel-atb-2024',
    name: 'NREL Annual Technology Baseline 2024',
    organization: 'National Renewable Energy Laboratory',
    type: 'primary',
    url: 'https://atb.nrel.gov/',
    publicationDate: '2024-07-01',
    retrievalDate: '2024-11-01',
    vintage: '2024',
    lastVerified: '2025-12-10',
    notes: 'Primary source for BESS, solar, wind capital costs. Uses Moderate scenario by default.'
  },
  'nrel-storefast': {
    id: 'nrel-storefast',
    name: 'NREL StoreFAST Model',
    organization: 'National Renewable Energy Laboratory',
    type: 'primary',
    url: 'https://www.nrel.gov/analysis/storefast.html',
    publicationDate: '2024-03-01',
    retrievalDate: '2024-11-01',
    vintage: '2024 v1.2',
    lastVerified: '2025-12-10',
    notes: 'Levelized cost of storage methodology and financial modeling'
  },
  'nrel-cost-benchmark-2024': {
    id: 'nrel-cost-benchmark-2024',
    name: 'NREL U.S. Solar Photovoltaic System and Energy Storage Cost Benchmarks Q1 2024',
    organization: 'National Renewable Energy Laboratory',
    type: 'primary',
    url: 'https://www.nrel.gov/docs/fy24osti/88465.pdf',
    publicationDate: '2024-09-01',
    retrievalDate: '2024-11-15',
    vintage: 'Q1 2024',
    lastVerified: '2025-12-10',
    notes: 'Quarterly cost benchmarks for utility, commercial, and residential PV + storage'
  },
  'doe-sandia-ess': {
    id: 'doe-sandia-ess',
    name: 'DOE/Sandia Energy Storage Systems Program',
    organization: 'Sandia National Laboratories / U.S. Department of Energy',
    type: 'primary',
    url: 'https://www.sandia.gov/ess/',
    publicationDate: '2024-06-01',
    retrievalDate: '2024-11-01',
    vintage: 'FY2024',
    lastVerified: '2025-12-10',
    notes: 'Energy storage safety, performance, and grid integration documentation'
  },
  'pnnl-storage': {
    id: 'pnnl-storage',
    name: 'PNNL Grid Energy Storage Technology Cost and Performance Assessment',
    organization: 'Pacific Northwest National Laboratory',
    type: 'primary',
    url: 'https://www.pnnl.gov/main/publications/external/technical_reports/PNNL-33283.pdf',
    publicationDate: '2023-12-01',
    retrievalDate: '2024-11-01',
    vintage: '2023',
    lastVerified: '2025-12-10',
    notes: 'Comprehensive storage technology comparison and cost projections'
  },

  // SECONDARY REFERENCES
  'eia-electricity': {
    id: 'eia-electricity',
    name: 'EIA Electric Power Monthly',
    organization: 'U.S. Energy Information Administration',
    type: 'secondary',
    url: 'https://www.eia.gov/electricity/monthly/',
    publicationDate: '2024-11-01',
    retrievalDate: '2024-11-15',
    vintage: 'October 2024',
    lastVerified: '2025-12-10',
    notes: 'Electricity prices, capacity factors, generation statistics'
  },
  'lazard-lcos-2024': {
    id: 'lazard-lcos-2024',
    name: 'Lazard Levelized Cost of Storage Analysis v9.0',
    organization: 'Lazard',
    type: 'secondary',
    url: 'https://www.lazard.com/research-insights/levelized-cost-of-storage-analysis/',
    publicationDate: '2024-04-01',
    retrievalDate: '2024-11-01',
    vintage: 'v9.0 (2024)',
    lastVerified: '2025-12-10',
    notes: 'Industry-standard LCOS methodology and benchmarks'
  },
  'bnef-storage-2024': {
    id: 'bnef-storage-2024',
    name: 'BloombergNEF Energy Storage Market Outlook',
    organization: 'BloombergNEF',
    type: 'secondary',
    url: 'https://about.bnef.com/energy-storage/',
    publicationDate: '2024-10-01',
    retrievalDate: '2024-11-01',
    vintage: 'H2 2024',
    lastVerified: '2025-12-10',
    notes: 'Global storage deployment and pricing trends (public excerpts only)'
  },

  // CERTIFICATION STANDARDS
  'ul-9540': {
    id: 'ul-9540',
    name: 'UL 9540 Standard for Energy Storage Systems',
    organization: 'UL Solutions',
    type: 'certification',
    url: 'https://www.ul.com/resources/ul-9540-standard-energy-storage-systems',
    publicationDate: '2023-01-01',
    retrievalDate: '2024-11-01',
    vintage: '3rd Edition',
    lastVerified: '2025-12-10',
    notes: 'Safety certification standard for ESS'
  },
  'ul-9540a': {
    id: 'ul-9540a',
    name: 'UL 9540A Test Method for Battery Energy Storage Systems',
    organization: 'UL Solutions',
    type: 'certification',
    url: 'https://www.ul.com/services/ul-9540a-testing',
    publicationDate: '2023-01-01',
    retrievalDate: '2024-11-01',
    vintage: '4th Edition',
    lastVerified: '2025-12-10',
    notes: 'Thermal runaway fire propagation test method'
  },
  'nfpa-855': {
    id: 'nfpa-855',
    name: 'NFPA 855 Standard for Energy Storage Systems',
    organization: 'National Fire Protection Association',
    type: 'certification',
    url: 'https://www.nfpa.org/codes-and-standards/nfpa-855-standard-development/855',
    publicationDate: '2023-01-01',
    retrievalDate: '2024-11-01',
    vintage: '2023 Edition',
    lastVerified: '2025-12-10',
    notes: 'Installation requirements for ESS fire safety'
  },
  'ieee-1547': {
    id: 'ieee-1547',
    name: 'IEEE 1547 Standard for Interconnection',
    organization: 'IEEE Standards Association',
    type: 'certification',
    url: 'https://standards.ieee.org/standard/1547-2018.html',
    publicationDate: '2018-04-01',
    retrievalDate: '2024-11-01',
    vintage: '2018 (IEEE 1547-2018)',
    lastVerified: '2025-12-10',
    notes: 'Distributed energy resource interconnection and interoperability'
  },
  'iec-62619': {
    id: 'iec-62619',
    name: 'IEC 62619 Secondary Lithium Cells and Batteries for Industrial Applications',
    organization: 'International Electrotechnical Commission',
    type: 'certification',
    url: 'https://webstore.iec.ch/publication/28895',
    publicationDate: '2022-05-01',
    retrievalDate: '2024-11-01',
    vintage: 'Edition 2.0 (2022)',
    lastVerified: '2025-12-10',
    notes: 'Safety requirements for secondary lithium batteries in industrial use'
  },

  // UTILITY/REGIONAL SOURCES
  'caiso-tariffs': {
    id: 'caiso-tariffs',
    name: 'CAISO Tariffs and Rate Schedules',
    organization: 'California Independent System Operator',
    type: 'utility',
    url: 'https://www.caiso.com/Pages/documentsbygroup.aspx?GroupID=FED07EE6-C4A0-48BD-988E-FEFB1B856D1D',
    publicationDate: '2024-01-01',
    retrievalDate: '2024-11-01',
    vintage: '2024',
    lastVerified: '2025-12-10',
    notes: 'California wholesale market rates and ancillary service prices'
  },
  'pjm-market-data': {
    id: 'pjm-market-data',
    name: 'PJM Market Data',
    organization: 'PJM Interconnection',
    type: 'utility',
    url: 'https://www.pjm.com/markets-and-operations/data-dictionary',
    publicationDate: '2024-11-01',
    retrievalDate: '2024-11-15',
    vintage: '2024',
    lastVerified: '2025-12-10',
    notes: 'Eastern US wholesale electricity prices and capacity market data'
  },
  'ercot-market': {
    id: 'ercot-market',
    name: 'ERCOT Market Information',
    organization: 'Electric Reliability Council of Texas',
    type: 'utility',
    url: 'https://www.ercot.com/mktinfo',
    publicationDate: '2024-11-01',
    retrievalDate: '2024-11-15',
    vintage: '2024',
    lastVerified: '2025-12-10',
    notes: 'Texas wholesale market prices and real-time data'
  },

  // INDUSTRY POWER STANDARDS
  'ashrae-90-1': {
    id: 'ashrae-90-1',
    name: 'ASHRAE Standard 90.1 Energy Standard for Buildings',
    organization: 'American Society of Heating, Refrigerating and Air-Conditioning Engineers',
    type: 'certification',
    url: 'https://www.ashrae.org/technical-resources/bookstore/standard-90-1',
    publicationDate: '2022-01-01',
    retrievalDate: '2024-11-01',
    vintage: '2022',
    lastVerified: '2025-12-10',
    notes: 'Building energy efficiency benchmarks'
  },
  'cbecs-2018': {
    id: 'cbecs-2018',
    name: 'Commercial Buildings Energy Consumption Survey',
    organization: 'U.S. Energy Information Administration',
    type: 'primary',
    url: 'https://www.eia.gov/consumption/commercial/',
    publicationDate: '2022-09-01',
    retrievalDate: '2024-11-01',
    vintage: '2018 (most recent)',
    lastVerified: '2025-12-10',
    notes: 'Commercial building energy use intensity benchmarks'
  },
  'energy-star': {
    id: 'energy-star',
    name: 'ENERGY STAR Portfolio Manager Technical Reference',
    organization: 'U.S. Environmental Protection Agency',
    type: 'secondary',
    url: 'https://www.energystar.gov/buildings/benchmark/understand_metrics/what_eui',
    publicationDate: '2024-01-01',
    retrievalDate: '2024-11-01',
    vintage: '2024',
    lastVerified: '2025-12-10',
    notes: 'Energy use intensity benchmarks by building type'
  },

  // REAL-WORLD CASE STUDIES
  'marriott-lancaster-2025': {
    id: 'marriott-lancaster-2025',
    name: 'Courtyard by Marriott Lancaster Solar Installation',
    organization: 'Marriott International',
    type: 'secondary',
    url: 'https://news.marriott.com/sustainability',
    publicationDate: '2019-06-01',
    retrievalDate: '2025-12-10',
    vintage: '6+ years operational data',
    lastVerified: '2025-12-10',
    notes: 'First fully solar-powered Marriott in US. 133 rooms, 2,700 panels, 1.239 GWh/year generation, 8,850 kWh/room/year consumption. Verified Dec 2025.'
  }
};

// =============================================================================
// PRICING BENCHMARKS (Current as of Dec 2025)
// =============================================================================

export const PRICING_BENCHMARKS: Record<string, PricingBenchmark> = {
  // BATTERY ENERGY STORAGE
  'bess-lfp-utility-scale': {
    value: 155,
    unit: '$/kWh',
    sourceId: 'nrel-atb-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-07-01',
    validUntil: '2025-06-30',
    deviationNotes: 'NREL ATB 2024 Moderate scenario for 4-hour LFP utility-scale storage'
  },
  'bess-lfp-commercial': {
    value: 275,
    unit: '$/kWh',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'NREL Q1 2024 benchmark for commercial standalone storage (10 kW–1 MW)'
  },
  'bess-floor-price': {
    value: 100,
    unit: '$/kWh',
    sourceId: 'bnef-storage-2024',
    scenario: 'advanced',
    confidence: 'medium',
    validFrom: '2024-10-01',
    validUntil: '2025-06-30',
    deviationNotes: 'BNEF H2 2024 floor price for large utility-scale projects (>100 MWh)'
  },
  'bess-ceiling-price': {
    value: 175,
    unit: '$/kWh',
    sourceId: 'nrel-atb-2024',
    scenario: 'conservative',
    confidence: 'high',
    validFrom: '2024-07-01',
    validUntil: '2025-06-30',
    deviationNotes: 'NREL ATB 2024 Conservative scenario upper bound'
  },

  // SOLAR PV
  'solar-utility-scale': {
    value: 0.65,
    unit: '$/W',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'NREL Q1 2024 utility-scale solar (>5 MW ground-mount)'
  },
  'solar-commercial': {
    value: 0.85,
    unit: '$/W',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'NREL Q1 2024 commercial rooftop solar (200 kW–2 MW)'
  },
  'solar-residential': {
    value: 2.50,
    unit: '$/W',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'NREL Q1 2024 residential rooftop solar (fully installed with soft costs)'
  },

  // WIND
  'wind-land-based': {
    value: 1200,
    unit: '$/kW',
    sourceId: 'nrel-atb-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-07-01',
    validUntil: '2025-06-30',
    deviationNotes: 'NREL ATB 2024 land-based wind, Class 4 resource'
  },

  // POWER ELECTRONICS
  'inverter-utility': {
    value: 80,
    unit: '$/kW',
    sourceId: 'nrel-atb-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-07-01',
    validUntil: '2025-06-30',
    deviationNotes: 'NREL ATB 2024 utility-scale PCS'
  },
  'inverter-commercial': {
    value: 120,
    unit: '$/kW',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'NREL Q1 2024 commercial-scale inverter'
  },
  'transformer-utility': {
    value: 50000,
    unit: '$/MVA',
    sourceId: 'nrel-atb-2024',
    scenario: 'moderate',
    confidence: 'medium',
    validFrom: '2024-07-01',
    validUntil: '2025-06-30',
    deviationNotes: 'NREL ATB 2024 utility-scale transformer (34.5 kV)'
  },

  // GENERATORS
  'generator-natural-gas': {
    value: 700,
    unit: '$/kW',
    sourceId: 'eia-electricity',
    scenario: 'moderate',
    confidence: 'medium',
    validFrom: '2024-11-01',
    validUntil: '2025-10-31',
    deviationNotes: 'EIA capacity addition costs for natural gas reciprocating engines'
  },
  'generator-diesel': {
    value: 800,
    unit: '$/kW',
    sourceId: 'eia-electricity',
    scenario: 'moderate',
    confidence: 'medium',
    validFrom: '2024-11-01',
    validUntil: '2025-10-31',
    deviationNotes: 'EIA capacity addition costs for diesel backup generators'
  },

  // INSTALLATION & SOFT COSTS
  'installation-bos-utility': {
    value: 15,
    unit: '% of equipment',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'Balance of System costs for utility-scale BESS'
  },
  'installation-epc-utility': {
    value: 18,
    unit: '% of equipment',
    sourceId: 'nrel-cost-benchmark-2024',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-09-01',
    validUntil: '2025-08-31',
    deviationNotes: 'EPC margin for utility-scale projects'
  },
  'installation-contingency': {
    value: 5,
    unit: '% of total',
    sourceId: 'nrel-storefast',
    scenario: 'moderate',
    confidence: 'high',
    validFrom: '2024-03-01',
    validUntil: '2025-02-28',
    deviationNotes: 'Standard project contingency per StoreFAST methodology'
  }
};

// =============================================================================
// METHODOLOGY REFERENCES
// =============================================================================

export const METHODOLOGY_REFERENCES: Record<string, MethodologyReference> = {
  'lcos-calculation': {
    id: 'lcos-calculation',
    name: 'Levelized Cost of Storage',
    sourceId: 'nrel-storefast',
    formulaDescription: 'LCOS = (Total Lifecycle Cost) / (Total Energy Discharged over lifetime)',
    variables: ['capitalCost', 'oAndM', 'degradation', 'cyclesPerYear', 'roundTripEfficiency', 'discountRate', 'projectLife'],
    nrelAlignment: true,
    doeSandiaCitation: 'Sandia Report SAND2015-1002'
  },
  'npv-calculation': {
    id: 'npv-calculation',
    name: 'Net Present Value',
    sourceId: 'nrel-storefast',
    formulaDescription: 'NPV = Σ(Cash Flow_t / (1 + r)^t) - Initial Investment',
    variables: ['initialInvestment', 'annualCashFlows', 'discountRate', 'projectLife'],
    nrelAlignment: true,
    doeSandiaCitation: 'DOE Energy Storage Handbook Ch. 5'
  },
  'irr-calculation': {
    id: 'irr-calculation',
    name: 'Internal Rate of Return',
    sourceId: 'nrel-storefast',
    formulaDescription: 'Rate r where NPV = 0, solved iteratively',
    variables: ['initialInvestment', 'annualCashFlows', 'projectLife'],
    nrelAlignment: true
  },
  'demand-charge-savings': {
    id: 'demand-charge-savings',
    name: 'Demand Charge Reduction Savings',
    sourceId: 'doe-sandia-ess',
    formulaDescription: 'Monthly Savings = (Peak Reduction kW × Demand Charge $/kW) × 12',
    variables: ['peakDemandKW', 'demandChargeRate', 'peakShavingCapability', 'dischargeDuration'],
    nrelAlignment: true,
    doeSandiaCitation: 'Sandia ESS Applications Guide'
  },
  'degradation-curve': {
    id: 'degradation-curve',
    name: 'Battery Capacity Degradation',
    sourceId: 'nrel-atb-2024',
    formulaDescription: 'Capacity_year = Initial_Capacity × (1 - annual_degradation_rate)^year',
    variables: ['initialCapacity', 'annualDegradationRate', 'cyclesPerYear', 'depthOfDischarge'],
    nrelAlignment: true,
    doeSandiaCitation: 'NREL/TP-5400-79698'
  }
};

// =============================================================================
// REGIONAL ADJUSTMENTS
// =============================================================================

export const REGIONAL_ADJUSTMENTS: Record<string, { multiplier: number; sourceId: string; reason: string }> = {
  'california': {
    multiplier: 1.15,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Higher labor costs, prevailing wage requirements, permitting complexity'
  },
  'texas': {
    multiplier: 0.95,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Lower labor costs, streamlined permitting, no state income tax'
  },
  'northeast': {
    multiplier: 1.10,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Higher labor costs, space constraints, complex interconnection'
  },
  'southeast': {
    multiplier: 1.00,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Baseline region, average costs'
  },
  'midwest': {
    multiplier: 0.98,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Slightly lower labor, good land availability'
  },
  'mountain-west': {
    multiplier: 1.02,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Average costs, good solar resource'
  },
  'pacific-northwest': {
    multiplier: 1.08,
    sourceId: 'nrel-cost-benchmark-2024',
    reason: 'Higher labor costs, environmental permitting'
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the source attribution for a pricing benchmark
 */
export function getSourceAttribution(benchmarkId: string): {
  benchmark: PricingBenchmark;
  source: BenchmarkSource;
  citation: string;
} | null {
  const benchmark = PRICING_BENCHMARKS[benchmarkId];
  if (!benchmark) return null;
  
  const source = AUTHORITATIVE_SOURCES[benchmark.sourceId];
  if (!source) return null;
  
  return {
    benchmark,
    source,
    citation: `${source.name} (${source.vintage}), ${source.organization}. Retrieved ${source.retrievalDate}.`
  };
}

/**
 * Generate audit metadata for a quote
 */
export function generateQuoteAuditMetadata(
  sourcesUsed: string[],
  assumptions: Record<string, any>,
  deviations: Array<{ lineItem: string; benchmarkValue: number; appliedValue: number; reason: string }>
): QuoteAuditMetadata {
  return {
    generatedAt: new Date().toISOString(),
    benchmarkVersion: 'Merlin v1.0.0 (Dec 2025)',
    sourcesUsed,
    methodologyVersion: 'NREL ATB 2024 + StoreFAST aligned',
    assumptions,
    deviations
  };
}

/**
 * Validate if a price is within benchmark bounds
 */
export function validatePriceAgainstBenchmark(
  value: number,
  benchmarkId: string,
  tolerance: number = 0.20  // 20% tolerance by default
): { valid: boolean; message: string; benchmark?: PricingBenchmark } {
  const benchmark = PRICING_BENCHMARKS[benchmarkId];
  if (!benchmark) {
    return { valid: false, message: `No benchmark found for ID: ${benchmarkId}` };
  }
  
  const lowerBound = benchmark.value * (1 - tolerance);
  const upperBound = benchmark.value * (1 + tolerance);
  
  if (value >= lowerBound && value <= upperBound) {
    return { 
      valid: true, 
      message: `Within ${(tolerance * 100).toFixed(0)}% of benchmark (${benchmark.value} ${benchmark.unit})`,
      benchmark 
    };
  }
  
  const deviation = ((value - benchmark.value) / benchmark.value * 100).toFixed(1);
  return {
    valid: false,
    message: `${deviation}% deviation from benchmark (${benchmark.value} ${benchmark.unit}). Requires justification.`,
    benchmark
  };
}

/**
 * Get all sources used in a quote calculation
 */
export function getQuoteSources(equipmentTypes: string[]): BenchmarkSource[] {
  const sourceIds = new Set<string>();
  
  equipmentTypes.forEach(type => {
    // Map equipment types to their primary benchmark sources
    const benchmarkId = {
      'bess': 'bess-lfp-utility-scale',
      'solar': 'solar-utility-scale',
      'wind': 'wind-land-based',
      'inverter': 'inverter-utility',
      'transformer': 'transformer-utility',
      'generator': 'generator-natural-gas'
    }[type];
    
    if (benchmarkId && PRICING_BENCHMARKS[benchmarkId]) {
      sourceIds.add(PRICING_BENCHMARKS[benchmarkId].sourceId);
    }
  });
  
  return Array.from(sourceIds)
    .map(id => AUTHORITATIVE_SOURCES[id])
    .filter(Boolean);
}

/**
 * Format sources for quote appendix
 */
export function formatSourcesForAppendix(sourceIds: string[]): string {
  return sourceIds
    .map(id => {
      const source = AUTHORITATIVE_SOURCES[id];
      if (!source) return null;
      return `• ${source.name}\n  Organization: ${source.organization}\n  Vintage: ${source.vintage}\n  URL: ${source.url || 'N/A'}\n  Retrieved: ${source.retrievalDate}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

// =============================================================================
// CURRENT BENCHMARK VERSION
// =============================================================================

export const CURRENT_BENCHMARK_VERSION = {
  version: '1.0.0',
  releaseDate: '2025-12-10',
  primarySource: 'nrel-atb-2024',
  methodology: 'NREL StoreFAST + Lazard LCOS aligned',
  nextReviewDate: '2026-03-01',
  changelog: [
    '1.0.0 (2025-12-10): Initial benchmark-backed quoting system',
  ]
};
