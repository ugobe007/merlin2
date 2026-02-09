/**
 * AboutMerlinModal.tsx
 * 
 * Premium About modal — TrueQuote™ era
 * Dark navy, amber accents, source-attribution messaging
 * 
 * @version 4.0.0
 */

import React, { useState, useEffect } from 'react';
import { X, Zap, Shield, BarChart3, Search, Layers, ArrowRight, Star } from 'lucide-react';

interface AboutMerlinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuote?: () => void;
}

export const AboutMerlinModal: React.FC<AboutMerlinModalProps> = ({
  isOpen,
  onClose,
  onStartQuote
}) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 50);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ${
          animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
        }`}
        style={{ background: 'linear-gradient(160deg, #080b14 0%, #0f1420 50%, #0a0d16 100%)' }}
      >
        {/* Amber accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        >
          <X className="w-5 h-5" style={{ color: "rgba(255,255,255,0.5)" }} />
        </button>

        {/* ============================================================ */}
        {/* HEADER */}
        {/* ============================================================ */}
        <div className="relative px-10 pt-10 pb-8 text-center">
          <div className="relative">
            <h1 className="text-4xl font-black mb-3">
              <span className="text-white">Meet </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">Merlin</span>
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              The first BESS quoting engine where every number is traceable to an authoritative source.
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50" />
              <Star className="w-4 h-4 text-amber-500" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STATS BAR */}
        {/* ============================================================ */}
        <div className="mx-8 mb-7">
          <div className="flex items-center justify-center gap-0 rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5">
            <div className="flex-1 py-5 text-center border-r border-amber-500/20">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">21</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Industry Profiles</div>
            </div>
            <div className="flex-1 py-5 text-center border-r border-amber-500/20">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">NREL</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>ATB 2024 Data</div>
            </div>
            <div className="flex-1 py-5 text-center border-r border-amber-500/20">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">6–70%</div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Dynamic ITC</div>
            </div>
            <div className="flex-1 py-5 text-center">
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-400">TrueQuote™</span>
              </div>
              <div className="text-xs uppercase tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Source-Verified</div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTENT - Scrollable */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto px-10 pb-8">
          
          {/* Problem → Solution */}
          <div className="grid md:grid-cols-2 gap-5 mb-7">
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white mb-2">The Problem</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Getting a battery storage quote means weeks of back-and-forth with opaque pricing. 
                Businesses can't tell if a number is competitive, accurate, or even based on real data. 
                That uncertainty kills deals.
              </p>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}>
              <h2 className="font-bold mb-2" style={{ color: "#fbbf24" }}>The Merlin Answer</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Investment-grade BESS quotes in under five minutes with full source attribution 
                for every line item. Every cost, sizing ratio, and tax credit traced back to 
                NREL, IEEE, IRA 2022, and other authoritative benchmarks.
              </p>
            </div>
          </div>

          {/* TrueQuote */}
          <div className="rounded-xl p-6 mb-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg" style={{ background: "rgba(251,191,36,0.15)" }}>
                <Shield className="w-5 h-5" style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <h2 className="font-bold text-white">TrueQuote™</h2>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Every number backed by an authoritative source</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Pricing", desc: "NREL ATB 2024 for BESS & solar. Validated against vendor quotes and BNEF market data." },
                { label: "Sizing", desc: "IEEE 446, ASHRAE 90.1, CBECS load data, and NREL microgrid standards." },
                { label: "Incentives", desc: "IRA 2022 dynamic ITC (6–70%), energy community bonuses, domestic content, MACRS." },
              ].map((item) => (
                <div key={item.label} className="rounded-lg p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#fbbf24" }}>{item.label}</div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="mb-7">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              What Merlin Can Do
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: BarChart3, title: 'Financial Modeling', desc: 'NPV, IRR, Monte Carlo P10/P50/P90, degradation curves' },
                { icon: Search, title: 'Intelligent Sizing', desc: '21 industry profiles with ASHRAE / CBECS load data' },
                { icon: Layers, title: 'Complete Quoting', desc: 'Equipment breakdown, margin policy, professional exports' },
                { icon: Shield, title: 'Audit Trail', desc: 'Full TrueQuote™ source attribution on every line item' },
                { icon: Zap, title: 'Dynamic Rates', desc: 'Utility rates by zip code, IRA 2022 ITC with adders' },
                { icon: Star, title: 'Bank-Ready Output', desc: '3-statement model, DSCR, levered/unlevered IRR' },
              ].map((cap, i) => (
                <div
                  key={i}
                  className="group relative p-5 rounded-xl border transition-all duration-300 cursor-default"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.2)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <cap.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{cap.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{cap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FOOTER CTA */}
        {/* ============================================================ */}
        <div className="px-10 py-6 flex-shrink-0" style={{ borderTop: "1px solid rgba(251,191,36,0.1)", background: "linear-gradient(90deg, rgba(251,191,36,0.03), rgba(251,191,36,0.06), rgba(251,191,36,0.03))" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              TrueQuote™-verified · No signup · Under 5 minutes
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => { onClose(); onStartQuote?.(); }}
                className="group relative flex items-center gap-2 px-8 py-4 rounded-full font-bold overflow-hidden transition-all"
                style={{ background: '#fbbf24', color: '#1a0a2e', boxShadow: '0 4px 24px rgba(251,191,36,0.3)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fcd34d';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 32px rgba(251,191,36,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fbbf24';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(251,191,36,0.3)';
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Zap className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Start My Quote</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 rounded-full font-semibold transition-all"
                style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMerlinModal;
