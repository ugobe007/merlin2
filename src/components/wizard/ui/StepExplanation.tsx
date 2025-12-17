/**
 * StepExplanation.tsx
 * 
 * Step header with progress indicator and explanation box.
 * REQUIRED at the top of every wizard step.
 * 
 * DO NOT skip step explanations - users need guidance.
 * 
 * @created December 2025
 */

import React from 'react';
import { Lightbulb, Clock } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface StepExplanationProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  estimatedTime?: string;
  icon?: React.ReactNode;
  showProgress?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StepExplanation({
  stepNumber,
  totalSteps,
  title,
  description,
  estimatedTime,
  icon,
  showProgress = true,
  className = '',
}: StepExplanationProps) {
  const progressPercentage = (stepNumber / totalSteps) * 100;
  
  return (
    <div className={`mb-8 ${className}`}>
      {/* Progress Indicator */}
      {showProgress && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
            Step {stepNumber} of {totalSteps}
          </span>
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-500">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}
      
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        {title}
      </h1>
      
      {/* Explanation Box */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex items-start gap-4">
        <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
          {icon || <Lightbulb className="w-6 h-6 text-purple-600" />}
        </div>
        <div className="flex-1">
          <p className="text-gray-700 leading-relaxed">{description}</p>
          {estimatedTime && (
            <p className="text-sm text-purple-600 mt-2 font-medium flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Estimated time: {estimatedTime}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepExplanation;
