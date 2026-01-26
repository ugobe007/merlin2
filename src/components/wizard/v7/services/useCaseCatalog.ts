/**
 * Use Case Catalog Adapter (V7 Canonical Pattern)
 * 
 * Single source of truth for available use cases in WizardV7.
 * Abstracts DB schema from UI - Step3 never touches Supabase directly.
 * 
 * Data Flow:
 *   Step3Industry → getUseCases() → /api/use-cases → Supabase
 *   ↓ fallback if API fails
 *   FALLBACK_USE_CASES (always renders)
 */

export type UseCase = {
  slug: string;          // 'car-wash', 'hotel', etc
  title: string;         // 'Car Wash', 'Hotel / Motel', etc
  description?: string;  // optional marketing copy
  imageKey?: string;     // 'car_wash_1.jpg' - maps to assets/images/
};

// ✅ V7 Fallback - Always renders even if DB/API is down
export const FALLBACK_USE_CASES: UseCase[] = [
  { slug: "car-wash", title: "Car Wash", imageKey: "car_wash_1.jpg", description: "Automated and self-service car wash facilities" },
  { slug: "hotel", title: "Hotel / Motel", imageKey: "hotel_motel_holidayinn_1.jpg", description: "Hotels, motels, and hospitality properties" },
  { slug: "office", title: "Office Building", imageKey: "office_building2.jpg", description: "Commercial office spaces and business centers" },
  { slug: "data-center", title: "Data Center", imageKey: "data-center-1.jpg", description: "Data centers and server farms" },
  { slug: "manufacturing", title: "Manufacturing", imageKey: "manufacturing_1.jpg", description: "Manufacturing plants and industrial facilities" },
  { slug: "hospital", title: "Hospital", imageKey: "hospital_1.jpg", description: "Hospitals and medical facilities" },
  { slug: "cold-storage", title: "Cold Storage", imageKey: "cold_storage.jpg", description: "Refrigerated warehouses and cold storage" },
  { slug: "ev-charging", title: "EV Charging", imageKey: "ev_charging_station.jpg", description: "Electric vehicle charging stations" },
  { slug: "restaurant", title: "Restaurant", imageKey: "restaurant_1.jpg", description: "Restaurants and food service" },
  { slug: "retail", title: "Retail Store", imageKey: "retail_2.jpg", description: "Retail stores and shopping centers" },
  { slug: "warehouse", title: "Warehouse", imageKey: "logistics_1.jpg", description: "Warehouses and distribution centers" },
  { slug: "apartment", title: "Apartment Complex", imageKey: "apartment_building.jpg", description: "Multi-family residential buildings" },
  { slug: "college", title: "College / University", imageKey: "college_1.jpg", description: "Educational institutions and campuses" },
  { slug: "airport", title: "Airport", imageKey: "airport_11.jpeg", description: "Airports and aviation facilities" },
  { slug: "gas-station", title: "Gas Station", imageKey: "gas_station.jpg", description: "Gas stations and convenience stores" },
  { slug: "indoor-farm", title: "Indoor Farm", imageKey: "indoor_farm1.jpg", description: "Vertical farms and controlled environment agriculture" },
  { slug: "casino", title: "Casino / Gaming", imageKey: "casino_gaming1.jpg", description: "Casinos and gaming facilities" },
  { slug: "shopping-center", title: "Shopping Center", imageKey: "shopping_center.jpg", description: "Shopping malls and retail centers" },
];

/**
 * Get all available use cases from API (with fallback)
 * 
 * ✅ Prefer API route so Step3 never depends on Supabase wiring
 * ✅ Fallback to static list if API fails (schema immunity)
 */
export async function getUseCases(): Promise<UseCase[]> {
  try {
    const res = await fetch("/api/use-cases");
    
    if (!res.ok) {
      console.warn(`⚠️ /api/use-cases returned ${res.status}, using fallback`);
      return FALLBACK_USE_CASES;
    }
    
    const data = await res.json();
    
    if (Array.isArray(data?.useCases) && data.useCases.length > 0) {
      console.log(`✅ Loaded ${data.useCases.length} use cases from API`);
      return data.useCases;
    }
    
    console.warn("⚠️ /api/use-cases returned empty, using fallback");
    return FALLBACK_USE_CASES;
    
  } catch (error) {
    console.error("❌ Failed to fetch use cases from API:", error);
    console.log("✅ Using fallback use cases");
    return FALLBACK_USE_CASES;
  }
}

/**
 * Get a single use case by slug
 */
export async function getUseCaseBySlug(slug: string): Promise<UseCase | null> {
  const useCases = await getUseCases();
  return useCases.find(uc => uc.slug === slug) || null;
}
