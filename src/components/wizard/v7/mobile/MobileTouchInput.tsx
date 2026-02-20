/**
 * MOBILE TOUCH INPUT
 * Touch-optimized input components for mobile
 * Larger tap targets, better keyboard handling
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileTouchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'tel';
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  error?: string;
}

export function MobileTouchInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
  min,
  max,
  step,
  required = false,
  error,
}: MobileTouchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className={`w-full px-4 py-3.5 rounded-lg bg-white/5 border ${
            error
              ? 'border-red-400/50'
              : isFocused
              ? 'border-[#3ECF8E]/50'
              : 'border-white/10'
          } text-white placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30 transition-all ${
            suffix ? 'pr-16' : ''
          }`}
          inputMode={
            type === 'number'
              ? 'decimal'
              : type === 'tel'
              ? 'tel'
              : type === 'email'
              ? 'email'
              : 'text'
          }
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

interface MobileTouchSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function MobileTouchSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  error,
}: MobileTouchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {/* Native Select (Better for Mobile) */}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-3.5 rounded-lg bg-white/5 border ${
            error ? 'border-red-400/50' : 'border-white/10'
          } text-white text-base focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30 appearance-none cursor-pointer transition-all`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

interface MobileTouchButtonGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
  }>;
  required?: boolean;
  columns?: 1 | 2 | 3;
}

export function MobileTouchButtonGroup({
  label,
  value,
  onChange,
  options,
  required = false,
  columns = 2,
}: MobileTouchButtonGroupProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-3">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div
        className={`grid gap-2.5 ${
          columns === 1
            ? 'grid-cols-1'
            : columns === 2
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`relative p-4 rounded-lg border-2 transition-all active:scale-95 ${
                isSelected
                  ? 'border-[#3ECF8E] bg-[#3ECF8E]/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {option.icon && (
                <div className="mb-2 flex justify-center">
                  <div
                    className={`text-2xl ${
                      isSelected ? 'text-[#3ECF8E]' : 'text-slate-400'
                    }`}
                  >
                    {option.icon}
                  </div>
                </div>
              )}
              <div
                className={`text-sm font-bold ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {option.label}
              </div>
              {option.description && (
                <div className="mt-1 text-xs text-slate-500 leading-tight">
                  {option.description}
                </div>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3ECF8E] flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-slate-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
