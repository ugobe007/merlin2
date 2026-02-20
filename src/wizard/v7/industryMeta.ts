/**
 * INDUSTRY METADATA — SINGLE SOURCE OF TRUTH
 * ============================================
 *
 * Created: February 6, 2026
 *
 * CANONICAL registry for industry icons, labels, and display properties.
 * EVERY UI surface that shows industry info should import from HERE.
 *
 * USAGE:
 *   import { getIndustryMeta, INDUSTRY_META, canonicalizeSlug } from '@/wizard/v7/industryMeta';
 *
 *   const meta = getIndustryMeta('data_center');
 *   // → { icon: '🖥️', label: 'Data Center', slug: 'data_center', image: 'data_center.jpg' }
 *
 * SLUG FORMAT:
 *   This file uses UNDERSCORE slugs (data_center, car_wash) to match:
 *   - WizardV7 state (IndustrySlug type uses underscores)
 *   - Template JSON filenames (data_center.v1.json)
 *   - Manifest entries (industrySlug: "data_center")
 *
 *   canonicalizeSlug() handles hyphen→underscore conversion.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface IndustryMetaEntry {
  /** Emoji icon (universal, no dependency) */
  icon: string;
  /** Display label for UI */
  label: string;
  /** Canonical slug (underscore format) */
  slug: string;
  /** Optional hero image filename (in /images/ directory) */
  image?: string;
  /** Short description for cards/tooltips */
  description?: string;
  /** Whether this industry has a full curated 16Q template */
  hasTemplate: boolean;
}

// ============================================================================
// CANONICAL INDUSTRY METADATA
// ============================================================================

export const INDUSTRY_META: Record<string, IndustryMetaEntry> = {
  office: {
    icon: "🏢",
    label: "Office Building",
    slug: "office",
    image: "office_building1.jpg",
    description: "Commercial office, co-working, corporate campus",
    hasTemplate: true,
  },
  hotel: {
    icon: "🏨",
    label: "Hotel / Resort",
    slug: "hotel",
    image: "hotel_motel_holidayinn_1.jpg",
    description: "Hotels, motels, resorts, extended stay",
    hasTemplate: true,
  },
  hospital: {
    icon: "🏥",
    label: "Healthcare Facility",
    slug: "hospital",
    image: "hospital_1.jpg",
    description: "Hospitals, clinics, medical centers",
    hasTemplate: true,
  },
  /** Alias: WizardV7 IndustrySlug uses "healthcare" */
  healthcare: {
    icon: "🏥",
    label: "Healthcare",
    slug: "healthcare",
    image: "hospital_1.jpg",
    description: "Clinics, hospitals, labs",
    hasTemplate: true,
  },
  data_center: {
    icon: "🖥️",
    label: "Data Center",
    slug: "data_center",
    image: "data_center_1.jpg",
    description: "Colocation, enterprise, hyperscale, edge",
    hasTemplate: true,
  },
  car_wash: {
    icon: "🚿",
    label: "Car Wash",
    slug: "car_wash",
    image: "car_wash_1.jpg",
    description: "Tunnel, automatic, self-serve, detail",
    hasTemplate: true,
  },
  ev_charging: {
    icon: "⚡",
    label: "EV Charging Station",
    slug: "ev_charging",
    image: "ev_charging_station.jpg",
    description: "Level 2, DCFC, HPC charging hubs",
    hasTemplate: true,
  },
  manufacturing: {
    icon: "🏭",
    label: "Manufacturing",
    slug: "manufacturing",
    image: "manufacturing_1.jpg",
    description: "Light industrial, heavy manufacturing, CNC, clean room",
    hasTemplate: true,
  },
  warehouse: {
    icon: "📦",
    label: "Warehouse / Logistics",
    slug: "warehouse",
    image: "logistics_1.jpg",
    description: "Distribution, cold storage, fulfillment",
    hasTemplate: false,
  },
  retail: {
    icon: "🛍️",
    label: "Retail / Shopping",
    slug: "retail",
    image: "retail_1.jpg",
    description: "Stores, shopping centers, malls",
    hasTemplate: false,
  },
  shopping_center: {
    icon: "🏬",
    label: "Shopping Center / Mall",
    slug: "shopping_center",
    description: "Malls, shopping plazas, multi-tenant retail",
    hasTemplate: false,
  },
  restaurant: {
    icon: "🍽️",
    label: "Restaurant",
    slug: "restaurant",
    image: "restaurant_1.jpg",
    description: "Full-service, fast food, food hall",
    hasTemplate: false,
  },
  gas_station: {
    icon: "⛽",
    label: "Gas / Truck Stop",
    slug: "gas_station",
    description: "Fuel stations, truck stops, convenience",
    hasTemplate: false,
  },
  truck_stop: {
    icon: "🚛",
    label: "Truck Stop / Travel Center",
    slug: "truck_stop",
    description: "Truck stops, travel plazas, fleet fueling",
    hasTemplate: false,
  },
  airport: {
    icon: "✈️",
    label: "Airport",
    slug: "airport",
    description: "Regional and international airports",
    hasTemplate: false,
  },
  casino: {
    icon: "🎰",
    label: "Casino & Gaming",
    slug: "casino",
    description: "Casinos, tribal gaming, resorts",
    hasTemplate: false,
  },
  college: {
    icon: "🎓",
    label: "College / University",
    slug: "college",
    description: "Higher education campuses",
    hasTemplate: false,
  },
  apartment: {
    icon: "🏠",
    label: "Apartment Complex",
    slug: "apartment",
    description: "Multi-family residential, condos",
    hasTemplate: false,
  },
  residential: {
    icon: "🏡",
    label: "Residential",
    slug: "residential",
    description: "Single-family, estates",
    hasTemplate: false,
  },
  cold_storage: {
    icon: "❄️",
    label: "Cold Storage",
    slug: "cold_storage",
    description: "Refrigerated warehouses, food storage",
    hasTemplate: false,
  },
  indoor_farm: {
    icon: "🌱",
    label: "Indoor Farm",
    slug: "indoor_farm",
    description: "Vertical farms, greenhouses, controlled environment",
    hasTemplate: false,
  },
  agriculture: {
    icon: "🌾",
    label: "Agriculture",
    slug: "agriculture",
    description: "Farms, irrigation, processing",
    hasTemplate: false,
  },
  government: {
    icon: "🏛️",
    label: "Government & Public",
    slug: "government",
    description: "Federal, state, municipal facilities",
    hasTemplate: false,
  },
  microgrid: {
    icon: "🔋",
    label: "Microgrid",
    slug: "microgrid",
    description: "Community microgrids, island grids, resilience hubs",
    hasTemplate: false,
  },
  other: {
    icon: "⚙️",
    label: "Other / Custom",
    slug: "other",
    description: "Custom facility type",
    hasTemplate: false,
  },
};

// ============================================================================
// SLUG CANONICALIZATION
// ============================================================================

/**
 * Convert any slug variant to the canonical underscore format.
 *
 * Handles: hyphens, mixed case, common aliases.
 *
 * @example
 *   canonicalizeSlug('data-center')  → 'data_center'
 *   canonicalizeSlug('car_wash')     → 'car_wash'
 *   canonicalizeSlug('healthcare')   → 'hospital'
 *   canonicalizeSlug('EV_Charging')  → 'ev_charging'
 */
export function canonicalizeSlug(slug: string): string {
  const normalized = slug.toLowerCase().replace(/-/g, "_");

  const aliases: Record<string, string> = {
    healthcare: "hospital",
    datacenter: "data_center",
    carwash: "car_wash",
    evcharging: "ev_charging",
    logistics: "warehouse",
    logistics_center: "warehouse",
    truck_stop: "gas_station",
    tribal_casino: "casino",
    casino_gaming: "casino",
    cold_storage: "cold_storage",
    indoor_farm: "indoor_farm",
  };

  return aliases[normalized] || (normalized in INDUSTRY_META ? normalized : "other");
}

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

/** Get metadata for an industry slug (handles any format). */
export function getIndustryMeta(slug: string): IndustryMetaEntry {
  const key = canonicalizeSlug(slug);
  return INDUSTRY_META[key] ?? INDUSTRY_META.other;
}

/** Get just the icon for a slug. */
export function getIndustryIcon(slug: string): string {
  return getIndustryMeta(slug).icon;
}

/** Get just the label for a slug. */
export function getIndustryLabel(slug: string): string {
  return getIndustryMeta(slug).label;
}

/** List all industry entries (for Step 2 grid). */
export function listIndustries(): IndustryMetaEntry[] {
  return Object.values(INDUSTRY_META).filter((e) => e.slug !== "other");
}

/** List only template-backed industries (have full 16Q questionnaire). */
export function listTemplateBackedIndustries(): IndustryMetaEntry[] {
  return Object.values(INDUSTRY_META).filter((e) => e.hasTemplate);
}
