/**
 * MerlinAdvisor Rail System (Phase 1 - Jan 16, 2026)
 * 
 * Two-column layout governance system for WizardV6.
 * Steps publish content to rail, never import AdvisorRail directly.
 * 
 * Usage:
 * ```typescript
 * import { useAdvisorPublisher } from '@/components/wizard/v6/advisor';
 * 
 * function StepComponent() {
 *   const { publish } = useAdvisorPublisher();
 *   
 *   publish({
 *     step: 1,
 *     key: 'step-1-content',
 *     version: 1,
 *     mode: 'estimate',
 *     headline: 'Your Quote Preview',
 *     cards: [
 *       { type: 'discovery', title: '...', body: '...' },
 *     ],
 *   });
 * }
 * ```
 */

// Types & constants
export type {
  AdvisorMode,
  AdvisorCardType,
  AdvisorCard,
  AdvisorPayload,
  AdvisorPublishOptions,
} from './advisorTypes';

// Utilities - Note: Some may not be exported yet, commenting out
// export {
//   wordCount,
//   sanitizeText,
//   truncate,
//   stableKey,
//   isValidIconName,
// } from './advisorUtils';

// Budget enforcement
export { enforceAdvisorBudget } from './advisorBudget';

// Publishing API (hook + provider)
export { AdvisorPublisher, useAdvisorPublisher } from './AdvisorPublisher';

// DO NOT export AdvisorRail or AdvisorCard here — they should never be imported by steps.
// Only WizardV6 imports AdvisorRail. Cards are internal to the rail rendering logic.
