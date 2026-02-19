/**
 * generateMerlinInsights() — Cross-Slot Intelligence Engine
 * =============================================================
 *
 * Pure function: MerlinData + step → advisor output.
 * No React, no side effects, fully testable.
 *
 * Each insight generator checks its required slots exist,
 * returns a relevance score, and only the top insights are shown.
 *
 * Created: February 11, 2026
 */

import type { MerlinData } from "./useMerlinData";

// ============================================================================
// TYPES
// ============================================================================

type BadgeTone = "emerald" | "green" | "amber" | "red" | "blue";

export interface MerlinInsight {
  /** Unique key for dedup */
  id: string;
  /** The insight text (conversational, "Because…" prefix for justification) */
  text: string;
  /** Relevance score 0-100 — higher = shown first. Only top N are rendered. */
  relevance: number;
  /** Which Memory slots this insight draws from */
  slots: string[];
}

export interface MerlinInsightsOutput {
  subtitle: string;
  badges: Array<{ label: string; tone: BadgeTone }>;
  bullets: string[];
  /** Optional behavioral nudge */
  nudge: string | null;
  /** How many Memory slots contributed (0-12) */
  slotsUsed: number;
}

type WizardStep = "location" | "industry" | "profile" | "options" | "magicfit" | "results";

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}

function fmtRate(rate: number): string {
  return `$${rate.toFixed(2)}/kWh`;
}

function fmtPct(pct: number): string {
  return `${Math.round(pct)}%`;
}

// ============================================================================
// INSIGHT GENERATORS — each returns 0+ insights
// ============================================================================

function locationClimateInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];

  // Solar + weather cross-reference
  if (data.solar && data.weather) {
    const psh = data.solar.peakSunHours;
    const cdd = data.weather.coolingDegreeDays;
    const hdd = data.weather.heatingDegreeDays;

    if (psh >= 5.5 && cdd != null && cdd > 2000) {
      out.push({
        id: "climate-solar-cooling",
        text: `Your area gets ${psh.toFixed(1)} peak sun hours and ${cdd.toLocaleString()} cooling degree days — high solar production aligns with your AC peak loads.`,
        relevance: step === "location" ? 85 : step === "options" ? 70 : 50,
        slots: ["solar", "weather"],
      });
    } else if (psh >= 5.0) {
      out.push({
        id: "climate-solar-good",
        text: `${psh.toFixed(1)} peak sun hours puts your site in the top tier for solar+BESS economics.`,
        relevance: step === "location" ? 80 : 40,
        slots: ["solar"],
      });
    } else if (psh < 4.0 && psh > 0) {
      out.push({
        id: "climate-solar-low",
        text: `At ${psh.toFixed(1)} peak sun hours, BESS peak-shaving may deliver more value than solar — demand charges are your biggest lever.`,
        relevance: step === "options" ? 85 : 50,
        slots: ["solar"],
      });
    }

    if (hdd != null && hdd > 5000) {
      out.push({
        id: "climate-heating",
        text: `${hdd.toLocaleString()} heating degree days — consider winter peak-shaving; your heating loads may drive demand charges Oct–Mar.`,
        relevance: step === "profile" ? 60 : 30,
        slots: ["weather"],
      });
    }
  }

  return out;
}

function utilityRateInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  const rate = data.utilityRate;

  if (rate >= 0.25) {
    out.push({
      id: "rate-high",
      text: `At ${fmtRate(rate)}, your electricity rate is well above the national average — BESS arbitrage and solar self-consumption are highly profitable here.`,
      relevance: step === "location" ? 90 : step === "options" ? 75 : 45,
      slots: ["location"],
    });
  } else if (rate >= 0.15) {
    out.push({
      id: "rate-moderate",
      text: `${fmtRate(rate)} is moderate — demand charge reduction will likely be your primary savings driver.`,
      relevance: step === "location" ? 70 : 30,
      slots: ["location"],
    });
  } else if (rate > 0 && rate < 0.10) {
    out.push({
      id: "rate-low",
      text: `At ${fmtRate(rate)}, energy arbitrage margins are thin — focus on demand charge shaving and backup power value.`,
      relevance: step === "options" ? 75 : 40,
      slots: ["location"],
    });
  }

  if (data.demandCharge >= 20) {
    out.push({
      id: "demand-high",
      text: `$${data.demandCharge}/kW demand charges are significant — BESS peak-shaving could save ${fmtUSD(data.demandCharge * 12 * 50)}-${fmtUSD(data.demandCharge * 12 * 200)}/yr depending on your peak.`,
      relevance: step === "options" ? 80 : step === "location" ? 65 : 35,
      slots: ["location"],
    });
  }

  return out;
}

function loadProfileInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  if (data.peakLoadKW <= 0) return out;

  const contribs = data.contributors;
  const sortedContribs = Object.entries(contribs)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedContribs.length >= 2) {
    const [topName, topKW] = sortedContribs[0];
    const topPct = (topKW / data.peakLoadKW) * 100;
    const label = topName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    if (topPct > 40) {
      out.push({
        id: "profile-dominant-load",
        text: `${label} drives ${fmtPct(topPct)} of your ${Math.round(data.peakLoadKW)} kW peak — targeting this load with BESS gives the fastest payback.`,
        relevance: step === "profile" ? 90 : step === "options" ? 70 : 40,
        slots: ["profile"],
      });
    }
  }

  if (data.dutyCycle > 0 && data.dutyCycle < 0.4) {
    out.push({
      id: "profile-low-duty",
      text: `Your ${fmtPct(data.dutyCycle * 100)} duty cycle means high peaks but low average load — ideal for peak-shaving.`,
      relevance: step === "profile" ? 75 : 35,
      slots: ["profile"],
    });
  } else if (data.dutyCycle > 0.75) {
    out.push({
      id: "profile-high-duty",
      text: `${fmtPct(data.dutyCycle * 100)} duty cycle — your load is nearly flat. TOU arbitrage (buy low, use high) will be your main BESS revenue driver.`,
      relevance: step === "profile" ? 75 : 35,
      slots: ["profile"],
    });
  }

  return out;
}

function financialLeverInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  if (!data.financials) return out;
  const fin = data.financials;

  // Solar lever
  if (data.addOns.includeSolar && data.addOns.solarKW > 0 && fin.paybackYears > 0) {
    out.push({
      id: "fin-solar-lever",
      text: `With ${Math.round(data.addOns.solarKW)} kW solar, your payback is ${fin.paybackYears.toFixed(1)} years. Solar self-consumption at ${fmtRate(data.utilityRate)} makes this highly effective.`,
      relevance: step === "options" || step === "magicfit" ? 85 : step === "results" ? 70 : 40,
      slots: ["financials", "addOns", "location"],
    });
  }

  // Annual savings relative to net investment (after ITC)
  const effectiveInvestment = fin.netCost > 0 ? fin.netCost : fin.totalProjectCost;
  if (fin.annualSavings > 0 && effectiveInvestment > 0) {
    const savingsRatio = fin.annualSavings / effectiveInvestment;
    if (savingsRatio > 0.15) {
      out.push({
        id: "fin-great-roi",
        text: `${fmtUSD(fin.annualSavings)}/yr savings on a ${fmtUSD(effectiveInvestment)} net investment — that's a ${fmtPct(savingsRatio * 100)} annual return.`,
        relevance: step === "results" ? 90 : step === "magicfit" ? 80 : 50,
        slots: ["financials"],
      });
    }
  }

  // ITC impact
  if (fin.itcRate && fin.itcRate >= 0.30 && fin.itcAmount && fin.itcAmount > 10000) {
    out.push({
      id: "fin-itc-boost",
      text: `The ${fmtPct(fin.itcRate * 100)} ITC saves ${fmtUSD(fin.itcAmount)} — this alone shaves ${(fin.itcAmount / fin.annualSavings).toFixed(1)} years off your payback.`,
      relevance: step === "results" || step === "magicfit" ? 75 : 40,
      slots: ["financials"],
    });
  }

  return out;
}

function degradationInsight(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  if (!data.financials?.year10CapacityPct) return out;

  const yr10 = data.financials.year10CapacityPct;
  if (yr10 >= 85) {
    out.push({
      id: "deg-excellent",
      text: `Battery retains ~${fmtPct(yr10)} capacity at year 10 — minimal augmentation needed over the project life.`,
      relevance: step === "results" ? 60 : 25,
      slots: ["financials"],
    });
  } else if (yr10 < 70) {
    out.push({
      id: "deg-plan-ahead",
      text: `~${fmtPct(yr10)} capacity at year 10 — plan for augmentation around year 8-10 to maintain performance.`,
      relevance: step === "results" ? 70 : 30,
      slots: ["financials"],
    });
  }

  return out;
}

function riskInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  if (!data.financials) return out;
  const fin = data.financials;

  // Monte Carlo confidence
  if (fin.probabilityPositiveNPV != null && fin.probabilityPositiveNPV > 0) {
    if (fin.probabilityPositiveNPV >= 90) {
      out.push({
        id: "risk-high-confidence",
        text: `${fmtPct(fin.probabilityPositiveNPV)} probability of positive NPV — this project is bankable under Monte Carlo analysis.`,
        relevance: step === "results" ? 85 : 40,
        slots: ["financials"],
      });
    } else if (fin.probabilityPositiveNPV < 70) {
      out.push({
        id: "risk-moderate",
        text: `${fmtPct(fin.probabilityPositiveNPV)} probability of positive NPV — consider locking in a PPA or long-term rate to reduce uncertainty.`,
        relevance: step === "results" ? 80 : 40,
        slots: ["financials"],
      });
    }
  }

  // P10/P90 spread
  if (fin.npvP10 != null && fin.npvP90 != null) {
    out.push({
      id: "risk-range",
      text: `NPV range: ${fmtUSD(fin.npvP10)} (conservative) to ${fmtUSD(fin.npvP90)} (optimistic). Even the downside is strong.`,
      relevance: step === "results" ? 65 : 25,
      slots: ["financials"],
    });
  }

  return out;
}

function sessionInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  if (!data.session) return out;

  if (data.session.quoteGenerations >= 3) {
    out.push({
      id: "session-refined",
      text: `You've refined your quote ${data.session.quoteGenerations} times — each iteration gets you closer to the optimal configuration.`,
      relevance: step === "results" ? 50 : 20,
      slots: ["session"],
    });
  }

  if (data.session.addOnChanges >= 2 && step === "options") {
    out.push({
      id: "session-exploring",
      text: `Comparing options is smart — you've tested ${data.session.addOnChanges} configurations. Pick the one with the best payback.`,
      relevance: 55,
      slots: ["session"],
    });
  }

  return out;
}

function addOnInsights(data: MerlinData, step: WizardStep): MerlinInsight[] {
  const out: MerlinInsight[] = [];
  if (step !== "options" && step !== "magicfit") return out;

  if (!data.addOns.includeSolar && data.solar && data.solar.peakSunHours >= 5.0) {
    out.push({
      id: "addon-suggest-solar",
      text: `With ${data.solar.peakSunHours.toFixed(1)} peak sun hours, adding solar would significantly boost savings. Toggle it on to see the impact.`,
      relevance: 80,
      slots: ["solar", "addOns"],
    });
  }

  if (!data.addOns.includeGenerator && data.weather) {
    const profile = data.weather.profile?.toLowerCase() ?? "";
    if (profile.includes("hurricane") || profile.includes("storm") || profile.includes("extreme")) {
      out.push({
        id: "addon-suggest-gen",
        text: `Your area's weather profile ("${data.weather.profile}") suggests outage risk — a backup generator adds resilience.`,
        relevance: 65,
        slots: ["weather", "addOns"],
      });
    }
  }

  return out;
}

// ============================================================================
// STEP-SPECIFIC SUBTITLES
// ============================================================================

function getSubtitle(data: MerlinData, step: WizardStep): string {
  const city = data.location.city;
  const state = data.location.state;
  const loc = [city, state].filter(Boolean).join(", ");

  switch (step) {
    case "location":
      if (loc) return `Analyzing ${loc}`;
      return "Let's find your site";
    case "industry":
      if (data.industry && data.industry !== "auto") {
        const label = data.industry.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        return data.industryInferred ? `Detected: ${label}` : label;
      }
      return "What's your industry?";
    case "profile":
      return "Building your load profile";
    case "options":
      return "Enhance your system";
    case "magicfit":
      return "MagicFit™ Recommendations";
    case "results":
      return "Your TrueQuote™ Results";
    default:
      return "Merlin is analyzing";
  }
}

// ============================================================================
// STEP-SPECIFIC BADGES
// ============================================================================

function getBadges(data: MerlinData, step: WizardStep): Array<{ label: string; tone: BadgeTone }> {
  switch (step) {
    case "location": {
      if (data.location.state && data.utilityRate > 0) {
        return [{ label: "intel ready", tone: "green" }];
      }
      if (data.location.zip) {
        return [{ label: "analyzing", tone: "amber" }];
      }
      return [{ label: "getting started", tone: "blue" }];
    }
    case "industry": {
      if (data.industry && data.industry !== "auto") {
        return [
          { label: "industry set", tone: "green" },
          ...(data.industryInferred ? [{ label: "auto-detected", tone: "emerald" as BadgeTone }] : []),
        ];
      }
      return [{ label: "pick one below", tone: "amber" }];
    }
    case "profile":
      return [{ label: "building profile", tone: "blue" }];
    case "options":
      return [{ label: "optional add-ons", tone: "blue" }];
    case "magicfit":
      return [{ label: "3 options ready", tone: "emerald" }];
    case "results": {
      if (data.quote?.pricingComplete) {
        return [{ label: "TrueQuote™ Verified", tone: "green" }];
      }
      return [{ label: "calculating", tone: "amber" }];
    }
    default:
      return [];
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

const MAX_BULLETS = 4;

/**
 * Generate Merlin's advisor output from cross-slot Memory intelligence.
 *
 * Pure function — no React, no side effects.
 * Returns structured data that maps directly onto V7AdvisorPanel props.
 *
 * @param data  - MerlinData from useMerlinData()
 * @param step  - Current wizard step
 * @returns MerlinInsightsOutput for V7AdvisorPanel
 */
export function generateMerlinInsights(
  data: MerlinData,
  step: string,
): MerlinInsightsOutput {
  const wizardStep = step as WizardStep;

  // Collect all candidate insights
  const candidates: MerlinInsight[] = [
    ...locationClimateInsights(data, wizardStep),
    ...utilityRateInsights(data, wizardStep),
    ...loadProfileInsights(data, wizardStep),
    ...financialLeverInsights(data, wizardStep),
    ...degradationInsight(data, wizardStep),
    ...riskInsights(data, wizardStep),
    ...sessionInsights(data, wizardStep),
    ...addOnInsights(data, wizardStep),
  ];

  // Sort by relevance, take top N
  candidates.sort((a, b) => b.relevance - a.relevance);
  const topInsights = candidates.slice(0, MAX_BULLETS);

  // Collect unique slots used
  const slotsUsed = new Set<string>();
  for (const insight of topInsights) {
    for (const s of insight.slots) slotsUsed.add(s);
  }

  // Extract bullets
  const bullets = topInsights.map(i => i.text);

  // Behavioral nudge (lowest priority — only if room)
  let nudge: string | null = null;
  if (data.session && data.session.durationSec > 300 && bullets.length < MAX_BULLETS) {
    nudge = "Take your time — every detail you add makes the quote more accurate.";
  }

  return {
    subtitle: getSubtitle(data, wizardStep),
    badges: getBadges(data, wizardStep),
    bullets,
    nudge,
    slotsUsed: slotsUsed.size,
  };
}
