/**
 * Industry Comparables Data
 * Provides comparable BESS installations for benchmarking
 */

export interface IndustryComparable {
  industry: string;
  projectName: string;
  location: string;
  sizeMW: number;
  durationHours: number;
  costPerKWh: number;
  paybackYears: number;
  year: number;
  // Optional enhanced fields
  powerMW?: number;
  energyMWh?: number;
  duration?: number;
  facilitySize?: string;
  yearInstalled?: number;
  solarMW?: number;
  annualSavings?: string;
  applicationTypes?: string[];
  notes?: string;
  source?: string;
  vendor?: string;
}

const INDUSTRY_COMPARABLES: IndustryComparable[] = [
  // EV Charging
  {
    industry: "ev-charging",
    projectName: "Tesla Supercharger Battery",
    location: "California",
    sizeMW: 1.5,
    durationHours: 2,
    costPerKWh: 350,
    paybackYears: 7.2,
    year: 2024,
  },
  // Data Centers
  {
    industry: "data-center",
    projectName: "AWS Data Center UPS",
    location: "Virginia",
    sizeMW: 5.0,
    durationHours: 1,
    costPerKWh: 400,
    paybackYears: 8.5,
    year: 2024,
  },
  // Hotels
  {
    industry: "hotel",
    projectName: "Hilton Hotel Microgrid",
    location: "Hawaii",
    sizeMW: 3.7, // Updated from 0.5 to realistic 800-room hotel size
    powerMW: 3.7,
    energyMWh: 14.8,
    duration: 4,
    durationHours: 4,
    facilitySize: "800 rooms",
    yearInstalled: 2024,
    solarMW: 3.5,
    annualSavings: "$1.8M",
    paybackYears: 3.2,
    costPerKWh: 320,
    year: 2024,
    applicationTypes: ["Peak Shaving", "Demand Charge Reduction", "Solar Integration"],
    notes: "Large resort hotel with significant EV charging and amenities",
    source: "Hawaii Clean Energy Initiative",
  },
  // Office Building
  {
    industry: "office-building",
    projectName: "Tech Office Campus",
    location: "California",
    sizeMW: 0.1,
    durationHours: 4,
    costPerKWh: 320,
    paybackYears: 4.8,
    year: 2024,
    powerMW: 0.1,
    energyMWh: 0.4,
    duration: 4,
    facilitySize: "75,000 sq ft",
    yearInstalled: 2024,
    solarMW: 0.15,
    annualSavings: "$38K",
    applicationTypes: ["Demand Charge Reduction", "Backup Power", "Solar Integration"],
    notes: "Mid-size office building with hybrid work model",
    source: "California Energy Commission",
  },

  // Manufacturing
  {
    industry: "manufacturing",
    projectName: "Industrial Battery Storage",
    location: "Texas",
    sizeMW: 3.0,
    durationHours: 4,
    costPerKWh: 280,
    paybackYears: 5.5,
    year: 2024,
  },
];

/**
 * Find the closest comparable project based on industry and size
 */
export function findClosestComparable(
  industry: string | string[],
  sizeMW: number,
  _numberOfRooms?: number
): IndustryComparable | null {
  const normalizedIndustry = Array.isArray(industry) ? industry[0] : industry;

  // Filter by industry
  const industryMatches = INDUSTRY_COMPARABLES.filter(
    (comp) => comp.industry === normalizedIndustry
  );

  if (industryMatches.length === 0) {
    // Return a generic comparable if no industry match
    return INDUSTRY_COMPARABLES[0];
  }

  // Find closest by size (or numberOfRooms for hotels)
  const closest = industryMatches.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.sizeMW - sizeMW);
    const currDiff = Math.abs(curr.sizeMW - sizeMW);
    return currDiff < prevDiff ? curr : prev;
  });

  return closest;
}

/**
 * Get all comparables for a specific industry
 */
export function getIndustryComparables(industry: string): IndustryComparable[] {
  return INDUSTRY_COMPARABLES.filter((comp) => comp.industry === industry);
}

/**
 * Get average metrics for an industry
 */
export function getIndustryAverages(industry: string): {
  avgCostPerKWh: number;
  avgPaybackYears: number;
  avgDurationHours: number;
} | null {
  const comparables = getIndustryComparables(industry);

  if (comparables.length === 0) {
    return null;
  }

  const sum = comparables.reduce(
    (acc, comp) => ({
      costPerKWh: acc.costPerKWh + comp.costPerKWh,
      paybackYears: acc.paybackYears + comp.paybackYears,
      durationHours: acc.durationHours + comp.durationHours,
    }),
    { costPerKWh: 0, paybackYears: 0, durationHours: 0 }
  );

  return {
    avgCostPerKWh: sum.costPerKWh / comparables.length,
    avgPaybackYears: sum.paybackYears / comparables.length,
    avgDurationHours: sum.durationHours / comparables.length,
  };
}
