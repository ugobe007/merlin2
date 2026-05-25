# Carwash Energy Repo Audit and Merge Plan

Date: 2026-05-09

## Repos Reviewed

### Original / Canonical Candidate

- Path: `carwash-energy-site`
- Remote: `ugobe007/carwash-energy-site`
- Current branch observed locally: `hotfix/business-ref-cleanup`
- Framework: Vite + React 18
- Deployment shape: Vite `dist/` served by custom Node static server, Vercel configured as Vite
- Health: `npm run build` passes; `npm run lint` exits cleanly
- Current local state: dirty with active Merlin workspace / business cleanup changes

### Vineet V2 / Feature Source Candidate

- Path: `carwash-energy-site-pre-v2`
- Remote: `ugobe007/carwash-energy-site`
- Current branch observed locally: `recover/pre-v2-correct`
- Framework: Next 16 + React 19
- Deployment shape: standalone Next Dockerfile; no `vercel.json` found locally
- Health: Next build completed in prior validation; lint is not clean, with roughly 99 errors and 537 warnings in the current tree
- Current local state: clean

## Recommendation

Use `carwash-energy-site` as the canonical production repo.

Reasons:

- It already has the intended Vite deployment configuration and production server path.
- It is much smaller operationally and easier to stabilize.
- It has clean lint and a passing Vite production build.
- It already contains the newer Merlin Project Workspace direction.
- It avoids a framework migration to Next 16 / React 19 while the product and GTM are still moving.

Treat `carwash-energy-site-pre-v2` as a feature mine, not the base repo.

Reasons:

- It has strong car-wash-specific UX and richer APIs, but the codebase is large and lint-noisy.
- The main `MerlinEngine.jsx` is a very large monolith with many unused variables and framework-specific assumptions.
- It carries Google key precedence patterns and Maps loading patterns that need hardening before porting.

## What to Port from V2

### 1. Car Wash Homepage Story

Port the V2 homepage messaging and visual direction into the Vite landing page:

- “Turn your car wash into an energy profit center.”
- Car-wash portfolio proof points
- Solar canopy / battery / EV solution cards
- Image-rich car wash visual system using existing `public/industries/cw*.jpg` assets
- CTA language: “Analyze my site” / “Start guided assessment”

This is the safest first port because it is mostly UI copy and layout, and the original repo already has the same public image assets.

### 2. Server API Routes, Rewritten for Vite Server

Do not copy Next route files directly. Recreate selected functionality in the original repo’s `api/` + `server/static-server.js` pattern.

High-value APIs to port:

- `utility-rates` — EIA state average commercial rates and demand charges
- `pvwatts` — NREL production estimates with fallback
- `weather` — Weather.gov / ASCE-style state risk profile
- `eia-reliability` — SAIDI / SAIFI reliability data
- `staticmap` / `streetview` / `solar-imagery` — only after Google key separation is finalized

### 3. Calculation Modules

Port only self-contained calculation modules after API wiring:

- `DispatchEngine.jsx`
- `SsotFinance.js`
- `CarportCardV2.jsx`
- `EvCardV2.jsx`
- `GeneratorCardV2.jsx`
- `v72CarportAdapter.js` / `v72CarportShim.js`

Avoid importing the full V2 `MerlinEngine.jsx` monolith.

### 4. Data Assets

Evaluate V2’s `sites-database.json` and any SSOT guard scripts for compatibility with the original Vite flow.

Port only if it improves dropdown/site matching without making anonymous self-serve the primary GTM motion.

## What Not to Port

- The full Next app structure
- The full V2 `MerlinEngine.jsx` monolith
- Next-specific API route files as-is
- Browser Maps JS key routes that prefer server keys
- Lint suppressions or unused/dead experimental code
- V2 deployment assumptions unless the project intentionally migrates to Next

## Merge Sequence

### Phase 1: UI Positioning Port

Canonical repo: `carwash-energy-site`

Tasks:

1. Replace the generic Merlin Energy landing hero with the V2 car-wash-specific story.
2. Preserve the existing Vite assessment start flow.
3. Keep the Merlin Project Workspace handoff intact.
4. Build and lint.

Success criteria:

- Homepage clearly sells car wash energy intelligence.
- CTA still starts the current assessment.
- `npm run build` passes.
- `npm run lint` passes.

### Phase 2: API Capability Port

Tasks:

1. Add Vite-compatible API handlers for utility rates, PVWatts, reliability, and weather.
2. Extend `server/static-server.js` routing.
3. Keep API fallbacks deterministic when keys are absent.
4. Add small smoke checks for required query validation.

Success criteria:

- API routes return useful JSON locally and in production.
- No client-side exposure of server-only keys.
- Existing Places proxy remains stable.

### Phase 3: Calculation Upgrade Port

Tasks:

1. Extract V2 calculation modules without the monolithic UI shell.
2. Adapt original `WizB.jsx` to call the upgraded calculations behind a feature flag.
3. Compare old vs upgraded outputs on 3 sample car wash sites.
4. Keep TrueQuote caveats / preliminary labels visible.

Success criteria:

- Outputs are more credible without disrupting the flow.
- Old calculation path can be restored quickly if needed.
- Build and lint stay green.

### Phase 4: Workspace Tie-In

Tasks:

1. Feed upgraded quote outputs into `MerlinProjectWorkspace.jsx`.
2. Update daily brief, missing documents, and approval requests to match the concierge audit GTM.
3. Add “Request Merlin Energy Intelligence Audit” as a higher-trust CTA.

Success criteria:

- Product direction aligns with the concierge-to-channel strategy.
- The site no longer feels like a cold self-serve quote wizard only.

## Immediate Next Step

Start with Phase 1. It is low-risk, user-visible, and preserves the original repo’s deployment stability while borrowing the best part of V2: the car-wash-specific market story.
