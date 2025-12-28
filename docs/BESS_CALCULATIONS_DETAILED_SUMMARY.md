# BESS Calculations - Detailed Summary

**Date**: December 25, 2025  
**Version**: 2.0.0  
**Status**: Comprehensive Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Equipment Cost Calculations](#equipment-cost-calculations)
3. [Installation & Balance of System Costs](#installation--balance-of-system-costs)
4. [Revenue Stream Calculations](#revenue-stream-calculations)
5. [Financial Metrics](#financial-metrics)
6. [Revenue Model Analysis (Contracted vs Merchant)](#revenue-model-analysis)
7. [Solar Logistics & Pricing Impact](#solar-logistics--pricing-impact)
8. [Industry Standards & Benchmarks](#industry-standards--benchmarks)
9. [Calculation Flow](#calculation-flow)

---

## Overview

Merlin's BESS calculation system provides comprehensive, industry-standard calculations for battery energy storage systems. All calculations follow Q4 2024 - Q1 2025 market reality pricing (which is more accurate than lagging NREL ATB 2024 data) and validated professional quotes, ensuring accuracy and traceability.

### Key Principles

- **SSOT (Single Source of Truth)**: All calculations use centralized services
- **Industry Compliance**: NREL ATB 2024, IEC, UL, NFPA standards
- **Market Intelligence**: Real-time pricing integration via scraper → DB → ML → pricing
- **Traceability**: Every number is traceable to authoritative sources

---

## Equipment Cost Calculations

### Battery System Pricing

**File**: `packages/core/src/calculations/equipmentCalculations.ts`

#### Small Systems (<1 MW)
- **Approach**: Modular pricing based on actual kWh needed
- **Pricing**: Q4 2024 - Q1 2025 Market Reality + Market Intelligence
- **Price Range**: 
  - **Commercial (100-500 kWh)**: $250-400/kWh (higher integration costs)
  - **Residential**: $500-800/kWh (turnkey installed)
- **Calculation Method**:
  ```typescript
  totalEnergyKWh × effectivePricePerKWh = batteryCost
  ```
- **Sources**:
  - UK EV Hub: $120/kWh (validated, earlier 2024)
  - Hampton Heights: $190/kWh (validated, earlier 2024)
  - Tribal Microgrid: $140/kWh (validated, earlier 2024)
- **Note**: NREL ATB 2024 ($450-550/kWh commercial) lags 12-18 months behind market

#### Utility-Scale Systems (≥1 MW)
- **Unit Size**: 3 MW power, 11.5 MWh energy per unit
- **Pricing**: Q4 2024 - Q1 2025 Market Reality
  - **3-10 MW**: $101-125/kWh (container systems, LFP)
  - **10-50 MW**: $95-115/kWh (volume discounts)
  - **50+ MW**: $85-105/kWh (project-level pricing)
- **Note**: NREL ATB 2024 ($334/kWh) lags 12-18 months behind market (based on 2022-2023 data)
- **Calculation Method**:
  ```typescript
  batteryQuantity = ceil(max(storageSizeMW / 3, totalEnergyMWh / 11.5))
  batteryCost = batteryQuantity × (11.5 MWh × 1000 × pricePerKWh)
  ```

### Power Conversion System (PCS/Inverter)

**Pricing**: $120/kW (validated from UK EV Hub quote)

#### Small Systems (<1 MW)
- **Approach**: Sized to actual power requirements (not fixed units)
- **Premium**: 20% for grid-forming capability (off-grid)
- **Manufacturers**: Dynapower (grid-forming), SMA Solar (grid-tied)

#### Utility-Scale (≥1 MW)
- **Unit Size**: 2.5 MW per inverter
- **Calculation**:
  ```typescript
  inverterQuantity = ceil(storageSizeMW / 2.5)
  inverterCost = inverterQuantity × (2.5 MW × 1000 × $120/kW)
  ```

### Transformers

**Pricing**:
- Commercial: $68/kVA (15% discount from utility)
- Utility: $80/kVA (industry standard)

#### Small Systems (<1 MW)
- **Sizing**: Actual MVA needed + 25% margin for power factor
- **Voltage**: 480V/208V (commercial levels)

#### Utility-Scale (≥1 MW)
- **Unit Size**: 5 MVA per transformer
- **Voltage**: 35kV/13.8kV/480V (MV/LV)

### Switchgear

**Pricing**:
- Commercial: $30/kW (LV distribution panels)
- Utility: $50/kW (MV switchgear suite)

### Generators (Backup Power)

**Pricing**:
- Diesel: $800/kW
- Natural Gas: $700/kW
- Dual-Fuel: $900/kW

**Unit Size**: 2 MW per generator (standard)

**Minimum Requirements**:
- Off-grid: 50% of battery capacity (industry standard)

### Fuel Cells

**Pricing**:
- Natural Gas SOFC: $2,500/kW
- Solid Oxide (High Efficiency): $4,000/kW
- Hydrogen PEM: Variable based on fuel source

### Solar PV Systems

**Pricing**:
- Commercial Scale (<5 MW): $0.85/W (validated)
- Utility Scale (≥5 MW): $0.65/W (validated)

**Space Requirements**:
- Rooftop: 100 sq ft per kW
- Ground-mount: 200 sq ft per kW (includes spacing, access roads, setbacks)

**Modules per MW**: ~3,000 panels (333W panels) or ~1,667 panels (600W modules)

### Wind Systems

**Pricing**:
- Onshore Utility (≥5 MW): $1,350/kW
- Distributed (<5 MW): $2,500/kW

### EV Chargers

**Pricing**:
- Level 2 (11 kW): $8,000/unit
- DCFC 50 kW: $40,000/unit
- DCFC 150 kW: $80,000/unit
- DCFC 350 kW: $150,000/unit

---

## Installation & Balance of System Costs

**File**: `packages/core/src/calculations/equipmentCalculations.ts` (lines 754-816)

### Installation Cost Breakdown

All percentages based on **equipment cost** (industry-standard from professional quotes):

1. **Logistics**: 8%
   - Shipping, handling, delivery
   - Source: Professional quotes (Oct 2025)

2. **Import Duty**: 2%
   - For China-sourced equipment
   - Source: Professional quotes (Oct 2025)

3. **EPC (Engineering, Procurement, Construction)**: 25%
   - Includes installation, commissioning, tie-in
   - Source: Professional quotes (Oct 2025)

4. **Contingency**: 5%
   - Permitting, unexpected costs
   - Source: Professional quotes (Oct 2025)

**Total Installation**: 40% of equipment cost

### Commissioning Costs

**File**: `packages/core/src/calculations/equipmentCalculations.ts` (lines 819-900)

1. **Factory Acceptance Test (FAT)**: 1.5% of battery system cost
   - Testing at manufacturer before shipping

2. **Site Acceptance Test (SAT)**: 2.5% of total equipment cost
   - On-site verification and integration testing

3. **SCADA/EMS Integration**: $25,000 base + $5,000/MW
   - Control system programming and integration

4. **Functional Safety Testing**: $15,000 base + $3,000/MW
   - IEC 61508/62443 compliance

5. **Performance Testing**: $10,000 base + $500/MWh
   - Battery performance validation

**Sources**: DNV GL, UL 9540A requirements, IEC 61508/62443

### Certification & Permitting Costs

**File**: `packages/core/src/calculations/equipmentCalculations.ts` (lines 900-950)

1. **Interconnection Study**: $10,000 base + $15,000/MW
   - Grid interconnection analysis

2. **Utility Grid Upgrades**: 3% of equipment cost
   - Grid-connected systems only

3. **Environmental Permits**: $5,000 base + variable
   - NEPA, state/local requirements

4. **Building Permits**: $2,000 base + $500/MW

5. **Fire Code Compliance**: $3,000 base + $1,000/MW
   - NFPA 855 (battery storage standard)

**Sources**: FERC 2222, state PUC requirements, local building codes, NFPA 855

### Annual Operating Costs (O&M)

**File**: `packages/core/src/calculations/equipmentCalculations.ts` (lines 930-980)

1. **Operations & Maintenance**: 1.5% of battery system capex annually
   - Ongoing monitoring, preventive maintenance

2. **Extended Warranty**: 0.5% of battery system cost
   - Beyond standard 10-year warranty

3. **Capacity Testing**: $5,000 base + $200/MWh annually
   - Annual battery capacity validation

4. **Insurance Premium**: 0.3% of total project cost

5. **Software Licenses**: $10,000 base + $500/MW
   - SCADA, EMS subscriptions

**Sources**: NREL O&M benchmarks, industry standard warranties

---

## Revenue Stream Calculations

**File**: `src/services/centralizedCalculations.ts`

### Revenue Stream Types

Merlin supports multiple revenue streams for BESS projects:

#### 1. Peak Shaving / Energy Arbitrage
```typescript
peakShavingSavings = totalEnergyMWh × 365 × (electricityRate - 0.05) × 1000
```
- **Assumption**: Buy low (off-peak), sell high (on-peak)
- **Margin**: $0.05/kWh spread (conservative estimate)
- **Annual Cycles**: 365 (daily cycling)

#### 2. Demand Charge Reduction
```typescript
demandChargeSavings = storageSizeMW × 12 months × demandChargeRate
```
- **Typical Rate**: $15,000/MW-month (varies by utility)
- **Mechanism**: Reduce peak demand to lower monthly demand charges

#### 3. Grid Services Revenue
```typescript
gridServiceRevenue = storageSizeMW × gridServiceRevenuePerMW
```
- **Typical Rate**: Variable by market
- **Services**: Frequency regulation, spinning reserve, voltage support

#### 4. Solar Savings (if applicable)
```typescript
solarSavings = solarMW × 1000 × solarCapacityFactor × 8760 × electricityRate
```
- **Capacity Factor**: ~25% (varies by location)
- **Mechanism**: Use solar generation instead of grid power

#### 5. Wind Savings (if applicable)
```typescript
windSavings = windMW × 1000 × windCapacityFactor × 8760 × electricityRate
```
- **Capacity Factor**: ~35% (onshore utility scale)
- **Mechanism**: Use wind generation instead of grid power

### Total Annual Savings
```typescript
annualSavings = peakShavingSavings + demandChargeSavings + gridServiceRevenue + solarSavings + windSavings
```

**Note**: Revenue streams are additive—projects can participate in multiple markets simultaneously.

---

## Financial Metrics

**File**: `src/services/centralizedCalculations.ts`

### Simple Metrics

#### Payback Period
```typescript
paybackYears = netCost / annualSavings
```

#### ROI (10-Year)
```typescript
roi10Year = ((annualSavings × 10) - netCost) / netCost × 100
```

#### ROI (25-Year)
```typescript
roi25Year = ((annualSavings × 25) - netCost) / netCost × 100
```

### Advanced Metrics (NPV/IRR)

**Assumptions**:
- **Project Life**: 25 years
- **Discount Rate**: 8% (WACC - Weighted Average Cost of Capital)
- **Degradation Rate**: 2.5% annually (NREL ATB standard)
- **Price Escalation**: 2% annually (inflation)

#### Net Present Value (NPV)
```typescript
NPV = Σ(cashFlow[t] / (1 + discountRate)^t) - initialInvestment
```

Where:
- `cashFlow[t] = annualSavings × (1 - degradationRate)^t × (1 + priceEscalation)^t - annualOpex`
- Years 1-25 are calculated with degradation and escalation

#### Internal Rate of Return (IRR)
The discount rate that makes NPV = 0

#### Levelized Cost of Storage (LCOS)
```typescript
LCOS = (totalProjectCost + Σ(annualOpex / (1 + discountRate)^t)) / Σ(energyDischarged / (1 + discountRate)^t)
```

---

## Revenue Model Analysis

### Contracted Revenue Models

**Characteristics**:
- **Revenue Stability**: High - Predictable revenue streams based on long-term agreements
- **Risk Level**: Lower - Fixed contracts mitigate price fluctuation risks
- **Flexibility**: Lower - Terms locked in contract, limited agility
- **Profit Potential**: Generally steady, but capped by contract terms
- **Financing**: Easier to secure - Predictable revenues attractive to lenders

**Revenue Sources**:
- Capacity Contracts (fixed $/MW-month)
- Tolling Agreements
- Energy-Only Agreements
- Energy Hedge Capacity Sale Agreements
- Ancillary Services Contracts (fixed prices)
- Power Purchase Agreements (PPAs)

**Ideal For**:
- Risk-averse investors
- Markets with developing storage regulations
- Projects prioritizing capital preservation
- Bankable projects requiring debt financing

**Design Implications**:
- Focus on long-term reliability
- Predictable degradation curves
- Contractual performance guarantees
- Less emphasis on rapid response times

### Merchant Revenue Models

**Characteristics**:
- **Revenue Stability**: Variable - Dependent on market prices and conditions
- **Risk Level**: Higher - Exposed to market volatility and price fluctuations
- **Flexibility**: Higher - Ability to capitalize on market highs (but also exposed to lows)
- **Profit Potential**: Potentially higher, benefiting from peak pricing events
- **Financing**: Potentially challenging - Variable revenues less appealing to risk-averse financiers

**Revenue Sources**:
- Energy Arbitrage (buy low, sell high)
- Frequency Regulation
- Capacity Market Participation
- Demand Response
- Congestion Relief
- Renewable Energy Integration

**Ideal For**:
- Investors willing to take on more risk for potentially higher returns
- Adaptable strategies in volatile markets
- Mature markets with established storage regulations
- Projects with strong forecasting and EMS capabilities

**Design Implications**:
- Higher confidence in cell consistency required
- Stronger thermal and safety margins
- Accurate performance testing and degradation modeling
- Faster response times and tighter control logic
- More sophisticated EMS (Energy Management System)

### Hybrid Revenue Models

**Trend**: Increasingly common globally, including in India

**Structure**:
- Base layer of contracted revenues for downside protection
- Merchant participation to unlock upside during favorable market conditions

**Benefits**:
- Financial stability from contracts
- Upside potential from merchant operations
- Reflects how modern grids actually behave
- Balances risk and reward

**Design Implications**:
- Must support both predictable and dynamic operations
- Flexible EMS that can switch between modes
- Performance guarantees for contracted portion
- Agile response for merchant portion

---

## Solar Logistics & Pricing Impact

### SEIA 2025-2030 Outlook Analysis

**Projected Deployment**: 246 GWdc from 2025-2030

### Logistics Calculations

#### Module Specifications
- **Module Power**: 600W per module (conservative, higher end)
- **Modules per MW**: 1,667 modules/MW
  ```
  1,000,000W / 600W = 1,666.67 ≈ 1,667 modules
  ```

#### Pallet Configuration
- **Modules per Pallet**: 32 modules (standard for 600W modules)
- **Pallets per MW**: 53 pallets/MW
  ```
  1,667 modules / 32 modules per pallet = 52.1 ≈ 53 pallets
  ```

#### Total Logistics Requirements (2025-2030)

**Pallets**:
```
53 pallets/MW × 1,000 MW/GW × 246 GW = 13,038,000 pallets
```

**Containers** (for transportation):
```
13,038,000 pallets / 18 pallets per container = 724,334 containers
```
- **Note**: Standard 40-ft container holds ~18 pallets of solar modules

**Warehousing** (for storage):
```
13,038,000 pallets / 2 (double stack) = 6,519,000 pallet positions
6,519,000 positions × 40 sqft per position = 260,760,000 sqft
```
- **Pallet Footprint**: 8 ft × 4 ft = 32 sqft (plus 8 sqft for aisles = 40 sqft per position)
- **Double Stacking**: Common practice in warehouses

### Impact on Pricing & Calculations

#### Supply Chain Considerations
1. **Logistics Costs**: 
   - Container shipping: ~$2,000-4,000 per 40-ft container (varies by route)
   - Total shipping cost estimate: $1.4-2.9 billion for 246 GW
   - This represents ~1-2% of total project costs

2. **Warehousing Costs**:
   - Commercial warehouse: ~$5-10/sqft/year
   - Total annual storage: $1.3-2.6 billion/year (if all stored simultaneously)
   - **Reality**: Most modules move directly from port to installation site

3. **Price Impact**:
   - Large-scale deployments may see economies of scale
   - Logistics costs should be factored into installation cost calculations
   - Bulk purchasing can reduce per-Watt costs

#### Integration into Merlin Calculations

**Current Implementation**:
- Logistics costs: 8% of equipment cost (already included)
- This percentage should remain appropriate for large-scale deployments

**Recommendations**:
1. Monitor logistics cost trends as deployment scales
2. Consider bulk shipping discounts for utility-scale projects
3. Factor warehousing into project timelines (if modules need staging)

**Calculation Integration**:
The existing logistics percentage (8%) in `equipmentCalculations.ts` accounts for shipping, handling, and delivery. For projects over 100 MW, consider:
- Negotiated shipping rates (may reduce to 6-7%)
- Direct port-to-site logistics (may increase to 9-10% if additional handling needed)

---

## Industry Standards & Benchmarks

### Primary Sources

1. **NREL ATB 2024** (Annual Technology Baseline)
   - Battery pricing: $140-190/kWh
   - PCS pricing: $100-120/kW
   - Solar pricing: $0.65-0.85/W

2. **Professional Quotes** (Validated)
   - UK EV Hub: $120/kWh, $120/kW PCS
   - Hampton Heights: $190/kWh
   - Tribal Microgrid: $140/kWh

3. **Industry Standards**
   - IEC 61508/62443 (Functional Safety)
   - UL 9540A (Battery Storage)
   - NFPA 855 (Fire Code Compliance)
   - FERC 2222 (Interconnection)

### Calculation Constants

**File**: `src/services/centralizedCalculations.ts`

**Default Values** (from database or fallback):
- Peak Shaving Multiplier: Variable by market
- Demand Charge Rate: $15,000/MW-month
- Grid Service Revenue: Variable by market
- Solar Capacity Factor: 25% (varies by location)
- Wind Capacity Factor: 35% (onshore utility)
- Federal Tax Credit: 30% ITC
- Round Trip Efficiency: 85%
- Degradation Rate: 2.5% annually
- O&M Cost: 1.5% of capex annually
- Project Lifetime: 25 years
- Discount Rate: 8% (WACC)

---

## Calculation Flow

### High-Level Flow

```
User Input
    ↓
calculateQuote() [unifiedQuoteCalculator.ts]
    ↓
    ├──→ calculateEquipmentBreakdown() [equipmentCalculations.ts]
    │       ├──→ Market Intelligence Pricing
    │       ├──→ Battery System Calculation
    │       ├──→ Power Electronics (PCS, Transformers, Switchgear)
    │       ├──→ Additional Equipment (Solar, Wind, Generators, EV)
    │       ├──→ Installation Costs (BOS, EPC)
    │       ├──→ Commissioning Costs
    │       └──→ Certification & Permitting
    │
    └──→ calculateFinancialMetrics() [centralizedCalculations.ts]
            ├──→ Revenue Stream Calculations
            ├──→ Simple Metrics (Payback, ROI)
            └──→ Advanced Metrics (NPV, IRR, LCOS)
    ↓
Quote Result (with full breakdown and financials)
```

### Detailed Calculation Steps

1. **System Sizing**
   - User provides: storageSizeMW, durationHours
   - Calculate: totalEnergyMWh = storageSizeMW × durationHours

2. **Equipment Costs**
   - Battery: Market-aligned pricing × totalEnergyKWh
   - PCS: $120/kW × storageSizeMW
   - Transformers: $68-80/kVA × requiredMVA
   - Switchgear: $30-50/kW × storageSizeMW
   - Additional equipment as specified

3. **Installation Costs**
   - Logistics: 8% of equipment
   - Import Duty: 2% of equipment
   - EPC: 25% of equipment
   - Contingency: 5% of equipment
   - Total: 40% of equipment cost

4. **Commissioning Costs**
   - FAT: 1.5% of battery cost
   - SAT: 2.5% of equipment cost
   - SCADA: $25k + $5k/MW
   - Safety Testing: $15k + $3k/MW
   - Performance Testing: $10k + $500/MWh

5. **Certification Costs**
   - Interconnection: $10k + $15k/MW
   - Grid Upgrades: 3% of equipment (if grid-connected)
   - Permits: $5k + variable
   - Fire Code: $3k + $1k/MW

6. **Total Project Cost**
   - Equipment + Installation + Commissioning + Certification

7. **Tax Credit**
   - Federal ITC: 30% of total project cost
   - Net Cost: Total Cost - Tax Credit

8. **Annual Revenue**
   - Peak Shaving Savings
   - Demand Charge Reduction
   - Grid Services Revenue
   - Solar/Wind Savings (if applicable)

9. **Annual Costs**
   - O&M: 1.5% of battery capex
   - Warranty: 0.5% of battery cost
   - Testing: $5k + $200/MWh
   - Insurance: 0.3% of project cost
   - Software: $10k + $500/MW

10. **Net Annual Savings**
    - Annual Revenue - Annual Costs

11. **Financial Metrics**
    - Payback: Net Cost / Net Annual Savings
    - ROI: (Net Annual Savings × Years - Net Cost) / Net Cost
    - NPV: Discounted cash flows over 25 years
    - IRR: Discount rate where NPV = 0

---

## Conclusion

Merlin's BESS calculation system provides comprehensive, industry-standard calculations that are:

- **Accurate**: Based on NREL ATB 2024 and validated professional quotes
- **Complete**: All cost components and revenue streams included
- **Traceable**: Every number traceable to authoritative sources
- **Flexible**: Supports multiple revenue models (contracted, merchant, hybrid)
- **Current**: Integrates market intelligence and real-time pricing

The system is designed to support informed decision-making for BESS projects, whether they rely on contracted revenues, merchant markets, or a hybrid approach.

---

## References

1. NREL ATB 2024 - Annual Technology Baseline
2. UK EV Hub Quote (validated professional quote)
3. Hampton Heights Project (validated professional quote)
4. Tribal Microgrid Project (validated professional quote)
5. SEIA 2025-2030 Solar Deployment Outlook
6. IEC 61508/62443 - Functional Safety Standards
7. UL 9540A - Battery Storage Safety Standards
8. NFPA 855 - Fire Code for Battery Storage
9. FERC 2222 - Grid Interconnection Regulations
10. Semco BESS Revenue Model Analysis (industry perspective)

