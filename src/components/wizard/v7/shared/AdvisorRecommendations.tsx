/**
 * ADVISOR RECOMMENDATIONS — Contextual intelligence BELOW the quote
 *
 * Analyzes the quote and provides smart suggestions:
 * 1. Power gap → suggest generators or solar
 * 2. Revenue opportunity → suggest EV charging
 * 3. Location advantage → suggest solar based on irradiance
 * 4. Resilience → suggest backup generation
 *
 * Each recommendation includes a reason and an action to configure it.
 *
 * Extracted from Step6ResultsV7.tsx (Feb 2026 — bloat decomposition)
 */

import React, { useMemo, useState } from "react";
import { Sparkles, ChevronDown, Check } from "lucide-react";
import type {
  WizardState as WizardV7State,
  WizardStep,
  PricingStatus,
  SystemAddOns,
} from "@/wizard/v7/hooks/useWizardV7";
import type { DisplayQuote } from "@/wizard/v7/utils/pricingSanity";

// ============================================================================
// TYPES
// ============================================================================

type RecommendationType =
  | "power-gap"
  | "solar-opportunity"
  | "ev-revenue"
  | "resilience"
  | "cost-savings";

interface Recommendation {
  type: RecommendationType;
  icon: string;
  title: string;
  description: string;
  accent: string; // Tailwind border/bg color class
}

// ============================================================================
// RECOMMENDATION ENGINE — Pure function, no React
// ============================================================================

function getAdvisorRecommendations(state: WizardV7State, quote: DisplayQuote): Recommendation[] {
  const recs: Recommendation[] = [];
  const peakKW = quote.peakLoadKW ?? 0;
  const bessKW = quote.bessKW ?? 0;
  const hasSolar = (quote.solarKW as number) > 0;
  const hasGenerator = (quote.generatorKW as number) > 0;
  const goals = state.goals ?? [];

  // 1. Power gap — BESS doesn't cover full peak load
  if (peakKW > 0 && bessKW > 0 && bessKW < peakKW * 0.9 && !hasGenerator && !hasSolar) {
    recs.push({
      type: "power-gap",
      icon: "⚡",
      title: "Close your power gap",
      description: `Your facility peaks at ${Math.round(peakKW)} kW but your BESS covers ${Math.round(bessKW)} kW. Adding solar panels or a backup generator would help meet your full power needs and improve resilience.`,
      accent: "amber",
    });
  }

  // 2. Solar opportunity — no solar configured yet
  if (!hasSolar) {
    const stateAbbr = state.location?.state ?? "";
    const highSolarStates = ["CA", "AZ", "NV", "NM", "TX", "FL", "CO", "UT", "HI"];
    const isHighSolar = highSolarStates.includes(stateAbbr);

    recs.push({
      type: "solar-opportunity",
      icon: "☀️",
      title: isHighSolar
        ? `Your area in ${stateAbbr} is great for solar`
        : "Add solar to offset daytime load",
      description: isHighSolar
        ? `${stateAbbr} receives excellent solar irradiance. Adding a solar array could offset significant daytime energy consumption and pair perfectly with your battery storage for 24/7 savings.`
        : "A solar array paired with your battery storage can offset daytime energy costs and increase your return on investment through energy arbitrage.",
      accent: "yellow",
    });
  }

  // 3. EV charging revenue — if not already an EV industry
  const isEVIndustry =
    state.industry === "ev_charging" || (state.industry as string) === "ev-charging";
  if (!isEVIndustry) {
    const hasCustomerTraffic = [
      "hotel",
      "retail",
      "shopping-center",
      "car_wash",
      "car-wash",
      "restaurant",
      "gas_station",
      "gas-station",
      "casino",
    ].includes(state.industry ?? "");
    if (hasCustomerTraffic) {
      recs.push({
        type: "ev-revenue",
        icon: "🔌",
        title: "Add EV charging as a revenue source",
        description:
          "Your facility type sees regular customer traffic. Adding EV chargers creates a new revenue stream while your BESS handles peak demand from charging sessions — keeping your demand charges low.",
        accent: "cyan",
      });
    }
  }

  // 4. Resilience — if goals mention backup/resilience and no generator
  const wantsResilience = goals.some(
    (g) =>
      typeof g === "string" &&
      (g.toLowerCase().includes("backup") ||
        g.toLowerCase().includes("resilien") ||
        g.toLowerCase().includes("outage"))
  );
  if (wantsResilience && !hasGenerator) {
    recs.push({
      type: "resilience",
      icon: "🛡️",
      title: "Strengthen your backup power",
      description:
        "You mentioned power resilience as a goal. Adding a backup generator alongside your BESS ensures uninterrupted operations during extended outages beyond your battery duration.",
      accent: "red",
    });
  }

  // 5. Cost savings — if payback seems high, suggest improvements
  const payback = Number(quote.roiYears);
  if (Number.isFinite(payback) && payback > 8 && !hasSolar) {
    recs.push({
      type: "cost-savings",
      icon: "📉",
      title: "Improve your payback period",
      description: `Your current payback is ~${Math.round(payback)} years. Adding solar generation can significantly reduce grid electricity costs and accelerate your return on investment.`,
      accent: "blue",
    });
  }

  return recs;
}

// ============================================================================
// ACCENT STYLES
// ============================================================================

const ACCENT_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  amber: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    text: "text-amber-300",
    glow: "shadow-amber-500/10",
  },
  yellow: {
    border: "border-yellow-500/25",
    bg: "bg-yellow-500/[0.06]",
    text: "text-yellow-300",
    glow: "shadow-yellow-500/10",
  },
  cyan: {
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/[0.06]",
    text: "text-cyan-300",
    glow: "shadow-cyan-500/10",
  },
  red: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.06]",
    text: "text-red-300",
    glow: "shadow-red-500/10",
  },
  blue: {
    border: "border-blue-500/25",
    bg: "bg-blue-500/[0.06]",
    text: "text-blue-300",
    glow: "shadow-blue-500/10",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdvisorRecommendations({
  state,
  quote,
  actions,
}: {
  state: WizardV7State;
  quote: DisplayQuote;
  pricingStatus: PricingStatus;
  actions: { goToStep?: (step: WizardStep) => Promise<void> };
  onRecalculate?: (addOns: SystemAddOns) => Promise<{ ok: boolean; error?: string }>;
}) {
  const recommendations = useMemo(() => getAdvisorRecommendations(state, quote), [state, quote]);

  const [expanded, setExpanded] = useState(true);

  if (recommendations.length === 0) {
    // No recommendations — show a positive message
    return (
      <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Check className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="font-semibold text-sm text-blue-200">System Looks Great</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Your configuration is well-optimized for your facility's needs.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Advisor header */}
      <button type="button" onClick={() => setExpanded(!expanded)} className="w-full">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-300" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-slate-200">Merlin's Recommendations</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {recommendations.length} suggestion{recommendations.length !== 1 ? "s" : ""} to
                optimize your project
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Recommendation cards */}
      {expanded && (
        <div className="space-y-3 pl-2">
          {recommendations.map((rec) => {
            const style = ACCENT_STYLES[rec.accent] ?? ACCENT_STYLES.amber;
            return (
              <div
                key={rec.type}
                className={`rounded-xl border ${style.border} ${style.bg} p-4 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${style.text}`}>{rec.title}</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Tip: Go back to Options step to reconfigure */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => actions.goToStep?.("options")}
              className="text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors font-medium"
            >
              ← Configure add-ons in Options step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
