/**
 * MERLIN GUIDE - Shared Wizard Advisor Component
 * ===============================================
 * 
 * Fixed position advisor that appears on all wizard steps.
 * Provides context-aware guidance to users.
 * 
 * Created: January 2026
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import merlinIcon from '@/assets/images/new_profile_merlin.png';

interface MerlinGuideProps {
  message: string;
  defaultVisible?: boolean;
}

export function MerlinGuide({ message, defaultVisible = true }: MerlinGuideProps) {
  const [visible, setVisible] = useState(defaultVisible);

  if (!visible) {
    // Show minimized button to re-open
    return (
      <button
        onClick={() => setVisible(true)}
        className="fixed z-50 left-6 bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-110 transition-transform"
        title="Open Merlin Advisor"
      >
        <img src={merlinIcon} alt="Merlin" className="w-12 h-12 rounded-full" />
      </button>
    );
  }

  return (
    <div 
      className="fixed z-50"
      style={{ left: '24px', bottom: '100px', maxWidth: '320px' }}
    >
      <div className="bg-slate-800 border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/20 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">Merlin</span>
            <span className="text-amber-100 text-sm">Energy Advisor</span>
          </div>
          <button 
            onClick={() => setVisible(false)} 
            className="text-white/80 hover:text-white"
            title="Minimize"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 flex gap-3">
          <img 
            src={merlinIcon} 
            alt="Merlin" 
            className="w-14 h-14 rounded-full border-2 border-amber-500 flex-shrink-0" 
          />
          <div>
            <p className="text-white text-sm leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step-specific messages
export const MERLIN_MESSAGES = {
  step1: "👋 Welcome! Enter your zip code to get started. Add your street address for personalized recommendations - we'll identify your business and tailor your energy solution. Select at least 2 goals to continue.",
  step2: "🏢 Great! Now select the industry that best describes your facility. This helps me tailor recommendations specifically for your sector.",
  step3: "📋 Perfect! Now I need some details about your facility. The more accurate your inputs, the better I can size your energy system.",
  step4: "⚡ Time to customize! You can add solar panels, EV charging, and backup generators. I'll show you recommended options based on your facility.",
  step5: "✨ Here's where the magic happens! I've analyzed your data and created optimized scenarios. Compare them to find your best fit.",
  step6: "🎉 Your TrueQuote™ is ready! Review your complete energy solution with detailed pricing and savings projections.",
};

export default MerlinGuide;
