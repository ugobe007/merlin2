/**
 * MERLIN GUIDANCE PANEL - Reusable Component
 * ===========================================
 * 
 * A consistent header panel for each wizard step featuring:
 * - Merlin avatar with step-specific icon
 * - Acknowledgment of previous step completion
 * - Step instructions (1-2-3 numbered)
 * - Optional recommendation highlight (emerald)
 * - Pro tip section (amber)
 * - Step indicator (X of Y)
 * 
 * Created: Dec 21, 2025
 * Purpose: Extract inline MERLIN GUIDANCE PANEL pattern into reusable component
 */

import React from 'react';
import { 
  Check, Sparkles, Wand2, MapPin, Building2, Settings, 
  FileText, Battery, Gauge, Sun, Wind, Zap, Target,
  type LucideIcon
} from 'lucide-react';

// Step icons mapping
const STEP_ICONS: Record<number, LucideIcon> = {
  0: MapPin,      // Location
  1: Building2,   // Industry
  2: Settings,    // Facility Details
  3: Battery,     // Configuration
  4: FileText,    // Results
};

export interface StepInstruction {
  text: string;
  highlight?: string; // Bold text within the instruction
}

export interface RecommendationHighlight {
  icon?: LucideIcon;
  title: string;
  content: React.ReactNode;
}

export interface ProTip {
  icon?: LucideIcon;
  title: string;
  content: string;
}

export interface MerlinGuidancePanelProps {
  /** Current step number (0-indexed) */
  stepNumber: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step label shown in indicator (e.g., "Location", "Industry") */
  stepLabel: string;
  /** Acknowledgment message from previous step (shown with green checkmark) */
  acknowledgment?: string;
  /** Main heading for this step */
  heading: string;
  /** Subheading/description */
  subheading?: string;
  /** 1-2-3 step instructions */
  instructions?: StepInstruction[];
  /** Optional recommendation highlight (emerald section) */
  recommendation?: RecommendationHighlight;
  /** Optional pro tip (amber section) */
  proTip?: ProTip;
  /** Custom icon to override default step icon */
  customIcon?: LucideIcon;
  /** Show Merlin avatar image instead of icon */
  showMerlinAvatar?: boolean;
  /** Additional className for styling (e.g., margin) */
  className?: string;
}

export function MerlinGuidancePanel({
  stepNumber,
  totalSteps,
  stepLabel,
  acknowledgment,
  heading,
  subheading,
  instructions = [],
  recommendation,
  proTip,
  customIcon,
  showMerlinAvatar = false,
  className = '',
}: MerlinGuidancePanelProps) {
  const StepIcon = customIcon || STEP_ICONS[stepNumber] || Wand2;
  
  return (
    <div className={`bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 shadow-xl border border-indigo-400/30 ${className}`}>
      {/* Top Row: Avatar + Acknowledgment + Heading */}
      <div className="flex items-start gap-5 mb-5">
        {/* Avatar/Icon */}
        <div className="flex-shrink-0">
          {showMerlinAvatar ? (
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20">
              <img 
                src="/images/new_profile_merlin.png" 
                alt="Merlin" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-[#6700b6] to-[#060F76] rounded-2xl flex items-center justify-center shadow-lg">
              <StepIcon className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          {/* Acknowledgment from previous step */}
          {acknowledgment && (
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-semibold text-sm">
                {acknowledgment}
              </span>
            </div>
          )}
          
          {/* Heading */}
          <h2 className="text-2xl font-black text-white mb-2">
            {heading}
          </h2>
          
          {/* Subheading */}
          {subheading && (
            <p className="text-white/90">
              {subheading}
            </p>
          )}
        </div>
      </div>
      
      {/* Step Instructions (1-2-3 boxes) */}
      {instructions.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            Here's what to do on this page:
          </h3>
          <div className={`grid grid-cols-1 ${instructions.length >= 3 ? 'md:grid-cols-3' : instructions.length === 2 ? 'md:grid-cols-2' : ''} gap-3`}>
            {instructions.map((instruction, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className={`w-8 h-8 rounded-full ${idx === instructions.length - 1 ? 'bg-emerald-500' : 'bg-blue-500'} flex items-center justify-center text-white font-bold text-sm`}>
                  {idx + 1}
                </div>
                <span className="text-white/90 text-sm" dangerouslySetInnerHTML={{ 
                  __html: instruction.highlight 
                    ? instruction.text.replace(instruction.highlight, `<strong>${instruction.highlight}</strong>`)
                    : instruction.text
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendation Highlight (emerald) */}
      {recommendation && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 mb-5 border border-emerald-400/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
              {recommendation.icon ? (
                <recommendation.icon className="w-5 h-5 text-emerald-300" />
              ) : (
                <Battery className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-emerald-300 font-bold mb-1">{recommendation.title}</h4>
              <div className="text-white/90 text-sm">
                {recommendation.content}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Pro Tip (amber) */}
      {proTip && (
        <div className="bg-amber-500/20 rounded-2xl p-4 border border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center flex-shrink-0">
              {proTip.icon ? (
                <proTip.icon className="w-5 h-5 text-amber-300" />
              ) : (
                <Gauge className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div>
              <h4 className="text-amber-300 font-bold text-sm mb-1">{proTip.title}</h4>
              <p className="text-white/80 text-sm" dangerouslySetInnerHTML={{ __html: proTip.content }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mt-5">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
          <span className="text-amber-300 font-bold text-sm">Step {stepNumber + 1} of {totalSteps}</span>
          <span className="text-white/50">•</span>
          <span className="text-white/80 text-sm">{stepLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default MerlinGuidancePanel;
