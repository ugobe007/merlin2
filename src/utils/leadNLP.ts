/**
 * ============================================================================
 * LEAD NLP ENGINE — Phase 5
 * ============================================================================
 * Lightweight, zero-dependency NLP for energy procurement text analysis.
 * Works in both browser (DOMParser context) and Node.js (tsx agents).
 *
 * Capabilities:
 *   - Stem/normalize common procurement + energy verb inflections
 *   - Synonym group expansion (BESS = battery storage = ESS = …)
 *   - Proximity matching (two terms within N chars → co-occurrence signal)
 *   - Negation detection (lookback window on token stream)
 *   - Temporal scoring (forward-looking vs. already-completed)
 *   - Hard disqualifiers (residential, financial news, lawsuit, etc.)
 *   - Jaccard similarity + article fingerprint for cross-source deduplication
 * ============================================================================
 */

// ─── Stem map ─────────────────────────────────────────────────────────────────
// Inflected form → base form.  Applied token-by-token during normalizeText().
export const STEM_MAP: Record<string, string> = {
  // Procurement verbs
  procurement: "procure",
  procurements: "procure",
  procures: "procure",
  procuring: "procure",
  procured: "procure",
  solicitation: "solicit",
  solicitations: "solicit",
  soliciting: "solicit",
  solicited: "solicit",
  solicits: "solicit",
  bidding: "bid",
  bids: "bid",
  bidder: "bid",
  bidders: "bid",
  awarding: "award",
  awards: "award",
  awarded: "award",
  contracting: "contract",
  contracts: "contract",
  contracted: "contract",
  installation: "install",
  installations: "install",
  installing: "install",
  installed: "install",
  installs: "install",
  deployment: "deploy",
  deployments: "deploy",
  deploying: "deploy",
  deployed: "deploy",
  deploys: "deploy",
  seeking: "seek",
  sought: "seek",
  seeks: "seek",
  requesting: "request",
  requests: "request",
  requested: "request",
  issuing: "issue",
  issued: "issue",
  issues: "issue",
  releasing: "release",
  releases: "release",
  released: "release",
  announcing: "announce",
  announces: "announce",
  announced: "announce",
  announcement: "announce",
  announcements: "announce",
  building: "build",
  builds: "build",
  built: "build",
  constructing: "construct",
  constructs: "construct",
  constructed: "construct",
  expanding: "expand",
  expansions: "expand",
  expands: "expand",
  expanded: "expand",
  funding: "fund",
  funds: "fund",
  funded: "fund",
  acquiring: "acquire",
  acquisitions: "acquire",
  acquires: "acquire",
  acquired: "acquire",
  proposals: "proposal",
  proposing: "propose",
  proposes: "propose",
  proposed: "propose",
  selecting: "select",
  selects: "select",
  selected: "select",
  purchasing: "purchase",
  purchases: "purchase",
  purchased: "purchase",
  inviting: "invite",
  invites: "invite",
  invited: "invite",
  allocating: "allocate",
  allocates: "allocate",
  allocated: "allocate",
  // Energy / equipment terms
  batteries: "battery",
  generators: "generator",
  gensets: "genset",
  microgrids: "microgrid",
  facilities: "facility",
  utilities: "utility",
  photovoltaics: "photovoltaic",
  installations_energy: "installation",
};

// ─── Synonym groups ───────────────────────────────────────────────────────────
// First term = canonical.  Any term in the group matches any other.
export const SYNONYM_GROUPS: readonly string[][] = [
  // BESS / energy storage
  [
    "battery storage",
    "bess",
    "energy storage system",
    "battery energy storage",
    "grid storage",
    "electrochemical storage",
    "li-ion storage",
    "lithium storage",
    "lithium battery system",
    "battery bank",
    "grid-scale battery",
    "utility-scale battery",
  ],
  // Specific BESS products / size signals
  ["megapack", "megapacks", "tesla megapack"],
  ["powerpack", "powerwall commercial", "tesla powerpack"],
  // Solar
  [
    "solar pv",
    "photovoltaic",
    "pv system",
    "solar panels",
    "solar array",
    "solar modules",
    "solar farm",
    "solar project",
    "solar installation",
  ],
  [
    "c&i solar",
    "commercial solar",
    "industrial solar",
    "behind-the-meter solar",
    "behind the meter solar",
    "btm solar",
    "on-site solar",
    "onsite solar",
    "corporate solar",
    "rooftop solar commercial",
  ],
  // Procurement actions
  ["rfp", "request for proposal", "request for proposals", "call for proposals", "cfp"],
  [
    "rfq",
    "request for quote",
    "request for quotation",
    "request for quotes",
    "invitation to bid",
    "itb",
    "invitation for bid",
  ],
  ["procurement", "competitive bid", "competitive procurement", "sourcing process"],
  // Generator / backup power
  [
    "standby generator",
    "backup generator",
    "emergency generator",
    "standby genset",
    "diesel generator",
  ],
  [
    "backup power",
    "standby power",
    "emergency power",
    "critical power",
    "uninterruptible power supply",
    "ups system",
  ],
  // Microgrid
  ["microgrid", "micro-grid", "distributed energy resource system", "der system"],
  // VPP / demand response
  ["virtual power plant", "vpp", "aggregated storage", "battery aggregation"],
  [
    "demand response",
    "demand flexibility",
    "load flexibility",
    "flex demand",
    "demand curtailment",
    "demand management",
  ],
  // PPA
  ["power purchase agreement", "ppa", "energy offtake agreement", "clean energy ppa"],
];

// Fast lookup: any variant → canonical
const _synonymLookup = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const canonical = group[0];
  for (const term of group) _synonymLookup.set(term.toLowerCase(), canonical);
}

// ─── normalizeText ────────────────────────────────────────────────────────────

/**
 * Normalize a text string for signal detection:
 *   1. Lowercase
 *   2. Expand hyphenated compounds ("battery-storage" → "battery storage")
 *   3. Apply STEM_MAP token-by-token
 *   4. Collapse whitespace
 *
 * The result can be used directly in indexOf() for fast keyword matching.
 */
export function normalizeText(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[''`]/g, "'")
      .replace(/[–—]/g, " ")
      // Expand hyphenated compounds before tokenizing
      .replace(/(\w{2,})-(\w{2,})/g, (_, a, b) => `${a} ${b}`)
      // Tokenize, stem, rejoin
      .split(/\s+/)
      .map((token) => {
        const clean = token.replace(/[^a-z0-9&]/g, "");
        return STEM_MAP[clean] ?? clean;
      })
      .filter(Boolean)
      .join(" ")
      .trim()
  );
}

// ─── Synonym-aware term finder ────────────────────────────────────────────────

/**
 * Find term (or any synonym) in normalizedText.
 * Returns first match position, or -1 if absent.
 */
export function findTerm(normalizedText: string, term: string): number {
  const normTerm = normalizeText(term);

  // Direct match first (fastest)
  const direct = normalizedText.indexOf(normTerm);
  if (direct >= 0) return direct;

  // Synonym expansion
  const canonical = _synonymLookup.get(term.toLowerCase()) ?? _synonymLookup.get(normTerm);
  if (!canonical) return -1;

  for (const group of SYNONYM_GROUPS) {
    if (group[0] !== canonical && !group.includes(term.toLowerCase())) continue;
    for (const syn of group) {
      const idx = normalizedText.indexOf(normalizeText(syn));
      if (idx >= 0) return idx;
    }
  }
  return -1;
}

// ─── Proximity matching ───────────────────────────────────────────────────────

/**
 * Returns true if termA and termB (or any synonym of each) appear within
 * `windowChars` characters of each other in the normalized text.
 *
 * Use this to require co-occurrence ("battery storage" near "rfp"), which
 * prevents false positives from articles that mention BESS in one section
 * and an unrelated RFP in another.
 */
export function proximityMatch(
  normalizedText: string,
  termA: string,
  termB: string,
  windowChars = 300
): boolean {
  const posA = findTerm(normalizedText, termA);
  if (posA < 0) return false;
  const posB = findTerm(normalizedText, termB);
  if (posB < 0) return false;
  return Math.abs(posA - posB) <= windowChars;
}

// ─── Negation detection ───────────────────────────────────────────────────────

const NEGATION_TOKENS = new Set([
  "not",
  "no",
  "never",
  "without",
  "non",
  "anti",
  "cancel",
  "cancelled",
  "canceled",
  "canceling",
  "cancellation",
  "reject",
  "rejected",
  "rejecting",
  "denied",
  "deny",
  "fail",
  "failed",
  "fails",
  "unsuccessful",
  "halt",
  "halted",
  "suspend",
  "suspended",
]);

/**
 * True if the token at `position` in `tokens` is preceded within `window`
 * positions by a negation word.  Call after tokenizing with `normalizeText`.
 */
export function isNegated(tokens: string[], position: number, window = 6): boolean {
  for (let i = Math.max(0, position - window); i < position; i++) {
    if (NEGATION_TOKENS.has(tokens[i])) return true;
  }
  return false;
}

// ─── Temporal scoring ─────────────────────────────────────────────────────────

// Strongly forward-looking → procurement is OPEN or IMMINENT
const FORWARD_PATTERNS: RegExp[] = [
  /\b(is|are)\s+(seeking|soliciting|requesting|inviting)\b/i,
  /\bseeks?\s+(bids?|proposals?|quotations?|contractors?)\b/i,
  /\b(issues?|issued|releasing?|released|publishing?|published|opens?)\s+(an?\s+)?(rfp|rfq|solicitation|request\s+for\s+(proposal|quotation))\b/i,
  /\b(invites?|inviting)\s+(bids?|proposals?|quotations?)\b/i,
  /\bresponses?\s+due\b/i,
  /\bsubmission\s+(deadline|due\s+date)\b/i,
  /\bbid\s+(deadline|due|opening)\b/i,
  /\bwill\s+(procure|install|deploy|build|implement|purchase)\b/i,
  /\bplans?\s+to\s+(procure|install|deploy|build|purchase)\b/i,
  /\bopportunity\s+(closes?|due\s+date|deadline)\b/i,
  /\bdeadline\b.{0,50}\b(2026|2027|2028)\b/i,
  /\b(2026|2027|2028)\b.{0,50}\bdeadline\b/i,
  /\brfp\s+(now\s+)?open\b/i,
  /\bpre-qualification\b/i,
  /\bshortlist(ing|ed)?\b.{0,100}\b(storage|solar|battery|bess)\b/i,
  /\brequesting\s+qualifications?\b/i,
];

// Past completion signals → project is already done
const COMPLETION_PHRASES: string[] = [
  "has been installed",
  "have been installed",
  "was installed",
  "were installed",
  "has been completed",
  "was completed",
  "already installed",
  "previously installed",
  "already completed",
  "has been deployed",
  "was deployed",
  "already deployed",
  "previously deployed",
  "installation is complete",
  "project is complete",
  "project has been completed",
  "has been awarded to",
  "was awarded to",
  "previously awarded",
  "already awarded",
  "winner has been selected",
  "winner was selected",
  "contract went to",
  "selected as the winner",
];

/**
 * Returns a temporal quality score:
 *   1.0 = definitely forward-looking / active procurement
 *   0.8 = neutral / ambiguous
 *   0.6 = one completion signal
 *   0.3 = multiple completion signals → probably already done
 */
export function detectTemporalScore(text: string): number {
  const lower = text.toLowerCase();

  for (const pattern of FORWARD_PATTERNS) {
    if (pattern.test(lower)) return 1.0;
  }

  let completionHits = 0;
  for (const phrase of COMPLETION_PHRASES) {
    if (lower.includes(phrase)) completionHits++;
  }
  if (completionHits >= 2) return 0.3;
  if (completionHits === 1) return 0.6;
  return 0.8;
}

// ─── Hard disqualifiers ───────────────────────────────────────────────────────

interface DisqualifierRule {
  pattern: RegExp;
  reason: string;
}

const DISQUALIFIER_RULES: DisqualifierRule[] = [
  // Residential solar (not commercial)
  { pattern: /\bresidential\s+solar\b/i, reason: "residential-solar" },
  { pattern: /\bhome\s+solar\b/i, reason: "residential-solar" },
  { pattern: /homeowner.{0,40}solar/i, reason: "residential-solar" },
  { pattern: /solar.{0,40}homeowner/i, reason: "residential-solar" },
  { pattern: /\bsolar\s+for\s+(your|my|their)\s+home\b/i, reason: "residential-solar" },
  { pattern: /rooftop.{0,80}(home|house|apartment|condo|townhouse)/i, reason: "residential" },
  // Financial / earnings news
  {
    pattern: /\b(quarterly|annual|q[1-4])\s+(earnings?|results?|revenue|financials?)\b/i,
    reason: "earnings",
  },
  { pattern: /\bstock\s+(price|market|ticker|rally|surge|plunge|drop)\b/i, reason: "stock-news" },
  { pattern: /\b(ipo|initial\s+public\s+offering)\b/i, reason: "financial-news" },
  { pattern: /\b(nasdaq|nyse|tsx):\s*[a-z]+\b/i, reason: "stock-ticker" },
  // HR news
  { pattern: /\blayoffs?\b/i, reason: "hr-news" },
  { pattern: /\bworkforce\s+reduction\b/i, reason: "hr-news" },
  { pattern: /\bjob\s+cuts?\b/i, reason: "hr-news" },
  // Legal / bankruptcy
  { pattern: /\blawsuit|litigation|class.action\b/i, reason: "legal" },
  { pattern: /\bbankruptc(y|ies)|chapter\s+11\b/i, reason: "bankruptcy" },
  // Too small (residential scale) — only disqualify if explicit small kW with energy tech
  {
    pattern: /\b([1-9]|[1-4][0-9])\s*kw\s+(solar|battery|storage|system|bess)\b/i,
    reason: "residential-scale",
  },
  // Pure product launch / vendor announcement without buyer
  { pattern: /\bnew\s+product\s+(launch|line|announcement)\b/i, reason: "product-launch" },
];

export interface DisqualifierResult {
  disqualified: boolean;
  reason?: string;
}

/**
 * Returns { disqualified: true, reason } if article matches any hard disqualifier.
 * Otherwise { disqualified: false }.
 */
export function checkDisqualifiers(text: string): DisqualifierResult {
  for (const { pattern, reason } of DISQUALIFIER_RULES) {
    if (pattern.test(text)) return { disqualified: true, reason };
  }
  return { disqualified: false };
}

// ─── Deduplication utilities ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "are",
  "was",
  "will",
  "has",
  "its",
  "their",
  "more",
  "when",
  "what",
  "into",
  "says",
  "said",
  "have",
  "been",
  "they",
  "which",
  "about",
  "after",
  "before",
  "over",
  "under",
  "also",
  "than",
  "then",
  "where",
  "there",
  "here",
  "just",
  "new",
  "can",
  "may",
  "would",
  "could",
  "should",
]);

/**
 * Word-level Jaccard similarity between two strings.
 * Score 0.0–1.0.  Threshold ~0.55 = same story from different sources.
 */
export function jaccardSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 3 && !STOP_WORDS.has(t))
    );
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  if (tokA.size === 0 && tokB.size === 0) return 1;
  if (tokA.size === 0 || tokB.size === 0) return 0;
  const intersection = [...tokA].filter((t) => tokB.has(t)).length;
  return intersection / (tokA.size + tokB.size - intersection);
}

/**
 * Generate a short canonical fingerprint from an article title.
 * Two articles with the same story (even reworded) will have similar fingerprints.
 * Used for O(1) dedup before the more expensive Jaccard check.
 */
export function articleFingerprint(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 4 && !STOP_WORDS.has(t))
    .sort()
    .slice(0, 8)
    .join("|");
}
