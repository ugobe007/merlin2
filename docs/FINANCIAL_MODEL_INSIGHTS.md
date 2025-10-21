# Financial Model Insights for BESS Projects

## Overview
Based on the eFinancialModels Solar + BESS template analysis, here are key financial modeling features we should consider enhancing in Merlin.

## Current Merlin Capabilities ✅
- Basic CapEx calculations (Battery, PCS, BOS, EPC)
- Simple ROI calculation
- Component cost breakdown
- Tariff calculations
- Live ComEd pricing integration

## Professional BESS Financial Model Features

### 1. **Revenue Streams** 🎯
- [ ] Electricity cost savings (peak shaving)
- [ ] Electricity sales at market rates or PPA
- [ ] Renewable Energy Certificates (RECs)
- [ ] Battery reserve capacity sales (emergency power)
- [ ] Demand charge reduction benefits

### 2. **Advanced Battery Modeling** 🔋
- [ ] Battery capacity degradation over time (8 different methods)
- [ ] Equivalent Full Cycles (EFC) tracking
- [ ] Battery replacement scheduling
- [ ] Minimum/maximum load constraints (e.g., only discharge to 20%)
- [ ] Multiple battery phases (initial + expansions)

### 3. **Operational Strategies** ⚡
- [ ] Charging strategies:
  - Excess solar only
  - All solar production
  - Grid arbitrage (buy low, sell high)
- [ ] Hourly charge/discharge scheduling
- [ ] Peak shaving optimization
- [ ] Time-of-use rate optimization

### 4. **Financial Metrics** 📊
Currently have:
- NPV (Net Present Value)
- IRR (Internal Rate of Return)
- Simple Payback Period

Should add:
- [ ] Levered vs. Unlevered IRR
- [ ] Debt Service Coverage Ratio (DSCR)
- [ ] Modified Internal Rate of Return (MIRR)
- [ ] Profitability Index
- [ ] Discounted Payback Period

### 5. **Project Timeline** 📅
- [ ] 40-year forecast (currently basic)
- [ ] Monthly granularity
- [ ] Multi-phase deployment modeling
- [ ] O&M cost escalation over time
- [ ] Insurance and financing costs

### 6. **Pricing Models** 💰
Currently have:
- Live ComEd hourly pricing ✅
- Basic utility rate assumptions

Should add:
- [ ] Hourly price profiles (duck curve modeling)
- [ ] Seasonal price variations
- [ ] Peak/off-peak/super-off-peak periods
- [ ] Price escalation forecasts
- [ ] Purchase vs. sales price spreads

### 7. **Scenario Analysis** 🔬
- [ ] Best/base/worst case scenarios
- [ ] Sensitivity tables (What-if analysis)
- [ ] Monte Carlo simulation
- [ ] Stress testing for key variables:
  - Battery costs
  - Electricity prices
  - Degradation rates
  - Utilization factors

### 8. **Reporting & Presentations** 📑
- [ ] Executive Summary dashboard
- [ ] Investor-ready presentations
- [ ] Cash flow waterfall charts
- [ ] Break-even analysis visualization
- [ ] Project comparison tools

## Integration Priorities

### Phase 1: Essential (Q1 2026)
1. Battery degradation modeling
2. Hourly pricing optimization
3. Advanced ROI metrics (DSCR, levered/unlevered IRR)
4. Revenue streams breakdown

### Phase 2: Professional (Q2 2026)
1. Multi-year monthly forecasts
2. Scenario analysis tools
3. Battery replacement scheduling
4. EFC tracking

### Phase 3: Enterprise (Q3 2026)
1. Monte Carlo simulation
2. Portfolio optimization
3. Custom report generation
4. API integrations for live market data

## Current Strengths of Merlin 💪
- **User-friendly interface** (vs. complex Excel)
- **Live pricing integration** (ComEd API) ✅
- **Quick quote generation**
- **Smart Wizard** for guided configuration
- **Visual appeal** and professional design
- **Export to Word/Excel** for presentations

## Competitive Advantages to Build
1. **Real-time calculations** instead of static spreadsheets
2. **Cloud-based collaboration** vs. email Excel files
3. **Vendor marketplace** integration
4. **Portfolio management** across multiple projects
5. **AI-powered optimization** suggestions

## Resources
- eFinancialModels BESS Template: https://www.efinancialmodels.com/downloads/solar-battery-energy-storage-system-bess-financial-model-622976/
- ComEd Live Pricing API: https://hourlypricing.comed.com/api?type=currenthouraverage&format=json
- Current implementation: Merlin v2.0 at https://merlin2.fly.dev/

---
*Last Updated: October 21, 2025*
*Document: Financial Model Enhancement Roadmap*
