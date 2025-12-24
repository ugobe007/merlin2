/**
 * MERLIN INPUT COMPONENTS - November Design System
 * =================================================
 * 
 * Clean, modern, and fun input components for the Merlin Wizard
 * 
 * INCLUDES:
 * - QuestionCard (wrapper with icon badge)
 * - MerlinDropdown (clean select with purple focus)
 * - MerlinToggle (pill buttons like Standard/Premium)
 * - MerlinSlider (modern slider with value bubble)
 * - MerlinStepper (number input with +/- buttons)
 * - MerlinChips (multi-select pill selection)
 * 
 * Based on November 2025 screenshots:
 * - White rounded cards
 * - Purple gradient icon badges
 * - Subtle shadows
 * - Satisfying micro-interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Check, 
  Plus, 
  Minus,
  Info,
  Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const tokens = {
  // Icon gradients by category
  iconGradients: {
    purple: 'from-purple-500 to-violet-600',
    blue: 'from-blue-500 to-indigo-500',
    cyan: 'from-cyan-500 to-blue-500',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-400 to-orange-500',
    pink: 'from-pink-400 to-rose-500',
    slate: 'from-slate-400 to-slate-600',
  },
  
  // Animation timings
  transition: 'transition-all duration-200 ease-out',
  transitionSlow: 'transition-all duration-300 ease-out',
  
  // Shadows
  cardShadow: 'shadow-md hover:shadow-lg',
  buttonShadow: 'shadow-lg shadow-purple-500/25',
  sliderThumbShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION CARD WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

interface QuestionCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconGradient?: keyof typeof tokens.iconGradients;
  title: string;
  subtitle?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  icon: Icon,
  iconGradient = 'purple',
  title,
  subtitle,
  required = false,
  children,
}) => {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 ${tokens.cardShadow} ${tokens.transition}`}>
      {/* Header with icon */}
      <div className="flex items-start gap-4 mb-5">
        {/* Icon Badge */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          bg-gradient-to-br ${tokens.iconGradients[iconGradient]}
          shadow-md
          ${tokens.transition}
          hover:scale-105 hover:shadow-lg
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Title & Subtitle */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 text-lg leading-tight">
            {title}
            {required && <span className="text-purple-500 ml-1">*</span>}
          </h4>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Input Content */}
      <div className="pl-0 md:pl-16">
        {children}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DROPDOWN SELECT
// ═══════════════════════════════════════════════════════════════════════════════

interface DropdownOption {
  value: string;
  label: string;
}

interface MerlinDropdownProps {
  options: DropdownOption[] | string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MerlinDropdown: React.FC<MerlinDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
}) => {
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`
          w-full px-4 py-3.5 pr-12
          rounded-xl
          bg-white
          border-2 border-gray-200
          text-gray-700
          font-medium
          appearance-none
          cursor-pointer
          ${tokens.transition}
          hover:border-purple-300
          focus:border-purple-500 focus:ring-4 focus:ring-purple-100
          focus:outline-none
          disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400
        `}
      >
        <option value="" disabled className="text-gray-400">
          {placeholder}
        </option>
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      
      {/* Custom chevron */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown className={`w-5 h-5 text-purple-400 ${tokens.transition}`} />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOGGLE BUTTONS (Standard/Premium style)
// ═══════════════════════════════════════════════════════════════════════════════

interface ToggleOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MerlinToggleProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 2 | 3 | 'auto';
}

export const MerlinToggle: React.FC<MerlinToggleProps> = ({
  options,
  value,
  onChange,
  columns = 'auto',
}) => {
  const gridCols = columns === 'auto' 
    ? options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'
    : columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
  
  return (
    <div className={`grid gap-3 ${gridCols}`}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const OptionIcon = option.icon;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              relative px-5 py-4 rounded-xl
              text-left
              ${tokens.transition}
              ${isSelected 
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]' 
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50'
              }
            `}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              {OptionIcon && (
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center
                  ${isSelected ? 'bg-white/20' : 'bg-purple-100'}
                `}>
                  <OptionIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-500'}`} />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <span className={`font-semibold block ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                  {option.label}
                </span>
                {option.sublabel && (
                  <span className={`text-xs block mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {option.sublabel}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SLIDER WITH VALUE BUBBLE
// ═══════════════════════════════════════════════════════════════════════════════

interface MerlinSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  showTicks?: boolean;
  tickCount?: number;
  unit?: string;
  showMinMax?: boolean;
}

export const MerlinSlider: React.FC<MerlinSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toString(),
  showTicks = false,
  tickCount = 5,
  unit = '',
  showMinMax = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLInputElement>(null);
  
  // Calculate percentage for styling
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Generate tick marks
  const ticks = showTicks 
    ? Array.from({ length: tickCount }, (_, i) => min + (max - min) * (i / (tickCount - 1)))
    : [];
  
  return (
    <div className="relative pt-8 pb-2">
      {/* Value Bubble */}
      <div 
        className={`
          absolute -top-1 transform -translate-x-1/2
          px-3 py-1.5 rounded-lg
          bg-gradient-to-r from-purple-500 to-violet-600
          text-white text-sm font-bold
          shadow-lg shadow-purple-500/30
          ${tokens.transitionSlow}
          ${isDragging ? 'scale-110' : 'scale-100'}
        `}
        style={{ left: `${percentage}%` }}
      >
        {formatValue(value)}{unit}
        {/* Pointer */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-violet-600 rotate-45" />
      </div>
      
      {/* Slider Track Container */}
      <div className="relative h-3">
        {/* Background Track */}
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        
        {/* Filled Track */}
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-400 to-violet-500"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Tick Marks */}
        {showTicks && (
          <div className="absolute inset-0 flex justify-between items-center px-1">
            {ticks.map((tick, i) => (
              <div 
                key={i}
                className={`w-1 h-1 rounded-full ${
                  tick <= value ? 'bg-white' : 'bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
        
        {/* Input Range */}
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Custom Thumb */}
        <div 
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-6 h-6 rounded-full
            bg-white border-4 border-purple-500
            shadow-lg
            ${tokens.transitionSlow}
            ${isDragging ? 'scale-125 border-violet-600' : 'scale-100'}
          `}
          style={{ 
            left: `${percentage}%`,
            boxShadow: isDragging ? tokens.sliderThumbShadow : undefined,
          }}
        />
      </div>
      
      {/* Min/Max Labels */}
      {showMinMax && (
        <div className="flex justify-between mt-2 px-1">
          <span className="text-xs text-gray-400 font-medium">{formatValue(min)}{unit}</span>
          <span className="text-xs text-gray-400 font-medium">{formatValue(max)}{unit}</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NUMBER STEPPER (+/- buttons)
// ═══════════════════════════════════════════════════════════════════════════════

interface MerlinStepperProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  formatValue?: (value: number) => string;
}

export const MerlinStepper: React.FC<MerlinStepperProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  unit = '',
  formatValue = (v) => v.toString(),
}) => {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));
  
  const canDecrement = value > min;
  const canIncrement = value < max;
  
  return (
    <div className="flex items-center gap-4">
      {/* Decrement Button */}
      <button
        type="button"
        onClick={decrement}
        disabled={!canDecrement}
        className={`
          w-12 h-12 rounded-xl
          flex items-center justify-center
          ${tokens.transition}
          ${canDecrement 
            ? 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-600 active:scale-95' 
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }
        `}
      >
        <Minus className="w-5 h-5" strokeWidth={2.5} />
      </button>
      
      {/* Value Display */}
      <div className="flex-1 text-center">
        <div className="text-3xl font-bold text-gray-800">
          {formatValue(value)}
          {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
      
      {/* Increment Button */}
      <button
        type="button"
        onClick={increment}
        disabled={!canIncrement}
        className={`
          w-12 h-12 rounded-xl
          flex items-center justify-center
          ${tokens.transition}
          ${canIncrement 
            ? 'bg-purple-500 text-white hover:bg-purple-600 active:scale-95 shadow-lg shadow-purple-500/25' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-SELECT CHIPS
// ═══════════════════════════════════════════════════════════════════════════════

interface ChipOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MerlinChipsProps {
  options: ChipOption[];
  values: string[];
  onChange: (values: string[]) => void;
  maxSelections?: number;
}

export const MerlinChips: React.FC<MerlinChipsProps> = ({
  options,
  values,
  onChange,
  maxSelections,
}) => {
  const toggleValue = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue));
    } else if (!maxSelections || values.length < maxSelections) {
      onChange([...values, optionValue]);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isSelected = values.includes(option.value);
        const isDisabled = !isSelected && maxSelections !== undefined && values.length >= maxSelections;
        const OptionIcon = option.icon;
        
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isDisabled && toggleValue(option.value)}
            disabled={isDisabled}
            className={`
              inline-flex items-center gap-2
              px-4 py-2.5 rounded-full
              font-medium text-sm
              ${tokens.transition}
              ${isSelected 
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/25' 
                : isDisabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
              }
            `}
          >
            {OptionIcon && (
              <OptionIcon className={`w-4 h-4 ${isSelected ? 'text-white' : ''}`} />
            )}
            <span>{option.label}</span>
            {isSelected && (
              <Check className="w-4 h-4 text-white" />
            )}
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// YES/NO TOGGLE (Special case - clean binary choice)
// ═══════════════════════════════════════════════════════════════════════════════

interface MerlinYesNoProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

export const MerlinYesNo: React.FC<MerlinYesNoProps> = ({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}) => {
  return (
    <div className="flex gap-4">
      {/* Yes Button */}
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`
          flex-1 py-4 rounded-xl font-semibold
          ${tokens.transition}
          ${value === true
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          {value === true && <Check className="w-5 h-5" />}
          <span>{yesLabel}</span>
        </div>
      </button>
      
      {/* No Button */}
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`
          flex-1 py-4 rounded-xl font-semibold
          ${tokens.transition}
          ${value === false
            ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/30'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          {value === false && <Check className="w-5 h-5" />}
          <span>{noLabel}</span>
        </div>
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  QuestionCard,
  MerlinDropdown,
  MerlinToggle,
  MerlinSlider,
  MerlinStepper,
  MerlinChips,
  MerlinYesNo,
  tokens,
};
