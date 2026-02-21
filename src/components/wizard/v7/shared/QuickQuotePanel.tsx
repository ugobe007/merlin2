/**
 * Quick Quote Panel — Express path for experienced users
 * 
 * Bypasses 4-step wizard flow → instant ballpark quote
 * 
 * Three express modes:
 * 1. "I know my system size" → Jump to MagicFit with custom inputs
 * 2. "Just give me a ballpark" → Auto-generate with regional averages
 * 3. "I have a utility bill" → Extract usage, generate quote (future)
 */

import React, { useState } from "react";
import { Building2, Zap, Upload, ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";

interface QuickQuotePanelProps {
  onStartExpress: (mode: "custom" | "ballpark" | "bill-upload") => void;
  onStartGuided: () => void;
}

export function QuickQuotePanel({ onStartExpress, onStartGuided }: QuickQuotePanelProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Purple gradient icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent">
              Merlin ProQuote™
            </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Choose your path: Get a <span className="text-purple-400 font-medium">TrueQuote™</span> estimate in 30 seconds, or build a detailed quote with full source attribution.
          </p>
          {/* TrueQuote badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Every number traceable to authoritative sources (NREL, EIA, Visual Crossing)</span>
          </div>
        </div>

        {/* Quick Quote Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Option 1: Custom Size */}
          <button
            onClick={() => onStartExpress("custom")}
            onMouseEnter={() => setHoveredMode("custom")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-transparent rounded-xl border-2 border-purple-500/30 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full">
                30 sec
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg border-2 border-purple-500/30 flex items-center justify-center mb-4 group-hover:border-purple-500 transition-colors">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              I Know My System Size
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter your target kW/kWh directly. Skip the questionnaire and jump to pricing.
            </p>

            <div className="flex items-center text-purple-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Quick Quote <ArrowRight className="w-4 h-4 ml-1" />
            </div>

            {hoveredMode === "custom" && (
              <div className="absolute inset-0 bg-purple-500/5 rounded-xl pointer-events-none" />
            )}
          </button>

          {/* Option 2: Ballpark (Auto) */}
          <button
            onClick={() => onStartExpress("ballpark")}
            onMouseEnter={() => setHoveredMode("ballpark")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-transparent rounded-xl border-2 border-purple-500/30 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-200 p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-purple-400 border border-purple-500/30 px-2 py-1 rounded-full">
                15 sec
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg border-2 border-purple-500/30 flex items-center justify-center mb-4 group-hover:border-purple-500 transition-colors">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              Just Give Me a Ballpark
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Auto-generate a quote using regional averages. Fast and simple.
            </p>

            <div className="flex items-center text-purple-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Instant Quote <ArrowRight className="w-4 h-4 ml-1" />
            </div>

            {hoveredMode === "ballpark" && (
              <div className="absolute inset-0 bg-purple-500/5 rounded-xl pointer-events-none" />
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

            <h3 className="text-xl font-semibold text-slate-500 mb-2">
              Upload My Utility Bill
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Extract your usage data automatically. Get a precise quote based on real consumption.
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
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30"
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
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
            <span>TrueQuote™ Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
            <span>NREL Pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-300 shadow-sm shadow-purple-300/50" />
            <span>IRA 2022 Tax Credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
