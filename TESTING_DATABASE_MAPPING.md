# Database Question Mapping - Testing Guide

## What Was Fixed

1. **Slug Normalization**: Now tries multiple slug formats (dash vs underscore)
   - `data_center` → tries `data_center`, `data-center`, `data_center`
   - `data-center` → tries `data-center`, `data-center`, `data_center`

2. **Better Error Handling**: Shows "Questions Not Available" instead of wrong questions

3. **Enhanced Logging**: Detailed console logs show exactly what's happening

## How to Test

### Step 1: Open Browser Console
- Open DevTools (F12 or Cmd+Option+I)
- Go to **Console** tab
- Keep it visible while testing

### Step 2: Test Each Industry

#### Test Cases to Run:

1. **Data Center** (the bug you found)
   - Step 2: Select "Data Center"
   - Step 3: Check console logs
   - ✅ Should see: `✅ SUCCESS: Loaded X questions from database`
   - ✅ Should see: `Use Case: "data-center"` (or "data_center")
   - ✅ Questions should be about data centers (racks, PUE, uptime tier, etc.)

2. **Car Wash**
   - Step 2: Select "Car Wash"
   - Step 3: Check console logs
   - ✅ Should see car wash questions (tunnel type, bays, pumps, etc.)

3. **Truck Stop**
   - Step 2: Select "Truck Stop / Travel Center"
   - Step 3: Check console logs
   - ✅ Should see truck stop questions (MCS chargers, DCFC, service bays, etc.)

4. **Hotel**
   - Step 2: Select "Hotel / Hospitality"
   - Step 3: Check console logs
   - ✅ Should see hotel questions (rooms, amenities, etc.)

5. **EV Charging**
   - Step 2: Select "EV Charging Hub"
   - Step 3: Check console logs
   - ✅ Should see EV charging questions (charger types, count, etc.)

6. **Office**
   - Step 2: Select "Office Building"
   - Step 3: Check console logs
   - ✅ Should see office questions (square footage, occupancy, etc.)

### Step 3: What to Look For in Console

#### ✅ Success Logs:
```
📋 ========================================
📋 STEP 3: Loading Questions
📋 ========================================
📋 Industry from state: "data_center"
🔍 Trying slug variants: "data_center", "data-center", "data_center"
   🔎 Attempting: "data_center"...
   ✅ FOUND! "data-center" has 18 questions

✅ SUCCESS: Loaded 18 questions from database
✅ Use Case: "data-center" (Data Center)
✅ First question: "Data center tier classification"
📋 ========================================
```

#### ❌ Failure Logs (if questions don't exist):
```
⚠️  ========================================
⚠️  WARNING: No Database Questions Found
⚠️  ========================================
⚠️  Industry: "some_industry"
⚠️  Tried slugs: "some_industry", "some-industry"
⚠️  Checking fallback config files...
❌ No questions available for industry: "some_industry"
❌ Please check:
   1. Does use case "some_industry" exist in database?
   2. Does it have custom_questions?
   3. Is the slug format correct?
```

### Step 4: Verify Questions Match Industry

For each industry, verify the questions make sense:

- **Data Center**: Should ask about racks, PUE, uptime tier, cooling, UPS
- **Car Wash**: Should ask about tunnel type, bays, pumps, brushes, blowers
- **Truck Stop**: Should ask about MCS chargers, DCFC, service bays, truck wash
- **Hotel**: Should ask about rooms, amenities, restaurants, spa
- **EV Charging**: Should ask about charger types, count, power levels
- **Office**: Should ask about square footage, occupancy, HVAC

### Step 5: Report Issues

If you find any mismatches:

1. **Note the industry** that's wrong
2. **Copy the console logs** (the full block)
3. **Note what questions you're seeing** vs what you expect
4. **Check the database slug** - what slug format does the database use?

## Quick Debug Commands

If you want to check the database directly:

```sql
-- Check what slugs exist in database
SELECT slug, name, is_active 
FROM use_cases 
WHERE is_active = true 
ORDER BY display_order;

-- Check questions for a specific use case
SELECT 
  uc.slug,
  uc.name,
  COUNT(cq.id) as question_count
FROM use_cases uc
LEFT JOIN custom_questions cq ON uc.id = cq.use_case_id
WHERE uc.slug IN ('data-center', 'data_center', 'car-wash', 'car_wash')
GROUP BY uc.slug, uc.name;
```

## Expected Results

After the fix:
- ✅ Data Center should load data center questions
- ✅ All industries should load their correct questions
- ✅ Console logs should clearly show which slug worked
- ✅ If questions don't exist, should show helpful error message
