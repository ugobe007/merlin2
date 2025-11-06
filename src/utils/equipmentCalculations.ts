// Equipment breakdown calculations for detailed quotes

export interface EquipmentBreakdown {
  batteries: {
    quantity: number;
    unitPowerMW: number;
    unitEnergyMWh: number;
    unitCost: number;
    totalCost: number;
    manufacturer: string;
    model: string;
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
    fuelType: string;
    manufacturer: string;
  };
  solar?: {
    totalMW: number;
    panelQuantity: number;
    inverterQuantity: number;
    totalCost: number;
    costPerWatt: number;
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
    civil: number;
    electrical: number;
    commissioning: number;
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
  gridConnection: 'on-grid' | 'off-grid' | 'limited' = 'on-grid'
): EquipmentBreakdown => {
  
  const totalEnergyMWh = storageSizeMW * durationHours;
  
  // Battery System Calculations
  // Tesla Megapack: 3MW / 11.5MWh per unit (~$2.8M each)
  const batteryUnitPowerMW = 3;
  const batteryUnitEnergyMWh = 11.5;
  const batteryUnitCost = 2800000; // $2.8M per Megapack
  
  const batteryQuantity = Math.ceil(Math.max(
    storageSizeMW / batteryUnitPowerMW,
    totalEnergyMWh / batteryUnitEnergyMWh
  ));
  
  const batteries = {
    quantity: batteryQuantity,
    unitPowerMW: batteryUnitPowerMW,
    unitEnergyMWh: batteryUnitEnergyMWh,
    unitCost: batteryUnitCost,
    totalCost: batteryQuantity * batteryUnitCost,
    manufacturer: "Tesla",
    model: "Megapack 2XL"
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
    const generatorUnitMW = 2; // 2MW diesel generators
    const generatorUnitCost = 800000; // $800k per 2MW generator
    const generatorQuantity = Math.ceil(effectiveGeneratorMW / generatorUnitMW);
    
    generators = {
      quantity: generatorQuantity,
      unitPowerMW: generatorUnitMW,
      unitCost: generatorUnitCost,
      totalCost: generatorQuantity * generatorUnitCost,
      fuelType: "Diesel",
      manufacturer: "Caterpillar"
    };
  }

  // Solar Calculations (if specified)
  let solar = undefined;
  if (solarMW > 0) {
    const costPerWatt = 1.2; // $1.20/W installed
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
    const turbineCostPerMW = 1800000; // $1.8M per MW
    const turbineQuantity = Math.ceil(windMW / turbineUnitMW);
    
    wind = {
      turbineQuantity: turbineQuantity,
      unitPowerMW: turbineUnitMW,
      totalCost: windMW * turbineCostPerMW,
      turbineModel: "Vestas V120-2.2MW"
    };
  }

  // EV Charger Calculations (if EV charging industry)
  let evChargers = undefined;
  if (industryData?.selectedIndustry === 'ev-charging' && industryData?.useCaseData) {
    const { level2Chargers = 0, level2Power = 11, dcFastChargers = 0, dcFastPower = 150 } = industryData.useCaseData;
    
    const level2UnitCost = parseInt(level2Power) * 1000; // $1k per kW for Level 2
    const dcFastUnitCost = parseInt(dcFastPower) * 2000; // $2k per kW for DC Fast
    
    const level2Data = {
      quantity: parseInt(level2Chargers) || 0,
      unitPowerKW: parseInt(level2Power) || 11,
      unitCost: level2UnitCost,
      totalCost: (parseInt(level2Chargers) || 0) * level2UnitCost
    };
    
    const dcFastData = {
      quantity: parseInt(dcFastChargers) || 0,
      unitPowerKW: parseInt(dcFastPower) || 150,
      unitCost: dcFastUnitCost,
      totalCost: (parseInt(dcFastChargers) || 0) * dcFastUnitCost
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

  const installation = {
    civil: equipmentCost * 0.15, // 15% for civil works
    electrical: equipmentCost * 0.12, // 12% for electrical installation
    commissioning: equipmentCost * 0.08, // 8% for commissioning & testing
    totalInstallation: equipmentCost * 0.35 // 35% total installation
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