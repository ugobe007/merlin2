/**
 * SSOT Runtime Validation
 * =======================
 * 
 * Production-safe validation for wizard state and calculations.
 * Logs violations without crashing the app.
 * 
 * Usage in components:
 * ```typescript
 * import { validateSSoT } from '@/utils/ssotValidation';
 * 
 * // In any component that reads calculations:
 * if (state.calculations) {
 *   validateSSoT.calculationsStructure(state.calculations, 'Step6Quote');
 * }
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SSOTViolation {
  type: 'flat_read' | 'derived_in_step3' | 'rogue_calculation' | 'missing_field' | 'invalid_structure';
  location: string;
  message: string;
  expected: string;
  received: string;
  timestamp: number;
  severity: 'warning' | 'error';
}

// ============================================================================
// VIOLATION LOGGER
// ============================================================================

const MAX_VIOLATIONS_LOG = 100;
const violationLog: SSOTViolation[] = [];

function logViolation(violation: SSOTViolation): void {
  // Add to in-memory log
  violationLog.push(violation);
  if (violationLog.length > MAX_VIOLATIONS_LOG) {
    violationLog.shift(); // Remove oldest
  }
  
  // Console output
  const prefix = violation.severity === 'error' ? '❌ SSOT ERROR' : '⚠️ SSOT WARNING';
  console.warn(
    `${prefix} [${violation.type}] in ${violation.location}:\n` +
    `  Message: ${violation.message}\n` +
    `  Expected: ${violation.expected}\n` +
    `  Received: ${violation.received}`
  );
  
  // In production, could send to Sentry/error tracking
  if (typeof window !== 'undefined' && (window as unknown as { Sentry?: { captureMessage: (msg: string, level: string) => void } }).Sentry) {
    (window as unknown as { Sentry: { captureMessage: (msg: string, level: string) => void } }).Sentry.captureMessage(
      `SSOT Violation: ${violation.type} in ${violation.location}`,
      violation.severity
    );
  }
}

// ============================================================================
// VALIDATORS
// ============================================================================

export const validateSSoT = {
  /**
   * Validate calculations has correct nested structure
   */
  calculationsStructure(
    calculations: unknown,
    location: string
  ): boolean {
    if (!calculations || typeof calculations !== 'object') {
      logViolation({
        type: 'invalid_structure',
        location,
        message: 'Calculations is null or not an object',
        expected: '{ base: {...}, selected: {...} }',
        received: String(calculations),
        timestamp: Date.now(),
        severity: 'error',
      });
      return false;
    }
    
    const calc = calculations as Record<string, unknown>;
    
    // Check for flat structure (legacy bug)
    if ('bessKW' in calc && !('selected' in calc)) {
      logViolation({
        type: 'flat_read',
        location,
        message: 'Calculations has flat structure instead of nested { base, selected }',
        expected: 'calculations.selected.bessKW',
        received: 'calculations.bessKW (flat)',
        timestamp: Date.now(),
        severity: 'error',
      });
      return false;
    }
    
    // Validate nested structure exists
    if (!('base' in calc) || !('selected' in calc)) {
      logViolation({
        type: 'missing_field',
        location,
        message: 'Calculations missing base or selected',
        expected: '{ base: {...}, selected: {...} }',
        received: JSON.stringify(Object.keys(calc)),
        timestamp: Date.now(),
        severity: 'error',
      });
      return false;
    }
    
    return true;
  },
  
  /**
   * Validate useCaseData has no derived fields (Step 3 contract)
   */
  step3NoDerivations(
    useCaseData: unknown,
    location: string
  ): boolean {
    if (!useCaseData || typeof useCaseData !== 'object') return true;
    
    const data = useCaseData as Record<string, unknown>;
    const derivedFields = ['estimatedAnnualKwh', 'peakDemandKw', 'annualConsumptionKWh', 'peakDemandKW'];
    const found = derivedFields.filter(f => f in data);
    
    if (found.length > 0) {
      logViolation({
        type: 'derived_in_step3',
        location,
        message: `Derived fields found in useCaseData: ${found.join(', ')}`,
        expected: 'Only raw inputs in useCaseData',
        received: `Found: ${found.join(', ')}`,
        timestamp: Date.now(),
        severity: 'warning',
      });
      return false;
    }
    
    return true;
  },
  
  /**
   * Validate a component isn't doing rogue calculations
   */
  noLocalCalculations(
    value: unknown,
    fieldName: string,
    location: string
  ): boolean {
    // Check for NaN or Infinity (common signs of rogue calculation bugs)
    if (typeof value === 'number' && (Number.isNaN(value) || !Number.isFinite(value))) {
      logViolation({
        type: 'rogue_calculation',
        location,
        message: `${fieldName} has invalid value (likely rogue calculation)`,
        expected: 'Valid number from SSOT',
        received: String(value),
        timestamp: Date.now(),
        severity: 'error',
      });
      return false;
    }
    
    return true;
  },
  
  /**
   * Get violation log for debugging
   */
  getViolationLog(): SSOTViolation[] {
    return [...violationLog];
  },
  
  /**
   * Clear violation log
   */
  clearViolationLog(): void {
    violationLog.length = 0;
  },
  
  /**
   * Check if there are any errors (not warnings)
   */
  hasErrors(): boolean {
    return violationLog.some(v => v.severity === 'error');
  },
};

// ============================================================================
// REACT HOOK FOR COMPONENT VALIDATION
// ============================================================================

import { useEffect } from 'react';

/**
 * Hook to validate SSOT compliance when calculations change
 */
export function useSSOTValidation(
  calculations: unknown,
  componentName: string
): void {
  useEffect(() => {
    if (calculations) {
      validateSSoT.calculationsStructure(calculations, componentName);
    }
  }, [calculations, componentName]);
}

// ============================================================================
// DEV TOOLS
// ============================================================================

// Expose to window in development for debugging
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as unknown as { __SSOT_VALIDATION__: typeof validateSSoT }).__SSOT_VALIDATION__ = validateSSoT;
}
