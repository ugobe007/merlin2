/**
 * Wizard Indicators - Power Gap, Solar Opportunity, Energy Status, Savings Scout
 * 
 * These components display real-time calculations and opportunities
 * based on user inputs throughout the wizard flow.
 */

export { PowerGapIndicator } from './PowerGapIndicator';
export { SolarOpportunityIndicator } from './SolarOpportunityIndicator';
export { PowerStatusCard } from './PowerStatusCard';

// Savings Scout™ - Location-aware opportunity detection widget
export { 
  SavingsScoutNavbar,
  SavingsScoutInline,
  SavingsScoutCard,
  OpportunityCard,
  calculateSavingsOpportunities,
  getSavingsScoutResult,
} from './SavingsScoutWidget';

// Legacy export for backwards compatibility (deprecated)
// Use SavingsScoutWidget components instead
export { EnergyOpportunityBadge } from './EnergyOpportunityBadge';
