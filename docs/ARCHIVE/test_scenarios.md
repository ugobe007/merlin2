# Test Scenarios - Critical Fixes Verification

## Test 1: Apartment Building (500 units + 6 EV chargers)

**Steps:**
1. Navigate to http://localhost:5178
2. Select "Apartment Complex" 
3. Enter configuration:
   - Units: 500
   - Amenities: Select "Fitness" + "Pool" + "Full amenities"
   - EV charging ports: 6
   - Grid connection: 30 MW utility
4. Proceed through wizard

**Expected Results:**
- ✅ Base load: 500 units × 1.5 kW = 0.75 MW
- ✅ Amenities: Fitness (25kW) + Pool (40kW) = 0.065 MW
- ✅ EV chargers: 6 × 12 kW = 0.072 MW
- ✅ **Total Peak: ~0.887 MW minimum**
- ✅ BESS recommendation should be proportional to this load

**Step 3 - Add Solar:**
- Add 0.6 MW solar
- Proceed to Step 6

**Verify:**
- [ ] Solar section displays with 0.6 MW
- [ ] Solar cost shows in breakdown
- [ ] Equipment total includes solar cost
- [ ] Step 7 total matches Step 6 total

**Check Console Logs:**
```
✅ [SmartWizardV2] Using equipmentCalculations.ts as SINGLE SOURCE OF TRUTH
🔍 [Step4_QuoteSummary] Equipment breakdown result: hasSolar: true, solarTotalCost: [should be > 0]
```

---

## Test 2: Datacenter - Limited Grid (250MW peak, 50MW grid)

**Steps:**
1. Select "Datacenter / Colocation"
2. Enter configuration:
   - Peak demand: 250 MW
   - Grid connection: Limited (50 MW available)
   - Industry: Datacenter
3. Check Smart Wizard recommendation

**Expected Results:**
- ✅ Power gap: 250 MW - 50 MW = **200 MW**
- ✅ BESS should recommend **200 MW** (not 150 MW)
- ✅ Duration: Based on datacenter backup requirements

**Verify:**
- [ ] BESS recommendation = 200 MW (fills gap)
- [ ] Console shows power gap override: `bessPowerMW = 200`
- [ ] No tier-based scaling (should use gap directly)

---

## Test 3: Hotel with Solar (150 rooms + solar)

**Steps:**
1. Select "Hotel / Resort"
2. Enter configuration:
   - Rooms: 150
   - Amenities: Standard
   - Grid: On-grid
3. Proceed to Step 3
4. Add 2.0 MW solar
5. Proceed to Step 6

**Expected Results:**
- ✅ Solar should NOT auto-apply
- ✅ User must manually add solar in Step 3
- ✅ Power Output label: "Battery Power: X.X MW" (not Battery + Solar)

**Verify:**
- [ ] No automatic solar addition
- [ ] No popup alert blocking UI
- [ ] Step 6 shows correct battery power only
- [ ] Solar costs display in breakdown
- [ ] Totals consistent between steps

---

## Test 4: EV Charging Station - Public (50 chargers, limited grid)

**Steps:**
1. Select "EV Charging Station"
2. Enter configuration:
   - Charger mix: 20 Level 2 + 10 DC Fast 50kW + 5 DC Fast 150kW
   - Grid: Limited (2 MW available)
   - Expected peak: 5 MW
3. Check recommendation

**Expected Results:**
- ✅ Power gap: 5 MW - 2 MW = **3 MW**
- ✅ BESS should recommend **3 MW** minimum
- ✅ calculateEVChargingBaseline() uses power gap override

**Verify:**
- [ ] BESS fills gap (3 MW minimum)
- [ ] Doesn't undersize due to tier scaling
- [ ] Console shows power gap calculation

---

## Summary Checklist

### Architecture Fixes:
- [ ] Only one calculation source (equipmentCalculations.ts)
- [ ] No duplicate totals
- [ ] centralizedCalculations NOT imported in SmartWizardV2
- [ ] All pricing flows through unifiedPricingService → database

### Solar Integration:
- [ ] Solar costs display in Step 6
- [ ] Solar doesn't auto-apply
- [ ] Power Output shows battery only
- [ ] Totals include solar when added

### BESS Sizing:
- [ ] Power gap logic works for limited grid
- [ ] Amenity loads add correctly (powerKw objects)
- [ ] EV charger ports add power (additionalLoadKw)
- [ ] All use cases calculate correctly

### Console Logs to Monitor:
```
✅ [SmartWizardV2] Using equipmentCalculations.ts as SINGLE SOURCE OF TRUTH
🔍 [Step4_QuoteSummary] Calculating equipment breakdown with: {solarMW: 0.6}
🔍 [Step4_QuoteSummary] Equipment breakdown result: {hasSolar: true, solarTotalCost: XXXXX}
```

---

## Quick Test Commands

```bash
# Check for TypeScript errors
npm run build

# Run dev server
npm run dev

# Check specific files
grep -n "calculateFinancialMetrics" src/components/wizard/SmartWizardV2.tsx
# Should return: NO MATCHES (removed)

grep -n "centralizedCalculations" src/components/wizard/SmartWizardV2.tsx  
# Should return: Only commented line
```
