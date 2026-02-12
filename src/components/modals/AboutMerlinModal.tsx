/**
 * AboutMerlinModal.tsx
 *
 * Supabase-style dark modal — clean, typographic, minimal.
 * Platform overview, TrueQuote™ explanation, capabilities.
 *
 * @version 5.0.0 — Supabase redesign (Feb 2026)
 */

import React, { useState, useEffect } from "react";
import { X, Zap, Shield, BarChart3, Search, Layers, ArrowRight, Star } from "lucide-react";

interface AboutMerlinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuote?: () => void;
}

export const AboutMerlinModal: React.FC<AboutMerlinModalProps> = ({
  isOpen,
  onClose,
  onStartQuote,
}) => {
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

          <h2 className="text-lg font-semibold text-white">
            Meet <span className="text-emerald-400">Merlin</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            The first BESS quoting engine where every number is traceable to an authoritative source.
          </p>
        </div>

        {/* ── STATS ROW ── */}
        <div className="flex px-6 py-3 gap-0 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          {[
            { value: "21", label: "Industries" },
            { value: "NREL", label: "ATB 2024" },
            { value: "6–70%", label: "Dynamic ITC" },
            { value: "TrueQuote™", label: "Source-Verified" },
          ].map((stat, i) => (
            <div key={i} className="flex-1 text-center py-1" style={i < 3 ? { borderRight: "1px solid rgba(255,255,255,0.06)" } : {}}>
              <div className="text-sm font-bold text-emerald-400">{stat.value}</div>
              <div className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {/* Problem → Solution */}
          <div className="grid md:grid-cols-2 gap-3 mb-5">
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-sm font-semibold text-white mb-1.5">The Problem</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Getting a battery storage quote means weeks of back-and-forth with opaque pricing.
                Businesses can't tell if a number is competitive, accurate, or even based on real data.
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
              <h3 className="text-sm font-semibold text-emerald-400 mb-1.5">The Merlin Answer</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Investment-grade BESS quotes in under five minutes with full source attribution.
                Every cost, sizing ratio, and tax credit traced back to NREL, IEEE, IRA 2022.
              </p>
            </div>
          </div>

          {/* TrueQuote */}
          <div className="rounded-lg p-4 mb-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-md" style={{ background: "rgba(16,185,129,0.1)" }}>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">TrueQuote™</h3>
                <p className="text-[11px] text-slate-600">Every number backed by an authoritative source</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {[
                { label: "Pricing", desc: "NREL ATB 2024 for BESS & solar. Validated against vendor quotes and BNEF." },
                { label: "Sizing", desc: "IEEE 446, ASHRAE 90.1, CBECS load data, NREL microgrid standards." },
                { label: "Incentives", desc: "IRA 2022 dynamic ITC (6–70%), energy community bonuses, MACRS." },
              ].map((item) => (
                <div key={item.label} className="rounded-md p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Capabilities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { icon: BarChart3, title: "Financial Modeling", desc: "NPV, IRR, Monte Carlo P10/P50/P90, degradation" },
                { icon: Search, title: "Intelligent Sizing", desc: "21 industry profiles with ASHRAE/CBECS data" },
                { icon: Layers, title: "Complete Quoting", desc: "Equipment breakdown, margin policy, exports" },
                { icon: Shield, title: "Audit Trail", desc: "Full source attribution on every line item" },
                { icon: Zap, title: "Dynamic Rates", desc: "Utility rates by zip, IRA 2022 ITC with adders" },
                { icon: Star, title: "Bank-Ready", desc: "3-statement model, DSCR, levered/unlevered IRR" },
              ].map((cap, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="w-8 h-8 rounded-md flex items-center justify-center mb-2" style={{ background: "rgba(16,185,129,0.08)" }}>
                    <cap.icon className="w-4 h-4 text-emerald-400/70" />
                  </div>
                  <h4 className="text-xs font-semibold text-white mb-0.5">{cap.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
          <span className="text-xs text-slate-600">TrueQuote™ verified · No signup · Under 5 minutes</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => { onClose(); onStartQuote?.(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white transition-all"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; }}
            >
              Start My Quote
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMerlinModal;
