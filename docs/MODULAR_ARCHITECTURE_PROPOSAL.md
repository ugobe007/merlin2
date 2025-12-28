# 🏗️ Modular Architecture Proposal for Vertical Sites
**Date**: December 25, 2025  
**Status**: Architecture Assessment & Proposal

---

## 🎯 Goal

Transform Merlin into a modular system where each vertical (carwashenergy, hotelenergy, evchargingenergy, datacenterenergy, etc.) can be:
- **Standalone sites** with their own domain/branding
- **Use the Merlin wizard module** as a reusable component
- **Completely separate** from the main Merlin site (no cross-contamination)
- **SSOT compliant** (Single Source of Truth for calculations)
- **TrueQuote compliant** (validation and accuracy)

---

## 📊 Current Architecture Assessment

### ✅ What's Already Modular

1. **WizardV5 Component** (`src/components/wizard/v5/WizardV5.tsx`)
   - ✅ Self-contained wizard component
   - ✅ Accepts props for configuration
   - ✅ Can be embedded in different contexts
   - ✅ Industry pre-selection via URL params

2. **Core Services (SSOT)**
   - ✅ `unifiedQuoteCalculator.ts` - Centralized quote calculations
   - ✅ `centralizedCalculations.ts` - SSOT calculation logic
   - ✅ `equipmentCalculations.ts` - Equipment cost calculations
   - ✅ `calculationConstantsService.ts` - Database-backed constants
   - ✅ All services are stateless and reusable

3. **TrueQuote Compliance**
   - ✅ `calculationValidator.ts` - Validation service
   - ✅ Built into quote engine
   - ✅ Industry benchmark checking

4. **Vertical Landing Pages**
   - ✅ `CarWashEnergy.tsx`, `HotelEnergy.tsx`, `EVChargingEnergy.tsx`
   - ✅ Currently redirect to wizard with industry pre-selected
   - ✅ Separate components (good foundation)

### ⚠️ What Needs Restructuring

1. **Shared State/Data**
   - ❌ Wizard state stored in global context
   - ❌ Shared session storage
   - ❌ Cross-vertical data leakage risk

2. **Branding/Theming**
   - ❌ Hard-coded Merlin branding
   - ❌ No per-vertical theming system
   - ❌ Shared navigation/header

3. **Deployment Structure**
   - ❌ Single monolithic app
   - ❌ No separate build outputs per vertical
   - ❌ Shared environment variables

4. **Data Isolation**
   - ❌ Shared database tables (may be OK for SSOT)
   - ❌ No vertical-specific data partitioning
   - ❌ Analytics/telemetry mixing

---

## 🏗️ Proposed Modular Architecture

### Option 1: Monorepo with Build-Time Configuration (Recommended)

**Structure:**
```
merlin2/
├── packages/
│   ├── core/                    # Shared core services (SSOT, TrueQuote)
│   │   ├── services/
│   │   │   ├── unifiedQuoteCalculator.ts
│   │   │   ├── centralizedCalculations.ts
│   │   │   ├── calculationValidator.ts
│   │   │   └── ...
│   │   └── types/
│   │
│   ├── wizard/                  # Reusable wizard module
│   │   ├── WizardV5.tsx
│   │   ├── steps/
│   │   ├── components/
│   │   └── design-system.ts
│   │
│   ├── verticals/               # Vertical-specific packages
│   │   ├── carwash/
│   │   │   ├── CarWashEnergy.tsx
│   │   │   ├── theme.ts
│   │   │   ├── config.ts
│   │   │   └── vite.config.ts
│   │   ├── hotel/
│   │   ├── evcharging/
│   │   └── datacenter/
│   │
│   └── shared/                  # Shared UI components
│       ├── components/
│       └── utils/
│
├── apps/
│   ├── merlin-main/             # Main Merlin site
│   ├── carwash-site/            # Standalone carwash site
│   ├── hotel-site/              # Standalone hotel site
│   └── evcharging-site/         # Standalone EV charging site
│
└── tools/
    ├── build-vertical.sh        # Build script for verticals
    └── deploy-vertical.sh        # Deploy script
```

**Benefits:**
- ✅ Shared core services (SSOT maintained)
- ✅ Separate builds per vertical
- ✅ Independent deployments
- ✅ Code reuse
- ✅ Type safety across packages

**Implementation:**
- Use **Turborepo** or **Nx** for monorepo management
- Use **Vite** with separate configs per vertical
- Environment-based configuration per vertical

---

### Option 2: NPM Package Approach

**Structure:**
```
merlin-core/                     # Published NPM package
├── @merlin/core                 # Core services (SSOT)
├── @merlin/wizard               # Wizard component
└── @merlin/truequote            # TrueQuote validation

merlin-carwash/                  # Separate repo
├── package.json                 # Depends on @merlin/core, @merlin/wizard
├── src/
│   ├── App.tsx
│   ├── theme.ts
│   └── config.ts
└── vite.config.ts

merlin-hotel/                    # Separate repo
└── ...
```

**Benefits:**
- ✅ Complete separation
- ✅ Independent versioning
- ✅ Can be used by external parties
- ✅ Clear boundaries

**Drawbacks:**
- ❌ More complex publishing workflow
- ❌ Version management overhead
- ❌ Slower iteration

---

### Option 3: Multi-Tenant with Configuration (Current + Enhancements)

**Structure:**
```
merlin2/
├── src/
│   ├── config/
│   │   ├── verticals/
│   │   │   ├── carwash.config.ts
│   │   │   ├── hotel.config.ts
│   │   │   └── evcharging.config.ts
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── wizard/              # Shared wizard
│   │   └── verticals/           # Vertical-specific wrappers
│   │
│   └── services/                # Shared services (SSOT)
│
├── public/
│   ├── carwash/                 # Vertical-specific assets
│   ├── hotel/
│   └── evcharging/
│
└── build/
    ├── carwash/                 # Separate build outputs
    ├── hotel/
    └── evcharging/
```

**Benefits:**
- ✅ Minimal restructuring
- ✅ Shared codebase
- ✅ Configuration-driven
- ✅ Single deployment pipeline

**Drawbacks:**
- ⚠️ Still some coupling
- ⚠️ Build size includes all verticals

---

## 🎯 Recommended Approach: **Option 1 (Monorepo)**

### Why Option 1?

1. **SSOT Maintained**: Core services remain shared
2. **TrueQuote Compliance**: Validation logic centralized
3. **Code Reuse**: Wizard and services shared
4. **Separation**: Each vertical is a separate app
5. **Scalability**: Easy to add new verticals
6. **Deployment**: Independent deployments per vertical

---

## 📋 Implementation Plan

### Phase 1: Core Extraction (Week 1)

1. **Extract Core Services**
   ```bash
   packages/core/
   ├── services/
   │   ├── unifiedQuoteCalculator.ts
   │   ├── centralizedCalculations.ts
   │   ├── calculationValidator.ts
   │   ├── unifiedPricingService.ts
   │   └── ...
   ├── types/
   └── package.json
   ```

2. **Extract Wizard Module**
   ```bash
   packages/wizard/
   ├── WizardV5.tsx
   ├── steps/
   ├── components/
   ├── design-system.ts
   └── package.json
   ```

3. **Create Vertical Config System**
   ```typescript
   // packages/wizard/types.ts
   export interface VerticalConfig {
     name: string;
     industry: string;
     theme: ThemeConfig;
     branding: BrandingConfig;
     features: FeatureFlags;
   }
   ```

### Phase 2: Vertical Isolation (Week 2)

1. **Create Vertical Packages**
   ```bash
   packages/verticals/carwash/
   ├── CarWashEnergy.tsx
   ├── theme.ts
   ├── config.ts
   └── package.json
   ```

2. **Create Standalone Apps**
   ```bash
   apps/carwash-site/
   ├── src/
   │   ├── App.tsx
   │   ├── main.tsx
   │   └── index.html
   ├── vite.config.ts
   └── package.json
   ```

3. **Implement Theming System**
   ```typescript
   // packages/wizard/theme.ts
   export interface ThemeConfig {
     colors: {
       primary: string;
       secondary: string;
       accent: string;
     };
     branding: {
       logo: string;
       name: string;
       tagline: string;
     };
   }
   ```

### Phase 3: Data Isolation (Week 3)

1. **Vertical-Specific Data**
   - Analytics tracking per vertical
   - Session storage namespacing
   - Cookie domain isolation

2. **Configuration Injection**
   ```typescript
   // apps/carwash-site/src/App.tsx
   import { WizardV5 } from '@merlin/wizard';
   import { carwashConfig } from '@merlin/verticals/carwash';
   
   function App() {
     return (
       <WizardV5
         config={carwashConfig}
         onComplete={handleComplete}
       />
     );
   }
   ```

### Phase 4: Build & Deploy (Week 4)

1. **Build Scripts**
   ```bash
   # tools/build-vertical.sh
   npm run build:carwash
   npm run build:hotel
   npm run build:evcharging
   ```

2. **Deploy Scripts**
   ```bash
   # tools/deploy-vertical.sh
   flyctl deploy --app carwash-energy --config apps/carwash-site/fly.toml
   ```

---

## 🔒 SSOT & TrueQuote Compliance

### How SSOT is Maintained

1. **Shared Core Services**
   - All calculation logic in `packages/core`
   - Single source for all verticals
   - Version-controlled and tested

2. **Database Schema**
   - Shared `calculation_constants` table
   - Shared `equipment_pricing` table
   - Vertical-specific data in separate tables

3. **Validation**
   - `calculationValidator.ts` in core package
   - TrueQuote checks run on all quotes
   - Industry benchmarks shared

### How TrueQuote is Maintained

1. **Validation Service**
   - Centralized in `packages/core`
   - All verticals use same validation
   - 3% deviation threshold enforced

2. **Quote Engine**
   - Single quote engine for all verticals
   - Same calculation logic
   - Same accuracy guarantees

---

## 🚀 Migration Path

### Step 1: Current State Assessment ✅
- [x] Identify modular components
- [x] Identify shared services
- [x] Document current structure

### Step 2: Core Extraction
- [ ] Create `packages/core` package
- [ ] Move calculation services
- [ ] Set up package.json and exports
- [ ] Test core services in isolation

### Step 3: Wizard Extraction
- [ ] Create `packages/wizard` package
- [ ] Extract WizardV5 and dependencies
- [ ] Add configuration system
- [ ] Add theming system

### Step 4: Vertical Packages
- [ ] Create vertical config packages
- [ ] Extract vertical-specific code
- [ ] Set up theming per vertical

### Step 5: Standalone Apps
- [ ] Create app structure for each vertical
- [ ] Set up build configs
- [ ] Set up deployment configs
- [ ] Test independent builds

### Step 6: Migration & Testing
- [ ] Migrate carwash site
- [ ] Migrate hotel site
- [ ] Migrate EV charging site
- [ ] Test SSOT compliance
- [ ] Test TrueQuote compliance

---

## 📊 Comparison: Current vs. Proposed

| Aspect | Current | Proposed (Option 1) |
|--------|---------|---------------------|
| **Code Reuse** | ✅ Shared codebase | ✅ Shared packages |
| **Separation** | ❌ Single app | ✅ Separate apps |
| **Deployment** | ❌ Single deployment | ✅ Independent deployments |
| **Branding** | ❌ Hard-coded | ✅ Config-driven |
| **SSOT** | ✅ Centralized | ✅ Core package |
| **TrueQuote** | ✅ Built-in | ✅ Core package |
| **Scalability** | ⚠️ Limited | ✅ Easy to add verticals |
| **Build Size** | ❌ Includes all | ✅ Per-vertical builds |

---

## 🎯 Recommendation

**Start with Option 1 (Monorepo)** because:

1. ✅ **Minimal Disruption**: Can migrate incrementally
2. ✅ **SSOT Maintained**: Core services remain shared
3. ✅ **TrueQuote Compliant**: Validation centralized
4. ✅ **Scalable**: Easy to add new verticals
5. ✅ **Independent Deployments**: Each vertical can deploy separately
6. ✅ **Code Reuse**: Wizard and services shared

**Timeline**: 4 weeks for full migration

**Risk**: Low - Can migrate one vertical at a time

---

## 🔗 Next Steps

1. **Review this proposal** with the team
2. **Set up monorepo structure** (Turborepo or Nx)
3. **Extract core services** first (lowest risk)
4. **Extract wizard module** (medium risk)
5. **Create first vertical app** (carwash as pilot)
6. **Test and iterate** before migrating others

---

## 📝 Questions to Consider

1. **Domain Strategy**: 
   - Subdomains (carwash.merlinenergy.com)?
   - Separate domains (carwashenergy.com)?

2. **Analytics**:
   - Separate analytics per vertical?
   - Shared analytics with segmentation?

3. **Authentication**:
   - Shared user accounts?
   - Separate accounts per vertical?

4. **Database**:
   - Shared database with vertical partitioning?
   - Separate databases per vertical?

5. **Vendor Portal**:
   - Shared vendor portal?
   - Vertical-specific vendor portals?

---

## 📄 Related Documents

- `docs/WIZARD_V5_ARCHITECTURE_MAP.md` - Current wizard architecture
- `docs/VENDOR_LAUNCH_READINESS.md` - Vendor integration status
- `docs/PHASE_1_VENDOR_INTEGRATION_COMPLETE.md` - Vendor integration details



