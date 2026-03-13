# Widget Multi-Industry Strategy
**Date:** March 13, 2026  
**Status:** Active Development

## Overview

The Merlin Widget API enables **all 21 active industries** to embed instant BESS quotes on their websites. Each industry gets tailored calculations using our V7 calculator registry.

---

## ✅ Current Infrastructure (Ready)

### Database Schema
- ✅ `widget_partners` table (partner accounts, API keys, tiers)
- ✅ `widget_usage` table (event tracking, analytics)
- ✅ 5 functions: `generate_widget_api_key()`, `validate_widget_api_key()`, etc.
- ✅ RLS policies (partners see only their data)
- ✅ 3 test partners seeded (free, pro, enterprise)

### API Endpoint
- ✅ File enabled: `src/api/widget/quoteEndpoint.ts`
- ⚠️ Needs deployment as Supabase Edge Function or Express route

### Calculator Coverage (V7 Registry)
**Full TrueQuote™ Support:**
1. `data_center` - ✅ Template + calculator
2. `hotel` - ✅ Template + calculator
3. `car_wash` - ✅ Template + calculator  
4. `ev_charging` - ✅ Template + calculator
5. `hospital` - ✅ Template + calculator
6. `manufacturing` - ✅ Template + calculator
7. `office` - ✅ Template + calculator

**Adapter-Direct (No Template, but Calc Ready):**
8. `retail` - ✅ Adapter in registry
9. `warehouse` - ✅ Adapter in registry
10. `restaurant` - ✅ Adapter in registry
11. `gas_station` - ✅ Adapter in registry
12. `healthcare` → maps to `hospital`
13. `other` - ✅ Generic fallback

**Premium Industries:**
14. `airport` - ✅ Template
15. `casino` - ✅ Template
16. `agricultural` - ✅ Template
17. `cold_storage` - ✅ Template
18. `college` - ✅ Template
19. `government` - ✅ Template
20. `microgrid` - ✅ Template
21. `shopping_center` - ✅ Template

---

## Widget Input Schema (All Industries)

### Common Required Fields
```typescript
{
  // Authentication
  apiKey: string; // pk_live_xxxxx or pk_test_xxxxx
  
  // Industry Selection
  industry: IndustrySlug; // car_wash, hotel, etc.
  
  // Location
  state: string; // US state code or international
  zipCode?: string;
  electricityRate?: number; // $/kWh (optional, we auto-lookup)
  
  // Basic Load Profile (simplified)
  peakDemandKW?: number; // If known
  annualEnergyKWh?: number; // If known
  
  // Industry-Specific (dynamic based on industry)
  industryData: Record<string, any>;
}
```

### Industry-Specific Input Examples

**Car Wash:**
```typescript
industryData: {
  washType: "tunnel" | "automatic" | "self_service",
  bayCount: number,
  hoursPerDay: number
}
```

**Hotel:**
```typescript
industryData: {
  roomCount: number,
  hotelClass: "economy" | "midscale" | "upscale" | "luxury",
  amenities: string[] // ["pool", "restaurant", "spa", "fitness"]
}
```

**EV Charging:**
```typescript
industryData: {
  level2Chargers: number,
  dcfcChargers: number,
  hpcChargers?: number
}
```

**Office:**
```typescript
industryData: {
  squareFootage: number,
  floorCount?: number,
  dataCenter?: boolean
}
```

**Data Center:**
```typescript
industryData: {
  rackCount: number,
  avgPowerPerRackKW: number,
  redundancyTier: "1" | "2" | "3" | "4"
}
```

**Manufacturing:**
```typescript
industryData: {
  squareFootage: number,
  shiftCount: number,
  processType: "light" | "medium" | "heavy"
}
```

---

## Widget API Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Partner Site (Embedded Widget)                                 │
│  - User fills industry-specific form                            │
│  - Widget calls Merlin API                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/widget/quote                                         │
│  Headers: { "x-api-key": "pk_live_xxxxx" }                     │
│  Body: { industry, state, industryData, ... }                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  validate_widget_api_key(p_api_key)                            │
│  ├─ Check partner exists                                        │
│  ├─ Check status = 'active'                                     │
│  ├─ Check quota (free: 100, pro: 500, enterprise: unlimited)   │
│  └─ Return: { valid, partner_id, tier, quotes_remaining }      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Industry Calculator Dispatch                                   │
│  ├─ Load template for industry (if exists)                      │
│  ├─ Apply field mappings (industryData → calculator inputs)    │
│  ├─ Call calculateUseCasePower(industry, inputs)               │
│  └─ Generate TrueQuote™ envelope with kW contributors          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  calculateQuote() (SSOT)                                        │
│  ├─ Equipment sizing (BESS, inverter, transformer)             │
│  ├─ Financial calculations (NPV, IRR, payback)                 │
│  ├─ International support (currency conversion)                │
│  └─ Apply margin policy (if tier = pro/enterprise)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Track Usage                                                    │
│  INSERT INTO widget_usage (                                     │
│    partner_id, event_type='quote_generated',                   │
│    industry, location_state, quote_input, quote_output         │
│  )                                                              │
│  UPDATE widget_partners SET current_month_quotes += 1          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return Quote JSON                                              │
│  {                                                              │
│    success: true,                                               │
│    quote: {                                                     │
│      bessMW: 2.0, durationHours: 4,                            │
│      capexUSD: 2000000,                                         │
│      annualSavingsUSD: 300000,                                  │
│      paybackYears: 6.7,                                         │
│      npv: 1500000,                                              │
│      ...                                                        │
│    },                                                           │
│    trueQuote: { ... kW contributors ... },                     │
│    quotesRemaining: 99                                          │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Core API (This Week)
- [x] Database schema deployed
- [x] API endpoint file enabled
- [ ] Deploy as Supabase Edge Function
- [ ] Test with 3 seeded partners
- [ ] Test all 21 industries

**Commands:**
```bash
# Deploy widget API as Edge Function
cd supabase/functions
supabase functions new widget-quote
# Copy quoteEndpoint.ts logic to index.ts
supabase functions deploy widget-quote --project-ref fvmpmozybmtzjvikrctq
```

### Phase 2: Partner Dashboard (Next Week)
- [ ] `/partner-dashboard` route with API key display
- [ ] Usage analytics (quotes per day, by industry)
- [ ] Quota meter (current vs limit)
- [ ] Stripe billing integration (upgrade free → pro)
- [ ] White-label settings (pro+)

### Phase 3: Widget Embed Script (Week After)
- [ ] Hosted widget.js at `merlin2.fly.dev/widget.js`
- [ ] Industry-specific form generators
- [ ] Customization options (colors, logo)
- [ ] Mobile-responsive embed
- [ ] Copy-paste code snippets

### Phase 4: Demo Site (2 Weeks)
- [ ] `/widget-demo` page with live preview
- [ ] All 21 industries showcased
- [ ] Partner signup flow
- [ ] Pricing comparison table
- [ ] API documentation

---

## Industry Coverage Matrix

| Industry | Template | Calculator | Widget Ready | Notes |
|----------|----------|------------|--------------|-------|
| Data Center | ✅ | ✅ | ✅ | High accuracy |
| Hotel | ✅ | ✅ | ✅ | 4 class types |
| Car Wash | ✅ | ✅ | ✅ | 4 wash types |
| EV Charging | ✅ | ✅ | ✅ | Level 2, DCFC, HPC |
| Hospital | ✅ | ✅ | ✅ | Critical load focus |
| Manufacturing | ✅ | ✅ | ✅ | 3 shift patterns |
| Office | ✅ | ✅ | ✅ | ASHRAE-based |
| Retail | — | ✅ | ✅ | Adapter-direct |
| Warehouse | — | ✅ | ✅ | Adapter-direct |
| Restaurant | — | ✅ | ✅ | Adapter-direct |
| Gas Station | — | ✅ | ✅ | Adapter-direct |
| Airport | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Casino | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Agricultural | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| College | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Government | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Shopping Center | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Cold Storage | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Microgrid | ✅ | ✅ | 🔒 Premium | Requires pro+ tier |
| Healthcare | — | ✅ | ✅ | Maps to hospital |
| Other | — | ✅ | ✅ | Generic fallback |

---

## Tier Restrictions

### Free Tier ($0/month)
- 100 quotes per month
- 7 basic industries (hotel, car wash, office, retail, warehouse, restaurant, manufacturing)
- Standard TrueQuote™
- "Powered by Merlin" attribution required
- Community support

### Pro Tier ($99/month)
- 500 quotes per month
- All 21 industries
- Advanced TrueQuote™ with sensitivity analysis
- Custom branding (logo, colors)
- Hide attribution option
- Priority support
- Webhook notifications

### Enterprise Tier ($499/month)
- Unlimited quotes
- All industries + custom
- White-label (no Merlin branding)
- Dedicated account manager
- Custom calculator templates
- API rate limit: 1000 req/hour
- SLA guarantee

---

## Widget Customization Options

### Free Tier
- Primary color only
- Company name in header

### Pro Tier  
- Primary + accent colors
- Logo upload (150x150px)
- Custom button text
- Hide "Powered by Merlin"

### Enterprise Tier
- Full CSS customization
- Custom domain (widget.yourcompany.com)
- Embed on unlimited sites
- A/B testing support

---

## Next Actions (Priority Order)

1. **Deploy Widget API** (2 hours)
   - Create Supabase Edge Function
   - Wire up validation + tracking
   - Test with 3 seed partners

2. **Test All Industries** (3 hours)
   - Verify each calculator returns valid quote
   - Check TrueQuote™ envelopes
   - Document any gaps

3. **Create Partner Dashboard** (1 day)
   - Display API key
   - Show usage stats
   - Upgrade flow to Stripe

4. **Build Widget Demo** (2 days)
   - Live preview for all industries
   - Copy-paste embed codes
   - Signup flow

5. **Write API Docs** (1 day)
   - OpenAPI spec
   - Example requests per industry
   - Error codes reference

---

## Technical Considerations

### Rate Limiting
- Free: 10 req/min
- Pro: 60 req/min
- Enterprise: 1000 req/hour

### Caching
- Cache calculator results for identical inputs (1 hour)
- Cache utility rates by zip code (24 hours)
- Cache partner validation (5 minutes)

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly quote limit reached (100/100)",
    "upgrade_url": "https://merlin2.fly.dev/upgrade"
  }
}
```

### Webhooks (Pro+)
Partners can register webhooks for:
- `quote.generated` - New quote created
- `quota.warning` - 80% quota used
- `quota.exceeded` - Monthly limit reached

---

## Success Metrics

### Launch Targets (Q2 2026)
- [ ] 50 partner signups
- [ ] 10 paid (pro/enterprise)
- [ ] 5,000 quotes generated
- [ ] All 21 industries tested in production

### Revenue Projections
- Month 1: 10 partners × $99 = $990/mo
- Month 3: 30 partners × $99 + 2 enterprise × $499 = $3,968/mo
- Month 6: 100 partners × $99 + 10 enterprise × $499 = $14,890/mo

---

## Questions & Decisions

### Open Questions
1. Should we support international partners? (currency conversion ready)
2. White-label domains for enterprise (subdomain vs CNAME)?
3. Custom calculator templates - how to scope/price?
4. Co-marketing opportunities with partners?

### Decided
- ✅ All 21 industries supported (no restrictions by tier on variety)
- ✅ TrueQuote™ required for all quotes (trust anchor)
- ✅ Test partners seeded in database
- ✅ Stripe for billing

