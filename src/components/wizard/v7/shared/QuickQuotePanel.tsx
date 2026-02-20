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
import { Building2, Zap, Upload, ArrowRight, Sparkles } from "lucide-react";

interface QuickQuotePanelProps {
  onStartExpress: (mode: "custom" | "ballpark" | "bill-upload") => void;
  onStartGuided: () => void;
}

export function QuickQuotePanel({ onStartExpress, onStartGuided }: QuickQuotePanelProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">
              Get Your BESS Quote
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose your path: Get a ballpark estimate in 30 seconds, or build a detailed custom quote in 5 minutes.
          </p>
        </div>

        {/* Quick Quote Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Option 1: Custom Size */}
          <button
            onClick={() => onStartExpress("custom")}
            onMouseEnter={() => setHoveredMode("custom")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                30 sec
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              I Know My System Size
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter your target kW/kWh directly. Skip the questionnaire and jump to pricing.
            </p>

            <div className="flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Quick Quote <ArrowRight className="w-4 h-4 ml-1" />
            </div>

            {hoveredMode === "custom" && (
              <div className="absolute inset-0 bg-blue-500/5 rounded-xl pointer-events-none" />
            )}
          </button>

          {/* Option 2: Ballpark (Auto) */}
          <button
            onClick={() => onStartExpress("ballpark")}
            onMouseEnter={() => setHoveredMode("ballpark")}
            onMouseLeave={() => setHoveredMode(null)}
            className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-green-500 hover:shadow-lg transition-all duration-200 p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                15 sec
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Just Give Me a Ballpark
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Auto-generate a quote using regional averages. Fast and simple.
            </p>

            <div className="flex items-center text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
              Instant Quote <ArrowRight className="w-4 h-4 ml-1" />
            </div>

            {hoveredMode === "ballpark" && (
              <div className="absolute inset-0 bg-green-500/5 rounded-xl pointer-events-none" />
            )}
          </button>

          {/* Option 3: Bill Upload (Coming Soon) */}
          <button
            disabled
            className="group relative bg-white rounded-xl border-2 border-slate-200 opacity-50 cursor-not-allowed p-6 text-left"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
            
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>

            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Upload My Utility Bill
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Extract your usage data automatically. Get a precise quote based on real consumption.
            </p>

            <div className="flex items-center text-slate-400 font-medium text-sm">
              Coming Q2 2026 <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500">or</span>
          </div>
        </div>

        {/* Guided Wizard Option */}
        <div className="text-center">
          <button
            onClick={onStartGuided}
            className="group inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-medium px-8 py-4 rounded-lg transition-all duration-200 hover:shadow-lg"
          >
            <Building2 className="w-5 h-5" />
            <span>Start Guided Wizard (Detailed Quote)</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-slate-500 mt-3">
            Answer 16 questions • Get TrueQuote™ verified pricing • ~5 minutes
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-8 pt-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>TrueQuote™ Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>NREL Pricing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>IRA 2022 Tax Credits</span>
          </div>
        </div>
      </div>
    </div>
  );
}
