/**
 * QUOTE BUILDER
 * 
 * Builder pattern for creating test quote data
 * Provides fluent API for constructing quote configurations
 */

export interface QuoteDetails {
  quoteName: string;
  facility: {
    type: string;
    squareFootage: number;
    operatingHours: number;
  };
  system: {
    powerMW: number;
    durationHours: number;
    capacityMWh: number;
  };
  financials: {
    equipmentCost: number;
    installationCost: number;
    totalCost: number;
    annualSavings: number;
    paybackYears: number;
    roi10Year: number;
    roi25Year: number;
    npv?: number;
    irr?: number;
  };
  solar?: {
    capacityMWp: number;
    cost: number;
  };
  region: string;
  electricityRate: number;
  demandCharge: number;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export class QuoteBuilder {
  private data: Partial<QuoteDetails> = {};

  // ============================================================================
  // BASIC INFORMATION
  // ============================================================================

  withName(name: string): this {
    this.data.quoteName = name;
    return this;
  }

  withRegion(region: string): this {
    this.data.region = region;
    return this;
  }

  withElectricityRate(rate: number): this {
    this.data.electricityRate = rate;
    return this;
  }

  withDemandCharge(charge: number): this {
    this.data.demandCharge = charge;
    return this;
  }

  // ============================================================================
  // FACILITY CONFIGURATION
  // ============================================================================

  withFacility(type: string, squareFootage: number, operatingHours: number): this {
    this.data.facility = { type, squareFootage, operatingHours };
    return this;
  }

  withFacilityType(type: string): this {
    if (!this.data.facility) {
      this.data.facility = { type, squareFootage: 50000, operatingHours: 12 };
    } else {
      this.data.facility.type = type;
    }
    return this;
  }

  withSquareFootage(squareFootage: number): this {
    if (!this.data.facility) {
      this.data.facility = { type: 'medical_office', squareFootage, operatingHours: 12 };
    } else {
      this.data.facility.squareFootage = squareFootage;
    }
    return this;
  }

  // ============================================================================
  // SYSTEM CONFIGURATION
  // ============================================================================

  withSystem(powerMW: number, durationHours: number): this {
    this.data.system = {
      powerMW,
      durationHours,
      capacityMWh: powerMW * durationHours
    };
    return this;
  }

  withPower(powerMW: number): this {
    if (!this.data.system) {
      this.data.system = { powerMW, durationHours: 4, capacityMWh: powerMW * 4 };
    } else {
      this.data.system.powerMW = powerMW;
      this.data.system.capacityMWh = powerMW * this.data.system.durationHours;
    }
    return this;
  }

  withDuration(durationHours: number): this {
    if (!this.data.system) {
      this.data.system = { powerMW: 1, durationHours, capacityMWh: durationHours };
    } else {
      this.data.system.durationHours = durationHours;
      this.data.system.capacityMWh = this.data.system.powerMW * durationHours;
    }
    return this;
  }

  // ============================================================================
  // SOLAR INTEGRATION
  // ============================================================================

  withSolar(capacityMWp: number, cost?: number): this {
    this.data.solar = {
      capacityMWp,
      cost: cost || capacityMWp * 1200000 // Default: $1.2M per MWp
    };
    return this;
  }

  withoutSolar(): this {
    this.data.solar = undefined;
    return this;
  }

  // ============================================================================
  // FINANCIAL CONFIGURATION
  // ============================================================================

  withFinancials(
    equipmentCost: number,
    installationCost: number,
    annualSavings: number,
    paybackYears: number
  ): this {
    const totalCost = equipmentCost + installationCost;
    const roi10Year = ((annualSavings * 10) / totalCost) * 100;
    const roi25Year = ((annualSavings * 25) / totalCost) * 100;

    this.data.financials = {
      equipmentCost,
      installationCost,
      totalCost,
      annualSavings,
      paybackYears,
      roi10Year,
      roi25Year
    };
    return this;
  }

  withEquipmentCost(cost: number): this {
    if (!this.data.financials) {
      this.data.financials = {
        equipmentCost: cost,
        installationCost: cost * 0.3,
        totalCost: cost * 1.3,
        annualSavings: cost * 0.15,
        paybackYears: 6.67,
        roi10Year: 115.4,
        roi25Year: 288.5
      };
    } else {
      this.data.financials.equipmentCost = cost;
      this.data.financials.totalCost = cost + this.data.financials.installationCost;
    }
    return this;
  }

  withInstallationCost(cost: number): this {
    if (!this.data.financials) {
      this.data.financials = {
        equipmentCost: cost * 3,
        installationCost: cost,
        totalCost: cost * 4,
        annualSavings: cost * 0.5,
        paybackYears: 8,
        roi10Year: 125,
        roi25Year: 312.5
      };
    } else {
      this.data.financials.installationCost = cost;
      this.data.financials.totalCost = this.data.financials.equipmentCost + cost;
    }
    return this;
  }

  withAnnualSavings(savings: number): this {
    if (!this.data.financials) {
      const totalCost = savings * 6;
      this.data.financials = {
        equipmentCost: totalCost * 0.7,
        installationCost: totalCost * 0.3,
        totalCost,
        annualSavings: savings,
        paybackYears: 6,
        roi10Year: 166.7,
        roi25Year: 416.7
      };
    } else {
      this.data.financials.annualSavings = savings;
      this.data.financials.paybackYears = this.data.financials.totalCost / savings;
      this.data.financials.roi10Year = ((savings * 10) / this.data.financials.totalCost) * 100;
      this.data.financials.roi25Year = ((savings * 25) / this.data.financials.totalCost) * 100;
    }
    return this;
  }

  withNPV(npv: number): this {
    if (!this.data.financials) {
      this.withFinancials(1000000, 300000, 150000, 8.67);
    }
    this.data.financials!.npv = npv;
    return this;
  }

  withIRR(irr: number): this {
    if (!this.data.financials) {
      this.withFinancials(1000000, 300000, 150000, 8.67);
    }
    this.data.financials!.irr = irr;
    return this;
  }

  // ============================================================================
  // PRESET QUOTES
  // ============================================================================

  smallCommercial(): this {
    return this
      .withName('Small Commercial Quote')
      .withFacility('retail', 25000, 12)
      .withSystem(1, 4)
      .withFinancials(1200000, 360000, 180000, 8.67)
      .withRegion('North America')
      .withElectricityRate(0.12)
      .withDemandCharge(15);
  }

  mediumCommercial(): this {
    return this
      .withName('Medium Commercial Quote')
      .withFacility('medical_office', 50000, 12)
      .withSystem(2, 4)
      .withFinancials(2400000, 720000, 360000, 8.67)
      .withRegion('North America')
      .withElectricityRate(0.13)
      .withDemandCharge(18);
  }

  largeCommercial(): this {
    return this
      .withName('Large Commercial Quote')
      .withFacility('datacenter', 100000, 24)
      .withSystem(5, 6)
      .withFinancials(6000000, 1800000, 900000, 8.67)
      .withRegion('North America')
      .withElectricityRate(0.10)
      .withDemandCharge(20);
  }

  industrial(): this {
    return this
      .withName('Industrial Quote')
      .withFacility('manufacturing', 150000, 24)
      .withSystem(10, 8)
      .withFinancials(12000000, 3600000, 1800000, 8.67)
      .withRegion('North America')
      .withElectricityRate(0.08)
      .withDemandCharge(25);
  }

  hospitalWithSolar(): this {
    return this
      .withName('Hospital with Solar')
      .withFacility('hospital', 300000, 24)
      .withSystem(8, 12)
      .withFinancials(9600000, 2880000, 1440000, 8.67)
      .withSolar(10, 12000000)
      .withRegion('North America')
      .withElectricityRate(0.14)
      .withDemandCharge(22);
  }

  offGridMicrogrid(): this {
    return this
      .withName('Off-Grid Microgrid')
      .withFacility('mining-camp', 50000, 24)
      .withSystem(3, 24)
      .withFinancials(3600000, 1080000, 540000, 8.67)
      .withSolar(5, 6000000)
      .withRegion('Remote')
      .withElectricityRate(0.30)
      .withDemandCharge(0);
  }

  // ============================================================================
  // TIMESTAMPS
  // ============================================================================

  withCreatedAt(date: Date): this {
    this.data.createdAt = date;
    return this;
  }

  withUpdatedAt(date: Date): this {
    this.data.updatedAt = date;
    return this;
  }

  createdToday(): this {
    this.data.createdAt = new Date();
    this.data.updatedAt = new Date();
    return this;
  }

  createdDaysAgo(days: number): this {
    const date = new Date();
    date.setDate(date.getDate() - days);
    this.data.createdAt = date;
    this.data.updatedAt = date;
    return this;
  }

  // ============================================================================
  // BUILD
  // ============================================================================

  build(): QuoteDetails {
    // Set defaults
    const defaults: QuoteDetails = {
      quoteName: 'Test Quote',
      facility: { type: 'medical_office', squareFootage: 50000, operatingHours: 12 },
      system: { powerMW: 2, durationHours: 4, capacityMWh: 8 },
      financials: {
        equipmentCost: 2400000,
        installationCost: 720000,
        totalCost: 3120000,
        annualSavings: 360000,
        paybackYears: 8.67,
        roi10Year: 115.4,
        roi25Year: 288.5
      },
      region: 'North America',
      electricityRate: 0.12,
      demandCharge: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return { ...defaults, ...this.data } as QuoteDetails;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  clone(): QuoteBuilder {
    const builder = new QuoteBuilder();
    builder.data = JSON.parse(JSON.stringify(this.data));
    return builder;
  }

  reset(): this {
    this.data = {};
    return this;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const createQuote = () => new QuoteBuilder();

export const smallCommercialQuote = () => new QuoteBuilder().smallCommercial().build();
export const mediumCommercialQuote = () => new QuoteBuilder().mediumCommercial().build();
export const largeCommercialQuote = () => new QuoteBuilder().largeCommercial().build();
export const industrialQuote = () => new QuoteBuilder().industrial().build();
export const hospitalQuote = () => new QuoteBuilder().hospitalWithSolar().build();
export const microgridQuote = () => new QuoteBuilder().offGridMicrogrid().build();
