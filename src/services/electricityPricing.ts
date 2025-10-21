/**
 * Electricity Pricing Service
 * Fetches live market prices from ComEd API for electricity to use in BESS calculations
 */

export interface ElectricityPrice {
  pricePerKwh: number;
  timestamp: Date;
  source: string;
  currency: string;
}

/**
 * Fetch live electricity price from ComEd API
 * @param apiUrl - The API endpoint URL (defaults to ComEd current hour average)
 * @returns Current electricity price data
 */
export const fetchLiveElectricityPrice = async (
  apiUrl: string = 'https://hourlypricing.comed.com/api?type=currenthouraverage&format=json'
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
    
    // ComEd API returns: [{"millisUTC":"1438798200000","price":"8.3"}]
    // Price is in cents, we need to convert to dollars
    const latestData = Array.isArray(data) ? data[0] : data;
    const priceInCents = parseFloat(latestData.price || 0);
    const priceInDollars = priceInCents / 100; // Convert cents to dollars
    
    const price: ElectricityPrice = {
      pricePerKwh: priceInDollars,
      timestamp: new Date(parseInt(latestData.millisUTC || Date.now())),
      source: 'ComEd Real-Time Market',
      currency: 'USD',
    };

    console.log('⚡ ComEd price fetched:', {
      cents: priceInCents,
      dollars: priceInDollars,
      time: price.timestamp.toLocaleString()
    });

    return price;
  } catch (error) {
    console.error('Failed to fetch electricity price from ComEd:', error);
    
    // Return default fallback price
    return {
      pricePerKwh: 0.05, // Updated default to match typical ComEd rates
      timestamp: new Date(),
      source: 'Default (ComEd API unavailable)',
      currency: 'USD',
    };
  }
};

/**
 * Initialize price fetching with periodic updates
 * @param updateInterval - How often to fetch (in milliseconds)
 * @param onPriceUpdate - Callback when price updates
 * @returns Function to stop the updates
 */
export const startPriceMonitoring = (
  updateInterval: number,
  onPriceUpdate: (price: ElectricityPrice) => void
): (() => void) => {
  // Fetch immediately
  fetchLiveElectricityPrice().then(onPriceUpdate);

  // Set up periodic fetching
  const intervalId = setInterval(async () => {
    const price = await fetchLiveElectricityPrice();
    onPriceUpdate(price);
  }, updateInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * ComEd API endpoint
 */
export const COMED_API_URL = 'https://hourlypricing.comed.com/api?type=currenthouraverage&format=json';
