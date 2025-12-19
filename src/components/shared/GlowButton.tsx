/**
 * GLOSSY BUTTON COMPONENT - MERLIN ENERGY EDITION
 * ================================================
 * 
 * Premium glossy buttons with glass highlight effect and inner label.
 * Clean, professional styling with readable fonts.
 * 
 * Features:
 * - Rounded rectangle shape (not pill)
 * - Glass highlight overlay
 * - Inner "label button" effect for text POP
 * - White outline frame
 * - Smooth hover lift effect
 * - Multiple color variants
 * 
 * Category Variants:
 * - commercial: Blue (Hot Match palette)
 * - industrial: Green tones
 * - housing: Purple (Merlin brand)
 * 
 * December 19, 2025
 */

import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export type GlowButtonVariant = 'commercial' | 'industrial' | 'housing' | 'wizard' | 'solar' | 'energy' | 'teal' | 'charge' | 'peak' | 'lime' | 'slate' | 'ice' | 'fire' | 'steel' | 'violet' | 'emerald';

// Gradient colors for each variant - designed for readability
const VARIANTS: Record<string, { gradient: string; textColor: string; innerBg: string; }> = {
  // CATEGORY VARIANTS (Primary use)
  commercial: {
    // Blue - Hot Match palette (warm blue tones)
    gradient: 'linear-gradient(180deg, #5a9fd4 0%, #2b7bb9 40%, #1a5a8a 60%, #2b7bb9 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  industrial: {
    // Green tones
    gradient: 'linear-gradient(180deg, #6abb6a 0%, #3d9140 40%, #2a7030 60%, #3d9140 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  housing: {
    // Purple (Merlin brand)
    gradient: 'linear-gradient(180deg, #9b4dca 0%, #7b2d8e 40%, #5a1a6a 60%, #7b2d8e 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  
  // SECONDARY VARIANTS
  wizard: {
    gradient: 'linear-gradient(180deg, #9b4dca 0%, #7b2d8e 40%, #5a1a6a 60%, #7b2d8e 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  solar: {
    // Warm gold/amber (softer than before)
    gradient: 'linear-gradient(180deg, #e8a850 0%, #d08520 40%, #b06a10 60%, #d08520 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.2)',
  },
  energy: {
    gradient: 'linear-gradient(180deg, #5a9fd4 0%, #2b7bb9 40%, #1a5a8a 60%, #2b7bb9 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  teal: {
    gradient: 'linear-gradient(180deg, #4dd0e1 0%, #00acc1 40%, #00838f 60%, #00acc1 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  charge: {
    gradient: 'linear-gradient(180deg, #6abb6a 0%, #3d9140 40%, #2a7030 60%, #3d9140 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  peak: {
    gradient: 'linear-gradient(180deg, #e57373 0%, #c62828 40%, #8e0000 60%, #c62828 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  lime: {
    gradient: 'linear-gradient(180deg, #b8cc30 0%, #8fa000 40%, #6a7800 60%, #8fa000 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.2)',
  },
  slate: {
    gradient: 'linear-gradient(180deg, #708090 0%, #4a5a6a 40%, #2d3a4a 60%, #4a5a6a 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  
  // LEGACY ALIASES - mapped to new category colors
  ice: {
    gradient: 'linear-gradient(180deg, #5a9fd4 0%, #2b7bb9 40%, #1a5a8a 60%, #2b7bb9 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  fire: {
    // Now maps to commercial blue (was orange)
    gradient: 'linear-gradient(180deg, #5a9fd4 0%, #2b7bb9 40%, #1a5a8a 60%, #2b7bb9 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  steel: {
    // Now maps to industrial green (was slate)
    gradient: 'linear-gradient(180deg, #6abb6a 0%, #3d9140 40%, #2a7030 60%, #3d9140 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  violet: {
    gradient: 'linear-gradient(180deg, #9b4dca 0%, #7b2d8e 40%, #5a1a6a 60%, #7b2d8e 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
  emerald: {
    gradient: 'linear-gradient(180deg, #6abb6a 0%, #3d9140 40%, #2a7030 60%, #3d9140 100%)',
    textColor: '#ffffff',
    innerBg: 'rgba(0, 0, 0, 0.25)',
  },
};

// Button sizes - taller for vertical icon layout
const SIZES = {
  sm: { width: 160, height: 90, fontSize: 11, letterSpacing: 1.5, borderRadius: 14, innerPadding: '8px 12px', iconSize: 20 },
  md: { width: 190, height: 110, fontSize: 12, letterSpacing: 1.8, borderRadius: 16, innerPadding: '10px 14px', iconSize: 24 },
  lg: { width: 220, height: 130, fontSize: 13, letterSpacing: 2, borderRadius: 18, innerPadding: '12px 16px', iconSize: 28 },
};

export interface GlowButtonProps {
  children: React.ReactNode;
  variant?: GlowButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function GlowButton({
  children,
  variant = 'commercial',
  size = 'md',
  onClick,
  disabled = false,
  selected = false,
  className = '',
  fullWidth = false,
  icon,
}: GlowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variantStyle = VARIANTS[variant] || VARIANTS.commercial;
  const sizeStyle = SIZES[size];

  // Base box-shadow
  const baseBoxShadow = `
    0 2px 0 rgba(255, 255, 255, 0.6),
    0 -1px 0 rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 -3px 6px rgba(0, 0, 0, 0.25)
  `;

  // Hover box-shadow
  const hoverBoxShadow = `
    0 2px 0 rgba(255, 255, 255, 0.7),
    0 -1px 0 rgba(0, 0, 0, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 -3px 6px rgba(0, 0, 0, 0.25)
  `;

  // Active box-shadow
  const activeBoxShadow = `
    0 1px 0 rgba(255, 255, 255, 0.5),
    0 -1px 0 rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.2),
    inset 0 3px 6px rgba(0, 0, 0, 0.3)
  `;

  const buttonStyle: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : sizeStyle.width,
    height: sizeStyle.height,
    border: 'none',
    borderRadius: sizeStyle.borderRadius,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: variantStyle.gradient,
    boxShadow: isPressed ? activeBoxShadow : isHovered ? hoverBoxShadow : baseBoxShadow,
    transform: isPressed ? 'translateY(1px)' : isHovered ? 'translateY(-3px)' : 'translateY(0)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    opacity: disabled ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  };

  // Glass highlight overlay (top shine)
  const glassHighlightStyle: React.CSSProperties = {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: '40%',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%)',
    borderRadius: `${sizeStyle.borderRadius - 2}px ${sizeStyle.borderRadius - 2}px 50px 50px`,
    pointerEvents: 'none',
  };

  // White outline frame
  const outlineFrameStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -3,
    borderRadius: sizeStyle.borderRadius + 3,
    border: '2px solid rgba(255, 255, 255, 0.7)',
    pointerEvents: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  // Inner label button - the "button inside button" effect (vertical layout)
  const innerLabelStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',  // Vertical layout: icon on top
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: sizeStyle.innerPadding,
    background: variantStyle.innerBg,
    borderRadius: sizeStyle.borderRadius - 6,
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.2)',
    fontSize: sizeStyle.fontSize,
    fontWeight: 700,
    letterSpacing: sizeStyle.letterSpacing,
    textTransform: 'uppercase',
    color: variantStyle.textColor,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)',
    minWidth: '80%',
    minHeight: '75%',
    textAlign: 'center',
    lineHeight: 1.2,
  };

  // Selected checkmark style
  const selectedBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    background: '#22c55e',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
    zIndex: 10,
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className={className}
    >
      {/* Glass highlight overlay */}
      <div style={glassHighlightStyle} />
      
      {/* White outline frame */}
      <div style={outlineFrameStyle} />
      
      {/* Selected checkmark */}
      {selected && (
        <div style={selectedBadgeStyle}>
          <CheckCircle size={12} color="white" strokeWidth={3} />
        </div>
      )}
      
      {/* Inner label button - THE POP EFFECT */}
      <div style={innerLabelStyle}>
        {icon}
        <span>{children}</span>
      </div>
    </button>
  );
}

// Convenience exports for category variants
export const CommercialButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="commercial" />
);

export const IndustrialButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="industrial" />
);

export const HousingButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="housing" />
);

// Secondary variants
export const WizardButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="wizard" />
);

export const SolarButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="solar" />
);

export const EnergyButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="energy" />
);

export const TealButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="teal" />
);

export const ChargeButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="charge" />
);

export const PeakButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="peak" />
);

export const LimeButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="lime" />
);

export const SlateButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="slate" />
);

// Legacy aliases (mapped to new colors)
export const IceButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="ice" />
);

export const FireButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="fire" />
);

export const SteelButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="steel" />
);

export const VioletButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="violet" />
);

export const EmeraldButton = (props: Omit<GlowButtonProps, 'variant'>) => (
  <GlowButton {...props} variant="emerald" />
);

export default GlowButton;
