# ProQuote Refactoring Plan
**Created:** Feb 21, 2026  
**Status:** Phase 1 - Code Refactoring (In Progress)

## 📊 Current State
- **Main File:** `src/components/AdvancedQuoteBuilder.tsx`
- **Size:** 8,126 lines (MONOLITHIC)
- **View Modes:** 6 (landing, custom-config, interactive-dashboard, professional-model, upload, upload-first)
- **Major Sections:** 
  - Lines 1-650: Imports, state declarations (150+ state variables)
  - Lines 650-1036: useEffect hooks, calculations, event handlers
  - Lines 1036-1848: Landing page view
  - Lines 1848-1915: Upload-first view
  - Lines 1915-6899: Custom-config view (5,000 lines!)
  - Lines 6899-6927: Interactive dashboard view
  - Lines 6927-8126: Professional model view

## 🎯 Target State
- **Main File:** ~500 lines (orchestration only)
- **New Components:** 30-40 modular files (200-300 lines each)
- **Architecture:** Domain-driven folders

## 📁 Directory Structure Created
```
src/components/ProQuote/
├── Forms/          ✅ Created
├── Results/        ✅ Created
├── Export/         ✅ Created
├── Calculations/   ✅ Created
└── Shared/         ✅ Created
    └── types.ts    ✅ Created
```

## 🔧 Extraction Strategy

### Phase 1A: Extract Shared Components (High Reuse)
**Priority:** HIGH - These are used across multiple views

1. **LiveCostSummaryStrip** (Lines 2125-2450)
   - Sticky top bar showing real-time pricing
   - Used in: custom-config, professional-model
   - Props: financialMetrics, isCalculating, storageSizeMWh, storageSizeMW, durationHours
   - File: `Shared/LiveCostSummaryStrip.tsx`

2. **ProQuoteBadgePanel** (Lines 2065-2125)
   - Blue shield badge with "ProQuote™ Pro Mode" branding
   - Used in: custom-config
   - Props: onShowHowItWorks
   - File: `Shared/ProQuoteBadgePanel.tsx`

3. **MerlinTip** (Already exists but needs import)
   - Context-aware tips throughout forms
   - Keep using existing component

4. **SectionHeader** (Reusable pattern ~lines 2450-2490)
   - Standard header for each configuration section
   - Props: title, subtitle, icon, iconColor
   - File: `Shared/SectionHeader.tsx`

### Phase 1B: Extract Configuration Sections (Custom-Config View)
**File:** Lines 1915-6899 (5,000 lines) → Split into 5 sections

1. **SystemConfigSection** (Lines 2450-2880)
   - Power capacity slider (MW)
   - Duration slider (hours)
   - Battery chemistry dropdown
   - Installation type dropdown
   - Grid connection dropdown
   - Inverter efficiency input
   - File: `Forms/CustomConfig/SystemConfigSection.tsx`
   - Props: SystemConfigSectionProps

2. **ApplicationSection** (Lines 2880-3100)
   - Application type (residential/commercial/utility/microgrid)
   - Primary use case (peak-shaving, arbitrage, backup, etc.)
   - Project name input
   - Location input
   - File: `Forms/CustomConfig/ApplicationSection.tsx`
   - Props: ApplicationSectionProps

3. **FinancialSection** (Lines 3100-3400)
   - Utility rate input ($/kWh)
   - Demand charge input ($/kW)
   - Cycles per year input
   - Warranty years input
   - "Bank-Ready Model" CTA card
   - File: `Forms/CustomConfig/FinancialSection.tsx`
   - Props: FinancialSectionProps

4. **ElectricalSection** (Lines 3400-4500)
   - System voltage input
   - DC voltage input
   - Inverter type dropdown
   - Inverter manufacturer input
   - Inverter rating input
   - PCS quote separately checkbox
   - Number of inverters input
   - Watts/Amps overrides
   - File: `Forms/CustomConfig/ElectricalSection.tsx`
   - Props: ElectricalSectionProps
   - **LARGE SECTION** - May need sub-components

5. **RenewablesSection** (Lines 4500-6899)
   - Include renewables toggle
   - Solar PV panel (expanded config)
   - Wind turbine panel (expanded config)
   - Fuel cell panel
   - Generator panel (unified fuel type)
   - EV chargers panel
   - File: `Forms/CustomConfig/RenewablesSection.tsx`
   - Props: RenewablesSectionProps
   - **LARGEST SECTION** - Definitely needs sub-components

### Phase 1C: Extract Other View Components

1. **LandingView** (Lines 1036-1848)
   - Tool cards grid
   - Welcome popup logic
   - View mode selection
   - File: `Forms/LandingView.tsx`
   - Props: onSelectView, onClose, callbacks

2. **UploadFirstView** (Lines 1848-1915)
   - Document upload interface
   - Extraction success modal
   - Data review modal
   - File: `Forms/UploadFirstView.tsx`
   - Props: upload state, handlers

3. **InteractiveDashboardView** (Lines 6899-6927)
   - Real-time slider configuration
   - Currently DISABLED in code
   - File: `Forms/InteractiveDashboardView.tsx`
   - **LOW PRIORITY** - Feature is disabled

4. **ProfessionalModelView** (Lines 6927-8126)
   - ISO region selector
   - Leverage/financing inputs
   - 3-statement model display
   - DSCR, IRR, MACRS calculations
   - File: `Forms/ProfessionalModelView.tsx`
   - Props: professional model state, financial metrics

### Phase 1D: Extract Export Functionality

1. **ExportManager** (Scattered throughout)
   - Word export logic (uses docx library)
   - Excel export logic
   - PDF generation (future)
   - File: `Export/ExportManager.tsx`
   - Hooks: useWordExport, useExcelExport

2. **QuotePreviewModal** (Lines ~TBD)
   - Preview modal before export
   - Format selection (Word/Excel)
   - File: `Export/QuotePreviewModal.tsx`

### Phase 1E: Extract Calculation Hooks

1. **useQuoteCalculations** (Lines 282-405 useEffect)
   - Orchestrates QuoteEngine.generateQuote()
   - Maps state to SSOT inputs
   - Returns financialMetrics, isCalculating
   - File: `Calculations/useQuoteCalculations.ts`

2. **useProfessionalModel** (Logic in professional-model view)
   - Generates 3-statement model
   - Calculates DSCR, IRR, MACRS
   - File: `Calculations/useProfessionalModel.ts`

3. **useSolarSizing** (Existing calculateSolarSizing calls)
   - Solar panel calculations
   - Already exists as service - just needs proper integration
   - May not need new hook

## 🚀 Execution Order

### Step 1: Create Shared UI Components (1 hour)
- [ ] `Shared/LiveCostSummaryStrip.tsx`
- [ ] `Shared/ProQuoteBadgePanel.tsx`
- [ ] `Shared/SectionHeader.tsx`

### Step 2: Extract Custom-Config Sections (3 hours)
- [ ] `Forms/CustomConfig/SystemConfigSection.tsx`
- [ ] `Forms/CustomConfig/ApplicationSection.tsx`
- [ ] `Forms/CustomConfig/FinancialSection.tsx`
- [ ] `Forms/CustomConfig/ElectricalSection.tsx`
- [ ] `Forms/CustomConfig/RenewablesSection.tsx`

### Step 3: Extract Other Views (2 hours)
- [ ] `Forms/LandingView.tsx`
- [ ] `Forms/UploadFirstView.tsx`
- [ ] `Forms/ProfessionalModelView.tsx`

### Step 4: Extract Export Logic (1 hour)
- [ ] `Export/useWordExport.ts`
- [ ] `Export/useExcelExport.ts`
- [ ] `Export/ExportManager.tsx`

### Step 5: Extract Calculation Hooks (1 hour)
- [ ] `Calculations/useQuoteCalculations.ts`
- [ ] `Calculations/useProfessionalModel.ts`

### Step 6: Refactor Main Component (2 hours)
- [ ] Reduce AdvancedQuoteBuilder.tsx to orchestration
- [ ] Import all extracted components
- [ ] Replace inline JSX with component calls
- [ ] Remove extracted state (pass via props)
- [ ] Verify build passes
- [ ] Test all view modes

**Total Time:** ~10 hours

## 📝 Notes

### State Management
- Keep ALL state in main component initially
- Pass state + setters as props to sections
- Future: Consider Zustand/Context for deep prop drilling

### Import Strategy
```typescript
// Main component imports
import { LiveCostSummaryStrip } from './ProQuote/Shared/LiveCostSummaryStrip';
import { SystemConfigSection } from './ProQuote/Forms/CustomConfig/SystemConfigSection';
// ... etc
```

### TypeScript Safety
- All props interfaces defined in `Shared/types.ts`
- Strict prop types enforced
- No `any` types allowed

### Testing Strategy
- Extract one component at a time
- `npm run build` after each extraction
- Manual smoke test of affected view
- Commit after each successful extraction

## 🐛 Known Issues to Fix During Refactoring
1. `viewMode === "interactive-dashboard"` is disabled (line 6899)
2. Multiple `_unused` variables from linter (prefix with underscore)
3. Deep prop drilling (150+ state variables)
4. No loading states during expensive calculations
5. No validation for form inputs

## 📚 References
- **Original File:** `src/components/AdvancedQuoteBuilder.tsx`
- **Types File:** `src/components/ProQuote/Shared/types.ts`
- **Copilot Instructions:** See `COPILOT_INSTRUCTIONS.md` section on ProQuote
