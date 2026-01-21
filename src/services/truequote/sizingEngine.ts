/**
 * TrueQuote™ Sizing Engine
 * ========================
 * Computes recommended BESS sizing based on progressive model inputs.
 * 
 * This is the core algorithm that turns micro-prompt answers into
 * principled system recommendations with confidence-aware bands.
 * 
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

import type { EnergyGoal } from '@/components/wizard/v6/types';

// ============================================================================
// TYPES
// ============================================================================

export interface TrueQuoteSizing {
  recommended: {
    powerKW: { min: number; max: number; best: number };
    energyKWh: { min: number; max: number; best: number };
    durationHours: { best: number };
  };
  goalsBreakdown: {
    peakShavingValue: number;     // 0-1 normalized
    backupCoverageHours: number;  // Hours of critical load coverage
    touArbitrageValue: number;    // 0-1 normalized (future)
  };
  constraints: {
    gridCapacityKW?: number;
    peakDemandKW?: number;
    demandChargeBand?: string;
    generatorCapacityKW?: number;
    targetCapKW?: number;         // Calculated peak cap for shaving
  };
  confidence: number;             // 0-100
  notes: string[];                // Explanations for "Merlin learned"
}

export interface SizingOverrides {
  powerMW?: number;
  energyMWh?: number;
  durationHours?: number;
  peakKW?: number;
  avgKW?: number;
  dailyKWh?: number;
}

export interface SizingInputs {
  // From Progressive Model
  gridCapacityKW?: number;
  peakDemandKW?: number;         // From estimatedPowerMetrics
  avgDemandKW?: number;
  annualKWh?: number;
  demandChargeBand?: string;
  hvacMultiplier?: number;
  generatorCapacityKW?: number;
  hasBackupGenerator?: 'yes' | 'no' | 'planned';
  
  // From WizardState
  goals?: EnergyGoal[];
  industry?: string;
  confidence: number;             // 0-100 from ModelConfidence
  
  // User overrides
  overrides?: SizingOverrides;
}

// ============================================================================
// INDUSTRY CONFIGURATIONS (SSOT)
// ============================================================================

/** Critical load factors by industry (what % of peak MUST be covered for backup) */
const CRITICAL_LOAD_FACTORS: Record<string, number> = {
  hospital: 0.75,
  'data-center': 0.85,
  'data_center': 0.85,
  cold_storage: 0.70,
  'cold-storage': 0.70,
  casino: 0.55,
  airport: 0.60,
  manufacturing: 0.50,
  hotel: 0.40,
  retail: 0.35,
  office: 0.35,
  'car-wash': 0.30,
  'ev-charging': 0.45,
  warehouse: 0.30,
  restaurant: 0.40,
  default: 0.35,
};

/** Duration recommendations by goal + industry */
const DURATION_DEFAULTS: Record<string, number> = {
  // Peak shaving only
  'peak_shaving:default': 1.5,
  'peak_shaving:hospital': 2.0,
  'peak_shaving:data-center': 2.0,
  'peak_shaving:manufacturing': 2.0,
  
  // Backup power
  'backup:default': 4.0,
  'backup:hospital': 6.0,
  'backup:data-center': 4.0,
  'backup:cold-storage': 6.0,
  'backup:casino': 4.0,
  'backup:hotel': 4.0,
  
  // Combined (peak shaving + backup)
  'combined:default': 3.0,
  'combined:hospital': 4.0,
  'combined:data-center': 3.0,
  
  // Defaults
  'default': 2.0,
};

/** Minimum power recommendations by industry (kW) */
const MIN_POWER_KW: Record<string, number> = {
  hospital: 100,
  'data-center': 200,
  casino: 150,
  airport: 200,
  manufacturing: 100,
  hotel: 50,
  office: 30,
  retail: 25,
  'car-wash': 25,
  'ev-charging': 50,
  warehouse: 50,
  default: 25,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get confidence-based band expansion multiplier
 * Lower confidence = wider bands
 */
function getBandExpansion(confidence: number): number {
  if (confidence >= 75) return 0.10;    // ±10%
  if (confidence >= 60) return 0.15;    // ±15%
  if (confidence >= 45) return 0.20;    // ±20%
  return 0.25;                          // ±25%
}

/**
 * Normalize industry string for lookups
 */
function normalizeIndustry(industry?: string): string {
  if (!industry) return 'default';
  return industry.toLowerCase().replace(/[_\s]/g, '-');
}

/**
 * Get critical load factor for industry
 */
function getCriticalLoadFactor(industry?: string): number {
  const normalized = normalizeIndustry(industry);
  return CRITICAL_LOAD_FACTORS[normalized] ?? CRITICAL_LOAD_FACTORS.default;
}

/**
 * Get minimum power for industry
 */
function getMinPower(industry?: string): number {
  const normalized = normalizeIndustry(industry);
  return MIN_POWER_KW[normalized] ?? MIN_POWER_KW.default;
}

/**
 * Calculate optimal duration based on goals and industry
 */
function calculateDuration(
  goals: EnergyGoal[],
  industry?: string,
  hasGenerator?: 'yes' | 'no' | 'planned'
): number {
  const normalized = normalizeIndustry(industry);
  const hasBackupGoal = goals.includes('backup_power');
  const hasPeakShaving = goals.includes('reduce_costs') || goals.includes('peak_shaving');
  
  // Determine goal type
  let goalType: string;
  if (hasBackupGoal && hasPeakShaving) {
    goalType = 'combined';
  } else if (hasBackupGoal) {
    goalType = 'backup';
  } else {
    goalType = 'peak_shaving';
  }
  
  // Look up duration
  const key = `${goalType}:${normalized}`;
  const defaultKey = `${goalType}:default`;
  
  let duration = DURATION_DEFAULTS[key] ?? DURATION_DEFAULTS[defaultKey] ?? DURATION_DEFAULTS.default;
  
  // If generator exists, can reduce backup duration slightly
  if (hasGenerator === 'yes' && hasBackupGoal) {
    duration = Math.max(duration * 0.75, 2.0);
  }
  
  return duration;
}

// ============================================================================
// MAIN SIZING ENGINE
// ============================================================================

/**
 * Compute TrueQuote sizing from progressive model inputs
 * 
 * This is the SSOT for all system sizing recommendations.
 * Returns power/energy bands that tighten as confidence increases.
 */
export function computeTrueQuoteSizing(inputs: SizingInputs): TrueQuoteSizing {
  const {
    gridCapacityKW,
    peakDemandKW,
    avgDemandKW,
    annualKWh,
    demandChargeBand,
    hvacMultiplier = 1.0,
    generatorCapacityKW,
    hasBackupGenerator,
    goals = [],
    industry,
    confidence,
    overrides,
  } = inputs;
  
  const notes: string[] = [];
  
  // -------------------------------------------------------------------------
  // 1. DETERMINE PEAK DEMAND (with HVAC adjustment)
  // -------------------------------------------------------------------------
  let effectivePeakKW = peakDemandKW ?? 0;
  
  // Apply HVAC multiplier
  if (hvacMultiplier !== 1.0 && effectivePeakKW > 0) {
    const adjustment = (hvacMultiplier - 1.0) * 100;
    effectivePeakKW *= hvacMultiplier;
    notes.push(`HVAC load ${adjustment > 0 ? '+' : ''}${adjustment.toFixed(0)}% applied.`);
  }
  
  // Use override if provided
  if (overrides?.peakKW && overrides.peakKW > 0) {
    effectivePeakKW = overrides.peakKW;
    notes.push(`User specified peak: ${effectivePeakKW.toFixed(0)} kW.`);
  }
  
  // Fallback if still zero
  if (effectivePeakKW <= 0 && annualKWh) {
    // Rough estimate: annual kWh / 8760 hours / 0.4 load factor
    effectivePeakKW = annualKWh / 8760 / 0.4;
    notes.push('Peak estimated from annual consumption.');
  }
  
  // -------------------------------------------------------------------------
  // 2. CALCULATE TARGET PEAK CAP (for peak shaving)
  // -------------------------------------------------------------------------
  let targetCapKW: number | undefined;
  let headroomFactor = 0.85; // Default headroom
  
  if (gridCapacityKW && gridCapacityKW > 0) {
    // If grid capacity is "limited" relative to peak, use tighter headroom
    if (gridCapacityKW < effectivePeakKW * 1.2) {
      headroomFactor = 0.75;
      notes.push('Grid headroom limited → sizing emphasizes peak shaving.');
    }
    targetCapKW = gridCapacityKW * headroomFactor;
  } else if (effectivePeakKW > 0) {
    // Without grid data, target 80% of peak
    targetCapKW = effectivePeakKW * 0.80;
  }
  
  // -------------------------------------------------------------------------
  // 3. CALCULATE BESS POWER RECOMMENDATION
  // -------------------------------------------------------------------------
  const hasBackupGoal = goals.includes('backup_power');
  const criticalLoadFactor = getCriticalLoadFactor(industry);
  const minPowerKW = getMinPower(industry);
  
  let powerKW_best = 0;
  
  // Peak shaving power: portion of peak above cap
  if (targetCapKW && effectivePeakKW > targetCapKW) {
    powerKW_best = effectivePeakKW - targetCapKW;
  }
  
  // Backup power: ensure critical load coverage
  if (hasBackupGoal && effectivePeakKW > 0) {
    const criticalLoadKW = effectivePeakKW * criticalLoadFactor;
    powerKW_best = Math.max(powerKW_best, criticalLoadKW);
    notes.push(`Backup goal → ${(criticalLoadFactor * 100).toFixed(0)}% critical load coverage.`);
  }
  
  // Ensure minimum power for industry
  powerKW_best = Math.max(powerKW_best, minPowerKW);
  
  // Apply user override
  if (overrides?.powerMW && overrides.powerMW > 0) {
    powerKW_best = overrides.powerMW * 1000;
    notes.push(`User override: ${overrides.powerMW.toFixed(2)} MW power.`);
  }
  
  // Demand charge impact note
  if (demandChargeBand && demandChargeBand !== 'not-sure') {
    if (demandChargeBand === '20-plus') {
      notes.push('High demand charges → strong peak shaving ROI.');
    } else if (demandChargeBand === '10-20') {
      notes.push('Moderate demand charges → solid peak shaving value.');
    }
  }
  
  // -------------------------------------------------------------------------
  // 4. CALCULATE DURATION
  // -------------------------------------------------------------------------
  let durationHours_best = calculateDuration(goals, industry, hasBackupGenerator);
  
  // Apply user override
  if (overrides?.durationHours && overrides.durationHours > 0) {
    durationHours_best = overrides.durationHours;
  }
  
  // Generator integration
  if (hasBackupGenerator === 'yes' && generatorCapacityKW && generatorCapacityKW > 0) {
    notes.push(`Generator (${generatorCapacityKW} kW) → optimized for ride-through + peak.`);
  }
  
  // -------------------------------------------------------------------------
  // 5. CALCULATE ENERGY CAPACITY
  // -------------------------------------------------------------------------
  let energyKWh_best = powerKW_best * durationHours_best;
  
  // Apply user override
  if (overrides?.energyMWh && overrides.energyMWh > 0) {
    energyKWh_best = overrides.energyMWh * 1000;
  }
  
  // -------------------------------------------------------------------------
  // 6. CALCULATE MIN/MAX BANDS (confidence-based)
  // -------------------------------------------------------------------------
  const bandExpansion = getBandExpansion(confidence);
  
  const powerKW_min = Math.max(minPowerKW, powerKW_best * (1 - bandExpansion));
  const powerKW_max = powerKW_best * (1 + bandExpansion);
  
  const energyKWh_min = powerKW_min * durationHours_best;
  const energyKWh_max = powerKW_max * durationHours_best;
  
  // -------------------------------------------------------------------------
  // 7. CALCULATE GOALS BREAKDOWN
  // -------------------------------------------------------------------------
  const peakShavingValue = (targetCapKW && effectivePeakKW > targetCapKW) 
    ? Math.min(1, (effectivePeakKW - targetCapKW) / effectivePeakKW)
    : 0;
  
  const backupCoverageHours = hasBackupGoal 
    ? (powerKW_best >= effectivePeakKW * criticalLoadFactor ? durationHours_best : 0)
    : 0;
  
  // -------------------------------------------------------------------------
  // 8. BUILD OUTPUT
  // -------------------------------------------------------------------------
  return {
    recommended: {
      powerKW: {
        min: Math.round(powerKW_min),
        max: Math.round(powerKW_max),
        best: Math.round(powerKW_best),
      },
      energyKWh: {
        min: Math.round(energyKWh_min),
        max: Math.round(energyKWh_max),
        best: Math.round(energyKWh_best),
      },
      durationHours: {
        best: Math.round(durationHours_best * 10) / 10,
      },
    },
    goalsBreakdown: {
      peakShavingValue,
      backupCoverageHours,
      touArbitrageValue: 0, // Future implementation
    },
    constraints: {
      gridCapacityKW,
      peakDemandKW: effectivePeakKW > 0 ? Math.round(effectivePeakKW) : undefined,
      demandChargeBand,
      generatorCapacityKW,
      targetCapKW: targetCapKW ? Math.round(targetCapKW) : undefined,
    },
    confidence,
    notes,
  };
}

/**
 * Get sizing band width description for UI
 */
export function getSizingBandDescription(confidence: number): string {
  if (confidence >= 75) return 'High confidence';
  if (confidence >= 60) return 'Good confidence';
  if (confidence >= 45) return 'Moderate confidence';
  return 'Low confidence';
}

/**
 * Check if sizing should show "est." suffix
 */
export function shouldShowEstimate(confidence: number): boolean {
  return confidence < 75;
}
