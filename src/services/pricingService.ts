/**
 * ⚠️ DEPRECATED - DO NOT USE FOR NEW CODE
 * 
 * This file uses legacy Malaysian Ringgit (RM) pricing which conflicts
 * with the USD-based unified pricing system.
 * 
 * USE INSTEAD:
 *   → unifiedPricingService.ts - getBatteryPricing(), getInverterPricing()
 *   → equipmentCalculations.ts - calculateEquipmentBreakdown()
 *   → centralizedCalculations.ts - calculateFinancialMetrics()
 *   → unifiedQuoteCalculator.ts - calculateQuote() ← SINGLE ENTRY POINT
 * 
 * This file will be removed in a future release.
 * 
 * @deprecated Use unifiedPricingService.ts for all equipment pricing
 */

import { 
  calculateBESSSizing, 
  STANDARD_BATTERY_MODELS,
  STANDARD_PCS_MODELS,
  STANDARD_TRANSFORMER_MODELS,
  type BESSSizingResult,
  type BatteryModel,
  type PCSModel,
  type TransformerModel
} from '@/core/calculations/sizing';

// ============================================================================
// PRICING CONSTANTS (Malaysia - RM)
// ============================================================================

export interface PricingConstants {
  battery: {
    pricePerKWh: {
      small: number;      // < 1 MWh
      medium: number;     // 1-5 MWh
      large: number;      // > 5 MWh
    };
    installation: number; // % of equipment cost
  };
  pcs: {
    pricePerKW: {
      small: number;      // < 500 kW
      medium: number;     // 500 kW - 2 MW
      large: number;      // > 2 MW
    };
  };
  transformer: {
    pricePerKVA: number;
  };
  solar: {
    pricePerKW: number;   // RM per kW installed
    installation: number; // % of equipment cost
  };
  installation: {
    basePercentage: number;      // % of total equipment cost
    complexityMultiplier: {
      simple: number;            // 1.0x
      moderate: number;          // 1.2x
      complex: number;           // 1.5x
    };
  };
  margin: {
    standard: number;            // 20%
    enterprise: number;          // 15% (volume discount)
    government: number;          // 12% (government projects)
  };
  operations: {
    annualMaintenancePercent: number; // % of total system cost
    warrantyYears: number;
  };
}

export const PRICING: PricingConstants = {
  battery: {
    pricePerKWh: {
      small: 1200,   // RM 1200/kWh for < 1 MWh
      medium: 1000,  // RM 1000/kWh for 1-5 MWh
      large: 800     // RM 800/kWh for > 5 MWh
    },
    installation: 0.15 // 15% of battery cost
  },
  pcs: {
    pricePerKW: {
      small: 300,    // RM 300/kW for < 500 kW
      medium: 250,   // RM 250/kW for 500 kW - 2 MW
      large: 200     // RM 200/kW for > 2 MW
    }
  },
  transformer: {
    pricePerKVA: 200 // RM 200/kVA
  },
  solar: {
    pricePerKW: 3500,  // RM 3500/kW installed (panels + inverters + mounting)
    installation: 0.10 // 10% of solar equipment cost
  },
  installation: {
    basePercentage: 0.18, // 18% of equipment cost
    complexityMultiplier: {
      simple: 1.0,
      moderate: 1.2,
      complex: 1.5
    }
  },
  margin: {
    standard: 0.20,      // 20%
    enterprise: 0.15,    // 15%
    government: 0.12     // 12%
  },
  operations: {
    annualMaintenancePercent: 0.02, // 2% per year
    warrantyYears: 10
  }
};

// ============================================================================
// PRICING RESULT INTERFACES
// ============================================================================

export interface EquipmentCosts {
  battery: {
    capacityMWh: number;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    model: string;
  };
  pcs: {
    capacityMW: number;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    model: string;
  };
  transformer: {
    capacityMVA: number;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    model: string;
  };
  solar?: {
    capacityKW: number;
    unitPrice: number;
    subtotal: number;
  };
  total: number;
}

export interface InstallationCosts {
  equipment: number;
  labor: number;
  complexity: string;
  complexityMultiplier: number;
  total: number;
}

export interface ProjectCosts {
  equipment: EquipmentCosts;
  installation: InstallationCosts;
  subtotal: number;
  margin: number;
  marginPercent: number;
  grandTotal: number;
  operations: {
    annualMaintenance: number;
    warrantyYears: number;
  };
}

export interface PricingBreakdown extends ProjectCosts {
  // Grid-Synk technical details
  gridSynk: {
    requiredBatteryCapacityMWh: number;
    usableBatteryCapacityMWh: number;
    cRateValidation: boolean;
    maxChargePowerMW: number;
    fullChargeTimeHours: number;
  };
  // Cost per unit metrics
  metrics: {
    costPerMWh: number;      // RM per MWh of battery capacity
    costPerMW: number;       // RM per MW of power capacity
    costPerKW: number;       // RM per kW (for customer reference)
  };
}

// ============================================================================
// PRICING CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate complete BESS pricing using Grid-Synk industry standards
 * 
 * This is the main pricing function - all pricing flows through here.
 * 
 * @param powerMW - Required discharge power (MW)
 * @param durationHrs - Required discharge duration (hours)
 * @param solarKW - Optional solar capacity (kW)
 * @param options - Pricing options (margin type, complexity)
 */
export function calculateBESSPricing(
  powerMW: number,
  durationHrs: number,
  solarKW: number = 0,
  options?: {
    marginType?: 'standard' | 'enterprise' | 'government';
    complexity?: 'simple' | 'moderate' | 'complex';
    dod?: number;
    staticEfficiency?: number;
    cycleEfficiency?: number;
    cRate?: number;
  }
): PricingBreakdown {
  
  // Step 1: Calculate BESS sizing using Grid-Synk formulas
  const gridSynkResult = calculateBESSSizing({
    customerLoadMW: powerMW,
    durationHours: durationHrs,
    customerCRate: options?.cRate,
    dod: options?.dod,
    staticEfficiency: options?.staticEfficiency,
    cycleEfficiency: options?.cycleEfficiency
  });

  // Step 2: Calculate equipment costs
  const equipmentCosts = calculateEquipmentCosts(gridSynkResult, solarKW);

  // Step 3: Calculate installation costs
  const complexityType = options?.complexity || 'moderate';
  const installationCosts = calculateInstallationCosts(
    equipmentCosts.total,
    complexityType
  );

  // Step 4: Calculate subtotal
  const subtotal = equipmentCosts.total + installationCosts.total;

  // Step 5: Apply margin
  const marginType = options?.marginType || 'standard';
  const marginPercent = PRICING.margin[marginType];
  const marginAmount = subtotal * marginPercent;

  // Step 6: Calculate grand total
  const grandTotal = subtotal + marginAmount;

  // Step 7: Calculate operations costs
  const annualMaintenance = grandTotal * PRICING.operations.annualMaintenancePercent;

  // Step 8: Calculate metrics
  const metrics = {
    costPerMWh: grandTotal / gridSynkResult.requiredBatteryCapacityMWh,
    costPerMW: grandTotal / powerMW,
    costPerKW: (grandTotal / powerMW) / 1000
  };

  return {
    equipment: equipmentCosts,
    installation: installationCosts,
    subtotal,
    margin: marginAmount,
    marginPercent: marginPercent * 100,
    grandTotal,
    operations: {
      annualMaintenance,
      warrantyYears: PRICING.operations.warrantyYears
    },
    gridSynk: {
      requiredBatteryCapacityMWh: gridSynkResult.requiredBatteryCapacityMWh,
      usableBatteryCapacityMWh: gridSynkResult.usableBatteryCapacityMWh,
      cRateValidation: gridSynkResult.cRateSufficient,
      maxChargePowerMW: gridSynkResult.maxChargePowerMW,
      fullChargeTimeHours: gridSynkResult.fullChargeTimeHours
    },
    metrics
  };
}

/**
 * Calculate equipment costs based on Grid-Synk sizing
 */
function calculateEquipmentCosts(
  gridSynkResult: BESSSizingResult,
  solarKW: number = 0
): EquipmentCosts {
  
  // Battery costs (tiered pricing based on capacity)
  const batteryCapacityMWh = gridSynkResult.requiredBatteryCapacityMWh;
  const batteryCapacityKWh = batteryCapacityMWh * 1000;
  
  let batteryPricePerKWh: number;
  if (batteryCapacityMWh < 1) {
    batteryPricePerKWh = PRICING.battery.pricePerKWh.small;
  } else if (batteryCapacityMWh <= 5) {
    batteryPricePerKWh = PRICING.battery.pricePerKWh.medium;
  } else {
    batteryPricePerKWh = PRICING.battery.pricePerKWh.large;
  }
  
  const batteryModel = gridSynkResult.recommendedBatteryModels[0];
  const batteryCost = batteryCapacityKWh * batteryPricePerKWh;

  // PCS costs (tiered pricing based on power)
  const pcsModel = gridSynkResult.recommendedPCS;
  const pcsPowerMW = pcsModel.totalPowerMW;
  const pcsPowerKW = pcsPowerMW * 1000;
  
  let pcsPricePerKW: number;
  if (pcsPowerKW < 500) {
    pcsPricePerKW = PRICING.pcs.pricePerKW.small;
  } else if (pcsPowerKW <= 2000) {
    pcsPricePerKW = PRICING.pcs.pricePerKW.medium;
  } else {
    pcsPricePerKW = PRICING.pcs.pricePerKW.large;
  }
  
  const pcsCost = pcsPowerKW * pcsPricePerKW;

  // Transformer costs
  const transformerModel = gridSynkResult.recommendedTransformer;
  const transformerMVA = transformerModel.totalPowerMVA;
  const transformerKVA = transformerMVA * 1000;
  const transformerCost = transformerKVA * PRICING.transformer.pricePerKVA;

  // Solar costs (if applicable)
  let solarCost = 0;
  if (solarKW > 0) {
    solarCost = solarKW * PRICING.solar.pricePerKW;
  }

  // Total equipment cost
  const totalEquipment = batteryCost + pcsCost + transformerCost + solarCost;

  return {
    battery: {
      capacityMWh: batteryCapacityMWh,
      unitPrice: batteryPricePerKWh,
      quantity: batteryModel.quantity,
      subtotal: batteryCost,
      model: `${batteryModel.quantity}x ${batteryModel.model}`
    },
    pcs: {
      capacityMW: pcsPowerMW,
      unitPrice: pcsPricePerKW,
      quantity: pcsModel.quantity,
      subtotal: pcsCost,
      model: `${pcsModel.quantity}x ${pcsModel.model}`
    },
    transformer: {
      capacityMVA: transformerMVA,
      unitPrice: PRICING.transformer.pricePerKVA,
      quantity: transformerModel.quantity,
      subtotal: transformerCost,
      model: `${transformerModel.quantity}x ${transformerModel.model}`
    },
    solar: solarKW > 0 ? {
      capacityKW: solarKW,
      unitPrice: PRICING.solar.pricePerKW,
      subtotal: solarCost
    } : undefined,
    total: totalEquipment
  };
}

/**
 * Calculate installation costs based on complexity
 */
function calculateInstallationCosts(
  equipmentTotal: number,
  complexity: 'simple' | 'moderate' | 'complex'
): InstallationCosts {
  
  const baseInstallation = equipmentTotal * PRICING.installation.basePercentage;
  const complexityMultiplier = PRICING.installation.complexityMultiplier[complexity];
  const adjustedInstallation = baseInstallation * complexityMultiplier;

  // Split into equipment (30%) and labor (70%)
  const equipmentCost = adjustedInstallation * 0.3;
  const laborCost = adjustedInstallation * 0.7;

  return {
    equipment: equipmentCost,
    labor: laborCost,
    complexity,
    complexityMultiplier,
    total: adjustedInstallation
  };
}

/**
 * Format pricing for display (convert to thousands/millions)
 */
export function formatPricing(pricing: PricingBreakdown): {
  equipment: string;
  installation: string;
  subtotal: string;
  margin: string;
  grandTotal: string;
  annualMaintenance: string;
} {
  const format = (value: number): string => {
    if (value >= 1000000) {
      return `RM ${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `RM ${(value / 1000).toFixed(0)}K`;
    } else {
      return `RM ${value.toFixed(0)}`;
    }
  };

  return {
    equipment: format(pricing.equipment.total),
    installation: format(pricing.installation.total),
    subtotal: format(pricing.subtotal),
    margin: format(pricing.margin),
    grandTotal: format(pricing.grandTotal),
    annualMaintenance: format(pricing.operations.annualMaintenance)
  };
}

/**
 * Calculate ROI and payback period
 * 
 * @param systemCost - Total system cost (RM)
 * @param annualSavings - Annual electricity savings (RM)
 * @param incentives - Government incentives (RM)
 */
export function calculateROI(
  systemCost: number,
  annualSavings: number,
  incentives: number = 0
): {
  netCost: number;
  paybackYears: number;
  roi10Year: number;
  roi20Year: number;
  annualROI: number;
} {
  const netCost = systemCost - incentives;
  const paybackYears = netCost / annualSavings;
  
  // Simple ROI calculation (doesn't account for time value of money)
  const totalSavings10Year = annualSavings * 10;
  const totalSavings20Year = annualSavings * 20;
  
  const roi10Year = ((totalSavings10Year - netCost) / netCost) * 100;
  const roi20Year = ((totalSavings20Year - netCost) / netCost) * 100;
  const annualROI = (annualSavings / netCost) * 100;

  return {
    netCost,
    paybackYears,
    roi10Year,
    roi20Year,
    annualROI
  };
}

/**
 * Quick pricing estimate (simplified version for UI)
 */
export function quickPriceEstimate(
  powerMW: number,
  durationHrs: number
): {
  estimatedCost: number;
  costRange: { low: number; high: number };
  formattedEstimate: string;
} {
  // Use median pricing
  const batteryCapacityMWh = (powerMW * durationHrs) / (0.9 * 0.9 * 0.95); // Grid-Synk efficiency
  const avgBatteryPrice = 1000; // RM 1000/kWh median
  const avgPCSPrice = 250000; // RM 250k/MW median
  
  const batteryCost = batteryCapacityMWh * 1000 * avgBatteryPrice;
  const pcsCost = powerMW * avgPCSPrice;
  const equipmentCost = batteryCost + pcsCost;
  
  // Add 20% installation and 20% margin
  const estimatedCost = equipmentCost * 1.2 * 1.2;
  
  // Range: -15% to +20%
  const costRange = {
    low: estimatedCost * 0.85,
    high: estimatedCost * 1.20
  };

  const formattedEstimate = estimatedCost >= 1000000 
    ? `RM ${(estimatedCost / 1000000).toFixed(1)}M`
    : `RM ${(estimatedCost / 1000).toFixed(0)}K`;

  return {
    estimatedCost,
    costRange,
    formattedEstimate
  };
}
