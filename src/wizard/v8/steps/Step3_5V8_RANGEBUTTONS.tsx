/**
 * WIZARD V8 — STEP 3.5: ADD-ON CONFIGURATION (RANGE BUTTONS VERSION)
 * ============================================================================
 * Configure solar, generator, and EV charging with clickable range buttons
 * Supabase-style buttons: stroke color, no fill, green checkbox on select
 * ============================================================================
 */

import React from "react";
import type { WizardState, WizardActions } from "../wizardState";
import { Sun, Fuel, Zap, Info, Check } from "lucide-react";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

// Range button component (Supabase style)
interface RangeButtonProps {
  label: string;
  _value: number;
  isSelected: boolean;
  onClick: () => void;
  color?: string;
  isRecommended?: boolean;
}

const RangeButton: React.FC<RangeButtonProps> = ({
  label,
  _value,
  isSelected,
  onClick,
  color = "purple",
  isRecommended = false,
}) => {
  const colorClasses = {
    amber: {
      border: "border-amber-400",
      text: "text-amber-400",
      hoverShadow: "hover:shadow-[0_0_12px_rgba(251,191,36,0.4)]",
      recommendedBg: "bg-amber-500/10",
    },
    orange: {
      border: "border-orange-400",
      text: "text-orange-400",
      hoverShadow: "hover:shadow-[0_0_12px_rgba(249,115,22,0.4)]",
      recommendedBg: "bg-orange-500/10",
    },
    cyan: {
      border: "border-cyan-400",
      text: "text-cyan-400",
      hoverShadow: "hover:shadow-[0_0_12px_rgba(34,211,238,0.4)]",
      recommendedBg: "bg-cyan-500/10",
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.amber;

  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-3 rounded-lg border-2 transition-all duration-200
        font-semibold text-sm
        ${isRecommended && !isSelected ? colors.recommendedBg : "!bg-transparent"}
        ${
          isSelected
            ? "border-emerald-400 text-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.9)]"
            : `${colors.border} ${colors.text} ${colors.hoverShadow}`
        }
        hover:scale-105 active:scale-95
      `}
      style={{
        backgroundColor: isRecommended && !isSelected ? undefined : "transparent !important",
      }}
    >
      {/* Merlin Recommends badge */}
      {isRecommended && !isSelected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
          ⭐ MERLIN RECOMMENDS
        </div>
      )}

      {/* Green checkmark when selected */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1 animate-bounce shadow-[0_0_15px_rgba(52,211,153,1)]">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div>{label}</div>
    </button>
  );
};

export default function Step3_5V8({ state, actions }: Props) {
  const { wantsSolar, wantsEVCharging, wantsGenerator, peakLoadKW, criticalLoadKW, industry } =
    state;
  const [isGeneratingTiers, setIsGeneratingTiers] = React.useState(false);

  // Generate ranges for solar (based on PHYSICAL SPACE CONSTRAINTS by industry)
  const getSolarRanges = () => {
    const industrySlug = industry?.toLowerCase().replace(/[_\s-]+/g, "-") || "";

    // Car Wash: Limited roof space - 30-100 kW realistic
    if (industrySlug.includes("car-wash") || industrySlug.includes("carwash")) {
      return [
        { label: "30-50 kW", value: 40, desc: "Roof Only (Small)" },
        { label: "50-70 kW", value: 60, desc: "⭐ Roof Only (Standard)" },
        { label: "70-85 kW", value: 77, desc: "Roof + Awning" },
        { label: "85-100 kW", value: 92, desc: "Max Coverage" },
      ];
    }

    // Hotel: Roof + optional parking canopies
    if (industrySlug.includes("hotel") || industrySlug.includes("hospitality")) {
      return [
        { label: "50-100 kW", value: 75, desc: "Roof Only" },
        { label: "100-200 kW", value: 150, desc: "⭐ Roof + Small Canopy" },
        { label: "200-350 kW", value: 275, desc: "Roof + Large Canopy" },
        { label: "350-500 kW", value: 425, desc: "Full Parking Coverage" },
      ];
    }

    // Office: Roof + optional parking canopies
    if (industrySlug.includes("office")) {
      return [
        { label: "75-150 kW", value: 112, desc: "Roof Only" },
        { label: "150-300 kW", value: 225, desc: "⭐ Roof + Canopy" },
        { label: "300-500 kW", value: 400, desc: "Large Canopy" },
        { label: "500-750 kW", value: 625, desc: "Full Lot Coverage" },
      ];
    }

    // Retail/Shopping: Large flat roofs
    if (industrySlug.includes("retail") || industrySlug.includes("shopping")) {
      return [
        { label: "100-200 kW", value: 150, desc: "Partial Roof" },
        { label: "200-400 kW", value: 300, desc: "⭐ Full Roof" },
        { label: "400-600 kW", value: 500, desc: "Roof + Canopy" },
        { label: "600-1000 kW", value: 800, desc: "Max Coverage" },
      ];
    }

    // Data Center: Large roofs + ground mount possible
    if (industrySlug.includes("data-center") || industrySlug.includes("datacenter")) {
      return [
        { label: "200-500 kW", value: 350, desc: "Roof Only" },
        { label: "500-1000 kW", value: 750, desc: "⭐ Roof + Carport" },
        { label: "1-2 MW", value: 1500, desc: "Large Array" },
        { label: "2-5 MW", value: 3500, desc: "Ground Mount" },
      ];
    }

    // Hospital: Large roofs, strict regulations
    if (industrySlug.includes("hospital") || industrySlug.includes("healthcare")) {
      return [
        { label: "150-300 kW", value: 225, desc: "Roof Only" },
        { label: "300-600 kW", value: 450, desc: "⭐ Roof + Canopy" },
        { label: "600-1000 kW", value: 800, desc: "Large Canopy" },
        { label: "1-2 MW", value: 1500, desc: "Full Campus" },
      ];
    }

    // Warehouse: HUGE roof space potential
    if (industrySlug.includes("warehouse") || industrySlug.includes("logistics")) {
      return [
        { label: "200-400 kW", value: 300, desc: "Partial Roof" },
        { label: "400-800 kW", value: 600, desc: "⭐ Half Roof" },
        { label: "800-1500 kW", value: 1150, desc: "Full Roof" },
        { label: "1.5-3 MW", value: 2250, desc: "Roof + Ground" },
      ];
    }

    // Manufacturing: Large industrial roofs
    if (industrySlug.includes("manufacturing") || industrySlug.includes("factory")) {
      return [
        { label: "300-600 kW", value: 450, desc: "Partial Roof" },
        { label: "600-1200 kW", value: 900, desc: "⭐ Full Roof" },
        { label: "1.2-2 MW", value: 1600, desc: "Roof + Canopy" },
        { label: "2-5 MW", value: 3500, desc: "Ground Mount" },
      ];
    }

    // Default fallback: Use conservative roof-only estimates
    return [
      { label: "50-100 kW", value: 75, desc: "Small Roof" },
      { label: "100-200 kW", value: 150, desc: "⭐ Standard Roof" },
      { label: "200-400 kW", value: 300, desc: "Large Roof" },
      { label: "400-750 kW", value: 575, desc: "Roof + Canopy" },
    ];
  };

  const solarRanges = getSolarRanges();

  // Generate ranges for generator (based on critical vs full load)
  const isCriticalFacility = industry
    ? [
        "hospital",
        "healthcare",
        "data-center",
        "data_center",
        "cold-storage",
        "cold_storage",
        "manufacturing",
      ].includes(industry)
    : false;
  const targetLoadKW =
    !isCriticalFacility && criticalLoadKW && criticalLoadKW > 0 ? criticalLoadKW : peakLoadKW;

  const generatorRanges = [
    {
      label: `${Math.round(targetLoadKW * 0.8)}-${Math.round(targetLoadKW)} kW`,
      value: Math.round(targetLoadKW * 0.9),
      desc: "Min (80-100%)",
    },
    {
      label: `${Math.round(targetLoadKW)}-${Math.round(targetLoadKW * 1.25)} kW`,
      value: Math.round(targetLoadKW * 1.125),
      desc: "⭐ Standard (100-125%)",
    },
    {
      label: `${Math.round(targetLoadKW * 1.25)}-${Math.round(targetLoadKW * 1.5)} kW`,
      value: Math.round(targetLoadKW * 1.375),
      desc: "High (125-150%)",
    },
  ];

  // EV charger options
  const evOptions = [
    { label: "4 L2", value: { level2: 4, dcfc: 0 }, desc: "Small (4 Level 2)" },
    { label: "8 L2", value: { level2: 8, dcfc: 0 }, desc: "Medium (8 Level 2)" },
    { label: "8 L2 + 2 DCFC", value: { level2: 8, dcfc: 2 }, desc: "⭐ Optimal (8 L2 + 2 DCFC)" },
    { label: "12 L2 + 4 DCFC", value: { level2: 12, dcfc: 4 }, desc: "Large (12 L2 + 4 DCFC)" },
  ];

  // Generate tiers when all add-ons are configured
  const handleContinue = async () => {
    setIsGeneratingTiers(true);
    try {
      // Just navigate to next step - WizardV8 will handle tier generation
      actions.goToStep(4);
    } catch (err) {
      console.error("[Step3_5] Failed to advance:", err);
    } finally {
      setIsGeneratingTiers(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <p className="text-purple-400 uppercase tracking-[0.3em] text-sm font-medium mb-3">
          Step 3.5 of 5
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold text-white mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Configure Your Add-ons
        </h1>
        <p className="text-slate-400 text-lg">
          Select ranges for your solar, EV charging, and backup generator
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="space-y-6">
        {/* Solar Configuration */}
        {wantsSolar && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-500/10 p-3 rounded-xl">
                <Sun className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Solar PV Array</h3>
                <p className="text-slate-400 text-sm">
                  Merlin recommends ⭐ Standard — Choose your preferred range
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {solarRanges.map((range, idx) => (
                  <RangeButton
                    key={idx}
                    label={range.label}
                    value={range.value}
                    isSelected={state.solarKW === range.value}
                    onClick={() => actions.setAddonConfig({ solarKW: range.value })}
                    color="amber"
                    isRecommended={idx === 1}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4 text-xs text-slate-500">
                {solarRanges.map((range, idx) => (
                  <span key={idx} className="text-center">
                    {range.desc}
                  </span>
                ))}
              </div>

              {/* Selected value display */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">
                  {state.solarKW.toLocaleString()} kW
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {((state.solarKW / peakLoadKW) * 100).toFixed(0)}% of peak load
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generator Configuration */}
        {wantsGenerator && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-500/10 p-3 rounded-xl">
                <Fuel className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Backup Generator</h3>
                <p className="text-slate-400 text-sm">
                  Merlin recommends ⭐ Standard — Choose your preferred range
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {generatorRanges.map((range, idx) => (
                  <RangeButton
                    key={idx}
                    label={range.label}
                    value={range.value}
                    isSelected={state.generatorKW === range.value}
                    onClick={() => actions.setAddonConfig({ generatorKW: range.value })}
                    color="orange"
                    isRecommended={idx === 1}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4 text-xs text-slate-500">
                {generatorRanges.map((range, idx) => (
                  <span key={idx} className="text-center">
                    {range.desc}
                  </span>
                ))}
              </div>

              {/* Selected value display */}
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {state.generatorKW.toLocaleString()} kW
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {isCriticalFacility ? "Full facility backup" : "Critical loads only"}
                </div>
              </div>

              {/* Critical Load Info */}
              {criticalLoadKW && criticalLoadKW < peakLoadKW && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
                  <div className="flex gap-2 text-sm">
                    <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-slate-300 leading-relaxed">
                      <strong className="text-orange-400">Critical Loads Sizing:</strong> Generator
                      sized for {criticalLoadKW.toLocaleString()} kW critical loads vs{" "}
                      {peakLoadKW.toLocaleString()} kW full facility load. This saves ~$
                      {Math.round((peakLoadKW - criticalLoadKW) * 0.7).toLocaleString()}K.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EV Charging Configuration */}
        {wantsEVCharging && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-cyan-500/10 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">EV Charging</h3>
                <p className="text-slate-400 text-sm">
                  Select your preferred charging configuration
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {evOptions.map((option, idx) => (
                  <RangeButton
                    key={idx}
                    label={option.label}
                    value={0}
                    isSelected={
                      state.level2Chargers === option.value.level2 &&
                      state.dcfcChargers === option.value.dcfc
                    }
                    onClick={() =>
                      actions.setAddonConfig({
                        level2Chargers: option.value.level2,
                        dcfcChargers: option.value.dcfc,
                      })
                    }
                    color="cyan"
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4 text-xs text-slate-500">
                {evOptions.map((option, idx) => (
                  <span key={idx} className="text-center">
                    {option.desc}
                  </span>
                ))}
              </div>

              {/* Selected value display */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-cyan-400">
                  {state.level2Chargers} Level 2 Chargers
                  {state.dcfcChargers > 0 && ` + ${state.dcfcChargers} DC Fast Chargers`}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Total charging power:{" "}
                  {Math.round(state.level2Chargers * 7.2 + state.dcfcChargers * 150)} kW
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-8">
        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-3 shadow-[0_0_50px_rgba(16,185,129,0.18)]">
          <div className="mb-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-300/80">
              Ready For MagicFit
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Lock these add-on choices and generate your three optimized system tiers.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleContinue}
              disabled={isGeneratingTiers}
              className={`
            min-w-[320px] px-12 py-5 rounded-2xl font-black text-lg uppercase tracking-[0.18em]
            transition-all duration-200 flex items-center justify-center gap-3
            ${
              !isGeneratingTiers
                ? "border-2 border-emerald-300 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(16,185,129,0.45)]"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-slate-700"
            }
          `}
            >
              {isGeneratingTiers ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Your Options...
                </>
              ) : (
                <>
                  Continue to MagicFit
                  <span className="text-2xl leading-none">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
