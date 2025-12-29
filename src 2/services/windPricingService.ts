/**
 * Wind Power Pricing Service
 * Wind turbine and wind farm component pricing
 */

export interface WindTurbine {
  id: string;
  manufacturer: string;
  model: string;
  ratedPowerKW: number;
  rotorDiameterM: number;
  hubHeightM: number;
  cutInSpeedMS: number;
  ratedWindSpeedMS: number;
  cutOutSpeedMS: number;
  sweepAreaM2: number;
  generator: {
    type: string;
    ratedVoltage: number;
    frequency: number;
  };
  tower: {
    type: 'tubular_steel' | 'lattice' | 'concrete' | 'hybrid';
    height: number;
  };
  warranty: {
    turbine: number; // years
    gearbox: number; // years
    generator: number; // years
  };
  pricePerKW: number;
  totalPrice: number;
  vendor: {
    company: string;
    contact: string;
    location: string;
  };
}

export interface WindFarmComponents {
  id: string;
  component: 'transformer' | 'substation' | 'transmission' | 'roads' | 'crane_pads' | 'meteorological_tower';
  description: string;
  unitType: 'per_turbine' | 'per_mw' | 'per_km' | 'lump_sum';
  unitCost: number;
  installationMultiplier: number;
}

export interface WindPricingConfiguration {
  turbines: WindTurbine[];
  farmComponents: WindFarmComponents[];
  installationCosts: {
    foundation: number; // per turbine
    transportation: number; // per turbine
    craneAndErection: number; // per turbine
    electrical: number; // per turbine
    commissioning: number; // per turbine
  };
  developmentCosts: {
    windResourceAssessment: number; // per MW
    environmentalStudies: number; // per MW
    permitting: number; // per MW
    interconnectionStudy: number; // per MW
    projectDevelopment: number; // per MW
  };
  operationMaintenance: {
    annualPerKW: number;
    majorOverhaulYears: number;
    majorOverhaulCostPerKW: number;
    insurance: number; // per kW per year
    landLease: number; // per kW per year
  };
}

class WindPricingService {
  private configuration: WindPricingConfiguration;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): WindPricingConfiguration {
    return {
      turbines: [
        {
          id: 'ge-2-5-120',
          manufacturer: 'General Electric',
          model: '2.5-120',
          ratedPowerKW: 2500,
          rotorDiameterM: 120,
          hubHeightM: 85,
          cutInSpeedMS: 3.0,
          ratedWindSpeedMS: 12.0,
          cutOutSpeedMS: 25.0,
          sweepAreaM2: 11310,
          generator: {
            type: 'Doubly Fed Induction Generator',
            ratedVoltage: 690,
            frequency: 60
          },
          tower: {
            type: 'tubular_steel',
            height: 85
          },
          warranty: {
            turbine: 5,
            gearbox: 10,
            generator: 5
          },
          pricePerKW: 1200,
          totalPrice: 3000000,
          vendor: {
            company: 'GE Renewable Energy',
            contact: 'wind.sales@ge.com',
            location: 'Schenectady, NY'
          }
        },
        {
          id: 'vestas-v110-2000',
          manufacturer: 'Vestas',
          model: 'V110-2.0 MW',
          ratedPowerKW: 2000,
          rotorDiameterM: 110,
          hubHeightM: 80,
          cutInSpeedMS: 3.0,
          ratedWindSpeedMS: 13.0,
          cutOutSpeedMS: 25.0,
          sweepAreaM2: 9503,
          generator: {
            type: 'Permanent Magnet Synchronous',
            ratedVoltage: 690,
            frequency: 60
          },
          tower: {
            type: 'tubular_steel',
            height: 80
          },
          warranty: {
            turbine: 5,
            gearbox: 10,
            generator: 5
          },
          pricePerKW: 1150,
          totalPrice: 2300000,
          vendor: {
            company: 'Vestas Wind Systems',
            contact: 'sales@vestas.com',
            location: 'Portland, OR'
          }
        },
        {
          id: 'siemens-sg-2-6-114',
          manufacturer: 'Siemens Gamesa',
          model: 'SG 2.6-114',
          ratedPowerKW: 2625,
          rotorDiameterM: 114,
          hubHeightM: 90,
          cutInSpeedMS: 3.0,
          ratedWindSpeedMS: 13.0,
          cutOutSpeedMS: 25.0,
          sweepAreaM2: 10200,
          generator: {
            type: 'Permanent Magnet Synchronous',
            ratedVoltage: 690,
            frequency: 60
          },
          tower: {
            type: 'tubular_steel',
            height: 90
          },
          warranty: {
            turbine: 5,
            gearbox: 10,
            generator: 5
          },
          pricePerKW: 1180,
          totalPrice: 3097500,
          vendor: {
            company: 'Siemens Gamesa Renewable Energy',
            contact: 'sales@siemensgamesa.com',
            location: 'Orlando, FL'
          }
        },
        {
          id: 'nordex-n117-2400',
          manufacturer: 'Nordex',
          model: 'N117/2400',
          ratedPowerKW: 2400,
          rotorDiameterM: 117,
          hubHeightM: 91,
          cutInSpeedMS: 3.0,
          ratedWindSpeedMS: 13.0,
          cutOutSpeedMS: 25.0,
          sweepAreaM2: 10752,
          generator: {
            type: 'Permanent Magnet Synchronous',
            ratedVoltage: 690,
            frequency: 60
          },
          tower: {
            type: 'tubular_steel',
            height: 91
          },
          warranty: {
            turbine: 5,
            gearbox: 10,
            generator: 5
          },
          pricePerKW: 1220,
          totalPrice: 2928000,
          vendor: {
            company: 'Nordex USA Inc.',
            contact: 'sales@nordex-online.com',
            location: 'Chicago, IL'
          }
        },
        {
          id: 'goldwind-gw-2500-116',
          manufacturer: 'Goldwind',
          model: 'GW 2.5S-116',
          ratedPowerKW: 2500,
          rotorDiameterM: 116,
          hubHeightM: 86,
          cutInSpeedMS: 3.0,
          ratedWindSpeedMS: 12.5,
          cutOutSpeedMS: 25.0,
          sweepAreaM2: 10568,
          generator: {
            type: 'Permanent Magnet Direct Drive',
            ratedVoltage: 690,
            frequency: 60
          },
          tower: {
            type: 'tubular_steel',
            height: 86
          },
          warranty: {
            turbine: 5,
            gearbox: 0, // Direct drive - no gearbox
            generator: 10
          },
          pricePerKW: 1160,
          totalPrice: 2900000,
          vendor: {
            company: 'Goldwind Americas',
            contact: 'sales@goldwindamericas.com',
            location: 'Chicago, IL'
          }
        }
      ],
      farmComponents: [
        {
          id: 'step-up-transformer',
          component: 'transformer',
          description: '34.5kV Step-up Transformer',
          unitType: 'per_turbine',
          unitCost: 85000,
          installationMultiplier: 1.3
        },
        {
          id: 'collection-substation',
          component: 'substation',
          description: 'Collection Substation (34.5kV to 138kV)',
          unitType: 'per_mw',
          unitCost: 120000,
          installationMultiplier: 1.4
        },
        {
          id: 'transmission-line',
          component: 'transmission',
          description: '138kV Transmission Line',
          unitType: 'per_km',
          unitCost: 850000,
          installationMultiplier: 1.2
        },
        {
          id: 'access-roads',
          component: 'roads',
          description: 'Access Roads and Turbine Pads',
          unitType: 'per_turbine',
          unitCost: 65000,
          installationMultiplier: 1.1
        },
        {
          id: 'crane-pads',
          component: 'crane_pads',
          description: 'Crane Pads and Staging Areas',
          unitType: 'per_turbine',
          unitCost: 45000,
          installationMultiplier: 1.0
        },
        {
          id: 'meteorological-tower',
          component: 'meteorological_tower',
          description: 'Meteorological Tower and Monitoring',
          unitType: 'lump_sum',
          unitCost: 150000,
          installationMultiplier: 1.2
        }
      ],
      installationCosts: {
        foundation: 285000, // per turbine
        transportation: 125000, // per turbine
        craneAndErection: 195000, // per turbine
        electrical: 85000, // per turbine
        commissioning: 45000 // per turbine
      },
      developmentCosts: {
        windResourceAssessment: 85000, // per MW
        environmentalStudies: 65000, // per MW
        permitting: 45000, // per MW
        interconnectionStudy: 35000, // per MW
        projectDevelopment: 125000 // per MW
      },
      operationMaintenance: {
        annualPerKW: 45,
        majorOverhaulYears: 12,
        majorOverhaulCostPerKW: 285,
        insurance: 8, // per kW per year
        landLease: 12 // per kW per year
      }
    };
  }

  calculateWindFarmCost(
    turbineId: string,
    numberOfTurbines: number,
    transmissionDistanceKm: number = 0,
    includeDevelopment: boolean = true,
    includeTransmission: boolean = true
  ): {
    turbine: WindTurbine | null;
    totalCapacityMW: number;
    equipmentCost: number;
    installationCost: number;
    infrastructureCost: number;
    developmentCost: number;
    transmissionCost: number;
    totalCost: number;
    costPerKW: number;
    breakdown: any;
  } {
    const turbine = this.configuration.turbines.find(t => t.id === turbineId);
    
    if (!turbine) {
      return {
        turbine: null,
        totalCapacityMW: 0,
        equipmentCost: 0,
        installationCost: 0,
        infrastructureCost: 0,
        developmentCost: 0,
        transmissionCost: 0,
        totalCost: 0,
        costPerKW: 0,
        breakdown: {}
      };
    }

    const totalCapacityKW = turbine.ratedPowerKW * numberOfTurbines;
    const totalCapacityMW = totalCapacityKW / 1000;

    // Equipment costs
    const equipmentCost = turbine.totalPrice * numberOfTurbines;

    // Installation costs
    const installationCost = Object.values(this.configuration.installationCosts)
      .reduce((sum, cost) => sum + (cost * numberOfTurbines), 0);

    // Infrastructure costs
    const stepUpTransformerCost = this.getComponentCost('step-up-transformer', numberOfTurbines);
    const substationCost = this.getComponentCost('collection-substation', totalCapacityMW);
    const roadsCost = this.getComponentCost('access-roads', numberOfTurbines);
    const cranePadsCost = this.getComponentCost('crane-pads', numberOfTurbines);
    const metTowerCost = this.getComponentCost('meteorological-tower', 1);

    const infrastructureCost = stepUpTransformerCost + substationCost + roadsCost + cranePadsCost + metTowerCost;

    // Development costs
    let developmentCost = 0;
    if (includeDevelopment) {
      developmentCost = Object.values(this.configuration.developmentCosts)
        .reduce((sum, costPerMW) => sum + (costPerMW * totalCapacityMW), 0);
    }

    // Transmission costs
    let transmissionCost = 0;
    if (includeTransmission && transmissionDistanceKm > 0) {
      transmissionCost = this.getComponentCost('transmission-line', transmissionDistanceKm);
    }

    const totalCost = equipmentCost + installationCost + infrastructureCost + developmentCost + transmissionCost;
    const costPerKW = totalCost / totalCapacityKW;

    return {
      turbine,
      totalCapacityMW,
      equipmentCost,
      installationCost,
      infrastructureCost,
      developmentCost,
      transmissionCost,
      totalCost,
      costPerKW,
      breakdown: {
        equipment: {
          turbinePrice: turbine.totalPrice,
          quantity: numberOfTurbines,
          subtotal: equipmentCost
        },
        installation: {
          foundation: this.configuration.installationCosts.foundation * numberOfTurbines,
          transportation: this.configuration.installationCosts.transportation * numberOfTurbines,
          craneAndErection: this.configuration.installationCosts.craneAndErection * numberOfTurbines,
          electrical: this.configuration.installationCosts.electrical * numberOfTurbines,
          commissioning: this.configuration.installationCosts.commissioning * numberOfTurbines,
          subtotal: installationCost
        },
        infrastructure: {
          stepUpTransformers: stepUpTransformerCost,
          collectionSubstation: substationCost,
          accessRoads: roadsCost,
          cranePads: cranePadsCost,
          meteorologicalTower: metTowerCost,
          subtotal: infrastructureCost
        },
        development: includeDevelopment ? {
          windResourceAssessment: this.configuration.developmentCosts.windResourceAssessment * totalCapacityMW,
          environmentalStudies: this.configuration.developmentCosts.environmentalStudies * totalCapacityMW,
          permitting: this.configuration.developmentCosts.permitting * totalCapacityMW,
          interconnectionStudy: this.configuration.developmentCosts.interconnectionStudy * totalCapacityMW,
          projectDevelopment: this.configuration.developmentCosts.projectDevelopment * totalCapacityMW,
          subtotal: developmentCost
        } : null,
        transmission: includeTransmission && transmissionDistanceKm > 0 ? {
          distanceKm: transmissionDistanceKm,
          costPerKm: this.getComponent('transmission-line')?.unitCost || 0,
          subtotal: transmissionCost
        } : null
      }
    };
  }

  private getComponentCost(componentId: string, quantity: number): number {
    const component = this.configuration.farmComponents.find(c => c.id === componentId);
    if (!component) return 0;

    return component.unitCost * component.installationMultiplier * quantity;
  }

  private getComponent(componentId: string): WindFarmComponents | undefined {
    return this.configuration.farmComponents.find(c => c.id === componentId);
  }

  calculateAnnualProduction(
    turbineId: string,
    numberOfTurbines: number,
    averageWindSpeedMS: number
  ): {
    annualMWh: number;
    capacityFactor: number;
    grossAnnualMWh: number;
    netAnnualMWh: number;
  } {
    const turbine = this.configuration.turbines.find(t => t.id === turbineId);
    
    if (!turbine) {
      return { annualMWh: 0, capacityFactor: 0, grossAnnualMWh: 0, netAnnualMWh: 0 };
    }

    // Simplified power curve calculation
    let capacityFactor = 0;
    if (averageWindSpeedMS < turbine.cutInSpeedMS) {
      capacityFactor = 0;
    } else if (averageWindSpeedMS >= turbine.ratedWindSpeedMS) {
      capacityFactor = 0.40; // Typical for good wind sites
    } else {
      // Linear interpolation between cut-in and rated wind speeds
      const windRatio = (averageWindSpeedMS - turbine.cutInSpeedMS) / 
                       (turbine.ratedWindSpeedMS - turbine.cutInSpeedMS);
      capacityFactor = windRatio * 0.40;
    }

    const totalCapacityMW = (turbine.ratedPowerKW * numberOfTurbines) / 1000;
    const grossAnnualMWh = totalCapacityMW * 8760 * capacityFactor;
    
    // Account for losses (wake losses, electrical losses, availability)
    const lossesMultiplier = 0.85; // 15% total losses
    const netAnnualMWh = grossAnnualMWh * lossesMultiplier;

    return {
      annualMWh: Math.round(netAnnualMWh),
      capacityFactor: Math.round(capacityFactor * 100 * lossesMultiplier) / 100,
      grossAnnualMWh: Math.round(grossAnnualMWh),
      netAnnualMWh: Math.round(netAnnualMWh)
    };
  }

  calculateAnnualOperatingCost(
    turbineId: string,
    numberOfTurbines: number
  ): {
    operationMaintenance: number;
    insurance: number;
    landLease: number;
    totalAnnualCost: number;
  } {
    const turbine = this.configuration.turbines.find(t => t.id === turbineId);
    
    if (!turbine) {
      return { operationMaintenance: 0, insurance: 0, landLease: 0, totalAnnualCost: 0 };
    }

    const totalCapacityKW = turbine.ratedPowerKW * numberOfTurbines;
    
    const operationMaintenance = this.configuration.operationMaintenance.annualPerKW * totalCapacityKW;
    const insurance = this.configuration.operationMaintenance.insurance * totalCapacityKW;
    const landLease = this.configuration.operationMaintenance.landLease * totalCapacityKW;
    
    const totalAnnualCost = operationMaintenance + insurance + landLease;

    return {
      operationMaintenance,
      insurance,
      landLease,
      totalAnnualCost
    };
  }

  getTurbinesByPowerRange(minKW: number, maxKW: number): WindTurbine[] {
    return this.configuration.turbines.filter(
      turbine => turbine.ratedPowerKW >= minKW && turbine.ratedPowerKW <= maxKW
    );
  }

  getTurbinesByManufacturer(manufacturer: string): WindTurbine[] {
    return this.configuration.turbines.filter(
      turbine => turbine.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
    );
  }

  getConfiguration(): WindPricingConfiguration {
    return this.configuration;
  }

  updateConfiguration(newConfig: Partial<WindPricingConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  getPricingSummary() {
    return {
      turbines: this.configuration.turbines.map(turbine => ({
        id: turbine.id,
        manufacturer: turbine.manufacturer,
        model: turbine.model,
        powerKW: turbine.ratedPowerKW,
        rotorDiameterM: turbine.rotorDiameterM,
        hubHeightM: turbine.hubHeightM,
        pricePerKW: turbine.pricePerKW,
        totalPrice: turbine.totalPrice
      })),
      components: this.configuration.farmComponents.map(component => ({
        id: component.id,
        component: component.component,
        description: component.description,
        unitType: component.unitType,
        unitCost: component.unitCost
      }))
    };
  }
}

export default new WindPricingService();