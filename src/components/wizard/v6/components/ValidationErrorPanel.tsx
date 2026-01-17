/**
 * Validation Error Panel (Red Box UI)
 *
 * Displays validation errors in a user-friendly format with actionable buttons.
 * Used in Step5MagicFit when WizardState fails validation before TrueQuote call.
 */

import React from "react";
import { AlertTriangle, Copy, RotateCcw } from "lucide-react";
import type { ValidationResult } from "../utils/wizardStateValidator";

interface ValidationErrorPanelProps {
  validationResult: ValidationResult;
  onReset?: () => void;
  onGoToStep?: (step: number) => void;
  fingerprint?: string; // For debug info (DEV only)
}

export function ValidationErrorPanel({
  validationResult,
  onReset,
  onGoToStep,
  fingerprint,
}: ValidationErrorPanelProps) {
  const handleCopyDebugInfo = async () => {
    const debugInfo = JSON.stringify(
      {
        fingerprint: fingerprint || "not-available",
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        summary: {
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length,
        },
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    try {
      await navigator.clipboard.writeText(debugInfo);
      alert("Debug info copied to clipboard");
    } catch {
      // Fallback for non-HTTPS or permission denied
      window.prompt("Copy debug info:", debugInfo);
    }
  };

  const handleResetWizard = () => {
    if (confirm("Reset wizard to start over? This will clear all your inputs.")) {
      if (onReset) {
        onReset();
      } else {
        window.location.href = "/wizard?fresh=true";
      }
    }
  };

  // Group errors by step
  const errorsByStep = validationResult.errors.reduce(
    (acc, err) => {
      if (!acc[err.step]) acc[err.step] = [];
      acc[err.step].push(err);
      return acc;
    },
    {} as Record<number, typeof validationResult.errors>
  );

  // First error step calculated but not currently used in UI
  // const firstErrorStep = validationResult.errors.length > 0
  //   ? Math.min(...validationResult.errors.map(e => e.step))
  //   : null;

  return (
    <div className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-8">
      <div className="flex items-start gap-4 mb-6">
        <AlertTriangle className="w-12 h-12 text-red-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-red-300 mb-2">Missing Required Information</h3>
          <p className="text-red-400/80 mb-4">
            Please complete all required steps before generating a quote.
          </p>
        </div>
      </div>

      {/* Missing Fields List */}
      <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-6 mb-6">
        <h4 className="text-lg font-semibold text-red-200 mb-4">Missing or Invalid Fields:</h4>
        <div className="space-y-3">
          {validationResult.errors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-red-400 font-mono text-sm">Step {err.step}</span>
              <div className="flex-1">
                <div className="text-red-200 font-medium">{err.field}</div>
                <div className="text-red-400/70 text-sm">
                  Expected: {err.expected}
                  {err.received && ` • Received: ${err.received}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings (if any) */}
      {validationResult.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-amber-200 mb-2">Warnings:</h4>
          <div className="space-y-2 text-sm">
            {validationResult.warnings.map((warn, idx) => (
              <div key={idx} className="text-amber-300/80">
                <span className="font-medium">
                  Step {warn.step} - {warn.field}:
                </span>{" "}
                {warn.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {/* Group errors by step and show "Go to Step X" for each */}
        {Object.entries(errorsByStep).map(
          ([step, stepErrors]) =>
            onGoToStep && (
              <button
                key={step}
                onClick={() => onGoToStep(Number(step))}
                className="px-6 py-3 bg-red-500/20 text-red-300 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/30 font-medium flex items-center gap-2"
              >
                Go to Step {step} ({stepErrors.length}{" "}
                {stepErrors.length === 1 ? "error" : "errors"})
              </button>
            )
        )}
        {import.meta.env.DEV && (
          <button
            onClick={handleCopyDebugInfo}
            className="px-6 py-3 bg-white/5 text-slate-300 rounded-xl hover:bg-white/5/70 transition-all border border-white/10/30 font-medium flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Debug Info {fingerprint ? `(FP: ${fingerprint.slice(0, 16)}...)` : ""}
          </button>
        )}
        <button
          onClick={handleResetWizard}
          className="px-6 py-3 bg-white/5 text-slate-300 rounded-xl hover:bg-white/5/70 transition-all border border-white/10/30 font-medium flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Wizard
        </button>
      </div>
    </div>
  );
}
