# Complete Use Case Template Testing

**Date:** November 17, 2025  
**Server:** http://localhost:5178  
**Purpose:** Systematically test ALL use cases to verify template loading and calculations

---

## Quick Test Checklist

For each use case below:
1. ✅ Clear console (Cmd+K)
2. ✅ Refresh page
3. ✅ Start Smart Wizard → Select use case
4. ✅ Check console for: `[UseCaseQuestionService] Found template: X with N questions`
5. ✅ Verify UI shows template questions (NOT fallback "Facility size / Peak load / Operating hours")
6. ✅ Fill out with test data
7. ✅ Verify calculation makes sense
8. ✅ Mark status below

---

## Test Results

### 1. 🚗 Car Wash
- **Step1 ID**: `car-wash` → **Template**: `car-wash` ✅
- **Questions**: num_bays, cars_per_day, has_detailing (3 total)
- **Test**: 4 bays, 100 cars/day, detailing
- **Expected**: ~0.11 MW (4×25kW + 10kW detailing)
- **Status**: ⏳ PENDING

### 2. ⚡ EV Charging  
- **Step1 ID**: `ev-charging` → **Template**: `ev-charging` ✅
- **Questions**: Charger configuration (Level 2, DC Fast, etc.)
- **Status**: ⏳ PENDING

### 3. 🏥 Hospital
- **Step1 ID**: `hospital` → **Template**: `hospital` ✅
- **Status**: ⏳ PENDING

### 4. 🌱 Indoor Farm
- **Step1 ID**: `indoor-farm` / `agriculture` → **Template**: `indoor-farm` ✅
- **Questions**: cultivationArea, growingSystem, cropTypes, automationLevel (4 total)
- **Test**: 10,000 sq ft, vertical hydroponic, leafy greens, fully automated
- **Expected**: ~0.4 MW (10,000 × 0.040 kW/sqft)
- **Status**: ⏳ PENDING

### 5. 🏨 Hotel
- **Step1 ID**: `hotel` → **Template**: `hotel` ✅
- **Questions**: 13 total including numberOfRooms, hasRestaurant (powerKw), amenitiesOffered (multiselect powerKw), evChargingPorts (additionalLoadKw)
- **Test**: 400 rooms, full kitchen, pool+fitness, 20 EV ports
- **Expected**: ~1.57 MW (1.17 base + 0.40 amenities)
- **Status**: ⏳ PENDING

### 6. ✈️ Airport
- **Step1 ID**: `airport` → **Template**: `airport` ✅
- **Status**: ⏳ PENDING

### 7. 🎓 College
- **Step1 ID**: `college` → **Template**: `college-university` ⚠️
- **Mapping Issue**: Needs `'college': 'college-university'` in TEMPLATE_SLUG_MAP
- **Status**: ⏳ PENDING - **WILL FAIL**

### 8. 🦷 Dental Office
- **Step1 ID**: `dental-office` → **Template**: `dental-office` ✅
- **Status**: ⏳ PENDING

### 9. 🏢 Office Building
- **Step1 ID**: `office` → **Template**: `office-building` ✅ FIXED
- **Questions**: Should see office-specific questions (NOT fallback)
- **Status**: ⏳ PENDING

### 10. 🖥️ Data Center
- **Step1 ID**: `datacenter` → **Template**: `data-center` ✅
- **Status**: ⏳ PENDING

### 11. 🏘️ Apartments
- **Step1 ID**: `apartment` → **Template**: `apartments` ✅
- **Questions**: 14 total including units, housing type, amenities, EV, solar
- **Status**: ⏳ PENDING

### 12. 🛒 Shopping Center
- **Step1 ID**: `retail` → **Template**: `shopping-center` ✅ FIXED
- **Questions**: Should see retail-specific questions (NOT fallback)
- **Status**: ⏳ PENDING

### 13. 🏭 Manufacturing
- **Step1 ID**: `manufacturing` → **Template**: ??? ⚠️
- **Status**: ⏳ PENDING - **MAY FAIL**

### 14. 📦 Warehouse
- **Step1 ID**: `warehouse` → **Template**: ??? ⚠️
- **Status**: ⏳ PENDING - **MAY FAIL**

---

## Known Issues to Fix

### 🔴 CRITICAL: College Mapping
```typescript
// Add to useCaseQuestionService.ts TEMPLATE_SLUG_MAP:
'college': 'college-university',
```

### ⚠️ UNKNOWN: Check if these have templates
- manufacturing
- warehouse  
- tribal-casino
- logistics-center
- gas-station
- government

---

## Test Protocol

### What to Look For in Console:

✅ **SUCCESS Pattern:**
```
[UseCaseQuestionService] Looking for template: "car-wash" → normalized: "car-wash"
[UseCaseQuestionService] Found template: Car Wash with 3 questions
[UseCaseQuestionService] Questions: ['num_bays', 'cars_per_day', 'has_detailing']
```

❌ **FAILURE Pattern:**
```
[UseCaseQuestionService] Template not found: xyz, using fallback questions
```

### What to Look For in UI:

✅ **SUCCESS**: Use case-specific questions
- Car wash: "How many wash bays?"
- Hotel: "How many guest rooms?" with 13 detailed questions
- Farm: "Total cultivation area (square footage)"

❌ **FAILURE**: Generic fallback questions
- "Facility size?" (dropdown)
- "Estimated peak load?" (MW input)
- "Operating hours per day?" (hours input)

---

## Results Summary

**Total Use Cases**: 14  
**Tested**: 0  
**Passed**: 0  
**Failed**: 0  
**Blocked (missing templates)**: Unknown  

---

## Next Steps

1. Fix college mapping issue first
2. Test systematically starting with car wash
3. Document any failures
4. Create templates for missing use cases if needed
5. Update test results as you go
