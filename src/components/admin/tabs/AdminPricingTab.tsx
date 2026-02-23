import React from "react";
import { DollarSign, TrendingUp } from "lucide-react";

interface AdminPricingTabProps {
  onOpenPricingAdmin: () => void;
}

export default function AdminPricingTab({ onOpenPricingAdmin }: AdminPricingTabProps) {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Pricing Configuration</h2>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Equipment Pricing Management</h3>
              <p className="text-white/50">
                Manage all equipment pricing assumptions based on real vendor quotes
              </p>
            </div>
            <button
              onClick={() => onOpenPricingAdmin()}
              className="bg-gradient-to-r from-blue-400 to-sky-400 hover:from-blue-500 hover:to-sky-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
            >
              Open Pricing Dashboard
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.08]">
              <h4 className="font-semibold text-white mb-2">🔋 BESS Systems</h4>
              <p className="text-white/60 text-sm">Small (&lt;1MWh): ~$200/kWh</p>
              <p className="text-white/60 text-sm">Medium (1-10MWh): ~$155/kWh</p>
              <p className="text-white/60 text-sm">Utility (10+MWh): ~$140/kWh</p>
              <p className="text-blue-400 text-xs mt-2">NREL ATB 2024 via unifiedPricingService</p>
            </div>

            <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
              <h4 className="font-semibold text-white mb-2">⚡ Generators</h4>
              <p className="text-white/60 text-sm">Natural Gas: ~$700/kW</p>
              <p className="text-white/60 text-sm">Diesel: ~$500/kW</p>
              <p className="text-blue-400 text-xs mt-2">NREL ATB 2024 via unifiedPricingService</p>
            </div>

            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
              <h4 className="font-semibold text-white mb-2">🚗 EV Charging</h4>
              <p className="text-white/60 text-sm">Level 2: $2-8k/unit</p>
              <p className="text-white/60 text-sm">DCFC: $35-85k/unit</p>
              <p className="text-blue-400 text-xs mt-2">evChargingCalculations.ts SSOT</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">
              ⚠️ <strong>Important:</strong> Balance of Plant configured under 15% guideline: 12%
              BOP + 8% EPC + 5% Contingency = 25% total installation costs. Daily pricing validation
              active.
            </p>
          </div>
        </div>

        {/* Real-time Pricing Status */}
        <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Pricing Data Sources
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Vendor Quotes</h4>
              <ul className="text-white/60 text-sm space-y-1">
                <li>✅ Great Power (BESS) - Confidential NDA pricing</li>
                <li>✅ Eaton Power Equipment - $64.2k/200kW generator</li>
                <li>✅ Market-verified EV charger pricing</li>
                <li>✅ Panasonic/Mitsubishi Chemical experience</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Market Intelligence</h4>
              <ul className="text-white/60 text-sm space-y-1">
                <li>✅ NREL ATB 2024 integration</li>
                <li>✅ GridStatus.io real-time data</li>
                <li>✅ Industry-standard BOP guidelines</li>
                <li>✅ Regional cost adjustments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
