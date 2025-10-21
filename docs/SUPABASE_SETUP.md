# Supabase Setup Instructions

## Project Information
- **Project ID**: dleickerygxdtodfxdmm
- **Project URL**: https://dleickerygxdtodfxdmm.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/dleickerygxdtodfxdmm

## Step 1: Get Your API Keys

1. Go to: https://supabase.com/dashboard/project/dleickerygxdtodfxdmm/settings/api
2. Copy your **anon/public** key
3. Add it to `.env` file:
   ```
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

## Step 2: Create Database Tables

1. Go to SQL Editor: https://supabase.com/dashboard/project/dleickerygxdtodfxdmm/sql
2. Click "New Query"
3. Copy and paste the entire contents of `docs/SUPABASE_SCHEMA.sql`
4. Click "Run" or press Cmd/Ctrl + Enter

This will create:
- ✅ `projects` - Store BESS project quotes
- ✅ `financial_models` - Advanced metrics (IRR, DSCR, NPV, etc.)
- ✅ `battery_degradation` - 8 degradation models over 40 years
- ✅ `revenue_streams` - Multiple revenue sources (RECs, reserve capacity, etc.)
- ✅ `scenarios` - Scenario analysis (best/base/worst case)
- ✅ `hourly_optimization` - Hourly charge/discharge scheduling

## Step 3: Enable Authentication (Optional)

If you want user authentication:

1. Go to Authentication: https://supabase.com/dashboard/project/dleickerygxdtodfxdmm/auth/users
2. Enable Email/Password or Social Auth providers
3. Update RLS policies if needed

## Step 4: Test Connection

Run the app and check browser console:
```bash
npm run dev
```

You should see:
```
✅ Supabase connected successfully
```

If you see warnings about the anon key, make sure you've added it to `.env`

## Advanced Financial Modeling Features

### 1. Battery Degradation Models (8 Methods)

```typescript
import { calculateBatteryDegradation } from './services/advancedFinancialModeling';

const degradation = calculateBatteryDegradation(
  10, // initialCapacityMWh
  40, // years
  1,  // cyclesPerDay
  'hybrid' // method: linear, exponential, calendar, cycle, temp_adjusted, hybrid, warranty, measured
);
```

**Methods:**
- **Linear**: Simple 2% per year
- **Exponential**: Exponential decay (0.97 factor)
- **Calendar**: Time-based aging with square root component
- **Cycle**: Based on Equivalent Full Cycles (EFC)
- **Temperature Adjusted**: Accounts for operating temperature
- **Hybrid**: Combined calendar + cycle (most realistic)
- **Warranty**: Follows manufacturer warranty curve
- **Measured**: Based on actual field data

### 2. Equivalent Full Cycles (EFC) Tracking

Automatically tracked in degradation models:
- Total cycles = years × 365 × cyclesPerDay
- Affects capacity degradation
- Predicts battery replacement timing

### 3. Multiple Revenue Streams

```typescript
const streams = calculateRevenueStreams(powerMW, energyMWh, peakRate, offPeakRate, demandCharge, location);
```

**Streams included:**
- ⚡ Energy Arbitrage (buy low, sell high)
- 💰 Demand Charge Reduction
- 🌱 Renewable Energy Certificates (RECs)
- 🔋 Reserve Capacity Market
- 📊 Frequency Regulation

### 4. 40-Year Monthly Forecasts

```typescript
const forecast = generate40YearForecast(capex, revenueStreams, degradation, opex);
// Returns 480 months of data (40 years × 12 months)
```

Each month includes:
- Revenue (adjusted for degradation)
- Operating expenses
- Net cash flow
- Cumulative cash flow
- Battery capacity remaining
- EFC count

### 5. Advanced Financial Metrics

```typescript
const metrics = calculateAdvancedMetrics(forecast, discountRate, debtRatio, interestRate);
```

**Metrics calculated:**
- 📈 **NPV** (Net Present Value)
- 📊 **IRR** (Internal Rate of Return)
- 💵 **Levered IRR** (with debt financing)
- 🔓 **Unlevered IRR** (all equity)
- 🏦 **DSCR** (Debt Service Coverage Ratio)
- 🔄 **MIRR** (Modified IRR)
- 📉 **Profitability Index**
- ⏱️ **Simple Payback**
- ⏱️ **Discounted Payback**

### 6. Scenario Analysis & Sensitivity Testing

```typescript
const scenarios = runScenarioAnalysis(baseCapex, baseRevenue, degradation);
```

**Three scenarios automatically generated:**
- 🌟 **Best Case**: -15% cost, +20% revenue, -10% degradation
- 📊 **Base Case**: As-designed assumptions
- ⚠️ **Worst Case**: +15% cost, -25% revenue, +15% degradation

### 7. Hourly Charge/Discharge Optimization

Coming soon - optimize battery operation based on:
- Real-time electricity prices (ComEd API)
- Peak/off-peak periods
- Battery state of charge
- Degradation minimization

## Usage Examples

### Save Project with Advanced Analytics

```typescript
import { projectService, financialModelService } from './services/supabaseClient';
import { 
  calculateBatteryDegradation, 
  calculateRevenueStreams, 
  generate40YearForecast, 
  calculateAdvancedMetrics,
  runScenarioAnalysis 
} from './services/advancedFinancialModeling';

// 1. Calculate degradation
const degradation = calculateBatteryDegradation(10, 40, 1, 'hybrid');

// 2. Calculate revenue streams
const streams = calculateRevenueStreams(10, 40, 0.15, 0.05, 20, 'Illinois');

// 3. Generate 40-year forecast
const forecast = generate40YearForecast(5000000, streams, degradation, 200000);

// 4. Calculate advanced metrics
const metrics = calculateAdvancedMetrics(forecast, 0.08, 0.70, 0.05);

// 5. Run scenario analysis
const scenarios = runScenarioAnalysis(5000000, 800000, degradation);

// 6. Save to Supabase
const project = await projectService.createProject({
  user_id: 'user-123',
  project_name: 'Advanced BESS Project',
  power_mw: 10,
  duration_hours: 4,
  location: 'Illinois',
  bess_capex: 5000000,
  grand_capex: 6000000,
  annual_savings: 800000,
  simple_roi_years: 7.5
});

await financialModelService.saveModel({
  project_id: project.id,
  levered_irr: metrics.leveredIRR,
  unlevered_irr: metrics.unleveredIRR,
  dscr: metrics.dscr,
  npv: metrics.npv,
  mirr: metrics.mirr,
  payback_period: metrics.simplePayback,
  discounted_payback: metrics.discountedPayback,
  profitability_index: metrics.profitabilityIndex,
  forecast_years: 40,
  monthly_forecast: forecast
});
```

## Troubleshooting

### Connection Issues
- Make sure `.env` file has correct `VITE_SUPABASE_ANON_KEY`
- Check that tables are created (run schema SQL)
- Verify RLS policies allow your user to access data

### Performance
- Indexes are automatically created for fast queries
- Use `select('*')` sparingly - only fetch columns you need
- Consider pagination for large result sets

### Data Security
- Row Level Security (RLS) is enabled by default
- Users can only see their own projects
- API keys are client-safe (anon key only)

## Next Steps

1. ✅ Add anon key to `.env`
2. ✅ Run SQL schema in Supabase
3. ✅ Test connection
4. 🚀 Start using advanced financial modeling!

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
