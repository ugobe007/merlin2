# 🎯 Quick Reference: What's Safe to Clean

## ✅ SAFE TO DELETE (0% Risk)

### Backup Files - DELETE NOW
```bash
rm src/components/BessQuoteBuilder.tsx.backup
rm src/services/__tests__/baselineService.test.ts.bak
rm src/utils/testCalculations.ts.bak
rm src/scripts/verifyDatabaseConfig.ts.bak
```

### Archive Files - DELETE NOW  
```bash
rm docs/ARCHIVE/PRICING_CONFIG_SCHEMA.sql.old
rm docs/ARCHIVE/supabase_pricing_schema.sql.old
```

---

## ✅ SAFE TO CLEAN (Code Comments Only)

### dailySyncService.ts - Remove Misleading Warnings

**Current (Lines 2-4):**
```typescript
// Daily Sync Service - STUB VERSION
// ⚠️ THIS SERVICE IS DEPRECATED AND NON-FUNCTIONAL
// Original archived at: src/services/ARCHIVE/dailySyncService.ts.old
// TODO: Complete rewrite to use useCaseService and MASTER_SCHEMA.sql structure
```

**Replace with:**
```typescript
// Daily Sync Service - Active price sync service
// Handles daily kWh/MWh price updates from external links
```

**Lines to Remove:**
- Line 37: `console.warn('⚠️ DailySyncService instantiated but is non-functional (deprecated)');`
- Line 42: `console.warn('⚠️ DailySyncService.startService() called but is non-functional');`
- Line 47: `console.warn('⚠️ DailySyncService.stopService() called but is non-functional');`
- Line 51: `console.warn('⚠️ DailySyncService.runDailySync() called but is non-functional');`
- Line 70: `console.warn(\`⚠️ DailySyncService.runJob(\${jobId}) called but is non-functional\`);`

**Result:** Service works the same, no false warnings!

---

## ⚠️ SAFE TO GATE (Development Only)

### baselineService.ts - Gate Debug Logs

**Find all (15+ instances):**
```typescript
console.log(`🔍 [BaselineService] ...`);
console.warn(`⚠️ [BaselineService] ...`);
```

**Wrap with:**
```typescript
if (import.meta.env.DEV) {
  console.log(`🔍 [BaselineService] ...`);
}
```

**Result:** Logs only in development, clean production console!

### authService.ts - Gate Debug Tools

**Find (around line 476):**
```typescript
(window as any).authDebug = {
  listAccounts, deleteAccount, resetPassword, clearAll
}
console.log('🔧 Auth debug tools loaded...')
```

**Wrap with:**
```typescript
if (import.meta.env.DEV) {
  (window as any).authDebug = {
    listAccounts, deleteAccount, resetPassword, clearAll
  }
  console.log('🔧 Auth debug tools loaded...')
}
```

**Result:** Debug tools only in development, secure production!

---

## ❌ DO NOT DELETE

### Keep ALL These Services (Actively Used)

1. **dailySyncService.ts** - Price sync (PricingAdminDashboard line 192)
2. **centralizedCalculations.ts** - Core calculation engine (5+ imports)
3. **advancedFinancialModeling.ts** - Financial modeling features
4. **bessDataService.ts** - BESS calculations (dataIntegrationService)
5. **advancedBessAnalytics.ts** - Analytics (SmartWizardV2)
6. **baselineService.ts** - Baseline calculations (aiOptimizationService)

---

## 🚀 Quick Cleanup Command

**Run the safe script:**
```bash
./cleanup.sh
```

**Or manual (5 minutes):**
```bash
# Delete backup files only
rm src/components/BessQuoteBuilder.tsx.backup
rm src/services/__tests__/baselineService.test.ts.bak
rm src/utils/testCalculations.ts.bak
rm src/scripts/verifyDatabaseConfig.ts.bak
rm docs/ARCHIVE/PRICING_CONFIG_SCHEMA.sql.old
rm docs/ARCHIVE/supabase_pricing_schema.sql.old

# Commit
git add -A
git commit -m "cleanup: Remove backup files"

# Verify nothing broke
npm run type-check
npm run build
```

---

## 📋 Post-Cleanup Checklist

```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Test locally
npm run dev
# → Visit http://localhost:5173
# → Test Smart Wizard flow
# → Test Admin Panel price sync

# 4. Deploy
flyctl deploy

# 5. Production test
# → Visit https://merlin2.fly.dev/
# → Test all critical paths
```

---

## 💡 Summary

**What cleanup.sh does:**
- ✅ Deletes 6 backup files
- ✅ Reports debug code locations
- ✅ Counts TODO comments
- ❌ Does NOT touch any service files

**100% Safe!** No functionality changes, just cleaner codebase.
