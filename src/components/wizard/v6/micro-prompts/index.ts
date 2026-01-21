/**
 * Micro-Prompts Index
 * ===================
 * Progressive model collection components for TrueQuote™ accuracy.
 *
 * Philosophy: Collect essential data through micro-interactions,
 * NOT raw form fields. Each prompt takes < 3 seconds to answer.
 *
 * Created: January 21, 2026
 */

// Individual micro-prompts
export { ServiceSizePrompt } from "./ServiceSizePrompt";
export { DemandChargePrompt } from "./DemandChargePrompt";
export { HVACTypePrompt } from "./HVACTypePrompt";
export { BackupGeneratorPrompt, GENERATOR_RELEVANT_INDUSTRIES } from "./BackupGeneratorPrompt";

// Combined panel (recommended for use in wizard)
export { ProgressiveModelPanel } from "./ProgressiveModelPanel";

// Re-export types for convenience
export type {
  ServiceSizeOption,
  DemandChargeBand,
  HVACTypeOption,
  GeneratorCapacityBand,
  ProgressiveModelInference,
} from "../types";

export {
  SERVICE_SIZE_TO_CAPACITY,
  DEMAND_CHARGE_BAND_TO_RATE,
  HVAC_TYPE_MULTIPLIERS,
  GENERATOR_BAND_TO_KW,
} from "../types";
