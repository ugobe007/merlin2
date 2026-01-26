/**
 * Complete Question Renderer
 * 
 * Renders the appropriate input component for each question type
 * Production-ready implementation for Step 3 rebuild
 */

import React, { useState } from 'react';
import { PanelButtonGroup, SliderWithButtons, CheckboxGrid, NumberInput, ToggleButtons, RangeButtonGroup } from './v6/step3/inputs';
import { Info, Check } from 'lucide-react';
import type { Question } from '@/data/carwash-questions-complete.config';

interface CompleteQuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  allAnswers?: Record<string, any>;
  questionNumber?: number;
}

export function CompleteQuestionRenderer({
  question,
  value,
  onChange,
  allAnswers = {},
  questionNumber
}: CompleteQuestionRendererProps) {
  // ============================================================================
  // SMART CONDITIONAL DISPLAY (for database questions without explicit logic)
  // ============================================================================
  const fieldName = (question as any).fieldName || question.id || '';
  
  // Hide follow-up questions until parent is answered
  const conditionalFields: Record<string, { dependsOn: string; showWhen: (v: any) => boolean }> = {
    // Solar capacity only shows if user HAS existing solar
    'existingSolarKW': { dependsOn: 'hasExistingSolar', showWhen: (v) => v === true || v === 'true' || v === 'yes' },
    // EV charger count only shows if user HAS existing chargers
    'existingEVChargers': { dependsOn: 'hasExistingEV', showWhen: (v) => v === true || v === 'true' || v === 'yes' },
  };
  
  if (conditionalFields[fieldName]) {
    const { dependsOn, showWhen } = conditionalFields[fieldName];
    const parentValue = allAnswers[dependsOn];
    if (!showWhen(parentValue)) {
      return null; // Don't show until parent question is answered appropriately
    }
  }

  // ============================================================================
  // CONDITIONAL LOGIC HANDLING (for questions with explicit logic)
  // ============================================================================
  // Check if question should be shown
  if (question.conditionalLogic) {
    const dependentValue = allAnswers[question.conditionalLogic.dependsOn];
    if (!question.conditionalLogic.showIf(dependentValue)) {
      return null; // Don't render this question
    }
  }

  // Modify options based on conditional logic
  let modifiedOptions = question.options;
  if (question.conditionalLogic?.modifyOptions) {
    const dependentValue = allAnswers[question.conditionalLogic.dependsOn];
    const modifications = question.conditionalLogic.modifyOptions(dependentValue);
    if (modifications.enabledOptions || modifications.disabledOptions) {
      modifiedOptions = question.options?.map(opt => ({
        ...opt,
        disabled: modifications.disabledOptions?.includes(opt.value)
      }));
    }
  }

  // ============================================================================
  // QUESTION CONTAINER - Compact Professional Design
  // ============================================================================
  return (
    <div className="space-y-3">
      {/* Question Header */}
      <div className="space-y-2">
        {/* Section Tag & Number - Inline compact */}
        <div className="flex items-center gap-2">
          {questionNumber && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-violet-600/30">
              {questionNumber}
            </div>
          )}
          <span className="px-2 py-0.5 bg-violet-500/15 text-violet-300 text-xs font-medium rounded-full capitalize border border-violet-500/20">
            {question.section}
          </span>
        </div>

        {/* Title - More compact */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white leading-tight">
            {question.title}
          </h2>
          {/* REQUIRED badge - Make it OBVIOUS */}
          {(question as any).isRequired !== false && (question as any).tier !== 'detailed' && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold uppercase rounded border border-red-500/40">
              Required
            </span>
          )}
        </div>

        {/* Subtitle */}
        {question.subtitle && (
          <p className="text-sm text-slate-400">
            {question.subtitle}
          </p>
        )}

        {/* Help Text - Slimmer */}
        {question.helpText && (
          <div className="flex items-start gap-2 p-2 bg-blue-950/40 border border-blue-500/20 rounded-lg">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300/90">
              {question.helpText}
            </p>
          </div>
        )}

        {/* Merlin's Tip - Compact */}
        {question.merlinTip && (
          <div className="flex items-start gap-2 p-2.5 bg-purple-950/40 border border-purple-500/20 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm">🧙‍♂️</span>
            </div>
            <div>
              <div className="font-semibold text-purple-200 text-xs mb-0.5">Merlin's Tip</div>
              <p className="text-xs text-purple-300/90 leading-relaxed">
                {question.merlinTip}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Component */}
      <div className="pt-1">
        {renderInputComponent(question, value, onChange, modifiedOptions, allAnswers)}
      </div>
    </div>
  );
}

// ============================================================================
// INPUT COMPONENT RENDERER
// ============================================================================
function renderInputComponent(
  question: Question,
  value: any,
  onChange: (value: any) => void,
  options?: any[],
  allAnswers?: Record<string, any>
) {
  // Get fieldName for icon lookup
  const questionFieldName = (question as any).fieldName || question.id || '';
  
  switch (question.type) {
    // ========================================================================
    // BUTTONS - Standard button selection
    // ========================================================================
    case 'buttons':
      return (
        <PanelButtonGroup
          options={options || question.options || []}
          value={value || question.smartDefault}
          onChange={(newValue) => {
            if (import.meta.env.DEV) {
              console.log(`📝 [QuestionRenderer] onChange called:`, {
                questionId: question.id,
                questionType: question.type,
                questionField: questionFieldName,
                oldValue: value,
                newValue,
                willCallParentOnChange: typeof onChange === 'function'
              });
            }
            onChange(newValue);
          }}
          questionField={questionFieldName}
        />
      );

    // ========================================================================
    // AUTO CONFIRM - Auto-populated value with confirmation
    // ========================================================================
    case 'auto_confirm':
      if (question.conditionalLogic) {
        const dependsOnValue = allAnswers?.[question.conditionalLogic.dependsOn];
        const modifications = question.conditionalLogic.modifyOptions?.(dependsOnValue);
        
        if (modifications?.locked) {
          return (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-4 px-8 py-6 bg-slate-800/50 border-2 border-purple-500 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {modifications.autoValue}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm text-slate-400 mb-1">
                    {modifications.message}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    Standard configuration
                  </div>
                </div>
                <Check className="w-6 h-6 text-green-400" />
              </div>
              
              <button
                onClick={() => onChange(modifications.autoValue)}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
              >
                Confirm & Continue
              </button>
            </div>
          );
        } else {
          // Show number selector
          return (
            <NumberInput
              value={value || modifications?.autoValue || 1}
              onChange={onChange}
              min={modifications?.range?.min || 1}
              max={modifications?.range?.max || 10}
            />
          );
        }
      }
      break;

    // ========================================================================
    // HOURS GRID - Special grid layout for operating hours
    // ========================================================================
    case 'hours_grid':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {(options || question.options || []).map((option: any) => (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`
                  p-4 rounded-xl text-center transition-all
                  ${value === option.value
                    ? 'bg-purple-600 text-white scale-105 shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-102'
                  }
                `}
              >
                <div className="text-2xl font-bold mb-1">{option.label}</div>
                <div className="text-xs opacity-70">{option.description}</div>
              </button>
            ))}
          </div>
          
          {/* Category Labels */}
          <div className="flex flex-wrap gap-2 justify-center text-xs text-slate-500">
            <span>Half Day (6am-12pm)</span>
            <span>•</span>
            <span>Standard (8am-4pm)</span>
            <span>•</span>
            <span>Extended (7am-5pm)</span>
            <span>•</span>
            <span>Full Day (7am-7pm)</span>
            <span>•</span>
            <span>Long Hours (6am-10pm)</span>
            <span>•</span>
            <span>24/7 Operation</span>
          </div>
        </div>
      );

    // ========================================================================
    // SLIDER - Range selection with live value
    // CRITICAL: Range and suffix now come from database options JSON
    // ========================================================================
    case 'slider':
      return (
        <SliderWithButtons
          value={value ?? question.smartDefault ?? question.range?.min ?? 0}
          onChange={onChange}
          min={question.range?.min ?? 0}
          max={question.range?.max ?? 100}
          step={question.range?.step ?? 1}
          suffix={(question as any).suffix || ''}
        />
      );

    // ========================================================================
    // NUMBER INPUT - Smart selection based on range
    // For small ranges (< 100): Use +/- buttons
    // For large ranges (> 1000 or specific field types): Use text input with formatting
    // ========================================================================
    case 'number_input':
    case 'increment_box': {
      const range = question.range || { min: 0, max: 100 };
      const rangeSize = (range.max || 100) - (range.min || 0);
      const fieldName = (question as any).fieldName || '';
      const fieldLower = fieldName.toLowerCase();
      
      // Fields that should use formatted text input (not +/- buttons):
      // - Large ranges (> 500)
      // - Square footage fields
      // - Count fields for data centers, large facilities
      // - kW/MW capacity fields
      const isLargeRangeField = rangeSize > 500 || 
        fieldLower.includes('sqft') ||
        fieldLower.includes('square') ||
        fieldLower.includes('capacity') ||
        fieldLower.includes('area') ||
        fieldLower.includes('rack') ||        // covers rackCount, serverRacks
        fieldLower.includes('server') ||       // serverRacks, serverCount
        fieldLower.includes('itkw') ||
        fieldLower.includes('itloadkw') ||
        fieldLower.includes('itload') ||
        fieldLower.includes('watts') ||
        fieldLower.includes('kw') ||
        fieldLower.includes('mw') ||
        fieldLower.includes('density') ||      // rackDensityKW
        fieldLower.includes('feet') ||         // squareFeet
        fieldLower.includes('footage');        // totalFootage
      
      // Determine appropriate suffix based on field name
      const getSuffix = () => {
        if (fieldLower.includes('sqft') || fieldLower.includes('square') || fieldLower.includes('feet') || fieldLower.includes('footage')) return 'sq ft';
        if (fieldLower.includes('densitykw')) return 'kW/rack';
        if (fieldLower.includes('kw')) return 'kW';
        if (fieldLower.includes('mw')) return 'MW';
        if (fieldLower.includes('rack') || fieldLower.includes('server')) return 'racks';
        return '';
      };
      
      // Better placeholder based on field type
      const getPlaceholder = () => {
        if (fieldLower.includes('sqft') || fieldLower.includes('square') || fieldLower.includes('feet') || fieldLower.includes('footage')) return 'Enter square footage';
        if (fieldLower.includes('rack') || fieldLower.includes('server')) return 'Enter number of racks';
        if (fieldLower.includes('density')) return 'Enter kW per rack';
        if (fieldLower.includes('kw') || fieldLower.includes('itload')) return 'Enter kW capacity';
        return 'Enter value';
      };
        
      if (isLargeRangeField) {
        return (
          <div className="flex justify-center">
            <div className="relative w-72">
              <input
                type="text"
                inputMode="numeric"
                value={value ? Number(value).toLocaleString() : ''}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  const num = numericValue ? parseInt(numericValue, 10) : null;
                  if (num === null || (num >= (range.min || 0) && num <= (range.max || 10000000))) {
                    onChange(num);
                  }
                }}
                placeholder={getPlaceholder()}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-lg font-medium text-center focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 placeholder:text-slate-500"
              />
              {getSuffix() && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  {getSuffix()}
                </span>
              )}
            </div>
          </div>
        );
      }
      
      // Small range - use +/- buttons
      return (
        <div className="flex justify-center">
          <NumberInput
            value={value || question.smartDefault || 0}
            onChange={onChange}
            min={range.min || 0}
            max={range.max || 100}
          />
        </div>
      );
    }

    // ========================================================================
    // TOGGLE - Yes/No buttons (for boolean questions)
    // CRITICAL: Always store as boolean (true/false) for consistent calculations
    // ========================================================================
    case 'toggle':
      return (
        <div className="flex justify-center">
          <ToggleButtons
            value={value === true || value === 'true' || value === 'yes'}
            onChange={(v) => onChange(Boolean(v))}  // CRITICAL: Always store as boolean
            trueLabel="Yes"
            falseLabel="No"
          />
        </div>
      );

    // ========================================================================
    // RANGE BUTTONS - Discrete count ranges (chargers, bays, rooms, etc.)
    // Stores the MIN value of the selected range (e.g., "6-15" stores 6)
    // ========================================================================
    case 'range_buttons': {
      const rangeConfig = (question as any).rangeConfig;
      const defaultRanges = [
        { label: '1-5', min: 1, max: 5 },
        { label: '6-10', min: 6, max: 10 },
        { label: '11-20', min: 11, max: 20 },
        { label: '21-50', min: 21, max: 50 },
        { label: '50+', min: 51, max: null },
      ];
      return (
        <RangeButtonGroup
          ranges={rangeConfig?.ranges || defaultRanges}
          value={typeof value === 'number' ? value : null}
          onChange={(v) => onChange(v)}
          suffix={rangeConfig?.suffix}
        />
      );
    }

    // ========================================================================
    // CONDITIONAL BUTTONS - Buttons with enabled/disabled states
    // ========================================================================
    case 'conditional_buttons':
      return (
        <PanelButtonGroup
          options={options || question.options || []}
          value={value || question.smartDefault}
          onChange={onChange}
          questionField={questionFieldName}
        />
      );

    // ========================================================================
    // TYPE THEN QUANTITY - Two-step selection
    // ========================================================================
    case 'type_then_quantity':
      return <TypeThenQuantity question={question} value={value} onChange={onChange} />;

    // ========================================================================
    // EXISTING THEN PLANNED - Check existing, then ask about planned
    // ========================================================================
    case 'existing_then_planned':
      return <ExistingThenPlanned question={question} value={value} onChange={onChange} />;

    // ========================================================================
    // MULTISELECT - Multiple selections allowed
    // ========================================================================
    case 'multiselect':
      return (
        <CheckboxGrid
          options={question.options || []}
          value={value || question.smartDefault || []}
          onChange={onChange}
        />
      );

    // ========================================================================
    // DEFAULT - Fallback
    // ========================================================================
    default:
      return (
        <div className="p-6 bg-red-900/20 border border-red-500 rounded-xl text-center">
          <div className="text-red-400 font-semibold mb-2">
            ⚠️ Unknown Question Type
          </div>
          <div className="text-sm text-slate-400">
            Type: {question.type}
          </div>
        </div>
      );
  }
  // Explicit return to satisfy TypeScript
  // This line is technically unreachable but TypeScript requires it
  return null;
}

// ============================================================================
// TYPE THEN QUANTITY COMPONENT
// ============================================================================
function TypeThenQuantity({ question, value, onChange }: { question: Question; value: any; onChange: (value: any) => void }) {
  const [selectedType, setSelectedType] = useState(value?.type || null);
  const fieldName = (question as any).fieldName || question.id || '';

  if (!selectedType) {
    // Step 1: Select type
    return (
      <div className="space-y-4">
        <div className="text-center text-slate-400 mb-4">
          Step 1: Select Type
        </div>
        <PanelButtonGroup
          options={question.options || []}
          value={selectedType}
          onChange={(type) => {
            setSelectedType(type);
            onChange({ type, quantity: null });
          }}
          questionField={fieldName}
        />
      </div>
    );
  } else {
    // Step 2: Select quantity
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-sm text-slate-400 mb-2">Selected Type</div>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-600/20 border border-purple-500 rounded-xl">
            <span className="font-semibold text-white">
              {question.options?.find((o: any) => o.value === selectedType)?.label}
            </span>
            <button
              onClick={() => {
                setSelectedType(null);
                onChange({ type: null, quantity: null });
              }}
              className="text-purple-300 hover:text-white text-sm"
            >
              Change
            </button>
          </div>
        </div>

        <div className="text-center text-slate-400 mb-4">
          Step 2: Select Quantity
        </div>
        <PanelButtonGroup
          options={question.quantityOptions || []}
          value={value?.quantity}
          onChange={(quantity) => onChange({ type: selectedType, quantity })}
          questionField={fieldName}
        />
      </div>
    );
  }
}

// ============================================================================
// EXISTING THEN PLANNED COMPONENT
// ============================================================================
function ExistingThenPlanned({ question, value, onChange }: { question: Question; value: any; onChange: (value: any) => void }) {
  const [hasExisting, setHasExisting] = useState(
    value?.hasExisting !== undefined ? value.hasExisting : null
  );
  const fieldName = (question as any).fieldName || question.id || '';

  if (hasExisting === null) {
    // Step 1: Check for existing
    return (
      <div className="space-y-4">
        <div className="text-center text-slate-400 mb-4">
          Do you have existing infrastructure?
        </div>
        <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
          <button
            onClick={() => {
              setHasExisting(false);
              onChange({ hasExisting: false, existing: null, planned: null });
            }}
            className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl text-white transition-all"
          >
            No existing infrastructure
          </button>
          <button
            onClick={() => {
              setHasExisting(true);
              onChange({ hasExisting: true, existing: {}, planned: null });
            }}
            className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl text-white transition-all"
          >
            Yes, we have existing chargers
          </button>
        </div>
      </div>
    );
  } else if (hasExisting) {
    // Show existing infrastructure form
    return (
      <div className="space-y-6">
        <div className="text-center text-slate-400 mb-4">
          Select existing chargers
        </div>
        {question.existingOptions?.map((option: any) => 
          option.quantityRange && (
            <div key={option.value} className="p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-white">{option.label}</div>
                  <div className="text-sm text-slate-400">{option.description}</div>
                </div>
              </div>
              <NumberInput
                value={value?.existing?.[option.value] || 0}
                onChange={(qty) => onChange({
                  ...value,
                  existing: { ...value.existing, [option.value]: qty }
                })}
                min={option.quantityRange.min}
                max={option.quantityRange.max}
                // step prop removed (not supported)
              />
            </div>
          )
        )}
      </div>
    );
  } else {
    // Show planned options
    return (
      <div className="space-y-4">
        <div className="text-center text-slate-400 mb-4">
          Any stations planned?
        </div>
        <PanelButtonGroup
          options={question.plannedOptions || []}
          value={value?.planned}
          onChange={(planned) => onChange({ ...value, planned })}
          questionField={fieldName}
        />
      </div>
    );
  }
}

export default CompleteQuestionRenderer;
