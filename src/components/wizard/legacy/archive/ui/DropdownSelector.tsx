/**
 * DropdownSelector.tsx
 * 
 * Full-width dropdown selector with icons and modern styling.
 * Use for single selection from 3+ options.
 * 
 * DO NOT use basic <select> elements or low-fidelity dropdowns.
 * 
 * @created December 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
  description?: string;
}

export interface DropdownSelectorProps {
  label: string;
  helpText?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DropdownSelector({
  label,
  helpText,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  className = '',
}: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(o => o.value === value);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
  
  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Help Text */}
      {helpText && (
        <p className="text-sm text-gray-500 mb-2">{helpText}</p>
      )}
      
      {/* Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full h-14 px-4 bg-white border-2 rounded-xl
                     flex items-center justify-between
                     transition-all ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : error
                ? 'border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : isOpen
                  ? 'border-purple-500 ring-2 ring-purple-200'
                  : 'border-slate-200 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {selectedOption?.icon && (
              <span className="text-xl flex-shrink-0">
                {typeof selectedOption.icon === 'string' ? selectedOption.icon : selectedOption.icon}
              </span>
            )}
            <span className={`font-medium ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        {/* Dropdown Options */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                  value === option.value
                    ? 'bg-purple-100'
                    : 'hover:bg-purple-50'
                }`}
              >
                {option.icon && (
                  <span className="text-xl flex-shrink-0">
                    {typeof option.icon === 'string' ? option.icon : option.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 block">{option.label}</span>
                  {option.description && (
                    <span className="text-sm text-gray-500 block truncate">{option.description}</span>
                  )}
                </div>
                {value === option.value && (
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default DropdownSelector;
