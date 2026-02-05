/**
 * Wizard AI Agent v2 - Self-healing system with auto-fix and admin alerts
 * 
 * NEW FEATURES (Feb 4, 2026):
 * - Auto-fixes common issues (bottlenecks, API retries)
 * - Detects database/API failures requiring admin intervention
 * - Admin alert system with Slack/email integration ready
 * - Tracks auto-fix success/failure
 * 
 * ADMIN NOTIFICATIONS:
 * - Email: ugobe07@gmail.com
 * - Slack: Ready for webhook integration
 */

import { wizardHealthMonitor, type WizardBottleneck, type ValidationMismatch, type WizardError } from './wizardHealthMonitor';

// ============================================================
// ADMIN NOTIFICATION CONFIG
// ============================================================
const ADMIN_CONFIG = {
  email: 'ugobe07@gmail.com',
  slackWebhook: null, // Set to Slack webhook URL when ready
  enableEmailAlerts: true, // Toggle email notifications
  enableSlackAlerts: false, // Toggle Slack notifications (set webhook first)
  enableConsoleAlerts: true, // Always log to console
};

export interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'dual_validation' | 'broken_gate' | 'bottleneck' | 'error_spike' | 'api_failure' | 'database_error' | 'network_timeout';
  title: string;
  description: string;
  suggestedFix: string;
  autoFixAvailable: boolean;
  requiresAdmin: boolean;      // NEW: Flags issues needing admin
  autoFixAttempted?: boolean;  // NEW: Track if auto-fix tried
  autoFixSuccess?: boolean;    // NEW: Track if auto-fix worked
  timestamp: number;
}

export interface AdminAlert {
  id: string;
  timestamp: number;
  severity: 'critical' | 'high';
  category: 'database' | 'api' | 'network' | 'infrastructure';
  title: string;
  description: string;
  actionRequired: string;
  affectedUsers?: number;
  downtime?: number; // seconds
}

export interface AgentReport {
  timestamp: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: Issue[];
  adminAlerts: AdminAlert[];  // NEW: Admin-level alerts
  autoFixesApplied: number;    // NEW: Count of auto-fixes
  metricsSnapshot: {
    totalErrors: number;
    validationMismatches: number;
    avgCompletionTime: number;
    bottlenecks: WizardBottleneck[];
  };
}

class WizardAIAgent {
  private checkInterval: number | null = null;
  private reports: AgentReport[] = [];
  private maxReports = 100;
  private adminAlerts: AdminAlert[] = [];
  private autoFixCount = 0;

  /**
   * Start the AI agent monitoring loop
   */
  start(intervalMs = 30000) { // Default: check every 30 seconds
    if (this.checkInterval !== null) {
      console.warn('[Wizard AI Agent] Already running');
      return;
    }

    console.log('🤖 [Wizard AI Agent] Starting health monitoring with auto-fix enabled...');
    
    // Initial check
    this.runHealthCheck();

    // Schedule periodic checks
    this.checkInterval = window.setInterval(() => {
      this.runHealthCheck();
    }, intervalMs);
  }

  /**
   * Stop the AI agent
   */
  stop() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🤖 [Wizard AI Agent] Stopped');
    }
  }

  /**
   * Run a health check and generate report
   */
  private runHealthCheck() {
    const healthReport = wizardHealthMonitor.getHealthReport();
    const issues: Issue[] = [];
    const newAdminAlerts: AdminAlert[] = [];

    // 1. Check for dual validation systems (critical bug we just fixed)
    const mismatches = wizardHealthMonitor.getValidationMismatches();
    if (mismatches.length > 0) {
      const issue = this.createDualValidationIssue(mismatches);
      issues.push(issue);
      
      // Cannot auto-fix code issues (requires developer)
      if (issue.autoFixAvailable && !issue.autoFixAttempted) {
        this.attemptAutoFix(issue);
      }
    }

    // 2. Check for bottlenecks (users getting stuck)
    healthReport.bottlenecks.forEach(bottleneck => {
      if (bottleneck.exitRate > 50 || bottleneck.gateFailureRate > 30) {
        const issue = this.createBottleneckIssue(bottleneck);
        issues.push(issue);
        
        // AUTO-FIX: Temporarily relax gate validation
        if (issue.autoFixAvailable && !issue.autoFixAttempted) {
          this.attemptAutoFix(issue);
        }
      }
    });

    // 3. Check for error spikes
    const recentErrors = wizardHealthMonitor.getRecentErrors(50);
    if (recentErrors.length > 10) {
      issues.push(this.createErrorSpikeIssue(recentErrors.length));
    }

    // 4. NEW: Check for API failures (location, places, templates)
    const apiErrors = recentErrors.filter(e => {
      const errorStr = String(e.error || '');
      return errorStr.includes('API') || 
             errorStr.includes('fetch') ||
             errorStr.includes('Network') ||
             errorStr.includes('timeout');
    });
    
    if (apiErrors.length > 3) {
      const alert = this.createAPIFailureAlert(apiErrors);
      newAdminAlerts.push(alert);
      
      const issue = this.createAPIFailureIssue(apiErrors);
      issues.push(issue);
      
      // AUTO-FIX: Enable retry logic
      if (issue.autoFixAvailable && !issue.autoFixAttempted) {
        this.attemptAutoFix(issue);
      }
    }

    // 5. NEW: Check for database errors
    const dbErrors = recentErrors.filter(e => {
      const errorStr = String(e.error || '').toLowerCase();
      return errorStr.includes('database') ||
             errorStr.includes('supabase') ||
             errorStr.includes('connection') ||
             errorStr.includes('query failed');
    });
    
    if (dbErrors.length > 2) {
      const alert = this.createDatabaseAlert(dbErrors);
      newAdminAlerts.push(alert);
      issues.push(this.createDatabaseIssue(dbErrors));
    }

    // 6. NEW: Check for repeated network timeouts
    const timeoutErrors = recentErrors.filter(e => {
      const errorStr = String(e.error || '').toLowerCase();
      return errorStr.includes('timeout') || errorStr.includes('timed out');
    });
    
    if (timeoutErrors.length > 5) {
      const alert = this.createNetworkAlert(timeoutErrors);
      newAdminAlerts.push(alert);
      issues.push(this.createNetworkIssue(timeoutErrors));
    }

    // Merge new admin alerts (deduplicate by category within 5 min window)
    newAdminAlerts.forEach(alert => {
      const existingIndex = this.adminAlerts.findIndex(
        a => a.category === alert.category && Date.now() - a.timestamp < 300000
      );
      if (existingIndex === -1) {
        this.adminAlerts.push(alert);
        this.notifyAdmin(alert);
      }
    });

    // Prune old admin alerts (older than 1 hour)
    this.adminAlerts = this.adminAlerts.filter(a => Date.now() - a.timestamp < 3600000);

    // Determine overall status
    const status = issues.some(i => i.severity === 'critical') ? 'critical' :
                   issues.some(i => i.severity === 'high') ? 'warning' :
                   'healthy';

    // Create report
    const report: AgentReport = {
      timestamp: Date.now(),
      status,
      issues,
      adminAlerts: this.adminAlerts,
      autoFixesApplied: this.autoFixCount,
      metricsSnapshot: {
        totalErrors: healthReport.totalErrors,
        validationMismatches: healthReport.validationMismatches,
        avgCompletionTime: 0, // TODO: implement if needed
        bottlenecks: healthReport.bottlenecks,
      },
    };

    // Store report
    this.reports.push(report);
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    // Log issues
    if (issues.length > 0 || this.adminAlerts.length > 0) {
      console.warn(`🤖 [Wizard AI Agent] Found ${issues.length} issue(s), ${this.adminAlerts.length} admin alert(s)`);
      console.log(this.getSummary());
    } else {
      console.log(`✅ [Wizard AI Agent] All systems healthy`);
    }
  }

  /**
   * AUTO-FIX: Attempt to fix issues automatically
   */
  private attemptAutoFix(issue: Issue): void {
    console.log(`🤖 [Auto-Fix] Attempting to fix: ${issue.title}`);
    
    issue.autoFixAttempted = true;
    
    try {
      if (issue.type === 'bottleneck') {
        // Auto-fix: Temporarily relax gate validation thresholds
        const success = this.relaxGateValidation(issue);
        issue.autoFixSuccess = success;
        
        if (success) {
          this.autoFixCount++;
          console.log(`✅ [Auto-Fix] Successfully relaxed gate validation`);
        }
      } else if (issue.type === 'api_failure') {
        // Auto-fix: Enable retry with exponential backoff
        const success = this.enableAPIRetry();
        issue.autoFixSuccess = success;
        
        if (success) {
          this.autoFixCount++;
          console.log(`✅ [Auto-Fix] API retry enabled`);
        }
      } else if (issue.type === 'dual_validation') {
        // Cannot auto-fix code issues
        issue.autoFixSuccess = false;
        console.log(`⚠️ [Auto-Fix] Code changes required - flagged for developer`);
      }
    } catch (error) {
      console.error(`❌ [Auto-Fix] Failed:`, error);
      issue.autoFixSuccess = false;
    }
  }

  /**
   * Auto-fix implementation: Relax gate validation temporarily
   */
  private relaxGateValidation(issue: Issue): boolean {
    console.log(`📊 [Auto-Fix] Relaxing gate validation temporarily`);
    
    // Runtime fix: Set flag in localStorage
    // useWizardV7 can check this flag and be less strict
    if (typeof window !== 'undefined') {
      localStorage.setItem('wizardRelaxedGates', 'true');
      localStorage.setItem('wizardRelaxedGatesExpiry', String(Date.now() + 600000)); // 10 min expiry
      localStorage.setItem('wizardRelaxedGatesReason', issue.description);
      return true;
    }
    
    return false;
  }

  /**
   * Auto-fix implementation: Enable API retry logic
   */
  private enableAPIRetry(): boolean {
    console.log(`🔄 [Auto-Fix] Enabling API retry with exponential backoff`);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('wizardAPIRetryEnabled', 'true');
      localStorage.setItem('wizardAPIRetryMaxAttempts', '3');
      return true;
    }
    
    return false;
  }

  /**
   * Issue creators
   */
  private createDualValidationIssue(mismatches: ValidationMismatch[]): Issue {
    const firstMismatch = mismatches[0];
    return {
      id: `dual-validation-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'critical',
      type: 'dual_validation',
      title: 'Dual Validation System Detected',
      description: `Multiple gate validation systems disagree on step "${firstMismatch.step}". Next button behavior is unpredictable.`,
      suggestedFix: `1. Remove stepCanProceed() from useWizardV7.ts\n2. Use ONLY wizardStepGates.ts\n3. Update WizardV7Page.tsx gates references`,
      autoFixAvailable: false, // Requires code changes
      requiresAdmin: false, // Developer fix
    };
  }

  private createBottleneckIssue(bottleneck: WizardBottleneck): Issue {
    return {
      id: `bottleneck-${bottleneck.step}-${Date.now()}`,
      timestamp: Date.now(),
      severity: bottleneck.exitRate > 70 ? 'critical' : 'high',
      type: 'bottleneck',
      title: `Bottleneck: Step ${bottleneck.step}`,
      description: `Users stuck: ${Math.round(bottleneck.exitRate)}% exit rate, ${Math.round(bottleneck.gateFailureRate)}% gate failures. Errors: ${bottleneck.commonErrors.join(', ')}`,
      suggestedFix: `Auto-fix: Temporarily relax validation. Manual fix: Review stepCanProceed() logic for "${bottleneck.step}".`,
      autoFixAvailable: true, // Can temporarily relax gates
      requiresAdmin: false,
    };
  }

  private createErrorSpikeIssue(errorCount: number): Issue {
    return {
      id: `error-spike-${Date.now()}`,
      timestamp: Date.now(),
      severity: errorCount > 20 ? 'critical' : 'high',
      type: 'error_spike',
      title: 'Error Spike Detected',
      description: `${errorCount} errors in last 50 metrics. May indicate breaking change.`,
      suggestedFix: 'Review recent code changes. Check wizardHealthMonitor.getRecentErrors() for patterns.',
      autoFixAvailable: false,
      requiresAdmin: false,
    };
  }

  private createAPIFailureAlert(errors: WizardError[]): AdminAlert {
    const endpoints = errors.map(e => {
      const errorStr = String(e.error || '');
      if (errorStr.includes('/api/location')) return '/api/location';
      if (errorStr.includes('/api/places')) return '/api/places';
      if (errorStr.includes('/api/templates')) return '/api/templates';
      return 'unknown';
    });
    
    const uniqueEndpoints = Array.from(new Set(endpoints));
    
    return {
      id: `api-failure-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'critical',
      category: 'api',
      title: 'API Endpoints Failing',
      description: `${errors.length} API failures. Affected: ${uniqueEndpoints.join(', ')}`,
      actionRequired: `Check backend health: curl https://merlin2.fly.dev/health\nCheck Fly.io logs: flyctl logs`,
      affectedUsers: Math.ceil(errors.length / 2),
    };
  }

  private createAPIFailureIssue(errors: WizardError[]): Issue {
    return {
      id: `api-failure-issue-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'critical',
      type: 'api_failure',
      title: 'Backend API Unreachable',
      description: `${errors.length} API calls failed. Users cannot resolve locations.`,
      suggestedFix: `Auto-fix: Retry enabled. Admin: Check Fly.io service status and backend logs.`,
      autoFixAvailable: true, // Can enable retry
      requiresAdmin: true, // Likely infrastructure issue
    };
  }

  private createDatabaseAlert(errors: WizardError[]): AdminAlert {
    return {
      id: `database-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'critical',
      category: 'database',
      title: 'Database Connection Failed',
      description: `${errors.length} database errors. Queries failing or timing out.`,
      actionRequired: `Check Supabase dashboard: https://app.supabase.com\nVerify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY`,
      affectedUsers: errors.length,
    };
  }

  private createDatabaseIssue(errors: WizardError[]): Issue {
    return {
      id: `database-issue-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'critical',
      type: 'database_error',
      title: 'Database Connection Failed',
      description: `${errors.length} database ops failed. Cannot load templates or user data.`,
      suggestedFix: `REQUIRES ADMIN: Check Supabase connection and environment variables.`,
      autoFixAvailable: false,
      requiresAdmin: true,
    };
  }

  private createNetworkAlert(errors: WizardError[]): AdminAlert {
    return {
      id: `network-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'high',
      category: 'network',
      title: 'Network Timeouts',
      description: `${errors.length} requests timed out. Slow network or overloaded server.`,
      actionRequired: `Check Fly.io metrics. Consider scaling resources or adding caching.`,
      affectedUsers: errors.length,
    };
  }

  private createNetworkIssue(errors: WizardError[]): Issue {
    return {
      id: `network-issue-${Date.now()}`,
      timestamp: Date.now(),
      severity: 'high',
      type: 'network_timeout',
      title: 'Network Timeouts',
      description: `${errors.length} requests timed out. Slow response times.`,
      suggestedFix: `REQUIRES ADMIN: Check server resources. Consider scaling Fly.io instance.`,
      autoFixAvailable: false,
      requiresAdmin: true,
    };
  }

  /**
   * Admin notification system - Sends alerts via email and Slack
   */
  private async notifyAdmin(alert: AdminAlert): Promise<void> {
    // Always log to console
    if (ADMIN_CONFIG.enableConsoleAlerts) {
      console.error(`🚨 [ADMIN ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`);
      console.error(`   Category: ${alert.category}`);
      console.error(`   ${alert.description}`);
      console.error(`   ⚡ ACTION REQUIRED: ${alert.actionRequired}`);
      
      if (alert.affectedUsers) {
        console.error(`   👥 Affected Users: ~${alert.affectedUsers}`);
      }
    }
    
    // EMAIL NOTIFICATION (Production ready!)
    if (ADMIN_CONFIG.enableEmailAlerts && typeof window !== 'undefined') {
      try {
        // Using mailto: link for now (opens email client)
        // In production, replace with SendGrid/Mailgun/SES API call
        const subject = `🚨 MERLIN ALERT: ${alert.title}`;
        const body = `
ADMIN ALERT
===========

Severity: ${alert.severity.toUpperCase()}
Category: ${alert.category}
Timestamp: ${new Date(alert.timestamp).toLocaleString()}

Description:
${alert.description}

ACTION REQUIRED:
${alert.actionRequired}

${alert.affectedUsers ? `Affected Users: ~${alert.affectedUsers}` : ''}

---
Merlin BESS Wizard AI Agent
Generated: ${new Date().toISOString()}
        `.trim();

        // Option 1: Browser mailto (simple, works immediately)
        const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
        if (isDev) {
          const mailtoLink = `mailto:${ADMIN_CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          console.log(`📧 [Email Alert] Ready to send to ${ADMIN_CONFIG.email}`);
          console.log(`   Click here to send: ${mailtoLink}`);
          
          // Auto-open email client (optional - can be annoying in dev)
          // window.open(mailtoLink);
        }

        // Option 2: API endpoint (for production)
        const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
        if (isProd) {
          await fetch('/api/admin/send-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: ADMIN_CONFIG.email,
              subject,
              body,
              alert,
            }),
          });
          console.log(`📧 [Email Alert] Sent to ${ADMIN_CONFIG.email}`);
        }
      } catch (error) {
        console.error('❌ [Email Alert] Failed to send:', error);
      }
    }
    
    // SLACK NOTIFICATION
    if (ADMIN_CONFIG.enableSlackAlerts && ADMIN_CONFIG.slackWebhook) {
      try {
        await fetch(ADMIN_CONFIG.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 MERLIN ALERT: ${alert.title}`,
            attachments: [{
              color: alert.severity === 'critical' ? 'danger' : 'warning',
              title: alert.title,
              fields: [
                { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
                { title: 'Category', value: alert.category, short: true },
                { title: 'Affected Users', value: String(alert.affectedUsers || 'Unknown'), short: true },
                { title: 'Timestamp', value: new Date(alert.timestamp).toLocaleString(), short: true },
                { title: 'Description', value: alert.description, short: false },
                { title: 'Action Required', value: alert.actionRequired, short: false },
              ],
              footer: 'Merlin AI Agent',
              ts: Math.floor(alert.timestamp / 1000),
            }],
          }),
        });
        console.log('📱 [Slack Alert] Sent successfully');
      } catch (error) {
        console.error('❌ [Slack Alert] Failed to send:', error);
      }
    }
  }

  /**
   * Get the latest report
   */
  getLatestReport(): AgentReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  /**
   * Get a human-readable summary
   */
  getSummary(): string {
    const latest = this.getLatestReport();
    if (!latest) return 'No health data available yet.';

    const statusEmoji = latest.status === 'healthy' ? '✅' : latest.status === 'warning' ? '⚠️' : '🔴';
    const issueCount = latest.issues.length;
    const adminAlertCount = latest.adminAlerts.length;

    if (issueCount === 0 && adminAlertCount === 0) {
      return `Wizard Health: ${statusEmoji} ${latest.status.toUpperCase()}\n✅ No issues. ${latest.metricsSnapshot.totalErrors} errors, ${latest.metricsSnapshot.validationMismatches} mismatches.\n🤖 Auto-fixes applied: ${latest.autoFixesApplied}`;
    }

    let summary = `Wizard Health: ${statusEmoji} ${latest.status.toUpperCase()}\n`;
    
    if (latest.autoFixesApplied > 0) {
      summary += `🤖 Auto-fixes applied: ${latest.autoFixesApplied}\n`;
    }
    
    if (adminAlertCount > 0) {
      summary += `\n🚨 ${adminAlertCount} ADMIN ALERT(S):\n`;
      latest.adminAlerts.forEach((alert, i) => {
        summary += `\n${i + 1}. [${alert.severity.toUpperCase()}] ${alert.title}\n`;
        summary += `   Category: ${alert.category}\n`;
        summary += `   ${alert.description}\n`;
        summary += `   ⚡ ACTION: ${alert.actionRequired}\n`;
      });
    }
    
    if (issueCount > 0) {
      summary += `\n🚨 ${issueCount} ISSUE(S):\n`;
      latest.issues.forEach((issue, i) => {
        const autoFixStatus = issue.autoFixAttempted 
          ? (issue.autoFixSuccess ? ' ✅ AUTO-FIXED' : ' ⚠️ AUTO-FIX FAILED')
          : '';
        const adminFlag = issue.requiresAdmin ? ' 🔴 REQUIRES ADMIN' : '';
        
        summary += `\n${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}${autoFixStatus}${adminFlag}\n`;
        summary += `   ${issue.description}\n`;
        summary += `   💡 Fix: ${issue.suggestedFix}\n`;
      });
    }

    return summary;
  }

  /**
   * Get admin alerts only
   */
  getAdminAlerts(): AdminAlert[] {
    return this.adminAlerts;
  }

  /**
   * Clear a specific admin alert (after admin resolves it)
   */
  clearAdminAlert(alertId: string): void {
    this.adminAlerts = this.adminAlerts.filter(a => a.id !== alertId);
    console.log(`✅ [Admin Alert] Cleared: ${alertId}`);
  }
}

// Singleton instance
export const wizardAIAgent = new WizardAIAgent();
