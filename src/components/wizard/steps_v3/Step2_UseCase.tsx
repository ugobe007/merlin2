/**
 * Step 2: Use Case Questions
 * Clean rebuild for V3 architecture
 */

import React from 'react';
import type { BaseStepProps } from '../SmartWizardV3.types';

interface Step2Props extends BaseStepProps {
  useCase: any;
  answers: Record<string, any>;
  onUpdateAnswers: (answers: Record<string, any>) => void;
  onOpenAdvancedQuoteBuilder?: () => void;
  onOpenBatteryConfigModal?: () => void;
}

const Step2_UseCase: React.FC<Step2Props> = ({
  useCase,
  answers,
  onUpdateAnswers,
  onNext,
  onBack,
  onOpenAdvancedQuoteBuilder,
  onOpenBatteryConfigModal
}) => {
  // Debug logging
  console.log('🎯 Step2_UseCase received useCase:', useCase);
  console.log('🎯 Step2_UseCase custom_questions:', useCase?.custom_questions);
  console.log('🎯 Step2_UseCase customQuestions:', useCase?.customQuestions);
  console.log('🎯 Step2_UseCase received ANSWERS:', answers);
  console.log('🎯 Step2_UseCase answers keys:', Object.keys(answers || {}));
  
  const handleInputChange = (questionId: string, value: any) => {
    onUpdateAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const customQuestions = useCase?.customQuestions || useCase?.custom_questions || [];
  console.log('🎯 customQuestions variable after extraction:', customQuestions);
  console.log('🎯 customQuestions.length:', customQuestions.length);
  console.log('🎯 Is customQuestions an array?', Array.isArray(customQuestions));
  
  const allAnswered = customQuestions.length === 0 || customQuestions.every((q: any) => 
    !q.required || (answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null)
  );

  // If no questions, show message
  if (customQuestions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {useCase?.name || 'Loading...'}
          </h2>
          <p className="text-gray-600">
            No additional information needed for this use case
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">
            This use case has all the information needed. Click Next to continue configuration.
          </p>
        </div>
        
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={onBack}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Next: Configuration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-4xl">🔧</span>
          <h2 className="text-3xl font-bold text-gray-900">
            Build Your Power Profile
          </h2>
        </div>
        <p className="text-gray-600 text-center text-lg mb-3">
          {useCase.name} - Tell us about your specific needs
        </p>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 max-w-3xl mx-auto shadow-sm">
          <p className="text-blue-900 font-semibold text-center text-lg mb-3">
            💡 <strong>What to do:</strong> Answer the questions below so Merlin can calculate the perfect battery system for your facility.
          </p>
          <p className="text-blue-800 text-center text-sm mb-4">
            These questions help us understand your facility's size, operating hours, and energy needs. This ensures accurate BESS sizing and financial projections.
          </p>
          <div className="flex justify-center">
            <div className="animate-bounce text-3xl">↓</div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {customQuestions.map((question: any) => {
          const currentValue = answers[question.id];
          console.log(`🔢 Rendering question "${question.id}": value=${currentValue}, type=${typeof currentValue}`);
          return (
          <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block mb-2">
              <span className="text-lg font-medium text-gray-900">
                {question.question || question.label}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </span>
              {question.helpText && (
                <span className="block text-sm text-gray-500 mt-1">
                  {question.helpText}
                </span>
              )}
            </label>

            {question.type === 'number' && (
              <input
                type="number"
                value={currentValue ?? ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleInputChange(question.id, val);
                  } else if (e.target.value === '') {
                    handleInputChange(question.id, '');
                  }
                }}
                min={question.min}
                max={question.max}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                placeholder={question.placeholder || question.default}
              />
            )}

            {question.type === 'text' && (
              <input
                type="text"
                value={answers[question.id] || ''}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                placeholder={question.placeholder}
              />
            )}

            {question.type === 'select' && (
              <select
                value={answers[question.id] || ''}
                onChange={(e) => handleInputChange(question.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                style={{ color: answers[question.id] ? '#111827' : '#6B7280' }}
              >
                <option value="" className="text-gray-500">Select an option...</option>
                {question.options?.map((opt: any) => {
                  // Handle both string arrays and object arrays {value, label}
                  const optValue = typeof opt === 'string' ? opt : opt.value;
                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <option key={optValue} value={optValue} className="text-gray-900">{optLabel}</option>
                  );
                })}
              </select>
            )}

            {question.type === 'boolean' && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange(question.id, true)}
                  className={`flex-1 px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                    answers[question.id] === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
                  }`}
                >
                  ✓ Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange(question.id, false)}
                  className={`flex-1 px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                    answers[question.id] === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-red-400'
                  }`}
                >
                  ✗ No
                </button>
              </div>
            )}

            {question.type === 'multiselect' && (
              <div className="space-y-2">
                {question.options?.map((opt: string) => (
                  <label key={opt} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(answers[question.id] || []).includes(opt)}
                      onChange={(e) => {
                        const currentValues = answers[question.id] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, opt]
                          : currentValues.filter((v: string) => v !== opt);
                        handleInputChange(question.id, newValues);
                      }}
                      className="rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Advanced Quote Builder Option - At bottom of questions */}
      {(onOpenAdvancedQuoteBuilder || onOpenBatteryConfigModal) && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-xl p-5 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔧</div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Need More Control?</h4>
                <p className="text-gray-600 text-sm">
                  Fine-tune your battery specs or use our full Advanced Quote Builder
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {onOpenBatteryConfigModal && (
                <button
                  onClick={onOpenBatteryConfigModal}
                  className="px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  <span>⚙️</span>
                  More Options
                </button>
              )}
              {onOpenAdvancedQuoteBuilder && (
                <button
                  onClick={onOpenAdvancedQuoteBuilder}
                  className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                  <span>⚡</span>
                  Full Builder
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t mt-8">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back
        </button>
        
        <button
          onClick={onNext}
          disabled={!allAnswered}
          className={`px-8 py-3 rounded-lg font-medium transition-all ${
            allAnswered
              ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next: Add Extras →
        </button>
      </div>
    </div>
  );
};

export default Step2_UseCase;
