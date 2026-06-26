/**
 * Opportunity Discovery Types
 * Data models for lead generation and business opportunity tracking
 */

export type OpportunitySignal =
  | "construction"
  | "expansion"
  | "new_opening"
  | "funding"
  | "acquisition"
  | "sustainability_initiative"
  | "energy_upgrade"
  | "facility_upgrade"
  | "rfq"
  | "energy_project"
  | "high_utility_exposure"
  // Equipment-specific procurement signals (Phase 2)
  | "bess_procurement"
  | "solar_procurement"
  | "generator_procurement"
  // Phase 3 — permit + interconnection signals
  | "permit_filed"
  | "interconnection_application"
  // Phase 4 — BESS co-sell + advanced procurement signals
  | "microgrid_procurement"
  | "virtual_power_plant"
  | "c_and_i_solar";

export type OpportunityStatus = "new" | "contacted" | "qualified" | "archived";

export type IndustryType =
  | "data_center"
  | "manufacturing"
  | "logistics"
  | "hospitality"
  | "healthcare"
  | "retail"
  | "education"
  | "automotive"
  // Extended verticals (Phase 2)
  | "cold_storage"
  | "car_wash"
  | "truck_stop"
  | "hospital"
  | "agricultural"
  | "gym"
  | "energy"
  | "government"
  | "other";

export interface Opportunity {
  id: string;
  company_name: string;
  description: string;
  source_url: string;
  source_name: string;
  signals: OpportunitySignal[];
  industry?: IndustryType;
  location?: string;
  confidence_score: number; // 0-100
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  contacted_at?: string;
  notes?: string;
  opportunity_assessment?: import("../services/opportunityAssessmentService").OppAssessment | null;
}

export interface LeadSource {
  id: string;
  name: string;
  type: "rss" | "api" | "manual";
  url: string;
  enabled: boolean;
  last_checked?: string;
  keywords: string[];
}

export interface OpportunityFilter {
  industry?: IndustryType[];
  signals?: OpportunitySignal[];
  status?: OpportunityStatus[];
  minConfidence?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ScraperResult {
  opportunities: Opportunity[];
  source: string;
  timestamp: string;
  total_found: number;
  duplicates_skipped: number;
}
