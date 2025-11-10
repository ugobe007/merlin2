import React from 'react';

interface SystemDetailsPanelProps {
  // System measurements
  actualDuration: number;
  standbyHours: number;
  totalMWh: number;
  pcsKW: number;
  annualEnergyMWh: number;
}

export default function SystemDetailsPanel({
  actualDuration,
  standbyHours,
  totalMWh,
  pcsKW,
  annualEnergyMWh,
}: SystemDetailsPanelProps) {
  return (
    <section className="rounded-2xl p-8 shadow-2xl border-2 border-cyan-300 bg-gradient-to-b from-cyan-50 via-blue-50 to-white relative overflow-hidden">
      <h2 className="text-3xl font-bold text-cyan-800 mb-6">System Details</h2>
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 flex justify-between items-center">
          <div>
            <div className="text-gray-800 font-semibold text-lg">Total Energy:</div>
            <div className="text-xs text-gray-600">
              Realistic Duration: {actualDuration.toFixed(1)}hr 
              {actualDuration !== standbyHours && (
                <span className="text-amber-600"> (adjusted from {standbyHours}hr)</span>
              )}
            </div>
          </div>
          <span className="font-bold text-blue-700 text-2xl">{totalMWh.toFixed(2)} MWh</span>
        </div>
        <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300 flex justify-between items-center">
          <span className="text-gray-800 font-semibold text-lg">PCS Power:</span>
          <span className="font-bold text-blue-800 text-2xl">{pcsKW.toFixed(2)} kW</span>
        </div>
        <div className="bg-cyan-50 p-4 rounded-xl border-2 border-cyan-200 flex justify-between items-center">
          <span className="text-gray-800 font-semibold text-lg">Annual Energy:</span>
          <span className="font-bold text-cyan-700 text-2xl">{annualEnergyMWh.toFixed(2)} MWh</span>
        </div>
      </div>
    </section>
  );
}