-- ============================================================================
-- PRICING CONFIGURATIONS TABLE
-- Stores pricing configuration as single source of truth (replaces localStorage)
-- Created: January 3, 2025
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if exists (will recreate with proper schema)
DROP TABLE IF EXISTS pricing_configurations CASCADE;

-- Create pricing_configurations table
CREATE TABLE IF NOT EXISTS pricing_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configuration identification
    name VARCHAR(255) NOT NULL DEFAULT 'Default Pricing Configuration',
    description TEXT,
    
    -- Versioning
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Pricing configuration data (JSONB for flexibility)
    config_data JSONB NOT NULL DEFAULT '{}',
    -- Structure matches PricingConfiguration interface:
    -- {
    --   "bess": { ... },
    --   "solar": { ... },
    --   "wind": { ... },
    --   "generators": { ... },
    --   "powerElectronics": { ... },
    --   "evCharging": { ... },
    --   "balanceOfPlant": { ... },
    --   "systemControls": { ... }
    -- }
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),  -- User/admin who made the change
    notes TEXT,  -- Change notes/justification
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Approval workflow (optional)
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_pricing_config_active ON pricing_configurations(is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_config_default ON pricing_configurations(is_default) WHERE is_default = true;
CREATE INDEX idx_pricing_config_version ON pricing_configurations(version);
CREATE INDEX idx_pricing_config_updated ON pricing_configurations(updated_at DESC);
CREATE INDEX idx_pricing_config_data ON pricing_configurations USING GIN(config_data);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_pricing_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_config_updated
    BEFORE UPDATE ON pricing_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_pricing_config_timestamp();

-- ============================================================================
-- SEED DEFAULT CONFIGURATION
-- ============================================================================
-- Insert default pricing configuration matching DEFAULT_PRICING_CONFIG
-- This will be the active configuration used by the system

INSERT INTO pricing_configurations (
    name,
    description,
    version,
    is_active,
    is_default,
    config_data,
    updated_by,
    notes
) VALUES (
    'Default Pricing Configuration',
    'Q4 2025 realistic pricing tiers based on NREL ATB 2024 and vendor quotes',
    '2.0.0',
    true,
    true,
    '{
        "bess": {
            "smallSystemPerKWh": 145,
            "mediumSystemPerKWh": 135,
            "mediumLargeSystemPerKWh": 120,
            "largeSystemPerKWh": 105,
            "smallSystemSizeMWh": 1,
            "mediumSystemSizeMWh": 5,
            "largeSystemSizeMWh": 15,
            "degradationRate": 2.4,
            "warrantyYears": 11,
            "vendorNotes": "Q4 2025 realistic BESS pricing tiers: <1MWh=$145/kWh | 1-5MWh=$135/kWh | 5-15MWh=$120/kWh | 15+MWh=$105/kWh. Includes installation, BOS, commissioning, realistic profit margins. LFP technology, 6000+ cycles."
        },
        "solar": {
            "utilityScalePerWatt": 0.58,
            "commercialPerWatt": 0.78,
            "smallScalePerWatt": 1.15,
            "trackingSystemUpcharge": 12,
            "rooftopInstallationFactor": 1.35,
            "permittingCostPerWatt": 0.12,
            "vendorNotes": "NREL ATB Q4 2025 + market intelligence. Solar module prices down 18% YoY. Installation labor optimized with prefab systems."
        },
        "wind": {
            "utilityScalePerKW": 1150,
            "commercialPerKW": 1350,
            "smallScalePerKW": 2100,
            "foundationCostPerMW": 48000,
            "vendorNotes": "2025 wind market with improved turbine efficiency and installation processes"
        },
        "generators": {
            "naturalGasPerKW": 300,
            "dieselPerKW": 420,
            "propanePerKW": 480,
            "bioGasPerKW": 650,
            "baseInstallationCost": 48000,
            "vendorNotes": "Generator pricing updated per Eaton/Cummins market intelligence Q4 2025"
        },
        "powerElectronics": {
            "inverterPerKW": 140,
            "transformerPerKVA": 72,
            "switchgearPerKW": 185,
            "protectionRelaysPerUnit": 23500,
            "vendorNotes": "Grid-forming and grid-following capable PCS with enhanced cybersecurity (IEC 62443 compliant)"
        },
        "evCharging": {
            "level1ACPerUnit": 950,
            "level2ACPerUnit": 2850,
            "dcFastPerUnit": 38000,
            "dcUltraFastPerUnit": 125000,
            "pantographChargerPerUnit": 175000,
            "networkingCostPerUnit": 2200,
            "electricalInfrastructurePerUnit": 8500,
            "pavementAndFoundationPerUnit": 3200,
            "utilityConnectionCost": 15000,
            "permittingPerSite": 6500,
            "networkingInstallationPerUnit": 1200,
            "maintenancePerUnitPerYear": 750,
            "softwareLicensePerUnitPerYear": 480,
            "networkFeesPerUnitPerMonth": 45,
            "vendorNotes": "Commercial EV charging Q4 2025: CCS standard, plug-and-charge, vehicle-to-grid ready infrastructure. Includes full installation and 5-year operational cost estimates."
        },
        "balanceOfPlant": {
            "bopPercentage": 11,
            "laborCostPerHour": 92,
            "epcPercentage": 7.5,
            "shippingCostPercentage": 3.2,
            "internationalTariffRate": 22,
            "contingencyPercentage": 9,
            "urbanLaborPremium": 18,
            "skillLaborPremiumPercentage": 25,
            "unionLaborPremiumPercentage": 32,
            "vendorNotes": "Q4 2025 BOP costs: modular systems reducing field labor, increased material costs offset by efficiency gains. Regional labor variations reflect market reality."
        },
        "systemControls": {
            "scadaSystemBaseCost": 68000,
            "cybersecurityComplianceCost": 32000,
            "cloudConnectivityPerYear": 8500,
            "hmiTouchscreenCost": 12500,
            "vendorNotes": "Industrial SCADA with AI-powered predictive maintenance, NERC CIP compliance, edge computing integration"
        },
        "officeBuilding": {
            "rooftopInstallationPerKWh": 45,
            "basementInstallationPerKWh": 65,
            "groundLevelInstallationPerKWh": 25,
            "hvacIntegrationCost": 35000,
            "buildingAutomationCost": 28000,
            "elevatorBackupCost": 45000,
            "fireSuppressionPerSqFt": 15,
            "cityPermittingBaseCost": 8500,
            "structuralAnalysisCost": 12000,
            "electricalUpgradeCost": 35000,
            "urbanAccessFactor": 1.25,
            "highRiseInstallationFactor": 1.40,
            "weekendWorkPremium": 1.75,
            "vendorNotes": "Q4 2025 office building BESS integration costs. Includes fire code compliance (NFPA 855), building code integration, and urban installation challenges."
        }
    }'::jsonb,
    'System Migration',
    'Initial default configuration migrated from localStorage DEFAULT_PRICING_CONFIG'
) ON CONFLICT DO NOTHING;

-- Ensure only one default configuration exists
CREATE UNIQUE INDEX idx_pricing_config_single_default 
ON pricing_configurations(is_default) 
WHERE is_default = true;

-- Add comment
COMMENT ON TABLE pricing_configurations IS 'Single source of truth for pricing configuration. Replaces localStorage-based pricingConfigService.';
COMMENT ON COLUMN pricing_configurations.config_data IS 'JSONB containing full pricing configuration matching PricingConfiguration TypeScript interface';
COMMENT ON COLUMN pricing_configurations.is_default IS 'Only one configuration can be default=true at a time';

