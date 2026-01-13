# Deprecated Services

These files are no longer used in the codebase but kept for reference.

## TrueQuoteEngine.ts (v1)

**Deprecated:** January 2026  
**Reason:** Superseded by Porsche 911 Architecture  
**Replacement:** 
- `MerlinOrchestrator.ts` - General contractor
- `TrueQuoteEngineV2.ts` - Prime sub contractor (SSOT)
- `calculators/*.ts` - Modular calculation functions
- `MagicFit.ts` - Option generation
- `validators/proposalValidator.ts` - Authentication

The v1 engine was a monolithic 900+ line file. The v2 architecture splits
responsibilities across multiple focused files for better maintainability.

### Migration Notes

If you're updating old code that imported from TrueQuoteEngine.ts:

```typescript
// OLD (v1)
import { calculateTrueQuote } from '@/services/TrueQuoteEngine';

// NEW (v2)
import { generateQuote } from '@/services/merlin';
```
