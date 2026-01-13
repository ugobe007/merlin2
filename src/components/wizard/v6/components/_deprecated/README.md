# Deprecated Components

This folder contains wizard components that have been replaced.

## MerlinGuide.tsx (deprecated Jan 13, 2026)

**Reason:** Replaced by unified `MerlinAdvisor.tsx` at the `v6/` level.

The old MerlinGuide had:
- 478 lines of complex state management
- Auto-collapse, struggle detection, multiple timers
- Different positioning (bottom-right) from the other MerlinGuide (left side)
- Never actually imported or used in the wizard

**New system:**
- `src/components/wizard/v6/MerlinAdvisor.tsx` - Unified advisor with glassmorphism
- `src/components/wizard/v6/MerlinGuide.tsx` - Simple backup (also being phased out)

The new MerlinAdvisor:
- Is rendered once at WizardV6 level
- Uses progressive reveal (Easter Egg hunt pattern)
- Shows energy opportunities based on location
- Has glassmorphism (transparent) effect
- Works with ValueTracker (scoreboard + narrator pattern)
