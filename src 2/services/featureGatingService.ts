/**
 * Feature Gating Service
 * 
 * Combines Power Profile levels (engagement-based) with Pricing Tiers (subscription-based)
 * to determine what features a user can access.
 * 
 * Philosophy:
 * - Power Profile: Rewards engagement and data completeness (1-7 levels)
 * - Pricing Tier: Unlocks premium capabilities via subscription
 * - Together: Create a value ladder that converts free users to paid
 */

import { authService } from './authService';

// ============================================================================
// Types
// ============================================================================

export type PricingTier = 'free' | 'professional' | 'enterprise_pro' | 'business';

export interface FeatureAccess {
  available: boolean;
  reason?: string;
  upgradeMessage?: string;
  requiredTier?: PricingTier;
  requiredLevel?: number;
}

export interface UserCapabilities {
  // Core limits
  quotesPerMonth: number;
  maxProjects: number;
  maxTeamMembers: number;
  
  // Power Profile
  maxPowerProfileLevel: number;
  
  // Features
  features: {
    basicEstimate: boolean;
    detailedEquipment: boolean;
    equipmentAlternatives: boolean;
    simpleROI: boolean;
    npvIrr: boolean;
    dcfAnalysis: boolean;
    sensitivityAnalysis: boolean;
    financingCalculator: boolean;
    aiRecommendations: boolean;
    marketIntelligence: boolean;
    pdfExport: boolean;
    pdfWatermark: boolean;
    wordExcelExport: boolean;
    whiteLabelBranding: boolean;
    customLogo: boolean;
    teamCollaboration: boolean;
    vendorQuoteManagement: boolean;
    apiAccess: boolean;
    dedicatedSupport: boolean;
    officialQuoteRequest: boolean;
  };
}

// ============================================================================
// Tier Configuration
// ============================================================================

const TIER_CAPABILITIES: Record<PricingTier, UserCapabilities> = {
  free: {
    quotesPerMonth: 3,
    maxProjects: 2,
    maxTeamMembers: 1,
    maxPowerProfileLevel: 3, // Can only see levels 1-3
    features: {
      basicEstimate: true,
      detailedEquipment: false,
      equipmentAlternatives: false,
      simpleROI: true,
      npvIrr: false,
      dcfAnalysis: false,
      sensitivityAnalysis: false,
      financingCalculator: false,
      aiRecommendations: false, // Teaser only
      marketIntelligence: false,
      pdfExport: true,
      pdfWatermark: true, // Watermarked with Merlin branding
      wordExcelExport: false,
      whiteLabelBranding: false,
      customLogo: false,
      teamCollaboration: false,
      vendorQuoteManagement: false,
      apiAccess: false,
      dedicatedSupport: false,
      officialQuoteRequest: true, // This is the lead gen hook!
    }
  },
  
  professional: {
    quotesPerMonth: -1, // Unlimited
    maxProjects: 25,
    maxTeamMembers: 1,
    maxPowerProfileLevel: 6, // Can see levels 1-6
    features: {
      basicEstimate: true,
      detailedEquipment: true,
      equipmentAlternatives: true,
      simpleROI: true,
      npvIrr: true,
      dcfAnalysis: true,
      sensitivityAnalysis: false,
      financingCalculator: true,
      aiRecommendations: true,
      marketIntelligence: false,
      pdfExport: true,
      pdfWatermark: false, // Clean exports
      wordExcelExport: true,
      whiteLabelBranding: false,
      customLogo: true,
      teamCollaboration: false,
      vendorQuoteManagement: false,
      apiAccess: false,
      dedicatedSupport: false,
      officialQuoteRequest: true, // Priority queue
    }
  },
  
  enterprise_pro: {
    quotesPerMonth: -1, // Unlimited
    maxProjects: -1, // Unlimited
    maxTeamMembers: 5,
    maxPowerProfileLevel: 7, // All levels
    features: {
      basicEstimate: true,
      detailedEquipment: true,
      equipmentAlternatives: true,
      simpleROI: true,
      npvIrr: true,
      dcfAnalysis: true,
      sensitivityAnalysis: true,
      financingCalculator: true,
      aiRecommendations: true,
      marketIntelligence: true,
      pdfExport: true,
      pdfWatermark: false,
      wordExcelExport: true,
      whiteLabelBranding: true,
      customLogo: true,
      teamCollaboration: true,
      vendorQuoteManagement: true,
      apiAccess: false,
      dedicatedSupport: false,
      officialQuoteRequest: true, // Dedicated support
    }
  },
  
  business: {
    quotesPerMonth: -1, // Unlimited
    maxProjects: -1, // Unlimited
    maxTeamMembers: -1, // Unlimited
    maxPowerProfileLevel: 7, // All levels
    features: {
      basicEstimate: true,
      detailedEquipment: true,
      equipmentAlternatives: true,
      simpleROI: true,
      npvIrr: true,
      dcfAnalysis: true,
      sensitivityAnalysis: true,
      financingCalculator: true,
      aiRecommendations: true,
      marketIntelligence: true,
      pdfExport: true,
      pdfWatermark: false,
      wordExcelExport: true,
      whiteLabelBranding: true,
      customLogo: true,
      teamCollaboration: true,
      vendorQuoteManagement: true,
      apiAccess: true,
      dedicatedSupport: true,
      officialQuoteRequest: true,
    }
  }
};

// ============================================================================
// Power Profile Level Benefits (what each level unlocks)
// ============================================================================

export const POWER_PROFILE_BENEFITS: Record<number, {
  title: string;
  benefits: string[];
  unlocks: string[];
}> = {
  1: {
    title: 'Initiate',
    benefits: ['Energy baseline assessment', 'Core quote generation'],
    unlocks: ['Basic system sizing', 'Simple estimates']
  },
  2: {
    title: 'Practitioner',
    benefits: ['Industry-specific insights', 'Basic financial modeling'],
    unlocks: ['ROI calculations', 'Payback period']
  },
  3: {
    title: 'Specialist',
    benefits: ['Intelligent system sizing', 'Multi-year projections'],
    unlocks: ['Equipment recommendations', 'Industry comparisons']
  },
  4: {
    title: 'Architect',
    benefits: ['Advanced analytics dashboard', 'Scenario comparison'],
    unlocks: ['NPV/IRR analysis', 'Cash flow modeling'],
  },
  5: {
    title: 'Strategist',
    benefits: ['AI-optimized recommendations', 'Ecosystem builder'],
    unlocks: ['Financing options', 'Installer network']
  },
  6: {
    title: 'Authority',
    benefits: ['Vendor marketplace access', 'Priority support'],
    unlocks: ['Vendor quotes', 'Technical specifications']
  },
  7: {
    title: 'Luminary',
    benefits: ['Real-time optimization', 'Industry intelligence'],
    unlocks: ['Market reports', 'Dedicated advisor']
  }
};

// ============================================================================
// Feature Gating Functions
// ============================================================================

/**
 * Get the current user's pricing tier
 */
export function getCurrentUserTier(): PricingTier {
  const user = authService.getCurrentUser();
  return (user?.tier as PricingTier) || 'free';
}

/**
 * Get capabilities for a specific tier
 */
export function getTierCapabilities(tier: PricingTier): UserCapabilities {
  return TIER_CAPABILITIES[tier] || TIER_CAPABILITIES.free;
}

/**
 * Get current user's capabilities
 */
export function getCurrentUserCapabilities(): UserCapabilities {
  const tier = getCurrentUserTier();
  return getTierCapabilities(tier);
}

/**
 * Check if a specific feature is available
 */
export function isFeatureAvailable(
  featureKey: keyof UserCapabilities['features'],
  powerProfileLevel?: number
): FeatureAccess {
  const tier = getCurrentUserTier();
  const capabilities = getTierCapabilities(tier);
  
  // Check tier-based feature access
  const tierHasFeature = capabilities.features[featureKey];
  
  // Check power profile level requirement (if applicable)
  const levelRequirement = getFeatureLevelRequirement(featureKey);
  const userLevel = powerProfileLevel || 1;
  const meetsLevelRequirement = userLevel >= levelRequirement;
  const levelCappedByTier = userLevel <= capabilities.maxPowerProfileLevel;
  
  if (!tierHasFeature) {
    return {
      available: false,
      reason: 'Feature not available in your current plan',
      upgradeMessage: getUpgradeMessage(featureKey),
      requiredTier: getRequiredTierForFeature(featureKey)
    };
  }
  
  if (!levelCappedByTier && levelRequirement > capabilities.maxPowerProfileLevel) {
    return {
      available: false,
      reason: `Requires Power Profile Level ${levelRequirement}`,
      upgradeMessage: `Upgrade to unlock levels beyond ${capabilities.maxPowerProfileLevel}`,
      requiredLevel: levelRequirement
    };
  }
  
  if (!meetsLevelRequirement) {
    return {
      available: false,
      reason: `Requires Power Profile Level ${levelRequirement}`,
      upgradeMessage: `Complete more profile questions to reach Level ${levelRequirement}`,
      requiredLevel: levelRequirement
    };
  }
  
  return { available: true };
}

/**
 * Get the minimum Power Profile level required for a feature
 */
function getFeatureLevelRequirement(featureKey: keyof UserCapabilities['features']): number {
  const levelRequirements: Partial<Record<keyof UserCapabilities['features'], number>> = {
    basicEstimate: 1,
    simpleROI: 2,
    detailedEquipment: 3,
    equipmentAlternatives: 3,
    npvIrr: 4,
    dcfAnalysis: 4,
    financingCalculator: 5,
    aiRecommendations: 5,
    sensitivityAnalysis: 6,
    vendorQuoteManagement: 6,
    marketIntelligence: 7,
  };
  
  return levelRequirements[featureKey] || 1;
}

/**
 * Get the minimum tier required for a feature
 */
function getRequiredTierForFeature(featureKey: keyof UserCapabilities['features']): PricingTier {
  // Find the lowest tier that has this feature
  const tiers: PricingTier[] = ['free', 'professional', 'enterprise_pro', 'business'];
  
  for (const tier of tiers) {
    if (TIER_CAPABILITIES[tier].features[featureKey]) {
      return tier;
    }
  }
  
  return 'business';
}

/**
 * Get a compelling upgrade message for a feature
 */
function getUpgradeMessage(featureKey: keyof UserCapabilities['features']): string {
  const messages: Partial<Record<keyof UserCapabilities['features'], string>> = {
    npvIrr: 'Unlock NPV & IRR analysis with Professional plan - see the true value of your investment',
    dcfAnalysis: 'Get detailed cash flow modeling with Professional plan',
    sensitivityAnalysis: 'Run what-if scenarios with Enterprise Pro',
    financingCalculator: 'Explore financing options with Professional plan',
    aiRecommendations: 'Get AI-powered recommendations with Professional plan',
    marketIntelligence: 'Access real-time market intelligence with Enterprise Pro',
    detailedEquipment: 'See detailed equipment specs with Professional plan',
    equipmentAlternatives: 'Compare equipment alternatives with Professional plan',
    wordExcelExport: 'Export to Word & Excel with Professional plan',
    whiteLabelBranding: 'Add your branding with Enterprise Pro',
    teamCollaboration: 'Collaborate with your team on Enterprise Pro',
    vendorQuoteManagement: 'Manage vendor quotes with Enterprise Pro',
    apiAccess: 'Get API access with Business plan',
  };
  
  return messages[featureKey] || 'Upgrade to unlock this feature';
}

/**
 * Check if user can create more quotes this month
 */
export function canCreateQuote(): FeatureAccess {
  const capabilities = getCurrentUserCapabilities();
  
  if (capabilities.quotesPerMonth === -1) {
    return { available: true };
  }
  
  // TODO: Track actual quote count in database
  // For now, always allow (tracking to be implemented)
  return { available: true };
}

/**
 * Check if user can save more projects
 */
export function canSaveProject(currentProjectCount: number): FeatureAccess {
  const capabilities = getCurrentUserCapabilities();
  
  if (capabilities.maxProjects === -1) {
    return { available: true };
  }
  
  if (currentProjectCount >= capabilities.maxProjects) {
    return {
      available: false,
      reason: `You've reached your limit of ${capabilities.maxProjects} projects`,
      upgradeMessage: 'Upgrade to Professional for 25 projects, or Enterprise Pro for unlimited',
      requiredTier: 'professional'
    };
  }
  
  return { available: true };
}

/**
 * Get the effective Power Profile level (capped by tier)
 */
export function getEffectivePowerProfileLevel(actualLevel: number): number {
  const capabilities = getCurrentUserCapabilities();
  return Math.min(actualLevel, capabilities.maxPowerProfileLevel);
}

/**
 * Check if user's Power Profile is capped by their tier
 */
export function isPowerProfileCapped(actualLevel: number): {
  isCapped: boolean;
  actualLevel: number;
  cappedLevel: number;
  upgradeMessage?: string;
} {
  const capabilities = getCurrentUserCapabilities();
  const cappedLevel = Math.min(actualLevel, capabilities.maxPowerProfileLevel);
  const isCapped = actualLevel > cappedLevel;
  
  return {
    isCapped,
    actualLevel,
    cappedLevel,
    upgradeMessage: isCapped 
      ? `Your Power Profile is Level ${actualLevel}, but you're limited to Level ${cappedLevel}. Upgrade to unlock your full potential!`
      : undefined
  };
}

/**
 * Get tier comparison for upgrade prompts
 */
export function getTierComparison(): {
  current: PricingTier;
  currentCapabilities: UserCapabilities;
  nextTier?: PricingTier;
  nextCapabilities?: UserCapabilities;
  upgradeBenefits?: string[];
} {
  const current = getCurrentUserTier();
  const currentCapabilities = getTierCapabilities(current);
  
  const tierOrder: PricingTier[] = ['free', 'professional', 'enterprise_pro', 'business'];
  const currentIndex = tierOrder.indexOf(current);
  
  if (currentIndex >= tierOrder.length - 1) {
    return { current, currentCapabilities };
  }
  
  const nextTier = tierOrder[currentIndex + 1];
  const nextCapabilities = getTierCapabilities(nextTier);
  
  // Calculate upgrade benefits
  const upgradeBenefits: string[] = [];
  
  if (nextCapabilities.quotesPerMonth === -1 && currentCapabilities.quotesPerMonth !== -1) {
    upgradeBenefits.push('Unlimited quotes');
  }
  
  if (nextCapabilities.maxProjects > currentCapabilities.maxProjects) {
    upgradeBenefits.push(nextCapabilities.maxProjects === -1 
      ? 'Unlimited projects' 
      : `${nextCapabilities.maxProjects} projects`
    );
  }
  
  if (nextCapabilities.maxPowerProfileLevel > currentCapabilities.maxPowerProfileLevel) {
    upgradeBenefits.push(`Power Profile up to Level ${nextCapabilities.maxPowerProfileLevel}`);
  }
  
  // Feature upgrades
  const featureNames: Record<string, string> = {
    npvIrr: 'NPV & IRR analysis',
    dcfAnalysis: 'Cash flow modeling',
    sensitivityAnalysis: 'Sensitivity analysis',
    financingCalculator: 'Financing calculator',
    aiRecommendations: 'AI recommendations',
    marketIntelligence: 'Market intelligence',
    wordExcelExport: 'Word & Excel export',
    whiteLabelBranding: 'White-label branding',
    teamCollaboration: 'Team collaboration',
  };
  
  Object.entries(nextCapabilities.features).forEach(([key, value]) => {
    const typedKey = key as keyof UserCapabilities['features'];
    if (value && !currentCapabilities.features[typedKey] && featureNames[key]) {
      upgradeBenefits.push(featureNames[key]);
    }
  });
  
  return {
    current,
    currentCapabilities,
    nextTier,
    nextCapabilities,
    upgradeBenefits
  };
}

// ============================================================================
// Export service object
// ============================================================================

export const featureGatingService = {
  getCurrentUserTier,
  getTierCapabilities,
  getCurrentUserCapabilities,
  isFeatureAvailable,
  canCreateQuote,
  canSaveProject,
  getEffectivePowerProfileLevel,
  isPowerProfileCapped,
  getTierComparison,
  POWER_PROFILE_BENEFITS,
  TIER_CAPABILITIES,
};

export default featureGatingService;
