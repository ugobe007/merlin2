/**
 * Wizard AI Agent - Self-healing system that monitors and fixes wizard issues
 * 
 * Purpose: Autonomous agent that:
 * 1. Monitors wizard health in real-time
 * 2. Detects common anti-patterns (dual validation, broken gates, etc.)
 * 3. Suggests fixes or auto-generates patches
 * 4. Reports issues to developers
 * 
 * Think of this as a "wizard doctor" that runs 24/7
 */

import { wizardHealthMonitor, type WizardBottleneck, type ValidationMismatch } from './wizardHealthMonitor';

interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'dual_validation' | 'broken_gate' | 'bottleneck' | 'error_spike' | 'performance';
  title: string;
  description: string;
  suggestedFix?: string;
  autoFixAvailable: boolean;
  timestamp: number;
}

interface AgentReport {
  timestamp: number;
  status: 'healthy' | 'warning' | 'critical';
  issues: Issue[];
  metricsSnapshot: {
    totalSessions: number;
    errorRate: number;
    avgCompletionTime: number;
    bottlenecks: WizardBottleneck[];
  };
}

class WizardAIAgent {
  private checkInterval: number | null = null;
  private reports: AgentReport[] = [];
  private maxReports = 100;

  /**
   * Start the AI agent monitoring loop
   */
  start(intervalMs = 30000) { // Default: check every 30 seconds
    if (this.checkInterval !== null) {
      console.warn('[Wizard AI Agent] Already running');
      return;
    }

    console.log('🤖 [Wizard AI Agent] Starting health monitoring...');
    
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

    // 1. Check for dual validation systems (critical bug we just fixed)
    const mismatches = wizardHealthMonitor.getValidationMismatches();
    if (mismatches.length > 0) {
      issues.push(this.createDualValidationIssue(mismatches));
    }

    // 2. Check for bottlenecks (users getting stuck)
    healthReport.bottlenecks.forEach(bottleneck => {
      if (bottleneck.exitRate > 50 || bottleneck.gateFailureRate > 30) {
        issues.push(this.createBottleneckIssue(bottleneck));
      }
    });

    // 3. Check for error spikes
    const recentErrors = wizardHealthMonitor.getRecentErrors(50);
    if (recentErrors.length > 10) {
      issues.push(this.createErrorSpikeIssue(recentErrors.length));
    }

    // Determine overall status
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    
    let status: AgentReport['status'] = 'healthy';
    if (criticalCount > 0) status = 'critical';
    else if (highCount > 0) status = 'warning';

    // Create report
    const report: AgentReport = {
      timestamp: Date.now(),
      status,
      issues,
      metricsSnapshot: {
        totalSessions: 0, // TODO: Track unique sessions
        errorRate: recentErrors.length,
        avgCompletionTime: 0, // TODO: Calculate from metrics
        bottlenecks: healthReport.bottlenecks,
      },
    };

    this.reports.push(report);
    this.pruneReports();

    // Log issues
    if (issues.length > 0) {
      console.warn(`🤖 [Wizard AI Agent] Found ${issues.length} issue(s):`, issues);
      
      // Auto-fix if available
      issues.forEach(issue => {
        if (issue.autoFixAvailable) {
          console.log(`🔧 [Wizard AI Agent] Auto-fix available for: ${issue.title}`);
          // TODO: Implement auto-fix logic
        }
      });
    } else {
      console.log('✅ [Wizard AI Agent] All systems healthy');
    }
  }

  /**
   * Create issue for dual validation system detection
   */
  private createDualValidationIssue(mismatches: ValidationMismatch[]): Issue {
    const latestMismatch = mismatches[0];
    
    return {
      id: `dual-validation-${Date.now()}`,
      severity: 'critical',
      type: 'dual_validation',
      title: 'Dual Validation System Detected',
      description: `Multiple gate validation systems are disagreeing on step "${latestMismatch.step}". ` +
        `This causes inconsistent "Next" button behavior. Found ${mismatches.length} mismatch(es).`,
      suggestedFix: `Consolidate to single validation system:
        1. Remove stepCanProceed() from useWizardV7.ts
        2. Use ONLY wizardStepGates.ts for all gate checks
        3. Update WizardV7Page.tsx to use gates.canGoIndustry from wizardStepGates`,
      autoFixAvailable: false, // Would require code generation
      timestamp: Date.now(),
    };
  }

  /**
   * Create issue for user bottlenecks
   */
  private createBottleneckIssue(bottleneck: WizardBottleneck): Issue {
    const severity = bottleneck.exitRate > 70 ? 'critical' : 'high';
    
    return {
      id: `bottleneck-${bottleneck.step}-${Date.now()}`,
      severity,
      type: 'bottleneck',
      title: `High Exit Rate on Step: ${bottleneck.step}`,
      description: `${bottleneck.exitRate}% of users are leaving at "${bottleneck.step}". ` +
        `Gate failure rate: ${bottleneck.gateFailureRate}%. ` +
        `Common errors: ${bottleneck.commonErrors.join(', ') || 'None'}`,
      suggestedFix: bottleneck.gateFailureRate > 30
        ? `Gate validation may be too strict. Check if required fields are properly marked as optional.`
        : `Users may be confused by UI/UX. Consider adding help text or simplifying inputs.`,
      autoFixAvailable: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Create issue for error spike
   */
  private createErrorSpikeIssue(errorCount: number): Issue {
    return {
      id: `error-spike-${Date.now()}`,
      severity: errorCount > 20 ? 'critical' : 'high',
      type: 'error_spike',
      title: 'Elevated Error Rate',
      description: `${errorCount} errors detected in last 50 metrics. This may indicate a breaking change.`,
      suggestedFix: 'Review recent errors in wizardHealthMonitor.getRecentErrors() and check for patterns.',
      autoFixAvailable: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Get latest report
   */
  getLatestReport(): AgentReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  /**
   * Get all reports
   */
  getAllReports(): AgentReport[] {
    return [...this.reports];
  }

  /**
   * Get issues by severity
   */
  getIssuesBySeverity(severity: Issue['severity']): Issue[] {
    const latest = this.getLatestReport();
    return latest ? latest.issues.filter(i => i.severity === severity) : [];
  }

  /**
   * Generate human-readable summary
   */
  getSummary(): string {
    const latest = this.getLatestReport();
    if (!latest) return 'No health data available yet.';

    const { status, issues, metricsSnapshot } = latest;
    
    let summary = `Wizard Health: ${status.toUpperCase()}\n\n`;
    
    if (issues.length === 0) {
      summary += '✅ All systems operational\n';
    } else {
      summary += `🚨 ${issues.length} issue(s) detected:\n`;
      issues.forEach((issue, i) => {
        summary += `\n${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}\n`;
        summary += `   ${issue.description}\n`;
        if (issue.suggestedFix) {
          summary += `   💡 Fix: ${issue.suggestedFix}\n`;
        }
      });
    }

    summary += `\n📊 Metrics:\n`;
    summary += `   - Error Rate: ${metricsSnapshot.errorRate} errors\n`;
    summary += `   - Bottlenecks: ${metricsSnapshot.bottlenecks.length} step(s)\n`;

    return summary;
  }

  /**
   * Prune old reports
   */
  private pruneReports() {
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }
  }
}

// Global singleton
export const wizardAIAgent = new WizardAIAgent();

// Export types
export type { Issue, AgentReport };
