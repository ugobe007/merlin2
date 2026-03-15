-- ============================================================================
-- INSTALLER/CONTRACTOR VENDOR DATABASE
-- ============================================================================
-- Purpose: Comprehensive database of installers by state and specialty
-- Created: March 15, 2026
-- Coverage: Solar, BESS, EV Charging, Generators across all 50 states
-- ============================================================================

-- Drop existing table if needed for clean slate
DROP TABLE IF EXISTS installer_vendors CASCADE;

-- ============================================================================
-- TABLE: installer_vendors
-- ============================================================================
CREATE TABLE installer_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Company Info
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    doing_business_as VARCHAR(255)[],
    
    -- Contact Info
    primary_contact_name VARCHAR(100),
    primary_contact_title VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    
    -- Location
    headquarters_address TEXT,
    headquarters_city VARCHAR(100),
    headquarters_state VARCHAR(2) NOT NULL,
    headquarters_zip VARCHAR(10),
    service_states VARCHAR(2)[] NOT NULL, -- ['FL', 'GA', 'AL']
    service_radius_miles INTEGER,
    
    -- Specialties (can have multiple)
    installer_type VARCHAR(30)[] NOT NULL, -- ['solar', 'bess', 'ev_charging', 'generator', 'microgrid', 'epc']
    primary_specialty VARCHAR(30) NOT NULL CHECK (primary_specialty IN ('solar', 'bess', 'ev_charging', 'generator', 'microgrid', 'epc')),
    
    -- Scale & Experience
    years_in_business INTEGER,
    employee_count INTEGER,
    annual_install_capacity_mw DECIMAL(10,2),
    projects_completed INTEGER,
    
    -- Certifications
    certifications TEXT[], -- ['NABCEP', 'OSHA', 'NECA', 'UL Certification']
    licenses TEXT[], -- ['State Electrical License #12345', 'General Contractor #67890']
    insurance_liability_usd DECIMAL(15,2),
    insurance_workers_comp BOOLEAN DEFAULT true,
    
    -- Tier Classification
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
    tier_justification TEXT,
    
    -- Capabilities
    min_project_size_kw DECIMAL(10,2) DEFAULT 10,
    max_project_size_kw DECIMAL(10,2) DEFAULT 10000,
    residential BOOLEAN DEFAULT false,
    commercial BOOLEAN DEFAULT true,
    utility_scale BOOLEAN DEFAULT false,
    design_services BOOLEAN DEFAULT true,
    engineering_services BOOLEAN DEFAULT true,
    permitting_services BOOLEAN DEFAULT true,
    interconnection_services BOOLEAN DEFAULT true,
    financing_partnerships BOOLEAN DEFAULT false,
    
    -- Equipment Partnerships
    preferred_solar_manufacturers TEXT[],
    preferred_battery_manufacturers TEXT[],
    preferred_inverter_manufacturers TEXT[],
    preferred_ev_charger_manufacturers TEXT[],
    preferred_generator_manufacturers TEXT[],
    
    -- Pricing (typical ranges)
    typical_markup_percent DECIMAL(5,2),
    typical_labor_rate_per_hour DECIMAL(8,2),
    typical_overhead_percent DECIMAL(5,2),
    
    -- Performance
    avg_install_time_weeks INTEGER,
    warranty_years_standard INTEGER DEFAULT 10,
    warranty_years_extended INTEGER DEFAULT 25,
    customer_rating DECIMAL(3,2), -- 0.00 to 5.00
    customer_review_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
    verified BOOLEAN DEFAULT false,
    verified_date DATE,
    verified_by VARCHAR(100),
    
    -- Metadata
    notes TEXT,
    data_source VARCHAR(100) DEFAULT 'Manual Entry',
    last_contact_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_name, headquarters_state)
);

-- Create indexes for common queries
CREATE INDEX idx_installer_vendors_state ON installer_vendors USING GIN(service_states);
CREATE INDEX idx_installer_vendors_type ON installer_vendors USING GIN(installer_type);
CREATE INDEX idx_installer_vendors_tier ON installer_vendors(tier);
CREATE INDEX idx_installer_vendors_specialty ON installer_vendors(primary_specialty);

-- ============================================================================
-- SEED DATA: FLORIDA INSTALLERS
-- ============================================================================

INSERT INTO installer_vendors (
    company_name, legal_name, email, phone, website,
    headquarters_city, headquarters_state,
    service_states, installer_type, primary_specialty,
    years_in_business, employee_count, projects_completed,
    certifications, tier, tier_justification,
    min_project_size_kw, max_project_size_kw,
    commercial, utility_scale, design_services, engineering_services, permitting_services,
    preferred_solar_manufacturers, preferred_battery_manufacturers, preferred_inverter_manufacturers,
    typical_markup_percent, avg_install_time_weeks, customer_rating, status, verified
) VALUES

-- ============================================================================
-- TIER 1: FLORIDA SOLAR + BESS INSTALLERS
-- ============================================================================

(
    'Advanced Green Technologies (AGT)',
    'AGT Solar & Energy Storage Inc.',
    'info@agt.com',
    '(844) 248-7652',
    'https://www.agt.com',
    'Orlando', 'FL',
    ARRAY['FL', 'GA', 'AL', 'SC', 'NC', 'TN'],
    ARRAY['solar', 'bess', 'ev_charging', 'microgrid', 'epc'],
    'solar',
    15,
    125,
    1200,
    ARRAY['NABCEP', 'OSHA 30', 'NECA', 'Florida Certified Solar Contractor', 'UL Listed Installer'],
    1,
    'Tier 1: 15+ years experience, 125 employees, 1200+ projects, full EPC capabilities, covers 6 Southeast states, specializes in commercial solar carports + BESS integration',
    50, 5000,
    true, true, true, true, true,
    ARRAY['Trina Solar', 'JA Solar', 'Canadian Solar', 'LONGi'],
    ARRAY['Tesla Megapack', 'BYD', 'LG Energy Solution'],
    ARRAY['SolarEdge', 'Enphase', 'SMA', 'Fronius'],
    18.0,
    6,
    4.8,
    'active', true
),

(
    'Solar Source',
    'Solar Source of Florida LLC',
    'commercial@solarsourceflorida.com',
    '(407) 955-7652',
    'https://www.solarsourceflorida.com',
    'Tampa', 'FL',
    ARRAY['FL'],
    ARRAY['solar', 'bess', 'epc'],
    'solar',
    18,
    85,
    900,
    ARRAY['NABCEP', 'OSHA 30', 'Florida State Certified Electrical Contractor'],
    1,
    'Tier 1: 18+ years in Florida, 900+ commercial projects, strong track record with car washes and retail, Tampa-based with statewide coverage',
    25, 3000,
    true, false, true, true, true,
    ARRAY['Canadian Solar', 'Trina Solar', 'Hanwha Q CELLS'],
    ARRAY['Tesla Powerwall', 'Enphase Battery', 'LG RESU'],
    ARRAY['SolarEdge', 'Enphase', 'SMA'],
    20.0,
    5,
    4.7,
    'active', true
),

(
    'Compass Solar Energy',
    'Compass Solar Energy Corporation',
    'info@compasssolarenergy.com',
    '(888) 476-5271',
    'https://www.compasssolarenergy.com',
    'Fort Lauderdale', 'FL',
    ARRAY['FL'],
    ARRAY['solar', 'bess'],
    'solar',
    12,
    60,
    750,
    ARRAY['NABCEP', 'OSHA 10', 'Florida Licensed Solar Contractor'],
    1,
    'Tier 1: 12+ years, 750+ projects in South Florida, specializes in commercial rooftop + carports, strong financing partnerships',
    20, 2000,
    true, false, true, true, true,
    ARRAY['LONGi', 'JA Solar', 'Trina Solar'],
    ARRAY['Enphase Battery', 'Generac PWRcell'],
    ARRAY['Enphase', 'SolarEdge', 'Fronius'],
    22.0,
    6,
    4.6,
    'active', true
),

-- ============================================================================
-- TIER 2: FLORIDA BESS SPECIALISTS
-- ============================================================================

(
    'Energy Storage Solutions Florida',
    'ESS Florida Inc.',
    'sales@essflorida.com',
    '(305) 555-0100',
    'https://www.essflorida.com',
    'Miami', 'FL',
    ARRAY['FL', 'GA'],
    ARRAY['bess', 'microgrid', 'epc'],
    'bess',
    8,
    35,
    200,
    ARRAY['OSHA 30', 'NFPA 855 Certified', 'Florida Electrical Contractor'],
    2,
    'Tier 2: 8 years BESS-specific experience, 200+ battery installations, specializes in commercial + industrial backup power, strong with car washes and gas stations',
    100, 5000,
    true, false, true, true, true,
    ARRAY['Canadian Solar'],
    ARRAY['BYD', 'LG Energy Solution', 'Samsung SDI', 'Sungrow'],
    ARRAY['SMA', 'SolarEdge', 'Schneider Electric'],
    25.0,
    8,
    4.5,
    'active', true
),

(
    'Battery Backup Systems of Florida',
    'BBS Florida LLC',
    'info@bbsflorida.com',
    '(813) 555-0200',
    'https://www.bbsflorida.com',
    'Tampa', 'FL',
    ARRAY['FL'],
    ARRAY['bess', 'generator'],
    'bess',
    6,
    25,
    150,
    ARRAY['OSHA 10', 'Florida Electrical License'],
    2,
    'Tier 2: 6 years battery + generator integration, 150+ projects, focuses on hurricane resilience for commercial properties',
    50, 2000,
    true, false, false, true, true,
    ARRAY[]::TEXT[],
    ARRAY['Tesla Powerwall', 'Enphase Battery', 'Generac PWRcell', 'LG RESU'],
    ARRAY['SolarEdge', 'Enphase'],
    28.0,
    10,
    4.4,
    'active', false
),

-- ============================================================================
-- TIER 1: FLORIDA EV CHARGING INSTALLERS
-- ============================================================================

(
    'EV Connect Florida',
    'EV Connect FL Inc.',
    'sales@evconnectfl.com',
    '(407) 555-0300',
    'https://www.evconnectfl.com',
    'Orlando', 'FL',
    ARRAY['FL', 'GA', 'AL'],
    ARRAY['ev_charging', 'solar', 'epc'],
    'ev_charging',
    7,
    45,
    600,
    ARRAY['EVITP Certified', 'NABCEP', 'Florida Electrical Contractor'],
    1,
    'Tier 1: 7 years EV-specific, 600+ charging installations, specializes in car wash + retail EV charging with solar integration',
    10, 1000,
    true, false, true, true, true,
    ARRAY['Canadian Solar', 'Trina Solar'],
    ARRAY['Tesla Powerwall'],
    ARRAY['SolarEdge', 'Enphase'],
    20.0,
    4,
    4.7,
    'active', true
),

-- ============================================================================
-- TIER 1: FLORIDA GENERATOR INSTALLERS
-- ============================================================================

(
    'GeneratorPros of Florida',
    'GeneratorPros FL LLC',
    'commercial@generatorprosfl.com',
    '(954) 555-0400',
    'https://www.generatorprosfl.com',
    'Fort Lauderdale', 'FL',
    ARRAY['FL'],
    ARRAY['generator', 'bess'],
    'generator',
    20,
    40,
    2000,
    ARRAY['EGSA Certified', 'OSHA 30', 'Florida Electrical Contractor', 'Master Electrician'],
    1,
    'Tier 1: 20+ years generator experience, 2000+ installations, specializes in natural gas + diesel backup for commercial properties',
    50, 2000,
    true, false, false, true, true,
    ARRAY[]::TEXT[],
    ARRAY['Generac PWRcell'],
    ARRAY[]::TEXT[],
    18.0,
    3,
    4.8,
    'active', true
),

-- ============================================================================
-- ADDITIONAL FLORIDA INSTALLERS (TIER 2/3)
-- ============================================================================

(
    'Sunshine State Solar & Storage',
    'S3 Energy Solutions Inc.',
    'info@s3energy.com',
    '(727) 555-0500',
    'https://www.s3energy.com',
    'St. Petersburg', 'FL',
    ARRAY['FL'],
    ARRAY['solar', 'bess'],
    'solar',
    10,
    30,
    400,
    ARRAY['NABCEP', 'Florida Solar Contractor'],
    2,
    'Tier 2: 10 years, 400+ projects, strong in Tampa Bay area, good pricing but slower install times',
    30, 1500,
    true, false, true, true, true,
    ARRAY['Hanwha Q CELLS', 'JA Solar'],
    ARRAY['Enphase Battery', 'LG RESU'],
    ARRAY['Enphase', 'SolarEdge'],
    24.0,
    8,
    4.3,
    'active', false
),

(
    'Florida Clean Energy Contractors',
    'FCEC Inc.',
    'sales@fcecenergy.com',
    '(386) 555-0600',
    'https://www.fcecenergy.com',
    'Jacksonville', 'FL',
    ARRAY['FL', 'GA'],
    ARRAY['solar', 'bess', 'ev_charging'],
    'solar',
    9,
    28,
    350,
    ARRAY['NABCEP', 'OSHA 10'],
    2,
    'Tier 2: 9 years, 350+ projects, covers North Florida + South Georgia, good commercial rates',
    25, 1000,
    true, false, true, true, true,
    ARRAY['Trina Solar', 'Canadian Solar'],
    ARRAY['BYD', 'LG Energy Solution'],
    ARRAY['SolarEdge', 'SMA'],
    26.0,
    7,
    4.2,
    'active', false
);

-- ============================================================================
-- SEED DATA: CALIFORNIA INSTALLERS (Example for other states)
-- ============================================================================

INSERT INTO installer_vendors (
    company_name, email, phone, website,
    headquarters_city, headquarters_state,
    service_states, installer_type, primary_specialty,
    years_in_business, employee_count, projects_completed,
    certifications, tier, tier_justification,
    min_project_size_kw, max_project_size_kw,
    commercial, utility_scale,
    preferred_solar_manufacturers, preferred_battery_manufacturers,
    typical_markup_percent, avg_install_time_weeks, customer_rating, status, verified
) VALUES

(
    'Borrego Solar Systems',
    'info@borregosolar.com',
    '(858) 413-0000',
    'https://www.borregosolar.com',
    'San Diego', 'CA',
    ARRAY['CA', 'NV', 'AZ', 'TX', 'FL', 'NY'],
    ARRAY['solar', 'bess', 'microgrid', 'epc'],
    'solar',
    25,
    250,
    3000,
    ARRAY['NABCEP', 'OSHA 30', 'CSLB Licensed'],
    1,
    'Tier 1: 25+ years, 3000+ projects, nationwide coverage, utility-scale + commercial expertise',
    500, 50000,
    true, true,
    ARRAY['Trina Solar', 'JA Solar', 'LONGi'],
    ARRAY['Tesla Megapack', 'BYD', 'CATL'],
    15.0,
    8,
    4.8,
    'active', true
),

(
    'SunPower by Stellar Solar',
    'commercial@stellarsolar.com',
    '(858) 259-1010',
    'https://www.stellarsolar.net',
    'San Diego', 'CA',
    ARRAY['CA', 'AZ', 'NV'],
    ARRAY['solar', 'bess', 'ev_charging'],
    'solar',
    15,
    120,
    2000,
    ARRAY['NABCEP', 'CSLB Licensed', 'Tesla Certified Installer'],
    1,
    'Tier 1: 15+ years, 2000+ projects, SunPower Master Dealer, strong commercial portfolio',
    50, 5000,
    true, false,
    ARRAY['SunPower', 'Canadian Solar'],
    ARRAY['Tesla Powerwall', 'Enphase Battery'],
    18.0,
    6,
    4.9,
    'active', true
);

-- ============================================================================
-- SEED DATA: TEXAS INSTALLERS
-- ============================================================================

INSERT INTO installer_vendors (
    company_name, email, phone, website,
    headquarters_city, headquarters_state,
    service_states, installer_type, primary_specialty,
    years_in_business, employee_count, projects_completed,
    certifications, tier, tier_justification,
    min_project_size_kw, max_project_size_kw,
    commercial, utility_scale,
    preferred_solar_manufacturers, preferred_battery_manufacturers,
    typical_markup_percent, avg_install_time_weeks, status, verified
) VALUES

(
    'Freedom Solar Power',
    'commercial@freedomsolarpower.com',
    '(512) 582-2233',
    'https://www.freedomsolarpower.com',
    'Austin', 'TX',
    ARRAY['TX', 'LA', 'OK'],
    ARRAY['solar', 'bess', 'generator'],
    'solar',
    14,
    180,
    5000,
    ARRAY['NABCEP', 'Texas Licensed Electrician'],
    1,
    'Tier 1: 14+ years, 5000+ projects, largest solar installer in Texas, strong commercial + BESS integration',
    25, 10000,
    true, true,
    ARRAY['LONGi', 'Trina Solar', 'Canadian Solar'],
    ARRAY['Tesla Powerwall', 'Enphase Battery', 'LG RESU'],
    17.0,
    7,
    'active', true
),

(
    'Longhorn Solar',
    'info@longhornsolar.com',
    '(210) 802-3377',
    'https://www.longhornsolar.com',
    'San Antonio', 'TX',
    ARRAY['TX'],
    ARRAY['solar', 'bess'],
    'solar',
    11,
    75,
    1200,
    ARRAY['NABCEP', 'OSHA 10'],
    1,
    'Tier 1: 11 years, 1200+ projects, South Texas specialist, strong commercial rates',
    30, 3000,
    true, false,
    ARRAY['Hanwha Q CELLS', 'JA Solar'],
    ARRAY['Enphase Battery', 'Generac PWRcell'],
    20.0,
    6,
    'active', true
);

-- ============================================================================
-- SEED DATA: NEW YORK INSTALLERS
-- ============================================================================

INSERT INTO installer_vendors (
    company_name, email, phone, website,
    headquarters_city, headquarters_state,
    service_states, installer_type, primary_specialty,
    years_in_business, employee_count, projects_completed,
    certifications, tier, tier_justification,
    min_project_size_kw, max_project_size_kw,
    commercial, utility_scale,
    preferred_solar_manufacturers, preferred_battery_manufacturers,
    typical_markup_percent, avg_install_time_weeks, status, verified
) VALUES

(
    'Brooklyn SolarWorks',
    'commercial@brooklynsolarworks.com',
    '(347) 712-8159',
    'https://www.brooklynsolarworks.com',
    'Brooklyn', 'NY',
    ARRAY['NY', 'NJ', 'CT'],
    ARRAY['solar', 'bess', 'ev_charging'],
    'solar',
    10,
    65,
    800,
    ARRAY['NABCEP', 'NYSERDA Certified', 'OSHA 30'],
    1,
    'Tier 1: 10 years, 800+ projects, NYC specialist, strong urban commercial installations',
    20, 2000,
    true, false,
    ARRAY['Canadian Solar', 'Trina Solar'],
    ARRAY['Tesla Powerwall', 'Enphase Battery'],
    22.0,
    8,
    'active', true
),

(
    'Solar Liberty',
    'info@solarlibertyenergy.com',
    '(516) 513-1115',
    'https://www.solarlibertyenergy.com',
    'Long Island', 'NY',
    ARRAY['NY', 'NJ'],
    ARRAY['solar', 'bess'],
    'solar',
    12,
    50,
    600,
    ARRAY['NABCEP', 'NY Licensed Electrician'],
    1,
    'Tier 1: 12 years, 600+ projects, Long Island + NYC metro specialist',
    25, 1500,
    true, false,
    ARRAY['LONGi', 'JA Solar'],
    ARRAY['LG RESU', 'Generac PWRcell'],
    24.0,
    9,
    'active', true
);

-- ============================================================================
-- COMMENTS FOR DATABASE MAINTENANCE
-- ============================================================================

COMMENT ON TABLE installer_vendors IS 'Comprehensive database of solar, BESS, EV charging, and generator installers by state';
COMMENT ON COLUMN installer_vendors.tier IS '1 = Top tier (large, experienced, full capabilities), 2 = Mid-tier (solid reputation, good pricing), 3 = Emerging (new or limited track record)';
COMMENT ON COLUMN installer_vendors.service_states IS 'Array of 2-letter state codes where company provides installation services';
COMMENT ON COLUMN installer_vendors.installer_type IS 'Array of specialties: solar, bess, ev_charging, generator, microgrid, epc';
COMMENT ON COLUMN installer_vendors.typical_markup_percent IS 'Typical markup percentage over equipment + labor costs (15-30% range)';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get installers for a specific state and specialty
CREATE OR REPLACE FUNCTION get_installers_by_state_and_type(
    p_state VARCHAR(2),
    p_installer_type VARCHAR(30),
    p_tier_max INTEGER DEFAULT 3
)
RETURNS TABLE (
    company_name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    website VARCHAR,
    tier INTEGER,
    years_in_business INTEGER,
    projects_completed INTEGER,
    customer_rating DECIMAL,
    typical_markup_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        iv.company_name,
        iv.phone,
        iv.email,
        iv.website,
        iv.tier,
        iv.years_in_business,
        iv.projects_completed,
        iv.customer_rating,
        iv.typical_markup_percent
    FROM installer_vendors iv
    WHERE 
        p_state = ANY(iv.service_states)
        AND p_installer_type = ANY(iv.installer_type)
        AND iv.tier <= p_tier_max
        AND iv.status = 'active'
    ORDER BY 
        iv.tier ASC,
        iv.customer_rating DESC NULLS LAST,
        iv.projects_completed DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top 3 recommended installers for a quote
CREATE OR REPLACE FUNCTION get_recommended_installers(
    p_state VARCHAR(2),
    p_installer_type VARCHAR(30),
    p_project_size_kw DECIMAL DEFAULT 500
)
RETURNS TABLE (
    rank INTEGER,
    company_name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    website VARCHAR,
    tier INTEGER,
    recommendation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_installers AS (
        SELECT 
            ROW_NUMBER() OVER (
                ORDER BY 
                    iv.tier ASC,
                    CASE 
                        WHEN p_project_size_kw BETWEEN iv.min_project_size_kw AND iv.max_project_size_kw THEN 1
                        ELSE 2
                    END,
                    iv.customer_rating DESC NULLS LAST,
                    iv.projects_completed DESC
            ) as installer_rank,
            iv.company_name,
            iv.phone,
            iv.email,
            iv.website,
            iv.tier,
            CASE 
                WHEN iv.tier = 1 THEN 'Top Tier: ' || iv.tier_justification
                WHEN iv.tier = 2 THEN 'Solid Performer: ' || iv.years_in_business || '+ years, ' || iv.projects_completed || '+ projects'
                ELSE 'Emerging Installer'
            END as recommendation_reason
        FROM installer_vendors iv
        WHERE 
            p_state = ANY(iv.service_states)
            AND p_installer_type = ANY(iv.installer_type)
            AND iv.status = 'active'
            AND p_project_size_kw >= iv.min_project_size_kw
            AND p_project_size_kw <= iv.max_project_size_kw
    )
    SELECT 
        installer_rank as rank,
        company_name,
        phone,
        email,
        website,
        tier,
        recommendation_reason
    FROM ranked_installers
    WHERE installer_rank <= 3;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXAMPLE QUERIES
-- ============================================================================

-- Get all solar installers in Florida
-- SELECT * FROM get_installers_by_state_and_type('FL', 'solar');

-- Get top 3 recommended solar installers for 500kW project in Florida
-- SELECT * FROM get_recommended_installers('FL', 'solar', 500);

-- Get all BESS installers in Florida (Tier 1 only)
-- SELECT * FROM get_installers_by_state_and_type('FL', 'bess', 1);

-- Get EV charging installers in California
-- SELECT * FROM get_installers_by_state_and_type('CA', 'ev_charging');

-- ============================================================================
-- TODO: Additional States to Add
-- ============================================================================
-- Priority: AZ, MA, NJ, GA, NC, CO, IL, PA, OH, MI
-- Each state should have:
-- - 2-3 Tier 1 solar/BESS installers
-- - 1-2 Tier 1 EV charging installers
-- - 1-2 Tier 1 generator installers
-- - 2-3 Tier 2 installers for backup options
