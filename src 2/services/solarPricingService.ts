/**
 * Solar Pricing Service
 * Comprehensive solar panel, inverter, and mounting system pricing
 */

export interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  technology: 'monocrystalline' | 'polycrystalline' | 'thin_film' | 'bifacial';
  powerRatingW: number;
  efficiency: number; // %
  voltage: number;
  current: number;
  dimensions: {
    length: number; // mm
    width: number; // mm
    thickness: number; // mm
  };
  weight: number; // kg
  warranty: {
    product: number; // years
    performance: number; // years
    degradation: number; // % per year
  };
  pricePerWatt: number;
  pricePerPanel: number;
  vendor: {
    company: string;
    contact: string;
    location: string;
  };
}

export interface SolarInverter {
  id: string;
  manufacturer: string;
  model: string;
  type: 'string' | 'power_optimizer' | 'microinverter' | 'central';
  powerRatingW: number;
  inputChannels: number;
  efficiency: number; // %
  features: string[];
  warranty: number; // years
  pricePerWatt: number;
  pricePerUnit: number;
  vendor: {
    company: string;
    contact: string;
  };
}

export interface MountingSystem {
  id: string;
  manufacturer: string;
  model: string;
  type: 'roof_mounted' | 'ground_mounted' | 'carport' | 'tracker';
  material: string;
  panelsPerStructure: number;
  warranty: number; // years
  pricePerPanel: number;
  installationComplexity: 'low' | 'medium' | 'high';
  vendor: {
    company: string;
    contact: string;
  };
}

export interface SolarPricingConfiguration {
  panels: SolarPanel[];
  inverters: SolarInverter[];
  mountingSystems: MountingSystem[];
  installationCosts: {
    designAndPermitting: number; // per kW
    laborPerKW: number;
    electricalBOS: number; // per kW (balance of system)
    monitoring: number; // per kW
    commissioning: number; // per kW
  };
  additionalComponents: {
    dcCabling: number; // per kW
    acCabling: number; // per kW
    combinerBox: number; // per kW
    disconnects: number; // per kW
    grounding: number; // per kW
    conduit: number; // per kW
  };
  operationMaintenance: {
    annualPerKW: number;
    inverterReplacementCycle: number; // years
    cleaningPerKW: number; // annual
    monitoringPerKW: number; // annual
  };
}

class SolarPricingService {
  private configuration: SolarPricingConfiguration;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): SolarPricingConfiguration {
    return {
      panels: [
        {
          id: 'jinko-tiger-pro-540w',
          manufacturer: 'Jinko Solar',
          model: 'Tiger Pro JKM540M-7RL3',
          technology: 'monocrystalline',
          powerRatingW: 540,
          efficiency: 20.9,
          voltage: 49.5,
          current: 10.91,
          dimensions: {
            length: 2274,
            width: 1134,
            thickness: 30
          },
          weight: 27.5,
          warranty: {
            product: 15,
            performance: 25,
            degradation: 0.4
          },
          pricePerWatt: 0.65, // CORRECTED: Updated to 2025 pricing for tier-1 panels
          pricePerPanel: 172.80,
          vendor: {
            company: 'Jinko Solar Authorized Distributor',
            contact: 'sales@jinkosolar.com',
            location: 'Multiple Locations'
          }
        },
        {
          id: 'canadian-solar-450w',
          manufacturer: 'Canadian Solar',
          model: 'CS3W-450P',
          technology: 'polycrystalline',
          powerRatingW: 450,
          efficiency: 19.2,
          voltage: 41.4,
          current: 10.87,
          dimensions: {
            length: 2108,
            width: 1048,
            thickness: 40
          },
          weight: 23.5,
          warranty: {
            product: 12,
            performance: 25,
            degradation: 0.5
          },
          pricePerWatt: 0.55, // CORRECTED: Updated to 2025 pricing for standard panels
          pricePerPanel: 126.00,
          vendor: {
            company: 'Canadian Solar',
            contact: 'sales@canadiansolar.com',
            location: 'Global Distribution'
          }
        },
        {
          id: 'first-solar-thin-film-420w',
          manufacturer: 'First Solar',
          model: 'Series 6 Plus',
          technology: 'thin_film',
          powerRatingW: 420,
          efficiency: 18.0,
          voltage: 88.9,
          current: 4.73,
          dimensions: {
            length: 2384,
            width: 1303,
            thickness: 4
          },
          weight: 31.8,
          warranty: {
            product: 10,
            performance: 25,
            degradation: 0.25
          },
          pricePerWatt: 0.70, // CORRECTED: Updated to 2025 pricing for bifacial panels
          pricePerPanel: 294.00, // CORRECTED: Updated panel price
          vendor: {
            company: 'First Solar',
            contact: 'commercial@firstsolar.com',
            location: 'Ohio, USA'
          }
        }
      ],
      inverters: [
        {
          id: 'sma-sunny-tripower-25000',
          manufacturer: 'SMA',
          model: 'Sunny Tripower 25000TL',
          type: 'string',
          powerRatingW: 25000,
          inputChannels: 6,
          efficiency: 98.1,
          features: [
            'Integrated DC combiner',
            'OptiTrac Global Peak',
            'Grid management',
            'Reactive power provision'
          ],
          warranty: 10,
          pricePerWatt: 0.30, // CORRECTED: Updated to 2025 pricing for string inverters
          pricePerUnit: 3750,
          vendor: {
            company: 'SMA Solar Technology',
            contact: 'sales@sma-america.com'
          }
        },
        {
          id: 'fronius-primo-15kw',
          manufacturer: 'Fronius',
          model: 'Primo 15.0-1',
          type: 'string',
          powerRatingW: 15000,
          inputChannels: 2,
          efficiency: 97.0,
          features: [
            'Dynamic Peak Manager',
            'Arc Fault Circuit Interrupter',
            'Rapid Shutdown',
            'WiFi monitoring'
          ],
          warranty: 10,
          pricePerWatt: 0.35, // CORRECTED: Updated to 2025 pricing for power optimizers
          pricePerUnit: 2700,
          vendor: {
            company: 'Fronius USA',
            contact: 'sales@fronius.com'
          }
        },
        {
          id: 'solaredge-power-optimizer',
          manufacturer: 'SolarEdge',
          model: 'SE7600H-US',
          type: 'power_optimizer',
          powerRatingW: 7600,
          inputChannels: 1,
          efficiency: 97.5,
          features: [
            'Module-level optimization',
            'Panel-level monitoring',
            'Safety features',
            'Rapid shutdown'
          ],
          warranty: 12,
          pricePerWatt: 0.45, // CORRECTED: Updated to 2025 pricing for microinverters
          pricePerUnit: 1672,
          vendor: {
            company: 'SolarEdge Technologies',
            contact: 'sales@solaredge.com'
          }
        },
        {
          id: 'enphase-microinverter',
          manufacturer: 'Enphase',
          model: 'IQ7PLUS-72-M-US',
          type: 'microinverter',
          powerRatingW: 290,
          inputChannels: 1,
          efficiency: 97.0,
          features: [
            'Per-panel optimization',
            'Individual panel monitoring',
            'Rapid shutdown',
            'Grid-tie capability'
          ],
          warranty: 15,
          pricePerWatt: 0.35,
          pricePerUnit: 101.50,
          vendor: {
            company: 'Enphase Energy',
            contact: 'sales@enphase.com'
          }
        }
      ],
      mountingSystems: [
        {
          id: 'ironridge-xr-roof',
          manufacturer: 'IronRidge',
          model: 'XR Rail System',
          type: 'roof_mounted',
          material: 'Aluminum',
          panelsPerStructure: 1,
          warranty: 25,
          pricePerPanel: 65,
          installationComplexity: 'low',
          vendor: {
            company: 'IronRidge',
            contact: 'sales@ironridge.com'
          }
        },
        {
          id: 'unirac-ground-mount',
          manufacturer: 'Unirac',
          model: 'RM Ground Mount',
          type: 'ground_mounted',
          material: 'Aluminum/Steel',
          panelsPerStructure: 10,
          warranty: 20,
          pricePerPanel: 85,
          installationComplexity: 'medium',
          vendor: {
            company: 'Unirac',
            contact: 'sales@unirac.com'
          }
        },
        {
          id: 'schletter-tracker',
          manufacturer: 'Schletter',
          model: 'FS Uno 2.0',
          type: 'tracker',
          material: 'Galvanized Steel',
          panelsPerStructure: 24,
          warranty: 20,
          pricePerPanel: 120,
          installationComplexity: 'high',
          vendor: {
            company: 'Schletter Inc.',
            contact: 'info@schletter.us'
          }
        }
      ],
      installationCosts: {
        // ⚠️ CRITICAL FIX: Updated to match EnergySage 2025 pricing ($2.50-4.00/W installed)
        // Current market pricing breakdown for residential/commercial solar
        designAndPermitting: 400, // per kW (increased from $150 to reflect real permitting costs)
        laborPerKW: 800, // (increased from $300 to reflect real installation labor)
        electricalBOS: 600, // balance of system (increased from $200 to reflect real electrical costs)
        monitoring: 150, // (increased from $50 to reflect real monitoring systems)
        commissioning: 200 // (increased from $75 to reflect real commissioning costs)
        // Total installation costs: ~$2,150/kW + equipment costs = ~$2.50-3.00/W total
      },
      additionalComponents: {
        dcCabling: 85,
        acCabling: 65,
        combinerBox: 45,
        disconnects: 35,
        grounding: 25,
        conduit: 40
      },
      operationMaintenance: {
        annualPerKW: 15,
        inverterReplacementCycle: 12,
        cleaningPerKW: 8,
        monitoringPerKW: 12
      }
    };
  }

  calculateSolarSystemCost(
    systemSizeKW: number,
    panelId: string,
    inverterId: string,
    mountingId: string,
    includeInstallation: boolean = true
  ): {
    systemDetails: any;
    equipmentCost: number;
    installationCost: number;
    totalCost: number;
    costPerWatt: number;
    breakdown: any;
  } {
    const panel = this.configuration.panels.find(p => p.id === panelId);
    const inverter = this.configuration.inverters.find(i => i.id === inverterId);
    const mounting = this.configuration.mountingSystems.find(m => m.id === mountingId);

    if (!panel || !inverter || !mounting) {
      return {
        systemDetails: null,
        equipmentCost: 0,
        installationCost: 0,
        totalCost: 0,
        costPerWatt: 0,
        breakdown: {}
      };
    }

    const systemSizeW = systemSizeKW * 1000;
    const numPanels = Math.ceil(systemSizeW / panel.powerRatingW);
    const actualSystemSizeW = numPanels * panel.powerRatingW;
    const actualSystemSizeKW = actualSystemSizeW / 1000;

    // Calculate inverter requirements
    const numInverters = inverter.type === 'microinverter' 
      ? numPanels 
      : Math.ceil(actualSystemSizeW / inverter.powerRatingW);

    // Equipment costs
    const panelCost = numPanels * panel.pricePerPanel;
    const inverterCost = numInverters * inverter.pricePerUnit;
    const mountingCost = numPanels * mounting.pricePerPanel;

    // Additional components
    const additionalCost = Object.values(this.configuration.additionalComponents)
      .reduce((sum, costPerKW) => sum + (costPerKW * actualSystemSizeKW), 0);

    const equipmentCost = panelCost + inverterCost + mountingCost + additionalCost;

    // Installation costs
    let installationCost = 0;
    if (includeInstallation) {
      installationCost = Object.values(this.configuration.installationCosts)
        .reduce((sum, costPerKW) => sum + (costPerKW * actualSystemSizeKW), 0);
    }

    const totalCost = equipmentCost + installationCost;
    const costPerWatt = totalCost / actualSystemSizeW;

    return {
      systemDetails: {
        requestedSizeKW: systemSizeKW,
        actualSizeKW: actualSystemSizeKW,
        actualSizeW: actualSystemSizeW,
        numPanels,
        numInverters,
        panel: panel.model,
        inverter: inverter.model,
        mounting: mounting.model
      },
      equipmentCost,
      installationCost,
      totalCost,
      costPerWatt,
      breakdown: {
        equipment: {
          panels: {
            quantity: numPanels,
            pricePerPanel: panel.pricePerPanel,
            subtotal: panelCost
          },
          inverters: {
            quantity: numInverters,
            pricePerUnit: inverter.pricePerUnit,
            subtotal: inverterCost
          },
          mounting: {
            quantity: numPanels,
            pricePerPanel: mounting.pricePerPanel,
            subtotal: mountingCost
          },
          additionalComponents: {
            dcCabling: this.configuration.additionalComponents.dcCabling * actualSystemSizeKW,
            acCabling: this.configuration.additionalComponents.acCabling * actualSystemSizeKW,
            combinerBox: this.configuration.additionalComponents.combinerBox * actualSystemSizeKW,
            disconnects: this.configuration.additionalComponents.disconnects * actualSystemSizeKW,
            grounding: this.configuration.additionalComponents.grounding * actualSystemSizeKW,
            conduit: this.configuration.additionalComponents.conduit * actualSystemSizeKW,
            subtotal: additionalCost
          }
        },
        installation: includeInstallation ? {
          designAndPermitting: this.configuration.installationCosts.designAndPermitting * actualSystemSizeKW,
          labor: this.configuration.installationCosts.laborPerKW * actualSystemSizeKW,
          electricalBOS: this.configuration.installationCosts.electricalBOS * actualSystemSizeKW,
          monitoring: this.configuration.installationCosts.monitoring * actualSystemSizeKW,
          commissioning: this.configuration.installationCosts.commissioning * actualSystemSizeKW,
          subtotal: installationCost
        } : null
      }
    };
  }

  calculateAnnualProduction(systemSizeKW: number, location: string = 'average'): {
    annualKWh: number;
    monthlyAverage: number;
    peakSunHours: number;
  } {
    // Simplified solar irradiance data (actual implementation would use NREL data)
    const irradianceData: { [key: string]: number } = {
      'arizona': 6.5,
      'california': 5.8,
      'florida': 5.2,
      'texas': 5.0,
      'nevada': 6.0,
      'new_mexico': 6.2,
      'average': 4.5
    };

    const peakSunHours = irradianceData[location.toLowerCase()] || irradianceData['average'];
    const annualKWh = systemSizeKW * peakSunHours * 365 * 0.85; // 85% system efficiency
    const monthlyAverage = annualKWh / 12;

    return {
      annualKWh: Math.round(annualKWh),
      monthlyAverage: Math.round(monthlyAverage),
      peakSunHours
    };
  }

  getPanelsByTechnology(technology: string): SolarPanel[] {
    return this.configuration.panels.filter(panel => panel.technology === technology);
  }

  getInvertersByType(type: string): SolarInverter[] {
    return this.configuration.inverters.filter(inverter => inverter.type === type);
  }

  getMountingSystemsByType(type: string): MountingSystem[] {
    return this.configuration.mountingSystems.filter(mounting => mounting.type === type);
  }

  getConfiguration(): SolarPricingConfiguration {
    return this.configuration;
  }

  updateConfiguration(newConfig: Partial<SolarPricingConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  getPricingSummary() {
    return {
      panels: this.configuration.panels.map(panel => ({
        id: panel.id,
        manufacturer: panel.manufacturer,
        model: panel.model,
        powerW: panel.powerRatingW,
        efficiency: panel.efficiency,
        pricePerWatt: panel.pricePerWatt,
        technology: panel.technology
      })),
      inverters: this.configuration.inverters.map(inverter => ({
        id: inverter.id,
        manufacturer: inverter.manufacturer,
        model: inverter.model,
        powerW: inverter.powerRatingW,
        type: inverter.type,
        pricePerWatt: inverter.pricePerWatt,
        efficiency: inverter.efficiency
      })),
      mountingSystems: this.configuration.mountingSystems.map(mounting => ({
        id: mounting.id,
        manufacturer: mounting.manufacturer,
        model: mounting.model,
        type: mounting.type,
        pricePerPanel: mounting.pricePerPanel
      }))
    };
  }
}

export default new SolarPricingService();