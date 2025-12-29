/**
 * QuoteDocument Interface
 * =====================
 * SINGLE SOURCE OF TRUTH for all quote data throughout the application.
 * This interface captures the complete state of a quote from start to finish.
 * 
 * Design Principles:
 * - All calculations derive from this document
 * - No component should maintain duplicate state
 * - Immutable updates through context methods
 * - Full audit trail of changes
 */

export interface QuoteDocument {
  // ==================== METADATA ====================
  id: string;                          // Unique quote identifier
  version: number;                     // Version for optimistic updates
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in-progress' | 'review' | 'completed' | 'approved';
  completionPercentage: number;        // 0-100, auto-calculated
  
  // ==================== CUSTOMER INFO ====================
  customer?: {
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
  };

  // ==================== USE CASE (Step 1 & 2) ====================
  useCase: {
    industry: string;                  // e.g., 'hotel', 'hospital', 'datacenter'
    industryName: string;              // Display name
    template?: string;                 // Selected template ID
    usedTemplate: boolean;             // Whether they used a template or custom
    
    // User-provided data (Step 2)
    inputs: Record<string, any>;       // e.g., { rooms: 150, evChargers: 10 }
    
    // Calculated baseline from database
    baseline: {
      powerMW: number;                 // Calculated baseline power requirement
      calculatedFrom: string;          // e.g., "150 rooms × 2.93 kW/room = 440 kW"
      databaseConfig: {
        typicalLoadKw: number;
        peakLoadKw: number;
        baseLoadKw: number;
        loadFactor: number;
        profileType: string;
        recommendedDurationHours: number;
      };
    };
  };

  // ==================== CONFIGURATION (Step 3 & 4) ====================
  configuration: {
    // Battery Storage
    battery: {
      powerMW: number;                 // Storage size in MW
      durationHours: number;           // Duration hours
      capacityMWh: number;             // Total capacity (powerMW × durationHours)
      chemistry: string;               // 'LFP', 'NMC', etc.
      efficiency: number;              // Round-trip efficiency %
      depthOfDischarge: number;        // Usable DoD %
      cycleLife: number;               // Expected cycles
    };

    // Renewable Energy Sources
    renewables: {
      solar: {
        enabled: boolean;
        capacityMW: number;
        panelCount?: number;
        annualProductionMWh?: number;
      };
      wind: {
        enabled: boolean;
        capacityMW: number;
        turbineCount?: number;
        annualProductionMWh?: number;
      };
      generator: {
        enabled: boolean;
        capacityMW: number;
        fuelType?: string;
      };
    };

    // Total System Power
    totalSystemPowerMW: number;        // battery + solar + wind + generator
    
    // Advanced Settings
    advanced?: {
      controlStrategy?: string;
      peakShavingThreshold?: number;
      demandResponseEnabled?: boolean;
      gridServicesEnabled?: boolean;
    };
  };

  // ==================== LOCATION & PRICING (Step 5) ====================
  location: {
    state?: string;
    utility?: string;
    electricityRate: {
      energyChargePerKWh: number;      // $/kWh
      demandChargePerKW: number;       // $/kW-month
      utilityRateSource: string;       // e.g., "California PG&E Commercial"
    };
    incentives: {
      federal: {
        itc: number;                   // Investment Tax Credit %
        itcAmount?: number;            // Calculated ITC value
      };
      state: {
        rebate?: number;
        taxCredit?: number;
      };
      utility: {
        rebate?: number;
        demandResponse?: number;
      };
    };
  };

  // ==================== FINANCIAL ANALYSIS ====================
  financials: {
    // Costs
    costs: {
      batterySystem: number;           // Total battery system cost
      solar: number;                   // Solar installation cost
      wind: number;                    // Wind installation cost
      generator: number;               // Generator cost
      installation: number;            // Installation labor
      softCosts: number;               // Permits, engineering, etc.
      totalProjectCost: number;        // Sum of all costs
      netCostAfterIncentives: number;  // After ITC and rebates
    };

    // Savings
    savings: {
      annualEnergySavings: number;     // $/year from energy arbitrage
      annualDemandSavings: number;     // $/year from demand reduction
      annualRenewableSavings: number;  // $/year from solar/wind
      totalAnnualSavings: number;      // Sum of all savings
      lifetimeSavings: number;         // 25-year savings
    };

    // ROI Metrics
    roi: {
      paybackPeriod: number;           // Years to break even
      simpleROI: number;               // % return on investment
      irr: number;                     // Internal rate of return %
      npv: number;                     // Net present value
    };

    // Cash Flow
    cashFlow?: {
      year: number;
      savings: number;
      cumulativeSavings: number;
    }[];
  };

  // ==================== AI RECOMMENDATIONS ====================
  aiAnalysis?: {
    recommendations: {
      type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
      title: string;
      description: string;
      currentValue: string;
      suggestedValue: string;
      impact: string;
      savings?: string;
      priority: 'high' | 'medium' | 'low';
    }[];
    
    optimizationScore: number;         // 0-100, how optimal is current config
    confidenceLevel: number;           // 0-100, AI confidence in recommendations
    
    alternativeConfigs?: {
      description: string;
              powerMW: number;
      durationHours: number;
      estimatedSavings: number;
      tradeoffs: string;
    }[];
  };

  // ==================== AUDIT TRAIL ====================
  changeLog: {
    timestamp: Date;
    field: string;                     // What changed
    oldValue: any;
    newValue: any;
    source: 'user' | 'ai' | 'system';  // Who made the change
  }[];

  // ==================== VALIDATION ====================
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingFields: string[];
  };
}

/**
 * Helper type for partial updates
 */
export type QuoteDocumentUpdate = {
  [K in keyof QuoteDocument]?: Partial<QuoteDocument[K]>;
};

/**
 * Quote completeness calculation
 */
export function calculateQuoteCompleteness(quote: QuoteDocument): number {
  let completedSections = 0;
  const totalSections = 6;

  // 1. Use Case Section (Step 1 & 2)
  if (quote.useCase.industry && quote.useCase.baseline.powerMW > 0) {
    completedSections++;
  }

  // 2. Battery Configuration (Step 3)
  if (quote.configuration.battery.powerMW > 0 && quote.configuration.battery.durationHours > 0) {
    completedSections++;
  }

  // 3. Renewables (Step 4)
  if (quote.configuration.renewables.solar.enabled || 
      quote.configuration.renewables.wind.enabled || 
      quote.configuration.renewables.generator.enabled) {
    completedSections++;
  }

  // 4. Location & Pricing (Step 5)
  if (quote.location.electricityRate.energyChargePerKWh > 0) {
    completedSections++;
  }

  // 5. Financial Analysis
  if (quote.financials.costs.totalProjectCost > 0) {
    completedSections++;
  }

  // 6. Review (final step)
  if (quote.status === 'review' || quote.status === 'completed') {
    completedSections++;
  }

  return Math.round((completedSections / totalSections) * 100);
}

/**
 * Quote validation
 */
export function validateQuote(quote: QuoteDocument): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!quote.useCase.industry) {
    errors.push('Industry/use case is required');
  }

  if (quote.configuration.battery.powerMW <= 0) {
    errors.push('Battery power must be greater than 0');
  }

  if (quote.configuration.battery.durationHours <= 0) {
    errors.push('Battery duration must be greater than 0');
  }

  if (quote.location.electricityRate.energyChargePerKWh <= 0) {
    errors.push('Electricity rate is required');
  }

  // Warnings
  if (quote.configuration.battery.powerMW > 10) {
    warnings.push('Large system (>10MW) - consider equipment availability');
  }

  if (quote.financials.roi.paybackPeriod > 10) {
    warnings.push('Payback period exceeds 10 years - review economics');
  }

  if (quote.configuration.totalSystemPowerMW !== 
      (quote.configuration.battery.powerMW + 
       quote.configuration.renewables.solar.capacityMW +
       quote.configuration.renewables.wind.capacityMW +
       quote.configuration.renewables.generator.capacityMW)) {
    errors.push('Total system power calculation mismatch');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create a new empty quote document
 */
export function createEmptyQuote(): QuoteDocument {
  const now = new Date();
  
  return {
    id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    version: 1,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    completionPercentage: 0,
    
    useCase: {
      industry: '',
      industryName: '',
      usedTemplate: false,
      inputs: {},
      baseline: {
        powerMW: 0,
        calculatedFrom: '',
        databaseConfig: {
          typicalLoadKw: 0,
          peakLoadKw: 0,
          baseLoadKw: 0,
          loadFactor: 0,
          profileType: '',
          recommendedDurationHours: 4
        }
      }
    },
    
    configuration: {
      battery: {
        powerMW: 0,
        durationHours: 4,
        capacityMWh: 0,
        chemistry: 'LFP',
        efficiency: 90,
        depthOfDischarge: 90,
        cycleLife: 6000
      },
      renewables: {
        solar: { enabled: false, capacityMW: 0 },
        wind: { enabled: false, capacityMW: 0 },
        generator: { enabled: false, capacityMW: 0 }
      },
      totalSystemPowerMW: 0
    },
    
    location: {
      electricityRate: {
        energyChargePerKWh: 0.12,
        demandChargePerKW: 15,
        utilityRateSource: 'Default Commercial Rate'
      },
      incentives: {
        federal: { itc: 30 },
        state: {},
        utility: {}
      }
    },
    
    financials: {
      costs: {
        batterySystem: 0,
        solar: 0,
        wind: 0,
        generator: 0,
        installation: 0,
        softCosts: 0,
        totalProjectCost: 0,
        netCostAfterIncentives: 0
      },
      savings: {
        annualEnergySavings: 0,
        annualDemandSavings: 0,
        annualRenewableSavings: 0,
        totalAnnualSavings: 0,
        lifetimeSavings: 0
      },
      roi: {
        paybackPeriod: 0,
        simpleROI: 0,
        irr: 0,
        npv: 0
      }
    },
    
    changeLog: [],
    
    validation: {
      isValid: false,
      errors: [],
      warnings: [],
      missingFields: ['industry', 'battery configuration', 'location']
    }
  };
}
