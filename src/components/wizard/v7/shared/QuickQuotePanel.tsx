/**
 * Quick Quote Panel — Express path for experienced users
 * 
 * Bypasses 4-step wizard flow → instant ballpark quote
 * 
 * Three express modes:
 * 1. "I know my system size" → Jump to MagicFit with custom inputs
 * 2. "Just give me a ballpark" → Auto-generate with regional averages
 * 3. "I have a utility bill" → Extract usage, generate quote (future)
 * 
 * Design: Supabase-style stroke-only with emerald green (#3ECF8E) primary
 * Uses official badge images: badge_icon.jpg (ProQuote), badge_gold_icon.jpg (TrueQuote)
 * Uses real Merlin avatar: /images/new_profile_merlin.png
 */

import React, { useState } from "react";
import { Building2, Zap, Upload, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
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
      <div className="max-w-5xl w-full space-y-8">
        {/* Header with Official Badges */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            {/* Real Merlin Avatar */}
            <img 
              src="/images/new_profile_merlin.png" 
              alt="Merlin AI" 
              className="w-16 h-16 rounded-full object-cover"
            />
            <h1 className="text-4xl font-bold text-white">
              Merlin <span className="text-[#3ECF8E]">ProQuote</span>™
            </h1>
          </div>

          {/* Official Badges Row */}
          <div className="flex items-center justify-center gap-6">
            {/* ProQuote Badge (Blue Shield) */}
            <div className="flex items-center gap-2">
              <img 
                src={badgeProQuoteIcon} 
                alt="ProQuote Badge" 
                className="w-12 h-12 object-contain drop-shadow-lg"
              />
              <div className="text-left">
                <div className="text-sm font-bold text-blue-400">ProQuote™</div>
                <div className="text-xs text-slate-400">Pro Mode</div>
              </div>
            </div>

            {/* TrueQuote Badge (Gold Shield) */}
            <div className="flex items-center gap-2">
              <img 
                src={badgeGoldIcon} 
                alt="TrueQuote Verified" 
                className="w-12 h-12 object-contain drop-shadow-lg"
              />
              <div className="text-left">
                <div className="text-sm font-bold text-amber-400">TrueQuote™</div>
                <div className="text-xs text-slate-400">Source-Verified</div>
              </div>
            </div>
          </div>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Choose your path: Get a ballpark estimate in 30 seconds, or build a detailed quote with full source attribution.
          </p>
        </div>

        {/* Quick Quote Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Option 1: Custom Size */}
          <button
            onClick={() => onStartExpress("custom")}
            onMouseEnter={() => setHoveredMode("custom")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-transparent rounded-xl border-2 border-[#3ECF8E]/30 hover:border-[#3ECF8E] hover:shadow-lg hover:shadow-[#3ECF8E]/20 transition-all duration-200 p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-[#3ECF8E] border border-[#3ECF8E]/30 px-2 py-1 rounded-full">
                30 sec
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg border-2 border-[#3ECF8E]/30 flex items-center justify-center mb-4 group-hover:border-[#3ECF8E] transition-colors">
              <Zap className="w-6 h-6 text-[#3ECF8E]" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              I Know My System Size
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter your target kW/kWh directly. Skip the questionnaire and jump to pricing.
            </p>

            <div className="flex items-center text-[#3ECF8E] font-medium text-sm group-hover:translate-x-1 transition-transform">
              Quick Quote <ArrowRight className="w-4 h-4 ml-1" />
            </div>

            {hoveredMode === "custom" && (
              <div className="absolute inset-0 bg-[#3ECF8E]/5 rounded-xl pointer-events-none" />
            )}
          </button>

          {/* Option 2: Ballpark (Auto) */}
          <button
            onClick={() => onStartExpress("ballpark")}
            onMouseEnter={() => setHoveredMode("ballpark")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-transparent rounded-xl border-2 border-[#68BFFA]/30 hover:border-[#68BFFA] hover:shadow-lg hover:shadow-[#68BFFA]/20 transition-all duration-200 p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-[#68BFFA] border border-[#68BFFA]/30 px-2 py-1 rounded-full">
                15 sec
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg border-2 border-[#68BFFA]/30 flex items-center justify-center mb-4 group-hover:border-[#68BFFA] transition-colors">
              <Sparkles className="w-6 h-6 text-[#68BFFA]" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              Just Give Me a Ballpark
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Auto-generate a quote using regional averages. Fast and simple.
            </p>

            <div className="flex items-center text-[#68BFFA] font-medium text-sm group-hover:translate-x-1 transition-transform">
              Instant Quote <ArrowRight className="w-4 h-4 ml-1" />
            </div>

            {hoveredMode === "ballpark" && (
              <div className="absolute inset-0 bg-[#68BFFA]/5 rounded-xl pointer-events-none" />
            )}
          </button>

          {/* Option 3: Bill Upload (Coming Soon) */}
          <button
            disabled
            className="group relative bg-transparent rounded-xl border-2 border-slate-700/30 opacity-50 cursor-not-allowed p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-slate-500 border border-slate-700/30 px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg border-2 border-slate-700/30 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-slate-500" />
            </div>

            <h3 className="text-x(Stroke-Only Button) */}
        <div className="text-center">
          <button
            onClick={onStartGuided}
            className="group inline-flex items-center gap-3 border-2 border-[#3ECF8E]/50 hover:border-[#3ECF8E] text-[#3ECF8E] font-bold px-8 py-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#3ECF8E]/2
            </p>

            <div className="flex items-center text-slate-600 font-medium text-sm">
              Coming Q2 2026 <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-950 text-slate-500">or</span>
          </div>
        </div>

        {/* Guided Wizard Option */}
        <div className="text-center">
          <button
            onClick={onStartGuided}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#3ECF8E] to-[#2EA574] hover:from-[#35b87a] hover:to-[#2A9468] text-[#0D0D0D] font-bold px-8 py-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#3ECF8E]/30"
          >
            <Building2 className="w-5 h-5" />
            <span>Start Guided Wizard (Detailed Quote)</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-slate-400 mt-3">
            Answer 16 questions • Get TrueQuote™ verified pricing • ~5 minutes
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-8 pt-8 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3ECF8E] shadow-sm shadow-[#3ECF8E]/50" />
            <span>NREL Pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#68BFFA] shadow-sm shadow-[#68BFFA]/50" />
            <span>EIA Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ffa600] shadow-sm shadow-[#ffa600]/50" />
            <span>IRA 2022 Tax Credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
