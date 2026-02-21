# ⚡ Apply Database Migration NOW

## Quick Steps (2 minutes)

### 1. Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/sql/new**

### 2. Copy Migration SQL

The migration file is open in your editor: `database/migrations/20260220_comparison_mode.sql`

**Copy all 203 lines** (Cmd+A, Cmd+C)

### 3. Paste & Run

1. Paste into the SQL editor
2. Click "Run" button (or Cmd+Enter)
3. Wait for "Success" message

### 4. Verify Tables Created

Go to: **https://supabase.com/dashboard/project/fvmpmozybmtzjvikrctq/editor**

Check for these new tables:
- ✅ `saved_scenarios` (should have 0 rows initially)
- ✅ `comparison_sets` (should have 0 rows initially)

### 5. Regenerate TypeScript Types

```bash
npx supabase gen types typescript --project-id fvmpmozybmtzjvikrctq > src/types/supabase.ts
```

### 6. Build & Deploy

```bash
# Build should now pass
npm run build

# If build passes, deploy
flyctl deploy --remote-only
```

---

## Expected Results

After migration applied:
- ✅ TypeScript errors about `saved_scenarios` disappear
- ✅ Build completes successfully
- ✅ Deployment succeeds
- ✅ Site loads without TDZ error
- ✅ Comparison Mode feature works
- ✅ Auto-Save feature works

---

## If You Get Any Errors

**Error: "relation already exists"**
- Tables already created - safe to ignore
- Continue to step 5 (regenerate types)

**Error: "permission denied"**
- Check you're logged into correct Supabase project
- Project ID should be: `fvmpmozybmtzjvikrctq`

**Error: "syntax error"**
- Make sure you copied ALL 203 lines
- Don't copy any line numbers from editor
- SQL should start with `/**` and end with `*/`

---

## What This Migration Does

Creates 2 tables:
1. **saved_scenarios** - Stores multiple quote configurations
   - 11 columns: id, user_id, scenario_name, scenario_data, quote_result, etc.
   - Computed columns: peak_kw, kwh_capacity, total_cost, annual_savings, payback_years

2. **comparison_sets** - Groups scenarios together
   - 7 columns: id, user_id, set_name, scenario_ids[], created_at, etc.

Adds:
- 8 RLS (Row Level Security) policies
- 2 helper functions: `cleanup_old_scenarios()`, `get_scenario_comparison()`

---

## Time to Complete

- **2 minutes** to apply migration
- **1 minute** to regenerate types
- **3-5 minutes** for build + deploy
- **Total: ~8 minutes to site recovery**

---

🚀 **Ready? Open Supabase dashboard and paste the SQL!**
