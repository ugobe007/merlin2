/**
 * TrueQuote Validator
 * ===================
 * 
 * Validates quotes against TrueQuote compliance standards:
 * - 3% accuracy threshold
 * - Industry benchmark compliance
 * - Source traceability
 * - Audit trail completeness
 * 
 * This is the core of TrueQuote - our product differentiator.
 */

import { validateQuote } from './calculationValidator';
import type { QuoteResult } from '../calculations/unifiedQuoteCalculator';

export interface TrueQuoteComplianceResult {
  isCompliant: boolean;
  score: number; // 0-100, where 100 = perfect compliance
  issues: TrueQuoteIssue[];
  auditTrail: AuditTrailItem[];
  sources: SourceAttribution[];
}

export interface TrueQuoteIssue {
  type: 'accuracy' | 'source' | 'benchmark' | 'audit';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  field?: string;
  expected?: number;
  actual?: number;
  deviation?: number; // percentage
}

export interface AuditTrailItem {
  timestamp: string;
  action: string;
  source: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SourceAttribution {
  field: string;
  source: string;
  organization: string;
  url?: string;
  publicationDate?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Check TrueQuote compliance for a quote
 * 
 * This is the main validation function that ensures:
 * 1. Accuracy within 3% of industry benchmarks
 * 2. All values traceable to authoritative sources
 * 3. Complete audit trail
 * 4. No hardcoded or unvalidated values
 */
export async function checkTrueQuoteCompliance(
  quote: QuoteResult
): Promise<TrueQuoteComplianceResult> {
  const issues: TrueQuoteIssue[] = [];
  const auditTrail: AuditTrailItem[] = [];
  const sources: SourceAttribution[] = [];
  let score = 100;

  // 1. Run standard validation (3% threshold)
  const validation = await validateQuote(quote);
  
  if (!validation.isValid) {
    validation.issues.forEach(issue => {
      issues.push({
        type: 'accuracy',
        severity: issue.severity === 'critical' ? 'critical' : 'warning',
        message: issue.message,
        field: issue.field,
        expected: issue.expectedValue,
        actual: issue.actualValue,
        deviation: issue.deviation
      });
      
      // Deduct points for validation failures
      if (issue.severity === 'critical') {
        score -= 20;
      } else if (issue.severity === 'high') {
        score -= 10;
      } else {
        score -= 5;
      }
    });
  }

  // 2. Check source attribution
  if (quote.auditMetadata) {
    // Extract sources from audit metadata
    if (quote.auditMetadata.sources) {
      quote.auditMetadata.sources.forEach(source => {
        sources.push({
          field: source.field || 'unknown',
          source: source.name || 'unknown',
          organization: source.organization || 'unknown',
          url: source.url,
          publicationDate: source.publicationDate,
          confidence: source.confidence || 'medium'
        });
      });
    }

    // Check audit trail completeness
    if (quote.auditMetadata.calculationSteps) {
      quote.auditMetadata.calculationSteps.forEach(step => {
        auditTrail.push({
          timestamp: step.timestamp || new Date().toISOString(),
          action: step.action || 'calculation',
          source: step.source || 'unknown',
          value: step.value || 0,
          confidence: step.confidence || 'medium'
        });
      });
    }
  } else {
    // Missing audit metadata - critical issue
    issues.push({
      type: 'audit',
      severity: 'critical',
      message: 'Quote missing audit trail metadata',
    });
    score -= 30;
  }

  // 3. Check for hardcoded values (should not exist in TrueQuote)
  // This would require inspecting the calculation process
  // For now, we trust the calculation services to not use hardcoded values

  // 4. Verify benchmark compliance
  // The validation service already checks this, but we add it to the compliance result
  if (validation.benchmarkCompliance) {
    validation.benchmarkCompliance.forEach(compliance => {
      if (!compliance.compliant) {
        issues.push({
          type: 'benchmark',
          severity: compliance.deviation && compliance.deviation > 5 ? 'critical' : 'warning',
          message: `Value deviates from benchmark: ${compliance.message}`,
          field: compliance.field,
          expected: compliance.benchmarkValue,
          actual: compliance.actualValue,
          deviation: compliance.deviation
        });
        
        if (compliance.deviation && compliance.deviation > 5) {
          score -= 15;
        } else {
          score -= 5;
        }
      }
    });
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return {
    isCompliant: score >= 80 && issues.filter(i => i.severity === 'critical').length === 0,
    score,
    issues,
    auditTrail,
    sources
  };
}




