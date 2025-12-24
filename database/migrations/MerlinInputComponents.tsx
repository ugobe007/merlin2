/**
 * MERLIN WIZARD V5 - STEP 3 INPUT COMPONENTS
 * ============================================
 * Professional, Fun, Intuitive Input System
 * 
 * RULES:
 * - 2 options → ToggleButtons
 * - 3-5 options → PanelButtons  
 * - 6+ options → Slider or SearchableDropdown
 * - Multi-select → CheckboxGrid
 * - Numbers → Slider with labels
 * - Text → CleanInput
 * 
 * NEVER use dropdowns for ≤5 options!
 */

import React, { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// GRADIENT PRESETS BY CATEGORY
// ═══════════════════════════════════════════════════════════════════════════════

export const GRADIENTS = {
  facility: 'from-purple-500 to-violet-600',
  size: 'from-blue-500 to-indigo-600',
  energy: 'from-amber-400 to-orange-500',
  amenities: 'from-cyan-500 to-blue-500',
  operations: 'from-emerald-500 to-teal-600',
  goals: 'from-pink-500 to-rose-600',
  default: 'from-purple-500 to-violet-600',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PANEL BUTTONS (3-5 Options)
// ═══════════════════════════════════════════════════════════════════════════════

interface PanelOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PanelButtonsProps {
  label: string;
  subtitle?: string;
  options: PanelOption[];
  value: string | null;
  onChange: (value: string) => void;
  gradient?: string;
  icon?: React.ComponentType<{ className?: string }>;
  columns?: 2 | 3;
}

export const PanelButtons: React.FC<PanelButtonsProps> = ({
  label,
  subtitle,
  options,
  value,
  onChange,
  gradient = GRADIENTS.default,
  icon: HeaderIcon,
  columns = 3,
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-6">
        {HeaderIcon && (
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30`}>
            <HeaderIcon className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{label}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Options Grid */}
      <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const OptionIcon = option.icon;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                relative p-5 rounded-xl cursor-pointer transition-all duration-200 text-left
                ${isSelected 
                  ? 'bg-gradient-to-br from-purple-600/30 to-violet-700/30 border-2 border-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]' 
                  : 'bg-gradient-to-br from-white/8 to-white/4 border border-white/15 hover:border-purple-400/50 hover:from-white/12 hover:to-white/8'
                }
              `}
            >
              {/* Option Icon */}
              {OptionIcon && (
                <div className={`w-12 h-12 rounded-xl mb-3 bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                  <OptionIcon className="w-6 h-6 text-white" />
                </div>
              )}
              
              {/* Label */}
              <div className="font-semibold text-white">{option.label}</div>
              
              {/* Description */}
              {option.description && (
                <div className="text-sm text-gray-400 mt-1">{option.description}</div>
              )}
              
              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TOGGLE BUTTONS (Yes/No, 2 Options)
// ═══════════════════════════════════════════════════════════════════════════════

interface ToggleButtonsProps {
  label: string;
  subtitle?: string;
  options: [PanelOption, PanelOption];
  value: string | boolean | null;
  onChange: (value: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

export const ToggleButtons: React.FC<ToggleButtonsProps> = ({
  label,
  subtitle,
  options,
  value,
  onChange,
  icon: HeaderIcon,
  gradient = GRADIENTS.default,
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-6">
        {HeaderIcon && (
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <HeaderIcon className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{label}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-4">
        {options.map((option) => {
          const isSelected = String(value) === String(option.value);
          const OptionIcon = option.icon;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-200
                flex items-center justify-center gap-3
                ${isSelected 
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 border-2 border-purple-400 text-white shadow-lg shadow-purple-500/30' 
                  : 'bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/25'
                }
              `}
            >
              {isSelected && <Check className="w-5 h-5" />}
              {OptionIcon && !isSelected && <OptionIcon className="w-5 h-5 text-gray-400" />}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RANGE SLIDER (Numeric Values)
// ═══════════════════════════════════════════════════════════════════════════════

interface SliderProps {
  label: string;
  subtitle?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  unit?: string;
  marks?: { value: number; label: string }[];
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

export const RangeSlider: React.FC<SliderProps> = ({
  label,
  subtitle,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toLocaleString(),
  unit = '',
  marks,
  icon: HeaderIcon,
  gradient = GRADIENTS.size,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-6">
        {HeaderIcon && (
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <HeaderIcon className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{label}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Slider */}
      <div className="pt-10 pb-4 px-2">
        {/* Value Tooltip */}
        <div 
          className="absolute -translate-y-12 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-500/30 whitespace-nowrap"
          style={{ left: `calc(${percentage}% - 2rem)` }}
        >
          {formatValue(value)}{unit && ` ${unit}`}
        </div>
        
        {/* Track Container */}
        <div className="relative">
          {/* Track Background */}
          <div className="w-full h-3 rounded-full bg-white/10" />
          
          {/* Track Fill */}
          <div 
            className={`absolute left-0 top-0 h-3 rounded-full bg-gradient-to-r ${gradient}`}
            style={{ width: `${percentage}%` }}
          />
          
          {/* Native Range Input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
          />
          
          {/* Visual Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-4 border-purple-500 shadow-lg shadow-purple-500/50 pointer-events-none transition-transform hover:scale-110"
            style={{ left: `calc(${percentage}% - 0.875rem)` }}
          />
        </div>
        
        {/* Marks / Labels */}
        {marks ? (
          <div className="flex justify-between mt-3">
            {marks.map((mark) => (
              <span key={mark.value} className="text-sm text-gray-400">{mark.label}</span>
            ))}
          </div>
        ) : (
          <div className="flex justify-between mt-3 text-sm text-gray-400">
            <span>{formatValue(min)}{unit && ` ${unit}`}</span>
            <span>{formatValue(max)}{unit && ` ${unit}`}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CHECKBOX GRID (Multi-Select)
// ═══════════════════════════════════════════════════════════════════════════════

interface CheckboxGridProps {
  label: string;
  subtitle?: string;
  options: PanelOption[];
  value: string[];
  onChange: (value: string[]) => void;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  columns?: 2 | 3;
}

export const CheckboxGrid: React.FC<CheckboxGridProps> = ({
  label,
  subtitle,
  options,
  value,
  onChange,
  icon: HeaderIcon,
  gradient = GRADIENTS.amenities,
  columns = 3,
}) => {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-2">
        {HeaderIcon && (
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <HeaderIcon className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{label}</h3>
          <p className="text-sm text-gray-400 mt-1">{subtitle || 'Select all that apply'}</p>
        </div>
      </div>

      {/* Checkbox Grid */}
      <div className={`grid gap-3 mt-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
        {options.map((option) => {
          const isChecked = value.includes(option.value);
          const OptionIcon = option.icon;
          
          return (
            <button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={`
                flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200
                ${isChecked 
                  ? 'bg-gradient-to-r from-purple-600/20 to-violet-600/20 border-2 border-purple-400' 
                  : 'bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/25'
                }
              `}
            >
              {/* Custom Checkbox */}
              <div className={`
                w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
                ${isChecked ? 'border-purple-500 bg-purple-500' : 'border-gray-500 bg-transparent'}
              `}>
                {isChecked && <Check className="w-4 h-4 text-white" />}
              </div>
              
              {/* Icon */}
              {OptionIcon && (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <OptionIcon className="w-5 h-5 text-purple-400" />
                </div>
              )}
              
              {/* Label */}
              <span className="text-white font-medium text-left">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CLEAN INPUT FIELD (Text/Number)
// ═══════════════════════════════════════════════════════════════════════════════

interface CleanInputProps {
  label: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  optional?: boolean;
}

export const CleanInput: React.FC<CleanInputProps> = ({
  label,
  subtitle,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon: HeaderIcon,
  gradient = GRADIENTS.default,
  optional = false,
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-4">
        {HeaderIcon && (
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <HeaderIcon className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">
            {label}
            {optional && <span className="text-gray-500 font-normal text-sm ml-2">(Optional)</span>}
          </h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="
            w-full px-5 py-4 rounded-xl
            bg-white/5 border border-white/15
            text-white placeholder-gray-500
            focus:bg-white/10 focus:border-purple-400 focus:outline-none
            focus:ring-2 focus:ring-purple-400/30
            transition-all duration-200
          "
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SEARCHABLE DROPDOWN (6+ Options)
// ═══════════════════════════════════════════════════════════════════════════════

interface SearchableDropdownProps {
  label: string;
  subtitle?: string;
  options: PanelOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  subtitle,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  icon: HeaderIcon,
  gradient = GRADIENTS.default,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      {/* Question Header */}
      <div className="flex items-start gap-4 mb-4">
        {HeaderIcon && (
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <HeaderIcon className="w-7 h-7 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{label}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Dropdown */}
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            w-full px-5 py-4 rounded-xl
            bg-white/5 border border-white/15
            text-left text-white
            hover:bg-white/10 hover:border-white/25
            focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30
            transition-all duration-200
            flex items-center justify-between
          "
        >
          <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
            {/* Search Input */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/15 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            
            {/* Options List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.map((option) => {
                const isSelected = option.value === value;
                const OptionIcon = option.icon;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`
                      w-full px-5 py-4 text-left transition-colors duration-150
                      flex items-center gap-3
                      ${isSelected ? 'bg-purple-600/20 text-white' : 'text-white hover:bg-purple-600/30'}
                    `}
                  >
                    {OptionIcon && <OptionIcon className="w-5 h-5 text-purple-400" />}
                    <span className="flex-1">{option.label}</span>
                    {isSelected && <Check className="w-5 h-5 text-purple-400" />}
                  </button>
                );
              })}
              
              {filteredOptions.length === 0 && (
                <div className="px-5 py-4 text-gray-500 text-center">No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART QUESTION RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

interface Question {
  field: string;
  label: string;
  subtitle?: string;
  type: 'select' | 'boolean' | 'multiselect' | 'number' | 'range' | 'text';
  options?: PanelOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  optional?: boolean;
}

interface SmartQuestionProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

export const SmartQuestion: React.FC<SmartQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  const optionCount = question.options?.length || 0;
  
  // Boolean or 2 options → Toggle Buttons
  if (question.type === 'boolean' || optionCount === 2) {
    const options: [PanelOption, PanelOption] = question.options as [PanelOption, PanelOption] || [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ];
    return (
      <ToggleButtons
        label={question.label}
        subtitle={question.subtitle}
        options={options}
        value={value}
        onChange={onChange}
        icon={question.icon}
        gradient={question.gradient}
      />
    );
  }
  
  // Multi-select → Checkbox Grid
  if (question.type === 'multiselect') {
    return (
      <CheckboxGrid
        label={question.label}
        subtitle={question.subtitle}
        options={question.options || []}
        value={value || []}
        onChange={onChange}
        icon={question.icon}
        gradient={question.gradient}
      />
    );
  }
  
  // Numeric range → Slider
  if (question.type === 'number' || question.type === 'range') {
    return (
      <RangeSlider
        label={question.label}
        subtitle={question.subtitle}
        min={question.min || 0}
        max={question.max || 100}
        step={question.step || 1}
        value={value || question.min || 0}
        onChange={onChange}
        unit={question.unit}
        icon={question.icon}
        gradient={question.gradient}
      />
    );
  }
  
  // Text → Clean Input
  if (question.type === 'text') {
    return (
      <CleanInput
        label={question.label}
        subtitle={question.subtitle}
        value={value || ''}
        onChange={onChange}
        icon={question.icon}
        gradient={question.gradient}
        optional={question.optional}
      />
    );
  }
  
  // 3-5 options → Panel Buttons
  if (optionCount >= 3 && optionCount <= 5) {
    return (
      <PanelButtons
        label={question.label}
        subtitle={question.subtitle}
        options={question.options || []}
        value={value}
        onChange={onChange}
        icon={question.icon}
        gradient={question.gradient}
      />
    );
  }
  
  // 6+ options → Searchable Dropdown
  if (optionCount > 5) {
    return (
      <SearchableDropdown
        label={question.label}
        subtitle={question.subtitle}
        options={question.options || []}
        value={value}
        onChange={onChange}
        icon={question.icon}
        gradient={question.gradient}
      />
    );
  }
  
  // Fallback to Panel Buttons
  return (
    <PanelButtons
      label={question.label}
      subtitle={question.subtitle}
      options={question.options || []}
      value={value}
      onChange={onChange}
      icon={question.icon}
      gradient={question.gradient}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. POWER BOOSTERS PANEL (Solar + EV Chargers)
// ═══════════════════════════════════════════════════════════════════════════════

interface SolarConfig {
  enabled: boolean;
  capacityKW: number;
  installationType: 'rooftop' | 'carport' | 'ground';
  sunnyDaysPerYear: number;
  peakSunHours: number;
  peakTimeRange: string;
  estimatedGenerationMWh: number;
  estimatedSavingsPerYear: number;
  percentageOffset: number;
}

interface EVChargersConfig {
  enabled: boolean;
  level2Count: number;
  level2PowerKW: number;
  dcfcCount: number;
  dcfcPowerKW: 50 | 150 | 350;
  usagePattern: 'employee_visitor' | 'fleet';
  electricityRate: number;
  offPeakRate: number;
  peakHoursStart: string;
  peakHoursEnd: string;
  totalPeakLoadKW: number;
  estimatedDailyDrawKWh: number;
  estimatedFuelSavingsPerYear: number;
}

interface PowerBoostersPanelProps {
  solarConfig: SolarConfig | null;
  evConfig: EVChargersConfig | null;
  onConfigureSolar: () => void;
  onConfigureEV: () => void;
  location: { state: string; city?: string };
}

export const PowerBoostersPanel: React.FC<PowerBoostersPanelProps> = ({
  solarConfig,
  evConfig,
  onConfigureSolar,
  onConfigureEV,
  location,
}) => {
  const solarConfigured = solarConfig?.enabled && solarConfig.capacityKW > 0;
  const evConfigured = evConfig?.enabled && (evConfig.level2Count > 0 || evConfig.dcfcCount > 0);

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">⚡</span>
        <h2 className="text-xl font-bold text-white">Power Boosters</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Maximize your energy savings with these optional add-ons
      </p>

      {/* Booster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Solar Card */}
        <div className={`
          rounded-xl p-5 transition-all duration-200
          ${solarConfigured 
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/50' 
            : 'bg-white/5 border border-white/15 hover:border-amber-400/50 hover:bg-white/8'
          }
        `}>
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-xl mb-4 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="text-2xl">☀️</span>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-1">Add Solar</h3>
          
          {/* Description */}
          <p className="text-sm text-gray-400 mb-4">
            Generate clean energy based on {location.state}'s excellent sun exposure
          </p>
          
          {/* Configure Button */}
          <button
            onClick={onConfigureSolar}
            className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 hover:border-white/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>⚙️</span>
            <span>{solarConfigured ? 'Edit Configuration' : 'Configure'}</span>
          </button>
          
          {/* Configured Status */}
          {solarConfigured && (
            <div className="flex items-center gap-2 mt-3 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Configured: {solarConfig.capacityKW.toLocaleString()} kW {solarConfig.installationType}</span>
            </div>
          )}
        </div>

        {/* EV Chargers Card */}
        <div className={`
          rounded-xl p-5 transition-all duration-200
          ${evConfigured 
            ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/50' 
            : 'bg-white/5 border border-white/15 hover:border-emerald-400/50 hover:bg-white/8'
          }
        `}>
          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-xl mb-4 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-2xl">🔌</span>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-1">Add EV Chargers</h3>
          
          {/* Description */}
          <p className="text-sm text-gray-400 mb-4">
            Future-proof your facility with Level 2 & DC Fast charging stations
          </p>
          
          {/* Configure Button */}
          <button
            onClick={onConfigureEV}
            className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 hover:border-white/30 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>⚙️</span>
            <span>{evConfigured ? 'Edit Configuration' : 'Configure'}</span>
          </button>
          
          {/* Configured Status */}
          {evConfigured && (
            <div className="flex items-center gap-2 mt-3 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              <span>
                Configured: {evConfig.level2Count > 0 ? `${evConfig.level2Count} L2` : ''}
                {evConfig.level2Count > 0 && evConfig.dcfcCount > 0 ? ' + ' : ''}
                {evConfig.dcfcCount > 0 ? `${evConfig.dcfcCount} DCFC` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. NAVIGATION FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

interface NavFooterProps {
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  backLabel?: string;
  nextLabel?: string;
  remainingCount?: number;
}

export const NavFooter: React.FC<NavFooterProps> = ({
  onBack,
  onNext,
  canProceed,
  backLabel = 'Back',
  nextLabel = 'Next',
  remainingCount = 0,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex items-center justify-between z-40">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-medium hover:bg-white/10 hover:border-white/25 transition-all duration-200"
      >
        <span>←</span>
        <span>{backLabel}</span>
      </button>

      {/* Progress Indicator */}
      {remainingCount > 0 && (
        <span className="text-sm text-gray-400">
          {remainingCount} question{remainingCount !== 1 ? 's' : ''} remaining
        </span>
      )}

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className={`
          flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-200
          ${canProceed 
            ? 'bg-gradient-to-r from-purple-600 to-violet-600 border-2 border-purple-400/50 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105' 
            : 'bg-gray-700 border border-gray-600 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <span>{nextLabel}</span>
        <span>→</span>
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 9. MODAL WRAPPER (For Solar & EV Config Popups)
// ═══════════════════════════════════════════════════════════════════════════════

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
  onSave?: () => void;
  saveLabel?: string;
}

export const ConfigModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  onSave,
  saveLabel = 'Apply Configuration',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/20 rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave?.();
              onClose();
            }}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 border-2 border-emerald-400/50 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>{saveLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. LOCATION INFO DISPLAY (For Modal Headers)
// ═══════════════════════════════════════════════════════════════════════════════

interface LocationInfoProps {
  location: { state: string; city?: string };
  sunData?: { sunnyDays: number; peakHours: string };
  rateData?: { rate: number; offPeakRate: number; peakHours: string };
}

export const LocationInfo: React.FC<LocationInfoProps> = ({
  location,
  sunData,
  rateData,
}) => {
  return (
    <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <span>📍</span>
        <span className="text-gray-300">Location:</span>
        <span className="text-white font-medium">
          {location.city ? `${location.city}, ` : ''}{location.state}
        </span>
      </div>
      
      {sunData && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <span>☀️</span>
            <span className="text-gray-300">Sun Exposure:</span>
            <span className="text-amber-400 font-medium">
              {sunData.sunnyDays} sunny days/year
            </span>
            <span className="text-emerald-400 text-xs">(Excellent)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>⏰</span>
            <span className="text-gray-300">Peak Hours:</span>
            <span className="text-white font-medium">{sunData.peakHours}</span>
          </div>
        </>
      )}
      
      {rateData && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <span>⚡</span>
            <span className="text-gray-300">Electricity Rate:</span>
            <span className="text-white font-medium">
              ${rateData.rate.toFixed(2)}/kWh
            </span>
            <span className="text-gray-400">
              (off-peak: ${rateData.offPeakRate.toFixed(2)}/kWh)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>⏰</span>
            <span className="text-gray-300">Peak Hours:</span>
            <span className="text-white font-medium">{rateData.peakHours}</span>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 11. IMPACT STATS ROW (For Modal Footers)
// ═══════════════════════════════════════════════════════════════════════════════

interface ImpactStat {
  value: string;
  label: string;
}

interface ImpactStatsProps {
  title?: string;
  stats: ImpactStat[];
}

export const ImpactStats: React.FC<ImpactStatsProps> = ({
  title = 'Estimated Impact',
  stats,
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type { 
  SolarConfig, 
  EVChargersConfig, 
  PanelOption 
};

export default {
  // Input Components
  PanelButtons,
  ToggleButtons,
  RangeSlider,
  CheckboxGrid,
  CleanInput,
  SearchableDropdown,
  SmartQuestion,
  
  // Power Boosters
  PowerBoostersPanel,
  ConfigModal,
  LocationInfo,
  ImpactStats,
  
  // Navigation
  NavFooter,
  
  // Constants
  GRADIENTS,
};
