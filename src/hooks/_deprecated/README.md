# Deprecated Hooks

These files are no longer used in the codebase but kept for reference.

## useTrueQuote.ts

**Deprecated:** January 2026  
**Reason:** Dead code - not imported anywhere  
**Replacement:** Step5MagicFit.tsx calls `generateQuote()` from `@/services/merlin` directly

This hook was intended to power TrueQuoteVerifyBadge but was never integrated.
The badge now receives data directly from Step5MagicFit via props.
