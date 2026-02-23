import React from "react";
import { Activity, Server, CheckCircle, AlertTriangle } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  semiPremiumUsers: number;
  premiumUsers: number;
  quotesGeneratedToday: number;
  activeSessions: number;
  monthlyRevenue: number;
  systemHealth: string;
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
}

export default function AdminHealthTab({ stats }: { stats: AdminStats }) {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">System Health Monitor</h2>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              stats.systemHealth === "operational"
                ? "bg-emerald-500/10 text-emerald-400"
                : stats.systemHealth === "degraded"
                  ? "bg-amber-100 text-amber-400"
                  : "bg-red-500/10 text-red-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${
                stats.systemHealth === "operational"
                  ? "bg-emerald-500/50"
                  : stats.systemHealth === "degraded"
                    ? "bg-amber-500/50"
                    : "bg-red-500/50"
              }`}
            ></div>
            <span className="font-semibold capitalize">{stats.systemHealth}</span>
          </div>
        </div>

        {/* Health Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-emerald-500/20 shadow-lg">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-1">
              Uptime
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {stats.uptime}%
            </p>
            <p className="text-xs text-white/50 mt-1">Last 30 days</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-white/[0.08] shadow-lg">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-1">
              API Response
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              {stats.apiResponseTime}ms
            </p>
            <p className="text-xs text-white/50 mt-1">Average</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-white/[0.08] shadow-lg">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-1">
              Error Rate
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
              {stats.errorRate}%
            </p>
            <p className="text-xs text-white/50 mt-1">Last 24 hours</p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-orange-500/20 shadow-lg">
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-1">
              Active Sessions
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              {stats.activeSessions}
            </p>
            <p className="text-xs text-white/50 mt-1">Current</p>
          </div>
        </div>

        {/* System Components Health */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.03]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Component Status
            </h3>
          </div>
          <div className="p-4 grid md:grid-cols-2 gap-3">
            {[
              { name: "Database", status: "healthy", latency: "12ms", last_check: "30s ago" },
              {
                name: "API Gateway",
                status: "healthy",
                latency: "45ms",
                last_check: "15s ago",
              },
              {
                name: "Authentication",
                status: "healthy",
                latency: "89ms",
                last_check: "1m ago",
              },
              {
                name: "File Storage",
                status: "warning",
                latency: "234ms",
                last_check: "2m ago",
              },
              {
                name: "ML Analytics Engine",
                status: "healthy",
                latency: "156ms",
                last_check: "45s ago",
              },
              {
                name: "Email Service",
                status: "healthy",
                latency: "67ms",
                last_check: "1m ago",
              },
            ].map((component) => (
              <div
                key={component.name}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                  component.status === "healthy"
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : component.status === "warning"
                      ? "bg-amber-500/50/5 border-amber-500/20"
                      : "bg-red-500/50/5 border-red-500/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  {component.status === "healthy" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : component.status === "warning" ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-white font-semibold">{component.name}</p>
                    <p className="text-white/50 text-sm">Latency: {component.latency}</p>
                  </div>
                </div>
                <span className="text-sm text-white/40">{component.last_check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
