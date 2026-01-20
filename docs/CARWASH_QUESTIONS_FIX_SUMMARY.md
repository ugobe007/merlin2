# Car Wash Questions Fix Summary

**Date:** January 19, 2026  
**Migration:** `20260119_fix_carwash_questions_comprehensive.sql`

## Issues Addressed

### #3 - Operating Model Energy Impact

**Question:** Does operating model impact energy logic?

**Answer:** YES. The operating model significantly affects energy consumption:

| Model | Energy Impact |
|-------|--------------|
| **Fully Attended** | +10-15% base load from HVAC for lobby/waiting areas, consistent lighting |
| **Partially Attended** | Variable load pattern - peaks during staffed hours |
| **Unattended/Automated** | 24/7 security lighting, lower HVAC (no lobby), but consistent base load |
| **Hybrid** | Moderate HVAC, variable peaks |

**Fix:** Added `energyImpact` field to each option and updated help text to explain the impact.

---

### #4 - Tunnel Bay Length Input Selections

**Problem:** Previous range was too narrow (80-200 ft max).

**Fix:** Updated range to 40-220 ft with select options:
- Mini-tunnels: 40-60 ft
- Short standard: 80 ft
- Standard: 100-120 ft
- Express: 150-200+ ft

---

### #5 - Facility Square Footage

**Problem:** Generic ranges not appropriate for car wash scale.

**Fix:** Updated to car wash-specific ranges (5,000-60,000 sq ft total site):
- Small self-serve: Under 8,000 sq ft
- Standard express: 12,000-18,000 sq ft
- Large full-service: 25,000-50,000+ sq ft

---

### #6 - Average Vehicles Washed/Day

**Problem:** Max of 400 was too low for high-volume express washes.

**Fix:** Updated range to 20-1,500 with options:
- Self-serve: 20-80/day
- IBA: 50-150/day
- Standard express: 200-450/day
- High-volume express: 600-1,200+/day

---

### #9 - Vacuum Stations Max

**Problem:** Max was 40, but most locations cap at 25.

**Fix:** Changed max to 25 with select options from 0-25. Added "None" option for facilities without vacuums.

---

### #18 - Available Roof Area

**Problem:** Options not appropriate for car wash scale.

**Fix:** Updated to 0-15,000 sq ft with car wash-specific options:
- Tunnel roof only: 1,500-2,500 sq ft
- Roof + vacuum canopy: 4,000-6,000 sq ft
- Full canopy coverage: 9,000-12,000 sq ft

---

### #21 - Monthly Electric Bill Ranges

**Problem:** Ranges too wide for car wash industry.

**Research-based ranges:**
| Wash Type | Monthly Bill |
|-----------|--------------|
| Self-serve | $800-2,000 |
| IBA | $2,000-4,000 |
| Express tunnel | $4,000-12,000 |
| Full-service | $8,000-15,000+ |

**Fix:** Updated options to match industry norms. Added "Don't know" option that triggers auto-estimation.

---

### #22 - Peak Power Demand

**Problem:** Would a user know their peak demand? What if they don't?

**Answer:** Most operators do NOT know their peak kW. 

**Fix:** 
1. Added "Don't know" as the **default option**
2. When "Don't know" is selected, the system auto-estimates based on:
   - Facility type (IBA vs tunnel vs self-serve)
   - Equipment configuration (blowers, water heaters)
   - Operating hours
3. Help text explains where to find this on their utility bill

**Estimation logic** (in `carWashIndustryProfile.ts`):
- Self-serve: 5 kW/bay × bays + 10 kW base
- Express tunnel: 2 kW/ft × tunnel length + dryer load + base
- Full-service: Above + vacuum stations + detail bays

---

### #23 - Grid Capacity

**Problem:** Would a user know their grid capacity?

**Answer:** Most operators do NOT know their service size.

**Fix:**
1. Added "Don't know" as the **default option**
2. When "Don't know" is selected, the system estimates based on facility type:
   - Self-serve: ~100 kW (200A service)
   - IBA: ~100-250 kW (200-400A)
   - Express tunnel: ~250-500 kW (400-800A)
3. Help text explains where to find this (main breaker panel or utility bill)

---

### #26 & #27 - EV Charger Counts (No "None" Option)

**Problem:** Before asking for count, there's no way to say "none."

**Fix:** 
1. Changed from number input to select dropdown
2. First option is explicitly "None" with value 0
3. Clear descriptions for each option level

---

### #32 - Primary Energy Goal (Single Select)

**Problem:** What if they want multiple goals, or don't know?

**Fix:** Changed from `select` to `multiselect`:
- Users can select ALL applicable goals
- Added "Not sure yet" option for exploratory users
- Default selection: `["reduce_bills", "peak_shaving"]` (most common combo)

**Options:**
1. Reduce electricity bills
2. Reduce demand charges (peak shaving)
3. Backup power for outages
4. Support EV charging
5. Maximize solar investment
6. Sustainability / Green image
7. Qualify for rebates/incentives
8. Not sure yet

---

## Energy Calculation Logic Summary

The car wash energy estimation uses data from `carWashIndustryProfile.ts`:

```typescript
// Key formulas:
// Self-serve: 15,000 kWh/bay/year, 5 kW peak/bay
// Express tunnel: 3,000 kWh/ft/year, 2 kW peak/ft
// Full-service: 3,500 kWh/ft/year, 2.5 kW peak/ft

// Equipment additions:
// Electric water heater: +150,000 kWh/year, +100 kW peak
// Blower/dryer: +25 kW each
// Vacuum station: +5 kW each
// Reclaim system: +10 kW
```

**Operating Model Multipliers:**
- Attended: ×1.15 (lobby HVAC)
- Unattended: ×1.05 (security lighting)
- Hybrid: ×1.10

---

## Testing Checklist

After running migration:
- [ ] Verify all 32 car wash questions load correctly
- [ ] Test "Don't know" flow for peakDemand and gridCapacity
- [ ] Verify multiselect works for primaryBESSApplication
- [ ] Confirm EV charger dropdowns show "None" as first option
- [ ] Check that tunnel length dropdown covers 40-220 ft range
- [ ] Verify daily vehicles goes up to 1,500
- [ ] Confirm roof area options match car wash scale
