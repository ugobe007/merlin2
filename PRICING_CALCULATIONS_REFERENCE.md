# Merlin Pricing Model & Calculations Reference
## For Engineering Review - December 4, 2025

---

## Executive Summary

This document outlines Merlin's internal pricing model, validated against **6 professional quotes** from October-December 2025. All calculations use a **single source of truth** (`pricingModel.ts`) with **three pricing tiers** based on system scale.

---

## 1. Pricing Tiers

| Tier | Power Range | Description | Example |
|------|-------------|-------------|---------|
| **Residential** | < 50 kW | Home battery systems, premium pricing | Tesla Powerwall, Enphase |
| **Commercial (C&I)** | 50 kW - 1 MW | Business-scale, modular systems | Car wash, hotel, small EV hub |
| **Utility-Scale** | > 1 MW | Volume pricing, standardized units | Data center, large solar farm |

---

## 2. BESS (Battery Energy Storage System) Pricing

### 2.1 Battery Module Pricing ($/kWh)

| Tier | Price | Source |
|------|-------|--------|
| Residential | **$350/kWh** | Tesla Powerwall, Enphase benchmarks |
| Commercial | **$175/kWh** | CATL/BYD containerized systems |
| Utility | **$140/kWh** | UK EV Hub ($120), Hampton Heights ($190), avg |

**Validated Quotes:**
- UK EV Hub (10 MWh): $120/kWh
- Tribal Microgrid (200 kWh): $140/kWh
- Hampton Heights (1.25 MWh): $190/kWh
- Data Center UK (100 MWh): £190/kWh (~$240)

### 2.2 PCS/Inverter Pricing ($/kW)

| Tier | Price | Source |
|------|-------|--------|
| Residential | **$200/kW** | Integrated hybrid inverters |
| Commercial | **$120/kW** | UK EV Hub quote (validated) |
| Utility | **$100/kW** | Large central inverters |

### 2.3 Transformer Pricing ($/kVA)

| Tier | Price | Notes |
|------|-------|-------|
| Residential | $0 | Not needed (LV only) |
| Commercial | **$68/kVA** | 480V/208V step-down |
| Utility | **$80/kVA** | MV/LV (35kV/13.8kV/480V) |

### 2.4 Switchgear Pricing ($/kW)

| Tier | Price | Type |
|------|-------|------|
| Residential | **$15/kW** | LV distribution panel |
| Commercial | **$30/kW** | LV/basic MV switchgear |
| Utility | **$50/kW** | Full MV switchgear suite |

### 2.5 BESS Calculation Formula

```
Battery Cost = Capacity (kWh) × Price per kWh × Chemistry Multiplier × Duration Discount
PCS Cost = Power (kW) × Price per kW
Transformer Cost = (Power × 1.25 for margin) × Price per kVA
Switchgear Cost = Power (kW) × Price per kW
BOS Cost = Subtotal × BOS Percentage (10-15%)
EMS Cost = Base Cost + (Power × Per kW rate)

BESS Total = Battery + PCS + Transformer + Switchgear + BOS + EMS
```

### 2.6 Chemistry Multipliers

| Chemistry | Multiplier | Notes |
|-----------|------------|-------|
| LFP (Lithium Iron Phosphate) | 1.00x | Baseline, most common |
| NMC (Nickel Manganese Cobalt) | 1.15x | Higher energy density |
| NCA (Nickel Cobalt Aluminum) | 1.20x | Tesla cells |
| Vanadium Flow | 1.40x | Long duration (6-12 hr) |
| Sodium-Ion | 0.85x | Emerging, lower cost |

### 2.7 Duration Discounts

| Duration | Discount | Notes |
|----------|----------|-------|
| 1 hour | 0% | No discount |
| 2 hours | 5% | Short duration |
| 4 hours | 10% | Most common, best value |
| 6 hours | 13% | Extended duration |
| 8 hours | 15% | Long duration |

---

## 3. Solar PV Pricing

### 3.1 Turnkey Pricing ($/W)

| Tier | Price | Source |
|------|-------|--------|
| Residential | **$2.80/W** | Rooftop residential |
| Commercial | **$1.05/W** | Tribal Microgrid ($1.05/W validated) |
| Utility | **$0.65/W** | Hampton Heights ($0.60/W validated) |

**Validated Quotes:**
- Tribal Microgrid (250 kWdc): $1.05/W ($262,500)
- Hampton Heights (2 MWp): $0.60/W ($1,200,000)
- GoGoEV Clubhouse (250 kW): ~$1.00/W (£252,000)

### 3.2 Solar Calculation Formula

```
Solar Cost = System Size (kW) × 1000 × Price per Watt
Space Required = System Size (kW) × Space Factor

Space Factors:
- Rooftop: 100 sq ft/kW
- Ground Mount: 200 sq ft/kW
- Carport: 150 sq ft/kW
```

### 3.3 Capacity Factors by Region

| Region | Capacity Factor |
|--------|----------------|
| Southwest US | 25% |
| Southeast US | 20% |
| Midwest US | 18% |
| Northeast US | 16% |
| Northwest US | 15% |
| UK | 11% |
| Northern Europe | 10% |
| Southern Europe | 18% |
| Middle East | 25% |
| Australia | 22% |

---

## 4. EV Charger Pricing

### 4.1 Hardware Costs (Per Unit)

| Type | Power | Hardware Cost | Source |
|------|-------|---------------|--------|
| Level 1 | 1.4 kW | $500 | Standard outlet |
| Level 2 | 7 kW | $2,500 | Basic commercial |
| Level 2 | 11 kW | **$5,000** | UK EV Hub (validated) |
| Level 2 | 19 kW | $8,000 | High-power L2 |
| Level 2 | 22 kW | $10,000 | Max L2 |
| DCFC | 50 kW | $35,000 | Entry DC fast |
| DCFC | 150 kW | **$55,000** | UK EV Hub (validated) |
| HPC | 250 kW | $100,000 | High power |
| HPC | 350 kW | **$130,000** | UK EV Hub (validated) |

### 4.2 Installation Costs (Per Unit)

| Type | Power | Install Cost | Source |
|------|-------|--------------|--------|
| Level 1 | 1.4 kW | $300 | Simple outlet |
| Level 2 | 7 kW | $2,000 | Basic install |
| Level 2 | 11 kW | **$3,000** | UK EV Hub (validated) |
| Level 2 | 19 kW | $4,000 | Panel upgrade likely |
| Level 2 | 22 kW | $5,000 | Significant electrical |
| DCFC | 50 kW | $20,000 | Concrete pad + electrical |
| DCFC | 150 kW | **$30,000** | UK EV Hub (validated) |
| HPC | 250 kW | $40,000 | Utility coordination |
| HPC | 350 kW | **$50,000** | UK EV Hub (validated) |

### 4.3 Additional EV Costs

| Item | Cost | Notes |
|------|------|-------|
| Networking/OCPP | **$500/port** | Annual software |
| Make-ready | **$50/kW** | Site infrastructure |
| Utility upgrade | $50,000+ | If > 200 kW total |

### 4.4 EV Calculation Formula

```
Hardware Cost = Σ (Charger Count × Unit Hardware Cost)
Installation Cost = Σ (Charger Count × Unit Install Cost)
Networking Cost = Total Ports × $500
Make-ready Cost = Total Charging kW × $50/kW

EV Total = Hardware + Installation + Networking + Make-ready
```

---

## 5. Generator Pricing

### 5.1 Equipment Pricing ($/kW)

| Fuel Type | < 100 kW | 100-500 kW | 500 kW - 2 MW | > 2 MW |
|-----------|----------|------------|---------------|--------|
| Diesel | $600/kW | $450/kW | $350/kW | $300/kW |
| Natural Gas | $700/kW | $550/kW | $450/kW | $400/kW |
| Propane | $650/kW | $500/kW | $400/kW | $350/kW |

**Source:** Hampton Heights quote (Eaton Cummins gensets)

### 5.2 Generator Calculation Formula

```
Equipment Cost = Capacity (kW) × Price per kW
Installation Cost = Equipment Cost × 25%

Generator Total = Equipment + Installation
```

---

## 6. Wind Power Pricing

### 6.1 Turnkey Pricing ($/kW)

| Scale | Price | Typical Sizes |
|-------|-------|---------------|
| Distributed | **$3,500/kW** | 10-100 kW turbines |
| Commercial | **$2,500/kW** | 250 kW - 1 MW turbines |
| Utility | **$1,350/kW** | 2-5 MW turbines |

### 6.2 Capacity Factors

| Scale | Capacity Factor |
|-------|----------------|
| Distributed | 20% |
| Commercial | 30% |
| Utility | 40% |

---

## 7. Installation & Soft Costs

### 7.1 Standard Percentages (of Equipment Cost)

| Item | Percentage | Description |
|------|------------|-------------|
| **Logistics** | 8% | Shipping, handling, delivery |
| **Import Duty** | 2% | China-sourced equipment |
| **EPC/Integration** | 25% | Engineering, procurement, construction |
| **Contingency** | 5% | Permitting, unexpected costs |
| **TOTAL** | **40%** | Added to equipment cost |

**Source:** Consistent across all professional quotes analyzed

### 7.2 Regional Adjustments (Installation Multiplier)

| Region | Multiplier | Notes |
|--------|------------|-------|
| California | 1.25x | High labor costs |
| Texas | 0.90x | Lower costs |
| Northeast US | 1.15x | Union labor |
| Midwest US | 0.95x | Moderate |
| Southeast US | 0.92x | Lower costs |
| UK | 1.10x | Higher than US avg |
| Germany | 1.20x | High labor |
| Asia | 0.80x | Lower labor costs |

### 7.3 Installation Calculation Formula

```
Logistics = Equipment Cost × 8%
Import Duty = Equipment Cost × 2%
EPC/Integration = Equipment Cost × 25% × Regional Multiplier
Contingency = Equipment Cost × 5%

Installation Total = Logistics + Import Duty + EPC + Contingency
```

---

## 8. Financial Assumptions

### 8.1 Federal Tax Credits (ITC)

| Credit Type | Rate | Eligibility |
|-------------|------|-------------|
| **Base ITC** | 30% | All solar + storage |
| **Domestic Content Adder** | +10% | US-manufactured components |
| **Energy Community Adder** | +10% | Coal/brownfield areas |
| **Low Income Adder** | +10% | Qualifying locations |
| **Maximum Total** | **50%** | Cannot exceed |

### 8.2 Project Economics

| Parameter | Value | Notes |
|-----------|-------|-------|
| Discount Rate | 8% | Standard for energy projects |
| Inflation Rate | 2.5% | Annual |
| BESS Round-trip Efficiency | 85% | LFP batteries |
| BESS Degradation | 2%/year | Capacity loss |
| Solar Degradation | 0.5%/year | Output decline |

### 8.3 Project Lifetimes

| Asset | Lifetime | Warranty Typical |
|-------|----------|------------------|
| BESS | 15 years | 10 years |
| Solar PV | 25 years | 25 years performance |
| Wind | 25 years | 10 years |
| Generator | 20 years | 2-5 years |

### 8.4 Annual O&M (% of CapEx)

| Asset | Annual O&M | Notes |
|-------|------------|-------|
| BESS | 2.5% | Includes augmentation |
| Solar | 1.5% | Cleaning, monitoring |
| Wind | 2.0% | Mechanical maintenance |
| Generator | 3.0% | Fuel system, filters |
| EV Chargers | 5.0% | Network, repairs |

---

## 9. Utility Rate Assumptions

### 9.1 Electricity Rates ($/kWh)

| Region | Rate |
|--------|------|
| California | $0.22 |
| Texas | $0.11 |
| Northeast US | $0.18 |
| Midwest US | $0.12 |
| Southeast US | $0.11 |
| UK | $0.35 (£0.28) |
| Germany | $0.40 |
| Australia | $0.25 |

### 9.2 Demand Charges ($/kW-month)

| Region | Rate |
|--------|------|
| California | $25 |
| Texas | $15 |
| Northeast US | $20 |
| Midwest US | $12 |
| Southeast US | $14 |
| UK | $18 |
| Germany | $22 |
| Australia | $16 |

---

## 10. Complete Quote Calculation Flow

### Step 1: Determine Pricing Tier
```
IF power < 50 kW → Residential
IF power 50 kW - 1 MW → Commercial
IF power > 1 MW → Utility
```

### Step 2: Calculate Equipment Costs
```
BESS Cost = Battery + PCS + Transformer + Switchgear + BOS + EMS
Solar Cost = System kW × 1000 × $/W
Generator Cost = Capacity × $/kW × 1.25 (install)
EV Cost = Hardware + Install + Network + Make-ready
Wind Cost = Capacity × $/kW

Total Equipment = BESS + Solar + Generator + EV + Wind
```

### Step 3: Calculate Installation Costs
```
Logistics = Equipment × 8%
Import Duty = Equipment × 2%
EPC = Equipment × 25% × Regional Multiplier
Contingency = Equipment × 5%

Total Installation = Logistics + Duty + EPC + Contingency
```

### Step 4: Calculate Total Project Cost
```
Gross Project Cost = Total Equipment + Total Installation
Tax Credit = Gross Cost × ITC Rate (30-50%)
Net Project Cost = Gross Cost - Tax Credit
```

### Step 5: Calculate Financial Metrics
```
Annual Savings = Energy Savings + Demand Charge Reduction + Arbitrage
Payback Period = Net Project Cost / Annual Savings
ROI (10-year) = (Total Savings - Net Cost) / Net Cost × 100%
NPV = Σ (Cash Flow_t / (1 + r)^t) - Initial Investment
```

---

## 11. Example Calculation: Car Wash (Commercial Tier)

### Inputs:
- Peak Demand: 200 kW
- BESS Size: 80 kW / 320 kWh (4-hour)
- Solar: 100 kW
- Location: California

### Equipment Costs:
```
Battery: 320 kWh × $175/kWh × 0.90 (4hr discount) = $50,400
PCS: 80 kW × $120/kW = $9,600
Transformer: 100 kVA × $68/kVA = $6,800
Switchgear: 80 kW × $30/kW = $2,400
BOS: $69,200 × 12% = $8,304
EMS: $15,000 + (80 × $10) = $15,800

BESS Total: $93,304

Solar: 100 kW × 1000 × $1.05/W = $105,000

Total Equipment: $198,304
```

### Installation Costs:
```
Logistics: $198,304 × 8% = $15,864
Import Duty: $198,304 × 2% = $3,966
EPC: $198,304 × 25% × 1.25 (CA) = $61,970
Contingency: $198,304 × 5% = $9,915

Total Installation: $91,715
```

### Final Costs:
```
Gross Project Cost: $198,304 + $91,715 = $290,019
Federal ITC (30%): -$87,006
Net Project Cost: $203,013
```

### Financial Metrics:
```
Annual Savings: ~$35,000 (demand charges + TOU arbitrage)
Payback Period: $203,013 / $35,000 = 5.8 years
10-Year ROI: ($350,000 - $203,013) / $203,013 = 72%
```

---

## 12. Data Sources

1. **NREL ATB 2024** - National Renewable Energy Laboratory Annual Technology Baseline
2. **UK EV Hub Quote** (Oct 2025) - 10 MWh BESS + EV chargers
3. **Tribal Microgrid Quote** (Nov 2025) - 100 kW BESS + 250 kW solar
4. **Hampton Heights Quote** (Oct 2025) - 1.25 MWh BESS + 2 MWp solar + generators
5. **GoGoEV Clubhouse Quote** (Oct 2025) - 418 kWh BESS + 250 kW solar
6. **Data Center Quote** (Sep 2025) - 200 MW off-grid hybrid system
7. **Train Project Quote** (Oct 2025) - 2 MWh BESS + 2 MWp solar

---

## 13. Questions for Review

1. **Pricing Accuracy**: Do these benchmarks align with your experience in the market?

2. **Tier Boundaries**: Are 50 kW and 1 MW the right thresholds for pricing tiers?

3. **Regional Adjustments**: Should we add more regions or adjust multipliers?

4. **Missing Components**: Are there any common project components we're missing?

5. **UX Simplification**: What questions confuse users most? How can we simplify?

6. **Advanced vs Basic Mode**: Should we have a "simple mode" with fewer questions for non-engineers?

---

*Document prepared by Merlin AI - December 4, 2025*
*Version 1.0 - For Internal Review*
