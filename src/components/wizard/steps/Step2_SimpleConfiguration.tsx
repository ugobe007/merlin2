import React, { useState } from 'react';
import { aiStateService } from '@/services/aiStateService';
import AIStatusIndicator from '../AIStatusIndicator';

interface Step2_SimpleConfigurationProps {
  storageSizeMW: number;
  setStorageSizeMW: (value: number) => void;
  durationHours: number;
  setDurationHours: (value: number) => void;
  industryTemplate?: string | string[];
  aiRecommendation?: {
    message: string;
    savings: string;
    roi: string;
    configuration: string;
  };
  baselineResult?: {
    peakDemandMW?: number;
    gridCapacity?: number;
    generationRecommendedMW?: number;
  };
  onNext?: () => void;
  onBack?: () => void;
}

const Step2_SimpleConfiguration: React.FC<Step2_SimpleConfigurationProps> = ({
  storageSizeMW,
  setStorageSizeMW,
  durationHours,
  setDurationHours,
  industryTemplate,
  aiRecommendation,
  baselineResult,
  onNext,
  onBack,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isApplyingAI, setIsApplyingAI] = useState(false);
  
  // Calculate recommended configuration from baseline
  const recommendedMW = baselineResult?.peakDemandMW || storageSizeMW;
  const recommendedHours = baselineResult?.peakDemandMW ? 
    (baselineResult.peakDemandMW < 1 ? 4 : baselineResult.peakDemandMW < 3 ? 4 : 6) : durationHours;
  
  const handleUseRecommended = () => {
    setStorageSizeMW(recommendedMW);
    setDurationHours(recommendedHours);
  };
  
  // Extract MW and hours from AI configuration string
  // Format: "2.5MW / 4hr BESS + 1.2MW Solar"
  const parseAIConfiguration = (configString: string) => {
    if (!configString) return null;
    
    const mwMatch = configString.match(/(\d+\.?\d*)MW/);
    const hrMatch = configString.match(/(\d+)hr/);
    
    if (mwMatch && hrMatch) {
      return {
        mw: parseFloat(mwMatch[1]),
        hours: parseInt(hrMatch[1])
      };
    }
    return null;
  };

  const aiConfig = aiRecommendation ? parseAIConfiguration(aiRecommendation.configuration) : null;

  const handleAcceptAIConfiguration = () => {
    if (aiConfig) {
      setIsApplyingAI(true);
      
      // Apply the configuration
      setStorageSizeMW(aiConfig.mw);
      setDurationHours(aiConfig.hours);
      
      // Update AI state to applied
      aiStateService.setAIState('applied', {
        appliedConfig: `${aiConfig.mw}MW / ${aiConfig.hours}hr`
      });
      
      // Close modal after brief delay to show feedback
      setTimeout(() => {
        setShowConfirmModal(false);
        setIsApplyingAI(false);
      }, 1500);
    }
  };
  
  const getSizeDescription = (mw: number) => {
    if (mw < 1) return { label: 'Small', description: `Powers ~${Math.round(mw * 200)} homes`, color: 'text-blue-600' };
    if (mw < 3) return { label: 'Medium', description: `Powers ~${Math.round(mw * 200)} homes`, color: 'text-green-600' };
    if (mw < 5) return { label: 'Large', description: `Powers ~${Math.round(mw * 200)} homes`, color: 'text-purple-600' };
    return { label: 'Extra Large', description: `Powers ${Math.round(mw * 200)}+ homes`, color: 'text-orange-600' };
  };

  const getDurationDescription = (hours: number) => {
    if (hours <= 2) return { label: 'Fast Response', description: 'Quick discharge for peak periods', color: 'text-blue-600' };
    if (hours <= 4) return { label: 'Standard', description: 'Most popular choice', color: 'text-green-600', badge: '⭐ Recommended' };
    if (hours <= 6) return { label: 'Extended', description: 'Longer backup capability', color: 'text-purple-600' };
    return { label: 'Full Shift', description: 'Complete work shift coverage', color: 'text-orange-600' };
  };

  const sizeInfo = getSizeDescription(storageSizeMW);
  const durationInfo = getDurationDescription(durationHours);
  const totalEnergyMWh = storageSizeMW * durationHours;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-3">
          <div className="text-5xl">🧙‍♂️</div>
          <div>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              Merlin's Recommendation
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Based on your {industryTemplate || 'business'} requirements
            </p>
            <p className="text-xs text-purple-600 font-semibold mt-2 animate-pulse">
              👆 Click and adjust the sliders to customize your Power Profile
            </p>
          </div>
        </div>
      </div>

      {/* AI-Generated Recommendation Card */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-300 shadow-xl">
        <div className="text-center mb-6">
          <p className="text-lg text-gray-700">
            Based on your inputs, here's the optimal battery storage system:
          </p>
          
          {/* USE RECOMMENDED BUTTON */}
          {baselineResult && (recommendedMW !== storageSizeMW || recommendedHours !== durationHours) && (
            <button
              onClick={handleUseRecommended}
              className="mt-4 inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <span className="text-2xl">✨</span>
              <span>Use Recommended Power Profile</span>
              <span className="text-sm font-normal opacity-90">({recommendedMW.toFixed(1)} MW × {recommendedHours}hr)</span>
            </button>
          )}
        </div>

        {/* Main Recommendation Visual */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-sm text-gray-600 font-medium mb-1">Battery Power</div>
            <div className="text-3xl font-bold text-blue-600">{storageSizeMW.toFixed(1)} MW</div>
            <div className="text-xs text-gray-500 mt-1">{sizeInfo.description}</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="text-4xl mb-2">⏱️</div>
            <div className="text-sm text-gray-600 font-medium mb-1">Storage Duration</div>
            <div className="text-3xl font-bold text-purple-600">{durationHours} hours</div>
            <div className="text-xs text-gray-500 mt-1">{durationInfo.description}</div>
          </div>

          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="text-4xl mb-2">🔋</div>
            <div className="text-sm text-gray-600 font-medium mb-1">Total Energy</div>
            <div className="text-3xl font-bold text-green-600">{totalEnergyMWh.toFixed(1)} MWh</div>
            <div className="text-xs text-gray-500 mt-1">Stored capacity</div>
          </div>
        </div>

        {/* Why This Works - Explanation */}
        <div className="bg-white/80 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            Why This Configuration Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Sized for your facility's peak demand requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Optimized for grid capacity and backup needs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Maximizes cost savings during peak rate periods</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Industry-standard configuration for {industryTemplate || 'your business'}</span>
            </li>
          </ul>
        </div>

        {/* Power Profile Indicator */}
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border-2 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-700">Your Power Profile</div>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                Level {Math.min(7, Math.ceil(storageSizeMW / 2))} - {['Apprentice', 'Adept', 'Conjurer', 'Enchanter', 'Sorcerer', 'Archmage', 'Grand Wizard'][Math.min(6, Math.floor(storageSizeMW / 2))]}
              </div>
            </div>
            <div className="text-4xl">
              {'⚡'.repeat(Math.min(7, Math.ceil(storageSizeMW / 2)))}
            </div>
          </div>
        </div>
      </div>

      {/* Optional Fine-Tuning Section - Minimized */}
      <details className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-2">
          <span>🔧</span>
          <span>Need to adjust? Fine-tune the configuration</span>
        </summary>
        
        <div className="mt-6 space-y-6">
          {/* Energy Storage Size */}
          <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xl font-bold text-gray-800">
              Energy Storage Size
            </label>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {storageSizeMW.toFixed(1)} MW
              </div>
              <div className={`text-sm font-semibold ${sizeInfo.color}`}>
                {sizeInfo.label}
              </div>
            </div>
          </div>
          
          <input
            type="range"
            min="0.5"
            max="20"
            step="0.5"
            value={storageSizeMW}
            onChange={(e) => setStorageSizeMW(parseFloat(e.target.value))}
            className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
          />
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>0.5 MW</span>
            <span className={sizeInfo.color}>
              {sizeInfo.description}
            </span>
            <span>20 MW</span>
          </div>

          {/* Size presets */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStorageSizeMW(1)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-semibold text-blue-700 transition-colors"
            >
              1 MW
            </button>
            <button
              onClick={() => setStorageSizeMW(2)}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-semibold text-green-700 transition-colors"
            >
              2 MW (Popular)
            </button>
            <button
              onClick={() => setStorageSizeMW(5)}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-sm font-semibold text-purple-700 transition-colors"
            >
              5 MW
            </button>
            <button
              onClick={() => setStorageSizeMW(10)}
              className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-semibold text-orange-700 transition-colors"
            >
              10 MW
            </button>
          </div>
        </div>

        {/* Storage Duration */}
        <div className="space-y-4 pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between">
            <label className="text-xl font-bold text-gray-800">
              Storage Duration
            </label>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {durationHours} hours
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm font-semibold ${durationInfo.color}`}>
                  {durationInfo.label}
                </div>
                {durationInfo.badge && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {durationInfo.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={durationHours}
            onChange={(e) => setDurationHours(parseInt(e.target.value))}
            className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer slider"
          />
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>1 hour</span>
            <span className={durationInfo.color}>
              {durationInfo.description}
            </span>
            <span>12 hours</span>
          </div>

          {/* Duration presets */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDurationHours(2)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-semibold text-blue-700 transition-colors"
            >
              2 hours
            </button>
            <button
              onClick={() => setDurationHours(4)}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-semibold text-green-700 transition-colors"
            >
              4 hours ⭐
            </button>
            <button
              onClick={() => setDurationHours(6)}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-sm font-semibold text-purple-700 transition-colors"
            >
              6 hours
            </button>
            <button
              onClick={() => setDurationHours(8)}
              className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-semibold text-orange-700 transition-colors"
            >
              8 hours
            </button>
          </div>
        </div>

        {/* System Summary */}
        <div className="pt-6 border-t-2 border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Your Energy Storage System
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{storageSizeMW.toFixed(1)} MW</div>
                <div className="text-sm text-gray-600">Power Output</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{totalEnergyMWh.toFixed(1)} MWh</div>
                <div className="text-sm text-gray-600">Total Energy Storage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{durationHours} hrs</div>
                <div className="text-sm text-gray-600">Discharge Duration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Understanding Your Configuration</h4>
            <p className="text-gray-700 mb-2">
              <strong>Power (MW)</strong> = How much electricity you can use at once
            </p>
            <p className="text-gray-700 mb-2">
              <strong>Duration (hours)</strong> = How long you can maintain that power
            </p>
            <p className="text-gray-700">
              <strong>Energy (MWh)</strong> = Total electricity stored = {storageSizeMW.toFixed(1)} MW × {durationHours} hours = {totalEnergyMWh.toFixed(1)} MWh
            </p>
          </div>
        </div>
      </div>
      </details>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: none;
        }
      `}</style>

      {/* Confirmation Modal */}
      {showConfirmModal && aiConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Apply AI Configuration?</h3>
              <p className="text-gray-600">This will automatically set your energy storage system to the AI-recommended values.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Configuration Changes:
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-gray-600 mb-1">Current</div>
                  <div className="font-bold text-gray-900">{storageSizeMW}MW / {durationHours}hr</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-300">
                  <div className="text-blue-600 mb-1">AI Recommended</div>
                  <div className="font-bold text-blue-900">{aiConfig.mw}MW / {aiConfig.hours}hr</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                • Based on your specific use case requirements
                <br />
                • Optimized for cost and performance
                <br />
                • You can still manually adjust after applying
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Keep Current
              </button>
              <button
                onClick={handleAcceptAIConfiguration}
                disabled={isApplyingAI}
                className={`flex-1 ${
                  isApplyingAI 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center justify-center gap-2`}
              >
                {isApplyingAI ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Applying Configuration...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply AI Config
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {onNext && onBack && (
        <div className="flex justify-between pt-6 mt-6 border-t-2 border-gray-200">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl font-bold transition-all bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={storageSizeMW <= 0 || durationHours <= 0}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              storageSizeMW > 0 && durationHours > 0
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Step2_SimpleConfiguration;
