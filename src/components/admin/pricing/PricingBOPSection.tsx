import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PricingConfiguration } from "@/services/pricingConfigService";

interface PricingBOPSectionProps {
  config: PricingConfiguration;
  updateConfigSection: (
    section: keyof PricingConfiguration,
    field: string,
    value: number | string
  ) => void;
}

export default function PricingBOPSection({ config, updateConfigSection }: PricingBOPSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Balance of Plant Guidelines (≤15% Maximum)
        </h4>
        <p className="text-sm text-red-700">{config.balanceOfPlant.vendorNotes}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            BOP Percentage
            {config.balanceOfPlant.bopPercentage > 0.15 && (
              <span className="text-red-500 text-xs ml-2">(⚠️ Exceeds 15% guideline)</span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              max="0.15"
              className={`w-full pr-8 py-2 border rounded-md ${
                config.balanceOfPlant.bopPercentage > 0.15
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              value={config.balanceOfPlant.bopPercentage}
              onChange={(e) =>
                updateConfigSection("balanceOfPlant", "bopPercentage", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">EPC Percentage</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.epcPercentage}
              onChange={(e) =>
                updateConfigSection("balanceOfPlant", "epcPercentage", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Labor Cost (per hour)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-12 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.laborCostPerHour}
              onChange={(e) =>
                updateConfigSection("balanceOfPlant", "laborCostPerHour", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /hr
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.shippingCostPercentage}
              onChange={(e) =>
                updateConfigSection("balanceOfPlant", "shippingCostPercentage", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            International Tariff Rate
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.internationalTariffRate}
              onChange={(e) =>
                updateConfigSection("balanceOfPlant", "internationalTariffRate", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contingency Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.contingencyPercentage}
              onChange={(e) =>
                updateConfigSection("balanceOfPlant", "contingencyPercentage", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
