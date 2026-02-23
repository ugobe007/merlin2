import React from "react";
import solarPricingService from "@/services/solarPricingService";
import type { SolarPricingConfiguration } from "@/services/solarPricingService";

interface PricingSolarSectionProps {
  editableSolar: SolarPricingConfiguration;
  updateSolarPrice: (type: string, itemId: string, field: string, value: any) => void;
  setEditableSolar: (val: SolarPricingConfiguration) => void;
  setHasChanges: (val: boolean) => void;
}

export default function PricingSolarSection({
  editableSolar,
  updateSolarPrice,
  setEditableSolar,
  setHasChanges,
}: PricingSolarSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">☀️ Solar PV Systems</h4>
        <p className="text-sm text-yellow-700">
          Comprehensive solar panel, inverter, and mounting system pricing with industry-standard
          components.
        </p>
      </div>

      {/* Editable Solar Panels */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Solar Panels (Editable Pricing)</h4>
        <div className="grid gap-3">
          {editableSolar.panels.map((panel) => (
            <div
              key={panel.id}
              className="grid md:grid-cols-7 gap-4 items-center border border-gray-200 rounded p-3"
            >
              <div>
                <h5 className="font-semibold text-sm">{panel.manufacturer}</h5>
                <p className="text-xs text-gray-600">{panel.model}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Power (W)</label>
                <input
                  type="number"
                  value={panel.powerRatingW}
                  onChange={(e) =>
                    updateSolarPrice("panels", panel.id, "powerRatingW", parseInt(e.target.value))
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Efficiency (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={panel.efficiency}
                  onChange={(e) =>
                    updateSolarPrice("panels", panel.id, "efficiency", parseFloat(e.target.value))
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Technology</label>
                <select
                  value={panel.technology}
                  onChange={(e) =>
                    updateSolarPrice("panels", panel.id, "technology", e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="monocrystalline">Monocrystalline</option>
                  <option value="polycrystalline">Polycrystalline</option>
                  <option value="thin_film">Thin Film</option>
                  <option value="bifacial">Bifacial</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Price per Watt</label>
                <div className="relative">
                  <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={panel.pricePerWatt}
                    onChange={(e) => {
                      const newPricePerWatt = parseFloat(e.target.value);
                      updateSolarPrice("panels", panel.id, "pricePerWatt", newPricePerWatt);
                      updateSolarPrice(
                        "panels",
                        panel.id,
                        "pricePerPanel",
                        newPricePerWatt * panel.powerRatingW
                      );
                    }}
                    className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Price per Panel</label>
                <div className="relative">
                  <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={panel.pricePerPanel}
                    onChange={(e) => {
                      const newPricePerPanel = parseFloat(e.target.value);
                      updateSolarPrice("panels", panel.id, "pricePerPanel", newPricePerPanel);
                      updateSolarPrice(
                        "panels",
                        panel.id,
                        "pricePerWatt",
                        newPricePerPanel / panel.powerRatingW
                      );
                    }}
                    className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">${panel.pricePerWatt}/W</p>
                <p className="text-xs text-gray-500">${panel.pricePerPanel}/panel</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Inverters */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Inverters (Editable Pricing)</h4>
        <div className="grid gap-3">
          {editableSolar.inverters.map((inverter) => (
            <div
              key={inverter.id}
              className="grid md:grid-cols-6 gap-4 items-center border border-gray-200 rounded p-3"
            >
              <div>
                <h5 className="font-semibold text-sm">{inverter.manufacturer}</h5>
                <p className="text-xs text-gray-600">{inverter.model}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Power (W)</label>
                <input
                  type="number"
                  value={inverter.powerRatingW}
                  onChange={(e) =>
                    updateSolarPrice(
                      "inverters",
                      inverter.id,
                      "powerRatingW",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Type</label>
                <select
                  value={inverter.type}
                  onChange={(e) =>
                    updateSolarPrice("inverters", inverter.id, "type", e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  <option value="string">String</option>
                  <option value="power_optimizer">Power Optimizer</option>
                  <option value="microinverter">Microinverter</option>
                  <option value="central">Central</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Efficiency (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inverter.efficiency}
                  onChange={(e) =>
                    updateSolarPrice(
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
                <label className="text-xs text-gray-600">Price per Watt</label>
                <div className="relative">
                  <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={inverter.pricePerWatt}
                    onChange={(e) => {
                      const newPricePerWatt = parseFloat(e.target.value);
                      updateSolarPrice("inverters", inverter.id, "pricePerWatt", newPricePerWatt);
                      updateSolarPrice(
                        "inverters",
                        inverter.id,
                        "pricePerUnit",
                        newPricePerWatt * inverter.powerRatingW
                      );
                    }}
                    className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">${inverter.pricePerWatt}/W</p>
                <p className="text-xs text-gray-500">${inverter.pricePerUnit}/unit</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Installation Costs */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Installation & Component Costs (Editable per kW)</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Installation Costs</h5>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Design & Permitting</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableSolar.installationCosts.designAndPermitting}
                    onChange={(e) => {
                      const updated = { ...editableSolar };
                      updated.installationCosts.designAndPermitting = parseInt(e.target.value);
                      setEditableSolar(updated);
                      solarPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    /kW
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Labor</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableSolar.installationCosts.laborPerKW}
                    onChange={(e) => {
                      const updated = { ...editableSolar };
                      updated.installationCosts.laborPerKW = parseInt(e.target.value);
                      setEditableSolar(updated);
                      solarPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    /kW
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-700 mb-3">Additional Components</h5>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">DC Cabling</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableSolar.additionalComponents.dcCabling}
                    onChange={(e) => {
                      const updated = { ...editableSolar };
                      updated.additionalComponents.dcCabling = parseInt(e.target.value);
                      setEditableSolar(updated);
                      solarPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    /kW
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">AC Cabling</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableSolar.additionalComponents.acCabling}
                    onChange={(e) => {
                      const updated = { ...editableSolar };
                      updated.additionalComponents.acCabling = parseInt(e.target.value);
                      setEditableSolar(updated);
                      solarPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    /kW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
