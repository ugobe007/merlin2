# 🔮 QUOTING ENGINE ARCHITECTURE & PRICING FLOW

**Last Updated:** December 25, 2025  
**Version:** 2.0.0

---

## 📊 EXECUTIVE SUMMARY

The Merlin quoting engine follows a **layered architecture** with clear separation of concerns:

```
User Request
    ↓
QuoteEngine.generateQuote() [Facade/Orchestrator]
    ↓
unifiedQuoteCalculator.calculateQuote() [Orchestrator]
    ├── equipmentCalculations.calculateEquipmentBreakdown() [Equipment & Pricing]
    └── centralizedCalculations.calculateFinancialMetrics() [Financial Metrics]
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Layer 1: QuoteEngine (Facade Pattern)**

**File:** `src/core/calculations/QuoteEngine.ts`

**Purpose:** Single entry point for all quote generation. Handles caching, versioning, and validation.

**Key Methods:**
- `generateQuote(input, options)` - Main quote generation (5-minute cache TTL)
- `quickEstimate(mw, hours, rate)` - Fast preview for UI sliders (no full breakdown)
- `calculatePower(useCase, data)` - Power requirements by use case

**Features:**
- ✅ Caching (5-minute TTL, max 100 entries)
- ✅ Versioning (tracking engine version in results)
- ✅ Input validation
- ✅ Error handling

---

### **Layer 2: Unified Quote Calculator (Orchestrator)**

**File:** `src/services/unifiedQuoteCalculator.ts`

**Purpose:** Orchestrates equipment pricing and financial calculations.

**Flow:**
1. Determines system category (residential/commercial/utility) based on size
2. Calls `calculateEquipmentBreakdown()` for equipment costs
3. Calls `calculateFinancialMetrics()` for NPV, IRR, payback
4. Builds benchmark audit trail (TrueQuote compliance)
5. Returns complete quote result

**Key Function:**
```typescript
calculateQuote(input: QuoteInput): Promise<QuoteResult>
```

---

### **Layer 3: Equipment Calculations**

**File:** `packages/core/src/calculations/equipmentCalculations.ts`

**Purpose:** Calculates equipment breakdown (batteries, inverters, solar, generators, etc.)

**Key Function:**
```typescript
calculateEquipmentBreakdown(
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  generatorMW,
  industryData?,
  gridConnection,
  location,
  options?
): Promise<EquipmentBreakdown>
```

**What It Calculates:**
- ✅ Battery systems (quantity, unit costs, total costs)
- ✅ Power conversion systems (inverters)
- ✅ Transformers & switchgear
- ✅ Solar PV arrays
- ✅ Wind turbines
- ✅ Generators (diesel, natural gas, dual-fuel)
- ✅ Fuel cells (hydrogen, natural gas, solid oxide)
- ✅ EV charging infrastructure
- ✅ Balance of System (BOS)
- ✅ Installation/EPC costs
- ✅ Commissioning costs
- ✅ Certification costs
- ✅ Annual O&M costs

---

### **Layer 4: Financial Calculations**

**File:** `src/services/centralizedCalculations.ts`

**Purpose:** Single source of truth for ALL financial metrics.

**Key Function:**
```typescript
calculateFinancialMetrics(input: FinancialCalculationInput): Promise<FinancialCalculationResult>
```

**What It Calculates:**
- ✅ NPV (Net Present Value) - 25-year project lifetime
- ✅ IRR (Internal Rate of Return)
- ✅ Simple payback period
- ✅ ROI (Return on Investment)
- ✅ Annual savings (peak shaving, demand charges, grid services)
- ✅ Solar/wind revenue
- ✅ Tax credits (30% ITC)
- ✅ Degradation-adjusted savings

**Data Sources:**
- Database: `calculation_constants` table (primary)
- Database: `calculation_formulas` table (legacy)
- TypeScript fallbacks (if database unavailable)

---

## 💰 PRICING FLOW

### **Current Pricing Architecture (Q4 2024 - Q1 2025)**

The pricing system currently uses a **hybrid approach**:

#### **1. Battery Storage Pricing**

**Primary Source:** `marketIntelligence.ts` → `calculateMarketAlignedBESSPricing()`

**Current Implementation:**
- ✅ Size-based pricing tiers (Q4 2024 market reality)
- ✅ Falls back to market intelligence if database unavailable
- ⚠️ **TODO:** Full integration with `pricingTierService` (database-driven)

**Price Tiers (Q4 2024 - Q1 2025 Market Reality):**
```
Utility Scale:
  - 3-10 MW:     $101-125/kWh   (mid: $113/kWh)
  - 10-50 MW:    $95-115/kWh    (mid: $105/kWh)
  - 50+ MW:      $85-105/kWh    (mid: $95/kWh)

Commercial:
  - 100-500 kWh: $250-400/kWh   (mid: $325/kWh)

Residential:
  - <100 kWh:    $500-800/kWh   (mid: $650/kWh)
```

**Note:** NREL ATB 2024 data lags 12-18 months behind market reality. Merlin uses current market pricing (Q4 2024 - Q1 2025).

#### **2. Solar PV Pricing**

**Source:** Validated quotes + market intelligence

**Current Pricing:**
```
Utility Scale (≥5 MW):  $0.65/W   (validated: Hampton Heights quote)
Commercial (<5 MW):     $1.05/W   (validated: Tribal Microgrid quote)
```

#### **3. Power Electronics Pricing**

**Source:** Database (`pricing_configurations` table) + validated fallbacks

**Current Pricing:**
- Inverters: $120/kW (validated: UK EV Hub quote)
- Transformers: $80/kVA (utility), $50/kVA (commercial)
- Switchgear: $50/kW (utility), $30/kW (commercial)

#### **4. Future: Database-Driven Pricing Tiers**

**Service:** `pricingTierService.ts` (NEW - Dec 25, 2025)

**Status:** ⚠️ **Partially Integrated**

**What's Ready:**
- ✅ Database schema (`pricing_configurations` table with size tiers)
- ✅ Service layer (`pricingTierService.getPricingTier()`)
- ✅ Seed data for BESS & Solar (5 price levels: low, low+, mid, mid+, high)

**What's Pending:**
- ⚠️ Full integration into `equipmentCalculations.ts` (currently uses fallback)
- ⚠️ Esbuild issue: Dynamic imports from `packages/core` to `src/services` fail
- 🔄 **Solution Options:**
  1. Move `pricingTierService` to `packages/core`
  2. Use dependency injection pattern
  3. Create shared service layer

---

## 🔄 CALCULATION FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│  QuoteEngine.generateQuote()                                 │
│  - Input validation                                          │
│  - Cache check (5 min TTL)                                   │
│  - Version tracking                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  unifiedQuoteCalculator.calculateQuote()                     │
│  - Determine system category (residential/commercial/utility)│
│  - Extract input parameters                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────────┐   ┌──────────────────────┐
│ calculateEquipment   │   │ calculateFinancial   │
│ Breakdown()          │   │ Metrics()            │
│                      │   │                      │
│ 1. Battery pricing   │   │ 1. Annual savings    │
│ 2. Solar pricing     │   │ 2. NPV (25 years)    │
│ 3. Inverter pricing  │   │ 3. IRR               │
│ 4. Generator pricing │   │ 4. Payback period    │
│ 5. BOS costs         │   │ 5. ROI               │
│ 6. Installation      │   │ 6. Tax credits       │
│ 7. Commissioning     │   │                      │
│ 8. Certification     │   │                      │
│ 9. O&M costs         │   │                      │
└──────────────────────┘   └──────────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  QuoteResult                                                 │
│  - Equipment breakdown                                       │
│  - Financial metrics                                         │
│  - Benchmark audit trail                                     │
│  - Source attribution                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 KEY CALCULATION METHODS

### **1. Equipment Breakdown**

**Location:** `packages/core/src/calculations/equipmentCalculations.ts`

**Main Function:** `calculateEquipmentBreakdown()`

**Key Logic:**
- Small systems (< 1 MW): Price per kWh (modular approach)
- Large systems (≥ 1 MW): Unit-based pricing (container systems)
- Size-based pricing tiers for batteries
- Location-aware pricing for installation costs
- Grid connection type affects costs (off-grid premium)

### **2. Financial Metrics**

**Location:** `src/services/centralizedCalculations.ts`

**Main Function:** `calculateFinancialMetrics()`

**Key Calculations:**
- **Annual Savings:**
  - Peak shaving (energy arbitrage)
  - Demand charge reduction
  - Grid service revenue
  - Solar/wind revenue

- **Financial Metrics:**
  - NPV: 25-year discounted cash flow (8% WACC default)
  - IRR: Internal rate of return
  - Payback: Net cost / Annual savings
  - ROI: (Total savings - Net cost) / Net cost

- **Tax Credits:**
  - 30% ITC (Investment Tax Credit) on total project cost
  - Applied to batteries when charged >75% from solar

### **3. Power Calculations**

**Location:** `src/services/useCasePowerCalculations.ts`

**Purpose:** Calculate power requirements for specific use cases (hotel, car wash, EV charging, etc.)

**Key Functions:**
- `calculateUseCasePower(useCase, data)`
- `calculateHotelPowerSimple(input)`
- `calculateCarWashPowerSimple(input)`
- `calculateEVChargingPowerSimple(input)`

---

## 🎯 USE CASE-SPECIFIC LOGIC

### **Car Wash Use Case**

**Status:** ⚠️ **Pending your edits** (you mentioned you'll share these)

**Current Implementation:**
- Power calculation: `calculateCarWashPowerSimple()`
- Based on: # of bays, equipment type, hours of operation

**What to Update:**
- Power profiles for different car wash types
- Equipment sizing logic
- Pricing assumptions specific to car washes

---

## 🔍 DEBUGGING & TESTING

### **Testing Quote Generation**

```typescript
import { QuoteEngine } from '@/core/calculations';

// Generate a test quote
const quote = await QuoteEngine.generateQuote({
  storageSizeMW: 0.5,
  durationHours: 4,
  location: 'California',
  electricityRate: 0.20,
  useCase: 'car-wash',
  solarMW: 0.1
});

console.log('Equipment:', quote.equipment);
console.log('Financials:', quote.financials);
console.log('Benchmarks:', quote.benchmarkAudit);
```

### **Cache Statistics**

```typescript
const stats = QuoteEngine.getCacheStats();
console.log('Cache size:', stats.size, '/', stats.maxSize);
```

### **Validation**

```typescript
const validation = QuoteEngine.validateInput(input);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

---

## 📝 NOTES FOR CAR WASH USE CASE UPDATES

When you're ready to share car wash edits, please provide:

1. **Power Calculation Updates:**
   - Different car wash types (self-serve, automatic, full-service)
   - Equipment power requirements
   - Operational hours assumptions

2. **Pricing Adjustments:**
   - Industry-specific equipment pricing
   - Installation considerations
   - Local code requirements

3. **Financial Assumptions:**
   - Peak shaving opportunities
   - Demand charge structures
   - Revenue opportunities

---

## 🔗 RELATED FILES

- **Quote Engine:** `src/core/calculations/QuoteEngine.ts`
- **Unified Calculator:** `src/services/unifiedQuoteCalculator.ts`
- **Equipment Calculations:** `packages/core/src/calculations/equipmentCalculations.ts`
- **Financial Calculations:** `src/services/centralizedCalculations.ts`
- **Market Intelligence:** `src/services/marketIntelligence.ts`
- **Pricing Tiers:** `src/services/pricingTierService.ts`
- **Power Calculations:** `src/services/useCasePowerCalculations.ts`

---

**Ready for your car wash use case edits!** 🚗💧

