/**
 * MERLIN ENERGY SYSTEM - PUBLIC API
 * 
 * This is the clean interface for the wizard to interact with the
 * Porsche 911 architecture.
 * 
 * Usage:
 * ```typescript
 * import { generateQuote, isAuthenticated } from '@/services/merlin';
 * 
 * const result = await generateQuote(wizardState);
 * if (isAuthenticated(result)) {
 *   // Display result.options.starter, perfectFit, beastMode
 * }
 * ```
 */

// Main orchestrator
export { 
  generateQuote,
  getOrchestratorStatus,
  getQuickEstimate,
} from '../MerlinOrchestrator';

// Type guards
export { 
  isAuthenticated, 
  isRejected,
} from '../contracts';

// Types for consumers
export type {
  MerlinRequest,
  TrueQuoteAuthenticatedResult,
  TrueQuoteRejection,
  AuthenticatedSystemOption,
  SystemOption,
  EnergyGoal,
  Industry,
} from '../contracts';

// Engine info (for debugging/status)
export { getEngineInfo } from '../TrueQuoteEngineV2';
