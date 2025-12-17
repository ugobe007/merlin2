# Merlin Energy - UI/UX Design Notes

**Last Updated:** December 16, 2025  
**Purpose:** This file serves as persistent design memory for AI assistants working on this project.  
**⚠️ AI AGENTS: READ THIS ENTIRE FILE BEFORE MAKING ANY UI CHANGES!**

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
| Component | Primary | Secondary | Tertiary |
|-----------|---------|-----------|----------|
| Main Hero | ✅ "Slash Your Energy Costs" | ✅ "AI-Powered Platform" tag | ✅ TrueQuoteBadge |
| HotelEnergy Hero | ✅ "Hotels Save 25-40%" | ✅ "Powered by Merlin" | ✅ TrueQuoteBadge |
| CarWashEnergy Hero | ✅ "Save 30-50%" | ✅ "Powered by Merlin" | ✅ TrueQuoteBadge |
| EVChargingEnergy Hero | ✅ "Cut Demand Charges" | ✅ "Powered by Merlin" | ✅ TrueQuoteBadge |
| Quote Results | ✅ Savings summary | ✅ AI recommendations | ✅ TrueQuote certification |

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
| Site | URL | Industry |
|------|-----|----------|
| CarWashEnergy | `/carwashenergy` | Car wash operators |
| HotelEnergy | `/hotelenergy` | Hotels & hospitality |
| EVChargingHub | `/evchargingenergy` | EV charging operators |
| (Future) | TBD | Manufacturing, Retail, etc. |

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

## 🚨 WIZARD FLOW CORRECTED (Dec 16, 2025)

### The Problem We Fixed:
There were TWO competing flows:
1. OLD: Goals → generateQuote → AcceptCustomizeModal → Section 4 (sliders)
2. WRONG: Goals → Section 4 (two-column) directly

### The Correct Flow:
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
| Section | Component | Purpose |
|---------|-----------|---------|
| 4 | `ScenarioSection.tsx` | 3-card Magic Fit selection |
| 4b | `AcceptCustomizeModal.tsx` | Accept vs Customize choice |
| 5 | `ScenarioSectionV2.tsx` | Two-column fine-tuning (optional) |
| 6 | `QuoteResultsSection.tsx` | Final quote + exports |

### What Magic Fit Provides:
- **3 Optimized Strategies** based on user's goals
- **Savings Focus (0.8x)** - Fastest payback, smallest system
- **Balanced (1.0x)** - AI recommended, optimal ROI
- **Resilient (1.3x)** - Maximum backup, grid independence

### Files:
| File | Location |
|------|----------|
| ScenarioSection | `src/components/wizard/sections/ScenarioSection.tsx` |
| ScenarioSectionV2 | `src/components/wizard/sections/ScenarioSectionV2.tsx` |
| AcceptCustomizeModal | `src/components/wizard/shared/AcceptCustomizeModal.tsx` |
| QuoteResultsSection | `src/components/wizard/sections/QuoteResultsSection.tsx` |
| StreamlinedWizard | `src/components/wizard/StreamlinedWizard.tsx` |
| scenarioGenerator | `src/services/scenarioGenerator.ts` |

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

| File | Purpose |
|------|---------|
| `HeroSection.tsx` | Main landing - platform showcase |
| `StreamlinedWizard.tsx` | Core wizard workflow |
| `BessQuoteBuilder.tsx` | Main page container |
| `CarWashEnergy.tsx` | Car wash SMB vertical |
| `HotelEnergy.tsx` | Hotel SMB vertical |
| `EVChargingEnergy.tsx` | EV charging SMB vertical |
| `TemplateVariablesAdmin.tsx` | Admin: Edit template variables |
| `TrueQuoteBadge.tsx` | Trust badge component |
| `TrueQuoteModal.tsx` | Methodology explanation modal |

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
| Element | Color Classes |
|---------|---------------|
| Left Panel BG | `from-slate-900/80 via-indigo-900/40 to-slate-900/70 backdrop-blur-xl` |
| Left Panel Border | `border-indigo-500/40` |
| Right Panel BG | `from-slate-900/80 via-purple-900/40 to-slate-900/70 backdrop-blur-xl` |
| Right Panel Border | `border-purple-500/40` |
| Savings Display | `from-emerald-300 via-teal-200 to-emerald-300` (text gradient) |
| TrueQuote Glow | `from-emerald-500/20 via-cyan-500/20 to-emerald-500/20` |
| Primary CTA | `from-purple-600 via-indigo-500 to-cyan-500` |

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
