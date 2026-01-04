/**
 * INTERNATIONAL ELECTRICITY RATES - SSOT
 * 
 * Rates for international locations.
 * Source: IEA, local utility data 2024
 */

export interface InternationalCity {
  name: string;
  electricityRate: number;
  sunHours: number;
  solarRating: 'A' | 'B' | 'C' | 'D';
  solarLabel: string;
}

export interface InternationalCountry {
  code: string;
  name: string;
  flag: string;
  currencySymbol: string;
  cities: InternationalCity[];
}

export const INTERNATIONAL_DATA: InternationalCountry[] = [
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currencySymbol: '$',
    cities: [
      { name: 'Mexico City', electricityRate: 0.08, sunHours: 5.5, solarRating: 'B', solarLabel: 'Good' },
      { name: 'Monterrey', electricityRate: 0.07, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Guadalajara', electricityRate: 0.08, sunHours: 5.6, solarRating: 'B', solarLabel: 'Good' },
      { name: 'Cancun', electricityRate: 0.09, sunHours: 5.4, solarRating: 'B', solarLabel: 'Good' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currencySymbol: '$',
    cities: [
      { name: 'Toronto', electricityRate: 0.13, sunHours: 4.2, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Vancouver', electricityRate: 0.11, sunHours: 3.8, solarRating: 'D', solarLabel: 'Limited' },
      { name: 'Calgary', electricityRate: 0.12, sunHours: 4.8, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Montreal', electricityRate: 0.07, sunHours: 4.0, solarRating: 'C', solarLabel: 'Fair' },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currencySymbol: '€',
    cities: [
      { name: 'Berlin', electricityRate: 0.35, sunHours: 4.0, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Munich', electricityRate: 0.34, sunHours: 4.2, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Frankfurt', electricityRate: 0.35, sunHours: 4.1, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Hamburg', electricityRate: 0.35, sunHours: 3.8, solarRating: 'D', solarLabel: 'Limited' },
    ],
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currencySymbol: '£',
    cities: [
      { name: 'London', electricityRate: 0.28, sunHours: 3.5, solarRating: 'D', solarLabel: 'Limited' },
      { name: 'Manchester', electricityRate: 0.27, sunHours: 3.3, solarRating: 'D', solarLabel: 'Limited' },
      { name: 'Birmingham', electricityRate: 0.27, sunHours: 3.4, solarRating: 'D', solarLabel: 'Limited' },
      { name: 'Edinburgh', electricityRate: 0.28, sunHours: 3.2, solarRating: 'D', solarLabel: 'Limited' },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currencySymbol: '$',
    cities: [
      { name: 'Sydney', electricityRate: 0.25, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Melbourne', electricityRate: 0.26, sunHours: 5.2, solarRating: 'B', solarLabel: 'Good' },
      { name: 'Brisbane', electricityRate: 0.24, sunHours: 6.0, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Perth', electricityRate: 0.28, sunHours: 6.2, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currencySymbol: '¥',
    cities: [
      { name: 'Tokyo', electricityRate: 0.22, sunHours: 4.5, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Osaka', electricityRate: 0.21, sunHours: 4.6, solarRating: 'C', solarLabel: 'Fair' },
      { name: 'Nagoya', electricityRate: 0.21, sunHours: 4.7, solarRating: 'C', solarLabel: 'Fair' },
    ],
  },
];

/**
 * Get country data by code
 */
export function getCountryData(countryCode: string): InternationalCountry | null {
  return INTERNATIONAL_DATA.find(c => c.code === countryCode) || null;
}

/**
 * Get city data
 */
export function getCityData(countryCode: string, cityName: string): InternationalCity | null {
  const country = getCountryData(countryCode);
  return country?.cities.find(c => c.name === cityName) || null;
}
