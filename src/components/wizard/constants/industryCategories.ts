/**
 * INDUSTRY CATEGORIES
 * ===================
 * 
 * Organized industry selection with 6 clean categories.
 * Users can quickly find their industry without scrolling through a flat list.
 * 
 * Categories:
 * 1. Commercial - Retail, hospitality, offices
 * 2. Industrial - Manufacturing, warehouses, logistics
 * 3. Residential - Apartments, communities
 * 4. Institutional - Hospitals, schools, government
 * 5. Agricultural - Farms, cold storage, processing
 * 6. Other/Custom - Specialized use cases
 */

import { 
  Building2, 
  Factory, 
  Home, 
  GraduationCap, 
  Leaf, 
  MoreHorizontal,
  Hotel,
  ShoppingCart,
  Briefcase,
  Car,
  Warehouse,
  Cpu,
  HeartPulse,
  Building,
  School,
  Landmark,
  PlaneTakeoff,
  Dice5,
  Wheat,
  Snowflake,
  Sun,
  Droplets,
  Zap,
  Network
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================
// INDUSTRY CATEGORY DEFINITIONS
// ============================================

export interface IndustryItem {
  id: string;            // Database slug (e.g., 'hotel', 'car-wash')
  name: string;          // Display name
  icon: LucideIcon;      // Icon component
  popular?: boolean;     // Show in "Popular" quick picks
  description?: string;  // Brief description
}

export interface IndustryCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;         // Category accent color
  industries: IndustryItem[];
}

export const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  {
    id: 'commercial',
    name: 'Commercial',
    icon: Building2,
    color: '#6700b6',  // Purple
    industries: [
      { id: 'hotel', name: 'Hotel & Hospitality', icon: Hotel, popular: true, description: 'Hotels, resorts, motels' },
      { id: 'retail', name: 'Retail & Shopping', icon: ShoppingCart, popular: true, description: 'Stores, shopping centers' },
      { id: 'office', name: 'Office Buildings', icon: Briefcase, popular: true, description: 'Commercial offices' },
      { id: 'ev-charging', name: 'EV Charging', icon: Zap, popular: true, description: 'Charging stations & hubs' },
      { id: 'car-wash', name: 'Car Wash', icon: Droplets, popular: true, description: 'Self-service & automatic' },
      { id: 'gas-station', name: 'Gas Station', icon: Car, description: 'C-stores & fuel stations' },
      { id: 'shopping-center', name: 'Shopping Center', icon: ShoppingCart, description: 'Malls & shopping plazas' },
      { id: 'casino', name: 'Casino & Gaming', icon: Dice5, description: 'Casinos, gaming facilities' },
    ],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    icon: Factory,
    color: '#0066CC',  // Blue
    industries: [
      { id: 'manufacturing', name: 'Manufacturing', icon: Factory, popular: true, description: 'Production facilities' },
      { id: 'warehouse', name: 'Warehouse & Logistics', icon: Warehouse, description: 'Distribution centers' },
      { id: 'data-center', name: 'Data Center', icon: Cpu, description: 'Critical IT infrastructure' },
      { id: 'cold-storage', name: 'Cold Storage', icon: Snowflake, description: 'Refrigerated warehouses' },
    ],
  },
  {
    id: 'residential',
    name: 'Residential',
    icon: Home,
    color: '#059669',  // Green
    industries: [
      { id: 'residential', name: 'Residential Home', icon: Home, description: 'Single-family homes' },
      { id: 'apartment', name: 'Apartment Complex', icon: Building, description: 'Multi-unit residential' },
    ],
  },
  {
    id: 'institutional',
    name: 'Institutional',
    icon: GraduationCap,
    color: '#DC2626',  // Red
    industries: [
      { id: 'hospital', name: 'Hospital & Healthcare', icon: HeartPulse, description: 'Medical facilities' },
      { id: 'college', name: 'College & University', icon: GraduationCap, description: 'Educational campuses' },
      { id: 'government', name: 'Government & Public', icon: Landmark, description: 'Public facilities' },
      { id: 'airport', name: 'Airport', icon: PlaneTakeoff, description: 'Aviation facilities' },
    ],
  },
  {
    id: 'agricultural',
    name: 'Agricultural',
    icon: Leaf,
    color: '#65A30D',  // Lime
    industries: [
      { id: 'agricultural', name: 'Agricultural', icon: Wheat, description: 'Farms & ranches' },
      { id: 'indoor-farm', name: 'Indoor Farm', icon: Sun, description: 'Vertical & indoor farming' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: MoreHorizontal,
    color: '#6B7280',  // Gray
    industries: [
      { id: 'microgrid', name: 'Microgrid & Renewable', icon: Network, description: 'Microgrids, hybrid systems' },
    ],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all "popular" industries across all categories
 * For quick-pick display at top of selector
 */
export function getPopularIndustries(): IndustryItem[] {
  const popular: IndustryItem[] = [];
  INDUSTRY_CATEGORIES.forEach(category => {
    category.industries.forEach(industry => {
      if (industry.popular) {
        popular.push(industry);
      }
    });
  });
  return popular;
}

/**
 * Find industry by ID across all categories
 */
export function findIndustryById(id: string): IndustryItem | undefined {
  for (const category of INDUSTRY_CATEGORIES) {
    const found = category.industries.find(ind => ind.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Find category by industry ID
 */
export function findCategoryByIndustryId(id: string): IndustryCategory | undefined {
  for (const category of INDUSTRY_CATEGORIES) {
    const found = category.industries.find(ind => ind.id === id);
    if (found) return category;
  }
  return undefined;
}

/**
 * Get all industry IDs (for validation)
 */
export function getAllIndustryIds(): string[] {
  const ids: string[] = [];
  INDUSTRY_CATEGORIES.forEach(category => {
    category.industries.forEach(industry => {
      ids.push(industry.id);
    });
  });
  return ids;
}
