-- ============================================================================
-- ADDITIONAL MARKET DATA SOURCES - SOLAR, BESS, CAR WASH, ENERGY MANAGEMENT
-- User-provided 3rd party links from Vineet
-- Created: December 10, 2025
-- ============================================================================

INSERT INTO market_data_sources (name, url, feed_url, source_type, equipment_categories, content_type, regions, reliability_score, data_frequency, notes) VALUES

-- =====================
-- SOLAR SOURCES
-- =====================
('Motive Energy Sustainable Solutions', 'https://www.motiveenergy.com/divisions/sustainable-solutions/', NULL, 'manufacturer',
 ARRAY['solar', 'bess'], 'product_specs', ARRAY['north-america'],
 3, 'quarterly', 'Solar and sustainable solutions provider.'),

('LinkedIn - Hervé Billiet Solar ROI', 'https://www.linkedin.com/posts/hervebilliet_your-customer-just-spent-45000-on-solar-activity-7394720780808404992-9cRq/', NULL, 'web_scrape',
 ARRAY['solar'], 'pricing', ARRAY['north-america'],
 3, 'weekly', 'Industry insights: $45,000 residential solar system economics.'),

('Professional Institute Solar Training', 'https://professional-institute.com', NULL, 'web_scrape',
 ARRAY['solar'], 'market_trends', ARRAY['north-america'],
 3, 'monthly', 'Solar industry training and market insights.'),

('Sunvoy - Residential vs Commercial Solar', 'https://sunvoy.com/blog/Residential-vs-Commercial', NULL, 'web_scrape',
 ARRAY['solar'], 'market_trends', ARRAY['north-america'],
 4, 'monthly', 'Key breakdown: Residential vs commercial solar differences. Useful for vertical segmentation.'),

('LinkedIn - Hervé Billiet Solar Diversification', 'https://www.linkedin.com/posts/hervebilliet_9-ways-to-diversify-your-solar-business-before-activity-7400881291115675648-qSXV/', NULL, 'web_scrape',
 ARRAY['solar', 'bess'], 'market_trends', ARRAY['north-america'],
 3, 'weekly', '9 ways to diversify solar business before ITC deadline. Includes BESS, HVAC, O&M strategies.'),

('Tabbre Grid-Scale Solar Costs', 'https://www.tabbre.com/documents/blog/TheCostOfGridScaleSolarEnergy', NULL, 'web_scrape',
 ARRAY['solar'], 'pricing', ARRAY['global'],
 3, 'quarterly', 'Grid-scale solar energy cost analysis.'),

-- =====================
-- ENERGY MANAGEMENT SOURCES
-- =====================
('Paces Energy Management Software', 'https://www.paces.com/products/software', NULL, 'manufacturer',
 ARRAY['bess', 'solar'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Energy management software platform. Useful for BESS integration insights.'),

-- =====================
-- BESS SOURCES
-- =====================
('Blink Charging - Automotive BESS Savings', 'https://blinkcharging.com/blog/how-automotive-dealerships-can-save-money-with-battery-energy-storage', NULL, 'web_scrape',
 ARRAY['bess', 'ev-charger'], 'mixed', ARRAY['north-america'],
 4, 'monthly', 'Case study: BESS savings for automotive dealerships. Good vertical-specific data.'),

('LinkedIn - NextEra/Google Cloud BESS', 'https://www.linkedin.com/posts/buildingthegrid_nextera-energy-inc-and-google-cloud-just-activity-7403818875383177216-Qge9/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'weekly', 'NextEra Energy and Google Cloud BESS partnership news.'),

('Nira Energy', 'https://www.niraenergy.com', NULL, 'manufacturer',
 ARRAY['bess', 'solar'], 'product_specs', ARRAY['north-america'],
 4, 'quarterly', 'Energy storage and solar solutions provider.'),

('Financial Content - BESS Startup Gold Rush', 'https://markets.financialcontent.com/wral/article/globeprwire-2025-12-6-why-battery-energy-storage-system-bess-startups-are-becoming-the-new-gold-rush-for-institutional-investors', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'monthly', 'BESS startups attracting institutional investors. Market growth signals.'),

-- =====================
-- CAR WASH VERTICAL SOURCES
-- =====================
('Unite Automotive - Car Wash Technology', 'https://www.uniteautomotive.com/index.php?route=blog/article&article_id=117', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'monthly', 'Car wash technology trends. Relevant for car wash vertical energy needs.'),

('Electrical Engineering Resource - Car Wash Safety & Sustainability', 'https://electricalengineeringresource.com/how-car-wash-operators-and-oems-utilize-technology-to-improve-safety-and-sustainability/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 4, 'monthly', 'Car wash operators using technology for sustainability. Energy efficiency focus.'),

('Shining Star Wash - Car Wash Tech Trends 2025', 'https://shiningstarwash.com/2025/02/18/key-trends-in-automated-car-wash-technology-for-2025/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'quarterly', 'Key trends in automated car wash technology for 2025.'),

('CarWash.com - Operations Energy Efficiency', 'https://www.carwash.com/operations-energy-efficiency/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 4, 'monthly', 'Car wash operations energy efficiency guide. Direct relevance to BESS sizing.'),

('LinkedIn - BJ Feller Car Wash Net Lease', 'https://www.linkedin.com/posts/bj-feller-41660b10_netlease-capitalmarkets-cre-activity-7386441735087972352-2XBr/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'weekly', 'Car wash net lease and capital markets insights.'),

('LinkedIn - Micrologic Car Wash Industry Transformation', 'https://www.linkedin.com/posts/micrologic-associates_the-car-wash-industry-is-in-the-middle-of-activity-7382414661234667520-4XSY/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'weekly', 'Car wash industry transformation analysis. BESS opportunity signals.'),

('LinkedIn - Stacy Gallant Car Wash Evolution', 'https://www.linkedin.com/posts/stacy-gallant-82281714a_the-car-wash-industry-is-bigger-and-evolving-activity-7403089591190110208-yvnt/', NULL, 'web_scrape',
 ARRAY['bess'], 'market_trends', ARRAY['north-america'],
 3, 'weekly', 'Car wash industry size and evolution. Market sizing data.')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE SUMMARY
-- ============================================================================
-- New sources added: 18
--
-- By category:
-- - Solar: 6 sources
-- - BESS: 4 sources  
-- - Car Wash vertical: 7 sources
-- - Energy Management: 1 source
--
-- Key insights from these sources:
-- 1. Solar ITC deadline (Dec 31, 2025) driving business diversification
-- 2. Residential solar systems: ~$45,000 example
-- 3. BESS becoming "gold rush" for institutional investors
-- 4. Car wash industry transformation = BESS opportunity
-- 5. Automotive dealerships saving money with BESS (Blink case study)
--
-- Vertical-specific sources added:
-- - Car wash energy efficiency: 7 sources
-- - These support the CarWashWizard and CarWashEnergy components
-- ============================================================================
