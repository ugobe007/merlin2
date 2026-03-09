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
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          How would you like to create your quote?
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Choose the path that best fits your project needs
        </p>
      </div>

      {/* Horizontal Buttons */}
      <div className="flex flex-col gap-4 mb-8">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group relative bg-slate-800/40 hover:bg-slate-800/70 border-2 border-slate-700/50 hover:border-slate-600 rounded-xl p-6 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
              style={{ borderColor: mode.accent + "40" }}
            >
              <div className="flex items-center gap-6">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${mode.accent}15`,
                    border: `2px solid ${mode.accent}60`,
                  }}
                >
                  <Icon className="w-8 h-8" style={{ color: mode.accent }} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{mode.title}</h2>
                    <span className="text-sm font-semibold" style={{ color: mode.accent }}>
                      {mode.subtitle}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-3">{mode.description}</p>

                  {/* Features inline */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {mode.features.map((feature, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: mode.accent }}
                        />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-1"
                    style={{ backgroundColor: `${mode.accent}20` }}
                  >
                    <ArrowRight className="w-5 h-5" style={{ color: mode.accent }} />
                  </div>
                </div>
              </div>

              {/* Hover glow effect */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, ${mode.accent}08, transparent)`,
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
