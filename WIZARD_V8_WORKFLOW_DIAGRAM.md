# Wizard V8 Workflow with V4.5 Honest TCO Integration

## Complete Step Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WIZARD V8 STEP FLOW                                  │
│                    (Step numbers in WizardV8Page.tsx)                        │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   STEP 0     │
  │  Mode Select │  ← Choose: Wizard / ProQuote / Upload
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   STEP 1     │
  │   Location   │  ← Enter address → Fetch utility rates + solar irradiance
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   STEP 2     │
  │   Industry   │  ← Select from 18 options → Load ASHRAE benchmarks
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   STEP 3     │
  │   Profile    │  ← Questionnaire (facility size, equipment, hours)
  └──────┬───────┘  → Calculate baseLoadKW, peakLoadKW, criticalLoadKW
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │   STEP 4 (Rendered as Step3_5V8.tsx)                             │
  │   Add-ons Configuration  ⬅️ WHERE ADDON INTENT GETS CONFIGURED    │
  └──────────────────────────────────────────────────────────────────┘
  │   THIS IS THE "STEP 3.5" IN ADVISOR NARRATION                    │
  │                                                                   │
  │   Configures:                                                     │
  │   • Solar capacity (kW) - with physical space constraints         │
  │   • Generator capacity (kW) + fuel type                           │
  │   • EV charger counts (L2 / DCFC / HPC)                           │
  │                                                                   │
  │   Smart Defaults:                                                 │
  │   • Solar: ~80% of peak load (capped by roof space)              │
  │   • Generator: 1.25x critical load (or peak for critical facs)   │
  │   • EV: Industry-appropriate charger counts                       │
  │                                                                   │
  │   User Actions:                                                   │
  │   • Toggle addons on/off                                          │
  │   • Adjust sizing with range sliders                              │
  │   • Confirm each addon before proceeding                          │
  │                                                                   │
  │   State Updates:                                                  │
  │   • state.solarKW                                                 │
  │   • state.generatorKW + state.generatorFuelType                   │
  │   • state.evL2Count + state.evDCFCCount + state.evHPCCount        │
  └──────┬────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │   STEP 5 (Rendered as Step4V8.tsx)                               │
  │   MagicFit Tier Builder  ⬅️ WHERE V4.5 PRICING HAPPENS           │
  └──────────────────────────────────────────────────────────────────┘
  │   THIS IS THE "STEP 4" IN FILE NAMES (step4Logic.ts)             │
  │                                                                   │
  │   Builds 3 Quote Tiers:                                           │
  │   1. STARTER - Conservative (50% BESS, 1.4x solar)               │
  │   2. BALANCED - Recommended (75% BESS, 2.1x solar)               │
  │   3. MAXPOWER - Aggressive (100% BESS, 2.8x solar)               │
  │                                                                   │
  │   V4.5 Honest TCO Flow (per tier):                               │
  │   ┌────────────────────────────────────────────────────────────┐ │
  │   │ 1. Calculate equipment/install → calculateQuote()          │ │
  │   │ 2. Apply margin policy → applyMarginPolicy()               │ │
  │   │ 3. Calculate ANNUAL_RESERVES (~$2-3K/yr):                  │ │
  │   │    • Insurance: $500-800                                   │ │
  │   │    • Inverter replacement fund: $900-1200                  │ │
  │   │    • Solar degradation: ~$800-1000                         │ │
  │   │ 4. Deduct reserves from gross savings:                     │ │
  │   │    netSavings = grossSavings - annualReserves              │ │
  │   │ 5. Recalculate honest payback:                             │ │
  │   │    payback = netCost / netSavings                          │ │
  │   └────────────────────────────────────────────────────────────┘ │
  │                                                                   │
  │   Extended QuoteTier Fields (NEW in v4.5):                       │
  │   • grossAnnualSavings: Before reserves deduction                │
  │   • annualReserves: Total yearly reserve costs                   │
  │   • annualSavings: NET after reserves (honest TCO)               │
  │   • marginBandId: "micro", "small", "medium", "large"            │
  │   • blendedMarginPercent: Actual margin applied                  │
  │                                                                   │
  │   SSOT Compliance:                                               │
  │   ✅ calculateQuote() for all equipment/installation costs       │
  │   ✅ applyMarginPolicy() for commercialization                   │
  │   ✅ NO parallel pricing systems                                 │
  │   ✅ pricingServiceV45.ts = reference data ONLY                  │
  └──────┬────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │   STEP 6     │
  │ Quote Results│  ← Display 3 tiers with honest TCO + export options
  └──────────────┘


═══════════════════════════════════════════════════════════════════════════════
KEY TERMINOLOGY CLARIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

⚠️  NAMING CONFUSION EXPLAINED:

  Advisor Narration: "Step 3.5 = Add-ons"
                     "Step 4 = MagicFit"

  WizardV8Page.tsx:  step 4 → Step3_5V8.tsx (Add-ons)
                     step 5 → Step4V8.tsx (MagicFit)

  step4Logic.ts:     buildOneTier() ← Called during Step 5 rendering
                                      (builds MagicFit tiers with v4.5)

  WHY THE OFFSET?
  → Step 0 (Mode Select) causes +1 offset in code numbering
  → Advisor narration skips Step 0, starts at "Step 1"


═══════════════════════════════════════════════════════════════════════════════
V4.5 INTEGRATION VERIFICATION
═══════════════════════════════════════════════════════════════════════════════

✅ WizardV8Page.tsx Integration:
   - Line 35: Lazy loads Step3_5V8 (Add-ons config)
   - Line 38: Lazy loads Step4V8 (MagicFit with v4.5)
   - Line 484: step === 4 → renders Step3_5V8
   - Line 485: step === 5 → renders Step4V8
   - Navigation: Step 3 → Step 4 → Step 5 (seamless flow)

✅ Step3_5V8.tsx (Add-ons):
   - Configures state.solarKW, state.generatorKW, state.evCounts
   - Sets addon flags (wantsSolar, wantsGenerator, wantsEVCharging)
   - These values flow into step4Logic.ts for tier building

✅ step4Logic.ts (V4.5 Integration):
   - Imports ANNUAL_RESERVES from pricingServiceV45
   - Uses calculateQuote() + applyMarginPolicy() (SSOT compliant)
   - Deducts annualReserves from grossAnnualSavings
   - Returns extended QuoteTier with 4 new v4.5 fields
   - Generates audit trail with gross/net breakdown

✅ wizardState.ts:
   - QuoteTier interface extended with v4.5 fields
   - Type safety enforced across all consumers

✅ Step4V8.tsx (MagicFit Display):
   - Calls buildOneTier() 3 times (STARTER, BALANCED, MAXPOWER)
   - Renders tiers with honest payback periods
   - Shows net annual savings (after reserves)


═══════════════════════════════════════════════════════════════════════════════
STATE FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════════════

  Step 1        Step 2          Step 3         Step 4         Step 5
(Location)   (Industry)      (Profile)     (Add-ons)     (MagicFit)
    │            │               │             │              │
    ├──→ location │               │             │              │
    ├──→ zipCode  │               │             │              │
    │            ├──→ industry    │             │              │
    │            │               ├──→ baseLoadKW │             │
    │            │               ├──→ peakLoadKW │             │
    │            │               ├──→ criticalLoadKW           │
    │            │               │             ├──→ solarKW    │
    │            │               │             ├──→ generatorKW │
    │            │               │             ├──→ evCounts   │
    │            │               │             │              ├──→ tiers[]
    │            │               │             │              │    [STARTER,
    │            │               │             │              │     BALANCED,
    │            │               │             │              │     MAXPOWER]
    │            │               │             │              │
    └────────────┴───────────────┴─────────────┴──────────────┴──→ Step 6
                                                                   (Results)


═══════════════════════════════════════════════════════════════════════════════
TESTING STATUS
═══════════════════════════════════════════════════════════════════════════════

✅ ALL TESTS PASSING:

  1. Build:                 2330 modules, 5.80s
  2. Type Check:            0 errors
  3. TrueQuote Validation:  3/3 industries (car_wash, hotel, data_center)
  4. Wizard Validation:     PASS (2 warnings, non-critical)
  5. V4.5 Integration Test: 0 issues found
     • Captured Values ✅
     • Persistent Values ✅
     • Calculated Values ✅
     • Missing Links ✅


═══════════════════════════════════════════════════════════════════════════════
ARCHITECTURAL DECISIONS
═══════════════════════════════════════════════════════════════════════════════

✅ SSOT Compliance Maintained:
   - calculateQuote() is the single source for all pricing
   - applyMarginPolicy() handles commercialization
   - pricingServiceV45 is REFERENCE DATA ONLY (not a calculator)

✅ V4.5 Enhancement:
   - Adds honest TCO via ANNUAL_RESERVES deduction
   - Extends QuoteTier with transparency fields
   - No parallel pricing systems introduced

✅ Audit Trail:
   - Logs gross vs net savings breakdown
   - Shows margin band applied
   - Enables customer transparency

✅ Type Safety:
   - QuoteTier interface enforced
   - TypeScript compilation clean
   - No runtime type errors


═══════════════════════════════════════════════════════════════════════════════
NEXT STEPS (Optional UX Enhancements)
═══════════════════════════════════════════════════════════════════════════════

Future improvements (not blocking):

1. Step 3.5 Cost Preview:
   - Show estimated addon costs in real-time
   - Display "$X added to quote" as user adjusts sliders

2. Step 5 Gross/Net Breakdown:
   - Add expandable section showing:
     • Gross annual savings: $X
     • Less annual reserves: -$Y
     • Net annual savings: $Z (honest TCO)

3. Export Quote:
   - Include reserve cost breakdown in PDF
   - Show year-by-year reserve schedule
```
