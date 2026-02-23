import React from "react";
import merlinImage from "../../assets/images/new_profile_merlin.png";
import { MethodologyStatement } from "../shared/IndustryComplianceBadges";

interface HeroHowItWorksModalProps {
  show: boolean;
  onClose: () => void;
  onStartWizard: () => void;
}

export default function HeroHowItWorksModal({
  show,
  onClose,
  onStartWizard,
}: HeroHowItWorksModalProps) {
  if (!show) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => onClose()}
      >
        <div
          className="rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
          style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
              <h2 className="text-3xl font-bold text-white">How Merlin Works</h2>
            </div>
            <button onClick={() => onClose()} className="text-slate-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Tell Us About Your Business</h3>
                <p className="text-slate-400">
                  Answer a few quick questions about your facility, energy usage, and goals.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Merlin Analyzes Your Needs</h3>
                <p className="text-slate-400">
                  Our AI uses NREL ATB 2024 pricing and DOE-aligned methodology to design the
                  optimal energy solution.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Get Your Custom Quote</h3>
                <p className="text-slate-400">
                  Receive a detailed, bank-ready proposal with ROI projections and equipment
                  specs—all with traceable sources.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Start Saving Money</h3>
                <p className="text-slate-400">
                  Connect with certified installers and start cutting your energy costs.
                </p>
              </div>
            </div>
          </div>

          {/* Industry Compliance Statement */}
          <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <MethodologyStatement
              variant="compact"
              darkMode={true}
              message="NREL ATB 2024 & DOE StoreFAST aligned"
            />
          </div>

          <button
            onClick={() => {
              onClose();
              onStartWizard();
            }}
            className="w-full mt-6 py-4 rounded-full font-bold text-lg transition-all"
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
            🪄 Start My Free Quote →
          </button>
        </div>
      </div>
    </>
  );
}
