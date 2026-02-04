/**
 * CURATED FIELDS RESOLVER (Phase 1: Step 3 Magic Restoration)
 * 
 * Created: February 2, 2026
 * 
 * PURPOSE:
 * ========
 * This resolver is the SINGLE SOURCE OF TRUTH for Step 3 field schemas.
 * It replaces the broken templateMapping that collapsed 14 industries into 3.
 * 
 * DOCTRINE:
 * - Templates can exist for copy/sections/order
 * - But the FIELD SET comes from this curated schema
 * - Each industry has its own lovingly-crafted question definitions
 * - Icons, validation, conditional logic, Merlin tips - all preserved
 * 
 * ARCHITECTURE:
 * - resolveStep3Schema(industry) → returns curated fields list
 * - Step 3 uses this, NOT the backend template's questions
 * - Backend templates are "thin" (sections, order) - NOT the field definitions
 */

import type { Question as CarWashQuestion } from '@/data/carwash-questions-complete.config';
import { carWashQuestionsComplete, carWashSections } from '@/data/carwash-questions-complete.config';
import { industryQuestionnaires, type Question as LegacyQuestion } from '@/data/industryQuestionnaires';

// ============================================================================
// TIER 1 BLOCKERS — Single Source of Truth for Step 3 Gating
// ============================================================================

/**
 * Tier 1 Blockers: Questions that MUST be answered for "definitive" load profile.
 * 
 * Principle: Keep this 6-10 max per industry.
 * - If a question materially changes peak kW, duty cycle, or energy per unit → Tier 1
 * - If only used for solar/roof, incentives, layout, features → Tier 2 (recommended)
 * 
 * Tier 2 questions remain required in schema for UI emphasis, but don't gate navigation.
 * 
 * Updated: Feb 3, 2026 — Car wash reduced from 24 to 8 blockers
 */
const TIER1_BLOCKERS: Record<string, string[]> = {
  'car-wash': [
    'facilityType',          // Core: tunnel vs IBA vs self-serve
    'tunnelOrBayCount',      // Core: primary capacity driver
    'operatingHours',        // Core: duty cycle
    'daysPerWeek',           // Core: annual energy driver
    'dailyVehicles',         // Core: throughput proxy
    'waterHeaterType',       // Load driver: 10-30 kW continuous
    'dryerConfiguration',    // CRITICAL: 40-50% of bill
    'pumpConfiguration',     // CRITICAL: 20-30% of bill
  ],
  // Future: Add other industries here
  // 'hotel': ['roomCount', 'hotelClass', 'occupancyRate', ...],
};

/**
 * Get Tier 1 blocker question IDs for an industry
 * Returns stable ordering for deterministic "missing" lists
 */
export function getTier1Blockers(industry: string): string[] {
  const normalized = normalizeIndustrySlug(industry);
  return TIER1_BLOCKERS[normalized] || [];
}

/**
 * Check if a question is a Tier 1 blocker (gates Step 3 completion)
 */
export function isBlockerQuestion(industry: string, questionId: string): boolean {
  const blockers = getTier1Blockers(industry);
  return blockers.includes(questionId);
}

// ============================================================================
// TYPES
// ============================================================================

export interface CuratedField {
  id: string;
  type: string;
  section: string;
  title: string;
  subtitle?: string;
  label?: string;
  helpText?: string;
  merlinTip?: string;
  options?: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
    disabled?: boolean;
  }>;
  range?: {
    min: number;
    max: number;
    step: number;
  };
  unit?: string;
  suffix?: string;
  placeholder?: string;
  smartDefault?: unknown;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
  conditionalLogic?: {
    dependsOn: string;
    showIf: (value: unknown) => boolean;
    modifyOptions?: (value: unknown) => CuratedField["options"];
  };
  impactsCalculations?: string[];
  // Required flag (derived from validation or explicit)
  required?: boolean;
}

export interface CuratedSection {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  questionIds?: string[];
}

export interface CuratedSchema {
  industry: string;
  displayName: string;
  icon: string;
  questions: CuratedField[];
  sections: CuratedSection[];
  // Metadata
  questionCount: number;
  requiredCount: number;
  source: 'curated-complete' | 'curated-legacy' | 'fallback';
}

// ============================================================================
// INDUSTRY DISPLAY NAMES + ICONS
// ============================================================================

// CANONICAL KEYS ONLY - these are the normalized slugs returned by normalizeIndustrySlug()
const INDUSTRY_META: Record<string, { displayName: string; icon: string }> = {
  // Primary (complete curated questionnaire)
  'car-wash': { displayName: 'Car Wash', icon: '🚗' },
  
  // Legacy-supported (industryQuestionnaires.ts)
  'hotel': { displayName: 'Hotel / Hospitality', icon: '🏨' },
  'ev-charging': { displayName: 'EV Charging Station', icon: '🔌' },
  'datacenter': { displayName: 'Data Center', icon: '🖥️' },
  'hospital': { displayName: 'Healthcare Facility', icon: '🏥' },
  'airport': { displayName: 'Airport', icon: '✈️' },
  'casino': { displayName: 'Casino & Gaming', icon: '🎰' },
  'warehouse': { displayName: 'Warehouse / Logistics', icon: '📦' },
  'retail': { displayName: 'Retail / Shopping', icon: '🏪' },
  'gas-station': { displayName: 'Gas / Truck Stop', icon: '⛽' },
  
  // Fallback industries (use generic schema)
  'office': { displayName: 'Office Building', icon: '🏢' },
  'manufacturing': { displayName: 'Manufacturing', icon: '🏭' },
  'restaurant': { displayName: 'Restaurant', icon: '🍽️' },
  'college': { displayName: 'College / University', icon: '🎓' },
  'agriculture': { displayName: 'Agriculture', icon: '🌾' },
  'cold-storage': { displayName: 'Cold Storage', icon: '❄️' },
  'apartment': { displayName: 'Apartment Complex', icon: '🏠' },
  'residential': { displayName: 'Residential', icon: '🏡' },
  'indoor-farm': { displayName: 'Indoor Farm', icon: '🌱' },
  
  // Default
  'other': { displayName: 'Commercial Facility', icon: '🏗️' },
  'auto': { displayName: 'Your Facility', icon: '⚡' },
};

// Export canonical keys as const array for type enforcement
export const CANONICAL_INDUSTRY_KEYS = [
  "car-wash",
  "hotel",
  "ev-charging",
  "datacenter",
  "hospital",
  "airport",
  "casino",
  "warehouse",
  "retail",
  "gas-station",
  "office",
  "manufacturing",
  "restaurant",
  "college",
  "agriculture",
  "cold-storage",
  "apartment",
  "residential",
  "indoor-farm",
  "other",
  "auto",
] as const;

// Type for canonical industry keys (compile-time enforcement)
export type CanonicalIndustryKey = typeof CANONICAL_INDUSTRY_KEYS[number];

// ============================================================================
// NORMALIZE INDUSTRY SLUG
// ============================================================================

/**
 * Normalize industry slug to canonical key.
 * ALWAYS returns a CanonicalIndustryKey — unknown inputs map to "other".
 */
function normalizeIndustrySlug(industry: string): CanonicalIndustryKey {
  // Handle common variations
  const normalized = industry.toLowerCase().replace(/_/g, '-');
  
  // Map aliases to canonical
  const aliases: Record<string, CanonicalIndustryKey> = {
    'carwash': 'car-wash',
    'car_wash': 'car-wash',
    'ev_charging': 'ev-charging',
    'evcharging': 'ev-charging',
    'data_center': 'datacenter',
    'data-center': 'datacenter',
    'healthcare': 'hospital',
    'tribal-casino': 'casino',
    'casino-gaming': 'casino',
    'logistics-center': 'warehouse',
    'shopping-center': 'retail',
    'cold-storage': 'cold-storage',
    'indoor-farm': 'indoor-farm',
    'truck-stop': 'gas-station',
    'truck_stop': 'gas-station',
  };
  
  // Check alias first, then check if normalized is canonical, else fallback to "other"
  const candidate = aliases[normalized] ?? (normalized as CanonicalIndustryKey);
  return CANONICAL_INDUSTRY_KEYS.includes(candidate) ? candidate : 'other';
}

// ============================================================================
// CONVERT LEGACY QUESTION FORMAT → CURATED FIELD
// ============================================================================

function convertLegacyQuestion(q: LegacyQuestion, sectionId: string): CuratedField {
  // Use legacy metadata if present, otherwise default to required
  const required = (q as Record<string, unknown>).required !== false;
  
  return {
    id: q.id,
    type: q.type === 'multi-select' || q.type === 'multiselect' ? 'multiselect' : q.type,
    section: sectionId,
    title: q.label || q.question || q.id,
    label: q.label || q.question,
    placeholder: q.placeholder,
    helpText: q.helpText,
    options: q.options?.map(opt => 
      typeof opt === 'string' 
        ? { value: opt, label: opt }
        : { value: String(opt.value), label: opt.label, description: opt.description }
    ),
    unit: q.suffix || q.unit,
    suffix: q.suffix || q.unit,
    required,
    validation: { required },
    conditionalLogic: q.conditional ? {
      dependsOn: q.conditional.field || q.conditional.dependsOn || '',
      showIf: (value: unknown) => {
        if (q.conditional?.operator === '>') return Number(value) > Number(q.conditional.value);
        if (q.conditional?.operator === '==') return value === q.conditional.value;
        if (q.conditional?.operator === '<') return Number(value) < Number(q.conditional.value);
        if (q.conditional?.dependsOn) return value === q.conditional.value;
        return true;
      }
    } : undefined,
  };
}

// ============================================================================
// CONVERT COMPLETE QUESTION FORMAT → CURATED FIELD
// ============================================================================

function convertCompleteQuestion(q: CarWashQuestion): CuratedField {
  return {
    id: q.id,
    type: q.type,
    section: q.section,
    title: q.title,
    subtitle: q.subtitle,
    helpText: q.helpText,
    merlinTip: q.merlinTip,
    options: q.options,
    range: q.range,
    unit: q.unit,
    suffix: q.suffix,
    smartDefault: q.smartDefault,
    validation: q.validation,
    conditionalLogic: q.conditionalLogic,
    impactsCalculations: q.impactsCalculations,
    required: q.validation?.required ?? true,
  };
}

// ============================================================================
// LEGACY QUESTIONNAIRE KEY MAPPING (SSOT)
// ============================================================================

/**
 * Maps canonical normalized industry keys to industryQuestionnaires.ts keys.
 * This is the SINGLE SOURCE OF TRUTH for legacy schema lookup.
 * Used by both resolveLegacySchema() and hasCuratedSchema().
 */
function getLegacyQuestionnaireKey(industryKey: string): string | null {
  const keyMap: Record<string, string> = {
    'ev-charging': 'ev-charging',
    'hotel': 'hotel',
    'datacenter': 'datacenter',
    'hospital': 'hospital',
    'airport': 'airport',
    'casino': 'tribal-casino',
    'warehouse': 'logistics-center',
    'retail': 'shopping-center',
    'gas-station': 'gas-station',
    'car-wash': 'car-wash',
  };
  return keyMap[industryKey] ?? null;
}

// ============================================================================
// SCHEMA RESOLVERS BY INDUSTRY
// ============================================================================

function resolveCarWashSchema(): CuratedSchema {
  const questions = carWashQuestionsComplete.map(convertCompleteQuestion);
  const sections = carWashSections.map(s => ({
    id: s.id,
    label: s.title, // ✅ FIX: carWashSections uses 'title', not 'label'
    description: s.description,
    icon: s.icon,
  }));
  
  return {
    industry: 'car-wash',
    displayName: 'Car Wash',
    icon: '🚗',
    questions,
    sections,
    questionCount: questions.length,
    requiredCount: questions.filter(q => q.required).length,
    source: 'curated-complete',
  };
}

function resolveLegacySchema(industryKey: string): CuratedSchema | null {
  // Use SSOT helper for key mapping
  const questKey = getLegacyQuestionnaireKey(industryKey);
  const questionnaire = questKey ? industryQuestionnaires[questKey] : null;
  
  if (!questionnaire) return null;
  
  const questions = questionnaire.questions.map(q => convertLegacyQuestion(q, 'general'));
  
  // Auto-generate sections from question flow
  const sections: CuratedSection[] = [
    { id: 'general', label: 'Facility Details', icon: '🏢' },
    { id: 'operations', label: 'Operations', icon: '⚙️' },
    { id: 'energy', label: 'Energy & Grid', icon: '⚡' },
  ];
  
  const meta = INDUSTRY_META[industryKey] || INDUSTRY_META['other'];
  
  return {
    industry: industryKey,
    displayName: meta.displayName,
    icon: meta.icon,
    questions,
    sections,
    questionCount: questions.length,
    requiredCount: questions.filter(q => q.required).length,
    source: 'curated-legacy',
  };
}

// ============================================================================
// FALLBACK SCHEMA (Generic Commercial)
// ============================================================================

function resolveFallbackSchema(industry: string): CuratedSchema {
  const meta = INDUSTRY_META[industry] || INDUSTRY_META['other'];
  
  const questions: CuratedField[] = [
    {
      id: 'facilitySize',
      type: 'select',
      section: 'facility',
      title: 'Facility Size',
      label: 'How large is your facility?',
      options: [
        { value: 'small', label: 'Small', icon: '🟢', description: '< 10,000 sq ft' },
        { value: 'medium', label: 'Medium', icon: '🟡', description: '10,000 - 50,000 sq ft' },
        { value: 'large', label: 'Large', icon: '🟠', description: '50,000 - 200,000 sq ft' },
        { value: 'enterprise', label: 'Enterprise', icon: '🔴', description: '> 200,000 sq ft' },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: 'operatingHours',
      type: 'select',
      section: 'operations',
      title: 'Operating Hours',
      label: 'What are your operating hours?',
      options: [
        { value: 'business', label: 'Business Hours', icon: '🏢', description: '8 AM - 6 PM' },
        { value: 'extended', label: 'Extended', icon: '🌅', description: '6 AM - 10 PM' },
        { value: '24-7', label: '24/7', icon: '🌙', description: 'Always Open' },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: 'gridConnection',
      type: 'select',
      section: 'energy',
      title: 'Grid Connection',
      label: 'What is your grid connection status?',
      options: [
        { value: 'on-grid', label: 'On-Grid', icon: '🔌', description: 'Full utility connection' },
        { value: 'limited', label: 'Limited', icon: '⚠️', description: 'Capacity constraints' },
        { value: 'off-grid', label: 'Off-Grid', icon: '🏝️', description: 'Remote location' },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: 'criticalLoadPct',
      type: 'select',
      section: 'energy',
      title: 'Critical Load',
      label: 'What percentage of your load is critical (must not lose power)?',
      options: [
        { value: '25', label: '25%', description: 'Basic lighting & security' },
        { value: '50', label: '50%', description: 'Core operations' },
        { value: '75', label: '75%', description: 'Most systems' },
        { value: '100', label: '100%', description: 'All systems critical' },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: 'peakDemandKW',
      type: 'number',
      section: 'energy',
      title: 'Peak Demand',
      label: 'Estimated peak demand (if known)',
      placeholder: 'e.g., 500',
      suffix: 'kW',
      required: false,
      validation: { required: false },
    },
    {
      id: 'monthlyKWH',
      type: 'number',
      section: 'energy',
      title: 'Monthly Usage',
      label: 'Monthly electricity usage (if known)',
      placeholder: 'e.g., 50000',
      suffix: 'kWh',
      required: false,
      validation: { required: false },
    },
    {
      id: 'existingSolar',
      type: 'select',
      section: 'solar',
      title: 'Existing Solar',
      label: 'Do you have existing solar?',
      options: [
        { value: 'none', label: 'No Solar', icon: '❌' },
        { value: 'partial', label: 'Some Solar', icon: '☀️', description: 'Covers part of load' },
        { value: 'full', label: 'Full Solar', icon: '🌞', description: 'Covers most of load' },
      ],
      required: true,
      validation: { required: true },
    },
    {
      id: 'primaryGoal',
      type: 'select',
      section: 'goals',
      title: 'Primary Goal',
      label: 'What is your primary goal for energy storage?',
      options: [
        { value: 'cost-savings', label: 'Cost Savings', icon: '💰', description: 'Reduce utility bills' },
        { value: 'backup-power', label: 'Backup Power', icon: '🔋', description: 'Resilience during outages' },
        { value: 'peak-shaving', label: 'Peak Shaving', icon: '📉', description: 'Reduce demand charges' },
        { value: 'sustainability', label: 'Sustainability', icon: '🌍', description: 'Environmental goals' },
      ],
      required: true,
      validation: { required: true },
    },
  ];
  
  const sections: CuratedSection[] = [
    { id: 'facility', label: 'Facility', icon: '🏢' },
    { id: 'operations', label: 'Operations', icon: '⚙️' },
    { id: 'energy', label: 'Energy & Grid', icon: '⚡' },
    { id: 'solar', label: 'Solar', icon: '☀️' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
  ];
  
  return {
    industry,
    displayName: meta.displayName,
    icon: meta.icon,
    questions,
    sections,
    questionCount: questions.length,
    requiredCount: questions.filter(q => q.required).length,
    source: 'fallback',
  };
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve Step 3 schema for a given industry
 * 
 * Priority:
 * 1. Complete curated schema (car_wash)
 * 2. Legacy industryQuestionnaires (hotel, ev-charging, datacenter, etc.)
 * 3. Fallback generic schema
 * 
 * @param industry - Industry slug (e.g., 'car_wash', 'hotel', 'ev-charging')
 * @returns CuratedSchema with all questions, sections, and metadata
 */
export function resolveStep3Schema(industry: string): CuratedSchema {
  const normalized = normalizeIndustrySlug(industry);
  let schema: CuratedSchema;
  
  // Priority 1: Complete curated schemas
  if (normalized === 'car-wash') {
    schema = resolveCarWashSchema();
    if (import.meta.env.DEV) {
      console.log(`[CuratedResolver] ✅ Using COMPLETE schema for ${industry}`);
    }
  }
  // Priority 2: Legacy questionnaires
  else {
    const legacySchema = resolveLegacySchema(normalized);
    if (legacySchema) {
      schema = legacySchema;
      if (import.meta.env.DEV) {
        console.log(`[CuratedResolver] ✅ Using LEGACY schema for ${industry} (${legacySchema.questionCount} questions)`);
      }
    }
    // Priority 3: Fallback
    else {
      schema = resolveFallbackSchema(normalized);
      if (import.meta.env.DEV) {
        console.log(`[CuratedResolver] ⚠️ Using FALLBACK schema for ${industry}`);
      }
    }
  }
  
  // DEV assertions: catch non-canonical output immediately
  if (import.meta.env.DEV) {
    // Check 1: membership in canonical keys
    if (!CANONICAL_INDUSTRY_KEYS.includes(schema.industry as CanonicalIndustryKey)) {
      console.error(`[CuratedResolver] ❌ schema.industry not canonical key:`, {
        input: industry,
        normalized,
        output: schema.industry,
      });
    }
    // Check 2: normalization consistency (redundant if normalizeIndustrySlug is typed, but belt-and-suspenders)
    if (schema.industry !== normalizeIndustrySlug(schema.industry)) {
      console.error(`[CuratedResolver] ❌ NON-CANONICAL schema.industry: "${schema.industry}" should be "${normalizeIndustrySlug(schema.industry)}"`);
    }
  }
  
  return schema;
}

/**
 * Get display metadata for an industry (name, icon)
 */
export function getIndustryMeta(industry: string): { displayName: string; icon: string } {
  const normalized = normalizeIndustrySlug(industry);
  return INDUSTRY_META[normalized] || INDUSTRY_META['other'];
}

/**
 * Check if industry has a curated schema (vs fallback)
 * Uses same SSOT lookup as resolveLegacySchema() to prevent drift.
 */
export function hasCuratedSchema(industry: string): boolean {
  const normalized = normalizeIndustrySlug(industry);
  
  // Complete schemas
  if (normalized === 'car-wash') return true;
  
  // Legacy schemas - use SSOT helper
  const questKey = getLegacyQuestionnaireKey(normalized);
  return !!(questKey && industryQuestionnaires[questKey]);
}

// ============================================================================
// DEV DIAGNOSTICS (call explicitly, not at module load)
// ============================================================================

export function debugCuratedResolver(): void {
  if (!import.meta.env.DEV) return;
  
  const allIndustries = Object.keys(INDUSTRY_META);
  const withCurated = allIndustries.filter(hasCuratedSchema);
  const withFallback = allIndustries.filter(i => !hasCuratedSchema(i));
  
  console.log('[CuratedResolver] Diagnostics:');
  console.log(`  - Curated: ${withCurated.join(', ')}`);
  console.log(`  - Fallback: ${withFallback.join(', ')}`);
}

export default resolveStep3Schema;
