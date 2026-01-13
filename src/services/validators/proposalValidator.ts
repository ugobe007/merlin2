/**
 * PROPOSAL VALIDATOR
 * Authenticates Magic Fit proposals for TrueQuote
 * 
 * TrueQuote MUST validate all Magic Fit proposals before they can be
 * presented to users. This ensures financial accuracy and system integrity.
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 */

import type {
  TrueQuoteBaseCalculation,
  MagicFitProposal,
  SystemOption,
  AuthenticatedSystemOption,
  TrueQuoteRejection,
  OptionTier,
} from '../contracts';

// Validation thresholds
const VALIDATION_RULES = {
  // System sizing limits (relative to base)
  MAX_BESS_SCALE: 2.5,        // BESS can't exceed 250% of base
  MAX_SOLAR_SCALE: 2.5,       // Solar can't exceed 250% of base
  MAX_GENERATOR_SCALE: 3.0,   // Generator can be up to 300%
  MIN_SYSTEM_SIZE: 0.5,       // Minimum 50% of base

  // Financial validation
  MAX_PAYBACK_YEARS: 50,      // Reject if payback > 50 years
  MIN_PAYBACK_YEARS: 0.5,     // Suspicious if payback < 6 months
  PAYBACK_TOLERANCE: 1.0,     // Allow 1 year variance in payback calculation
  ROI_TOLERANCE: 20,          // Allow 20% variance in ROI calculation

  // Cost sanity checks
  MIN_COST_PER_KWH: 200,      // Minimum $200/kWh for BESS
  MAX_COST_PER_KWH: 600,      // Maximum $600/kWh for BESS
};

export interface ValidationResult {
  valid: boolean;
  option: OptionTier;
  checks: {
    name: string;
    passed: boolean;
    expected?: string;
    received?: string;
    message?: string;
  }[];
}

export interface AuthenticationResult {
  authenticated: true;
  options: {
    starter: AuthenticatedSystemOption;
    perfectFit: AuthenticatedSystemOption;
    beastMode: AuthenticatedSystemOption;
  };
}

/**
 * Authenticate a Magic Fit proposal
 * 
 * @returns Authenticated options or rejection
 */
export function authenticateProposal(
  base: TrueQuoteBaseCalculation,
  proposal: MagicFitProposal
): AuthenticationResult | TrueQuoteRejection {
  console.log('🔐 Validator: Authenticating Magic Fit proposal');

  const validationResults: ValidationResult[] = [];
  const rejectionDetails: TrueQuoteRejection['details'] = [];

  // Validate each option
  for (const tier of ['starter', 'perfectFit', 'beastMode'] as const) {
    const result = validateOption(tier, proposal[tier], base);
    validationResults.push(result);

    if (!result.valid) {
      const failedChecks = result.checks.filter(c => !c.passed);
      for (const check of failedChecks) {
        rejectionDetails.push({
          option: tier,
          field: check.name,
          expected: check.expected || '',
          received: check.received || '',
        });
      }
    }
  }

  // If any validation failed, reject
  if (rejectionDetails.length > 0) {
    console.log('🔐 Validator: REJECTED', rejectionDetails);
    return {
      rejected: true,
      reason: `${rejectionDetails.length} validation check(s) failed`,
      details: rejectionDetails,
      suggestion: 'Review Magic Fit calculations and adjust parameters',
    };
  }

  // All passed - create authenticated options
  console.log('🔐 Validator: APPROVED ✓');
  return {
    authenticated: true,
    options: {
      starter: createAuthenticatedOption(proposal.starter, validationResults[0]),
      perfectFit: createAuthenticatedOption(proposal.perfectFit, validationResults[1]),
      beastMode: createAuthenticatedOption(proposal.beastMode, validationResults[2]),
    },
  };
}

/**
 * Validate a single system option
 */
function validateOption(
  tier: OptionTier,
  option: SystemOption,
  base: TrueQuoteBaseCalculation
): ValidationResult {
  const checks: ValidationResult['checks'] = [];

  // ─────────────────────────────────────────────────────────────
  // BESS Validation
  // ─────────────────────────────────────────────────────────────
  const bessScale = base.bess.energyKWh > 0 
    ? option.bess.energyKWh / base.bess.energyKWh 
    : 1;

  checks.push({
    name: 'bess.energyKWh.maxScale',
    passed: bessScale <= VALIDATION_RULES.MAX_BESS_SCALE,
    expected: `<= ${VALIDATION_RULES.MAX_BESS_SCALE * 100}% of base`,
    received: `${Math.round(bessScale * 100)}%`,
    message: bessScale > VALIDATION_RULES.MAX_BESS_SCALE 
      ? 'BESS oversized beyond reasonable limits' 
      : undefined,
  });

  checks.push({
    name: 'bess.energyKWh.positive',
    passed: option.bess.energyKWh > 0,
    expected: '> 0',
    received: String(option.bess.energyKWh),
  });

  checks.push({
    name: 'bess.powerKW.positive',
    passed: option.bess.powerKW > 0,
    expected: '> 0',
    received: String(option.bess.powerKW),
  });

  // ─────────────────────────────────────────────────────────────
  // Solar Validation (if included)
  // ─────────────────────────────────────────────────────────────
  if (option.solar.included) {
    const solarScale = base.solar.capacityKW > 0 
      ? option.solar.capacityKW / base.solar.capacityKW 
      : 1;

    checks.push({
      name: 'solar.capacityKW.maxScale',
      passed: solarScale <= VALIDATION_RULES.MAX_SOLAR_SCALE || base.solar.capacityKW === 0,
      expected: `<= ${VALIDATION_RULES.MAX_SOLAR_SCALE * 100}% of base`,
      received: `${Math.round(solarScale * 100)}%`,
    });

    checks.push({
      name: 'solar.capacityKW.positive',
      passed: option.solar.capacityKW > 0,
      expected: '> 0',
      received: String(option.solar.capacityKW),
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Generator Validation (if included)
  // ─────────────────────────────────────────────────────────────
  if (option.generator.included) {
    checks.push({
      name: 'generator.capacityKW.positive',
      passed: option.generator.capacityKW > 0,
      expected: '> 0',
      received: String(option.generator.capacityKW),
    });

    // Generator should provide meaningful backup
    const generatorRatio = option.generator.capacityKW / option.bess.powerKW;
    checks.push({
      name: 'generator.capacityKW.meaningful',
      passed: generatorRatio >= 0.25,
      expected: '>= 25% of BESS power',
      received: `${Math.round(generatorRatio * 100)}%`,
      message: generatorRatio < 0.25 ? 'Generator too small to provide meaningful backup' : undefined,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Financial Validation
  // ─────────────────────────────────────────────────────────────
  checks.push({
    name: 'financials.totalInvestment.positive',
    passed: option.financials.totalInvestment > 0,
    expected: '> 0',
    received: String(option.financials.totalInvestment),
  });

  checks.push({
    name: 'financials.netCost.positive',
    passed: option.financials.netCost >= 0,
    expected: '>= 0',
    received: String(option.financials.netCost),
  });

  checks.push({
    name: 'financials.annualSavings.positive',
    passed: option.financials.annualSavings > 0,
    expected: '> 0',
    received: String(option.financials.annualSavings),
  });

  // Payback calculation verification
  const expectedPayback = option.financials.annualSavings > 0
    ? option.financials.netCost / option.financials.annualSavings
    : 99;
  const paybackDiff = Math.abs(expectedPayback - option.financials.paybackYears);

  checks.push({
    name: 'financials.paybackYears.accurate',
    passed: paybackDiff <= VALIDATION_RULES.PAYBACK_TOLERANCE,
    expected: `${expectedPayback.toFixed(1)} years (±${VALIDATION_RULES.PAYBACK_TOLERANCE})`,
    received: `${option.financials.paybackYears} years`,
    message: paybackDiff > VALIDATION_RULES.PAYBACK_TOLERANCE 
      ? 'Payback calculation mismatch' 
      : undefined,
  });

  checks.push({
    name: 'financials.paybackYears.reasonable',
    passed: option.financials.paybackYears > 0 && option.financials.paybackYears <= VALIDATION_RULES.MAX_PAYBACK_YEARS,
    expected: `0 < payback <= ${VALIDATION_RULES.MAX_PAYBACK_YEARS}`,
    received: String(option.financials.paybackYears),
  });

  // ROI calculation verification
  const expectedROI = option.financials.netCost > 0
    ? ((option.financials.annualSavings * 10 - option.financials.netCost) / option.financials.netCost) * 100
    : 0;
  const roiDiff = Math.abs(expectedROI - option.financials.tenYearROI);

  checks.push({
    name: 'financials.tenYearROI.accurate',
    passed: roiDiff <= VALIDATION_RULES.ROI_TOLERANCE,
    expected: `${expectedROI.toFixed(1)}% (±${VALIDATION_RULES.ROI_TOLERANCE}%)`,
    received: `${option.financials.tenYearROI}%`,
    message: roiDiff > VALIDATION_RULES.ROI_TOLERANCE ? 'ROI calculation mismatch' : undefined,
  });

  // Federal ITC validation (should be ~30% of BESS + Solar costs)
  const estimatedITCBase = (option.bess.energyKWh * 175) + (option.solar.capacityKW * 1200);
  const expectedITC = estimatedITCBase * 0.30;
  const itcDiff = Math.abs(expectedITC - option.financials.federalITC);
  const itcTolerance = expectedITC * 0.20; // 20% tolerance

  checks.push({
    name: 'financials.federalITC.reasonable',
    passed: itcDiff <= itcTolerance || option.financials.federalITC === 0,
    expected: `~$${Math.round(expectedITC).toLocaleString()} (±20%)`,
    received: `$${option.financials.federalITC.toLocaleString()}`,
  });

  // ─────────────────────────────────────────────────────────────
  // Coverage Validation
  // ─────────────────────────────────────────────────────────────
  checks.push({
    name: 'coverage.energyCoveragePercent.reasonable',
    passed: option.coverage.energyCoveragePercent > 0 && option.coverage.energyCoveragePercent <= 200,
    expected: '0 < coverage <= 200%',
    received: `${option.coverage.energyCoveragePercent}%`,
  });

  checks.push({
    name: 'coverage.backupHours.positive',
    passed: option.coverage.backupHours >= 0,
    expected: '>= 0',
    received: String(option.coverage.backupHours),
  });

  // Determine overall validity
  const allPassed = checks.every(c => c.passed);

  return {
    valid: allPassed,
    option: tier,
    checks,
  };
}

/**
 * Create an authenticated system option
 */
function createAuthenticatedOption(
  option: SystemOption,
  validation: ValidationResult
): AuthenticatedSystemOption {
  return {
    ...option,
    verified: true,
    verificationDetails: {
      bessValid: validation.checks
        .filter(c => c.name.startsWith('bess.'))
        .every(c => c.passed),
      solarValid: validation.checks
        .filter(c => c.name.startsWith('solar.'))
        .every(c => c.passed),
      generatorValid: validation.checks
        .filter(c => c.name.startsWith('generator.'))
        .every(c => c.passed),
      financialsValid: validation.checks
        .filter(c => c.name.startsWith('financials.'))
        .every(c => c.passed),
      roiAccurate: validation.checks
        .filter(c => c.name.includes('ROI') || c.name.includes('payback'))
        .every(c => c.passed),
    },
  };
}

/**
 * Get validation summary for logging/debugging
 */
export function getValidationSummary(results: ValidationResult[]): string {
  const lines: string[] = ['Validation Summary:'];
  
  for (const result of results) {
    const passedCount = result.checks.filter(c => c.passed).length;
    const totalCount = result.checks.length;
    const status = result.valid ? '✓' : '✗';
    lines.push(`  ${status} ${result.option}: ${passedCount}/${totalCount} checks passed`);
    
    if (!result.valid) {
      const failed = result.checks.filter(c => !c.passed);
      for (const check of failed) {
        lines.push(`    - ${check.name}: expected ${check.expected}, got ${check.received}`);
      }
    }
  }
  
  return lines.join('\n');
}
