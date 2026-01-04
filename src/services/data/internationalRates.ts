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
  currency: string;
  currencySymbol: string;
  cities: InternationalCity[];
}

export const INTERNATIONAL_DATA: InternationalCountry[] = [
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    currency: 'MXN',
    currencySymbol: '$',
    cities: [
      { name: 'Mexico City', electricityRate: 0.08, sunHours: 5.5, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Monterrey', electricityRate: 0.07, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Guadalajara', electricityRate: 0.08, sunHours: 5.6, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Cancun', electricityRate: 0.09, sunHours: 5.4, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: '$',
    cities: [
      { name: 'Toronto', electricityRate: 0.13, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Vancouver', electricityRate: 0.11, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Calgary', electricityRate: 0.12, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Montreal', electricityRate: 0.07, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
    ],
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    currencySymbol: 'SAR',
    cities: [
      { name: 'Riyadh', electricityRate: 0.04, sunHours: 6.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Jeddah', electricityRate: 0.04, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Dammam', electricityRate: 0.04, sunHours: 6.4, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Mecca', electricityRate: 0.04, sunHours: 6.2, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Medina', electricityRate: 0.04, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    currencySymbol: 'AED',
    cities: [
      { name: 'Dubai', electricityRate: 0.08, sunHours: 6.2, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Abu Dhabi', electricityRate: 0.07, sunHours: 6.3, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Sharjah', electricityRate: 0.08, sunHours: 6.1, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    cities: [
      { name: 'London', electricityRate: 0.28, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Manchester', electricityRate: 0.27, sunHours: 3.5, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Birmingham', electricityRate: 0.27, sunHours: 3.6, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Edinburgh', electricityRate: 0.28, sunHours: 3.3, solarRating: 'C', solarLabel: 'Moderate' },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    currencySymbol: '€',
    cities: [
      { name: 'Berlin', electricityRate: 0.35, sunHours: 3.5, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Munich', electricityRate: 0.34, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Frankfurt', electricityRate: 0.35, sunHours: 3.6, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Hamburg', electricityRate: 0.35, sunHours: 3.3, solarRating: 'C', solarLabel: 'Moderate' },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    cities: [
      { name: 'Sydney', electricityRate: 0.25, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Melbourne', electricityRate: 0.26, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Brisbane', electricityRate: 0.24, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Perth', electricityRate: 0.28, sunHours: 6.0, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    currency: 'JPY',
    currencySymbol: '¥',
    cities: [
      { name: 'Tokyo', electricityRate: 0.22, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Osaka', electricityRate: 0.21, sunHours: 4.4, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Nagoya', electricityRate: 0.21, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    cities: [
      { name: 'Singapore', electricityRate: 0.18, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    cities: [
      { name: 'Mumbai', electricityRate: 0.10, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Delhi', electricityRate: 0.08, sunHours: 5.8, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Bangalore', electricityRate: 0.07, sunHours: 5.6, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Chennai', electricityRate: 0.06, sunHours: 5.4, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    currency: 'BRL',
    currencySymbol: 'R$',
    cities: [
      { name: 'São Paulo', electricityRate: 0.15, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Rio de Janeiro', electricityRate: 0.14, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Brasília', electricityRate: 0.13, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    currencySymbol: '€',
    cities: [
      { name: 'Paris', electricityRate: 0.22, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Lyon', electricityRate: 0.21, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Marseille', electricityRate: 0.21, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Nice', electricityRate: 0.22, sunHours: 5.2, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    currency: 'EUR',
    currencySymbol: '€',
    cities: [
      { name: 'Rome', electricityRate: 0.28, sunHours: 4.8, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Milan', electricityRate: 0.29, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Naples', electricityRate: 0.27, sunHours: 5.2, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currency: 'EUR',
    currencySymbol: '€',
    cities: [
      { name: 'Madrid', electricityRate: 0.25, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Barcelona', electricityRate: 0.26, sunHours: 5.0, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Seville', electricityRate: 0.24, sunHours: 6.0, solarRating: 'A', solarLabel: 'Excellent' },
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    flag: '🇰🇷',
    currency: 'KRW',
    currencySymbol: '₩',
    cities: [
      { name: 'Seoul', electricityRate: 0.10, sunHours: 4.2, solarRating: 'B', solarLabel: 'Very Good' },
      { name: 'Busan', electricityRate: 0.09, sunHours: 4.5, solarRating: 'B', solarLabel: 'Very Good' },
    ],
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    currency: 'EUR',
    currencySymbol: '€',
    cities: [
      { name: 'Amsterdam', electricityRate: 0.30, sunHours: 3.5, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Rotterdam', electricityRate: 0.29, sunHours: 3.6, solarRating: 'C', solarLabel: 'Moderate' },
    ],
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    currency: 'CHF',
    currencySymbol: 'CHF',
    cities: [
      { name: 'Zurich', electricityRate: 0.22, sunHours: 3.8, solarRating: 'C', solarLabel: 'Moderate' },
      { name: 'Geneva', electricityRate: 0.21, sunHours: 4.0, solarRating: 'B', solarLabel: 'Very Good' },
    ],
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    currencySymbol: 'R',
    cities: [
      { name: 'Johannesburg', electricityRate: 0.12, sunHours: 6.0, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Cape Town', electricityRate: 0.13, sunHours: 5.5, solarRating: 'A', solarLabel: 'Excellent' },
      { name: 'Durban', electricityRate: 0.11, sunHours: 5.2, solarRating: 'A', solarLabel: 'Excellent' },
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

/**
 * Get all country codes
 */
export function getAllCountryCodes(): string[] {
  return INTERNATIONAL_DATA.map(c => c.code);
}
