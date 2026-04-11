/**
 * UTILITY RATE SERVICE
 * ====================
 *
 * Provides accurate electricity rates by ZIP code using:
 * 1. NREL Utility Rate Database (URDB) API - Primary source
 * 2. EIA State Average Rates - Fallback
 * 3. Local cache for performance
 *
 * SINGLE SOURCE OF TRUTH for utility rate lookups.
 *
 * API Documentation:
 * - NREL URDB: https://openei.org/services/doc/rest/util_rates/
 * - OpenEI: https://openei.org/wiki/Utility_Rate_Database
 */

// ============================================
// TYPES
// ============================================

export interface UtilityRate {
  utilityName: string;
  utilityId: string;
  rateName: string;
  rateId: string;

  // Core Rates ($/kWh)
  residentialRate: number;
  commercialRate: number;
  industrialRate: number;

  // Time-of-Use Rates
  hasTOU: boolean;
  peakRate?: number;
  offPeakRate?: number;
  partPeakRate?: number;
  peakHours?: string;

  // Demand Charges ($/kW)
  hasDemandCharge: boolean;
  demandCharge?: number;
  peakDemandCharge?: number;

  // Tiered Rates
  hasTieredRates: boolean;
  tier1Limit?: number; // kWh
  tier1Rate?: number;
  tier2Rate?: number;
  tier3Rate?: number;

  // Net Metering
  netMeteringAvailable: boolean;
  netMeteringType?: "full-retail" | "avoided-cost" | "time-of-export";

  // Metadata
  effectiveDate: string;
  source: "nrel" | "eia" | "manual" | "cache";
  lastUpdated: string;
  confidence: "high" | "medium" | "low";
}

export interface UtilityInfo {
  utilityId: string;
  name: string;
  abbreviation?: string;
  state: string;
  serviceTerritory?: string;
  customerCount?: number;
  utilityType: "investor-owned" | "municipal" | "cooperative" | "federal";
}

/**
 * Rate schedule tier for demand-charge-aware tariff lookup.
 * Commercial customers land on different tariff schedules based on peak demand.
 * Sources: state PUC rate filings, utility published tariffs (2025).
 * Note: Car washes / hotels / gas stations (50–500 kW) land in "medium commercial"
 * brackets — which typically carry the HIGHEST $/kW demand charges.
 */
export interface CommercialRateSchedule {
  name: string;          // "D3.2" / "GS-65" / "E-19"
  label: string;         // "Medium General Service"
  minKW: number;         // lower bound (inclusive, kW)
  maxKW: number;         // upper bound (exclusive; Infinity for top tier)
  demandCharge: number;  // $/kW/month
  peakDemandCharge?: number;
  commercialRate?: number; // $/kWh override if different for this schedule
  hasTOU?: boolean;
  peakRate?: number;
  offPeakRate?: number;
  peakHours?: string;
}

export interface ZipCodeUtilityData {
  zipCode: string;
  city: string;
  state: string;
  stateCode: string;
  utilities: UtilityInfo[];
  primaryUtility?: UtilityInfo;
  rates: UtilityRate[];
  recommendedRate?: UtilityRate;
  solarPotential: "excellent" | "good" | "fair" | "poor";
  windPotential: "excellent" | "good" | "fair" | "poor";
}

// ============================================
// CONSTANTS
// ============================================

// NREL API Key - Get yours at https://developer.nrel.gov/signup/
// For production, move to environment variable
const NREL_API_KEY = import.meta.env.VITE_NREL_API_KEY || "DEMO_KEY";

// Cache duration (24 hours)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Rate cache
const rateCache = new Map<string, { data: ZipCodeUtilityData; timestamp: number }>();

// URDB-specific cache (separate from hardcoded rate cache)
const urdbCache = new Map<string, { data: { demandCharge: number; rateName: string; rateSchedule: string }; timestamp: number }>();

// ============================================
// EIA STATE AVERAGE RATES (2024 Data)
// Source: U.S. Energy Information Administration
// https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a
// ============================================

const EIA_STATE_RATES: Record<
  string,
  {
    residential: number;
    commercial: number;
    industrial: number;
    demandCharge: number;
    hasTOU: boolean;
  }
> = {
  AL: {
    residential: 0.1315,
    commercial: 0.1173,
    industrial: 0.0726,
    demandCharge: 12,
    hasTOU: false,
  },
  AK: {
    residential: 0.2265,
    commercial: 0.201,
    industrial: 0.1812,
    demandCharge: 15,
    hasTOU: false,
  },
  AZ: {
    residential: 0.1334,
    commercial: 0.1123,
    industrial: 0.0743,
    demandCharge: 18,
    hasTOU: true,
  },
  AR: {
    residential: 0.1027,
    commercial: 0.0896,
    industrial: 0.0685,
    demandCharge: 11,
    hasTOU: false,
  },
  CA: {
    residential: 0.2794,
    commercial: 0.2207,
    industrial: 0.1689,
    demandCharge: 25,
    hasTOU: true,
  },
  CO: { residential: 0.134, commercial: 0.1115, industrial: 0.087, demandCharge: 14, hasTOU: true },
  CT: {
    residential: 0.2549,
    commercial: 0.1957,
    industrial: 0.1462,
    demandCharge: 20,
    hasTOU: true,
  },
  DE: {
    residential: 0.1305,
    commercial: 0.1089,
    industrial: 0.0869,
    demandCharge: 13,
    hasTOU: false,
  },
  FL: {
    residential: 0.1408,
    commercial: 0.1125,
    industrial: 0.089,
    demandCharge: 12,
    hasTOU: true,
  },
  GA: {
    residential: 0.1261,
    commercial: 0.1092,
    industrial: 0.0698,
    demandCharge: 13,
    hasTOU: true,
  },
  HI: {
    residential: 0.4332,
    commercial: 0.3689,
    industrial: 0.3148,
    demandCharge: 30,
    hasTOU: true,
  },
  ID: {
    residential: 0.1051,
    commercial: 0.0851,
    industrial: 0.0699,
    demandCharge: 10,
    hasTOU: false,
  },
  IL: {
    residential: 0.1461,
    commercial: 0.1114,
    industrial: 0.0835,
    demandCharge: 14,
    hasTOU: true,
  },
  IN: {
    residential: 0.1305,
    commercial: 0.1133,
    industrial: 0.0814,
    demandCharge: 12,
    hasTOU: false,
  },
  IA: {
    residential: 0.129,
    commercial: 0.1091,
    industrial: 0.0802,
    demandCharge: 11,
    hasTOU: false,
  },
  KS: {
    residential: 0.1364,
    commercial: 0.1142,
    industrial: 0.0878,
    demandCharge: 13,
    hasTOU: false,
  },
  KY: {
    residential: 0.1148,
    commercial: 0.102,
    industrial: 0.0641,
    demandCharge: 11,
    hasTOU: false,
  },
  LA: {
    residential: 0.1163,
    commercial: 0.1032,
    industrial: 0.071,
    demandCharge: 12,
    hasTOU: false,
  },
  ME: {
    residential: 0.2184,
    commercial: 0.1571,
    industrial: 0.1168,
    demandCharge: 15,
    hasTOU: false,
  },
  MD: {
    residential: 0.1493,
    commercial: 0.1189,
    industrial: 0.0925,
    demandCharge: 15,
    hasTOU: true,
  },
  MA: {
    residential: 0.2696,
    commercial: 0.1946,
    industrial: 0.1576,
    demandCharge: 22,
    hasTOU: true,
  },
  MI: {
    residential: 0.1729,
    commercial: 0.1427,
    industrial: 0.1017,
    demandCharge: 16,
    hasTOU: true,
  },
  MN: {
    residential: 0.1374,
    commercial: 0.1154,
    industrial: 0.0879,
    demandCharge: 13,
    hasTOU: false,
  },
  MS: {
    residential: 0.1228,
    commercial: 0.1089,
    industrial: 0.0751,
    demandCharge: 11,
    hasTOU: false,
  },
  MO: {
    residential: 0.1211,
    commercial: 0.1006,
    industrial: 0.0778,
    demandCharge: 12,
    hasTOU: false,
  },
  MT: {
    residential: 0.1187,
    commercial: 0.1049,
    industrial: 0.0759,
    demandCharge: 10,
    hasTOU: false,
  },
  NE: {
    residential: 0.1161,
    commercial: 0.0996,
    industrial: 0.0804,
    demandCharge: 11,
    hasTOU: false,
  },
  NV: {
    residential: 0.1348,
    commercial: 0.0999,
    industrial: 0.0706,
    demandCharge: 16,
    hasTOU: true,
  },
  NH: {
    residential: 0.2357,
    commercial: 0.1739,
    industrial: 0.1427,
    demandCharge: 18,
    hasTOU: false,
  },
  NJ: {
    residential: 0.178,
    commercial: 0.1372,
    industrial: 0.1066,
    demandCharge: 17,
    hasTOU: true,
  },
  NM: {
    residential: 0.1349,
    commercial: 0.1087,
    industrial: 0.0763,
    demandCharge: 13,
    hasTOU: false,
  },
  NY: {
    residential: 0.2201,
    commercial: 0.1676,
    industrial: 0.0753,
    demandCharge: 22,
    hasTOU: true,
  },
  NC: {
    residential: 0.121,
    commercial: 0.0986,
    industrial: 0.0678,
    demandCharge: 12,
    hasTOU: true,
  },
  ND: {
    residential: 0.1148,
    commercial: 0.098,
    industrial: 0.0802,
    demandCharge: 10,
    hasTOU: false,
  },
  OH: {
    residential: 0.1378,
    commercial: 0.1108,
    industrial: 0.0768,
    demandCharge: 13,
    hasTOU: false,
  },
  OK: {
    residential: 0.1132,
    commercial: 0.0919,
    industrial: 0.065,
    demandCharge: 11,
    hasTOU: false,
  },
  OR: {
    residential: 0.1211,
    commercial: 0.1019,
    industrial: 0.0765,
    demandCharge: 11,
    hasTOU: true,
  },
  PA: {
    residential: 0.1562,
    commercial: 0.1135,
    industrial: 0.0835,
    demandCharge: 14,
    hasTOU: false,
  },
  RI: {
    residential: 0.2689,
    commercial: 0.1907,
    industrial: 0.1573,
    demandCharge: 20,
    hasTOU: true,
  },
  SC: {
    residential: 0.1315,
    commercial: 0.1106,
    industrial: 0.0703,
    demandCharge: 12,
    hasTOU: false,
  },
  SD: {
    residential: 0.127,
    commercial: 0.1078,
    industrial: 0.0872,
    demandCharge: 10,
    hasTOU: false,
  },
  TN: {
    residential: 0.1167,
    commercial: 0.1074,
    industrial: 0.0738,
    demandCharge: 11,
    hasTOU: false,
  },
  TX: {
    residential: 0.1307,
    commercial: 0.1016,
    industrial: 0.0743,
    demandCharge: 15,
    hasTOU: true,
  },
  UT: {
    residential: 0.1086,
    commercial: 0.0908,
    industrial: 0.0689,
    demandCharge: 12,
    hasTOU: false,
  },
  VT: {
    residential: 0.2085,
    commercial: 0.168,
    industrial: 0.1249,
    demandCharge: 16,
    hasTOU: false,
  },
  VA: {
    residential: 0.1288,
    commercial: 0.0953,
    industrial: 0.0715,
    demandCharge: 13,
    hasTOU: true,
  },
  WA: {
    residential: 0.1079,
    commercial: 0.0953,
    industrial: 0.0624,
    demandCharge: 10,
    hasTOU: false,
  },
  WV: {
    residential: 0.1208,
    commercial: 0.103,
    industrial: 0.0732,
    demandCharge: 11,
    hasTOU: false,
  },
  WI: {
    residential: 0.1523,
    commercial: 0.1227,
    industrial: 0.0914,
    demandCharge: 13,
    hasTOU: false,
  },
  WY: {
    residential: 0.1128,
    commercial: 0.0945,
    industrial: 0.0709,
    demandCharge: 10,
    hasTOU: false,
  },
  DC: { residential: 0.1425, commercial: 0.122, industrial: 0.098, demandCharge: 18, hasTOU: true },
};

// ============================================
// ZIP CODE TO STATE MAPPING
// ============================================

function getStateFromZip(zipCode: string): string | null {
  const zip = parseInt(zipCode.substring(0, 3));

  // ZIP code prefix ranges by state
  const zipRanges: [number, number, string][] = [
    [5, 5, "NY"], // Specific NYC
    [6, 9, "PR"], // Puerto Rico
    [10, 27, "MA"],
    [28, 29, "RI"],
    [30, 38, "NH"],
    [39, 49, "ME"],
    [50, 59, "VT"],
    [60, 69, "CT"],
    [70, 89, "NJ"],
    [100, 149, "NY"],
    [150, 196, "PA"],
    [197, 199, "DE"],
    [200, 205, "DC"],
    [206, 219, "MD"],
    [220, 246, "VA"],
    [247, 268, "WV"],
    [270, 289, "NC"],
    [290, 299, "SC"],
    [300, 319, "GA"],
    [320, 339, "FL"],
    [350, 369, "AL"],
    [370, 385, "TN"],
    [386, 397, "MS"],
    [400, 427, "KY"],
    [430, 458, "OH"],
    [460, 479, "IN"],
    [480, 499, "MI"],
    [500, 528, "IA"],
    [530, 549, "WI"],
    [550, 567, "MN"],
    [570, 577, "SD"],
    [580, 588, "ND"],
    [590, 599, "MT"],
    [600, 629, "IL"],
    [630, 658, "MO"],
    [660, 679, "KS"],
    [680, 693, "NE"],
    [700, 714, "LA"],
    [716, 729, "AR"],
    [730, 749, "OK"],
    [750, 799, "TX"],
    [800, 816, "CO"],
    [820, 831, "WY"],
    [832, 838, "ID"],
    [840, 847, "UT"],
    [850, 865, "AZ"],
    [870, 884, "NM"],
    [889, 898, "NV"],
    [900, 966, "CA"],
    [967, 968, "HI"],
    [970, 979, "OR"],
    [980, 994, "WA"],
    [995, 999, "AK"],
  ];

  for (const [start, end, state] of zipRanges) {
    if (zip >= start && zip <= end) {
      return state;
    }
  }

  return null;
}

// ============================================
// MAJOR UTILITIES BY STATE
// ============================================

const MAJOR_UTILITIES: Record<string, UtilityInfo[]> = {
  CA: [
    {
      utilityId: "pge",
      name: "Pacific Gas & Electric",
      abbreviation: "PG&E",
      state: "CA",
      utilityType: "investor-owned",
      customerCount: 5500000,
    },
    {
      utilityId: "sce",
      name: "Southern California Edison",
      abbreviation: "SCE",
      state: "CA",
      utilityType: "investor-owned",
      customerCount: 5000000,
    },
    {
      utilityId: "sdge",
      name: "San Diego Gas & Electric",
      abbreviation: "SDG&E",
      state: "CA",
      utilityType: "investor-owned",
      customerCount: 1500000,
    },
    {
      utilityId: "ladwp",
      name: "Los Angeles Department of Water & Power",
      abbreviation: "LADWP",
      state: "CA",
      utilityType: "municipal",
      customerCount: 1400000,
    },
  ],
  TX: [
    {
      utilityId: "oncor",
      name: "Oncor Electric Delivery",
      state: "TX",
      utilityType: "investor-owned",
      customerCount: 3700000,
    },
    {
      utilityId: "centerpoint",
      name: "CenterPoint Energy",
      state: "TX",
      utilityType: "investor-owned",
      customerCount: 2500000,
    },
    {
      utilityId: "aep-texas",
      name: "AEP Texas",
      state: "TX",
      utilityType: "investor-owned",
      customerCount: 1000000,
    },
    {
      utilityId: "tnmp",
      name: "Texas-New Mexico Power",
      abbreviation: "TNMP",
      state: "TX",
      utilityType: "investor-owned",
      customerCount: 250000,
    },
  ],
  FL: [
    {
      utilityId: "fpl",
      name: "Florida Power & Light",
      abbreviation: "FPL",
      state: "FL",
      utilityType: "investor-owned",
      customerCount: 5600000,
    },
    {
      utilityId: "duke-fl",
      name: "Duke Energy Florida",
      state: "FL",
      utilityType: "investor-owned",
      customerCount: 1900000,
    },
    {
      utilityId: "teco",
      name: "Tampa Electric Company",
      abbreviation: "TECO",
      state: "FL",
      utilityType: "investor-owned",
      customerCount: 800000,
    },
  ],
  NY: [
    {
      utilityId: "coned",
      name: "Consolidated Edison",
      abbreviation: "ConEd",
      state: "NY",
      utilityType: "investor-owned",
      customerCount: 3500000,
    },
    {
      utilityId: "nyseg",
      name: "New York State Electric & Gas",
      abbreviation: "NYSEG",
      state: "NY",
      utilityType: "investor-owned",
      customerCount: 900000,
    },
    {
      utilityId: "national-grid-ny",
      name: "National Grid NY",
      state: "NY",
      utilityType: "investor-owned",
      customerCount: 1600000,
    },
  ],
  MI: [
    {
      utilityId: "dte",
      name: "DTE Energy",
      state: "MI",
      utilityType: "investor-owned",
      customerCount: 2200000,
    },
    {
      utilityId: "consumers",
      name: "Consumers Energy",
      state: "MI",
      utilityType: "investor-owned",
      customerCount: 1800000,
    },
    {
      utilityId: "indiana-michigan",
      name: "Indiana Michigan Power",
      abbreviation: "I&M",
      state: "MI",
      utilityType: "investor-owned",
      customerCount: 200000,
    },
  ],
  IL: [
    {
      utilityId: "comed",
      name: "Commonwealth Edison",
      abbreviation: "ComEd",
      state: "IL",
      utilityType: "investor-owned",
      customerCount: 4000000,
    },
    {
      utilityId: "ameren-il",
      name: "Ameren Illinois",
      state: "IL",
      utilityType: "investor-owned",
      customerCount: 1200000,
    },
  ],
  PA: [
    {
      utilityId: "peco",
      name: "PECO Energy",
      state: "PA",
      utilityType: "investor-owned",
      customerCount: 1600000,
    },
    {
      utilityId: "ppl",
      name: "PPL Electric Utilities",
      state: "PA",
      utilityType: "investor-owned",
      customerCount: 1400000,
    },
    {
      utilityId: "duquesne",
      name: "Duquesne Light",
      state: "PA",
      utilityType: "investor-owned",
      customerCount: 600000,
    },
  ],
  OH: [
    {
      utilityId: "aep-ohio",
      name: "AEP Ohio",
      state: "OH",
      utilityType: "investor-owned",
      customerCount: 1500000,
    },
    {
      utilityId: "firstenergy-oh",
      name: "FirstEnergy Ohio",
      state: "OH",
      utilityType: "investor-owned",
      customerCount: 2000000,
    },
    {
      utilityId: "duke-oh",
      name: "Duke Energy Ohio",
      state: "OH",
      utilityType: "investor-owned",
      customerCount: 700000,
    },
  ],
  GA: [
    {
      utilityId: "georgia-power",
      name: "Georgia Power",
      state: "GA",
      utilityType: "investor-owned",
      customerCount: 2700000,
    },
    {
      utilityId: "ga-emc",
      name: "Georgia Electric Membership Corporation",
      abbreviation: "EMC",
      state: "GA",
      utilityType: "cooperative",
      customerCount: 900000,
    },
  ],
  NC: [
    {
      utilityId: "duke-nc",
      name: "Duke Energy Carolinas",
      state: "NC",
      utilityType: "investor-owned",
      customerCount: 2400000,
    },
    {
      utilityId: "duke-progress",
      name: "Duke Energy Progress",
      state: "NC",
      utilityType: "investor-owned",
      customerCount: 1600000,
    },
  ],
  AZ: [
    {
      utilityId: "aps",
      name: "Arizona Public Service",
      abbreviation: "APS",
      state: "AZ",
      utilityType: "investor-owned",
      customerCount: 1300000,
    },
    {
      utilityId: "srp",
      name: "Salt River Project",
      abbreviation: "SRP",
      state: "AZ",
      utilityType: "municipal",
      customerCount: 1100000,
    },
    {
      utilityId: "tep",
      name: "Tucson Electric Power",
      abbreviation: "TEP",
      state: "AZ",
      utilityType: "investor-owned",
      customerCount: 450000,
    },
  ],
  MA: [
    {
      utilityId: "national-grid-ma",
      name: "National Grid Massachusetts",
      state: "MA",
      utilityType: "investor-owned",
      customerCount: 1300000,
    },
    {
      utilityId: "eversource-ma",
      name: "Eversource Massachusetts",
      state: "MA",
      utilityType: "investor-owned",
      customerCount: 1400000,
    },
  ],
  NJ: [
    {
      utilityId: "pseg",
      name: "Public Service Electric & Gas",
      abbreviation: "PSE&G",
      state: "NJ",
      utilityType: "investor-owned",
      customerCount: 2300000,
    },
    {
      utilityId: "jcpl",
      name: "Jersey Central Power & Light",
      abbreviation: "JCP&L",
      state: "NJ",
      utilityType: "investor-owned",
      customerCount: 1100000,
    },
  ],
  // ── ADDITIONAL STATES (Feb 2026 expansion) ──
  VA: [
    { utilityId: "dominion", name: "Dominion Energy Virginia", state: "VA", utilityType: "investor-owned", customerCount: 2700000 },
  ],
  AL: [
    { utilityId: "alabama-power", name: "Alabama Power", state: "AL", utilityType: "investor-owned", customerCount: 1500000 },
  ],
  SC: [
    { utilityId: "duke-carolinas", name: "Duke Energy Carolinas", state: "SC", utilityType: "investor-owned", customerCount: 800000 },
  ],
  CT: [
    { utilityId: "eversource", name: "Eversource Connecticut", state: "CT", utilityType: "investor-owned", customerCount: 1200000 },
  ],
  MN: [
    { utilityId: "xcel", name: "Xcel Energy Minnesota", state: "MN", utilityType: "investor-owned", customerCount: 1200000 },
  ],
  CO: [
    { utilityId: "xcel", name: "Xcel Energy Colorado", state: "CO", utilityType: "investor-owned", customerCount: 1400000 },
  ],
  IA: [
    { utilityId: "alliant", name: "Alliant Energy Iowa", state: "IA", utilityType: "investor-owned", customerCount: 500000 },
  ],
  WI: [
    { utilityId: "weenergies", name: "WE Energies", state: "WI", utilityType: "investor-owned", customerCount: 1100000 },
  ],
  NV: [
    { utilityId: "nv-energy", name: "NV Energy", state: "NV", utilityType: "investor-owned", customerCount: 1000000 },
  ],
  WA: [
    { utilityId: "pse", name: "Puget Sound Energy", abbreviation: "PSE", state: "WA", utilityType: "investor-owned", customerCount: 1200000 },
  ],
  OR: [
    { utilityId: "pge-oregon", name: "Portland General Electric", abbreviation: "PGE", state: "OR", utilityType: "investor-owned", customerCount: 900000 },
  ],
  UT: [
    { utilityId: "rocky-mountain", name: "Rocky Mountain Power", state: "UT", utilityType: "investor-owned", customerCount: 1000000 },
  ],
  HI: [
    { utilityId: "heco", name: "Hawaiian Electric", abbreviation: "HECO", state: "HI", utilityType: "investor-owned", customerCount: 300000 },
  ],
  RI: [
    { utilityId: "nationalgrid-ne", name: "National Grid Rhode Island", state: "RI", utilityType: "investor-owned", customerCount: 500000 },
  ],
  NH: [
    { utilityId: "eversource", name: "Eversource New Hampshire", state: "NH", utilityType: "investor-owned", customerCount: 500000 },
  ],
};

// ============================================
// UTILITY-SPECIFIC RATES (Sample high-detail data)
// ============================================

const UTILITY_SPECIFIC_RATES: Record<string, Partial<UtilityRate>> = {
  // ═══════════════════════════════════════════════════════════════
  // TOP 30 US UTILITIES BY CUSTOMER COUNT (EIA 2024)
  // Sources: EIA-861, utility published tariffs, NREL URDB
  // ═══════════════════════════════════════════════════════════════

  // ── CALIFORNIA ──
  pge: {
    commercialRate: 0.24, industrialRate: 0.18,
    hasTOU: true, peakRate: 0.42, offPeakRate: 0.18, peakHours: "4pm-9pm",
    hasDemandCharge: true, demandCharge: 22, peakDemandCharge: 28,
    netMeteringAvailable: true, netMeteringType: "time-of-export",
  },
  sce: {
    commercialRate: 0.22, industrialRate: 0.16,
    hasTOU: true, peakRate: 0.38, offPeakRate: 0.16, peakHours: "4pm-9pm",
    hasDemandCharge: true, demandCharge: 20, peakDemandCharge: 25,
    netMeteringAvailable: true, netMeteringType: "time-of-export",
  },
  sdge: {
    commercialRate: 0.28, industrialRate: 0.22,
    hasTOU: true, peakRate: 0.52, offPeakRate: 0.22, peakHours: "4pm-9pm",
    hasDemandCharge: true, demandCharge: 25, peakDemandCharge: 32,
    netMeteringAvailable: true, netMeteringType: "time-of-export",
  },
  ladwp: {
    commercialRate: 0.17, industrialRate: 0.12,
    hasTOU: true, peakRate: 0.28, offPeakRate: 0.10, peakHours: "1pm-5pm",
    hasDemandCharge: true, demandCharge: 16, peakDemandCharge: 22,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  smud: {
    commercialRate: 0.14, industrialRate: 0.10,
    hasTOU: true, peakRate: 0.26, offPeakRate: 0.09, peakHours: "5pm-8pm",
    hasDemandCharge: true, demandCharge: 12,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── TEXAS (ERCOT — deregulated) ──
  oncor: {
    commercialRate: 0.11, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.18, offPeakRate: 0.06, peakHours: "1pm-7pm",
    hasDemandCharge: true, demandCharge: 12,
    netMeteringAvailable: false,
  },
  centerpoint: {
    commercialRate: 0.12, industrialRate: 0.09,
    hasTOU: true, peakRate: 0.19, offPeakRate: 0.07, peakHours: "1pm-7pm",
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: false,
  },
  aep_texas: {
    commercialRate: 0.10, industrialRate: 0.07,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: false,
  },
  cps_energy: {
    commercialRate: 0.10, industrialRate: 0.07,
    hasTOU: true, peakRate: 0.14, offPeakRate: 0.06, peakHours: "2pm-8pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },

  // ── NEW YORK ──
  coned: {
    commercialRate: 0.22, industrialRate: 0.18,
    hasTOU: true, peakRate: 0.35, offPeakRate: 0.12, peakHours: "8am-12am",
    hasDemandCharge: true, demandCharge: 25, peakDemandCharge: 35,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  nyseg: {
    commercialRate: 0.14, industrialRate: 0.10,
    hasTOU: true, peakRate: 0.20, offPeakRate: 0.08, peakHours: "2pm-6pm",
    hasDemandCharge: true, demandCharge: 14,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  nationalgrid_ny: {
    commercialRate: 0.16, industrialRate: 0.12,
    hasTOU: true, peakRate: 0.24, offPeakRate: 0.09, peakHours: "2pm-7pm",
    hasDemandCharge: true, demandCharge: 16,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── FLORIDA ──
  fpl: {
    commercialRate: 0.11, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.14, offPeakRate: 0.08, peakHours: "12pm-9pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  duke_fl: {
    commercialRate: 0.12, industrialRate: 0.09,
    hasTOU: true, peakRate: 0.16, offPeakRate: 0.08, peakHours: "12pm-9pm",
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  teco: {
    commercialRate: 0.11, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.15, offPeakRate: 0.07, peakHours: "12pm-9pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── MICHIGAN ──
  dte: {
    commercialRate: 0.15, industrialRate: 0.10,
    hasTOU: true, peakRate: 0.22, offPeakRate: 0.08, peakHours: "11am-7pm",
    hasDemandCharge: true, demandCharge: 14, peakDemandCharge: 18,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  consumers: {
    commercialRate: 0.14, industrialRate: 0.09,
    hasTOU: true, peakRate: 0.20, offPeakRate: 0.07, peakHours: "2pm-7pm",
    hasDemandCharge: true, demandCharge: 12, peakDemandCharge: 16,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── ILLINOIS ──
  comed: {
    commercialRate: 0.13, industrialRate: 0.09,
    hasTOU: true, peakRate: 0.18, offPeakRate: 0.06, peakHours: "2pm-7pm",
    hasDemandCharge: true, demandCharge: 12,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  ameren_il: {
    commercialRate: 0.12, industrialRate: 0.08,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── OHIO ──
  aep_ohio: {
    commercialRate: 0.12, industrialRate: 0.08,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  firstenergy_oh: {
    commercialRate: 0.13, industrialRate: 0.09,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 12,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── PENNSYLVANIA ──
  peco: {
    commercialRate: 0.14, industrialRate: 0.10,
    hasTOU: true, peakRate: 0.20, offPeakRate: 0.08, peakHours: "2pm-6pm",
    hasDemandCharge: true, demandCharge: 14,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  ppl: {
    commercialRate: 0.12, industrialRate: 0.08,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── NEW ENGLAND ──
  eversource: {
    commercialRate: 0.22, industrialRate: 0.17,
    hasTOU: true, peakRate: 0.32, offPeakRate: 0.14, peakHours: "1pm-7pm",
    hasDemandCharge: true, demandCharge: 18, peakDemandCharge: 24,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  nationalgrid_ne: {
    commercialRate: 0.20, industrialRate: 0.15,
    hasTOU: true, peakRate: 0.28, offPeakRate: 0.12, peakHours: "1pm-7pm",
    hasDemandCharge: true, demandCharge: 16,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── SOUTHEAST ──
  duke_carolinas: {
    commercialRate: 0.10, industrialRate: 0.07,
    hasTOU: true, peakRate: 0.15, offPeakRate: 0.06, peakHours: "1pm-6pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },
  georgia_power: {
    commercialRate: 0.11, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.16, offPeakRate: 0.06, peakHours: "2pm-7pm",
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },
  alabama_power: {
    commercialRate: 0.11, industrialRate: 0.07,
    hasTOU: true, peakRate: 0.15, offPeakRate: 0.06, peakHours: "2pm-7pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: false,
  },
  dominion: {
    commercialRate: 0.11, industrialRate: 0.07,
    hasTOU: true, peakRate: 0.16, offPeakRate: 0.06, peakHours: "1pm-7pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── MIDWEST ──
  xcel: {
    commercialRate: 0.12, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.17, offPeakRate: 0.06, peakHours: "3pm-8pm",
    hasDemandCharge: true, demandCharge: 12,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  alliant: {
    commercialRate: 0.13, industrialRate: 0.09,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },
  weenergies: {
    commercialRate: 0.13, industrialRate: 0.09,
    hasTOU: true, peakRate: 0.18, offPeakRate: 0.07, peakHours: "9am-9pm",
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },

  // ── WEST ──
  aps: {
    commercialRate: 0.11, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.22, offPeakRate: 0.06, peakHours: "4pm-7pm",
    hasDemandCharge: true, demandCharge: 12,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },
  srp: {
    commercialRate: 0.10, industrialRate: 0.07,
    hasTOU: true, peakRate: 0.20, offPeakRate: 0.05, peakHours: "2pm-8pm",
    hasDemandCharge: true, demandCharge: 11,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },
  nv_energy: {
    commercialRate: 0.10, industrialRate: 0.07,
    hasTOU: true, peakRate: 0.18, offPeakRate: 0.06, peakHours: "1pm-7pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },
  pse: { // Puget Sound Energy (WA)
    commercialRate: 0.10, industrialRate: 0.07,
    hasTOU: false,
    hasDemandCharge: true, demandCharge: 8,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  pge_oregon: { // Portland General Electric
    commercialRate: 0.11, industrialRate: 0.08,
    hasTOU: true, peakRate: 0.16, offPeakRate: 0.06, peakHours: "3pm-8pm",
    hasDemandCharge: true, demandCharge: 10,
    netMeteringAvailable: true, netMeteringType: "full-retail",
  },
  rocky_mountain: { // Rocky Mountain Power (UT/WY/ID)
    commercialRate: 0.09, industrialRate: 0.06,
    hasTOU: true, peakRate: 0.14, offPeakRate: 0.05, peakHours: "3pm-8pm",
    hasDemandCharge: true, demandCharge: 9,
    netMeteringAvailable: true, netMeteringType: "avoided-cost",
  },

  // ── HAWAII ──
  heco: {
    commercialRate: 0.32, industrialRate: 0.28,
    hasTOU: true, peakRate: 0.45, offPeakRate: 0.25, peakHours: "5pm-9pm",
    hasDemandCharge: true, demandCharge: 30, peakDemandCharge: 40,
    netMeteringAvailable: true, netMeteringType: "time-of-export",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE SCHEDULE TIERS BY PEAK DEMAND (Tier 2 — tariff-aware lookup)
// Each utility has multiple commercial tariff schedules based on peak kW.
// Sources: state PUC rate filings, utility published tariffs (2025).
// Car washes/hotels/gas stations (50–500 kW) land in the medium bracket.
// ═══════════════════════════════════════════════════════════════════════════
const UTILITY_RATE_SCHEDULES: Record<string, CommercialRateSchedule[]> = {
  // ── MICHIGAN ──
  dte: [
    { name: "D3.1", label: "Small Commercial General Service", minKW: 0, maxKW: 100, demandCharge: 11, commercialRate: 0.143, hasTOU: false },
    { name: "D3.2", label: "Medium Commercial General Service", minKW: 100, maxKW: 1000, demandCharge: 14, commercialRate: 0.151, hasTOU: true, peakRate: 0.19, offPeakRate: 0.11, peakHours: "11am-8pm" },
    { name: "D3.3", label: "Large Power Service", minKW: 1000, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  consumers: [
    { name: "D-1", label: "Small General Service", minKW: 0, maxKW: 50, demandCharge: 9, hasTOU: false },
    { name: "D-3", label: "General Service", minKW: 50, maxKW: 1000, demandCharge: 11, hasTOU: true, peakRate: 0.15, offPeakRate: 0.09, peakHours: "2pm-7pm" },
    { name: "D-15", label: "Large Power Service", minKW: 1000, maxKW: Infinity, demandCharge: 8, hasTOU: true },
  ],
  // ── ARIZONA ──
  aps: [
    { name: "SGS", label: "Small General Service", minKW: 0, maxKW: 30, demandCharge: 8, commercialRate: 0.125, hasTOU: false },
    { name: "GS-65", label: "General Service", minKW: 30, maxKW: 300, demandCharge: 14, commercialRate: 0.142, hasTOU: true, peakRate: 0.21, offPeakRate: 0.10, peakHours: "3pm-8pm" },
    { name: "GS-90", label: "Large General Service", minKW: 300, maxKW: 3000, demandCharge: 17, commercialRate: 0.128, hasTOU: true, peakRate: 0.20, offPeakRate: 0.09, peakHours: "3pm-8pm" },
    { name: "LGS-1", label: "Extra Large Power", minKW: 3000, maxKW: Infinity, demandCharge: 12, hasTOU: true },
  ],
  srp: [
    { name: "E-36", label: "Small General Service", minKW: 0, maxKW: 40, demandCharge: 8, hasTOU: false },
    { name: "E-32", label: "General Service", minKW: 40, maxKW: 3000, demandCharge: 15, hasTOU: true, peakRate: 0.22, offPeakRate: 0.08, peakHours: "3pm-8pm" },
    { name: "E-26", label: "Large Power", minKW: 3000, maxKW: Infinity, demandCharge: 10, hasTOU: true },
  ],
  // ── CALIFORNIA ──
  pge: [
    { name: "B-6", label: "Small Business", minKW: 0, maxKW: 75, demandCharge: 0, commercialRate: 0.26, hasTOU: false },
    { name: "E-19", label: "Medium Commercial TOU", minKW: 75, maxKW: 1000, demandCharge: 22, commercialRate: 0.24, hasTOU: true, peakRate: 0.42, offPeakRate: 0.18, peakHours: "4pm-9pm" },
    { name: "A-6", label: "Large Commercial TOU", minKW: 1000, maxKW: Infinity, demandCharge: 25, hasTOU: true },
  ],
  sce: [
    { name: "TOU-GS-1", label: "Small General Service TOU", minKW: 0, maxKW: 30, demandCharge: 8, commercialRate: 0.20, hasTOU: true, peakRate: 0.38, offPeakRate: 0.13, peakHours: "4pm-9pm" },
    { name: "TOU-GS-2", label: "Medium General Service TOU", minKW: 30, maxKW: 500, demandCharge: 20, commercialRate: 0.22, hasTOU: true, peakRate: 0.38, offPeakRate: 0.16, peakHours: "4pm-9pm" },
    { name: "TOU-GS-3", label: "Large General Service TOU", minKW: 500, maxKW: 2000, demandCharge: 22, hasTOU: true, peakRate: 0.36, offPeakRate: 0.14, peakHours: "4pm-9pm" },
  ],
  sdge: [
    { name: "AX", label: "Small Commercial", minKW: 0, maxKW: 30, demandCharge: 15, commercialRate: 0.26, hasTOU: false },
    { name: "AL-TOU", label: "Medium Commercial TOU", minKW: 30, maxKW: 200, demandCharge: 22, commercialRate: 0.28, hasTOU: true, peakRate: 0.52, offPeakRate: 0.18, peakHours: "4pm-9pm" },
    { name: "AL-TOU-L", label: "Large Commercial TOU", minKW: 200, maxKW: Infinity, demandCharge: 25, hasTOU: true, peakRate: 0.48, offPeakRate: 0.18, peakHours: "4pm-9pm" },
  ],
  ladwp: [
    { name: "A-2", label: "Small General Service", minKW: 0, maxKW: 30, demandCharge: 8, hasTOU: false },
    { name: "A-3", label: "Medium General Service", minKW: 30, maxKW: 1000, demandCharge: 16, hasTOU: true, peakRate: 0.28, offPeakRate: 0.10, peakHours: "1pm-5pm" },
    { name: "A-4", label: "Large Power", minKW: 1000, maxKW: Infinity, demandCharge: 13, hasTOU: true },
  ],
  smud: [
    { name: "GS-1", label: "Small General Service", minKW: 0, maxKW: 30, demandCharge: 7, hasTOU: false },
    { name: "GS-3", label: "Medium General Service", minKW: 30, maxKW: 500, demandCharge: 12, hasTOU: true, peakRate: 0.26, offPeakRate: 0.09, peakHours: "5pm-8pm" },
  ],
  // ── TEXAS (ERCOT — deregulated; distribution-only tariffs) ──
  oncor: [
    { name: "Commercial-CS", label: "Small Commercial", minKW: 0, maxKW: 20, demandCharge: 7, hasTOU: false },
    { name: "Secondary-SD", label: "Secondary Delivery", minKW: 20, maxKW: 250, demandCharge: 10, hasTOU: true, peakRate: 0.18, offPeakRate: 0.06, peakHours: "1pm-7pm" },
    { name: "Primary-D", label: "Primary Delivery", minKW: 250, maxKW: Infinity, demandCharge: 8, hasTOU: true },
  ],
  centerpoint: [
    { name: "SGS", label: "Small General Service", minKW: 0, maxKW: 20, demandCharge: 5, hasTOU: false },
    { name: "Commercial", label: "Commercial Service", minKW: 20, maxKW: 200, demandCharge: 11, hasTOU: true, peakRate: 0.19, offPeakRate: 0.07, peakHours: "1pm-7pm" },
    { name: "Large-CS", label: "Large Commercial", minKW: 200, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  cps_energy: [
    { name: "GS-15", label: "General Service Small", minKW: 0, maxKW: 15, demandCharge: 6, hasTOU: false },
    { name: "GS-150", label: "General Service", minKW: 15, maxKW: 1500, demandCharge: 10, hasTOU: true, peakRate: 0.14, offPeakRate: 0.06, peakHours: "2pm-8pm" },
  ],
  // ── NEW YORK ──
  coned: [
    { name: "SC-9-I", label: "Small Commercial Service", minKW: 0, maxKW: 50, demandCharge: 20, hasTOU: true },
    { name: "SC-9-II", label: "Commercial Service", minKW: 50, maxKW: 750, demandCharge: 25, hasTOU: true, peakRate: 0.35, offPeakRate: 0.12, peakHours: "8am-12am" },
    { name: "SC-9-III", label: "Large Commercial Service", minKW: 750, maxKW: Infinity, demandCharge: 30, hasTOU: true },
  ],
  nyseg: [
    { name: "SC-2", label: "Small Commercial", minKW: 0, maxKW: 50, demandCharge: 9, hasTOU: false },
    { name: "SC-3", label: "Medium Commercial", minKW: 50, maxKW: 500, demandCharge: 14, hasTOU: true, peakRate: 0.20, offPeakRate: 0.08, peakHours: "2pm-6pm" },
    { name: "SC-3-L", label: "Large Commercial", minKW: 500, maxKW: Infinity, demandCharge: 11, hasTOU: true },
  ],
  nationalgrid_ny: [
    { name: "SC-3B", label: "Small General Service", minKW: 0, maxKW: 75, demandCharge: 12, hasTOU: false },
    { name: "SC-3C", label: "Medium General Service", minKW: 75, maxKW: 1000, demandCharge: 16, hasTOU: true, peakRate: 0.24, offPeakRate: 0.09, peakHours: "2pm-7pm" },
  ],
  // ── FLORIDA ──
  fpl: [
    { name: "GSLD-1", label: "General Service Low Demand", minKW: 0, maxKW: 200, demandCharge: 10, commercialRate: 0.11, hasTOU: true },
    { name: "GSLD-2", label: "General Service Large Demand", minKW: 200, maxKW: 2000, demandCharge: 13, hasTOU: true, peakRate: 0.14, offPeakRate: 0.08, peakHours: "12pm-9pm" },
    { name: "SL-1", label: "Substation Service", minKW: 2000, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  duke_fl: [
    { name: "GS-2", label: "Small General Service", minKW: 0, maxKW: 100, demandCharge: 8, hasTOU: false },
    { name: "GS-3", label: "Medium General Service", minKW: 100, maxKW: 1000, demandCharge: 11, hasTOU: true, peakRate: 0.16, offPeakRate: 0.08, peakHours: "12pm-9pm" },
  ],
  teco: [
    { name: "GS-1", label: "General Service", minKW: 0, maxKW: 200, demandCharge: 9, hasTOU: false },
    { name: "LGS", label: "Large General Service", minKW: 200, maxKW: Infinity, demandCharge: 12, hasTOU: true, peakRate: 0.15, offPeakRate: 0.07, peakHours: "12pm-9pm" },
  ],
  // ── SOUTHEAST ──
  georgia_power: [
    { name: "SGLP", label: "Small Light & Power", minKW: 0, maxKW: 50, demandCharge: 0, commercialRate: 0.115, hasTOU: false },
    { name: "MGLP", label: "Medium General Service", minKW: 50, maxKW: 900, demandCharge: 11, hasTOU: true, peakRate: 0.13, offPeakRate: 0.07 },
    { name: "LGLP", label: "Large General Power", minKW: 900, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  alabama_power: [
    { name: "LPT", label: "Light & Power Service", minKW: 0, maxKW: 30, demandCharge: 7, hasTOU: false },
    { name: "LPM", label: "Medium Light & Power", minKW: 30, maxKW: 750, demandCharge: 10, hasTOU: true },
    { name: "LPL", label: "Large Light & Power", minKW: 750, maxKW: Infinity, demandCharge: 8, hasTOU: true },
  ],
  duke_carolinas: [
    { name: "GS-2", label: "Small General Service", minKW: 0, maxKW: 100, demandCharge: 8, hasTOU: false },
    { name: "GS-3", label: "Medium General Service", minKW: 100, maxKW: 750, demandCharge: 12, hasTOU: true, peakRate: 0.14, offPeakRate: 0.08 },
    { name: "GS-4", label: "Large General Service", minKW: 750, maxKW: Infinity, demandCharge: 10, hasTOU: true },
  ],
  dominion: [
    { name: "Schedule 1", label: "Small General Service", minKW: 0, maxKW: 30, demandCharge: 8, hasTOU: false },
    { name: "Schedule 3", label: "Medium General Service", minKW: 30, maxKW: 500, demandCharge: 12, hasTOU: true },
    { name: "Schedule 5", label: "Large General Service", minKW: 500, maxKW: Infinity, demandCharge: 10, hasTOU: true },
  ],
  // ── PENNSYLVANIA ──
  peco: [
    { name: "GS-1", label: "Small General Service", minKW: 0, maxKW: 100, demandCharge: 8, hasTOU: false },
    { name: "HT-L", label: "High-Tension Large Power", minKW: 100, maxKW: 500, demandCharge: 14, hasTOU: true },
    { name: "GP", label: "General Power", minKW: 500, maxKW: Infinity, demandCharge: 12, hasTOU: true },
  ],
  ppl: [
    { name: "GS-2", label: "General Service", minKW: 0, maxKW: 100, demandCharge: 9, hasTOU: false },
    { name: "LP-4", label: "Large Power", minKW: 100, maxKW: 500, demandCharge: 13, hasTOU: true },
    { name: "LP-5", label: "Transmission Power", minKW: 500, maxKW: Infinity, demandCharge: 10, hasTOU: true },
  ],
  // ── ILLINOIS ──
  comed: [
    { name: "DS-1", label: "Small Commercial", minKW: 0, maxKW: 100, demandCharge: 9, hasTOU: true },
    { name: "DS-2", label: "Medium Commercial", minKW: 100, maxKW: 4000, demandCharge: 14, hasTOU: true, peakRate: 0.18, offPeakRate: 0.09 },
    { name: "DS-3", label: "Large Commercial", minKW: 4000, maxKW: Infinity, demandCharge: 11, hasTOU: true },
  ],
  ameren_il: [
    { name: "BTES", label: "Small Commercial Service", minKW: 0, maxKW: 10, demandCharge: 0, hasTOU: false },
    { name: "RTPF-1", label: "Medium Commercial", minKW: 10, maxKW: 1000, demandCharge: 11, hasTOU: true },
    { name: "RTPF-2", label: "Large Commercial", minKW: 1000, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  // ── OHIO ──
  aep_ohio: [
    { name: "Standard-S", label: "Small Commercial", minKW: 0, maxKW: 50, demandCharge: 8, hasTOU: false },
    { name: "Commercial-C", label: "Commercial", minKW: 50, maxKW: 1000, demandCharge: 11, hasTOU: true },
    { name: "Industrial-I", label: "Industrial", minKW: 1000, maxKW: Infinity, demandCharge: 8, hasTOU: true },
  ],
  firstenergy_oh: [
    { name: "GS-1", label: "General Service", minKW: 0, maxKW: 100, demandCharge: 9, hasTOU: false },
    { name: "GS-2", label: "Large General Service", minKW: 100, maxKW: 1000, demandCharge: 13, hasTOU: true },
  ],
  // ── NEW ENGLAND ──
  eversource: [
    { name: "G-1", label: "Small General Service", minKW: 0, maxKW: 50, demandCharge: 11, hasTOU: false },
    { name: "G-2", label: "Medium General Service", minKW: 50, maxKW: 500, demandCharge: 17, hasTOU: true, peakRate: 0.28, offPeakRate: 0.10 },
    { name: "G-3", label: "Large General Service", minKW: 500, maxKW: Infinity, demandCharge: 14, hasTOU: true },
  ],
  nationalgrid_ne: [
    { name: "G-01", label: "Small Commercial", minKW: 0, maxKW: 30, demandCharge: 10, hasTOU: false },
    { name: "G-02", label: "Medium Commercial", minKW: 30, maxKW: 500, demandCharge: 15, hasTOU: true },
  ],
  // ── MIDWEST ──
  xcel: [
    { name: "Small-Cg", label: "Small Commercial General Service", minKW: 0, maxKW: 50, demandCharge: 8, hasTOU: false },
    { name: "Cg", label: "Commercial General Service", minKW: 50, maxKW: 500, demandCharge: 13, hasTOU: true, peakRate: 0.19, offPeakRate: 0.08 },
    { name: "SG", label: "Large General Service", minKW: 500, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  alliant: [
    { name: "GS-1", label: "Small General Service", minKW: 0, maxKW: 50, demandCharge: 8, hasTOU: false },
    { name: "GS-2", label: "General Service", minKW: 50, maxKW: 1000, demandCharge: 11, hasTOU: true },
  ],
  weenergies: [
    { name: "Cg-1", label: "Small Commercial", minKW: 0, maxKW: 50, demandCharge: 7, hasTOU: false },
    { name: "Cg-2", label: "Medium Commercial", minKW: 50, maxKW: 1000, demandCharge: 12, hasTOU: true },
  ],
  // ── WEST ──
  pse: [
    { name: "General-Small", label: "Small General Purpose", minKW: 0, maxKW: 75, demandCharge: 8, hasTOU: false },
    { name: "Medium-GS", label: "Medium General Service", minKW: 75, maxKW: 500, demandCharge: 12, hasTOU: true },
    { name: "Large-GS", label: "Large General Service", minKW: 500, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  pge_oregon: [
    { name: "Sch-22", label: "Small Commercial", minKW: 0, maxKW: 30, demandCharge: 7, hasTOU: false },
    { name: "Sch-32", label: "Medium General Service", minKW: 30, maxKW: 1000, demandCharge: 12, hasTOU: true, peakRate: 0.16, offPeakRate: 0.07 },
    { name: "Sch-48", label: "Large General Service", minKW: 1000, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  rocky_mountain: [
    { name: "Sch-6", label: "Small General Service", minKW: 0, maxKW: 100, demandCharge: 10, hasTOU: false },
    { name: "Sch-8", label: "Medium General Service", minKW: 100, maxKW: 1000, demandCharge: 14, hasTOU: true },
    { name: "Sch-9", label: "Large General Service", minKW: 1000, maxKW: Infinity, demandCharge: 11, hasTOU: true },
  ],
  nv_energy: [
    { name: "GS-15", label: "Small General Service", minKW: 0, maxKW: 30, demandCharge: 8, hasTOU: false },
    { name: "GS-Secondary", label: "General Service", minKW: 30, maxKW: 1000, demandCharge: 12, hasTOU: true },
    { name: "GS-Primary", label: "Large Power", minKW: 1000, maxKW: Infinity, demandCharge: 9, hasTOU: true },
  ],
  heco: [
    { name: "G", label: "Small General Service", minKW: 0, maxKW: 30, demandCharge: 15, hasTOU: false },
    { name: "J", label: "General Service", minKW: 30, maxKW: 500, demandCharge: 21, commercialRate: 0.32, hasTOU: true, peakRate: 0.45, offPeakRate: 0.25, peakHours: "5pm-9pm" },
    { name: "P", label: "Large Power", minKW: 500, maxKW: Infinity, demandCharge: 25, hasTOU: true },
  ],
};

// ============================================
// ZIP CODE TO UTILITY MAPPING (Major metros)
// ============================================

const ZIP_TO_UTILITY: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════
  // EXPANDED ZIP→UTILITY MAPPING (Feb 2026)
  // 3-digit prefixes checked first, then 2-digit fallback
  // Source: USPS ZIP code assignments + utility service territory maps
  // ═══════════════════════════════════════════════════════════════

  // ── CALIFORNIA ──
  // PG&E territory (Northern/Central CA)
  "93": "pge", "94": "pge", "95": "pge", "96": "pge",
  // SCE territory (SoCal)
  "90": "sce", "91": "sce", "92": "sce",
  // SDG&E territory (San Diego)
  "919": "sdge", "920": "sdge", "921": "sdge",
  // LADWP (Los Angeles)
  "900": "ladwp", "901": "ladwp", "902": "ladwp",
  // SMUD (Sacramento)
  "956": "smud", "957": "smud", "958": "smud",

  // ── TEXAS (ERCOT) ──
  // Oncor (DFW + Central TX)
  "750": "oncor", "751": "oncor", "752": "oncor", "760": "oncor", "761": "oncor",
  "753": "oncor", "754": "oncor", "762": "oncor", "763": "oncor",
  // CenterPoint (Houston)
  "770": "centerpoint", "771": "centerpoint", "772": "centerpoint",
  "773": "centerpoint", "774": "centerpoint", "775": "centerpoint",
  // CPS Energy (San Antonio)
  "782": "cps_energy",
  // AEP Texas (South/West TX)
  "783": "aep_texas", "784": "aep_texas", "785": "aep_texas",
  "787": "aep_texas", "788": "aep_texas", "789": "aep_texas",

  // ── NEW YORK ──
  // ConEd (NYC + Westchester)
  "100": "coned", "101": "coned", "102": "coned", "103": "coned",
  "104": "coned", "105": "coned", "106": "coned", "107": "coned",
  // NYSEG (Upstate NY)
  "138": "nyseg", "139": "nyseg", "148": "nyseg", "149": "nyseg",
  // National Grid NY (Buffalo, Syracuse, Albany)
  "120": "nationalgrid_ny", "121": "nationalgrid_ny", "122": "nationalgrid_ny",
  "130": "nationalgrid_ny", "131": "nationalgrid_ny", "132": "nationalgrid_ny",
  "140": "nationalgrid_ny", "141": "nationalgrid_ny", "142": "nationalgrid_ny",

  // ── FLORIDA ──
  // FPL (East coast FL)
  "330": "fpl", "331": "fpl", "332": "fpl", "334": "fpl",
  "338": "fpl",
  // Duke Energy Florida (West coast FL)
  "337": "duke_fl", "339": "duke_fl", "346": "duke_fl", "347": "duke_fl",
  // TECO (Tampa Bay — covers 335, 336)
  "335": "teco", "336": "teco",

  // ── MICHIGAN ──
  // DTE (Southeast Michigan)
  "480": "dte", "481": "dte", "482": "dte", "483": "dte",
  // Consumers Energy (West/Central Michigan)
  "490": "consumers", "491": "consumers", "493": "consumers",
  "494": "consumers", "495": "consumers",

  // ── ILLINOIS ──
  // ComEd (Chicago metro + Northern IL)
  "600": "comed", "601": "comed", "602": "comed", "603": "comed",
  "604": "comed", "605": "comed", "606": "comed",
  // Ameren IL (Southern IL)
  "620": "ameren_il", "621": "ameren_il", "622": "ameren_il",
  "623": "ameren_il", "625": "ameren_il", "627": "ameren_il",

  // ── OHIO ──
  // AEP Ohio (Columbus, Canton)
  "430": "aep_ohio", "431": "aep_ohio", "432": "aep_ohio",
  "437": "aep_ohio", "438": "aep_ohio",
  // FirstEnergy OH (Cleveland, Akron)
  "440": "firstenergy_oh", "441": "firstenergy_oh", "442": "firstenergy_oh",
  "443": "firstenergy_oh", "444": "firstenergy_oh",

  // ── PENNSYLVANIA ──
  // PECO (Philadelphia metro)
  "190": "peco", "191": "peco", "192": "peco", "193": "peco", "194": "peco",
  // PPL (Eastern PA)
  "170": "ppl", "171": "ppl", "175": "ppl", "176": "ppl", "177": "ppl",
  "180": "ppl", "181": "ppl", "182": "ppl", "183": "ppl", "184": "ppl",

  // ── NEW ENGLAND ──
  // Eversource (CT + eastern MA + NH)
  "06": "eversource", // CT (2-digit fallback)
  "010": "eversource", "011": "eversource", "012": "eversource",
  "013": "eversource", // Western MA
  "020": "eversource", "021": "eversource", "022": "eversource",
  "023": "eversource", "024": "eversource", // Eastern MA
  "030": "eversource", "031": "eversource", "032": "eversource", // NH
  // National Grid NE (RI + southeastern MA)
  "028": "nationalgrid_ne", "029": "nationalgrid_ne", // RI
  "025": "nationalgrid_ne", "026": "nationalgrid_ne", "027": "nationalgrid_ne", // SE MA

  // ── SOUTHEAST ──
  // Duke Carolinas (NC + SC)
  "270": "duke_carolinas", "271": "duke_carolinas", "272": "duke_carolinas",
  "280": "duke_carolinas", "281": "duke_carolinas", "282": "duke_carolinas",
  "290": "duke_carolinas", "291": "duke_carolinas", "292": "duke_carolinas",
  // Georgia Power
  "300": "georgia_power", "301": "georgia_power", "302": "georgia_power",
  "303": "georgia_power", "304": "georgia_power", "305": "georgia_power",
  "306": "georgia_power", "310": "georgia_power", "311": "georgia_power",
  // Alabama Power
  "350": "alabama_power", "351": "alabama_power", "352": "alabama_power",
  "353": "alabama_power", "354": "alabama_power", "355": "alabama_power",
  "360": "alabama_power", "361": "alabama_power", "362": "alabama_power",
  // Dominion Energy (VA)
  "220": "dominion", "221": "dominion", "222": "dominion", "223": "dominion",
  "224": "dominion", "225": "dominion", "226": "dominion", "230": "dominion",
  "231": "dominion", "232": "dominion", "233": "dominion", "234": "dominion",

  // ── MIDWEST ──
  // Xcel Energy (MN + CO)
  "550": "xcel", "551": "xcel", "553": "xcel", "554": "xcel", "555": "xcel", // MN
  "800": "xcel", "801": "xcel", "802": "xcel", "803": "xcel", // CO
  // Alliant Energy (IA + WI)
  "500": "alliant", "502": "alliant", "503": "alliant", "504": "alliant",
  // WE Energies (Milwaukee, WI)
  "530": "weenergies", "531": "weenergies", "532": "weenergies",

  // ── WEST ──
  // APS (Arizona Public Service — Phoenix metro)
  "850": "aps", "851": "aps", "853": "aps",
  // SRP (Salt River Project — East Valley AZ, covers 852)
  "852": "srp", "855": "srp",
  // NV Energy (Las Vegas, Reno)
  "889": "nv_energy", "890": "nv_energy", "891": "nv_energy",
  "893": "nv_energy", "894": "nv_energy", "895": "nv_energy",
  // Puget Sound Energy (WA)
  "980": "pse", "981": "pse", "983": "pse", "984": "pse",
  // Portland General Electric (OR)
  "970": "pge_oregon", "971": "pge_oregon", "972": "pge_oregon",
  // Rocky Mountain Power (UT)
  "840": "rocky_mountain", "841": "rocky_mountain", "843": "rocky_mountain",
  "844": "rocky_mountain", "845": "rocky_mountain", "846": "rocky_mountain",

  // ── HAWAII ──
  "967": "heco", "968": "heco",
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Get utility rates by ZIP code
 * Uses a combination of NREL API, EIA data, and local mappings
 */
export async function getUtilityRatesByZip(zipCode: string): Promise<ZipCodeUtilityData | null> {
  // Validate ZIP code
  if (!zipCode || zipCode.length < 5) {
    console.error("Invalid ZIP code");
    return null;
  }

  const normalizedZip = zipCode.substring(0, 5);

  // Check cache first
  const cached = rateCache.get(normalizedZip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    if (import.meta.env.DEV) {
      console.log(`[UtilityRateService] Cache hit for ZIP ${normalizedZip}`);
    }
    return cached.data;
  }

  // Get state from ZIP
  const stateCode = getStateFromZip(normalizedZip);
  if (!stateCode) {
    console.error(`Could not determine state for ZIP ${normalizedZip}`);
    return null;
  }

  // Get state rates from EIA data
  const stateRates = EIA_STATE_RATES[stateCode];
  if (!stateRates) {
    console.error(`No rate data for state ${stateCode}`);
    return null;
  }

  // Try to identify specific utility
  const zipPrefix3 = normalizedZip.substring(0, 3);
  const zipPrefix2 = normalizedZip.substring(0, 2);
  const utilityId = ZIP_TO_UTILITY[zipPrefix3] || ZIP_TO_UTILITY[zipPrefix2];

  // Get utilities for this state
  const stateUtilities = MAJOR_UTILITIES[stateCode] || [];
  const primaryUtility = utilityId
    ? stateUtilities.find((u) =>
        u.utilityId === utilityId ||
        u.utilityId === utilityId.replace(/_/g, "-") ||
        u.utilityId.replace(/-/g, "_") === utilityId
      )
    : stateUtilities[0];

  // Build rate data
  const utilitySpecific = utilityId ? UTILITY_SPECIFIC_RATES[utilityId] : null;

  const rate: UtilityRate = {
    utilityName: primaryUtility?.name || `${stateCode} Average`,
    utilityId: utilityId || "state-avg",
    rateName: "Commercial General Service",
    rateId: `${stateCode}-commercial`,

    residentialRate: utilitySpecific?.residentialRate || stateRates.residential,
    commercialRate: utilitySpecific?.commercialRate || stateRates.commercial,
    industrialRate: utilitySpecific?.industrialRate || stateRates.industrial,

    hasTOU: utilitySpecific?.hasTOU ?? stateRates.hasTOU,
    peakRate: utilitySpecific?.peakRate,
    offPeakRate: utilitySpecific?.offPeakRate,
    partPeakRate: utilitySpecific?.partPeakRate,
    peakHours: utilitySpecific?.peakHours,

    hasDemandCharge: utilitySpecific?.hasDemandCharge ?? true,
    demandCharge: utilitySpecific?.demandCharge || stateRates.demandCharge,
    peakDemandCharge: utilitySpecific?.peakDemandCharge,

    hasTieredRates: false,

    netMeteringAvailable: utilitySpecific?.netMeteringAvailable ?? true,
    netMeteringType: utilitySpecific?.netMeteringType || "full-retail",

    effectiveDate: "2024-01-01",
    source: utilitySpecific ? "manual" : "eia",
    lastUpdated: new Date().toISOString(),
    confidence: utilitySpecific ? "high" : "medium",
  };

  // Determine solar/wind potential by region
  const solarPotential = getSolarPotential(stateCode);
  const windPotential = getWindPotential(stateCode);

  const result: ZipCodeUtilityData = {
    zipCode: normalizedZip,
    city: "", // Would need reverse geocoding
    state: getStateName(stateCode),
    stateCode,
    utilities: stateUtilities,
    primaryUtility,
    rates: [rate],
    recommendedRate: rate,
    solarPotential,
    windPotential,
  };

  // Cache the result
  rateCache.set(normalizedZip, { data: result, timestamp: Date.now() });

  return result;
}

/**
 * Select the appropriate rate schedule for a given peak demand level.
 * Returns null if no schedule data is available for this utility or peak kW is absent.
 */
function resolveSchedule(
  utilityId: string,
  estimatedPeakKW: number
): CommercialRateSchedule | null {
  if (!utilityId || utilityId === "state-avg") return null;
  const schedules = UTILITY_RATE_SCHEDULES[utilityId];
  if (!schedules?.length || estimatedPeakKW <= 0) return null;
  return schedules.find((s) => estimatedPeakKW >= s.minKW && estimatedPeakKW < s.maxKW) ?? null;
}

/**
 * Get the commercial rate by ZIP code with optional schedule-tier-aware demand charge.
 * Pass estimatedPeakKW (from Step 3) to get the tariff bracket matching this site's demand.
 * Without estimatedPeakKW, returns the utility-level average demand charge.
 *
 * demandChargeSource tells callers how specific the data is:
 *   'schedule'    — exact tariff tier matched by peak kW (most accurate)
 *   'utility-avg' — utility-wide average from hardcoded UTILITY_SPECIFIC_RATES
 *   'state-avg'   — EIA state average (no utility match found for ZIP)
 */
export async function getCommercialRateByZip(
  zipCode: string,
  estimatedPeakKW?: number
): Promise<{
  rate: number;
  demandCharge: number;
  rateName: string;
  rateSchedule: string;
  demandChargeSource: "schedule" | "utility-avg" | "state-avg";
  peakRate?: number;
  offPeakRate?: number;
  peakHours?: string;
  utilityName: string;
  state: string;
  hasTOU: boolean;
  source: string;
} | null> {
  const data = await getUtilityRatesByZip(zipCode);
  if (!data || !data.recommendedRate) return null;

  const r = data.recommendedRate;
  let demandCharge = r.demandCharge || 0;
  let rateName = r.rateName || "Commercial General Service";
  let rateSchedule = "";
  let demandChargeSource: "schedule" | "utility-avg" | "state-avg" =
    r.source === "eia" ? "state-avg" : "utility-avg";
  let hasTOU = r.hasTOU;
  let peakRate = r.peakRate;
  let offPeakRate = r.offPeakRate;
  let peakHours = r.peakHours;
  let commercialRate = r.commercialRate;

  // Tier 2: Select the tariff bracket matching this site's peak demand
  if (estimatedPeakKW && estimatedPeakKW > 0) {
    const schedule = resolveSchedule(r.utilityId, estimatedPeakKW);
    if (schedule) {
      demandCharge = schedule.demandCharge;
      rateName = `${schedule.name} \u2014 ${schedule.label}`;
      rateSchedule = schedule.name;
      demandChargeSource = "schedule";
      if (schedule.hasTOU !== undefined) hasTOU = schedule.hasTOU;
      if (schedule.peakRate !== undefined) peakRate = schedule.peakRate;
      if (schedule.offPeakRate !== undefined) offPeakRate = schedule.offPeakRate;
      if (schedule.peakHours !== undefined) peakHours = schedule.peakHours;
      if (schedule.commercialRate !== undefined) commercialRate = schedule.commercialRate;
    }
  }

  return {
    rate: commercialRate,
    demandCharge,
    rateName,
    rateSchedule,
    demandChargeSource,
    peakRate,
    offPeakRate,
    peakHours,
    utilityName: r.utilityName,
    state: data.state,
    hasTOU,
    source: r.source,
  };
}

/**
 * Tier 3: Live NREL Utility Rate Database (URDB) lookup.
 * Fires as a background enhancement after the initial hardcoded data loads.
 * Returns a more specific demand charge from the utility's filed tariff when available.
 *
 * API: https://openei.org/services/doc/rest/util_rates/ (CORS-enabled)
 * Rate limit: 1,000 req/day (DEMO_KEY), 10,000/day (registered key)
 * Cached 24h per ZIP to stay within limits.
 */
export async function fetchNRELURDB(
  zipCode: string
): Promise<{ demandCharge: number; rateName: string; rateSchedule: string } | null> {
  const normalizedZip = zipCode.substring(0, 5);

  // Check URDB cache first
  const cached = urdbCache.get(normalizedZip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return cached.data;
  }

  try {
    const url = new URL("https://api.openei.org/utility_rates");
    url.searchParams.set("version", "8");
    url.searchParams.set("format", "json");
    url.searchParams.set("api_key", NREL_API_KEY);
    url.searchParams.set("address", normalizedZip);
    url.searchParams.set("sector", "Commercial");
    url.searchParams.set("limit", "5");

    // AbortController for 4s timeout (compatible across all environments)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let res: Response;
    try {
      res = await fetch(url.toString(), { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) return null;

    const json = (await res.json()) as {
      items?: Array<{
        name?: string;
        eiaid?: number;
        peakkwcapacitycharge?: number;
        flatdemandstructure?: Array<Array<{ rate?: number }>>;
      }>;
    };

    if (!json.items?.length) return null;

    // Prefer rates that actually have a demand charge value
    const withDemand = json.items.filter(
      (item) =>
        (item.peakkwcapacitycharge ?? 0) > 0 ||
        item.flatdemandstructure?.some((tier) => tier.some((p) => (p.rate ?? 0) > 0))
    );
    const best = withDemand[0] ?? json.items[0];
    if (!best) return null;

    let demandCharge = best.peakkwcapacitycharge ?? 0;
    // Fallback: parse flatdemandstructure if peakkwcapacitycharge not set
    if (!demandCharge && best.flatdemandstructure?.length) {
      demandCharge = best.flatdemandstructure[0]?.[0]?.rate ?? 0;
    }
    if (!demandCharge || demandCharge <= 0) return null;

    const result = {
      demandCharge: Math.round(demandCharge * 100) / 100,
      rateName: best.name ?? "Published Tariff",
      rateSchedule: best.name ?? "",
    };

    // Cache 24h to stay within NREL rate limits
    urdbCache.set(normalizedZip, { data: result, timestamp: Date.now() });
    return result;
  } catch {
    // Network error, CORS issue, timeout, or rate limit — all fail silently
    return null;
  }
}

/**
 * Build TOUPeriod[] from utility rate data for 8760 hourly analysis.
 * Parses peakHours like "4pm-9pm" into structured period objects.
 * Returns null if utility has no TOU data.
 */
export function buildTOUPeriodsFromUtilityRate(rate: {
  hasTOU?: boolean;
  peakRate?: number;
  offPeakRate?: number;
  peakHours?: string;
  commercialRate?: number;
}): import('./hourly8760AnalysisService').TOUPeriod[] | null {
  if (!rate.hasTOU || !rate.peakRate || !rate.offPeakRate || !rate.peakHours) {
    return null;
  }

  const { peakStart, peakEnd } = parsePeakHours(rate.peakHours);
  if (peakStart === null || peakEnd === null) return null;

  // Build mid-peak rate (average of peak and off-peak)
  const midPeakRate = (rate.peakRate + rate.offPeakRate) / 2;

  // Construct TOU periods:
  // overnight off-peak → daytime mid-peak → afternoon on-peak → evening mid-peak → off-peak
  const periods: import('./hourly8760AnalysisService').TOUPeriod[] = [];

  // Off-peak overnight: midnight → 2 hours before peak
  const morningMidStart = Math.max(7, peakStart - 2);
  periods.push({
    name: 'off-peak',
    rate: rate.offPeakRate,
    startHour: 0,
    endHour: morningMidStart,
    days: ['all'],
  });

  // Mid-peak morning (weekday): before peak window
  if (morningMidStart < peakStart) {
    periods.push({
      name: 'mid-peak',
      rate: midPeakRate,
      startHour: morningMidStart,
      endHour: peakStart,
      days: ['weekday'],
    });
  }

  // On-peak (weekday): peak window
  periods.push({
    name: 'on-peak',
    rate: rate.peakRate,
    startHour: peakStart,
    endHour: peakEnd,
    days: ['weekday'],
  });

  // Mid-peak evening (weekday): after peak → midnight
  if (peakEnd < 24) {
    periods.push({
      name: 'mid-peak',
      rate: midPeakRate,
      startHour: peakEnd,
      endHour: 24,
      days: ['weekday'],
    });
  }

  // Weekend daytime: mid-peak (lower than weekday peak)
  periods.push({
    name: 'mid-peak',
    rate: rate.offPeakRate + (rate.peakRate - rate.offPeakRate) * 0.3,
    startHour: morningMidStart,
    endHour: 24,
    days: ['weekend'],
  });

  return periods;
}

/**
 * Parse peak hours string like "4pm-9pm", "1pm-7pm", "12pm-9pm" into 24h start/end.
 */
function parsePeakHours(peakHours: string): { peakStart: number | null; peakEnd: number | null } {
  const match = peakHours.match(/(\d{1,2})(am|pm)\s*[-–]\s*(\d{1,2})(am|pm)/i);
  if (!match) return { peakStart: null, peakEnd: null };

  let start = parseInt(match[1], 10);
  const startMeridiem = match[2].toLowerCase();
  let end = parseInt(match[3], 10);
  const endMeridiem = match[4].toLowerCase();

  if (startMeridiem === 'pm' && start !== 12) start += 12;
  if (startMeridiem === 'am' && start === 12) start = 0;
  if (endMeridiem === 'pm' && end !== 12) end += 12;
  if (endMeridiem === 'am' && end === 12) end = 0;

  return { peakStart: start, peakEnd: end };
}

/**
 * Get BESS savings opportunity score by ZIP code
 */
export async function getBESSSavingsOpportunity(zipCode: string): Promise<{
  score: number; // 0-100
  rating: "excellent" | "good" | "fair" | "poor";
  reasons: string[];
  estimatedSavingsPerKWh: number;
} | null> {
  const data = await getUtilityRatesByZip(zipCode);
  if (!data || !data.recommendedRate) return null;

  const r = data.recommendedRate;
  let score = 0;
  const reasons: string[] = [];

  // High base rates = more savings from peak shaving
  if (r.commercialRate > 0.2) {
    score += 25;
    reasons.push(`High electricity rates ($${r.commercialRate.toFixed(2)}/kWh)`);
  } else if (r.commercialRate > 0.15) {
    score += 15;
    reasons.push(`Moderate electricity rates ($${r.commercialRate.toFixed(2)}/kWh)`);
  } else {
    score += 5;
  }

  // TOU rates = arbitrage opportunity
  if (r.hasTOU && r.peakRate && r.offPeakRate) {
    const spread = r.peakRate - r.offPeakRate;
    if (spread > 0.15) {
      score += 30;
      reasons.push(`Excellent TOU spread ($${spread.toFixed(2)}/kWh peak vs off-peak)`);
    } else if (spread > 0.08) {
      score += 20;
      reasons.push(`Good TOU arbitrage opportunity`);
    } else {
      score += 10;
    }
  }

  // Demand charges = peak shaving opportunity
  if (r.hasDemandCharge && r.demandCharge) {
    if (r.demandCharge > 20) {
      score += 25;
      reasons.push(`High demand charges ($${r.demandCharge}/kW)`);
    } else if (r.demandCharge > 12) {
      score += 15;
      reasons.push(`Moderate demand charges ($${r.demandCharge}/kW)`);
    } else {
      score += 5;
    }
  }

  // Solar potential + BESS synergy
  if (data.solarPotential === "excellent") {
    score += 15;
    reasons.push("Excellent solar potential for solar+storage");
  } else if (data.solarPotential === "good") {
    score += 10;
    reasons.push("Good solar potential");
  }

  // Net metering affects value proposition
  if (r.netMeteringAvailable) {
    score += 5;
    if (r.netMeteringType === "time-of-export") {
      reasons.push("Time-of-export net metering - battery can maximize export value");
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  // Calculate estimated savings per kWh stored
  const estimatedSavingsPerKWh =
    (r.peakRate || r.commercialRate * 1.3) - (r.offPeakRate || r.commercialRate * 0.7);

  let rating: "excellent" | "good" | "fair" | "poor";
  if (score >= 75) rating = "excellent";
  else if (score >= 50) rating = "good";
  else if (score >= 25) rating = "fair";
  else rating = "poor";

  return {
    score,
    rating,
    reasons,
    estimatedSavingsPerKWh,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSolarPotential(stateCode: string): "excellent" | "good" | "fair" | "poor" {
  const excellent = ["CA", "AZ", "NV", "NM", "TX", "FL", "HI", "CO", "UT"];
  const good = ["GA", "NC", "SC", "AL", "MS", "LA", "OK", "KS", "NE"];
  const fair = ["VA", "MD", "DE", "MO", "AR", "TN", "KY", "IL", "IN", "OH"];

  if (excellent.includes(stateCode)) return "excellent";
  if (good.includes(stateCode)) return "good";
  if (fair.includes(stateCode)) return "fair";
  return "poor";
}

function getWindPotential(stateCode: string): "excellent" | "good" | "fair" | "poor" {
  const excellent = ["TX", "KS", "OK", "IA", "NE", "SD", "ND", "MN", "WY", "MT"];
  const good = ["CO", "NM", "IL", "IN", "OH", "MI", "WI"];
  const fair = ["NY", "PA", "ME", "MA", "CA", "WA", "OR"];

  if (excellent.includes(stateCode)) return "excellent";
  if (good.includes(stateCode)) return "good";
  if (fair.includes(stateCode)) return "fair";
  return "poor";
}

function getStateName(stateCode: string): string {
  const stateNames: Record<string, string> = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    DC: "District of Columbia",
  };
  return stateNames[stateCode] || stateCode;
}

/**
 * Clear the rate cache (useful for testing or forcing refresh)
 */
export function clearRateCache(): void {
  rateCache.clear();
  urdbCache.clear();
}

/**
 * Export state codes for UI dropdowns
 */
export function getAllStateOptions(): { code: string; name: string }[] {
  return Object.keys(EIA_STATE_RATES)
    .filter((code) => code !== "DC")
    .map((code) => ({
      code,
      name: getStateName(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
