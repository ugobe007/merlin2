# RapidAPI — Merlin Partner API Listing

# Submit at: https://rapidapi.com/developer/dashboard → Add new API

# Upload src/api/openapi.yaml directly, or fill the form below.

## API Name

Merlin Energy Partner API

## Tagline

Programmatic BESS quoting, lead data, and energy benchmarks for energy platforms.

## Category

Energy | Finance | Business Intelligence

## Short Description (255 chars)

REST API for programmatic BESS quoting, SMB lead generation, and energy benchmarks.
Generate TrueQuote™ estimates, manage quotes, retrieve NREL/EIA data, and configure
webhooks — 3 tiers from Starter to Enterprise.

## Full Description

The Merlin Energy Partner API gives energy platforms, EPC contractors, and SaaS
applications programmatic access to:

**Quote Engine**

- `POST /quotes` — Submit a BESS quote request (peak demand, industry, ZIP, use-case)
  Returns: sizing (MW/MWh), total cost, annual savings, payback period, NPV, IRR, CO₂ offset
- `GET /quotes/{id}` — Retrieve a completed quote
- `GET /quotes/{id}/proposal` — Download a PDF-ready proposal in JSON

**Lead Intelligence**

- `POST /leads` — Submit a qualified lead for enrichment and routing
- `GET /industries` — List all 18 supported industry verticals
- `GET /industries/{slug}/benchmarks` — NREL/EIA benchmarks for a specific industry

**Webhooks**

- `POST /webhooks` — Register a webhook for real-time quote/lead events
- `DELETE /webhooks/{id}` — Remove a webhook

**Authentication**

- `POST /auth/token` — Issue a JWT access token (OAuth 2.0 client credentials)
- `GET /health` — Health check

## Pricing Tiers

| Plan         | Price      | Rate Limit   | Best For                     |
| ------------ | ---------- | ------------ | ---------------------------- |
| Starter      | $299/month | 100 req/hr   | Brokers, small energy teams  |
| Professional | $499/month | 500 req/hr   | Mid-market integrators       |
| Enterprise   | $999/month | 5,000 req/hr | Large platforms, white-label |

## OpenAPI Spec

Upload: `src/api/openapi.yaml` (OpenAPI 3.1.0)
Base URL: `https://api.merlinpro.energy/v1`

## Website

<https://merlinpro.energy>

## Documentation URL

<https://docs.merlinpro.energy>

## Support Email

dev@merlinpro.energy

## Tags

energy, bess, battery-storage, quoting, solar, truequote, nrel, eia, commercial-energy, saas, b2b, rest, openapi
