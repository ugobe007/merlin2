/**
 * USE WIZARD STATE HOOK - CENTRALIZED STATE MANAGEMENT
 * 
 * ⚠️ CRITICAL: This hook manages wizard state and delegates calculations to SSOT.
 * 
 * ARCHITECTURE (Option A - Dec 8, 2025):
 * - This hook manages STATE only
 * - Building load calculations DELEGATE to useCasePowerCalculations.ts (SSOT)
 * - EV charger calculations stay here (they're additive, not duplicated)
 * - No duplicate formulas - single source of truth
 * 
 * Features:
 * - Centralized state with typed updates
 * - Auto-calculation via SSOT delegation
 * - EV charger load calculations (additive)
 * - Recommended backup hours based on grid reliability and industry
 * 
 * Usage:
 * const { wizardState, updateSection, updateEVChargers, resetState } = useWizardState();
 */

import { useState, useCallback, useEffect } from 'react';
import type { WizardState } from '@/types/wizardState';
import { INITIAL_WIZARD_STATE } from '@/types/wizardState';
import { calculateUseCasePower } from '@/services/useCasePowerCalculations';
import {
  BESS_POWER_RATIOS,
  getBESSPowerRatio,
  SOLAR_TO_BESS_RATIO,
} from '@/components/wizard/constants/wizardConstants';

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
   * Calculate building base load by DELEGATING to SSOT (useCasePowerCalculations.ts)
   * This ensures Power Profile shows the same values as the final quote.
   */
  const calculateBuildingLoad = useCallback((state: WizardState): number => {
    const industryType = state.industry.type.toLowerCase();
    
    // DEBUG: Log input state
    console.log('🔧 [calculateBuildingLoad] INPUT:', {
      industryType,
      facilitySquareFeet: state.facility.squareFeet,
      facilityRoomCount: state.facility.roomCount,
      useCaseData: state.useCaseData,
    });
    
    // Skip calculation if no industry selected
    if (!industryType || industryType === '') {
      console.log('🔧 [calculateBuildingLoad] No industry - returning 0');
      return 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL FIX: Merge useCaseData (template-specific fields) with facility data
    // This ensures industry-specific fields like annualPassengers, gamingSpaceSqFt
    // are passed to SSOT calculations, not just generic facility.squareFeet
    // ═══════════════════════════════════════════════════════════════════════
    const useCaseData: Record<string, any> = {
      // First, spread ALL custom question data (annualPassengers, gamingSpaceSqFt, etc.)
      ...state.useCaseData,
      
      // Then add facility variants (some templates use facility.*, some use useCaseData.*)
      // Square footage variants
      squareFeet: state.useCaseData.squareFeet || state.facility.squareFeet || 0,
      facilitySqFt: state.useCaseData.facilitySqFt || state.facility.squareFeet || 0,
      buildingSqFt: state.useCaseData.buildingSqFt || state.facility.squareFeet || 0,
      
      // Room count variants (hotels, apartments)
      roomCount: state.useCaseData.roomCount || state.facility.roomCount || 0,
      numberOfRooms: state.useCaseData.numberOfRooms || state.facility.roomCount || 0,
      rooms: state.useCaseData.rooms || state.facility.roomCount || 0,
      
      // Bed count (hospitals)
      bedCount: state.useCaseData.bedCount || state.facility.bedCount || state.facility.roomCount || 0,
      beds: state.useCaseData.beds || state.facility.bedCount || state.facility.roomCount || 0,
      
      // Rack count (data centers)
      rackCount: state.useCaseData.rackCount || state.facility.rackCount || 0,
      racks: state.useCaseData.racks || state.facility.rackCount || 0,
      
      // Bay count (car wash)
      washBays: state.useCaseData.washBays || state.facility.bayCount || 0,
      bayCount: state.useCaseData.bayCount || state.facility.bayCount || 0,
      
      // Unit count (apartments)
      unitCount: state.useCaseData.unitCount || state.facility.unitCount || 0,
      numUnits: state.useCaseData.numUnits || state.facility.unitCount || 0,
      
      // Hospital-specific equipment (for accurate power calculations)
      surgicalSuites: state.useCaseData.surgicalSuites || state.facility.surgicalSuites || 0,
      operatingRooms: state.useCaseData.operatingRooms || state.useCaseData.surgicalSuites || state.facility.surgicalSuites || 0,
      mriCount: state.useCaseData.mriCount || state.facility.mriCount || 0,
      mriMachines: state.useCaseData.mriMachines || state.useCaseData.mriCount || state.facility.mriCount || 0,
      ctScannerCount: state.useCaseData.ctScannerCount || state.facility.ctScannerCount || 0,
      ctScanners: state.useCaseData.ctScanners || state.useCaseData.ctScannerCount || state.facility.ctScannerCount || 0,
      icuBeds: state.useCaseData.icuBeds || state.facility.icuBeds || 0,
      icuBedCount: state.useCaseData.icuBedCount || state.useCaseData.icuBeds || state.facility.icuBeds || 0,
      
      // Generic fallback
      facilitySize: state.useCaseData.facilitySize || state.facility.squareFeet || state.facility.roomCount || 0,
    };
    
    console.log('🔧 [calculateBuildingLoad] useCaseData being sent to SSOT:', useCaseData);
    
    try {
      // DELEGATE to SSOT - this is the single source of truth
      const powerResult = calculateUseCasePower(industryType, useCaseData);
      
      // Convert MW to kW
      const baseLoadKW = powerResult.powerMW * 1000;
      
      console.log('🔧 [calculateBuildingLoad] SSOT result:', {
        industryType,
        squareFeet: useCaseData.squareFeet,
        powerMW: powerResult.powerMW,
        baseLoadKW,
        description: powerResult.description
      });
      
      return Math.round(baseLoadKW * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.warn('[useWizardState] SSOT calculation failed, using fallback:', error);
      // Fallback: 4 W/sq ft default if SSOT fails
      const fallbackLoad = (state.facility.squareFeet || 0) * 0.004 * 0.75;
      return Math.round(fallbackLoad * 10) / 10;
    }
  }, []);

  /**
   * Calculate total load from existing EV chargers
   * Applies concurrency factor since not all chargers are used simultaneously
   */
  const calculateEVLoad = useCallback((
    chargers: WizardState['existingInfrastructure']['evChargers']
  ): number => {
    // EV charger concurrency: typically 30-50% at commercial sites
    // Hotels: 35% (guests charge overnight, not all at once)
    // Retail/Commercial: 40% (higher turnover)
    // EV stations: 50% (dedicated charging)
    const EV_CONCURRENCY_FACTOR = 0.40; // 40% concurrent usage assumption
    
    const installedCapacityKW = (
      (chargers.L1.count * chargers.L1.powerKW) +
      (chargers.L2.count * chargers.L2.powerKW) +
      (chargers.L3.count * chargers.L3.powerKW)
    );
    
    // Apply concurrency - not all chargers run at peak simultaneously
    return Math.round(installedCapacityKW * EV_CONCURRENCY_FACTOR);
  }, []);

  /**
   * Calculate load from NEW EV chargers (goals section)
   * Applies concurrency factor since not all chargers are used simultaneously
   */
  const calculateNewEVLoad = useCallback((goals: WizardState['goals']): number => {
    if (!goals.addEVChargers) return 0;
    
    const EV_CONCURRENCY_FACTOR = 0.40; // 40% concurrent usage assumption
    
    const installedCapacityKW = (
      (goals.newEVChargers.L2.count * goals.newEVChargers.L2.powerKW) +
      (goals.newEVChargers.L3.count * goals.newEVChargers.L3.powerKW)
    );
    
    return Math.round(installedCapacityKW * EV_CONCURRENCY_FACTOR);
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
    
    // Critical facilities: hospitals need extended backup, data centers have UPS (less BESS)
    const hospitalIndustries = ['hospital'];
    if (hospitalIndustries.includes(state.industry.type.toLowerCase())) {
      hours = Math.max(hours, 8); // Hospitals need extended backup for patient safety
    }
    
    // Data centers have UPS systems, BESS is supplemental (4 hours standard)
    const datacenterIndustries = ['data-center', 'datacenter', 'edge-data-center'];
    if (datacenterIndustries.includes(state.industry.type.toLowerCase())) {
      hours = Math.max(hours, 4); // UPS + 4hr BESS is industry standard
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
    
    // ═══════════════════════════════════════════════════════════════════════
    // BESS SIZING v2.0 - BENCHMARK-BACKED METHODOLOGY (Dec 2025)
    // Sources: IEEE 4538388, MDPI Energies 11(8):2048, NREL ATB 2024
    // ═══════════════════════════════════════════════════════════════════════
    
    // BESS Power ratio depends on primary application:
    // | Use Case       | Ratio | Description                          |
    // |----------------|-------|--------------------------------------|
    // | peak_shaving   | 0.40  | Shave top demand peaks only          |
    // | arbitrage      | 0.50  | Peak shaving + TOU energy shifting   |
    // | resilience     | 0.70  | Cover critical loads during outages  |
    // | microgrid      | 1.00  | Full islanding capability            |
    
    // Map user's primary goal to BESS use case
    let bessRatio = BESS_POWER_RATIOS.peak_shaving; // Default: 0.40 (most common)
    
    const primaryGoal = state.goals?.primaryGoal || 'savings';
    switch (primaryGoal) {
      case 'backup':
        bessRatio = BESS_POWER_RATIOS.resilience; // 0.70 - critical load backup
        break;
      case 'savings':
        bessRatio = BESS_POWER_RATIOS.arbitrage; // 0.50 - cost optimization
        break;
      case 'sustainability':
        bessRatio = BESS_POWER_RATIOS.arbitrage; // 0.50 - renewable integration
        break;
      case 'peak-shaving':
        bessRatio = BESS_POWER_RATIOS.peak_shaving; // 0.40 - demand charge reduction
        break;
      default:
        bessRatio = BESS_POWER_RATIOS.peak_shaving; // Default to optimal economic sizing
    }
    
    // Calculate BESS power and energy
    let recommendedBatteryKW = Math.round(totalPeakDemandKW * bessRatio);
    let recommendedBatteryKWh = Math.round(recommendedBatteryKW * recommendedBackupHours);
    
    console.log('🔋 [recalculate] BESS sizing v2.0:', {
      totalPeakDemandKW,
      bessRatio,
      primaryGoal,
      recommendedBatteryKW,
      recommendedBatteryKWh,
      source: 'IEEE 4538388, MDPI Energies 11(8):2048',
    });
    
    // ⚠️ SOLAR STORAGE: If user adds solar, increase battery to capture solar energy
    // Rule: Battery should be able to store 4-6 hours of solar generation for evening use
    const solarHours = state.location.solarHours || 5;
    if (state.goals.addSolar && state.goals.solarKW > 0) {
      const solarDailyKWh = state.goals.solarKW * solarHours;
      const solarStorageKWh = Math.round(solarDailyKWh * 0.6); // Store 60% of daily solar
      
      // Take the larger of: peak demand backup OR solar storage
      recommendedBatteryKWh = Math.max(recommendedBatteryKWh, solarStorageKWh);
      
      // Battery power should handle solar input rate
      const solarInputKW = Math.round(state.goals.solarKW * 0.8); // 80% of solar capacity
      recommendedBatteryKW = Math.max(recommendedBatteryKW, solarInputKW);
      
      console.log('🔋 [recalculate] Solar storage adjustment:', {
        solarKW: state.goals.solarKW,
        solarDailyKWh,
        solarStorageKWh,
        finalBatteryKWh: recommendedBatteryKWh,
        finalBatteryKW: recommendedBatteryKW,
      });
    }
    
    // Solar recommendation: Size solar relative to BESS capacity
    // NREL ILR (Inverter Loading Ratio) guidance: 1.3-1.5x for DC-coupled systems
    // Using 1.4x allows solar to fully charge BESS while serving load
    const recommendedSolarKW = Math.round(recommendedBatteryKW * SOLAR_TO_BESS_RATIO);
    
    console.log('🔋 [recalculate] Final values:', {
      baseBuildingLoadKW,
      existingEVLoadKW,
      newEVLoadKW,
      totalPeakDemandKW,
      bessRatio,
      recommendedBackupHours,
      recommendedBatteryKWh,
      recommendedBatteryKW,
      recommendedSolarKW,
    });
    
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
    
    // Debug logging - CRITICAL for tracing Power Gap updates
    console.log('⚡ [useWizardState] RECALCULATE TRIGGERED:', {
      industryType: wizardState.industry.type,
      facilitySquareFeet: wizardState.facility.squareFeet,
      facilityBedCount: wizardState.facility.bedCount,
      facilitySurgicalSuites: wizardState.facility.surgicalSuites,
      facilityMriCount: wizardState.facility.mriCount,
      useCaseData: wizardState.useCaseData,
      gridConnection: wizardState.existingInfrastructure.gridConnection,
      newCalculated
    });
    
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
    wizardState.useCaseData,  // CRITICAL: Triggers recalc when template data changes
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
   * Get industry-specific info (for UI display purposes)
   * Note: Actual calculations are done by SSOT, this is just for UI hints
   */
  const getLoadFactorInfo = useCallback((industryType: string) => {
    const type = industryType.toLowerCase();
    
    // Simple mapping for UI display - actual calculation uses SSOT
    const uiHints: Record<string, { perUnit: number; unit: string }> = {
      'office': { perUnit: 0.003, unit: 'squareFeet' },
      'hotel': { perUnit: 3.5, unit: 'roomCount' },
      'hospital': { perUnit: 0.015, unit: 'squareFeet' },
      'datacenter': { perUnit: 10, unit: 'rackCount' },
      'manufacturing': { perUnit: 0.008, unit: 'squareFeet' },
      'retail': { perUnit: 0.004, unit: 'squareFeet' },
      'car-wash': { perUnit: 30, unit: 'bays' },
      'default': { perUnit: 0.004, unit: 'squareFeet' },
    };
    
    return uiHints[type] || uiHints['default'];
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
