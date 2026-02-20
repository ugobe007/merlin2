/**
 * Merlin Question Input Components Library
 * 
 * Complete set of beautiful, accessible input components
 * for questionnaire forms
 */

import React, { useState } from 'react';
import {
  Plus, Minus, Check, ChevronDown,
  Search, ZapOff, Zap
} from 'lucide-react';

// ============================================================================
// 1. BUTTON GROUP - Single/Multi Select
// ============================================================================

interface ButtonOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface ButtonGroupProps {
  options: ButtonOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
}

export function ButtonGroup({
  options,
  value,
  onChange,
  multiSelect = false,
  columns = 2,
  size = 'md'
}: ButtonGroupProps) {
  const isSelected = (optionValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleClick = (optionValue: string) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
    }
  };

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-3`}>
      {options.map((option) => {
        const selected = isSelected(option.value);

        return (
          <button
            key={option.value}
            onClick={() => !option.disabled && handleClick(option.value)}
            disabled={option.disabled}
            className={`
              relative rounded-xl text-left transition-all duration-200
              ${sizeClasses[size]}
              ${selected
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]'
                : option.disabled
                  ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed border border-slate-700'
                  : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:border-purple-500/50 border border-slate-700'
              }
            `}
          >
            {/* Checkmark for selected */}
            {selected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-purple-600" strokeWidth={3} />
              </div>
            )}

            {/* Icon */}
            {option.icon && (
              <div className={`mb-2 ${selected ? 'text-white' : 'text-purple-400'}`}>
                {option.icon}
              </div>
            )}

            {/* Label */}
            <div className="font-semibold mb-1">
              {option.label}
            </div>

            {/* Description */}
            {option.description && (
              <div className={`text-sm ${selected ? 'text-purple-100' : 'text-slate-400'}`}>
                {option.description}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 2. SLIDER - With Live Value Display
// ============================================================================

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
  showLabels?: boolean;
  showTicks?: boolean;
  formatValue?: (value: number) => string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  showValue = true,
  showLabels = true,
  showTicks = false,
  formatValue
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="space-y-4">
      {/* Value Display */}
      {showValue && (
        <div className="flex items-center justify-center">
          <div className="px-6 py-3 bg-purple-600/20 border border-purple-500/30 rounded-xl">
            <div className="text-3xl font-bold text-white">
              {displayValue}
            </div>
          </div>
        </div>
      )}

      {/* Slider Track */}
      <div className="relative pt-2 pb-6">
        {/* Track Background */}
        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
          {/* Progress Fill */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />

        {/* Thumb */}
        <div 
          className="absolute top-0 w-7 h-7 -mt-2 bg-white rounded-full shadow-lg border-4 border-purple-600 pointer-events-none transition-all duration-150"
          style={{ left: `calc(${percentage}% - 14px)` }}
        />

        {/* Tick Marks */}
        {showTicks && (
          <div className="absolute inset-x-0 top-3 flex justify-between px-1">
            {Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => (
              <div key={i} className="w-0.5 h-2 bg-slate-600" />
            ))}
          </div>
        )}
      </div>

      {/* Min/Max Labels */}
      {showLabels && (
        <div className="flex justify-between text-sm text-slate-400 px-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. NUMBER INPUT - With +/- Controls
// ============================================================================

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  unit = '',
  size = 'md'
}: NumberInputProps) {
  const increment = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const sizeClasses = {
    sm: { button: 'w-10 h-10', input: 'text-2xl', container: 'gap-3' },
    md: { button: 'w-14 h-14', input: 'text-4xl', container: 'gap-4' },
    lg: { button: 'w-16 h-16', input: 'text-5xl', container: 'gap-6' }
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size].container}`}>
      {/* Decrement Button */}
      <button
        onClick={decrement}
        disabled={value <= min}
        className={`
          ${sizeClasses[size].button}
          rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed
          flex items-center justify-center text-white transition-all
          hover:scale-105 active:scale-95
        `}
      >
        <Minus className="w-6 h-6" />
      </button>

      {/* Value Display */}
      <div className="min-w-[120px] text-center">
        <div className={`${sizeClasses[size].input} font-bold text-white mb-1`}>
          {value}
        </div>
        {unit && (
          <div className="text-sm text-slate-400 uppercase tracking-wide">
            {unit}
          </div>
        )}
      </div>

      {/* Increment Button */}
      <button
        onClick={increment}
        disabled={value >= max}
        className={`
          ${sizeClasses[size].button}
          rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed
          flex items-center justify-center text-white transition-all
          hover:scale-105 active:scale-95
        `}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

// ============================================================================
// 4. TOGGLE - On/Off Switch
// ============================================================================

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Toggle({
  value,
  onChange,
  label,
  description,
  size = 'md'
}: ToggleProps) {
  const sizeClasses = {
    sm: { track: 'w-10 h-6', thumb: 'w-5 h-5', translate: 'translate-x-4' },
    md: { track: 'w-14 h-8', thumb: 'w-7 h-7', translate: 'translate-x-6' },
    lg: { track: 'w-16 h-10', thumb: 'w-8 h-8', translate: 'translate-x-6' }
  };

  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-4 w-full text-left p-4 rounded-xl hover:bg-slate-800/50 transition-colors"
    >
      {/* Toggle Switch */}
      <div
        className={`
          ${sizeClasses[size].track}
          relative rounded-full transition-colors duration-200
          ${value ? 'bg-purple-600' : 'bg-slate-700'}
        `}
      >
        <div
          className={`
            ${sizeClasses[size].thumb}
            absolute top-0.5 left-0.5 bg-white rounded-full transition-transform duration-200
            ${value ? sizeClasses[size].translate : 'translate-x-0'}
          `}
        />
      </div>

      {/* Label & Description */}
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <div className="font-semibold text-white mb-0.5">
              {label}
            </div>
          )}
          {description && (
            <div className="text-sm text-slate-400">
              {description}
            </div>
          )}
        </div>
      )}

      {/* Status Icon */}
      <div className={`${value ? 'text-purple-400' : 'text-slate-500'}`}>
        {value ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
      </div>
    </button>
  );
}

// ============================================================================
// 5. RADIO CARDS - Visual Radio Buttons
// ============================================================================

interface RadioCardProps {
  options: ButtonOption[];
  value: string;
  onChange: (value: string) => void;
  layout?: 'grid' | 'list';
}

export function RadioCards({
  options,
  value,
  onChange,
  layout = 'grid'
}: RadioCardProps) {
  return (
    <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
            className={`
              relative p-5 rounded-xl text-left transition-all duration-200
              flex items-start gap-4
              ${isSelected
                ? 'bg-purple-600/20 border-2 border-purple-600 shadow-lg shadow-purple-500/20'
                : 'bg-slate-800/50 border-2 border-slate-700 hover:border-purple-500/50'
              }
              ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {/* Radio Circle */}
            <div className={`
              flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all
              flex items-center justify-center mt-0.5
              ${isSelected 
                ? 'border-purple-600 bg-purple-600' 
                : 'border-slate-500 bg-transparent'
              }
            `}>
              {isSelected && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              {option.icon && (
                <div className={`mb-2 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`}>
                  {option.icon}
                </div>
              )}
              <div className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {option.label}
              </div>
              {option.description && (
                <div className={`text-sm ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {option.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// 6. DROPDOWN - Searchable Select
// ============================================================================

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchable = true
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-left flex items-center justify-between transition-colors"
      >
        <span className={selectedOption ? 'text-white' : 'text-slate-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options List */}
          <div className="absolute z-20 w-full mt-2 p-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
            {/* Search Input */}
            {searchable && (
              <div className="p-2 mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options */}
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full p-3 rounded-lg text-left transition-colors
                  ${value === option.value
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-slate-700 text-slate-200'
                  }
                `}
              >
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className={`text-sm mt-0.5 ${value === option.value ? 'text-purple-100' : 'text-slate-400'}`}>
                    {option.description}
                  </div>
                )}
              </button>
            ))}

            {/* No Results */}
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-slate-400">
                No results found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// 7. RANGE SLIDER - Min/Max Selection
// ============================================================================

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function RangeSlider({
  minValue,
  maxValue,
  onChange,
  min,
  max,
  step = 1,
  unit = ''
}: RangeSliderProps) {
  const minPercentage = ((minValue - min) / (max - min)) * 100;
  const maxPercentage = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-6">
      {/* Value Display */}
      <div className="flex items-center justify-between">
        <div className="px-4 py-2 bg-slate-800 rounded-lg">
          <div className="text-sm text-slate-400 mb-0.5">Min</div>
          <div className="text-xl font-bold text-white">{minValue}{unit}</div>
        </div>
        <div className="text-slate-500">—</div>
        <div className="px-4 py-2 bg-slate-800 rounded-lg">
          <div className="text-sm text-slate-400 mb-0.5">Max</div>
          <div className="text-xl font-bold text-white">{maxValue}{unit}</div>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative h-3 bg-slate-800 rounded-full">
        {/* Range Fill */}
        <div 
          className="absolute inset-y-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
          style={{ 
            left: `${minPercentage}%`,
            right: `${100 - maxPercentage}%`
          }}
        />

        {/* Min Thumb */}
        <input
          type="range"
          min={min}
          max={maxValue}
          step={step}
          value={minValue}
          onChange={(e) => onChange(Number(e.target.value), maxValue)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />

        {/* Max Thumb */}
        <input
          type="range"
          min={minValue}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => onChange(minValue, Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />

        {/* Visual Thumbs */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg border-4 border-purple-600 pointer-events-none"
          style={{ left: `calc(${minPercentage}% - 14px)` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg border-4 border-indigo-600 pointer-events-none"
          style={{ left: `calc(${maxPercentage}% - 14px)` }}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-sm text-slate-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ============================================================================
// 8. STEPPER - Compact Number Input
// ============================================================================

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  unit = ''
}: StepperProps) {
  return (
    <div className="inline-flex items-center bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
      <button
        onClick={() => onChange(Math.max(value - step, min))}
        disabled={value <= min}
        className="px-4 py-3 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-4 h-4 text-white" />
      </button>

      <div className="px-6 py-3 min-w-[80px] text-center border-x border-slate-700">
        <span className="text-white font-semibold">{value}</span>
        {unit && <span className="text-slate-400 text-sm ml-1">{unit}</span>}
      </div>

      <button
        onClick={() => onChange(Math.min(value + step, max))}
        disabled={value >= max}
        className="px-4 py-3 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}

// Export all components
export default {
  ButtonGroup,
  Slider,
  NumberInput,
  Toggle,
  RadioCards,
  Dropdown,
  RangeSlider,
  Stepper
};
