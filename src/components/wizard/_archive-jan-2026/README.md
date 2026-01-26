# Deprecated Step Components

These files are no longer used but kept for reference.

## Step3HotelEnergy.tsx

**Deprecated:** January 2026  
**Reason:** All industries now use unified `Step3Details.tsx` with scrolling questionnaire  
**Replacement:** `Step3Details.tsx` → `Step3Integration.tsx` → `CompleteStep3Component.tsx`

This component had several SSOT violations:
1. Wrote `estimatedAnnualKwh` to `useCaseData` (should be calculated by TrueQuote)
2. Used local state that could desync from parent
3. Industry-specific UI that couldn't scale to 30+ industries

The new unified approach:
- `Step3Details.tsx` - Thin wrapper
- `Step3Integration.tsx` - Enforces SSOT contract (no derived fields)
- `CompleteStep3Component.tsx` - Database-driven questionnaire for all industries

## EnhancedLocationStep.v2.tsx

**Deprecated:** January 19, 2026  
**Reason:** Replaced by advisor-led Step 1 design  
**Replacement:** `Step1AdvisorLed.tsx` (2-panel conversational design)

The old location step was a traditional form-based approach. The new advisor-led design features:
- Conversational left panel with MerlinAdvisor guidance
- Clean form panel on the right
- Better progressive disclosure of complexity
- Integrated Site Score™ calculation
- Context-aware intelligence layer
