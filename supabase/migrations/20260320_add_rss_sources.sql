-- Add Additional RSS Sources for Equipment Pricing Intelligence
-- Created: March 20, 2026

-- Add vendor RSS feeds
INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, is_active)
VALUES
-- BESS Manufacturers
('Tesla Energy News', 'https://www.tesla.com/energy', 'https://www.tesla.com/blog/rss', 'rss_feed', ARRAY['bess', 'inverter', 'solar'], 'news', ARRAY['United States', 'Global'], 5, 'weekly', true),
('Fluence Energy', 'https://fluenceenergy.com', 'https://fluenceenergy.com/feed/', 'rss_feed', ARRAY['bess', 'microgrid', 'hybrid-system'], 'news', ARRAY['United States', 'Global'], 4, 'weekly', true),

-- Industry Analysis
('Wood Mackenzie Power & Renewables', 'https://www.woodmac.com/research/products/power-and-renewables/', NULL, 'data_provider', ARRAY['bess', 'solar', 'wind'], 'market_trends', ARRAY['Global'], 5, 'monthly', false), -- Requires subscription
('IHS Markit Energy', 'https://ihsmarkit.com/products/clean-energy-technology.html', NULL, 'data_provider', ARRAY['bess', 'solar', 'wind'], 'market_trends', ARRAY['Global'], 5, 'monthly', false), -- Requires subscription

-- Government & Research
('EIA Today in Energy', 'https://www.eia.gov', 'https://www.eia.gov/rss/todayinenergy.xml', 'rss_feed', ARRAY['bess', 'solar', 'wind', 'generator'], 'mixed', ARRAY['United States'], 5, 'daily', true),
('NREL News', 'https://www.nrel.gov', 'https://www.nrel.gov/news/rss.xml', 'rss_feed', ARRAY['bess', 'solar', 'wind'], 'market_trends', ARRAY['United States'], 5, 'weekly', false),
('LBNL Electricity Markets', 'https://emp.lbl.gov', 'https://emp.lbl.gov/rss.xml', 'rss_feed', ARRAY['bess', 'solar', 'wind'], 'market_trends', ARRAY['United States'], 5, 'monthly', true),

-- Trade Publications
('Greentech Media', 'https://www.greentechmedia.com', 'https://www.greentechmedia.com/rss', 'rss_feed', ARRAY['bess', 'solar', 'wind', 'ev-charger'], 'news', ARRAY['United States', 'Global'], 5, 'daily', true),
('Energy Storage Association', 'https://energystorage.org', 'https://energystorage.org/feed/', 'rss_feed', ARRAY['bess', 'hybrid-system'], 'news', ARRAY['United States'], 5, 'weekly', false),
('Solar Industry Magazine', 'https://solarindustrymag.com', 'https://solarindustrymag.com/feed', 'rss_feed', ARRAY['solar', 'inverter'], 'news', ARRAY['United States'], 4, 'daily', true),

-- European Sources
('Energy Storage Europe', 'https://www.energystorageeurope.com', 'https://www.energystorageeurope.com/feed/', 'rss_feed', ARRAY['bess', 'hybrid-system'], 'news', ARRAY['Europe'], 4, 'weekly', true),
('Solar Power Portal', 'https://www.solarpowerportal.co.uk', 'https://www.solarpowerportal.co.uk/feed', 'rss_feed', ARRAY['solar', 'bess'], 'news', ARRAY['Europe', 'United Kingdom'], 4, 'daily', false),

-- Asian Markets
('PV InfoLink', 'https://www.pv-infolink.com', 'https://www.pv-infolink.com/feed/', 'rss_feed', ARRAY['solar'], 'market_trends', ARRAY['Asia', 'China'], 5, 'weekly', true),

-- Battery & Materials
('Benchmark Mineral Intelligence', 'https://www.benchmarkminerals.com', NULL, 'data_provider', ARRAY['bess'], 'market_trends', ARRAY['Global'], 5, 'monthly', false), -- Requires subscription
('Battery News', 'https://www.batterynews.de', 'https://www.batterynews.de/feed/', 'rss_feed', ARRAY['bess', 'bms'], 'news', ARRAY['Europe', 'Global'], 3, 'daily', true),

-- Inverter & Power Electronics
('SMA Solar Technology', 'https://www.sma.de', 'https://www.sma.de/en/newsroom.html', 'rss_feed', ARRAY['inverter', 'solar'], 'news', ARRAY['Europe', 'Global'], 4, 'monthly', true),
('Enphase Energy', 'https://enphase.com', 'https://enphase.com/newsroom', 'rss_feed', ARRAY['inverter', 'solar', 'bess'], 'news', ARRAY['United States', 'Global'], 4, 'monthly', false),

-- EV & Charging
('ChargePoint Blog', 'https://www.chargepoint.com/blog', 'https://www.chargepoint.com/blog/feed/', 'rss_feed', ARRAY['ev-charger'], 'news', ARRAY['United States', 'Global'], 4, 'weekly', false),
('EVgo News', 'https://www.evgo.com/blog/', 'https://www.evgo.com/blog/feed/', 'rss_feed', ARRAY['ev-charger'], 'news', ARRAY['United States'], 4, 'weekly', true),

-- Microgrid & DER
('Microgrid Knowledge', 'https://microgridknowledge.com', 'https://microgridknowledge.com/feed/', 'rss_feed', ARRAY['microgrid', 'bess', 'generator'], 'news', ARRAY['United States', 'Global'], 4, 'daily', false),
('Distributed Energy', 'https://www.distributedenergy.com', 'https://www.distributedenergy.com/feed', 'rss_feed', ARRAY['microgrid', 'bess', 'solar', 'generator'], 'news', ARRAY['United States'], 4, 'weekly', true)

ON CONFLICT DO NOTHING;

-- Update existing sources with better metadata
UPDATE market_data_sources 
SET reliability_score = 5, content_type = 'news'
WHERE name = 'PV Tech';

UPDATE market_data_sources 
SET reliability_score = 5, content_type = 'news'  
WHERE name = 'Energy Storage News';

UPDATE market_data_sources
SET reliability_score = 4, content_type = 'news'
WHERE name = 'PV Magazine Global';

UPDATE market_data_sources
SET reliability_score = 4, content_type = 'news'
WHERE name = 'Utility Dive';

UPDATE market_data_sources
SET reliability_score = 4, content_type = 'news'
WHERE name = 'CleanTechnica';

UPDATE market_data_sources
SET reliability_score = 3, content_type = 'news'
WHERE name = 'Electrek RSS';

-- Add comment
COMMENT ON TABLE market_data_sources IS 'RSS feeds and data sources for equipment pricing intelligence. Reliability score: 0-100 based on data quality and frequency.';
