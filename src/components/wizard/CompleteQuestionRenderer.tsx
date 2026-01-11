/**
 * Complete Question Renderer
 * 
 * Renders the appropriate input component for each question type
 * Production-ready implementation for Step 3 rebuild
 */

import React, { useState } from 'react';
import { PanelButtonGroup, SliderWithButtons, CheckboxGrid, NumberInput } from './v6/step3/inputs';
import { Info, AlertCircle, Check } from 'lucide-react';
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
  // CONDITIONAL LOGIC HANDLING
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
  // QUESTION CONTAINER
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="space-y-3">
        {/* Section Tag & Number */}
        <div className="flex items-center gap-3">
          {questionNumber && (
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {questionNumber}
            </div>
          )}
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full capitalize">
            {question.section}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-white">
          {question.title}
        </h2>

        {/* Subtitle */}
        {question.subtitle && (
          <p className="text-lg text-slate-400">
            {question.subtitle}
          </p>
        )}

        {/* Help Text */}
        {question.helpText && (
          <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              {question.helpText}
            </p>
          </div>
        )}

        {/* Merlin's Tip */}
        {question.merlinTip && (
          <div className="flex items-start gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">🧙‍♂️</span>
            </div>
            <div>
              <div className="font-semibold text-purple-200 mb-1">Merlin's Tip</div>
              <p className="text-sm text-purple-300">
                {question.merlinTip}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Component */}
      <div className="py-4">
        {renderInputComponent(question, value, onChange, modifiedOptions, allAnswers)}
      </div>

      {/* Validation Feedback */}
      {question.validation?.required && !value && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>This question is required</span>
        </div>
      )}
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
  switch (question.type) {
    // ========================================================================
    // BUTTONS - Standard button selection
    // ========================================================================
    case 'buttons':
      return (
        <PanelButtonGroup
          options={options || question.options || []}
          value={value || question.smartDefault}
          onChange={onChange}
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
    // ========================================================================
    case 'slider':
      return (
        <SliderWithButtons
          value={value || question.smartDefault}
          onChange={onChange}
          min={question.range?.min || 0}
          max={question.range?.max || 100}
          step={question.range?.step || 1}
        />
      );

    // ========================================================================
    // NUMBER INPUT - +/- controls
    // ========================================================================
    case 'number_input':
    case 'increment_box':
      return (
        <div className="flex justify-center">
          <NumberInput
            value={value || question.smartDefault || 0}
            onChange={onChange}
            min={question.range?.min || 0}
            max={question.range?.max || 100}
          />
        </div>
      );

    // ========================================================================
    // TOGGLE - On/Off switch
    // ========================================================================
    case 'toggle':
      return (
        <div className="flex justify-center">
          <div className="flex items-center gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            <span className="text-white font-medium">No</span>
            <button
              onClick={() => onChange(!value)}
              className={`
                relative w-16 h-8 rounded-full transition-colors
                ${value ? 'bg-purple-600' : 'bg-slate-600'}
              `}
            >
              <div className={`
                absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform
                ${value ? 'translate-x-8' : 'translate-x-0'}
              `} />
            </button>
            <span className="text-white font-medium">Yes</span>
          </div>
        </div>
      );

    // ========================================================================
    // CONDITIONAL BUTTONS - Buttons with enabled/disabled states
    // ========================================================================
    case 'conditional_buttons':
      return (
        <PanelButtonGroup
          options={options || question.options || []}
          value={value || question.smartDefault}
          onChange={onChange}
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
}

// ============================================================================
// TYPE THEN QUANTITY COMPONENT
// ============================================================================
function TypeThenQuantity({ question, value, onChange }: { question: Question; value: any; onChange: (value: any) => void }) {
  const [selectedType, setSelectedType] = useState(value?.type || null);

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
        />
      </div>
    );
  }
}

export default CompleteQuestionRenderer;
