# Car Wash Step 3 Questionnaire — Vineet Review

**Date:** April 9, 2026  
**Purpose:** Audit of current question set, what the calculator actually consumes, and gaps to fix.

---

## Quick Summary

|                                                    | Count  |
| -------------------------------------------------- | ------ |
| Questions in current config                        | **27** |
| Questions actually consumed by calculator          | **22** |
| Questions in config but NOT consumed               | **5**  |
| Questions needed by calculator with NO UI question | **3**  |
| Known bugs (unit/type mismatches)                  | **3**  |
| Missing sections (billing, utility, revenue)       | **1**  |

---

## Section 1 — Facility Details (Q1–Q6) ✅ Present

| #   | Question ID        | Type          | What It Drives                     | Status                                       |
| --- | ------------------ | ------------- | ---------------------------------- | -------------------------------------------- |
| Q1  | `facilityType`     | Buttons       | Conveyor logic, load profile shape | ✅                                           |
| Q2  | `tunnelOrBayCount` | Buttons (1–4) | Scale — bay count                  | ✅ ⚠️ Max is 4, multi-tunnel sites go higher |
| Q3  | `operatingHours`   | Buttons       | Annual energy consumption          | ✅                                           |
| Q4  | `daysPerWeek`      | Buttons       | Annual energy consumption          | ✅                                           |
| Q5  | `dailyVehicles`    | Slider        | Revenue projection, water usage    | ✅                                           |
| Q6  | `naturalGasLine`   | Buttons       | Gates water heater options         | ✅ (UI gate only, not consumed by calc)      |

**Missing from Facility:**

- ❌ `tunnelLengthFt` — tunnel length (ft). Present in legacy template (`tunnel_length_ft`), not in current config. Express tunnels run 80–180 ft and length drives brush/arch count directly.
- ❌ `carsPerHourPeak` — peak throughput (cars/hr). In legacy template. Critical for demand charge sizing — this is the moment of maximum concurrent load.

---

## Section 2 — Equipment (Q7–Q19) ⚠️ Mostly Present, Has Bugs

| #   | Question ID             | Type                           | What It Drives                   | Status |
| --- | ----------------------- | ------------------------------ | -------------------------------- | ------ |
| Q7  | `waterHeaterType`       | Conditional Buttons            | Heating load (electric = +30 kW) | ✅     |
| Q8  | `pumpConfiguration`     | Type+Quantity                  | kW per pump (VFD/HP/standard)    | ✅     |
| Q9  | `waterReclamation`      | Buttons                        | Pump load, RO system trigger     | ✅     |
| Q10 | `dryerConfiguration`    | Type+Quantity                  | **BUG — see below**              | ⚠️     |
| Q11 | `vacuumStations`        | Increment                      | Vacuum system load               | ✅     |
| Q12 | `evCharging`            | Increment                      | EV load                          | ✅     |
| Q13 | `evChargingType`        | Buttons (conditional)          | kW per charger                   | ✅     |
| Q14 | `paymentKiosks`         | Increment                      | Controls load                    | ✅     |
| Q15 | `conveyorMotorSize`     | Buttons (5/10/15 HP)           | **BUG — see below**              | ⚠️     |
| Q16 | `brushMotorCount`       | Increment                      | Brush load (~3 kW each)          | ✅     |
| Q17 | `centralVacuumHP`       | Slider (20–50 HP)              | **BUG — see below**              | ⚠️     |
| Q18 | `highPressurePumpCount` | Increment                      | Pump load                        | ✅     |
| Q19 | `roSystemPump`          | Buttons (none/small/med/large) | RO pump load                     | ✅     |

### 🐛 Bug 1 — `conveyorMotorSize`: HP displayed, kW expected

The UI shows options labeled **"5 HP"**, **"10 HP"**, **"15 HP"** with values `"5"`, `"10"`, `"15"`.  
The adapter reads `Number(answers.conveyorMotorSize)` and treats it as **kW directly** — no HP→kW conversion.  
**Result:** A 10 HP motor (7.5 kW actual) gets counted as **10 kW** — a 33% overcount.  
**Fix:** Either store values as kW (`"3.7"`, `"7.5"`, `"11.2"`) or multiply in the adapter by `0.746`.

### 🐛 Bug 2 — `dryerConfiguration` quantity is never read

The question type is `type_then_quantity` — user selects dryer type AND a quantity sub-answer.  
The adapter only reads the top-level `dryerConfiguration` string (e.g., `"blowers"`) and derives `blowerCount` from a hardcoded lookup (`blowers → 6`, `heated → 4`, etc.).  
**Result:** If a site has 8 blowers, we always count 6. Quantity sub-answer is silently ignored.  
**Fix:** Read `answers.dryerQuantity` (or whatever key the UI stores the count under) and use it.

### 🐛 Bug 3 — `centralVacuumHP` slider range vs adapter default mismatch

- Config slider: min **20 HP**, max **50 HP**, default **30 HP**
- Adapter fallback default: **15 HP** (`centralVacuumHP ?? 15`)  
  **Result:** If the question is skipped or unanswered, adapter assumes 15 HP — below the slider minimum. Inconsistent.  
  **Fix:** Align adapter default to **25–30 HP** to match the slider's real range.

---

## Section 3 — Additional Equipment (Q20–Q22) ✅ Present

| #   | Question ID        | Type                 | What It Drives             | Status                                                                       |
| --- | ------------------ | -------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Q20 | `airCompressor`    | Buttons (5/10/15 HP) | Compressor load            | ✅ (same HP→kW issue as Q15 — adapter correctly multiplies by 0.746 here ✅) |
| Q21 | `tunnelLighting`   | Buttons              | Lighting load (5/8/15 kW)  | ✅                                                                           |
| Q22 | `exteriorSignage`  | Buttons              | Lighting load (5/10/20 kW) | ✅                                                                           |
| —   | `officeFacilities` | Multiselect          | Office/facilities load     | ✅                                                                           |

---

## Section 4 — Solar (Q23–Q27) ✅ Present

| #   | Question ID       | Type    | What It Drives                    | Status                         |
| --- | ----------------- | ------- | --------------------------------- | ------------------------------ |
| Q23 | `totalSiteArea`   | Slider  | Site layout context               | ✅ (not consumed by load calc) |
| Q24 | `roofArea`        | Slider  | Solar capacity                    | ✅                             |
| Q25 | `roofType`        | Buttons | Usable % of roof area (70/55/40%) | ✅                             |
| Q26 | `carportInterest` | Buttons | Solar carport opportunity         | ✅                             |

---

## ❌ Missing Section — Billing & Utility (Critical for BESS Sizing)

This entire section exists in the legacy template (`car_wash.v1.json`) but was **never ported** to the current config. The BESS ROI calculation depends on these values directly.

| Missing Question ID   | Label                        | Why It Matters                                                             |
| --------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `monthlyKwh`          | Monthly kWh usage            | Baseline energy cost, solar offset calc                                    |
| `peakDemandKw`        | Peak demand (kW)             | Actual demand charge calculation — most important for BESS ROI             |
| `demandChargeApplies` | Do demand charges apply?     | Gates whether demand savings are relevant                                  |
| `demandChargeRate`    | Demand charge rate ($/kW-mo) | Direct multiplier on BESS savings — without this we use a national average |

**Without `peakDemandKw` from the user's actual bill, the calculator is estimating peak from equipment questions alone. The real bill number is more accurate and more trustworthy.**

---

## ❌ Missing Questions — Revenue & Operations

These would enable Merlin to project payback period more accurately:

| Missing                | Why                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `membershipPlanActive` | Unlimited wash memberships flatten daily throughput and change peak demand pattern significantly |
| `averageTicketPrice`   | Needed for revenue-based ROI presentation ($X saved per wash)                                    |
| `chemicalSystemKw`     | Chemical dosing pumps are typically 2–5 kW continuous — not modeled                              |
| `hvacBuildingKw`       | Customer lounge / employee area HVAC — present on flex/full-service sites, ignored entirely      |
| `prepDetailServices`   | Detail bays add significant load (vacuums, lighting, compressors) — only relevant for flex/full  |

---

## ❌ Missing Questions — Solar / Site Detail

| Missing               | Why                                                                      |
| --------------------- | ------------------------------------------------------------------------ |
| `roofAge`             | Affects financing options — lenders often require roof <10 yrs for solar |
| `groundMountInterest` | If extra lot space exists, ground mount may beat rooftop economics       |
| `utilityMeter`        | Single meter vs sub-metered? Affects interconnection complexity          |

---

## Summary: Recommended Priority Fixes

### P0 — Fix bugs (breaks existing math)

1. `conveyorMotorSize` — multiply by 0.746 in adapter or change stored values to kW
2. `dryerConfiguration` quantity — read sub-answer count, don't hardcode blower count
3. `centralVacuumHP` — align adapter default to 25 HP (match slider minimum)

### P1 — Add missing billing section (most impactful for quote accuracy)

4. Add `monthlyKwh` question
5. Add `peakDemandKw` question — **single highest-ROI addition**
6. Add `demandChargeApplies` + `demandChargeRate` questions

### P2 — Expand scale input

7. `tunnelOrBayCount` max of 4 is too low — multi-site operators have 6–10 tunnels. Expand to 8+.
8. Add `tunnelLengthFt` (80–180 ft range) — gates arch and brush count assumptions

### P3 — Revenue / membership (nice to have for ROI presentation)

9. `membershipPlanActive` toggle
10. `averageTicketPrice`

---

## Full Question List — Current State (27 Questions)

```
FACILITY (6)
  Q01  facilityType         [buttons]        What type of car wash?
  Q02  tunnelOrBayCount     [buttons]        Number of tunnels or bays?
  Q03  operatingHours       [buttons]        Operating hours per day?
  Q04  daysPerWeek          [buttons]        Days open per week?
  Q05  dailyVehicles        [slider]         Estimated daily vehicles washed?
  Q06  naturalGasLine       [buttons]        Natural gas line? (UI gate only)

EQUIPMENT (16)
  Q07  waterHeaterType      [cond. buttons]  Water heating system?
  Q08  pumpConfiguration    [type+qty]       Water pump configuration?
  Q09  waterReclamation     [buttons]        Water reclamation system?
  Q10  dryerConfiguration   [type+qty]       Vehicle dryer configuration? ⚠️ qty ignored
  Q11  vacuumStations       [increment]      Free-standing vacuum stations?
  Q12  evCharging           [increment]      EV charging infrastructure?
  Q13  evChargingType       [buttons]        What type of EV chargers? (conditional)
  Q14  paymentKiosks        [increment]      Payment kiosks?
  Q15  conveyorMotorSize    [buttons]        Conveyor motor size? ⚠️ HP/kW bug
  Q16  brushMotorCount      [increment]      Brush motor count?
  Q17  centralVacuumHP      [slider]         Central vacuum turbine HP? ⚠️ default mismatch
  Q18  highPressurePumpCount[increment]      High-pressure pump count?
  Q19  roSystemPump         [buttons]        RO system pump?
  Q20  airCompressor        [buttons]        Air compressor size?
  Q21  tunnelLighting       [buttons]        Tunnel lighting?
  Q22  exteriorSignage      [buttons]        Exterior signage?
       officeFacilities     [multiselect]    Office facilities?

SOLAR (4)
  Q23  totalSiteArea        [slider]         Total site area?
  Q24  roofArea             [slider]         Available roof area for solar?
  Q25  roofType             [buttons]        Roof construction type?
  Q26  carportInterest      [buttons]        Interested in solar carports?
```

---

_Source files reviewed:_

- `src/data/carwash-questions-complete.config.ts` — UI question definitions (27 questions)
- `src/wizard/v7/step3/adapters/carWash.ts` — calculator adapter (maps answers → load profile)
- `src/wizard/v7/templates/car_wash.v1.json` — legacy template (reference for missing billing section)
- `src/wizard/v8/__tests__/carWashMathSmoke.test.ts` — math smoke tests
