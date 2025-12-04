-- ============================================================================
-- UTILITY RATES DATABASE MIGRATION
-- ============================================================================
-- Created: December 2, 2025
-- Purpose: Add comprehensive utility rate data for ZIP-code-based lookups
-- Source: EIA 2024 State Electricity Profiles + Major Utility Rate Schedules
-- ============================================================================

-- ============================================================================
-- STEP 1: Create utility_rates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS utility_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    state_code VARCHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    utility_id VARCHAR(50),
    utility_name VARCHAR(100),
    zip_prefix VARCHAR(3), -- First 3 digits of ZIP for mapping
    
    -- Rates ($/kWh)
    residential_rate DECIMAL(6,4) NOT NULL,
    commercial_rate DECIMAL(6,4) NOT NULL,
    industrial_rate DECIMAL(6,4) NOT NULL,
    
    -- Time-of-Use
    has_tou BOOLEAN DEFAULT false,
    peak_rate DECIMAL(6,4),
    off_peak_rate DECIMAL(6,4),
    part_peak_rate DECIMAL(6,4),
    peak_hours VARCHAR(50),
    
    -- Demand Charges ($/kW)
    has_demand_charge BOOLEAN DEFAULT true,
    demand_charge DECIMAL(6,2),
    peak_demand_charge DECIMAL(6,2),
    
    -- Net Metering
    net_metering_available BOOLEAN DEFAULT true,
    net_metering_type VARCHAR(20), -- 'full-retail', 'avoided-cost', 'time-of-export'
    
    -- Renewable Potential
    solar_potential VARCHAR(10), -- 'excellent', 'good', 'fair', 'poor'
    wind_potential VARCHAR(10),
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'EIA',
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(state_code, utility_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_utility_rates_state ON utility_rates(state_code);
CREATE INDEX IF NOT EXISTS idx_utility_rates_zip ON utility_rates(zip_prefix);
CREATE INDEX IF NOT EXISTS idx_utility_rates_utility ON utility_rates(utility_id);

-- ============================================================================
-- STEP 2: Insert State-Level Rates (EIA 2024 Data)
-- ============================================================================

INSERT INTO utility_rates (
    state_code, state_name, utility_id, utility_name,
    residential_rate, commercial_rate, industrial_rate,
    has_tou, peak_rate, off_peak_rate, peak_hours,
    has_demand_charge, demand_charge,
    net_metering_available, solar_potential, wind_potential,
    data_source
) VALUES
-- HIGH-RATE STATES (Excellent BESS ROI)
('CA', 'California', 'ca-avg', 'California Average', 0.2794, 0.2207, 0.1689, true, 0.42, 0.18, '4pm-9pm', true, 25, true, 'excellent', 'fair', 'EIA 2024'),
('HI', 'Hawaii', 'hi-avg', 'Hawaii Average', 0.4332, 0.3689, 0.3148, true, 0.50, 0.30, '5pm-10pm', true, 30, true, 'excellent', 'good', 'EIA 2024'),
('MA', 'Massachusetts', 'ma-avg', 'Massachusetts Average', 0.2696, 0.1946, 0.1576, true, 0.35, 0.14, '4pm-9pm', true, 22, true, 'fair', 'good', 'EIA 2024'),
('CT', 'Connecticut', 'ct-avg', 'Connecticut Average', 0.2549, 0.1957, 0.1462, true, 0.32, 0.15, '12pm-8pm', true, 20, true, 'fair', 'fair', 'EIA 2024'),
('RI', 'Rhode Island', 'ri-avg', 'Rhode Island Average', 0.2689, 0.1907, 0.1573, true, 0.33, 0.14, '3pm-8pm', true, 20, true, 'fair', 'good', 'EIA 2024'),
('NH', 'New Hampshire', 'nh-avg', 'New Hampshire Average', 0.2357, 0.1739, 0.1427, false, NULL, NULL, NULL, true, 18, true, 'fair', 'fair', 'EIA 2024'),
('AK', 'Alaska', 'ak-avg', 'Alaska Average', 0.2265, 0.2010, 0.1812, false, NULL, NULL, NULL, true, 15, false, 'poor', 'excellent', 'EIA 2024'),
('ME', 'Maine', 'me-avg', 'Maine Average', 0.2184, 0.1571, 0.1168, false, NULL, NULL, NULL, true, 15, true, 'fair', 'excellent', 'EIA 2024'),
('NY', 'New York', 'ny-avg', 'New York Average', 0.2201, 0.1676, 0.0753, true, 0.35, 0.12, '8am-12am', true, 22, true, 'fair', 'good', 'EIA 2024'),
('VT', 'Vermont', 'vt-avg', 'Vermont Average', 0.2085, 0.1680, 0.1249, false, NULL, NULL, NULL, true, 16, true, 'fair', 'good', 'EIA 2024'),

-- MODERATE-RATE STATES
('NJ', 'New Jersey', 'nj-avg', 'New Jersey Average', 0.1780, 0.1372, 0.1066, true, 0.24, 0.10, '12pm-8pm', true, 17, true, 'fair', 'fair', 'EIA 2024'),
('MI', 'Michigan', 'mi-avg', 'Michigan Average', 0.1729, 0.1427, 0.1017, true, 0.24, 0.08, '11am-7pm', true, 16, true, 'fair', 'good', 'EIA 2024'),
('PA', 'Pennsylvania', 'pa-avg', 'Pennsylvania Average', 0.1562, 0.1135, 0.0835, false, NULL, NULL, NULL, true, 14, true, 'fair', 'fair', 'EIA 2024'),
('WI', 'Wisconsin', 'wi-avg', 'Wisconsin Average', 0.1523, 0.1227, 0.0914, false, NULL, NULL, NULL, true, 13, true, 'fair', 'good', 'EIA 2024'),
('MD', 'Maryland', 'md-avg', 'Maryland Average', 0.1493, 0.1189, 0.0925, true, 0.21, 0.09, '10am-8pm', true, 15, true, 'good', 'fair', 'EIA 2024'),
('IL', 'Illinois', 'il-avg', 'Illinois Average', 0.1461, 0.1114, 0.0835, true, 0.20, 0.08, '1pm-7pm', true, 14, true, 'good', 'excellent', 'EIA 2024'),
('FL', 'Florida', 'fl-avg', 'Florida Average', 0.1408, 0.1125, 0.0890, true, 0.14, 0.08, '12pm-9pm', true, 12, true, 'excellent', 'poor', 'EIA 2024'),
('OH', 'Ohio', 'oh-avg', 'Ohio Average', 0.1378, 0.1108, 0.0768, false, NULL, NULL, NULL, true, 13, true, 'fair', 'good', 'EIA 2024'),
('KS', 'Kansas', 'ks-avg', 'Kansas Average', 0.1364, 0.1142, 0.0878, false, NULL, NULL, NULL, true, 13, true, 'good', 'excellent', 'EIA 2024'),
('NV', 'Nevada', 'nv-avg', 'Nevada Average', 0.1348, 0.0999, 0.0706, true, 0.18, 0.07, '1pm-7pm', true, 16, true, 'excellent', 'fair', 'EIA 2024'),
('NM', 'New Mexico', 'nm-avg', 'New Mexico Average', 0.1349, 0.1087, 0.0763, false, NULL, NULL, NULL, true, 13, true, 'excellent', 'good', 'EIA 2024'),
('CO', 'Colorado', 'co-avg', 'Colorado Average', 0.1340, 0.1115, 0.0870, true, 0.19, 0.08, '2pm-7pm', true, 14, true, 'excellent', 'good', 'EIA 2024'),
('AZ', 'Arizona', 'az-avg', 'Arizona Average', 0.1334, 0.1123, 0.0743, true, 0.22, 0.08, '3pm-8pm', true, 18, true, 'excellent', 'fair', 'EIA 2024'),
('SC', 'South Carolina', 'sc-avg', 'South Carolina Average', 0.1315, 0.1106, 0.0703, false, NULL, NULL, NULL, true, 12, true, 'good', 'fair', 'EIA 2024'),
('AL', 'Alabama', 'al-avg', 'Alabama Average', 0.1315, 0.1173, 0.0726, false, NULL, NULL, NULL, true, 12, true, 'good', 'poor', 'EIA 2024'),
('TX', 'Texas', 'tx-avg', 'Texas Average', 0.1307, 0.1016, 0.0743, true, 0.18, 0.06, '1pm-7pm', true, 15, false, 'excellent', 'excellent', 'EIA 2024'),
('DE', 'Delaware', 'de-avg', 'Delaware Average', 0.1305, 0.1089, 0.0869, false, NULL, NULL, NULL, true, 13, true, 'good', 'fair', 'EIA 2024'),
('IN', 'Indiana', 'in-avg', 'Indiana Average', 0.1305, 0.1133, 0.0814, false, NULL, NULL, NULL, true, 12, true, 'fair', 'good', 'EIA 2024'),
('IA', 'Iowa', 'ia-avg', 'Iowa Average', 0.1290, 0.1091, 0.0802, false, NULL, NULL, NULL, true, 11, true, 'good', 'excellent', 'EIA 2024'),
('VA', 'Virginia', 'va-avg', 'Virginia Average', 0.1288, 0.0953, 0.0715, true, 0.18, 0.07, '1pm-7pm', true, 13, true, 'good', 'fair', 'EIA 2024'),
('SD', 'South Dakota', 'sd-avg', 'South Dakota Average', 0.1270, 0.1078, 0.0872, false, NULL, NULL, NULL, true, 10, true, 'good', 'excellent', 'EIA 2024'),
('GA', 'Georgia', 'ga-avg', 'Georgia Average', 0.1261, 0.1092, 0.0698, true, 0.18, 0.08, '2pm-7pm', true, 13, true, 'good', 'poor', 'EIA 2024'),
('MS', 'Mississippi', 'ms-avg', 'Mississippi Average', 0.1228, 0.1089, 0.0751, false, NULL, NULL, NULL, true, 11, true, 'good', 'poor', 'EIA 2024'),
('MO', 'Missouri', 'mo-avg', 'Missouri Average', 0.1211, 0.1006, 0.0778, false, NULL, NULL, NULL, true, 12, true, 'good', 'good', 'EIA 2024'),
('NC', 'North Carolina', 'nc-avg', 'North Carolina Average', 0.1210, 0.0986, 0.0678, true, 0.17, 0.07, '1pm-6pm', true, 12, true, 'good', 'fair', 'EIA 2024'),
('OR', 'Oregon', 'or-avg', 'Oregon Average', 0.1211, 0.1019, 0.0765, true, 0.16, 0.07, '3pm-8pm', true, 11, true, 'fair', 'fair', 'EIA 2024'),
('WV', 'West Virginia', 'wv-avg', 'West Virginia Average', 0.1208, 0.1030, 0.0732, false, NULL, NULL, NULL, true, 11, true, 'fair', 'good', 'EIA 2024'),
('MT', 'Montana', 'mt-avg', 'Montana Average', 0.1187, 0.1049, 0.0759, false, NULL, NULL, NULL, true, 10, true, 'good', 'excellent', 'EIA 2024'),
('TN', 'Tennessee', 'tn-avg', 'Tennessee Average', 0.1167, 0.1074, 0.0738, false, NULL, NULL, NULL, true, 11, true, 'good', 'fair', 'EIA 2024'),
('LA', 'Louisiana', 'la-avg', 'Louisiana Average', 0.1163, 0.1032, 0.0710, false, NULL, NULL, NULL, true, 12, true, 'good', 'fair', 'EIA 2024'),
('NE', 'Nebraska', 'ne-avg', 'Nebraska Average', 0.1161, 0.0996, 0.0804, false, NULL, NULL, NULL, true, 11, true, 'good', 'excellent', 'EIA 2024'),
('ND', 'North Dakota', 'nd-avg', 'North Dakota Average', 0.1148, 0.0980, 0.0802, false, NULL, NULL, NULL, true, 10, true, 'fair', 'excellent', 'EIA 2024'),
('KY', 'Kentucky', 'ky-avg', 'Kentucky Average', 0.1148, 0.1020, 0.0641, false, NULL, NULL, NULL, true, 11, true, 'fair', 'fair', 'EIA 2024'),
('OK', 'Oklahoma', 'ok-avg', 'Oklahoma Average', 0.1132, 0.0919, 0.0650, false, NULL, NULL, NULL, true, 11, true, 'good', 'excellent', 'EIA 2024'),
('WY', 'Wyoming', 'wy-avg', 'Wyoming Average', 0.1128, 0.0945, 0.0709, false, NULL, NULL, NULL, true, 10, true, 'good', 'excellent', 'EIA 2024'),
('UT', 'Utah', 'ut-avg', 'Utah Average', 0.1086, 0.0908, 0.0689, false, NULL, NULL, NULL, true, 12, true, 'excellent', 'fair', 'EIA 2024'),
('WA', 'Washington', 'wa-avg', 'Washington Average', 0.1079, 0.0953, 0.0624, false, NULL, NULL, NULL, true, 10, true, 'fair', 'fair', 'EIA 2024'),
('ID', 'Idaho', 'id-avg', 'Idaho Average', 0.1051, 0.0851, 0.0699, false, NULL, NULL, NULL, true, 10, true, 'good', 'good', 'EIA 2024'),
('MN', 'Minnesota', 'mn-avg', 'Minnesota Average', 0.1374, 0.1154, 0.0879, false, NULL, NULL, NULL, true, 13, true, 'fair', 'good', 'EIA 2024'),
('AR', 'Arkansas', 'ar-avg', 'Arkansas Average', 0.1027, 0.0896, 0.0685, false, NULL, NULL, NULL, true, 11, true, 'good', 'good', 'EIA 2024'),
('DC', 'District of Columbia', 'dc-avg', 'DC Average', 0.1425, 0.1220, 0.0980, true, 0.20, 0.09, '10am-8pm', true, 18, true, 'fair', 'poor', 'EIA 2024')

ON CONFLICT (state_code, utility_id) DO UPDATE SET
    residential_rate = EXCLUDED.residential_rate,
    commercial_rate = EXCLUDED.commercial_rate,
    industrial_rate = EXCLUDED.industrial_rate,
    has_tou = EXCLUDED.has_tou,
    peak_rate = EXCLUDED.peak_rate,
    off_peak_rate = EXCLUDED.off_peak_rate,
    demand_charge = EXCLUDED.demand_charge,
    solar_potential = EXCLUDED.solar_potential,
    wind_potential = EXCLUDED.wind_potential,
    updated_at = NOW();

-- ============================================================================
-- STEP 3: Insert Major Utility-Specific Rates
-- ============================================================================

INSERT INTO utility_rates (
    state_code, state_name, utility_id, utility_name, zip_prefix,
    residential_rate, commercial_rate, industrial_rate,
    has_tou, peak_rate, off_peak_rate, peak_hours,
    has_demand_charge, demand_charge, peak_demand_charge,
    net_metering_available, net_metering_type, solar_potential, wind_potential,
    data_source
) VALUES
-- CALIFORNIA UTILITIES
('CA', 'California', 'pge', 'Pacific Gas & Electric', '940', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '941', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '942', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '943', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '944', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '945', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '946', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '947', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '948', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '949', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '950', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'pge', 'Pacific Gas & Electric', '951', 0.30, 0.24, 0.18, true, 0.42, 0.18, '4pm-9pm', true, 22, 28, true, 'time-of-export', 'excellent', 'fair', 'PG&E Schedule'),
('CA', 'California', 'sce', 'Southern California Edison', '900', 0.28, 0.22, 0.16, true, 0.38, 0.16, '4pm-9pm', true, 20, 25, true, 'time-of-export', 'excellent', 'poor', 'SCE Schedule'),
('CA', 'California', 'sce', 'Southern California Edison', '910', 0.28, 0.22, 0.16, true, 0.38, 0.16, '4pm-9pm', true, 20, 25, true, 'time-of-export', 'excellent', 'poor', 'SCE Schedule'),
('CA', 'California', 'sce', 'Southern California Edison', '912', 0.28, 0.22, 0.16, true, 0.38, 0.16, '4pm-9pm', true, 20, 25, true, 'time-of-export', 'excellent', 'poor', 'SCE Schedule'),
('CA', 'California', 'sce', 'Southern California Edison', '913', 0.28, 0.22, 0.16, true, 0.38, 0.16, '4pm-9pm', true, 20, 25, true, 'time-of-export', 'excellent', 'poor', 'SCE Schedule'),
('CA', 'California', 'sdge', 'San Diego Gas & Electric', '919', 0.35, 0.28, 0.22, true, 0.52, 0.22, '4pm-9pm', true, 25, 32, true, 'time-of-export', 'excellent', 'poor', 'SDG&E Schedule'),
('CA', 'California', 'sdge', 'San Diego Gas & Electric', '920', 0.35, 0.28, 0.22, true, 0.52, 0.22, '4pm-9pm', true, 25, 32, true, 'time-of-export', 'excellent', 'poor', 'SDG&E Schedule'),
('CA', 'California', 'sdge', 'San Diego Gas & Electric', '921', 0.35, 0.28, 0.22, true, 0.52, 0.22, '4pm-9pm', true, 25, 32, true, 'time-of-export', 'excellent', 'poor', 'SDG&E Schedule'),

-- MICHIGAN UTILITIES  
('MI', 'Michigan', 'dte', 'DTE Energy', '480', 0.18, 0.15, 0.10, true, 0.22, 0.08, '11am-7pm', true, 14, 18, true, 'full-retail', 'fair', 'good', 'DTE Schedule'),
('MI', 'Michigan', 'dte', 'DTE Energy', '481', 0.18, 0.15, 0.10, true, 0.22, 0.08, '11am-7pm', true, 14, 18, true, 'full-retail', 'fair', 'good', 'DTE Schedule'),
('MI', 'Michigan', 'dte', 'DTE Energy', '482', 0.18, 0.15, 0.10, true, 0.22, 0.08, '11am-7pm', true, 14, 18, true, 'full-retail', 'fair', 'good', 'DTE Schedule'),
('MI', 'Michigan', 'dte', 'DTE Energy', '483', 0.18, 0.15, 0.10, true, 0.22, 0.08, '11am-7pm', true, 14, 18, true, 'full-retail', 'fair', 'good', 'DTE Schedule'),
('MI', 'Michigan', 'consumers', 'Consumers Energy', '490', 0.17, 0.14, 0.09, true, 0.20, 0.07, '2pm-7pm', true, 12, 16, true, 'full-retail', 'fair', 'good', 'Consumers Schedule'),
('MI', 'Michigan', 'consumers', 'Consumers Energy', '491', 0.17, 0.14, 0.09, true, 0.20, 0.07, '2pm-7pm', true, 12, 16, true, 'full-retail', 'fair', 'good', 'Consumers Schedule'),
('MI', 'Michigan', 'consumers', 'Consumers Energy', '493', 0.17, 0.14, 0.09, true, 0.20, 0.07, '2pm-7pm', true, 12, 16, true, 'full-retail', 'fair', 'good', 'Consumers Schedule'),
('MI', 'Michigan', 'consumers', 'Consumers Energy', '494', 0.17, 0.14, 0.09, true, 0.20, 0.07, '2pm-7pm', true, 12, 16, true, 'full-retail', 'fair', 'good', 'Consumers Schedule'),
('MI', 'Michigan', 'consumers', 'Consumers Energy', '495', 0.17, 0.14, 0.09, true, 0.20, 0.07, '2pm-7pm', true, 12, 16, true, 'full-retail', 'fair', 'good', 'Consumers Schedule'),

-- NEW YORK UTILITIES
('NY', 'New York', 'coned', 'Consolidated Edison', '100', 0.28, 0.22, 0.18, true, 0.35, 0.12, '8am-12am', true, 25, 35, true, 'full-retail', 'fair', 'poor', 'ConEd Schedule'),
('NY', 'New York', 'coned', 'Consolidated Edison', '101', 0.28, 0.22, 0.18, true, 0.35, 0.12, '8am-12am', true, 25, 35, true, 'full-retail', 'fair', 'poor', 'ConEd Schedule'),
('NY', 'New York', 'coned', 'Consolidated Edison', '102', 0.28, 0.22, 0.18, true, 0.35, 0.12, '8am-12am', true, 25, 35, true, 'full-retail', 'fair', 'poor', 'ConEd Schedule'),
('NY', 'New York', 'coned', 'Consolidated Edison', '103', 0.28, 0.22, 0.18, true, 0.35, 0.12, '8am-12am', true, 25, 35, true, 'full-retail', 'fair', 'poor', 'ConEd Schedule'),
('NY', 'New York', 'coned', 'Consolidated Edison', '104', 0.28, 0.22, 0.18, true, 0.35, 0.12, '8am-12am', true, 25, 35, true, 'full-retail', 'fair', 'poor', 'ConEd Schedule'),

-- TEXAS UTILITIES
('TX', 'Texas', 'oncor', 'Oncor Electric Delivery', '750', 0.14, 0.11, 0.08, true, 0.18, 0.06, '1pm-7pm', true, 12, 15, false, NULL, 'excellent', 'excellent', 'ERCOT/Oncor'),
('TX', 'Texas', 'oncor', 'Oncor Electric Delivery', '751', 0.14, 0.11, 0.08, true, 0.18, 0.06, '1pm-7pm', true, 12, 15, false, NULL, 'excellent', 'excellent', 'ERCOT/Oncor'),
('TX', 'Texas', 'oncor', 'Oncor Electric Delivery', '752', 0.14, 0.11, 0.08, true, 0.18, 0.06, '1pm-7pm', true, 12, 15, false, NULL, 'excellent', 'excellent', 'ERCOT/Oncor'),
('TX', 'Texas', 'oncor', 'Oncor Electric Delivery', '760', 0.14, 0.11, 0.08, true, 0.18, 0.06, '1pm-7pm', true, 12, 15, false, NULL, 'excellent', 'excellent', 'ERCOT/Oncor'),
('TX', 'Texas', 'oncor', 'Oncor Electric Delivery', '761', 0.14, 0.11, 0.08, true, 0.18, 0.06, '1pm-7pm', true, 12, 15, false, NULL, 'excellent', 'excellent', 'ERCOT/Oncor'),

-- FLORIDA UTILITIES
('FL', 'Florida', 'fpl', 'Florida Power & Light', '330', 0.14, 0.11, 0.08, true, 0.14, 0.08, '12pm-9pm', true, 10, 12, true, 'full-retail', 'excellent', 'poor', 'FPL Schedule'),
('FL', 'Florida', 'fpl', 'Florida Power & Light', '331', 0.14, 0.11, 0.08, true, 0.14, 0.08, '12pm-9pm', true, 10, 12, true, 'full-retail', 'excellent', 'poor', 'FPL Schedule'),
('FL', 'Florida', 'fpl', 'Florida Power & Light', '332', 0.14, 0.11, 0.08, true, 0.14, 0.08, '12pm-9pm', true, 10, 12, true, 'full-retail', 'excellent', 'poor', 'FPL Schedule'),
('FL', 'Florida', 'fpl', 'Florida Power & Light', '334', 0.14, 0.11, 0.08, true, 0.14, 0.08, '12pm-9pm', true, 10, 12, true, 'full-retail', 'excellent', 'poor', 'FPL Schedule')

ON CONFLICT (state_code, utility_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Update existing state_electricity_rates with all 50 states
-- ============================================================================

UPDATE pricing_configurations
SET config_data = '{
    "Alabama": { "rate": 0.13, "demandCharge": 12, "peakRate": 0.19 },
    "Alaska": { "rate": 0.23, "demandCharge": 15, "peakRate": 0.30 },
    "Arizona": { "rate": 0.13, "demandCharge": 18, "peakRate": 0.22 },
    "Arkansas": { "rate": 0.10, "demandCharge": 11, "peakRate": 0.15 },
    "California": { "rate": 0.22, "demandCharge": 25, "peakRate": 0.35 },
    "Colorado": { "rate": 0.13, "demandCharge": 14, "peakRate": 0.19 },
    "Connecticut": { "rate": 0.21, "demandCharge": 20, "peakRate": 0.32 },
    "Delaware": { "rate": 0.13, "demandCharge": 13, "peakRate": 0.18 },
    "Florida": { "rate": 0.14, "demandCharge": 12, "peakRate": 0.20 },
    "Georgia": { "rate": 0.13, "demandCharge": 13, "peakRate": 0.18 },
    "Hawaii": { "rate": 0.43, "demandCharge": 30, "peakRate": 0.50 },
    "Idaho": { "rate": 0.11, "demandCharge": 10, "peakRate": 0.14 },
    "Illinois": { "rate": 0.15, "demandCharge": 14, "peakRate": 0.20 },
    "Indiana": { "rate": 0.13, "demandCharge": 12, "peakRate": 0.18 },
    "Iowa": { "rate": 0.13, "demandCharge": 11, "peakRate": 0.16 },
    "Kansas": { "rate": 0.14, "demandCharge": 13, "peakRate": 0.18 },
    "Kentucky": { "rate": 0.11, "demandCharge": 11, "peakRate": 0.16 },
    "Louisiana": { "rate": 0.12, "demandCharge": 12, "peakRate": 0.15 },
    "Maine": { "rate": 0.22, "demandCharge": 15, "peakRate": 0.28 },
    "Maryland": { "rate": 0.15, "demandCharge": 15, "peakRate": 0.21 },
    "Massachusetts": { "rate": 0.27, "demandCharge": 22, "peakRate": 0.35 },
    "Michigan": { "rate": 0.17, "demandCharge": 16, "peakRate": 0.24 },
    "Minnesota": { "rate": 0.14, "demandCharge": 13, "peakRate": 0.19 },
    "Mississippi": { "rate": 0.12, "demandCharge": 11, "peakRate": 0.16 },
    "Missouri": { "rate": 0.12, "demandCharge": 12, "peakRate": 0.17 },
    "Montana": { "rate": 0.12, "demandCharge": 10, "peakRate": 0.16 },
    "Nebraska": { "rate": 0.12, "demandCharge": 11, "peakRate": 0.15 },
    "Nevada": { "rate": 0.13, "demandCharge": 16, "peakRate": 0.18 },
    "New Hampshire": { "rate": 0.24, "demandCharge": 18, "peakRate": 0.30 },
    "New Jersey": { "rate": 0.18, "demandCharge": 17, "peakRate": 0.24 },
    "New Mexico": { "rate": 0.13, "demandCharge": 13, "peakRate": 0.18 },
    "New York": { "rate": 0.22, "demandCharge": 22, "peakRate": 0.35 },
    "North Carolina": { "rate": 0.12, "demandCharge": 12, "peakRate": 0.17 },
    "North Dakota": { "rate": 0.11, "demandCharge": 10, "peakRate": 0.14 },
    "Ohio": { "rate": 0.14, "demandCharge": 13, "peakRate": 0.18 },
    "Oklahoma": { "rate": 0.11, "demandCharge": 11, "peakRate": 0.15 },
    "Oregon": { "rate": 0.12, "demandCharge": 11, "peakRate": 0.16 },
    "Pennsylvania": { "rate": 0.16, "demandCharge": 14, "peakRate": 0.21 },
    "Rhode Island": { "rate": 0.27, "demandCharge": 20, "peakRate": 0.33 },
    "South Carolina": { "rate": 0.13, "demandCharge": 12, "peakRate": 0.18 },
    "South Dakota": { "rate": 0.13, "demandCharge": 10, "peakRate": 0.16 },
    "Tennessee": { "rate": 0.12, "demandCharge": 11, "peakRate": 0.16 },
    "Texas": { "rate": 0.13, "demandCharge": 15, "peakRate": 0.18 },
    "Utah": { "rate": 0.11, "demandCharge": 12, "peakRate": 0.15 },
    "Vermont": { "rate": 0.21, "demandCharge": 16, "peakRate": 0.27 },
    "Virginia": { "rate": 0.13, "demandCharge": 13, "peakRate": 0.18 },
    "Washington": { "rate": 0.11, "demandCharge": 10, "peakRate": 0.14 },
    "West Virginia": { "rate": 0.12, "demandCharge": 11, "peakRate": 0.16 },
    "Wisconsin": { "rate": 0.15, "demandCharge": 13, "peakRate": 0.19 },
    "Wyoming": { "rate": 0.11, "demandCharge": 10, "peakRate": 0.14 },
    "Other": { "rate": 0.13, "demandCharge": 15, "peakRate": 0.19 }
}'::jsonb,
    updated_at = NOW()
WHERE config_key = 'state_electricity_rates';

-- ============================================================================
-- STEP 5: Create function to get rate by ZIP code
-- ============================================================================

CREATE OR REPLACE FUNCTION get_utility_rate_by_zip(p_zip_code VARCHAR(5))
RETURNS TABLE (
    utility_name VARCHAR,
    state_name VARCHAR,
    commercial_rate DECIMAL,
    demand_charge DECIMAL,
    has_tou BOOLEAN,
    peak_rate DECIMAL,
    off_peak_rate DECIMAL,
    solar_potential VARCHAR,
    wind_potential VARCHAR
) AS $$
DECLARE
    v_zip_prefix VARCHAR(3);
    v_state_code VARCHAR(2);
BEGIN
    v_zip_prefix := LEFT(p_zip_code, 3);
    
    -- First try to find utility-specific rate by ZIP prefix
    RETURN QUERY
    SELECT 
        ur.utility_name,
        ur.state_name,
        ur.commercial_rate,
        ur.demand_charge,
        ur.has_tou,
        ur.peak_rate,
        ur.off_peak_rate,
        ur.solar_potential,
        ur.wind_potential
    FROM utility_rates ur
    WHERE ur.zip_prefix = v_zip_prefix
    LIMIT 1;
    
    -- If found, return
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Otherwise, determine state from ZIP and return state average
    -- ZIP prefix to state mapping (simplified)
    v_state_code := CASE
        WHEN v_zip_prefix::int BETWEEN 100 AND 149 THEN 'NY'
        WHEN v_zip_prefix::int BETWEEN 150 AND 196 THEN 'PA'
        WHEN v_zip_prefix::int BETWEEN 200 AND 219 THEN 'MD'
        WHEN v_zip_prefix::int BETWEEN 220 AND 246 THEN 'VA'
        WHEN v_zip_prefix::int BETWEEN 270 AND 289 THEN 'NC'
        WHEN v_zip_prefix::int BETWEEN 300 AND 319 THEN 'GA'
        WHEN v_zip_prefix::int BETWEEN 320 AND 339 THEN 'FL'
        WHEN v_zip_prefix::int BETWEEN 350 AND 369 THEN 'AL'
        WHEN v_zip_prefix::int BETWEEN 370 AND 385 THEN 'TN'
        WHEN v_zip_prefix::int BETWEEN 400 AND 427 THEN 'KY'
        WHEN v_zip_prefix::int BETWEEN 430 AND 458 THEN 'OH'
        WHEN v_zip_prefix::int BETWEEN 460 AND 479 THEN 'IN'
        WHEN v_zip_prefix::int BETWEEN 480 AND 499 THEN 'MI'
        WHEN v_zip_prefix::int BETWEEN 500 AND 528 THEN 'IA'
        WHEN v_zip_prefix::int BETWEEN 530 AND 549 THEN 'WI'
        WHEN v_zip_prefix::int BETWEEN 550 AND 567 THEN 'MN'
        WHEN v_zip_prefix::int BETWEEN 600 AND 629 THEN 'IL'
        WHEN v_zip_prefix::int BETWEEN 630 AND 658 THEN 'MO'
        WHEN v_zip_prefix::int BETWEEN 700 AND 714 THEN 'LA'
        WHEN v_zip_prefix::int BETWEEN 750 AND 799 THEN 'TX'
        WHEN v_zip_prefix::int BETWEEN 800 AND 816 THEN 'CO'
        WHEN v_zip_prefix::int BETWEEN 850 AND 865 THEN 'AZ'
        WHEN v_zip_prefix::int BETWEEN 870 AND 884 THEN 'NM'
        WHEN v_zip_prefix::int BETWEEN 889 AND 898 THEN 'NV'
        WHEN v_zip_prefix::int BETWEEN 900 AND 966 THEN 'CA'
        WHEN v_zip_prefix::int BETWEEN 970 AND 979 THEN 'OR'
        WHEN v_zip_prefix::int BETWEEN 980 AND 994 THEN 'WA'
        ELSE NULL
    END;
    
    IF v_state_code IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            ur.utility_name,
            ur.state_name,
            ur.commercial_rate,
            ur.demand_charge,
            ur.has_tou,
            ur.peak_rate,
            ur.off_peak_rate,
            ur.solar_potential,
            ur.wind_potential
        FROM utility_rates ur
        WHERE ur.state_code = v_state_code
          AND ur.utility_id LIKE '%avg%'
        LIMIT 1;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show count of rates by state
SELECT state_code, COUNT(*) as rate_count 
FROM utility_rates 
GROUP BY state_code 
ORDER BY state_code;

-- Test ZIP lookup function
SELECT * FROM get_utility_rate_by_zip('48226'); -- Detroit, MI
SELECT * FROM get_utility_rate_by_zip('94102'); -- San Francisco, CA
SELECT * FROM get_utility_rate_by_zip('75201'); -- Dallas, TX
