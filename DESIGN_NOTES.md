# Merlin Energy - UI/UX Design Notes

**Last Updated:** December 10, 2025  
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
  ├─→ 4. ADD EXTRAS (Solar, Wind, EV, Generation)
  │       └─→ AI RECOMMENDS based on location + industry + inputs
  │
  ├─→ 5. PRELIMINARY QUOTE (sliders to adjust)
  │
  └─→ 6. FINAL QUOTE + Downloads
```

Located: `src/components/wizard/StreamlinedWizard.tsx`

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
