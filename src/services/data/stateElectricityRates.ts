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
  abbreviation: string;
  electricityRate: number;  // $/kWh
  demandCharge: number;     // $/kW (commercial)
  sunHours: number;         // Peak sun hours per day
  solarRating: 'A' | 'B' | 'C' | 'D';
  solarLabel: string;
}

// US State Data - SSOT
export const US_STATE_DATA: Record<string, StateElectricityData> = {
  'NV': { code: 'NV', name: 'Nevada', abbreviation: 'NV', electricityRate: 0.0934, demandCharge: 12, sunHours: 6.4, solarRating: 'A', solarLabel: 'Excellent' },
  'CA': { code: 'CA', name: 'California', abbreviation: 'CA', electricityRate: 0.2250, demandCharge: 20, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
  'AZ': { code: 'AZ', name: 'Arizona', abbreviation: 'AZ', electricityRate: 0.1150, demandCharge: 14, sunHours: 6.6, solarRating: 'A', solarLabel: 'Excellent' },
  'TX': { code: 'TX', name: 'Texas', abbreviation: 'TX', electricityRate: 0.1180, demandCharge: 15, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
  'FL': { code: 'FL', name: 'Florida', abbreviation: 'FL', electricityRate: 0.1280, demandCharge: 12, sunHours: 5.4, solarRating: 'A', solarLabel: 'Excellent' },
  'NY': { code: 'NY', name: 'New York', abbreviation: 'NY', electricityRate: 0.1950, demandCharge: 25, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'CO': { code: 'CO', name: 'Colorado', abbreviation: 'CO', electricityRate: 0.1280, demandCharge: 13, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
  'WA': { code: 'WA', name: 'Washington', abbreviation: 'WA', electricityRate: 0.0980, demandCharge: 8, sunHours: 4.0, solarRating: 'C', solarLabel: 'Moderate' },
  'MA': { code: 'MA', name: 'Massachusetts', abbreviation: 'MA', electricityRate: 0.2200, demandCharge: 22, sunHours: 4.3, solarRating: 'B', solarLabel: 'Very Good' },
  'IL': { code: 'IL', name: 'Illinois', abbreviation: 'IL', electricityRate: 0.1350, demandCharge: 14, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
  'GA': { code: 'GA', name: 'Georgia', abbreviation: 'GA', electricityRate: 0.1200, demandCharge: 11, sunHours: 5.2, solarRating: 'A', solarLabel: 'Excellent' },
  'NC': { code: 'NC', name: 'North Carolina', abbreviation: 'NC', electricityRate: 0.1100, demandCharge: 10, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
  'NJ': { code: 'NJ', name: 'New Jersey', abbreviation: 'NJ', electricityRate: 0.1650, demandCharge: 18, sunHours: 4.4, solarRating: 'B', solarLabel: 'Very Good' },
  'PA': { code: 'PA', name: 'Pennsylvania', abbreviation: 'PA', electricityRate: 0.1400, demandCharge: 14, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'OH': { code: 'OH', name: 'Ohio', abbreviation: 'OH', electricityRate: 0.1250, demandCharge: 12, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
  'MI': { code: 'MI', name: 'Michigan', abbreviation: 'MI', electricityRate: 0.1550, demandCharge: 13, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
  'NM': { code: 'NM', name: 'New Mexico', abbreviation: 'NM', electricityRate: 0.1200, demandCharge: 11, sunHours: 6.5, solarRating: 'A', solarLabel: 'Excellent' },
  'UT': { code: 'UT', name: 'Utah', abbreviation: 'UT', electricityRate: 0.1050, demandCharge: 10, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
  'OR': { code: 'OR', name: 'Oregon', abbreviation: 'OR', electricityRate: 0.1100, demandCharge: 9, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'HI': { code: 'HI', name: 'Hawaii', abbreviation: 'HI', electricityRate: 0.3500, demandCharge: 30, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
  // Additional states
  'CT': { code: 'CT', name: 'Connecticut', abbreviation: 'CT', electricityRate: 0.2700, demandCharge: 21, sunHours: 4.3, solarRating: 'B', solarLabel: 'Very Good' },
  'MD': { code: 'MD', name: 'Maryland', abbreviation: 'MD', electricityRate: 0.1400, demandCharge: 14, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
  'VA': { code: 'VA', name: 'Virginia', abbreviation: 'VA', electricityRate: 0.1200, demandCharge: 11, sunHours: 4.7, solarRating: 'B', solarLabel: 'Very Good' },
  'SC': { code: 'SC', name: 'South Carolina', abbreviation: 'SC', electricityRate: 0.1100, demandCharge: 10, sunHours: 5.1, solarRating: 'A', solarLabel: 'Excellent' },
  'TN': { code: 'TN', name: 'Tennessee', abbreviation: 'TN', electricityRate: 0.1100, demandCharge: 10, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
  'AL': { code: 'AL', name: 'Alabama', abbreviation: 'AL', electricityRate: 0.1200, demandCharge: 11, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
  'LA': { code: 'LA', name: 'Louisiana', abbreviation: 'LA', electricityRate: 0.1100, demandCharge: 10, sunHours: 5.1, solarRating: 'A', solarLabel: 'Excellent' },
  'OK': { code: 'OK', name: 'Oklahoma', abbreviation: 'OK', electricityRate: 0.1100, demandCharge: 10, sunHours: 5.4, solarRating: 'A', solarLabel: 'Excellent' },
  'KS': { code: 'KS', name: 'Kansas', abbreviation: 'KS', electricityRate: 0.1250, demandCharge: 12, sunHours: 5.2, solarRating: 'A', solarLabel: 'Excellent' },
  'MO': { code: 'MO', name: 'Missouri', abbreviation: 'MO', electricityRate: 0.1150, demandCharge: 11, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
  'MN': { code: 'MN', name: 'Minnesota', abbreviation: 'MN', electricityRate: 0.1300, demandCharge: 12, sunHours: 4.3, solarRating: 'B', solarLabel: 'Very Good' },
  'WI': { code: 'WI', name: 'Wisconsin', abbreviation: 'WI', electricityRate: 0.1400, demandCharge: 13, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'IN': { code: 'IN', name: 'Indiana', abbreviation: 'IN', electricityRate: 0.1200, demandCharge: 11, sunHours: 4.3, solarRating: 'B', solarLabel: 'Very Good' },
  'IA': { code: 'IA', name: 'Iowa', abbreviation: 'IA', electricityRate: 0.1150, demandCharge: 11, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
  'AR': { code: 'AR', name: 'Arkansas', abbreviation: 'AR', electricityRate: 0.1000, demandCharge: 9, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
  'MS': { code: 'MS', name: 'Mississippi', abbreviation: 'MS', electricityRate: 0.1150, demandCharge: 10, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
  'NE': { code: 'NE', name: 'Nebraska', abbreviation: 'NE', electricityRate: 0.1100, demandCharge: 10, sunHours: 4.9, solarRating: 'B', solarLabel: 'Very Good' },
  'ID': { code: 'ID', name: 'Idaho', abbreviation: 'ID', electricityRate: 0.0950, demandCharge: 9, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
  'WY': { code: 'WY', name: 'Wyoming', abbreviation: 'WY', electricityRate: 0.1050, demandCharge: 10, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
  'MT': { code: 'MT', name: 'Montana', abbreviation: 'MT', electricityRate: 0.1100, demandCharge: 10, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
  'ND': { code: 'ND', name: 'North Dakota', abbreviation: 'ND', electricityRate: 0.1050, demandCharge: 10, sunHours: 4.6, solarRating: 'B', solarLabel: 'Very Good' },
  'SD': { code: 'SD', name: 'South Dakota', abbreviation: 'SD', electricityRate: 0.1100, demandCharge: 10, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
  'AK': { code: 'AK', name: 'Alaska', abbreviation: 'AK', electricityRate: 0.2200, demandCharge: 18, sunHours: 3.5, solarRating: 'D', solarLabel: 'Limited' },
  'VT': { code: 'VT', name: 'Vermont', abbreviation: 'VT', electricityRate: 0.1900, demandCharge: 17, sunHours: 4.0, solarRating: 'C', solarLabel: 'Moderate' },
  'NH': { code: 'NH', name: 'New Hampshire', abbreviation: 'NH', electricityRate: 0.2000, demandCharge: 18, sunHours: 4.1, solarRating: 'B', solarLabel: 'Very Good' },
  'ME': { code: 'ME', name: 'Maine', abbreviation: 'ME', electricityRate: 0.1700, demandCharge: 15, sunHours: 4.0, solarRating: 'C', solarLabel: 'Moderate' },
  'RI': { code: 'RI', name: 'Rhode Island', abbreviation: 'RI', electricityRate: 0.2300, demandCharge: 20, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'DE': { code: 'DE', name: 'Delaware', abbreviation: 'DE', electricityRate: 0.1300, demandCharge: 12, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
  'WV': { code: 'WV', name: 'West Virginia', abbreviation: 'WV', electricityRate: 0.1100, demandCharge: 10, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
  'KY': { code: 'KY', name: 'Kentucky', abbreviation: 'KY', electricityRate: 0.1050, demandCharge: 10, sunHours: 4.4, solarRating: 'B', solarLabel: 'Very Good' },
  'DC': { code: 'DC', name: 'Washington DC', abbreviation: 'DC', electricityRate: 0.1350, demandCharge: 14, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
  'PR': { code: 'PR', name: 'Puerto Rico', abbreviation: 'PR', electricityRate: 0.2700, demandCharge: 22, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
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
 * Get demand charge for a state
 */
export function getDemandCharge(stateCode: string): number {
  return US_STATE_DATA[stateCode.toUpperCase()]?.demandCharge || 12;
}

/**
 * Get state code from zip code prefix
 */
export function getStateFromZip(zip: string): string | null {
  if (!zip || zip.length < 3) return null;
  
  const prefix = parseInt(zip.substring(0, 3));
  if (isNaN(prefix)) return null;

  // Comprehensive ZIP code prefix to state mapping
  const zipRanges: [number, number, string][] = [
    // Northeast
    [10, 14, 'MA'], [15, 27, 'MA'], 
    [1, 9, 'MA'], // 010-099
    [28, 29, 'RI'],
    [30, 38, 'NH'],
    [39, 49, 'ME'],
    [50, 54, 'VT'],
    [55, 56, 'MA'],
    [60, 69, 'CT'],
    [70, 89, 'NJ'],
    [100, 149, 'NY'],
    [150, 196, 'PA'],
    [197, 199, 'DE'],
    
    // Southeast
    [200, 205, 'DC'],
    [206, 219, 'MD'],
    [220, 246, 'VA'],
    [247, 268, 'WV'],
    [270, 289, 'NC'],
    [290, 299, 'SC'],
    [300, 319, 'GA'],
    [320, 339, 'FL'],
    [340, 349, 'FL'], // Military
    [350, 369, 'AL'],
    [370, 385, 'TN'],
    [386, 397, 'MS'],
    [398, 399, 'GA'],
    
    // South Central
    [400, 418, 'KY'],
    [420, 427, 'KY'],
    [430, 459, 'OH'],
    [460, 479, 'IN'],
    [480, 499, 'MI'],
    [500, 528, 'IA'],
    [530, 549, 'WI'],
    [550, 567, 'MN'],
    [570, 577, 'SD'],
    [580, 588, 'ND'],
    [590, 599, 'MT'],
    
    // Central
    [600, 629, 'IL'],
    [630, 658, 'MO'],
    [660, 679, 'KS'],
    [680, 693, 'NE'],
    [700, 714, 'LA'],
    [716, 729, 'AR'],
    [730, 749, 'OK'],
    [750, 799, 'TX'],
    [800, 816, 'CO'],
    [820, 831, 'WY'],
    [832, 838, 'ID'],
    [840, 847, 'UT'],
    [850, 865, 'AZ'],
    [870, 884, 'NM'],
    [889, 898, 'NV'],
    
    // West Coast
    [900, 961, 'CA'],
    [967, 968, 'HI'],
    [970, 979, 'OR'],
    [980, 994, 'WA'],
    [995, 999, 'AK'],
  ];

  for (const [start, end, state] of zipRanges) {
    if (prefix >= start && prefix <= end) {
      return state;
    }
  }
  
  return null;
}

/**
 * Get all state codes
 */
export function getAllStateCodes(): string[] {
  return Object.keys(US_STATE_DATA);
}

/**
 * Validate a US zip code
 */
export function isValidUSZip(zip: string): boolean {
  if (!zip || zip.length !== 5) return false;
  const state = getStateFromZip(zip);
  return state !== null;
}
