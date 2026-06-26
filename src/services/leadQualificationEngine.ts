/**
 * ============================================================================
 * LEAD QUALIFICATION ENGINE — Phase 5
 * ============================================================================
 * Answers: "Is this really a lead, and why?"
 *
 * Evaluates five dimensions independently, then combines them:
 *
 *   BUYER    (0–25)  Is there an identifiable buyer entity, not just a vendor?
 *   ACTION   (0–35)  Is there a procurement action (RFP/RFQ/soliciting/seeking)?
 *   EQUIPMENT(0–20)  Is relevant equipment mentioned (BESS/solar/generator)?
 *   TIMING   (0–10)  Is this forward-looking, not already completed?
 *   SCALE    (0–10)  Is the project commercial/industrial scale?
 *
 * Total max = 100.
 *
 * Tier thresholds:
 *   hot  ≥ 60 AND action ≥ 20   → route to vendors immediately
 *   warm ≥ 40 AND equipment ≥ 5 → route with lower confidence boost
 *   cold ≥ 20                   → store, don't route as lead
 *   junk < 20                   → discard
 *
 * "Reverse logic" layer:
 *   - OEM product launches → penalise buyer score
 *   - Past-tense completion → penalise timing score
 *   - Residential signals → hard disqualify
 *   - Vendor-only announcements → hard disqualify
 * ============================================================================
 */

import {
  checkDisqualifiers,
  detectTemporalScore,
  proximityMatch,
  normalizeText,
} from "../utils/leadNLP";
import type { OpportunitySignal } from "../types/opportunity";

// ─── Public types ─────────────────────────────────────────────────────────────

export type LeadTier = "hot" | "warm" | "cold" | "junk";

export interface QualificationResult {
  isLead: boolean;
  tier: LeadTier;
  score: number; // 0–100
  dimensions: {
    buyer: number; // 0–25
    action: number; // 0–35
    equipment: number; // 0–20
    timing: number; // 0–10
    scale: number; // 0–10
  };
  reasons: string[]; // positive evidence found
  disqualifiers: string[]; // negative evidence / flags
}

// ─── Action patterns ──────────────────────────────────────────────────────────

// Strong = active open procurement right now
const STRONG_ACTION: RegExp[] = [
  /\b(issues?|issued|releasing?|released|publishing?|published|opens?|posted?)\s+(an?\s+)?(rfp|rfq|solicitation|request\s+for\s+(proposal|quotation|quote))\b/i,
  /\b(seeks?|seeking|soliciting|solicits?)\s+(bids?|proposals?|quotations?|contractors?|suppliers?)\b/i,
  /\b(invites?|inviting)\s+(bids?|proposals?|quotations?|suppliers?)\b/i,
  /\brequest\s+for\s+(proposal|quotation|quote)s?\b/i,
  /\b(rfp|rfq)\s+(released?|issued?|published?|open|posted|available|live)\b/i,
  /\b(procure|procurement\s+of|procuring)\s+(battery|solar|energy\s*storage|bess|generator|microgrid|backup\s*power)\b/i,
  /\b(battery|solar|energy\s*storage|bess|generator|microgrid)\s+(procurement|rfp|rfq|solicitation|tender)\b/i,
  /\bresponses?\s+due\b/i,
  /\bsubmission\s+(deadline|due\s+date)\b/i,
  /\bbid\s+(deadline|due|opening|date)\b/i,
  /\bcompetitive\s+(bid|procurement|tender)\b/i,
  /\btender\s+(for|to)\s+(supply|provide|install|deploy)\b/i,
  /\binvitation\s+to\s+bid\b/i,
  /\bpre-qualification\s+(for|process)\b/i,
  /\bqualification\s+(of\s+)?bidders?\b/i,
  /\bshortlist(ing|ed)?\s+(vendors?|contractors?|suppliers?)\b/i,
];

// Weak = likely leads but not open procurement yet
const WEAK_ACTION: RegExp[] = [
  /\bwill\s+(procure|install|deploy|build|implement|purchase|acquire)\b/i,
  /\bplans?\s+to\s+(procure|install|deploy|build|purchase|acquire)\b/i,
  /\b(approved|approves)\s+(funding|budget|grant|project)\b/i,
  /\b(signs?|signed)\s+(ppa|power\s+purchase\s+agreement|energy\s+contract)\b/i,
  /\bawarded?\s+(contract|grant|project)\s+(to|for)\b/i,
  /\b(selects?|selected|choosing|chose)\s+(contractor|vendor|supplier|integrator|installer)\b/i,
  /\bhas?\s+(funded|approved|budgeted)\s+(the\s+)?(project|installation|procurement)\b/i,
  /\bmoving\s+(forward|ahead)\s+with\s+(installation|deployment|procurement)\b/i,
  /\bcompleting\s+final\s+(negotiations?|contracting)\b/i,
];

// ─── Buyer role patterns ──────────────────────────────────────────────────────

const BUYER_ROLE_PATTERNS: RegExp[] = [
  /\b(utility|electric\s+cooperative|co-op|rural\s+electric|municipal\s+utility|public\s+utility)\b/i,
  /\b(municipality|county|city\s+of|town\s+of|state\s+of|department\s+of|agency|authority|district)\b/i,
  /\b(school\s+district|university|college|campus|health\s+system|hospital|manufacturer|developer|owner|landlord)\b/i,
  /\b(seeking|soliciting|inviting)\s+(bids?|proposals?)\b/i,
  /\bprocurement\s+(office|team|department|division)\b/i,
  /\b(facility\s+manager|energy\s+manager|sustainability\s+manager|cfo|ceo)\s+(announces?|says?)\b/i,
];

// OEM / vendor-only articles (seller, not buyer — negative signal)
const OEM_VENDOR_PATTERNS: RegExp[] = [
  /\b(tesla|fluence|stem\s+inc|sungrow|catl|lg\s+energy|samsung\s+sdi|panasonic|enphase|solaredge|fronius)\s+(announces?|launches?|introduces?|unveils?|releases?)\b/i,
  /\b(cummins|caterpillar|generac|aggreko|atlas\s+copco)\s+(announces?|launches?|introduces?)\b/i,
  /\bnew\s+(product|model|version|generation|offering|platform)\s+(launch|announcement|release|debut)\b/i,
  /\b(flagship|next-gen|next\s+generation)\s+product\s+(announcement|launch|release)\b/i,
  /\bcompany\s+(reports?|posts?)\s+(record|strong|weak)\s+(revenue|earnings|profit)\b/i,
];

// ─── Equipment detectors ──────────────────────────────────────────────────────

interface EquipmentDetector {
  pattern: RegExp;
  name: string;
  weight: number;
}

const EQUIPMENT_DETECTORS: EquipmentDetector[] = [
  { pattern: /battery\s*storage|energy\s*storage\s*system|\bbess\b/i, name: "BESS", weight: 8 },
  {
    pattern: /grid.?scale\s*battery|utility.?scale\s*battery|megapack|powerpack\s*commercial/i,
    name: "grid-scale BESS",
    weight: 8,
  },
  {
    pattern: /peak\s*shav|demand\s*charge\s*reduc|behind.the.meter\s*stor/i,
    name: "behind-meter BESS",
    weight: 7,
  },
  { pattern: /\bsolar\b|photovoltaic|\bpv\b/i, name: "solar", weight: 4 },
  {
    pattern: /solar\s*(farm|array|project|installation|plant|system)/i,
    name: "solar project",
    weight: 7,
  },
  {
    pattern: /\bgenerator\b|genset|standby\s*power|backup\s*power|emergency\s*power/i,
    name: "generator/backup",
    weight: 5,
  },
  { pattern: /\bmicrogrid\b|micro.grid/i, name: "microgrid", weight: 6 },
  { pattern: /virtual\s*power\s*plant|\bvpp\b/i, name: "VPP", weight: 6 },
  {
    pattern: /demand\s*response|grid\s*service|ancillary\s*service/i,
    name: "DR/grid services",
    weight: 4,
  },
  { pattern: /\bphotovoltaic\b|rooftop\s*solar\s*commercial/i, name: "commercial PV", weight: 6 },
];

// ─── Scale detectors ──────────────────────────────────────────────────────────

const UTILITY_SCALE_PATTERN = /\b(\d+\.?\d*)\s*(mw|mwh|gw|gwh|megawatt|gigawatt)\b/i;
const LARGE_KW_PATTERN = /\b([5-9]\d{2,}|[1-9]\d{3,})\s*kw(h)?\b/i; // ≥500 kW
const SMALL_KW_PATTERN = /\b([1-9]|[1-4][0-9])\s*kw\b/i; // <50 kW

// ─── Main qualifier ───────────────────────────────────────────────────────────

export function qualifyLead(
  title: string,
  description: string,
  signals: OpportunitySignal[]
): QualificationResult {
  const fullText = `${title} ${description}`;
  const normText = normalizeText(fullText);

  const result: QualificationResult = {
    isLead: false,
    tier: "junk",
    score: 0,
    dimensions: { buyer: 0, action: 0, equipment: 0, timing: 0, scale: 0 },
    reasons: [],
    disqualifiers: [],
  };

  // ── Hard disqualifiers ──
  const { disqualified, reason } = checkDisqualifiers(fullText);
  if (disqualified) {
    result.disqualifiers.push(reason!);
    return result;
  }

  // ── DIMENSION 1: BUYER (0–25) ──
  let buyer = 0;

  // Procurement signals in DB = buyer strongly implied
  const hasEquipmentProcurementSignal =
    signals.includes("bess_procurement") ||
    signals.includes("solar_procurement") ||
    signals.includes("generator_procurement") ||
    signals.includes("rfq") ||
    signals.includes("microgrid_procurement") ||
    signals.includes("interconnection_application");

  if (hasEquipmentProcurementSignal) {
    buyer += 15;
    result.reasons.push("procurement signal present");
  }

  let buyerRoleFound = false;
  for (const pattern of BUYER_ROLE_PATTERNS) {
    if (pattern.test(fullText)) {
      buyerRoleFound = true;
      break;
    }
  }
  if (buyerRoleFound) {
    buyer += 8;
    result.reasons.push("buyer entity detected");
  }

  // Penalise OEM/vendor announcements
  for (const pattern of OEM_VENDOR_PATTERNS) {
    if (pattern.test(fullText)) {
      buyer -= 12;
      result.disqualifiers.push("OEM vendor announcement (not buyer)");
      break;
    }
  }

  result.dimensions.buyer = Math.max(0, Math.min(25, buyer));

  // ── DIMENSION 2: ACTION (0–35) ──
  let action = 0;

  let strongActionFound = false;
  for (const pattern of STRONG_ACTION) {
    if (pattern.test(fullText)) {
      strongActionFound = true;
      action += 28;
      result.reasons.push("strong procurement action detected");
      break;
    }
  }

  if (!strongActionFound) {
    for (const pattern of WEAK_ACTION) {
      if (pattern.test(fullText)) {
        action += 12;
        result.reasons.push("weak procurement action (future intent)");
        break;
      }
    }
  }

  // Proximity bonus: equipment AND procurement term within 250 chars → confirms co-occurrence
  const proximityPairs: Array<[string, string]> = [
    ["battery storage", "rfp"],
    ["battery storage", "procure"],
    ["battery storage", "solicit"],
    ["energy storage", "rfp"],
    ["energy storage", "solicit"],
    ["bess", "rfp"],
    ["solar", "rfp"],
    ["solar", "procurement"],
    ["solar", "solicit"],
    ["generator", "rfp"],
    ["microgrid", "rfp"],
    ["microgrid", "procure"],
  ];

  for (const [a, b] of proximityPairs) {
    if (proximityMatch(normText, a, b, 250)) {
      action = Math.min(35, action + 7);
      result.reasons.push(`${a} + ${b} proximity match`);
      break; // one bonus is enough
    }
  }

  result.dimensions.action = Math.min(35, action);

  // ── DIMENSION 3: EQUIPMENT (0–20) ──
  let equipment = 0;
  for (const { pattern, name, weight } of EQUIPMENT_DETECTORS) {
    if (pattern.test(fullText)) {
      equipment = Math.min(20, equipment + weight);
      result.reasons.push(`${name} mentioned`);
    }
  }
  result.dimensions.equipment = equipment;

  // ── DIMENSION 4: TIMING (0–10) ──
  const temporal = detectTemporalScore(fullText);
  result.dimensions.timing = Math.round(temporal * 10);

  if (temporal >= 1.0) result.reasons.push("active/open procurement");
  else if (temporal <= 0.4) result.disqualifiers.push("appears to be completed project");

  // ── DIMENSION 5: SCALE (0–10) ──
  if (UTILITY_SCALE_PATTERN.test(fullText)) {
    result.dimensions.scale = 10;
    result.reasons.push("utility/commercial scale (MW/MWh)");
  } else if (LARGE_KW_PATTERN.test(fullText)) {
    result.dimensions.scale = 7;
    result.reasons.push("large commercial scale (≥500kW)");
  } else if (SMALL_KW_PATTERN.test(fullText)) {
    result.dimensions.scale = 0;
    result.disqualifiers.push("appears residential/small scale (<50kW)");
  } else {
    result.dimensions.scale = 4; // scale unknown — neutral
  }

  // ── Final score ──
  result.score =
    result.dimensions.buyer +
    result.dimensions.action +
    result.dimensions.equipment +
    result.dimensions.timing +
    result.dimensions.scale;

  // Tier with action gate (must have some procurement action to be hot/warm)
  if (result.score >= 60 && result.dimensions.action >= 20) {
    result.tier = "hot";
    result.isLead = true;
  } else if (result.score >= 38 && result.dimensions.equipment >= 4) {
    result.tier = "warm";
    result.isLead = true;
  } else if (result.score >= 20) {
    result.tier = "cold";
    result.isLead = false;
  } else {
    result.tier = "junk";
    result.isLead = false;
  }

  return result;
}
