# Square Footage Field Verification Guide

## Current Status

The square footage input field **HAS BEEN ADDED** to the following use cases in `Step2_UseCase.tsx`:

1. ✅ **Hotel** (line 307-312)
2. ✅ **Data Center** (line 406-411) 
3. ✅ **Tribal Casino** (line 573-578)
4. ✅ **Logistics Center** (line 644-649)
5. ✅ **Shopping Center** (line 717-722)

## How to See the Changes

### Step 1: Open the Dev Server
The server is running on: **http://localhost:5179/**

### Step 2: Hard Refresh Your Browser
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R
- **Or**: Open in Incognito/Private window

### Step 3: Navigate to Hotel Use Case
1. Click "Get Started" or "Build Quote"
2. Select **"Hotel"** as the use case
3. On Step 2 (Use Case Details), you should see:

```
🏨 Hotel Facility Details

┌─────────────────────────────────────┐
│ How many rooms?                     │
│ [_______] rooms                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Facility square footage (optional)  │  ← NEW FIELD
│ [_______] sq ft                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Grid connection status?             │
│ [Select an option...        ▼]     │
└─────────────────────────────────────┘
```

## If You Still Don't See It

### Option A: Check Console for Errors
Open browser console (F12) and look for:
- React errors
- TypeScript compilation errors
- Component rendering issues

### Option B: Verify Build
Run this command to ensure latest code is built:
```bash
npm run build
npm run dev
```

### Option C: Check Which Port You're Viewing
Make sure you're on **http://localhost:5179/** (not 5177 or 5178)

## About "Office Building"

**Note:** There is NO "office building" use case in the system. 

Available use cases are:
- EV Charging
- Car Wash
- Hotel ✅ (has square footage)
- Data Center ✅ (has square footage)
- Hospital
- Airport
- Tribal Casino ✅ (has square footage)
- Logistics Center ✅ (has square footage)
- Shopping Center ✅ (has square footage)
- Gas Station
- Government Building (has square footage **dropdown** only)

The **Government Building** case has a "Building size" DROPDOWN with ranges:
- Micro (< 5,000 sq ft)
- Small (5,000-15,000 sq ft)
- Medium-Small (15,000-35,000 sq ft)
- Medium (35,000-75,000 sq ft)
- Large (> 75,000 sq ft)

This is **different** from the numeric INPUT field that allows you to type an exact square footage.

## Expected Behavior

### With Square Footage (Hotel Example)
```typescript
// User enters:
numRooms: 150
squareFootage: 25000  // ← NEW OPTIONAL FIELD

// Calculation prioritizes square footage:
if (squareFootage > 0) {
  power = (squareFootage * 9 W/sq ft) / 1,000,000
  // 25,000 * 9 = 225,000 W = 225 kW = 0.225 MW
} else {
  power = numRooms * 2.93 kW/room
  // 150 * 2.93 = 439.5 kW = 0.44 MW
}
```

### Without Square Footage
```typescript
// User enters:
numRooms: 150
squareFootage: (empty)  // ← OPTIONAL, LEFT BLANK

// Falls back to room count:
power = numRooms * 2.93 kW/room = 0.44 MW
```

## Testing Checklist

- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Open http://localhost:5179/
- [ ] Click "Get Started" / "Build Quote"
- [ ] Select "Hotel" use case
- [ ] See "Facility square footage (optional)" input field
- [ ] Enter value (e.g., 25000)
- [ ] Click "Continue" to see AI recommendation
- [ ] Check if power calculation uses square footage

## Need More Use Cases with Square Footage?

If you want to add square footage to:
- **Hospital** - Add W/sq ft = 10 (medical equipment, HVAC)
- **Airport** - Add W/sq ft = 12 (lighting, baggage, climate)
- **Gas Station** - Add W/sq ft = 15 (refrigeration, pumps, lights)

Let me know which ones you need and I'll add them!
