/**
 * Quick Quote Panel — Two paths to get a quote
 * 
 * PATH 1 - WIZARD (Recommended): Guided questionnaire for users who need sizing recommendations
 * PATH 2 - PROQUOTE: Direct spec input OR upload RFQ/RFP for engineers with existing specs
 * 
 * All powered by TrueQuote™ (source-verified calculations)
 * 
 * Design: Horizontal 2-card layout, compact, clear value propositions
 */

import React from "react";
import { Building2, Upload, ArrowRight } from "lucide-react";
import badgeProQuoteIcon from "@/assets/images/badge_icon.jpg";
import badgeGoldIcon from "@/assets/images/badge_gold_icon.jpg";

interface QuickQuotePanelProps {
  onStartExpress: (mode: "custom" | "ballpark" | "bill-upload") => void;
  onStartGuided: () => void;
}

export function QuickQuotePanel({ onStartExpress, onStartGuided }: QuickQuotePanelProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img 
              src="/images/new_profile_merlin.png" 
              alt="Merlin AI" 
              className="w-16 h-16 rounded-full object-cover"
            />
            <h1 className="text-5xl font-bold text-white">
              Merlin
            </h1>
          </div>

          {/* TrueQuote Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <img 
              src={badgeGoldIcon} 
              alt="TrueQuote Verified" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-sm font-semibold text-amber-400">Powered by TrueQuote™</span>
          </div>

          <p className="text-2xl text-slate-200 font-medium mb-2">
            Get your battery energy storage quote in minutes
          </p>
          
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Source-verified calculations from NREL, EIA, and IRA 2022. Every number traceable to authoritative benchmarks. 
            Typical projects see <span className="text-[#3ECF8E] font-semibold">20-40% energy cost reduction</span> with 5-8 year payback.
          </p>
        </div>

        {/* Two Clean Options - Supabase Style */}
        <div className="space-y-3">
          {/* Option 1: Guided Wizard */}
          <button
            onClick={onStartGuided}
            className="group w-full bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-[#3ECF8E]/50 rounded-lg p-5 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-[#3ECF8E]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Guided Wizard</h3>
                    <span className="text-xs font-semibold text-[#3ECF8E] bg-[#3ECF8E]/10 px-2 py-0.5 rounded">
                      Recommended
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 ml-11">
                  Answer 16 questions about your facility. Get expert system sizing based on your usage patterns, peak demand, and goals. Industry-specific calculations. ~5 minutes.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-[#3ECF8E] group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Option 2: ProQuote */}
          <button
            onClick={() => onStartExpress("custom")}
            className="group w-full bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-blue-500/50 rounded-lg p-5 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">ProQuote™</h3>
                    <img 
                      src={badgeProQuoteIcon} 
                      alt="ProQuote" 
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-400 ml-11">
                  Already know your specs or have an RFQ/RFP? Enter kW/kWh directly or upload documents. Advanced equipment configuration and detailed financial modeling.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
            </div>
          </button>

          {/* Option 3: Upload Documents - PROMINENT */}
          <button
            onClick={() => onStartExpress("bill-upload")}
            className="group w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-2 border-dashed border-purple-400/30 hover:border-purple-400/50 rounded-lg p-5 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Upload RFQ/RFP</h3>
                    <span className="text-xs font-semibold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                      Fastest
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 ml-11">
                  Have specifications or documents? Upload your RFQ, RFP, or spec sheets. We'll extract your requirements and generate a quote automatically. ~2 minutes.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}