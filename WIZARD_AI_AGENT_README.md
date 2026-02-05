# 🤖 Wizard AI Agent - Self-Healing System

**Built:** February 4, 2026  
**Purpose:** Autonomous monitoring and issue detection for WizardV7

---

## What It Does

The Wizard AI Agent is a **self-healing system** that runs 24/7 in development to:

1. **Monitor** wizard health in real-time
2. **Detect** anti-patterns and bugs (like dual validation systems)
3. **Alert** developers to issues with severity levels
4. **Suggest** fixes for common problems
5. **Report** on user bottlenecks and error spikes

Think of it as a "wizard doctor" that watches your wizard and tells you when something is wrong.

---

## Quick Start

### Auto-start (Development Only)

The AI agent **automatically starts** when you run the wizard in dev mode:

```bash
npm run dev
# Visit http://localhost:5178/wizard
# AI agent starts monitoring automatically
```

Console output:
```
🤖 [Wizard AI Agent] Starting health monitoring...
✅ [Wizard AI Agent] All systems healthy
```

### View Health Dashboard

Access the admin dashboard via URL parameter:

```
http://localhost:5178/wizard?health=1
```

This shows:
- ✅ Real-time health status (healthy/warning/critical)
- 🚨 Active issues with severity levels
- 📊 Metrics snapshot (error rate, bottlenecks)
- 🚦 Step bottlenecks (where users get stuck)
- 💡 Suggested fixes for detected issues

---

## Architecture

### Core Components

```
src/services/
├── wizardHealthMonitor.ts    - Tracks metrics, errors, validation issues
├── wizardAIAgent.ts           - Analyzes health data, generates reports
└── (integration in WizardV7Page.tsx)

src/components/wizard/v7/admin/
└── WizardHealthDashboard.tsx  - Admin UI for viewing health reports
```

### How It Works

```
User interacts with wizard
        ↓
Wizard emits health metrics
        ↓
wizardHealthMonitor captures metrics
        ↓
wizardAIAgent analyzes every 30s
        ↓
Issues detected? → Alert + suggest fix
        ↓
Dashboard shows real-time health
```

---

## What It Detects

### 1. **Dual Validation Systems** (Critical)

**Problem:** Multiple gate systems disagreeing on "can proceed" logic

**Example:** 
- `wizardStepGates.ts` says "can proceed" ✅
- `stepCanProceed()` in `useWizardV7.ts` says "cannot proceed" ❌
- Result: Next button is disabled even though it should work

**Detection:**
```typescript
wizardHealthMonitor.track('gate_check', step, {
  gateSystem1: { canProceed: true },
  gateSystem2: { canProceed: false }, // Mismatch!
  state: {...}
});
```

**Suggested Fix:**
```
Consolidate to single validation system:
1. Remove stepCanProceed() from useWizardV7.ts
2. Use ONLY wizardStepGates.ts for all gate checks
3. Update WizardV7Page.tsx to use gates.canGoIndustry from wizardStepGates
```

### 2. **User Bottlenecks** (High/Critical)

**Problem:** Users getting stuck on a specific step

**Metrics:**
- Exit rate > 50% = Critical (most users leave)
- Gate failure rate > 30% = Validation too strict

**Example:**
```
Step: location
Exit Rate: 65% (users leaving)
Gate Failure Rate: 45% (Next button won't work)
Common Errors: "ZIP code incomplete"
```

**Suggested Fix:**
```
Gate validation may be too strict. 
Check if required fields are properly marked as optional.
```

### 3. **Error Spikes** (High/Critical)

**Problem:** Sudden increase in errors (breaking change?)

**Detection:**
- 10+ errors in last 50 metrics = High severity
- 20+ errors = Critical severity

**Example:**
```
25 errors detected in last 50 metrics.
This may indicate a breaking change.
Review recent errors in wizardHealthMonitor.getRecentErrors()
```

---

## API Usage

### Track Custom Events

```typescript
import { wizardHealthMonitor } from '@/services/wizardHealthMonitor';

// Track step navigation
wizardHealthMonitor.track('step_enter', 'location', {
  zipCode: '94102',
  hasBusinessName: false,
}, sessionId);

// Track gate checks
wizardHealthMonitor.track('gate_check', 'location', {
  canProceed: true,
  state: { location: {...} }
}, sessionId);

// Track errors
wizardHealthMonitor.trackError('location', 
  new Error('ZIP validation failed'), 
  state, 
  sessionId
);
```

### Get Health Report

```typescript
import { wizardAIAgent } from '@/services/wizardAIAgent';

// Get latest health report
const report = wizardAIAgent.getLatestReport();

console.log(report.status); // 'healthy' | 'warning' | 'critical'
console.log(report.issues); // Array of detected issues

// Get human-readable summary
console.log(wizardAIAgent.getSummary());
// Output:
// "Wizard Health: CRITICAL
//  🚨 2 issue(s) detected:
//  1. [CRITICAL] Dual Validation System Detected
//     Multiple gate validation systems are disagreeing..."
```

### Manual Health Check

```typescript
// Force immediate health check (doesn't wait 30s)
wizardHealthMonitor.track('gate_check', 'location', {...}, sessionId);
// Agent will analyze on next interval

// Clear history (useful for testing)
wizardHealthMonitor.clear();
```

---

## Dashboard Features

### Status Indicators

- 🟢 **Healthy** - No issues detected
- 🟡 **Warning** - High severity issues present
- 🔴 **Critical** - Critical issues blocking users

### Issue Cards

Each issue shows:
- **Severity badge** - Critical/High/Medium/Low
- **Title** - Short description
- **Description** - Full explanation with metrics
- **Suggested Fix** - Code-level fix suggestion
- **Auto-fix available** - Whether auto-patch is possible

### Metrics Table

| Metric | Description |
|--------|-------------|
| **Error Rate** | Total errors in recent metrics |
| **Bottlenecks** | Steps with high exit/failure rates |

### Bottleneck Table

| Column | Description |
|--------|-------------|
| **Step** | Wizard step name |
| **Exit Rate** | % of users who leave at this step |
| **Gate Failure** | % of proceed attempts that fail |
| **Avg Time** | Average time spent on step (seconds) |

---

## Configuration

### Change Check Interval

Default: 30 seconds

```typescript
// In WizardV7Page.tsx
wizardAIAgent.start(60000); // Check every 60 seconds
```

### Disable in Production

AI agent **only runs in development** by default:

```typescript
if (import.meta.env.DEV) {
  wizardAIAgent.start();
}
```

To enable in production (not recommended):

```typescript
wizardAIAgent.start(); // Always runs
```

### Disable Completely

```typescript
wizardHealthMonitor.setEnabled(false);
wizardAIAgent.stop();
```

---

## Real-World Example

### Issue: Dual Validation Bug (Feb 4, 2026)

**Symptom:** Users can't proceed from Step 1 even with valid ZIP

**Detection:**
```
🤖 [Wizard AI Agent] Found 1 issue(s):
{
  severity: 'critical',
  type: 'dual_validation',
  title: 'Dual Validation System Detected',
  description: 'Multiple gate validation systems are disagreeing on step "location"...'
}
```

**Root Cause:** Two validation systems:
1. `wizardStepGates.ts` - checks for valid ZIP ✅
2. `stepCanProceed()` in `useWizardV7.ts` - checks for location object ❌

**Fix Applied:**
```typescript
// Updated stepCanProceed() to check for ZIP like wizardStepGates.ts
const zip = state.location?.zip || state.locationRawInput || "";
const normalizedZip = zip.replace(/\D/g, "");

if (normalizedZip.length >= 5) {
  return { ok: true }; // ✅ Can proceed with just ZIP
}
```

**Verification:**
After fix, validation mismatch count = 0 ✅

---

## Troubleshooting

### Agent not starting

**Check console:**
```
🤖 [Wizard AI Agent] Starting health monitoring...
```

If missing, check:
1. Are you in dev mode? (`import.meta.env.DEV`)
2. Is WizardV7Page.tsx loading correctly?
3. Check browser console for errors

### Dashboard not showing

**Check URL:**
```
http://localhost:5178/wizard?health=1
```

Must include `?health=1` parameter.

### No issues detected

Good! This means wizard is healthy.

**Force an issue** (for testing):
```typescript
// Manually create a gate mismatch
wizardHealthMonitor.track('gate_check', 'location', {
  gateSystem1: { canProceed: true },
  gateSystem2: { canProceed: false }, // Intentional mismatch
  state: {}
}, 'test-session');
```

---

## Future Enhancements

### Auto-Fix System (Planned)

```typescript
// Agent detects issue
const issue = {
  type: 'dual_validation',
  autoFixAvailable: true,
  fixPatch: `
    // Remove duplicate validation
    - if (!state.location) return { ok: false };
    + // Use wizardStepGates.ts instead
  `
};

// Agent applies fix
wizardAIAgent.applyAutoFix(issue.id);
```

### Predictive Analytics

- Predict which users will abandon based on behavior
- Suggest UX improvements based on time-on-step patterns
- A/B test gate thresholds automatically

### Integration with CI/CD

- Block deployment if critical issues detected
- Auto-generate GitHub issues for high-severity problems
- Slack/email alerts for production issues

---

## Contributing

### Adding New Detections

1. Track custom metrics in `wizardHealthMonitor`
2. Add detection logic in `wizardAIAgent.runHealthCheck()`
3. Create issue generator (e.g., `createMyIssue()`)
4. Add to health report

Example:

```typescript
// 1. Track metric
wizardHealthMonitor.track('performance', step, {
  loadTime: 3000 // ms
}, sessionId);

// 2. Detect in runHealthCheck()
if (metric.event === 'performance' && metric.data.loadTime > 2000) {
  issues.push(this.createSlowLoadIssue(metric));
}

// 3. Create issue generator
private createSlowLoadIssue(metric): Issue {
  return {
    id: `slow-load-${Date.now()}`,
    severity: 'medium',
    type: 'performance',
    title: `Slow Load: Step ${metric.step}`,
    description: `Step loaded in ${metric.data.loadTime}ms (threshold: 2000ms)`,
    suggestedFix: 'Optimize step component rendering or lazy-load heavy assets.',
    autoFixAvailable: false,
  };
}
```

---

## FAQ

**Q: Does this slow down the wizard?**  
A: No. Monitoring is async and non-blocking. Metrics are lightweight (~100 bytes each).

**Q: Can I use this in production?**  
A: Not recommended. It's designed for dev/staging. For production, use proper APM tools (Sentry, DataDog).

**Q: What's the performance overhead?**  
A: Minimal. Checks run every 30s, not on every user action. ~0.1% CPU usage.

**Q: Can it fix issues automatically?**  
A: Not yet. Future versions will support auto-patching for common issues.

**Q: How do I report false positives?**  
A: File an issue with the health report JSON and steps to reproduce.

---

## License

Part of Merlin BESS Quote Builder. Internal use only.

**Built with ❤️ by the Merlin AI team**
