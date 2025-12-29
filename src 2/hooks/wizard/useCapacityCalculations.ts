import { useState, useEffect } from 'react';
import { calculateEquipmentBreakdown, type EquipmentBreakdown } from '../../utils/equipmentCalculations';

/**
 * Custom hook for capacity and equipment calculations in StreamlinedWizard
 * Handles battery sizing, PCS calculations, and equipment breakdowns
 */

interface UseCapacityCalculationsProps {
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
}

interface CapacityCalculations {
  batteryCapacityMWh: number;
  batteryCapacityKWh: number;
  pcsCapacityMW: number;
  pcsCapacityKW: number;
  equipmentBreakdown: EquipmentBreakdown | null;
  totalSystemCapacity: {
    storageMW: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
    totalMW: number;
  };
}

export const useCapacityCalculations = ({
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  generatorMW
}: UseCapacityCalculationsProps): CapacityCalculations => {
  const [capacityData, setCapacityData] = useState<CapacityCalculations>({
    batteryCapacityMWh: 0,
    batteryCapacityKWh: 0,
    pcsCapacityMW: 0,
    pcsCapacityKW: 0,
    equipmentBreakdown: null,
    totalSystemCapacity: {
      storageMW: 0,
      solarMW: 0,
      windMW: 0,
      generatorMW: 0,
      totalMW: 0
    }
  });

  useEffect(() => {
    const calculateCapacity = async () => {
      // Calculate battery capacity
      const batteryCapacityMWh = storageSizeMW * durationHours;
      const batteryCapacityKWh = batteryCapacityMWh * 1000;

      // PCS (Power Conversion System) capacity matches power rating
      const pcsCapacityMW = storageSizeMW;
      const pcsCapacityKW = storageSizeMW * 1000;

      // Calculate equipment breakdown (async function)
      const equipmentBreakdown = await calculateEquipmentBreakdown(
        storageSizeMW,
        batteryCapacityMWh
      );

      // Calculate total system capacity
      const totalSystemCapacity = {
        storageMW: storageSizeMW,
        solarMW: solarMW || 0,
        windMW: windMW || 0,
        generatorMW: generatorMW || 0,
        totalMW: storageSizeMW + (solarMW || 0) + (windMW || 0) + (generatorMW || 0)
      };

      setCapacityData({
        batteryCapacityMWh,
        batteryCapacityKWh,
        pcsCapacityMW,
        pcsCapacityKW,
        equipmentBreakdown,
        totalSystemCapacity
      });

      console.log('⚡ [useCapacityCalculations] Updated capacity data:', {
        batteryCapacityMWh,
        pcsCapacityMW,
        totalSystemMW: totalSystemCapacity.totalMW
      });
    };

    calculateCapacity();
  }, [storageSizeMW, durationHours, solarMW, windMW, generatorMW]);

  return capacityData;
};

/**
 * Helper function to calculate container requirements
 */
export const calculateContainerRequirements = (
  batteryCapacityMWh: number
): {
  containers: number;
  containerType: string;
  capacityPerContainer: number;
} => {
  // Standard 40ft container: ~2.5 MWh
  const capacityPerContainer = 2.5;
  const containers = Math.ceil(batteryCapacityMWh / capacityPerContainer);

  return {
    containers,
    containerType: '40ft ISO Container',
    capacityPerContainer
  };
};

/**
 * Helper function to calculate transformer requirements
 */
export const calculateTransformerRequirements = (
  pcsCapacityMW: number
): Array<{ type: string; capacity: string; quantity: number }> => {
  const transformers: Array<{ type: string; capacity: string; quantity: number }> = [];

  // For systems > 1MW, need medium voltage transformer
  if (pcsCapacityMW >= 1) {
    const transformerCapacity = Math.ceil(pcsCapacityMW * 1.2); // 20% overhead
    transformers.push({
      type: 'Medium Voltage Transformer',
      capacity: `${transformerCapacity} MVA`,
      quantity: 1
    });
  }

  // Pad-mounted transformer for connection
  transformers.push({
    type: 'Pad-Mounted Transformer',
    capacity: pcsCapacityMW >= 5 ? '5 MVA' : '2.5 MVA',
    quantity: 1
  });

  return transformers;
};

/**
 * Helper function to calculate BMS requirements
 */
export const calculateBMSRequirements = (
  containers: number
): {
  bmsUnits: number;
  type: string;
  features: string[];
} => {
  return {
    bmsUnits: containers, // One BMS per container
    type: 'Advanced Battery Management System',
    features: [
      'Cell-level monitoring',
      'Thermal management',
      'SOC/SOH tracking',
      'Safety protection (OV/UV/OT)',
      'Cloud connectivity'
    ]
  };
};

/**
 * Helper function to calculate auxiliary systems
 */
export const calculateAuxiliarySystems = (
  storageSizeMW: number
): {
  hvacUnits: number;
  fireSuppressionType: string;
  monitoringSystem: string;
} => {
  return {
    hvacUnits: Math.ceil(storageSizeMW / 1.5), // One HVAC per 1.5 MW
    fireSuppressionType: storageSizeMW >= 2 ? 'NFPA 855 Compliant (Water Mist + Gas)' : 'Dry Chemical',
    monitoringSystem: 'SCADA with Remote Monitoring'
  };
};
