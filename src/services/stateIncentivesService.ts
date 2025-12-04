/**
 * State Incentives Service
 * ========================
 * Database-driven state incentive lookups for BESS/Solar projects
 * 
 * Tables: state_incentives
 * Update Frequency: Quarterly
 * Source: DSIRE Database (https://www.dsireusa.org/)
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface StateIncentive {
  id: string;
  state_code: string;
  state_name: string;
  program_name: string;
  program_code: string;
  administrator: string;
  incentive_type: 'rebate' | 'tax_credit' | 'srec' | 'performance_payment' | 'grant' | 'loan';
  technology: 'storage' | 'solar' | 'solar_plus_storage' | 'ev_charger' | 'all';
  amount_type: 'per_kwh' | 'per_kw' | 'percentage' | 'fixed';
  amount: number;
  amount_unit: string;
  cap_amount: number | null;
  sector: 'residential' | 'commercial' | 'industrial' | 'all';
  min_system_size_kw: number | null;
  max_system_size_kw: number | null;
  requires_solar: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  funding_status: 'available' | 'waitlist' | 'closed' | 'limited';
  program_url: string | null;
  application_url: string | null;
  data_source: string;
  last_verified: string;
}

export interface IncentiveCalculation {
  programCode: string;
  programName: string;
  incentiveType: string;
  estimatedValue: number;
  valueUnit: string;
  isEligible: boolean;
  notes: string[];
  applicationUrl: string | null;
}

export interface IncentiveSummary {
  stateCode: string;
  stateName: string;
  totalEstimatedIncentives: number;
  incentiveBreakdown: IncentiveCalculation[];
  eligiblePrograms: number;
  totalPrograms: number;
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const cache: Map<string, { data: StateIncentive[]; timestamp: number }> = new Map();

function getCached(key: string): StateIncentive[] | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: StateIncentive[]): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Get all active incentives for a state
 */
export async function getStateIncentives(stateCode: string): Promise<StateIncentive[]> {
  const cacheKey = `incentives_${stateCode}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('state_incentives')
      .select('*')
      .eq('state_code', stateCode.toUpperCase())
      .eq('is_active', true)
      .order('amount', { ascending: false });

    if (error) {
      console.error('Error fetching state incentives:', error);
      return [];
    }

    const incentives = data as StateIncentive[];
    setCache(cacheKey, incentives);
    return incentives;
  } catch (err) {
    console.error('Failed to fetch state incentives:', err);
    return [];
  }
}

/**
 * Get incentives filtered by technology type
 */
export async function getIncentivesByTechnology(
  stateCode: string,
  technology: 'storage' | 'solar' | 'solar_plus_storage' | 'ev_charger'
): Promise<StateIncentive[]> {
  try {
    const { data, error } = await supabase
      .from('state_incentives')
      .select('*')
      .eq('state_code', stateCode.toUpperCase())
      .eq('is_active', true)
      .in('technology', [technology, 'all'])
      .neq('funding_status', 'closed')
      .order('amount', { ascending: false });

    if (error) {
      console.error('Error fetching incentives by technology:', error);
      return [];
    }

    return data as StateIncentive[];
  } catch (err) {
    console.error('Failed to fetch incentives:', err);
    return [];
  }
}

/**
 * Get incentives filtered by sector (commercial, residential, etc.)
 */
export async function getIncentivesBySector(
  stateCode: string,
  sector: 'residential' | 'commercial' | 'industrial'
): Promise<StateIncentive[]> {
  try {
    const { data, error } = await supabase
      .from('state_incentives')
      .select('*')
      .eq('state_code', stateCode.toUpperCase())
      .eq('is_active', true)
      .in('sector', [sector, 'all'])
      .neq('funding_status', 'closed')
      .order('amount', { ascending: false });

    if (error) {
      console.error('Error fetching incentives by sector:', error);
      return [];
    }

    return data as StateIncentive[];
  } catch (err) {
    console.error('Failed to fetch incentives:', err);
    return [];
  }
}

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate estimated incentive value for a project
 */
export function calculateIncentiveValue(
  incentive: StateIncentive,
  systemSizeKW: number,
  systemSizeKWh: number,
  projectCost: number,
  hasSolar: boolean
): IncentiveCalculation {
  const notes: string[] = [];
  let estimatedValue = 0;
  let isEligible = true;

  // Check solar requirement
  if (incentive.requires_solar && !hasSolar) {
    isEligible = false;
    notes.push('Requires solar installation');
  }

  // Check system size requirements
  if (incentive.min_system_size_kw && systemSizeKW < incentive.min_system_size_kw) {
    isEligible = false;
    notes.push(`Minimum system size: ${incentive.min_system_size_kw} kW`);
  }
  if (incentive.max_system_size_kw && systemSizeKW > incentive.max_system_size_kw) {
    isEligible = false;
    notes.push(`Maximum system size: ${incentive.max_system_size_kw} kW`);
  }

  // Check funding status
  if (incentive.funding_status === 'closed') {
    isEligible = false;
    notes.push('Program funding closed');
  } else if (incentive.funding_status === 'waitlist') {
    notes.push('Program has waitlist');
  } else if (incentive.funding_status === 'limited') {
    notes.push('Limited funding available');
  }

  // Calculate value if eligible
  if (isEligible) {
    switch (incentive.amount_type) {
      case 'per_kwh':
        estimatedValue = incentive.amount * systemSizeKWh;
        break;
      case 'per_kw':
        estimatedValue = incentive.amount * systemSizeKW;
        break;
      case 'percentage':
        estimatedValue = (incentive.amount / 100) * projectCost;
        break;
      case 'fixed':
        estimatedValue = incentive.amount;
        break;
    }

    // Apply cap if exists
    if (incentive.cap_amount && estimatedValue > incentive.cap_amount) {
      estimatedValue = incentive.cap_amount;
      notes.push(`Capped at $${incentive.cap_amount.toLocaleString()}`);
    }
  }

  return {
    programCode: incentive.program_code,
    programName: incentive.program_name,
    incentiveType: incentive.incentive_type,
    estimatedValue,
    valueUnit: incentive.amount_unit,
    isEligible,
    notes,
    applicationUrl: incentive.application_url,
  };
}

/**
 * Calculate all eligible incentives for a project
 */
export async function calculateProjectIncentives(params: {
  stateCode: string;
  systemSizeKW: number;
  systemSizeKWh: number;
  projectCost: number;
  technology: 'storage' | 'solar' | 'solar_plus_storage';
  sector: 'residential' | 'commercial' | 'industrial';
  hasSolar: boolean;
}): Promise<IncentiveSummary> {
  const { stateCode, systemSizeKW, systemSizeKWh, projectCost, technology, sector, hasSolar } = params;

  // Get applicable incentives
  const incentives = await getIncentivesByTechnology(stateCode, technology);
  const sectorFiltered = incentives.filter(
    (i) => i.sector === sector || i.sector === 'all'
  );

  // Calculate each incentive
  const calculations = sectorFiltered.map((incentive) =>
    calculateIncentiveValue(incentive, systemSizeKW, systemSizeKWh, projectCost, hasSolar)
  );

  // Sum eligible incentives
  const eligibleCalculations = calculations.filter((c) => c.isEligible);
  const totalValue = eligibleCalculations.reduce((sum, c) => sum + c.estimatedValue, 0);

  return {
    stateCode,
    stateName: sectorFiltered[0]?.state_name || stateCode,
    totalEstimatedIncentives: totalValue,
    incentiveBreakdown: calculations,
    eligiblePrograms: eligibleCalculations.length,
    totalPrograms: calculations.length,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all states with active incentive programs
 */
export async function getStatesWithIncentives(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('state_incentives')
      .select('state_code')
      .eq('is_active', true)
      .neq('funding_status', 'closed');

    if (error) {
      console.error('Error fetching states:', error);
      return [];
    }

    // Get unique state codes
    const states = [...new Set(data.map((d) => d.state_code))];
    return states.sort();
  } catch (err) {
    console.error('Failed to fetch states:', err);
    return [];
  }
}

/**
 * Get incentive program details by code
 */
export async function getIncentiveByCode(programCode: string): Promise<StateIncentive | null> {
  try {
    const { data, error } = await supabase
      .from('state_incentives')
      .select('*')
      .eq('program_code', programCode)
      .single();

    if (error) {
      console.error('Error fetching incentive:', error);
      return null;
    }

    return data as StateIncentive;
  } catch (err) {
    console.error('Failed to fetch incentive:', err);
    return null;
  }
}

/**
 * Format incentive amount for display
 */
export function formatIncentiveAmount(incentive: StateIncentive): string {
  const amount = incentive.amount;
  
  switch (incentive.amount_type) {
    case 'per_kwh':
      return `$${amount.toFixed(2)}/kWh`;
    case 'per_kw':
      return `$${amount.toLocaleString()}/kW`;
    case 'percentage':
      return `${amount}%`;
    case 'fixed':
      return `$${amount.toLocaleString()}`;
    default:
      return `$${amount}`;
  }
}

/**
 * Get top incentive programs nationally
 */
export async function getTopIncentivePrograms(limit: number = 10): Promise<StateIncentive[]> {
  try {
    const { data, error } = await supabase
      .from('state_incentives')
      .select('*')
      .eq('is_active', true)
      .eq('funding_status', 'available')
      .order('amount', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching top incentives:', error);
      return [];
    }

    return data as StateIncentive[];
  } catch (err) {
    console.error('Failed to fetch top incentives:', err);
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getStateIncentives,
  getIncentivesByTechnology,
  getIncentivesBySector,
  calculateIncentiveValue,
  calculateProjectIncentives,
  getStatesWithIncentives,
  getIncentiveByCode,
  formatIncentiveAmount,
  getTopIncentivePrograms,
};
