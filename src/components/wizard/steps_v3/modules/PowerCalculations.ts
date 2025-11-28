/**
 * Power Calculations Module
 * Centralized power calculations for renewable energy sizing
 */

export interface PowerStatus {
  peakDemandMW: number;
  gridAvailableMW: number;
  effectiveRequirementMW: number;
  totalBatteryMW: number;
  totalGenerationMW: number;
  totalConfiguredMW: number;
  powerGapMW: number;
  powerSurplusMW: number;
  needsGeneration: boolean;
  isSufficient: boolean;
  gridConnection: string;
  recommendedGenerationMW?: number; // Optional - from baseline service
  recommendationReason?: string; // Optional - from baseline service
  isAdequate?: boolean; // Optional - legacy field
}

export interface PowerCalculationInput {
  peakDemandMW: number;
  gridAvailableMW: number;
  gridConnection: string;
  storageSizeMW: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
}

/**
 * Calculate comprehensive power status
 */
export function calculatePowerStatus(input: PowerCalculationInput): PowerStatus {
  const {
    peakDemandMW,
    gridAvailableMW,
    gridConnection,
    storageSizeMW,
    solarMW,
    windMW,
    generatorMW
  } = input;

  // Total generation from renewables and generators
  const totalGenerationMW = solarMW + windMW + generatorMW;
  
  // Total configured power (battery + generation)
  const totalConfiguredMW = storageSizeMW + totalGenerationMW;
  
  // Effective requirement depends on grid connection
  let effectiveRequirementMW = peakDemandMW;
  
  if (gridConnection === 'reliable' && gridAvailableMW > 0) {
    // Grid can cover some demand
    effectiveRequirementMW = Math.max(0, peakDemandMW - gridAvailableMW);
  } else if (gridConnection === 'off-grid') {
    // Must cover full demand
    effectiveRequirementMW = peakDemandMW;
  }
  
  // Power gap/surplus calculation
  const powerGapMW = Math.max(0, effectiveRequirementMW - totalConfiguredMW);
  const powerSurplusMW = Math.max(0, totalConfiguredMW - effectiveRequirementMW);
  
  // Determine if generation is needed
  const needsGeneration = powerGapMW > 0;
  const isSufficient = powerGapMW === 0;

  return {
    peakDemandMW,
    gridAvailableMW,
    effectiveRequirementMW,
    totalBatteryMW: storageSizeMW,
    totalGenerationMW,
    totalConfiguredMW,
    powerGapMW,
    powerSurplusMW,
    needsGeneration,
    isSufficient,
    gridConnection
  };
}

/**
 * Format power value in MW with appropriate precision
 */
export function formatPowerMW(valueMW: number): string {
  if (valueMW >= 10) {
    return `${valueMW.toFixed(1)} MW`;
  } else if (valueMW >= 1) {
    return `${valueMW.toFixed(2)} MW`;
  } else {
    return `${(valueMW * 1000).toFixed(0)} kW`;
  }
}

/**
 * Get human-readable power status message
 */
export function getPowerStatusMessage(status: PowerStatus): {
  type: 'success' | 'warning' | 'error';
  message: string;
} {
  if (status.isSufficient && status.powerSurplusMW > 0) {
    return {
      type: 'success',
      message: `System has ${formatPowerMW(status.powerSurplusMW)} surplus capacity`
    };
  } else if (status.isSufficient) {
    return {
      type: 'success',
      message: 'System meets power requirements'
    };
  } else if (status.powerGapMW > 0 && status.powerGapMW < 0.5) {
    return {
      type: 'warning',
      message: `Minor power gap: ${formatPowerMW(status.powerGapMW)} additional needed`
    };
  } else if (status.powerGapMW > 0) {
    return {
      type: 'error',
      message: `Power gap: ${formatPowerMW(status.powerGapMW)} additional capacity needed`
    };
  }

  return {
    type: 'success',
    message: 'Power status calculated'
  };
}
