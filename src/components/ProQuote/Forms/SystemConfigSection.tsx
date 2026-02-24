/**
 * System Configuration Section
 * Phase 1G Part 2c Operation 2 (Feb 2026)
 *
 * Core BESS parameters configuration form
 * Extracted from AdvancedQuoteBuilder.tsx (~263 lines)
 *
 * Features:
 * - Power capacity slider (0.1-10 MW) with numeric input
 * - Duration slider (0.5-12 hrs) with numeric input
 * - Battery chemistry selector (LFP, NMC, LTO, Sodium-Ion)
 * - Installation type selector (Outdoor, Indoor, Rooftop)
 * - Grid connection selector (AC/DC/Hybrid/Off-grid)
 * - Inverter efficiency input (85-99%)
 * - MerlinTip with intelligent sizing guidance
 */

import {
  Battery,
  Zap,
  Shield,
  Leaf,
  Package,
  Lock,
  Layers,
  Globe,
  Sun,
  Shuffle,
  WifiOff,
} from "lucide-react";
import { MerlinTip } from "@/components/ProQuote/Shared/MerlinTip";
import type { LucideIcon } from "lucide-react";

const CHEMISTRY_OPTIONS: { value: string; icon: LucideIcon; label: string; sub: string }[] = [
  { value: "lfp", icon: Battery, label: "LFP", sub: "4,000+ cycles · Safest" },
  { value: "nmc", icon: Zap, label: "NMC", sub: "High energy density" },
  { value: "lto", icon: Shield, label: "LTO", sub: "20,000+ cycles · Premium" },
  { value: "sodium-ion", icon: Leaf, label: "Na-Ion", sub: "Lowest cost · Emerging" },
];

const INSTALL_OPTIONS: { value: string; icon: LucideIcon; label: string; sub: string }[] = [
  { value: "outdoor", icon: Package, label: "Outdoor", sub: "Containerized" },
  { value: "indoor", icon: Lock, label: "Indoor", sub: "Room / Vault" },
  { value: "rooftop", icon: Layers, label: "Rooftop", sub: "Space-saving" },
];

const GRID_OPTIONS: { value: string; icon: LucideIcon; label: string; sub: string }[] = [
  { value: "ac-coupled", icon: Globe, label: "AC-Coupled", sub: "Grid-tied" },
  { value: "dc-coupled", icon: Sun, label: "DC-Coupled", sub: "Solar integration" },
  { value: "hybrid", icon: Shuffle, label: "Hybrid", sub: "AC + DC" },
  { value: "off-grid", icon: WifiOff, label: "Off-Grid", sub: "Island mode" },
];

export interface SystemConfigSectionProps {
  storageSizeMW: number;
  durationHours: number;
  storageSizeMWh: number;
  chemistry: string;
  installationType: string;
  gridConnection: string;
  inverterEfficiency: number;
  onStorageSizeChange: (value: number) => void;
  onDurationChange: (value: number) => void;
  setChemistry: (value: string) => void;
  setInstallationType: (value: string) => void;
  setGridConnection: (value: string) => void;
  setInverterEfficiency: (value: number) => void;
}

export default function SystemConfigSection({
  storageSizeMW,
  durationHours,
  storageSizeMWh,
  chemistry,
  installationType,
  gridConnection,
  inverterEfficiency,
  onStorageSizeChange,
  onDurationChange,
  setChemistry,
  setInstallationType,
  setGridConnection,
  setInverterEfficiency,
}: SystemConfigSectionProps) {
  const scrollNext = (sel: string, delay = 420) =>
    setTimeout(
      () =>
        (sel.startsWith("[")
          ? document.querySelector(sel)
          : document.getElementById(sel)
        )?.scrollIntoView({ behavior: "smooth", block: "start" }),
      delay
    );

  return (
    <div
      data-section="system"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Section Header */}
      <div
        className="px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.1)" }}>
            <Battery className="w-5 h-5 text-blue-400" />
          </div>
          System Configuration
          <span className="text-xs font-normal ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
            Core BESS Parameters
          </span>
        </h3>
        <MerlinTip
          tip={
            storageSizeMW < 0.5
              ? "Start with your peak demand. Most commercial sites need 500 kW – 2 MW of BESS power with 2-4 hour duration."
              : `${(storageSizeMW * 1000).toFixed(0)} kW / ${durationHours}h = ${storageSizeMWh.toFixed(1)} MWh is a solid configuration. Adjust duration for more energy shifting or backup runtime.`
          }
          context="Based on NREL ATB 2024 commercial BESS sizing benchmarks"
        />
      </div>

      {/* Section Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Power Capacity - Full Width Slider */}
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                Power Capacity
              </label>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
              >
                {(storageSizeMW * 1000).toFixed(0)} kW
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={storageSizeMW}
                onChange={(e) => onStorageSizeChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 ${((storageSizeMW - 0.1) / 9.9) * 100}%, rgba(255,255,255,0.08) ${((storageSizeMW - 0.1) / 9.9) * 100}%)`,
                }}
              />
              <div className="relative">
                <input
                  type="number"
                  value={storageSizeMW}
                  onChange={(e) => onStorageSizeChange(parseFloat(e.target.value) || 0.1)}
                  step="0.1"
                  min="0.1"
                  max="50"
                  className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  MW
                </span>
              </div>
            </div>
          </div>

          {/* Duration - Full Width Slider */}
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                Duration
              </label>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
              >
                {(storageSizeMW * durationHours).toFixed(1)} MWh total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.5"
                value={durationHours}
                onChange={(e) => onDurationChange(parseFloat(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                style={{
                  background: `linear-gradient(to right, #6366f1 ${((durationHours - 0.5) / 11.5) * 100}%, rgba(255,255,255,0.08) ${((durationHours - 0.5) / 11.5) * 100}%)`,
                }}
              />
              <div className="relative">
                <input
                  type="number"
                  value={durationHours}
                  onChange={(e) => onDurationChange(parseFloat(e.target.value) || 0.5)}
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="w-28 pl-3 pr-10 py-2.5 text-white rounded-lg text-right font-bold text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  hrs
                </span>
              </div>
            </div>
          </div>

          {/* Battery Chemistry */}
          <div className="lg:col-span-2">
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Battery Chemistry
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHEMISTRY_OPTIONS.map(({ value, icon: Icon, label, sub }) => {
                const active = chemistry === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setChemistry(value);
                      scrollNext("sys-install");
                    }}
                    className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: "transparent",
                      border: `${active ? "1.5px" : "1px"} solid ${active ? "rgba(96,165,250,0.85)" : "rgba(255,255,255,0.13)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: active ? "#60a5fa" : "rgba(255,255,255,0.4)" }}
                      />
                      <span
                        className="text-sm font-bold"
                        style={{ color: active ? "#93c5fd" : "rgba(255,255,255,0.75)" }}
                      >
                        {label}
                      </span>
                      {active && (
                        <span className="ml-auto text-[10px] font-bold text-blue-400">✓</span>
                      )}
                    </div>
                    <span
                      className="text-[11px] leading-tight pl-6"
                      style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Installation Type */}
          <div id="sys-install" className="scroll-mt-24">
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Installation Type
            </label>
            <div className="flex flex-col gap-2">
              {INSTALL_OPTIONS.map(({ value, icon: Icon, label, sub }) => {
                const active = installationType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setInstallationType(value);
                      scrollNext("sys-grid");
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: "transparent",
                      border: `${active ? "1.5px" : "1px"} solid ${active ? "rgba(129,140,248,0.85)" : "rgba(255,255,255,0.13)"}`,
                    }}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: active ? "#a5b4fc" : "rgba(255,255,255,0.35)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: active ? "#c7d2fe" : "rgba(255,255,255,0.7)" }}
                      >
                        {label}
                      </span>
                      <span className="ml-2 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {sub}
                      </span>
                    </div>
                    {active && (
                      <span className="text-[10px] font-bold text-indigo-400 shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Connection */}
          <div id="sys-grid" className="scroll-mt-24">
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Grid Connection
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GRID_OPTIONS.map(({ value, icon: Icon, label, sub }) => {
                const active = gridConnection === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setGridConnection(value);
                      scrollNext('[data-section="application"]');
                    }}
                    className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: "transparent",
                      border: `${active ? "1.5px" : "1px"} solid ${active ? "rgba(52,211,153,0.85)" : "rgba(255,255,255,0.13)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: active ? "#34d399" : "rgba(255,255,255,0.4)" }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: active ? "#6ee7b7" : "rgba(255,255,255,0.7)" }}
                      >
                        {label}
                      </span>
                      {active && (
                        <span className="ml-auto text-[10px] font-bold text-emerald-400">✓</span>
                      )}
                    </div>
                    <span
                      className="text-[11px] leading-tight pl-6"
                      style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                      {sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inverter Efficiency */}
          <div>
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Inverter Efficiency (%)
            </label>
            <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
              Default · 96% — industry standard (range 94–98.5%)
            </p>
            <input
              type="number"
              value={inverterEfficiency}
              onChange={(e) => setInverterEfficiency(parseFloat(e.target.value) || 90)}
              min="85"
              max="99"
              step="0.5"
              className="w-full px-4 py-2.5 text-white rounded-xl focus:ring-1 focus:ring-blue-500/40 focus:outline-none transition-all"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
