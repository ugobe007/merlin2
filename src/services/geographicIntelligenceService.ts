/**
 * GEOGRAPHIC INTELLIGENCE SERVICE
 * ================================
 * 
 * Provides location-aware energy recommendations based on:
 * - Solar irradiance (sunlight hours)
 * - Grid reliability data
 * - Electricity rates by state
 * - Climate/weather patterns
 * - Regulatory incentives (ITC, state credits)
 * - Utility rate structures (TOU, demand charges)
 * 
 * SINGLE SOURCE OF TRUTH for geographic energy intelligence.
 */

// ============================================
// TYPES
// ============================================

export interface GeographicProfile {
  state: string;
  stateCode: string;
  region: string;
  
  // Solar Potential
  solarIrradiance: number; // kWh/m²/day average
  solarRating: 'excellent' | 'good' | 'fair' | 'poor';
  peakSunHours: number;
  
  // Grid Reliability  
  gridReliability: 'excellent' | 'good' | 'fair' | 'poor';
  averageOutagesPerYear: number;
  typicalOutageDuration: number; // hours
  gridNotes: string;
  
  // Electricity Costs
  averageResidentialRate: number; // $/kWh
  averageCommercialRate: number;
  averageIndustrialRate: number;
  demandChargeAvg: number; // $/kW
  touAvailable: boolean;
  rateStructure: string;
  
  // Incentives
  stateIncentives: string[];
  additionalItcBonus: number; // % on top of federal 30%
  netMeteringAvailable: boolean;
  srecAvailable: boolean; // Solar Renewable Energy Credits
  
  // Climate
  climateZone: string;
  avgSummerTempF: number;
  avgWinterTempF: number;
  heatingDegreeDay: number;
  coolingDegreeDay: number;
  
  // Recommendations
  recommendedTechnologies: ('solar' | 'battery' | 'wind' | 'generator')[];
  primaryBenefits: string[];
  considerations: string[];
}

export interface ZipCodeInfo {
  zipCode: string;
  city: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
}

// ============================================
// STATE DATA - COMPREHENSIVE DATABASE
// ============================================

const STATE_PROFILES: Record<string, GeographicProfile> = {
  // SOUTHWEST - Excellent Solar
  'CA': {
    state: 'California',
    stateCode: 'CA',
    region: 'West',
    solarIrradiance: 5.5,
    solarRating: 'excellent',
    peakSunHours: 5.5,
    gridReliability: 'fair',
    averageOutagesPerYear: 2.5,
    typicalOutageDuration: 4,
    gridNotes: 'PSPS events during fire season, aging infrastructure in some areas',
    averageResidentialRate: 0.28,
    averageCommercialRate: 0.22,
    averageIndustrialRate: 0.16,
    demandChargeAvg: 25,
    touAvailable: true,
    rateStructure: 'Time-of-Use mandatory for most customers',
    stateIncentives: ['SGIP (Self-Generation Incentive)', 'Net Metering 3.0', 'Property Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Mediterranean/Desert',
    avgSummerTempF: 85,
    avgWinterTempF: 55,
    heatingDegreeDay: 2000,
    coolingDegreeDay: 1500,
    recommendedTechnologies: ['solar', 'battery'],
    primaryBenefits: ['High solar production', 'Peak shaving savings', 'Backup during PSPS'],
    considerations: ['High electricity rates make storage very attractive', 'Fire season backup critical']
  },
  
  'AZ': {
    state: 'Arizona',
    stateCode: 'AZ',
    region: 'Southwest',
    solarIrradiance: 6.5,
    solarRating: 'excellent',
    peakSunHours: 6.5,
    gridReliability: 'good',
    averageOutagesPerYear: 1.2,
    typicalOutageDuration: 2,
    gridNotes: 'Generally reliable grid, some monsoon-related outages',
    averageResidentialRate: 0.13,
    averageCommercialRate: 0.11,
    averageIndustrialRate: 0.08,
    demandChargeAvg: 15,
    touAvailable: true,
    rateStructure: 'Time-of-Use with demand charges',
    stateIncentives: ['Property Tax Exemption', 'Sales Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Desert',
    avgSummerTempF: 105,
    avgWinterTempF: 55,
    heatingDegreeDay: 1000,
    coolingDegreeDay: 4000,
    recommendedTechnologies: ['solar', 'battery'],
    primaryBenefits: ['Best solar in the country', 'Extreme summer AC load shifting', 'Demand charge reduction'],
    considerations: ['Extreme heat requires proper equipment ratings', 'High cooling loads in summer']
  },
  
  'NV': {
    state: 'Nevada',
    stateCode: 'NV',
    region: 'West',
    solarIrradiance: 6.0,
    solarRating: 'excellent',
    peakSunHours: 6.0,
    gridReliability: 'good',
    averageOutagesPerYear: 1.0,
    typicalOutageDuration: 2,
    gridNotes: 'Reliable grid, NV Energy main provider',
    averageResidentialRate: 0.12,
    averageCommercialRate: 0.10,
    averageIndustrialRate: 0.07,
    demandChargeAvg: 12,
    touAvailable: true,
    rateStructure: 'TOU rates available',
    stateIncentives: ['Property Tax Abatement', 'Net Metering'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Desert',
    avgSummerTempF: 100,
    avgWinterTempF: 45,
    heatingDegreeDay: 2500,
    coolingDegreeDay: 3000,
    recommendedTechnologies: ['solar', 'battery'],
    primaryBenefits: ['Excellent solar resource', 'Data center hub', 'Growing EV infrastructure'],
    considerations: ['Water scarcity for some cooling systems', 'Desert installation considerations']
  },
  
  // TEXAS - Unique Grid (ERCOT)
  'TX': {
    state: 'Texas',
    stateCode: 'TX',
    region: 'South',
    solarIrradiance: 5.0,
    solarRating: 'excellent',
    peakSunHours: 5.0,
    gridReliability: 'fair',
    averageOutagesPerYear: 3.0,
    typicalOutageDuration: 6,
    gridNotes: 'ERCOT isolated grid, vulnerable to extreme weather (Winter Storm Uri)',
    averageResidentialRate: 0.12,
    averageCommercialRate: 0.09,
    averageIndustrialRate: 0.07,
    demandChargeAvg: 10,
    touAvailable: true,
    rateStructure: 'Deregulated market with many plan options',
    stateIncentives: ['Property Tax Exemption', 'Some utility rebates'],
    additionalItcBonus: 0,
    netMeteringAvailable: false, // Most areas
    srecAvailable: false,
    climateZone: 'Humid Subtropical/Semi-Arid',
    avgSummerTempF: 95,
    avgWinterTempF: 45,
    heatingDegreeDay: 2000,
    coolingDegreeDay: 2800,
    recommendedTechnologies: ['solar', 'battery', 'generator'],
    primaryBenefits: ['Grid independence critical', 'High solar + wind potential', 'Wholesale price volatility hedge'],
    considerations: ['ERCOT grid vulnerability', 'Winter storm backup essential', 'No net metering in most areas']
  },
  
  // NORTHEAST - High Rates, Grid Challenges
  'NY': {
    state: 'New York',
    stateCode: 'NY',
    region: 'Northeast',
    solarIrradiance: 4.0,
    solarRating: 'fair',
    peakSunHours: 4.0,
    gridReliability: 'fair',
    averageOutagesPerYear: 2.0,
    typicalOutageDuration: 4,
    gridNotes: 'Aging infrastructure, storm vulnerability, ConEd in NYC',
    averageResidentialRate: 0.22,
    averageCommercialRate: 0.18,
    averageIndustrialRate: 0.12,
    demandChargeAvg: 22,
    touAvailable: true,
    rateStructure: 'Complex utility rate structures with demand charges',
    stateIncentives: ['NY-Sun Incentive', 'NYSERDA Programs', 'Property Tax Exemption', 'Value of Distributed Energy Resources (VDER)'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: true,
    climateZone: 'Humid Continental',
    avgSummerTempF: 80,
    avgWinterTempF: 30,
    heatingDegreeDay: 5500,
    coolingDegreeDay: 800,
    recommendedTechnologies: ['battery', 'solar', 'generator'],
    primaryBenefits: ['High electricity rates = fast payback', 'Strong state incentives', 'Storm resilience'],
    considerations: ['Lower solar production', 'Heavy winter heating loads', 'Complex permitting in NYC']
  },
  
  'MA': {
    state: 'Massachusetts',
    stateCode: 'MA',
    region: 'Northeast',
    solarIrradiance: 4.0,
    solarRating: 'fair',
    peakSunHours: 4.0,
    gridReliability: 'good',
    averageOutagesPerYear: 1.5,
    typicalOutageDuration: 3,
    gridNotes: 'Generally reliable, winter storm impacts',
    averageResidentialRate: 0.26,
    averageCommercialRate: 0.20,
    averageIndustrialRate: 0.15,
    demandChargeAvg: 20,
    touAvailable: true,
    rateStructure: 'High rates with strong solar incentives',
    stateIncentives: ['SMART Program', 'Connected Solutions', 'MassSave', 'SREC II'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: true,
    climateZone: 'Humid Continental',
    avgSummerTempF: 78,
    avgWinterTempF: 28,
    heatingDegreeDay: 6000,
    coolingDegreeDay: 600,
    recommendedTechnologies: ['battery', 'solar'],
    primaryBenefits: ['Excellent incentives (SMART)', 'Very high electricity rates', 'SREC revenue'],
    considerations: ['Lower solar production', 'Heavy winter loads', 'Space constraints']
  },
  
  // FLORIDA - Hurricane Country
  'FL': {
    state: 'Florida',
    stateCode: 'FL',
    region: 'Southeast',
    solarIrradiance: 5.5,
    solarRating: 'excellent',
    peakSunHours: 5.5,
    gridReliability: 'fair',
    averageOutagesPerYear: 3.5,
    typicalOutageDuration: 8,
    gridNotes: 'Hurricane vulnerability, FPL major provider',
    averageResidentialRate: 0.14,
    averageCommercialRate: 0.11,
    averageIndustrialRate: 0.08,
    demandChargeAvg: 12,
    touAvailable: true,
    rateStructure: 'Standard rates with demand charges for commercial',
    stateIncentives: ['Property Tax Exemption', 'Sales Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Tropical/Subtropical',
    avgSummerTempF: 90,
    avgWinterTempF: 65,
    heatingDegreeDay: 500,
    coolingDegreeDay: 3500,
    recommendedTechnologies: ['solar', 'battery', 'generator'],
    primaryBenefits: ['Excellent solar', 'Hurricane backup critical', 'High AC loads'],
    considerations: ['Hurricane-rated equipment required', 'Flood zone considerations', 'Extended outage potential']
  },
  
  // PACIFIC NORTHWEST - Hydro-Rich, Lower Solar
  'WA': {
    state: 'Washington',
    stateCode: 'WA',
    region: 'Northwest',
    solarIrradiance: 3.5,
    solarRating: 'poor',
    peakSunHours: 3.5,
    gridReliability: 'excellent',
    averageOutagesPerYear: 0.8,
    typicalOutageDuration: 2,
    gridNotes: 'Very reliable hydro-powered grid',
    averageResidentialRate: 0.10,
    averageCommercialRate: 0.08,
    averageIndustrialRate: 0.05,
    demandChargeAvg: 8,
    touAvailable: false,
    rateStructure: 'Low flat rates from hydro power',
    stateIncentives: ['Sales Tax Exemption', 'Property Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Marine West Coast',
    avgSummerTempF: 75,
    avgWinterTempF: 40,
    heatingDegreeDay: 4500,
    coolingDegreeDay: 300,
    recommendedTechnologies: ['battery'],
    primaryBenefits: ['Grid resilience', 'EV charging support', 'Tech sector demand'],
    considerations: ['Low electricity rates reduce ROI', 'Limited solar benefit', 'Focus on resilience over savings']
  },
  
  'OR': {
    state: 'Oregon',
    stateCode: 'OR',
    region: 'Northwest',
    solarIrradiance: 4.0,
    solarRating: 'fair',
    peakSunHours: 4.0,
    gridReliability: 'good',
    averageOutagesPerYear: 1.0,
    typicalOutageDuration: 2,
    gridNotes: 'Reliable grid, some wildfire risk',
    averageResidentialRate: 0.11,
    averageCommercialRate: 0.09,
    averageIndustrialRate: 0.06,
    demandChargeAvg: 9,
    touAvailable: true,
    rateStructure: 'Varies by utility',
    stateIncentives: ['Energy Trust of Oregon rebates', 'Property Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Marine West Coast/High Desert',
    avgSummerTempF: 80,
    avgWinterTempF: 42,
    heatingDegreeDay: 4500,
    coolingDegreeDay: 400,
    recommendedTechnologies: ['battery', 'solar'],
    primaryBenefits: ['Eastern OR good for solar', 'Wildfire backup', 'Clean energy commitment'],
    considerations: ['Western OR cloudy', 'Lower rates reduce savings']
  },
  
  // MIDWEST - Variable, Wind Potential
  'MI': {
    state: 'Michigan',
    stateCode: 'MI',
    region: 'Midwest',
    solarIrradiance: 3.8,
    solarRating: 'fair',
    peakSunHours: 3.8,
    gridReliability: 'fair',
    averageOutagesPerYear: 2.0,
    typicalOutageDuration: 4,
    gridNotes: 'DTE and Consumers Energy, winter storm impacts',
    averageResidentialRate: 0.17,
    averageCommercialRate: 0.13,
    averageIndustrialRate: 0.09,
    demandChargeAvg: 14,
    touAvailable: true,
    rateStructure: 'TOU available, demand charges for commercial',
    stateIncentives: ['Property Tax Exemption', 'Net Metering'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Humid Continental',
    avgSummerTempF: 80,
    avgWinterTempF: 25,
    heatingDegreeDay: 6500,
    coolingDegreeDay: 700,
    recommendedTechnologies: ['battery', 'generator', 'solar'],
    primaryBenefits: ['Manufacturing resilience', 'Winter backup critical', 'EV charging growth'],
    considerations: ['Cold weather battery performance', 'Heavy heating loads', 'Auto industry transition']
  },
  
  'IL': {
    state: 'Illinois',
    stateCode: 'IL',
    region: 'Midwest',
    solarIrradiance: 4.2,
    solarRating: 'fair',
    peakSunHours: 4.2,
    gridReliability: 'good',
    averageOutagesPerYear: 1.5,
    typicalOutageDuration: 3,
    gridNotes: 'ComEd in Chicago, Ameren downstate',
    averageResidentialRate: 0.14,
    averageCommercialRate: 0.11,
    averageIndustrialRate: 0.08,
    demandChargeAvg: 12,
    touAvailable: true,
    rateStructure: 'Hourly pricing available',
    stateIncentives: ['Illinois Shines (SREC)', 'Property Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: true,
    climateZone: 'Humid Continental',
    avgSummerTempF: 82,
    avgWinterTempF: 28,
    heatingDegreeDay: 6000,
    coolingDegreeDay: 900,
    recommendedTechnologies: ['battery', 'solar'],
    primaryBenefits: ['SREC income potential', 'Chicago commercial demand', 'Data center growth'],
    considerations: ['Winter performance', 'Moderate solar resource']
  },
  
  // COLORADO - High Altitude, Good Solar
  'CO': {
    state: 'Colorado',
    stateCode: 'CO',
    region: 'Mountain',
    solarIrradiance: 5.5,
    solarRating: 'excellent',
    peakSunHours: 5.5,
    gridReliability: 'good',
    averageOutagesPerYear: 1.2,
    typicalOutageDuration: 2,
    gridNotes: 'Xcel Energy primary, reliable grid',
    averageResidentialRate: 0.14,
    averageCommercialRate: 0.11,
    averageIndustrialRate: 0.08,
    demandChargeAvg: 13,
    touAvailable: true,
    rateStructure: 'TOU rates with demand charges',
    stateIncentives: ['Property Tax Exemption', 'Xcel rebates', 'Net Metering'],
    additionalItcBonus: 0,
    netMeteringAvailable: true,
    srecAvailable: false,
    climateZone: 'Semi-Arid/Alpine',
    avgSummerTempF: 85,
    avgWinterTempF: 35,
    heatingDegreeDay: 5500,
    coolingDegreeDay: 700,
    recommendedTechnologies: ['solar', 'battery'],
    primaryBenefits: ['300+ days of sunshine', 'High altitude = more solar', 'Tech sector growth'],
    considerations: ['Altitude affects equipment', 'Hail risk', 'Winter snow on panels']
  },
  
  // GEORGIA - Growing Solar Market
  'GA': {
    state: 'Georgia',
    stateCode: 'GA',
    region: 'Southeast',
    solarIrradiance: 5.0,
    solarRating: 'good',
    peakSunHours: 5.0,
    gridReliability: 'good',
    averageOutagesPerYear: 1.5,
    typicalOutageDuration: 3,
    gridNotes: 'Georgia Power dominates, generally reliable',
    averageResidentialRate: 0.13,
    averageCommercialRate: 0.10,
    averageIndustrialRate: 0.07,
    demandChargeAvg: 11,
    touAvailable: true,
    rateStructure: 'Standard rates with demand charges',
    stateIncentives: ['Property Tax Exemption'],
    additionalItcBonus: 0,
    netMeteringAvailable: false, // Limited
    srecAvailable: false,
    climateZone: 'Humid Subtropical',
    avgSummerTempF: 88,
    avgWinterTempF: 45,
    heatingDegreeDay: 2500,
    coolingDegreeDay: 2000,
    recommendedTechnologies: ['solar', 'battery'],
    primaryBenefits: ['Good solar resource', 'Growing market', 'Atlanta commercial demand'],
    considerations: ['Limited net metering', 'Hurricane risk in coast']
  },
  
  // Add more states as needed...
};

// Simplified data for states not fully profiled
const DEFAULT_PROFILE: Partial<GeographicProfile> = {
  solarIrradiance: 4.5,
  solarRating: 'fair',
  peakSunHours: 4.5,
  gridReliability: 'good',
  averageOutagesPerYear: 1.5,
  typicalOutageDuration: 3,
  averageResidentialRate: 0.13,
  averageCommercialRate: 0.10,
  averageIndustrialRate: 0.07,
  demandChargeAvg: 12,
  touAvailable: true,
  additionalItcBonus: 0,
  netMeteringAvailable: true,
  srecAvailable: false,
  recommendedTechnologies: ['battery', 'solar'],
  primaryBenefits: ['Energy cost reduction', 'Backup power', 'Sustainability'],
  considerations: ['Local utility rules vary', 'Site-specific analysis recommended']
};

// ============================================
// ZIP CODE TO STATE MAPPING (Simplified)
// ============================================

function getStateFromZip(zipCode: string): string | null {
  const zip = parseInt(zipCode.substring(0, 3));
  
  // ZIP code prefix ranges by state
  const zipRanges: [number, number, string][] = [
    [100, 149, 'NY'], // New York
    [150, 196, 'PA'], // Pennsylvania
    [197, 199, 'DE'], // Delaware
    [200, 205, 'DC'], // DC
    [206, 219, 'MD'], // Maryland
    [220, 246, 'VA'], // Virginia
    [247, 268, 'WV'], // West Virginia
    [270, 289, 'NC'], // North Carolina
    [290, 299, 'SC'], // South Carolina
    [300, 319, 'GA'], // Georgia
    [320, 339, 'FL'], // Florida
    [350, 369, 'AL'], // Alabama
    [370, 385, 'TN'], // Tennessee
    [386, 397, 'MS'], // Mississippi
    [400, 427, 'KY'], // Kentucky
    [430, 459, 'OH'], // Ohio
    [460, 479, 'IN'], // Indiana
    [480, 499, 'MI'], // Michigan
    [500, 528, 'IA'], // Iowa
    [530, 549, 'WI'], // Wisconsin
    [550, 567, 'MN'], // Minnesota
    [570, 577, 'SD'], // South Dakota
    [580, 588, 'ND'], // North Dakota
    [590, 599, 'MT'], // Montana
    [600, 629, 'IL'], // Illinois
    [630, 658, 'MO'], // Missouri
    [660, 679, 'KS'], // Kansas
    [680, 693, 'NE'], // Nebraska
    [700, 714, 'LA'], // Louisiana
    [716, 729, 'AR'], // Arkansas
    [730, 749, 'OK'], // Oklahoma
    [750, 799, 'TX'], // Texas
    [800, 816, 'CO'], // Colorado
    [820, 831, 'WY'], // Wyoming
    [832, 838, 'ID'], // Idaho
    [840, 847, 'UT'], // Utah
    [850, 865, 'AZ'], // Arizona
    [870, 884, 'NM'], // New Mexico
    [889, 898, 'NV'], // Nevada
    [900, 961, 'CA'], // California
    [967, 968, 'HI'], // Hawaii
    [970, 979, 'OR'], // Oregon
    [980, 994, 'WA'], // Washington
    [995, 999, 'AK'], // Alaska
    [10, 27, 'MA'], // Massachusetts (010-027)
    [28, 29, 'RI'], // Rhode Island (028-029)
    [30, 38, 'NH'], // New Hampshire (030-038)
    [39, 49, 'ME'], // Maine (039-049)
    [50, 59, 'VT'], // Vermont (050-059)
    [60, 69, 'CT'], // Connecticut (060-069)
    [70, 89, 'NJ'], // New Jersey (070-089)
  ];
  
  for (const [min, max, state] of zipRanges) {
    if (zip >= min && zip <= max) {
      return state;
    }
  }
  
  return null;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get geographic profile for a state
 */
export function getStateProfile(stateCode: string): GeographicProfile {
  const profile = STATE_PROFILES[stateCode.toUpperCase()];
  
  if (profile) {
    return profile;
  }
  
  // Return default profile with state name
  return {
    state: stateCode,
    stateCode: stateCode.toUpperCase(),
    region: 'Unknown',
    gridNotes: 'Contact local utility for specific information',
    rateStructure: 'Varies by utility',
    stateIncentives: ['Federal ITC (30%)'],
    climateZone: 'Varies',
    avgSummerTempF: 80,
    avgWinterTempF: 40,
    heatingDegreeDay: 4000,
    coolingDegreeDay: 1000,
    ...DEFAULT_PROFILE
  } as GeographicProfile;
}

/**
 * Get geographic profile from ZIP code
 */
export function getProfileFromZip(zipCode: string): GeographicProfile | null {
  const stateCode = getStateFromZip(zipCode);
  if (!stateCode) return null;
  return getStateProfile(stateCode);
}

/**
 * Get smart recommendations based on location and use case
 */
export function getSmartRecommendations(
  stateCode: string,
  useCase: string,
  inputs?: {
    peakDemandKW?: number;
    monthlyBillUSD?: number;
    criticalLoadsKW?: number;
    backupHoursNeeded?: number;
  }
): {
  solarRecommended: boolean;
  solarReason: string;
  solarSizeMW: number;
  
  batteryRecommended: boolean;
  batteryReason: string;
  batterySizeMW: number;
  batteryDurationHours: number;
  
  generatorRecommended: boolean;
  generatorReason: string;
  generatorSizeKW: number;
  
  windRecommended: boolean;
  windReason: string;
  
  evChargingRecommended: boolean;
  evReason: string;
  
  summary: string;
  priorityOrder: string[];
} {
  const profile = getStateProfile(stateCode);
  const peakKW = inputs?.peakDemandKW || 500;
  const backupHours = inputs?.backupHoursNeeded || 4;
  const criticalKW = inputs?.criticalLoadsKW || peakKW * 0.3;
  
  // Solar recommendation
  const solarRecommended = profile.solarRating === 'excellent' || profile.solarRating === 'good';
  const solarSizeMW = solarRecommended ? Math.round(peakKW * 1.2) / 1000 : 0;
  const solarReason = solarRecommended 
    ? `${profile.peakSunHours} peak sun hours/day in ${profile.state} - excellent for solar`
    : `${profile.peakSunHours} peak sun hours/day - solar may have limited benefit`;
  
  // Battery recommendation (almost always yes)
  const batteryRecommended = true;
  const batterySizeMW = Math.round(peakKW * 0.5) / 1000;
  const batteryDurationHours = profile.gridReliability === 'poor' || profile.gridReliability === 'fair' 
    ? Math.max(4, backupHours) 
    : backupHours;
  const batteryReason = profile.gridReliability === 'excellent'
    ? 'Peak shaving and demand charge reduction'
    : `Grid reliability rated "${profile.gridReliability}" - ${profile.averageOutagesPerYear} outages/year avg`;
  
  // Generator recommendation
  const generatorRecommended = 
    profile.gridReliability === 'poor' || 
    profile.gridReliability === 'fair' ||
    profile.typicalOutageDuration > 6 ||
    ['hospital', 'data-center', 'manufacturing'].includes(useCase);
  const generatorSizeKW = generatorRecommended ? Math.round(criticalKW) : 0;
  const generatorReason = generatorRecommended
    ? `${profile.gridNotes} - backup generator provides extended resilience`
    : 'Grid reliability good - generator optional';
  
  // Wind recommendation (specific regions)
  const windRecommended = ['TX', 'OK', 'KS', 'NE', 'IA', 'MN', 'SD', 'ND'].includes(stateCode);
  const windReason = windRecommended
    ? `${profile.state} has excellent wind resources - consider wind+solar hybrid`
    : 'Wind typically not recommended for this region';
  
  // EV charging recommendation
  const evChargingRecommended = ['CA', 'WA', 'OR', 'CO', 'MA', 'NY', 'NJ'].includes(stateCode);
  const evReason = evChargingRecommended
    ? `${profile.state} has strong EV adoption - consider future-proofing with EV infrastructure`
    : 'EV charging optional based on your needs';
  
  // Priority order
  const priorityOrder: string[] = [];
  if (batteryRecommended) priorityOrder.push('Battery Storage');
  if (solarRecommended) priorityOrder.push('Solar PV');
  if (generatorRecommended) priorityOrder.push('Backup Generator');
  if (windRecommended) priorityOrder.push('Wind Turbines');
  if (evChargingRecommended) priorityOrder.push('EV Charging');
  
  // Summary
  const summary = `Based on ${profile.state}'s ${profile.solarRating} solar potential, ` +
    `${profile.gridReliability} grid reliability, and $${profile.averageCommercialRate}/kWh commercial rates, ` +
    `we recommend: ${priorityOrder.slice(0, 3).join(' + ')}.`;
  
  return {
    solarRecommended,
    solarReason,
    solarSizeMW,
    batteryRecommended,
    batteryReason,
    batterySizeMW,
    batteryDurationHours,
    generatorRecommended,
    generatorReason,
    generatorSizeKW,
    windRecommended,
    windReason,
    evChargingRecommended,
    evReason,
    summary,
    priorityOrder
  };
}

/**
 * Get electricity rate for state
 */
export function getElectricityRate(stateCode: string, type: 'residential' | 'commercial' | 'industrial' = 'commercial'): number {
  const profile = getStateProfile(stateCode);
  switch (type) {
    case 'residential': return profile.averageResidentialRate;
    case 'commercial': return profile.averageCommercialRate;
    case 'industrial': return profile.averageIndustrialRate;
  }
}

/**
 * Get demand charge for state
 */
export function getDemandCharge(stateCode: string): number {
  const profile = getStateProfile(stateCode);
  return profile.demandChargeAvg;
}

/**
 * Get all available states
 */
export function getAvailableStates(): { code: string; name: string; region: string }[] {
  return Object.entries(STATE_PROFILES).map(([code, profile]) => ({
    code,
    name: profile.state,
    region: profile.region
  }));
}

// Export for use in components
export default {
  getStateProfile,
  getProfileFromZip,
  getSmartRecommendations,
  getElectricityRate,
  getDemandCharge,
  getAvailableStates,
  getStateFromZip
};

// ============================================
// ADDITIONAL EXPORTS FOR STEP1 COMPONENT
// ============================================

/**
 * State energy profile (simplified for UI)
 */
export interface StateEnergyProfile {
  avgSolarHoursPerDay: number;
  gridReliabilityScore: number;
  avgDemandCharge: number;
  windCapacityFactor: number;
  avgElectricityRate: number;
}

/**
 * Geographic recommendation result
 */
export interface GeographicRecommendation {
  state: string;
  profile: StateEnergyProfile;
  recommendations: {
    solar: { recommended: boolean; reason: string };
    batteryStorage: { recommended: boolean; reason: string };
    wind: { recommended: boolean; reason: string };
    generator: { recommended: boolean; reason: string };
  };
}

/**
 * Get state from zip code (exports the internal function)
 */
export function getStateFromZipCode(zipCode: string): string | null {
  const stateCode = getStateFromZip(zipCode);
  if (!stateCode) return null;
  
  // Convert state code to full state name
  const profile = STATE_PROFILES[stateCode];
  return profile?.state || stateCode;
}

/**
 * Get geographic recommendations for Step1 UI
 */
export function getGeographicRecommendations(stateOrCode: string): GeographicRecommendation {
  // Find state code from name or use directly
  let stateCode = stateOrCode.length === 2 ? stateOrCode.toUpperCase() : null;
  
  if (!stateCode) {
    // Search by state name
    for (const [code, profile] of Object.entries(STATE_PROFILES)) {
      if (profile.state.toLowerCase() === stateOrCode.toLowerCase()) {
        stateCode = code;
        break;
      }
    }
  }
  
  // Use default if not found
  const profile = stateCode ? STATE_PROFILES[stateCode] : null;
  const fullProfile = profile || getStateProfile('CA'); // Default to CA data structure
  
  // Convert to simplified profile for UI
  const simplifiedProfile: StateEnergyProfile = {
    avgSolarHoursPerDay: fullProfile.peakSunHours,
    gridReliabilityScore: fullProfile.gridReliability === 'excellent' ? 95 
      : fullProfile.gridReliability === 'good' ? 80 
      : fullProfile.gridReliability === 'fair' ? 60 
      : 40,
    avgDemandCharge: fullProfile.demandChargeAvg,
    windCapacityFactor: ['TX', 'OK', 'KS', 'NE', 'IA', 'MN', 'SD', 'ND'].includes(stateCode || '') ? 0.35 : 0.15,
    avgElectricityRate: fullProfile.averageCommercialRate
  };
  
  // Build recommendations
  const solarRecommended = fullProfile.solarRating === 'excellent' || fullProfile.solarRating === 'good';
  const batteryRecommended = true; // Almost always recommended
  const windRecommended = ['TX', 'OK', 'KS', 'NE', 'IA', 'MN', 'SD', 'ND'].includes(stateCode || '');
  const generatorRecommended = fullProfile.gridReliability === 'fair' || fullProfile.gridReliability === 'poor';
  
  return {
    state: fullProfile.state,
    profile: simplifiedProfile,
    recommendations: {
      solar: {
        recommended: solarRecommended,
        reason: solarRecommended 
          ? `${fullProfile.peakSunHours}+ peak sun hours/day - excellent solar potential`
          : `${fullProfile.peakSunHours} peak sun hours/day - moderate solar potential`
      },
      batteryStorage: {
        recommended: batteryRecommended,
        reason: fullProfile.gridReliability !== 'excellent'
          ? `Grid reliability: ${fullProfile.gridReliability} - battery storage provides backup & savings`
          : 'Peak shaving can reduce demand charges by 20-40%'
      },
      wind: {
        recommended: windRecommended,
        reason: windRecommended
          ? 'Located in high-wind corridor - consider wind+solar hybrid'
          : 'Wind resources are limited in this region'
      },
      generator: {
        recommended: generatorRecommended,
        reason: generatorRecommended
          ? `${fullProfile.averageOutagesPerYear} outages/year avg - backup generator recommended`
          : 'Grid is reliable - generator optional for extended backup'
      }
    }
  };
}

/**
 * Get recommended add-ons based on state
 */
export function getRecommendedAddOns(stateOrCode: string): string[] {
  const geo = getGeographicRecommendations(stateOrCode);
  const addOns: string[] = [];
  
  if (geo.recommendations.solar.recommended) {
    addOns.push('Solar Integration');
  }
  if (geo.profile.gridReliabilityScore < 70) {
    addOns.push('Extended Backup Power');
  }
  if (['CA', 'WA', 'OR', 'CO', 'NY', 'MA', 'NJ'].includes(stateOrCode.length === 2 ? stateOrCode : '')) {
    addOns.push('EV Charging Ready');
  }
  if (geo.recommendations.wind.recommended) {
    addOns.push('Wind Hybrid System');
  }
  if (geo.profile.avgDemandCharge > 15) {
    addOns.push('Advanced Demand Response');
  }
  
  return addOns;
}

/**
 * Get regional electricity rate by state name or code
 */
export function getRegionalElectricityRate(stateOrCode: string): number {
  // Find state code
  let stateCode = stateOrCode.length === 2 ? stateOrCode.toUpperCase() : null;
  
  if (!stateCode) {
    for (const [code, profile] of Object.entries(STATE_PROFILES)) {
      if (profile.state.toLowerCase() === stateOrCode.toLowerCase()) {
        stateCode = code;
        break;
      }
    }
  }
  
  if (stateCode) {
    return getElectricityRate(stateCode, 'commercial');
  }
  
  // Default rate
  return 0.12;
}
