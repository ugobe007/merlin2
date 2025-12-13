/**
 * WIZARD PROGRESS INDICATOR
 * 
 * Visual progress indicator showing current step and completion status.
 * Used in wizard header to show user where they are in the flow.
 * 
 * Dependencies: None (pure UI component)
 * Used by: StreamlinedWizard header
 */

import React from 'react';
import { Check } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface WizardStep {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: string[];
  onStepClick?: (stepIndex: number) => void;
  /** Allow clicking on any step (vs only completed ones) */
  allowJumpAhead?: boolean;
  /** Visual variant */
  variant?: 'dots' | 'pills' | 'numbered';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WizardProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  allowJumpAhead = false,
  variant = 'pills',
}: WizardProgressProps) {
  if (variant === 'dots') {
    return (
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => (
          <ProgressDot
            key={step.id}
            isActive={idx === currentStep}
            isCompleted={completedSteps.includes(step.id)}
            onClick={onStepClick && (allowJumpAhead || completedSteps.includes(step.id)) 
              ? () => onStepClick(idx) 
              : undefined}
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'numbered') {
    return (
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const canClick = onStepClick && (allowJumpAhead || isCompleted || idx < currentStep);
          
          return (
            <React.Fragment key={step.id}>
              <button
                onClick={canClick ? () => onStepClick(idx) : undefined}
                disabled={!canClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                } ${canClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </button>
              {idx < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  completedSteps.includes(steps[idx + 1].id) || idx < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  
  // Default: pills variant
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentStep;
        const isCompleted = completedSteps.includes(step.id);
        const canClick = onStepClick && (allowJumpAhead || isCompleted || idx < currentStep);
        
        return (
          <button
            key={step.id}
            onClick={canClick ? () => onStepClick(idx) : undefined}
            disabled={!canClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-white text-purple-600 shadow-md'
                : isCompleted
                  ? 'bg-purple-500/80 text-white'
                  : 'bg-purple-700/50 text-purple-200'
            } ${canClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// PROGRESS DOT (simpler variant)
// ============================================

export interface ProgressDotProps {
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
}

export function ProgressDot({ isActive, isCompleted, onClick }: ProgressDotProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-3 h-3 rounded-full transition-all ${
        isActive
          ? 'bg-purple-500 scale-125'
          : isCompleted
            ? 'bg-emerald-500'
            : 'bg-gray-300'
      } ${onClick ? 'cursor-pointer hover:scale-150' : 'cursor-default'}`}
    />
  );
}

export default WizardProgress;
