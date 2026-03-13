/**
 * International Location & Currency Service
 * 
 * Supports multi-country quotes with:
 * - Currency conversion (USD, CAD, GBP, EUR, AUD)
 * - Regional utility rates
 * - Equipment pricing adjustments
 * - Localized formatting
 */

export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  locale: string;
}

export interface ExchangeRates {
  USD: number;
  CAD: number;
  GBP: number;
  EUR: number;
  AUD: number;
  lastUpdated: string;
}

export interface RegionalData {
  country: string;
  averageElectricityRate: number; // per kWh in local currency
  demandChargeRange: [number, number]; // [min, max] in local currency
  equipmentPricingMultiplier: number; // relative to USD baseline
}

// Supported countries
export const SUPPORTED_COUNTRIES: Country[] = [
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    flag: '🇺🇸',
    locale: 'en-US',
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    flag: '🇨🇦',
    locale: 'en-CA',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    flag: '🇬🇧',
    locale: 'en-GB',
  },
  {
    code: 'EU',
    name: 'European Union',
    currency: 'EUR',
    currencySymbol: '€',
    flag: '🇪🇺',
    locale: 'en-EU',
  },
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    flag: '🇦🇺',
    locale: 'en-AU',
  },
];

// Exchange rates (as of Mar 2026) - In production, fetch from live API
// Rates relative to 1 USD
export const EXCHANGE_RATES: ExchangeRates = {
  USD: 1.0,
  CAD: 1.35,
  GBP: 0.79,
  EUR: 0.92,
  AUD: 1.52,
  lastUpdated: '2026-03-13',
};

// Regional utility rate data (average commercial rates)
export const REGIONAL_UTILITY_RATES: Record<string, RegionalData> = {
  US: {
    country: 'United States',
    averageElectricityRate: 0.12, // $0.12/kWh USD
    demandChargeRange: [10, 25], // $10-25/kW USD
    equipmentPricingMultiplier: 1.0, // Baseline
  },
  CA: {
    country: 'Canada',
    averageElectricityRate: 0.15, // C$0.15/kWh CAD (~$0.11 USD)
    demandChargeRange: [13, 30], // C$13-30/kW CAD
    equipmentPricingMultiplier: 1.08, // Slightly higher due to import costs
  },
  GB: {
    country: 'United Kingdom',
    averageElectricityRate: 0.28, // £0.28/kWh GBP (~$0.35 USD)
    demandChargeRange: [20, 45], // £20-45/kW GBP
    equipmentPricingMultiplier: 1.15, // Higher due to VAT + shipping
  },
  EU: {
    country: 'European Union',
    averageElectricityRate: 0.25, // €0.25/kWh EUR (~$0.27 USD)
    demandChargeRange: [18, 40], // €18-40/kW EUR
    equipmentPricingMultiplier: 1.12, // Moderate markup
  },
  AU: {
    country: 'Australia',
    averageElectricityRate: 0.30, // A$0.30/kWh AUD (~$0.20 USD)
    demandChargeRange: [25, 50], // A$25-50/kW AUD
    equipmentPricingMultiplier: 1.18, // Higher due to distance/shipping
  },
};

/**
 * Convert amount from USD to target currency
 */
export function convertCurrency(
  amountUSD: number,
  targetCurrency: keyof ExchangeRates
): number {
  return amountUSD * EXCHANGE_RATES[targetCurrency];
}

/**
 * Convert amount from any currency to USD
 */
export function convertToUSD(
  amount: number,
  sourceCurrency: keyof ExchangeRates
): number {
  return amount / EXCHANGE_RATES[sourceCurrency];
}

/**
 * Format currency with appropriate symbol and locale
 */
export function formatCurrency(
  amount: number,
  countryCode: string,
  options?: { decimals?: number; compact?: boolean }
): string {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return `$${amount.toLocaleString('en-US')}`;

  const decimals = options?.decimals ?? 2;

  if (options?.compact && amount >= 1000000) {
    // Format as millions: $2.5M
    const millions = amount / 1000000;
    return `${country.currencySymbol}${millions.toFixed(1)}M`;
  }

  return new Intl.NumberFormat(country.locale, {
    style: 'currency',
    currency: country.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Get regional data for country
 */
export function getRegionalData(countryCode: string): RegionalData | null {
  return REGIONAL_UTILITY_RATES[countryCode] || null;
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

/**
 * Calculate equipment cost in local currency with regional adjustments
 */
export function calculateInternationalEquipmentCost(
  baseUSDCost: number,
  countryCode: string
): {
  localCost: number;
  currency: string;
  currencySymbol: string;
  multiplier: number;
} {
  const country = getCountryByCode(countryCode);
  const regional = getRegionalData(countryCode);

  if (!country || !regional) {
    return {
      localCost: baseUSDCost,
      currency: 'USD',
      currencySymbol: '$',
      multiplier: 1.0,
    };
  }

  // Apply regional pricing multiplier (accounts for shipping, taxes, etc.)
  const adjustedUSDCost = baseUSDCost * regional.equipmentPricingMultiplier;

  // Convert to local currency
  const localCost = convertCurrency(
    adjustedUSDCost,
    country.currency as keyof ExchangeRates
  );

  return {
    localCost,
    currency: country.currency,
    currencySymbol: country.currencySymbol,
    multiplier: regional.equipmentPricingMultiplier,
  };
}

/**
 * Get electricity rate for country (in local currency)
 */
export function getElectricityRate(countryCode: string): number {
  const regional = getRegionalData(countryCode);
  return regional?.averageElectricityRate ?? 0.12; // Default to US rate
}

/**
 * Get demand charge for country (average, in local currency)
 */
export function getDemandCharge(countryCode: string): number {
  const regional = getRegionalData(countryCode);
  if (!regional) return 15; // Default to US average

  // Return midpoint of range
  const [min, max] = regional.demandChargeRange;
  return (min + max) / 2;
}

/**
 * Example usage for quote calculations:
 * 
 * const country = 'CA'; // Canada
 * const baseEquipmentCost = 500000; // $500K USD
 * 
 * const { localCost, currencySymbol } = calculateInternationalEquipmentCost(
 *   baseEquipmentCost,
 *   country
 * );
 * 
 * const electricityRate = getElectricityRate(country);
 * const demandCharge = getDemandCharge(country);
 * 
 * // Use localCost, electricityRate, demandCharge in calculations
 * const formatted = formatCurrency(localCost, country);
 * // Result: "C$540,000.00" (in CAD)
 */
