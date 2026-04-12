# MERLIN ENERGY — Complete BESS/Solar Modeling Analysis & Strategic Recommendations

**Prepared for: Bob**
**Date: April 11, 2026 | Confidential**
**Context: This document captures the full analytical thread from Vineet's working session. Feed this entire file to Claude for full context on where we are and what decisions need to be made.**

---

# TABLE OF CONTENTS

1. The Core Problem — Why the Car Wash Model's Savings Are Inflated
2. DCFC Revenue Assumptions — What's Wrong
3. The Generator Problem
4. What the Platform Should Do Instead
5. Corrected Model Recommendations
6. Demand Charge Evaluation by ZIP/Utility
7. Carport Solar — Installed Costs, Structural Feasibility & Footing Analysis
8. Sinclair Designs & Engineering (SDE) — Potential Partner
9. Premium Roof Panels vs. Carport Solar — The Winning Strategy
10. BESS & Inverter Sizing Impact
11. Portfolio Impact (90-Site Analysis)
12. Recommendations for Merlin's Model
13. Premium Solar Panel Market — What's Available (2026)
14. US-Manufactured Panel Ranking with Pricing
15. Panel Pricing & Tariff Scenarios (US vs China vs India)
16. **El Car Wash Business Case: Florida vs Michigan — All Panel Options Compared**
17. **T1 Energy (formerly Freyr) / Trina US Manufacturing — Game-Changer**
18. **Wind Rating Issue — FL HVHZ Sites**
19. **T1 Energy Financials, Cost Structure & Profitability Risk**
20. **Hail Ratings — All Panels**
21. **Additional US-Based Suppliers**
22. **Emerging US Manufacturers & Technology Pipeline (2026–2028)**
23. **Final Revised Recommendation (April 2026)**
24. **US Solar Manufacturer Directory — Names, Websites & Products**
25. **Live Data Scraping — What Merlin Should Track and Where**
26. **⚠️ CRITICAL: Silfab SC Operations Risk Alert** ← NEW
27. **REVISED: Dual-Supplier Strategy (Canadian Solar + Silfab)** ← NEW

---

# PART 1: THE CORE PROBLEM

## Why the Car Wash Model's Savings Are Inflated

The current Merlin platform quote for a car wash in Northville, MI shows $39K in "annual savings" — but $28K of that is speculative EV charging revenue, not energy savings.

The actual BESS + solar energy case delivers only $11K/year against a $461K net investment — a 42-year payback on the energy fundamentals alone. The 12-year payback shown in the quote only works because the model injects $28K/yr of assumed DCFC revenue into the "savings" line.

### Cross-Reference Across Multiple Platform Runs

| Run                             | Annual Savings Shown | EV Revenue Embedded | True Energy Savings | True Payback |
| ------------------------------- | -------------------- | ------------------- | ------------------- | ------------ |
| Recommended (with DCFC + gen)   | $39K                 | $28K                | $11K                | 42 years     |
| Recommended (no DCFC, no gen)   | $17K                 | $0                  | $17K                | 8.2 years    |
| Complete tier (no DCFC, no gen) | $25K                 | $0                  | $25K                | 7.6 years    |

The clean runs without DCFC and generators tell the real story: $17K–$25K/yr in genuine energy savings with 7–8 year payback. That's an honest number. The $39K figure is not.

---

# PART 2: DCFC REVENUE ASSUMPTIONS — WHAT'S WRONG

## The Math Doesn't Hold Up

2 DCFC chargers generating $28K/yr = $14K per charger per year.

At $0.40–0.50/kWh retail pricing, ~30 kWh per 30-minute session = ~$13 per session average:

- $14K/charger/yr ÷ $13/session = ~3 charges per charger per day, 365 days
- Most DCFC stations outside highway corridors average 1–2 sessions/charger/day in early deployment years
- A car wash location is a destination stop, not a highway corridor — utilization will be lower, not higher

## Hidden Costs Not Modeled

The $28K revenue figure appears to be gross revenue with no deductions for:

- **Demand charges from DCFC alone:** A single 150 kW DCFC can spike demand by 50–150 kW. At $14/kW (DTE rate), that's $700–$2,100/month in additional demand charges — potentially $8K–$25K/year that erases most or all of the revenue
- **Network/software fees:** ChargePoint, Blink, or Tesla NACS network fees run 10–20% of revenue
- **Maintenance:** $500–$1,500/charger/year
- **Credit card processing:** 3–4% of revenue
- **Realistic net margin on DCFC:** Often 20–40% of gross revenue in early years, meaning $28K gross → $6K–$11K net

## The BESS Sizing Gets Distorted

The BESS is sized to 198 kWh / 99 kW based on a 247 kW peak load. But if DCFC is part of the system, the peak demand profile changes dramatically — two DCFC chargers can add 100–300 kW of instantaneous demand. Either:

1. The BESS needs to be much larger to shave DCFC-induced peaks (more capex, worse payback)
2. The DCFC runs on its own meter/panel with separate demand charges (additional infrastructure cost not shown)
3. The DCFC demand spikes hit the main meter unshaved (destroying the peak-shaving savings the BESS was designed to capture)

**The model treats DCFC as pure revenue without modeling its power impact on the same system it's supposed to be optimizing. This is the fundamental modeling error.**

---

# PART 3: THE GENERATOR PROBLEM

The $109K diesel generator at 124 kW adds:

- $0 annual energy savings (the model's own advisory confirms this)
- $109K to equipment cost
- ~$27K to construction contingency (7.5% of the inflated base)
- Ongoing fuel and maintenance costs not shown

The model flags this itself: "124 kW generator · resilience investment (24h backup protection) · $0 annual energy savings — adds to project cost without improving payback. Add only if continuous uptime is required."

Yet it's included in the Recommended tier. A car wash does not need 24-hour backup power. Lost wash revenue during an outage is $500–$2,000/day at most. The $109K generator would need to prevent 55–218 days of total outages to justify itself.

---

# PART 4: WHAT THE PLATFORM SHOULD DO INSTEAD

## 1. Separate Energy Savings from Revenue Generation

**Business Case A — Energy Cost Reduction (BESS + Solar)**

- Annual savings: $17K–$25K (demand shaving + solar offset)
- Net cost: $136K–$188K after ITC
- Payback: 7–8 years (honest)
- This is what Mike and Sarah evaluate as an infrastructure investment

**Business Case B — EV Charging Revenue (Optional Add-on)**

- Gross revenue potential: $14K–$28K/yr (with explicit utilization assumptions)
- Additional capex: $100K for 2 DCFC
- Net revenue after demand charges, fees, maintenance: $4K–$11K/yr
- Separate payback: 9–25 years on the EV hardware alone
- Framed as customer acquisition / future-proofing, not savings

Never combine these into a single "savings" number.

## 2. Lead with Demand Charge Reduction

Car washes have spiky load profiles — tunnel motors, blowers, dryers create sharp 15-minute demand peaks. With DTE's $14/kW demand charge:

- Shaving 75 kW of peak = $1,050/month = $12,600/year in demand charge savings alone
- A smaller, focused BESS (100–150 kWh) optimized purely for demand management could deliver a 4–5 year payback at half the current system cost

## 3. Make the Generator Optional

Remove the generator from the default Recommended tier. Offer as a checkbox add-on with clear disclosure that it adds $109K cost with $0 savings improvement.

## 4. Model DCFC Power Impact Honestly

If DCFC is offered, the model must visibly answer: How many EVs/day? What's the demand impact? Separate meter or shared? Net revenue (not gross)?

## 5. Traffic Evaluation for DCFC

Provide local EV registration density, competitor DCFC within 5-mile radius, average daily traffic, estimated capture rate, and break-even utilization.

---

# PART 5: CORRECTED MODEL RECOMMENDATIONS

## For the Generic Car Wash Demo (Northville)

| Component        | Current                           | Recommended                                       |
| ---------------- | --------------------------------- | ------------------------------------------------- |
| BESS             | 198 kWh / 99 kW                   | 100–150 kWh / 50–75 kW (demand-focused)           |
| Solar            | 28 kW (67% of roof)               | 42 kW (max roof) — solar has best per-kW ROI here |
| Generator        | 124 kW included                   | Remove from default, optional add-on              |
| DCFC             | 2 chargers, $28K revenue baked in | Separate proposal with honest net revenue         |
| Expected savings | $11K energy + $28K EV = "$39K"    | $20K–$28K pure energy savings                     |
| Expected payback | 12 years (inflated by EV)         | 5–7 years (honest, smaller system)                |

## For El Car Wash (PE Pitch)

| Component           | Value                        | Rationale                                             |
| ------------------- | ---------------------------- | ----------------------------------------------------- |
| Peak load           | 320–350 kW                   | Corrected equipment inputs                            |
| BESS                | 280–350 kWh                  | Sized to shave 75–100 kW of peak                      |
| Solar               | 103 kW (roof + carport)      | Max generation, El Car Wash has canopy infrastructure |
| Generator           | Optional, not default        | PE evaluates on ROI, not resilience                   |
| DCFC                | Separate business case slide | PE wants clean unit economics                         |
| Target payback      | 4–5 years                    | PE-grade threshold                                    |
| Annual savings      | $30–42K                      | Demand shaving + solar offset + TOU arbitrage         |
| Portfolio 25-yr NPV | $300–450K per site           | The number that moves Warburg Pincus                  |

---

# PART 6: DEMAND CHARGE EVALUATION BY ZIP/UTILITY

Demand charges are evaluable at the ZIP level with high confidence for car wash-sized facilities.

**What's publicly available by ZIP/utility:** Every utility publishes commercial rate schedules (tariffs) with the SEC/state PUC. Demand charges are set per rate class, not per customer. If you know the utility and the rate schedule, you know the demand charge. Example: DTE's D3 commercial rate is $14.00/kW — applies to every commercial customer on that schedule.

**What varies by site:** The rate schedule depends on peak demand history and service voltage. A car wash pulling 300 kW is on a different schedule than a 30 kW retail shop. But within that schedule, the $/kW rate is fixed and public.

**What Merlin can automate:**

1. ZIP → utility provider (mapped via EIA 861 data)
2. Utility → published rate schedules (via OpenEI/URDB databases)
3. Estimated peak demand from Step 3 inputs → likely rate schedule
4. Rate schedule → exact demand charge in $/kW

**Caveat:** Some large commercial customers negotiate custom rates or participate in demand response programs. But 90%+ of car wash-sized facilities (200–500 kW) are on standard published tariffs. Use published rate as default, let users override.

---

# PART 7: CARPORT SOLAR — INSTALLED COSTS, STRUCTURAL FEASIBILITY & FOOTING ANALYSIS

## Industry Benchmarks (2025–2026)

| Source                                | Commercial $/W Installed | Notes                                       |
| ------------------------------------- | ------------------------ | ------------------------------------------- |
| EnergySage Marketplace (H2 2025)      | $3.14–$3.17/W            | Includes structure, panels, install         |
| NREL / Industry range (2026)          | $2.75–$4.50/W            | Scale-dependent; 200–800 kW avg $3.24/W     |
| Commercial at scale (100+ kW)         | $2.75–$3.50/W            | Economies of scale kick in                  |
| Structure-only (no panels/electrical) | $0.50–$0.70/W            | Racking/steel frame only, excl. foundations |

## Cost Breakdown Per Watt (Commercial Carport Solar)

- Structural framework + steel: ~$0.50–$1.50/W
- Foundation/footings: ~$0.20–$0.50/W (highly variable by soil/frost)
- PV modules: ~$0.30–$0.50/W
- Inverters + BOS: ~$0.30–$0.50/W
- Electrical + interconnection: ~$0.20–$0.40/W
- Labor + install: ~$0.75–$1.00/W
- Engineering, permits, soft costs: ~$0.30–$0.50/W

## For a 50–75 kW Car Wash Carport System

| System Size | Gross Cost Range | After 30% ITC |
| ----------- | ---------------- | ------------- |
| 50 kW       | $137K–$175K      | $96K–$122K    |
| 75 kW       | $206K–$263K      | $144K–$184K   |

## The Footing Question: Can Vacuum Station Footings Support Solar Carport Load?

**Short answer: No.**

Car wash vacuum islands are bolt-in-place units anchored to parking lot slabs with expansion anchors. They support 500–2,000 lbs of equipment. Solar carports need independent drilled concrete piers with 8,000–25,000+ lb capacity per column, foundations every ~30 feet drilled 10–14 feet deep.

### Michigan Frost Line

Michigan building code requires all exterior footings to extend minimum 42 inches below actual grade. This is non-negotiable for any permanent structure.

### Comparison

| Factor                 | Vacuum Station              | Solar Carport Required     |
| ---------------------- | --------------------------- | -------------------------- |
| Column load            | 2,000–5,000 lbs             | 8,000–25,000+ lbs          |
| Footing depth          | Slab-anchored (4–6")        | 42–54" minimum (MI frost)  |
| Footing diameter       | Not applicable (slab bolts) | 24–36" concrete pier       |
| Snow load design       | 10–20 PSF typical           | 25–50 PSF (MI requirement) |
| Wind uplift resistance | Moderate                    | High (large sail area)     |

### Three Options for Car Wash Sites

**Option A — New independent solar carport (most likely for retrofits):** Full cost at $2.75–$3.50/W. New foundations, new steel, new everything.

**Option B — Retrofit existing canopy (usually not feasible):** Requires structural engineering assessment, footing augmentation, column reinforcement. Often 60–80% of new construction cost with more risk.

**Option C — Build solar carport as vacuum canopy replacement (best for greenfield):** Design the vacuum area canopy as a solar carport from day one. Single structure serves dual purpose. Marginal cost drops to $1.50–$2.00/W because the canopy steel is already budgeted. **This is the play for greenfield El Car Wash sites.**

---

# PART 8: SINCLAIR DESIGNS & ENGINEERING (SDE)

SDE is a Michigan-based manufacturer in Albion specializing in solar carport and ground mount racking systems since 2007. They were acquired by Salt Creek Capital in December 2024.

**What they provide:** Solar racking manufacturing, installation services, licensed engineering support, certified ASCE structural calculations, detailed construction drawings, ballast analysis, installation guides, preliminary PV designs, 3D site modeling, project BOM and installation costs.

**Why they matter for Merlin:** Local to Michigan, domestic carport racking manufacturer, provide stamped engineering, have scale to handle portfolio deployments. Currently running 16 MW of ground mount posts — they have active large-scale capacity.

**Recommendation:** Contact SDE directly at (877) 517-0311 for a car wash-specific carport quote. Specify 50–75 kW, single-row cantilever, Michigan snow/wind loads.

---

# PART 9: PREMIUM ROOF PANELS VS. CARPORT SOLAR — THE WINNING STRATEGY

## Starting Point

Average car wash roof: 6,500 sq ft, 65% usable = 4,225 sq ft. Fits ~155–160 panels regardless of wattage. The question is which panels go on.

## Standard vs. Premium Panel Comparison

| Factor                    | Standard Panels | Premium High-Efficiency   |
| ------------------------- | --------------- | ------------------------- |
| Panel wattage             | 400–420W        | 480–530W                  |
| Efficiency                | 20–21%          | 23–24.5%                  |
| Panels on 4,225 sq ft     | ~155–160        | ~155–160 (same footprint) |
| Total roof capacity       | 62–67 kW        | 74–85 kW                  |
| Capacity gain             | Baseline        | +12–18 kW (+19–27%)       |
| Module cost ($/W)         | $0.28–$0.35/W   | $0.38–$0.55/W             |
| Total module cost         | $19K–$23K       | $28K–$47K                 |
| Module cost delta         | —               | +$9K–$24K                 |
| Full installed cost ($/W) | $1.10–$1.50/W   | $1.30–$1.80/W             |
| Total installed cost      | $68K–$100K      | $96K–$153K                |

## Annual Generation & Savings (Michigan, 4.2 PSH)

| Scenario               | Capacity   | Annual kWh  | Value @$0.15 | Total Savings (energy + demand) |
| ---------------------- | ---------- | ----------- | ------------ | ------------------------------- |
| Standard roof panels   | 65 kW      | ~99,600     | $14,900      | $16K–$19K/yr                    |
| Premium roof panels    | 80 kW      | ~122,600    | $18,400      | $20K–$24K/yr                    |
| **Delta from upgrade** | **+15 kW** | **+23,000** | **+$3,500**  | **+$4K–$5K/yr**                 |

## Head-to-Head Comparison

| Approach                                | Extra kW | Extra Cost (gross) | After 30% ITC | Extra Savings/yr | Incremental Payback |
| --------------------------------------- | -------- | ------------------ | ------------- | ---------------- | ------------------- |
| **Upgrade to premium roof panels**      | +15 kW   | +$28K–$53K         | +$20K–$37K    | +$4K–$5K/yr      | **4–9 years**       |
| Add 50 kW carport (retrofit)            | +50 kW   | +$138K–$175K       | +$96K–$122K   | +$11K–$13K/yr    | 7–10 years          |
| Add 50 kW carport (greenfield marginal) | +50 kW   | +$75K–$100K        | +$53K–$70K    | +$11K–$13K/yr    | 4–6 years           |

### Key Findings

- **Capital efficiency:** Premium panels deliver the best $/kW-added of any option. Spend $20K–$37K net to gain $4K–$5K/yr — 4–9 year incremental payback with zero structural work.

- **Risk profile:** Same roof, same mounting system, same electrical runs, same permits. Swapping a panel SKU on existing rails — no foundations, no structural engineering, no frost line concerns.

- **Carport solar only wins at greenfield:** When the canopy structure is already budgeted, marginal cost drops to $1.50–$2.00/W. At retrofit sites, full carport solar is 3–4x more expensive per incremental kW than the panel upgrade.

- **Combined approach is strongest:** Premium panels on roof (80 kW) + right-sized BESS (100–150 kWh) for demand shaving = $20K–$24K/yr savings on $150K–$190K net investment = 6–8 year payback. No speculative EV revenue required.

---

# PART 10: BESS & INVERTER SIZING IMPACT

## Inverter

Going from 65 kW to 80 kW rooftop solar does not require a fundamentally different inverter. Commercial 3-phase string inverters in 50–100 kW sizes accommodate both configurations. Incremental cost: ~$2K–$4K.

## Battery (BESS)

BESS sized for peak shaving is driven by the facility's load profile, not solar capacity. More solar does not change demand spikes from tunnel motors, blowers, and dryers. The 100–200 kWh BESS remains appropriate.

Only exception: if extra solar creates midday export with no net metering, an additional 30–50 kWh could capture surplus for evening peaks. But a 250+ car/day tunnel consuming 190–250 kW continuously during operating hours is unlikely to have significant export from only 80 kW of solar.

| Component                | Standard Roof (65 kW) | Premium Roof (80 kW) | Change Needed?          |
| ------------------------ | --------------------- | -------------------- | ----------------------- |
| Inverter                 | 50–75 kW 3-phase      | 75–100 kW 3-phase    | Minor upsize (~$2K–$4K) |
| BESS (peak shaving)      | 100–150 kWh           | 100–150 kWh          | No change               |
| BESS (if export capture) | —                     | +30–50 kWh optional  | Only if no net metering |
| Electrical panel         | Same                  | Same                 | No change               |

---

# PART 11: PORTFOLIO IMPACT (90-SITE ANALYSIS)

For El Car Wash evaluating fleet-wide deployment:

| Metric                        | Standard Panels (all sites) | Premium Panels (all sites) | Delta             |
| ----------------------------- | --------------------------- | -------------------------- | ----------------- |
| Total capacity                | 5,850 kW (5.85 MW)          | 7,200 kW (7.2 MW)          | +1,350 kW         |
| Annual generation             | 8.96M kWh                   | 11.03M kWh                 | +2.07M kWh        |
| Annual savings                | $1.44M–$1.71M               | $1.80M–$2.16M              | +$360K–$450K/yr   |
| Extra module cost (gross)     | —                           | +$810K–$2.16M              |                   |
| Extra module cost (after ITC) | —                           | +$567K–$1.51M              |                   |
| Portfolio payback on upgrade  | —                           | —                          | **1.3–3.4 years** |

The premium panel upgrade across 90 sites pays for itself in 1.3–3.4 years. This is the kind of capital efficiency decision PE firms optimize routinely.

---

# PART 12: RECOMMENDATIONS FOR MERLIN'S MODEL

## Immediate Fixes

1. **Separate energy savings from EV revenue.** Never combine BESS/solar savings with DCFC revenue in a single "savings" number. Two distinct business cases.

2. **Remove generator from default Recommended tier.** Make it an optional add-on with clear disclosure: adds $109K cost, $0 savings improvement.

3. **Add panel tier selection in solar configuration.** "Standard (400W)" vs "High-Efficiency (500W+)" with cost/generation tradeoff shown transparently.

4. **Default to maximizing rooftop solar before suggesting carport.** Premium panels on existing roof should always be evaluated first. Carport solar is an upgrade path, not a default.

5. **Ask retrofit vs. greenfield in Step 3.** This changes carport solar cost by 40–50% and determines whether carport is recommended at all.

## Model Logic Changes

6. **Model DCFC power impact on shared meter.** If DCFC is included, show how charger demand spikes affect BESS sizing and demand charges. Show net revenue, not gross.

7. **Right-size BESS for demand shaving.** A smaller, focused BESS (100–150 kWh) optimized for demand management delivers faster payback than an oversized system.

8. **Surface demand charges explicitly.** Use ZIP → utility → rate schedule → $/kW mapping. The demand charge is the #1 savings lever for car washes.

## Strategic Positioning

9. **Lead with honest numbers.** Premium roof solar (80 kW) + right-sized BESS (100–150 kWh) + no carport + no DCFC = $20K–$24K/yr genuine savings on $150K–$190K net investment = 6–8 year honest payback. This survives PE scrutiny.

10. **The 28% Merlin EPC advantage is the real closer.** Even if savings take a year longer than projected, the customer paid less for the system than traditional EPC. That's a risk reducer.

11. **Contact SDE (Sinclair Designs, Albion MI)** for carport racking quotes for greenfield El Car Wash sites. Local manufacturer, PE-backed, portfolio-scale capable.

---

# PART 13: PREMIUM SOLAR PANEL MARKET — WHAT'S AVAILABLE (2026)

## Top Residential/Commercial-Size Panels (Fit Car Wash Roofs)

| Rank | Manufacturer       | Model               | Wattage | Efficiency | Cell Technology         | Notes                                                                                                                                   |
| ---- | ------------------ | ------------------- | ------- | ---------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Aiko Solar         | Neostar             | 510W    | 25.2%      | ABC (All Back Contact)  | Current global efficiency leader. Pure black aesthetic, no visible grid lines. All metal contacts on rear for maximum light absorption. |
| 2    | Recom Technologies | Back-contact module | 495W    | 24.8%      | Back-contact N-type     | Second most efficient residential panel. May be sourcing/licensing cells from Aiko.                                                     |
| 3    | LONGi Solar        | Hi-MO X10           | 490W    | 24.5%      | HPBC 2.0 (back-contact) | World's largest solar manufacturer. "Zero-busbar" front design. Massive manufacturing scale = competitive pricing.                      |
| 4    | Maxeon (SunPower)  | Maxeon 7            | 475W    | 24.1%      | IBC back-contact        | The reliability king — 40-year warranty, unmatched in industry. Maxeon 8 expected to exceed 25% when released.                          |
| 5    | JinkoSolar         | Tiger Neo 3.0       | 480W    | 24.0%      | N-type TOPCon           | Best "value premium" — near back-contact performance at significantly lower price. World's largest module shipper.                      |
| 6    | Trina Solar        | Vertex S+           | 475W    | 23.8%      | N-type TOPCon           | Strong value tier with latest-gen TOPCon cells. Wide availability.                                                                      |
| 7    | CW Energy          | —                   | 450W    | 23.0%      | N-type                  | Highest efficiency panel on EnergySage marketplace.                                                                                     |
| 8    | SEG Solar          | Yukon N             | 585W    | 22.65%     | N-type (larger format)  | Highest wattage on EnergySage — physically larger panel, exceptional power density.                                                     |

## Large Commercial / Utility-Scale Panels (600W+)

For ground mount or large flat commercial roofs, panels now exceed 600–700W using N-type TOPCon and HJT technology. These are physically larger (2+ meters long) and primarily designed for solar farms and large commercial arrays — not typical car wash rooftops.

| Manufacturer   | Wattage Range | Efficiency | Technology             |
| -------------- | ------------- | ---------- | ---------------------- |
| JinkoSolar     | Up to 670W    | 24.8%      | N-type TOPCon          |
| LONGi          | Up to 660W    | 24.5%      | HPBC / TOPCon          |
| Canadian Solar | Up to 670W    | 24.8%      | N-type TOPCon bifacial |
| Trina Solar    | Up to 700W    | 25.0%      | N-type HJT             |

## Technology Landscape

The solar industry has undergone a major technology shift. The old standard (P-type PERC) has been replaced by N-type technologies, pushing mass-production efficiencies from 21% to 24–25%.

**Three competing N-type architectures:**

- **ABC / IBC (All Back Contact):** Highest efficiency (25%+). All electrical contacts on rear of cell — zero front-side shading. Used by Aiko, Maxeon, Recom. Premium price.
- **TOPCon (Tunnel Oxide Passivated Contact):** Best value-to-performance ratio (23.5–24.8%). Used by JinkoSolar, Trina, Canadian Solar, LONGi. Closest to cost parity with older tech.
- **HJT (Heterojunction):** Best temperature coefficient — performs well in hot climates. Used by REC, Huasun, some Trina models. 22–25% efficiency.

## CRITICAL: US Manufacturing & Tariff Compliance

**All panels in Merlin's model must be US-manufactured or tariff-exempt to avoid significant cost penalties.**

Current tariff landscape (2026): Section 201 tariffs, AD/CVD duties on Southeast Asian imports, and the Section 232 polysilicon investigation all add 15–50%+ to imported panel costs. Additionally, FEOC (Foreign Entity of Concern) compliance is now required for any project using the Section 48/48E commercial ITC — panels with Chinese-origin components disqualify the project from the 30% tax credit.

## US-Manufactured Solar Panels — The Actual Options

### Tier 1: Premium US-Made (Recommended for Merlin)

| Manufacturer  | Model                   | Wattage  | Efficiency | US Factory                     | FEOC Compliant | Notes                                                                                                                                                                            |
| ------------- | ----------------------- | -------- | ---------- | ------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Silfab Solar  | Elite BG (back-contact) | 410–420W | 22.0%      | Burlington, WA + Fort Mill, SC | Yes            | Highest efficiency panel made exclusively in USA. Back-contact tech. 25-yr product / 30-yr power warranty. Buy America certified.                                                |
| Silfab Solar  | SIL-440 QD (HJT)        | 440W     | 22.2%      | Burlington, WA                 | Yes            | HJT technology, excellent temp coefficient (-0.26%/°C). Best for hot climates. Wind load 5,400 Pa — nearly 2x industry avg.                                                      |
| Silfab Solar  | Commercial XM+ (NTC)    | 570–590W | ~23%       | Burlington, WA                 | Yes            | Large-format commercial panel. N-type TOPCon. Ideal for car wash roof applications.                                                                                              |
| Mission Solar | MSE PERC 60             | 400–420W | ~20.5%     | San Antonio, TX                | Yes            | Adding 2 GW cell production by early 2026. Polysilicon sourced via Malaysia (non-FEOC).                                                                                          |
| First Solar   | Series 7                | 540–560W | ~19.5%     | Ohio, Alabama, Louisiana       | Yes            | CdTe thin-film (not silicon). Fully vertically integrated US supply chain — zero Chinese content. Lower efficiency but completely tariff-immune. 14+ GW US capacity by end 2026. |
| QCells        | Q.PEAK DUO              | 410W     | ~21.4%     | Dalton, GA                     | Partial        | 5.1 GW Georgia factory. Strong value per watt. FEOC status depends on cell sourcing — verify per lot.                                                                            |
| CW Energy     | —                       | 450W     | 23.0%      | US-assembled                   | Verify         | Highest efficiency on EnergySage at lowest $/W ($2.17/W). Verify FEOC cell sourcing.                                                                                             |

### Tier 2: US-Assembled from Non-FEOC Sources

| Manufacturer              | Model         | Wattage  | Efficiency | Assembly Location    | Notes                                                                                          |
| ------------------------- | ------------- | -------- | ---------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| Canadian Solar            | HiKu / BiHiKu | 400–590W | 21–22%     | Mesquite, TX (5 GW)  | TOPCon. Cell plant planned for Jeffersonville, IN. Verify FEOC per lot.                        |
| JinkoSolar                | Tiger Neo     | 480W     | 24.0%      | Jacksonville, FL     | Highest efficiency of US-assembled options. Cells imported — FEOC status varies by lot.        |
| Illuminate USA (LONGi JV) | —             | 400–580W | 21–23%     | Pataskala, OH (5 GW) | LONGi/Invenergy JV. Massive Ohio factory. LONGi ownership raises FEOC questions — verify.      |
| Heliene                   | Various       | 400–450W | 20–21.5%   | Mountain Iron, MN    | Fully domestic bill of materials possible (Hemlock polysilicon, Corning wafers, Suniva cells). |

### Key Takeaway for Merlin's Model

**Silfab is the strongest US-manufactured option for car wash projects.** Their commercial XM+ series (570–590W, ~23% efficiency, N-type TOPCon) is made in Washington state, is FEOC compliant, Buy America certified, and carries the industry's best wind load rating — critical for carport and exposed roof installations in Michigan.

For the premium roof upgrade strategy:

- **160 Silfab XM+ panels (580W) on 4,225 sq ft = ~93 kW** — significantly higher than our earlier 80 kW estimate using generic premium panels
- This strengthens the business case further: more kW from the same roof, fully US-made, zero tariff risk

**First Solar is the safest tariff play** — completely vertically integrated US supply chain with zero Chinese content — but lower efficiency (19.5%) means you'd get less capacity from the same roof. Best suited for ground mount or carport where space isn't constrained.

**Avoid** panels where FEOC compliance can't be verified per lot — losing the 30% ITC on a $200K system is a $60K hit.

---

## Recommended Panel Tiers for Merlin's Platform

**Standard Tier (Default):** QCells Q.PEAK DUO 410W or Mission Solar 420W — best $/W value, US-manufactured, solid 20–21% efficiency.

**Premium Tier (Upgrade):** Silfab Commercial XM+ 580W — highest US-made efficiency at ~23%, FEOC compliant, 30-year warranty. Maximizes kW per sq ft of roof.

**Maximum Resilience Tier:** First Solar Series 7 — zero tariff risk, fully US supply chain. Lower efficiency but completely immune to trade policy changes. Best for ground mount or carport arrays where panel count isn't constrained.

## DEFINITIVE: Highest Efficiency US-Manufactured Solar Panels (April 2026) — With Pricing

**Silfab dominates this category.** They are the only US manufacturer with multiple product lines spanning 22–23% efficiency across residential, commercial, and utility formats — all made in Washington state, all FEOC compliant, all Buy America certified.

| Rank | Manufacturer      | Model                   | Wattage  | Efficiency | Technology             | US Factory                 | Module $/W   | Installed $/W | FEOC    | Warranty                    |
| ---- | ----------------- | ----------------------- | -------- | ---------- | ---------------------- | -------------------------- | ------------ | ------------- | ------- | --------------------------- |
| 1    | **Silfab**        | Commercial XM+ (NTC)    | 570–590W | ~23%       | N-type TOPCon bifacial | Burlington, WA             | $0.90–$1.10  | $2.85–$3.05   | Yes     | 25-yr product / 30-yr power |
| 2    | **Silfab**        | Utility XL (NTC)        | 620–640W | ~23%       | N-type TOPCon bifacial | Burlington, WA             | $0.85–$1.05  | ~$2.80–$3.00  | Yes     | 25-yr / 30-yr               |
| 3    | **CW Energy**     | CWT595-144TNB10         | 595W     | ~23%       | N-type bifacial        | US-assembled               | ~$0.32–$0.45 | ~$2.17–$2.50  | Verify  | 12-yr product / 30-yr power |
| 4    | **CW Energy**     | CWT450-108TNFB10        | 450W     | 23.0%      | N-type all-black       | US-assembled               | ~$0.32–$0.45 | ~$2.17–$2.50  | Verify  | 12-yr / 30-yr               |
| 5    | **Silfab**        | SIL-440 QD (HJT)        | 440W     | 22.2%      | Heterojunction         | Burlington, WA             | $0.95–$1.25  | $2.85–$3.05   | Yes     | 25-yr / 30-yr               |
| 6    | **Silfab**        | Elite BG (back-contact) | 410–420W | 22.0%      | Back-contact PERC      | Burlington, WA             | $0.95–$1.25  | $2.85–$3.05   | Yes     | 25-yr / 30-yr               |
| 7    | **QCells**        | Q.PEAK DUO BLK ML-G10+  | 410W     | 21.1%      | Mono PERC half-cut     | Dalton, GA                 | $0.70–$1.00  | $2.71–$3.47   | Partial | 25-yr / 25-yr               |
| 8    | **Mission Solar** | MSE series              | 400–420W | ~20.5%     | Mono PERC              | San Antonio, TX            | $0.85–$1.05  | ~$2.80–$3.00  | Yes     | 25-yr / 30-yr               |
| 9    | **First Solar**   | Series 7                | 540–560W | 19.5%      | CdTe thin-film         | Ohio / Alabama / Louisiana | $0.30–$0.35  | ~$2.00–$2.50  | Yes     | 25-yr / 30-yr               |

**Price notes:**

- Module $/W = panel cost only, wholesale/distributor pricing
- Installed $/W = full system cost including inverter, BOS, labor, permits (residential/small commercial)
- CW Energy has the lowest module cost among US-assembled panels at ~$0.32/W ($180 per 550W panel wholesale) but shorter product warranty (12 yr vs Silfab's 25 yr)
- QCells is the value leader at $0.70–$1.00/W module cost with strong volume availability from their 5.1 GW Georgia factory
- First Solar has the cheapest modules ($0.30–$0.35/W) but lowest efficiency — best for ground mount where space isn't constrained
- Silfab commands a premium ($0.90–$1.25/W) but delivers the highest efficiency, best warranty, and strongest wind/snow load ratings among US-made panels

**For Merlin's car wash rooftop application (space-constrained, need max kW per sq ft):**

- Best choice: **Silfab XM+ 590W** — highest watts per panel, 23% efficiency, made in USA
- Best value: **CW Energy 595W** — similar performance at ~60% lower module cost, but verify FEOC and note shorter warranty
- Budget: **QCells 410W** — proven, available, lowest risk per dollar, but 21% efficiency means less kW from same roof

---

## Panel Pricing (Module Cost Only, Before Installation)

| Panel                               | Origin        | Module $/W       | Tariff  | Landed $/W in US | FEOC?      |
| ----------------------------------- | ------------- | ---------------- | ------- | ---------------- | ---------- |
| Silfab Elite 420W                   | USA (WA)      | $0.95–$1.25      | $0      | $0.95–$1.25      | Yes        |
| Silfab Commercial XM+ 590W          | USA (WA)      | ~$0.90–$1.10     | $0      | ~$0.90–$1.10     | Yes        |
| QCells Q.PEAK DUO 410W              | USA (GA)      | ~$0.80–$1.00     | $0      | ~$0.80–$1.00     | Partial    |
| Mission Solar 420W                  | USA (TX)      | ~$0.85–$1.05     | $0      | ~$0.85–$1.05     | Yes        |
| First Solar Series 7 555W           | USA (OH/AL)   | ~$0.30–$0.35     | $0      | ~$0.30–$0.35     | Yes        |
| Jinko Tiger Neo 480W (China direct) | China         | ~$0.09–$0.12 FOB | ~50–70% | ~$0.15–$0.20     | No         |
| Jinko Tiger Neo 480W (US assembled) | USA (FL)      | ~$0.35–$0.45     | $0      | ~$0.35–$0.45     | Varies     |
| Aiko Neostar 510W                   | China         | ~$0.10–$0.14 FOB | ~50–70% | ~$0.17–$0.24     | No         |
| LONGi Hi-MO X10 490W                | China / OH JV | ~$0.09–$0.45     | Varies  | ~$0.15–$0.45     | FEOC risk  |
| Indian TOPCon 500W                  | India         | ~$0.15–$0.20 FOB | ~27–37% | ~$0.19–$0.25     | Likely yes |

**US tariff stack on imports (April 2026):**

- **China direct:** Section 301 (25%) + Section 201 (14.75%) + AD/CVD (15–250%) + reciprocal (34%) = 50–70%+ cumulative. Essentially prohibitive.
- **SE Asia (Vietnam, Thailand, Cambodia):** AD/CVD up to 3,500% on some producers + reciprocal 24–49%. Route is largely closed.
- **India:** 27% reciprocal + 10% baseline. No current AD/CVD. Total ~27–37%. Lowest-tariff import option.
- **US-manufactured:** $0 tariff. Eligible for domestic content bonus (up to 10% additional ITC = 40% total).

---

## Scenario Analysis: Payback by Panel Choice (Roof System, Michigan)

Assumptions: 4,225 sq ft usable roof, ~155 panels, 4.2 PSH, DTE $0.15/kWh + $14/kW demand, install labor + BOS ~$0.90/W, BESS 100 kWh ~$70K gross.

### Scenario A: Silfab Commercial XM+ 590W (US-Made Premium)

| Item           | Value                                    |
| -------------- | ---------------------------------------- |
| System size    | 155 × 590W = **91.5 kW**                 |
| Module cost    | $91,500 ($1.00/W)                        |
| Install + BOS  | $82,350                                  |
| BESS           | $70,000                                  |
| **Gross**      | **$243,850**                             |
| 30% ITC        | −$73,155                                 |
| **Net**        | **$170,695**                             |
| Annual savings | $22K–$27K                                |
| **Payback**    | **6.3–7.8 years**                        |
| Risk           | **Lowest** — zero tariff, zero FEOC risk |

### Scenario B: QCells 410W (US-Made Value)

| Item           | Value                    |
| -------------- | ------------------------ |
| System size    | 155 × 410W = **63.6 kW** |
| Module cost    | $57,240 ($0.90/W)        |
| Install + BOS  | $57,240                  |
| BESS           | $70,000                  |
| **Gross**      | **$184,480**             |
| 30% ITC        | −$55,344                 |
| **Net**        | **$129,136**             |
| Annual savings | $16K–$20K                |
| **Payback**    | **6.5–8.1 years**        |
| Risk           | Low                      |

### Scenario C: Aiko 510W (China Import — Highest Global Efficiency)

| Item                                        | Value                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| System size                                 | 155 × 510W = **79.1 kW**                                                                    |
| Module cost (FOB)                           | $9,492 ($0.12/W)                                                                            |
| Tariffs (~60%)                              | +$5,695                                                                                     |
| Landed module                               | $15,187 ($0.19/W)                                                                           |
| Install + BOS                               | $71,190                                                                                     |
| BESS                                        | $70,000                                                                                     |
| **Gross**                                   | **$156,377**                                                                                |
| ITC: **$0 — FEOC non-compliant, no credit** | —                                                                                           |
| **Net**                                     | **$156,377**                                                                                |
| Annual savings                              | $20K–$24K                                                                                   |
| **Payback**                                 | **6.5–7.8 years**                                                                           |
| Risk                                        | **Highest** — no ITC ($47K lost), tariff policy can change, warranty enforcement from China |

### Scenario D: Indian TOPCon 500W (Import)

| Item                            | Value                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| System size                     | 155 × 500W = **77.5 kW**                                                           |
| Module cost (FOB)               | $13,950 ($0.18/W)                                                                  |
| Tariffs (~30%)                  | +$4,185                                                                            |
| Landed module                   | $18,135 ($0.23/W)                                                                  |
| Install + BOS                   | $69,750                                                                            |
| BESS                            | $70,000                                                                            |
| **Gross**                       | **$157,885**                                                                       |
| 30% ITC (likely FEOC compliant) | −$47,366                                                                           |
| **Net**                         | **$110,520**                                                                       |
| Annual savings                  | $19K–$23K                                                                          |
| **Payback**                     | **4.8–5.8 years**                                                                  |
| Risk                            | **Medium** — no current AD/CVD but could change; quality/warranty enforcement risk |

### Scenario E: First Solar Series 7 555W (Full US Supply Chain)

| Item                               | Value                                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| System size                        | 155 × 555W = **86 kW**                                                                                                                   |
| Module cost                        | $28,380 ($0.33/W)                                                                                                                        |
| Install + BOS                      | $77,400                                                                                                                                  |
| BESS                               | $70,000                                                                                                                                  |
| **Gross**                          | **$175,780**                                                                                                                             |
| 30% ITC                            | −$52,734                                                                                                                                 |
| Domestic content bonus (10% extra) | −$17,578                                                                                                                                 |
| **Net**                            | **$105,468**                                                                                                                             |
| Annual savings                     | $21K–$25K                                                                                                                                |
| **Payback**                        | **4.2–5.0 years**                                                                                                                        |
| Risk                               | **Zero** — fully integrated US supply chain, eligible for 40% total ITC                                                                  |
| Caveat                             | CdTe thin-film (19.5% eff). Larger format. First Solar prioritizes utility-scale — availability for 80 kW commercial rooftops uncertain. |

---

## Summary: All Scenarios Side-by-Side

| Scenario             | Panel    | kW   | Net Cost | Payback    | 10-yr ROI | Risk        |
| -------------------- | -------- | ---- | -------- | ---------- | --------- | ----------- |
| A — Silfab (US)      | XM+ 590W | 91.5 | $170,695 | 6.3–7.8 yr | 29–58%    | Lowest      |
| B — QCells (US)      | 410W     | 63.6 | $129,136 | 6.5–8.1 yr | 24–55%    | Low         |
| C — Aiko (China)     | 510W     | 79.1 | $156,377 | 6.5–7.8 yr | 28–54%    | **Highest** |
| D — Indian TOPCon    | 500W     | 77.5 | $110,520 | 4.8–5.8 yr | 73–108%   | Medium      |
| E — First Solar (US) | Series 7 | 86.0 | $105,468 | 4.2–5.0 yr | 100–137%  | **Zero**    |

### Key Takeaways

1. **Chinese panels are a trap.** Module cost is 80% cheaper but losing the 30% ITC ($47K) and paying 50–70% tariffs wipes out the savings entirely. Scenario C has nearly identical payback to Scenario A despite modules costing 1/8th as much.

2. **First Solar is the surprise winner on paper** — lowest net cost and fastest payback because of the domestic content bonus (40% total ITC). The catch: lower efficiency, larger format, and First Solar prioritizes utility-scale. Availability for car wash rooftops is uncertain.

3. **Indian panels are the best import option** — 27% tariff is manageable, ITC preserved, and payback is fastest of the realistic options. But quality consistency, warranty enforcement, and future AD/CVD risk are real. This is a cost advantage that could evaporate if trade policy shifts.

4. **Silfab is the right default for Merlin** — zero tariff, zero FEOC risk, highest US-made commercial efficiency (~23%), 30-year warranty, Buy America certified. The module premium is real but offset by ITC eligibility and supply chain certainty. For PE deploying across 90 sites, supply chain risk matters more than module cost.

5. **The model should show all scenarios.** Let Sarah's team choose their risk tolerance. Some PE firms will go Indian import for the faster payback; others will insist on US-only for policy certainty.

---

## EL CAR WASH BUSINESS CASE: Florida vs Michigan — Silfab XM+ 590W

> **PANELS EVALUATED FOR BUSINESS CASE:**
> Six manufacturers compared — Canadian Solar, JinkoSolar, LONGi/Illuminate, CW Energy, Trina Solar, and QCells. Silfab included as reference but flagged for supply chain risk due to South Carolina facility issues (see risk assessment below).

### Panel Comparison: All Viable Options for Car Wash Rooftop

| Manufacturer         | Model           | Wattage  | Efficiency | Technology              | Origin                         | Module $/W                                        | Wind/Snow Pa  | Product Warranty | Power Warranty | FEOC                        |
| -------------------- | --------------- | -------- | ---------- | ----------------------- | ------------------------------ | ------------------------------------------------- | ------------- | ---------------- | -------------- | --------------------------- |
| **JinkoSolar**       | Tiger Neo 3.0   | 580–600W | 23.2%      | N-type TOPCon           | US-assembled (Jacksonville FL) | $0.35–$0.45                                       | 4,000/5,400   | 12 yr            | 30 yr          | Verify per lot              |
| **CW Energy**        | CWT595 bifacial | 595W     | ~23%       | N-type bifacial         | US-assembled                   | ~$0.32                                            | Standard      | 12 yr            | 30 yr          | Verify                      |
| **Canadian Solar**   | TOPBiHiKu7      | 590–615W | 22.5–22.8% | N-type TOPCon bifacial  | US-assembled (Mesquite TX)     | $0.35–$0.45                                       | 5,400/2,400   | 12 yr            | 30 yr          | Verify per lot              |
| **LONGi/Illuminate** | Hi-MO 7         | 590W     | 22.8%      | HPBC 2.0 (back-contact) | US JV (Pataskala OH)           | $0.35–$0.45                                       | Standard      | 12 yr            | 30 yr          | FEOC risk (LONGi ownership) |
| **Trina Solar**      | Vertex N+       | 580–600W | 22.4%      | N-type TOPCon           | China (tariff applies)         | $0.26–$0.33 + ~30–46% tariff = $0.34–$0.48 landed | Standard      | 15 yr            | 30 yr          | No                          |
| **QCells**           | Q.PEAK DUO XL   | 480–485W | 21.4%      | Mono PERC               | US (Dalton GA)                 | $0.70–$1.00                                       | 5,400/4,000   | 25 yr            | 25 yr          | Partial                     |
| _Silfab_             | _XM+ 590W_      | _590W_   | _~23%_     | _N-type TOPCon_         | _US (Burlington WA)_           | _$0.90–$1.10_                                     | _5,400/5,400_ | _25 yr_          | _30 yr_        | _Yes_                       |

**Why module $/W varies so dramatically:**

- Silfab ($0.90–$1.10): True US cell + module manufacturing, premium frame/glass spec, small scale (~1 GW/yr)
- QCells ($0.70–$1.00): US module manufacturing with Korean cell technology, mid-scale
- Jinko/Canadian Solar/LONGi ($0.35–$0.45): Import cells from SE Asia, assemble modules in US. Massive global scale (50–100+ GW). The cell manufacturing — the expensive step — happens offshore
- CW Energy ($0.32): Lowest cost US-assembled option, Turkish parent company
- Trina ($0.26–$0.33 FOB): China-manufactured, but 30–46% tariff adds $0.08–$0.15/W. FEOC non-compliant = no ITC

### Silfab Risk Assessment — IMPORTANT

Silfab's Washington state module factory (where the XM+ 590W is made) remains operational. However:

- **Fort Mill, SC cell factory:** Ordered to cease all operations by SC Dept of Environmental Services (March 2026) after chemical spills, 13 documented 911 calls, hydrofluoric acid incidents
- **$4.5M in mechanics liens** from unpaid contractors at the SC facility
- **Lawsuits** from local businesses for unpaid work ($80K+)
- **State lawmakers** requested formal investigation
- **Revenue:** ~$90.8M/yr — small relative to competitors (Canadian Solar $7B+, Jinko $15B+)

The WA module production is unaffected, but the SC situation creates: (a) cash flow uncertainty, (b) cell supply chain risk if SC doesn't restart, (c) management distraction. **Recommendation: Do not make Silfab the sole-source partner for a 90-site portfolio. Use as a secondary option if FEOC-verified alternatives can't be sourced.**

### Florida & Michigan Ratings — Confirmed

**Florida (Hurricane Zone):**

- Wind load: 5,400 Pa uplift — rated for wind speeds up to 180 mph per ASCE 7-16 (covers Category 5 hurricanes)
- This is nearly 2x the industry average of ~2,400–3,000 Pa
- Salt mist exposure: Tested and certified (IEC 61701) — critical for coastal FL sites
- Ammonia corrosion resistance: Certified (IEC 62716)
- Dynamic mechanical load (DML) tested: 1,000 cycles of push-pull at ±1,000 Pa simulating hurricane conditions, followed by thermal cycling and humidity-freeze — exceeds IEC 62782 requirements
- Hail resistance: 1-inch hailstones at 51.6 mph

**Michigan (Snow/Cold):**

- Snow load: 5,400 Pa front load (112 PSF) — far exceeds Michigan's 25–50 PSF requirement
- Panels designed to handle extreme winter, heat, and humidity per Silfab's North American engineering specification
- Engineered frame profile designed for enhanced strength and rigidity under load
- Low-light performance optimized — anti-reflective glass coating enhances capture at low sun angles (winter season, sunrise/sunset)
- PVEL Top Performer in thermal cycling (600 cycles at −40°C to 85°C) and damp heat (2,000 hours)

### Verified US Installations & Use Cases

**Florida:**

- **Delray Beach, FL** — 34.44 kW Silfab Elite system (84 panels), metal roof mount, installed by Solar Tech Elec, sourced from Rexel Tampa. Delivers $700/month savings. Customer quote: "exceptional quality and sleek all-black design"
- **Florida Solar Power** (certified Silfab installer) — actively deploying Silfab panels across Florida residential and commercial projects, specifically marketing the hurricane-rated wind load for FL customers
- **Freedom Energy** — deploying Silfab Prime panels with IronRidge racking certified for Florida's high-velocity hurricane zones

**Michigan / Snow Belt:**

- Silfab panels carry 112 PSF snow load rating — more than double Michigan's typical 25–50 PSF requirement
- Washington state factory (Burlington, WA) is itself in a heavy snow/rain climate; panels are engineered and tested in real Pacific Northwest conditions
- PVEL thermal cycling at −40°C validates performance in Michigan winters

**National / High-Profile:**

- **US Military buildings** — Silfab panels deployed on military installations
- **US State Department** — Silfab panels used on State Department facilities
- **FAA facilities** — Silfab panels deployed on Federal Aviation Administration buildings
- **Pivot Energy** — 350 MW multi-year supply agreement for community solar across 9 states (CA, CO, DE, HI, IL, MD, MN, NY, VA) using Silfab Commercial XM+ 580W panels
- **Greentech Renewables** — Silfab-powered commercial facility in Maine
- **Kiwa PVEL Top Performer** — SIL-530 XM and SIL-580 XM+ both earned Top Performer status in independent third-party testing

**Silfab's Scale & Financial Backing:**

- $100M raised (November 2024) to scale cell manufacturing at Fort Mill, South Carolina
- 3 manufacturing facilities: Burlington WA, Toronto ON, Fort Mill SC
- 1.1 GW module capacity (Washington) + expanding SC cell + module production
- ISO 9001:2015 certified across all facilities
- 99.996% functionality rating on delivered modules

---

## ⚠️ CRITICAL RISK ALERT: Silfab South Carolina Operations (Updated April 2026)

**The South Carolina cell manufacturing facility is in serious trouble. This does NOT affect the Washington state module factory where the XM+ 590W panels are made, but it raises material supply chain and financial concerns.**

### What Happened

1. **Operations ordered to cease** — South Carolina Department of Environmental Services directed Silfab to cease all operations at the Fort Mill, SC facility following multiple chemical incidents including a 300-gallon potassium hydroxide spill and hydrofluoric acid incidents (March 2026)
2. **13 documented 911 calls** in one year — employees experiencing health problems including difficulty breathing. State lawmakers requested a formal investigation (April 2026)
3. **$4.5M in mechanics liens** — 10 liens filed by unpaid contractors who built the facility, with $1.56M still outstanding. Four new liens filed in the final two weeks of March 2026 alone
4. **Lawsuit from local contractor** — Rock Hill Industrial Piping sued Silfab for $80K in unpaid invoices for completed piping work (March 2026)
5. **Whistleblower lawsuit** — Former quality control tech suing for wrongful termination after raising safety concerns that led to a stop-work order in 2025
6. **Community opposition** — Protests, school closures (Flint Hill Elementary closed), University of South Carolina study on hazardous plume risks, zoning challenges
7. **Silfab agreed to terminate manufacturing operations** at the SC facility pending investigations

### Impact Assessment

| Factor                                           | Status                                                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Washington state module factory (XM+ 590W)       | **Unaffected** — panels still being manufactured                                                                     |
| South Carolina cell factory (1 GW cell capacity) | **Shut down** — future uncertain                                                                                     |
| Financial health                                 | **Concerning** — $90.8M revenue, $401M raised, but unpaid contractor liens and SC shutdown raise cash flow questions |
| Supply chain                                     | **Concentration risk** — if WA factory has issues, no backup US cell/module production                               |
| 350 MW Pivot Energy deal                         | Status unclear — depends on WA factory capacity                                                                      |
| 125 MW Nexamp deal                               | Status unclear                                                                                                       |
| 30-year warranty backing                         | **Risk** — can a company honor 30-year warranties if SC facility fails and finances tighten?                         |

### What This Means for Merlin

Silfab's XM+ 590W panels remain excellent products — the Washington factory is operating normally and the panels are proven. But for a 90-site portfolio deployment over multiple years, you need confidence in the supplier's long-term stability. The SC situation introduces uncertainty that a PE firm will flag.

**Recommendation: Do not drop Silfab, but do not make them the sole supplier. Diversify.**

---

## REVISED PANEL RECOMMENDATION: Dual-Supplier Strategy

### Primary Supplier: Canadian Solar HiKu7 590W (Mesquite, Texas)

| Factor            | Detail                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| Model             | HiKu7 CS7N-590TB-AG                                                                |
| Wattage           | 590W                                                                               |
| Efficiency        | ~22.5%                                                                             |
| Technology        | N-type TOPCon, bifacial                                                            |
| US Factory        | Mesquite, TX (5 GW capacity, operational since late 2024)                          |
| Cell supply       | Building 5 GW cell plant in Jeffersonville, Indiana (late 2025/2026)               |
| Company stability | **Publicly traded (NASDAQ: CSIQ), $7B+ annual revenue, Tier 1 Bloomberg bankable** |
| Warranty          | 25-year product / 30-year performance                                              |
| FEOC              | Verify per lot — cell sourcing transitioning to US/non-FEOC                        |
| Module cost       | ~$0.35–$0.45/W                                                                     |
| Wind/snow load    | 5,400 Pa snow / 2,400 Pa wind (standard, may need to verify hurricane rating)      |

**Why Canadian Solar as primary:**

- Publicly traded = financial transparency, audited statements, SEC oversight
- $7B+ revenue dwarfs Silfab's $91M — no 30-year warranty backing risk
- 5 GW Texas factory is massive — can handle 90-site portfolio without capacity strain
- Building their own US cell plant in Indiana — reducing FEOC risk over time
- Tier 1 Bloomberg bankable status — PE firms know and trust this name
- Panels available today at competitive pricing

**Trade-off vs Silfab:** Slightly lower efficiency (22.5% vs 23%) and standard wind load rating. For Florida hurricane zones, verify the HiKu7's wind load certification — if below 5,400 Pa, Silfab remains the better FL choice.

### Secondary Supplier: Silfab XM+ 590W (Burlington, Washington)

Keep Silfab as the secondary/specialty supplier for:

- Florida hurricane-zone sites where 5,400 Pa wind rating is required
- Sites requiring Buy America certification
- Projects where domestic content ITC bonus (40% total) is pursued
- As backup supply if Canadian Solar has lead time issues

### Alternative Options (Ranked)

| Rank | Manufacturer         | Model         | Wattage | Efficiency | Origin       | Why Consider                                    |
| ---- | -------------------- | ------------- | ------- | ---------- | ------------ | ----------------------------------------------- |
| 1    | **Canadian Solar**   | HiKu7         | 590W    | 22.5%      | USA (TX)     | Primary — financial stability, scale, Tier 1    |
| 2    | **Silfab**           | XM+ 590W      | 590W    | ~23%       | USA (WA)     | Secondary — highest efficiency, hurricane rated |
| 3    | **JinkoSolar**       | Tiger Neo 3.0 | 580W    | 23.2%      | USA (FL)     | Highest efficiency US-assembled, verify FEOC    |
| 4    | **QCells**           | Q.PEAK DUO XL | 480W    | 21.4%      | USA (GA)     | Most stable US supply chain, lower wattage      |
| 5    | **CW Energy**        | 595W bifacial | 595W    | ~23%       | US-assembled | Cheapest module cost, shorter warranty          |
| 6    | **LONGi/Illuminate** | Hi-MO 7       | 590W    | 22.8%      | USA (OH)     | Strong tech, FEOC ownership risk                |

### Revised Business Case Impact (Canadian Solar 590W vs Silfab 590W)

| Metric                   | Silfab XM+ 590W    | Canadian Solar HiKu7 590W    | Delta                |
| ------------------------ | ------------------ | ---------------------------- | -------------------- |
| System size (155 panels) | 91.5 kW            | 91.5 kW                      | Same                 |
| Module cost (91.5 kW)    | $91,500 ($1.00/W)  | $36,600 ($0.40/W)            | **−$54,900**         |
| Total system gross       | $273,500           | $218,600                     | −$54,900             |
| 30% ITC                  | −$82,050           | −$65,580                     |                      |
| Net cost                 | $191,450           | $153,020                     | **−$38,430**         |
| Annual savings (MI)      | $33,645            | $32,500 (slightly lower eff) | −$1,145              |
| Payback (MI)             | 5.7 years          | **4.7 years**                | **1 year faster**    |
| Annual savings (FL)      | $36,500            | $35,200                      | −$1,300              |
| Payback (FL)             | 5.1 years          | **4.3 years**                | **0.8 years faster** |
| 90-site portfolio net    | $17.0M             | **$13.8M**                   | **−$3.2M**           |
| Portfolio payback        | 5.3 years          | **4.3 years**                | **1 year faster**    |
| 25-yr portfolio NPV      | $39.4M             | **$42.1M**                   | **+$2.7M**           |
| Supplier risk            | Medium (SC issues) | **Low (public, $7B rev)**    |                      |

**Canadian Solar's lower module cost ($0.40/W vs $1.00/W) more than compensates for the slight efficiency gap.** The portfolio saves $3.2M in capex, pays back a full year faster, and generates $2.7M more in 25-year NPV — all while reducing supplier risk.

### Action Items

1. **Contact Canadian Solar commercial sales** — Request volume pricing for 90-site car wash portfolio, HiKu7 590W N-type TOPCon, Texas factory. Verify FEOC compliance per lot and FL hurricane wind load rating.
2. **Contact Silfab commercial sales** — Request pricing for XM+ 590W from Washington factory only. Clarify SC facility status and its impact on cell supply for WA modules. Verify 30-year warranty backing given SC financial strain.
3. **Request datasheets from both** — Compare wind load, snow load, temperature coefficient, and degradation rates side-by-side for FL and MI installations.
4. **Brief Warburg Pincus on dual-supplier strategy** — PE firms prefer supply chain diversification. Having two qualified panel suppliers de-risks the portfolio deployment.

### Rate & Solar Resource Comparison

| Factor                     | Michigan (Novi / DTE Energy)  | Florida (Miami-Dade / FPL)                       |
| -------------------------- | ----------------------------- | ------------------------------------------------ |
| Commercial energy rate     | $0.15/kWh                     | $0.11–$0.125/kWh                                 |
| Demand charge              | $14.00/kW                     | $13.68–$17.41/kW (increasing 2026–2029)          |
| Peak Sun Hours (PSH)       | 4.2                           | 5.5–6.0                                          |
| Frost line (footing depth) | 42 inches                     | None                                             |
| Snow load                  | 25–50 PSF                     | None                                             |
| Hurricane wind risk        | Low                           | High (Silfab's 5,400 Pa rating is critical here) |
| Net metering               | Available (varies by utility) | FPL 1:1 net metering (kWh credits)               |
| State solar tax            | Standard                      | 0% sales tax on solar equipment                  |

### System Capacity by Panel Choice (Same 4,225 sq ft Roof, ~155 Panels)

| Panel                     | Wattage | Total Capacity | vs QCells Baseline |
| ------------------------- | ------- | -------------- | ------------------ |
| JinkoSolar Tiger Neo 3.0  | 600W    | **93.0 kW**    | +46%               |
| CW Energy CWT595          | 595W    | **92.2 kW**    | +45%               |
| Canadian Solar TOPBiHiKu7 | 600W    | **93.0 kW**    | +46%               |
| LONGi Hi-MO 7             | 590W    | **91.5 kW**    | +44%               |
| Trina Vertex N+           | 600W    | **93.0 kW**    | +46%               |
| QCells Q.PEAK DUO XL      | 485W    | **75.2 kW**    | Baseline           |

---

### Michigan Business Case — All Panels (El Car Wash Novi, DTE Energy)

_Constants: 4.2 PSH, $0.15/kWh, $14/kW demand charge, BESS 150 kWh ($70K), install labor+BOS $0.90/W, 320–350 kW peak_

|                    | JinkoSolar 600W | CW Energy 595W | Canadian Solar 600W | LONGi 590W     | Trina 600W                         | QCells 485W    |
| ------------------ | --------------- | -------------- | ------------------- | -------------- | ---------------------------------- | -------------- |
| **Capacity**       | 93.0 kW         | 92.2 kW        | 93.0 kW             | 91.5 kW        | 93.0 kW                            | 75.2 kW        |
| **Module cost**    | $37,200         | $29,500        | $37,200             | $36,600        | $30,690 + $12,300 tariff = $42,990 | $60,160        |
| **Install + BOS**  | $83,700         | $83,000        | $83,700             | $82,350        | $83,700                            | $67,680        |
| **BESS**           | $70,000         | $70,000        | $70,000             | $70,000        | $70,000                            | $70,000        |
| **Gross total**    | $190,900        | $182,500       | $190,900            | $188,950       | $196,690                           | $197,840       |
| **30% ITC**        | −$57,270        | −$54,750       | −$57,270            | −$56,685       | **$0** (FEOC fail)                 | −$59,352       |
| **Net cost**       | **$133,630**    | **$127,750**   | **$133,630**        | **$132,265**   | **$196,690**                       | **$138,488**   |
| **Annual savings** | $34K–$36K       | $33.5K–$35.5K  | $34K–$36K           | $33.5K–$35.5K  | $34K–$36K                          | $26K–$29K      |
| **Payback**        | **3.7–3.9 yr**  | **3.6–3.8 yr** | **3.7–3.9 yr**      | **3.7–3.9 yr** | **5.5–5.8 yr**                     | **4.8–5.3 yr** |
| **10-yr ROI**      | 155–170%        | 163–178%       | 155–170%            | 153–168%       | 83–97%                             | 87–110%        |
| **FEOC risk**      | Verify per lot  | Verify         | Verify per lot      | FEOC risk      | **No ITC**                         | Partial        |

### Florida Business Case — All Panels (El Car Wash Miami, FPL)

_Constants: 5.7 PSH, $0.114/kWh, $13.68/kW demand charge (rising to $17.41), BESS 150 kWh ($70K), install labor+BOS $0.85/W (easier install, no frost), 300–340 kW peak_

|                    | JinkoSolar 600W | CW Energy 595W | Canadian Solar 600W | LONGi 590W     | Trina 600W          | QCells 485W    |
| ------------------ | --------------- | -------------- | ------------------- | -------------- | ------------------- | -------------- |
| **Capacity**       | 93.0 kW         | 92.2 kW        | 93.0 kW             | 91.5 kW        | 93.0 kW             | 75.2 kW        |
| **Module cost**    | $37,200         | $29,500        | $37,200             | $36,600        | $42,990 (w/ tariff) | $60,160        |
| **Install + BOS**  | $79,050         | $78,370        | $79,050             | $77,775        | $79,050             | $63,920        |
| **BESS**           | $70,000         | $70,000        | $70,000             | $70,000        | $70,000             | $70,000        |
| **Gross total**    | $186,250        | $177,870       | $186,250            | $184,375       | $192,040            | $194,080       |
| **30% ITC**        | −$55,875        | −$53,361       | −$55,875            | −$55,313       | **$0** (FEOC fail)  | −$58,224       |
| **Net cost**       | **$130,375**    | **$124,509**   | **$130,375**        | **$129,063**   | **$192,040**        | **$135,856**   |
| **Annual savings** | $36K–$38K       | $35.5K–$37.5K  | $36K–$38K           | $35.5K–$37.5K  | $36K–$38K           | $27K–$31K      |
| **Payback**        | **3.4–3.6 yr**  | **3.3–3.5 yr** | **3.4–3.6 yr**      | **3.4–3.6 yr** | **5.1–5.3 yr**      | **4.4–5.0 yr** |
| **10-yr ROI**      | 176–192%        | 185–201%       | 176–192%            | 175–191%       | 88–98%              | 99–128%        |
| **FEOC risk**      | Verify per lot  | Verify         | Verify per lot      | FEOC risk      | **No ITC**          | Partial        |

---

### Side-by-Side Summary: Best Options

| Metric             | JinkoSolar 600W           | CW Energy 595W | Canadian Solar 600W           | QCells 485W     |
| ------------------ | ------------------------- | -------------- | ----------------------------- | --------------- |
| MI payback         | 3.7–3.9 yr                | **3.6–3.8 yr** | 3.7–3.9 yr                    | 4.8–5.3 yr      |
| FL payback         | 3.4–3.6 yr                | **3.3–3.5 yr** | 3.4–3.6 yr                    | 4.4–5.0 yr      |
| MI 10-yr ROI       | 155–170%                  | **163–178%**   | 155–170%                      | 87–110%         |
| FL 10-yr ROI       | 176–192%                  | **185–201%**   | 176–192%                      | 99–128%         |
| Module cost risk   | Low                       | Low            | Low                           | Lowest          |
| FEOC certainty     | Medium                    | Medium         | Medium                        | Medium          |
| Warranty strength  | 12/30 yr                  | 12/30 yr       | 12/30 yr                      | 25/25 yr        |
| Company stability  | **Strongest** ($15B+ rev) | Smaller        | **Strong** ($7B+ rev, NASDAQ) | Strong (Hanwha) |
| Wind rating for FL | 4,000 Pa                  | Standard       | 5,400 Pa                      | 5,400 Pa        |

### Why Trina and LONGi Fall Off

- **Trina:** Excellent panel, but importing from China means 30–46% tariff AND FEOC non-compliance = lose the 30% ITC. A $31K panel becomes $43K landed, with no tax credit. Payback jumps to 5.5+ years. Dead on arrival.
- **LONGi/Illuminate:** The Ohio JV factory is promising, but LONGi Green Energy is a Chinese-listed company. FEOC determination on LONGi-origin cells is uncertain and could change with any policy update. Too much risk for a 90-site commitment.

---

### REVISED RECOMMENDATION: Tiered Approach

**Primary (Default):** Canadian Solar TOPBiHiKu7 600W from Mesquite, TX

- Publicly traded (NASDAQ: CSIQ), $7B+ revenue, strongest balance sheet
- 5 GW US factory capacity, building Indiana cell plant
- 5,400 Pa snow load — handles both FL and MI
- $0.35–$0.45/W module = $37K for 93 kW system
- **Payback: 3.4–3.9 years** (FL/MI range)

**Value Alternative:** CW Energy CWT595 595W (US-assembled)

- Lowest module cost at $0.32/W = $29.5K for 92.2 kW
- **Fastest payback: 3.3–3.8 years**
- Tradeoff: 12-yr product warranty (shorter), smaller company, verify FEOC

**Performance Alternative:** JinkoSolar Tiger Neo 3.0 600W (Jacksonville, FL)

- Highest efficiency at 23.2% — more kWh per panel
- World's #1 panel manufacturer by volume
- US assembly in FL = local to El Car Wash FL sites
- Verify FEOC per lot — cells imported from SE Asia

**Conservative / Government:** QCells Q.PEAK DUO XL 485W (Dalton, GA)

- Lower wattage (485W vs 600W = 75 kW vs 93 kW from same roof)
- But: 25-year product warranty, 5,400 Pa wind, strongest US supply chain certainty
- Backed by Hanwha Group ($40B+ conglomerate)
- Best choice if FEOC verification is too burdensome at scale

**For Merlin's model:** Show all four tiers with transparent tradeoffs. Let Sarah's PE team choose their risk/cost/warranty balance.

---

### SPECIAL ANALYSIS: Trina Solar Vertex N G3 760W — Does Higher Wattage Shift the Economics?

Trina announced the Vertex N G3 at up to 760W with 24.4% efficiency using upgraded n-type i-TOPCon Ultra technology. Full commercialization expected Q3 2026. Seven key advantages include 85% bifaciality, 0.26%/°C temperature coefficient, 0.35% annual degradation, and enhanced shading tolerance.

**The question: does 760W per panel overcome the tariff and FEOC penalty through sheer power density?**

**Physics first — bigger watts = bigger panel:**

A 760W panel at ~24.4% efficiency is physically ~2.4m × 1.3m = 33.6 sq ft. A 600W panel at 22.5–23% is ~2.3m × 1.1m = 27.5 sq ft. Higher wattage doesn't mean more kW from the same roof — the panel is physically larger, so fewer fit.

| Panel               | Size (sq ft) | Panels on 4,225 sq ft | Total kW    | vs Baseline |
| ------------------- | ------------ | --------------------- | ----------- | ----------- |
| Trina 760W          | 33.6         | ~126                  | **95.8 kW** | +3%         |
| Canadian Solar 600W | 27.5         | ~155                  | **93.0 kW** | Baseline    |
| JinkoSolar 600W     | 27.5         | ~155                  | **93.0 kW** | Baseline    |
| QCells 485W         | 25.5         | ~166                  | **80.5 kW** | −13%        |

**Only +2.8 kW gain** from the 760W panel — ~$800/yr in additional savings. Not enough to overcome the tariff/FEOC penalty.

**Head-to-head with tariff and FEOC impact (Michigan):**

|                      | Canadian Solar 600W (TX) | Trina 760W (China import)   |
| -------------------- | ------------------------ | --------------------------- |
| Panels needed        | 155                      | 126 (fewer = less labor)    |
| System kW            | 93.0 kW                  | 95.8 kW                     |
| Module $/W (FOB)     | $0.40                    | ~$0.28–$0.33                |
| Tariff               | $0                       | +30–46%                     |
| Landed module $/W    | $0.40                    | ~$0.38–$0.48                |
| Module cost          | $37,200                  | $36,400–$46,000             |
| Install + BOS + BESS | $153,700                 | $155,200                    |
| **Gross total**      | **$190,900**             | **$191,600–$201,200**       |
| 30% ITC              | −$57,270                 | **$0 (FEOC non-compliant)** |
| **Net cost**         | **$133,630**             | **$191,600–$201,200**       |
| Annual savings       | $34K–$36K                | $34.5K–$36.8K               |
| **Payback**          | **3.7–3.9 yr**           | **5.2–5.8 yr**              |

**Trina 760W loses by 1.5–2 years on payback** despite superior technology. The +$800/yr from 2.8 kW extra capacity doesn't offset losing $57K in ITC.

**When the 760W WOULD win:**

1. **If Trina opens US assembly** — assembling 760W panels in the US from non-FEOC cells would give ~95.8 kW at $28.7K–$33.5K module cost with full ITC. Payback drops to **3.2–3.4 years** — best of any scenario. But this doesn't exist yet.

2. **For cash-purchase projects (no TPO/ITC)** — if a car wash owner pays cash with no third-party ownership, FEOC is irrelevant. Trina 760W at $0.38/W landed becomes the cheapest high-efficiency option. Niche case for PE deployments.

3. **On carport or ground mount** — fewer panels (126 vs 155) means less mounting hardware, faster install, lower BOS. But on a space-constrained car wash roof, this saves ~$2K–$3K in BOS — not enough to close the $57K ITC gap.

4. **If the 760W launches in a Trina-Mexico or Trina-India factory** — Mexico (USMCA exempt) or India (27% tariff, likely FEOC compliant) assembly would change the math entirely. Watch for this announcement.

**Recommendation for Merlin's model:**

Add a "Watch List" tier for Trina 760W. Flag it in the platform with: "This panel offers the highest wattage and efficiency available globally (760W, 24.4%). Currently manufactured in China, which incurs 30–46% tariff and disqualifies from the 30% ITC. If Trina announces US, Mexico, or India assembly, this becomes the #1 recommendation. Monitor quarterly."

Meanwhile, Canadian Solar 600W at $0.40/W from Texas remains the primary recommendation — 93 kW per site, 3.5-year blended payback, $51.3M portfolio NPV.

---

### BREAKING: T1 Energy (formerly Freyr Battery) / Trina Solar US Manufacturing — Game-Changer

> **CRITICAL UPDATE:** Freyr Battery rebranded as **T1 Energy** in February 2025. The company is now T1 Energy, Inc. (NYSE: FREY), headquartered in Austin, Texas. All references to "Freyr" in earlier sections refer to this company.

**T1 Energy acquired Trina Solar's 5 GW module factory in Wilmer, Texas for $380M. Deal closed December 24, 2024. A second 5 GW cell + module factory (G2 Austin) is under construction in Austin, TX at $850M cost, with TOPCon cell production expected H2 2026.**

This is the most significant development for Merlin's panel sourcing strategy. It means Trina's technology — potentially including the 760W Vertex N G3 — could be manufactured in the US by a US-owned, NYSE-listed company, eliminating both tariffs and FEOC concerns.

**Current status (April 2026):**

| Item                         | Status                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| Company name                 | **T1 Energy, Inc.** (formerly Freyr Battery, rebranded Feb 2025) |
| Stock                        | NYSE: FREY                                                       |
| HQ                           | Austin, Texas (relocated from Norway, Feb 2025)                  |
| **Factory 1: Wilmer, TX**    | 5 GW module assembly, 1.35M sq ft, 7 production lines            |
| Wilmer production status     | Operational since Nov 1, 2024. Full production expected H2 2025  |
| **Factory 2: G2 Austin, TX** | 5 GW cell + module manufacturing, **under construction**         |
| G2 Austin contractor         | Yates Construction (preconstruction + site prep)                 |
| G2 Austin cost               | $850 million                                                     |
| G2 Austin timeline           | TOPCon cell production expected **H2 2026**                      |
| Panel brand                  | Trina Solar (jointly marketed by T1 Energy and Trina)            |
| Polysilicon supply           | Hemlock Semiconductor (Michigan)                                 |
| Offtake contracts            | 30% of Wilmer production backed by firm US customer contracts    |
| 2025 EBITDA guidance         | $75–$125M, exit run rate $175–$225M                              |
| Integrated run rate EBITDA   | $650–$700M (once cell + module production are both online)       |
| Georgia battery factory      | **Cancelled** — T1 Energy pivoted fully to solar                 |
| Jobs                         | Up to 1,800 direct jobs across both TX facilities                |

### ⚠️ WIND RATING ISSUE — Critical for Florida HVHZ Sites

The Trina Vertex N 600W panel (currently produced at Wilmer TX) has a split rating:

| Load Type                   | Rating                 | Adequate?                             |
| --------------------------- | ---------------------- | ------------------------------------- |
| Snow load (positive/front)  | **5,400 Pa** (112 PSF) | ✅ Exceeds MI requirement (25–50 PSF) |
| Wind load (negative/uplift) | **2,400 Pa** (50 PSF)  | ⚠️ Minimum industry standard          |

**Comparison of wind ratings across recommended panels:**

| Panel                          | Wind Load (Pa)                | Equivalent           | FL HVHZ Suitable?             |
| ------------------------------ | ----------------------------- | -------------------- | ----------------------------- |
| Silfab XM+ 590W                | 5,400 Pa                      | ~180 mph (ASCE 7-16) | ✅ Yes — best in class        |
| QCells Q.PEAK DUO 485W         | 4,000 Pa                      | ~150 mph             | ✅ Yes — adequate for most FL |
| Trina Vertex S+ 455W           | 4,000 Pa                      | ~150 mph             | ✅ Yes — but lower wattage    |
| Canadian Solar TOPBiHiKu7 600W | 2,400 Pa wind / 5,400 Pa snow | ~120 mph             | ⚠️ May not meet HVHZ          |
| Trina/T1 Energy Vertex N 600W  | 2,400 Pa wind / 5,400 Pa snow | ~120 mph             | ⚠️ May not meet HVHZ          |

**What this means for El Car Wash Florida:**

Miami-Dade and Broward counties are designated High-Velocity Hurricane Zones (HVHZ) with wind design requirements up to 180+ mph. The 2,400 Pa wind rating on the Trina 600W and Canadian Solar 600W panels may be insufficient for these zones without enhanced racking engineering.

However, Trina's own wind tunnel testing showed their 670W module survived 134 mph (Category 4) intact. The panel itself may perform better than the rated spec — but the rated spec is what building inspectors and permit offices evaluate.

**Solutions for FL HVHZ sites:**

1. **Use QCells 485W for HVHZ locations** — 4,000 Pa wind rating, lower capacity (75 kW vs 93 kW) but permit-safe
2. **Use Trina/T1 Energy 600W with enhanced racking** — IronRidge and other racking systems are certified for FL HVHZ; the racking can compensate for panel wind rating if engineered properly
3. **Split the portfolio:** T1 Energy 600W for MI sites + non-HVHZ FL sites; QCells 485W for Miami-Dade/Broward HVHZ sites
4. **Wait for the 760W G3 specs** — wind rating not yet published. If Trina upgrades to 4,000+ Pa wind on the G3, the issue resolves

**Recommended approach for Merlin's model:** Flag HVHZ zones automatically based on ZIP code. If the site is in a HVHZ, default to QCells 485W or require enhanced racking certification for higher-wattage panels. Show the capacity tradeoff transparently.

### T1 Energy Financials, Cost Structure & Profitability Risk

**Production (actual):**

| Period          | Module Production      | Net Sales        |
| --------------- | ---------------------- | ---------------- |
| Q1 2025         | 443 MW                 | —                |
| Q4 2025         | 1,170 MW (record)      | $358.5M (record) |
| Full Year 2025  | **2,790 MW (2.79 GW)** | ~$800M+ est.     |
| 2026 Forecast   | **3,100–4,200 MW**     | —                |
| 2026 Contracted | 3,000 MW (3 GW)        | —                |

**Profitability — NOT YET PROFITABLE:**

| Metric                                       | FY 2024  | FY 2025                 | Trend                            |
| -------------------------------------------- | -------- | ----------------------- | -------------------------------- |
| Net loss                                     | −$450.2M | −$380.8M                | Improving but still deep red     |
| Q4 2025 net loss                             | —        | −$190M                  | Half of Q4 2024 loss             |
| 2025 EBITDA guidance                         | —        | $75–$125M               | Positive EBITDA despite net loss |
| Exit run rate EBITDA                         | —        | $175–$225M              | Trending toward profitability    |
| Integrated run rate EBITDA (cells + modules) | —        | **$650–$700M** (target) | Once G2 Austin online            |

**Why they're losing money:** Startup scaling costs — they went from zero production to 2.79 GW in one year while simultaneously building an $850M cell factory. The losses are capital investment and ramp-up related, not structural. However, $380M in annual losses with uncertain IRA/45X credit future under Trump is a legitimate risk.

**Cost structure (estimated):**

| Item                           | Current (imported cells) | Future (G2 Austin cells)      |
| ------------------------------ | ------------------------ | ----------------------------- |
| Module selling price           | $0.25–$0.35/W            | $0.25–$0.35/W                 |
| Cell cost (imported, non-FEOC) | ~$0.08–$0.12/W           | —                             |
| Cell cost (G2 Austin domestic) | —                        | ~$0.05–$0.08/W                |
| Assembly + materials           | ~$0.08–$0.10/W           | ~$0.08–$0.10/W                |
| Total COGS                     | ~$0.18–$0.22/W           | ~$0.13–$0.18/W                |
| Gross margin                   | ~25–35%                  | ~40–50%                       |
| **45X manufacturing credit**   | $0.07/W (modules only)   | **$0.14/W (cells + modules)** |
| **Effective cost after 45X**   | ~$0.11–$0.15/W           | **~$0.04–$0.08/W**            |

The 45X production tax credit is the entire business model — $0.07/W for US-made cells + $0.07/W for US-made modules = $0.14/W in government credits. Once G2 Austin is online and producing cells, T1 Energy's effective module cost drops to near-zero after credits. **That's why the cell plant is the "earnings engine."**

**Risk factors for Merlin to monitor:**

1. **Cash burn:** $380M annual loss requires continued access to capital markets. If equity or debt markets tighten, the G2 Austin buildout could stall.
2. **45X credit uncertainty:** Trump administration has been vocally opposed to IRA credits. If 45X manufacturing credits are reduced or eliminated, the entire cost advantage evaporates.
3. **PERC to TOPCon conversion:** G1 Dallas is mid-conversion from PERC lines to TOPCon. During transition, production mix and efficiency may be inconsistent.
4. **Trina IP dependency:** T1 Energy licenses Trina's technology. If the IP relationship deteriorates or Trina's 17.4% equity stake creates FEOC complications, it could affect module eligibility.
5. **No track record as module manufacturer:** T1 Energy (ex-Freyr) was a battery company 18 months ago. They're operating Trina's factory with Trina's people, but the corporate entity has no historical solar manufacturing track record.

### Hail Rating — All Recommended Panels

All panels from major Tier 1 manufacturers carry IEC 61215 certification, which requires surviving 25mm (1-inch) hailstone impact at 23 m/s (51.6 mph). This is the universal standard.

| Panel                          | Hail Test          | Standard     | Additional Testing                                              |
| ------------------------------ | ------------------ | ------------ | --------------------------------------------------------------- |
| T1 Energy/Trina Vertex N 600W  | 1" at 51.6 mph     | IEC 61215 ✅ | Trina 670W passed Cat 4 wind tunnel (134 mph)                   |
| Canadian Solar TOPBiHiKu7 600W | 1" at 51.6 mph     | IEC 61215 ✅ | —                                                               |
| JinkoSolar Tiger Neo 600W      | 1" at 51.6 mph     | IEC 61215 ✅ | —                                                               |
| QCells Q.PEAK DUO 485W         | 1" at 51.6 mph     | IEC 61215 ✅ | —                                                               |
| CW Energy 595W                 | 1" at 51.6 mph     | IEC 61215 ✅ | —                                                               |
| Silfab XM+ 590W                | **1" at 51.6 mph** | IEC 61215 ✅ | **Industry-leading hail rating** per Silfab; PVEL Top Performer |

**For Michigan:** Standard IEC 61215 hail certification is adequate. Michigan experiences occasional hail but not the severe hail belt (that's CO/TX/OK/KS).

**For Florida:** Hail is less of a concern than wind. The IEC 61215 standard is sufficient for FL hail conditions. The primary FL structural concern remains wind uplift rating (see HVHZ section above).

**For Merlin's model:** All Tier 1 panels meet hail requirements for both FL and MI. No differentiation needed on hail — differentiate on wind rating for FL and snow load for MI.

### Additional US-Based Suppliers Not Previously Covered

| Company            | Panel          | Wattage  | Efficiency | US Location                     | Module $/W                   | Notes                                                                                                                         |
| ------------------ | -------------- | -------- | ---------- | ------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **SEG Solar**      | YUKON N        | 585W     | 22.65%     | Houston, TX (assembled)         | ~$0.30–$0.40                 | Highest wattage on EnergySage. Strong value. Verify FEOC.                                                                     |
| **Heliene**        | Various N-type | 400–450W | 20–21.5%   | Mountain Iron, MN               | ~$0.40–$0.55                 | Building first fully domestic silicon supply chain (Hemlock poly → Corning wafers → Suniva cells). Small scale but strategic. |
| **Boviet Solar**   | N-type TOPCon  | 400–580W | 21–22.5%   | US cell plant planned (H2 2026) | ~$0.35–$0.45                 | Parent committed to US mfg. Another domestic cell option.                                                                     |
| **Hyundai Energy** | HiE-S series   | 430–440W | 21.5%      | Korea (no US factory yet)       | ~$0.45–$0.55 + 25% tariff    | Strong panels, non-FEOC (Korean), but tariff adds cost.                                                                       |
| **REC Group**      | Alpha Pure-RX  | 460W     | 22.6%      | Singapore                       | ~$0.40–$0.50 + tariff        | Best temperature coefficient (-0.24%/°C). Non-FEOC. Premium.                                                                  |
| **Maxeon**         | Maxeon 7       | 475W     | 24.1%      | Mexico/Malaysia                 | ~$0.55–$0.75 + tariff varies | Highest efficiency available. 40-year warranty. USMCA may exempt Mexico production.                                           |

**SEG Solar deserves a closer look** — 585W at 22.65% efficiency, US-assembled in Houston, competitive pricing. For a car wash rooftop: 155 panels × 585W = 90.7 kW. Very close to the T1 Energy/Trina 600W output. If FEOC-verified, this is another strong co-primary option.

**Heliene is strategically interesting** — they're the only company building a fully domestic silicon supply chain from Minnesota. Hemlock polysilicon (MI) → Corning wafers → Suniva cells → Heliene modules. If they scale, this is the most FEOC-proof supply chain in the US outside First Solar. Lower wattage (450W max) is the limitation for space-constrained roofs.

**Maxeon from Mexico** could be a wildcard — if USMCA exempts their Mexico-assembled panels from tariffs, the 475W at 24.1% efficiency with a 40-year warranty becomes very competitive. Watch for USMCA solar panel classification rulings.

**Why this matters for El Car Wash:**

1. **Trina technology + US manufacturing + US ownership = best of all worlds.** Trina's proven TOPCon technology, manufactured in Texas, owned by a US public company. No tariffs, strong FEOC position, ITC-eligible.

2. **Hemlock polysilicon is in Michigan.** The supply chain literally runs through El Car Wash's home state. That's a compelling story for Warburg Pincus — domestic manufacturing, domestic raw materials, deployed at their portfolio company's sites.

3. **5 GW factory capacity.** El Car Wash needs ~8.4 MW across 90 sites. That's 0.17% of the factory's annual capacity. Zero supply constraint.

4. **760W potential.** If Trina's Vertex N G3 760W (24.4% efficiency, Q3 2026 global launch) gets tooled at the Wilmer factory, it becomes the highest-wattage panel available from a US factory. Timeline uncertain but plausible for H2 2026 or Q1 2027.

5. **NYSE-listed = bankable.** T1 Energy (FREY) is publicly traded with audited financials, 2025 EBITDA guidance, and institutional backing. More transparent than private manufacturers.

**Scenario: T1 Energy/Trina 600W from Wilmer TX (available now)**

Current Trina product line assembled at Wilmer — Vertex N 580–600W TOPCon panels.

|                                  | MI (Novi, DTE)        | FL (Miami, FPL)       |
| -------------------------------- | --------------------- | --------------------- |
| Panels                           | 155 × 600W            | 155 × 600W            |
| System kW                        | 93.0 kW               | 93.0 kW               |
| Module cost ($0.35–$0.40/W)      | $32,550–$37,200       | $32,550–$37,200       |
| Install + BOS + BESS             | $153,700              | $149,050              |
| Gross total                      | $186,250–$190,900     | $181,600–$186,250     |
| 30% ITC (US-owned, Hemlock poly) | −$55,875–$57,270      | −$54,480–$55,875      |
| **Net cost**                     | **$130,375–$133,630** | **$127,120–$130,375** |
| Annual savings                   | $34K–$36K             | $36K–$38K             |
| **Payback**                      | **3.6–3.9 yr**        | **3.3–3.6 yr**        |
| 10-yr ROI                        | 155–176%              | 176–199%              |

**Scenario: T1 Energy/Trina 760W from Wilmer TX (if available H2 2026+)**

|                                   | MI (Novi, DTE)          | FL (Miami, FPL)       |
| --------------------------------- | ----------------------- | --------------------- |
| Panels                            | 126 × 760W              | 126 × 760W            |
| System kW                         | 95.8 kW                 | 95.8 kW               |
| Module cost (~$0.38–$0.45/W)      | $36,400–$43,100         | $36,400–$43,100       |
| Install + BOS + BESS              | $156,200                | $151,400              |
| Gross total                       | $192,600–$199,300       | $187,800–$194,500     |
| 30% ITC                           | −$57,780–$59,790        | −$56,340–$58,350      |
| **Net cost**                      | **$134,820–$139,510**   | **$131,460–$136,150** |
| Annual savings                    | $34.5K–$36.8K           | $36.5K–$38.8K         |
| **Payback**                       | **3.7–4.0 yr**          | **3.4–3.7 yr**        |
| Fewer panels = faster install     | 126 vs 155 (−19% labor) | 126 vs 155            |
| BOS savings (fewer clamps, rails) | ~$2K–$3K                | ~$2K–$3K              |

The 760W doesn't dramatically change payback vs the 600W on a space-constrained roof (+2.8 kW), but it does reduce install complexity and BOS cost. The real value is future-proofing: as Trina pushes to 800W+ panels, the T1 Energy Wilmer/Austin factories become the channel for the world's highest-wattage panels manufactured in the US.

---

### EMERGING US MANUFACTURERS & TECHNOLOGY PIPELINE (2026–2028)

Companies Merlin should track and potentially integrate into the platform:

| Company                       | What's Coming                                                             | US Location       | Timeline                    | Significance                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------- | --------------------------- | -------------------------------------------------------------------------------- |
| **T1 Energy (ex-Freyr)**      | 5 GW TOPCon cell factory (G2 Austin)                                      | Austin, TX        | Cells H2 2026               | Full vertical integration = strongest domestic content play                      |
| **QCells**                    | Perovskite-silicon tandem modules                                         | Cartersville, GA  | Stress tests completed 2025 | Could push past 25% efficiency; fully US-integrated ingot-to-module              |
| **Mission Solar**             | 2 GW cell production expansion                                            | San Antonio, TX   | Early 2026                  | $265M investment, OCI polysilicon from Malaysia (non-FEOC)                       |
| **Boviet Solar**              | US cell factory                                                           | US (site TBD)     | H2 2026                     | Another domestic cell option; parent committed to US mfg despite challenges      |
| **Illuminate USA (LONGi JV)** | 5 GW modules operating                                                    | Pataskala, OH     | Operating now               | Largest US module factory; FEOC risk due to LONGi Chinese ownership              |
| **Heliene**                   | Domestic bill of materials (Hemlock poly → Corning wafers → Suniva cells) | Mountain Iron, MN | Ramping 2026                | First fully domestic silicon supply chain outside First Solar                    |
| **First Solar**               | 14+ GW US capacity by end 2026                                            | OH, AL, LA        | Operating + expanding       | CdTe thin-film; fully vertically integrated; lower efficiency but zero FEOC risk |

**Technology milestones to watch:**

| Technology                               | Leader                            | Status                                         | Impact on Car Wash Business Case                                          |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| **Trina 760W Vertex N G3**               | Trina/T1 Energy                   | Global launch Q3 2026                          | +3% roof capacity if produced at Wilmer TX                                |
| **Trina 829W perovskite-silicon tandem** | Trina (lab)                       | Lab-verified 30.6% efficiency (Fraunhofer ISE) | 2027–2028 commercialization; would push 100+ kW from same roof            |
| **LONGi HIBC (Hybrid IBC)**              | LONGi                             | Launching 2026                                 | Combines HJT + back-contact; if Illuminate OH produces it, game-changer   |
| **QCells perovskite-silicon tandem**     | QCells (GA)                       | Stress tests passed 2025                       | First US-integrated tandem; could deliver 25%+ efficiency from US factory |
| **800W+ commercial panels**              | Multiple (TW Solar, Trina, LONGi) | Lab/pilot                                      | Expected mass production 2027; would fundamentally change roof economics  |

**What 800W+ means for car washes (2027–2028 horizon):**

If an 800W panel at 25%+ efficiency becomes available from a US factory:

- ~120 panels on 4,225 sq ft = **96 kW** from the same roof
- At $0.35–$0.45/W: $33.6K–$43.2K module cost
- Annual savings (MI): $35K–$37K
- Payback: potentially **under 3 years**

Merlin's platform should be designed to accommodate these technology shifts — the panel database needs to be updatable so that when a new SKU launches, the model recalculates automatically.

---

### FINAL REVISED RECOMMENDATION (April 2026)

**For immediate orders (now through H1 2026):**

| Priority       | Supplier                     | Panel                            | Why                                                                                                                                    |
| -------------- | ---------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary**    | Canadian Solar               | TOPBiHiKu7 600W (Mesquite TX)    | Available now, $0.40/W, 5 GW US capacity, NASDAQ-listed, 22.5% eff                                                                     |
| **Co-Primary** | T1 Energy (ex-Freyr) / Trina | Vertex N 600W (Wilmer TX)        | Available now, ~$0.35–$0.40/W, US-owned (NYSE: FREY), Trina tech, Hemlock MI poly. ⚠️ 2,400 Pa wind — use enhanced racking for FL HVHZ |
| Value          | CW Energy                    | CWT595 595W (US-assembled)       | $0.32/W lowest cost, verify FEOC, 12-yr warranty                                                                                       |
| Performance    | JinkoSolar                   | Tiger Neo 600W (Jacksonville FL) | 23.2% highest efficiency, verify FEOC per lot                                                                                          |
| Conservative   | QCells                       | Q.PEAK DUO XL 485W (Dalton GA)   | 25-yr warranty, best FEOC certainty, lower kW per roof                                                                                 |

**For H2 2026+ orders (watch list):**

| Trigger                                               | Panel                                   | Impact                                                       |
| ----------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| T1 Energy produces Trina 760W at Wilmer TX            | 760W, 24.4% eff, US-made                | Becomes instant #1 — highest wattage from US factory         |
| T1 Energy G2 Austin cell plant comes online (H2 2026) | All T1 Energy panels with US-made cells | Full domestic content bonus = potentially 40% ITC            |
| 760W wind rating published at 4,000+ Pa               | Trina Vertex N G3                       | Resolves FL HVHZ issue; unlocks for Miami-Dade/Broward sites |
| QCells tandem module commercialized                   | 25%+ efficiency, US-made GA             | Highest efficiency from fully US-integrated factory          |
| Trina opens Mexico assembly                           | 760W, USMCA tariff-free                 | Alternative tariff-free channel                              |
| 800W+ panels reach mass production (2027–2028)        | Multiple manufacturers                  | 96+ kW from car wash roof, sub-3-year payback                |

**For Merlin's platform:**

Show Canadian Solar and T1 Energy/Trina as co-primary options with transparent pricing. For FL HVHZ zones (Miami-Dade, Broward), auto-flag the wind rating issue and default to QCells 485W or require enhanced racking certification for 600W panels. Flag the 760W as "Coming Soon — US-manufactured" with a notification when it becomes available from Wilmer TX.

**Build the panel database as a living layer** — new SKUs, new manufacturers, and trade policy changes happen quarterly. The platform that tracks this in real time and auto-recalculates the business case is a competitive moat no competitor has. This is what differentiates Merlin from a static quote tool.

---

### Portfolio Math — Canadian Solar 600W (Recommended Primary)

| Metric               | 55 FL Sites   | 35 MI Sites   | Total Portfolio       |
| -------------------- | ------------- | ------------- | --------------------- |
| Total solar capacity | 5.1 MW        | 3.3 MW        | **8.4 MW**            |
| Annual generation    | 10.9M kWh     | 5.1M kWh      | **16.0M kWh**         |
| Annual savings       | $1.98M–$2.09M | $1.19M–$1.26M | **$3.17M–$3.35M/yr**  |
| Total net investment | $7.2M         | $4.7M         | **$11.9M**            |
| Portfolio payback    | 3.4–3.6 yr    | 3.7–3.9 yr    | **3.5 years blended** |
| Portfolio 25-yr NPV  | $32.5M        | $18.8M        | **$51.3M**            |

**$51.3M in 25-year NPV across 90 sites on $11.9M net investment — 3.5-year blended payback.**

Compare to the earlier Silfab-only scenario: $39.4M NPV on $17M investment, 5.3-year payback. The switch to competitively-priced US-assembled panels saves $5.1M in capex and adds $11.9M in NPV.

---

## Key Numbers to Remember

| Metric                                         | Value                                              |
| ---------------------------------------------- | -------------------------------------------------- |
| Car wash monthly bill (high-volume tunnel, MI) | $8,500–$11,500                                     |
| DTE demand charge (MI)                         | $14.00/kW                                          |
| FPL demand charge (FL)                         | $13.68–$17.41/kW (increasing 2026–2029)            |
| MI commercial energy rate                      | $0.15/kWh                                          |
| FL commercial energy rate                      | $0.114/kWh                                         |
| FL Peak Sun Hours                              | 5.5–6.0 PSH                                        |
| MI Peak Sun Hours                              | 4.2 PSH                                            |
| **Primary panel recommendation**               | **Canadian Solar TOPBiHiKu7 600W (Mesquite TX)**   |
| Module cost (recommended)                      | $0.35–$0.45/W                                      |
| Value alternative                              | CW Energy 595W ($0.32/W, fastest payback)          |
| Performance alternative                        | JinkoSolar Tiger Neo 600W (23.2% eff)              |
| Conservative choice                            | QCells 485W (25-yr warranty, best FEOC certainty)  |
| FL site payback (Canadian Solar)               | **3.4–3.6 years**                                  |
| MI site payback (Canadian Solar)               | **3.7–3.9 years**                                  |
| 90-site portfolio annual savings               | **$3.17M–$3.35M**                                  |
| 90-site portfolio 25-yr NPV                    | **$51.3M**                                         |
| 90-site portfolio net investment               | **$11.9M**                                         |
| Blended portfolio payback                      | **3.5 years**                                      |
| Silfab SC facility status                      | ⚠️ Operations ceased — state investigation ongoing |
| FEOC compliance                                | Required for 30% ITC — verify per panel lot        |

---

## US SOLAR MANUFACTURER DIRECTORY — Current Names, Websites & Product Offerings

> **NOTE:** Several manufacturers have rebranded, merged, or been acquired in 2024–2026. This directory reflects current names and URLs as of April 2026.

### Tier 1: US-Manufactured (Module Assembly in US)

| Company                        | Former Name(s)                        | HQ                                   | US Factory                                                                                                | Website                                            | Key Products                                                                   | Wattage Range                      | Efficiency | FEOC Status                                        |
| ------------------------------ | ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- | ---------- | -------------------------------------------------- |
| **T1 Energy**                  | Freyr Battery (rebranded Feb 2025)    | Austin, TX                           | G1 Dallas (Wilmer TX) — 5 GW modules; G2 Austin (Rockdale TX) — 5 GW cells (under construction)           | [t1energy.com](https://t1energy.com)               | Trina-branded Vertex N TOPCon (converting from PERC)                           | 580–620W (current); 760W (pending) | 22–23%     | Confirmed (completed FEOC transactions 2026)       |
| **QCells (Hanwha QCells)**     | Q-Cells (pre-2012 Hanwha acquisition) | Dalton, GA                           | Dalton, GA — 5.1 GW modules; Cartersville, GA — 3.3 GW cells + ingots + wafers (fully integrated)         | [qcells.com/us](https://www.qcells.com/us)         | Q.PEAK DUO BLK ML-G10+, Q.TRON G2, perovskite tandem (coming)                  | 410–485W                           | 21.1–22.5% | Partial — verify per lot                           |
| **Canadian Solar (CSI Solar)** | —                                     | Guelph, ON (corporate); US ops in TX | Mesquite, TX — 5 GW modules; Jeffersonville, IN — 5 GW cells (building)                                   | [canadiansolar.com](https://www.canadiansolar.com) | HiKu7, TOPBiHiKu7, BiHiKu7                                                     | 580–720W                           | 21.6–22.8% | Verify per lot                                     |
| **First Solar**                | —                                     | Tempe, AZ                            | Perrysburg, OH; Walbridge, OH; Lawrence County, AL; Iberia Parish, LA                                     | [firstsolar.com](https://www.firstsolar.com)       | Series 6+, Series 7 (CdTe thin-film)                                           | 540–560W                           | 19.5%      | **Confirmed — fully US vertically integrated**     |
| **JinkoSolar**                 | —                                     | Shanghai (corporate); US ops in FL   | Jacksonville, FL — module assembly                                                                        | [jinkosolar.com](https://www.jinkosolar.com)       | Tiger Neo 3.0, Eagle series                                                    | 410–670W                           | 21–23.2%   | Varies by lot — cells imported                     |
| **Silfab Solar**               | —                                     | Mississauga, ON (corporate)          | Burlington, WA — modules; Fort Mill, SC — cells (⚠️ operations ceased, investigation)                     | [silfabsolar.com](https://silfabsolar.com)         | Elite (back-contact), Prime (NTC TOPCon/HJT), Commercial XM+ (NTC), Utility XL | 370–640W                           | 20–23%     | Confirmed ⚠️ SC facility risk                      |
| **Mission Solar**              | —                                     | San Antonio, TX                      | San Antonio, TX — modules + 2 GW cell expansion (early 2026)                                              | [missionsolar.com](https://www.missionsolar.com)   | MSE PERC series                                                                | 400–420W                           | 20.5%      | Confirmed                                          |
| **CW Energy USA**              | CW Enerji (Turkish parent)            | US operations                        | US-assembled (location not disclosed)                                                                     | [cw-energy.us](https://www.cw-energy.us)           | CWT bifacial N-type, all-black                                                 | 410–595W                           | 21–23%     | **Verify — Turkish parent, cell sourcing unclear** |
| **SEG Solar**                  | —                                     | Houston, TX                          | Houston, TX — module assembly                                                                             | [segsolar.com](https://www.segsolar.com)           | YUKON N series                                                                 | 585W                               | 22.65%     | Verify                                             |
| **Heliene**                    | —                                     | Mountain Iron, MN                    | Mountain Iron, MN — modules (building domestic cell supply: Hemlock poly → Corning wafers → Suniva cells) | [heliene.com](https://www.heliene.com)             | Various mono PERC + N-type                                                     | 400–450W                           | 20–21.5%   | Likely — fully domestic supply chain in progress   |
| **Illuminate USA**             | LONGi/Invenergy JV                    | Pataskala, OH                        | Pataskala, OH — 5 GW modules                                                                              | [illuminateusa.com](https://illuminateusa.com)     | LONGi-branded modules                                                          | 400–580W                           | 21–23%     | **FEOC risk — LONGi (Chinese) ownership**          |
| **Boviet Solar**               | —                                     | US (site TBD for cells)              | US cell plant planned H2 2026                                                                             | [bovietsolar.com](https://www.bovietsolar.com)     | N-type TOPCon                                                                  | 400–580W                           | 21–22.5%   | Verify                                             |

### Tier 2: Non-US Manufactured but Relevant (Import with Tariff)

| Company            | HQ                         | Key Products                | Wattage    | Efficiency | Tariff to US                      | FEOC              |
| ------------------ | -------------------------- | --------------------------- | ---------- | ---------- | --------------------------------- | ----------------- |
| **Trina Solar**    | Changzhou, China           | Vertex N, Vertex N G3 760W  | 455–760W   | 22–24.4%   | 50–70% cumulative                 | No                |
| **LONGi Solar**    | Xi'an, China               | Hi-MO 7, Hi-MO X10, HIBC    | 490–660W   | 22.8–25.2% | 50–70% cumulative                 | No                |
| **Aiko Solar**     | Shanghai, China            | Neostar ABC                 | 510W       | 25.2%      | 50–70% cumulative                 | No                |
| **Maxeon**         | Singapore (ex-SunPower)    | Maxeon 7, Maxeon 8 (coming) | 475W+      | 24.1%      | Varies (Mexico assembly = USMCA?) | Likely yes        |
| **REC Group**      | Singapore (Reliance owned) | Alpha Pure-RX               | 460W       | 22.6%      | ~10–25%                           | Yes (non-Chinese) |
| **Hyundai Energy** | Seoul, Korea               | HiE-S series                | 430–440W   | 21.5%      | 25%                               | Yes (Korean)      |
| **Risen Energy**   | Ninghai, China             | Hyper-ion HJT               | Up to 700W | 23.5%      | 50–70% cumulative                 | No                |

---

## LIVE DATA SCRAPING — What Merlin Should Track and Where

### Data Points to Scrape (Per Panel Model)

| Field                           | Example                                 | Update Frequency                       |
| ------------------------------- | --------------------------------------- | -------------------------------------- |
| Manufacturer                    | T1 Energy                               | Monthly                                |
| Model name/number               | Vertex N TSM-600NEG19RC.20              | Monthly                                |
| Wattage (Wp)                    | 600W                                    | Monthly                                |
| Efficiency (%)                  | 22.19%                                  | Monthly                                |
| Cell technology                 | N-type TOPCon                           | Quarterly                              |
| Module dimensions (mm)          | 2384 × 1134 × 30                        | Quarterly                              |
| Weight (kg)                     | 33.7                                    | Quarterly                              |
| Wind load rating (Pa)           | 2,400                                   | Quarterly                              |
| Snow load rating (Pa)           | 5,400                                   | Quarterly                              |
| Hail rating                     | 25mm @ 23 m/s                           | Quarterly                              |
| Temp coefficient (%/°C)         | −0.29                                   | Quarterly                              |
| Degradation (yr 1 / annual)     | 1.0% / 0.4%                             | Quarterly                              |
| Product warranty (years)        | 12                                      | Quarterly                              |
| Performance warranty (years)    | 30                                      | Quarterly                              |
| FEOC compliance status          | Verified / Unverified / Non-compliant   | **Monthly — policy changes fast**      |
| US factory location             | Wilmer, TX                              | Quarterly                              |
| Module $/W (wholesale)          | $0.28                                   | **Weekly — prices shift with tariffs** |
| Module $/W (retail/installed)   | $2.00–$2.50                             | Monthly                                |
| Tariff rate (if imported)       | 0% / 27% / 50%+                         | **Monthly — trade policy volatile**    |
| 45X credit eligibility          | Yes / Pending / No                      | Monthly                                |
| Domestic content bonus eligible | Yes / No                                | Monthly                                |
| Availability status             | In stock / Lead time 4 wk / Backordered | Weekly                                 |

### Sites to Scrape — Pricing & Availability

| Source                    | URL                                                                         | What It Provides                                     | Scrape Frequency |
| ------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------- |
| **EnergySage**            | energysage.com/solar/what-are-the-most-efficient-solar-panels-on-the-market | Efficiency rankings, $/W pricing, reviews            | Monthly          |
| **A1 SolarStore**         | a1solarstore.com/solar-panels                                               | Wholesale pallet pricing, stock availability per SKU | Weekly           |
| **Sunhub Trader**         | sunhub.com/shop                                                             | B2B marketplace pricing, bulk deals                  | Weekly           |
| **SolarTraders**          | solartraders.com                                                            | EU + US distributor pricing                          | Weekly           |
| **US Solar Supplier**     | ussolarsupplier.com                                                         | Retail panel pricing, specs, reviews                 | Monthly          |
| **Direct Solar Power**    | directsolarpower.com/collections/solar-panels-pallet                        | Pallet pricing, clearance deals                      | Weekly           |
| **Solar Electric Supply** | solarelectricsupply.com                                                     | Wholesale pricing, system kits, distributor network  | Monthly          |
| **Solaris Shop**          | solaris-shop.com                                                            | Wholesale pricing by brand                           | Monthly          |

### Sites to Scrape — Industry News & Trade Policy

| Source                                         | URL                                                      | What It Provides                                                     | Scrape Frequency       |
| ---------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| **pv magazine USA**                            | pv-magazine-usa.com                                      | US manufacturing news, tariff updates, new product launches          | Daily                  |
| **pv magazine International**                  | pv-magazine.com                                          | Global panel launches, efficiency records, factory announcements     | Daily                  |
| **PV Tech**                                    | pv-tech.org                                              | Deep manufacturing analysis, cell technology news, PVEL test results | Daily                  |
| **Solar Power World**                          | solarpowerworldonline.com                                | US installer news, product reviews, manufacturer directories         | Weekly                 |
| **Canary Media**                               | canarymedia.com/articles/clean-energy-manufacturing      | US manufacturing policy analysis                                     | Weekly                 |
| **Clean Energy Reviews**                       | cleanenergyreviews.info/blog/most-efficient-solar-panels | Efficiency rankings, technology comparisons                          | Monthly                |
| **SEIA (Solar Energy Industries Association)** | seia.org                                                 | Trade policy, tariff updates, industry data                          | Weekly                 |
| **BloombergNEF**                               | about.bnef.com                                           | Tier 1 bankability ratings, module price index                       | Monthly (subscription) |
| **InfoLink Consulting**                        | infolink-group.com                                       | Module/cell spot pricing, trade flow data                            | Weekly (subscription)  |
| **EnergyTrend**                                | energytrend.com                                          | Asian module/cell pricing, supply chain analysis                     | Weekly                 |
| **US DOE / NREL**                              | nrel.gov/solar                                           | ATB pricing benchmarks, technology reports                           | Quarterly              |
| **US Commerce Dept / ITC**                     | usitc.gov                                                | AD/CVD duty rates, Section 201/301 updates                           | Monthly                |
| **IRS FEOC guidance**                          | irs.gov (search "FEOC" + "Section 48E")                  | FEOC compliance rules, domestic content definitions                  | Monthly                |
| **Utility Dive**                               | utilitydive.com                                          | US utility rate changes, solar policy                                | Daily                  |

### Sites to Scrape — Manufacturer-Specific

| Manufacturer       | Investor/News Page          | What to Track                                                            |
| ------------------ | --------------------------- | ------------------------------------------------------------------------ |
| **T1 Energy**      | ir.t1energy.com             | Earnings, production numbers, G2 Austin progress, FEOC status            |
| **QCells**         | qcells.com/us/about/news    | New product launches, Cartersville integration progress, tandem timeline |
| **Canadian Solar** | investors.canadiansolar.com | Earnings, Mesquite TX production, Indiana cell plant progress            |
| **First Solar**    | investor.firstsolar.com     | Capacity expansion, Series 7 availability for commercial projects        |
| **Trina Solar**    | trinasolar.com/us/resources | 760W G3 launch date, T1 Energy technology transfer updates               |
| **Silfab**         | silfabsolar.com             | SC facility investigation outcome, WA production continuity              |

### Automated Alerts Merlin Should Set Up

| Alert Trigger                                  | Action                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| New panel model >600W from any US manufacturer | Add to panel database, recalculate all active quotes              |
| FEOC rule change from IRS                      | Flag all affected panel lots, notify customers with active quotes |
| Tariff rate change (Section 201/301/232)       | Recalculate landed cost for all imported panels                   |
| Manufacturer factory shutdown or investigation | Flag supply chain risk, suggest alternatives                      |
| 45X credit change                              | Recalculate all manufacturer cost structures                      |
| New US factory announcement                    | Add manufacturer to database, begin tracking                      |
| Utility rate change (DTE, FPL, etc.)           | Recalculate savings for all quotes in that service territory      |

---

_Merlin Energy | merlinenergy.net | April 2026 | Confidential_
_This document is a living analysis — update with each panel launch, tariff change, or manufacturer development._
