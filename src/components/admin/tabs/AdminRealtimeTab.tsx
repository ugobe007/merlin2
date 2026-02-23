import React from "react";
import {
  Activity,
  Zap,
  Server,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Users,
  FileText,
  Cpu,
} from "lucide-react";

export default function AdminRealtimeTab() {
  return (
    <>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Real-Time Monitoring</h2>
              <p className="text-xs text-emerald-400 font-medium">
                Live system metrics & user activity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-white/80">
              <option>Last 1 hour</option>
              <option>Last 24 hours</option>
              <option>Last 7 days</option>
            </select>
            <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-200 transition-all flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid md:grid-cols-5 gap-3">
          {[
            {
              label: "Active Users",
              value: "23",
              icon: Users,
              iconClass: "text-blue-400",
              live: true,
            },
            {
              label: "Quotes/Min",
              value: "4.2",
              icon: FileText,
              iconClass: "text-emerald-400",
              live: true,
            },
            {
              label: "API Latency",
              value: "142ms",
              icon: Zap,
              iconClass: "text-emerald-400",
              live: true,
            },
            {
              label: "Error Rate",
              value: "0.08%",
              icon: AlertTriangle,
              iconClass: "text-orange-400",
              live: false,
            },
            { label: "CPU Usage", value: "34%", icon: Cpu, iconClass: "text-white/50", live: true },
          ].map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="bg-white/[0.03] backdrop-blur-md rounded-xl p-3 border border-white/[0.08] shadow-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${metric.iconClass}`} />
                  {metric.live && (
                    <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse"></div>
                  )}
                </div>
                <p className="text-xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-white/50">{metric.label}</p>
              </div>
            );
          })}
        </div>

        {/* Live Activity Feed */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* User Activity */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-blue-500/20 shadow-lg">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Live User Activity
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[
                {
                  user: "john@company.com",
                  action: "Generated quote for Hotel",
                  time: "just now",
                  type: "quote",
                },
                {
                  user: "sarah@business.com",
                  action: "Viewed EV Charging wizard",
                  time: "30s ago",
                  type: "view",
                },
                {
                  user: "mike@enterprise.com",
                  action: "Exported PDF report",
                  time: "1m ago",
                  type: "export",
                },
                {
                  user: "anna@startup.com",
                  action: "Saved quote Q-2024-1248",
                  time: "2m ago",
                  type: "save",
                },
                {
                  user: "guest-4521",
                  action: "Started Car Wash wizard",
                  time: "3m ago",
                  type: "start",
                },
                {
                  user: "david@corp.com",
                  action: "Updated account settings",
                  time: "5m ago",
                  type: "settings",
                },
              ].map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-blue-500/5 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "quote"
                          ? "bg-emerald-500/50"
                          : activity.type === "export"
                            ? "bg-emerald-500/50"
                            : activity.type === "save"
                              ? "bg-blue-500/50"
                              : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-white font-medium">{activity.user}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/60">{activity.action}</span>
                    <span className="text-white/40">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Events */}
          <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-emerald-500/10 shadow-lg">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Server className="w-4 h-4" />
              System Events
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[
                { event: "NREL API sync completed", status: "success", time: "just now" },
                { event: "Cache refreshed (pricing)", status: "success", time: "2m ago" },
                { event: "ML model prediction batch", status: "success", time: "5m ago" },
                { event: "Database backup completed", status: "success", time: "15m ago" },
                { event: "RSS feed update (12 articles)", status: "success", time: "30m ago" },
                { event: "Vendor API rate limit warning", status: "warning", time: "1h ago" },
              ].map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-emerald-500/5 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    {event.status === "success" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-white">{event.event}</span>
                  </div>
                  <span className="text-xs text-white/40">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Graph Placeholder */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4">
            📈 Request Volume (Last Hour)
          </h3>
          <div className="h-32 flex items-end gap-1">
            {Array.from({ length: 60 }, (_, i) => {
              const height = Math.random() * 60 + 20;
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-emerald-500/60 to-emerald-500/20 rounded-t-sm hover:from-emerald-500 hover:to-emerald-400 transition-all cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${Math.floor(height / 10)} requests`}
                ></div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>60 min ago</span>
            <span>30 min ago</span>
            <span>Now</span>
          </div>
        </div>
      </div>
    </>
  );
}
