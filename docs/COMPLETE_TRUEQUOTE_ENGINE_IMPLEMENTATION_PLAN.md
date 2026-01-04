# Complete TrueQuote Engine Implementation Plan

**Date:** January 2, 2026  
**Goal:** Add TrueQuote Engine configs for ALL missing industries and fix field name mismatches

---

## Current Status

### ✅ Industries WITH TrueQuote Engine Configs (5):
1. data-center
2. hospital  
3. hotel
4. ev-charging
5. car-wash

### ❌ Industries MISSING TrueQuote Engine Configs (7):
1. manufacturing
2. retail
3. restaurant
4. office
5. college/university
6. agriculture
7. warehouse

---

## Implementation Steps

### Step 1: Read Industry Profile Files
- Understand structure of each industry profile
- Identify subtypes (e.g., lightAssembly, heavyAssembly for manufacturing)
- Identify field names used in profile functions
- Identify power calculation methods

### Step 2: Check Database Field Names
- Query database for `custom_questions.field_name` for each industry
- Compare with industry profile Inputs interfaces
- Document mismatches

### Step 3: Create TrueQuote Engine Configs
For each missing industry:
- Create `MANUFACTURING_CONFIG`, `RETAIL_CONFIG`, etc.
- Map subtypes from industry profiles
- Map power calculation methods (per_unit, per_sqft, etc.)
- Map field names from database → TrueQuote Engine expectations

### Step 4: Update Step5MagicFit
- Update `mapWizardStateToTrueQuoteInput` to handle all industries
- Add subtype extraction for all industries
- Add field name normalization/mapping

### Step 5: Update INDUSTRY_CONFIGS Registry
- Add all new configs to `INDUSTRY_CONFIGS` object

### Step 6: Test & Document
- Document all changes
- List all files affected
- Explain field name mappings

---

## Files That Will Be Modified

1. `src/services/TrueQuoteEngine.ts` - Add 7 new IndustryConfig objects
2. `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Update mapping function
3. Database queries (if field names need changing) - User can run SQL

---

## Next: Start Implementation

Reading industry profile files to understand structure...
