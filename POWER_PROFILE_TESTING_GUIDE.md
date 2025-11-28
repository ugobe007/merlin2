# Power Profile System - Quick Visual Guide

## 🎯 What You'll See When Testing

### 1. Enhanced Intro Screen

When you open the Smart Wizard, you'll see a NEW golden section introducing Power Profile:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ Introducing: Merlin Power Profile™                      │
│                                                             │
│  Our secret weapon for maximum savings! As you answer      │
│  questions, you'll earn points and level up from Level 1   │
│  to Level 7. Higher levels unlock:                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐            │
│  │ Levels   │  │ Levels   │  │ Levels 6-7   │            │
│  │ 1-2      │  │ 3-5      │  │ **ELITE**    │            │
│  │ Basic    │  │ Smart    │  │ 8-12% EXTRA  │            │
│  └──────────┘  └──────────┘  └──────────────┘            │
│                                                             │
│  💡 Pro Tip: Most users reach Level 5-6, but Level 7      │
│  gives you our absolute best pricing!                      │
└─────────────────────────────────────────────────────────────┘
```

### 2. Navigation Bar with Power Profile Indicator

Once you start the wizard (Step 1+), look at the top of the wizard - you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│  [Power Meter] │ ⚡⚡⚡○○○○ │  ⚡ 2.5 MW System             │
│  Status: OK    │ Level 3  │  [Generation Alert if needed]  │
└─────────────────────────────────────────────────────────────┘
```

**Power Meter** = Existing feature (shows if power is adequate)  
**⚡ Lightning Bolts** = NEW! Shows your current Power Profile level  
**System Size** = Your battery configuration

### 3. Level Progression Examples

As you fill out the wizard, watch the lightning bolts fill in:

**Start (Level 1):**
```
⚡○○○○○○  Beginner - 5 points
```

**After Step 1 (Industry + Building Info):**
```
⚡⚡○○○○○  Basic - 15 points
```

**After Step 2 (Grid Quality + Backup Needs):**
```
⚡⚡⚡○○○○  Smart - 35 points
```

**After Step 3 (Solar/EV Details):**
```
⚡⚡⚡⚡⚡○○  Expert - 55 points
```

**After Step 4 (Location + Rates):**
```
⚡⚡⚡⚡⚡⚡⚡  **ELITE** - 85 points
🎉 Maximum Level Achieved!
```

### 4. Point Breakdown (Debug Console)

Open browser console (F12) and you'll see detailed logging:

```javascript
🎯 Power Profile updated: {
  level: 3,
  points: 35,
  checks: 5
}
```

This shows:
- Current level (1-7)
- Total points earned (0-100)
- Number of criteria completed (0-14)

---

## 🧪 Testing Scenarios

### Scenario 1: Minimal Data (Level 1-2)

1. Open Smart Wizard
2. Select "Hotel" industry
3. Enter only: 100 rooms
4. Skip most optional questions
5. **Expected Result**: Level 1-2, ~10-15 points

### Scenario 2: Standard User (Level 3-4)

1. Open Smart Wizard
2. Select "Data Center"
3. Enter: Square footage, operating hours
4. Select grid connection type
5. Specify critical loads
6. **Expected Result**: Level 3-4, ~30-40 points

### Scenario 3: Power User (Level 5-6)

1. Open Smart Wizard
2. Select "EV Charging Station"
3. Enter: Building details, operating hours
4. Specify existing solar capacity (e.g., 50 kW)
5. Add EV charger counts
6. Select backup requirements
7. Choose primary energy goals
8. **Expected Result**: Level 5-6, ~60-70 points

### Scenario 4: Elite User (Level 7)

1. Complete all of Scenario 3, PLUS:
2. Provide precise location (city/state)
3. Enter actual electricity rate from utility bill
4. Specify installation space details
5. Add existing generator info (if applicable)
6. **Expected Result**: Level 7, ~85-100 points

---

## 🐛 Testing Checklist

### Session Persistence Fix
- [ ] Open wizard → Fill Step 1 → Close wizard
- [ ] Reopen wizard → **Step 1 should be EMPTY**
- [ ] Power Profile should show Level 1 (not previous level)

### Power Profile Indicator
- [ ] Appears in nav bar on Step 1+
- [ ] Shows correct number of lightning bolts
- [ ] Updates in real-time as you answer questions
- [ ] Colors match level (gray→blue→green→yellow→orange→purple→pink)

### NET Peak Demand (Existing Solar/EV Fix)
- [ ] Enter existing solar: 100 kW
- [ ] Battery recommendation DECREASES (solar offsets peak)
- [ ] Enter existing EV: 10 ports
- [ ] Battery recommendation INCREASES (EV adds load)
- [ ] Final calculation is: Base Peak + EV Load - Solar Offset

### Intro Screen
- [ ] Golden Power Profile section displays
- [ ] 3 benefit cards render
- [ ] "Pro Tip" callout visible
- [ ] Layout looks good on mobile

---

## 🎨 Color Reference

| Level | Name | Bolts | Color Gradient |
|-------|------|-------|----------------|
| 1 | Beginner | ⚡ | Gray |
| 2 | Basic | ⚡⚡ | Blue |
| 3 | Smart | ⚡⚡⚡ | Green |
| 4 | Advanced | ⚡⚡⚡⚡ | Yellow |
| 5 | Expert | ⚡⚡⚡⚡⚡ | Orange |
| 6 | Master | ⚡⚡⚡⚡⚡⚡ | Purple |
| 7 | **Elite** | ⚡⚡⚡⚡⚡⚡⚡ | **Pink→Purple→Indigo** |

---

## 📱 Mobile Responsiveness

Test on different screen sizes:

**Desktop (1920x1080):**
- Power Profile indicator next to Power Meter (horizontal layout)
- All lightning bolts visible

**Tablet (768px):**
- Compact view still readable
- May stack vertically below 768px

**Mobile (375px):**
- Lightning bolts scale down (14px instead of 16px)
- Text abbreviated if needed

---

## 🚀 Ready to Test!

**Start Dev Server:**
```bash
cd /Users/robertchristopher/merlin2
npm run dev
```

**Open Browser:**
```
http://localhost:5178
```

**Open Smart Wizard:**
1. Click "Start Smart Wizard" on landing page
2. OR click "New Quote" → "Smart Wizard"

**Watch for:**
- Golden intro section with Power Profile
- Lightning bolts in nav bar (Step 1+)
- Real-time updates as you answer questions
- Console logs showing level progression

---

## 💬 User Feedback Questions

After testing, consider:

1. **Is the Power Profile concept clear?**
   - Do users understand what it is?
   - Is the intro explanation sufficient?

2. **Is progression motivating?**
   - Do users want to reach higher levels?
   - Is Level 7 perceived as valuable?

3. **Is visual feedback effective?**
   - Are lightning bolts intuitive?
   - Do colors help communicate progress?

4. **Does it feel natural?**
   - Does gamification enhance or distract?
   - Is it integrated smoothly?

---

## 🎯 Success Criteria

**Minimum Viable Test:**
- ✅ Wizard opens without errors
- ✅ Power Profile indicator visible
- ✅ Level increases when data added
- ✅ Session resets properly

**Full Success:**
- ✅ All 14 criteria score correctly
- ✅ Visual design matches mockup
- ✅ Mobile responsive
- ✅ Positive user feedback

**Stretch Goals:**
- ✅ Analytics tracking hooked up
- ✅ Congratulations modal (Phase 2)
- ✅ Quote watermarks (Phase 2)

---

**Status**: 🟢 READY FOR USER TESTING

Go ahead and test! Open the wizard and watch your Power Profile level up! ⚡⚡⚡
