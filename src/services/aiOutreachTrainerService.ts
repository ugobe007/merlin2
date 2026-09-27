/**
 * AI Outreach Trainer & Email Pitch Generator Service
 * ====================================================
 * Generates personalized, high-converting outbound emails for commercial & industrial leads
 * based on decision maker role, industry qualification triggers, and Merlin Energy Stacking™ metrics.
 */

import type { OutboundTargetLead } from "@/data/outboundLeadsData";

export interface EmailDraftRequest {
  lead: OutboundTargetLead;
  angle:
    | "pay_less_for_power"
    | "peak_shaving"
    | "demand_insurance"
    | "solar_bess_itc"
    | "industrial_resilience"
    | "tariff_optimization";
  tone: "executive" | "engineering" | "consultative";
  customNotes?: string;
  customTrainingRules?: string[];
}

export interface GeneratedEmailPitch {
  subject: string;
  body: string;
  keyHighlights: string[];
  recommendedFollowUpDays: number;
}

/**
 * Returns an industry-correlated value hook with average annual savings and grid exposure reduction
 */
export function getIndustryValueHook(lead: OutboundTargetLead): string {
  const v = lead.vertical.toLowerCase();

  if (v.includes("car wash")) {
    return `For example, regional car wash operators save $42,000 to $85,000 on average per year while reducing peak motor demand grid exposure by 35%.`;
  }
  if (v.includes("cold storage") || v.includes("food")) {
    return `For example, commercial cold storage & food distribution facilities save $95,000 to $180,000 on average per year while reducing 24/7 refrigeration peak grid exposure by 45%.`;
  }
  if (
    v.includes("manufacturing") ||
    v.includes("industrial") ||
    v.includes("gases") ||
    v.includes("semiconductor")
  ) {
    return `For example, industrial manufacturing facilities save $110,000 to $240,000 on average per year while reducing peak process load grid exposure by 40%.`;
  }
  if (v.includes("hotel") || v.includes("hospitality") || v.includes("resort")) {
    return `For example, hotel & resort properties save $65,000 to $150,000 on average per year while reducing TOU peak tariff grid exposure by 30%.`;
  }
  if (v.includes("logistics") || v.includes("fleet") || v.includes("waste")) {
    return `For example, logistics and distribution hubs save $75,000 to $160,000 on average per year while shielding against EV fleet charging grid exposure by 40%.`;
  }
  if (
    v.includes("venue") ||
    v.includes("stadium") ||
    v.includes("arena") ||
    v.includes("convention")
  ) {
    return `For example, major event venues save $85,000 to $190,000 on average per year while eliminating event-driven peak grid exposure by 50%.`;
  }
  return `For example, commercial facilities in ${lead.city} save $55,000 to $130,000 on average per year while reducing peak demand grid exposure by 35%.`;
}

export function generateAIOutreachPitch(req: EmailDraftRequest): GeneratedEmailPitch {
  const { lead, angle, tone, customNotes, customTrainingRules = [] } = req;
  const firstName = lead.decisionMaker.split(" ")[0] || "Team";
  const isNamed = lead.contactVerification !== "Role target - name research needed";
  const greeting = isNamed ? `Hi ${firstName},` : `Hi ${lead.company} Leadership,`;

  let subject = "";
  let body = "";
  const highlights: string[] = [];

  const industryHook = getIndustryValueHook(lead);

  // Angle & Hook Selection
  if (angle === "pay_less_for_power") {
    subject = `Reducing power bills and grid dependency for ${lead.company}`;
    highlights.push("Correlated industry savings & grid exposure reduction");
    highlights.push("Simple executive message: Pay less for power, control more energy");
    highlights.push("No cost or obligation preliminary ROI numbers");

    body = `${greeting}

I’m reaching out because we’re helping businesses reduce their monthly power bills while becoming less dependent on the grid.

Merlin looks at how your business uses electricity and finds the best combination of utility power, battery storage, solar and other energy sources to lower your costs.

The goal is simple:

"Pay less for power. Control more of your own energy."

We can take a look at ${lead.company} and show you where the potential savings are, what it would cost, and how long it would take to pay back. ${industryHook}

Would you be interested in reviewing the numbers? No cost or obligation.

Bob Christopher
Merlin Energy
merlinenergy.net`;
  } else if (angle === "peak_shaving") {
    subject = `Energy Peak Shaving & Demand Charge Reduction for ${lead.company}`;
    highlights.push("20-40% reduction in monthly demand charges");
    highlights.push("Sub-second BESS response for heavy motor/pump load spikes");
    highlights.push("30% to 50% Federal ITC Tax Credit under IRA 2022");

    body = `${greeting}

I noticed ${lead.company}'s operations in ${lead.city}, ${lead.state}. Facilities with high instantaneous electrical demand—such as tunnel motors, high-volume pumps, and vacuum systems—often pay severe monthly utility demand charges that scale with peak kW surges.

At Merlin Energy, our StackQuote™ platform models custom Energy Stacking™ (solar + BESS battery storage) designed specifically to clamp peak kW demand. By deploying targeted battery storage, ${lead.company} can shave expensive demand peaks automatically without interrupting operations.

${lead.merlinAngle ? `Key Opportunity: ${lead.merlinAngle}.` : ""}

Key Projected Metrics for ${lead.company}:
• Typical Utility Bill Savings: 20% – 38% annually
• Federal Investment Tax Credit (ITC): 30% – 50% (Direct Pay / Transferable)
• Estimated Payback Window: 4.8 – 6.5 years

Would you be open to a brief 10-minute preview of a preliminary StackQuote™ financial model tailored for ${lead.company}?

Bob Christopher
Merlin Energy
merlinenergy.net`;
  } else if (angle === "demand_insurance") {
    subject = `Refrigeration Load Optimization & Demand Charge Shield for ${lead.company}`;
    highlights.push("24/7 cold storage peak demand clamping");
    highlights.push("Thermal mass arbitrage during high TOU peak rate windows");
    highlights.push("Emergency backup resilience for critical refrigeration circuits");

    body = `${greeting}

Refrigeration and cold storage operations in ${lead.city} face some of the highest peak utility demand rates during summer afternoon windows. High continuous cooling loads represent one of your largest addressable operational expenses.

Merlin's Energy Stacking™ architecture integrates battery storage (BESS) and high-efficiency solar to shift grid dependency away from peak utility tariff windows. For cold storage and food distribution facilities, this serves as both demand charge reduction and critical power resilience.

Key Value Drivers for ${lead.company}:
• Peak Demand Charge Clamping during peak TOU billing hours
• Emergency Ride-Through Power for critical refrigeration compressors
• 30%+ Federal IRA Investment Tax Credit + MACRS Accelerated Depreciation

${customNotes ? `Note: ${customNotes}\n` : ""}
Could I send over a 1-page StackQuote™ financial analysis for ${lead.company}'s ${lead.city} facility?

Bob Christopher
Merlin Energy
merlinenergy.net`;
  } else if (angle === "solar_bess_itc") {
    subject = `Unlocking 30-50% IRA Tax Credits + Energy Stacking for ${lead.company}`;
    highlights.push("Stacking Solar + BESS + EV infrastructure for max ROI");
    highlights.push("Full NREL-verified financial modeling and tariff matching");
    highlights.push("Zero capital outlay (PPA / Lease) options available");

    body = `${greeting}

As ${lead.title || "Executive Lead"} at ${lead.company}, you are likely evaluating infrastructure upgrades to lower ongoing facility operating expenses in ${lead.city}, ${lead.state}.

Under the Inflation Reduction Act (IRA 2022), commercial energy storage and solar installations qualify for 30% to 50% Investment Tax Credits (ITC), combined with 100% 1st-year MACRS bonus depreciation.

Our StackQuote™ engine evaluates ${lead.company}'s specific facility profile to build a bankable energy model that stacks solar generation, battery storage, and EV fleet charging.

${lead.merlinAngle ? `Strategic Focus: ${lead.merlinAngle}.` : ""}

I would welcome the opportunity to share a complimentary 3-minute StackQuote™ model for ${lead.company}. Are you available for a quick call this week?

Bob Christopher
Merlin Energy
merlinenergy.net`;
  } else if (angle === "industrial_resilience") {
    subject = `Industrial Load Smoothing & Power Resilience for ${lead.company}`;
    highlights.push("Uninterrupted power quality and process load smoothing");
    highlights.push("Protection against utility voltage sags and outages");
    highlights.push("NREL-grade tariff optimization and peak shaving");

    body = `${greeting}

Industrial manufacturing facilities in ${lead.city} require uninterrupted power quality and tight load management to prevent costly downtime and equipment stress.

Merlin Energy specializes in industrial Energy Stacking™—combining battery storage (BESS) and solar microgrid tech to smooth process load spikes, eliminate demand charges, and provide seamless backup resilience.

Why Manufacturing Leaders Choose Merlin:
• Automated Peak Shaving for heavy industrial equipment
• Microgrid Resilience: Instantaneous power transfer during grid disturbances
• Verifiable ROI: Every calculation backed by NREL ATB benchmark data

${customNotes ? `Custom Notes: ${customNotes}\n` : ""}
Would you be open to reviewing a preliminary BESS & Solar sizing model for ${lead.company}?

Bob Christopher
Merlin Energy
merlinenergy.net`;
  } else {
    // Tariff optimization
    subject = `Utility Tariff & Demand Charge Optimization for ${lead.company}`;
    highlights.push("Multi-site utility tariff matching & rate schedule optimization");
    highlights.push("Automated peak load shifting");
    highlights.push("Turnkey design, procurement, and incentive filing");

    body = `${greeting}

We have been analyzing utility tariff structures and commercial demand charges across ${lead.state}. Facilities operating in ${lead.city} are subject to aggressive peak demand pricing that can represent up to 50% of the monthly electric bill.

Merlin Energy's platform models how ${lead.company} can optimize its utility rate schedule using intelligent energy storage and solar.

${lead.merlinAngle ? `Focus Area: ${lead.merlinAngle}.` : ""}

Would you be open to receiving a 1-page StackQuote™ executive summary for ${lead.company}?

Bob Christopher
Merlin Energy
merlinenergy.net`;
  }

  // Apply custom training rules if provided
  if (customTrainingRules.length > 0) {
    body += `\n\n[Applied Trained AI Agent Directives:\n${customTrainingRules.map((r) => `• ${r}`).join("\n")}]`;
  }

  // Tone adjustments
  if (tone === "executive") {
    body = body.replace(
      /Would you be open to/g,
      "Are you available for a 5-min executive overview"
    );
  } else if (tone === "engineering") {
    body += `\n\nTechnical Note: Models incorporate NREL ATB 2024 degradation curves, 15-minute interval load matching, and local utility tariff schedules.`;
  }

  return {
    subject,
    body,
    keyHighlights: highlights,
    recommendedFollowUpDays: 3,
  };
}

// ─── Local Storage AI Training Rules & Saved Drafts ───────────────────────────

const AI_RULES_KEY = "merlin_ai_outreach_rules";
const SAVED_DRAFTS_KEY = "merlin_saved_outreach_drafts";

export function getTrainedAIRules(): string[] {
  try {
    const raw = localStorage.getItem(AI_RULES_KEY);
    return raw
      ? JSON.parse(raw)
      : [
          'Use Bob Christopher’s "Pay Less for Power" template as primary executive outreach.',
          "Correlate industry-specific annual savings and grid exposure reduction for each company.",
          "Emphasize 30-50% IRA ITC tax credit on all BESS & Solar proposals.",
          "Highlight sub-5 year payback for car wash motor peak shaving.",
          "Reference NREL ATB benchmark data for technical credibility.",
          "For cold storage facilities, position BESS as 24/7 demand charge insurance.",
        ];
  } catch {
    return [];
  }
}

export function saveTrainedAIRules(rules: string[]): void {
  try {
    localStorage.setItem(AI_RULES_KEY, JSON.stringify(rules));
  } catch (err) {
    console.warn("Failed to save AI rules:", err);
  }
}

export interface SavedLeadDraft {
  leadId: string;
  company: string;
  subject: string;
  body: string;
  updatedAt: string;
}

export function getSavedLeadDrafts(): Record<string, SavedLeadDraft> {
  try {
    const raw = localStorage.getItem(SAVED_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLeadDraft(draft: SavedLeadDraft): void {
  try {
    const existing = getSavedLeadDrafts();
    existing[draft.leadId] = draft;
    localStorage.setItem(SAVED_DRAFTS_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn("Failed to save lead draft:", err);
  }
}
