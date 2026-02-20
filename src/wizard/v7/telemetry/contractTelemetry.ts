/**
 * CONTRACT TELEMETRY — V7 SSOT Observability
 * ===========================================
 * 
 * Purpose: Track contract execution health in production
 * Privacy: NO PII, NO addresses, NO customer data
 * 
 * Events tracked:
 * - v7_contract_run_started
 * - v7_contract_validation_failed
 * - v7_contract_run_succeeded
 * - v7_contract_run_failed
 * - v7_contract_warning_emitted
 * 
 * Created: January 26, 2026
 */

import { devInfo, devWarn } from '../debug/devLog';

export interface ContractTelemetryEvent {
  event: 
    | 'v7_contract_run_started'
    | 'v7_contract_validation_failed'
    | 'v7_contract_run_succeeded'
    | 'v7_contract_run_failed'
    | 'v7_contract_warning_emitted';
  
  sessionId: string;
  timestamp: string;
  
  // Context (no PII)
  industry: string;
  templateVersion?: string;
  calculatorId?: string;
  questionCount?: number;
  
  // Input quality
  missingInputs?: string[];
  
  // Output quality
  warningsCount?: number;
  assumptionsCount?: number;
  
  // Results (rounded for privacy)
  baseLoadKW?: number;
  peakLoadKW?: number;
  energyKWhPerDay?: number;
  
  // Performance
  durationMs?: number;
  
  // Errors (normalized, no stack traces)
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Generate session ID (random UUID per contract run)
 */
export function generateSessionId(): string {
  return `v7-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Send telemetry event (fire-and-forget)
 * - Best-effort delivery
 * - Never blocks UI
 * - Falls back to console in dev
 */
export async function sendContractTelemetry(event: ContractTelemetryEvent): Promise<void> {
  try {
    // Development: log to console
    if (import.meta.env.DEV) {
      devInfo(`[V7 Telemetry] ${event.event}`, event);
      return;
    }

    // Production: send to backend (fire-and-forget)
    // Use relative URL (same-origin) - Fly.io routes /api/* to backend
    const endpoint = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || '';
    
    fetch(`${endpoint}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      // Fire-and-forget: don't wait for response
      keepalive: true,
    }).catch((err) => {
      // Silently fail (telemetry should never break user experience)
      if (import.meta.env.DEV) {
        devWarn('[V7 Telemetry] Failed to send:', err.message);
      }
    });
  } catch (_err) {
    // Swallow all errors (telemetry is best-effort)
  }
}

/**
 * Structured logger for contract runs
 * - Wraps execution with start/end events
 * - Captures timing
 * - Normalizes errors
 */
export class ContractRunLogger {
  private sessionId: string;
  private startTime: number;
  private industry: string;
  private templateVersion?: string;
  private calculatorId?: string;
  
  constructor(
    industry: string,
    templateVersion?: string,
    calculatorId?: string,
  ) {
    this.industry = industry;
    this.templateVersion = templateVersion;
    this.calculatorId = calculatorId;
    this.sessionId = generateSessionId();
    this.startTime = Date.now();
  }

  async logStart(questionCount: number): Promise<void> {
    await sendContractTelemetry({
      event: 'v7_contract_run_started',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      industry: this.industry,
      templateVersion: this.templateVersion,
      calculatorId: this.calculatorId,
      questionCount,
    });
  }

  async logValidationFailed(issues: string[]): Promise<void> {
    await sendContractTelemetry({
      event: 'v7_contract_validation_failed',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      industry: this.industry,
      templateVersion: this.templateVersion,
      calculatorId: this.calculatorId,
      durationMs: Date.now() - this.startTime,
      errorCode: 'VALIDATION',
      errorMessage: issues.slice(0, 3).join(' | '), // First 3 issues only
    });
  }

  async logSuccess(result: {
    baseLoadKW?: number;
    peakLoadKW?: number;
    energyKWhPerDay?: number;
    warningsCount: number;
    assumptionsCount: number;
    missingInputs?: string[];
  }): Promise<void> {
    await sendContractTelemetry({
      event: 'v7_contract_run_succeeded',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      industry: this.industry,
      templateVersion: this.templateVersion,
      calculatorId: this.calculatorId,
      durationMs: Date.now() - this.startTime,
      
      // Round values for privacy
      baseLoadKW: result.baseLoadKW ? Math.round(result.baseLoadKW) : undefined,
      peakLoadKW: result.peakLoadKW ? Math.round(result.peakLoadKW) : undefined,
      energyKWhPerDay: result.energyKWhPerDay ? Math.round(result.energyKWhPerDay) : undefined,
      
      warningsCount: result.warningsCount,
      assumptionsCount: result.assumptionsCount,
      missingInputs: result.missingInputs,
    });
  }

  async logFailure(error: { code?: string; message?: string }): Promise<void> {
    await sendContractTelemetry({
      event: 'v7_contract_run_failed',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      industry: this.industry,
      templateVersion: this.templateVersion,
      calculatorId: this.calculatorId,
      durationMs: Date.now() - this.startTime,
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message || 'Contract execution failed',
    });
  }

  async logWarnings(warnings: string[]): Promise<void> {
    if (warnings.length === 0) return;
    
    await sendContractTelemetry({
      event: 'v7_contract_warning_emitted',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      industry: this.industry,
      templateVersion: this.templateVersion,
      calculatorId: this.calculatorId,
      warningsCount: warnings.length,
      // Don't send full warning text (may contain sensitive values)
    });
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
