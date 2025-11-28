# MERLIN BESS Quote Builder - Architecture Audit Report

**Generated:** $(date)
**Purpose:** Comprehensive documentation of codebase structure and workflow

---

## 📁 Core Architecture

### Directory Structure

```
merlin2/
├── src/
│   ├── components/          # UI Components
│   │   ├── admin/          # Admin panel components
│   │   ├── modals/         # Modal dialogs
│   │   ├── sections/       # Page sections
│   │   └── wizard/         # Quote wizard (main flow)
│   ├── services/           # Business logic & APIs
│   ├── utils/              # Helper functions
│   ├── types/              # TypeScript definitions
│   ├── data/               # Static data & templates
│   └── assets/             # Images, sounds, etc.
├── supabase/               # Database schema & migrations
└── public/                 # Static assets
```

---

## 🎯 Core Services (Business Logic)

### **CRITICAL - DO NOT DUPLICATE THESE:**


#### 1. `centralizedCalculations.ts` ⭐ MAIN CALCULATION ENGINE
**Purpose:** Single source of truth for all financial calculations
**Functions:**
- `calculateFinancialMetrics()` - NPV, IRR, payback, ROI
- `calculateLevelizedCostOfStorage()` - LCOS analysis
- Uses database-sourced constants (never hardcoded)

**Usage:** ALWAYS use this for financial calculations
```typescript
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
const result = await calculateFinancialMetrics({ storageSizeMW, ... });
```

**Dependencies:** Database constants from Supabase

---

#### 2. `baselineService.ts` ⭐ SIZING ENGINE
**Purpose:** Calculate BESS sizing from industry templates
**Key Function:** `calculateDatabaseBaseline(template, scale, useCaseData)`
**Features:**
- Industry-specific sizing (hotels, data centers, EV charging)
- Database-driven templates with context-aware calculations
- Grid connection analysis (on-grid, off-grid, unreliable)
- Generation requirement detection

**Usage:** Called automatically by SmartWizardV2 on step 2
```typescript
const baseline = await calculateDatabaseBaseline('hotel', 1.5, useCaseData);
// Returns: powerMW, durationHrs, solarMW, generationRequired, etc.
```

**Protected:** DO NOT MODIFY - Industry-validated logic

---

#### 3. `unifiedPricingService.ts` ⭐ EQUIPMENT PRICING
**Purpose:** Get real-world equipment pricing with regional support
**Functions:**
- `getBatteryPricing()` - Battery system costs
- `getInverterPricing()` - Inverter costs
- `getSolarPricing()` - Solar PV costs
- `getGeneratorPricing()` - Generator backup costs

**Features:**
- Regional pricing (North America, Europe, Asia, Middle East)
- Vendor-specific logic
- Cached database queries

**Usage:**
```typescript
const pricing = await getBatteryPricing(kwh, region);
```

**Protected:** DO NOT MODIFY - Working correctly

---

#### 4. `advancedFinancialModeling.ts` 🎓 PROFESSIONAL DCF
**Purpose:** Advanced financial analysis with Monte Carlo simulations
**Features:**
- Target IRR-based pricing
- Professional battery capacity fading models
- DCF analysis with sensitivity testing
- Risk assessment

**Usage:** Optional enhanced analysis for premium tier
**Protected:** DO NOT MODIFY - Secret sauce

---

### **DEPRECATED SERVICES (Do Not Use):**

❌ `bessDataService.ts` - Replaced by centralizedCalculations.ts
❌ `industryStandardFormulas.ts` - Name conflict, use centralizedCalculations
❌ ModalManager.tsx - Has type errors, use ModalRenderer.tsx

---

## 🧙 Wizard Flow (Main User Journey)

### SmartWizardV2.tsx - Main Orchestrator

**Steps:**
0. **Intro** (-1): Welcome screen
1. **Choose Industry** (0): Select use case template
2. **Tell Us About Your Operation** (1): Answer custom questions
3. **Configure System** (2): Review calculated BESS size
4. **Add Power Generation** (3): Solar, wind, generators
5. **Location & Pricing** (4): Regional pricing & options
6. **Review Quote** (5): Final quote with equipment breakdown

**State Management:**
- `selectedTemplate` - Use case (hotel, datacenter, etc.)
- `useCaseData` - User answers from step 2
- `storageSizeMW`, `durationHours` - Battery sizing
- `solarMW`, `windMW`, `generatorMW` - Generation
- `baselineResult` - Calculated sizing data

**Critical Flow:**
```typescript
Step 2: User answers questions
  ↓
calculateDatabaseBaseline() // baselineService.ts
  ↓
setBaselineResult({ powerMW, solarMW, generationRequired, ... })
  ↓
Step 3: Shows preconfigured values
```

---

## 🎨 Key Components

### PowerStatusBar (SmartWizardV2.tsx lines 1818-1891)
**Location:** Inline in SmartWizardV2, NOT a separate file
**Shows:** Peak demand, Grid capacity, Battery, Generation stats
**Visible:** Steps 2-5
**Sticky header:** Dark gradient with power configuration summary

### Step Components:
- `Step0_Industry.tsx` - Use case selection
- `Step2_UseCase.tsx` - Custom questions (QuestionRenderer)
- `Step3_AddRenewables.tsx` - Power generation config
- `Step4_QuoteSummary.tsx` - Final quote display (formerly Step5)

### Modal System:
**USE:** `ModalRenderer.tsx` + `useModalManager` hook
**AVOID:** `ModalManager.tsx` (has prop type errors)

---

## 📊 Data Flow

### 1. Calculation Flow:
```
User Input (Step 2)
  ↓
useCaseService.fetchTemplate()
  ↓
baselineService.calculateDatabaseBaseline()
  ↓
unifiedPricingService.getBatteryPricing()
  ↓
centralizedCalculations.calculateFinancialMetrics()
  ↓
Display Results (Step 6)
```

### 2. State Flow:
```
SmartWizardV2 (parent)
  ↓ props
Step Components (children)
  ↓ callbacks
Update parent state
  ↓
Re-render with new values
```

---

## 🗄️ Database (Supabase)

### Core Tables:
- `use_cases` - Industry templates (30+ use cases)
- `use_case_configurations` - Sizing presets by scale
- `equipment_templates` - Equipment specs
- `saved_quotes` - User quote portfolio
- `users` - Auth + tier management (FREE/PREMIUM/ADMIN)
- `financial_constants` - Market rates, escalators, tax credits

### Connection:
```typescript
// .env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎯 Tier System

### FREE Tier:
- 5 basic use cases
- 3 saved quotes
- Simple PDF export

### PREMIUM Tier:
- All 30+ use cases
- Unlimited saved quotes
- Word/Excel export with appendices
- Advanced financial modeling

### ADMIN Tier:
- Full access + admin panel
- Vendor management
- Pricing controls

---

## 🚫 Common Mistakes to Avoid

### 1. **DO NOT create duplicate calculation functions**
❌ BAD:
```typescript
const payback = cost / savings; // Manual calculation
```
✅ GOOD:
```typescript
import { calculateFinancialMetrics } from '@/services/centralizedCalculations';
const result = await calculateFinancialMetrics({ ... });
```

### 2. **DO NOT modify protected services**
Protected files (DO NOT CHANGE):
- `advancedFinancialModeling.ts`
- `baselineService.ts` (except for new use cases)
- `unifiedPricingService.ts`

### 3. **DO NOT use deprecated services**
❌ `bessDataService.calculateBESSFinancials()`
❌ `industryStandardFormulas.calculateFinancialMetrics()`
✅ `centralizedCalculations.calculateFinancialMetrics()`

### 4. **DO NOT create new modal managers**
✅ Use: `ModalRenderer.tsx` + `useModalManager` hook

### 5. **DO NOT implement business logic in components**
❌ BAD: Calculations in React components
✅ GOOD: Call services from components

---

## 📝 File Counts


### Components:
- Total component files: 128
- Wizard components: 42
- Modal components: 18
- Admin components: 7

### Services:
- Service files: 41

### Utils:
- Utility files: 21

### Types:
- Type definition files: 5

### Documentation:
- Markdown files in root: 147

---

## 🔧 Development Workflow

### Adding a New Use Case:
1. Add to Supabase `use_cases` table
2. Create custom questions in `use_case_configurations`
3. (Optional) Add industry-specific logic to `baselineService.ts`
4. Test with SmartWizardV2

### Adding a New Calculation:
1. **NEVER** create duplicate calculation function
2. Add to `centralizedCalculations.ts` if financial
3. Add to `baselineService.ts` if sizing-related
4. Add validation in `calculationValidator.ts`

### Adding UI Components:
1. Create in appropriate `src/components/` subdirectory
2. Define TypeScript prop interfaces
3. Import types from `@/types/`
4. Connect to services (NO business logic in component)

---

## 🎯 Critical Paths

### Main User Flow:
```
Landing Page → Smart Wizard → Choose Industry → Answer Questions
→ Review Config → Add Generation → Get Quote → Complete
```

### Calculation Pipeline:
```
Template Selection → calculateDatabaseBaseline → Equipment Pricing
→ Financial Metrics → Display Results
```

### Data Persistence:
```
User Input → Wizard State → Save Quote (Supabase)
→ Quote History → Export (PDF/Word)
```

---

## ⚠️ Known Issues

1. **Modal System:** Two implementations exist (use ModalRenderer only)
2. **Deprecated Services:** bessDataService has 2 remaining calls in dataIntegrationService.ts
3. **Type Conflicts:** User type imported from Supabase conflicts with custom User type

---

## 📚 Key Documentation Files (Keep)

### Essential:
- `README.md` - Project overview
- `ARCHITECTURE_GUIDE.md` - System architecture
- `SERVICES_ARCHITECTURE.md` - Service layer details
- `SUPABASE_SETUP.md` - Database setup
- `CALCULATION_RECONCILIATION_STRATEGY.md` - Calculation validation

### Can Archive (35+ files):
All the *_COMPLETE.md, *_PLAN.md, *_SUMMARY.md files are historical and can be moved to `/docs/archive/`

---

## 🎓 Best Practices

1. **Always check for existing implementations before creating new ones**
2. **Use semantic search to find components:** `grep -r "ComponentName" src/`
3. **Follow the import alias:** `@/` for all imports from `src/`
4. **Test calculations with validation:** Compare to centralizedCalculations
5. **Document breaking changes:** Update this architecture file

---

**End of Architecture Audit**

*Generated by audit-architecture.sh*
*Keep this file updated as the codebase evolves*
