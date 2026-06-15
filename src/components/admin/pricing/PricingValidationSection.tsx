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
    <div className="admin-supabase space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="admin-title">Daily Pricing Validation</h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (import.meta.env.DEV) console.log("🔘 Run Validation button clicked");
            runValidation();
          }}
          disabled={isValidating}
          className="admin-btn-stroke admin-btn-primary disabled:opacity-50"
          type="button"
        >
          <RefreshCw className={`w-4 h-4 ${isValidating ? "animate-spin" : ""}`} />
          {isValidating ? "Validating..." : "Run Validation"}
        </button>
      </div>

      <div className="admin-stroke admin-stroke-row flex-col !items-start gap-1">
        <h4 className="font-semibold text-[var(--magic)]">Automated Daily Sound Checks</h4>
        <p className="admin-subtitle">
          Pricing is automatically validated daily at 6 AM against NREL ATB 2024, BloombergNEF, Wood
          Mackenzie, and other market intelligence sources. Deviations &gt;10% trigger alerts.
        </p>
      </div>

      <div className="admin-kpi-grid">
        <div
          className={`admin-kpi-cell ${criticalAlerts.length > 0 ? "admin-health-fail" : "admin-health-pass"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="admin-kpi-label !normal-case !tracking-normal">Critical Alerts</span>
          </div>
          <div className="admin-kpi-value">{criticalAlerts.length}</div>
        </div>
        <div
          className={`admin-kpi-cell ${warningAlerts.length > 0 ? "admin-health-warn" : "admin-health-pass"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4" />
            <span className="admin-kpi-label !normal-case !tracking-normal">Warnings</span>
          </div>
          <div className="admin-kpi-value">{warningAlerts.length}</div>
        </div>
        <div className="admin-kpi-cell">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[var(--ink-muted)]" />
            <span className="admin-kpi-label !normal-case !tracking-normal">Info</span>
          </div>
          <div className="admin-kpi-value">{infoAlerts.length}</div>
        </div>
      </div>

      {validationAlerts.length > 0 && (
        <div className="space-y-0 border border-[var(--glass-border)]">
          <div className="admin-section-label admin-stroke-row">Validation Results</div>
          {validationAlerts.map((alert, index) => (
            <div
              key={index}
              className={`admin-stroke border-0 border-b border-[var(--glass-border)] ${
                alert.severity === "critical"
                  ? "admin-health-fail"
                  : alert.severity === "warning"
                    ? "admin-health-warn"
                    : ""
              }`}
            >
              <div className="admin-stroke-row flex-col !items-start gap-2">
                <div className="flex items-center gap-2">
                  {alert.severity === "critical" && <AlertTriangle className="w-4 h-4" />}
                  {alert.severity === "warning" && <Bell className="w-4 h-4" />}
                  {alert.severity === "info" && (
                    <CheckCircle className="w-4 h-4 text-[var(--magic)]" />
                  )}
                  <h5 className="font-semibold text-[var(--ink-primary)]">{alert.category}</h5>
                </div>
                <p className="admin-subtitle">{alert.message}</p>
                <div className="admin-subtitle space-y-0.5 w-full">
                  <div>Current Price: ${alert.currentPrice}</div>
                  <div>
                    Market Range: ${alert.marketRange.min} – ${alert.marketRange.max}
                  </div>
                  <div>Deviation: {alert.deviation.toFixed(1)}%</div>
                  <div>Recommendation: {alert.recommendation}</div>
                  <div>Sources: {alert.sources.join(", ")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {validationAlerts.length === 0 && (
        <div className="admin-stroke text-center py-8">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h4 className="admin-title mb-1">All Pricing Validated</h4>
          <p className="admin-subtitle">
            Your pricing configuration is aligned with current market intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
