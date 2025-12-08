/**
 * USE WIZARD STATE HOOK - CENTRALIZED STATE MANAGEMENT
 * 
 * ⚠️ CRITICAL: This hook is the SINGLE SOURCE OF TRUTH for wizard state management.
 * 
 * Features:
 * - Centralized state with typed updates
 * - Auto-calculation of derived values (loads, recommendations)
 * - Industry-specific load factors
 * - EV charger load calculations
 * - Recommended backup hours based on grid reliability and industry
 * 
 * Usage:
 * const { wizardState, updateSection, updateEVChargers, resetState } = useWizardState();
 */

import { useState, useCallback, useEffect } from 'react';
import type { WizardState } from '@/types/wizardState';
import { INITIAL_WIZARD_STATE } from '@/types/wizardState';

// ============================================
// INDUSTRY LOAD FACTORS (kW per unit)
// Source: CBECS, Energy Star, industry standards
// ============================================
const INDUSTRY_LOAD_FACTORS: Record<string, { perUnit: number; unit: string }> = {
  // Commercial Office
  'office': { perUnit: 0.003, unit: 'squareFeet' },           // 3 W/sq ft
  'office-building': { perUnit: 0.003, unit: 'squareFeet' },
  
  // Hospitality
  'hotel': { perUnit: 3.5, unit: 'roomCount' },               // 3.5 kW/room
  'hotel-hospitality': { perUnit: 3.5, unit: 'roomCount' },
  
  // Data Centers
  'data-center': { perUnit: 10, unit: 'rackCount' },          // 10 kW/rack average
  'datacenter': { perUnit: 10, unit: 'rackCount' },
  'edge-data-center': { perUnit: 8, unit: 'rackCount' },
  
  // Healthcare
  'hospital': { perUnit: 0.015, unit: 'squareFeet' },         // 15 W/sq ft
  
  // Industrial
  'manufacturing': { perUnit: 0.008, unit: 'squareFeet' },    // 8 W/sq ft
  'warehouse': { perUnit: 0.002, unit: 'squareFeet' },        // 2 W/sq ft
  'distribution-center': { perUnit: 0.003, unit: 'squareFeet' },
  
  // Retail
  'retail': { perUnit: 0.004, unit: 'squareFeet' },           // 4 W/sq ft
  'shopping-center': { perUnit: 0.005, unit: 'squareFeet' },
  
  // Residential
  'apartment': { perUnit: 2, unit: 'roomCount' },             // 2 kW/unit
  'apartment-building': { perUnit: 2, unit: 'roomCount' },
  'residential': { perUnit: 0.002, unit: 'squareFeet' },
  
  // Food & Beverage
  'restaurant': { perUnit: 0.02, unit: 'squareFeet' },        // 20 W/sq ft (high due to kitchen)
  
  // Education
  'school': { perUnit: 0.005, unit: 'squareFeet' },           // 5 W/sq ft
  'university': { perUnit: 0.006, unit: 'squareFeet' },
  
  // Automotive
  'car-wash': { perUnit: 30, unit: 'bays' },                  // 30 kW/bay average
  'gas-station': { perUnit: 0.008, unit: 'squareFeet' },
  
  // EV Charging
  'ev-charging': { perUnit: 50, unit: 'squareFeet' },         // Placeholder - calculated separately
  
  // Default fallback
  'default': { perUnit: 0.004, unit: 'squareFeet' },          // 4 W/sq ft
};

// ============================================
// CUSTOM HOOK
// ============================================
export function useWizardState() {
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_WIZARD_STATE);

  // ────────────────────────────────────────────
  // UPDATE FUNCTIONS
  // ────────────────────────────────────────────

  /**
   * Update a specific section of the wizard state
   */
  const updateSection = useCallback(<K extends keyof WizardState>(
    section: K,
    updates: Partial<WizardState[K]>
  ) => {
    setWizardState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
  }, []);

  /**
   * Update nested existing infrastructure properties
   */
  const updateExistingInfra = useCallback((
    key: keyof WizardState['existingInfrastructure'],
    value: WizardState['existingInfrastructure'][typeof key]
  ) => {
    setWizardState(prev => ({
      ...prev,
      existingInfrastructure: {
        ...prev.existingInfrastructure,
        [key]: value,
      },
    }));
  }, []);

  /**
   * Update EV chargers with specific level
   */
  const updateEVChargers = useCallback((
    level: 'L1' | 'L2' | 'L3',
    updates: Partial<{ count: number; powerKW: number }>
  ) => {
    setWizardState(prev => ({
      ...prev,
      existingInfrastructure: {
        ...prev.existingInfrastructure,
        evChargers: {
          ...prev.existingInfrastructure.evChargers,
          [level]: {
            ...prev.existingInfrastructure.evChargers[level],
            ...updates,
          },
        },
      },
    }));
  }, []);

  /**
   * Update new EV chargers in goals
   */
  const updateNewEVChargers = useCallback((
    level: 'L2' | 'L3',
    updates: Partial<{ count: number; powerKW: number }>
  ) => {
    setWizardState(prev => ({
      ...prev,
      goals: {
        ...prev.goals,
        newEVChargers: {
          ...prev.goals.newEVChargers,
          [level]: {
            ...prev.goals.newEVChargers[level],
            ...updates,
          },
        },
      },
    }));
  }, []);

  // ────────────────────────────────────────────
  // CALCULATION FUNCTIONS
  // ────────────────────────────────────────────

  /**
   * Calculate building base load based on industry and facility size
   */
  const calculateBuildingLoad = useCallback((state: WizardState): number => {
    const industryType = state.industry.type.toLowerCase();
    const factors = INDUSTRY_LOAD_FACTORS[industryType] || INDUSTRY_LOAD_FACTORS['default'];
    
    const unitValue = state.facility[factors.unit as keyof typeof state.facility] as number || 0;
    const baseLoad = unitValue * factors.perUnit;
    
    // Apply diversity factor (not all loads peak simultaneously)
    const diversityFactor = 0.75;
    
    return Math.round(baseLoad * diversityFactor * 10) / 10; // Round to 1 decimal
  }, []);

  /**
   * Calculate total load from existing EV chargers
   */
  const calculateEVLoad = useCallback((
    chargers: WizardState['existingInfrastructure']['evChargers']
  ): number => {
    return (
      (chargers.L1.count * chargers.L1.powerKW) +
      (chargers.L2.count * chargers.L2.powerKW) +
      (chargers.L3.count * chargers.L3.powerKW)
    );
  }, []);

  /**
   * Calculate load from NEW EV chargers (goals section)
   */
  const calculateNewEVLoad = useCallback((goals: WizardState['goals']): number => {
    if (!goals.addEVChargers) return 0;
    return (
      (goals.newEVChargers.L2.count * goals.newEVChargers.L2.powerKW) +
      (goals.newEVChargers.L3.count * goals.newEVChargers.L3.powerKW)
    );
  }, []);

  /**
   * Determine recommended backup hours based on grid reliability and industry
   */
  const getRecommendedBackupHours = useCallback((state: WizardState): number => {
    let hours = 4; // Default
    
    // Adjust based on grid reliability
    switch (state.existingInfrastructure.gridConnection) {
      case 'unreliable':
        hours = 6;
        break;
      case 'limited':
        hours = 5;
        break;
      case 'expensive':
        hours = 4; // Peak shaving focus, not backup
        break;
      case 'off-grid':
        hours = 8;
        break;
      default:
        hours = 4;
    }
    
    // Critical facilities need more backup
    const criticalIndustries = ['hospital', 'data-center', 'datacenter', 'edge-data-center'];
    if (criticalIndustries.includes(state.industry.type.toLowerCase())) {
      hours = Math.max(hours, 8);
    }
    
    // Hotels/hospitality need reasonable backup
    const hospitalityIndustries = ['hotel', 'hotel-hospitality'];
    if (hospitalityIndustries.includes(state.industry.type.toLowerCase())) {
      hours = Math.max(hours, 4);
    }
    
    return hours;
  }, []);

  /**
   * Recalculate ALL derived values
   */
  const recalculate = useCallback((state: WizardState): WizardState['calculated'] => {
    const baseBuildingLoadKW = calculateBuildingLoad(state);
    const existingEVLoadKW = calculateEVLoad(state.existingInfrastructure.evChargers);
    const newEVLoadKW = calculateNewEVLoad(state.goals);
    const totalPeakDemandKW = baseBuildingLoadKW + existingEVLoadKW + newEVLoadKW;
    
    const recommendedBackupHours = getRecommendedBackupHours(state);
    const recommendedBatteryKWh = Math.round(totalPeakDemandKW * recommendedBackupHours);
    const recommendedBatteryKW = Math.round(totalPeakDemandKW * 1.1); // 10% headroom
    
    // Solar recommendation: enough to charge battery in available sun hours
    const solarHours = state.location.solarHours || 5;
    const recommendedSolarKW = Math.round((totalPeakDemandKW * 0.8 * 8) / solarHours);
    
    return {
      baseBuildingLoadKW: Math.round(baseBuildingLoadKW * 10) / 10,
      existingEVLoadKW,
      newEVLoadKW,
      totalPeakDemandKW: Math.round(totalPeakDemandKW * 10) / 10,
      recommendedBatteryKWh,
      recommendedBatteryKW,
      recommendedSolarKW,
      recommendedBackupHours,
    };
  }, [calculateBuildingLoad, calculateEVLoad, calculateNewEVLoad, getRecommendedBackupHours]);

  // ────────────────────────────────────────────
  // AUTO-RECALCULATE EFFECT
  // ────────────────────────────────────────────
  useEffect(() => {
    const newCalculated = recalculate(wizardState);
    
    // Only update if values actually changed (prevent infinite loop)
    const hasChanged = Object.keys(newCalculated).some(
      key => newCalculated[key as keyof typeof newCalculated] !== 
             wizardState.calculated[key as keyof typeof newCalculated]
    );
    
    if (hasChanged) {
      setWizardState(prev => ({
        ...prev,
        calculated: newCalculated,
      }));
    }
  }, [
    wizardState.location,
    wizardState.industry,
    wizardState.facility,
    wizardState.existingInfrastructure,
    wizardState.goals,
    recalculate,
  ]);

  // ────────────────────────────────────────────
  // UTILITY FUNCTIONS
  // ────────────────────────────────────────────

  /**
   * Reset wizard to initial state
   */
  const resetState = useCallback(() => {
    setWizardState(INITIAL_WIZARD_STATE);
  }, []);

  /**
   * Get industry-specific load factor info
   */
  const getLoadFactorInfo = useCallback((industryType: string) => {
    const type = industryType.toLowerCase();
    return INDUSTRY_LOAD_FACTORS[type] || INDUSTRY_LOAD_FACTORS['default'];
  }, []);

  // ────────────────────────────────────────────
  // RETURN
  // ────────────────────────────────────────────
  return {
    // State
    wizardState,
    setWizardState,
    
    // Update functions
    updateSection,
    updateExistingInfra,
    updateEVChargers,
    updateNewEVChargers,
    
    // Utility functions
    resetState,
    getLoadFactorInfo,
    
    // Calculation functions (for manual recalc if needed)
    recalculate,
  };
}

// Export type for component prop typing
export type UseWizardStateReturn = ReturnType<typeof useWizardState>;
