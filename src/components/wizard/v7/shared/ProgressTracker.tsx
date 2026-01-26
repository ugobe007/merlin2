/**
 * Progress Tracker Component
 * 
 * Visual progress indicator showing current step and completion
 */

import React from 'react';
import { Check } from 'lucide-react';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressTracker({ 
  currentStep, 
  totalSteps 
}: ProgressTrackerProps) {
  
  const steps = [
    { id: 0, name: 'Welcome', short: 'Welcome' },
    { id: 1, name: 'Opportunity', short: 'Value' },
    { id: 2, name: 'Details', short: 'Details' },
    { id: 3, name: 'Configure', short: 'Config' },
    { id: 4, name: 'Results', short: 'Results' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isFuture = step.id > currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-medium transition-all
                  ${isComplete ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-100' : ''}
                  ${isFuture ? 'bg-gray-200 text-gray-500' : ''}
                `}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{step.id + 1}</span>
                )}
              </div>
              
              {/* Step Label (Desktop Only) */}
              <span className={`
                hidden sm:inline ml-2 text-sm font-medium
                ${isCurrent ? 'text-gray-900' : 'text-gray-500'}
              `}>
                {step.short}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-8 h-0.5 transition-all
                  ${isComplete ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
