import React from 'react';
import { formatCurrency } from '../../utils/calculationUtils';

interface PricingConfigurationPanelProps {
  // Pricing state
  batteryKwh: number;
  setBatteryKwh: (value: number) => void;
  pcsKW: number;  // This is actually pcsKw (price per kW)
  setPcsKW: (value: number) => void;
  bosPercent: number;
  setBosPercent: (value: number) => void;
  epcPercent: number;
  setEpcPercent: (value: number) => void;
  tariffPercent: number;
  setTariffPercent: (value: number) => void;
  
  // Solar & Wind
  solarMWp: number;
  setSolarMWp: (value: number) => void;
  solarKwp: number;
  setSolarKwp: (value: number) => void;
  windMW: number;
  setWindMW: (value: number) => void;
  windKw: number;
  setWindKw: (value: number) => void;
  
  // Generator
  generatorMW: number;
  setGeneratorMW: (value: number) => void;
  genKw: number;
  setGenKw: (value: number) => void;
  
  // PCS Factors
  onGridPcsFactor: number;
  setOnGridPcsFactor: (value: number) => void;
  offGridPcsFactor: number;
  setOffGridPcsFactor: (value: number) => void;
  
  // Project details
  powerMW: number;
  standbyHours: number;
  actualDuration: number;
  totalMWh: number;
  annualEnergyMWh: number;
  effectiveBatteryKwh: number;
  
  // Handlers
  handleResetToDefaults: () => void;
  
  // Display functions
  getCurrencySymbol: (currency: string) => string;
}

export default function PricingConfigurationPanel({
  // State props
  batteryKwh, setBatteryKwh,
  pcsKW, setPcsKW,
  bosPercent, setBosPercent,
  epcPercent, setEpcPercent,
  tariffPercent, setTariffPercent,
  solarMWp, setSolarMWp,
  solarKwp, setSolarKwp,
  windMW, setWindMW,
  windKw, setWindKw,
  generatorMW, setGeneratorMW,
  genKw, setGenKw,
  onGridPcsFactor, setOnGridPcsFactor,
  offGridPcsFactor, setOffGridPcsFactor,
  
  // Project details
  powerMW,
  standbyHours,
  actualDuration,
  totalMWh,
  annualEnergyMWh,
  effectiveBatteryKwh,
  
  // Handlers
  handleResetToDefaults,
  
  // Display functions
  getCurrencySymbol,
}: PricingConfigurationPanelProps) {
  const pcsKw = powerMW * 1000;

  return (
    <section className="rounded-2xl p-8 shadow-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 via-blue-100 to-white relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-900 bg-clip-text text-transparent drop-shadow-sm">
          Pricing Assumptions
        </h2>
        <button
          onClick={handleResetToDefaults}
          className="bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg transition-colors duration-200 border-b-4 border-orange-700 hover:border-orange-800 flex items-center space-x-2"
          title="Reset all values to default settings"
        >
          <span className="text-sm">🔄</span>
          <span>Reset</span>
        </button>
      </div>
      
      {/* Dynamic Pricing Info Box */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl border-2 border-green-400">
        <p className="text-sm font-bold text-gray-800 mb-2">💡 Dynamic Market Pricing Active</p>
        <p className="text-xs text-gray-700">
          Battery pricing auto-adjusts based on system size, duration, and location.
          Current rate: <strong className="text-blue-700">{formatCurrency(effectiveBatteryKwh)}/kWh</strong>
          {' '}({powerMW >= 2 ? 'Large Scale ≥2MW' : 'Small Scale <2MW'})
        </p>
      </div>
      
      {/* Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Battery Pricing */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg">
          <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <span>🔋</span> Battery System
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Battery Price ({getCurrencySymbol('USD')}/kWh)
              </label>
              <input
                type="number"
                value={batteryKwh}
                onChange={(e) => setBatteryKwh(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-emerald-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 text-lg font-semibold text-center"
                step="1"
                min="50"
                max="500"
              />
              <div className="text-xs text-emerald-600 mt-2">
                💰 Market Range: $120-180/kWh
              </div>
            </div>
          </div>
        </div>

        {/* PCS Pricing */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
            <span>⚡</span> PCS System
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PCS Price ({getCurrencySymbol('USD')}/kW)
              </label>
              <input
                type="number"
                value={pcsKW}
                onChange={(e) => setPcsKW(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white/80 text-lg font-semibold text-center"
                step="1"
                min="50"
                max="400"
              />
              <div className="text-xs text-blue-600 mt-2">
                💰 Market Range: $100-200/kW
              </div>
            </div>
          </div>
        </div>

        {/* System Integration */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-2xl border-2 border-purple-200 shadow-lg">
          <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
            <span>🔧</span> Integration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                BoS (% of Equipment)
              </label>
              <input
                type="number"
                value={(bosPercent * 100).toFixed(0)}
                onChange={(e) => setBosPercent(Number(e.target.value) / 100)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/80 text-lg font-semibold text-center"
                step="1"
                min="5"
                max="25"
              />
              <div className="text-xs text-purple-600 mt-2">
                💰 Typical Range: 10-15%
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                EPC (% of Equipment)
              </label>
              <input
                type="number"
                value={(epcPercent * 100).toFixed(0)}
                onChange={(e) => setEpcPercent(Number(e.target.value) / 100)}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white/80 text-lg font-semibold text-center"
                step="1"
                min="5"
                max="30"
              />
              <div className="text-xs text-purple-600 mt-2">
                💰 Typical Range: 12-18%
              </div>
            </div>
          </div>
        </div>

        {/* Renewable Energy Systems */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-2xl border-2 border-yellow-200 shadow-lg">
          <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
            <span>☀️</span> Solar System
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solar Price ({getCurrencySymbol('USD')}/kWp)
              </label>
              <input
                type="number"
                value={solarKwp}
                onChange={(e) => setSolarKwp(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 bg-white/80 text-lg font-semibold text-center"
                step="50"
                min="500"
                max="2000"
              />
              <div className="text-xs text-orange-600 mt-2">
                💰 Market Range: $800-1,200/kWp
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                System Size (MWp)
              </label>
              <input
                type="number"
                value={solarMWp}
                onChange={(e) => setSolarMWp(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 bg-white/80 text-lg font-semibold text-center"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Wind Energy Systems */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-100 p-6 rounded-2xl border-2 border-cyan-200 shadow-lg">
          <h3 className="text-xl font-bold text-cyan-800 mb-4 flex items-center gap-2">
            <span>💨</span> Wind System
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wind Price ({getCurrencySymbol('USD')}/kW)
              </label>
              <input
                type="number"
                value={windKw}
                onChange={(e) => setWindKw(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white/80 text-lg font-semibold text-center"
                step="50"
                min="800"
                max="2000"
              />
              <div className="text-xs text-cyan-600 mt-2">
                💰 Market Range: $1,000-1,500/kW
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                System Size (MW)
              </label>
              <input
                type="number"
                value={windMW}
                onChange={(e) => setWindMW(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-cyan-300 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white/80 text-lg font-semibold text-center"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Backup Generator */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Generator
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Generator Price ({getCurrencySymbol('USD')}/kW)
              </label>
              <input
                type="number"
                value={genKw}
                onChange={(e) => setGenKw(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white/80 text-lg font-semibold text-center"
                step="10"
                min="200"
                max="800"
              />
              <div className="text-xs text-gray-600 mt-2">
                💰 Market Range: $250-400/kW
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                System Size (MW)
              </label>
              <input
                type="number"
                value={generatorMW}
                onChange={(e) => setGeneratorMW(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-200 bg-white/80 text-lg font-semibold text-center"
                step="0.1"
                min="0"
                max="50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-2xl border-2 border-indigo-200 shadow-lg">
          <h3 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
            <span>⚡</span> PCS Configuration
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                On-Grid PCS Factor
              </label>
              <input
                type="number"
                value={onGridPcsFactor}
                onChange={(e) => setOnGridPcsFactor(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white/80 text-lg font-semibold text-center"
                step="0.05"
                min="0.5"
                max="2.0"
              />
              <div className="text-xs text-indigo-600 mt-2">
                Standard: 1.0 (Grid-tied systems)
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Off-Grid PCS Factor
              </label>
              <input
                type="number"
                value={offGridPcsFactor}
                onChange={(e) => setOffGridPcsFactor(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white/80 text-lg font-semibold text-center"
                step="0.05"
                min="0.5"
                max="2.0"
              />
              <div className="text-xs text-indigo-600 mt-2">
                Standard: 1.25 (Islanded systems)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-100 p-6 rounded-2xl border-2 border-red-200 shadow-lg">
          <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
            <span>📊</span> Financial
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tariffs (% of Total Cost)
              </label>
              <input
                type="number"
                value={(tariffPercent * 100).toFixed(0)}
                onChange={(e) => setTariffPercent(Number(e.target.value) / 100)}
                className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white/80 text-lg font-semibold text-center"
                step="1"
                min="0"
                max="25"
              />
              <div className="text-xs text-red-600 mt-2">
                Typical Range: 7-12%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-gradient-to-r from-slate-100 to-gray-200 p-6 rounded-2xl border-2 border-slate-300 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span>📋</span> System Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-100 p-4 rounded-xl border-2 border-green-300 flex justify-between items-center">
            <div>
              <span className="text-gray-800 font-semibold text-lg">Power Rating:</span>
              <div className="text-xs text-gray-600">AC Power Output</div>
            </div>
            <span className="font-bold text-green-700 text-2xl">{powerMW.toFixed(1)} MW</span>
          </div>
          <div className="bg-blue-100 p-4 rounded-xl border-2 border-blue-300 flex justify-between items-center">
            <div>
              <span className="text-gray-800 font-semibold text-lg">Energy Capacity:</span>
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
            <span className="font-bold text-blue-800 text-2xl">{pcsKw.toFixed(2)} kW</span>
          </div>
          <div className="bg-cyan-50 p-4 rounded-xl border-2 border-cyan-200 flex justify-between items-center">
            <span className="text-gray-800 font-semibold text-lg">Annual Energy:</span>
            <span className="font-bold text-cyan-700 text-2xl">{annualEnergyMWh.toFixed(2)} MWh</span>
          </div>
        </div>
      </div>
    </section>
  );
}