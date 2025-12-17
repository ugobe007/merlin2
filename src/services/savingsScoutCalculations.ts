/**
 * Savings Scout™ Calculation Service
 * ====================================
 * 
 * Calculates energy savings opportunities based on:
 * - State utility rates (EIA data)
 * - Solar resources (NREL data)
 * - Facility profile
 * - User inputs
 * 
 * SINGLE SOURCE OF TRUTH for Savings Scout calculations.
 * 
 * @version 1.0
 * @created December 2025
 */

import type { Opportunity, OpportunityStatus, SavingsScoutResult } from '@/types/savingsScout';
import { 
  getStateUtilityData, 
  getStateSolarData,
  DEFAULT_UTILITY_DATA,
  DEFAULT_SOLAR_DATA
} from '@/data/utilityData';

// ============================================
// TYPES
// ============================================

export interface FacilityInputs {
  rooms?: number;
  hasEVChargers?: boolean;
  evChargerCount?: number;
  evChargersL2?: number;
  evChargersDCFC?: number;
  evChargersHPC?: number;
  gridConnection?: 'on-grid' | 'unreliable' | 'limited' | 'off-grid';
}

// ============================================
// STATUS PRIORITY ORDER
// For sorting results
// ============================================

const STATUS_PRIORITY: Record<OpportunityStatus, number> = {
  'critical': 0,
  'high': 1,
  'moderate': 2,
  'useful': 3,
  'low': 4,
  'not-recommended': 5,
};

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate all savings opportunities based on inputs
 * 
 * @param state - US state name (e.g., "Nevada", "California")
 * @param peakDemandKW - Facility peak demand in kW
 * @param industryProfile - Industry type (e.g., "hotel", "hospital")
 * @param userInputs - Optional facility details
 * @returns Sorted array of opportunities
 */
export function calculateSavingsOpportunities(
  state: string,
  peakDemandKW: number,
  industryProfile: string,
  userInputs?: FacilityInputs
): Opportunity[] {
  const opportunities: Opportunity[] = [];
  
  // Get state-specific data
  const stateData = getStateUtilityData(state);
  const solarData = getStateSolarData(state);
  
  // Normalize industry profile
  const industry = industryProfile.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════════════
  // 1. PEAK SHAVING
  // Trigger: Demand charges > $10/kW
  // Source: EIA State Utility Rate Database
  // ═══════════════════════════════════════════════════════════════════
  if (stateData.demandChargePerKW > 10) {
    const peakShavingPercent = 0.3; // 30% reduction typical with BESS
    const monthlyPotential = Math.round(
      peakDemandKW * stateData.demandChargePerKW * peakShavingPercent
    );
    
    opportunities.push({
      id: 'peak-shaving',
      name: 'Peak Shaving',
      status: stateData.demandChargePerKW > 15 ? 'high' : 'moderate',
      icon: '⚡',
      reason: `${stateData.utilityName}: $${stateData.demandChargePerKW}/kW demand charge`,
      potentialMonthly: monthlyPotential,
      potentialAnnual: monthlyPotential * 12,
      dataSource: 'EIA State Utility Rate Database',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 2. SOLAR GENERATION
  // Trigger: Sun-hours > 4.5/day
  // Source: NREL Solar Resource Data
  // ═══════════════════════════════════════════════════════════════════
  if (solarData.peakSunHours > 4.5) {
    // Assume solar sized at 50% of peak demand
    const solarKW = peakDemandKW * 0.5;
    const dailyKWh = solarKW * solarData.peakSunHours;
    const monthlyKWh = dailyKWh * 30;
    const monthlyPotential = Math.round(monthlyKWh * stateData.electricityRate);
    
    let status: OpportunityStatus = 'moderate';
    if (solarData.peakSunHours > 5.5) status = 'high';
    
    opportunities.push({
      id: 'solar',
      name: 'Solar Generation',
      status,
      icon: '☀️',
      reason: `${solarData.peakSunHours.toFixed(1)} peak sun-hours/day in ${state}`,
      potentialMonthly: monthlyPotential,
      potentialAnnual: monthlyPotential * 12,
      dataSource: 'NREL Solar Resource Data',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 3. TOU ARBITRAGE
  // Trigger: Peak/off-peak spread > $0.05
  // Source: EIA Time-of-Use Rate Data
  // ═══════════════════════════════════════════════════════════════════
  const touSpread = (stateData.peakRate || 0) - (stateData.offPeakRate || 0);
  if (touSpread > 0.05) {
    // Assume 4 hours of arbitrage per day at 30% of peak
    const dailyArbitrage = peakDemandKW * 0.3 * 4 * touSpread;
    const monthlyPotential = Math.round(dailyArbitrage * 30);
    
    opportunities.push({
      id: 'tou-arbitrage',
      name: 'TOU Arbitrage',
      status: touSpread > 0.10 ? 'high' : 'moderate',
      icon: '📊',
      reason: `$${touSpread.toFixed(2)} off-peak spread available`,
      potentialMonthly: monthlyPotential,
      potentialAnnual: monthlyPotential * 12,
      dataSource: 'EIA Time-of-Use Rate Data',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 4. EV CHARGING REVENUE
  // Trigger: Hotel/retail/office + parking
  // Source: Industry Profile Analysis
  // ═══════════════════════════════════════════════════════════════════
  const evEligibleIndustries = ['hotel', 'retail', 'office', 'mixed-use', 'parking', 'shopping-center', 'mall'];
  if (evEligibleIndustries.some(i => industry.includes(i))) {
    let reason = 'Employee + visitor charging opportunity';
    
    if (industry.includes('hotel')) {
      reason = 'Hotel guests + public charging demand';
    } else if (industry.includes('retail') || industry.includes('shopping') || industry.includes('mall')) {
      reason = 'Customer charging while shopping';
    } else if (industry.includes('office')) {
      reason = 'Employee + visitor charging';
    }
    
    opportunities.push({
      id: 'ev-charging',
      name: 'EV Charging Revenue',
      status: 'high',
      icon: '🔌',
      reason,
      potentialMonthly: 0, // Revenue varies widely by usage
      potentialAnnual: 0,
      dataSource: 'Industry Profile Analysis',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 5. POWER SMOOTHING
  // Trigger: EV chargers > 4 OR DCFC present
  // Source: User Inputs
  // ═══════════════════════════════════════════════════════════════════
  const totalEVChargers = (userInputs?.evChargerCount || 0) + 
                          (userInputs?.evChargersL2 || 0);
  const hasDCFC = (userInputs?.evChargersDCFC || 0) > 0;
  const hasHPC = (userInputs?.evChargersHPC || 0) > 0;
  
  if (totalEVChargers > 4 || hasDCFC || hasHPC) {
    opportunities.push({
      id: 'power-smoothing',
      name: 'Power Smoothing',
      status: 'useful',
      icon: '🔋',
      reason: hasDCFC || hasHPC 
        ? 'Essential with DC fast/high-power chargers for grid stability'
        : 'Recommended with multiple EV chargers for grid stability',
      potentialMonthly: 0,
      potentialAnnual: 0,
      dataSource: 'User Inputs (EV Charger Configuration)',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 6. UPS / BACKUP POWER
  // Trigger: Data center, hospital, hotel with elevators
  // Source: Industry Profile (Critical Infrastructure)
  // ═══════════════════════════════════════════════════════════════════
  const criticalIndustries = ['hotel', 'hospital', 'healthcare', 'data-center', 'data center', 'datacenter'];
  if (criticalIndustries.some(i => industry.includes(i))) {
    let reason = 'Critical infrastructure protection';
    
    if (industry.includes('hotel')) {
      reason = 'Elevators, data center, emergency lighting, guest safety';
    } else if (industry.includes('hospital') || industry.includes('healthcare')) {
      reason = 'Life-critical systems, regulatory compliance (CMS/Joint Commission)';
    } else if (industry.includes('data')) {
      reason = 'Server uptime, SLA requirements, revenue protection';
    }
    
    opportunities.push({
      id: 'ups-backup',
      name: 'UPS / Backup Power',
      status: 'critical',
      icon: '🛡️',
      reason,
      potentialMonthly: 0,
      potentialAnnual: 0,
      dataSource: 'Industry Profile (Critical Infrastructure)',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 7. MICROGRIDS
  // Trigger: Off-grid OR unreliable grid OR > 2MW
  // Source: User Inputs + Grid Reliability Data
  // ═══════════════════════════════════════════════════════════════════
  const gridConnection = userInputs?.gridConnection || 'on-grid';
  
  if (gridConnection === 'off-grid' || 
      gridConnection === 'unreliable' || 
      gridConnection === 'limited' ||
      peakDemandKW > 2000) {
    
    let reason = '';
    let status: OpportunityStatus = 'moderate';
    
    if (gridConnection === 'off-grid') {
      reason = 'Off-grid configuration requires islanding capability';
      status = 'high';
    } else if (gridConnection === 'unreliable') {
      reason = 'Unreliable grid - backup islanding recommended';
      status = 'high';
    } else if (gridConnection === 'limited') {
      reason = 'Limited grid capacity - microgrid provides flexibility';
      status = 'moderate';
    } else if (peakDemandKW > 2000) {
      reason = 'Large facility (>2 MW) - microgrid provides operational flexibility';
      status = 'high';
    }
    
    opportunities.push({
      id: 'microgrids',
      name: 'Microgrid Configuration',
      status,
      icon: '🏘️',
      reason,
      potentialMonthly: 0,
      potentialAnnual: 0,
      dataSource: 'User Inputs + Grid Reliability Data',
    });
  } else {
    // Add as not-recommended for completeness
    opportunities.push({
      id: 'microgrids',
      name: 'Microgrid Configuration',
      status: 'not-recommended',
      icon: '🏘️',
      reason: 'Facility size and grid reliability don\'t require microgrid capabilities',
      potentialMonthly: 0,
      potentialAnnual: 0,
      dataSource: 'Facility Size Analysis',
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // SORT BY PRIORITY
  // Order: critical → high → moderate → useful → low → not-recommended
  // ═══════════════════════════════════════════════════════════════════
  return opportunities.sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
}

/**
 * Get full Savings Scout result with aggregations
 */
export function getSavingsScoutResult(
  state: string,
  peakDemandKW: number,
  industryProfile: string,
  userInputs?: FacilityInputs
): SavingsScoutResult {
  const opportunities = calculateSavingsOpportunities(state, peakDemandKW, industryProfile, userInputs);
  
  // Calculate totals (excluding not-recommended)
  const validOpportunities = opportunities.filter(o => o.status !== 'not-recommended');
  
  const totalAnnualPotential = validOpportunities.reduce(
    (sum, o) => sum + o.potentialAnnual, 
    0
  );
  
  const highPriorityCount = opportunities.filter(
    o => o.status === 'high' || o.status === 'critical'
  ).length;
  
  return {
    opportunities,
    totalAnnualPotential,
    highPriorityCount,
  };
}

// Export for convenience
export { getStateUtilityData, getStateSolarData };
