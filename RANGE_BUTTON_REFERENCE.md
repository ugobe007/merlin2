# WIZARD V8 - RANGE BUTTON IMPLEMENTATION REFERENCE

## 🎯 Quick Reference

**Component:** `Step3_5V8_RANGEBUTTONS.tsx`  
**Used By:** WizardV8Page (Step 3.5)  
**Purpose:** Replace sliders with Supabase-style range buttons

## 📐 Range Calculations

### Solar PV Array

```typescript
const solarRanges = [
  {
    label: `${Math.round(peakLoadKW * 0.8)}-${Math.round(peakLoadKW)} kW`,
    value: Math.round(peakLoadKW * 0.9),
    desc: "Min (80-100%)",
  },
  {
    label: `${Math.round(peakLoadKW)}-${Math.round(peakLoadKW * 1.2)} kW`,
    value: Math.round(peakLoadKW * 1.1),
    desc: "Good (100-120%)",
  },
  {
    label: `${Math.round(peakLoadKW * 1.2)}-${Math.round(peakLoadKW * 1.4)} kW`,
    value: Math.round(peakLoadKW * 1.3),
    desc: "⭐ Optimal (120-140%)",
  },
  {
    label: `${Math.round(peakLoadKW * 1.4)}-${Math.round(peakLoadKW * 1.7)} kW`,
    value: Math.round(peakLoadKW * 1.55),
    desc: "Max (140-170%)",
  },
];
```

**Example (Car Wash: 150 kW peak):**

- Min: 120-150 kW (value: 135 kW)
- Good: 150-180 kW (value: 165 kW)
- **⭐ Optimal:** 180-210 kW (value: 195 kW)
- Max: 210-255 kW (value: 232 kW)

### Backup Generator

```typescript
const isCriticalFacility = ["hospital", "data-center", "cold-storage", "manufacturing"].includes(
  industry
);
const targetLoadKW = !isCriticalFacility && criticalLoadKW > 0 ? criticalLoadKW : peakLoadKW;

const generatorRanges = [
  {
    label: `${Math.round(targetLoadKW * 0.8)}-${Math.round(targetLoadKW)} kW`,
    value: Math.round(targetLoadKW * 0.9),
    desc: "Min (80-100%)",
  },
  {
    label: `${Math.round(targetLoadKW)}-${Math.round(targetLoadKW * 1.25)} kW`,
    value: Math.round(targetLoadKW * 1.125),
    desc: "⭐ Standard (100-125%)",
  },
  {
    label: `${Math.round(targetLoadKW * 1.25)}-${Math.round(targetLoadKW * 1.5)} kW`,
    value: Math.round(targetLoadKW * 1.375),
    desc: "High (125-150%)",
  },
];
```

**Example (Car Wash: 150 kW peak, 15 kW critical):**

- Non-critical facility → uses `criticalLoadKW = 15 kW`
- Min: 12-15 kW (value: 13.5 kW)
- **⭐ Standard:** 15-18.75 kW (value: 16.9 kW)
- High: 18.75-22.5 kW (value: 20.6 kW)

### EV Charging

```typescript
const evOptions = [
  { label: "4 L2", value: { level2: 4, dcfc: 0 }, desc: "Small (4 Level 2)" },
  { label: "8 L2", value: { level2: 8, dcfc: 0 }, desc: "Medium (8 Level 2)" },
  { label: "8 L2 + 2 DCFC", value: { level2: 8, dcfc: 2 }, desc: "⭐ Optimal (8 L2 + 2 DCFC)" },
  { label: "12 L2 + 4 DCFC", value: { level2: 12, dcfc: 4 }, desc: "Large (12 L2 + 4 DCFC)" },
];
```

**Power Calculations:**

- Level 2: 7.2 kW each
- DCFC: 150 kW each
- **Example (8 L2 + 2 DCFC):** `8 × 7.2 + 2 × 150 = 357.6 kW`

## 🎨 RangeButton Component

### Props

```typescript
interface RangeButtonProps {
  label: string; // Display text (e.g., "120-140 kW")
  value: number; // Numeric value to set in state (e.g., 130)
  isSelected: boolean; // True if this button is currently selected
  onClick: () => void; // Handler to set value in state
  color?: string; // 'amber' | 'orange' | 'cyan'
}
```

### Color Schemes

```typescript
const colorClasses = {
  amber: {
    border: "border-amber-500/50",
    hoverBorder: "hover:border-amber-500",
    selectedBorder: "border-amber-500",
    text: "text-amber-400",
    hoverBg: "hover:bg-amber-500/10",
  },
  orange: {
    border: "border-orange-500/50",
    hoverBorder: "hover:border-orange-500",
    selectedBorder: "border-orange-500",
    text: "text-orange-400",
    hoverBg: "hover:bg-orange-500/10",
  },
  cyan: {
    border: "border-cyan-500/50",
    hoverBorder: "hover:border-cyan-500",
    selectedBorder: "border-cyan-500",
    text: "text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
  },
};
```

### Usage

```tsx
<RangeButton
  label="120-140 kW"
  value={130}
  isSelected={Math.abs(state.solarKW - 130) < 10}
  onClick={() => actions.setAddonConfig({ solarKW: 130 })}
  color="amber"
/>
```

## 🎭 Visual States

### Unselected

```css
border: 2px solid rgb(245 158 11 / 0.5); /* amber-500/50 */
background: transparent;
color: rgb(148 163 184); /* slate-400 */
```

### Hover

```css
border: 2px solid rgb(245 158 11); /* amber-500 */
background: rgb(245 158 11 / 0.1); /* amber-500/10 */
transform: scale(1.05);
```

### Selected

```css
border: 2px solid rgb(245 158 11); /* amber-500 */
color: rgb(251 191 36); /* amber-400 */
background: transparent;

/* Green checkmark badge */
.absolute.-top-2.-right-2 {
  background: rgb(16 185 129); /* emerald-500 */
  border-radius: 9999px;
  padding: 4px;
  animation: bounce 1s infinite;
}
```

### Active (Click)

```css
transform: scale(0.95);
```

## 📋 Confirmation Flow

### State Management

```typescript
const [solarConfirmed, setSolarConfirmed] = React.useState(false);
const [generatorConfirmed, setGeneratorConfirmed] = React.useState(false);
const [evConfirmed, setEvConfirmed] = React.useState(false);
```

### Confirm Button States

```tsx
// BEFORE CONFIRM
<button className="
  bg-amber-500/20
  border-2 border-amber-500/50
  text-amber-300
  hover:bg-amber-500/30
  hover:scale-105
">
  Confirm Solar Capacity
</button>

// AFTER CONFIRM
<button className="
  bg-emerald-500/30
  border-2 border-emerald-500
  text-emerald-300
  cursor-default
  scale-95
">
  <Check className="w-5 h-5" />
  Solar Confirmed
</button>
```

### Continue Button Logic

```typescript
const canContinue = (!wantsSolar || solarConfirmed) &&
                    (!wantsGenerator || generatorConfirmed) &&
                    (!wantsEVCharging || evConfirmed);

<button
  onClick={handleContinue}
  disabled={!canContinue || isGeneratingTiers}
  className={canContinue
    ? "bg-gradient-to-r from-violet-600 to-purple-600 ..."
    : "bg-slate-800 text-slate-500 cursor-not-allowed"
  }
>
  {isGeneratingTiers ? "Generating Your Options..." : "Continue to MagicFit"}
</button>
```

## 🔍 Selection Detection

### Solar & Generator (Numeric Tolerance)

```typescript
// Selected if state value is within 10 kW of range value
isSelected={Math.abs(state.solarKW - range.value) < 10}
```

**Why tolerance?**

- User might have edited value manually (though UI doesn't allow this currently)
- Rounding errors in calculation
- Future-proofs for slider + range button hybrid

### EV Charging (Exact Match)

```typescript
isSelected={
  state.level2Chargers === option.value.level2 &&
  state.dcfcChargers === option.value.dcfc
}
```

## 📱 Responsive Grid

### Solar & EV Charging (4 options)

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  {/* Mobile: 2 columns, Desktop: 4 columns */}
</div>
```

### Generator (3 options)

```tsx
<div className="grid grid-cols-3 gap-3">{/* Always 3 columns (works well even on mobile) */}</div>
```

## 🎬 Animations

### Checkmark Bounce (on selection)

```css
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25%);
  }
}
.animate-bounce {
  animation: bounce 1s infinite;
}
```

### Button Scale (on hover/click)

```css
.hover\:scale-105:hover {
  transform: scale(1.05);
}
.active\:scale-95:active {
  transform: scale(0.95);
}
```

### Confirm Button Transition (on confirm)

```css
transition: all 0.2s ease;
/* From: amber/orange/cyan → To: emerald green */
```

## 🐛 Debugging

### Check Range Values

```typescript
console.log(
  "Solar ranges:",
  solarRanges.map((r) => ({
    label: r.label,
    value: r.value,
    isSelected: Math.abs(state.solarKW - r.value) < 10,
  }))
);
```

### Check Confirmation State

```typescript
console.log("Confirmation status:", {
  solarConfirmed,
  generatorConfirmed,
  evConfirmed,
  canContinue,
});
```

### Check State Values

```typescript
console.log("Add-on config:", {
  solarKW: state.solarKW,
  generatorKW: state.generatorKW,
  level2Chargers: state.level2Chargers,
  dcfcChargers: state.dcfcChargers,
});
```

## 📦 Dependencies

**Icons (lucide-react):**

- `Sun` - Solar PV icon
- `Fuel` - Generator icon
- `Zap` - EV Charging icon
- `Info` - Information icon
- `Check` - Checkmark icon

**Tailwind Classes Used:**

- Color: `amber-*`, `orange-*`, `cyan-*`, `emerald-*`, `purple-*`, `slate-*`
- Spacing: `p-*`, `px-*`, `py-*`, `gap-*`, `space-y-*`
- Layout: `grid`, `grid-cols-*`, `flex`, `items-center`, `justify-center`
- Effects: `rounded-*`, `border-*`, `shadow-*`, `animate-bounce`
- Transitions: `transition-all`, `duration-*`, `hover:*`, `active:*`

## 🔄 State Flow

```
User clicks range button
    ↓
onClick={() => actions.setAddonConfig({ solarKW: value })}
    ↓
WizardState updated (solarKW = value)
    ↓
Component re-renders
    ↓
isSelected = Math.abs(state.solarKW - value) < 10
    ↓
Green checkmark appears on selected button
    ↓
User clicks "Confirm Solar Capacity"
    ↓
setSolarConfirmed(true)
    ↓
Confirm button turns green with checkmark
    ↓
Repeat for other add-ons
    ↓
All confirmed → canContinue = true
    ↓
User clicks "Continue to MagicFit"
    ↓
handleContinue() → actions.buildTiers() → actions.goToStep(4)
```

## 🎯 Best Practices

**DO:**

- ✅ Use tolerance check for numeric comparisons (`Math.abs(a - b) < 10`)
- ✅ Provide visual feedback on every interaction (hover, click, select)
- ✅ Show selected value below range buttons (large, bold)
- ✅ Require explicit confirmation before allowing continue
- ✅ Disable continue button until all add-ons confirmed

**DON'T:**

- ❌ Use strict equality for floating-point comparisons
- ❌ Allow continue without confirmation
- ❌ Show multiple checkmarks on different ranges simultaneously
- ❌ Forget to handle loading state during tier generation
- ❌ Use hardcoded kW values (always calculate from peak load)

## 📚 Related Files

- `wizardState.ts` - State types and actions
- `useWizardV8.ts` - State management hook
- `Step4V8.tsx` - MagicFit tier selection
- `useCasePowerCalculations.ts` - Critical load calculations

---

**Component:** Step3_5V8_RANGEBUTTONS.tsx  
**Lines:** 306  
**Created:** February 10, 2026  
**Status:** Production Ready
