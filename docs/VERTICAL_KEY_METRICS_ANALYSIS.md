# KEY METRICS BY ENERGY VERTICAL: Buyer Decision-Making Analysis

> **Document Purpose**: Research compilation of critical metrics buyers/decision-makers care about for each energy vertical. Includes gap analysis between what Merlin currently calculates vs. what the market needs.
>
> **Last Updated**: December 3, 2025
> **Author**: Merlin Development Team

---

## Table of Contents
1. [EV Charging](#1-ev-charging)
2. [Solar PV](#2-solar-pv)
3. [Wind](#3-wind)
4. [BESS (Battery Energy Storage)](#4-bess-battery-energy-storage)
5. [Microgrid](#5-microgrid)
6. [Power Generation](#6-power-generation)
7. [Gap Analysis Summary](#gap-analysis-summary)
8. [Implementation Priorities](#implementation-priorities)

---

## 1. EV Charging

**Buyer Personas**: Fleet operators, real estate developers, hospitality chains, retail property managers, CPO (Charge Point Operators)

### Top 5 Metrics Buyers Ask FIRST

| Rank | Metric | Description | Why It Matters |
|------|--------|-------------|----------------|
| 1 | **TCO (Total Cost of Ownership)** | Hardware + Installation + Make-ready + Networking + Maintenance | Determines real investment vs. just hardware cost |
| 2 | **Revenue per Port/Month** | Average monthly revenue per charging port | Key profitability indicator for operators |
| 3 | **Utilization Rate (%)** | % of time chargers are actively dispensing power | Determines ROI velocity - underutilized = money lost |
| 4 | **Peak Demand Management** | How BESS reduces demand charges from charger load | Can be 30-50% of operating costs without management |
| 5 | **Payback Period** | Years until investment recovered | Most common C-suite approval metric |

### Financial Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Simple Payback | 4-8 years (with BESS) | ⭐⭐⭐⭐⭐ |
| IRR | 15-25% (fleet depots) | ⭐⭐⭐⭐ |
| NPV | Positive @ 8% discount | ⭐⭐⭐ |
| $/kWh dispensed | $0.30-0.60 target | ⭐⭐⭐⭐ |
| Demand charge savings | $5-25/kW-month | ⭐⭐⭐⭐⭐ |

### Operational Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Uptime/Availability | >99% target | ⭐⭐⭐⭐⭐ |
| Utilization Rate | 10-40% (varies by location) | ⭐⭐⭐⭐⭐ |
| Sessions per Port/Day | 2-8 depending on type | ⭐⭐⭐⭐ |
| Average Session Duration | L2: 3-4hr, DCFC: 20-40min | ⭐⭐⭐ |
| kWh per Session | 15-40 kWh typical | ⭐⭐⭐ |

### Technical Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Connected Load (kW) | Per site capacity | ⭐⭐⭐⭐⭐ |
| Concurrency Factor | 30-70% typical | ⭐⭐⭐⭐ |
| Peak Demand (kW) | After BESS shaving | ⭐⭐⭐⭐⭐ |
| L2 vs DCFC Mix | Site-specific | ⭐⭐⭐ |
| V2G Capability | Growing importance | ⭐⭐ |

### Environmental Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| CO2 Avoided (tons/year) | ~0.4 kg/kWh vs gasoline | ⭐⭐⭐⭐ |
| Renewable % of Charging | 0-100% | ⭐⭐⭐ |
| Grid Carbon Intensity | Varies by ISO | ⭐⭐ |
| ESG Score Impact | Qualitative | ⭐⭐⭐ |

### Risk Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Network Uptime SLA | 99%+ required | ⭐⭐⭐⭐⭐ |
| Stranded Asset Risk | Fleet conversion timing | ⭐⭐⭐ |
| Technology Obsolescence | 7-10 year equipment life | ⭐⭐⭐ |
| Utility Rate Escalation | 2-5%/year assumption | ⭐⭐⭐ |

### Premium vs Budget Differentiators

| Factor | Premium Solution | Budget Solution |
|--------|-----------------|-----------------|
| Uptime SLA | 99.9% guaranteed | Best-effort |
| V2G/Grid Services | Included + revenue share | Not available |
| BESS Integration | Optimized co-location | Separate systems |
| Load Management | AI-based optimization | Fixed schedules |
| Reporting/Analytics | Real-time dashboards | Monthly exports |

### Often Overlooked But Critical

1. **Make-Ready Costs** - Often 40-60% of total project cost (trenching, transformers, panels)
2. **Networking/OCPP Compliance** - $500-2,000/port for smart charging capability
3. **Demand Charge Stacking** - Multiple DCFC hitting peak simultaneously
4. **ADA Compliance Costs** - Required for public installations
5. **Utility Interconnection Timeline** - Can delay projects 6-18 months

---

## 2. Solar PV

**Buyer Personas**: Commercial & industrial facility managers, CFOs, sustainability officers, REITs, municipalities

### Top 5 Metrics Buyers Ask FIRST

| Rank | Metric | Description | Why It Matters |
|------|--------|-------------|----------------|
| 1 | **LCOE (Levelized Cost of Energy)** | $/kWh over lifetime | Direct comparison to grid electricity |
| 2 | **Simple Payback** | Years to break even | Board approval metric |
| 3 | **First Year Savings** | $ reduction in utility bill | Immediate cash flow impact |
| 4 | **System Size (kW DC)** | Installed capacity | Ties to available space |
| 5 | **Annual Production (kWh)** | Expected energy output | Validates savings projections |

### Financial Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| LCOE | $0.04-0.08/kWh (C&I) | ⭐⭐⭐⭐⭐ |
| Simple Payback | 4-7 years (with ITC) | ⭐⭐⭐⭐⭐ |
| IRR (Unlevered) | 10-20% | ⭐⭐⭐⭐ |
| NPV @ 8% WACC | Positive required | ⭐⭐⭐⭐ |
| 25-Year ROI | 200-400% | ⭐⭐⭐ |
| $/Watt Installed | $1.50-2.50 (C&I) | ⭐⭐⭐⭐ |

### Operational Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Capacity Factor | 15-25% (location dependent) | ⭐⭐⭐⭐ |
| Performance Ratio | 75-85% | ⭐⭐⭐⭐ |
| Availability | >99% | ⭐⭐⭐ |
| Degradation Rate | 0.3-0.5%/year | ⭐⭐⭐⭐ |
| Self-Consumption Rate | 40-90% (varies by load profile) | ⭐⭐⭐⭐ |

### Technical Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| DC/AC Ratio | 1.1-1.3 typical | ⭐⭐⭐ |
| Specific Yield (kWh/kWp) | 1,200-1,800 (US) | ⭐⭐⭐⭐ |
| System Efficiency | 85-95% | ⭐⭐⭐ |
| Roof Load (psf) | 3-5 psf typical | ⭐⭐⭐ |
| Area Required (sq ft/kW) | 70-100 sq ft/kW | ⭐⭐⭐⭐ |

### Environmental Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| CO2 Avoided (tons/year) | ~0.7 tons/MWh (US avg) | ⭐⭐⭐⭐ |
| Renewable Energy Credits (RECs) | $1-50/MWh (varies) | ⭐⭐⭐ |
| Energy Independence % | Varies | ⭐⭐⭐ |
| Green Building Points | LEED/BREEAM points | ⭐⭐⭐ |

### Risk Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Production Guarantee | 90% Year 1, 80% Year 25 | ⭐⭐⭐⭐⭐ |
| Panel Warranty | 25-30 years | ⭐⭐⭐⭐ |
| Inverter Warranty | 10-25 years | ⭐⭐⭐⭐ |
| O&M Contract Terms | 1-3% of CAPEX/year | ⭐⭐⭐ |
| Net Metering Risk | Policy dependent | ⭐⭐⭐⭐ |

### Often Overlooked But Critical

1. **Self-Consumption vs Export** - Export may earn $0.03-0.08/kWh vs $0.12-0.25/kWh self-use
2. **Net Metering Policy Changes** - Many states reducing NEM benefits
3. **Roof Age/Condition** - May need re-roof before solar (add $50K-200K)
4. **Interconnection Costs** - $0-50K+ for utility upgrades
5. **Tax Equity Structure** - ITC basis reduction for grants/rebates

---

## 3. Wind

**Buyer Personas**: Utilities, IPPs (Independent Power Producers), large C&I, agricultural operations, municipalities

### Top 5 Metrics Buyers Ask FIRST

| Rank | Metric | Description | Why It Matters |
|------|--------|-------------|----------------|
| 1 | **LCOE** | $/MWh over project life | Bankability metric |
| 2 | **Capacity Factor** | % of nameplate capacity achieved | Revenue driver |
| 3 | **P50/P90 Energy Production** | Statistical confidence in output | Lender requirement |
| 4 | **Net Capacity Factor** | After wake losses, availability | True performance |
| 5 | **Project IRR (Levered)** | Return with financing | Investment decision |

### Financial Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| LCOE | $25-50/MWh (utility-scale) | ⭐⭐⭐⭐⭐ |
| Levered IRR | 10-15% | ⭐⭐⭐⭐⭐ |
| Unlevered IRR | 7-12% | ⭐⭐⭐⭐ |
| NPV | Positive @ 8% WACC | ⭐⭐⭐⭐ |
| PPA Price | $30-60/MWh | ⭐⭐⭐⭐⭐ |
| $/kW Installed | $1,200-1,600 (onshore) | ⭐⭐⭐⭐ |
| DSCR (Debt Service Coverage) | >1.3x required by banks | ⭐⭐⭐⭐⭐ |

### Operational Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Capacity Factor | 30-50% (site dependent) | ⭐⭐⭐⭐⭐ |
| Availability | >95% technical | ⭐⭐⭐⭐⭐ |
| Wake Losses | 5-15% | ⭐⭐⭐⭐ |
| Curtailment % | 0-10% (grid dependent) | ⭐⭐⭐⭐ |
| Equivalent Full Load Hours | 2,600-4,400 hrs/year | ⭐⭐⭐⭐ |

### Technical Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Hub Height | 80-150m | ⭐⭐⭐ |
| Rotor Diameter | 120-175m | ⭐⭐⭐ |
| Specific Power (W/m²) | 200-350 W/m² | ⭐⭐⭐ |
| Wind Shear Exponent | Site-specific | ⭐⭐⭐ |
| Turbulence Intensity | <18% typical | ⭐⭐⭐ |

### Environmental Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| CO2 Avoided (tons/MWh) | ~0.7-0.9 tons/MWh | ⭐⭐⭐⭐ |
| Bird/Bat Mortality | Species-dependent | ⭐⭐⭐ |
| Noise at Property Line | <45 dBA typically | ⭐⭐⭐ |
| Shadow Flicker Hours | <30 hrs/year | ⭐⭐ |

### Risk Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| P50/P90 Spread | 10-15% | ⭐⭐⭐⭐⭐ |
| Merchant Risk | % uncontracted | ⭐⭐⭐⭐ |
| Curtailment Risk | Grid-dependent | ⭐⭐⭐⭐ |
| Technology Warranty | 2-5 years (OEM) | ⭐⭐⭐⭐ |
| Decommissioning Reserve | $10-50K/MW | ⭐⭐⭐ |

### Often Overlooked But Critical

1. **Transmission Access** - Many wind sites have limited interconnection
2. **Curtailment Clauses** - PPA may require certain curtailment limits
3. **Component Availability** - Supply chain for gearboxes, blades
4. **Ice Loading** - Cold climate sites need de-icing
5. **O&M Escalation** - Post-warranty costs increase 2-4%/year

---

## 4. BESS (Battery Energy Storage)

**Buyer Personas**: Utilities, IPPs, grid operators (ISO/RTO), C&I customers, solar/wind developers

### Top 5 Metrics Buyers Ask FIRST

| Rank | Metric | Description | Why It Matters |
|------|--------|-------------|----------------|
| 1 | **LCOS (Levelized Cost of Storage)** | $/MWh over lifetime | Primary comparison metric |
| 2 | **Round-Trip Efficiency (RTE)** | % energy out vs in | Operating cost driver |
| 3 | **Revenue Stacking Potential** | Combined revenue streams | Determines bankability |
| 4 | **DSCR (Debt Service Coverage)** | Cash flow vs debt service | Lender requirement |
| 5 | **Cycle Life / Warranty** | Guaranteed cycles/years | Risk mitigation |

### Financial Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| LCOS | $100-200/MWh (4-hr) | ⭐⭐⭐⭐⭐ |
| $/kWh Installed | $200-400/kWh (2024) | ⭐⭐⭐⭐⭐ |
| IRR (Levered) | 12-20% | ⭐⭐⭐⭐⭐ |
| IRR (Unlevered) | 8-15% | ⭐⭐⭐⭐ |
| NPV @ 8% WACC | Positive required | ⭐⭐⭐⭐ |
| DSCR | >1.3x (bank requirement) | ⭐⭐⭐⭐⭐ |
| Minimum DSCR | >1.1x (covenant) | ⭐⭐⭐⭐⭐ |
| Simple Payback | 6-12 years | ⭐⭐⭐⭐ |
| MOIC | 1.5-2.5x | ⭐⭐⭐ |

### Operational Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Round-Trip Efficiency | 85-90% | ⭐⭐⭐⭐⭐ |
| Availability | >97% | ⭐⭐⭐⭐⭐ |
| Annual Cycles | 250-500 | ⭐⭐⭐⭐ |
| Depth of Discharge | 80-90% | ⭐⭐⭐⭐ |
| Augmentation Schedule | Year 7-10 typical | ⭐⭐⭐⭐ |
| Capacity Factor | 15-25% (revenue dependent) | ⭐⭐⭐ |

### Technical Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Duration (hours) | 2-4 hrs (most common) | ⭐⭐⭐⭐⭐ |
| Power Capacity (MW) | Project-specific | ⭐⭐⭐⭐⭐ |
| Energy Capacity (MWh) | Power × Duration | ⭐⭐⭐⭐⭐ |
| DC/AC Coupling Ratio | 1.0-1.3 typical | ⭐⭐⭐ |
| Ramp Rate | 1-4 seconds full power | ⭐⭐⭐⭐ |
| Response Time | <200ms (grid services) | ⭐⭐⭐⭐ |

### Environmental Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Lifecycle Carbon (kg CO2/kWh) | 50-100 kg/kWh capacity | ⭐⭐⭐ |
| Renewable Integration % | Varies by project | ⭐⭐⭐ |
| Avoided Peaker Emissions | 0.5-0.8 tons CO2/MWh | ⭐⭐⭐⭐ |
| End-of-Life Recyclability | 90%+ for Li-ion | ⭐⭐⭐ |

### Risk Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Degradation Rate | 2-3%/year | ⭐⭐⭐⭐⭐ |
| Cycle Warranty | 3,500-10,000 cycles | ⭐⭐⭐⭐⭐ |
| Calendar Warranty | 10-20 years | ⭐⭐⭐⭐⭐ |
| Thermal Runaway Risk | Fire suppression required | ⭐⭐⭐⭐ |
| Revenue Certainty | % contracted | ⭐⭐⭐⭐ |

### Revenue Streams (Stacking)

| Revenue Source | Typical Value | Compatibility |
|----------------|---------------|---------------|
| Energy Arbitrage | $30-80/MWh spread | All markets |
| Frequency Regulation | $5,000-15,000/MW-month | CAISO, PJM, ERCOT |
| Spinning Reserve | $1,000-5,000/MW-month | All ISOs |
| Capacity Payments | $30,000-200,000/MW-year | PJM, NYISO, ISO-NE |
| Peak Shaving (C&I) | $10-25/kW-month | All markets |
| Resource Adequacy | $4,000-8,000/MW-month | CAISO |

### Often Overlooked But Critical

1. **Augmentation Costs** - Battery replacement at Year 7-10 ($50-100/kWh)
2. **Interconnection Queue** - 3-5 year waits in many ISOs
3. **HVAC Parasitic Load** - 3-8% of capacity for thermal management
4. **Insurance Costs** - $3-10/kWh-year (rising due to fire incidents)
5. **Revenue Cannibalization** - Too much storage in market depresses prices

---

## 5. Microgrid

**Buyer Personas**: Campus administrators, military bases, island utilities, remote industrial sites, critical facilities

### Top 5 Metrics Buyers Ask FIRST

| Rank | Metric | Description | Why It Matters |
|------|--------|-------------|----------------|
| 1 | **Resilience Duration** | Hours/days of autonomy | Mission-critical metric |
| 2 | **Total Cost of Ownership** | All-in 20-year cost | Budget planning |
| 3 | **Critical Load Coverage** | % of essential loads served | Operational continuity |
| 4 | **Renewable Penetration** | % from clean sources | Sustainability goals |
| 5 | **Simple Payback** | Years to recover investment | Financial approval |

### Financial Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| $/kW Installed | $3,000-8,000/kW (varies by complexity) | ⭐⭐⭐⭐⭐ |
| Simple Payback | 8-15 years | ⭐⭐⭐⭐ |
| IRR | 8-15% | ⭐⭐⭐ |
| NPV | Positive required | ⭐⭐⭐⭐ |
| VoLL (Value of Lost Load) | $10-100/kWh avoided | ⭐⭐⭐⭐⭐ |
| Annual Savings | vs utility-only baseline | ⭐⭐⭐⭐ |

### Operational Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| System Availability | >99.9% (grid-connected) | ⭐⭐⭐⭐⭐ |
| Island Mode Duration | Site-specific requirement | ⭐⭐⭐⭐⭐ |
| Seamless Transfer | <10ms for critical loads | ⭐⭐⭐⭐⭐ |
| Black Start Capability | Required for true microgrid | ⭐⭐⭐⭐ |
| Load Following Accuracy | <5% deviation | ⭐⭐⭐ |

### Technical Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Critical Load (kW) | Site-specific | ⭐⭐⭐⭐⭐ |
| Non-Critical Load (kW) | Can be shed in island mode | ⭐⭐⭐⭐ |
| Generation Mix | Solar/Wind/BESS/Generator | ⭐⭐⭐⭐ |
| Storage Duration | 4-24 hours typical | ⭐⭐⭐⭐⭐ |
| Spinning Reserve % | 10-20% of critical load | ⭐⭐⭐⭐ |

### Environmental Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Renewable % | 30-100% (site dependent) | ⭐⭐⭐⭐ |
| CO2 Reduction % | vs utility baseline | ⭐⭐⭐⭐ |
| Fuel Consumption (gal/yr) | For hybrid microgrids | ⭐⭐⭐ |
| Net Zero Achievement | Y/N | ⭐⭐⭐ |

### Risk Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| SAIDI Impact | Reduced outage duration | ⭐⭐⭐⭐⭐ |
| SAIFI Impact | Reduced outage frequency | ⭐⭐⭐⭐⭐ |
| N-1 Redundancy | Critical for resilience | ⭐⭐⭐⭐ |
| Single Point of Failure | None for critical loads | ⭐⭐⭐⭐ |
| Cybersecurity Level | DOE/NERC compliance | ⭐⭐⭐⭐ |

### Often Overlooked But Critical

1. **Controller Complexity** - Microgrid controller is the "brain" - $200K-1M+
2. **Protection Coordination** - Must work in both grid-tied and island mode
3. **Utility Interconnection Agreement** - Complex negotiations required
4. **Operator Training** - Staff must understand multi-mode operation
5. **Maintenance Contracts** - Generator, BESS, solar all need different O&M

---

## 6. Power Generation (Data Centers, Hospitals, Manufacturing)

**Buyer Personas**: Data center operators, hospital facility managers, manufacturing plant engineers, colocation providers

### Top 5 Metrics Buyers Ask FIRST

| Rank | Metric | Description | Why It Matters |
|------|--------|-------------|----------------|
| 1 | **Uptime/Availability** | % of time power available | SLA compliance (99.999% for data centers) |
| 2 | **PUE (Power Usage Effectiveness)** | Total facility power / IT load | Efficiency benchmark (data centers) |
| 3 | **N+1 / 2N Redundancy** | Backup capacity level | Risk mitigation |
| 4 | **UPS Runtime** | Minutes/hours of battery backup | Bridge to generator startup |
| 5 | **$/kW for Critical Load** | Cost per kW of protected power | Budget planning |

### Financial Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| $/kW Protected | $5,000-15,000/kW | ⭐⭐⭐⭐⭐ |
| Cost of Downtime | $5,000-500,000/hour | ⭐⭐⭐⭐⭐ |
| Annual Energy Cost | $/kWh × consumption | ⭐⭐⭐⭐ |
| O&M as % of CAPEX | 2-5%/year | ⭐⭐⭐⭐ |
| Fuel Cost (backup) | $/gallon × consumption | ⭐⭐⭐ |

### Operational Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| System Availability | 99.99-99.9999% | ⭐⭐⭐⭐⭐ |
| PUE | 1.2-1.6 (data centers) | ⭐⭐⭐⭐⭐ |
| Transfer Time | <10ms (UPS to utility) | ⭐⭐⭐⭐⭐ |
| Generator Start Time | <10 seconds | ⭐⭐⭐⭐ |
| Battery Runtime | 10-30 minutes typical | ⭐⭐⭐⭐ |

### Technical Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Critical Load (MW) | Site-specific | ⭐⭐⭐⭐⭐ |
| Redundancy Level | N+1, 2N, 2(N+1) | ⭐⭐⭐⭐⭐ |
| UPS Topology | Double-conversion online | ⭐⭐⭐⭐ |
| Power Factor | >0.95 | ⭐⭐⭐ |
| Harmonic Distortion | <5% THD | ⭐⭐⭐ |

### Environmental Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| Scope 2 Emissions | tCO2e/year | ⭐⭐⭐⭐ |
| Renewable % | 0-100% (PPAs, on-site) | ⭐⭐⭐⭐ |
| WUE (Water Usage Effectiveness) | L/kWh | ⭐⭐⭐ (data centers) |
| CUE (Carbon Usage Effectiveness) | kgCO2e/kWh | ⭐⭐⭐⭐ |

### Risk Metrics

| Metric | Industry Benchmark | Buyer Priority |
|--------|-------------------|----------------|
| MTBF (Mean Time Between Failures) | 100,000+ hours | ⭐⭐⭐⭐ |
| MTTR (Mean Time To Repair) | <4 hours | ⭐⭐⭐⭐ |
| Single Points of Failure | Zero for Tier IV | ⭐⭐⭐⭐⭐ |
| Concurrent Maintainability | Required for Tier III+ | ⭐⭐⭐⭐ |
| Fault Tolerance | Required for Tier IV | ⭐⭐⭐⭐⭐ |

### Often Overlooked But Critical

1. **Utility Feed Reliability** - Dual feeds from different substations
2. **Fuel Storage Regulations** - EPA/local limits on diesel storage
3. **Generator Load Bank Testing** - Monthly testing required
4. **Battery Replacement Cycles** - VRLA: 3-5 years, Li-ion: 10-15 years
5. **Flywheel vs Battery UPS** - Different cost/performance tradeoffs

---

## Gap Analysis Summary

### What Merlin Currently Calculates (from codebase review)

#### ✅ STRONG - Well Implemented

| Metric | Service/File | Status |
|--------|--------------|--------|
| Simple Payback | `centralizedCalculations.ts` | ✅ Full implementation |
| NPV | `centralizedCalculations.ts` | ✅ With degradation |
| IRR (Unlevered) | `centralizedCalculations.ts` | ✅ Basic implementation |
| ROI (10-year, 25-year) | `centralizedCalculations.ts` | ✅ Full implementation |
| Equipment Costs | `equipmentCalculations.ts` | ✅ Detailed breakdown |
| Battery Degradation | `centralizedCalculations.ts` | ✅ 2%/year standard |
| Tax Credits (ITC) | `centralizedCalculations.ts` | ✅ 30% federal |
| MACRS Depreciation | `professionalFinancialModel.ts` | ✅ 5-year schedule |
| DSCR | `professionalFinancialModel.ts` | ✅ Bank-ready |
| Levered/Unlevered IRR | `professionalFinancialModel.ts` | ✅ Full implementation |
| 3-Statement Model | `professionalFinancialModel.ts` | ✅ Income, Balance, Cash Flow |
| Revenue Stacking | `professionalFinancialModel.ts` | ✅ 6 revenue streams |
| LCOS | `professionalFinancialModel.ts` | ✅ NREL/Sandia standard |
| EV Charger Costs | `evChargingCalculations.ts` | ✅ L2, DCFC, HPC |
| Concurrency Factor | `evChargingCalculations.ts` | ✅ Default 70% |
| Grid Services Revenue | `evChargingCalculations.ts` | ✅ DR, Freq Reg, Peak Shave |
| V2G Calculations | `evChargingCalculations.ts` | ✅ Revenue + degradation |
| Sensitivity Analysis | `centralizedCalculations.ts` | ✅ Monte Carlo |
| Risk Analysis | `centralizedCalculations.ts` | ✅ VaR, scenarios |

#### ⚠️ PARTIAL - Needs Enhancement

| Metric | Current State | Gap |
|--------|--------------|-----|
| Round-Trip Efficiency | 85% hardcoded | Allow user input in wizard |
| Capacity Factor | Calculated but not displayed | Add to results UI |
| Annual Cycles | 365 default | Should vary by use case |
| Degradation Profile | 2%/year fixed | Add temperature-adjusted degradation |
| CO2 Avoided | In EV portfolio only | Missing from BESS/Solar quotes |
| LCOE (Solar) | Not implemented | Critical for solar buyers |
| Availability/Uptime | Not calculated | Critical for all verticals |
| VoLL (Value of Lost Load) | Not calculated | Critical for microgrid/resilience |

#### ❌ MISSING - Critical Gaps

| Metric | Priority | Vertical Impact |
|--------|----------|-----------------|
| **LCOE (Levelized Cost of Energy)** | 🔴 HIGH | Solar, Wind |
| **Utilization Rate** | 🔴 HIGH | EV Charging |
| **Revenue per Port** | 🔴 HIGH | EV Charging |
| **Sessions per Day** | 🟡 MEDIUM | EV Charging |
| **kWh Dispensed/Month** | 🟡 MEDIUM | EV Charging |
| **Uptime/Availability SLA** | 🔴 HIGH | All verticals |
| **P50/P90 Production** | 🔴 HIGH | Wind, Solar |
| **Specific Yield (kWh/kWp)** | 🟡 MEDIUM | Solar |
| **Performance Ratio** | 🟡 MEDIUM | Solar |
| **PUE (Power Usage Effectiveness)** | 🟡 MEDIUM | Data Centers |
| **N+1 Redundancy Cost** | 🟡 MEDIUM | Critical Facilities |
| **Island Mode Duration** | 🔴 HIGH | Microgrid |
| **CO2 Avoided (tons/year)** | 🔴 HIGH | All verticals (ESG) |
| **Renewable %** | 🟡 MEDIUM | All verticals (ESG) |
| **Make-Ready Costs** | 🟡 MEDIUM | EV Charging |
| **Interconnection Costs** | 🟡 MEDIUM | All utility-scale |
| **Augmentation Schedule/Costs** | 🔴 HIGH | BESS |
| **Curtailment Risk** | 🟡 MEDIUM | Wind, Solar+BESS |
| **Merchant Risk Exposure** | 🟡 MEDIUM | All utility-scale |

---

## Implementation Priorities

### Phase 1: Critical Gaps (High ROI, High Buyer Demand)

| Priority | Metric | Effort | Impact |
|----------|--------|--------|--------|
| 1 | **CO2 Avoided Calculator** | LOW | All verticals, ESG requirement |
| 2 | **LCOE Calculator (Solar)** | MEDIUM | Solar vertical critical |
| 3 | **Utilization Rate (EV)** | LOW | EV charging profitability |
| 4 | **Availability/Uptime Display** | LOW | All quotes, add field |
| 5 | **Augmentation Costs (BESS)** | MEDIUM | Bank/investor requirement |

### Phase 2: Vertical-Specific Enhancements

| Priority | Metric | Vertical |
|----------|--------|----------|
| 6 | Revenue per Port Calculator | EV Charging |
| 7 | P50/P90 Production Estimates | Wind/Solar |
| 8 | Island Mode Duration Calculator | Microgrid |
| 9 | VoLL (Value of Lost Load) | Critical Facilities |
| 10 | PUE Impact Calculator | Data Centers |

### Phase 3: Advanced Analytics

| Priority | Metric | Complexity |
|----------|--------|------------|
| 11 | Merchant Revenue Risk Model | HIGH |
| 12 | Weather-Correlated Degradation | HIGH |
| 13 | Dynamic LCOE with Learning Curves | HIGH |
| 14 | Multi-Site Portfolio Optimization | HIGH |
| 15 | Real-Time Grid Price Integration | HIGH |

---

## Quick Reference: Metric Definitions

| Metric | Definition | Formula |
|--------|------------|---------|
| **LCOE** | Levelized Cost of Energy | NPV(Costs) / NPV(Energy) |
| **LCOS** | Levelized Cost of Storage | NPV(CAPEX + OPEX + Charging) / NPV(Energy Discharged) |
| **RTE** | Round-Trip Efficiency | Energy Out / Energy In |
| **DSCR** | Debt Service Coverage Ratio | EBITDA / (Principal + Interest) |
| **IRR** | Internal Rate of Return | Discount rate where NPV = 0 |
| **MOIC** | Multiple on Invested Capital | Total Returns / Equity Investment |
| **VoLL** | Value of Lost Load | Cost of unserved energy |
| **PUE** | Power Usage Effectiveness | Total Facility Power / IT Equipment Power |
| **P50** | 50th Percentile Production | 50% chance of exceeding this output |
| **P90** | 90th Percentile Production | 90% chance of exceeding this output |

---

## Appendix: Data Sources

### Industry Benchmarks
- NREL ATB 2024 (Annual Technology Baseline)
- Lazard LCOE Analysis 2024
- BloombergNEF Energy Storage Outlook
- Wood Mackenzie Energy Storage Tracker
- EIA Annual Energy Outlook

### EV Charging Specific
- Atlas Public Policy - EV Charging Infrastructure
- AFDC (Alternative Fuels Data Center)
- ChargePoint/EVgo Annual Reports
- Rocky Mountain Institute - EV Economics

### Solar/Wind Specific
- Solar Energy Industries Association (SEIA)
- American Clean Power Association
- Lawrence Berkeley National Lab - Utility-Scale Solar
- NREL Wind Vision Study

---

*This document should be updated quarterly as industry benchmarks evolve and as Merlin adds new calculation capabilities.*
