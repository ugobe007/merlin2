import React from "react";
import { Zap, Activity, Clock } from "lucide-react";

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

export default function AdminWorkflowsTab({ stats }: { stats: AdminStats }) {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Active Workflows</h2>
          </div>
          <div className="flex gap-3">
            <select className="bg-white/[0.05] border border-white/[0.08] text-white/80 px-4 py-2 rounded-xl focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all">
              <option>All Workflows</option>
              <option>Running</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
            <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
              <Activity className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Workflow Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-white/[0.08] shadow-lg">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-1">
              Active
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">
              {stats.activeWorkflows}
            </p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-emerald-500/20 shadow-lg">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-1">
              Completed
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {stats.completedWorkflows}
            </p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-red-500/20 shadow-lg">
            <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-1">
              Failed
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">
              {stats.failedWorkflows}
            </p>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-sm p-5 rounded-2xl border border-white/[0.08] shadow-lg">
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-1">
              Success Rate
            </p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-700">
              {(
                (stats.completedWorkflows / (stats.completedWorkflows + stats.failedWorkflows)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>

        {/* Active Workflows List */}
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/[0.08] shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.03]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Currently Running
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                id: "wf-001",
                name: "Quote Generation Pipeline",
                user: "user@example.com",
                started: "2 min ago",
                status: "processing",
              },
              {
                id: "wf-002",
                name: "ML Analytics Processing",
                user: "admin@merlin.com",
                started: "5 min ago",
                status: "running",
              },
              {
                id: "wf-003",
                name: "Data Export Job",
                user: "system",
                started: "12 min ago",
                status: "finalizing",
              },
            ].map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.08] hover:border-white/[0.12] hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-white font-semibold">{workflow.name}</p>
                    <p className="text-white/50 text-sm">
                      ID: {workflow.id} • User: {workflow.user}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/50 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {workflow.started}
                  </span>
                  <button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02]">
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
