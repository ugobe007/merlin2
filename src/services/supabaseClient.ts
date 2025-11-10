import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please add them to your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// ====================================================================
// PRICING DATABASE TYPES
// ====================================================================

export interface PricingConfiguration {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  version: string;
  
  // BESS Pricing (Size-weighted)
  bess_small_system_per_kwh: number;
  bess_large_system_per_kwh: number;
  bess_small_system_size_mwh: number;
  bess_large_system_size_mwh: number;
  bess_degradation_rate: number;
  bess_warranty_years: number;
  bess_vendor_notes?: string;
  
  // Solar Pricing
  solar_utility_scale_per_watt: number;
  solar_commercial_per_watt: number;
  solar_small_scale_per_watt: number;
  solar_tracking_upcharge: number;
  solar_vendor_notes?: string;
  
  // Wind Pricing
  wind_utility_scale_per_kw: number;
  wind_commercial_per_kw: number;
  wind_small_scale_per_kw: number;
  wind_foundation_cost_per_mw: number;
  wind_vendor_notes?: string;
  
  // Generator Pricing
  gen_natural_gas_per_kw: number;
  gen_diesel_per_kw: number;
  gen_propane_per_kw: number;
  gen_bio_gas_per_kw: number;
  gen_base_installation_cost: number;
  gen_vendor_notes?: string;
  
  // Power Electronics
  pe_inverter_per_kw: number;
  pe_transformer_per_kva: number;
  pe_switchgear_per_kw: number;
  pe_protection_relays_per_unit: number;
  pe_vendor_notes?: string;
  
  // EV Charging
  ev_level1_ac_per_unit: number;
  ev_level2_ac_per_unit: number;
  ev_dc_fast_per_unit: number;
  ev_dc_ultra_fast_per_unit: number;
  ev_pantograph_charger_per_unit: number;
  ev_networking_cost_per_unit: number;
  ev_vendor_notes?: string;
  
  // Balance of Plant
  bop_percentage: number;
  bop_labor_cost_per_hour: number;
  bop_epc_percentage: number;
  bop_shipping_cost_percentage: number;
  bop_international_tariff_rate: number;
  bop_contingency_percentage: number;
  bop_vendor_notes?: string;
  
  // System Controls
  sc_scada_system_base_cost: number;
  sc_cybersecurity_compliance_cost: number;
  sc_cloud_connectivity_per_year: number;
  sc_hmi_touchscreen_cost: number;
  sc_vendor_notes?: string;
  
  // Audit fields
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface DailyPriceData {
  id: string;
  price_date: string;
  data_source: string;
  source_url?: string;
  validation_status: 'pending' | 'validated' | 'flagged' | 'error';
  
  // BESS Pricing Data
  bess_utility_scale_per_kwh?: number;
  bess_commercial_per_kwh?: number;
  bess_small_scale_per_kwh?: number;
  bess_market_trend?: 'increasing' | 'decreasing' | 'stable';
  
  // Solar Pricing Data
  solar_utility_scale_per_watt?: number;
  solar_commercial_per_watt?: number;
  solar_residential_per_watt?: number;
  
  // Wind Pricing Data
  wind_utility_scale_per_kw?: number;
  wind_commercial_per_kw?: number;
  
  // Generator Pricing Data
  generator_natural_gas_per_kw?: number;
  generator_diesel_per_kw?: number;
  
  // Market Intelligence
  market_volatility_index?: number;
  supply_chain_status?: 'normal' | 'constrained' | 'disrupted';
  demand_forecast?: 'low' | 'moderate' | 'high' | 'very_high';
  technology_maturity?: 'emerging' | 'mature' | 'commodity';
  
  // Alert flags
  price_deviation_percent?: number;
  alert_threshold_exceeded: boolean;
  alert_message?: string;
  
  // Vendor-specific data
  vendor_data?: Record<string, any>;
  raw_data?: Record<string, any>;
  
  // Processing metadata
  processed_at: string;
  processing_duration_ms?: number;
  data_quality_score?: number;
  
  created_at: string;
}

export interface PricingAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  
  price_data_id?: string;
  configuration_id?: string;
  
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  
  alert_data?: Record<string, any>;
  created_at: string;
}

export interface SystemConfiguration {
  id: string;
  config_key: string;
  config_value: Record<string, any>;
  description?: string;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

// ====================================================================
// PRICING CLIENT FUNCTIONS
// ====================================================================

export class PricingClient {
  
  // Get the active (default) pricing configuration
  async getActivePricingConfig(): Promise<PricingConfiguration | null> {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();
    
    if (error) {
      console.error('Error fetching active pricing config:', error);
      return null;
    }
    
    return data;
  }
  
  // Get all pricing configurations
  async getAllPricingConfigs(): Promise<PricingConfiguration[]> {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pricing configs:', error);
      return [];
    }
    
    return data || [];
  }
  
  // Update pricing configuration
  async updatePricingConfig(id: string, updates: Partial<PricingConfiguration>): Promise<PricingConfiguration | null> {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating pricing config:', error);
      return null;
    }
    
    return data;
  }
  
  // Create new pricing configuration
  async createPricingConfig(config: Omit<PricingConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<PricingConfiguration | null> {
    const { data, error } = await supabase
      .from('pricing_configurations')
      .insert(config)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating pricing config:', error);
      return null;
    }
    
    return data;
  }
  
  // Get daily price data for a date range
  async getDailyPriceData(
    startDate: string, 
    endDate: string, 
    dataSource?: string
  ): Promise<DailyPriceData[]> {
    let query = supabase
      .from('daily_price_data')
      .select('*')
      .gte('price_date', startDate)
      .lte('price_date', endDate)
      .order('price_date', { ascending: false });
    
    if (dataSource) {
      query = query.eq('data_source', dataSource);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching daily price data:', error);
      return [];
    }
    
    return data || [];
  }
  
  // Insert daily price data
  async insertDailyPriceData(priceData: Omit<DailyPriceData, 'id' | 'created_at'>): Promise<DailyPriceData | null> {
    const { data, error } = await supabase
      .from('daily_price_data')
      .insert(priceData)
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting daily price data:', error);
      return null;
    }
    
    return data;
  }
  
  // Get unresolved pricing alerts
  async getUnresolvedAlerts(): Promise<PricingAlert[]> {
    const { data, error } = await supabase
      .from('pricing_alerts')
      .select('*')
      .is('resolved_at', null)
      .order('triggered_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching unresolved alerts:', error);
      return [];
    }
    
    return data || [];
  }
  
  // Create pricing alert
  async createPricingAlert(alert: Omit<PricingAlert, 'id' | 'created_at' | 'triggered_at'>): Promise<PricingAlert | null> {
    const { data, error } = await supabase
      .from('pricing_alerts')
      .insert(alert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating pricing alert:', error);
      return null;
    }
    
    return data;
  }
  
  // Calculate size-weighted BESS pricing using database function
  async calculateBESSPricing(energyCapacityMWh: number, configId?: string): Promise<number | null> {
    const { data, error } = await supabase.rpc('calculate_bess_pricing', {
      energy_capacity_mwh: energyCapacityMWh,
      config_id: configId || null
    });
    
    if (error) {
      console.error('Error calculating BESS pricing:', error);
      return null;
    }
    
    return data;
  }
  
  // Get system configuration
  async getSystemConfig(key: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_configuration')
      .select('config_value')
      .eq('config_key', key)
      .single();
    
    if (error) {
      console.error(`Error fetching system config for ${key}:`, error);
      return null;
    }
    
    return data?.config_value;
  }
  
  // Update system configuration
  async updateSystemConfig(key: string, value: any, description?: string): Promise<boolean> {
    const { error } = await supabase
      .from('system_configuration')
      .upsert({
        config_key: key,
        config_value: value,
        description,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error(`Error updating system config for ${key}:`, error);
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export const pricingClient = new PricingClient();

// ====================================================================
// LEGACY VENDOR TYPES (EXISTING)
// ====================================================================
export interface Vendor {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  specialty: 'battery' | 'inverter' | 'ems' | 'bos' | 'epc' | 'integrator';
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_submissions: number;
  approved_submissions: number;
  quotes_included_count: number;
}

export interface VendorProduct {
  id: string;
  vendor_id: string;
  product_category: 'battery' | 'inverter' | 'ems' | 'bos' | 'container';
  manufacturer: string;
  model: string;
  capacity_kwh?: number;
  power_kw?: number;
  voltage_v?: number;
  chemistry?: string;
  efficiency_percent?: number;
  price_per_kwh?: number;
  price_per_kw?: number;
  currency: string;
  lead_time_weeks: number;
  warranty_years: number;
  minimum_order_quantity: number;
  certifications?: string[];
  certification_docs?: Record<string, any>;
  datasheet_url?: string;
  datasheet_filename?: string;
  status: 'pending' | 'approved' | 'rejected' | 'discontinued';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  times_quoted: number;
  times_selected: number;
}

export interface RFQ {
  id: string;
  rfq_number: string;
  project_name: string;
  system_size_mw: number;
  duration_hours: number;
  location: string;
  state_province?: string;
  country: string;
  requirements?: string;
  preferred_chemistry?: string;
  delivery_deadline?: string;
  due_date: string;
  project_start_date?: string;
  status: 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled';
  target_specialties?: string[];
  invited_vendors?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  response_count: number;
}

export interface RFQResponse {
  id: string;
  rfq_id: string;
  vendor_id: string;
  total_price: number;
  currency: string;
  lead_time_weeks: number;
  warranty_years: number;
  pricing_breakdown: Record<string, any>;
  technical_proposal?: string;
  value_proposition?: string;
  proposal_document_url?: string;
  proposal_filename?: string;
  supporting_docs?: Record<string, any>;
  status: 'draft' | 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected';
  evaluation_score?: number;
  evaluation_notes?: string;
  evaluated_by?: string;
  evaluated_at?: string;
  submitted_at: string;
  updated_at: string;
}

export interface VendorNotification {
  id: string;
  vendor_id: string;
  type: string;
  title: string;
  message: string;
  related_rfq_id?: string;
  related_product_id?: string;
  is_read: boolean;
  read_at?: string;
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

export default supabase;
