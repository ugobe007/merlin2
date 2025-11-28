import { useState, useEffect } from 'react';
import { calculateFinancialMetrics } from '../../services/centralizedCalculations';

/**
 * Custom hook for financial calculations in SmartWizardV2
 * Handles NPV, IRR, payback period, and savings calculations
 */

interface UseFinancialMetricsProps {
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  location: string;
  electricityRate: number;
  costs: {
    equipmentCost: number;
    installationCost: number;
    shippingCost: number;
    totalUpfront: number;
  };
}

interface FinancialMetrics {
  npv: number;
  irr: number;
  paybackYears: number;
  annualSavings: number;
  lifetimeSavings: number;
  roi: number;
  isCalculating: boolean;
}

export const useFinancialMetrics = ({
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  location,
  electricityRate,
  costs
}: UseFinancialMetricsProps): FinancialMetrics => {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    npv: 0,
    irr: 0,
    paybackYears: 0,
    annualSavings: 0,
    lifetimeSavings: 0,
    roi: 0,
    isCalculating: false
  });

  useEffect(() => {
    const calculateMetrics = async () => {
      if (costs.totalUpfront === 0 || storageSizeMW === 0) {
        return;
      }

      setMetrics(prev => ({ ...prev, isCalculating: true }));

      try {
        // Calculate annual savings based on storage and renewables
        const bessAnnualSavings = calculateBESSAnnualSavings(
          storageSizeMW,
          durationHours,
          electricityRate,
          location
        );

        const solarAnnualSavings = calculateSolarAnnualSavings(
          solarMW,
          electricityRate,
          location
        );

        const windAnnualSavings = calculateWindAnnualSavings(
          windMW,
          electricityRate,
          location
        );

        const totalAnnualSavings = bessAnnualSavings + solarAnnualSavings + windAnnualSavings;

        // Use centralized financial calculations
        const financialMetrics = await calculateFinancialMetrics({
          storageSizeMW,
          durationHours,
          solarMW: solarMW || 0,
          windMW: windMW || 0,
          location,
          electricityRate,
          equipmentCost: costs.equipmentCost,
          installationCost: costs.installationCost,
          shippingCost: costs.shippingCost,
          discountRate: 0.08,
          projectLifetimeYears: 25
        });

        // ✅ USE CENTRALIZED RESULTS - Single source of truth
        // DO NOT recalculate payback/roi locally - use what centralizedCalculations returns
        setMetrics({
          npv: financialMetrics.npv || 0,
          irr: financialMetrics.irr || 0, // Already a percentage from centralized service
          paybackYears: Math.round(financialMetrics.paybackYears * 10) / 10,
          annualSavings: financialMetrics.annualSavings,
          lifetimeSavings: financialMetrics.annualSavings * 25,
          roi: Math.round(financialMetrics.roi25Year || 0),
          isCalculating: false
        });

      } catch (error) {
        console.error('❌ [useFinancialMetrics] Error calculating metrics:', error);
        setMetrics(prev => ({ ...prev, isCalculating: false }));
      }
    };

    calculateMetrics();
  }, [storageSizeMW, durationHours, solarMW, windMW, location, electricityRate, costs]);

  return metrics;
};

/**
 * Calculate annual savings from BESS based on use cases
 */
const calculateBESSAnnualSavings = (
  storageMW: number,
  durationHrs: number,
  electricityRate: number,
  location: string
): number => {
  const energyMWh = storageMW * durationHrs;
  
  // Peak shaving value: ~2 cycles/day average
  const peakShavingCycles = 730; // 365 days * 2 cycles
  const peakShavingValue = energyMWh * peakShavingCycles * electricityRate * 0.6; // 60% efficiency
  
  // Demand charge reduction: ~$15/kW-month average
  const demandChargeSavings = storageMW * 1000 * 15 * 12; // kW * $/kW-month * months
  
  // Arbitrage value: ~1 cycle/day, $0.10/kWh spread
  const arbitrageCycles = 365;
  const arbitrageValue = energyMWh * 1000 * arbitrageCycles * 0.10 * 0.85; // 85% efficiency
  
  return peakShavingValue + demandChargeSavings + arbitrageValue;
};

/**
 * Calculate annual savings from solar
 */
const calculateSolarAnnualSavings = (
  solarMW: number,
  electricityRate: number,
  location: string
): number => {
  if (solarMW === 0) return 0;
  
  // Capacity factor varies by location (15-25%)
  const capacityFactor = location.toLowerCase().includes('california') ? 0.22 : 0.18;
  const annualGeneration = solarMW * 8760 * capacityFactor * 1000; // kWh/year
  
  return annualGeneration * electricityRate;
};

/**
 * Calculate annual savings from wind
 */
const calculateWindAnnualSavings = (
  windMW: number,
  electricityRate: number,
  location: string
): number => {
  if (windMW === 0) return 0;
  
  // Capacity factor varies by location (25-40%)
  const capacityFactor = 0.30; // Average
  const annualGeneration = windMW * 8760 * capacityFactor * 1000; // kWh/year
  
  return annualGeneration * electricityRate;
};
