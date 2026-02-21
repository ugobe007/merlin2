/**
 * System Controls Pricing Service
 * SCADA, EMS, controllers, automation systems
 *
 * ✅ UPDATED Jan 2026: Now database-driven with fallback to hardcoded defaults
 *
 * Data Sources (in priority order):
 * 1. Database `pricing_configurations` table (config_key: 'system_controls_pricing')
 * 2. Database `pricing_configurations` table (config_key: 'control_systems') - Legacy
 * 3. Hardcoded defaults (fallback)
 *
 * This service provides intelligent fallback from database to defaults,
 * ensuring pricing can be updated via admin dashboard without code deployment.
 */

// Lazy import to avoid TDZ errors - import inside functions that need it

export interface Controller {
  id: string;
  manufacturer: string;
  model: string;
  type: "generator_controller" | "plc" | "rtu" | "protective_relay" | "energy_management";
  application: string;
  features: string[];
  communicationProtocols: string[];
  inputOutputCount: {
    digitalInputs: number;
    digitalOutputs: number;
    analogInputs: number;
    analogOutputs: number;
  };
  powerSupply: {
    voltage: string;
    consumption: number; // watts
  };
  operatingConditions: {
    temperatureRange: string;
    humidity: string;
    enclosureRating: string;
  };
  warranty: number; // years
  pricePerUnit: number;
  vendor: {
    company: string;
    contact: string;
    location: string;
  };
}

export interface ScadaSystem {
  id: string;
  manufacturer: string;
  model: string;
  type: "hmi" | "historian" | "server" | "workstation" | "communication_gateway";
  capacity: {
    tags: number;
    historians: number;
    users: number;
  };
  features: string[];
  operatingSystem: string;
  hardware: {
    cpu: string;
    ram: string;
    storage: string;
    network: string[];
  };
  softwareLicenses: string[];
  warranty: number; // years
  pricePerUnit: number;
  annualMaintenanceCost: number;
  vendor: {
    company: string;
    contact: string;
  };
}

export interface EnergyManagementSystem {
  id: string;
  manufacturer: string;
  model: string;
  type:
    | "microgrid_controller"
    | "demand_response"
    | "load_forecasting"
    | "optimization"
    | "analytics";
  capabilities: string[];
  controlledAssets: string[];
  algorithms: string[];
  communicationProtocols: string[];
  integrations: string[];
  scalability: {
    maxSites: number;
    maxAssets: number;
    maxPower: number; // MW
  };
  deployment: "cloud" | "on_premise" | "hybrid";
  pricing: {
    setupFee: number;
    monthlyPerSite: number;
    perMWCapacity: number;
    implementationCost: number;
  };
  vendor: {
    company: string;
    contact: string;
  };
}

export interface AutomationSystem {
  id: string;
  manufacturer: string;
  model: string;
  type: "building_automation" | "industrial_automation" | "process_control" | "safety_system";
  components: string[];
  controlLoops: number;
  networkTopology: string;
  redundancy: string;
  certifications: string[];
  pricePerPoint: number;
  baseSystemCost: number;
  vendor: {
    company: string;
    contact: string;
  };
}

export interface SystemControlsPricingConfiguration {
  controllers: Controller[];
  scadaSystems: ScadaSystem[];
  energyManagementSystems: EnergyManagementSystem[];
  automationSystems: AutomationSystem[];
  installationCosts: {
    controllerInstallationPerUnit: number;
    scadaInstallationPerSystem: number;
    networkingPerPoint: number;
    commissioningPerSystem: number;
    trainingPerDay: number;
    documentationCost: number;
  };
  integrationCosts: {
    protocolGateway: number;
    customInterfacing: number; // per hour
    systemTesting: number; // per day
    cybersecuritySetup: number;
  };
  maintenanceContracts: {
    annualControllerMaintenance: number; // % of equipment cost
    scadaSoftwareMaintenance: number; // % of software cost
    systemSupportPerHour: number;
    remoteMonitoringPerPoint: number; // per year
  };
}

class SystemControlsPricingService {
  private configuration: SystemControlsPricingConfiguration;
  private configCache: SystemControlsPricingConfiguration | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.configuration = this.getDefaultConfiguration();
    // DON'T auto-initialize - let methods call ensureInitialized() on demand
    // This prevents TDZ errors from circular dependencies
  }

  /**
   * Lazy initialization - loads from database on first use
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Prevent concurrent initialization
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        await this.loadFromDatabase();
        this.isInitialized = true;
      } catch (error) {
        console.warn("Error loading system controls pricing from database:", error);
        // Keep using defaults
        this.isInitialized = true; // Don't retry on every call
      }
    })();

    return this.initPromise;
  }

  /**
   * Load configuration from database (database-first approach)
   */
  private async loadFromDatabase(): Promise<SystemControlsPricingConfiguration | null> {
    // Lazy import to avoid TDZ
    const { supabase } = await import("./supabaseClient");
    
    // Check cache first
    if (this.configCache && Date.now() < this.cacheExpiry) {
      this.configuration = this.configCache;
      return this.configCache;
    }

    try {
      // Try new config key first
      let configData = null;
      const { data, error } = await supabase
        .from("pricing_configurations")
        .select("*")
        .eq("config_key", "system_controls_pricing")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Try legacy config key
        const { data: legacyData, error: legacyError } = await supabase
          .from("pricing_configurations")
          .select("*")
          .eq("config_key", "control_systems")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (!legacyError && legacyData) {
          configData = legacyData.config_data;
        }
      } else {
        configData = data.config_data;
      }

      if (configData) {
        // Merge database config with defaults (database values override defaults)
        const dbConfig = this.parseDatabaseConfig(configData);
        if (dbConfig) {
          this.configCache = dbConfig;
          this.cacheExpiry = Date.now() + this.CACHE_DURATION_MS;
          this.configuration = dbConfig;

          if (import.meta.env.DEV) {
            console.log("✅ System Controls pricing loaded from database");
          }
          return dbConfig;
        }
      }

      return null;
    } catch (error) {
      console.warn("Error loading system controls pricing from database:", error);
      return null;
    }
  }

  /**
   * Parse database config data into SystemControlsPricingConfiguration
   */
  private parseDatabaseConfig(configData: any): SystemControlsPricingConfiguration | null {
    try {
      const defaults = this.getDefaultConfiguration();

      // Merge database values with defaults
      // Database can override pricing but defaults provide full product specs
      const merged: SystemControlsPricingConfiguration = {
        controllers: defaults.controllers.map((controller) => {
          // Check if database has pricing for this controller
          const dbController = configData.controllers?.find((c: any) => c.id === controller.id);
          if (dbController && dbController.pricePerUnit) {
            return { ...controller, pricePerUnit: dbController.pricePerUnit };
          }
          return controller;
        }),
        scadaSystems: defaults.scadaSystems.map((scada) => {
          const dbScada = configData.scadaSystems?.find((s: any) => s.id === scada.id);
          if (dbScada && dbScada.pricePerUnit) {
            return { ...scada, pricePerUnit: dbScada.pricePerUnit };
          }
          return scada;
        }),
        energyManagementSystems: defaults.energyManagementSystems.map((ems) => {
          const dbEms = configData.energyManagementSystems?.find((e: any) => e.id === ems.id);
          if (dbEms && dbEms.pricing) {
            return { ...ems, pricing: { ...ems.pricing, ...dbEms.pricing } };
          }
          return ems;
        }),
        automationSystems: defaults.automationSystems,
        installationCosts: configData.installationCosts || defaults.installationCosts,
        integrationCosts: configData.integrationCosts || defaults.integrationCosts,
        maintenanceContracts: configData.maintenanceContracts || defaults.maintenanceContracts,
      };

      return merged;
    } catch (error) {
      console.error("Error parsing database config:", error);
      return null;
    }
  }

  /**
   * Force refresh from database (clear cache)
   */
  async refreshFromDatabase(): Promise<void> {
    this.configCache = null;
    this.cacheExpiry = 0;
    await this.loadFromDatabase();
  }

  private getDefaultConfiguration(): SystemControlsPricingConfiguration {
    return {
      controllers: [
        {
          id: "deepsea-dse8610",
          manufacturer: "Deep Sea Electronics",
          model: "DSE8610 MKII",
          type: "generator_controller",
          application: "Advanced Generator Set Control and Parallel Operation",
          features: [
            "Advanced generator control",
            "Load management",
            "Parallel operation up to 32 sets",
            "AMF (Auto Mains Failure)",
            "Load sharing",
            "Power management",
            "Engine protection",
            "Remote monitoring",
            "Event logging",
            "LCD display with navigation",
          ],
          communicationProtocols: [
            "Modbus RTU",
            "Modbus TCP",
            "SNMP",
            "CAN bus",
            "Ethernet",
            "SMS/Email alerts",
          ],
          inputOutputCount: {
            digitalInputs: 16,
            digitalOutputs: 12,
            analogInputs: 8,
            analogOutputs: 4,
          },
          powerSupply: {
            voltage: "8 to 35V DC",
            consumption: 15,
          },
          operatingConditions: {
            temperatureRange: "-20°C to +70°C",
            humidity: "95% non-condensing",
            enclosureRating: "IP65",
          },
          warranty: 2,
          pricePerUnit: 2850, // Estimated based on market pricing
          vendor: {
            company: "Deep Sea Electronics",
            contact: "sales@deepseaelectronics.com",
            location: "Hunmanby, UK",
          },
        },
        {
          id: "woodward-easygen-3500",
          manufacturer: "Woodward",
          model: "easYgen-3500",
          type: "generator_controller",
          application: "Integrated Genset Controller",
          features: [
            "Engine and generator control",
            "Protection functions",
            "Load sharing",
            "Power management",
            "Mains monitoring",
            "CAN communication",
            "Web interface",
            "Configurable logic",
          ],
          communicationProtocols: ["CAN bus", "Modbus RTU", "Modbus TCP", "Ethernet"],
          inputOutputCount: {
            digitalInputs: 24,
            digitalOutputs: 16,
            analogInputs: 12,
            analogOutputs: 8,
          },
          powerSupply: {
            voltage: "9 to 32V DC",
            consumption: 12,
          },
          operatingConditions: {
            temperatureRange: "-40°C to +70°C",
            humidity: "95% non-condensing",
            enclosureRating: "IP54",
          },
          warranty: 2,
          pricePerUnit: 3200,
          vendor: {
            company: "Woodward Inc.",
            contact: "industrial@woodward.com",
            location: "Fort Collins, CO",
          },
        },
        {
          id: "abb-plc-ac500",
          manufacturer: "ABB",
          model: "AC500 PLC",
          type: "plc",
          application: "Industrial Automation Control",
          features: [
            "Modular design",
            "High-speed processing",
            "Integrated safety",
            "Web server",
            "Multiple communication interfaces",
            "IEC 61131-3 programming",
          ],
          communicationProtocols: ["Ethernet/IP", "Modbus TCP", "PROFINET", "DeviceNet", "CANopen"],
          inputOutputCount: {
            digitalInputs: 32,
            digitalOutputs: 32,
            analogInputs: 16,
            analogOutputs: 16,
          },
          powerSupply: {
            voltage: "24V DC",
            consumption: 25,
          },
          operatingConditions: {
            temperatureRange: "-25°C to +60°C",
            humidity: "95% non-condensing",
            enclosureRating: "IP20",
          },
          warranty: 2,
          pricePerUnit: 4500,
          vendor: {
            company: "ABB Inc.",
            contact: "automation@abb.com",
            location: "Cary, NC",
          },
        },
        {
          id: "schneider-sepam-80",
          manufacturer: "Schneider Electric",
          model: "Sepam Series 80",
          type: "protective_relay",
          application: "Generator Protection and Control",
          features: [
            "Generator protection",
            "Synchronizing check",
            "Power measurement",
            "Event recording",
            "Communication interfaces",
            "Web HMI",
            "Logic programming",
          ],
          communicationProtocols: ["IEC 61850", "Modbus", "DNP3", "IEC 60870-5-103"],
          inputOutputCount: {
            digitalInputs: 20,
            digitalOutputs: 14,
            analogInputs: 10,
            analogOutputs: 4,
          },
          powerSupply: {
            voltage: "48 to 250V DC / 110 to 240V AC",
            consumption: 30,
          },
          operatingConditions: {
            temperatureRange: "-25°C to +70°C",
            humidity: "95% non-condensing",
            enclosureRating: "IP54",
          },
          warranty: 3,
          pricePerUnit: 5200,
          vendor: {
            company: "Schneider Electric",
            contact: "protection@schneider-electric.com",
            location: "Grenoble, France",
          },
        },
      ],
      scadaSystems: [
        {
          id: "wonderware-system-platform",
          manufacturer: "AVEVA",
          model: "System Platform 2023",
          type: "server",
          capacity: {
            tags: 100000,
            historians: 10,
            users: 250,
          },
          features: [
            "Distributed SCADA",
            "Historian integration",
            "Alarm management",
            "Reporting",
            "Redundancy",
            "Web clients",
            "Mobile access",
          ],
          operatingSystem: "Windows Server",
          hardware: {
            cpu: "Intel Xeon Silver 4214",
            ram: "64GB",
            storage: "2TB SSD",
            network: ["Gigabit Ethernet", "Fiber"],
          },
          softwareLicenses: ["Galaxy", "InTouch HMI", "Historian", "Reports"],
          warranty: 1,
          pricePerUnit: 125000,
          annualMaintenanceCost: 25000,
          vendor: {
            company: "AVEVA",
            contact: "sales@aveva.com",
          },
        },
        {
          id: "ge-ifix-scada",
          manufacturer: "Emerson",
          model: "iFIX SCADA",
          type: "hmi",
          capacity: {
            tags: 50000,
            historians: 5,
            users: 100,
          },
          features: [
            "Advanced graphics",
            "Real-time data",
            "Alarm handling",
            "Trending",
            "Recipe management",
            "Security system",
          ],
          operatingSystem: "Windows",
          hardware: {
            cpu: "Intel Core i7",
            ram: "32GB",
            storage: "1TB SSD",
            network: ["Gigabit Ethernet"],
          },
          softwareLicenses: ["iFIX Base", "Database Manager", "Alarm Service"],
          warranty: 1,
          pricePerUnit: 85000,
          annualMaintenanceCost: 17000,
          vendor: {
            company: "Emerson",
            contact: "automation.solutions@emerson.com",
          },
        },
      ],
      energyManagementSystems: [
        {
          id: "schneider-ecostruxure-microgrid",
          manufacturer: "Schneider Electric",
          model: "EcoStruxure Microgrid Advisor",
          type: "microgrid_controller",
          capabilities: [
            "Real-time optimization",
            "Load forecasting",
            "Energy trading",
            "Islanding control",
            "Asset coordination",
            "Grid services",
          ],
          controlledAssets: [
            "Solar PV",
            "Energy Storage",
            "Generators",
            "Loads",
            "Grid connection",
          ],
          algorithms: [
            "Economic optimization",
            "Peak shaving",
            "Load balancing",
            "Demand response",
            "Predictive control",
          ],
          communicationProtocols: ["Modbus TCP", "DNP3", "IEC 61850", "MQTT", "REST APIs"],
          integrations: [
            "EcoStruxure suite",
            "Third-party systems",
            "Utility DERMS",
            "Market platforms",
          ],
          scalability: {
            maxSites: 100,
            maxAssets: 1000,
            maxPower: 50, // MW
          },
          deployment: "hybrid",
          pricing: {
            setupFee: 150000,
            monthlyPerSite: 2500,
            perMWCapacity: 25000,
            implementationCost: 300000,
          },
          vendor: {
            company: "Schneider Electric",
            contact: "microgrid@schneider-electric.com",
          },
        },
        {
          id: "ge-aems-energy-management",
          manufacturer: "GE Digital",
          model: "Advanced Energy Management System",
          type: "optimization",
          capabilities: [
            "Energy optimization",
            "Asset performance",
            "Predictive analytics",
            "Market integration",
            "Carbon tracking",
            "Reporting",
          ],
          controlledAssets: [
            "Renewable sources",
            "Storage systems",
            "Conventional generation",
            "Flexible loads",
          ],
          algorithms: [
            "Machine learning",
            "Optimization algorithms",
            "Forecasting models",
            "Risk assessment",
          ],
          communicationProtocols: ["OPC UA", "Modbus", "DNP3", "IEC 61850"],
          integrations: ["Predix platform", "Enterprise systems", "Market interfaces"],
          scalability: {
            maxSites: 50,
            maxAssets: 500,
            maxPower: 25, // MW
          },
          deployment: "cloud",
          pricing: {
            setupFee: 200000,
            monthlyPerSite: 3000,
            perMWCapacity: 30000,
            implementationCost: 400000,
          },
          vendor: {
            company: "GE Digital",
            contact: "energy.connections@ge.com",
          },
        },
      ],
      automationSystems: [
        {
          id: "honeywell-building-automation",
          manufacturer: "Honeywell",
          model: "BACnet Building Controller",
          type: "building_automation",
          components: [
            "HVAC control",
            "Lighting control",
            "Security systems",
            "Fire safety",
            "Energy monitoring",
          ],
          controlLoops: 500,
          networkTopology: "BACnet/IP",
          redundancy: "Dual controllers",
          certifications: ["BACnet BTL", "UL listed"],
          pricePerPoint: 185,
          baseSystemCost: 45000,
          vendor: {
            company: "Honeywell Building Solutions",
            contact: "building.solutions@honeywell.com",
          },
        },
      ],
      installationCosts: {
        controllerInstallationPerUnit: 850,
        scadaInstallationPerSystem: 15000,
        networkingPerPoint: 125,
        commissioningPerSystem: 25000,
        trainingPerDay: 2500,
        documentationCost: 8000,
      },
      integrationCosts: {
        protocolGateway: 4500,
        customInterfacing: 185, // per hour
        systemTesting: 3500, // per day
        cybersecuritySetup: 25000,
      },
      maintenanceContracts: {
        annualControllerMaintenance: 0.15, // 15% of equipment cost
        scadaSoftwareMaintenance: 0.2, // 20% of software cost
        systemSupportPerHour: 165,
        remoteMonitoringPerPoint: 45, // per year
      },
    };
  }

  calculateControllerSystemCost(
    controllerId: string,
    quantity: number,
    includeInstallation: boolean = true,
    includeIntegration: boolean = true
  ): {
    controller: Controller | null;
    equipmentCost: number;
    installationCost: number;
    integrationCost: number;
    totalCost: number;
    breakdown: any;
  } {
    // Trigger initialization if not already done
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.ensureInitialized().catch(console.error);
    }
    
    const controller = this.configuration.controllers.find((ctrl) => ctrl.id === controllerId);

    if (!controller) {
      return {
        controller: null,
        equipmentCost: 0,
        installationCost: 0,
        integrationCost: 0,
        totalCost: 0,
        breakdown: {},
      };
    }

    const equipmentCost = controller.pricePerUnit * quantity;

    let installationCost = 0;
    if (includeInstallation) {
      installationCost =
        this.configuration.installationCosts.controllerInstallationPerUnit * quantity +
        this.configuration.installationCosts.commissioningPerSystem +
        this.configuration.installationCosts.documentationCost;
    }

    let integrationCost = 0;
    if (includeIntegration) {
      integrationCost =
        this.configuration.integrationCosts.protocolGateway +
        this.configuration.integrationCosts.cybersecuritySetup +
        this.configuration.integrationCosts.systemTesting * 2; // 2 days testing
    }

    const totalCost = equipmentCost + installationCost + integrationCost;

    return {
      controller,
      equipmentCost,
      installationCost,
      integrationCost,
      totalCost,
      breakdown: {
        equipment: {
          model: controller.model,
          pricePerUnit: controller.pricePerUnit,
          quantity,
          subtotal: equipmentCost,
        },
        installation: includeInstallation
          ? {
              perUnit:
                this.configuration.installationCosts.controllerInstallationPerUnit * quantity,
              commissioning: this.configuration.installationCosts.commissioningPerSystem,
              documentation: this.configuration.installationCosts.documentationCost,
              subtotal: installationCost,
            }
          : null,
        integration: includeIntegration
          ? {
              protocolGateway: this.configuration.integrationCosts.protocolGateway,
              cybersecurity: this.configuration.integrationCosts.cybersecuritySetup,
              testing: this.configuration.integrationCosts.systemTesting * 2,
              subtotal: integrationCost,
            }
          : null,
      },
    };
  }

  calculateScadaSystemCost(
    scadaId: string,
    includeInstallation: boolean = true,
    customizationHours: number = 40
  ): {
    scadaSystem: ScadaSystem | null;
    softwareCost: number;
    hardwareCost: number;
    installationCost: number;
    customizationCost: number;
    totalCost: number;
    annualMaintenanceCost: number;
    breakdown: any;
  } {
    // Trigger initialization if not already done
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.ensureInitialized().catch(console.error);
    }
    
    const scada = this.configuration.scadaSystems.find((s) => s.id === scadaId);

    if (!scada) {
      return {
        scadaSystem: null,
        softwareCost: 0,
        hardwareCost: 0,
        installationCost: 0,
        customizationCost: 0,
        totalCost: 0,
        annualMaintenanceCost: 0,
        breakdown: {},
      };
    }

    const softwareCost = scada.pricePerUnit * 0.6; // 60% software
    const hardwareCost = scada.pricePerUnit * 0.4; // 40% hardware

    let installationCost = 0;
    if (includeInstallation) {
      installationCost =
        this.configuration.installationCosts.scadaInstallationPerSystem +
        this.configuration.installationCosts.trainingPerDay * 3; // 3 days training
    }

    const customizationCost =
      customizationHours * this.configuration.integrationCosts.customInterfacing;

    const totalCost = softwareCost + hardwareCost + installationCost + customizationCost;

    return {
      scadaSystem: scada,
      softwareCost,
      hardwareCost,
      installationCost,
      customizationCost,
      totalCost,
      annualMaintenanceCost: scada.annualMaintenanceCost,
      breakdown: {
        software: {
          licenses: scada.softwareLicenses,
          cost: softwareCost,
        },
        hardware: {
          specifications: scada.hardware,
          cost: hardwareCost,
        },
        installation: includeInstallation
          ? {
              systemInstallation: this.configuration.installationCosts.scadaInstallationPerSystem,
              training: this.configuration.installationCosts.trainingPerDay * 3,
              subtotal: installationCost,
            }
          : null,
        customization: {
          hours: customizationHours,
          hourlyRate: this.configuration.integrationCosts.customInterfacing,
          subtotal: customizationCost,
        },
      },
    };
  }

  calculateEMSCost(
    emsId: string,
    sitesCount: number,
    totalCapacityMW: number,
    implementationMonths: number = 6
  ): {
    ems: EnergyManagementSystem | null;
    setupCost: number;
    implementationCost: number;
    capacityCost: number;
    totalInitialCost: number;
    monthlyOperatingCost: number;
    annualOperatingCost: number;
    breakdown: any;
  } {
    // Trigger initialization if not already done
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.ensureInitialized().catch(console.error);
    }
    
    const ems = this.configuration.energyManagementSystems.find((e) => e.id === emsId);

    if (!ems) {
      return {
        ems: null,
        setupCost: 0,
        implementationCost: 0,
        capacityCost: 0,
        totalInitialCost: 0,
        monthlyOperatingCost: 0,
        annualOperatingCost: 0,
        breakdown: {},
      };
    }

    const setupCost = ems.pricing.setupFee;
    const implementationCost = ems.pricing.implementationCost;
    const capacityCost = ems.pricing.perMWCapacity * totalCapacityMW;
    const totalInitialCost = setupCost + implementationCost + capacityCost;

    const monthlyOperatingCost = ems.pricing.monthlyPerSite * sitesCount;
    const annualOperatingCost = monthlyOperatingCost * 12;

    return {
      ems,
      setupCost,
      implementationCost,
      capacityCost,
      totalInitialCost,
      monthlyOperatingCost,
      annualOperatingCost,
      breakdown: {
        initial: {
          setup: setupCost,
          implementation: implementationCost,
          capacity: capacityCost,
          subtotal: totalInitialCost,
        },
        operating: {
          monthlyPerSite: ems.pricing.monthlyPerSite,
          sitesCount,
          monthlyTotal: monthlyOperatingCost,
          annualTotal: annualOperatingCost,
        },
      },
    };
  }

  getControllersByType(type: string): Controller[] {
    // Trigger initialization if not already started
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.ensureInitialized().catch(console.error);
    }
    return this.configuration.controllers.filter((controller) => controller.type === type);
  }

  getControllersByManufacturer(manufacturer: string): Controller[] {
    // Trigger initialization if not already started
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.ensureInitialized().catch(console.error);
    }
    return this.configuration.controllers.filter((controller) =>
      controller.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
    );
  }

  getConfiguration(): SystemControlsPricingConfiguration {
    // Trigger initialization if not already started
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.ensureInitialized().catch(console.error);
    }
    return this.configuration;
  }

  /**
   * Update configuration (for admin dashboard)
   * Saves to database and updates local cache
   */
  async updateConfiguration(
    newConfig: Partial<SystemControlsPricingConfiguration>
  ): Promise<boolean> {
    this.configuration = { ...this.configuration, ...newConfig };

    // Save to database
    try {
      // Lazy import to avoid TDZ
      const { supabase } = await import("./supabaseClient");
      
      const { error } = await (supabase as any).from("pricing_configurations").upsert(
        {
          config_key: "system_controls_pricing",
          config_category: "system_controls",
          config_data: this.configuration,
          description: "System Controls Pricing Configuration (Controllers, SCADA, EMS)",
          version: "1.0.0",
          is_active: true,
          data_source: "admin",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "config_key",
        }
      );

      if (error) {
        console.error("Error saving system controls pricing to database:", error);
        return false;
      }

      // Clear cache to force refresh
      this.configCache = null;
      this.cacheExpiry = 0;

      if (import.meta.env.DEV) {
        console.log("✅ System Controls pricing saved to database");
      }
      return true;
    } catch (error) {
      console.error("Error updating system controls pricing:", error);
      return false;
    }
  }

  getPricingSummary() {
    return {
      controllers: this.configuration.controllers.map((controller) => ({
        id: controller.id,
        manufacturer: controller.manufacturer,
        model: controller.model,
        type: controller.type,
        application: controller.application,
        pricePerUnit: controller.pricePerUnit,
        communicationProtocols: controller.communicationProtocols,
      })),
      scadaSystems: this.configuration.scadaSystems.map((scada) => ({
        id: scada.id,
        manufacturer: scada.manufacturer,
        model: scada.model,
        type: scada.type,
        pricePerUnit: scada.pricePerUnit,
        annualMaintenanceCost: scada.annualMaintenanceCost,
        capacity: scada.capacity,
      })),
      energyManagementSystems: this.configuration.energyManagementSystems.map((ems) => ({
        id: ems.id,
        manufacturer: ems.manufacturer,
        model: ems.model,
        type: ems.type,
        setupFee: ems.pricing.setupFee,
        monthlyPerSite: ems.pricing.monthlyPerSite,
        perMWCapacity: ems.pricing.perMWCapacity,
      })),
    };
  }
}

// Factory + lazy singleton pattern to prevent TDZ errors
// No top-level instantiation, no top-level supabase import
let _instance: SystemControlsPricingService | null = null;

export function getSystemControlsPricingService(): SystemControlsPricingService {
  if (!_instance) {
    _instance = new SystemControlsPricingService();
  }
  return _instance;
}

// Legacy default export - DEPRECATED, use getSystemControlsPricingService()
export default getSystemControlsPricingService();
