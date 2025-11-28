-- Great Power BESS - Sample Price Alerts
-- Run this in Supabase SQL Editor after price_alerts_schema.sql

-- Alert 1: Arizona Utility Grid Services Project
INSERT INTO energy_price_alerts (
  alert_type, alert_level, price_value, price_unit,
  deal_name, project_size_mw, project_location, vendor_company,
  source_title, source_url, source_publisher, publish_date,
  deal_summary, market_impact, price_trend, relevance_score,
  industry_sector, technology_type,
  baseline_price, price_difference_percent, is_below_market,
  verified
) VALUES
(
  'battery_kwh', 'excellent_deal', 122.00, 'kwh',
  'Arizona Utility Grid Services Project', 75.0, 'Arizona, USA', 'Great Power',
  'Great Power Secures 75MW Arizona Contract at $122/kWh with 10-Year Warranty',
  'https://energystoragejournal.com/great-power-arizona-75mw',
  'Energy Storage Journal', NOW() - INTERVAL '3 days',
  'Great Power deployed 75MW/300MWh GES-5MWh container systems for Arizona Public Service at $122/kWh, featuring advanced thermal management and 6,000 cycle life rating.',
  'Significant - Great Power demonstrates competitive pricing in North American utility market, challenging established Western manufacturers with proven LFP technology.',
  'declining', 92,
  'utility', 'lfp',
  140.00, -12.86, true,
  true
);

-- Alert 2: Nevada Mining Operations Microgrid
INSERT INTO energy_price_alerts (
  alert_type, alert_level, price_value, price_unit,
  deal_name, project_size_mw, project_location, vendor_company,
  source_title, source_url, source_publisher, publish_date,
  deal_summary, market_impact, price_trend, relevance_score,
  industry_sector, technology_type,
  baseline_price, price_difference_percent, is_below_market,
  verified
) VALUES
(
  'battery_kwh', 'good_deal', 148.00, 'kwh',
  'Nevada Mining Operations Microgrid', 8.0, 'Nevada, USA', 'Great Power',
  'Great Power Batteries Power Off-Grid Mining Operation in Nevada',
  'https://pv-magazine-usa.com/great-power-nevada-mining',
  'PV Magazine USA', NOW() - INTERVAL '1 week',
  'Great Power supplied 8MW/32MWh of GES-2.5MWh systems for a remote gold mining operation, providing 4-hour backup with solar integration at $148/kWh total installed cost.',
  'Moderate - Competitive pricing for off-grid industrial application demonstrates Great Power''s capability in harsh environment deployments with 24/7 operation requirements.',
  'stable', 85,
  'industrial', 'lfp',
  165.00, -10.30, true,
  true
);

-- Alert 3: Colorado Renewable Integration Project
INSERT INTO energy_price_alerts (
  alert_type, alert_level, price_value, price_unit,
  deal_name, project_size_mw, project_location, vendor_company,
  source_title, source_url, source_publisher, publish_date,
  deal_summary, market_impact, price_trend, relevance_score,
  industry_sector, technology_type,
  baseline_price, price_difference_percent, is_below_market,
  verified
) VALUES
(
  'battery_mwh', 'good_deal', 480000, 'mwh',
  'Colorado Renewable Integration Project', 120.0, 'Colorado, USA', 'Great Power',
  'Great Power and Xcel Energy Partner on $57.6M Colorado Storage Project',
  'https://utilitydive.com/great-power-xcel-colorado',
  'Utility Dive', NOW() - INTERVAL '10 days',
  'Great Power awarded contract for 120MW/480MWh system at $480k/MWh ($120/kWh) installed cost for Xcel Energy renewable integration services. Project includes 10-year O&M agreement.',
  'Significant - First major Great Power deployment with a major US utility, demonstrating market acceptance and competitive total cost of ownership.',
  'declining', 90,
  'utility', 'lfp',
  500000, -4.00, true,
  true
);

-- Alert 4: Multi-State Utility RFP Results
INSERT INTO energy_price_alerts (
  alert_type, alert_level, price_value, price_unit,
  deal_name, project_size_mw, project_location, vendor_company,
  source_title, source_url, source_publisher, publish_date,
  deal_summary, market_impact, price_trend, relevance_score,
  industry_sector, technology_type,
  baseline_price, price_difference_percent, is_below_market,
  verified
) VALUES
(
  'battery_kwh', 'info', 135.00, 'kwh',
  'Multi-State Utility RFP Results', 50.0, 'USA', 'Great Power',
  'Great Power Emerges as Cost Leader in Multi-State Utility-Scale Battery RFP',
  'https://energystoragejournal.com/great-power-rfp-results',
  'Energy Storage Journal', NOW() - INTERVAL '5 days',
  'Analysis of recent utility RFP results shows Great Power averaging $135/kWh across 50MW+ projects, undercutting Tesla by 8% and matching BYD pricing with faster delivery times.',
  'Moderate - Great Power establishes competitive position in North American market with pricing between Chinese manufacturers (CATL/BYD) and premium Western brands (Tesla/Fluence).',
  'stable', 88,
  'utility', 'lfp',
  140.00, -3.57, true,
  true
);
