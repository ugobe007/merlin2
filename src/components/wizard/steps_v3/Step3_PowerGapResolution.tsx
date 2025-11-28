/**
 * Step 3: Power Gap Resolution
 * 
 * This is where users SEE the gap and RESOLVE it by choosing:
 * - Natural gas generators (default recommendation)
 * - Solar power
 * - Wind power
 * - Hybrid combinations
 * 
 * Cool, visual, engaging - make it fun to resolve the power gap!
 */

import React, { useState } from 'react';
import type { BaseStepProps } from '../SmartWizardV3.types';
import type { PowerGapAnalysis } from '@/services/powerGapAnalysis';
import { PowerGapVisualization } from '../PowerGapVisualization';

interface Step3PowerGapResolutionProps extends BaseStepProps {
  analysis: PowerGapAnalysis | null;
  currentConfig: {
    solarMW: number;
    windMW: number;
    generatorMW: number;
  };
  onUpdateConfig: (updates: Partial<{ solarMW: number; windMW: number; generatorMW: number }>) => void;
}

const Step3_PowerGapResolution: React.FC<Step3PowerGapResolutionProps> = ({
  analysis,
  currentConfig,
  onUpdateConfig,
  onNext,
  onBack
}) => {
  const [selectedSolution, setSelectedSolution] = useState<'generator' | 'solar' | 'wind' | 'hybrid'>('generator');
  const [showEducation, setShowEducation] = useState<string | null>(null);
  
  // Local state for interactive sliders - prevent NaN with defaults
  const [solarMW, setSolarMW] = useState(currentConfig.solarMW || 0);
  const [windMW, setWindMW] = useState(currentConfig.windMW || 0);
  const [generatorMW, setGeneratorMW] = useState(currentConfig.generatorMW || 0);

  // Update parent when sliders change
  const handleSliderChange = (type: 'solar' | 'wind' | 'generator', value: number) => {
    if (type === 'solar') {
      setSolarMW(value);
      onUpdateConfig({ solarMW: value });
    } else if (type === 'wind') {
      setWindMW(value);
      onUpdateConfig({ windMW: value });
    } else if (type === 'generator') {
      setGeneratorMW(value);
      onUpdateConfig({ generatorMW: value });
    }
  };

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Analyzing your power requirements...</p>
      </div>
    );
  }

  const gapKW = Math.abs(analysis.powerGapKW);
  const gapMW = gapKW / 1000;

  // Educational content
  const educationalLinks = {
    generator: {
      title: "Natural Gas Generators",
      description: "Reliable backup power with instant response",
      pros: ["24/7 availability", "Instant startup", "High reliability", "Lower upfront cost"],
      cons: ["Fuel costs", "Emissions", "Maintenance"],
      learnMore: "https://www.energy.gov/eere/fuelcells/distributed-generation"
    },
    solar: {
      title: "Solar Power Systems", 
      description: "Clean energy from the sun",
      pros: ["Zero fuel cost", "Zero emissions", "Tax incentives", "25+ year lifespan"],
      cons: ["Weather dependent", "Higher upfront cost", "Requires space"],
      learnMore: "https://www.energy.gov/eere/solar/solar-energy-technologies-office"
    },
    wind: {
      title: "Wind Turbines",
      description: "Harness wind energy for power",
      pros: ["Clean energy", "Low operating cost", "Works day and night"],
      cons: ["Location dependent", "Visual impact", "Higher upfront cost"],
      learnMore: "https://www.energy.gov/eere/wind/wind-energy-technologies-office"
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ⚡ Power Gap Resolution
        </h2>
        <p className="text-lg text-gray-600 mb-3">
          {analysis.recommendation === 'sufficient'
            ? 'Your power configuration meets all requirements! 🎉'
            : 'Choose a solution to balance your energy needs'}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-blue-800">
            <strong>💡 What happens next:</strong> Once your power is balanced, we'll generate your preliminary quote with detailed cost breakdowns and savings projections.
          </p>
        </div>
      </div>

      {/* Power Gap Visualization with Sliding Bars */}
      <div className="bg-white border-2 border-purple-200 rounded-xl p-6 shadow-lg">
        <PowerGapVisualization
          analysis={analysis}
          onContinue={onNext}
          onAdjust={() => {}}
        />
      </div>

      {/* Only show resolution options if there's a gap */}
      {analysis.recommendation !== 'sufficient' && (
        <>
          {/* Merlin's AI Recommendation - Prominent Accept Button */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-xl border-2 border-purple-300">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🤖</span>
                  <h3 className="text-2xl font-bold">Merlin's AI Recommendation</h3>
                </div>
                <p className="text-blue-100 text-lg mb-3">
                  {analysis.recommendation === 'add_power' 
                    ? `Add ${gapMW.toFixed(2)} MW power capacity - Natural gas generator recommended for instant reliability`
                    : analysis.recommendation === 'add_energy'
                    ? `Add ${gapMW.toFixed(2)} MW battery storage - Extended duration needed for your loads`
                    : analysis.recommendation === 'add_both'
                    ? `Hybrid solution recommended: ${gapMW.toFixed(2)} MW generator + battery storage for optimal performance`
                    : 'Optimized power configuration recommended'}
                </p>
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <p className="text-sm text-white/90">
                    <strong>Why this works:</strong> {
                      analysis.recommendation === 'add_power'
                        ? 'Generators provide 24/7 reliability with instant startup, perfect for critical loads. Lower upfront cost, proven technology.'
                        : analysis.recommendation === 'add_energy'
                        ? 'Additional battery storage ensures you have enough energy capacity for extended outages and peak demand periods.'
                        : 'Combining generator and battery gives you both instant power and energy storage for maximum flexibility.'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  // Apply Merlin's recommendation based on actual analysis
                  if (analysis.recommendation === 'add_power') {
                    // Add generator for power gap
                    setSelectedSolution('generator');
                    setSolarMW(0);
                    setWindMW(0);
                    setGeneratorMW(gapMW);
                    onUpdateConfig({ generatorMW: gapMW, solarMW: 0, windMW: 0 });
                  } else if (analysis.recommendation === 'add_energy') {
                    // Add solar for energy/duration gap (clean option)
                    setSelectedSolution('solar');
                    setSolarMW(gapMW * 1.3);
                    setWindMW(0);
                    setGeneratorMW(0);
                    onUpdateConfig({ solarMW: gapMW * 1.3, generatorMW: 0, windMW: 0 });
                  } else if (analysis.recommendation === 'add_both') {
                    // Hybrid solution for both power and energy
                    setSelectedSolution('hybrid');
                    setSolarMW(gapMW * 0.5);
                    setWindMW(0);
                    setGeneratorMW(gapMW * 0.4);
                    onUpdateConfig({ solarMW: gapMW * 0.5, generatorMW: gapMW * 0.4, windMW: 0 });
                  } else {
                    // Sufficient - just move forward
                    setSolarMW(0);
                    setWindMW(0);
                    setGeneratorMW(0);
                  }
                }}
                className="flex-shrink-0 bg-white text-purple-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                ✓ Accept Recommendation
              </button>
            </div>
            <div className="mt-4 text-center text-sm text-white/80">
              Or customize your power mix with the options below ↓
            </div>
          </div>

          {/* Solution Options */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              🎯 Or Choose Your Own Solution
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Natural Gas Generator (Default) */}
              <button
                onClick={() => {
                  setSelectedSolution('generator');
                  onUpdateConfig({ generatorMW: gapMW, solarMW: 0, windMW: 0 });
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSolution === 'generator'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🏭</div>
                  <h4 className="font-bold text-gray-900">Generator</h4>
                  <p className="text-sm text-gray-600 mt-1">{gapMW.toFixed(2)} MW</p>
                  <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Recommended
                  </span>
                </div>
              </button>

              {/* Solar */}
              <button
                onClick={() => {
                  setSelectedSolution('solar');
                  onUpdateConfig({ solarMW: gapMW * 1.3, generatorMW: 0, windMW: 0 }); // 30% oversizing for solar
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSolution === 'solar'
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                    : 'border-gray-300 bg-white hover:border-yellow-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">☀️</div>
                  <h4 className="font-bold text-gray-900">Solar</h4>
                  <p className="text-sm text-gray-600 mt-1\">{(gapMW * 1.3).toFixed(2)} MW</p>
                  <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Eco-Friendly
                  </span>
                </div>
              </button>

              {/* Wind */}
              <button
                onClick={() => {
                  setSelectedSolution('wind');
                  onUpdateConfig({ windMW: gapMW * 1.2, generatorMW: 0, solarMW: 0 }); // 20% oversizing for wind
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSolution === 'wind'
                    ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                    : 'border-gray-300 bg-white hover:border-cyan-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🌬️</div>
                  <h4 className="font-bold text-gray-900">Wind</h4>
                  <p className="text-sm text-gray-600 mt-1">{(gapMW * 1.2).toFixed(2)} MW</p>
                  <span className="inline-block mt-2 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                    Clean Energy
                  </span>
                </div>
              </button>

              {/* Hybrid */}
              <button
                onClick={() => {
                  setSelectedSolution('hybrid');
                  onUpdateConfig({ 
                    solarMW: gapMW * 0.5, 
                    generatorMW: gapMW * 0.3,
                    windMW: 0
                  });
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSolution === 'hybrid'
                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                    : 'border-gray-300 bg-white hover:border-purple-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🔋</div>
                  <h4 className="font-bold text-gray-900">Hybrid</h4>
                  <p className="text-sm text-gray-600 mt-1">Mixed</p>
                  <span className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Best of Both
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Sliders - Adjust Power Mix */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">⚡ Advanced: Fine-Tune Your Power Mix</h3>
                <p className="text-sm text-gray-600 mt-1">Optional - Use sliders to customize power generation sources</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-700">
                  {(solarMW + windMW + generatorMW).toFixed(2)} MW
                </div>
                <div className="text-xs text-gray-600">Total Power</div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Solar Slider */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    Solar Power
                  </span>
                  <span className="text-lg font-bold text-yellow-700">{solarMW.toFixed(2)} MW</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(gapMW * 2, 10)}
                  step="0.1"
                  value={solarMW}
                  onChange={(e) => handleSliderChange('solar', parseFloat(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${(solarMW / Math.max(gapMW * 2, 10)) * 100}%, #e5e7eb ${(solarMW / Math.max(gapMW * 2, 10)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>0 MW</span>
                  <span>{Math.max(gapMW * 2, 10).toFixed(1)} MW max</span>
                </div>
              </div>

              {/* Wind Slider */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🌬️</span>
                    Wind Power
                  </span>
                  <span className="text-lg font-bold text-cyan-700">{windMW.toFixed(2)} MW</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(gapMW * 2, 10)}
                  step="0.1"
                  value={windMW}
                  onChange={(e) => handleSliderChange('wind', parseFloat(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-cyan-200 to-cyan-400 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(windMW / Math.max(gapMW * 2, 10)) * 100}%, #e5e7eb ${(windMW / Math.max(gapMW * 2, 10)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>0 MW</span>
                  <span>{Math.max(gapMW * 2, 10).toFixed(1)} MW max</span>
                </div>
              </div>

              {/* Generator Slider */}
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-purple-200/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🏭</span>
                    Natural Gas Generator
                  </span>
                  <span className="text-lg font-bold text-orange-700">{generatorMW.toFixed(2)} MW</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(gapMW * 2, 10)}
                  step="0.1"
                  value={generatorMW}
                  onChange={(e) => handleSliderChange('generator', parseFloat(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-orange-200 to-orange-400 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #f97316 0%, #f97316 ${(generatorMW / Math.max(gapMW * 2, 10)) * 100}%, #e5e7eb ${(generatorMW / Math.max(gapMW * 2, 10)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>0 MW</span>
                  <span>{Math.max(gapMW * 2, 10).toFixed(1)} MW max</span>
                </div>
              </div>

              {/* Power Balance Indicator */}
              <div className={`mt-4 p-4 rounded-lg border-2 ${
                Math.abs((solarMW + windMW + generatorMW) - gapMW) < 0.1 
                  ? 'bg-green-50 border-green-300'
                  : (solarMW + windMW + generatorMW) >= gapMW
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-amber-50 border-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {Math.abs((solarMW + windMW + generatorMW) - gapMW) < 0.1 
                        ? '✓ Perfect Balance!'
                        : (solarMW + windMW + generatorMW) >= gapMW
                        ? '✓ Power Needs Met'
                        : '⚠️ Additional Power Needed'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Gap: {gapMW.toFixed(2)} MW | Configured: {(solarMW + windMW + generatorMW).toFixed(2)} MW
                    </p>
                  </div>
                  <div className="text-3xl">
                    {Math.abs((solarMW + windMW + generatorMW) - gapMW) < 0.1 
                      ? '🎯'
                      : (solarMW + windMW + generatorMW) >= gapMW
                      ? '✅'
                      : '⚡'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              📚 Learn More About Your Options
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(educationalLinks).map(([key, info]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <h4 className="font-bold text-gray-900 mb-2">{info.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{info.description}</p>
                  
                  <button
                    onClick={() => setShowEducation(showEducation === key ? null : key)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {showEducation === key ? '▼ Hide Details' : '▶ Show Details'}
                  </button>
                  
                  {showEducation === key && (
                    <div className="mt-3 text-sm space-y-2">
                      <div>
                        <p className="font-medium text-green-700">Pros:</p>
                        <ul className="list-disc list-inside text-gray-600">
                          {info.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-red-700">Cons:</p>
                        <ul className="list-disc list-inside text-gray-600">
                          {info.cons.map((con, i) => <li key={i}>{con}</li>)}
                        </ul>
                      </div>
                      <a
                        href={info.learnMore}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-600 hover:text-blue-700 underline"
                      >
                        Learn More →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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

export default Step3_PowerGapResolution;
