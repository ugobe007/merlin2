/**
 * Electrical Specifications Section
 * Phase 1G Part 2c Operation 5 (Feb 2026)
 *
 * Power conversion system (PCS), inverters, transformers, and electrical parameters
 * Extracted from AdvancedQuoteBuilder.tsx (~513 lines)
 *
 * Features:
 * - PCS quoting method (included vs separate)
 * - Inverter configuration (type, count, rating, manufacturer)
 * - Electrical parameters (watts, AC/DC amps)
 * - Voltage configuration (AC system, DC battery)
 * - System summary card
 * - Auto-calculation capabilities
 */

import { Zap, Cpu } from "lucide-react";
import { MerlinTip } from "../Shared/MerlinTip";

export interface ElectricalSpecsSectionProps {
  // PCS Configuration
  pcsQuoteSeparately: boolean;
  setPcsQuoteSeparately: (value: boolean) => void;
  inverterType: string;
  setInverterType: (value: string) => void;

  // Inverter Specifications
  numberOfInvertersInput: number;
  setNumberOfInvertersInput: (value: number) => void;
  inverterRating: number;
  setInverterRating: (value: number) => void;
  inverterManufacturer: string;
  setInverterManufacturer: (value: string) => void;

  // Electrical Parameters
  systemWattsInput: number | "";
  setSystemWattsInput: (value: number | "") => void;
  systemAmpsACInput: number | "";
  setSystemAmpsACInput: (value: number | "") => void;
  systemAmpsDCInput: number | "";
  setSystemAmpsDCInput: (value: number | "") => void;

  // Voltage Configuration
  systemVoltage: number;
  setSystemVoltage: (value: number) => void;
  dcVoltage: number;
  setDcVoltage: (value: number) => void;

  // Calculated Values (read-only)
  storageSizeMW: number;
  totalKW: number;
  calculatedWatts: number;
  calculatedAmpsAC: number;
  calculatedAmpsDC: number;
  numberOfInverters: number;
  maxAmpsAC: number;
  maxAmpsDC: number;
}

export default function ElectricalSpecsSection({
  pcsQuoteSeparately,
  setPcsQuoteSeparately,
  inverterType,
  setInverterType,
  numberOfInvertersInput,
  setNumberOfInvertersInput,
  inverterRating,
  setInverterRating,
  inverterManufacturer,
  setInverterManufacturer,
  systemWattsInput,
  setSystemWattsInput,
  systemAmpsACInput,
  setSystemAmpsACInput,
  systemAmpsDCInput,
  setSystemAmpsDCInput,
  systemVoltage,
  setSystemVoltage,
  dcVoltage,
  setDcVoltage,
  storageSizeMW,
  totalKW,
  calculatedWatts,
  calculatedAmpsAC,
  calculatedAmpsDC,
  numberOfInverters,
  maxAmpsAC,
  maxAmpsDC,
}: ElectricalSpecsSectionProps) {
  return (
    <div
      data-section="electrical"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "rgba(16,185,129,0.1)" }}>
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          Electrical Specifications
          <span className="text-xs font-normal ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
            PCS, Inverters, Transformers
          </span>
        </h3>
        <MerlinTip
          tip="Most projects use a pre-engineered containerized BESS solution that includes the PCS, BMS, and thermal management. Transformer specs should match your utility interconnection requirements."
          context="IEEE 1547-2018 interconnection standard"
        />
      </div>

      <div className="p-6">
        {/* Power Conversion System (PCS) Configuration */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h4 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Power Conversion System (PCS)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PCS Quoting Option — ghost button cards */}
            <div className="col-span-full">
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                PCS Quoting Method
              </label>
              <p className="text-[11px] mb-3" style={{ color: "rgba(52,211,153,0.6)" }}>
                Default · Included with BESS system (most common for containerized installs)
              </p>
              <div className="flex gap-3">
                {(
                  [
                    { val: false, label: "Included with BESS", sub: "All-in-one system price" },
                    { val: true, label: "Quote PCS Separately", sub: "Itemized line item" },
                  ] as const
                ).map(({ val, label, sub }) => {
                  const active = pcsQuoteSeparately === val;
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setPcsQuoteSeparately(val)}
                      className="flex-1 flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: "transparent",
                        border: `${active ? "1.5px" : "1px"} solid ${active ? "rgba(52,211,153,0.70)" : "rgba(255,255,255,0.13)"}`,
                        boxShadow: active ? "0 0 10px rgba(52,211,153,0.12)" : "none",
                      }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{ color: active ? "#6ee7b7" : "rgba(255,255,255,0.7)" }}
                      >
                        {label}
                      </span>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.32)" }}>
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>
              {pcsQuoteSeparately && (
                <p
                  className="text-sm mt-3 rounded-lg p-3"
                  style={{
                    color: "rgba(52,211,153,0.85)",
                    background: "rgba(52,211,153,0.05)",
                    border: "1px solid rgba(52,211,153,0.15)",
                  }}
                >
                  💡 PCS will be itemized separately in the quote with detailed specifications
                </p>
              )}
            </div>

            {/* Inverter Type */}
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Inverter Type
              </label>
              <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
                Default · Bidirectional (charge + discharge)
              </p>
              <select
                value={inverterType}
                onChange={(e) => setInverterType(e.target.value)}
                className="w-full px-4 py-2.5 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500/60 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              >
                <option value="bidirectional" style={{ background: "#0f1117" }}>
                  Bidirectional
                </option>
                <option value="unidirectional" style={{ background: "#0f1117" }}>
                  Unidirectional (Charge Only)
                </option>
              </select>
            </div>

            {/* Number of Inverters */}
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Number of Inverters
              </label>
              <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
                Default · {Math.ceil(totalKW / inverterRating)} units @ {inverterRating} kW each
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={numberOfInvertersInput}
                  onChange={(e) => setNumberOfInvertersInput(parseInt(e.target.value) || 1)}
                  min="1"
                  placeholder="Auto"
                  className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold focus:ring-1 focus:ring-emerald-500/60 focus:outline-none transition-all"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
                />
                <button
                  onClick={() => setNumberOfInvertersInput(Math.ceil(totalKW / inverterRating))}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-150"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(52,211,153,0.45)",
                    color: "#6ee7b7",
                    boxShadow: "0 0 8px rgba(52,211,153,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(52,211,153,0.07)";
                    e.currentTarget.style.boxShadow = "0 0 14px rgba(52,211,153,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.boxShadow = "0 0 8px rgba(52,211,153,0.12)";
                  }}
                  title="Auto-calculate based on system size"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Inverter Rating */}
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Inverter Rating (kW per unit)
              </label>
              <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
                Default · 2,500 kW (utility-scale BESS standard)
              </p>
              <input
                type="number"
                value={inverterRating}
                onChange={(e) => setInverterRating(parseFloat(e.target.value) || 2500)}
                step="100"
                min="100"
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm font-semibold focus:ring-1 focus:ring-blue-500/40 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Inverter Manufacturer{" "}
                <span style={{ color: "rgba(255,255,255,0.3)" }}>(optional)</span>
              </label>
              <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>
                Leave blank to use manufacturer-agnostic pricing
              </p>
              <input
                type="text"
                value={inverterManufacturer}
                onChange={(e) => setInverterManufacturer(e.target.value)}
                placeholder="e.g., SMA, Sungrow, Power Electronics"
                className="w-full px-4 py-2.5 rounded-lg text-white text-sm placeholder-white/20 focus:ring-1 focus:ring-blue-500/40 focus:outline-none transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
            </div>
          </div>
        </div>

        {/* Electrical Parameters - override inputs */}
        <p className="text-[11px] mb-3" style={{ color: "rgba(52,211,153,0.6)" }}>
          ℹ️&nbsp;Values below are{" "}
          <strong style={{ color: "rgba(255,255,255,0.55)" }}>auto-calculated</strong> from your
          system size. Override only if you have specific requirements.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* System Watts */}
          <div
            className="rounded-xl p-4"
            style={{ background: "transparent", border: "1px solid rgba(59,130,246,0.22)" }}
          >
            <label
              className="block text-xs mb-1 font-semibold"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              System Power (Watts)
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(96,165,250,0.7)" }}>
              Calculated · {calculatedWatts.toLocaleString()} W → {totalKW.toLocaleString()} kW
            </p>
            <input
              type="number"
              value={systemWattsInput}
              onChange={(e) =>
                setSystemWattsInput(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder={calculatedWatts.toLocaleString()}
              className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-1 focus:ring-blue-500/40 focus:outline-none"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.11)" }}
            />
          </div>

          {/* AC Amps */}
          <div
            className="rounded-xl p-4"
            style={{ background: "transparent", border: "1px solid rgba(99,102,241,0.22)" }}
          >
            <label
              className="block text-xs mb-1 font-semibold"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              AC Current (3-Phase)
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(129,140,248,0.7)" }}>
              Calculated · {calculatedAmpsAC.toFixed(0)} A @ {systemVoltage}V AC
            </p>
            <input
              type="number"
              value={systemAmpsACInput}
              onChange={(e) =>
                setSystemAmpsACInput(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder={calculatedAmpsAC.toFixed(0)}
              className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-1 focus:ring-indigo-500/40 focus:outline-none"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.11)" }}
            />
          </div>

          {/* DC Amps */}
          <div
            className="rounded-xl p-4"
            style={{ background: "transparent", border: "1px solid rgba(59,130,246,0.22)" }}
          >
            <label
              className="block text-xs mb-1 font-semibold"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              DC Current (Battery Side)
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(96,165,250,0.7)" }}>
              Calculated · {calculatedAmpsDC.toFixed(0)} A @ {dcVoltage}V DC
            </p>
            <input
              type="number"
              value={systemAmpsDCInput}
              onChange={(e) =>
                setSystemAmpsDCInput(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder={calculatedAmpsDC.toFixed(0)}
              className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-1 focus:ring-blue-500/40 focus:outline-none"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.11)" }}
            />
          </div>
        </div>

        {/* Voltage Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            className="rounded-lg p-4"
            style={{ background: "transparent", border: "1px solid rgba(99,102,241,0.18)" }}
          >
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              AC System Voltage
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(129,140,248,0.65)" }}>
              Default · 480V standard industrial
            </p>
            <select
              value={systemVoltage}
              onChange={(e) => setSystemVoltage(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-lg text-white font-medium text-sm focus:ring-1 focus:ring-indigo-500/40 focus:outline-none transition-all"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
            >
              <option value={208} style={{ background: "#0f1117" }}>
                208V — Small Commercial
              </option>
              <option value={480} style={{ background: "#0f1117" }}>
                480V — Standard Industrial
              </option>
              <option value={600} style={{ background: "#0f1117" }}>
                600V — Large Industrial
              </option>
              <option value={4160} style={{ background: "#0f1117" }}>
                4.16 kV — Medium Voltage
              </option>
              <option value={13800} style={{ background: "#0f1117" }}>
                13.8 kV — Utility Scale
              </option>
            </select>
          </div>

          <div
            className="rounded-lg p-4"
            style={{ background: "transparent", border: "1px solid rgba(59,130,246,0.18)" }}
          >
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              DC Battery Voltage
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(96,165,250,0.65)" }}>
              Default · 1,000V DC — typical range 800–1,500V
            </p>
            <input
              type="number"
              value={dcVoltage}
              onChange={(e) => setDcVoltage(parseInt(e.target.value) || 1000)}
              step="100"
              min="100"
              className="w-full px-4 py-2.5 rounded-lg text-white font-medium text-sm focus:ring-1 focus:ring-blue-500/40 focus:outline-none transition-all"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
            />
          </div>
        </div>

        {/* Summary Card */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            System Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                Total Power:
              </p>
              <p className="text-xl font-bold text-white">{(totalKW / 1000).toFixed(2)} MW</p>
            </div>
            <div>
              <p className="mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                Inverters:
              </p>
              <p className="text-xl font-bold text-white">{numberOfInverters} units</p>
            </div>
            <div>
              <p className="mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                AC Current:
              </p>
              <p className="text-xl font-bold text-indigo-400">
                {maxAmpsAC.toLocaleString(undefined, { maximumFractionDigits: 0 })} A
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                DC Current:
              </p>
              <p className="text-xl font-bold text-blue-400">
                {maxAmpsDC.toLocaleString(undefined, { maximumFractionDigits: 0 })} A
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                PCS Configuration:
              </span>
              <span className="text-sm font-bold text-white">
                {inverterType === "bidirectional" ? "⚡ Bidirectional" : "→ Unidirectional"} |
                {pcsQuoteSeparately ? " Quoted Separately" : " Included in System"}
              </span>
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-lg p-4"
          style={{ background: "transparent", border: "1px solid rgba(52,211,153,0.13)" }}
        >
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            ⚡ <strong className="text-white">Note:</strong> Input custom values to override
            calculated specifications. Leave blank to use auto-calculated values based on{" "}
            {storageSizeMW} MW system rating.
            {pcsQuoteSeparately &&
              " PCS will be itemized with detailed manufacturer specifications."}
          </p>
        </div>
      </div>
    </div>
  );
}
