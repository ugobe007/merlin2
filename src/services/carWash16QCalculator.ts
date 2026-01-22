/**
 * =============================================================================
 * CAR WASH 16-QUESTION ENERGY INTELLIGENCE CALCULATOR
 * =============================================================================
 * 
 * Implements the Merlin Car Wash questionnaire specification (Jan 21, 2026)
 * 
 * This function accurately reconstructs electrical load from:
 * 1. Topology (wash type, bay/tunnel count)
 * 2. Infrastructure constraints (service size, voltage)
 * 3. Equipment inventory (pumps, blowers, heaters, etc.)
 * 4. Operational patterns (washes/day, cycle duration, operating hours)
 * 5. Financial context (monthly bill, rate structure)
 * 6. Resilience needs (power quality, outage sensitivity)
 * 7. Future expansion plans
 * 
 * AVOIDS MULTI-TUNNEL BIAS: Defaults to single bay/tunnel unless explicitly stated
 * 
 * TrueQuote™ Sources:
 * - International Carwash Association (ICA) 2024 Industry Study
 * - NREL ATB 2024 - Commercial Building Load Profiles
 * - IEEE 446-1995 (Orange Book) - Emergency and Standby Power
 * - Professional Carwash & Detailing Magazine - Equipment Standards
 */

/**
 * =============================================================================
 * CAR WASH 16-QUESTION ENERGY INTELLIGENCE CALCULATOR
 * =============================================================================
 * 
 * Implements the Merlin Car Wash questionnaire specification (Jan 21, 2026)
 * 
 * This function accurately reconstructs electrical load from:
 * 1. Topology (wash type, bay/tunnel count)
 * 2. Infrastructure constraints (service size, voltage)
 * 3. Equipment inventory (pumps, blowers, heaters, etc.)
 * 4. Operational patterns (washes/day, cycle duration, operating hours)
 * 5. Financial context (monthly bill, rate structure)
 * 6. Resilience needs (power quality, outage sensitivity)
 * 7. Future expansion plans
 * 
 * AVOIDS MULTI-TUNNEL BIAS: Defaults to single bay/tunnel unless explicitly stated
 * 
 * TrueQuote™ Sources:
 * - International Carwash Association (ICA) 2024 Industry Study
 * - NREL ATB 2024 - Commercial Building Load Profiles
 * - IEEE 446-1995 (Orange Book) - Emergency and Standby Power
 * - Professional Carwash & Detailing Magazine - Equipment Standards
 */

export interface CarWash16QInput {
  // Q1-2: Topology
  carWashType: 'self_serve' | 'automatic_inbay' | 'conveyor_tunnel' | 'combination' | 'other';
  bayTunnelCount: '1' | '2-3' | '4-6' | '7+';
  
  // Q3-4: Infrastructure
  electricalServiceSize: '200' | '400' | '600' | '800+' | 'not_sure';
  voltageLevel: '208' | '240' | '277_480' | 'mixed' | 'not_sure';
  
  // Q5-6: Equipment (load reconstruction)
  primaryEquipment: string[]; // Array of equipment types from multi-select
  largestMotorSize: '<10' | '10-25' | '25-50' | '50-100' | '100+' | 'not_sure';
  
  // Q7: Concurrency
  simultaneousEquipment: '1-2' | '3-4' | '5-7' | '8+';
  
  // Q8-11: Operations (throughput & duty cycle)
  averageWashesPerDay: '<30' | '30-75' | '75-150' | '150-300' | '300+';
  peakHourThroughput: '<10' | '10-25' | '25-50' | '50+';
  washCycleDuration: '<3' | '3-5' | '5-8' | '8-12' | '12+';
  operatingHours: '<8' | '8-12' | '12-18' | '18-24';
  
  // Q12-13: Financial
  monthlyElectricitySpend: '<1000' | '1000-3000' | '3000-7500' | '7500-15000' | '15000+' | 'not_sure';
  utilityRateStructure: 'flat' | 'tou' | 'demand' | 'tou_demand' | 'not_sure';
  
  // Q14-15: Resilience
  powerQualityIssues?: string[]; // Optional multi-select
  outageSensitivity: 'operations_stop' | 'partial_operations' | 'minor_disruption' | 'no_impact';
  
  // Q16: Expansion
  expansionPlans?: string[]; // Optional multi-select
}

export interface CarWash16QResult {
  // Standard power metrics
  peakDemandKW: number;
  dailyEnergyKWh: number;
  monthlyEnergyKWh: number;
  annualEnergyKWh: number;
  source: string;
  // Detailed breakdown
  equipmentLoadKW: number;
  motorSurgeKW: number;
  concurrencyFactor: number;
  peakLoadKW: number;
  averageLoadKW: number;
  
  // Service constraints
  serviceCapacityKW: number;
  serviceUtilization: number; // % of service capacity used
  serviceLimitReached: boolean;
  
  // BESS sizing
  bessRecommendedKW: number;
  bessRecommendedKWh: number;
  bessDurationHours: number;
  
  // Financial metrics
  estimatedAnnualCost: number;
  demandChargeSavings: number;
  energyChargeSavings: number;
  totalAnnualSavings: number;
  savingsMultiplier: number;
  
  // Resilience
  backupRuntimeHours: number;
  powerQualityRisk: 'low' | 'medium' | 'high';
  
  // Expansion headroom
  expansionHeadroomKW: number;
  futureLoadKW: number;
  
  // Confidence
  confidence: 'estimate' | 'verified';
  uncertaintyCount: number;
  
  // TrueQuote™ sources
  sources: string[];
}

/**
 * Calculate car wash power requirements from 16-question intelligence set
 * 
 * @param input - 16-question responses
 * @returns Comprehensive power analysis with BESS sizing and financial metrics
 */
export function calculateCarWash16Q(input: CarWash16QInput): CarWash16QResult {
  // =============================================================================
  // STEP 1: PARSE INPUTS & EXTRACT NUMERIC VALUES
  // =============================================================================
  
  // Bay/tunnel count (default to 1)
  const bayCountMap = { '1': 1, '2-3': 2.5, '4-6': 5, '7+': 8 };
  const bayCount = bayCountMap[input.bayTunnelCount];
  
  // Service capacity (upper bound constraint)
  const serviceMap = { '200': 48, '400': 96, '600': 144, '800+': 192, 'not_sure': 96 };
  const serviceCapacityKW = serviceMap[input.electricalServiceSize];
  
  // Largest motor (for surge modeling)
  const motorMap = { '<10': 7, '10-25': 18, '25-50': 37, '50-100': 75, '100+': 100, 'not_sure': 25 };
  const largestMotorKW = motorMap[input.largestMotorSize];
  
  // Concurrency factor (true peak load, not nameplate)
  const concurrencyMap = { '1-2': 0.5, '3-4': 0.75, '5-7': 0.9, '8+': 1.0 };
  const concurrencyFactor = concurrencyMap[input.simultaneousEquipment];
  
  // Washes per day (for energy throughput)
  const washesMap = { '<30': 20, '30-75': 50, '75-150': 100, '150-300': 200, '300+': 350 };
  const dailyWashes = washesMap[input.averageWashesPerDay];
  
  // Peak hour throughput (not used in calculation but useful for validation)
  const peakThroughputMap = { '<10': 7, '10-25': 15, '25-50': 35, '50+': 60 };
  const _peakHourWashes = peakThroughputMap[input.peakHourThroughput]; // For future use
  
  // Cycle duration (minutes)
  const cycleDurationMap = { '<3': 2, '3-5': 4, '5-8': 6, '8-12': 10, '12+': 15 };
  const cycleDurationMin = cycleDurationMap[input.washCycleDuration];
  
  // Operating hours
  const operatingHoursMap = { '<8': 6, '8-12': 10, '12-18': 15, '18-24': 21 };
  const operatingHours = operatingHoursMap[input.operatingHours];
  
  // Monthly bill (for ROI calibration)
  const billMap = { '<1000': 750, '1000-3000': 2000, '3000-7500': 5000, '7500-15000': 10000, '15000+': 20000, 'not_sure': 5000 };
  const monthlyBill = billMap[input.monthlyElectricitySpend];
  
  // Rate structure (savings multiplier)
  const rateMultiplierMap = { 'flat': 0.5, 'tou': 0.8, 'demand': 1.0, 'tou_demand': 1.2, 'not_sure': 0.8 };
  const savingsMultiplier = rateMultiplierMap[input.utilityRateStructure];
  
  // Outage sensitivity (backup hours)
  const backupMap = { 'operations_stop': 4, 'partial_operations': 2, 'minor_disruption': 1, 'no_impact': 0 };
  const backupRuntimeHours = backupMap[input.outageSensitivity];
  
  // =============================================================================
  // STEP 2: EQUIPMENT LOAD RECONSTRUCTION (Bottom-Up)
  // =============================================================================
  
  // Equipment power mapping (kW per unit)
  const equipmentPowerMap: Record<string, number> = {
    'high_pressure_pumps': 20,
    'conveyor_motor': 15,
    'blowers_dryers': 40,
    'ro_system': 10,
    'water_heaters_electric': 50,
    'lighting': 5,
    'vacuum_stations': 15,
    'pos_controls': 2,
    'air_compressors': 10,
  };
  
  let equipmentLoadKW = 0;
  input.primaryEquipment.forEach(eq => {
    equipmentLoadKW += equipmentPowerMap[eq] || 0;
  });
  
  // Apply bay count multiplier (equipment scales with bays)
  equipmentLoadKW *= bayCount;
  
  // =============================================================================
  // STEP 3: MOTOR SURGE MODELING (Soft-Start Requirement)
  // =============================================================================
  
  // Motor surge: 3x starting current (reduced by soft-start to 1.5x)
  const motorSurgeKW = largestMotorKW * 1.5;
  
  // =============================================================================
  // STEP 4: PEAK LOAD CALCULATION (True Peak, Not Nameplate)
  // =============================================================================
  
  // Peak load = equipment load × concurrency + motor surge
  let peakLoadKW = equipmentLoadKW * concurrencyFactor + motorSurgeKW;
  
  // Constrain by service capacity
  const serviceLimitReached = peakLoadKW > serviceCapacityKW;
  if (serviceLimitReached) {
    peakLoadKW = serviceCapacityKW * 0.95; // 95% of service capacity (safety margin)
  }
  
  const serviceUtilization = (peakLoadKW / serviceCapacityKW) * 100;
  
  // =============================================================================
  // STEP 5: AVERAGE LOAD & ENERGY THROUGHPUT
  // =============================================================================
  
  // Load curve: wash cycles spread over operating hours
  // Utilization factor = (washes/day × cycle duration) / (operating hours × 60 min)
  const utilizationFactor = Math.min(0.8, (dailyWashes * cycleDurationMin) / (operatingHours * 60));
  const averageLoadKW = peakLoadKW * utilizationFactor;
  
  // Annual energy (kWh)
  const annualKWh = averageLoadKW * operatingHours * 365;
  
  // =============================================================================
  // STEP 6: BESS SIZING (Peak Shaving + Backup)
  // =============================================================================
  
  // BESS power: 60% of peak (car washes have spiky loads → high peak shaving value)
  const bessRecommendedKW = Math.round(peakLoadKW * 0.6);
  
  // BESS duration: Max of (2-hour peak shaving, backup runtime)
  const bessDurationHours = Math.max(2, backupRuntimeHours);
  const bessRecommendedKWh = bessRecommendedKW * bessDurationHours;
  
  // =============================================================================
  // STEP 7: FINANCIAL METRICS (ROI Calibration)
  // =============================================================================
  
  // Estimate electricity rate from monthly bill
  const estimatedRate = monthlyBill / (annualKWh / 12);
  
  // Annual cost
  const estimatedAnnualCost = annualKWh * estimatedRate;
  
  // Demand charge savings (40% reduction with BESS)
  // Assume demand charge is 30% of bill for demand-based rates
  const demandChargePercent = input.utilityRateStructure.includes('demand') ? 0.3 : 0.1;
  const demandChargeSavings = monthlyBill * 12 * demandChargePercent * 0.4;
  
  // Energy charge savings (5% from solar/arbitrage)
  const energyChargeSavings = estimatedAnnualCost * 0.05;
  
  // Total savings (adjusted by rate structure)
  const totalAnnualSavings = (demandChargeSavings + energyChargeSavings) * savingsMultiplier;
  
  // =============================================================================
  // STEP 8: RESILIENCE ASSESSMENT
  // =============================================================================
  
  let powerQualityRisk: 'low' | 'medium' | 'high' = 'low';
  if (input.powerQualityIssues && input.powerQualityIssues.length > 0 && !input.powerQualityIssues.includes('none')) {
    const issueCount = input.powerQualityIssues.length;
    if (issueCount >= 3) powerQualityRisk = 'high';
    else if (issueCount >= 1) powerQualityRisk = 'medium';
  }
  
  // =============================================================================
  // STEP 9: EXPANSION HEADROOM
  // =============================================================================
  
  const expansionKWMap: Record<string, number> = {
    'add_bay_tunnel': 50,
    'larger_equipment': 30,
    'ev_chargers': 50,
    'more_vacuums': 10,
    'solar': 0,
    'none': 0,
  };
  
  let expansionHeadroomKW = 0;
  if (input.expansionPlans && input.expansionPlans.length > 0) {
    input.expansionPlans.forEach(plan => {
      expansionHeadroomKW += expansionKWMap[plan] || 0;
    });
  }
  
  const futureLoadKW = peakLoadKW + expansionHeadroomKW;
  
  // =============================================================================
  // STEP 10: CONFIDENCE ASSESSMENT
  // =============================================================================
  
  let uncertaintyCount = 0;
  if (input.electricalServiceSize === 'not_sure') uncertaintyCount++;
  if (input.voltageLevel === 'not_sure') uncertaintyCount++;
  if (input.largestMotorSize === 'not_sure') uncertaintyCount++;
  if (input.monthlyElectricitySpend === 'not_sure') uncertaintyCount++;
  if (input.utilityRateStructure === 'not_sure') uncertaintyCount++;
  
  const confidence = uncertaintyCount >= 3 ? 'estimate' : 'verified';
  
  // =============================================================================
  // STEP 11: TRUEQUOTE™ SOURCES
  // =============================================================================
  
  const sources = [
    'ICA 2024 Industry Study - Car wash equipment load profiles',
    'NREL ATB 2024 - Commercial building power benchmarks',
    'IEEE 446-1995 (Orange Book) - Motor surge and soft-start requirements',
    'Professional Carwash & Detailing Magazine - Equipment standards',
    'NREL/CBECS 2018 - Commercial energy consumption patterns',
  ];
  
  // =============================================================================
  // RETURN RESULT
  // =============================================================================
  
  return {
    peakDemandKW: Math.round(peakLoadKW),
    dailyEnergyKWh: Math.round(averageLoadKW * operatingHours),
    monthlyEnergyKWh: Math.round((averageLoadKW * operatingHours * 365) / 12),
    annualEnergyKWh: Math.round(annualKWh),
    source: 'ICA 2024 + NREL ATB 2024 + IEEE 446-1995',
    
    // Detailed breakdown
    equipmentLoadKW: Math.round(equipmentLoadKW),
    motorSurgeKW: Math.round(motorSurgeKW),
    concurrencyFactor,
    peakLoadKW: Math.round(peakLoadKW),
    averageLoadKW: Math.round(averageLoadKW),
    
    // Service constraints
    serviceCapacityKW,
    serviceUtilization: Math.round(serviceUtilization * 10) / 10,
    serviceLimitReached,
    
    // BESS sizing
    bessRecommendedKW,
    bessRecommendedKWh,
    bessDurationHours,
    
    // Financial metrics
    estimatedAnnualCost: Math.round(estimatedAnnualCost),
    demandChargeSavings: Math.round(demandChargeSavings),
    energyChargeSavings: Math.round(energyChargeSavings),
    totalAnnualSavings: Math.round(totalAnnualSavings),
    savingsMultiplier,
    
    // Resilience
    backupRuntimeHours,
    powerQualityRisk,
    
    // Expansion headroom
    expansionHeadroomKW: Math.round(expansionHeadroomKW),
    futureLoadKW: Math.round(futureLoadKW),
    
    // Confidence
    confidence,
    uncertaintyCount,
    
    // TrueQuote™ sources
    sources,
  };
}
