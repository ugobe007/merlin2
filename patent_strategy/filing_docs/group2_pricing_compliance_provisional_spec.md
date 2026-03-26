# SOURCE-TRACEABLE PRICING, MARGIN CONTROL, AND QUOTE INTEGRITY SYSTEM

## Technical Field

The present disclosure relates to computer-implemented pricing and quote-generation systems for commercial energy projects. More specifically, the disclosure relates to systems that combine source-traceable cost generation, layered commercial margin control, hierarchical equipment-price resolution, market-price arbitration, multi-tier proposal derivation, and structural prevention of unauthorized client-side pricing computation.

## Background

Commercial energy quotes are often assembled from spreadsheets, supplier emails, benchmark tables, and manual markups. In such systems, the origin of each quoted value is difficult to audit, deviations from benchmark values are not consistently recorded, and customer-visible values may be recomputed or altered in downstream presentation layers. Generic pricing engines may produce a sell price, but they often do not preserve a separate record of market truth, commercialization adjustments, and customer-facing display values. Likewise, conventional quoting systems may generate multiple package options, but those options are frequently assembled independently rather than derived coherently from a shared validated base model.

Accordingly, there is a need for a quote-generation architecture that preserves source traceability from raw benchmark or market input through final customer-facing price, arbitrates between multiple price sources in a controlled hierarchy, derives multiple aligned options from a shared computation, and structurally prevents downstream user-interface layers from generating unauthorized or unaudited pricing values.

## Summary

Disclosed is a computer-implemented pricing and quote-integrity system comprising:

- a source registry storing authoritative source metadata for benchmark and market values;
- a quote calculator configured to associate individual computed values with source references and quote-level audit metadata;
- a pricing policy engine that maintains separation between market or benchmark truth and commercialization policy;
- an ordered price-resolution engine that traverses multiple equipment-pricing sources and optionally invokes statistical market arbitration when higher-priority sources are unavailable, stale, or low-confidence;
- a multi-tier configuration engine that derives multiple aligned customer proposals from a common authenticated base calculation; and
- a result-envelope architecture that exposes customer-display data to a client layer while embedding enforcement mechanisms that prevent the client layer from independently computing protected pricing values.

In some embodiments, the system logs deviations between benchmark and applied values. In some embodiments, pricing policy produces review events or clamp events when values fall outside trusted ranges. In some embodiments, weighted market arbitration merges multiple data stores using confidence and recency weighting. In some embodiments, the result object delivered to the UI contains forbidden methods or similar machine-detectable constructs that make client-side pricing computation structurally improper and detectable.

## Brief Description of the Drawings

- **FIG. 1** is a system diagram showing benchmark sources, market sources, pricing policy, quote generation, and UI delivery.
- **FIG. 2** is a diagram of a typed source registry and per-value citation architecture.
- **FIG. 3** is a flowchart showing a three-layer pricing stack including base cost, obtainable reality, and sell price.
- **FIG. 4** is a decision tree showing a five-priority equipment-pricing waterfall.
- **FIG. 5** is a diagram showing statistical arbitration over multiple market-price records with weighting and exclusions.
- **FIG. 6** is a diagram showing derivation of multiple quote tiers from a common authenticated base calculation.
- **FIG. 7** is a boundary diagram showing server-side pricing authority and UI-side enforcement using forbidden computation methods.

## Detailed Description

### 1. System Overview

In one embodiment, the disclosed system generates customer-facing quotes for commercial energy systems such as battery storage, solar generation, generators, EV infrastructure, and related balance-of-system components. The system may operate as part of a larger configuration and quoting platform. A central design objective is preserving integrity between source data, internal pricing policy, and displayed customer pricing.

### 2. Source Registry and Traceable Value Architecture

In one embodiment, the system maintains an authoritative source registry. Each source record may include one or more of a source identifier, name, organization, source type, publication date, retrieval date, vintage, last verification date, URL, and notes. Source types may distinguish primary benchmarks, secondary reports, certifications, utility tariffs, vendor records, and other categories.

When the quote engine calculates a value, the returned data structure may contain not only a number but also source-traceability metadata. For example, a value object may carry a numeric value, unit, source identifier, citation string, confidence indicator, and validity window. This enables line-item values in a quote to be tied to documented authority rather than existing as unaudited scalar outputs.

In one embodiment, a quote-level audit object records metadata such as generation time, methodology version, benchmark version, sources used, and a list of deviations. A deviation record may identify a line item, a benchmark value, an applied value, and a reason for variance.

### 3. Separation of Market Truth and Commercialization Policy

In one embodiment, the architecture enforces at least three pricing layers.

A first layer determines base cost or market truth from benchmarks, market data, vendor sources, or a combination thereof. A second layer applies commercial reality adjustments to account for procurement variability, regional effects, risk, or similar business constraints. A third layer applies customer-facing sell-price policy, including margin policy, product-class adjustments, or deal-size behavior.

This separation preserves an audit trail showing what the market or benchmark indicated before commercialization policy was applied. It also enables drift detection because the final price can be compared back to the underlying base truth.

### 4. Review Events, Clamp Events, and Pricing Control

In one embodiment, the pricing policy engine evaluates generated pricing against one or more controls. If a price appears stale, unexpectedly low, unexpectedly high, or otherwise outside trusted boundaries, the system may generate a review event requiring human review or a clamp event enforcing a floor or ceiling. Control events may be generated at unit-price level, line-item level, or total-quote level.

### 5. Ordered Equipment-Pricing Waterfall

In one embodiment, the system resolves equipment unit pricing through an ordered multi-priority waterfall. A first priority may retrieve approved vendor pricing. A second priority may use administrator-managed constants. A third priority may use synchronized equipment-pricing records. A fourth priority may use market-adjusted price calculations derived from external market intelligence. A final priority may fall back to one or more baseline benchmark values.

The search may terminate upon the first acceptable non-null result, or may continue to gather comparison data for audit purposes. Different equipment types may use different fallback conditions or segmentation logic. For instance, battery-storage pricing may incorporate size-based scaling, while solar pricing may segment between commercial and utility-scale thresholds.

### 6. Market Price Arbitration

In one embodiment, market arbitration merges records from two or more heterogeneous stores, such as a continuously updated scraped-price table and a legacy or manually maintained table. Each record may receive a weight based on confidence, recency, source type, or other factors. Statistical outputs may include weighted average, sample count, min, max, range, median, or confidence score.

In some embodiments, records may be excluded based on geography, currency, or other indicators suggesting they are not comparable to the intended market. For instance, certain cell-level or foreign-market records may be excluded when they would improperly distort North American installed-system prices.

In one embodiment, arbitration may be performed in application logic. In another embodiment, arbitration may be delegated to a database-level routine or remote procedure call that returns a weighted price summary for a given equipment category, region, capacity, or technology.

### 7. Multi-Tier Proposal Derivation

In one embodiment, the system derives multiple customer proposals from a shared base financial or engineering model. Rather than independently pricing each proposal from scratch, the system computes a validated underlying result and then derives multiple presentation tiers. The tiers may correspond to starter, recommended, and complete packages or any other grouped customer options.

In some embodiments, the relationship between tiers depends on which complementary technologies are included or excluded. For example, battery sizing or duration characteristics may be adjusted when solar or generator components are absent so that the resulting proposals remain operationally coherent. Because the tiers share a common base computation, they remain internally aligned and easier to audit.

### 8. Result-Envelope Enforcement Against UI Drift

In one embodiment, the pricing system returns to the client layer a structured result envelope for each tier. The envelope includes values intended for rendering and may also include one or more forbidden functions, machine-readable markers, or other mechanisms that explicitly prevent the client from computing protected values such as margin or net cost.

For example, a result object may contain methods which, if invoked, throw a runtime error stating that the UI must not compute certain values. The naming or type pattern of such methods may also permit static analysis or automated detection of misuse. This architecture makes it structurally difficult for downstream UI code to recreate or alter pricing logic outside the authorized pricing engine.

### 9. Computing Environment and Variations

The source registry, quote engine, pricing policy, arbitration logic, and rendering boundary controls may be implemented across one or more servers, databases, client devices, and network services. The ordered waterfall may have more or fewer levels. The market-arbitration engine may use linear weighting, non-linear weighting, or rules-based selection. The result-envelope enforcement may be implemented using methods, proxy objects, typed interfaces, serialized markers, policy wrappers, or any combination thereof.

### 10. Advantages

The disclosed system improves quote reliability by preserving source traceability, reduces pricing drift by separating pricing authority layers, strengthens enterprise trust through deviation logging and review events, and improves architectural integrity by preventing unauthorized client-side pricing calculations. The system also supports coherent multi-tier proposal generation without sacrificing auditability.

## Abstract

A computer-implemented quote-generation system stores authoritative source metadata, computes energy-project pricing values with line-item citations and quote-level audit metadata, applies layered commercialization policy separately from base cost determination, resolves equipment prices through an ordered source waterfall with optional statistical market arbitration, derives multiple customer proposal tiers from a common authenticated base calculation, and delivers result envelopes that prevent unauthorized client-side computation of protected pricing values. The disclosed architecture improves traceability, consistency, and audit integrity of commercial energy quotes.
