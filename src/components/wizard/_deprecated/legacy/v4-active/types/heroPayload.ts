/**
 * HERO TO WIZARD PAYLOAD
 * ======================
 * 
 * December 2025 - Requirement C
 * 
 * Type definitions and utilities for passing values from
 * Hero Calculator to the Wizard via sessionStorage.
 * 
 * This enables:
 * - All 15+ Hero calculator inputs to be passed to wizard
 * - Calculated values (peakDemandKW, monthlyCharges) to be passed
 * - Wizard to skip redundant questions that Hero already captured
 */

// ============================================
// HERO TO WIZARD PAYLOAD INTERFACE
// ============================================

export interface HeroToWizardPayload {
  // Source identification
  source: 'hotel-hero' | 'carwash-hero' | 'ev-hero' | 'generic-hero';
  timestamp: number;
  
  // Property Basics
  rooms?: number;                    // Hotel specific
  hotelClass?: 'economy' | 'midscale' | 'upscale' | 'luxury';
  buildingSqFt?: number;
  
  // Pool Facilities  
  hasIndoorPool?: boolean;
  hasOutdoorPool?: boolean;
  
  // Dining & Events
  hasRestaurant?: boolean;
  restaurantCount?: number;
  hasMeetingSpace?: boolean;         // Conference rooms
  hasEventCenter?: boolean;
  
  // Additional Amenities
  hasSpa?: boolean;
  hasFitnessCenter?: boolean;
  
  // Laundry
  hasLaundry?: boolean;
  laundryMachines?: number;
  
  // EV & Parking
  hasEVChargers?: boolean;
  evChargerCount?: number;
  wantsSolarCanopy?: boolean;
  
  // Resort-specific (luxury hotels)
  hasClubhouse?: boolean;
  hasGolfCourse?: boolean;
  golfCartCount?: number;
  
  // Other facility details
  elevatorCount?: number;
  parkingLotSize?: number;
  
  // Location
  state: string;
  zipCode?: string;
  
  // Calculated values (from hero calculator)
  peakDemandKW: number;
  monthlyCharges: number;
  estimatedAnnualSavings?: number;
  estimatedPayback?: number;
  
  // Storage preferences (if user selected)
  storageHours?: number;
  
  // Car wash specific
  bayCount?: number;
  washType?: 'selfService' | 'automatic' | 'tunnel' | 'fullService';
  
  // EV charging specific
  level2Chargers?: number;
  dcfcChargers?: number;
  hpcChargers?: number;
  dailyVehicles?: number;
}

// ============================================
// STORAGE KEYS
// ============================================

const HERO_PAYLOAD_KEY = 'merlin_heroPayload';
const HERO_PAYLOAD_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Store hero payload in sessionStorage for wizard to read
 */
export function storeHeroPayload(payload: HeroToWizardPayload): void {
  try {
    const payloadWithTimestamp = {
      ...payload,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(HERO_PAYLOAD_KEY, JSON.stringify(payloadWithTimestamp));
    console.log('📦 [HeroPayload] Stored payload:', payloadWithTimestamp);
  } catch (error) {
    console.error('❌ [HeroPayload] Failed to store payload:', error);
  }
}

/**
 * Retrieve hero payload from sessionStorage
 * Returns null if not found or expired
 */
export function getHeroPayload(): HeroToWizardPayload | null {
  try {
    const stored = sessionStorage.getItem(HERO_PAYLOAD_KEY);
    if (!stored) return null;
    
    const payload = JSON.parse(stored) as HeroToWizardPayload;
    
    // Check if expired
    const age = Date.now() - (payload.timestamp || 0);
    if (age > HERO_PAYLOAD_EXPIRY_MS) {
      console.log('⏰ [HeroPayload] Payload expired, clearing...');
      clearHeroPayload();
      return null;
    }
    
    console.log('📦 [HeroPayload] Retrieved payload:', payload);
    return payload;
  } catch (error) {
    console.error('❌ [HeroPayload] Failed to retrieve payload:', error);
    return null;
  }
}

/**
 * Clear hero payload from sessionStorage
 */
export function clearHeroPayload(): void {
  try {
    sessionStorage.removeItem(HERO_PAYLOAD_KEY);
    console.log('🧹 [HeroPayload] Cleared payload');
  } catch (error) {
    console.error('❌ [HeroPayload] Failed to clear payload:', error);
  }
}

/**
 * Check if there's a valid hero payload available
 */
export function hasValidHeroPayload(): boolean {
  return getHeroPayload() !== null;
}

/**
 * Build navigation URL for wizard with source parameter
 */
export function getWizardUrlWithSource(source: HeroToWizardPayload['source']): string {
  return `/wizard?source=${source}`;
}

// ============================================
// HOTEL-SPECIFIC HELPERS
// ============================================

/**
 * Auto-determine hotel class from room count
 * Matches the logic in HotelEnergy.tsx hero calculator
 */
export function getHotelClassFromRooms(rooms: number): 'economy' | 'midscale' | 'upscale' | 'luxury' {
  if (rooms < 75) return 'economy';
  if (rooms < 150) return 'midscale';
  if (rooms < 300) return 'upscale';
  return 'luxury';
}

/**
 * Get hotel class display label
 */
export function getHotelClassLabel(hotelClass: string): string {
  const labels: Record<string, string> = {
    economy: 'Economy / Budget',
    midscale: 'Midscale',
    upscale: 'Upscale',
    luxury: 'Luxury / Resort',
  };
  return labels[hotelClass] || hotelClass;
}

/**
 * Build amenities summary string for display
 */
export function buildAmenitiesSummary(payload: HeroToWizardPayload): string[] {
  const amenities: string[] = [];
  
  if (payload.hasIndoorPool) amenities.push('Indoor Pool');
  if (payload.hasOutdoorPool) amenities.push('Outdoor Pool');
  if (payload.hasRestaurant) {
    amenities.push(payload.restaurantCount && payload.restaurantCount > 1 
      ? `${payload.restaurantCount} Restaurants` 
      : 'Restaurant');
  }
  if (payload.hasMeetingSpace) amenities.push('Meeting Space');
  if (payload.hasEventCenter) amenities.push('Event Center');
  if (payload.hasSpa) amenities.push('Spa/Sauna');
  if (payload.hasFitnessCenter) amenities.push('Fitness Center');
  if (payload.hasLaundry && payload.laundryMachines) {
    amenities.push(`${payload.laundryMachines} Laundry Machines`);
  }
  if (payload.hasEVChargers && payload.evChargerCount) {
    amenities.push(`${payload.evChargerCount} EV Chargers`);
  }
  if (payload.hasClubhouse) amenities.push('Clubhouse');
  if (payload.hasGolfCourse) amenities.push('Golf Course');
  
  return amenities;
}

// ============================================
// STATE RATE HELPERS
// ============================================

/**
 * Get average electricity rate for a state (for display purposes)
 * This should match the rates used in hero calculators
 */
export function getStateAvgRate(state: string): string {
  const rates: Record<string, number> = {
    'California': 0.20,
    'Nevada': 0.12,
    'Texas': 0.11,
    'Florida': 0.13,
    'New York': 0.18,
    'Hawaii': 0.35,
    // Add more as needed
  };
  const rate = rates[state] || 0.12;
  return rate.toFixed(2);
}

// ============================================
// GOALS DATA
// ============================================

export interface Goal {
  id: string;
  label: string;
  description: string;
  icon: string; // Icon name for lookup
}

export const WIZARD_GOALS: Goal[] = [
  { 
    id: 'demand-charges', 
    label: 'Reduce Demand Charges', 
    description: 'Lower utility bills by shaving peak demand',
    icon: 'TrendingDown',
  },
  { 
    id: 'backup-power', 
    label: 'Backup Power / Resilience', 
    description: 'Keep operations running during outages',
    icon: 'Shield',
  },
  { 
    id: 'tou-optimization', 
    label: 'Time-of-Use Optimization', 
    description: 'Arbitrage cheap off-peak electricity',
    icon: 'Clock',
  },
  { 
    id: 'solar-consumption', 
    label: 'Solar Self-Consumption', 
    description: 'Store and use your own solar power',
    icon: 'Sun',
  },
  { 
    id: 'ev-support', 
    label: 'EV Charging Support', 
    description: 'Power EV chargers without grid upgrades',
    icon: 'Car',
  },
  { 
    id: 'grid-independence', 
    label: 'Grid Independence', 
    description: 'Reduce reliance on utility power',
    icon: 'Zap',
  },
];

// ============================================
// BACKUP REQUIREMENT OPTIONS
// ============================================

export const BACKUP_IMPORTANCE_OPTIONS = [
  { id: 'nice-to-have', label: 'Nice to Have', description: 'Would be helpful but not critical' },
  { id: 'important', label: 'Important', description: 'Needed for smooth operations' },
  { id: 'critical', label: 'Critical', description: 'Essential - cannot operate without power' },
];

export const BACKUP_DURATION_OPTIONS = [
  { id: '1-2hrs', label: '1-2 hours', description: 'Bridge short outages' },
  { id: '4-8hrs', label: '4-8 hours', description: 'Extended backup capability' },
  { id: '12-24hrs', label: '12-24 hours', description: 'Full day backup' },
  { id: '24+hrs', label: '24+ hours', description: 'Multi-day resilience' },
];

export const TIMELINE_OPTIONS = [
  { id: 'asap', label: 'ASAP', description: 'Ready to move forward now' },
  { id: 'this-year', label: 'This Year', description: 'Within the next 6-12 months' },
  { id: 'next-year', label: 'Next Year', description: '12-24 months out' },
  { id: 'exploring', label: 'Just Exploring', description: 'Gathering information' },
];

export const BUDGET_RANGE_OPTIONS = [
  { id: '<250k', label: '<$250K' },
  { id: '250k-500k', label: '$250K-$500K' },
  { id: '500k-1m', label: '$500K-$1M' },
  { id: '1m+', label: '$1M+' },
  { id: 'flexible', label: 'Flexible' },
];
