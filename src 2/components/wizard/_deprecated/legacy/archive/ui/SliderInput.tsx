/**
 * SliderInput.tsx
 * 
 * Modern slider input with value display and min/max labels.
 * Use for numeric values within a range.
 * 
 * @created December 2025
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface SliderInputProps {
  label: string;
  helpText?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  showMinMax?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SliderInput({
  label,
  helpText,
  min,
  max,
  step,
  value,
  onChange,
  unit,
  showMinMax = true,
  showValue = true,
  formatValue,
  disabled = false,
  error,
  className = '',
}: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const displayValue = formatValue 
    ? formatValue(value) 
    : `${value.toLocaleString()} ${unit}`;
  
  return (
    <div className={`w-full ${className}`}>
      {/* Header with Label and Value */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {showValue && (
          <span className="text-lg font-bold text-purple-600">{displayValue}</span>
        )}
      </div>
      
      {/* Help Text */}
      {helpText && (
        <p className="text-sm text-gray-500 mb-3">{helpText}</p>
      )}
      
      {/* Slider */}
      <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => !disabled && onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-6
                     [&::-webkit-slider-thumb]:h-6
                     [&::-webkit-slider-thumb]:bg-white
                     [&::-webkit-slider-thumb]:border-2
                     [&::-webkit-slider-thumb]:border-purple-500
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110
                     [&::-moz-range-thumb]:w-6
                     [&::-moz-range-thumb]:h-6
                     [&::-moz-range-thumb]:bg-white
                     [&::-moz-range-thumb]:border-2
                     [&::-moz-range-thumb]:border-purple-500
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:shadow-md
                     [&::-moz-range-thumb]:cursor-pointer
                     disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #7C3AED ${percentage}%, #E2E8F0 ${percentage}%)`
          }}
        />
        
        {/* Min/Max Labels */}
        {showMinMax && (
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{min.toLocaleString()} {unit}</span>
            <span>{max.toLocaleString()} {unit}</span>
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

export default SliderInput;
