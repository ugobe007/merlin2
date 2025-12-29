/**
 * TrueQuoteBadge.tsx
 * 
 * The official Merlin TrueQuote™ badge and branding components.
 * TrueQuote™ represents our commitment to transparent, auditable, source-attributed quoting.
 * 
 * Definition: A TrueQuote™ is a financial quote in which every cost, assumption, 
 * and calculation is traceable to a documented, authoritative source.
 * 
 * The Three Pillars:
 * 1. TRACEABLE - Every number links to a specific source
 * 2. AUDITABLE - Complete methodology is documented
 * 3. VERIFIABLE - Third parties can check independently
 * 
 * @author Merlin Team
 * @version 1.0.0
 * @created December 2025
 */

import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  FileCheck, 
  Search, 
  ExternalLink,
  Award,
  BadgeCheck,
  Sparkles,
  Info
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface TrueQuoteBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Style variant */
  variant?: 'default' | 'minimal' | 'detailed' | 'hero';
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface TrueQuoteSealProps {
  /** Whether the quote meets TrueQuote™ standards */
  certified?: boolean;
  /** Certification date */
  certifiedAt?: string;
  /** Number of sources cited */
  sourceCount?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show details on hover/click */
  showDetails?: boolean;
}

export interface TrueQuotePillarProps {
  /** Which pillar to display */
  pillar: 'traceable' | 'auditable' | 'verifiable';
  /** Show description */
  showDescription?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRUEQUOTE_PILLARS = {
  traceable: {
    icon: Search,
    title: 'Traceable',
    description: 'Every number links to a specific source',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  auditable: {
    icon: FileCheck,
    title: 'Auditable',
    description: 'Complete methodology is documented',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  verifiable: {
    icon: CheckCircle2,
    title: 'Verifiable',
    description: 'Third parties can check independently',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
} as const;

const SIZE_CONFIG = {
  sm: {
    badge: 'h-6 px-2 text-xs gap-1',
    icon: 'w-3 h-3',
    text: 'text-xs'
  },
  md: {
    badge: 'h-8 px-3 text-sm gap-1.5',
    icon: 'w-4 h-4',
    text: 'text-sm'
  },
  lg: {
    badge: 'h-10 px-4 text-base gap-2',
    icon: 'w-5 h-5',
    text: 'text-base'
  },
  xl: {
    badge: 'h-12 px-5 text-lg gap-2.5',
    icon: 'w-6 h-6',
    text: 'text-lg'
  }
};

// ============================================================================
// TRUEQUOTE BADGE - Main branding badge
// ============================================================================

/**
 * The primary TrueQuote™ badge for use throughout the platform
 */
export const TrueQuoteBadge: React.FC<TrueQuoteBadgeProps> = ({
  size = 'md',
  variant = 'default',
  showTooltip = true,
  className = '',
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];

  // Minimal variant - just the icon and text
  if (variant === 'minimal') {
    return (
      <div 
        className={`inline-flex items-center gap-1 ${sizeConfig.text} text-amber-700 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BadgeCheck className={sizeConfig.icon} />
        <span className="font-semibold">TrueQuote</span>
        <span className="text-amber-500 text-[0.6em] align-super">™</span>
      </div>
    );
  }

  // Hero variant - large prominent display
  if (variant === 'hero') {
    return (
      <div className={`relative ${className}`}>
        <div className="inline-flex flex-col items-center gap-2 p-6 bg-gradient-to-br from-amber-50 via-white to-amber-50 border-2 border-amber-200 rounded-2xl shadow-lg">
          {/* Logo mark */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Text */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              True<span className="text-amber-600">Quote</span>
              <span className="text-amber-500 text-sm align-super">™</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              The Quote That Shows Its Work
            </div>
          </div>

          {/* Pillars */}
          <div className="flex items-center gap-4 mt-2">
            {Object.entries(TRUEQUOTE_PILLARS).map(([key, pillar]) => (
              <div key={key} className="flex items-center gap-1 text-xs text-gray-500">
                <pillar.icon className={`w-3.5 h-3.5 ${pillar.color}`} />
                <span>{pillar.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant - with description
  if (variant === 'detailed') {
    return (
      <div 
        className={`inline-flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg ${className}`}
        onClick={onClick}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-900">TrueQuote</span>
            <span className="text-amber-500 text-xs align-super">™</span>
            <span className="text-emerald-600 text-xs font-medium ml-1">Certified</span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            Every number in this quote is traceable to a documented, authoritative source.
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            {Object.entries(TRUEQUOTE_PILLARS).map(([key, pillar]) => (
              <div key={key} className="flex items-center gap-0.5 text-xs text-gray-500">
                <pillar.icon className={`w-3 h-3 ${pillar.color}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default variant - compact badge
  return (
    <div className="relative inline-block">
      <button
        className={`
          inline-flex items-center ${sizeConfig.badge}
          bg-gradient-to-r from-amber-100 to-amber-50 
          border border-amber-300 rounded-full
          font-semibold text-amber-800
          hover:from-amber-200 hover:to-amber-100
          hover:border-amber-400
          transition-all duration-200
          shadow-sm hover:shadow
          ${onClick ? 'cursor-pointer' : 'cursor-default'}
          ${className}
        `}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Shield className={`${sizeConfig.icon} text-amber-600`} />
        <span>TrueQuote</span>
        <span className="text-amber-500 text-[0.65em] align-super ml-0.5">™</span>
      </button>

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">TrueQuote™ Certified</div>
              <div className="text-xs text-gray-500">Transparent & Auditable</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Every cost and calculation in this quote is traceable to documented, authoritative sources.
          </p>
          <div className="space-y-1">
            {Object.entries(TRUEQUOTE_PILLARS).map(([key, pillar]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <pillar.icon className={`w-3 h-3 ${pillar.color}`} />
                <span className="text-gray-700">{pillar.title}</span>
                <span className="text-gray-400">—</span>
                <span className="text-gray-500">{pillar.description}</span>
              </div>
            ))}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2.5 h-2.5 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TRUEQUOTE SEAL - Certification seal for quotes
// ============================================================================

/**
 * A certification seal indicating a quote meets TrueQuote™ standards
 */
export const TrueQuoteSeal: React.FC<TrueQuoteSealProps> = ({
  certified = true,
  certifiedAt,
  sourceCount,
  size = 'md',
  showDetails = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  };

  if (!certified) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center`}>
        <Shield className={`${iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        className={`
          ${sizeClasses[size]} rounded-full 
          bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600
          border-4 border-amber-300
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-300
          hover:scale-105
          relative overflow-hidden
        `}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-200/30 to-transparent"></div>
        
        {/* Shield icon */}
        <Shield className={`${iconSizes[size]} text-white relative z-10`} />
        
        {/* Checkmark badge */}
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
          <CheckCircle2 className="w-3 h-3 text-white" />
        </div>
      </button>

      {/* Expanded details */}
      {showDetails && isExpanded && (
        <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
          <div className="text-center mb-2">
            <div className="font-bold text-gray-900">TrueQuote™ Certified</div>
            <div className="text-xs text-gray-500">
              {certifiedAt ? `Certified: ${new Date(certifiedAt).toLocaleDateString()}` : 'Verification Complete'}
            </div>
          </div>
          
          {sourceCount !== undefined && (
            <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 rounded-lg mb-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">{sourceCount} Sources Cited</span>
            </div>
          )}

          <div className="space-y-1.5">
            {Object.entries(TRUEQUOTE_PILLARS).map(([key, pillar]) => (
              <div key={key} className={`flex items-center gap-2 p-1.5 ${pillar.bgColor} rounded text-xs`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${pillar.color}`} />
                <span className="font-medium text-gray-700">{pillar.title}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-px">
            <div className="w-2.5 h-2.5 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TRUEQUOTE PILLAR - Individual pillar display
// ============================================================================

/**
 * Displays a single TrueQuote™ pillar (Traceable, Auditable, or Verifiable)
 */
export const TrueQuotePillar: React.FC<TrueQuotePillarProps> = ({
  pillar,
  showDescription = true,
  size = 'md'
}) => {
  const config = TRUEQUOTE_PILLARS[pillar];
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: 'p-2 gap-2',
      icon: 'w-4 h-4',
      title: 'text-xs',
      description: 'text-xs'
    },
    md: {
      container: 'p-3 gap-3',
      icon: 'w-5 h-5',
      title: 'text-sm',
      description: 'text-xs'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-start ${sizes.container} ${config.bgColor} border ${config.borderColor} rounded-lg`}>
      <div className={`${config.bgColor} rounded-full p-1.5`}>
        <Icon className={`${sizes.icon} ${config.color}`} />
      </div>
      <div className="flex-1">
        <div className={`font-semibold text-gray-900 ${sizes.title}`}>{config.title}</div>
        {showDescription && (
          <div className={`${sizes.description} text-gray-600 mt-0.5`}>{config.description}</div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TRUEQUOTE BANNER - Full-width promotional banner
// ============================================================================

export interface TrueQuoteBannerProps {
  /** Variant style */
  variant?: 'default' | 'compact';
  /** Show learn more link */
  showLearnMore?: boolean;
  /** Custom CTA text */
  ctaText?: string;
  /** Click handler for CTA */
  onCtaClick?: () => void;
}

/**
 * A promotional banner explaining TrueQuote™ methodology
 */
export const TrueQuoteBanner: React.FC<TrueQuoteBannerProps> = ({
  variant = 'default',
  showLearnMore = true,
  ctaText = 'Learn More',
  onCtaClick
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-lg">
        <div className="flex items-center gap-3">
          <TrueQuoteBadge size="sm" showTooltip={false} />
          <span className="text-sm text-gray-600">
            Every number in this quote is traceable to documented sources.
          </span>
        </div>
        {showLearnMore && (
          <button 
            onClick={onCtaClick}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
          >
            {ctaText} <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-amber-50 via-white to-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-start gap-4">
        <TrueQuoteSeal size="lg" showDetails={false} />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">
              This is a TrueQuote™
            </h3>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Unlike competitor quotes that hide their methodology, every cost, assumption, and calculation 
            in this Merlin quote is traceable to a documented, authoritative source. Banks and investors 
            can verify without calling us.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <TrueQuotePillar pillar="traceable" size="sm" />
            <TrueQuotePillar pillar="auditable" size="sm" />
            <TrueQuotePillar pillar="verifiable" size="sm" />
          </div>

          {showLearnMore && (
            <button 
              onClick={onCtaClick}
              className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
            >
              Learn about our methodology <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TRUEQUOTE TAGLINE - Various tagline displays
// ============================================================================

export interface TrueQuoteTaglineProps {
  /** Which tagline to display */
  tagline?: 'default' | 'challenge' | 'bank' | 'work';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

const TAGLINES = {
  default: 'Every number has a source.',
  challenge: 'Ask competitors where their numbers come from.',
  bank: 'Bank-ready from day one.',
  work: 'The quote that shows its work.'
} as const;

/**
 * Display TrueQuote™ taglines in various styles
 */
export const TrueQuoteTagline: React.FC<TrueQuoteTaglineProps> = ({
  tagline = 'default',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <p className={`${sizeClasses[size]} text-gray-600 italic ${className}`}>
      "{TAGLINES[tagline]}"
    </p>
  );
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default TrueQuoteBadge;
