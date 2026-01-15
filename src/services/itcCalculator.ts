/**
 * ============================================================================
 * DYNAMIC ITC CALCULATOR
 * ============================================================================
 * 
 * Created: January 14, 2026
 * Purpose: Calculate Investment Tax Credit (ITC) per IRA 2022 rules
 * 
 * ADDRESSES GAP: "Hardcoded 30% ITC" identified in AI Assessment
 * - Previous: All projects assumed 30% ITC
 * - Now: Dynamic ITC based on project type, size, labor compliance
 * 
 * IRA 2022 ITC STRUCTURE:
 * - Base Rate: 6% (all projects)
 * - Bonus: +24% if prevailing wage & apprenticeship requirements met
 * - Adders:
 *   - Energy Community: +10%
 *   - Domestic Content: +10%
 *   - Low-income Community: +10-20%
 * 
 * EFFECTIVE RATES:
 * - Minimum: 6% (no bonuses)
 * - Standard: 30% (with prevailing wage)
 * - Maximum: 50-70% (with all adders)
 * 
 * DATA SOURCES:
 * - IRA 2022 (Public Law 117-169)
 * - IRS Notice 2023-29 (Energy Communities)
 * - IRS Notice 2023-38 (Domestic Content)
 * - Treasury Guidance 2024
 * 
 * TrueQuote™ COMPLIANCE:
 * - All rates traceable to specific IRS guidance
 * - Calculation methodology documented
 * - Confidence levels based on project specifics
 * ============================================================================
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ITCProjectInput {
  // Project basics
  projectType: 'bess' | 'solar' | 'wind' | 'hybrid' | 'geothermal' | 'fuel-cell';
  capacityMW: number;
  totalCost: number;
  inServiceDate: Date;
  
  // Location
  state: string;
  zipCode?: string;
  county?: string;
  
  // Labor compliance
  prevailingWage: boolean;
  apprenticeship: boolean;
  
  // Bonus qualifications
  energyCommunity?: boolean | 'coal-closure' | 'brownfield' | 'fossil-fuel-employment';
  domesticContent?: boolean;
  domesticContentPct?: number; // 0-100, needs 40%+ steel, 20%+ manufactured
  lowIncomeProject?: boolean | 'located-in' | 'serves' | 'tribal' | 'affordable-housing';
  
  // Interconnection
  gridConnected: boolean;
  interconnectionDate?: Date;
}

export interface ITCCalculationResult {
  // Calculated rates
  baseRate: number;           // 6% or 30%
  totalRate: number;          // Final ITC percentage
  creditAmount: number;       // Dollar amount of credit
  
  // Rate breakdown
  breakdown: {
    baseCredit: number;
    prevailingWageBonus: number;
    energyCommunityBonus: number;
    domesticContentBonus: number;
    lowIncomeBonus: number;
  };
  
  // Qualification status
  qualifications: {
    prevailingWage: { qualified: boolean; reason: string };
    energyCommunity: { qualified: boolean; type?: string; reason: string };
    domesticContent: { qualified: boolean; percentage?: number; reason: string };
    lowIncome: { qualified: boolean; type?: string; reason: string };
  };
  
  // Phase-out / Sunset info
  phaseOut: {
    applies: boolean;
    reducedRate?: number;
    reason?: string;
    effectiveDate?: string;
  };
  
  // TrueQuote™ Attribution
  audit: {
    methodology: string;
    sources: Array<{
      component: string;
      source: string;
      citation: string;
    }>;
    confidence: 'high' | 'medium' | 'low';
    notes: string[];
    calculatedAt: string;
  };
}

// ============================================================================
// CONSTANTS - IRA 2022 ITC RATES
// ============================================================================

/**
 * ITC Base Rates by Technology
 * Source: IRC Section 48 (as amended by IRA 2022)
 */
export const ITC_BASE_RATES = {
  // Technologies eligible for ITC
  'solar': { base: 0.06, withPWA: 0.30, maxWithAdders: 0.70 },
  'bess': { base: 0.06, withPWA: 0.30, maxWithAdders: 0.70 },
  'wind': { base: 0.06, withPWA: 0.30, maxWithAdders: 0.50 }, // Wind uses PTC primarily
  'geothermal': { base: 0.06, withPWA: 0.30, maxWithAdders: 0.70 },
  'fuel-cell': { base: 0.06, withPWA: 0.30, maxWithAdders: 0.70 },
  'hybrid': { base: 0.06, withPWA: 0.30, maxWithAdders: 0.70 },
} as const;

/**
 * ITC Bonus Adders
 * Source: IRC Section 48(e)
 */
export const ITC_BONUS_ADDERS = {
  // Energy Community Bonus (IRC 48(e)(3))
  energyCommunity: {
    rate: 0.10,
    types: {
      'coal-closure': 'Within census tract of closed coal mine/plant',
      'brownfield': 'Located on brownfield site',
      'fossil-fuel-employment': 'In statistical area with fossil fuel employment ≥0.17%',
    },
    source: 'IRS Notice 2023-29',
  },
  
  // Domestic Content Bonus (IRC 48(e)(4))
  domesticContent: {
    rate: 0.10,
    requirements: {
      steelIron: 100, // 100% US steel/iron
      manufacturedProducts: 40, // 40% in 2024, increases to 55% by 2027
    },
    source: 'IRS Notice 2023-38',
  },
  
  // Low-Income Community Bonus (IRC 48(e)(2))
  lowIncome: {
    tier1: { rate: 0.10, type: 'Located in low-income community or tribal land' },
    tier2: { rate: 0.20, type: 'Serves low-income residential or affordable housing' },
    capacityCap: 5, // MW - only projects <5 MW eligible
    source: 'IRC Section 48(e)(2), IRS program guidance',
  },
} as const;

/**
 * Prevailing Wage & Apprenticeship Requirements
 * Source: IRS Notice 2022-61
 */
export const PWA_REQUIREMENTS = {
  prevailingWage: {
    description: 'Pay Davis-Bacon prevailing wages during construction',
    threshold: 1, // MW - applies to projects ≥1 MW
    correctionPeriod: 180, // days to cure violations
  },
  apprenticeship: {
    description: 'Meet registered apprenticeship requirements',
    threshold: 1, // MW - applies to projects ≥1 MW
    laborHours: {
      2024: 0.125, // 12.5% of total labor hours
      2025: 0.15, // 15% in 2025+
    },
    participatingContractor: 'Each contractor must request apprentices',
  },
  source: 'IRS Notice 2022-61, Treasury Guidance',
} as const;

/**
 * ITC Phase-out Schedule
 * Source: IRC Section 48(a)(7)
 */
export const ITC_PHASEOUT = {
  trigger: {
    type: 'emissions-target',
    description: 'Phases out when US GHG emissions fall to 25% of 2022 levels',
    baseYear: 2022,
  },
  schedule: {
    year1AfterTrigger: 1.00, // 100% of credit
    year2AfterTrigger: 0.75, // 75% of credit
    year3AfterTrigger: 0.50, // 50% of credit
    year4AndBeyond: 0.00, // Credit expires
  },
  source: 'IRC Section 48(a)(7)',
} as const;

// ============================================================================
// ENERGY COMMUNITY ZIP CODES (Sample - full list would be from IRS)
// ============================================================================

// This is a sample - in production, this would be fetched from IRS database
const ENERGY_COMMUNITY_ZIPS = new Set([
  // Coal closure communities (sample)
  '26301', '26302', '26330', // West Virginia
  '42101', '42102', '42103', // Kentucky
  '15401', '15410', '15411', // Pennsylvania
  '45701', '45710', '45711', // Ohio
  '62701', '62702', '62703', // Illinois
  
  // Brownfield (would need separate lookup)
  
  // Fossil fuel employment areas (statistical areas with ≥0.17% FF employment)
  // This includes many areas in TX, OK, LA, WY, ND, etc.
]);

// ============================================================================
// LOW-INCOME COMMUNITY CENSUS TRACTS (Sample)
// ============================================================================

const LOW_INCOME_TRACTS = new Set([
  // This would be populated from CDFI Fund data
  // Example format: STATE_FIPS + COUNTY_FIPS + TRACT
]);

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate Investment Tax Credit based on IRA 2022 rules
 * 
 * @param input - Project details
 * @returns Complete ITC calculation with breakdown and attribution
 */
export function calculateITC(input: ITCProjectInput): ITCCalculationResult {
  const {
    projectType,
    capacityMW,
    totalCost,
    inServiceDate,
    state,
    zipCode,
    prevailingWage,
    apprenticeship,
    energyCommunity,
    domesticContent,
    domesticContentPct,
    lowIncomeProject,
    gridConnected,
  } = input;
  
  const notes: string[] = [];
  const sources: ITCCalculationResult['audit']['sources'] = [];
  
  // Get base rates for project type
  const typeRates = ITC_BASE_RATES[projectType] || ITC_BASE_RATES.bess;
  
  // ============================================
  // 1. BASE RATE CALCULATION
  // ============================================
  
  // Check if prevailing wage & apprenticeship requirements are met
  const meetsLaborRequirements = capacityMW < 1 || (prevailingWage && apprenticeship);
  const baseRate = meetsLaborRequirements ? typeRates.withPWA : typeRates.base;
  
  const pwaQualification = {
    qualified: meetsLaborRequirements,
    reason: capacityMW < 1 
      ? 'Project under 1 MW - PWA not required'
      : meetsLaborRequirements 
        ? 'Prevailing wage and apprenticeship requirements met'
        : `Missing: ${!prevailingWage ? 'prevailing wage' : ''}${!prevailingWage && !apprenticeship ? ' and ' : ''}${!apprenticeship ? 'apprenticeship' : ''}`,
  };
  
  sources.push({
    component: 'Base ITC Rate',
    source: 'IRC Section 48(a), IRS Notice 2022-61',
    citation: meetsLaborRequirements 
      ? 'Full 30% base rate with PWA compliance'
      : 'Reduced 6% base rate without PWA compliance',
  });
  
  if (!meetsLaborRequirements && capacityMW >= 1) {
    notes.push(`⚠️ Project loses 24% ITC (${typeRates.base * 100}% vs ${typeRates.withPWA * 100}%) without prevailing wage compliance`);
  }
  
  // ============================================
  // 2. ENERGY COMMUNITY BONUS
  // ============================================
  
  let energyCommunityBonus = 0;
  let energyCommunityQualification = {
    qualified: false,
    type: undefined as string | undefined,
    reason: 'Not claimed or not in designated energy community',
  };
  
  if (energyCommunity) {
    // Check if zip code is in energy community
    const inEnergyCommunity = zipCode ? ENERGY_COMMUNITY_ZIPS.has(zipCode) : false;
    
    if (energyCommunity === true && inEnergyCommunity) {
      energyCommunityBonus = ITC_BONUS_ADDERS.energyCommunity.rate;
      energyCommunityQualification = {
        qualified: true,
        type: 'Auto-detected from zip code',
        reason: `ZIP ${zipCode} is in a designated energy community`,
      };
    } else if (typeof energyCommunity === 'string') {
      // User specified the type
      energyCommunityBonus = ITC_BONUS_ADDERS.energyCommunity.rate;
      energyCommunityQualification = {
        qualified: true,
        type: energyCommunity,
        reason: ITC_BONUS_ADDERS.energyCommunity.types[energyCommunity] || 'Energy community status claimed',
      };
    }
    
    if (energyCommunityBonus > 0) {
      sources.push({
        component: 'Energy Community Bonus',
        source: 'IRC Section 48(e)(3), IRS Notice 2023-29',
        citation: `+10% for location in ${energyCommunityQualification.type}`,
      });
    }
  }
  
  // ============================================
  // 3. DOMESTIC CONTENT BONUS
  // ============================================
  
  let domesticContentBonus = 0;
  let domesticContentQualification = {
    qualified: false,
    percentage: domesticContentPct,
    reason: 'Domestic content requirements not met or not claimed',
  };
  
  if (domesticContent) {
    const requiredPct = ITC_BONUS_ADDERS.domesticContent.requirements.manufacturedProducts;
    const meetsPct = (domesticContentPct || 0) >= requiredPct;
    
    if (meetsPct || domesticContent === true) {
      domesticContentBonus = ITC_BONUS_ADDERS.domesticContent.rate;
      domesticContentQualification = {
        qualified: true,
        percentage: domesticContentPct,
        reason: domesticContentPct 
          ? `${domesticContentPct}% domestic content meets ${requiredPct}% threshold`
          : 'Domestic content certification claimed',
      };
      
      sources.push({
        component: 'Domestic Content Bonus',
        source: 'IRC Section 48(e)(4), IRS Notice 2023-38',
        citation: `+10% for domestic content (${domesticContentPct || '40+'}% US manufactured)`,
      });
    } else {
      domesticContentQualification.reason = `${domesticContentPct}% domestic content below ${requiredPct}% threshold`;
      notes.push(`Domestic content at ${domesticContentPct}% - needs ${requiredPct}% for bonus`);
    }
  }
  
  // ============================================
  // 4. LOW-INCOME COMMUNITY BONUS
  // ============================================
  
  let lowIncomeBonus = 0;
  let lowIncomeQualification = {
    qualified: false,
    type: undefined as string | undefined,
    reason: 'Not claimed or project exceeds 5 MW cap',
  };
  
  if (lowIncomeProject && capacityMW <= ITC_BONUS_ADDERS.lowIncome.capacityCap) {
    if (lowIncomeProject === true || lowIncomeProject === 'located-in' || lowIncomeProject === 'tribal') {
      lowIncomeBonus = ITC_BONUS_ADDERS.lowIncome.tier1.rate;
      lowIncomeQualification = {
        qualified: true,
        type: 'Tier 1 (Located In)',
        reason: ITC_BONUS_ADDERS.lowIncome.tier1.type,
      };
    } else if (lowIncomeProject === 'serves' || lowIncomeProject === 'affordable-housing') {
      lowIncomeBonus = ITC_BONUS_ADDERS.lowIncome.tier2.rate;
      lowIncomeQualification = {
        qualified: true,
        type: 'Tier 2 (Serves)',
        reason: ITC_BONUS_ADDERS.lowIncome.tier2.type,
      };
    }
    
    if (lowIncomeBonus > 0) {
      sources.push({
        component: 'Low-Income Community Bonus',
        source: 'IRC Section 48(e)(2)',
        citation: `+${lowIncomeBonus * 100}% for ${lowIncomeQualification.type}`,
      });
    }
  } else if (lowIncomeProject && capacityMW > ITC_BONUS_ADDERS.lowIncome.capacityCap) {
    lowIncomeQualification.reason = `Project ${capacityMW} MW exceeds ${ITC_BONUS_ADDERS.lowIncome.capacityCap} MW cap for low-income bonus`;
    notes.push(`Low-income bonus not available for projects >${ITC_BONUS_ADDERS.lowIncome.capacityCap} MW`);
  }
  
  // ============================================
  // 5. CALCULATE TOTAL RATE
  // ============================================
  
  const totalRate = Math.min(
    baseRate + energyCommunityBonus + domesticContentBonus + lowIncomeBonus,
    typeRates.maxWithAdders
  );
  
  // Calculate dollar amounts
  const baseCredit = totalCost * baseRate;
  const creditAmount = totalCost * totalRate;
  
  // ============================================
  // 6. CHECK PHASE-OUT
  // ============================================
  
  // As of 2026, no phase-out has been triggered (emissions target not met)
  const phaseOut = {
    applies: false,
    reason: 'Phase-out not yet triggered - US emissions above 25% of 2022 baseline',
  };
  
  // ============================================
  // 7. BUILD RESULT
  // ============================================
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (!zipCode && energyCommunity) confidence = 'medium';
  if (!prevailingWage && capacityMW >= 1) confidence = 'medium';
  if (!domesticContentPct && domesticContent) confidence = 'low';
  
  return {
    baseRate,
    totalRate,
    creditAmount,
    breakdown: {
      baseCredit,
      prevailingWageBonus: meetsLaborRequirements && capacityMW >= 1 ? totalCost * 0.24 : 0,
      energyCommunityBonus: totalCost * energyCommunityBonus,
      domesticContentBonus: totalCost * domesticContentBonus,
      lowIncomeBonus: totalCost * lowIncomeBonus,
    },
    qualifications: {
      prevailingWage: pwaQualification,
      energyCommunity: energyCommunityQualification,
      domesticContent: domesticContentQualification,
      lowIncome: lowIncomeQualification,
    },
    phaseOut,
    audit: {
      methodology: 'IRA 2022 Investment Tax Credit calculation per IRC Section 48',
      sources,
      confidence,
      notes,
      calculatedAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Result type for estimateITC
 */
export interface ITCEstimateResult {
  totalRate: number;
  baseRate: number;
  creditAmount: number;
  notes: string[];
}

/**
 * Quick ITC estimate with standard assumptions
 * Use for UI previews - NOT for final quotes
 * 
 * @param projectType - Type of project (bess, solar, hybrid, etc.)
 * @param totalCost - Total project cost in dollars
 * @param capacityMW - Project capacity in MW
 * @param prevailingWage - Whether PWA requirements are met
 * @param bonuses - Optional bonus qualifications
 */
export function estimateITC(
  projectType: ITCProjectInput['projectType'],
  totalCost: number,
  capacityMW: number,
  prevailingWage: boolean = true,
  bonuses?: {
    energyCommunity?: boolean | 'coal-closure' | 'brownfield' | 'fossil-fuel-employment';
    domesticContent?: boolean;
    lowIncome?: boolean | 'located-in' | 'serves';
  }
): ITCEstimateResult {
  const rates = ITC_BASE_RATES[projectType] || ITC_BASE_RATES.bess;
  
  // Base rate depends on PWA compliance (projects <1 MW exempt from PWA)
  const baseRate: number = (prevailingWage || capacityMW < 1) ? rates.withPWA : rates.base;
  let totalRate: number = baseRate;
  const notes: string[] = [];
  
  // PWA note
  if (prevailingWage || capacityMW < 1) {
    notes.push(capacityMW < 1 
      ? 'Project under 1 MW - PWA requirements waived'
      : 'Prevailing wage & apprenticeship requirements met (+24%)');
  } else {
    notes.push('⚠️ Missing PWA compliance - base rate reduced to 6%');
  }
  
  // Energy Community bonus (+10%)
  if (bonuses?.energyCommunity) {
    totalRate += ITC_BONUS_ADDERS.energyCommunity.rate;
    const type = typeof bonuses.energyCommunity === 'string' 
      ? bonuses.energyCommunity 
      : 'designated area';
    notes.push(`Energy Community bonus: +10% (${type})`);
  }
  
  // Domestic Content bonus (+10%)
  if (bonuses?.domesticContent) {
    totalRate += ITC_BONUS_ADDERS.domesticContent.rate;
    notes.push('Domestic Content bonus: +10% (100% US steel, 40%+ manufactured)');
  }
  
  // Low-Income bonus (+10% or +20%)
  if (bonuses?.lowIncome && capacityMW < 5) {
    if (bonuses.lowIncome === 'serves' || bonuses.lowIncome === true) {
      totalRate += ITC_BONUS_ADDERS.lowIncome.tier2.rate;
      notes.push('Low-Income Tier 2 bonus: +20% (serves low-income residents)');
    } else {
      totalRate += ITC_BONUS_ADDERS.lowIncome.tier1.rate;
      notes.push('Low-Income Tier 1 bonus: +10% (located in low-income community)');
    }
  } else if (bonuses?.lowIncome && capacityMW >= 5) {
    notes.push('Low-Income bonus not available: project exceeds 5 MW cap');
  }
  
  // Cap at maximum allowed
  totalRate = Math.min(totalRate, rates.maxWithAdders);
  
  return {
    totalRate,
    baseRate,
    creditAmount: totalCost * totalRate,
    notes,
  };
}

/**
 * Check if a zip code is in an energy community
 */
export function isEnergyCommunity(zipCode: string): boolean {
  return ENERGY_COMMUNITY_ZIPS.has(zipCode);
}

/**
 * Get maximum possible ITC rate for a project type
 */
export function getMaxITCRate(projectType: ITCProjectInput['projectType']): number {
  return (ITC_BASE_RATES[projectType] || ITC_BASE_RATES.bess).maxWithAdders;
}

/**
 * Get ITC documentation for TrueQuote™ display
 */
export function getITCDocumentation(): {
  methodology: string;
  sources: string[];
  effectiveDate: string;
} {
  return {
    methodology: 'Investment Tax Credit per Inflation Reduction Act of 2022 (Public Law 117-169)',
    sources: [
      'IRC Section 48 (as amended by IRA)',
      'IRS Notice 2022-61 (Prevailing Wage)',
      'IRS Notice 2023-29 (Energy Communities)',
      'IRS Notice 2023-38 (Domestic Content)',
      'Treasury Guidance 2024',
    ],
    effectiveDate: 'August 16, 2022 (IRA enactment)',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateITC,
  estimateITC,
  isEnergyCommunity,
  getMaxITCRate,
  getITCDocumentation,
  ITC_BASE_RATES,
  ITC_BONUS_ADDERS,
  PWA_REQUIREMENTS,
  ITC_PHASEOUT,
};
