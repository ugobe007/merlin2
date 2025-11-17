import React from 'react';
import AISquareFootageCalculator from './AISquareFootageCalculator';
import type { Question } from '@/data/industryQuestionnaires';

interface QuestionRendererProps {
  question: Question;
  value: any;
  selectedIndustry: string;
  useCaseData: { [key: string]: any };
  onChange: (questionId: string, value: any) => void;
}

/**
 * Reusable component for rendering different question types
 * in the wizard Step 2 use case questionnaires
 * 
 * Supports:
 * - number: Numeric input with optional suffix and AI calculator
 * - select: Single-select dropdown
 * - multi-select: Checkbox group for multiple selections
 * 
 * Handles conditional rendering based on other field values
 */
const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  selectedIndustry,
  useCaseData,
  onChange,
}) => {
  // Check if question should be shown based on conditional logic
  const shouldShowQuestion = (): boolean => {
    if (!question.conditional) return true;

    const { field, operator, value: conditionalValue, dependsOn } = question.conditional;

    // Handle dependsOn syntax (legacy)
    if (dependsOn) {
      const dependentValue = useCaseData[dependsOn];
      return dependentValue === conditionalValue;
    }

    // Handle field + operator syntax
    if (field && operator !== undefined) {
      const fieldValue = useCaseData[field];
      
      switch (operator) {
        case '>':
          return parseFloat(fieldValue) > conditionalValue;
        case '==':
          return fieldValue === conditionalValue;
        case '<':
          return parseFloat(fieldValue) < conditionalValue;
        case '>=':
          return parseFloat(fieldValue) >= conditionalValue;
        default:
          return true;
      }
    }

    return true;
  };

  if (!shouldShowQuestion()) {
    return null;
  }

  const handleInputChange = (newValue: any) => {
    onChange(question.id, newValue);
  };

  // Render based on question type
  switch (question.type) {
    case 'number':
      const isSquareFootage = question.id === 'squareFootage';
      return (
        <div
          key={question.id}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-blue-400 transition-colors"
        >
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {question.label}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleInputChange(parseFloat(e.target.value) || 0)}
              placeholder={question.placeholder}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:border-blue-500"
            />
            {question.suffix && (
              <span className="text-gray-600 font-medium">{question.suffix}</span>
            )}
            {isSquareFootage && (
              <AISquareFootageCalculator 
                onCalculate={(sqft: number) => handleInputChange(sqft)}
                industryType={selectedIndustry}
              />
            )}
          </div>
          {isSquareFootage && !value && (
            <p className="text-sm text-gray-500 mt-2">
              💡 Don't know your square footage? Use the AI calculator to estimate it!
            </p>
          )}
        </div>
      );

    case 'select':
      return (
        <div
          key={question.id}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-blue-400 transition-colors"
        >
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {question.label}
          </label>
          <select
            value={value || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select an option...</option>
            {question.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'multi-select':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div
          key={question.id}
          className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200"
        >
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            {question.label}
          </label>
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, opt.value]
                      : selectedValues.filter((v) => v !== opt.value);
                    handleInputChange(newValues);
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default QuestionRenderer;
