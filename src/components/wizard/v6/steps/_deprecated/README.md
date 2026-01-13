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
