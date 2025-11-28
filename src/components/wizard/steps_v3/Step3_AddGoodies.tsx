/**
 * NEW Step 3: Add Goodies
 * Solar panels, EV chargers, generators, wind turbines
 * Each adds to the Power Profile ecosystem
 */

import React from 'react';
import { Sun, Car, Zap, Wind } from 'lucide-react';

interface Step3Props {
  solarMWp?: number;
  evChargerCount?: number;
  generatorKW?: number;
  windMWp?: number;
  onUpdateSolar?: (mwp: number) => void;
  onUpdateEV?: (count: number) => void;
  onUpdateGenerator?: (kw: number) => void;
  onUpdateWind?: (mwp: number) => void;
  onNext: () => void;
  onBack: () => void;
  // Conditional display based on user preferences from Step 1
  showSolar?: boolean;  // Based on wantsSolar from custom questions
  showEV?: boolean;     // Based on wantsEVCharging from custom questions
}

const Step3_AddGoodies: React.FC<Step3Props> = ({
  solarMWp = 0,
  evChargerCount = 0,
  generatorKW = 0,
  windMWp = 0,
  onUpdateSolar,
  onUpdateEV,
  onUpdateGenerator,
  onUpdateWind,
  onNext,
  onBack,
  showSolar = true,  // Default true for backward compatibility
  showEV = true      // Default true for backward compatibility
}) => {
  const hasAnyGoodies = solarMWp > 0 || evChargerCount > 0 || generatorKW > 0 || windMWp > 0;

  const handleNext = () => {
    // Auto-scroll to bottom before proceeding
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setTimeout(onNext, 300);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-5xl">✨</span>
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-pink-600">
              Add Extras
            </h2>
            <p className="text-gray-600 mt-2">
              Enhance your energy system (optional)
            </p>
          </div>
        </div>
      </div>

      {/* Goodies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Solar Panels - Only show if user expressed interest */}
        {showSolar && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Sun className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Solar Panels</h3>
              <p className="text-sm text-gray-600">Clean energy generation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Capacity</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{solarMWp.toFixed(1)}</p>
                <p className="text-xs text-gray-500">MWp</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={solarMWp}
                onChange={(e) => onUpdateSolar && onUpdateSolar(parseFloat(e.target.value))}
                className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(solarMWp / 10) * 100}%, #fef3c7 ${(solarMWp / 10) * 100}%, #fef3c7 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 MW</span>
                <span>10 MW</span>
              </div>
            </div>
            
            {solarMWp > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Annual Generation:</p>
                <p className="font-bold text-gray-900">{(solarMWp * 1500).toFixed(0)} MWh/year</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* EV Chargers - Only show if user expressed interest */}
        {showEV && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
              <Car className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">EV Chargers</h3>
              <p className="text-sm text-gray-600">Electric vehicle support</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Chargers</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{evChargerCount}</p>
                <p className="text-xs text-gray-500">Level 2</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={evChargerCount}
                onChange={(e) => onUpdateEV && onUpdateEV(parseInt(e.target.value))}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${(evChargerCount / 50) * 100}%, #d1fae5 ${(evChargerCount / 50) * 100}%, #d1fae5 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>50 chargers</span>
              </div>
            </div>
            
            {evChargerCount > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Total Capacity:</p>
                <p className="font-bold text-gray-900">{(evChargerCount * 7.2).toFixed(1)} kW</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Generator */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Generator</h3>
              <p className="text-sm text-gray-600">Backup power redundancy</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Capacity</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{generatorKW.toFixed(0)}</p>
                <p className="text-xs text-gray-500">kW</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={generatorKW}
                onChange={(e) => onUpdateGenerator && onUpdateGenerator(parseFloat(e.target.value))}
                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${(generatorKW / 5000) * 100}%, #fed7aa ${(generatorKW / 5000) * 100}%, #fed7aa 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 kW</span>
                <span>5,000 kW</span>
              </div>
            </div>
            
            {generatorKW > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Fuel Type:</p>
                <p className="font-bold text-gray-900">Natural Gas / Diesel</p>
              </div>
            )}
          </div>
        </div>

        {/* Wind Turbines */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wind className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Wind Turbines</h3>
              <p className="text-sm text-gray-600">Wind energy generation</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Capacity</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{windMWp.toFixed(1)}</p>
                <p className="text-xs text-gray-500">MWp</p>
              </div>
            </div>
            
            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={windMWp}
                onChange={(e) => onUpdateWind && onUpdateWind(parseFloat(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(windMWp / 10) * 100}%, #dbeafe ${(windMWp / 10) * 100}%, #dbeafe 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 MW</span>
                <span>10 MW</span>
              </div>
            </div>
            
            {windMWp > 0 && (
              <div className="bg-white rounded-lg p-3 text-sm">
                <p className="text-gray-600">Annual Generation:</p>
                <p className="font-bold text-gray-900">{(windMWp * 2500).toFixed(0)} MWh/year</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {hasAnyGoodies && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-6 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <span className="text-2xl">🎁</span>
            Your Enhanced System
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {solarMWp > 0 && (
              <div className="text-center">
                <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{solarMWp.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Solar</p>
              </div>
            )}
            {evChargerCount > 0 && (
              <div className="text-center">
                <Car className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{evChargerCount}</p>
                <p className="text-xs text-gray-600">EV Chargers</p>
              </div>
            )}
            {generatorKW > 0 && (
              <div className="text-center">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{generatorKW.toFixed(0)} kW</p>
                <p className="text-xs text-gray-600">Generator</p>
              </div>
            )}
            {windMWp > 0 && (
              <div className="text-center">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">{windMWp.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Wind</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skip Option */}
      {!hasAnyGoodies && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            No goodies selected. Your battery system works great on its own!
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
        >
          Next →
        </button>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Step3_AddGoodies;
