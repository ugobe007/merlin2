/**
 * Solar Sizing Platform Integration Service
 * ==========================================
 *
 * Unified interface for importing solar design data from third-party
 * solar design and sizing platforms into Merlin's quoting engine.
 *
 * SUPPORTED PLATFORMS:
 *   • Aurora Solar      — Commercial/residential PV design, shade analysis
 *   • HelioScope        — C&I engineering, shading reports, single-line diagrams
 *   • OpenSolar         — Free web-based design, proposal + project management
 *   • Solargraf         — Cloud proposals, AHJ permit packages
 *   • EagleView TrueDesign — Aerial imagery, automated PV layout
 *   • Scanifly          — Drone 3D models, as-built documentation
 *   • PV*SOL            — 3D performance simulation, shading engine
 *   • SolarAPP+         — Non-profit AHJ permitting compliance tool
 *
 * INTEGRATION MODEL:
 *   Most platforms do not expose public REST APIs — they provide:
 *     (a) Webhook callbacks when a project is exported
 *     (b) PDF/JSON report exports from their UI
 *     (c) Partner API access (requires account + agreement)
 *
 *   This service handles all three:
 *     1. importFromWebhook(platform, payload)  — receives platform push
 *     2. importFromJSON(platform, data)        — parses their export format
 *     3. importFromPDF(platform, text)         — extracts from parsed PDF
 *
 *   All paths normalize to SolarDesignImport, which is then passed to
 *   TrueQuoteEngine-Solar.ts via applyPlatformDesign().
 *
 * API KEY STORAGE:
 *   Platform API keys are stored in the Supabase `solar_sizing_platform_keys`
 *   table (see migration 20260401_solar_sizing_platform_integrations.sql).
 *   Keys are fetched at runtime — never hardcoded.
 *
 * Created: April 1, 2026
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { geocodeLocation } from "./geocodingService";

// ============================================================================
// GOOGLE SOLAR API  (uses existing VITE_GOOGLE_MAPS_API_KEY)
// Solar API must be enabled in Google Cloud Console for the same key.
// Docs: https://developers.google.com/maps/documentation/solar
// ============================================================================

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ?? "";
const GOOGLE_SOLAR_ENDPOINT = "https://solar.googleapis.com/v1";

/**
 * Typical residential/commercial panel specs assumed when Google Solar doesn't
 * specify a model — used for panel count → kW conversion.
 */
const GOOGLE_SOLAR_DEFAULT_PANEL_W = 400; // Wp — standard 400W panel

/** Raw shape of a Google Solar API buildingInsights response */
interface GoogleSolarBuildingInsights {
  name: string;
  center: { latitude: number; longitude: number };
  imageryQuality: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    wholeRoofStats: {
      areaMeters2: number;
      groundAreaMeters2: number;
    };
    solarPanelConfigs: Array<{
      panelsCount: number;
      yearlyEnergyDcKwh: number;
    }>;
  };
}

/**
 * Parse a Google Solar API buildingInsights response into SolarDesignImport.
 * Picks the config closest to 80% of max panels (typical commercial target).
 */
function parseGoogleSolar(
  data: GoogleSolarBuildingInsights,
  address?: string
): Partial<SolarDesignImport> {
  const sp = data.solarPotential;
  const configs = sp.solarPanelConfigs ?? [];

  // Pick the config at ~80% of max panels — practical commercial target
  const targetPanels = Math.round(sp.maxArrayPanelsCount * 0.8);
  const bestConfig =
    configs.find((c) => c.panelsCount <= targetPanels) ??
    configs[Math.floor(configs.length * 0.8)] ??
    configs[configs.length - 1];

  const panelCount = bestConfig?.panelsCount ?? sp.maxArrayPanelsCount;
  const systemKw = (panelCount * GOOGLE_SOLAR_DEFAULT_PANEL_W) / 1000;
  const annualKwh = bestConfig?.yearlyEnergyDcKwh;
  const roofAreaSqFt = sp.maxArrayAreaMeters2 * 10.764; // m² → sqft
  const sunHoursPerYear = sp.maxSunshineHoursPerYear;

  return {
    platformProjectId: data.name,
    address,
    lat: data.center.latitude,
    lon: data.center.longitude,
    systemSizeDC_kW: systemKw,
    numberOfPanels: panelCount,
    panelWattage: GOOGLE_SOLAR_DEFAULT_PANEL_W,
    roofAreaUsedSqFt: roofAreaSqFt,
    annualProductionKWh: annualKwh,
    // Derive effective daily sun hours from annual production ÷ system size ÷ 365
    specificYieldKwh_per_kWp: annualKwh && systemKw ? annualKwh / systemKw : sunHoursPerYear / 365,
  };
}

/**
 * Fetch Google Solar building insights for a given lat/lng.
 * Returns a SolarDesignImport or null if the API call fails or key is missing.
 *
 * The VITE_GOOGLE_MAPS_API_KEY must have the **Solar API** product enabled:
 *   Google Cloud Console → APIs & Services → Enable → Solar API
 */
export async function fetchFromGoogleSolar(
  lat: number,
  lng: number,
  address?: string
): Promise<SolarDesignImport | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("⚠️ Google Solar: VITE_GOOGLE_MAPS_API_KEY not set");
    return null;
  }

  try {
    const params = new URLSearchParams({
      "location.latitude": String(lat),
      "location.longitude": String(lng),
      requiredQuality: "LOW", // LOW accepts any imagery quality — HIGH may 404 in some regions
      key: GOOGLE_MAPS_API_KEY,
    });

    const res = await fetch(
      `${GOOGLE_SOLAR_ENDPOINT}/buildingInsights:findClosest?${params.toString()}`
    );

    if (res.status === 404) {
      // No solar data for this location (rural, canopy coverage, etc.)
      console.info("ℹ️ Google Solar: no building data found for", lat, lng);
      return null;
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => res.statusText);
      // 403 → Solar API not enabled on the key — log clearly
      if (res.status === 403) {
        console.warn(
          "⚠️ Google Solar API: 403 Forbidden — enable 'Solar API' in Google Cloud Console for VITE_GOOGLE_MAPS_API_KEY",
          errBody
        );
      } else {
        console.error(`❌ Google Solar API: ${res.status}`, errBody);
      }
      return null;
    }

    const data = (await res.json()) as GoogleSolarBuildingInsights;
    const partial = parseGoogleSolar(data, address);

    return {
      platform: "aurora_solar" as SolarSizingPlatform, // reuse closest type; tagged via platformProjectId
      platformProjectId: `google_solar:${data.name}`,
      importedAt: new Date().toISOString(),
      systemSizeDC_kW: 0,
      ...partial,
      rawPayload: data,
    } as SolarDesignImport;
  } catch (err) {
    console.error("❌ Google Solar fetch failed:", err);
    return null;
  }
}

/**
 * Geocode a US ZIP code then fetch Google Solar building insights.
 * Returns null if geocoding fails or solar data unavailable.
 */
export async function fetchGoogleSolarByZip(
  zipCode: string,
  state?: string
): Promise<SolarDesignImport | null> {
  const query = state ? `${zipCode}, ${state}` : zipCode;
  const geo = await geocodeLocation(query);
  if (!geo) {
    console.warn("⚠️ Google Solar: could not geocode", query);
    return null;
  }
  return fetchFromGoogleSolar(geo.lat, geo.lon, geo.formattedAddress);
}

/**
 * Check if the Google Solar API is accessible (key exists + Solar API enabled).
 * Returns true on success, false on 403/missing key.
 */
export async function isGoogleSolarEnabled(): Promise<boolean> {
  if (!GOOGLE_MAPS_API_KEY) return false;
  // Use a known-good coordinate (Mountain View, CA — Google HQ)
  const res = await fetchFromGoogleSolar(37.422, -122.0841);
  return res !== null;
}

// ============================================================================
// PLATFORM IDENTIFIERS
// ============================================================================

export type SolarSizingPlatform =
  | "aurora_solar"
  | "helioscope"
  | "opensolar"
  | "solargraf"
  | "eagleview_truedesign"
  | "scanifly"
  | "pvsol"
  | "solarapp_plus";

export const PLATFORM_DISPLAY_NAMES: Record<SolarSizingPlatform, string> = {
  aurora_solar: "Aurora Solar",
  helioscope: "HelioScope",
  opensolar: "OpenSolar",
  solargraf: "Solargraf",
  eagleview_truedesign: "EagleView TrueDesign",
  scanifly: "Scanifly",
  pvsol: "PV*SOL",
  solarapp_plus: "SolarAPP+",
};

// ============================================================================
// UNIFIED SOLAR DESIGN IMPORT FORMAT
// ============================================================================

/**
 * Normalized solar design data from any platform.
 * All platform-specific parsers map their output to this structure.
 * Fields are optional so partial imports work gracefully.
 */
export interface SolarDesignImport {
  // Source metadata
  platform: SolarSizingPlatform;
  platformProjectId?: string;
  platformProjectUrl?: string;
  importedAt: string; // ISO timestamp

  // Location
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lat?: number;
  lon?: number;

  // System sizing (DC-side)
  systemSizeDC_kW: number; // Total DC array size (kW)
  systemSizeAC_kW?: number; // AC inverter output (kW)
  numberOfPanels?: number;
  panelWattage?: number; // Wp per panel
  panelManufacturer?: string;
  panelModel?: string;
  panelEfficiencyPct?: number;

  // Roof / array geometry
  roofAreaUsedSqFt?: number; // Actual roof area covered by panels
  azimuthDegrees?: number; // Primary array azimuth (180 = south)
  tiltDegrees?: number; // Array tilt
  isGroundMount?: boolean;
  isCarport?: boolean;

  // Production estimates
  annualProductionKWh?: number; // Year 1 AC production
  specificYieldKwh_per_kWp?: number; // kWh/kWp/yr
  performanceRatio?: number; // PR (%) — typical 0.75–0.85
  capacityFactorPct?: number;

  // Shading
  shadingLossPct?: number;
  tsrfPct?: number; // Total Solar Resource Fraction (%)

  // Financial (from platform's proposal, if exported)
  equipmentCostUSD?: number;
  totalProjectCostUSD?: number;
  costPerWattDC?: number;

  // Inverter
  inverterManufacturer?: string;
  inverterModel?: string;
  inverterType?: "string" | "microinverter" | "optimizer" | "central";

  // Permitting (SolarAPP+ specific)
  permitStatus?: "compliant" | "review_required" | "not_checked";
  permitCode?: string;
  permitNotes?: string;

  // Raw payload (preserved for audit)
  rawPayload?: unknown;
}

// ============================================================================
// PLATFORM-SPECIFIC PARSERS
// ============================================================================

/**
 * Aurora Solar
 * API: https://developer.aurorasolar.com/
 * Auth: OAuth 2.0 Bearer token — requires Aurora partner account
 * Webhooks: Aurora pushes `design.published` events with project JSON
 */
function parseAuroraSolar(data: Record<string, unknown>): Partial<SolarDesignImport> {
  // Aurora Solar API v2 design object shape
  const design = (data.design as Record<string, unknown>) ?? data;
  const panels = (design.panels as unknown[]) ?? [];
  const inverters = (design.inverters as Record<string, unknown>[]) ?? [];

  const systemKw = Number(design.system_size_dc ?? design.dc_system_size_w ?? 0) / 1000 || 0;
  const production = design.annual_energy_production ?? design.energy_production_year1;

  return {
    platformProjectId: String(design.project_id ?? design.id ?? ""),
    platformProjectUrl: design.project_url ? String(design.project_url) : undefined,
    systemSizeDC_kW: systemKw || Number(design.capacity_kw ?? 0),
    systemSizeAC_kW: Number(design.ac_system_size_kw ?? 0) || undefined,
    numberOfPanels: panels.length || Number(design.panel_count ?? 0) || undefined,
    panelWattage: Number(design.panel_wattage ?? design.module_watt_class ?? 0) || undefined,
    panelManufacturer: String(design.panel_manufacturer ?? design.module_manufacturer ?? ""),
    panelModel: String(design.panel_model ?? design.module_model ?? ""),
    annualProductionKWh: Number(production ?? 0) || undefined,
    shadingLossPct: Number(design.shading_loss_pct ?? 0) || undefined,
    tsrfPct: Number(design.tsrf ?? 0) || undefined,
    azimuthDegrees: Number(design.azimuth ?? 180),
    tiltDegrees: Number(design.tilt ?? 20),
    inverterManufacturer: inverters[0]?.manufacturer
      ? String(inverters[0].manufacturer)
      : undefined,
    inverterModel: inverters[0]?.model ? String(inverters[0].model) : undefined,
    totalProjectCostUSD: Number(design.total_cost ?? 0) || undefined,
    costPerWattDC: Number(design.price_per_watt ?? 0) || undefined,
  };
}

/**
 * HelioScope
 * API: https://help.helioscope.com/hc/en-us (partner API, limited public access)
 * Auth: API key in X-HelioScope-ApiKey header
 * Exports: Project JSON or PDF report
 */
function parseHelioScope(data: Record<string, unknown>): Partial<SolarDesignImport> {
  // HelioScope project export JSON shape
  const project = (data.project as Record<string, unknown>) ?? data;
  const design = (project.design as Record<string, unknown>) ?? {};
  const results = (project.simulation_results as Record<string, unknown>) ?? {};

  return {
    platformProjectId: String(project.id ?? ""),
    systemSizeDC_kW: Number(design.system_size_dc_kwp ?? design.dc_capacity_kw ?? 0),
    systemSizeAC_kW: Number(design.ac_capacity_kw ?? 0) || undefined,
    numberOfPanels: Number(design.module_count ?? 0) || undefined,
    panelWattage: Number(design.module_watt_class ?? 0) || undefined,
    panelManufacturer: String(design.module_manufacturer ?? ""),
    panelModel: String(design.module_name ?? ""),
    annualProductionKWh: Number(results.annual_energy_kwh ?? results.yield_year1 ?? 0) || undefined,
    specificYieldKwh_per_kWp: Number(results.specific_yield ?? 0) || undefined,
    performanceRatio: Number(results.performance_ratio ?? 0) || undefined,
    shadingLossPct: Number(results.shading_loss_pct ?? 0) || undefined,
    azimuthDegrees: Number(design.azimuth ?? 180),
    tiltDegrees: Number(design.tilt ?? 20),
  };
}

/**
 * OpenSolar
 * API: https://app.opensolar.com/api/ (v1, free tier available)
 * Auth: Bearer token via OAuth
 * Webhooks: project.updated, project.design_updated
 */
function parseOpenSolar(data: Record<string, unknown>): Partial<SolarDesignImport> {
  const project = (data.project as Record<string, unknown>) ?? data;
  const system =
    (project.system as Record<string, unknown>) ??
    (project.systems as Record<string, unknown>[])?.[0] ??
    {};

  return {
    platformProjectId: String(project.id ?? ""),
    address: String(project.address ?? ""),
    city: String(project.city ?? ""),
    state: String(project.state ?? ""),
    zipCode: String(project.zip ?? ""),
    lat: Number(project.lat ?? 0) || undefined,
    lon: Number(project.lon ?? 0) || undefined,
    systemSizeDC_kW: Number(system.kwp ?? system.system_size_kwp ?? 0),
    systemSizeAC_kW: Number(system.kw_ac ?? 0) || undefined,
    numberOfPanels: Number(system.quantity ?? system.module_count ?? 0) || undefined,
    panelManufacturer: String(system.module_manufacturer ?? ""),
    panelModel: String(system.module_model ?? ""),
    annualProductionKWh: Number(system.output_annual_kwh ?? 0) || undefined,
    equipmentCostUSD: Number(project.equipment_cost ?? 0) || undefined,
    totalProjectCostUSD: Number(project.price ?? project.system_price ?? 0) || undefined,
  };
}

/**
 * Solargraf
 * API: Private — available to Solargraf Partners via partner portal
 * Auth: Partner API key
 * Exports: Project JSON (download from UI or webhook)
 */
function parseSolargraf(data: Record<string, unknown>): Partial<SolarDesignImport> {
  const project = (data.project as Record<string, unknown>) ?? data;
  const design = (project.design as Record<string, unknown>) ?? {};
  const production = (project.production as Record<string, unknown>) ?? {};

  return {
    platformProjectId: String(project.uuid ?? project.id ?? ""),
    address: String(project.address ?? ""),
    systemSizeDC_kW: Number(design.system_dc_size_kw ?? design.capacity_kw ?? 0),
    numberOfPanels: Number(design.panel_count ?? 0) || undefined,
    panelManufacturer: String(design.panel_manufacturer ?? ""),
    panelModel: String(design.panel_model ?? ""),
    annualProductionKWh: Number(production.annual_kwh ?? production.year1_kwh ?? 0) || undefined,
    tiltDegrees: Number(design.tilt ?? 20),
    azimuthDegrees: Number(design.azimuth ?? 180),
  };
}

/**
 * EagleView TrueDesign
 * API: https://eagleview.com/partner-api (enterprise/partner only)
 * Auth: OAuth 2.0 — requires EagleView partner agreement
 * Provides: Aerial imagery + automated PV layout JSON
 */
function parseEagleViewTrueDesign(data: Record<string, unknown>): Partial<SolarDesignImport> {
  const report = (data.report as Record<string, unknown>) ?? data;
  const system = (report.pv_system as Record<string, unknown>) ?? {};
  const structure = (report.roof_structure as Record<string, unknown>) ?? {};

  return {
    platformProjectId: String(report.report_id ?? report.order_id ?? ""),
    platformProjectUrl: String(report.report_url ?? ""),
    address: String(report.address ?? report.property_address ?? ""),
    lat: Number(report.latitude ?? 0) || undefined,
    lon: Number(report.longitude ?? 0) || undefined,
    systemSizeDC_kW: Number(system.total_dc_kw ?? system.system_size_kw ?? 0),
    numberOfPanels: Number(system.panel_count ?? system.module_count ?? 0) || undefined,
    panelWattage: Number(system.panel_watts ?? 0) || undefined,
    roofAreaUsedSqFt:
      Number(structure.usable_roof_sqft ?? structure.solar_area_sqft ?? 0) || undefined,
    azimuthDegrees: Number(system.primary_azimuth ?? 180),
    tiltDegrees: Number(system.primary_pitch_degrees ?? 20),
    shadingLossPct: Number(system.shading_factor_pct ?? 0) || undefined,
    annualProductionKWh: Number(system.annual_production_kwh ?? 0) || undefined,
  };
}

/**
 * Scanifly
 * API: https://scanifly.com/api (drone inspection platform)
 * Auth: API key — available to Scanifly Pro subscribers
 * Provides: Drone 3D models, measurements, shading reports, as-built docs
 */
function parseScanifly(data: Record<string, unknown>): Partial<SolarDesignImport> {
  const project = (data.project as Record<string, unknown>) ?? data;
  const measurements = (project.measurements as Record<string, unknown>) ?? {};
  const design = (project.design as Record<string, unknown>) ?? {};

  return {
    platformProjectId: String(project.id ?? project.project_id ?? ""),
    platformProjectUrl: String(project.project_url ?? ""),
    address: String(project.address ?? ""),
    lat: Number(project.latitude ?? 0) || undefined,
    lon: Number(project.longitude ?? 0) || undefined,
    systemSizeDC_kW: Number(design.system_size_kw ?? design.dc_capacity_kw ?? 0),
    numberOfPanels: Number(design.panel_count ?? 0) || undefined,
    roofAreaUsedSqFt:
      Number(measurements.usable_area_sqft ?? measurements.solar_area_sqft ?? 0) || undefined,
    shadingLossPct: Number(design.shade_loss_pct ?? 0) || undefined,
    azimuthDegrees: Number(design.azimuth ?? 180),
    tiltDegrees: Number(design.tilt ?? 20),
    annualProductionKWh: Number(design.annual_production_kwh ?? 0) || undefined,
    specificYieldKwh_per_kWp: Number(design.specific_yield_kwh_kwp ?? 0) || undefined,
  };
}

/**
 * PV*SOL
 * API: No public REST API — desktop software (Valentin Software GmbH)
 * Integration: Import via JSON/CSV export from PV*SOL Premium
 * File format: Project Export JSON (*.pvso or *.json)
 */
function parsePVSOL(data: Record<string, unknown>): Partial<SolarDesignImport> {
  // PV*SOL Premium export JSON structure
  const simulation =
    (data.Simulation as Record<string, unknown>) ??
    (data.simulation as Record<string, unknown>) ??
    {};
  const pv =
    (simulation.PVSystem as Record<string, unknown>) ??
    (simulation.pv_system as Record<string, unknown>) ??
    data;
  const results =
    (simulation.Results as Record<string, unknown>) ??
    (simulation.results as Record<string, unknown>) ??
    {};

  return {
    systemSizeDC_kW: Number(
      pv.InstalledPower_kWp ?? pv.installed_power_kwp ?? pv.system_size_kwp ?? 0
    ),
    systemSizeAC_kW: Number(pv.InverterPower_kW ?? pv.inverter_power_kw ?? 0) || undefined,
    numberOfPanels: Number(pv.ModuleCount ?? pv.module_count ?? 0) || undefined,
    panelWattage: Number(pv.ModulePower_Wp ?? pv.module_power_wp ?? 0) || undefined,
    panelManufacturer: String(pv.ModuleManufacturer ?? pv.module_manufacturer ?? ""),
    panelModel: String(pv.ModuleType ?? pv.module_type ?? ""),
    annualProductionKWh:
      Number(results.AnnualYield_kWh ?? results.annual_yield_kwh ?? 0) || undefined,
    specificYieldKwh_per_kWp:
      Number(results.SpecificYield_kWh_kWp ?? results.specific_yield ?? 0) || undefined,
    performanceRatio:
      Number(results.PerformanceRatio ?? results.performance_ratio ?? 0) || undefined,
    shadingLossPct: Number(results.ShadingLoss_pct ?? results.shading_loss_pct ?? 0) || undefined,
    azimuthDegrees: Number(pv.Orientation_deg ?? pv.azimuth ?? 180),
    tiltDegrees: Number(pv.Inclination_deg ?? pv.tilt ?? 20),
    inverterManufacturer: String(pv.InverterManufacturer ?? pv.inverter_manufacturer ?? ""),
    inverterModel: String(pv.InverterType ?? pv.inverter_type ?? ""),
  };
}

/**
 * SolarAPP+
 * Operated by: National Renewable Energy Laboratory (NREL)
 * API: https://help.solarapp.org/hc/en-us (limited API — permit check only)
 * Auth: API key — available to AHJ-approved installers
 * Purpose: Code compliance automated permit approval — does NOT size systems
 * NOTE: SolarAPP+ takes a design as INPUT and outputs permit status.
 *       The parser here reads the compliance response, not a design export.
 */
function parseSolarAPPPlus(data: Record<string, unknown>): Partial<SolarDesignImport> {
  const response = (data.permit_response as Record<string, unknown>) ?? data;
  const system =
    (response.system_details as Record<string, unknown>) ??
    (data.system as Record<string, unknown>) ??
    {};

  const statusRaw = String(response.status ?? response.compliance_status ?? "");
  let permitStatus: SolarDesignImport["permitStatus"] = "not_checked";
  if (statusRaw === "APPROVED" || statusRaw === "compliant") {
    permitStatus = "compliant";
  } else if (statusRaw === "REVIEW" || statusRaw === "review_required") {
    permitStatus = "review_required";
  }

  return {
    platformProjectId: String(response.application_id ?? response.permit_number ?? ""),
    systemSizeDC_kW: Number(system.system_size_dc_kw ?? system.pv_system_size_kwp ?? 0),
    numberOfPanels: Number(system.module_count ?? 0) || undefined,
    panelManufacturer: String(system.module_manufacturer ?? ""),
    panelModel: String(system.module_model ?? ""),
    inverterManufacturer: String(system.inverter_manufacturer ?? ""),
    inverterModel: String(system.inverter_model ?? ""),
    permitStatus,
    permitCode: String(response.permit_number ?? response.application_number ?? ""),
    permitNotes: String(response.notes ?? response.review_comments ?? ""),
    address: String(response.site_address ?? response.address ?? ""),
    state: String(response.state ?? ""),
    zipCode: String(response.zip_code ?? ""),
  };
}

// ============================================================================
// PLATFORM PARSER REGISTRY
// ============================================================================

const PLATFORM_PARSERS: Record<
  SolarSizingPlatform,
  (data: Record<string, unknown>) => Partial<SolarDesignImport>
> = {
  aurora_solar: parseAuroraSolar,
  helioscope: parseHelioScope,
  opensolar: parseOpenSolar,
  solargraf: parseSolargraf,
  eagleview_truedesign: parseEagleViewTrueDesign,
  scanifly: parseScanifly,
  pvsol: parsePVSOL,
  solarapp_plus: parseSolarAPPPlus,
};

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Import a solar design from a platform webhook payload or JSON export.
 *
 * @param platform - Which platform the data came from
 * @param data     - Raw JSON payload from webhook or file export
 * @returns Normalized SolarDesignImport, or null on failure
 */
export function importFromJSON(
  platform: SolarSizingPlatform,
  data: Record<string, unknown>
): SolarDesignImport | null {
  const parser = PLATFORM_PARSERS[platform];
  if (!parser) {
    console.error(`❌ solarSizingIntegration: no parser for platform "${platform}"`);
    return null;
  }

  const parsed = parser(data);

  if (!parsed.systemSizeDC_kW || parsed.systemSizeDC_kW <= 0) {
    console.error(`❌ solarSizingIntegration: ${platform} — could not parse systemSizeDC_kW`);
    return null;
  }

  const design: SolarDesignImport = {
    platform,
    importedAt: new Date().toISOString(),
    systemSizeDC_kW: parsed.systemSizeDC_kW,
    rawPayload: data,
    ...parsed,
  };

  if (import.meta.env.DEV) {
    console.log(
      `☀️ solarSizingIntegration: imported ${parsed.systemSizeDC_kW.toFixed(1)} kW design` +
        ` from ${PLATFORM_DISPLAY_NAMES[platform]}` +
        (parsed.annualProductionKWh
          ? ` (${Math.round(parsed.annualProductionKWh).toLocaleString()} kWh/yr)`
          : "")
    );
  }

  return design;
}

/**
 * Save an imported design to Supabase for audit and re-use.
 * Stores in the `imported_solar_designs` table.
 */
export async function saveImportedDesign(
  design: SolarDesignImport,
  merlinProjectId?: string
): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await (supabase as any)
      .from("imported_solar_designs")
      .insert({
        platform: design.platform,
        platform_project_id: design.platformProjectId,
        platform_project_url: design.platformProjectUrl,
        merlin_project_id: merlinProjectId,
        imported_at: design.importedAt,
        address: design.address,
        city: design.city,
        state: design.state,
        zip_code: design.zipCode,
        lat: design.lat,
        lon: design.lon,
        system_size_dc_kw: design.systemSizeDC_kW,
        system_size_ac_kw: design.systemSizeAC_kW,
        number_of_panels: design.numberOfPanels,
        panel_wattage: design.panelWattage,
        panel_manufacturer: design.panelManufacturer,
        panel_model: design.panelModel,
        panel_efficiency_pct: design.panelEfficiencyPct,
        roof_area_used_sqft: design.roofAreaUsedSqFt,
        azimuth_degrees: design.azimuthDegrees,
        tilt_degrees: design.tiltDegrees,
        is_ground_mount: design.isGroundMount ?? false,
        is_carport: design.isCarport ?? false,
        annual_production_kwh: design.annualProductionKWh,
        specific_yield_kwh_kwp: design.specificYieldKwh_per_kWp,
        performance_ratio: design.performanceRatio,
        capacity_factor_pct: design.capacityFactorPct,
        shading_loss_pct: design.shadingLossPct,
        tsrf_pct: design.tsrfPct,
        equipment_cost_usd: design.equipmentCostUSD,
        total_project_cost_usd: design.totalProjectCostUSD,
        cost_per_watt_dc: design.costPerWattDC,
        inverter_manufacturer: design.inverterManufacturer,
        inverter_model: design.inverterModel,
        inverter_type: design.inverterType,
        permit_status: design.permitStatus,
        permit_code: design.permitCode,
        permit_notes: design.permitNotes,
        raw_payload: design.rawPayload,
      })
      .select("id")
      .single();

    if (error) {
      console.error("❌ solarSizingIntegration: failed to save design", error);
      return null;
    }

    return { id: data.id };
  } catch (err) {
    console.error("❌ solarSizingIntegration: exception saving design", err);
    return null;
  }
}

/**
 * Fetch the API key for a platform from the Supabase `solar_sizing_platform_keys` table.
 * Returns null if not configured.
 */
export async function getPlatformApiKey(platform: SolarSizingPlatform): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await (supabase as any)
      .from("solar_sizing_platform_keys")
      .select("api_key, is_active")
      .eq("platform", platform)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return data.api_key as string;
  } catch {
    return null;
  }
}

/**
 * List all platforms that have active API keys configured.
 */
export async function getConfiguredPlatforms(): Promise<SolarSizingPlatform[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await (supabase as any)
      .from("solar_sizing_platform_keys")
      .select("platform")
      .eq("is_active", true);

    if (error || !data) return [];
    return data.map((row: { platform: string }) => row.platform as SolarSizingPlatform);
  } catch {
    return [];
  }
}

// ============================================================================
// AURORA SOLAR — LIVE API FETCHER
// ============================================================================

/**
 * Fetch a project design directly from Aurora Solar's API.
 *
 * Requires:
 *   - Aurora Solar Partner API access (apply at developer.aurorasolar.com)
 *   - API key stored in solar_sizing_platform_keys table for 'aurora_solar'
 *
 * @param projectId - Aurora project ID
 * @returns SolarDesignImport or null
 */
export async function fetchFromAuroraSolar(projectId: string): Promise<SolarDesignImport | null> {
  const apiKey = await getPlatformApiKey("aurora_solar");
  if (!apiKey) {
    console.warn("⚠️ Aurora Solar API key not configured — add to solar_sizing_platform_keys");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.aurorasolar.com/v2/projects/${projectId}/designs/latest`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Aurora Solar API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    return importFromJSON("aurora_solar", data);
  } catch (err) {
    console.error("❌ Aurora Solar fetch failed:", err);
    return null;
  }
}

// ============================================================================
// HELIOSCOPE — LIVE API FETCHER
// ============================================================================

/**
 * Fetch a HelioScope design export.
 *
 * Requires:
 *   - HelioScope API access (contact helioscope.com/api)
 *   - API key stored in solar_sizing_platform_keys table for 'helioscope'
 *
 * @param projectId - HelioScope project ID
 * @param designId  - Specific design ID (optional — uses latest if omitted)
 */
export async function fetchFromHelioScope(
  projectId: string,
  designId?: string
): Promise<SolarDesignImport | null> {
  const apiKey = await getPlatformApiKey("helioscope");
  if (!apiKey) {
    console.warn("⚠️ HelioScope API key not configured — add to solar_sizing_platform_keys");
    return null;
  }

  const designPath = designId ? `/designs/${designId}` : "/designs/latest";
  try {
    const response = await fetch(
      `https://helioscope.aurorasolar.com/api/projects/${projectId}${designPath}`,
      {
        headers: {
          "X-HelioScope-ApiKey": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ HelioScope API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    return importFromJSON("helioscope", { project: data });
  } catch (err) {
    console.error("❌ HelioScope fetch failed:", err);
    return null;
  }
}

// ============================================================================
// OPENSOLAR — LIVE API FETCHER
// ============================================================================

/**
 * Fetch an OpenSolar project.
 *
 * Requires:
 *   - OpenSolar API token (free at opensolar.com/developer)
 *   - API key stored in solar_sizing_platform_keys table for 'opensolar'
 */
export async function fetchFromOpenSolar(
  orgId: string,
  projectId: string
): Promise<SolarDesignImport | null> {
  const apiKey = await getPlatformApiKey("opensolar");
  if (!apiKey) {
    console.warn("⚠️ OpenSolar API key not configured — add to solar_sizing_platform_keys");
    return null;
  }

  try {
    const response = await fetch(
      `https://app.opensolar.com/api/orgs/${orgId}/projects/${projectId}/`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ OpenSolar API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    return importFromJSON("opensolar", { project: data });
  } catch (err) {
    console.error("❌ OpenSolar fetch failed:", err);
    return null;
  }
}

// ============================================================================
// SOLARAPP+ — PERMIT CHECK
// ============================================================================

/**
 * Submit a system design to SolarAPP+ for permit compliance check.
 *
 * Requires:
 *   - SolarAPP+ API access (apply at solarapp.org)
 *   - API key stored in solar_sizing_platform_keys table for 'solarapp_plus'
 *
 * @param design - Merlin SolarDesignImport (from another platform or manual)
 * @returns Updated design with permit_status filled in
 */
export async function checkSolarAPPCompliance(
  design: SolarDesignImport
): Promise<SolarDesignImport | null> {
  const apiKey = await getPlatformApiKey("solarapp_plus");
  if (!apiKey) {
    console.warn("⚠️ SolarAPP+ API key not configured — add to solar_sizing_platform_keys");
    return null;
  }

  try {
    const payload = {
      site_address: design.address,
      state: design.state,
      zip_code: design.zipCode,
      system_size_dc_kw: design.systemSizeDC_kW,
      module_count: design.numberOfPanels,
      module_manufacturer: design.panelManufacturer,
      module_model: design.panelModel,
      inverter_manufacturer: design.inverterManufacturer,
      inverter_model: design.inverterModel,
    };

    const response = await fetch("https://api.solarapp.org/v1/permit_check", {
      method: "POST",
      headers: {
        "X-SolarAPP-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ SolarAPP+ API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const permitResult = parseSolarAPPPlus(data);

    return {
      ...design,
      permitStatus: permitResult.permitStatus ?? "not_checked",
      permitCode: permitResult.permitCode,
      permitNotes: permitResult.permitNotes,
    };
  } catch (err) {
    console.error("❌ SolarAPP+ check failed:", err);
    return null;
  }
}

// ============================================================================
// QUOTE ENGINE BRIDGE
// ============================================================================

/**
 * Convert an imported platform design to override params for TrueQuoteEngine-Solar.
 *
 * Use this to replace Merlin's calculated sizing with the platform's
 * actual design when a contractor has already created a precise design.
 *
 * Returns an object that can be spread into SolarCapacityInput to override
 * the calculated values with the imported design data.
 */
export function designToQuoteOverride(design: SolarDesignImport): {
  importedSystemKw: number;
  importedAnnualKwh?: number;
  importedRoofAreaSqFt?: number;
  importedPanelSpec?: {
    wattPeak: number;
    count: number;
    manufacturer: string;
    model: string;
    efficiencyPct?: number;
  } | null;
  importedCostPerWatt?: number;
  platformSource: string;
  permitStatus?: string;
} {
  return {
    importedSystemKw: design.systemSizeDC_kW,
    importedAnnualKwh: design.annualProductionKWh,
    importedRoofAreaSqFt: design.roofAreaUsedSqFt,
    importedPanelSpec:
      design.numberOfPanels && design.panelWattage
        ? {
            wattPeak: design.panelWattage,
            count: design.numberOfPanels,
            manufacturer: design.panelManufacturer ?? "",
            model: design.panelModel ?? "",
            efficiencyPct: design.panelEfficiencyPct,
          }
        : null,
    importedCostPerWatt: design.costPerWattDC,
    platformSource: PLATFORM_DISPLAY_NAMES[design.platform],
    permitStatus: design.permitStatus,
  };
}
