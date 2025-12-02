# Merlin Strategic Roadmap: Dual-Path Architecture

**Last Updated:** December 1, 2025  
**Purpose:** Master plan for Merlin platform development  
**⚠️ AI AGENTS: Read this file to understand the business strategy!**

---

## 🎯 THE VISION

Merlin is a **platform/engine** that powers:
1. **Merlin Pro** - Advanced quote builder for energy professionals
2. **SMB Verticals** - White-label sites for specific industries

```
┌─────────────────────────────────────────────────────────────────┐
│                    MERLIN ENGINE (Core)                         │
│         unifiedQuoteCalculator.ts = SINGLE SOURCE OF TRUTH      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────┐                   ┌───────────────────────┐
│   MERLIN PRO      │                   │   SMB VERTICALS       │
│                   │                   │                       │
│ For Professionals:│                   │ • CarWashEnergy       │
│ • EPCs            │                   │ • HotelPower          │
│ • Integrators     │                   │ • EVChargingROI       │
│ • Battery cos     │                   │ • DataCenterPower     │
│ • Engineering     │                   │ • (Future verticals)  │
│                   │                   │                       │
│ merlinpro.energy  │                   │ "Powered by Merlin"   │
└───────────────────┘                   └───────────────────────┘
        │                                           │
        └─────────────────────┬─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  LEAD FLOW      │
                    │  SYSTEM         │
                    │                 │
                    │ Partner Network │
                    │ Lead Referrals  │
                    │ Revenue Share   │
                    └─────────────────┘
```

---

## 📅 PHASE 1: Foundation (Weeks 1-2)

### Goal: Stabilize the core engine that powers everything

### Technical Tasks:
- [ ] Fix broken buttons ("Build This Quote", "Generate Detailed Quote")
- [ ] Ensure all 18 use cases calculate correctly (field audit ✅ done)
- [ ] Solidify `unifiedQuoteCalculator.ts` as THE single calculation engine
- [ ] Clean up deprecated services
- [ ] Remove duplicate calculation paths

### Outcome:
**Rock-solid Merlin core that can power ANY front-end**

### Key File:
`src/services/unifiedQuoteCalculator.ts` - SINGLE SOURCE OF TRUTH

---

## 📅 PHASE 2: Merlin Pro - Advanced Quote Builder Revival (Weeks 3-5)

### Target Users:
- EPCs building proposals
- Battery sales teams
- Solar integrators adding storage
- Engineering firms

### Features:
1. **Financial Outputs** (the "knock your socks off" features)
   - NPV (Net Present Value)
   - IRR (Internal Rate of Return)
   - LCOE (Levelized Cost of Energy)
   - Sensitivity analysis
   - Bank/investor-ready PDF exports
   - Multi-scenario comparisons

2. **Multi-System Configuration**
   - BESS + Solar + Wind + Generator + Grid
   - Equipment vendor selection (CATL, LG, Great Power, etc.)

3. **Regional Intelligence**
   - Tariffs
   - Shipping costs
   - Labor rates by region

4. **Professional Exports**
   - Word templates
   - Excel templates
   - PDF quotes

### Branding Options:
- `merlinpro.energy`
- `merlinquotes.com`

### Revenue Model:
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 quotes/month |
| Pro | $99/month | Unlimited quotes |
| Enterprise | Custom | API access + white-label |

---

## 📅 PHASE 3: White-Label SMB Verticals (Weeks 6-10)

### Strategy: Capture the market before big players wake up

---

### Vertical 1: Car Wash Energy Savings

**Domain:** `carwashenergysavings.com`

**Landing Page:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO: "Cut Your Car Wash Energy Bills by 40%"             │
├─────────────────────────────────────────────────────────────┤
│  CALCULATOR:                                                │
│  • # of bays: [    ]                                        │
│  • Cars/day:  [    ]                                        │
│  • State:     [dropdown]                                    │
│  → INSTANT SAVINGS ESTIMATE                                 │
├─────────────────────────────────────────────────────────────┤
│  SOCIAL PROOF: "El Car Wash saved $47,000/year"            │
├─────────────────────────────────────────────────────────────┤
│  CTA: "Get Your Free Energy Assessment"                    │
└─────────────────────────────────────────────────────────────┘
```

**Flow:**
1. Owner enters: 4 bays, 200 cars/day, Florida
2. Merlin calculates: 0.5 MW / 2hr system, $180k cost, 3.2yr payback
3. Shows simple ROI graphic
4. Lead capture: Name, email, phone
5. Option: "Download detailed quote" or "Talk to an expert"

---

### Vertical 2: Hotel Power Independence

**Domain:** `hotelpowersavings.com`

**Landing Page:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO: "Never Lose a Guest to a Power Outage Again"        │
├─────────────────────────────────────────────────────────────┤
│  CALCULATOR:                                                │
│  • # rooms:     [    ]                                      │
│  • Amenities:   [x] Pool  [x] Restaurant  [x] EV chargers  │
├─────────────────────────────────────────────────────────────┤
│  DUAL VALUE PROP: Savings + Backup Power                   │
├─────────────────────────────────────────────────────────────┤
│  CTA: "Calculate Your Savings"                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Vertical 3: EV Charging ROI

**Domain:** `evchargingROI.com`

**Landing Page:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO: "Add EV Charging Without Blowing Up Your Electric   │
│         Bill"                                               │
├─────────────────────────────────────────────────────────────┤
│  CALCULATOR:                                                │
│  • # DC fast chargers: [    ]                               │
│  • # Level 2 chargers: [    ]                               │
│  • Daily sessions:     [    ]                               │
├─────────────────────────────────────────────────────────────┤
│  SHOWS: Demand charge impact + battery mitigation          │
├─────────────────────────────────────────────────────────────┤
│  CTA: "See Your True ROI"                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### Vertical 4: Data Center Resilience

**Domain:** `datacenterpower.com`

**Landing Page:**
```
┌─────────────────────────────────────────────────────────────┐
│  HERO: "Beyond Diesel: Modern Backup for Modern Data       │
│         Centers"                                            │
├─────────────────────────────────────────────────────────────┤
│  CALCULATOR:                                                │
│  • MW load:          [    ]                                 │
│  • Tier level:       [dropdown]                             │
│  • Uptime requirement: [    ]%                              │
├─────────────────────────────────────────────────────────────┤
│  SHOWS: Battery + generator hybrid vs diesel-only          │
├─────────────────────────────────────────────────────────────┤
│  CTA: "Design Your Resilience Strategy"                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 PHASE 4: Lead Flow System (Weeks 8-12)

### Goal: Connect SMB leads to Merlin Pro partners

### Architecture:
```
SMB Vertical Leads → Lead Flow System → Partner Network
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
            │  Certified   │         │   Battery    │         │    Solar     │
            │  Installers  │         │ Distributors │         │ Integrators  │
            │  (by region) │         │ CATL, LG etc │         │              │
            └──────────────┘         └──────────────┘         └──────────────┘
```

### Partner Network:
- Certified Merlin installers by region
- Battery distributors (CATL, LG, etc.)
- Solar integrators
- EPCs

### Revenue Model:
| Type | Amount |
|------|--------|
| Lead referral fee | $500-2,000 per qualified lead |
| Revenue share | 2-5% on closed deals |

---

## 📅 PHASE 5: Scale & Expand (Months 4-6)

### More Verticals:
- Airports
- Hospitals
- College campuses
- Manufacturing facilities
- Cold storage / warehouses
- Agriculture / indoor farms

### Geographic Expansion:
- UK/Europe pricing
- Middle East (huge solar + storage market)
- Australia

### Platform Features:
- Mobile app for field sales
- API for partners to embed Merlin
- White-label customization tools

---

## 🏗️ TECHNICAL ARCHITECTURE

### Single Source of Truth:
```
unifiedQuoteCalculator.ts
         │
         ├── calculateQuote()
         ├── estimatePayback()
         └── All financial calculations
```

### Database (Supabase):
- Use case templates
- Equipment pricing
- Regional data
- User quotes
- Partner network

### Key Services:
| Service | Purpose |
|---------|---------|
| `unifiedQuoteCalculator.ts` | All calculations |
| `centralizedCalculations.ts` | Financial metrics |
| `equipmentCalculations.ts` | Equipment pricing |
| `useCasePowerCalculations.ts` | Power requirements |
| `evChargingCalculations.ts` | EV-specific calcs |

---

## 🎯 PRIORITY RECOMMENDATIONS

### Immediate (This Week):
1. Fix broken buttons in current UI
2. Ensure unifiedQuoteCalculator works for all 18 use cases
3. Stabilize StreamlinedWizard flow

### Next Sprint:
1. Revive Merlin Pro financial outputs
2. Professional PDF export
3. Multi-scenario comparison

### Following Sprint:
1. Launch first SMB vertical (Car Wash)
2. Lead capture system
3. Partner onboarding

---

## 📝 CHANGELOG

### December 1, 2025
- ✅ Created this strategic roadmap document
- ✅ Documented 5-phase plan
- ✅ Defined SMB vertical landing pages
- ✅ Outlined revenue models
- ✅ Captured technical architecture

---

## ⚠️ FOR AI AGENTS

1. **Read this file** to understand the business strategy
2. **All calculations** go through `unifiedQuoteCalculator.ts`
3. **SMB verticals** are products powered by Merlin engine
4. **Merlin Pro** is for professionals (EPCs, integrators)
5. **Don't break** the single source of truth architecture
