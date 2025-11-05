import React from 'react';

interface Step2_SimpleConfigurationProps {
  storageSizeMW: number;
  setStorageSizeMW: (value: number) => void;
  durationHours: number;
  setDurationHours: (value: number) => void;
  industryTemplate?: string | string[];
}

const Step2_SimpleConfiguration: React.FC<Step2_SimpleConfigurationProps> = ({
  storageSizeMW,
  setStorageSizeMW,
  durationHours,
  setDurationHours,
  industryTemplate,
}) => {
  
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
