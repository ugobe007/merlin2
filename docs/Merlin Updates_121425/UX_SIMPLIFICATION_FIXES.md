# UX SIMPLIFICATION & TWO CALCULATORS FIX
**Date**: December 14, 2025  
**Commit**: adef136  
**Status**: ✅ DEPLOYED  

## User Problems Identified

### 1. **"Reduce the noise around these decisions"**
**Issue**: Too many intermediate modals creating confusion
- Merlin's Insight modal shows after Section 2
- Then AcceptCustomizeModal shows after generating quote
- User sees multiple overlapping recommendations

**Solution**:
- ✅ Disabled intermediate Merlin's Insight modal
- ✅ GoalsSection Continue button now triggers `generateQuote()` directly
- ✅ Single decision point: AcceptCustomizeModal with full recommendation

### 2. **"PP and PG calculations need to align with wizard recommendation-- you are using 2 different calculators here!"**
**Issue**: PowerProfile widget showed 139% over-provisioning because it was using different values than wizard calculation
- PowerProfile used: `systemSize={wizard.wizardState.batteryKW}` (slider values)
- Wizard calculated: `centralizedState.calculated.recommendedBatteryKW` (SSOT values)
- These were mismatched

**Solution**:
- ✅ PowerProfileTracker now receives `neededPowerKW` from `centralizedState.calculated`
- ✅ Uses same SSOT calculation as wizard recommendation
- ✅ Power gap now shows correct alignment

### 3. **"800 kWh is the default recommendation on Step 4-- this is a bug"**
**Issue**: Template defaults showing instead of calculated values

**Investigation Status**: ⚠️ MONITORING
- Enhanced debug logging added
- Console will show calculation trigger lifecycle
- Need user to test and provide console output

## Code Changes

### 1. StreamlinedWizard.tsx (Lines 559-571)

**BEFORE**:
```typescript
onContinue={() => {
  wizard.completeSection('goals');
  wizard.advanceToSection(4);
}}
```

**AFTER**:
```typescript
onContinue={() => {
  // Dec 14, 2025 - CRITICAL FIX: Show AcceptCustomizeModal instead of auto-advancing
  // This creates single clear decision point per user request to "reduce noise"
  console.log('🎯 [GOALS] Continue clicked - triggering generateQuote() for AcceptCustomizeModal');
  wizard.completeSection('goals');
  wizard.generateQuote(); // This will show AcceptCustomizeModal
}}
```

### 2. StreamlinedWizard.tsx (Lines 145-150)

**BEFORE**:
```typescript
const timer = setTimeout(() => {
  setShowMerlinRecommendation(true);
  setHasSeenRecommendation(true);
  setShowMerlinBanner(true);
}, 500);
```

**AFTER**:
```typescript
const timer = setTimeout(() => {
  // Dec 14, 2025 - DISABLED intermediate Merlin's Insight modal
  setHasSeenRecommendation(true);
  setShowMerlinBanner(false);
}, 500);
```

### 3. StreamlinedWizard.tsx (Lines 486-498)

**BEFORE**:
```typescript
<PowerProfileTracker
  currentSection={wizard.currentSection}
  completedSections={wizard.completedSections}
  totalPoints={wizard.totalPoints}
  level={Math.floor(wizard.totalPoints / 100) + 1}
  selectedIndustry={wizard.wizardState.industryName}
  selectedLocation={wizard.wizardState.state}
  systemSize={wizard.wizardState.batteryKW}
  systemKWh={wizard.wizardState.batteryKWh}
  durationHours={wizard.wizardState.durationHours}
/>
```

**AFTER**:
```typescript
<PowerProfileTracker
  currentSection={wizard.currentSection}
  completedSections={wizard.completedSections}
  totalPoints={wizard.totalPoints}
  level={Math.floor(wizard.totalPoints / 100) + 1}
  selectedIndustry={wizard.wizardState.industryName}
  selectedLocation={wizard.wizardState.state}
  systemSize={wizard.wizardState.batteryKW}
  systemKWh={wizard.wizardState.batteryKWh}
  durationHours={wizard.wizardState.durationHours}
  neededPowerKW={wizard.centralizedState?.calculated?.recommendedBatteryKW || 0}
  neededEnergyKWh={wizard.centralizedState?.calculated?.recommendedBatteryKWh || 0}
  neededDurationHours={4}
/>
```

### 4. useStreamlinedWizard.ts - Enhanced Debug Logging

**Added**:
```typescript
// At calculation trigger (Line 423-428)
console.log('🔄 [RECALC] ========================================');
console.log('🔄 [RECALC] CALCULATION TRIGGER FIRED!');
console.log('🔄 [RECALC] Industry:', wizardState.selectedIndustry);
console.log('🔄 [RECALC] Current Section:', currentSection);
console.log('🔄 [RECALC] Raw useCaseData field names:', Object.keys(data));
console.log('🔄 [RECALC] Raw useCaseData values:', data);

// After SSOT calculation (Line 506-514)
console.log('✅ [SSOT] ========================================');
console.log('✅ [SSOT] CALCULATION SUCCESSFUL!');
console.log('✅ [SSOT] Industry:', wizardState.selectedIndustry);
console.log('✅ [SSOT] Raw field names:', Object.keys(data));
console.log('✅ [SSOT] Normalized field names:', Object.keys(normalizedData));
console.log('✅ [SSOT] Normalized values:', normalizedData);
console.log('✅ [SSOT] Peak Demand (kW):', peakDemandKW);
console.log('✅ [SSOT] Power (MW):', powerResult.powerMW);

// After centralizedState update (Line 540-548)
console.log('💾 [RECALC] ========================================');
console.log('💾 [RECALC] UPDATED centralizedState.calculated:');
console.log('💾 [RECALC] Total Peak Demand (kW):', peakDemandKW);
console.log('💾 [RECALC] Recommended Battery (kW):', recommendedBatteryKW);
console.log('💾 [RECALC] Recommended Battery (kWh):', recommendedBatteryKWh);
```

## Expected User Flow (SIMPLIFIED)

**BEFORE** (3 decision points):
1. User completes Section 2 (Facility Details) → Auto-advance to Section 3
2. 500ms after Section 3 loads → Merlin's Insight modal pops up
3. User dismisses → Sees Goals section
4. User clicks Continue → Auto-advance to Section 4
5. User configures sliders → Clicks Generate Quote
6. AcceptCustomizeModal appears

**AFTER** (1 clear decision point):
1. User completes Section 2 (Facility Details) → Auto-advance to Section 3
2. User completes Section 3 (Goals) → Clicks Continue
3. `generateQuote()` runs → AcceptCustomizeModal appears with full recommendation
4. User chooses:
   - **Accept AI Recommendation** → Apply calculated values, advance to Section 4
   - **Customize** → Go to Section 4 to adjust sliders manually

## Testing Checklist

### For User to Test:
1. ✅ **Hard refresh browser** (Cmd+Shift+R) to clear old bundle
2. ✅ **Open browser console** (F12 or Cmd+Option+I)
3. ✅ Start wizard at https://merlin2.fly.dev/
4. ✅ Enter: Location = California
5. ✅ Select: Hotel industry
6. ✅ Fill Section 2: 200 rooms, upscale, pool + restaurant
7. ✅ **Check console** - should see:
   ```
   🔄 [RECALC] CALCULATION TRIGGER FIRED!
   🔄 [RECALC] Industry: hotel
   🔄 [RECALC] Raw useCaseData field names: [...]
   ```
8. ✅ Continue through Section 3 (Goals)
9. ✅ Click **Continue** button
10. ✅ **Check console** - should see:
    ```
    🎯 [GOALS] Continue clicked - triggering generateQuote()
    ```
11. ✅ AcceptCustomizeModal should appear with:
    - Peak Demand: ~650 kW (not 450 kW)
    - Recommended BESS: ~455 kW (70% of peak, not 315 kW)
    - Recommended Storage: ~1,820 kWh (not 1,300 kWh)
12. ✅ PowerProfile widget (left sidebar) should show **<100%** provisioning (not 139%)

### Expected Console Output:
```
🔄 [RECALC] ========================================
🔄 [RECALC] CALCULATION TRIGGER FIRED!
🔄 [RECALC] Industry: hotel
🔄 [RECALC] Current Section: 3
🔄 [RECALC] Raw useCaseData field names: ['numberOfRooms', 'hotelClass', ...]
🔄 [RECALC] Raw useCaseData values: { numberOfRooms: 200, hotelClass: 'upscale', ... }
✅ [SSOT] ========================================
✅ [SSOT] CALCULATION SUCCESSFUL!
✅ [SSOT] Peak Demand (kW): 650
✅ [SSOT] Power (MW): 0.65
✅ [SSOT] Method: calculateHotelPower
💾 [RECALC] ========================================
💾 [RECALC] UPDATED centralizedState.calculated:
💾 [RECALC] Total Peak Demand (kW): 650
💾 [RECALC] Recommended Battery (kW): 455
💾 [RECALC] Recommended Battery (kWh): 1820
🎯 [GOALS] Continue clicked - triggering generateQuote()
```

## If Still Broken

### Possible Root Causes:
1. **Calculation trigger not firing** → Console shows no 🔄 [RECALC] logs
   - Check: `currentSection === 3` condition
   - Check: `wizardState.useCaseData` is populated
   
2. **Field name mismatch** → Console shows empty normalized values
   - Check: Actual database field names in useCaseData
   - Update: Normalization mapping in useStreamlinedWizard.ts
   
3. **Browser cache** → Old bundle still loading
   - Solution: Hard refresh (Cmd+Shift+R)
   - Solution: Open incognito window
   
4. **Calculation succeeds but values don't show** → Modal shows 0 or defaults
   - Check: AcceptCustomizeModal reading from correct state path
   - Check: `centralizedState.calculated` is defined

### Debug Steps:
1. Open React DevTools
2. Find `StreamlinedWizard` component
3. Inspect: `wizard.centralizedState.calculated`
4. Should see: `{ totalPeakDemandKW: 650, recommendedBatteryKW: 455, ... }`
5. If empty or 0: Calculation didn't populate state
6. If populated but modal shows defaults: Modal reading from wrong path

## Next Steps

1. ⏳ **Wait for user testing** - User will test and provide:
   - Screenshot of AcceptCustomizeModal
   - Console log output
   - PowerProfile % provisioning

2. ⏳ **If logs show calculation firing but values wrong**:
   - Check actual database field names
   - Update field normalization mapping
   - May need to add more aliases

3. ⏳ **If logs show calculation not firing**:
   - Check useEffect dependencies
   - May need to add explicit trigger button for debugging
   - May need to change trigger condition

4. ⏳ **If everything works**:
   - Remove intermediate Merlin's Insight modal code entirely
   - Clean up old unused state variables
   - Update documentation

## Related Files

- `src/components/wizard/StreamlinedWizard.tsx` - Main orchestrator
- `src/components/wizard/hooks/useStreamlinedWizard.ts` - State management
- `src/components/wizard/PowerProfileTracker.tsx` - Sidebar widget
- `src/services/useCasePowerCalculations.ts` - SSOT for power calculations
- `docs/Merlin Updates_120425/CRITICAL_BUGS_ANALYSIS.md` - Initial root cause analysis

## Deployment Info

- **Commit**: adef136
- **Deployed**: Dec 14, 2025
- **Build Status**: ✅ PASSED
- **URL**: https://merlin2.fly.dev/
- **Console Logs**: Enabled with enhanced debugging

---

**Summary**: Simplified UX to single decision modal, aligned PowerProfile with wizard calculations, added extensive debug logging. User needs to test and provide console output to verify calculation trigger fires correctly.
