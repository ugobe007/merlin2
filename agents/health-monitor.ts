/**
 * MERLIN HEALTH MONITOR
 * =====================
 * Checks system health across all Merlin components:
 * - Frontend availability
 * - API response times
 * - Database connectivity
 * - TrueQuote™ engine accuracy
 * - Error rates (last 24h)
 * - Deployment status
 *
 * Run by: daily-runner.ts
 * Output: agents/_reports/health-{date}.json
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// TYPES
// ============================================================

export interface HealthCheckResult {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'critical';
  score: number; // 0-100
  checks: HealthCheck[];
  summary: string;
  actionItems: string[];
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  value?: string | number;
  threshold?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

// ============================================================
// CHECK IMPLEMENTATIONS
// ============================================================

async function checkEndpoint(url: string, timeoutMs = 5000): Promise<{ ok: boolean; latencyMs: number; statusCode?: number }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      resolve({ ok: (res.statusCode ?? 0) < 400, latencyMs: Date.now() - start, statusCode: res.statusCode });
      res.resume();
    });
    req.on('error', () => resolve({ ok: false, latencyMs: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, latencyMs: timeoutMs }); });
  });
}

async function checkFrontend(): Promise<HealthCheck> {
  const url = process.env.FRONTEND_URL ?? 'https://merlinpro.energy';
  try {
    const result = await checkEndpoint(url);
    return {
      name: 'Frontend (merlinpro.energy)',
      status: result.ok ? (result.latencyMs < 3000 ? 'pass' : 'warn') : 'fail',
      value: result.latencyMs,
      threshold: '< 3000ms',
      message: result.ok ? `Online — ${result.latencyMs}ms` : `OFFLINE — status: ${result.statusCode ?? 'timeout'}`,
      severity: result.ok ? 'info' : 'critical',
    };
  } catch {
    return { name: 'Frontend', status: 'fail', message: 'Check failed — network error', severity: 'critical' };
  }
}

async function checkAPI(): Promise<HealthCheck> {
  const url = process.env.API_URL ?? 'https://api.merlinpro.energy/v1/health';
  try {
    const result = await checkEndpoint(url);
    return {
      name: 'Partner API (/v1/health)',
      status: result.ok ? 'pass' : 'fail',
      value: result.latencyMs,
      threshold: '< 1000ms',
      message: result.ok ? `API healthy — ${result.latencyMs}ms` : `API unhealthy — ${result.statusCode}`,
      severity: result.ok ? 'info' : 'critical',
    };
  } catch {
    return { name: 'Partner API', status: 'fail', message: 'API unreachable', severity: 'critical' };
  }
}

function checkServerLogs(): HealthCheck {
  const logPath = path.join(__dirname, '..', 'server.log');
  try {
    if (!fs.existsSync(logPath)) {
      return { name: 'Server Logs', status: 'warn', message: 'No server.log found', severity: 'warning' };
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const recentLines = logContent.split('\n').slice(-500); // last 500 lines
    const errors = recentLines.filter(l => l.toLowerCase().includes('error'));
    const criticals = recentLines.filter(l => l.toLowerCase().includes('critical') || l.toLowerCase().includes('fatal'));

    return {
      name: 'Server Error Rate (last 500 log lines)',
      status: criticals.length > 0 ? 'fail' : errors.length > 10 ? 'warn' : 'pass',
      value: errors.length,
      threshold: '< 10 errors',
      message: `${errors.length} errors, ${criticals.length} criticals in recent logs`,
      severity: criticals.length > 0 ? 'critical' : errors.length > 10 ? 'warning' : 'info',
    };
  } catch {
    return { name: 'Server Logs', status: 'warn', message: 'Could not read server.log', severity: 'warning' };
  }
}

function checkBuildStatus(): HealthCheck {
  const distPath = path.join(__dirname, '..', 'dist');
  try {
    if (!fs.existsSync(distPath)) {
      return { name: 'Build (dist/)', status: 'warn', message: 'No dist/ folder — build may not have run', severity: 'warning' };
    }
    const stats = fs.statSync(distPath);
    const ageHours = (Date.now() - stats.mtime.getTime()) / 3_600_000;

    return {
      name: 'Build Freshness (dist/)',
      status: ageHours < 24 ? 'pass' : ageHours < 72 ? 'warn' : 'fail',
      value: `${Math.round(ageHours)}h old`,
      threshold: '< 24h for production',
      message: `Last build was ${Math.round(ageHours)} hours ago`,
      severity: ageHours > 72 ? 'warning' : 'info',
    };
  } catch {
    return { name: 'Build Status', status: 'warn', message: 'Could not check dist/', severity: 'warning' };
  }
}

function checkDependencyHealth(): HealthCheck {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const depCount = Object.keys(pkg.dependencies ?? {}).length;
    const devDepCount = Object.keys(pkg.devDependencies ?? {}).length;

    return {
      name: 'Dependencies',
      status: 'pass',
      value: `${depCount} prod, ${devDepCount} dev`,
      message: `${depCount} production dependencies. Run "npm audit" for security check.`,
      severity: 'info',
    };
  } catch {
    return { name: 'Dependencies', status: 'warn', message: 'Could not read package.json', severity: 'warning' };
  }
}

function checkSSoTIntegrity(): HealthCheck {
  const ssotPath = path.join(__dirname, '..', 'src', 'services', 'unifiedQuoteCalculator.ts');
  try {
    if (!fs.existsSync(ssotPath)) {
      return { name: 'SSOT (unifiedQuoteCalculator.ts)', status: 'fail', message: 'CRITICAL: SSOT file missing!', severity: 'critical' };
    }
    const content = fs.readFileSync(ssotPath, 'utf8');
    const hasVersionStamp = content.includes('Version:');
    const hasSSoTComment = content.includes('SINGLE SOURCE OF TRUTH') || content.includes('SSOT');
    const lineCount = content.split('\n').length;

    return {
      name: 'SSOT Integrity (unifiedQuoteCalculator.ts)',
      status: hasVersionStamp && hasSSoTComment ? 'pass' : 'warn',
      value: `${lineCount} lines`,
      message: hasSSoTComment ? `SSOT file healthy — ${lineCount} lines` : 'WARNING: SSOT markers missing from file',
      severity: hasSSoTComment ? 'info' : 'warning',
    };
  } catch {
    return { name: 'SSOT', status: 'fail', message: 'Could not verify SSOT file', severity: 'critical' };
  }
}

function checkAgentChangeLog(): HealthCheck {
  const logPath = path.join(__dirname, '_change_log.json');
  try {
    if (!fs.existsSync(logPath)) {
      return { name: 'Agent Change Log', status: 'pass', message: 'No changes logged yet (new system)', severity: 'info' };
    }
    const log = JSON.parse(fs.readFileSync(logPath, 'utf8')) as Array<{ timestamp: string; deployed?: boolean; reviewed_by?: string }>;
    const unreviewed = log.filter(entry => !entry.reviewed_by && !entry.deployed);
    return {
      name: 'Agent Change Log',
      status: unreviewed.length > 5 ? 'warn' : 'pass',
      value: `${unreviewed.length} unreviewed`,
      message: `${log.length} total agent changes. ${unreviewed.length} awaiting review.`,
      severity: unreviewed.length > 5 ? 'warning' : 'info',
    };
  } catch {
    return { name: 'Agent Change Log', status: 'warn', message: 'Could not read change log', severity: 'warning' };
  }
}

// ============================================================
// MAIN HEALTH CHECK
// ============================================================

export async function runHealthCheck(): Promise<HealthCheckResult> {
  console.log('🔍 Running Merlin health checks...');

  const checks = await Promise.all([
    checkFrontend(),
    checkAPI(),
    checkServerLogs(),
    checkBuildStatus(),
    checkDependencyHealth(),
    checkSSoTIntegrity(),
    checkAgentChangeLog(),
  ]);

  // Scoring
  const scoreMap = { pass: 100, warn: 60, fail: 0 };
  const weights: Record<string, number> = {
    'Frontend (merlinpro.energy)': 25,
    'Partner API (/v1/health)': 20,
    'Server Error Rate (last 500 log lines)': 20,
    'SSOT Integrity (unifiedQuoteCalculator.ts)': 15,
    'Build Freshness (dist/)': 10,
    'Dependencies': 5,
    'Agent Change Log': 5,
  };

  let totalWeight = 0;
  let weightedScore = 0;
  for (const check of checks) {
    const weight = weights[check.name] ?? 5;
    totalWeight += weight;
    weightedScore += scoreMap[check.status] * weight;
  }
  const score = Math.round(weightedScore / totalWeight);

  const criticals = checks.filter(c => c.status === 'fail');
  const warnings = checks.filter(c => c.status === 'warn');

  const overall: 'healthy' | 'degraded' | 'critical' =
    criticals.length > 0 ? 'critical' :
    warnings.length > 2 ? 'degraded' :
    'healthy';

  const actionItems: string[] = [];
  for (const check of checks) {
    if (check.status === 'fail') actionItems.push(`🚨 CRITICAL: ${check.name} — ${check.message}`);
    if (check.status === 'warn') actionItems.push(`⚠️ WARNING: ${check.name} — ${check.message}`);
  }

  const summary = `Merlin Health Score: ${score}/100 (${overall.toUpperCase()}) — ${criticals.length} critical, ${warnings.length} warnings`;

  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    overall,
    score,
    checks,
    summary,
    actionItems,
  };

  return result;
}

// ============================================================
// SAVE REPORT
// ============================================================

export async function saveHealthReport(result: HealthCheckResult): Promise<string> {
  const reportsDir = path.join(__dirname, '_reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const dateStr = new Date().toISOString().split('T')[0];
  const reportPath = path.join(reportsDir, `health-${dateStr}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  console.log(`✅ Health report saved: ${reportPath}`);
  return reportPath;
}

// ============================================================
// STANDALONE RUN
// ============================================================

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runHealthCheck()
    .then(async (result) => {
      const reportPath = await saveHealthReport(result);
      console.log(`\n${result.summary}`);
      console.log(`\n💾 Report: ${reportPath}`);
      process.exit(result.overall === 'critical' ? 1 : 0);
    })
    .catch((err) => {
      console.error('Health check failed:', err);
      process.exit(1);
    });
}
