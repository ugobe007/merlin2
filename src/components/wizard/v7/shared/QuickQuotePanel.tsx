/**
 * Quick Quote Panel — Two paths: Wizard or ProQuote
 * 
 * Clarifies the choice:
 * - WIZARD: Guided experience with TrueQuote™ verification
 * - PROQUOTE: Advanced configuration for power users
 * 
 * Both powered by TrueQuote™ engine (source-verified calculations)
 * 
 * Design: Clear service hierarchy, larger text, proper icons
 */

import React, { useState } from "react";
import { Building2, Settings, ArrowRight } from "lucide-react";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";

interface QuickQuotePanelProps {
  onStartExpress: (mode: "custom" | "ballpark" | "bill-upload") => void;
  onStartGuided: () => void;
}

export function QuickQuotePanel({ onStartExpress, onStartGuided }: QuickQuotePanelProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full space-y-12">
        {/* Header - Clear Service Hierarchy */}
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center gap-4">
            {/* Real Merlin Avatar */}
            <img 
              src="/images/new_profile_merlin.png" 
              alt="Merlin AI" 
              className="w-20 h-20 rounded-full object-cover"
            />
            <h1 className="text-5xl font-bold text-white">
              Merlin Energy Platform
            </h1>
          </div>

          {/* TrueQuote Powers Everything */}
          <div className="flex items-center justify-center gap-3 pb-4 border-b border-slate-700/50">
            <img 
              src={badgeGoldIcon} 
              alt="TrueQuote Verified" 
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
            <div className="text-left">
              <div className="text-lg font-bold text-amber-400">Powered by TrueQuote™</div>
              <div className="text-sm text-slate-400">Every calculation source-verified • NREL • EIA • IRA 2022</div>
            </div>
          </div>

          {/* Service Description */}
          <div className="max-w-3xl mx-auto">
            <p className="text-2xl text-slate-200 font-medium mb-3">
              Choose Your Experience
            </p>
            <p className="text-lg text-slate-400">
              Both paths deliver TrueQuote™ verified pricing. Pick the one that fits your workflow.
            </p>
          </div>
        </div>

        {/* Two Main Choices */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* WIZARD Path */}
          <button
            onClick={onStartGuided}
            onMouseEnter={() => setHoveredMode("wizard")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-transparent rounded-2xl border-2 border-[#3ECF8E]/40 hover:border-[#3ECF8E] hover:shadow-2xl hover:shadow-[#3ECF8E]/30 transition-all duration-300 p-8 text-left"
          >
            <div className="absolute top-6 right-6">
              <span className="text-sm font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-3 py-1.5 rounded-full border border-[#3ECF8E]/30">
                Recommended
              </span>
            </div>

            {/* Wizard Icon */}
            <div className="w-20 h-20 rounded-2xl border-2 border-[#3ECF8E]/40 flex items-center justify-center mb-6 group-hover:border-[#3ECF8E] group-hover:scale-110 transition-all">
              <Building2 className="w-10 h-10 text-[#3ECF8E]" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">
              Guided Wizard
            </h2>
            
            <p className="text-base text-slate-300 mb-6 leading-relaxed">
              Answer 16 questions about your facility. Merlin calculates optimal system sizing based on your actual usage patterns.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                <span className="text-sm">~5 minutes to complete</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                <span className="text-sm">Industry-specific sizing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E]" />
                <span className="text-sm">TrueQuote™ verified results</span>
              </div>
            </div>

            <div className="flex items-center text-[#3ECF8E] font-bold text-lg group-hover:translate-x-2 transition-transform">
              Start Wizard <ArrowRight className="w-5 h-5 ml-2" />
            </div>

            {hoveredMode === "wizard" && (
              <div className="absolute inset-0 bg-[#3ECF8E]/5 rounded-2xl pointer-events-none" />
            )}
          </button>

          {/* PROQUOTE Path */}
          <button
            onClick={() => onStartExpress("custom")}
            onMouseEnter={() => setHoveredMode("proquote")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-transparent rounded-2xl border-2 border-blue-500/40 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 p-8 text-left"
          >
            <div className="absolute top-6 right-6">
              <img 
                src={badgeProQuoteIcon} 
                alt="ProQuote" 
                className="w-12 h-12 object-contain drop-shadow-lg"
              />
            </div>

            {/* ProQuote Icon */}
            <div className="w-20 h-20 rounded-2xl border-2 border-blue-500/40 flex items-center justify-center mb-6 group-hover:border-blue-400 group-hover:scale-110 transition-all">
              <Settings className="w-10 h-10 text-blue-400" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">
              ProQuote<span className="text-blue-400">™</span>
            </h2>
            
            <p className="text-base text-slate-300 mb-6 leading-relaxed">
              Advanced configuration mode. Enter exact system specs, configure equipment, and get granular control over every parameter.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-sm">Full equipment customization</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-sm">Advanced financial modeling</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-sm">TrueQuote™ verified results</span>
              </div>
            </div>

            <div className="flex items-center text-blue-400 font-bold text-lg group-hover:translate-x-2 transition-transform">
              Open ProQuote <ArrowRight className="w-5 h-5 ml-2" />
            </div>

            {hoveredMode === "proquote" && (
              <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
