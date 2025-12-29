/**
 * Utility functions for formatting power values
 */

/**
 * Format power value with appropriate unit (kW or MW)
 * @param powerMW - Power value in MW
 * @param decimals - Number of decimal places for MW values (default: 2)
 * @returns Formatted string like "450 kW" or "1.25 MW"
 */
export function formatPower(powerMW: number, decimals: number = 2): string {
  if (powerMW < 1) {
    // Convert to kW and show as integer for cleaner display
    const powerKW = Math.round(powerMW * 1000);
    return `${powerKW} kW`;
  } else {
    // Show as MW with specified decimal places
    return `${powerMW.toFixed(decimals)} MW`;
  }
}

/**
 * Format energy value with appropriate unit (kWh or MWh)
 * @param energyMWh - Energy value in MWh
 * @param decimals - Number of decimal places for MWh values (default: 2)
 * @returns Formatted string like "750 kWh" or "1.25 MWh"
 */
export function formatEnergy(energyMWh: number, decimals: number = 2): string {
  if (energyMWh < 1) {
    // Convert to kWh and show as integer for cleaner display
    const energyKWh = Math.round(energyMWh * 1000);
    return `${energyKWh} kWh`;
  } else {
    // Show as MWh with specified decimal places
    return `${energyMWh.toFixed(decimals)} MWh`;
  }
}

/**
 * Format power value for configuration strings (e.g., "0.45MW" or "450kW")
 * Used in AI recommendations and configuration displays
 * @param powerMW - Power value in MW
 * @returns Formatted string like "450kW" or "1.25MW" (no spaces)
 */
export function formatPowerCompact(powerMW: number, decimals: number = 2): string {
  if (powerMW < 1) {
    const powerKW = Math.round(powerMW * 1000);
    return `${powerKW}kW`;
  } else {
    return `${powerMW.toFixed(decimals)}MW`;
  }
}
