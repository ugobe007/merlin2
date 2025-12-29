/**
 * useOptimizedWizardState.ts
 * 
 * GLOBAL WIZARD STATE MANAGEMENT - OPTIMIZED
 * 
 * Architecture: "Collect Then Calculate"
 * - All user interactions update LOCAL state only (instant)
 * - Calculations run ONCE when transitioning to results step
 * - No debouncing needed - clean separation of concerns
 * 
 * COPILOT: This file replaces useWizardState.ts and/or useStreamlinedWizard.ts
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { WizardState } from '../types/wizardTypes';
import { calculateUseCasePower } from '@/services/useCasePowerCalculations';
import { calculateSystemSizing } from '../constants/wizardConstants';
import { generateScenarios, type ScenarioGeneratorInput } from '@/services/scenarioGenerator';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';

// ============================================
// TYPES
// ============================================

export interface WizardStepData {
  step1: {
    country: string;
    state: string;
    zipCode: string;
    goals: string[];
    utilityRate: number;
  };
  step2: {
    industrySlug: string;
    industryName: string;
    useCaseId: string;
    category: string;
  };
  step3: {
    // Common fields
    squareFeet: number;
    monthlyBill: number;
    operatingHours: string;
    
    // Industry-specific fields
    roomCount: number;           // Hotel
    bedCount: number;            // Healthcare
    rackCount: number;           // Data Center
    bayCount: number;            // Car Wash
    
    // Amenities/features (stored as object keys)
    selectedAmenities: string[];
    
    // Equipment
    hasExistingSolar: boolean;
    existingSolarKW: number;
    hasExistingGenerator: boolean;
    existingGeneratorKW: number;
    wantsEVCharging: boolean;
    targetEVChargers: number;
    
    // Goals/priorities
    primaryApplication: string;
    backupRequired: boolean;
    backupHours: number;
    
    // Facility subtype and equipment tier
    facilitySubtype: string;
    equipmentTier: 'standard' | 'premium';
    
    // Custom questionnaire answers (from database)
    useCaseData: Record<string, any>;
  };
  step4: {
    selectedStrategy: 'savings' | 'balanced' | 'resilient' | null;
    customizations: Record<string, any>;
  };
}

export interface CalculationResults {
  // Load calculations
  baseBuildingLoadKW: number;
  totalPeakDemandKW: number;
  dailyKWh: number;
  monthlyKWh: number;
  
  // Sizing recommendations
  recommendedBatteryKW: number;
  recommendedBatteryKWh: number;
  recommendedSolarKW: number;
  recommendedBackupHours: number;
  
  // Financial estimates
  annualSavings: number;
  estimatedCost: number;
  paybackYears: number;
  roi25Year: number;
  npv: number;
  irr: number;
  
  // Strategy options (scenarios)
  scenarioResult: any; // ScenarioGeneratorResult
  
  // Quote result
  quoteResult: QuoteResult | null;
  
  // Metadata
  calculatedAt: string;
  version: string;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_STEP_DATA: WizardStepData = {
  step1: {
    country: 'United States',
    state: '',
    zipCode: '',
    goals: [],
    utilityRate: 0.12,
  },
  step2: {
    industrySlug: '',
    industryName: '',
    useCaseId: '',
    category: '',
  },
  step3: {
    squareFeet: 0,
    monthlyBill: 0,
    operatingHours: 'standard',
    roomCount: 0,
    bedCount: 0,
    rackCount: 0,
    bayCount: 0,
    selectedAmenities: [],
    hasExistingSolar: false,
    existingSolarKW: 0,
    hasExistingGenerator: false,
    existingGeneratorKW: 0,
    wantsEVCharging: false,
    targetEVChargers: 0,
    primaryApplication: 'peak-shaving',
    backupRequired: false,
    backupHours: 4,
    facilitySubtype: '',
    equipmentTier: 'standard',
    useCaseData: {},
  },
  step4: {
    selectedStrategy: null,
    customizations: {},
  },
};

// ============================================
// MAIN HOOK
// ============================================

export function useOptimizedWizardState() {
  // ============================================
  // STATE
  // ============================================
  
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<WizardStepData>(DEFAULT_STEP_DATA);
  const [calculations, setCalculations] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if calculations are stale (need recalc)
  const calculationsStale = useRef(true);
  
  // ============================================
  // DATA UPDATES - INSTANT, NO CALCULATIONS
  // ============================================
  
  /**
   * Update data for a specific step
   * This is INSTANT - no calculations triggered
   * 
   * COPILOT: Use this in all step components instead of updateUseCaseData()
   */
  const updateStepData = useCallback(<K extends keyof WizardStepData>(
    step: K,
    data: Partial<WizardStepData[K]>
  ) => {
    setStepData(prev => ({
      ...prev,
      [step]: {
        ...prev[step],
        ...data,
      },
    }));
    
    // Mark calculations as stale - but don't recalculate yet
    calculationsStale.current = true;
    
    // Debug log (remove in production)
    if (import.meta.env.DEV) {
      console.log(`✅ [OPTIMIZED] Step ${step} data updated - NO RECALC`, data);
    }
  }, []);
  
  /**
   * Batch update multiple steps at once
   * Still instant, still no calculations
   */
  const updateMultipleSteps = useCallback((updates: Partial<WizardStepData>) => {
    setStepData(prev => ({
      ...prev,
      ...Object.entries(updates).reduce((acc, [step, data]) => ({
        ...acc,
        [step]: { ...prev[step as keyof WizardStepData], ...data },
      }), {} as WizardStepData),
    }));
    calculationsStale.current = true;
  }, []);
  
  // ============================================
  // NAVIGATION - CALCULATIONS HAPPEN HERE
  // ============================================
  
  /**
   * Navigate to a specific step
   * Triggers calculation ONLY when entering Step 4+ with stale data
   * 
   * COPILOT: Use this instead of direct setCurrentStep()
   */
  const goToStep = useCallback(async (targetStep: number) => {
    setError(null);
    
    // If going to Step 4 or beyond, and calculations are stale, calculate now
    if (targetStep >= 4 && calculationsStale.current) {
      console.log('🔄 [OPTIMIZED] Entering results step - calculating ONCE');
      
      setIsCalculating(true);
      
      try {
        const results = await performCalculations(stepData);
        setCalculations(results);
        calculationsStale.current = false;
        
        console.log('✅ [OPTIMIZED] Calculations complete:', results);
      } catch (err) {
        console.error('❌ [OPTIMIZED] Calculation error:', err);
        setError('Failed to calculate. Please try again.');
        setIsCalculating(false);
        return; // Don't navigate if calculation failed
      } finally {
        setIsCalculating(false);
      }
    }
    
    setCurrentStep(targetStep);
  }, [stepData]);
  
  /**
   * Go to next step
   */
  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);
  
  /**
   * Go to previous step
   */
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Don't need to recalculate when going back
    }
  }, [currentStep]);
  
  // ============================================
  // FORCE RECALCULATE (for manual refresh)
  // ============================================
  
  /**
   * Force recalculation - use sparingly
   * Only for "Refresh" button or similar explicit user action
   */
  const forceRecalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const results = await performCalculations(stepData);
      setCalculations(results);
      calculationsStale.current = false;
    } catch (err) {
      setError('Failed to recalculate.');
    } finally {
      setIsCalculating(false);
    }
  }, [stepData]);
  
  // ============================================
  // QUICK ESTIMATE (for header preview - lightweight)
  // ============================================
  
  /**
   * Quick estimate for header display
   * This is a LIGHTWEIGHT calculation, not the full SSOT
   * Runs on every render but is very fast
   */
  const quickEstimate = useMemo(() => {
    const { step2, step3 } = stepData;
    
    // Simple estimation logic (not full SSOT)
    let baseKW = 100;
    
    // Industry multipliers
    const industryMultipliers: Record<string, number> = {
      hotel: 3.5,      // kW per room
      hospital: 5.0,   // kW per bed
      datacenter: 150, // W per sq ft
      office: 0.006,   // kW per sq ft
      retail: 0.008,
      warehouse: 0.004,
      'car-wash': 150, // kW per bay
    };
    
    const multiplier = industryMultipliers[step2.industrySlug] || 0.006;
    
    if (step3.roomCount > 0) {
      baseKW = step3.roomCount * multiplier;
    } else if (step3.bedCount > 0) {
      baseKW = step3.bedCount * multiplier;
    } else if (step3.rackCount > 0) {
      baseKW = step3.rackCount * 20; // ~20 kW per rack
    } else if (step3.bayCount > 0) {
      baseKW = step3.bayCount * multiplier;
    } else if (step3.squareFeet > 0) {
      baseKW = step3.squareFeet * multiplier;
    }
    
    // Amenity additions (rough estimates)
    const amenityKW = step3.selectedAmenities.length * 25;
    
    const totalKW = Math.round(baseKW + amenityKW);
    const batteryKWh = Math.round(totalKW * 4); // 4-hour duration
    
    return {
      peakKW: totalKW,
      batteryKW: Math.round(totalKW * 0.5),
      batteryKWh: batteryKWh,
    };
  }, [stepData.step2.industrySlug, stepData.step3]);
  
  // ============================================
  // VALIDATION
  // ============================================
  
  const isStepComplete = useMemo(() => ({
    step1: Boolean(stepData.step1.state && stepData.step1.goals.length > 0),
    step2: Boolean(stepData.step2.industrySlug),
    step3: Boolean(
      stepData.step3.roomCount > 0 || 
      stepData.step3.squareFeet > 0 ||
      stepData.step3.rackCount > 0 ||
      stepData.step3.bayCount > 0 ||
      stepData.step3.bedCount > 0
    ),
    step4: Boolean(stepData.step4.selectedStrategy),
  }), [stepData]);
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // Current state
    currentStep,
    stepData,
    calculations,
    isCalculating,
    error,
    
    // Quick estimate for header
    quickEstimate,
    
    // Validation
    isStepComplete,
    
    // Data updates (instant, no calc)
    updateStepData,
    updateMultipleSteps,
    
    // Navigation (calc on step 4+)
    goToStep,
    nextStep,
    prevStep,
    
    // Manual recalc
    forceRecalculate,
  };
}

// ============================================
// CALCULATION FUNCTION
// ============================================

/**
 * Perform all calculations
 * This is the ONLY place where SSOT calculations run
 * 
 * COPILOT: This integrates with your existing SSOT functions
 */
async function performCalculations(data: WizardStepData): Promise<CalculationResults> {
  console.log('🔄 [CALCULATION] Starting with data:', data);
  
  const { step1, step2, step3 } = data;
  
  // ============================================
  // 1. BUILDING LOAD CALCULATION
  // ============================================
  
  const buildingLoad = await calculateBuildingLoadSSOT({
    industryType: step2.industrySlug,
    squareFeet: step3.squareFeet,
    roomCount: step3.roomCount,
    bedCount: step3.bedCount,
    rackCount: step3.rackCount,
    bayCount: step3.bayCount,
    selectedAmenities: step3.selectedAmenities,
    facilitySubtype: step3.facilitySubtype,
    equipmentTier: step3.equipmentTier,
    useCaseData: step3.useCaseData,
  });
  
  // ============================================
  // 2. SYSTEM SIZING (BESS + Solar)
  // ============================================
  
  const systemSizing = calculateSystemSizing({
    peakDemand_kW: buildingLoad.totalPeakKW,
    useCase: (step3.primaryApplication === 'peak-shaving' ? 'peak_shaving' : 
              step3.primaryApplication === 'backup-power' ? 'resilience' :
              step3.primaryApplication === 'arbitrage' ? 'arbitrage' : 'peak_shaving') as 'peak_shaving' | 'arbitrage' | 'resilience' | 'microgrid',
    industryType: step2.industrySlug,
    batteryDuration_hours: step3.backupHours || 4,
    includeSolar: step1.goals.includes('solar') || step3.wantsEVCharging,
    includeGenerator: step3.backupRequired,
  });
  
  // ============================================
  // 3. GENERATE SCENARIOS (3 Magic Fit options)
  // ============================================
  
  const scenarioInput: ScenarioGeneratorInput = {
    industryType: step2.industrySlug,
    peakDemandKW: buildingLoad.totalPeakKW,
    dailyKWh: buildingLoad.dailyKWh,
    state: step1.state,
    electricityRate: step1.utilityRate,
    goals: step1.goals,
    wantsSolar: step1.goals.includes('solar') || step3.wantsEVCharging,
    wantsGenerator: step3.backupRequired,
    gridConnection: 'on-grid', // Default, can be enhanced later
  };
  
  const scenarioResult = await generateScenarios(scenarioInput);
  
  // ============================================
  // 4. EXTRACT FINANCIALS FROM SCENARIOS
  // ============================================
  
  // Scenarios already include quote results - use those
  const recommendedScenario = scenarioResult?.scenarios[scenarioResult.recommendedIndex || 0];
  const quoteResult = recommendedScenario?.quoteResult || null;
  
  // ============================================
  // RETURN RESULTS
  // ============================================
  
  return {
    // Load
    baseBuildingLoadKW: buildingLoad.baseLoadKW,
    totalPeakDemandKW: buildingLoad.totalPeakKW,
    dailyKWh: buildingLoad.dailyKWh,
    monthlyKWh: buildingLoad.monthlyKWh,
    
    // Sizing
    recommendedBatteryKW: systemSizing.bessPower_kW,
    recommendedBatteryKWh: systemSizing.bessEnergy_kWh,
    recommendedSolarKW: systemSizing.solarPower_kW,
    recommendedBackupHours: step3.backupHours || 4,
    
    // Financials (from recommended scenario)
    annualSavings: recommendedScenario?.annualSavings || 0,
    estimatedCost: recommendedScenario?.netCost || 0,
    paybackYears: recommendedScenario?.paybackYears || 0,
    roi25Year: recommendedScenario?.roi25Year || 0,
    npv: 0, // TODO: Calculate from quote result
    irr: 0, // TODO: Calculate from quote result
    
    // Strategy options (scenarios)
    scenarioResult,
    
    // Quote result
    quoteResult,
    
    // Metadata
    calculatedAt: new Date().toISOString(),
    version: '2.0.0',
  };
}

// ============================================
// SSOT CALCULATION WRAPPER
// ============================================

/**
 * Calculate building load using SSOT
 */
async function calculateBuildingLoadSSOT(params: {
  industryType: string;
  squareFeet: number;
  roomCount: number;
  bedCount: number;
  rackCount: number;
  bayCount: number;
  selectedAmenities: string[];
  facilitySubtype: string;
  equipmentTier: 'standard' | 'premium';
  useCaseData: Record<string, any>;
}): Promise<{
  baseLoadKW: number;
  totalPeakKW: number;
  dailyKWh: number;
  monthlyKWh: number;
}> {
  console.log('📊 [SSOT] calculateBuildingLoad:', params);
  
  try {
    // Prepare useCaseData with all parameters
    const useCaseDataWithParams = {
      ...params.useCaseData,
      squareFeet: params.squareFeet,
      roomCount: params.roomCount,
      bedCount: params.bedCount,
      rackCount: params.rackCount,
      bayCount: params.bayCount,
      facilitySubtype: params.facilitySubtype,
      equipmentTier: params.equipmentTier,
      selectedAmenities: params.selectedAmenities,
    };
    
    // Use existing SSOT function (takes slug and useCaseData)
    const result = calculateUseCasePower(
      params.industryType,
      useCaseDataWithParams
    );
    
    // Extract peak demand from result
    const peakKW = result.powerMW * 1000; // Convert MW to kW
    
    // Estimate daily/monthly consumption (rough 40% capacity factor)
    const dailyKWh = peakKW * 24 * 0.4;
    const monthlyKWh = dailyKWh * 30;
    
    return {
      baseLoadKW: peakKW,
      totalPeakKW: peakKW,
      dailyKWh,
      monthlyKWh,
    };
  } catch (err) {
    console.error('[SSOT] Building load calculation error:', err);
    
    // Fallback calculation
    const baseLoadKW = params.roomCount * 3.5 || 
                      params.bedCount * 5.0 || 
                      params.rackCount * 20 || 
                      params.bayCount * 150 || 
                      params.squareFeet * 0.006 || 
                      100;
    
    const amenityLoadKW = params.selectedAmenities.length * 25;
    const totalPeakKW = baseLoadKW + amenityLoadKW;
    
    return {
      baseLoadKW,
      totalPeakKW,
      dailyKWh: totalPeakKW * 24 * 0.4,
      monthlyKWh: totalPeakKW * 24 * 0.4 * 30,
    };
  }
}

export default useOptimizedWizardState;

