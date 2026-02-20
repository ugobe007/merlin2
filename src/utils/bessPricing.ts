/**
 * @deprecated This file is a stub for legacy code compatibility.
 * New code should use unifiedPricingService.ts instead.
 *
 * This file will be removed once all legacy imports are updated.
 */

/**
 * @deprecated Use unifiedPricingService.getBatteryPricing() instead
 */
export function calculateRealWorldPrice(): number {
  // Stub: Return a reasonable default price per kWh
  return 300; // $300/kWh as fallback
}

/**
 * @deprecated Use unifiedPricingService.getBatteryPricing() instead
 */
export function calculateBESSPricing(
  powerMW: number,
  standbyHours: number,
  _country: string,
  _includeInstallation: boolean
): {
  contractAveragePerKWh: number;
  [key: string]: any;
} {
  // Stub: Return a reasonable default structure
  return {
    contractAveragePerKWh: 300, // $300/kWh as fallback
    totalCost: powerMW * standbyHours * 1000 * 300,
  };
}

/**
 * @deprecated Use unifiedPricingService.getBatteryPricing() instead
 */
export function calculateSystemCost(
  powerMW: number,
  standbyHours: number,
  _country: string,
  _includeInstallation: boolean,
  _useCase: string
): {
  capacityMWh: number;
  actualDuration: number;
  [key: string]: any;
} {
  // Stub: Return a reasonable default structure
  const capacityMWh = powerMW * standbyHours;
  return {
    capacityMWh,
    actualDuration: standbyHours,
    totalCost: capacityMWh * 1000 * 300, // Rough estimate
  };
}
