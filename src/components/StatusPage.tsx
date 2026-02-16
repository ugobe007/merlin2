import { X, CheckCircle, AlertTriangle, Activity, Clock, TrendingUp } from "lucide-react";

interface StatusPageProps {
  onClose: () => void;
}

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "outage";
  description: string;
}

export default function StatusPage({ onClose }: StatusPageProps) {
  const services: ServiceStatus[] = [
    {
      name: "Quote Builder",
      status: "operational",
      description: "BESS quote generation and calculations",
    },
    {
      name: "User Authentication",
      status: "operational",
      description: "Login, signup, and account management",
    },
    {
      name: "Market Intelligence",
      status: "operational",
      description: "Pricing data and market analytics",
    },
    {
      name: "Vendor Marketplace",
      status: "operational",
      description: "Vendor matching and lead distribution",
    },
    {
      name: "Portfolio & Projects",
      status: "operational",
      description: "Save, load, and manage projects",
    },
    {
      name: "API Services",
      status: "operational",
      description: "Backend API and data services",
    },
    {
      name: "File Upload",
      status: "operational",
      description: "Document and pricing data uploads",
    },
    {
      name: "Email Notifications",
      status: "operational",
      description: "Automated emails and alerts",
    },
  ];

  const uptime = {
    last24h: 100.0,
    last7d: 99.98,
    last30d: 99.95,
    last90d: 99.92,
  };

  const incidents = [
    {
      date: "October 20, 2025",
      time: "14:30 - 14:45 UTC",
      title: "API Performance Degradation",
      severity: "minor",
      status: "resolved",
      description:
        "Some users experienced slow response times when generating quotes. Issue was resolved by scaling up server capacity.",
      updates: [
        { time: "14:45 UTC", message: "Issue resolved. All systems operating normally." },
        { time: "14:35 UTC", message: "Scaling up servers to handle increased load." },
        { time: "14:30 UTC", message: "Investigating reports of slow API responses." },
      ],
    },
    {
      date: "October 18, 2025",
      time: "02:00 - 04:00 UTC",
      title: "Scheduled Maintenance",
      severity: "maintenance",
      status: "completed",
      description:
        "Database upgrade and optimization performed during scheduled maintenance window.",
      updates: [
        {
          time: "04:00 UTC",
          message: "Maintenance completed successfully. Platform fully operational.",
        },
        { time: "02:00 UTC", message: "Maintenance window started. Platform in read-only mode." },
      ],
    },
  ];

  const getStatusColor = (status: "operational" | "degraded" | "outage") => {
    switch (status) {
      case "operational":
        return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
      case "degraded":
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
      case "outage":
        return "text-red-400 bg-red-500/10 border border-red-500/20";
    }
  };

  const getStatusIcon = (status: "operational" | "degraded" | "outage") => {
    switch (status) {
      case "operational":
        return <CheckCircle size={14} />;
      case "degraded":
        return <AlertTriangle size={14} />;
      case "outage":
        return <AlertTriangle size={14} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border border-red-500/20";
      case "major":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/20";
      case "minor":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "maintenance":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/20";
      default:
        return "bg-white/[0.04] text-white/40 border border-white/[0.08]";
    }
  };

  const allOperational = services.every((s) => s.status === "operational");
  const hasOutage = services.some((s) => s.status === "outage");
  const hasDegraded = services.some((s) => s.status === "degraded");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl shadow-2xl max-w-5xl w-full border border-white/[0.08] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity size={28} className="text-emerald-400" />
              System Status
            </h2>
            <p className="text-white/40 text-sm mt-1">Real-time platform status and incident history</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Overall Status Banner */}
        <div
          className={`px-6 py-3 flex items-center gap-3 flex-shrink-0 border-b ${
            hasOutage
              ? "bg-red-500/[0.06] border-red-500/20"
              : hasDegraded
                ? "bg-amber-500/[0.06] border-amber-500/20"
                : "bg-emerald-500/[0.06] border-emerald-500/20"
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              hasOutage
                ? "bg-red-400 animate-pulse"
                : hasDegraded
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-400"
            }`}
          />
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">
              {hasOutage
                ? "⚠ Service Disruption"
                : hasDegraded
                  ? "⚠ Performance Degraded"
                  : "✓ All Systems Operational"}
            </div>
            <div className="text-[10px] text-white/40">
              {allOperational
                ? "Merlin Energy is operating normally. No issues detected."
                : "Some services may be experiencing issues. We are working to resolve them."}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Uptime Stats */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-400" />
                Uptime Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Last 24 Hours", value: uptime.last24h },
                  { label: "Last 7 Days", value: uptime.last7d },
                  { label: "Last 30 Days", value: uptime.last30d },
                  { label: "Last 90 Days", value: uptime.last90d },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{item.value}%</div>
                    <div className="text-[10px] text-white/40 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Status */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Service Status</h3>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-white/[0.06]"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{service.name}</div>
                      <div className="text-xs text-white/40">{service.description}</div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${getStatusColor(service.status)}`}
                    >
                      {getStatusIcon(service.status)}
                      <span className="capitalize">{service.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident History */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-blue-400" />
                Recent Incidents & Maintenance
              </h3>
              {incidents.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <CheckCircle size={40} className="mx-auto mb-3 text-emerald-400" />
                  <p className="text-sm">No incidents in the last 30 days</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {incidents.map((incident, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-blue-400/30 bg-white/[0.02] rounded-lg p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getSeverityColor(incident.severity)}`}
                            >
                              {incident.severity}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {incident.status}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white">{incident.title}</h4>
                          <div className="text-xs text-white/40 mt-1">
                            {incident.date} • {incident.time}
                          </div>
                        </div>
                      </div>

                      <p className="text-white/50 text-sm mb-4">{incident.description}</p>

                      <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
                        <div className="font-medium text-white/70 mb-3 text-xs">
                          Updates Timeline:
                        </div>
                        <div className="space-y-3">
                          {incident.updates.map((update, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex-shrink-0 w-20 text-[10px] text-white/30 font-medium">
                                {update.time}
                              </div>
                              <div className="flex-1 text-xs text-white/50 border-l border-blue-400/20 pl-3">
                                {update.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Maintenance */}
            <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-amber-400" />
                Scheduled Maintenance
              </h3>
              <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
                <div className="font-medium text-white text-sm mb-2">Database Optimization</div>
                <div className="text-xs text-white/50 space-y-1">
                  <p>
                    <strong className="text-white/70">Date:</strong> October 28, 2025
                  </p>
                  <p>
                    <strong className="text-white/70">Time:</strong> 2:00 AM – 3:00 AM UTC
                  </p>
                  <p>
                    <strong className="text-white/70">Expected Impact:</strong> Platform will be in read-only mode. Quote
                    viewing available, but no new quotes can be saved during maintenance.
                  </p>
                  <p className="text-amber-400/80 text-xs font-medium mt-2">
                    ⚠ Users will be notified 24 hours in advance
                  </p>
                </div>
              </div>
            </div>

            {/* Subscribe to Updates */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              <h3 className="text-base font-semibold text-white mb-2">Stay Informed</h3>
              <p className="text-white/50 text-sm mb-4">
                Get notified about incidents, maintenance, and status updates
              </p>
              <button className="border border-emerald-500/30 text-emerald-400 px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500/10 transition-all">
                Subscribe to Status Updates
              </button>
            </div>
          </div>
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
