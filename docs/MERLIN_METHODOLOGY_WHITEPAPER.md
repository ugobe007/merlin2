# Merlin Platform: Benchmark-Backed BESS Quoting Methodology

**A Technical Whitepaper on Transparent, Auditable Energy Storage Financial Analysis**

---

**Version:** 1.0  
**Date:** December 2025  
**Authors:** Merlin Energy Technologies  
**Contact:** methodology@merlin.energy

---

## Abstract

The battery energy storage system (BESS) market lacks standardized, transparent quoting methodologies. Project developers, financiers, and end customers frequently encounter inconsistent pricing, opaque assumptions, and unverifiable financial projections. This whitepaper introduces Merlin's benchmark-backed quoting approach—the first BESS financial analysis platform where every number is traceable to documented, authoritative sources.

**Key Contributions:**
1. Full alignment with NREL ATB 2024 and StoreFAST methodologies
2. Source attribution for every quote line item
3. Automated deviation detection when applied prices differ from benchmarks
4. Audit-ready quote packages for project finance due diligence

---

## 1. Introduction

### 1.1 The Problem

BESS project quotes today suffer from several challenges:

- **Opacity**: Customers cannot verify how costs and savings were calculated
- **Inconsistency**: Different vendors use different assumptions without disclosure
- **Due Diligence Friction**: Financiers must independently verify every assumption
- **Trust Gap**: Sophisticated buyers question numbers without visible methodology

### 1.2 Our Solution

Merlin introduces **benchmark-backed quoting**:

> Every number in a Merlin quote is traceable to a documented, authoritative source.

This means:
- Equipment costs cite NREL, DOE, or industry benchmarks
- Financial formulas align with NREL StoreFAST methodology
- Deviations from benchmarks are automatically flagged with explanations
- Quote outputs include full audit metadata

---

## 2. Authoritative Sources

Merlin recognizes a hierarchy of data sources:

### 2.1 Primary Sources (Highest Authority)

| Source | Organization | Application |
|--------|-------------|-------------|
| **Annual Technology Baseline (ATB)** | NREL | Battery, solar, wind capital costs |
| **StoreFAST** | NREL | LCOS methodology, financial modeling |
| **Cost Benchmark Reports** | NREL | Quarterly PV and storage cost updates |
| **ESS Program** | Sandia National Labs | Performance metrics, safety standards |
| **Grid Storage Assessment** | PNNL | Technology comparison, cost projections |

### 2.2 Secondary Sources

| Source | Organization | Application |
|--------|-------------|-------------|
| **Electric Power Monthly** | EIA | Electricity prices, capacity factors |
| **LCOS Analysis** | Lazard | Industry LCOS benchmarking |
| **Energy Storage Outlook** | BloombergNEF | Market trends (public excerpts) |

### 2.3 Certification Standards

| Standard | Organization | Application |
|----------|-------------|-------------|
| **UL 9540/9540A** | UL Solutions | Safety certification |
| **NFPA 855** | NFPA | Installation requirements |
| **IEEE 1547** | IEEE | Interconnection standards |
| **IEC 62619** | IEC | Industrial battery safety |

---

## 3. Pricing Methodology

### 3.1 Battery Energy Storage

**Primary Benchmark:** NREL ATB 2024

| System Type | Price Range | Scenario | Citation |
|-------------|-------------|----------|----------|
| Utility-Scale (≥1 MW) | $100-175/kWh | Conservative-Advanced | ATB Table 6.1 |
| Commercial (100 kW-1 MW) | $200-350/kWh | Moderate | NREL Cost Benchmark Q1 2024 |
| Residential (<100 kW) | $400-600/kWh | Moderate | NREL Cost Benchmark Q1 2024 |

**Merlin Implementation:**
```
Battery Cost = Total kWh × Price per kWh
Price per kWh = f(system size, chemistry, duration, location)
```

**Regional Adjustments:**
- California: +15% (prevailing wage, permitting)
- Texas: -5% (streamlined permitting)
- Northeast: +10% (labor, space constraints)

### 3.2 Solar PV

**Primary Benchmark:** NREL Cost Benchmark Q1 2024

| System Type | Price | Citation |
|-------------|-------|----------|
| Utility-Scale (>5 MW) | $0.65/W | Ground-mount |
| Commercial (200 kW-2 MW) | $0.85/W | Rooftop |
| Residential | $2.50/W | Fully installed |

### 3.3 Balance of System

| Component | Cost Basis | Source |
|-----------|------------|--------|
| Inverter | $80-120/kW | NREL ATB 2024 |
| Transformer | $50,000/MVA | Industry standard |
| Installation (BOS) | 15% of equipment | NREL benchmark |
| EPC Margin | 18% of equipment | NREL benchmark |
| Contingency | 5% of total | StoreFAST |

---

## 4. Financial Methodology

### 4.1 Levelized Cost of Storage (LCOS)

**Formula (NREL StoreFAST aligned):**

```
LCOS = (CAPEX + NPV(O&M) + NPV(Charging)) / NPV(Discharged Energy)
```

**Merlin Implementation:**

| Variable | Value | Source |
|----------|-------|--------|
| Discount Rate | 8% | StoreFAST WACC |
| Project Life | 25 years | ATB standard |
| Degradation | 2%/year | ATB Moderate |
| Round-Trip Efficiency | 85% | ATB LFP |
| O&M | 2.5% of CAPEX | NREL benchmark |

### 4.2 Net Present Value (NPV)

**Formula:**
```
NPV = -I₀ + Σ(t=1 to n) [CF_t × (1-d)^(t-1) × (1+e)^(t-1) / (1+r)^t]
```

Where:
- I₀ = Initial investment (after ITC)
- CF_t = Annual cash flow (savings - O&M)
- d = Annual degradation rate (2%)
- e = Price escalation rate (2%)
- r = Discount rate (8%)
- n = Project lifetime (25 years)

### 4.3 Value Stack

Annual savings comprise multiple revenue streams:

| Component | Calculation | Typical Value |
|-----------|-------------|---------------|
| Peak Shaving | Energy × Days × Price Spread | $50-150/kWh-year |
| Demand Charge Reduction | Peak kW × 12 × Rate | $100-250/kW-year |
| Grid Services | Capacity × Market Rate | $20-50/kW-year |

---

## 5. Quote Audit System

### 5.1 Benchmark Audit Metadata

Every Merlin quote includes:

```json
{
  "benchmarkAudit": {
    "version": "1.0.0",
    "methodology": "NREL StoreFAST + Lazard LCOS aligned",
    "sources": [
      {
        "component": "Battery Energy Storage",
        "benchmarkId": "bess-lfp-utility-scale",
        "value": 155,
        "unit": "$/kWh",
        "source": "NREL Annual Technology Baseline 2024",
        "vintage": "2024",
        "citation": "NREL ATB 2024, LFP 4-hour Moderate scenario"
      }
    ],
    "assumptions": {
      "discountRate": 0.08,
      "projectLifeYears": 25,
      "degradationRate": 0.025,
      "itcRate": 0.30
    },
    "deviations": []
  }
}
```

### 5.2 Deviation Detection

When applied prices differ from benchmarks by >15%, Merlin flags:

```json
{
  "deviations": [
    {
      "lineItem": "Battery pack $/kWh",
      "benchmarkValue": 155,
      "appliedValue": 275,
      "reason": "Commercial-scale pricing (C&I systems <1 MW)"
    }
  ]
}
```

### 5.3 Export Formats

| Format | Use Case | Contents |
|--------|----------|----------|
| PDF | Customer presentation | Summary + key sources |
| Word | Proposal document | Detailed + methodology |
| Excel | Financial modeling | All calculations |
| JSON | API integration | Full audit metadata |

---

## 6. Validation & Compliance

### 6.1 Internal Validation

All calculations validated against:
- NREL StoreFAST model outputs
- Lazard LCOS v9.0 benchmarks
- Published project case studies

### 6.2 External Review Path

Merlin seeks methodology validation from:
- **NREL** - StoreFAST/ATB alignment confirmation
- **Sandia National Labs** - ESS cost-benefit framework review
- **NABCEP** - Potential certification partnership

---

## 7. Competitive Differentiation

| Feature | Merlin | Competitors |
|---------|--------|-------------|
| Source attribution | ✅ Every line item | ❌ Opaque |
| NREL alignment | ✅ Documented | ❓ Claimed |
| Deviation flagging | ✅ Automatic | ❌ None |
| Audit metadata | ✅ JSON export | ❌ None |
| Methodology docs | ✅ Public | ❌ Proprietary |

**Tagline:** *"Ask competitors where their numbers come from."*

---

## 8. Limitations & Future Work

### 8.1 Current Limitations

1. **ISO-Specific Revenue**: Grid service revenue uses regional estimates, not real-time ISO data
2. **Augmentation**: Long-term projects (>20 years) do not model battery augmentation
3. **IRR Precision**: Uses simplified calculation, not iterative solver

### 8.2 Roadmap

- Q1 2026: ISO API integration (CAISO, PJM, ERCOT)
- Q2 2026: Augmentation modeling for 25+ year projects
- Q3 2026: Monte Carlo risk analysis
- Q4 2026: Third-party methodology certification

---

## 9. Conclusion

Merlin's benchmark-backed quoting methodology represents a significant advancement in BESS project financial analysis transparency. By aligning with NREL and DOE methodologies, attributing every cost to documented sources, and automatically detecting deviations, Merlin enables:

- **Developers**: Confident, defensible project economics
- **Financiers**: Reduced due diligence burden
- **Customers**: Trust through transparency
- **Industry**: A potential standard for BESS quoting

We invite methodology review and feedback from NREL, national laboratories, and industry stakeholders.

---

## References

1. NREL. (2024). *Annual Technology Baseline 2024*. https://atb.nrel.gov/
2. NREL. (2024). *StoreFAST: Storage Financial Analysis Scenario Tool*. https://www.nrel.gov/analysis/storefast.html
3. NREL. (2024). *U.S. Solar Photovoltaic System and Energy Storage Cost Benchmarks Q1 2024*. NREL/TP-7A40-88465.
4. Sandia National Laboratories. (2015). *Protocol for Uniformly Measuring and Expressing the Performance of Energy Storage Systems*. SAND2015-1002.
5. Lazard. (2024). *Lazard's Levelized Cost of Storage Analysis—Version 9.0*.
6. DOE/EPRI. (2013). *Electricity Energy Storage Technology Options*.

---

## Contact

**Methodology Inquiries:** methodology@merlin.energy  
**Validation Partnerships:** partnerships@merlin.energy  
**General Information:** https://merlin.energy

---

*© 2025 Merlin Energy Technologies. This methodology document may be shared freely with attribution.*
