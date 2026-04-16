import React from "react";
import type { WindPricingConfiguration } from "@/services/windPricingService";

interface PricingWindSectionProps {
  editableWind: WindPricingConfiguration;
  updateWindPrice: (type: string, itemId: string, field: string, value: any) => void;
}

export default function PricingWindSection({
  editableWind,
  updateWindPrice,
}: PricingWindSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <h4 className="font-semibold text-cyan-800 mb-2">💨 Wind Power Systems</h4>
        <p className="text-sm text-cyan-700">
          Wind turbine and wind farm infrastructure pricing for utility-scale deployments.
        </p>
      </div>

      {/* Editable Wind Turbines */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
        <h4 className="font-semibold text-white mb-4">Wind Turbines (Editable Pricing)</h4>
        <div className="grid gap-4">
          {editableWind.turbines.slice(0, 3).map((turbine) => (
            <div key={turbine.id} className="border border-white/[0.08] rounded-xl p-4">
              <div className="grid md:grid-cols-5 gap-4 items-center">
                <div>
                  <h5 className="font-semibold text-white">{turbine.model}</h5>
                  <p className="text-sm text-white/60">{turbine.manufacturer}</p>
                </div>
                <div>
                  <label className="block text-xs text-white/60">Power (kW)</label>
                  <input
                    type="number"
                    value={turbine.ratedPowerKW}
                    onChange={(e) =>
                      updateWindPrice(
                        "turbines",
                        turbine.id,
                        "ratedPowerKW",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-2 py-1 text-sm border border-white/[0.08] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">Price/kW ($)</label>
                  <input
                    type="number"
                    value={turbine.pricePerKW}
                    onChange={(e) => {
                      const newPricePerKW = parseInt(e.target.value);
                      updateWindPrice("turbines", turbine.id, "pricePerKW", newPricePerKW);
                      updateWindPrice(
                        "turbines",
                        turbine.id,
                        "totalPrice",
                        newPricePerKW * turbine.ratedPowerKW
                      );
                    }}
                    className="w-full px-2 py-1 text-sm border border-white/[0.08] rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60">Total Price ($)</label>
                  <input
                    type="number"
                    value={turbine.totalPrice}
                    onChange={(e) => {
                      const newTotalPrice = parseInt(e.target.value);
                      updateWindPrice("turbines", turbine.id, "totalPrice", newTotalPrice);
                      updateWindPrice(
                        "turbines",
                        turbine.id,
                        "pricePerKW",
                        Math.round(newTotalPrice / turbine.ratedPowerKW)
                      );
                    }}
                    className="w-full px-2 py-1 text-sm border border-white/[0.08] rounded"
                  />
                </div>
                <div className="text-right">
                  <p className="font-bold text-cyan-600">${turbine.pricePerKW}/kW</p>
                  <p className="text-xs text-white/40">${turbine.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
