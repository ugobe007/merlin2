/**
 * IndustryComplianceBadges.tsx
 * 
 * Displays industry authority logos and compliance badges throughout Merlin.
 * Shows users that our calculations are aligned with NREL, DOE, Sandia, UL, and IEEE standards.
 * 
 * Part of Merlin's Benchmark-Backed Quoting Strategy - building trust through transparency.
 * 
 * Usage:
 * - <TrustBadgesInline /> - Compact horizontal strip for headers/footers
 * - <TrustBadgesGrid /> - Full grid for About pages and methodology sections
 * - <TrustBadgeTooltip /> - Single badge with hover explanation
 * - <MethodologyStatement /> - Full statement with badges
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import React, { useState } from 'react';
import { ExternalLink, Shield, CheckCircle2, Info, Award } from 'lucide-react';

// ============================================================================
// AUTHORITY SOURCE DATA
// ============================================================================

export interface AuthoritySource {
  id: string;
  name: string;
  fullName: string;
  logo: string; // SVG path or emoji fallback
  url: string;
  category: 'government' | 'standard' | 'industry' | 'academic';
  description: string;
  whatWeUse: string;
  color: string;
  bgColor: string;
}

export const AUTHORITY_SOURCES: AuthoritySource[] = [
  {
    id: 'nrel',
    name: 'NREL',
    fullName: 'National Renewable Energy Laboratory',
    logo: '', // No emoji - just text
    url: 'https://www.nrel.gov/',
    category: 'government',
    description: 'U.S. Department of Energy national laboratory focused on renewable energy research',
    whatWeUse: 'Annual Technology Baseline (ATB) for battery pricing, StoreFAST for LCOS methodology',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  {
    id: 'doe',
    name: 'DOE',
    fullName: 'U.S. Department of Energy',
    logo: '',
    url: 'https://www.energy.gov/',
    category: 'government',
    description: 'Federal agency responsible for energy policy and research',
    whatWeUse: 'Grid modernization standards, energy storage program cost targets',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100'
  },
  {
    id: 'sandia',
    name: 'Sandia',
    fullName: 'Sandia National Laboratories',
    logo: '',
    url: 'https://www.sandia.gov/',
    category: 'government',
    description: 'DOE national lab with extensive energy storage safety research',
    whatWeUse: 'Energy storage performance protocols, safety testing standards',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100'
  },
  {
    id: 'ul',
    name: 'UL',
    fullName: 'UL Solutions (UL 9540)',
    logo: '',
    url: 'https://www.ul.com/services/battery-and-energy-storage-system-testing',
    category: 'standard',
    description: 'Global safety certification organization',
    whatWeUse: 'UL 9540 and UL 9540A safety certification requirements for BESS',
    color: 'text-red-700',
    bgColor: 'bg-red-100'
  },
  {
    id: 'ieee',
    name: 'IEEE',
    fullName: 'IEEE Standards Association',
    logo: '',
    url: 'https://standards.ieee.org/',
    category: 'standard',
    description: 'World\'s largest technical professional organization',
    whatWeUse: 'IEEE 1547 interconnection standards, IEEE 2030 smart grid guidelines',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100'
  },
  {
    id: 'nfpa',
    name: 'NFPA',
    fullName: 'National Fire Protection Association',
    logo: '🔥',
    url: 'https://www.nfpa.org/',
    category: 'standard',
    description: 'Fire and electrical safety codes organization',
    whatWeUse: 'NFPA 855 installation requirements for stationary energy storage',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'eia',
    name: 'EIA',
    fullName: 'U.S. Energy Information Administration',
    logo: '📊',
    url: 'https://www.eia.gov/',
    category: 'government',
    description: 'Official source for U.S. energy statistics',
    whatWeUse: 'Electricity prices, capacity factors, regional energy data',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50'
  },
  {
    id: 'lazard',
    name: 'Lazard',
    fullName: 'Lazard LCOS Analysis',
    logo: '💹',
    url: 'https://www.lazard.com/research-insights/',
    category: 'industry',
    description: 'Leading financial advisory with authoritative LCOS benchmarks',
    whatWeUse: 'Annual Levelized Cost of Storage analysis for market validation',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50'
  }
];

// Category configurations
const CATEGORY_CONFIG = {
  government: {
    label: 'Government/DOE',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  standard: {
    label: 'Safety Standard',
    icon: CheckCircle2,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  industry: {
    label: 'Industry',
    icon: Award,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100'
  },
  academic: {
    label: 'Academic',
    icon: Info,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  }
};

// ============================================================================
// TRUST BADGE TOOLTIP COMPONENT
// ============================================================================

interface TrustBadgeTooltipProps {
  source: AuthoritySource;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const TrustBadgeTooltip: React.FC<TrustBadgeTooltipProps> = ({
  source,
  size = 'md',
  showTooltip = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
  };
  
  return (
    <div className="relative inline-block">
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          ${sizeClasses[size]} ${source.bgColor}
          rounded-lg flex items-center justify-center
          border-2 border-transparent hover:border-gray-300
          transition-all duration-200 hover:scale-110 hover:shadow-lg
          cursor-pointer
        `}
        title={source.fullName}
      >
        <span className="font-bold">{source.logo}</span>
      </a>
      
      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xl">{source.logo}</span>
            <div>
              <div className="font-bold text-gray-900 text-sm">{source.name}</div>
              <div className="text-xs text-gray-500">{source.fullName}</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2">{source.description}</p>
          <div className="text-xs text-blue-600 border-t border-gray-100 pt-2">
            <strong>We use:</strong> {source.whatWeUse}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-gray-200 transform rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TRUST BADGES INLINE STRIP
// ============================================================================

interface TrustBadgesInlineProps {
  /** Which sources to show (default: main 5) */
  sources?: string[];
  /** Size of badges */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
  /** Label text */
  label?: string;
  /** Dark mode for purple backgrounds */
  darkMode?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const TrustBadgesInline: React.FC<TrustBadgesInlineProps> = ({
  sources = ['nrel', 'doe', 'sandia', 'ul', 'ieee'],
  size = 'sm',
  showLabel = true,
  label = 'Methodology aligned with:',
  darkMode = false,
  className = ''
}) => {
  const filteredSources = AUTHORITY_SOURCES.filter(s => sources.includes(s.id));
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className={`text-xs font-medium ${darkMode ? 'text-purple-300' : 'text-gray-500'}`}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {filteredSources.map(source => (
          <TrustBadgeTooltip key={source.id} source={source} size={size} />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// TRUST BADGES GRID (for About pages)
// ============================================================================

interface TrustBadgesGridProps {
  /** Show all sources or specific ones */
  sources?: string[];
  /** Title for the section */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Layout columns */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

export const TrustBadgesGrid: React.FC<TrustBadgesGridProps> = ({
  sources,
  title = 'Industry-Aligned Methodology',
  subtitle = 'Every calculation in Merlin is traceable to authoritative sources',
  columns = 4,
  className = ''
}) => {
  const filteredSources = sources 
    ? AUTHORITY_SOURCES.filter(s => sources.includes(s.id))
    : AUTHORITY_SOURCES;
  
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  };
  
  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full mb-4">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Verified Sources</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
      </div>
      
      {/* Grid */}
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {filteredSources.map(source => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              ${source.bgColor} rounded-xl p-4 border border-transparent
              hover:border-gray-300 hover:shadow-lg transition-all
              group cursor-pointer
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{source.logo}</span>
              <div>
                <div className={`font-bold ${source.color}`}>{source.name}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{source.fullName}</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{source.whatWeUse}</p>
            <div className="flex items-center gap-1 text-xs text-blue-600 group-hover:underline">
              <span>Learn more</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// METHODOLOGY STATEMENT COMPONENT
// ============================================================================

interface MethodologyStatementProps {
  /** Variant style */
  variant?: 'default' | 'compact' | 'hero' | 'card';
  /** Dark mode for purple backgrounds */
  darkMode?: boolean;
  /** Show badges */
  showBadges?: boolean;
  /** Custom message */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

export const MethodologyStatement: React.FC<MethodologyStatementProps> = ({
  variant = 'default',
  darkMode = false,
  showBadges = true,
  message,
  className = ''
}) => {
  const defaultMessage = "All calculations follow NREL ATB 2024 and StoreFAST methodology. Every number is traceable to documented, authoritative sources.";
  
  // Compact variant - just text and small badges
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Shield className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-blue-600'}`} />
        <span className={`text-xs ${darkMode ? 'text-purple-200' : 'text-gray-600'}`}>
          {message || 'NREL ATB 2024 aligned'}
        </span>
        {showBadges && (
          <div className="flex gap-1">
            {['nrel', 'doe', 'ul'].map(id => {
              const source = AUTHORITY_SOURCES.find(s => s.id === id);
              if (!source) return null;
              return (
                <span 
                  key={id} 
                  className={`text-xs ${source.bgColor} px-1.5 py-0.5 rounded`}
                  title={source.fullName}
                >
                  {source.logo}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  // Hero variant - for landing page
  if (variant === 'hero') {
    return (
      <div className={`
        ${darkMode ? 'bg-white/10 backdrop-blur-sm border-white/20' : 'bg-blue-50 border-blue-200'}
        rounded-xl p-4 border ${className}
      `}>
        <div className="flex items-start gap-3">
          <div className={`
            ${darkMode ? 'bg-amber-400/20' : 'bg-blue-100'}
            p-2 rounded-lg
          `}>
            <Shield className={`w-5 h-5 ${darkMode ? 'text-amber-400' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Transparent, Auditable Pricing
            </h4>
            <p className={`text-xs mb-3 ${darkMode ? 'text-purple-200' : 'text-gray-600'}`}>
              {message || defaultMessage}
            </p>
            {showBadges && (
              <TrustBadgesInline 
                sources={['nrel', 'doe', 'sandia', 'ul', 'ieee']} 
                size="sm"
                showLabel={false}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Card variant - for sidebars
  if (variant === 'card') {
    return (
      <div className={`
        bg-gradient-to-br from-blue-50 to-indigo-50 
        rounded-xl p-5 border border-blue-100 ${className}
      `}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-gray-900">Benchmark-Backed</h4>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {message || defaultMessage}
        </p>
        {showBadges && (
          <div className="flex flex-wrap gap-2">
            {AUTHORITY_SOURCES.slice(0, 5).map(source => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  ${source.bgColor} px-2 py-1 rounded-md text-xs font-medium
                  ${source.color} hover:opacity-80 transition-opacity
                  flex items-center gap-1
                `}
              >
                <span>{source.logo}</span>
                <span>{source.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={`
      ${darkMode ? 'bg-purple-900/50 border-purple-500/30' : 'bg-white border-gray-200'}
      rounded-lg p-4 border ${className}
    `}>
      <div className="flex items-start gap-3">
        <CheckCircle2 className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
        <div>
          <p className={`text-sm ${darkMode ? 'text-purple-200' : 'text-gray-700'}`}>
            {message || defaultMessage}
          </p>
          {showBadges && (
            <div className="mt-3">
              <TrustBadgesInline 
                sources={['nrel', 'doe', 'sandia', 'ul', 'ieee']} 
                size="sm"
                showLabel={false}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// QUOTE FOOTER WITH COMPLIANCE
// ============================================================================

interface QuoteComplianceFooterProps {
  /** Methodology version */
  methodologyVersion?: string;
  /** Calculation date */
  calculatedAt?: string;
  /** Dark mode */
  darkMode?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const QuoteComplianceFooter: React.FC<QuoteComplianceFooterProps> = ({
  methodologyVersion = '1.0.0',
  calculatedAt,
  darkMode = false,
  className = ''
}) => {
  const displayDate = calculatedAt || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className={`
      ${darkMode ? 'bg-purple-900/30 border-purple-500/20' : 'bg-gray-50 border-gray-200'}
      rounded-lg p-4 border ${className}
    `}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Compliance badges */}
        <div className="flex items-center gap-2">
          <Shield className={`w-4 h-4 ${darkMode ? 'text-purple-300' : 'text-gray-500'}`} />
          <span className={`text-xs ${darkMode ? 'text-purple-300' : 'text-gray-500'}`}>
            Methodology aligned with:
          </span>
          <div className="flex gap-1">
            {['nrel', 'doe', 'ul', 'ieee'].map(id => {
              const source = AUTHORITY_SOURCES.find(s => s.id === id);
              if (!source) return null;
              return (
                <a
                  key={id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${source.bgColor} px-1.5 py-0.5 rounded text-xs hover:opacity-80`}
                  title={source.fullName}
                >
                  {source.logo}
                </a>
              );
            })}
          </div>
        </div>
        
        {/* Version and date */}
        <div className={`text-xs ${darkMode ? 'text-purple-400' : 'text-gray-400'}`}>
          v{methodologyVersion} • Calculated {displayDate}
        </div>
      </div>
      
      {/* Legal note */}
      <p className={`text-xs mt-3 ${darkMode ? 'text-purple-400/70' : 'text-gray-400'}`}>
        All pricing follows NREL ATB 2024 benchmarks. Financial projections use StoreFAST-aligned LCOS methodology.
        Quote valid for 30 days. See methodology documentation for assumptions.
      </p>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TrustBadgeTooltip,
  TrustBadgesInline,
  TrustBadgesGrid,
  MethodologyStatement,
  QuoteComplianceFooter,
  AUTHORITY_SOURCES
};
