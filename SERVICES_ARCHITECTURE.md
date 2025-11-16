# 🏗️ Merlin2 Services Architecture

**Last Updated:** November 16, 2025  
**Purpose:** Complete reference guide for all services, their responsibilities, and usage patterns

---

## 📊 Service Hierarchy & Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  (React Components, Wizards, Modals, Pages)                 │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  Core Business Logic & Data Processing                      │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  (Supabase Client, Cache, Local Storage)                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Services (Critical - Do Not Break)

### 1. **centralizedCalculations.ts** ⭐ NERVE CENTER
**Purpose:** Single source of truth for all financial calculations  
**Version:** 2.0.0 (includes NPV/IRR)  
**Status:** ✅ Production Ready

**Responsibilities:**
- Financial metrics (Payback, ROI, NPV, IRR, LCOS)
- System sizing calculations
- Revenue/savings projections
- Tax credit calculations

**Key Functions:**
```typescript
calculateFinancialMetrics(input: FinancialCalculationInput): FinancialCalculationResult
getCalculationConstants(): CalculationConstants
```

**When to Use:**
- ✅ ALL financial calculations should use this service
- ✅ Any payback/ROI calculations
- ✅ Revenue projections
- ✅ NPV/IRR analysis

**Migration Status:** 
- ✅ v2.0.0 complete with NPV/IRR
- ⚠️ Some legacy code still using old methods (see deprecation warnings)

---

### 2. **useCaseService.ts** ⭐ DATABASE GATEWAY
**Purpose:** Primary interface to Supabase use case database  
**Status:** ✅ Production Ready

**Responsibilities:**
- Fetch use case templates from database
- Get use case configurations
- Equipment template management
- Industry-specific data retrieval

**Key Functions:**
```typescript
getAllUseCases(): Promise<UseCase[]>
getUseCaseBySlug(slug: string): Promise<UseCase | null>
getEquipmentTemplates(useCaseId: string): Promise<Equipment[]>
```

**When to Use:**
- ✅ Loading industry templates
- ✅ Fetching use case configurations
- ✅ Getting equipment data
- ✅ Industry-specific calculations

**Database Tables:**
- `use_cases` - Industry templates
- `use_case_configurations` - Sizing presets
- `equipment_templates` - Equipment definitions
- `configuration_equipment` - Equipment relationships

---

### 3. **baselineService.ts** ⭐ SIZING ENGINE
**Purpose:** Calculate recommended BESS sizing based on industry/use case  
**Status:** ✅ Production Ready

**Responsibilities:**
- Industry-specific baseline calculations
- EV charging sizing (special case)
- User peak load validation
- Database-driven sizing recommendations

**Key Functions:**
```typescript
calculateBaselineConfiguration(
  templateKey: string,
  scale: number,
  useCaseData?: Record<string, any>
): Promise<BaselineCalculationResult>

calculateEVChargingBaseline(useCaseData: Record<string, any>): BaselineCalculationResult
```

**When to Use:**
- ✅ Initial system sizing (Step 2 of wizard)
- ✅ EV charging calculations
- ✅ Industry template recommendations
- ✅ Validating user inputs

**Caching:**
- Uses `cacheService` with 10-minute TTL
- Cache key format: `baseline:{template}:{scale}:{data}`

---

## 💰 Pricing Services

### 4. **advancedFinancialModeling.ts**
**Purpose:** Advanced financial analysis and DCF modeling  
**Size:** 1,587 lines (consider splitting in future)

**Responsibilities:**
- Debt/equity financing structures
- Sensitivity analysis
- Target IRR pricing
- Contract structures (PPA, Lease, etc.)
- Advanced DCF models

**Key Functions:**
```typescript
calculateDebtService(principal, rate, term): DebtSchedule
performSensitivityAnalysis(params): SensitivityResults
calculateTargetIRRPricing(targetIRR, assumptions): PricingResult
```

**When to Use:**
- ✅ Complex financing scenarios
- ✅ Sensitivity analysis
- ✅ Target return pricing
- ✅ Multi-year projections

**Note:** Currently being migrated to use `centralizedCalculations.ts`

---

### 5. **solarPricingService.ts**
**Purpose:** Solar PV system pricing and sizing  
**Status:** ✅ Production Ready

**Responsibilities:**
- Solar panel pricing (by technology: mono, poly, thin-film)
- Inverter sizing and pricing
- Racking/mounting costs
- Installation labor estimates

**Key Functions:**
```typescript
calculateSolarCost(solarMW, technology): SolarPricingResult
getPanelEfficiency(technology): number
calculateInverterSize(dcCapacity): number
```

**When to Use:**
- ✅ Solar system pricing
- ✅ Technology comparisons
- ✅ Installation cost estimates

---

### 6. **windPricingService.ts**
**Purpose:** Wind turbine pricing and sizing  
**Status:** ✅ Production Ready

**Responsibilities:**
- Wind turbine pricing (by size class)
- Tower costs
- Foundation costs
- Installation estimates

**Key Functions:**
```typescript
calculateWindCost(windMW): WindPricingResult
getTurbineClass(capacity): TurbineClass
estimateFoundationCost(turbineSize): number
```

**When to Use:**
- ✅ Wind system pricing
- ✅ Turbine selection
- ✅ Site preparation estimates

---

### 7. **generatorPricingService.ts**
**Purpose:** Backup generator pricing  
**Status:** ✅ Production Ready

**Responsibilities:**
- Generator pricing (diesel, natural gas)
- Fuel costs
- Maintenance estimates
- Emissions calculations

**Key Functions:**
```typescript
calculateGeneratorCost(generatorMW, fuelType): GeneratorPricingResult
calculateFuelCost(capacity, hours): FuelCost
```

**When to Use:**
- ✅ Generator system pricing
- ✅ Fuel cost projections
- ✅ Backup power sizing

---

### 8. **systemControlsPricingService.ts**
**Purpose:** Control system and software pricing  
**Status:** ✅ Production Ready

**Responsibilities:**
- EMS (Energy Management System) pricing
- SCADA systems
- Monitoring software
- Control algorithms

**Key Functions:**
```typescript
calculateControlsCost(systemSize): ControlsPricingResult
getEMSPricing(features): EMSCost
```

**When to Use:**
- ✅ Control system pricing
- ✅ Software costs
- ✅ Monitoring equipment

---

### 9. **powerElectronicsPricingService.ts**
**Purpose:** Inverter and power electronics pricing  
**Status:** ✅ Production Ready

**Responsibilities:**
- Battery inverter pricing
- Transformers
- Switchgear
- Power conversion equipment

**Key Functions:**
```typescript
calculatePowerElectronicsCost(powerMW): ElectronicsPricingResult
getInverterEfficiency(technology): number
```

**When to Use:**
- ✅ Inverter pricing
- ✅ Power conversion costs
- ✅ Transformer sizing

---

## 🤖 AI & Optimization Services

### 10. **aiStateService.ts**
**Purpose:** Manage AI wizard state and recommendations  
**Status:** ✅ Production Ready

**Responsibilities:**
- Track AI wizard progress
- Store AI-generated recommendations
- Manage AI state across steps
- Coordinate between wizard and AI

**Key Functions:**
```typescript
updateAIState(state): void
getAIRecommendation(): AIRecommendation | null
clearAIState(): void
```

**When to Use:**
- ✅ AI wizard integration
- ✅ Tracking AI recommendations
- ✅ Syncing wizard state

---

### 11. **aiOptimizationService.ts**
**Purpose:** AI-powered system optimization  
**Status:** ⚠️ Beta

**Responsibilities:**
- Optimize battery dispatch
- Load forecasting
- Price arbitrage strategies
- Peak shaving optimization

**Key Functions:**
```typescript
optimizeDispatch(profile, prices): DispatchSchedule
forecastLoad(historical): LoadForecast
```

**When to Use:**
- ✅ Advanced analytics
- ✅ Optimization studies
- ⚠️ Experimental features only

**Note:** Still under development

---

### 12. **openAIService.ts**
**Purpose:** Integration with OpenAI API  
**Status:** ⚠️ Requires API Key

**Responsibilities:**
- Natural language processing
- AI-generated recommendations
- Smart defaults based on industry

**Key Functions:**
```typescript
generateRecommendation(context): Promise<AIResponse>
analyzeUseCase(data): Promise<Analysis>
```

**When to Use:**
- ⚠️ Only when OpenAI API key is configured
- ✅ AI-powered insights
- ✅ Natural language queries

---

## 💾 Data & Integration Services

### 13. **dataIntegrationService.ts**
**Purpose:** Integrate database data with calculations  
**Status:** ✅ Production Ready

**Responsibilities:**
- Combine use case data with calculations
- Enrich use case profiles
- Orchestrate data flow
- Cache integrated results

**Key Functions:**
```typescript
getUseCaseWithCalculations(params): Promise<UseCaseWithCalculations>
enrichUseCaseData(useCase): EnrichedUseCaseData
```

**When to Use:**
- ✅ Loading complete use case data
- ✅ Getting calculations with context
- ✅ Dashboard data loading

**Performance:**
- Heavy caching (10-minute TTL)
- Execution time logged
- Parallel data fetching

---

### 14. **supabaseClient.ts**
**Purpose:** Supabase database client and queries  
**Status:** ✅ Production Ready

**Responsibilities:**
- Database connection
- Query execution
- Real-time subscriptions
- Error handling

**Key Functions:**
```typescript
supabase.from('table').select()
supabase.from('table').insert()
supabase.from('table').update()
```

**When to Use:**
- ✅ Direct database queries
- ✅ Real-time subscriptions
- ✅ Authentication

**Environment Variables:**
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

### 15. **cacheService.ts**
**Purpose:** In-memory caching for performance  
**Status:** ✅ Production Ready

**Responsibilities:**
- Cache calculation results
- Reduce database queries
- Configurable TTL
- Memory-efficient storage

**Key Functions:**
```typescript
cache.set(key, value, ttl?)
cache.get(key): T | null
cache.delete(key)
cache.clear()
```

**When to Use:**
- ✅ Expensive calculations
- ✅ Frequently accessed data
- ✅ Database query results
- ✅ API responses

**Default TTL:** 10 minutes  
**Storage:** In-memory Map (clears on page refresh)

---

## 📄 Export & Document Services

### 16. **wordExportService.ts** + **wordHelpers.ts**
**Purpose:** Export quotes to Microsoft Word documents  
**Status:** ✅ Production Ready

**Responsibilities:**
- Generate Word documents (.docx)
- Format quote data
- Include charts/tables
- Professional templates

**Key Functions:**
```typescript
generateQuoteDocument(quoteData): Promise<Blob>
formatFinancialTable(data): TableFormat
```

**When to Use:**
- ✅ Quote export
- ✅ Proposal generation
- ✅ Client deliverables

**Dependencies:**
- `docx` package for Word generation

---

## 🔐 Authentication & Admin Services

### 17. **authService.ts**
**Purpose:** Local authentication (temporary)  
**Status:** ⚠️ Development Only

**Responsibilities:**
- User login/logout
- Password management
- Session management
- Local storage auth

**Key Functions:**
```typescript
login(email, password): Promise<AuthResult>
logout(): void
getCurrentUser(): User | null
```

**When to Use:**
- ⚠️ Development/demo only
- ⚠️ Will be replaced with Supabase Auth

**Security Note:** Uses localStorage, not production-ready

---

### 18. **adminAuthService.ts**
**Purpose:** Admin authentication and permissions  
**Status:** ✅ Production Ready

**Responsibilities:**
- Admin user management
- Permission checks
- Role-based access
- Admin operations

**Key Functions:**
```typescript
isAdmin(user): boolean
checkPermission(user, action): boolean
```

**When to Use:**
- ✅ Admin panel access
- ✅ Permission checks
- ✅ Role validation

---

## 📊 Market & Pricing Intelligence

### 19. **marketIntelligence.ts**
**Purpose:** Market pricing data and trends  
**Status:** ✅ Production Ready

**Responsibilities:**
- Market price tracking
- Competitor analysis
- Pricing trends
- Industry benchmarks

**Key Functions:**
```typescript
getMarketPricing(category): MarketData
analyzeTrends(historical): TrendAnalysis
```

**When to Use:**
- ✅ Competitive pricing
- ✅ Market analysis
- ✅ Pricing strategy

---

### 20. **pricingIntelligence.ts**
**Purpose:** Advanced pricing analytics  
**Status:** ✅ Production Ready

**Responsibilities:**
- Dynamic pricing
- Size-weighted pricing
- Regional adjustments
- Volume discounts

**Key Functions:**
```typescript
calculateDynamicPricing(params): PricingResult
applySizeWeighting(basePrice, size): AdjustedPrice
```

**When to Use:**
- ✅ Complex pricing scenarios
- ✅ Regional pricing
- ✅ Volume quotes

---

## 🛠️ Utility & Helper Services

### 21. **currencyService.ts**
**Purpose:** Currency formatting and conversion  
**Status:** ✅ Production Ready

**Responsibilities:**
- Format currency values
- Handle decimals
- Locale-specific formatting
- Number abbreviations (K, M, B)

**Key Functions:**
```typescript
formatCurrency(value, decimals?): string
formatCompactCurrency(value): string
```

**When to Use:**
- ✅ Display currency values
- ✅ Format financial numbers
- ✅ UI formatting

---

### 22. **quoteAdapter.ts**
**Purpose:** Bridge legacy wizard state to new QuoteDocument  
**Status:** ⚠️ Migration Tool

**Responsibilities:**
- Convert wizard state to quote format
- Maintain backward compatibility
- Gradual migration support

**Key Functions:**
```typescript
legacyWizardToQuote(wizardState): QuoteDocument
```

**When to Use:**
- ⚠️ During migration only
- ✅ Converting old data
- ⚠️ Will be deprecated in v3.0

---

## ⚠️ Deprecated Services (Avoid Using)

### ❌ bessDataService.ts
**Status:** 🚫 DEPRECATED  
**Replacement:** Use `centralizedCalculations.ts` instead

**Migration:**
```typescript
// ❌ OLD - Don't use
import { calculateBESSFinancials } from '@/services/bessDataService';

// ✅ NEW - Use this
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
```

---

### ❌ industryStandardFormulas.ts (in utils/)
**Status:** 🚫 DEPRECATED  
**Replacement:** Use `centralizedCalculations.ts` instead

**Migration:**
```typescript
// ❌ OLD - Don't use
import { calculateFinancialMetrics } from '@/utils/industryStandardFormulas';

// ✅ NEW - Use this
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
```

---

## 📚 Service Usage Patterns

### Pattern 1: Simple Calculation
```typescript
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';

const result = calculateFinancialMetrics({
  netCapex: 1000000,
  annualRevenue: 150000,
  includeNPV: true,
  projectLifetimeYears: 25,
  discountRate: 0.08
});

console.log(`Payback: ${result.paybackYears} years`);
console.log(`NPV: $${result.npv?.toFixed(0)}`);
```

### Pattern 2: Database Query + Calculation
```typescript
import { useCaseService } from '@/services/useCaseService';
import { dataIntegrationService } from '@/services/dataIntegrationService';

// Get complete use case with calculations
const data = await dataIntegrationService.getUseCaseWithCalculations({
  useCaseSlug: 'hotel',
  facilitySize: 150, // rooms
  operatingHours: 24,
  peakLoad: 0.66 // MW
});

console.log(`Recommended: ${data.calculations.sizing.batteryMW} MW`);
console.log(`Payback: ${data.calculations.financial.paybackYears} years`);
```

### Pattern 3: Cached Calculation
```typescript
import { baselineService } from '@/services/baselineService';

// First call - hits database
const result1 = await baselineService.calculateBaselineConfiguration('hotel', 1.5);

// Second call (within 10 min) - returns from cache
const result2 = await baselineService.calculateBaselineConfiguration('hotel', 1.5);
```

---

## 🔄 Service Dependencies

```
centralizedCalculations.ts
  └─ (standalone - no dependencies)

useCaseService.ts
  └─ supabaseClient.ts
  
baselineService.ts
  ├─ useCaseService.ts
  ├─ cacheService.ts
  └─ centralizedCalculations.ts (future)

dataIntegrationService.ts
  ├─ useCaseService.ts
  ├─ baselineService.ts
  ├─ centralizedCalculations.ts
  └─ cacheService.ts

advancedFinancialModeling.ts
  ├─ pricingConfigService.ts
  └─ centralizedCalculations.ts (future migration)
```

---

## 🚦 Service Health Status

| Service | Status | Type Checks | Tests | Documentation |
|---------|--------|-------------|-------|---------------|
| centralizedCalculations | ✅ Excellent | ✅ | ✅ | ✅ |
| useCaseService | ✅ Good | ✅ | ⚠️ | ✅ |
| baselineService | ✅ Good | ✅ | ⚠️ | ✅ |
| dataIntegrationService | ✅ Good | ✅ | ❌ | ⚠️ |
| advancedFinancialModeling | ⚠️ Needs refactor | ⚠️ | ❌ | ⚠️ |
| Pricing Services | ✅ Good | ✅ | ❌ | ⚠️ |
| AI Services | ⚠️ Beta | ⚠️ | ❌ | ❌ |
| Auth Services | ⚠️ Temporary | ⚠️ | ❌ | ⚠️ |

---

## 📝 Development Guidelines

### ✅ DO:
1. Use `centralizedCalculations.ts` for ALL financial calculations
2. Use `@/` path aliases for imports
3. Check cache before expensive operations
4. Handle errors gracefully with try/catch
5. Add JSDoc comments to public functions
6. Use TypeScript interfaces (no `any` types)
7. Log performance metrics for slow operations

### ❌ DON'T:
1. Create duplicate calculation functions
2. Use relative imports (`../../../`)
3. Put business logic in components
4. Query database without caching
5. Use `console.log` in production (use `if (import.meta.env.DEV)`)
6. Expose admin functions in production
7. Use deprecated services

---

## 🔮 Future Improvements

### High Priority:
1. **Complete Migration:** Finish migrating `advancedFinancialModeling.ts` to use `centralizedCalculations.ts`
2. **Unit Tests:** Add comprehensive tests for all calculation services
3. **Type Safety:** Replace remaining `any` types with proper interfaces
4. **Error Boundaries:** Add React error boundaries for graceful failures

### Medium Priority:
5. **Split Large Files:** Break down 1500+ line services into focused modules
6. **Centralized Logging:** Replace scattered console.log with logging service
7. **Performance Monitoring:** Add metrics for slow operations
8. **API Documentation:** Generate API docs from JSDoc comments

### Low Priority:
9. **Service Discovery:** Auto-register services for dependency injection
10. **Microservices:** Consider splitting into separate services
11. **GraphQL:** Replace REST endpoints with GraphQL
12. **Real-time Updates:** Add WebSocket support for live data

---

## 📞 Getting Help

**For questions about:**
- **Calculations:** See `centralizedCalculations.ts` documentation
- **Database:** See `useCaseService.ts` and Supabase docs
- **Architecture:** Review this document
- **Migration:** Check deprecation warnings and migration guides

**Common Issues:**
1. "Function not found" → Check if service is deprecated
2. "Type errors" → Import types from `@/types`
3. "Slow queries" → Check if caching is enabled
4. "Inconsistent results" → Make sure using `centralizedCalculations.ts`

---

**Last Reviewed:** November 16, 2025  
**Next Review:** December 2025  
**Maintained By:** Development Team
