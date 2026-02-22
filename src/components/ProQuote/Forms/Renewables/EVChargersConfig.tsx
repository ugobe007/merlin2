/**
 * EVChargersConfig - EV Charging system configuration
 * L2/DCFC/HPC chargers, station config, NEVI eligibility
 * Part of Renewables section
 */

import React from "react";
import { MerlinTip } from "../../Shared/MerlinTip";

interface EVChargersConfigProps {
  // State
  evChargersIncluded: boolean;
  setEvChargersIncluded: (value: boolean) => void;
  evLevel2Count: number;
  setEvLevel2Count: (value: number) => void;
  evDCFCCount: number;
  setEvDCFCCount: (value: number) => void;
  evHPCCount: number;
  setEvHPCCount: (value: number) => void;
  evChargersPerStation: number;
  setEvChargersPerStation: (value: number) => void;
  evAdditionalPowerKW: number;
  setEvAdditionalPowerKW: (value: number) => void;
  storageSizeMW: number;
}

export const EVChargersConfig = React.memo(function EVChargersConfig({
  evChargersIncluded,
  setEvChargersIncluded,
  evLevel2Count,
  setEvLevel2Count,
  evDCFCCount,
  setEvDCFCCount,
  evHPCCount,
  setEvHPCCount,
  evChargersPerStation,
  setEvChargersPerStation,
  evAdditionalPowerKW,
  setEvAdditionalPowerKW,
  storageSizeMW,
}: EVChargersConfigProps) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        background: "rgba(16,185,129,0.05)",
        border: "1px solid rgba(16,185,129,0.15)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-semibold flex items-center gap-2 text-white">
          🔌 EV Charging System
        </h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={evChargersIncluded}
            onChange={(e) => setEvChargersIncluded(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 text-emerald-500 focus:ring-emerald-500/40 bg-transparent"
          />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Include EV Chargers
          </span>
        </label>
      </div>

      {evChargersIncluded && (
        <div className="space-y-5">
          <MerlinTip
            tip={
              evDCFCCount >= 4
                ? `${evDCFCCount} DCFC units may qualify for NEVI funding (up to 80% cost coverage). BESS behind the meter is critical — a single 150 kW DCFC creates a $3,000+/mo demand charge spike without peak shaving.`
                : "Mix L2 for dwell-time charging (workplace, hotel, retail) with DCFC for quick-stop locations. BESS paired with EV charging can cut demand charges by 50-70%."
            }
            context="NEVI Formula Program + EPRI EV Infrastructure Guide"
          />

          {/* ── Level 2 AC Charging ── */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(59,130,246,0.05)",
              border: "1px solid rgba(59,130,246,0.12)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔵</span>
              <h5 className="text-sm font-bold text-blue-300">Level 2 — AC Charging</h5>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "#93c5fd",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                7.2 kW per port
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Number of L2 Chargers
                </label>
                <input
                  type="number"
                  value={evLevel2Count}
                  onChange={(e) => setEvLevel2Count(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>🔌</span> <span>J1772 / Type 2 connector</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>⏱️</span>{" "}
                  <span>Full charge: 4–8 hours (ideal for workplace/overnight)</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>💰</span> <span>~$5,000 hardware + $3,000 install per unit</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>🏷️</span>{" "}
                  <span className="italic">
                    ChargePoint CP6000, Enel X JuiceBox, Siemens VersiCharge
                  </span>
                </div>
              </div>
            </div>
            {evLevel2Count > 0 && (
              <div
                className="mt-3 flex items-center gap-4 text-xs font-medium"
                style={{ color: "rgba(147,197,253,0.7)" }}
              >
                <span>⚡ {(evLevel2Count * 7.2).toFixed(1)} kW connected</span>
                <span>•</span>
                <span>
                  💵 ~${((evLevel2Count * 8000) / 1000).toFixed(0)}K est. hardware + install
                </span>
              </div>
            )}
          </div>

          {/* ── DC Fast Charging (DCFC) ── */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(251,146,60,0.05)",
              border: "1px solid rgba(251,146,60,0.12)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🟠</span>
              <h5 className="text-sm font-bold text-emerald-300">DC Fast Charging — DCFC</h5>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{
                  background: "rgba(251,146,60,0.12)",
                  color: "#fdba74",
                  border: "1px solid rgba(251,146,60,0.2)",
                }}
              >
                150 kW per port
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Number of DCFC Chargers
                </label>
                <input
                  type="number"
                  value={evDCFCCount}
                  onChange={(e) => setEvDCFCCount(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>🔌</span> <span>CCS (Combined Charging System) + CHAdeMO</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>⏱️</span> <span>20-80% in ~25-30 min (200+ miles range added)</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>💰</span> <span>~$55,000 hardware + $30,000 install per unit</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>🏷️</span>{" "}
                  <span className="italic">ABB Terra 184, BTC Power Gen4, Tritium RTM</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>⚡</span> <span>400-920V DC output, liquid-cooled cable</span>
                </div>
              </div>
            </div>
            {evDCFCCount > 0 && (
              <div
                className="mt-3 flex items-center gap-4 text-xs font-medium"
                style={{ color: "rgba(253,186,116,0.7)" }}
              >
                <span>⚡ {(evDCFCCount * 150).toFixed(0)} kW connected</span>
                <span>•</span>
                <span>
                  💵 ~${((evDCFCCount * 85000) / 1000).toFixed(0)}K est. hardware + install
                </span>
              </div>
            )}
          </div>

          {/* ── High Power Charging (HPC) ── */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.12)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔴</span>
              <h5 className="text-sm font-bold text-red-300">High Power Charging — HPC</h5>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                250 kW per port
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Number of HPC Chargers
                </label>
                <input
                  type="number"
                  value={evHPCCount}
                  onChange={(e) => setEvHPCCount(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  max="20"
                  className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-red-500/40 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>🔌</span> <span>CCS2 (up to 350 kW capable)</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>⏱️</span> <span>10-80% in ~15 min (gas station equivalent speed)</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>💰</span> <span>~$90,000 hardware + $40,000 install per unit</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>🏷️</span>{" "}
                  <span className="italic">ABB Terra HP, Tritium PKM, Kempower S-Series</span>
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  <span>⚡</span> <span>800V+ architecture, active liquid cooling required</span>
                </div>
              </div>
            </div>
            {evHPCCount > 0 && (
              <div
                className="mt-3 flex items-center gap-4 text-xs font-medium"
                style={{ color: "rgba(252,165,165,0.7)" }}
              >
                <span>⚡ {(evHPCCount * 250).toFixed(0)} kW connected</span>
                <span>•</span>
                <span>
                  💵 ~${((evHPCCount * 130000) / 1000).toFixed(0)}K est. hardware + install
                </span>
              </div>
            )}
          </div>

          {/* ── Station Config + Site Power ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Chargers per Station
              </label>
              <div className="flex gap-2">
                {([1, 2] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setEvChargersPerStation(n)}
                    className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background:
                        evChargersPerStation === n
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        evChargersPerStation === n
                          ? "1px solid rgba(16,185,129,0.35)"
                          : "1px solid rgba(255,255,255,0.08)",
                      color: evChargersPerStation === n ? "#6ee7b7" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {n} Connector{n > 1 ? "s" : ""} / Station
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Additional Site Power (kW)
              </label>
              <input
                type="number"
                value={evAdditionalPowerKW}
                onChange={(e) =>
                  setEvAdditionalPowerKW(Math.max(0, parseFloat(e.target.value) || 0))
                }
                step="10"
                min="0"
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                Lighting, signage, HVAC, convenience store, etc.
              </p>
            </div>
          </div>

          {/* ── NEVI Compliance Callout ── */}
          {evDCFCCount >= 4 && (
            <div
              className="rounded-lg p-3 flex items-start gap-3"
              style={{
                background: "rgba(52,211,153,0.06)",
                border: "1px solid rgba(52,211,153,0.15)",
              }}
            >
              <span className="text-lg shrink-0 mt-0.5">🏛️</span>
              <div>
                <p className="text-sm font-semibold text-emerald-300 mb-1">NEVI Program Eligible</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  With {evDCFCCount}× DCFC units, this site may qualify for the{" "}
                  <strong className="text-emerald-300/80">
                    National Electric Vehicle Infrastructure (NEVI)
                  </strong>{" "}
                  program — up to{" "}
                  <strong className="text-emerald-300/80">80% of costs covered</strong> (max $7,500
                  per port, $900K per site). Requires ≥4 CCS ports at 150 kW+, located along
                  Alternative Fuel Corridors.
                </p>
              </div>
            </div>
          )}

          {/* ── EV Infrastructure Cost Estimate ── */}
          {(() => {
            const evL2HW = evLevel2Count * 5000;
            const evL2Install = evLevel2Count * 3000;
            const evDCFCHW = evDCFCCount * 55000;
            const evDCFCInstall = evDCFCCount * 30000;
            const evHPCHW = evHPCCount * 90000;
            const evHPCInstall = evHPCCount * 40000;
            const evMakeReady = (evDCFCCount + evHPCCount) * 25000;
            const evTotalHW = evL2HW + evDCFCHW + evHPCHW;
            const evTotalInstall = evL2Install + evDCFCInstall + evHPCInstall + evMakeReady;
            const evGrandTotal = evTotalHW + evTotalInstall;
            const evConnectedKW = evLevel2Count * 7.2 + evDCFCCount * 150 + evHPCCount * 250;
            const evPeakKW = Math.round(evConnectedKW * 0.7);
            const evTotalPeakKW = evPeakKW + evAdditionalPowerKW;
            const evBESSRecommendedKW = Math.round(evPeakKW * 0.7);
            const evStations = Math.ceil(
              (evLevel2Count + evDCFCCount + evHPCCount) / evChargersPerStation
            );
            const totalChargers = evLevel2Count + evDCFCCount + evHPCCount;
            if (totalChargers === 0) return null;

            return (
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid rgba(16,185,129,0.2)" }}
              >
                {/* Summary Header */}
                <div className="px-4 py-3" style={{ background: "rgba(16,185,129,0.1)" }}>
                  <h5 className="text-sm font-bold text-emerald-200 flex items-center gap-2">
                    📊 EV Infrastructure Summary
                  </h5>
                </div>

                <div className="p-4 space-y-4" style={{ background: "rgba(16,185,129,0.04)" }}>
                  {/* Power Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div
                      className="text-center p-2.5 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        Connected
                      </p>
                      <p className="text-xl font-extrabold text-emerald-300">
                        {evConnectedKW.toFixed(0)} <span className="text-xs font-medium">kW</span>
                      </p>
                    </div>
                    <div
                      className="text-center p-2.5 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        Peak Demand
                      </p>
                      <p className="text-xl font-extrabold text-emerald-300">
                        {evTotalPeakKW.toFixed(0)} <span className="text-xs font-medium">kW</span>
                      </p>
                    </div>
                    <div
                      className="text-center p-2.5 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        Stations
                      </p>
                      <p className="text-xl font-extrabold text-emerald-300">{evStations}</p>
                    </div>
                    <div
                      className="text-center p-2.5 rounded-lg"
                      style={{
                        background: "rgba(52,211,153,0.05)",
                        border: "1px solid rgba(52,211,153,0.12)",
                      }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        BESS Peak Shaving
                      </p>
                      <p className="text-xl font-extrabold text-emerald-400">
                        {evBESSRecommendedKW} <span className="text-xs font-medium">kW</span>
                      </p>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div
                    className="rounded-lg p-3 space-y-2"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-2"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      Estimated Infrastructure Cost
                    </p>
                    {evLevel2Count > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          🔵 Level 2 × {evLevel2Count}
                        </span>
                        <span className="font-semibold text-blue-300">
                          ${((evL2HW + evL2Install) / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                    {evDCFCCount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          🟠 DCFC × {evDCFCCount}
                        </span>
                        <span className="font-semibold text-emerald-300">
                          ${((evDCFCHW + evDCFCInstall) / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                    {evHPCCount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          🔴 HPC × {evHPCCount}
                        </span>
                        <span className="font-semibold text-red-300">
                          ${((evHPCHW + evHPCInstall) / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                    {evDCFCCount + evHPCCount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>
                          🔧 Electrical Make-Ready
                        </span>
                        <span className="font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                          ${(evMakeReady / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                    <div
                      className="flex items-center justify-between text-sm font-bold pt-2 mt-2"
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <span className="text-white">Total EV Infrastructure</span>
                      <span className="text-emerald-300">
                        $
                        {evGrandTotal >= 1_000_000
                          ? `${(evGrandTotal / 1_000_000).toFixed(2)}M`
                          : `${(evGrandTotal / 1000).toFixed(0)}K`}
                      </span>
                    </div>
                  </div>

                  {/* BESS Tip */}
                  <div
                    className="flex items-start gap-2 text-xs"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    <span className="shrink-0">🔋</span>
                    <span>
                      EV charging creates very spiky demand. BESS peak shaving can{" "}
                      <strong className="text-emerald-300/80">reduce demand charges by 50%+</strong>
                      . 70% concurrency factor applied — not all chargers operate at max
                      simultaneously.
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
});
