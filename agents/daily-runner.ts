#!/usr/bin/env node
/**
 * MERLIN DAILY RUNNER — AUTONOMOUS AGENT ORCHESTRATOR
 * ====================================================
 * The master orchestrator that runs all Merlin agents daily.
 * Scheduled via cron at 6:00 AM PT every day.
 *
 * Executes in order:
 * 1. Health Monitor → system health report
 * 2. Usage Analytics → 24h / 7d / 30d metrics
 * 3. Bug Detector → scan codebase for issues
 * 4. Newsletter Generator → compile + send daily briefing
 * 5. Change Log → record agent actions
 * 6. Alerts → notify if critical issues found
 *
 * Authority Level: Level 1 (Safe Writes — no SSOT modifications)
 * See: .merlin-meta/CONSTITUTION.md § 4.1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runHealthCheck, saveHealthReport } from './health-monitor.ts';
import { generateUsageReport, saveUsageReport } from './usage-analytics.ts';
import { generateNewsletter, saveNewsletter, sendNewsletter } from './newsletter-generator.ts';
import { runBugDetection, saveBugReport } from './bug-detector.ts';
import { runDailyDeal } from './daily-deal.ts';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// TYPES
// ============================================================

interface AgentRunResult {
  runId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'success' | 'partial' | 'failed';
  steps: AgentStep[];
  summary: string;
  criticalAlerts: string[];
}

interface AgentStep {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  durationMs: number;
  output?: string;
  error?: string;
}

interface ChangeLogEntry {
  timestamp: string;
  agent: string;
  action: string;
  files_modified: string[];
  authorization_level: number;
  reviewed_by: string | null;
  deployed: boolean;
  details?: Record<string, unknown>;
}

// ============================================================
// CHANGE LOG
// ============================================================

function logChange(entry: Omit<ChangeLogEntry, 'timestamp'>): void {
  const logPath = path.join(__dirname, '_change_log.json');
  let log: ChangeLogEntry[] = [];

  if (fs.existsSync(logPath)) {
    try {
      log = JSON.parse(fs.readFileSync(logPath, 'utf8')) as ChangeLogEntry[];
    } catch {
      log = [];
    }
  }

  log.push({ ...entry, timestamp: new Date().toISOString() });

  // Keep last 1000 entries
  if (log.length > 1000) log = log.slice(-1000);

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}

// ============================================================
// ALERTING
// ============================================================

async function sendCriticalAlert(message: string, runId: string): Promise<void> {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const recipientEmail = process.env.FOUNDER_EMAIL ?? 'robert@merlinpro.energy';

  console.error(`🚨 CRITICAL ALERT: ${message}`);

  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Merlin Critical Alert* [Run: ${runId}]\n${message}`,
        }),
      });
    } catch (err) {
      console.error('Slack alert failed:', err);
    }
  }

  // Log the alert
  const alertsPath = path.join(__dirname, '_incidents.json');
  let incidents: Array<{ runId: string; timestamp: string; message: string }> = [];
  if (fs.existsSync(alertsPath)) {
    try { incidents = JSON.parse(fs.readFileSync(alertsPath, 'utf8')) as typeof incidents; } catch { /* ignore */ }
  }
  incidents.push({ runId, timestamp: new Date().toISOString(), message });
  fs.writeFileSync(alertsPath, JSON.stringify(incidents, null, 2));

  // Suppress unused variable warning
  void recipientEmail;
}

// ============================================================
// STEP RUNNER
// ============================================================

async function runStep<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ step: AgentStep; result: T | null }> {
  const start = Date.now();
  console.log(`\n▶ Running: ${name}`);

  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    console.log(`  ✅ ${name} completed in ${durationMs}ms`);
    return {
      step: { name, status: 'success', durationMs },
      result,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ ${name} failed: ${error}`);
    return {
      step: { name, status: 'failed', durationMs, error },
      result: null,
    };
  }
}

// ============================================================
// MAIN RUNNER
// ============================================================

async function runDailyAgent(): Promise<AgentRunResult> {
  const runId = `agent-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const steps: AgentStep[] = [];
  const criticalAlerts: string[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧙 MERLIN DAILY AGENT — Run ID: ${runId}`);
  console.log(`   Started: ${startedAt}`);
  console.log(`   Auth Level: 1 (Safe Writes)`);
  console.log(`${'='.repeat(60)}`);

  // Step 1: Health Check
  const { step: healthStep, result: healthResult } = await runStep(
    '1. System Health Check',
    () => runHealthCheck()
  );
  steps.push(healthStep);

  if (healthResult) {
    await saveHealthReport(healthResult);

    if (healthResult.overall === 'critical') {
      const msg = `System health CRITICAL (${healthResult.score}/100): ${healthResult.actionItems[0]}`;
      criticalAlerts.push(msg);
      await sendCriticalAlert(msg, runId);
    }
  }

  // Step 2: Usage Analytics (24h, 7d, 30d)
  let usageResult24h = null;

  const { step: usage24hStep, result: ur24h } = await runStep(
    '2a. Usage Analytics (24h)',
    () => generateUsageReport('24h')
  );
  steps.push(usage24hStep);
  if (ur24h) {
    await saveUsageReport(ur24h);
    usageResult24h = ur24h;
  }

  const { step: usage7dStep, result: ur7d } = await runStep(
    '2b. Usage Analytics (7d)',
    () => generateUsageReport('7d')
  );
  steps.push(usage7dStep);
  if (ur7d) await saveUsageReport(ur7d);

  // Step 3: Bug Detection
  const { step: bugStep, result: bugReport } = await runStep(
    '3. Bug Detection',
    () => runBugDetection()
  );
  steps.push(bugStep);

  if (bugReport) {
    await saveBugReport(bugReport);
    if (bugReport.critical > 0) {
      const msg = `Bug detector found ${bugReport.critical} CRITICAL issue(s). Human review required.\n${bugReport.issues.filter(i => i.severity === 'critical').map(i => `• [${i.file}:${i.line}] ${i.message}`).join('\n')}`;
      criticalAlerts.push(msg);
      await sendCriticalAlert(msg, runId);
    }
    if (!bugReport.buildPasses) {
      const msg = `TypeScript build is FAILING — ${bugReport.high} high-severity errors detected`;
      criticalAlerts.push(msg);
      await sendCriticalAlert(msg, runId);
    }
  }

  // Step 4: Newsletter Generation
  if (healthResult && usageResult24h) {
    const { step: newsletterStep, result: newsletterResult } = await runStep(
      '4. Newsletter Generation',
      () => generateNewsletter(healthResult, usageResult24h!)
    );
    steps.push(newsletterStep);

    if (newsletterResult) {
      await saveNewsletter(newsletterResult);

      // Send to founder
      const founderEmail = process.env.FOUNDER_EMAIL ?? 'robert@merlinpro.energy';
      if (founderEmail && process.env.RESEND_API_KEY) {
        const { step: sendStep } = await runStep(
          '5. Send Newsletter to Founder',
          () => sendNewsletter(newsletterResult, founderEmail).then(() => { /* void */ })
        );
        steps.push(sendStep);
      } else {
        steps.push({ name: '5. Send Newsletter to Founder', status: 'skipped', durationMs: 0, output: 'Email credentials not configured' });
        console.log('  ⏭ Newsletter send skipped — set FOUNDER_EMAIL + RESEND_API_KEY');
      }
    }
  } else {
    steps.push({ name: '4. Newsletter Generation', status: 'skipped', durationMs: 0, output: 'Skipped — health or usage data unavailable' });
  }

  // Step 6: Daily Deal — rotating industry quote posted to Discord
  const { step: dealStep } = await runStep(
    '6. Daily Deal (Discord)',
    () => runDailyDeal().then(() => { /* void */ })
  );
  steps.push(dealStep);

  // Step 7: Generate Daily Summary Report
  const { step: summaryStep } = await runStep(
    '7. Save Daily Summary',
    async () => {
      const summary = {
        runId,
        date: new Date().toISOString().split('T')[0],
        healthScore: healthResult?.score ?? 0,
        healthStatus: healthResult?.overall ?? 'unknown',
        quotesGenerated24h: usageResult24h?.quotes.total ?? 0,
        leadsGenerated24h: usageResult24h?.leads.total ?? 0,
        leadRevenue24h: usageResult24h?.leads.estimatedRevenue ?? 0,
        kpiStatus: usageResult24h?.kpiStatus ?? [],
        actionItems: healthResult?.actionItems ?? [],
        criticalAlerts,
      };

      const reportsDir = path.join(__dirname, '_reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      const dateStr = new Date().toISOString().split('T')[0];
      fs.writeFileSync(
        path.join(reportsDir, `daily-summary-${dateStr}.json`),
        JSON.stringify(summary, null, 2)
      );
    }
  );
  steps.push(summaryStep);

  // Log this run to change log
  logChange({
    agent: 'daily-runner',
    action: 'daily_report_generated',
    files_modified: [
      `agents/_reports/health-${new Date().toISOString().split('T')[0]}.json`,
      `agents/_reports/usage-24h-${new Date().toISOString().split('T')[0]}.json`,
      `agents/_reports/bugs-${new Date().toISOString().split('T')[0]}.json`,
      `agents/_reports/newsletter-${new Date().toISOString().split('T')[0]}.html`,
    ],
    authorization_level: 1,
    reviewed_by: null,
    deployed: false,
    details: {
      healthScore: healthResult?.score ?? 0,
      quotesGenerated: usageResult24h?.quotes.total ?? 0,
      leadsGenerated: usageResult24h?.leads.total ?? 0,
    },
  });

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - new Date(startedAt).getTime();

  const failedSteps = steps.filter(s => s.status === 'failed');
  const status: 'success' | 'partial' | 'failed' =
    failedSteps.length === 0 ? 'success' :
    failedSteps.length < steps.length / 2 ? 'partial' :
    'failed';

  const summary = [
    `Run ID: ${runId}`,
    `Status: ${status.toUpperCase()}`,
    `Duration: ${Math.round(durationMs / 1000)}s`,
    `Steps: ${steps.filter(s => s.status === 'success').length}/${steps.length} succeeded`,
    `Health: ${healthResult?.score ?? '?'}/100 (${healthResult?.overall ?? 'unknown'})`,
    `Quotes (24h): ${usageResult24h?.quotes.total ?? 0}`,
    `Leads (24h): ${usageResult24h?.leads.total ?? 0}`,
    `Revenue (24h): $${(usageResult24h?.leads.estimatedRevenue ?? 0).toLocaleString()}`,
    `Critical Alerts: ${criticalAlerts.length}`,
  ].join('\n');

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 MERLIN DAILY AGENT COMPLETE');
  console.log(summary);
  console.log(`${'='.repeat(60)}\n`);

  return {
    runId,
    startedAt,
    completedAt,
    durationMs,
    status,
    steps,
    summary,
    criticalAlerts,
  };
}

// ============================================================
// ENTRY POINT
// ============================================================

runDailyAgent()
  .then((result) => {
    process.exit(result.status === 'failed' ? 1 : 0);
  })
  .catch((err) => {
    console.error('Fatal agent error:', err);
    process.exit(1);
  });
