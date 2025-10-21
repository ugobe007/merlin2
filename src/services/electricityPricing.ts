/**
 * Electricity Pricing Service
 * Fetches live market prices for electricity to use in BESS calculations
 */

export interface ElectricityPrice {
  pricePerKwh: number;
  timestamp: Date;
  source: string;
  currency: string;
}

/**
 * Fetch live electricity price from external API
 * @param apiUrl - The API endpoint URL
 * @returns Current electricity price data
 */
export const fetchLiveElectricityPrice = async (
  apiUrl: string
): Promise<ElectricityPrice> => {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // TODO: Parse the API response based on the actual structure
    // This is a placeholder that needs to be updated based on your API
    const price: ElectricityPrice = {
      pricePerKwh: parseFloat(data.price || data.value || data.rate || 0.25),
      timestamp: new Date(data.timestamp || Date.now()),
      source: data.source || 'External API',
      currency: data.currency || 'USD',
    };

    return price;
  } catch (error) {
    console.error('Failed to fetch electricity price:', error);
    
    // Return default fallback price
    return {
      pricePerKwh: 0.25,
      timestamp: new Date(),
      source: 'Default (API unavailable)',
      currency: 'USD',
    };
  }
};

/**
 * Initialize price fetching with periodic updates
 * @param apiUrl - The API endpoint URL
 * @param updateInterval - How often to fetch (in milliseconds)
 * @param onPriceUpdate - Callback when price updates
 * @returns Function to stop the updates
 */
export const startPriceMonitoring = (
  apiUrl: string,
  updateInterval: number,
  onPriceUpdate: (price: ElectricityPrice) => void
): (() => void) => {
  // Fetch immediately
  fetchLiveElectricityPrice(apiUrl).then(onPriceUpdate);

  // Set up periodic fetching
  const intervalId = setInterval(async () => {
    const price = await fetchLiveElectricityPrice(apiUrl);
    onPriceUpdate(price);
  }, updateInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Common API endpoints (examples)
 */
export const API_ENDPOINTS = {
  // Add your API endpoint here when you provide it
  CUSTOM: '', // You'll provide this
  
  // Common examples (may require API keys):
  EIA: 'https://api.eia.gov/v2/electricity/retail-sales',
  // CAISO: 'http://oasis.caiso.com/oasisapi/...',
  // etc.
};
