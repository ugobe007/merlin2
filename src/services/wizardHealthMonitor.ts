/**
 * Wizard Health Monitor - Tracks wizard state, errors, and validation issues
 * 
 * Purpose: Real-time monitoring of wizard flow to detect issues before they break production
 * - Gate validation consistency checks
 * - User flow bottlenecks (where users get stuck)
 * - Error patterns and frequency
 * - Performance metrics (step load times)
 */

interface WizardHealthMetric {
  timestamp: number;
  step: string;
  event: 'step_enter' | 'step_exit' | 'gate_check' | 'error' | 'validation_mismatch';
  data: Record<string, unknown>;
  sessionId: string;
}

interface ValidationMismatch {
  timestamp: number;
  step: string;
  gateSystem1: { canProceed: boolean; reason?: string };
  gateSystem2: { canProceed: boolean; reason?: string };
  state: Record<string, unknown>;
}

interface WizardError {
  timestamp: number;
  step: string;
  error: string;
  stack?: string;
  state: Record<string, unknown>;
  sessionId: string;
}

interface WizardBottleneck {
  step: string;
  avgTimeSpent: number; // seconds
  exitRate: number; // % of users who leave from this step
  gateFailureRate: number; // % of attempts to proceed that fail
  commonErrors: string[];
}

class WizardHealthMonitor {
  private metrics: WizardHealthMetric[] = [];
  private validationMismatches: ValidationMismatch[] = [];
  private errors: WizardError[] = [];
  private maxHistorySize = 1000; // Keep last 1000 metrics
  private enabled = true;

  /**
   * Track a wizard event (step enter/exit, gate check, etc.)
   */
  track(event: WizardHealthMetric['event'], step: string, data: Record<string, unknown>, sessionId: string) {
    if (!this.enabled) return;

    const metric: WizardHealthMetric = {
      timestamp: Date.now(),
      step,
      event,
      data,
      sessionId,
    };

    this.metrics.push(metric);
    this.pruneHistory();

    // Auto-detect issues
    if (event === 'gate_check') {
      this.detectValidationMismatches(metric);
    }
  }

  /**
   * Log an error in the wizard
   */
  trackError(step: string, error: Error | string, state: Record<string, unknown>, sessionId: string) {
    if (!this.enabled) return;

    const errorLog: WizardError = {
      timestamp: Date.now(),
      step,
      error: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      state,
      sessionId,
    };

    this.errors.push(errorLog);
    this.pruneHistory();
  }

  /**
   * Detect when multiple gate validation systems disagree
   * This is the dual-validation bug we just fixed!
   */
  private detectValidationMismatches(metric: WizardHealthMetric) {
    const data = metric.data;
    
    // Check if we have results from multiple gate systems
    if ('gateSystem1' in data && 'gateSystem2' in data) {
      const g1 = data.gateSystem1 as { canProceed: boolean; reason?: string };
      const g2 = data.gateSystem2 as { canProceed: boolean; reason?: string };

      if (g1.canProceed !== g2.canProceed) {
        console.warn('🚨 [Wizard Health] VALIDATION MISMATCH DETECTED:', {
          step: metric.step,
          gateSystem1: g1,
          gateSystem2: g2,
          state: data.state,
        });

        this.validationMismatches.push({
          timestamp: metric.timestamp,
          step: metric.step,
          gateSystem1: g1,
          gateSystem2: g2,
          state: (data.state as Record<string, unknown>) || {},
        });
      }
    }
  }

  /**
   * Analyze bottlenecks - where are users getting stuck?
   */
  getBottlenecks(): WizardBottleneck[] {
    const stepMetrics = new Map<string, {
      enters: number;
      exits: number;
      timeSpent: number[];
      gateFailures: number;
      gateAttempts: number;
      errors: string[];
    }>();

    // Group metrics by step
    this.metrics.forEach(metric => {
      if (!stepMetrics.has(metric.step)) {
        stepMetrics.set(metric.step, {
          enters: 0,
          exits: 0,
          timeSpent: [],
          gateFailures: 0,
          gateAttempts: 0,
          errors: [],
        });
      }

      const stats = stepMetrics.get(metric.step)!;

      if (metric.event === 'step_enter') stats.enters++;
      if (metric.event === 'step_exit') {
        stats.exits++;
        if (typeof metric.data.duration === 'number') {
          stats.timeSpent.push(metric.data.duration);
        }
      }
      if (metric.event === 'gate_check') {
        stats.gateAttempts++;
        if (metric.data.canProceed === false) {
          stats.gateFailures++;
        }
      }
    });

    // Correlate errors by step
    this.errors.forEach(error => {
      const stats = stepMetrics.get(error.step);
      if (stats) {
        stats.errors.push(error.error);
      }
    });

    // Calculate bottleneck metrics
    const bottlenecks: WizardBottleneck[] = [];
    stepMetrics.forEach((stats, step) => {
      const avgTime = stats.timeSpent.length > 0
        ? stats.timeSpent.reduce((a, b) => a + b, 0) / stats.timeSpent.length
        : 0;

      const exitRate = stats.enters > 0 ? (stats.enters - stats.exits) / stats.enters : 0;
      const gateFailureRate = stats.gateAttempts > 0 ? stats.gateFailures / stats.gateAttempts : 0;

      // Count error frequency
      const errorCounts = stats.errors.reduce((acc, err) => {
        acc[err] = (acc[err] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonErrors = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([err]) => err);

      bottlenecks.push({
        step,
        avgTimeSpent: Math.round(avgTime / 1000), // Convert ms to seconds
        exitRate: Math.round(exitRate * 100),
        gateFailureRate: Math.round(gateFailureRate * 100),
        commonErrors,
      });
    });

    return bottlenecks.sort((a, b) => b.exitRate - a.exitRate);
  }

  /**
   * Get validation mismatches (dual gate system bugs)
   */
  getValidationMismatches(): ValidationMismatch[] {
    return [...this.validationMismatches].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 50): WizardError[] {
    return [...this.errors]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Generate health report
   */
  getHealthReport() {
    const bottlenecks = this.getBottlenecks();
    const mismatches = this.getValidationMismatches();
    const recentErrors = this.getRecentErrors(10);

    const highPriorityIssues: string[] = [];

    // Detect critical issues
    if (mismatches.length > 0) {
      highPriorityIssues.push(`🚨 ${mismatches.length} validation mismatches detected (dual gate system bug)`);
    }

    bottlenecks.forEach(b => {
      if (b.exitRate > 50) {
        highPriorityIssues.push(`⚠️ Step "${b.step}" has ${b.exitRate}% exit rate (users getting stuck)`);
      }
      if (b.gateFailureRate > 30) {
        highPriorityIssues.push(`⚠️ Step "${b.step}" has ${b.gateFailureRate}% gate failure rate`);
      }
    });

    return {
      status: highPriorityIssues.length > 0 ? 'unhealthy' : 'healthy',
      issues: highPriorityIssues,
      bottlenecks,
      validationMismatches: mismatches.length,
      totalErrors: this.errors.length,
      recentErrors: recentErrors.map(e => ({
        step: e.step,
        error: e.error,
        timestamp: new Date(e.timestamp).toISOString(),
      })),
    };
  }

  /**
   * Clear all history (useful for testing)
   */
  clear() {
    this.metrics = [];
    this.validationMismatches = [];
    this.errors = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Prune old data to prevent memory leaks
   */
  private pruneHistory() {
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics = this.metrics.slice(-this.maxHistorySize);
    }
    if (this.errors.length > this.maxHistorySize) {
      this.errors = this.errors.slice(-this.maxHistorySize);
    }
    if (this.validationMismatches.length > this.maxHistorySize) {
      this.validationMismatches = this.validationMismatches.slice(-this.maxHistorySize);
    }
  }
}

// Global singleton
export const wizardHealthMonitor = new WizardHealthMonitor();

// Export types
export type {
  WizardHealthMetric,
  ValidationMismatch,
  WizardError,
  WizardBottleneck,
};
