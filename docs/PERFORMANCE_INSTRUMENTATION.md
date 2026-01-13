# Performance Instrumentation Guide

## Overview

Lightweight performance tracking for WizardV6 operations. All instrumentation is **DEV/TEST only** and has zero production overhead.

## Performance Helper (`src/components/wizard/v6/utils/perf.ts`)

### Usage

```typescript
import { perfMark, perfMeasure } from "../utils/perf";

// Mark start of operation
perfMark("step5_quote_start", { fp: fingerprint });

// ... operation ...

// Mark end and measure
perfMark("step5_quote_end", { quoteId: result.quoteId });
perfMeasure("step5_quote_time", "step5_quote_start", "step5_quote_end");
```

### Events Tracked

- `step5_quote_start` - Quote generation begins
- `step5_quote_end` - Quote generation completes
- `tier_switch_start` - User selects a tier
- `tier_switch_end` - Tier selection completes

### Enabled Modes

- `import.meta.env.DEV` - Development mode
- `import.meta.env.MODE === "test"` - Test mode
- `import.meta.env.MODE === "perf"` - Performance profiling mode

## Performance Budgets

### Unit Tests

| Operation | Budget | Test File |
|-----------|--------|-----------|
| Fingerprint generation | <5ms avg | `wizardFingerprint.perf.test.ts` |
| Tier switching | <100ms | `step5Idempotency.perf.test.ts` |
| No duplicate calls | 1 call per fingerprint | `step5Idempotency.perf.test.ts` |

### E2E Tests

| Operation | Budget | Test File |
|-----------|--------|-----------|
| Quote generation | <12s | `wizardv6.perf.spec.ts` |
| Tier switching (3 clicks) | <500ms | `wizardv6.perf.spec.ts` |
| No loading during tier switch | 0 spinners | `wizardv6.perf.spec.ts` |

## Running Performance Tests

### Unit Tests (Fast, No Browser)

```bash
npm run test:perf:unit
```

Tests:
- Fingerprint speed
- Idempotency (no duplicate calls)
- Tier switching performance

### E2E Tests (Real Browser)

```bash
npm run test:perf:e2e
```

Tests:
- Real quote generation time
- Real tier switching time
- No duplicate API calls

### Both

```bash
npm run perf
```

Runs unit tests first, then E2E tests.

## Performance Marks in Step5MagicFit

### Quote Generation

```typescript
// Before generateQuote
perfMark("step5_quote_start", { fp: fp.slice(0, 32) + "..." });

// After result returns
perfMark("step5_quote_end", { quoteId: result.quoteId });
perfMeasure("step5_quote_time", "step5_quote_start", "step5_quote_end");
```

### Tier Switching

```typescript
// Before updateState
perfMark("tier_switch_start", { tier });

// After updateState
perfMark("tier_switch_end", { tier });
perfMeasure("tier_switch_time", "tier_switch_start", "tier_switch_end");
```

## Test Selectors

For E2E tests, the following `data-testid` attributes are available:

- `data-testid="quote-loading"` - Loading state
- `data-testid="quote-ready"` - Quote ready state
- `data-testid="tier-starter"` - Starter tier button
- `data-testid="tier-perfect_fit"` - Perfect Fit tier button
- `data-testid="tier-beast_mode"` - Beast Mode tier button

## Interpreting Results

### Good Performance

- Fingerprint: <2ms average
- Tier switching: <50ms
- Quote generation: <8s (local), <12s (network)

### Needs Investigation

- Fingerprint: >5ms average
- Tier switching: >100ms
- Quote generation: >15s

### Performance Logs

In DEV mode, you'll see:

```
[perf] step5_quote_start { fp: "..." }
[perf] step5_quote_end { quoteId: "QT-123" }
[perf] step5_quote_time: 2345.67ms
[perf] tier_switch_start { tier: "perfectFit" }
[perf] tier_switch_end { tier: "perfectFit" }
[perf] tier_switch_time: 12.34ms
```

## CI Integration

Performance tests run in CI to catch regressions:

```yaml
# Example GitHub Actions
- name: Performance Tests
  run: npm run test:perf:unit
```

## Tuning Budgets

After first run, adjust budgets in test files:

1. Run tests: `npm run perf`
2. Check actual times
3. Set realistic budgets (p50 + 20% buffer)
4. Update test expectations

## Future Enhancements

- Add more granular marks (validation, mapping, etc.)
- Track memory usage
- Track network request counts
- Add performance dashboard

---

**Status:** Production Ready ✅  
**Overhead:** Zero (DEV/TEST only)  
**Last Updated:** January 2025
