import React from "react";
import { Calculator, Sparkles, TrendingUp, FileText } from "lucide-react";

const VendorBuildQuoteTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero CTA */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                ProQuote™ for Vendors
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-blue-400/15 border border-blue-400/25">
              <span className="text-[11px] font-semibold text-blue-300 tracking-wide">
                NREL ATB 2024 · IRA 2022 · IEEE
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-black mb-3">
            Build NREL-Compliant Proposals — Your Logo, Our Engine
          </h2>
          <p className="text-blue-200/80 text-lg mb-6 max-w-2xl">
            Every line item traced to NREL, DOE, or IEEE sources. Monte Carlo P10/P50/P90 risk
            analysis, 8,760-hour dispatch modeling, IRA 2022 ITC optimization — ready for bank due
            diligence.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/quote-builder"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-colors no-underline"
            >
              <Calculator className="w-5 h-5" />
              Open ProQuote™ Builder
            </a>
            <a
              href="/wizard"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-white/20 no-underline"
            >
              Quick Estimate (Wizard)
            </a>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl p-6 border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04]">
          <div className="w-10 h-10 bg-[#3ECF8E]/10 rounded-lg flex items-center justify-center mb-3">
            <Calculator className="w-5 h-5 text-[#3ECF8E]" />
          </div>
          <h3 className="font-bold text-white mb-2">Full Engineering Control</h3>
          <p className="text-sm text-slate-400">
            Configure BESS, solar, generators, EV chargers, and fuel cells with your own specs and
            pricing.
          </p>
        </div>
        <div className="rounded-xl p-6 border border-blue-500/20 bg-blue-500/[0.04]">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-bold text-white mb-2">Advanced Financial Analysis</h3>
          <p className="text-sm text-slate-400">
            Monte Carlo P10/P50/P90, 8760 hourly dispatch, NPV/IRR, DSCR — ready for bank review.
          </p>
        </div>
        <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
          <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-slate-300" />
          </div>
          <h3 className="font-bold text-white mb-2">Branded Exports</h3>
          <p className="text-sm text-slate-400">
            Export Word, Excel, and PDF proposals with TrueQuote™ source attribution — your client
            sees the rigor.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
        <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              step: "1",
              title: "Enter Project Specs",
              desc: "System size, location, use case, and customer requirements",
            },
            {
              step: "2",
              title: "Set Your Pricing",
              desc: "Use your equipment pricing or let Merlin suggest market rates",
            },
            {
              step: "3",
              title: "Run Analysis",
              desc: "Monte Carlo, 8760 hourly, degradation modeling — automated",
            },
            {
              step: "4",
              title: "Export Proposal",
              desc: "Bank-ready PDF/Word with TrueQuote™ attribution",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-10 h-10 bg-[#3ECF8E] text-[#0f1117] rounded-full flex items-center justify-center font-bold mx-auto mb-2">
                {item.step}
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Tiers Preview */}
      <div className="rounded-xl p-6 border border-[#3ECF8E]/20 bg-[#3ECF8E]/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white mb-1">Vendor Quoting Plans</h3>
            <p className="text-sm text-slate-400">
              Free: 3 quotes/month with Merlin watermark • Pro: Unlimited quotes, white-label
              exports
            </p>
          </div>
          <a
            href="/quote-builder"
            className="inline-flex items-center gap-2 bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] px-5 py-2.5 rounded-lg font-bold transition-colors text-sm no-underline"
          >
            Start Building →
          </a>
        </div>
      </div>
    </div>
  );
};

export default VendorBuildQuoteTab;
