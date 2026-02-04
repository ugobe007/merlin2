/**
 * DEV QA DEBUG PANEL - WIZARD QA INFRASTRUCTURE
 * ==============================================
 * 
 * Shows pricing invariants in a collapsible DEV-only panel.
 * Catches "looks right but isn't" bugs immediately.
 * 
 * ONLY RENDERS IN DEV MODE (import.meta.env.DEV)
 * 
 * @author Merlin QA Team
 * @date Feb 2026
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PricingInvariants {
  sellPriceTotal: number | undefined;
  totalInvestment: number | undefined;
  federalITC: number | undefined;
  stateIncentive: number;
  netInvestment: number | undefined;
  marginRender?: {
    sellPriceTotal?: number;
    needsHumanReview?: boolean;
    confidenceBadge?: { badge?: string; level?: string; message?: string };
  };
}

interface DevQADebugPanelProps {
  step: 'Step5' | 'Step6';
  tierName?: string;
  invariants: PricingInvariants;
}

// ============================================================================
// INVARIANT VALIDATORS
// ============================================================================

interface ValidationResult {
  passed: boolean;
  name: string;
  expected: string;
  actual: string;
  message: string;
}

function validatePricingInvariants(invariants: PricingInvariants): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // Get the effective sell price (marginRender takes precedence)
  const sell = invariants.marginRender?.sellPriceTotal ?? invariants.totalInvestment ?? 0;
  const itc = invariants.federalITC ?? 0;
  const state = invariants.stateIncentive ?? 0;
  const net = invariants.netInvestment ?? 0;
  
  // === INVARIANT 1: sell is finite and > 0 ===
  const sellValid = Number.isFinite(sell) && sell > 0;
  results.push({
    passed: sellValid,
    name: 'sell > 0',
    expected: '> 0 and finite',
    actual: `${sell}`,
    message: sellValid 
      ? `sellPriceTotal is ${sell.toLocaleString()}`
      : `sellPriceTotal is ${sell} (must be > 0 and finite)`
  });
  
  // === INVARIANT 2: netInvestment <= sell ===
  const netLessThanSell = net <= sell;
  results.push({
    passed: netLessThanSell,
    name: 'netInvestment ≤ sell',
    expected: `≤ ${sell.toLocaleString()}`,
    actual: `${net.toLocaleString()}`,
    message: netLessThanSell
      ? `Net ${net.toLocaleString()} ≤ Sell ${sell.toLocaleString()}`
      : `Net ${net.toLocaleString()} > Sell ${sell.toLocaleString()} (INVALID)`
  });
  
  // === INVARIANT 3: Net Cost = sell - ITC - state (within $1 tolerance) ===
  const expectedNet = sell - itc - state;
  const netDiff = Math.abs(expectedNet - net);
  const netMatches = netDiff < 1;
  results.push({
    passed: netMatches,
    name: 'Net = sell - ITC - state',
    expected: `${expectedNet.toLocaleString()} (±$1)`,
    actual: `${net.toLocaleString()}`,
    message: netMatches
      ? `Net calculation matches (diff: $${netDiff.toFixed(2)})`
      : `Net mismatch: expected ${expectedNet.toLocaleString()}, got ${net.toLocaleString()} (diff: $${netDiff.toFixed(2)})`
  });
  
  // === INVARIANT 4: ITC should be <= sell (tax credit can't exceed cost) ===
  const itcValid = itc <= sell;
  results.push({
    passed: itcValid,
    name: 'ITC ≤ sell',
    expected: `≤ ${sell.toLocaleString()}`,
    actual: `${itc.toLocaleString()}`,
    message: itcValid
      ? `ITC ${itc.toLocaleString()} ≤ Sell ${sell.toLocaleString()}`
      : `ITC ${itc.toLocaleString()} > Sell ${sell.toLocaleString()} (INVALID)`
  });
  
  // === INVARIANT 5: If marginRender exists, sellPriceTotal should be used ===
  if (invariants.marginRender) {
    const marginSell = invariants.marginRender.sellPriceTotal;
    const marginUsed = marginSell !== undefined && Number.isFinite(marginSell);
    results.push({
      passed: marginUsed,
      name: 'marginRender.sellPriceTotal present',
      expected: 'defined and finite',
      actual: `${marginSell}`,
      message: marginUsed
        ? `Using marginRender.sellPriceTotal: ${marginSell?.toLocaleString()}`
        : `marginRender exists but sellPriceTotal is ${marginSell}`
    });
  }
  
  return results;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DevQADebugPanel({ step, tierName, invariants }: DevQADebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only render in development
  if (!import.meta.env.DEV) {
    return null;
  }
  
  const validationResults = validatePricingInvariants(invariants);
  const allPassed = validationResults.every(r => r.passed);
  const failedCount = validationResults.filter(r => !r.passed).length;
  
  // Effective sell price
  const sell = invariants.marginRender?.sellPriceTotal ?? invariants.totalInvestment ?? 0;
  
  return (
    <div className={`
      mt-4 rounded-lg border text-xs font-mono
      ${allPassed 
        ? 'bg-emerald-950/30 border-emerald-500/30' 
        : 'bg-red-950/50 border-red-500/50'
      }
    `}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between p-3 
          hover:bg-white/5 transition-colors
        `}
      >
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span className={allPassed ? 'text-emerald-300' : 'text-red-300'}>
            DEV QA: {step} {tierName ? `(${tierName})` : ''}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] ${
            allPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {allPassed ? '✓ ALL PASS' : `✗ ${failedCount} FAIL`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/10">
          {/* Raw Values */}
          <div className="pt-3">
            <div className="text-slate-400 mb-2">Raw Values:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">marginRender.sellPriceTotal:</span>{' '}
                <span className="text-cyan-300">
                  {invariants.marginRender?.sellPriceTotal?.toLocaleString() ?? 'undefined'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">totalInvestment:</span>{' '}
                <span className="text-yellow-300">
                  {invariants.totalInvestment?.toLocaleString() ?? 'undefined'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">federalITC:</span>{' '}
                <span className="text-emerald-300">
                  {invariants.federalITC?.toLocaleString() ?? 'undefined'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">stateIncentive:</span>{' '}
                <span className="text-blue-300">
                  {invariants.stateIncentive?.toLocaleString() ?? '0'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">netInvestment:</span>{' '}
                <span className="text-purple-300">
                  {invariants.netInvestment?.toLocaleString() ?? 'undefined'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">effective sell:</span>{' '}
                <span className="text-white font-bold">
                  {sell.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Computed Check */}
          <div className="pt-2 border-t border-white/5">
            <div className="text-slate-400 mb-2">Net Cost Invariant:</div>
            <div className="bg-slate-900/50 p-2 rounded text-[11px]">
              <code className="text-slate-300">
                expectedNet = sell - itc - state
              </code>
              <br />
              <code className="text-slate-300">
                expectedNet = {sell.toLocaleString()} - {(invariants.federalITC ?? 0).toLocaleString()} - {invariants.stateIncentive.toLocaleString()}
              </code>
              <br />
              <code className="text-white font-bold">
                expectedNet = {(sell - (invariants.federalITC ?? 0) - invariants.stateIncentive).toLocaleString()}
              </code>
            </div>
          </div>
          
          {/* Validation Results */}
          <div className="pt-2 border-t border-white/5">
            <div className="text-slate-400 mb-2">Validation Results:</div>
            <div className="space-y-1">
              {validationResults.map((result, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-2 p-1.5 rounded ${
                    result.passed ? 'bg-emerald-500/10' : 'bg-red-500/20'
                  }`}
                >
                  {result.passed ? (
                    <span className="text-emerald-400">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                  <div className="flex-1">
                    <span className={result.passed ? 'text-emerald-300' : 'text-red-300'}>
                      {result.name}
                    </span>
                    <div className="text-slate-500 text-[10px]">
                      {result.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* marginRender details */}
          {invariants.marginRender && (
            <div className="pt-2 border-t border-white/5">
              <div className="text-slate-400 mb-2">marginRender Envelope:</div>
              <div className="text-[11px] space-y-1">
                <div>
                  <span className="text-slate-500">needsHumanReview:</span>{' '}
                  <span className={invariants.marginRender.needsHumanReview ? 'text-amber-400' : 'text-slate-300'}>
                    {String(invariants.marginRender.needsHumanReview ?? false)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">confidenceBadge:</span>{' '}
                  <span className="text-purple-300">
                    {invariants.marginRender.confidenceBadge?.badge ?? 'none'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RUNTIME ASSERT BANNER (for critical failures)
// ============================================================================

interface RuntimeAssertBannerProps {
  assertions: Array<{
    condition: boolean;
    message: string;
  }>;
}

export function RuntimeAssertBanner({ assertions }: RuntimeAssertBannerProps) {
  // Only render in development
  if (!import.meta.env.DEV) {
    return null;
  }
  
  const failures = assertions.filter(a => !a.condition);
  
  if (failures.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-4 p-4 bg-red-900/80 border-2 border-red-500 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-red-300" />
        <span className="text-red-100 font-bold text-sm">
          🚨 DEV RUNTIME ASSERT FAILURE
        </span>
      </div>
      <div className="space-y-1 text-sm text-red-200">
        {failures.map((f, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-red-400">✗</span>
            <span>{f.message}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-red-300/70">
        This banner only shows in DEV mode. Fix these before shipping.
      </div>
    </div>
  );
}

export default DevQADebugPanel;
