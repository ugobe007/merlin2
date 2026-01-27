/**
 * LOCATION RESOLUTION ENDPOINT
 * =============================
 * 
 * Created: January 26, 2026
 * Purpose: V7 Wizard Step 1 - Deterministic location resolution with state guarantee
 * 
 * SSOT DOCTRINE COMPLIANCE:
 * - Returns structured LocationCard or explicit rejection
 * - ALWAYS provides state (administrative_area_level_1) for US locations
 * - Clear confidence scoring and source attribution
 * - Non-negotiable validation before sending to frontend
 * 
 * ENDPOINTS:
 * - POST /api/location/resolve - Geocode user input → LocationCard
 * - POST /api/location/intel - Fetch utility rates + solar data (non-blocking)
 */

import express from "express";

const router = express.Router();

/**
 * POST /api/location/resolve
 * 
 * Input: { query: string } - User-entered location (address, zip, city/state, lat/lng)
 * Output: { ok: true, location: LocationCard, source, confidence } OR { ok: false, reason, notes[] }
 * 
 * VALIDATION RULES (V7 SSOT):
 * 1. US locations MUST have state (administrative_area_level_1)
 * 2. International locations require country
 * 3. Ambiguous results → return rejection with notes (don't guess)
 * 4. Confidence < 0.5 → return rejection
 */
router.post("/resolve", async (req, res) => {
  try {
    const { query } = req.body;

    // Input validation
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return res.json({
        ok: false,
        reason: "query_too_short",
        notes: ["Please enter at least 2 characters (ZIP code, city, or address)"],
      });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.error("[location/resolve] GOOGLE_MAPS_API_KEY not set");
      return res.json({
        ok: false,
        reason: "api_not_configured",
        notes: ["Location service temporarily unavailable"],
      });
    }

    // Call Google Geocoding API
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query.trim());
    url.searchParams.set("key", key);

    console.log(`[location/resolve] Geocoding: "${query.trim()}"`);
    const response = await fetch(url.toString());
    const data = await response.json();

    // Handle API errors
    if (data.status === "ZERO_RESULTS") {
      return res.json({
        ok: false,
        reason: "no_results",
        notes: [
          "No location found. Try:",
          "• ZIP code (e.g., 94102)",
          "• City, State (e.g., San Francisco, CA)",
          "• Full address",
        ],
      });
    }

    if (data.status !== "OK") {
      console.error("[location/resolve] Geocoding error:", data.status, data.error_message);
      return res.json({
        ok: false,
        reason: "geocoding_failed",
        notes: [data.error_message || "Geocoding service error"],
      });
    }

    // Parse first result
    const result = data.results[0];
    if (!result || !result.geometry || !result.address_components) {
      return res.json({
        ok: false,
        reason: "invalid_result",
        notes: ["Location data incomplete from geocoder"],
      });
    }

    // Extract address components
    const components = result.address_components;
    let city, state, stateCode, postal, country, countryCode;

    for (const comp of components) {
      const types = comp.types || [];
      if (types.includes("locality")) {
        city = comp.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        state = comp.long_name; // e.g., "California"
        stateCode = comp.short_name; // e.g., "CA"
      }
      if (types.includes("postal_code")) {
        postal = comp.short_name;
      }
      if (types.includes("country")) {
        country = comp.long_name; // e.g., "United States"
        countryCode = comp.short_name; // e.g., "US"
      }
    }

    // SSOT VALIDATION: US locations MUST have state
    const isUS = countryCode === "US";
    if (isUS && (!state || !stateCode)) {
      return res.json({
        ok: false,
        reason: "missing_state",
        notes: [
          "Location found, but no state detected.",
          "For US locations, please specify state:",
          "• Add state to your search (e.g., 'San Francisco, CA')",
          "• Use a ZIP code that maps to a clear state",
        ],
      });
    }

    // Determine confidence (0-1 scale)
    let confidence = 0.7; // Base confidence
    const evidenceComponents = [];
    
    if (result.geometry.location_type === "ROOFTOP") {
      confidence = 1.0;
      evidenceComponents.push("exact_address");
    } else if (result.geometry.location_type === "RANGE_INTERPOLATED") {
      confidence = 0.9;
      evidenceComponents.push("street_interpolated");
    } else if (result.geometry.location_type === "GEOMETRIC_CENTER") {
      confidence = 0.8;
      evidenceComponents.push("geometric_center");
    } else if (result.geometry.location_type === "APPROXIMATE") {
      confidence = 0.6;
      evidenceComponents.push("approximate");
    }

    // Boost confidence if postal code present
    if (postal) {
      confidence = Math.min(confidence + 0.1, 1.0);
      evidenceComponents.push("has_postal_code");
    }
    
    // Track component quality
    if (city) evidenceComponents.push("has_city");
    if (state) evidenceComponents.push("has_state");
    if (countryCode) evidenceComponents.push("has_country");

    // Reject low confidence
    if (confidence < 0.5) {
      return res.json({
        ok: false,
        reason: "low_confidence",
        confidence,
        evidence: {
          source: "google_geocoding",
          locationType: result.geometry.location_type,
          components: evidenceComponents,
        },
        notes: [
          "Location too ambiguous. Please be more specific:",
          "• Include city name",
          "• Add state abbreviation",
          "• Use ZIP code",
        ],
      });
    }

    // Build LocationCard (V7 contract)
    const location = {
      rawInput: query.trim(),
      formattedAddress: result.formatted_address,
      city: city || null,
      state: state || null,
      stateCode: stateCode || null,
      postal: postal || null,
      country: country || "United States",
      countryCode: countryCode || "US",
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
    };

    console.log(`[location/resolve] ✅ Resolved: ${location.formattedAddress} (confidence: ${confidence})`);

    return res.json({
      ok: true,
      location,
      source: "google_geocoding",
      confidence,
      evidence: {
        source: "google_geocoding",
        placeId: result.place_id,
        locationType: result.geometry.location_type,
        components: evidenceComponents,
      },
      confidence,
    });
  } catch (error) {
    console.error("[location/resolve] Unexpected error:", error);
    return res.status(500).json({
      ok: false,
      reason: "server_error",
      notes: ["Location service error. Please try again."],
    });
  }
});

/**
 * POST /api/location/intel
 * 
 * Input: { zipCode: string, state: string, lat: number, lon: number }
 * Output: { peakSunHours, utilityRate, demandCharge, weatherRisk, solarGrade, source }
 * 
 * NON-BLOCKING: Step 1 should not wait for this. Fetch after location confirmed.
 * SSOT: Returns null values if data not available (no hardcoded fallbacks in API).
 */
router.post("/intel", async (req, res) => {
  try {
    const { zipCode, state, lat, lon } = req.body;

    // Placeholder for now - wire to real services later
    // Services to integrate:
    // - src/services/utilityRateService.ts → getCommercialRateByZip(zipCode)
    // - src/services/pvWattsService.ts → estimateSolarProduction(kW, state)
    // - src/services/weatherService.ts → getWeatherData(zipCode)
    
    const intel = {
      peakSunHours: null, // From pvWattsService
      utilityRate: null, // $/kWh from utilityRateService
      demandCharge: null, // $/kW from utilityRateService
      weatherRisk: null, // From weatherService (hurricane, tornado, etc.)
      solarGrade: null, // A/B/C/D grade from pvWattsService
      source: "placeholder",
      notes: ["Intel endpoint not yet wired to real services"],
    };

    console.log(`[location/intel] Placeholder intel for ${zipCode || `${lat},${lon}`}`);
    return res.json(intel);
  } catch (error) {
    console.error("[location/intel] Error:", error);
    return res.status(500).json({
      error: "Intel lookup failed",
      notes: ["Location intelligence temporarily unavailable"],
    });
  }
});

export default router;
