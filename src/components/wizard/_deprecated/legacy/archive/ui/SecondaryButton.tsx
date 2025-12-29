/**
 * SecondaryButton.tsx
 * 
 * Outline-style secondary button for non-primary actions.
 * Use for Back, Skip, Advanced Options, etc.
 * 
 * @created December 2025
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'outline' | 'ghost' | 'amber';
  className?: string;
  type?: 'button' | 'submit';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  size = 'md',
  fullWidth = false,
  variant = 'outline',
  className = '',
  type = 'button',
}: SecondaryButtonProps) {
  const sizeClasses = {
    sm: 'h-10 text-sm px-4',
    md: 'h-14 text-base px-6',
    lg: 'h-16 text-lg px-8',
  };
  
  const variantClasses = {
    outline: 'border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white border-0',
  };
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${fullWidth ? 'w-full' : ''} ${sizeClasses[size]} rounded-xl font-semibold 
                 flex items-center justify-center gap-3 transition-all ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed'
          : variantClasses[variant]
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

export default SecondaryButton;
