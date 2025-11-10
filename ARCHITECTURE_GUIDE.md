# Merlin BESS Quote Builder - Comprehensive Architecture Guide

## 🎯 Purpose
This guide provides AI agents with a complete understanding of the Merlin BESS (Battery Energy Storage System) Quote Builder application architecture, component relationships, and modification workflows.

---

## 📊 System Overview

### Core Mission
Merlin is a professional BESS project financial analysis and quote generation platform that transforms complex energy storage calculations into user-friendly workflows with investment-grade financial modeling capabilities.

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Fly.io with Docker + nginx
- **Financial Engine**: Custom TypeScript algorithms based on industry standards

### Architecture Philosophy
- **Hook-Based State Management**: Centralized business logic in custom hooks
- **Service Layer Pattern**: Pure business logic separated from UI components
- **Component Composition**: Modular UI with clear separation of concerns
- **Type Safety**: Comprehensive TypeScript interfaces and strict typing

---

## 🏗️ Core Architecture Components

### 1. Main Application Flow
```
User Input → Hook State Management → Service Layer → UI Rendering
     ↓              ↓                    ↓            ↓
Form Data → useBessQuoteBuilder → quoteCalculations → BessQuoteBuilder
```

### 2. Primary Files and Responsibilities

#### **BessQuoteBuilder.tsx** (531 lines) - Main UI Component
- **Purpose**: Primary user interface rendering component
- **Responsibilities**: 
  - Form rendering and user interactions
  - Modal management and navigation
  - Results display and export functionality
- **Key Features**: 
  - 84.8% size reduction from original (3,500 → 531 lines)
  - Clean separation of UI from business logic
  - Integrated with comprehensive hook system
- **Dependencies**: 
  - useBessQuoteBuilder hook for state management
  - quoteCalculations service for business logic
  - Modal system for advanced features

#### **useBessQuoteBuilder.ts** (777 lines) - State Management Hook
- **Purpose**: Centralized state management and business logic orchestration
- **Responsibilities**:
  - Form state management and validation
  - Quote calculation coordination
  - Modal state management
  - Error handling and user feedback
- **Key Features**:
  - Comprehensive state management for all form fields
  - Integration with calculation services
  - Advanced configuration management
  - Export functionality coordination

#### **quoteCalculations.ts** (191 lines) - Core Calculation Engine
- **Purpose**: Primary business logic for BESS cost and financial calculations
- **Responsibilities**:
  - System cost calculations by region and use case
  - ROI and financial metric calculations
  - Currency conversion and localization
  - Integration with advanced financial modeling
- **Key Features**:
  - Region-specific pricing algorithms
  - Use case optimization logic
  - Currency and unit conversion
  - Professional financial calculations

#### **advancedFinancialModeling.ts** (1,500+ lines) - Professional Financial Analysis
- **Purpose**: Investment-grade financial modeling for BESS projects
- **Responsibilities**:
  - Target IRR-based pricing calculations
  - Professional battery capacity fading models
  - Multiple revenue stream modeling (energy sales, capacity payments, ancillary services)
  - Debt scheduling and project financing analysis
  - Break-even analysis and sensitivity modeling
  - Risk analysis with Monte Carlo simulations
- **Key Features**:
  - Industry-standard methodologies based on eFinancialModels
  - Comprehensive degradation modeling with cycling stress factors
  - Professional tax and incentive calculations (ITC, MACRS depreciation)
  - Advanced risk assessment and scenario analysis
  - Investment-grade cash flow projections

---

## 🔄 Component Interaction Patterns

### State Management Flow
```typescript
// 1. User interacts with BessQuoteBuilder.tsx
const {
  state,
  actions,
  calculations
} = useBessQuoteBuilder();

// 2. Hook coordinates with services
const basicCalculations = calculateQuote(formData);
const advancedAnalysis = calculateAdvancedFinancialMetrics(inputs, systemCost);

// 3. Results flow back to UI
return (
  <div>
    {/* Render results */}
    <QuoteResults data={calculations} />
  </div>
);
```

### Modal System Architecture
```typescript
// Current Working System (ModalRenderer.tsx)
interface ModalState {
  activeModal: string | null;
  modalData: any;
}

// Legacy System (ModalManagerConnected.tsx)
// Note: Has prop mismatches, use ModalRenderer for new development
```

### Service Layer Integration
```typescript
// Clean separation between UI and business logic
const BessQuoteBuilder = () => {
  const { state, actions } = useBessQuoteBuilder();
  
  // UI focuses only on rendering and user interactions
  return (
    <form onSubmit={actions.calculateQuote}>
      {/* Form fields */}
    </form>
  );
};
```

---

## 🛠️ Development Workflow

### Adding New Features
1. **Update Types**: Add TypeScript interfaces in `src/types/`
2. **Extend Hook**: Add state management in `useBessQuoteBuilder.ts`
3. **Implement Logic**: Add calculations in appropriate service files
4. **Update UI**: Modify `BessQuoteBuilder.tsx` for user interface changes
5. **Test Integration**: Verify component interaction and data flow

### Modifying Calculations
1. **Simple Changes**: Update `quoteCalculations.ts` for basic cost modifications
2. **Advanced Financial**: Modify `advancedFinancialModeling.ts` for professional analysis
3. **State Updates**: Ensure `useBessQuoteBuilder.ts` hook reflects calculation changes
4. **UI Integration**: Update result display in `BessQuoteBuilder.tsx`

### Component Guidelines
- **Keep components pure**: Minimize side effects in UI components
- **Use the hook system**: All business logic should flow through hooks
- **Maintain type safety**: Always update TypeScript interfaces
- **Service layer first**: Implement logic in services before UI integration

---

## 📁 File Structure Guide

### Core Application Files
```
src/
├── App.tsx                          # Main application component
├── main.tsx                         # Application entry point
├── components/
│   ├── BessQuoteBuilder.tsx         # Main quote building interface
│   ├── ModalRenderer.tsx            # Working modal system
│   ├── ModalManagerConnected.tsx    # Legacy modal system (prop issues)
│   └── [other components]
├── hooks/
│   └── useBessQuoteBuilder.ts       # Main state management hook
├── services/
│   ├── quoteCalculations.ts         # Core calculation engine
│   ├── advancedFinancialModeling.ts # Professional financial analysis
│   ├── supabaseClient.ts           # Database connection
│   └── [other services]
└── types/
    └── [TypeScript interfaces]
```

### Configuration Files
```
├── vite.config.ts                   # Build configuration
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.cjs              # Styling configuration
├── fly.toml                         # Deployment configuration
└── package.json                     # Dependencies and scripts
```

---

## 🔧 Technical Implementation Details

### TypeScript Configuration
- **Strict Mode**: Enabled for type safety
- **verbatimModuleSyntax**: Requires explicit type imports
- **Module Resolution**: Node.js style with ESM support

### State Management Pattern
```typescript
// Hook-based state management
const useBessQuoteBuilder = () => {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [calculations, setCalculations] = useState<CalculationResults>();
  
  const calculateQuote = useCallback(() => {
    const results = quoteCalculations.calculate(formData);
    setCalculations(results);
  }, [formData]);
  
  return {
    state: { formData, calculations },
    actions: { calculateQuote, setFormData }
  };
};
```

### Service Layer Pattern
```typescript
// Pure functions for business logic
export const calculateSystemCost = (
  powerMW: number,
  durationHours: number,
  country: string,
  includeAdvanced: boolean,
  useCase: string
): SystemCostResult => {
  // Implementation with no side effects
  return {
    batteryCost,
    powerSystemCost,
    totalCost,
    // ... other results
  };
};
```

---

## 🚀 Integration with External Systems

### Supabase Integration
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: User management and session handling
- **Storage**: File uploads and document management
- **Configuration**: `src/services/supabaseClient.ts`

### Currency and Localization
- **Service**: `src/services/currencyService.ts`
- **Support**: Multi-currency calculations with real-time rates
- **Regions**: Comprehensive global pricing models

### Export Functionality
- **Word Documents**: Professional quote generation with DocX
- **PDF Export**: Comprehensive project reports
- **Data Formats**: JSON, CSV export capabilities

---

## 🛡️ Error Handling and Validation

### Type Safety Approach
- All external data validated with TypeScript interfaces
- Runtime validation for user inputs
- Comprehensive error boundaries for UI stability

### Calculation Validation
- Input validation before calculation execution
- Financial model validation with industry standards
- Error propagation through hook system

---

## 📈 Performance Considerations

### Code Optimization
- 84.8% reduction in main component size
- Efficient state management with proper dependencies
- Lazy loading for advanced features
- Service worker caching for production

### Calculation Efficiency
- Memoized calculation results
- Optimized algorithms for financial modeling
- Batch processing for complex scenarios

---

## 🔄 Migration and Upgrade Paths

### From Legacy Systems
- ModalManagerConnected.tsx → ModalRenderer.tsx
- Direct calculation calls → Hook-based state management
- Inline business logic → Service layer pattern

### Future Enhancements
- Real-time collaboration features
- Advanced market intelligence integration
- Machine learning price optimization
- Enhanced risk modeling capabilities

---

## 🎯 Best Practices for AI Agents

### Code Modification Workflow
1. **Understand the flow**: User input → Hook → Service → UI
2. **Identify the layer**: Determine if change is UI, state, or business logic
3. **Use existing patterns**: Follow established architectural patterns
4. **Maintain type safety**: Always update TypeScript interfaces
5. **Test integration**: Verify changes work across the component chain

### Common Tasks
- **Add calculation**: Extend `quoteCalculations.ts` and update hook
- **New UI feature**: Modify `BessQuoteBuilder.tsx` and hook state
- **Financial enhancement**: Update `advancedFinancialModeling.ts`
- **Modal functionality**: Use `ModalRenderer.tsx` system

### Error Prevention
- Always read existing code patterns before modifications
- Maintain consistent naming conventions
- Update type definitions when adding new features
- Test component interactions after changes

---

## 📚 Additional Resources

### Key Documentation Files
- `README.md` - Project setup and basic information
- `IMPLEMENTATION_ROADMAP.md` - Development phases and progress
- `FINANCIAL_MODEL_INSIGHTS.md` - Financial modeling methodology
- `SUPABASE_SETUP_GUIDE.md` - Database configuration

### Industry Standards
- eFinancialModels Battery Energy Pricing Model methodologies
- NREL cost modeling frameworks
- IEEE standards for energy storage systems
- Financial industry standard practices for project evaluation

---

This architecture guide provides the foundation for understanding and modifying the Merlin BESS Quote Builder. The system is designed for extensibility, maintainability, and professional-grade financial analysis capabilities.