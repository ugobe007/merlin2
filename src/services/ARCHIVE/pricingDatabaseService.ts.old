// Pricing Database Service
// Manages CRUD operations for pricing configurations and daily price data in Supabase

import { pricingClient } from './supabaseClient';
import type { PricingConfiguration, DailyPriceData, PricingAlert } from './supabaseClient';
import { pricingConfigService } from './pricingConfigService';
import type { PricingConfiguration as LocalPricingConfig } from './pricingConfigService';

export interface DatabaseSyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface PricingSync {
  lastSyncAt: string;
  syncStatus: 'success' | 'error' | 'in_progress';
  recordsProcessed: number;
  errorMessage?: string;
}

export class PricingDatabaseService {
  private isConnected = false;
  private lastSync: PricingSync | null = null;

  constructor() {
    this.initializeConnection();
  }

  // Initialize connection and sync status
  async initializeConnection(): Promise<void> {
    try {
      // Test connection by fetching system config
      const testConfig = await pricingClient.getSystemConfig('daily_sync_enabled');
      this.isConnected = testConfig !== null;
      
      if (this.isConnected) {
        console.log('✅ Pricing database service connected to Supabase');
        await this.loadLastSyncStatus();
      } else {
        console.warn('⚠️ Pricing database service: Supabase connection not available');
      }
    } catch (error) {
      console.error('❌ Failed to initialize pricing database service:', error);
      this.isConnected = false;
    }
  }

  // Check if database is available
  isDatabaseAvailable(): boolean {
    return this.isConnected;
  }

  // ====================================================================
  // PRICING CONFIGURATION MANAGEMENT
  // ====================================================================

  // Sync local pricing configuration to database
  async syncLocalConfigToDatabase(): Promise<DatabaseSyncResult> {
    if (!this.isConnected) {
      return { success: false, message: 'Database not available', error: 'No connection' };
    }

    try {
      const localConfig = pricingConfigService.getConfiguration();
      
      // Convert local config to database format
      const dbConfig: Omit<PricingConfiguration, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Local Configuration Sync',
        description: 'Synchronized from local pricing configuration service',
        is_active: true,
        is_default: false,
        version: localConfig.version,
        
        // BESS Configuration
        bess_small_system_per_kwh: localConfig.bess.smallSystemPerKWh,
        bess_large_system_per_kwh: localConfig.bess.largeSystemPerKWh,
        bess_small_system_size_mwh: localConfig.bess.smallSystemSizeMWh,
        bess_large_system_size_mwh: localConfig.bess.largeSystemSizeMWh,
        bess_degradation_rate: localConfig.bess.degradationRate,
        bess_warranty_years: localConfig.bess.warrantyYears,
        bess_vendor_notes: localConfig.bess.vendorNotes,
        
        // Solar Configuration
        solar_utility_scale_per_watt: localConfig.solar.utilityScalePerWatt,
        solar_commercial_per_watt: localConfig.solar.commercialPerWatt,
        solar_small_scale_per_watt: localConfig.solar.smallScalePerWatt,
        solar_tracking_upcharge: localConfig.solar.trackingSystemUpcharge,
        solar_vendor_notes: localConfig.solar.vendorNotes,
        
        // Wind Configuration
        wind_utility_scale_per_kw: localConfig.wind.utilityScalePerKW,
        wind_commercial_per_kw: localConfig.wind.commercialPerKW,
        wind_small_scale_per_kw: localConfig.wind.smallScalePerKW,
        wind_foundation_cost_per_mw: localConfig.wind.foundationCostPerMW,
        wind_vendor_notes: localConfig.wind.vendorNotes,
        
        // Generator Configuration
        gen_natural_gas_per_kw: localConfig.generators.naturalGasPerKW,
        gen_diesel_per_kw: localConfig.generators.dieselPerKW,
        gen_propane_per_kw: localConfig.generators.propanePerKW,
        gen_bio_gas_per_kw: localConfig.generators.bioGasPerKW,
        gen_base_installation_cost: localConfig.generators.baseInstallationCost,
        gen_vendor_notes: localConfig.generators.vendorNotes,
        
        // Power Electronics Configuration
        pe_inverter_per_kw: localConfig.powerElectronics.inverterPerKW,
        pe_transformer_per_kva: localConfig.powerElectronics.transformerPerKVA,
        pe_switchgear_per_kw: localConfig.powerElectronics.switchgearPerKW,
        pe_protection_relays_per_unit: localConfig.powerElectronics.protectionRelaysPerUnit,
        pe_vendor_notes: localConfig.powerElectronics.vendorNotes,
        
        // EV Charging Configuration
        ev_level1_ac_per_unit: localConfig.evCharging.level1ACPerUnit,
        ev_level2_ac_per_unit: localConfig.evCharging.level2ACPerUnit,
        ev_dc_fast_per_unit: localConfig.evCharging.dcFastPerUnit,
        ev_dc_ultra_fast_per_unit: localConfig.evCharging.dcUltraFastPerUnit,
        ev_pantograph_charger_per_unit: localConfig.evCharging.pantographChargerPerUnit,
        ev_networking_cost_per_unit: localConfig.evCharging.networkingCostPerUnit,
        ev_vendor_notes: localConfig.evCharging.vendorNotes,
        
        // Balance of Plant Configuration
        bop_percentage: localConfig.balanceOfPlant.bopPercentage,
        bop_labor_cost_per_hour: localConfig.balanceOfPlant.laborCostPerHour,
        bop_epc_percentage: localConfig.balanceOfPlant.epcPercentage,
        bop_shipping_cost_percentage: localConfig.balanceOfPlant.shippingCostPercentage,
        bop_international_tariff_rate: localConfig.balanceOfPlant.internationalTariffRate,
        bop_contingency_percentage: localConfig.balanceOfPlant.contingencyPercentage,
        bop_vendor_notes: localConfig.balanceOfPlant.vendorNotes,
        
        // System Controls Configuration
        sc_scada_system_base_cost: localConfig.systemControls.scadaSystemBaseCost,
        sc_cybersecurity_compliance_cost: localConfig.systemControls.cybersecurityComplianceCost,
        sc_cloud_connectivity_per_year: localConfig.systemControls.cloudConnectivityPerYear,
        sc_hmi_touchscreen_cost: localConfig.systemControls.hmiTouchscreenCost,
        sc_vendor_notes: localConfig.systemControls.vendorNotes,
        
        created_by: 'local_sync',
        updated_by: 'local_sync'
      };

      const result = await pricingClient.createPricingConfig(dbConfig);
      
      if (result) {
        return {
          success: true,
          message: 'Local configuration synced to database',
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Failed to sync local configuration',
          error: 'Database operation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error syncing local configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Load pricing configuration from database
  async loadConfigurationFromDatabase(): Promise<DatabaseSyncResult> {
    if (!this.isConnected) {
      return { success: false, message: 'Database not available', error: 'No connection' };
    }

    try {
      const dbConfig = await pricingClient.getActivePricingConfig();
      
      if (!dbConfig) {
        return {
          success: false,
          message: 'No active configuration found in database',
          error: 'No data'
        };
      }

      // Convert database config to local format
      const localConfig: Partial<LocalPricingConfig> = {
        bess: {
          smallSystemPerKWh: dbConfig.bess_small_system_per_kwh || 145,
          mediumSystemPerKWh: 135, // 1-5 MWh tier
          mediumLargeSystemPerKWh: 120, // 5-15 MWh tier
          largeSystemPerKWh: dbConfig.bess_large_system_per_kwh || 105,
          smallSystemSizeMWh: dbConfig.bess_small_system_size_mwh || 1,
          mediumSystemSizeMWh: 5, // 5 MWh threshold
          largeSystemSizeMWh: dbConfig.bess_large_system_size_mwh || 15,
          degradationRate: dbConfig.bess_degradation_rate || 2.4,
          warrantyYears: dbConfig.bess_warranty_years || 11,
          vendorNotes: dbConfig.bess_vendor_notes || 'Realistic Q4 2025 BESS pricing tiers'
        },
        solar: {
          utilityScalePerWatt: dbConfig.solar_utility_scale_per_watt,
          commercialPerWatt: dbConfig.solar_commercial_per_watt,
          smallScalePerWatt: dbConfig.solar_small_scale_per_watt,
          trackingSystemUpcharge: dbConfig.solar_tracking_upcharge,
          rooftopInstallationFactor: 1.35, // Default value - not in database yet
          permittingCostPerWatt: 0.12, // Default value - not in database yet
          vendorNotes: dbConfig.solar_vendor_notes || ''
        },
        wind: {
          utilityScalePerKW: dbConfig.wind_utility_scale_per_kw,
          commercialPerKW: dbConfig.wind_commercial_per_kw,
          smallScalePerKW: dbConfig.wind_small_scale_per_kw,
          foundationCostPerMW: dbConfig.wind_foundation_cost_per_mw,
          vendorNotes: dbConfig.wind_vendor_notes || ''
        },
        lastUpdated: dbConfig.updated_at,
        updatedBy: dbConfig.updated_by,
        version: dbConfig.version
      };

      // Update local configuration service
      pricingConfigService.updateConfiguration(localConfig);

      return {
        success: true,
        message: 'Configuration loaded from database',
        data: dbConfig
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error loading configuration from database',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ====================================================================
  // DAILY PRICE DATA MANAGEMENT
  // ====================================================================

  // Store daily price validation data
  async storeDailyPriceData(
    date: string,
    source: string,
    priceData: Partial<DailyPriceData>
  ): Promise<DatabaseSyncResult> {
    if (!this.isConnected) {
      return { success: false, message: 'Database not available', error: 'No connection' };
    }

    try {
      const dailyData: Omit<DailyPriceData, 'id' | 'created_at'> = {
        price_date: date,
        data_source: source,
        validation_status: 'validated',
        processed_at: new Date().toISOString(),
        alert_threshold_exceeded: false,
        ...priceData
      };

      const result = await pricingClient.insertDailyPriceData(dailyData);
      
      if (result) {
        return {
          success: true,
          message: `Daily price data stored for ${date}`,
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Failed to store daily price data',
          error: 'Database operation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error storing daily price data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get recent price trends
  async getPriceTrends(days: number = 30): Promise<DailyPriceData[]> {
    if (!this.isConnected) return [];

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    return await pricingClient.getDailyPriceData(startDate, endDate);
  }

  // ====================================================================
  // ALERT MANAGEMENT
  // ====================================================================

  // Create pricing alert
  async createAlert(
    alertType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    additionalData?: Record<string, any>
  ): Promise<DatabaseSyncResult> {
    if (!this.isConnected) {
      return { success: false, message: 'Database not available', error: 'No connection' };
    }

    try {
      const alert = {
        alert_type: alertType,
        severity,
        title,
        message,
        alert_data: additionalData
      };

      const result = await pricingClient.createPricingAlert(alert);
      
      if (result) {
        return {
          success: true,
          message: 'Alert created successfully',
          data: result
        };
      } else {
        return {
          success: false,
          message: 'Failed to create alert',
          error: 'Database operation failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error creating alert',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get active alerts
  async getActiveAlerts(): Promise<PricingAlert[]> {
    if (!this.isConnected) return [];
    return await pricingClient.getUnresolvedAlerts();
  }

  // ====================================================================
  // SYNC STATUS MANAGEMENT
  // ====================================================================

  private async loadLastSyncStatus(): Promise<void> {
    try {
      const syncStatus = await pricingClient.getSystemConfig('last_pricing_sync');
      this.lastSync = syncStatus || null;
    } catch (error) {
      console.error('Error loading last sync status:', error);
    }
  }

  async updateSyncStatus(sync: PricingSync): Promise<void> {
    this.lastSync = sync;
    
    if (this.isConnected) {
      await pricingClient.updateSystemConfig('last_pricing_sync', sync);
    }
  }

  getLastSync(): PricingSync | null {
    return this.lastSync;
  }

  // ====================================================================
  // UTILITY METHODS
  // ====================================================================

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await pricingClient.getSystemConfig('daily_sync_enabled');
      return result !== null;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<Record<string, any>> {
    if (!this.isConnected) return {};

    try {
      const [configs, recentAlerts, recentData] = await Promise.all([
        pricingClient.getAllPricingConfigs(),
        pricingClient.getUnresolvedAlerts(),
        this.getPriceTrends(7) // Last 7 days
      ]);

      return {
        totalConfigurations: configs.length,
        activeConfigurations: configs.filter(c => c.is_active).length,
        unresolvedAlerts: recentAlerts.length,
        recentDataPoints: recentData.length,
        lastDataUpdate: recentData[0]?.price_date || 'Never',
        connectionStatus: 'Connected',
        lastSync: this.lastSync
      };
    } catch (error) {
      return {
        connectionStatus: 'Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const pricingDatabaseService = new PricingDatabaseService();