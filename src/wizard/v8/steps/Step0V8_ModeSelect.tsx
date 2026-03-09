/**
 * =============================================================================
 * STEP 0: MODE SELECTION
 * =============================================================================
 *
 * Allows user to choose between:
 * 1. Guided Wizard (free) - AI-powered wizard for BESS quotes
 * 2. ProQuote™ (advanced) - Full engineering control, custom equipment
 * 3. Upload Quote - Import existing quote for review/enhancement
 *
 * This step appears BEFORE Step 1 (Location).
 * =============================================================================
 */

import React from "react";
import { ArrowRight, Zap, Wrench, Upload } from "lucide-react";

interface Step0V8Props {
  onSelectMode: (mode: "wizard" | "proquote" | "upload") => void;
}

export function Step0V8_ModeSelect({ onSelectMode }: Step0V8Props) {
  const modes = [
    {
      id: "wizard" as const,
      icon: Zap,
      title: "Guided Wizard",
      subtitle: "Free • AI-Powered",
      description:
        "Get a bankable BESS quote in 3 minutes. Perfect for standard commercial projects.",
      features: [
        "TrueQuote™ verified pricing",
        "NREL & IRA 2022 data",
        "Industry-specific sizing",
        "Instant PDF export",
      ],
      cta: "Start Free Quote",
      accent: "#3ECF8E",
    },
    {
      id: "proquote" as const,
      icon: Wrench,
      title: "ProQuote™",
      subtitle: "Advanced • Custom Equipment",
      description:
        "Full engineering control for complex projects. Custom equipment, fuel cells, microgrids.",
      features: [
        "Custom equipment selection",
        "Fuel cell integration",
        "Financial modeling tools",
        "Multi-site configurations",
      ],
      cta: "Open ProQuote™",
      accent: "#F59E0B",
    },
    {
      id: "upload" as const,
      icon: Upload,
      title: "Upload Quote",
      subtitle: "Review • Enhance",
      description:
        "Import an existing quote to review, enhance with TrueQuote™, or generate comparisons.",
      features: [
        "Parse existing quotes",
        "TrueQuote™ verification",
        "Cost optimization",
        "Competitive analysis",
      ],
      cta: "Upload Quote",
      accent: "#8B5CF6",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          How would you like to create your quote?
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Choose the path that best fits your project needs
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20"
              style={
                {
                  "--accent": mode.accent,
                } as React.CSSProperties
              }
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${mode.accent}15`,
                  border: `2px solid ${mode.accent}40`,
                }}
              >
                <Icon className="w-7 h-7" style={{ color: mode.accent }} />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-2">{mode.title}</h2>
              <p className="text-sm font-semibold mb-4" style={{ color: mode.accent }}>
                {mode.subtitle}
              </p>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{mode.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {mode.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: mode.accent }}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className="flex items-center justify-between px-5 py-3 rounded-lg font-semibold text-sm transition-all group-hover:gap-3"
                style={{
                  backgroundColor: `${mode.accent}20`,
                  color: mode.accent,
                }}
              >
                <span>{mode.cta}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>

              {/* Hover glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${mode.accent}15, transparent 70%)`,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="text-center">
        <p className="text-sm text-slate-500">
          Not sure which to choose?{" "}
          <button
            onClick={() => onSelectMode("wizard")}
            className="text-[#3ECF8E] hover:underline font-medium"
          >
            Start with the free wizard
          </button>{" "}
          — you can always upgrade later.
        </p>
      </div>
    </div>
  );
}

export default Step0V8_ModeSelect;
