/**
 * Generator Pricing Service
 * Based on Eaton Power Equipment quote for Cummins natural gas generators
 */

export interface GeneratorSpecification {
  id: string;
  model: string;
  manufacturer: string;
  fuelType: 'natural_gas' | 'diesel' | 'propane' | 'dual_fuel';
  ratedPowerKW: number;
  standbyPowerKW: number;
  engine: {
    model: string;
    displacement: number; // in liters
    cylinders: number;
    ratedSpeedRPM: number;
    fuelConsumption: number; // m³/kW·h for gas, L/h for diesel
  };
  alternator: {
    model: string;
    powerFactor: number;
    excitationType: string;
    insulationClass: string;
  };
  controller: {
    model: string;
    type: string;
    features: string[];
  };
  enclosure: 'open' | 'silent' | 'weather_proof' | 'container';
  basePrice: number;
  pricePerKW: number;
  vendor: {
    company: string;
    contact: string;
    location: string;
  };
}

export interface GeneratorPricingConfiguration {
  generators: GeneratorSpecification[];
  installationCosts: {
    baseInstallation: number;
    perKWInstallation: number;
    sitePreperation: number;
    electricalConnection: number;
    commissioning: number;
  };
  maintenanceCosts: {
    annualPerKW: number;
    majorOverhaulHours: number;
    majorOverhaulCostPerKW: number;
  };
  parallelConfiguration: {
    baseControlSystemCost: number;
    perGeneratorSynchronization: number;
    loadSharingCost: number;
  };
}

class GeneratorPricingService {
  private configuration: GeneratorPricingConfiguration;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): GeneratorPricingConfiguration {
    return {
      generators: [
        {
          id: 'cummins-6ltaa95-g260-200kw',
          model: 'Cummins 6LTAA9.5-G260',
          manufacturer: 'Cummins',
          fuelType: 'natural_gas',
          ratedPowerKW: 200,
          standbyPowerKW: 220,
          engine: {
            model: '6LTAA9.5-G260',
            displacement: 9.5,
            cylinders: 6,
            ratedSpeedRPM: 1500,
            fuelConsumption: 0.3 // m³/kW·h
          },
          alternator: {
            model: 'Stamford HCI444C1',
            powerFactor: 0.8,
            excitationType: 'Brushless',
            insulationClass: 'H'
          },
          controller: {
            model: 'Deepsea DSE8610',
            type: 'Digital',
            features: [
              'Auto start/stop',
              'Load management',
              'Parallel operation',
              'Remote monitoring',
              'Engine protection'
            ]
          },
          enclosure: 'silent',
          basePrice: 64200, // From Eaton quote
          pricePerKW: 321, // $64,200 / 200kW
          vendor: {
            company: 'Eaton Power & Equipments',
            contact: 'eaton@eatonpowerequipments.com',
            location: '645 NW Enterprise Dr Ste. 103, Port Saint Lucie, FL 34986'
          }
        },
        // Additional generator models with estimated pricing
        {
          id: 'cummins-diesel-250kw',
          model: 'Cummins QSL9-G7',
          manufacturer: 'Cummins',
          fuelType: 'diesel',
          ratedPowerKW: 250,
          standbyPowerKW: 275,
          engine: {
            model: 'QSL9-G7',
            displacement: 8.9,
            cylinders: 6,
            ratedSpeedRPM: 1800,
            fuelConsumption: 18.5 // L/h
          },
          alternator: {
            model: 'Stamford HCI544C',
            powerFactor: 0.8,
            excitationType: 'Brushless',
            insulationClass: 'H'
          },
          controller: {
            model: 'PowerCommand 3.3',
            type: 'Digital',
            features: [
              'Auto start/stop',
              'Load management',
              'Parallel operation',
              'Remote monitoring'
            ]
          },
          enclosure: 'silent',
          basePrice: 85000,
          pricePerKW: 340,
          vendor: {
            company: 'Eaton Power & Equipments',
            contact: 'eaton@eatonpowerequipments.com',
            location: '645 NW Enterprise Dr Ste. 103, Port Saint Lucie, FL 34986'
          }
        },
        {
          id: 'caterpillar-gas-500kw',
          model: 'Caterpillar CG132B-12',
          manufacturer: 'Caterpillar',
          fuelType: 'natural_gas',
          ratedPowerKW: 500,
          standbyPowerKW: 550,
          engine: {
            model: 'CG132B',
            displacement: 12.5,
            cylinders: 12,
            ratedSpeedRPM: 1800,
            fuelConsumption: 0.35
          },
          alternator: {
            model: 'SR4B',
            powerFactor: 0.8,
            excitationType: 'Brushless',
            insulationClass: 'H'
          },
          controller: {
            model: 'EMCP 4.4',
            type: 'Digital',
            features: [
              'Advanced engine protection',
              'Load management',
              'Parallel operation',
              'Remote monitoring',
              'Data logging'
            ]
          },
          enclosure: 'weather_proof',
          basePrice: 180000,
          pricePerKW: 360,
          vendor: {
            company: 'Caterpillar Power Generation',
            contact: 'power.generation@cat.com',
            location: 'Multiple Locations'
          }
        }
      ],
      installationCosts: {
        baseInstallation: 15000, // Base installation cost
        perKWInstallation: 150, // Additional cost per kW
        sitePreperation: 25000, // Site preparation and foundation
        electricalConnection: 20000, // Electrical connections and switchgear
        commissioning: 8000 // Testing and commissioning
      },
      maintenanceCosts: {
        annualPerKW: 45, // Annual maintenance cost per kW
        majorOverhaulHours: 12000, // Hours between major overhauls
        majorOverhaulCostPerKW: 250 // Cost per kW for major overhaul
      },
      parallelConfiguration: {
        baseControlSystemCost: 35000, // Base parallel control system
        perGeneratorSynchronization: 8000, // Cost per additional generator
        loadSharingCost: 12000 // Load sharing equipment
      }
    };
  }

  getGeneratorById(id: string): GeneratorSpecification | undefined {
    return this.configuration.generators.find(gen => gen.id === id);
  }

  getGeneratorsByPowerRange(minKW: number, maxKW: number): GeneratorSpecification[] {
    return this.configuration.generators.filter(
      gen => gen.ratedPowerKW >= minKW && gen.ratedPowerKW <= maxKW
    );
  }

  getGeneratorsByFuelType(fuelType: string): GeneratorSpecification[] {
    return this.configuration.generators.filter(gen => gen.fuelType === fuelType);
  }

  calculateGeneratorCost(
    generatorId: string, 
    quantity: number = 1, 
    includeInstallation: boolean = true,
    includeParallelOperation: boolean = false
  ): {
    generator: GeneratorSpecification | null;
    equipmentCost: number;
    installationCost: number;
    parallelCost: number;
    totalCost: number;
    breakdown: any;
  } {
    const generator = this.getGeneratorById(generatorId);
    
    if (!generator) {
      return {
        generator: null,
        equipmentCost: 0,
        installationCost: 0,
        parallelCost: 0,
        totalCost: 0,
        breakdown: {}
      };
    }

    const equipmentCost = generator.basePrice * quantity;
    
    let installationCost = 0;
    if (includeInstallation) {
      installationCost = 
        this.configuration.installationCosts.baseInstallation * quantity +
        this.configuration.installationCosts.perKWInstallation * generator.ratedPowerKW * quantity +
        this.configuration.installationCosts.sitePreperation +
        this.configuration.installationCosts.electricalConnection * quantity +
        this.configuration.installationCosts.commissioning * quantity;
    }

    let parallelCost = 0;
    if (includeParallelOperation && quantity > 1) {
      parallelCost = 
        this.configuration.parallelConfiguration.baseControlSystemCost +
        this.configuration.parallelConfiguration.perGeneratorSynchronization * (quantity - 1) +
        this.configuration.parallelConfiguration.loadSharingCost;
    }

    const totalCost = equipmentCost + installationCost + parallelCost;

    return {
      generator,
      equipmentCost,
      installationCost,
      parallelCost,
      totalCost,
      breakdown: {
        unitPrice: generator.basePrice,
        quantity,
        equipmentSubtotal: equipmentCost,
        installation: includeInstallation ? {
          base: this.configuration.installationCosts.baseInstallation * quantity,
          perKW: this.configuration.installationCosts.perKWInstallation * generator.ratedPowerKW * quantity,
          sitePrep: this.configuration.installationCosts.sitePreperation,
          electrical: this.configuration.installationCosts.electricalConnection * quantity,
          commissioning: this.configuration.installationCosts.commissioning * quantity,
          subtotal: installationCost
        } : null,
        parallel: includeParallelOperation && quantity > 1 ? {
          controlSystem: this.configuration.parallelConfiguration.baseControlSystemCost,
          synchronization: this.configuration.parallelConfiguration.perGeneratorSynchronization * (quantity - 1),
          loadSharing: this.configuration.parallelConfiguration.loadSharingCost,
          subtotal: parallelCost
        } : null
      }
    };
  }

  calculateAnnualOperatingCost(
    generatorId: string,
    operatingHours: number,
    fuelCostPerUnit: number, // $/m³ for gas, $/L for diesel
    quantity: number = 1
  ): {
    fuelCost: number;
    maintenanceCost: number;
    totalAnnualCost: number;
  } {
    const generator = this.getGeneratorById(generatorId);
    
    if (!generator) {
      return { fuelCost: 0, maintenanceCost: 0, totalAnnualCost: 0 };
    }

    const totalPowerKW = generator.ratedPowerKW * quantity;
    const fuelConsumptionPerHour = generator.engine.fuelConsumption * totalPowerKW;
    const annualFuelConsumption = fuelConsumptionPerHour * operatingHours;
    const fuelCost = annualFuelConsumption * fuelCostPerUnit;

    const maintenanceCost = this.configuration.maintenanceCosts.annualPerKW * totalPowerKW;

    return {
      fuelCost,
      maintenanceCost,
      totalAnnualCost: fuelCost + maintenanceCost
    };
  }

  updateConfiguration(newConfig: Partial<GeneratorPricingConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  getConfiguration(): GeneratorPricingConfiguration {
    return this.configuration;
  }

  // Get all generators with summary information
  getAllGenerators(): GeneratorSpecification[] {
    return this.configuration.generators;
  }

  // Get pricing summary for quick reference
  getPricingSummary() {
    return this.configuration.generators.map(gen => ({
      id: gen.id,
      model: gen.model,
      manufacturer: gen.manufacturer,
      powerKW: gen.ratedPowerKW,
      fuelType: gen.fuelType,
      pricePerKW: gen.pricePerKW,
      basePrice: gen.basePrice,
      vendor: gen.vendor.company
    }));
  }
}

export default new GeneratorPricingService();