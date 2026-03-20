/**
 * Dynamic API for Opportunities
 * RESTful endpoints for programmatic access to opportunity data
 */

import { supabase } from "../lib/supabase";
import { scrapeOpportunities } from "../services/opportunityScraperService";
import { batchAnalyzeArticles } from "../services/aiAnalysisService";
import type { Opportunity } from "../types/opportunity";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp: string;
  };
}

/**
 * GET /api/opportunities
 * List all opportunities with optional filtering and pagination
 */
export async function listOpportunities(params: {
  status?: string[];
  industry?: string[];
  minConfidence?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<ApiResponse<Opportunity[]>> {
  try {
    const {
      status,
      industry,
      minConfidence = 0,
      search,
      page = 1,
      limit = 50,
      sortBy = "created_at",
      sortOrder = "desc",
    } = params;

    let query = supabase.from("opportunities").select("*", { count: "exact" });

    // Apply filters
    if (status && status.length > 0) {
      query = query.in("status", status);
    }

    if (industry && industry.length > 0) {
      query = query.in("industry", industry);
    }

    if (minConfidence > 0) {
      query = query.gte("confidence_score", minConfidence);
    }

    if (search) {
      query = query.or(
        `company_name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return {
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

/**
 * GET /api/opportunities/:id
 * Get single opportunity by ID
 */
export async function getOpportunity(id: string): Promise<ApiResponse<Opportunity>> {
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    return {
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

/**
 * POST /api/scraper/run
 * Trigger scraper with optional AI enrichment
 */
export async function runScraperApi(options: {
  enableAI?: boolean;
  sources?: string[];
  minConfidence?: number;
}): Promise<ApiResponse> {
  try {
    const { enableAI = false, minConfidence = 30 } = options;

    // Run scraper
    console.log("🔍 Running opportunity scraper...");
    const scraperResult = await scrapeOpportunities();

    let opportunities = scraperResult.opportunities;

    // Optional AI enrichment
    if (enableAI && opportunities.length > 0) {
      console.log("🤖 Enriching opportunities with AI analysis...");
      opportunities = await batchAnalyzeArticles(opportunities);
    }

    // Filter by minimum confidence
    opportunities = opportunities.filter((opp) => opp.confidence_score >= minConfidence);

    // Check for duplicates
    const { data: existing } = await supabase
      .from("opportunities")
      .select("source_url")
      .in(
        "source_url",
        opportunities.map((o) => o.source_url)
      );

    const existingUrls = new Set(existing?.map((e) => e.source_url) || []);
    const newOpportunities = opportunities.filter((opp) => !existingUrls.has(opp.source_url));

    // Insert new opportunities
    if (newOpportunities.length > 0) {
      const { error } = await supabase.from("opportunities").insert(newOpportunities);

      if (error) {
        return {
          success: false,
          error: error.message,
          meta: { timestamp: new Date().toISOString() },
        };
      }
    }

    // Log scraper run
    await supabase.from("scraper_runs").insert({
      source: "news_aggregator",
      total_found: opportunities.length,
      duplicates_skipped: opportunities.length - newOpportunities.length,
      status: "success",
    });

    return {
      success: true,
      data: {
        total_found: opportunities.length,
        new_opportunities: newOpportunities.length,
        duplicates_skipped: opportunities.length - newOpportunities.length,
        ai_enrichment_enabled: enableAI,
      },
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Log failed run
    await supabase.from("scraper_runs").insert({
      source: "news_aggregator",
      total_found: 0,
      duplicates_skipped: 0,
      status: "failed",
      error_message: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

/**
 * GET /api/analytics/summary
 * Get analytics summary for opportunities
 */
export async function getAnalyticsSummary(): Promise<ApiResponse> {
  try {
    const { data: opportunities, error } = await supabase.from("opportunities").select("*");

    if (error) {
      return {
        success: false,
        error: error.message,
        meta: { timestamp: new Date().toISOString() },
      };
    }

    const summary = {
      total: opportunities?.length || 0,
      by_status: {
        new: opportunities?.filter((o) => o.status === "new").length || 0,
        contacted: opportunities?.filter((o) => o.status === "contacted").length || 0,
        qualified: opportunities?.filter((o) => o.status === "qualified").length || 0,
        archived: opportunities?.filter((o) => o.status === "archived").length || 0,
      },
      by_confidence: {
        high: opportunities?.filter((o) => o.confidence_score >= 70).length || 0,
        medium: opportunities?.filter((o) => o.confidence_score >= 50 && o.confidence_score < 70).length || 0,
        low: opportunities?.filter((o) => o.confidence_score < 50).length || 0,
      },
      by_industry: {} as Record<string, number>,
      average_confidence: opportunities?.reduce((sum, o) => sum + o.confidence_score, 0) / (opportunities?.length || 1),
      total_value_estimate: "TBD", // Could calculate from budget estimates
    };

    // Count by industry
    opportunities?.forEach((opp) => {
      if (opp.industry) {
        summary.by_industry[opp.industry] = (summary.by_industry[opp.industry] || 0) + 1;
      }
    });

    return {
      success: true,
      data: summary,
      meta: { timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
