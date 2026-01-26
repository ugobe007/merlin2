# Wizard Transformation Architecture
**Visual Guide to Systematic Industry Questionnaire Framework**

---

## Current Architecture (Already Built ✅)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WizardV6.tsx (Production)                           │
│                        Route: /wizard, /wizard-v6                            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Step 1: Location        │
                    │ Step 2: Industry Select │
                    └─────────────┬───────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 3: QUESTIONNAIRE                               │
│                                                                             │
│  Step3Details.tsx (thin wrapper)                                            │
│    └→ Step3Integration.tsx (SSOT enforcer)                                  │
│        ├→ Detects industry (23 industries)                                  │
│        ├→ Loads questions from database                                     │
│        └→ Calls industry calculator if available                            │
│            ├→ calculateCarWashMetrics() ✅ DONE                             │
│            ├→ calculateHotelMetrics() ⏳ TODO                               │
│            ├→ calculateOfficeMetrics() ⏳ TODO                              │
│            └→ calculate{Industry}Metrics() ⏳ TODO (x20)                    │
│                                                                             │
│  CompleteStep3Component.tsx (renders questions)                             │
│    └→ CompleteQuestionRenderer.tsx (12 question types)                      │
│        └→ Reads from: custom_questions table                                │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase)                                      │
│                                                                             │
│  custom_questions table:                                                    │
│  ├─ 23 industries                                                           │
│  ├─ 13-34 questions per industry (varies wildly)                            │
│  ├─ 5 industries have duplicate bugs                                        │
│  └─ Only car-wash uses new 16Q pattern ✅                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Target Architecture (Systematic Framework)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL 16Q FRAMEWORK                                  │
│                    (Applied to ALL 23 industries)                           │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
    ┌──────────────────────┐          ┌──────────────────────┐
    │ QUESTION TEMPLATES   │          │ CALCULATOR SERVICES  │
    │ (6-8 sections)       │          │ (23 calculators)     │
    ├──────────────────────┤          ├──────────────────────┤
    │ 1. Topology          │◄────────►│ calculate{X}16Q()    │
    │ 2. Infrastructure    │          │                      │
    │ 3. Equipment         │          │ ✅ carWash16Q        │
    │ 4. Operations        │          │ ⏳ hotel16Q          │
    │ 5. Financial         │          │ ⏳ office16Q         │
    │ 6. Resilience        │          │ ⏳ hospital16Q       │
    │ 7. Planning (opt)    │          │ ⏳ +19 more          │
    └──────────────────────┘          └──────────────────────┘
                  │                               │
                  │    ┌────────────────────────┐ │
                  └───►│ INTEGRATION LAYERS     │◄┘
                       │ (23 integration files) │
                       ├────────────────────────┤
                       │ carWashIntegration.ts  │ ✅ DONE
                       │ hotelIntegration.ts    │ ⏳ TODO
                       │ officeIntegration.ts   │ ⏳ TODO
                       │ +20 more               │ ⏳ TODO
                       └────────────┬───────────┘
                                    │
                                    ▼
                       ┌────────────────────────┐
                       │ Step3Integration.tsx   │
                       │ (Central dispatcher)   │
                       │                        │
                       │ if (industry === X)    │
                       │   call calculate{X}()  │
                       └────────────┬───────────┘
                                    │
                                    ▼
                       ┌────────────────────────┐
                       │ WizardV6.tsx           │
                       │ (Power metrics update) │
                       │                        │
                       │ Uses calculator result │
                       │ NOT hardcoded values   │
                       └────────────────────────┘
```

---

## 16Q Question Framework Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        16 QUESTION FRAMEWORK                                │
│                    (Adaptable to ANY industry)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SECTION 1: TOPOLOGY (Identity + Scale)                                    │
│  ├─ Q1: Industry-specific type/class                                       │
│  │   Examples: Car wash type, Hotel class, Office building class           │
│  │   Purpose: Sets baseline load profile                                   │
│  │                                                                          │
│  └─ Q2: Scale/units                                                         │
│      Examples: Bays/tunnels, Room count, Square footage, Bed count         │
│      Purpose: Multiplier for concurrency                                   │
│                                                                             │
│  SECTION 2: INFRASTRUCTURE (Electrical Constraints) - UNIVERSAL             │
│  ├─ Q3: Electrical service size                                            │
│  │   Options: 200A (48kW), 400A (96kW), 600A (144kW), 800A+ (192kW)       │
│  │   Purpose: Upper bound constraint for BESS + charger sizing            │
│  │                                                                          │
│  └─ Q4: Voltage level                                                       │
│      Options: 208V, 240V, 277/480V, mixed, not sure                        │
│      Purpose: PCS compatibility + inverter selection                       │
│                                                                             │
│  SECTION 3: EQUIPMENT (Bottom-up Load Reconstruction)                      │
│  ├─ Q5: Primary equipment (multi-select, industry-specific)                │
│  │   Car wash: Pumps, blowers, water heaters, vacuum stations             │
│  │   Hotel: HVAC, water heaters, kitchen, laundry, pool, elevators        │
│  │   Office: HVAC, lighting, elevators, server room, kitchen              │
│  │   Purpose: Identify resistive vs inductive loads                        │
│  │                                                                          │
│  ├─ Q6: Largest motor size                                                  │
│  │   Options: <10 HP (7kW), 10-25 HP (18kW), 25-50 HP (37kW), ...         │
│  │   Purpose: Peak surge modeling + soft-start requirements                │
│  │                                                                          │
│  └─ Q7: Simultaneous equipment operation                                    │
│      Options: 1-2 (50%), 3-4 (75%), 5-7 (90%), 8+ (100%)                  │
│      Purpose: True peak load (not nameplate fantasy)                       │
│                                                                             │
│  SECTION 4: OPERATIONS (Throughput + Schedule)                             │
│  ├─ Q8: Daily throughput (units served/processed)                          │
│  │   Car wash: Cars per day                                                │
│  │   Hotel: Occupied rooms                                                 │
│  │   Restaurant: Customers per day                                         │
│  │   Purpose: Energy throughput + ROI + duty cycle                         │
│  │                                                                          │
│  ├─ Q9: Peak hour throughput                                                │
│  │   Purpose: Short-term peak demand modeling                              │
│  │                                                                          │
│  ├─ Q10: Cycle/service duration                                             │
│  │   Car wash: Wash cycle (3-5 min)                                        │
│  │   Hotel: Guest stay (2-3 days)                                          │
│  │   Restaurant: Meal service (1-2 hours)                                  │
│  │   Purpose: Converts throughput → kWh → load curve                       │
│  │                                                                          │
│  └─ Q11: Operating hours per day                                            │
│      Options: <8, 8-12, 12-18, 18-24 hours/day                            │
│      Purpose: Load spreading + arbitrage logic                             │
│                                                                             │
│  SECTION 5: FINANCIAL (ROI Calibration) - UNIVERSAL                        │
│  ├─ Q12: Monthly electricity spend                                         │
│  │   Options: <$1k, $1-3k, $3-7.5k, $7.5-15k, $15k+, not sure            │
│  │   Purpose: ROI anchor + catches hidden loads                            │
│  │                                                                          │
│  └─ Q13: Utility rate structure                                             │
│      Options: Flat (0.5x), TOU (0.8x), Demand (1.0x), TOU+Demand (1.2x)   │
│      Purpose: Real savings vs cosmetic benefits                            │
│                                                                             │
│  SECTION 6: RESILIENCE (Backup Requirements) - UNIVERSAL                   │
│  ├─ Q14: Power quality issues (multi-select)                               │
│  │   Options: Breaker trips, voltage sag, utility penalties, brownouts    │
│  │   Purpose: Power conditioning + resilience positioning                  │
│  │                                                                          │
│  └─ Q15: Outage sensitivity                                                 │
│      Options: Operations stop (4h), Partial (2h), Minor (1h), None (0h)   │
│      Purpose: Backup runtime requirement + resilience ROI                  │
│                                                                             │
│  SECTION 7: PLANNING (Future-proofing) - OPTIONAL                          │
│  └─ Q16: Expansion plans (multi-select, industry-specific)                 │
│      Car wash: Add bay (+50kW), larger equipment (+30kW), EV (+50kW)      │
│      Hotel: Add rooms (+5kW/room), pool (+40kW), EV (+50kW)               │
│      Purpose: Prevents BESS undersizing trap                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Calculator Service Pattern

```typescript
┌─────────────────────────────────────────────────────────────────────────────┐
│                    calculate{Industry}16Q()                                 │
│                    (SSOT calculator service)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT: {Industry}16QInput                                                  │
│  ├─ Section 1: Topology (type, scale)                                      │
│  ├─ Section 2: Infrastructure (service size, voltage)                      │
│  ├─ Section 3: Equipment (equipment list, motors, concurrency)             │
│  ├─ Section 4: Operations (throughput, hours, duration)                    │
│  ├─ Section 5: Financial (bill, rate structure)                            │
│  ├─ Section 6: Resilience (quality issues, outage sensitivity)             │
│  └─ Section 7: Planning (expansion plans)                                  │
│                                                                             │
│  ↓ CALCULATION FLOW ↓                                                       │
│                                                                             │
│  STEP 1: Parse Topology                                                     │
│  ├─ Map type → baseline kW profile                                         │
│  └─ Map scale → unit multiplier                                            │
│                                                                             │
│  STEP 2: Equipment Load Reconstruction                                     │
│  ├─ Sum equipment kW from multi-select                                     │
│  ├─ Add largest motor surge capacity                                       │
│  └─ Apply concurrency factor (50-100%)                                     │
│      Result: TRUE PEAK DEMAND (kW)                                         │
│                                                                             │
│  STEP 3: Energy Throughput                                                  │
│  ├─ Daily throughput × service duration → daily kWh                        │
│  ├─ Daily kWh × 365 → annual kWh                                           │
│  └─ Operating hours → load spreading factor                                │
│      Result: ANNUAL ENERGY (kWh)                                           │
│                                                                             │
│  STEP 4: BESS Sizing (TrueQuote™)                                          │
│  ├─ If primary goal = peak shaving: 0.40 × peak kW                         │
│  ├─ If primary goal = arbitrage: 0.50 × peak kW                            │
│  ├─ If primary goal = resilience: 0.70 × peak kW                           │
│  ├─ Duration: 4 hours (industry standard)                                  │
│  └─ Expansion buffer: +10-30% based on Q16                                 │
│      Result: BESS_KW, BESS_KWH with sources                                │
│                                                                             │
│  STEP 5: Financial Modeling                                                │
│  ├─ Estimate demand charge: peak kW × $15-25/kW                            │
│  ├─ Demand savings: BESS_KW × demand charge × rate structure multiplier    │
│  ├─ Energy arbitrage: (if TOU) kWh shifted × rate delta                   │
│  └─ Total annual savings → simple payback                                  │
│      Result: FINANCIAL METRICS                                             │
│                                                                             │
│  STEP 6: Confidence Scoring                                                │
│  ├─ Electrical service known? +0.2                                         │
│  ├─ Monthly bill known? +0.2                                               │
│  ├─ Equipment list detailed? +0.2                                          │
│  ├─ Throughput data provided? +0.2                                         │
│  └─ Motor size specified? +0.2                                             │
│      Result: CONFIDENCE (0-1)                                              │
│                                                                             │
│  STEP 7: Audit Trail (TrueQuote™)                                          │
│  ├─ Calculation methodology documented                                     │
│  ├─ All assumptions listed                                                 │
│  └─ Sources cited (NREL, IEEE, ASHRAE, etc.)                               │
│                                                                             │
│  OUTPUT: {Industry}16QResult                                                │
│  ├─ peakDemandKW: number                                                   │
│  ├─ dailyEnergyKWh: number                                                 │
│  ├─ annualEnergyKWh: number                                                │
│  ├─ bessRecommendedKW: number                                              │
│  ├─ bessRecommendedKWh: number                                             │
│  ├─ bessRationale: string                                                  │
│  ├─ estimatedDemandCharge: number                                          │
│  ├─ potentialDemandSavings: number                                         │
│  ├─ totalAnnualSavings: number                                             │
│  ├─ simplePaybackYears: number                                             │
│  ├─ confidence: number (0-1)                                               │
│  ├─ confidenceFactors: string[]                                            │
│  ├─ calculationMethod: string                                              │
│  ├─ assumptions: string[]                                                  │
│  └─ sources: string[]                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Flow (Real-time Updates)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                USER FILLS OUT QUESTIONNAIRE                                 │
│                (Step 3 in WizardV6)                                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼ (each answer change)
                    ┌─────────────────────────┐
                    │ CompleteStep3Component  │
                    │ - Captures answer       │
                    │ - Updates state         │
                    └─────────────┬───────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ Step3Integration.tsx    │
                    │ - Detects industry      │
                    │ - Debounces updates     │
                    └─────────────┬───────────┘
                                  │
                                  ▼
        ┌───────────────────────────────────────────┐
        │ Is industry calculator available?         │
        └─────┬──────────────────────┬──────────────┘
              │ YES                  │ NO
              ▼                      ▼
┌──────────────────────────┐  ┌────────────────────┐
│ calculate{Industry}()    │  │ Use fallback       │
│ - Maps answers to input  │  │ - Generic formula  │
│ - Calls 16Q calculator   │  │ - No customization │
│ - Returns power metrics  │  └────────────────────┘
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│ updateState({                                    │
│   useCaseData: {                                 │
│     {industry}Metrics: {                         │
│       peakDemandKW: 120,                         │
│       bessRecommendedKW: 48,   ◄── Real-time    │
│       bessRecommendedKWh: 192,                   │
│       confidence: 0.85                           │
│     }                                            │
│   }                                              │
│ })                                               │
└─────────────┬────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│ WizardV6 Power Gauge Updates                     │
│ - Peak demand shows 120 kW                       │
│ - BESS sizing shows 48 kW / 192 kWh             │
│ - Confidence indicator: 85%                      │
└──────────────────────────────────────────────────┘
```

---

## Migration Workflow (Per Industry)

```
START: Pick industry from priority list
  │
  ▼
┌────────────────────────────────────────┐
│ STEP 1: Analysis (30 min)             │
│ - Review existing questions            │
│ - Map to 16Q framework                 │
│ - Document industry specifics          │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ STEP 2: SQL Migration (1 hour)        │
│ - Create migration file                │
│ - DELETE old questions                 │
│ - INSERT 16 new questions              │
│ - Test on dev database                 │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ STEP 3: Calculator Service (2 hours)  │
│ - Create {industry}16QCalculator.ts    │
│ - Implement calculation logic          │
│ - Add confidence scoring               │
│ - Add TrueQuote™ audit trail           │
│ - Write unit tests                     │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ STEP 4: Integration Layer (1 hour)    │
│ - Create {industry}Integration.ts      │
│ - Map answers → calculator input       │
│ - Add to Step3Integration.tsx          │
│ - Test console output                  │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ STEP 5: WizardV6 Integration (30 min) │
│ - Find hardcoded values (grep)         │
│ - Replace with calculator result       │
│ - Add graceful fallback                │
│ - Test power gauge updates             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ STEP 6: Testing (2 hours)             │
│ - Build passes ✅                      │
│ - SSOT audit passes ✅                 │
│ - Manual smoke test ✅                 │
│ - PDF export works ✅                  │
│ - Other industries OK ✅               │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ STEP 7: Deploy (1 hour)               │
│ - Merge to staging                     │
│ - Deploy staging                       │
│ - Smoke test staging                   │
│ - Deploy production                    │
│ - Monitor logs 48h                     │
└────────────────┬───────────────────────┘
                 │
                 ▼
              SUCCESS ✅
                 │
                 ▼
         Next industry ──┐
                         │
                         └──► REPEAT for 22 more
```

**Total time per industry:** 1 business day (8 hours)  
**Total project time:** 23 days (4-5 weeks if parallel)

---

## Phased Rollout Schedule

```
WEEK 1: Infrastructure + Bug Fixes
├─ Fix 5 duplicate display_order bugs
├─ Create calculator template
├─ Create migration generator script
└─ Set up feature flags

WEEKS 2-3: High-Revenue Industries (Priority 1)
├─ Week 2: Hotel, Hospital
└─ Week 3: Data Center, Office, Manufacturing

WEEKS 4-6: Premium Tier (Priority 2)
├─ Week 4: Airport, Casino
├─ Week 5: College, Government
└─ Week 6: Microgrid

WEEKS 7-12: Free Tier (Priority 3)
├─ Week 7: Apartment, Retail
├─ Week 8: Warehouse, Gas Station
├─ Week 9: Shopping Center, EV Charging
├─ Week 10: Indoor Farm, Agricultural
├─ Week 11: Cold Storage, Residential
└─ Week 12: Restaurant, Heavy Duty Truck Stop
```

---

**Status:** Architecture Design Complete  
**Next Step:** Get approval for phased rollout strategy

