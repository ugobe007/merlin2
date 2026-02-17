/**
 * QUOTE TEMPLATE CONFIGURATION
 * =============================
 *
 * Stores user customization for quote exports:
 * - Brand Kit (Pro): logo, colors, company info
 * - Template Studio (Advanced): section toggles, cover text, layout
 *
 * Persisted in localStorage (pre-Supabase) under 'merlin_quote_template'.
 *
 * Created: Feb 2026
 */

// ============================================================================
// Types
// ============================================================================

export interface BrandKit {
  /** Company / organization name */
  companyName: string;
  /** Tagline or subtitle */
  tagline: string;
  /** Contact name */
  contactName: string;
  /** Contact email */
  contactEmail: string;
  /** Contact phone */
  contactPhone: string;
  /** Company website URL */
  website: string;
  /** Company address (single line) */
  address: string;
  /** Logo as base64 data URL (image/png or image/jpeg) */
  logoBase64: string | null;
  /** Primary brand color (hex, e.g. '#1B8F5A') */
  primaryColor: string;
  /** Secondary / accent color (hex) */
  accentColor: string;
  /** Text color for headers (hex) — defaults to navy */
  headerTextColor: string;
}

export interface TemplateSections {
  /** Cover page with project summary */
  coverPage: boolean;
  /** Executive summary paragraph */
  executiveSummary: boolean;
  /** System specifications table */
  systemSpecs: boolean;
  /** Equipment breakdown */
  equipmentBreakdown: boolean;
  /** Financial analysis (ROI, payback, NPV) */
  financialAnalysis: boolean;
  /** Demand charge / savings analysis */
  savingsAnalysis: boolean;
  /** TrueQuote™ source attribution */
  trueQuoteSources: boolean;
  /** Sensitivity / Monte Carlo section (Advanced only) */
  advancedAnalysis: boolean;
  /** Terms & conditions footer */
  termsAndConditions: boolean;
  /** Appendix: engineering notes */
  engineeringAppendix: boolean;
}

export interface TemplateLayout {
  /** Layout preset name */
  preset: 'professional' | 'compact' | 'detailed' | 'executive';
  /** Custom cover text (replaces default) */
  coverText: string;
  /** Custom terms & conditions text */
  termsText: string;
  /** Custom footer text (per-page) */
  footerText: string;
  /** Include page numbers */
  pageNumbers: boolean;
  /** Include date stamp */
  dateStamp: boolean;
  /** Include Merlin watermark */
  merlinWatermark: boolean;
  /** Include TrueQuote™ badge */
  trueQuoteBadge: boolean;
}

export interface QuoteTemplate {
  /** Template version for migration */
  version: 2;
  /** Display name for this template */
  name: string;
  /** When template was last modified */
  updatedAt: string;
  /** Brand identity */
  brandKit: BrandKit;
  /** Which sections to include */
  sections: TemplateSections;
  /** Layout & text overrides */
  layout: TemplateLayout;
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_BRAND_KIT: BrandKit = {
  companyName: '',
  tagline: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  address: '',
  logoBase64: null,
  primaryColor: '#1B8F5A',
  accentColor: '#3ECF8E',
  headerTextColor: '#1A1F36',
};

export const DEFAULT_SECTIONS: TemplateSections = {
  coverPage: true,
  executiveSummary: true,
  systemSpecs: true,
  equipmentBreakdown: true,
  financialAnalysis: true,
  savingsAnalysis: true,
  trueQuoteSources: true,
  advancedAnalysis: false,
  termsAndConditions: true,
  engineeringAppendix: false,
};

export const DEFAULT_LAYOUT: TemplateLayout = {
  preset: 'professional',
  coverText: '',
  termsText: '',
  footerText: '',
  pageNumbers: true,
  dateStamp: true,
  merlinWatermark: true,
  trueQuoteBadge: true,
};

export const DEFAULT_TEMPLATE: QuoteTemplate = {
  version: 2,
  name: 'Default Template',
  updatedAt: new Date().toISOString(),
  brandKit: { ...DEFAULT_BRAND_KIT },
  sections: { ...DEFAULT_SECTIONS },
  layout: { ...DEFAULT_LAYOUT },
};

// ============================================================================
// Layout Presets
// ============================================================================

export const LAYOUT_PRESETS: Record<string, { label: string; description: string; sections: Partial<TemplateSections> }> = {
  professional: {
    label: 'Professional',
    description: 'Full proposal with cover page, financials, and engineering appendix',
    sections: {
      coverPage: true,
      executiveSummary: true,
      systemSpecs: true,
      equipmentBreakdown: true,
      financialAnalysis: true,
      savingsAnalysis: true,
      trueQuoteSources: true,
      termsAndConditions: true,
      engineeringAppendix: true,
    },
  },
  compact: {
    label: 'Compact',
    description: 'Quick 2-page summary — specs + financials only',
    sections: {
      coverPage: false,
      executiveSummary: false,
      systemSpecs: true,
      equipmentBreakdown: true,
      financialAnalysis: true,
      savingsAnalysis: false,
      trueQuoteSources: false,
      termsAndConditions: false,
      engineeringAppendix: false,
    },
  },
  detailed: {
    label: 'Detailed',
    description: 'Bank-ready document with sensitivity analysis and full appendices',
    sections: {
      coverPage: true,
      executiveSummary: true,
      systemSpecs: true,
      equipmentBreakdown: true,
      financialAnalysis: true,
      savingsAnalysis: true,
      trueQuoteSources: true,
      advancedAnalysis: true,
      termsAndConditions: true,
      engineeringAppendix: true,
    },
  },
  executive: {
    label: 'Executive Summary',
    description: 'High-level overview for C-suite — financials + ROI focus',
    sections: {
      coverPage: true,
      executiveSummary: true,
      systemSpecs: false,
      equipmentBreakdown: false,
      financialAnalysis: true,
      savingsAnalysis: true,
      trueQuoteSources: false,
      termsAndConditions: false,
      engineeringAppendix: false,
    },
  },
};

// ============================================================================
// Persistence (localStorage)
// ============================================================================

const STORAGE_KEY = 'merlin_quote_template';
const SAVED_TEMPLATES_KEY = 'merlin_saved_templates';

/**
 * Load the active quote template (or default).
 */
export function loadQuoteTemplate(): QuoteTemplate {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as QuoteTemplate;
      // Migrate older versions
      if (!parsed.version || parsed.version < 2) {
        return { ...DEFAULT_TEMPLATE, ...parsed, version: 2 };
      }
      return parsed;
    }
  } catch {
    // Fall through
  }
  return { ...DEFAULT_TEMPLATE };
}

/**
 * Save the active quote template.
 */
export function saveQuoteTemplate(template: QuoteTemplate): void {
  template.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
}

/**
 * Get all saved template presets (user-created).
 */
export function getSavedTemplates(): QuoteTemplate[] {
  try {
    const stored = localStorage.getItem(SAVED_TEMPLATES_KEY);
    if (stored) return JSON.parse(stored) as QuoteTemplate[];
  } catch {
    // Fall through
  }
  return [];
}

/**
 * Save a named template preset.
 */
export function saveNamedTemplate(template: QuoteTemplate): void {
  const templates = getSavedTemplates();
  const existingIdx = templates.findIndex((t) => t.name === template.name);
  if (existingIdx >= 0) {
    templates[existingIdx] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    templates.push({ ...template, updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(templates));
}

/**
 * Delete a saved template by name.
 */
export function deleteNamedTemplate(name: string): void {
  const templates = getSavedTemplates().filter((t) => t.name !== name);
  localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(templates));
}

/**
 * Reset active template to defaults.
 */
export function resetQuoteTemplate(): void {
  localStorage.removeItem(STORAGE_KEY);
}
