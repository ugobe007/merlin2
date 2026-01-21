/**
 * SystemSizingModal - TrueQuote™ Sizing Adjustment Modal
 * =========================================================
 * Modern modal for adjusting BESS sizing with proper UX.
 *
 * Key improvements over PowerAdjustmentModal:
 * - Only batteryKW and backupHours are directly editable
 * - batteryKWh is derived (read-only by default)
 * - Shows Merlin recommendation vs customized values
 * - No "jump to 0" on typing (controlled inputs)
 * - Uses kW/kWh internally, MW/MWh display optional
 *
 * Created: January 21, 2026
 * Phase 5: Live Battery Sizing + Power Profile Preview
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  X,
  Battery,
  Clock,
  Zap,
  AlertTriangle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrueQuoteSizing } from "@/services/truequote";
import type { SizingOverrides } from "@/types/wizardState";

interface SystemSizingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Merlin's recommended sizing (from computeTrueQuoteSizing) */
  recommendation: TrueQuoteSizing;
  /** Current user overrides (if any) */
  currentOverrides?: SizingOverrides;
  /** Called when user confirms changes */
  onConfirm: (overrides: SizingOverrides) => void;
  /** Industry for context */
  industry?: string;
}

/**
 * Format kW/kWh for display
 */
function formatValue(value: number, showMW = false): string {
  if (showMW && value >= 1000) {
    return `${(value / 1000).toFixed(2)} MW`;
  }
  return `${Math.round(value).toLocaleString()} kW`;
}

function formatEnergy(value: number, showMWh = false): string {
  if (showMWh && value >= 1000) {
    return `${(value / 1000).toFixed(2)} MWh`;
  }
  return `${Math.round(value).toLocaleString()} kWh`;
}

export function SystemSizingModal({
  isOpen,
  onClose,
  recommendation,
  currentOverrides,
  onConfirm,
  industry,
}: SystemSizingModalProps) {
  // Local state for editing
  const [batteryKW, setBatteryKW] = useState<string>(
    String(currentOverrides?.batteryKW ?? recommendation.recommended.powerKW.best)
  );
  const [backupHours, setBackupHours] = useState<string>(
    String(currentOverrides?.backupHours ?? recommendation.recommended.durationHours.best)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [peakDemandKW, setPeakDemandKW] = useState<string>(
    String(currentOverrides?.peakDemandKW ?? recommendation.constraints.peakDemandKW ?? "")
  );

  // Derived energy (kW × hours)
  const batteryKWh = useMemo(() => {
    const kw = parseFloat(batteryKW) || 0;
    const hours = parseFloat(backupHours) || 0;
    return kw * hours;
  }, [batteryKW, backupHours]);

  // Check if values have been changed from recommendation
  const hasChanges = useMemo(() => {
    const kw = parseFloat(batteryKW) || 0;
    const hours = parseFloat(backupHours) || 0;
    const peak = parseFloat(peakDemandKW) || undefined;

    return (
      Math.abs(kw - recommendation.recommended.powerKW.best) > 1 ||
      Math.abs(hours - recommendation.recommended.durationHours.best) > 0.1 ||
      (peak !== undefined && peak !== recommendation.constraints.peakDemandKW)
    );
  }, [batteryKW, backupHours, peakDemandKW, recommendation]);

  // Warning flags
  const warnings = useMemo(() => {
    const kw = parseFloat(batteryKW) || 0;
    const hours = parseFloat(backupHours) || 0;
    const result: string[] = [];

    // Too small
    if (kw < recommendation.recommended.powerKW.min) {
      result.push(
        `Power below recommended minimum (${formatValue(recommendation.recommended.powerKW.min)})`
      );
    }
    // Too large
    if (kw > recommendation.recommended.powerKW.max * 1.5) {
      result.push(`Power significantly exceeds recommendation`);
    }
    // Duration too short for backup
    if (recommendation.goalsBreakdown.backupCoverageHours > 0 && hours < 2) {
      result.push(`Duration may be insufficient for backup power goal`);
    }
    // Grid capacity warning
    if (
      recommendation.constraints.gridCapacityKW &&
      kw > recommendation.constraints.gridCapacityKW
    ) {
      result.push(
        `Power exceeds grid capacity (${formatValue(recommendation.constraints.gridCapacityKW)})`
      );
    }

    return result;
  }, [batteryKW, backupHours, recommendation]);

  // Handle input changes (prevent jump to 0)
  const handleKWChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setBatteryKW(value);
    }
  }, []);

  const handleHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setBackupHours(value);
    }
  }, []);

  const handlePeakChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPeakDemandKW(value);
    }
  }, []);

  // Reset to Merlin recommendation
  const handleReset = useCallback(() => {
    setBatteryKW(String(recommendation.recommended.powerKW.best));
    setBackupHours(String(recommendation.recommended.durationHours.best));
    setPeakDemandKW(String(recommendation.constraints.peakDemandKW ?? ""));
  }, [recommendation]);

  // Confirm changes
  const handleConfirm = useCallback(() => {
    const kw = parseFloat(batteryKW) || recommendation.recommended.powerKW.best;
    const hours = parseFloat(backupHours) || recommendation.recommended.durationHours.best;
    const peak = parseFloat(peakDemandKW) || undefined;

    const overrides: SizingOverrides = {
      batteryKW: kw,
      backupHours: hours,
      batteryKWh: kw * hours,
      peakDemandKW: peak,
      lastModified: new Date().toISOString(),
    };

    onConfirm(overrides);
    onClose();
  }, [batteryKW, backupHours, peakDemandKW, recommendation, onConfirm, onClose]);

  if (!isOpen) return null;

  const { recommended, constraints, confidence, notes } = recommendation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Customize System Size</h2>
                <p className="text-sm text-purple-100">
                  {industry ? `${industry} • ` : ""}
                  {confidence}% confidence
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Merlin Recommendation (reference) */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">Merlin Recommendation</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-purple-900">
                  {formatValue(recommended.powerKW.best)}
                </div>
                <div className="text-xs text-purple-600">Power</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">
                  {recommended.durationHours.best}h
                </div>
                <div className="text-xs text-purple-600">Duration</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">
                  {formatEnergy(recommended.energyKWh.best)}
                </div>
                <div className="text-xs text-purple-600">Energy</div>
              </div>
            </div>
            {notes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-700">{notes[0]}</p>
              </div>
            )}
          </div>

          {/* Customization Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Your System
            </h3>

            {/* Power (kW) - Primary editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Battery Power</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={batteryKW}
                  onChange={handleKWChange}
                  onBlur={() => {
                    // Ensure valid number on blur
                    const val = parseFloat(batteryKW);
                    if (isNaN(val) || val <= 0) {
                      setBatteryKW(String(recommended.powerKW.best));
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 pr-16 border-2 rounded-xl text-lg font-medium transition-colors",
                    "focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
                    hasChanges ? "border-purple-300 bg-purple-50" : "border-gray-300"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  kW
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Min: {formatValue(recommended.powerKW.min)}</span>
                <span>Max: {formatValue(recommended.powerKW.max)}</span>
              </div>
            </div>

            {/* Duration (hours) - Primary editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="inline h-4 w-4 mr-1" />
                Backup Duration
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={backupHours}
                  onChange={handleHoursChange}
                  onBlur={() => {
                    const val = parseFloat(backupHours);
                    if (isNaN(val) || val <= 0) {
                      setBackupHours(String(recommended.durationHours.best));
                    }
                  }}
                  className={cn(
                    "w-full px-4 py-3 pr-20 border-2 rounded-xl text-lg font-medium transition-colors",
                    "focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
                    hasChanges ? "border-purple-300 bg-purple-50" : "border-gray-300"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  hours
                </span>
              </div>
            </div>

            {/* Energy (kWh) - Derived, read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Energy Capacity (Power × Duration)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formatEnergy(batteryKWh)}
                  readOnly
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-medium bg-gray-50 text-gray-600 cursor-not-allowed"
                  title="Automatically calculated from Power × Duration"
                />
                <Info className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Advanced: Peak Demand Override */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="pl-4 border-l-2 border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peak Demand (if known)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={peakDemandKW}
                    onChange={handlePeakChange}
                    placeholder={
                      constraints.peakDemandKW ? String(constraints.peakDemandKW) : "Auto-detected"
                    }
                    className="w-full px-4 py-3 pr-16 border-2 border-gray-300 rounded-xl text-lg font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    kW
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Override Merlin's estimate if you know your actual peak demand
                </p>
              </div>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {warnings.map((warning, i) => (
                    <p key={i} className="text-sm text-amber-800">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="px-4 py-3 text-purple-600 hover:bg-purple-50 rounded-xl font-medium transition-colors"
              >
                Reset to Merlin
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl font-medium transition-all",
                hasChanges
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              {hasChanges ? "Apply Changes" : "Keep Recommendation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSizingModal;
