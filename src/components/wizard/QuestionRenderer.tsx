import React from 'react';
import type { Question } from '@/data/carwash-questions.config';
import { CheckboxGrid } from '../v6/step3/inputs';

interface QuestionRendererProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  showValidation?: boolean;
}

export function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  showValidation = false 
}: QuestionRendererProps) {
  return (
    <div className="question-container">
      {/* Question Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
          {question.question}
        </h2>
        {question.helpText && (
          <p className="text-slate-400 text-sm md:text-base">
            {question.helpText}
          </p>
        )}
      </div>

      {/* Question Input - Rendered by Type */}
      <div className="question-input mb-6">
        {question.type === 'buttons' && (
          <ButtonsQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'slider' && (
          <SliderQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'number_buttons' && (
          <NumberButtonsQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'toggle' && (
          <ToggleQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'area_input' && (
          <AreaInputQuestion 
            question={question} 
            value={value} 
            onChange={onChange} 
          />
        )}
        
        {question.type === 'checkbox' && question.options && (
          <CheckboxGrid
            options={question.options}
            value={(value as string[]) || []}
            onChange={(values: string[]) => onChange(values)}
          />
        )}
      </div>

      {/* Merlin Tip (Optional) */}
      {question.merlinTip && (
        <div className="merlin-tip bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 text-2xl">🧙‍♂️</div>
            <div>
              <div className="text-purple-300 text-sm font-medium mb-1">
                Merlin's Tip
              </div>
              <div className="text-slate-300 text-sm">
                {question.merlinTip}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {showValidation && !value && (
        <div className="mt-4 text-red-400 text-sm">
          This field is required
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BUTTONS QUESTION
// ============================================================================

function ButtonsQuestion({ question, value, onChange }: QuestionRendererProps) {
  const options = question.options || [];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              min-h-[96px] p-5 rounded-xl border-2 transition-all
              flex flex-col items-start text-left
              ${isSelected 
                ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20' 
                : 'bg-slate-800 border-slate-700 hover:border-purple-500/50 hover:bg-slate-750'
              }
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              {option.icon && (
                <span className="text-3xl">{option.icon}</span>
              )}
              <span className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                {option.label}
              </span>
            </div>
            {option.description && (
              <span className="text-sm text-slate-400 mt-1">
                {option.description}
              </span>
            )}
            {isSelected && (
              <div className="ml-auto mt-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SLIDER QUESTION
// ============================================================================

function SliderQuestion({ question, value, onChange }: QuestionRendererProps) {
  const range = question.range!;
  const currentValue = value || question.smartDefault;
  
  // Calculate percentage for gradient
  const percentage = ((currentValue - range.min) / (range.max - range.min)) * 100;
  
  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="text-center">
        <div className="text-6xl font-bold text-white mb-2">
          {currentValue.toLocaleString()}
        </div>
        {question.unit && (
          <div className="text-xl text-slate-400">
            {question.unit}
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="relative px-2">
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={currentValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              rgb(168 85 247) 0%, 
              rgb(99 102 241) ${percentage}%, 
              rgb(30 41 59) ${percentage}%, 
              rgb(30 41 59) 100%)`
          }}
        />
        
        {/* Min/Max Labels */}
        <div className="flex justify-between text-sm text-slate-500 mt-2">
          <span>{range.min}</span>
          <span>{range.max}</span>
        </div>
      </div>

      {/* Quick Select Buttons (Optional) */}
      {getQuickSelectValues(range).length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {getQuickSelectValues(range).map((quickValue) => (
            <button
              key={quickValue}
              onClick={() => onChange(quickValue)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${currentValue === quickValue
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }
              `}
            >
              {quickValue}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper: Generate quick select values for common ranges
function getQuickSelectValues(range: { min: number; max: number; step: number }): number[] {
  const span = range.max - range.min;
  
  // For small ranges, show all values
  if (span <= 20) {
    return [];
  }
  
  // For larger ranges, show quartiles
  const quartile = span / 4;
  return [
    range.min,
    Math.round(range.min + quartile),
    Math.round(range.min + quartile * 2),
    Math.round(range.min + quartile * 3),
    range.max
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates
}

// ============================================================================
// NUMBER BUTTONS QUESTION
// ============================================================================

function NumberButtonsQuestion({ question, value, onChange }: QuestionRendererProps) {
  const options = question.options || [];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              h-20 rounded-xl border-2 transition-all font-semibold text-lg
              ${isSelected
                ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:bg-slate-750'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// TOGGLE QUESTION
// ============================================================================

function ToggleQuestion({ question, value, onChange }: QuestionRendererProps) {
  const options = question.options || [
    { value: 'yes', label: 'Yes', icon: '✅' },
    { value: 'no', label: 'No', icon: '❌' }
  ];
  
  return (
    <div className="flex gap-4 justify-center max-w-md mx-auto">
      {options.map((option) => {
        const isSelected = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 h-32 rounded-xl border-2 transition-all
              flex flex-col items-center justify-center gap-3
              ${isSelected
                ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:bg-slate-750'
              }
            `}
          >
            {option.icon && (
              <span className="text-4xl">{option.icon}</span>
            )}
            <span className="text-xl font-semibold">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// AREA INPUT QUESTION
// ============================================================================

function AreaInputQuestion({ question, value, onChange }: QuestionRendererProps) {
  const defaultValue = question.smartDefault || { value: '', unit: 'sqft' };
  const currentValue = value || defaultValue;
  
  const handleValueChange = (newValue: string) => {
    onChange({
      ...currentValue,
      value: newValue
    });
  };
  
  const handleUnitChange = (newUnit: 'sqft' | 'sqm') => {
    onChange({
      ...currentValue,
      unit: newUnit
    });
  };
  
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Number Input */}
      <div className="relative">
        <input
          type="number"
          value={currentValue.value}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter area"
          className="
            w-full h-20 px-6 text-3xl font-bold text-white text-center
            bg-slate-800 border-2 border-slate-700 rounded-xl
            focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20
            transition-all
          "
        />
      </div>

      {/* Unit Toggle */}
      <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => handleUnitChange('sqft')}
          className={`
            flex-1 py-3 rounded-lg font-semibold transition-all
            ${currentValue.unit === 'sqft'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          Square Feet (sq ft)
        </button>
        <button
          onClick={() => handleUnitChange('sqm')}
          className={`
            flex-1 py-3 rounded-lg font-semibold transition-all
            ${currentValue.unit === 'sqm'
              ? 'bg-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-300'
            }
          `}
        >
          Square Meters (sq m)
        </button>
      </div>

      {/* Conversion Helper */}
      {currentValue.value && (
        <div className="text-center text-sm text-slate-400">
          {currentValue.unit === 'sqft' 
            ? `≈ ${(Number(currentValue.value) / 10.764).toFixed(0)} sq m`
            : `≈ ${(Number(currentValue.value) * 10.764).toFixed(0)} sq ft`
          }
        </div>
      )}
    </div>
  );
}
