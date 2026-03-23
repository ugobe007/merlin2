# Real-Time Market Data API Integration Guide

## Overview

Merlin 3 integrates with live wholesale electricity markets and energy data sources to provide real-time equipment pricing intelligence and revenue forecasting for BESS projects.

Created: March 20, 2026

---

## 📋 Quick Start

### 1. Get Required API Keys

**FREE APIs (Recommended to start):**
- **EIA API** (US Energy Information Administration)
  - Register: https://www.eia.gov/opendata/register.php
  - Cost: FREE (1000 requests/hour)
  - Data: State electricity rates, generation costs, fuel prices

**PAID APIs (For production):**
- **GridStatus.io** (Unified ISO market data)
  - Sign up: https://www.gridstatus.io/
  - Cost: Free tier available, paid plans from $50/month
  - Data: Real-time LMP, ancillary services, all major ISOs

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local and add your API keys
# At minimum, set:
VITE_EIA_API_KEY=your-eia-key-here
VITE_GRIDSTATUS_API_KEY=your-gridstatus-key-here
```

### 3. Test Integration

```typescript
import realTimeMarketService from '@/services/realTimeMarketService';

// Test EIA electricity rates (FREE API)
const rates = await realTimeMarketService.fetchEIAElectricityRates('CA');
console.log('California rates:', rates);

// Test GridStatus LMP (requires API key)
const pricing = await realTimeMarketService.fetchGridStatusLMP('CAISO');
console.log('CAISO real-time pricing:', pricing);

// Calculate BESS revenue potential
const valueStack = await realTimeMarketService.calculateStorageValueStack('PJM', 100); // 100 MW system
console.log('Revenue potential:', valueStack);
```

---

## 🔌 API Details

### GridStatus.io (RECOMMENDED)

**Why GridStatus?**
- Unified API for all major ISOs (CAISO, PJM, ERCOT, NYISO, ISONE, MISO, SPP)
- Clean JSON responses (no XML parsing needed)
- Real-time and historical data
- Ancillary services pricing
- Developer-friendly documentation

**Available Data:**
- Real-time LMP (5-minute intervals)
- Day-ahead LMP forecasts
- Congestion costs
- Frequency regulation prices
- Spinning/non-spinning reserves
- Voltage support

**Rate Limits:**
- Free tier: 100 requests/day
- Pro: 10,000 requests/day ($50/month)
- Enterprise: Unlimited ($500/month)

**Example Response:**
```json
{
  "timestamp": "2026-03-20T15:35:00Z",
  "iso": "CAISO",
  "node": "TH_NP15_GEN-APND",
  "lmp": 42.50,
  "da_lmp": 38.25,
  "congestion_component": 2.15,
  "energy_component": 39.80,
  "loss_component": 0.55
}
```

---

### EIA API (FREE)

**Why EIA?**
- Official US government data source
- Free with generous rate limits
- Historical electricity rates by state
- Generation costs and fuel prices
- No credit card required

**Available Data:**
- Retail electricity rates (residential, commercial, industrial)
- Wholesale electricity prices
- Natural gas prices
- Coal prices
- Renewable generation capacity

**Rate Limits:**
- 1000 requests/hour (free)
- Can request increase for research projects

**Example Response:**
```json
{
  "residential": 0.1850,
  "commercial": 0.1620,
  "industrial": 0.1120,
  "timestamp": "2026-02-01",
  "units": "$/kWh"
}
```

---

### CAISO OASIS (PUBLIC API)

**Why CAISO OASIS?**
- California ISO official data
- No API key required (public access)
- Real-time and day-ahead pricing
- Renewable curtailment data

**Challenges:**
- XML format (requires parsing)
- Complex query parameters
- Not developer-friendly
- Use GridStatus.io instead unless you need specific CAISO-only data

**Available Data:**
- 5-minute real-time LMP
- Day-ahead market prices
- Ancillary services
- Renewable curtailment
- Load forecasts

---

### PJM DataMiner (OPTIONAL)

**Why PJM?**
- PJM Interconnection official data (covers 13 states + DC)
- Free account access to basic data
- Capacity market auction results

**Challenges:**
- Requires account registration
- Some data requires paid subscription
- Rate limits not well documented

---

### ERCOT API (OPTIONAL)

**Why ERCOT?**
- Texas grid official data
- Free public API with registration
- Real-time pricing and generation

**Challenges:**
- Texas-only coverage
- Energy-only market (no capacity market)
- Less standardized than other ISOs

---

## 💰 Revenue Stack Calculation

### Storage Value Stack Formula

```typescript
const valueStack = await calculateStorageValueStack('PJM', 100); // 100 MW system

// Returns:
{
  iso: 'PJM',
  timestamp: '2026-03-20T15:30:00Z',
  arbitrage_spread: 35.50,        // $/MWh peak - off-peak
  ancillary_revenue: 125000,      // $/MW-year (frequency regulation)
  capacity_revenue: 140000,       // $/MW-year (PJM BRA)
  transmission_deferral: 50000,   // $/MW-year (utility-specific)
  total_revenue_potential: 315000 // $/MW-year (total)
}
```

### Revenue Sources Breakdown

**1. Energy Arbitrage**
- Buy electricity during off-peak hours (low prices)
- Sell during peak hours (high prices)
- Spread: $20-50/MWh typical
- Cycles: 1-2 per day (conservative)
- Revenue: $50k-150k/MW-year

**2. Frequency Regulation**
- Respond to grid frequency signals (automatic)
- Paid for capacity AND performance
- Price: $50-200/MW-month typical
- Revenue: $60k-240k/MW-year

**3. Spinning Reserves**
- Fast-response backup generation
- Must respond in 10 minutes
- Price: $20-100/MW-month
- Revenue: $24k-120k/MW-year

**4. Capacity Market**
- Paid for availability during peak demand
- PJM BRA: $100-200/MW-day
- CAISO RA: $4-8/kW-month
- Revenue: $36k-145k/MW-year

**5. Transmission Deferral**
- Utility-specific value
- Avoid building new transmission lines
- Revenue: $30k-100k/MW-year (negotiated)

### Total Revenue Potential

**Typical Range:** $200k-600k/MW-year
- Low: $200k/MW-year (energy-only market, ERCOT)
- Medium: $350k/MW-year (mixed market, CAISO)
- High: $600k/MW-year (capacity market, PJM with stacked services)

---

## 🔧 Integration Examples

### Example 1: Display Real-Time Pricing

```typescript
import { useEffect, useState } from 'react';
import realTimeMarketService from '@/services/realTimeMarketService';

function MarketPricingWidget() {
  const [caiso, setCAISO] = useState(null);
  const [pjm, setPJM] = useState(null);
  const [ercot, setERCOT] = useState(null);

  useEffect(() => {
    async function fetchPricing() {
      const [caisoData, pjmData, ercotData] = await Promise.all([
        realTimeMarketService.fetchGridStatusLMP('CAISO'),
        realTimeMarketService.fetchGridStatusLMP('PJM'),
        realTimeMarketService.fetchGridStatusLMP('ERCOT'),
      ]);
      
      setCAISO(caisoData);
      setPJM(pjmData);
      setERCOT(ercotData);
    }

    fetchPricing();
    const interval = setInterval(fetchPricing, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border rounded p-4">
        <h3 className="font-semibold">CAISO</h3>
        <div className="text-3xl font-bold">${caiso?.lmp_current.toFixed(2)}/MWh</div>
        <div className="text-sm text-gray-500">
          Peak: ${caiso?.peak_price.toFixed(2)} | 
          Off-Peak: ${caiso?.off_peak_price.toFixed(2)}
        </div>
      </div>
      
      <div className="border rounded p-4">
        <h3 className="font-semibold">PJM</h3>
        <div className="text-3xl font-bold">${pjm?.lmp_current.toFixed(2)}/MWh</div>
        <div className="text-sm text-gray-500">
          Congestion: ${pjm?.congestion_cost.toFixed(2)}
        </div>
      </div>
      
      <div className="border rounded p-4">
        <h3 className="font-semibold">ERCOT</h3>
        <div className="text-3xl font-bold">${ercot?.lmp_current.toFixed(2)}/MWh</div>
        <div className="text-sm text-gray-500">
          Day-Ahead: ${ercot?.lmp_day_ahead.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Calculate Project Revenue

```typescript
import realTimeMarketService from '@/services/realTimeMarketService';

async function estimateProjectRevenue(
  systemSizeMW: number,
  iso: string,
  projectLifeYears: number = 20
) {
  // Get real-time value stack
  const valueStack = await realTimeMarketService.calculateStorageValueStack(iso, systemSizeMW);
  
  if (!valueStack) {
    throw new Error(`Unable to fetch data for ${iso}`);
  }

  // Calculate 20-year revenue
  const annualRevenue = valueStack.total_revenue_potential * systemSizeMW;
  const totalRevenue = annualRevenue * projectLifeYears;

  // Calculate with degradation (2% per year)
  let degradedRevenue = 0;
  for (let year = 1; year <= projectLifeYears; year++) {
    const capacity = 1 - (0.02 * (year - 1)); // 2% degradation per year
    degradedRevenue += annualRevenue * capacity;
  }

  return {
    systemSize: `${systemSizeMW} MW / ${systemSizeMW * 4} MWh (4-hour)`,
    iso,
    annualRevenue: {
      year1: annualRevenue,
      average: degradedRevenue / projectLifeYears,
    },
    lifetimeRevenue: {
      no_degradation: totalRevenue,
      with_degradation: degradedRevenue,
    },
    revenueBreakdown: {
      arbitrage: valueStack.arbitrage_spread * systemSizeMW,
      ancillary: valueStack.ancillary_revenue * systemSizeMW,
      capacity: valueStack.capacity_revenue * systemSizeMW,
      transmission: valueStack.transmission_deferral * systemSizeMW,
    },
  };
}

// Usage:
const revenue = await estimateProjectRevenue(100, 'PJM');
console.log(revenue);
// {
//   systemSize: '100 MW / 400 MWh (4-hour)',
//   iso: 'PJM',
//   annualRevenue: {
//     year1: 31500000,
//     average: 26775000,
//   },
//   lifetimeRevenue: {
//     no_degradation: 630000000,
//     with_degradation: 535500000,
//   },
//   revenueBreakdown: {
//     arbitrage: 3550000,
//     ancillary: 12500000,
//     capacity: 14000000,
//     transmission: 5000000,
//   }
// }
```

### Example 3: Store Market Data in Supabase

```typescript
import { supabase } from '@/lib/supabaseClient';
import realTimeMarketService from '@/services/realTimeMarketService';

// Create table (run once):
// CREATE TABLE market_pricing_history (
//   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
//   iso TEXT NOT NULL,
//   timestamp TIMESTAMPTZ NOT NULL,
//   lmp_current NUMERIC,
//   lmp_day_ahead NUMERIC,
//   peak_price NUMERIC,
//   off_peak_price NUMERIC,
//   congestion_cost NUMERIC,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );

async function saveMarketData(iso: string) {
  const pricing = await realTimeMarketService.fetchGridStatusLMP(iso);
  
  if (!pricing) {
    console.error(`Failed to fetch data for ${iso}`);
    return;
  }

  const { error } = await supabase
    .from('market_pricing_history')
    .insert({
      iso: pricing.iso,
      timestamp: pricing.timestamp,
      lmp_current: pricing.lmp_current,
      lmp_day_ahead: pricing.lmp_day_ahead,
      peak_price: pricing.peak_price,
      off_peak_price: pricing.off_peak_price,
      congestion_cost: pricing.congestion_cost,
    });

  if (error) {
    console.error('Error saving market data:', error);
  } else {
    console.log(`✅ Saved ${iso} pricing: $${pricing.lmp_current}/MWh`);
  }
}

// Run every 15 minutes for all ISOs
setInterval(async () => {
  await Promise.all([
    saveMarketData('CAISO'),
    saveMarketData('PJM'),
    saveMarketData('ERCOT'),
    saveMarketData('NYISO'),
  ]);
}, 900000); // 15 minutes
```

---

## 📊 Data Refresh Schedules

### Recommended Update Frequencies

| Data Source | Update Frequency | Rationale |
|-------------|------------------|-----------|
| Real-time LMP | 5 minutes | ISO updates every 5 minutes |
| Day-ahead LMP | 1 hour | Updated hourly |
| Ancillary services | 15 minutes | Market prices change frequently |
| Capacity markets | Daily | Auction results once per day |
| EIA electricity rates | Monthly | EIA publishes monthly |
| Equipment pricing (RSS) | Daily | News published daily |

### Implementation

```typescript
// scripts/update-market-data.ts
import realTimeMarketService from '@/services/realTimeMarketService';

async function updateAllMarketData() {
  console.log('🔄 Starting market data update...');

  // Update real-time pricing (every 5 minutes)
  await updateRealTimePricing();

  // Update ancillary services (every 15 minutes)
  if (Date.now() % 900000 < 300000) {
    await updateAncillaryServices();
  }

  // Update EIA rates (once per day)
  if (new Date().getHours() === 6) {
    await updateEIARates();
  }

  console.log('✅ Market data update complete');
}

// Run as background task
setInterval(updateAllMarketData, 300000); // Every 5 minutes
```

---

## 🚨 Error Handling

### API Rate Limits

```typescript
async function fetchWithRetry(
  fetchFn: () => Promise<any>,
  maxRetries = 3,
  delayMs = 1000
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error: any) {
      if (error.status === 429) {
        // Rate limited - exponential backoff
        const delay = delayMs * Math.pow(2, i);
        console.warn(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (i === maxRetries - 1) {
        throw error; // Last attempt failed
      }
    }
  }
}

// Usage:
const pricing = await fetchWithRetry(() => 
  realTimeMarketService.fetchGridStatusLMP('CAISO')
);
```

### API Key Validation

```typescript
function validateAPIKeys() {
  const missing = [];
  
  if (!import.meta.env.VITE_EIA_API_KEY) {
    missing.push('VITE_EIA_API_KEY (free - recommended)');
  }
  
  if (!import.meta.env.VITE_GRIDSTATUS_API_KEY) {
    missing.push('VITE_GRIDSTATUS_API_KEY (paid - recommended for production)');
  }
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing API keys:', missing.join(', '));
    console.warn('Some features will be disabled. See .env.example for setup instructions.');
  }
  
  return missing.length === 0;
}

// Run on app startup
validateAPIKeys();
```

---

## 📈 Next Steps

1. **Get API Keys:**
   - Register for free EIA API key (5 minutes)
   - Sign up for GridStatus.io free tier (10 minutes)

2. **Test Integration:**
   - Add keys to `.env.local`
   - Run test queries in browser console
   - Verify data is being fetched

3. **Build Dashboard:**
   - Create real-time pricing widget
   - Display revenue stack calculations
   - Show market trends

4. **Automate Data Collection:**
   - Set up GitHub Actions to fetch data every 15 minutes
   - Store historical data in Supabase
   - Build trend analysis tools

5. **Enhance Quote Builder:**
   - Auto-calculate project revenue based on location
   - Show ISO-specific value stacks
   - Integrate with pricing dashboard

---

## 📚 Resources

### API Documentation
- **GridStatus.io:** https://docs.gridstatus.io/
- **EIA API:** https://www.eia.gov/opendata/documentation.php
- **CAISO OASIS:** http://oasis.caiso.com/mrioasis/logon.do
- **PJM DataMiner:** https://dataminer2.pjm.com/docs/
- **ERCOT API:** https://www.ercot.com/mp/data-products/api-guide

### Market Resources
- **NREL ATB:** https://atb.nrel.gov/ (Annual Technology Baseline)
- **BloombergNEF:** https://about.bnef.com/ (Subscription required)
- **Wood Mackenzie:** https://www.woodmac.com/ (Subscription required)

### Energy Storage Value Stacks
- **NREL Storage Value Proposition:** https://www.nrel.gov/docs/fy16osti/64987.pdf
- **Lazard LCOS:** https://www.lazard.com/research-insights/levelized-cost-of-energyplus/
- **ESA Revenue Stacking:** https://energystorage.org/

---

## ✅ Checklist

- [ ] Register for EIA API key (FREE)
- [ ] Register for GridStatus.io account (FREE tier)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add API keys to `.env.local`
- [ ] Test EIA electricity rates query
- [ ] Test GridStatus LMP query
- [ ] Build real-time pricing widget
- [ ] Create Supabase table for market data history
- [ ] Set up automated data collection (GitHub Actions)
- [ ] Integrate revenue calculations into quote builder
- [ ] Document API usage for team

---

**Questions?** Check the [API Integration FAQ](./API_FAQ.md) or reach out to the team.
