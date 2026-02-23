import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle, Settings, Pause, Play } from "lucide-react";
import { type EquipmentTier } from "@/services/premiumConfigurationService";

export default function AdminMatchingTab() {
  const [matchingLive, setMatchingLive] = useState(true);
  const [liveMatches, setLiveMatches] = useState<
    Array<{
      id: string;
      time: string;
      quoteId: string;
      useCase: string;
      vendor: string;
      score: number;
      equipment: string;
      powerMW: number;
      tier: EquipmentTier;
    }>
  >([]);

  // Simulated live matching feed
  useEffect(() => {
    if (!matchingLive) return;
    const vendors = [
      "Tesla",
      "BYD",
      "CATL",
      "Fluence",
      "SMA Solar",
      "Dynapower",
      "Eaton",
      "Schneider",
    ];
    const useCases = [
      "hotel",
      "car-wash",
      "ev-charging",
      "hospital",
      "data-center",
      "manufacturing",
      "office",
    ];
    const equipmentTypes = [
      "BESS Module",
      "PCS Inverter",
      "Transformer",
      "Switchgear",
      "Solar Array",
      "Microgrid Controller",
    ];
    const interval = setInterval(() => {
      const newMatch = {
        id: `match-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        quoteId: `Q-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        useCase: useCases[Math.floor(Math.random() * useCases.length)],
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        score: Math.floor(75 + Math.random() * 25),
        equipment: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
        powerMW: Math.round((0.1 + Math.random() * 4.9) * 10) / 10,
        tier: ["standard", "premium", "enterprise"][Math.floor(Math.random() * 3)] as EquipmentTier,
      };
      setLiveMatches((prev) => [newMatch, ...prev].slice(0, 20));
    }, 3000);
    return () => clearInterval(interval);
  }, [matchingLive]);

  return (
    <>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Matching Engine</h2>
              <p className="text-xs text-emerald-400 font-medium">
                AI-powered vendor & equipment matching
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse"></div>
              Engine Active
            </div>
            <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/50/15 transition-all">
              Run Manual Match
            </button>
          </div>
        </div>

        {/* Matching Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              label: "Active Vendors",
              value: "24",
              change: "+3",
              borderClass: "border-blue-500/20",
            },
            {
              label: "Match Rate",
              value: "94.2%",
              change: "+2.1%",
              borderClass: "border-emerald-500/20",
            },
            {
              label: "Avg Match Time",
              value: "1.2s",
              change: "-0.3s",
              borderClass: "border-emerald-500/20",
            },
            {
              label: "Pending Matches",
              value: "7",
              change: "",
              borderClass: "border-orange-500/20",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border ${stat.borderClass} shadow-lg`}
            >
              <p className="text-xs font-medium text-white/50 uppercase tracking-wide">
                {stat.label}
              </p>
              <div className="flex items-end justify-between mt-1">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                {stat.change && (
                  <span
                    className={`text-xs font-medium ${stat.change.startsWith("+") ? "text-emerald-400" : "text-blue-400"}`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Match Rules */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Matching Rules Configuration
          </h3>
          <div className="space-y-3">
            {[
              { rule: "Price Priority", weight: 35, desc: "Prefer lower cost vendors" },
              { rule: "Lead Time", weight: 25, desc: "Faster delivery = higher score" },
              { rule: "Quality Rating", weight: 20, desc: "Vendor quality history" },
              { rule: "Regional Preference", weight: 15, desc: "Local vendors preferred" },
              { rule: "Past Performance", weight: 5, desc: "Previous project success" },
            ].map((rule, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{rule.rule}</p>
                  <p className="text-xs text-white/50">{rule.desc}</p>
                </div>
                <div className="flex items-center gap-2 w-48">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={rule.weight}
                    className="flex-1 h-2 bg-emerald-500/50/15 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-sm font-bold text-emerald-400 w-12 text-right">
                    {rule.weight}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matches - NOW LIVE */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08]/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/80 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Live Match Feed
            </h3>
            <button
              onClick={() => setMatchingLive(!matchingLive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                matchingLive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-white/[0.05] text-white/60"
              }`}
            >
              {matchingLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {matchingLive ? "Pause" : "Resume"}
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {liveMatches.length > 0 ? (
              liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 bg-white/[0.03] hover:bg-white/[0.05] rounded-lg transition-all cursor-pointer animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                        match.score >= 95
                          ? "bg-emerald-500/50"
                          : match.score >= 90
                            ? "bg-blue-500/50"
                            : "bg-orange-500/50"
                      }`}
                    >
                      {match.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{match.quoteId}</p>
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded ${
                            match.tier === "premium"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : match.tier === "enterprise"
                                ? "bg-amber-100 text-amber-400"
                                : "bg-white/[0.05] text-white/60"
                          }`}
                        >
                          {match.tier}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">
                        {match.equipment} • {match.powerMW} MW
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-400">{match.vendor}</p>
                    <p className="text-xs text-white/40">
                      {match.useCase} • {match.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/40">
                <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">Waiting for matches...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
