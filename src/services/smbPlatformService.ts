/**
 * SMB PLATFORM SERVICE
 * ====================
 *
 * "Powered by Merlin Smart Energy"
 *
 * Central service that powers ALL SMB vertical sites:
 * - carwashenergy.com
 * - laundromatenergy.com
 * - restaurantenergy.com
 * - etc.
 *
 * Each vertical site uses this shared service for:
 * - Calculation constants (from database - single source of truth)
 * - Quote generation (using unifiedQuoteCalculator)
 * - Lead capture (unified database)
 * - Power Profile gamification
 *
 * ARCHITECTURE:
 * - SMB sites are lightweight frontends
 * - All business logic lives in Merlin's Supabase
 * - Constants can be updated in DB without code deploy
 */

import { supabase } from "./supabaseClient";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};
import { calculateQuote } from "./unifiedQuoteCalculator";
import { calculateFinancialMetrics } from "./centralizedCalculations";
import {
  getGeographicRecommendations,
  getRegionalElectricityRate,
} from "./geographicIntelligenceService";

// ============================================
// TYPES
// ============================================

export interface SMBSiteConfig {
  slug: string;
  domain: string;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  industryCategory: string;
  useCaseSlug: string;
  features: {
    showSolar: boolean;
    showWind: boolean;
    showGenerator: boolean;
    showEV: boolean;
    showFinancing: boolean;
    showMarketIntelligence: boolean;
  };
}

export interface CalculationConstants {
  // Pricing
  batteryCostPerKwhSmall: number;
  batteryCostPerKwhMedium: number;
  batteryCostPerKwhLarge: number;
  solarCostPerWatt: number;
  inverterCostPerKw: number;
  installationPercentage: number;

  // Financial
  federalItcRate: number;
  discountRate: number;
  projectLifetimeYears: number;
  batteryDegradationRate: number;
  electricityEscalationRate: number;

  // Sizing
  peakShavingTargetPercent: number;
  backupHoursMinimum: number;
  backupHoursRecommended: number;
  solarToStorageRatio: number;
}

export interface IndustryPowerProfile {
  industrySlug: string;
  typicalPeakDemandKw: number;
  typicalMonthlyKwh: number;
  peakDemandTiming: string;
  loadProfileType: string;
  recommendedBatteryKwhPerUnit: number;
  recommendedBackupHours: number;
  recommendedSolarKwPerUnit: number;
  unitName: string;
  unitPlural: string;
  avgElectricityRate: number;
  avgDemandCharge: number;
  typicalPaybackYears: number;
}

export interface SMBLead {
  siteSlug: string;
  email?: string;
  phone?: string;
  companyName?: string;
  contactName?: string;
  zipCode?: string;
  state?: string;
  businessData: Record<string, any>;
  quoteSummary?: Record<string, any>;
  powerProfileLevel?: number;
  powerProfilePoints?: number;
}

export interface SMBQuoteInput {
  // Site context
  siteSlug: string;

  // Location
  zipCode: string;
  state: string;

  // Industry-specific inputs
  unitCount: number; // Number of bays, machines, rooms, etc.
  operatingHoursPerDay: number;
  daysPerWeek: number;

  // Optional overrides
  peakDemandKw?: number;
  monthlyKwh?: number;
  electricityRate?: number;

  // Add-ons
  wantsSolar?: boolean;
  wantsGenerator?: boolean;
  wantsEV?: boolean;
  evPortCount?: number;
}

// ============================================
// CONSTANTS CACHE (with database refresh)
// ============================================

let constantsCache: CalculationConstants | null = null;
let constantsCacheTime: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Default constants (fallback if database unavailable)
const DEFAULT_CONSTANTS: CalculationConstants = {
  batteryCostPerKwhSmall: 350,
  batteryCostPerKwhMedium: 300,
  batteryCostPerKwhLarge: 250,
  solarCostPerWatt: 2.5,
  inverterCostPerKw: 150,
  installationPercentage: 0.15,
  federalItcRate: 0.3,
  discountRate: 0.08,
  projectLifetimeYears: 25,
  batteryDegradationRate: 0.02,
  electricityEscalationRate: 0.03,
  peakShavingTargetPercent: 0.3,
  backupHoursMinimum: 2,
  backupHoursRecommended: 4,
  solarToStorageRatio: 0.25,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get calculation constants from database (with caching)
 */
export async function getCalculationConstants(): Promise<CalculationConstants> {
  // Return cache if fresh
  if (constantsCache && Date.now() - constantsCacheTime < CACHE_TTL_MS) {
    return constantsCache;
  }

  if (!isSupabaseConfigured()) {
    console.warn("[SMBPlatform] Supabase not configured, using defaults");
    return DEFAULT_CONSTANTS;
  }

  try {
    const { data, error } = await supabase
      .from("calculation_constants")
      .select("key, value_numeric")
      .in("category", ["pricing", "financial", "sizing"]);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("[SMBPlatform] No constants in database, using defaults");
      return DEFAULT_CONSTANTS;
    }

    // Map database rows to constants object
    const constants: CalculationConstants = { ...DEFAULT_CONSTANTS };

    data.forEach((row: { key: string; value_numeric: number }) => {
      switch (row.key) {
        case "battery_cost_per_kwh_small":
          constants.batteryCostPerKwhSmall = row.value_numeric;
          break;
        case "battery_cost_per_kwh_medium":
          constants.batteryCostPerKwhMedium = row.value_numeric;
          break;
        case "battery_cost_per_kwh_large":
          constants.batteryCostPerKwhLarge = row.value_numeric;
          break;
        case "solar_cost_per_watt":
          constants.solarCostPerWatt = row.value_numeric;
          break;
        case "inverter_cost_per_kw":
          constants.inverterCostPerKw = row.value_numeric;
          break;
        case "installation_percentage":
          constants.installationPercentage = row.value_numeric;
          break;
        case "federal_itc_rate":
          constants.federalItcRate = row.value_numeric;
          break;
        case "discount_rate":
          constants.discountRate = row.value_numeric;
          break;
        case "project_lifetime_years":
          constants.projectLifetimeYears = row.value_numeric;
          break;
        case "battery_degradation_rate":
          constants.batteryDegradationRate = row.value_numeric;
          break;
        case "electricity_escalation_rate":
          constants.electricityEscalationRate = row.value_numeric;
          break;
        case "peak_shaving_target_percent":
          constants.peakShavingTargetPercent = row.value_numeric;
          break;
        case "backup_hours_minimum":
          constants.backupHoursMinimum = row.value_numeric;
          break;
        case "backup_hours_recommended":
          constants.backupHoursRecommended = row.value_numeric;
          break;
        case "solar_to_storage_ratio":
          constants.solarToStorageRatio = row.value_numeric;
          break;
      }
    });

    // Update cache
    constantsCache = constants;
    constantsCacheTime = Date.now();

    console.log("[SMBPlatform] Constants loaded from database");
    return constants;
  } catch (error) {
    console.error("[SMBPlatform] Error loading constants:", error);
    return DEFAULT_CONSTANTS;
  }
}

/**
 * Get industry power profile from database
 */
export async function getIndustryPowerProfile(
  industrySlug: string
): Promise<IndustryPowerProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("industry_power_profiles")
      .select("*")
      .eq("industry_slug", industrySlug)
      .single();

    if (error) {
      console.error("[SMBPlatform] Error loading industry profile:", error);
      return null;
    }

    return {
      industrySlug: data.industry_slug,
      typicalPeakDemandKw: data.typical_peak_demand_kw,
      typicalMonthlyKwh: data.typical_monthly_kwh,
      peakDemandTiming: data.peak_demand_timing,
      loadProfileType: data.load_profile_type,
      recommendedBatteryKwhPerUnit: data.recommended_battery_kwh_per_unit,
      recommendedBackupHours: data.recommended_backup_hours,
      recommendedSolarKwPerUnit: data.recommended_solar_kw_per_unit,
      unitName: data.unit_name,
      unitPlural: data.unit_plural,
      avgElectricityRate: data.avg_electricity_rate,
      avgDemandCharge: data.avg_demand_charge,
      typicalPaybackYears: data.typical_payback_years,
    };
  } catch (error) {
    console.error("[SMBPlatform] Error:", error);
    return null;
  }
}

/**
 * Get SMB site configuration
 */
export async function getSiteConfig(siteSlug: string): Promise<SMBSiteConfig | null> {
  if (!isSupabaseConfigured()) {
    // Return hardcoded config for development
    if (siteSlug === "carwash") {
      return {
        slug: "carwash",
        domain: "carwashenergy.com",
        name: "Car Wash Energy Solutions",
        tagline: "Battery Energy Solutions for Car Washes",
        primaryColor: "#06b6d4",
        secondaryColor: "#8b5cf6",
        industryCategory: "Automotive Services",
        useCaseSlug: "car-wash",
        features: {
          showSolar: true,
          showWind: false,
          showGenerator: true,
          showEV: true,
          showFinancing: true,
          showMarketIntelligence: true,
        },
      };
    }
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("smb_sites")
      .select("*")
      .eq("slug", siteSlug)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;

    return {
      slug: data.slug,
      domain: data.domain,
      name: data.name,
      tagline: data.tagline,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      logoUrl: data.logo_url,
      industryCategory: data.industry_category,
      useCaseSlug: data.use_case_slug,
      features: data.features,
    };
  } catch (error) {
    console.error("[SMBPlatform] Error loading site config:", error);
    return null;
  }
}

/**
 * Generate quote for SMB site
 * Uses the unified quote calculator with industry-specific defaults
 */
export async function generateSMBQuote(input: SMBQuoteInput) {
  console.log("[SMBPlatform] Generating quote for", input.siteSlug);

  // Get calculation constants from database
  const constants = await getCalculationConstants();

  // Get industry power profile
  const industryProfile = await getIndustryPowerProfile(input.siteSlug);

  // Get geographic recommendations
  const geoRecommendations = getGeographicRecommendations(input.state);
  const regionalRate = input.electricityRate || getRegionalElectricityRate(input.state);

  // Calculate power requirements
  const peakDemandKw =
    input.peakDemandKw ||
    (industryProfile
      ? industryProfile.typicalPeakDemandKw * (input.unitCount / 5)
      : 100 * input.unitCount);

  const monthlyKwh =
    input.monthlyKwh ||
    (industryProfile
      ? industryProfile.typicalMonthlyKwh * (input.unitCount / 5)
      : 5000 * input.unitCount);

  // Determine storage size based on peak demand and backup needs
  const backupHours = industryProfile?.recommendedBackupHours || constants.backupHoursRecommended;
  const storageKwh = peakDemandKw * backupHours;
  const storageMw = storageKwh / 1000;

  // Calculate solar if requested
  let solarMw = 0;
  if (input.wantsSolar && geoRecommendations.recommendations.solar.recommended) {
    solarMw = industryProfile
      ? (industryProfile.recommendedSolarKwPerUnit * input.unitCount) / 1000
      : storageMw * constants.solarToStorageRatio;
  }

  // Use unified quote calculator
  const quote = await calculateQuote({
    storageSizeMW: storageMw,
    durationHours: backupHours,
    solarMW: solarMw,
    electricityRate: regionalRate,
    location: input.state,
  });

  // Calculate financial metrics
  const financials = await calculateFinancialMetrics({
    storageSizeMW: storageMw,
    durationHours: backupHours,
    electricityRate: regionalRate,
    solarMW: solarMw,
    location: input.state,
    includeNPV: true,
  });

  return {
    // Input summary
    input: {
      siteSlug: input.siteSlug,
      state: input.state,
      zipCode: input.zipCode,
      unitCount: input.unitCount,
      unitName: industryProfile?.unitName || "unit",
    },

    // System sizing
    sizing: {
      peakDemandKw,
      monthlyKwh,
      storageKwh,
      storageMw,
      solarKw: solarMw * 1000,
      backupHours,
    },

    // Quote from unified calculator
    quote,

    // Financial metrics
    financials,

    // Geographic context
    geographic: {
      state: input.state,
      electricityRate: regionalRate,
      solarRecommended: geoRecommendations.recommendations.solar.recommended,
      solarReason: geoRecommendations.recommendations.solar.reason,
      gridReliability: geoRecommendations.profile.gridReliabilityScore,
    },

    // Constants used (for transparency)
    constantsUsed: {
      itcRate: constants.federalItcRate,
      discountRate: constants.discountRate,
      projectLifetime: constants.projectLifetimeYears,
    },

    // Powered by Merlin branding
    poweredBy: {
      name: "Merlin Smart Energy",
      url: "https://merlinenergy.com",
      version: "2.0",
    },
  };
}

/**
 * Save lead from SMB site
 */
export async function saveSMBLead(
  lead: SMBLead
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.warn("[SMBPlatform] Supabase not configured, lead not saved");
    return { success: false, error: "Database not configured" };
  }

  try {
    const { data, error } = await supabase
      .from("smb_leads")
      .insert({
        site_slug: lead.siteSlug,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.companyName,
        contact_name: lead.contactName,
        zip_code: lead.zipCode,
        state: lead.state,
        business_data: lead.businessData,
        quote_summary: lead.quoteSummary,
        power_profile_level: lead.powerProfileLevel || 1,
        power_profile_points: lead.powerProfilePoints || 0,
      })
      .select("id")
      .single();

    if (error) throw error;

    console.log("[SMBPlatform] Lead saved:", data.id);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("[SMBPlatform] Error saving lead:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get or create power profile for anonymous user
 */
export async function getOrCreatePowerProfile(anonymousId: string): Promise<{
  level: number;
  points: number;
  completedChecks: string[];
}> {
  const defaultProfile = { level: 1, points: 0, completedChecks: [] };

  if (!isSupabaseConfigured()) {
    return defaultProfile;
  }

  try {
    // Try to get existing profile
    const { data: existing } = await supabase
      .from("power_profiles")
      .select("level, points, completed_checks")
      .eq("anonymous_id", anonymousId)
      .single();

    if (existing) {
      return {
        level: existing.level,
        points: existing.points,
        completedChecks: existing.completed_checks || [],
      };
    }

    // Create new profile
    const { data: created, error } = await supabase
      .from("power_profiles")
      .insert({ anonymous_id: anonymousId })
      .select("level, points, completed_checks")
      .single();

    if (error) throw error;

    return {
      level: created.level,
      points: created.points,
      completedChecks: created.completed_checks || [],
    };
  } catch (error) {
    console.error("[SMBPlatform] Error with power profile:", error);
    return defaultProfile;
  }
}

/**
 * Update power profile
 */
export async function updatePowerProfile(
  anonymousId: string,
  updates: { points?: number; level?: number; completedChecks?: string[] }
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from("power_profiles")
      .update({
        points: updates.points,
        level: updates.level,
        completed_checks: updates.completedChecks,
        last_activity_at: new Date().toISOString(),
      })
      .eq("anonymous_id", anonymousId);

    return !error;
  } catch (error) {
    console.error("[SMBPlatform] Error updating power profile:", error);
    return false;
  }
}

/**
 * Quick estimate for UI (fast, no database)
 */
export function quickEstimate(input: { unitCount: number; state: string; industrySlug?: string }): {
  estimatedStorageKwh: number;
  estimatedMonthlySavings: number;
  estimatedPaybackYears: number;
} {
  // Use defaults for quick estimate
  const kwPerUnit = input.industrySlug === "car-wash" ? 30 : 20;
  const hoursBackup = 4;

  const storageKwh = input.unitCount * kwPerUnit * hoursBackup;
  const rate = getRegionalElectricityRate(input.state);

  // Rough estimate: 20% savings on demand charges + 10% on energy
  const monthlySavings = (storageKwh * rate * 0.3 * 30) / hoursBackup;

  // Rough cost estimate
  const cost = storageKwh * 350;
  const netCost = cost * 0.7; // After ITC
  const paybackYears = netCost / (monthlySavings * 12);

  return {
    estimatedStorageKwh: Math.round(storageKwh),
    estimatedMonthlySavings: Math.round(monthlySavings),
    estimatedPaybackYears: Math.round(paybackYears * 10) / 10,
  };
}

// Export for use
export default {
  getCalculationConstants,
  getIndustryPowerProfile,
  getSiteConfig,
  generateSMBQuote,
  saveSMBLead,
  getOrCreatePowerProfile,
  updatePowerProfile,
  quickEstimate,
};
