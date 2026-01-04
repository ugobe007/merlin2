/**
 * STATE ELECTRICITY RATES - SSOT
 * 
 * These rates should ultimately come from the database.
 * This file provides fallback values and type definitions.
 * 
 * Source: EIA State Electricity Profiles 2024
 */

export interface StateElectricityData {
  code: string;
  name: string;
  electricityRate: number;  // $/kWh
  demandCharge: number;     // $/kW (commercial)
  sunHours: number;         // Peak sun hours per day
  solarRating: 'A' | 'B' | 'C' | 'D';
  solarLabel: string;
}

export const US_STATE_DATA: Record<string, StateElectricityData> = {
  // Southwest (Excellent Solar)
  NV: { code: 'NV', name: 'Nevada', electricityRate: 0.0934, demandCharge: 12, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
  AZ: { code: 'AZ', name: 'Arizona', electricityRate: 0.115, demandCharge: 14, sunHours: 6.5, solarRating: 'A', solarLabel: 'Excellent' },
  CA: { code: 'CA', name: 'California', electricityRate: 0.225, demandCharge: 20, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
  NM: { code: 'NM', name: 'New Mexico', electricityRate: 0.118, demandCharge: 11, sunHours: 6.2, solarRating: 'A', solarLabel: 'Excellent' },
  UT: { code: 'UT', name: 'Utah', electricityRate: 0.098, demandCharge: 10, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
  
  // South (Good Solar)
  TX: { code: 'TX', name: 'Texas', electricityRate: 0.128, demandCharge: 15, sunHours: 5.5, solarRating: 'B', solarLabel: 'Good' },
  FL: { code: 'FL', name: 'Florida', electricityRate: 0.128, demandCharge: 12, sunHours: 5.6, solarRating: 'B', solarLabel: 'Good' },
  GA: { code: 'GA', name: 'Georgia', electricityRate: 0.12, demandCharge: 11, sunHours: 5.2, solarRating: 'B', solarLabel: 'Good' },
  NC: { code: 'NC', name: 'North Carolina', electricityRate: 0.11, demandCharge: 10, sunHours: 5.0, solarRating: 'B', solarLabel: 'Good' },
  
  // Mountain (Good Solar)
  CO: { code: 'CO', name: 'Colorado', electricityRate: 0.135, demandCharge: 13, sunHours: 5.5, solarRating: 'B', solarLabel: 'Good' },
  
  // Northeast (Fair Solar, High Rates)
  NY: { code: 'NY', name: 'New York', electricityRate: 0.22, demandCharge: 25, sunHours: 4.5, solarRating: 'C', solarLabel: 'Fair' },
  MA: { code: 'MA', name: 'Massachusetts', electricityRate: 0.28, demandCharge: 22, sunHours: 4.6, solarRating: 'C', solarLabel: 'Fair' },
  CT: { code: 'CT', name: 'Connecticut', electricityRate: 0.27, demandCharge: 21, sunHours: 4.5, solarRating: 'C', solarLabel: 'Fair' },
  NJ: { code: 'NJ', name: 'New Jersey', electricityRate: 0.165, demandCharge: 18, sunHours: 4.7, solarRating: 'C', solarLabel: 'Fair' },
  PA: { code: 'PA', name: 'Pennsylvania', electricityRate: 0.14, demandCharge: 14, sunHours: 4.6, solarRating: 'C', solarLabel: 'Fair' },
  
  // Midwest (Fair Solar)
  IL: { code: 'IL', name: 'Illinois', electricityRate: 0.155, demandCharge: 14, sunHours: 4.8, solarRating: 'C', solarLabel: 'Fair' },
  OH: { code: 'OH', name: 'Ohio', electricityRate: 0.125, demandCharge: 12, sunHours: 4.5, solarRating: 'C', solarLabel: 'Fair' },
  MI: { code: 'MI', name: 'Michigan', electricityRate: 0.12, demandCharge: 11, sunHours: 4.4, solarRating: 'C', solarLabel: 'Fair' },
  
  // Pacific Northwest (Limited Solar)
  WA: { code: 'WA', name: 'Washington', electricityRate: 0.105, demandCharge: 8, sunHours: 4.2, solarRating: 'D', solarLabel: 'Limited' },
  OR: { code: 'OR', name: 'Oregon', electricityRate: 0.11, demandCharge: 9, sunHours: 4.5, solarRating: 'D', solarLabel: 'Limited' },
  
  // Islands
  HI: { code: 'HI', name: 'Hawaii', electricityRate: 0.35, demandCharge: 30, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
};

/**
 * Get state data by code
 */
export function getStateData(stateCode: string): StateElectricityData | null {
  return US_STATE_DATA[stateCode.toUpperCase()] || null;
}

/**
 * Get electricity rate for a state
 */
export function getElectricityRate(stateCode: string): number {
  return US_STATE_DATA[stateCode.toUpperCase()]?.electricityRate || 0.12;
}

/**
 * Get all state codes
 */
export function getAllStateCodes(): string[] {
  return Object.keys(US_STATE_DATA);
}
