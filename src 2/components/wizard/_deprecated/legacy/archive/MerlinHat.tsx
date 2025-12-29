/**
 * MERLIN WIZARD HAT ICON
 * ======================
 * 
 * The signature Merlin brand icon.
 * Used subtly in headers and section titles.
 * 
 * Think Harry Potter - magical but tasteful.
 */

import React from 'react';

interface MerlinHatProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'purple' | 'gold' | 'gradient' | 'current';
  withSparkle?: boolean;
}

const SIZE_MAP = {
  sm: { width: 20, height: 20 },
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
  xl: { width: 48, height: 48 },
};

/**
 * Merlin's wizard hat icon.
 * 
 * Usage:
 * <MerlinHat size="md" color="purple" />
 * <MerlinHat size="sm" color="gradient" withSparkle />
 */
export const MerlinHat: React.FC<MerlinHatProps> = ({
  size = 'md',
  className = '',
  color = 'purple',
  withSparkle = false,
}) => {
  const { width, height } = SIZE_MAP[size];
  
  // Color definitions
  const colorMap = {
    purple: { hat: '#6700b6', band: '#ffa600', brim: '#4a0082' },
    gold: { hat: '#D97706', band: '#6700b6', brim: '#B45309' },
    gradient: { hat: 'url(#hatGradient)', band: '#ffa600', brim: 'url(#brimGradient)' },
    current: { hat: 'currentColor', band: 'currentColor', brim: 'currentColor' },
  };
  
  const colors = colorMap[color];
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Merlin wizard hat"
    >
      {/* Gradient definitions */}
      {color === 'gradient' && (
        <defs>
          <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6700b6" />
            <stop offset="100%" stopColor="#060F76" />
          </linearGradient>
          <linearGradient id="brimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4a0082" />
            <stop offset="100%" stopColor="#6700b6" />
          </linearGradient>
        </defs>
      )}
      
      {/* Hat brim (ellipse at bottom) */}
      <ellipse
        cx="24"
        cy="40"
        rx="20"
        ry="5"
        fill={colors.brim}
      />
      
      {/* Hat cone body */}
      <path
        d="M24 4 L40 38 L8 38 Z"
        fill={colors.hat}
      />
      
      {/* Hat band (decorative stripe) */}
      <path
        d="M11 34 L37 34 L36 37 L12 37 Z"
        fill={colors.band}
      />
      
      {/* Star on hat (optional sparkle) */}
      {withSparkle && (
        <>
          <path
            d="M20 18 L21 21 L24 22 L21 23 L20 26 L19 23 L16 22 L19 21 Z"
            fill="#ffa600"
            opacity="0.9"
          />
          {/* Small sparkle dots */}
          <circle cx="28" cy="14" r="1" fill="#ffa600" opacity="0.7" />
          <circle cx="15" cy="28" r="0.8" fill="#ffa600" opacity="0.5" />
        </>
      )}
    </svg>
  );
};

/**
 * Merlin section header with hat icon.
 * 
 * Usage:
 * <MerlinHeader>Welcome to Merlin</MerlinHeader>
 * <MerlinHeader subtitle="Let's size your system">Industry Selection</MerlinHeader>
 */
interface MerlinHeaderProps {
  children: React.ReactNode;
  subtitle?: string;
  hatSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MerlinHeader: React.FC<MerlinHeaderProps> = ({
  children,
  subtitle,
  hatSize = 'sm',
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MerlinHat size={hatSize} color="purple" withSparkle />
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{children}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Small inline Merlin brand mark.
 * Use in "Powered by Merlin" footers or subtle branding.
 */
export const MerlinBrandMark: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-gray-400 ${className}`}>
      <MerlinHat size="sm" color="current" />
      <span>Merlin</span>
    </span>
  );
};

export default MerlinHat;
