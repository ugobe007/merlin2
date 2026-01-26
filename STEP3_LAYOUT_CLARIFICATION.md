# Step 3 Layout Clarification

## Current Implementation (Step3DetailsV7.tsx)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STEP 3: FACILITY DETAILS                         │
├─────────────────────────────────────┬───────────────────────────────────────┤
│  LEFT COLUMN                        │  RIGHT COLUMN                         │
│  Questionnaire Input Fields         │  Merlin Advisor (Live Analysis)       │
│                                     │                                       │
│  ┌──────────────────────────────┐  │  ┌──────────────────────────────┐    │
│  │ 🏢 Industry Icon + Name      │  │  │ 🤖 Merlin Advisor            │    │
│  │                              │  │  │                              │    │
│  │ Progress: 3/16 questions     │  │  │ ✨ Live Analysis Panel       │    │
│  │ [██████░░░░░░░░░░] 19%       │  │  │                              │    │
│  │                              │  │  │ 📊 Facility Snapshot         │    │
│  │ Question 1:                  │  │  │   - Bays: 4                  │    │
│  │ [Input field]                │  │  │   - Hours: 6am-8pm          │    │
│  │                              │  │  │                              │    │
│  │ Question 2:                  │  │  │ ⚡ Power Profile             │    │
│  │ [Input field]                │  │  │   - Peak: 125 kW            │    │
│  │                              │  │  │   - Daily: 1,800 kWh        │    │
│  │ Question 3:                  │  │  │                              │    │
│  │ [Dropdown]                   │  │  │ 🔋 BESS Recommendation      │    │
│  │                              │  │  │   - Capacity: 150 kW        │    │
│  │ ...more questions...         │  │  │   - Storage: 600 kWh        │    │
│  │                              │  │  │                              │    │
│  │ [Continue Button]            │  │  │ 💰 Savings Estimate         │    │
│  └──────────────────────────────┘  │  │   - $42,000/yr              │    │
│                                     │  │   - Payback: 3.8 yrs        │    │
│                                     │  │                              │    │
│                                     │  │ 📈 Confidence Meter         │    │
│                                     │  │   [███████░░░] 72% - Med    │    │
│                                     │  └──────────────────────────────┘    │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

## Step 1 Pattern (For Comparison)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STEP 1: LOCATION                                 │
├─────────────────────────────────────┬───────────────────────────────────────┤
│  LEFT COLUMN                        │  RIGHT COLUMN                         │
│  Input Fields                       │  Merlin Advisor (Live Analysis)       │
│                                     │                                       │
│  🌍 Your Location                   │  🤖 Merlin Advisor                    │
│                                     │                                       │
│  [US / International Toggle]        │  ✨ Live Analysis Panel               │
│                                     │                                       │
│  ZIP Code:                          │  🔍 Location Analysis                 │
│  [_____]                            │    - Peak Sun: 5.2 hrs/day           │
│                                     │    - Utility Rate: $0.28/kWh         │
│  Business Name:                     │    - Weather Risk: Low               │
│  [___________]                      │    - Solar Grade: A                  │
│                                     │                                       │
│  Street Address:                    │  🌤️ Weather Risk: Low               │
│  [___________]                      │    Minimal weather concerns...       │
│                                     │                                       │
│  [Find My Business]                 │  ✨ Recommendation                   │
│                                     │    BESS + Solar system...            │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

## Your Proposed Layout (If I understand correctly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STEP 3: FACILITY DETAILS                         │
├─────────────────────────────────────┬───────────────────────────────────────┤
│  LEFT COLUMN                        │  RIGHT COLUMN                         │
│  Merlin Advisor (Live Analysis)     │  Questionnaire Input Fields           │
│                                     │                                       │
│  ┌──────────────────────────────┐  │  ┌──────────────────────────────┐    │
│  │ 🤖 Merlin Advisor            │  │  │ 🏢 Industry Icon + Name      │    │
│  │                              │  │  │                              │    │
│  │ ✨ Live Analysis Panel       │  │  │ Progress: 3/16 questions     │    │
│  │                              │  │  │ [██████░░░░░░░░░░] 19%       │    │
│  │ 📊 Facility Snapshot         │  │  │                              │    │
│  │   - Bays: 4                  │  │  │ Question 1:                  │    │
│  │   - Hours: 6am-8pm          │  │  │ [Input field]                │    │
│  │                              │  │  │                              │    │
│  │ ⚡ Power Profile             │  │  │ Question 2:                  │    │
│  │   - Peak: 125 kW            │  │  │ [Input field]                │    │
│  │   - Daily: 1,800 kWh        │  │  │                              │    │
│  │                              │  │  │ Question 3:                  │    │
│  │ 🔋 BESS Recommendation      │  │  │ [Dropdown]                   │    │
│  │   - Capacity: 150 kW        │  │  │                              │    │
│  │   - Storage: 600 kWh        │  │  │ ...more questions...         │    │
│  │                              │  │  │                              │    │
│  │ 💰 Savings Estimate         │  │  │                              │    │
│  │   - $42,000/yr              │  │  │                              │    │
│  │   - Payback: 3.8 yrs        │  │  │ [Continue Button]            │    │
│  │                              │  │  └──────────────────────────────┘    │
│  │ 📈 Confidence Meter         │  │                                       │
│  │   [███████░░░] 72% - Med    │  │                                       │
│  └──────────────────────────────┘  │                                       │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

## Question for You

**Which layout do you prefer for Step 3?**

### Option A: Match Step 1 Pattern (Current Implementation)
- LEFT: Input fields (questionnaire)
- RIGHT: Merlin Advisor (live analysis)
- **Consistency**: Same as Step 1

### Option B: Flip the Layout (Your Suggestion?)
- LEFT: Merlin Advisor (live analysis)
- RIGHT: Input fields (questionnaire)
- **Reasoning**: Advisor is more prominent, guides user through questions

### Option C: Something else?

## Data Flow (Unchanged Regardless of Layout)

```
User answers questions (UI)
           ↓
Step3Integration.tsx (SSOT enforcement wrapper)
           ↓
CompleteStep3Component.tsx (Database-driven questionnaire engine)
           ↓
useCaseService.getCustomQuestions(industrySlug)
           ↓
Supabase: custom_questions table (21 industries)
           ↓
Industry-specific calculators:
  - calculateCarWashFromAnswers()
  - calculateHotelFromAnswers()
  - calculateHospitalFromAnswers()
  - calculateTruckStopFromAnswers()
  - calculateEVChargingFromAnswers()
  - calculateDataCenterFromAnswers()
  - calculateOfficeFromAnswers()
           ↓
Live metrics update in Merlin panel:
  - Power profile (peakDemandKW, dailyKWh)
  - BESS recommendation (kW, kWh)
  - Savings estimate ($, payback)
  - Confidence score (0-100%)
```

## My Recommendation

**Stick with Option A** (current implementation) for consistency:
- Step 1: LEFT=inputs, RIGHT=advisor
- Step 3: LEFT=inputs, RIGHT=advisor
- Users develop a mental model: "left is where I work, right is where Merlin reacts"

But I'm flexible! Let me know your preference and I'll implement it.
