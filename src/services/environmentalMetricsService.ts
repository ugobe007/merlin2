/**
 * ENVIRONMENTAL METRICS SERVICE
 * =============================
 *
 * Calculates CO2 avoided, carbon credits, and ESG metrics.
 *
 * Data Sources:
 * - EPA eGRID (US grid emissions by region)
 * - IEA (International grid factors)
 * - EPA GHG Equivalencies Calculator
 *
 * Version: 1.0.0
 * Date: December 3, 2025
 */

// ============================================================================
// GRID EMISSION FACTORS BY REGION (kg CO2/kWh)
// ============================================================================

export const GRID_EMISSION_FACTORS = {
  // US Regions (EPA eGRID 2023)
  "US-WECC": 0.322, // Western US (CA, OR, WA, NV, AZ)
  "US-ERCOT": 0.396, // Texas
  "US-RFC": 0.437, // Midwest/Mid-Atlantic
  "US-SERC": 0.452, // Southeast
  "US-NPCC": 0.251, // Northeast (cleaner grid)
  "US-SPP": 0.402, // Central Plains
  "US-MRO": 0.485, // Upper Midwest
  "US-FRCC": 0.415, // Florida
  "US-HICC": 0.682, // Hawaii (diesel heavy)
  "US-ASCC": 0.423, // Alaska

  // US State-specific (high impact states)
  California: 0.225, // Very clean grid
  Texas: 0.396,
  "New York": 0.215, // Clean grid
  Florida: 0.415,
  Washington: 0.082, // Hydro-dominant
  Oregon: 0.148, // Hydro-dominant
  Arizona: 0.375,
  Nevada: 0.342,
  Colorado: 0.452,
  Illinois: 0.315, // Nuclear heavy
  Pennsylvania: 0.342,
  Ohio: 0.485,
  Michigan: 0.452,
  Georgia: 0.418,
  "North Carolina": 0.392,
  Virginia: 0.358,
  Massachusetts: 0.285,
  "New Jersey": 0.252,
  Hawaii: 0.682,

  // International
  "EU-Average": 0.256,
  UK: 0.182,
  Germany: 0.338,
  France: 0.052, // Nuclear dominant
  Spain: 0.168,
  Italy: 0.315,
  Netherlands: 0.328,
  Australia: 0.656,
  Japan: 0.452,
  "South Korea": 0.415,
  China: 0.555,
  India: 0.708,
  Canada: 0.128, // Hydro dominant
  Mexico: 0.458,
  Brazil: 0.092, // Hydro dominant
  UAE: 0.425,
  "Saudi Arabia": 0.652,

  // Default
  default: 0.4, // US average
};

// ============================================================================
// EMISSION EQUIVALENCIES (EPA GHG Equivalencies Calculator)
// ============================================================================

export const EMISSION_EQUIVALENCIES = {
  // Metric tons CO2 avoided per unit
  treesPlantedPerTonCO2: 16.5, // Trees planted and grown for 10 years
  carsOffRoadPerTonCO2: 0.217, // Passenger vehicles driven for one year
  homeElectricityPerTonCO2: 0.122, // Homes' electricity use for one year
  gasolineGallonsPerTonCO2: 113, // Gallons of gasoline consumed
  coalPoundsPerTonCO2: 1047, // Pounds of coal burned
  propaneGallonsPerTonCO2: 175, // Gallons of propane burned
  acresForestedPerTonCO2: 0.84, // Acres of US forests storing carbon for one year
  smartphonesChargedPerTonCO2: 121643, // Smartphones charged
  milesNotDrivenPerTonCO2: 2481, // Miles not driven by average car
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface EnvironmentalMetrics {
  // Core CO2 metrics
  co2AvoidedKgPerYear: number;
  co2AvoidedTonsPerYear: number;
  co2Avoided25YearsTons: number;

  // Emission factor used
  gridEmissionFactor: number;
  gridRegion: string;

  // Human-readable equivalencies
  equivalencies: {
    treesPlanted: number;
    carsOffRoad: number;
    homesElectricity: number;
    gasolineGallons: number;
    milesNotDriven: number;
    smartphonesCharged: number;
  };

  // Carbon credit potential (voluntary market)
  carbonCreditValue: {
    lowEstimate: number; // $15/ton
    midEstimate: number; // $50/ton
    highEstimate: number; // $150/ton (compliance market)
  };

  // Renewable energy metrics
  renewableEnergyMWh: number;
  renewablePercentage: number;
}

export interface CO2CalculationInput {
  // Energy metrics
  annualKWhDisplaced: number; // kWh shifted from grid to BESS
  annualKWhGenerated?: number; // kWh from solar/wind
  annualKWhFromGrid: number; // kWh still drawn from grid

  // Location
  state?: string;
  country?: string;
  gridRegion?: string;

  // System type affects calculation
  systemType: "bess" | "solar" | "wind" | "ev-charging" | "microgrid" | "hybrid";

  // Additional context
  solarMW?: number;
  windMW?: number;
  bessCapacityMWh?: number;
}

// ============================================================================
// MAIN CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get grid emission factor for a location
 */
export function getGridEmissionFactor(location: string): { factor: number; region: string } {
  // Try exact match first
  if (GRID_EMISSION_FACTORS[location as keyof typeof GRID_EMISSION_FACTORS]) {
    return {
      factor: GRID_EMISSION_FACTORS[location as keyof typeof GRID_EMISSION_FACTORS],
      region: location,
    };
  }

  // Try state match
  const stateKey = Object.keys(GRID_EMISSION_FACTORS).find(
    (key) => key.toLowerCase() === location.toLowerCase()
  );
  if (stateKey) {
    return {
      factor: GRID_EMISSION_FACTORS[stateKey as keyof typeof GRID_EMISSION_FACTORS],
      region: stateKey,
    };
  }

  // Default to US average
  return {
    factor: GRID_EMISSION_FACTORS.default,
    region: "US Average",
  };
}

/**
 * Calculate CO2 avoided from displaced grid electricity
 */
export function calculateCO2Avoided(input: CO2CalculationInput): EnvironmentalMetrics {
  const {
    annualKWhDisplaced,
    annualKWhGenerated = 0,
    annualKWhFromGrid,
    state,
    country,
    gridRegion,
    systemType,
    solarMW = 0,
    windMW = 0,
  } = input;

  // Determine grid emission factor
  const location = state || country || gridRegion || "default";
  const { factor: gridEmissionFactor, region } = getGridEmissionFactor(location);

  // Calculate CO2 avoided
  // For BESS: CO2 avoided by shifting peak demand (assume 20% higher emissions at peak)
  // For Solar/Wind: CO2 avoided by generating clean energy
  // For EV Charging: CO2 avoided vs gasoline vehicles

  let co2AvoidedKgPerYear = 0;
  let renewableEnergyMWh = 0;

  switch (systemType) {
    case "bess":
      // BESS shifts demand from peak (dirty) to off-peak (cleaner)
      // Assume 20% emission reduction from time-shifting
      co2AvoidedKgPerYear = annualKWhDisplaced * gridEmissionFactor * 0.2;
      break;

    case "solar":
      // Solar directly displaces grid electricity
      co2AvoidedKgPerYear = annualKWhGenerated * gridEmissionFactor;
      renewableEnergyMWh = annualKWhGenerated / 1000;
      break;

    case "wind":
      // Wind directly displaces grid electricity
      co2AvoidedKgPerYear = annualKWhGenerated * gridEmissionFactor;
      renewableEnergyMWh = annualKWhGenerated / 1000;
      break;

    case "ev-charging": {
      // EV charging with BESS avoids grid peak + enables EV adoption
      // EVs: 0.25 kWh/mile vs ICE: 0.89 kg CO2/mile
      // Net benefit per kWh EV charged ≈ 0.5 kg CO2
      const evEmissionSavingsPerKWh = 0.5; // kg CO2 saved per kWh charged
      co2AvoidedKgPerYear = annualKWhDisplaced * evEmissionSavingsPerKWh;
      break;
    }

    case "microgrid":
    case "hybrid": {
      // Combined effect: solar/wind generation + BESS optimization
      const solarGeneration = solarMW > 0 ? solarMW * 1400 * 1000 : annualKWhGenerated; // 1400 hrs/year
      const windGeneration = windMW > 0 ? windMW * 2500 * 1000 : 0; // 2500 hrs/year capacity factor 28%
      co2AvoidedKgPerYear = (solarGeneration + windGeneration) * gridEmissionFactor;
      co2AvoidedKgPerYear += annualKWhDisplaced * gridEmissionFactor * 0.15; // BESS optimization
      renewableEnergyMWh = (solarGeneration + windGeneration) / 1000;
      break;
    }
  }

  // Convert to tons
  const co2AvoidedTonsPerYear = co2AvoidedKgPerYear / 1000;
  const co2Avoided25YearsTons = co2AvoidedTonsPerYear * 25;

  // Calculate equivalencies
  const equivalencies = {
    treesPlanted: Math.round(co2AvoidedTonsPerYear * EMISSION_EQUIVALENCIES.treesPlantedPerTonCO2),
    carsOffRoad:
      Math.round(co2AvoidedTonsPerYear * EMISSION_EQUIVALENCIES.carsOffRoadPerTonCO2 * 10) / 10,
    homesElectricity:
      Math.round(co2AvoidedTonsPerYear * EMISSION_EQUIVALENCIES.homeElectricityPerTonCO2 * 10) / 10,
    gasolineGallons: Math.round(
      co2AvoidedTonsPerYear * EMISSION_EQUIVALENCIES.gasolineGallonsPerTonCO2
    ),
    milesNotDriven: Math.round(
      co2AvoidedTonsPerYear * EMISSION_EQUIVALENCIES.milesNotDrivenPerTonCO2
    ),
    smartphonesCharged: Math.round(
      co2AvoidedTonsPerYear * EMISSION_EQUIVALENCIES.smartphonesChargedPerTonCO2
    ),
  };

  // Carbon credit value estimates
  const carbonCreditValue = {
    lowEstimate: Math.round(co2AvoidedTonsPerYear * 15), // Voluntary market low
    midEstimate: Math.round(co2AvoidedTonsPerYear * 50), // Voluntary market mid
    highEstimate: Math.round(co2AvoidedTonsPerYear * 150), // Compliance market
  };

  // Renewable percentage
  const totalEnergy = annualKWhFromGrid + (annualKWhGenerated || 0);
  const renewablePercentage =
    totalEnergy > 0 ? Math.round(((annualKWhGenerated || 0) / totalEnergy) * 100) : 0;

  return {
    co2AvoidedKgPerYear: Math.round(co2AvoidedKgPerYear),
    co2AvoidedTonsPerYear: Math.round(co2AvoidedTonsPerYear * 10) / 10,
    co2Avoided25YearsTons: Math.round(co2Avoided25YearsTons),
    gridEmissionFactor,
    gridRegion: region,
    equivalencies,
    carbonCreditValue,
    renewableEnergyMWh: Math.round(renewableEnergyMWh),
    renewablePercentage,
  };
}

/**
 * Quick CO2 calculation for display
 */
export function quickCO2Estimate(
  annualSavingsKWh: number,
  state: string = "California",
  systemType: "bess" | "solar" | "ev-charging" = "bess"
): { co2TonsPerYear: number; treesEquivalent: number } {
  const { factor } = getGridEmissionFactor(state);

  let co2TonsPerYear: number;

  if (systemType === "ev-charging") {
    // EVs save ~0.5 kg CO2 per kWh vs gasoline
    co2TonsPerYear = (annualSavingsKWh * 0.5) / 1000;
  } else if (systemType === "solar") {
    co2TonsPerYear = (annualSavingsKWh * factor) / 1000;
  } else {
    // BESS time-shifting saves ~20% of grid emissions
    co2TonsPerYear = (annualSavingsKWh * factor * 0.2) / 1000;
  }

  return {
    co2TonsPerYear: Math.round(co2TonsPerYear * 10) / 10,
    treesEquivalent: Math.round(co2TonsPerYear * EMISSION_EQUIVALENCIES.treesPlantedPerTonCO2),
  };
}

// ============================================================================
// VERTICAL-SPECIFIC CALCULATIONS
// ============================================================================

/**
 * EV Charging CO2 impact
 */
export function calculateEVChargingCO2Impact(
  annualKWhCharged: number,
  state: string,
  hasBESS: boolean = true
): EnvironmentalMetrics {
  return calculateCO2Avoided({
    annualKWhDisplaced: annualKWhCharged,
    annualKWhFromGrid: hasBESS ? annualKWhCharged * 0.3 : annualKWhCharged,
    state,
    systemType: "ev-charging",
  });
}

/**
 * Solar + BESS CO2 impact
 */
export function calculateSolarBESSCO2Impact(
  solarKW: number,
  bessKWh: number,
  state: string
): EnvironmentalMetrics {
  const annualSolarGeneration = solarKW * 1400; // 1400 capacity hours typical
  const annualBESSCycles = 365; // Daily cycling
  const annualKWhDisplaced = bessKWh * annualBESSCycles;

  return calculateCO2Avoided({
    annualKWhDisplaced,
    annualKWhGenerated: annualSolarGeneration,
    annualKWhFromGrid: annualSolarGeneration * 0.2, // 20% still from grid
    state,
    systemType: "hybrid",
    solarMW: solarKW / 1000,
  });
}

/**
 * Microgrid CO2 impact
 */
export function calculateMicrogridCO2Impact(
  solarMW: number,
  windMW: number,
  bessMWh: number,
  annualLoadMWh: number,
  state: string
): EnvironmentalMetrics {
  const solarGeneration = solarMW * 1400 * 1000; // kWh
  const windGeneration = windMW * 2500 * 1000; // kWh
  const totalRenewable = solarGeneration + windGeneration;
  const gridImport = Math.max(0, annualLoadMWh * 1000 - totalRenewable);

  return calculateCO2Avoided({
    annualKWhDisplaced: bessMWh * 1000 * 365, // Daily cycling
    annualKWhGenerated: totalRenewable,
    annualKWhFromGrid: gridImport,
    state,
    systemType: "microgrid",
    solarMW,
    windMW,
    bessCapacityMWh: bessMWh,
  });
}

export default {
  calculateCO2Avoided,
  quickCO2Estimate,
  calculateEVChargingCO2Impact,
  calculateSolarBESSCO2Impact,
  calculateMicrogridCO2Impact,
  getGridEmissionFactor,
  GRID_EMISSION_FACTORS,
  EMISSION_EQUIVALENCIES,
};
