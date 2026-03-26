# Group 2 Filing Prep - Pricing, Compliance, and Quote Integrity

## Filing Objective

Protect Merlin's pricing stack as a trust and enforcement architecture: source-traceable costs, separated margin layers, controlled price arbitration, three-tier quote derivation, and structural prevention of UI-side drift.

## Included Disclosure Items

- Patent 2 - MagicFit three-tier optimizer
- Patent 3 - Source-traceable quote generation system
- Patent 4 - Three-layer commercial margin policy engine
- Patent 25 - Five-priority equipment pricing waterfall
- Patent 26 - Database-driven market price arbitration
- Patent 28 - Forbidden UI computation enforcement

## Core Story for Counsel

This family is about how Merlin turns market inputs into customer-facing prices without losing traceability or control.

The strongest through-line is:

- Merlin computes a base truth from source-traceable market and benchmark data
- Merlin passes that truth through a distinct pricing policy layer
- Merlin resolves equipment prices through an ordered waterfall with market arbitration
- Merlin derives multiple quote tiers from a shared underlying pricing model
- Merlin prevents the UI from recomputing margin or net cost independently

The key advantage is architectural integrity. The system does not merely calculate prices; it constrains where pricing authority lives and how deviations are logged.

## Best Independent Claim Theme

A computer-implemented quote-generation system comprising:

- a source registry storing authoritative data-source metadata
- a calculator that associates computed quote values with source references and audit metadata
- a pricing policy engine that applies commercial adjustments separately from base cost determination
- a price-resolution engine that traverses an ordered hierarchy of equipment-price sources and performs market-data arbitration when higher-priority sources are unavailable or unreliable
- a multi-tier output engine that derives multiple customer proposals from a common pricing computation
- a UI-facing result envelope that structurally prevents client-side recomputation of protected pricing values

## Strong Dependent Claim Themes

- per-value citation objects
- quote-level deviation logging
- review and clamp events for suspicious pricing
- statistical weighting by confidence and recency
- database stored-procedure aggregation
- equipment-specific pricing segmentation
- forbidden method injection on UI result objects
- three-tier derivation from one financial model call

## Why This Group Is Defensible

- It is not just "pricing software."
- The novelty is the separation of market truth, commercialization policy, and presentation constraints.
- The system is built so that auditability survives the entire path from source ingestion to UI rendering.
- The enforcement pattern is especially useful for Section 101 positioning because it is tied to concrete control of distributed computation roles, not abstract business judgment alone.

## Prior Art Positioning

Distinguish from:

- generic CPQ systems that apply prices without source-level audit metadata
- enterprise pricing tools that allow UI or downstream services to recalculate displayed economics
- ordinary weighted averages or ETL pipelines that do not use ordered price waterfalls plus statistical arbitration plus quote-audit outputs
- generic "good better best" product tiers that are priced independently rather than derived from a shared authenticated base calculation

## Trade Secret Carveouts

Keep these out of the claims where possible:

- margin percentages by product or deal size
- exact floor and ceiling values
- exact market-to-default blend ratios
- exact review thresholds
- exact source weights and recency decay curves
- exact upsize multipliers in MagicFit

## Figures to Prepare

- three-layer pricing architecture diagram
- equipment price waterfall decision tree
- quote-audit metadata schema figure
- DB arbitration flow with source merge and weighting
- result-envelope diagram showing server/UI enforcement boundary
- three-tier proposal derivation flow

## Evidence Checklist

- sample quote output with audit metadata
- source registry records and example citations
- code excerpts showing margin policy separation
- examples of waterfall fallback behavior
- result object or type definitions carrying forbidden methods
- tests or demos showing UI cannot compute forbidden values

## Primary Source Files

- `src/services/MagicFit.ts`
- `src/services/TrueQuoteEngineV2.ts`
- `src/services/benchmarkSources.ts`
- `src/services/marginPolicyEngine.ts`
- `src/services/unifiedQuoteCalculator.ts`
- `src/services/marketDataIntegrationService.ts`
- `src/services/marginRenderEnvelopeAdapter.ts`

## Drafting Notes

- Lead with the end-to-end integrity architecture, not with isolated margin math.
- Use MagicFit to strengthen commercial value, but do not let the filing collapse into disclosing exact multipliers.
- Consider one claim set focused on quote-audit provenance and another focused on enforcement of pricing authority boundaries.
