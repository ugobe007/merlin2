/**
 * SegmentedControl.tsx
 * 
 * Inline segmented control for 3-5 options.
 * Use for single selection with clear visual grouping.
 * 
 * DO NOT use basic radio button groups.
 * 
 * @created December 2025
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
}

export interface SegmentedControlProps {
  label: string;
  helpText?: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SegmentedControl({
  label,
  helpText,
  options,
  value,
  onChange,
  disabled = false,
  error,
  size = 'md',
  className = '',
}: SegmentedControlProps) {
  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Help Text */}
      {helpText && (
        <p className="text-sm text-gray-500 mb-3">{helpText}</p>
      )}
      
      {/* Segmented Control */}
      <div className={`relative bg-slate-100 rounded-xl p-1 flex ${disabled ? 'opacity-50' : ''}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`flex-1 ${sizeClasses[size]} rounded-lg font-medium 
                       flex items-center justify-center gap-2 
                       transition-all duration-200 ${
              value === option.value
                ? 'bg-purple-600 text-white shadow-md'
                : disabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            {option.icon && (
              <span className="flex-shrink-0">
                {typeof option.icon === 'string' ? option.icon : option.icon}
              </span>
            )}
            <span className="truncate">{option.label}</span>
          </button>
        ))}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default SegmentedControl;
