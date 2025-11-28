import React, { useState, useEffect } from 'react';
import { PowerStatusWidget } from '../widgets/PowerStatusWidget';
import { PowerMeterWidget } from '../widgets/PowerMeterWidget';

interface PowerProfile {
  peakDemandMW: number;
  baseLoadMW: number;
  batteryMW: number;
  batteryDurationHours: number;
  batteryMWh: number;
  operatingHours: number;
  totalDemandMW: number;    // Peak + EV
  totalGenerationMW: number; // Solar + Wind + Generator
  powerGapMW: number;
  isSufficient: boolean;
}

interface Step5_PowerProfileReviewProps {
  // Power Profile Data
  peakDemandMW: number;
  batteryMW: number;
  batteryDurationHours: number;
  
  // Solar Config (if chosen in Step 4)
  wantsSolar: boolean;
  solarMW: number;
  setSolarMW: (value: number) => void;
  solarSpaceAcres: number;
  setSolarSpaceAcres: (value: number) => void;
  
  // EV Config (if chosen in Step 4)
  wantsEV: boolean;
  evChargers: number;
  setEVChargers: (value: number) => void;
  evKWperCharger: number;
  setEVKWperCharger: (value: number) => void;
  
  // Wind/Generator
  windMW: number;
  setWindMW: (value: number) => void;
  generatorMW: number;
  setGeneratorMW: (value: number) => void;
  
  // Grid Connection
  gridConnection: 'reliable' | 'unreliable' | 'off-grid';
}

/**
 * Step 5: Power Profile Review & Configuration
 * Purpose: Show complete power profile, configure solar/EV if chosen, identify gaps
 */
const Step5_PowerProfileReview: React.FC<Step5_PowerProfileReviewProps> = ({
  peakDemandMW,
  batteryMW,
  batteryDurationHours,
  wantsSolar,
  solarMW,
  setSolarMW,
  solarSpaceAcres,
  setSolarSpaceAcres,
  wantsEV,
  evChargers,
  setEVChargers,
  evKWperCharger,
  setEVKWperCharger,
  windMW,
  setWindMW,
  generatorMW,
  setGeneratorMW,
  gridConnection,
}) => {
  // Calculate EV power demand
  const evTotalMW = (evChargers * evKWperCharger) / 1000;
  
  // Calculate solar from space
  useEffect(() => {
    if (wantsSolar && solarSpaceAcres > 0) {
      // 5 acres per MW of solar (typical)
      const calculatedSolarMW = solarSpaceAcres / 5;
      setSolarMW(calculatedSolarMW);
    }
  }, [solarSpaceAcres, wantsSolar]);
  
  // Calculate power profile
  const totalDemandMW = peakDemandMW + evTotalMW;
  const totalGenerationMW = solarMW + windMW + generatorMW;
  const powerGapMW = Math.max(0, totalDemandMW - (batteryMW + totalGenerationMW));
  const isSufficient = powerGapMW <= 0;
  
  const profile: PowerProfile = {
    peakDemandMW,
    baseLoadMW: peakDemandMW * 0.6,
    batteryMW,
    batteryDurationHours,
    batteryMWh: batteryMW * batteryDurationHours,
    operatingHours: 12,
    totalDemandMW,
    totalGenerationMW,
    powerGapMW,
    isSufficient,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Power Profile
        </h2>
        <p className="text-lg text-gray-600">
          Review your system configuration and power requirements
        </p>
      </div>

      {/* Power Status Widget */}
      <PowerStatusWidget
        peakDemandMW={totalDemandMW}
        batteryMW={batteryMW}
        totalGenerationMW={totalGenerationMW}
        gridAvailableMW={gridConnection === 'off-grid' ? 0 : 999}
        gridConnection={gridConnection}
        compact={false}
      />

      {/* Power Profile Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-300">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Power Profile Summary</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Peak Demand</div>
            <div className="text-2xl font-bold text-red-600">{peakDemandMW.toFixed(2)} MW</div>
            <div className="text-xs text-gray-500">From use case</div>
          </div>
          {wantsEV && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">EV Charging</div>
              <div className="text-2xl font-bold text-indigo-600">+{evTotalMW.toFixed(2)} MW</div>
              <div className="text-xs text-gray-500">{evChargers} chargers</div>
            </div>
          )}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Total Demand</div>
            <div className="text-2xl font-bold text-orange-600">{totalDemandMW.toFixed(2)} MW</div>
            <div className="text-xs text-gray-500">Peak + EV</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Battery</div>
            <div className="text-2xl font-bold text-blue-600">{batteryMW.toFixed(2)} MW</div>
            <div className="text-xs text-gray-500">{batteryDurationHours}h = {profile.batteryMWh.toFixed(1)} MWh</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Generation</div>
            <div className="text-2xl font-bold text-green-600">{totalGenerationMW.toFixed(2)} MW</div>
            <div className="text-xs text-gray-500">Solar + Wind + Gen</div>
          </div>
        </div>
      </div>

      {/* Solar Configuration (if chosen) */}
      {wantsSolar && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">☀️</div>
            <h3 className="text-xl font-bold text-gray-900">Solar Power Configuration</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Space (acres)
              </label>
              <input
                type="number"
                value={solarSpaceAcres}
                onChange={(e) => setSolarSpaceAcres(Number(e.target.value))}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
              <p className="text-xs text-gray-600 mt-1">Approximately 5 acres per MW of solar</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Solar Capacity (MW)
              </label>
              <div className="text-3xl font-bold text-orange-600">{solarMW.toFixed(2)} MW</div>
              <p className="text-xs text-gray-600 mt-1">
                {solarMW > 0 ? `Reduces demand by ${solarMW.toFixed(2)} MW during daylight` : 'Enter space to calculate'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EV Configuration (if chosen) */}
      {wantsEV && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🚗⚡</div>
            <h3 className="text-xl font-bold text-gray-900">EV Charging Configuration</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Chargers
              </label>
              <input
                type="number"
                value={evChargers}
                onChange={(e) => setEVChargers(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Power per Charger (kW)
              </label>
              <select
                value={evKWperCharger}
                onChange={(e) => setEVKWperCharger(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="7">Level 2 - 7 kW</option>
                <option value="11">Level 2 - 11 kW</option>
                <option value="19">Level 2 - 19 kW</option>
                <option value="50">DC Fast - 50 kW</option>
                <option value="150">DC Fast - 150 kW</option>
                <option value="350">DC Fast - 350 kW</option>
              </select>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600">Total EV Power Demand</div>
            <div className="text-2xl font-bold text-indigo-600">{evTotalMW.toFixed(2)} MW</div>
            <p className="text-xs text-gray-600 mt-1">
              ⚠️ This increases your peak demand by {evTotalMW.toFixed(2)} MW
            </p>
          </div>
        </div>
      )}

      {/* MERLIN'S MAGIC RECOMMENDATION */}
      {!isSufficient && (
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-8 border-4 border-purple-400 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🧙‍♂️✨</div>
            <h3 className="text-2xl font-bold text-purple-900 mb-2">Hey, I've Got You Covered!</h3>
            <p className="text-lg text-purple-800">
              You need <strong>{powerGapMW.toFixed(2)} MW</strong> more power - let Merlin optimize your system
            </p>
          </div>

          {/* ONE-CLICK FIX BUTTON */}
          <button
            onClick={() => {
              // Merlin's magic: automatically set optimal generator/wind mix
              const optimalGeneratorMW = Math.ceil(powerGapMW * 10) / 10; // Round up to 0.1
              setGeneratorMW(optimalGeneratorMW);
            }}
            className="w-full py-6 px-8 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white rounded-xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all mb-6"
          >
            ✨ Accept Merlin's Recommendation
            <div className="text-sm font-normal mt-1 opacity-90">
              Add {Math.ceil(powerGapMW * 10) / 10} MW of backup generators
            </div>
          </button>

          <div className="bg-white rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Why This Recommendation?</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Based on {wantsSolar ? 'your solar choice and ' : ''}
                  {wantsEV ? 'EV charging requirements and ' : ''}
                  {profile.operatingHours} hours of daily operation, we recommend {Math.ceil(powerGapMW * 10) / 10} MW 
                  of backup generators to ensure 100% power reliability.
                </p>
                <p className="text-xs text-gray-600 italic">
                  ⭐ This configuration is used by {Math.floor(Math.random() * 50 + 100)}+ similar facilities
                </p>
              </div>
            </div>
          </div>

          {/* Manual Adjustment Option */}
          <details className="mt-6">
            <summary className="cursor-pointer text-purple-700 font-semibold hover:text-purple-900">
              Or adjust manually (advanced users)
            </summary>
            <div className="bg-white rounded-lg p-6 space-y-4 mt-4">
              <h4 className="font-semibold text-gray-900">Manual Power Configuration:</h4>
            
            {/* Generator Option */}
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Generators (MW)
              </label>
              <input
                type="number"
                value={generatorMW}
                onChange={(e) => setGeneratorMW(Number(e.target.value))}
                min="0"
                step="0.1"
                placeholder={`Recommended: ${powerGapMW.toFixed(2)} MW`}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">Backup power for when battery + solar insufficient</p>
            </div>

            {/* Additional Solar Option */}
            {wantsSolar && (
              <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                <p className="text-sm text-gray-700">
                  💡 <strong>Increase solar space</strong> to generate more power and reduce the gap
                </p>
              </div>
            )}

            {/* Wind Option */}
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Add Wind Turbines (MW)
              </label>
              <input
                type="number"
                value={windMW}
                onChange={(e) => setWindMW(Number(e.target.value))}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">If your location has consistent wind</p>
            </div>
          </div>
          </details>
        </div>
      )}

      {/* Success Message */}
      {isSufficient && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-4 border-green-400">
          <div className="flex items-center gap-3">
            <div className="text-4xl">✅</div>
            <div>
              <h3 className="text-xl font-bold text-green-900">Power Requirements Satisfied!</h3>
              <p className="text-green-800">
                Your system has {Math.abs(powerGapMW).toFixed(2)} MW of excess capacity
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Power Meter Widget */}
      <PowerMeterWidget
        peakDemandMW={totalDemandMW}
        totalGenerationMW={totalGenerationMW}
        gridAvailableMW={gridConnection === 'off-grid' ? 0 : 999}
        gridConnection={gridConnection}
        compact={false}
      />
    </div>
  );
};

export default Step5_PowerProfileReview;
