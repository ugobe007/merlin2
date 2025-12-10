/**
 * SourceAttributionTooltip.tsx
 * 
 * Displays authoritative source information for quote line items.
 * Part of Merlin's Benchmark-Backed Quoting Strategy.
 * 
 * Design Philosophy:
 * - Every number should be traceable to a documented source
 * - Builds trust with customers and financiers
 * - Differentiates Merlin from competitors using opaque pricing
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import { Info, ExternalLink, BookOpen, Shield, FileText } from 'lucide-react';
import type { BenchmarkSourceAttribution } from '@/services/unifiedQuoteCalculator';

// ============================================================================
// TYPES
// ============================================================================

export interface SourceAttributionTooltipProps {
  /** The source attribution data */
  source: BenchmarkSourceAttribution;
  /** Position of tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Size of the trigger icon */
  iconSize?: 'sm' | 'md' | 'lg';
  /** Optional custom trigger element */
  trigger?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface SourceBadgeProps {
  /** Type of source for styling */
  sourceType: 'government' | 'industry' | 'academic' | 'standard' | 'manufacturer' | 'internal';
  /** Source name to display */
  name: string;
  /** Optional URL for the source */
  url?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

export interface QuoteAuditSectionProps {
  /** The benchmark audit data from a quote */
  benchmarkAudit: {
    methodology: string;
    methodologyVersion: string;
    sources: BenchmarkSourceAttribution[];
    calculatedAt: string;
    assumptions: string[];
    deviations?: string[];
  };
  /** Whether to show in expanded or collapsed state */
  defaultExpanded?: boolean;
}

// ============================================================================
// SOURCE TYPE CONFIGURATION
// ============================================================================

const SOURCE_TYPE_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  label: string;
}> = {
  government: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Shield,
    label: 'Government/DOE'
  },
  industry: {
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: FileText,
    label: 'Industry Standard'
  },
  academic: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: BookOpen,
    label: 'Academic/Research'
  },
  standard: {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Shield,
    label: 'Safety Standard'
  },
  manufacturer: {
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: FileText,
    label: 'Manufacturer Data'
  },
  internal: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: Info,
    label: 'Internal Estimate'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the source type based on the source name
 */
function getSourceType(sourceName: string): keyof typeof SOURCE_TYPE_CONFIG {
  const lowerName = sourceName.toLowerCase();
  
  if (lowerName.includes('nrel') || lowerName.includes('doe') || lowerName.includes('sandia') || 
      lowerName.includes('pnnl') || lowerName.includes('argonne') || lowerName.includes('eia')) {
    return 'government';
  }
  if (lowerName.includes('ul ') || lowerName.includes('nfpa') || lowerName.includes('ieee') ||
      lowerName.includes('astm') || lowerName.includes('iec')) {
    return 'standard';
  }
  if (lowerName.includes('bnef') || lowerName.includes('wood mackenzie') || 
      lowerName.includes('lazard') || lowerName.includes('seia')) {
    return 'industry';
  }
  if (lowerName.includes('university') || lowerName.includes('study') || 
      lowerName.includes('research')) {
    return 'academic';
  }
  if (lowerName.includes('catl') || lowerName.includes('byd') || lowerName.includes('tesla') ||
      lowerName.includes('fluence') || lowerName.includes('sungrow')) {
    return 'manufacturer';
  }
  
  return 'internal';
}

/**
 * Formats a date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

// ============================================================================
// SOURCE BADGE COMPONENT
// ============================================================================

/**
 * A small badge indicating the type and name of a source
 */
export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceType,
  name,
  url,
  size = 'sm'
}) => {
  const config = SOURCE_TYPE_CONFIG[sourceType] || SOURCE_TYPE_CONFIG.internal;
  const Icon = config.icon;
  
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';
  
  const Content = (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.color} ${config.borderColor} border
        ${sizeClasses}
        ${url ? 'hover:opacity-80 cursor-pointer' : ''}
      `}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {name}
      {url && <ExternalLink className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
    </span>
  );
  
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
        {Content}
      </a>
    );
  }
  
  return Content;
};

// ============================================================================
// SOURCE ATTRIBUTION TOOLTIP
// ============================================================================

/**
 * A tooltip that shows source attribution when hovering over an info icon
 */
export const SourceAttributionTooltip: React.FC<SourceAttributionTooltipProps> = ({
  source,
  position = 'top',
  iconSize = 'sm',
  trigger,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const sourceType = getSourceType(source.sourceName);
  const config = SOURCE_TYPE_CONFIG[sourceType];
  
  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  // Calculate tooltip position
  useEffect(() => {
    if (isOpen && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 8;
          break;
      }
      
      // Keep within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));
      
      setTooltipPosition({ top, left });
    }
  }, [isOpen, position]);
  
  return (
    <div className={`inline-block relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={`
          inline-flex items-center justify-center rounded-full
          ${config.color} hover:${config.bgColor}
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
        `}
        aria-label={`Source: ${source.sourceName}`}
      >
        {trigger || <Info className={iconSizeClasses[iconSize]} />}
      </button>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-72 p-3 bg-white rounded-lg shadow-lg border border-gray-200"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          role="tooltip"
        >
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className={`p-1.5 rounded ${config.bgColor}`}>
              <config.icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm leading-tight">
                {source.sourceName}
              </div>
              <div className="text-xs text-gray-500">{config.label}</div>
            </div>
          </div>
          
          {/* Details */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Metric:</span>
              <span className="text-gray-900 font-medium">{source.metric}</span>
            </div>
            {source.citation && (
              <div className="text-gray-600 italic border-l-2 border-gray-200 pl-2">
                "{source.citation}"
              </div>
            )}
            {source.dateAccessed && (
              <div className="flex justify-between">
                <span className="text-gray-500">Accessed:</span>
                <span className="text-gray-700">{formatDate(source.dateAccessed)}</span>
              </div>
            )}
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 mt-2"
              >
                View Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          
          {/* Arrow */}
          <div 
            className={`
              absolute w-2 h-2 bg-white border-gray-200 transform rotate-45
              ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' : ''}
              ${position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' : ''}
              ${position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
              ${position === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// QUOTE AUDIT SECTION
// ============================================================================

/**
 * A collapsible section showing the full audit trail for a quote
 */
export const QuoteAuditSection: React.FC<QuoteAuditSectionProps> = ({
  benchmarkAudit,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <div className="font-medium text-gray-900">Source Attribution & Methodology</div>
            <div className="text-sm text-gray-500">
              {benchmarkAudit.sources.length} verified sources • {benchmarkAudit.methodology}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Methodology Info */}
          <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="font-medium text-blue-900">
                {benchmarkAudit.methodology} v{benchmarkAudit.methodologyVersion}
              </div>
              <div className="text-sm text-blue-700">
                Calculated: {formatDate(benchmarkAudit.calculatedAt)}
              </div>
            </div>
          </div>
          
          {/* Sources Grid */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Sources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {benchmarkAudit.sources.map((source, index) => {
                const sourceType = getSourceType(source.sourceName);
                return (
                  <div 
                    key={index}
                    className="p-2 border border-gray-100 rounded bg-gray-50 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <SourceBadge 
                        sourceType={sourceType} 
                        name={source.sourceName.split(' ')[0]} 
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-600 truncate">{source.metric}</div>
                        {source.url && (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Assumptions */}
          {benchmarkAudit.assumptions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Key Assumptions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {benchmarkAudit.assumptions.map((assumption, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Deviations */}
          {benchmarkAudit.deviations && benchmarkAudit.deviations.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Methodology Deviations</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {benchmarkAudit.deviations.map((deviation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500">⚠</span>
                    {deviation}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Trust Statement */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              All calculations follow{' '}
              <a 
                href="https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                NREL ATB 2024
              </a>{' '}
              methodology for transparency and reproducibility.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SourceAttributionTooltip;
