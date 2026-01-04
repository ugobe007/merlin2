# Manufacturing Field Name Mismatch Example

**Date:** January 2, 2026

---

## 🚨 Manufacturing Field Name Mismatch Found

### Industry Profile Function Expects:
**File:** `src/services/manufacturingIndustryProfile.ts`  
**Interface:** `ManufacturingInputs` (line 783)

```typescript
export interface ManufacturingInputs {
  manufacturingType: string;  // ❌ Database uses 'manufacturingSize'
  facilitySqFt: number;       // ❌ Database uses 'squareFootage'
  productionSchedule: string;
  // ...
}
```

### Database Uses:
**File:** `database/migrations/20251212_fix_manufacturing_questions.sql`

```sql
-- Field 1: 'manufacturingSize' (NOT 'manufacturingType')
field_name: 'manufacturingSize'

-- Field 2: 'squareFootage' (NOT 'facilitySqFt')
field_name: 'squareFootage'

-- Field 3: 'industryType' (NOT 'manufacturingType')
field_name: 'industryType'
```

---

## 🔍 The Real Problem

**These industry profile functions are NEVER CALLED!**

1. Step5MagicFit tries TrueQuote Engine first
2. TrueQuote Engine throws error (industry not found)
3. Falls back to `calculateBasePowerKW()` which uses generic square footage
4. Industry profile functions (`calculateManufacturingProfile`, etc.) are **never called**

---

## 📋 All 7 Missing Industries Need Audit

1. **Manufacturing** - ❌ `manufacturingType` vs `manufacturingSize`, `facilitySqFt` vs `squareFootage`
2. **Retail** - ❓ Need to check
3. **Restaurant** - ❓ Need to check
4. **Office** - ❓ Need to check
5. **University** - ❓ Need to check
6. **Agriculture** - ❓ Need to check
7. **Warehouse** - ❓ Need to check

---

## 🛠️ Solution Options

### Option A: Add TrueQuote Engine Configs (RECOMMENDED)
- Create configs for all 7 industries
- Map database field names → TrueQuote Engine expectations
- Single calculation path

### Option B: Call Industry Profile Functions in Fallback
- Update Step5MagicFit to call `calculateManufacturingProfile()` etc.
- Fix field name mismatches in profile functions
- Dual calculation paths

---

**Next:** Should I audit all 7 industries and then add TrueQuote Engine configs, or fix the fallback to call industry profile functions?
