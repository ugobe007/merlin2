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
        <h4 className="font-semibold text-purple-800 mb-2">🔍 Automated Daily Sound Checks</h4>
        <p className="text-sm text-purple-700">
          Pricing is automatically validated daily at 6 AM against NREL ATB 2024, BloombergNEF, Wood
          Mackenzie, and other market intelligence sources. Deviations &gt;10% trigger alerts.
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-lg border ${criticalAlerts.length > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}
        >
          <div className="flex items-center">
            <AlertTriangle
              className={`w-5 h-5 mr-2 ${criticalAlerts.length > 0 ? "text-red-600" : "text-green-600"}`}
            />
            <h4
              className={`font-semibold ${criticalAlerts.length > 0 ? "text-red-800" : "text-green-800"}`}
            >
              Critical Alerts
            </h4>
          </div>
          <p
            className={`text-2xl font-bold ${criticalAlerts.length > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {criticalAlerts.length}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg border ${warningAlerts.length > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}
        >
          <div className="flex items-center">
            <Bell
              className={`w-5 h-5 mr-2 ${warningAlerts.length > 0 ? "text-yellow-600" : "text-green-600"}`}
            />
            <h4
              className={`font-semibold ${warningAlerts.length > 0 ? "text-yellow-800" : "text-green-800"}`}
            >
              Warnings
            </h4>
          </div>
          <p
            className={`text-2xl font-bold ${warningAlerts.length > 0 ? "text-yellow-600" : "text-green-600"}`}
          >
            {warningAlerts.length}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-gray-600" />
            <h4 className="font-semibold text-gray-800">Info</h4>
          </div>
          <p className="text-2xl font-bold text-gray-600">{infoAlerts.length}</p>
        </div>
      </div>

      {/* Detailed Alerts */}
      {validationAlerts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Validation Results</h4>
          {validationAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.severity === "critical"
                  ? "bg-red-50 border-red-200"
                  : alert.severity === "warning"
                    ? "bg-yellow-50 border-yellow-200"
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
                          ? "text-red-800"
                          : alert.severity === "warning"
                            ? "text-yellow-800"
                            : "text-purple-800"
                      }`}
                    >
                      {alert.category}
                    </h5>
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      alert.severity === "critical"
                        ? "text-red-700"
                        : alert.severity === "warning"
                          ? "text-yellow-700"
                          : "text-purple-700"
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
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">All Pricing Validated ✓</h4>
          <p className="text-gray-600">
            Your pricing configuration is aligned with current market intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
