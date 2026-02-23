import React from "react";
import type { PricingConfiguration } from "@/services/pricingConfigService";

interface PricingBESSSectionProps {
  config: PricingConfiguration;
  updateConfigSection: (
    section: keyof PricingConfiguration,
    field: string,
    value: number | string
  ) => void;
}

export default function PricingBESSSection({
  config,
  updateConfigSection,
}: PricingBESSSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2">
          Size-Weighted BESS Pricing (MWh-Based)
        </h4>
        <p className="text-sm text-amber-700">{config.bess.vendorNotes}</p>
        <div className="mt-2 text-xs text-amber-600 space-y-1">
          <p>• 2 MWh System: ${config.bess.smallSystemPerKWh}/kWh</p>
          <p>
            • 8 MWh System: $
            {Math.round(
              config.bess.smallSystemPerKWh -
                ((8 - config.bess.smallSystemSizeMWh) /
                  (config.bess.largeSystemSizeMWh - config.bess.smallSystemSizeMWh)) *
                  (config.bess.smallSystemPerKWh - config.bess.largeSystemPerKWh)
            )}
            /kWh
          </p>
          <p>• 15+ MWh Systems: ${config.bess.largeSystemPerKWh}/kWh (floor)</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Small System Price (${config.bess.smallSystemSizeMWh} MWh reference)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.bess.smallSystemPerKWh}
              onChange={(e) => updateConfigSection("bess", "smallSystemPerKWh", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /kWh
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Large System Floor (${config.bess.largeSystemSizeMWh}+ MWh)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.bess.largeSystemPerKWh}
              onChange={(e) => updateConfigSection("bess", "largeSystemPerKWh", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /kWh
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Small System Size Reference (MWh)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full py-2 border border-gray-300 rounded-md"
            value={config.bess.smallSystemSizeMWh}
            onChange={(e) => updateConfigSection("bess", "smallSystemSizeMWh", e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Large System Threshold (MWh)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full py-2 border border-gray-300 rounded-md"
            value={config.bess.largeSystemSizeMWh}
            onChange={(e) => updateConfigSection("bess", "largeSystemSizeMWh", e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Degradation Rate (Annual)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.bess.degradationRate}
              onChange={(e) => updateConfigSection("bess", "degradationRate", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Period</label>
          <div className="relative">
            <input
              type="number"
              className="w-full pr-16 py-2 border border-gray-300 rounded-md"
              value={config.bess.warrantyYears}
              onChange={(e) => updateConfigSection("bess", "warrantyYears", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              years
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Notes</label>
        <textarea
          className="w-full py-2 px-3 border border-gray-300 rounded-md"
          rows={3}
          value={config.bess.vendorNotes}
          onChange={(e) => updateConfigSection("bess", "vendorNotes", e.target.value)}
        />
      </div>
    </div>
  );
}
