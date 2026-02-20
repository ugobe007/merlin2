/**
 * ProQuoteHowItWorksModal.tsx
 *
 * Supabase-style explanation modal for ProQuote™.
 * Shows how the professional quote builder works, its tools, and workflow.
 *
 * @version 1.0.0 (Feb 2026)
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Landmark,
  FileSpreadsheet,
  Zap,
  Shield,
  Upload,
  Calculator,
  Battery,
  Sparkles,
} from "lucide-react";

interface ProQuoteHowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProQuote?: () => void;
}

export default function ProQuoteHowItWorksModal({
  isOpen,
  onClose,
  _onOpenProQuote,
}: ProQuoteHowItWorksModalProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setAnimateIn(true), 50);
    else setAnimateIn(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden transition-all duration-500 ${
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
        }`}
        style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* ── HEADER ── */}
        <div className="relative px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <Sliders className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                How <span className="text-amber-400">ProQuote™</span> Works
              </h2>
              <p className="text-sm text-slate-500">Professional-grade BESS configuration &amp; financial modeling</p>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* What is ProQuote */}
          <div className="mb-5">
            <p className="text-sm text-slate-400 leading-relaxed">
              ProQuote™ is Merlin's professional configuration tool for engineers, EPCs, and developers
              who need <span className="text-slate-200 font-medium">full control over every system parameter</span>.
              Design complete BESS systems with electrical specifications, renewable integration, and
              bank-ready financial models — all powered by TrueQuote™ source-verified pricing.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white mb-3">How It Works</h3>
            <div className="space-y-2">
              {[
                {
                  step: "1",
                  title: "Configure Your System",
                  desc: "Set power capacity, duration, battery chemistry, grid connection, and inverter specs. Every parameter is adjustable.",
                  icon: Battery,
                  accent: "59,130,246",
                },
                {
                  step: "2",
                  title: "Add Renewables & Generation",
                  desc: "Optionally include solar PV, wind turbines, diesel/natural gas generators, or fuel cells. Full sizing calculations included.",
                  icon: Sparkles,
                  accent: "16,185,129",
                },
                {
                  step: "3",
                  title: "Upload Specs (Optional)",
                  desc: "Upload utility bills, site plans, or RFPs. Merlin's AI extracts power requirements, rates, and infrastructure data.",
                  icon: Upload,
                  accent: "139,92,246",
                },
                {
                  step: "4",
                  title: "Generate Quote & Export",
                  desc: "Get a TrueQuote™-verified quote with full equipment breakdown, financial metrics, and exportable Word/Excel reports.",
                  icon: FileSpreadsheet,
                  accent: "251,191,36",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="flex items-start gap-4 p-4 rounded-lg"
                  style={{ background: `rgba(${s.accent}, 0.03)`, border: `1px solid rgba(${s.accent}, 0.08)` }}
                >
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `rgba(${s.accent}, 0.1)` }}
                  >
                    <s.icon className="w-4 h-4" style={{ color: `rgba(${s.accent}, 0.8)` }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      <span className="text-slate-500 mr-1.5">{s.step}.</span>
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools Grid */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white mb-3">Included Tools</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { icon: Sliders, title: "System Config", desc: "Full BESS parameter control" },
                { icon: Zap, title: "Electrical Specs", desc: "PCS, inverters, transformers" },
                { icon: Sparkles, title: "Renewables", desc: "Solar, wind, generators, fuel cells" },
                { icon: Calculator, title: "Live Pricing", desc: "Real-time cost calculations" },
                { icon: Landmark, title: "Bank-Ready Model", desc: "3-statement, DSCR, IRR, MACRS" },
                { icon: FileSpreadsheet, title: "Professional Export", desc: "Word, Excel, PDF reports" },
              ].map((tool, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <tool.icon className="w-4 h-4 text-amber-400/60 mb-2" />
                  <h4 className="text-xs font-semibold text-white">{tool.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TrueQuote Integration */}
          <div className="rounded-lg p-4" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Powered by TrueQuote™</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every ProQuote uses the same NREL ATB 2024, IEEE, and IRA 2022 benchmarks as TrueQuote™.
              Equipment pricing, financial calculations, and tax credits are all source-verified and auditable.
              ProQuote simply gives you more control over the inputs.
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <span className="text-xs text-slate-600">Professional configuration · TrueQuote™ verified</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all"
              style={{ background: 'transparent', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(251,191,36,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
