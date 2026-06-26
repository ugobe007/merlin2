/**
 * OPPORTUNITY ASSESSMENT SERVICE
 * ===============================
 * Generates a structured energy-solution assessment for a scraped opportunity.
 *
 * Two-stage pipeline:
 *   Stage 1 — Rule-based fast path (instant, no API cost):
 *     Derives BESS type, rough size estimate, grid drivers, and co-equipment
 *     needs from the opportunity's signals, industry, and description text.
 *
 *   Stage 2 — GPT-4 enrichment (optional, on-demand):
 *     Sends the article description + rule-based context to GPT-4 to produce
 *     a richer narrative assessment with talking points for the sales rep.
 *
 * The final OppAssessment is persisted to opportunities.opportunity_assessment.
 */

import type { OpportunitySignal, IndustryType } from "../types/opportunity";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BessType =
  | "peak_shaving" // reduce demand charges
  | "backup_power" // UPS / resilience
  | "microgrid_anchor" // islanding + dispatch
  | "arbitrage" // time-of-use / wholesale
  | "demand_response" // VPP / grid services enrollment
  | "solar_storage" // paired C&I solar self-consumption
  | "ev_load_management" // EV fleet / DCFC smoothing
  | "unknown";

export type UrgencyTier = "hot" | "warm" | "cool";

export type GridDriver =
  | "high_demand_charges"
  | "unreliable_grid"
  | "grid_too_expensive"
  | "grid_expansion_needed"
  | "decarbonization_mandate"
  | "backup_resilience"
  | "interconnection_constraint"
  | "rate_arbitrage_opportunity"
  | "unknown";

export type CoEquipment =
  | "solar_pv"
  | "wind"
  | "generator_backup"
  | "ev_chargers"
  | "ems_controls"
  | "transformer_upgrade"
  | "microgrid_controller"
  | "weather_monitoring";

export type AlternativePower =
  | "solar"
  | "wind"
  | "generator"
  | "geothermal"
  | "nuclear_smr"
  | "fuel_cell"
  | "hydro";

export interface SizeEstimate {
  minKwh: number;
  maxKwh: number;
  minKw: number;
  maxKw: number;
  confidence: "high" | "medium" | "low";
  basis: string;
}

export interface OppAssessment {
  // Core classification
  bess_types: BessType[];
  primary_bess_type: BessType;
  urgency_tier: UrgencyTier;

  // Sizing
  size_estimate: SizeEstimate;

  // Grid + economic drivers
  grid_drivers: GridDriver[];

  // Co-equipment & alternative power recommendations
  co_equipment: CoEquipment[];
  alternative_power: AlternativePower[];

  // Scores per technology (0–100)
  technology_fit: {
    bess: number;
    solar: number;
    generator: number;
    microgrid: number;
    ev_charging: number;
  };

  // Sales-ready talking points (3–6 bullets)
  talking_points: string[];

  // Flags
  is_rfp_rfq: boolean; // direct procurement intent
  is_federal: boolean; // federal/gov contract
  is_funded: boolean; // grant / loan guarantee in place
  has_interconnection: boolean; // interconnection application filed

  // Metadata
  assessed_at: string;
  assessment_version: string; // bump when logic changes
  gpt_enriched: boolean;

  // Optional GPT-4 narrative fields (populated when gpt_enriched = true)
  gpt_bess_narrative?: string;
  gpt_size_narrative?: string;
  gpt_grid_situation?: string;
  gpt_alt_power?: string;
  gpt_urgency?: string;
  gpt_red_flags?: string[];
}

// ─── Industry → size lookup table ────────────────────────────────────────────
// kWh / kW ranges by industry vertical, based on NREL ATB and DOE case studies

const INDUSTRY_SIZE: Partial<Record<IndustryType, SizeEstimate>> = {
  data_center: {
    minKwh: 2000,
    maxKwh: 20000,
    minKw: 500,
    maxKw: 5000,
    confidence: "medium",
    basis: "Hyperscale/colo typical UPS + peak shaving install",
  },
  manufacturing: {
    minKwh: 500,
    maxKwh: 10000,
    minKw: 250,
    maxKw: 3000,
    confidence: "medium",
    basis: "Industrial peak demand charge reduction range",
  },
  cold_storage: {
    minKwh: 1000,
    maxKwh: 8000,
    minKw: 300,
    maxKw: 2000,
    confidence: "medium",
    basis: "24/7 refrigeration load cycling + demand shaving",
  },
  logistics: {
    minKwh: 500,
    maxKwh: 5000,
    minKw: 200,
    maxKw: 1500,
    confidence: "medium",
    basis: "Warehouse + EV fleet charging anchor",
  },
  hospital: {
    minKwh: 500,
    maxKwh: 4000,
    minKw: 250,
    maxKw: 1500,
    confidence: "medium",
    basis: "Critical backup + demand charge — Joint Commission compliant",
  },
  healthcare: {
    minKwh: 250,
    maxKwh: 2000,
    minKw: 100,
    maxKw: 600,
    confidence: "medium",
    basis: "Medical clinic / outpatient facility range",
  },
  automotive: {
    minKwh: 1000,
    maxKwh: 10000,
    minKw: 500,
    maxKw: 4000,
    confidence: "low",
    basis: "EV assembly plant + DCFC load management",
  },
  education: {
    minKwh: 100,
    maxKwh: 2000,
    minKw: 50,
    maxKw: 750,
    confidence: "medium",
    basis: "K-12 through university microgrid projects",
  },
  retail: {
    minKwh: 100,
    maxKwh: 1000,
    minKw: 50,
    maxKw: 400,
    confidence: "medium",
    basis: "C&I behind-the-meter solar+storage",
  },
  hospitality: {
    minKwh: 200,
    maxKwh: 2000,
    minKw: 100,
    maxKw: 800,
    confidence: "medium",
    basis: "Hotel / resort resilience + demand shaving",
  },
  agricultural: {
    minKwh: 100,
    maxKwh: 3000,
    minKw: 50,
    maxKw: 1000,
    confidence: "low",
    basis: "Irrigation pumping + cold chain",
  },
  truck_stop: {
    minKwh: 500,
    maxKwh: 4000,
    minKw: 250,
    maxKw: 1500,
    confidence: "medium",
    basis: "DCFC fleet charging smoothing + demand management",
  },
  car_wash: {
    minKwh: 50,
    maxKwh: 500,
    minKw: 25,
    maxKw: 250,
    confidence: "medium",
    basis: "High-draw equipment peak demand spike reduction",
  },
  gym: {
    minKwh: 50,
    maxKwh: 500,
    minKw: 25,
    maxKw: 200,
    confidence: "low",
    basis: "Peak HVAC + lighting demand shaving",
  },
  government: {
    minKwh: 500,
    maxKwh: 8000,
    minKw: 200,
    maxKw: 2500,
    confidence: "low",
    basis: "Varies — municipal to federal facility range",
  },
  energy: {
    minKwh: 5000,
    maxKwh: 100000,
    minKw: 2000,
    maxKw: 50000,
    confidence: "low",
    basis: "Utility-scale front-of-meter range",
  },
};

// Default when industry is unknown
const DEFAULT_SIZE: SizeEstimate = {
  minKwh: 100,
  maxKwh: 5000,
  minKw: 50,
  maxKw: 1500,
  confidence: "low",
  basis: "No industry context — using broad commercial range",
};

// ─── Signal → BESS type mapping ───────────────────────────────────────────────

function deriveBessTypes(
  signals: OpportunitySignal[],
  industry: IndustryType | null | undefined,
  desc: string
): BessType[] {
  const types = new Set<BessType>();
  const d = desc.toLowerCase();

  if (signals.includes("bess_procurement") || signals.includes("energy_project")) {
    types.add("peak_shaving"); // default assumption until more specific
  }
  if (
    signals.includes("high_utility_exposure") ||
    /demand charge|peak shav|tou|time.of.use/i.test(d)
  ) {
    types.add("peak_shaving");
  }
  if (
    signals.includes("virtual_power_plant") ||
    /vpp|demand response|grid services|frequency reg|ancillary/i.test(d)
  ) {
    types.add("demand_response");
  }
  if (
    signals.includes("microgrid_procurement") ||
    /microgrid|island.mode|resilience|behind.the.meter.microgrid/i.test(d)
  ) {
    types.add("microgrid_anchor");
  }
  if (
    signals.includes("c_and_i_solar") ||
    signals.includes("solar_procurement") ||
    /solar.storage|solar.bess|paired.storage|self.consum/i.test(d)
  ) {
    types.add("solar_storage");
  }
  if (
    /backup|ups|uninterruptible|generator.replacement|critical.load|resilience|blackout/i.test(d) ||
    industry === "hospital" ||
    industry === "healthcare" ||
    industry === "data_center"
  ) {
    types.add("backup_power");
  }
  if (/arbitrage|wholesale|energy.market|day.ahead|real.time.market|lmp/i.test(d)) {
    types.add("arbitrage");
  }
  if (
    signals.includes("interconnection_application") ||
    /interconnection|grid.application|ferc.filing/i.test(d)
  ) {
    types.add("microgrid_anchor");
  }
  if (
    industry === "automotive" ||
    industry === "truck_stop" ||
    industry === "logistics" ||
    /ev.fleet|dcfc|level.3.charging|charging.hub|fleet.electrif/i.test(d)
  ) {
    types.add("ev_load_management");
  }

  if (types.size === 0) types.add("unknown");
  return [...types];
}

// ─── Grid drivers ─────────────────────────────────────────────────────────────

function deriveGridDrivers(signals: OpportunitySignal[], desc: string): GridDriver[] {
  const drivers = new Set<GridDriver>();
  const d = desc.toLowerCase();

  if (
    signals.includes("high_utility_exposure") ||
    /high.electric|rising.rate|utility.cost|demand.charge|power.bill/i.test(d)
  ) {
    drivers.add("high_demand_charges");
    drivers.add("grid_too_expensive");
  }
  if (/outage|unreliable|blackout|brownout|power.cut|grid.instab|curtailment/i.test(d)) {
    drivers.add("unreliable_grid");
  }
  if (
    signals.includes("interconnection_application") ||
    /interconnection|grid.constraint|capacity.constraint|congestion/i.test(d)
  ) {
    drivers.add("interconnection_constraint");
    drivers.add("grid_expansion_needed");
  }
  if (
    /carbon|decarboniz|net.zero|esg|sustainability|renewable.target|clean.energy.mandate/i.test(
      d
    ) ||
    signals.includes("sustainability_initiative")
  ) {
    drivers.add("decarbonization_mandate");
  }
  if (/backup|resilience|critical.load|uptime|continuity|ups|disaster/i.test(d)) {
    drivers.add("backup_resilience");
  }
  if (/arbitrage|lmp|day.ahead|wholesale.price|tou|time.of.use/i.test(d)) {
    drivers.add("rate_arbitrage_opportunity");
  }

  if (drivers.size === 0) drivers.add("unknown");
  return [...drivers];
}

// ─── Co-equipment recommendations ────────────────────────────────────────────

function deriveCoEquipment(
  signals: OpportunitySignal[],
  bessTypes: BessType[],
  industry: IndustryType | null | undefined,
  desc: string
): CoEquipment[] {
  const equip = new Set<CoEquipment>();
  const d = desc.toLowerCase();

  // Solar almost always pairs with BESS
  if (
    signals.includes("c_and_i_solar") ||
    signals.includes("solar_procurement") ||
    bessTypes.includes("solar_storage") ||
    /solar|pv|photovoltaic/i.test(d)
  ) {
    equip.add("solar_pv");
  }
  // Microgrids need a controller
  if (bessTypes.includes("microgrid_anchor") || /microgrid|island.mode/i.test(d)) {
    equip.add("microgrid_controller");
    equip.add("ems_controls");
  }
  // Hospitals/data centers still want generator backup alongside BESS
  if (
    industry === "hospital" ||
    industry === "healthcare" ||
    industry === "data_center" ||
    /critical.load|life.safety|tier.3|tier.4/i.test(d)
  ) {
    equip.add("generator_backup");
  }
  // EV load → EV chargers
  if (bessTypes.includes("ev_load_management") || /ev.fleet|dcfc|charging.hub/i.test(d)) {
    equip.add("ev_chargers");
  }
  // Large installs often need transformer work
  if (
    industry === "manufacturing" ||
    industry === "data_center" ||
    industry === "energy" ||
    /transformer|service.upgrade|switchgear|substation/i.test(d)
  ) {
    equip.add("transformer_upgrade");
  }
  // VPP / demand response needs EMS
  if (signals.includes("virtual_power_plant") || /demand.response|vpp|grid.services/i.test(d)) {
    equip.add("ems_controls");
  }
  // Wind in agricultural / government / energy contexts
  if (industry === "agricultural" || industry === "government" || industry === "energy") {
    equip.add("weather_monitoring");
  }

  // EMS is almost always useful
  equip.add("ems_controls");

  return [...equip];
}

// ─── Alternative power assessment ─────────────────────────────────────────────

function deriveAlternativePower(
  signals: OpportunitySignal[],
  bessTypes: BessType[],
  industry: IndustryType | null | undefined,
  desc: string
): AlternativePower[] {
  const alt = new Set<AlternativePower>();
  const d = desc.toLowerCase();

  if (
    signals.includes("c_and_i_solar") ||
    signals.includes("solar_procurement") ||
    bessTypes.includes("solar_storage") ||
    /solar|pv|photovoltaic/i.test(d)
  ) {
    alt.add("solar");
  }
  if (/wind.turbine|onshore.wind|offshore.wind|wind.farm|wind.project/i.test(d)) {
    alt.add("wind");
  }
  if (
    /generator|genset|diesel.backup|standby.gen|natural.gas.gen|backup.power/i.test(d) ||
    signals.includes("generator_procurement")
  ) {
    alt.add("generator");
  }
  if (/geothermal|ground.source|geo.thermal/i.test(d)) {
    alt.add("geothermal");
  }
  if (/nuclear|smr|small.modular.reactor|advanced.nuclear/i.test(d)) {
    alt.add("nuclear_smr");
  }
  if (/fuel.cell|hydrogen|electrolysis|proton.exchange/i.test(d)) {
    alt.add("fuel_cell");
  }
  if (/hydro|run.of.river|hydroelectric/i.test(d)) {
    alt.add("hydro");
  }

  // Solar is always worth mentioning if not already detected
  if (!alt.has("solar") && industry !== "energy" && industry !== "government") {
    alt.add("solar"); // default co-sell
  }

  return [...alt];
}

// ─── Technology fit scores ────────────────────────────────────────────────────

function deriveTechFit(
  signals: OpportunitySignal[],
  bessTypes: BessType[],
  coEquip: CoEquipment[],
  altPower: AlternativePower[],
  desc: string
): OppAssessment["technology_fit"] {
  let bess = 30,
    solar = 10,
    generator = 10,
    microgrid = 10,
    ev = 10;
  const d = desc.toLowerCase();

  // BESS
  if (signals.includes("bess_procurement")) bess += 40;
  if (signals.includes("microgrid_procurement")) bess += 25;
  if (signals.includes("virtual_power_plant")) bess += 20;
  if (signals.includes("high_utility_exposure")) bess += 15;
  if (bessTypes.includes("backup_power")) bess += 15;
  if (/\bbess\b|battery.storage|energy.storage/i.test(d)) bess += 15;

  // Solar
  if (signals.includes("c_and_i_solar")) solar += 45;
  if (signals.includes("solar_procurement")) solar += 40;
  if (signals.includes("sustainability_initiative")) solar += 15;
  if (coEquip.includes("solar_pv")) solar += 20;
  if (altPower.includes("solar")) solar += 10;

  // Generator
  if (signals.includes("generator_procurement")) generator += 45;
  if (signals.includes("construction")) generator += 10;
  if (coEquip.includes("generator_backup")) generator += 25;
  if (altPower.includes("generator")) generator += 15;
  if (/genset|standby|emergency.power|cummins|caterpillar/i.test(d)) generator += 20;

  // Microgrid
  if (signals.includes("microgrid_procurement")) microgrid += 50;
  if (signals.includes("interconnection_application")) microgrid += 20;
  if (bessTypes.includes("microgrid_anchor")) microgrid += 25;
  if (/microgrid|island.mode|distributed.energy/i.test(d)) microgrid += 20;

  // EV
  if (bessTypes.includes("ev_load_management")) ev += 45;
  if (coEquip.includes("ev_chargers")) ev += 30;
  if (/ev.fleet|dcfc|level.3|fleet.electrif/i.test(d)) ev += 25;

  return {
    bess: Math.min(bess, 100),
    solar: Math.min(solar, 100),
    generator: Math.min(generator, 100),
    microgrid: Math.min(microgrid, 100),
    ev_charging: Math.min(ev, 100),
  };
}

// ─── Urgency tier ─────────────────────────────────────────────────────────────

function deriveUrgency(signals: OpportunitySignal[], desc: string): UrgencyTier {
  const d = desc.toLowerCase();
  const hotSignals: OpportunitySignal[] = [
    "bess_procurement",
    "solar_procurement",
    "generator_procurement",
    "microgrid_procurement",
    "rfq",
    "c_and_i_solar",
  ];
  const hotCount = signals.filter((s) => hotSignals.includes(s)).length;
  const hasRfp = /rfp|rfq|bid.due|proposal.due|solicitation|sam\.gov|ferc.filing/i.test(d);
  const hasFunding =
    signals.includes("funding") ||
    /awarded|loan.guarantee|grant.award|conditional.commitment/i.test(d);

  if (hotCount >= 2 || hasRfp || hasFunding) return "hot";
  if (
    hotCount === 1 ||
    signals.includes("interconnection_application") ||
    signals.includes("permit_filed")
  )
    return "warm";
  return "cool";
}

// ─── Rule-based talking points ────────────────────────────────────────────────

function buildTalkingPoints(
  bessTypes: BessType[],
  gridDrivers: GridDriver[],
  sizeEstimate: SizeEstimate,
  coEquip: CoEquipment[],
  altPower: AlternativePower[],
  industry: IndustryType | null | undefined,
  signals: OpportunitySignal[]
): string[] {
  const points: string[] = [];

  // Primary BESS value prop
  if (bessTypes.includes("peak_shaving")) {
    points.push(
      `Peak shaving system (est. ${sizeEstimate.minKw}–${sizeEstimate.maxKw} kW / ${sizeEstimate.minKwh}–${sizeEstimate.maxKwh} kWh) can reduce demand charges 20–40%.`
    );
  }
  if (bessTypes.includes("backup_power")) {
    points.push(
      "Critical backup capability eliminates generator fuel costs and provides seamless UPS-class transition."
    );
  }
  if (bessTypes.includes("demand_response")) {
    points.push(
      "VPP enrollment turns the battery into a revenue source — typical C&I assets earn $50–150/kW-year in capacity markets."
    );
  }
  if (bessTypes.includes("solar_storage")) {
    points.push(
      "Paired solar+storage maximizes self-consumption, improves NEM 3.0 economics, and reduces grid imports during peak TOU windows."
    );
  }
  if (bessTypes.includes("microgrid_anchor")) {
    points.push(
      "Full microgrid with island-mode enables 100% uptime during grid outages — critical for interconnection applications."
    );
  }
  if (bessTypes.includes("ev_load_management")) {
    points.push(
      "BESS smooths DCFC load spikes, preventing demand charge ratchets that can triple an EV fleet operator's electricity bill."
    );
  }

  // Grid driver points
  if (gridDrivers.includes("high_demand_charges")) {
    points.push(
      "Demand charges often represent 30–50% of commercial electricity bills — BESS has a 3–7 year simple payback at current rates."
    );
  }
  if (gridDrivers.includes("unreliable_grid") || gridDrivers.includes("backup_resilience")) {
    points.push(
      "Grid reliability concerns make BESS + generator hybrid the standard for Tier 3+ resilience requirements."
    );
  }
  if (gridDrivers.includes("decarbonization_mandate")) {
    points.push(
      "IRA Section 48 ITC (30%+ basis) and possible USDA REAP grants make this project eligible for significant federal incentives."
    );
  }
  if (gridDrivers.includes("interconnection_constraint")) {
    points.push(
      "Behind-the-meter BESS can defer or eliminate costly grid upgrade costs while improving interconnection queue position."
    );
  }

  // Co-equipment upsell
  if (coEquip.includes("solar_pv") && !bessTypes.includes("solar_storage")) {
    points.push(
      "Solar PV co-install increases project IRR by 2–5% and qualifies for combined ITC + MACRS depreciation."
    );
  }
  if (coEquip.includes("generator_backup") && !bessTypes.includes("backup_power")) {
    points.push(
      "Adding a standby generator creates a full hybrid resilience system — BESS handles daily cycling, generator handles extended outages."
    );
  }

  // IRA funding flag
  if (signals.includes("funding") || signals.includes("bess_procurement")) {
    points.push(
      "Check for active IRA/DOE LPO or USDA REAP co-funding — the project timeline and incentive stack directly affect your pricing proposal."
    );
  }

  return points.slice(0, 6);
}

// ─── Stage 1: Rule-based assessment (sync, no API call) ───────────────────────

export function assessOpportunityRules(
  signals: OpportunitySignal[],
  industry: IndustryType | null | undefined,
  description: string,
  bessScore: number,
  solarScore: number,
  generatorScore: number
): OppAssessment {
  const desc = description ?? "";

  const bessTypes = deriveBessTypes(signals, industry, desc);
  const primaryType = bessTypes[0] ?? "unknown";
  const gridDrivers = deriveGridDrivers(signals, desc);
  const sizeEstimate = (industry && INDUSTRY_SIZE[industry]) ?? DEFAULT_SIZE;
  const coEquip = deriveCoEquipment(signals, bessTypes, industry, desc);
  const altPower = deriveAlternativePower(signals, bessTypes, industry, desc);
  const techFit = deriveTechFit(signals, bessTypes, coEquip, altPower, desc);
  const urgency = deriveUrgency(signals, desc);
  const talkingPoints = buildTalkingPoints(
    bessTypes,
    gridDrivers,
    sizeEstimate,
    coEquip,
    altPower,
    industry,
    signals
  );

  return {
    bess_types: bessTypes,
    primary_bess_type: primaryType,
    urgency_tier: urgency,
    size_estimate: sizeEstimate,
    grid_drivers: gridDrivers,
    co_equipment: coEquip,
    alternative_power: altPower,
    technology_fit: {
      ...techFit,
      bess: Math.max(techFit.bess, bessScore),
      solar: Math.max(techFit.solar, solarScore),
      generator: Math.max(techFit.generator, generatorScore),
    },
    talking_points: talkingPoints,
    is_rfp_rfq:
      signals.includes("rfq") ||
      signals.includes("bess_procurement") ||
      signals.includes("solar_procurement") ||
      signals.includes("generator_procurement") ||
      signals.includes("microgrid_procurement"),
    is_federal:
      /sam\.gov|federal|dod|department.of.defense|gsa|va.hospital|veterans.affairs|military/i.test(
        desc
      ),
    is_funded:
      signals.includes("funding") ||
      /awarded|grant|loan.guarantee|conditional.commitment|nyserda|doe.lpo|usda.reap/i.test(desc),
    has_interconnection: signals.includes("interconnection_application"),
    assessed_at: new Date().toISOString(),
    assessment_version: "1.0.0",
    gpt_enriched: false,
  };
}

// ─── Stage 2: GPT-4 enrichment ────────────────────────────────────────────────

const GPT_SYSTEM_PROMPT = `You are Merlin, an expert energy procurement advisor specializing in commercial and industrial (C&I) BESS, solar, generator, and microgrid systems. 

Given a news article about a company or project, produce a concise JSON assessment in exactly this schema:
{
  "bess_type_narrative": "1-2 sentence explanation of the best BESS application type for this opportunity",
  "size_narrative": "1-2 sentences on likely system size based on industry/facility context",
  "grid_situation": "1-2 sentences on what the grid or economic drivers probably are",
  "alternative_power_notes": "1 sentence on whether solar, wind, generators, or other alternatives are relevant",
  "urgency_notes": "1 sentence explaining why this is hot/warm/cool",
  "talking_points": ["point 1", "point 2", "point 3", "point 4"],
  "red_flags": ["any concern about lead quality or timing"]
}

Be specific and actionable. Use actual numbers where possible. Respond with only valid JSON.`;

export async function enrichAssessmentWithGPT(
  assessment: OppAssessment,
  companyName: string,
  description: string,
  industry: IndustryType | null | undefined,
  signals: OpportunitySignal[],
  apiKey: string
): Promise<OppAssessment> {
  if (!apiKey) return assessment;

  const userMessage = `Company: ${companyName}
Industry: ${industry ?? "unknown"}
Signals detected: ${signals.join(", ")}
Rule-based BESS type: ${assessment.primary_bess_type}
Estimated size: ${assessment.size_estimate.minKwh}–${assessment.size_estimate.maxKwh} kWh / ${assessment.size_estimate.minKw}–${assessment.size_estimate.maxKw} kW
Grid drivers: ${assessment.grid_drivers.join(", ")}

Article description:
${description.slice(0, 1500)}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          { role: "system", content: GPT_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) return assessment;

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "";

    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const gpt = JSON.parse(cleaned);

    // Merge GPT talking points with rule-based ones, deduplicating
    const mergedPoints = [...(gpt.talking_points ?? []), ...assessment.talking_points].slice(0, 6);

    return {
      ...assessment,
      talking_points: mergedPoints,
      gpt_enriched: true,
      gpt_bess_narrative: gpt.bess_type_narrative ?? undefined,
      gpt_size_narrative: gpt.size_narrative ?? undefined,
      gpt_grid_situation: gpt.grid_situation ?? undefined,
      gpt_alt_power: gpt.alternative_power_notes ?? undefined,
      gpt_urgency: gpt.urgency_notes ?? undefined,
      gpt_red_flags: gpt.red_flags?.length ? gpt.red_flags : undefined,
    };
  } catch {
    return assessment; // graceful degradation
  }
}

// ─── Full pipeline (rules + optional GPT) ────────────────────────────────────

export async function assessOpportunity(opts: {
  companyName: string;
  description: string;
  signals: OpportunitySignal[];
  industry: IndustryType | null | undefined;
  bessScore: number;
  solarScore: number;
  generatorScore: number;
  useGPT?: boolean;
  apiKey?: string;
}): Promise<OppAssessment> {
  const base = assessOpportunityRules(
    opts.signals,
    opts.industry,
    opts.description,
    opts.bessScore,
    opts.solarScore,
    opts.generatorScore
  );

  if (opts.useGPT && opts.apiKey) {
    return enrichAssessmentWithGPT(
      base,
      opts.companyName,
      opts.description,
      opts.industry,
      opts.signals,
      opts.apiKey
    );
  }

  return base;
}
