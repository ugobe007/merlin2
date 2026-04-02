-- ============================================================================
-- SOLAR SIZING PLATFORM INTEGRATIONS
-- ============================================================================
-- Purpose: Store API keys for third-party solar design platforms and
--          preserve imported design data for audit and quote linkage.
--
-- Supported platforms:
--   aurora_solar, helioscope, opensolar, solargraf,
--   eagleview_truedesign, scanifly, pvsol, solarapp_plus
--
-- Created: April 1, 2026
-- ============================================================================

-- ============================================================================
-- 1. PLATFORM API KEY STORE
-- ============================================================================
-- Stores one API key per platform. Keys are fetched at runtime by
-- solarSizingIntegrationService.ts via getPlatformApiKey().
-- Admins manage these through the Vendor Admin dashboard.
-- ============================================================================

CREATE TABLE IF NOT EXISTS solar_sizing_platform_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Which platform this key belongs to
    platform        VARCHAR(50) NOT NULL
                    CHECK (platform IN (
                        'aurora_solar',
                        'helioscope',
                        'opensolar',
                        'solargraf',
                        'eagleview_truedesign',
                        'scanifly',
                        'pvsol',
                        'solarapp_plus'
                    )),
    
    -- Credentials (encrypted at rest via Supabase Vault in production)
    api_key         TEXT NOT NULL,
    api_secret      TEXT,                   -- For platforms requiring OAuth secret
    oauth_token     TEXT,                   -- OAuth access token (if different from api_key)
    oauth_refresh   TEXT,                   -- OAuth refresh token
    token_expires_at TIMESTAMPTZ,           -- When oauth_token expires
    
    -- Config
    org_id          TEXT,                   -- Platform org/account ID (OpenSolar, etc.)
    webhook_secret  TEXT,                   -- HMAC secret for validating incoming webhooks
    environment     VARCHAR(20) DEFAULT 'production'
                    CHECK (environment IN ('production', 'sandbox', 'demo')),
    
    -- State
    is_active       BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMPTZ,           -- Last successful API call
    
    -- Metadata
    added_by        TEXT,                   -- Admin who added this key
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    
    -- Only one active key per platform
    UNIQUE (platform, environment)
);

-- Prevent storing plaintext keys in logs or backups (comment for app layer encryption)
COMMENT ON COLUMN solar_sizing_platform_keys.api_key IS
    'Store encrypted value. Use Supabase Vault or app-layer AES-256 in production.';
COMMENT ON COLUMN solar_sizing_platform_keys.api_secret IS
    'OAuth client secret or secondary credential. Encrypt same as api_key.';

-- ============================================================================
-- 2. IMPORTED SOLAR DESIGNS
-- ============================================================================
-- Normalized storage of every solar design imported from any platform.
-- Linked to a Merlin project/quote for auditing and re-import.
-- ============================================================================

CREATE TABLE IF NOT EXISTS imported_solar_designs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    platform            VARCHAR(50) NOT NULL,
    platform_project_id TEXT,               -- The project ID in the source platform
    platform_project_url TEXT,              -- Link back to the design in the platform UI
    
    -- Merlin linkage
    merlin_project_id   TEXT,               -- Links to a Merlin/Supabase project
    merlin_quote_id     TEXT,               -- Links to a specific quote (if applied)
    applied_to_quote    BOOLEAN DEFAULT false,
    applied_at          TIMESTAMPTZ,
    
    -- Import metadata
    imported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_by         TEXT,               -- User/admin who triggered the import
    
    -- Location
    address             TEXT,
    city                VARCHAR(100),
    state               VARCHAR(2),
    zip_code            VARCHAR(10),
    lat                 NUMERIC(9,6),
    lon                 NUMERIC(9,6),
    
    -- System sizing (DC-side) — THE KEY FIELDS FOR QUOTING
    system_size_dc_kw   NUMERIC(10,3) NOT NULL,
    system_size_ac_kw   NUMERIC(10,3),
    number_of_panels    INTEGER,
    panel_wattage       INTEGER,            -- Wp per panel
    panel_manufacturer  VARCHAR(100),
    panel_model         VARCHAR(100),
    panel_efficiency_pct NUMERIC(5,2),      -- % module efficiency
    
    -- Array geometry
    roof_area_used_sqft NUMERIC(10,2),      -- Actual roof area covered by panels
    azimuth_degrees     NUMERIC(6,2),       -- 180 = south
    tilt_degrees        NUMERIC(5,2),
    is_ground_mount     BOOLEAN DEFAULT false,
    is_carport          BOOLEAN DEFAULT false,
    
    -- Production estimates
    annual_production_kwh   NUMERIC(12,2),  -- Year 1 AC production
    specific_yield_kwh_kwp  NUMERIC(8,2),   -- kWh/kWp/yr
    performance_ratio       NUMERIC(5,4),   -- 0.75–0.85 typical
    capacity_factor_pct     NUMERIC(5,2),
    
    -- Shading
    shading_loss_pct    NUMERIC(5,2),
    tsrf_pct            NUMERIC(5,2),       -- Total Solar Resource Fraction
    
    -- Financial (from platform's own proposal export)
    equipment_cost_usd      NUMERIC(14,2),
    total_project_cost_usd  NUMERIC(14,2),
    cost_per_watt_dc        NUMERIC(6,4),   -- $/Wp equipment+install
    
    -- Inverter
    inverter_manufacturer   VARCHAR(100),
    inverter_model          VARCHAR(100),
    inverter_type           VARCHAR(30)
                            CHECK (inverter_type IN (
                                'string', 'microinverter', 'optimizer', 'central', NULL
                            )),
    
    -- Permitting (SolarAPP+)
    permit_status   VARCHAR(20)
                    CHECK (permit_status IN (
                        'compliant', 'review_required', 'not_checked', NULL
                    )),
    permit_code     TEXT,
    permit_notes    TEXT,
    
    -- Raw payload preserved for audit
    raw_payload     JSONB,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_imported_solar_designs_platform
    ON imported_solar_designs (platform);

CREATE INDEX IF NOT EXISTS idx_imported_solar_designs_merlin_project
    ON imported_solar_designs (merlin_project_id)
    WHERE merlin_project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_imported_solar_designs_state
    ON imported_solar_designs (state)
    WHERE state IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_imported_solar_designs_applied
    ON imported_solar_designs (applied_to_quote, applied_at)
    WHERE applied_to_quote = true;

CREATE INDEX IF NOT EXISTS idx_platform_keys_platform
    ON solar_sizing_platform_keys (platform, is_active);

-- ============================================================================
-- 4. RLS (Row Level Security)
-- ============================================================================
-- Platform keys: only service role (server-side) can read/write
-- Imported designs: service role + authenticated users can read their own

ALTER TABLE solar_sizing_platform_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_solar_designs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses all RLS — used by backend/functions
-- (Supabase service_role key automatically bypasses RLS)

-- Admins can manage platform keys (requires admin role in your auth system)
CREATE POLICY "admin_manage_platform_keys"
    ON solar_sizing_platform_keys
    FOR ALL
    USING (
        -- Lock down to service role only (UI should use Edge Function proxy)
        current_setting('role') = 'service_role'
    );

-- Authenticated users can read imported designs (their own org's designs)
CREATE POLICY "read_imported_designs"
    ON imported_solar_designs
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only service role can insert/update imported designs
CREATE POLICY "service_manage_imported_designs"
    ON imported_solar_designs
    FOR ALL
    USING (
        current_setting('role') = 'service_role'
    );

-- ============================================================================
-- 5. TRIGGER: updated_at on platform keys
-- ============================================================================

CREATE OR REPLACE FUNCTION update_solar_platform_key_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solar_platform_keys_updated_at
    BEFORE UPDATE ON solar_sizing_platform_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_solar_platform_key_updated_at();

-- ============================================================================
-- 6. HELPER VIEWS
-- ============================================================================

-- Show configured platforms (no API keys exposed)
CREATE OR REPLACE VIEW solar_sizing_platform_status AS
SELECT
    platform,
    environment,
    is_active,
    last_verified_at,
    added_by,
    notes,
    created_at,
    -- Never expose api_key or api_secret in this view
    CASE
        WHEN api_key IS NOT NULL AND LENGTH(api_key) > 8
        THEN CONCAT(LEFT(api_key, 4), '...', RIGHT(api_key, 4))
        ELSE NULL
    END AS api_key_preview
FROM solar_sizing_platform_keys
ORDER BY platform;

COMMENT ON VIEW solar_sizing_platform_status IS
    'Safe view of configured solar sizing platforms — API keys masked.';

-- Summary of imports by platform
CREATE OR REPLACE VIEW imported_designs_summary AS
SELECT
    platform,
    COUNT(*)                                    AS total_imports,
    SUM(CASE WHEN applied_to_quote THEN 1 END)  AS applied_to_quotes,
    AVG(system_size_dc_kw)                      AS avg_system_size_kw,
    AVG(annual_production_kwh)                  AS avg_annual_kwh,
    MAX(imported_at)                            AS last_import_at
FROM imported_solar_designs
GROUP BY platform
ORDER BY total_imports DESC;

COMMENT ON VIEW imported_designs_summary IS
    'Aggregate view of solar design imports by platform.';

-- ============================================================================
-- 7. REFERENCE: Platform API Documentation
-- ============================================================================
--
-- Aurora Solar:        https://developer.aurorasolar.com/
--   Auth:  OAuth 2.0 Bearer token (partner account required)
--   Docs:  Design API, Project API, Webhooks (design.published event)
--
-- HelioScope:          https://helioscope.aurorasolar.com/
--   Auth:  X-HelioScope-ApiKey header (contact HelioScope for partner access)
--   Docs:  Projects, Designs, Simulation Results endpoints
--
-- OpenSolar:           https://app.opensolar.com/api/
--   Auth:  Bearer token via OAuth 2.0 (free at opensolar.com/developer)
--   Docs:  Orgs/{orgId}/Projects/{projectId} — includes systems array
--
-- Solargraf:           https://solargraf.com/ (partner API)
--   Auth:  Partner API key (contact sales@solargraf.com)
--   Docs:  Private partner portal
--
-- EagleView TrueDesign: https://eagleview.com/partner-api
--   Auth:  OAuth 2.0 (enterprise partner agreement required)
--   Docs:  Aerial imagery + PV layout JSON, report webhook
--
-- Scanifly:            https://scanifly.com/api
--   Auth:  API key header (Scanifly Pro subscription)
--   Docs:  Projects, Measurements, Shading, Design endpoints
--
-- PV*SOL:              No public REST API (desktop software)
--   Integration: Import via *.pvso JSON export from PV*SOL Premium
--   Contact:     info@valentin-software.com for OEM integration
--
-- SolarAPP+:           https://solarapp.org/api
--   Auth:  X-SolarAPP-Key header (AHJ-approved installer account)
--   Docs:  /permit_check POST endpoint — compliance verification only
-- ============================================================================
