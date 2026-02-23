import React from "react";
import generatorPricingService from "@/services/generatorPricingService";
import type { GeneratorPricingConfiguration } from "@/services/generatorPricingService";

interface PricingGeneratorSectionProps {
  editableGenerators: GeneratorPricingConfiguration;
  updateGeneratorPrice: (generatorId: string, field: string, value: any) => void;
  setEditableGenerators: (val: GeneratorPricingConfiguration) => void;
  setHasChanges: (val: boolean) => void;
}

export default function PricingGeneratorSection({
  editableGenerators,
  updateGeneratorPrice,
  setEditableGenerators,
  setHasChanges,
}: PricingGeneratorSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2">
          ⚡ Generator Systems - Eaton Power Equipment
        </h4>
        <p className="text-sm text-green-700">
          Based on official Eaton quote: 200KW Cummins 6LTAA9.5-G260 Natural Gas generator at
          $64,200/unit. Includes Stamford alternator, Deepsea DSE8610 controller, and silent
          enclosure.
        </p>
      </div>

      {/* Editable Generator Models */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Generator Models (Editable Pricing)</h4>
        <div className="grid gap-4">
          {editableGenerators.generators.map((generator) => (
            <div key={generator.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid md:grid-cols-6 gap-4 items-center">
                <div>
                  <h5 className="font-semibold text-gray-900">{generator.model}</h5>
                  <p className="text-sm text-gray-600">{generator.manufacturer}</p>
                  <p className="text-xs text-purple-600 capitalize">
                    {generator.fuelType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Power (kW)</p>
                  <input
                    type="number"
                    value={generator.ratedPowerKW}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "ratedPowerKW", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Base Price ($)</p>
                  <input
                    type="number"
                    value={generator.basePrice}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "basePrice", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price/kW ($)</p>
                  <input
                    type="number"
                    step="0.01"
                    value={generator.pricePerKW}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "pricePerKW", parseFloat(e.target.value))
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enclosure</p>
                  <select
                    value={generator.enclosure}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "enclosure", e.target.value)
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="open">Open</option>
                    <option value="silent">Silent</option>
                    <option value="weather_proof">Weather Proof</option>
                    <option value="container">Container</option>
                  </select>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    ${Math.round(generator.basePrice / generator.ratedPowerKW)}/kW
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: ${generator.basePrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {generator.id === "cummins-6ltaa95-g260-200kw" && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium">✓ Featured in Eaton Quote</p>
                  <p className="text-xs text-green-700">
                    Original quote: $64,200 for 200kW unit with DSE8610 controller
                  </p>
                </div>
              )}

              <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Engine Details:</p>
                  <p className="text-gray-600">{generator.engine.model}</p>
                  <p className="text-gray-600">
                    {generator.engine.displacement}L, {generator.engine.cylinders} cylinders
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Controller:</p>
                  <p className="text-gray-600">{generator.controller.model}</p>
                  <p className="text-gray-600">{generator.controller.type}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Vendor:</p>
                  <p className="text-gray-600">{generator.vendor.company}</p>
                  <p className="text-gray-600">{generator.vendor.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Installation Costs */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Installation & Operating Costs (Editable)</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Installation Costs (per unit)</h5>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Foundation</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableGenerators.installationCosts.sitePreperation}
                    onChange={(e) => {
                      const updated = { ...editableGenerators };
                      updated.installationCosts.sitePreperation = parseInt(e.target.value);
                      setEditableGenerators(updated);
                      generatorPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Transportation</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableGenerators.installationCosts.electricalConnection}
                    onChange={(e) => {
                      const updated = { ...editableGenerators };
                      updated.installationCosts.electricalConnection = parseInt(e.target.value);
                      setEditableGenerators(updated);
                      generatorPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-gray-700 mb-3">Operating Costs (annual per kW)</h5>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Maintenance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableGenerators.maintenanceCosts.annualPerKW}
                    onChange={(e) => {
                      const updated = { ...editableGenerators };
                      updated.maintenanceCosts.annualPerKW = parseInt(e.target.value);
                      setEditableGenerators(updated);
                      generatorPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Major Overhaul Cost per kW
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={editableGenerators.maintenanceCosts.majorOverhaulCostPerKW}
                    onChange={(e) => {
                      const updated = { ...editableGenerators };
                      updated.maintenanceCosts.majorOverhaulCostPerKW = parseInt(e.target.value);
                      setEditableGenerators(updated);
                      generatorPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Calculator */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Quick Cost Calculator</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Generator Model</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              {editableGenerators.generators.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {gen.model} - {gen.ratedPowerKW}kW
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              defaultValue="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include Installation
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="true">Yes</option>
              <option value="false">Equipment Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
