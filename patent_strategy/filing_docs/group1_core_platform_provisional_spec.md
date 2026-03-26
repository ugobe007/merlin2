# MERLIN ENERGY CONFIGURATION AND PROACTIVE QUOTING PLATFORM

## Technical Field

The present disclosure relates to computer-implemented systems for energy-system configuration, sizing, recommendation, and quoting. More specifically, the disclosure relates to a location-aware, confidence-gated, multi-step platform that transforms limited business and site inputs into constrained hybrid energy-system proposals while proactively computing results before a user explicitly requests final output.

## Background

Commercial energy projects involving battery energy storage, solar generation, backup generation, and related distributed-energy resources are commonly designed through fragmented workflows. Existing tools often require manual intake, separate engineering review, separate pricing review, and multiple vendor interactions before a customer receives any meaningful proposal. Generic configure-price-quote systems may capture customer inputs, but they do not natively couple geographic energy intelligence, facility-type constraints, operational load characteristics, and user goals into a unified sizing flow. Generic web wizards also do not proactively synthesize final engineering results based on in-progress user state, nor do they alter user workflow in response to confidence-weighted facility classification while atomically populating downstream physics constraints.

Accordingly, there is a need for an integrated platform that reduces friction in the configuration process, adapts the workflow based on confidence in inferred facility type, progressively reveals geographic intelligence, and begins computing final candidate energy-system configurations before the user reaches the final results stage.

## Summary

Disclosed is a computer-implemented Merlin energy configuration platform comprising:

- a location intake component that receives a ZIP code or other location identifier and resolves location information through a multi-tier fallback chain;
- a geographic intelligence layer that retrieves utility-rate, solar-resource, weather, outage, and other location-specific intelligence and progressively exposes such intelligence in the user interface as results become available;
- a business-classification component that infers a facility or industry type from a business name using a confidence-weighted classifier;
- a workflow controller that conditionally eliminates an intermediate wizard step when inferred facility confidence exceeds a threshold;
- an atomic constraint population routine that, in the same user action that changes workflow state, populates facility-specific energy constraints required for downstream sizing;
- a multi-layer sizing engine that combines geographic, facility, operational, and user-goal parameters to determine one or more candidate hybrid energy-system configurations; and
- a proactive background synthesis engine that computes candidate tiers before the user reaches the results view, using a content-addressable key to deduplicate in-flight computations and trigger rebuilds when relevant state changes.

In certain embodiments, solar eligibility is controlled by both a geographic gate and a facility gate. In certain embodiments, user answers are semantically partitioned so that only physics-affecting answers retrigger power calculation. In certain embodiments, generator recommendation is automatically enabled at the reducer level based on grid reliability. In certain embodiments, user-interface content reveal and advisor behavior are controlled by machine-readable policy definitions.

## Brief Description of the Drawings

The following drawings should be prepared and filed with this specification:

- **FIG. 1** is a high-level system diagram showing intake, geographic intelligence, business classification, workflow control, sizing, and proactive background synthesis.
- **FIG. 2** is a flowchart of fail-soft location resolution using a multi-tier fallback chain and parallel intelligence fetches.
- **FIG. 3** is a state-transition diagram showing confidence-gated step elimination and atomic facility-constraint population.
- **FIG. 4** is a diagram of the four-layer sizing architecture including location, facility, operational profile, and goal layers.
- **FIG. 5** is a sequence diagram showing proactive tier generation using a content-addressable promise cache, deduplication of in-flight builds, stale detection, and silent rebuild.
- **FIG. 6** is a diagram showing selective memoization of physics-affecting answers versus non-physics intent answers.
- **FIG. 7** is a diagram showing generator auto-enablement based on grid reliability through a unidirectional reducer recommendation.
- **FIG. 8** is a diagram showing machine-readable UX policy constraints controlling content reveal and advisor messages.

## Detailed Description

### 1. Platform Overview

In one embodiment, the platform is implemented as a multi-step web application executed at least partly in a browser and at least partly through one or more backend services. The platform collects user input relating to business identity, location, facility characteristics, operational loads, and commercial objectives. Based on this state, the platform generates multiple candidate energy-system configurations, each potentially comprising battery storage, solar generation, backup generation, EV charging support, and other distributed-energy components.

The platform differs from ordinary web forms because user workflow is driven by inference and technical constraints rather than by fixed navigation alone. Results generation is not deferred until the final step. Instead, relevant system configurations begin building during earlier workflow stages based on sufficiently complete state.

### 2. Location Resolution and Geographic Intelligence

In one embodiment, a user enters a ZIP code. The platform normalizes the ZIP code to a valid five-digit value and triggers location resolution after debounce. Resolution may proceed through multiple fallback tiers. A first tier may call an external geocoder to determine city, state, and optionally latitude and longitude. A second tier may infer the state or regional utility context from a local utility-rate dataset if external geocoding is unavailable or incomplete. A third tier may use the ZIP code itself as an identity fallback to preserve the user workflow even if named geography is unavailable.

In parallel with or immediately after location resolution, the platform initiates multiple independent intelligence fetches. These may include utility pricing, solar irradiance or peak sun hours, and weather or climate conditions. The fetches may execute independently using a fail-soft mechanism such as settlement of multiple asynchronous operations without requiring all to succeed. Corresponding user-interface cards or panels may populate independently as results arrive so that one failed intelligence source does not block display of others.

In certain embodiments, the geographic intelligence layer further derives a solar-viability grade from a continuous solar resource value, combines outage metrics into a grid-reliability category, and selects dispatch or product recommendations based on time-of-use rate structure, incentives, and reliability characteristics.

### 3. Business Classification and Confidence-Gated Step Elimination

In one embodiment, the platform receives a business name and applies a client-side classifier to detect a likely facility type or industry slug. The classifier may use keyword matching, named-entity recognition of known brands, synonym mapping, or other lightweight inference methods, and may produce a confidence score.

If the confidence exceeds a defined threshold, the platform may skip an intermediate industry-selection step. Importantly, the platform does not merely change the navigation path. In the same user action or event-loop tick that confirms the business and advances the workflow, the platform also populates downstream physics constraints corresponding to the inferred facility type. Such constraints may include realistic solar capacity, usable roof area, critical load percentage, estimated roof area, or similar facility-bound technical parameters.

This atomic coupling avoids a null-state window that could otherwise render incorrect downstream recommendations. For example, if workflow state were advanced before solar capacity constraints were populated, downstream sizing could incorrectly conclude that solar is unavailable.

### 4. Four-Layer Sizing Architecture

In one embodiment, the system sizes candidate energy solutions through a hierarchical four-layer model.

At a first layer, location intelligence constrains available technologies and expected yield. Solar feasibility may depend on geographic solar grade. Utility tariffs and outage patterns may shape load-management and backup recommendations.

At a second layer, facility type constrains physical and operational feasibility. Different facilities may support different realistic solar capacities, critical-load fractions, or baseline intensity assumptions.

At a third layer, operational profile inputs define site-specific load behavior. Such inputs may include base load, peak load, operating hours, equipment counts, EV charging load, or other demand indicators.

At a fourth layer, user goals alter weighting or optimization emphasis. Goals may emphasize lower upfront cost, maximum savings, fuller resilience, or other commercial objectives. In some embodiments, goals influence weighting rather than setting raw values directly.

The platform may then derive multiple candidate system tiers from these combined constraints.

### 5. Dual-Gate Technology Feasibility

In some embodiments, a given technology is included only when multiple independent gates are satisfied. Solar inclusion may require both a geographic viability threshold and a facility-specific physical-capacity threshold. If either gate fails, solar may be excluded from candidate systems. This dual-gate model ensures the platform does not recommend technology solely because a site has good solar resource or solely because a facility type often supports solar.

### 6. Proactive Background Synthesis

In one embodiment, once sufficient user state is known, the platform begins building candidate tiers before the final results step is shown. The build trigger may occur during or shortly after operational input steps. The build process may use a deterministic content-addressable key derived from relevant state variables such as location attributes, inferred industry, load values, technology selections, and other configuration parameters.

If a build corresponding to that key is already in flight, the platform returns the existing asynchronous operation rather than starting a duplicate build. If state changes and the current visible results no longer correspond to the latest key, the platform may retain the stale results temporarily while silently launching a rebuild. Once the rebuild completes, the new results replace the old results without requiring a blocking full-page wait.

This architecture differs from conventional prefetch because the system is not merely fetching static content. It is proactively synthesizing engineering or financial results keyed to a user-specific energy configuration state.

### 7. Selective Memoization of User Answers

In one embodiment, the platform divides user answers into at least two classes:

- physics-affecting answers, such as equipment counts, square footage, room counts, operational hours, or other values affecting power or energy demand; and
- non-physics intent answers, such as interest in optional technologies, workflow markers, or presentation-related toggles.

The platform computes a memoization key from the physics-affecting subset to determine whether load calculation should rerun. A broader key may track all answers for purposes such as invalidating tier caches. This semantic partition avoids unnecessary recalculation when a user toggles an optional interest that does not change physical demand.

### 8. Blended Solar Capacity Estimation

In one embodiment, the platform estimates solar capacity using both measured area information and facility-default anchoring. A user-specified roof area or total site area may be translated into a capacity estimate, and that capacity estimate may be blended with an industry-default static cap or default roof estimate to avoid unstable swings caused by unusual measurements or missing data. The system may also prepopulate area estimates based on inferred facility type before the user enters explicit dimensions.

### 9. Reducer-Level Generator Recommendation

In one embodiment, the platform treats certain reliability conditions as triggers for enabling or recommending backup generation. Rather than displaying only a visual suggestion, the platform may update canonical state through a reducer-level operation such that generator enablement becomes persistent through navigation changes and refresh events. In some embodiments, the logic is unidirectional so that a reliability event can enable a generator recommendation without later automatically disabling a manually selected generator.

### 10. Machine-Readable UX Policy

In one embodiment, user-interface reveal rules are encoded as data rather than solely as informal design guidance. A policy object may specify maximum copy blocks, reveal triggers, progressive panel order, and advisor message templates with live data tokens. Such machine-readable policy enables interface behavior to remain consistent with a data-first product philosophy while ensuring the interface responds to real user values instead of static copy.

### 11. Example Computing Environment

The disclosed platform may be implemented through one or more client devices, backend servers, cloud databases, or external data providers. Functional modules may be distributed across one or more services or executed in a single runtime. State may be stored locally, remotely, or both. The inventions described herein are not limited to any particular programming language, framework, or deployment topology.

### 12. Variations

The business classifier may be implemented through regex, machine learning, or hybrid inference. The content-addressable key may include more or fewer parameters. The number of wizard steps may vary. The number of candidate system tiers may vary. Geographic inputs may include postal code, address, coordinates, or utility account information. The platform may operate in browser-only, server-assisted, or hybrid modes. These and other variations remain within the scope of the disclosed subject matter.

## Abstract

A computer-implemented energy configuration platform receives location and business inputs, resolves geographic intelligence through a fail-soft multi-source process, infers facility type with a confidence-weighted classifier, conditionally alters workflow by skipping an intermediate step, atomically populates facility-specific technical constraints, and proactively computes candidate hybrid energy-system tiers before the user requests final results. The platform may selectively recompute only when physics-affecting answers change, may determine solar eligibility based on multiple gates, and may persist generator recommendations through reducer-level state changes. The disclosed architecture improves speed, consistency, and technical correctness of commercial energy-system quoting.
