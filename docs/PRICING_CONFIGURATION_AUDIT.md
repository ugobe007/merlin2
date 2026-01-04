# Pricing & Product Configuration Audit

**Date:** January 2, 2026  
**Question:** Do we have the latest pricing and product configurations?

---

## Current State Analysis

### ✅ Database-Driven Pricing (Primary SSOT)

**Tables:**
1. **`pricing_configurations`** - JSONB configs for all pricing
2. **`calculation_constants`** - Key-value pricing constants
3. **`equipment_pricing`** - Vendor-specific pricing
4. **`market_pricing_data`** - Market intelligence data

**Services:**
- `unifiedPricingService.ts` - Primary pricing service (database-first)
- `useCaseService.getPricingConfig()` - Fetches from `pricing_configurations` table
- `calculationConstantsService.ts` - Fetches from `calculation_constants` table

**Priority Order:**
1. Database (`calculation_constants` / `pricing_configurations`)
2. Market data integration (if available)
3. NREL ATB 2024 (fallback)

---

## ⚠️ Issues Found

### 1. System Controls Pricing - HARDCODED

**File:** `src/services/systemControlsPricingService.ts`

**Status:** ❌ **HARDCODED VALUES** - Not database-driven

**Examples:**
- Generator Controller (Deep Sea DSE8610): `pricePerUnit: 2850` - Comment: "Estimated based on market pricing"
- Protective Relay (Schneider Sepam 80): `pricePerUnit: 5200` - No source cited
- SCADA System (Wonderware): `pricePerUnit: 125000` - No source cited
- EMS (Schneider EcoStruxure): `setupFee: 150000` - No source cited

**Problem:** These values are **hardcoded** and cannot be updated without code deployment.

**Impact:** 
- Cannot update pricing via admin dashboard
- No market intelligence integration
- No version tracking
- No audit trail

### 2. Solar Pricing Service - PARTIALLY HARDCODED

**File:** `src/services/solarPricingService.ts`

**Status:** ⚠️ **MIXED** - Some hardcoded, some database-driven

**Hardcoded:**
- Panel pricing (in default configuration)
- Inverter pricing (in default configuration)
- Mounting system pricing (in default configuration)

**Database-Driven:**
- Main solar pricing uses `useCaseService.getPricingConfig('solar_default')`
- But additional components are hardcoded in default config

### 3. Product Configurations - HARDCODED

**File:** `src/services/systemControlsPricingService.ts`

**Status:** ❌ **HARDCODED** - Product specs, models, features all hardcoded

**Examples:**
- Controller models, features, specifications
- SCADA system capabilities
- EMS capabilities
- All product details are in code, not database

**Problem:** Cannot add new products or update product specs without code deployment.

---

## What's Database-Driven (Good)

### ✅ Battery Pricing
- Uses `calculation_constants` table
- Size-tiered pricing (<1MWh, 1-5MWh, 5-15MWh, 15+MWh)
- Can be updated via admin dashboard

### ✅ Inverter/Transformer Pricing
- Uses `pricing_configurations` table
- Key: `power_electronics_2025`
- Can be updated via admin dashboard

### ✅ Generator Pricing
- Uses `pricing_configurations` table
- Key: `generator_default`
- Supports fuel types (natural gas, diesel, dual-fuel)
- Can be updated via admin dashboard

### ✅ Solar Base Pricing
- Uses `pricing_configurations` table
- Key: `solar_default`
- Can be updated via admin dashboard

---

## What's NOT Database-Driven (Needs Fix)

### ❌ System Controls Pricing
- Controllers, SCADA, EMS pricing
- All hardcoded in `systemControlsPricingService.ts`
- **Needs:** Migration to `pricing_configurations` table

### ❌ System Controls Product Configurations
- Product models, features, specifications
- All hardcoded in `systemControlsPricingService.ts`
- **Needs:** Migration to `equipment_catalog` or similar table

### ❌ Solar Additional Components Pricing
- DC/AC cabling, combiner boxes, disconnects, grounding, conduit
- Hardcoded in `solarPricingService.ts` default config
- **Needs:** Migration to `pricing_configurations` table

---

## Data Sources & Currency

### Current Sources:
- **NREL ATB 2024** - Primary fallback (may be outdated - 2024 data)
- **Market Intelligence** - Via `marketDataIntegrationService.ts`
- **Vendor Quotes** - Stored in `equipment_pricing` table
- **Admin Updates** - Via `PricingAdminDashboard.tsx`

### Latest Available:
- **NREL ATB 2025** - May be available (need to check)
- **BloombergNEF 2025** - Market pricing (if subscribed)
- **Q4 2025 / Q1 2026** - Current market data

---

## Recommendations

### Priority 1: Migrate System Controls Pricing to Database

**Action:**
1. Create `pricing_configurations` entries for:
   - `system_controls_controllers`
   - `system_controls_scada`
   - `system_controls_ems`
2. Update `systemControlsPricingService.ts` to:
   - Check database first
   - Fall back to hardcoded values if database unavailable
3. Add to admin dashboard for updates

### Priority 2: Migrate Product Configurations to Database

**Action:**
1. Create `equipment_catalog` table (or extend existing)
2. Store product specs, models, features
3. Update service to read from database

### Priority 3: Update Data Sources

**Action:**
1. Check for NREL ATB 2025 data
2. Update fallback values if newer data available
3. Add data source citations to all pricing

### Priority 4: Add Pricing Update Mechanisms

**Action:**
1. Add system controls pricing to `PricingAdminDashboard.tsx`
2. Add product catalog management UI
3. Add pricing validation against market data

---

## Next Steps

1. ⏳ **Check database** - See what pricing configs exist
2. ⏳ **Check NREL ATB 2025** - See if newer data available
3. ⏳ **Create migration plan** - Move hardcoded values to database
4. ⏳ **Update services** - Make them database-driven with fallbacks

---

## Questions for User

1. **Do you have access to NREL ATB 2025 data?**
2. **Do you have BloombergNEF or other market data subscriptions?**
3. **Should we migrate system controls pricing to database?**
4. **Do you want product catalog (models, specs) in database too?**
5. **What's the update frequency needed?** (Monthly? Quarterly?)
