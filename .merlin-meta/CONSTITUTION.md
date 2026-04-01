# 🏛️ THE MERLIN CONSTITUTION

## Canonical Elements, Policies & Non-Violatable Rules

**Version:** 1.0.0  
**Effective:** March 31, 2026  
**Authority:** Robert Christopher, Founder  
**⚠️ FOR ALL LLMs, AI AGENTS, AND DEVELOPERS: This document is the supreme authority for all Merlin development. Nothing overrides it.**

---

## ARTICLE I — WHAT MERLIN IS (Canonical Identity)

### § 1.1 Core Definition

Merlin is a **B2B energy intelligence platform** that:

1. Provides accurate BESS (Battery Energy Storage System) quote generation via the **TrueQuote™ Engine**
2. Operates **18 industry-specific SMB verticals** that generate qualified leads
3. Functions as a **dual revenue model**: SaaS subscriptions + lead generation fees
4. Serves **energy professionals** (EPCs, integrators, battery cos) AND **SMB operators** (hotels, car washes, data centers, etc.)

### § 1.2 What Merlin Is NOT

- ❌ NOT a general-purpose energy calculator
- ❌ NOT a utility billing tool
- ❌ NOT a solar-only product
- ❌ NOT a consumer product
- ❌ NOT a marketplace (we generate leads, we don't transact them)
- ❌ NOT a replacement for licensed energy consultants (we augment them)

### § 1.3 The Merlin Brand Voice

> Confident. Data-backed. Precise. Accessible to experts AND non-experts.

- Merlin speaks in **real numbers**, not vague ranges
- Merlin explains **why** a recommendation is made, not just what it is
- Merlin **cites sources** (NREL, DOE, utility tariff databases)
- Merlin does NOT oversell — the math does the selling

---

## ARTICLE II — CANONICAL TECHNICAL ELEMENTS

### § 2.1 The Single Source of Truth (SSOT) — INVIOLABLE

**`unifiedQuoteCalculator.ts` is the ONE AND ONLY calculation engine.**

```
INVIOLABLE RULE: ALL financial calculations (NPV, IRR, payback, savings,
equipment costs) MUST route through unifiedQuoteCalculator.ts.
No exceptions. No workarounds. No duplicates.
```

Violation consequences:

- Inconsistent numbers across the app
- User distrust when quotes don't match
- Legal/compliance risk for energy proposals

### § 2.2 TrueQuote™ Engine Integrity

The TrueQuote algorithm must ALWAYS:

- Use the **47+ variable model** (no stripping for performance)
- Reference **authoritative benchmark sources** (NREL ATB 2024, DOE/Sandia StoreFAST)
- Include **uncertainty bounds** on all estimates
- Achieve **≥95% correlation** with installed system actuals
- Version-stamp every calculation (for audit trail)

### § 2.3 Canonical Data Architecture

```
Supabase (PostgreSQL)     → Source of truth for all persisted data
unifiedQuoteCalculator.ts → Source of truth for all calculations
industryProfiles/         → Source of truth for load profiles
benchmarkSources.ts       → Source of truth for pricing data
```

**Rule:** No calculation results should be stored as primary data — they must always be recomputable from inputs + the SSOT engine.

### § 2.4 Industry Verticals (Canonical 18)

The following verticals are canonical and approved. Adding new ones requires explicit approval:

| Vertical             | Status     | Lead Value |
| -------------------- | ---------- | ---------- |
| Car Wash             | ✅ Active  | $150/lead  |
| Hotel/Hospitality    | ✅ Active  | $200/lead  |
| Data Center          | ✅ Active  | $500/lead  |
| EV Charging Hub      | ✅ Active  | $300/lead  |
| Restaurant           | ✅ Active  | $100/lead  |
| Office Building      | ✅ Active  | $150/lead  |
| Warehouse/Industrial | ✅ Active  | $200/lead  |
| Manufacturing        | ✅ Active  | $400/lead  |
| University/Campus    | ✅ Active  | $300/lead  |
| Hospital/Healthcare  | ✅ Active  | $400/lead  |
| Agriculture          | ✅ Active  | $150/lead  |
| Retail               | ✅ Active  | $100/lead  |
| Grocery/Cold Storage | 🔄 Planned | $200/lead  |
| Brewery/Winery       | 🔄 Planned | $150/lead  |
| Government/Municipal | 🔄 Planned | $300/lead  |
| Multi-Family Housing | 🔄 Planned | $200/lead  |
| Self-Storage         | 🔄 Planned | $100/lead  |
| Telecom Tower        | 🔄 Planned | $300/lead  |

---

## ARTICLE III — NON-VIOLATABLE POLICIES

### § 3.1 Data Integrity Policies

```
POLICY-001: NEVER hard-code pricing in components.
            All pricing MUST come from pricingServiceV45.ts or unifiedPricingService.ts

POLICY-002: NEVER bypass validation schemas.
            All user inputs MUST pass through validationSchemaService.ts

POLICY-003: NEVER expose Supabase service keys client-side.
            All DB writes MUST go through server-side API routes.

POLICY-004: NEVER store PII (personal identifiable information) without encryption.
            Email, phone, company name require encryption at rest.

POLICY-005: NEVER display unvalidated quote outputs to users.
            All TrueQuote outputs MUST pass calculationValidator.ts
```

### § 3.2 Code Quality Policies

```
POLICY-006: TypeScript strict mode is NON-NEGOTIABLE.
            No 'any' types except where absolutely necessary (and must be documented).

POLICY-007: No component may contain business logic.
            Components render. Services calculate. This separation is MANDATORY.

POLICY-008: All new services must have unit tests.
            Minimum 80% coverage for service files.

POLICY-009: Feature flags for all new major features.
            Use featureGatingService.ts for all gradual rollouts.

POLICY-010: No direct database queries from frontend.
            ALWAYS use the API layer (server/routes/).
```

### § 3.3 Financial Accuracy Policies

```
POLICY-011: All BESS sizing must include degradation modeling.
            Use batteryDegradationService.ts. Never assume constant capacity.

POLICY-012: All financial projections must use real utility rate data.
            Use utilityRateService.ts. Never use national averages without disclosure.

POLICY-013: All quotes must include uncertainty disclosure.
            ±15% variance disclosure is mandatory on all output UIs.

POLICY-014: ITC calculations must use current federal law.
            Update itcCalculator.ts when tax law changes. Flag if >90 days stale.

POLICY-015: All savings projections must use conservative assumptions.
            Never project best-case. Always use p50 (median) scenario.
```

### § 3.4 UX/Design Policies

```
POLICY-016: Wizard steps must be progressive.
            Never ask for information you won't use in the output.

POLICY-017: Error messages must be human-readable.
            No stack traces, error codes, or developer jargon to end users.

POLICY-018: Loading states are mandatory for operations >500ms.
            Never leave users staring at a blank screen.

POLICY-019: Mobile responsiveness is required for all new UI.
            Test on 375px minimum viewport width.

POLICY-020: Accessibility minimum: WCAG 2.1 AA.
            All interactive elements must be keyboard-navigable.
```

---

## ARTICLE IV — LLM & AI AGENT GOVERNANCE

### § 4.1 AI Agent Authorization Levels

```
LEVEL 0 (Read Only):
- Can read any file, generate reports, suggest changes
- CANNOT modify any file

LEVEL 1 (Safe Writes):
- Can add new files (not modify existing critical files)
- Can add tests
- Cannot touch: unifiedQuoteCalculator.ts, benchmarkSources.ts, pricingServiceV45.ts

LEVEL 2 (Supervised Writes):
- Can modify non-critical service files
- Must log all changes to agents/_change_log.json
- Cannot push to production without human review

LEVEL 3 (Full Access) — HUMAN ONLY:
- Can modify SSOT files
- Can deploy to production
- Can modify this Constitution
```

### § 4.2 What LLMs MUST Do

1. **Always read this file first** before modifying any Merlin code
2. **Always check DEPRECATION_STATUS.md** before using any service
3. **Always run typecheck** after making TypeScript changes
4. **Always update tests** when modifying service logic
5. **Always log changes** in `agents/_change_log.json`
6. **Always prefer editing existing services** over creating new ones

### § 4.3 What LLMs MUST NOT Do

1. ❌ Create new calculation logic outside `unifiedQuoteCalculator.ts`
2. ❌ Remove existing validation without replacement
3. ❌ Commit `.env` files or API keys
4. ❌ Remove audit trail code (benchmarkSources, version stamps)
5. ❌ Change pricing formulas without updating benchmarkSources.ts
6. ❌ Add `console.log` debug statements to production code
7. ❌ Disable TypeScript errors with `@ts-ignore` or `@ts-nocheck`
8. ❌ Merge into main without passing CI (typecheck + lint + tests)

---

## ARTICLE V — MERLIN PRODUCT ROADMAP AUTHORITY

### § 5.1 Approved Feature Backlog (Priority Order)

1. **Merlin Pro v2** — Advanced EPC dashboard with multi-project management
2. **API Partner Program** — White-label TrueQuote API for battery manufacturers
3. **Newsletter/Intelligence Feed** — Weekly energy market intelligence for users
4. **MCP Sales Agent** — AI-powered sales assistant via Model Context Protocol
5. **Installer Marketplace** — Certified installer network with lead routing
6. **International Expansion** — Canada, UK, Australia markets
7. **Merlin Mobile** — Native iOS/Android for field assessments
8. **Merlin Enterprise** — Multi-site portfolio analysis

### § 5.2 Permanently Rejected Features

- ❌ Consumer-facing residential solar tool (not our market)
- ❌ Crypto/blockchain energy trading (distraction from core)
- ❌ Real-time energy trading dashboard (regulatory risk)
- ❌ Competitor pricing scraping (legal risk)

---

## ARTICLE VI — OPERATIONAL STANDARDS

### § 6.1 Deployment Gates

No code reaches production without passing:

1. `npm run typecheck` — Zero TypeScript errors
2. `npm run lint` — Zero ESLint errors
3. `npm run test` — All tests pass
4. Manual smoke test on staging (SMOKE_TEST_CHECKLIST.md)
5. Robert Christopher final approval for major features

### § 6.2 Incident Response

- Severity 1 (system down): 15-minute response, page Robert
- Severity 2 (broken quote path): 1-hour response
- Severity 3 (UI bug): Next business day
- All incidents logged in `agents/_incidents.json`

### § 6.3 Daily Operations (Automated)

The Merlin Agent runs daily at 6:00 AM PT and must report:

1. System health score (0-100)
2. Quotes generated (24h, 7d, 30d)
3. Leads generated (24h, 7d, 30d)
4. Top error patterns
5. Performance metrics (p50, p95, p99 latency)
6. Newsletter content draft

---

## SIGNATURES & VERSION HISTORY

| Version | Date       | Author             | Change               |
| ------- | ---------- | ------------------ | -------------------- |
| 1.0.0   | 2026-03-31 | Robert Christopher | Initial constitution |

**This document may only be amended by Robert Christopher (Founder).**

---

_"Merlin doesn't just quote energy — it transforms how the world deploys it."_
