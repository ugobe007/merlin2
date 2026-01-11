/**
 * Complete Question Renderer - FIXED TypeScript Errors
 * 
 * Fixed:
 * - Missing return statement in renderInputComponent
 * - Removed invalid 'step' prop from NumberInput
 * - Removed invalid 'unit' prop from SliderWithButtons
 */

import React, { useState } from 'react';
import {
  ButtonGroup,
  SliderWithButtons,
  NumberInput,
  Toggle,
  RadioCards,
  Dropdown
} from '@/components/inputs/QuestionInputComponents';
import { CompleteSolarPreviewCard } from './CompleteSolarPreviewCard';
import { Check, Info, AlertCircle } from 'lucide-react';

interface QuestionRendererProps {
  question: any;
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
}: QuestionRendererProps) {
  // Check conditional logic
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
      modifiedOptions = question.options?.map((opt: any) => ({
        ...opt,
        disabled: modifications.disabledOptions?.includes(opt.value)
      }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
            {questionNumber || question.id || '?'}
          </div>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
            {question.section}
          </span>
        </div>

        <h2 className="text-3xl font-bold text-white">
          {question.title || question.question}
        </h2>

        {question.subtitle && (
          <p className="text-lg text-slate-400">
            {question.subtitle}
          </p>
        )}

        {question.helpText && (
          <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-300">
              {question.helpText}
            </p>
          </div>
        )}

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
        {renderInputComponent(question, value, onChange, modifiedOptions)}
      </div>

      {/* Solar Preview */}
      {question.id === 'roofArea' && value > 0 && (
        <CompleteSolarPreviewCard
          roofArea={value}
          carportArea={allAnswers.carportArea || 0}
          carportInterest={allAnswers.carportInterest}
        />
      )}

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
// FIXED: Added return type and default return
// ============================================================================
function renderInputComponent(
): React.ReactNode {  value: any,
  onChange: (value: any) => void,
  options?: any[]
): React.ReactNode {  // ← FIXED: Added return type
  switch (question.type) {
    case 'buttons':
      return (
        <ButtonGroup
          options={options || question.options || []}
          value={value || question.smartDefault}
          onChange={onChange}
          columns={question.columns || 2}
          size="md"
        />
      );

    case 'auto_confirm':
      if (question.conditionalLogic) {
        const modifications = question.conditionalLogic.modifyOptions(value);
        
        if (modifications.locked) {
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
          return (
            <NumberInput
              value={value || modifications.autoValue || 1}
              onChange={onChange}
              min={modifications.range?.min || 1}
              max={modifications.range?.max || 10}
              // FIXED: Removed 'step' prop - not supported by NumberInput
              unit={question.unit}
              size="lg"
            />
          );
        }
      }
      // FIXED: Added return for auto_confirm without conditionalLogic
      return null;

    case 'hours_grid':
      return (
        <div className="grid grid-cols-7 gap-2">
          {(options || question.options || []).map((option: any) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`
                p-4 rounded-xl text-center transition-all
                ${value === option.value
                  ? 'bg-purple-600 text-white scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }
              `}
            >
              <div className="text-2xl font-bold mb-1">{option.label}</div>
              <div className="text-xs opacity-70">{option.description}</div>
            </button>
          ))}
        </div>
      );

    case 'slider':
      return (
        <SliderWithButtons
          value={value || question.smartDefault}
          onChange={onChange}
          min={question.range?.min || 0}
          max={question.range?.max || 100}
          // FIXED: Removed 'unit' prop - not supported by SliderWithButtons
          // FIXED: Removed 'step' prop
        />
      );

    case 'number_input':
      return (
        <NumberInput
          value={value || question.smartDefault || 0}
          onChange={onChange}
          min={question.range?.min || 0}
          max={question.range?.max || 100}
          // FIXED: Removed 'step' prop
          unit={question.unit}
          size="lg"
        />
      );

    case 'increment_box':
      return (
        <div className="flex justify-center">
          <NumberInput
            value={value || question.smartDefault || 0}
            onChange={onChange}
            min={question.range?.min || 0}
            max={question.range?.max || 100}
            unit={question.unit}
            size="md"
          />
        </div>
      );

    case 'toggle':
      return (
        <div className="flex justify-center">
          <Toggle
            value={value || question.smartDefault || false}
            onChange={onChange}
            label={question.toggleLabel}
            description={question.toggleDescription}
            size="lg"
          />
        </div>
      );

    case 'conditional_buttons':
    case 'multiselect':
      return (
        <ButtonGroup
          options={options || question.options || []}
          value={value || question.smartDefault || []}
          onChange={onChange}
          multiSelect={question.type === 'multiselect'}
          columns={2}
          size="md"
        />
      );

    // FIXED: Added default case to ensure all paths return
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
  // FIXED: Added fallback return (should never reach here due to default case)
  return null;
}

export default CompleteQuestionRenderer;
