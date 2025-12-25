-- ============================================================================
-- UTILITY RATES VIEW FOR DASHBOARD
-- ============================================================================
-- Created: January 3, 2025
-- Purpose: Create a view to easily query and display utility rates in the pricing dashboard
-- ============================================================================

-- ============================================================================
-- STEP 1: Create view for utility rates summary (grouped by state)
-- ============================================================================

CREATE OR REPLACE VIEW utility_rates_summary AS
SELECT 
    state_code,
    state_name,
    COUNT(DISTINCT utility_id) as utility_count,
    AVG(commercial_rate)::DECIMAL(6,4) as avg_commercial_rate,
    MIN(commercial_rate)::DECIMAL(6,4) as min_commercial_rate,
    MAX(commercial_rate)::DECIMAL(6,4) as max_commercial_rate,
    AVG(demand_charge)::DECIMAL(6,2) as avg_demand_charge,
    COUNT(*) FILTER (WHERE has_tou = true) as tou_utilities_count,
    STRING_AGG(DISTINCT solar_potential, ', ' ORDER BY solar_potential) as solar_potentials,
    STRING_AGG(DISTINCT wind_potential, ', ' ORDER BY wind_potential) as wind_potentials,
    MAX(updated_at) as last_updated
FROM utility_rates
GROUP BY state_code, state_name
ORDER BY state_code;

-- ============================================================================
-- STEP 2: Create view for all utility rates (detailed)
-- ============================================================================

CREATE OR REPLACE VIEW utility_rates_detailed AS
SELECT 
    id,
    state_code,
    state_name,
    utility_id,
    utility_name,
    zip_prefix,
    residential_rate,
    commercial_rate,
    industrial_rate,
    has_tou,
    peak_rate,
    off_peak_rate,
    part_peak_rate,
    peak_hours,
    has_demand_charge,
    demand_charge,
    peak_demand_charge,
    net_metering_available,
    net_metering_type,
    solar_potential,
    wind_potential,
    data_source,
    effective_date,
    created_at,
    updated_at
FROM utility_rates
ORDER BY state_code, utility_name;

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================

COMMENT ON VIEW utility_rates_summary IS 'Summary view of utility rates grouped by state for dashboard display';
COMMENT ON VIEW utility_rates_detailed IS 'Detailed view of all utility rates for detailed dashboard views';

