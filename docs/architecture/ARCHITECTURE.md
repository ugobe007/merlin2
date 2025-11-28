# 🏗️ Complete System Architecture

## 🎯 Overview

This document shows how all the pieces fit together - from dancing Merlin to admin control panel.

---

## 📐 System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Landing Page  →  Login  →  Wizard  →  Results  →  🪄      │
│       ↓            ↓         ↓           ↓                   │
│  Marketing    Auth UI   Dynamic      Dancing               │
│               Tier      Questions     Merlin                │
│               Check                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LOGIC LAYER                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Use Case Templates  ←→  Financial Engine  ←→  Tier System │
│         ↓                      ↓                    ↓        │
│  Custom Questions      ROI Calculations      Feature Flags  │
│  Power Profiles        Cost Analysis         Quote Limits   │
│  Equipment Lists       Incentives            Export Control │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Supabase PostgreSQL Database                               │
│  ├─ users (auth, tiers, limits)                            │
│  ├─ use_cases (templates, configs)                         │
│  ├─ saved_quotes (user data)                               │
│  ├─ system_settings (global config)                        │
│  └─ admin_activity_log (audit trail)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Journey Flows

### Flow 1: Free User - First Visit

```
1. User arrives at site
   └─→ No login required (public access)
   
2. Opens Smart Wizard
   └─→ Sees only FREE tier use cases:
       • EV Charging
       • Data Center  
       • Manufacturing
       • Car Wash 🚗
       • Hotel 🏨
   
3. Selects "Car Wash"
   └─→ System loads template:
       • 35 kW typical load
       • 48 kW peak load
       • Custom questions appear:
         - "How many wash bays?" (default: 4)
         - "Cars per day?" (default: 100)
         - "Detailing services?" (Yes/No)
   
4. Answers questions
   └─→ Bays: 6 → Power scales 1.5x
   └─→ Detailing: Yes → +10 kW
   └─→ New total: 62.5 kW typical
   
5. Completes wizard
   └─→ Sees financial results
   └─→ Dancing Merlin celebrates! 🪄
   └─→ "Save this quote?" → "Upgrade to save!"
   
6. Quotes remaining: 2 of 3
```

### Flow 2: Premium User - Power User

```
1. User logs in
   └─→ System checks tier: PREMIUM
   
2. Dashboard shows:
   └─→ "Welcome back! You have 12 saved quotes"
   └─→ Recent quotes portfolio
   
3. Opens Smart Wizard
   └─→ Sees ALL use cases (30+):
       • Free tier cases (5)
       • Semi-premium (10)
       • Premium exclusive (15):
         - Airport ✈️
         - Cannabis Grow 🌿
         - Brewery 🍺
         - Ice Rink ⛸️
         - etc.
   
4. Selects "Airport"
   └─→ Complex template loads:
       • 2,500 kW typical
       • 4,000 kW peak
       • Custom questions:
         - "Annual passengers?" (millions)
         - "Number of terminals?"
         - "Ground vehicle fleet?"
   
5. Uses Advanced Mode
   └─→ All 9 steps available
   └─→ Detailed configurations
   
6. Completes wizard
   └─→ Full results with transparency
   └─→ Dancing Merlin! 🪄
   └─→ Exports:
       • Word with appendix ✅
       • Excel with formulas ✅
       • Calculation details ✅
   
7. Saves quote to portfolio
   └─→ Names it "LAX Terminal 2 Expansion"
   └─→ Can compare with other saved quotes
   
8. Unlimited quotes remaining
```

### Flow 3: Admin - Adding New Use Case

```
1. Admin logs in
   └─→ System recognizes admin tier
   └─→ Shows admin panel button
   
2. Opens Admin Panel
   └─→ Dashboard shows:
       • 1,247 total users
       • 145 quotes today
       • $3,613 MRR
   
3. Goes to "Use Case Manager"
   └─→ Sees all existing templates
   └─→ Clicks "+ Create New Use Case"
   
4. Use Case Template Builder opens:
   
   Basic Info:
   ├─ Name: "Brewery"
   ├─ Icon: 🍺
   ├─ Category: Industrial
   └─ Required Tier: Semi-Premium
   
   Power Profile:
   ├─ Typical Load: 120 kW
   ├─ Peak Load: 180 kW
   ├─ Profile Type: Peaked
   ├─ Operating Hours: 16 hrs/day
   └─ Seasonal: 1.2x (summer)
   
   Equipment:
   ├─ Brewing Kettles: 60 kW, 0.7 duty
   ├─ Refrigeration: 40 kW, 0.9 duty
   ├─ Packaging Line: 25 kW, 0.5 duty
   └─ HVAC: 20 kW, 0.6 duty
   
   Financial:
   ├─ Demand Sensitivity: 1.4
   ├─ Energy Multiplier: 1.1
   ├─ Expected Savings: 27%
   └─ ROI Factor: 0.90
   
   Custom Questions:
   ├─ Q1: "Annual production (barrels)?"
   │   └─→ Impacts: System size
   ├─ Q2: "Bottling or kegging?"
   │   └─→ Impacts: Equipment power
   └─ Q3: "On-site taproom?"
       └─→ Adds: +15 kW if yes
   
5. Clicks "Test Financial Model"
   └─→ Runs sample calculation
   └─→ Shows expected ROI: 6.2 years
   └─→ Looks good! ✅
   
6. Clicks "Save Use Case"
   └─→ Template saved to database
   └─→ Activity logged
   └─→ Instantly available to semi-premium users
   
7. Admin sees in activity log:
   └─→ "Created use case 'Brewery' at 2:47 PM"
   └─→ "Assigned to tier: semi_premium"
   
8. Next day:
   └─→ Dashboard shows: "Brewery used 8 times!"
   └─→ Analytics: Average savings 26.8%
   └─→ User feedback: "Great feature!"
```

---

## 🎭 Tier Comparison Matrix

```
┌────────────────────────────────────────────────────────────┐
│                  Feature Availability                       │
├──────────────┬──────┬──────────────┬─────────┬────────────┤
│   Feature    │ Free │ Semi-Premium │ Premium │   Admin    │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Wizard       │  ✅  │      ✅      │   ✅    │     ✅     │
│ Simple Mode  │  ✅  │      ✅      │   ✅    │     ✅     │
│ Advanced     │  ❌  │      ✅      │   ✅    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Use Cases    │  5   │      15      │   30+   │    All     │
│  - Car Wash  │  ✅  │      ✅      │   ✅    │     ✅     │
│  - Hotel     │  ✅  │      ✅      │   ✅    │     ✅     │
│  - Indoor Farm│ ❌  │      ✅      │   ✅    │     ✅     │
│  - Airport   │  ❌  │      ❌      │   ✅    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Quotes/Month │  3   │      25      │    ∞    │     ∞      │
│ Save Quotes  │  ❌  │      5       │    ∞    │     ∞      │
│ Portfolio    │  ❌  │      ✅      │   ✅    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Exports      │      │              │         │            │
│  - Word      │  ❌  │      ✅      │   ✅    │     ✅     │
│  - Excel     │  ❌  │      ❌      │   ✅    │     ✅     │
│  - PDF       │  ❌  │      ❌      │   ✅    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Calculations │      │              │         │            │
│  - View      │  ❌  │      Basic   │   Full  │    Full    │
│  - Export    │  ❌  │      ❌      │   ✅    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Vendor Upload│  ❌  │      ❌      │   ✅    │     ✅     │
│ API Access   │  ❌  │      ❌      │   ❌    │     ✅     │
│ White Label  │  ❌  │      ❌      │   ✅    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Admin Panel  │  ❌  │      ❌      │   ❌    │     ✅     │
│ Analytics    │  ❌  │      ❌      │   ❌    │     ✅     │
│ Manage Users │  ❌  │      ❌      │   ❌    │     ✅     │
│ Create Cases │  ❌  │      ❌      │   ❌    │     ✅     │
├──────────────┼──────┼──────────────┼─────────┼────────────┤
│ Price/Month  │ FREE │     $19      │   $49   │     N/A    │
└──────────────┴──────┴──────────────┴─────────┴────────────┘
```

---

## 🗂️ Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     Database Structure                       │
└─────────────────────────────────────────────────────────────┘

         users                    use_cases
    ┌──────────────┐         ┌──────────────────┐
    │ id (PK)      │         │ id (PK)          │
    │ email        │         │ name             │
    │ tier    ─────┼────┐    │ slug             │
    │ quotes_count │    │    │ required_tier    │
    │ max_quotes   │    │    │ power_profile    │
    │ can_export   │    │    │ equipment        │
    │ ...          │    │    │ financial_params │
    └──────┬───────┘    │    │ custom_questions │
           │            │    │ created_by (FK)──┼─┐
           │            │    │ usage_count      │ │
           │            │    └──────────────────┘ │
           │            │                          │
           │            │                          │
           │      Tier Access Control             │
           │            │                          │
           │            ▼                          │
           │    ┌──────────────────┐              │
           │    │ Tier Hierarchy:  │              │
           │    │ free = 0         │              │
           │    │ semi_premium = 1 │              │
           │    │ premium = 2      │              │
           │    │ admin = 3        │              │
           │    └──────────────────┘              │
           │                                       │
           │                                       │
           │         saved_quotes                  │
           │    ┌──────────────────┐              │
           └───→│ id (PK)          │              │
                │ user_id (FK)     │              │
                │ quote_name       │              │
                │ use_case_id (FK) │◄─────────────┘
                │ configuration    │
                │ financial_results│
                │ share_token      │
                └──────────────────┘


         system_settings          admin_activity_log
    ┌──────────────────┐      ┌──────────────────────┐
    │ key (PK)         │      │ id (PK)              │
    │ value            │      │ admin_id (FK)───────┐│
    │ description      │      │ action               ││
    │ updated_by (FK)──┼──┐   │ target_type          ││
    └──────────────────┘  │   │ target_id            ││
                          │   │ changes              ││
                          │   │ timestamp            ││
                          │   └──────────────────────┘│
                          │                            │
                          └────────────────────────────┘
                                Points back to users
```

---

## 🔒 Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Row Level Security (RLS)
├─ Users can only see their own data
├─ Quotes filtered by user_id
├─ Use cases filtered by tier
└─ Admins bypass all restrictions

Layer 2: Application Logic
├─ Tier checking before feature access
├─ Quote count validation
├─ Export permission checking
└─ Admin panel route protection

Layer 3: API Validation
├─ JWT token verification
├─ Rate limiting per tier
├─ Input sanitization
└─ SQL injection prevention

Example Query (Auto-Filtered):
┌────────────────────────────────────────────┐
│ SELECT * FROM saved_quotes;                │
│                                            │
│ RLS Policy automatically adds:             │
│ WHERE user_id = auth.uid()                 │
│    OR is_public = true                     │
│                                            │
│ User only sees their quotes!               │
└────────────────────────────────────────────┘
```

---

## 📊 Use Case Template Structure

```
Use Case Template (JSON in Database)
└─────────────────────────────────────┐
                                      │
    Basic Information                 │
    ├─ name: "Car Wash"              │
    ├─ icon: 🚗                       │
    ├─ slug: "car-wash"              │
    ├─ category: "commercial"         │
    ├─ requiredTier: "free"          │
    └─ displayOrder: 1                │
                                      │
    Power Profile                     │
    ├─ typicalLoadKw: 35             │
    ├─ peakLoadKw: 48                │
    ├─ profileType: "peaked"          │
    ├─ dailyOperatingHours: 12       │
    └─ seasonalVariation: 1.2        │
                                      │
    Equipment Array                   │
    ├─ [0] Wash Bay                  │
    │   ├─ powerKw: 25               │
    │   ├─ dutyCycle: 0.7            │
    │   └─ description: "..."         │
    ├─ [1] Water Heater              │
    │   ├─ powerKw: 15               │
    │   └─ ...                        │
    └─ [2] Vacuum System             │
        └─ ...                        │
                                      │
    Financial Parameters              │
    ├─ demandChargeSensitivity: 1.3  │
    ├─ energyCostMultiplier: 1.0     │
    ├─ typicalSavingsPercent: 25     │
    ├─ roiAdjustmentFactor: 0.95     │
    └─ incentives: {...}             │
                                      │
    Custom Questions                  │
    ├─ [0] "How many bays?"          │
    │   ├─ type: "number"            │
    │   ├─ default: 4                │
    │   ├─ impactType: "multiplier"   │
    │   └─ impactsField: "power"     │
    ├─ [1] "Cars per day?"           │
    │   └─ ...                        │
    └─ [2] "Detailing?"              │
        └─ ...                        │
                                      │
    Recommended Applications          │
    ├─ [0] "peak_shaving"            │
    └─ [1] "demand_response"         │
                                      │
    Metadata                          │
    ├─ createdBy: admin_uuid         │
    ├─ createdAt: timestamp          │
    ├─ usageCount: 89                │
    └─ averageROI: 133%              │
                                      │
└─────────────────────────────────────┘
```

---

## 🎬 Complete Feature Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Merlin BESS Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PUBLIC FEATURES (No Login)                                 │
│  ├─ Landing page                                            │
│  ├─ Smart Wizard (limited)                                  │
│  ├─ 3 free quotes                                           │
│  └─ Dancing Merlin celebration 🪄                           │
│                                                              │
│  USER FEATURES (Logged In)                                  │
│  ├─ Tier-based access                                       │
│  ├─ Save quotes to portfolio                                │
│  ├─ Export to Word/Excel                                    │
│  ├─ Calculation transparency                                │
│  ├─ Advanced wizard mode                                    │
│  ├─ Custom use cases                                        │
│  └─ Quote comparison tool                                   │
│                                                              │
│  ADMIN FEATURES (Admin Only)                                │
│  ├─ Dashboard                                               │
│  │   ├─ User statistics                                     │
│  │   ├─ Revenue metrics                                     │
│  │   ├─ Quote analytics                                     │
│  │   └─ Activity logs                                       │
│  │                                                          │
│  ├─ User Management                                         │
│  │   ├─ View all users                                      │
│  │   ├─ Change user tiers                                   │
│  │   ├─ Reset quote limits                                  │
│  │   └─ Disable accounts                                    │
│  │                                                          │
│  ├─ Use Case Manager                                        │
│  │   ├─ View all templates                                  │
│  │   ├─ Create new use case                                 │
│  │   ├─ Edit existing cases                                 │
│  │   ├─ Test financial models                               │
│  │   ├─ Set tier requirements                               │
│  │   └─ View usage statistics                               │
│  │                                                          │
│  ├─ System Settings                                         │
│  │   ├─ Configure tier limits                               │
│  │   ├─ Set pricing                                         │
│  │   ├─ Enable/disable features                             │
│  │   ├─ Maintenance mode                                    │
│  │   └─ Global configurations                               │
│  │                                                          │
│  └─ Analytics                                               │
│      ├─ Popular use cases                                   │
│      ├─ Conversion funnels                                  │
│      ├─ User engagement                                     │
│      └─ Revenue forecasting                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Services Architecture

### Baseline Calculation Service (Phase 24 Migration)

**Problem Solved**: Previously had dual baseline systems (hardcoded vs database) that could diverge.

**Solution**: Unified baseline service that ensures 100% consistency.

```
┌─────────────────┐           ┌──────────────────┐
│ SmartWizardV2   │           │ AI Optimization  │
│                 │           │ Service          │
└────────┬────────┘           └────────┬─────────┘
         │                              │
         │ Import shared service        │ Import shared service
         └──────────┬───────────────────┘
                    ▼
          ┌───────────────────┐
          │ baselineService   │
          │ (Single Source)   │
          └─────────┬─────────┘
                    │
                    │ Query
                    ▼
              ┌────────────┐
              │  Supabase  │
              │  Database  │
              └────────────┘
         ✅ Always consistent!
```

**Key Functions**:

1. **`calculateDatabaseBaseline(template, scale, useCaseData)`**
   - Queries Supabase `use_cases` and `use_case_configurations` tables
   - Applies scale factors (e.g., 100 rooms = 2x baseline for 50-room hotel)
   - Returns: `{ powerMW, durationHrs, solarMW, description, dataSource }`
   - Special handling for EV charging with charger specifications

2. **`calculateEVChargingBaseline(useCaseData)`**
   - Calculates from Level 2 and DC Fast charger counts
   - Applies concurrency factors (70% peak usage)
   - Example: 100 L2 (11kW) + 20 DC Fast (150kW) = ~1.9 MW recommended

3. **`getFallbackBaseline(template)`**
   - Safety mechanism when database unavailable
   - Hardcoded values for 5 major use cases
   - Ensures system never crashes

**Benefits**:
- ✅ Wizard and AI always use identical baselines
- ✅ Database becomes single source of truth
- ✅ Easy to add new use cases (just update database)
- ✅ No code deployment needed for baseline changes
- ✅ Comprehensive logging for debugging

**Files**:
- `/src/services/baselineService.ts` - Shared calculation service
- `/src/utils/industryBaselines.ts` - ⚠️ DEPRECATED (kept for reference)
- `/src/services/aiOptimizationService.ts` - Uses shared service
- `/src/components/wizard/SmartWizardV2.tsx` - Uses shared service

**Documentation**:
- See `BASELINE_SERVICE_MIGRATION.md` for detailed migration notes
- See `TESTING_BASELINE_MIGRATION.md` for testing guide

---

## 🎯 Implementation Status

```
✅ COMPLETE:
├─ Dancing Merlin video
├─ Use case template types
├─ Template database (5 cases)
├─ Database schema design
├─ SQL migration scripts
├─ Security policies
├─ Setup documentation
├─ Baseline service migration (Phase 24)
├─ AI optimization integration
└─ Centralized financial calculations

⏳ NEXT (After Supabase):
├─ Database connection
├─ Auth UI (login/signup)
├─ Tier checking middleware
├─ Quote saving feature
└─ Portfolio view

🔮 FUTURE:
├─ Admin panel UI
├─ Use case creator
├─ Analytics dashboard
├─ Vendor quote upload
├─ White-label reports
└─ Mobile app
```

---

This architecture supports:
- 🚀 Rapid scaling (1 to 100,000 users)
- 💰 Revenue growth (free → premium conversion)
- 🎨 Easy customization (admin-controlled use cases)
- 🔒 Enterprise security (RLS, JWT, audit logs)
- 📊 Data insights (analytics, usage tracking)
- 🤖 AI-powered recommendations (consistent with wizard)

**Ready to build it!** 🎉
