/**
 * WIZARD SECTIONS INDEX
 * =====================
 * 
 * Central export point for all wizard section components.
 * Part of December 2025 StreamlinedWizard refactor.
 * 
 * CLEANED UP Dec 16, 2025: Removed unused ConfigurationSection
 * ADDED Dec 16, 2025: FacilityDetailsSectionV2 with smart dropdowns
 */

// Section components
export { WelcomeLocationSection } from './WelcomeLocationSection';
export { IndustrySection } from './IndustrySection';
export { FacilityDetailsSection } from './FacilityDetailsSection';
export { FacilityDetailsSectionV2 } from './FacilityDetailsSectionV2';
export { GoalsSection } from './GoalsSection';
export { GoalsSectionV2 } from './GoalsSectionV2';
// Using new redesigned quote template (Dec 14, 2025)
export { QuoteResultsSection } from './QuoteResultsSectionNew';

// Scenario comparison (Dec 2025 - Phase 3)
export { ScenarioComparison, ScenarioCompact } from './ScenarioComparison';

// Scenario Section - Step 4 Magic Fit (Dec 2025)
export { ScenarioSection } from './ScenarioSection';

// Configuration Comparison - User vs Merlin (Dec 2025)
export { ConfigurationComparison } from './ConfigurationComparison';

// Compare & Configure Section - Step 3 "Mind Twist" (Dec 2025)
export { CompareConfigureSection } from './CompareConfigureSection';

// Magic Fit™ Section - Step 4 "Wizard on Steroids" (Dec 2025)
export { MagicFitSection } from './MagicFitSection';

// Shared panels
export { MerlinRecommendationPanel } from './MerlinRecommendationPanel';
