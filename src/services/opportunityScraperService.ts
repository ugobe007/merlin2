/**
 * Opportunity Scraper Service
 * Aggregates business news from RSS feeds and identifies BESS, solar, and
 * generator sales opportunities.
 *
 * Phase 2 (June 2026): Added 11 equipment-specific RSS sources and 5 new
 * OpportunitySignal values (bess_procurement, solar_procurement,
 * generator_procurement, permit_filed, interconnection_application).
 *
 * Phase 3 (June 2026): Added permit + FERC interconnection queue feeds.
 * Confidence scoring now differentiates by equipment category so that
 * BESS/solar/generator leads score appropriately regardless of general
 * construction/expansion signals.
 */

import type {
  Opportunity,
  OpportunitySignal,
  IndustryType,
  ScraperResult,
} from "../types/opportunity";
import {
  cleanCompanyName,
  extractCompanyFromTitle,
  isValidCompanyName as utilIsValidCompanyName,
  scoreCompanyName,
} from "../utils/companyNameExtraction";
import {
  normalizeText,
  articleFingerprint,
  jaccardSimilarity,
  checkDisqualifiers,
} from "../utils/leadNLP";
import { qualifyLead } from "./leadQualificationEngine";

// ─── RSS feed sources ──────────────────────────────────────────────────────────

const NEWS_SOURCES = [
  // ── Original general-business feeds ──
  {
    name: "Google News - Business Construction",
    url: "https://news.google.com/rss/search?q=business+construction+opening&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Factory Expansion",
    url: "https://news.google.com/rss/search?q=factory+expansion+manufacturing&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Data Center",
    url: "https://news.google.com/rss/search?q=data+center+opening+construction&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Warehouse Logistics",
    url: "https://news.google.com/rss/search?q=warehouse+logistics+opening&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Energy RFQ RFP",
    url: "https://news.google.com/rss/search?q=(RFQ+OR+RFP+OR+%22request+for+proposal%22)+(%22battery+storage%22+OR+solar+OR+microgrid+OR+%22energy+storage%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Commercial Energy Projects",
    url: "https://news.google.com/rss/search?q=(%22energy+project%22+OR+%22solar+project%22+OR+%22battery+storage+project%22+OR+microgrid)+(%22commercial%22+OR+facility+OR+campus+OR+plant)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Utility Rate Exposure",
    url: "https://news.google.com/rss/search?q=(%22high+electricity+rates%22+OR+%22utility+rate+increase%22+OR+%22demand+charges%22+OR+%22power+costs%22)+(%22data+center%22+OR+manufacturing+OR+warehouse+OR+hospital+OR+hotel)&hl=en-US&gl=US&ceid=US:en",
  },

  // ── Phase 2: BESS-specific procurement feeds ──
  {
    name: "Google News - BESS Procurement RFP",
    url: "https://news.google.com/rss/search?q=(%22battery+storage%22+OR+%22BESS%22+OR+%22energy+storage%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22procurement%22+OR+%22request+for+proposal%22+OR+%22bid%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - C&I Battery Storage Projects",
    url: "https://news.google.com/rss/search?q=(%22behind-the-meter%22+OR+%22C%26I+storage%22+OR+%22commercial+battery%22+OR+%22peak+shaving%22+OR+%22demand+charge+reduction%22)+(%22project%22+OR+%22install%22+OR+%22deploy%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Hospital Data Center Backup Power",
    url: "https://news.google.com/rss/search?q=(%22hospital%22+OR+%22data+center%22+OR+%22critical+facility%22)+(%22backup+power%22+OR+%22energy+storage%22+OR+%22microgrid%22+OR+%22resilience%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - IRA BESS Incentives",
    url: "https://news.google.com/rss/search?q=(%22IRA%22+OR+%22Inflation+Reduction+Act%22+OR+%22ITC%22)+(%22battery+storage%22+OR+%22BESS%22+OR+%22energy+storage%22)+(%22project%22+OR+%22announced%22+OR+%22awarded%22)&hl=en-US&gl=US&ceid=US:en",
  },

  // ── Phase 2: Solar commercial procurement feeds ──
  {
    name: "Google News - Commercial Solar RFP",
    url: "https://news.google.com/rss/search?q=(solar+OR+%22solar+PV%22+OR+%22rooftop+solar%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22procurement%22+OR+%22power+purchase+agreement%22+OR+%22PPA%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Solar Commercial Rooftop",
    url: "https://news.google.com/rss/search?q=(%22commercial+solar%22+OR+%22industrial+solar%22+OR+%22rooftop+solar%22)+(%22installation%22+OR+%22project%22+OR+%22awarded%22+OR+%22new+facility%22)&hl=en-US&gl=US&ceid=US:en",
  },

  // ── Phase 2: Generator / backup power procurement feeds ──
  {
    name: "Google News - Commercial Generator Procurement",
    url: "https://news.google.com/rss/search?q=(%22standby+generator%22+OR+%22backup+generator%22+OR+%22emergency+power%22+OR+%22genset%22)+(%22hospital%22+OR+%22data+center%22+OR+%22manufacturing%22+OR+%22commercial%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Generator RFP Construction",
    url: "https://news.google.com/rss/search?q=(%22generator%22+OR+%22backup+power%22+OR+%22power+generation%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22construction%22+OR+%22new+build%22)&hl=en-US&gl=US&ceid=US:en",
  },

  // ── Phase 3: Permit + interconnection signals ──
  {
    name: "Google News - Commercial Building Permits Energy",
    url: "https://news.google.com/rss/search?q=(%22building+permit%22+OR+%22construction+permit%22+OR+%22permit+filed%22)+(%22commercial%22+OR+%22industrial%22+OR+%22data+center%22+OR+%22warehouse%22+OR+%22manufacturing%22+OR+%22hospital%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News - Grid Interconnection Applications",
    url: "https://news.google.com/rss/search?q=(%22interconnection+application%22+OR+%22grid+interconnection%22+OR+%22interconnection+queue%22+OR+%22FERC+application%22)+(%22storage%22+OR+%22solar%22+OR+%22microgrid%22+OR+%22battery%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "EIA Today in Energy",
    url: "https://www.eia.gov/rss/todayinenergy.xml",
  },

  // ── Phase 4: Direct procurement / grant award feeds ──
  {
    // Federal solicitations for BESS, backup power, microgrids (DoD, VA, GSA)
    name: "SAM.gov — Energy Storage & Backup Power Solicitations",
    url: "https://sam.gov/api/prod/opportunities/v2/search?limit=100&ptype=o,k,r&keywords=battery+storage+OR+energy+storage+OR+backup+power+OR+microgrid&postedFrom=01/01/2026&postedTo=12/31/2026&status=active&dformat=rss",
  },
  {
    // FERC eLibrary — interconnection applications signal real projects needing equipment now
    name: "FERC eLibrary — Interconnection & Energy Storage",
    url: "https://www.ferc.gov/rss-feeds/news-releases",
  },
  {
    // NYSERDA grant awards — funded NY projects moving to procurement
    name: "NYSERDA — Clean Energy Awards",
    url: "https://www.nyserda.ny.gov/rss/news",
  },
  {
    // California Energy Commission — BESS & solar grant announcements
    name: "CA Energy Commission — News & Awards",
    url: "https://www.energy.ca.gov/rss/news.xml",
  },
  {
    // DOE Loan Programs Office — conditional commitments = large projects imminent
    name: "DOE LPO Announcements",
    url: "https://www.energy.gov/lpo/feed",
  },
  {
    // Microgrid Knowledge — project RFPs + awards
    name: "Microgrid Knowledge",
    url: "https://microgridknowledge.com/feed/",
  },
  {
    // Google News: microgrid procurement signals
    name: "Google News — Microgrid RFP Procurement",
    url: "https://news.google.com/rss/search?q=(%22microgrid%22+OR+%22distributed+energy%22+OR+%22DER%22)+(%22RFP%22+OR+%22RFQ%22+OR+%22procurement%22+OR+%22project+award%22+OR+%22bid%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Google News: C&I solar — behind-the-meter commercial installs
    name: "Google News — C&I Solar Behind-the-Meter",
    url: "https://news.google.com/rss/search?q=(%22commercial+solar%22+OR+%22C%26I+solar%22+OR+%22behind-the-meter+solar%22+OR+%22on-site+solar%22+OR+%22corporate+PPA%22)+(%22installation%22+OR+%22project%22+OR+%22awarded%22+OR+%22procurement%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Google News: VPP / demand response enrollment signals
    name: "Google News — Virtual Power Plant Demand Response",
    url: "https://news.google.com/rss/search?q=(%22virtual+power+plant%22+OR+%22VPP%22+OR+%22demand+response%22+OR+%22grid+services%22)+(%22commercial%22+OR+%22industrial%22+OR+%22battery+storage%22+OR+%22enrollment%22)&hl=en-US&gl=US&ceid=US:en",
  },

  // ── Phase 5: High-signal industry publications ──
  {
    name: "Utility Dive",
    url: "https://www.utilitydive.com/feeds/news/",
  },
  {
    name: "pv magazine USA",
    url: "https://pv-magazine-usa.com/feed/",
  },
  {
    name: "PV Tech",
    url: "https://www.pvtech.org/feed/",
  },
  {
    name: "Electrek",
    url: "https://electrek.co/feed/",
  },
  {
    name: "Renewable Energy World",
    url: "https://www.renewableenergyworld.com/feed/",
  },
  {
    name: "Environment + Energy Leader",
    url: "https://www.environmentalleader.com/feed/",
  },

  // ── Phase 5: Precision procurement-intent Google News queries ──
  {
    // Active RFP / solicitation issuance — highest precision signal
    name: "Google News — RFP Issued Battery Energy Storage",
    url: "https://news.google.com/rss/search?q=(%22issues+rfp%22+OR+%22issued+rfp%22+OR+%22releases+rfp%22+OR+%22released+rfp%22+OR+%22publishes+rfp%22+OR+%22published+rfp%22)+(%22battery+storage%22+OR+%22energy+storage%22+OR+%22bess%22+OR+%22solar%22+OR+%22microgrid%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Seeking / inviting / soliciting bids
    name: "Google News — Seeking Bids Proposals Energy Solar Storage",
    url: "https://news.google.com/rss/search?q=(%22seeking+bids%22+OR+%22seeking+proposals%22+OR+%22inviting+bids%22+OR+%22soliciting+bids%22+OR+%22invites+proposals%22+OR+%22solicitation+for%22)+(%22solar%22+OR+%22battery+storage%22+OR+%22energy+storage%22+OR+%22generator%22+OR+%22microgrid%22+OR+%22backup+power%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Critical facilities (hospitals, data centers, cold storage) seeking backup power
    name: "Google News — Critical Facility Backup Power Procurement",
    url: "https://news.google.com/rss/search?q=(%22hospital%22+OR+%22data+center%22+OR+%22cold+storage%22+OR+%22manufacturing+plant%22+OR+%22warehouse%22)+(%22backup+power%22+OR+%22energy+storage%22+OR+%22uninterruptible+power%22+OR+%22microgrid%22+OR+%22generator%22)+(%22rfp%22+OR+%22procurement%22+OR+%22contract%22+OR+%22solicitation%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Demand charge reduction leading to BESS procurement
    name: "Google News — Demand Charge Battery Storage Contract",
    url: "https://news.google.com/rss/search?q=(%22demand+charge%22+OR+%22peak+demand+reduction%22+OR+%22demand+charges%22)+(%22battery+storage%22+OR+%22energy+storage%22+OR+%22storage+system%22+OR+%22bess%22)+(%22install%22+OR+%22deploy%22+OR+%22contract%22+OR+%22procurement%22+OR+%22procure%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Utility/coop issuing storage or solar procurement
    name: "Google News — Utility Storage Solar Solicitation",
    url: "https://news.google.com/rss/search?q=(%22utility%22+OR+%22electric+cooperative%22+OR+%22grid+operator%22+OR+%22power+company%22+OR+%22electric+company%22)+(%22solicitation%22+OR+%22issues+rfp%22+OR+%22competitive+procurement%22+OR+%22competitive+bid%22)+(%22storage%22+OR+%22battery%22+OR+%22solar%22+OR+%22renewable%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Corporate PPAs — commercial and industrial buyers locking in solar/storage
    name: "Google News — Corporate PPA Power Purchase Agreement",
    url: "https://news.google.com/rss/search?q=(%22power+purchase+agreement%22+OR+%22corporate+ppa%22+OR+%22long-term+energy+contract%22+OR+%22clean+energy+ppa%22)+(%22solar%22+OR+%22battery+storage%22+OR+%22storage%22)+(%22commercial%22+OR+%22industrial%22+OR+%22corporate%22+OR+%22manufacturer%22+OR+%22company%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // EPC contract awards = active project = equipment vendors needed now
    name: "Google News — EPC Contract Energy Storage Solar Awarded",
    url: "https://news.google.com/rss/search?q=(%22epc+contract%22+OR+%22epc+award%22+OR+%22engineering+procurement+construction%22+OR+%22epc+contractor+selected%22+OR+%22epc+firm+selected%22)+(%22energy+storage%22+OR+%22solar%22+OR+%22battery%22+OR+%22microgrid%22+OR+%22bess%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // Federal / DoD / VA energy resilience projects
    name: "Google News — Federal Military Energy Resilience Contract",
    url: "https://news.google.com/rss/search?q=(%22military+installation%22+OR+%22federal+facility%22+OR+%22department+of+defense%22+OR+%22dod%22+OR+%22va+medical+center%22+OR+%22veterans+affairs%22)+(%22microgrid%22+OR+%22energy+storage%22+OR+%22solar%22+OR+%22resilience%22+OR+%22backup+power%22)+(%22contract%22+OR+%22award%22+OR+%22project%22)&hl=en-US&gl=US&ceid=US:en",
  },
  {
    // School district, university campus solar + storage
    name: "Google News — School University Campus Solar Storage",
    url: "https://news.google.com/rss/search?q=(%22school+district%22+OR+%22university%22+OR+%22college%22+OR+%22campus%22)+(%22solar%22+OR+%22energy+storage%22+OR+%22battery%22+OR+%22microgrid%22+OR+%22renewable+energy%22)+(%22rfp%22+OR+%22procurement%22+OR+%22contract%22+OR+%22approved%22+OR+%22awarded%22)&hl=en-US&gl=US&ceid=US:en",
  },
];

// ─── Signal keyword sets (Phase 2: 5 new signals added) ──────────────────────

const SIGNAL_KEYWORDS: Record<OpportunitySignal, string[]> = {
  // ── Existing signals ──
  construction: [
    "construction",
    "building",
    "under construction",
    "groundbreaking",
    "breaking ground",
  ],
  expansion: ["expansion", "expanding", "expand", "growing", "growth", "scale up", "scaling"],
  new_opening: ["opening", "opened", "new facility", "new location", "launching", "grand opening"],
  funding: [
    "funding",
    "investment",
    "raised",
    "capital",
    "financing",
    "series",
    "ipo",
    "loan guarantee",
  ],
  acquisition: ["acquired", "acquisition", "merger", "purchase", "takeover"],
  sustainability_initiative: [
    "sustainability",
    "renewable",
    "green",
    "carbon neutral",
    "net zero",
    "decarbonization",
    "clean energy",
    "zero emission",
    "esg",
  ],
  energy_upgrade: [
    "energy efficiency",
    "power upgrade",
    "electrical upgrade",
    "energy management",
    "retool",
  ],
  facility_upgrade: [
    "modernization",
    "renovation",
    "upgrade",
    "retrofit",
    "overhaul",
    "refurbishment",
  ],
  rfq: [
    "rfq",
    "rfp",
    "request for quote",
    "request for quotation",
    "request for proposal",
    "invitation to bid",
    "bid solicitation",
    "seeking proposals",
    "procurement",
    "tender",
    "issuance of rfp",
  ],
  energy_project: [
    "energy project",
    "battery storage project",
    "bess project",
    "solar project",
    "microgrid project",
    "onsite power",
    "distributed energy",
    "energy resilience",
    "backup power project",
    "peak shaving",
    "demand response",
    "virtual power plant",
    "energy storage system",
    "distributed generation",
  ],
  high_utility_exposure: [
    "high electricity rates",
    "utility rate increase",
    "rising utility costs",
    "power costs",
    "energy costs",
    "electricity costs",
    "demand charges",
    "peak demand charges",
    "time-of-use rates",
    "tou rates",
    "grid constraints",
    "power shortage",
    "curtailment",
    "grid instability",
    "utility bill",
  ],

  // ── Phase 2: Equipment-specific procurement signals ──
  bess_procurement: [
    // Direct procurement noun phrases
    "battery storage procurement",
    "bess procurement",
    "energy storage rfp",
    "battery storage rfq",
    "bess rfp",
    "bess rfq",
    "battery storage contract",
    "battery energy storage system",
    "bess project award",
    "battery storage award",
    "energy storage bid",
    "behind-the-meter storage",
    "c&i battery",
    "commercial battery storage",
    "peak shaving procurement",
    "demand charge storage",
    "battery storage installation",
    "mwh storage",
    "kwh storage system",
    "battery storage deployment",
    "energy storage solicitation",
    "storage capacity procurement",
    // Reversed / verb-first phrase variants
    "rfp for battery storage",
    "rfp for energy storage",
    "rfq for battery storage",
    "rfq for energy storage",
    "procure battery storage",
    "procure energy storage",
    "procuring battery storage",
    "procuring energy storage",
    "battery storage bid",
    "issues rfp for battery",
    "issued rfp for energy storage",
    "seeking bids for battery",
    "seeking proposals for energy storage",
    "invites bids for energy storage",
    "soliciting battery storage",
    "solicitation for battery storage",
    "tender for battery storage",
    "tender for energy storage",
    // Adjectival + procurement combos
    "large-scale battery procurement",
    "grid-scale storage procurement",
    "utility-scale battery contract",
    "commercial-scale energy storage",
  ],
  solar_procurement: [
    "solar procurement",
    "solar rfp",
    "solar rfq",
    "solar ppa",
    "power purchase agreement solar",
    "rooftop solar bid",
    "commercial solar project",
    "solar installation bid",
    "solar panel procurement",
    "solar farm award",
    "solar array contract",
    "photovoltaic installation",
    "pv system procurement",
    "solar epc contract",
    "solar contractor award",
    "mw solar",
    "kw solar installation",
    // Reversed / verb-first variants
    "rfp for solar",
    "rfq for solar",
    "solar solicitation",
    "procure solar",
    "procuring solar",
    "seeking solar proposals",
    "seeking solar bids",
    "invites bids for solar",
    "soliciting solar contractors",
    "commercial solar procurement",
    "industrial solar procurement",
    "solar project solicitation",
    "tender for solar",
    "corporate solar contract",
    "issues rfp for solar",
    "released rfp for solar",
  ],
  generator_procurement: [
    "generator procurement",
    "generator rfp",
    "generator rfq",
    "genset bid",
    "backup generator contract",
    "standby power procurement",
    "emergency generator bid",
    "diesel generator award",
    "natural gas generator contract",
    "generator installation",
    "backup power system",
    "emergency power procurement",
    "generator purchase",
    "cummins contract",
    "caterpillar generator",
    "kohler generator",
    // Reversed / verb-first variants
    "rfp for generator",
    "rfq for generator",
    "generator solicitation",
    "procure generator",
    "procuring generators",
    "backup generator procurement",
    "emergency power solicitation",
    "generator epc",
    "issues rfp for backup power",
    "seeking backup power contractor",
    "standby power rfp",
  ],

  // ── Phase 3: Permit + interconnection signals ──
  permit_filed: [
    "building permit",
    "construction permit",
    "permit filed",
    "permit application",
    "permit approved",
    "permit granted",
    "electrical permit",
    "commercial permit",
    "industrial permit",
    "site permit",
  ],
  interconnection_application: [
    "interconnection application",
    "grid interconnection",
    "interconnection queue",
    "ferc application",
    "iso interconnection",
    "pjm interconnection",
    "caiso interconnection",
    "ercot interconnection",
    "utility interconnection",
    "distribution interconnection",
    "transmission interconnection",
  ],

  // ── Phase 5 signal: contract award = active market ──
  procurement_awarded: [
    "awarded contract for battery",
    "awarded contract for solar",
    "awarded contract for energy storage",
    "contract awarded for bess",
    "contract award energy storage",
    "wins contract for battery",
    "wins contract for solar",
    "selected as contractor for energy storage",
    "selected epc for solar",
    "selected integrator for battery",
    "project award battery storage",
    "project award solar",
    "awarded epc contract",
    "epc award battery",
    "epc award solar",
    "energy storage project award",
    "solar project award",
    "battery storage project award",
    "selected to build battery storage",
    "selected to install solar",
    "contract to supply battery storage",
    "contract to supply solar",
    "supply contract energy storage",
  ],

  // ── Phase 4: BESS co-sell + advanced procurement signals ──
  microgrid_procurement: [
    "microgrid rfp",
    "microgrid rfq",
    "microgrid procurement",
    "microgrid project award",
    "microgrid bid",
    "microgrid solicitation",
    "distributed energy rfp",
    "der rfp",
    "microgrid installation",
    "microgrid contract",
    "microgrid project",
    "resilience microgrid",
    "campus microgrid",
    "island mode",
    "behind-the-meter microgrid",
  ],
  virtual_power_plant: [
    "virtual power plant",
    "vpp program",
    "demand response program",
    "grid services contract",
    "ancillary services",
    "frequency regulation",
    "capacity market",
    "aggregated resources",
    "demand response enrollment",
    "flex demand",
    "grid flexibility",
    "dispatchable storage",
    "battery aggregation",
    "nem 3",
    "nem3",
  ],
  c_and_i_solar: [
    "c&i solar",
    "c&i pv",
    "commercial solar installation",
    "industrial solar",
    "rooftop solar commercial",
    "behind-the-meter solar",
    "on-site solar",
    "corporate ppa",
    "solar power purchase agreement",
    "solar lease commercial",
    "community solar commercial",
    "solar carport",
    "solar canopy",
    "commercial rooftop pv",
    "net metering commercial",
  ],
  // ── Phase 5: Power generation procurement ──
  power_generation: [
    "gas turbine procurement",
    "gas turbine rfp",
    "gas turbine contract",
    "gas turbine award",
    "peaker plant",
    "peaking plant",
    "combustion turbine",
    "combined cycle gas turbine",
    "ccgt procurement",
    "ccgt project",
    "ocgt procurement",
    "simple cycle plant",
    "natural gas plant procurement",
    "gas-fired power plant",
    "gas power plant",
    "power plant procurement",
    "power plant rfp",
    "power plant rfq",
    "power plant contract",
    "generation capacity procurement",
    "new generation capacity",
    "capacity addition",
    "thermal power procurement",
    "combined heat and power",
    "chp project",
    "chp procurement",
    "cogeneration project",
    "cogeneration procurement",
    "district energy procurement",
    "distributed generation procurement",
    "gas engine procurement",
    "reciprocating engine",
    "power generation rfp",
    "power generation rfq",
    "power generation contract",
    "utility scale generation",
    "electric generation project",
    "generation project award",
    "issues rfp for power",
    "seeking power generation",
    "turbine installation",
  ],
};

// ─── Industry keyword detection (Phase 2: 8 new verticals) ───────────────────

const INDUSTRY_KEYWORDS: Partial<Record<IndustryType, string[]>> = {
  data_center: ["data center", "server farm", "cloud infrastructure", "colocation", "hyperscale"],
  manufacturing: [
    "manufacturing",
    "factory",
    "plant",
    "production facility",
    "industrial facility",
    "assembly",
  ],
  logistics: ["warehouse", "distribution center", "logistics", "fulfillment center", "cold chain"],
  hospitality: [
    "hotel",
    "resort",
    "restaurant",
    "hospitality",
    "motel",
    "inn",
    "convention center",
  ],
  healthcare: [
    "hospital",
    "medical center",
    "healthcare facility",
    "clinic",
    "health system",
    "medical campus",
  ],
  retail: ["retail", "shopping center", "supermarket", "store", "grocery", "mall", "big box"],
  education: [
    "school",
    "university",
    "campus",
    "education",
    "college",
    "community college",
    "school district",
  ],
  automotive: [
    "automotive",
    "car manufacturing",
    "assembly plant",
    "dealership",
    "ev charging",
    "auto plant",
  ],
  // New verticals
  cold_storage: [
    "cold storage",
    "refrigerated warehouse",
    "frozen food",
    "cold chain",
    "refrigeration facility",
  ],
  car_wash: ["car wash", "carwash", "auto spa", "vehicle wash"],
  truck_stop: ["truck stop", "travel plaza", "travel center", "pilot flying j", "loves travel"],
  hospital: [
    "hospital",
    "health system",
    "medical center",
    "icu",
    "emergency room",
    "health campus",
  ],
  agricultural: [
    "farm",
    "agricultural",
    "agriculture",
    "greenhouse",
    "indoor farm",
    "vertical farm",
    "irrigation",
  ],
  gym: ["gym", "fitness center", "sports complex", "recreation center", "health club"],
  energy: [
    "utility",
    "iso",
    "grid operator",
    "power plant",
    "energy company",
    "electric cooperative",
  ],
  government: [
    "government",
    "municipality",
    "federal",
    "military",
    "dod",
    "army",
    "navy",
    "air force",
    "public works",
  ],
  other: [],
};

// ─── Confidence scoring (Phase 2: equipment-differentiated) ──────────────────

/** Base confidence + per-signal weights, differentiated by equipment category */
const SIGNAL_BASE_SCORES: Partial<Record<OpportunitySignal, number>> = {
  // Equipment-specific (highest weight — direct procurement intent)
  bess_procurement: 45,
  solar_procurement: 45,
  generator_procurement: 45,
  power_generation: 42,
  rfq: 35,
  procurement_awarded: 30, // contract award = active market, co-vendor opportunity
  // Strong indirect signals
  energy_project: 25,
  interconnection_application: 22,
  microgrid_procurement: 22,
  permit_filed: 18,
  high_utility_exposure: 16,
  energy_upgrade: 14,
  c_and_i_solar: 12,
  virtual_power_plant: 12,
  construction: 10,
  facility_upgrade: 10,
  new_opening: 10,
  expansion: 8,
  funding: 8,
  sustainability_initiative: 7,
  acquisition: 4,
};

const HIGH_VALUE_INDUSTRIES = new Set<IndustryType>([
  "data_center",
  "manufacturing",
  "healthcare",
  "hospital",
  "cold_storage",
  "logistics",
  "automotive",
]);

const MEDIUM_VALUE_INDUSTRIES = new Set<IndustryType>([
  "retail",
  "education",
  "hospitality",
  "agricultural",
  "government",
  "energy",
]);

/**
 * Parse RSS feed — works in browser (DOMParser) and Node.js (regex fallback).
 * Added CORS proxy for browser context; called directly from Node scraper scripts.
 */
async function parseRSSFeed(
  url: string
): Promise<Array<{ title: string; link: string; description: string; pubDate: string }>> {
  try {
    const isBrowser = typeof window !== "undefined" && typeof DOMParser !== "undefined";

    const fetchUrl = isBrowser
      ? `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      : url;

    const response = await fetch(fetchUrl);
    if (!response.ok) return [];
    const xmlText = await response.text();

    // Browser path — DOMParser
    if (isBrowser) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      if (xmlDoc.querySelector("parsererror")) return [];
      return Array.from(xmlDoc.querySelectorAll("item"))
        .map((item) => ({
          title: item.querySelector("title")?.textContent?.trim() ?? "",
          link: item.querySelector("link")?.textContent?.trim() ?? "",
          description: cleanHTMLTags(item.querySelector("description")?.textContent ?? ""),
          pubDate: item.querySelector("pubDate")?.textContent?.trim() ?? "",
        }))
        .filter((a) => a.title && a.link);
    }

    // Node.js path — regex extraction (no DOMParser available)
    const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRegex.exec(xmlText)) !== null) {
      const chunk = m[0];
      const title = stripTags(
        chunk.match(/<title>(?:<\!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] ?? ""
      );
      const link = stripTags(
        chunk.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ??
          chunk.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)?.[1] ??
          ""
      );
      const description = stripTags(
        chunk.match(/<description>(?:<\!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ?? ""
      );
      const pubDate = chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? "";
      if (title && link)
        items.push({
          title: title.trim(),
          link: link.trim(),
          description: description.trim(),
          pubDate,
        });
    }
    return items;
  } catch (err) {
    console.error(`[opportunityScraperService] RSS fetch failed: ${url}`, err);
    return [];
  }
}

/** Strip HTML / CDATA wrappers from RSS text */
function stripTags(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Clean HTML for browser-context descriptions */
function cleanHTMLTags(html: string): string {
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? doc.documentElement.textContent ?? "").trim();
  }
  return stripTags(html);
}

/** Extract company name from article title + description */
function extractCompanyName(title: string, description: string): string {
  for (const source of [title, description]) {
    const extracted = extractCompanyFromTitle(source);
    if (extracted) {
      const cleaned = cleanCompanyName(extracted);
      if (cleaned && utilIsValidCompanyName(cleaned)) return cleaned;
    }
  }
  // Fallback: first 3 words of title
  const words = title.split(/\s+/).filter((w) => w.length > 0);
  if (words.length >= 2) {
    const name = words.slice(0, Math.min(3, words.length)).join(" ");
    const cleaned = cleanCompanyName(name);
    if (cleaned && utilIsValidCompanyName(cleaned)) return cleaned;
  }
  return "Unknown Company";
}

/** Detect all matching signals in article text using normalized matching */
function detectSignals(text: string): OpportunitySignal[] {
  const lowerText = text.toLowerCase();
  const normText = normalizeText(text);

  const found = (Object.entries(SIGNAL_KEYWORDS) as [OpportunitySignal, string[]][])
    .filter(([, keywords]) => {
      return keywords.some((kw) => {
        // Try exact lowercase match first (fast path)
        if (lowerText.includes(kw)) return true;
        // Try normalized match (catches stemmed/hyphen variants)
        const normKw = normalizeText(kw);
        if (normText.includes(normKw)) return true;
        return false;
      });
    })
    .map(([sig]) => sig);

  return found;
}

/** Detect industry from article text — returns first match by priority order */
function detectIndustry(text: string): IndustryType | undefined {
  const lowerText = text.toLowerCase();
  // Priority: high-value verticals first
  const PRIORITY_ORDER: IndustryType[] = [
    "data_center",
    "hospital",
    "healthcare",
    "manufacturing",
    "cold_storage",
    "logistics",
    "automotive",
    "agricultural",
    "government",
    "energy",
    "education",
    "retail",
    "hospitality",
    "car_wash",
    "truck_stop",
    "gym",
  ];
  for (const industry of PRIORITY_ORDER) {
    const keywords = INDUSTRY_KEYWORDS[industry];
    if (keywords?.some((kw) => lowerText.includes(kw))) return industry;
  }
  return undefined;
}

/**
 * Differentiated confidence scoring (Phase 2).
 * Equipment-specific procurement signals dominate (45 pts each) so
 * BESS/solar/generator RFPs always rank above generic construction news.
 */
function calculateConfidence(signals: OpportunitySignal[], industry?: IndustryType): number {
  let score = 0;

  // Signal weights
  for (const sig of signals) {
    score += SIGNAL_BASE_SCORES[sig] ?? 0;
  }

  // Industry multiplier
  if (industry && HIGH_VALUE_INDUSTRIES.has(industry)) {
    score += 22;
  } else if (industry && MEDIUM_VALUE_INDUSTRIES.has(industry)) {
    score += 10;
  } else if (industry) {
    score += 4;
  }

  // Equipment co-occurrence bonus (BESS + high_utility in same article = very hot)
  if (signals.includes("bess_procurement") && signals.includes("high_utility_exposure"))
    score += 10;
  if (signals.includes("solar_procurement") && signals.includes("sustainability_initiative"))
    score += 8;
  if (signals.includes("generator_procurement") && signals.includes("construction")) score += 8;
  if (signals.includes("power_generation") && signals.includes("rfq")) score += 10;
  if (signals.includes("power_generation") && signals.includes("procurement_awarded")) score += 8;
  if (signals.includes("rfq") && signals.includes("energy_project")) score += 10;
  if (signals.includes("interconnection_application")) score += 8;
  if (signals.includes("permit_filed") && signals.includes("construction")) score += 6;
  // Phase 4 co-occurrence bonuses
  if (signals.includes("microgrid_procurement") && signals.includes("bess_procurement"))
    score += 14;
  if (signals.includes("microgrid_procurement") && signals.includes("interconnection_application"))
    score += 10;
  if (signals.includes("c_and_i_solar") && signals.includes("bess_procurement")) score += 10;
  if (signals.includes("c_and_i_solar") && signals.includes("solar_procurement")) score += 8;
  if (signals.includes("virtual_power_plant") && signals.includes("bess_procurement")) score += 12;
  if (
    signals.includes("permit_filed") &&
    signals.includes("construction") &&
    signals.includes("bess_procurement")
  )
    score += 10;

  return Math.min(score, 100);
}

/**
 * Main scraper function - aggregates opportunities from all sources
 */
export async function scrapeOpportunities(): Promise<ScraperResult> {
  const allOpportunities: Opportunity[] = [];
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const seenTitles: string[] = []; // for Jaccard cross-source dedup
  let duplicates = 0;
  let junk = 0;

  console.log("🔍 Starting opportunity scraper...");

  for (const source of NEWS_SOURCES) {
    console.log(`Fetching from: ${source.name}`);

    const articles = await parseRSSFeed(source.url);

    for (const article of articles) {
      // Skip URL duplicates
      if (seenUrls.has(article.link)) {
        duplicates++;
        continue;
      }
      seenUrls.add(article.link);

      // Hard disqualifier pre-check (residential, financial news, etc.)
      const preCheck = checkDisqualifiers(`${article.title} ${article.description}`);
      if (preCheck.disqualified) {
        junk++;
        continue;
      }

      // Title-fingerprint dedup: same story from multiple sources
      const fp = articleFingerprint(article.title);
      if (seenFingerprints.has(fp)) {
        duplicates++;
        continue;
      }
      // Jaccard dedup: near-identical titles (score > 0.6)
      const isDupTitle = seenTitles.some((t) => jaccardSimilarity(t, article.title) > 0.6);
      if (isDupTitle) {
        duplicates++;
        continue;
      }
      seenFingerprints.add(fp);
      seenTitles.push(article.title);

      // Combine title and description for analysis
      const fullText = `${article.title} ${article.description}`;

      // Detect signals
      const signals = detectSignals(fullText);

      // Skip if no relevant signals
      if (signals.length === 0) {
        continue;
      }

      // Detect industry
      const industry = detectIndustry(fullText);

      // Extract company name
      const companyName = extractCompanyName(article.title, article.description);

      // Skip if company name is junk (saves AI API costs)
      if (companyName === "Unknown Company" || !utilIsValidCompanyName(companyName)) {
        continue;
      }

      // Get company name quality score
      const nameQuality = scoreCompanyName(companyName);

      // Skip if name quality is too low
      if (nameQuality < 50) {
        continue;
      }

      // Qualification gate — drop junk unless it has a strong procurement signal
      const qualification = qualifyLead(article.title, article.description, signals);
      const hasStrongProcurementSignal = signals.some((s) =>
        [
          "bess_procurement",
          "solar_procurement",
          "generator_procurement",
          "rfq",
          "microgrid_procurement",
          "procurement_awarded",
        ].includes(s)
      );
      if (qualification.tier === "junk" && !hasStrongProcurementSignal) {
        junk++;
        continue;
      }

      // Calculate confidence: blend signal-based score with qualification score
      const baseConfidence = calculateConfidence(signals, industry);
      // Qualification contributes 35% — rewards articles with buyer+action+equipment context
      const qualBlend = Math.round(baseConfidence * 0.65 + qualification.score * 0.35);
      // Hot articles get a +8 bonus; cold get -10 penalty
      const qualAdjust = qualification.tier === "hot" ? 8 : qualification.tier === "cold" ? -10 : 0;
      const confidence = Math.min(
        100,
        Math.round(qualBlend * 0.8 + nameQuality * 0.2) + qualAdjust
      );

      // Create opportunity
      const opportunity: Opportunity = {
        id: crypto.randomUUID(),
        company_name: companyName,
        description: article.description || article.title,
        source_url: article.link,
        source_name: source.name,
        signals,
        industry,
        confidence_score: confidence,
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      allOpportunities.push(opportunity);
    }
  }

  // Sort by confidence score (highest first)
  allOpportunities.sort((a, b) => b.confidence_score - a.confidence_score);

  console.log(
    `✅ Scraping complete: ${allOpportunities.length} opportunities found ` +
      `(${duplicates} duplicates, ${junk} junk filtered)`
  );

  return {
    opportunities: allOpportunities,
    source: "news_aggregator",
    timestamp: new Date().toISOString(),
    total_found: allOpportunities.length,
    duplicates_skipped: duplicates,
  };
}

/**
 * Filter opportunities by criteria
 */
export function filterOpportunities(
  opportunities: Opportunity[],
  filter: {
    minConfidence?: number;
    industries?: IndustryType[];
    signals?: OpportunitySignal[];
  }
): Opportunity[] {
  return opportunities.filter((opp) => {
    if (filter.minConfidence && opp.confidence_score < filter.minConfidence) {
      return false;
    }

    if (filter.industries && filter.industries.length > 0) {
      if (!opp.industry || !filter.industries.includes(opp.industry)) {
        return false;
      }
    }

    if (filter.signals && filter.signals.length > 0) {
      if (!opp.signals.some((s) => filter.signals!.includes(s))) {
        return false;
      }
    }

    return true;
  });
}
