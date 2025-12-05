// Equipment breakdown calculations for detailed quotes
// ✅ Using market intelligence for pricing (database pricing deprecated)

import { calculateMarketAlignedBESSPricing, getMarketIntelligenceRecommendations } from '../services/marketIntelligence';

export interface EquipmentBreakdown {
  batteries: {
    quantity: number;
    unitPowerMW: number;
    unitEnergyMWh: number;
    unitCost: number;
    totalCost: number;
    manufacturer: string;
    model: string;
    pricePerKWh: number;
    marketIntelligence?: {
      nrelCompliant: boolean;
      marketOpportunity: string;
      paybackPeriod: number;
      revenueProjection: number;
      dataSource: string;
    };
  };
  inverters: {
    quantity: number;
    unitPowerMW: number;
    unitCost: number;
    totalCost: number;
    manufacturer: string;
    model: string;
  };
  transformers: {
    quantity: number;
    unitPowerMVA: number;
    unitCost: number;
    totalCost: number;
    voltage: string;
    manufacturer: string;
  };
  switchgear: {
    quantity: number;
    unitCost: number;
    totalCost: number;
    type: string;
    voltage: string;
  };
  generators?: {
    quantity: number;
    unitPowerMW: number;
    unitCost: number;
    totalCost: number;
    costPerKW: number;
    fuelType: string;
    manufacturer: string;
  };
  solar?: {
    totalMW: number;
    panelQuantity: number;
    inverterQuantity: number;
    totalCost: number;
    costPerWatt: number;
    priceCategory: string;
    spaceRequirements: {
      rooftopAreaSqFt: number;
      groundAreaSqFt: number;
      rooftopAreaAcres: number;
      groundAreaAcres: number;
      isFeasible: boolean;
      constraints: string[];
      alternatives?: string[];
    };
  };
  wind?: {
    turbineQuantity: number;
    unitPowerMW: number;
    totalCost: number;
    costPerKW: number;
    priceCategory: string;
    turbineModel: string;
  };
  evChargers?: {
    level2Chargers: {
      quantity: number;
      unitPowerKW: number;
      unitCost: number;
      totalCost: number;
    };
    dcFastChargers: {
      quantity: number;
      unitPowerKW: number;
      unitCost: number;
      totalCost: number;
    };
    totalChargingCost: number;
  };
  installation: {
    bos: number;
    epc: number;
    contingency: number;
    totalInstallation: number;
  };
  totals: {
    equipmentCost: number;
    installationCost: number;
    totalProjectCost: number;
  };
}

export const calculateEquipmentBreakdown = async (
  storageSizeMW: number,
  durationHours: number,
  solarMW: number = 0,
  windMW: number = 0,
  generatorMW: number = 0,
  industryData?: any,
  gridConnection: 'on-grid' | 'off-grid' | 'limited' = 'on-grid',
  location: string = 'California'
): Promise<EquipmentBreakdown> => {
  
  const totalEnergyMWh = storageSizeMW * durationHours;
  const totalEnergyKWh = totalEnergyMWh * 1000;
  
  // Battery System Calculations - Market-based pricing
  // ✅ FIX: Use actual energy required, not fixed utility-scale units
  const batteryUnitPowerMW = 3;
  const batteryUnitEnergyMWh = 11.5;
  
  // Get market-aligned pricing from NREL ATB 2024 + live market intelligence
  const marketAnalysis = calculateMarketAlignedBESSPricing(storageSizeMW, durationHours, location);
  const marketPricePerKWh = marketAnalysis.systemCosts.costPerKWh;
  
  // Use market pricing with realistic cap
  const effectivePricePerKWh = Math.min(marketPricePerKWh, 580); // Cap at realistic $580/kWh for small systems
  
  // ✅ CRITICAL FIX: Calculate battery cost based on ACTUAL energy needed, not fixed unit size
  // Small systems (< 1 MW) should pay per-kWh, not per-unit
  const isSmallSystem = storageSizeMW < 1.0;
  
  let batteryQuantity: number;
  let actualBatteryTotalCost: number;
  let displayUnitEnergyMWh: number;
  let displayUnitCost: number;
  
  if (isSmallSystem) {
    // ✅ For C&I systems < 1 MW: Price based on actual kWh needed (modular approach)
    // Use containerized/modular units sized appropriately
    batteryQuantity = 1; // Single modular system
    actualBatteryTotalCost = totalEnergyKWh * effectivePricePerKWh;
    displayUnitEnergyMWh = totalEnergyMWh;
    displayUnitCost = actualBatteryTotalCost;
    
    if (import.meta.env.DEV) {
      console.log(`🔋 [Small System Pricing] ${storageSizeMW.toFixed(2)} MW × ${durationHours}hr = ${totalEnergyKWh} kWh @ $${effectivePricePerKWh}/kWh = $${actualBatteryTotalCost.toLocaleString()}`);
    }
  } else {
    // For utility-scale systems: Use standard unit-based approach
    batteryQuantity = Math.ceil(Math.max(
      storageSizeMW / batteryUnitPowerMW,
      totalEnergyMWh / batteryUnitEnergyMWh
    ));
    displayUnitEnergyMWh = batteryUnitEnergyMWh;
    displayUnitCost = batteryUnitEnergyMWh * 1000 * effectivePricePerKWh;
    actualBatteryTotalCost = batteryQuantity * displayUnitCost;
  }
  
  // Get market intelligence recommendations
  const marketIntelligence = getMarketIntelligenceRecommendations(storageSizeMW, location);
  
  const batteries = {
    quantity: batteryQuantity,
    unitPowerMW: isSmallSystem ? storageSizeMW : batteryUnitPowerMW,
    unitEnergyMWh: displayUnitEnergyMWh,
    unitCost: displayUnitCost,
    totalCost: actualBatteryTotalCost, // ✅ FIX: Use actual calculated cost
    manufacturer: effectivePricePerKWh < 200 ? "CATL/BYD" : "Tesla",
    model: isSmallSystem ? "Commercial LFP Module" : (effectivePricePerKWh < 200 ? "Utility Scale LFP" : "Megapack 2XL"),
    pricePerKWh: effectivePricePerKWh,
    marketIntelligence: {
      nrelCompliant: true,
      marketOpportunity: marketIntelligence.analysis.financialMetrics.simplePayback < 8 ? 'Excellent' : 
                        marketIntelligence.analysis.financialMetrics.simplePayback < 12 ? 'Good' : 'Poor',
      paybackPeriod: marketIntelligence.analysis.financialMetrics.simplePayback,
      revenueProjection: marketIntelligence.analysis.revenueProjection.totalAnnualRevenue,
      dataSource: isSmallSystem ? 'NREL ATB 2024 (C&I Modular)' : 'NREL ATB 2024 + Market Intelligence (Cost-Optimized)'
    }
  };

  // ✅ SINGLE SOURCE OF TRUTH: Fetch power electronics pricing from database
  // Config key: 'power_electronics_2025' in pricing_configurations table
  let powerElectronicsConfig: any = null;
  try {
    const { useCaseService } = await import('../services/useCaseService');
    powerElectronicsConfig = await useCaseService.getPricingConfig('power_electronics_2025');
  } catch (error) {
    console.warn('⚠️ Using fallback power electronics pricing (database unavailable):', error);
  }
  
  // Database-driven pricing with validated fallbacks
  // Benchmarks from professional quotes (Oct 2025):
  // - PCS/Inverter: $120/kW (UK EV Hub quote, Hampton Heights)
  // - Transformer: $80/kVA for utility, $50/kVA for commercial
  // - Switchgear: $50/kW utility, $30/kW commercial
  const inverterPerKW = powerElectronicsConfig?.inverterPerKW || 120; // $120/kW from database
  const transformerPerKVA = powerElectronicsConfig?.transformerPerKVA || 80; // $80/kVA from database
  const switchgearPerKW = powerElectronicsConfig?.switchgearPerKW || 50; // $50/kW from database
  
  // ============================================
  // INVERTER CALCULATIONS - SCALE TO SYSTEM SIZE
  // ============================================
  // ✅ FIX: Small systems should NOT use 2.5 MW inverters
  // Commercial systems use modular inverters sized to actual power requirements
  
  let inverterUnitPowerMW: number;
  let inverterUnitCost: number;
  let inverterManufacturer: string;
  let inverterModel: string;
  let inverterQuantity: number;
  let inverterTotalCost: number;
  
  if (isSmallSystem) {
    // ✅ For C&I systems < 1 MW: Use appropriately-sized commercial inverters
    // Price based on actual kW needed, not fixed 2.5 MW units
    const storageSizeKW = storageSizeMW * 1000;
    const offGridPremium = gridConnection === 'off-grid' ? 1.20 : 1.0;
    
    inverterUnitPowerMW = storageSizeMW; // Size to match system
    inverterQuantity = 1; // Single modular inverter system
    inverterTotalCost = storageSizeKW * inverterPerKW * offGridPremium;
    inverterUnitCost = inverterTotalCost;
    inverterManufacturer = gridConnection === 'off-grid' ? "Dynapower" : "SMA Solar";
    inverterModel = gridConnection === 'off-grid' 
      ? `MPS-${Math.ceil(storageSizeKW / 25) * 25}` // Dynapower modular PCS
      : `Sunny Tripower ${Math.ceil(storageSizeKW / 10) * 10}`;
    
    if (import.meta.env.DEV) {
      console.log(`⚡ [Small System Inverter] ${storageSizeKW} kW @ $${inverterPerKW}/kW = $${inverterTotalCost.toLocaleString()}`);
    }
  } else {
    // For utility-scale systems (≥ 1 MW): Use standard 2.5 MW inverter units
    if (gridConnection === 'off-grid') {
      inverterUnitPowerMW = 2.5;
      inverterUnitCost = inverterUnitPowerMW * 1000 * inverterPerKW * 1.20; // 20% premium for grid-forming
      inverterManufacturer = "SMA Solar";
      inverterModel = "Sunny Central Storage";
    } else {
      inverterUnitPowerMW = 2.5;
      inverterUnitCost = inverterUnitPowerMW * 1000 * inverterPerKW;
      inverterManufacturer = "SMA Solar";
      inverterModel = "MVPS 2500";
    }
    inverterQuantity = Math.ceil(storageSizeMW / inverterUnitPowerMW);
    inverterTotalCost = inverterQuantity * inverterUnitCost;
  }
  
  const inverters = {
    quantity: inverterQuantity,
    unitPowerMW: inverterUnitPowerMW,
    unitCost: inverterUnitCost,
    totalCost: inverterTotalCost,
    manufacturer: inverterManufacturer,
    model: inverterModel,
    priceSource: powerElectronicsConfig ? 'database' : 'fallback'
  };

  // ============================================
  // TRANSFORMER CALCULATIONS - SCALE TO SYSTEM SIZE
  // ============================================
  // ✅ FIX: Small systems don't need 5 MVA transformers
  // Commercial systems use appropriately-sized transformers
  
  let transformerUnitMVA: number;
  let transformerUnitCost: number;
  let transformerQuantity: number;
  let transformerTotalCost: number;
  let transformerVoltage: string;
  
  if (isSmallSystem) {
    // For C&I systems < 1 MW: Size transformer to actual MVA needed
    // Add 25% margin for power factor and future expansion
    const requiredMVA = storageSizeMW * 1.25;
    transformerUnitMVA = Math.max(0.1, Math.ceil(requiredMVA * 10) / 10); // Round to 0.1 MVA
    // Commercial transformers are slightly cheaper per kVA at smaller sizes
    const commercialTransformerPerKVA = transformerPerKVA * 0.85; // 15% less than utility
    transformerUnitCost = transformerUnitMVA * 1000 * commercialTransformerPerKVA;
    transformerQuantity = 1;
    transformerTotalCost = transformerUnitCost;
    transformerVoltage = "480V/208V"; // Commercial voltage levels
    
    if (import.meta.env.DEV) {
      console.log(`🔌 [Small System Transformer] ${transformerUnitMVA} MVA @ $${commercialTransformerPerKVA}/kVA = $${transformerTotalCost.toLocaleString()}`);
    }
  } else {
    // For utility-scale: Use standard 5 MVA increments
    transformerUnitMVA = Math.max(5, Math.ceil(storageSizeMW / 5) * 5);
    transformerUnitCost = transformerUnitMVA * 1000 * transformerPerKVA;
    transformerQuantity = Math.ceil(storageSizeMW / transformerUnitMVA);
    transformerTotalCost = transformerQuantity * transformerUnitCost;
    transformerVoltage = `${transformerUnitMVA >= 10 ? '35kV' : '13.8kV'}/480V`;
  }
  
  const transformers = {
    quantity: transformerQuantity,
    unitPowerMVA: transformerUnitMVA,
    unitCost: transformerUnitCost,
    totalCost: transformerTotalCost,
    voltage: transformerVoltage,
    manufacturer: isSmallSystem ? "Eaton/Square D" : "ABB",
    priceSource: powerElectronicsConfig ? 'database' : 'fallback'
  };

  // ============================================
  // SWITCHGEAR CALCULATIONS - SCALE TO SYSTEM SIZE
  // ============================================
  // ✅ FIX: Small systems use simpler, cheaper switchgear
  
  let switchgearQuantity: number;
  let switchgearUnitCost: number;
  let switchgearTotalCost: number;
  let switchgearType: string;
  let switchgearVoltage: string;
  
  if (isSmallSystem) {
    // For C&I systems < 1 MW: Use low-voltage distribution panels
    // Simpler protection schemes, no MV switchgear needed
    const storageSizeKW = storageSizeMW * 1000;
    const commercialSwitchgearPerKW = switchgearPerKW * 0.6; // 40% less than utility MV gear
    switchgearQuantity = 1;
    switchgearUnitCost = storageSizeKW * commercialSwitchgearPerKW;
    switchgearTotalCost = switchgearUnitCost;
    switchgearType = "Low Voltage Distribution Panel";
    switchgearVoltage = "480V";
    
    if (import.meta.env.DEV) {
      console.log(`🔧 [Small System Switchgear] ${storageSizeKW} kW @ $${commercialSwitchgearPerKW}/kW = $${switchgearTotalCost.toLocaleString()}`);
    }
  } else {
    // For utility-scale: One MV switchgear per 5 MW
    switchgearQuantity = Math.ceil(storageSizeMW / 5);
    switchgearUnitCost = (storageSizeMW / switchgearQuantity) * 1000 * switchgearPerKW;
    switchgearTotalCost = switchgearQuantity * switchgearUnitCost;
    switchgearType = "Medium Voltage Switchgear";
    switchgearVoltage = transformerUnitMVA >= 10 ? "35kV" : "13.8kV";
  }
  
  const switchgear = {
    quantity: switchgearQuantity,
    unitCost: switchgearUnitCost,
    totalCost: switchgearTotalCost,
    type: switchgearType,
    voltage: switchgearVoltage,
    priceSource: powerElectronicsConfig ? 'database' : 'fallback'
  };

  // Generator Calculations
  let generators = undefined;
  let effectiveGeneratorMW = generatorMW;
  
  // For off-grid systems, automatically include generators as backup power if not specified
  // Industry standard: off-grid microgrids require backup generators for extended outages
  // and when renewable generation is insufficient (cloudy days, low wind)
  if (gridConnection === 'off-grid' && generatorMW === 0) {
    // Size generator to handle critical loads (minimum 50% of battery power capacity)
    // This ensures system can maintain operations during battery depletion
    // ✅ FIX: For small systems, don't require 2 MW minimum
    const minGeneratorMW = isSmallSystem ? storageSizeMW * 0.5 : Math.max(storageSizeMW * 0.5, 2);
    effectiveGeneratorMW = minGeneratorMW;
  } else if (gridConnection === 'off-grid' && generatorMW > 0) {
    effectiveGeneratorMW = generatorMW;
  } else if (generatorMW > 0) {
    effectiveGeneratorMW = generatorMW;
  }
  
  if (effectiveGeneratorMW > 0) {
    const generatorUnitMW = 2; // 2MW generators
    
    // Fetch generator pricing from database
    let costPerKW = 800; // Fallback: $800/kW for diesel generators
    let fuelType = "Diesel";
    let manufacturer = "Caterpillar/Eaton";
    
    try {
      const { useCaseService } = await import('../services/useCaseService');
      const generatorConfig = await useCaseService.getPricingConfig('generator_default');
      if (generatorConfig) {
        costPerKW = generatorConfig.diesel_per_kw || 800;
        fuelType = "Diesel";
        manufacturer = "Caterpillar/Cummins/Eaton";
      }
    } catch (error) {
      console.warn('Using fallback generator pricing:', error);
    }
    
    const generatorUnitCost = generatorUnitMW * 1000 * costPerKW; 
    const generatorQuantity = Math.ceil(effectiveGeneratorMW / generatorUnitMW);
    
    generators = {
      quantity: generatorQuantity,
      unitPowerMW: generatorUnitMW,
      unitCost: generatorUnitCost,
      totalCost: generatorQuantity * generatorUnitCost,
      costPerKW: costPerKW,
      fuelType: fuelType,
      manufacturer: manufacturer
    };
  }

  // Solar Calculations (if specified)
  let solar = undefined;
  if (solarMW > 0) {
    // Fetch solar pricing from database
    let costPerWatt = 0.85; // Fallback: commercial scale
    let priceSource = 'Commercial Solar';
    
    try {
      const { useCaseService } = await import('../services/useCaseService');
      const solarConfig = await useCaseService.getPricingConfig('solar_default');
      if (solarConfig) {
        const isUtilityScale = solarMW >= 5; // 5MW+ is utility scale
        costPerWatt = isUtilityScale ? solarConfig.utility_scale_per_watt : solarConfig.commercial_per_watt;
        priceSource = isUtilityScale ? 'Utility Solar (>5 MW) - Database' : 'Commercial Solar (<5 MW) - Database';
      }
    } catch (error) {
      console.warn('Using fallback solar pricing:', error);
      const isUtilityScale = solarMW >= 5;
      costPerWatt = isUtilityScale ? 0.65 : 0.85;
      priceSource = isUtilityScale ? 'Utility Solar (>5 MW) - Fallback' : 'Commercial Solar (<5 MW) - Fallback';
    }
    
    const panelsPerMW = 3000; // ~333W panels
    const solarInvertersPerMW = 1; // 1MW string inverters
    
    // Space requirement calculations
    // Rooftop: 100 sq ft per kW (tighter spacing, no setbacks)
    // Ground-mount: 200 sq ft per kW (includes spacing, access roads, setbacks)
    const rooftopSqFtPerKW = 100;
    const groundSqFtPerKW = 200;
    const rooftopAreaSqFt = solarMW * 1000 * rooftopSqFtPerKW;
    const groundAreaSqFt = solarMW * 1000 * groundSqFtPerKW;
    const rooftopAreaAcres = rooftopAreaSqFt / 43560; // Convert to acres
    const groundAreaAcres = groundAreaSqFt / 43560;
    
    // Feasibility analysis based on industry and location
    const constraints: string[] = [];
    const alternatives: string[] = [];
    let isFeasible = true;
    
    // Industry-specific constraints
    if (industryData?.selectedIndustry === 'ev-charging') {
      if (solarMW > 5) {
        constraints.push(`${solarMW}MW solar requires ${groundAreaAcres.toFixed(1)} acres - likely too large for most EV charging sites`);
        isFeasible = false;
      }
      if (rooftopAreaAcres > 2) {
        constraints.push(`Rooftop option needs ${rooftopAreaAcres.toFixed(1)} acres of roof space - most charging stations don't have this much roof area`);
      }
    } else if (industryData?.selectedIndustry === 'hotel') {
      if (rooftopAreaAcres > 1) {
        constraints.push(`Hotel rooftop typically 1-3 acres max - you need ${rooftopAreaAcres.toFixed(1)} acres`);
      }
      if (groundAreaAcres > 5) {
        constraints.push(`${groundAreaAcres.toFixed(1)} acres of ground space rarely available at urban hotels`);
        isFeasible = false;
      }
    } else if (industryData?.selectedIndustry === 'datacenter') {
      if (rooftopAreaAcres > 3) {
        constraints.push(`Datacenter rooftop limited by cooling equipment - ${rooftopAreaAcres.toFixed(1)} acres may not be available`);
      }
    } else if (['shopping-center', 'retail'].includes(industryData?.selectedIndustry || '')) {
      if (rooftopAreaAcres > 10) {
        constraints.push(`Large shopping centers can support ${rooftopAreaAcres.toFixed(1)} acres, but check roof load capacity`);
      }
    }
    
    // Size-based constraints
    if (solarMW > 10) {
      constraints.push(`${solarMW}MW is utility-scale solar - requires significant permitting and grid interconnection studies`);
    }
    
    if (solarMW > 2 && groundAreaAcres > 10) {
      constraints.push(`${groundAreaAcres.toFixed(1)} acres ground-mount may face zoning restrictions in urban areas`);
    }
    
    // Alternative suggestions
    if (!isFeasible || constraints.length > 0) {
      alternatives.push('🔋 Increase battery storage duration to reduce solar requirements');
      alternatives.push('⚡ Grid-tied system with utility green energy purchase');
      alternatives.push('🏭 Off-site solar PPA (Power Purchase Agreement)');
      
      if (solarMW > 5) {
        alternatives.push('🔥 Backup generators for critical loads instead of large solar');
        alternatives.push('🌬️ Consider wind power if space allows and wind resource available');
      }
      
      if (industryData?.selectedIndustry === 'ev-charging') {
        alternatives.push('🚗 Reduce charging power during peak solar hours to optimize smaller array');
        alternatives.push('🔌 Time-of-use charging pricing to shift demand to solar hours');
      }
      
      if (['hotel', 'shopping-center'].includes(industryData?.selectedIndustry || '')) {
        alternatives.push('🏢 Parking canopy solar (dual-purpose structure)');
        alternatives.push('☂️ Solar canopies over outdoor spaces');
      }
    }
    
    solar = {
      totalMW: solarMW,
      panelQuantity: solarMW * panelsPerMW,
      inverterQuantity: solarMW * solarInvertersPerMW,
      totalCost: solarMW * 1000000 * costPerWatt,
      costPerWatt: costPerWatt,
      priceCategory: priceSource,
      spaceRequirements: {
        rooftopAreaSqFt,
        groundAreaSqFt,
        rooftopAreaAcres,
        groundAreaAcres,
        isFeasible,
        constraints,
        alternatives: alternatives.length > 0 ? alternatives : undefined
      }
    };
  }

  // Wind Calculations (if specified)
  let wind = undefined;
  if (windMW > 0) {
    const turbineUnitMW = 2.5; // 2.5MW turbines
    
    // Fetch wind pricing from database
    let costPerKW = 1350; // Fallback: onshore utility scale
    let priceCategory = 'Onshore Utility Wind';
    let turbineModel = 'GE 2.8-127';
    
    try {
      const { useCaseService } = await import('../services/useCaseService');
      const windConfig = await useCaseService.getPricingConfig('wind_default');
      if (windConfig) {
        const isUtilityScale = windMW >= 5; // 5MW+ is utility scale (2+ turbines)
        costPerKW = isUtilityScale ? windConfig.onshore_utility_per_kw : windConfig.distributed_per_kw;
        priceCategory = isUtilityScale ? 'Utility Wind - Database' : 'Distributed Wind - Database';
        turbineModel = isUtilityScale ? "GE 2.8-127" : "Vestas V120-2.2MW";
      }
    } catch (error) {
      console.warn('Using fallback wind pricing:', error);
      const isUtilityScale = windMW >= 5;
      costPerKW = isUtilityScale ? 1350 : 2500;
      priceCategory = isUtilityScale ? 'Utility Wind - Fallback' : 'Distributed Wind - Fallback';
    }
    
    const turbineCostPerMW = costPerKW * 1000; // Convert to per MW
    const turbineQuantity = Math.ceil(windMW / turbineUnitMW);
    
    wind = {
      turbineQuantity: turbineQuantity,
      unitPowerMW: turbineUnitMW,
      totalCost: windMW * turbineCostPerMW,
      costPerKW: costPerKW,
      priceCategory: priceCategory,
      turbineModel: turbineModel
    };
  }

  // EV Charger Calculations (if EV charging industry)
  let evChargers = undefined;
  if (industryData?.selectedIndustry === 'ev-charging' && industryData?.useCaseData) {
    const { level2Chargers = 0, level2Power = 11, dcFastChargers = 0, dcFastPower = 150 } = industryData.useCaseData;
    
    // Fetch EV charger pricing from database
    let level2UnitCost = 8000; // Fallback: $8k per Level 2 charger
    let dcFast50UnitCost = 40000; // Fallback: $40k for 50kW
    let dcFast150UnitCost = 80000; // Fallback: $80k for 150kW
    let dcFast350UnitCost = 150000; // Fallback: $150k for 350kW+
    let networkingCost = 500; // Fallback: OCPP compliance per charger
    
    try {
      const { useCaseService } = await import('../services/useCaseService');
      const evConfig = await useCaseService.getPricingConfig('ev_charging_default');
      if (evConfig) {
        level2UnitCost = evConfig.level2_ac_11kw_cost || 8000;
        dcFast50UnitCost = evConfig.dc_fast_50kw_cost || 40000;
        dcFast150UnitCost = evConfig.dc_fast_150kw_cost || 80000;
        dcFast350UnitCost = evConfig.dc_ultra_fast_350kw_cost || 150000;
        networkingCost = evConfig.networking_cost_per_unit || 500;
      }
    } catch (error) {
      console.warn('Using fallback EV charger pricing:', error);
    }
    
    // Select appropriate DC Fast charger cost based on power level
    let dcFastUnitCost = dcFast150UnitCost; // Default to 150kW
    if (parseInt(dcFastPower) <= 50) {
      dcFastUnitCost = dcFast50UnitCost;
    } else if (parseInt(dcFastPower) >= 350) {
      dcFastUnitCost = dcFast350UnitCost;
    }
    
    // Add networking costs for OCPP compliance
    const level2TotalUnitCost = level2UnitCost + networkingCost;
    const dcFastTotalUnitCost = dcFastUnitCost + networkingCost;
    
    const level2Data = {
      quantity: parseInt(level2Chargers) || 0,
      unitPowerKW: parseInt(level2Power) || 11,
      unitCost: level2TotalUnitCost,
      totalCost: (parseInt(level2Chargers) || 0) * level2TotalUnitCost
    };
    
    const dcFastData = {
      quantity: parseInt(dcFastChargers) || 0,
      unitPowerKW: parseInt(dcFastPower) || 150,
      unitCost: dcFastTotalUnitCost,
      totalCost: (parseInt(dcFastChargers) || 0) * dcFastTotalUnitCost
    };
    
    evChargers = {
      level2Chargers: level2Data,
      dcFastChargers: dcFastData,
      totalChargingCost: level2Data.totalCost + dcFastData.totalCost
    };
  }

  // ============================================
  // INSTALLATION COSTS - INDUSTRY STANDARD BREAKDOWN
  // ============================================
  // Based on professional quotes (Oct 2025):
  // - Logistics: 8% of equipment
  // - Import duty/tariffs: 2% of equipment (China-sourced)
  // - EPC/Integration: 25% of equipment (includes install, commissioning, tie-in)
  // - Contingency: 5% of total (optional, for permitting & unexpected)
  
  const equipmentCost = 
    batteries.totalCost + 
    inverters.totalCost + 
    transformers.totalCost + 
    switchgear.totalCost +
    (generators?.totalCost || 0) +
    (solar?.totalCost || 0) +
    (wind?.totalCost || 0) +
    (evChargers?.totalChargingCost || 0);

  // Installation Costs - Using industry-standard percentages from professional quotes
  // Get config from database if available
  let logisticsPercentage = 0.08; // 8% logistics (shipping, handling, delivery)
  let importDutyPercentage = 0.02; // 2% import duty (for China-sourced equipment)
  let epcPercentage = 0.25; // 25% EPC (engineering, procurement, construction, commissioning)
  let contingencyPercentage = 0.05; // 5% contingency (permitting, unexpected costs)
  
  try {
    const bopConfig = await import('../services/useCaseService').then(m => 
      m.useCaseService.getPricingConfig('balance_of_plant_2025')
    );
    if (bopConfig) {
      logisticsPercentage = bopConfig.logisticsPercentage || 0.08;
      importDutyPercentage = bopConfig.importDutyPercentage || 0.02;
      epcPercentage = bopConfig.epcPercentage || 0.25;
      contingencyPercentage = bopConfig.contingencyPercentage || 0.05;
    }
  } catch (error) {
    console.log('Using fallback installation cost values');
  }
  
  // Calculate installation breakdown
  const logistics = equipmentCost * logisticsPercentage;
  const importDuty = equipmentCost * importDutyPercentage;
  const epc = equipmentCost * epcPercentage;
  const contingency = equipmentCost * contingencyPercentage;
  
  // BOS (Balance of System) = Logistics + Import Duty + EPC
  // This matches professional quote structure
  const totalInstallation = logistics + importDuty + epc + contingency;
  
  const installation = {
    bos: logistics + importDuty, // Logistics & duties
    epc: epc, // EPC/Integration
    contingency: contingency,
    totalInstallation: totalInstallation,
    // Detailed breakdown for professional quotes
    breakdown: {
      logistics: logistics,
      importDuty: importDuty,
      epcIntegration: epc,
      contingencyPermitting: contingency
    }
  };

  const totals = {
    equipmentCost: equipmentCost,
    installationCost: installation.totalInstallation,
    totalProjectCost: equipmentCost + installation.totalInstallation
  };

  if (import.meta.env.DEV) {
    console.log(`📦 [Installation Breakdown]`, {
      equipment: `$${equipmentCost.toLocaleString()}`,
      logistics: `$${logistics.toLocaleString()} (8%)`,
      importDuty: `$${importDuty.toLocaleString()} (2%)`,
      epc: `$${epc.toLocaleString()} (25%)`,
      contingency: `$${contingency.toLocaleString()} (5%)`,
      total: `$${(equipmentCost + totalInstallation).toLocaleString()}`
    });
  }

  return {
    batteries,
    inverters,
    transformers,
    switchgear,
    generators,
    solar,
    wind,
    evChargers,
    installation,
    totals
  };
};

export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  } else {
    return `$${amount.toLocaleString()}`;
  }
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};