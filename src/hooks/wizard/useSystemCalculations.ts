import { useState, useEffect } from 'react';
import { calculateDatabaseBaseline } from '../../services/baselineService';
import { calculateAutomatedSolarSizing, type SolarSizingResult } from '../../utils/solarSizingUtils';
import { calculateUseCasePower, calculateEVChargingPower } from '../../services/useCasePowerCalculations';

/**
 * Custom hook for system calculation logic in StreamlinedWizard
 * Extracts complex calculation logic from the main component
 * 
 * ⚠️ IMPORTANT: This hook now delegates power calculations to useCasePowerCalculations.ts
 * DO NOT add hardcoded power density values here - update the centralized service instead!
 */

interface UseSystemCalculationsProps {
  selectedTemplate: string;
  useCaseData: { [key: string]: any };
  isQuickstart: boolean;
}

interface SystemCalculations {
  storageSizeMW: number;
  durationHours: number;
  solarSuggestion: SolarSizingResult | null;
  isCalculating: boolean;
}

export const useSystemCalculations = ({
  selectedTemplate,
  useCaseData,
  isQuickstart
}: UseSystemCalculationsProps): SystemCalculations => {
  const [storageSizeMW, setStorageSizeMW] = useState(2);
  const [durationHours, setDurationHours] = useState(4);
  const [solarSuggestion, setSolarSuggestion] = useState<SystemCalculations['solarSuggestion']>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  /**
   * @deprecated Use calculateUseCasePower() from useCasePowerCalculations.ts instead
   * This function is kept for backward compatibility but should not be used.
   * All power density standards are now in: src/services/useCasePowerCalculations.ts
   */
  const _deprecated_getPowerDensity = (buildingType: string, _subType?: string): number => {
    console.warn('⚠️ DEPRECATED: getPowerDensity() is deprecated. Use calculateUseCasePower() from useCasePowerCalculations.ts');
    // Redirect to centralized calculation
    const result = calculateUseCasePower(buildingType, {});
    return result.powerMW * 1000; // Return as kW for backward compatibility
  };

  /**
   * @deprecated Use calculateUseCasePower() directly - it handles scale internally
   * This function is kept ONLY for database baseline calls which still need scale.
   * 
   * ⚠️ WARNING: These scale factors may differ from SSOT calculations.
   * The SSOT (useCasePowerCalculations.ts) handles scaling internally with
   * more accurate industry-specific parameters.
   */
  const calculateScaleFactor = (template: string, data: { [key: string]: any }): number => {
    // Log deprecation in dev mode
    if (import.meta.env.DEV) {
      console.warn('⚠️ calculateScaleFactor is deprecated - SSOT handles scaling internally');
    }
    // For most use cases, we now use calculateUseCasePower directly
    // This function is only used as a fallback for baselineService
    switch (template) {
      case 'hotel':
        return (parseInt(data.numRooms) || 100) / 100;
      case 'car-wash':
        return parseInt(data.numBays) || 3;
      case 'hospital':
        return (parseInt(data.bedCount) || 200) / 100;
      case 'college':
        return (parseInt(data.enrollment) || 5000) / 1000;
      case 'apartment':
        return (parseInt(data.numUnits) || 100) / 100;
      case 'data-center':
        return parseInt(data.capacity) || 5;
      case 'airport':
        return parseInt(data.annual_passengers) || 5;
      case 'manufacturing':
        return parseInt(data.numLines) || parseInt(data.production_lines) || 2;
      case 'warehouse':
      case 'logistics':
        return (parseInt(data.facility_size) || 100) / 100;
      case 'retail':
        return (parseInt(data.store_size) || 50) / 10;
      case 'casino':
        return (parseInt(data.gaming_floor_size) || 50000) / 50000;
      case 'agricultural':
        return (parseInt(data.farm_size) || 1000) / 1000;
      case 'indoor-farm':
        return (parseInt(data.growing_area) || 10000) / 10000;
      case 'cold-storage':
        return (parseInt(data.storage_volume) || parseInt(data.capacity) || 50000) / 50000;
      case 'microgrid':
        return (parseInt(data.numBuildings) || parseInt(data.homes) || 50) / 50;
      default:
        return 1;
    }
  };

  /**
   * Calculate EV charging configuration
   * @deprecated Use calculateEVChargingPower() from useCasePowerCalculations.ts instead
   * This function delegates to the centralized calculation.
   */
  const _calculateEVChargingConfig = (data: { [key: string]: any }) => {
    // Use centralized EV charging calculation
    const result = calculateEVChargingPower(
      parseInt(data.numberOfLevel1Chargers) || 0,
      parseInt(data.numberOfLevel2Chargers || data.level2Chargers) || 0,
      parseInt(data.numberOfDCFastChargers || data.dcFastChargers) || 0
    );
    
    if (import.meta.env.DEV) { console.log('🔌 [useSystemCalculations] EV config from centralized calc:', result); }
    
    return {
      powerMW: result.powerMW,
      durationHrs: result.durationHrs
    };
  };

  /**
   * Auto-calculate realistic configuration based on use case data
   * Uses centralized calculations from useCasePowerCalculations.ts
   */
  useEffect(() => {
    const calculateConfig = async () => {
      if (!selectedTemplate || Object.keys(useCaseData).length === 0 || isQuickstart) {
        return;
      }

      setIsCalculating(true);

      try {
        // ✅ PRIMARY: Use centralized power calculation for ALL use cases
        // This is the SINGLE SOURCE OF TRUTH for power calculations
        const centralizedResult = calculateUseCasePower(selectedTemplate, useCaseData);
        if (import.meta.env.DEV) { console.log('⚡ [useSystemCalculations] Centralized power calculation:', centralizedResult); }
        
        // Special handling for EV charging (centralized calc is sufficient)
        if (selectedTemplate === 'ev-charging') {
          setStorageSizeMW(centralizedResult.powerMW);
          setDurationHours(centralizedResult.durationHrs);
          setSolarSuggestion(null); // Solar is optional for EV charging
        } else {
          // For other use cases, also check database baseline for additional config
          const scale = calculateScaleFactor(selectedTemplate, useCaseData);
          
          // Use shared database-driven baseline calculation
          const baseline = await calculateDatabaseBaseline(selectedTemplate, scale, useCaseData);
          if (import.meta.env.DEV) { console.log('🎯 [useSystemCalculations] Database baseline:', baseline); }
          
          // Use the higher of centralized or database calculation
          // This ensures we don't undersize due to missing database entries
          const finalPowerMW = Math.max(centralizedResult.powerMW, baseline.powerMW);
          const finalDurationHrs = baseline.durationHrs || centralizedResult.durationHrs;
          
          if (import.meta.env.DEV) { console.log(`📊 [useSystemCalculations] Final power: ${finalPowerMW} MW (centralized: ${centralizedResult.powerMW}, baseline: ${baseline.powerMW})`); }
          
          setStorageSizeMW(finalPowerMW);
          setDurationHours(finalDurationHrs);

          // Enhanced solar sizing using automated calculation
          const buildingCharacteristics = {
            useCase: selectedTemplate,
            buildingSize: useCaseData.buildingSize || useCaseData.facilitySize,
            facilitySize: useCaseData.facilitySize,
            peakLoad: finalPowerMW,
            electricalLoad: useCaseData.electricalLoad || useCaseData.peakLoad,
            capacity: useCaseData.capacity,
            numRooms: useCaseData.numRooms,
            storageVolume: useCaseData.storageVolume || useCaseData.storage_volume,
            growingArea: useCaseData.growingArea || useCaseData.growing_area,
            storeSize: useCaseData.storeSize || useCaseData.store_size,
            gamingFloorSize: useCaseData.gamingFloorSize || useCaseData.gaming_floor_size
          };

          const suggestion = calculateAutomatedSolarSizing(buildingCharacteristics);
          setSolarSuggestion(suggestion);
          
          console.log('🌞 [useSystemCalculations] Solar suggestion:', {
            template: selectedTemplate,
            characteristics: buildingCharacteristics,
            suggestion,
            note: 'User must explicitly choose solar in Step 3'
          });
        }
      } catch (error) {
        console.error('❌ [useSystemCalculations] Error calculating config:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateConfig();
  }, [selectedTemplate, useCaseData, isQuickstart]);

  return {
    storageSizeMW,
    durationHours,
    solarSuggestion,
    isCalculating
  };
};
