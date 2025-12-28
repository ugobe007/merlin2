/**
 * Validation Module - TrueQuote Export
 * =====================================
 * 
 * Exports all validation functions for TrueQuote compliance.
 */

export {
  validateQuote,
  type ValidationResult,
  type ValidationIssue
} from './calculationValidator';

export {
  checkTrueQuoteCompliance,
  type TrueQuoteComplianceResult,
  type TrueQuoteIssue,
  type AuditTrailItem,
  type SourceAttribution
} from './trueQuoteValidator';

export {
  AUTHORITATIVE_SOURCES,
  PRICING_BENCHMARKS,
  METHODOLOGY_REFERENCES,
  getSourceAttribution,
  generateQuoteAuditMetadata,
  type QuoteAuditMetadata,
  type BenchmarkSource
} from './benchmarkSources';

