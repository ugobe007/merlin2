# Merlin V6 - Canonical Files Manifest
# =====================================
# CLEAN SLATE PROTOCOL
# 
# This document is the SINGLE SOURCE OF TRUTH for active files.
# If a file is NOT listed here, it should be deleted.
# 
# Last Updated: December 30, 2025
# Version: 6.0.0

## ═══════════════════════════════════════════════════════════════════════════
## WIZARD COMPONENTS (V6 ONLY)
## ═══════════════════════════════════════════════════════════════════════════

### Core Wizard
- src/components/wizard/v6/WizardV6.tsx ✅
- src/components/wizard/v6/types.ts ✅

### Step Components
- src/components/wizard/v6/steps/Step1Location.tsx ✅
- src/components/wizard/v6/steps/Step2Industry.tsx ✅
- src/components/wizard/v6/steps/Step3Details.tsx ✅ (generic industries)
- src/components/wizard/v6/steps/Step3HotelEnergy.tsx ✅ (hotel-specific)
- src/components/wizard/v6/steps/Step4Options.tsx ✅ (Solar/EV/Generator selection)
- src/components/wizard/v6/steps/Step5MagicFit.tsx ✅ (BESS sizing)
- src/components/wizard/v6/steps/Step6Quote.tsx ✅ (Final quote)

### Wizard Shared Components
- src/components/wizard/v6/components/MerlinGuide.tsx ✅

### ❌ DEPRECATED - DELETE ENTIRE FOLDER
- src/components/wizard/_deprecated/* ❌ DELETE ALL


## ═══════════════════════════════════════════════════════════════════════════
## SERVICES - SSOT (Single Source of Truth)
## ═══════════════════════════════════════════════════════════════════════════

### Pricing Services (SSOT)
- src/services/unifiedPricingService.ts ✅ (ALL equipment pricing)
- src/services/utilityRateService.ts ✅ (ALL utility rates)
- src/services/calculationConstantsService.ts ✅ (Database constants)
- src/services/centralizedCalculations.ts ✅ (Financial calculations)
- src/services/unifiedQuoteCalculator.ts ✅ (Quote generation)

### Data Services
- src/services/supabaseClient.ts ✅
- src/services/authService.ts ✅
- src/services/cacheService.ts ✅

### Validation Services
- src/services/dailyPricingValidator.ts ✅
- src/services/calculationValidator.ts ✅

### Industry/Use Case Services
- src/services/industryPowerProfilesService.ts ✅
- src/services/useCaseService.ts ✅
- src/services/useCasePowerCalculations.ts ✅

### ❌ DEPRECATED PRICING SERVICES - DELETE
- src/services/pricingService.ts ❌ (use unifiedPricingService)
- src/services/pricingModel.ts ❌ (use unifiedPricingService)
- src/services/electricityPricing.ts ❌ (use utilityRateService)
- src/services/bessPricing.ts ❌ (use unifiedPricingService)

### 🔍 REVIEW - May be deprecated
- src/services/pricingTierService.ts 🔍
- src/services/pricingConfigService.ts 🔍
- src/services/pricingIntelligence.ts 🔍
- src/services/solarPricingService.ts 🔍 (may be in unifiedPricingService)
- src/services/generatorPricingService.ts 🔍 (may be in unifiedPricingService)
- src/services/windPricingService.ts 🔍 (may be in unifiedPricingService)


## ═══════════════════════════════════════════════════════════════════════════
## UTILS
## ═══════════════════════════════════════════════════════════════════════════

### ❌ DEPRECATED - DELETE
- src/utils/bessPricing.ts ❌ (use unifiedPricingService)
- src/utils/industryPricing.ts ❌ (use unifiedPricingService)


## ═══════════════════════════════════════════════════════════════════════════
## ADMIN COMPONENTS
## ═══════════════════════════════════════════════════════════════════════════

### Active Admin
- src/components/admin/PricingAdminDashboard.tsx ✅

### ❌ DELETE BACKUPS
- src/components/admin/PricingAdminDashboard.tsx.backup ❌
- src/components/admin/PricingAdminDashboard.tsx.backup2 ❌


## ═══════════════════════════════════════════════════════════════════════════
## STEP 4 CLARIFICATION
## ═══════════════════════════════════════════════════════════════════════════

### Active File
- src/components/wizard/v6/steps/Step4Options.tsx ✅ (Solar/EV/Generator YES/NO)

### ❌ DELETE (old version, no longer used)
- src/components/wizard/v6/steps/Step4Opportunities.tsx ❌


## ═══════════════════════════════════════════════════════════════════════════
## POLICIES
## ═══════════════════════════════════════════════════════════════════════════

### SSOT Policy
All pricing MUST come from:
1. unifiedPricingService.ts → Equipment costs (BESS, Solar, Generator)
2. utilityRateService.ts → Utility rates, demand charges
3. calculationConstantsService.ts → Database constants (ITC rates, etc.)

NO hardcoded pricing values in components.

### TrueQuote™ Policy
All quotes must:
1. Use SSOT services for pricing
2. Include pricing source attribution
3. Show data sources in UI (NREL, EIA, etc.)

### Clean Slate Protocol
Before each commit:
1. Check this manifest for canonical files
2. Delete any orphaned files
3. Update manifest if adding new files
4. No .backup files committed


## ═══════════════════════════════════════════════════════════════════════════
## DELETION COMMANDS
## ═══════════════════════════════════════════════════════════════════════════

# Run these commands to clean up (AFTER BACKUP):

# 1. Delete deprecated wizard folder (150+ files)
rm -rf src/components/wizard/_deprecated

# 2. Delete old pricing files
rm src/services/pricingService.ts
rm src/services/pricingModel.ts
rm src/services/electricityPricing.ts
rm src/utils/bessPricing.ts
rm src/utils/industryPricing.ts

# 3. Delete backup files
rm src/components/admin/PricingAdminDashboard.tsx.backup
rm src/components/admin/PricingAdminDashboard.tsx.backup2
rm src/components/wizard/v6/steps/*.backup*

# 4. Delete old Step4
rm src/components/wizard/v6/steps/Step4Opportunities.tsx
