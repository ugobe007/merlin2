import React from "react";
import generatorPricingService from "@/services/generatorPricingService";
import type { GeneratorPricingConfiguration } from "@/services/generatorPricingService";

interface PricingGeneratorSectionProps {
  editableGenerators: GeneratorPricingConfiguration;
  updateGeneratorPrice: (generatorId: string, field: string, value: any) => void;
  setEditableGenerators: (val: GeneratorPricingConfiguration) => void;
  setHasChanges: (val: boolean) => void;
}

const LINEAR_GENERATORS = [
  {
    id: "linear-25kw-ng",
    model: "LP-25 Linear Generator",
    manufacturer: "Mainspring Energy",
    fuelType: "Natural Gas",
    ratedPowerKW: 25,
    basePrice: 42000,
    pricePerKW: 1680,
    notes: "Free-piston linear generator, 90% efficiency, <1 NOx ppm",
  },
  {
    id: "linear-100kw-ng",
    model: "LP-100 Linear Generator",
    manufacturer: "Mainspring Energy",
    fuelType: "Natural Gas / Hydrogen Blend",
    ratedPowerKW: 100,
    basePrice: 148000,
    pricePerKW: 1480,
    notes: "H2-ready, 85%+ electrical efficiency, modular stack design",
  },
  {
    id: "linear-250kw-propane",
    model: "LP-250 Linear Generator",
    manufacturer: "Mainspring Energy",
    fuelType: "Propane / Natural Gas",
    ratedPowerKW: 250,
    basePrice: 340000,
    pricePerKW: 1360,
    notes: "Grid-parallel capable, <500 hours maintenance interval",
  },
  {
    id: "linear-stirling-1kw",
    model: "SE-1000 Stirling Linear",
    manufacturer: "Sunpower / Ametek",
    fuelType: "Multi-Fuel",
    ratedPowerKW: 1,
    basePrice: 4800,
    pricePerKW: 4800,
    notes: "Stirling-cycle linear alternator, no moving valves, 45,000h MTBF",
  },
];

export default function PricingGeneratorSection({
  editableGenerators,
  updateGeneratorPrice,
  setEditableGenerators,
  setHasChanges,
}: PricingGeneratorSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <h4 className="font-semibold text-emerald-400 mb-2">
          ⚡ Generator Systems — Eaton Power Equipment
        </h4>
        <p className="text-sm text-emerald-300/70">
          Based on official Eaton quote: 200KW Cummins 6LTAA9.5-G260 Natural Gas generator at
          $64,200/unit. Includes Stamford alternator, Deepsea DSE8610 controller, and silent
          enclosure.
        </p>
      </div>

      {/* Editable Generator Models */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <h4 className="font-semibold text-white mb-4">Generator Models (Editable Pricing)</h4>
        <div className="grid gap-4">
          {editableGenerators.generators.map((generator) => (
            <div
              key={generator.id}
              className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02]"
            >
              <div className="grid md:grid-cols-6 gap-4 items-center">
                <div>
                  <h5 className="font-semibold text-white text-sm">{generator.model}</h5>
                  <p className="text-xs text-white/50">{generator.manufacturer}</p>
                  <p className="text-xs text-emerald-400 capitalize">
                    {generator.fuelType.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Power (kW)</p>
                  <input
                    type="number"
                    value={generator.ratedPowerKW}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "ratedPowerKW", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Base Price ($)</p>
                  <input
                    type="number"
                    value={generator.basePrice}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "basePrice", parseInt(e.target.value))
                    }
                    className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Price/kW ($)</p>
                  <input
                    type="number"
                    step="0.01"
                    value={generator.pricePerKW}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "pricePerKW", parseFloat(e.target.value))
                    }
                    className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                  />
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Enclosure</p>
                  <select
                    value={generator.enclosure}
                    onChange={(e) =>
                      updateGeneratorPrice(generator.id, "enclosure", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="silent">Silent</option>
                    <option value="weather_proof">Weather Proof</option>
                    <option value="container">Container</option>
                  </select>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">
                    ${Math.round(generator.basePrice / generator.ratedPowerKW)}/kW
                  </p>
                  <p className="text-xs text-white/50">
                    Total: ${generator.basePrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {generator.id === "cummins-6ltaa95-g260-200kw" && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-400 font-medium">✓ Featured in Eaton Quote</p>
                  <p className="text-xs text-emerald-300/70">
                    Original quote: $64,200 for 200kW unit with DSE8610 controller
                  </p>
                </div>
              )}

              <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-white/70 text-xs">Engine Details:</p>
                  <p className="text-white/50 text-xs">{generator.engine.model}</p>
                  <p className="text-white/50 text-xs">
                    {generator.engine.displacement}L, {generator.engine.cylinders} cylinders
                  </p>
                </div>
                <div>
                  <p className="font-medium text-white/70 text-xs">Controller:</p>
                  <p className="text-white/50 text-xs">{generator.controller.model}</p>
                  <p className="text-white/50 text-xs">{generator.controller.type}</p>
                </div>
                <div>
                  <p className="font-medium text-white/70 text-xs">Vendor:</p>
                  <p className="text-white/50 text-xs">{generator.vendor.company}</p>
                  <p className="text-white/50 text-xs">{generator.vendor.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linear Generators */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
            <span className="text-violet-400 text-base">⚙</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Linear Generators</h4>
            <p className="text-xs text-white/40">
              Free-piston and linear alternator systems — hydrogen-ready, ultra-low emissions
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {LINEAR_GENERATORS.map((gen) => (
            <div key={gen.id} className="border border-white/[0.08] rounded-xl p-4 bg-white/[0.02]">
              <div className="grid md:grid-cols-5 gap-4 items-center">
                <div>
                  <h5 className="font-semibold text-white text-sm">{gen.model}</h5>
                  <p className="text-xs text-white/50">{gen.manufacturer}</p>
                  <p className="text-xs text-violet-400">{gen.fuelType}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Power (kW)</p>
                  <div className="px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white/70">
                    {gen.ratedPowerKW}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Base Price</p>
                  <div className="px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white/70">
                    ${gen.basePrice.toLocaleString()}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Price/kW</p>
                  <div className="px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-violet-400 font-semibold">
                    ${gen.pricePerKW.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-violet-400">${gen.pricePerKW}/kW</p>
                  <p className="text-xs text-white/50">${gen.basePrice.toLocaleString()} total</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-white/40 px-1">{gen.notes}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
          <p className="text-xs text-violet-300">
            Linear generators use free-piston or Stirling-cycle linear alternators. No crankshaft,
            fewer moving parts, 45,000+ hr MTBF. H2-ready models available (Mainspring LP series).
          </p>
        </div>
      </div>

      {/* Installation Costs */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <h4 className="font-semibold text-white mb-4">
          Installation &amp; Operating Costs (Editable)
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-white/70 text-sm mb-3">
              Installation Costs (per unit)
            </h5>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Foundation / Site Prep</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
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
                    className="w-full pl-8 pr-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Transportation &amp; Electrical Connection
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
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
                    className="w-full pl-8 pr-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-medium text-white/70 text-sm mb-3">
              Operating Costs (annual per kW)
            </h5>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Maintenance ($/kW/yr)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
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
                    className="w-full pl-8 pr-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Major Overhaul Cost per kW
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
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
                    className="w-full pl-8 pr-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Calculator */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <h4 className="font-semibold text-white mb-4">Quick Cost Calculator</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-2">Generator Model</label>
            <select className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none">
              {editableGenerators.generators.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {gen.model} - {gen.ratedPowerKW}kW
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              defaultValue="1"
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Include Installation</label>
            <select className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white text-sm focus:border-emerald-500/50 outline-none">
              <option value="true">Yes</option>
              <option value="false">Equipment Only</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
