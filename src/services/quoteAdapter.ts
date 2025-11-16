/**
 * QuoteAdapter - Bridge between legacy wizard state and QuoteDocument
 * ==================================================================
 * This service helps migrate the existing SmartWizardV2 component to use
 * the new QuoteContext without breaking everything at once.
 * 
 * Strategy: Gradual migration
 * 1. Wrap SmartWizardV2 with QuoteProvider
 * 2. Sync wizard state -> QuoteDocument (write)
 * 3. Eventually replace wizard state with context reads
 */

import type { QuoteDocument } from '../types/QuoteDocument';
import type { WizardState } from '@/types';

/**
 * Convert legacy wizard state to QuoteDocument format
 */
export function legacyWizardToQuote(wizardState: WizardState): Partial<QuoteDocument> {
  
  const solarMW = wizardState.solarMW || 0;
  const windMW = wizardState.windMW || 0;
  const generatorMW = wizardState.generatorMW || 0;
  const batteryMW = wizardState.storageSizeMW || 0;
  
  return {
    useCase: {
      industry: wizardState.selectedTemplate || '',
      industryName: wizardState.selectedTemplate 
        ? getIndustryDisplayName(wizardState.selectedTemplate)
        : '',
      usedTemplate: !!wizardState.selectedTemplate,
      inputs: wizardState.useCaseData || {},
      baseline: {
        powerMW: batteryMW, // Will be recalculated properly
        calculatedFrom: 'Legacy migration',
        databaseConfig: {
          typicalLoadKw: batteryMW * 1000,
          peakLoadKw: batteryMW * 1000 * 1.25,
          baseLoadKw: batteryMW * 1000 * 0.8,
          loadFactor: 0.8,
          profileType: 'peaked',
          recommendedDurationHours: wizardState.durationHours || 4
        }
      }
    },
    
    configuration: {
      battery: {
        powerMW: batteryMW,
        durationHours: wizardState.durationHours || 4,
        capacityMWh: batteryMW * (wizardState.durationHours || 4),
        chemistry: wizardState.chemistry || 'LFP',
        efficiency: wizardState.efficiency || 90,
        depthOfDischarge: 90,
        cycleLife: 6000
      },
      
      renewables: {
        solar: {
          enabled: solarMW > 0,
          capacityMW: solarMW
        },
        wind: {
          enabled: windMW > 0,
          capacityMW: windMW
        },
        generator: {
          enabled: generatorMW > 0,
          capacityMW: generatorMW
        }
      },
      
      totalSystemPowerMW: batteryMW + solarMW + windMW + generatorMW
    },
    
    location: {
      state: wizardState.selectedState,
      utility: wizardState.selectedUtility,
      electricityRate: {
        energyChargePerKWh: wizardState.electricityRate || 0.12,
        demandChargePerKW: wizardState.demandCharge || 15,
        utilityRateSource: wizardState.selectedUtility || 'Default Commercial Rate'
      },
      incentives: {
        federal: {
          itc: 30 // Default ITC
        },
        state: {},
        utility: {}
      }
    }
  };
}

/**
 * Convert QuoteDocument back to legacy format (for backward compatibility)
 */
export function quoteToLegacyWizard(quote: QuoteDocument): any {
  return {
    selectedTemplate: quote.useCase.industry,
    useCaseData: quote.useCase.inputs,
    storageSizeMW: quote.configuration.battery.powerMW,
    durationHours: quote.configuration.battery.durationHours,
    solarMW: quote.configuration.renewables.solar.capacityMW,
    windMW: quote.configuration.renewables.wind.capacityMW,
    generatorMW: quote.configuration.renewables.generator.capacityMW,
    electricityRate: quote.location.electricityRate.energyChargePerKWh,
    demandCharge: quote.location.electricityRate.demandChargePerKW,
    selectedState: quote.location.state,
    selectedUtility: quote.location.utility,
    chemistry: quote.configuration.battery.chemistry,
    efficiency: quote.configuration.battery.efficiency
  };
}

/**
 * Get display name for industry slug
 */
function getIndustryDisplayName(slug: string): string {
  const industryNames: { [key: string]: string } = {
    'hotel': 'Hotel & Resort',
    'hospital': 'Healthcare Facility',
    'datacenter': 'Data Center',
    'manufacturing': 'Manufacturing Plant',
    'retail': 'Retail Store',
    'office': 'Office Building',
    'warehouse': 'Warehouse & Distribution',
    'agriculture': 'Agriculture & Farming',
    'ev-charging': 'EV Charging Station',
    'microgrid': 'Microgrid',
    'utilities': 'Utility-Scale'
  };
  
  return industryNames[slug] || slug;
}

/**
 * Sync wizard state changes to QuoteDocument
 * Call this whenever wizard state changes
 */
export function syncWizardStateToQuote(
  wizardState: any,
  updateQuote: (updates: Partial<QuoteDocument>) => void
) {
  const quoteUpdates = legacyWizardToQuote(wizardState);
  updateQuote(quoteUpdates);
}

/**
 * Extract financial data for QuoteDocument
 */
export function extractFinancials(financialMetrics: any): Partial<QuoteDocument['financials']> {
  return {
    costs: {
      batterySystem: financialMetrics.totalCost || 0,
      solar: financialMetrics.solarCost || 0,
      wind: financialMetrics.windCost || 0,
      generator: financialMetrics.generatorCost || 0,
      installation: financialMetrics.installationCost || 0,
      softCosts: financialMetrics.softCosts || 0,
      totalProjectCost: financialMetrics.totalProjectCost || 0,
      netCostAfterIncentives: financialMetrics.netCostAfterIncentives || 0
    },
    
    savings: {
      annualEnergySavings: financialMetrics.annualEnergySavings || 0,
      annualDemandSavings: financialMetrics.annualDemandSavings || 0,
      annualRenewableSavings: financialMetrics.annualRenewableSavings || 0,
      totalAnnualSavings: financialMetrics.totalAnnualSavings || 0,
      lifetimeSavings: financialMetrics.lifetimeSavings || 0
    },
    
    roi: {
      paybackPeriod: financialMetrics.paybackYears || 0,
      simpleROI: financialMetrics.roi || 0,
      irr: financialMetrics.irr || 0,
      npv: financialMetrics.npv || 0
    }
  };
}

/**
 * Calculate baseline from use case data
 * This should eventually be moved to baselineService
 */
export function calculateBaselineForQuote(
  industry: string,
  useCaseData: any,
  databaseConfig?: any
): {
  powerMW: number;
  calculatedFrom: string;
} {
  // Industry-specific calculations
  switch (industry) {
    case 'hotel': {
      const rooms = useCaseData.rooms || 100;
      const kWPerRoom = 2.93; // From database
      const totalKW = rooms * kWPerRoom;
      return {
        powerMW: totalKW / 1000,
        calculatedFrom: `${rooms} rooms × ${kWPerRoom} kW/room = ${totalKW.toFixed(0)} kW`
      };
    }
    
    case 'hospital': {
      const beds = useCaseData.beds || 100;
      const kWPerBed = 5.5; // From database
      const totalKW = beds * kWPerBed;
      return {
        powerMW: totalKW / 1000,
        calculatedFrom: `${beds} beds × ${kWPerBed} kW/bed = ${totalKW.toFixed(0)} kW`
      };
    }
    
    case 'datacenter': {
      const racks = useCaseData.racks || 100;
      const kWPerRack = 8.0; // From database
      const totalKW = racks * kWPerRack;
      return {
        powerMW: totalKW / 1000,
        calculatedFrom: `${racks} racks × ${kWPerRack} kW/rack = ${totalKW.toFixed(0)} kW`
      };
    }
    
    case 'manufacturing': {
      const sqft = useCaseData.sqft || 50000;
      const kWPerSqft = 0.015; // From database
      const totalKW = sqft * kWPerSqft;
      return {
        powerMW: totalKW / 1000,
        calculatedFrom: `${sqft.toLocaleString()} sqft × ${kWPerSqft} kW/sqft = ${totalKW.toFixed(0)} kW`
      };
    }
    
    case 'ev-charging': {
      const chargers = useCaseData.chargers || 10;
      const kWPerCharger = 150; // DC fast charger
      const totalKW = chargers * kWPerCharger;
      return {
        powerMW: totalKW / 1000,
        calculatedFrom: `${chargers} chargers × ${kWPerCharger} kW/charger = ${totalKW.toFixed(0)} kW`
      };
    }
    
    default: {
      // Fallback to database config if available
      if (databaseConfig?.typicalLoadKw) {
        return {
          powerMW: databaseConfig.typicalLoadKw / 1000,
          calculatedFrom: `Database baseline: ${databaseConfig.typicalLoadKw} kW`
        };
      }
      
      // Ultimate fallback
      return {
        powerMW: 2.0,
        calculatedFrom: 'Default 2.0 MW baseline (custom configuration)'
      };
    }
  }
}
