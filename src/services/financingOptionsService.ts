/**
 * MERLIN FINANCING OPTIONS SERVICE
 * =============================================================================
 * Comprehensive database of commercial clean-energy financing programs.
 * Covers: Federal (USDA REAP, SBA 504), C-PACE (national + state), Green Banks,
 * Commercial Banks, Equipment Finance, PPA/Lease, and State Programs.
 *
 * Filtering: by project size ($K), state/region, and industry sector.
 * Monthly payment estimates are provided for amortizing programs (loans, C-PACE).
 *
 * Sources: DSIRE, DOE Loan Programs, SBA.gov, USDA.gov, state energy offices.
 * Last reviewed: March 2026
 * =============================================================================
 */

export type FinancingType =
  | "federal"
  | "cpace"
  | "bank_loan"
  | "equipment_finance"
  | "green_bank"
  | "ppa_lease"
  | "state_program";

export interface FinancingOption {
  id: string;
  provider: string;
  programName: string;
  type: FinancingType;
  typeLabel: string;
  /** Tailwind text color class */
  typeColor: string;
  /** Tailwind bg+border badge class */
  typeBadge: string;
  /** Display string, e.g. "5.5–7.5%" or "Project-based" */
  rateDisplay: string;
  /** Low end for monthly payment calc; null = no payment calc (PPA/grant) */
  rateForCalc: number | null;
  /** Years, e.g. 20. For display can be a string "10–30". */
  termDisplay: string;
  termYearsForCalc: number;
  /** Minimum project net cost in $K */
  minProjectSizeK: number;
  /** Maximum project net cost in $K, undefined = no max */
  maxProjectSizeK?: number;
  /**
   * 'US' = available nationwide.
   * Otherwise 2-letter state codes (e.g. ['CA','NY']).
   */
  regions: string[];
  /**
   * Industry sectors this program covers.
   * 'all' = any commercial sector.
   * Others match WizardState.industry.type slugs.
   */
  sectors: string[];
  /** Short requirement bullets (2–3 max) */
  requirements: string[];
  /** Key selling points / highlights */
  highlights: string[];
  /** Covers 100% of project cost (no down payment) */
  fullyCovered: boolean;
  url: string;
  ctaLabel: string;
  /** Rural only, hospitality specific, etc. */
  note?: string;
}

// ── Industry slug → sector bucket mapping ────────────────────────────────────
const SECTOR_MAP: Record<string, string[]> = {
  hotel: ["commercial", "hospitality"],
  hospitality: ["commercial", "hospitality"],
  restaurant: ["commercial", "food_service"],
  grocery: ["commercial", "retail"],
  retail: ["commercial", "retail"],
  office: ["commercial"],
  warehouse: ["commercial", "industrial"],
  manufacturing: ["industrial"],
  car_wash: ["commercial"],
  data_center: ["commercial", "industrial"],
  healthcare: ["commercial", "healthcare"],
  hospital: ["commercial", "healthcare"],
  agriculture: ["agricultural"],
  farm: ["agricultural"],
  indoor_farm: ["agricultural", "industrial"],
  brewery: ["commercial", "industrial"],
  winery: ["commercial", "agricultural"],
  cannabis: ["commercial", "industrial"],
  apartment: ["commercial", "multifamily"],
  multifamily: ["commercial", "multifamily"],
  airport: ["commercial", "municipal"],
  university: ["commercial", "educational"],
  school: ["commercial", "educational"],
  casino: ["commercial"],
  gas_station: ["commercial"],
  ev_fleet: ["commercial", "industrial"],
};

/** Returns sector tags for an industry slug */
export function getSectorsForIndustry(industrySlug: string | undefined): string[] {
  if (!industrySlug) return ["commercial"];
  return SECTOR_MAP[industrySlug.toLowerCase()] ?? ["commercial"];
}

// ── Monthly payment calculator (standard amortization) ───────────────────────
export function calcMonthlyPayment(
  principal: number,
  annualRatePct: number,
  termYears: number
): number {
  if (annualRatePct <= 0) return principal / (termYears * 12);
  const r = annualRatePct / 100 / 12;
  const n = termYears * 12;
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

// ── The financing database ────────────────────────────────────────────────────
export const FINANCING_DATABASE: FinancingOption[] = [
  // ── FEDERAL PROGRAMS ────────────────────────────────────────────────────────

  {
    id: "usda-reap",
    provider: "USDA Rural Development",
    programName: "REAP — Rural Energy for America Program",
    type: "federal",
    typeLabel: "Federal Grant + Loan",
    typeColor: "text-blue-300",
    typeBadge: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    rateDisplay: "~5.5% loans + up to 50% grant",
    rateForCalc: 5.5,
    termDisplay: "up to 20 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 2.5,
    maxProjectSizeK: 25000,
    regions: ["US"],
    sectors: ["agricultural", "commercial"],
    requirements: [
      "Located in a rural area (pop. < 50,000)",
      "Agricultural producer or rural small business",
      "Project must be technically feasible",
    ],
    highlights: [
      "Grants cover up to 50% of eligible project costs",
      "Below-market loan rate for remainder",
      "Solar, BESS, wind, and efficiency all eligible",
    ],
    fullyCovered: false,
    url: "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency",
    ctaLabel: "Apply via USDA RD",
    note: "Rural locations only. Check eligibility at eligibility.sc.egov.usda.gov",
  },

  {
    id: "sba-504",
    provider: "U.S. Small Business Administration",
    programName: "SBA 504 Green Loan Program",
    type: "federal",
    typeLabel: "Federal Loan",
    typeColor: "text-blue-300",
    typeBadge: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    rateDisplay: "~6.5% fixed (SBA debenture)",
    rateForCalc: 6.5,
    termDisplay: "10 or 20 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 125,
    maxProjectSizeK: 20000,
    regions: ["US"],
    sectors: ["all"],
    requirements: [
      "U.S.-based for-profit small business",
      "Net worth < $15M, avg net income < $5M",
      "Owner-occupied commercial real estate preferred",
    ],
    highlights: [
      "Up to 90% project financing (10% down)",
      "Below-market fixed rate for 10 or 20 years",
      "Renewable energy / efficiency = reduced fees",
    ],
    fullyCovered: false,
    url: "https://www.sba.gov/funding-programs/loans/504-loans",
    ctaLabel: "Find a CDC Lender",
  },

  // ── C-PACE PROGRAMS ─────────────────────────────────────────────────────────

  {
    id: "nuveen-cpace",
    provider: "Nuveen Green Capital",
    programName: "C-PACE Commercial Financing",
    type: "cpace",
    typeLabel: "C-PACE",
    typeColor: "text-teal-300",
    typeBadge: "bg-teal-500/10 border-teal-500/30 text-teal-300",
    rateDisplay: "5.5–8.5% fixed",
    rateForCalc: 6.5,
    termDisplay: "10–30 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 500,
    regions: ["US"],
    sectors: ["commercial", "industrial", "hospitality", "multifamily"],
    requirements: [
      "Eligible property in a C-PACE-authorized state",
      "Consent of existing mortgage lender",
      "Assessed via property tax lien (off-balance-sheet)",
    ],
    highlights: [
      "100% project financing — no down payment",
      "Repaid through property tax bill (transfers with sale)",
      "30 states + DC eligible; no DSCR underwriting",
    ],
    fullyCovered: true,
    url: "https://www.nuveengreenfinance.com",
    ctaLabel: "Check C-PACE Eligibility",
    note: "Available in CA, NY, TX, FL, CO, MD, CT, VA, PA, WA and 20+ more states",
  },

  {
    id: "petros-cpace",
    provider: "Petros PACE Finance",
    programName: "C-PACE Commercial Program",
    type: "cpace",
    typeLabel: "C-PACE",
    typeColor: "text-teal-300",
    typeBadge: "bg-teal-500/10 border-teal-500/30 text-teal-300",
    rateDisplay: "5–8% fixed",
    rateForCalc: 6.0,
    termDisplay: "5–25 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 250,
    regions: ["US"],
    sectors: ["commercial", "industrial", "hospitality"],
    requirements: [
      "Commercial property in a Petros-eligible state",
      "Property owner consent (not tenant financing)",
      "Existing lender intercreditor agreement",
    ],
    highlights: [
      "Covers 100% of hard + soft costs",
      "Quick close — as fast as 30 days",
      "Solar, BESS, EV charging, HVAC all eligible",
    ],
    fullyCovered: true,
    url: "https://www.petros-pace.com",
    ctaLabel: "Get C-PACE Quote",
  },

  {
    id: "ct-green-bank-cpace",
    provider: "CT Green Bank",
    programName: "CT Commercial PACE Program",
    type: "cpace",
    typeLabel: "C-PACE",
    typeColor: "text-teal-300",
    typeBadge: "bg-teal-500/10 border-teal-500/30 text-teal-300",
    rateDisplay: "5–7% fixed",
    rateForCalc: 5.75,
    termDisplay: "up to 20 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 100,
    regions: ["CT"],
    sectors: ["all"],
    requirements: [
      "Connecticut commercial property owner",
      "Energy improvement must meet program standards",
    ],
    highlights: [
      "State-backed green bank — mission-driven rates",
      "Solar, BESS, fuel cells, EV charging eligible",
    ],
    fullyCovered: true,
    url: "https://ctgreenbank.com/commercial-real-estate/c-pace",
    ctaLabel: "Apply to CT Green Bank",
  },

  // ── GREEN BANKS / STATE PROGRAMS ────────────────────────────────────────────

  {
    id: "ny-green-bank",
    provider: "NY Green Bank",
    programName: "Commercial Clean Energy Financing",
    type: "green_bank",
    typeLabel: "State Green Bank",
    typeColor: "text-emerald-300",
    typeBadge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    rateDisplay: "Below market (4.5–7%)",
    rateForCalc: 5.5,
    termDisplay: "up to 20 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 1000,
    regions: ["NY"],
    sectors: ["commercial", "industrial", "multifamily"],
    requirements: [
      "New York State project",
      "Must close a market gap (not displacing private capital)",
      "Minimum $1M project",
    ],
    highlights: [
      "Mission-driven below-market financing",
      "Works alongside NYSERDA NY-Sun incentives",
      "Structured finance for complex deals",
    ],
    fullyCovered: false,
    url: "https://greenbank.ny.gov",
    ctaLabel: "Apply to NY Green Bank",
  },

  {
    id: "masscec",
    provider: "Massachusetts Clean Energy Center",
    programName: "Emerging Technologies Grant & Loan",
    type: "state_program",
    typeLabel: "State Program",
    typeColor: "text-violet-300",
    typeBadge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    rateDisplay: "Grants + low-interest loans",
    rateForCalc: 4.0,
    termDisplay: "up to 10 yrs",
    termYearsForCalc: 10,
    minProjectSizeK: 100,
    maxProjectSizeK: 5000,
    regions: ["MA"],
    sectors: ["commercial", "industrial"],
    requirements: [
      "Massachusetts-based commercial project",
      "Technology must meet program criteria",
    ],
    highlights: [
      "Can stack with SMART Program and Mass Save rebates",
      "Grant funding available for qualifying projects",
    ],
    fullyCovered: false,
    url: "https://www.masscec.com/program/emerging-technologies",
    ctaLabel: "Apply to MassCEC",
  },

  {
    id: "nyserda-clean-energy",
    provider: "NYSERDA",
    programName: "Clean Energy Fund — Commercial",
    type: "state_program",
    typeLabel: "State Program",
    typeColor: "text-violet-300",
    typeBadge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    rateDisplay: "Incentives + financing",
    rateForCalc: null,
    termDisplay: "varies",
    termYearsForCalc: 15,
    minProjectSizeK: 50,
    regions: ["NY"],
    sectors: ["commercial", "industrial"],
    requirements: [
      "New York State property",
      "Eligible equipment through NY-Sun or ConEdison program",
    ],
    highlights: [
      "NY-Sun per-watt incentive ($0.20–$0.50/W)",
      "Combines with federal ITC for maximum savings",
      "Expedited interconnection for approved projects",
    ],
    fullyCovered: false,
    url: "https://www.nyserda.ny.gov/ny-sun",
    ctaLabel: "Explore NYSERDA Programs",
  },

  {
    id: "california-cpcfa",
    provider: "CA Pollution Control Financing Authority",
    programName: "Headquarters Energy & Sustainability Financing",
    type: "state_program",
    typeLabel: "State Program",
    typeColor: "text-violet-300",
    typeBadge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    rateDisplay: "Tax-exempt bond rates (~4–6%)",
    rateForCalc: 5.0,
    termDisplay: "up to 30 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 500,
    regions: ["CA"],
    sectors: ["commercial", "industrial"],
    requirements: [
      "California-based commercial or industrial operation",
      "Minimum project size ~$500K",
    ],
    highlights: [
      "Tax-exempt bond financing — lower cost of capital",
      "Pairs well with SGIP battery rebate",
    ],
    fullyCovered: false,
    url: "https://www.treasurer.ca.gov/cpcfa",
    ctaLabel: "Contact CPCFA",
  },

  {
    id: "il-dceo-energy-loan",
    provider: "Illinois DCEO",
    programName: "Illinois EDGE / Clean Energy Loan Fund",
    type: "state_program",
    typeLabel: "State Program",
    typeColor: "text-violet-300",
    typeBadge: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    rateDisplay: "Below market (~4–6%)",
    rateForCalc: 5.0,
    termDisplay: "up to 15 yrs",
    termYearsForCalc: 15,
    minProjectSizeK: 100,
    regions: ["IL"],
    sectors: ["commercial", "industrial"],
    requirements: ["Illinois-based commercial or industrial project", "Must create or retain jobs"],
    highlights: [
      "Stacks with Illinois Shines (SREC program)",
      "Accelerated depreciation (MACRS) bonus",
    ],
    fullyCovered: false,
    url: "https://dceo.illinois.gov/smallbizassistance/cleanenergy.html",
    ctaLabel: "Apply to DCEO",
  },

  // ── COMMERCIAL BANKS / EQUIPMENT FINANCE ────────────────────────────────────

  {
    id: "keybank-clean-energy",
    provider: "KeyBank Clean Energy Finance",
    programName: "Commercial Solar & Storage Loan",
    type: "bank_loan",
    typeLabel: "Bank Loan",
    typeColor: "text-amber-300",
    typeBadge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    rateDisplay: "5.5–8.5%",
    rateForCalc: 6.5,
    termDisplay: "5–20 yrs",
    termYearsForCalc: 15,
    minProjectSizeK: 1000,
    regions: ["US"],
    sectors: ["all"],
    requirements: [
      "Established business (3+ years operating history)",
      "Project meets KeyBank underwriting criteria",
      "Strong DSCR preferred",
    ],
    highlights: [
      "Dedicated clean energy team — fast decisioning",
      "Tax equity bridge lending available",
      "Solar, BESS, wind, EV charging all financeable",
    ],
    fullyCovered: false,
    url: "https://www.key.com/business/industries/energy.html",
    ctaLabel: "Contact KeyBank Energy",
  },

  {
    id: "mosaic-commercial",
    provider: "Mosaic Commercial",
    programName: "Commercial Solar & Battery Loan",
    type: "bank_loan",
    typeLabel: "Bank Loan",
    typeColor: "text-amber-300",
    typeBadge: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    rateDisplay: "5.99–8.99%",
    rateForCalc: 7.0,
    termDisplay: "5–25 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 50,
    maxProjectSizeK: 5000,
    regions: ["US"],
    sectors: ["commercial"],
    requirements: [
      "Business credit check",
      "Equipment from approved installer",
      "Project size $50K–$5M",
    ],
    highlights: [
      "Fast online application — decisions in 24–48 hrs",
      "No prepayment penalty on most products",
      "Integrates ITC timing into loan structure",
    ],
    fullyCovered: false,
    url: "https://www.joinmosaic.com/commercial",
    ctaLabel: "Apply with Mosaic",
  },

  {
    id: "pnc-equipment-finance",
    provider: "PNC Equipment Finance",
    programName: "Clean Energy Equipment Financing",
    type: "equipment_finance",
    typeLabel: "Equipment Finance",
    typeColor: "text-orange-300",
    typeBadge: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    rateDisplay: "6–9% (market rate)",
    rateForCalc: 7.5,
    termDisplay: "3–7 yrs",
    termYearsForCalc: 7,
    minProjectSizeK: 250,
    regions: ["US"],
    sectors: ["all"],
    requirements: [
      "PNC commercial banking relationship preferred",
      "Equipment as collateral",
      "3+ years in business",
    ],
    highlights: [
      "Section 179 + bonus depreciation eligible",
      "Lease or loan options available",
      "No prepayment penalty on select products",
    ],
    fullyCovered: false,
    url: "https://www.pnc.com/en/corporate-and-institutional/financing/equipment-financing.html",
    ctaLabel: "Contact PNC Equipment Finance",
  },

  {
    id: "us-bank-equipment",
    provider: "U.S. Bank Equipment Finance",
    programName: "Solar & Energy Storage Financing",
    type: "equipment_finance",
    typeLabel: "Equipment Finance",
    typeColor: "text-orange-300",
    typeBadge: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    rateDisplay: "6–8.5% (market rate)",
    rateForCalc: 7.0,
    termDisplay: "3–10 yrs",
    termYearsForCalc: 7,
    minProjectSizeK: 150,
    regions: ["US"],
    sectors: ["all"],
    requirements: [
      "Established commercial credit",
      "Standard underwriting (financials, credit score)",
    ],
    highlights: [
      "Nation's 5th-largest bank — stable capital source",
      "Operating lease option to keep off balance sheet",
      "Accelerated depreciation benefits pass-through",
    ],
    fullyCovered: false,
    url: "https://www.usbank.com/business-banking/business-financing/equipment-financing.html",
    ctaLabel: "Apply with U.S. Bank",
  },

  {
    id: "wintrust-equipment",
    provider: "Wintrust Equipment Finance",
    programName: "Clean Energy Equipment Lease/Loan",
    type: "equipment_finance",
    typeLabel: "Equipment Finance",
    typeColor: "text-orange-300",
    typeBadge: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    rateDisplay: "7–9.5%",
    rateForCalc: 8.0,
    termDisplay: "2–7 yrs",
    termYearsForCalc: 5,
    minProjectSizeK: 250,
    regions: ["US"],
    sectors: ["commercial", "industrial"],
    requirements: ["2+ years operating history", "Equipment as primary collateral"],
    highlights: ["Midwest-based bank with national reach", "Quick approvals for smaller projects"],
    fullyCovered: false,
    url: "https://www.wintrustequipmentfinance.com",
    ctaLabel: "Get a Quote",
  },

  // ── PPA / THIRD-PARTY OWNERSHIP ─────────────────────────────────────────────

  {
    id: "generate-capital",
    provider: "Generate Capital",
    programName: "Energy-as-a-Service (EaaS) / PPA",
    type: "ppa_lease",
    typeLabel: "PPA / EaaS",
    typeColor: "text-cyan-300",
    typeBadge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    rateDisplay: "Fixed $/kWh (no capital outlay)",
    rateForCalc: null,
    termDisplay: "15–25 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 500,
    regions: ["US"],
    sectors: ["commercial", "industrial", "agricultural"],
    requirements: [
      "Investment-grade or near-investment-grade credit",
      "Long-term operational commitment (15+ yr site)",
      "Project size $500K+",
    ],
    highlights: [
      "$0 upfront — Generate owns and operates the system",
      "You pay only for the energy produced",
      "Includes O&M, monitoring, and performance guarantee",
    ],
    fullyCovered: true,
    url: "https://generatecapital.com",
    ctaLabel: "Explore EaaS Structure",
  },

  {
    id: "constellation-ppa",
    provider: "Constellation / Exelon",
    programName: "Commercial On-Site Solar PPA",
    type: "ppa_lease",
    typeLabel: "PPA",
    typeColor: "text-cyan-300",
    typeBadge: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    rateDisplay: "Fixed below-utility rate/kWh",
    rateForCalc: null,
    termDisplay: "10–25 yrs",
    termYearsForCalc: 20,
    minProjectSizeK: 1000,
    regions: ["US"],
    sectors: ["commercial", "industrial", "hospitality", "healthcare"],
    requirements: [
      "Strong credit (investment grade preferred)",
      "Roof/land control for 20+ years",
      "Minimum ~250 kW system size",
    ],
    highlights: [
      "Lock in energy costs below current utility rate",
      "Constellation handles installation, insurance, and O&M",
      "Includes storage integration option",
    ],
    fullyCovered: true,
    url: "https://www.constellation.com/solutions/for-your-business/clean-energy/solar.html",
    ctaLabel: "Request PPA Quote",
  },

  // ── CDFI / MISSION-DRIVEN ────────────────────────────────────────────────────

  {
    id: "reinvestment-fund",
    provider: "Reinvestment Fund",
    programName: "Clean Energy Loan (Underserved Communities)",
    type: "green_bank",
    typeLabel: "CDFI Lender",
    typeColor: "text-emerald-300",
    typeBadge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    rateDisplay: "Below market (~4–6.5%)",
    rateForCalc: 5.25,
    termDisplay: "up to 20 yrs",
    termYearsForCalc: 15,
    minProjectSizeK: 500,
    regions: ["US"],
    sectors: ["commercial", "multifamily", "healthcare", "educational"],
    requirements: [
      "Project serves low-to-moderate income communities",
      "Demonstrated community benefit",
    ],
    highlights: [
      "IRA §48 Low-income Community ITC adder (up to +20%)",
      "Flexible underwriting for mission-driven projects",
      "Pairs with EPA Environmental Justice grants",
    ],
    fullyCovered: false,
    url: "https://www.reinvestment.com/clean-energy",
    ctaLabel: "Contact Reinvestment Fund",
  },
];

// ── Filtering logic ──────────────────────────────────────────────────────────

export interface FinancingFilter {
  /** Net project cost after ITC, in dollars */
  netCostDollars: number;
  /** 2-letter state code, e.g. "CA" */
  stateCode?: string;
  /** WizardState industry slug, e.g. "hotel" */
  industrySlug?: string;
}

/**
 * Returns financing options matched to the project, sorted by relevance:
 * 1. State-specific programs first (most relevant)
 * 2. Federal programs
 * 3. C-PACE
 * 4. Bank loans / equipment finance
 * 5. PPA / Lease
 */
export function getMatchedFinancingOptions(filter: FinancingFilter): FinancingOption[] {
  const netCostK = filter.netCostDollars / 1000;
  const state = filter.stateCode?.toUpperCase() ?? "";
  const sectors = getSectorsForIndustry(filter.industrySlug);

  const matched = FINANCING_DATABASE.filter((opt) => {
    // Size check
    if (netCostK < opt.minProjectSizeK) return false;
    if (opt.maxProjectSizeK && netCostK > opt.maxProjectSizeK) return false;

    // Region check
    const stateMatch = opt.regions.includes("US") || (state && opt.regions.includes(state));
    if (!stateMatch) return false;

    // Sector check
    const sectorMatch = opt.sectors.includes("all") || opt.sectors.some((s) => sectors.includes(s));
    if (!sectorMatch) return false;

    return true;
  });

  // Sort: state-specific → federal → cpace → green_bank → bank_loan → equipment_finance → ppa_lease
  const ORDER: FinancingType[] = [
    "state_program",
    "federal",
    "cpace",
    "green_bank",
    "bank_loan",
    "equipment_finance",
    "ppa_lease",
  ];

  matched.sort((a, b) => {
    // State-specific options always float to top
    const aIsState = a.regions.length === 1 && a.regions[0] !== "US" && a.regions.includes(state);
    const bIsState = b.regions.length === 1 && b.regions[0] !== "US" && b.regions.includes(state);
    if (aIsState && !bIsState) return -1;
    if (!aIsState && bIsState) return 1;
    return ORDER.indexOf(a.type) - ORDER.indexOf(b.type);
  });

  return matched;
}
