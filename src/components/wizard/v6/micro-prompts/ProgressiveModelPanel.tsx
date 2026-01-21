/**
 * Progressive Model Panel
 * =======================
 * Combined panel that shows all relevant micro-prompts based on industry.
 *
 * This is the "Step 2.5" or "Help Merlin Size Your System" panel.
 * Shows 2-4 questions max, with live inferred power profile.
 *
 * Created: January 21, 2026
 * Updated: January 21, 2026 - Phase 4: Added Model Completeness bar + learning feedback
 */

import React, { useMemo, useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Brain } from "lucide-react";
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
  type ModelConfidence,
  SERVICE_SIZE_TO_CAPACITY,
  DEMAND_CHARGE_BAND_TO_RATE,
  HVAC_TYPE_MULTIPLIERS,
  GENERATOR_BAND_TO_KW,
  calculateModelConfidence,
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
  
  // NEW: Model confidence callback (Phase 4)
  onModelConfidenceChange?: (confidence: ModelConfidence) => void;

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
  onModelConfidenceChange,
  industry,
  industryName,
  expanded = true,
  onToggleExpanded,
  compact = false,
}: ProgressiveModelPanelProps) {
  // Track learning messages for transient display
  const [learningMessage, setLearningMessage] = useState<string | null>(null);
  const [showLearning, setShowLearning] = useState(false);

  // Should we show generator prompt? Only for relevant industries
  const normalizedIndustry = industry?.toLowerCase().replace(/[_\s]/g, "-") || "";
  const showGenerator =
    industry &&
    GENERATOR_RELEVANT_INDUSTRIES.some((ind) =>
      normalizedIndustry.includes(ind.replace(/[_]/g, "-"))
    );

  // Compute inference from current answers (legacy format)
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

  // NEW: Calculate model confidence (Phase 4)
  const modelConfidence = useMemo(
    () =>
      calculateModelConfidence(
        serviceSize,
        hasDemandCharge,
        demandChargeBand,
        hvacType,
        hasBackupGenerator,
        generatorCapacityBand,
        !!showGenerator
      ),
    [
      serviceSize,
      hasDemandCharge,
      demandChargeBand,
      hvacType,
      hasBackupGenerator,
      generatorCapacityBand,
      showGenerator,
    ]
  );

  // Notify parent of confidence changes
  useEffect(() => {
    onModelConfidenceChange?.(modelConfidence);
  }, [modelConfidence, onModelConfidenceChange]);

  // Show learning message when it changes
  useEffect(() => {
    if (modelConfidence.lastLearningMessage) {
      setLearningMessage(modelConfidence.lastLearningMessage);
      setShowLearning(true);
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => setShowLearning(false), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [modelConfidence.lastLearningMessage]);

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
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-white">Help Merlin Size Your System</div>
            <div className="text-xs text-slate-400">
              {modelConfidence.score < 50
                ? "Answer a few quick questions for accurate sizing"
                : `Model ${modelConfidence.score}% confident`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Model Confidence Percentage */}
          <div
            className={`
            px-3 py-1.5 rounded-full text-sm font-black tabular-nums
            ${
              modelConfidence.score >= 75
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : modelConfidence.score >= 55
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
            }
          `}
          >
            {modelConfidence.score}%
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Model Completeness Progress Bar */}
      <div className="px-5 py-2 bg-slate-900/50 border-b border-violet-500/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Model Completeness</span>
          <span className="text-[10px] text-slate-500">{modelConfidence.completeness}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out rounded-full ${
              modelConfidence.score >= 75
                ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : modelConfidence.score >= 55
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                  : "bg-gradient-to-r from-slate-500 to-slate-400"
            }`}
            style={{ width: `${modelConfidence.completeness}%` }}
          />
        </div>
      </div>

      {/* Learning Feedback Message (transient) */}
      {showLearning && learningMessage && (
        <div className="px-5 py-3 bg-indigo-500/10 border-b border-indigo-500/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-sm text-indigo-200">{learningMessage}</span>
          </div>
        </div>
      )}

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
                      className={`font-bold ${
                        modelConfidence.score >= 75
                          ? "text-emerald-400"
                          : modelConfidence.score >= 55
                            ? "text-amber-400"
                            : "text-slate-400"
                      }`}
                    >
                      {modelConfidence.score}%
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-400">
                    {modelConfidence.score < 75
                      ? `Answer more for ${75 - modelConfidence.score}% boost`
                      : "✓ High confidence model"}
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
