/**
 * BUSINESS DETECTION SERVICE
 * ===========================
 *
 * Detects business type, amenities, and facility details from address lookup.
 *
 * Data Sources:
 * - Google Places API (business type, amenities, hours)
 * - Utility rate lookup (existing utilityRateService)
 * - Satellite imagery analysis (roof area - future integration)
 *
 * Created: Jan 15, 2026
 * Part of: Smart address lookup feature
 */

// ============================================
// TYPES
// ============================================

export interface BusinessDetectionResult {
  // Basic Info
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lng: number;

  // Business Classification
  businessType: string; // Maps to our industry slugs
  industrySlug: string; // hotel, car-wash, hospital, etc.
  confidence: "high" | "medium" | "low";

  // Detected Amenities
  amenities: {
    hasPool?: boolean;
    hasRestaurant?: boolean;
    hasFitness?: boolean;
    hasParking?: boolean;
    hasEVCharging?: boolean;
  };

  // Operating Info
  operatingHours?: {
    alwaysOpen: boolean; // 24/7
    hoursPerDay?: number;
    daysPerWeek?: number;
  };

  // Physical Attributes
  roofArea?: number; // sq ft (from satellite - future)
  buildingFootprint?: number; // sq ft
  parkingSpaces?: number; // counted from satellite

  // Utility Info
  utilityProvider?: string;
  utilityRate?: number;
  demandCharge?: number;

  // Pre-filled Answers (for Step 3)
  prefilledAnswers: Record<string, unknown>;
}

interface GooglePlacesResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  business_status?: string;
  opening_hours?: {
    open_now: boolean;
    periods?: unknown[];
    weekday_text?: string[];
  };
}

// ============================================
// GOOGLE CATEGORY TO INDUSTRY MAPPING
// ============================================

const GOOGLE_TO_INDUSTRY_MAP: Record<string, string> = {
  // Hotels
  lodging: "hotel",
  hotel: "hotel",
  motel: "hotel",
  resort: "hotel",

  // Car Wash
  car_wash: "car-wash",

  // Healthcare
  hospital: "hospital",
  doctor: "hospital",
  health: "hospital",

  // Data Centers
  data_center: "data-center",

  // EV Charging
  electric_vehicle_charging_station: "ev-charging",
  charging_station: "ev-charging",

  // Gas Stations
  gas_station: "gas-station",

  // Manufacturing
  factory: "manufacturing",
  manufacturer: "manufacturing",

  // Retail
  shopping_mall: "shopping-center",
  department_store: "retail",
  store: "retail",

  // Office
  office: "office",
  corporate_office: "office",

  // Warehouses
  warehouse: "warehouse",
  storage: "warehouse",

  // Colleges
  university: "college",
  college: "college",
  school: "college",

  // Airports
  airport: "airport",

  // Agriculture
  farm: "agricultural",
  agriculture: "agricultural",
};

// ============================================
// AMENITY DETECTION
// ============================================

const detectAmenities = (types: string[], name: string): BusinessDetectionResult["amenities"] => {
  const amenities: BusinessDetectionResult["amenities"] = {};

  // Pool detection
  if (name.toLowerCase().includes("pool") || types.includes("swimming_pool")) {
    amenities.hasPool = true;
  }

  // Restaurant detection
  if (types.includes("restaurant") || types.includes("food")) {
    amenities.hasRestaurant = true;
  }

  // Fitness detection
  if (
    types.includes("gym") ||
    types.includes("fitness") ||
    name.toLowerCase().includes("fitness")
  ) {
    amenities.hasFitness = true;
  }

  // Parking detection
  if (types.includes("parking")) {
    amenities.hasParking = true;
  }

  // EV Charging detection
  if (
    types.includes("electric_vehicle_charging_station") ||
    name.toLowerCase().includes("ev charging")
  ) {
    amenities.hasEVCharging = true;
  }

  return amenities;
};

// ============================================
// OPERATING HOURS DETECTION
// ============================================

const detectOperatingHours = (
  openingHours?: GooglePlacesResult["opening_hours"]
): BusinessDetectionResult["operatingHours"] => {
  if (!openingHours) return undefined;

  // Check if 24/7
  const is24_7 = openingHours.periods?.length === 1 && !openingHours.periods[0].close;

  if (is24_7) {
    return {
      alwaysOpen: true,
      hoursPerDay: 24,
      daysPerWeek: 7,
    };
  }

  // TODO: Parse actual hours from weekday_text
  // For now, return undefined if not 24/7
  return {
    alwaysOpen: false,
  };
};

// ============================================
// PREFILLED ANSWERS GENERATOR
// ============================================

const generatePrefilledAnswers = (
  industrySlug: string,
  amenities: BusinessDetectionResult["amenities"],
  operatingHours?: BusinessDetectionResult["operatingHours"]
): Record<string, unknown> => {
  const answers: Record<string, unknown> = {};

  // Operating hours
  if (operatingHours?.alwaysOpen) {
    answers.operatingHours = 24;
    answers.daysPerWeek = 7;
  }

  // Industry-specific pre-fills
  switch (industrySlug) {
    case "hotel":
      if (operatingHours?.alwaysOpen) {
        answers.operatingHours = 24;
        answers.daysPerWeek = 7;
      }
      if (amenities.hasPool !== undefined) {
        answers.hasPool = amenities.hasPool;
      }
      if (amenities.hasRestaurant !== undefined) {
        answers.hasRestaurant = amenities.hasRestaurant;
      }
      if (amenities.hasFitness !== undefined) {
        answers.hasFitness = amenities.hasFitness;
      }
      break;

    case "car-wash":
      // Car washes typically 8-10 hours/day, 6-7 days/week
      if (!answers.operatingHours) {
        answers.operatingHours = 10;
        answers.daysPerWeek = 6;
      }
      break;

    case "hospital":
      // Hospitals always 24/7
      answers.operatingHours = 24;
      answers.daysPerWeek = 7;
      break;

    case "data-center":
      // Data centers always 24/7
      answers.operatingHours = 24;
      answers.daysPerWeek = 7;
      break;
  }

  return answers;
};

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

export const detectBusinessFromAddress = async (
  query: string
): Promise<BusinessDetectionResult | null> => {
  try {
    // TODO: Implement Google Places Autocomplete API call
    // For now, return mock data for development
    console.log("[BusinessDetection] Query:", query);

    // This would be replaced with actual Google Places API call:
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_API_KEY}`
    // );

    // Mock response for development
    const mockResult: GooglePlacesResult = {
      place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
      name: query,
      formatted_address: "50 3rd St, San Francisco, CA 94103",
      geometry: {
        location: {
          lat: 37.7858,
          lng: -122.4064,
        },
      },
      types: ["lodging", "hotel", "point_of_interest"],
      opening_hours: {
        open_now: true,
        periods: [{ open: { day: 0, time: "0000" } }], // 24/7
      },
    };

    return await processPlaceDetails(mockResult);
  } catch (error) {
    console.error("[BusinessDetection] Error:", error);
    return null;
  }
};

// ============================================
// PROCESS PLACE DETAILS
// ============================================

const processPlaceDetails = async (place: GooglePlacesResult): Promise<BusinessDetectionResult> => {
  // Extract address components
  const addressParts = place.formatted_address.split(", ");
  const zipCode = addressParts[addressParts.length - 1]?.match(/\d{5}/)?.[0] || "";
  const state = addressParts[addressParts.length - 2] || "";
  const city = addressParts[addressParts.length - 3] || "";

  // Map Google types to our industry
  let industrySlug = "office"; // Default fallback
  let confidence: "high" | "medium" | "low" = "low";

  for (const type of place.types) {
    if (GOOGLE_TO_INDUSTRY_MAP[type]) {
      industrySlug = GOOGLE_TO_INDUSTRY_MAP[type];
      confidence = "high";
      break;
    }
  }

  // Detect amenities
  const amenities = detectAmenities(place.types, place.name);

  // Detect operating hours
  const operatingHours = detectOperatingHours(place.opening_hours);

  // Get utility info (using existing service)
  let utilityProvider: string | undefined;
  let utilityRate: number | undefined;
  let demandCharge: number | undefined;

  try {
    // Import and use existing utility rate service
    const { getCommercialRateByZip } = await import("./utilityRateService");
    const utilityInfo = await getCommercialRateByZip(zipCode);

    if (utilityInfo) {
      utilityProvider = utilityInfo.utilityName;
      utilityRate = utilityInfo.rate;
      demandCharge = utilityInfo.demandCharge;
    }
  } catch (error) {
    console.warn("[BusinessDetection] Could not fetch utility rates:", error);
  }

  // Generate pre-filled answers
  const prefilledAnswers = generatePrefilledAnswers(industrySlug, amenities, operatingHours);

  return {
    name: place.name,
    address: place.formatted_address,
    city,
    state,
    zipCode,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,

    businessType: place.types[0] || "unknown",
    industrySlug,
    confidence,

    amenities,
    operatingHours,

    utilityProvider,
    utilityRate,
    demandCharge,

    prefilledAnswers,
  };
};

// ============================================
// ESTIMATE INITIAL SAVINGS RANGE
// ============================================

export const estimateInitialSavings = (
  detection: BusinessDetectionResult
): {
  low: number;
  high: number;
  confidence: number;
} => {
  // Industry-specific ranges (based on typical facilities)
  const industryRanges: Record<string, { low: number; high: number }> = {
    hotel: { low: 150000, high: 400000 },
    "car-wash": { low: 80000, high: 200000 },
    hospital: { low: 300000, high: 800000 },
    "data-center": { low: 500000, high: 2000000 },
    "ev-charging": { low: 50000, high: 150000 },
    office: { low: 100000, high: 300000 },
    manufacturing: { low: 200000, high: 600000 },
    retail: { low: 80000, high: 250000 },
    warehouse: { low: 100000, high: 300000 },
  };

  const range = industryRanges[detection.industrySlug] || { low: 100000, high: 500000 };

  // Adjust range based on utility rates
  if (detection.utilityRate) {
    const rateMultiplier = detection.utilityRate / 0.15; // Normalize to $0.15/kWh baseline
    range.low *= rateMultiplier;
    range.high *= rateMultiplier;
  }

  // Initial confidence based on detection quality
  const confidenceMap = {
    high: 35,
    medium: 25,
    low: 15,
  };

  return {
    low: Math.round(range.low),
    high: Math.round(range.high),
    confidence: confidenceMap[detection.confidence],
  };
};
