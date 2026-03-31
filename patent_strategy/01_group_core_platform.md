# Group 1 Filing Prep - Core Quoting Platform

## Filing Objective

Protect Merlin's core platform architecture: the path from minimal business and location input to constrained, optimized hybrid-system output, with proactive computation and wizard-state coupling that reduces latency and user friction.

## Included Disclosure Items

- Patent 0 - Merlin Energy Configuration System
- Patent 1 - Four-Layer Energy System Sizing Engine
- Patent 7 - Geographic Intelligence Engine
- Patent 9 - Proactive Background Synthesis Engine
- Patent 10 - Fail-Soft Triple-Tier Location Resolution
- Patent 11 - Confidence-Gated Wizard Step Elimination
- Patent 12 - Equipment-Answer Selective Memoization
- Patent 13 - Measured-Area Solar Capacity Blending
- Patent 14 - Grid Reliability to Generator Auto-Enable
- Patent 15 - Teach Through Revelation UX Architecture

## Core Story for Counsel

Merlin is not just a wizard or a calculator. It is a coupled configuration platform in which:

- location intelligence begins early and resolves through fallback paths
- business classification changes the workflow itself
- physics constraints are populated atomically with navigation changes
- downstream results are precomputed before the user reaches the results step
- recommendations are shaped by location, facility, operation, and business goals in a single constraint chain

The strongest claim theme is the coupling of classification, constraint population, and proactive tier generation in one continuous state-driven system.

## Best Independent Claim Theme

A computer-implemented energy configuration system comprising:

- a location intake module with multi-tier fallback resolution
- a business-classification engine that assigns a facility type confidence value
- a workflow controller that conditionally eliminates an intermediate step when the confidence exceeds a threshold
- an atomic constraint population routine that populates facility-specific energy constraints in the same user action that changes workflow state
- a proactive background synthesis module that computes candidate energy-system tiers before a user requests final results
- a sizing engine that combines geographic, facility, operational, and goal parameters to produce multiple system configurations

## Strong Dependent Claim Themes

- content-addressable cache keys built from state parameters
- stale-while-rebuilding result replacement
- progressive reveal of location intelligence cards
- solar inclusion only when both geographic and facility gates are satisfied
- selective memoization for physics-affecting answers
- roof-area blending with industry-default anchoring
- reducer-level recommendation persistence for generator enablement
- machine-readable UX policy constraints

## Why This Group Is Defensible

- The novelty is not a generic wizard.
- The novelty is not generic location lookup.
- The novelty is not generic background prefetch.
- The novelty is the specific coupling between these components so that workflow state, physics constraints, and result generation are synchronized and latency-masked.

## Prior Art Positioning

Distinguish from:

- conventional CPQ wizards that do not atomically bind classification to physics constraints
- ordinary browser prefetching, which fetches content rather than async engineering calculations keyed to user configuration state
- generic business classifiers that do not skip workflow steps and populate energy constraints in the same interaction
- solar or storage calculators that do not unify geographic gates, facility gates, goal weighting, and proactive tier generation

## Trade Secret Carveouts

Do not lock these specific values into the claims unless required:

- confidence thresholds
- exact industry keyword weights
- exact solar viability breakpoints
- exact industry facility constraint values
- exact advisor wording or UX copy

## Figures to Prepare

- system overview diagram from intake through final tier generation
- state-transition diagram for business confirmation and step skipping
- sequence diagram for proactive tier build and stale rebuild behavior
- diagram of the four-layer sizing stack
- UI progression showing progressive reveal and early tier generation

## Evidence Checklist

- screenshots of Step 1, Step 3, and result tiers
- commit history showing introduction of proactive tier generation
- reducer or hook excerpts showing business confirmation and atomic constraint population
- dated product screenshots or customer demo recordings
- logs or tests showing stale cache detection and rebuild

## Primary Source Files

- `src/wizard/v8/useWizardV8.ts`
- `src/wizard/v8/wizardState.ts`
- `src/wizard/v8/step4Logic.ts`
- `src/services/useCasePowerCalculations.ts`
- `src/services/geographicIntelligenceService.ts`
- `src/services/benchmarkSources.ts`

## Drafting Notes

- Keep the main claim platform-level and claim the sub-features as fallback positions.
- If the first filing is already on file, review whether continuation or CIP strategy can absorb Patents 12 to 15 if they were not expressly covered.
- This family is the foundation for the rest of the portfolio and should be referenced by later filings without importing unnecessary detail.
