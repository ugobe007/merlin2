/**
 * TrueQuote Engine Input Mapper
 * ==============================
 * Maps WizardState to MerlinRequest format (Porsche 911 Architecture)
 * 
 * ✅ SSOT COMPLIANT - January 2026 Refactor
 * 
 * This mapper translates the UI wizard state into the standardized
 * MerlinRequest format that flows through:
 * 
 * WizardState → MerlinRequest → TrueQuoteEngineV2 → MagicFit → Result
 */

import type { WizardState } from '../types';
import type { 
  MerlinRequest, 
  EnergyGoal, 
  Industry,
  GeneratorFuel 
} from '@/services/contracts';
import { createMerlinRequest } from '@/services/contracts';

// ============================================================================
// LEGACY SUPPORT - Old TrueQuoteInput format (for gradual migration)
// ============================================================================
// @deprecated - TrueQuoteInput type kept inline for legacy mapWizardStateToTrueQuoteInput function
// This function is only used by deprecated useTrueQuote.ts hook
interface TrueQuoteInput {
  location: { zipCode: string; state: string };
  industry: { type: string; subtype: string; facilityData: Record<string, number | string | boolean> };
  options: { 
    solarEnabled: boolean; 
    evChargingEnabled: boolean; 
    generatorEnabled: boolean;
    level2Chargers?: number;
    dcFastChargers?: number;
    ultraFastChargers?: number;
  };
}
import { mapSubtype, mapFieldName, DEFAULT_SUBTYPES } from '@/services/trueQuoteMapperConfig';

// ============================================================================
// INDUSTRY SLUG NORMALIZATION
// ============================================================================

const INDUSTRY_NORMALIZE: Record<string, Industry> = {
  'data_center': 'data_center',
  'data-center': 'data_center',
  'ev_charging': 'ev_charging',
  'ev-charging': 'ev_charging',
  'car_wash': 'car_wash',
  'car-wash': 'car_wash',
  'hotel': 'hotel',
  'hospital': 'hospital',
  'manufacturing': 'manufacturing',
  'retail': 'retail',
  'restaurant': 'restaurant',
  'office': 'office',
  'college': 'college',
  'university': 'college',
  'agriculture': 'agriculture',
  'warehouse': 'warehouse',
  'casino': 'casino',
  'apartment': 'apartment',
  'apartments': 'apartment',
  'apartment-building': 'apartment',
  'cold-storage': 'cold_storage',
  'cold_storage': 'cold_storage',
  'shopping-center': 'shopping_center',
  'shopping-mall': 'shopping_center',
  'shopping_mall': 'shopping_center',
  'indoor-farm': 'indoor_farm',
  'indoor_farm': 'indoor_farm',
  'government': 'government',
  'public-building': 'government',
  'airport': 'airport',
  'gas_station': 'gas_station',
  'gas-station': 'gas_station',
  'residential': 'residential',
  'microgrid': 'microgrid',
};

/**
 * Normalize industry string to Industry enum
 */
function normalizeIndustry(industry: string | undefined): Industry {
  if (!industry) return 'hotel';
  const normalized = industry.toLowerCase().replace(/-/g, '_');
  return INDUSTRY_NORMALIZE[normalized] || INDUSTRY_NORMALIZE[industry] || 'hotel';
}

// ============================================================================
// NEW MAPPER - Creates MerlinRequest for Porsche 911 Architecture
// ============================================================================

/**
 * Map WizardState to MerlinRequest format
 * This is the NEW mapper for the Porsche 911 architecture
 */
export function mapWizardStateToMerlinRequest(state: WizardState): MerlinRequest {
  const industry = normalizeIndustry(state.industry);
  
  return createMerlinRequest({
    // Location
    location: {
      zipCode: state.zipCode || '',
      country: state.country || 'US',
      state: state.state || '',
      city: state.city || '',
    },

    // Goals (ensure we have valid EnergyGoal types)
    goals: normalizeGoals(state.goals),

    // Facility
    facility: {
      industry,
      industryName: state.industryName || state.industry || 'Unknown',
      useCaseData: state.useCaseData || {},
    },

    // User preferences from Step 4
    preferences: {
      solar: {
        interested: state.selectedOptions?.includes('solar') || false,
        customSizeKw: state.customSolarKw,
      },
      generator: {
        interested: state.selectedOptions?.includes('generator') || 
                   (state.customGeneratorKw !== undefined && state.customGeneratorKw > 0),
        customSizeKw: state.customGeneratorKw,
        fuelType: state.generatorFuel as GeneratorFuel | undefined,
      },
      ev: {
        interested: state.selectedOptions?.includes('ev') ||
                   ((state.customEvL2 || 0) + (state.customEvDcfc || 0) + (state.customEvUltraFast || 0)) > 0,
        l2Count: state.customEvL2,
        dcfcCount: state.customEvDcfc,
        ultraFastCount: state.customEvUltraFast,
      },
      bess: {
        // ✅ FIXED: Read from nested structure (calculations.selected.*)
        customPowerKw: state.calculations?.selected?.bessKW,
        customEnergyKwh: state.calculations?.selected?.bessKWh,
      },
    },

    // Metadata
    requestId: `MR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    requestedAt: new Date().toISOString(),
    version: '1.0',
  });
}

/**
 * Normalize goals array to valid EnergyGoal types
 */
function normalizeGoals(goals: string[] | undefined): EnergyGoal[] {
  const validGoals: EnergyGoal[] = [
    'reduce_costs',
    'backup_power',
    'sustainability',
    'grid_independence',
    'peak_shaving',
    'generate_revenue',
  ];
  
  if (!goals || goals.length === 0) {
    // Default goals if none selected
    return ['reduce_costs', 'backup_power', 'sustainability'];
  }
  
  return goals.filter((g): g is EnergyGoal => validGoals.includes(g as EnergyGoal));
}

// ============================================================================
// LEGACY MAPPER - For backward compatibility during migration
// ============================================================================

// Industry slug normalization (old format with dashes)
const industryTypeMapLegacy: Record<string, string> = {
  'data_center': 'data-center',
  'data-center': 'data-center',
  'ev_charging': 'ev-charging',
  'ev-charging': 'ev-charging',
  'car_wash': 'car-wash',
  'car-wash': 'car-wash',
  'hotel': 'hotel',
  'hospital': 'hospital',
  'manufacturing': 'manufacturing',
  'retail': 'retail',
  'restaurant': 'restaurant',
  'office': 'office',
  'college': 'university',
  'university': 'university',
  'agriculture': 'agriculture',
  'warehouse': 'warehouse',
  'casino': 'casino',
  'apartment': 'apartment',
  'apartments': 'apartment',
  'apartment-building': 'apartment',
  'cold-storage': 'cold-storage',
  'cold_storage': 'cold-storage',
  'shopping-center': 'shopping-center',
  'shopping-mall': 'shopping-center',
  'shopping_mall': 'shopping-center',
  'indoor-farm': 'indoor-farm',
  'indoor_farm': 'indoor-farm',
  'government': 'government',
  'public-building': 'government',
};

/**
 * Get subtype field name for an industry (legacy)
 */
function getSubtypeFieldName(industry: string): string {
  const fieldMap: Record<string, string> = {
    'data-center': 'dataCenterTier',
    'hospital': 'hospitalType',
    'hotel': 'hotelCategory',
    'ev-charging': 'hubType',
    'car-wash': 'carWashType',
    'manufacturing': 'manufacturingType',
    'retail': 'retailType',
    'restaurant': 'restaurantType',
    'office': 'officeType',
    'university': 'institutionType',
    'shopping-center': 'propertyType',
    'apartment': 'propertyType',
    'government': 'facilityType',
    'warehouse': 'warehouseType',
    'casino': 'casinoType',
    'agriculture': 'farmType',
    'indoor-farm': 'farmType',
    'cold-storage': 'facilityType',
  };
  return fieldMap[industry] || 'type';
}

/**
 * LEGACY: Map WizardState to old TrueQuoteInput format
 * @deprecated Use mapWizardStateToMerlinRequest instead
 */
export function mapWizardStateToTrueQuoteInput(state: WizardState): TrueQuoteInput {
  // Normalize industry slug
  const industryType = industryTypeMapLegacy[state.industry] || state.industry;
  
  // Extract subtype using configuration
  const subtypeFieldName = getSubtypeFieldName(industryType);
  const useCaseInputs = state.useCaseData?.inputs as Record<string, unknown> | undefined;
  const dbSubtypeValue = useCaseInputs?.[subtypeFieldName] || 
                         state.facilityDetails?.[subtypeFieldName as keyof typeof state.facilityDetails];
  
  // Map database value to TrueQuote format (ensure string)
  const mappedSubtype = (typeof dbSubtypeValue === 'string' && dbSubtypeValue)
    ? mapSubtype(industryType, dbSubtypeValue)
    : DEFAULT_SUBTYPES[industryType] || 'standard';

  // Build facility data from useCaseData.inputs
  const facilityData: Record<string, number | string | boolean> = {};
  
  if (state.useCaseData?.inputs) {
    Object.entries(state.useCaseData.inputs).forEach(([key, value]) => {
      const mappedKey = mapFieldName(industryType, key);
      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
        facilityData[mappedKey] = value;
      }
    });
  }

  // Also include facilityDetails if present
  if (state.facilityDetails) {
    Object.entries(state.facilityDetails).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !facilityData[key]) {
        facilityData[key] = value as number | string | boolean;
      }
    });
  }

  return {
    location: {
      zipCode: state.zipCode,
      state: state.state,
    },
    industry: {
      type: industryType,
      subtype: mappedSubtype,
      facilityData,
    },
    options: {
      solarEnabled: state.selectedOptions?.includes('solar') || false,
      evChargingEnabled: state.selectedOptions?.includes('ev') || false,
      generatorEnabled: state.selectedOptions?.includes('generator') || false,
      level2Chargers: state.customEvL2,
      dcFastChargers: state.customEvDcfc,
      ultraFastChargers: state.customEvUltraFast,
    },
  };
}
