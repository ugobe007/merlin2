# Root Cause Analysis: Missing roomCount

## Problem
TrueQuote Engine returns 0 kW because `roomCount` is missing from `facilityData`, even though:
1. ✅ `roomCount` question exists in database (field_name: 'roomCount', is_required: true)
2. ✅ `Step3HotelEnergy` renders the roomCount slider (lines 511-519)
3. ❌ `roomCount` is NOT in `useCaseData` when reaching Step 5

## Why This Happens

### Step3HotelEnergy Logic
1. Line 195: `answers` state initialized from `state.useCaseData || {}` (starts empty if no previous data)
2. Lines 211-223: Sets defaults from database questions AFTER fetching
3. Lines 231-239: Syncs `answers` to `useCaseData` via `useEffect(() => {...}, [answers])`

### The Issue
The defaults ARE being set, but:
- If user hasn't interacted with the slider, and default isn't properly initialized, it won't sync
- The sync happens on `answers` changes, but if default isn't set correctly, it won't trigger

## Solution

**Each industry MUST capture foundational variables from the user:**

| Industry | Foundational Variable | Why Critical |
|----------|----------------------|--------------|
| Hotel | `roomCount` | Foundation for all energy calculations - 150 rooms vs 350 rooms = 2.3x difference |
| Car Wash | `bayCount` / `tunnelCount` | Determines equipment load and peak demand |
| Data Center | `rackCount` / `itLoadKW` | IT load drives all power calculations |
| Hospital | `bedCount` | Bed count determines base load, critical for backup sizing |
| EV Charging | `level2Count`, `dcFastCount` | Charger count × power = total demand |
| Apartment | `unitCount` | Number of units drives base load |
| Warehouse | `warehouseSqFt` | Square footage determines lighting/HVAC load |
| Manufacturing | `facilitySqFt` or production metrics | Size drives all facility systems |

## Action Items

1. ✅ Remove default workaround (DONE - will error if missing)
2. ⏳ Ensure Step3HotelEnergy properly initializes roomCount from database default_value
3. ⏳ Verify roomCount question exists with is_required=true
4. ⏳ Audit all industries to ensure foundational variables are captured
5. ⏳ Make foundational variables prominent/required in UI

## User's Valid Point

**"A 350-room hotel needs accurate calculations - we can't default to 150 rooms!"**

- Saudi Arabia hotels are HUGE (500+ rooms common)
- Defaulting silently gives wrong quotes
- Users MUST provide actual values
- Foundation variables are in industry templates - we need to capture them
