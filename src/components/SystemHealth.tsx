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
  const [systemStatus, setSystemStatus] = useState<"operational" | "degraded" | "down">(
    "operational"
  );
  const [uptime, setUptime] = useState(99.98);

  // Mock health metrics
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([
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

  // Mock performance metrics
  const performanceMetrics: PerformanceMetric[] = [
    { name: "Page Load Time", current: 1.2, average: 1.4, threshold: 3.0, unit: "s" },
    { name: "Time to Interactive", current: 2.1, average: 2.3, threshold: 5.0, unit: "s" },
    { name: "API Latency", current: 145, average: 160, threshold: 500, unit: "ms" },
    { name: "Database Query Time", current: 23, average: 28, threshold: 100, unit: "ms" },
  ];

  // Mock error logs
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

  // Mock recent incidents
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
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
    }
  };

  const getStatusIcon = (status: "healthy" | "warning" | "critical") => {
    switch (status) {
      case "healthy":
        return <CheckCircle size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "critical":
        return <AlertTriangle size={20} />;
    }
  };

  const runHealthCheck = () => {
    alert("Running comprehensive health check...\n\nAll systems operational ✓");
    // In production, this would trigger actual health checks
  };

  const clearErrorLogs = () => {
    if (confirm("Clear all error logs? This cannot be undone.")) {
      setErrorLogs([]);
      alert("Error logs cleared successfully");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full border-4 border-blue-300 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Activity size={32} />
              System Health & Monitoring
            </h2>
            <p className="text-blue-100 mt-1">Real-time platform health and performance metrics</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-700"
          >
            <X size={28} />
          </button>
        </div>

        {/* System Status Banner */}
        <div
          className={`px-6 py-4 flex items-center justify-between flex-shrink-0 ${
            systemStatus === "operational"
              ? "bg-green-50 border-b-4 border-green-500"
              : systemStatus === "degraded"
                ? "bg-yellow-50 border-b-4 border-yellow-500"
                : "bg-red-50 border-b-4 border-red-500"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                systemStatus === "operational"
                  ? "bg-green-500 animate-pulse"
                  : systemStatus === "degraded"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500 animate-pulse"
              }`}
            />
            <div>
              <div className="font-bold text-gray-900 text-lg">
                {systemStatus === "operational"
                  ? "✓ All Systems Operational"
                  : systemStatus === "degraded"
                    ? "⚠ Performance Degraded"
                    : "✗ System Down"}
              </div>
              <div className="text-sm text-gray-600">Uptime: {uptime}% | Last 30 days</div>
            </div>
          </div>
          <button
            onClick={runHealthCheck}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Activity size={18} />
            Run Health Check
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "overview"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Server size={20} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "performance"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Zap size={20} />
              Performance
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "errors"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <AlertTriangle size={20} />
              Error Logs
              {errorLogs.filter((e) => e.level === "error").length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {errorLogs.filter((e) => e.level === "error").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("maintenance")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "maintenance"
                  ? "border-b-4 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Clock size={20} />
              Maintenance
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 border-2 border-green-300">
                  <div className="flex items-center justify-between mb-2">
                    <Wifi className="text-green-600" size={24} />
                    <span className="text-2xl font-bold text-green-600">{uptime}%</span>
                  </div>
                  <div className="text-sm font-bold text-gray-700">Uptime</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-300">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="text-blue-600" size={24} />
                    <span className="text-2xl font-bold text-blue-600">145ms</span>
                  </div>
                  <div className="text-sm font-bold text-gray-700">Avg Response</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-4 border-2 border-purple-300">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="text-purple-600" size={24} />
                    <span className="text-2xl font-bold text-purple-600">1,247</span>
                  </div>
                  <div className="text-sm font-bold text-gray-700">Requests/min</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border-2 border-orange-300">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="text-orange-600" size={24} />
                    <span className="text-2xl font-bold text-orange-600">0.02%</span>
                  </div>
                  <div className="text-sm font-bold text-gray-700">Error Rate</div>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">System Health Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthMetrics.map((metric, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">{metric.name}</div>
                          <div className="text-2xl font-bold text-gray-900 my-1">
                            {metric.value}
                          </div>
                          <div className="text-xs text-gray-600">{metric.description}</div>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full ${getStatusColor(metric.status)} font-bold flex items-center gap-1`}
                        >
                          {getStatusIcon(metric.status)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Last checked: {metric.lastChecked.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Incidents */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Incidents</h3>
                {recentIncidents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                    <p>No incidents in the last 30 days</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentIncidents.map((incident, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-gray-900">{incident.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{incident.impact}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {incident.date} • Duration: {incident.duration}
                            </div>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
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
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Performance Metrics</h3>
                <p className="text-gray-600">
                  Real-time performance data and optimization recommendations
                </p>
              </div>

              {performanceMetrics.map((metric, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{metric.name}</h4>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {metric.current}
                        {metric.unit}
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full font-bold ${
                        metric.current <= metric.average
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {metric.current <= metric.average ? "✓ Good" : "⚠ Above Avg"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Current</span>
                      <span>Average</span>
                      <span>Threshold</span>
                    </div>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full rounded-full transition-all ${
                          metric.current <= metric.average
                            ? "bg-green-500"
                            : metric.current <= metric.threshold
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${(metric.current / metric.threshold) * 100}%` }}
                      />
                      <div
                        className="absolute h-full w-0.5 bg-gray-700"
                        style={{ left: `${(metric.average / metric.threshold) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
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
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">
                  💡 Optimization Recommendations
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Enable browser caching for static assets (images, CSS, JS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Consider implementing lazy loading for vendor marketplace data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Database query optimization detected 3 slow queries</span>
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
                  <h3 className="text-xl font-bold text-gray-900">Error & Warning Logs</h3>
                  <p className="text-gray-600 text-sm">Last 100 entries</p>
                </div>
                <button
                  onClick={clearErrorLogs}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-all"
                >
                  Clear Logs
                </button>
              </div>

              {errorLogs.length === 0 ? (
                <div className="text-center py-12 bg-green-50 rounded-xl border-2 border-green-300">
                  <CheckCircle size={64} className="mx-auto mb-4 text-green-500" />
                  <p className="text-xl font-bold text-gray-900">No Errors Logged</p>
                  <p className="text-gray-600 mt-2">System is running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errorLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`border-l-4 rounded-lg p-4 ${
                        log.level === "error"
                          ? "border-red-500 bg-red-50"
                          : log.level === "warning"
                            ? "border-yellow-500 bg-yellow-50"
                            : "border-blue-500 bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                log.level === "error"
                                  ? "bg-red-600 text-white"
                                  : log.level === "warning"
                                    ? "bg-yellow-600 text-white"
                                    : "bg-blue-600 text-white"
                              }`}
                            >
                              {log.level}
                            </span>
                            {log.component && (
                              <span className="text-xs text-gray-600">{log.component}</span>
                            )}
                          </div>
                          <div className="text-gray-900 font-medium">{log.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
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
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Maintenance Schedule</h3>
                <p className="text-gray-600">Plan and communicate scheduled maintenance windows</p>
              </div>

              {/* Upcoming Maintenance */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Upcoming Maintenance</h4>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock size={24} className="text-yellow-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-gray-900">Database Optimization</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Scheduled: October 28, 2025 at 2:00 AM UTC
                      </div>
                      <div className="text-sm text-gray-600">Expected duration: 1 hour</div>
                      <div className="text-sm text-gray-600 mt-2">
                        Impact: Platform will be in read-only mode during maintenance
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Maintenance Actions</h4>
                <div className="space-y-3">
                  <button className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-700 transition-all flex items-center justify-between">
                    <span>Enable Maintenance Mode</span>
                    <span>→</span>
                  </button>
                  <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-between">
                    <span>Schedule Maintenance Window</span>
                    <span>→</span>
                  </button>
                  <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all flex items-center justify-between">
                    <span>Clear Application Cache</span>
                    <span>→</span>
                  </button>
                  <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center justify-between">
                    <span>Run Database Backup</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">System Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Platform Version:</span>
                    <span className="font-bold ml-2">2.1.4</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Deployment:</span>
                    <span className="font-bold ml-2">Oct 23, 2025</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Node.js:</span>
                    <span className="font-bold ml-2">v20.11.0</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Database:</span>
                    <span className="font-bold ml-2">PostgreSQL 15.3</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Hosting:</span>
                    <span className="font-bold ml-2">Fly.io</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CDN:</span>
                    <span className="font-bold ml-2">Cloudflare</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
