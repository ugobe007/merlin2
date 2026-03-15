-- Seed Sample Energy News Articles
-- Run this to populate scraped_articles table with test data

-- First, ensure we have a source (using a proper UUID)
INSERT INTO market_data_sources (id, name, source_type, url, is_active, content_type)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Energy News Today', 'rss_feed', 'https://energynews.test', true, 'news')
ON CONFLICT (id) DO NOTHING;

-- Insert sample articles
INSERT INTO scraped_articles (
  source_id,
  title,
  url,
  summary,
  full_content,
  published_at,
  fetched_at,
  topics,
  equipment_mentioned,
  relevance_score,
  is_processed
)
VALUES
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'BESS Market Reaches Record $15B in Q1 2026',
    'https://energynews.test/bess-market-q1-2026',
    'The battery energy storage system market hit a record $15 billion in Q1 2026, driven by falling lithium prices and increased grid integration needs.',
    'Full article content about BESS market growth...',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    ARRAY['pricing', 'market-trends', 'bess'],
    ARRAY['bess', 'battery', 'lithium'],
    8.55,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'New IRA Tax Credit Extensions Announced',
    'https://energynews.test/ira-extensions-2026',
    'Federal government extends IRA tax credits for energy storage through 2030, including new provisions for domestic content requirements.',
    'Full article about IRA extensions...',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours',
    ARRAY['regulations', 'tax-credits', 'ira'],
    ARRAY['bess', 'solar'],
    9.20,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Solar + Storage Projects Surge 40% This Quarter',
    'https://energynews.test/solar-storage-surge',
    'Combined solar and battery storage installations increased 40% compared to last quarter, with California leading deployment.',
    'Full article about solar + storage...',
    NOW() - INTERVAL '8 hours',
    NOW() - INTERVAL '8 hours',
    ARRAY['market-trends', 'solar', 'deployment'],
    ARRAY['solar', 'bess', 'inverter'],
    8.85,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'EV Charging Infrastructure Gets $2B Federal Boost',
    'https://energynews.test/ev-charging-boost',
    'New federal funding allocates $2 billion for EV charging infrastructure expansion across highway corridors.',
    'Full article about EV charging expansion...',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours',
    ARRAY['ev-charging', 'infrastructure', 'funding'],
    ARRAY['ev-charger', 'dcfc'],
    8.00,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Wind Power Sets New Production Record',
    'https://energynews.test/wind-power-record',
    'Offshore wind farms achieved record production levels, generating 15% of total US electricity in February.',
    'Full article about wind power records...',
    NOW() - INTERVAL '18 hours',
    NOW() - INTERVAL '18 hours',
    ARRAY['wind', 'production', 'records'],
    ARRAY['wind', 'turbine'],
    7.50,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Grid Modernization Act Passes Senate',
    'https://energynews.test/grid-modernization-act',
    'Senate passes comprehensive grid modernization legislation aimed at improving energy storage integration and grid resilience.',
    'Full article about grid modernization...',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    ARRAY['regulations', 'grid', 'policy'],
    ARRAY['bess', 'transformer', 'inverter'],
    9.00,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Battery Chemistry Breakthrough: Sodium-Ion Shows Promise',
    'https://energynews.test/sodium-ion-breakthrough',
    'New sodium-ion battery technology achieves 95% energy density of lithium at 40% lower cost, potentially disrupting BESS market.',
    'Full article about sodium-ion batteries...',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    ARRAY['technology', 'battery-chemistry', 'innovation'],
    ARRAY['battery', 'bess'],
    9.50,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'California Announces 5 GW Energy Storage Mandate',
    'https://energynews.test/california-5gw-mandate',
    'California Public Utilities Commission mandates 5 GW of new energy storage by 2028 to support renewable integration.',
    'Full article about California storage mandate...',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    ARRAY['regulations', 'mandates', 'california'],
    ARRAY['bess'],
    8.70,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Microgrid Market Expected to Triple by 2028',
    'https://energynews.test/microgrid-market-forecast',
    'Industry analysts project microgrid installations will triple by 2028, driven by resilience needs and renewable integration.',
    'Full article about microgrid market...',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    ARRAY['market-trends', 'microgrids', 'forecasts'],
    ARRAY['bess', 'solar', 'generator', 'inverter'],
    8.20,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'DOE Announces $500M for Long-Duration Storage Research',
    'https://energynews.test/doe-storage-funding',
    'Department of Energy commits $500 million to long-duration energy storage research, targeting 10+ hour discharge capabilities.',
    'Full article about DOE funding...',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week',
    ARRAY['funding', 'research', 'government'],
    ARRAY['bess', 'battery'],
    9.30,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Texas Grid Operator Seeks 8 GW of Emergency Storage',
    'https://energynews.test/texas-emergency-storage',
    'ERCOT issues emergency procurement for 8 GW of battery storage following winter storm vulnerabilities.',
    'Full article about Texas storage...',
    NOW() - INTERVAL '1 week',
    NOW() - INTERVAL '1 week',
    ARRAY['grid', 'emergencies', 'texas'],
    ARRAY['bess'],
    8.90,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Utility-Scale Solar Costs Drop Below $0.50/W',
    'https://energynews.test/solar-cost-drop',
    'Utility-scale solar installation costs hit record low of $0.48/W, making solar+storage increasingly competitive.',
    'Full article about solar costs...',
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '2 weeks',
    ARRAY['pricing', 'solar', 'cost-reduction'],
    ARRAY['solar'],
    7.80,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'FERC Approves New Interconnection Rules',
    'https://energynews.test/ferc-interconnection',
    'Federal Energy Regulatory Commission approves streamlined interconnection rules for energy storage projects.',
    'Full article about FERC rules...',
    NOW() - INTERVAL '2 weeks',
    NOW() - INTERVAL '2 weeks',
    ARRAY['regulations', 'interconnection', 'ferc'],
    ARRAY['bess', 'solar', 'wind'],
    8.60,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Data Center Operators Turn to On-Site BESS for Reliability',
    'https://energynews.test/datacenter-bess',
    'Major data center operators increasingly deploying on-site battery storage for backup power and demand charge reduction.',
    'Full article about data center BESS...',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks',
    ARRAY['data-centers', 'applications', 'reliability'],
    ARRAY['bess', 'generator'],
    8.40,
    true
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'Europe Energy Storage Market Grows 60% Year-Over-Year',
    'https://energynews.test/europe-storage-growth',
    'European energy storage installations surged 60% compared to last year, led by Germany and UK deployments.',
    'Full article about European market...',
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month',
    ARRAY['market-trends', 'europe', 'growth'],
    ARRAY['bess'],
    8.10,
    true
  );

-- Verify insertion
SELECT 
  COUNT(*) as total_articles,
  MIN(fetched_at) as earliest,
  MAX(fetched_at) as latest
FROM scraped_articles;
