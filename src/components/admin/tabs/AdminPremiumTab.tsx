import React, { useState, useEffect } from "react";
import { Crown, Star, CheckCircle, BarChart3, Database } from "lucide-react";
import {
  getUseCaseProfiles,
  calculatePremiumComparison,
} from "@/services/premiumConfigurationService";

interface AdminPremiumTabProps {
  selectedPremiumUseCase: string;
  setSelectedPremiumUseCase: (uc: string) => void;
}

export default function AdminPremiumTab({
  selectedPremiumUseCase,
  setSelectedPremiumUseCase,
}: AdminPremiumTabProps) {
  const [premiumComparison, setPremiumComparison] = useState<any>(null);

  useEffect(() => {
    const comparison = calculatePremiumComparison(selectedPremiumUseCase, 1, 4, 0.5);
    setPremiumComparison(comparison);
  }, [selectedPremiumUseCase]);

  return (
    <>
      <div className="space-y-5">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MERLIN Premium Benchmarks</h2>
              <p className="text-xs text-amber-400 font-medium">
                Premium equipment configurations for each use case
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedPremiumUseCase}
              onChange={(e) => setSelectedPremiumUseCase(e.target.value)}
              className="text-sm bg-[#1a1a2e] border border-amber-500/20 rounded-lg px-3 py-1.5 text-white/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
            >
              {Object.keys(getUseCaseProfiles()).map((uc) => (
                <option key={uc} value={uc}>
                  {uc
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Premium vs Standard Comparison */}
        {premiumComparison && (
          <div className="grid md:grid-cols-2 gap-5">
            {/* Standard */}
            <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/[0.05] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/80 uppercase">Standard Quote</h3>
                  <p className="text-xs text-white/40">Basic equipment tier</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-white mb-4">
                ${Math.round(premiumComparison.standard.totalCost).toLocaleString()}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Batteries</span>
                  <span className="text-white/80">
                    ${Math.round(premiumComparison.standard.breakdown.batteries).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Inverters</span>
                  <span className="text-white/80">
                    ${Math.round(premiumComparison.standard.breakdown.inverters).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Transformer</span>
                  <span className="text-white/80">
                    ${Math.round(premiumComparison.standard.breakdown.transformer).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Controller</span>
                  <span className="text-white/80">
                    $
                    {Math.round(
                      premiumComparison.standard.breakdown.microgridController
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium */}
            <div className="bg-amber-500/50/5 rounded-xl p-5 border-2 border-amber-300 shadow-lg relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="px-2 py-1 bg-amber-500/50 text-white text-xs font-bold rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-400 uppercase">MERLIN Premium</h3>
                  <p className="text-xs text-amber-400">Optimized for {selectedPremiumUseCase}</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-400 mb-4">
                ${Math.round(premiumComparison.premium.totalCost).toLocaleString()}
                <span className="text-sm font-normal text-amber-400 ml-2">
                  (+{premiumComparison.delta.percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-400">Premium Batteries</span>
                  <span className="text-amber-400 font-medium">
                    ${Math.round(premiumComparison.premium.breakdown.batteries).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">Advanced Inverters</span>
                  <span className="text-amber-400 font-medium">
                    ${Math.round(premiumComparison.premium.breakdown.inverters).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">Smart Transformer</span>
                  <span className="text-amber-400 font-medium">
                    ${Math.round(premiumComparison.premium.breakdown.transformer).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">AI Controller</span>
                  <span className="text-amber-400 font-medium">
                    $
                    {Math.round(
                      premiumComparison.premium.breakdown.microgridController
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Value Proposition */}
        {premiumComparison && (
          <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-emerald-500/20 shadow-lg">
            <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Premium Value Proposition
            </h3>
            <div className="grid md:grid-cols-5 gap-3">
              {premiumComparison.valueProposition.map((value: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-emerald-500/5 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-emerald-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Catalog */}
        <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Premium Equipment Catalog
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Batteries */}
            <div className="p-4 bg-blue-500/5 rounded-lg border border-white/[0.08]">
              <h4 className="text-sm font-bold text-blue-400 mb-2">🔋 Premium Batteries</h4>
              <div className="text-xs text-blue-400 space-y-1">
                <p>• Tesla Megapack 2XL</p>
                <p>• 7,500 cycle life</p>
                <p>• 15-year warranty</p>
                <p>• 92% round-trip efficiency</p>
                <p className="font-bold mt-2">$295/kWh</p>
              </div>
            </div>

            {/* Inverters */}
            <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              <h4 className="text-sm font-bold text-emerald-400 mb-2">⚡ Premium Inverters</h4>
              <div className="text-xs text-emerald-400 space-y-1">
                <p>• SMA Sunny Central Storage UP</p>
                <p>• Grid-forming capable</p>
                <p>• 4-quadrant operation</p>
                <p>• Virtual inertia support</p>
                <p className="font-bold mt-2">$145/kW</p>
              </div>
            </div>

            {/* Controllers */}
            <div className="p-4 bg-amber-500/50/5 rounded-lg border border-amber-500/20">
              <h4 className="text-sm font-bold text-amber-400 mb-2">🎛️ Microgrid Controllers</h4>
              <div className="text-xs text-amber-400 space-y-1">
                <p>• Schneider EcoStruxure Advisor</p>
                <p>• AI-based optimization</p>
                <p>• Weather-aware forecasting</p>
                <p>• Automatic islanding</p>
                <p className="font-bold mt-2">$45,000</p>
              </div>
            </div>

            {/* AC Patch Panels */}
            <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <h4 className="text-sm font-bold text-emerald-800 mb-2">🔌 AC Patch Panels</h4>
              <div className="text-xs text-emerald-700 space-y-1">
                <p>• Schneider Galaxy VM</p>
                <p>• 48 circuits</p>
                <p>• Hot-swappable breakers</p>
                <p>• Power monitoring per circuit</p>
                <p className="font-bold mt-2">$8,500</p>
              </div>
            </div>

            {/* DC Patch Panels */}
            <div className="p-4 bg-rose-500/5 rounded-lg border border-rose-500/20">
              <h4 className="text-sm font-bold text-rose-400 mb-2">🔋 DC Patch Panels</h4>
              <div className="text-xs text-rose-700 space-y-1">
                <p>• OutBack FLEXware 500</p>
                <p>• 1000VDC rating</p>
                <p>• String-level monitoring</p>
                <p>• Rapid shutdown compliant</p>
                <p className="font-bold mt-2">$5,500</p>
              </div>
            </div>

            {/* Transformers */}
            <div className="p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/20">
              <h4 className="text-sm font-bold text-indigo-400 mb-2">⚙️ Smart Transformers</h4>
              <div className="text-xs text-indigo-400 space-y-1">
                <p>• Siemens Digital</p>
                <p>• 98.5% efficiency</p>
                <p>• Real-time monitoring</p>
                <p>• Predictive maintenance</p>
                <p className="font-bold mt-2">$95/kVA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
