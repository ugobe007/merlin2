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
    <div className="p-4 text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Hybrid System Configuration</h2>
        <p className="text-purple-200">Configure your energy sources and power requirements</p>
      </div>

      <div className="space-y-6">
        {/* BESS Configuration - Always included */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 p-6 rounded-xl shadow-md border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-3xl mr-3">🔋</span>
              <div>
                <h3 className="text-xl font-semibold text-blue-300">BESS (Battery Energy Storage)</h3>
                <p className="text-sm text-blue-200">Core battery system - Required</p>
                <p className="text-xs text-blue-300 mt-1">
                  ${batteryPricePerKWh}/kWh ({bessPowerMW >= 5 ? 'Large' : 'Small'} system pricing)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-300">Estimated Cost</p>
              <p className="text-2xl font-bold text-blue-200">${(costs.bess).toLocaleString()}</p>
              <p className="text-xs text-blue-300">{batteryMWh.toFixed(1)} MWh capacity</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                BESS Power Capacity (MW)
              </label>
              <input
                type="number"
                value={bessPowerMW}
                onChange={(e) => setBessPowerMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-blue-500/30 rounded-lg text-white text-lg"
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
              <label htmlFor="pcs-included" className="text-white cursor-pointer">
                PCS (Power Conversion System) included in BESS price
                <span className="text-blue-300 text-sm ml-2">
                  {!pcsIncluded && `(Add $${pcsCost.toLocaleString()})`}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Solar Configuration */}
        <div 
          className={`p-6 rounded-xl shadow-md border-2 transition-all cursor-pointer ${
            selectedEquipment.includes('solar')
              ? 'bg-gradient-to-br from-yellow-900/40 to-orange-800/40 border-yellow-500/50'
              : 'bg-gray-800/30 border-gray-600/30 hover:border-yellow-500/30'
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
                <h3 className="text-xl font-semibold text-yellow-300">Solar Panels</h3>
                <p className="text-sm text-yellow-200">Photovoltaic power generation</p>
              </div>
            </div>
            {selectedEquipment.includes('solar') && (
              <div className="text-right">
                <p className="text-sm text-yellow-300">Estimated Cost</p>
                <p className="text-2xl font-bold text-yellow-200">${costs.solar.toLocaleString()}</p>
              </div>
            )}
          </div>
          {selectedEquipment.includes('solar') && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-yellow-200 mb-2">
                Solar Capacity (MW)
              </label>
              <input
                type="number"
                value={solarMW}
                onChange={(e) => setSolarMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-yellow-500/30 rounded-lg text-white text-lg"
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Wind Configuration */}
        <div 
          className={`p-6 rounded-xl shadow-md border-2 transition-all cursor-pointer ${
            selectedEquipment.includes('wind')
              ? 'bg-gradient-to-br from-cyan-900/40 to-blue-800/40 border-cyan-500/50'
              : 'bg-gray-800/30 border-gray-600/30 hover:border-cyan-500/30'
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
                <h3 className="text-xl font-semibold text-cyan-300">Wind Turbines</h3>
                <p className="text-sm text-cyan-200">Wind power generation</p>
              </div>
            </div>
            {selectedEquipment.includes('wind') && (
              <div className="text-right">
                <p className="text-sm text-cyan-300">Estimated Cost</p>
                <p className="text-2xl font-bold text-cyan-200">${costs.wind.toLocaleString()}</p>
              </div>
            )}
          </div>
          {selectedEquipment.includes('wind') && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-cyan-200 mb-2">
                Wind Capacity (MW)
              </label>
              <input
                type="number"
                value={windMW}
                onChange={(e) => setWindMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white text-lg"
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Generator Configuration */}
        <div 
          className={`p-6 rounded-xl shadow-md border-2 transition-all cursor-pointer ${
            selectedEquipment.includes('power-gen')
              ? 'bg-gradient-to-br from-red-900/40 to-orange-800/40 border-red-500/50'
              : 'bg-gray-800/30 border-gray-600/30 hover:border-red-500/30'
          }`}
          onClick={() => handleEquipmentToggle('power-gen')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedEquipment.includes('power-gen')}
                onChange={() => {}}
                className="form-checkbox h-6 w-6 text-red-600 rounded mr-3"
              />
              <span className="text-3xl mr-3">⚡</span>
              <div>
                <h3 className="text-xl font-semibold text-red-300">Backup Generator</h3>
                <p className="text-sm text-red-200">Diesel/gas power generation</p>
              </div>
            </div>
            {selectedEquipment.includes('power-gen') && (
              <div className="text-right">
                <p className="text-sm text-red-300">Estimated Cost</p>
                <p className="text-2xl font-bold text-red-200">${costs.generator.toLocaleString()}</p>
              </div>
            )}
          </div>
          {selectedEquipment.includes('power-gen') && (
            <div onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium text-red-200 mb-2">
                Generator Capacity (MW)
              </label>
              <input
                type="number"
                value={generatorMW}
                onChange={(e) => setGeneratorMW(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800/50 border border-red-500/30 rounded-lg text-white text-lg"
                step="0.1"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Total Cost Summary */}
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 rounded-xl shadow-lg border-2 border-purple-500/50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-purple-300">Total System Cost</h3>
              <p className="text-sm text-purple-200">Equipment only (excludes installation)</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-purple-200">${totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2_HybridConfig;
