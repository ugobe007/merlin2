import React from "react";
import merlinImage from "../../assets/images/new_profile_merlin.png";

interface HeroAnimationModalProps {
  show: boolean;
  onClose: () => void;
  onStartWizard: () => void;
}

export default function HeroAnimationModal({
  show,
  onClose,
  onStartWizard,
}: HeroAnimationModalProps) {
  if (!show) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={() => onClose()}
      >
        <div
          className="rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl"
          style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - More Compact */}
          <div
            className="p-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <img
                src={merlinImage}
                alt="Merlin"
                className="w-12 h-12 drop-shadow-xl animate-float"
              />
              <div>
                <h2 className="text-xl font-bold text-white">The Power of Merlin AI</h2>
                <p className="text-slate-500 text-xs">Your energy savings journey</p>
              </div>
            </div>
            <button
              onClick={() => onClose()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
            >
              ×
            </button>
          </div>

          {/* ANIMATED FLOW - Inputs → Merlin → BIG SAVINGS */}
          <div className="p-6">
            {/* Flow Visualization */}
            <div className="relative mb-8">
              {/* Connection Line - Animated */}
              <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 hidden md:block">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-[#3ECF8E] to-emerald-500 rounded-full"
                  style={{
                    animation: "flowLine 3s ease-in-out infinite",
                    width: "100%",
                  }}
                />
              </div>

              {/* Three Stage Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* STAGE 1: YOUR INPUTS */}
                <div
                  className="backdrop-blur-xl rounded-2xl p-5 transform transition-all hover:scale-[1.02]"
                  style={{
                    animation: "slideInLeft 0.5s ease-out",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="text-center mb-4">
                    <div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-3xl">📊</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">Your Inputs</h3>
                  </div>

                  {/* Animated Input Items */}
                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        animation: "fadeSlideIn 0.6s ease-out 0.2s both",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <span className="text-lg">🏢</span>
                      <div>
                        <div className="text-xs text-slate-500">Industry</div>
                        <div className="text-sm text-white font-medium">Hotel • 350 rooms</div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        animation: "fadeSlideIn 0.6s ease-out 0.4s both",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <span className="text-lg">📍</span>
                      <div>
                        <div className="text-xs text-slate-500">Location</div>
                        <div className="text-sm text-white font-medium">California • $0.24/kWh</div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{
                        animation: "fadeSlideIn 0.6s ease-out 0.6s both",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <span className="text-lg">🎯</span>
                      <div>
                        <div className="text-xs text-slate-500">Goals</div>
                        <div className="text-sm text-white font-medium">
                          Cost savings + EV charging
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow indicator (mobile) */}
                  <div className="md:hidden flex justify-center mt-4 text-slate-400 animate-bounce">
                    <span className="text-2xl">↓</span>
                  </div>
                </div>

                {/* STAGE 2: MERLIN MAGIC - Central, highlighted */}
                <div
                  className="backdrop-blur-xl rounded-2xl p-5 transform transition-all hover:scale-[1.02] relative"
                  style={{
                    animation: "pulseGlow 2s ease-in-out infinite",
                    background: "rgba(62,207,142,0.06)",
                    border: "2px solid rgba(62,207,142,0.25)",
                    boxShadow: "0 0 40px rgba(62,207,142,0.1)",
                  }}
                >
                  {/* Processing Badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3ECF8E] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    AI Processing
                  </div>

                  <div className="text-center mb-4 pt-2">
                    <div className="relative inline-block">
                      <img
                        src={merlinImage}
                        alt="Merlin"
                        className="w-20 h-20 animate-float drop-shadow-2xl"
                      />
                      {/* Sparkles around Merlin */}
                      <div
                        className="absolute -top-2 -left-2 text-lg animate-ping"
                        style={{ animationDuration: "1.5s" }}
                      >
                        ✨
                      </div>
                      <div
                        className="absolute -top-1 -right-3 text-sm animate-ping"
                        style={{ animationDuration: "2s", animationDelay: "0.5s" }}
                      >
                        ⚡
                      </div>
                      <div
                        className="absolute -bottom-1 -left-3 text-sm animate-ping"
                        style={{ animationDuration: "1.8s", animationDelay: "0.3s" }}
                      >
                        🔮
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#3ECF8E] mt-2">Merlin Analyzes</h3>
                  </div>

                  {/* Processing Indicators */}
                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div className="w-4 h-4 bg-[#3ECF8E] rounded-full animate-pulse" />
                      <span className="text-xs text-white">Industry power profile matched</span>
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="w-4 h-4 bg-[#3ECF8E] rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <span className="text-xs text-white">NREL ATB 2024 pricing applied</span>
                    </div>
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="w-4 h-4 bg-[#3ECF8E] rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                      <span className="text-xs text-white">Optimal configuration found!</span>
                    </div>
                  </div>

                  {/* Arrow indicator (mobile) */}
                  <div className="md:hidden flex justify-center mt-4 text-[#3ECF8E] animate-bounce">
                    <span className="text-2xl">↓</span>
                  </div>
                </div>

                {/* STAGE 3: BIG SAVINGS - Most emphasized */}
                <div
                  className="bg-gradient-to-br from-emerald-600/30 via-emerald-700/20 to-green-800/30 backdrop-blur-xl rounded-2xl p-5 border-2 border-emerald-500/60 transform transition-all hover:scale-[1.02] relative overflow-hidden"
                  style={{
                    animation: "slideInRight 0.5s ease-out 0.3s both",
                    boxShadow: "0 0 50px rgba(16,185,129,0.25)",
                  }}
                >
                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                    style={{ animation: "shimmer 2s ease-in-out infinite" }}
                  />

                  <div className="text-center mb-4 relative z-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/40 mb-3">
                      <span className="text-3xl">💰</span>
                    </div>
                    <h3 className="text-lg font-bold text-emerald-400">Your Savings</h3>
                  </div>

                  {/* BIG SAVINGS NUMBERS - Animated counter effect */}
                  <div className="space-y-3 relative z-10">
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="text-3xl md:text-4xl font-black text-[#3ECF8E]"
                        style={{ textShadow: "0 0 20px rgba(62,207,142,0.3)" }}
                      >
                        $127,500
                      </div>
                      <div className="text-xs text-slate-400">Annual Savings</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className="text-center p-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="text-xl font-bold text-white">2.1 yrs</div>
                        <div className="text-xs text-slate-500">Payback</div>
                      </div>
                      <div
                        className="text-center p-2 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <div className="text-xl font-bold text-[#3ECF8E]">485%</div>
                        <div className="text-xs text-slate-500">25-yr ROI</div>
                      </div>
                    </div>

                    {/* Tax Credit Badge */}
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 py-2 rounded-full">
                      <span>✓</span> 30% Federal Tax Credit Included
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Configuration Preview */}
            <div
              className="backdrop-blur-sm rounded-2xl p-4 mb-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔋</div>
                    <div className="text-lg font-bold text-white">2.0 MW</div>
                    <div className="text-xs text-slate-500">Battery</div>
                  </div>
                  <div className="text-slate-600">+</div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">☀️</div>
                    <div className="text-lg font-bold text-white">500 kWp</div>
                    <div className="text-xs text-slate-500">Solar</div>
                  </div>
                  <div className="text-slate-600">+</div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">⚡</div>
                    <div className="text-lg font-bold text-white">8 Ports</div>
                    <div className="text-xs text-slate-500">EV Charging</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Net System Cost</div>
                  <div className="text-xl font-bold text-white">$485,000</div>
                  <div className="text-xs text-[#3ECF8E]">After 30% ITC</div>
                </div>
              </div>
            </div>

            {/* CTA - Larger, more prominent */}
            <button
              onClick={() => {
                onClose();
                onStartWizard();
              }}
              className="w-full py-5 rounded-full font-bold text-xl transition-all flex items-center justify-center gap-3 group"
              style={{
                background: "rgba(62,207,142,0.15)",
                border: "2px solid rgba(62,207,142,0.3)",
                color: "#3ECF8E",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(62,207,142,0.25)";
                e.currentTarget.style.borderColor = "rgba(62,207,142,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(62,207,142,0.15)";
                e.currentTarget.style.borderColor = "rgba(62,207,142,0.3)";
              }}
            >
              <span className="text-2xl group-hover:animate-bounce">🪄</span>
              <span>Get Your Personalized Quote</span>
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </button>
            <p className="text-center text-slate-500 text-sm mt-3">
              No signup required • 5 easy steps
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
