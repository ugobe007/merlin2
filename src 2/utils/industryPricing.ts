// Industry standard pricing based on market research and typical installations
// Updated regularly based on market conditions (Q4 2025)

export const INDUSTRY_STANDARD_PRICING = {
  // Battery Energy Storage Systems
  battery: {
    largescale: {
      pricePerKWh: 120,
      label: 'Large Scale (≥5 MW)',
      description: 'Utility-scale lithium-ion battery systems',
      source: 'BNEF 2025 Battery Price Survey',
    },
    smallscale: {
      pricePerKWh: 140,
      label: 'Small Scale (<5 MW)',
      description: 'Commercial-scale battery systems',
      source: 'BNEF 2025 Battery Price Survey',
    },
  },

  // Power Conversion Systems
  pcs: {
    standard: {
      pricePerKW: 150,
      label: 'Standard PCS',
      description: 'Grid-tied power conversion system',
      source: 'Wood Mackenzie Q4 2025',
    },
    premium: {
      pricePerKW: 180,
      label: 'Premium PCS',
      description: 'Advanced features, better efficiency',
      source: 'Wood Mackenzie Q4 2025',
    },
  },

  // Solar Photovoltaic
  solar: {
    utility: {
      pricePerKWp: 800,
      label: 'Utility Solar (>5 MW)',
      description: 'Large-scale solar farms',
      source: 'SEIA/Wood Mackenzie Solar Market Insight',
    },
    commercial: {
      pricePerKWp: 1200,
      label: 'Commercial Solar (<5 MW)',
      description: 'Rooftop and ground-mount commercial',
      source: 'SEIA/Wood Mackenzie Solar Market Insight',
    },
  },

  // Wind Turbines
  wind: {
    utility: {
      pricePerKW: 1200,
      label: 'Utility Wind',
      description: 'Large wind turbines (2-5 MW each)',
      source: 'AWEA Annual Market Report 2025',
    },
    distributed: {
      pricePerKW: 1800,
      label: 'Distributed Wind',
      description: 'Smaller turbines (<1 MW)',
      source: 'AWEA Annual Market Report 2025',
    },
  },

  // Generators
  generator: {
    diesel: {
      pricePerKW: 300,
      label: 'Diesel Generator',
      description: 'Industrial diesel genset',
      source: 'Caterpillar/Cummins 2025 Pricing',
    },
    naturalGas: {
      pricePerKW: 350,
      label: 'Natural Gas Generator',
      description: 'NG turbine or reciprocating engine',
      source: 'Caterpillar/Cummins 2025 Pricing',
    },
    dualFuel: {
      pricePerKW: 400,
      label: 'Dual-Fuel Generator',
      description: 'Diesel/NG flexible fuel',
      source: 'Caterpillar/Cummins 2025 Pricing',
    },
  },

  // Balance of System & Installation
  bos: {
    standard: 0.12,
    label: 'Balance of System',
    description: 'Wiring, mounting, HVAC, fire suppression, monitoring',
    typical: '10-15% of equipment cost',
  },

  epc: {
    standard: 0.15,
    label: 'EPC & Installation',
    description: 'Engineering, procurement, construction, commissioning',
    typical: '12-18% of equipment + BoS cost',
  },

  // EV Charging Infrastructure
  evCharging: {
    level2AC: {
      pricePerCharger: 8000,
      label: 'Level 2 AC (240V)',
      description: '7-19 kW charging stations',
      installationCost: 'Includes installation',
    },
    dcFast50: {
      pricePerCharger: 35000,
      label: 'DC Fast 50 kW',
      description: 'Standard DC fast charging',
      installationCost: 'Includes installation',
    },
    dcFast150: {
      pricePerCharger: 50000,
      label: 'DC Fast 150 kW',
      description: 'High-power DC charging',
      installationCost: 'Includes installation',
    },
    dcFast350: {
      pricePerCharger: 80000,
      label: 'DC Fast 350 kW',
      description: 'Ultra-fast DC charging',
      installationCost: 'Includes installation',
    },
  },

  // Data Center Infrastructure
  dataCenter: {
    ups: {
      pricePerKW: 500,
      label: 'UPS System',
      description: 'Uninterruptible power supply',
    },
    redundancyN1: {
      fixedCost: 100000,
      label: 'N+1 Redundancy',
      description: 'Single backup component',
    },
    redundancy2N: {
      fixedCost: 250000,
      label: '2N Redundancy',
      description: 'Full system duplication',
    },
  },

  // Manufacturing Infrastructure
  manufacturing: {
    criticalLoadProtection: {
      fixedCost: 150000,
      label: 'Critical Load Protection',
      description: 'Protect sensitive processes',
    },
    singleShift: {
      fixedCost: 0,
      label: 'Single Shift Support',
      description: '8-hour operation',
    },
    twoShift: {
      fixedCost: 50000,
      label: 'Two Shift Support',
      description: '16-hour operation',
    },
    threeShift: {
      fixedCost: 80000,
      label: 'Three Shift Support',
      description: '24-hour operation',
    },
  },

  // Transformers & Electrical
  transformers: {
    standard: {
      pricePerKW: 50,
      label: 'Step-up/Step-down Transformer',
      description: 'Standard utility-grade',
    },
    evCharging: {
      voltage208: 15000,
      voltage480: 30000,
      voltage600: 45000,
      label: 'EV Charging Transformers',
    },
  },

  // Other Applications (Base Costs)
  applications: {
    industrialBackup: 200000,
    gridStabilization: 150000,
    renewableIntegration: 100000,
    peakShaving: 75000,
    other: 50000,
  },

  // Regional Tariff Rates
  tariffs: {
    'North America': 0.0125,
    'Europe': 0.045,
    'Asia Pacific': 0.075,
    'Middle East': 0.10,
    'Africa': 0.15,
    'South America': 0.115,
  },

  // Shipping Costs ($/kg by region)
  shipping: {
    'North America': 2.5,
    'Europe': 3.5,
    'Asia Pacific': 4.5,
    'Middle East': 5.5,
    'Africa': 6.5,
    'South America': 5.0,
  },
};

// Helper function to apply industry standard pricing
export const applyIndustryStandards = (systemSize: number) => {
  const isBatteryLargeScale = systemSize >= 5;
  
  return {
    batteryKwh: isBatteryLargeScale 
      ? INDUSTRY_STANDARD_PRICING.battery.largescale.pricePerKWh 
      : INDUSTRY_STANDARD_PRICING.battery.smallscale.pricePerKWh,
    pcsKw: INDUSTRY_STANDARD_PRICING.pcs.standard.pricePerKW,
    solarKwp: systemSize >= 5 
      ? INDUSTRY_STANDARD_PRICING.solar.utility.pricePerKWp 
      : INDUSTRY_STANDARD_PRICING.solar.commercial.pricePerKWp,
    windKw: INDUSTRY_STANDARD_PRICING.wind.utility.pricePerKW,
    genKw: INDUSTRY_STANDARD_PRICING.generator.diesel.pricePerKW,
    bosPercent: INDUSTRY_STANDARD_PRICING.bos.standard,
    epcPercent: INDUSTRY_STANDARD_PRICING.epc.standard,
  };
};

// Get pricing explanation for tooltip/modal
export const getPricingExplanation = (category: string, type: string) => {
  const pricing = INDUSTRY_STANDARD_PRICING as any;
  if (pricing[category] && pricing[category][type]) {
    const item = pricing[category][type];
    return {
      label: item.label,
      description: item.description,
      source: item.source || 'Industry Average 2025',
    };
  }
  return null;
};
