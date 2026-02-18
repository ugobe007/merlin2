/**
 * SOLAR FOOTPRINT LIBRARY
 * =======================
 * Industry-specific building footprint estimation for solar sizing.
 *
 * PURPOSE:
 * Derives estimated building footprint (sqft) from Step 3 inputs
 * (room count, bay count, sqft, rack count, etc.) so users never
 * have to guess their roof area.
 *
 * DATA SOURCES:
 * - CBECS 2018 (Commercial Buildings Energy Consumption Survey)
 * - ASHRAE 90.1 / ASHRAE Handbook
 * - NREL Commercial Rooftop PV Technical Potential (2016)
 * - ICA 2024 Industry Study (car wash footprints)
 * - SEIA Solar Means Business Report (2024)
 * - IEEE / NFPA building standards
 *
 * ARCHITECTURE:
 * - estimateBuildingFootprint(industry, step3Answers) → sqft estimate
 * - INDUSTRY_FOOTPRINT_PROFILES → per-industry sizing rules
 * - estimateSolarCapacity(footprintSqFt, roofUtil, canopy) → kW
 *
 * Created: February 18, 2026
 * Part of TrueQuote™ Solar Sizing Assistant
 */

// ============================================================================
// SOLAR PANEL CONSTANTS (aligned with solarCalculator.ts / data/constants.ts)
// ============================================================================

export const SOLAR_PANEL_CONSTANTS = {
  PANEL_WATTS: 500,           // Modern 500W panel (Q1 2026)
  SQFT_PER_KW: 50,            // ~50 sqft per kW for 500W panels (incl. spacing)
  WATTS_PER_SQFT: 20,         // 1000W / 50sqft = 20 W/sqft of usable roof
  DEFAULT_SYSTEM_LOSSES: 0.14, // 14% system losses (wiring, inverter, soiling)
  PANEL_EFFICIENCY: 0.215,    // 21.5% cell efficiency (2026 mainstream)
} as const;

// ============================================================================
// REGIONAL SUN HOURS (annual kWh per kW installed, from NREL PVWatts)
// ============================================================================

export const REGIONAL_CAPACITY_FACTORS: Record<string, number> = {
  // kWh per kW-installed per year (typical fixed-tilt rooftop)
  AZ: 1850, NV: 1780, NM: 1750, CA: 1680, TX: 1580,
  FL: 1520, CO: 1550, UT: 1600, GA: 1450, NC: 1400,
  SC: 1420, TN: 1350, AL: 1400, LA: 1380, MS: 1380,
  AR: 1370, OK: 1480, KS: 1500, MO: 1350, IL: 1300,
  IN: 1270, OH: 1230, MI: 1200, WI: 1250, MN: 1280,
  IA: 1320, NE: 1380, SD: 1400, ND: 1340, MT: 1350,
  WY: 1450, ID: 1400, OR: 1250, WA: 1105, VA: 1350,
  MD: 1320, DE: 1330, NJ: 1310, PA: 1260, NY: 1205,
  CT: 1260, RI: 1270, MA: 1280, VT: 1200, NH: 1220,
  ME: 1250, HI: 1700, AK: 1000, DC: 1320,
};

/** Fallback capacity factor for unknown states */
const DEFAULT_CAPACITY_FACTOR = 1350; // US average

// ============================================================================
// INDUSTRY FOOTPRINT PROFILES
// ============================================================================

export interface FootprintProfile {
  /** Human-readable name */
  label: string;
  /** How to derive footprint from Step 3 answers */
  sizeDriver: string;
  /** Sqft per unit of the size driver (e.g., sqft per room) */
  sqftPerUnit: { small: number; medium: number; large: number };
  /** Which Step 3 answer field provides the size driver count */
  answerField: string;
  /** Alternative answer fields to check (field name variations) */
  altFields?: string[];
  /** Fallback value if no answer found */
  fallbackUnits: number;
  /** Typical range for UI display [min, max] */
  typicalRange: [number, number];
  /** Roof utilization % (0-1). How much roof is usable for solar */
  roofUtilization: number;
  /** Why roof is limited */
  roofNote: string;
  /** Canopy/carport solar potential (kW) per unit */
  canopyKWPerUnit: number;
  /** Whether canopy is the PRIMARY solar option (e.g., EV charging) */
  canopyIsPrimary: boolean;
  /** Canopy description for UI */
  canopyLabel: string;
  /** Source citation */
  source: string;
}

/**
 * Industry footprint profiles — SSOT for building size estimation.
 *
 * Each profile defines how to convert Step 3 inputs → building sqft → solar capacity.
 * The sizeDriver connects to the question the user already answered.
 */
export const INDUSTRY_FOOTPRINT_PROFILES: Record<string, FootprintProfile> = {
  // ──────────────────────────────────────────────────
  // HOSPITALITY
  // ──────────────────────────────────────────────────
  hotel: {
    label: 'Hotel / Motel',
    sizeDriver: 'rooms',
    sqftPerUnit: { small: 250, medium: 350, large: 500 },
    answerField: 'roomCount',
    altFields: ['numRooms', 'numberOfRooms', 'rooms'],
    fallbackUnits: 150,
    typicalRange: [50, 800],
    roofUtilization: 0.35,
    roofNote: 'HVAC units, pools, elevator shafts reduce usable area',
    canopyKWPerUnit: 0.8,  // ~120 kW canopy for 150-room hotel
    canopyIsPrimary: false,
    canopyLabel: 'Guest parking canopy',
    source: 'CBECS 2018, ASHRAE Handbook',
  },

  restaurant: {
    label: 'Restaurant',
    sizeDriver: 'seats',
    sqftPerUnit: { small: 18, medium: 22, large: 28 },
    answerField: 'seatingCapacity',
    altFields: ['seats', 'seatCount', 'numberOfSeats'],
    fallbackUnits: 100,
    typicalRange: [30, 300],
    roofUtilization: 0.45,
    roofNote: 'Kitchen exhaust hoods, grease traps reduce usable area',
    canopyKWPerUnit: 0.15,
    canopyIsPrimary: false,
    canopyLabel: 'Patio / parking canopy',
    source: 'CBECS 2018, National Restaurant Association',
  },

  // ──────────────────────────────────────────────────
  // AUTOMOTIVE / RETAIL
  // ──────────────────────────────────────────────────
  'car-wash': {
    label: 'Car Wash',
    sizeDriver: 'bays/tunnels',
    sqftPerUnit: { small: 800, medium: 1200, large: 1500 },
    answerField: 'numBays',
    altFields: ['bayCount', 'bayTunnelCount', 'numberOfBays', 'tunnelCount'],
    fallbackUnits: 4,
    typicalRange: [1, 12],
    roofUtilization: 0.65,
    roofNote: 'Flat roof, minimal equipment — good solar candidate',
    canopyKWPerUnit: 12,  // ~50 kW canopy for 4-bay wash
    canopyIsPrimary: false,
    canopyLabel: 'Vacuum area / exit canopy',
    source: 'ICA 2024, CBECS 2018',
  },

  'gas-station': {
    label: 'Gas / Truck Stop',
    sizeDriver: 'pumps',
    sqftPerUnit: { small: 300, medium: 400, large: 500 },
    answerField: 'numPumps',
    altFields: ['pumpCount', 'numberOfPumps', 'fuelPositions'],
    fallbackUnits: 8,
    typicalRange: [4, 24],
    roofUtilization: 0.55,
    roofNote: 'Convenience store roof is usable; pump canopy already exists',
    canopyKWPerUnit: 5,
    canopyIsPrimary: true,
    canopyLabel: 'Pump canopy solar',
    source: 'NACS Industry Report, CBECS 2018',
  },

  'ev-charging': {
    label: 'EV Charging Station',
    sizeDriver: 'chargers',
    sqftPerUnit: { small: 400, medium: 500, large: 600 },
    answerField: 'totalChargers',
    altFields: ['numChargers', 'level2Chargers', 'dcfcChargers', 'numberOfChargers'],
    fallbackUnits: 12,
    typicalRange: [4, 50],
    roofUtilization: 0.30,
    roofNote: 'Building is small — canopy solar over charging stalls is primary',
    canopyKWPerUnit: 10,  // ~10 kW per charging stall canopy
    canopyIsPrimary: true,
    canopyLabel: 'Solar canopy over charging stalls',
    source: 'NREL EV Infrastructure Report 2024',
  },

  // ──────────────────────────────────────────────────
  // COMMERCIAL OFFICE / RETAIL
  // ──────────────────────────────────────────────────
  office: {
    label: 'Office Building',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },  // Direct sqft input
    answerField: 'squareFootage',
    altFields: ['officeSqFt', 'buildingSqFt', 'sqft', 'facilitySize'],
    fallbackUnits: 25000,
    typicalRange: [5000, 200000],
    roofUtilization: 0.40,
    roofNote: 'Multi-story buildings: roof ≈ 1 floor footprint. HVAC units on roof.',
    canopyKWPerUnit: 0.004,  // 4W per sqft of parking = ~100 kW for 25k sqft office
    canopyIsPrimary: false,
    canopyLabel: 'Parking lot canopy',
    source: 'CBECS 2018, ASHRAE 90.1',
  },

  retail: {
    label: 'Retail / Shopping',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['storeSqFt', 'retailSqFt', 'facilitySize'],
    fallbackUnits: 30000,
    typicalRange: [2000, 150000],
    roofUtilization: 0.70,
    roofNote: 'Big-box retail has large flat roofs — excellent for solar',
    canopyKWPerUnit: 0.005,
    canopyIsPrimary: false,
    canopyLabel: 'Parking lot canopy',
    source: 'CBECS 2018, SEIA Solar Means Business 2024',
  },

  // ──────────────────────────────────────────────────
  // INDUSTRIAL / LOGISTICS
  // ──────────────────────────────────────────────────
  warehouse: {
    label: 'Warehouse / Logistics',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['warehouseSqFt', 'facilitySize'],
    fallbackUnits: 100000,
    typicalRange: [20000, 500000],
    roofUtilization: 0.80,
    roofNote: 'Best commercial solar candidate — large, flat, unobstructed roofs',
    canopyKWPerUnit: 0.001,
    canopyIsPrimary: false,
    canopyLabel: 'Loading dock canopy',
    source: 'NREL Rooftop PV Potential 2016, CBECS 2018',
  },

  manufacturing: {
    label: 'Manufacturing Facility',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['facilitySqFt', 'plantSize', 'facilitySize'],
    fallbackUnits: 75000,
    typicalRange: [10000, 300000],
    roofUtilization: 0.60,
    roofNote: 'Large roofs with some obstructions (exhaust, cranes, skylights)',
    canopyKWPerUnit: 0.002,
    canopyIsPrimary: false,
    canopyLabel: 'Parking / loading canopy',
    source: 'CBECS 2018, ASHRAE 90.1',
  },

  'cold-storage': {
    label: 'Cold Storage',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['facilitySqFt', 'coldStorageSqFt', 'facilitySize'],
    fallbackUnits: 50000,
    typicalRange: [10000, 200000],
    roofUtilization: 0.75,
    roofNote: 'Large flat insulated roofs — excellent for solar',
    canopyKWPerUnit: 0.001,
    canopyIsPrimary: false,
    canopyLabel: 'Dock canopy',
    source: 'IARW, CBECS 2018',
  },

  // ──────────────────────────────────────────────────
  // INSTITUTIONAL
  // ──────────────────────────────────────────────────
  hospital: {
    label: 'Hospital / Healthcare',
    sizeDriver: 'beds',
    sqftPerUnit: { small: 700, medium: 900, large: 1200 },
    answerField: 'bedCount',
    altFields: ['beds', 'numberOfBeds', 'numBeds'],
    fallbackUnits: 200,
    typicalRange: [25, 1000],
    roofUtilization: 0.25,
    roofNote: 'Helipad, cooling towers, exhaust stacks, medical equipment severely limit roof',
    canopyKWPerUnit: 1.0,  // ~200 kW canopy for 200-bed hospital
    canopyIsPrimary: false,
    canopyLabel: 'Visitor parking canopy',
    source: 'AHA Hospital Statistics, ASHRAE Healthcare Guide',
  },

  datacenter: {
    label: 'Data Center',
    sizeDriver: 'racks',
    sqftPerUnit: { small: 80, medium: 100, large: 130 },
    answerField: 'rackCount',
    altFields: ['numberOfRacks', 'numRacks', 'racks', 'itLoad'],
    fallbackUnits: 200,
    typicalRange: [10, 2000],
    roofUtilization: 0.30,
    roofNote: 'Heavy HVAC, generators, and switchgear on roof',
    canopyKWPerUnit: 0.6,
    canopyIsPrimary: false,
    canopyLabel: 'Parking canopy',
    source: 'Uptime Institute, ASHRAE TC 9.9',
  },

  airport: {
    label: 'Airport',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'terminalSqFt',
    altFields: ['squareFootage', 'facilitySize'],
    fallbackUnits: 200000,
    typicalRange: [50000, 1000000],
    roofUtilization: 0.20,
    roofNote: 'Complex roof geometry, security zones, FAA restrictions',
    canopyKWPerUnit: 0.003,
    canopyIsPrimary: true,
    canopyLabel: 'Long-term parking canopy',
    source: 'FAA Advisory Circular, ACI World',
  },

  college: {
    label: 'College / University',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'campusSqFt',
    altFields: ['squareFootage', 'facilitySize', 'buildingSqFt'],
    fallbackUnits: 50000,
    typicalRange: [20000, 500000],
    roofUtilization: 0.40,
    roofNote: 'Multiple buildings with varying roof quality. Educational showcase value.',
    canopyKWPerUnit: 0.006,
    canopyIsPrimary: false,
    canopyLabel: 'Parking structure / walkway canopy',
    source: 'AASHE STARS Database, CBECS 2018',
  },

  government: {
    label: 'Government / Public',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['buildingSqFt', 'facilitySize'],
    fallbackUnits: 30000,
    typicalRange: [5000, 200000],
    roofUtilization: 0.40,
    roofNote: 'Executive Order 14057 mandates net-zero by 2050',
    canopyKWPerUnit: 0.004,
    canopyIsPrimary: false,
    canopyLabel: 'Public parking canopy',
    source: 'GSA P100, CBECS 2018',
  },

  casino: {
    label: 'Casino & Gaming',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'gamingFloorSqft',
    altFields: ['squareFootage', 'facilitySize', 'casinoSqFt'],
    fallbackUnits: 100000,
    typicalRange: [20000, 500000],
    roofUtilization: 0.50,
    roofNote: 'Large roof but signage, decorative elements, and HVAC reduce usable area',
    canopyKWPerUnit: 0.004,
    canopyIsPrimary: false,
    canopyLabel: 'Parking garage / surface lot canopy',
    source: 'AGA Industry Report, CBECS 2018',
  },

  // ──────────────────────────────────────────────────
  // RESIDENTIAL / MULTI-FAMILY
  // ──────────────────────────────────────────────────
  apartment: {
    label: 'Apartment Complex',
    sizeDriver: 'units',
    sqftPerUnit: { small: 500, medium: 700, large: 900 },
    answerField: 'unitCount',
    altFields: ['numberOfUnits', 'numUnits', 'units', 'apartmentCount'],
    fallbackUnits: 100,
    typicalRange: [10, 500],
    roofUtilization: 0.30,
    roofNote: 'Multi-story: roof area = 1 floor footprint. HVAC and elevator on roof.',
    canopyKWPerUnit: 0.8,
    canopyIsPrimary: false,
    canopyLabel: 'Resident parking canopy',
    source: 'RECS 2020, NAHB Building Data',
  },

  residential: {
    label: 'Residential',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['homeSqFt', 'houseSqFt', 'facilitySize'],
    fallbackUnits: 2000,
    typicalRange: [800, 6000],
    roofUtilization: 0.60,
    roofNote: 'Pitched roofs limit usable area to south-facing sections',
    canopyKWPerUnit: 0.003,
    canopyIsPrimary: false,
    canopyLabel: 'Carport / pergola',
    source: 'RECS 2020, NREL Rooftop Potential',
  },

  // ──────────────────────────────────────────────────
  // AGRICULTURAL / SPECIALTY
  // ──────────────────────────────────────────────────
  agriculture: {
    label: 'Agricultural',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'barnSqFt',
    altFields: ['squareFootage', 'facilitySize', 'buildingSqFt'],
    fallbackUnits: 20000,
    typicalRange: [5000, 100000],
    roofUtilization: 0.70,
    roofNote: 'Barn/shed metal roofs are ideal for solar. Ground mount also common.',
    canopyKWPerUnit: 0.001,
    canopyIsPrimary: false,
    canopyLabel: 'Equipment shade structure',
    source: 'USDA REAP, NREL AgriSolar',
  },

  'indoor-farm': {
    label: 'Indoor Farm',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'growAreaSqFt',
    altFields: ['squareFootage', 'facilitySize'],
    fallbackUnits: 30000,
    typicalRange: [5000, 100000],
    roofUtilization: 0.25,
    roofNote: 'May need translucent roof for natural light. Grow lights = high baseline load.',
    canopyKWPerUnit: 0.001,
    canopyIsPrimary: false,
    canopyLabel: 'Adjacent ground mount',
    source: 'USDA CEA Report, NREL',
  },

  microgrid: {
    label: 'Microgrid',
    sizeDriver: 'sqft',
    sqftPerUnit: { small: 1, medium: 1, large: 1 },
    answerField: 'squareFootage',
    altFields: ['facilitySize', 'siteSqFt'],
    fallbackUnits: 10000,
    typicalRange: [2000, 100000],
    roofUtilization: 0.50,
    roofNote: 'Solar is essential for islanded microgrid operation',
    canopyKWPerUnit: 0.005,
    canopyIsPrimary: false,
    canopyLabel: 'Ground mount / canopy',
    source: 'NREL Microgrid Standards',
  },
};

// ============================================================================
// ESTIMATION FUNCTIONS
// ============================================================================

/**
 * Extract the size driver value from Step 3 answers.
 * Checks primary field + alt fields + special handling for EV chargers.
 */
function extractSizeDriver(
  profile: FootprintProfile,
  answers: Record<string, unknown>,
  industry: string
): number {
  // Special case: EV charging — sum L2 + DCFC chargers
  if (industry === 'ev-charging' || industry === 'ev_charging') {
    const l2 = Number(answers.level2Chargers ?? answers.numberOfLevel2Chargers ?? 0);
    const dcfc = Number(answers.dcfcChargers ?? answers.numberOfDCFastChargers ?? 0);
    const hpc = Number(answers.hpcChargers ?? answers.numberOfHPCChargers ?? 0);
    const total = l2 + dcfc + hpc;
    return total > 0 ? total : profile.fallbackUnits;
  }

  // Check primary field
  const primary = answers[profile.answerField];
  if (primary != null && Number(primary) > 0) {
    return Number(primary);
  }

  // Check alternate fields
  if (profile.altFields) {
    for (const alt of profile.altFields) {
      const val = answers[alt];
      if (val != null && Number(val) > 0) {
        return Number(val);
      }
    }
  }

  // Fallback
  return profile.fallbackUnits;
}

/**
 * Pick the right sqft-per-unit based on the count.
 * Small/medium/large breakpoints are at 33rd and 66th percentile of typical range.
 */
function pickSizeCategory(
  profile: FootprintProfile,
  units: number
): 'small' | 'medium' | 'large' {
  const [min, max] = profile.typicalRange;
  const range = max - min;
  if (units <= min + range * 0.33) return 'small';
  if (units <= min + range * 0.66) return 'medium';
  return 'large';
}

export interface BuildingFootprintEstimate {
  /** Estimated building footprint in sqft */
  buildingSqFt: number;
  /** Usable roof area for solar (after utilization factor) */
  usableRoofSqFt: number;
  /** Roof utilization percentage (0-1) */
  roofUtilization: number;
  /** Max rooftop solar capacity in kW */
  maxRoofSolarKW: number;
  /** Canopy solar potential in kW */
  canopyPotentialKW: number;
  /** Total solar potential (roof + canopy) in kW */
  totalSolarPotentialKW: number;
  /** Estimated annual production in kWh */
  annualProductionKWh: number;
  /** What drove the estimate */
  sizeDriver: string;
  /** Units used for estimation */
  unitsUsed: number;
  /** Size category applied */
  sizeCategory: 'small' | 'medium' | 'large';
  /** Roof limitation note */
  roofNote: string;
  /** Canopy description */
  canopyLabel: string;
  /** Whether canopy is the primary solar source */
  canopyIsPrimary: boolean;
  /** Data source citation */
  source: string;
  /** Industry label */
  industryLabel: string;
}

/**
 * Estimate building footprint and solar potential from Step 3 answers.
 *
 * @param industry - Canonical industry slug (e.g., 'hotel', 'car-wash')
 * @param answers - Step 3 answers record
 * @param state - US state abbreviation for sun hours (optional)
 * @returns Building footprint estimate with solar capacity
 */
export function estimateBuildingFootprint(
  industry: string,
  answers: Record<string, unknown>,
  state?: string
): BuildingFootprintEstimate {
  // Normalize slug
  const slug = industry.replace(/_/g, '-').toLowerCase();
  const profile = INDUSTRY_FOOTPRINT_PROFILES[slug];

  if (!profile) {
    // Generic fallback for unknown industries
    const fallbackSqFt = 25000;
    const usableRoof = fallbackSqFt * 0.40;
    const maxKW = usableRoof / SOLAR_PANEL_CONSTANTS.SQFT_PER_KW;
    const cf = state ? (REGIONAL_CAPACITY_FACTORS[state] ?? DEFAULT_CAPACITY_FACTOR) : DEFAULT_CAPACITY_FACTOR;
    return {
      buildingSqFt: fallbackSqFt,
      usableRoofSqFt: usableRoof,
      roofUtilization: 0.40,
      maxRoofSolarKW: Math.round(maxKW),
      canopyPotentialKW: 50,
      totalSolarPotentialKW: Math.round(maxKW + 50),
      annualProductionKWh: Math.round((maxKW + 50) * cf),
      sizeDriver: 'sqft (estimated)',
      unitsUsed: fallbackSqFt,
      sizeCategory: 'medium',
      roofNote: 'Generic estimate — adjust for your specific building',
      canopyLabel: 'Parking canopy',
      canopyIsPrimary: false,
      source: 'Merlin estimate',
      industryLabel: 'Commercial',
    };
  }

  const units = extractSizeDriver(profile, answers, slug);
  const sizeCategory = pickSizeCategory(profile, units);
  const sqftPerUnit = profile.sqftPerUnit[sizeCategory];

  const buildingSqFt = Math.round(units * sqftPerUnit);
  const usableRoofSqFt = Math.round(buildingSqFt * profile.roofUtilization);
  const maxRoofSolarKW = Math.round(usableRoofSqFt / SOLAR_PANEL_CONSTANTS.SQFT_PER_KW);
  const canopyPotentialKW = Math.round(units * profile.canopyKWPerUnit);
  const totalSolarPotentialKW = maxRoofSolarKW + canopyPotentialKW;

  const cf = state ? (REGIONAL_CAPACITY_FACTORS[state] ?? DEFAULT_CAPACITY_FACTOR) : DEFAULT_CAPACITY_FACTOR;
  const annualProductionKWh = Math.round(totalSolarPotentialKW * cf);

  return {
    buildingSqFt,
    usableRoofSqFt,
    roofUtilization: profile.roofUtilization,
    maxRoofSolarKW,
    canopyPotentialKW,
    totalSolarPotentialKW,
    annualProductionKWh,
    sizeDriver: profile.sizeDriver,
    unitsUsed: units,
    sizeCategory,
    roofNote: profile.roofNote,
    canopyLabel: profile.canopyLabel,
    canopyIsPrimary: profile.canopyIsPrimary,
    source: profile.source,
    industryLabel: profile.label,
  };
}

/**
 * Calculate solar capacity from custom inputs (for the modal's adjustable sliders).
 *
 * @param buildingSqFt - Building footprint in sqft
 * @param roofUtilization - Fraction of roof usable (0-1)
 * @param includeCanopy - Whether to include canopy solar
 * @param canopyKW - Canopy solar capacity in kW
 * @param state - US state abbreviation for production estimate
 * @returns Solar sizing result
 */
export function calculateCustomSolarCapacity(
  buildingSqFt: number,
  roofUtilization: number,
  includeCanopy: boolean,
  canopyKW: number,
  state?: string
): {
  usableRoofSqFt: number;
  maxRoofSolarKW: number;
  canopyKW: number;
  totalSolarKW: number;
  annualProductionKWh: number;
  panelsNeeded: number;
  coverageAcres: number;
} {
  const usableRoofSqFt = Math.round(buildingSqFt * roofUtilization);
  const maxRoofSolarKW = Math.round(usableRoofSqFt / SOLAR_PANEL_CONSTANTS.SQFT_PER_KW);
  const effectiveCanopyKW = includeCanopy ? canopyKW : 0;
  const totalSolarKW = maxRoofSolarKW + effectiveCanopyKW;
  const cf = state ? (REGIONAL_CAPACITY_FACTORS[state] ?? DEFAULT_CAPACITY_FACTOR) : DEFAULT_CAPACITY_FACTOR;
  const annualProductionKWh = Math.round(totalSolarKW * cf);
  const panelsNeeded = Math.ceil((totalSolarKW * 1000) / SOLAR_PANEL_CONSTANTS.PANEL_WATTS);
  const totalSqFt = usableRoofSqFt + (includeCanopy ? canopyKW * SOLAR_PANEL_CONSTANTS.SQFT_PER_KW : 0);
  const coverageAcres = totalSqFt / 43560;

  return {
    usableRoofSqFt,
    maxRoofSolarKW,
    canopyKW: effectiveCanopyKW,
    totalSolarKW,
    annualProductionKWh,
    panelsNeeded,
    coverageAcres,
  };
}

/**
 * Estimate annual savings from solar production.
 *
 * @param annualProductionKWh - Annual solar production
 * @param electricityRate - $/kWh rate
 * @returns Estimated annual savings
 */
export function estimateSolarSavings(
  annualProductionKWh: number,
  electricityRate: number
): number {
  // Self-consumption rate varies but 70-85% is typical for commercial with BESS
  const selfConsumptionRate = 0.80;
  return Math.round(annualProductionKWh * selfConsumptionRate * electricityRate);
}

/**
 * Get the solar cost per watt based on system size.
 * Aligned with data/constants.ts SSOT pricing.
 */
export function getSolarCostPerWatt(systemKW: number): number {
  if (systemKW >= 5000) return 0.75;   // Utility scale
  if (systemKW >= 100) return 0.95;    // Commercial
  return 1.25;                          // Small commercial
}
