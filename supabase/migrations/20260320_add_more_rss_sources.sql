-- Add More RSS Sources for Equipment Pricing Intelligence
-- Created: March 20, 2026
-- Additional sources to expand coverage

INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES

-- =====================
-- BATTERY & ENERGY STORAGE NEWS
-- =====================
('Energy Storage Report', 'https://energystoragereport.info', 'https://energystoragereport.info/feed/', 'rss_feed', ARRAY['bess', 'flow-battery'], 'news', ARRAY['Global'], 4, 'weekly', true),
('Battery Technology', 'https://www.batterytechnology.org', 'https://www.batterytechnology.org/feed/', 'rss_feed', ARRAY['bess', 'battery'], 'market_trends', ARRAY['Global'], 4, 'weekly', true),
('Charged EVs', 'https://chargedevs.com', 'https://chargedevs.com/feed/', 'rss_feed', ARRAY['bess', 'ev-charger'], 'news', ARRAY['United States', 'Global'], 4, 'daily', true),

-- =====================
-- SOLAR INDUSTRY
-- =====================
('Solar Builder', 'https://solarbuildermag.com', 'https://solarbuildermag.com/feed/', 'rss_feed', ARRAY['solar', 'inverter'], 'news', ARRAY['United States'], 4, 'daily', true),
('PV-Tech.org', 'https://www.pv-tech.org', 'https://www.pv-tech.org/feed/', 'rss_feed', ARRAY['solar', 'bess'], 'news', ARRAY['Global'], 5, 'daily', true),
('Solar Reviews', 'https://www.solarreviews.com', 'https://www.solarreviews.com/blog/feed', 'rss_feed', ARRAY['solar'], 'news', ARRAY['United States'], 3, 'weekly', true),

-- =====================
-- WIND & RENEWABLES
-- =====================
('Recharge News', 'https://www.rechargenews.com', 'https://www.rechargenews.com/feed/rss', 'rss_feed', ARRAY['wind', 'solar', 'bess'], 'news', ARRAY['Global'], 5, 'daily', true),
('Windpower Monthly', 'https://www.windpowermonthly.com', 'https://www.windpowermonthly.com/rss', 'rss_feed', ARRAY['wind'], 'news', ARRAY['Global'], 4, 'daily', true),
('Offshore Wind', 'https://www.offshorewind.biz', 'https://www.offshorewind.biz/feed/', 'rss_feed', ARRAY['wind'], 'news', ARRAY['Europe', 'Global'], 4, 'daily', true),

-- =====================
-- ENERGY POLICY & MARKETS
-- =====================
('Power Engineering International', 'https://www.powerengineeringint.com', 'https://www.powerengineeringint.com/feed/', 'rss_feed', ARRAY['generator', 'bess', 'microgrid'], 'news', ARRAY['Global'], 4, 'daily', true),
('Energy News Network', 'https://energynews.us', 'https://energynews.us/feed/', 'rss_feed', ARRAY['solar', 'wind', 'bess'], 'policy', ARRAY['United States'], 4, 'daily', true),
('RTO Insider', 'https://www.rtoinsider.com', 'https://www.rtoinsider.com/feed/', 'rss_feed', ARRAY['bess', 'generator'], 'market_trends', ARRAY['United States'], 4, 'daily', true),

-- =====================
-- ELECTRIC VEHICLES & CHARGING
-- =====================
('Inside EVs', 'https://insideevs.com', 'https://insideevs.com/feed/', 'rss_feed', ARRAY['ev-charger', 'bess'], 'news', ARRAY['Global'], 4, 'daily', true),
('Transport & Environment', 'https://www.transportenvironment.org', 'https://www.transportenvironment.org/feed/', 'rss_feed', ARRAY['ev-charger'], 'policy', ARRAY['Europe'], 4, 'weekly', true),
('Charged Fleet', 'https://chargedfleet.com', 'https://chargedfleet.com/feed/', 'rss_feed', ARRAY['ev-charger'], 'news', ARRAY['United States'], 3, 'weekly', true),

-- =====================
-- MANUFACTURERS & VENDORS
-- =====================
('ABB Energy', 'https://new.abb.com/news', 'https://new.abb.com/news/rss', 'rss_feed', ARRAY['inverter', 'microgrid', 'bess'], 'news', ARRAY['Global'], 4, 'monthly', true),
('Schneider Electric Blog', 'https://blog.se.com', 'https://blog.se.com/feed/', 'rss_feed', ARRAY['microgrid', 'bess', 'ev-charger'], 'news', ARRAY['Global'], 4, 'weekly', true),
('Siemens Energy', 'https://www.siemens-energy.com', 'https://www.siemens-energy.com/global/en/news.rss', 'rss_feed', ARRAY['generator', 'microgrid'], 'news', ARRAY['Global'], 4, 'monthly', true),

-- =====================
-- ASIA-PACIFIC
-- =====================
('PV Magazine India', 'https://www.pv-magazine-india.com', 'https://www.pv-magazine-india.com/feed/', 'rss_feed', ARRAY['solar', 'bess'], 'news', ARRAY['Asia', 'India'], 4, 'daily', true),
('PV Magazine Australia', 'https://www.pv-magazine-australia.com', 'https://www.pv-magazine-australia.com/feed/', 'rss_feed', ARRAY['solar', 'bess'], 'news', ARRAY['Asia-Pacific', 'Australia'], 4, 'daily', true),
('Renew Economy', 'https://reneweconomy.com.au', 'https://reneweconomy.com.au/feed/', 'rss_feed', ARRAY['solar', 'wind', 'bess'], 'news', ARRAY['Asia-Pacific', 'Australia'], 4, 'daily', true),

-- =====================
-- RESEARCH & ANALYSIS
-- =====================
('MIT Energy Initiative', 'https://energy.mit.edu', 'https://energy.mit.edu/feed/', 'rss_feed', ARRAY['bess', 'solar', 'wind'], 'market_trends', ARRAY['United States'], 5, 'weekly', true),
('Rocky Mountain Institute', 'https://rmi.org', 'https://rmi.org/feed/', 'rss_feed', ARRAY['solar', 'bess', 'ev-charger'], 'market_trends', ARRAY['United States', 'Global'], 5, 'weekly', true),
('Carbon Brief', 'https://www.carbonbrief.org', 'https://www.carbonbrief.org/feed/', 'rss_feed', ARRAY['solar', 'wind', 'bess'], 'market_trends', ARRAY['Global'], 5, 'daily', true),

-- =====================
-- TECHNOLOGY & INNOVATION
-- =====================
('IEEE Spectrum Energy', 'https://spectrum.ieee.org/energy', 'https://spectrum.ieee.org/feeds/feed.rss', 'rss_feed', ARRAY['bess', 'solar', 'wind', 'generator'], 'market_trends', ARRAY['Global'], 5, 'daily', true),
('Energy Tech Review', 'https://www.energytechreview.com', 'https://www.energytechreview.com/feed/', 'rss_feed', ARRAY['bess', 'solar', 'microgrid'], 'news', ARRAY['Global'], 3, 'weekly', true),
('Smart Energy International', 'https://www.smart-energy.com', 'https://www.smart-energy.com/feed/', 'rss_feed', ARRAY['bess', 'solar', 'microgrid'], 'news', ARRAY['Global'], 4, 'daily', true),

-- =====================
-- GRID & INFRASTRUCTURE
-- =====================
('Transmission & Distribution World', 'https://www.tdworld.com', 'https://www.tdworld.com/rss.xml', 'rss_feed', ARRAY['bess', 'generator', 'microgrid'], 'news', ARRAY['United States'], 4, 'weekly', true),
('Smart Grid Today', 'https://www.smartgridtoday.com', 'https://www.smartgridtoday.com/feed/', 'rss_feed', ARRAY['bess', 'microgrid'], 'news', ARRAY['United States'], 3, 'weekly', true),
('Energy Manager Today', 'https://www.energymanagertoday.com', 'https://www.energymanagertoday.com/feed/', 'rss_feed', ARRAY['solar', 'bess', 'ev-charger'], 'news', ARRAY['United States'], 3, 'daily', true)

ON CONFLICT DO NOTHING;

-- Update comment
COMMENT ON TABLE market_data_sources IS 'RSS feeds and data sources for equipment pricing intelligence. Expanded coverage as of March 2026. Reliability score: 1-5 based on data quality and frequency.';

-- Log results
DO $$
DECLARE
    active_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO active_count FROM market_data_sources WHERE is_active = true AND source_type = 'rss_feed';
    SELECT COUNT(*) INTO total_count FROM market_data_sources WHERE source_type = 'rss_feed';
    
    RAISE NOTICE 'Total RSS sources: %, Active: %', total_count, active_count;
END $$;
