import React from "react";
import { AlertTriangle, Bell, CheckCircle, RefreshCw } from "lucide-react";
import type { ValidationAlert } from "@/services/dailyPricingValidator";

interface PricingValidationSectionProps {
  validationAlerts: ValidationAlert[];
  isValidating: boolean;
  runValidation: () => void;
}

export default function PricingValidationSection({
  validationAlerts,
  isValidating,
  runValidation,
}: PricingValidationSectionProps) {
  const criticalAlerts = validationAlerts.filter((alert) => alert.severity === "critical");
  const warningAlerts = validationAlerts.filter((alert) => alert.severity === "warning");
  const infoAlerts = validationAlerts.filter((alert) => alert.severity === "info");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Daily Pricing Validation</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (import.meta.env.DEV) console.log("🔘 Run Validation button clicked");
            runValidation();
          }}
          disabled={isValidating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
          type="button"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? "animate-spin" : ""}`} />
          {isValidating ? "Validating..." : "Run Validation"}
        </button>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 shadow-sm">
        <h4 className="font-semibold text-violet-400 mb-2">🔍 Automated Daily Sound Checks</h4>
        <p className="text-sm text-violet-400">
          Pricing is automatically validated daily at 6 AM against NREL ATB 2024, BloombergNEF, Wood
          Mackenzie, and other market intelligence sources. Deviations &gt;10% trigger alerts.
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-lg border ${criticalAlerts.length > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}
        >
          <div className="flex items-center">
            <AlertTriangle
              className={`w-5 h-5 mr-2 ${criticalAlerts.length > 0 ? "text-red-600" : "text-emerald-400"}`}
            />
            <h4
              className={`font-semibold ${criticalAlerts.length > 0 ? "text-red-400" : "text-emerald-400"}`}
            >
              Critical Alerts
            </h4>
          </div>
          <p
            className={`text-2xl font-bold ${criticalAlerts.length > 0 ? "text-red-600" : "text-emerald-400"}`}
          >
            {criticalAlerts.length}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${warningAlerts.length > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"}`}
        >
          <div className="flex items-center">
            <Bell
              className={`w-5 h-5 mr-2 ${warningAlerts.length > 0 ? "text-yellow-600" : "text-emerald-400"}`}
            />
            <h4
              className={`font-semibold ${warningAlerts.length > 0 ? "text-amber-400" : "text-emerald-400"}`}
            >
              Warnings
            </h4>
          </div>
          <p
            className={`text-2xl font-bold ${warningAlerts.length > 0 ? "text-yellow-600" : "text-emerald-400"}`}
          >
            {warningAlerts.length}
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-white/60" />
            <h4 className="font-semibold text-white">Info</h4>
          </div>
          <p className="text-2xl font-bold text-white/60">{infoAlerts.length}</p>
        </div>
      </div>

      {/* Detailed Alerts */}
      {validationAlerts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Validation Results</h4>
          {validationAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.severity === "critical"
                  ? "bg-red-500/10 border-red-500/20"
                  : alert.severity === "warning"
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {alert.severity === "critical" && (
                      <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    {alert.severity === "warning" && (
                      <Bell className="w-4 h-4 text-yellow-600 mr-2" />
                    )}
                    {alert.severity === "info" && (
                      <CheckCircle className="w-4 h-4 text-purple-600 mr-2" />
                    )}
                    <h5
                      className={`font-semibold ${
                        alert.severity === "critical"
                          ? "text-red-400"
                          : alert.severity === "warning"
                            ? "text-amber-400"
                            : "text-violet-400"
                      }`}
                    >
                      {alert.category}
                    </h5>
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      alert.severity === "critical"
                        ? "text-red-400"
                        : alert.severity === "warning"
                          ? "text-amber-400"
                          : "text-violet-400"
                    }`}
                  >
                    {alert.message}
                  </p>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Current Price:</strong> ${alert.currentPrice}
                    </p>
                    <p>
                      <strong>Market Range:</strong> ${alert.marketRange.min} - $
                      {alert.marketRange.max}
                    </p>
                    <p>
                      <strong>Deviation:</strong> {alert.deviation.toFixed(1)}%
                    </p>
                    <p>
                      <strong>Recommendation:</strong> {alert.recommendation}
                    </p>
                    <p>
                      <strong>Sources:</strong> {alert.sources.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {validationAlerts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">All Pricing Validated ✓</h4>
          <p className="text-white/60">
            Your pricing configuration is aligned with current market intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
