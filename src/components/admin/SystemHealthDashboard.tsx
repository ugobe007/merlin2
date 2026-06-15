/**
 * SYSTEM HEALTH DASHBOARD
 * Comprehensive health monitoring — Merlin admin Supabase style.
 */

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Code,
  Calculator,
  Link,
  Shield,
  FileText,
  Zap,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  runSystemHealthCheck,
  type SystemHealthReport,
  type HealthCheckResult,
} from "@/services/systemHealthCheck";

const SystemHealthDashboard: React.FC = () => {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadHealthReport();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadHealthReport();
      }, 60000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const loadHealthReport = async () => {
    setLoading(true);
    try {
      const healthReport = await runSystemHealthCheck();
      setReport(healthReport);
      setLastRun(new Date().toISOString());
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "fail":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-[var(--ink-muted)]" />;
    }
  };

  const getStatusStroke = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "pass":
        return "admin-health-pass";
      case "warning":
        return "admin-health-warn";
      case "fail":
      case "error":
        return "admin-health-fail";
      default:
        return "";
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      "Backend Scraper": <Database className="w-4 h-4" />,
      "Parsing Logic": <Code className="w-4 h-4" />,
      "Database Schemas": <Database className="w-4 h-4" />,
      "SSOT Compliance": <Shield className="w-4 h-4" />,
      "Workflow Links": <Link className="w-4 h-4" />,
      "StackQuote Compliance": <Shield className="w-4 h-4" />,
      "Calculation Logic": <Calculator className="w-4 h-4" />,
      "Template Formats": <FileText className="w-4 h-4" />,
      "Wizard Functionality": <Zap className="w-4 h-4" />,
      "Quote Engine": <TrendingUp className="w-4 h-4" />,
      "Merlin Metrics": <BarChart3 className="w-4 h-4" />,
    };
    return iconMap[category] || <Activity className="w-4 h-4" />;
  };

  if (loading && !report) {
    return (
      <div className="admin-supabase flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 text-[var(--magic)] animate-spin mx-auto mb-3" />
          <p className="admin-subtitle">Running comprehensive health checks...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="admin-supabase text-center py-12">
        <p className="admin-subtitle mb-4">No health report available</p>
        <button
          type="button"
          onClick={loadHealthReport}
          className="admin-btn-stroke admin-btn-primary"
        >
          Run Health Check
        </button>
      </div>
    );
  }

  const overallStroke =
    report.overallStatus === "healthy"
      ? "admin-status-ok"
      : report.overallStatus === "degraded"
        ? "admin-status-warn"
        : "admin-status-error";

  return (
    <div className="admin-supabase space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="admin-title flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--magic)]" />
            System Health Dashboard
          </h2>
          <p className="admin-subtitle mt-1">
            Last run: {lastRun ? new Date(lastRun).toLocaleString() : "Never"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer admin-subtitle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--glass-border)]"
            />
            Auto-refresh (1 min)
          </label>
          <button
            type="button"
            onClick={loadHealthReport}
            disabled={loading}
            className="admin-btn-stroke admin-btn-primary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className={`admin-status-bar ${overallStroke}`}>
        <div>
          <span className="font-semibold text-[var(--ink-primary)]">
            Overall: {report.overallStatus.toUpperCase()}
          </span>
          <span className="admin-subtitle ml-3">
            Score {report.overallScore}% · {report.summary.passed} passed ·{" "}
            {report.summary.warnings} warnings · {report.summary.failed} failed ·{" "}
            {report.summary.errors} errors
          </span>
        </div>
        <span className="admin-kpi-value">{report.overallScore}%</span>
      </div>

      <div className="grid md:grid-cols-2 gap-0 border border-[var(--glass-border)]">
        {report.checks.map((check) => (
          <div
            key={check.category}
            className={`admin-stroke border-0 border-r border-b border-[var(--glass-border)] cursor-pointer ${getStatusStroke(check.status)} ${expandedCategory === check.category ? "ring-1 ring-[var(--intel)]" : ""}`}
            onClick={() =>
              setExpandedCategory(expandedCategory === check.category ? null : check.category)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              setExpandedCategory(expandedCategory === check.category ? null : check.category)
            }
            role="button"
            tabIndex={0}
          >
            <div className="admin-stroke-row">
              <div className="flex items-center gap-2">
                {getCategoryIcon(check.category)}
                <span className="font-medium text-[var(--ink-primary)]">{check.category}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <span className="font-semibold">{check.score}%</span>
              </div>
            </div>
            <div className="admin-stroke-row !pt-0">
              <p className="admin-subtitle flex-1">{check.message}</p>
              {check.duration != null && <span className="admin-subtitle">{check.duration}ms</span>}
            </div>
            {expandedCategory === check.category && check.details && (
              <pre className="admin-preview border-0 border-t border-[var(--glass-border)] text-xs">
                {JSON.stringify(check.details, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-cell">
          <div className="admin-kpi-value text-emerald-400">{report.summary.passed}</div>
          <div className="admin-kpi-label">Passed</div>
        </div>
        <div className="admin-kpi-cell">
          <div className="admin-kpi-value text-amber-400">{report.summary.warnings}</div>
          <div className="admin-kpi-label">Warnings</div>
        </div>
        <div className="admin-kpi-cell">
          <div className="admin-kpi-value text-red-400">{report.summary.failed}</div>
          <div className="admin-kpi-label">Failed</div>
        </div>
        <div className="admin-kpi-cell">
          <div className="admin-kpi-value text-red-500">{report.summary.errors}</div>
          <div className="admin-kpi-label">Errors</div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;
