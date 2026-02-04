# Merlin LifeForm Expression Contract

> "A system that knows what it knows, knows what it doesn't, and never pretends otherwise."

---

## The Guardrail (Read This First)

**`lifeSignals` is the ONLY interface between state and UI expression.**

UI components must never interpret raw state to decide how Merlin "feels."

They may only ask:
- "How sure are you?" → `lifeSignals.confidence`
- "Where did this come from?" → `lifeSignals.getFieldAttribution(id)`
- "Are you ready?" → `lifeSignals.readiness`

If a designer wants something expressive later, the answer is:

> **"Show me which lifeSignal justifies it."**

If no signal justifies it, it doesn't ship.

This is how Merlin stays alive without drifting into theater.

---

## The Three Laws (from Pleo)

1. **Understand and learn from environment**
2. **Feel and express understanding** (not fake emotions)
3. **Evolve over time**

## What This Is NOT

- ❌ Chatbot personality
- ❌ Animated mascot
- ❌ "I'm thinking..." delays
- ❌ Celebration confetti
- ❌ Tutorial overlays
- ❌ Personality quips

## What This IS

- ✅ Appropriate confidence in presentation
- ✅ Silence where silence is right
- ✅ Attribution that appears when relevant
- ✅ Visual weight that reflects certainty
- ✅ Corrections that inform future behavior

---

## Life Signals → UI Expression

### Confidence (0-1)

| Range | Expression |
|-------|------------|
| 0.0-0.3 | Softer typography, muted colors, tentative phrasing |
| 0.3-0.6 | Standard presentation |
| 0.6-0.8 | Slightly bolder, more direct |
| 0.8-1.0 | Full confidence, solid presentation |

**NOT**: Happy/sad faces, confidence bars, percentage badges

### Humility (inverse of confidence)

When `humility > 0.5`:
- Quote summary uses phrases like "Based on typical facilities..."
- Assumptions section is more prominent
- "Refine inputs" is subtly encouraged

When `humility < 0.3`:
- Quote presented with full authority
- User inputs acknowledged
- Less hedging language

### Field Certainty

Use `lifeSignals.getFieldCertainty(fieldId)`:

| Level | Visual Treatment |
|-------|------------------|
| `certain` | No decoration. User said it. |
| `observed` | Subtle icon on hover: "From utility data" |
| `assumed` | Lighter text weight, hover shows "Typical for industry" |
| `unknown` | Empty state |

**Key principle**: User inputs get NO attribution. Attribution is for machine-filled values only.

### Phase Awareness

| Phase | UI Behavior |
|-------|-------------|
| `isObserving` | Subtle pulse/shimmer on active regions (not spinner) |
| `isActive` | Full interactivity, solid state |
| `isProcessing` | Reduced interactivity, calm waiting state |
| `isComplete` | Settled, solid, ready for action |

The transition between phases should be **felt**, not **announced**.

### Attribution (via `getFieldAttribution`)

Returns human-readable string or `null`:

```typescript
const attribution = lifeSignals.getFieldAttribution("electricity_rate");
// → "From utility data for your area" | null
```

**When to show**:
- On hover/focus for non-user fields
- In expanded details view
- Never inline as noise

**When NOT to show**:
- For user-entered values (returns `null`)
- As toast notifications
- As inline badges that clutter the UI

### Evolution Signals

`hasLearned`: User has corrected at least one auto-filled value.

When `hasLearned === true`:
- Merlin can be slightly more deferential
- Future similar fields could note "You often adjust this"
- Session persistence becomes more valuable

`userCorrections`: Array of field corrections.

Use for:
- Audit trail in quote export
- Future: ML training signal for better defaults
- Debug: understanding why quote inputs differ from template

---

## Implementation Guidelines

### 1. No gratuitous animation

```tsx
// ❌ Bad
<Spinner>Merlin is thinking...</Spinner>

// ✅ Good
<div className={phase === "isObserving" ? "opacity-80" : "opacity-100"}>
  {children}
</div>
```

### 2. Attribution appears, doesn't announce

```tsx
// ❌ Bad
<Alert>This value came from utility data!</Alert>

// ✅ Good
<Tooltip content={attribution}>
  <InfoIcon className="opacity-0 group-hover:opacity-40" />
</Tooltip>
```

### 3. Confidence modulates weight, not personality

```tsx
// ❌ Bad
{confidence < 0.5 && <span>I'm not sure about this...</span>}

// ✅ Good
<span className={confidence < 0.5 ? "font-normal text-slate-400" : "font-medium"}>
  {value}
</span>
```

### 4. Evolution is continuity, not celebration

```tsx
// ❌ Bad
<Confetti />
<h2>Great job! You taught Merlin something!</h2>

// ✅ Good
// Simply remember the correction in state.
// Use it to improve next session's defaults.
// Say nothing.
```

---

## The Pleo Principle

> "LifeForms are elegant beings. They express life and understanding in authentic ways, not through fake stunts."

Merlin's life is expressed through:
- **Pulse**: FSM transitions felt in UI density/readiness
- **Breath**: Confidence gradients that modulate presentation
- **Memory**: Provenance that surfaces when relevant
- **Humility**: Appropriate hedging based on data quality
- **Yielding**: Corrections accepted without defense

That's it. No more. Elegance is restraint.

---

## The Face: Expression Layer (Jan 31, 2026)

The expression layer lives in `src/wizard/v7/expression/`.

### Architecture

```
expression/
├── index.ts       # Re-exports
├── types.ts       # FieldCertainty, VisualWeight, Phase, etc.
├── hooks.ts       # useFieldExpression, useExpression, etc.
└── components.tsx # CertaintyIndicator, ConfidenceBar, etc.
```

### Hooks (consume lifeSignals, return expression props)

| Hook | Returns | Use When |
|------|---------|----------|
| `useFieldExpression(lifeSignals, fieldId)` | `{ certainty, attribution, isUncertain, wasUserCorrected }` | Rendering a single field |
| `usePhaseExpression(lifeSignals)` | `{ phase, isObserving, isActive, isProcessing, isComplete }` | Showing system state |
| `useConfidenceExpression(lifeSignals)` | `{ confidence, humility, readiness, groundedCount, assumedCount }` | Confidence indicators |
| `useExpression(lifeSignals)` | All of the above combined | Components needing full expression |
| `useSourceSummary(lifeSignals)` | `{ label, groundedLabel, assumedLabel }` | Source legend text |

### Components (consume expression props, render visuals)

| Component | Consumes | Renders |
|-----------|----------|---------|
| `CertaintyIndicator` | `certainty` | Dot/badge showing field certainty |
| `Attribution` | `attribution` | Hover tooltip with source info |
| `ConfidenceBar` | `confidence` | Bar/ring/pulse showing confidence |
| `PhaseIndicator` | `phase`, `isObserving`, etc. | Icon showing FSM state |
| `ReadinessGlow` | `readiness` | Glow wrapper proportional to readiness |
| `HumilityWrapper` | `humility` | Softer borders when uncertain |
| `SourceLegend` | `sourceBreakdown` | Legend of value sources |
| `FieldWrapper` | `certainty`, `attribution` | Combines all field-level expression |

### Usage Pattern

```tsx
import { useWizardV7 } from "@/wizard/v7/hooks/useWizardV7";
import { useFieldExpression, FieldWrapper } from "@/wizard/v7/expression";

function MyField({ fieldId }: { fieldId: string }) {
  const { lifeSignals } = useWizardV7();
  const { certainty, attribution } = useFieldExpression(lifeSignals, fieldId);
  
  return (
    <FieldWrapper certainty={certainty} attribution={attribution}>
      <input ... />
    </FieldWrapper>
  );
}
```

### Type Mapping Functions

| Function | Input | Output |
|----------|-------|--------|
| `certaintyToWeight(certainty)` | `"certain"` | `"heavy"` |
| | `"observed"` | `"medium"` |
| | `"assumed"` | `"light"` |
| | `"unknown"` | `"ghost"` |
| `confidenceToIntensity(confidence)` | `0-1` | `30-100` (CSS opacity) |
| `humilityToSoftness(humility)` | `0-1` | `"sharp"` / `"soft"` / `"diffuse"` |

### Doctrine Compliance

Every component in the expression layer:

1. **Takes lifeSignals or expression props as input** (never raw state)
2. **Returns visual properties** (never text personality)
3. **Can be audited**: "Which lifeSignal justifies this visual?"

If a component cannot answer that question, it doesn't belong here.
