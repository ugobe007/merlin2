# Wizard V6 Visual Hierarchy Lock
**Locked: January 17, 2026**

## 🎯 Purpose
This document defines the canonical visual hierarchy for Wizard V6. These rules are **ENFORCED** and must not be violated by copilot, AI agents, or manual edits without explicit approval.

---

## 🎨 Color Palette (SINGLE SOURCE OF TRUTH)

### Background
- **Wizard root**: `bg-[#0b1626]` (deep blue-black)
- **All panels/cards/rail**: `bg-[#0f1d33]/70` (slate-blue with transparency)
- **Backdrop blur**: `backdrop-blur` (optional for floating elements)

### Inputs & Fields
- **Base**: `bg-white/5` (subtle white overlay)
- **Border**: `border-white/10` (subtle white border)
- **Focus**: `focus:border-amber-400/40` + `focus:ring-2 focus:ring-amber-400/15`
- **Hover**: `hover:bg-white/8` (slightly brighter)

### Text
- **Labels**: `text-slate-300/70` (muted labels)
- **Values/Headings**: `text-white` (bright values)
- **Descriptions**: `text-slate-400` (secondary text)

### Semantic Colors (Allowed Exceptions)
- **Success**: `bg-emerald-500/10`, `border-emerald-500/30`, `text-emerald-300`
- **Warning**: `bg-amber-500/10`, `border-amber-500/20`, `text-amber-300`
- **Error**: `bg-red-500/10`, `border-red-500/20`, `text-red-300`
- **Info**: `bg-cyan-500/10`, `border-cyan-500/20`, `text-cyan-300`

---

## ❌ FORBIDDEN Patterns

### NEVER Use These:
- ❌ `bg-slate-700`, `bg-slate-800`, `bg-slate-900` (inconsistent slate shades)
- ❌ `from-slate-800 to-slate-900` (slate gradients - use single surface)
- ❌ `border-slate-600`, `border-slate-700` (use `border-white/10`)
- ❌ `focus:border-purple-500`, `focus:border-violet-500` (use amber)
- ❌ `py-10`, `py-12`, `pt-10`, `pt-12` in step containers (use `py-6` max)

### Rationale:
Multiple slate shades create visual inconsistency and undermine the unified surface hierarchy. The `#0f1d33` base with white overlays creates a cohesive system that scales gracefully.

---

## 🏗️ Layout Standards

### Step Containers
All step root containers MUST use:
```tsx
<div className="w-full max-w-6xl mx-auto px-6 py-6">
```

### AdvisorRail
- **Position**: `sticky top-0` (NOT `top-6`)
- **Height**: `h-[calc(100vh-120px)]`
- **Alignment**: Must align perfectly with main content (no offset)

### Spacing Hierarchy
- **Section gaps**: `gap-6` or `space-y-6`
- **Card gaps**: `gap-4` or `space-y-4`
- **Element gaps**: `gap-2` or `space-y-2`

---

## 🔒 Enforcement Rules

### For AI Agents:
1. **NEVER** introduce new background colors without explicit approval
2. **ALWAYS** use `bg-white/5` for input backgrounds
3. **ALWAYS** use `border-white/10` for borders
4. **ALWAYS** use `focus:border-amber-400/40` for focus states

### For Manual Edits:
1. Run pre-commit hook that validates no `bg-slate-` patterns exist
2. Visual regression tests must pass
3. Design review required for any palette changes

### Audit Command:
```bash
# Check for violations
grep -RIn src/components/wizard/v6 \
  -E "bg-slate-(700|800|900)|border-slate-(600|700)" \
  --exclude-dir=_deprecated
```

Should return **ZERO** matches.

---

## 📊 Migration Applied (Jan 17, 2026)

### Files Modified: 80+
- All step components normalized
- All input components normalized
- All panel/card components normalized

### Changes:
- `bg-slate-900/50` → `bg-[#0f1d33]/70`
- `bg-slate-800/50` → `bg-white/5`
- `bg-slate-700` → `bg-white/5`
- `border-slate-700` → `border-white/10`
- `border-slate-600` → `border-white/10`
- `focus:border-purple-500` → `focus:border-amber-400/40`
- `py-12` → `py-6` (step containers)

### Result:
✅ Unified slate-blue surface hierarchy  
✅ Consistent input styling across all components  
✅ Perfect rail-to-content alignment  
✅ Amber focus states (Merlin brand)  

---

## 🚀 Future Additions

When adding NEW components:

1. **Start with canonical surface**: `bg-[#0f1d33]/70 border border-white/10`
2. **Use white overlays for depth**: `bg-white/5`, `bg-white/8`, `bg-white/10`
3. **Use semantic colors sparingly**: Only for success/warning/error states
4. **Test alignment**: Ensure no `top-6` or excessive padding offsets

---

## 📝 Related Documentation

- **Copilot Instructions**: `/Users/robertchristopher/merlin3/.github/copilot-instructions.md`
- **Architecture Guide**: `ARCHITECTURE_GUIDE.md`
- **Merlin Maturity**: See AdvisorRail.tsx Phase 2 comments

---

**Questions?** This is now the SSOT for Wizard V6 visual hierarchy. Any deviations require explicit design approval and update to this document.
