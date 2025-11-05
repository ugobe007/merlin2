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
  industryData?: any
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

  // Inverter Calculations
  // Power conversion inverters: ~$150k per MW
  const inverterUnitPowerMW = 2.5; // 2.5MW inverters
  const inverterUnitCost = 375000; // $375k per 2.5MW inverter
  const inverterQuantity = Math.ceil(storageSizeMW / inverterUnitPowerMW);
  
  const inverters = {
    quantity: inverterQuantity,
    unitPowerMW: inverterUnitPowerMW,
    unitCost: inverterUnitCost,
    totalCost: inverterQuantity * inverterUnitCost,
    manufacturer: "SMA Solar",
    model: "MVPS 2500"
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

  // Generator Calculations (if specified)
  let generators = undefined;
  if (generatorMW > 0) {
    const generatorUnitMW = 2; // 2MW diesel generators
    const generatorUnitCost = 800000; // $800k per 2MW generator
    const generatorQuantity = Math.ceil(generatorMW / generatorUnitMW);
    
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
    
    solar = {
      totalMW: solarMW,
      panelQuantity: solarMW * panelsPerMW,
      inverterQuantity: solarMW * solarInvertersPerMW,
      totalCost: solarMW * 1000000 * costPerWatt,
      costPerWatt: costPerWatt
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