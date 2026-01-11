import { calculateDatabaseBaseline } from '@/services/baselineService';
import { getBatteryPricing } from '@/services/unifiedPricingService';
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
import { useCaseRepository } from '@/infrastructure/repositories/useCaseRepository';
import type { DetailedUseCase } from '@/core/domain/quote.types';

export interface BuildQuoteInput {
  useCaseSlug: string;
  answers: Record<string, string | number | boolean>;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  electricityRate?: number;
  storageSizeMW?: number;
  durationHours?: number;
  location?: {
    state?: string;
    zipCode?: string;
  };
}

export interface QuoteResult {
  baseline: {
    powerMW: number;
    durationHrs: number;
    bessKwh: number;
    solarMW: number;
  };
  pricing: {
    batterySystem: number;
    solarSystem: number;
    totalEquipment: number;
    installation: number;
    totalProject: number;
  };
  financials: {
    npv: number;
    irr: number;
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    annualSavings: number;
    taxCredit: number;
  };
}

export const buildQuote = async (input: BuildQuoteInput): Promise<QuoteResult> => {
  const { useCaseSlug, answers, location } = input;

  const useCaseDetails = await useCaseRepository.findDetailedBySlug(useCaseSlug);
  if (!useCaseDetails) {
    throw new Error(`Use case not found: ${useCaseSlug}`);
  }

  const baseline = await calculateDatabaseBaseline(useCaseDetails.slug, 1, answers);
  
  const batteryKWh = baseline.powerMW * baseline.durationHrs * 1000;
  const batteryPricing = await getBatteryPricing(baseline.powerMW, baseline.durationHrs);
  
  // Calculate total costs from per-unit pricing
  const equipmentCost = batteryKWh * batteryPricing.pricePerKWh;
  const installationCost = equipmentCost * 0.15; // 15% installation markup
  
  const financials = await calculateFinancialMetrics({
    storageSizeMW: input.storageSizeMW || baseline.powerMW,
    durationHours: input.durationHours || baseline.durationHrs,
    electricityRate: input.electricityRate ?? 0.12,
    solarMW: input.solarMW || baseline.solarMW,
    equipmentCost,
    installationCost,
    location: location?.state || 'California',
    includeNPV: true
  });

  return {
    baseline: {
      powerMW: baseline.powerMW,
      durationHrs: baseline.durationHrs,
      bessKwh: batteryKWh,
      solarMW: baseline.solarMW
    },
    pricing: {
      batterySystem: equipmentCost,
      solarSystem: 0,
      totalEquipment: equipmentCost,
      installation: installationCost,
      totalProject: equipmentCost + installationCost
    },
    financials: {
      npv: financials.npv ?? 0,
      irr: financials.irr ?? 0,
      paybackYears: financials.paybackYears,
      roi10Year: financials.roi10Year,
      roi25Year: financials.roi25Year,
      annualSavings: financials.annualSavings || 0,
      taxCredit: financials.taxCredit || (equipmentCost + installationCost) * 0.30 // 30% ITC
    }
  };
};

// Export helper functions for backward compatibility
export async function getUseCasesForSelection() {
  return await useCaseRepository.findAll({ includeInactive: false });
}

export async function getUseCaseDetails(slug: string): Promise<DetailedUseCase | null> {
  return await useCaseRepository.findDetailedBySlug(slug);
}
