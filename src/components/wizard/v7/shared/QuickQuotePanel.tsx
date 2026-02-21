/**
 * Quick Quote Panel — Three entry points to get a quote
 * 
 * WHY users choose each path:
 * - WIZARD: "I don't know what size system I need" → Answer questions, get recommendation
 * - PROQUOTE: "I already know my specs" → Direct input, advanced customization
 * - UPLOAD: "I have a utility bill" → AI extracts data, auto-calculates sizing
 * 
 * All powered by TrueQuote™ (source-verified calculations)
 * 
 * Design: Compact inline links, centered TrueQuote, clear WHY statements
 */

import React from "react";
import { ArrowRight } from "lucide-react";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";

interface QuickQuotePanelProps {
  onStartExpress: (mode: "custom" | "ballpark" | "bill-upload") => void;
  onStartGuided: () => void;
}

export function QuickQuotePanel({ onStartExpress, onStartGuided }: QuickQuotePanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <img 
              src="/images/new_profile_merlin.png" 
              alt="Merlin AI" 
              className="w-16 h-16 rounded-full object-cover"
            />
            <h1 className="text-4xl font-bold text-white">
              Merlin Wizard
            </h1>
          </div>

          {/* TrueQuote Centered */}
          <div className="flex items-center justify-center gap-3">
            <img 
              src={badgeGoldIcon} 
              alt="TrueQuote Verified" 
              className="w-12 h-12 object-contain drop-shadow-lg"
            />
            <div className="text-center">
              <div className="text-base font-bold text-amber-400">Powered by TrueQuote™</div>
              <div className="text-xs text-slate-400">Source-verified calculations • NREL • EIA • IRA 2022</div>
            </div>
          </div>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get a BESS quote in minutes. Choose how you want to start:
          </p>
        </div>

        {/* Three Options - Inline Text Links */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Option 1: Guided Wizard - Recommended */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 hover:border-[#3ECF8E]/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">I don't know what size system I need</h3>
                  <span className="text-xs font-semibold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Answer 16 questions about your facility. Merlin calculates the optimal battery size based on your usage, peak demand, and goals.
                </p>
                <button
                  onClick={onStartGuided}
                  className="inline-flex items-center text-[#3ECF8E] font-semibold hover:underline"
                >
                  Start Guided Wizard <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: ProQuote - I Know My Specs */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">I already know my system specs</h3>
                  <img 
                    src={badgeProQuoteIcon} 
                    alt="ProQuote" 
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Enter your exact kW/kWh requirements. Get advanced equipment configuration, detailed financial modeling, and full customization control.
                </p>
                <button
                  onClick={() => onStartExpress("custom")}
                  className="inline-flex items-center text-blue-400 font-semibold hover:underline"
                >
                  Open ProQuote™ <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Option 3: Upload Bill - Coming Soon */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 opacity-60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">I have a utility bill</h3>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-700/30 px-2 py-0.5 rounded-full">Coming Q2 2026</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Upload your PDF utility bill. Merlin's AI extracts your usage data, peak demand, and rate structure to auto-calculate optimal sizing.
                </p>
                <span className="inline-flex items-center text-slate-500 font-semibold cursor-not-allowed">
                  Upload Bill (Coming Soon) <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </div>
          </div