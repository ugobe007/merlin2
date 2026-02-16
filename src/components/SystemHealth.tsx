import { useState } from "react";
import { X, Activity, AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, Server, Wifi } from "lucide-react";

interface SystemHealthProps {
  onClose: () => void;
}

interface HealthMetric {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  description: string;
  lastChecked: Date;
}

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: "error" | "warning" | "info";
  message: string;
  component?: string;
  userId?: string;
}

interface PerformanceMetric {
  name: string;
  current: number;
  average: number;
  threshold: number;
  unit: string;
}

export default function SystemHealth({ onClose }: SystemHealthProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "performance" | "errors" | "maintenance">(
    "overview"
  );
  const [systemStatus] = useState<"operational" | "degraded" | "down">(
    "operational"
  );
  const [uptime] = useState(99.98);

  const [healthMetrics] = useState<HealthMetric[]>([
    {
      name: "API Response Time",
      status: "healthy",
      value: "145ms",
      description: "Average response time for API calls",
      lastChecked: new Date(),
    },
    {
      name: "Database Connection",
      status: "healthy",
      value: "Connected",
      description: "PostgreSQL connection pool status",
      lastChecked: new Date(),
    },
    {
      name: "Memory Usage",
      status: "warning",
      value: "78%",
      description: "Application memory utilization",
      lastChecked: new Date(),
    },
    {
      name: "CPU Usage",
      status: "healthy",
      value: "34%",
      description: "Server CPU utilization",
      lastChecked: new Date(),
    },
    {
      name: "Disk Space",
      status: "healthy",
      value: "45% used",
      description: "Available disk space on server",
      lastChecked: new Date(),
    },
    {
      name: "Error Rate",
      status: "healthy",
      value: "0.02%",
      description: "Percentage of requests resulting in errors",
      lastChecked: new Date(),
    },
  ]);

  const performanceMetrics: PerformanceMetric[] = [
    { name: "Page Load Time", current: 1.2, average: 1.4, threshold: 3.0, unit: "s" },
    { name: "Time to Interactive", current: 2.1, average: 2.3, threshold: 5.0, unit: "s" },
    { name: "API Latency", current: 145, average: 160, threshold: 500, unit: "ms" },
    { name: "Database Query Time", current: 23, average: 28, threshold: 100, unit: "ms" },
  ];

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([
    {
      id: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      level: "warning",
      message: "Slow API response detected (>300ms)",
      component: "MarketIntelligence",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      level: "error",
      message: "Failed to load user profile data",
      component: "UserProfile",
      userId: "user_123",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      level: "info",
      message: "Database connection pool expanded to handle load",
      component: "Database",
    },
  ]);

  const recentIncidents = [
    {
      date: "2025-10-20",
      title: "API Performance Degradation",
      duration: "15 minutes",
      impact: "Some users experienced slow quote generation",
      resolved: true,
    },
    {
      date: "2025-10-18",
      title: "Scheduled Maintenance",
      duration: "2 hours",
      impact: "Platform unavailable during database upgrade",
      resolved: true,
    },
  ];

  const getStatusColor = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
      case "warning":
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
      case "critical":
        return "text-red-400 bg-red-500/10 border border-red-500/20";
    }
  };

  const getStatusIcon = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return <CheckCircle size={16} />;
      case "warning":
        return <AlertTriangle size={16} />;
      case "critical":
        return <AlertTriangle size={16} />;
    }
  };

  const runHealthCheck = () => {
    alert("Running comprehensive health check...\n\nAll systems operational ✓");
  };

  const clearErrorLogs = () => {
    if (confirm("Clear all error logs? This cannot be undone.")) {
      setErrorLogs([]);
      alert("Error logs cleared successfully");
    }
  };

  const tabItems = [
    { id: "overview" as const, label: "Overview", icon: Server },
    { id: "performance" as const, label: "Performance", icon: Zap },
    { id: "errors" as const, label: "Error Logs", icon: AlertTriangle, badge: errorLogs.filter((e) => e.level === "error").length },
    { id: "maintenance" as const, label: "Maintenance", icon: Clock },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl shadow-2xl max-w-6xl w-full border border-white/[0.08] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity size={28} className="text-emerald-400" />
              System Health & Monitoring
            </h2>
            <p className="text-white/40 text-sm mt-1">Real-time platform health and performance metrics</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={24} />
          </button>
        </div>

        {/* System Status Banner */}
        <div
          className={`px-6 py-3 flex items-center justify-between flex-shrink-0 border-b ${
            systemStatus === "operational"
              ? "bg-emerald-500/[0.06] border-emerald-500/20"
              : systemStatus === "degraded"
                ? "bg-amber-500/[0.06] border-amber-500/20"
                : "bg-red-500/[0.06] border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                systemStatus === "operational"
                  ? "bg-emerald-400 animate-pulse"
                  : systemStatus === "degraded"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-red-400 animate-pulse"
              }`}
            />
            <div>
              <div className="font-semibold text-white text-sm">
                {systemStatus === "operational"
                  ? "✓ All Systems Operational"
                  : systemStatus === "degraded"
                    ? "⚠ Performance Degraded"
                    : "✗ System Down"}
              </div>
              <div className="text-[10px] text-white/40">Uptime: {uptime}% | Last 30 days</div>
            </div>
          </div>
          <button
            onClick={runHealthCheck}
            className="border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-500/10 transition-all flex items-center gap-2"
          >
            <Activity size={14} />
            Run Health Check
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.08] flex-shrink-0">
          <div className="flex">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-emerald-400 text-emerald-400"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full border border-red-500/20">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { icon: Wifi, label: "Uptime", value: `${uptime}%`, color: "text-emerald-400" },
                  { icon: Zap, label: "Avg Response", value: "145ms", color: "text-blue-400" },
                  { icon: TrendingUp, label: "Requests/min", value: "1,247", color: "text-purple-400" },
                  { icon: AlertTriangle, label: "Error Rate", value: "0.02%", color: "text-amber-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={stat.color} size={20} />
                      <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                    <div className="text-[10px] text-white/40 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Health Metrics */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">System Health Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthMetrics.map((metric, index) => (
                    <div key={index} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{metric.name}</div>
                          <div className="text-xl font-bold text-white my-1">
                            {metric.value}
                          </div>
                          <div className="text-[10px] text-white/30">{metric.description}</div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 ${getStatusColor(metric.status)}`}
                        >
                          {getStatusIcon(metric.status)}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/20 mt-2">
                        Last checked: {metric.lastChecked.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Incidents */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Recent Incidents</h3>
                {recentIncidents.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
                    <p className="text-sm">No incidents in the last 30 days</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentIncidents.map((incident, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-blue-400/40 bg-white/[0.02] rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-white text-sm">{incident.title}</div>
                            <div className="text-xs text-white/40 mt-1">{incident.impact}</div>
                            <div className="text-[10px] text-white/30 mt-2">
                              {incident.date} • Duration: {incident.duration}
                            </div>
                          </div>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-medium border border-emerald-500/20">
                            Resolved
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-1">Performance Metrics</h3>
                <p className="text-white/50 text-sm">
                  Real-time performance data and optimization recommendations
                </p>
              </div>

              {performanceMetrics.map((metric, index) => (
                <div key={index} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{metric.name}</h4>
                      <div className="text-xl font-bold text-blue-400 mt-1">
                        {metric.current}
                        {metric.unit}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-medium ${
                        metric.current <= metric.average
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {metric.current <= metric.average ? "✓ Good" : "⚠ Above Avg"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-white/30">
                      <span>Current</span>
                      <span>Average</span>
                      <span>Threshold</span>
                    </div>
                    <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full rounded-full transition-all ${
                          metric.current <= metric.average
                            ? "bg-emerald-500/60"
                            : metric.current <= metric.threshold
                              ? "bg-amber-500/60"
                              : "bg-red-500/60"
                        }`}
                        style={{ width: `${(metric.current / metric.threshold) * 100}%` }}
                      />
                      <div
                        className="absolute h-full w-0.5 bg-white/30"
                        style={{ left: `${(metric.average / metric.threshold) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/20">
                      <span>
                        {metric.current}
                        {metric.unit}
                      </span>
                      <span>
                        {metric.average}
                        {metric.unit}
                      </span>
                      <span>
                        {metric.threshold}
                        {metric.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Optimization Tips */}
              <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-white mb-3">
                  💡 Optimization Recommendations
                </h4>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 text-xs mt-0.5">•</span>
                    Enable browser caching for static assets (images, CSS, JS)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 text-xs mt-0.5">•</span>
                    Consider implementing lazy loading for vendor marketplace data
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 text-xs mt-0.5">•</span>
                    Database query optimization detected 3 slow queries
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Error Logs Tab */}
          {activeTab === "errors" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-white">Error & Warning Logs</h3>
                  <p className="text-white/40 text-xs">Last 100 entries</p>
                </div>
                <button
                  onClick={clearErrorLogs}
                  className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all"
                >
                  Clear Logs
                </button>
              </div>

              {errorLogs.length === 0 ? (
                <div className="text-center py-12 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl">
                  <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
                  <p className="text-base font-semibold text-white">No Errors Logged</p>
                  <p className="text-white/40 text-sm mt-2">System is running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errorLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`border-l-2 rounded-lg p-4 ${
                        log.level === "error"
                          ? "border-red-400/40 bg-red-500/[0.04]"
                          : log.level === "warning"
                            ? "border-amber-400/40 bg-amber-500/[0.04]"
                            : "border-blue-400/40 bg-blue-500/[0.04]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                                log.level === "error"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                  : log.level === "warning"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {log.level}
                            </span>
                            {log.component && (
                              <span className="text-[10px] text-white/30">{log.component}</span>
                            )}
                          </div>
                          <div className="text-white/70 text-sm font-medium">{log.message}</div>
                          <div className="text-[10px] text-white/20 mt-1">
                            {log.timestamp.toLocaleString()}
                            {log.userId && ` • User: ${log.userId}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-1">Maintenance Schedule</h3>
                <p className="text-white/50 text-sm">Plan and communicate scheduled maintenance windows</p>
              </div>

              {/* Upcoming Maintenance */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Upcoming Maintenance</h4>
                <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-white text-sm">Database Optimization</div>
                      <div className="text-xs text-white/40 mt-1">
                        Scheduled: October 28, 2025 at 2:00 AM UTC
                      </div>
                      <div className="text-xs text-white/40">Expected duration: 1 hour</div>
                      <div className="text-xs text-white/40 mt-2">
                        Impact: Platform will be in read-only mode during maintenance
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Maintenance Actions</h4>
                <div className="space-y-3">
                  <button className="w-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-all flex items-center justify-between">
                    <span>Enable Maintenance Mode</span>
                    <span>→</span>
                  </button>
                  <button className="w-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-all flex items-center justify-between">
                    <span>Schedule Maintenance Window</span>
                    <span>→</span>
                  </button>
                  <button className="w-full bg-purple-500/10 text-purple-400 border border-purple-500/20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-purple-500/20 transition-all flex items-center justify-between">
                    <span>Clear Application Cache</span>
                    <span>→</span>
                  </button>
                  <button className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-6 py-3 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all flex items-center justify-between">
                    <span>Run Database Backup</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">System Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Platform Version", value: "2.1.4" },
                    { label: "Last Deployment", value: "Oct 23, 2025" },
                    { label: "Node.js", value: "v20.11.0" },
                    { label: "Database", value: "PostgreSQL 15.3" },
                    { label: "Hosting", value: "Fly.io" },
                    { label: "CDN", value: "Cloudflare" },
                  ].map((item) => (
                    <div key={item.label}>
                      <span className="text-white/40 text-xs">{item.label}:</span>
                      <span className="font-medium text-white ml-2 text-xs">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/[0.08] p-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-white/30">Last updated: {new Date().toLocaleTimeString()}</p>
            <button
              onClick={onClose}
              className="border border-emerald-500/30 text-emerald-400 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-500/10 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
