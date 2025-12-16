# Hero Redesign: Step 0 Quick Estimate Calculator

## Overview

**Date**: December 2025  
**Status**: HotelEnergy ✅ Complete | EVChargingEnergy ⏳ | CarWashEnergy ⏳ | Main HeroSection ⏳

The hero section redesign replaces the rotating carousel with an interactive **Quick Estimate Calculator** (Step 0). Users play with the calculator to arrive at an estimate they like, then click "Build My Quote" to enter the wizard at Step 1 with their values pre-filled.

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HERO SECTION (Step 0)                                    │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │ Left Side               │  │ Right Side: Quick Estimate Calculator   │   │
│  │ - Headline             │  │                                         │   │
│  │ - Annual Savings (big) │  │ - State selector                        │   │
│  │ - TrueQuote badge      │  │ - Facility-specific input (rooms, bays) │   │
│  │ - "How Merlin Works"   │  │ - Monthly bill slider                   │   │
│  └─────────────────────────┘  │ - Live Results (savings, payback, ITC)  │   │
│                               │ - "Build My Quote" CTA button           │   │
│                               └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ onClick: setShowWizard(true)
                                      │ Pass: initialData with Step 0 values
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STREAMLINED WIZARD (Steps 1-5)                           │
│                                                                             │
│  Step 1 (Section 2): Facility Details - Pre-filled with Step 0 values      │
│  Step 2 (Section 3): Goals & Add-ons                                        │
│  Step 3 (Section 4): System Configuration                                   │
│  Step 4 (Section 5): Review Quote                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Step 0 → Wizard Data Flow

### Props to StreamlinedWizard

```tsx
<StreamlinedWizard
  show={showWizard}
  initialUseCase="hotel"              // Auto-selects use case
  initialState={inputs.state}         // Pre-fills location
  initialData={{
    // Step 0 values from Quick Estimate Calculator
    roomCount: inputs.numberOfRooms,
    hotelClass: inputs.hotelClass,
    currentMonthlyBill: inputs.currentMonthlyBill,
    
    // Estimated from Step 0 (optional - can be used for progress tracking)
    estimatedAnnualSavings: heroEstimate.savings,
    estimatedPayback: heroEstimate.payback,
    
    // Vertical-specific fields
    hasPool: inputs.hasPool,
    hasRestaurant: inputs.hasRestaurant,
  }}
  onClose={() => setShowWizard(false)}
  onFinish={() => setShowWizard(false)}
/>
```

### How Wizard Handles initialData

In `useStreamlinedWizard.ts`:

```tsx
// When wizard opens with initialUseCase
setWizardState(prev => ({
  ...prev,
  selectedIndustry: useCase.slug,
  industryName: useCase.name,
  useCaseId: useCase.id,
  customQuestions: questions || [],
  state: initialState || prev.state,
  useCaseData: initialData || {},  // ← Step 0 values go here
}));

// Skip to Section 2 (Facility Details)
setCurrentSection(2);
```

## Quick Estimate Calculator UI

### Required Elements (per vertical)

| Element | Hotel | EV Charging | Car Wash |
|---------|-------|-------------|----------|
| State selector | ✅ | ✅ | ✅ |
| Primary input | Number of rooms | Number of chargers | Number of bays |
| Auto-class display | Hotel class | Charger mix | Wash type |
| Monthly bill slider | $5K-$200K | $2K-$50K | $1K-$20K |
| Live savings | Annual savings | Annual savings | Annual savings |
| Payback display | Years | Years | Years |
| Tax credit | 30% ITC | 30% ITC | 30% ITC |

### Styling Pattern

```tsx
// Hero container (dark gradient background)
<section className="relative min-h-[85vh] bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 overflow-hidden">

// Left side: Big number display
<div className="text-6xl md:text-8xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
  ${heroEstimate.savings.toLocaleString()}
</div>
<p className="text-xl text-emerald-300">Estimated Annual Savings</p>

// Right side: Calculator card
<div className="bg-gradient-to-br from-slate-900/95 via-indigo-900/80 to-slate-900/95 backdrop-blur-xl rounded-3xl p-6 border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/30">

// CTA button (gradient with pulse animation)
<button className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white rounded-xl font-black text-lg transition-all hover:scale-[1.02]">
  <Sparkles className="w-5 h-5" />
  Build My Full Quote
  <ArrowRight className="w-5 h-5" />
</button>
```

## Success Stories Carousel

The carousel is NOT removed - it moves below the hero as a horizontal scroll section:

```tsx
<section className="py-12 bg-gradient-to-b from-indigo-900/30 via-purple-900/20 to-indigo-900/30 overflow-hidden">
  <div className="max-w-7xl mx-auto px-6">
    <h2 className="text-2xl font-bold text-white mb-2">Real Hotel Success Stories</h2>
    
    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-indigo-500">
      {CAROUSEL_IMAGES.map((image, index) => (
        <div key={index} className="flex-shrink-0 w-72 bg-gradient-to-br from-slate-900 via-indigo-900/50 to-slate-900 rounded-2xl">
          {/* Card with image, title, savings, payback */}
        </div>
      ))}
    </div>
  </div>
</section>
```

## Implementation Checklist

### Per Vertical

- [ ] Replace hero section with Quick Estimate Calculator
- [ ] Add state selector (from STATE_RATES)
- [ ] Add primary facility input (rooms/bays/chargers)
- [ ] Add auto-detection display (hotel class/wash type/charger mix)
- [ ] Add monthly bill slider
- [ ] Add live results display (savings, payback, ITC)
- [ ] Add "Build My Quote" CTA
- [ ] Wire initialData to StreamlinedWizard
- [ ] Move carousel below hero as horizontal scroll
- [ ] Test Step 0 → Step 1 data flow
- [ ] Verify wizard pre-fills correctly

### Status by File

| File | Status | Notes |
|------|--------|-------|
| [HotelEnergy.tsx](../src/components/verticals/HotelEnergy.tsx) | ✅ Complete | Proof of concept |
| EVChargingEnergy.tsx | ⏳ Pending | Apply pattern |
| CarWashEnergy.tsx | ⏳ Pending | Apply pattern |
| HeroSection.tsx | ⏳ Pending | Main homepage - different pattern |

## SSOT Compliance

### heroEstimate Calculation

Uses the same SSOT calculation as the rest of the page:

```tsx
const heroEstimate = useMemo(() => {
  const result = calculateHotelPower({ ...inputs });
  return {
    savings: Math.round(result.peakKW * stateData.demandCharge * 12 * 0.35),
    payback: 4.2,  // Will be refined via TrueQuote
    peakKW: result.peakKW,
    dailyKWh: result.dailyKWh,
  };
}, [inputs, stateData]);
```

**Note**: For full SSOT compliance, `heroEstimate` should eventually call `calculateQuote()` from `unifiedQuoteCalculator.ts`. The current calculation is a simplified estimate for fast UI response.

## TrueQuote Badge Integration

The hero includes TrueQuote badge and methodology link:

```tsx
<div className="flex items-center gap-4 text-sm">
  <button onClick={() => setShowTrueQuoteModal(true)} className="text-indigo-300 text-sm hover:text-white">
    Every number sourced →
  </button>
  <span className="text-indigo-500">|</span>
  <button onClick={() => scrollToHowItWorks()}>
    <img src={merlinImage} alt="" className="w-5 h-5" />
    How Merlin Works
  </button>
</div>
```

## Next Steps

1. Apply pattern to EVChargingEnergy.tsx
2. Apply pattern to CarWashEnergy.tsx
3. Consider main HeroSection.tsx (generic industry selector in calculator)
4. Add PowerProfile tracking for Step 0 values
5. Enhance wizard to show "Estimate from Step 0" comparison

---

## For AI Agents

**When continuing this work:**

1. Start with this doc to understand the pattern
2. Reference [HotelEnergy.tsx](../src/components/verticals/HotelEnergy.tsx) as the working example
3. Use the same CSS classes and structure
4. Ensure initialData includes all Step 0 values
5. Test the full flow: Hero Calculator → Build My Quote → Wizard Step 1

**Key files:**
- `src/components/verticals/*.tsx` - Vertical landing pages
- `src/components/wizard/hooks/useStreamlinedWizard.ts` - Handles initialData
- `src/components/wizard/types/wizardTypes.ts` - Type definitions
- `src/services/useCasePowerCalculations.ts` - SSOT for power calculations
