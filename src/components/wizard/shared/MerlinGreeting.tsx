/**
 * MERLIN GREETING COMPONENT
 * ==========================
 * 
 * Consistent greeting and instructions at the top of each wizard step.
 * Apple-like: Simple, clear, actionable.
 * 
 * Features:
 * - Step number and total steps
 * - High-level 5-step process overview
 * - Step-specific action instructions
 * - Next step preview
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle, Shield, Clock, Lightbulb } from 'lucide-react';
import wizardIcon from '@/assets/images/wizard_icon1.png';
// Image from public/images/ - served at root in Vite
const merlinProfile = '/images/new_profile_merlin.png';

export interface MerlinGreetingProps {
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  actionInstructions?: string[];
  nextStepPreview?: string;
  isComplete?: boolean;
  onCompleteMessage?: string;
  // Condensed format: "Merlin says: 2-3 min" + brief explanation
  estimatedTime?: string; // e.g., "2-3 min"
  // Step 1 specific data
  state?: string;
  utilityRate?: number;
  solarOpportunity?: { rating: string; hours: number };
  savings?: { min: number; max: number };
  // Callback to open TrueQuote modal
  onOpenTrueQuote?: () => void;
}

export function MerlinGreeting({
  stepNumber,
  totalSteps,
  stepTitle,
  stepDescription,
  actionInstructions = [],
  nextStepPreview,
  isComplete = false,
  onCompleteMessage,
  estimatedTime = '2-3 min',
  state,
  utilityRate,
  solarOpportunity,
  savings,
  onOpenTrueQuote,
}: MerlinGreetingProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="mb-6">
      {/* Compact Welcome Panel - Condensed Format */}
      <div
        className="w-full rounded-[20px] px-6 py-4 mb-4 relative overflow-hidden shadow-[0_8px_32px_rgba(91,33,182,0.4)] transition-all hover:shadow-[0_8px_40px_rgba(91,33,182,0.5)]"
        style={{
          background: 'linear-gradient(to right, #22D3EE 0%, #6366F1 50%, #8B5CF6 75%, #5B21B6 100%)'
        }}
      >
        {/* Merlin Avatar - Floating Layer */}
        <div className="absolute left-5 bottom-0 w-[90px] h-[110px] z-[2] pointer-events-none">
          <img src={merlinProfile} alt="Merlin" className="w-full h-full object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
        </div>
        
        {/* Condensed Message Format - Larger Fonts */}
        <div className="relative z-[1] pl-[110px] pr-4">
          <div className="flex items-center gap-3 mb-2.5">
            <span className="text-white font-bold text-lg">Merlin says:</span>
            {estimatedTime && (
              <span className="text-[#FDE047] text-base font-semibold flex items-center gap-1.5">
                <Clock className="w-5 h-5" />
                {estimatedTime}
              </span>
            )}
          </div>
          <p className="text-white text-base leading-relaxed font-medium">
            {stepDescription}
          </p>
        </div>
        
        {/* Clickable overlay for expand/collapse (if actionInstructions provided) */}
        {actionInstructions.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="absolute inset-0 z-[3] cursor-pointer"
            aria-label="Toggle details"
          ></button>
        )}
      </div>
      
      {/* Step Badges - Below the panel, out of the way */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="bg-[rgba(0,0,0,0.35)] backdrop-blur-sm px-4 py-2 rounded-[20px] text-[13px] font-bold flex items-center gap-2 whitespace-nowrap shadow-lg border border-white/10">
          <span className="text-[#FDE047]">Step {stepNumber} of {totalSteps}</span>
          <span className="text-white/60">•</span>
          <span className="text-white">{stepTitle}</span>
        </div>
        <div className="bg-[rgba(0,0,0,0.25)] backdrop-blur-sm px-3.5 py-1.5 rounded-2xl text-[12px] font-semibold flex items-center gap-2 text-[#FDE047] whitespace-nowrap shadow-lg border border-white/10">
          <span>⏱</span>
          <span>~5 minutes</span>
        </div>
      </div>
      
      {/* Expandable Details Panel */}
      {showDetails && actionInstructions.length > 0 && (
        <div className="mt-3 bg-white rounded-xl p-5 border-2 border-[#475569]/20 shadow-lg">
          <h3 className="text-[#475569] font-bold text-base mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ffa600]" />
            Quick guide:
          </h3>
          <div className="space-y-3">
            {actionInstructions.map((instruction, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#475569] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-[#475569] font-semibold text-base flex-1 leading-relaxed">{instruction}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Completion Message - Always show if provided (even if not complete) */}
      {onCompleteMessage && (
        <div className={`mt-3 rounded-xl p-4 border-2 ${
          isComplete 
            ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300 shadow-md' 
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-md'
        }`}>
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-emerald-700 flex-shrink-0" />
            ) : (
              <Sparkles className="w-6 h-6 text-blue-700 flex-shrink-0" />
            )}
            <p className={`text-base font-bold ${
              isComplete ? 'text-emerald-900' : 'text-blue-900'
            }`}>{onCompleteMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

