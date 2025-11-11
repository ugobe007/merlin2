# Industry Standards Database Migration

## 🎯 Overview

This document describes the migration of industry baseline calculations from hardcoded constants to a database-backed system with intelligent caching and fallback mechanisms.

**Status**: ✅ Phase 3 Complete - Database-first service layer implemented

---

## 📋 Migration Phases

### ✅ Phase 1: Database Schema (COMPLETE)
**File**: `/docs/industry_baselines_schema.sql`

**Features Implemented**:
- `industry_baselines` table with 6-decimal precision for power calculations
- `industry_baseline_history` table for audit trail
- Automatic change tracking via PostgreSQL triggers
- Row-level security (RLS) policies
- Validation views for data quality
- Sample queries for common operations

**Key Fields**:
```sql
industry_key          VARCHAR(50)    PRIMARY KEY
industry_name         VARCHAR(100)   Human-readable name
power_mw_per_unit     DECIMAL(10,6)  Power per scale unit
scale_unit            VARCHAR(30)    Unit type (rooms, sq_ft, etc.)
typical_duration_hrs  DECIMAL(5,2)   Typical storage duration
solar_ratio           DECIMAL(5,2)   Solar/BESS sizing ratio
is_active             BOOLEAN        Enable/disable records
data_source           TEXT           Documentation reference
```

---

### ✅ Phase 2: Migration Script (COMPLETE)
**File**: `/scripts/migrate-industry-baselines.ts`

**Features Implemented**:
- Reads from `INDUSTRY_BASELINES` constant in code
- Uses upsert strategy (update if exists, insert if new)
- Error handling with success/failure counting
- Verification query after migration
- Sample data display for validation

**Usage**:
```bash
# Set environment variables
export VITE_SUPABASE_URL="your-project-url"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Run migration
npx tsx scripts/migrate-industry-baselines.ts
```

**Expected Output**:
```
🔄 Starting industry baselines migration...
✅ Successfully migrated: hotel
✅ Successfully migrated: datacenter
...
✅ Migration complete: 15 successful, 0 failed

📊 Verification - Current baselines in database:
hotel: 0.00293 MW/room
datacenter: 0.25 MW/IT_load_MW
...
```

---

### ✅ Phase 3: Service Layer Integration (COMPLETE)
**File**: `/src/utils/industryBaselines.ts`

**Architecture**:
```
┌─────────────────────────────────────────────┐
│  calculateIndustryBaseline(industry, scale) │
└────────────────┬────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────┐
│        getIndustryBaseline(industry)        │
└────────────────┬────────────────────────────┘
                 │
                 v
    ┌────────────────────────┐
    │ fetchBaselineFromDB()  │
    └──────────┬─────────────┘
               │
     ┌─────────┴──────────┐
     v                    v
┌─────────┐        ┌──────────────┐
│ CACHE   │        │  SUPABASE    │
│ (5 min) │        │  DATABASE    │
└────┬────┘        └──────┬───────┘
     │                    │
     └─────────┬──────────┘
               v
    ┌──────────────────────┐
    │  Return baseline or  │
    │  fallback to code    │
    └──────────────────────┘
```

**Key Functions**:

1. **`fetchBaselineFromDatabase(industryKey)`** - Async
   - Checks in-memory cache first (5-minute TTL)
   - Queries Supabase if cache miss
   - Returns null if Supabase unavailable or error
   - Caches successful results

2. **`getIndustryBaseline(industryKey)`** - Async
   - Calls `fetchBaselineFromDatabase()`
   - Falls back to `INDUSTRY_BASELINES` code constant
   - Logs which source was used

3. **`calculateIndustryBaseline(industry, scale, useCaseData)`** - Async ⭐
   - **PRIMARY FUNCTION** - Database-first approach
   - Handles special cases (EV charging complexity)
   - Applies bounds and rounding
   - Returns complete configuration

4. **`calculateIndustryBaselineSync(industry, scale, useCaseData)`** - Sync
   - **DEPRECATED** - Backward compatibility only
   - Uses code-based `INDUSTRY_BASELINES` only
   - Emits warning when used

5. **`clearBaselineCache()`** - Utility
   - Force refresh from database
   - Useful for testing or admin operations

**Cache Strategy**:
- In-memory Map with TTL (5 minutes)
- Prevents excessive database calls
- Transparent - no code changes needed
- Can be cleared manually for testing

**Fallback Hierarchy**:
1. **Cache** (fastest, 5-minute TTL)
2. **Database** (dynamic, up-to-date)
3. **Code Constant** (reliable, safe fallback)

---

## 🚀 Deployment Steps

### 1. Deploy Database Schema
```bash
# Copy SQL to Supabase SQL Editor
cat docs/industry_baselines_schema.sql

# Execute in Supabase Dashboard > SQL Editor
# Creates tables, triggers, RLS policies, views
```

### 2. Run Migration Script
```bash
# Ensure environment variables set
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key-here"

# Run migration
npx tsx scripts/migrate-industry-baselines.ts
```

### 3. Verify Data
```sql
-- In Supabase SQL Editor
SELECT 
  industry_key,
  industry_name,
  power_mw_per_unit,
  scale_unit,
  data_source
FROM industry_baselines
WHERE is_active = true
ORDER BY industry_name;
```

### 4. Test Cache & Fallback
```typescript
// In browser console or test file
import { calculateIndustryBaseline, clearBaselineCache } from './utils/industryBaselines';

// Test database fetch
const result1 = await calculateIndustryBaseline('hotel', 400);
console.log('First call (DB):', result1);

// Test cache hit
const result2 = await calculateIndustryBaseline('hotel', 400);
console.log('Second call (cache):', result2);

// Test cache clear and refresh
clearBaselineCache();
const result3 = await calculateIndustryBaseline('hotel', 400);
console.log('After cache clear (DB):', result3);
```

---

## 📊 Data Validation

### Industry Baselines Currently Defined

| Industry Key | Power/Unit | Scale Unit | Source |
|-------------|-----------|------------|--------|
| `hotel` | 0.00293 MW | rooms | CBECS 2018: 440kW/150 rooms |
| `datacenter` | 0.25 MW | IT_load_MW | Uptime Institute Tier III |
| `hospital` | 0.000170 MW | sq_ft | CBECS Healthcare 23 W/sf |
| `ev-charging` | Variable | calculated | SAE J2894, CCS standards |
| `manufacturing` | 0.000150 MW | sq_ft | DOE Industrial 15 kW/1000sf |
| `cold-storage` | 0.000030 MW | sq_ft | ASHRAE cold storage |
| `retail` | 0.000018 MW | sq_ft | CBECS 2018 Retail |
| ... | ... | ... | ... |

**Total**: 15+ industries with validated data

---

## 🔧 Admin Operations

### Add New Industry via Supabase Studio
```sql
INSERT INTO industry_baselines (
  industry_key,
  industry_name,
  power_mw_per_unit,
  scale_unit,
  typical_duration_hrs,
  solar_ratio,
  is_active,
  description,
  data_source
) VALUES (
  'new-industry',
  'New Industry Type',
  0.005,
  'units',
  4.0,
  1.2,
  true,
  'Description of use case',
  'Source reference'
);
```

### Update Existing Industry
```sql
UPDATE industry_baselines
SET 
  power_mw_per_unit = 0.00295,
  data_source = 'Updated CBECS 2024 data',
  updated_at = NOW()
WHERE industry_key = 'hotel';
```

### View Audit History
```sql
SELECT 
  industry_key,
  changed_at,
  old_power_mw_per_unit,
  new_power_mw_per_unit,
  old_data_source,
  new_data_source
FROM industry_baseline_history
WHERE industry_key = 'hotel'
ORDER BY changed_at DESC;
```

### Disable Industry (don't delete!)
```sql
UPDATE industry_baselines
SET is_active = false
WHERE industry_key = 'old-industry';
```

---

## 🎓 Benefits of Database Migration

### Before (Code-based)
❌ Required code deployment to update values  
❌ No audit trail for changes  
❌ Multiple calculation sources caused drift  
❌ No administrative oversight  
❌ Version control conflicts from frequent updates  

### After (Database-backed)
✅ Update values instantly via Supabase Studio  
✅ Complete audit history with triggers  
✅ Single source of truth  
✅ Admin can manage without developer  
✅ 5-minute cache prevents performance impact  
✅ Automatic fallback if database unavailable  
✅ Historical tracking of all changes  

---

## 🚨 Critical Case Study: Hotel Calculation Fix

### The Problem
Multiple calculation sources caused wild inconsistencies:

```typescript
// Location 1: SmartWizardV2 line 103
powerMW = 0.00293 * numRooms;  // ✅ CORRECT: 1.17 MW for 400 rooms

// Location 2: SmartWizardV2 line 630
powerMW = numRooms * 0.025;    // ❌ WRONG: 10 MW for 400 rooms

// Location 3: AI Wizard calculation
powerMW = 0.022 * numRooms;    // ❌ WRONG: 8.8 MW for 400 rooms

// Location 4: Legacy calculation
powerMW = numRooms * 0.02;     // ❌ WRONG: 8 MW for 400 rooms
```

**Result**: Same 400-room hotel got recommendations ranging from 1.17 MW to 10 MW! 🤯

### The Solution
Single authoritative source with database backing:

```typescript
// industryBaselines.ts
'hotel': {
  industry: 'Hotel/Resort',
  powerMWPerUnit: 0.00293,  // 2.93 kW per room
  scaleUnit: 'rooms',
  typicalDurationHrs: 4,
  solarRatio: 1.0,
  description: 'Full-service hotel with HVAC, lighting, elevators',
  dataSource: 'CBECS 2018: 440kW baseline / 150 rooms = 2.93 kW/room'
}
```

**Now**: 400 rooms × 0.00293 MW/room = **1.17 MW consistently everywhere** ✅

---

## 🧪 Testing Checklist

- [ ] Database schema deployed successfully
- [ ] Migration script completed without errors
- [ ] All 15+ industries present in database
- [ ] Cache hit detected on second call
- [ ] Cache clears and refreshes correctly
- [ ] Fallback to code works when database unavailable
- [ ] Audit history trigger captures changes
- [ ] RLS policies prevent unauthorized modifications
- [ ] Hotel calculation shows 1.17 MW for 400 rooms in all wizards
- [ ] Performance acceptable (cache prevents slowdown)

---

## 📈 Monitoring & Maintenance

### Metrics to Track
- Cache hit rate (should be >90% in production)
- Database query latency
- Fallback usage frequency
- Number of admin updates per week
- Audit history growth rate

### Regular Maintenance
- **Weekly**: Review admin changes in audit history
- **Monthly**: Validate industry data against latest CBECS/ASHRAE
- **Quarterly**: Analyze cache performance, adjust TTL if needed
- **Annually**: Comprehensive data source refresh

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `/docs/industry_baselines_schema.sql` | Database table definitions |
| `/scripts/migrate-industry-baselines.ts` | Migration script |
| `/src/utils/industryBaselines.ts` | Service layer with cache |
| `/src/services/supabaseClient.ts` | Database connection |
| `/src/components/wizard/SmartWizardV2.tsx` | Primary consumer |

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs in dashboard
2. Verify environment variables set correctly
3. Test with synchronous version as fallback
4. Check browser console for cache/database logs
5. Review audit history for unexpected changes

---

**Last Updated**: 2024 (Phase 3 Complete)  
**Status**: ✅ Ready for deployment and testing  
**Next Step**: Run migration script and verify all systems operational
