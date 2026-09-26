/**
 * BILL.MERLINENERGY.NET — AI Utility Bill OCR & Tariff Extractor
 * Standalone Lead-Magnet Landing Page & Utility Bill Analyzer
 */

import React, { useState } from "react";
import { BillUploadPanel } from "../wizard/v8/steps/BillUploadPanel";
import type { ExtractedSpecsData } from "../services/openAIExtractionService";
import { Zap, ShieldCheck, ArrowRight, FileText, CheckCircle, BarChart2, Sparkles, Building2 } from "lucide-react";

export default function BillLandingPage() {
  const [billData, setBillData] = useState<ExtractedSpecsData | null>(null);

  const handleLaunchWizard = () => {
    if (billData) {
      try {
        sessionStorage.setItem("merlin_prefilled_bill", JSON.stringify(billData));
      } catch (err) {
        console.error("Failed to store bill data in sessionStorage:", err);
      }
    }
    window.location.href = "/wizard?step=3&source=bill_ocr_landing";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20">
                ⚡
              </span>
              Merlin<span className="text-cyan-400">Energy</span>
            </a>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              bill.merlinenergy.net
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/wizard"
              className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-cyan-400 transition-colors"
            >
              Full Proposal Engine →
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Title Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 mb-6 shadow-sm text-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          Free Commercial AI Utility Bill OCR Engine
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-5xl font-black text-center text-white tracking-tight max-w-3xl leading-tight">
          Drop any utility bill. Get instant tariff, demand charge & load profile analysis.
        </h1>
        <p className="mt-4 text-sm sm:text-lg text-slate-400 text-center max-w-2xl">
          Instantly extract peak kW demand, TOU rate schedules, tariffs, and monthly usage from PDF electric statements with 99.4% AI precision.
        </p>

        {/* Upload Panel Card Container */}
        <div className="w-full mt-8 sm:mt-10 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
          <BillUploadPanel
            uploadedData={billData}
            onExtracted={(data) => setBillData(data)}
            onCleared={() => setBillData(null)}
          />

          {/* CTA Conversion Box when Bill Extracted */}
          {billData && (
            <div className="mt-8 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-emerald-950/40 border-2 border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-sm uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> Bill Extraction Complete
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Ready to calculate BESS & Solar Savings for this utility account?
                </h3>
                <p className="text-xs text-slate-300">
                  Transfers tariff rates, peak kW ({billData.powerRequirements?.peakDemandKW ?? "N/A"} kW), and load curves into the Merlin Microgrid Calculator.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLaunchWizard}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all transform hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                ⚡ Calculate Battery Proposal →
              </button>
            </div>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mt-16">
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">All US Utility Formats</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Supports PG&E, SCE, SDG&E, ConEd, ERCOT, ComEd, FPL, and 3,000+ municipal utilities.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">Tariff & Demand Charge Extraction</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Extracts on-peak/off-peak demand ($/kW), energy charges ($/kWh), and seasonal multiplier rules.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">Bank-Grade Privacy</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Uploaded utility statements are processed in memory and encrypted for your proposal only.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Merlin Energy Inc. · BESS & Microgrid Optimization Platform</p>
      </footer>
    </div>
  );
}
