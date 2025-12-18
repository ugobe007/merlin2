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
      {/* Progress Indicator - WHITE text for dark wizard background */}
      {showProgress && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
            Step {stepNumber} of {totalSteps}
          </span>
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-white/80">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}
      
      {/* Title - WHITE text for dark wizard background */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
        {title}
      </h1>
      
      {/* Explanation Box - Semi-transparent for dark background */}
      <div className="bg-white/10 backdrop-blur-sm border-2 border-purple-400/40 rounded-xl p-4 flex items-start gap-4">
        <div className="p-2 bg-purple-500/30 rounded-lg flex-shrink-0">
          {icon || <Lightbulb className="w-6 h-6 text-purple-300" />}
        </div>
        <div className="flex-1">
          <p className="text-purple-100 leading-relaxed">{description}</p>
          {estimatedTime && (
            <p className="text-sm text-purple-300 mt-2 font-medium flex items-center gap-1">
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
