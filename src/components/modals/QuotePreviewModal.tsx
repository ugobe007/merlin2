import React from "react";
import magicPoofSound from "../../assets/sounds/Magic_Poof.mp3";
import { generateWordDocument } from "./quotePreviewWordDoc";
import { generateExcelData } from "./quotePreviewExcel";
import type { QuotePreviewData } from "./quotePreviewWordDoc";

interface QuotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: QuotePreviewData;
}

const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ isOpen, onClose, quoteData }) => {
  if (!isOpen) return null;

  const playDownloadSound = () => {
    try {
      const audio = new Audio(magicPoofSound);
      audio.volume = 0.5;
    } catch (err) {
      // Sound playback failed - continue silently
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#0c1631", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="p-6 flex justify-between items-center sticky top-0 z-10"
          style={{ background: "#060d1f", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-2xl font-bold text-white">📋 Quote Preview & Download</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Instruction Header */}
          <div
            className="text-white p-6 rounded-xl text-center"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 className="text-xl font-bold mb-2 text-amber-400">✨ Your Quote is Ready!</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Review the details below and download your professional quote documents
            </p>
          </div>

          {/* Summary */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-400 font-medium text-xs">BESS Capacity:</p>
                <p className="text-white font-bold text-lg">
                  {quoteData.batteryMWh.toFixed(1)} MWh
                </p>
              </div>
              <div>
                <p className="text-blue-400 font-medium text-xs">Power Rating:</p>
                <p className="text-white font-bold text-lg">{quoteData.bessPowerMW} MW</p>
              </div>
              {quoteData.solarMW > 0 && (
                <div>
                  <p className="text-amber-400 font-medium text-xs">Solar Capacity:</p>
                  <p className="text-white font-bold text-lg">{quoteData.solarMW} MW</p>
                </div>
              )}
              {quoteData.windMW > 0 && (
                <div>
                  <p className="text-cyan-400 font-medium text-xs">Wind Capacity:</p>
                  <p className="text-white font-bold text-lg">{quoteData.windMW} MW</p>
                </div>
              )}
              {quoteData.generatorMW > 0 && (
                <div>
                  <p className="text-orange-400 font-medium text-xs">Generator Backup:</p>
                  <p className="text-white font-bold text-lg">{quoteData.generatorMW} MW</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Total Investment:
                </span>
                <span className="font-bold text-xl text-white">
                  ${quoteData.costs.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Annual Savings:
                </span>
                <span className="font-bold text-xl text-emerald-400">
                  ${quoteData.annualSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Payback Period:
                </span>
                <span className="font-bold text-xl text-blue-400">
                  {quoteData.paybackPeriod.toFixed(2)} years
                </span>
              </div>
            </div>
          </div>

          {/* Industry Calculation Standards Reference */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 className="text-base font-semibold text-white mb-3 text-center flex items-center justify-center gap-2">
              <span className="text-xl">🔬</span>
              Industry-Standard Calculations
            </h3>
            <p
              className="text-center mb-4 font-medium text-sm"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              All pricing and calculations in this quote are validated against authoritative
              industry sources
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    <strong className="text-white">NREL ATB 2024:</strong> Battery storage costs &
                    methodology
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    <strong className="text-white">GSL Energy 2025:</strong> Commercial BESS pricing
                    ($280-$580/kWh)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    <strong className="text-white">SEIA/AWEA 2025:</strong> Solar & wind market
                    rates
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    <strong className="text-white">IEEE Standards:</strong> Battery degradation
                    models
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    <strong className="text-white">EIA Database:</strong> Generator cost data (Q4
                    2025)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>
                    <strong className="text-white">NPV/IRR Analysis:</strong> Professional financial
                    modeling
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-blue-400 font-semibold">
                    CALCULATION TRANSPARENCY
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Every formula documented in Word export
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-blue-400 font-semibold">MARKET VALIDATED</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Q4 2025 current pricing
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-blue-400 font-semibold">PROFESSIONAL GRADE</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Ready for stakeholder review
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div
            className="p-6 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3 className="text-base font-semibold text-white mb-2 text-center">
              📥 Download Your Quote Documents
            </h3>
            <p className="text-xs mb-4 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              Click below to generate and download your professional quote files
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => void generateWordDocument(quoteData)}
                className="flex-1 px-6 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center space-x-3 hover:scale-[1.02]"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93c5fd",
                }}
              >
                <span className="text-xl">📄</span>
                <span>Download Word Document</span>
              </button>
              <button
                onClick={() => generateExcelData(quoteData)}
                className="flex-1 px-6 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center space-x-3 hover:scale-[1.02]"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#6ee7b7",
                }}
              >
                <span className="text-xl">📊</span>
                <span>Download Excel/CSV</span>
              </button>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
              💡 Pro tip: Download both formats for maximum compatibility
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreviewModal;
