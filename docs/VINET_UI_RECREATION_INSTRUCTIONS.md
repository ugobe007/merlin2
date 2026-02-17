# Merlin Energy Advisor - UI Recreation Instructions

## Overview
This document provides complete instructions to recreate the Merlin Energy Advisor two-step wizard interface. The application is a single HTML file with embedded CSS and JavaScript that guides users through selecting their business location (Step 1) and energy goals (Step 2).

---

## GLOBAL DESIGN SPECIFICATIONS

### Color Palette
```
Primary Background:     #070a11 (very dark blue-black)
Secondary Background:   #0c1019 (slightly lighter dark)
Primary Purple:         #7c3aed (main accent)
Dark Purple:            #5b21b6 (gradient end)
Primary Green:          #22c55e (success/selected)
Dark Green:             #16a34a (gradient end)
Yellow/Warning:         #fbbf24
Orange:                 #f97316 (Start Over button)
Red:                    #ef4444 (required asterisk)
Blue:                   #3b82f6

Text Colors:
- White:                #fff
- Light Gray:           #e2e8f0 (labels)
- Medium Gray:          #94a3b8 (secondary text)
- Dark Gray:            #64748b (muted text)
- Light Slate:          #cbd5e1 (comment text)

Transparency Patterns:
- rgba(124,58,237,0.08) - purple tint background
- rgba(124,58,237,0.15) - purple fill
- rgba(124,58,237,0.2)  - purple hover/selected
- rgba(124,58,237,0.3)  - purple border
- rgba(124,58,237,0.4)  - purple strong border
- rgba(34,197,94,0.08)  - green tint background
- rgba(34,197,94,0.15)  - green badge background
- rgba(34,197,94,0.2)   - green selected
- rgba(34,197,94,0.4)   - green border
- rgba(255,255,255,0.03) - subtle white tint
- rgba(255,255,255,0.06) - light border
- rgba(255,255,255,0.08) - divider lines
```

### Typography
```
Primary Font:    'Inter', system-ui, sans-serif
Monospace Font:  'JetBrains Mono', monospace (for ZIP code input)

Font Import:
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap

Font Sizes:
- 26px: ZIP code input
- 22px: Large metric values, large icons
- 20px: Section header icons
- 18px: Section titles, main headers
- 16px: Goal card titles, metric values
- 15px: Body text, labels
- 14px: Button text, badges
- 13px: Comments, secondary badges
- 12px: Small labels, descriptions
- 11px: Step indicators, tiny labels
- 10px: Micro labels, checkmarks
- 9px: Tiny badges
```

### Border Radius
```
- 14px: Large cards (MerlinAI Assessment)
- 12px: Medium cards, buttons, inputs
- 10px: Small cards, icon containers
- 8px: Goal analysis boxes
- 6px: Badges, small elements
- 5px: Metric boxes, checkboxes
- 50%: Circular avatars
```

### Shadows & Effects
```css
/* Pulsate Animation for MerlinAI Assessment boxes */
@keyframes pulsate {
  0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  50% { box-shadow: 0 0 20px 5px rgba(124,58,237,0.3); }
  100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
}
.assessment-pulsate {
  animation: pulsate 2s ease-in-out infinite;
}
```

---

## PAGE STRUCTURE

### Overall Layout
- Full viewport height (100vh)
- No scrolling on body (overflow:hidden)
- Flexbox column layout
- Background: linear-gradient(135deg, #070a11 0%, #0c1019 100%)

### Main Sections
1. **Top Navigation Bar** (fixed height, flex-shrink:0)
2. **Main Content Area** (flex:1, two-column grid)
3. **Bottom Navigation** (fixed position)

---

## TOP NAVIGATION BAR

### Structure
```
[Merlin Home 🏠] [Start Over ↻]     [Location][Goals][Industry][Details][Options][System][Quote]     Step X of 7
```

### Specifications
- Padding: 10px 24px
- Border-bottom: 1px solid rgba(255,255,255,0.06)
- Display: flex, justify-content: space-between

### Left Side
1. **Merlin Home Button**
   - Icon container: 36x36px, border-radius:10px, background:#fff
   - Icon: 🏠 (18px)
   - Label: "Merlin Home" (14px, font-weight:600, color:#fff)

2. **Start Over Button**
   - Icon container: 36x36px, border-radius:10px, background:rgba(249,115,22,0.15)
   - Icon: ↻ (16px, color:#f97316)
   - Label: "Start Over" (14px, font-weight:600, color:#f97316)

### Center - Step Navigation
- Display: flex, gap:4px
- Each step pill: padding:6px 14px, border-radius:6px, font-size:11px
- States:
  - Completed: background:rgba(34,197,94,0.15), color:#22c55e, shows "✓"
  - Active: background:#7c3aed, color:#fff, font-weight:500
  - Inactive: color:#475569

### Right Side
- "Step X of 7" label: font-size:12px, color:#64748b

---

## STEP 1: LOCATION PAGE

### Left Column - "Your Location"

#### Section Header
- Icon container: 50x50px, border-radius:50%, 
  background: linear-gradient(135deg,rgba(124,58,237,0.2),rgba(124,58,237,0.1))
  border: 2px solid rgba(124,58,237,0.4)
- Icon: 📍 (26px)
- Title: "Your Location" (18px, font-weight:600)
- Subtitle: "Find your business" (12px, color:#64748b)

#### Region Toggle (US/Intl)
- Container: background:rgba(255,255,255,0.04), border-radius:12px, padding:4px
- Active button (US): 
  - background: linear-gradient(135deg,#22c55e,#16a34a)
  - color:#fff, font-weight:600
  - Icon: 🇺🇸 (22px)
- Inactive button (Intl):
  - background:transparent, color:#64748b
  - Icon: 🌐 (22px)

#### ZIP Code Input
- Label: "ZIP Code" (11px, uppercase, letter-spacing:0.5px, color:#e2e8f0)
- Input: 
  - font-family: 'JetBrains Mono'
  - font-size:26px, font-weight:600
  - text-align:center, letter-spacing:8px
  - background:rgba(124,58,237,0.08)
  - border:2px solid rgba(124,58,237,0.3)
  - border-radius:12px
  - color:#94a3b8
  - Default value: "89052"

#### Business Name Input
- Label: "Business Name" with red asterisk (*)
- Input: padding:12px 16px, font-size:14px
- Same purple background/border as ZIP
- Default value: "Wow Carwash"

#### Street Address Input
- Label: "Street Address" with "(optional)" suffix
- Optional text: font-size:9px, color:#64748b
- border:1px (thinner than required fields)
- Default value: "3405 St Rose Pkwy"

#### Find My Business Button
- Full width, padding:14px
- background: linear-gradient(135deg,#7c3aed,#5b21b6)
- border-radius:12px
- font-size:15px, font-weight:600
- Includes search icon (SVG, 18x18px)
- Helper text below: "🧙 Merlin will identify your business..."

#### Business Confirmed Card
- background:rgba(34,197,94,0.08)
- border:1px solid rgba(34,197,94,0.2)
- border-radius:12px, padding:20px
- height:280px (fixed)
- Contains:
  - Photo placeholder: 80x60px, gradient background
  - Business name: "Wow Carwash" (20px, font-weight:600)
  - Industry badge: "Car Wash ✓" (purple badge)
  - Address with 📍 icon
  - "Not your business?" link at bottom

### Right Column - "Merlin AI Energy Advisor"

#### Advisor Header
- Avatar: 50x50px circular
  - background: linear-gradient(135deg,#1e293b,#334155)
  - border:2px solid rgba(124,58,237,0.4)
  - Icon: 🧙 (26px)
  - Green dot indicator: 12x12px, background:#22c55e, bottom-right

- Title: "Merlin AI Energy Advisor" (18px, font-weight:600)
- Subtitle: "✨ Welcome! I'm MerlinAI..." (11px, color:#94a3b8)

#### Location Analysis Section
- Header: 🔍 "Location Analysis" with "Henderson, NV" badge (yellow)
- 4-column grid of metrics:
  1. Peak Sun: 6.4 hrs/day (color:#f59e0b)
  2. Electricity Rate: $0.09 per kWh (color:#22c55e)
  3. Weather Risk: Low (green background)
  4. Solar Grade: A Excellent (color:#f59e0b)

#### Weather Risk Assessment Section
- Header: ⛈️ "Location Weather Risk Assessment"
- 5x3 grid of weather icons with risk levels:
  - Row 1: Thunder(Low), Tornado(Low), Hurricane(Low), Wind(Low), Lightning(Low)
  - Row 2: Heat(High-red), Cold(Low), Ice(Low), Blizzard(Low), Drought(Med-yellow)
  - Row 3: Rain(Low), Flood(Low), Hail(Low), Wildfire(Med), Tsunami(Low)
- Risk colors: Low=#22c55e, Med=#f59e0b, High=#ef4444

#### MerlinAI Assessment Box (PULSATING)
- **PURPLE FILL**: background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(124,58,237,0.05))
- border:1px solid rgba(124,58,237,0.3)
- border-radius:14px, padding:10px 18px
- **HAS .assessment-pulsate CLASS** (always on when business identified)
- Rows (padding:8px 0 each):
  1. ☀️ Sun Exposure → "Excellent" (green badge)
  2. ⚡ Electricity Rates → "Competitive" (green badge)
  3. 🌤️ Weather Risk → "Low" (green badge)
  4. 🎯 System Configuration → "BESS + Solar" (green gradient badge)
  5. 💬 Comment section

---

## STEP 2: GOALS PAGE

### Left Column - "Let's Select your Goals for your Facility"

#### Section Header
- Same circular icon style as Step 1 but with 🎯 icon
- Title: "Let's Select your Goals for your Facility" (16px)
- Subtitle: "(Min. 1, Max 6)" (11px, color:#64748b)

#### Goal Cards Grid
- Display: grid
- grid-template-columns: 1fr 1fr
- grid-template-rows: 1fr 1fr 1fr
- gap: 10px

#### Individual Goal Card Structure
- border-radius:12px, padding:14px
- Display: flex, flex-direction:column
- Hover: transform:translateY(-2px)

**Selected State:**
- background: linear-gradient(135deg,rgba(34,197,94,0.2),rgba(34,197,94,0.08))
- border:2px solid rgba(34,197,94,0.4)

**Unselected State:**
- background: linear-gradient(135deg,rgba(30,41,59,0.8),rgba(51,65,85,0.4))
- border:2px solid rgba(255,255,255,0.08)

#### Goal Card Content (Vertically Centered)
- Icon: 44px, margin-bottom:10px
- Title: 16px, font-weight:600, color:#fff
- Description: 12px, color:#94a3b8
- Check indicator at bottom:
  - Selected: green checkbox with "Selected" text
  - Unselected: empty box with "Click to select" text

#### The 6 Goals (with default selections)
1. 💰 **Reduce Energy Costs** [SELECTED BY DEFAULT]
   - "Lower electricity bills with optimized energy"
2. 🔋 **Backup Power** [SELECTED BY DEFAULT]
   - "Keep business running during outages"
3. 🌱 **Sustainability**
   - "Reduce carbon footprint and go green"
4. ⚡ **Energy Independence**
   - "Reduce reliance on the grid"
5. 📉 **Peak Demand Shaving**
   - "Reduce demand charges during peak hours"
6. 📈 **Generate Revenue**
   - "Earn from grid services and arbitrage"

### Right Column - "Merlin AI Energy Advisor"

#### Advisor Header (Smaller than Step 1)
- Avatar: 44x44px
- Title: 16px
- Subtitle: "✨ Analyzing your goals..."

#### Location Summary Box
- **PURPLE BACKGROUND**: rgba(124,58,237,0.08)
- border:1px solid rgba(124,58,237,0.2)
- Shows: Photo placeholder, "Wow Carwash", "Henderson, NV 89052", "Car Wash" badge
- "✓ Confirmed" badge in green

#### Goals Analysis Potential Section
- Header: 🔍 "Goals Analysis Potential"
- 2x3 grid of goal metric boxes
- Each box shows 3 metrics for that goal

**Goal Metrics Data:**
```
Cost Reduction:  25-35% Savings, $18K Annual, 4.2yr Payback (green)
Backup Power:    8 hrs Runtime, 100% Coverage, <10ms Switch (purple)
Sustainability:  45% CO₂ Cut, 120T Tons/Yr, A+ Rating (green)
Independence:    60% Self-Pwr, Yes Resilient, 24/7 Autonomy (yellow)
Peak Shaving:    30% Peak Cut, $8K Savings, Smart Mgmt (blue)
Revenue:         $5K Grid Svc, $3K Arbitrage, $8K Total/Yr (teal)
```

**Selected boxes:** Full opacity, colored values, gradient background
**Unselected boxes:** 35% opacity, gray values

#### MerlinAI Assessment Box (PULSATING when goals selected)
- **PURPLE FILL**: same as Step 1
- **HAS .assessment-pulsate CLASS when selectedCount >= 1**

**Dynamic Compatibility Ratings:**
| Goals | Rating | Color |
|-------|--------|-------|
| 0 | Select Goals | #64748b (gray) |
| 1 | Basic | #94a3b8 (light gray) |
| 2 | Good | #fbbf24 (yellow) |
| 3 | Very Good | #22c55e (green) |
| 4 | Great | #22c55e (green) |
| 5 | Excellent | #22c55e (green) |
| 6 | Outstanding | green gradient, white text |

**Dynamic ROI Ratings:**
| Goals | Rating | Color |
|-------|--------|-------|
| 0 | — | #64748b |
| 1-2 | Moderate | #fbbf24 |
| 3-4 | High | #22c55e |
| 5-6 | Very High | #22c55e |

**Dynamic System Recommendations:**
- Backup + (Sustain OR Independence) → "BESS + Solar"
- Backup only → "BESS"
- Sustain OR Independence only → "Solar + BESS"
- Default → "BESS + Solar"

**Dynamic Comments:**
| Goals | Comment |
|-------|---------|
| 0 | "Select your energy goals to see personalized recommendations." |
| 1 | "Add more goals to maximize your energy solution benefits." |
| 2-3 | "Good selection! Consider additional goals for optimal ROI." |
| 4+ | "Your goals align perfectly with a BESS + Solar solution..." |

---

## BOTTOM NAVIGATION

### Structure (Fixed Position)
```
[← Back]                    [Step Dots]                    [Continue →]
```

### Back Button (bottom:12px, left:24px)
- padding:14px 40px
- background:rgba(255,255,255,0.05)
- border:1px solid rgba(255,255,255,0.1)
- border-radius:12px
- color:#94a3b8
- Dynamic text: "← Back to [Previous Step Name]"

### Continue Button (bottom:12px, right:24px)
- padding:14px 40px
- background: linear-gradient(135deg,#7c3aed,#5b21b6)
- border-radius:12px
- color:#fff
- Dynamic text: "Continue to [Next Step Name] →"

### Step Indicator (bottom:12px, centered)
- 7 dots: 32x3px each, border-radius:2px, gap:4px
- Completed: background:#22c55e
- Current: background:#7c3aed
- Future: background:rgba(255,255,255,0.1)
- Label below: "Step X of 7" (11px, color:#64748b)

---

## JAVASCRIPT FUNCTIONALITY

### Navigation Functions
```javascript
goToStep(step)    // Navigate to specific step
goBack()          // Go to previous step
goNext()          // Go to next step
updateUI()        // Update all dynamic elements
```

### Goal Functions
```javascript
toggleGoal(card)           // Toggle goal selection
updateCheckIndicator(card) // Update checkbox visual
updateGoalAnalysis()       // Rebuild goal analysis grid
updateAssessment()         // Update MerlinAI ratings
```

### State Variables
```javascript
let currentStep = 1;
const totalSteps = 7;
const stepNames = ['Location', 'Goals', 'Industry', 'Details', 'Options', 'System', 'Quote'];
```

---

## KEY IMPLEMENTATION NOTES

1. **Single HTML File**: All CSS and JS are embedded inline
2. **No External Dependencies**: Only Google Fonts
3. **Responsive Grid**: Uses CSS Grid for layouts
4. **Smooth Transitions**: 0.2s transitions on interactive elements
5. **Pulsate Effect**: Purple glow animation on assessment boxes
6. **Dynamic Content**: Goal analysis grid rebuilds on each selection change
7. **State Persistence**: Currently no persistence (resets on refresh)

---

## FILE STRUCTURE

```
merlin-energy-advisor.html    # Complete single-file application
MERLIN-UI-INSTRUCTIONS.md     # This documentation file
```

---

## QUICK START

1. Open `merlin-energy-advisor.html` in a browser
2. Step 1 shows Location page with pre-filled demo data
3. Click "Continue to Goals →" to proceed
4. Click goal cards to toggle selection
5. Watch MerlinAI Assessment update dynamically
6. Use navigation to move between steps

---

## EMOJIS USED

```
🏠 Home           📍 Location        🎯 Target/Goals
🧙 Wizard/Merlin  ↻ Refresh         ✓ Checkmark
🇺🇸 US Flag       🌐 Globe           ✨ Sparkles
🔍 Search         ☀️ Sun             ⚡ Lightning
🌤️ Weather        💬 Comment         💰 Money
🔋 Battery        🌱 Plant           📉 Chart Down
📈 Chart Up       📊 Analytics

Weather Icons:
🌩️ Thunder  🌪️ Tornado  🌀 Hurricane  💨 Wind
🔥 Fire/Heat  🥶 Cold  🧊 Ice  ❄️ Blizzard
🏜️ Desert/Drought  🌧️ Rain  🌊 Flood/Tsunami  🌨️ Hail
```

---

## DESIGN CONCERNS & NOTES

**User Feedback:**
- Design may be "TOO BUSY" - needs simplification
- Vineet is not experienced with web-based UI/UX
- Need to discuss best approach before implementation

**Potential Issues:**
1. **Information Overload**: 
   - Weather Risk Assessment (15 icons in 3 rows) may be overwhelming
   - Multiple sections in right column competing for attention
   - Pulsating animations may be distracting

2. **Visual Hierarchy**:
   - Too many competing visual elements (badges, icons, gradients)
   - Assessment box pulsation may draw attention away from primary actions

3. **Cognitive Load**:
   - Location Analysis + Weather Risk + Assessment all visible at once
   - Goals Analysis grid updates dynamically (may cause confusion)
   - Multiple color schemes (purple, green, yellow, red) in close proximity

**Recommendations for Discussion:**
- Simplify right column: Show one section at a time or use tabs
- Reduce weather icons: Show only relevant risks or use a summary
- Tone down animations: Make pulsation optional or less prominent
- Improve spacing: More whitespace between sections
- Progressive disclosure: Show details on demand rather than all at once
