// Comprehensive calculation formulas and methodology for BESS quotes
// This provides full transparency for users to understand and verify our numbers

export interface CalculationBreakdown {
  section: string;
  category: string;
  formula: string;
  variables: { name: string; value: string | number; unit?: string }[];
  result: number;
  resultUnit: string;
  explanation: string;
  assumptions?: string[];
}

export const generateCalculationBreakdown = (
  powerMW: number,
  duration: number,
  solarMW: number,
  windMW: number,
  generatorMW: number,
  batteryKwh: number,
  pcsKw: number,
  bosPercent: number,
  epcPercent: number,
  genKw: number,
  solarKwp: number,
  windKw: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  location: string,
  selectedApplications?: string[],
  applicationConfigs?: any
): CalculationBreakdown[] => {
  
  const calculations: CalculationBreakdown[] = [];

  // ============================================
  // SECTION 1: BESS SIZING CALCULATIONS
  // ============================================
  
  const totalMWh = powerMW * duration;
  const totalKWh = totalMWh * 1000;
  const pcsKW = powerMW * 1000;

  calculations.push({
    section: 'BESS Sizing',
    category: 'Energy Capacity',
    formula: 'Energy (MWh) = Power (MW) × Duration (hours)',
    variables: [
      { name: 'Power', value: powerMW, unit: 'MW' },
      { name: 'Duration', value: duration, unit: 'hours' },
    ],
    result: totalMWh,
    resultUnit: 'MWh',
    explanation: 'Total energy storage capacity determines how long the system can deliver rated power.',
    assumptions: [
      'Usable capacity assumes 90-95% depth of discharge (DoD)',
      'Rated capacity at 25°C ambient temperature',
    ],
  });

  calculations.push({
    section: 'BESS Sizing',
    category: 'Power Capacity',
    formula: 'PCS Capacity (kW) = Power (MW) × 1000',
    variables: [
      { name: 'Power', value: powerMW, unit: 'MW' },
      { name: 'Conversion Factor', value: 1000, unit: 'kW/MW' },
    ],
    result: pcsKW,
    resultUnit: 'kW',
    explanation: 'Power Conversion System (PCS) capacity determines maximum instantaneous power output.',
    assumptions: [
      'Bidirectional inverters (charge/discharge)',
      '95-98% round-trip efficiency',
    ],
  });

  // ============================================
  // SECTION 2: EQUIPMENT COST CALCULATIONS
  // ============================================

  const batterySubtotal = totalKWh * batteryKwh;
  calculations.push({
    section: 'Equipment Costs',
    category: 'Battery System',
    formula: 'Battery Cost = Energy (kWh) × Unit Price ($/kWh)',
    variables: [
      { name: 'Energy Capacity', value: totalKWh, unit: 'kWh' },
      { name: 'Unit Price', value: batteryKwh, unit: '$/kWh' },
    ],
    result: batterySubtotal,
    resultUnit: '$',
    explanation: 'Lithium-ion battery pack including cells, BMS (Battery Management System), thermal management, and enclosures.',
    assumptions: [
      'LFP (Lithium Iron Phosphate) or NMC chemistry',
      '15-20 year design life, 6,000-8,000 cycles',
      'Includes integrated fire suppression system',
    ],
  });

  const pcsSubtotal = pcsKW * pcsKw;
  calculations.push({
    section: 'Equipment Costs',
    category: 'Power Conversion System',
    formula: 'PCS Cost = Power (kW) × Unit Price ($/kW)',
    variables: [
      { name: 'PCS Capacity', value: pcsKW, unit: 'kW' },
      { name: 'Unit Price', value: pcsKw, unit: '$/kW' },
    ],
    result: pcsSubtotal,
    resultUnit: '$',
    explanation: 'Bidirectional inverters converting DC (battery) to AC (grid) and vice versa.',
    assumptions: [
      'Grid-forming or grid-following capability',
      'Harmonic filtering and power quality control',
      'Remote monitoring and SCADA integration',
    ],
  });

  // Generator costs
  let generatorSubtotal = 0;
  if (generatorMW > 0) {
    generatorSubtotal = generatorMW * 1000 * genKw;
    calculations.push({
      section: 'Equipment Costs',
      category: 'Generator',
      formula: 'Generator Cost = Power (MW) × 1000 × Unit Price ($/kW)',
      variables: [
        { name: 'Generator Capacity', value: generatorMW, unit: 'MW' },
        { name: 'Conversion Factor', value: 1000, unit: 'kW/MW' },
        { name: 'Unit Price', value: genKw, unit: '$/kW' },
      ],
      result: generatorSubtotal,
      resultUnit: '$',
      explanation: 'Backup generator system for hybrid configurations (diesel, natural gas, or dual-fuel).',
      assumptions: [
        'Industrial-grade genset with automatic transfer switch',
        'Includes fuel tank (24-48 hour runtime)',
        '25-year design life with proper maintenance',
      ],
    });
  }

  // Solar costs
  let solarSubtotal = 0;
  if (solarMW > 0) {
    solarSubtotal = solarMW * 1000 * (solarKwp / 1000);
    calculations.push({
      section: 'Equipment Costs',
      category: 'Solar PV',
      formula: 'Solar Cost = Capacity (MW) × 1000 × Unit Price ($/Wp)',
      variables: [
        { name: 'Solar Capacity', value: solarMW, unit: 'MWp' },
        { name: 'Conversion Factor', value: 1000, unit: 'kWp/MWp' },
        { name: 'Unit Price', value: solarKwp / 1000, unit: '$/Wp' },
      ],
      result: solarSubtotal,
      resultUnit: '$',
      explanation: 'Solar photovoltaic array with racking, mounting, and balance of system.',
      assumptions: [
        'Monocrystalline or bifacial panels (20-22% efficiency)',
        '25-year performance warranty (80% output)',
        'Fixed-tilt or single-axis tracking',
      ],
    });
  }

  // Wind costs
  let windSubtotal = 0;
  if (windMW > 0) {
    windSubtotal = windMW * 1000 * (windKw / 1000);
    calculations.push({
      section: 'Equipment Costs',
      category: 'Wind Turbines',
      formula: 'Wind Cost = Capacity (MW) × 1000 × Unit Price ($/W)',
      variables: [
        { name: 'Wind Capacity', value: windMW, unit: 'MW' },
        { name: 'Conversion Factor', value: 1000, unit: 'kW/MW' },
        { name: 'Unit Price', value: windKw / 1000, unit: '$/W' },
      ],
      result: windSubtotal,
      resultUnit: '$',
      explanation: 'Wind turbines including tower, foundation, and grid connection.',
      assumptions: [
        'Horizontal axis wind turbines (HAWT)',
        '20-25 year design life',
        'Capacity factor: 30-40% (site dependent)',
      ],
    });
  }

  // ============================================
  // SECTION 3: BALANCE OF SYSTEM (BOS)
  // ============================================

  const equipmentSubtotal = batterySubtotal + pcsSubtotal;
  const bosAmount = equipmentSubtotal * bosPercent;
  
  calculations.push({
    section: 'Balance of System',
    category: 'BOS Costs',
    formula: 'BOS = (Battery + PCS) × BOS %',
    variables: [
      { name: 'Battery Subtotal', value: batterySubtotal, unit: '$' },
      { name: 'PCS Subtotal', value: pcsSubtotal, unit: '$' },
      { name: 'BOS Percentage', value: bosPercent * 100, unit: '%' },
    ],
    result: bosAmount,
    resultUnit: '$',
    explanation: 'Balance of System includes all supporting infrastructure for the BESS.',
    assumptions: [
      'HVAC/thermal management system',
      'Fire detection and suppression (FM-200 or water mist)',
      'Electrical wiring, conduit, and bus bars',
      'Structural mounting and enclosures',
      'Monitoring and control systems (SCADA)',
      'Safety equipment and signage',
      'Typically 10-15% of equipment cost',
    ],
  });

  // ============================================
  // SECTION 4: EPC & INSTALLATION
  // ============================================

  const subtotalBeforeEPC = equipmentSubtotal + bosAmount;
  const epcAmount = subtotalBeforeEPC * epcPercent;
  
  calculations.push({
    section: 'EPC & Installation',
    category: 'EPC Costs',
    formula: 'EPC = (Equipment + BOS) × EPC %',
    variables: [
      { name: 'Equipment Subtotal', value: equipmentSubtotal, unit: '$' },
      { name: 'BOS Amount', value: bosAmount, unit: '$' },
      { name: 'EPC Percentage', value: epcPercent * 100, unit: '%' },
    ],
    result: epcAmount,
    resultUnit: '$',
    explanation: 'Engineering, Procurement, and Construction (EPC) covers design, installation, and commissioning.',
    assumptions: [
      'Engineering: system design, electrical drawings, permits',
      'Procurement: vendor management, logistics coordination',
      'Construction: site preparation, installation, testing',
      'Commissioning: system startup, performance verification',
      'Project management and quality assurance',
      'Typically 12-18% of equipment + BOS cost',
    ],
  });

  const bessCapEx = batterySubtotal + pcsSubtotal + bosAmount + epcAmount;
  
  calculations.push({
    section: 'BESS Total',
    category: 'BESS Capital Cost',
    formula: 'BESS CapEx = Battery + PCS + BOS + EPC',
    variables: [
      { name: 'Battery System', value: batterySubtotal, unit: '$' },
      { name: 'PCS', value: pcsSubtotal, unit: '$' },
      { name: 'BOS', value: bosAmount, unit: '$' },
      { name: 'EPC', value: epcAmount, unit: '$' },
    ],
    result: bessCapEx,
    resultUnit: '$',
    explanation: 'Total Battery Energy Storage System capital expenditure (turnkey installed cost).',
  });

  // ============================================
  // SECTION 5: TARIFFS & SHIPPING
  // ============================================

  const batteryTariffRate = 0.21; // Example: 21% for batteries (China to US)
  const otherTariffRate = 0.06; // Example: 6% for other equipment
  
  const batteryTariff = bessCapEx * batteryTariffRate;
  const otherTariff = (generatorSubtotal + solarSubtotal + windSubtotal) * otherTariffRate;
  const totalTariffs = batteryTariff + otherTariff;

  calculations.push({
    section: 'Tariffs & Duties',
    category: 'Battery Tariffs',
    formula: 'Battery Tariff = BESS CapEx × Tariff Rate',
    variables: [
      { name: 'BESS CapEx', value: bessCapEx, unit: '$' },
      { name: 'Tariff Rate', value: batteryTariffRate * 100, unit: '%' },
    ],
    result: batteryTariff,
    resultUnit: '$',
    explanation: 'Import tariffs on battery systems (country/region dependent).',
    assumptions: [
      'Based on destination country regulations',
      'May vary by country of origin',
      'Subject to trade policy changes',
    ],
  });

  if (generatorSubtotal + solarSubtotal + windSubtotal > 0) {
    calculations.push({
      section: 'Tariffs & Duties',
      category: 'Other Equipment Tariffs',
      formula: 'Other Tariff = (Gen + Solar + Wind) × Tariff Rate',
      variables: [
        { name: 'Generator', value: generatorSubtotal, unit: '$' },
        { name: 'Solar', value: solarSubtotal, unit: '$' },
        { name: 'Wind', value: windSubtotal, unit: '$' },
        { name: 'Tariff Rate', value: otherTariffRate * 100, unit: '%' },
      ],
      result: otherTariff,
      resultUnit: '$',
      explanation: 'Import tariffs on renewable energy equipment and generators.',
    });
  }

  // ============================================
  // SECTION 6: APPLICATION-SPECIFIC COSTS
  // ============================================

  if (selectedApplications && selectedApplications.length > 0) {
    selectedApplications.forEach((app) => {
      const config = applicationConfigs?.[app];
      
      if (app === 'EV Charging Stations' && config) {
        const chargerCost = config.chargerType === 'DC' 
          ? (config.voltage === '600V' ? 80000 : config.voltage === '480V' ? 50000 : 35000)
          : 8000;
        const totalChargerCost = chargerCost * config.numChargers;
        
        const transformerCost = config.voltage === '600V' ? 45000 
          : config.voltage === '480V' ? 30000 
          : 15000;

        calculations.push({
          section: 'Application Costs',
          category: 'EV Charging Infrastructure',
          formula: 'EV Cost = (Charger Cost × Quantity) + Transformer',
          variables: [
            { name: 'Charger Type', value: `${config.chargerType} ${config.voltage}`, unit: '' },
            { name: 'Cost per Charger', value: chargerCost, unit: '$' },
            { name: 'Number of Chargers', value: config.numChargers, unit: 'units' },
            { name: 'Transformer Cost', value: transformerCost, unit: '$' },
          ],
          result: totalChargerCost + transformerCost,
          resultUnit: '$',
          explanation: 'EV charging stations with appropriate voltage transformation equipment.',
          assumptions: [
            'Level 2 AC: 7-19 kW (240V)',
            'DC Fast: 50-350 kW depending on voltage',
            'Includes installation and electrical work',
          ],
        });
      }

      if (app === 'Data Centers' && config) {
        const upsCost = config.serverCapacityKW * 500;
        const redundancyCost = config.redundancyLevel === '2N' ? 250000 
          : config.redundancyLevel === 'N+1' ? 100000 
          : 0;

        calculations.push({
          section: 'Application Costs',
          category: 'Data Center Infrastructure',
          formula: 'Data Center Cost = (Capacity × UPS Rate) + Redundancy',
          variables: [
            { name: 'Server Capacity', value: config.serverCapacityKW, unit: 'kW' },
            { name: 'UPS Cost Rate', value: 500, unit: '$/kW' },
            { name: 'Redundancy Level', value: config.redundancyLevel, unit: '' },
            { name: 'Redundancy Cost', value: redundancyCost, unit: '$' },
          ],
          result: upsCost + redundancyCost,
          resultUnit: '$',
          explanation: 'UPS systems and redundancy infrastructure for continuous data center operation.',
          assumptions: [
            'N: Single path, no redundancy',
            'N+1: Single path with backup component',
            '2N: Full dual system redundancy',
          ],
        });
      }

      if (app === 'Manufacturing' && config) {
        const criticalCost = 150000;
        const shiftCost = config.loadProfile === '3-shift' ? 80000
          : config.loadProfile === '2-shift' ? 50000
          : 0;

        calculations.push({
          section: 'Application Costs',
          category: 'Manufacturing Support',
          formula: 'Mfg Cost = Critical Load Protection + Shift Support',
          variables: [
            { name: 'Critical Load Protection', value: criticalCost, unit: '$' },
            { name: 'Load Profile', value: config.loadProfile, unit: '' },
            { name: 'Shift Support Cost', value: shiftCost, unit: '$' },
          ],
          result: criticalCost + shiftCost,
          resultUnit: '$',
          explanation: 'Specialized equipment to protect critical manufacturing processes and support multi-shift operations.',
        });
      }
    });
  }

  // ============================================
  // SECTION 7: ROI CALCULATIONS
  // ============================================

  // Peak shaving savings
  const peakRate = 0.18; // Example: $0.18/kWh
  const offPeakRate = 0.08; // Example: $0.08/kWh
  const demandCharge = 15; // Example: $15/kW/month
  
  const annualEnergyMWh = totalMWh * 365; // 1 cycle per day
  const peakShavingSavings = annualEnergyMWh * 1000 * (peakRate - offPeakRate) * 0.7;
  
  calculations.push({
    section: 'Financial Returns',
    category: 'Peak Shaving Savings',
    formula: 'Peak Savings = Energy × 365 × 1000 × (Peak - Off-Peak) × 0.7',
    variables: [
      { name: 'Daily Energy', value: totalMWh, unit: 'MWh' },
      { name: 'Days per Year', value: 365, unit: 'days' },
      { name: 'Peak Rate', value: peakRate, unit: '$/kWh' },
      { name: 'Off-Peak Rate', value: offPeakRate, unit: '$/kWh' },
      { name: 'Efficiency Factor', value: 0.7, unit: '' },
    ],
    result: peakShavingSavings,
    resultUnit: '$/year',
    explanation: 'Annual savings from arbitrage: charge during off-peak hours, discharge during peak hours.',
    assumptions: [
      '1 full cycle per day (365 cycles/year)',
      '70% effective utilization accounting for losses',
      'Round-trip efficiency: 85-90%',
      'Utility rate differential drives arbitrage value',
    ],
  });

  const demandChargeSavings = powerMW * 1000 * demandCharge * 12;
  
  calculations.push({
    section: 'Financial Returns',
    category: 'Demand Charge Reduction',
    formula: 'Demand Savings = Power × 1000 × Demand Charge × 12',
    variables: [
      { name: 'System Power', value: powerMW, unit: 'MW' },
      { name: 'Conversion Factor', value: 1000, unit: 'kW/MW' },
      { name: 'Demand Charge', value: demandCharge, unit: '$/kW/month' },
      { name: 'Months per Year', value: 12, unit: 'months' },
    ],
    result: demandChargeSavings,
    resultUnit: '$/year',
    explanation: 'Annual savings from reducing peak demand charges by shaving demand peaks.',
    assumptions: [
      'Demand charges based on monthly peak kW',
      'BESS can reduce peak by rated capacity',
      'Varies by utility rate structure (commercial/industrial)',
    ],
  });

  const totalAnnualSavings = peakShavingSavings + demandChargeSavings;
  const totalCapEx = bessCapEx + generatorSubtotal + solarSubtotal + windSubtotal + totalTariffs;
  const simplePayback = totalCapEx / totalAnnualSavings;
  const tenYearROI = ((totalAnnualSavings * 10 - totalCapEx) / totalCapEx) * 100;

  calculations.push({
    section: 'Financial Returns',
    category: 'Simple Payback Period',
    formula: 'Payback = Total CapEx ÷ Annual Savings',
    variables: [
      { name: 'Total CapEx', value: totalCapEx, unit: '$' },
      { name: 'Annual Savings', value: totalAnnualSavings, unit: '$/year' },
    ],
    result: simplePayback,
    resultUnit: 'years',
    explanation: 'Number of years to recover initial investment from operational savings (undiscounted).',
    assumptions: [
      'Does not account for time value of money',
      'Assumes constant savings over project life',
      'Does not include maintenance costs (~2-3% annually)',
      'Does not include replacement/augmentation costs',
    ],
  });

  calculations.push({
    section: 'Financial Returns',
    category: '10-Year ROI',
    formula: 'ROI % = ((Savings × 10 - CapEx) ÷ CapEx) × 100',
    variables: [
      { name: 'Annual Savings', value: totalAnnualSavings, unit: '$/year' },
      { name: 'Project Duration', value: 10, unit: 'years' },
      { name: 'Total CapEx', value: totalCapEx, unit: '$' },
    ],
    result: tenYearROI,
    resultUnit: '%',
    explanation: 'Return on Investment over 10-year period as a percentage of initial capital.',
    assumptions: [
      'Simple ROI calculation (not IRR or NPV)',
      'Does not account for degradation (5-10% over 10 years)',
      'Does not include incentives/tax credits',
      'Conservative estimate for planning purposes',
    ],
  });

  return calculations;
};

// Format calculation breakdown for display or export
export const formatCalculationForDisplay = (calc: CalculationBreakdown): string => {
  let output = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `${calc.section} > ${calc.category}\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  output += `FORMULA:\n${calc.formula}\n\n`;
  output += `VARIABLES:\n`;
  calc.variables.forEach((v) => {
    const unit = v.unit ? ` ${v.unit}` : '';
    const value = typeof v.value === 'number' ? v.value.toLocaleString() : v.value;
    output += `  • ${v.name}: ${value}${unit}\n`;
  });
  output += `\nRESULT: ${calc.result.toLocaleString()} ${calc.resultUnit}\n\n`;
  output += `EXPLANATION:\n${calc.explanation}\n`;
  if (calc.assumptions && calc.assumptions.length > 0) {
    output += `\nASSUMPTIONS:\n`;
    calc.assumptions.forEach((a) => {
      output += `  • ${a}\n`;
    });
  }
  return output;
};

// Export all calculations to text format
export const exportCalculationsToText = (calculations: CalculationBreakdown[]): string => {
  let output = `╔═══════════════════════════════════════════════════════════════╗\n`;
  output += `║         MERLIN BESS QUOTE - CALCULATION BREAKDOWN            ║\n`;
  output += `║              Detailed Formula Transparency                    ║\n`;
  output += `╚═══════════════════════════════════════════════════════════════╝\n\n`;
  output += `Generated: ${new Date().toLocaleString()}\n\n`;
  output += `This document provides complete transparency into how your BESS\n`;
  output += `quote was calculated. All formulas, variables, assumptions, and\n`;
  output += `data sources are documented for verification and trust.\n\n`;
  
  calculations.forEach((calc) => {
    output += formatCalculationForDisplay(calc);
  });
  
  output += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  output += `DATA SOURCES & REFERENCES\n`;
  output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  output += `• BNEF (Bloomberg New Energy Finance) - Battery pricing\n`;
  output += `• Wood Mackenzie - Solar, wind, and PCS market data\n`;
  output += `• SEIA (Solar Energy Industries Association) - Solar costs\n`;
  output += `• AWEA (American Wind Energy Association) - Wind pricing\n`;
  output += `• EIA (Energy Information Administration) - Utility rates\n`;
  output += `• Industry standard percentages - BOS (10-15%), EPC (12-18%)\n\n`;
  output += `All pricing updated quarterly to reflect current market conditions.\n`;
  output += `Last updated: Q4 2025\n\n`;
  
  return output;
};
