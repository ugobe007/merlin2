/**
 * MerlinGuide - Floating wizard assistant
 * RIGHT SIDE, AUTO-DISMISSES AFTER 5 SECONDS
 * 
 * Updated: December 28, 2025
 */
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Minus, Lightbulb } from 'lucide-react';
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
    title: "Boost Your ROI! 💰",
    message: "Based on your location, I've scored these add-on opportunities for you.",
    tip: "High-scoring options can significantly improve your payback period!"
  },
  5: {
    title: "Your Perfect Fit",
    message: "I've calculated three system options based on everything you've told me.",
    tip: "The recommended option balances cost and capability for most businesses."
  },
  6: {
    title: "Your Quote is Ready! 🎊",
    message: "Here's your personalized BESS quote with TrueQuote™ verified pricing.",
    tip: "Download the PDF to share with stakeholders!"
  }
};

export function MerlinGuide({ step, industry, state }: MerlinGuideProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasAutoHidden, setHasAutoHidden] = useState(false);

  const stepInfo = STEP_MESSAGES[step] || STEP_MESSAGES[1];

  // Auto-hide after 5 seconds on first load
  useEffect(() => {
    if (!hasAutoHidden && isVisible && !isMinimized) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
        setHasAutoHidden(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [hasAutoHidden, isVisible, isMinimized]);

  // Reset visibility when step changes (but stay minimized if user minimized)
  useEffect(() => {
    if (hasAutoHidden) {
      // Keep minimized state but show the minimized button
      setIsVisible(true);
    }
  }, [step]);

  if (!isVisible) return null;

  // Minimized state - just show Merlin avatar button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed top-24 right-4 z-40 group"
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-md group-hover:bg-purple-500/50 transition-all" />
          
          {/* Avatar */}
          <div className="relative w-14 h-14 rounded-full border-2 border-purple-400 overflow-hidden bg-gradient-to-br from-purple-600 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform">
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          {/* Notification dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-2.5 h-2.5 text-amber-900" />
          </div>
        </div>
      </button>
    );
  }

  // Full expanded state
  return (
    <div className="fixed top-24 right-4 z-40 w-80 animate-in slide-in-from-right duration-300">
      {/* Card */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-purple-900/50 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-full border-2 border-purple-400 overflow-hidden bg-gradient-to-br from-purple-600 to-cyan-600">
              <img 
                src={merlinImage} 
                alt="Merlin" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold">Merlin</h3>
              <p className="text-purple-300 text-xs">Your Energy Advisor</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
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

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <h4 className="text-white font-semibold">{stepInfo.title}</h4>
          </div>
          
          {/* Message */}
          <p className="text-slate-300 text-sm leading-relaxed">
            {stepInfo.message}
          </p>

          {/* Tip box */}
          {stepInfo.tip && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-purple-200 text-sm">
                  <span className="text-amber-400 font-medium">Tip:</span> {stepInfo.tip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step 
                    ? 'w-6 bg-gradient-to-r from-cyan-400 to-purple-400' 
                    : s < step
                      ? 'w-3 bg-purple-500'
                      : 'w-3 bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MerlinGuide;
