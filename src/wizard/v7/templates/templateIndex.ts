/**
 * TEMPLATE INDEX LOADER
 * =====================
 *
 * Created: January 26, 2026
 * Purpose: Centralized template registry for API endpoints
 *
 * DESIGN:
 * - Single source of truth for all industry templates
 * - Supports versioning (getTemplate can request specific version)
 * - Metadata extraction for /api/templates/list endpoint
 * - Vite JSON imports for clean module system
 *
 * USAGE:
 * ```typescript
 * // In API endpoint:
 * const templates = listTemplates(); // GET /api/templates/list
 * const dcTemplate = getTemplate('data_center'); // Latest version
 * const dcV1 = getTemplate('data_center', 'dc.v1.0.0'); // Specific version
 * ```
 */

import type { IndustryTemplateV1 } from "./types";

// JSON imports (Vite supports this)
import dataCenter from "./data_center.v1.json";
import hotel from "./hotel.v1.json";
import carWash from "./car_wash.v1.json";

/**
 * Template Metadata
 *
 * Lightweight info for template listing endpoints
 * Full template loaded on-demand via getTemplate()
 */
export type TemplateMeta = {
  /** Industry slug (data_center, hotel, car_wash) */
  industry: string;

  /** Semantic version (dc.v1.0.0) */
  version: string;

  /** Calculator contract ID (dc_load_v1) */
  calculatorId: string;

  /** Question count (16-18 enforced by validator) */
  questionCount: number;
};

/**
 * Template Registry
 *
 * ALL templates must be registered here
 * Validator + drift tests enforce contract compliance
 */
export const TEMPLATES: IndustryTemplateV1[] = [
  dataCenter as IndustryTemplateV1,
  hotel as IndustryTemplateV1,
  carWash as IndustryTemplateV1,
];

/**
 * List all templates with metadata
 *
 * @returns Array of template metadata (lightweight)
 *
 * USAGE: GET /api/templates/list endpoint
 */
export function listTemplates(): TemplateMeta[] {
  return TEMPLATES.map((t) => ({
    industry: t.industry,
    version: t.version,
    calculatorId: t.calculator.id,
    questionCount: t.questions.length,
  }));
}

/**
 * Get template by industry slug
 *
 * @param industry - Industry slug (data_center, hotel, car_wash)
 * @param version - Optional specific version (defaults to latest)
 * @returns Full template or null if not found
 *
 * VERSIONING:
 * - No version specified: Returns latest (lexicographic sort)
 * - Specific version: Returns exact match or null
 *
 * USAGE:
 * ```typescript
 * // Latest version (recommended)
 * const tpl = getTemplate('data_center');
 *
 * // Specific version (for reproducibility)
 * const tpl = getTemplate('data_center', 'dc.v1.0.0');
 * ```
 */
export function getTemplate(industry: string, version?: string): IndustryTemplateV1 | null {
  // Filter to matching industry
  const candidates = TEMPLATES.filter((t) => t.industry === industry);
  if (candidates.length === 0) return null;

  if (!version) {
    // Default: latest by lexicographic version (works for semantic v1.0.0 style)
    const sorted = [...candidates].sort((a, b) => (a.version > b.version ? -1 : 1));
    return sorted[0] ?? null;
  }

  // Specific version requested
  return candidates.find((t) => t.version === version) ?? null;
}

/**
 * Get template by calculator ID
 *
 * @param calculatorId - Calculator contract ID (dc_load_v1)
 * @returns Full template or null if not found
 *
 * USAGE: Reverse lookup when you know calculator but not industry
 */
export function getTemplateByCalculatorId(calculatorId: string): IndustryTemplateV1 | null {
  return TEMPLATES.find((t) => t.calculator.id === calculatorId) ?? null;
}

/**
 * Validate template exists and is loadable
 *
 * @param industry - Industry slug
 * @returns True if template exists
 *
 * USAGE: Quick check before loading
 */
export function hasTemplate(industry: string): boolean {
  return TEMPLATES.some((t) => t.industry === industry);
}
