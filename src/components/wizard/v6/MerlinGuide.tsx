/**
 * MerlinGuide - Floating wizard assistant (LEFT SIDE, COLLAPSIBLE)
 * Provides contextual guidance for each step
 * 
 * Updated: December 28, 2025
 * - Moved to left side
 * - Click to collapse/expand
 * - Smoother animations
 */
import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import merlinImage from '@/assets/images/new_small_profile_.png';

import type { EnergyGoal } from './types';

interface MerlinGuideProps {
  step: number;
  industry?: string;
  state?: string;
  goals?: EnergyGoal[];
  sunHours?: number;
  electricityRate?: number;
  solarRating?: string;
}

// Goal-specific insights for Step 1
const GOAL_INSIGHTS: Record<EnergyGoal, { benefit: string; preview: string }> = {
  reduce_costs: {
    benefit: "Cut 20-40% off energy bills",
    preview: "I'll calculate exact savings in Step 5"
  },
  backup_power: {
    benefit: "8-24 hours backup during outages",
    preview: "We'll size your backup in Step 4"
  },
  sustainability: {
    benefit: "Reduce carbon footprint 40-60%",
    preview: "Solar + BESS = maximum green impact"
  },
  grid_independence: {
    benefit: "60-80% energy self-sufficiency",
    preview: "I'll design your independence roadmap"
  },
  peak_shaving: {
    benefit: "Eliminate 30-50% of demand charges",
    preview: "BESS handles this automatically"
  },
  generate_revenue: {
    benefit: "Earn $3K-15K/year from grid services",
    preview: "We'll explore revenue options in Step 4"
  }
};

const STEP_MESSAGES: Record<number, { title: string; message: string; tip?: string }> = {
  1: {
    title: "Welcome! 🎉",
    message: "I'm Merlin, your energy advisor. Let's find the perfect energy solution for your business.",
    tip: "Enter your ZIP code and select your goals - I'll preview your potential!"
  },
  2: {
    title: "Choose Your Industry",
    message: "Different industries have unique energy needs. Select yours so I can customize your recommendation.",
    tip: "Car washes and data centers are great candidates for battery storage!"
  },
  3: {
    title: "Tell Me About Your Facility",
    message: "The more details you share, the more accurate your quote will be.",
    tip: "Don't worry about exact numbers - estimates work great!"
  },
  4: {
    title: "Customize Your System ⚡",
    message: "Based on your facility, here are add-ons that maximize your goals.",
    tip: "I'll calculate exact sizing for each option you choose!"
  },
  5: {
    title: "Choose Your Power Level",
    message: "I've calculated three options for you. Each balances cost, savings, and backup duration differently.",
    tip: "PERFECT FIT is my recommendation for most businesses."
  },
  6: {
    title: "Your Quote is Ready! ✨",
    message: "Here's your personalized energy storage quote. This is an estimate - request an official quote for exact pricing.",
    tip: "The 30% Federal ITC makes now a great time to invest!"
  }
};

export function MerlinGuide({ step, industry, state, goals, sunHours, electricityRate, solarRating: _solarRating }: MerlinGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Hidden state - show small button to bring back
  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="fixed top-24 left-4 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform group"
        title="Show Merlin"
      >
        <img 
          src={merlinImage} 
          alt="Merlin" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-purple-900" />
        </div>
      </button>
    );
  }

  const stepData = STEP_MESSAGES[step] || STEP_MESSAGES[1];

  // Dynamic context messages based on step and available data
  let contextMessage = stepData.message;
  let dynamicTip = stepData.tip;
  
  // Step 1: Location + Goals awareness
  if (step === 1) {
    if (goals && goals.length >= 2 && state) {
      contextMessage = `Great choices! Based on your goals, I'm already planning your ${sunHours && sunHours >= 5 ? 'solar + BESS' : 'BESS + backup'} strategy for ${state}.`;
      
      // Pick most relevant tip based on goals
      if (goals.includes('reduce_costs') || goals.includes('peak_shaving')) {
        dynamicTip = electricityRate && electricityRate > 0.12 
          ? `With ${state}'s high rates ($${electricityRate?.toFixed(3)}/kWh), BESS pays for itself fast!`
          : "I'll calculate your exact savings after we learn about your facility.";
      } else if (goals.includes('sustainability')) {
        dynamicTip = sunHours && sunHours >= 5 
          ? `${state} gets ${sunHours} hrs/day of sun - solar will crush your carbon footprint!`
          : "Even with moderate sun, solar + BESS cuts emissions significantly.";
      } else if (goals.includes('backup_power')) {
        dynamicTip = "We'll size your backup system in Step 4 based on your critical loads.";
      } else if (goals.includes('generate_revenue')) {
        dynamicTip = "I'll show you grid services and arbitrage opportunities in Step 4!";
      }
    } else if (goals && goals.length > 0) {
      contextMessage = `Good start! Select ${2 - goals.length} more goal${goals.length === 1 ? '' : 's'} so I can tailor your solution.`;
    } else if (state) {
      contextMessage = `${state} has great energy potential! Now tell me your goals so I can start planning.`;
    }
  }
  
  if (step === 2 && industry) {
    contextMessage = `Great choice! ${industry} facilities typically see 20-40% energy savings with BESS.`;
  }
  if (step === 4 && state) {
    contextMessage = `Based on ${state}'s solar potential and incentives, here are my recommendations.`;
  }

  // Collapsed state - just show Merlin avatar
  if (isCollapsed) {
    return (
      <div className="fixed top-24 left-4 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative group flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 rounded-full pr-4 pl-1 py-1 border border-purple-500/30 shadow-xl hover:border-purple-400 transition-all"
        >
          <img 
            src={merlinImage} 
            alt="Merlin" 
            className="w-12 h-12 rounded-full border-2 border-purple-400 object-cover"
          />
          <div className="flex items-center gap-1">
            <span className="text-purple-300 text-sm font-medium">Merlin</span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-3 h-3 text-purple-900" />
          </div>
        </button>
      </div>
    );
  }

  // Expanded state - full panel
  return (
    <div className="fixed top-24 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] animate-in slide-in-from-left duration-300">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-4 py-3 flex items-center justify-between border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
            />
            <div>
              <p className="text-white font-semibold text-sm">Merlin</p>
              <p className="text-purple-300 text-xs">Energy Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Collapse"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsHidden(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Hide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-semibold text-sm">{stepData.title}</p>
              <p className="text-slate-300 text-sm mt-1">{contextMessage}</p>
            </div>
          </div>

          {dynamicTip && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <p className="text-purple-300 text-xs">
                <span className="font-semibold text-purple-400">💡 Pro Tip:</span> {dynamicTip}
              </p>
            </div>
          )}
          
          {/* Goal Preview Section - Only on Step 1 when goals are selected */}
          {step === 1 && goals && goals.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <p className="text-xs text-slate-400 font-medium">📋 Your Goals Preview:</p>
              {goals.slice(0, 3).map((goal) => {
                const insight = GOAL_INSIGHTS[goal];
                return insight ? (
                  <div key={goal} className="flex items-start gap-2">
                    <span className="text-green-400 text-xs">✓</span>
                    <div className="text-xs">
                      <span className="text-slate-200">{insight.benefit}</span>
                      <span className="text-slate-500 ml-1">— {insight.preview}</span>
                    </div>
                  </div>
                ) : null;
              })}
              {goals.length > 3 && (
                <p className="text-xs text-slate-500">+{goals.length - 3} more goals...</p>
              )}
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="px-4 pb-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s === step 
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500' 
                    : s < step 
                      ? 'bg-purple-500/50' 
                      : 'bg-white/5'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-slate-500 text-xs mt-2">Step {step} of 6</p>
        </div>

        {/* Click to collapse hint */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-full py-2 bg-white/5 text-slate-500 text-xs hover:text-slate-300 hover:bg-white/5 transition-colors border-t border-white/10"
        >
          Click to minimize
        </button>
      </div>
    </div>
  );
}
