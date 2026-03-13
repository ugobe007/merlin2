# Merlin Widget - Embeddable BESS Calculator

## 🎯 Product Vision

**Merlin Widget** = Mini version of Merlin that lives on 3rd-party sites

- Partners embed 5 lines of JavaScript
- Widget calls our API for calculations
- We provide TrueQuote™ verified results
- Partners capture leads, we share revenue/data

## 📊 Business Model

### Revenue Tiers

| Tier           | Price   | Quotes/mo | Features                                           | Target                         |
| -------------- | ------- | --------- | -------------------------------------------------- | ------------------------------ |
| **Free**       | $0      | 100       | "Powered by Merlin" badge required, basic branding | Lead magnet, small installers  |
| **Pro**        | $99/mo  | 500       | Co-branding, email leads, analytics                | Solar installers, consultants  |
| **Enterprise** | $499/mo | Unlimited | White-label, API access, CRM integration           | Large EPCs, associations, OEMs |

### Revenue Projections (Year 1)

- **Month 1-2**: Beta (10 partners, free tier) - Validate usage
- **Month 3**: Launch Pro tier - Target 25 partners × $99 = **$2,475 MRR**
- **Month 6**: 100 Pro partners = **$9,900 MRR**
- **Month 12**: 200 Pro + 10 Enterprise = **$24,690 MRR** (~$300K ARR)

### Lead Gen Model (Alternative)

- Free widget for partners
- We capture email addresses
- Revenue share: 20% of closed deals
- Or: $50-200 per qualified lead

## 🏗️ Technical Architecture

### Widget Embed (Partner Sites)

```html
<!-- Partner adds this to their site -->
<div id="merlin-widget" data-industry="hotel"></div>
<script src="https://widget.merlin.energy/embed.js"></script>
<script>
  MerlinWidget.init({
    apiKey: "pk_live_xxxxx", // Partner API key
    industry: "hotel", // Industry type
    theme: "light", // light | dark
    primaryColor: "#3ecf8e", // Custom brand color
    logo: "https://partner.com/logo", // Partner logo (Pro+)
    hideAttribution: false, // White-label (Enterprise only)
    onQuoteGenerated: (quote) => {
      // Callback for lead capture
      // Partner can capture lead data here
      console.log("Quote generated:", quote);
    },
  });
</script>
```

### Widget Architecture Options

**Option A: Iframe** (Recommended for MVP)

- ✅ Isolated from partner CSS
- ✅ Secure (no XSS attacks)
- ✅ Easy to update (we control HTML)
- ❌ Slight performance overhead

**Option B: Web Component**

- ✅ Native, modern
- ✅ Better performance
- ❌ More complex build
- ❌ Partner CSS can bleed in

**Decision: Start with Iframe, offer Web Component later**

### API Endpoints

```typescript
// POST /api/v1/widget/quote
// Generate a TrueQuote for partner's customer
POST https://api.merlin.energy/v1/widget/quote
Authorization: Bearer pk_live_xxxxx
Content-Type: application/json

{
  "industry": "hotel",
  "location": {
    "state": "CA",
    "zipCode": "94102"
  },
  "facility": {
    "rooms": 150,
    "electricityRate": 0.28  // Optional, auto-fetched if omitted
  },
  "options": {
    "includeSolar": true,
    "includeGenerator": false
  }
}

// Response
{
  "success": true,
  "quote": {
    "bessKWh": 1000,
    "bessMW": 0.25,
    "durationHours": 4,
    "solarKW": 150,
    "costs": {
      "equipment": 650000,
      "installation": 117000,
      "total": 767000,
      "afterITC": 460200  // 40% ITC applied
    },
    "savings": {
      "annual": 180000,
      "peakShaving": 120000,
      "demandCharge": 60000
    },
    "financials": {
      "paybackYears": 4.7,
      "npv25Year": 3200000,
      "roi25Year": 695,
      "irr": 18.5
    },
    "truequote": {
      "sources": [
        "NREL ATB 2024",
        "IRA 2022",
        "IEEE 4538388"
      ],
      "methodology": "Peak shaving, 4-hour duration",
      "confidence": 0.95,
      "timestamp": "2026-03-12T10:30:00Z"
    }
  },
  "metadata": {
    "partnerId": "partner_xxxxx",
    "quotesRemaining": 450,  // For Pro tier (500/mo limit)
    "generatedAt": "2026-03-12T10:30:00Z"
  }
}

// GET /api/v1/widget/usage
// Partner's usage stats
GET https://api.merlin.energy/v1/widget/usage
Authorization: Bearer pk_live_xxxxx

{
  "partnerId": "partner_xxxxx",
  "tier": "pro",
  "period": {
    "start": "2026-03-01",
    "end": "2026-03-31"
  },
  "usage": {
    "quotesGenerated": 342,
    "quotesLimit": 500,
    "percentUsed": 68.4,
    "widgetLoads": 1250,
    "conversionRate": 27.4  // quotes / loads
  },
  "topIndustries": [
    {"industry": "hotel", "count": 180},
    {"industry": "office", "count": 95},
    {"industry": "retail", "count": 67}
  ]
}

// POST /api/v1/widget/track
// Track widget load/interaction (optional, for analytics)
POST https://api.merlin.energy/v1/widget/track
Authorization: Bearer pk_live_xxxxx

{
  "event": "widget_loaded",  // widget_loaded | quote_started | quote_completed
  "data": {
    "url": "https://partner-site.com/calculator",
    "industry": "hotel",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Database Schema

```sql
-- Partner accounts
CREATE TABLE widget_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',  -- free | pro | enterprise
  api_key TEXT NOT NULL UNIQUE,       -- pk_live_xxxxx
  api_secret TEXT NOT NULL,            -- For admin operations
  status TEXT NOT NULL DEFAULT 'active', -- active | suspended | cancelled

  -- Customization
  primary_color TEXT DEFAULT '#3ecf8e',
  logo_url TEXT,
  white_label BOOLEAN DEFAULT false,

  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_email TEXT,

  -- Limits
  monthly_quote_limit INTEGER DEFAULT 100,  -- Based on tier

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget usage tracking
CREATE TABLE widget_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES widget_partners(id),

  -- Event tracking
  event_type TEXT NOT NULL,  -- widget_loaded | quote_generated | error
  industry TEXT,

  -- Quote data (if quote_generated)
  quote_data JSONB,  -- Full quote result

  -- Analytics
  referrer_url TEXT,
  user_agent TEXT,
  ip_address TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast queries
CREATE INDEX idx_widget_usage_partner ON widget_usage(partner_id, created_at);
CREATE INDEX idx_widget_usage_event ON widget_usage(event_type, created_at);

-- Monthly usage summary (materialized for performance)
CREATE MATERIALIZED VIEW widget_monthly_usage AS
SELECT
  partner_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) FILTER (WHERE event_type = 'quote_generated') as quotes_generated,
  COUNT(*) FILTER (WHERE event_type = 'widget_loaded') as widget_loads,
  COUNT(DISTINCT industry) as industries_used,
  AVG(CASE WHEN event_type = 'quote_generated' THEN 1.0 ELSE 0 END) as conversion_rate
FROM widget_usage
GROUP BY partner_id, DATE_TRUNC('month', created_at);

-- Refresh materialized view daily
CREATE UNIQUE INDEX ON widget_monthly_usage (partner_id, month);
```

## 🎨 Widget UI (MVP - Hotel Calculator)

### Minimal Form Fields

```
╔════════════════════════════════════════════════╗
║  How much could your hotel save?               ║
║  Powered by Merlin TrueQuote™                  ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Number of Rooms:                              ║
║  [   150   ]                                   ║
║                                                ║
║  Hotel Class:                                  ║
║  ○ Economy  ◉ Midscale  ○ Upscale  ○ Luxury   ║
║                                                ║
║  State:                                        ║
║  [ California          ▼ ]                     ║
║                                                ║
║  ┌────────────────────────────────┐            ║
║  │ Calculate Savings              │            ║
║  └────────────────────────────────┘            ║
║                                                ║
╚════════════════════════════════════════════════╝
```

### Results Display

```
╔════════════════════════════════════════════════╗
║  Your 150-room hotel could save:               ║
╠════════════════════════════════════════════════╣
║                                                ║
║  💰 $180,000/year                              ║
║  📊 4.7-year payback                           ║
║  🔋 1 MWh battery + 150 kW solar               ║
║                                                ║
║  Total Investment: $767,000                    ║
║  After Tax Credits: $460,200                   ║
║  25-Year Savings: $3.2M                        ║
║                                                ║
║  ┌────────────────────────────────┐            ║
║  │ Get Full Quote (Email)         │            ║
║  └────────────────────────────────┘            ║
║                                                ║
║  ✓ NREL-verified pricing                       ║
║  ✓ IRA 2022 tax credits included               ║
║  ✓ Bankable financial model                    ║
║                                                ║
╚════════════════════════════════════════════════╝
```

## 🚀 MVP Development Plan (2 Weeks)

### Week 1: Core Infrastructure

**Days 1-2: API Layer**

- [ ] Create `/api/v1/widget/quote` endpoint
- [ ] API key authentication system
- [ ] Rate limiting (100 quotes/mo for free tier)
- [ ] Integrate with existing `calculateQuote()` SSOT
- [ ] Database schema (widget_partners, widget_usage)

**Days 3-4: Widget Embed System**

- [ ] Build `embed.js` script (< 50KB)
- [ ] Iframe-based widget renderer
- [ ] Simple hotel calculator UI
- [ ] Theme customization (colors, logo)
- [ ] Error handling & loading states

**Day 5: Testing & Docs**

- [ ] API documentation (Postman collection)
- [ ] Integration guide (5-minute quickstart)
- [ ] Test on sample HTML page

### Week 2: Partner Experience

**Days 6-7: Demo Page**

- [ ] Public landing page for partners
- [ ] Live widget demo
- [ ] Code snippet generator
- [ ] Partner signup form

**Days 8-9: Partner Dashboard**

- [ ] Simple dashboard at `/widget/dashboard`
- [ ] API key generation
- [ ] Usage stats display
- [ ] Basic customization options

**Day 10: Beta Testing**

- [ ] Deploy to production
- [ ] Embed on 3 beta partner sites
- [ ] Monitor usage, errors
- [ ] Gather feedback

## 🎯 Success Metrics (Beta)

**Week 1-2 Goals:**

- ✅ Widget loads on 3 beta partner sites
- ✅ < 2 second load time
- ✅ > 20% conversion rate (visitors → quotes)
- ✅ 0 fatal errors in production

**Month 1 Goals:**

- 🎯 10 active partners
- 🎯 500+ quotes generated
- 🎯 Positive feedback from 8/10 partners
- 🎯 At least 1 partner willing to pay $99/mo

**Decision Point:**

- If conversion > 20% AND partners want to pay → Build Pro tier
- If conversion < 10% OR no payment interest → Pivot or kill

## 🎪 Target Partners (Beta Outreach)

1. **Solar Installers** (California)
   - SunPower, Tesla Energy, local installers
   - Pitch: "Free ROI calculator for your website"

2. **Hotel Energy Consultants**
   - Boutique consultancies serving hospitality
   - Pitch: "Branded calculator for your clients"

3. **Car Wash Associations**
   - International Car Wash Association members
   - Pitch: "Member benefit - free energy calculator"

4. **EPC Contractors**
   - Companies building BESS projects
   - Pitch: "Lead gen tool for your site"

5. **Equipment OEMs**
   - Battery manufacturers (Tesla, LG, CATL)
   - Pitch: "Showcase ROI to potential buyers"

## 📧 Beta Partner Outreach Email

```
Subject: Free BESS Calculator Widget for Your Site

Hi [Name],

I built Merlin Energy - a TrueQuote™ verified BESS calculator
that's helped 1,000+ facility managers calculate ROI in 60 seconds.

Now I'm offering it as a FREE embeddable widget for partner sites.

What you get:
✓ 5-line embed code (takes 2 minutes)
✓ Fully branded calculator on your site
✓ Lead capture (emails sent to you)
✓ NREL-verified calculations
✓ 100 free quotes/month

Perfect for:
• Solar installers (showcase ROI to prospects)
• Energy consultants (branded tool for clients)
• Industry associations (member benefit)

Want to see it in action?
→ https://widget.merlin.energy/demo

Interested in being a beta partner?
Reply and I'll set you up today.

Best,
[Your name]

P.S. This is completely free during beta. No credit card needed.
```

## 🔧 Technical Stack

- **Widget Frontend**: React + TypeScript (compiled to vanilla JS bundle)
- **Embed Script**: Vanilla JavaScript (< 10KB)
- **API**: Supabase Edge Functions or Express.js
- **Database**: Supabase Postgres
- **Auth**: API keys (pk_live_xxx format like Stripe)
- **Hosting**:
  - Widget: Cloudflare CDN (fast global delivery)
  - API: Fly.io (existing infrastructure)
- **Analytics**: Custom (widget_usage table)

## 🎨 Branding

**Widget Branding Tiers:**

**Free Tier:**

- "Powered by Merlin" badge (required)
- Small Merlin logo in corner
- Link to merlin2.fly.dev

**Pro Tier:**

- Co-branding (partner logo + Merlin)
- Custom primary color
- Smaller attribution

**Enterprise Tier:**

- Full white-label (no Merlin branding)
- Complete customization
- Custom domain option

## 📈 Future Enhancements (Post-MVP)

1. **Multi-Industry Support** (Month 3)
   - Add car wash, hospital, data center calculators
   - Partner can choose industries to enable

2. **Advanced Lead Capture** (Month 4)
   - Email collection built into widget
   - Zapier integration
   - Salesforce/HubSpot connectors

3. **A/B Testing** (Month 5)
   - Partners can test different messaging
   - Track conversion rates by variant

4. **Localization** (Month 6)
   - Spanish, French translations
   - International pricing (Europe, Asia)

5. **Mobile App SDK** (Month 9)
   - Native iOS/Android widgets
   - React Native component

## 💰 Pricing Strategy

**Launch Pricing (First 100 Partners):**

- Free: 100 quotes/mo, "Powered by Merlin" badge
- Pro: $79/mo (normally $99) - 500 quotes/mo
- Enterprise: $399/mo (normally $499) - Unlimited

**After 100 Partners:**

- Raise to standard pricing
- Grandfather early adopters at launch price

---

**Next Steps:**

1. ✅ Create this strategy doc
2. [ ] Build API endpoints
3. [ ] Build widget embed system
4. [ ] Create demo page
5. [ ] Test with 3 beta partners
6. [ ] Launch publicly

**Questions to Validate:**

- Will partners actually embed this?
- What's the conversion rate?
- What will they pay?
- What features are must-haves?

---

_Updated: March 12, 2026_
_Status: Planning → Development_
