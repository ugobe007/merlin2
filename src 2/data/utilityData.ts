/**
 * Utility and Solar Resource Data
 * ================================
 * 
 * Static data for Savings Scout calculations.
 * 
 * Sources:
 * - EIA State Utility Rate Database (2024)
 * - NREL Solar Resource Data / PVWatts
 * 
 * @version 1.0
 * @created December 2025
 */

export interface StateUtilityDataRecord {
  utilityName: string;
  electricityRate: number;      // $/kWh (commercial average)
  demandChargePerKW: number;    // $/kW
  peakRate?: number;            // $/kWh (TOU peak)
  offPeakRate?: number;         // $/kWh (TOU off-peak)
}

export interface SolarDataRecord {
  peakSunHours: number;         // hours/day (worst month design)
  annualGHI: number;            // kWh/m²/year
}

// ============================================
// STATE UTILITY DATA
// Source: EIA State Average Rates 2024
// ============================================

export const STATE_UTILITY_DATA: Record<string, StateUtilityDataRecord> = {
  'Alabama': { utilityName: 'Alabama Power', electricityRate: 0.117, demandChargePerKW: 12, peakRate: 0.14, offPeakRate: 0.08 },
  'Alaska': { utilityName: 'Chugach Electric', electricityRate: 0.201, demandChargePerKW: 15, peakRate: 0.24, offPeakRate: 0.15 },
  'Arizona': { utilityName: 'APS / SRP', electricityRate: 0.112, demandChargePerKW: 18, peakRate: 0.22, offPeakRate: 0.07 },
  'Arkansas': { utilityName: 'Entergy Arkansas', electricityRate: 0.090, demandChargePerKW: 11, peakRate: 0.11, offPeakRate: 0.07 },
  'California': { utilityName: 'PG&E / SCE / SDG&E', electricityRate: 0.221, demandChargePerKW: 25, peakRate: 0.45, offPeakRate: 0.12 },
  'Colorado': { utilityName: 'Xcel Energy', electricityRate: 0.112, demandChargePerKW: 14, peakRate: 0.16, offPeakRate: 0.08 },
  'Connecticut': { utilityName: 'Eversource', electricityRate: 0.196, demandChargePerKW: 20, peakRate: 0.28, offPeakRate: 0.12 },
  'Delaware': { utilityName: 'Delmarva Power', electricityRate: 0.109, demandChargePerKW: 13, peakRate: 0.15, offPeakRate: 0.09 },
  'Florida': { utilityName: 'FPL / Duke Energy', electricityRate: 0.113, demandChargePerKW: 12, peakRate: 0.18, offPeakRate: 0.08 },
  'Georgia': { utilityName: 'Georgia Power', electricityRate: 0.109, demandChargePerKW: 13, peakRate: 0.16, offPeakRate: 0.07 },
  'Hawaii': { utilityName: 'Hawaiian Electric', electricityRate: 0.369, demandChargePerKW: 30, peakRate: 0.45, offPeakRate: 0.25 },
  'Idaho': { utilityName: 'Idaho Power', electricityRate: 0.085, demandChargePerKW: 10, peakRate: 0.10, offPeakRate: 0.06 },
  'Illinois': { utilityName: 'ComEd / Ameren', electricityRate: 0.111, demandChargePerKW: 14, peakRate: 0.18, offPeakRate: 0.07 },
  'Indiana': { utilityName: 'Duke Energy Indiana', electricityRate: 0.113, demandChargePerKW: 12, peakRate: 0.14, offPeakRate: 0.08 },
  'Iowa': { utilityName: 'MidAmerican Energy', electricityRate: 0.109, demandChargePerKW: 11, peakRate: 0.13, offPeakRate: 0.07 },
  'Kansas': { utilityName: 'Evergy', electricityRate: 0.114, demandChargePerKW: 13, peakRate: 0.16, offPeakRate: 0.08 },
  'Kentucky': { utilityName: 'LG&E / Kentucky Utilities', electricityRate: 0.102, demandChargePerKW: 11, peakRate: 0.12, offPeakRate: 0.07 },
  'Louisiana': { utilityName: 'Entergy Louisiana', electricityRate: 0.103, demandChargePerKW: 12, peakRate: 0.14, offPeakRate: 0.07 },
  'Maine': { utilityName: 'Central Maine Power', electricityRate: 0.157, demandChargePerKW: 15, peakRate: 0.20, offPeakRate: 0.10 },
  'Maryland': { utilityName: 'BGE / Pepco', electricityRate: 0.119, demandChargePerKW: 15, peakRate: 0.18, offPeakRate: 0.08 },
  'Massachusetts': { utilityName: 'National Grid / Eversource', electricityRate: 0.195, demandChargePerKW: 22, peakRate: 0.30, offPeakRate: 0.12 },
  'Michigan': { utilityName: 'DTE Energy / Consumers', electricityRate: 0.143, demandChargePerKW: 16, peakRate: 0.20, offPeakRate: 0.09 },
  'Minnesota': { utilityName: 'Xcel Energy', electricityRate: 0.115, demandChargePerKW: 13, peakRate: 0.16, offPeakRate: 0.08 },
  'Mississippi': { utilityName: 'Mississippi Power', electricityRate: 0.109, demandChargePerKW: 11, peakRate: 0.13, offPeakRate: 0.07 },
  'Missouri': { utilityName: 'Ameren Missouri', electricityRate: 0.101, demandChargePerKW: 12, peakRate: 0.14, offPeakRate: 0.07 },
  'Montana': { utilityName: 'NorthWestern Energy', electricityRate: 0.105, demandChargePerKW: 10, peakRate: 0.12, offPeakRate: 0.07 },
  'Nebraska': { utilityName: 'OPPD / NPPD', electricityRate: 0.100, demandChargePerKW: 11, peakRate: 0.12, offPeakRate: 0.07 },
  'Nevada': { utilityName: 'NV Energy', electricityRate: 0.100, demandChargePerKW: 16, peakRate: 0.20, offPeakRate: 0.08 },
  'New Hampshire': { utilityName: 'Eversource NH', electricityRate: 0.174, demandChargePerKW: 18, peakRate: 0.22, offPeakRate: 0.11 },
  'New Jersey': { utilityName: 'PSE&G / JCP&L', electricityRate: 0.137, demandChargePerKW: 17, peakRate: 0.22, offPeakRate: 0.09 },
  'New Mexico': { utilityName: 'PNM', electricityRate: 0.109, demandChargePerKW: 13, peakRate: 0.16, offPeakRate: 0.07 },
  'New York': { utilityName: 'ConEd / National Grid', electricityRate: 0.168, demandChargePerKW: 22, peakRate: 0.35, offPeakRate: 0.08 },
  'North Carolina': { utilityName: 'Duke Energy Carolinas', electricityRate: 0.099, demandChargePerKW: 12, peakRate: 0.15, offPeakRate: 0.07 },
  'North Dakota': { utilityName: 'Xcel Energy / MDU', electricityRate: 0.098, demandChargePerKW: 10, peakRate: 0.12, offPeakRate: 0.07 },
  'Ohio': { utilityName: 'AEP Ohio / FirstEnergy', electricityRate: 0.111, demandChargePerKW: 13, peakRate: 0.16, offPeakRate: 0.08 },
  'Oklahoma': { utilityName: 'OG&E / PSO', electricityRate: 0.092, demandChargePerKW: 11, peakRate: 0.14, offPeakRate: 0.06 },
  'Oregon': { utilityName: 'PGE / Pacific Power', electricityRate: 0.102, demandChargePerKW: 11, peakRate: 0.15, offPeakRate: 0.07 },
  'Pennsylvania': { utilityName: 'PECO / PPL', electricityRate: 0.114, demandChargePerKW: 14, peakRate: 0.17, offPeakRate: 0.08 },
  'Rhode Island': { utilityName: 'Rhode Island Energy', electricityRate: 0.191, demandChargePerKW: 20, peakRate: 0.28, offPeakRate: 0.12 },
  'South Carolina': { utilityName: 'Duke Energy / SCE&G', electricityRate: 0.104, demandChargePerKW: 12, peakRate: 0.14, offPeakRate: 0.07 },
  'South Dakota': { utilityName: 'Xcel Energy / Black Hills', electricityRate: 0.106, demandChargePerKW: 10, peakRate: 0.13, offPeakRate: 0.07 },
  'Tennessee': { utilityName: 'TVA Distributors', electricityRate: 0.102, demandChargePerKW: 11, peakRate: 0.13, offPeakRate: 0.07 },
  'Texas': { utilityName: 'ERCOT (various)', electricityRate: 0.099, demandChargePerKW: 8, peakRate: 0.15, offPeakRate: 0.06 },
  'Utah': { utilityName: 'Rocky Mountain Power', electricityRate: 0.095, demandChargePerKW: 11, peakRate: 0.14, offPeakRate: 0.06 },
  'Vermont': { utilityName: 'Green Mountain Power', electricityRate: 0.170, demandChargePerKW: 16, peakRate: 0.22, offPeakRate: 0.11 },
  'Virginia': { utilityName: 'Dominion Energy', electricityRate: 0.107, demandChargePerKW: 13, peakRate: 0.16, offPeakRate: 0.07 },
  'Washington': { utilityName: 'Puget Sound Energy', electricityRate: 0.097, demandChargePerKW: 11, peakRate: 0.13, offPeakRate: 0.07 },
  'West Virginia': { utilityName: 'Appalachian Power', electricityRate: 0.102, demandChargePerKW: 11, peakRate: 0.13, offPeakRate: 0.07 },
  'Wisconsin': { utilityName: 'WE Energies / WPS', electricityRate: 0.118, demandChargePerKW: 13, peakRate: 0.17, offPeakRate: 0.08 },
  'Wyoming': { utilityName: 'Rocky Mountain Power', electricityRate: 0.093, demandChargePerKW: 10, peakRate: 0.12, offPeakRate: 0.06 },
  'District of Columbia': { utilityName: 'Pepco', electricityRate: 0.125, demandChargePerKW: 16, peakRate: 0.20, offPeakRate: 0.08 },
};

// ============================================
// NREL SOLAR RESOURCE DATA
// Source: NREL PVWatts / NSRDB
// Peak Sun Hours = worst month design for year-round operation
// ============================================

export const NREL_SOLAR_DATA: Record<string, SolarDataRecord> = {
  'Alabama': { peakSunHours: 4.0, annualGHI: 1650 },
  'Alaska': { peakSunHours: 2.5, annualGHI: 1100 },
  'Arizona': { peakSunHours: 6.5, annualGHI: 2200 },
  'Arkansas': { peakSunHours: 4.0, annualGHI: 1600 },
  'California': { peakSunHours: 5.8, annualGHI: 1950 },
  'Colorado': { peakSunHours: 5.0, annualGHI: 1850 },
  'Connecticut': { peakSunHours: 3.5, annualGHI: 1400 },
  'Delaware': { peakSunHours: 3.8, annualGHI: 1450 },
  'Florida': { peakSunHours: 5.2, annualGHI: 1750 },
  'Georgia': { peakSunHours: 4.5, annualGHI: 1700 },
  'Hawaii': { peakSunHours: 5.5, annualGHI: 1900 },
  'Idaho': { peakSunHours: 4.2, annualGHI: 1600 },
  'Illinois': { peakSunHours: 3.5, annualGHI: 1450 },
  'Indiana': { peakSunHours: 3.5, annualGHI: 1400 },
  'Iowa': { peakSunHours: 3.8, annualGHI: 1500 },
  'Kansas': { peakSunHours: 4.5, annualGHI: 1700 },
  'Kentucky': { peakSunHours: 3.8, annualGHI: 1450 },
  'Louisiana': { peakSunHours: 4.5, annualGHI: 1650 },
  'Maine': { peakSunHours: 3.2, annualGHI: 1350 },
  'Maryland': { peakSunHours: 3.8, annualGHI: 1500 },
  'Massachusetts': { peakSunHours: 3.4, annualGHI: 1380 },
  'Michigan': { peakSunHours: 3.2, annualGHI: 1350 },
  'Minnesota': { peakSunHours: 3.5, annualGHI: 1450 },
  'Mississippi': { peakSunHours: 4.3, annualGHI: 1650 },
  'Missouri': { peakSunHours: 4.0, annualGHI: 1550 },
  'Montana': { peakSunHours: 3.8, annualGHI: 1500 },
  'Nebraska': { peakSunHours: 4.2, annualGHI: 1600 },
  'Nevada': { peakSunHours: 6.2, annualGHI: 2100 },
  'New Hampshire': { peakSunHours: 3.2, annualGHI: 1350 },
  'New Jersey': { peakSunHours: 3.6, annualGHI: 1450 },
  'New Mexico': { peakSunHours: 6.3, annualGHI: 2150 },
  'New York': { peakSunHours: 3.4, annualGHI: 1400 },
  'North Carolina': { peakSunHours: 4.2, annualGHI: 1600 },
  'North Dakota': { peakSunHours: 3.8, annualGHI: 1500 },
  'Ohio': { peakSunHours: 3.3, annualGHI: 1380 },
  'Oklahoma': { peakSunHours: 4.8, annualGHI: 1750 },
  'Oregon': { peakSunHours: 3.5, annualGHI: 1400 },
  'Pennsylvania': { peakSunHours: 3.4, annualGHI: 1400 },
  'Rhode Island': { peakSunHours: 3.5, annualGHI: 1400 },
  'South Carolina': { peakSunHours: 4.5, annualGHI: 1700 },
  'South Dakota': { peakSunHours: 4.0, annualGHI: 1550 },
  'Tennessee': { peakSunHours: 4.0, annualGHI: 1550 },
  'Texas': { peakSunHours: 5.4, annualGHI: 1800 },
  'Utah': { peakSunHours: 5.2, annualGHI: 1850 },
  'Vermont': { peakSunHours: 3.0, annualGHI: 1300 },
  'Virginia': { peakSunHours: 3.8, annualGHI: 1500 },
  'Washington': { peakSunHours: 3.0, annualGHI: 1300 },
  'West Virginia': { peakSunHours: 3.5, annualGHI: 1400 },
  'Wisconsin': { peakSunHours: 3.3, annualGHI: 1400 },
  'Wyoming': { peakSunHours: 4.5, annualGHI: 1700 },
  'District of Columbia': { peakSunHours: 3.8, annualGHI: 1500 },
};

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

export const DEFAULT_UTILITY_DATA: StateUtilityDataRecord = {
  utilityName: 'Local Utility',
  electricityRate: 0.12,
  demandChargePerKW: 12,
  peakRate: 0.16,
  offPeakRate: 0.08,
};

export const DEFAULT_SOLAR_DATA: SolarDataRecord = {
  peakSunHours: 4.5,
  annualGHI: 1500,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get utility data for a state (case-insensitive)
 */
export function getStateUtilityData(state: string): StateUtilityDataRecord {
  // Normalize state name
  const normalized = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  
  // Try exact match first
  if (STATE_UTILITY_DATA[normalized]) {
    return STATE_UTILITY_DATA[normalized];
  }
  
  // Try finding partial match
  const found = Object.entries(STATE_UTILITY_DATA).find(([key]) => 
    key.toLowerCase().includes(state.toLowerCase()) ||
    state.toLowerCase().includes(key.toLowerCase())
  );
  
  return found ? found[1] : DEFAULT_UTILITY_DATA;
}

/**
 * Get solar resource data for a state (case-insensitive)
 */
export function getStateSolarData(state: string): SolarDataRecord {
  // Normalize state name
  const normalized = state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  
  // Try exact match first
  if (NREL_SOLAR_DATA[normalized]) {
    return NREL_SOLAR_DATA[normalized];
  }
  
  // Try finding partial match
  const found = Object.entries(NREL_SOLAR_DATA).find(([key]) => 
    key.toLowerCase().includes(state.toLowerCase()) ||
    state.toLowerCase().includes(key.toLowerCase())
  );
  
  return found ? found[1] : DEFAULT_SOLAR_DATA;
}
