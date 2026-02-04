/**
 * Pricing Bridge Module (Feb 3, 2026)
 * 
 * Layer B of the V7 Quote Architecture:
 * - Layer A (contract quote): Physics → Load Profile + Sizing Hints
 * - Layer B (pricing bridge): Load Profile → Financial Metrics via SSOT
 * 
 * This module converts load calculations into bankable financial outputs.
 */

export {
  runPricingQuote,
  getSizingDefaults,
  generatePricingSnapshotId,
  generatePricingRunId,
  type ContractQuoteResult,
  type PricingQuoteResult,
  type PricingQuoteData,
  type WizardQuoteSSOT,
  type PricingConfig,
} from "./pricingBridge";
// Mock control for smoke tests (DEV only)
export {
  getMockPricingMode,
  getMockBehavior,
  type MockPricingMode,
} from "./mockPricingControl";