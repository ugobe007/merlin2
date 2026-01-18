# Merlin Energy - UI/UX Design Notes

**Last Updated:** December 21, 2025 (New 6-Step Workflow)  
**Purpose:** This file serves as persistent design memory for AI assistants working on this project.  
**⚠️ AI AGENTS: READ THIS ENTIRE FILE BEFORE MAKING ANY UI CHANGES!**

---

## 🧙‍♂️ NEW WIZARD WORKFLOW (December 21, 2025)

### 6-Step Guided Wizard Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MERLIN WIZARD - 6 STEPS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: LOCATION + GOALS                                                   │
│  └─ State selector, electricity rates, primary goals                        │
│  └─ Component: Step1LocationGoals.tsx                                       │
│                                                                             │
│  STEP 2: INDUSTRY                                                           │
│  └─ Industry selection (Commercial, Industrial, Housing tabs)               │
│  └─ Component: Step2IndustrySize.tsx                                        │
│                                                                             │
│  STEP 3: INPUTS (Facility Details)                                          │
│  └─ Custom questions based on industry                                      │
│  └─ Premium slider inputs with +/- controls                                 │
│  └─ Component: Step3FacilityDetails.tsx                                     │
│                                                                             │
│  STEP 4: REVIEW & CONFIGURE (Magic Fit™)                                    │
│  └─ Merlin's 3 AI recommendations (Savings, Balanced, Resilient)            │
│  └─ Simple adjustments via sliders if needed                                │
│  └─ 🚪 ProQuote ESCAPE ROUTE available                                      │
│  └─ Component: Step4ReviewConfigure.tsx                                     │
│                                                                             │
│  STEP 5: PRELIMINARY QUOTE                                                  │
│  └─ Quick quote preview with key metrics                                    │
│  └─ Accept or refine options                                                │
│  └─ 🚪 ProQuote ESCAPE ROUTE available                                      │
│  └─ Component: Step4MagicFit.tsx (renamed from Step5)                       │
│                                                                             │
│  STEP 6: QUOTE DOWNLOAD & SUMMARY                                           │
│  └─ Final quote with export options (PDF, Word, Excel)                      │
│  └─ TrueQuote™ source attribution                                           │
│  └─ 🚪 ProQuote ESCAPE ROUTE available                                      │
│  └─ Component: QuoteResultsSection.tsx                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ProQuote Escape Routes

Users can exit to ProQuote (Advanced Quote Builder) from Steps 4, 5, and 6:

- Button text: "Switch to ProQuote" or "Advanced Builder"
- Opens: AdvancedQuoteBuilderLanding.tsx
- Carries over: All wizard state (location, industry, inputs, sizing)

### Navigation Pattern

- **FloatingNavigationArrows**: Apple-style left/right arrows fixed at screen edges
- **NO legacy nav bars**: SummaryBar, Back/Home button rows removed
- **MerlinGreeting**: Unified guidance at top of each step

---

## 🎚️ PREMIUM INPUT FIELD DESIGNS (Late November 2025)

### NUMBER INPUT - Slider + Input Combo

From `InteractiveConfigDashboard.tsx` and `GoalsSectionV3.tsx`:

```tsx
// Premium slider with gradient track and styled thumb
<div className="space-y-3">
  {/* Label and Value Row */}
  <div className="flex justify-between items-center">
    <label className="text-white font-semibold text-base">{label}</label>
    <div className="flex items-center gap-2">
      {/* Decrement Button */}
      <button
        className="w-8 h-8 rounded-lg bg-[#68BFFA]/40 hover:bg-[#68BFFA]/70 
                         text-white font-bold text-xl flex items-center justify-center
                         border border-[#68BFFA]/60 transition-all"
      >
        −
      </button>

      {/* Value Display with Orange Accent */}
      <div className="flex items-center bg-[#060F76]/60 rounded-lg border-2 border-[#ffa600]/50 px-3 py-1">
        <input
          type="number"
          className="w-16 bg-transparent text-[#ffa600] font-black text-xl text-center"
        />
        <span className="text-[#FED19F] font-semibold ml-1">{unit}</span>
      </div>

      {/* Increment Button */}
      <button
        className="w-8 h-8 rounded-lg bg-[#68BFFA]/40 hover:bg-[#68BFFA]/70 
                         text-white font-bold text-xl flex items-center justify-center
                         border border-[#68BFFA]/60 transition-all"
      >
        +
      </button>
    </div>
  </div>

  {/* Slider Track */}
  <input
    type="range"
    className="w-full h-3 rounded-full appearance-none cursor-pointer
    bg-[#f5d4a3]
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:bg-[#6700b6]
    [&::-webkit-slider-thumb]:cursor-pointer
    [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50
    [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
  />

  {/* Min/Max Labels */}
  <div className="flex justify-between text-sm text-gray-500">
    <span>{min}</span>
    <span>{max}</span>
  </div>
</div>
```

### CSS for Custom Slider Thumbs

```css
/* From InteractiveConfigDashboard.tsx */
.slider-purple::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
  border: 2px solid white;
}

.slider-green::-webkit-slider-thumb {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
}
```

### Visual Slider with Gradient Fill

From `Step3FacilityDetails.tsx`:

```tsx
{
  /* Premium Slider Track with visual fill */
}
<div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
  {/* Filled portion */}
  <div
    className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#68BFFA] to-[#3B5BDB] rounded-full"
    style={{ width: `${sliderPercent}%` }}
  />
  {/* Slider thumb indicator */}
  <div
    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-[#3B5BDB] shadow-md"
    style={{ left: `calc(${sliderPercent}% - 10px)` }}
  />
</div>;
```

---

## 🎨 OFFICIAL MERLIN COLOR PALETTE (Updated December 2025 - Apple-Inspired)

### Primary Brand Colors

Apple-like smooth gradients: Light blue/cyan → Deep indigo/purple

| Color Name       | Hex Code  | Usage                              | Tailwind Class |
| ---------------- | --------- | ---------------------------------- | -------------- |
| **Light Cyan**   | `#68BFFA` | Primary light (Malibu Blue - kept) | `bg-[#68BFFA]` |
| **Medium Blue**  | `#4A90E2` | Mid-tone transitions               | `bg-[#4A90E2]` |
| **Deep Indigo**  | `#3B5BDB` | Primary dark, CTAs                 | `bg-[#3B5BDB]` |
| **Deep Purple**  | `#5B21B6` | Selected states, emphasis          | `bg-[#5B21B6]` |
| **Web Orange**   | `#ffa600` | Accents, highlights, badges        | `bg-[#ffa600]` |
| **Peach Orange** | `#FED19F` | Soft accents, light fills          | `bg-[#FED19F]` |

### Primary Gradient (Apple-Inspired: Light Blue → Deep Indigo/Purple)

**Main gradient for backgrounds, cards, and CTAs:**

```
Light: #8FC5F8 → #68BFFA → #4A90E2 → #3B5BDB → #5B21B6 → #4C1D95 (Deep)
```

### Orange Gradient Shades (Accent - Light → Dark)

```
#ffd689 → #ffc966 → #ffbb42 → #ffad1f → #ffa600 → #d98d00 → #b37400 → #8c5b00 → #664200 → #472e00
```

### Legacy Colors (For Reference - Being Phased Out)

- Old Merlin Purple: `#6700b6` (replaced by `#5B21B6`)
- Old Arapawa Navy: `#060F76` (replaced by `#3B5BDB`)

### Usage Guidelines (Apple-Inspired Design):

**Buttons:**

- Primary CTA: `bg-gradient-to-r from-[#68BFFA] via-[#4A90E2] to-[#3B5BDB]` with `border border-[#68BFFA]/30` and soft shadow
- Secondary: `bg-[#3B5BDB]` with `border border-[#4A90E2]` and soft shadow
- Accent: `bg-[#68BFFA]` for success/info actions
- Highlight: `bg-[#ffa600]` for selected/highlighted states
- **Shadows**: Use `shadow-lg shadow-[#3B5BDB]/20` for depth (soft, not harsh)

**Cards & Panels:**

- Light fills: Use `/10` or `/20` opacity for subtlety (e.g., `bg-[#68BFFA]/10`)
- Borders: Use `border` (1px) for minimal, `border-2` for emphasis
- Backgrounds: `bg-gradient-to-br from-[#68BFFA]/5 via-[#4A90E2]/10 to-[#3B5BDB]/15` for cards
- **Shadows**: Soft, subtle - `shadow-md shadow-[#3B5BDB]/10` (not harsh black)

**Text Colors:**

- On dark backgrounds: `text-white`, `text-[#68BFFA]` (light blue), `text-[#ffd689]` (light orange)
- On light backgrounds: `text-[#3B5BDB]`, `text-[#5B21B6]`, `text-gray-700`
- **Typography**: Clean, sans-serif, generous spacing

---

## 🎯 NAVIGATION PATTERN (NEW - Dec 20, 2025)

### Floating Nav Widget (Option 1 - Recommended)

**Apple-like minimal design:** Small dashboard icon in top-right corner that expands to show all navigation widgets and controls.

**Design Principles:**

- Hidden by default (minimal, non-intrusive)
- Expands on click to show all widgets
- Auto-collapses when clicking outside
- Consistent across all wizard steps and Merlin site

**SSOT Compliance:**

- All data comes from `wizardState` (Single Source of Truth)
- Widgets display calculated values from `centralizedState`
- TrueQuote badge links to methodology explanation
- No duplicate calculations - all values flow from SSOT

**Component:** `FloatingNavWidget` in `src/components/wizard/shared/FloatingNavWidget.tsx`

**Usage:**

```tsx
<FloatingNavWidget
  wizardState={wizard.wizardState}
  centralizedState={wizard.centralizedState}
  onOpenSidebarMenu={() => setShowSidebarMenu(!showSidebarMenu)}
  onOpenTrueQuote={() => setShowTrueQuoteModal(true)}
  onOpenSolarOpportunity={() => setShowSolarOpportunity(true)}
  onOpenPowerProfileExplainer={() => setShowPowerProfileExplainer(true)}
  onClose={onClose}
  onNavigateToSection={(section) => wizard.advanceToSection(section)}
  currentSection={wizard.currentSection}
/>
```

**Widgets Included:**

- Menu & Navigation (opens sidebar)
- TrueQuote™ badge (opens methodology modal)
- Solar Opportunity (shows sun rating, hours/day)
- Power Profile (shows battery storage, total power)
- Power Coverage (shows coverage percentage, status)
- Energy Opportunity (Savings Scout widget)

**Replaces:** Old top navigation bar (removed Dec 20, 2025)

---

## 🚨 MESSAGING HIERARCHY (UPDATED Dec 10, 2025)

### The Three Pillars of Merlin Messaging:

**1. PRIMARY: Energy Savings** (The main hook - what customers want)

- Headlines: "Slash Your Energy Costs", "Save 25-40%", etc.
- Immediate value proposition: Money saved, payback period, ROI

**2. SECONDARY: Merlin AI Platform** (The differentiator - why us)

- "AI-Powered Energy Platform" tag
- "Our AI analyzes your facility..."
- "How Merlin's AI works" link

**3. TERTIARY: TrueQuote™** (The trust signal - why believe us)

- TrueQuoteBadge component on all quote-related pages
- "Every number has a source" tagline
- Clickable to open TrueQuoteModal with methodology explanation

### Messaging Application:

| Component             | Primary                      | Secondary                    | Tertiary                   |
| --------------------- | ---------------------------- | ---------------------------- | -------------------------- |
| Main Hero             | ✅ "Slash Your Energy Costs" | ✅ "AI-Powered Platform" tag | ✅ TrueQuoteBadge          |
| HotelEnergy Hero      | ✅ "Hotels Save 25-40%"      | ✅ "Powered by Merlin"       | ✅ TrueQuoteBadge          |
| CarWashEnergy Hero    | ✅ "Save 30-50%"             | ✅ "Powered by Merlin"       | ✅ TrueQuoteBadge          |
| EVChargingEnergy Hero | ✅ "Cut Demand Charges"      | ✅ "Powered by Merlin"       | ✅ TrueQuoteBadge          |
| Quote Results         | ✅ Savings summary           | ✅ AI recommendations        | ✅ TrueQuote certification |

---

## 🚨 CRITICAL BUSINESS MODEL - READ FIRST!

### Merlin Energy = A PLATFORM / ENGINE

Merlin is NOT just a website. It is a **scalable platform** that powers multiple SMB vertical sites.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MERLIN ENERGY PLATFORM                       │
│  (Database, API, Calculations, Workflows, Logic, Templates)    │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ CarWashEnergy │   │  HotelEnergy  │   │ EVChargingHub │
│   (SMB Site)  │   │   (SMB Site)  │   │   (SMB Site)  │
│               │   │               │   │               │
│ "Powered by   │   │ "Powered by   │   │ "Powered by   │
│ Merlin Energy"│   │ Merlin Energy"│   │ Merlin Energy"│
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                    (Future SMB Verticals)
```

### What This Means for Design:

1. **Hero section** must reflect Merlin as a PLATFORM, not just a tool
2. **SMB sites** are products that Merlin powers
3. **"Powered by Merlin Energy"** branding on all verticals
4. **Scalable model** - Same engine, different industry templates

---

## 🎨 HERO SECTION DESIGN (UPDATED Dec 1, 2025)

### Layout: Two-Column Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      DARK SLATE BACKGROUND                       │
│   ┌─────────────────────┐     ┌─────────────────────────────┐   │
│   │     LEFT HALF       │     │        RIGHT HALF            │   │
│   │                     │     │                             │   │
│   │  "Slash Your"       │     │  ┌────────────────────────┐ │   │
│   │  "Energy Costs"     │     │  │  ROTATING USE CASE     │ │   │
│   │  (Kelly Green)      │     │  │  PHOTO (full bleed)    │ │   │
│   │                     │     │  │                        │ │   │
│   │  💰 Cut Energy Costs│     │  │  ┌──────────────────┐  │ │   │
│   │  📈 Generate Revenue│     │  │  │ FLOATING OVERLAY │  │ │   │
│   │  🌱 Go Green (Kelly)│     │  │  │ • Industry Name  │  │ │   │
│   │                     │     │  │  │ • $127K Savings  │  │ │   │
│   │  ┌──────────────┐   │     │  │  │ • 2.1yr Payback  │  │ │   │
│   │  │ GLOWING CTA  │   │     │  │  │ • 485% ROI       │  │ │   │
│   │  │ Get My Quote │   │     │  │  └──────────────────┘  │ │   │
│   │  └──────────────┘   │     │  │                        │ │   │
│   │                     │     │  │  🧙 Powered by Merlin  │ │   │
│   │  How Merlin Works→  │     │  └────────────────────────┘ │   │
│   └─────────────────────┘     └─────────────────────────────┘   │
│                                                   [Join Now]     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Elements:

#### Headlines (Left Side)

- **Main headline**: "Slash Your Energy Costs"
- Font: `text-5xl md:text-6xl lg:text-7xl font-black`
- "Energy Costs" in Kelly green gradient: `from-emerald-400 to-emerald-300`

#### Value Props (Bullet Points - NO BOXES)

- Simple bullet points with emoji icons
- 💰 **Cut Energy Costs** — Save 30-50% on electricity
- 📈 **Generate Revenue** — Turn batteries into profit
- 🌱 **Go Green** — 100% clean energy potential (Kelly green text)

#### CTA Button (GLOWING)

- Kelly green gradient: `from-emerald-500 to-emerald-600`
- Pulse ring animation: `animate-pulse`
- Wave shine effect on hover
- Shadow glow: `hover:shadow-emerald-500/50`
- Text: "⚡ Get My Free Quote → 3 min"

#### "How Merlin Works" Link

- Below CTA button
- Opens modal popup explaining 4-step process:
  1. Tell us about your business
  2. Merlin analyzes your needs
  3. Get your custom quote
  4. Connect with installers

#### Right Side - Photo Showcase

- Full-height rotating images from existing assets
- Auto-rotates every 4 seconds
- Gradient overlay for text readability
- **Floating translucent overlay** (glass morphism):
  - `bg-white/10 backdrop-blur-xl`
  - Shows: Industry name, Annual Savings, Payback, ROI
  - Grid layout: 3 columns for metrics
- Navigation dots at bottom

#### Merlin Logo (LOWER RIGHT)

- Small "Powered by Merlin" badge
- Position: `absolute bottom-4 right-4`
- Clickable → Opens About modal
- Glass morphism style: `bg-white/10 backdrop-blur-xl`

### Colors Used:

- Background: `from-slate-900 via-slate-800 to-slate-900`
- Headlines: `text-white`
- Accent: Kelly green `emerald-400/500/600`
- Metrics: `emerald-400` (savings), `blue-400` (payback), `purple-400` (ROI)
- Muted text: `text-slate-300`, `text-slate-400`

### Images (from existing assets):

```javascript
import carWashImage from "../../assets/images/car_wash_1.jpg";
import hospitalImage from "../../assets/images/hospital_1.jpg";
import evChargingStationImage from "../../assets/images/ev_charging_station.png";
import evChargingHotelImage from "../../assets/images/ev_charging_hotel.webp";
import hotelImage from "../../assets/images/hotel_1.avif";
import airportImage from "../../assets/images/airports_1.jpg";
```

---

## 🏗️ PLATFORM ARCHITECTURE

### The Merlin Engine Provides:

- ✅ Central database (Supabase)
- ✅ API calls for calculations
- ✅ Financial models
- ✅ Industry templates
- ✅ Workflow logic (StreamlinedWizard)
- ✅ Hooks for vertical customization
- ✅ Settings and configurations

### SMB Vertical Sites:

| Site          | URL                 | Industry                    |
| ------------- | ------------------- | --------------------------- |
| CarWashEnergy | `/carwashenergy`    | Car wash operators          |
| HotelEnergy   | `/hotelenergy`      | Hotels & hospitality        |
| EVChargingHub | `/evchargingenergy` | EV charging operators       |
| (Future)      | TBD                 | Manufacturing, Retail, etc. |

Each SMB site:

- Uses Merlin's engine
- Has industry-specific templates
- Shares the StreamlinedWizard workflow
- Branded as "Powered by Merlin Energy"

---

## 🏠 MERLIN MAIN SITE (merlinenergy.com)

This is the **platform showcase** - NOT just a quote tool.

### Hero Section Purpose:

1. **Introduce Merlin as a platform**
2. **Show the value proposition** (Save money, Resilience, Go green)
3. **Drive users to StreamlinedWizard** OR to SMB vertical sites
4. **Showcase industry use cases** and savings
5. **Establish credibility** with real-world examples

### Hero Section Structure:

```
┌─────────────────────────────────────────────────────────────┐
│  HERO HEADER                                                │
│  - Headline: Save Money on Energy. Improve Resilience.      │
│              Go Green. (DRAFT - subject to change)          │
│  - CTA Button → Opens StreamlinedWizard                     │
│  - Merlin Mascot → Click for About Us                       │
└─────────────────────────────────────────────────────────────┘
│  SCROLLING USE CASES                                        │
│  - Industry cards with savings figures                      │
└─────────────────────────────────────────────────────────────┘
│  MERLIN AI SYSTEM DESCRIPTION                               │
│  - What the platform does                                   │
│  - How it powers SMB sites                                  │
└─────────────────────────────────────────────────────────────┘
│  ADVANCED QUOTE BUILDER                                     │
│  - Link for power users                                     │
└─────────────────────────────────────────────────────────────┘
│  BOLD SAVINGS NUMBERS                                       │
│  - Eye-catching examples                                    │
└─────────────────────────────────────────────────────────────┘
│  INDUSTRY USE CASES                                         │
│  - Cards linking to SMB sites or wizard templates           │
└─────────────────────────────────────────────────────────────┘
│  REAL WORLD EXAMPLES                                        │
│  - Detailed case studies                                    │
└─────────────────────────────────────────────────────────────┘
│  FOOTER                                                     │
│  - About Us, Contact Us, Join Merlin                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧙 STREAMLINED WIZARD (The Core Workflow)

**StreamlinedWizard** is the core product that ALL sites use.

### Wizard Flow (Auto-Advancing):

```
CTA Click → StreamlinedWizard Opens:
  │
  ├─→ 1. LOCATION (auto-advance when selected)
  │
  ├─→ 2. INDUSTRY (auto-advance when selected)
  │       └─→ Links to SMB sites OR continues in wizard
  │
  ├─→ 3. USER INPUT (pulls templates from database)
  │
  ├─→ 3b. GOALS & PREFERENCES (what matters to user)
  │        └─→ Click Continue → Go to Magic Fit (Section 4)
  │
  ├─→ 4. MAGIC FIT™ (3 Cards) - User PICKS a strategy
  │       ┌──────────────────────────────────────────────────────────┐
  │       │  💰 SAVINGS FOCUS    │  ⚖️ BALANCED      │  🛡️ RESILIENT │
  │       │  Fastest payback     │  AI RECOMMENDED   │  Max backup   │
  │       │  0.8x sizing         │  1.0x sizing      │  1.3x sizing  │
  │       │  ~3 year payback     │  ~4 year payback  │  ~5 year ROI  │
  │       │                      │                   │               │
  │       │     [SELECT]         │    [SELECT] ✓     │   [SELECT]    │
  │       └──────────────────────────────────────────────────────────┘
  │       └─→ User clicks a card → AcceptCustomizeModal appears
  │
  ├─→ 4b. ACCEPT/CUSTOMIZE MODAL (CRITICAL - Dec 16, 2025)
  │       └─→ "Accept Merlin AI Setup" → Skip to Quote (Section 6)
  │       └─→ "Customize Configuration" → Two-Column (Section 5)
  │
  ├─→ 5. TWO-COLUMN COMPARISON (ScenarioSectionV2) - Only if Customize
  │        ┌──────────────────────────────────────────────────────────┐
  │        │ LEFT: MERLIN'S PICK        │ RIGHT: YOUR CONFIG          │
  │        │ (Read-Only, Lock icon)     │ (Editable, Unlock icon)     │
  │        │                             │                             │
  │        │ ⚡ Battery: 450 kW         │ ⚡ Battery: [───○──] 450 kW │
  │        │ ⏱️ Duration: 4 hrs          │ ⏱️ Duration: [───○──] 4 hr  │
  │        │ ☀️ Solar: 200 kW            │ ☀️ Solar: [───○──] 200 kW   │
  │        │                             │                             │
  │        │ 📊 Net Cost: $485,000      │ 📊 Est. Cost: $XXX,XXX      │
  │        │ 💰 Annual: $127,000        │ 💰 vs Merlin: +/-$XX,XXX    │
  │        │                             │                             │
  │        │ [Accept Merlin's Config]   │ [Use My Custom Config]      │
  │        └──────────────────────────────────────────────────────────┘
  │       ⚠️ NO EV CHARGING in Section 5 - Removed Dec 16, 2025
  │
  └─→ 6. QUOTE RESULTS (Final) - QuoteResultsSection
```

Located: `src/components/wizard/StreamlinedWizard.tsx`

---

## 🚨 WIZARD FLOW - DECEMBER 21, 2025 (CURRENT)

### NEW 6-Step Flow (Simplified)

```
Step 1: LOCATION + GOALS (Step1LocationGoals.tsx)
    - State selector with electricity rates
    - Primary goals selection
    ↓
Step 2: INDUSTRY (Step2IndustrySize.tsx)
    - 3 tabs: Commercial, Industrial, Housing
    - Industry cards with distinctive icons
    ↓
Step 3: INPUTS / FACILITY DETAILS (Step3FacilityDetails.tsx)
    - Dynamic custom questions from database
    - Premium slider inputs (late Nov design)
    ↓
Step 4: REVIEW & CONFIGURE / MAGIC FIT (Step4ReviewConfigure.tsx)
    - Merlin's 3 AI recommendations:
      • 💰 Savings Focus (0.8x) - Fastest payback
      • ⚖️ Balanced (1.0x) - AI recommended
      • 🛡️ Resilient (1.3x) - Maximum backup
    - Simple slider adjustments
    - 🚪 ProQuote escape route
    ↓
Step 5: PRELIMINARY QUOTE (Step4MagicFit.tsx)
    - Quick preview of selected strategy
    - Key metrics: Cost, Savings, Payback, ROI
    - Accept or refine
    - 🚪 ProQuote escape route
    ↓
Step 6: QUOTE DOWNLOAD & SUMMARY (QuoteResultsSection.tsx)
    - Final TrueQuote™ quote
    - Export: PDF, Word, Excel
    - Source attribution
    - 🚪 ProQuote escape route
```

### ProQuote Escape Routes

Available on Steps 4, 5, 6:

- Button: "Switch to ProQuote" or "🔧 Advanced Builder"
- Target: AdvancedQuoteBuilderLanding.tsx
- Carries: Full wizard state

### Navigation Components

| Component                | Purpose                             |
| ------------------------ | ----------------------------------- |
| FloatingNavigationArrows | Apple-style left/right fixed arrows |
| MerlinGreeting           | Unified guidance header per step    |

### REMOVED (Dec 21, 2025)

- ❌ SummaryBar - Legacy state/industry display bar
- ❌ Back/Home button rows - Replaced by floating arrows
- ❌ Step indicator pills - Replaced by cleaner design

---

## 🚨 WIZARD FLOW HISTORY (Dec 16, 2025 - Archived)

### The Problem We Fixed:

There were TWO competing flows:

1. OLD: Goals → generateQuote → AcceptCustomizeModal → Section 4 (sliders)
2. WRONG: Goals → Section 4 (two-column) directly

### The Dec 16 Flow (Now Superseded):

```
Section 0: Location
Section 1: Industry
Section 2: Facility Details
Section 3: Goals/Preferences
    ↓
Section 4: MAGIC FIT (3 cards) - ScenarioSection.tsx
    - Auto-generates 3 scenarios on entry
    - Shows ScenarioExplainerModal (first visit)
    - User PICKS: Savings Focus, Balanced, or Resilient
    - onSelectScenario callback → triggers AcceptCustomizeModal
    ↓
AcceptCustomizeModal - shared/AcceptCustomizeModal.tsx
    - Shows the selected scenario's recommendation
    - "Accept Merlin AI Setup" → Section 6 (Quote Results)
    - "Customize Configuration" → Section 5 (Two-Column)
    ↓
Section 5: TWO-COLUMN (only if Customize) - ScenarioSectionV2.tsx
    - Merlin's Pick (read-only) vs User's Config (sliders)
    - User fine-tunes Battery, Duration, Solar
    - Continue → Section 6
    ↓
Section 6: QUOTE RESULTS - QuoteResultsSection.tsx
    - Final quote with export options
```

### Key Components:

| Section | Component                  | Purpose                           |
| ------- | -------------------------- | --------------------------------- |
| 4       | `ScenarioSection.tsx`      | 3-card Magic Fit selection        |
| 4b      | `AcceptCustomizeModal.tsx` | Accept vs Customize choice        |
| 5       | `ScenarioSectionV2.tsx`    | Two-column fine-tuning (optional) |
| 6       | `QuoteResultsSection.tsx`  | Final quote + exports             |

### What Magic Fit Provides:

- **3 Optimized Strategies** based on user's goals
- **Savings Focus (0.8x)** - Fastest payback, smallest system
- **Balanced (1.0x)** - AI recommended, optimal ROI
- **Resilient (1.3x)** - Maximum backup, grid independence

### Files:

| File                 | Location                                                 |
| -------------------- | -------------------------------------------------------- |
| ScenarioSection      | `src/components/wizard/sections/ScenarioSection.tsx`     |
| ScenarioSectionV2    | `src/components/wizard/sections/ScenarioSectionV2.tsx`   |
| AcceptCustomizeModal | `src/components/wizard/shared/AcceptCustomizeModal.tsx`  |
| QuoteResultsSection  | `src/components/wizard/sections/QuoteResultsSection.tsx` |
| StreamlinedWizard    | `src/components/wizard/StreamlinedWizard.tsx`            |
| scenarioGenerator    | `src/services/scenarioGenerator.ts`                      |

---

## 🎨 BRAND COLORS

### Primary

- Deep Purple Gradient: `from-purple-600 via-purple-700 to-indigo-800`
- Logo: Magenta "MERLIN" + Gray "ENERGY"

### Accents

- Green (savings): `emerald-500`, `teal-500`
- Amber (sustainability): `amber-500`, `orange-500`

### FORBIDDEN in UI

- ❌ NO PINK, MAGENTA, FUCHSIA (logo exception only)

---

## 🛠️ ADMIN DASHBOARDS (UPDATED Dec 10, 2025)

### Template Variables Admin (`/template-admin`)

New admin dashboard for managing calculation variables without code changes.

**Access Methods:**

- Direct route: `/template-admin` or `/templates`
- Admin Panel → "Template Variables" tab

**Features:**

- **Hotels Tab**: Edit hotel class profiles (economy/midscale/upscale/luxury), amenity specs (pool, restaurant, spa)
- **Car Wash Tab**: Edit equipment power (drying/vacuum/conveyor), automation levels
- **EV Charging Tab**: View charger specs, edit hardware costs, grid services revenue
- **Building Factors Tab**: Age factors, seasonality factors

**Key Notes:**

- Variables only - calculation logic is protected (SSOT)
- All sources attributed (CBECS, ASHRAE, Industry Data)
- Export functionality for backup/audit

**File:** `src/components/admin/TemplateVariablesAdmin.tsx`

---

## 🔧 KEY FILES

| File                         | Purpose                          |
| ---------------------------- | -------------------------------- |
| `HeroSection.tsx`            | Main landing - platform showcase |
| `StreamlinedWizard.tsx`      | Core wizard workflow             |
| `BessQuoteBuilder.tsx`       | Main page container              |
| `CarWashEnergy.tsx`          | Car wash SMB vertical            |
| `HotelEnergy.tsx`            | Hotel SMB vertical               |
| `EVChargingEnergy.tsx`       | EV charging SMB vertical         |
| `TemplateVariablesAdmin.tsx` | Admin: Edit template variables   |
| `TrueQuoteBadge.tsx`         | Trust badge component            |
| `TrueQuoteModal.tsx`         | Methodology explanation modal    |

---

## ⚠️ AI AGENT INSTRUCTIONS

1. **Merlin = Platform/Engine** - Not just a website
2. **SMB sites are products** powered by Merlin
3. **Hero reflects platform** positioning
4. **StreamlinedWizard** is shared across all sites
5. **Single Source of Truth** - Database drives everything
6. **400+ hours invested** - Don't break existing work
7. **Update this file** after significant changes
8. **Messaging hierarchy**: Energy Savings → Merlin AI → TrueQuote™

---

## 📝 CHANGELOG

### December 16, 2025 - Wizard Flow Redesign (Part 2)

#### NEW COMPONENTS CREATED:

**1. FacilityDetailsSectionV2.tsx** (570 lines)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: FACILITY DETAILS (Smart Dropdowns + Pill Buttons)      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─── Smart Dropdowns ────────────────────────────────────────┐ │
│  │ State Selector → confirms electricity rate                 │ │
│  │ Room Count Dropdown (10-500+)                              │ │
│  │ Square Footage Dropdown (10K-1M+)                          │ │
│  │                                                             │ │
│  │ 🔮 SMART PROMPT: >500 rooms or >500K sqft triggers:        │ │
│  │    "This looks like a large property - is this a..."       │ │
│  │    [Resort] [Casino] [Mega Resort] [Other]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── Pill-Style Amenity Buttons ─────────────────────────────┐ │
│  │ AQUATICS (cyan):   [Pool] [Spa] [Water Park]               │ │
│  │ WELLNESS (emerald):[Fitness] [Spa Center] [Tennis]         │ │
│  │ DINING (amber):    [Restaurant] [Bar] [Room Service]       │ │
│  │ BUSINESS (indigo): [Conference] [Ballroom] [Business Ctr]  │ │
│  │ SERVICES (purple): [Laundry] [Valet] [EV Charging]         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ✨ AUTO-ADVANCE: When isFormComplete() → onContinue()          │
└─────────────────────────────────────────────────────────────────┘
```

- Smart property type detection via `PROPERTY_TYPE_BY_SIZE`
  - small: <100 rooms
  - medium: 100-300 rooms
  - large: 300-500 rooms
  - mega: >500 rooms OR >500K sqft
- `AMENITY_CATEGORIES` with 5 color-coded groups (20 total amenities)
- Pill buttons match hero calculator design
- `getSizeCategory()` for conditional UI prompts
- Auto-advance when form is complete

**2. ConfigurationComparison.tsx** (450 lines)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: CONFIGURATION COMPARISON (User vs Merlin)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    vs    ┌─────────────────┐              │
│  │ YOUR CONFIG     │          │ MERLIN'S PICK   │              │
│  │                 │          │                 │              │
│  │ 🔋 250 kW/1MWh  │          │ 🔋 250 kW/1MWh  │              │
│  │ ⏱️  4 hours     │          │ ⏱️  4 hours     │              │
│  │ ☀️  100 kW      │          │ ☀️  150 kW      │ ← RECOMMENDED │
│  │ 💨 0 kW        │          │ 💨 0 kW        │              │
│  │                 │          │                 │              │
│  │ Annual: $45K    │          │ Annual: $52K    │              │
│  │ Payback: 5.2 yr │          │ Payback: 4.5 yr │              │
│  │ ROI: 480%       │          │ ROI: 550%       │              │
│  │ Net: $475K      │          │ Net: $500K      │              │
│  │                 │          │                 │              │
│  │ [Use My Config] │          │ [Accept Merlin] │              │
│  └─────────────────┘          └─────────────────┘              │
│                                                                 │
│  ┌─── Quick Comparison Bar ───────────────────────────────────┐ │
│  │ Battery: same | Savings: -13% | Payback: +15% | Cost: -5%  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ✨ AUTO-ADVANCE: After selection → onContinue() (500ms delay)  │
└─────────────────────────────────────────────────────────────────┘
```

- Two-column card layout with selection highlighting
- Merlin card has "RECOMMENDED" badge (amber/orange gradient)
- User card uses emerald accent, Merlin card uses purple accent
- Selection triggers `setSelectedConfig()` and auto-advances
- `getComparison()` helper calculates % differences
- Shows "Why this configuration?" explainer on Merlin's card

#### WIZARD FLOW (IMPLEMENTED - Dec 16, 2025):

```
Hero Calculator → Step 0 → Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
     │              │         │        │        │        │        │        │        │
     │              │         │        │        │        │        │        │        └─ Quote Results
     │              │         │        │        │        │        │        └─ Fine-Tuning (optional)
     │              │         │        │        │        │        └─ 3-Card Scenario Planner
     │              │         │        │        │        └─ User vs Merlin Comparison (NEW!)
     │              │         │        │        └─ Goals & Power Preferences
     │              │         │        └─ Facility Details (V2 for hotels)
     │              │         └─ Industry Selection
     │              └─ Welcome + Location
     └─ Pre-populated: rooms, pool, restaurant, state
```

**Section Numbers (StreamlinedWizard.tsx):**
| Section | Name | Component |
|---------|------|-----------|
| 0 | Welcome + Location | WelcomeLocationSection |
| 1 | Industry Selection | IndustrySection |
| 2 | Facility Details | FacilityDetailsSectionV2 (hotel) / FacilityDetailsSection (others) |
| 3 | Goals & Preferences | GoalsSection |
| 4 | **Config Comparison** | **ConfigurationComparison** ← NEW |
| 5 | Scenario Planner (3-card) | ScenarioSection |
| 6 | Fine-Tuning (optional) | ScenarioSectionV2 |
| 7 | Quote Results | QuoteResultsSection |

#### FILES MODIFIED (Dec 16, 2025):

- `src/components/wizard/sections/index.ts` - Added exports for new components
- `src/components/wizard/StreamlinedWizard.tsx` - Wired V2 + ConfigurationComparison, renumbered sections
- `src/components/wizard/sections/QuoteResultsSectionNew.tsx` - Updated section check from 5 → 7

#### COMPLETED:

- ✅ Wire FacilityDetailsSectionV2 into StreamlinedWizard (hotel vertical only)
- ✅ Reposition ScenarioSection to after ConfigurationComparison
- ✅ ConfigurationComparison inserted as new Section 4
- ✅ All section numbers renumbered (Section 5→6→7)
- ✅ Build passes

### December 16, 2025 - Hotel Energy Hero Redesign

- ✅ **HERO SECTION COMPLETE REDESIGN** - Two-panel calculator layout
- ✅ **Title**: Changed "Hotel Energy Partners" → "Hotel Energy"
- ✅ **Tagline moved**: "Save 25-40% on Energy Bills" now centered ABOVE the two panels
- ✅ **CTA Button Above Panels**: "Get Your Custom Quote" button with emerald-teal-cyan gradient, positioned under tagline
- ✅ **LEFT PANEL**: Interactive Calculator
  - Guest room count input with slider (10-500 rooms)
  - Auto-calculated hotel class (Economy → Luxury based on room count)
  - Square footage input (optional)
  - Pool facilities checkboxes (indoor/outdoor)
  - Dining & Events (restaurant count, conference, events)
  - Additional amenities (spa, fitness, laundry)
  - State selector for location-based rates
  - **Colors**: `from-slate-900/80 via-indigo-900/40 to-slate-900/70` (translucent slate-blue)
  - **Border**: `border-indigo-500/40`
- ✅ **RIGHT PANEL**: Estimated Savings Display
  - Large annual savings number ($XX,XXX) in emerald green
  - Stats grid: Payback years, 25-Year ROI, Battery Size, Net Cost
  - **Colors**: `from-slate-900/80 via-purple-900/40 to-slate-900/70` (translucent purple)
  - **Border**: `border-purple-500/40`
- ✅ **TrueQuote™ Badge**: Added animated glow effect (`animate-pulse`)
  - Emerald gradient glow around badge
  - "All costs traceable to authoritative sources" messaging
  - "View Source Attribution" link
- ✅ **"How Merlin Works" Button**: Positioned to LEFT of TrueQuote badge
  - Opens popup with 4-step process explanation
  - Uses main site's How Merlin Works popup design
- ✅ **Benefits Pills**: Added "State credits available" alongside existing pills
  - Zero guest disruptions
  - 30% federal tax credit
  - State credits available (NEW)
  - ESG & sustainability
- ✅ **CTA Buttons**:
  - Primary: "Build My Custom Quote" (purple/indigo/cyan gradient)
  - Secondary: "Talk to an Expert"

#### Hotel Energy Hero Color Palette:

| Element            | Color Classes                                                          |
| ------------------ | ---------------------------------------------------------------------- |
| Left Panel BG      | `from-slate-900/80 via-indigo-900/40 to-slate-900/70 backdrop-blur-xl` |
| Left Panel Border  | `border-indigo-500/40`                                                 |
| Right Panel BG     | `from-slate-900/80 via-purple-900/40 to-slate-900/70 backdrop-blur-xl` |
| Right Panel Border | `border-purple-500/40`                                                 |
| Savings Display    | `from-emerald-300 via-teal-200 to-emerald-300` (text gradient)         |
| TrueQuote Glow     | `from-emerald-500/20 via-cyan-500/20 to-emerald-500/20`                |
| Primary CTA        | `from-purple-600 via-indigo-500 to-cyan-500`                           |

### December 1, 2025 - Session 3 (HERO REDESIGN)

- ✅ **COMPLETE HERO REDESIGN** - New two-column layout
- ✅ LEFT HALF: Bold headline "Slash Your Energy Costs" (Kelly green)
- ✅ LEFT HALF: Bullet points with icons (no boxes!)
- ✅ LEFT HALF: Glowing CTA button with wave animation
- ✅ LEFT HALF: "How Merlin Works" popup link
- ✅ RIGHT HALF: Full-bleed rotating use case photos
- ✅ RIGHT HALF: Floating translucent overlay with financial metrics
- ✅ RIGHT HALF: Merlin logo in LOWER RIGHT (not upper right)
- ✅ Using EXISTING image assets (car_wash, hotel, hospital, airport, ev_charging)
- ✅ Dark slate background with animated glow effects
- ✅ Updated DESIGN_NOTES.md with new hero specifications

### December 1, 2025 - Session 2

- ✅ CRITICAL: Documented Merlin as PLATFORM business model
- ✅ Added architecture diagram showing engine + SMB sites
- ✅ Clarified Hero section reflects platform positioning
- ✅ Documented "Powered by Merlin Energy" model

### December 1, 2025 - Session 1

- ✅ Light theme for StreamlinedWizard
- ✅ Back to Home button added
- ✅ Created DESIGN_NOTES.md

---

## 🧠 PHASE 1: INTELLIGENCE LAYER (January 18, 2026)

### Overview

Phase 1 transforms WizardV6 Step 1 from "fill out a form" → "experience discovery." The intelligence layer provides **database-driven, context-aware suggestions** that appear progressively as the user enters their ZIP code, creating a sense that Merlin "knows" their specific situation before they've even finished the first step.

**Strategic Goal**: Position Merlin as "Palantir for energy capital allocation" — not just an ROI calculator, but an intelligent advisor that understands your unique context.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER ENTERS ZIP CODE                                │
│                         (EnhancedLocationStep)                              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WIZARDV6 INTELLIGENCE ORCHESTRATION                      │
│                         (useEffect Hook)                                    │
│                                                                             │
│  Triggers when: zipCode (5 digits) + state + weather available             │
│                                                                             │
│  Parallel Promise.all of 4 services:                                        │
│  ├── inferIndustry(businessName) → Industry with confidence                │
│  ├── suggestGoals(industry, climate, grid) → 2-3 goal recommendations      │
│  ├── getPrimaryWeatherImpact(weather, industry) → ROI impact signal        │
│  └── calculateValueTeaser(industry, state) → Peer benchmark metrics        │
│                                                                             │
│  Result stored in: intelligence state (IntelligenceContext)                 │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADVISORRAIL EMPTY STATE UI                               │
│                  (Adaptive Intelligence Display)                            │
│                                                                             │
│  Conditionally renders based on intelligence context:                       │
│                                                                             │
│  📊 VALUE TEASER PANEL                                                      │
│  └─ "Sites like yours typically see:"                                       │
│     • 15-25% cost savings (67 projects)                                     │
│     • 4-8 hr resilience common (52 projects)                                │
│     • Source: AHLA Energy Benchmark Study 2024                              │
│                                                                             │
│  🎯 AUTO-SUGGESTED GOALS                                                    │
│  └─ "Merlin suggests these priorities:"                                     │
│     ✓ Energy Cost Reduction (92% confidence)                                │
│       → High heat increases cooling demand. Peak shaving critical.          │
│     ✓ Peak Demand Control (92% confidence)                                  │
│                                                                             │
│  🌡️ WEATHER IMPACT SIGNAL (Inline, not hover)                              │
│  └─ "Climate impact on your business:"                                      │
│     • Extreme heat increases cooling + dryer load by 30-45%                 │
│     • Why: High-volume air dryers + HVAC run continuously during heat       │
│     • Source: ICA Car Wash Operations Study 2023                            │
│                                                                             │
│  🏢 INDUSTRY PRE-SELECTION HINT                                             │
│  └─ "Industry detected: Hotel (95% match)"                                  │
│     • Recommended based on your business profile                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema (4 Tables)

**File**: `database/migrations/20260118_intelligence_layer.sql`

#### 1. `goal_suggestion_rules` (SSOT for goal auto-suggestion)

```sql
CREATE TABLE goal_suggestion_rules (
  id UUID PRIMARY KEY,
  industry_slug TEXT REFERENCES use_cases(slug),
  climate_risk TEXT,  -- 'extreme_heat', 'hurricane', 'extreme_cold', etc.
  grid_stress TEXT,   -- 'congested', 'stable', 'unreliable', NULL = any
  suggested_goals TEXT[],  -- Array: ['energy_cost_reduction', 'peak_demand_control']
  confidence NUMERIC(3,2),  -- 0.00-1.00
  rationale TEXT,     -- Why these goals? (shown to user)
  source TEXT,        -- TrueQuote™ source attribution
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Example rule**:

- Car Wash + Extreme Heat → `['energy_cost_reduction', 'peak_demand_control']` (92% confidence)
- Rationale: "High heat increases cooling + dryer demand. Peak shaving critical."
- Source: "NREL Commercial Load Study 2024"

#### 2. `peer_benchmarks` (SSOT for value teaser)

```sql
CREATE TABLE peer_benchmarks (
  id UUID PRIMARY KEY,
  industry_slug TEXT REFERENCES use_cases(slug),
  state TEXT,         -- 'CA', 'TX', 'NY', or 'ALL' for national
  metric_name TEXT,   -- 'demand_charge_reduction_pct', 'backup_hours_typical'
  value_min NUMERIC,
  value_max NUMERIC,
  unit TEXT,          -- '%', 'hours', 'years', '$'
  sample_size INTEGER,  -- Number of projects (credibility)
  confidence TEXT,    -- 'high', 'medium', 'low'
  display_text TEXT,  -- Pre-formatted: "15-25% cost savings"
  source TEXT,        -- TrueQuote™ source
  active BOOLEAN,
  UNIQUE(industry_slug, state, metric_name)
);
```

**Example benchmarks**:

- Hotel in FL: "15-25% cost savings" (67 projects, high confidence)
- Hotel in FL: "4-8 hr resilience common" (52 projects, high confidence)
- Source: "AHLA Energy Benchmark Study 2024"

#### 3. `weather_impact_coefficients` (SSOT for weather→ROI)

```sql
CREATE TABLE weather_impact_coefficients (
  id UUID PRIMARY KEY,
  weather_risk_type TEXT,  -- 'extreme_heat', 'hurricane', 'extreme_cold'
  industry_slug TEXT,      -- NULL = universal, specific = industry-targeted
  impact_metric TEXT,      -- 'demand_charge_increase_pct', 'outage_hours_avg_year'
  impact_min NUMERIC,
  impact_max NUMERIC,
  unit TEXT,
  impact_description TEXT,  -- "Extreme heat increases demand charges by ~18-25%"
  why_it_matters TEXT,      -- Inline explanation for user
  source TEXT,              -- TrueQuote™ source
  active BOOLEAN
);
```

**Example impacts**:

- Extreme Heat (universal): "18-25% demand charge increase"
- Extreme Heat (car wash): "30-45% cooling load increase"
  - Why: "High-volume air dryers + HVAC run continuously during heat"
- Source: "ICA Car Wash Operations Study 2023"

#### 4. `industry_keyword_mappings` (SSOT for business→industry)

```sql
CREATE TABLE industry_keyword_mappings (
  id UUID PRIMARY KEY,
  keyword TEXT,
  industry_slug TEXT REFERENCES use_cases(slug),
  confidence_weight NUMERIC(3,2),  -- 0.00-1.00
  is_exact_match BOOLEAN,  -- TRUE = exact, FALSE = partial
  case_sensitive BOOLEAN,
  active BOOLEAN,
  UNIQUE(keyword, industry_slug)
);
```

**Example mappings**:

- "hotel" → hotel (1.00 weight, partial match)
- "Marriott" → hotel (0.85 weight, partial match)
- "car wash" → car-wash (1.00 weight, exact match)

### Intelligence Services (4 Services)

**Location**: `src/services/intelligence/`

#### 1. `goalSuggestion.ts` - Auto-suggest goals

```typescript
// Query database for rules matching industry + climate + grid
export async function suggestGoals(input: {
  industrySlug: string;
  climateRisk: string;
  gridStress?: string;
}): Promise<IntelligenceServiceResponse<GoalSuggestion[]>>;

// Returns: Top 3 goals with confidence, rationale, source
// Example: [
//   { goalId: 'energy_cost_reduction', goalName: 'Energy Cost Reduction',
//     confidence: 0.92, rationale: 'High heat increases cooling demand...',
//     source: 'NREL Commercial Load Study 2024' }
// ]
```

**Fallback**: If no database rules → returns industry-appropriate defaults (confidence 0.70)

#### 2. `industryInference.ts` - Extract industry from business name

```typescript
// Query keyword mappings, score each industry by matched keywords
export async function inferIndustry(
  businessName: string
): Promise<IntelligenceServiceResponse<IndustryInference>>;

// Algorithm: Accumulates confidence_weight for each matched keyword
// Returns: Highest-scoring industry with normalized confidence (capped at 1.0)
// Example: "Marriott Hotel" → { industrySlug: 'hotel', industryName: 'Hotel',
//           confidence: 1.00, matchedKeywords: ['hotel'] }
```

**Fallback**: If no matches → regex-based estimation (synchronous)

#### 3. `weatherImpact.ts` - Convert weather risk → ROI metric

```typescript
// Query coefficients for weather risk + industry (prefers industry-specific)
export async function translateWeatherToROI(input: {
  weatherRiskType: string;
  industrySlug?: string;
}): Promise<IntelligenceServiceResponse<WeatherImpact[]>>;

// Returns: Array of impacts ordered by priority (universal fallback if needed)
// Example: [
//   { riskType: 'extreme_heat', impactMetric: 'cooling_load_increase_pct',
//     impactRange: { min: 30, max: 45 }, unit: '%',
//     impactDescription: 'Extreme heat increases cooling + dryer load by 30-45%',
//     whyItMatters: 'High-volume air dryers + HVAC run continuously...',
//     source: 'ICA Car Wash Operations Study 2023' }
// ]
```

**Helper**: `getPrimaryWeatherImpact()` returns first (highest priority) impact for inline display

#### 4. `valueTeaserService.ts` - Calculate peer benchmarks

```typescript
// Query peer_benchmarks for industry + state (falls back to 'ALL')
export async function calculateValueTeaser(input: {
  industrySlug: string;
  state: string;
}): Promise<IntelligenceServiceResponse<ValueTeaserMetric[]>>;

// Returns: 3-5 metrics with value ranges, confidence, sample size, source
// Example: [
//   { metricName: 'demand_charge_reduction_pct',
//     valueRange: { min: 15, max: 25 }, unit: '%',
//     displayText: '15-25% cost savings',
//     confidence: 'high', sampleSize: 67,
//     source: 'AHLA Energy Benchmark Study 2024' }
// ]
```

**Fallback**: If no benchmarks → industry-appropriate generic metrics

### Data Flow & Integration

#### WizardV6 Orchestration (`src/components/wizard/v6/WizardV6.tsx`)

```typescript
// Intelligence state
const [intelligence, setIntelligence] = useState<IntelligenceContext>({});

// Orchestration effect (triggers on ZIP entry)
useEffect(() => {
  if (
    state.zipCode?.length === 5 &&
    state.state &&
    (state.industry || state.detectedIndustry) &&
    state.weatherData?.extremes
  ) {
    const industrySlug = state.industry || state.detectedIndustry || '';
    const weatherRisk = parseWeatherRisk(state.weatherData.extremes);

    // Parallel service calls
    Promise.all([
      inferIndustry(state.businessName),
      suggestGoals({ industrySlug, climateRisk: weatherRisk }),
      getPrimaryWeatherImpact({ weatherRiskType: weatherRisk, industrySlug }),
      calculateValueTeaser({ industrySlug, state: state.state })
    ]).then(([industry, goals, weather, teaser]) => {
      setIntelligence({
        inferredIndustry: industry.data,
        suggestedGoals: goals.data,
        weatherImpact: weather.data ? [weather.data] : [],
        valueTeaser: teaser.data
      });
    });
  }
}, [state.zipCode, state.state, state.businessName, state.industry,
    state.detectedIndustry, state.weatherData]);

// Pass to AdvisorRail
<AdvisorRail context={{ ...existingContext, intelligence }} />
```

#### AdvisorRail Rendering (`src/components/wizard/v6/advisor/AdvisorRail.tsx`)

**Empty state** (before ZIP entered):

- Shows teaser: "You're about to see something no one else can show you"
- Explains TrueQuote™ intelligence

**After intelligence loads** (progressively):

- Each panel renders **conditionally** based on data availability
- Panels appear as services return (not all at once)
- Each includes **TrueQuote™ source attribution**

```tsx
{
  /* VALUE TEASER */
}
{
  context?.intelligence?.valueTeaser && context.intelligence.valueTeaser.length > 0 && (
    <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10">
      <div className="text-[10px] font-bold text-cyan-300/90">
        📊 Sites like yours typically see:
      </div>
      <ul>
        {context.intelligence.valueTeaser.map((metric) => (
          <li key={metric.metricName}>
            <span className="font-semibold">{metric.displayText}</span>
            {metric.confidence && <span>({metric.confidence} confidence)</span>}
          </li>
        ))}
      </ul>
      <div className="text-[9px] text-cyan-300/50 italic">
        Source: {context.intelligence.valueTeaser[0].source}
      </div>
    </div>
  );
}
```

### SSOT Compliance Patterns

**Every service follows the same pattern:**

1. **Query database first** (SSOT)
   - Use Supabase client from `@/services/supabaseClient`
   - Filter by active records only
   - Order by confidence/priority

2. **Include fallback logic** (resilience)
   - If database empty → return sensible defaults
   - If query fails → catch error, set fallbackUsed flag
   - Never leave user with blank screen

3. **Return standard response** (type safety)

   ```typescript
   export interface IntelligenceServiceResponse<T> {
     success: boolean;
     data: T | null;
     error?: string;
     fallbackUsed?: boolean;
   }
   ```

4. **Include TrueQuote™ source** (audit trail)
   - Every table has `source` column
   - Every response includes source attribution
   - Sources shown to user in UI (transparency)

### TypeScript Types

**Location**: `src/types/intelligence.types.ts`

```typescript
// Goal suggestion
export interface GoalSuggestion {
  goalId: string; // 'energy_cost_reduction'
  goalName: string; // 'Energy Cost Reduction'
  confidence: number; // 0.92
  rationale: string; // Why this goal?
  source: string; // TrueQuote™ source
}

// Industry inference
export interface IndustryInference {
  industrySlug: string; // 'hotel'
  industryName: string; // 'Hotel'
  confidence: number; // 0.95
  matchedKeywords: string[]; // ['hotel', 'hospitality']
}

// Weather impact
export interface WeatherImpact {
  riskType: string; // 'extreme_heat'
  impactMetric: string; // 'cooling_load_increase_pct'
  impactRange: { min: number; max: number }; // { min: 30, max: 45 }
  unit: string; // '%'
  impactDescription: string; // User-facing description
  whyItMatters: string; // Inline explanation
  source: string; // TrueQuote™ source
}

// Value teaser metric
export interface ValueTeaserMetric {
  metricName: string; // 'demand_charge_reduction_pct'
  valueRange: { min: number; max: number };
  unit: string; // '%'
  displayText: string; // '15-25% cost savings'
  confidence?: string; // 'high'
  sampleSize?: number; // 67
  source: string; // TrueQuote™ source
}

// Intelligence context (passed to AdvisorRail)
export interface IntelligenceContext {
  inferredIndustry?: IndustryInference;
  suggestedGoals?: GoalSuggestion[];
  weatherImpact?: WeatherImpact[];
  valueTeaser?: ValueTeaserMetric[];
}
```

### Seed Data Examples

**Car Wash + Extreme Heat** (California):

- **Goals**: Energy Cost Reduction (92%), Peak Demand Control (92%)
- **Rationale**: "High heat increases cooling + dryer demand. Peak shaving critical."
- **Weather**: "30-45% cooling load increase" (ICA Car Wash Operations Study 2023)
- **Benchmarks**:
  - "20-35% demand charge reduction" (42 projects)
  - "1.5-3 hrs outage protection" (38 projects)
  - Source: Merlin Project Database 2024-2025

**Hotel + Hurricane** (Florida):

- **Goals**: Outage Resilience (95%), Backup Power (95%)
- **Rationale**: "Hurricane-prone region with grid instability. Backup power essential."
- **Weather**: "12-48 hrs outages/year" + "$15K-$40K revenue loss per outage"
- **Benchmarks**:
  - "15-25% cost savings" (67 projects)
  - "4-8 hr resilience common" (52 projects)
  - Source: AHLA Energy Benchmark Study 2024

**Hospital** (any location):

- **Goals**: Backup Power (98%), Outage Resilience (98%), Peak Demand Control (98%)
- **Rationale**: "Critical infrastructure requires 24/7 reliability. Life safety priority."
- **Benchmarks**:
  - "12-24 hr backup critical" (89 projects)
  - "30-50% outage cost prevention" (76 projects)
  - Source: Joint Commission Standards + CMS Requirements

### Testing & Validation

**Migration verification queries** (in migration file):

```sql
-- Test 1: Goal suggestions for car wash + extreme heat
SELECT * FROM goal_suggestion_rules
WHERE industry_slug = 'car-wash' AND climate_risk = 'extreme_heat';

-- Test 2: Peer benchmarks for hotels in Florida
SELECT * FROM peer_benchmarks
WHERE industry_slug = 'hotel' AND state = 'FL';

-- Test 3: Weather impact for hurricanes
SELECT * FROM weather_impact_coefficients
WHERE weather_risk_type = 'hurricane';

-- Test 4: Industry inference for "Marriott Hotel"
SELECT * FROM industry_keyword_mappings
WHERE keyword ILIKE '%hotel%' ORDER BY confidence_weight DESC;
```

**UI testing** (localhost):

1. Enter ZIP 94102 (San Francisco, CA) → Extreme heat zone
2. Enter ZIP 33139 (Miami Beach, FL) → Hurricane zone
3. Enter ZIP 10001 (New York, NY) → Extreme cold zone
4. Verify intelligence panels appear progressively
5. Check TrueQuote™ sources displayed in UI

### Key Design Principles

1. **Progressive Discovery**: Intelligence appears **as data arrives**, not all at once
2. **Conditional Rendering**: Each panel only shows if data exists (graceful degradation)
3. **Source Transparency**: Every metric includes TrueQuote™ source (builds trust)
4. **Database-Driven**: Zero hardcoded rules (all data from tables)
5. **Fallback Resilience**: Services never fail silently (always return something useful)
6. **Type Safety**: Comprehensive TypeScript interfaces (catches errors at compile time)

### Future Enhancements (Phase 2+)

**Phase 2: Adaptive UI Components** (Next)

- Merge Step 1 + Step 2 into single adaptive screen
- Replace "Select your goals" → "Merlin suggests these priorities" (pre-selected)
- Convert hover tooltips → inline insights with "Why this matters"
- Auto-highlight industry card with "Recommended" badge

**Phase 3: Visual Intelligence**

- Remove redundancy between AdvisorRail and step content
- Add visual benchmarking charts (peer comparison graphs)
- Show confidence bounds on value ranges (P10/P50/P90)
- Smooth transitions as intelligence data arrives

### Files Modified (Phase 1 Commit History)

**Jan 18, 2026 - Commit d2b6ba5**: Phase 1 Intelligence Layer Foundation

- ✅ `database/migrations/20260118_intelligence_layer.sql` (NEW - 293 lines)
- ✅ `src/types/intelligence.types.ts` (NEW - 200+ lines)
- ✅ `src/services/intelligence/goalSuggestion.ts` (NEW - 120 lines)
- ✅ `src/services/intelligence/industryInference.ts` (NEW - 180 lines)
- ✅ `src/services/intelligence/weatherImpact.ts` (NEW - 150 lines)
- ✅ `src/services/intelligence/valueTeaserService.ts` (NEW - 180 lines)
- ✅ `src/services/intelligence/index.ts` (NEW - re-exports)
- ✅ `src/components/wizard/v6/WizardV6.tsx` (MODIFIED - orchestration added)
- ✅ `src/components/wizard/v6/advisor/AdvisorRail.tsx` (MODIFIED - intelligence context)

**Jan 18, 2026 - Commit e81d39d**: AdvisorRail Empty State UI Transformation

- ✅ `src/components/wizard/v6/advisor/AdvisorRail.tsx` (MODIFIED - adaptive UI)
  - Replaced 4 static preview cards
  - Added VALUE TEASER panel (peer benchmarks)
  - Added AUTO-SUGGESTED GOALS panel (with rationale)
  - Added WEATHER IMPACT signal (inline, not hover)
  - Added INDUSTRY PRE-SELECTION hint (detected industry)
  - All panels conditional on intelligence context
  - TrueQuote™ source attribution on all panels

### Migration Status

✅ **Database Migration**: Executed successfully (January 18, 2026)

- 5 goal suggestion rules seeded
- 9 peer benchmarks seeded
- 5 weather impact coefficients seeded
- 35+ industry keyword mappings seeded

✅ **Build Status**: Passing (3.71s, zero TypeScript errors)

✅ **Git Status**: Pushed to main (commits d2b6ba5, e81d39d)

---
