import React, { useState, useEffect } from 'react';
import { calculateAutomatedSolarSizing, formatSolarCapacity } from '../../../utils/solarSizingUtils';
import type { BuildingCharacteristics } from '../../../utils/solarSizingUtils';

interface Step3_AddRenewablesProps {
  includeRenewables: boolean;
  setIncludeRenewables: (value: boolean) => void;
  solarMW: number;
  setSolarMW: (value: number) => void;
  windMW: number;
  setWindMW: (value: number) => void;
  generatorMW: number;
  setGeneratorMW: (value: number) => void;
  // Building characteristics for automated solar sizing
  useCase?: string;
  buildingSize?: string;
  facilitySize?: string;
  peakLoad?: number;
  electricalLoad?: number;
  useCaseAnswers?: Record<string, any>;
}

const Step3_AddRenewables: React.FC<Step3_AddRenewablesProps> = ({
  includeRenewables,
  setIncludeRenewables,
  solarMW,
  setSolarMW,
  windMW,
  setWindMW,
  generatorMW,
  setGeneratorMW,
  useCase,
  buildingSize,
  facilitySize,
  peakLoad,
  electricalLoad,
  useCaseAnswers,
}) => {
  
  const [solarSuggestion, setSolarSuggestion] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const hasAnyRenewable = solarMW > 0 || windMW > 0 || generatorMW > 0;

  // Calculate smart solar sizing suggestions
  useEffect(() => {
    if (useCase || buildingSize || facilitySize || peakLoad) {
      const characteristics: BuildingCharacteristics = {
        useCase,
        buildingSize,
        facilitySize,
        peakLoad,
        electricalLoad,
        capacity: useCaseAnswers?.capacity || useCaseAnswers?.electricalLoad,
        numRooms: useCaseAnswers?.numRooms,
        storageVolume: useCaseAnswers?.storageVolume,
        growingArea: useCaseAnswers?.growingArea,
        storeSize: useCaseAnswers?.storeSize,
        gamingFloorSize: useCaseAnswers?.gamingFloorSize,
      };
      
      const suggestion = calculateAutomatedSolarSizing(characteristics);
      setSolarSuggestion(suggestion);
      setShowSuggestions(true);
    }
  }, [useCase, buildingSize, facilitySize, peakLoad, electricalLoad, useCaseAnswers]);

  const getSpaceRequirement = (solarMW: number) => {
    // Rough estimate: 1 MW solar = ~5 acres
    const acres = solarMW * 5;
    const sqft = acres * 43560;
    if (sqft < 10000) return `${Math.round(sqft).toLocaleString()} sq ft`;
    return `${acres.toFixed(1)} acres`;
  };

  const applySuggestion = (suggestedMW: number) => {
    setSolarMW(suggestedMW);
    setIncludeRenewables(true);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-800">
          Add Renewable Energy? (Optional)
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Combine energy storage with solar, wind, or backup generators for maximum value
        </p>
      </div>

      {/* Toggle: Renewables or Storage Only */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => {
            setIncludeRenewables(false);
            setSolarMW(0);
            setWindMW(0);
            setGeneratorMW(0);
          }}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            !includeRenewables
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          🔋 Just Energy Storage
        </button>
        <button
          onClick={() => setIncludeRenewables(true)}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            includeRenewables
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          ⚡ Add Renewables
        </button>
      </div>

      {/* Smart Solar Sizing Suggestions */}
      {showSuggestions && solarSuggestion && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Smart Solar Sizing</h3>
              <p className="text-sm text-gray-600">AI-powered recommendations based on your building</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-700">{solarSuggestion.reasoning}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => applySuggestion(solarSuggestion.minMW)}
                className="bg-white border-2 border-yellow-300 rounded-lg p-4 hover:bg-yellow-50 transition-all"
              >
                <div className="text-lg font-bold text-yellow-700">Conservative</div>
                <div className="text-2xl font-bold text-yellow-600">{formatSolarCapacity(solarSuggestion.minMW, solarSuggestion.unitDisplay)}</div>
                <div className="text-xs text-gray-500">Minimal space usage</div>
              </button>
              
              <button
                onClick={() => applySuggestion(solarSuggestion.recommendedMW)}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-lg p-4 hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="text-lg font-bold">Recommended ⭐</div>
                <div className="text-2xl font-bold">{formatSolarCapacity(solarSuggestion.recommendedMW, solarSuggestion.unitDisplay)}</div>
                <div className="text-xs opacity-90">Optimal balance</div>
              </button>
              
              <button
                onClick={() => applySuggestion(solarSuggestion.maxMW)}
                className="bg-white border-2 border-yellow-300 rounded-lg p-4 hover:bg-yellow-50 transition-all"
              >
                <div className="text-lg font-bold text-yellow-700">Maximum</div>
                <div className="text-2xl font-bold text-yellow-600">{formatSolarCapacity(solarSuggestion.maxMW, solarSuggestion.unitDisplay)}</div>
                <div className="text-xs text-gray-500">Full potential</div>
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Space needed:</span> {solarSuggestion.spaceRequirement}
              </p>
            </div>
          </div>
        </div>
      )}

      {includeRenewables ? (
        <div className="space-y-6">
          {/* Solar Panel */}
          <div className="bg-white rounded-xl border-2 border-yellow-400 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">☀️</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Solar Power</h3>
                  <p className="text-sm text-gray-600">Photovoltaic panels</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-600">{formatSolarCapacity(solarMW)}</div>
                {solarMW > 0 && (
                  <div className="text-sm text-gray-500">
                    ~{getSpaceRequirement(solarMW)}
                  </div>
                )}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={solarMW}
              onChange={(e) => setSolarMW(parseFloat(e.target.value))}
              className="w-full h-3 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>0 MW (None)</span>
              <span>10 MW</span>
            </div>

            {solarMW > 0 && (
              <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Annual Generation:</span>
                    <span className="font-semibold">~{(solarMW * 1500).toLocaleString()} MWh/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Space Required:</span>
                    <span className="font-semibold">{getSpaceRequirement(solarMW)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Credit:</span>
                    <span className="font-semibold text-green-600">30% ITC</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wind Power */}
          <div className="bg-white rounded-xl border-2 border-cyan-400 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">💨</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Wind Power</h3>
                  <p className="text-sm text-gray-600">Wind turbines</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-600">{windMW.toFixed(1)} MW</div>
                {windMW > 0 && (
                  <div className="text-sm text-gray-500">
                    ~{Math.round(windMW / 2.5)} turbines
                  </div>
                )}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={windMW}
              onChange={(e) => setWindMW(parseFloat(e.target.value))}
              className="w-full h-3 bg-cyan-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>0 MW (None)</span>
              <span>10 MW</span>
            </div>

            {windMW > 0 && (
              <div className="mt-4 bg-cyan-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Annual Generation:</span>
                    <span className="font-semibold">~{(windMW * 2500).toLocaleString()} MWh/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Turbines Needed:</span>
                    <span className="font-semibold">~{Math.round(windMW / 2.5)} units (2.5 MW each)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Credit:</span>
                    <span className="font-semibold text-green-600">30% ITC</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Backup Generator */}
          <div className="bg-white rounded-xl border-2 border-orange-400 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">⚡</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Backup Generator</h3>
                  <p className="text-sm text-gray-600">Diesel/natural gas generator</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">{generatorMW.toFixed(1)} MW</div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={generatorMW}
              onChange={(e) => setGeneratorMW(parseFloat(e.target.value))}
              className="w-full h-3 bg-orange-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>0 MW (None)</span>
              <span>5 MW</span>
            </div>

            {generatorMW > 0 && (
              <div className="mt-4 bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Backup Capacity:</span>
                    <span className="font-semibold">{generatorMW.toFixed(1)} MW</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Runtime:</span>
                    <span className="font-semibold">24-48 hours (typical)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Use Case:</span>
                    <span className="font-semibold">Emergency backup power</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border-2 border-blue-400 p-12 shadow-lg text-center">
          <span className="text-6xl mb-4 block">🔋</span>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Energy Storage Only</h3>
          <p className="text-gray-600 max-w-xl mx-auto">
            Your system will store energy from the grid when prices are low and discharge when prices are high. 
            Perfect for peak shaving and demand charge reduction.
          </p>
        </div>
      )}

      {/* Summary */}
      {hasAnyRenewable && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            Your Hybrid Energy System
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            {solarMW > 0 && (
              <div>
                <div className="text-4xl mb-2">☀️</div>
                <div className="text-2xl font-bold text-yellow-600">{formatSolarCapacity(solarMW)}</div>
                <div className="text-sm text-gray-600">Solar Power</div>
              </div>
            )}
            {windMW > 0 && (
              <div>
                <div className="text-4xl mb-2">💨</div>
                <div className="text-2xl font-bold text-cyan-600">{windMW.toFixed(1)} MW</div>
                <div className="text-sm text-gray-600">Wind Power</div>
              </div>
            )}
            {generatorMW > 0 && (
              <div>
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-2xl font-bold text-orange-600">{generatorMW.toFixed(1)} MW</div>
                <div className="text-sm text-gray-600">Backup Generator</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Why Add Renewables?</h4>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>✓ <strong>Lower energy costs:</strong> Generate your own free electricity</li>
              <li>✓ <strong>30% tax credit:</strong> Federal ITC applies to paired systems</li>
              <li>✓ <strong>Energy independence:</strong> Reduce grid reliance</li>
              <li>✓ <strong>Sustainability:</strong> Achieve net-zero emissions goals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3_AddRenewables;
