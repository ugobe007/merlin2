/**
 * Step 3: Configuration Comparison
 * 
 * Show 3 presets: Starter / Recommended / Maximum
 * Allow user to choose sizing strategy
 */

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface Step3ConfigurationProps {
  configurationOptions: any[];
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Configuration({
  configurationOptions,
  onNext,
  onBack,
}: Step3ConfigurationProps) {
  
  const [selectedConfig, setSelectedConfig] = useState('recommended');

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Configuration
        </h1>
        <p className="text-lg text-gray-600">
          Three options to fit your needs and budget
        </p>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {configurationOptions.map((config) => (
          <button
            key={config.id}
            onClick={() => setSelectedConfig(config.id)}
            className={`
              relative p-6 rounded-2xl border-2 transition-all text-left
              ${selectedConfig === config.id
                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${config.recommended ? 'shadow-lg' : ''}
            `}
          >
            {/* Recommended Badge */}
            {config.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  RECOMMENDED
                </div>
              </div>
            )}

            {/* Selected Checkmark */}
            {selectedConfig === config.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {config.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {config.description}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage:</span>
                  <span className="font-medium">{Math.round(config.bessKWh)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Power:</span>
                  <span className="font-medium">{config.bessMW.toFixed(2)} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{config.durationHours}h</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {config.estimatedCost}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  {config.estimatedSavings}
                </div>
                <div className="text-xs text-gray-500">
                  Payback: {config.payback}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Add-Ons Section (Placeholder) */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Add-Ons</h3>
        <p className="text-sm text-gray-500">
          Solar, Generator, EV Charging toggles coming soon...
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>Generate Quote</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
