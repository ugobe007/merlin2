import React from "react";
import type { PowerElectronicsPricingConfiguration } from "@/services/powerElectronicsPricingService";

interface PricingPowerElectronicsSectionProps {
  editablePowerElectronics: PowerElectronicsPricingConfiguration;
  updatePowerElectronicsPrice: (type: string, itemId: string, field: string, value: any) => void;
}

export default function PricingPowerElectronicsSection({
  editablePowerElectronics,
  updatePowerElectronicsPrice,
}: PricingPowerElectronicsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-800 mb-2">🔌 Power Electronics</h4>
        <p className="text-sm text-indigo-700">
          Inverters, transformers, switchgear, and power conditioning equipment for energy systems.
        </p>
      </div>

      {/* Editable Inverters */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Power Inverters (Editable Pricing)</h4>
        <div className="grid gap-3">
          {editablePowerElectronics.inverters.slice(0, 2).map((inverter) => (
            <div
              key={inverter.id}
              className="grid md:grid-cols-5 gap-4 items-center border border-gray-200 rounded p-3"
            >
              <div>
                <h5 className="font-semibold text-sm">{inverter.manufacturer}</h5>
                <p className="text-xs text-gray-600">{inverter.model}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Power (kW)</label>
                <input
                  type="number"
                  value={inverter.powerRatingKW}
                  onChange={(e) =>
                    updatePowerElectronicsPrice(
                      "inverters",
                      inverter.id,
                      "powerRatingKW",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Efficiency (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inverter.efficiency}
                  onChange={(e) =>
                    updatePowerElectronicsPrice(
                      "inverters",
                      inverter.id,
                      "efficiency",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Price/kW ($)</label>
                <input
                  type="number"
                  value={inverter.pricePerKW}
                  onChange={(e) => {
                    const newPricePerKW = parseInt(e.target.value);
                    updatePowerElectronicsPrice(
                      "inverters",
                      inverter.id,
                      "pricePerKW",
                      newPricePerKW
                    );
                    updatePowerElectronicsPrice(
                      "inverters",
                      inverter.id,
                      "pricePerUnit",
                      newPricePerKW * inverter.powerRatingKW
                    );
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-600">${inverter.pricePerKW}/kW</p>
                <p className="text-xs text-gray-500">${inverter.pricePerUnit.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Transformers */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Transformers (Editable Pricing)</h4>
        <div className="grid gap-3">
          {editablePowerElectronics.transformers.slice(0, 2).map((transformer) => (
            <div
              key={transformer.id}
              className="grid md:grid-cols-5 gap-4 items-center border border-gray-200 rounded p-3"
            >
              <div>
                <h5 className="font-semibold text-sm">{transformer.manufacturer}</h5>
                <p className="text-xs text-gray-600">{transformer.model}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Power (kVA)</label>
                <input
                  type="number"
                  value={transformer.powerRatingKVA}
                  onChange={(e) =>
                    updatePowerElectronicsPrice(
                      "transformers",
                      transformer.id,
                      "powerRatingKVA",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Efficiency (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={transformer.efficiency}
                  onChange={(e) =>
                    updatePowerElectronicsPrice(
                      "transformers",
                      transformer.id,
                      "efficiency",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600">Price/kVA ($)</label>
                <input
                  type="number"
                  value={transformer.pricePerKVA}
                  onChange={(e) => {
                    const newPricePerKVA = parseInt(e.target.value);
                    updatePowerElectronicsPrice(
                      "transformers",
                      transformer.id,
                      "pricePerKVA",
                      newPricePerKVA
                    );
                    updatePowerElectronicsPrice(
                      "transformers",
                      transformer.id,
                      "pricePerUnit",
                      newPricePerKVA * transformer.powerRatingKVA
                    );
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div className="text-right">
                <p className="font-bold text-orange-600">${transformer.pricePerKVA}/kVA</p>
                <p className="text-xs text-gray-500">
                  ${transformer.pricePerUnit.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
