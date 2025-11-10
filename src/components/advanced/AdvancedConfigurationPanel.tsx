import React from 'react';

interface AdvancedConfigurationPanelProps {
  showAdvancedOptions: boolean;
  setShowAdvancedOptions: (show: boolean) => void;
}

export default function AdvancedConfigurationPanel({
  showAdvancedOptions,
  setShowAdvancedOptions
}: AdvancedConfigurationPanelProps) {
  return (
    <div className="border-t pt-4">
      <button 
        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition-colors border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">⚙️</span>
          <div className="text-left">
            <div className="font-medium text-gray-700">Advanced Configuration</div>
            <div className="text-xs text-gray-500">Fine-tune technical specifications</div>
          </div>
        </div>
        <span className={`transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''} text-gray-400`}>
          ▼
        </span>
      </button>
      
      {showAdvancedOptions && (
        <div className="mt-4 space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>ℹ️</span>
              Advanced Options Guide
            </h5>
            <p className="text-sm text-blue-700">
              These settings are for fine-tuning your system. Default values work for most projects. 
              Modify only if you have specific technical requirements.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Battery Chemistry
                <span className="text-xs text-gray-500 ml-2">(affects cost & performance)</span>
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white">
                <option>LiFePO4 (Recommended for most projects)</option>
                <option>Li-ion NMC (Higher density)</option>
                <option>Li-ion LTO (Long cycle life)</option>
              </select>
              <div className="text-xs text-gray-600">
                💡 LiFePO4 offers best cost/safety balance
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Depth of Discharge (%)
                <span className="text-xs text-gray-500 ml-2">(usable capacity)</span>
              </label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="90"
                min="70"
                max="100"
              />
              <div className="text-xs text-gray-600">
                💡 90% is optimal for most lithium systems
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <button 
              onClick={() => setShowAdvancedOptions(false)}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              Apply Advanced Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}