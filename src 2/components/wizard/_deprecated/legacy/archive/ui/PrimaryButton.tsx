/**
 * PrimaryButton.tsx
 * 
 * Full-width primary CTA button with gradient styling.
 * Use for main actions like Continue, Submit, Generate Quote.
 * 
 * @created December 2025
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = true,
  className = '',
  type = 'button',
}: PrimaryButtonProps) {
  const sizeClasses = {
    sm: 'h-10 text-sm px-4',
    md: 'h-14 text-lg px-6',
    lg: 'h-16 text-xl px-8',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${fullWidth ? 'w-full' : ''} ${sizeClasses[size]} rounded-xl font-bold 
                 flex items-center justify-center gap-3 transition-all ${
        isDisabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
}

export default PrimaryButton;
