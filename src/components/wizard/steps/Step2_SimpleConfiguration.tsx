import React from 'react';

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
}

const Step2_SimpleConfiguration: React.FC<Step2_SimpleConfigurationProps> = ({
  storageSizeMW,
  setStorageSizeMW,
  durationHours,
  setDurationHours,
  industryTemplate,
  aiRecommendation,
}) => {
  
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
      setStorageSizeMW(aiConfig.mw);
      setDurationHours(aiConfig.hours);
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
        <h2 className="text-4xl font-bold text-gray-800">
          Configure Your Energy Storage System
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          {industryTemplate && industryTemplate !== 'custom' 
            ? "These values are pre-filled based on your industry. Adjust them to match your needs."
            : "Use the sliders to configure your system size and storage duration"}
        </p>
      </div>

      {/* AI Recommendation Section */}
      {aiRecommendation && aiConfig && (
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-full flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                🤖 AI Recommended Configuration
              </h3>
              
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <p className="text-gray-700 leading-relaxed">
                  {aiRecommendation.message}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div className="bg-green-100 rounded-lg p-3 border border-green-300">
                  <div className="text-green-700 font-semibold text-sm">Potential Savings</div>
                  <div className="text-lg font-bold text-green-900">{aiRecommendation.savings}</div>
                </div>
                <div className="bg-blue-100 rounded-lg p-3 border border-blue-300">
                  <div className="text-blue-700 font-semibold text-sm">ROI Timeline</div>
                  <div className="text-lg font-bold text-blue-900">{aiRecommendation.roi}</div>
                </div>
                <div className="bg-purple-100 rounded-lg p-3 border border-purple-300">
                  <div className="text-purple-700 font-semibold text-sm">Recommended Size</div>
                  <div className="text-lg font-bold text-purple-900">{aiConfig.mw}MW / {aiConfig.hours}hr</div>
                </div>
              </div>

              <button
                onClick={handleAcceptAIConfiguration}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept AI Configuration
              </button>

              <div className="mt-3 flex items-center gap-2 text-gray-600 text-sm">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Based on your specific use case and industry benchmarks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border-2 border-blue-400 p-8 shadow-lg space-y-8">
        
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
    </div>
  );
};

export default Step2_SimpleConfiguration;
