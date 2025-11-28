# Battery Vendors & Price Alert System - Implementation Complete

## 🎯 Overview
Added Discovery Energy and LiON Energy as battery vendors, plus created a comprehensive price alert system to track energy pricing from news articles and industry deals.

---

## ✅ Part 1: New Battery Vendors

### Discovery Energy
**Models Added:**
- **PowerBlock 2MW** - Commercial-scale systems (2-10 MW)
  - Capacity: 4.0 MWh (2MW x 2hr nominal)
  - Chemistry: LFP
  - Efficiency: 94.5%
  - Warranty: 12 years
  - Cycle Life: 6,000 cycles
  - Lead Time: 60 days
  - Certifications: UL9540, UL1973, IEEE1547, IEC62619
  - Price Range: $140-160/kWh

- **PowerCore 1MW** - Small commercial systems (< 2 MW)
  - Capacity: 2.0 MWh
  - Chemistry: LFP
  - Efficiency: 94.0%
  - Warranty: 10 years
  - Cycle Life: 6,000 cycles
  - Lead Time: 45 days
  - Certifications: UL9540, UL1973
  - Price Range: $185-225/kWh

### LiON Energy
**Models Added:**
- **SafeLiFe 2MW** - Commercial-scale systems (2-10 MW)
  - Capacity: 4.0 MWh
  - Chemistry: LFP
  - Efficiency: 95.0%
  - Warranty: 15 years
  - Cycle Life: 8,000 cycles
  - Lead Time: 45 days
  - Certifications: UL9540, UL1973, IEEE1547, UL9540A
  - Price Range: $145-165/kWh

- **SafeLiFe 1MW** - Small commercial systems (< 2 MW)
  - Capacity: 2.0 MWh
  - Chemistry: LFP
  - Efficiency: 95.0%
  - Warranty: 12 years
  - Cycle Life: 8,000 cycles
  - Lead Time: 30 days
  - Certifications: UL9540, UL1973, IEEE1547
  - Price Range: $180-220/kWh

### SimpliPhi Power (also added)
**Model Added:**
- **PHI Battery 3.8kWh** - Residential/small commercial
  - Capacity: 3.8 kWh
  - Power: 5 kW continuous
  - Chemistry: LFP
  - Efficiency: 96.0%
  - Warranty: 10 years
  - Cycle Life: 10,000 cycles
  - Lead Time: 14 days
  - Certifications: UL9540, UL1973
  - Price Range: $200-240/kWh

### Vendor Selection Logic
The system now intelligently selects battery vendors based on:

1. **Utility-Scale (10+ MW)**
   - CATL/BYD for low-cost ($<130/kWh)
   - Tesla for premium systems

2. **Commercial-Scale (2-10 MW)**
   - Discovery Energy PowerBlock 2MW
   - LiON Energy SafeLiFe 2MW
   - Tesla Megapack XL

3. **Small Commercial (< 2 MW)**
   - LiON Energy SafeLiFe 1MW
   - Discovery Energy PowerCore 1MW
   - SimpliPhi Power PHI Battery

**Files Modified:**
- `src/utils/equipmentCalculations.ts` - Added vendor selection logic
- `src/services/aiDataCollectionService.ts` - Added products to catalog

---

## ✅ Part 2: Price Alert System

### Database Schema
**New Tables Created:** (`database/price_alerts_schema.sql`)

#### 1. energy_price_alerts
Stores individual pricing alerts extracted from news:
- Alert metadata (type, level, relevance score)
- Pricing data (value, unit, currency)
- Deal information (project size, location, vendor)
- Source information (title, URL, publisher, date)
- Context & analysis (summary, market impact, trend)
- Classification (sector, technology type)
- Comparison metrics (baseline price, % difference)
- Verification status

**Alert Types:**
- `battery_kwh` - Battery pricing per kWh
- `battery_mwh` - Battery pricing per MWh (installed)
- `solar_watt` - Solar pricing per watt
- `wind_kw` - Wind pricing per kW
- `market_trend` - General market trends

**Alert Levels:**
- `excellent_deal` - 20%+ below market
- `good_deal` - 10-20% below market
- `info` - Within 5-10% of market
- `warning` - 10-20% above market
- `critical` - 20%+ above market

#### 2. energy_price_trends
Aggregated pricing statistics over time:
- Time periods (daily, weekly, monthly, quarterly)
- Price statistics (avg, min, max, median)
- Trend analysis (direction, confidence level)
- Regional breakdowns

#### 3. alert_subscriptions
User preferences for price alert notifications:
- Email subscription management
- Alert type preferences
- Notification frequency (instant, daily, weekly)
- Price drop threshold settings

### Service Layer
**File:** `src/services/priceAlertService.ts`

**Key Functions:**

1. **extractPricingFromArticle(article)**
   - Extracts pricing from news articles using pattern matching
   - Supports multiple formats: $/kWh, $/MWh, project costs
   - Returns array of price alerts

2. **savePriceAlert(alert)**
   - Saves alert to database
   - Returns success status and alert ID

3. **getRecentPriceAlerts(limit, alertType?, verifiedOnly?)**
   - Fetches recent price alerts
   - Optional filtering by type and verification status

4. **getExcellentDeals(limit)**
   - Fetches only excellent deals (20%+ below market)
   - Sorted by relevance score

5. **processNewsForPriceAlerts(articles)**
   - Batch processes multiple news articles
   - Saves high-relevance alerts (score ≥ 60)
   - Returns count of alerts created

**Pattern Matching:**
- `$125/kWh` or `$125 per kWh`
- `$500,000/MWh` or `$500k per MWh`
- `$50 million for 100MW/400MWh`

**Smart Extraction:**
- Vendor company names (Tesla, Discovery Energy, LiON Energy, etc.)
- Project locations (California, Texas, etc.)
- Industry sectors (utility, commercial, residential)
- Technology types (LFP, NMC, flow battery, etc.)

**Baseline Prices for Comparison:**
- Utility-scale battery: $140/kWh
- Commercial battery: $180/kWh
- Residential battery: $250/kWh
- Utility battery ($/MWh): $500,000/MWh
- Solar: $1.20/W
- Wind: $1,500/kW

### UI Components
**File:** `src/components/PriceAlertWidget.tsx`

#### PriceAlertWidget (Full Component)
**Features:**
- Displays recent price alerts with full details
- Auto-refresh every 5 minutes (configurable)
- Color-coded alert levels
- Trend indicators (declining/stable/rising)
- Relevance scoring
- Deal summaries and market impact analysis
- Tags for vendors, locations, and technology
- Links to source articles

**Props:**
- `maxAlerts` - Number of alerts to display (default: 5)
- `showExcellentDealsOnly` - Filter for excellent deals only
- `autoRefresh` - Enable auto-refresh (default: true)
- `refreshInterval` - Refresh interval in ms (default: 300000 = 5 min)

**Visual Elements:**
- Alert level icons (Sparkles, CheckCircle, AlertCircle, Info)
- Trend icons (TrendingDown, TrendingUp, Minus)
- Color-coded borders (green, blue, yellow, red, gray)
- Pricing display with unit formatting
- Percentage difference from baseline
- Relevance score display
- Tags for vendor, location, technology, sector

#### PriceAlertTicker (Compact Component)
**Features:**
- Compact version for dashboards
- Shows only excellent deals
- Minimal design with key info
- Auto-refresh every 5 minutes

**Props:**
- `maxAlerts` - Number of alerts to display (default: 3)

---

## 📊 Sample Data

The database schema includes 3 sample price alerts for testing:

1. **Discovery Energy California Deal**
   - $118.50/kWh for 50MW project
   - 15.36% below baseline
   - Excellent deal
   - Utility-scale LFP system

2. **LiON Energy Texas Contract**
   - $485k/MWh for 100MW/400MWh
   - 6.73% below baseline
   - Good deal
   - ERCOT grid services

3. **SimpliPhi NYC Commercial**
   - $165/kWh for 5MW portfolio
   - 2.94% below baseline
   - Info level
   - 50-building deployment

---

## 🔄 Integration with OpenAI Scouting

The price alert system is designed to work with OpenAI news scouting:

### Workflow:
1. **OpenAI Scout** fetches industry news articles
2. **priceAlertService.processNewsForPriceAlerts()** extracts pricing data
3. **Pattern matching** identifies pricing mentions
4. **Alert creation** with relevance scoring
5. **Database storage** for verified alerts
6. **UI display** in PriceAlertWidget component

### Usage Example:
```typescript
import { processNewsForPriceAlerts } from './services/priceAlertService';

// After OpenAI fetches news articles
const newsArticles = [
  {
    title: "Tesla Announces $125/kWh Pricing for California Projects",
    url: "https://...",
    publisher: "Energy Storage News",
    publishDate: "2025-11-15",
    content: "Tesla Energy today announced..."
  }
];

// Extract and save price alerts
const alertsCreated = await processNewsForPriceAlerts(newsArticles);
console.log(`Created ${alertsCreated} price alerts`);
```

---

## 🚀 Next Steps

### 1. Database Setup
Run the SQL schema on your Supabase instance:
```bash
# In Supabase SQL Editor, run:
database/price_alerts_schema.sql
```

### 2. Add PriceAlertWidget to Dashboard
```tsx
import { PriceAlertWidget, PriceAlertTicker } from './components/PriceAlertWidget';

// Full widget
<PriceAlertWidget maxAlerts={10} autoRefresh={true} />

// Compact ticker
<PriceAlertTicker maxAlerts={3} />

// Excellent deals only
<PriceAlertWidget showExcellentDealsOnly={true} maxAlerts={5} />
```

### 3. Integrate with News Collection
Add to your existing AI data collection service:
```typescript
// In aiDataCollectionService.ts
import { processNewsForPriceAlerts } from './priceAlertService';

export async function runDailyCollection() {
  // ... existing news collection
  const newsArticles = await collectIndustryNews();
  
  // NEW: Extract price alerts
  await processNewsForPriceAlerts(newsArticles);
}
```

### 4. Enable Alert Notifications (Future)
- Implement email notifications for excellent deals
- Add user subscription management UI
- Create daily/weekly digest emails

---

## 📈 Benefits

### For Users:
- **Market Intelligence** - See real pricing from actual deals
- **Competitive Analysis** - Compare current market rates
- **Deal Opportunities** - Get alerted to below-market pricing
- **Vendor Diversity** - More battery vendor options beyond Tesla
- **Transparency** - Understand pricing trends and baselines

### For Business:
- **Pricing Validation** - Verify your quotes are competitive
- **Market Positioning** - Understand where you stand vs competitors
- **Sales Intelligence** - Reference actual deals in proposals
- **Vendor Relationships** - Discover new vendor options (Discovery, LiON)
- **Credibility** - Show clients you track real market data

---

## 🔍 Technical Details

### Vendor Selection Algorithm
```typescript
// Utility-scale (10+ MW)
if (storageSizeMW >= 10) {
  vendor = pricePerKWh < 130 ? "CATL/BYD" : "Tesla";
}

// Commercial-scale (2-10 MW)
else if (storageSizeMW >= 2 && storageSizeMW < 10) {
  vendors = ["Discovery Energy", "LiON Energy", "Tesla"];
  vendor = selectByPriceRange(pricePerKWh, vendors);
}

// Small commercial (< 2 MW)
else {
  vendors = ["LiON Energy", "Discovery Energy", "SimpliPhi Power"];
  vendor = selectByPriceRange(pricePerKWh, vendors);
}
```

### Price Alert Extraction Patterns
1. **Direct $/kWh:** `/\$\s*(\d+(?:\.\d{1,2})?)\s*(?:\/|per)\s*kwh/gi`
2. **$/MWh costs:** `/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:k|m|million)?\s*(?:\/|per)\s*mwh/gi`
3. **Project costs:** `/\$\s*(\d+(?:\.\d{1,2})?)\s*(million|m|billion|b).*?(\d+(?:\.\d{1,2})?)\s*mw.*?(\d+(?:\.\d{1,2})?)\s*mwh/gi`

### Relevance Scoring
Base: 50 points
- +20 for direct pricing mentions ($/kWh, per kWh)
- +10 for pricing/cost keywords
- +15 for vendor mentions
- +10 for project scale (MW)
- +15 for recent news (<7 days)
- +10 for recent news (<30 days)
- +5 for recent news (<90 days)

Maximum: 100 points

---

## 📝 Files Created/Modified

### New Files:
1. `database/price_alerts_schema.sql` - Database schema (330 lines)
2. `src/services/priceAlertService.ts` - Service layer (670 lines)
3. `src/components/PriceAlertWidget.tsx` - UI components (360 lines)

### Modified Files:
1. `src/utils/equipmentCalculations.ts` - Added vendor selection logic
2. `src/services/aiDataCollectionService.ts` - Added new battery products
3. `src/services/supabase.ts` - Added type definitions for new tables

### Total Lines Added: ~1,400 lines

---

## ✅ Testing Checklist

- [x] Battery vendors added to product catalog
- [x] Vendor selection logic implemented
- [x] Database schema created with RLS policies
- [x] Price extraction patterns tested
- [x] Service layer functions implemented
- [x] UI components created and styled
- [x] TypeScript types added
- [x] No compilation errors
- [ ] Database schema run on Supabase (user action required)
- [ ] PriceAlertWidget added to dashboard (user action required)
- [ ] OpenAI integration connected (user action required)

---

## 🎉 Summary

**Battery Vendors:**
- ✅ Added Discovery Energy (2 models)
- ✅ Added LiON Energy (2 models)
- ✅ Added SimpliPhi Power (1 model)
- ✅ Intelligent vendor selection by system size and price point

**Price Alert System:**
- ✅ Complete database schema with 3 tables
- ✅ Smart price extraction from news articles
- ✅ Relevance scoring and market impact analysis
- ✅ Beautiful UI components with live data
- ✅ Auto-refresh and filtering capabilities
- ✅ Integration-ready with OpenAI scouting

**Ready for deployment!** 🚀
