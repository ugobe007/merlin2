/**
 * Pricing Configuration Service
 * Centralized management of all equipment pricing assumptions
 * Based on real-world vendor quotes and market intelligence
 */

export interface BESSPricingConfig {
  // 4-tier realistic pricing structure for 2025
  smallSystemPerKWh: number;     // <1 MWh systems
  mediumSystemPerKWh: number;    // 1-5 MWh systems
  mediumLargeSystemPerKWh: number; // 5-15 MWh systems
  largeSystemPerKWh: number;     // 15+ MWh systems
  
  // Reference points for tier boundaries
  smallSystemSizeMWh: number;    // 1 MWh threshold
  mediumSystemSizeMWh: number;   // 5 MWh threshold
  largeSystemSizeMWh: number;    // 15 MWh threshold
  
  degradationRate: number;
  warrantyYears: number;
  vendorNotes: string;
}

// ... (keeping other interfaces the same) ...

export interface SolarPricingConfig {
  utilityScalePerWatt: number; // $/W for >5MW
  commercialPerWatt: number; // $/W for 100kW-5MW
  smallScalePerWatt: number; // $/W for <100kW
  trackingSystemUpcharge: number; // % upcharge for tracking
  rooftopInstallationFactor: number; // Multiplier for rooftop vs ground mount
  permittingCostPerWatt: number; // Permitting and interconnection costs
  vendorNotes: string;
}

export interface OfficeBuildingPricingConfig {
  // Office building specific BESS installation costs
  rooftopInstallationPerKWh: number; // Additional cost for rooftop installation
  basementInstallationPerKWh: number; // Cost for basement/underground installation
  groundLevelInstallationPerKWh: number; // Ground level installation (parking lot)
  
  // Building integration costs
  hvacIntegrationCost: number; // HVAC thermal management integration
  buildingAutomationCost: number; // BAS integration costs
  elevatorBackupCost: number; // Emergency elevator backup integration
  fireSuppressionPerSqFt: number; // Fire suppression system costs per sq ft
  
  // Permitting and compliance
  cityPermittingBaseCost: number; // Base permitting cost for urban areas
  structuralAnalysisCost: number; // Structural engineering analysis
  electricalUpgradeCost: number; // Building electrical system upgrades
  
  // Installation factors
  urbanAccessFactor: number; // Multiplier for urban access challenges
  highRiseInstallationFactor: number; // Additional factor for buildings >10 stories
  weekendWorkPremium: number; // Premium for after-hours/weekend work
  
  vendorNotes: string;
}

export interface WindPricingConfig {
  utilityScalePerKW: number; // $/kW for >10MW
  commercialPerKW: number; // $/kW for 1-10MW
  smallScalePerKW: number; // $/kW for <1MW
  foundationCostPerMW: number;
  vendorNotes: string;
}

export interface GeneratorPricingConfig {
  naturalGasPerKW: number; // $/kW (e.g., Eaton/Cummins quote)
  dieselPerKW: number;
  propanePerKW: number;
  bioGasPerKW: number;
  baseInstallationCost: number;
  vendorNotes: string;
}

export interface PowerElectronicsConfig {
  inverterPerKW: number; // PCS/Inverter cost
  transformerPerKVA: number;
  switchgearPerKW: number;
  protectionRelaysPerUnit: number;
  vendorNotes: string;
}

export interface EVChargingConfig {
  level1ACPerUnit: number; // 3.3-7.7kW
  level2ACPerUnit: number; // 7.7-22kW
  dcFastPerUnit: number; // 50-150kW
  dcUltraFastPerUnit: number; // 150-350kW
  pantographChargerPerUnit: number; // Overhead charging
  networkingCostPerUnit: number; // OCPP compliance
  
  // Installation and infrastructure costs (NEW)
  electricalInfrastructurePerUnit: number; // Electrical infrastructure per charging point
  pavementAndFoundationPerUnit: number; // Concrete work and foundations
  utilityConnectionCost: number; // Utility interconnection and service upgrades
  permittingPerSite: number; // Site permitting and approvals
  networkingInstallationPerUnit: number; // Network installation and configuration
  
  // Operational costs (NEW)
  maintenancePerUnitPerYear: number; // Annual maintenance costs
  softwareLicensePerUnitPerYear: number; // Annual software licensing
  networkFeesPerUnitPerMonth: number; // Monthly network connectivity fees
  
  vendorNotes: string;
}

export interface BalanceOfPlantConfig {
  bopPercentage: number; // Max 15% guideline
  laborCostPerHour: number;
  epcPercentage: number;
  shippingCostPercentage: number;
  internationalTariffRate: number;
  contingencyPercentage: number;
  
  // Regional labor variations (NEW)
  urbanLaborPremium: number; // % premium for urban areas
  skillLaborPremiumPercentage: number; // % premium for specialized skills
  unionLaborPremiumPercentage: number; // % premium for union labor areas
  
  vendorNotes: string;
}

export interface SystemControlsConfig {
  scadaSystemBaseCost: number;
  cybersecurityComplianceCost: number;
  cloudConnectivityPerYear: number;
  hmiTouchscreenCost: number;
  vendorNotes: string;
}

export interface PricingConfiguration {
  bess: BESSPricingConfig;
  solar: SolarPricingConfig;
  officeBuilding: OfficeBuildingPricingConfig;
  wind: WindPricingConfig;
  generators: GeneratorPricingConfig;
  powerElectronics: PowerElectronicsConfig;
  evCharging: EVChargingConfig;
  balanceOfPlant: BalanceOfPlantConfig;
  systemControls: SystemControlsConfig;
  lastUpdated: string;
  updatedBy: string;
  version: string;
}

// Default pricing configuration based on vendor analysis and market data
const defaultBESSPricing: BESSPricingConfig = {
  // Realistic Q4 2025 BESS pricing tiers (user-validated)
  smallSystemPerKWh: 145,        // <1 MWh: $145/kWh
  mediumSystemPerKWh: 135,       // 1-5 MWh: $135/kWh
  mediumLargeSystemPerKWh: 120,  // 5-15 MWh: $120/kWh
  largeSystemPerKWh: 105,        // 15+ MWh: $105/kWh
  
  // Reference points for tier boundaries
  smallSystemSizeMWh: 1,         // <1 MWh threshold
  mediumSystemSizeMWh: 5,        // 1-5 MWh threshold
  largeSystemSizeMWh: 15,        // 15+ MWh threshold
  
  degradationRate: 2.4,          // Realistic LFP degradation rate
  warrantyYears: 11,             // Industry standard warranty terms
  vendorNotes: "Q4 2025 realistic BESS pricing tiers: <1MWh=$145/kWh | 1-5MWh=$135/kWh | 5-15MWh=$120/kWh | 15+MWh=$105/kWh. Includes installation, BOS, commissioning, realistic profit margins. LFP technology, 6000+ cycles."
};

// Default configuration for all pricing sections
const DEFAULT_PRICING_CONFIG: PricingConfiguration = {
  bess: defaultBESSPricing,
  solar: {
    // Updated Q4 2025 solar pricing - significant cost reductions
    utilityScalePerWatt: 0.58,     // Down from 0.65 - large utility projects
    commercialPerWatt: 0.78,       // Down from 0.85 - commercial rooftop
    smallScalePerWatt: 1.15,       // Down from 1.25 - small commercial/residential
    trackingSystemUpcharge: 12,     // Down from 15% - tracking systems more competitive
    rooftopInstallationFactor: 1.35, // 35% premium for rooftop vs ground mount
    permittingCostPerWatt: 0.12,   // Permitting costs per watt
    vendorNotes: "NREL ATB Q4 2025 + market intelligence. Solar module prices down 18% YoY. Installation labor optimized with prefab systems."
  },
  officeBuilding: {
    // Office building specific BESS installation costs
    rooftopInstallationPerKWh: 45,    // Additional cost for rooftop installation
    basementInstallationPerKWh: 65,   // Higher cost for basement installation (ventilation, access)
    groundLevelInstallationPerKWh: 25, // Lowest cost option - parking lot installation
    
    // Building integration costs
    hvacIntegrationCost: 35000,        // HVAC thermal management integration
    buildingAutomationCost: 28000,     // BAS integration costs
    elevatorBackupCost: 45000,         // Emergency elevator backup integration
    fireSuppressionPerSqFt: 15,       // Fire suppression system costs per sq ft of BESS room
    
    // Permitting and compliance
    cityPermittingBaseCost: 8500,      // Base permitting cost for urban areas
    structuralAnalysisCost: 12000,     // Structural engineering analysis
    electricalUpgradeCost: 35000,      // Building electrical system upgrades
    
    // Installation factors
    urbanAccessFactor: 1.25,           // 25% premium for urban access challenges
    highRiseInstallationFactor: 1.40,  // 40% premium for buildings >10 stories
    weekendWorkPremium: 1.75,          // 75% premium for after-hours/weekend work
    
    vendorNotes: "Q4 2025 office building BESS integration costs. Includes fire code compliance (NFPA 855), building code integration, and urban installation challenges."
  },
  wind: {
    // Updated wind pricing with improved turbine efficiency
    utilityScalePerKW: 1150,       // Down from 1200 - larger turbines, economies of scale
    commercialPerKW: 1350,         // Down from 1400 - distributed wind improvements
    smallScalePerKW: 2100,         // Down from 2200 - small wind technology advances
    foundationCostPerMW: 48000,    // Down from 50000 - optimized foundation designs
    vendorNotes: "2025 wind market with improved turbine efficiency and installation processes"
  },
  generators: {
    // Updated generator pricing with cleaner fuel options focus
    naturalGasPerKW: 750,          // Down from 800 - mature technology, competition
    dieselPerKW: 580,              // Down from 600 - standardization benefits
    propanePerKW: 850,             // Down from 900 - cleaner fuel adoption
    bioGasPerKW: 1150,             // Down from 1200 - renewable fuel infrastructure growth
    baseInstallationCost: 48000,   // Down from 50000 - streamlined installation
    vendorNotes: "Industrial generator pricing Q4 2025 with focus on cleaner fuel options and grid integration"
  },
  powerElectronics: {
    // Updated power electronics with advanced grid-forming capabilities
    inverterPerKW: 140,            // Down from 150 - volume production, technology maturity
    transformerPerKVA: 72,         // Down from 75 - standardized designs
    switchgearPerKW: 185,          // Down from 200 - improved manufacturing
    protectionRelaysPerUnit: 23500, // Down from 25000 - digital protection advances
    vendorNotes: "Grid-forming and grid-following capable PCS with enhanced cybersecurity (IEC 62443 compliant)"
  },
  evCharging: {
    // Updated EV charging with 2025 technology improvements and cost reductions
    level1ACPerUnit: 950,          // Down from 1200 - basic Level 1 chargers more commoditized
    level2ACPerUnit: 2850,         // Down from 3500 - Level 2 market maturity
    dcFastPerUnit: 38000,          // Down from 45000 - DC fast charging scale economies
    dcUltraFastPerUnit: 125000,    // Down from 150000 - 350kW+ charger cost improvements
    pantographChargerPerUnit: 175000, // Down from 200000 - overhead charging optimization
    networkingCostPerUnit: 2200,   // Down from 2500 - OCPP and connectivity standardization
    
    // Installation and infrastructure costs
    electricalInfrastructurePerUnit: 8500,   // Electrical infrastructure per charging point
    pavementAndFoundationPerUnit: 3200,     // Concrete work and foundations
    utilityConnectionCost: 15000,            // Utility interconnection and service upgrades
    permittingPerSite: 6500,                // Site permitting and approvals
    networkingInstallationPerUnit: 1200,     // Network installation and configuration
    
    // Operational costs
    maintenancePerUnitPerYear: 750,         // Annual maintenance costs
    softwareLicensePerUnitPerYear: 480,     // Annual software licensing
    networkFeesPerUnitPerMonth: 45,         // Monthly network connectivity fees
    
    vendorNotes: "Commercial EV charging Q4 2025: CCS standard, plug-and-charge, vehicle-to-grid ready infrastructure. Includes full installation and 5-year operational cost estimates."
  },
  balanceOfPlant: {
    // Updated BOP costs with installation efficiency improvements
    bopPercentage: 11,             // Down from 12% - standardized BOP components
    laborCostPerHour: 92,          // Up from 85 - skilled labor cost increases
    epcPercentage: 7.5,            // Down from 8% - EPC competition and efficiency
    shippingCostPercentage: 3.2,   // Up from 3% - logistics cost increases
    internationalTariffRate: 22,   // Down from 25% - trade policy changes
    contingencyPercentage: 9,      // Down from 10% - project risk reduction with experience
    
    // Regional labor variations
    urbanLaborPremium: 18,         // 18% premium for urban areas
    skillLaborPremiumPercentage: 25, // 25% premium for specialized skills (electrical, controls)
    unionLaborPremiumPercentage: 32, // 32% premium for union labor areas
    
    vendorNotes: "Q4 2025 BOP costs: modular systems reducing field labor, increased material costs offset by efficiency gains. Regional labor variations reflect market reality."
  },
  systemControls: {
    // Updated system controls with advanced AI/ML capabilities
    scadaSystemBaseCost: 68000,    // Down from 75000 - standardized SCADA platforms
    cybersecurityComplianceCost: 32000, // Up from 25000 - enhanced security requirements
    cloudConnectivityPerYear: 8500, // Down from 12000 - cloud service cost reductions
    hmiTouchscreenCost: 12500,     // Down from 15000 - display technology improvements
    vendorNotes: "Industrial SCADA with AI-powered predictive maintenance, NERC CIP compliance, edge computing integration"
  },
  lastUpdated: new Date().toISOString(),
  updatedBy: "Q4 2025 Market Update",
  version: "2.0.0"
};

class PricingConfigService {
  private config: PricingConfiguration;

  constructor() {
    // Load from localStorage or use defaults
    const savedConfig = localStorage.getItem('pricingConfiguration');
    this.config = savedConfig ? JSON.parse(savedConfig) : DEFAULT_PRICING_CONFIG;
  }

  getConfiguration(): PricingConfiguration {
    return { ...this.config };
  }

  updateConfiguration(newConfig: Partial<PricingConfiguration>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
      version: this.incrementVersion(this.config.version)
    };
    
    // Save to localStorage
    localStorage.setItem('pricingConfiguration', JSON.stringify(this.config));
    
    // Trigger recalculation of all quotes
    window.dispatchEvent(new CustomEvent('pricingConfigUpdated', { detail: this.config }));
  }

  updateSection<K extends keyof PricingConfiguration>(
    section: K, 
    updates: Partial<PricingConfiguration[K]>
  ): void {
    this.config[section] = { ...(this.config[section] as any), ...(updates as any) };
    this.config.lastUpdated = new Date().toISOString();
    this.config.version = this.incrementVersion(this.config.version);
    
    localStorage.setItem('pricingConfiguration', JSON.stringify(this.config));
    window.dispatchEvent(new CustomEvent('pricingConfigUpdated', { detail: this.config }));
  }

  resetToDefaults(): void {
    this.config = { 
      ...DEFAULT_PRICING_CONFIG, 
      lastUpdated: new Date().toISOString(),
      version: "1.0.0"
    };
    localStorage.setItem('pricingConfiguration', JSON.stringify(this.config));
    window.dispatchEvent(new CustomEvent('pricingConfigUpdated', { detail: this.config }));
  }

  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importConfiguration(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      // Validate the structure
      if (this.validateConfig(importedConfig)) {
        this.config = {
          ...importedConfig,
          lastUpdated: new Date().toISOString(),
          version: this.incrementVersion(this.config.version)
        };
        localStorage.setItem('pricingConfiguration', JSON.stringify(this.config));
        window.dispatchEvent(new CustomEvent('pricingConfigUpdated', { detail: this.config }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private validateConfig(config: any): boolean {
    // Basic validation to ensure required sections exist
    const requiredSections = ['bess', 'solar', 'wind', 'generators', 'powerElectronics', 'evCharging', 'balanceOfPlant', 'systemControls'];
    return requiredSections.every(section => section in config);
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  // Convenience methods for common calculations
  getBESSCostPerKWh(capacityMWh: number): number {
    // Realistic 4-tier pricing structure for Q4 2025
    // [15 MWh -50 MWh: $105 kWh], [5 MWh - 15 MWh: $120 kWh], [1 MWh - 5 MWh:$135 kWh], [<1 MWh: $145 kWh]
    
    if (capacityMWh >= 15) {
      return 105; // 15-50+ MWh: Utility-scale with maximum economies
    }
    
    if (capacityMWh >= 5) {
      return 120; // 5-15 MWh: Large commercial with good economies
    }
    
    if (capacityMWh >= 1) {
      return 135; // 1-5 MWh: Medium commercial systems
    }
    
    // <1 MWh: Small commercial/residential with higher per-unit costs
    return 145;
  }

  getSolarCostPerWatt(capacityMW: number): number {
    if (capacityMW >= 5) return this.config.solar.utilityScalePerWatt;
    if (capacityMW >= 0.1) return this.config.solar.commercialPerWatt;
    return this.config.solar.smallScalePerWatt;
  }

  getWindCostPerKW(capacityMW: number): number {
    if (capacityMW >= 10) return this.config.wind.utilityScalePerKW;
    if (capacityMW >= 1) return this.config.wind.commercialPerKW;
    return this.config.wind.smallScalePerKW;
  }

  getGeneratorCostPerKW(fuelType: 'naturalGas' | 'diesel' | 'propane' | 'bioGas' = 'naturalGas'): number {
    const fuelTypeMap = {
      naturalGas: 'naturalGasPerKW',
      diesel: 'dieselPerKW',
      propane: 'propanePerKW',
      bioGas: 'bioGasPerKW'
    } as const;
    
    return this.config.generators[fuelTypeMap[fuelType]];
  }
}

export const pricingConfigService = new PricingConfigService();

// Main exports
export {
  PricingConfigService,
  DEFAULT_PRICING_CONFIG,
  defaultBESSPricing
};