import { useState, useEffect } from 'react';
import { calculateDatabaseBaseline } from '../../services/baselineService';
import { calculateAutomatedSolarSizing, type SolarSizingResult } from '../../utils/solarSizingUtils';

/**
 * Custom hook for system calculation logic in SmartWizardV2
 * Extracts complex calculation logic from the main component
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
   * Get power density based on building type (W/sq ft)
   * Based on CBECS & industry standards
   */
  const getPowerDensity = (buildingType: string, subType?: string): number => {
    switch (buildingType) {
      case 'hotel': return 9; // 8-10 W/sq ft (24/7, HVAC, kitchen, laundry)
      case 'datacenter': return 150; // 100-200 W/sq ft (high-density IT loads)
      case 'tribal-casino': return 15; // 12-18 W/sq ft (gaming, lighting, 24/7 HVAC)
      case 'logistics-center':
        if (subType === 'cold-storage') return 25; // 20-30 W/sq ft (refrigeration)
        if (subType === 'fulfillment') return 8; // 6-10 W/sq ft (automation, conveyors)
        return 5; // 3-7 W/sq ft (standard warehouse)
      case 'shopping-center': return 10; // 8-12 W/sq ft (retail, HVAC, lighting)
      case 'office': return 6; // 5-7 W/sq ft (lighting, computers, HVAC)
      case 'retail': return 8; // 6-10 W/sq ft (lighting, HVAC, some equipment)
      case 'indoor-farm': return 35; // 30-40 W/sq ft (grow lights, climate control)
      default: return 7; // Generic commercial baseline
    }
  };

  /**
   * Calculate scale factor based on use case type and data
   */
  const calculateScaleFactor = (template: string, data: { [key: string]: any }): number => {
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
   */
  const calculateEVChargingConfig = (data: { [key: string]: any }) => {
    const level2Count = parseInt(data.level2Chargers) || 0;
    const level2Power = parseFloat(data.level2Power) || 11;
    const dcFastCount = parseInt(data.dcFastChargers) || 0;
    const dcFastPower = parseFloat(data.dcFastPower) || 150;
    const peakConcurrency = parseInt(data.peakConcurrency) || 50;

    // Calculate total charging capacity
    const totalLevel2Power = (level2Count * level2Power) / 1000; // MW
    const totalDCFastPower = (dcFastCount * dcFastPower) / 1000; // MW
    const totalChargingPower = totalLevel2Power + totalDCFastPower;

    // Storage sizing: 60-80% of total charging power for demand management
    const concurrencyFactor = Math.min(peakConcurrency / 100, 0.8); // Max 80%
    const demandManagementSize = totalChargingPower * concurrencyFactor * 0.7;

    // Minimum 0.5MW, maximum practical size based on charger count
    const calculatedPowerMW = Math.max(0.5, Math.min(demandManagementSize, totalChargingPower * 0.8));
    const calculatedDurationHrs = Math.max(2, Math.min(4, 3)); // 2-4 hours

    return {
      powerMW: Math.round(calculatedPowerMW * 10) / 10,
      durationHrs: calculatedDurationHrs
    };
  };

  /**
   * Auto-calculate realistic configuration based on use case data
   */
  useEffect(() => {
    const calculateConfig = async () => {
      if (!selectedTemplate || Object.keys(useCaseData).length === 0 || isQuickstart) {
        return;
      }

      setIsCalculating(true);

      try {
        // Special handling for EV charging
        if (selectedTemplate === 'ev-charging') {
          const evConfig = calculateEVChargingConfig(useCaseData);
          setStorageSizeMW(evConfig.powerMW);
          setDurationHours(evConfig.durationHrs);
          setSolarSuggestion(null); // Solar is optional for EV charging
        } else {
          // Standard use case calculation
          const scale = calculateScaleFactor(selectedTemplate, useCaseData);
          
          // Use shared database-driven baseline calculation
          const baseline = await calculateDatabaseBaseline(selectedTemplate, scale, useCaseData);
          console.log('🎯 [useSystemCalculations] Baseline from shared service:', baseline);
          
          setStorageSizeMW(baseline.powerMW);
          setDurationHours(baseline.durationHrs);

          // Enhanced solar sizing using automated calculation
          const buildingCharacteristics = {
            useCase: selectedTemplate,
            buildingSize: useCaseData.buildingSize || useCaseData.facilitySize,
            facilitySize: useCaseData.facilitySize,
            peakLoad: baseline.powerMW,
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
