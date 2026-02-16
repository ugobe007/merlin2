/**
 * Sub-Industry & Business Size Service
 * =====================================
 * 
 * SSOT service for fetching sub-industries and business size tiers
 * from the database. Used by the conversational wizard to:
 * 
 * 1. Show sub-industry options in Step 2
 * 2. Determine business size tier based on user input
 * 3. Get questionnaire depth for dynamic question filtering
 * 
 * Created: January 14, 2026
 */

import { supabase } from './supabaseClient';

// Database row types
interface SubIndustryRow {
  id: string;
  industry_slug: string;
  sub_industry_slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  load_multiplier: string | number;
  backup_multiplier: string | number;
  solar_affinity: string | number;
  ev_affinity: string | number;
  typical_size_min: number | null;
  typical_size_max: number | null;
  size_unit: string | null;
  display_order: number;
  is_active: boolean;
}

interface BusinessSizeTierRow {
  id: string;
  industry_slug: string;
  tier: 'small' | 'medium' | 'large' | 'enterprise';
  tier_name: string;
  size_field: string;
  min_value: number | null;
  max_value: number | null;
  questionnaire_depth: 'minimal' | 'standard' | 'detailed';
  target_question_count: number;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

// ============================================================================
// TYPES
// ============================================================================

export interface SubIndustry {
  id: string;
  industrySlug: string;
  subIndustrySlug: string;
  name: string;
  description: string | null;
  icon: string | null;
  loadMultiplier: number;
  backupMultiplier: number;
  solarAffinity: number;
  evAffinity: number;
  typicalSizeMin: number | null;
  typicalSizeMax: number | null;
  sizeUnit: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface BusinessSizeTier {
  id: string;
  industrySlug: string;
  tier: 'small' | 'medium' | 'large' | 'enterprise';
  tierName: string;
  sizeField: string;
  minValue: number | null;
  maxValue: number | null;
  questionnaireDepth: 'minimal' | 'standard' | 'detailed';
  targetQuestionCount: number;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface QuestionTierResult {
  tier: 'small' | 'medium' | 'large' | 'enterprise';
  tierName: string;
  questionnaireDepth: 'minimal' | 'standard' | 'detailed';
  targetQuestionCount: number;
}

// ============================================================================
// SUB-INDUSTRY QUERIES
// ============================================================================

/**
 * Get all sub-industries for a given industry
 */
export async function getSubIndustries(industrySlug: string): Promise<SubIndustry[]> {
  const { data, error } = await supabase
    .from('sub_industries')
    .select('*')
    .eq('industry_slug', industrySlug)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching sub-industries:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    industrySlug: row.industry_slug,
    subIndustrySlug: row.sub_industry_slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    loadMultiplier: Number(row.load_multiplier) || 1.0,
    backupMultiplier: Number(row.backup_multiplier) || 1.0,
    solarAffinity: Number(row.solar_affinity) || 1.0,
    evAffinity: Number(row.ev_affinity) || 1.0,
    typicalSizeMin: row.typical_size_min,
    typicalSizeMax: row.typical_size_max,
    sizeUnit: row.size_unit,
    displayOrder: row.display_order ?? 0,
    isActive: row.is_active ?? true,
  }));
}

/**
 * Get a specific sub-industry by slug
 */
export async function getSubIndustry(
  industrySlug: string, 
  subIndustrySlug: string
): Promise<SubIndustry | null> {
  const { data, error } = await supabase
    .from('sub_industries')
    .select('*')
    .eq('industry_slug', industrySlug)
    .eq('sub_industry_slug', subIndustrySlug)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    industrySlug: data.industry_slug,
    subIndustrySlug: data.sub_industry_slug,
    name: data.name,
    description: data.description,
    icon: data.icon,
    loadMultiplier: Number(data.load_multiplier) || 1.0,
    backupMultiplier: Number(data.backup_multiplier) || 1.0,
    solarAffinity: Number(data.solar_affinity) || 1.0,
    evAffinity: Number(data.ev_affinity) || 1.0,
    typicalSizeMin: data.typical_size_min,
    typicalSizeMax: data.typical_size_max,
    sizeUnit: data.size_unit,
    displayOrder: data.display_order ?? 0,
    isActive: data.is_active ?? true,
  };
}

// ============================================================================
// BUSINESS SIZE TIER QUERIES
// ============================================================================

/**
 * Get all business size tiers for an industry
 */
export async function getBusinessSizeTiers(industrySlug: string): Promise<BusinessSizeTier[]> {
  const { data, error } = await supabase
    .from('business_size_tiers')
    .select('*')
    .eq('industry_slug', industrySlug)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching business size tiers:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    industrySlug: row.industry_slug,
    tier: row.tier as BusinessSizeTier['tier'],
    tierName: row.tier_name,
    sizeField: row.size_field,
    minValue: row.min_value,
    maxValue: row.max_value,
    questionnaireDepth: row.questionnaire_depth as BusinessSizeTier['questionnaireDepth'],
    targetQuestionCount: row.target_question_count ?? 15,
    description: row.description,
    displayOrder: row.display_order ?? 0,
    isActive: row.is_active ?? true,
  }));
}

/**
 * Determine business size tier based on industry and size value
 * Returns the matching tier with questionnaire depth info
 */
export async function determineBusinessSizeTier(
  industrySlug: string,
  sizeValue: number
): Promise<QuestionTierResult | null> {
  const tiers = await getBusinessSizeTiers(industrySlug);
  
  // Find the matching tier
  const matchingTier = tiers.find(tier => {
    const meetsMin = tier.minValue === null || sizeValue >= tier.minValue;
    const meetsMax = tier.maxValue === null || sizeValue <= tier.maxValue;
    return meetsMin && meetsMax;
  });

  if (!matchingTier) {
    // Default to 'medium' if no match found
    return {
      tier: 'medium',
      tierName: 'Medium',
      questionnaireDepth: 'standard',
      targetQuestionCount: 15,
    };
  }

  return {
    tier: matchingTier.tier,
    tierName: matchingTier.tierName,
    questionnaireDepth: matchingTier.questionnaireDepth,
    targetQuestionCount: matchingTier.targetQuestionCount,
  };
}

/**
 * Get the size field name for an industry (e.g., 'roomCount' for hotels)
 */
export async function getSizeFieldForIndustry(industrySlug: string): Promise<string | null> {
  const tiers = await getBusinessSizeTiers(industrySlug);
  if (tiers.length === 0) return null;
  return tiers[0].sizeField;
}

// ============================================================================
// QUESTION FILTERING
// ============================================================================

export type QuestionTier = 'essential' | 'standard' | 'detailed';

/**
 * Get questions filtered by tier depth
 * - minimal: only essential questions
 * - standard: essential + standard questions
 * - detailed: all questions
 */
export function getQuestionTiersToInclude(depth: 'minimal' | 'standard' | 'detailed'): QuestionTier[] {
  switch (depth) {
    case 'minimal':
      return ['essential'];
    case 'standard':
      return ['essential', 'standard'];
    case 'detailed':
      return ['essential', 'standard', 'detailed'];
    default:
      return ['essential', 'standard'];
  }
}

/**
 * Check if a question should be shown based on questionnaire depth
 */
export function shouldShowQuestion(
  questionTier: QuestionTier,
  questionnaireDepth: 'minimal' | 'standard' | 'detailed'
): boolean {
  const includedTiers = getQuestionTiersToInclude(questionnaireDepth);
  return includedTiers.includes(questionTier);
}

// ============================================================================
// COMBINED HELPERS
// ============================================================================

export interface IndustryContext {
  industrySlug: string;
  industryName: string;
  subIndustry: SubIndustry | null;
  sizeTier: QuestionTierResult | null;
  sizeValue: number | null;
  loadMultiplier: number;
  backupMultiplier: number;
  solarAffinity: number;
  evAffinity: number;
}

/**
 * Build complete industry context from wizard state
 * Used by TrueQuote to apply sub-industry multipliers
 */
export async function buildIndustryContext(
  industrySlug: string,
  industryName: string,
  subIndustrySlug?: string,
  sizeValue?: number
): Promise<IndustryContext> {
  // Get sub-industry if specified
  let subIndustry: SubIndustry | null = null;
  if (subIndustrySlug) {
    subIndustry = await getSubIndustry(industrySlug, subIndustrySlug);
  }

  // Determine size tier if size value provided
  let sizeTier: QuestionTierResult | null = null;
  if (sizeValue !== undefined && sizeValue > 0) {
    sizeTier = await determineBusinessSizeTier(industrySlug, sizeValue);
  }

  return {
    industrySlug,
    industryName,
    subIndustry,
    sizeTier,
    sizeValue: sizeValue ?? null,
    loadMultiplier: subIndustry?.loadMultiplier ?? 1.0,
    backupMultiplier: subIndustry?.backupMultiplier ?? 1.0,
    solarAffinity: subIndustry?.solarAffinity ?? 1.0,
    evAffinity: subIndustry?.evAffinity ?? 1.0,
  };
}

// ============================================================================
// FALLBACK DATA (for offline/error scenarios)
// ============================================================================

export const FALLBACK_SUB_INDUSTRIES: Record<string, SubIndustry[]> = {
  hotel: [
    { id: '1', industrySlug: 'hotel', subIndustrySlug: 'economy', name: 'Economy / Budget', description: null, icon: '🏨', loadMultiplier: 0.7, backupMultiplier: 0.5, solarAffinity: 0.8, evAffinity: 0.6, typicalSizeMin: 30, typicalSizeMax: 100, sizeUnit: 'rooms', displayOrder: 1, isActive: true },
    { id: '2', industrySlug: 'hotel', subIndustrySlug: 'midscale', name: 'Midscale', description: null, icon: '🏨', loadMultiplier: 0.85, backupMultiplier: 0.7, solarAffinity: 1.0, evAffinity: 0.8, typicalSizeMin: 50, typicalSizeMax: 150, sizeUnit: 'rooms', displayOrder: 2, isActive: true },
    { id: '3', industrySlug: 'hotel', subIndustrySlug: 'upscale', name: 'Upscale / Full-Service', description: null, icon: '🏨', loadMultiplier: 1.0, backupMultiplier: 0.85, solarAffinity: 1.1, evAffinity: 1.0, typicalSizeMin: 100, typicalSizeMax: 300, sizeUnit: 'rooms', displayOrder: 3, isActive: true },
    { id: '4', industrySlug: 'hotel', subIndustrySlug: 'luxury', name: 'Luxury Resort', description: null, icon: '🏨', loadMultiplier: 1.4, backupMultiplier: 1.0, solarAffinity: 1.2, evAffinity: 1.2, typicalSizeMin: 150, typicalSizeMax: 500, sizeUnit: 'rooms', displayOrder: 4, isActive: true },
  ],
  car_wash: [
    { id: '5', industrySlug: 'car_wash', subIndustrySlug: 'self_service', name: 'Self-Service', description: null, icon: '🚿', loadMultiplier: 0.6, backupMultiplier: 0.4, solarAffinity: 1.2, evAffinity: 0.5, typicalSizeMin: 4, typicalSizeMax: 12, sizeUnit: 'bays', displayOrder: 1, isActive: true },
    { id: '6', industrySlug: 'car_wash', subIndustrySlug: 'express_tunnel', name: 'Express Tunnel', description: null, icon: '🚗', loadMultiplier: 1.0, backupMultiplier: 0.8, solarAffinity: 1.0, evAffinity: 0.9, typicalSizeMin: 1, typicalSizeMax: 2, sizeUnit: 'tunnels', displayOrder: 3, isActive: true },
    { id: '7', industrySlug: 'car_wash', subIndustrySlug: 'full_service', name: 'Full-Service', description: null, icon: '✨', loadMultiplier: 1.2, backupMultiplier: 0.9, solarAffinity: 1.0, evAffinity: 1.1, typicalSizeMin: 1, typicalSizeMax: 2, sizeUnit: 'tunnels', displayOrder: 4, isActive: true },
  ],
  ev_charging: [
    { id: '8', industrySlug: 'ev_charging', subIndustrySlug: 'destination', name: 'Destination Charging', description: null, icon: '🅿️', loadMultiplier: 0.6, backupMultiplier: 0.4, solarAffinity: 1.3, evAffinity: 1.5, typicalSizeMin: 4, typicalSizeMax: 20, sizeUnit: 'chargers', displayOrder: 1, isActive: true },
    { id: '9', industrySlug: 'ev_charging', subIndustrySlug: 'public_station', name: 'Public Charging Station', description: null, icon: '⚡', loadMultiplier: 1.0, backupMultiplier: 0.7, solarAffinity: 1.2, evAffinity: 1.8, typicalSizeMin: 4, typicalSizeMax: 24, sizeUnit: 'chargers', displayOrder: 2, isActive: true },
    { id: '10', industrySlug: 'ev_charging', subIndustrySlug: 'fleet_depot', name: 'Fleet Depot', description: null, icon: '🚐', loadMultiplier: 1.4, backupMultiplier: 1.0, solarAffinity: 1.0, evAffinity: 2.0, typicalSizeMin: 10, typicalSizeMax: 100, sizeUnit: 'chargers', displayOrder: 3, isActive: true },
  ],
};

/**
 * Get sub-industries with fallback for offline scenarios
 */
export async function getSubIndustriesWithFallback(industrySlug: string): Promise<SubIndustry[]> {
  try {
    const subIndustries = await getSubIndustries(industrySlug);
    if (subIndustries.length > 0) {
      return subIndustries;
    }
  } catch (error) {
    console.warn('Failed to fetch sub-industries from database, using fallback');
  }
  
  return FALLBACK_SUB_INDUSTRIES[industrySlug] || [];
}
