# Merlin Energy Platform
## Transparent, Benchmark-Backed BESS Quoting

---

## Slide 1: Title Slide

# **Merlin Energy Platform**

### Transparent, Benchmark-Backed Battery Energy Storage System Quoting

**The First BESS Financial Analysis Platform Where Every Number is Traceable**

December 2025

---

## Slide 2: The Problem

# The BESS Quoting Challenge

### Current Market Problems:

- **Opacity**: Customers cannot verify how costs and savings were calculated
- **Inconsistency**: Different vendors use different assumptions without disclosure
- **Due Diligence Friction**: Financiers must independently verify every assumption
- **Trust Gap**: Sophisticated buyers question numbers without visible methodology

**Result**: Slower sales cycles, reduced trust, and financing delays

---

## Slide 3: Our Solution

# Merlin's Benchmark-Backed Approach

> **Every number in a Merlin quote is traceable to a documented, authoritative source.**

### Key Differentiators:

✅ **NREL ATB 2024 Alignment** - Equipment costs cite authoritative benchmarks  
✅ **StoreFAST Methodology** - Financial formulas align with NREL standards  
✅ **Source Attribution** - Every quote line item includes citations  
✅ **Audit-Ready** - Full metadata for project finance due diligence  
✅ **Deviation Detection** - Automatic flags when prices differ from benchmarks

---

## Slide 4: What is Merlin?

# Merlin: A Platform/Engine

```
┌─────────────────────────────────────────────────────────┐
│              MERLIN ENGINE (Core)                       │
│   unifiedQuoteCalculator.ts = SINGLE SOURCE OF TRUTH    │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐           ┌──────────────────────┐
│  MERLIN PRO   │           │   SMB VERTICALS      │
│               │           │                      │
│ For Pros:     │           │ • CarWashEnergy      │
│ • EPCs        │           │ • HotelPower         │
│ • Integrators │           │ • EVChargingROI      │
│ • Battery cos │           │ • DataCenterPower    │
│ • Engineering │           │                      │
└───────────────┘           └──────────────────────┘
```

---

## Slide 5: Authoritative Sources

# Built on Trusted Data

### Primary Sources (Highest Authority)

| Source | Organization | Application |
|--------|-------------|-------------|
| **Annual Technology Baseline (ATB)** | NREL | Battery, solar, wind capital costs |
| **StoreFAST** | NREL | LCOS methodology, financial modeling |
| **Cost Benchmark Reports** | NREL | Quarterly PV and storage cost updates |
| **ESS Program** | Sandia National Labs | Performance metrics, safety standards |
| **Grid Storage Assessment** | PNNL | Technology comparison, cost projections |

### Secondary Sources
- EIA Electric Power Monthly
- Lazard LCOS Analysis
- BloombergNEF Energy Storage Outlook

---

## Slide 6: Pricing Methodology

# Transparent Pricing Based on NREL ATB 2024

### Battery Energy Storage Pricing

| System Type | Price Range | Scenario | Citation |
|-------------|-------------|----------|----------|
| Utility-Scale (≥1 MW) | $100-175/kWh | Conservative-Advanced | ATB Table 6.1 |
| Commercial (100 kW-1 MW) | $200-350/kWh | Moderate | NREL Cost Benchmark Q1 2024 |
| Residential (<100 kW) | $400-600/kWh | Moderate | NREL Cost Benchmark Q1 2024 |

### Dynamic Pricing Factors:
- System size (scale-based pricing)
- Chemistry type
- Duration (hours)
- Geographic location
- Market conditions

---

## Slide 7: Key Features

# Comprehensive BESS Quoting Platform

### Financial Analysis
- **NPV** (Net Present Value)
- **IRR** (Internal Rate of Return)
- **LCOE** (Levelized Cost of Energy)
- **Payback Period**
- **Sensitivity Analysis**
- **Multi-Scenario Comparisons**

### System Configuration
- BESS + Solar + Wind + Generator + Grid
- Equipment vendor selection
- Regional intelligence (tariffs, shipping, labor)
- 18+ industry use cases

### Professional Exports
- Word templates
- Excel templates
- PDF quotes
- Bank/investor-ready packages

---

## Slide 8: Use Cases

# 18+ Industry Verticals Supported

### Commercial & Industrial
- Hotels & Hospitality
- Data Centers
- Manufacturing
- Cold Storage
- Office Buildings

### Transportation & Mobility
- EV Charging Stations
- Car Wash Facilities
- Fleet Operations

### Utilities & Grid
- Grid Services
- Peak Shaving
- Frequency Regulation
- Microgrids

### And More...
- Agriculture
- Healthcare
- Education
- Retail

---

## Slide 9: Merlin Pro

# For Energy Professionals

### Target Users:
- **EPCs** building proposals
- **Battery Sales Teams** closing deals
- **Solar Integrators** adding storage
- **Engineering Firms** designing systems

### Professional Features:
- Advanced financial modeling
- Multi-system configuration
- Regional intelligence
- Professional exports (Word, Excel, PDF)
- API access (Enterprise tier)

### Pricing:
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 quotes/month |
| Pro | $99/month | Unlimited quotes |
| Enterprise | Custom | API + white-label |

---

## Slide 10: SMB Verticals

# White-Label Industry Solutions

### Strategy: Capture the market before big players wake up

### Vertical Examples:

**CarWashEnergy**
- "Cut Your Car Wash Energy Bills by 40%"
- Simple calculator: # bays, cars/day, state
- Instant savings estimate

**HotelPower**
- "Never Lose a Guest to a Power Outage Again"
- Dual value: Savings + Backup Power
- Room count + amenities calculator

**EVChargingROI**
- "Add EV Charging Without Blowing Up Your Electric Bill"
- Demand charge impact + battery mitigation
- True ROI calculation

**DataCenterPower**
- "Beyond Diesel: Modern Backup for Modern Data Centers"
- Battery + generator hybrid analysis
- Tier-level resilience strategy

---

## Slide 11: Technical Architecture

# Single Source of Truth Architecture

```
unifiedQuoteCalculator.ts
         │
         ├── calculateQuote()
         ├── estimatePayback()
         ├── Financial calculations
         └── All quote generation
```

### Key Services:
- `unifiedQuoteCalculator.ts` - All calculations
- `centralizedCalculations.ts` - Financial metrics
- `equipmentCalculations.ts` - Equipment pricing
- `useCasePowerCalculations.ts` - Power requirements
- `evChargingCalculations.ts` - EV-specific calculations

### Database (Supabase):
- Use case templates
- Equipment pricing
- Regional data
- User quotes
- Partner network

---

## Slide 12: Lead Flow System

# Partner Network & Revenue Model

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

### Revenue Streams:
- **Lead Referral Fee**: $500-2,000 per qualified lead
- **Revenue Share**: 2-5% on closed deals
- **Subscription**: Pro and Enterprise tiers
- **White-Label**: Custom pricing for partners

---

## Slide 13: Competitive Advantages

# Why Merlin Wins

### 1. **Transparency**
   - Every number is traceable
   - Source attribution built-in
   - Audit-ready by design

### 2. **Authority**
   - NREL ATB 2024 alignment
   - StoreFAST methodology
   - Industry-standard benchmarks

### 3. **Completeness**
   - 18+ use cases
   - Multi-system configuration
   - Professional-grade outputs

### 4. **Speed**
   - Instant quotes
   - Automated calculations
   - Reduced due diligence time

### 5. **Scalability**
   - Platform architecture
   - White-label capability
   - API-first design

---

## Slide 14: Roadmap

# Strategic Development Plan

### Phase 1: Foundation ✅
- Stabilize core engine
- Fix calculation paths
- Ensure all use cases work

### Phase 2: Merlin Pro (Weeks 3-5)
- Advanced financial outputs
- Professional exports
- Multi-scenario comparisons

### Phase 3: SMB Verticals (Weeks 6-10)
- Launch CarWashEnergy
- Launch HotelPower
- Launch EVChargingROI
- Launch DataCenterPower

### Phase 4: Lead Flow System (Weeks 8-12)
- Partner network
- Lead routing
- Revenue share system

### Phase 5: Scale & Expand (Months 4-6)
- More verticals
- Geographic expansion
- Mobile app
- API platform

---

## Slide 15: Market Opportunity

# The BESS Market is Exploding

### Market Size:
- **$50B+** global BESS market by 2030
- **40%+ CAGR** in commercial/industrial segment
- **Growing demand** for transparent, auditable quotes

### Target Markets:
- **SMB Market**: $10B+ opportunity
  - Car washes, hotels, EV charging
  - Underserved by current solutions
  
- **Professional Market**: $20B+ opportunity
  - EPCs, integrators, engineering firms
  - Need for professional-grade tools

### Timing:
- **Early mover advantage** in SMB verticals
- **Growing trust gap** in current market
- **Regulatory push** for transparency

---

## Slide 16: Business Model

# Multiple Revenue Streams

### 1. Subscription Revenue
- **Merlin Pro**: $99/month per user
- **Enterprise**: Custom pricing
- **SMB Verticals**: Freemium model

### 2. Lead Generation
- **Referral Fees**: $500-2,000 per qualified lead
- **Revenue Share**: 2-5% on closed deals
- **Partner Network**: Certified installers, distributors

### 3. White-Label Licensing
- **Custom Branding**: For large partners
- **API Access**: For integrators
- **Platform Licensing**: For enterprise clients

### 4. Data & Intelligence
- **Market Reports**: Industry insights
- **Pricing Intelligence**: Benchmark data
- **Regional Analysis**: Tariff and policy data

---

## Slide 17: Technology Stack

# Modern, Scalable Architecture

### Frontend:
- **React + TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Component-based architecture**

### Backend:
- **Supabase** (PostgreSQL)
- **Real-time capabilities**
- **Row-level security**
- **API endpoints**

### Calculations:
- **TypeScript services**
- **Single source of truth**
- **NREL ATB 2024 integration**
- **StoreFAST methodology**

### Deployment:
- **Fly.io** hosting
- **CDN** for assets
- **Scalable infrastructure**

---

## Slide 18: Team & Resources

# Built for Scale

### Current State:
- **321 TypeScript files** in codebase
- **4.2 MB** of component code
- **1.5 MB** of services
- **Comprehensive documentation**

### Architecture:
- **Modular design** for easy expansion
- **API-first** approach
- **White-label ready**
- **Microservices-ready**

### Quality:
- **Type-safe** (TypeScript)
- **Tested** (Jest, Playwright)
- **Documented** (extensive docs)
- **Audit-ready** (source attribution)

---

## Slide 19: Call to Action

# Get Started with Merlin

### For Energy Professionals:
👉 **Try Merlin Pro** - Advanced quote builder  
👉 **Free tier available** - 3 quotes/month  
👉 **Upgrade to Pro** - Unlimited quotes, $99/month

### For Partners:
👉 **Join Partner Network** - Lead referrals  
👉 **White-Label Options** - Custom branding  
👉 **API Access** - Integrate Merlin into your platform

### For SMBs:
👉 **Use Industry Verticals** - CarWashEnergy, HotelPower, etc.  
👉 **Get Free Quotes** - Instant ROI calculations  
👉 **Connect with Installers** - Through our network

**Visit: merlin.energy**

---

## Slide 20: Contact & Next Steps

# Let's Build the Future of Energy Storage

### Contact Information:
- **Website**: merlin.energy
- **Email**: info@merlin.energy
- **Methodology**: methodology@merlin.energy

### Next Steps:
1. **Schedule a Demo** - See Merlin in action
2. **Request Access** - Try Merlin Pro
3. **Partner Inquiry** - Join our network
4. **Technical Deep Dive** - Review our methodology

### Resources:
- **Whitepaper**: Benchmark-Backed BESS Quoting Methodology
- **Documentation**: Complete technical docs
- **API Docs**: For developers

---

## Thank You

# Questions?

**Merlin Energy Platform**  
*Transparent, Benchmark-Backed BESS Quoting*

---

