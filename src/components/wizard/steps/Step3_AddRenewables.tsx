import React, { useState, useEffect } from 'react';
import { calculateAutomatedSolarSizing, formatSolarCapacity } from '@/utils/solarSizingUtils';
import type { BuildingCharacteristics } from '@/utils/solarSizingUtils';

interface Step3_AddRenewablesProps {
  includeRenewables: boolean;
  setIncludeRenewables: (value: boolean) => void;
  solarMW: number;
  setSolarMW: (value: number) => void;
  windMW: number;
  setWindMW: (value: number) => void;
  generatorMW: number;
  setGeneratorMW: (value: number) => void;
  // Solar space configuration
  solarSpaceConfig: {
    spaceType: 'rooftop' | 'ground' | 'canopy' | 'mixed';
    rooftopSqFt?: number;
    groundAcres?: number;
    useAI: boolean;
  };
  setSolarSpaceConfig: (value: any) => void;
  // EV Charger configuration
  evChargerConfig: {
    level2_11kw: number;
    level2_19kw: number;
    dcfast_50kw: number;
    dcfast_150kw: number;
    dcfast_350kw: number;
  };
  setEVChargerConfig: (value: any) => void;
  // Wind turbine configuration
  windConfig: {
    turbineSize: '2.5' | '3.0' | '5.0';
    numberOfTurbines: number;
    useAI: boolean;
  };
  setWindConfig: (value: any) => void;
  // Generator configuration
  generatorConfig: {
    generatorType: 'diesel' | 'natural-gas' | 'dual-fuel';
    numberOfUnits: number;
    sizePerUnit: number;
    useAI: boolean;
  };
  setGeneratorConfig: (value: any) => void;
  // Building characteristics for automated solar sizing
  useCase?: string;
  buildingSize?: string;
  facilitySize?: string;
  peakLoad?: number;
  electricalLoad?: number;
  useCaseAnswers?: Record<string, any>;
}

type SolarSpaceType = 'rooftop' | 'ground' | 'canopy' | 'mixed';
type EVChargerType = 'level2' | 'dcfast50' | 'dcfast150' | 'dcfast350';

const Step3_AddRenewables: React.FC<Step3_AddRenewablesProps> = ({
  includeRenewables,
  setIncludeRenewables,
  solarMW,
  setSolarMW,
  windMW,
  setWindMW,
  generatorMW,
  setGeneratorMW,
  solarSpaceConfig,
  setSolarSpaceConfig,
  evChargerConfig,
  setEVChargerConfig,
  windConfig,
  setWindConfig,
  generatorConfig,
  setGeneratorConfig,
  useCase,
  buildingSize,
  facilitySize,
  peakLoad,
  electricalLoad,
  useCaseAnswers,
}) => {
  
  const [solarSuggestion, setSolarSuggestion] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // UI toggle states (these can stay local)
  const [showSpaceInput, setShowSpaceInput] = useState(false);
  const [showEVConfig, setShowEVConfig] = useState(false);
  const [showWindConfig, setShowWindConfig] = useState(false);
  const [showGeneratorConfig, setShowGeneratorConfig] = useState(false);
  
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
        <a 
          href="https://www.nrel.gov/docs/fy21osti/77324.pdf" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          <span>📊</span>
          <span>View NREL Calculation Methodology</span>
          <span>↗</span>
        </a>
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

            {/* Solar Space Configuration */}
            {solarMW > 0 && (
              <div className="mt-4 space-y-4">
                <button
                  onClick={() => setShowSpaceInput(!showSpaceInput)}
                  className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📐</span>
                    <span className="font-semibold text-gray-800">Configure Solar Space</span>
                  </div>
                  <span className="text-gray-500">{showSpaceInput ? '▼' : '▶'}</span>
                </button>

                {showSpaceInput && (
                  <div className="bg-yellow-50 p-4 rounded-lg space-y-4">
                    {/* AI vs Manual Toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSolarSpaceConfig({...solarSpaceConfig, useAI: true})}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                          solarSpaceConfig.useAI
                            ? 'bg-yellow-500 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        🤖 AI Calculate Space
                      </button>
                      <button
                        onClick={() => setSolarSpaceConfig({...solarSpaceConfig, useAI: false})}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                          !solarSpaceConfig.useAI
                            ? 'bg-yellow-500 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        ✏️ Enter My Space
                      </button>
                    </div>

                    {solarSpaceConfig.useAI ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700">
                          AI will estimate available space based on your building type and size
                        </p>
                        
                        {/* Installation Type Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Installation Type:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {['rooftop', 'ground', 'canopy', 'mixed'].map((type) => (
                              <button
                                key={type}
                                onClick={() => setSolarSpaceConfig({...solarSpaceConfig, spaceType: type as any})}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  solarSpaceConfig.spaceType === type
                                    ? 'border-yellow-500 bg-yellow-50'
                                    : 'border-gray-200 hover:border-yellow-300'
                                }`}
                              >
                                <div className="text-lg mb-1">
                                  {type === 'rooftop' && '🏢'}
                                  {type === 'ground' && '🌿'}
                                  {type === 'canopy' && '☂️'}
                                  {type === 'mixed' && '🔄'}
                                </div>
                                <div className="text-xs font-medium capitalize">{type}</div>
                                <div className="text-xs text-gray-500">
                                  {type === 'rooftop' && '100 sqft/kW'}
                                  {type === 'ground' && '200 sqft/kW'}
                                  {type === 'canopy' && '150 sqft/kW'}
                                  {type === 'mixed' && 'Combined'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* AI Space Analysis */}
                        <div className="bg-white p-3 rounded border border-yellow-200">
                          <div className="text-xs font-semibold text-yellow-800 mb-2">AI Space Analysis:</div>
                          <div className="text-sm text-gray-700 space-y-1">
                            {solarSpaceConfig.spaceType === 'rooftop' && (
                              <>
                                <div>• Required: {Math.round(solarMW * 1000 * 100).toLocaleString()} sq ft</div>
                                <div>• Typical {useCase || 'building'}: {(() => {
                                  const typical = useCase === 'hotel' ? '50,000' : '100,000';
                                  return typical;
                                })()} sq ft available</div>
                                <div className="text-green-600 font-medium">
                                  ✓ {solarMW * 1000 * 100 < (useCase === 'hotel' ? 50000 : 100000) ? 'Space available' : 'Limited space'}
                                </div>
                              </>
                            )}
                            {solarSpaceConfig.spaceType === 'ground' && (
                              <>
                                <div>• Required: {(solarMW * 1000 * 200 / 43560).toFixed(2)} acres</div>
                                <div>• Ground-mount feasibility: {solarMW < 5 ? 'Excellent' : 'Requires planning'}</div>
                              </>
                            )}
                            {solarSpaceConfig.spaceType === 'canopy' && (
                              <>
                                <div>• Parking canopy installation</div>
                                <div>• Dual-purpose: Solar + weather protection</div>
                                <div>• Required: {Math.round(solarMW * 1000 * 150).toLocaleString()} sq ft parking area</div>
                              </>
                            )}
                            {solarSpaceConfig.spaceType === 'mixed' && (
                              <>
                                <div>• Optimized mix of rooftop and ground</div>
                                <div>• Maximizes available space usage</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-700 font-medium">
                          Enter your available space:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Rooftop Space (sq ft)
                            </label>
                            <input
                              type="number"
                              value={solarSpaceConfig.rooftopSqFt || ''}
                              onChange={(e) => setSolarSpaceConfig({...solarSpaceConfig, rooftopSqFt: parseFloat(e.target.value) || undefined})}
                              placeholder="50,000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Can fit: ~{Math.floor((solarSpaceConfig.rooftopSqFt || 0) / 100)}kW
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Ground Space (acres)
                            </label>
                            <input
                              type="number"
                              value={solarSpaceConfig.groundAcres || ''}
                              onChange={(e) => setSolarSpaceConfig({...solarSpaceConfig, groundAcres: parseFloat(e.target.value) || undefined})}
                              placeholder="5"
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              Can fit: ~{Math.floor(((solarSpaceConfig.groundAcres || 0) * 43560) / 200)}kW
                            </div>
                          </div>
                        </div>

                        {/* Space Validation */}
                        {(solarSpaceConfig.rooftopSqFt || solarSpaceConfig.groundAcres) && (
                          <div className="bg-white p-3 rounded border border-yellow-200">
                            <div className="text-xs font-semibold text-yellow-800 mb-1">Space Check:</div>
                            <div className="text-sm">
                              {(() => {
                                const reqSqFt = solarMW * 1000 * 100; // Rooftop requirement
                                const reqAcres = solarMW * 1000 * 200 / 43560; // Ground requirement
                                const availRoof = solarSpaceConfig.rooftopSqFt || 0;
                                const availGround = solarSpaceConfig.groundAcres || 0;
                                
                                if (availRoof >= reqSqFt || availGround >= reqAcres) {
                                  return <span className="text-green-600 font-medium">✓ Sufficient space available!</span>;
                                } else {
                                  const maxFromRoof = availRoof / 100 / 1000; // MW
                                  const maxFromGround = (availGround * 43560) / 200 / 1000; // MW
                                  const maxTotal = maxFromRoof + maxFromGround;
                                  return (
                                    <span className="text-orange-600">
                                      ⚠️ Limited to ~{maxTotal.toFixed(2)} MW with available space. 
                                      Consider reducing solar or expanding space.
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                    ~{Math.round(windMW / parseFloat(windConfig.turbineSize))} turbines
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
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setShowWindConfig(!showWindConfig)}
                  className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  {showWindConfig ? 'Hide Configuration' : 'Configure Turbines'}
                </button>

                {showWindConfig && (
                  <div className="bg-cyan-50 p-4 rounded-lg space-y-4">
                    {/* AI vs Manual Selection */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setWindConfig({...windConfig, useAI: true})}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                          windConfig.useAI
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-cyan-600 border border-cyan-300'
                        }`}
                      >
                        🤖 AI Optimize
                      </button>
                      <button
                        onClick={() => setWindConfig({...windConfig, useAI: false})}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                          !windConfig.useAI
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-cyan-600 border border-cyan-300'
                        }`}
                      >
                        ⚙️ Manual Config
                      </button>
                    </div>

                    {/* Turbine Size Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Turbine Size
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['2.5', '3.0', '5.0'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => {
                              setWindConfig({...windConfig, turbineSize: size});
                              // Recalculate number of turbines based on total MW
                              const turbines = Math.ceil(windMW / parseFloat(size));
                              setWindConfig({...windConfig, turbineSize: size, numberOfTurbines: turbines});
                            }}
                            className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                              windConfig.turbineSize === size
                                ? 'bg-cyan-600 text-white'
                                : 'bg-white text-cyan-700 border border-cyan-300 hover:border-cyan-500'
                            }`}
                          >
                            <div className="font-bold">{size} MW</div>
                            <div className="text-xs opacity-80">
                              {size === '2.5' ? 'Standard' : size === '3.0' ? 'Medium' : 'Large'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Number of Turbines (Manual Mode) */}
                    {!windConfig.useAI && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Number of Turbines: {windConfig.numberOfTurbines}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={windConfig.numberOfTurbines}
                          onChange={(e) => {
                            const turbines = parseInt(e.target.value);
                            setWindConfig({...windConfig, numberOfTurbines: turbines});
                            // Update total MW based on turbine count
                            setWindMW(turbines * parseFloat(windConfig.turbineSize));
                          }}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Wind Summary */}
                    <div className="bg-white p-3 rounded border border-cyan-200">
                      <div className="text-sm text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Turbine Size:</span>
                          <span className="font-semibold">{windConfig.turbineSize} MW each</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Turbines:</span>
                          <span className="font-semibold">
                            {Math.ceil(windMW / parseFloat(windConfig.turbineSize))} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Generation:</span>
                          <span className="font-semibold">~{(windMW * 2500).toLocaleString()} MWh/year</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Capacity Factor:</span>
                          <span className="font-semibold">~29%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax Credit:</span>
                          <span className="font-semibold text-green-600">30% ITC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!showWindConfig && (
                  <div className="bg-cyan-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Annual Generation:</span>
                        <span className="font-semibold">~{(windMW * 2500).toLocaleString()} MWh/year</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Turbines Needed:</span>
                        <span className="font-semibold">~{Math.round(windMW / parseFloat(windConfig.turbineSize))} units ({windConfig.turbineSize} MW each)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Credit:</span>
                        <span className="font-semibold text-green-600">30% ITC</span>
                      </div>
                    </div>
                  </div>
                )}
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
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setShowGeneratorConfig(!showGeneratorConfig)}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  {showGeneratorConfig ? 'Hide Configuration' : 'Configure Generators'}
                </button>

                {showGeneratorConfig && (
                  <div className="bg-orange-50 p-4 rounded-lg space-y-4">
                    {/* AI vs Manual Selection */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setGeneratorConfig({...generatorConfig, useAI: true})}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                          generatorConfig.useAI
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-orange-600 border border-orange-300'
                        }`}
                      >
                        🤖 AI Optimize
                      </button>
                      <button
                        onClick={() => setGeneratorConfig({...generatorConfig, useAI: false})}
                        className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                          !generatorConfig.useAI
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-orange-600 border border-orange-300'
                        }`}
                      >
                        ⚙️ Manual Config
                      </button>
                    </div>

                    {/* Generator Type Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Generator Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['diesel', 'natural-gas', 'dual-fuel'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setGeneratorConfig({...generatorConfig, generatorType: type})}
                            className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                              generatorConfig.generatorType === type
                                ? 'bg-orange-600 text-white'
                                : 'bg-white text-orange-700 border border-orange-300 hover:border-orange-500'
                            }`}
                          >
                            <div className="font-bold">
                              {type === 'diesel' ? '🛢️ Diesel' : type === 'natural-gas' ? '🔥 Natural Gas' : '⚡ Dual Fuel'}
                            </div>
                            <div className="text-xs opacity-80">
                              {type === 'diesel' ? 'Most common' : type === 'natural-gas' ? 'Cleaner' : 'Flexible'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Per Unit */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Size Per Unit: {generatorConfig.sizePerUnit < 1 ? `${(generatorConfig.sizePerUnit * 1000).toFixed(0)} kW` : `${generatorConfig.sizePerUnit.toFixed(2)} MW`}
                      </label>
                      <input
                        type="range"
                        min="0.25"
                        max="2.5"
                        step="0.25"
                        value={generatorConfig.sizePerUnit}
                        onChange={(e) => {
                          const size = parseFloat(e.target.value);
                          setGeneratorConfig({...generatorConfig, sizePerUnit: size});
                          // Recalculate number of units
                          const units = Math.ceil(generatorMW / size);
                          setGeneratorConfig({...generatorConfig, sizePerUnit: size, numberOfUnits: units});
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>250 kW</span>
                        <span>2.5 MW</span>
                      </div>
                    </div>

                    {/* Number of Units (Manual Mode) */}
                    {!generatorConfig.useAI && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Number of Units: {generatorConfig.numberOfUnits}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={generatorConfig.numberOfUnits}
                          onChange={(e) => {
                            const units = parseInt(e.target.value);
                            setGeneratorConfig({...generatorConfig, numberOfUnits: units});
                            // Update total MW based on unit count
                            setGeneratorMW(units * generatorConfig.sizePerUnit);
                          }}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Generator Summary */}
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <div className="text-sm text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Fuel Type:</span>
                          <span className="font-semibold capitalize">
                            {generatorConfig.generatorType.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unit Size:</span>
                          <span className="font-semibold">
                            {generatorConfig.sizePerUnit < 1 
                              ? `${(generatorConfig.sizePerUnit * 1000).toFixed(0)} kW each` 
                              : `${generatorConfig.sizePerUnit.toFixed(2)} MW each`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Units:</span>
                          <span className="font-semibold">
                            {Math.ceil(generatorMW / generatorConfig.sizePerUnit)} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Capacity:</span>
                          <span className="font-semibold">
                            {generatorMW < 1 
                              ? `${(generatorMW * 1000).toFixed(0)} kW` 
                              : `${generatorMW.toFixed(2)} MW`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Runtime:</span>
                          <span className="font-semibold">24-48 hours typical</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Use Case:</span>
                          <span className="font-semibold">Emergency backup</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!showGeneratorConfig && (
                  <div className="bg-orange-50 p-4 rounded-lg">
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
            )}
          </div>

          {/* EV Chargers Configuration (for Hotel/EV Charging use cases) */}
          {(useCase === 'hotel' || useCase === 'ev-charging' || useCase === 'shopping-center') && (
            <div className="bg-white rounded-xl border-2 border-blue-400 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">🔌</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">EV Chargers (Optional)</h3>
                    <p className="text-sm text-gray-600">Electric vehicle charging stations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEVConfig(!showEVConfig)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {showEVConfig ? 'Hide' : 'Configure'}
                </button>
              </div>

              {showEVConfig && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-3">
                      Select the type and quantity of EV chargers for your facility:
                    </p>

                    {/* Level 2 AC Chargers */}
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">🔋</span>
                          <div>
                            <h4 className="font-bold text-gray-800">Level 2 AC Chargers</h4>
                            <p className="text-xs text-gray-600">Standard charging for overnight/workplace</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* 11kW Level 2 */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              11kW (Standard)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={evChargerConfig.level2_11kw}
                              onChange={(e) => setEVChargerConfig({...evChargerConfig, level2_11kw: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-600">
                              <div>• $8,500/charger</div>
                              <div>• ~25 miles/hour</div>
                              <div>• 6-8 hr full charge</div>
                            </div>
                          </div>

                          {/* 19kW Level 2 */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              19kW (Fast L2)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={evChargerConfig.level2_19kw}
                              onChange={(e) => setEVChargerConfig({...evChargerConfig, level2_19kw: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-600">
                              <div>• $12,000/charger</div>
                              <div>• ~45 miles/hour</div>
                              <div>• 3-4 hr full charge</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DC Fast Chargers */}
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">⚡</span>
                          <div>
                            <h4 className="font-bold text-gray-800">DC Fast Chargers</h4>
                            <p className="text-xs text-gray-600">Rapid charging for commercial/public</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* 50kW DC Fast */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              50kW
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={evChargerConfig.dcfast_50kw}
                              onChange={(e) => setEVChargerConfig({...evChargerConfig, dcfast_50kw: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-600">
                              <div>• $40,500/unit</div>
                              <div>• ~150 mi/hour</div>
                              <div>• 30-40 min charge</div>
                            </div>
                          </div>

                          {/* 150kW DC Fast */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              150kW
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={evChargerConfig.dcfast_150kw}
                              onChange={(e) => setEVChargerConfig({...evChargerConfig, dcfast_150kw: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-600">
                              <div>• $80,500/unit</div>
                              <div>• ~450 mi/hour</div>
                              <div>• 15-20 min charge</div>
                            </div>
                          </div>

                          {/* 350kW DC Ultra-Fast */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              350kW+
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={evChargerConfig.dcfast_350kw}
                              onChange={(e) => setEVChargerConfig({...evChargerConfig, dcfast_350kw: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-600">
                              <div>• $150,500/unit</div>
                              <div>• ~1000 mi/hour</div>
                              <div>• 10-15 min charge</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* EV Charger Summary */}
                      {(evChargerConfig.level2_11kw + evChargerConfig.level2_19kw + evChargerConfig.dcfast_50kw + 
                        evChargerConfig.dcfast_150kw + evChargerConfig.dcfast_350kw) > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-300">
                          <h4 className="font-bold text-gray-800 mb-2">EV Charging Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Total Chargers:</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {evChargerConfig.level2_11kw + evChargerConfig.level2_19kw + 
                                 evChargerConfig.dcfast_50kw + evChargerConfig.dcfast_150kw + evChargerConfig.dcfast_350kw}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Total Capacity:</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {(evChargerConfig.level2_11kw * 11 + evChargerConfig.level2_19kw * 19 + 
                                  evChargerConfig.dcfast_50kw * 50 + evChargerConfig.dcfast_150kw * 150 + 
                                  evChargerConfig.dcfast_350kw * 350)} kW
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-gray-600">Estimated Cost:</div>
                              <div className="text-2xl font-bold text-blue-600">
                                ${((evChargerConfig.level2_11kw * 8.5 + evChargerConfig.level2_19kw * 12 + 
                                    evChargerConfig.dcfast_50kw * 40.5 + evChargerConfig.dcfast_150kw * 80.5 + 
                                    evChargerConfig.dcfast_350kw * 150.5) / 1000).toFixed(1)}M
                              </div>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-blue-200">
                              <div className="text-xs text-gray-700 space-y-1">
                                <div>• All chargers include OCPP networking ($500/unit)</div>
                                <div>• Level 2: Best for hotels, workplaces (4-8 hr stays)</div>
                                <div>• DC Fast: Best for public, retail (15-45 min stops)</div>
                                <div>• Consider Tesla connectors + CCS adapters for compatibility</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
