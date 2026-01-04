-- ============================================================================
-- SYSTEM CONTROLS PRICING MIGRATION
-- ============================================================================
-- Date: January 2, 2026
-- Purpose: Migrate System Controls pricing from hardcoded values to database
-- 
-- This migration:
-- 1. Creates pricing_configurations entry for system_controls_pricing
-- 2. Seeds with current hardcoded values from systemControlsPricingService.ts
-- 3. Allows admin dashboard to update pricing without code deployment
-- ============================================================================

-- Insert System Controls Pricing Configuration
INSERT INTO pricing_configurations (
  config_key,
  config_category,
  config_data,
  description,
  version,
  is_active,
  data_source,
  confidence_level,
  vendor_notes
) VALUES (
  'system_controls_pricing',
  'system_controls',
  '{
    "controllers": [
      {
        "id": "deepsea-dse8610",
        "pricePerUnit": 2850,
        "source": "Estimated based on market pricing Q4 2025"
      },
      {
        "id": "woodward-easygen-3500",
        "pricePerUnit": 3200,
        "source": "Market pricing Q4 2025"
      },
      {
        "id": "abb-plc-ac500",
        "pricePerUnit": 4500,
        "source": "Market pricing Q4 2025"
      },
      {
        "id": "schneider-sepam-80",
        "pricePerUnit": 5200,
        "source": "Market pricing Q4 2025"
      }
    ],
    "scadaSystems": [
      {
        "id": "wonderware-system-platform",
        "pricePerUnit": 125000,
        "annualMaintenanceCost": 25000,
        "source": "AVEVA pricing Q4 2025"
      },
      {
        "id": "ge-ifix-scada",
        "pricePerUnit": 85000,
        "annualMaintenanceCost": 17000,
        "source": "Emerson pricing Q4 2025"
      }
    ],
    "energyManagementSystems": [
      {
        "id": "schneider-ecostruxure-microgrid",
        "setupFee": 150000,
        "monthlyPerSite": 2500,
        "perMWCapacity": 25000,
        "implementationCost": 300000,
        "source": "Schneider Electric pricing Q4 2025"
      },
      {
        "id": "ge-aems-energy-management",
        "setupFee": 200000,
        "monthlyPerSite": 3000,
        "perMWCapacity": 30000,
        "implementationCost": 400000,
        "source": "GE Digital pricing Q4 2025"
      }
    ],
    "installationCosts": {
      "controllerInstallationPerUnit": 850,
      "scadaInstallationPerSystem": 15000,
      "networkingPerPoint": 125,
      "commissioningPerSystem": 25000,
      "trainingPerDay": 2500,
      "documentationCost": 8000
    },
    "integrationCosts": {
      "protocolGateway": 4500,
      "customInterfacing": 185,
      "systemTesting": 3500,
      "cybersecuritySetup": 25000
    },
    "maintenanceContracts": {
      "annualControllerMaintenance": 0.15,
      "scadaSoftwareMaintenance": 0.20,
      "systemSupportPerHour": 165,
      "remoteMonitoringPerPoint": 45
    }
  }'::jsonb,
  'System Controls Pricing (Controllers, SCADA, EMS) - Migrated from hardcoded values',
  '1.0.0',
  true,
  'Market Intelligence Q4 2025',
  'high',
  'Pricing migrated from systemControlsPricingService.ts hardcoded values. Can be updated via admin dashboard.'
)
ON CONFLICT (config_key) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  description = EXCLUDED.description,
  updated_at = NOW(),
  version = EXCLUDED.version;

-- Add comment
COMMENT ON TABLE pricing_configurations IS 'System Controls pricing now database-driven. Update via admin dashboard.';
