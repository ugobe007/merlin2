# Wizard AI Agent Architecture Documentation

**Last Updated**: February 9, 2026

## Overview

The Merlin Wizard has **TWO** AI Agent implementations monitoring health and auto-fixing issues. This document prevents duplication and technical debt.

---

## 🤖 EXISTING AI AGENTS

### 1. **wizardAIAgent.ts** (Original - Feb 2026)

**Location**: `src/services/wizardAIAgent.ts` (268 lines)
**Status**: ⚠️ LEGACY - Superseded by V2

**Features**:

- Basic health monitoring
- Issue detection (dual validation, broken gates, bottlenecks)
- Suggested fixes (manual)
- Reports to developers

**Limitations**:

- No auto-fix capability
- No admin alerts
- No Slack/email integration

---

### 2. **wizardAIAgentV2.ts** (Enhanced - Feb 4, 2026)

**Location**: `src/services/wizardAIAgentV2.ts` (638 lines)
**Status**: ✅ ACTIVE - Current production agent

**Features**:

- ✅ Auto-fixes common issues (bottlenecks, API retries)
- ✅ Detects database/API failures requiring admin intervention
- ✅ Admin alert system with Slack/email integration ready
- ✅ Tracks auto-fix success/failure
- ✅ Admin notifications (ugobe07@gmail.com)

**Integration Points**:

- **WizardV7Page.tsx**: Starts agent on mount (`wizardAIAgent.start(30000)` - checks every 30s)
- **WizardHealthDashboardV2.tsx**: Admin UI to view reports, alerts, auto-fix status

**Admin Config**:

```typescript
const ADMIN_CONFIG = {
  email: "ugobe07@gmail.com",
  slackWebhook: null, // Ready for webhook
  enableEmailAlerts: true,
  enableSlackAlerts: false,
  enableConsoleAlerts: true,
};
```

---

## 📊 HEALTH MONITORING DASHBOARD

### **WizardHealthDashboardV2.tsx**

**Location**: `src/components/wizard/v7/admin/WizardHealthDashboardV2.tsx` (383 lines)
**Route**: `/v7?admin=true` (access via query param)

**Features**:

- Real-time health status (healthy/warning/critical)
- Admin alerts section (database, API, network)
- Auto-fix status badges
- Issue list with severity levels
- Clear admin alerts button
- Auto-refresh (5s intervals)
- Metrics snapshot:
  - Total errors
  - Validation mismatches
  - Avg completion time
  - Bottlenecks

**Data Sources**:

1. `wizardHealthMonitor` - Collects raw metrics
2. `wizardAIAgentV2` - Analyzes metrics, detects issues, applies auto-fixes

---

## 🎭 ADVISOR COMPONENTS (NOT THE AI AGENT)

These are **UI components** for user-facing guidance, NOT health monitoring agents:

### V6 Advisor (WizardV6)

**Location**: `src/components/wizard/v6/advisor/`

- `AdvisorRail.tsx` - Left rail advisor panel
- `AdvisorPublisher.tsx` - Context provider for advisor state
- `AdvisorAvatar.tsx` - Animated avatar component

**Purpose**: User-facing conversational UI for guided wizard experience

### V7 Advisor (WizardV7)

**Location**: `src/components/wizard/v7/advisor/`

- `AIEnergyAdvisor.tsx` - Main advisor component
- `AdvisorAvatar.tsx` - Animated avatar
- Integrated into `WizardShellV7.tsx` left rail

**Purpose**: User-facing conversational UI (unified single-voice design)

**⚠️ IMPORTANT**: These are **NOT** the health monitoring agent. Don't confuse them!

---

## 🔄 ORCHESTRATOR RELATIONSHIP

### **useWizardV7.ts** (3,931 lines)

**Location**: `src/wizard/v7/hooks/useWizardV7.ts`

**Role**: State orchestrator (NOT an AI agent)

- Manages wizard state
- Handles step transitions
- Calls SSOT calculators
- Tracks user inputs

**Integration with AI Agent**:

- Orchestrator emits telemetry events → `wizardHealthMonitor` collects
- AI Agent monitors orchestrator performance
- AI Agent does NOT control orchestrator state

**Clear Separation**:

```
User Input → Orchestrator → SSOT Calculators → Quote Result
                ↓ telemetry
         wizardHealthMonitor
                ↓
         wizardAIAgentV2 (monitors + auto-fixes)
```

---

## 🚨 PREVENT DUPLICATION

### ❌ DO NOT CREATE:

1. Another wizard health monitoring service
2. Another AI agent with similar responsibilities
3. Another health dashboard component
4. Another admin alert system

### ✅ INSTEAD, EXTEND EXISTING:

- Add new issue types to `wizardAIAgentV2.ts`
- Add new auto-fix strategies to `wizardAIAgentV2.ts`
- Add new metrics to `wizardHealthMonitor.ts`
- Add new dashboard panels to `WizardHealthDashboardV2.tsx`

---

## 📁 FILE INVENTORY

| File                                                         | Purpose                            | Status         |
| ------------------------------------------------------------ | ---------------------------------- | -------------- |
| `src/services/wizardAIAgent.ts`                              | Original agent (basic monitoring)  | ⚠️ LEGACY      |
| `src/services/wizardAIAgentV2.ts`                            | Enhanced agent (auto-fix + alerts) | ✅ ACTIVE      |
| `src/services/wizardHealthMonitor.ts`                        | Raw telemetry collection           | ✅ ACTIVE      |
| `src/components/wizard/v7/admin/WizardHealthDashboardV2.tsx` | Admin UI                           | ✅ ACTIVE      |
| `src/components/wizard/v6/advisor/`                          | V6 user-facing advisor UI          | ✅ ACTIVE (V6) |
| `src/components/wizard/v7/advisor/`                          | V7 user-facing advisor UI          | ✅ ACTIVE (V7) |
| `src/wizard/v7/hooks/useWizardV7.ts`                         | State orchestrator (NOT agent)     | ✅ ACTIVE      |

---

## 🔧 CURRENT CONFIGURATION

**AI Agent Running**: ✅ Yes (wizardAIAgentV2)
**Check Interval**: 30 seconds
**Auto-Fix Enabled**: ✅ Yes
**Admin Alerts Enabled**: ✅ Yes (console + email ready)
**Health Dashboard**: ✅ Accessible at `/v7?admin=true`

**Admin Contact**: ugobe07@gmail.com

---

## 📝 FUTURE ENHANCEMENTS

### Phase 1 (Current): ✅ Complete

- Auto-fix common issues
- Admin alerts
- Health dashboard

### Phase 2 (Proposed):

- Slack webhook integration
- Email alert templates
- Auto-fix for more issue types
- Predictive issue detection
- Load balancing recommendations

### Phase 3 (Proposed):

- ML-based anomaly detection
- Self-tuning performance optimization
- A/B test orchestration
- User behavior insights

---

## 🎯 SUMMARY

**Active Health Monitoring System**:

1. **wizardHealthMonitor** collects telemetry
2. **wizardAIAgentV2** analyzes + auto-fixes
3. **WizardHealthDashboardV2** shows admin UI

**User-Facing Advisor** (separate from health agent):

- V6: AdvisorRail system
- V7: AIEnergyAdvisor component

**DO NOT DUPLICATE** - Extend existing services instead.
