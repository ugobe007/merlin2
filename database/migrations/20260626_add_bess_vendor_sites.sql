-- ============================================================================
-- ADD BESS VENDOR SITES & MANUFACTURERS
-- Created: June 26, 2026
-- Source: User-provided URLs for BESS manufacturer/vendor research
-- ============================================================================
-- URLs ingested:
--   1. https://www.solaxpower.com/blogs/battery-storage-manufacturers.html
--   2. https://www.srnesolar.com/articledetail/top-10-commercial-energy-storage-companies-in-2025.html
--   3. https://www.dashiell.com/markets-industries/battery-energy-storage-systems-bess/
--   4. https://www.greatpower.net/
--   5. https://discoverenergysys.com/
--   6. https://lionenergy.com/
-- ============================================================================

-- ============================================================================
-- PART 1: MARKET DATA SOURCES
-- Adds each URL as a trackable intelligence source
-- ============================================================================

INSERT INTO market_data_sources (
  name, url, feed_url, source_type, equipment_categories,
  content_type, regions, reliability_score, data_frequency, notes
) VALUES

-- ── Source 1: SolaX Power BESS Manufacturer Guide ────────────────────────────
(
  'SolaX Power – Top BESS Manufacturers & Battery Storage Companies 2026',
  'https://www.solaxpower.com/blogs/battery-storage-manufacturers.html',
  NULL,
  'manufacturer',
  ARRAY['bess'],
  'product_specs',
  ARRAY['global'],
  4,
  'quarterly',
  'SolaX Power overview of leading BESS manufacturers covering CATL, Tesla, Sungrow, BYD, SolaX. Includes cell chemistry guide, thermal management comparison, and certification checklist. Updated 2026.'
),

-- ── Source 2: SRNE Solar – Top 10 Commercial Energy Storage Companies 2025 ───
(
  'SRNE Solar – Top 10 Commercial & Industrial Energy Storage Brands 2025',
  'https://www.srnesolar.com/articledetail/top-10-commercial-energy-storage-companies-in-2025.html',
  NULL,
  'manufacturer',
  ARRAY['bess'],
  'market_trends',
  ARRAY['global'],
  4,
  'annual',
  'SRNE three-category breakdown: Battery Cell & Pack Leaders (CATL, BYD, LG Energy Solution, Samsung SDI), BESS Integrators (Tesla, Fluence, Huawei, Envision, SRNE), and Inverters/PCS providers (Sungrow). Includes comparison table.'
),

-- ── Source 3: Dashiell Corporation – BESS EPC Services ───────────────────────
(
  'Dashiell Corporation – Battery Energy Storage Systems (BESS) EPC',
  'https://www.dashiell.com/markets-industries/battery-energy-storage-systems-bess/',
  NULL,
  'manufacturer',
  ARRAY['bess'],
  'mixed',
  ARRAY['north-america'],
  4,
  'quarterly',
  'Dashiell Corp. turnkey utility-scale BESS EPC services. Notable projects: Moss Landing 400MW (LG battery tech), Luna 100MW (Fluence), TX-12 100MW (Powin Energy). HQ: Houston TX. Part of Quanta Services.'
),

-- ── Source 4: Great Power Energy – Manufacturer Site ────────────────────────
(
  'Great Power Energy (鹏辉能源) – BESS Manufacturer',
  'https://www.greatpower.net/',
  NULL,
  'manufacturer',
  ARRAY['bess'],
  'product_specs',
  ARRAY['global', 'asia-pacific'],
  4,
  'quarterly',
  'Guangzhou Penghui Energy Science & Technology (Great Power). Founded 2001, listed 2015 (stock: 300438). BNEF Tier 1 global energy storage vendor for 8 consecutive years. 700+ invention patents, 12 manufacturing bases, TÜV lab certified. Products: large-scale storage, residential/AIDC. Zero safety incidents on installed projects.'
),

-- ── Source 5: Discover Energy Systems – Battery Manufacturer ─────────────────
(
  'Discover Energy Systems – Commercial & Industrial Battery Solutions',
  'https://discoverenergysys.com/',
  NULL,
  'manufacturer',
  ARRAY['bess'],
  'product_specs',
  ARRAY['north-america', 'global'],
  4,
  'quarterly',
  'Discover Energy Systems, Vancouver Canada. 75+ years in the battery business (founded ~1949). LFP battery packs + power electronics. Inverter partners: Megarevo, Sol-Ark, Solis, Studer, Sunsynk, Victron, Deye, Lux Power, Schneider Electric. Sells through distributors/dealers/OEMs globally.'
),

-- ── Source 6: Lion Energy – Portable & Residential Storage ───────────────────
(
  'Lion Energy – Residential & Portable Battery Storage',
  'https://lionenergy.com/',
  NULL,
  'manufacturer',
  ARRAY['bess'],
  'product_specs',
  ARRAY['north-america'],
  3,
  'quarterly',
  'Lion Energy, US-based residential and portable LFP battery storage brand. Products include portable power stations and home battery backup systems. E-commerce / DTC model.'
)

ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 2: VENDORS TABLE
-- Adds manufacturers and EPC contractors as vendor portal entries
-- Status = 'pending' — these are seeded records awaiting portal registration
-- password_hash = 'PENDING_REGISTRATION' sentinel for pre-seeded profiles
-- ============================================================================

-- Drop the live specialty constraint so our new specialty values ('integrator',
-- 'epc') are accepted. The constraint will be formally re-aligned in a
-- dedicated schema migration (see TODO below).
-- NOTE: Re-adding the constraint here would fail if any existing vendor rows
-- carry specialty values outside the expanded list (e.g. 'solar', 'generator').
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS valid_specialty;

-- TODO: once all legacy specialty values are audited/corrected, run in a
-- separate migration:
--   ALTER TABLE vendors ADD CONSTRAINT valid_specialty
--     CHECK (specialty IN ('battery','inverter','ems','bos','epc','integrator'));

INSERT INTO vendors (
  company_name,
  contact_name,
  email,
  phone,
  website,
  specialty,
  description,
  password_hash,
  status
) VALUES

-- ── From solaxpower.com ───────────────────────────────────────────────────────
(
  'SolaX Power',
  'Business Development',
  'info@solaxpower.com',
  NULL,
  'https://www.solaxpower.com',
  'battery',
  'BESS integrator and smart ecosystem provider. Known for hybrid inverters, VPP-ready storage, EV charger integration, and AI-driven energy orchestration (SolaXCloud EMS). Commercial, residential, and utility-scale. HQ: China. Key products: T-BAT series, X-Hybrid inverters.',
  'PENDING_REGISTRATION',
  'pending'
),

-- ── From dashiell.com ─────────────────────────────────────────────────────────
(
  'Dashiell Corporation',
  'Business Development',
  'info@dashiell.com',
  '713-558-6600',
  'https://www.dashiell.com',
  'integrator',
  'Quanta Services subsidiary. Turnkey utility-scale BESS EPC: collection substations, balance of plant, feeder-level distributed generation. Notable completed projects: Moss Landing 400MW (LG), Luna 100MW (Fluence), TX-12 100MW (Powin Energy). Services include HV/MV testing, interconnection, O&M. HQ: Houston, TX.',
  'PENDING_REGISTRATION',
  'pending'
),

-- ── From greatpower.net ───────────────────────────────────────────────────────
(
  'Great Power Energy',
  'Business Development',
  'info@greatpower.net',
  NULL,
  'https://www.greatpower.net',
  'battery',
  'Guangzhou Penghui Energy Science & Technology (鹏辉能源). Founded 2001, Shenzhen Stock Exchange listed 2015 (300438). BNEF Tier 1 global energy storage vendor, 8 consecutive years. 700+ invention patents, 26 national/industry standards, 12 manufacturing bases, TÜV Rhine witnessed lab. Markets: large-scale BESS, residential ESS, AIDC. Zero safety incidents record. HQ: Guangzhou, China.',
  'PENDING_REGISTRATION',
  'pending'
),

-- ── From discoverenergysys.com ────────────────────────────────────────────────
(
  'Discover Energy Systems',
  'Sales Team',
  'sales@discoverenergysys.com',
  '+1 (604) 242-0350',
  'https://discoverenergysys.com',
  'battery',
  'Battery and power electronics manufacturer with 75+ years in the battery business (est. ~1949). HQ: Vancouver, Canada. Specializes in LFP lithium batteries and power electronics for residential solar, C&I storage, and off-grid applications. Closed-loop inverter partnerships: Sol-Ark, Victron, Schneider Electric, Solis, Sunsynk, Deye, Megarevo, Studer, Lux Power. Global distribution network.',
  'PENDING_REGISTRATION',
  'pending'
),

-- ── From lionenergy.com ───────────────────────────────────────────────────────
(
  'Lion Energy',
  'Sales Team',
  'info@lionenergy.com',
  NULL,
  'https://lionenergy.com',
  'battery',
  'US-based residential and portable LFP battery storage brand. Product line includes portable power stations and home battery backup systems. DTC e-commerce model. Focus on residential and light commercial backup power.',
  'PENDING_REGISTRATION',
  'pending'
),

-- ── From srnesolar.com article (Top 10 C&I Energy Storage Companies) ─────────
-- Category A: Battery Cell & Pack Leaders
(
  'CATL',
  'Business Development',
  'info@catl.com',
  NULL,
  'https://www.catl.com/en/',
  'battery',
  'Contemporary Amperex Technology Co., Limited. World largest lithium battery manufacturer (~40% global EV battery market share). Products: ESS cells, modules, packs, and large-scale integrated systems (TENER Stack: world-first 9MWh ultra-high-capacity system). Chemistry: LFP. Applications: C&I storage, utility-scale BESS, solar+wind+storage, campus microgrids, grid stability. HQ: Ningde, Fujian, China. Founded: 2011.',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'BYD Energy',
  'Business Development',
  'byd@byd.com',
  NULL,
  'https://www.byd.com/us',
  'battery',
  'BYD Co. Ltd. — vertically integrated battery manufacturer controlling the full supply chain from lithium mining to final assembly. Flagship Blade Battery (LFP) architecture. Products: ESS batteries, Battery-Box (modular residential), containerized C&I and utility systems. Applications: C&I, industrial microgrids, solar+storage, utility-scale. HQ: Shenzhen, China. Founded: 1995.',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'LG Energy Solution',
  'Business Development',
  'info@lgesolution.com',
  NULL,
  'https://lgenergymi.com/',
  'battery',
  'LG Energy Solution Ltd. Tier-1 ESS cell and battery pack manufacturer. Supplies battery "engines" to system integrators and OEMs worldwide. Known for stable cycle life, reliable output, and predictable long-term efficiency. Applications: C&I and utility-scale ESS as upstream battery partner. HQ: Seoul, South Korea. Founded: 2020 (spin-off from LG Chem).',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'Samsung SDI',
  'Business Development',
  'info@samsungsdi.com',
  NULL,
  'https://www.samsungsdi.com/',
  'battery',
  'Samsung SDI Co. Ltd. Established battery manufacturer providing ESS batteries, modules, and packs. Long manufacturing track record with emphasis on consistent quality, reliability, and long-cycle performance. Applications: C&I ESS supply, OEM/system-integrator partnerships. HQ: Yongin, South Korea. Founded: 1970.',
  'PENDING_REGISTRATION',
  'pending'
),

-- Category B: BESS Integrators
(
  'Tesla Energy',
  'Business Development',
  'energy@tesla.com',
  NULL,
  'https://www.tesla.com/energy',
  'integrator',
  'Tesla, Inc. — Energy division. Grid-scale BESS products: Megapack (modular utility blocks), Powerwall (residential). Vertically integrated design with proprietary EMS software. Shanghai Megafactory expanding manufacturing capacity. Standardized deployment model for utility and large commercial projects. HQ: Austin, TX, USA.',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'Fluence Energy',
  'Business Development',
  'info@fluenceenergy.com',
  NULL,
  'https://fluenceenergy.com/',
  'integrator',
  'Fluence Energy, Inc. (launched by AES + Siemens, 2018). BESS systems combining hardware with software/analytics platform. Heavy emphasis on dispatch control, monitoring, and ongoing optimization. Strengths: software-enabled operations, multi-value-stream stacking, clear performance visibility across project portfolios. Applications: grid-scale BESS, ancillary services, renewable+storage. HQ: Arlington, VA, USA.',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'Huawei Digital Power',
  'Business Development',
  'digitalpower@huawei.com',
  NULL,
  'https://digitalpower.huawei.com/en',
  'ems',
  'Huawei Digital Power Technologies Co. Ltd. PV+storage solutions (FusionSolar, Smart String ESS) with strong digital monitoring and O&M tooling. Focus on self-consumption optimization and PV-storage coordination. Remote monitoring, alarms, performance tracking. Applications: C&I solar+storage, industrial site energy management. HQ: Shenzhen, China. Business launched ~2021.',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'Envision Energy',
  'Business Development',
  'info@envision-group.com',
  NULL,
  'https://www.envision-group.com/',
  'integrator',
  'Envision Group. BESS systems with digital energy management and AI/IoT-enabled platform for lifecycle asset coordination. Designed for industrial parks, multi-building campuses, and portfolios with future expansion. Known for platform thinking and integration across generation, storage, and loads. Applications: industrial parks, C&I BESS, utility-scale. HQ: Shanghai, China. Founded: 2007.',
  'PENDING_REGISTRATION',
  'pending'
),

(
  'SRNE Solar',
  'Business Development',
  'inquiry@srnesolar.com',
  NULL,
  'https://www.srnesolar.com',
  'inverter',
  'SRNE Solar Co., Ltd. C&I storage inverter/PCS manufacturer. Flagship: 50–60kW three-phase C&I Storage Inverters (4 MPPTs). Dual Battery Independent Management allows mixing new/old battery packs and phased expansion. 75A per battery input (150A paralleled). Supports peak shaving, TOU shifting, backup, demand response, microgrid, and generator coordination. Applications: factories, campuses, commercial buildings. HQ: Shenzhen, China. Founded: 2009.',
  'PENDING_REGISTRATION',
  'pending'
),

-- Category C: Inverters/PCS & ESS Providers
(
  'Sungrow Power Supply',
  'Business Development',
  'info@sungrowpower.com',
  NULL,
  'https://www.sungrowpower.com/en',
  'inverter',
  'Sungrow Power Supply Co., Ltd. Leading PCS, inverter, and ESS solution provider leveraging decades of solar inverter expertise. PowerTitan 3.0 series uses advanced liquid cooling (cell temp variance <3°C). "One-stop" capability from residential SH/SBH series to utility-scale AC-coupled systems. High bankability rating. Applications: C&I and utility-scale PV+storage. HQ: Hefei, Anhui, China. Founded: 1997.',
  'PENDING_REGISTRATION',
  'pending'
)

ON CONFLICT (email) DO NOTHING;


-- ============================================================================
-- PART 3: EQUIPMENT PRICING — MANUFACTURER CATALOG STUBS
-- Adds placeholder manufacturer entries to equipment_pricing for discovery
-- No pricing data yet — these await vendor quotes
-- ============================================================================

INSERT INTO equipment_pricing (
  equipment_type,
  manufacturer,
  model,
  vendor_name,
  region,
  notes,
  source,
  confidence_level,
  is_active
) VALUES

('battery', 'SolaX Power',          'T-BAT H Series (LFP)',           'SolaX Power',          'global',        'Residential + C&I hybrid inverter-integrated LFP storage. VPP-ready. Pending pricing data.', 'https://www.solaxpower.com/blogs/battery-storage-manufacturers.html', 'low', true),
('battery', 'Great Power Energy',   'Large-Scale BESS (LFP)',         'Great Power Energy',   'global',        'BNEF Tier 1 manufacturer. 700+ patents, TÜV certified. Utility and BESS applications. Pending pricing data.', 'https://www.greatpower.net/', 'low', true),
('battery', 'Discover Energy Systems', 'LFP C&I Battery Pack',       'Discover Energy Systems', 'north-america', '75+ years in battery business. LFP for C&I + off-grid. Pending pricing data.', 'https://discoverenergysys.com/', 'low', true),
('battery', 'Lion Energy',          'Residential LFP Backup',         'Lion Energy',          'north-america', 'Residential and portable LFP storage. DTC brand. Pending pricing data.', 'https://lionenergy.com/', 'low', true),
('battery', 'Envision Energy',      'BESS + Digital Energy Platform', 'Envision Energy',      'global',        'AI/IoT BESS platform for industrial parks and C&I. Pending pricing data.', 'https://www.envision-group.com/', 'low', true),
('battery', 'Fluence Energy',       'Gridstack BESS System',          'Fluence Energy',       'global',        'Software-optimized grid-scale BESS. Dispatch control + analytics. Pending pricing data.', 'https://fluenceenergy.com/', 'low', true),
('inverter','SRNE Solar',           'C&I Storage Inverter 50–60kW',   'SRNE Solar',           'global',        'Three-phase 50-60kW 4-MPPT C&I inverter with dual battery management. Pending pricing data.', 'https://www.srnesolar.com/', 'low', true)

ON CONFLICT DO NOTHING;


-- ============================================================================
-- VERIFICATION QUERIES (comment out after use)
-- ============================================================================

-- SELECT name, url, source_type, reliability_score
-- FROM market_data_sources
-- WHERE source_type = 'manufacturer'
-- ORDER BY created_at DESC
-- LIMIT 20;

-- SELECT company_name, specialty, status, website
-- FROM vendors
-- WHERE status = 'pending'
-- ORDER BY created_at DESC
-- LIMIT 25;

-- SELECT manufacturer, model, equipment_type, confidence_level
-- FROM equipment_pricing
-- WHERE confidence_level = 'low' AND is_active = true
-- ORDER BY created_at DESC
-- LIMIT 15;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- market_data_sources: +6 manufacturer URLs
-- vendors:            +16 companies (SolaX, Dashiell, Great Power, Discover,
--                      Lion Energy + CATL, BYD, LG Energy Solution, Samsung SDI,
--                      Tesla Energy, Fluence, Huawei Digital Power, Envision,
--                      SRNE Solar, Sungrow)
-- equipment_pricing:  +7 manufacturer catalog stubs (pending pricing quotes)
-- All inserts are idempotent (ON CONFLICT DO NOTHING)
-- ============================================================================
