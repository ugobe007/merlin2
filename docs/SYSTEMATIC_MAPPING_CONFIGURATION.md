# Systematic Mapping Configuration

## Overview

This document describes the systematic mapping configuration that serves as the **Single Source of Truth** for all mappings between:
- Database field names → TrueQuote Engine field names
- Database subtype values → TrueQuote Engine subtypes

## Files

1. **`src/services/trueQuoteMapperConfig.ts`** - Configuration file (source of truth)
2. **`scripts/validate-truequote-mappings.ts`** - Validation script

## Architecture

### Before (VIOLATION)
- `trueQuoteMapper.ts` had 100+ lines of if/else blocks
- Each industry required new code
- No systematic validation
- Issues discovered case-by-case

### After (TRUE SSOT)
- Configuration-driven mappings
- Systematic validation at build/test time
- Single source of truth for all mappings
- Adding new industry = adding config entry

## Configuration Structure

### Valid Subtypes
Extracted directly from `TrueQuoteEngine.INDUSTRY_CONFIGS`:

```typescript
export const VALID_SUBTYPES: Record<string, string[]> = {
  'data-center': ['tier_1', 'tier_2', 'tier_3', 'tier_4', 'hyperscale'],
  'hospital': ['clinic', 'community', 'regional', 'teaching'],
  'hotel': ['budget', 'midscale', 'upscale', 'luxury'],
  // ... etc
};
```

### Subtype Mappings
Maps database values to TrueQuote Engine values:

```typescript
export const SUBTYPE_MAPPINGS: Record<string, Record<string, string>> = {
  'hospital': {
    'acute-care': 'regional',
    'acute_care': 'regional',
    'clinic': 'clinic',
    // ... etc
  },
  // ... etc
};
```

### Field Name Mappings
Maps database field names to TrueQuote Engine field names:

```typescript
export const FIELD_NAME_MAPPINGS: Record<string, Record<string, string>> = {
  'hospital': {
    'bedCount': 'bedCount',
    'beds': 'bedCount',
    'numberOfBeds': 'bedCount',
    // ... etc
  },
  // ... etc
};
```

## Validation

Run the validation script to check for mapping violations:

```bash
npx tsx scripts/validate-truequote-mappings.ts
```

This script will:
1. Compare database field names against mappings
2. Compare database subtype values against mappings
3. Report any violations

## Next Steps

1. ✅ Created configuration file
2. ✅ Created validation script
3. ⏭️ Run validation to identify database updates needed
4. ⏭️ Update database based on validation results
5. ⏭️ Refactor `trueQuoteMapper.ts` to use config

## Database Updates Needed

After running validation, we'll identify:
- Missing subtype mappings
- Field names that need normalization
- Subtype values that need to be updated in database
