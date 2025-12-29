/**
 * StepExplanation.tsx
 * 
 * Step header with progress indicator and Merlin's guidance.
 * REQUIRED at the top of every wizard step.
 * 
 * DO NOT skip step explanations - users need guidance.
 * 
 * @created December 2025
 * @updated December 17, 2025 - Enhanced with Merlin guidance and tips
 */

import React from 'react';
import { Lightbulb, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import merlinImage from '@/assets/images/new_profile_merlin.png';

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
  /** Merlin's helpful tips for this step */
  tips?: string[];
  /** What user will accomplish in this step */
  outcomes?: string[];
  /** Show Merlin avatar */
  showMerlin?: boolean;
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
  tips = [],
  outcomes = [],
  showMerlin = true,
}: StepExplanationProps) {
  const progressPercentage = (stepNumber / totalSteps) * 100;
  
  return (
    <div className={`mb-8 ${className}`}>
      {/* Progress Indicator - WHITE text for dark wizard background */}
      {showProgress && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm font-semibold text-[#cc89ff] uppercase tracking-wide">
            Step {stepNumber} of {totalSteps}
          </span>
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#6700b6] to-[#68BFFA] rounded-full transition-all duration-500"
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
      
      {/* Merlin's Guidance Box - Enhanced with Merlin palette */}
      <div className="bg-gradient-to-br from-[#6700b6]/30 to-[#060F76]/40 backdrop-blur-sm border-4 border-[#6700b6] rounded-2xl p-5 shadow-xl">
        {/* Header with Merlin */}
        <div className="flex items-start gap-4 mb-4">
          {showMerlin && (
            <div className="flex-shrink-0">
              <div className="relative">
                <img src={merlinImage} alt="Merlin" className="w-14 h-14" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#ffa600] rounded-full flex items-center justify-center border-2 border-[#6700b6]">
                  <Lightbulb className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#ffa600] font-bold text-sm">Merlin says:</span>
              {estimatedTime && (
                <span className="text-[#cc89ff] text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {estimatedTime}
                </span>
              )}
            </div>
            <p className="text-white/90 leading-relaxed">{description}</p>
          </div>
        </div>
        
        {/* Tips Section */}
        {tips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#ad42ff]/40">
            <h4 className="text-[#ffa600] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Pro Tips
            </h4>
            <ul className="space-y-1.5">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#cc89ff]">
                  <ArrowRight className="w-3 h-3 mt-1 text-[#68BFFA] flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Outcomes Section */}
        {outcomes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#ad42ff]/40">
            <h4 className="text-[#68BFFA] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              What You'll Configure
            </h4>
            <div className="flex flex-wrap gap-2">
              {outcomes.map((outcome, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-[#060F76]/40 rounded-full text-xs text-white/80 border border-[#4b59f5]/40"
                >
                  {outcome}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepExplanation;
