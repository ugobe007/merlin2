import React from "react";
import type { HeroUseCase } from "./heroUseCasesData";

interface HeroUseCaseDetailModalProps {
  useCase: HeroUseCase | null;
  onClose: () => void;
  onStartWizard: () => void;
}

export default function HeroUseCaseDetailModal({
  useCase,
  onClose,
  onStartWizard,
}: HeroUseCaseDetailModalProps) {
  if (!useCase) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => onClose()}
      >
        <div
          className="rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl"
          style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero Image */}
          <div className="relative h-48">
            <img src={useCase.image} alt={useCase.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] to-transparent" />
            <button
              onClick={() => onClose()}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl transition-colors"
            >
              ×
            </button>
            <div className="absolute bottom-4 left-6">
              <span className="bg-[#3ECF8E] text-white px-3 py-1 rounded-full text-sm font-bold">
                {useCase.systemSize}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">{useCase.name}</h2>

            {/* Financial Metrics */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-4xl font-black text-[#3ECF8E] mb-1">{useCase.savings}</div>
                <div className="text-sm text-slate-500">Annual Savings</div>
              </div>
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-4xl font-black text-white mb-1">{useCase.payback}</div>
                <div className="text-sm text-slate-500">Payback Period</div>
              </div>
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-4xl font-black text-[#3ECF8E] mb-1">{useCase.roi}</div>
                <div className="text-sm text-slate-500">25-Year ROI</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 mb-8 leading-relaxed">
              This {useCase.name.toLowerCase()} installation demonstrates the power of battery
              storage for energy cost reduction. With a {useCase.systemSize} system, businesses in
              this sector typically see dramatic reductions in peak demand charges and can take
              advantage of time-of-use rate arbitrage.
            </p>

            {/* CTA */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  onClose();
                  onStartWizard();
                }}
                className="flex-1 py-4 rounded-full font-bold text-lg transition-all"
                style={{
                  background: "rgba(62,207,142,0.15)",
                  border: "2px solid rgba(62,207,142,0.3)",
                  color: "#3ECF8E",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(62,207,142,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(62,207,142,0.15)";
                }}
              >
                🪄 Get a Quote Like This
              </button>
              <button
                onClick={() => onClose()}
                className="px-6 py-4 rounded-full font-semibold text-slate-400 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
