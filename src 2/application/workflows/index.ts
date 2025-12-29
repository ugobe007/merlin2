/**
 * Application Workflows - Barrel Export
 * ======================================
 * Central export point for all application workflows.
 * 
 * Workflows orchestrate business logic using:
 * - Repositories (infrastructure layer)
 * - Services (business logic)
 * - Domain types (contracts)
 * 
 * Usage:
 * import { buildQuote, getUseCaseDetails } from '@/application/workflows';
 */

export {
  buildQuote,
  getUseCasesForSelection,
  getUseCaseDetails,
  type BuildQuoteInput,
  type QuoteResult
} from './buildQuote';
