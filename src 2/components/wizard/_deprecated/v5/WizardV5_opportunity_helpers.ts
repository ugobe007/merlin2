/**
 * OPPORTUNITY DATA GENERATION HELPERS
 * ====================================
 * Helper functions for generating opportunity data for the Opportunity Discovery Modal
 * 
 * NOTE: This helper is now deprecated - MerlinInsightModal generates insights internally.
 * Keeping for backwards compatibility if needed elsewhere.
 */

import { assessBasicRisk } from '@/services/riskAssessmentService';
import { getIndustryOpportunities, type IndustryOpportunityData } from '@/services/marketConditionsService';

// Legacy OpportunityData interface (matches old OpportunityDiscoveryModal structure)
interface OpportunityData {
  solar: {
    available: boolean;
    peakSunHours: number;
    solarRating: 'excellent' | 'very good' | 'good' | 'fair' | 'poor';
    typicalSavings?: string;
    message: string;
  };
  battery: {
    available: boolean;
    typicalSavings?: string;
    message: string;
  };
  evCharging: {
    available: boolean;
    typicalRevenue?: string;
    message: string;
  };
  generator: {
    recommended: boolean;
    reason?: string;
    message: string;
  };
}

/**
 * Generate opportunity data for the discovery modal
 */
export function generateOpportunityData(
  state: string,
  industry: string,
  gridConnection: 'on-grid' | 'off-grid' | 'limited' | 'unreliable' | 'expensive'
): OpportunityData {
  // Get risk assessment
  const riskAssessment = assessBasicRisk(state, gridConnection);
  
  // Get industry opportunities
  const industryOps = getIndustryOpportunities(industry, state, gridConnection);
  
  // Build opportunity data
  const opportunities: OpportunityData = {
    solar: {
      available: riskAssessment.solarViability.available,
      peakSunHours: riskAssessment.solarViability.peakSunHours,
      solarRating: riskAssessment.solarViability.rating,
      typicalSavings: industryOps.solar.typicalSavings,
      message: industryOps.solar.message,
    },
    battery: {
      available: true, // Battery is always available, just varies in recommendation strength
      typicalSavings: industryOps.battery.typicalSavings,
      message: industryOps.battery.message,
    },
    evCharging: {
      available: true, // EV charging available for most industries
      typicalRevenue: industryOps.evCharging.typicalRevenue,
      message: industryOps.evCharging.message,
    },
    generator: {
      recommended: riskAssessment.backupNeeds.recommended,
      reason: riskAssessment.backupNeeds.reason,
      message: industryOps.generator.message,
    },
  };
  
  return opportunities;
}

