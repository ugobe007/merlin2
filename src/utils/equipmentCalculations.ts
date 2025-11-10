// Equipment breakdown calculations for detailed quotes

import { calculateMarketAlignedBESSPricing, getMarketIntelligenceRecommendations } from '../services/marketIntelligence';
import { pricingConfigService } from '../services/pricingConfigService';

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

export const calculateEquipmentBreakdown = (
  storageSizeMW: number,
  durationHours: number,
  solarMW: number = 0,
  windMW: number = 0,
  generatorMW: number = 0,
  industryData?: any,
  gridConnection: 'on-grid' | 'off-grid' | 'limited' = 'on-grid',
  location: string = 'California'
): EquipmentBreakdown => {
  
  const totalEnergyMWh = storageSizeMW * durationHours;
  
  // Battery System Calculations - Enhanced with NREL ATB 2024 + Market Intelligence
  // Using realistic market pricing based on system size and admin configuration
  const batteryUnitPowerMW = 3;
  const batteryUnitEnergyMWh = 11.5;
  
  // Get pricing from admin configuration based on total energy capacity (MWh)
  const adminPricePerKWh = pricingConfigService.getBESSCostPerKWh(totalEnergyMWh);
  
  // Get market-aligned pricing from NREL ATB 2024 + live market intelligence for comparison
  const marketAnalysis = calculateMarketAlignedBESSPricing(storageSizeMW, durationHours, location);
  const marketPricePerKWh = marketAnalysis.systemCosts.costPerKWh;
  
  // Use admin pricing (realistic) if available, otherwise fall back to market pricing
  // Cap pricing at reasonable levels to avoid Tesla Megapack premium pricing
  const effectivePricePerKWh = Math.min(adminPricePerKWh || marketPricePerKWh, 140); // Cap at $140/kWh
  const batteryUnitCost = batteryUnitEnergyMWh * 1000 * effectivePricePerKWh;
  
  const batteryQuantity = Math.ceil(Math.max(
    storageSizeMW / batteryUnitPowerMW,
    totalEnergyMWh / batteryUnitEnergyMWh
  ));
  
  // Get market intelligence recommendations
  const marketIntelligence = getMarketIntelligenceRecommendations(storageSizeMW, location);
  
  const batteries = {
    quantity: batteryQuantity,
    unitPowerMW: batteryUnitPowerMW,
    unitEnergyMWh: batteryUnitEnergyMWh,
    unitCost: batteryUnitCost,
    totalCost: batteryQuantity * batteryUnitCost,
    manufacturer: effectivePricePerKWh < 130 ? "CATL/BYD" : "Tesla",
    model: effectivePricePerKWh < 130 ? "Utility Scale LFP" : "Megapack 2XL",
    pricePerKWh: effectivePricePerKWh,
    marketIntelligence: {
      nrelCompliant: true,
      marketOpportunity: marketIntelligence.analysis.financialMetrics.simplePayback < 8 ? 'Excellent' : 
                        marketIntelligence.analysis.financialMetrics.simplePayback < 12 ? 'Good' : 'Poor',
      paybackPeriod: marketIntelligence.analysis.financialMetrics.simplePayback,
      revenueProjection: marketIntelligence.analysis.revenueProjection.totalAnnualRevenue,
      dataSource: 'NREL ATB 2024 + Market Intelligence (Cost-Optimized)'
    }
  };

  // Inverter Calculations - Select appropriate inverter type based on grid connection
  let inverterUnitPowerMW: number;
  let inverterUnitCost: number;
  let inverterManufacturer: string;
  let inverterModel: string;
  
  if (gridConnection === 'off-grid') {
    // Off-grid systems need hybrid inverters with grid-forming capability (can create stable AC)
    inverterUnitPowerMW = 2.5; // 2.5MW hybrid grid-forming inverters
    inverterUnitCost = 450000; // $450k per 2.5MW hybrid inverter (more expensive due to grid-forming controls)
    inverterManufacturer = "SMA Solar";
    inverterModel = "Sunny Central Storage"; // Hybrid inverter with grid-forming capability
  } else {
    // On-grid systems can use standard bi-directional grid-tie inverters
    inverterUnitPowerMW = 2.5; // 2.5MW bi-directional inverters
    inverterUnitCost = 375000; // $375k per 2.5MW bi-directional inverter
    inverterManufacturer = "SMA Solar";
    inverterModel = "MVPS 2500"; // Bi-directional grid-tie inverter
  }
  
  const inverterQuantity = Math.ceil(storageSizeMW / inverterUnitPowerMW);
  
  const inverters = {
    quantity: inverterQuantity,
    unitPowerMW: inverterUnitPowerMW,
    unitCost: inverterUnitCost,
    totalCost: inverterQuantity * inverterUnitCost,
    manufacturer: inverterManufacturer,
    model: inverterModel
  };

  // Transformer Calculations
  // Step-up transformers: ~$200k per MVA for medium voltage
  const transformerUnitMVA = Math.max(5, Math.ceil(storageSizeMW / 5) * 5); // Round up to 5MVA increments
  const transformerUnitCost = transformerUnitMVA * 40000; // $40k per MVA
  const transformerQuantity = Math.ceil(storageSizeMW / transformerUnitMVA);
  
  const transformers = {
    quantity: transformerQuantity,
    unitPowerMVA: transformerUnitMVA,
    unitCost: transformerUnitCost,
    totalCost: transformerQuantity * transformerUnitCost,
    voltage: `${transformerUnitMVA >= 10 ? '35kV' : '13.8kV'}/480V`,
    manufacturer: "ABB"
  };

  // Switchgear Calculations
  const switchgearQuantity = Math.ceil(storageSizeMW / 5); // One switchgear per 5MW
  const switchgearUnitCost = 150000; // $150k per unit
  
  const switchgear = {
    quantity: switchgearQuantity,
    unitCost: switchgearUnitCost,
    totalCost: switchgearQuantity * switchgearUnitCost,
    type: "Medium Voltage Switchgear",
    voltage: transformerUnitMVA >= 10 ? "35kV" : "13.8kV"
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
    effectiveGeneratorMW = Math.max(storageSizeMW * 0.5, 2); // At least 2MW for substantial off-grid systems
  } else if (gridConnection === 'off-grid' && generatorMW > 0) {
    effectiveGeneratorMW = generatorMW;
  } else if (generatorMW > 0) {
    effectiveGeneratorMW = generatorMW;
  }
  
  if (effectiveGeneratorMW > 0) {
    const generatorUnitMW = 2; // 2MW generators
    // Get pricing from admin configuration (real-world vendor quotes)
    const costPerKW = pricingConfigService.getGeneratorCostPerKW('diesel'); // Based on Eaton quote
    const generatorUnitCost = generatorUnitMW * 1000 * costPerKW; 
    const generatorQuantity = Math.ceil(effectiveGeneratorMW / generatorUnitMW);
    
    generators = {
      quantity: generatorQuantity,
      unitPowerMW: generatorUnitMW,
      unitCost: generatorUnitCost,
      totalCost: generatorQuantity * generatorUnitCost,
      costPerKW: costPerKW,
      fuelType: "Diesel",
      manufacturer: "Caterpillar/Eaton"
    };
  }

  // Solar Calculations (if specified)
  let solar = undefined;
  if (solarMW > 0) {
    // Market-aligned pricing based on scale (from industryPricing.ts)
    const isUtilityScale = solarMW >= 5; // 5MW+ is utility scale
    const costPerWatt = isUtilityScale ? 0.8 : 1.2; // $0.80/W utility, $1.20/W commercial
    const priceSource = isUtilityScale ? 'Utility Solar (>5 MW)' : 'Commercial Solar (<5 MW)';
    
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
    // Market-aligned pricing based on scale (from industryPricing.ts)
    const isUtilityScale = windMW >= 5; // 5MW+ is utility scale (2+ turbines)
    const costPerKW = isUtilityScale ? 1200 : 1800; // $1200/kW utility, $1800/kW distributed
    const priceCategory = isUtilityScale ? 'Utility Wind' : 'Distributed Wind';
    const turbineCostPerMW = costPerKW * 1000; // Convert to per MW
    const turbineQuantity = Math.ceil(windMW / turbineUnitMW);
    
    wind = {
      turbineQuantity: turbineQuantity,
      unitPowerMW: turbineUnitMW,
      totalCost: windMW * turbineCostPerMW,
      costPerKW: costPerKW,
      priceCategory: priceCategory,
      turbineModel: isUtilityScale ? "GE 2.8-127" : "Vestas V120-2.2MW"
    };
  }

  // EV Charger Calculations (if EV charging industry)
  let evChargers = undefined;
  if (industryData?.selectedIndustry === 'ev-charging' && industryData?.useCaseData) {
    const { level2Chargers = 0, level2Power = 11, dcFastChargers = 0, dcFastPower = 150 } = industryData.useCaseData;
    
    // Get pricing from admin configuration (real-world market rates)
    const config = pricingConfigService.getConfiguration();
    const level2UnitCost = config.evCharging.level2ACPerUnit; // $8k per Level 2 charger
    const dcFast50UnitCost = config.evCharging.dcFastPerUnit; // $45k for 50-150kW DC Fast
    const dcFast150UnitCost = config.evCharging.dcFastPerUnit; // $45k for 50-150kW DC Fast
    const dcFast350UnitCost = config.evCharging.dcUltraFastPerUnit; // $125k for 150-350kW DC Ultra Fast
    const networkingCost = config.evCharging.networkingCostPerUnit; // OCPP compliance per charger
    
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

  // Installation Costs
  const equipmentCost = 
    batteries.totalCost + 
    inverters.totalCost + 
    transformers.totalCost + 
    switchgear.totalCost +
    (generators?.totalCost || 0) +
    (solar?.totalCost || 0) +
    (wind?.totalCost || 0) +
    (evChargers?.totalChargingCost || 0);

  // Installation Costs - Using admin-configurable percentages
  const config = pricingConfigService.getConfiguration();
  const installation = {
    bos: equipmentCost * config.balanceOfPlant.bopPercentage, // Configurable BOP percentage (≤15% guideline)
    epc: equipmentCost * config.balanceOfPlant.epcPercentage, // Configurable EPC percentage
    contingency: equipmentCost * config.balanceOfPlant.contingencyPercentage, // Configurable contingency
    totalInstallation: equipmentCost * (
      config.balanceOfPlant.bopPercentage + 
      config.balanceOfPlant.epcPercentage + 
      config.balanceOfPlant.contingencyPercentage
    )
  };

  const totals = {
    equipmentCost: equipmentCost,
    installationCost: installation.totalInstallation,
    totalProjectCost: equipmentCost + installation.totalInstallation
  };

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