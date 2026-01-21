/**
 * Progressive Model Panel
 * =======================
 * Combined panel that shows all relevant micro-prompts based on industry.
 *
 * This is the "Step 2.5" or "Help Merlin Size Your System" panel.
 * Shows 2-4 questions max, with live inferred power profile.
 *
 * Created: January 21, 2026
 */

import React, { useMemo } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ServiceSizePrompt } from "./ServiceSizePrompt";
import { DemandChargePrompt } from "./DemandChargePrompt";
import { HVACTypePrompt } from "./HVACTypePrompt";
import { BackupGeneratorPrompt, GENERATOR_RELEVANT_INDUSTRIES } from "./BackupGeneratorPrompt";
import {
  type ServiceSizeOption,
  type DemandChargeBand,
  type HVACTypeOption,
  type GeneratorCapacityBand,
  type ProgressiveModelInference,
  SERVICE_SIZE_TO_CAPACITY,
  DEMAND_CHARGE_BAND_TO_RATE,
  HVAC_TYPE_MULTIPLIERS,
  GENERATOR_BAND_TO_KW,
} from "../types";

interface ProgressiveModelPanelProps {
  // Current values
  serviceSize?: ServiceSizeOption;
  hasDemandCharge?: "yes" | "no" | "not-sure";
  demandChargeBand?: DemandChargeBand;
  hvacType?: HVACTypeOption;
  hasBackupGenerator?: "yes" | "no" | "planned";
  generatorCapacityBand?: GeneratorCapacityBand;

  // Callbacks
  onServiceSizeChange: (value: ServiceSizeOption) => void;
  onHasDemandChargeChange: (value: "yes" | "no" | "not-sure") => void;
  onDemandChargeBandChange: (value: DemandChargeBand) => void;
  onHVACTypeChange: (value: HVACTypeOption) => void;
  onHasBackupGeneratorChange: (value: "yes" | "no" | "planned") => void;
  onGeneratorCapacityBandChange: (value: GeneratorCapacityBand) => void;

  // Context
  industry?: string;
  industryName?: string;

  // Display options
  expanded?: boolean;
  onToggleExpanded?: () => void;
  compact?: boolean;
}

/**
 * Compute inferred power profile from micro-prompt answers
 */
function computeInference(
  serviceSize?: ServiceSizeOption,
  hasDemandCharge?: "yes" | "no" | "not-sure",
  demandChargeBand?: DemandChargeBand,
  hvacType?: HVACTypeOption,
  hasBackupGenerator?: "yes" | "no" | "planned",
  generatorCapacityBand?: GeneratorCapacityBand
): ProgressiveModelInference {
  const fieldsCollected: string[] = [];
  let confidence: "low" | "medium" | "high" = "low";

  // Grid capacity from service size
  let gridCapacityKW: number | undefined;
  let peakDemandRange: [number, number] | undefined;

  if (serviceSize && serviceSize !== "unsure") {
    const cap = SERVICE_SIZE_TO_CAPACITY[serviceSize];
    gridCapacityKW = cap.gridCapacityKW;
    peakDemandRange = cap.peakDemandBand;
    fieldsCollected.push("serviceSize");
  }

  // Demand charge rate
  let demandChargeRate: number | undefined;
  let demandChargeImpact: "low" | "medium" | "high" | undefined;
  let monthlyDemandCharges: number | undefined;

  if (hasDemandCharge === "yes" && demandChargeBand && demandChargeBand !== "not-sure") {
    const band = DEMAND_CHARGE_BAND_TO_RATE[demandChargeBand];
    demandChargeRate = band.rate;
    demandChargeImpact = band.impact;

    // Estimate monthly if we have peak demand
    if (peakDemandRange) {
      const avgPeak = (peakDemandRange[0] + peakDemandRange[1]) / 2;
      monthlyDemandCharges = Math.round(avgPeak * demandChargeRate);
    }

    fieldsCollected.push("demandCharge");
  } else if (hasDemandCharge === "no") {
    demandChargeRate = 0;
    demandChargeImpact = "low";
    fieldsCollected.push("demandCharge");
  }

  // HVAC multiplier
  let hvacMultiplier: number | undefined;
  if (hvacType) {
    hvacMultiplier = HVAC_TYPE_MULTIPLIERS[hvacType];
    if (hvacType !== "not-sure") {
      fieldsCollected.push("hvacType");
    }
  }

  // Generator
  let generatorCapacityKW: number | undefined;
  let hasBackupCapability: boolean | undefined;

  if (hasBackupGenerator === "yes") {
    hasBackupCapability = true;
    if (generatorCapacityBand && generatorCapacityBand !== "not-sure") {
      generatorCapacityKW = GENERATOR_BAND_TO_KW[generatorCapacityBand].midpoint;
      fieldsCollected.push("generator");
    }
  } else if (hasBackupGenerator === "no") {
    hasBackupCapability = false;
    fieldsCollected.push("generator");
  } else if (hasBackupGenerator === "planned") {
    hasBackupCapability = true;
    fieldsCollected.push("generator");
  }

  // Confidence level
  if (fieldsCollected.length >= 3) {
    confidence = "high";
  } else if (fieldsCollected.length >= 2) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    gridCapacityKW,
    peakDemandRange,
    demandChargeRate,
    monthlyDemandCharges,
    demandChargeImpact,
    hvacMultiplier,
    generatorCapacityKW,
    hasBackupCapability,
    confidence,
    fieldsCollected,
    lastUpdated: new Date().toISOString(),
  };
}

export function ProgressiveModelPanel({
  serviceSize,
  hasDemandCharge,
  demandChargeBand,
  hvacType,
  hasBackupGenerator,
  generatorCapacityBand,
  onServiceSizeChange,
  onHasDemandChargeChange,
  onDemandChargeBandChange,
  onHVACTypeChange,
  onHasBackupGeneratorChange,
  onGeneratorCapacityBandChange,
  industry,
  industryName,
  expanded = true,
  onToggleExpanded,
  compact = false,
}: ProgressiveModelPanelProps) {
  // Compute inference from current answers
  const inference = useMemo(
    () =>
      computeInference(
        serviceSize,
        hasDemandCharge,
        demandChargeBand,
        hvacType,
        hasBackupGenerator,
        generatorCapacityBand
      ),
    [
      serviceSize,
      hasDemandCharge,
      demandChargeBand,
      hvacType,
      hasBackupGenerator,
      generatorCapacityBand,
    ]
  );

  // Should we show generator prompt? Only for relevant industries
  const normalizedIndustry = industry?.toLowerCase().replace(/[_\s]/g, "-") || "";
  const showGenerator =
    industry &&
    GENERATOR_RELEVANT_INDUSTRIES.some((ind) =>
      normalizedIndustry.includes(ind.replace(/[_]/g, "-"))
    );

  // Estimate peak for demand charge calculation
  const estimatedPeakKW = inference.peakDemandRange
    ? (inference.peakDemandRange[0] + inference.peakDemandRange[1]) / 2
    : undefined;

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-violet-950/70 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleExpanded}
        className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-violet-900/50 to-indigo-900/50 hover:from-violet-900/60 hover:to-indigo-900/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">Help Merlin Size Your System</div>
            <div className="text-xs text-slate-400">
              {inference.fieldsCollected.length === 0
                ? "Answer a few quick questions for accurate sizing"
                : `${inference.fieldsCollected.length} of ${showGenerator ? 4 : 3} answered • ${inference.confidence} confidence`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Confidence Badge */}
          <div
            className={`
            px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
            ${
              inference.confidence === "high"
                ? "bg-emerald-500/20 text-emerald-400"
                : inference.confidence === "medium"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-500/20 text-slate-400"
            }
          `}
          >
            {inference.confidence}
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-5 space-y-4">
          {/* Service Size */}
          <ServiceSizePrompt
            value={serviceSize}
            onChange={onServiceSizeChange}
            industry={industryName}
            compact={compact}
          />

          {/* Demand Charge */}
          <DemandChargePrompt
            hasDemandCharge={hasDemandCharge}
            demandChargeBand={demandChargeBand}
            onHasDemandChargeChange={onHasDemandChargeChange}
            onBandChange={onDemandChargeBandChange}
            estimatedPeakKW={estimatedPeakKW}
            compact={compact}
          />

          {/* HVAC Type */}
          <HVACTypePrompt value={hvacType} onChange={onHVACTypeChange} compact={compact} />

          {/* Generator (only for relevant industries) */}
          {showGenerator && (
            <BackupGeneratorPrompt
              hasGenerator={hasBackupGenerator}
              capacityBand={generatorCapacityBand}
              onHasGeneratorChange={onHasBackupGeneratorChange}
              onCapacityBandChange={onGeneratorCapacityBandChange}
              industry={industryName}
              compact={compact}
            />
          )}

          {/* Inferred Power Profile Summary */}
          {inference.fieldsCollected.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-900/40 to-violet-900/40 border border-indigo-500/30">
              <div className="text-[10px] text-indigo-300 font-semibold mb-3 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Inferred Power Profile
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Peak Demand */}
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Peak Demand</div>
                  <div className="text-lg font-black text-white">
                    {inference.peakDemandRange
                      ? `${inference.peakDemandRange[0]}–${inference.peakDemandRange[1]} kW`
                      : "— kW"}
                  </div>
                </div>

                {/* Grid Capacity */}
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Grid Capacity</div>
                  <div className="text-lg font-black text-white">
                    {inference.gridCapacityKW ? `${inference.gridCapacityKW} kW` : "— kW"}
                  </div>
                </div>

                {/* Demand Impact */}
                {inference.demandChargeImpact && (
                  <div>
                    <div className="text-[10px] text-slate-400 mb-0.5">Demand Impact</div>
                    <div
                      className={`text-lg font-black ${
                        inference.demandChargeImpact === "high"
                          ? "text-amber-400"
                          : inference.demandChargeImpact === "medium"
                            ? "text-yellow-400"
                            : "text-slate-400"
                      }`}
                    >
                      {inference.demandChargeImpact === "high"
                        ? `$${inference.monthlyDemandCharges?.toLocaleString() || "—"}/mo`
                        : inference.demandChargeImpact.charAt(0).toUpperCase() +
                          inference.demandChargeImpact.slice(1)}
                    </div>
                  </div>
                )}

                {/* HVAC Multiplier */}
                {inference.hvacMultiplier && inference.hvacMultiplier !== 1.0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 mb-0.5">HVAC Adjustment</div>
                    <div
                      className={`text-lg font-black ${
                        inference.hvacMultiplier > 1 ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {inference.hvacMultiplier > 1 ? "+" : ""}
                      {((inference.hvacMultiplier - 1) * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence indicator */}
              <div className="mt-4 pt-3 border-t border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-500">
                    Model confidence:{" "}
                    <span
                      className={
                        inference.confidence === "high"
                          ? "text-emerald-400"
                          : inference.confidence === "medium"
                            ? "text-amber-400"
                            : "text-slate-400"
                      }
                    >
                      {inference.confidence}
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-400">
                    {3 - inference.fieldsCollected.length > 0
                      ? `Answer ${3 - inference.fieldsCollected.length} more for higher accuracy`
                      : "✓ Full profile collected"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProgressiveModelPanel;
