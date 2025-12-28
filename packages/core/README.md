# @merlin/core

**Core Services Package - SSOT & TrueQuote Compliance**

This package contains the Single Source of Truth (SSOT) for all calculations and TrueQuote validation logic used across all Merlin Energy vertical sites.

## 🎯 Purpose

- **SSOT Compliance**: All calculations go through this package
- **TrueQuote Validation**: Ensures 3% accuracy threshold
- **Market-Driven Pricing**: Integrates with scraper/ML agent for accurate pricing
- **Shared Business Logic**: Consistent calculations across all verticals

## 📦 What's Included

### Calculations (SSOT)
- `calculateQuote()` - Main quote calculation engine
- `calculateFinancialMetrics()` - NPV, IRR, payback, ROI
- `calculateEquipmentBreakdown()` - Equipment costs
- `QuoteEngine` - Orchestrator for all calculations

### Validation (TrueQuote)
- `validateQuote()` - Validates quote against industry benchmarks
- `checkTrueQuoteCompliance()` - Ensures 3% accuracy threshold

### Pricing (Market-Driven)
- `getBatteryPricing()` - Battery pricing (vendor → market → NREL)
- `getSolarPricing()` - Solar pricing
- `getMarketPriceSummary()` - Market intelligence integration

### Power Calculations
- `calculateHotelPower()` - Hotel power requirements
- `calculateCarWashPower()` - Car wash power requirements
- `calculateEVChargingPower()` - EV charging power requirements

## 🔒 TrueQuote Compliance

All quotes generated using this package are:
- ✅ Validated against industry benchmarks
- ✅ Traceable to authoritative sources (NREL, DOE, IEEE)
- ✅ Accurate within 3% of market standards
- ✅ Include full audit trail

## 📊 Market-Driven Pricing Flow

```
Market Scraper → Database → ML Agent → Pricing Service → Quote Engine
     ↓              ↓           ↓            ↓              ↓
  RSS Feeds    equipment_   Harmonizes   Unified      TrueQuote
  Web Sources  pricing      Pricing      Pricing      Validated
```

## 🚀 Usage

```typescript
import { calculateQuote, validateQuote } from '@merlin/core';

// Generate quote (SSOT)
const quote = await calculateQuote({
  storageSizeMW: 1.0,
  durationHours: 4,
  location: 'California',
  electricityRate: 0.20,
  useCase: 'car-wash'
});

// Validate quote (TrueQuote)
const validation = await validateQuote(quote);
if (!validation.isValid) {
  console.error('Quote failed TrueQuote validation:', validation.issues);
}
```

## ⚠️ Important

**DO NOT**:
- Calculate quotes outside this package
- Use hardcoded pricing
- Bypass validation

**DO**:
- Use this package for all calculations
- Validate all quotes before presenting to users
- Report validation failures to admin

## 📝 Version

- **1.0.0** - Initial release (December 25, 2025)
- Maintains SSOT and TrueQuote compliance



