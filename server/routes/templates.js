/**
 * TEMPLATE MANAGEMENT ENDPOINT
 * ==============================
 * 
 * Created: January 26, 2026
 * Purpose: V7 Wizard Step 3 - Versioned, immutable questionnaire templates
 * 
 * SSOT DOCTRINE COMPLIANCE:
 * - Templates are immutable artifacts once deployed
 * - Version is persisted with every quote
 * - QuoteEngine receives templateVersion for reproducibility
 * - Pricing Freeze includes templateVersion for audit trail
 * 
 * ENDPOINTS:
 * - POST /api/templates/load - Load template for a specific industry
 * - GET /api/templates/list - List all available templates
 */

import express from "express";

const router = express.Router();

/**
 * TEMPLATE REGISTRY (V7.0)
 * 
 * In production, these should be:
 * 1. Stored in database with version control
 * 2. Loaded from S3/CDN for performance
 * 3. Cached in-memory with TTL
 * 
 * For now, we seed here as immutable artifacts.
 */
const TEMPLATE_REGISTRY = {
  "car_wash": {
    industry: "car_wash",
    version: "v7.0.0",
    name: "Car Wash Energy Profile",
    description: "16-question assessment for car wash facilities",
    questions: [
      {
        id: "wash_type",
        type: "select",
        label: "What type of car wash?",
        required: true,
        options: [
          { value: "self_service", label: "Self-Service Bays" },
          { value: "automatic", label: "Automatic (In-Bay)" },
          { value: "tunnel", label: "Tunnel/Conveyor" },
          { value: "full_service", label: "Full Service + Detailing" },
        ],
      },
      {
        id: "bay_count",
        type: "number",
        label: "Number of wash bays/tunnels",
        required: true,
        min: 1,
        max: 50,
        default: 4,
      },
      {
        id: "operating_hours",
        type: "number",
        label: "Operating hours per day",
        required: true,
        min: 8,
        max: 24,
        default: 12,
      },
      {
        id: "water_recycling",
        type: "boolean",
        label: "Water recycling system installed?",
        required: false,
        default: false,
      },
      {
        id: "heating_system",
        type: "select",
        label: "Water heating method",
        required: true,
        options: [
          { value: "electric", label: "Electric Heaters" },
          { value: "gas", label: "Natural Gas" },
          { value: "hybrid", label: "Hybrid (Electric + Gas)" },
          { value: "none", label: "No Heating" },
        ],
      },
      {
        id: "dryer_type",
        type: "select",
        label: "Dryer system type",
        required: true,
        options: [
          { value: "blower", label: "High-Pressure Blowers" },
          { value: "ambient", label: "Ambient Air Dry" },
          { value: "none", label: "No Dryer" },
        ],
      },
      {
        id: "peak_demand_kw",
        type: "number",
        label: "Peak electrical demand (kW) - if known",
        required: false,
        min: 10,
        max: 1000,
      },
      {
        id: "monthly_kwh",
        type: "number",
        label: "Monthly electricity usage (kWh) - if known",
        required: false,
        min: 1000,
        max: 500000,
      },
      {
        id: "utility_rate",
        type: "number",
        label: "Electricity rate ($/kWh) - if known",
        required: false,
        min: 0.05,
        max: 0.50,
        step: 0.01,
      },
      {
        id: "demand_charges",
        type: "boolean",
        label: "Subject to demand charges?",
        required: false,
        default: true,
      },
      {
        id: "outage_frequency",
        type: "select",
        label: "How often do you experience power outages?",
        required: false,
        options: [
          { value: "never", label: "Never/Rarely" },
          { value: "occasional", label: "1-3 times per year" },
          { value: "frequent", label: "4+ times per year" },
        ],
      },
      {
        id: "backup_priority",
        type: "select",
        label: "Backup power priority",
        required: false,
        options: [
          { value: "none", label: "Not needed" },
          { value: "low", label: "Nice to have" },
          { value: "medium", label: "Important for business continuity" },
          { value: "high", label: "Critical - cannot afford downtime" },
        ],
      },
      {
        id: "solar_interest",
        type: "boolean",
        label: "Interested in adding solar?",
        required: false,
        default: false,
      },
      {
        id: "roof_condition",
        type: "select",
        label: "If adding solar, roof condition?",
        required: false,
        dependsOn: { field: "solar_interest", value: true },
        options: [
          { value: "excellent", label: "Excellent (< 5 years old)" },
          { value: "good", label: "Good (5-10 years)" },
          { value: "fair", label: "Fair (10-15 years)" },
          { value: "poor", label: "Poor (needs replacement)" },
        ],
      },
      {
        id: "available_space",
        type: "number",
        label: "Available roof/land space (sq ft) - if known",
        required: false,
        min: 0,
        max: 100000,
      },
      {
        id: "budget_range",
        type: "select",
        label: "Budget range for BESS investment",
        required: false,
        options: [
          { value: "under_100k", label: "Under $100k" },
          { value: "100k_250k", label: "$100k - $250k" },
          { value: "250k_500k", label: "$250k - $500k" },
          { value: "over_500k", label: "Over $500k" },
          { value: "flexible", label: "Flexible based on ROI" },
        ],
      },
    ],
  },
  
  "hotel": {
    industry: "hotel",
    version: "v7.0.0",
    name: "Hotel Energy Profile",
    description: "16-question assessment for hospitality facilities",
    questions: [
      {
        id: "hotel_class",
        type: "select",
        label: "Hotel classification",
        required: true,
        options: [
          { value: "economy", label: "Economy/Budget" },
          { value: "midscale", label: "Midscale" },
          { value: "upscale", label: "Upscale/Full Service" },
          { value: "luxury", label: "Luxury" },
        ],
      },
      {
        id: "room_count",
        type: "number",
        label: "Total number of rooms",
        required: true,
        min: 10,
        max: 1000,
        default: 150,
      },
      {
        id: "occupancy_rate",
        type: "number",
        label: "Average occupancy rate (%)",
        required: true,
        min: 30,
        max: 100,
        default: 70,
      },
      {
        id: "hvac_system",
        type: "select",
        label: "HVAC system type",
        required: true,
        options: [
          { value: "central", label: "Central Chiller/Boiler" },
          { value: "ptac", label: "PTAC (In-Room Units)" },
          { value: "vrf", label: "VRF/Mini-Split" },
          { value: "mixed", label: "Mixed Systems" },
        ],
      },
      {
        id: "has_restaurant",
        type: "boolean",
        label: "On-site restaurant/kitchen?",
        required: false,
        default: false,
      },
      {
        id: "has_pool",
        type: "boolean",
        label: "Swimming pool?",
        required: false,
        default: false,
      },
      {
        id: "has_spa",
        type: "boolean",
        label: "Spa/fitness center?",
        required: false,
        default: false,
      },
      {
        id: "has_ev_charging",
        type: "boolean",
        label: "EV charging stations?",
        required: false,
        default: false,
      },
      {
        id: "laundry_location",
        type: "select",
        label: "Laundry facilities",
        required: true,
        options: [
          { value: "onsite", label: "On-Site Industrial Laundry" },
          { value: "outsourced", label: "Outsourced/Off-Site" },
          { value: "guest_only", label: "Guest Self-Service Only" },
        ],
      },
      {
        id: "peak_demand_kw",
        type: "number",
        label: "Peak electrical demand (kW) - if known",
        required: false,
        min: 50,
        max: 5000,
      },
      {
        id: "monthly_kwh",
        type: "number",
        label: "Monthly electricity usage (kWh) - if known",
        required: false,
        min: 10000,
        max: 1000000,
      },
      {
        id: "utility_rate",
        type: "number",
        label: "Electricity rate ($/kWh) - if known",
        required: false,
        min: 0.05,
        max: 0.50,
        step: 0.01,
      },
      {
        id: "demand_charges",
        type: "boolean",
        label: "Subject to demand charges?",
        required: false,
        default: true,
      },
      {
        id: "backup_priority",
        type: "select",
        label: "Backup power priority",
        required: false,
        options: [
          { value: "none", label: "Not needed" },
          { value: "low", label: "Emergency lighting only" },
          { value: "medium", label: "Critical systems (elevators, kitchen)" },
          { value: "high", label: "Full building backup" },
        ],
      },
      {
        id: "solar_interest",
        type: "boolean",
        label: "Interested in adding solar?",
        required: false,
        default: false,
      },
      {
        id: "roof_condition",
        type: "select",
        label: "If adding solar, roof condition?",
        required: false,
        dependsOn: { field: "solar_interest", value: true },
        options: [
          { value: "excellent", label: "Excellent (< 5 years old)" },
          { value: "good", label: "Good (5-10 years)" },
          { value: "fair", label: "Fair (10-15 years)" },
          { value: "poor", label: "Poor (needs replacement)" },
        ],
      },
      {
        id: "budget_range",
        type: "select",
        label: "Budget range for BESS investment",
        required: false,
        options: [
          { value: "under_250k", label: "Under $250k" },
          { value: "250k_500k", label: "$250k - $500k" },
          { value: "500k_1m", label: "$500k - $1M" },
          { value: "over_1m", label: "Over $1M" },
          { value: "flexible", label: "Flexible based on ROI" },
        ],
      },
    ],
  },
  
  "data_center": {
    industry: "data_center",
    version: "v7.0.0",
    name: "Data Center Energy Profile",
    description: "Critical infrastructure assessment for colocation/enterprise data centers",
    questions: [
      {
        id: "tier_level",
        type: "select",
        label: "Tier level (Uptime Institute)",
        required: true,
        options: [
          { value: "tier1", label: "Tier I (99.671% uptime)" },
          { value: "tier2", label: "Tier II (99.741% uptime)" },
          { value: "tier3", label: "Tier III (99.982% uptime)" },
          { value: "tier4", label: "Tier IV (99.995% uptime)" },
        ],
      },
      {
        id: "it_load_kw",
        type: "number",
        label: "IT load (kW)",
        required: true,
        min: 10,
        max: 50000,
      },
      {
        id: "pue",
        type: "number",
        label: "Power Usage Effectiveness (PUE)",
        required: false,
        min: 1.0,
        max: 3.0,
        step: 0.1,
        default: 1.5,
      },
      {
        id: "existing_ups_minutes",
        type: "number",
        label: "Existing UPS runtime (minutes)",
        required: false,
        min: 5,
        max: 120,
      },
      {
        id: "existing_generator",
        type: "boolean",
        label: "Diesel generator on-site?",
        required: false,
        default: true,
      },
      {
        id: "n_plus_redundancy",
        type: "select",
        label: "Power redundancy configuration",
        required: true,
        options: [
          { value: "n", label: "N (no redundancy)" },
          { value: "n_plus_1", label: "N+1" },
          { value: "two_n", label: "2N (fully redundant)" },
          { value: "two_n_plus_1", label: "2N+1" },
        ],
      },
    ],
  },
};

/**
 * POST /api/templates/load
 * 
 * Input: { industry: string, version?: string }
 * Output: { ok: true, template: Step3Template } OR { ok: false, reason: string }
 * 
 * Load a specific template by industry slug.
 * If version is omitted, returns latest version.
 */
router.post("/load", async (req, res) => {
  const availableIndustries = Object.keys(TEMPLATE_REGISTRY);

  try {
    const { industry, version } = req.body;

    // Diagnostic: always log what the client sent
    console.log(`[templates/load] Request: industry=${JSON.stringify(industry)} version=${JSON.stringify(version)}`);

    if (!industry || typeof industry !== "string") {
      console.warn(`[templates/load] ❌ Missing/invalid industry in payload:`, req.body);
      return res.json({
        ok: false,
        reason: "missing_industry",
        notes: ["Industry slug is required"],
        requestedIndustry: industry ?? null,
        availableIndustries,
      });
    }

    // Normalize: trim whitespace, lowercase
    const normalizedIndustry = industry.trim().toLowerCase();

    // Lookup template
    const template = TEMPLATE_REGISTRY[normalizedIndustry];
    
    if (!template) {
      console.warn(`[templates/load] ❌ No template for "${normalizedIndustry}" (available: ${availableIndustries.join(", ")})`);
      return res.json({
        ok: false,
        reason: "template_not_found",
        notes: [
          `No template found for industry: "${normalizedIndustry}"`,
          `Available templates: ${availableIndustries.join(", ")}`,
          "Client should fall back to local JSON or generic template",
        ],
        requestedIndustry: normalizedIndustry,
        availableIndustries,
      });
    }

    // Version check (for now, we only have v7.0.0)
    if (version && version !== template.version) {
      console.warn(`[templates/load] ⚠️ Version mismatch: requested=${version} available=${template.version}`);
    }

    console.log(`[templates/load] ✅ Loaded: ${template.industry} ${template.version} (${template.questions.length} questions)`);

    return res.json({
      ok: true,
      template,
    });
  } catch (error) {
    console.error("[templates/load] 💥 Unhandled error:", error?.message ?? error, error?.stack);
    return res.status(500).json({
      ok: false,
      reason: "server_error",
      notes: [
        "Internal server error during template load",
        process.env.NODE_ENV !== "production" ? String(error?.message ?? error) : "Contact support",
      ],
      availableIndustries,
    });
  }
});

/**
 * GET /api/templates/list
 * 
 * Output: { ok: true, templates: Array<{industry, version, name}> }
 * 
 * List all available templates.
 */
router.get("/list", async (req, res) => {
  try {
    const templates = Object.values(TEMPLATE_REGISTRY).map((t) => ({
      industry: t.industry,
      version: t.version,
      name: t.name,
      description: t.description,
      questionCount: t.questions.length,
    }));

    return res.json({
      ok: true,
      templates,
    });
  } catch (error) {
    console.error("[templates/list] Error:", error);
    return res.json({
      ok: false,
      reason: "server_error",
      notes: ["Failed to list templates"],
    });
  }
});

export default router;
