/**
 * Pricing Configuration Service
 * Centralized management of all equipment pricing assumptions
 * Based on real-world vendor quotes and market intelligence
 *
 * MIGRATED TO DATABASE (January 3, 2025)
 * - Now uses pricing_configurations table as single source of truth
 * - Maintains backward compatibility with localStorage during migration
 */

import { supabase } from "./supabaseClient";

export interface BESSPricingConfig {
  // 4-tier realistic pricing structure for 2025
  smallSystemPerKWh: number; // <1 MWh systems
  mediumSystemPerKWh: number; // 1-5 MWh systems
  mediumLargeSystemPerKWh: number; // 5-15 MWh systems
  largeSystemPerKWh: number; // 15+ MWh systems

  // Reference points for tier boundaries
  smallSystemSizeMWh: number; // 1 MWh threshold
  mediumSystemSizeMWh: number; // 5 MWh threshold
  largeSystemSizeMWh: number; // 15 MWh threshold

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

// Default pricing configuration (fallback if database unavailable)
const defaultBESSPricing: BESSPricingConfig = {
  smallSystemPerKWh: 145,
  mediumSystemPerKWh: 135,
  mediumLargeSystemPerKWh: 120,
  largeSystemPerKWh: 105,
  smallSystemSizeMWh: 1,
  mediumSystemSizeMWh: 5,
  largeSystemSizeMWh: 15,
  degradationRate: 2.4,
  warrantyYears: 11,
  vendorNotes:
    "Q4 2025 realistic BESS pricing tiers: <1MWh=$145/kWh | 1-5MWh=$135/kWh | 5-15MWh=$120/kWh | 15+MWh=$105/kWh. Includes installation, BOS, commissioning, realistic profit margins. LFP technology, 6000+ cycles.",
};

const DEFAULT_PRICING_CONFIG: PricingConfiguration = {
  bess: defaultBESSPricing,
  solar: {
    utilityScalePerWatt: 0.58,
    commercialPerWatt: 0.78,
    smallScalePerWatt: 1.15,
    trackingSystemUpcharge: 12,
    rooftopInstallationFactor: 1.35,
    permittingCostPerWatt: 0.12,
    vendorNotes:
      "NREL ATB Q4 2025 + market intelligence. Solar module prices down 18% YoY. Installation labor optimized with prefab systems.",
  },
  officeBuilding: {
    rooftopInstallationPerKWh: 45,
    basementInstallationPerKWh: 65,
    groundLevelInstallationPerKWh: 25,
    hvacIntegrationCost: 35000,
    buildingAutomationCost: 28000,
    elevatorBackupCost: 45000,
    fireSuppressionPerSqFt: 15,
    cityPermittingBaseCost: 8500,
    structuralAnalysisCost: 12000,
    electricalUpgradeCost: 35000,
    urbanAccessFactor: 1.25,
    highRiseInstallationFactor: 1.4,
    weekendWorkPremium: 1.75,
    vendorNotes:
      "Q4 2025 office building BESS integration costs. Includes fire code compliance (NFPA 855), building code integration, and urban installation challenges.",
  },
  wind: {
    utilityScalePerKW: 1150,
    commercialPerKW: 1350,
    smallScalePerKW: 2100,
    foundationCostPerMW: 48000,
    vendorNotes: "2025 wind market with improved turbine efficiency and installation processes",
  },
  generators: {
    naturalGasPerKW: 300,
    dieselPerKW: 420,
    propanePerKW: 480,
    bioGasPerKW: 650,
    baseInstallationCost: 48000,
    vendorNotes: "Generator pricing updated per Eaton/Cummins market intelligence Q4 2025",
  },
  powerElectronics: {
    inverterPerKW: 140,
    transformerPerKVA: 72,
    switchgearPerKW: 185,
    protectionRelaysPerUnit: 23500,
    vendorNotes:
      "Grid-forming and grid-following capable PCS with enhanced cybersecurity (IEC 62443 compliant)",
  },
  evCharging: {
    level1ACPerUnit: 950,
    level2ACPerUnit: 2850,
    dcFastPerUnit: 38000,
    dcUltraFastPerUnit: 125000,
    pantographChargerPerUnit: 175000,
    networkingCostPerUnit: 2200,
    electricalInfrastructurePerUnit: 8500,
    pavementAndFoundationPerUnit: 3200,
    utilityConnectionCost: 15000,
    permittingPerSite: 6500,
    networkingInstallationPerUnit: 1200,
    maintenancePerUnitPerYear: 750,
    softwareLicensePerUnitPerYear: 480,
    networkFeesPerUnitPerMonth: 45,
    vendorNotes:
      "Commercial EV charging Q4 2025: CCS standard, plug-and-charge, vehicle-to-grid ready infrastructure. Includes full installation and 5-year operational cost estimates.",
  },
  balanceOfPlant: {
    bopPercentage: 11,
    laborCostPerHour: 92,
    epcPercentage: 7.5,
    shippingCostPercentage: 3.2,
    internationalTariffRate: 22,
    contingencyPercentage: 9,
    urbanLaborPremium: 18,
    skillLaborPremiumPercentage: 25,
    unionLaborPremiumPercentage: 32,
    vendorNotes:
      "Q4 2025 BOP costs: modular systems reducing field labor, increased material costs offset by efficiency gains. Regional labor variations reflect market reality.",
  },
  systemControls: {
    scadaSystemBaseCost: 68000,
    cybersecurityComplianceCost: 32000,
    cloudConnectivityPerYear: 8500,
    hmiTouchscreenCost: 12500,
    vendorNotes:
      "Industrial SCADA with AI-powered predictive maintenance, NERC CIP compliance, edge computing integration",
  },
  lastUpdated: new Date().toISOString(),
  updatedBy: "Q4 2025 Market Update",
  version: "2.0.0",
};

class PricingConfigService {
  private config: PricingConfiguration = DEFAULT_PRICING_CONFIG;
  private useDatabase: boolean = true; // Flag to enable/disable database usage
  private configCache: PricingConfiguration | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // ✅ NEW: Single-flight initialization control
  private _readyPromise: Promise<PricingConfiguration> | null = null;
  private _readyResolved: boolean = false;

  constructor() {
    // ✅ DO NOT call async work here - prevents race conditions
    this.config = DEFAULT_PRICING_CONFIG;
  }

  /**
   * ✅ Call this before using pricing - ensures config is loaded
   * Returns frozen configuration for wizard session
   */
  async ready(): Promise<PricingConfiguration> {
    if (this._readyResolved) return this.getConfiguration();

    if (!this._readyPromise) {
      this._readyPromise = (async () => {
        await this.loadConfiguration();
        this._readyResolved = true;
        return this.getConfiguration();
      })();
    }
    return this._readyPromise;
  }

  /**
   * ✅ Guard for SSR safety - only access localStorage in browser
   */
  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  /**
   * Load configuration from database, localStorage, or defaults
   * Priority: Database > localStorage > Defaults
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // Try database first
      if (this.useDatabase) {
        const dbConfig = await this.loadFromDatabase();
        if (dbConfig) {
          this.config = dbConfig;
          // Migrate localStorage to database if it exists and is newer
          await this.migrateLocalStorageToDatabaseSafe();
          return;
        }
      }

      // ✅ Fallback to localStorage ONLY in browser
      if (this.isBrowser()) {
        const savedConfig = localStorage.getItem("pricingConfiguration");
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            if (this.validateConfig(parsed)) {
              this.config = parsed;
              // Try to save to database for future use
              if (this.useDatabase) {
                await this.saveToDatabase(this.config, "Migrated from localStorage");
              }
              return;
            }
          } catch (e) {
            console.warn("Failed to parse localStorage pricing config:", e);
          }
        }
      }

      // Use defaults
      this.config = DEFAULT_PRICING_CONFIG;
    } catch (error) {
      console.error("Error loading pricing configuration:", error);

      // ✅ Safe fallback with browser guard
      if (this.isBrowser()) {
        const savedConfig = localStorage.getItem("pricingConfiguration");
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            this.config = this.validateConfig(parsed) ? parsed : DEFAULT_PRICING_CONFIG;
            return;
          } catch {}
        }
      }
      this.config = DEFAULT_PRICING_CONFIG;
    }
  }

  /**
   * ✅ Browser-safe wrapper for localStorage migration
   */
  private async migrateLocalStorageToDatabaseSafe(): Promise<void> {
    if (!this.isBrowser()) return;
    return this.migrateLocalStorageToDatabase();
  }

  /**
   * Load configuration from database
   */
  private async loadFromDatabase(): Promise<PricingConfiguration | null> {
    // Check cache first
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      // Try new schema first (config_key based)
      let { data, error } = await supabase
        .from("pricing_configurations")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If no data, try legacy schema (is_default based)
      if (error || !data) {
        const legacyQuery = await supabase
          .from("pricing_configurations")
          .select("*")
          .eq("is_active", true)
          .eq("is_default", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!legacyQuery.error && legacyQuery.data) {
          data = legacyQuery.data;
          error = null;
        }
      }

      if (error) {
        // Table might not exist yet - that's okay during migration
        if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
          console.warn("pricing_configurations table not found - using fallback");
          return null;
        }
        // Column doesn't exist - table schema mismatch, use fallback
        if (
          error.code === "42703" ||
          error.message?.includes("column") ||
          error.message?.includes("does not exist")
        ) {
          console.warn("pricing_configurations table schema mismatch - using fallback");
          return null;
        }
        throw error;
      }

      if (!data || !data.config_data) {
        return null;
      }

      // Convert database format to PricingConfiguration
      const config: PricingConfiguration = {
        ...(data.config_data as any),
        lastUpdated: data.last_updated || data.updated_at,
        updatedBy: data.updated_by || "System",
        version: data.version || "1.0.0",
      };

      // Validate the config
      if (!this.validateConfig(config)) {
        if (import.meta.env.DEV) {
          console.warn("[pricingConfigService] Invalid config from DB:", {
            id: data?.id,
            hasConfig: !!data?.config_data,
            sections: Object.keys(data?.config_data || {}),
            bessCheck: typeof (data?.config_data as any)?.bess?.smallSystemPerKWh,
            solarCheck: typeof (data?.config_data as any)?.solar?.commercialPerWatt,
            generatorCheck: typeof (data?.config_data as any)?.generators?.naturalGasPerKW,
          });
        } else {
          console.warn("Invalid config from database, using defaults");
        }
        return null;
      }

      // Cache the result
      this.configCache = config;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION_MS;

      return config;
    } catch (error) {
      console.error("Error loading from database:", error);
      return null;
    }
  }

  /**
   * Save configuration to database
   */
  private async saveToDatabase(config: PricingConfiguration, notes?: string): Promise<boolean> {
    try {
      // First, unset any existing default
      await supabase
        .from("pricing_configurations")
        .update({ is_default: false })
        .eq("is_default", true);

      // Check if default config exists
      const { data: existing } = await supabase
        .from("pricing_configurations")
        .select("id")
        .eq("is_default", true)
        .limit(1)
        .single();

      const configData = {
        name: "Default Pricing Configuration",
        description: "Active pricing configuration for quote calculations",
        version: config.version,
        is_active: true,
        is_default: true,
        config_data: {
          bess: config.bess,
          solar: config.solar,
          officeBuilding: config.officeBuilding,
          wind: config.wind,
          generators: config.generators,
          powerElectronics: config.powerElectronics,
          evCharging: config.evCharging,
          balanceOfPlant: config.balanceOfPlant,
          systemControls: config.systemControls,
        },
        updated_by: config.updatedBy || "System",
        notes: notes || `Updated via pricingConfigService`,
      };

      let error;
      if (existing?.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from("pricing_configurations")
          .update(configData)
          .eq("id", existing.id);
        error = updateError;
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("pricing_configurations")
          .insert(configData);
        error = insertError;
      }

      if (error) {
        // If table doesn't exist, that's okay - we'll use localStorage
        if (error.code === "PGRST116" || error.message?.includes("does not exist")) {
          console.warn("pricing_configurations table not found - saving to localStorage");
          return false;
        }
        throw error;
      }

      // Clear cache
      this.configCache = null;
      this.cacheExpiry = 0;

      return true;
    } catch (error) {
      console.error("Error saving to database:", error);
      return false;
    }
  }

  /**
   * Migrate localStorage config to database if it's newer
   */
  private async migrateLocalStorageToDatabase(): Promise<void> {
    try {
      const savedConfig = localStorage.getItem("pricingConfiguration");
      if (!savedConfig) return;

      const localConfig = JSON.parse(savedConfig);
      if (!this.validateConfig(localConfig)) return;

      // Check if localStorage config is newer
      const localDate = new Date(localConfig.lastUpdated || 0);
      const dbDate = new Date(this.config.lastUpdated || 0);

      if (localDate > dbDate) {
        // localStorage is newer - migrate to database
        console.log("Migrating newer localStorage config to database...");
        await this.saveToDatabase(localConfig, "Migrated from localStorage (newer version)");
        // Keep localStorage as backup
      } else {
        // Database is newer or same - remove localStorage
        localStorage.removeItem("pricingConfiguration");
      }
    } catch (error) {
      console.error("Error during localStorage migration:", error);
    }
  }

  getConfiguration(): PricingConfiguration {
    return { ...this.config };
  }

  async updateConfiguration(newConfig: Partial<PricingConfiguration>): Promise<void> {
    this.config = {
      ...this.config,
      ...newConfig,
      lastUpdated: new Date().toISOString(),
      version: this.incrementVersion(this.config.version),
    };

    // Save to database
    const savedToDb = await this.saveToDatabase(this.config);

    // Also save to localStorage as backup (during migration period)
    if (!savedToDb) {
      localStorage.setItem("pricingConfiguration", JSON.stringify(this.config));
    } else {
      // Remove localStorage if database save succeeded
      localStorage.removeItem("pricingConfiguration");
    }

    // Trigger recalculation of all quotes
    window.dispatchEvent(new CustomEvent("pricingConfigUpdated", { detail: this.config }));
  }

  async updateSection<K extends keyof PricingConfiguration>(
    section: K,
    updates: Partial<PricingConfiguration[K]>
  ): Promise<void> {
    this.config[section] = { ...(this.config[section] as any), ...(updates as any) };
    this.config.lastUpdated = new Date().toISOString();
    this.config.version = this.incrementVersion(this.config.version);

    // Save to database
    const savedToDb = await this.saveToDatabase(this.config);

    // Also save to localStorage as backup
    if (!savedToDb) {
      localStorage.setItem("pricingConfiguration", JSON.stringify(this.config));
    } else {
      localStorage.removeItem("pricingConfiguration");
    }

    window.dispatchEvent(new CustomEvent("pricingConfigUpdated", { detail: this.config }));
  }

  async resetToDefaults(): Promise<void> {
    this.config = {
      ...DEFAULT_PRICING_CONFIG,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
    };

    // Save to database
    await this.saveToDatabase(this.config, "Reset to defaults");

    // Remove localStorage
    localStorage.removeItem("pricingConfiguration");

    window.dispatchEvent(new CustomEvent("pricingConfigUpdated", { detail: this.config }));
  }

  exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  async importConfiguration(configJson: string): Promise<boolean> {
    try {
      const importedConfig = JSON.parse(configJson);
      // Validate the structure
      if (this.validateConfig(importedConfig)) {
        this.config = {
          ...importedConfig,
          lastUpdated: new Date().toISOString(),
          version: this.incrementVersion(this.config.version),
        };

        // Save to database
        const savedToDb = await this.saveToDatabase(this.config, "Imported from JSON");

        // Also save to localStorage as backup
        if (!savedToDb) {
          localStorage.setItem("pricingConfiguration", JSON.stringify(this.config));
        } else {
          localStorage.removeItem("pricingConfiguration");
        }

        window.dispatchEvent(new CustomEvent("pricingConfigUpdated", { detail: this.config }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private validateConfig(config: any): boolean {
    // ✅ Tightened validation: check sections exist AND have valid numeric values
    const requiredSections = [
      "bess",
      "solar",
      "wind",
      "generators",
      "powerElectronics",
      "evCharging",
      "balanceOfPlant",
      "systemControls",
    ];
    
    // Check sections exist
    if (!requiredSections.every((section) => section in config)) {
      return false;
    }

    // ✅ Validate sentinel values to catch partial/corrupt DB rows
    try {
      if (typeof config.bess?.smallSystemPerKWh !== "number" || config.bess.smallSystemPerKWh <= 0) {
        console.warn("Invalid BESS pricing in config");
        return false;
      }
      if (typeof config.solar?.commercialPerWatt !== "number" || config.solar.commercialPerWatt <= 0) {
        console.warn("Invalid solar pricing in config");
        return false;
      }
      if (typeof config.generators?.naturalGasPerKW !== "number" || config.generators.naturalGasPerKW <= 0) {
        console.warn("Invalid generator pricing in config");
        return false;
      }
    } catch (e) {
      console.warn("Pricing config validation error:", e);
      return false;
    }

    return true;
  }

  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const patch = parseInt(parts[2] || "0") + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  // Convenience methods for common calculations
  getBESSCostPerKWh(capacityMWh: number): number {
    if (capacityMWh >= 15) {
      return this.config.bess.largeSystemPerKWh;
    }
    if (capacityMWh >= 5) {
      return this.config.bess.mediumLargeSystemPerKWh;
    }
    if (capacityMWh >= 1) {
      return this.config.bess.mediumSystemPerKWh;
    }
    return this.config.bess.smallSystemPerKWh;
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

  getGeneratorCostPerKW(
    fuelType: "naturalGas" | "diesel" | "propane" | "bioGas" = "naturalGas"
  ): number {
    const fuelTypeMap = {
      naturalGas: "naturalGasPerKW",
      diesel: "dieselPerKW",
      propane: "propanePerKW",
      bioGas: "bioGasPerKW",
    } as const;

    return this.config.generators[fuelTypeMap[fuelType]];
  }

  /**
   * Force refresh from database (clears cache)
   */
  async refreshFromDatabase(): Promise<void> {
    this.configCache = null;
    this.cacheExpiry = 0;
    await this.loadConfiguration();
  }
}

export const pricingConfigService = new PricingConfigService();

/**
 * ✅ Convenient helper for wizard/components - ensures pricing is loaded
 * Use this in Step 3 to get frozen pricing for session
 */
export async function getPricingConfiguration(): Promise<PricingConfiguration> {
  return pricingConfigService.ready();
}

// Main exports
export { PricingConfigService, DEFAULT_PRICING_CONFIG, defaultBESSPricing };
