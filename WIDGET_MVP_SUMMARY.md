# Merlin Widget MVP - Development Summary

**Created:** March 12, 2026  
**Status:** Phase 1 (Core Infrastructure) - 40% Complete  
**Next Sprint:** Database schema + Partner demo page

---

## 🎯 What We're Building

**Merlin Widget** = Embeddable BESS calculator that lives on partner sites

- Partners add 5 lines of JavaScript
- Widget calls our API for TrueQuote™ calculations
- We provide verified results + lead capture
- Revenue: $99-499/mo SaaS + lead gen sharing

---

## ✅ Completed (Today)

### 1. Strategic Planning

**File:** `WIDGET_STRATEGY.md` (920 lines)

- Complete business model (Free/Pro/Enterprise tiers)
- Revenue projections ($300K ARR Year 1)
- Technical architecture (iframe vs Web Component)
- API design (quote, usage, tracking endpoints)
- Database schema (widget_partners, widget_usage tables)
- Go-to-market strategy (beta partners, pricing)
- Success metrics (conversion rate, partner feedback)

### 2. API Layer

**File:** `src/api/widget/types.ts` (160 lines)

- TypeScript interfaces for all API types
- Partner account types (tiers, limits, billing)
- Widget configuration types
- Quote request/response types
- Usage tracking types
- Hotel-specific input types

**File:** `src/api/widget/quoteEndpoint.ts` (220 lines)

- `generateWidgetQuote()` - Main quote generation handler
- API key authentication + validation
- Usage limit checking (per tier)
- Industry-specific input mapping to SSOT
- Integration with `calculateQuote()` from unifiedQuoteCalculator
- TrueQuote™ validation envelope
- Usage tracking (widget_usage table)
- Express.js route handler

### 3. Widget Embed System

**File:** `src/widget/embed.ts` (130 lines)

- Lightweight embed script (< 10KB when compiled)
- `MerlinWidget.init()` - Partner initialization function
- Iframe creation + injection
- PostMessage communication (iframe ↔ parent page)
- Event tracking (widget_loaded, quote_completed, error)
- Auto-resize iframe to fit content
- Theme/branding customization support

### 4. Hotel Calculator Widget

**File:** `src/widget/HotelCalculator.tsx` (395 lines)

- Clean, minimal UI (Merlin branding)
- Form inputs: rooms, hotel class, state
- Radio button hotel class selector (economy/midscale/upscale/luxury)
- State dropdown (expandable to all 50 states)
- "Calculate Savings" CTA button
- Loading states + error handling
- Results display:
  - Annual savings (large, prominent)
  - Payback years, 25-year NPV
  - System specs (battery kWh, solar kW)
  - Investment costs (before/after ITC)
  - Trust badges (NREL, IRA 2022)
- "Calculate Again" reset button
- Theme support (light/dark)
- Custom branding (colors, logo)
- Attribution badge ("Powered by Merlin TrueQuote™")

---

## 📦 File Structure Created

```
src/
├── widget/
│   ├── embed.ts                  # Embed script (partner sites)
│   └── HotelCalculator.tsx       # Hotel calculator widget
├── api/
│   └── widget/
│       ├── types.ts              # TypeScript types
│       └── quoteEndpoint.ts      # Quote API handler
└── (existing files...)

WIDGET_STRATEGY.md                # Strategic plan (920 lines)
```

---

## 🚧 Next Steps (Week 1 - Days 2-5)

### Priority 1: Database Schema (Day 2)

- [ ] Create Supabase migration for `widget_partners` table
- [ ] Create `widget_usage` table
- [ ] Create `widget_monthly_usage` materialized view
- [ ] Seed with mock partner account for testing
- [ ] Generate test API key (pk_test_xxxxx)

### Priority 2: API Integration (Days 3-4)

- [ ] Connect `validateApiKey()` to Supabase
- [ ] Connect `trackWidgetUsage()` to database
- [ ] Add rate limiting middleware
- [ ] Test full API flow (request → auth → calculate → track)
- [ ] Deploy to `/api/v1/widget/quote` endpoint

### Priority 3: Widget Demo Page (Day 5)

- [ ] Create public landing page at `/widget`
- [ ] Show live widget demo (embedded on sample hotel site)
- [ ] Code snippet generator (copy/paste embed code)
- [ ] Partner signup form (collect: company name, email, industry)
- [ ] Auto-generate API key on signup
- [ ] Send welcome email with integration docs

---

## 🎯 Week 1 Goal

**By End of Week:**

- ✅ Core infrastructure built (API, widget, embed script)
- ✅ Database schema deployed
- ✅ Demo page live at `/widget`
- ✅ Working end-to-end (partner embeds widget → gets quote)
- ✅ 1-2 internal beta tests (embed on test pages)

**Success Metric:**

- Widget loads in < 2 seconds
- Quote generation works 100% of time
- No TypeScript/runtime errors

---

## 💡 Key Technical Decisions

### 1. Iframe vs Web Component

**Decision:** Start with iframe

- ✅ Isolated from partner CSS/JavaScript
- ✅ Secure (no XSS vulnerabilities)
- ✅ Easy to update (we control HTML)
- ✅ Simple implementation
- Can add Web Component later for Pro/Enterprise

### 2. API Authentication

**Decision:** Stripe-style API keys (pk_live_xxxxx)

- ✅ Industry standard format
- ✅ Easy for partners to understand
- ✅ Simple Bearer token auth
- ✅ Rate limiting per key

### 3. Calculation Engine

**Decision:** Use existing `calculateQuote()` SSOT

- ✅ Zero duplication (DRY principle)
- ✅ TrueQuote™ validation built-in
- ✅ All NREL/IRA sources already integrated
- ✅ Just map widget input → SSOT format

### 4. Usage Tracking

**Decision:** Store in Supabase (not third-party analytics)

- ✅ Full data ownership
- ✅ Custom dashboards for partners
- ✅ No GA/Mixpanel costs
- ✅ Can query for business insights

---

## 📊 Revenue Model Recap

| Tier           | Price/mo | Quotes/mo | White-Label | Target Partner                 |
| -------------- | -------- | --------- | ----------- | ------------------------------ |
| **Free**       | $0       | 100       | ❌          | Solar installers (lead magnet) |
| **Pro**        | $99      | 500       | ❌          | Consultants, small EPCs        |
| **Enterprise** | $499     | ∞         | ✅          | Large EPCs, OEMs, associations |

**Year 1 Projections:**

- Month 3: 25 Pro partners = $2,475 MRR
- Month 6: 100 Pro partners = $9,900 MRR
- Month 12: 200 Pro + 10 Enterprise = **$24,690 MRR** (~$300K ARR)

**Alternative Revenue:** Lead gen revenue share (20% of closed deals or $50-200/lead)

---

## 🎪 Beta Partner Target List

1. **Solar Installers** (California)
   - SunPower, Tesla Energy, Sunrun
   - Local installers in CA, NY, TX

2. **Hotel Energy Consultants**
   - Boutique consultancies serving hospitality

3. **Industry Associations**
   - International Car Wash Association (500+ members)
   - American Hotel & Lodging Association
   - Data Center Coalition

4. **EPC Contractors**
   - Companies building BESS projects

5. **Equipment OEMs**
   - Battery manufacturers (Tesla, LG, CATL)
   - Inverter manufacturers (SMA, Enphase)

**Outreach:** Email blast + LinkedIn DMs (template in WIDGET_STRATEGY.md)

---

## 🔧 Tech Stack

- **Widget Frontend:** React + TypeScript → compiled to vanilla JS bundle
- **Embed Script:** Pure JavaScript (< 10KB)
- **API:** Supabase Edge Functions (or Express.js on Fly.io)
- **Database:** Supabase Postgres
- **Auth:** API keys (pk_live_xxx)
- **CDN:** Cloudflare (for fast widget delivery)
- **Hosting:** Fly.io (existing infra)

---

## 📈 Success Metrics (Beta)

**Week 1-2:**

- ✅ Widget loads on 3 partner sites
- ✅ < 2 second load time
- ✅ > 20% conversion (visitors → quotes)
- ✅ 0 fatal errors

**Month 1:**

- 🎯 10 active partners
- 🎯 500+ quotes generated
- 🎯 8/10 partners give positive feedback
- 🎯 At least 1 partner willing to pay $99/mo

**Decision Point:**

- If conversion > 20% AND payment interest → Build Pro tier
- If conversion < 10% OR no payment → Pivot or kill

---

## 🚀 What's Different About Merlin Widget

1. **TrueQuote™ Verified** - Every number has a source (NREL, IRA 2022)
2. **5-Minute Integration** - Literally 5 lines of JavaScript
3. **No Backend Required** - Partner doesn't build anything
4. **Industry-Specific** - Hotel, car wash, hospital calculators (not generic)
5. **Bankable Results** - Partners can use quotes for financing
6. **Co-Branding** - Partner's logo + Merlin badge (Pro tier)
7. **Lead Capture** - Built-in email collection + CRM integration

**Competitive Moat:**

- Aurora Solar has widgets, but NO source attribution
- EnergySage requires manual vendor matching (slow)
- Generic ROI calculators don't have TrueQuote™ validation
- **We're the only NREL-verified embeddable calculator**

---

## 💭 Open Questions

1. **Pricing Validation:**
   - Will partners actually pay $99/mo?
   - Or is lead gen model better (revenue share)?

2. **Feature Prioritization:**
   - Do partners want CRM integration (Salesforce, HubSpot)?
   - Is email lead capture enough?

3. **Multi-Industry:**
   - Start with hotels only or launch with 3 industries?
   - Decision: Hotels only for MVP (validate first)

4. **Attribution:**
   - Should Free tier have "Powered by Merlin" badge?
   - Decision: Yes (brand awareness + upsell funnel)

---

## 📧 Next Action Items

**Tomorrow (Day 2):**

1. Create Supabase database migration
2. Build partner signup flow
3. Generate test API key
4. Test full widget flow (embed → quote)

**This Week:** 5. Build demo page at `/widget` 6. Create partner documentation 7. Test with 2-3 internal beta partners

**Next Week:** 8. Launch beta (invite 10 partners) 9. Monitor usage + errors 10. Gather feedback + iterate

---

**Status:** Ready to build database schema and demo page! 🚀

_Last updated: March 12, 2026_
