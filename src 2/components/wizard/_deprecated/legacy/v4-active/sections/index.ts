/**
 * WIZARD SECTIONS INDEX
 * =====================
 * 
 * Central export point for all wizard section components.
 * Part of December 2025 StreamlinedWizard refactor.
 * 
 * CLEANED UP Dec 21, 2025:
 * - Simplified wizard is now 5 steps (0-4)
 * - Removed deprecated sections that are no longer rendered
 * 
 * ACTIVE SECTIONS (Dec 21, 2025):
 * - Step 0: Step1LocationGoals (Location + Goals two-column)
 * - Step 1: Step2IndustrySize (Industry selection + size slider)
 * - Step 2: Step3FacilityDetails (Custom questions per industry)
 * - Step 3: GoalsSectionV3 (Equipment configuration)
 * - Step 4: QuoteResultsSection (Final TrueQuote™ results)
 */

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVE SECTION COMPONENTS - Simplified 5-step wizard (Dec 21, 2025 Redesign)
// Flow: Location → Industry → Facility Details → Review & Configure → Magic Fit
// ═══════════════════════════════════════════════════════════════════════════
export { Step1LocationGoals } from './Step1LocationGoals';         // Step 0: Location + Goals
export { Step2IndustrySize } from './Step2IndustrySize';           // Step 1: Industry + Size
export { Step3FacilityDetails } from './Step3FacilityDetails';     // Step 2: Facility Details (using V2 with smart dropdowns)
export { Step4ReviewConfigure } from './Step4ReviewConfigure';     // Step 3: Review & Configure (NEW Dec 21)
export { Step4MagicFit as Step5MagicFit } from './Step4MagicFit';  // Step 4: Magic Fit Results (renamed from Step4)
export { GoalsSectionV3 } from './GoalsSectionV3';                 // Legacy - kept for backwards compat
export { QuoteResultsSection } from './QuoteResultsSectionNew';    // Legacy - now embedded in Step5

// ═══════════════════════════════════════════════════════════════════════════
// DEPRECATED - Kept for backwards compatibility, NOT rendered in wizard
// TODO: Move to _deprecated/ folder in future cleanup
// ═══════════════════════════════════════════════════════════════════════════
export { WelcomeLocationSection } from './WelcomeLocationSection'; // Replaced by Step1LocationGoals
export { IndustrySection } from './IndustrySection';         // Replaced by Step2IndustrySize
export { FacilityDetailsSection } from './FacilityDetailsSection'; // Replaced by Step3FacilityDetails
export { FacilityDetailsSectionV2 } from './FacilityDetailsSectionV2'; // Replaced by Step3FacilityDetails
export { GoalsSection } from './GoalsSection';               // Replaced by GoalsSectionV3
export { GoalsSectionV2 } from './GoalsSectionV2';           // Replaced by GoalsSectionV3
export { ScenarioComparison, ScenarioCompact } from './ScenarioComparison'; // Removed from flow
export { ScenarioSection } from './ScenarioSection';         // Removed from flow (Dec 18)
export { ConfigurationComparison } from './ConfigurationComparison'; // Removed from flow (Dec 18)
export { CompareConfigureSection } from './CompareConfigureSection'; // Removed from flow
export { MagicFitSection } from './MagicFitSection';         // Removed from flow

// Shared panels (still used)
export { MerlinRecommendationPanel } from './MerlinRecommendationPanel';
