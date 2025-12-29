/**
 * MerlinGuide - Floating wizard assistant
 * UPPER RIGHT CORNER, COLLAPSIBLE, SLIDE-IN FROM RIGHT
 * 
 * Updated: December 28, 2025
 */
import React, { useState } from 'react';
import { X, Sparkles, ChevronRight, ChevronLeft, Minus } from 'lucide-react';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface MerlinGuideProps {
  step: number;
  industry?: string;
  state?: string;
}

const STEP_MESSAGES: Record<number, { title: string; message: string; tip?: string }> = {
  1: {
    title: "Welcome! 🎉",
    message: "I'm Merlin, your energy advisor. Let's find the perfect energy solution for your business.",
    tip: "Enter your ZIP code and I'll show you solar potential for your area!"
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
    title: "Boost Your Savings! ⚡",
    message: "Based on your location, here are some add-ons that could maximize your investment.",
    tip: "Solar + BESS is a powerful combo in sunny states!"
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

export function MerlinGuide({ step, industry, state }: MerlinGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const stepData = STEP_MESSAGES[step] || STEP_MESSAGES[1];

  // Dynamic context messages
  let contextMessage = stepData.message;
  if (step === 2 && industry) {
    contextMessage = `Great choice! ${industry} facilities typically see 20-40% energy savings with BESS.`;
  }
  if (step === 4 && state) {
    contextMessage = `Based on ${state}'s solar potential and incentives, here are my recommendations.`;
  }

  // Hidden state - show small button to bring back
  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="fixed bottom-28 left-4 z-40 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform group border-2 border-purple-400"
        title="Show Merlin"
      >
        <img 
          src={merlinImage} 
          alt="Merlin" 
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="w-4 h-4 text-purple-900" />
        </div>
      </button>
    );
  }

  // Collapsed state - compact pill on right
  if (isCollapsed) {
    return (
      <div className="fixed top-24 right-4 z-40">
        <button
          onClick={() => setIsCollapsed(false)}
          className="relative group flex items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-900 rounded-full pr-5 pl-1.5 py-1.5 border border-purple-500/40 shadow-xl hover:border-purple-400 transition-all hover:shadow-purple-500/20"
        >
          <img 
            src={merlinImage} 
            alt="Merlin" 
            className="w-14 h-14 rounded-full border-2 border-purple-400 object-cover"
          />
          <div className="flex items-center gap-2">
            <span className="text-purple-300 font-semibold">Merlin</span>
            <ChevronLeft className="w-5 h-5 text-purple-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-900" />
          </div>
        </button>
      </div>
    );
  }

  // Expanded state - full panel on RIGHT
  return (
    <div className="fixed top-24 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] animate-in slide-in-from-right duration-300">
      <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/20 px-5 py-4 flex items-center justify-between border-b border-purple-500/20">
          <div className="flex items-center gap-4">
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-14 h-14 rounded-full border-2 border-purple-400 object-cover shadow-lg"
            />
            <div>
              <p className="text-white font-bold text-lg">Merlin</p>
              <p className="text-purple-300 text-sm">Your Energy Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsHidden(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-bold text-base">{stepData.title}</p>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">{contextMessage}</p>
            </div>
          </div>

          {stepData.tip && (
            <div className="bg-purple-500/15 border border-purple-500/30 rounded-xl p-4">
              <p className="text-purple-200 text-sm">
                <span className="font-bold text-amber-400">💡 Tip:</span> {stepData.tip}
              </p>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="px-5 pb-4">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  s === step 
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500' 
                    : s < step 
                      ? 'bg-purple-500/60' 
                      : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
