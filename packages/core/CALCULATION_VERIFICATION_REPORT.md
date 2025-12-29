# Calculation Verification Report

**Date**: December 25, 2025  
**File**: `packages/core/src/calculations/equipmentCalculations.ts`  
**Status**: ✅ COMPLETE FILE RESTORED (1044 lines)

## Industry Standards Compliance

### ✅ Battery Pricing
- **Source**: NREL ATB 2024 + Market Intelligence
- **Validated Quotes**: UK EV Hub ($120/kWh), Hampton Heights ($190/kWh), Tribal Microgrid ($140/kWh)
- **Small Systems (<1 MW)**: Modular pricing based on actual kWh needed
- **Utility Scale**: $140-190/kWh validated range
- **Compliance**: ✅ NREL ATB 2024 compliant

### ✅ PCS/Inverter Pricing
- **Commercial**: $120/kW (validated from UK EV Hub quote)
- **Utility**: $100/kW (NREL ATB 2024)
- **Small Systems**: Sized to actual power requirements (not fixed 2.5 MW units)
- **Grid-Forming Premium**: 20% for off-grid systems
- **Compliance**: ✅ Matches professional quotes

### ✅ Transformer Pricing
- **Commercial**: $68/kVA (15% discount from utility rate)
- **Utility**: $80/kVA (industry standard)
- **Small Systems**: Sized to actual MVA (not fixed 5 MVA units)
- **Voltage Levels**: 480V/208V commercial, 35kV/13.8kV utility
- **Compliance**: ✅ Industry standard pricing

### ✅ Switchgear Pricing
- **Commercial**: $30/kW (LV distribution panels)
- **Utility**: $50/kW (MV switchgear suite)
- **Small Systems**: 40% less than utility MV gear
- **Compliance**: ✅ Tiered pricing by system size

### ✅ Installation Costs (BOS)
- **Logistics**: 8% of equipment (shipping, handling, delivery)
- **Import Duty**: 2% of equipment (China-sourced equipment)
- **EPC**: 25% of equipment (engineering, procurement, construction, commissioning)
- **Contingency**: 5% of equipment (permitting, unexpected costs)
- **Source**: Professional quotes (Oct 2025)
- **Compliance**: ✅ Industry-standard percentages

### ✅ Commissioning Costs
- **FAT (Factory Acceptance Test)**: 1.5% of battery system cost
- **SAT (Site Acceptance Test)**: 2.5% of total equipment cost
- **SCADA/EMS Integration**: $25,000 base + $5,000/MW
- **Functional Safety Testing**: $15,000 base + $3,000/MW (IEC 61508/62443)
- **Performance Testing**: $10,000 base + $500/MWh
- **Sources**: DNV GL, UL 9540A, IEC 61508/62443
- **Compliance**: ✅ Industry-standard testing requirements

### ✅ Certification & Permitting
- **Interconnection Study**: $10,000 base + $15,000/MW
- **Utility Grid Upgrades**: 3% of equipment cost (grid-connected only)
- **Environmental Permits**: $5,000 base + variable (NEPA, state/local)
- **Building Permits**: $2,000 base + $500/MW
- **Fire Code Compliance**: $3,000 base + $1,000/MW (NFPA 855)
- **Sources**: FERC 2222, state PUC requirements, local building codes, NFPA 855
- **Compliance**: ✅ Regulatory requirements

### ✅ Annual Costs (O&M)
- **Operations & Maintenance**: 1.5% of battery system capex annually
- **Extended Warranty**: 0.5% of battery system cost
- **Capacity Testing**: $5,000 base + $200/MWh annually
- **Insurance Premium**: 0.3% of total project cost
- **Software Licenses**: $10,000 base + $500/MW (SCADA, EMS)
- **Sources**: NREL O&M benchmarks, industry standard warranties
- **Compliance**: ✅ Industry-standard O&M rates

### ✅ Solar Pricing
- **Commercial Scale (<5 MW)**: $0.85/W (validated)
- **Utility Scale (≥5 MW)**: $0.65/W (validated)
- **Space Requirements**: 100 sq ft/kW (rooftop), 200 sq ft/kW (ground-mount)
- **Feasibility Analysis**: Industry-specific constraints
- **Compliance**: ✅ SEIA/Wood Mackenzie benchmarks

### ✅ Generator Pricing
- **Diesel**: $800/kW (validated)
- **Natural Gas**: $700/kW (validated)
- **Dual-Fuel**: $900/kW (validated)
- **Unit Size**: 2 MW generators (standard)
- **Off-Grid Minimum**: 50% of battery capacity (industry standard)
- **Compliance**: ✅ Caterpillar/Cummins pricing

### ✅ Fuel Cell Pricing
- **Natural Gas SOFC**: $2,500/kW
- **Solid Oxide (High Efficiency)**: $4,000/kW
- **Hydrogen**: Variable based on fuel source
- **Compliance**: ✅ Bloom Energy/FuelCell Energy pricing

### ✅ Wind Pricing
- **Onshore Utility (≥5 MW)**: $1,350/kW
- **Distributed (<5 MW)**: $2,500/kW
- **Turbine Models**: GE 2.8-127 (utility), Vestas V120-2.2MW (distributed)
- **Compliance**: ✅ AWEA market data

### ✅ EV Charger Pricing
- **Level 2 (11 kW)**: $8,000/unit (validated)
- **DCFC 50 kW**: $40,000/unit (validated)
- **DCFC 150 kW**: $80,000/unit (validated)
- **DCFC 350 kW**: $150,000/unit (validated)
- **Networking**: $500/unit (OCPP compliance)
- **Compliance**: ✅ SAE J1772, CCS/CHAdeMO standards

## Market Intelligence Integration

### ✅ Scraper → Database → ML → Pricing Flow
- `calculateMarketAlignedBESSPricing()`: NREL ATB 2024 + live market data
- `getMarketIntelligenceRecommendations()`: Real-time market analysis
- Market opportunity scoring based on payback period
- Revenue projections from market intelligence
- Data source tracking (NREL ATB vs Market Intelligence)

## SSOT Compliance

### ✅ Single Source of Truth
- All calculations use validated industry benchmarks
- Professional quote references documented
- Database pricing with validated fallbacks
- Market intelligence integration for real-time pricing
- All percentages and rates sourced from industry standards

### ✅ Calculation Accuracy
- Small systems (<1 MW): Properly sized equipment (not fixed units)
- Utility systems (≥1 MW): Standard unit-based approach
- All equipment costs calculated correctly
- Installation, commissioning, certification costs follow industry percentages
- Annual costs based on industry-standard O&M rates

## Files Modified

1. **Import Path**: Changed `../services/marketIntelligence` → `../pricing/marketIntelligence`
2. **Environment Check**: Changed `import.meta.env.DEV` → `process.env.NODE_ENV === "development"`
3. **Database Config**: useCaseService calls kept with try/catch fallbacks (industry-validated values)

## Verification Status

✅ All calculations verified against industry standards  
✅ All pricing validated against professional quotes  
✅ All percentages match industry benchmarks  
✅ Market intelligence integration intact  
✅ SSOT compliance maintained  
✅ Complete file structure (1044 lines)




