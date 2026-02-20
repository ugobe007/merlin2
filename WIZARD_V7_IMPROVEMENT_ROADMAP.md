# Wizard V7 Improvement Roadmap

**Date**: Feb 20, 2026  
**Status**: Production-ready baseline → Optimization opportunities identified

---

## 🎯 Current V7 State (Strengths)

✅ **Already Excellent:**
- 601 KB bundle (76% smaller than V6)
- TrueQuote™ + ProQuote fully integrated
- 4-step wizard with curated 16Q questionnaire
- Merlin Memory system (persistent cross-step data)
- Google Places API integration
- Advanced analytics (8760 hourly, Monte Carlo, ITC bonuses)
- Step gate validators (SSOT compliance)
- AI self-healing monitoring (wizardAIAgent)
- 2,288 tests passing

---

## 🚀 High-Impact Improvements (Priority Order)

### 1. Quick Quote Mode ⚡ (Estimated: 4-6 hours)

**Problem**: Users who know their requirements must click through all 4 steps

**Solution**: Add "Express Quote" path that skips to results

**Implementation:**
```typescript
// Add to WizardV7Page.tsx
const [quickQuoteMode, setQuickQuoteMode] = useState(false);

// Quick quote panel (shown before Step 1)
<QuickQuotePanel
  onStartExpress={() => {
    setQuickQuoteMode(true);
    // Pre-fill with intelligent defaults
    wizard.submitLocation({ /* auto-detect */ });
    wizard.selectIndustry('auto'); // Generic
    wizard.skipToResults();
  }}
  onStartGuided={() => setQuickQuoteMode(false)}
/>
```

**Features:**
- "I know my system size" → Skip to Step 5 (MagicFit)
- "Just give me a ballpark" → Auto-generate with regional averages
- "I have a bill" → Upload utility bill, extract usage, generate quote

**User Impact:**
- Express users: 4 steps → 1 step (75% faster)
- Time to quote: 5-10 minutes → 30 seconds

**Files to modify:**
- `src/pages/WizardV7Page.tsx` - Add quick quote mode
- `src/wizard/v7/hooks/useWizardV7.ts` - Add `skipToResults()` action
- `src/components/wizard/v7/shared/QuickQuotePanel.tsx` - NEW component

---

### 2. Save & Resume Progress 💾 (Estimated: 6-8 hours)

**Problem**: Users lose progress if they close the browser

**Solution**: Auto-save to localStorage + optional cloud save

**Implementation:**
```typescript
// Add to useWizardV7.ts
useEffect(() => {
  // Auto-save every 30 seconds
  const saveInterval = setInterval(() => {
    const snapshot = {
      step: state.step,
      location: state.location,
      industry: state.industry,
      answers: state.answers,
      timestamp: Date.now(),
    };
    localStorage.setItem('v7_progress', JSON.stringify(snapshot));
  }, 30000);
  
  return () => clearInterval(saveInterval);
}, [state]);

// On mount, check for saved progress
useEffect(() => {
  const saved = localStorage.getItem('v7_progress');
  if (saved) {
    const { step, ...data } = JSON.parse(saved);
    // Show "Resume from [Step X]?" prompt
    setShowResumePrompt(true);
  }
}, []);
```

**Features:**
- Auto-save every 30 seconds (localStorage)
- "Resume Progress" banner on return
- Optional: Cloud save for logged-in users (Supabase)
- "Clear Progress" button
- Progress expiry (7 days)

**User Impact:**
- No lost work from accidental closes
- Higher completion rate (reduce drop-off)
- Trust: "It remembers me"

**Files to modify:**
- `src/wizard/v7/hooks/useWizardV7.ts` - Add auto-save + restore
- `src/components/wizard/v7/shared/ResumeProgressBanner.tsx` - NEW component

---

### 3. Share Quote Feature 🔗 (Estimated: 8-10 hours)

**Problem**: Users can't easily share quotes with stakeholders

**Solution**: Generate shareable public URLs for quotes

**Implementation:**
```typescript
// Add to Step 6 (results)
const shareQuote = async () => {
  // Generate short code
  const shortCode = nanoid(8); // e.g., "X7mK9pQ2"
  
  // Save quote snapshot to database
  await supabase.from('shared_quotes').insert({
    short_code: shortCode,
    quote_data: JSON.stringify(quote),
    created_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });
  
  // Generate public URL
  const shareUrl = `https://merlin2.fly.dev/q/${shortCode}`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl);
  toast.success('Quote link copied!');
};
```

**Features:**
- One-click share (generates public URL)
- Shareable link: `merlin2.fly.dev/q/X7mK9pQ2`
- Read-only view (no editing)
- Optional password protection
- Expiration (30 days default)
- View counter (track engagement)

**User Impact:**
- Share with CFO, board, partners without email
- Track who views the quote
- Professional presentation

**Files to create:**
- `src/pages/SharedQuotePage.tsx` - NEW public viewer
- `src/components/wizard/v7/shared/ShareQuoteModal.tsx` - NEW component
- Database migration: `shared_quotes` table

---

### 4. Mobile Optimization 📱 (Estimated: 10-12 hours)

**Problem**: Mobile experience is functional but not optimized

**Solution**: Mobile-first redesign for Steps 1-6

**Implementation:**
```typescript
// Add mobile-specific components
<MobileWizardShell>
  {/* Collapsible header */}
  <MobileHeader 
    step={state.step}
    progress={progressPercent}
  />
  
  {/* Full-screen step content */}
  <MobileStepContainer>
    {renderStep()}
  </MobileStepContainer>
  
  {/* Sticky bottom navigation */}
  <MobileNavigation
    canGoBack={canGoBack}
    canProceed={canProceed}
    onBack={handleBack}
    onNext={handleNext}
  />
</MobileWizardShell>
```

**Features:**
- Touch-optimized buttons (44px minimum)
- Swipe navigation (left/right between steps)
- Bottom sheet for advisor (not sidebar)
- Collapsible sections (accordion pattern)
- Mobile-friendly file upload
- Auto-zoom prevention (`user-scalable=no`)

**User Impact:**
- 40%+ of users are mobile
- Reduce mobile bounce rate
- Increase mobile conversions

**Files to create:**
- `src/components/wizard/v7/mobile/` - NEW directory
- `MobileWizardShell.tsx`, `MobileHeader.tsx`, `MobileNavigation.tsx`

---

### 5. Comparison Mode 📊 (Estimated: 12-15 hours)

**Problem**: Users can't compare multiple system configurations

**Solution**: Side-by-side comparison table

**Implementation:**
```typescript
// Add comparison state to useWizardV7
const [comparisonSlots, setComparisonSlots] = useState<QuoteResult[]>([]);

// Add comparison actions
const addToComparison = (quote: QuoteResult) => {
  if (comparisonSlots.length < 3) {
    setComparisonSlots([...comparisonSlots, quote]);
  }
};

const clearComparison = () => setComparisonSlots([]);
```

**Features:**
- "Add to Comparison" button on Step 5 (MagicFit cards)
- Compare up to 3 configurations side-by-side
- Highlight differences (green = best, red = worst)
- Export comparison as PDF
- "Create Custom" from comparison

**Comparison Metrics:**
- Initial investment
- Annual savings
- Payback period
- 25-year NPV
- Carbon offset
- System size (kW/kWh)

**User Impact:**
- Informed decision-making
- "Good, Better, Best" presentation
- Easier stakeholder buy-in

**Files to create:**
- `src/components/wizard/v7/shared/ComparisonTable.tsx` - NEW component
- `src/wizard/v7/hooks/useComparison.ts` - NEW hook

---

### 6. AI-Powered Recommendations 🤖 (Estimated: 15-20 hours)

**Problem**: Current advisor is rule-based, not adaptive

**Solution**: Use OpenAI to generate personalized recommendations

**Implementation:**
```typescript
// Add AI recommendation service
const generateAIRecommendation = async (wizardState: WizardState) => {
  const prompt = `
    Industry: ${wizardState.industry}
    Location: ${wizardState.location?.state}
    Peak demand: ${wizardState.peakKW} kW
    Usage pattern: ${wizardState.operatingHours} hrs/day
    Goals: ${wizardState.goals.join(', ')}
    
    Generate a personalized BESS recommendation including:
    1. Optimal system size (kW/kWh)
    2. Key financial benefits
    3. Risk factors specific to this business
    4. Next steps for implementation
  `;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  
  return response.choices[0].message.content;
};
```

**Features:**
- Personalized insights based on industry + location
- "Why this works for you" explanations
- Risk mitigation strategies
- Implementation timeline
- Financing options recommendation

**User Impact:**
- Higher trust (AI feels smarter)
- Better matches (not one-size-fits-all)
- Reduced support tickets

**Files to create:**
- `src/services/aiRecommendationService.ts` - NEW service
- `src/components/wizard/v7/shared/AIInsightsPanel.tsx` - NEW component

---

### 7. Accessibility (WCAG 2.1 AA) ♿ (Estimated: 8-10 hours)

**Problem**: Some users with disabilities can't use wizard

**Solution**: Full WCAG 2.1 AA compliance

**Implementation:**
```typescript
// Add keyboard navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' && canProceed) {
      handleNext();
    }
    if (e.key === 'ArrowLeft' && canGoBack) {
      handleBack();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canProceed, canGoBack]);
```

**Features:**
- Keyboard navigation (arrow keys, Enter, Esc)
- Screen reader support (ARIA labels)
- Focus management (trap focus in modals)
- Color contrast compliance (4.5:1 ratio)
- Skip navigation links
- Error announcements (live regions)

**Audit Checklist:**
- [ ] All buttons have `aria-label`
- [ ] Form inputs have `<label>` elements
- [ ] Modals have `role="dialog"` + `aria-modal="true"`
- [ ] Images have `alt` text
- [ ] Colors meet contrast ratio
- [ ] Focus visible on all interactive elements

**User Impact:**
- Legal compliance (ADA)
- Wider user base
- Better SEO (accessibility helps rankings)

**Files to modify:**
- ALL step components - Add ARIA labels
- `src/components/wizard/v7/shared/WizardShellV7.tsx` - Keyboard nav

---

### 8. Real-Time Collaboration 🤝 (Estimated: 20-25 hours)

**Problem**: Teams can't work on quotes together

**Solution**: Multi-user editing with presence indicators

**Implementation:**
```typescript
// Use Supabase Realtime
const channel = supabase.channel(`wizard:${sessionId}`);

channel
  .on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState();
    setActiveUsers(Object.values(newState));
  })
  .on('broadcast', { event: 'state_change' }, (payload) => {
    // Update wizard state from collaborator
    updateStateFromRemote(payload.state);
  })
  .subscribe();

// Broadcast state changes
const broadcastStateChange = (newState: Partial<WizardState>) => {
  channel.send({
    type: 'broadcast',
    event: 'state_change',
    payload: { state: newState },
  });
};
```

**Features:**
- Real-time presence indicators ("John is on Step 3")
- Shared cursor positions
- Live state synchronization
- Comment threads on each step
- "Take over" mode (prevent conflicts)
- Activity log ("Jane changed solar size to 500 kW")

**User Impact:**
- Teams collaborate efficiently
- Faster decision-making
- Audit trail for compliance

**Files to create:**
- `src/wizard/v7/collaboration/` - NEW directory
- `useCollaboration.ts`, `PresenceIndicator.tsx`, `CommentThread.tsx`

---

### 9. Performance Optimizations ⚡ (Estimated: 6-8 hours)

**Problem**: Some steps re-render unnecessarily

**Solution**: Memoization + React.memo + Profiler

**Implementation:**
```typescript
// Memoize expensive calculations in useWizardV7
const step3Schema = useMemo(
  () => resolveStep3Schema(state.industry, state.location?.state),
  [state.industry, state.location?.state]
);

const estimatedSavings = useMemo(
  () => calculateSavings(state.peakKW, state.electricityRate),
  [state.peakKW, state.electricityRate]
);

// Wrap step components in React.memo
export const Step3ProfileV7Curated = React.memo(({ ... }) => {
  // Component code
});
```

**Optimizations:**
1. **Memoize calculations** - useCallback, useMemo for expensive ops
2. **Code-split steps** - Lazy load Steps 4-6
3. **Debounce inputs** - Don't recalculate on every keystroke
4. **Virtual scrolling** - Long lists (industry selector)
5. **Image optimization** - WebP format, lazy loading
6. **Request caching** - Cache API responses (utility rates, etc.)

**Metrics to track:**
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Step transition time

**User Impact:**
- Faster step transitions
- Smoother typing experience
- Lower CPU usage (better battery life)

**Files to modify:**
- `src/wizard/v7/hooks/useWizardV7.ts` - Add memoization
- All step components - Wrap in React.memo

---

### 10. Analytics & Conversion Tracking 📈 (Estimated: 8-10 hours)

**Problem**: No visibility into user behavior + drop-off points

**Solution**: Comprehensive analytics + funnel tracking

**Implementation:**
```typescript
// Add analytics events
const trackStepComplete = (step: WizardStep, timeSpent: number) => {
  analytics.track('wizard_step_complete', {
    step,
    timeSpent,
    industry: state.industry,
    location: state.location?.state,
    timestamp: Date.now(),
  });
};

const trackDropOff = (step: WizardStep, reason?: string) => {
  analytics.track('wizard_drop_off', {
    step,
    reason,
    completionPercent: getCompletionPercent(),
  });
};
```

**Events to track:**
1. **Funnel metrics:**
   - Step 1 → Step 2 conversion
   - Step 2 → Step 3 conversion
   - Step 3 → Step 4 conversion
   - Step 5 → Step 6 (quote generation)

2. **Engagement metrics:**
   - Time spent per step
   - Question completion rate
   - Back button usage
   - Error rate

3. **Outcome metrics:**
   - Quote generation success rate
   - PDF export rate
   - Save quote rate
   - Share quote rate

**Dashboard:**
- Real-time funnel visualization
- Drop-off heatmap (which questions lose users?)
- A/B test results
- Conversion rate by industry

**User Impact:**
- Data-driven UX improvements
- Identify friction points
- Optimize conversion funnel

**Files to create:**
- `src/services/wizardAnalytics.ts` - NEW service
- `src/components/admin/WizardAnalyticsDashboard.tsx` - NEW component

---

## 📊 Priority Matrix

| Feature | Impact | Effort | Priority | Ship Date |
|---------|--------|--------|----------|-----------|
| **Quick Quote Mode** | 🔥 High | 4-6h | P0 | Week 1 |
| **Save & Resume** | 🔥 High | 6-8h | P0 | Week 1 |
| **Share Quote** | 🔥 High | 8-10h | P0 | Week 2 |
| **Mobile Optimization** | 🔥 High | 10-12h | P1 | Week 3 |
| **Analytics** | 🔥 High | 8-10h | P1 | Week 2 |
| **Comparison Mode** | 🟡 Medium | 12-15h | P1 | Week 4 |
| **Accessibility** | 🟡 Medium | 8-10h | P1 | Week 3 |
| **Performance** | 🟡 Medium | 6-8h | P2 | Week 4 |
| **AI Recommendations** | 🟢 Nice-to-have | 15-20h | P2 | Month 2 |
| **Collaboration** | 🟢 Nice-to-have | 20-25h | P3 | Month 3 |

**Total Effort**: 98-123 hours (~2.5-3 weeks for 1 developer)

---

## 🎯 Recommended Sprint Plan

### Sprint 1 (Week 1): Core UX Improvements
- ✅ Quick Quote Mode (4-6h)
- ✅ Save & Resume Progress (6-8h)
- ✅ Analytics Foundation (8-10h)
- **Goal**: Reduce time-to-quote by 75%, track drop-offs

### Sprint 2 (Week 2): Sharing & Analytics
- ✅ Share Quote Feature (8-10h)
- ✅ Analytics Dashboard (continued)
- ✅ Mobile Optimization (start)
- **Goal**: Enable viral sharing, understand user behavior

### Sprint 3 (Week 3): Mobile & Accessibility
- ✅ Mobile Optimization (complete) (10-12h)
- ✅ Accessibility Audit + Fixes (8-10h)
- **Goal**: WCAG 2.1 AA compliance, mobile conversion

### Sprint 4 (Week 4): Advanced Features
- ✅ Comparison Mode (12-15h)
- ✅ Performance Optimizations (6-8h)
- **Goal**: Power user features, smoother experience

---

## 🚀 Quick Wins (Can ship today)

### 1. Loading State Improvements (30 minutes)
Add skeleton loaders instead of spinners:
```typescript
<SkeletonLoader type="industry-card" count={20} />
```

### 2. Error Boundaries (1 hour)
Better error messages + recovery options:
```typescript
<ErrorBoundary fallback={<ErrorRecovery />}>
  <Step3ProfileV7 />
</ErrorBoundary>
```

### 3. Progress Persistence (2 hours)
Auto-save to localStorage (non-cloud version):
```typescript
localStorage.setItem('v7_progress', JSON.stringify(state));
```

### 4. Keyboard Shortcuts (1 hour)
Add Cmd+K for quick actions:
```typescript
// Cmd+K → Command palette
// Cmd+S → Save quote
// Cmd+E → Export PDF
```

### 5. Copy Quote Summary (30 minutes)
One-click copy formatted summary:
```typescript
const copyToClipboard = () => {
  const summary = `
    System Size: ${quote.systemSizeKW} kW / ${quote.storageSizeKWh} kWh
    Investment: ${formatCurrency(quote.netCost)}
    Annual Savings: ${formatCurrency(quote.annualSavings)}
    Payback: ${quote.paybackYears} years
  `;
  navigator.clipboard.writeText(summary);
};
```

---

## 📝 Technical Debt to Address

1. **useWizardV7.ts is 5,349 lines** - Consider splitting into smaller hooks
2. **Step 3 has 3 variants** - Consolidate Step3ProfileV7, Step3ProfileV7Curated, Step3GatedV7
3. **Pricing logic scattered** - Centralize in `pricingBridge.ts`
4. **Test coverage gaps** - Add E2E tests for full wizard flow
5. **TypeScript `any` types** - 310 instances (from ESLint report)

---

## 🎯 Success Metrics (6 months)

| Metric | Current | Target | Strategy |
|--------|---------|--------|----------|
| **Time to Quote** | 5-10 min | 30 sec | Quick Quote Mode |
| **Completion Rate** | 45% | 70% | Save & Resume, Mobile |
| **Mobile Conversion** | 20% | 40% | Mobile optimization |
| **Share Rate** | 0% | 15% | Share Quote feature |
| **Return Users** | 10% | 30% | Save & Resume |
| **Quote Exports** | 25% | 50% | Better UX, easier export |

---

## 💡 Innovative Features (Future)

1. **Voice Input** - "Alexa, I have a 200-room hotel in California..."
2. **AR/VR Visualization** - See BESS system in your facility (WebXR)
3. **Blockchain Verification** - Immutable TrueQuote™ certificates
4. **Carbon Credit Integration** - Auto-calculate + register credits
5. **Equipment Marketplace** - Compare vendors, request quotes
6. **Community Forum** - Users share experiences by industry
7. **API for Partners** - White-label wizard embed
8. **Multi-Currency** - International support (EUR, GBP, AUD)

---

## ✅ Next Steps

**This Week:**
1. ✅ Review roadmap with team
2. ✅ Prioritize P0 features (Quick Quote, Save & Resume)
3. ✅ Create feature branches for Sprint 1
4. ✅ Set up analytics tracking infrastructure

**Questions to Decide:**
- Which P0 feature to build first?
- Mobile-first or desktop-first for new features?
- Self-host analytics or use third-party (Mixpanel, Amplitude)?
- OpenAI integration budget for AI recommendations?

---

**Ready to start?** Pick a feature and let's ship it! 🚀
