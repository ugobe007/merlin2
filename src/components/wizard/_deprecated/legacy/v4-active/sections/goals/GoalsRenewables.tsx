// ═══════════════════════════════════════════════════════════════════════════
// GOALS RENEWABLES - Extracted Dec 16, 2025
// Solar and Wind configuration components
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Sun, Wind, Car, Sparkles, Info } from 'lucide-react';
import { 
  SOLAR_POWER_PRESETS, 
  WIND_POWER_PRESETS,
  SOLAR_TO_BESS_RATIO,
  WIND_TO_BESS_RATIO,
} from '../../constants/wizardConstants';
import type { SubComponentProps } from './GoalsSharedComponents';
import { PowerSlider, RoofSpaceWarning } from './GoalsSharedComponents';

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR TOGGLE - Enhanced Dec 2025 with existing solar capture
// ═══════════════════════════════════════════════════════════════════════════

export function SolarToggle({ wizardState, setWizardState, highlightForPower = false }: SubComponentProps) {
  // Highlight when user needs more power and hasn't selected solar yet
  const showHighlight = highlightForPower && !wizardState.wantsSolar && !wizardState.hasExistingSolar;
  
  return (
    <div className="space-y-4">
      {/* PART 1: Existing Solar */}
      <div className={`rounded-2xl p-6 border-2 transition-all ${
        wizardState.hasExistingSolar
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-lg shadow-green-500/20'
          : 'bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl ${wizardState.hasExistingSolar ? 'bg-green-500' : 'bg-gray-200'}`}>
            <Sun className={`w-6 h-6 ${wizardState.hasExistingSolar ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-lg">Do you have EXISTING solar panels?</h4>
            <p className="text-sm text-gray-500">Currently installed solar capacity</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWizardState(prev => ({ ...prev, hasExistingSolar: true, existingSolarKW: prev.existingSolarKW || 50 }))}
              className={`px-5 py-2.5 rounded-xl font-bold text-lg transition-all ${
                wizardState.hasExistingSolar === true ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >Yes</button>
            <button
              onClick={() => setWizardState(prev => ({ ...prev, hasExistingSolar: false, existingSolarKW: 0 }))}
              className={`px-5 py-2.5 rounded-xl font-bold text-lg transition-all ${
                wizardState.hasExistingSolar === false ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >No</button>
          </div>
        </div>
        
        {wizardState.hasExistingSolar && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              ☀️ How much solar capacity do you have installed?
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={wizardState.existingSolarKW || 50}
                onChange={(e) => setWizardState(prev => ({ ...prev, existingSolarKW: parseInt(e.target.value) }))}
                className="flex-1 h-4 rounded-full cursor-pointer accent-green-500"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((wizardState.existingSolarKW || 50)/500)*100}%, #e5e7eb ${((wizardState.existingSolarKW || 50)/500)*100}%, #e5e7eb 100%)`
                }}
              />
              <div className="bg-green-100 rounded-xl px-4 py-3 min-w-[120px] text-center border-2 border-green-300">
                <span className="text-3xl font-black text-green-600">{wizardState.existingSolarKW || 50}</span>
                <span className="text-green-500 text-sm ml-1">kW</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
              <span>5 kW</span>
              <span>500 kW</span>
            </div>
            
            {/* Existing solar stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/70 rounded-xl p-3 text-center border border-green-200">
                <p className="text-xs text-gray-500">Est. Daily Generation</p>
                <p className="font-bold text-green-600 text-lg">{((wizardState.existingSolarKW || 50) * 5).toLocaleString()} kWh</p>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center border border-green-200">
                <p className="text-xs text-gray-500">Annual Generation</p>
                <p className="font-bold text-green-600 text-lg">{Math.round((wizardState.existingSolarKW || 50) * 5 * 365 / 1000)} MWh</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* PART 2: Add MORE Solar */}
      <div className={`rounded-2xl p-6 border-2 transition-all relative overflow-hidden ${
        showHighlight
          ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-500 shadow-xl shadow-amber-500/40 animate-pulse ring-2 ring-amber-400 ring-offset-2'
          : wizardState.wantsSolar
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-lg shadow-amber-500/20'
            : 'bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200'
      }`}>
        {/* Highlight banner when needs more power */}
        {showHighlight && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold py-1 px-3 text-center">
            ⚡ RECOMMENDED - Add power to meet your needs!
          </div>
        )}
        
        <label className={`flex items-center gap-4 cursor-pointer ${showHighlight ? 'pt-6' : ''}`}>
          <input
            type="checkbox"
            checked={wizardState.wantsSolar}
            onChange={(e) => {
              const batteryKW = wizardState.batteryKW || 500;
              setWizardState(prev => ({
                ...prev,
                wantsSolar: e.target.checked,
                solarKW: e.target.checked ? Math.round(batteryKW * SOLAR_TO_BESS_RATIO) : 0
              }));
            }}
            className="w-6 h-6 rounded accent-amber-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sun className={`w-5 h-5 ${showHighlight ? 'text-amber-600 animate-bounce' : 'text-amber-500'}`} />
              <span className={`font-bold text-lg ${showHighlight ? 'text-amber-800' : 'text-gray-800'}`}>
                {wizardState.hasExistingSolar ? 'Add MORE Solar Panels' : 'Add Solar Panels'}
              </span>
              {showHighlight && (
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                  +Power!
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Generate your own power & maximize savings</p>
          </div>
          {wizardState.geoRecommendations && (
            <div className="text-right">
              <div className="text-amber-500 font-bold">{wizardState.geoRecommendations.profile.avgSolarHoursPerDay.toFixed(1)}h</div>
              <div className="text-xs text-gray-500">solar/day</div>
            </div>
          )}
        </label>

        {wizardState.wantsSolar && (
          <div className="mt-4 pt-4 border-t border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-amber-700 font-medium">Merlin recommends:</span>
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-xs">
                {Math.round((wizardState.batteryKW || 500) * SOLAR_TO_BESS_RATIO)} kW
              </span>
            </div>

            <PowerSlider
              value={wizardState.solarKW}
              onChange={(v) => setWizardState(prev => ({ ...prev, solarKW: v }))}
              presets={SOLAR_POWER_PRESETS}
              colorClass="amber"
              label="Solar kW"
            />

            <RoofSpaceWarning wizardState={wizardState} />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-xs text-gray-500">Est. Annual Gen</div>
                <div className="font-bold text-amber-700">
                  {Math.round((wizardState.solarKW || 0) * (wizardState.geoRecommendations?.profile.avgSolarHoursPerDay || 5) * 365 / 1000).toLocaleString()} MWh
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-xs text-gray-500">Voltage</div>
                <div className="font-bold text-amber-700">480V 3-Phase</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-xs text-gray-500">Est. Cost</div>
                <div className="font-bold text-amber-700">${((wizardState.solarKW || 0) * 1200).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR CANOPY TOGGLE (Dec 2025)
// Solar panels on parking canopy structure
// ═══════════════════════════════════════════════════════════════════════════

export function SolarCanopyToggle({ wizardState, setWizardState }: SubComponentProps) {
  // Calculate canopy kW from parking spaces (approx 3.5 kW per parking space)
  const canopyKW = (wizardState.solarCanopySpaces || 0) * 3.5;
  
  return (
    <div className={`rounded-2xl p-6 border-2 mb-4 transition-all ${
      wizardState.wantsSolarCanopy
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 shadow-lg shadow-green-500/20'
        : 'bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200'
    }`}>
      <label className="flex items-center gap-4 cursor-pointer">
        <input
          type="checkbox"
          checked={wizardState.wantsSolarCanopy}
          onChange={(e) => {
            setWizardState(prev => ({
              ...prev,
              wantsSolarCanopy: e.target.checked,
              solarCanopySpaces: e.target.checked ? 20 : 0  // Default 20 spaces
            }));
          }}
          className="w-6 h-6 rounded accent-green-500"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-green-500" />
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-gray-800">Add Solar Parking Canopy</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Shade vehicles + generate power (~3.5 kW per space)</p>
        </div>
      </label>

      {wizardState.wantsSolarCanopy && (
        <div className="mt-4 pt-4 border-t border-green-200 space-y-4">
          {/* Parking spaces slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of covered parking spaces
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={wizardState.solarCanopySpaces || 20}
                onChange={(e) => setWizardState(prev => ({
                  ...prev,
                  solarCanopySpaces: parseInt(e.target.value)
                }))}
                className="flex-1 h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="bg-green-100 rounded-xl px-4 py-2 min-w-[100px] text-center border-2 border-green-300">
                <span className="text-2xl font-black text-green-600">{wizardState.solarCanopySpaces || 20}</span>
                <span className="text-green-500 text-sm ml-1">spaces</span>
              </div>
            </div>
          </div>

          {/* Canopy stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Solar Capacity</div>
              <div className="font-bold text-green-700">{canopyKW.toFixed(0)} kW</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Annual Gen</div>
              <div className="font-bold text-green-700">
                {Math.round(canopyKW * 5 * 365 / 1000)} MWh
              </div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Cost</div>
              <div className="font-bold text-green-700">${(canopyKW * 2500).toLocaleString()}</div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 bg-green-100 rounded-lg">
            <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">
              Solar canopies provide shade, weather protection, and generate clean energy. 
              Great for EV charging stations and customer parking areas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WIND TOGGLE
// ═══════════════════════════════════════════════════════════════════════════

export function WindToggle({ wizardState, setWizardState }: SubComponentProps) {
  return (
    <div className={`rounded-2xl p-6 border-2 mb-4 transition-all ${
      wizardState.wantsWind
        ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400 shadow-lg shadow-sky-500/20'
        : 'bg-gradient-to-br from-sky-50/50 to-blue-50/50 border-sky-200'
    }`}>
      <label className="flex items-center gap-4 cursor-pointer">
        <input
          type="checkbox"
          checked={wizardState.wantsWind}
          onChange={(e) => {
            const batteryKW = wizardState.batteryKW || 500;
            setWizardState(prev => ({
              ...prev,
              wantsWind: e.target.checked,
              windTurbineKW: e.target.checked ? Math.round(batteryKW * WIND_TO_BESS_RATIO) : 0
            }));
          }}
          className="w-6 h-6 rounded accent-sky-500"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-sky-500" />
            <span className="font-bold text-gray-800">Add Wind Turbines</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Harness wind energy for 24/7 renewable generation</p>
        </div>
        {wizardState.geoRecommendations && (
          <div className="text-right">
            <div className="text-sky-500 font-bold">~{Math.round((wizardState.geoRecommendations.profile.windCapacityFactor || 0.25) * 30)} mph</div>
            <div className="text-xs text-gray-500">avg wind</div>
          </div>
        )}
      </label>

      {wizardState.wantsWind && (
        <div className="mt-4 pt-4 border-t border-sky-200 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span className="text-sky-700 font-medium">Merlin recommends:</span>
            <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold text-xs">
              {Math.round((wizardState.batteryKW || 500) * WIND_TO_BESS_RATIO)} kW
            </span>
          </div>

          <PowerSlider
            value={wizardState.windTurbineKW}
            onChange={(v) => setWizardState(prev => ({ ...prev, windTurbineKW: v }))}
            presets={WIND_POWER_PRESETS}
            colorClass="sky"
            label="Wind kW"
          />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Capacity Factor</div>
              <div className="font-bold text-sky-700">~25-35%</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Voltage</div>
              <div className="font-bold text-sky-700">480V 3-Phase</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-500">Est. Cost</div>
              <div className="font-bold text-sky-700">${((wizardState.windTurbineKW || 0) * 1800).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
