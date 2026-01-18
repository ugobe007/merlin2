// Industry Inference Service (SSOT for business name → industry mapping)
// Created: January 18, 2026
// Purpose: Extract industry from business name with confidence score
// TrueQuote™ Compliance: Uses database keyword mappings (not hardcoded)

import { supabase } from "@/services/supabaseClient";
import type {
  IndustryInference,
  IndustryInferenceInput,
  IndustryKeywordMappingDB,
  IntelligenceServiceResponse,
} from "@/types/intelligence.types";

/**
 * Infer industry from business name using keyword matching
 * Returns industry classification with confidence score
 *
 * @param input - Business name (e.g., "Marriott Hotel", "McDonald's Car Wash")
 * @returns Promise<IntelligenceServiceResponse<IndustryInference>>
 */
export async function inferIndustry(
  input: IndustryInferenceInput
): Promise<IntelligenceServiceResponse<IndustryInference>> {
  try {
    const businessName = input.businessName.toLowerCase().trim();

    if (!businessName) {
      return {
        success: false,
        data: null,
        error: "Business name is required",
      };
    }

    // Query all active keyword mappings
    const { data, error } = await supabase
      .from("industry_keyword_mappings")
      .select("*")
      .eq("active", true)
      .order("confidence_weight", { ascending: false });

    if (error) {
      console.error("[industryInference] Database query failed:", error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      console.warn("[industryInference] No keyword mappings found in database");
      return {
        success: false,
        data: null,
        error: "No keyword mappings configured",
      };
    }

    // Score each industry based on keyword matches
    const industryScores = new Map<string, { score: number; keywords: string[] }>();

    for (const mapping of data as IndustryKeywordMappingDB[]) {
      const keyword = mapping.case_sensitive ? mapping.keyword : mapping.keyword.toLowerCase();
      const searchIn = mapping.case_sensitive ? input.businessName : businessName;

      let matched = false;

      if (mapping.is_exact_match) {
        // Exact match required
        matched = searchIn === keyword;
      } else {
        // Partial match (substring)
        matched = searchIn.includes(keyword);
      }

      if (matched) {
        const existing = industryScores.get(mapping.industry_slug) || { score: 0, keywords: [] };
        industryScores.set(mapping.industry_slug, {
          score: existing.score + mapping.confidence_weight,
          keywords: [...existing.keywords, mapping.keyword],
        });
      }
    }

    // No matches found
    if (industryScores.size === 0) {
      return {
        success: true,
        data: null, // No confident inference
        fallbackUsed: false,
      };
    }

    // Find highest scoring industry
    let bestIndustry: string | null = null;
    let bestScore = 0;
    let bestKeywords: string[] = [];

    for (const [industrySlug, { score, keywords }] of industryScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestIndustry = industrySlug;
        bestKeywords = keywords;
      }
    }

    if (!bestIndustry) {
      return {
        success: true,
        data: null,
        fallbackUsed: false,
      };
    }

    // Fetch industry display name
    const { data: useCase } = await supabase
      .from("use_cases")
      .select("name")
      .eq("slug", bestIndustry)
      .single();

    // Normalize confidence to 0-1 range (cap at 1.00)
    const normalizedConfidence = Math.min(bestScore, 1.0);

    return {
      success: true,
      data: {
        industrySlug: bestIndustry,
        industryName: useCase?.name || formatIndustryName(bestIndustry),
        confidence: Number(normalizedConfidence.toFixed(2)),
        matchedKeywords: bestKeywords,
      },
      fallbackUsed: false,
    };
  } catch (err) {
    console.error("[industryInference] Unexpected error:", err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Format industry slug to human-readable name
 * Converts 'car-wash' → 'Car Wash'
 */
function formatIndustryName(industrySlug: string): string {
  return industrySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Quick estimate for UI preview (synchronous)
 * Uses basic pattern matching without database query
 */
export function estimateIndustry(businessName: string): IndustryInference | null {
  const lower = businessName.toLowerCase();

  // Simple pattern matching (fallback)
  const patterns: [RegExp, string, string][] = [
    [/hotel|inn|lodge|resort|motel/i, "hotel", "Hotel & Hospitality"],
    [/car\s*wash|carwash|auto\s*wash/i, "car-wash", "Car Wash"],
    [/hospital|medical\s*center|healthcare/i, "hospital", "Hospital"],
    [/data\s*center|datacenter|colocation/i, "data-center", "Data Center"],
    [/office|headquarters|corporate/i, "office", "Office Building"],
    [/warehouse|distribution|logistics/i, "warehouse", "Warehouse & Logistics"],
    [/manufacturing|factory|plant/i, "manufacturing", "Manufacturing Facility"],
  ];

  for (const [pattern, slug, name] of patterns) {
    if (pattern.test(lower)) {
      return {
        industrySlug: slug,
        industryName: name,
        confidence: 0.75, // Lower confidence for non-database estimate
        matchedKeywords: [],
      };
    }
  }

  return null;
}
