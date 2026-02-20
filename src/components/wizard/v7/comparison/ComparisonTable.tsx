/**
 * COMPARISON TABLE
 * Side-by-side comparison of multiple scenarios
 */

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getScenarioComparison } from "./comparisonService";
import type { ComparisonMetrics } from "./types";

interface ComparisonTableProps {
  scenarioIds: string[];
}

export function ComparisonTable({ scenarioIds }: ComparisonTableProps) {
  const [metrics, setMetrics] = useState<ComparisonMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComparison();
  }, [scenarioIds]);

  const loadComparison = async () => {
    setIsLoading(true);
    const data = await getScenarioComparison(scenarioIds);
    setMetrics(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Loading comparison...</div>;
  }

  if (metrics.length === 0) {
    return <div className="text-center py-8 text-slate-500">No data available</div>;
  }

  // Find best values for highlighting
  const bestCost = Math.min(...metrics.map((m) => m.totalCost));
  const bestSavings = Math.max(...metrics.map((m) => m.annualSavings));
  const bestPayback = Math.min(...metrics.map((m) => m.paybackYears));
  const bestCostPerKwh = Math.min(...metrics.map((m) => m.costPerKwh));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-slate-400 font-medium">Metric</th>
            {metrics.map((m, idx) => (
              <th key={m.id} className="text-right py-3 px-4 text-white font-bold">
                <div className="flex flex-col items-end">
                  <span className="truncate max-w-[150px]">{m.name}</span>
                  {idx === 0 && (
                    <span className="text-xs text-[#3ECF8E] font-normal">Baseline</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Peak kW */}
          <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Peak Load (kW)</td>
            {metrics.map((m) => (
              <td key={m.id} className="py-3 px-4 text-right text-white font-medium">
                {m.peakKw.toFixed(0)}
              </td>
            ))}
          </tr>

          {/* kWh Capacity */}
          <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Storage Capacity (kWh)</td>
            {metrics.map((m) => (
              <td key={m.id} className="py-3 px-4 text-right text-white font-medium">
                {m.kwhCapacity.toFixed(0)}
              </td>
            ))}
          </tr>

          {/* Total Cost */}
          <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Total Project Cost</td>
            {metrics.map((m) => (
              <td
                key={m.id}
                className={`py-3 px-4 text-right font-bold ${
                  m.totalCost === bestCost ? "text-[#3ECF8E]" : "text-white"
                }`}
              >
                ${m.totalCost.toLocaleString()}
              </td>
            ))}
          </tr>

          {/* Annual Savings */}
          <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Annual Savings</td>
            {metrics.map((m) => (
              <td
                key={m.id}
                className={`py-3 px-4 text-right font-bold ${
                  m.annualSavings === bestSavings ? "text-[#3ECF8E]" : "text-white"
                }`}
              >
                ${m.annualSavings.toLocaleString()}
              </td>
            ))}
          </tr>

          {/* Payback Years */}
          <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Payback Period</td>
            {metrics.map((m) => (
              <td
                key={m.id}
                className={`py-3 px-4 text-right font-bold ${
                  m.paybackYears === bestPayback ? "text-[#3ECF8E]" : "text-white"
                }`}
              >
                {m.paybackYears.toFixed(1)} years
              </td>
            ))}
          </tr>

          {/* Cost per kWh */}
          <tr className="border-b border-white/5 hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Cost per kWh</td>
            {metrics.map((m) => (
              <td
                key={m.id}
                className={`py-3 px-4 text-right font-bold ${
                  m.costPerKwh === bestCostPerKwh ? "text-[#3ECF8E]" : "text-white"
                }`}
              >
                ${m.costPerKwh.toFixed(0)}
              </td>
            ))}
          </tr>

          {/* Savings Delta % */}
          <tr className="hover:bg-white/5">
            <td className="py-3 px-4 text-slate-300">Δ vs Baseline</td>
            {metrics.map((m, idx) => {
              if (idx === 0) {
                return (
                  <td key={m.id} className="py-3 px-4 text-right text-slate-500 font-medium">
                    —
                  </td>
                );
              }
              const delta = m.savingsDeltaPct;
              const isPositive = delta > 0;
              const Icon = isPositive ? TrendingUp : delta < 0 ? TrendingDown : Minus;
              return (
                <td
                  key={m.id}
                  className={`py-3 px-4 text-right font-bold ${
                    isPositive ? "text-[#3ECF8E]" : delta < 0 ? "text-red-400" : "text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-end gap-1">
                    <Icon className="w-4 h-4" />
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)}%
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3ECF8E]" />
          <span>Best Value</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-[#3ECF8E]" />
          <span>Better than baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-red-400" />
          <span>Worse than baseline</span>
        </div>
      </div>
    </div>
  );
}
