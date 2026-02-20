/**
 * PRO TEASER PANELS — Blurred previews of advanced analytics
 *
 * Shows Monte Carlo, 10-Year Cash Flow, and Bank-Ready Model as
 * blurred teasers with "Unlock with Pro" CTAs.
 * Only shown for guests / free-tier users to drive upgrades.
 *
 * Extracted from Step6ResultsV7.tsx (Feb 2026 — bloat decomposition)
 */

import React from "react";
import { Lock, BarChart3, LineChart, FileText } from "lucide-react";

export default function ProTeaserPanels() {
  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-amber-400/70" />
        <span className="text-sm font-semibold text-white/60 tracking-wide uppercase">
          Advanced Analytics — Pro & Above
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monte Carlo Risk Analysis */}
        <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="select-none pointer-events-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-bold text-white/80">Monte Carlo Risk</span>
            </div>
            <div className="space-y-2 blur-[6px]">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">P10 (conservative)</span>
                <span className="text-red-400 font-mono">$1.2M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">P50 (expected)</span>
                <span className="text-emerald-400 font-mono">$2.4M</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">P90 (optimistic)</span>
                <span className="text-emerald-400 font-mono">$3.1M</span>
              </div>
              <div className="h-16 mt-2 bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-emerald-500/5 rounded-lg" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/90 via-transparent to-transparent flex items-end justify-center pb-4">
            <a
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all no-underline"
            >
              <Lock className="w-3 h-3" />
              Unlock with Pro
            </a>
          </div>
        </div>

        {/* 10-Year Cash Flow Projection */}
        <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="select-none pointer-events-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <LineChart className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm font-bold text-white/80">10-Year Cash Flow</span>
            </div>
            <div className="space-y-2 blur-[6px]">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Yr 1 net cash flow</span>
                <span className="text-emerald-400 font-mono">$86,400</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Cumulative yr 5</span>
                <span className="text-emerald-400 font-mono">$432,000</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Cumulative yr 10</span>
                <span className="text-emerald-400 font-mono">$864,000</span>
              </div>
              <div className="h-16 mt-2 bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-emerald-500/10 rounded-lg" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/90 via-transparent to-transparent flex items-end justify-center pb-4">
            <a
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all no-underline"
            >
              <Lock className="w-3 h-3" />
              Unlock with Pro
            </a>
          </div>
        </div>

        {/* Bank-Ready Financial Model */}
        <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="select-none pointer-events-none">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-bold text-white/80">Bank-Ready Model</span>
            </div>
            <div className="space-y-2 blur-[6px]">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Levered IRR</span>
                <span className="text-emerald-400 font-mono">14.2%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">DSCR (min)</span>
                <span className="text-emerald-400 font-mono">1.35x</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">MACRS benefit</span>
                <span className="text-emerald-400 font-mono">$285,000</span>
              </div>
              <div className="h-16 mt-2 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-indigo-500/10 rounded-lg" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117]/90 via-transparent to-transparent flex items-end justify-center pb-4">
            <a
              href="/pricing"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all no-underline"
            >
              <Lock className="w-3 h-3" />
              Unlock with Pro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
