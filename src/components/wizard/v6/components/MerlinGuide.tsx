/**
 * MerlinGuide - Floating wizard assistant
 * Provides contextual guidance for each step
 */
import React, { useState } from 'react';
import { X, MessageCircle, Sparkles } from 'lucide-react';
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    );
  }

  const stepData = STEP_MESSAGES[step] || STEP_MESSAGES[1];

  let contextMessage = stepData.message;
  if (step === 2 && industry) {
    contextMessage = `Great choice! ${industry} facilities typically see 20-40% energy savings with BESS.`;
  }
  if (step === 4 && state) {
    contextMessage = `Based on ${state}'s solar potential and EV adoption, here are my recommendations.`;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="relative group"
        >
          <img 
            src={merlinImage} 
            alt="Merlin" 
            className="w-16 h-16 rounded-full border-3 border-purple-400 shadow-lg object-cover hover:scale-110 transition-transform"
          />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-purple-900" />
          </div>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Click for guidance
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 px-4 py-3 flex items-center justify-between border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
            />
            <div>
              <h3 className="text-white font-bold text-sm">Merlin</h3>
              <p className="text-purple-300 text-xs">Your Energy Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Minimize"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
              </svg>
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-semibold text-sm">{stepData.title}</p>
              <p className="text-slate-300 text-sm mt-1">{contextMessage}</p>
            </div>
          </div>

          {stepData.tip && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <p className="text-purple-300 text-xs">
                <span className="font-semibold text-purple-400">💡 Tip:</span> {stepData.tip}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 pb-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s === step ? 'bg-purple-500' : s < step ? 'bg-purple-500/50' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
