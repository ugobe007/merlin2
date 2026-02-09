/**
 * About View
 * ==========
 * 
 * About page for Merlin BESS platform — TrueQuote™ era
 */

import React from 'react';
import { ArrowLeft, Zap, Shield, BarChart3, Search, Layers, ArrowRight } from 'lucide-react';
import merlinImage from '../../assets/images/new_profile_merlin.png';

interface AboutViewProps {
  onBack: () => void;
  onJoinNow?: () => void;
  onStartWizard?: () => void;
}

const AboutView: React.FC<AboutViewProps> = ({ onBack, onJoinNow, onStartWizard }) => {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)" }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(8,11,20,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={merlinImage} alt="Merlin" className="w-10 h-10 rounded-full" />
            <span className="text-xl font-bold text-white">Merlin</span>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* Hero Card */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex justify-center mb-5">
            <img src={merlinImage} alt="Merlin" className="w-20 h-20 rounded-full" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            About Merlin
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            The first BESS quoting engine where every number is traceable to an authoritative source.
          </p>
        </div>

        {/* The Problem / The Solution */}
        <div className="grid md:grid-cols-2 gap-6">
          <div
            className="rounded-xl p-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h2 className="text-xl font-bold text-white mb-3">The Problem</h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Getting a battery storage quote today means weeks of back-and-forth, opaque pricing, 
              and numbers that appear from nowhere. Businesses can't tell if a quote is competitive, 
              accurate, or even based on real data. That uncertainty kills deals and slows adoption 
              of technology that should be saving money from day one.
            </p>
          </div>
          <div
            className="rounded-xl p-6"
            style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: "#fbbf24" }}>The Merlin Answer</h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Merlin generates investment-grade BESS quotes in under five minutes — with full source 
              attribution for every line item. Our TrueQuote™ engine traces each cost, sizing ratio, 
              and financial assumption back to NREL, IEEE, IRA 2022, and other authoritative benchmarks. 
              No black boxes. No guesswork.
            </p>
          </div>
        </div>

        {/* TrueQuote Section */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(251,191,36,0.15)" }}>
              <Shield className="w-6 h-6" style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">TrueQuote™</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Every number backed by an authoritative source</p>
            </div>
          </div>
          <p className="leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
            TrueQuote™ is Merlin's core differentiator. When you see a cost on your quote, you can click 
            through to the benchmark source — the specific NREL dataset, the IEEE standard, or the IRA 
            provision — that justifies it. Sizing ratios, degradation curves, utility rates, and tax credits 
            are all citation-backed, so you can hand the quote to your CFO, your lender, or your board 
            with confidence.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#fbbf24" }}>Pricing</div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                NREL ATB 2024 for BESS & solar. Scale-based pricing validated against vendor quotes and BNEF market data.
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#fbbf24" }}>Sizing</div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                IEEE 446-1995, ASHRAE 90.1, CBECS, and NREL microgrid standards for load profiles and BESS-to-peak ratios.
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#fbbf24" }}>Incentives</div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                IRA 2022 dynamic ITC (6–70%), energy community bonuses, domestic content adders, and MACRS depreciation.
              </p>
            </div>
          </div>
        </div>

        {/* What the Platform Does */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">What the Platform Does</h2>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            {[
              { icon: BarChart3, color: "#4ade80", title: "Financial Modeling", items: [
                "NPV, IRR, and discounted payback",
                "Battery degradation over project life (LFP, NMC, flow)",
                "Monte Carlo P10 / P50 / P90 risk scenarios",
                "Revenue stacking: arbitrage, demand response, peak shaving",
              ]},
              { icon: Search, color: "#60a5fa", title: "Intelligent Sizing", items: [
                "21 industry profiles — hotels to data centers",
                "ASHRAE / CBECS load data for accurate peak demand",
                "Dynamic utility rates by zip code (EIA + 30+ utilities)",
                "Solar production via NREL PVWatts integration",
              ]},
              { icon: Layers, color: "#a78bfa", title: "Complete Quoting", items: [
                "Equipment breakdown: batteries, inverters, transformers",
                "Margin policy engine for sell-price commercialization",
                "8760-hour dispatch simulation with TOU arbitrage",
                "Professional exports: PDF, Word, and Excel",
              ]},
              { icon: Shield, color: "#fbbf24", title: "Trust & Compliance", items: [
                "IRA 2022 ITC calculator with prevailing wage + bonus adders",
                "NREL ATB 2024 & BNEF market data benchmarks",
                "Full audit trail on every quote (TrueQuote™)",
                "Bank-ready 3-statement project finance model",
              ]},
            ].map((section) => (
              <div key={section.title} className="flex gap-3">
                <div className="p-2 rounded-lg h-fit mt-0.5" style={{ background: `${section.color}15` }}>
                  <section.icon className="w-4 h-4" style={{ color: section.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-2">{section.title}</h3>
                  <ul className="space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span className="mt-0.5" style={{ color: section.color }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industries */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">21 Industry Profiles</h2>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
            Each profile uses industry-specific load data so your quote reflects reality, not averages.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "🏢 Office", "🏨 Hotel", "🏭 Manufacturing", "⚡ EV Charging",
              "🏥 Hospital", "📡 Data Center", "❄️ Cold Storage", "🏪 Retail",
              "🚗 Car Wash", "🎰 Casino", "✈️ Airport", "🎓 University",
              "🏛️ Government", "🏠 Residential", "🏘️ Apartment", "🌾 Agriculture",
              "⛽ Gas Station", "🏬 Shopping Center", "🌿 Indoor Farm", "📦 Warehouse",
              "🔋 Microgrid",
            ].map((ind) => (
              <span
                key={ind}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="text-2xl font-bold text-white mb-2">See it for yourself</h3>
          <p className="text-sm mb-6 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Answer a few questions about your facility and get a TrueQuote™-verified BESS proposal 
            in under five minutes. No signup, no cost, full source attribution.
          </p>
          <div className="flex items-center justify-center gap-4">
            {onStartWizard && (
              <button
                onClick={onStartWizard}
                className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold transition-all duration-200"
                style={{
                  background: "#fbbf24",
                  color: "#1a0a2e",
                  boxShadow: "0 4px 24px rgba(251,191,36,0.3)",
                }}
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
                <Zap className="w-5 h-5" />
                Start My Quote
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onJoinNow && (
              <button
                onClick={onJoinNow}
                className="px-6 py-3.5 rounded-full font-semibold transition-all"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }}
              >
                Join Now
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutView;
