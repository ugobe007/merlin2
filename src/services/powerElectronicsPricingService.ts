/**
 * Power Electronics Pricing Service
 * Inverters, transformers, switchgear, and power conditioning equipment
 */

export interface PowerInverter {
  id: string;
  manufacturer: string;
  model: string;
  type: 'grid_tie' | 'battery' | 'hybrid' | 'utility_scale' | 'microinverter';
  powerRatingKW: number;
  inputVoltage: {
    min: number;
    max: number;
    nominal: number;
  };
  outputVoltage: {
    nominal: number;
    phases: number;
  };
  efficiency: number; // %
  features: string[];
  certifications: string[];
  warranty: number; // years
  pricePerKW: number;
  pricePerUnit: number;
  vendor: {
    company: string;
    contact: string;
    location: string;
  };
}

export interface Transformer {
  id: string;
  manufacturer: string;
  model: string;
  type: 'step_up' | 'step_down' | 'isolation' | 'auto';
  primaryVoltage: number;
  secondaryVoltage: number;
  powerRatingKVA: number;
  phases: number;
  cooling: 'ONAN' | 'ONAF' | 'OFAF' | 'dry';
  efficiency: number; // %
  impedance: number; // %
  warranty: number; // years
  pricePerKVA: number;
  pricePerUnit: number;
  vendor: {
    company: string;
    contact: string;
  };
}

export interface Switchgear {
  id: string;
  manufacturer: string;
  model: string;
  type: 'medium_voltage' | 'low_voltage' | 'high_voltage';
  voltageRating: number;
  currentRating: number;
  interruptingCapacity: number; // kA
  busConfiguration: string;
  protectionFeatures: string[];
  communicationProtocols: string[];
  warranty: number; // years
  pricePerPosition: number;
  basePrice: number;
  vendor: {
    company: string;
    contact: string;
  };
}

export interface PowerConditioner {
  id: string;
  manufacturer: string;
  model: string;
  type: 'harmonic_filter' | 'power_factor_correction' | 'voltage_regulator' | 'ups' | 'battery_inverter';
  powerRatingKVA: number;
  inputVoltage: number;
  outputVoltage: number;
  efficiency: number; // %
  features: string[];
  warranty: number; // years
  pricePerKVA: number;
  pricePerUnit: number;
  vendor: {
    company: string;
    contact: string;
  };
}

export interface PowerElectronicsPricingConfiguration {
  inverters: PowerInverter[];
  transformers: Transformer[];
  switchgear: Switchgear[];
  powerConditioners: PowerConditioner[];
  installationCosts: {
    inverterInstallationPerKW: number;
    transformerInstallationPerKVA: number;
    switchgearInstallationPerPosition: number;
    conditionerInstallationPerKVA: number;
    electricalLaborRate: number; // per hour
    commissioning: number; // lump sum per project
  };
  additionalComponents: {
    cabling: number; // per kW
    protection: number; // per kW
    grounding: number; // per kW
    monitoring: number; // per kW
  };
}

class PowerElectronicsPricingService {
  private configuration: PowerElectronicsPricingConfiguration;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): PowerElectronicsPricingConfiguration {
    return {
      inverters: [
        {
          id: 'abb-pvi-central-1000',
          manufacturer: 'ABB',
          model: 'PVS980-Central-1000',
          type: 'utility_scale',
          powerRatingKW: 1000,
          inputVoltage: {
            min: 580,
            max: 1500,
            nominal: 1000
          },
          outputVoltage: {
            nominal: 315,
            phases: 3
          },
          efficiency: 98.8,
          features: [
            'MPPT tracking',
            'Arc fault detection',
            'Grid support functions',
            'Remote monitoring',
            'Liquid cooling'
          ],
          certifications: ['UL 1741', 'IEEE 1547', 'IEC 62109'],
          warranty: 10,
          pricePerKW: 185,
          pricePerUnit: 185000,
          vendor: {
            company: 'ABB Inc.',
            contact: 'solar@abb.com',
            location: 'Cary, NC'
          }
        },
        {
          id: 'schneider-conext-core',
          manufacturer: 'Schneider Electric',
          model: 'Conext Core XC 580kW',
          type: 'utility_scale',
          powerRatingKW: 580,
          inputVoltage: {
            min: 600,
            max: 1500,
            nominal: 1000
          },
          outputVoltage: {
            nominal: 315,
            phases: 3
          },
          efficiency: 98.5,
          features: [
            'Advanced MPPT',
            'Plant controller integration',
            'Reactive power control',
            'Power factor control',
            'Weather resistant'
          ],
          certifications: ['UL 1741', 'IEEE 1547', 'IEC 62109'],
          warranty: 10,
          pricePerKW: 195,
          pricePerUnit: 113100,
          vendor: {
            company: 'Schneider Electric',
            contact: 'solar.sales@schneider-electric.com',
            location: 'Boston, MA'
          }
        },
        {
          id: 'tesla-megapack-inverter',
          manufacturer: 'Tesla',
          model: 'Megapack Inverter',
          type: 'battery',
          powerRatingKW: 1000,
          inputVoltage: {
            min: 450,
            max: 800,
            nominal: 630
          },
          outputVoltage: {
            nominal: 480,
            phases: 3
          },
          efficiency: 97.5,
          features: [
            'Bi-directional power flow',
            'Grid forming capability',
            'Fast response time',
            'Integrated cooling',
            'Tesla software integration'
          ],
          certifications: ['UL 1741', 'IEEE 1547'],
          warranty: 10,
          pricePerKW: 220,
          pricePerUnit: 220000,
          vendor: {
            company: 'Tesla Energy',
            contact: 'energy@tesla.com',
            location: 'Austin, TX'
          }
        }
      ],
      transformers: [
        {
          id: 'abb-cast-resin-1000',
          manufacturer: 'ABB',
          model: 'Cast Resin 1000kVA',
          type: 'step_up',
          primaryVoltage: 480,
          secondaryVoltage: 4160,
          powerRatingKVA: 1000,
          phases: 3,
          cooling: 'dry',
          efficiency: 99.2,
          impedance: 6.5,
          warranty: 10,
          pricePerKVA: 145,
          pricePerUnit: 145000,
          vendor: {
            company: 'ABB Inc.',
            contact: 'transformers@abb.com'
          }
        },
        {
          id: 'ge-prolec-oil-filled-2500',
          manufacturer: 'GE Prolec',
          model: 'Oil-filled 2500kVA',
          type: 'step_up',
          primaryVoltage: 4160,
          secondaryVoltage: 13800,
          powerRatingKVA: 2500,
          phases: 3,
          cooling: 'ONAN',
          efficiency: 99.5,
          impedance: 7.2,
          warranty: 15,
          pricePerKVA: 125,
          pricePerUnit: 312500,
          vendor: {
            company: 'GE Prolec',
            contact: 'sales@geprolec.com'
          }
        },
        {
          id: 'eaton-cooper-padmount-1500',
          manufacturer: 'Eaton Cooper Power',
          model: 'Padmount 1500kVA',
          type: 'step_down',
          primaryVoltage: 13800,
          secondaryVoltage: 480,
          powerRatingKVA: 1500,
          phases: 3,
          cooling: 'ONAN',
          efficiency: 99.0,
          impedance: 5.8,
          warranty: 12,
          pricePerKVA: 135,
          pricePerUnit: 202500,
          vendor: {
            company: 'Eaton Corporation',
            contact: 'power@eaton.com'
          }
        }
      ],
      switchgear: [
        {
          id: 'abb-unigear-zs3-2',
          manufacturer: 'ABB',
          model: 'UniGear ZS3.2',
          type: 'medium_voltage',
          voltageRating: 24000,
          currentRating: 2000,
          interruptingCapacity: 31.5,
          busConfiguration: 'Single Bus',
          protectionFeatures: [
            'Arc flash protection',
            'Ground fault protection',
            'Overcurrent protection',
            'Differential protection'
          ],
          communicationProtocols: ['Modbus', 'DNP3', 'IEC 61850'],
          warranty: 10,
          pricePerPosition: 45000,
          basePrice: 180000,
          vendor: {
            company: 'ABB Inc.',
            contact: 'switchgear@abb.com'
          }
        },
        {
          id: 'schneider-sm6-24kv',
          manufacturer: 'Schneider Electric',
          model: 'SM6 24kV',
          type: 'medium_voltage',
          voltageRating: 24000,
          currentRating: 1250,
          interruptingCapacity: 25,
          busConfiguration: 'Single Bus',
          protectionFeatures: [
            'SF6 insulation',
            'Compact design',
            'Remote operation',
            'Maintenance free'
          ],
          communicationProtocols: ['Modbus', 'IEC 61850'],
          warranty: 8,
          pricePerPosition: 38000,
          basePrice: 152000,
          vendor: {
            company: 'Schneider Electric',
            contact: 'medium.voltage@schneider-electric.com'
          }
        },
        {
          id: 'ge-metalclad-15kv',
          manufacturer: 'General Electric',
          model: 'Metalclad 15kV',
          type: 'medium_voltage',
          voltageRating: 15000,
          currentRating: 3000,
          interruptingCapacity: 40,
          busConfiguration: 'Double Bus',
          protectionFeatures: [
            'Vacuum breakers',
            'Motor operators',
            'Digital protection',
            'Arc resistant design'
          ],
          communicationProtocols: ['DNP3', 'Modbus', 'IEC 61850'],
          warranty: 12,
          pricePerPosition: 52000,
          basePrice: 208000,
          vendor: {
            company: 'GE Grid Solutions',
            contact: 'grid.solutions@ge.com'
          }
        }
      ],
      powerConditioners: [
        {
          id: 'abb-pqfi-harmonic-filter',
          manufacturer: 'ABB',
          model: 'PQFi Harmonic Filter',
          type: 'harmonic_filter',
          powerRatingKVA: 500,
          inputVoltage: 480,
          outputVoltage: 480,
          efficiency: 99.5,
          features: [
            'THD reduction to <5%',
            'Dynamic response',
            'Compact design',
            'Remote monitoring'
          ],
          warranty: 10,
          pricePerKVA: 285,
          pricePerUnit: 142500,
          vendor: {
            company: 'ABB Inc.',
            contact: 'power.quality@abb.com'
          }
        },
        {
          id: 'schneider-masterpact-ups',
          manufacturer: 'Schneider Electric',
          model: 'Galaxy VX UPS',
          type: 'ups',
          powerRatingKVA: 1000,
          inputVoltage: 480,
          outputVoltage: 480,
          efficiency: 96.5,
          features: [
            'Online double conversion',
            'Hot swappable modules',
            'Energy saver mode',
            'Advanced battery management'
          ],
          warranty: 5,
          pricePerKVA: 425,
          pricePerUnit: 425000,
          vendor: {
            company: 'Schneider Electric',
            contact: 'ups@schneider-electric.com'
          }
        },
        {
          id: 'eaton-power-factor-correction',
          manufacturer: 'Eaton',
          model: 'PFC Capacitor Bank',
          type: 'power_factor_correction',
          powerRatingKVA: 300,
          inputVoltage: 480,
          outputVoltage: 480,
          efficiency: 99.8,
          features: [
            'Automatic control',
            'Detuned design',
            'Contactors and fuses',
            'Power factor monitoring'
          ],
          warranty: 8,
          pricePerKVA: 165,
          pricePerUnit: 49500,
          vendor: {
            company: 'Eaton Corporation',
            contact: 'power.factor@eaton.com'
          }
        }
      ],
      installationCosts: {
        inverterInstallationPerKW: 85,
        transformerInstallationPerKVA: 35,
        switchgearInstallationPerPosition: 12000,
        conditionerInstallationPerKVA: 45,
        electricalLaborRate: 125, // per hour
        commissioning: 25000 // per project
      },
      additionalComponents: {
        cabling: 95, // per kW
        protection: 65, // per kW
        grounding: 35, // per kW
        monitoring: 55 // per kW
      }
    };
  }

  calculateInverterSystemCost(
    inverterId: string,
    systemPowerKW: number,
    includeInstallation: boolean = true
  ): {
    inverter: PowerInverter | null;
    quantity: number;
    equipmentCost: number;
    installationCost: number;
    additionalCost: number;
    totalCost: number;
    costPerKW: number;
    breakdown: any;
  } {
    const inverter = this.configuration.inverters.find(inv => inv.id === inverterId);
    
    if (!inverter) {
      return {
        inverter: null,
        quantity: 0,
        equipmentCost: 0,
        installationCost: 0,
        additionalCost: 0,
        totalCost: 0,
        costPerKW: 0,
        breakdown: {}
      };
    }

    const quantity = Math.ceil(systemPowerKW / inverter.powerRatingKW);
    const actualPowerKW = quantity * inverter.powerRatingKW;

    const equipmentCost = quantity * inverter.pricePerUnit;

    let installationCost = 0;
    if (includeInstallation) {
      installationCost = this.configuration.installationCosts.inverterInstallationPerKW * actualPowerKW;
    }

    const additionalCost = Object.values(this.configuration.additionalComponents)
      .reduce((sum, costPerKW) => sum + (costPerKW * actualPowerKW), 0);

    const totalCost = equipmentCost + installationCost + additionalCost;
    const costPerKW = totalCost / actualPowerKW;

    return {
      inverter,
      quantity,
      equipmentCost,
      installationCost,
      additionalCost,
      totalCost,
      costPerKW,
      breakdown: {
        equipment: {
          inverterModel: inverter.model,
          pricePerUnit: inverter.pricePerUnit,
          quantity,
          subtotal: equipmentCost
        },
        installation: includeInstallation ? {
          laborPerKW: this.configuration.installationCosts.inverterInstallationPerKW,
          systemPowerKW: actualPowerKW,
          subtotal: installationCost
        } : null,
        additionalComponents: {
          cabling: this.configuration.additionalComponents.cabling * actualPowerKW,
          protection: this.configuration.additionalComponents.protection * actualPowerKW,
          grounding: this.configuration.additionalComponents.grounding * actualPowerKW,
          monitoring: this.configuration.additionalComponents.monitoring * actualPowerKW,
          subtotal: additionalCost
        }
      }
    };
  }

  calculateTransformerCost(
    transformerId: string,
    quantity: number = 1,
    includeInstallation: boolean = true
  ): {
    transformer: Transformer | null;
    equipmentCost: number;
    installationCost: number;
    totalCost: number;
    breakdown: any;
  } {
    const transformer = this.configuration.transformers.find(t => t.id === transformerId);
    
    if (!transformer) {
      return {
        transformer: null,
        equipmentCost: 0,
        installationCost: 0,
        totalCost: 0,
        breakdown: {}
      };
    }

    const equipmentCost = transformer.pricePerUnit * quantity;
    const totalKVA = transformer.powerRatingKVA * quantity;

    let installationCost = 0;
    if (includeInstallation) {
      installationCost = this.configuration.installationCosts.transformerInstallationPerKVA * totalKVA;
    }

    const totalCost = equipmentCost + installationCost;

    return {
      transformer,
      equipmentCost,
      installationCost,
      totalCost,
      breakdown: {
        equipment: {
          model: transformer.model,
          pricePerUnit: transformer.pricePerUnit,
          quantity,
          subtotal: equipmentCost
        },
        installation: includeInstallation ? {
          installationPerKVA: this.configuration.installationCosts.transformerInstallationPerKVA,
          totalKVA,
          subtotal: installationCost
        } : null
      }
    };
  }

  calculateSwitchgearCost(
    switchgearId: string,
    numberOfPositions: number,
    includeInstallation: boolean = true
  ): {
    switchgear: Switchgear | null;
    equipmentCost: number;
    installationCost: number;
    totalCost: number;
    breakdown: any;
  } {
    const switchgear = this.configuration.switchgear.find(sg => sg.id === switchgearId);
    
    if (!switchgear) {
      return {
        switchgear: null,
        equipmentCost: 0,
        installationCost: 0,
        totalCost: 0,
        breakdown: {}
      };
    }

    const equipmentCost = switchgear.basePrice + (switchgear.pricePerPosition * numberOfPositions);

    let installationCost = 0;
    if (includeInstallation) {
      installationCost = this.configuration.installationCosts.switchgearInstallationPerPosition * numberOfPositions;
    }

    const totalCost = equipmentCost + installationCost;

    return {
      switchgear,
      equipmentCost,
      installationCost,
      totalCost,
      breakdown: {
        equipment: {
          model: switchgear.model,
          basePrice: switchgear.basePrice,
          pricePerPosition: switchgear.pricePerPosition,
          numberOfPositions,
          subtotal: equipmentCost
        },
        installation: includeInstallation ? {
          installationPerPosition: this.configuration.installationCosts.switchgearInstallationPerPosition,
          numberOfPositions,
          subtotal: installationCost
        } : null
      }
    };
  }

  getInvertersByType(type: string): PowerInverter[] {
    return this.configuration.inverters.filter(inverter => inverter.type === type);
  }

  getTransformersByType(type: string): Transformer[] {
    return this.configuration.transformers.filter(transformer => transformer.type === type);
  }

  getSwitchgearByVoltage(minVoltage: number, maxVoltage: number): Switchgear[] {
    return this.configuration.switchgear.filter(
      sg => sg.voltageRating >= minVoltage && sg.voltageRating <= maxVoltage
    );
  }

  getConfiguration(): PowerElectronicsPricingConfiguration {
    return this.configuration;
  }

  updateConfiguration(newConfig: Partial<PowerElectronicsPricingConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  getPricingSummary() {
    return {
      inverters: this.configuration.inverters.map(inv => ({
        id: inv.id,
        manufacturer: inv.manufacturer,
        model: inv.model,
        type: inv.type,
        powerKW: inv.powerRatingKW,
        efficiency: inv.efficiency,
        pricePerKW: inv.pricePerKW,
        pricePerUnit: inv.pricePerUnit
      })),
      transformers: this.configuration.transformers.map(trans => ({
        id: trans.id,
        manufacturer: trans.manufacturer,
        model: trans.model,
        type: trans.type,
        powerKVA: trans.powerRatingKVA,
        pricePerKVA: trans.pricePerKVA,
        pricePerUnit: trans.pricePerUnit
      })),
      switchgear: this.configuration.switchgear.map(sg => ({
        id: sg.id,
        manufacturer: sg.manufacturer,
        model: sg.model,
        type: sg.type,
        voltageRating: sg.voltageRating,
        currentRating: sg.currentRating,
        pricePerPosition: sg.pricePerPosition,
        basePrice: sg.basePrice
      }))
    };
  }
}

export default new PowerElectronicsPricingService();