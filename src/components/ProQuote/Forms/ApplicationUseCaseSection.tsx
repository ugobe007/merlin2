/**
 * Application & Use Case Section
 * Phase 1G Part 2c Operation 3 (Feb 2026)
 *
 * Application type and use case configuration
 * Extracted from AdvancedQuoteBuilder.tsx (~126 lines)
 *
 * Features:
 * - Application type selector (Residential, C&I, Utility, Microgrid)
 * - Primary use case selector (Peak Shaving, Arbitrage, Backup, etc.)
 * - Project name input with placeholder
 * - Location input (City, State)
 */

import {
  Building2,
  Home,
  Zap,
  RefreshCw,
  TrendingDown,
  Clock,
  ShieldCheck,
  Sun,
  Activity,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const APP_TYPE_OPTIONS: { value: string; icon: LucideIcon; label: string; sub: string }[] = [
  { value: "residential", icon: Home, label: "Residential", sub: "Home / Small site" },
  { value: "commercial", icon: Building2, label: "C&I", sub: "Commercial & Industrial" },
  { value: "utility", icon: Zap, label: "Utility Scale", sub: "Grid-connected" },
  { value: "microgrid", icon: RefreshCw, label: "Microgrid", sub: "Island-capable" },
];

const USE_CASE_OPTIONS: { value: string; icon: LucideIcon; label: string; sub: string }[] = [
  { value: "peak-shaving", icon: TrendingDown, label: "Peak Shaving", sub: "Demand reduction" },
  { value: "arbitrage", icon: Clock, label: "TOU Arbitrage", sub: "Buy low, use high" },
  { value: "backup", icon: ShieldCheck, label: "Backup Power", sub: "Critical load" },
  { value: "solar-shifting", icon: Sun, label: "Solar + Storage", sub: "Self-consumption" },
  { value: "frequency-regulation", icon: Activity, label: "Frequency Reg", sub: "Grid services" },
  { value: "renewable-smoothing", icon: Wind, label: "Renew. Smoothing", sub: "Stabilize output" },
];

export interface ApplicationUseCaseSectionProps {
  applicationType: string;
  useCase: string;
  projectName: string;
  location: string;
  setApplicationType: (value: string) => void;
  setUseCase: (value: string) => void;
  setProjectName: (value: string) => void;
  setLocation: (value: string) => void;
}

export default function ApplicationUseCaseSection({
  applicationType,
  useCase,
  projectName,
  location,
  setApplicationType,
  setUseCase,
  setProjectName,
  setLocation,
}: ApplicationUseCaseSectionProps) {
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
      data-section="application"
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
          <div className="p-2 rounded-lg" style={{ background: "rgba(34,197,94,0.1)" }}>
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          Application & Use Case
          <span className="text-xs font-normal ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
            How you'll use the system
          </span>
        </h3>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Application Type */}
          <div>
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Application Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {APP_TYPE_OPTIONS.map(({ value, icon: Icon, label, sub }) => {
                const active = applicationType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setApplicationType(value);
                      scrollNext("app-usecase");
                    }}
                    className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: "transparent",
                      border: `${active ? "1.5px" : "1px"} solid ${active ? "rgba(74,222,128,0.85)" : "rgba(255,255,255,0.13)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: active ? "#4ade80" : "rgba(255,255,255,0.4)" }}
                      />
                      <span
                        className="text-sm font-bold"
                        style={{ color: active ? "#86efac" : "rgba(255,255,255,0.75)" }}
                      >
                        {label}
                      </span>
                      {active && (
                        <span className="ml-auto text-[10px] font-bold text-green-400">✓</span>
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

          {/* Primary Use Case */}
          <div id="app-usecase" className="scroll-mt-24">
            <label
              className="block text-sm font-semibold mb-3"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Primary Use Case
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {USE_CASE_OPTIONS.map(({ value, icon: Icon, label, sub }) => {
                const active = useCase === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setUseCase(value);
                      scrollNext('[data-section="financial"]');
                    }}
                    className="flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: "transparent",
                      border: `${active ? "1.5px" : "1px"} solid ${active ? "rgba(129,140,248,0.85)" : "rgba(255,255,255,0.13)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: active ? "#818cf8" : "rgba(255,255,255,0.4)" }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: active ? "#a5b4fc" : "rgba(255,255,255,0.7)" }}
                      >
                        {label}
                      </span>
                      {active && (
                        <span className="ml-auto text-[10px] font-bold text-indigo-400">✓</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Project Name
              </label>
              <p className="text-[11px] mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>
                Used on quotes, exports, and saved proposals
              </p>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Downtown Hotel BESS"
                className="w-full px-4 py-2.5 text-white rounded-xl focus:ring-1 focus:ring-emerald-500/60 focus:outline-none placeholder-white/20 transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Location
              </label>
              <p className="text-[11px] mb-2" style={{ color: "rgba(52,211,153,0.6)" }}>
                Affects utility rates, solar potential &amp; incentives
              </p>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                className="w-full px-4 py-2.5 text-white rounded-xl focus:ring-1 focus:ring-emerald-500/60 focus:outline-none placeholder-white/20 transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.13)" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
