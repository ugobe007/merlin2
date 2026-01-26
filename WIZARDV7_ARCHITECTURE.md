# WIZARDV7 ARCHITECTURE
## January 22, 2026

## ✅ LAYOUT FIXES APPLIED (Jan 22, 2026)

**Problem:** Step 1 and Step 2 had:
1. Mismatched gutters causing visual drift
2. Vertically centered columns (`items-center justify-center`) making padding feel inconsistent
3. Missing `min-h-0` on flex parents causing scroll/overflow to "fight" the container
4. Prop mismatches between WizardV7 and Step components

**Solution:** Applied consistent top-aligned layout pattern across all steps.

### Fixed Steps:
- ✅ **Step2Goals.tsx** - Unified p-8 gutters, proper flex scrolling with min-h-0
- ✅ **Step1LocationV7.tsx** - Top-aligned columns, NO vertical centering, responsive ZIP tracking

### Critical Layout Rules (ALL STEPS MUST FOLLOW):

**1. NO VERTICAL CENTERING in columns:**
```tsx
// ❌ WRONG - Creates inconsistent padding feel
<div className="flex items-center justify-center">

// ✅ CORRECT - Top-aligned, predictable
<div className="flex flex-col min-h-0">
```

**2. Both columns must use flex-col + min-h-0:**
```tsx
<div className="h-full min-h-0 grid grid-cols-2">
  {/* LEFT COLUMN */}
  <div className="min-h-0 flex flex-col">
    {/* Header (fixed height) */}
    <div className="px-12 pt-12 pb-8">{/* ... */}</div>
    
    {/* Scroll area */}
    <div className="flex-1 min-h-0 overflow-y-auto px-12 pb-12">
      {/* Content */}
    </div>
  </div>

  {/* RIGHT COLUMN */}
  <div className="min-h-0 flex flex-col bg-white/[0.02]">
    {/* Header */}
    <div className="px-8 pt-8 pb-4">{/* ... */}</div>
    
    {/* Scroll area */}
    <div className="flex-1 min-h-0 overflow-y-auto px-10 pb-10">
      {/* Content */}
    </div>
  </div>
</div>
```

**3. WizardV7 wrapper MUST have min-h-0:**
```tsx
// In WizardV7.tsx:
<div className="flex-1 overflow-hidden min-h-0">
  <div className="p-8 h-full">
    {currentStep === 1 && <Step1LocationV7 {...props} />}
  </div>
</div>
```

**4. ZIP Input tracking must be responsive:**
```tsx
// ❌ WRONG - tracking-[12px] looks like padding misalignment
className="text-4xl tracking-[12px]"

// ✅ CORRECT - Responsive em-based tracking
className="text-3xl tracking-[0.35em] md:text-4xl md:tracking-[0.45em]"
```

### Key Rules:
1. **Unified gutters:** Both columns use `p-8` (tight + aligned)
2. **Proper flex scrolling:** Both columns `flex flex-col min-h-0`
3. **Single scroll per column:** `flex-1 min-h-0 overflow-y-auto`
4. **Attached advisor:** `border-l` (not `border-l-4`), no excessive px-16
5. **No random padding:** Cards use consistent `p-5` or `p-6`, never `p-8` inside columns

### File Structure Changes:
```
src/components/wizard/v7/steps/
├── Step1Location.tsx          # ❌ OLD - Had two components in one file
├── Step1LocationV7.tsx        # ✅ NEW - Clean layout, matches WizardV7 props
├── Step1AdvisorLed.tsx        # ℹ️ Alternative implementation (not used in V7)
└── Step2Goals.tsx             # ✅ FIXED - Clean layout applied
```

---

## 🎯 Vision: Vineet's UX Requirements

**Goal:** Transform 16Q questionnaire into an intelligent, engaging experience that shows value BEFORE asking questions.

### Core Components (3-4 Week Build)

```
src/components/wizard/v7/
├── WizardV7.tsx                    # Main orchestrator
├── steps/
│   ├── Step0Welcome.tsx            # Location + industry selection
│   ├── Step1Opportunity.tsx        # Opportunity cards (show ROI first)
│   ├── Step2Questionnaire.tsx      # Live 16Q with previews
│   ├── Step3Configuration.tsx      # Starter/Recommended/Maximum cards
│   └── Step4Results.tsx            # Final quote with export
├── advisor/
│   ├── AIEnergyAdvisor.tsx        # Conversational AI personality
│   ├── AdvisorAvatar.tsx          # Animated avatar
│   └── AdvisorMessages.tsx        # Context-aware messages
├── opportunity/
│   ├── OpportunityCard.tsx        # ROI card component
│   ├── IndustryInsights.tsx       # Industry-specific insights
│   └── SavingsPreview.tsx         # Live savings calculation
├── live-preview/
│   ├── LiveCalculationPanel.tsx   # Real-time as user answers
│   ├── PowerGauge.tsx             # Visual power demand gauge
│   └── SavingsCounter.tsx         # Animated savings ticker
├── configuration/
│   ├── ConfigurationCard.tsx      # Starter/Recommended/Maximum
│   ├── AddOnToggle.tsx            # Solar, EV, Generator toggles
│   └── ComparisonTable.tsx        # Side-by-side comparison
└── shared/
    ├── ProgressTracker.tsx        # Visual progress indicator
    └── QuoteExporter.tsx          # PDF/Word/Excel export
```

## 🚀 Phase 1: Foundation (Week 1)

**Goal:** Basic routing + AI Advisor + Opportunity Cards

### Day 1-2: Routing + Skeleton
- [ ] Create `/wizard-v7` route
- [ ] Build WizardV7.tsx orchestrator (lean, hook-based like StreamlinedWizard)
- [ ] Create Step0Welcome.tsx (location + industry)
- [ ] Wire up to existing 16Q database

### Day 3-4: AI Energy Advisor
- [ ] Build AIEnergyAdvisor.tsx with personality
- [ ] Create AdvisorAvatar.tsx (animated character)
- [ ] Write context-aware messages for each industry
- [ ] Add conversational transitions between steps

### Day 5-7: Opportunity Cards
- [ ] Build OpportunityCard.tsx
- [ ] Show ROI estimates BEFORE questionnaire
- [ ] Industry-specific insights (e.g., "Hotels save $40K/year")
- [ ] Pull data from existing 7 calculators

## 📊 Phase 2: Live Previews (Week 2)

### Day 8-10: Real-Time Calculations
- [ ] Build LiveCalculationPanel.tsx
- [ ] Wire to existing 16Q calculators
- [ ] Show peakKW, bessKWh, confidence as user answers
- [ ] Animated PowerGauge.tsx
- [ ] Animated SavingsCounter.tsx

### Day 11-14: Questionnaire Enhancement
- [ ] Build Step2Questionnaire.tsx
- [ ] Integrate CompleteQuestionRenderer (reuse from V6)
- [ ] Live preview updates on every answer
- [ ] Progress indicator with completion %
- [ ] Smart validation with helpful errors

## ⚙️ Phase 3: Configuration (Week 3)

### Day 15-17: Configuration Cards
- [ ] Build ConfigurationCard.tsx
- [ ] 3 presets: Starter (conservative), Recommended (optimal), Maximum (aggressive)
- [ ] Show peakKW, bessKWh, cost, savings for each
- [ ] Side-by-side ComparisonTable.tsx

### Day 18-21: Add-On Toggles
- [ ] Build AddOnToggle.tsx
- [ ] Solar toggle (auto-size based on peak)
- [ ] Generator toggle (backup power)
- [ ] EV charger toggle
- [ ] Live price updates as toggles change

## 🎨 Phase 4: Polish (Week 4)

### Day 22-24: Mobile Responsive
- [ ] Test all components on mobile
- [ ] Adjust layouts for < 768px
- [ ] Touch-friendly controls
- [ ] Optimize animations for mobile

### Day 25-27: Testing + Bug Fixes
- [ ] Test all 7 industries end-to-end
- [ ] Validate calculations match V6
- [ ] Fix any edge cases
- [ ] Performance optimization

### Day 28: Launch Prep
- [ ] A/B testing setup
- [ ] Analytics tracking
- [ ] Documentation
- [ ] Deploy to production

## 🔧 Technical Architecture

### State Management
Use same pattern as StreamlinedWizard:
- Hook-based state (`useWizardV7.ts`)
- No Redux/context (keep it simple)
- Local state + URL params for shareable links

### Calculator Integration
**Reuse existing 7 calculators** (no duplication):
```typescript
import { calculateCarWashFromAnswers } from '@/services/calculators/carWashIntegration';

// In Step2Questionnaire.tsx:
useEffect(() => {
  if (industry && answers) {
    const metrics = calculateCarWashFromAnswers(answers);
    setLivePreview(metrics);
  }
}, [answers, industry]);
```

### Database
**Same 16Q database** as V6:
- `use_cases` table
- `custom_questions` table
- No new migrations needed

### Styling
- Tailwind CSS (consistent with V6)
- Framer Motion for animations
- Radix UI for accessible components

## 📈 Success Metrics

**Completion Rate:**
- V6 current: ~45%
- V7 target: >70%

**Time to Complete:**
- V6 current: ~12 minutes
- V7 target: <8 minutes

**Quote Accuracy:**
- V6 current: 0.75 confidence avg
- V7 target: 0.85 confidence avg

**User Satisfaction:**
- V6 current: NPS unknown
- V7 target: NPS >50

## 🎯 Key Differentiators

1. **Show Value First:** Opportunity cards before questions
2. **Live Feedback:** See calculations update in real-time
3. **AI Personality:** Conversational advisor guides user
4. **Configuration Choice:** Let user pick sizing strategy
5. **Add-On Flexibility:** Toggle solar/generator/EV easily

## 🔄 V6 vs V7 Comparison

| Feature | WizardV6 | WizardV7 |
|---------|----------|----------|
| **Route** | `/wizard` | `/wizard-v7` |
| **Architecture** | Monolithic (2,674 lines) | Modular (hooks + components) |
| **Questions** | All at once | Progressive disclosure |
| **Calculations** | End only | Live preview |
| **AI Advisor** | None | Conversational personality |
| **Opportunity Cards** | None | Show ROI first |
| **Configuration** | One size | 3 presets + add-ons |
| **Mobile** | Desktop-first | Mobile-first |
| **Launch** | Production now | 3-4 weeks |

## 🚀 Launch Strategy

**Soft Launch:**
- Hidden route `/wizard-v7` (no link from homepage)
- Internal testing with team
- Beta users via direct link

**A/B Test:**
- 50% users see V6, 50% see V7
- Track completion rate, time, satisfaction
- 2-week test period

**Full Launch:**
- If V7 metrics 20%+ better than V6
- Replace `/wizard` route with V7
- Keep V6 as `/wizard-v6` for 1 month (rollback safety)

## 📝 Notes

- **Reuse calculators:** All 7 industry calculators work with V7 (no changes needed)
- **Reuse database:** Same 16Q structure, no migrations
- **Side-by-side:** V6 and V7 can run simultaneously
- **Zero breaking changes:** V6 stays production-ready during V7 build
