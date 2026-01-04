/**
 * INDUSTRY PROFILES INDEX
 * =======================
 * 
 * Central export for all industry-specific calculation profiles.
 * Each profile contains:
 * - Load profiles by tier/type
 * - Question definitions
 * - Calculation functions
 * - System sizing recommendations
 * 
 * Industries Covered:
 * 1. Hotel / Hospitality ✓
 * 2. Car Wash ✓
 * 3. EV Charging Hub ✓
 * 4. Data Center ✓
 * 5. Hospital / Healthcare ✓
 * 6. Manufacturing ✓
 * 7. Retail / Commercial ✓
 * 8. Restaurant ✓
 * 9. Office Building ✓
 * 10. University / Campus ✓
 * 
 * Created: December 31, 2025
 */

// Completed profiles
export * from '../hotelIndustryProfile';
export * from '../carWashIndustryProfile';
export * from '../evChargingHubIndustryProfile';
export * from '../dataCenterIndustryProfile';
export * from '../manufacturingIndustryProfile';
export * from '../hospitalIndustryProfile';
export * from '../universityIndustryProfile';
export * from '../restaurantIndustryProfile';
export * from '../retailIndustryProfile';
export * from '../officeIndustryProfile';
export * from '../agricultureIndustryProfile';
export * from '../warehouseIndustryProfile';

// Placeholder exports for pending profiles
// export * from './dataCenterProfile';
// export * from './hospitalProfile';
// export * from './manufacturingProfile';
// export * from './retailProfile';
// export * from './restaurantProfile';
// export * from './officeProfile';
// export * from './universityProfile';

// ============================================================================
// INDUSTRY REGISTRY
// ============================================================================

export type IndustryId = 
  | 'hotel'
  | 'car_wash'
  | 'ev_charging'
  | 'data_center'
  | 'hospital'
  | 'manufacturing'
  | 'retail'
  | 'restaurant'
  | 'office'
  | 'college'
  | 'agriculture'
  | 'warehouse';

export interface IndustryMeta {
  id: IndustryId;
  name: string;
  icon: string;
  description: string;
  status: 'active' | 'pending' | 'beta';
  profileModule: string;
}

export const INDUSTRY_REGISTRY: IndustryMeta[] = [
  {
    id: 'hotel',
    name: 'Hotel / Hospitality',
    icon: '🏨',
    description: 'Hotels, resorts, motels, and lodging facilities',
    status: 'active',
    profileModule: '../hotelIndustryProfile'
  },
  {
    id: 'car_wash',
    name: 'Car Wash',
    icon: '🚗',
    description: 'Express tunnels, full-service, and self-serve car washes',
    status: 'active',
    profileModule: '../carWashIndustryProfile'
  },
  {
    id: 'ev_charging',
    name: 'EV Charging Hub',
    icon: '⚡',
    description: 'Dedicated EV charging stations and fleet charging',
    status: 'active',
    profileModule: '../evChargingHubIndustryProfile'
  },
  {
    id: 'data_center',
    name: 'Data Center',
    icon: '🖥️',
    description: 'Colocation, enterprise, and edge data centers',
    status: 'active',
    profileModule: '../dataCenterIndustryProfile'
  },
  {
    id: 'hospital',
    name: 'Hospital / Healthcare',
    icon: '🏥',
    description: 'Hospitals, clinics, and medical facilities',
    status: 'active',
    profileModule: '../hospitalIndustryProfile'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '🏭',
    description: 'Factories, production facilities, and industrial plants',
    status: 'active',
    profileModule: '../manufacturingIndustryProfile'
  },
  {
    id: 'retail',
    name: 'Retail / Commercial',
    icon: '🏬',
    description: 'Retail stores, shopping centers, and commercial spaces',
    status: 'active',
    profileModule: '../retailIndustryProfile'
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Quick-service, casual dining, and fine dining restaurants',
    status: 'active',
    profileModule: '../restaurantIndustryProfile'
  },
  {
    id: 'office',
    name: 'Office Building',
    icon: '🏢',
    description: 'Corporate offices, co-working spaces, and business parks',
    status: 'active',
    profileModule: '../officeIndustryProfile'
  },
  {
    id: 'agriculture',
    name: 'Agriculture / Farming',
    icon: '🌾',
    description: 'Farms, ranches, greenhouses, and agricultural operations',
    status: 'active',
    profileModule: '../agricultureIndustryProfile'
  },
  {
    id: 'warehouse',
    name: 'Warehouse / Logistics',
    icon: '📦',
    description: 'Warehouses, distribution centers, fulfillment centers, and logistics facilities',
    status: 'active',
    profileModule: '../warehouseIndustryProfile'
  },
  {
    id: 'college',
    name: 'University / Campus',
    icon: '🎓',
    description: 'Universities, colleges, and educational campuses',
    status: 'active',
    profileModule: '../universityIndustryProfile'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getIndustryMeta(id: IndustryId): IndustryMeta | undefined {
  return INDUSTRY_REGISTRY.find(i => i.id === id);
}

export function getActiveIndustries(): IndustryMeta[] {
  return INDUSTRY_REGISTRY.filter(i => i.status === 'active');
}

export function getPendingIndustries(): IndustryMeta[] {
  return INDUSTRY_REGISTRY.filter(i => i.status === 'pending');
}
