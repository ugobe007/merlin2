/**
 * Step 3: Configuration
 * Clean rebuild for V3 architecture
 */

import React from 'react';
import { Battery, Sun, Car, Zap } from 'lucide-react';
import type { BaseStepProps, BessSizing, EVConfiguration } from '../SmartWizardV3.types';

interface Step3Props extends BaseStepProps {
  sizing: BessSizing;
  onUpdateSizing: (updates: Partial<BessSizing>) => void;
  wantsSolar: boolean;
  onToggleSolar: (enabled: boolean) => void;
  wantsEV: boolean;
  onToggleEV: (enabled: boolean) => void;
  evConfig: EVConfiguration;
  onUpdateEVConfig: (config: Partial<EVConfiguration>) => void;
}

const Step3_Configuration: React.FC<Step3Props> = ({
  sizing,
  onUpdateSizing,
  wantsSolar,
  onToggleSolar,
  wantsEV,
  onToggleEV,
  evConfig,
  onUpdateEVConfig,
  onNext,
  onBack
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          ⚡ Configure Your Power Sources
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          Battery storage is calculated from your building needs. Now add Solar & EV charging (optional)
        </p>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium">
            💡 <strong>What happens next:</strong> Merlin will check if your configuration meets all power needs. If there's a gap, you can add backup generators in the next step.
          </p>
        </div>
      </div>

      {/* Battery Configuration */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Battery className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Battery Storage (Calculated)</h3>
              <p className="text-sm text-gray-600">Based on your building's power needs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Power (MW)</p>
            <p className="text-2xl font-bold text-blue-600">{sizing.storageSizeMW.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Duration (Hours)</p>
            <p className="text-2xl font-bold text-blue-600">{sizing.durationHours.toFixed(1)}</p>
          </div>
        </div>

        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-blue-600">{(sizing.storageSizeMW * sizing.durationHours).toFixed(2)} MWh</span> Total Energy Capacity
          </p>
        </div>
      </div>

      {/* SCROLL HINT */}
      <div className="bg-gradient-to-r from-yellow-50 via-green-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg p-4 text-center">
        <p className="text-lg font-bold text-purple-700 mb-1">👇 Add Renewable Power Sources Below 👇</p>
        <p className="text-sm text-gray-600">Solar panels & EV chargers (optional but recommended)</p>
      </div>

      {/* Solar Option */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${wantsSolar ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Sun className={`w-6 h-6 ${wantsSolar ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add Solar Power</h3>
              <p className="text-sm text-gray-600">Do you have solar, or want to add it? Reduces grid costs & qualifies for tax credits</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={wantsSolar}
              onChange={(e) => onToggleSolar(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {wantsSolar && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solar Capacity (MW)
            </label>
            <input
              type="number"
              value={sizing.solarMW || 0}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) {
                  onUpdateSizing({ solarMW: val });
                } else if (e.target.value === '') {
                  onUpdateSizing({ solarMW: 0 });
                }
              }}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        )}
      </div>

      {/* EV Charging Option */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${wantsEV ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Car className={`w-6 h-6 ${wantsEV ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Add EV Charging</h3>
              <p className="text-sm text-gray-600">Do you have EV chargers, or want to add them? Attracts customers & employees</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={wantsEV}
              onChange={(e) => onToggleEV(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {wantsEV && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Chargers
              </label>
              <input
                type="number"
                value={evConfig.chargers || 0}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    onUpdateEVConfig({ chargers: val });
                  } else if (e.target.value === '') {
                    onUpdateEVConfig({ chargers: 0 });
                  }
                }}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                kW per Charger
              </label>
              <input
                type="number"
                value={evConfig.kwPerCharger || 0}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    onUpdateEVConfig({ kwPerCharger: val });
                  } else if (e.target.value === '') {
                    onUpdateEVConfig({ kwPerCharger: 0 });
                  }
                }}
                min="0"
                step="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold shadow-md"
        >
          Continue to Location →
        </button>
      </div>
    </div>
  );
};

export default Step3_Configuration;
