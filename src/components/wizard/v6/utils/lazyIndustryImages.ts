/**
 * LAZY INDUSTRY IMAGES
 * ====================
 * 
 * Dynamic imports for industry images to reduce initial bundle size.
 * Images are only loaded when Step 2 (Industry Selection) renders.
 * 
 * **Bundle Impact:** ~400-600KB savings by moving images out of main bundle
 * 
 * Usage:
 * ```tsx
 * const img = await getIndustryImage('hotel');
 * // Returns: Promise<string> (image URL)
 * ```
 * 
 * Created: Feb 20, 2026
 * Part of: Wizard bundle optimization initiative
 */

type IndustrySlug =
  | "hotel"
  | "car-wash"
  | "ev-charging"
  | "manufacturing"
  | "data-center"
  | "hospital"
  | "retail"
  | "office"
  | "college"
  | "warehouse"
  | "agriculture"
  | "truck-stop"
  | "airport"
  | "indoor-farm"
  | "shopping-center"
  | "cold-storage"
  | "apartment"
  | "residential"
  | "restaurant"
  | "casino";

// Map industry slugs to image paths (not imported yet!)
const IMAGE_PATHS: Record<IndustrySlug, string> = {
  "hotel": "/src/assets/images/hotel_motel_holidayinn_1.jpg",
  "car-wash": "/src/assets/images/Car_Wash_PitStop.jpg",
  "ev-charging": "/src/assets/images/ev_charging_hub2.jpg",
  "manufacturing": "/src/assets/images/manufacturing_1.jpg",
  "data-center": "/src/assets/images/data-center-1.jpg",
  "hospital": "/src/assets/images/hospital_1.jpg",
  "retail": "/src/assets/images/retail_2.jpg",
  "office": "/src/assets/images/office_building1.jpg",
  "college": "/src/assets/images/college_1.jpg",
  "warehouse": "/src/assets/images/logistics_1.jpg",
  "agriculture": "/src/assets/images/agriculture_1.jpg",
  "truck-stop": "/src/assets/images/truck_stop.jpg",
  "airport": "/src/assets/images/airport_11.jpeg",
  "indoor-farm": "/src/assets/images/indoor_farm1.jpg",
  "shopping-center": "/src/assets/images/shopping_center.jpg",
  "cold-storage": "/src/assets/images/cold_storage.jpg",
  "apartment": "/src/assets/images/apartment_building.jpg",
  "residential": "/src/assets/images/residential.jpg",
  "restaurant": "/src/assets/images/restaurant_1.jpg",
  "casino": "/src/assets/images/casino_gaming1.jpg",
};

// Cache for loaded images
const imageCache: Partial<Record<IndustrySlug, string>> = {};

/**
 * Dynamically load an industry image
 * Returns image URL (ESM import result has .default property)
 */
export async function getIndustryImage(industry: IndustrySlug): Promise<string> {
  // Return cached if available
  if (imageCache[industry]) {
    return imageCache[industry]!;
  }

  // Dynamic import based on industry
  let imageModule;
  
  switch (industry) {
    case "hotel":
      imageModule = await import("@/assets/images/hotel_motel_holidayinn_1.jpg");
      break;
    case "car-wash":
      imageModule = await import("@/assets/images/Car_Wash_PitStop.jpg");
      break;
    case "ev-charging":
      imageModule = await import("@/assets/images/ev_charging_hub2.jpg");
      break;
    case "manufacturing":
      imageModule = await import("@/assets/images/manufacturing_1.jpg");
      break;
    case "data-center":
      imageModule = await import("@/assets/images/data-center-1.jpg");
      break;
    case "hospital":
      imageModule = await import("@/assets/images/hospital_1.jpg");
      break;
    case "retail":
      imageModule = await import("@/assets/images/retail_2.jpg");
      break;
    case "office":
      imageModule = await import("@/assets/images/office_building1.jpg");
      break;
    case "college":
      imageModule = await import("@/assets/images/college_1.jpg");
      break;
    case "warehouse":
      imageModule = await import("@/assets/images/logistics_1.jpg");
      break;
    case "agriculture":
      imageModule = await import("@/assets/images/agriculture_1.jpg");
      break;
    case "truck-stop":
      imageModule = await import("@/assets/images/truck_stop.jpg");
      break;
    case "airport":
      imageModule = await import("@/assets/images/airport_11.jpeg");
      break;
    case "indoor-farm":
      imageModule = await import("@/assets/images/indoor_farm1.jpg");
      break;
    case "shopping-center":
      imageModule = await import("@/assets/images/shopping_center.jpg");
      break;
    case "cold-storage":
      imageModule = await import("@/assets/images/cold_storage.jpg");
      break;
    case "apartment":
      imageModule = await import("@/assets/images/apartment_building.jpg");
      break;
    case "residential":
      imageModule = await import("@/assets/images/residential.jpg");
      break;
    case "restaurant":
      imageModule = await import("@/assets/images/restaurant_1.jpg");
      break;
    case "casino":
      imageModule = await import("@/assets/images/casino_gaming1.jpg");
      break;
    default:
      // Fallback to office image
      imageModule = await import("@/assets/images/office_building1.jpg");
  }

  // ESM imports have .default for static assets
  const imageUrl = imageModule.default;
  
  // Cache it
  imageCache[industry] = imageUrl;
  
  return imageUrl;
}

/**
 * Preload images for all industries (use sparingly!)
 * Only call this if user is idle on Step 2 for >2 seconds
 */
export async function preloadAllIndustryImages(): Promise<void> {
  const industries: IndustrySlug[] = [
    "hotel", "car-wash", "ev-charging", "manufacturing", "data-center",
    "hospital", "retail", "office", "college", "warehouse",
    "agriculture", "truck-stop", "airport", "indoor-farm", "shopping-center",
    "cold-storage", "apartment", "residential", "restaurant", "casino",
  ];

  // Load all in parallel
  await Promise.all(industries.map(getIndustryImage));
}

/**
 * Preload specific industries (e.g., most popular ones)
 */
export async function preloadTopIndustries(): Promise<void> {
  const topIndustries: IndustrySlug[] = [
    "hotel", "car-wash", "ev-charging", "manufacturing", 
    "data-center", "hospital", "retail", "office"
  ];

  await Promise.all(topIndustries.map(getIndustryImage));
}
