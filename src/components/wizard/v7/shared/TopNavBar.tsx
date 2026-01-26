/**
 * Top Navigation Bar (Vineet's Design)
 * 
 * Features:
 * - Home button (Merlin logo)
 * - Start Over button
 * - 7-step pills with completion indicators
 * - Step counter
 */

import React from 'react';

interface TopNavBarProps {
  currentStep: number;
  goToStep: (step: number) => void;
}

const stepNames = ['Location', 'Goals', 'Industry', 'Details', 'Options', 'System', 'Quote'];

export default function TopNavBar({ currentStep, goToStep }: TopNavBarProps) {
  return (
    <div className="flex justify-between items-center px-6 py-2.5 border-b border-white/5 shrink-0">
      
      {/* Left: Home & Start Over */}
      <div className="flex items-center gap-4">
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => goToStep(1)}
        >
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
            <span className="text-lg">🏠</span>
          </div>
          <span className="text-sm font-semibold text-white">Merlin Home</span>
        </div>
        
        <div 
          className="flex items-center gap-2.5 cursor-pointer" 
          onClick={() => goToStep(1)}
        >
          <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <span className="text-base text-orange-500">↻</span>
          </div>
          <span className="text-sm font-semibold text-orange-500">Start Over</span>
        </div>
      </div>

      {/* Center: Step Navigation Pills */}
      <div className="flex items-center gap-1">
        {stepNames.map((name, i) => {
          const stepNum = i + 1;
          let bgClass = '';
          let textClass = 'text-slate-600';
          
          if (stepNum < currentStep) {
            bgClass = 'bg-green-500/15';
            textClass = 'text-green-500';
          } else if (stepNum === currentStep) {
            bgClass = 'bg-purple-600';
            textClass = 'text-white font-medium';
          }
          
          return (
            <div
              key={name}
              className={`px-3.5 py-1.5 rounded-md text-xs cursor-pointer transition-all ${bgClass} ${textClass}`}
              onClick={() => stepNum <= currentStep && goToStep(stepNum)}
            >
              {name}{stepNum < currentStep && ' ✓'}
            </div>
          );
        })}
      </div>

      {/* Right: Step Counter */}
      <span className="text-xs text-slate-500">Step {currentStep} of 7</span>
    </div>
  );
}
