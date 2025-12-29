/**
 * YesNoButtons.tsx
 * 
 * High-fidelity Yes/No button pair for binary questions.
 * Use instead of checkboxes or basic radio buttons.
 * 
 * DO NOT use low-fidelity checkboxes or single toggle switches.
 * 
 * @created December 2025
 */

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface YesNoButtonsProps {
  label: string;
  helpText?: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  yesIcon?: React.ReactNode;
  noIcon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function YesNoButtons({
  label,
  helpText,
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
  yesIcon,
  noIcon,
  disabled = false,
  error,
  className = '',
}: YesNoButtonsProps) {
  const handleYesClick = () => {
    console.log('[YesNoButtons] YES clicked, current value:', value, '→ setting true');
    if (!disabled) {
      onChange(true);
    }
  };
  
  const handleNoClick = () => {
    console.log('[YesNoButtons] NO clicked, current value:', value, '→ setting false');
    if (!disabled) {
      onChange(false);
    }
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
      
      {/* Button Pair */}
      <div className="grid grid-cols-2 gap-4">
        {/* YES Button */}
        <button
          type="button"
          onClick={handleYesClick}
          disabled={disabled}
          className={`h-14 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 
                     transition-all cursor-pointer ${
            disabled
              ? 'cursor-not-allowed opacity-50'
              : value === true
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                : 'bg-white border-slate-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          {value === true ? (
            yesIcon || <CheckCircle2 className="w-5 h-5" />
          ) : (
            yesIcon && <span className="opacity-50">{yesIcon}</span>
          )}
          {yesLabel}
        </button>
        
        {/* NO Button */}
        <button
          type="button"
          onClick={handleNoClick}
          disabled={disabled}
          className={`h-14 rounded-xl border-2 font-semibold flex items-center justify-center gap-2 
                     transition-all cursor-pointer ${
            disabled
              ? 'cursor-not-allowed opacity-50'
              : value === false
                ? 'bg-slate-500 border-slate-500 text-white shadow-md'
                : 'bg-white border-slate-200 text-gray-700 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {value === false ? (
            noIcon || <XCircle className="w-5 h-5" />
          ) : (
            noIcon && <span className="opacity-50">{noIcon}</span>
          )}
          {noLabel}
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default YesNoButtons;
