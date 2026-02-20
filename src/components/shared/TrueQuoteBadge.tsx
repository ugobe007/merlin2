/**
 * TrueQuoteBadge.tsx - PROFESSIONAL REDESIGN
 * 
 * The official Merlin TrueQuote™ badge and branding components.
 * Premium design with gold shield, purple gradients, and glass morphism.
 * 
 * @version 2.0.0 - Professional Redesign
 */

import React, { useState } from 'react';
import { Shield, CheckCircle2, FileCheck, Search, BadgeCheck, Sparkles, Star } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface TrueQuoteBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Style variant */
  variant?: 'default' | 'minimal' | 'detailed' | 'hero' | 'pill' | 'premium';
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Show verified checkmark */
  verified?: boolean;
  /** Animate on hover */
  animated?: boolean;
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

// ============================================================================
// MAIN BADGE COMPONENT
// ============================================================================

export const TrueQuoteBadge: React.FC<TrueQuoteBadgeProps> = ({
  size = 'md',
  variant = 'default',
  showTooltip: _showTooltip = true,
  className = '',
  onClick,
  verified = true,
  animated = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'h-7 px-2.5 gap-1.5',
      shield: 'w-4 h-4',
      text: 'text-xs',
      tm: 'text-[8px]',
    },
    md: {
      container: 'h-9 px-3.5 gap-2',
      shield: 'w-5 h-5',
      text: 'text-sm',
      tm: 'text-[10px]',
    },
    lg: {
      container: 'h-11 px-4 gap-2.5',
      shield: 'w-6 h-6',
      text: 'text-base',
      tm: 'text-xs',
    },
    xl: {
      container: 'h-14 px-5 gap-3',
      shield: 'w-7 h-7',
      text: 'text-lg',
      tm: 'text-sm',
    },
  };

  const config = sizeConfig[size];

  // Minimal variant - simple pill
  if (variant === 'minimal') {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
          bg-amber-500/10 border border-amber-500/30
          hover:bg-amber-500/20 hover:border-amber-500/50
          transition-all duration-300
          ${animated && isHovered ? 'scale-105' : ''}
          ${className}
        `}
      >
        <Shield className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-amber-600">TrueQuote™</span>
      </button>
    );
  }

  // Pill variant - compact rounded
  if (variant === 'pill') {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative inline-flex items-center ${config.container} rounded-full
          bg-gradient-to-r from-slate-900 via-purple-900/80 to-slate-900
          border border-amber-500/40 hover:border-amber-400/60
          shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20
          transition-all duration-300
          ${animated && isHovered ? 'scale-105' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Shield icon */}
        <div className="relative">
          <Shield className={`${config.shield} text-amber-500 fill-amber-500/20`} />
          {verified && (
            <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-emerald-400 fill-emerald-400/20" />
          )}
        </div>
        
        {/* Text */}
        <div className="relative flex items-baseline">
          <span className={`${config.text} font-bold text-amber-500`}>TrueQuote</span>
          <span className={`${config.tm} font-bold text-amber-400 ml-0.5`}>™</span>
        </div>
      </button>
    );
  }

  // Premium variant - full featured with effects
  if (variant === 'premium') {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative inline-flex items-center ${config.container} rounded-xl
          bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900
          border-2 border-amber-500/50 hover:border-amber-400/70
          shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20
          transition-all duration-300
          ${animated && isHovered ? 'scale-105 -translate-y-0.5' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {/* Animated background */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r from-amber-500/5 via-purple-500/10 to-amber-500/5 
            ${isHovered ? 'animate-pulse' : ''}`} />
        </div>
        
        {/* Sparkle effects */}
        {isHovered && (
          <>
            <Sparkles className="absolute top-1 right-2 w-3 h-3 text-amber-400/60 animate-pulse" />
            <Star className="absolute bottom-1 left-3 w-2 h-2 text-purple-400/60 animate-pulse delay-100" />
          </>
        )}
        
        {/* Shield with gradient */}
        <div className="relative flex-shrink-0">
          <div className="relative">
            <Shield className={`${config.shield} text-amber-500`} style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-amber-200" />
            </div>
          </div>
        </div>
        
        {/* Text with gradient */}
        <div className="relative flex items-baseline">
          <span className={`${config.text} font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent`}>
            TrueQuote
          </span>
          <span className={`${config.tm} font-bold text-amber-400 ml-0.5`}>™</span>
        </div>
        
        {/* Verified badge */}
        {verified && (
          <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </div>
        )}
      </button>
    );
  }

  // Hero variant - large display version
  if (variant === 'hero') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative inline-flex flex-col items-center p-6 rounded-2xl
          bg-gradient-to-br from-slate-900 via-purple-950/80 to-slate-900
          border-2 border-amber-500/40 hover:border-amber-400/60
          shadow-2xl shadow-purple-500/20
          transition-all duration-500
          ${animated && isHovered ? 'scale-105' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {/* Background glow */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        {/* Sparkles */}
        <Sparkles className="absolute top-3 right-4 w-5 h-5 text-amber-400/40 animate-pulse" />
        <Star className="absolute bottom-4 left-5 w-4 h-4 text-purple-400/40 animate-pulse delay-300" />
        
        {/* Shield */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/30">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 to-purple-950 flex items-center justify-center">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          {verified && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        {/* Title */}
        <div className="relative flex items-baseline mb-1">
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
            TrueQuote
          </span>
          <span className="text-sm font-bold text-amber-400 ml-1">™</span>
        </div>
        
        {/* Tagline */}
        <p className="text-sm text-purple-300/80 font-medium">
          The Quote That Shows Its Work
        </p>
        
        {/* Pillars */}
        <div className="flex items-center gap-3 mt-4">
          {['Traceable', 'Auditable', 'Verifiable'].map((pillar, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-slate-300">{pillar}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed variant - shows pillars inline
  if (variant === 'detailed') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          group relative inline-flex items-center gap-4 px-4 py-3 rounded-xl
          bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900
          border border-amber-500/30 hover:border-amber-400/50
          shadow-lg shadow-purple-500/10
          transition-all duration-300
          ${animated && isHovered ? 'scale-[1.02]' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {/* Badge */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Shield className="w-6 h-6 text-amber-500" />
            {verified && (
              <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline">
            <span className="text-base font-bold text-amber-500">TrueQuote</span>
            <span className="text-xs font-bold text-amber-400 ml-0.5">™</span>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-purple-500/50 to-transparent" />
        
        {/* Pillars */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Traceable</span>
          </div>
          <div className="flex items-center gap-1">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Auditable</span>
          </div>
          <div className="flex items-center gap-1">
            <BadgeCheck className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Verifiable</span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - clean professional badge
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative inline-flex items-center ${config.container} rounded-xl
        bg-gradient-to-r from-amber-50 via-amber-100/80 to-amber-50
        border-2 border-amber-400/60 hover:border-amber-500
        shadow-md shadow-amber-500/10 hover:shadow-amber-500/20
        transition-all duration-300
        ${animated && isHovered ? 'scale-105' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Shield icon */}
      <div className="relative flex-shrink-0">
        <Shield className={`${config.shield} text-amber-600 fill-amber-500/30`} />
        {verified && (
          <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 text-emerald-500" />
        )}
      </div>
      
      {/* Text */}
      <div className="relative flex items-baseline">
        <span className={`${config.text} font-bold text-amber-700`}>TrueQuote</span>
        <span className={`${config.tm} font-bold text-amber-500 ml-0.5`}>™</span>
      </div>
      
      {/* Sparkle on hover */}
      {isHovered && animated && (
        <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
      )}
    </button>
  );
};

// ============================================================================
// SEAL COMPONENT - For quote documents
// ============================================================================

export const TrueQuoteSeal: React.FC<TrueQuoteSealProps> = ({
  certified = true,
  certifiedAt,
  sourceCount,
  size = 'md',
  showDetails = false,
}) => {
  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-[8px]' },
    md: { container: 'w-24 h-24', icon: 'w-10 h-10', text: 'text-xs' },
    lg: { container: 'w-32 h-32', icon: 'w-14 h-14', text: 'text-sm' },
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative ${config.container} flex items-center justify-center`}>
      {/* Outer ring */}
      <div className={`absolute inset-0 rounded-full border-4 
        ${certified ? 'border-amber-500/60' : 'border-slate-500/40'}
        ${certified ? 'shadow-lg shadow-amber-500/20' : ''}`} 
      />
      
      {/* Inner circle */}
      <div className={`absolute inset-2 rounded-full 
        ${certified 
          ? 'bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600' 
          : 'bg-gradient-to-br from-slate-600 to-slate-700'
        }`} 
      />
      
      {/* Content */}
      <div className="relative flex flex-col items-center justify-center text-center z-10">
        <Shield className={`${config.icon} ${certified ? 'text-amber-900' : 'text-slate-400'}`} />
        <span className={`${config.text} font-bold ${certified ? 'text-amber-900' : 'text-slate-400'} mt-0.5`}>
          {certified ? 'VERIFIED' : 'PENDING'}
        </span>
      </div>
      
      {/* Details tooltip */}
      {showDetails && certified && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap 
          px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700">
          {sourceCount && `${sourceCount} sources`}
          {certifiedAt && ` • ${new Date(certifiedAt).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INLINE BADGE - For use in text
// ============================================================================

export const TrueQuoteInline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 ${className}`}>
    <Shield className="w-3 h-3 text-amber-500" />
    <span className="text-xs font-semibold text-amber-600">TrueQuote™</span>
  </span>
);

export default TrueQuoteBadge;
