# TrueQuote Engine - Complete Implementation for All Industries

**Date:** January 2, 2026  
**Status:** 🚧 **IN PROGRESS**

---

## Goal

Add TrueQuote Engine configs for ALL 7 missing industries and fix field name mismatches.

---

## Current Status

### ✅ Industries WITH TrueQuote Engine Configs (5):
1. data-center
2. hospital  
3. hotel
4. ev-charging
5. car-wash

### ❌ Industries MISSING TrueQuote Engine Configs (7):
1. **manufacturing** - Has 11 subtypes (lightAssembly, heavyAssembly, processChemical, etc.)
2. **retail** - Has 7 subtypes (convenienceStore, gasStationCStore, smallGrocery, etc.)
3. **restaurant** - Has 5 subtypes (qsr, fastCasual, casualDining, fineDining, cafe)
4. **office** - Has 6 subtypes (smallOffice, midRise, highRise, officeCampus, medicalOffice, coworking)
5. **college/university** - Has 5 subtypes (communityCollege, smallPrivate, regionalPublic, largeState, majorResearch)
6. **agriculture** - Has 8+ subtypes (rowCrops, orchards, vineyards, dairy, etc.)
7. **warehouse** - Has 5 subtypes (general, climateControlled, refrigerated, frozen, mixedTemperature)

---

## Implementation Strategy

### Step 1: Create TrueQuote Engine Configs
For each industry, create an `IndustryConfig` with:
- `slug`: Industry identifier
- `name`: Display name
- `subtypes`: Map of subtype configs (from industry profile files)
- `powerCalculation`: Method (per_unit, per_sqft) and parameters
- `bessDefaults`: Min/max power, default duration
- `financialDefaults`: Peak shaving %, arbitrage spread
- `recommendations`: Solar/generator recommendations

### Step 2: Map Database Field Names
- Check database migrations for field names
- Map to TrueQuote Engine expectations
- Update `mapWizardStateToTrueQuoteInput` in Step5MagicFit

### Step 3: Update Step5MagicFit
- Add industry type mappings
- Add subtype extraction for all industries
- Handle field name normalization

---

## Files to Modify

1. `src/services/TrueQuoteEngine.ts` - Add 7 new IndustryConfig objects (~2000 lines)
2. `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Update mapping function
3. Database queries (if needed) - User will run SQL

---

## Next: Creating Configs

Starting with Manufacturing config...
