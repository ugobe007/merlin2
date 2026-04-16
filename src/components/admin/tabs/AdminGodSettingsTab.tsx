import React, { useState, useRef } from "react";
import { Shield, Zap, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function AdminGodSettingsTab() {
  const [switches, setSwitches] = useState({
    quoteGeneration: true,
    aiRecommendations: true,
    realTimePricing: true,
    vendorMatching: false,
    emailNotifications: true,
    maintenanceMode: false,
  });

  const [multipliers, setMultipliers] = useState({
    marginMultiplier: 1.15,
    contingencyRate: 5.0,
    taxCreditRate: 30.0,
    discountRate: 8.0,
    escalationRate: 2.5,
    degradationRate: 2.0,
  });

  const [saved, setSaved] = useState(false);
  const auditRef = useRef<HTMLDivElement>(null);

  const toggleSwitch = (id: keyof typeof switches) => {
    setSwitches((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const switchDefs: {
    id: keyof typeof switches;
    label: string;
    desc: string;
    critical: boolean;
  }[] = [
    {
      id: "quoteGeneration",
      label: "Quote Generation",
      desc: "Enable/disable all quote generation",
      critical: true,
    },
    {
      id: "aiRecommendations",
      label: "AI Recommendations",
      desc: "ML-powered sizing suggestions",
      critical: false,
    },
    {
      id: "realTimePricing",
      label: "Real-Time Pricing",
      desc: "Live market price updates",
      critical: false,
    },
    {
      id: "vendorMatching",
      label: "Vendor Matching",
      desc: "Auto-match quotes to vendors",
      critical: false,
    },
    {
      id: "emailNotifications",
      label: "Email Notifications",
      desc: "System email alerts",
      critical: false,
    },
    {
      id: "maintenanceMode",
      label: "Maintenance Mode",
      desc: "Show maintenance page to users",
      critical: true,
    },
  ];

  const multiplierDefs: {
    id: keyof typeof multipliers;
    label: string;
    unit: string;
    desc: string;
  }[] = [
    {
      id: "marginMultiplier",
      label: "Margin Multiplier",
      unit: "x",
      desc: "Applied to all equipment costs",
    },
    {
      id: "contingencyRate",
      label: "Contingency Rate",
      unit: "%",
      desc: "Project contingency buffer",
    },
    { id: "taxCreditRate", label: "ITC Rate", unit: "%", desc: "Federal Investment Tax Credit" },
    { id: "discountRate", label: "Discount Rate", unit: "%", desc: "NPV/IRR calculations" },
    { id: "escalationRate", label: "Escalation Rate", unit: "%", desc: "Annual cost escalation" },
    {
      id: "degradationRate",
      label: "Battery Degradation",
      unit: "%/yr",
      desc: "Annual capacity loss",
    },
  ];

  const scrollToAudit = () => {
    auditRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">GOD Settings</h2>
            <p className="text-xs text-red-400 font-medium">
              Master Control — Changes affect entire system
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Last modified: 2 hours ago</span>
          <button
            onClick={scrollToAudit}
            className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/20 transition-all"
          >
            View Audit Log
          </button>
        </div>
      </div>

      {/* Master Switches */}
      <div className="bg-red-500/5 backdrop-blur-md rounded-xl p-5 border border-red-500/20 shadow-lg">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Master System Switches
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {switchDefs.map((sw) => (
            <div
              key={sw.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                sw.critical
                  ? "bg-red-500/10 border border-red-500/20"
                  : "bg-white/[0.03] border border-white/[0.08]"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1">
                  {sw.label}
                  {sw.critical && <span className="text-red-400 text-xs">●</span>}
                </p>
                <p className="text-xs text-white/50">{sw.desc}</p>
              </div>
              <button
                onClick={() => toggleSwitch(sw.id)}
                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                  switches[sw.id] ? "bg-emerald-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${
                    switches[sw.id] ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Global Multipliers */}
      <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Global Pricing Multipliers
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {multiplierDefs.map((param) => (
            <div
              key={param.id}
              className="bg-white/[0.03] p-3 rounded-lg border border-white/[0.08]"
            >
              <label className="text-xs font-medium text-white/60 block mb-1">{param.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={multipliers[param.id]}
                  step={param.unit === "x" ? 0.01 : 0.1}
                  onChange={(e) =>
                    setMultipliers((prev) => ({
                      ...prev,
                      [param.id]: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white text-sm font-semibold focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                />
                <span className="text-xs text-white/50 w-10">{param.unit}</span>
              </div>
              <p className="text-xs text-white/40 mt-1">{param.desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className={`mt-4 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-md transition-all flex items-center gap-2 ${
            saved
              ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/10"
              : "bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-emerald-500/10 hover:shadow-lg"
          }`}
        >
          {saved && <CheckCircle className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Multipliers"}
        </button>
      </div>

      {/* Activity Log */}
      <div
        ref={auditRef}
        className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg"
      >
        <h3 className="text-sm font-bold text-white/80 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent GOD Activities
        </h3>
        <div className="space-y-2">
          {[
            {
              time: "2 hours ago",
              user: "admin@merlin.com",
              action: "Changed margin multiplier from 1.12 to 1.15",
              type: "pricing",
            },
            {
              time: "1 day ago",
              user: "admin@merlin.com",
              action: "Enabled AI Recommendations",
              type: "feature",
            },
            {
              time: "3 days ago",
              user: "system",
              action: "Auto-updated ITC rate to 30%",
              type: "system",
            },
            {
              time: "1 week ago",
              user: "admin@merlin.com",
              action: "Disabled maintenance mode",
              type: "critical",
            },
          ].map((log, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white/[0.03] rounded-lg text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    log.type === "critical"
                      ? "bg-red-500"
                      : log.type === "pricing"
                        ? "bg-emerald-500"
                        : log.type === "feature"
                          ? "bg-blue-500"
                          : "bg-gray-400"
                  }`}
                />
                <span className="text-white/80">{log.action}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50">
                <span>{log.user}</span>
                <span>{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
