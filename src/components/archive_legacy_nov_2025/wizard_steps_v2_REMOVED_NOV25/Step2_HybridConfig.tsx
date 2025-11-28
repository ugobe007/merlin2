import React from 'react';

interface Step2HybridConfigProps {
  selectedEquipment: string[];
  handleEquipmentToggle: (id: string) => void;
  solarMW: number;
  setSolarMW: (value: number) => void;
  windMW: number;
  setWindMW: (value: number) => void;
  generatorMW: number;
  setGeneratorMW: (value: number) => void;
  bessPowerMW: number;
  setBessPowerMW: (value: number) => void;
  duration: number;
  pcsIncluded: boolean;
  setPcsIncluded: (value: boolean) => void;
}

const Step2_HybridConfig: React.FC<Step2HybridConfigProps> = ({
  selectedEquipment,
  handleEquipmentToggle,
  solarMW,
  setSolarMW,
  windMW,
  setWindMW,
  generatorMW,
  setGeneratorMW,
  bessPowerMW,
  setBessPowerMW,
  duration,
  pcsIncluded,
  setPcsIncluded,
}) => {
  // Industry-standard pricing
  const batteryMWh = bessPowerMW * duration;
  const batteryPricePerKWh = bessPowerMW >= 5 ? 120 : 140; // Large vs Small BESS
  const bessCost = batteryMWh * 1000 * batteryPricePerKWh; // Convert to kWh
  const pcsCost = pcsIncluded ? 0 : bessPowerMW * 80000; // $80k/MW if not included
  
  const costs = {
    bess: bessCost + pcsCost,
    solar: solarMW * 800000, // $800k per MW
    wind: windMW * 1200000, // $1.2M per MW
    generator: generatorMW * 300000, // $300k per MW
  };

  const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Hybrid System Configuration</h2>
        <p className="text-gray-700 font-semibold">Configure your energy sources and power requirements</p>
      </div>

      <div className="space-y-6">
        {/* BESS Configuration - Always included */}
        <div className="bg-white p-6 rounded-xl shadow-xl border-2 border-blue-400">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-3xl mr-3">🔋</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">BESS (Battery Energy Storage)</h3>
                <p className="text-sm text-gray-700 font-medium">Core battery system - Required</p>
                <p className="text-xs text-blue-700 font-semibold mt-1">
                  ${batteryPricePerKWh}/kWh ({bessPowerMW >= 5 ? 'Large' : 'Small'} system pricing)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700 font-semibold">Estimated Cost</p>
              <p className="text-2xl font-bold text-blue-700">${(costs.bess).toLocaleString()}</p>
              <p className="text-xs text-gray-600 font-medium">{batteryMWh.toFixed(1)} MWh capacity</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                BESS Power Capacity (MW)
              </label>
              <input
                type="number"
                value={bessPowerMW}
                onChange={(e) => setBessPowerMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-blue-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
                min="0.1"
              />
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="pcs-included"
                checked={pcsIncluded}
                onChange={(e) => setPcsIncluded(e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
              />
              <label htmlFor="pcs-included" className="text-gray-800 font-medium cursor-pointer">
                PCS (Power Conversion System) included in BESS price
                <span className="text-blue-700 text-sm ml-2 font-semibold">
                  {!pcsIncluded && `(Add $${pcsCost.toLocaleString()})`}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Solar Configuration */}
        <div 
          className={`p-6 rounded-xl shadow-xl border-2 transition-all cursor-pointer ${
            selectedEquipment.includes('solar')
              ? 'bg-yellow-50 border-yellow-500'
              : 'bg-gray-50 border-gray-300 hover:border-yellow-400'
          }`}
          onClick={() => handleEquipmentToggle('solar')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEquipment.includes('solar')}
                onChange={() => {}}
                className="form-checkbox h-6 w-6 text-yellow-600 rounded mr-3"
              />
              <span className="text-3xl mr-3">☀️</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Solar Panels</h3>
                <p className="text-sm text-gray-700 font-medium">Photovoltaic power generation</p>
              </div>
            </div>
            {selectedEquipment.includes('solar') && (
              <div className="text-right">
                <p className="text-sm text-gray-700 font-semibold">Estimated Cost</p>
                <p className="text-2xl font-bold text-yellow-700">${costs.solar.toLocaleString()}</p>
              </div>
            )}
          </div>
          {selectedEquipment.includes('solar') && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Solar Capacity (MW)
              </label>
              <input
                type="number"
                value={solarMW}
                onChange={(e) => setSolarMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-yellow-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Wind Configuration */}
        <div 
          className={`p-6 rounded-xl shadow-xl border-2 transition-all cursor-pointer ${
            selectedEquipment.includes('wind')
              ? 'bg-cyan-50 border-cyan-500'
              : 'bg-gray-50 border-gray-300 hover:border-cyan-400'
          }`}
          onClick={() => handleEquipmentToggle('wind')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEquipment.includes('wind')}
                onChange={() => {}}
                className="form-checkbox h-6 w-6 text-cyan-600 rounded mr-3"
              />
              <span className="text-3xl mr-3">💨</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Wind Turbines</h3>
                <p className="text-sm text-gray-700 font-medium">Wind power generation</p>
              </div>
            </div>
            {selectedEquipment.includes('wind') && (
              <div className="text-right">
                <p className="text-sm text-gray-700 font-semibold">Estimated Cost</p>
                <p className="text-2xl font-bold text-cyan-700">${costs.wind.toLocaleString()}</p>
              </div>
            )}
          </div>
          {selectedEquipment.includes('wind') && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Wind Capacity (MW)
              </label>
              <input
                type="number"
                value={windMW}
                onChange={(e) => setWindMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-cyan-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium text-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Generator Configuration */}
        <div 
          className={`p-6 rounded-xl shadow-xl border-2 transition-all cursor-pointer ${
            selectedEquipment.includes('power-gen')
              ? 'bg-orange-50 border-orange-500'
              : 'bg-gray-50 border-gray-300 hover:border-orange-400'
          }`}
          onClick={() => handleEquipmentToggle('power-gen')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEquipment.includes('power-gen')}
                onChange={() => {}}
                className="form-checkbox h-6 w-6 text-orange-600 rounded mr-3"
              />
              <span className="text-3xl mr-3">⚡</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Backup Generator</h3>
                <p className="text-sm text-gray-700 font-medium">Diesel/gas power generation</p>
              </div>
            </div>
            {selectedEquipment.includes('power-gen') && (
              <div className="text-right">
                <p className="text-sm text-gray-700 font-semibold">Estimated Cost</p>
                <p className="text-2xl font-bold text-orange-700">${costs.generator.toLocaleString()}</p>
              </div>
            )}
          </div>
          {selectedEquipment.includes('power-gen') && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Generator Capacity (MW)
              </label>
              <input
                type="number"
                value={generatorMW}
                onChange={(e) => setGeneratorMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-orange-50 border-2 border-gray-300 rounded-xl text-gray-900 font-medium text-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Total Cost Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl shadow-xl border-2 border-purple-400">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Total System Cost</h3>
              <p className="text-sm text-gray-700 font-semibold">Equipment only (excludes installation)</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-purple-700">${totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2_HybridConfig;
