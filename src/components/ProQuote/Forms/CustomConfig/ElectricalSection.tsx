/**
 * ElectricalSection - Electrical specifications and PCS configuration
 * Power conversion system, voltages, currents, inverters
 * Part of Custom Config view
 */

import React from "react";
import { Zap, Cpu } from "lucide-react";
import { SectionHeader } from "../../Shared/SectionHeader";
import { MerlinTip } from "../../Shared/MerlinTip";

interface ElectricalSectionProps {
  storageSizeMW: number;
  // PCS Configuration
  pcsQuoteSeparately: boolean;
  setPcsQuoteSeparately: (value: boolean) => void;
  inverterType: string;
  setInverterType: (value: string) => void;
  numberOfInvertersInput: number;
  setNumberOfInvertersInput: (value: number) => void;
  inverterRating: number;
  setInverterRating: (value: number) => void;
  inverterManufacturer: string;
  setInverterManufacturer: (value: string) => void;
  // Electrical Parameters
  systemWattsInput: string | number;
  setSystemWattsInput: (value: string | number) => void;
  systemAmpsACInput: string | number;
  setSystemAmpsACInput: (value: string | number) => void;
  systemAmpsDCInput: string | number;
  setSystemAmpsDCInput: (value: string | number) => void;
  systemVoltage: number;
  setSystemVoltage: (value: number) => void;
  dcVoltage: number;
  setDcVoltage: (value: number) => void;
  // Calculated values
  totalKW: number;
  numberOfInverters: number;
  calculatedWatts: number;
  calculatedAmpsAC: number;
  calculatedAmpsDC: number;
  maxAmpsAC: number;
  maxAmpsDC: number;
}

export const ElectricalSection = React.memo(function ElectricalSection({
  storageSizeMW,
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
  totalKW,
  numberOfInverters,
  calculatedWatts,
  calculatedAmpsAC,
  calculatedAmpsDC,
  maxAmpsAC,
  maxAmpsDC,
}: ElectricalSectionProps) {
  return (
    <div
      data-section="electrical"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <SectionHeader
        icon={Zap}
        iconColor="#34d399"
        iconBgColor="rgba(16,185,129,0.1)"
        title="Electrical Specifications"
        subtitle="PCS, Inverters, Transformers"
      >
        <MerlinTip
          tip="Most projects use a pre-engineered containerized BESS solution that includes the PCS, BMS, and thermal management. Transformer specs should match your utility interconnection requirements."
          context="IEEE 1547-2018 interconnection standard"
        />
      </SectionHeader>

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
            {/* PCS Quoting Option */}
            <div className="col-span-full">
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                PCS Quoting Method
              </label>
              <div className="flex gap-4">
                <label
                  className="flex items-center gap-3 cursor-pointer rounded-xl px-5 py-4 transition-all flex-1"
                  style={{
                    background: !pcsQuoteSeparately
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: !pcsQuoteSeparately
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <input
                    type="radio"
                    checked={!pcsQuoteSeparately}
                    onChange={() => setPcsQuoteSeparately(false)}
                    className="w-5 h-5 text-emerald-500"
                  />
                  <span className="text-sm font-semibold text-white">
                    Included with BESS System
                  </span>
                </label>
                <label
                  className="flex items-center gap-3 cursor-pointer rounded-xl px-5 py-4 transition-all flex-1"
                  style={{
                    background: pcsQuoteSeparately
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(255,255,255,0.03)",
                    border: pcsQuoteSeparately
                      ? "1px solid rgba(16,185,129,0.3)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <input
                    type="radio"
                    checked={pcsQuoteSeparately}
                    onChange={() => setPcsQuoteSeparately(true)}
                    className="w-5 h-5 text-emerald-500"
                  />
                  <span className="text-sm font-semibold text-white">Quote PCS Separately</span>
                </label>
              </div>
              {pcsQuoteSeparately && (
                <p
                  className="text-sm mt-3 rounded-lg p-3"
                  style={{
                    color: "rgba(16,185,129,0.9)",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.15)",
                  }}
                >
                  💡 PCS will be itemized separately in the quote with detailed specifications
                </p>
              )}
            </div>

            {/* Inverter Type */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Inverter Type
              </label>
              <select
                value={inverterType}
                onChange={(e) => setInverterType(e.target.value)}
                className="w-full px-4 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <option value="bidirectional">Bidirectional Inverter</option>
                <option value="unidirectional">Unidirectional (Charge Only)</option>
              </select>
              <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                {inverterType === "bidirectional"
                  ? "⚡ Supports charge & discharge"
                  : "⚡ Charge only (typical for solar)"}
              </p>
            </div>

            {/* Number of Inverters */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Number of Inverters
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={numberOfInvertersInput}
                  onChange={(e) => setNumberOfInvertersInput(parseInt(e.target.value) || 1)}
                  min="1"
                  className="flex-1 px-4 py-3 text-white rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  placeholder="Auto-calculated"
                />
                <button
                  onClick={() => setNumberOfInvertersInput(Math.ceil(totalKW / inverterRating))}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-700 rounded-lg text-sm font-bold text-white transition-all shadow-sm"
                  title="Auto-calculate based on system size"
                >
                  Auto
                </button>
              </div>
              <p className="text-sm mt-2 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                Suggested: {Math.ceil(totalKW / inverterRating)} units @ {inverterRating} kW each
              </p>
            </div>

            {/* Inverter Rating */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Inverter Rating (kW per unit)
              </label>
              <input
                type="number"
                value={inverterRating}
                onChange={(e) => setInverterRating(parseFloat(e.target.value) || 2500)}
                step="100"
                min="100"
                className="w-full px-4 py-3 rounded-lg text-white text-base font-semibold focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Inverter Manufacturer (Optional)
              </label>
              <input
                type="text"
                value={inverterManufacturer}
                onChange={(e) => setInverterManufacturer(e.target.value)}
                placeholder="e.g., SMA, Sungrow, Power Electronics"
                className="w-full px-4 py-3 rounded-lg text-white text-base placeholder-white/30 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Electrical Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* System Watts */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <label
              className="block text-xs mb-2 font-semibold"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              System Power (Watts)
            </label>
            <input
              type="number"
              value={systemWattsInput}
              onChange={(e) =>
                setSystemWattsInput(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder={calculatedWatts.toLocaleString()}
              className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <p className="text-xs text-emerald-400 mt-2 font-bold">
              {totalKW.toLocaleString()} kW / {(totalKW / 1000).toFixed(2)} MW
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Calculated: {calculatedWatts.toLocaleString()} W
            </p>
          </div>

          {/* AC Amps */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <label
              className="block text-xs mb-2 font-semibold"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              AC Current (3-Phase)
            </label>
            <input
              type="number"
              value={systemAmpsACInput}
              onChange={(e) =>
                setSystemAmpsACInput(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder={calculatedAmpsAC.toFixed(0)}
              className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <p className="text-xs text-indigo-400 mt-2 font-bold">
              @ {systemVoltage}V AC Per Phase
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Calculated: {calculatedAmpsAC.toFixed(0)} A
            </p>
          </div>

          {/* DC Amps */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
            }}
          >
            <label
              className="block text-xs mb-2 font-semibold"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              DC Current (Battery Side)
            </label>
            <input
              type="number"
              value={systemAmpsDCInput}
              onChange={(e) =>
                setSystemAmpsDCInput(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder={calculatedAmpsDC.toFixed(0)}
              className="w-full px-3 py-2 rounded-lg text-white font-medium text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <p className="text-xs text-blue-400 mt-2 font-bold">@ {dcVoltage}V DC</p>
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Calculated: {calculatedAmpsDC.toFixed(0)} A
            </p>
          </div>
        </div>

        {/* Voltage Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
          >
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              AC System Voltage (V)
            </label>
            <select
              value={systemVoltage}
              onChange={(e) => setSystemVoltage(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-indigo-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value={208}>208V (Small Commercial)</option>
              <option value={480}>480V (Standard Industrial)</option>
              <option value={600}>600V (Large Industrial)</option>
              <option value={4160}>4.16 kV (Medium Voltage)</option>
              <option value={13800}>13.8 kV (Utility Scale)</option>
            </select>
          </div>

          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
            }}
          >
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              DC Battery Voltage (V)
            </label>
            <input
              type="number"
              value={dcVoltage}
              onChange={(e) => setDcVoltage(parseInt(e.target.value) || 1000)}
              step="100"
              min="100"
              className="w-full px-4 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
            <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Typical: 800V - 1500V DC
            </p>
          </div>
        </div>

        {/* System Summary */}
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

        {/* Note */}
        <div
          className="mt-4 rounded-lg p-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
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
});
