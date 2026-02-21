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
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
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

          {/* TrueQuote Badge */}
          <div className="flex items-center justify-center gap-3">
            <img 
              src={badgeGoldIcon} 
              alt="TrueQuote Verified" 
              className="w-12 h-12 object-contain drop-shadow-lg"
            />
            <div className="text-center">
              <div className="text-base font-bold text-amber-400">Powered by TrueQuote™</div>
              <div className="text-xs text-slate-400">Every number traceable to authoritative sources</div>
            </div>
          </div>

          <p className="text-lg text-slate-300">
            Choose your path to a verified BESS quote
          </p>
        </div>

        {/* Two Paths - Horizontal Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* PATH 1: Guided Wizard */}
          <button
            onClick={onStartGuided}
            className="group relative bg-slate-800/30 border-2 border-[#3ECF8E]/40 hover:border-[#3ECF8E] rounded-xl p-6 text-left transition-all hover:shadow-xl hover:shadow-[#3ECF8E]/20"
          >
            <div className="absolute top-4 right-4">
              <span className="text-xs font-bold text-[#3ECF8E] bg-[#3ECF8E]/10 px-3 py-1 rounded-full">
                Recommended
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#3ECF8E]" />
              </div>
              <h2 className="text-2xl font-bold text-white">Guided Wizard</h2>
            </div>

            <p className="text-slate-300 mb-4">
              Don't know what size you need? Answer 16 questions about your facility and get expert sizing recommendations.
            </p>

            <div className="space-y-2 mb-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#3ECF8E]" />
                <span>Industry-specific calculations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#3ECF8E]" />
                <span>Optimal system sizing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[#3ECF8E]" />
                <span>~5 minutes to complete</span>
              </div>
            </div>

            <div className="flex items-center text-[#3ECF8E] font-semibold group-hover:translate-x-1 transition-transform">
              Start Wizard <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </button>

          {/* PATH 2: ProQuote (includes Upload) */}
          <div className="group relative bg-slate-800/30 border-2 border-blue-500/40 hover:border-blue-400 rounded-xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/20">
            <div className="absolute top-4 right-4">
              <img 
                src={badgeProQuoteIcon} 
                alt="ProQuote" 
                className="w-10 h-10 object-contain"
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">ProQuote™</h2>
            </div>

            <p className="text-slate-300 mb-4">
              Already have specs or an RFQ/RFP? Get advanced configuration and detailed financial modeling.
            </p>

            <div className="space-y-2 mb-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <span>Upload RFQ/RFP documents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <span>Direct kW/kWh input</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-400" />
                <span>Full equipment customization</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onStartExpress("bill-upload")}
                className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2.5 text-blue-400 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload RFQ/RFP
              </button>
              
              <button
                onClick={() => onStartExpress("custom")}
                className="w-full hover:bg-slate-700/30 rounded-lg px-4 py-2.5 text-slate-300 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Enter Specs Manually <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}