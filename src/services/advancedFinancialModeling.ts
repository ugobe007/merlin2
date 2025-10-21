/**
 * Advanced Financial Modeling Service
 * Implements professional BESS financial analysis features
 */

export interface BatteryDegradationModel {
  method: 'linear' | 'exponential' | 'calendar' | 'cycle' | 'temp_adjusted' | 'hybrid' | 'warranty' | 'measured';
  yearsData: {
    year: number;
    capacityRemaining: number; // percentage (0-100)
    efcCount: number; // Equivalent Full Cycles
    soh: number; // State of Health
  }[];
}

export interface RevenueStream {
  name: string;
  type: 'peak_shaving' | 'arbitrage' | 'rec' | 'reserve_capacity' | 'demand_charge' | 'frequency_regulation';
  annualRevenue: number;
  monthlyBreakdown: number[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

export interface FinancialMetrics {
  // Basic metrics
  npv: number;
  irr: number;
  simplePayback: number;
  
  // Advanced metrics
  leveredIRR: number;
  unleveredIRR: number;
  dscr: number; // Debt Service Coverage Ratio
  mirr: number; // Modified Internal Rate of Return
  profitabilityIndex: number;
  discountedPayback: number;
}

export interface MonthlyForecast {
  month: number; // 1-480 (40 years * 12 months)
  year: number;
  revenue: number;
  expenses: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  batteryCapacity: number; // percentage
  efcCount: number;
}

export interface ScenarioAnalysis {
  name: string;
  type: 'best' | 'base' | 'worst' | 'custom';
  assumptions: {
    batteryCostMultiplier: number; // 1.0 = base, 0.8 = 20% cheaper
    electricityPriceMultiplier: number;
    degradationRateMultiplier: number;
    utilizationRate: number;
  };
  results: FinancialMetrics;
}

/**
 * Calculate battery degradation over time using different methods
 */
export const calculateBatteryDegradation = (
  initialCapacityMWh: number,
  years: number,
  cyclesPerDay: number,
  method: BatteryDegradationModel['method'] = 'hybrid'
): BatteryDegradationModel => {
  const yearsData: BatteryDegradationModel['yearsData'] = [];
  
  for (let year = 0; year <= years; year++) {
    let capacityRemaining = 100; // percentage
    let efcCount = year * 365 * cyclesPerDay;
    
    switch (method) {
      case 'linear':
        // Simple linear degradation: 2% per year
        capacityRemaining = Math.max(80, 100 - (year * 2));
        break;
        
      case 'exponential':
        // Exponential decay with 0.97 annual factor
        capacityRemaining = Math.max(80, 100 * Math.pow(0.97, year));
        break;
        
      case 'calendar':
        // Calendar aging (time-based): 1.5% per year + square root component
        capacityRemaining = Math.max(80, 100 - (1.5 * year + 0.5 * Math.sqrt(year)));
        break;
        
      case 'cycle':
        // Cycle-based: degradation based on full cycles
        const totalCycles = efcCount;
        const cycleBasedDegradation = (totalCycles / 10000) * 20; // 20% after 10,000 cycles
        capacityRemaining = Math.max(80, 100 - cycleBasedDegradation);
        break;
        
      case 'temp_adjusted':
        // Temperature-adjusted (assuming 25°C average)
        const tempFactor = 1.1; // 10% faster degradation at typical temps
        capacityRemaining = Math.max(80, 100 - (year * 2 * tempFactor));
        break;
        
      case 'hybrid':
        // Combined calendar + cycle aging (most realistic)
        const calendarAging = 1.2 * year;
        const cycleAging = (efcCount / 8000) * 15; // 15% after 8,000 cycles
        const totalDegradation = Math.min(20, calendarAging + cycleAging);
        capacityRemaining = 100 - totalDegradation;
        break;
        
      case 'warranty':
        // Warranty curve: 70% at 10 years, degrading faster early on
        if (year <= 10) {
          capacityRemaining = 100 - (year * 3); // 30% loss in 10 years
        } else {
          capacityRemaining = 70 - ((year - 10) * 1.5); // slower after warranty
        }
        capacityRemaining = Math.max(60, capacityRemaining);
        break;
        
      case 'measured':
        // Based on actual measured data (placeholder)
        // In production, this would use real field data
        capacityRemaining = Math.max(75, 100 - (year * 1.8 + Math.random() * 0.5));
        break;
    }
    
    const soh = capacityRemaining; // State of Health equals capacity remaining
    
    yearsData.push({
      year,
      capacityRemaining: Math.round(capacityRemaining * 10) / 10,
      efcCount: Math.round(efcCount),
      soh: Math.round(soh * 10) / 10
    });
  }
  
  return { method, yearsData };
};

/**
 * Calculate multiple revenue streams
 */
export const calculateRevenueStreams = (
  powerMW: number,
  energyMWh: number,
  peakRateKWh: number,
  offPeakRateKWh: number,
  demandChargeKW: number,
  location: string
): RevenueStream[] => {
  const streams: RevenueStream[] = [];
  
  // 1. Peak Shaving / Arbitrage
  const dailyCycles = 1;
  const annualEnergyMWh = energyMWh * dailyCycles * 365;
  const peakShavingValue = (peakRateKWh - offPeakRateKWh) * 0.7; // 70% efficiency
  const arbitrageRevenue = annualEnergyMWh * 1000 * peakShavingValue;
  
  streams.push({
    name: 'Energy Arbitrage',
    type: 'arbitrage',
    annualRevenue: arbitrageRevenue,
    monthlyBreakdown: Array(12).fill(arbitrageRevenue / 12),
    confidenceLevel: 'high'
  });
  
  // 2. Demand Charge Reduction
  const demandReduction = (powerMW * 1000) * demandChargeKW * 12;
  streams.push({
    name: 'Demand Charge Savings',
    type: 'demand_charge',
    annualRevenue: demandReduction,
    monthlyBreakdown: Array(12).fill(demandReduction / 12),
    confidenceLevel: 'high'
  });
  
  // 3. Renewable Energy Certificates (RECs)
  const recPricePerMWh = 15; // $15/MWh typical
  const recRevenue = annualEnergyMWh * recPricePerMWh;
  streams.push({
    name: 'Renewable Energy Certificates',
    type: 'rec',
    annualRevenue: recRevenue,
    monthlyBreakdown: Array(12).fill(recRevenue / 12),
    confidenceLevel: 'medium'
  });
  
  // 4. Reserve Capacity Market
  const reserveCapacityPrice = 4000; // $/MW-month
  const reserveRevenue = powerMW * reserveCapacityPrice * 12;
  streams.push({
    name: 'Reserve Capacity Market',
    type: 'reserve_capacity',
    annualRevenue: reserveRevenue,
    monthlyBreakdown: Array(12).fill(reserveRevenue / 12),
    confidenceLevel: 'medium'
  });
  
  // 5. Frequency Regulation (if applicable)
  const frequencyRegRevenue = powerMW * 1000 * 8760 * 0.02; // $0.02/kWh-year
  streams.push({
    name: 'Frequency Regulation',
    type: 'frequency_regulation',
    annualRevenue: frequencyRegRevenue,
    monthlyBreakdown: Array(12).fill(frequencyRegRevenue / 12),
    confidenceLevel: 'low'
  });
  
  return streams;
};

/**
 * Generate 40-year monthly forecast
 */
export const generate40YearForecast = (
  initialCapex: number,
  revenueStreams: RevenueStream[],
  degradation: BatteryDegradationModel,
  annualOpex: number,
  escalationRate: number = 0.02 // 2% annual escalation
): MonthlyForecast[] => {
  const forecast: MonthlyForecast[] = [];
  const totalRevenue = revenueStreams.reduce((sum, stream) => sum + stream.annualRevenue, 0);
  
  for (let month = 0; month <= 40 * 12; month++) {
    const year = Math.floor(month / 12);
    const yearData = degradation.yearsData[year] || degradation.yearsData[degradation.yearsData.length - 1];
    
    // Revenue adjusted for degradation and escalation
    const degradationFactor = yearData.capacityRemaining / 100;
    const escalationFactor = Math.pow(1 + escalationRate, year);
    const monthlyRevenue = (totalRevenue / 12) * degradationFactor * escalationFactor;
    
    // Operating expenses
    const monthlyOpex = (annualOpex / 12) * escalationFactor;
    
    // Net cash flow
    const netCashFlow = month === 0 ? -initialCapex : (monthlyRevenue - monthlyOpex);
    const cumulativeCashFlow = month === 0 ? netCashFlow : forecast[month - 1].cumulativeCashFlow + netCashFlow;
    
    forecast.push({
      month,
      year,
      revenue: monthlyRevenue,
      expenses: month === 0 ? initialCapex : monthlyOpex,
      netCashFlow,
      cumulativeCashFlow,
      batteryCapacity: yearData.capacityRemaining,
      efcCount: yearData.efcCount
    });
  }
  
  return forecast;
};

/**
 * Calculate advanced financial metrics
 */
export const calculateAdvancedMetrics = (
  forecast: MonthlyForecast[],
  discountRate: number = 0.08,
  debtRatio: number = 0.70, // 70% debt financing
  interestRate: number = 0.05
): FinancialMetrics => {
  const cashFlows = forecast.map(f => f.netCashFlow);
  
  // NPV calculation
  let npv = 0;
  cashFlows.forEach((cf, i) => {
    npv += cf / Math.pow(1 + discountRate / 12, i);
  });
  
  // IRR calculation (simplified Newton-Raphson)
  let irr = 0.1; // Initial guess
  for (let iter = 0; iter < 20; iter++) {
    let npvAtRate = 0;
    let derivativeAtRate = 0;
    cashFlows.forEach((cf, i) => {
      const period = i / 12;
      npvAtRate += cf / Math.pow(1 + irr, period);
      derivativeAtRate += (-period * cf) / Math.pow(1 + irr, period + 1);
    });
    irr = irr - npvAtRate / derivativeAtRate;
  }
  
  // Simple Payback
  let simplePayback = 0;
  for (let i = 1; i < forecast.length; i++) {
    if (forecast[i].cumulativeCashFlow >= 0) {
      simplePayback = i / 12;
      break;
    }
  }
  
  // Discounted Payback
  let discountedCumulative = 0;
  let discountedPayback = 0;
  for (let i = 0; i < forecast.length; i++) {
    discountedCumulative += forecast[i].netCashFlow / Math.pow(1 + discountRate / 12, i);
    if (discountedCumulative >= 0 && discountedPayback === 0) {
      discountedPayback = i / 12;
      break;
    }
  }
  
  // Levered vs Unlevered IRR
  const initialCapex = Math.abs(forecast[0].netCashFlow);
  const debtAmount = initialCapex * debtRatio;
  const equityAmount = initialCapex * (1 - debtRatio);
  
  // Levered IRR (with debt)
  const debtService = debtAmount * (interestRate / 12) * Math.pow(1 + interestRate / 12, 240) / 
    (Math.pow(1 + interestRate / 12, 240) - 1); // 20-year loan
  
  let leveredIRR = irr * 1.2; // Approximation: leveraged returns are higher
  const unleveredIRR = irr;
  
  // DSCR (Debt Service Coverage Ratio)
  const avgAnnualCashFlow = forecast.slice(12, 24).reduce((sum, f) => sum + f.netCashFlow, 0);
  const annualDebtService = debtService * 12;
  const dscr = avgAnnualCashFlow / annualDebtService;
  
  // MIRR (Modified IRR with reinvestment rate)
  const reinvestmentRate = 0.06;
  let futureValue = 0;
  cashFlows.forEach((cf, i) => {
    if (cf > 0) {
      futureValue += cf * Math.pow(1 + reinvestmentRate / 12, cashFlows.length - i);
    }
  });
  const presentValue = Math.abs(cashFlows[0]);
  const mirr = Math.pow(futureValue / presentValue, 12 / cashFlows.length) - 1;
  
  // Profitability Index
  const pvOfCashFlows = npv + Math.abs(forecast[0].netCashFlow);
  const profitabilityIndex = pvOfCashFlows / Math.abs(forecast[0].netCashFlow);
  
  return {
    npv,
    irr: irr * 100, // Convert to percentage
    simplePayback,
    leveredIRR: leveredIRR * 100,
    unleveredIRR: unleveredIRR * 100,
    dscr,
    mirr: mirr * 100,
    profitabilityIndex,
    discountedPayback
  };
};

/**
 * Run scenario analysis with sensitivity testing
 */
export const runScenarioAnalysis = (
  baseCapex: number,
  baseRevenue: number,
  degradation: BatteryDegradationModel,
  years: number = 40
): ScenarioAnalysis[] => {
  const scenarios: ScenarioAnalysis[] = [];
  
  // Best Case
  const bestForecast = generate40YearForecast(
    baseCapex * 0.85, // 15% lower cost
    [{
      name: 'Best Case Revenue',
      type: 'arbitrage',
      annualRevenue: baseRevenue * 1.2, // 20% higher revenue
      monthlyBreakdown: [],
      confidenceLevel: 'high'
    }],
    { ...degradation, yearsData: degradation.yearsData.map(y => ({ ...y, capacityRemaining: Math.min(100, y.capacityRemaining * 1.05) })) },
    baseRevenue * 0.03 // 3% opex
  );
  scenarios.push({
    name: 'Best Case',
    type: 'best',
    assumptions: {
      batteryCostMultiplier: 0.85,
      electricityPriceMultiplier: 1.2,
      degradationRateMultiplier: 0.9,
      utilizationRate: 0.95
    },
    results: calculateAdvancedMetrics(bestForecast)
  });
  
  // Base Case
  const baseForecast = generate40YearForecast(
    baseCapex,
    [{
      name: 'Base Case Revenue',
      type: 'arbitrage',
      annualRevenue: baseRevenue,
      monthlyBreakdown: [],
      confidenceLevel: 'high'
    }],
    degradation,
    baseRevenue * 0.04 // 4% opex
  );
  scenarios.push({
    name: 'Base Case',
    type: 'base',
    assumptions: {
      batteryCostMultiplier: 1.0,
      electricityPriceMultiplier: 1.0,
      degradationRateMultiplier: 1.0,
      utilizationRate: 0.85
    },
    results: calculateAdvancedMetrics(baseForecast)
  });
  
  // Worst Case
  const worstForecast = generate40YearForecast(
    baseCapex * 1.15, // 15% higher cost
    [{
      name: 'Worst Case Revenue',
      type: 'arbitrage',
      annualRevenue: baseRevenue * 0.75, // 25% lower revenue
      monthlyBreakdown: [],
      confidenceLevel: 'high'
    }],
    { ...degradation, yearsData: degradation.yearsData.map(y => ({ ...y, capacityRemaining: y.capacityRemaining * 0.95 })) },
    baseRevenue * 0.05 // 5% opex
  );
  scenarios.push({
    name: 'Worst Case',
    type: 'worst',
    assumptions: {
      batteryCostMultiplier: 1.15,
      electricityPriceMultiplier: 0.75,
      degradationRateMultiplier: 1.15,
      utilizationRate: 0.65
    },
    results: calculateAdvancedMetrics(worstForecast)
  });
  
  return scenarios;
};
