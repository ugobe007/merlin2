# SSOT Architecture Violation - Root Cause Analysis

## The Problem

The `trueQuoteMapper.ts` file violates Single Source of Truth (SSOT) principles by using **incremental, industry-specific if/else blocks** instead of a **systematic, configuration-driven approach**.

## Current State (VIOLATION)

```typescript
// ❌ BAD: 100+ lines of if/else for each industry
if (industryType === 'data-center') {
  // Custom logic for data center
} else if (industryType === 'hotel') {
  // Custom logic for hotel
} else if (industryType === 'hospital') {
  // Custom logic for hospital
  // ... ad-hoc fixes discovered during testing
}
```

**Problems:**
1. Each industry requires new code (if/else block)
2. No systematic validation
3. Issues discovered case-by-case during user testing
4. Adding new industry = adding new if/else block
5. No single source of truth for mappings

## What SHOULD Happen (TRUE SSOT)

```typescript
// ✅ GOOD: Configuration-driven, systematic approach
const SUBTYPE_MAPPINGS = {
  'hospital': {
    'acute-care': 'regional',
    'acute_care': 'regional',
    'clinic': 'clinic',
    // ... all mappings defined in ONE place
  },
  'hotel': {
    'upper-scale': 'upscale',
    'full-service': 'upscale',
    // ... all mappings defined in ONE place
  }
};

// Systematic mapper uses config, not if/else
function mapSubtype(industry: string, dbValue: string): string {
  const mappings = SUBTYPE_MAPPINGS[industry];
  if (!mappings) return 'default';
  return mappings[dbValue] || 'default';
}
```

## Root Cause

1. **Incremental Development**: Mapper was built case-by-case as industries were added
2. **No Systematic Design**: No upfront architecture for mappings
3. **No Validation Layer**: No build-time validation of mappings
4. **TrueQuote Engine as SSOT**: Engine defines valid subtypes, but mapper doesn't use them systematically
5. **Database as SSOT**: Database defines field names, but mapper doesn't map them systematically

## The Fix

Create a **systematic mapping configuration** that:

1. **Extracts ALL TrueQuote Engine subtypes** to a config object
2. **Defines ALL database → TrueQuote field name mappings** in config
3. **Defines ALL database → TrueQuote subtype mappings** in config
4. **Validates ALL mappings at build/test time**
5. **Uses configuration, not if/else blocks**

This ensures:
- ✅ Single Source of Truth for mappings
- ✅ Systematic validation catches ALL violations at once
- ✅ Adding new industry = adding config entry, not code
- ✅ No case-by-case fixes needed
