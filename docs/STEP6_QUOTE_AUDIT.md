# Merlin V6 Audit - Step6Quote.tsx Analysis

## Date: December 28, 2025
## Auditor: Claude (AI Assistant)
## Status: ⚠️ MINOR ISSUES - Needs Button Functionality

---

## 📋 Component Overview

`Step6Quote.tsx` is the **final display component** in the wizard that shows the complete quote summary. Unlike Step5MagicFit, this component **does NOT perform calculations** - it only displays the data that was already calculated and stored in `state.calculations`.

**Key Point**: Since Step5MagicFit now uses SSOT services correctly, Step6Quote receives accurate data by default. The component itself is mostly correct, but has some display and functionality issues.

---

## ✅ GOOD: What's Working

1. **No Hardcoded Calculations** ✅
   - Component only displays `state.calculations` values
   - All calculation logic happens in Step5MagicFit (now using SSOT)
   - Receives data as props, doesn't compute anything

2. **Proper Data Flow** ✅
   - Data flows: Step5MagicFit → `state.calculations` → Step6Quote
   - Component correctly reads from `WizardState.calculations`

3. **Display Formatting** ✅
   - Proper number formatting with `toLocaleString()`
   - Clean MW/kW unit conversion
   - Conditional rendering for optional components (solar, EV, generator)

4. **Acceptable Fallbacks** ✅
   - Step5MagicFit.tsx:277 - `electricityRate` fallback (0.12 $/kWh) when utility data unavailable - **Correct pattern**
   - Step6Quote.tsx:96 - `numberOfInverters` fallback calculation for PDF export - **Acceptable**
   - Step6Quote.tsx:109 - `utilityRate` fallback (0.12 $/kWh) for PDF export when not in calculations - **Acceptable**
   - Step5MagicFit.tsx:65 - `EV_CHARGER_COST_PER_UNIT = 40000` marked with TODO - **Acceptable for now, should move to pricing service later**

---

## ⚠️ ISSUES FOUND

### 1. Hardcoded ITC Percentage Label (Minor)

**Location**: Line 184
```typescript
<span>Federal ITC (30%)</span>  // ❌ Hardcoded "30%"
```

**Issue**: The label shows hardcoded "30%" even though the actual ITC value comes from calculations. If ITC rate ever changes (e.g., 26% in 2033, or admin changes it), the label will be wrong.

**Fix**: Make it dynamic:
```typescript
// Calculate ITC percentage from the actual value
const itcPercentage = calculations.federalITC > 0 && calculations.totalInvestment > 0
  ? Math.round((calculations.federalITC / calculations.totalInvestment) * 100)
  : 30; // Fallback to 30% if can't calculate

<span>Federal ITC ({itcPercentage}%)</span>
```

**OR** better yet, since we know the ITC rate from Step5MagicFit calculations, we could store it in the calculations object:
```typescript
// In SystemCalculations interface (types.ts)
federalITC: number;
federalITCRate: number;  // Add this field
```

### 2. Non-Functional Buttons (Critical)

**Location**: Lines 236-249

**Issue**: All three CTA buttons have NO onClick handlers:
- "Request Official Quote" - No handler
- "Download PDF" - No handler  
- "Talk to Expert" - No handler

**Fix**: Wire up the buttons:

```typescript
import { useState } from 'react';
import RequestQuoteModal from '@/components/modals/RequestQuoteModal';
import { generatePDFQuote } from '@/utils/quoteExport'; // or wherever PDF export is

export function Step6Quote({ state }: Props) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { selected } = state.calculations || {}; // Destructure nested structure
  
  const handleRequestQuote = () => {
    setShowRequestModal(true);
  };
  
  const handleDownloadPDF = async () => {
    try {
      // Map wizard state to quote export format
      // NOTE: calculations uses nested { base, selected } structure
      const quoteData = {
        quoteName: `Merlin Quote - ${state.industryName}`,
        powerMW: selected.bessKW / 1000,       // ✅ Read from selected
        totalMWh: selected.bessKWh / 1000,     // ✅ Read from selected
        // ... map other fields
      };
      await generatePDFQuote(quoteData);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Unable to generate PDF. Please try again.');
    }
  };
  
  const handleTalkToExpert = () => {
    // Open contact modal or redirect to contact page
    window.open('mailto:sales@merlinenergy.com?subject=Quote Inquiry', '_blank');
    // OR use a contact modal component
  };
  
  // ... rest of component
  
  return (
    <>
      {/* Existing JSX */}
      <button onClick={handleRequestQuote} className="...">
        <Mail className="w-5 h-5" />
        Request Official Quote
      </button>
      
      <button onClick={handleDownloadPDF} className="...">
        <Download className="w-5 h-5" />
        Download PDF
      </button>
      
      <button onClick={handleTalkToExpert} className="...">
        <Phone className="w-5 h-5" />
        Talk to Expert
      </button>
      
      {/* Request Quote Modal */}
      {/* NOTE: calculations uses nested { base, selected } structure */}
      <RequestQuoteModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        quoteData={{
          storageSizeMW: selected.bessKW / 1000,       // ✅ Read from selected
          durationHours: powerLevel?.durationHours || 4,
          energyCapacity: selected.bessKWh / 1000,    // ✅ Read from selected
          solarMW: selected.solarKW / 1000,           // ✅ Read from selected
          totalCost: selected.totalInvestment,        // ✅ Read from selected
          industryName: state.industryName,
          location: `${state.city || ''} ${state.state || ''}`.trim(),
        }}
      />
    </>
  );
}
```

### 3. Quote ID Generation Issue (Minor)

**Location**: Line 86
```typescript
<div className="text-white font-mono">MQ-{Date.now().toString(36).toUpperCase()}</div>
```

**Issue**: `Date.now()` is called on every render, so the Quote ID changes every time the component re-renders. It should be generated once when the quote is created (in Step5MagicFit) and stored in state.

**Fix**: Generate quote ID in Step5MagicFit when calculations are created, add to state:

```typescript
// In Step5MagicFit.tsx, when setting calculations:
const quoteId = `MQ-${Date.now().toString(36).toUpperCase()}`;
updateState({
  selectedPowerLevel: level,
  calculations: calcWithoutPricing,
  quoteId,  // Add to WizardState
});

// In Step6Quote.tsx:
<div className="text-white font-mono">{state.quoteId || `MQ-${Date.now().toString(36).toUpperCase()}`}</div>
```

### 4. Missing TrueQuote™ Attribution (Enhancement)

**Location**: No TrueQuote badge present

**Issue**: Step5MagicFit shows TrueQuote™ Verified Pricing badge with data sources. Step6Quote should also show this for transparency.

**Fix**: Since Step5MagicFit strips `pricingData` before storing in state, we could:
- Option A: Keep `pricingData` in state (add to WizardState)
- Option B: Show a simple "Pricing verified by TrueQuote™" badge without sources
- Option C: Store pricing sources as a string array in calculations

**Recommendation**: Option C - add `pricingSources: string[]` to `SystemCalculations` interface, populate in Step5MagicFit, display in Step6Quote.

### 5. Missing Utility Rate Info (Enhancement)

**Location**: After financial summary section

**Issue**: Step5MagicFit shows utility rate info at the bottom. Step6Quote should also show this so users know what rates were used.

**Fix**: Similar to pricing sources, store utility info in calculations or state:

```typescript
// In SystemCalculations (types.ts)
utilityName?: string;
utilityRate?: number;
demandCharge?: number;
hasTOU?: boolean;

// Display in Step6Quote:
{calculations.utilityName && (
  <div className="max-w-3xl mx-auto p-3 bg-slate-800/30 rounded-lg text-center text-sm text-slate-400">
    Calculations based on <span className="text-white">{calculations.utilityName}</span> rates: 
    ${calculations.utilityRate?.toFixed(2)}/kWh, 
    ${calculations.demandCharge}/kW demand charge
  </div>
)}
```

---

## 📊 Impact Assessment

| Issue | Severity | Impact | Priority |
|-------|----------|--------|----------|
| Non-functional buttons | 🔴 Critical | Users can't request quotes or download PDFs | HIGH |
| Hardcoded ITC label | 🟡 Minor | Label might be wrong if ITC changes | MEDIUM |
| Quote ID regeneration | 🟡 Minor | ID changes on re-render (confusing) | LOW |
| Missing TrueQuote badge | 🟢 Enhancement | Less transparency | LOW |
| Missing utility info | 🟢 Enhancement | Less context for users | LOW |

---

## 🔧 Recommended Fixes (Priority Order)

### Priority 1: Wire Up Buttons (Critical)
1. Add `useState` for modals
2. Import `RequestQuoteModal` component
3. Implement `handleRequestQuote`, `handleDownloadPDF`, `handleTalkToExpert`
4. Check if PDF export service exists, create if needed

### Priority 2: Fix ITC Label (Easy Fix)
1. Calculate ITC percentage dynamically from actual values
2. Add fallback to 30% if calculation fails

### Priority 3: Store Quote ID (Data Integrity)
1. Generate quote ID in Step5MagicFit when quote is created
2. Add `quoteId` to WizardState interface
3. Display stored quote ID in Step6Quote

### Priority 4: Add Attribution (Nice to Have)
1. Add `pricingSources` and utility info fields to `SystemCalculations`
2. Populate in Step5MagicFit
3. Display in Step6Quote with TrueQuote™ badge

---

## 📝 Code Changes Required

### 1. Update `types.ts`
```typescript
export interface SystemCalculations {
  // ... existing fields ...
  federalITCRate?: number;      // Add ITC rate
  quoteId?: string;              // Add quote ID
  pricingSources?: string[];     // Add pricing sources
  utilityName?: string;          // Add utility info
  utilityRate?: number;
  demandCharge?: number;
  hasTOU?: boolean;
}
```

### 2. Update Step5MagicFit.tsx
```typescript
// When creating calculations, include new fields:
return {
  // ... existing fields ...
  federalITCRate: FEDERAL_ITC_RATE,
  quoteId: `MQ-${Date.now().toString(36).toUpperCase()}`,
  pricingSources: pricingData.pricingSources,
  utilityName: utilityData?.utilityName,
  utilityRate: electricityRate,
  demandCharge,
  hasTOU,
};
```

### 3. Update Step6Quote.tsx
- Add button handlers
- Import RequestQuoteModal
- Fix ITC label to use `calculations.federalITCRate`
- Display quote ID from state
- Add TrueQuote badge and utility info

---

## 🧪 Testing Checklist

- [ ] "Request Official Quote" button opens modal with correct quote data
- [ ] "Download PDF" button generates and downloads PDF
- [ ] "Talk to Expert" button opens contact method
- [ ] ITC percentage displays correctly (should match actual ITC rate)
- [ ] Quote ID remains stable across re-renders
- [ ] TrueQuote badge shows (if implemented)
- [ ] Utility rate info displays (if implemented)
- [ ] All financial values match Step5MagicFit calculations

---

## 📚 Related Files

- `src/components/wizard/v6/steps/Step5MagicFit.tsx` - Source of calculations
- `src/components/wizard/v6/types.ts` - Type definitions
- `src/components/modals/RequestQuoteModal.tsx` - Quote request modal
- `src/utils/quoteExport.ts` - PDF export utility (check if exists)
- `src/services/unifiedPricingService.ts` - Pricing SSOT
- `src/services/utilityRateService.ts` - Utility rate SSOT

---

## ✅ Sign-off

- [x] Issues identified
- [x] Root causes analyzed
- [ ] Fixes implemented
- [ ] Code reviewed
- [ ] Tested in development
- [ ] Deployed to production

---

## 💡 Notes

- Step6Quote is mostly correct because it only displays data
- Main issue is missing button functionality
- Consider adding loading states for PDF generation
- PDF export service may need to be created/updated to work with V6 wizard state structure

