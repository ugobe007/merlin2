# Vineet Backtesting Feedback - January 3, 2026
## HOTELS

---

## PRIORITY 1: CRITICAL BUGS (Breaking functionality)

### Step 1 - Location
- [ ] Zipcode validation missing - "9999" or "8888" should not be allowed
- [ ] Home button not functional
- [ ] Remove "Start Over" button (takes to wrong page)
- [ ] International Countries/Cities database not included

### Step 3 - Energy Profile  
- [ ] Icons are WRONG:
  - Solar shows "X"
  - Generator shows "sun" 
  - Battery Storage shows "gas pump"
  - EV Chargers shows "Battery"
- [ ] Exterior loads selection NOT impacting energy calculation
- [ ] Covered garage icon incorrect

### Step 4 - Energy System
- [ ] Solar sizing NOT changing with room size changes
- [ ] Generator option missing (YES/NO flow)
- [ ] Generator size mismatch between Step 4 and Quote summary
- [ ] 100% coverage showing regardless of solar size (350kW or 2000kW both show 100%)

### Step 5 - Quote
- [ ] Clicking "Back" resets EV charger selections to 0
- [ ] Generator size mismatch from Step 4
- [ ] State credits not showing (CA, MA)

---

## PRIORITY 2: UX IMPROVEMENTS

### Step 2 - Industry
- [ ] Hotel category needs clearer selection confirmation (highlighted box)

### Step 3 - Energy Profile
- [ ] "Continue" button should be disabled until all selections complete
- [ ] Fonts too small throughout
- [ ] Room slider: Link scale to hotel type selected:
  - Budget: 50-100
  - Midscale: 50-200
  - Upper Midscale: 100-500
  - Luxury: 250-1000
- [ ] Double-click hint for direct number input not obvious
- [ ] Square footage title → "Estimated Square Footage"
- [ ] Meeting Spaces: Add quantity selector per room type
- [ ] Parking: Change "Street/Valet" to "Underground"
- [ ] Solar space: Multi-select not obvious, needs advisor hint
- [ ] Consistent gap/layout for Occupancy, Floors, Elevators

### Step 4 - Energy System
- [ ] Generator slider: 0-5000kW, switch to MW at 1000kW+
- [ ] Natural Gas line question (for generator)
- [ ] EV charging decimal precision (round to whole numbers)

### Step 5 - Quote
- [ ] Annual Savings and Payback side-by-side in option boxes
- [ ] State credit as line item below Federal ITC

---

## PRIORITY 3: ENHANCED FEATURES

### Right Side Energy Panel (Step 3)
- [ ] Show estimated energy COST (kWh × electricity rate from zipcode):
```
  Annual Energy: XXX,XXX kWh | $XXX,XXX
  Monthly Energy: X,XXX kWh | $X,XXX
```

### Top Bar Sticky
- [ ] Make top navigation bar static (doesn't scroll away)

### System Sizing Logic
- [ ] Solar should recalculate when EV charging added
- [ ] Generator sizing should adjust solar recommendation
- [ ] Show coverage % that changes with selections (not always 100%)
- [ ] Maximum system = 125% of needs (over-engineered buffer)
- [ ] Show kWh alongside kW

---

## COUNTS
- Priority 1 (Critical): ~12 items
- Priority 2 (UX): ~15 items  
- Priority 3 (Enhanced): ~7 items
- Total: ~34 items

