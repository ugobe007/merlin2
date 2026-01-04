/**
 * MERLIN ORCHESTRATOR
 * The General Contractor - Oversees All Subcontractors
 * 
 * RESPONSIBILITIES:
 * 1. Collect user inputs from wizard steps
 * 2. Build MerlinRequest from wizard state
 * 3. Delegate to TrueQuote Engine
 * 4. Handle errors and edge cases
 * 5. Return results for display
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │              MERLIN ORCHESTRATOR (This file)                │
 * │  - Translates WizardState → MerlinRequest                   │
 * │  - Calls TrueQuote Engine                                   │
 * │  - Returns TrueQuoteAuthenticatedResult                     │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              TRUEQUOTE ENGINE V2 (Prime Sub)                │
 * │  - Runs all calculators                                     │
 * │  - Delegates to Magic Fit                                   │
 * │  - Authenticates results                                    │
 * └─────────────────────────────────────────────────────────────┘
 *                              │
 *                              ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              MAGIC FIT (Sub/Sub Contractor)                 │
 * │  - Generates 3 optimized options                            │
 * │  - Must be authenticated by TrueQuote                       │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Part of TrueQuote Engine (Porsche 911 Architecture)
 * Version: 1.0.0
 */

import type { WizardState } from '@/components/wizard/v6/types';
import type {
  MerlinRequest,
  TrueQuoteAuthenticatedResult,
  TrueQuoteRejection,
  EnergyGoal,
  Industry,
} from './contracts';
import { createMerlinRequest, isAuthenticated, isRejected } from './contracts';
import { processQuote } from './TrueQuoteEngineV2';

// Version
const ORCHESTRATOR_VERSION = '1.0.0';

// ============================================================================
// MAIN ORCHESTRATOR FUNCTION
// ============================================================================

/**
 * Process wizard state through the entire quote pipeline
 * 
 * This is the MAIN ENTRY POINT for the wizard to get quotes.
 * 
 * @param wizardState - Current state from WizardV6
 * @returns Authenticated quote result or rejection
 */
export async function generateQuote(
  wizardState: WizardState
): Promise<TrueQuoteAuthenticatedResult | TrueQuoteRejection> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║           MERLIN ORCHESTRATOR v' + ORCHESTRATOR_VERSION + '                  ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log('║  Translating wizard state → TrueQuote request...      ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Validate wizard state
  // ─────────────────────────────────────────────────────────────
  const validation = validateWizardState(wizardState);
  if (!validation.valid) {
    console.error('❌ Merlin: Invalid wizard state:', validation.errors);
    return {
      rejected: true,
      reason: 'Invalid wizard state',
      details: validation.errors.map(e => ({
        option: 'starter' as const,
        field: e.field,
        expected: e.expected,
        received: e.received,
      })),
      suggestion: 'Please complete all required wizard steps',
    };
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Translate WizardState → MerlinRequest
  // ─────────────────────────────────────────────────────────────
  const request = translateWizardState(wizardState);
  console.log('📋 Merlin: Request built');
  console.log('   Request ID:', request.requestId);
  console.log('   Industry:', request.facility.industry);
  console.log('   Location:', request.location.state, request.location.zipCode);

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Delegate to TrueQuote Engine
  // ─────────────────────────────────────────────────────────────
  console.log('');
  console.log('📤 Merlin: Delegating to TrueQuote Engine...');
  
  try {
    const result = await processQuote(request);
    
    if (isRejected(result)) {
      console.error('❌ Merlin: TrueQuote rejected the quote');
      return result;
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║           ✅ QUOTE GENERATION COMPLETE                ║');
    console.log('╠═══════════════════════════════════════════════════════╣');
    console.log('║  Quote ID: ' + result.quoteId.padEnd(42) + '║');
    console.log('║  Options: Starter, Perfect Fit, Beast Mode            ║');
    console.log('║  Status: Authenticated ✓                              ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    
    return result;
    
  } catch (error) {
    console.error('❌ Merlin: Error during quote generation:', error);
    return {
      rejected: true,
      reason: 'Quote generation failed',
      details: [{
        option: 'starter',
        field: 'system',
        expected: 'successful calculation',
        received: error instanceof Error ? error.message : 'Unknown error',
      }],
      suggestion: 'Please try again or contact support',
    };
  }
}

// ============================================================================
// WIZARD STATE VALIDATION
// ============================================================================

interface ValidationError {
  field: string;
  expected: string;
  received: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate that wizard state has all required data
 */
function validateWizardState(state: WizardState): ValidationResult {
  const errors: ValidationError[] = [];

  // Location validation
  if (!state.zipCode && !state.state) {
    errors.push({
      field: 'location',
      expected: 'zip code or state',
      received: 'empty',
    });
  }

  // Industry validation
  if (!state.industry) {
    errors.push({
      field: 'industry',
      expected: 'valid industry type',
      received: 'empty',
    });
  }

  // Goals validation (minimum 3)
  if (!state.goals || state.goals.length < 3) {
    errors.push({
      field: 'goals',
      expected: 'at least 3 goals',
      received: `${state.goals?.length || 0} goals`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// STATE TRANSLATION
// ============================================================================

/**
 * Translate WizardState to MerlinRequest
 */
function translateWizardState(state: WizardState): MerlinRequest {
  return createMerlinRequest({
    // Location
    location: {
      zipCode: state.zipCode || '',
      country: state.country || 'US',
      state: state.state || '',
      city: state.city || '',
    },

    // Goals
    goals: (state.goals || []) as EnergyGoal[],

    // Facility
    facility: {
      industry: normalizeIndustry(state.industry),
      industryName: state.industryName || state.industry || 'Unknown',
      useCaseData: state.useCaseData || {},
    },

    // User preferences (from Step 4)
    preferences: {
      solar: {
        interested: state.solarInterested || false,
        customSizeKw: state.customSolarKwp,
      },
      generator: {
        interested: state.customGeneratorKw ? state.customGeneratorKw > 0 : false,
        customSizeKw: state.customGeneratorKw,
        fuelType: state.generatorFuel as 'natural-gas' | 'diesel' | undefined,
      },
      ev: {
        interested: (state.customEvL2 || 0) + (state.customEvDcfc || 0) + (state.customEvUltraFast || 0) > 0,
        l2Count: state.customEvL2,
        dcfcCount: state.customEvDcfc,
        ultraFastCount: state.customEvUltraFast,
      },
      bess: {
        customPowerKw: state.customBessKw,
        customEnergyKwh: state.customBessKwh,
      },
    },

    // Metadata
    requestId: `MR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    requestedAt: new Date().toISOString(),
    version: '1.0',
  });
}

/**
 * Normalize industry slug to match our types
 */
function normalizeIndustry(industry: string | undefined): Industry {
  if (!industry) return 'hotel';
  
  const normalized = industry.toLowerCase().replace(/-/g, '_');
  
  const INDUSTRY_MAP: Record<string, Industry> = {
    'hotel': 'hotel',
    'hotel_hospitality': 'hotel',
    'car_wash': 'car_wash',
    'carwash': 'car_wash',
    'ev_charging': 'ev_charging',
    'ev': 'ev_charging',
    'data_center': 'data_center',
    'datacenter': 'data_center',
    'manufacturing': 'manufacturing',
    'hospital': 'hospital',
    'healthcare': 'hospital',
    'retail': 'retail',
    'office': 'office',
    'college': 'college',
    'university': 'college',
    'warehouse': 'warehouse',
    'logistics': 'warehouse',
    'restaurant': 'restaurant',
    'agriculture': 'agriculture',
    'agricultural': 'agriculture',
    'airport': 'airport',
    'casino': 'casino',
    'indoor_farm': 'indoor_farm',
    'apartment': 'apartment',
    'multifamily': 'apartment',
    'cold_storage': 'cold_storage',
    'shopping_center': 'shopping_center',
    'government': 'government',
    'gas_station': 'gas_station',
    'residential': 'residential',
    'microgrid': 'microgrid',
  };

  return INDUSTRY_MAP[normalized] || 'hotel';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get orchestrator status
 */
export function getOrchestratorStatus(): {
  version: string;
  status: 'operational' | 'degraded' | 'offline';
} {
  return {
    version: ORCHESTRATOR_VERSION,
    status: 'operational',
  };
}

/**
 * Quick estimate without full calculation (for previews)
 */
export function getQuickEstimate(state: WizardState): {
  estimatedCost: string;
  estimatedSavings: string;
  estimatedPayback: string;
} {
  // Very rough estimates based on industry
  const industryMultipliers: Record<string, number> = {
    hotel: 1.0,
    car_wash: 0.6,
    data_center: 3.0,
    hospital: 2.5,
    manufacturing: 1.5,
    retail: 0.8,
    office: 0.7,
    warehouse: 1.2,
  };

  const multiplier = industryMultipliers[state.industry || 'hotel'] || 1.0;
  const baseCost = 250000 * multiplier;
  const baseSavings = 35000 * multiplier;

  return {
    estimatedCost: `$${Math.round(baseCost / 1000) * 1000}`,
    estimatedSavings: `$${Math.round(baseSavings / 1000) * 1000}/year`,
    estimatedPayback: `${Math.round(baseCost / baseSavings)} years`,
  };
}

// ============================================================================
// EXPORTS FOR WIZARD
// ============================================================================

export {
  type MerlinRequest,
  type TrueQuoteAuthenticatedResult,
  type TrueQuoteRejection,
  isAuthenticated,
  isRejected,
} from './contracts';
