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
      description: "Get a bankable BESS quote in 3 minutes with TrueQuote™ verified pricing",
      accent: "#3ECF8E",
    },
    {
      id: "proquote" as const,
      icon: Wrench,
      title: "ProQuote™",
      subtitle: "Advanced • Custom",
      description: "Full engineering control for complex projects with custom equipment",
      accent: "#F59E0B",
    },
    {
      id: "upload" as const,
      icon: Upload,
      title: "Upload Quote",
      subtitle: "Review • Enhance",
      description: "Import existing quotes to review and enhance with TrueQuote™ verification",
      accent: "#8B5CF6",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      {/* Header - Professional */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Create Your BESS Quote</h1>
        <p className="text-sm text-slate-400">Select your preferred workflow</p>
      </div>

      {/* Professional Cards with Gradient Borders */}
      <div className="flex flex-col gap-3 mb-8">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group relative overflow-hidden rounded-xl transition-all duration-300"
              style={{
                background:
                  "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.8) 100%)",
              }}
            >
              {/* Gradient border effect */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, ${mode.accent}40 0%, ${mode.accent}10 100%)`,
                  padding: "2px",
                }}
              />
              <div
                className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 border-2 transition-all duration-300"
                style={{
                  borderColor: mode.accent + "20",
                  boxShadow: `0 4px 12px -2px ${mode.accent}10`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = mode.accent + "50";
                  e.currentTarget.style.boxShadow = `0 12px 32px -4px ${mode.accent}30, 0 0 0 1px ${mode.accent}20`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = mode.accent + "20";
                  e.currentTarget.style.boxShadow = `0 4px 12px -2px ${mode.accent}10`;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon - Premium */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${mode.accent}15 0%, ${mode.accent}05 100%)`,
                      border: `1.5px solid ${mode.accent}30`,
                      boxShadow: `0 0 20px ${mode.accent}10`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: mode.accent }} />
                  </div>

                  {/* Content - Professional */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="text-base font-bold text-white">{mode.title}</h3>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          color: mode.accent,
                          backgroundColor: `${mode.accent}15`,
                          border: `1px solid ${mode.accent}25`,
                        }}
                      >
                        {mode.subtitle}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{mode.description}</p>
                  </div>

                  {/* Arrow - Premium */}
                  <div className="flex-shrink-0 transition-all duration-300 group-hover:translate-x-1 opacity-60 group-hover:opacity-100">
                    <ArrowRight className="w-5 h-5" style={{ color: mode.accent }} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer note - Minimal */}
      <div className="text-center">
        <p className="text-xs text-slate-500">
          Not sure?{" "}
          <button
            onClick={() => onSelectMode("wizard")}
            className="text-[#3ECF8E] hover:underline font-medium"
          >
            Start with the wizard
          </button>
        </p>
      </div>
    </div>
  );
}

export default Step0V8_ModeSelect;
