/**
 * MERLIN GREETING COMPONENT (Unified Dec 21, 2025)
 * ==================================================
 * 
 * THE SINGLE Merlin guidance component for all wizard steps.
 * Replaces both MerlinGreeting and MerlinGuidancePanel.
 * 
 * Features:
 * - Merlin avatar with condensed "Merlin says:" format
 * - Step number badge
 * - Optional numbered instructions (1-2-3)
 * - Optional recommendation highlight (emerald)
 * - Optional pro tip (amber)
 * - Completion state
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle, Shield, Clock, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import wizardIcon from '@/assets/images/wizard_icon1.png';
// Image from public/images/ - served at root in Vite
const merlinProfile = '/images/new_profile_merlin.png';

export interface StepInstruction {
  text: string;
  highlight?: string;
}

export interface MerlinGreetingProps {
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  actionInstructions?: string[];
  nextStepPreview?: string;
  isComplete?: boolean;
  onCompleteMessage?: string;
  estimatedTime?: string;
  // Step 1 specific data
  state?: string;
  utilityRate?: number;
  solarOpportunity?: { rating: string; hours: number };
  savings?: { min: number; max: number };
  // Callback to open TrueQuote modal
  onOpenTrueQuote?: () => void;
  // NEW: Enhanced features (from MerlinGuidancePanel)
  acknowledgment?: string;
  instructions?: StepInstruction[];
  recommendation?: {
    title: string;
    content: React.ReactNode;
  };
  proTip?: {
    title: string;
    content: string;
  };
  showMerlinAvatar?: boolean;
  className?: string;
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
  // Enhanced features
  acknowledgment,
  instructions = [],
  recommendation,
  proTip,
  showMerlinAvatar = true,
  className = '',
}: MerlinGreetingProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Use enhanced instructions if provided, otherwise fall back to actionInstructions
  const displayInstructions: StepInstruction[] = instructions.length > 0 
    ? instructions 
    : actionInstructions.map(text => ({ text, highlight: undefined }));
  const hasInstructions = displayInstructions.length > 0;
  
  return (
    <div className={`mb-6 ${className}`}>
      {/* Compact Welcome Panel - Dec 21, 2025: Larger fonts, deeper purple */}
      <div
        className="w-full rounded-[24px] px-8 py-6 mb-4 relative overflow-hidden shadow-[0_12px_48px_rgba(91,33,182,0.5)] transition-all hover:shadow-[0_12px_56px_rgba(91,33,182,0.6)] cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #5B21B6 0%, #4C1D95 25%, #6D28D9 50%, #4C1D95 75%, #5B21B6 100%)'
        }}
        onClick={() => hasInstructions && setShowDetails(!showDetails)}
      >
        {/* Merlin Avatar - Floating Layer */}
        {showMerlinAvatar && (
          <div className="absolute left-6 bottom-0 w-[100px] h-[120px] z-[2] pointer-events-none">
            <img src={merlinProfile} alt="Merlin" className="w-full h-full object-contain object-bottom drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]" />
          </div>
        )}
        
        {/* Condensed Message Format - LARGER fonts Dec 21 */}
        <div className={`relative z-[1] ${showMerlinAvatar ? 'pl-[120px]' : 'pl-4'} pr-4`}>
          {/* Acknowledgment from previous step */}
          {acknowledgment && (
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
              <span className="text-emerald-200 font-bold text-base">{acknowledgment}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-3">
            <span className="text-white font-black text-xl tracking-tight">Merlin says:</span>
            {estimatedTime && (
              <span className="text-[#FDE047] text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {estimatedTime}
              </span>
            )}
            {hasInstructions && (
              <span className="ml-auto text-white/70 text-base flex items-center gap-1.5 font-medium">
                {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                {showDetails ? 'Less' : 'More'}
              </span>
            )}
          </div>
          <p className="text-white text-lg leading-relaxed font-semibold">
            {stepDescription}
          </p>
        </div>
      </div>
      
      {/* Step Badges - Below the panel */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="bg-[rgba(0,0,0,0.35)] backdrop-blur-sm px-4 py-2 rounded-[20px] text-[13px] font-bold flex items-center gap-2 whitespace-nowrap shadow-lg border border-white/10">
          <span className="text-[#FDE047]">Step {stepNumber} of {totalSteps}</span>
          <span className="text-white/60">•</span>
          <span className="text-white">{stepTitle}</span>
        </div>
        <div className="bg-[rgba(0,0,0,0.25)] backdrop-blur-sm px-3.5 py-1.5 rounded-2xl text-[12px] font-semibold flex items-center gap-2 text-[#FDE047] whitespace-nowrap shadow-lg border border-white/10">
          <span>⏱</span>
          <span>~5 minutes total</span>
        </div>
      </div>
      
      {/* Expandable Details Panel */}
      {showDetails && hasInstructions && (
        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
          {/* Numbered Instructions */}
          <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            Here's what to do:
          </h3>
          <div className={`grid grid-cols-1 ${displayInstructions.length >= 3 ? 'md:grid-cols-3' : displayInstructions.length === 2 ? 'md:grid-cols-2' : ''} gap-3 mb-4`}>
            {displayInstructions.map((instruction, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className={`w-8 h-8 rounded-full ${idx === displayInstructions.length - 1 ? 'bg-emerald-500' : 'bg-blue-500'} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {idx + 1}
                </div>
                <span className="text-white/90 text-sm" dangerouslySetInnerHTML={{ 
                  __html: typeof instruction === 'string' 
                    ? instruction 
                    : instruction.highlight 
                      ? instruction.text.replace(instruction.highlight, `<strong class="text-white">${instruction.highlight}</strong>`)
                      : instruction.text
                }} />
              </div>
            ))}
          </div>
          
          {/* Recommendation */}
          {recommendation && (
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 mb-3 border border-emerald-400/30">
              <h4 className="text-emerald-300 font-bold mb-1">{recommendation.title}</h4>
              <div className="text-white/90 text-sm">{recommendation.content}</div>
            </div>
          )}
          
          {/* Pro Tip */}
          {proTip && (
            <div className="bg-amber-500/20 rounded-xl p-4 border border-amber-400/30">
              <h4 className="text-amber-300 font-bold text-sm mb-1">{proTip.title}</h4>
              <p className="text-white/80 text-sm" dangerouslySetInnerHTML={{ __html: proTip.content }} />
            </div>
          )}
        </div>
      )}
      
      {/* Completion Message */}
      {onCompleteMessage && (
        <div className={`mt-3 rounded-xl p-4 border-2 ${
          isComplete 
            ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-emerald-400/50 shadow-md' 
            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 shadow-md'
        }`}>
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            ) : (
              <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0" />
            )}
            <p className={`text-base font-bold ${
              isComplete ? 'text-emerald-200' : 'text-blue-200'
            }`}>{onCompleteMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

