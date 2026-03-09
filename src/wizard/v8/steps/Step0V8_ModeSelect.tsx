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
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header - Minimal */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Create your quote</h1>
        <p className="text-sm text-slate-400">Choose your workflow</p>
      </div>

      {/* Compact Horizontal Buttons - Supabase Style */}
      <div className="flex flex-col gap-2 mb-6">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className="group relative bg-slate-900/50 hover:bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 rounded-lg px-4 py-3 text-left transition-all duration-150"
            >
              <div className="flex items-center gap-3">
                {/* Icon - Compact */}
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${mode.accent}10`,
                    border: `1px solid ${mode.accent}30`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: mode.accent }} />
                </div>

                {/* Content - Inline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-white">{mode.title}</h3>
                    <span className="text-xs font-medium" style={{ color: mode.accent }}>
                      {mode.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{mode.description}</p>
                </div>

                {/* Arrow - Minimal */}
                <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
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
