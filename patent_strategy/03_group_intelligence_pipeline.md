# Group 3 Filing Prep - Intelligence and Data Pipeline

## Filing Objective

Protect Merlin's market-intelligence flywheel: ingesting heterogeneous sources, extracting pricing and market signals, routing each article into two distinct downstream destinations, and generating both ML training data and actionable commercial alerts.

## Included Disclosure Items

- Patent 8 - Market inference engine
- Patent 16 - Multi-source energy equipment price intelligence system
- Patent 17 - Continuous RSS-to-ML training pipeline
- Patent 18 - Opportunity detection engine
- Patent 23 - Baseline-relative price alert classification
- Patent 27 - Dual-pipeline intelligence architecture

## Core Story for Counsel

This family is Merlin's data moat.

The system:

- fetches from heterogeneous energy-market sources
- normalizes and classifies articles and extracted prices
- routes one fetched article into both a long-term ML corpus and a short-term alerting path
- scores opportunities using domain-specific signal and industry axes
- feeds downstream pricing recommendations and commercial opportunity ranking

The cleanest claim theme is the single-fetch, dual-destination wiring architecture supported by equipment-category-specific routing and contextual classification.

## Best Independent Claim Theme

A computer-implemented market-intelligence system comprising:

- a source management layer storing multiple energy-market content sources
- a fetch routine that retrieves content items from selected sources
- a classification layer that determines one or more equipment categories and extracts one or more price indicators from each content item
- a first routing path that stores structured data in a machine-learning training repository
- a second routing path that evaluates the same content item against contextual baseline criteria to generate an alert or opportunity record
- a downstream recommendation layer that updates or informs quote-engine pricing or lead prioritization based on the routed content

## Strong Dependent Claim Themes

- DB-first source selection with hardcoded fallback
- equipment-category-filtered source fetching
- dual-pattern or multi-pattern extraction rules
- project-cost decomposition to implied unit pricing
- context-inferred baseline selection from article text
- five-tier alert classification
- two-axis signal-by-industry opportunity scoring
- URL-based deduplication and source-health monitoring

## Why This Group Is Defensible

- The novelty is not scraping.
- The novelty is not ML training.
- The novelty is not price alerts.
- The novelty is the coordinated architecture in which the same fetched market content feeds distinct downstream systems with distinct time horizons and business purposes.

## Prior Art Positioning

Distinguish from:

- generic RSS readers or media monitors
- generic ETL pipelines that populate one destination only
- generic price alerts based on structured feeds rather than contextual article parsing
- generic lead-scoring systems that do not use domain-specific signal and industry axes for commercial energy projects
- generic market dashboards that consume data but do not create a feedback loop into pricing and opportunity generation

## Trade Secret Carveouts

Do not unnecessarily disclose:

- exact reliability scores
- exact recency scores
- exact signal bonuses and industry bonuses
- exact relevance thresholds
- curated keyword vocabularies in full

## Figures to Prepare

- dual-pipeline architecture diagram
- source ingestion and equipment-category filter diagram
- article processing flow from fetch to AI training and price alerts
- price alert classification flow showing contextual baseline selection
- opportunity scoring flow showing signal and industry axes
- optional feedback-loop figure from intelligence outputs back to pricing recommendations

## Evidence Checklist

- examples of source records and scrape jobs
- article examples that generated ML rows and alert rows
- database schema screenshots for `ai_training_data`, `energy_price_alerts`, and `opportunities`
- code excerpts showing dual dispatch from the same fetch event
- evidence of category-specific source routing
- example alert or opportunity dashboard screenshots

## Primary Source Files

- `src/services/marketDataParser.ts`
- `src/services/marketDataScraper.ts`
- `src/services/rssToAIDatabase.ts`
- `src/services/rssAutoFetchService.ts`
- `src/services/priceAlertService.ts`
- `src/services/opportunityScraperService.ts`
- `src/services/mlProcessingService.ts`
- `src/services/marketInferenceEngine.ts`
- `src/pages/OpportunitiesDashboard.tsx`

## Drafting Notes

- Anchor the filing around Patent 27 because it provides the cleanest architectural center.
- Use Patents 16, 17, 18, and 23 as concrete dependent-claim support.
- If budget requires narrowing, drop Patent 8 from the independent claim and use it as reinforcement rather than as the narrative center.
