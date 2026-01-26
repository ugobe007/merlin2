/**
 * Database-Driven Validation Schema Service
 * 
 * Replaces hardcoded validator logic with dynamic schema from database.
 * Part of V6 → V7 cleanup (Jan 26, 2026).
 * 
 * @module validationSchemaService
 */

import { supabase } from '@/services/supabaseClient';
import type { Database } from '@/types/database.types';

type CustomQuestion = Database['public']['Tables']['custom_questions']['Row'];

/**
 * Required fields for an industry, loaded from database
 */
export interface IndustryValidationSchema {
  industrySlug: string;
  requiredFields: string[]; // field_name values where is_required = true
  allFields: string[];      // all field_name values
  fieldDetails: Map<string, {
    fieldName: string;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    minValue?: number;
    maxValue?: number;
    defaultValue?: string;
  }>;
}

/**
 * Cache for validation schemas (avoid repeated DB queries)
 */
const schemaCache = new Map<string, IndustryValidationSchema>();

/**
 * Fetch validation schema for an industry from database
 */
export async function getIndustryValidationSchema(
  industrySlug: string
): Promise<IndustryValidationSchema | null> {
  // Check cache first
  if (schemaCache.has(industrySlug)) {
    return schemaCache.get(industrySlug)!;
  }

  try {
    // Get use case ID
    const { data: useCase, error: useCaseError } = await supabase
      .from('use_cases')
      .select('id')
      .eq('slug', industrySlug)
      .single();

    if (useCaseError || !useCase) {
      console.warn(`[ValidationSchema] No use case found for slug: ${industrySlug}`);
      return null;
    }

    // Get all questions for this use case
    const { data: questions, error: questionsError } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('use_case_id', useCase.id)
      .order('display_order');

    if (questionsError || !questions) {
      console.warn(`[ValidationSchema] Failed to load questions for ${industrySlug}:`, questionsError);
      return null;
    }

    // Build schema
    const schema: IndustryValidationSchema = {
      industrySlug,
      requiredFields: [],
      allFields: [],
      fieldDetails: new Map(),
    };

    for (const q of questions) {
      schema.allFields.push(q.field_name);
      
      if (q.is_required) {
        schema.requiredFields.push(q.field_name);
      }

      schema.fieldDetails.set(q.field_name, {
        fieldName: q.field_name,
        questionText: q.question_text,
        questionType: q.question_type,
        isRequired: q.is_required ?? false,
        minValue: q.min_value ?? undefined,
        maxValue: q.max_value ?? undefined,
        defaultValue: q.default_value ?? undefined,
      });
    }

    // Cache it
    schemaCache.set(industrySlug, schema);

    if (import.meta.env.DEV) {
      console.log(`[ValidationSchema] Loaded schema for ${industrySlug}:`, {
        totalFields: schema.allFields.length,
        requiredFields: schema.requiredFields.length,
        required: schema.requiredFields,
      });
    }

    return schema;
  } catch (error) {
    console.error(`[ValidationSchema] Error loading schema for ${industrySlug}:`, error);
    return null;
  }
}

/**
 * Check if a field is required for an industry
 */
export async function isFieldRequired(
  industrySlug: string,
  fieldName: string
): Promise<boolean> {
  const schema = await getIndustryValidationSchema(industrySlug);
  return schema?.requiredFields.includes(fieldName) ?? false;
}

/**
 * Get all required fields for an industry
 */
export async function getRequiredFields(industrySlug: string): Promise<string[]> {
  const schema = await getIndustryValidationSchema(industrySlug);
  return schema?.requiredFields ?? [];
}

/**
 * Validate answers against industry schema
 * Returns missing required fields
 */
export async function validateAnswers(
  industrySlug: string,
  answers: Record<string, unknown>
): Promise<{ ok: boolean; missingRequired: string[] }> {
  const schema = await getIndustryValidationSchema(industrySlug);
  
  if (!schema) {
    // If no schema, allow (fail open for unknown industries)
    return { ok: true, missingRequired: [] };
  }

  const missingRequired: string[] = [];

  for (const fieldName of schema.requiredFields) {
    const value = answers[fieldName];
    const details = schema.fieldDetails.get(fieldName);

    // Check if answered
    if (value == null || value === '' || value === undefined) {
      missingRequired.push(fieldName);
      continue;
    }

    // Check numeric range if applicable
    if (details?.questionType === 'number' && typeof value === 'number') {
      if (details.minValue != null && value < details.minValue) {
        missingRequired.push(fieldName);
      }
      if (details.maxValue != null && value > details.maxValue) {
        missingRequired.push(fieldName);
      }
    }
  }

  return {
    ok: missingRequired.length === 0,
    missingRequired,
  };
}

/**
 * Clear cache (useful for testing or when schema changes)
 */
export function clearSchemaCache() {
  schemaCache.clear();
  if (import.meta.env.DEV) {
    console.log('[ValidationSchema] Cache cleared');
  }
}

/**
 * Preload schemas for common industries (call at app startup)
 */
export async function preloadCommonSchemas() {
  const commonIndustries = [
    'hotel',
    'car-wash',
    'hospital',
    'office',
    'warehouse',
    'data-center',
    'ev-charging',
  ];

  await Promise.all(
    commonIndustries.map(slug => getIndustryValidationSchema(slug))
  );

  if (import.meta.env.DEV) {
    console.log('[ValidationSchema] Preloaded common industry schemas');
  }
}
