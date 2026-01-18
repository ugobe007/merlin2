// Value Teaser Service (SSOT for peer benchmarking)
// Created: January 18, 2026
// Purpose: Calculate value ranges for industry+location with TrueQuote™ sources
// Database-driven: Queries peer_benchmarks table for real project data

import { supabase } from "@/services/supabaseClient";
import type {
  ValueTeaserMetric,
  ValueTeaserInput,
  PeerBenchmarkDB,
  IntelligenceServiceResponse,
} from "@/types/intelligence.types";

/**
 * Calculate value teaser metrics showing peer benchmarks
 * Returns 3-5 key metrics for "Sites like yours typically benefit from..."
 *
 * @param input - ZIP code, state, industry slug, optional climate profile
 * @returns Promise<IntelligenceServiceResponse<ValueTeaserMetric[]>>
 */
export async function calculateValueTeaser(
  input: ValueTeaserInput
): Promise<IntelligenceServiceResponse<ValueTeaserMetric[]>> {
  try {
    // Query peer benchmarks for this industry + state
    // Falls back to national benchmarks (state='ALL') if state-specific not found
    const { data, error } = await supabase
      .from("peer_benchmarks")
      .select("*")
      .eq("industry_slug", input.industrySlug)
      .in("state", [input.state, "ALL"])
      .eq("active", true)
      .order("state", { ascending: false }) // State-specific first
      .order("confidence", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[valueTeaserService] Database query failed:", error);
      return {
        success: false,
        data: null,
        error: error.message,
        fallbackUsed: true,
      };
    }

    if (!data || data.length === 0) {
      console.warn(
        `[valueTeaserService] No benchmarks found for ${input.industrySlug} in ${input.state}`
      );
      // Try fallback to generic benchmarks
      const fallback = getDefaultValueTeaser(input.industrySlug);
      return {
        success: true,
        data: fallback,
        fallbackUsed: true,
      };
    }

    // Map database benchmarks to ValueTeaserMetric format
    const metrics: ValueTeaserMetric[] = (data as PeerBenchmarkDB[]).map((benchmark) => ({
      metricName: benchmark.metric_name,
      valueRange: {
        min: benchmark.value_min,
        max: benchmark.value_max,
      },
      unit: benchmark.unit,
      displayText: benchmark.display_text,
      confidence: benchmark.confidence,
      sampleSize: benchmark.sample_size,
      source: benchmark.source,
    }));

    // Remove duplicates (prefer state-specific over national)
    const uniqueMetrics = new Map<string, ValueTeaserMetric>();
    for (const metric of metrics) {
      if (!uniqueMetrics.has(metric.metricName)) {
        uniqueMetrics.set(metric.metricName, metric);
      }
    }

    return {
      success: true,
      data: Array.from(uniqueMetrics.values()),
      fallbackUsed: false,
    };
  } catch (err) {
    console.error("[valueTeaserService] Unexpected error:", err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
      fallbackUsed: true,
    };
  }
}

/**
 * Fallback value teaser when database query fails or no benchmarks exist
 * Returns generic industry-appropriate metrics with lower confidence
 */
function getDefaultValueTeaser(industrySlug: string): ValueTeaserMetric[] {
  // Generic benchmarks by industry
  const defaultsByIndustry: Record<string, ValueTeaserMetric[]> = {
    "car-wash": [
      {
        metricName: "demand_charge_reduction_pct",
        valueRange: { min: 15, max: 30 },
        unit: "%",
        displayText: "15–30% demand charge reduction",
        confidence: "medium",
        sampleSize: 25,
        source: "Industry Average (estimate)",
      },
      {
        metricName: "backup_hours_typical",
        valueRange: { min: 1, max: 3 },
        unit: "hours",
        displayText: "1–3 hrs outage protection",
        confidence: "medium",
        sampleSize: 25,
        source: "Industry Average (estimate)",
      },
    ],
    hotel: [
      {
        metricName: "demand_charge_reduction_pct",
        valueRange: { min: 15, max: 25 },
        unit: "%",
        displayText: "15–25% cost savings",
        confidence: "medium",
        sampleSize: 40,
        source: "Industry Average (estimate)",
      },
      {
        metricName: "backup_hours_typical",
        valueRange: { min: 4, max: 8 },
        unit: "hours",
        displayText: "4–8 hr resilience common",
        confidence: "medium",
        sampleSize: 40,
        source: "Industry Average (estimate)",
      },
    ],
    hospital: [
      {
        metricName: "backup_hours_critical",
        valueRange: { min: 12, max: 24 },
        unit: "hours",
        displayText: "12–24 hr backup critical",
        confidence: "high",
        sampleSize: 60,
        source: "Healthcare Standards (estimate)",
      },
      {
        metricName: "demand_charge_reduction_pct",
        valueRange: { min: 30, max: 50 },
        unit: "%",
        displayText: "30–50% outage cost prevention",
        confidence: "medium",
        sampleSize: 50,
        source: "Industry Average (estimate)",
      },
    ],
  };

  // Universal fallback if industry not recognized
  const defaultMetrics = defaultsByIndustry[industrySlug] || [
    {
      metricName: "demand_charge_reduction_pct",
      valueRange: { min: 15, max: 30 },
      unit: "%",
      displayText: "15–30% demand charge reduction",
      confidence: "medium",
      sampleSize: 30,
      source: "Industry Average (estimate)",
    },
    {
      metricName: "payback_years_avg",
      valueRange: { min: 5, max: 8 },
      unit: "years",
      displayText: "5–8 year payback typical",
      confidence: "medium",
      sampleSize: 30,
      source: "Industry Average (estimate)",
    },
  ];

  return defaultMetrics;
}

/**
 * Quick estimate for UI preview (synchronous)
 * Returns generic benchmarks without database query
 */
export function estimateValueTeaser(industrySlug: string): ValueTeaserMetric[] {
  return getDefaultValueTeaser(industrySlug);
}

/**
 * Format value teaser for display panel
 * Example: "Sites like yours typically benefit from:"
 */
export function formatValueTeaserPanel(metrics: ValueTeaserMetric[]): string {
  return metrics.map((m) => `• ${m.displayText}`).join("\n");
}
