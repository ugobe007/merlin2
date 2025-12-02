# Professional Financial Model - Integration Guide

## 🏛️ The 5th Pillar Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MERLIN CALCULATION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   PILLAR 1  │  │   PILLAR 2  │  │   PILLAR 3  │  │   PILLAR 4  │        │
│  │   Quote     │  │   Power     │  │  Financial  │  │  Equipment  │        │
│  │ Calculator  │  │   Calcs     │  │   Metrics   │  │   Pricing   │        │
│  │             │  │             │  │             │  │             │        │
│  │ unified     │  │ useCase     │  │centralized  │  │ equipment   │        │
│  │ Quote       │  │ Power       │  │Calculations │  │Calculations │        │
│  │ Calculator  │  │Calculations │  │    .ts      │  │    .ts      │        │
│  │    .ts      │  │    .ts      │  │             │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │               │
│         └────────────────┴────────────────┼────────────────┘               │
│                                           │                                 │
│                          ┌────────────────▼────────────────┐               │
│                          │         🏛️ PILLAR 5             │               │
│                          │  Professional Financial Model   │               │
│                          │                                 │               │
│                          │   professionalFinancialModel.ts │               │
│                          │                                 │               │
│                          │  ┌─────────────────────────────┐│               │
│                          │  │ • 3-Statement Model          ││               │
│                          │  │ • DSCR (Bank-Required)       ││               │
│                          │  │ • Levered/Unlevered IRR      ││               │
│                          │  │ • LCOS (NREL Standard)       ││               │
│                          │  │ • Revenue Stacking           ││               │
│                          │  │ • MACRS + ITC                ││               │
│                          │  │ • Debt Amortization          ││               │
│                          │  └─────────────────────────────┘│               │
│                          └─────────────────────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📍 Where It Goes in Advanced Quote Builder

### Current Advanced Quote Builder Flow:
```
1. LANDING PAGE → 8 Tool Cards
2. CUSTOM CONFIGURATION → System specs, renewables, electrical
3. INTERACTIVE DASHBOARD → Real-time sliders
4. QUOTE PREVIEW → Word/Excel preview
```

### NEW Flow with Professional Model:
```
1. LANDING PAGE → 9 Tool Cards (add "Pro Financials" card)
2. CUSTOM CONFIGURATION → (unchanged)
3. NEW: PRO FINANCIAL ANALYSIS → Bank-ready financials
4. INTERACTIVE DASHBOARD → (unchanged)
5. QUOTE PREVIEW → Enhanced with 3-statement model
```

---

## 🎨 UI Integration Points

### Option A: Add New Tool Card (Recommended)

Add a **9th tool card** on the landing page:

```tsx
// In AdvancedQuoteBuilder.tsx - tools array
{
  id: 'pro-financials',
  icon: <BarChart3 className="w-8 h-8" />,
  title: 'Pro Financial Model',
  description: 'Bank/investor-ready 3-statement model with DSCR, Levered IRR, and LCOS',
  color: 'from-emerald-400 via-green-500 to-teal-600',
  action: () => setViewMode('pro-financials'),
  badge: '🏦 Bank-Ready'  // NEW: Premium badge
}
```

### Option B: Enhance Existing "Financial Calculator" Card

Change the current "Financial Calculator" card to launch Pro Financials:

```tsx
// Current
{
  id: 'financial-calculator',
  title: 'Financial Calculator',
  description: 'Calculate ROI, payback period, and financing options',
}

// Enhanced
{
  id: 'financial-calculator',
  title: 'Pro Financial Model',
  description: '3-Statement Model, DSCR, Levered IRR, LCOS - Bank/Investor Ready',
  badge: '🏦 NEW'
}
```

---

## 📱 New View: Pro Financial Analysis

### ViewMode Addition:
```tsx
type ViewMode = 'landing' | 'custom-config' | 'interactive-dashboard' | 'pro-financials';
```

### Pro Financials View Layout:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🏦 Professional Financial Model                              [← Back] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ EXECUTIVE SUMMARY                                                 │ │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │
│  │ │ CAPEX   │ │ Levered │ │  Min    │ │  LCOS   │ │  MOIC   │    │ │
│  │ │ $12.5M  │ │ IRR     │ │  DSCR   │ │$142/MWh │ │  2.4x   │    │ │
│  │ │         │ │ 18.2%   │ │ 1.42x   │ │         │ │         │    │ │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ REVENUE CONFIGURATION                                             │ │
│  │                                                                    │ │
│  │ ISO Region: [CAISO ▼]   Location: [California    ]               │ │
│  │                                                                    │ │
│  │ Revenue Streams:                                                   │ │
│  │ ☑ Energy Arbitrage      ☑ Demand Charge Reduction                │ │
│  │ ☑ Frequency Regulation  ☐ Spinning Reserve                       │ │
│  │ ☑ Capacity Payments     ☑ Resource Adequacy                      │ │
│  │                                                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ CAPITAL STRUCTURE                                                 │ │
│  │                                                                    │ │
│  │ Debt/Equity: [70/30 ─────●─────]                                 │ │
│  │ Interest Rate: [6.0%]  Loan Term: [15 yrs]                       │ │
│  │ ITC Rate: [30%]  Tax Rate: [29%]                                 │ │
│  │                                                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────────────┐ ┌─────────────────────┐                     │
│  │ INCOME STATEMENT    │ │ DEBT SCHEDULE       │                     │
│  │ Year │Rev │EBITDA   │ │ Year │DSCR │Balance │                     │
│  │ 1    │850K│650K     │ │ 1    │1.42x│$8.2M   │                     │
│  │ 2    │867K│663K     │ │ 2    │1.48x│$7.6M   │                     │
│  │ ...  │... │...      │ │ ...  │...  │...     │                     │
│  └─────────────────────┘ └─────────────────────┘                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │           [📄 Export to Word]  [📊 Export to Excel]              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Implementation Code

### Step 1: Add State & ViewMode

```tsx
// In AdvancedQuoteBuilder.tsx

// Add to ViewMode type
type ViewMode = 'landing' | 'custom-config' | 'interactive-dashboard' | 'pro-financials';

// Add state for professional model
const [proModelResult, setProModelResult] = useState<ProfessionalModelResult | null>(null);
const [proModelLoading, setProModelLoading] = useState(false);

// Add revenue stream toggles
const [revenueStreams, setRevenueStreams] = useState({
  energyArbitrage: true,
  demandChargeReduction: true,
  frequencyRegulation: true,
  spinningReserve: false,
  capacityPayments: true,
  resourceAdequacy: true
});

// Add capital structure state
const [isoRegion, setIsoRegion] = useState<'CAISO' | 'ERCOT' | 'PJM' | 'NYISO' | 'OTHER'>('CAISO');
const [debtEquityRatio, setDebtEquityRatio] = useState(0.7);
const [interestRate, setInterestRate] = useState(0.06);
const [loanTermYears, setLoanTermYears] = useState(15);
```

### Step 2: Add Generate Function

```tsx
// Add function to generate professional model
const handleGenerateProModel = async () => {
  setProModelLoading(true);
  try {
    const result = await generateProfessionalModel({
      storageSizeMW,
      durationHours,
      location,
      isoRegion,
      electricityRate: utilityRate,
      demandChargeRate: demandCharge,
      revenueStreams,
      debtEquityRatio,
      interestRate,
      loanTermYears,
      solarMW: solarPVIncluded ? solarCapacityKW / 1000 : 0,
      windMW: windTurbineIncluded ? windCapacityKW / 1000 : 0,
    });
    setProModelResult(result);
  } catch (error) {
    console.error('Error generating professional model:', error);
  }
  setProModelLoading(false);
};
```

### Step 3: Add Tool Card

```tsx
// In the tools array
{
  id: 'pro-financials',
  icon: <TrendingUp className="w-8 h-8" />,
  title: 'Pro Financial Model',
  description: 'Bank/investor-ready 3-statement model with DSCR, IRR, and LCOS analysis',
  color: 'from-emerald-400 via-green-500 to-teal-600',
  action: () => {
    setViewMode('pro-financials');
    handleGenerateProModel();
  },
},
```

### Step 4: Add Pro Financials View

```tsx
{/* PRO FINANCIALS VIEW */}
{viewMode === 'pro-financials' && (
  <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
    {/* Header */}
    <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-800/90 via-green-700/90 to-teal-700/90 border-b-4 border-emerald-400/50 shadow-2xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('landing')} className="p-3 hover:bg-white/20 rounded-xl">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🏦 Professional Financial Model
            </h1>
            <p className="text-emerald-200 text-sm">Bank/Investor-Ready Analysis</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Content */}
    <div className="max-w-7xl mx-auto px-6 py-8">
      {proModelLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full" />
        </div>
      ) : proModelResult ? (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-emerald-400/30">
              <p className="text-emerald-200 text-xs font-medium">Total CAPEX</p>
              <p className="text-2xl font-bold text-white">
                ${(proModelResult.summary.totalCapex / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-emerald-400/30">
              <p className="text-emerald-200 text-xs font-medium">Levered IRR</p>
              <p className="text-2xl font-bold text-green-400">
                {proModelResult.summary.leveredIRR.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-400/30">
              <p className="text-yellow-200 text-xs font-medium">Min DSCR</p>
              <p className="text-2xl font-bold text-yellow-400">
                {proModelResult.summary.minimumDSCR.toFixed(2)}x
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-cyan-400/30">
              <p className="text-cyan-200 text-xs font-medium">LCOS</p>
              <p className="text-2xl font-bold text-cyan-400">
                ${proModelResult.summary.lcos}/MWh
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-purple-400/30">
              <p className="text-purple-200 text-xs font-medium">MOIC</p>
              <p className="text-2xl font-bold text-purple-400">
                {proModelResult.summary.moic.toFixed(1)}x
              </p>
            </div>
          </div>
          
          {/* Income Statement Table */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-emerald-400/30">
            <h3 className="text-xl font-bold text-white mb-4">Income Statement (5-Year)</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-emerald-200 border-b border-emerald-400/30">
                  <th className="text-left py-2">Year</th>
                  <th className="text-right py-2">Revenue</th>
                  <th className="text-right py-2">OPEX</th>
                  <th className="text-right py-2">EBITDA</th>
                  <th className="text-right py-2">Net Income</th>
                </tr>
              </thead>
              <tbody>
                {proModelResult.incomeStatements.slice(0, 5).map((is) => (
                  <tr key={is.year} className="text-white border-b border-white/10">
                    <td className="py-2">{is.year}</td>
                    <td className="text-right">${(is.totalRevenue / 1000).toFixed(0)}K</td>
                    <td className="text-right">${(is.totalOpex / 1000).toFixed(0)}K</td>
                    <td className="text-right text-green-400">${(is.ebitda / 1000).toFixed(0)}K</td>
                    <td className="text-right">${(is.netIncome / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Debt Schedule with DSCR */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-yellow-400/30">
            <h3 className="text-xl font-bold text-white mb-4">Debt Schedule & DSCR</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-yellow-200 border-b border-yellow-400/30">
                  <th className="text-left py-2">Year</th>
                  <th className="text-right py-2">Beginning Balance</th>
                  <th className="text-right py-2">Interest</th>
                  <th className="text-right py-2">Principal</th>
                  <th className="text-right py-2">DSCR</th>
                </tr>
              </thead>
              <tbody>
                {proModelResult.debtSchedule.slice(0, 5).map((ds) => (
                  <tr key={ds.year} className="text-white border-b border-white/10">
                    <td className="py-2">{ds.year}</td>
                    <td className="text-right">${(ds.beginningBalance / 1000000).toFixed(2)}M</td>
                    <td className="text-right">${(ds.interestPayment / 1000).toFixed(0)}K</td>
                    <td className="text-right">${(ds.principalPayment / 1000).toFixed(0)}K</td>
                    <td className={`text-right font-bold ${ds.dscr >= 1.25 ? 'text-green-400' : 'text-red-400'}`}>
                      {ds.dscr.toFixed(2)}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-yellow-200 mt-4">
              ✅ Typical bank requirement: DSCR ≥ 1.25x
            </p>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold flex items-center gap-2">
              📄 Export to Word
            </button>
            <button className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold flex items-center gap-2">
              📊 Export to Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-emerald-200">Configure system parameters and generate model</p>
        </div>
      )}
    </div>
  </div>
)}
```

---

## 📊 Data Flow

```
User clicks "Pro Financial Model" card
            │
            ▼
┌───────────────────────────────────────────┐
│  handleGenerateProModel()                 │
│                                           │
│  Gathers from AdvancedQuoteBuilder state: │
│  • storageSizeMW, durationHours           │
│  • location, isoRegion                    │
│  • revenueStreams toggles                 │
│  • debtEquityRatio, interestRate          │
│  • solarMW, windMW (from renewables)      │
└───────────────────┬───────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────┐
│  generateProfessionalModel(input)         │
│  (professionalFinancialModel.ts)          │
│                                           │
│  Internally calls:                        │
│  • calculateQuote() → Equipment costs     │
│  • getCalculationConstants() → DB values  │
│  • calculateLCOS() → NREL formula         │
│  • buildDebtSchedule() → Amortization     │
│  • calculateIRR() → Newton-Raphson        │
└───────────────────┬───────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────┐
│  ProfessionalModelResult                  │
│                                           │
│  • summary (CAPEX, IRR, DSCR, LCOS, MOIC) │
│  • incomeStatements[] (25 years)          │
│  • cashFlowStatements[] (25 years)        │
│  • balanceSheets[] (25 years)             │
│  • debtSchedule[] (with DSCR)             │
│  • depreciationSchedule[] (MACRS)         │
│  • revenueProjection[] (by stream)        │
└───────────────────────────────────────────┘
                    │
                    ▼
        Rendered in Pro Financials View
```

---

## 🚀 Implementation Priority

### Phase 1: Core Integration (Today)
1. Add `pro-financials` ViewMode
2. Add new tool card to landing page
3. Create basic Pro Financials view with summary cards
4. Wire up generateProfessionalModel() call

### Phase 2: Full UI (This Week)
1. Add revenue stream toggle controls
2. Add capital structure sliders
3. Display income statement table
4. Display debt schedule with DSCR highlighting

### Phase 3: Export & Polish (Next Week)
1. Add Excel export with proper formatting
2. Add Word export with 3-statement model
3. Add sensitivity analysis charts
4. Add comparison with/without ITC scenarios

---

## 📁 Files to Modify

| File | Changes |
|------|---------|
| `AdvancedQuoteBuilder.tsx` | Add ViewMode, state, tool card, view |
| `professionalFinancialModel.ts` | Already complete ✅ |
| `wordExportService.ts` | Add 3-statement model export |
| `export/excelExport.ts` | Add pro financials worksheets |

