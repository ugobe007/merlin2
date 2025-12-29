/**
 * Battery Configuration Modal
 * Simple sliders for power users to adjust battery specs in Step 2
 * Saves to Power Profile without breaking main workflow
 */

import React, { useState, useEffect } from 'react';
import { X, Sliders, Battery, Clock, Zap, Info } from 'lucide-react';

interface BatteryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPowerMW: number;
  currentDurationHours: number;
  onSave: (powerMW: number, durationHours: number) => void;
}

const BatteryConfigModal: React.FC<BatteryConfigModalProps> = ({
  isOpen,
  onClose,
  currentPowerMW,
  currentDurationHours,
  onSave
}) => {
  const [powerMW, setPowerMW] = useState(currentPowerMW);
  const [durationHours, setDurationHours] = useState(currentDurationHours);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Optional advanced settings
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [voltage, setVoltage] = useState<'480V' | '4160V' | '13.8kV'>('480V');
  const [cRate, setCRate] = useState(0.5); // 0.25C to 2C
  const [efficiency, setEfficiency] = useState(90); // 85-95%

  useEffect(() => {
    setPowerMW(currentPowerMW);
    setDurationHours(currentDurationHours);
    setHasChanges(false);
  }, [currentPowerMW, currentDurationHours, isOpen]);

  const energyCapacity = powerMW * durationHours;

  const handleSave = () => {
    onSave(powerMW, durationHours);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setPowerMW(currentPowerMW);
    setDurationHours(currentDurationHours);
    setHasChanges(false);
  };

  const handlePowerChange = (value: number) => {
    setPowerMW(value);
    setHasChanges(true);
  };

  const handleDurationChange = (value: number) => {
    setDurationHours(value);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Advanced Configuration</h2>
              <p className="text-sm text-blue-100">Fine-tune your battery system specs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Info Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900 mb-1">Power User Controls</p>
              <p>These settings override Merlin's recommendations. Adjust only if you have specific requirements or constraints.</p>
            </div>
          </div>

          {/* Power Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                Power Output
              </label>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{powerMW.toFixed(2)} MW</div>
                <div className="text-sm text-gray-500">{(powerMW * 1000).toFixed(0)} kW</div>
              </div>
            </div>
            
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={powerMW}
              onChange={(e) => handlePowerChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${(powerMW / 10) * 100}%, rgb(219, 234, 254) ${(powerMW / 10) * 100}%, rgb(219, 234, 254) 100%)`
              }}
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.1 MW</span>
              <span>5 MW</span>
              <span>10 MW</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-600" />
                Storage Duration
              </label>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{durationHours.toFixed(1)} hrs</div>
                <div className="text-sm text-gray-500">{(durationHours * 60).toFixed(0)} minutes</div>
              </div>
            </div>
            
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={durationHours}
              onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(durationHours / 8) * 100}%, rgb(243, 232, 255) ${(durationHours / 8) * 100}%, rgb(243, 232, 255) 100%)`
              }}
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0.5 hrs</span>
              <span>4 hrs</span>
              <span>8 hrs</span>
            </div>
          </div>

          {/* Calculated Energy Capacity */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Battery className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Energy Capacity</p>
                  <p className="text-2xl font-bold text-green-600">{energyCapacity.toFixed(2)} MWh</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{(energyCapacity * 1000).toFixed(0)} kWh</p>
              </div>
            </div>
          </div>

          {/* System Type Indicator */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">System Classification</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-semibold text-gray-900">
                  {durationHours < 2 ? '⚡ Peak Shaving' : 
                   durationHours < 4 ? '🔄 Load Shifting' : 
                   '🔋 Long Duration Storage'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Application:</span>
                <span className="font-semibold text-gray-900">
                  {powerMW < 1 ? 'Small Commercial' :
                   powerMW < 3 ? 'Large Commercial' :
                   powerMW < 5 ? 'Small Industrial' :
                   'Large Industrial / Utility'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Est. Battery Racks:</span>
                <span className="font-semibold text-gray-900">
                  {Math.ceil(energyCapacity / 0.5)} racks
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Tools Toggle */}
          <div className="border-t-2 border-gray-200 pt-6">
            <button
              onClick={() => setShowAdvancedTools(!showAdvancedTools)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 rounded-xl transition-all border-2 border-purple-200"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-gray-900">Optional Advanced Tools</span>
                <span className="text-xs text-gray-500 ml-2">(for power users)</span>
              </div>
              <span className="text-2xl text-purple-600">{showAdvancedTools ? '▼' : '▶'}</span>
            </button>
            
            {showAdvancedTools && (
              <div className="mt-4 space-y-6 animate-fade-in bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-6 border-2 border-purple-200 shadow-inner">
                {/* Voltage Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    Voltage Level (Optional)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['480V', '4160V', '13.8kV'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          setVoltage(v);
                          setHasChanges(true);
                        }}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                          voltage === v
                            ? 'bg-purple-500 text-white shadow-lg ring-2 ring-purple-300'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">System voltage configuration</p>
                </div>

                {/* C-Rate Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900">Charge/Discharge Rate (C-Rate)</label>
                    <span className="text-lg font-bold text-indigo-600">{cRate.toFixed(2)}C</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="2"
                    step="0.25"
                    value={cRate}
                    onChange={(e) => {
                      setCRate(parseFloat(e.target.value));
                      setHasChanges(true);
                    }}
                    className="w-full h-3 bg-gradient-to-r from-indigo-200 to-indigo-400 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(129, 140, 248) 0%, rgb(129, 140, 248) ${((cRate - 0.25) / 1.75) * 100}%, rgb(224, 231, 255) ${((cRate - 0.25) / 1.75) * 100}%, rgb(224, 231, 255) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.25C (Slow)</span>
                    <span>1C (Standard)</span>
                    <span>2C (Fast)</span>
                  </div>
                  <p className="text-xs text-gray-500">Higher C-rates enable faster charging but may reduce battery lifespan</p>
                </div>

                {/* Round-trip Efficiency Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-900">Round-Trip Efficiency</label>
                    <span className="text-lg font-bold text-green-600">{efficiency}%</span>
                  </div>
                  <input
                    type="range"
                    min="85"
                    max="95"
                    step="1"
                    value={efficiency}
                    onChange={(e) => {
                      setEfficiency(parseInt(e.target.value));
                      setHasChanges(true);
                    }}
                    className="w-full h-3 bg-gradient-to-r from-green-200 to-green-400 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(34, 197, 94) 0%, rgb(34, 197, 94) ${((efficiency - 85) / 10) * 100}%, rgb(220, 252, 231) ${((efficiency - 85) / 10) * 100}%, rgb(220, 252, 231) 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>85%</span>
                    <span>90%</span>
                    <span>95%</span>
                  </div>
                  <p className="text-xs text-gray-500">Percentage of energy recovered during charge-discharge cycle</p>
                </div>

                {/* Advanced Settings Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600" />
                    Advanced Configuration Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-gray-600 mb-1">Voltage:</p>
                      <p className="font-bold text-gray-900 text-sm">{voltage}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-gray-600 mb-1">C-Rate:</p>
                      <p className="font-bold text-gray-900 text-sm">{cRate.toFixed(2)}C</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="text-gray-600 mb-1">Efficiency:</p>
                      <p className="font-bold text-gray-900 text-sm">{efficiency}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Changes Indicator */}
          {hasChanges && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 animate-fade-in">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>You have unsaved changes. Click <strong>Save Changes</strong> to apply them to your Power Profile.</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-6 rounded-b-2xl flex items-center justify-between">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              hasChanges
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Reset to Recommended
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid currentColor;
        }
        
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 3px solid currentColor;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BatteryConfigModal;
