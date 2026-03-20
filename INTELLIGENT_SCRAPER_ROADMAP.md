# Intelligent Opportunity Scraper - Implementation Roadmap

## 🎯 Vision
Transform basic keyword scraping into an AI-powered business intelligence platform with ontological reasoning, dynamic APIs, and predictive analytics.

---

## ✅ Phase 1: Foundation (COMPLETED)
- [x] Basic RSS scraper with Google News feeds
- [x] Keyword-based signal detection
- [x] Simple confidence scoring
- [x] React dashboard UI
- [x] Supabase database integration
- [x] Run Scraper button

## 🚀 Phase 2: AI-Powered Analysis (IN PROGRESS)

### 2.1 OpenAI Integration
- [x] `aiAnalysisService.ts` - GPT-4 powered entity extraction
- [x] Structured JSON output with validation
- [x] Batch processing with rate limiting
- [ ] Add to `.env`: `VITE_OPENAI_API_KEY=sk-...`
- [ ] Test AI enrichment in dashboard

**AI Capabilities:**
- Extract company name, industry, location with high accuracy
- Identify decision makers (names, titles, potential contacts)
- Estimate project budget and timeline from article text
- Generate reasoning for opportunity quality
- Dynamic confidence scoring based on context

### 2.2 Enhanced Entity Extraction
- [ ] Company deduplication & normalization (e.g., "OpenAI" = "OpenAI Inc.")
- [ ] Location geocoding (city → lat/lon for mapping)
- [ ] Contact enrichment via LinkedIn API
- [ ] Email finder integration (Hunter.io, RocketReach)
- [ ] Company metadata (revenue, employee count, tech stack)

### 2.3 Ontological Knowledge Graph
- [ ] Define ontology schema (Company → Project → Technology → Decision Maker)
- [ ] Build relationship database (Neo4j or PostgreSQL with graph extensions)
- [ ] Track company networks (subsidiaries, partners, investors)
- [ ] Industry taxonomy tree (Data Center → Edge Computing → Private 5G)
- [ ] Historical project tracking (past wins, competitors)

---

## 📊 Phase 3: Dynamic API Layer (IN PROGRESS)

### 3.1 RESTful API Endpoints
- [x] `GET /api/opportunities` - List with filters, pagination, sorting
- [x] `GET /api/opportunities/:id` - Single opportunity details
- [x] `POST /api/scraper/run` - Trigger scraper with options
- [x] `GET /api/analytics/summary` - Dashboard statistics
- [ ] `PATCH /api/opportunities/:id` - Update opportunity
- [ ] `POST /api/opportunities/:id/contact` - Log contact attempt
- [ ] `GET /api/companies/:id/projects` - All projects by company
- [ ] `GET /api/industries/:type/opportunities` - Filter by industry

### 3.2 Webhook & Notifications
- [ ] Webhook configuration table in Supabase
- [ ] Trigger webhooks on new high-confidence opportunities (>80 score)
- [ ] Slack integration for instant notifications
- [ ] Email digest (daily/weekly summary)
- [ ] SMS alerts for mega-deals (>$100M projects)

### 3.3 GraphQL API (Advanced)
```graphql
type Company {
  id: ID!
  name: String!
  industry: Industry!
  location: Location
  projects: [Project!]!
  decisionMakers: [Contact!]!
  relationships: [CompanyRelationship!]!
}

type Project {
  id: ID!
  title: String!
  budget: Float
  timeline: DateRange
  signals: [Signal!]!
  confidence: Int!
  company: Company!
}

type Query {
  opportunities(filter: OpportunityFilter): [Project!]!
  companies(industry: Industry): [Company!]!
  decisionMakers(title: String): [Contact!]!
}
```

---

## 🧠 Phase 4: Machine Learning & Inference

### 4.1 Predictive Scoring Model
- [ ] Collect historical data (won deals, lost deals, no-response)
- [ ] Train ML model on successful patterns:
  - Industry type
  - Project size
  - Location
  - Decision-maker seniority
  - Timing (construction phase, funding round)
- [ ] Real-time win probability prediction
- [ ] A/B test AI scoring vs. keyword scoring

### 4.2 Recommendation Engine
- [ ] "Similar opportunities" based on vector similarity
- [ ] "Next best action" suggestions (e.g., "Contact CFO", "Wait for permits")
- [ ] Optimal contact timing prediction
- [ ] Email template recommendations

### 4.3 Trend Analysis & Forecasting
- [ ] Industry trend detection (e.g., "Data center boom in Texas")
- [ ] Geographic hotspot identification
- [ ] Technology adoption curves (BESS penetration by sector)
- [ ] Competitive intelligence (track competitor wins)

---

## 🌐 Phase 5: Multi-Source Intelligence

### 5.1 Additional Data Sources
- [ ] **Government filings:**
  - Construction permits (BuildZoom API)
  - Utility interconnection queues (FERC, ISO websites)
  - Environmental impact reports
- [ ] **Business intelligence:**
  - Crunchbase (funding rounds)
  - PitchBook (M&A activity)
  - LinkedIn company updates
  - Twitter/X mentions
- [ ] **Industry publications:**
  - Data Center Dynamics
  - Renewable Energy World
  - Industry conference schedules
- [ ] **Web scraping:**
  - Company career pages (hiring = growth)
  - Press release pages
  - Investor relations sites

### 5.2 Real-Time Monitoring
- [ ] RSS feed polling (every 1 hour)
- [ ] Google Alerts integration
- [ ] Twitter stream for relevant hashtags
- [ ] Reddit monitoring (r/datacenter, r/energy)
- [ ] Change detection on target company websites

---

## 🔍 Phase 6: Advanced Ontological Reasoning

### 6.1 Inference Rules
```
IF company = "Amazon" AND project = "data center" AND location = "Virginia"
THEN infer: 
  - Power demand = 50-200 MW
  - Timeline = 18-36 months
  - Decision makers = AWS infrastructure team
  - Budget range = $500M - $2B
  - BESS opportunity = HIGH (AWS uses 100% renewable energy commitment)
```

### 6.2 Relationship Inference
- Detect parent-subsidiary relationships
- Map decision-maker career moves (poached exec = new company opportunity)
- Track investment networks (VC firm → portfolio companies)
- Identify systematic partners (who builds Amazon's data centers?)

### 6.3 Semantic Search
- Natural language queries: "Show me manufacturing expansions in the Midwest with >$100M budgets"
- Vector embeddings for similarity search
- Entity disambiguation ("Amazon" the company vs "Amazon" the region)

---

## 📈 Phase 7: UI/UX Enhancements

### 7.1 Advanced Dashboard
- [ ] Interactive map view (pin opportunities on globe)
- [ ] Timeline view (opportunities by date)
- [ ] Kanban board (drag opportunities through sales stages)
- [ ] Company relationship graph visualization
- [ ] AI chat interface ("Find me data center opportunities in Texas")

### 7.2 Chrome Extension
- [ ] Highlight opportunities while browsing news sites
- [ ] One-click "Add to Merlin" from any webpage
- [ ] Contact finder overlay on LinkedIn profiles

### 7.3 Mobile App
- [ ] Push notifications for high-value leads
- [ ] Voice-to-CRM (log call notes via speech)
- [ ] Offline mode for field sales

---

## 🔐 Phase 8: Enterprise Features

### 8.1 Multi-User & Permissions
- [ ] Team workspaces
- [ ] Role-based access control (Admin, Sales, Analyst)
- [ ] Activity logging & audit trail
- [ ] Lead assignment & routing

### 8.2 CRM Integration
- [ ] Salesforce connector
- [ ] HubSpot sync
- [ ] Pipedrive integration
- [ ] Custom CSV export/import

### 8.3 Email Automation
- [ ] Personalized outreach templates
- [ ] A/B testing subject lines
- [ ] Email tracking (opens, clicks)
- [ ] Auto-follow-up sequences

---

## 💰 Monetization Strategy

### Pricing Tiers
1. **Free** - 50 opportunities/month, basic scraping
2. **Pro** ($99/mo) - Unlimited opportunities, AI enrichment, API access
3. **Enterprise** ($499/mo) - Multi-user, CRM integration, custom data sources
4. **API** (Pay-as-you-go) - $0.10/opportunity analyzed

### Success Metrics
- Opportunities discovered per week
- Win rate (qualified → closed deals)
- Average deal size
- Time to first contact
- Customer LTV vs. CAC

---

## 🛠️ Technical Stack

### Current
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** Supabase PostgreSQL
- **Hosting:** Fly.io
- **Scraping:** Custom RSS parser + DOMParser

### Phase 2+
- **AI:** OpenAI GPT-4o-mini (fast + cheap for entity extraction)
- **ML:** scikit-learn (Python microservice) or TensorFlow.js
- **Graph DB:** Neo4j or PostgreSQL with pg_graphql
- **Search:** Algolia or Meilisearch for semantic queries
- **Queue:** BullMQ (Redis) for background jobs
- **Monitoring:** Sentry (errors) + PostHog (analytics)

---

## 🎯 Next Immediate Steps

1. **Add OpenAI API key to environment**
   ```bash
   # .env.local
   VITE_OPENAI_API_KEY=sk-proj-...
   ```

2. **Update scraper to use AI enrichment**
   - Modify `runOpportunityScraper()` to call `batchAnalyzeArticles()`
   - Add toggle in UI: "Enable AI Analysis"

3. **Test AI extraction**
   - Run scraper with AI enabled
   - Verify structured data quality
   - Measure cost per opportunity (~$0.01-0.02)

4. **Build API routes**
   - Create Express/Hono server for REST endpoints
   - Add authentication (JWT tokens)
   - Document with OpenAPI/Swagger

5. **Deploy ontology database**
   - Choose graph database (Neo4j Cloud or PostgreSQL AGE)
   - Design schema for companies, projects, contacts
   - Build relationship inference rules

---

## 📚 Resources

### APIs & Services
- OpenAI: https://platform.openai.com/docs
- Hunter.io (email finder): https://hunter.io/api
- Clearbit (company data): https://clearbit.com/docs
- BuildZoom (construction permits): https://www.buildzoom.com/api
- Crunchbase: https://www.crunchbase.com/products/crunchbase-api

### ML/AI Tools
- LangChain (LLM orchestration): https://www.langchain.com/
- Pinecone (vector database): https://www.pinecone.io/
- Hugging Face (open-source models): https://huggingface.co/

### Graph Databases
- Neo4j: https://neo4j.com/
- Apache AGE (PostgreSQL): https://age.apache.org/

---

## 💡 Advanced Ideas (Future)

- **Merlin AI Agent:** Autonomous lead qualification and outreach
- **Predictive lead scoring:** ML model trained on historical wins
- **Competitive intelligence:** Track competitor activity
- **Voice interface:** "Hey Merlin, show me this week's top opportunities"
- **AR/VR:** Visualize project sites in 3D
- **Blockchain:** Verified opportunity marketplace

---

**Status:** Phase 2 in progress - AI analysis service created, API framework built  
**Next Milestone:** Enable AI enrichment in production scraper  
**ETA:** 2-3 weeks for Phase 2 completion
