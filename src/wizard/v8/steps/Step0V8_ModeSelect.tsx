/**
 * =============================================================================
 * STEP 0: MODE SELECTION — Premium redesign
 * =============================================================================
 */

import React, { useState } from "react";
import { ArrowRight, Zap, Wrench, Upload, CheckCircle2, Clock3, Shield } from "lucide-react";

interface Step0V8Props {
  onSelectMode: (mode: "wizard" | "proquote" | "upload") => void;
}

export function Step0V8_ModeSelect({ onSelectMode }: Step0V8Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="relative min-h-full w-full flex flex-col items-center justify-center px-6 py-12 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)" }}
    >
      {/* Ambient glow — top green */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 300,
          background: "radial-gradient(ellipse, rgba(62,207,142,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Ambient glow — bottom amber */}
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: 0,
          right: 0,
          width: 360,
          height: 240,
          background: "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(62,207,142,0.08)",
              border: "1px solid rgba(62,207,142,0.2)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#3ECF8E",
                display: "inline-block",
                boxShadow: "0 0 8px #3ECF8E",
              }}
            />
            <span
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "#3ECF8E" }}
            >
              TrueQuote™ Platform
            </span>
          </div>
          <h1
            className="text-4xl font-extrabold tracking-tight mb-3"
            style={{
              color: "#fff",
              lineHeight: 1.1,
              textShadow: "0 2px 30px rgba(62,207,142,0.12)",
            }}
          >
            Build Your BESS Quote
          </h1>
          <p className="text-slate-400 text-base" style={{ maxWidth: 400, margin: "0 auto" }}>
            Choose the workflow that fits your project — AI-guided or full engineering control.
          </p>
        </div>

        {/* ── Primary cards: side-by-side ── */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Guided Wizard */}
          <button
            onClick={() => onSelectMode("wizard")}
            onMouseEnter={() => setHovered("wizard")}
            onMouseLeave={() => setHovered(null)}
            className="group relative text-left rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background:
                hovered === "wizard"
                  ? "linear-gradient(145deg, rgba(62,207,142,0.12) 0%, rgba(10,22,40,0.95) 60%)"
                  : "linear-gradient(145deg, rgba(62,207,142,0.06) 0%, rgba(10,22,40,0.9) 60%)",
              border:
                hovered === "wizard"
                  ? "1.5px solid rgba(62,207,142,0.45)"
                  : "1.5px solid rgba(62,207,142,0.18)",
              boxShadow:
                hovered === "wizard"
                  ? "0 0 0 1px rgba(62,207,142,0.12), 0 16px 48px -8px rgba(62,207,142,0.25)"
                  : "0 4px 20px -4px rgba(0,0,0,0.5)",
              transform: hovered === "wizard" ? "translateY(-3px)" : "translateY(0)",
            }}
          >
            {/* POPULAR ribbon */}
            <div
              className="absolute top-0 right-0 overflow-hidden"
              style={{ width: 80, height: 80 }}
            >
              <div
                className="absolute text-[9px] font-bold tracking-wider text-white text-center"
                style={{
                  top: 16,
                  right: -18,
                  width: 80,
                  transform: "rotate(45deg)",
                  background: "linear-gradient(90deg, #3ECF8E, #22c77a)",
                  padding: "2px 0",
                }}
              >
                POPULAR
              </div>
            </div>

            <div className="p-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(62,207,142,0.2) 0%, rgba(62,207,142,0.05) 100%)",
                  border: "1.5px solid rgba(62,207,142,0.35)",
                  boxShadow: "0 0 24px rgba(62,207,142,0.15)",
                }}
              >
                <Zap className="w-6 h-6" style={{ color: "#3ECF8E" }} />
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-bold text-white mb-1.5">Guided Wizard</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      color: "#3ECF8E",
                      background: "rgba(62,207,142,0.12)",
                      border: "1px solid rgba(62,207,142,0.25)",
                    }}
                  >
                    Free
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      color: "#3ECF8E",
                      background: "rgba(62,207,142,0.08)",
                      border: "1px solid rgba(62,207,142,0.2)",
                    }}
                  >
                    AI-Powered
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: "#F59E0B",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    TrueQuote™
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Get a bankable BESS quote in 3 minutes with verified pricing.
              </p>

              <ul className="space-y-1.5 mb-5">
                {[
                  "5-step AI-guided process",
                  "TrueQuote™ verified pricing",
                  "Instant ROI + savings",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "#3ECF8E" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <div
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "#3ECF8E" }}
              >
                <Clock3 className="w-3.5 h-3.5" />
                <span>~3 minutes</span>
                <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </button>

          {/* ProQuote™ */}
          <button
            onClick={() => onSelectMode("proquote")}
            onMouseEnter={() => setHovered("proquote")}
            onMouseLeave={() => setHovered(null)}
            className="group relative text-left rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background:
                hovered === "proquote"
                  ? "linear-gradient(145deg, rgba(245,158,11,0.1) 0%, rgba(10,22,40,0.95) 60%)"
                  : "linear-gradient(145deg, rgba(245,158,11,0.05) 0%, rgba(10,22,40,0.9) 60%)",
              border:
                hovered === "proquote"
                  ? "1.5px solid rgba(245,158,11,0.45)"
                  : "1.5px solid rgba(245,158,11,0.18)",
              boxShadow:
                hovered === "proquote"
                  ? "0 0 0 1px rgba(245,158,11,0.12), 0 16px 48px -8px rgba(245,158,11,0.2)"
                  : "0 4px 20px -4px rgba(0,0,0,0.5)",
              transform: hovered === "proquote" ? "translateY(-3px)" : "translateY(0)",
            }}
          >
            <div className="p-6">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)",
                  border: "1.5px solid rgba(245,158,11,0.35)",
                  boxShadow: "0 0 24px rgba(245,158,11,0.12)",
                }}
              >
                <Wrench className="w-6 h-6" style={{ color: "#F59E0B" }} />
              </div>

              <div className="mb-2">
                <h3 className="text-lg font-bold text-white mb-1.5">ProQuote™</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      color: "#F59E0B",
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    Advanced
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      color: "#F59E0B",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    Custom
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Full engineering control for complex projects with custom equipment specs.
              </p>

              <ul className="space-y-1.5 mb-5">
                {[
                  "Custom equipment & sizing",
                  "Vendor & EPC workflows",
                  "Full spec-sheet output",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "#F59E0B" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <div
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "#F59E0B" }}
              >
                <span>For engineers &amp; EPCs</span>
                <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </button>
        </div>

        {/* ── Upload Quote — compact secondary strip ── */}
        <button
          onClick={() => onSelectMode("upload")}
          onMouseEnter={() => setHovered("upload")}
          onMouseLeave={() => setHovered(null)}
          className="group w-full text-left rounded-xl transition-all duration-300"
          style={{
            background: hovered === "upload" ? "rgba(148,163,184,0.07)" : "rgba(148,163,184,0.03)",
            border:
              hovered === "upload"
                ? "1px solid rgba(148,163,184,0.25)"
                : "1px solid rgba(148,163,184,0.1)",
            boxShadow: hovered === "upload" ? "0 4px 20px -4px rgba(0,0,0,0.4)" : "none",
            transform: hovered === "upload" ? "translateY(-1px)" : "translateY(0)",
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(148,163,184,0.08)",
                border: "1px solid rgba(148,163,184,0.2)",
              }}
            >
              <Upload className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-slate-200">Upload Quote</span>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded text-slate-400"
                  style={{
                    background: "rgba(148,163,184,0.1)",
                    border: "1px solid rgba(148,163,184,0.15)",
                  }}
                >
                  Review • Enhance
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Import an existing quote for TrueQuote™ review and enhancement
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </button>

        {/* ── Footer ── */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Not sure?{" "}
          <button
            onClick={() => onSelectMode("wizard")}
            className="font-semibold hover:underline"
            style={{ color: "#3ECF8E" }}
          >
            Start with the Guided Wizard
          </button>{" "}
          — it only takes 3 minutes.
        </p>
      </div>
    </div>
  );
}

export default Step0V8_ModeSelect;
