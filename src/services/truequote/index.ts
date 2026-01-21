/**
 * TrueQuote™ Service Index
 * =========================
 * Central export point for all TrueQuote services.
 * 
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

// Sizing Engine
export {
  computeTrueQuoteSizing,
  getSizingBandDescription,
  shouldShowEstimate,
  type TrueQuoteSizing,
  type SizingOverrides,
  type SizingInputs,
} from './sizingEngine';

// Load Curve Generator
export {
  buildLoadCurve,
  getAvailableIndustries,
  hasCustomProfile,
  getProfileDescription,
  type LoadCurve,
  type LoadCurvePoint,
  type LoadCurveInputs,
} from './loadCurve';
