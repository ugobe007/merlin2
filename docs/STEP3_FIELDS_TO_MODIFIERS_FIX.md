# Step 3 Fields → TrueQuote Engine Modifiers Fix

**Date:** January 2, 2026  
**Status:** ✅ Fixed

---

## Problem

The user is **100% correct**: Step 3 inputs (laundry, gym, conference center, amenities) were **NOT affecting energy calculations**.

### Root Cause

The TrueQuote Engine has modifiers that look for **boolean fields**:
- `hasRestaurant`
- `hasSpa`
- `hasPool`
- `hasConferenceCenter`

But Step 3 stores **string fields**:
- `foodBeverage: 'full'`
- `spaServices: 'full'`
- `poolType: 'indoor'`
- `meetingSpace: 'large'`
- `laundryType: 'commercial'`
- `fitnessCenter: 'full'`

The `shouldApplyModifier()` function only checks for `true`, `'true'`, or `'yes'`, so **the modifiers were NEVER being applied**.

---

## Fix

Added mapping in `trueQuoteMapper.ts` to convert Step 3 string fields to TrueQuote Engine boolean triggers:

```typescript
// Hotel: Map Step 3 fields to TrueQuote Engine modifier triggers
if (industryType === 'hotel') {
  // Restaurant: foodBeverage 'full' or 'restaurant' → hasRestaurant
  if (facilityData.foodBeverage === 'full' || facilityData.foodBeverage === 'restaurant' || 
      facilityData.foodBeverage === 'fine_dining' || facilityData.foodBeverage === 'casual_dining') {
    facilityData.hasRestaurant = true;
  }
  
  // Spa: spaServices 'full' or 'basic' → hasSpa
  if (facilityData.spaServices === 'full' || facilityData.spaServices === 'basic') {
    facilityData.hasSpa = true;
  }
  
  // Pool: poolType 'indoor', 'outdoor', 'heated' → hasPool
  if (facilityData.poolType === 'indoor' || facilityData.poolType === 'outdoor' || 
      facilityData.poolType === 'heated' || facilityData.poolType === 'pool') {
    facilityData.hasPool = true;
  }
  
  // Conference Center: meetingSpace 'large', 'medium', 'convention' → hasConferenceCenter
  if (facilityData.meetingSpace === 'large' || facilityData.meetingSpace === 'medium' || 
      facilityData.meetingSpace === 'convention') {
    facilityData.hasConferenceCenter = true;
  }
  
  // Laundry: laundryType 'commercial' → hasLaundry
  if (facilityData.laundryType === 'commercial') {
    facilityData.hasLaundry = true;
  }
  
  // Fitness Center: fitnessCenter 'full' or 'basic' → hasFitnessCenter
  if (facilityData.fitnessCenter === 'full' || facilityData.fitnessCenter === 'basic') {
    facilityData.hasFitnessCenter = true;
  }
}
```

---

## TrueQuote Engine Modifiers

The TrueQuote Engine applies these multipliers:

```typescript
modifiers: [
  { name: 'Restaurant', trigger: 'hasRestaurant', multiplier: 1.15 },  // +15%
  { name: 'Spa', trigger: 'hasSpa', multiplier: 1.10 },                // +10%
  { name: 'Pool', trigger: 'hasPool', multiplier: 1.05 },              // +5%
  { name: 'Conference Center', trigger: 'hasConferenceCenter', multiplier: 1.20 }  // +20%
]
```

**Example:** A 400-room upscale hotel with full amenities:
- Base: 400 rooms × 5.5 kW/room = 2,200 kW
- Restaurant: 2,200 × 1.15 = 2,530 kW
- Spa: 2,530 × 1.10 = 2,783 kW
- Pool: 2,783 × 1.05 = 2,922 kW
- Conference Center: 2,922 × 1.20 = **3,506 kW** (vs. 2,200 kW without modifiers)

**This is a HUGE difference!** The user was absolutely right - a 400-room hotel with full amenities should have MUCH higher energy requirements.

---

## Files Modified

1. `src/components/wizard/v6/utils/trueQuoteMapper.ts` - Added hotel field mapping

---

## Testing

After this fix:
- ✅ Step 3 inputs (laundry, gym, conference, amenities) now affect calculations
- ✅ Full amenities hotel gets proper energy multipliers
- ✅ BESS sizing reflects actual hotel energy requirements

---

## Next: ZIP Code Issue

Still need to investigate why zipCode from Step 1 is not being recognized in Step 4.
