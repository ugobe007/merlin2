/**
 * Google Places API Routes
 * 
 * Backend proxy for Google Places API to protect API keys
 * and prevent quota abuse from client-side calls.
 * 
 * Created: January 22, 2026
 */

import express from "express";

const router = express.Router();

/**
 * POST /api/places/lookup-business
 * 
 * Search for businesses using Google Places Text Search
 * Returns top 5 candidates for user confirmation
 */
router.post("/lookup-business", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ error: "Query must be at least 3 characters" });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.error("GOOGLE_MAPS_API_KEY not set in environment");
      return res.status(500).json({ error: "API key not configured" });
    }

    // Google Places Text Search API
    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.set("query", query);
    url.searchParams.set("key", key);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return res.json({ results: [] });
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status, data.error_message);
      return res.status(500).json({ 
        error: data.error_message || "Places lookup failed" 
      });
    }

    // Map to simplified candidate format
    const results = (data.results || []).slice(0, 5).map((place) => ({
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      photoRef: place.photos?.[0]?.photo_reference || null,
    }));

    return res.json({ results });
  } catch (error) {
    console.error("Business lookup error:", error);
    return res.status(500).json({ error: "Lookup failed" });
  }
});

/**
 * POST /api/places/place-details
 * 
 * Get detailed information about a specific place
 * Called after user confirms a business from candidates
 */
router.post("/place-details", async (req, res) => {
  try {
    const { placeId } = req.body;
    
    if (!placeId) {
      return res.status(400).json({ error: "Missing placeId" });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Google Places Details API
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "name,formatted_address,website,formatted_phone_number,photos,types,geometry,address_components");
    url.searchParams.set("key", key);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places Details error:", data.status, data.error_message);
      return res.status(500).json({ 
        error: data.error_message || "Details lookup failed" 
      });
    }

    const place = data.result || {};
    
    // Extract city, state, postal from address components
    const addressComponents = place.address_components || [];
    let city, state, postal;
    
    for (const component of addressComponents) {
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        state = component.short_name;
      }
      if (component.types.includes("postal_code")) {
        postal = component.short_name;
      }
    }

    return res.json({
      placeId,
      name: place.name,
      formattedAddress: place.formatted_address,
      website: place.website || null,
      phone: place.formatted_phone_number || null,
      types: place.types || [],
      photoRef: place.photos?.[0]?.photo_reference || null,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      city,
      state,
      postal,
    });
  } catch (error) {
    console.error("Place details error:", error);
    return res.status(500).json({ error: "Details lookup failed" });
  }
});

/**
 * GET /api/places/photo/:photoReference
 * 
 * Proxy for Google Places Photos (requires API key)
 * Returns photo as binary data
 */
router.get("/photo/:photoReference", async (req, res) => {
  try {
    const { photoReference } = req.params;
    const maxWidth = req.query.maxwidth || 400;

    if (!photoReference) {
      return res.status(400).json({ error: "Missing photo reference" });
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "API key not configured" });
    }

    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${key}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: "Photo fetch failed" });
    }

    // Forward the image
    res.set("Content-Type", response.headers.get("content-type"));
    res.set("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("Photo proxy error:", error);
    return res.status(500).json({ error: "Photo fetch failed" });
  }
});

export default router;
