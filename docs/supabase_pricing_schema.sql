-- Supabase Database Schema for Pricing and Configuration Management
-- This schema supports the size-weighted BESS pricing system and daily market updates

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ====================================================================
-- PRICING CONFIGURATIONS TABLE
-- ====================================================================
-- Stores complete pricing configuration for all energy components
create table pricing_configurations (
  id uuid default uuid_generate_v4() primary key,
  
  -- Metadata
  name varchar(100) not null,
  description text,
  is_active boolean default true,
  is_default boolean default false,
  version varchar(20) not null default '1.0.0',
  
  -- BESS Pricing Configuration (Size-weighted)
  bess_small_system_per_kwh decimal(10,2) not null default 155.00, -- $/kWh for ≤2MWh
  bess_large_system_per_kwh decimal(10,2) not null default 105.00, -- $/kWh for ≥15MWh (floor)
  bess_small_system_size_mwh decimal(8,2) not null default 2.00,   -- Reference size for small systems
  bess_large_system_size_mwh decimal(8,2) not null default 15.00,  -- Threshold for large systems
  bess_degradation_rate decimal(5,3) not null default 2.500,        -- Annual % degradation
  bess_warranty_years integer not null default 10,
  bess_vendor_notes text,
  
  -- Solar Pricing Configuration
  solar_utility_scale_per_watt decimal(8,4) not null default 0.6500, -- $/W for >5MW
  solar_commercial_per_watt decimal(8,4) not null default 0.8500,     -- $/W for 100kW-5MW
  solar_small_scale_per_watt decimal(8,4) not null default 1.2500,    -- $/W for <100kW
  solar_tracking_upcharge decimal(5,2) not null default 15.00,        -- % upcharge for tracking
  solar_vendor_notes text,
  
  -- Wind Pricing Configuration
  wind_utility_scale_per_kw decimal(10,2) not null default 1200.00,  -- $/kW for >10MW
  wind_commercial_per_kw decimal(10,2) not null default 1400.00,      -- $/kW for 1-10MW
  wind_small_scale_per_kw decimal(10,2) not null default 2200.00,     -- $/kW for <1MW
  wind_foundation_cost_per_mw decimal(10,2) not null default 50000.00,
  wind_vendor_notes text,
  
  -- Generator Pricing Configuration
  gen_natural_gas_per_kw decimal(10,2) not null default 800.00,
  gen_diesel_per_kw decimal(10,2) not null default 600.00,
  gen_propane_per_kw decimal(10,2) not null default 900.00,
  gen_bio_gas_per_kw decimal(10,2) not null default 1200.00,
  gen_base_installation_cost decimal(10,2) not null default 50000.00,
  gen_vendor_notes text,
  
  -- Power Electronics Configuration
  pe_inverter_per_kw decimal(8,2) not null default 150.00,
  pe_transformer_per_kva decimal(8,2) not null default 75.00,
  pe_switchgear_per_kw decimal(8,2) not null default 200.00,
  pe_protection_relays_per_unit decimal(10,2) not null default 25000.00,
  pe_vendor_notes text,
  
  -- EV Charging Configuration
  ev_level1_ac_per_unit decimal(10,2) not null default 1200.00,
  ev_level2_ac_per_unit decimal(10,2) not null default 3500.00,
  ev_dc_fast_per_unit decimal(10,2) not null default 45000.00,
  ev_dc_ultra_fast_per_unit decimal(10,2) not null default 150000.00,
  ev_pantograph_charger_per_unit decimal(10,2) not null default 200000.00,
  ev_networking_cost_per_unit decimal(10,2) not null default 2500.00,
  ev_vendor_notes text,
  
  -- Balance of Plant Configuration
  bop_percentage decimal(5,2) not null default 12.00,           -- Max 15% guideline
  bop_labor_cost_per_hour decimal(8,2) not null default 85.00,
  bop_epc_percentage decimal(5,2) not null default 8.00,
  bop_shipping_cost_percentage decimal(5,2) not null default 3.00,
  bop_international_tariff_rate decimal(5,2) not null default 25.00,
  bop_contingency_percentage decimal(5,2) not null default 10.00,
  bop_vendor_notes text,
  
  -- System Controls Configuration
  sc_scada_system_base_cost decimal(10,2) not null default 75000.00,
  sc_cybersecurity_compliance_cost decimal(10,2) not null default 25000.00,
  sc_cloud_connectivity_per_year decimal(10,2) not null default 12000.00,
  sc_hmi_touchscreen_cost decimal(10,2) not null default 15000.00,
  sc_vendor_notes text,
  
  -- Audit fields
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by varchar(100) default 'system',
  updated_by varchar(100) default 'system'
);

-- Add constraints and indexes
create unique index pricing_configurations_name_idx on pricing_configurations(name);
create index pricing_configurations_active_idx on pricing_configurations(is_active);
create index pricing_configurations_default_idx on pricing_configurations(is_default);
create index pricing_configurations_updated_at_idx on pricing_configurations(updated_at);

-- Ensure only one default configuration
create unique index pricing_configurations_single_default_idx 
  on pricing_configurations(is_default) 
  where is_default = true;

-- ====================================================================
-- DAILY PRICE DATA TABLE
-- ====================================================================
-- Stores daily price validation data from multiple sources
create table daily_price_data (
  id uuid default uuid_generate_v4() primary key,
  
  -- Date and source information
  price_date date not null,
  data_source varchar(50) not null, -- 'nrel_atb', 'bloomberg_nef', 'wood_mackenzie', 'vendor_specific'
  source_url text,
  validation_status varchar(20) default 'pending', -- 'pending', 'validated', 'flagged', 'error'
  
  -- BESS Pricing Data
  bess_utility_scale_per_kwh decimal(8,2),     -- $/kWh for >15MWh systems
  bess_commercial_per_kwh decimal(8,2),        -- $/kWh for 2-15MWh systems  
  bess_small_scale_per_kwh decimal(8,2),       -- $/kWh for <2MWh systems
  bess_market_trend varchar(20),               -- 'increasing', 'decreasing', 'stable'
  
  -- Solar Pricing Data
  solar_utility_scale_per_watt decimal(8,4),
  solar_commercial_per_watt decimal(8,4),
  solar_residential_per_watt decimal(8,4),
  
  -- Wind Pricing Data
  wind_utility_scale_per_kw decimal(10,2),
  wind_commercial_per_kw decimal(10,2),
  
  -- Generator Pricing Data
  generator_natural_gas_per_kw decimal(10,2),
  generator_diesel_per_kw decimal(10,2),
  
  -- Market Intelligence
  market_volatility_index decimal(5,2),        -- 0-100 scale
  supply_chain_status varchar(20),             -- 'normal', 'constrained', 'disrupted'
  demand_forecast varchar(20),                 -- 'low', 'moderate', 'high', 'very_high'
  technology_maturity varchar(20),             -- 'emerging', 'mature', 'commodity'
  
  -- Alert flags
  price_deviation_percent decimal(5,2),        -- % deviation from baseline
  alert_threshold_exceeded boolean default false,
  alert_message text,
  
  -- Vendor-specific data (JSON for flexibility)
  vendor_data jsonb,
  raw_data jsonb,                              -- Store complete raw response
  
  -- Processing metadata
  processed_at timestamp with time zone default timezone('utc'::text, now()),
  processing_duration_ms integer,
  data_quality_score decimal(3,2),             -- 0-1.0 quality score
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for efficient querying
create index daily_price_data_date_idx on daily_price_data(price_date desc);
create index daily_price_data_source_idx on daily_price_data(data_source);
create index daily_price_data_status_idx on daily_price_data(validation_status);
create index daily_price_data_alert_idx on daily_price_data(alert_threshold_exceeded) where alert_threshold_exceeded = true;
create unique index daily_price_data_date_source_idx on daily_price_data(price_date, data_source);

-- ====================================================================
-- PRICING ALERTS TABLE
-- ====================================================================
-- Track pricing alerts and notifications
create table pricing_alerts (
  id uuid default uuid_generate_v4() primary key,
  alert_type varchar(50) not null,             -- 'price_deviation', 'market_trend', 'data_quality'
  severity varchar(20) not null,               -- 'low', 'medium', 'high', 'critical'
  title varchar(200) not null,
  message text not null,
  
  -- Related data
  price_data_id uuid references daily_price_data(id),
  configuration_id uuid references pricing_configurations(id),
  
  -- Alert metadata
  triggered_at timestamp with time zone default timezone('utc'::text, now()),
  acknowledged_at timestamp with time zone,
  acknowledged_by varchar(100),
  resolved_at timestamp with time zone,
  resolved_by varchar(100),
  
  -- Alert data (JSON for flexibility)
  alert_data jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index pricing_alerts_type_idx on pricing_alerts(alert_type);
create index pricing_alerts_severity_idx on pricing_alerts(severity);
create index pricing_alerts_triggered_idx on pricing_alerts(triggered_at desc);
create index pricing_alerts_unresolved_idx on pricing_alerts(resolved_at) where resolved_at is null;

-- ====================================================================
-- SYSTEM CONFIGURATION TABLE
-- ====================================================================
-- Store application-wide configuration settings
create table system_configuration (
  id uuid default uuid_generate_v4() primary key,
  config_key varchar(100) unique not null,
  config_value jsonb not null,
  description text,
  is_sensitive boolean default false,          -- Flag for sensitive data
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by varchar(100) default 'system'
);

create index system_configuration_key_idx on system_configuration(config_key);

-- ====================================================================
-- INSERT DEFAULT DATA
-- ====================================================================

-- Default pricing configuration
insert into pricing_configurations (
  name, description, is_default, is_active,
  bess_small_system_per_kwh, bess_large_system_per_kwh,
  bess_small_system_size_mwh, bess_large_system_size_mwh,
  bess_vendor_notes,
  created_by, updated_by
) values (
  'Default Size-Weighted Pricing',
  'Market-validated size-weighted BESS pricing with Mainspring integration capability',
  true, true,
  155.00, 105.00, 2.00, 15.00,
  'Size-weighted pricing: $155/kWh @ 2MWh → $105/kWh @ 15+MWh. Includes Mainspring hybrid capability for microgrid applications.',
  'system_init', 'system_init'
);

-- System configuration defaults
insert into system_configuration (config_key, config_value, description) values
  ('daily_sync_enabled', 'true', 'Enable daily price data synchronization'),
  ('daily_sync_time', '"06:00"', 'Time for daily price sync (UTC)'),
  ('price_alert_thresholds', '{"deviation_percent": 15, "quality_threshold": 0.8}', 'Alert thresholds for price validation'),
  ('vendor_api_settings', '{"timeout_ms": 30000, "retry_attempts": 3}', 'API settings for vendor data collection'),
  ('market_intelligence_sources', '["nrel_atb", "bloomberg_nef", "wood_mackenzie"]', 'Active market intelligence sources');

-- ====================================================================
-- RLS (Row Level Security) POLICIES
-- ====================================================================
-- Enable RLS for all tables
alter table pricing_configurations enable row level security;
alter table daily_price_data enable row level security;
alter table pricing_alerts enable row level security;
alter table system_configuration enable row level security;

-- For now, allow all operations (you can restrict based on user roles later)
create policy "Allow all operations on pricing_configurations" on pricing_configurations for all using (true);
create policy "Allow all operations on daily_price_data" on daily_price_data for all using (true);
create policy "Allow all operations on pricing_alerts" on pricing_alerts for all using (true);
create policy "Allow all operations on system_configuration" on system_configuration for all using (true);

-- ====================================================================
-- FUNCTIONS AND TRIGGERS
-- ====================================================================

-- Update the updated_at timestamp automatically
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language 'plpgsql';

-- Add triggers for updated_at
create trigger update_pricing_configurations_updated_at 
  before update on pricing_configurations 
  for each row execute procedure update_updated_at_column();

create trigger update_system_configuration_updated_at 
  before update on system_configuration 
  for each row execute procedure update_updated_at_column();

-- Function to calculate size-weighted BESS pricing
create or replace function calculate_bess_pricing(
  energy_capacity_mwh decimal,
  config_id uuid default null
)
returns decimal as $$
declare
  config_row pricing_configurations;
  interpolated_price decimal;
  capacity_ratio decimal;
  size_delta decimal;
  price_delta decimal;
begin
  -- Get the configuration (default if not specified)
  if config_id is null then
    select * into config_row 
    from pricing_configurations 
    where is_default = true and is_active = true 
    limit 1;
  else
    select * into config_row 
    from pricing_configurations 
    where id = config_id and is_active = true;
  end if;
  
  if not found then
    raise exception 'No active pricing configuration found';
  end if;
  
  -- Apply floor pricing for large systems
  if energy_capacity_mwh >= config_row.bess_large_system_size_mwh then
    return config_row.bess_large_system_per_kwh;
  end if;
  
  -- Apply small system pricing for small systems
  if energy_capacity_mwh <= config_row.bess_small_system_size_mwh then
    return config_row.bess_small_system_per_kwh;
  end if;
  
  -- Linear interpolation for mid-range systems
  size_delta := config_row.bess_large_system_size_mwh - config_row.bess_small_system_size_mwh;
  price_delta := config_row.bess_small_system_per_kwh - config_row.bess_large_system_per_kwh;
  
  capacity_ratio := (energy_capacity_mwh - config_row.bess_small_system_size_mwh) / size_delta;
  interpolated_price := config_row.bess_small_system_per_kwh - (price_delta * capacity_ratio);
  
  return greatest(interpolated_price, config_row.bess_large_system_per_kwh);
end;
$$ language plpgsql;