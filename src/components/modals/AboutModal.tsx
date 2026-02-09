/**
 * About Merlin Modal
 * Popup version of the About page — TrueQuote™ era
 */

import React from 'react';
import { X, Zap, BarChart3, Shield, Search, Layers, ArrowRight } from 'lucide-react';
import merlinImage from "../../assets/images/new_profile_merlin.png";

interface AboutModalProps {
  show: boolean;
  onClose: () => void;
  onStartWizard?: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ show, onClose, onStartWizard }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: "linear-gradient(160deg, #080b14 0%, #0f1420 50%, #0a0d16 100%)" }}
      >
        {/* Header */}
        <div
          className="relative rounded-t-2xl p-8 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0c1020 0%, #141c32 50%, #0c1020 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          >
            <X className="w-6 h-6" style={{ color: "rgba(255,255,255,0.5)" }} />
          </button>
          
          <div className="flex items-center gap-6 relative z-10">
            <img src={merlinImage} alt="Merlin" className="w-20 h-20 object-contain rounded-full" />
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">About Merlin</h1>
              <p style={{ color: "rgba(255,255,255,0.45)" }} className="text-base">
                The first BESS quoting engine where every number is traceable.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-7">

          {/* Problem → Solution */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white mb-2">The Problem</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Getting a battery storage quote today means weeks of back-and-forth, opaque pricing, 
                and numbers that appear from nowhere. Businesses can't tell if a quote is competitive, 
                accurate, or even based on real data.
              </p>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}>
              <h2 className="font-bold mb-2" style={{ color: "#fbbf24" }}>The Merlin Answer</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Merlin generates investment-grade BESS quotes in under five minutes — with full source 
                attribution for every line item. Our TrueQuote™ engine traces each cost, sizing ratio, 
                and financial assumption back to authoritative benchmarks.
              </p>
            </div>
          </div>

          {/* TrueQuote Highlight */}
          <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                { label: "Pricing", desc: "NREL ATB 2024 for BESS & solar, validated against vendor quotes and BNEF market data." },
                { label: "Sizing", desc: "IEEE 446, ASHRAE 90.1, CBECS load data, and NREL microgrid standards for accurate ratios." },
                { label: "Incentives", desc: "IRA 2022 dynamic ITC (6–70%), energy community bonuses, domestic content, and MACRS." },
              ].map((item) => (
                <div key={item.label} className="rounded-lg p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#fbbf24" }}>{item.label}</div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Capabilities */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Platform Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: BarChart3, color: "#4ade80", title: "Financial Modeling", items: [
                  "NPV, IRR, and discounted payback",
                  "Battery degradation models (LFP, NMC, flow)",
                  "Monte Carlo P10 / P50 / P90 risk scenarios",
                  "Revenue stacking: arbitrage, DR, peak shaving",
                ]},
                { icon: Search, color: "#60a5fa", title: "Intelligent Sizing", items: [
                  "21 industry profiles with real load data",
                  "Dynamic utility rates by zip code",
                  "Solar production via NREL PVWatts",
                  "8760-hour dispatch simulation",
                ]},
                { icon: Layers, color: "#a78bfa", title: "Complete Quoting", items: [
                  "Equipment breakdown: BESS, inverters, transformers",
                  "Margin policy engine for sell-price quotes",
                  "Professional exports: PDF, Word, Excel",
                  "Bank-ready 3-statement project finance model",
                ]},
                { icon: Shield, color: "#fbbf24", title: "Trust & Compliance", items: [
                  "Full TrueQuote™ audit trail on every quote",
                  "IRA 2022 ITC with prevailing wage + bonus adders",
                  "NREL ATB 2024 & BNEF market benchmarks",
                  "21 industry-specific load profiles",
                ]},
              ].map((section) => (
                <div key={section.title} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ background: `${section.color}15` }}>
                      <section.icon className="w-5 h-5" style={{ color: section.color }} />
                    </div>
                    <h3 className="font-bold text-white">{section.title}</h3>
                  </div>
                  <ul className="space-y-1.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-0.5" style={{ color: section.color }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="font-bold text-white mb-3">21 Industry Profiles</h3>
            <div className="flex flex-wrap gap-2">
              {[
                "🏢 Office", "🏨 Hotel", "🏭 Manufacturing", "⚡ EV Charging",
                "🏥 Hospital", "📡 Data Center", "❄️ Cold Storage", "🏪 Retail",
                "🚗 Car Wash", "🎰 Casino", "✈️ Airport", "🎓 University",
                "🏛️ Government", "🏠 Residential", "🏘️ Apartment", "🌾 Agriculture",
                "⛽ Gas Station", "🏬 Shopping Center", "🌿 Indoor Farm", "📦 Warehouse",
                "🔋 Microgrid",
              ].map((ind) => (
                <span key={ind} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-2xl font-bold text-white mb-2">See it for yourself</h3>
            <p style={{ color: "rgba(255,255,255,0.45)" }} className="mb-6 max-w-xl mx-auto text-sm">
              Answer a few questions about your facility and get a TrueQuote™-verified BESS proposal 
              in under five minutes. No signup, no cost, full source attribution.
            </p>
            <button
              onClick={() => { onClose(); onStartWizard?.(); }}
              className="px-8 py-4 rounded-full font-bold text-lg inline-flex items-center gap-3 transition-all duration-200"
              style={{ background: "#fbbf24", color: "#1a0a2e", boxShadow: "0 4px 24px rgba(251,191,36,0.3)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#fcd34d";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 32px rgba(251,191,36,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fbbf24";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(251,191,36,0.3)";
              }}
            >
              Start My Quote
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
