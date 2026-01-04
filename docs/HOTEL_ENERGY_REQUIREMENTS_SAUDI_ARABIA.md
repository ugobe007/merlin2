# Hotel Energy Requirements - Saudi Arabia Market Entry Strategy
**Date:** January 2, 2026  
**Source:** Merlin Energy Saudi Arabia Market Entry Strategy Report

## Key Findings

### Market Opportunity
- **Critical "Tipping Point"**: Saudi Arabian hospitality sector is at a critical window for BESS and Solar integration
- **Financial Drivers**: January 2026 diesel price increase (2.20 SAR/liter, 23% YoY) + stable commercial electricity rates (0.32 SAR/kWh) makes Solar + BESS superior to diesel backup
- **Market Drivers**: 
  - Vision 2030 mandates
  - 60,000+ hotel rooms in Riyadh by 2027 (Riyadh World Expo 2030)
  - Green Traveler Demographic (35% of international bookings)
- **Unit Economics**:
  - Customer Breakeven Period: **4.5 - 5.5 years**
  - Annual Customer Savings: **~200,000 SAR** for a 4-star hotel

## Hotel Energy Loads and Configuration

### 1. Energy Consumption Profile

- **Average Load**: **12,000 - 15,000 kWh per room annually**
- **Primary Load**: **HVAC systems** account for **60-70%** of total hotel energy consumption
- **Peak Period**: **12 PM - 5 PM** (critical window for BESS peak shaving)

### 2. System Configuration Requirements

- **Average System Size**: **500 kW - 1.5 MW** per property
- **Typical CAPEX**: **1.2M - 4.5M SAR** per installation
- **Configuration**: **Hybrid Solar + BESS** system
  - **Peak Shaving ROI**: Store cheaper nighttime energy for 12 PM - 5 PM high-rate window
  - **Operational Resilience**: "Always-On" power, eliminating 10-15 second lag time from diesel generators
- **AI Integration**: AI-driven occupancy prediction for Digital Demand Side Management (DSM) can reduce battery sizing by **15%**

### 3. Example Hotel Energy Loads

| Grade  | Example Property    | Rooms | Annual Load | Peak Demand |
|--------|---------------------|-------|-------------|-------------|
| 3-Star | Ibis Riyadh Olaya   | 176   | ~2.3 GWh    | ~450 kW     |
| 4-Star | Holiday Inn Al Qasr | 203   | ~2.8 GWh    | ~600 kW     |
| 5-Star | Ritz-Carlton Riyadh | 492   | ~7.0 GWh    | ~1.5 MW     |

## Calculations

### Energy per Room
- **3-Star (176 rooms)**: 2.3 GWh / 176 = **13,068 kWh/room/year**
- **4-Star (203 rooms)**: 2.8 GWh / 203 = **13,793 kWh/room/year**
- **5-Star (492 rooms)**: 7.0 GWh / 492 = **14,228 kWh/room/year**

**Average**: ~13,700 kWh/room/year (within the 12,000-15,000 range)

### Peak Demand per Room
- **3-Star**: 450 kW / 176 = **2.56 kW/room**
- **4-Star**: 600 kW / 203 = **2.96 kW/room**
- **5-Star**: 1,500 kW / 492 = **3.05 kW/room**

**Average**: ~2.86 kW/room peak demand

### BESS Sizing Ratio
- **3-Star**: 450 kW peak → System size likely ~225-450 kW (0.5-1.0x peak)
- **4-Star**: 600 kW peak → System size likely ~300-600 kW (0.5-1.0x peak)
- **5-Star**: 1,500 kW peak → System size likely ~750-1,500 kW (0.5-1.0x peak)

**Average System Size**: 500 kW - 1.5 MW (matches report)

## Integration Points

1. **Hotel Power Calculations**: Update `calculateHotelPower()` to use 12,000-15,000 kWh/room/year baseline
2. **Peak Demand Calculations**: Use ~2.86 kW/room for peak demand estimation
3. **BESS Sizing**: Target 0.5-1.0x peak demand for system sizing
4. **HVAC Load**: Ensure HVAC accounts for 60-70% of total load in calculations
5. **Peak Hours**: Configure peak shaving for 12 PM - 5 PM window
6. **AI Integration**: Consider 15% reduction in battery sizing with occupancy prediction

## Next Steps

- [ ] Review and update `hotelIndustryProfile.ts` with these benchmarks
- [ ] Update `TrueQuoteEngine.ts` hotel configuration with Saudi Arabia data
- [ ] Add peak hours configuration (12 PM - 5 PM) to hotel calculations
- [ ] Integrate HVAC load percentage (60-70%) into power calculations
- [ ] Consider adding AI occupancy prediction factor (15% reduction) as optional modifier
