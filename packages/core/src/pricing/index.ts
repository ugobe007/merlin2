/**
 * Pricing Module - Market-Driven Pricing Export
 * =============================================
 * 
 * Exports pricing services that integrate with:
 * - Market scraper (RSS feeds, web sources)
 * - ML agent (harmonizes pricing)
 * - Database (equipment_pricing table)
 * - Vendor submissions (approved products)
 */

export {
  getBatteryPricing,
  getSolarPricing,
  getInverterPricing,
  clearAllPricingCaches,
  type BatteryPricing,
  type SolarPricing,
  type InverterPricing
} from './unifiedPricingService';

export {
  getMarketPrices,
  getMarketPriceSummary,
  saveMarketPrice,
  type MarketPriceData,
  type MarketPriceSummary
} from './marketDataIntegrationService';

