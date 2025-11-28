# Industry News Sources - AI Scout Integration

## Overview
The Merlin BESS platform integrates with 9 leading industry sources for real-time battery pricing intelligence, market trends, and deployment data.

## Integrated Sources

### 1. **Wood Mackenzie Power & Renewables**
- **URL**: https://www.woodmac.com/industry/power-and-renewables/
- **Focus**: Market analysis, pricing forecasts, deployment tracking
- **API**: ✅ Available
- **Subscription**: Required
- **Data Types**: Market forecasts, pricing trends, capacity outlooks

### 2. **BloombergNEF (BNEF)**
- **URL**: https://about.bnef.com
- **Focus**: Battery price surveys, energy storage outlook, market analysis
- **API**: ✅ Available
- **Subscription**: Required
- **Data Types**: Quarterly battery price survey, LCOS analysis, investment trends
- **Key Reports**: Battery Price Survey, Energy Storage Outlook

### 3. **Benchmark Mineral Intelligence**
- **URL**: https://www.benchmarkminerals.com
- **Focus**: Battery raw materials pricing, supply chain intelligence
- **API**: ✅ Available
- **Subscription**: Required
- **Data Types**: Lithium prices, cobalt prices, nickel prices, supply/demand forecasts

### 4. **Energy Storage News**
- **URL**: https://www.energy-storage.news
- **Focus**: Daily BESS industry news, project announcements, pricing deals
- **API**: ❌ Not available (web scraping)
- **Subscription**: Free
- **Data Types**: Project deployments, vendor announcements, policy updates, pricing deals

### 5. **ESS News**
- **URL**: https://www.ess-news.com
- **Focus**: Energy storage system news and analysis
- **API**: ❌ Not available (web scraping)
- **Subscription**: Free
- **Data Types**: Technology developments, market analysis, industry interviews

### 6. **U.S. Energy Information Administration (EIA)**
- **URL**: https://www.eia.gov
- **Focus**: Official U.S. energy statistics, storage deployment data
- **API**: ✅ Available
- **Subscription**: Free (government)
- **Data Types**: Monthly deployment data, capacity additions, state-by-state breakdowns

### 7. **EIA Wholesale Markets**
- **URL**: https://www.eia.gov/electricity/wholesalemarkets/
- **Focus**: Wholesale electricity prices, market reports, grid data
- **API**: ✅ Available
- **Subscription**: Free (government)
- **Data Types**: LMP pricing, ancillary service rates, market revenue analysis

### 8. **Utility Dive**
- **URL**: https://www.utilitydive.com
- **Focus**: Utility industry news, regulatory updates, project announcements
- **API**: ❌ Not available (web scraping)
- **Subscription**: Free
- **Data Types**: Utility RFPs, regulatory changes, procurement announcements

### 9. **Canary Media (formerly Greentech Media)**
- **URL**: https://www.canarymedia.com/about/people/greentech-media
- **Focus**: Clean energy news, technology trends, market analysis
- **API**: ❌ Not available (web scraping)
- **Subscription**: Free
- **Data Types**: Technology breakthroughs, startup news, policy analysis

### 10. **Sandia National Laboratories - Energy Storage**
- **URL**: https://energy.sandia.gov/programs/energy-storage/
- **Focus**: Research programs, test results, and technical reports for storage technologies
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Test reports, performance data, research papers

### 11. **Electric Power Research Institute (EPRI)**
- **URL**: https://www.epri.com
- **Focus**: Grid integration research, interconnection guidance, best practices for utilities
- **API**: ❌ Not available
- **Subscription**: Free / membership
- **Data Types**: Technical guidance, whitepapers, interconnection studies

### 12. **Tethys (PNNL) - EPRI Org**
- **URL**: https://tethys.pnnl.gov/organization/electric-power-research-institute-epri
- **Focus**: PNNL-curated directory entries and resources for EPRI publications
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Resource links, publication summaries

### 13. **Enlit**
- **URL**: https://www.enlit.world
- **Focus**: Global energy conferences, market coverage, and policy insights
- **API**: ❌ Not available
- **Subscription**: Free / event tickets
- **Data Types**: Event coverage, market reports, vendor announcements

### 14. **Journal of Energy Storage (ScienceDirect)**
- **URL**: https://www.sciencedirect.com/journal/journal-of-energy-storage
- **Focus**: Peer-reviewed academic research on storage technologies and performance
- **API**: ❌ Not available (publisher portal)
- **Subscription**: Required (institutional)
- **Data Types**: Academic papers, experimental results, modeling studies

### 15. **Energy Storage Journal**
- **URL**: https://www.energystoragejournal.com
- **Focus**: Industry news focused on storage deployments and commercial deals
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Project announcements, vendor news, contract awards

### 16. **Microgrid Knowledge**
- **URL**: https://www.microgridknowledge.com
- **Focus**: Microgrid projects, distributed energy, resilience case studies
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Case studies, deployment news, technology features

### 17. **MIT Energy Initiative**
- **URL**: https://energy.mit.edu
- **Focus**: Academic research, policy analysis, and technology reports
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Research briefs, policy papers, technical studies

### 18. **Energy Vault - Newsroom**
- **URL**: https://www.energyvault.com/newsroom
- **Focus**: Company news and long-duration storage announcements
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Press releases, deployment updates, product announcements

### 19. **Schneider Electric - EcoStruxure**
- **URL**: https://www.se.com/us/en/work/software/ecostruxure-building/
- **Focus**: Building energy management and integration platforms
- **API**: ❌ Not available
- **Subscription**: Free
- **Data Types**: Product releases, integration guidance, case studies

### 20. **NREL - System Advisor Model (SAM)**
- **URL**: https://sam.nrel.gov
- **Focus**: Simulation and modeling tools for renewable and storage systems
- **API**: ✅ Available
- **Subscription**: Free (government)
- **Data Types**: Modeling updates, tool releases, technical notes

---

## Integration Architecture

### Data Collection Flow
```
Industry Sources → AI Scout (OpenAI) → Price Extraction → Database → Price Alerts Widget
```

### Components

1. **aiDataCollectionService.ts**
   - `INDUSTRY_NEWS_SOURCES`: Centralized source configuration
   - `collectIndustryNews()`: Fetches news from all sources
   - Stores in `industry_news` table

2. **priceAlertService.ts**
   - `extractPricingFromArticle()`: Pattern matching for $/kWh, $/MWh
   - `isValidIndustrySource()`: Validates URLs against trusted sources
   - `getIndustryNewsSources()`: Returns all configured sources
   - Stores in `energy_price_alerts` table

3. **PriceAlertWidget.tsx**
   - Displays real-time price alerts
   - Color-coded alert levels (excellent_deal, good_deal, info)
   - Auto-refresh every 5 minutes

### Database Tables

- `energy_price_alerts`: Individual pricing deals extracted from news
- `energy_price_trends`: Aggregated pricing trends over time
- `industry_news`: Raw news articles before price extraction
- `alert_subscriptions`: User notification preferences

---

## Usage Examples

### Check if URL is from trusted source
```typescript
import { isValidIndustrySource } from './services/priceAlertService';

const result = isValidIndustrySource('https://www.energy-storage.news/article-123');
// { valid: true, source: 'Energy Storage News' }
```

### Get all configured sources
```typescript
import { getIndustryNewsSources } from './services/priceAlertService';

const sources = getIndustryNewsSources();
// Returns array of all 9 sources with metadata
```

### Process news articles for price alerts
```typescript
import { processNewsForPriceAlerts } from './services/priceAlertService';

const articles = [
  {
    title: 'Great Power Secures 75MW Arizona Contract at $122/kWh',
    content: '...',
    publisher: 'Energy Storage News',
    url: 'https://www.energy-storage.news/great-power-arizona'
  }
];

const alertsCreated = await processNewsForPriceAlerts(articles);
// Creates verified price alerts in database
```

---

## Current Alert Statistics

| Vendor | Alerts | Avg $/kWh | Best Deal |
|--------|--------|-----------|-----------|
| Discovery Energy | 1 | $118.50 | $118.50 |
| Great Power | 4 | $131.25 | $122.00 |
| LiON Energy | 1 | $121.25 | $121.25 |
| SimpliPhi Power | 1 | $165.00 | $165.00 |
| **Total** | **7** | **$131.89** | **$118.50** |

---

## API Keys Required

### For Production Deployment:

1. **BloombergNEF API** (Optional)
   - Contact: https://about.bnef.com/api/
   - Cost: Enterprise subscription required
   - Benefits: Official quarterly battery price data

2. **Wood Mackenzie API** (Optional)
   - Contact: sales@woodmac.com
   - Cost: Enterprise subscription required
   - Benefits: Market forecasts, detailed pricing models

3. **EIA API** (Free - Recommended)
   - Register: https://www.eia.gov/opendata/register.php
   - Free government data
   - Benefits: Official U.S. deployment statistics

4. **Benchmark Mineral Intelligence** (Optional)
   - Contact: https://www.benchmarkminerals.com/contact/
   - Cost: Subscription required
   - Benefits: Raw material pricing (lithium, cobalt, nickel)

### Web Scraping Setup (Free Sources):
- Energy Storage News
- ESS News
- Utility Dive
- Canary Media

No API key needed - use RSS feeds or automated web scraping with rate limiting.

---

## Data Quality & Verification

### Relevance Scoring (0-100)
- **90-100**: Highly relevant (direct pricing, major deployments)
- **70-89**: Relevant (market trends, vendor announcements)
- **50-69**: Somewhat relevant (tangential news)
- **<50**: Low relevance (filtered out)

### Alert Levels
- **excellent_deal**: 20%+ below baseline (e.g., Discovery $118.50 vs $140 baseline)
- **good_deal**: 10-20% below baseline
- **info**: 5-10% below baseline or stable pricing
- **warning**: 10%+ above baseline
- **critical**: 20%+ above baseline

### Verification Status
- Alerts marked `verified: false` initially
- Admin review required for verification
- Only verified alerts shown to customers

---

## Roadmap

### Phase 1 (Current) ✅
- 9 industry sources configured
- Pattern matching for $/kWh and $/MWh
- Basic price alert system
- Database schema deployed

### Phase 2 (Next)
- [ ] Connect OpenAI to automatically process news daily
- [ ] Implement web scraping for free sources
- [ ] Add EIA API integration for official data
- [ ] Email notifications for excellent deals

### Phase 3 (Future)
- [ ] BloombergNEF API integration
- [ ] Wood Mackenzie API integration
- [ ] Machine learning for pricing predictions
- [ ] Historical price trend charts
- [ ] Vendor comparison dashboard

---

## Support

For questions or issues with industry news integration:
- Technical: Check `src/services/priceAlertService.ts`
- Database: See `database/price_alerts_schema.sql`
- UI: Review `src/components/PriceAlertWidget.tsx`

**Last Updated**: November 17, 2025
