# NREL ATB 2024 Pricing Update Analysis

**Date**: December 25, 2025  
**Source**: NREL Annual Technology Baseline (ATB) 2024  
**Status**: Pricing Schema Review & Update Recommendations

## Executive Summary

This document compares current Merlin pricing values with NREL ATB 2024 authoritative sources and provides recommendations for updates.

## 🔋 BATTERY ENERGY STORAGE SYSTEMS (BESS)

### NREL ATB 2024 Official Data

**Primary Source**: https://atb.nrel.gov/electricity/2024/technologies

| System Type | 2024 Cost | Duration | Reference Size |
|------------|-----------|----------|----------------|
| **Utility-Scale (4-hr)** | ~$334/kWh | 2-10 hr | 60 MW reference system |
| **Commercial (4-hr)** | ~$450-550/kWh | 2-8 hr | Bottom-up cost model |
| **Residential** | ~$800-1,000/kWh | 2.5 hr | 5 kW/12.5 kWh reference |

**NREL Cost Formula**:
```
Total System Cost ($/kW) = Battery Pack Cost ($/kWh) × Storage Duration (hr) + BOS Cost ($/kW)
```

**Projections** (NREL Cost Projections Report):
- 2035: $147-339/kWh
- 2050: $108-307/kWh
- Round-trip efficiency: 85%
- O&M: 2.5% of capital costs annually

### Current Merlin Pricing

| System Type | Current Pricing | Source |
|------------|----------------|--------|
| **Utility-Scale** | $140-190/kWh | Validated quotes (UK EV Hub $120/kWh, Hampton Heights $190/kWh) |
| **Commercial (<1 MW)** | $140-175/kWh | NREL ATB + Market Intelligence |
| **Small Systems** | Up to $580/kWh cap | Market pricing with cap |

### ⚠️ Pricing Discrepancy Analysis

**Key Finding**: Current Merlin pricing is **significantly lower** than NREL ATB 2024 official values.

**Discrepancy Reasons**:
1. **Validated Professional Quotes**: Merlin's current pricing is based on actual project quotes (UK EV Hub, Hampton Heights, Tribal Microgrid) which may reflect:
   - Competitive bidding discounts
   - Volume purchasing agreements
   - Project-specific optimizations
   - Market conditions at time of quote

2. **NREL ATB Methodology**: NREL ATB uses:
   - Bottom-up cost models
   - Reference system costs (not negotiated project prices)
   - Average market prices (not best-case scenarios)

3. **Market Context**:
   - Professional quotes from Oct 2025 may reflect market maturity and competition
   - NREL ATB reflects average costs, not optimized project costs
   - Real-world projects often achieve 20-40% cost reductions through optimization

### 📊 Recommended Pricing Strategy

**Option 1: Hybrid Approach (RECOMMENDED)**
- **Use NREL ATB 2024 as baseline** for initial estimates and validation
- **Apply discount factor** (15-30%) for optimized/commercial projects based on validated quotes
- **Document both sources** in quote metadata

**Proposed Pricing**:
```
Utility-Scale: $334/kWh (NREL ATB) → Apply 30% discount → $234/kWh (validated projects)
Commercial: $500/kWh (NREL ATB mid-range) → Apply 40% discount → $300/kWh (optimized)
Small Systems: Use NREL ATB + market intelligence scaling
```

**Option 2: Market-Validated Pricing (CURRENT)**
- Continue using validated professional quotes
- **Add disclaimer** that pricing reflects optimized/competitive projects
- **Cross-reference with NREL ATB** in documentation
- Flag quotes that are significantly below NREL ATB (>40% discount)

### Implementation Recommendation

1. **Update baseline pricing** to NREL ATB 2024 values
2. **Add "pricing tier" selection**:
   - "NREL ATB Baseline" (full NREL pricing)
   - "Optimized/Commercial" (discounted from NREL based on validated quotes)
   - "Custom" (user-specified)
3. **Document pricing source** in quote metadata
4. **Add validation warnings** if quote is >40% below NREL ATB baseline

---

## ☀️ SOLAR PV SYSTEMS

### NREL ATB 2024 Official Data

**Primary Source**: 
- Utility-Scale PV: https://atb.nrel.gov/electricity/2024/utility-scale_pv
- Commercial PV: https://atb.nrel.gov/electricity/2024/commercial_pv
- Q1 2024 Cost Benchmarks: https://data.nrel.gov/submissions/307

| System Type | Q1 2024 Cost ($/W DC) | Reference Size |
|------------|----------------------|----------------|
| **Utility-Scale** | $0.85-1.10 | 100 MW DC |
| **Commercial** | $1.50-2.00 | 200 kW - 3 MW |
| **Residential** | $2.50-3.50 | 8 kW DC |

**O&M Cost**: ~$24/kWAC-year (utility-scale)

### Current Merlin Pricing

| System Type | Current Pricing | Status |
|------------|----------------|--------|
| **Utility-Scale (≥5 MW)** | $0.65/W | ⚠️ **BELOW NREL RANGE** ($0.85-1.10) |
| **Commercial (<5 MW)** | $0.85/W | ✅ **AT LOW END** of NREL range ($1.50-2.00) |

### 📊 Recommended Updates

**Utility-Scale Solar**:
- **Current**: $0.65/W
- **NREL ATB 2024**: $0.85-1.10/W
- **Recommendation**: Update to $0.85/W (low end of NREL range) or add note that $0.65/W reflects aggressive pricing

**Commercial Solar**:
- **Current**: $0.85/W
- **NREL ATB 2024**: $1.50-2.00/W
- **Recommendation**: **UPDATE to $1.50/W** (low end of NREL range)
- **Rationale**: Current pricing is 43% below NREL baseline - significant discrepancy

**Action Items**:
1. Update commercial solar pricing to $1.50/W
2. Consider updating utility-scale to $0.85/W (unless validated quotes justify lower)
3. Add source attribution to NREL ATB 2024 Q1 Cost Benchmarks

---

## 🌬️ WIND ENERGY

### NREL ATB 2024 Official Data

**Primary Source**: 
- Land-Based Wind: https://atb.nrel.gov/electricity/2024/land-based_wind
- Offshore Wind: https://atb.nrel.gov/electricity/2024/offshore_wind

| Type | LCOE ($/MWh) | CAPEX Range |
|------|--------------|-------------|
| **Land-Based** | $27-42 | $1,200-1,800/kW |
| **Offshore Fixed** | $70-120 | $3,500-5,500/kW |
| **Offshore Floating** | $80-150 | $4,000-7,000/kW |

### Current Merlin Pricing

| Type | Current Pricing | Status |
|------|----------------|--------|
| **Onshore Utility (≥5 MW)** | $1,350/kW | ✅ **WITHIN NREL RANGE** ($1,200-1,800/kW) |
| **Distributed (<5 MW)** | $2,500/kW | ⚠️ **ABOVE NREL RANGE** (not explicitly covered) |

### 📊 Analysis

- **Utility-scale pricing is accurate** (within NREL range)
- **Distributed wind pricing** ($2,500/kW) is reasonable given smaller scale economics
- **No immediate update needed** for utility-scale
- **Consider documenting** that distributed pricing reflects smaller project economics

---

## ⚡ EV CHARGING INFRASTRUCTURE

### DOE AFDC Official Data (Q1 2024)

**Primary Source**: https://afdc.energy.gov/fuels/electricity-infrastructure-development

| Charger Type | Equipment Cost | Installation Cost | Total |
|--------------|----------------|-------------------|-------|
| **Level 1** | $300-1,500 | $0-3,000 | $300-4,500 |
| **Level 2** | $400-6,500 | $600-12,700 | $1,000-19,200 |
| **DC Fast (50 kW)** | $10,000-40,000 | $4,000-51,000 | $14,000-91,000 |
| **DC Fast (150+ kW)** | $50,000-150,000+ | $10,000-100,000 | $60,000-250,000+ |

**Annual Maintenance**: 
- Level 2: ~$400/charger/year
- DCFC: $800+/year

### Current Merlin Pricing

| Charger Type | Current Total Cost | NREL Range | Status |
|--------------|-------------------|------------|--------|
| **Level 2 (11 kW)** | $8,000 | $1,000-19,200 | ✅ **WITHIN RANGE** |
| **DCFC 50 kW** | $40,000 | $14,000-91,000 | ✅ **WITHIN RANGE** (mid-range) |
| **DCFC 150 kW** | $80,000 | $60,000-250,000+ | ✅ **WITHIN RANGE** (low end) |
| **DCFC 350 kW** | $150,000 | $60,000-250,000+ | ✅ **WITHIN RANGE** |

### 📊 Analysis

- **All EV charger pricing is within DOE ranges**
- **Current pricing is reasonable** (typically at low-to-mid range)
- **No immediate update needed**

---

## ⛽ BACKUP GENERATORS

### EIA & Industry Data

**Primary Source**: EIA Generator Construction Costs  
**URL**: https://www.eia.gov/electricity/generatorcosts/

| Generator Type | Size | Cost Range |
|----------------|------|------------|
| **Natural Gas Standby** | 30 kW | $15,000-25,000 |
| **Natural Gas Commercial** | 60-100 kW | $30,000-60,000 |
| **Natural Gas Industrial** | 500 kW | $175,000-200,000 |
| **Diesel Commercial** | 100 kW | $22,000-50,000 |
| **Diesel Industrial** | 500+ kW | $75,000-125,000+ |

**Installation Rule of Thumb**: ~$1,000/kW for commercial  
**Annual Maintenance**: $1,000-2,000/year (commercial)

### Current Merlin Pricing

| Type | Current Pricing ($/kW) | EIA Equivalent | Status |
|------|----------------------|----------------|--------|
| **Diesel** | $800/kW | $750-1,250/kW (500 kW) | ✅ **REASONABLE** |
| **Natural Gas** | $700/kW | $600-1,000/kW (500 kW) | ✅ **REASONABLE** |
| **Dual-Fuel** | $900/kW | N/A | ✅ **REASONABLE** |

### 📊 Analysis

- **Current pricing aligns with EIA data** (using 500 kW as reference)
- **Unit-based approach** ($700-900/kW) is appropriate
- **No immediate update needed**

---

## 📋 IMPLEMENTATION PRIORITY MATRIX

### 🔴 HIGH PRIORITY (Significant Discrepancy)

1. **Commercial Solar Pricing**
   - **Current**: $0.85/W
   - **NREL ATB 2024**: $1.50-2.00/W
   - **Action**: Update to $1.50/W
   - **Impact**: Will increase commercial solar project costs by ~76%

2. **BESS Pricing Documentation**
   - **Action**: Document that current pricing reflects optimized/commercial projects
   - **Action**: Add NREL ATB 2024 baseline as reference point
   - **Impact**: Transparency and validation

### 🟡 MEDIUM PRIORITY (Minor Discrepancy)

3. **Utility-Scale Solar Pricing**
   - **Current**: $0.65/W
   - **NREL ATB 2024**: $0.85-1.10/W
   - **Action**: Update to $0.85/W or document aggressive pricing
   - **Impact**: Will increase utility-scale solar costs by ~31%

4. **BESS Utility-Scale Baseline**
   - **Action**: Add NREL ATB 2024 $334/kWh as baseline option
   - **Action**: Keep current $140-190/kWh as "optimized" tier
   - **Impact**: Better pricing transparency

### 🟢 LOW PRIORITY (No Changes Needed)

5. **EV Charger Pricing** - Within DOE ranges ✅
6. **Generator Pricing** - Aligns with EIA data ✅
7. **Wind Pricing** - Within NREL ranges ✅

---

## 📊 SOURCE ATTRIBUTION REQUIREMENTS

### Required Updates to Documentation

1. **Update `pricingModel.ts`** with NREL ATB 2024 references
2. **Update `equipmentCalculations.ts`** source comments
3. **Update `BESS_CALCULATIONS_DETAILED_SUMMARY.md`** with new pricing data
4. **Add pricing tier selection** to quote builder (NREL Baseline vs Optimized)

### Source URLs to Document

**BESS**:
- Utility-Scale: https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage
- Commercial: https://atb.nrel.gov/electricity/2024/commercial_battery_storage
- Residential: https://atb.nrel.gov/electricity/2024/residential_battery_storage

**Solar**:
- Utility-Scale: https://atb.nrel.gov/electricity/2024/utility-scale_pv
- Commercial: https://atb.nrel.gov/electricity/2024/commercial_pv
- Cost Benchmarks: https://data.nrel.gov/submissions/307

**Wind**:
- Land-Based: https://atb.nrel.gov/electricity/2024/land-based_wind
- Offshore: https://atb.nrel.gov/electricity/2024/offshore_wind

**EV Charging**:
- DOE AFDC: https://afdc.energy.gov/fuels/electricity-infrastructure-development

**Generators**:
- EIA: https://www.eia.gov/electricity/generatorcosts/

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Documentation Updates (IMMEDIATE)
1. Update `BESS_CALCULATIONS_DETAILED_SUMMARY.md` with NREL ATB 2024 pricing
2. Add source attribution comments to pricing constants
3. Document pricing tier strategy (NREL Baseline vs Optimized)

### Phase 2: Pricing Updates (HIGH PRIORITY)
1. Update commercial solar from $0.85/W to $1.50/W
2. Consider utility-scale solar update to $0.85/W
3. Add NREL ATB 2024 baseline pricing as reference option

### Phase 3: Feature Enhancement (MEDIUM PRIORITY)
1. Add "pricing tier" selection to quote builder
2. Add validation warnings for quotes significantly below NREL baseline
3. Enhance quote metadata with pricing source attribution

---

## 📚 ADDITIONAL RESOURCES

### Comprehensive Data Downloads

1. **NREL ATB Data Spreadsheet** (FREE)
   - URL: https://atb.nrel.gov/electricity/2024/data
   - Contains all technology costs through 2050
   - Three scenarios: Conservative, Moderate, Advanced
   - Downloadable Excel format

2. **EIA Annual Energy Outlook**
   - URL: https://www.eia.gov/outlooks/aeo/
   - Electricity generation costs by technology
   - Regional variations

3. **Lawrence Berkeley National Lab (LBNL) Reports**
   - Utility-Scale Solar: https://emp.lbl.gov/utility-scale-solar
   - Tracking the Sun (Distributed): https://emp.lbl.gov/tracking-the-sun

---

## Conclusion

Current Merlin pricing is generally aligned with authoritative sources, with **two key discrepancies**:

1. **Commercial Solar**: Current $0.85/W is 43% below NREL ATB 2024 range ($1.50-2.00/W) - **UPDATE REQUIRED**
2. **BESS Pricing**: Current pricing reflects optimized projects vs NREL ATB baseline - **DOCUMENTATION REQUIRED**

Recommendations prioritize transparency, accuracy, and maintaining validated project pricing while adding NREL ATB 2024 as authoritative baseline reference.




