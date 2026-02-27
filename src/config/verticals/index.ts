/**
 * VERTICAL CONFIGURATIONS - Barrel Export
 * 
 * Import this file to register all verticals and access their configs.
 * Each vertical auto-registers via registerVertical() on import.
 * 
 * Usage:
 *   import { carWashConfig } from '@/config/verticals';
 *   import { getVerticalConfig, getAllVerticals } from '@/config/verticalConfig';
 */

// Import each vertical (side-effect: registers in VERTICAL_REGISTRY)
export { carWashConfig } from './carWash';
export { hotelConfig } from './hotel';
export { evChargingConfig } from './evCharging';
export { dataCenterConfig } from './dataCenter';
export { hospitalConfig } from './hospital';
export { manufacturingConfig } from './manufacturing';
export { retailConfig } from './retail';
export { warehouseConfig } from './warehouse';
export { officeConfig } from './office';
export { gasStationConfig } from './gasStation';
export { coldStorageConfig } from './coldStorage';
export { shoppingCenterConfig } from './shoppingCenter';
export { casinoConfig } from './casino';
export { airportConfig } from './airport';
export { collegeConfig } from './college';

// Re-export registry helpers
export {
  getVerticalConfig,
  getVerticalSlugs,
  getAllVerticals,
  registerVertical,
} from '../verticalConfig';

// Re-export types
export type {
  VerticalConfig,
  VerticalTheme,
  CarouselImage,
  HeroStat,
  HeroCallout,
  ValueProp,
  HowItWorksStep,
  CaseStudy,
  CalculatorInput,
  CalculatorConfig,
  QuickEstimateFn,
} from '../verticalConfig';

// Re-export shared state rates
export { STATE_RATES, STATE_NAMES, getStateRate, getVerticalDemandCharge } from '../stateRates';
export type { StateRateData } from '../stateRates';
