/**
 * IntelligencePanel.tsx - Phase 2A Inline Intelligence
 *
 * Reusable component for displaying 4 intelligence panel types inline:
 * - Value Teaser (peer benchmarks)
 * - Suggested Goals (AI recommendations)
 * - Weather Impact (climate → ROI translation)
 * - Industry Hint (business name inference)
 *
 * ✅ TrueQuote™ Integrated: Uses official TrueQuoteBadge + SourceAttributionTooltip
 *
 * Created: January 18, 2026
 */

import React from "react";
import { TrendingUp, Target, CloudRain, Building2 } from "lucide-react";
import { TrueQuoteBadge } from "@/components/shared/TrueQuoteBadge";
import { SourceAttributionTooltip } from "@/components/quotes/SourceAttributionTooltip";
import type {
  ValueTeaserMetric,
  GoalSuggestion,
  WeatherImpact,
  IndustryInference,
} from "@/types/intelligence.types";
import type { BenchmarkSource } from "@/services/benchmarkSources";

interface IntelligencePanelProps {
  type: "valueTeaser" | "suggestedGoals" | "weatherImpact" | "industryHint";
  data: ValueTeaserMetric[] | GoalSuggestion[] | WeatherImpact[] | IndustryInference | null;
  className?: string;
}

export function IntelligencePanel({ type, data, className = "" }: IntelligencePanelProps) {
  if (!data) return null;

  // VALUE TEASER PANEL
  if (type === "valueTeaser" && Array.isArray(data) && data.length > 0) {
    const metrics = data as ValueTeaserMetric[];

    // Convert source string to BenchmarkSource for tooltip
    const benchmarkSource: BenchmarkSource | undefined = metrics[0]?.source
      ? {
          id: "peer-benchmark",
          name: metrics[0].source,
          organization: "Merlin Project Database",
          type: "primary",
          url: undefined,
          publicationDate: new Date().toISOString().split("T")[0],
          retrievalDate: new Date().toISOString().split("T")[0],
          vintage: "2024-2025",
          lastVerified: new Date().toISOString().split("T")[0],
          notes: `Peer benchmarks from ${metrics[0].sampleSize || "multiple"} similar projects. ${metrics.map((m) => m.displayText).join("; ")}`,
        }
      : undefined;

    return (
      <div
        className={`mt-4 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-400/10 to-blue-400/5 p-4 animate-fade-in ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-bold text-violet-300/90 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sites like yours typically see:</span>
          </div>
          <TrueQuoteBadge size="sm" variant="pill" className="scale-90" />
        </div>
        <ul className="space-y-2">
          {metrics.map((metric, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-violet-100/90">
              <span className="text-violet-300 mt-0.5">•</span>
              <span>
                <span className="font-semibold text-white">{metric.displayText}</span>
                {metric.sampleSize && (
                  <span className="text-[10px] text-violet-200/60 ml-1.5">
                    ({metric.sampleSize} projects)
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {benchmarkSource && (
          <div className="mt-3 flex items-center gap-2">
            <SourceAttributionTooltip source={benchmarkSource} iconSize="sm" />
            <span className="text-[9px] text-violet-300/50 italic">Hover for source details</span>
          </div>
        )}
      </div>
    );
  }

  // SUGGESTED GOALS PANEL
  if (type === "suggestedGoals" && Array.isArray(data) && data.length > 0) {
    const goals = data as GoalSuggestion[];

    // Convert first goal source to BenchmarkSource
    const goalSource: BenchmarkSource | undefined = goals[0]?.source
      ? {
          id: "goal-suggestion",
          name: goals[0].source,
          organization: "Merlin Intelligence Layer",
          type: "primary",
          url: undefined,
          publicationDate: new Date().toISOString().split("T")[0],
          retrievalDate: new Date().toISOString().split("T")[0],
          vintage: "2026",
          lastVerified: new Date().toISOString().split("T")[0],
          notes: `AI-powered goal recommendations: ${goals.map((g) => `${g.goalName} (${Math.round((g.confidence || 0) * 100)}%)`).join(", ")}`,
        }
      : undefined;

    return (
      <div
        className={`mt-4 rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-amber-400/5 p-4 animate-fade-in ${className}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-bold text-amber-300/90 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Merlin recommends these priorities:</span>
          </div>
          <TrueQuoteBadge size="sm" variant="pill" className="scale-90" />
        </div>
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.goalId} className="flex items-start gap-2 text-xs text-amber-100/90">
              <span className="text-amber-300 mt-0.5 text-sm">✓</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{goal.goalName}</div>
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/20 ml-2">
                    {Math.round((goal.confidence || 0) * 100)}%
                  </div>
                </div>
                {goal.rationale && (
                  <div className="text-[10px] text-amber-200/60 mt-1 leading-relaxed">
                    → {goal.rationale}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {goalSource && (
          <div className="mt-3 flex items-center gap-2">
            <SourceAttributionTooltip source={goalSource} iconSize="sm" />
            <span className="text-[9px] text-amber-300/50 italic">AI-powered recommendations</span>
          </div>
        )}
      </div>
    );
  }

  // WEATHER IMPACT PANEL
  if (type === "weatherImpact" && Array.isArray(data) && data.length > 0) {
    const impact = (data as WeatherImpact[])[0]; // Use first/primary impact

    const weatherSource: BenchmarkSource | undefined = impact.source
      ? {
          id: "weather-impact",
          name: impact.source,
          organization: "NOAA / EIA",
          type: "primary",
          url: undefined,
          publicationDate: new Date().toISOString().split("T")[0],
          retrievalDate: new Date().toISOString().split("T")[0],
          vintage: "2024",
          lastVerified: new Date().toISOString().split("T")[0],
          notes: `${impact.impactDescription} - ${impact.whyItMatters}`,
        }
      : undefined;

    return (
      <div
        className={`mt-4 rounded-xl border border-slate-400/20 bg-gradient-to-br from-slate-400/10 to-slate-400/5 p-4 animate-fade-in ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-bold text-slate-300/90 flex items-center gap-1.5">
            <CloudRain className="w-3.5 h-3.5" />
            <span>Climate impact on your business:</span>
          </div>
          <TrueQuoteBadge size="sm" variant="pill" className="scale-90" />
        </div>
        <div className="text-xs text-slate-100/90">
          <div className="font-semibold text-white leading-relaxed">{impact.impactDescription}</div>
          {impact.whyItMatters && (
            <div className="text-[10px] text-slate-200/60 mt-2 leading-relaxed">
              Why it matters: {impact.whyItMatters}
            </div>
          )}
        </div>
        {weatherSource && (
          <div className="mt-3 flex items-center gap-2">
            <SourceAttributionTooltip source={weatherSource} iconSize="sm" />
            <span className="text-[9px] text-slate-300/50 italic">Climate risk data</span>
          </div>
        )}
      </div>
    );
  }

  // INDUSTRY HINT PANEL
  if (type === "industryHint" && !Array.isArray(data)) {
    const industry = data as IndustryInference;
    return (
      <div
        className={`mt-4 rounded-xl border border-purple-600/20 bg-gradient-to-br from-purple-600/10 to-purple-600/5 p-4 animate-fade-in ${className}`}
      >
        <div className="text-[11px] font-bold text-purple-300/90 mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Industry detected from your business name:</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-white">{industry.industryName}</div>
          <div className="text-[9px] px-2 py-1 rounded bg-purple-600/15 text-purple-200 border border-purple-600/20">
            {Math.round((industry.confidence || 0) * 100)}% match
          </div>
        </div>
        <div className="mt-2 text-[10px] text-purple-200/60">
          We'll pre-select this in the next step (you can change it)
        </div>
      </div>
    );
  }

  return null;
}

// Fade-in animation (add to your global CSS or Tailwind config)
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(-8px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in { animation: fade-in 0.4s ease-out; }
