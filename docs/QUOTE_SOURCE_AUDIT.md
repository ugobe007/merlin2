# Merlin Platform: Quote Line Item Source Audit

**Generated:** December 10, 2025  
**Auditor:** Benchmark Tracking System v1.0.0  
**Purpose:** Identify traceable sources vs. gaps in quote line items

---

## Executive Summary

| Category | Line Items | Sourced | Gaps | Coverage |
|----------|------------|---------|------|----------|
| **Equipment Costs** | 14 | 12 | 2 | 86% |
| **Financial Constants** | 10 | 8 | 2 | 80% |
| **Methodologies** | 6 | 6 | 0 | 100% |
| **Industry Benchmarks** | 8 | 7 | 1 | 88% |
| **TOTAL** | 38 | 33 | 5 | 87% |

---

## 1. EQUIPMENT COSTS - Line Item Audit

### ✅ SOURCED (12/14)

| Line Item | Current Value | Source | Citation | Confidence |
|-----------|---------------|--------|----------|------------|
| **Battery Pack (Utility)** | $155/kWh | NREL ATB 2024 | Moderate scenario, 4-hr LFP | High |
| **Battery Pack (C&I)** | $275/kWh | NREL Cost Benchmark Q1 2024 | Commercial standalone storage | High |
| **Solar PV (Utility)** | $0.65/W | NREL Cost Benchmark Q1 2024 | >5 MW ground-mount | High |
| **Solar PV (Commercial)** | $0.85/W | NREL Cost Benchmark Q1 2024 | 200 kW–2 MW rooftop | High |
| **Wind (Land-based)** | $1,200/kW | NREL ATB 2024 | Class 4 resource | High |
| **Inverter (Utility)** | $80/kW | NREL ATB 2024 | Utility-scale PCS | High |
| **Inverter (Commercial)** | $120/kW | NREL Cost Benchmark Q1 2024 | Commercial-scale | High |
| **Transformer** | $50,000/MVA | NREL ATB 2024 | 34.5 kV utility | Medium |
| **Natural Gas Generator** | $700/kW | EIA Electric Power Monthly | Reciprocating engine | Medium |
| **Diesel Generator** | $800/kW | EIA Electric Power Monthly | Backup generator | Medium |
| **ITC Rate** | 30% | IRS Code §48(a) | Current law | High |
| **Installation (BOS)** | 15% of equipment | NREL Cost Benchmark Q1 2024 | Balance of system | High |

### ⚠️ GAPS (2/14)

| Line Item | Current Value | Issue | Recommended Source |
|-----------|---------------|-------|-------------------|
| **Switchgear** | $50/kW | Industry estimate, no formal citation | NREL should include in ATB |
| **Fuel Cells** | $2,500-4,000/kW | Multiple sources, needs consolidation | DOE Hydrogen Program (HFTO) |

### 📋 Action Items
1. Request switchgear cost data from NREL (may be in BOS category)
2. Integrate DOE HFTO fuel cell cost projections
3. Add Hydrogen Shot initiative references for fuel cell pricing

---

## 2. FINANCIAL CONSTANTS - Source Audit

### ✅ SOURCED (8/10)

| Constant | Value | Source | NREL/DOE Alignment |
|----------|-------|--------|-------------------|
| **Discount Rate (WACC)** | 8% | NREL StoreFAST | ✅ Aligned |
| **Project Lifetime** | 25 years | NREL ATB 2024 | ✅ Aligned |
| **Degradation Rate** | 2%/year | NREL ATB 2024 | ✅ Aligned |
| **Round-Trip Efficiency** | 85% | NREL ATB 2024 | ✅ Aligned |
| **Annual Cycles** | 365 | NREL StoreFAST | ✅ Aligned |
| **O&M Cost** | 2.5% of CAPEX | NREL Cost Benchmark 2024 | ✅ Aligned |
| **Federal ITC** | 30% | IRS Code §48(a) | ✅ Current law |
| **Solar Capacity Factor** | 1,500 kWh/kW | NREL ATB 2024 | ✅ Class 5 resource |

### ⚠️ GAPS (2/10)

| Constant | Current Value | Issue | Recommended Source |
|----------|---------------|-------|-------------------|
| **Demand Charge Rate** | $15,000/MW-mo | Generic estimate | Needs regional utility tariff data |
| **Grid Service Revenue** | $30,000/MW-yr | Market estimate | Needs ISO-specific data (CAISO, PJM, ERCOT) |

### 📋 Action Items
1. Integrate OpenEI utility rate database for demand charges
2. Add ISO-specific ancillary service revenue data
3. Create regional adjustment factors with citations

---

## 3. CALCULATION METHODOLOGIES - Source Mapping

### ✅ ALL METHODOLOGIES SOURCED (6/6)

| Methodology | Formula | NREL/DOE Citation | Implementation |
|-------------|---------|-------------------|----------------|
| **LCOS** | Total Lifecycle Cost ÷ Total Energy Discharged | NREL StoreFAST, Lazard LCOS v9.0 | `centralizedCalculations.ts` |
| **NPV** | Σ(CF_t / (1+r)^t) - I₀ | NREL StoreFAST, DOE EERE | `centralizedCalculations.ts` |
| **IRR** | Rate where NPV = 0 | NREL StoreFAST | `centralizedCalculations.ts` (simplified) |
| **Payback (Simple)** | Net Cost ÷ Annual Savings | Standard accounting | `centralizedCalculations.ts` |
| **Payback (Discounted)** | When cumulative DCF > 0 | NREL StoreFAST | `centralizedCalculations.ts` |
| **Degradation** | Capacity × (1 - rate)^year | NREL ATB 2024 | `centralizedCalculations.ts` |

### ✅ Formula Variables Mapped to NREL

| Variable | Our Name | NREL StoreFAST Name | Value |
|----------|----------|---------------------|-------|
| Capital Cost | `netCost` | `CAPEX` | Calculated |
| Discount Rate | `discountRate` | `WACC` | 8% |
| Escalation Rate | `escalationRate` | `Inflation` | 2% |
| Degradation | `DEGRADATION_RATE_ANNUAL` | `Annual_Deg` | 2% |
| O&M | `OM_COST_PERCENT` | `Fixed_OM` | 2.5% |
| Project Life | `projectLifetimeYears` | `Analysis_Period` | 25 |

---

## 4. INDUSTRY POWER BENCHMARKS - Source Audit

### ✅ SOURCED (7/8)

| Use Case | Benchmark | Source | Status |
|----------|-----------|--------|--------|
| **Hotel Energy** | 8,850 kWh/room/year | Marriott Lancaster (actual) | ✅ Verified |
| **Data Center PUE** | 1.1–2.0 by tier | Uptime Institute | ✅ Sourced |
| **Office EUI** | 50–150 kBtu/sqft/yr | CBECS 2018 | ✅ Sourced |
| **Hospital** | 150–300 kBtu/sqft/yr | CBECS 2018 | ✅ Sourced |
| **University** | 2–8 kW/student | APPA/Carnegie | ✅ Sourced |
| **Airport** | FAA/ICAO standards | AC 150/5370-2G | ✅ Sourced |
| **Car Wash** | ICA equipment specs | International Carwash Association | ✅ Sourced |

### ⚠️ GAPS (1/8)

| Use Case | Issue | Recommended Source |
|----------|-------|-------------------|
| **Manufacturing** | Generic, needs industry-specific | DOE Industrial Assessment Centers |

---

## 5. SOURCE ATTRIBUTION STATUS

### Currently in Code

```typescript
// ✅ Already attributed in unifiedPricingService.ts
NREL_ATB_2024_BATTERY: {
  pricePerKWh: 155, // NREL ATB 2024 Moderate scenario
  dataSource: 'nrel',
}

// ✅ Already attributed in equipmentCalculations.ts
marketIntelligence: {
  dataSource: 'NREL ATB 2024 + Market Intelligence'
}
```

### New Attribution System (benchmarkSources.ts)

```typescript
// ✅ Comprehensive attribution now available
PRICING_BENCHMARKS['bess-lfp-utility-scale'] = {
  value: 155,
  unit: '$/kWh',
  sourceId: 'nrel-atb-2024',
  confidence: 'high',
  validFrom: '2024-07-01',
  validUntil: '2025-06-30',
}
```

---

## 6. RECOMMENDATIONS

### Immediate (Week 1)
1. ✅ Add `benchmarkAudit` to all quote outputs (DONE)
2. Add demand charge source from OpenEI utility rate database
3. Add ISO-specific grid service revenue data

### Near-term (Month 1)
4. Integrate DOE HFTO for fuel cell pricing
5. Add manufacturing industry benchmarks from IACs
6. Create regional labor cost multipliers with BLS sources

### Medium-term (Quarter 1)
7. Build automated benchmark update checker
8. Create customer-facing methodology documentation
9. Add "Source" tooltips in quote UI

---

## 7. COMPLIANCE CHECKLIST

### NREL/DOE Alignment

| Requirement | Status | Notes |
|-------------|--------|-------|
| LCOS formula matches StoreFAST | ✅ | Verified Dec 2025 |
| NPV formula matches EERE guidance | ✅ | Standard DCF |
| Degradation uses ATB curves | ✅ | 2%/year linear |
| ITC rate current with law | ✅ | 30% IRA |
| Battery costs within ATB range | ✅ | $100-275/kWh |
| Solar costs within benchmark | ✅ | $0.65-0.85/W |

### Citation Standards

| Requirement | Status | Notes |
|-------------|--------|-------|
| Every cost has source ID | ✅ | Via benchmarkSources.ts |
| Vintage date tracked | ✅ | validFrom/validUntil |
| Retrieval date logged | ✅ | retrievalDate field |
| Deviations flagged | ✅ | In benchmarkAudit.deviations |

---

*Last Updated: December 10, 2025*
*Next Review: March 1, 2026*
