# 🤖 AI Agent Quick Reference Card

## Access Dashboard
```
http://localhost:5178/wizard?health=1
```

## Status Indicators
- 🟢 **HEALTHY** - No issues
- 🟡 **WARNING** - High severity issues
- 🔴 **CRITICAL** - Blocking issues

## Issue Types Detected

### 🔴 Dual Validation (Critical)
**Problem:** Multiple gate systems disagree  
**Example:** `gateLocation()` says ✅ but `stepCanProceed()` says ❌  
**Fix:** Consolidate to single validation system

### 🟡 Bottleneck (High)
**Problem:** Users getting stuck on a step  
**Triggers:** Exit rate > 50% OR gate failure > 30%  
**Fix:** Review gate validation strictness

### 🟡 Error Spike (High/Critical)
**Problem:** Sudden increase in errors  
**Triggers:** > 10 errors in last 50 metrics  
**Fix:** Check for breaking changes

## Manual API Usage

```typescript
import { wizardHealthMonitor, wizardAIAgent } from '@/services/...';

// Track custom event
wizardHealthMonitor.track('step_enter', 'location', {...}, sessionId);

// Get latest report
const report = wizardAIAgent.getLatestReport();
console.log(report.status); // 'healthy' | 'warning' | 'critical'

// Get summary
console.log(wizardAIAgent.getSummary());
```

## Console Commands (Dev Tools)

```javascript
// Get current health status
wizardAIAgent.getSummary()

// Get all bottlenecks
wizardHealthMonitor.getBottlenecks()

// Get validation mismatches
wizardHealthMonitor.getValidationMismatches()

// Force immediate health check
// (normally runs every 30s)
wizardHealthMonitor.track('gate_check', 'location', {
  gateSystem1: { canProceed: true },
  gateSystem2: { canProceed: false }
}, 'test')

// Clear history (for testing)
wizardHealthMonitor.clear()
```

## Configuration

```typescript
// Change check interval (default: 30s)
wizardAIAgent.start(60000); // 60 seconds

// Disable in production
if (import.meta.env.DEV) {
  wizardAIAgent.start();
}
```

## Files Modified

- ✅ `/src/services/wizardHealthMonitor.ts` (NEW)
- ✅ `/src/services/wizardAIAgent.ts` (NEW)
- ✅ `/src/components/wizard/v7/admin/WizardHealthDashboard.tsx` (NEW)
- ✅ `/src/wizard/v7/WizardV7Page.tsx` (MODIFIED - integration hooks)

## Troubleshooting

**Agent not starting?**
- Check console for `🤖 [Wizard AI Agent] Starting...`
- Ensure `npm run dev` (not production build)

**Dashboard not showing?**
- URL must include `?health=1`
- Check you're in dev mode

**No issues detected?**
- Wait 30+ seconds for first health check
- Trigger some gate failures to test

## Performance
- **Memory:** ~100 KB max (1,000 metrics)
- **CPU:** < 0.1% (checks every 30s)
- **Network:** None (all local)

## Production Note
⚠️ **Not recommended for production** - Use Sentry/DataDog instead

---

**Full Docs:** `/WIZARD_AI_AGENT_README.md`
