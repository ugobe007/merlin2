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
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
        <h4 className="font-semibold text-violet-400 mb-2">🔌 Power Electronics</h4>
        <p className="text-sm text-violet-300/70">
          Inverters, transformers, patch panels, microgrid controllers, and power conditioning
          equipment.
        </p>
      </div>

      {/* Editable Inverters */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <h4 className="font-semibold text-white mb-4">Power Inverters (Editable Pricing)</h4>
        <div className="grid gap-3">
          {editablePowerElectronics.inverters.slice(0, 2).map((inverter) => (
            <div
              key={inverter.id}
              className="grid md:grid-cols-5 gap-4 items-center border border-white/[0.08] rounded-xl p-3 bg-white/[0.02]"
            >
              <div>
                <h5 className="font-semibold text-white text-sm">{inverter.manufacturer}</h5>
                <p className="text-xs text-white/50">{inverter.model}</p>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Power (kW)</label>
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
                  className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Efficiency (%)</label>
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
                  className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Price/kW ($)</label>
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
                  className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="text-right">
                <p className="font-bold text-violet-400">${inverter.pricePerKW}/kW</p>
                <p className="text-xs text-white/50">${inverter.pricePerUnit.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable Transformers */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <h4 className="font-semibold text-white mb-4">Transformers (Editable Pricing)</h4>
        <div className="grid gap-3">
          {editablePowerElectronics.transformers.slice(0, 2).map((transformer) => (
            <div
              key={transformer.id}
              className="grid md:grid-cols-5 gap-4 items-center border border-white/[0.08] rounded-xl p-3 bg-white/[0.02]"
            >
              <div>
                <h5 className="font-semibold text-white text-sm">{transformer.manufacturer}</h5>
                <p className="text-xs text-white/50">{transformer.model}</p>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Power (kVA)</label>
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
                  className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Efficiency (%)</label>
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
                  className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Price/kVA ($)</label>
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
                  className="w-full px-2 py-1.5 text-sm bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:border-emerald-500/50 outline-none"
                />
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-400">${transformer.pricePerKVA}/kVA</p>
                <p className="text-xs text-white/50">
                  ${transformer.pricePerUnit.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AC Patch Panels */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <span className="text-blue-400 text-sm font-bold">AC</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">AC Patch Panels &amp; Distribution</h4>
            <p className="text-xs text-white/40">
              Revenue-grade AC distribution panels for residential, commercial, and industrial
              applications
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            {
              model: "PNL-120/240-100A",
              voltage: "120/240V Single Phase",
              rating: "100A",
              price: 850,
              application: "Residential",
            },
            {
              model: "PNL-120/240-200A",
              voltage: "120/240V Single Phase",
              rating: "200A",
              price: 1200,
              application: "Residential",
            },
            {
              model: "PNL-208V-3P-225A",
              voltage: "208V 3-Phase",
              rating: "225A",
              price: 2400,
              application: "Commercial",
            },
            {
              model: "PNL-208V-3P-400A",
              voltage: "208V 3-Phase",
              rating: "400A",
              price: 4800,
              application: "Commercial",
            },
            {
              model: "PNL-480V-3P-600A",
              voltage: "480V 3-Phase",
              rating: "600A",
              price: 7500,
              application: "Industrial",
            },
            {
              model: "PNL-480V-3P-1200A",
              voltage: "480V 3-Phase",
              rating: "1200A",
              price: 12000,
              application: "Industrial",
            },
          ].map((panel) => (
            <div
              key={panel.model}
              className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{panel.model}</p>
                <p className="text-xs text-blue-400">
                  {panel.voltage} • {panel.rating}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">
                  ${panel.price.toLocaleString()}
                </p>
                <p className="text-xs text-white/40">{panel.application}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DC Patch Panels */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
            <span className="text-orange-400 text-sm font-bold">DC</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">DC Patch Panels &amp; Combiners</h4>
            <p className="text-xs text-white/40">
              DC bus distribution, string combiners, and battery interconnect panels
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            {
              model: "DC-48V-200A",
              voltage: "48V DC Bus",
              rating: "200A",
              price: 1200,
              application: "Battery Storage",
            },
            {
              model: "DC-48V-400A",
              voltage: "48V DC Bus",
              rating: "400A",
              price: 2400,
              application: "Battery Storage",
            },
            {
              model: "DC-600V-SCB-16",
              voltage: "600V String Combiner",
              rating: "16 Strings",
              price: 3500,
              application: "Solar PV",
            },
            {
              model: "DC-600V-SCB-32",
              voltage: "600V String Combiner",
              rating: "32 Strings",
              price: 6000,
              application: "Solar PV",
            },
            {
              model: "DC-1000V-SCB-24",
              voltage: "1000V String Combiner",
              rating: "24 Strings",
              price: 4800,
              application: "Utility Solar",
            },
            {
              model: "DC-1500V-SCB-32",
              voltage: "1500V String Combiner",
              rating: "32 Strings",
              price: 8500,
              application: "Utility Solar",
            },
          ].map((panel) => (
            <div
              key={panel.model}
              className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{panel.model}</p>
                <p className="text-xs text-orange-400">
                  {panel.voltage} • {panel.rating}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400">
                  ${panel.price.toLocaleString()}
                </p>
                <p className="text-xs text-white/40">{panel.application}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Microgrid Controllers */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
            <span className="text-cyan-400 text-sm">🖥</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Microgrid Controllers</h4>
            <p className="text-xs text-white/40">
              Intelligent energy management and grid-islanding controllers
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            {
              model: "SEL-3555",
              manufacturer: "SEL",
              capacity: "Up to 5 MW",
              price: 18500,
              features: "Real-time automation, IEC 61850, DNP3",
            },
            {
              model: "EcoStruxure MGC",
              manufacturer: "Schneider Electric",
              capacity: "Up to 20 MW",
              price: 28000,
              features: "Cloud SCADA, load forecasting, islanding",
            },
            {
              model: "Ability MGC-2000",
              manufacturer: "ABB",
              capacity: "Up to 50 MW",
              price: 35000,
              features: "AI-driven dispatch, multi-DER optimization",
            },
            {
              model: "SICAM GridEdge",
              manufacturer: "Siemens",
              capacity: "Up to 100 MW",
              price: 42000,
              features: "Cybersec IEC 62443, VPP integration",
            },
          ].map((ctrl) => (
            <div
              key={ctrl.model}
              className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{ctrl.model}</p>
                  <p className="text-xs text-cyan-400">
                    {ctrl.manufacturer} • {ctrl.capacity}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{ctrl.features}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-base font-bold text-emerald-400">
                    ${ctrl.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-white/40">per unit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modulation / Power Conditioning */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center">
            <span className="text-pink-400 text-sm">~</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Modulation &amp; Power Conditioning</h4>
            <p className="text-xs text-white/40">
              Harmonic filters, VAR compensators, power factor correction, and UPS systems
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          {[
            {
              model: "AHF-50A",
              type: "Active Harmonic Filter",
              rating: "50A / 35kVAR",
              price: 8500,
              notes: "IEEE 519 compliance, THD < 5%",
            },
            {
              model: "AHF-200A",
              type: "Active Harmonic Filter",
              rating: "200A / 140kVAR",
              price: 24000,
              notes: "Real-time harmonic cancellation, 3-phase",
            },
            {
              model: "SVC-1MVAr",
              type: "Static VAR Compensator",
              rating: "1 MVAr",
              price: 45000,
              notes: "Reactive power injection/absorption",
            },
            {
              model: "SVC-5MVAr",
              type: "Static VAR Compensator",
              rating: "5 MVAr",
              price: 180000,
              notes: "Utility-scale voltage stabilization",
            },
            {
              model: "PFC-100kVAR",
              type: "Power Factor Correction",
              rating: "100 kVAR",
              price: 3200,
              notes: "Automatic capacitor bank, PF > 0.99",
            },
            {
              model: "PFC-500kVAR",
              type: "Power Factor Correction",
              rating: "500 kVAR",
              price: 18000,
              notes: "Stepped capacitor banks, SCADA interface",
            },
            {
              model: "UPS-10kVA",
              type: "Online UPS",
              rating: "10 kVA / 8 kW",
              price: 2400,
              notes: "Double-conversion, <2ms transfer",
            },
            {
              model: "UPS-100kVA",
              type: "Online UPS",
              rating: "100 kVA / 90 kW",
              price: 28000,
              notes: "N+1 redundant modules, 0ms transfer",
            },
          ].map((item) => (
            <div
              key={item.model}
              className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{item.model}</p>
                <p className="text-xs text-pink-400">
                  {item.type} • {item.rating}
                </p>
                <p className="text-xs text-white/40">{item.notes}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-bold text-emerald-400">${item.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
