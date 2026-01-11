/**
 * Solar Sizing Service
 *
 * Purpose: Calculate solar panel and battery requirements for BESS systems
 * Data source: eosense.com off-grid solar sizing methodology
 *
 * Key formulas:
 * 1. Daily Energy = Device Watts × Operating Hours
 * 2. Battery Capacity (Ah) = (Daily Wh × Autonomy Days × 2) ÷ (System Voltage × Temp Factor)
 * 3. Solar Panel Wattage = (Battery Ah × System Voltage) ÷ (PSH × Charge Efficiency)
 *
 * Use cases:
 * - Off-grid BESS installations
 * - Hybrid solar + BESS systems
 * - Peak shaving with solar charging
 * - Backup power extension
 * - Microgrid applications
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SolarBESSSystemInputs {
  dailyLoadkWh: number; // Average daily energy consumption (kWh)
  peakLoadkW: number; // Peak power demand (kW)
  location: string; // City, State for PSH lookup
  autonomyDays: number; // Days of battery backup (typically 3-5)
  systemVoltage: number; // System voltage (12V, 24V, 48V, 480V)
  temperatureC: number; // Average ambient temperature (°C)
}

export interface SolarBESSSystemResults {
  // Battery Sizing
  batteryCapacityAh: number; // Battery capacity in Amp-hours
  batteryCapacitykWh: number; // Battery capacity in kilowatt-hours
  usableCapacitykWh: number; // Usable capacity (50% max discharge)

  // Solar Panel Sizing
  solarPanelWattage: number; // Total solar panel wattage needed
  numberOfPanels: number; // Number of 400W panels
  panelArrayVoltage: number; // Recommended array voltage

  // System Components
  chargeControllerType: "MPPT" | "PWM";
  chargeControllerRating: number; // Amps
  inverterRating: number; // Watts

  // Performance
  peakSunHours: number; // PSH for location (worst month)
  chargeEfficiency: number; // Charge controller efficiency %
  temperatureDerating: number; // Temperature derating factor

  // Economics
  estimatedCostUSD: {
    battery: number;
    solar: number;
    chargeController: number;
    inverter: number;
    installation: number;
    total: number;
  };

  // Comparison
  daysOfAutonomy: number;
  solarToBESSRatio: number; // kW solar per kW BESS
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * Calculate complete solar + BESS system sizing
 */
export function calculateSolarBESSSystem(inputs: SolarBESSSystemInputs): SolarBESSSystemResults {
  const { dailyLoadkWh, peakLoadkW, location, autonomyDays, systemVoltage, temperatureC } = inputs;

  if (import.meta.env.DEV) {
    console.log("☀️  Calculating solar + BESS system...");
  }
  if (import.meta.env.DEV) {
    console.log(`   Daily load: ${dailyLoadkWh} kWh`);
  }
  if (import.meta.env.DEV) {
    console.log(`   Peak load: ${peakLoadkW} kW`);
  }
  if (import.meta.env.DEV) {
    console.log(`   Autonomy: ${autonomyDays} days`);
  }

  // STEP 1: Get Peak Sun Hours for location
  const peakSunHours = getPeakSunHours(location);
  if (import.meta.env.DEV) {
    console.log(`   Peak Sun Hours: ${peakSunHours} hrs/day`);
  }

  // STEP 2: Get temperature derating factor
  const temperatureDerating = getTemperatureDerating(temperatureC);
  if (import.meta.env.DEV) {
    console.log(`   Temperature derating: ${(temperatureDerating * 100).toFixed(0)}%`);
  }

  // STEP 3: Calculate battery capacity
  // Formula: (Daily Wh × Autonomy Days × 2 × 1.1) ÷ (System Voltage × Temp Factor)
  // Multiply by 2 for 50% max discharge (battery life preservation)
  // Multiply by 1.1 for 10% inefficiency buffer
  const dailyWh = dailyLoadkWh * 1000; // Convert to Wh
  const batteryCapacityAh =
    (dailyWh * autonomyDays * 2 * 1.1) / (systemVoltage * temperatureDerating);

  const batteryCapacitykWh = (batteryCapacityAh * systemVoltage) / 1000;
  const usableCapacitykWh = batteryCapacitykWh * 0.5; // 50% max discharge

  if (import.meta.env.DEV) {
    console.log(
      `   Battery: ${batteryCapacityAh.toFixed(0)} Ah = ${batteryCapacitykWh.toFixed(1)} kWh`
    );
  }
  if (import.meta.env.DEV) {
    console.log(`   Usable: ${usableCapacitykWh.toFixed(1)} kWh (50% DoD)`);
  }

  // STEP 4: Determine charge controller type and efficiency
  const chargeControllerType: "MPPT" | "PWM" = systemVoltage >= 48 ? "MPPT" : "PWM";
  const chargeEfficiency = chargeControllerType === "MPPT" ? 0.85 : 0.75;

  if (import.meta.env.DEV) {
    console.log(
      `   Charge controller: ${chargeControllerType} (${(chargeEfficiency * 100).toFixed(0)}% efficient)`
    );
  }

  // STEP 5: Calculate solar panel wattage
  // Formula: (Battery Ah × System Voltage) ÷ (PSH × Charge Efficiency)
  const solarPanelWattage = (batteryCapacityAh * systemVoltage) / (peakSunHours * chargeEfficiency);

  // Calculate number of 400W panels (standard commercial size)
  const numberOfPanels = Math.ceil(solarPanelWattage / 400);
  const actualSolarWattage = numberOfPanels * 400;

  if (import.meta.env.DEV) {
    console.log(
      `   Solar: ${solarPanelWattage.toFixed(0)}W → ${numberOfPanels} × 400W panels = ${actualSolarWattage}W`
    );
  }

  // STEP 6: Calculate charge controller rating
  // Size for 1.25× peak current (NEC safety factor)
  const peakCurrent = (actualSolarWattage / systemVoltage) * 1.25;
  const chargeControllerRating = Math.ceil(peakCurrent / 10) * 10; // Round up to nearest 10A

  // STEP 7: Calculate inverter rating
  // Size for 1.25× peak load (safety factor for surge)
  const inverterRating = Math.ceil((peakLoadkW * 1000 * 1.25) / 100) * 100; // Round to nearest 100W

  // STEP 8: Calculate costs (2025 pricing)
  const costs = {
    battery: batteryCapacitykWh * 250, // $250/kWh for commercial lithium
    solar: actualSolarWattage * 0.5, // $0.50/W for commercial solar
    chargeController: chargeControllerType === "MPPT" ? 2000 : 500, // MPPT more expensive
    inverter: inverterRating * 0.3, // $0.30/W for inverter
    installation: (actualSolarWattage * 0.5 + batteryCapacitykWh * 250) * 0.15, // 15% labor
    total: 0,
  };
  costs.total = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

  // STEP 9: Calculate system ratios
  const solarToBESSRatio = actualSolarWattage / 1000 / (batteryCapacitykWh / 4); // Assume 4-hour BESS

  if (import.meta.env.DEV) {
    console.log(`   Cost estimate: $${costs.total.toLocaleString()}`);
  }
  if (import.meta.env.DEV) {
    console.log(`   Solar:BESS ratio: ${solarToBESSRatio.toFixed(2)}:1`);
  }

  return {
    batteryCapacityAh: Math.round(batteryCapacityAh),
    batteryCapacitykWh: Math.round(batteryCapacitykWh * 10) / 10,
    usableCapacitykWh: Math.round(usableCapacitykWh * 10) / 10,
    solarPanelWattage: Math.round(actualSolarWattage),
    numberOfPanels,
    panelArrayVoltage: systemVoltage,
    chargeControllerType,
    chargeControllerRating,
    inverterRating,
    peakSunHours,
    chargeEfficiency,
    temperatureDerating,
    estimatedCostUSD: {
      battery: Math.round(costs.battery),
      solar: Math.round(costs.solar),
      chargeController: costs.chargeController,
      inverter: Math.round(costs.inverter),
      installation: Math.round(costs.installation),
      total: Math.round(costs.total),
    },
    daysOfAutonomy: autonomyDays,
    solarToBESSRatio: Math.round(solarToBESSRatio * 100) / 100,
  };
}

// ============================================================================
// PEAK SUN HOURS (PSH) DATABASE
// ============================================================================

/**
 * Get Peak Sun Hours for a location
 * Data source: NREL PVWatts Calculator (worst month design)
 *
 * Design philosophy: Size for worst month to ensure year-round operation
 */
export function getPeakSunHours(location: string): number {
  const locationLower = location.toLowerCase();

  // US Cities (worst month PSH)
  const pshDatabase: Record<string, number> = {
    // California
    "los angeles": 4.5,
    "san francisco": 4.0,
    "san diego": 5.0,
    sacramento: 3.5,
    fresno: 3.8,

    // Southwest
    phoenix: 5.5,
    "las vegas": 5.2,
    tucson: 5.3,
    albuquerque: 5.0,

    // Texas
    houston: 3.8,
    dallas: 4.0,
    austin: 4.2,
    "san antonio": 4.3,

    // Southeast
    miami: 4.5,
    atlanta: 3.5,
    tampa: 4.2,
    charlotte: 3.8,

    // Northeast
    "new york": 3.2,
    boston: 3.0,
    philadelphia: 3.3,
    washington: 3.5,

    // Midwest
    chicago: 3.0,
    denver: 4.5,
    minneapolis: 3.2,
    "kansas city": 3.8,

    // Northwest
    seattle: 2.5,
    portland: 2.8,
    boise: 3.5,

    // Default by state (if city not found)
    california: 4.0,
    arizona: 5.2,
    texas: 4.0,
    florida: 4.0,
    nevada: 5.0,
    "new mexico": 5.0,
    colorado: 4.5,
  };

  // Try to find city match
  for (const [key, psh] of Object.entries(pshDatabase)) {
    if (locationLower.includes(key)) {
      return psh;
    }
  }

  // Default: Conservative estimate for unknown locations
  console.warn(`⚠️  Location "${location}" not in database, using default PSH = 3.5`);
  return 3.5;
}

// ============================================================================
// TEMPERATURE DERATING
// ============================================================================

/**
 * Get battery capacity derating factor based on temperature
 * Data source: Battery manufacturer datasheets
 *
 * Lead-acid batteries lose significant capacity in cold weather
 * Lithium batteries are less affected but still derate
 */
export function getTemperatureDerating(temperatureC: number): number {
  // Temperature derating table (for lead-acid, conservative)
  // Lithium batteries perform better but we use conservative values
  if (temperatureC >= 25) return 1.0; // 100% capacity at 25°C+
  if (temperatureC >= 20) return 0.98; // 98% at 20°C
  if (temperatureC >= 10) return 0.95; // 95% at 10°C
  if (temperatureC >= 0) return 0.9; // 90% at 0°C
  if (temperatureC >= -10) return 0.8; // 80% at -10°C
  if (temperatureC >= -20) return 0.65; // 65% at -20°C
  return 0.5; // 50% below -20°C
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate optimal panel tilt angle for location
 * Formula: Angle = Latitude - (23.45° × sin(DayOfYear ÷ 365.25 × 360°))
 *
 * For year-round optimization, use: Angle ≈ Latitude
 * For winter optimization, use: Angle = Latitude + 15°
 */
export function getOptimalTiltAngle(
  latitude: number,
  optimize: "year-round" | "winter" = "year-round"
): number {
  if (optimize === "winter") {
    return Math.min(latitude + 15, 90);
  }
  return Math.abs(latitude); // Year-round optimization
}

/**
 * Calculate wire sizing for solar array (AWG)
 * Based on NEC Article 690 requirements
 *
 * Rule: 3% voltage drop maximum for solar circuits
 */
export function calculateWireSize(
  current: number,
  distanceFeet: number,
  voltage: number
): {
  awg: number;
  description: string;
} {
  // Simplified wire sizing (actual requires detailed NEC calculations)
  const currentWith125 = current * 1.25; // NEC safety factor

  if (currentWith125 <= 20) return { awg: 12, description: "12 AWG (20A max)" };
  if (currentWith125 <= 30) return { awg: 10, description: "10 AWG (30A max)" };
  if (currentWith125 <= 40) return { awg: 8, description: "8 AWG (40A max)" };
  if (currentWith125 <= 55) return { awg: 6, description: "6 AWG (55A max)" };
  if (currentWith125 <= 75) return { awg: 4, description: "4 AWG (75A max)" };
  if (currentWith125 <= 95) return { awg: 3, description: "3 AWG (95A max)" };
  if (currentWith125 <= 115) return { awg: 2, description: "2 AWG (115A max)" };
  if (currentWith125 <= 130) return { awg: 1, description: "1 AWG (130A max)" };

  return { awg: 0, description: "1/0 AWG or larger - consult electrician" };
}

/**
 * Estimate solar panel area required
 */
export function calculatePanelArea(totalWattage: number): {
  squareFeet: number;
  squareMeters: number;
} {
  // Modern panels: ~19-20 W/sq ft (200-215 W/sq m)
  const wattsPerSqFt = 19;
  const squareFeet = totalWattage / wattsPerSqFt;
  const squareMeters = squareFeet * 0.0929;

  return {
    squareFeet: Math.ceil(squareFeet),
    squareMeters: Math.ceil(squareMeters * 10) / 10,
  };
}

/**
 * Calculate payback period for solar investment
 */
export function calculateSolarPayback(
  systemCost: number,
  annualEnergySavings: number,
  incentives: number = 0
): {
  paybackYears: number;
  roi5Year: number;
  roi20Year: number;
} {
  const netCost = systemCost - incentives;
  const paybackYears = netCost / annualEnergySavings;

  // Assume 2% annual electricity price increase
  let cumulativeSavings = 0;
  for (let year = 1; year <= 10; year++) {
    cumulativeSavings += annualEnergySavings * Math.pow(1.02, year - 1);
  }
  const roi5Year = ((cumulativeSavings - netCost) / netCost) * 100;

  cumulativeSavings = 0;
  for (let year = 1; year <= 20; year++) {
    cumulativeSavings += annualEnergySavings * Math.pow(1.02, year - 1);
  }
  const roi20Year = ((cumulativeSavings - netCost) / netCost) * 100;

  return {
    paybackYears: Math.round(paybackYears * 10) / 10,
    roi5Year: Math.round(roi5Year),
    roi20Year: Math.round(roi20Year),
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const solarSizingService = {
  calculateSolarBESSSystem,
  getPeakSunHours,
  getTemperatureDerating,
  getOptimalTiltAngle,
  calculateWireSize,
  calculatePanelArea,
  calculateSolarPayback,
};

export default solarSizingService;
