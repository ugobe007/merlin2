/**
 * REALTIME POWER CALCULATION HOOK
 * =================================
 * 
 * Shared hook for all wizards to calculate power requirements in real-time
 * as users fill out forms. Ensures Power Profile (PP) and Power Gap (PG)
 * indicators update immediately on Step 2 (Facility Details).
 * 
 * SYSTEMATIC FLOW:
 * - Step 2: Capture user inputs → Calculate power → Update PP/PG
 * - Step 3: User adjusts config → Recalculate → Update PP/PG  
 * - Step 4/5: Pass final values through
 * 
 * Dec 14, 2025 - Created for systematic wizard consistency
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateUseCasePower } from '@/services/useCasePowerCalculations';

export interface PowerCalculationInput {
  industry: string;
  useCaseData: Record<string, any>;
  wantsSolar?: boolean;
  targetReduction?: number; // % of peak demand to offset with BESS (default 70%)
  durationHours?: number; // Battery duration (default 4 hours)
}

export interface PowerCalculationResult {
  // Raw power metrics from SSOT
  peakDemandKW: number;
  peakDemandMW: number;
  dailyKWh: number;
  monthlyKWh: number;
  
  // Recommended BESS sizing
  recommendedBatteryKW: number;
  recommendedBatteryMW: number;
  recommendedBatteryKWh: number;
  recommendedBatteryMWh: number;
  durationHours: number;
  
  // Solar recommendation
  recommendedSolarKW: number;
  recommendedSolarMW: number;
  
  // Metadata
  calculationMethod: string;
  calculatedAt: string;
  isValid: boolean;
}

export interface UseRealtimePowerCalculationProps {
  industry: string;
  useCaseData?: Record<string, any>;
  wantsSolar?: boolean;
  targetReduction?: number; // % of peak (default 70%)
  durationHours?: number; // hours (default 4)
  enabled?: boolean; // Set false to pause calculations
  debounceMs?: number; // Debounce delay (default 300ms)
}

/**
 * Hook for real-time power calculation across all wizards
 * 
 * Usage:
 * ```tsx
 * const { powerResult, isCalculating, recalculate } = useRealtimePowerCalculation({
 *   industry: 'hotel',
 *   useCaseData: { roomCount: 150, hotelClass: 'upscale' },
 *   wantsSolar: true,
 *   targetReduction: 70,
 *   durationHours: 4,
 * });
 * ```
 */
export function useRealtimePowerCalculation({
  industry,
  useCaseData = {},
  wantsSolar = false,
  targetReduction = 70,
  durationHours = 4,
  enabled = true,
  debounceMs = 300,
}: UseRealtimePowerCalculationProps) {
  const [powerResult, setPowerResult] = useState<PowerCalculationResult>({
    peakDemandKW: 0,
    peakDemandMW: 0,
    dailyKWh: 0,
    monthlyKWh: 0,
    recommendedBatteryKW: 0,
    recommendedBatteryMW: 0,
    recommendedBatteryKWh: 0,
    recommendedBatteryMWh: 0,
    durationHours: 4,
    recommendedSolarKW: 0,
    recommendedSolarMW: 0,
    calculationMethod: 'none',
    calculatedAt: '',
    isValid: false,
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCalculationRef = useRef<string>('');
  
  /**
   * Calculate power from SSOT
   */
  const calculate = useCallback((input: PowerCalculationInput) => {
    try {
      // Generate cache key to avoid redundant calculations
      const cacheKey = JSON.stringify({
        industry: input.industry,
        data: input.useCaseData,
        solar: input.wantsSolar,
        reduction: input.targetReduction,
        duration: input.durationHours,
      });
      
      // Skip if same calculation already done
      if (cacheKey === lastCalculationRef.current) {
        return;
      }
      
      lastCalculationRef.current = cacheKey;
      setIsCalculating(true);
      
      // Normalize field names for SSOT compatibility
      const normalizedData = { ...input.useCaseData };
      
      // Industry-specific field normalization
      if (input.industry === 'hotel') {
        if (!normalizedData.roomCount) {
          normalizedData.roomCount = normalizedData.numberOfRooms || normalizedData.rooms || normalizedData.facilitySize;
        }
      } else if (input.industry === 'office') {
        if (!normalizedData.squareFeet) {
          normalizedData.squareFeet = normalizedData.officeSqFt || normalizedData.buildingSqFt || normalizedData.sqFt || normalizedData.facilitySize;
        }
      } else if (input.industry === 'hospital') {
        if (!normalizedData.bedCount) {
          normalizedData.bedCount = normalizedData.beds || normalizedData.numberOfBeds || normalizedData.facilitySize;
        }
      } else if (input.industry === 'warehouse') {
        if (!normalizedData.squareFeet) {
          normalizedData.squareFeet = normalizedData.warehouseSqFt || normalizedData.sqFt || normalizedData.facilitySize;
        }
      } else if (input.industry === 'car-wash') {
        if (!normalizedData.bayCount) {
          normalizedData.bayCount = normalizedData.washBays || normalizedData.numBays || normalizedData.bays || normalizedData.facilitySize;
        }
      } else if (input.industry === 'airport') {
        if (!normalizedData.annualPassengers) {
          normalizedData.annualPassengers = normalizedData.totalPassengers || normalizedData.passengers || normalizedData.facilitySize;
        }
      } else if (input.industry === 'casino') {
        if (!normalizedData.gamingFloorSqFt) {
          normalizedData.gamingFloorSqFt = normalizedData.gamingFloorSize || normalizedData.gamingSpaceSqFt || normalizedData.facilitySize;
        }
      }
      // EV Charging: Pass through all charger fields directly
      // The SSOT handles: level2Chargers, dcfc50kwChargers, dcfc150kwChargers, dcfc350kwChargers, megawattChargers
      
      // Call SSOT power calculation
      const powerSSOT = calculateUseCasePower(input.industry, normalizedData);
      const peakDemandKW = (powerSSOT.powerMW || 0) * 1000; // Convert MW to kW
      const peakDemandMW = powerSSOT.powerMW || 0;
      
      // Estimate daily/monthly energy consumption (40% capacity factor)
      const dailyKWh = peakDemandKW * 24 * 0.4;
      const monthlyKWh = dailyKWh * 30;
      
      // Calculate recommended BESS size
      const targetReductionDecimal = (input.targetReduction || 70) / 100;
      const recommendedBatteryKW = Math.round(peakDemandKW * targetReductionDecimal);
      const recommendedBatteryMW = recommendedBatteryKW / 1000;
      const duration = input.durationHours || 4;
      const recommendedBatteryKWh = recommendedBatteryKW * duration;
      const recommendedBatteryMWh = recommendedBatteryKWh / 1000;
      
      // Calculate solar recommendation (60% of peak demand)
      let recommendedSolarKW = 0;
      let recommendedSolarMW = 0;
      if (input.wantsSolar) {
        recommendedSolarKW = Math.round(peakDemandKW * 0.6);
        recommendedSolarMW = recommendedSolarKW / 1000;
      }
      
      // Update state with calculation result
      setPowerResult({
        peakDemandKW,
        peakDemandMW,
        dailyKWh,
        monthlyKWh,
        recommendedBatteryKW,
        recommendedBatteryMW,
        recommendedBatteryKWh,
        recommendedBatteryMWh,
        durationHours: duration,
        recommendedSolarKW,
        recommendedSolarMW,
        calculationMethod: powerSSOT.calculationMethod || 'SSOT',
        calculatedAt: new Date().toISOString(),
        isValid: peakDemandKW > 0,
      });
      
      if (import.meta.env.DEV) {
        console.log('⚡ [REALTIME CALC] Power calculation completed:', {
          industry: input.industry,
          peakKW: peakDemandKW,
          batteryKW: recommendedBatteryKW,
          batteryKWh: recommendedBatteryKWh,
          solarKW: recommendedSolarKW,
          method: powerSSOT.calculationMethod,
        });
      }
    } catch (error) {
      console.error('❌ [REALTIME CALC] Calculation failed:', error);
      setPowerResult(prev => ({ ...prev, isValid: false }));
    } finally {
      setIsCalculating(false);
    }
  }, []);
  
  /**
   * Manual recalculation trigger (for Step 3 adjustments)
   */
  const recalculate = useCallback(() => {
    if (!enabled || !industry) return;
    
    calculate({
      industry,
      useCaseData,
      wantsSolar,
      targetReduction,
      durationHours,
    });
  }, [enabled, industry, useCaseData, wantsSolar, targetReduction, durationHours, calculate]);
  
  /**
   * Auto-recalculate when inputs change (debounced for performance)
   */
  useEffect(() => {
    if (!enabled || !industry || Object.keys(useCaseData).length === 0) {
      return;
    }
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      calculate({
        industry,
        useCaseData,
        wantsSolar,
        targetReduction,
        durationHours,
      });
    }, debounceMs);
    
    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [industry, useCaseData, wantsSolar, targetReduction, durationHours, enabled, debounceMs, calculate]);
  
  return {
    powerResult,
    isCalculating,
    recalculate,
  };
}
