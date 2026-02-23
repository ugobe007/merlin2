import React from "react";
import type { PricingConfiguration } from "@/services/pricingConfigService";

interface PricingEVChargingSectionProps {
  config: PricingConfiguration;
  updateConfigSection: (
    section: keyof PricingConfiguration,
    field: string,
    value: number | string
  ) => void;
}

export default function PricingEVChargingSection({
  config,
  updateConfigSection,
}: PricingEVChargingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">EV Charging Infrastructure Pricing</h4>
        <p className="text-sm text-blue-700">{config.evCharging.vendorNotes}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level 1 AC (3.3-7.7kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.level1ACPerUnit}
              onChange={(e) => updateConfigSection("evCharging", "level1ACPerUnit", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /unit
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level 2 AC (7.7-22kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.level2ACPerUnit}
              onChange={(e) => updateConfigSection("evCharging", "level2ACPerUnit", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /unit
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">DC Fast (50-150kW)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.dcFastPerUnit}
              onChange={(e) => updateConfigSection("evCharging", "dcFastPerUnit", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /unit
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DC Ultra Fast (150-350kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.dcUltraFastPerUnit}
              onChange={(e) =>
                updateConfigSection("evCharging", "dcUltraFastPerUnit", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /unit
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pantograph Charger (Overhead)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.pantographChargerPerUnit}
              onChange={(e) =>
                updateConfigSection("evCharging", "pantographChargerPerUnit", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /unit
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Networking/OCPP (per charger)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.networkingCostPerUnit}
              onChange={(e) =>
                updateConfigSection("evCharging", "networkingCostPerUnit", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              /unit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
