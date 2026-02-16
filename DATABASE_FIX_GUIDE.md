# Database Schema Fix — Companion Code Fix Guide

## What the SQL Migration Fixes (Run First)

The SQL migration at `database/migrations/20260210_fix_schema_gaps.sql` addresses:

### New Columns Added (ALTER TABLE)
| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `custom_questions` | `question_key` | text | Alias for `field_name` (legacy) |
| `custom_questions` | `select_options` | jsonb | Alias for `options` (legacy) |
| `custom_questions` | `impact_type` | text | Question impact type |
| `custom_questions` | `impacts_field` | text | Target config field |
| `custom_questions` | `impact_calculation` | jsonb | Impact calculation params |
| `custom_questions` | `industry_slug` | text | Industry slug for filtering |
| `use_cases` | `power_profile` | jsonb | Health check validation |
| `use_cases` | `equipment` | jsonb | Health check validation |
| `use_cases` | `financial_params` | jsonb | Health check validation |
| `scrape_jobs` | `status` | text | Alias for `last_run_status` |

### New Tables Created
| Table | Used By | Purpose |
|-------|---------|---------|
| `ai_training_data` | mlProcessingService.ts | ML training data |
| `ml_price_trends` | mlProcessingService.ts | Price trend analysis |
| `ml_market_insights` | mlProcessingService.ts | Market insights |
| `ml_processing_log` | mlProcessingService.ts | Processing logs |
| `daily_price_data` | supabaseClient.ts PricingClient | Daily price tracking |
| `pricing_alerts` | supabaseClient.ts PricingClient | Price anomaly alerts |
| `pricing_markup_config` | equipmentPricingTiersService.ts | Equipment markups |
| `ssot_alerts` | systemHealthCheck.ts | Validation tracking |

### New RPC Functions
| Function | Used By | Purpose |
|----------|---------|---------|
| `calculate_bess_pricing` | supabaseClient.ts | Size-weighted BESS pricing |
| `increment_error_count` | marketDataIntegrationService.ts | Error tracking |
| `add_data_points` | marketDataIntegrationService.ts | Data collection tracking |

### View Added
| View | Alias For | Used By |
|------|-----------|---------|
| `system_configuration` | `system_config` | supabaseClient.ts |

---

## Remaining Code Fixes Needed (After Migration + Type Regen)

After running the SQL migration and regenerating types, the following code-level fixes will still be needed. These are **not database problems** — they are TypeScript strictness issues.

### Category A: Null Safety (smbPlatformService.ts — 24 errors)
**All 24 errors** in `smbPlatformService.ts` are `Type 'X | null' is not assignable to type 'X'`.
The DB returns nullable columns but the local TypeScript interface expects non-nullable values.

**Fix**: Add null coalescing when mapping DB rows to local interfaces:
```typescript
// Before:
name: row.name,           // error: 'string | null' not assignable to 'string'
// After:
name: row.name ?? '',     // null-safe
```

### Category B: PricingClient Schema Mismatch (supabaseClient.ts — ~8 errors)
The `PricingClient` class uses a `PricingConfiguration` interface with 40+ flat columns (`bess_small_system_per_kwh`, etc.) but the DB table now uses `config_data` JSONB.

**Fix Options**:
1. **Best**: Delete the entire `PricingClient` class (it's marked DEPRECATED) and update any callers to use `useCaseService` methods
2. **Quick**: Rewrite `PricingConfiguration` interface to match actual DB schema, extract values from `config_data` JSONB

### Category C: registry.ts (49 errors)
These are **NOT database errors**. They are calculator adapter type mismatches (CalcValidation, CalcContract types).

**Fix**: Update calculator return types to match `CalcValidation` interface properly.

### Category D: Step3ProfileV7Curated.tsx (25 errors)
These are curatedField type issues — UI component type mismatches, not DB.

**Fix**: Update CuratedField type definitions and question option rendering.

### Category E: mlProcessingService.ts (remaining errors after migration)
After the `ai_training_data`, `ml_price_trends`, `ml_market_insights`, `ml_processing_log` tables are created, most errors will resolve. Any remaining will be column name mapping issues in the `map()` calls.

### Category F: dataIntegrationService.ts (10 errors)  
These are `powerProfile` JSONB access errors — code accesses `.peakLoadKw`, `.avgLoadKw`, etc. on a `Json` type without casting.

**Fix**: Cast JSONB to proper interface:
```typescript
const profile = template.powerProfile as { peakLoadKw?: number; avgLoadKw?: number; } | null;
```

### Category G: marketDataIntegrationService.ts (remaining after migration)
After `increment_error_count` and `add_data_points` RPC functions are created, several errors resolve. Remaining issues:
- `MarketDataSource` local type doesn't match DB Row (needs `lastFetchAt` → `last_fetch_at` mapping)
- `PricingPolicy` local type slightly differs from DB Row
- `string` not assignable to union types (needs explicit casting)

### Category H: equipmentPricingTiersService.ts (remaining after migration)
After `pricing_markup_config` table is created, markup errors resolve. Remaining:
- `EquipmentPricingTier` local interface doesn't match `equipment_pricing_tiers` Row
- `MarketPrice` local interface doesn't match `collected_market_prices` Row

---

## Post-Migration Steps

1. **Run SQL migration** in Supabase SQL Editor
2. **Regenerate types**: `npx supabase gen types typescript --project-id fvmpmozybmtzjvikrctq > src/types/database.types.ts`
3. **Check error count**: `npx tsc --noEmit -p tsconfig.app.json 2>&1 | wc -l`
4. Expected: ~200-250 errors eliminated by DB fixes, remainder are code-side fixes (Categories A-H above)
5. **Build test**: `npm run build:prod` (should still pass — esbuild ignores type errors)
