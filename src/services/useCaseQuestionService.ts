/**
 * USE CASE QUESTION SERVICE
 * =========================
 * 
 * This service provides a unified interface to retrieve custom questions
 * from the centralized useCaseTemplates.ts database.
 * 
 * REPLACES: industryQuestionnaires.ts (deprecated)
 * 
 * Why this matters:
 * - Single source of truth: All use case data in one place
 * - Consistent with baselineService.ts and centralizedCalculations.ts
 * - Questions stay in sync with power profiles and financial parameters
 * - Easier to maintain and update
 * 
 * Architecture:
 * useCaseTemplates.ts → useCaseQuestionService.ts → Step2_UseCase.tsx → QuestionRenderer.tsx
 */

import { USE_CASE_TEMPLATES } from '@/data/useCaseTemplates';
import type { UseCaseTemplate, CustomQuestion } from '@/types/useCase.types';

export interface QuestionnaireConfig {
  title: string;
  icon: string;
  questions: CustomQuestion[];
  template: UseCaseTemplate | null;
}

/**
 * Map template slugs to their full names for display
 * This handles variations between Step1 IDs and actual template slugs
 */
const TEMPLATE_SLUG_MAP: Record<string, string> = {
  // Direct matches
  'car-wash': 'car-wash',
  'ev-charging': 'ev-charging',
  'hospital': 'hospital',
  'hotel': 'hotel',
  'airport': 'airport',
  'indoor-farm': 'indoor-farm',
  'dental-office': 'dental-office',
  'datacenter': 'data-center',
  'data-center': 'data-center',
  'apartments': 'apartments',
  'apartment': 'apartments',
  'shopping-center': 'shopping-center',
  'warehouse': 'warehouse',
  'manufacturing': 'manufacturing',
  'microgrid': 'microgrid',
  'tribal-casino': 'tribal-casino',
  'logistics-center': 'logistics-center',
  'gas-station': 'gas-station',
  'government': 'government',
  
  // MISMATCHES - Step1 uses different IDs than template slugs
  'office': 'office-building',      // Step1: 'office' → Template: 'office-building'
  'retail': 'shopping-center',      // Step1: 'retail' → Template: 'shopping-center'
  'agriculture': 'indoor-farm',     // Step1: 'agriculture' → closest match: 'indoor-farm'
  'college': 'college-university',  // Step1: 'college' → Template: 'college-university'
};

/**
 * Get questionnaire configuration from useCaseTemplates
 * 
 * @param templateId - Template slug or ID (e.g., 'hotel', 'car-wash', 'datacenter')
 * @returns QuestionnaireConfig with questions and metadata
 */
export function getUseCaseQuestionnaire(templateId: string): QuestionnaireConfig {
  // Normalize the template ID (handle variations)
  const normalizedId = TEMPLATE_SLUG_MAP[templateId] || templateId;
  
  if (import.meta.env.DEV) {
    console.log(`[UseCaseQuestionService] Looking for template: "${templateId}" → normalized: "${normalizedId}"`);
  }
  
  // Find the template by slug
  const template = USE_CASE_TEMPLATES.find(
    t => t.slug === normalizedId || t.id === normalizedId || t.slug === templateId
  );

  if (!template) {
    console.warn(`[UseCaseQuestionService] Template not found: ${templateId}, using fallback questions`);
    return getFallbackQuestionnaire(templateId);
  }

  // Convert CustomQuestion[] to the format expected by QuestionRenderer
  const questions = template.customQuestions || [];
  
  if (import.meta.env.DEV) {
    console.log(`[UseCaseQuestionService] Found template: ${template.name} with ${questions.length} questions`);
    console.log(`[UseCaseQuestionService] Questions:`, questions.map(q => q.id));
  }

  return {
    title: `${template.name} Configuration`,
    icon: template.icon || '⚡',
    questions: questions,
    template: template,
  };
}

/**
 * Fallback questionnaire for templates without custom questions
 * or when template is not found
 */
function getFallbackQuestionnaire(templateId: string): QuestionnaireConfig {
  return {
    title: 'Project Details',
    icon: '⚡',
    questions: [
      {
        id: 'facilitySize',
        question: 'Facility size?',
        type: 'select',
        default: 'medium',
        options: [
          'micro',      // < 10,000 sq ft
          'small',      // 10,000-30,000 sq ft
          'medium',     // 30,000-100,000 sq ft
          'large',      // > 100,000 sq ft
        ],
        impactType: 'factor',
        helpText: 'Approximate size of your facility',
        required: true,
      },
      {
        id: 'peakLoad',
        question: 'Estimated peak load?',
        type: 'number',
        default: 1.5,
        unit: 'MW',
        impactType: 'multiplier',
        helpText: 'Maximum power demand during peak hours',
        required: true,
      },
      {
        id: 'operatingHours',
        question: 'Operating hours per day?',
        type: 'number',
        default: 16,
        unit: 'hours',
        impactType: 'factor',
        helpText: 'How many hours per day does your facility operate?',
        required: true,
      },
    ],
    template: null,
  };
}

/**
 * Get all available use case templates
 * Useful for listing available options
 */
export function getAllUseCaseTemplates(): UseCaseTemplate[] {
  return USE_CASE_TEMPLATES.filter(t => t.isActive !== false);
}

/**
 * Get template by slug or ID
 */
export function getUseCaseTemplate(templateId: string): UseCaseTemplate | null {
  const normalizedId = TEMPLATE_SLUG_MAP[templateId] || templateId;
  return USE_CASE_TEMPLATES.find(
    t => t.slug === normalizedId || t.id === normalizedId || t.slug === templateId
  ) || null;
}

/**
 * Convert legacy industryQuestionnaires format to useCaseTemplates format
 * This helps with migration from old system
 */
export function convertLegacyQuestionnaire(
  legacyQuestions: any[]
): CustomQuestion[] {
  return legacyQuestions.map(q => ({
    id: q.id,
    question: q.label || q.question,
    type: q.type === 'multi-select' ? 'multiselect' : q.type,
    default: q.default || (q.type === 'number' ? 0 : ''),
    unit: q.suffix || q.unit,
    options: Array.isArray(q.options) 
      ? q.options.map((opt: any) => typeof opt === 'string' ? opt : opt.value)
      : undefined,
    impactType: 'factor', // Default, should be configured per question
    helpText: q.helpText,
    required: q.required !== false,
  }));
}
