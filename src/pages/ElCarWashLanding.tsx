import React, { useState } from "react";
import { MiniWizardV8 } from "@/wizard/v8/MiniWizardV8";

export default function ElCarWashLanding() {
  const [showWizard, setShowWizard] = useState(false);

  if (showWizard) {
    return <MiniWizardV8 industry="car_wash" companyName="El Car Wash" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-white">Merlin BESS</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="/" className="text-gray-300 hover:text-white transition">
                Home
              </a>
              <a href="/wizard-v8" className="text-gray-300 hover:text-white transition">
                Quote Tool
              </a>
              <button
                onClick={() =>
                  window.open(
                    "mailto:sales@merlinbess.com?subject=El%20Car%20Wash%20Partnership",
                    "_blank"
                  )
                }
                className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
              <span className="text-emerald-400 text-sm font-semibold">
                🎯 ALPHA PARTNERSHIP OPPORTUNITY
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Transform El Car Wash Into
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                America's Most Sustainable Car Wash Chain
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Portfolio-wide solar + battery transformation: $2.1M investment → $180K/year savings →
              5.8yr payback across 5 Florida locations
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() =>
                  window.open(
                    "mailto:sales@merlinbess.com?subject=Schedule%20El%20Car%20Wash%20Demo&body=I%27d%20like%20to%20schedule%20a%20demo%20for%20El%20Car%20Wash.%20Please%20contact%20me%20at%20your%20earliest%20convenience.",
                    "_blank"
                  )
                }
                className="px-8 py-4 border-2 border-emerald-500 text-emerald-400 text-lg font-semibold rounded-lg hover:border-emerald-400 hover:text-emerald-300 transition-all"
                style={{ background: "transparent" }}
              >
                📅 Schedule Alpha Site Demo
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="px-12 py-5 border-3 border-cyan-400 text-cyan-300 text-2xl font-black rounded-xl hover:border-cyan-300 hover:text-cyan-200 hover:shadow-2xl hover:shadow-cyan-400/30 transition-all transform hover:scale-105"
                style={{
                  background: "transparent",
                  boxShadow: "0 0 30px rgba(34, 211, 238, 0.15)",
                }}
              >
                📊 Get Your Live Quote
              </button>
            </div>
          </div>

          {/* Portfolio Metrics Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">$2.1M</div>
              <div className="text-gray-300">Total Investment</div>
              <div className="text-sm text-gray-500 mt-1">5 Florida Sites</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">$180K</div>
              <div className="text-gray-300">Annual Savings</div>
              <div className="text-sm text-gray-500 mt-1">Year 1</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">5.8yr</div>
              <div className="text-gray-300">Avg Payback</div>
              <div className="text-sm text-gray-500 mt-1">Simple Payback</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-orange-400 mb-2">110%</div>
              <div className="text-gray-300">10-Year ROI</div>
              <div className="text-sm text-gray-500 mt-1">Base Case</div>
            </div>
          </div>

          {/* Featured Quote Showcase - Miami Flagship - HERO STYLE */}
          <div className="mb-20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 px-5 py-2 border-2 border-emerald-400 rounded-full mb-6">
                <span className="text-emerald-400 text-sm font-bold tracking-wide">
                  LIVE QUOTE EXAMPLE
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Miami Flagship Location
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Real numbers. Real savings. No smoke and mirrors.
              </p>
            </div>

            {/* HERO NUMBERS - Featured Savings & ROI */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Annual Savings - HERO */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border-3 border-cyan-400 rounded-2xl p-8 text-center hover:border-cyan-300 transition-all">
                  <div className="text-sm font-bold text-cyan-400 tracking-wider mb-2">
                    ANNUAL SAVINGS
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tight">
                    $38.5K
                  </div>
                  <div className="text-lg text-cyan-300 font-semibold mb-3">/year guaranteed</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-3"></div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Demand charges: <span className="text-cyan-300">$29.3K</span>
                    </div>
                    <div>
                      Energy arbitrage: <span className="text-cyan-300">$9.2K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI - HERO */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border-3 border-orange-400 rounded-2xl p-8 text-center hover:border-orange-300 transition-all">
                  <div className="text-sm font-bold text-orange-400 tracking-wider mb-2">
                    10-YEAR ROI
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tight">
                    116%
                  </div>
                  <div className="text-lg text-orange-300 font-semibold mb-3">above break-even</div>
                  <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mb-3"></div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      Payback: <span className="text-orange-300">5.8 years</span>
                    </div>
                    <div>
                      IRR: <span className="text-orange-300">19.4%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border-3 border-emerald-400 rounded-2xl p-8 text-center hover:border-emerald-300 transition-all">
                  <div className="text-sm font-bold text-emerald-400 tracking-wider mb-2">
                    TOTAL INVESTMENT
                  </div>
                  <div className="text-6xl md:text-7xl font-black text-white mb-2 tracking-tight">
                    $448K
                  </div>
                  <div className="text-lg text-emerald-300 font-semibold mb-3">
                    turnkey installed
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-3"></div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>
                      25-yr NPV: <span className="text-emerald-300">$627K</span>
                    </div>
                    <div>
                      Net gain: <span className="text-emerald-300">$179K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown - Supabase Style */}
            <div className="bg-gray-900/50 backdrop-blur border-2 border-gray-700 rounded-2xl overflow-hidden">
              {/* System Configuration */}
              <div className="p-8 border-b border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-emerald-400 mr-3">⚡</span>
                  System Configuration
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-emerald-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Peak Load</div>
                    <div className="text-2xl font-bold text-white">220 kW</div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-cyan-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Solar Carport</div>
                    <div className="text-2xl font-bold text-cyan-300">165 kW</div>
                    <div className="text-xs text-gray-500 mt-1">75% coverage</div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-orange-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Battery Storage</div>
                    <div className="text-2xl font-bold text-orange-300">413 kWh</div>
                    <div className="text-xs text-gray-500 mt-1">132 kW power</div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-emerald-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                    <div className="text-2xl font-bold text-emerald-300">3.1 hrs</div>
                  </div>
                  <div className="border-2 border-gray-700 rounded-xl p-4 text-center hover:border-cyan-400 transition-all">
                    <div className="text-xs text-gray-500 mb-1">Backup</div>
                    <div className="text-2xl font-bold text-cyan-300">&lt;16ms</div>
                    <div className="text-xs text-gray-500 mt-1">transfer time</div>
                  </div>
                </div>
              </div>

              {/* Investment Breakdown */}
              <div className="p-8 border-b border-gray-700">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-emerald-400 mr-3">💰</span>
                  Investment Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all">
                    <span className="text-gray-300 font-medium">Battery Storage System</span>
                    <span className="text-emerald-400 font-bold text-xl">$172,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-cyan-400 transition-all">
                    <span className="text-gray-300 font-medium">Solar Carport Installation</span>
                    <span className="text-cyan-400 font-bold text-xl">$140,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-orange-400 transition-all">
                    <span className="text-gray-300 font-medium">Balance of System</span>
                    <span className="text-orange-400 font-bold text-xl">$59,000</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all">
                    <span className="text-gray-300 font-medium">EPC & Installation Labor</span>
                    <span className="text-emerald-400 font-bold text-xl">$77,000</span>
                  </div>
                </div>
              </div>

              {/* Key Value Props */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="text-cyan-400 mr-3">🌟</span>
                  Why This Works
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3 p-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all">
                    <span className="text-emerald-400 text-2xl">✓</span>
                    <div>
                      <div className="text-white font-bold mb-1">
                        Solar Carport = Free Real Estate
                      </div>
                      <div className="text-gray-400 text-sm">
                        Customer parking provides shade + 75% solar coverage—no roof modifications
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border-2 border-gray-700 rounded-xl hover:border-cyan-400 transition-all">
                    <span className="text-cyan-400 text-2xl">✓</span>
                    <div>
                      <div className="text-white font-bold mb-1">Peak Shaving Saves $29K/year</div>
                      <div className="text-gray-400 text-sm">
                        BESS reduces demand charges during 11am-7pm wash peak hours
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border-2 border-gray-700 rounded-xl hover:border-orange-400 transition-all">
                    <span className="text-orange-400 text-2xl">✓</span>
                    <div>
                      <div className="text-white font-bold mb-1">Brand Differentiation</div>
                      <div className="text-gray-400 text-sm">
                        "Solar-Powered Car Wash" marketing value + sustainability positioning
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 border-2 border-gray-700 rounded-xl hover:border-emerald-400 transition-all">
                    <span className="text-emerald-400 text-2xl">✓</span>
                    <div>
                      <div className="text-white font-bold mb-1">Hurricane-Rated Equipment</div>
                      <div className="text-gray-400 text-sm">
                        150+ mph wind-rated + instant backup power (&lt;16ms transfer)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Footer */}
              <div className="bg-gray-900/80 border-t-2 border-gray-700 px-8 py-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-gray-400">
                    <span className="text-emerald-400 font-semibold">TrueQuote™</span> verified
                    pricing • 25-year warranty • Valid 90 days
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        window.open("/campaigns/EL_CAR_WASH_FLORIDA_QUOTES.md", "_blank")
                      }
                      className="px-6 py-3 border-2 border-cyan-400 text-cyan-400 font-bold rounded-lg hover:bg-cyan-400/10 transition-all"
                    >
                      Download Full Quote
                    </button>
                    <button
                      onClick={() =>
                        window.open(
                          "mailto:sales@merlinbess.com?subject=El%20Car%20Wash%20Miami%20Quote%20Request&body=I%27d%20like%20to%20discuss%20the%20Miami%20flagship%20quote%20for%20El%20Car%20Wash.",
                          "_blank"
                        )
                      }
                      className="px-6 py-3 border-2 border-emerald-400 text-emerald-400 font-bold rounded-lg hover:bg-emerald-400/10 transition-all"
                    >
                      Request Custom Quote →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why El Car Wash Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl p-12 mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🎯 Why El Car Wash Is the Perfect Alpha Partner
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">💼</div>
                <h3 className="text-xl font-semibold text-white mb-3">PE-Backed Speed & Scale</h3>
                <p className="text-gray-300">
                  Financial sophistication, fast decisions, 50+ site portfolio for national rollout
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">☀️</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Florida Footprint = Max ROI
                </h3>
                <p className="text-gray-300">
                  Best solar resource (1,700 kWh/kW/yr), high electricity rates, hurricane
                  resilience value
                </p>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold text-white mb-3">Perfect Use Case Fit</h3>
                <p className="text-gray-300">
                  Customer parking = free solar real estate, predictable loads, ideal for carport
                  systems
                </p>
              </div>
            </div>
          </div>

          {/* 5 Florida Sites */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              📍 5 Florida Locations Ready for Transformation
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                {
                  city: "Miami",
                  peak: "220 kW",
                  investment: "$448K",
                  savings: "$38.5K",
                  payback: "5.8yr",
                  irr: "19.4%",
                },
                {
                  city: "Ft. Lauderdale",
                  peak: "190 kW",
                  investment: "$405K",
                  savings: "$33.2K",
                  payback: "6.1yr",
                  irr: "18.7%",
                },
                {
                  city: "Tampa",
                  peak: "165 kW",
                  investment: "$368K",
                  savings: "$29.4K",
                  payback: "6.2yr",
                  irr: "18.3%",
                },
                {
                  city: "Orlando",
                  peak: "190 kW",
                  investment: "$407K",
                  savings: "$33.8K",
                  payback: "6.0yr",
                  irr: "18.9%",
                },
                {
                  city: "Jacksonville",
                  peak: "165 kW",
                  investment: "$365K",
                  savings: "$28.9K",
                  payback: "6.3yr",
                  irr: "18.1%",
                },
              ].map((site) => (
                <div
                  key={site.city}
                  className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-5"
                >
                  <div className="text-lg font-bold text-white mb-3">{site.city}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Peak Load</span>
                      <span className="text-gray-200 font-semibold">{site.peak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment</span>
                      <span className="text-emerald-400 font-semibold">{site.investment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annual Savings</span>
                      <span className="text-blue-400 font-semibold">{site.savings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payback</span>
                      <span className="text-purple-400 font-semibold">{site.payback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IRR</span>
                      <span className="text-orange-400 font-semibold">{site.irr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Comparison - Miami Flagship */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🚀 Scenario Analysis: Miami Flagship
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
              {[
                {
                  name: "Solar Only",
                  investment: "$185K",
                  savings: "$17.4K",
                  payback: "10.6yr",
                  roi: "48%",
                  note: "Lowest cost",
                },
                {
                  name: "Solar + BESS",
                  investment: "$448K",
                  savings: "$38.5K",
                  payback: "5.8yr",
                  roi: "116%",
                  note: "✅ Recommended",
                  highlight: true,
                },
                {
                  name: "Solar + BESS + Backup",
                  investment: "$595K",
                  savings: "$40.2K",
                  payback: "7.4yr",
                  roi: "95%",
                  note: "Max resilience",
                },
                {
                  name: "Solar + BESS + EV",
                  investment: "$496K",
                  savings: "$80.5K",
                  payback: "6.2yr",
                  roi: "162%",
                  note: "New revenue",
                },
                {
                  name: "Complete Package",
                  investment: "$643K",
                  savings: "$82.2K",
                  payback: "7.8yr",
                  roi: "128%",
                  note: "Flagship showcase",
                },
              ].map((scenario) => (
                <div
                  key={scenario.name}
                  className={`backdrop-blur border rounded-xl p-5 ${
                    scenario.highlight
                      ? "bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30"
                      : "bg-gray-800/50 border-gray-700"
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-400 mb-1">{scenario.note}</div>
                  <div className="text-lg font-bold text-white mb-3">{scenario.name}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Investment</span>
                      <span className="text-emerald-400 font-semibold">{scenario.investment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annual</span>
                      <span className="text-blue-400 font-semibold">{scenario.savings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payback</span>
                      <span className="text-purple-400 font-semibold">{scenario.payback}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">10yr ROI</span>
                      <span className="text-orange-400 font-semibold">{scenario.roi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Value Propositions */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🌟 Unique Value Propositions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: "🌞",
                  title: "Solar Carport = Free Real Estate",
                  desc: "Use customer parking for solar + provide shade — no roof modifications",
                },
                {
                  icon: "⚡",
                  title: "Peak Shaving = $24K-29K/year",
                  desc: "BESS reduces demand charges during 11am-7pm wash peak hours",
                },
                {
                  icon: "🏆",
                  title: "Brand Differentiation",
                  desc: '"Solar-Powered Car Wash" — marketing & PR value + sustainability positioning',
                },
                {
                  icon: "🌪️",
                  title: "Hurricane Resilience",
                  desc: "150+ mph wind-rated equipment + instant backup power (<16ms transfer)",
                },
                {
                  icon: "🔋",
                  title: "EV Charging Revenue Option",
                  desc: "Add $42K/year revenue with Level 2 chargers — attract high-income customers",
                },
                {
                  icon: "📈",
                  title: "Portfolio-Wide Scalability",
                  desc: "Standardize → replicate across 50+ sites → $1.8M+ annual savings",
                },
              ].map((prop) => (
                <div
                  key={prop.title}
                  className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6"
                >
                  <div className="text-4xl mb-3">{prop.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{prop.title}</h3>
                  <p className="text-gray-300 text-sm">{prop.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* EPC Partners */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              🔧 Tier 1 EPC Partners (Pre-Vetted)
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 backdrop-blur border border-emerald-500/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Advanced Green Technologies</div>
                  <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-400 text-xs font-semibold">
                    #1 RECOMMENDED
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✅ Florida-based solar carport specialists</li>
                  <li>✅ Engineering + fabrication + installation (turnkey)</li>
                  <li>✅ Hurricane engineering experience</li>
                  <li>✅ Energy storage integration</li>
                  <li>✅ PE-friendly contracting</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Solar Source</div>
                  <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-xs font-semibold">
                    #2 STRONG BACKUP
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✅ Self-performs all work (no subs)</li>
                  <li>✅ Parking lot carports, ground mounts</li>
                  <li>✅ Energy storage experience</li>
                  <li>✅ Fast-track scheduling</li>
                  <li>✅ Florida statewide operations</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-white">Compass Solar Energy</div>
                  <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-400 text-xs font-semibold">
                    #3 SOLID ALTERNATIVE
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>✅ Government + commercial carport track record</li>
                  <li>✅ Strong utility/permitting relationships</li>
                  <li>✅ References: Colleges, municipal sites</li>
                  <li>✅ Conservative execution</li>
                  <li>✅ Florida statewide</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 backdrop-blur border border-emerald-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform El Car Wash?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Schedule an alpha site demo, coordinate EPC site walks, or download the full quote
              package with 25-year financial models.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() =>
                  window.open(
                    "mailto:sales@merlinbess.com?subject=El%20Car%20Wash%20Alpha%20Demo%20Request&body=I%27m%20interested%20in%20scheduling%20an%20alpha%20site%20demo%20for%20El%20Car%20Wash.%20Please%20contact%20me%20at%3A%0A%0AName%3A%20%0ATitle%3A%20%0APhone%3A%20%0AEmail%3A%20%0A%0APreferred%20alpha%20site%3A%20%5BMiami%20or%20Orlando%5D%0APreferred%20configuration%3A%20%5BSolar%2BBESS%20or%20Solar%2BBESS%2BEV%5D",
                    "_blank"
                  )
                }
                className="px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-lg hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
              >
                📅 Schedule Alpha Site Demo
              </button>
              <button
                onClick={() => window.open("/campaigns/EL_CAR_WASH_FLORIDA_QUOTES.md", "_blank")}
                className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                📊 Download Full Quotes
              </button>
              <button
                onClick={() => (window.location.href = "/wizard-v8")}
                className="px-8 py-4 bg-gray-700 text-white text-lg font-semibold rounded-lg hover:bg-gray-600 transition"
              >
                🧮 Try Quote Tool
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p className="mb-4">⚡ Merlin BESS Solutions — Alpha Partnership Program</p>
          <p className="text-sm">
            Campaign: El Car Wash Florida Transformation | March 2026
            <br />
            For inquiries:{" "}
            <a
              href="mailto:sales@merlinbess.com"
              className="text-emerald-400 hover:text-emerald-300"
            >
              sales@merlinbess.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
