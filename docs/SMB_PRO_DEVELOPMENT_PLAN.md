# SMB + Pro Development Plan

**Created:** December 11, 2025  
**Status:** Active Development  
**Priority:** SMB First → Pro Features → API (Future)

---

## Strategic Direction

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT PRIORITY ORDER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PHASE 1 (Now)           PHASE 2 (Jan)           PHASE 3 (Q2)             │
│   ─────────────           ─────────────           ────────────             │
│                                                                             │
│   ┌───────────┐          ┌───────────┐          ┌───────────┐             │
│   │  SMB      │          │  Pro      │          │  API      │             │
│   │  Cleanup  │ ───────► │  Tools    │ ───────► │  Layer    │             │
│   │  + Scale  │          │           │          │           │             │
│   └───────────┘          └───────────┘          └───────────┘             │
│                                                                             │
│   • Fix Wizard           • Advanced Builder      • REST endpoints          │
│   • SSOT compliance      • Pro line items        • White-label             │
│   • Use case audit       • Multi-scenario        • Partner portal          │
│   • Vertical pages       • PDF/Word export       • Usage metering          │
│                                                                             │
│   TrueQuote™ is the foundation for ALL phases                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: SMB Cleanup & Scalability (Current Focus)

### 1.1 Use Case Audit

**Goal:** Ensure all 18+ use cases work correctly through the wizard

| Use Case | Slug | Custom Questions | Power Calc | Status |
|----------|------|------------------|------------|--------|
| Office Building | `office` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Hotel | `hotel` | ✅ rooms, amenities | ✅ SSOT | 🔍 Audit |
| Hospital | `hospital` | ✅ beds | ✅ SSOT | 🔍 Audit |
| Car Wash | `car-wash` | ✅ bays | ✅ SSOT | 🔍 Audit |
| EV Charging | `ev-charging` | ✅ charger counts | ✅ SSOT | 🔍 Audit |
| Data Center | `data-center` | ✅ IT load kW | ✅ SSOT | 🔍 Audit |
| Manufacturing | `manufacturing` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Retail | `retail` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Warehouse | `warehouse` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Airport | `airport` | ✅ passengers | ✅ SSOT | 🔍 Audit |
| University | `university` | ✅ students | ✅ SSOT | 🔍 Audit |
| Shopping Center | `shopping-center` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Apartment Building | `apartment-building` | ✅ units | ✅ SSOT | 🔍 Audit |
| Indoor Farm | `indoor-farm` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Gas Station | `gas-station` | ✅ pumps | ✅ SSOT | 🔍 Audit |
| Public Building | `public-building` | ✅ sq ft | ✅ SSOT | 🔍 Audit |
| Microgrid | `microgrid` | ✅ capacity | ✅ SSOT | 🔍 Audit |
| Residential | `residential` | ✅ sq ft | ✅ SSOT | 🔍 Audit |

### 1.2 Wizard Flow Verification

**Checklist for each section:**

- [ ] Section 0 (Location): State selection works, rates populate
- [ ] Section 1 (Industry): All use cases load from DB, icons display
- [ ] Section 2 (Facility): Custom questions render dynamically
- [ ] Section 3 (Goals): Add-ons calculate correctly (solar, wind, generator, EV)
- [ ] Section 4 (Config): BESS sizing uses SSOT, costs update real-time
- [ ] Section 5 (Quote): TrueQuote badge shows, exports work

### 1.3 SMB Vertical Pages

**Current Verticals (with dedicated landing pages):**

| Vertical | Landing Page | Wizard Integration | Status |
|----------|--------------|-------------------|--------|
| Hotel | `/hotelenergy` | ✅ `initialUseCase='hotel'` | ✅ Live |
| Car Wash | `/carwashenergy` | ✅ `initialUseCase='car-wash'` | ✅ Live |
| EV Charging | `/evchargingenergy` | ✅ `initialUseCase='ev-charging'` | ✅ Live |

**Potential New Verticals:**

| Vertical | Domain Idea | Market Size | Priority |
|----------|-------------|-------------|----------|
| Data Center | `datacenterpowersolutions.com` | High | P1 |
| Hospital | `hospitalenergystorage.com` | Medium | P2 |
| Manufacturing | `factoryenergysavings.com` | Medium | P2 |
| Airport | `airportbatterystorage.com` | Niche | P3 |
| Cannabis/Indoor Farm | `growfacilitypower.com` | Growing | P3 |

---

## Phase 2: Pro Tools Development

### 2.1 Pro Features for SMB "Power Users"

Many SMB customers will want deeper analysis. Pro features include:

| Feature | Description | SMB Benefit |
|---------|-------------|-------------|
| **Multi-Scenario** | Compare 3-5 configurations side-by-side | "What if I add solar?" |
| **Vendor Selection** | Choose specific battery brands | "I want Tesla/BYD/CATL" |
| **Sensitivity Analysis** | See how rate changes affect ROI | "What if rates go up 10%?" |
| **3-Statement Model** | Full P&L, Balance Sheet, Cash Flow | Bank/investor presentations |
| **Custom Assumptions** | Override defaults with user values | "My discount rate is 10%" |

### 2.2 Pro Quote Line Items (TrueQuote Enhanced)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRO QUOTE LINE ITEM                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Battery Energy Storage System                           $2,400,000         │
│  ├── 📋 16 MWh LFP Battery                                                  │
│  ├── 📊 Source: NREL ATB 2024 ($150/kWh base)                              │
│  ├── 🔧 Vendor: CATL 314Ah cells (user selected)                           │
│  ├── ⚠️ Deviation: +5% from benchmark (regional adjustment)                │
│  └── 🔗 [View methodology] [Edit assumptions]                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Assumption Details (expandable)                                     │   │
│  │  • Degradation: 2.5%/year (NREL default)                            │   │
│  │  • Round-trip efficiency: 85% (LFP typical)                         │   │
│  │  • Cycle life: 6,000 cycles (mfr warranty)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 AdvancedQuoteBuilder Revival

The existing `AdvancedQuoteBuilder.tsx` needs:

1. **SSOT Integration** - Use `QuoteEngine.generateQuote()` exclusively
2. **TrueQuote Display** - Source attribution on every line
3. **Multi-Scenario UI** - Side-by-side comparison view
4. **Export Enhancement** - PDF/Word/Excel with TrueQuote metadata

---

## Phase 3: API Preparation (Architecture Only)

### 3.1 Current State → API-Ready State

**No code changes now**, but design for:

```typescript
// Future: @merlin/truequote-core

// This should work in ANY context (web, API, CLI)
const quote = await TrueQuoteEngine.generateQuote({
  storageSizeMW: 0.5,
  durationHours: 4,
  location: 'California',
  electricityRate: 0.20,
  useCase: 'hotel',
  // ... all params
});

// Result includes TrueQuote audit trail
console.log(quote.trueQuote.sources);
// → [{ id: 'nrel-atb-2024', component: 'Battery', value: 150, unit: '$/kWh' }]
```

### 3.2 Files to Keep "Clean" for Future Extraction

These files will become the `@merlin/truequote-core` package:

| File | Future Location | Notes |
|------|-----------------|-------|
| `unifiedQuoteCalculator.ts` | `engine/QuoteEngine.ts` | Keep stateless |
| `centralizedCalculations.ts` | `engine/FinancialCalc.ts` | No React deps |
| `equipmentCalculations.ts` | `engine/EquipmentCalc.ts` | No React deps |
| `useCasePowerCalculations.ts` | `engine/PowerCalc.ts` | No React deps |
| `benchmarkSources.ts` | `truequote/BenchmarkRegistry.ts` | Already clean |

**Rule:** These files should NEVER import React components or UI dependencies.

---

## Immediate Action Items

### Today's Tasks

1. **Audit Use Cases in Database**
   - Query `use_cases` table
   - Verify `custom_questions` for each
   - Check power calculation coverage

2. **Test Wizard Flow**
   - Run through 3 use cases end-to-end
   - Verify SSOT compliance
   - Check TrueQuote badges appear

3. **Identify Broken Paths**
   - Document any use cases that fail
   - Note missing custom questions
   - Flag power calc gaps

### This Week

- [ ] Complete use case audit
- [ ] Fix any broken wizard flows
- [ ] Add TrueQuoteSeal to quote results
- [ ] Test all 3 vertical landing pages
- [ ] Deploy fixes to production

### Next Week

- [ ] Decide on 4th vertical (Data Center?)
- [ ] Begin AdvancedQuoteBuilder revival
- [ ] Add multi-scenario comparison UI

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Use cases working | ~15? | 18 | This week |
| Wizard completion rate | Unknown | >70% | 2 weeks |
| TrueQuote visibility | Partial | 100% of quotes | This week |
| Vertical pages | 3 | 5 | Q1 2026 |
| Pro features | 0 | 3 core | Q1 2026 |

---

## TrueQuote Integration Checklist

Every quote must show:

- [ ] TrueQuoteBadge in header
- [ ] TrueQuoteSeal on results
- [ ] Source citations on line items
- [ ] Methodology link
- [ ] Audit export option (JSON)
- [ ] Deviation flags (if applicable)

---

*Plan created: December 11, 2025*
*Next review: December 18, 2025*
