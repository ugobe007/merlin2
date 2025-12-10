/**
 * QuoteLineItemWithSource.tsx
 * 
 * A quote line item component that displays source attribution.
 * Used in quote results to show transparent, verifiable pricing.
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import React from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SourceAttributionTooltip, SourceBadge } from './SourceAttributionTooltip';
import type { BenchmarkSource } from '@/services/benchmarkSources';

// Re-export for convenience
export type BenchmarkSourceAttribution = BenchmarkSource;

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteLineItemWithSourceProps {
  /** Label for the line item */
  label: string;
  /** The value to display (formatted string or number) */
  value: string | number;
  /** Optional unit (e.g., '$', 'kWh', '%') */
  unit?: string;
  /** Position of unit relative to value */
  unitPosition?: 'before' | 'after';
  /** Source attribution for this line item */
  source?: BenchmarkSourceAttribution;
  /** Whether this is a subtotal/total row */
  isTotal?: boolean;
  /** Whether this is a credit/deduction (negative value) */
  isCredit?: boolean;
  /** Comparison to market benchmark (percentage difference) */
  marketComparison?: number;
  /** Additional description text */
  description?: string;
  /** CSS class for custom styling */
  className?: string;
}

export interface QuoteSectionProps {
  /** Section title */
  title: string;
  /** Section subtitle or description */
  subtitle?: string;
  /** Line items in this section */
  items: QuoteLineItemWithSourceProps[];
  /** Section total */
  total?: {
    label: string;
    value: string | number;
    unit?: string;
    source?: BenchmarkSourceAttribution;
  };
  /** Whether section is collapsible */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formats a number for display
 */
function formatValue(value: string | number, unit?: string, unitPosition: 'before' | 'after' = 'before'): string {
  if (typeof value === 'string') {
    return value;
  }
  
  const formattedNumber = value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: value < 10 ? 2 : 0
  });
  
  if (!unit) return formattedNumber;
  
  return unitPosition === 'before' 
    ? `${unit}${formattedNumber}` 
    : `${formattedNumber} ${unit}`;
}

/**
 * Returns color class based on market comparison
 */
function getComparisonColor(comparison: number): string {
  if (comparison < -5) return 'text-green-600';
  if (comparison > 5) return 'text-amber-600';
  return 'text-gray-500';
}

// ============================================================================
// QUOTE LINE ITEM COMPONENT
// ============================================================================

/**
 * A single line item in a quote with optional source attribution
 */
export const QuoteLineItemWithSource: React.FC<QuoteLineItemWithSourceProps> = ({
  label,
  value,
  unit = '$',
  unitPosition = 'before',
  source,
  isTotal = false,
  isCredit = false,
  marketComparison,
  description,
  className = ''
}) => {
  const displayValue = formatValue(value, unit, unitPosition);
  
  return (
    <div 
      className={`
        flex items-center justify-between py-2.5 
        ${isTotal ? 'border-t-2 border-gray-300 pt-3 mt-1' : 'border-b border-gray-100'}
        ${className}
      `}
    >
      {/* Left side: Label and source */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span 
          className={`
            ${isTotal ? 'font-semibold text-gray-900' : 'text-gray-700'}
            ${isCredit ? 'text-green-700' : ''}
          `}
        >
          {label}
        </span>
        
        {source && (
          <SourceAttributionTooltip 
            source={source} 
            iconSize="sm" 
            position="right"
          />
        )}
        
        {description && (
          <span className="text-xs text-gray-500 hidden sm:inline">
            ({description})
          </span>
        )}
      </div>
      
      {/* Right side: Value and market comparison */}
      <div className="flex items-center gap-3">
        {/* Market comparison indicator */}
        {marketComparison !== undefined && (
          <div 
            className={`
              flex items-center gap-1 text-xs 
              ${getComparisonColor(marketComparison)}
            `}
            title={`${Math.abs(marketComparison)}% ${marketComparison < 0 ? 'below' : 'above'} market average`}
          >
            {marketComparison < -2 && <TrendingDown className="w-3.5 h-3.5" />}
            {marketComparison > 2 && <TrendingUp className="w-3.5 h-3.5" />}
            {marketComparison >= -2 && marketComparison <= 2 && <Minus className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {Math.abs(marketComparison)}%
            </span>
          </div>
        )}
        
        {/* Value */}
        <span 
          className={`
            font-mono tabular-nums text-right min-w-[100px]
            ${isTotal ? 'text-lg font-bold text-gray-900' : 'font-medium'}
            ${isCredit ? 'text-green-600' : 'text-gray-900'}
          `}
        >
          {isCredit && typeof value === 'number' && value > 0 ? '-' : ''}
          {displayValue}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// QUOTE SECTION COMPONENT
// ============================================================================

/**
 * A section of a quote containing multiple line items
 */
export const QuoteSection: React.FC<QuoteSectionProps> = ({
  title,
  subtitle,
  items,
  total,
  collapsible = false,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div 
        className={`
          flex items-center justify-between px-4 py-3 bg-gray-50
          ${collapsible ? 'cursor-pointer hover:bg-gray-100' : ''}
        `}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        
        {collapsible && (
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      
      {/* Section Content */}
      {(!collapsible || isExpanded) && (
        <div className="px-4 py-2">
          {/* Line Items */}
          {items.map((item, index) => (
            <QuoteLineItemWithSource key={index} {...item} />
          ))}
          
          {/* Section Total */}
          {total && (
            <QuoteLineItemWithSource
              label={total.label}
              value={total.value}
              unit={total.unit}
              source={total.source}
              isTotal={true}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// QUOTE SUMMARY CARD
// ============================================================================

export interface QuoteSummaryCardProps {
  /** Total system cost */
  totalCost: number;
  /** Net cost after incentives */
  netCost: number;
  /** Federal ITC amount */
  itcAmount: number;
  /** Annual savings */
  annualSavings: number;
  /** Simple payback years */
  paybackYears: number;
  /** 25-year NPV */
  npv25Year: number;
  /** Sources for the summary metrics */
  sources?: {
    pricing?: BenchmarkSourceAttribution;
    itc?: BenchmarkSourceAttribution;
    savings?: BenchmarkSourceAttribution;
    payback?: BenchmarkSourceAttribution;
  };
}

export const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  totalCost,
  netCost,
  itcAmount,
  annualSavings,
  paybackYears,
  npv25Year,
  sources
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4 opacity-90">Quote Summary</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Total Cost */}
        <div className="col-span-2 bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/70 mb-1">Total System Cost</div>
              <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            </div>
            {sources?.pricing && (
              <SourceAttributionTooltip 
                source={sources.pricing}
                iconSize="md"
                position="left"
                trigger={<Info className="w-5 h-5 text-white/60 hover:text-white" />}
              />
            )}
          </div>
        </div>
        
        {/* ITC Credit */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
            Federal ITC (30%)
            {sources?.itc && (
              <SourceAttributionTooltip 
                source={sources.itc}
                iconSize="sm"
                position="top"
              />
            )}
          </div>
          <div className="text-lg font-semibold text-green-300">
            -${itcAmount.toLocaleString()}
          </div>
        </div>
        
        {/* Net Cost */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-white/70 mb-1">Net Cost</div>
          <div className="text-lg font-semibold">${netCost.toLocaleString()}</div>
        </div>
        
        {/* Annual Savings */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
            Annual Savings
            {sources?.savings && (
              <SourceAttributionTooltip 
                source={sources.savings}
                iconSize="sm"
                position="top"
              />
            )}
          </div>
          <div className="text-lg font-semibold text-green-300">
            ${annualSavings.toLocaleString()}
          </div>
        </div>
        
        {/* Payback */}
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs text-white/70 mb-1 flex items-center gap-1">
            Simple Payback
            {sources?.payback && (
              <SourceAttributionTooltip 
                source={sources.payback}
                iconSize="sm"
                position="top"
              />
            )}
          </div>
          <div className="text-lg font-semibold">
            {paybackYears.toFixed(1)} years
          </div>
        </div>
        
        {/* NPV */}
        <div className="col-span-2 bg-white/10 rounded-lg p-3 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/70 mb-1">25-Year Net Present Value</div>
              <div className="text-xl font-bold text-green-300">
                ${npv25Year.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/70 mb-1">ROI</div>
              <div className="text-lg font-semibold">
                {((npv25Year / netCost) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust Badge */}
      <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-xs text-white/60">
        <Info className="w-4 h-4" />
        All calculations verified against NREL ATB 2024 methodology
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default QuoteLineItemWithSource;
