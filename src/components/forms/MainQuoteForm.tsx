import React, { useState } from 'react';
import UseCaseROI from '../UseCaseROI';

type ModalName = 'showChatModal' | 'showEnhancedAnalytics' | 'showEnhancedBESSAnalytics' | 'bessAnalytics' | 'showTemplates';

interface MainQuoteFormProps {
  // Energy configuration
  energyCapacity: number;
  setEnergyCapacity: (capacity: number) => void;
  energyUnit: string;
  setEnergyUnit: (unit: string) => void;
  powerRating: number;
  setPowerRating: (rating: number) => void;
  powerUnit: string;
  setPowerUnit: (unit: string) => void;
  applicationType: 'residential' | 'commercial' | 'utility' | 'ups';
  setApplicationType: (type: 'residential' | 'commercial' | 'utility' | 'ups') => void;
  
  // UI state
  showAdvancedOptions: boolean;
  setShowAdvancedOptions: (show: boolean) => void;
  setShowAnalytics: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  
  // Modal management
  openModal: (modalName: ModalName) => void;
  
  // Event handlers  
  handleSaveProject: () => void;
  
  // Project data
  quoteName: string;
}

const MainQuoteForm: React.FC<MainQuoteFormProps> = ({
  energyCapacity,
  setEnergyCapacity,
  energyUnit,
  setEnergyUnit,
  powerRating,
  setPowerRating,
  powerUnit,
  setPowerUnit,
  applicationType,
  setApplicationType,
  showAdvancedOptions,
  setShowAdvancedOptions,
  setShowAnalytics,
  setShowTemplates,
  openModal,
  handleSaveProject,
  quoteName,
}) => {
  
  return (
    <div className="space-y-6">
      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            {/* Header with Workflow Guide */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ Advanced System Configuration</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🚀 Quick Start Workflow:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li><strong>1.</strong> Enter your project's power requirements (any size welcome)</li>
                  <li><strong>2.</strong> Choose your application type and use case</li>
                  <li><strong>3.</strong> Configure advanced settings as needed</li>
                  <li><strong>4.</strong> Review AI recommendations and generate quote</li>
                </ol>
              </div>
            </div>
          
          {/* Project Sizing - Flexible Input */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">📐 Project Sizing</h4>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-4">
                <strong>Enter your specific power requirements.</strong> Our system supports projects from residential installations (10kWh) 
                to utility-scale deployments (100+ MWh). No arbitrary size limits!
              </p>
              
              {/* Power Requirements Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Energy Storage Capacity
                    <span className="text-xs text-gray-500 ml-1">(Total energy stored)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={energyCapacity}
                      onChange={(e) => setEnergyCapacity(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter capacity (e.g., 100, 1000, 50000)"
                      min="1"
                    />
                    <select 
                      value={energyUnit}
                      onChange={(e) => setEnergyUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kWh">kWh</option>
                      <option value="MWh">MWh</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Examples: 50kWh (home), 1MWh (commercial), 100MWh (utility)</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Power Output Rating
                    <span className="text-xs text-gray-500 ml-1">(Maximum discharge rate)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={powerRating}
                      onChange={(e) => setPowerRating(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter power rating (e.g., 25, 500, 10000)"
                      min="1"
                    />
                    <select 
                      value={powerUnit}
                      onChange={(e) => setPowerUnit(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kW">kW</option>
                      <option value="MW">MW</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">Examples: 25kW (home), 1MW (commercial), 50MW (utility)</p>
                </div>
              </div>
              
              {/* Duration Calculator with Industry Guidance */}
              <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Discharge Duration:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {powerRating > 0 ? (energyCapacity / powerRating).toFixed(1) : 0} hours
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const duration = powerRating > 0 ? (energyCapacity / powerRating) : 0;
                    if (duration <= 2) return "Ideal for: Frequency regulation, grid stabilization";
                    else if (duration <= 4) return "Ideal for: Peak shaving, demand charge reduction";
                    else if (duration <= 6) return "Ideal for: Load shifting, renewable integration";
                    else return "Ideal for: Backup power, long-duration storage";
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Application Type Selection */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">🏢 Application Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                onClick={() => setApplicationType('residential')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'residential' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className={`font-semibold ${applicationType === 'residential' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Residential
                </div>
                <div className={`text-xs ${applicationType === 'residential' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Home energy storage
                </div>
              </button>
              <button 
                onClick={() => setApplicationType('commercial')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'commercial' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className={`font-semibold ${applicationType === 'commercial' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Commercial
                </div>
                <div className={`text-xs ${applicationType === 'commercial' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Business & industrial
                </div>
              </button>
              <button 
                onClick={() => setApplicationType('utility')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'utility' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <div className={`font-semibold ${applicationType === 'utility' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Utility Scale
                </div>
                <div className={`text-xs ${applicationType === 'utility' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Grid-scale projects
                </div>
              </button>
              <button 
                onClick={() => setApplicationType('ups')}
                className={`p-4 border-2 rounded-lg text-center transition-all hover:shadow-md ${
                  applicationType === 'ups' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="text-2xl mb-2">🔋</div>
                <div className={`font-semibold ${applicationType === 'ups' ? 'text-blue-700' : 'text-gray-700'}`}>
                  UPS/Backup
                </div>
                <div className={`text-xs ${applicationType === 'ups' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Critical power backup
                </div>
              </button>
            </div>
          </div>

          {/* Progress Indicator & Next Steps */}
          {applicationType && (
            <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-green-800">Great! You selected {applicationType} application</h4>
                  <p className="text-sm text-green-700">Now let's configure your specific requirements</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">👉</span>
                  Your Next Steps:
                </h5>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-gray-700">Set your power requirements above ⬆️</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-gray-700">Use Quick Actions below to generate analysis ⬇️</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-gray-700">Explore Advanced Options for detailed configuration</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Quick Start:</span> 
                    {applicationType === 'residential' && " Try 10-20 kWh for most homes, or use our ROI calculator below."}
                    {applicationType === 'commercial' && " Start with 50-500 kWh depending on your facility size."}
                    {applicationType === 'utility' && " Consider 1-100 MWh based on grid requirements."}
                    {applicationType === 'ups' && " UPS systems typically need 0.5-2 hours duration with power matching critical loads."}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings Guide - Moved here for better visibility */}
          <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm p-6 border border-amber-200">
            <h4 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📚</span>
              Advanced Settings Guide
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <div className="font-semibold text-amber-800">Configure System Size</div>
                  <div className="text-amber-700">Enter your exact power requirements - no limits! Use kW/kWh for smaller projects, MW/MWh for large ones.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <div className="font-semibold text-amber-800">Select Application Type</div>
                  <div className="text-amber-700">Choose residential, commercial, or utility-scale for optimized recommendations.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <div>
                  <div className="font-semibold text-amber-800">Review AI Suggestions</div>
                  <div className="text-amber-700">Our AI analyzes your configuration and provides real-time optimization tips.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <div>
                  <div className="font-semibold text-amber-800">Generate Analysis</div>
                  <div className="text-amber-700">Use Quick Actions to run detailed analytics, create quotes, or export your configuration.</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-amber-300">
              <div className="text-xs text-amber-700">
                <strong>💡 Pro Tip:</strong> Start with your actual power needs, then let our AI guide optimizations. 
                Don't worry about predefined categories - every project is unique!
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center gap-3 w-full p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl hover:from-indigo-100 hover:to-blue-100 transition-all duration-200"
            >
              <span className="text-2xl">{showAdvancedOptions ? '🔽' : '▶️'}</span>
              <div className="text-left flex-1">
                <div className="font-bold text-indigo-800">Advanced Configuration Options</div>
                <div className="text-sm text-indigo-600">
                  {showAdvancedOptions ? 'Click to hide advanced settings' : 'Click to access detailed system configuration'}
                </div>
              </div>
              <span className="text-indigo-600 font-semibold">
                {showAdvancedOptions ? 'Hide' : 'Show'}
              </span>
            </button>
          </div>

          {/* Use Case ROI Calculator - Moved below Advanced Configuration */}
          {/* ROI now moved to dedicated full-width section below */}

        </div>
      </div>

      {/* AI ASSISTANT SIDEBAR */}
      <div className="space-y-6">
        {/* Quick Actions Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🚀</span>
            <h3 className="text-lg font-bold text-blue-800">Quick Actions</h3>
          </div>
          
          {/* AI Chat Assistant */}
          <div className="mb-4">
            <button
              onClick={() => openModal('showChatModal')}
              className="w-full p-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">💬</span>
                <span>Chat with AI Assistant</span>
              </div>
              <div className="text-sm opacity-90 mt-1">Get instant help & recommendations</div>
            </button>
          </div>
          
          {/* Analysis Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('📊 Enhanced Analytics button clicked!');
                openModal('showEnhancedAnalytics');
              }}
              className="w-full p-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span>📊</span>
                <span>Enhanced Analytics</span>
              </div>
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚀 BESS Analytics button clicked!');
                openModal('bessAnalytics');
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full p-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span>⚡</span>
                <span>BESS Analytics</span>
              </div>
            </button>
            
            <button
              onClick={() => openModal('showTemplates')}
              className="w-full p-3 bg-violet-500 text-white rounded-lg font-semibold hover:bg-violet-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span>📋</span>
                <span>Use Case Templates</span>
              </div>
            </button>
            
            <button
              onClick={handleSaveProject}
              className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <span>💾</span>
                <span>Save Project</span>
              </div>
            </button>
          </div>
          
        </div>

        {/* Current Configuration Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Configuration Summary
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Project:</span>
              <span className="font-semibold text-gray-800">{quoteName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Energy Capacity:</span>
              <span className="font-semibold text-gray-800">{energyCapacity} {energyUnit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Power Rating:</span>
              <span className="font-semibold text-gray-800">{powerRating} {powerUnit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Application:</span>
              <span className="font-semibold text-gray-800 capitalize">{applicationType}</span>
            </div>
            {powerRating > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-800">{(energyCapacity / powerRating).toFixed(1)} hours</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      
    {/* ROI Calculator & Use Cases - Full Width Section */}
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border border-green-200">
      <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
        <span className="text-3xl">💰</span>
        ROI Calculator & Use Cases
      </h3>
      <UseCaseROI
        onLoadTemplate={(useCase) => {
          // Handle loading use case template
          console.log('Loading use case template:', useCase);
        }}
        autoRotate={true}
        rotationInterval={10000}
      />
    </div>
  </div>
);
};

export default MainQuoteForm;