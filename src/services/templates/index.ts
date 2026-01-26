/**
 * Template Services Index
 * 
 * Re-exports all template-related services for clean imports.
 */

export {
  applyTemplateDefaults,
  applyCarWashTemplateDefaults,
  applyHotelTemplateDefaults,
} from "./applyTemplateDefaults";

export {
  getDeviationFlags,
  getCarWashDeviationFlags,
  getHotelDeviationFlags,
  type DeviationFlag,
} from "./deviationFlags";
