/**
 * Step 4: Location & Pricing
 * Clean rebuild for V3 architecture
 * NOW WITH: Intelligent recommendations based on utility rates
 */

import React, { useMemo } from 'react';
import { MapPin, DollarSign, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import type { BaseStepProps } from '../SmartWizardV3.types';
import { analyzeUtilityRate } from '@/utils/utilityRateAnalysis';

interface Step4Props extends BaseStepProps {
  location: string;
  onUpdateLocation: (location: string) => void;
  electricityRate: number;
  onUpdateRate: (rate: number) => void;
  storageSizeMW?: number;
  durationHours?: number;
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  onEditPowerProfile?: () => void; // Allow going back to Step 3
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const Step4_LocationPricing: React.FC<Step4Props> = ({
  location,
  onUpdateLocation,
  electricityRate,
  onUpdateRate,
  storageSizeMW = 0,
  solarMW = 0,
  onEditPowerProfile,
  onNext,
  onBack
}) => {
  // Analyze utility rates and get smart recommendations
  const rateAnalysis = useMemo(() => {
    if (location && electricityRate > 0) {
      return analyzeUtilityRate(location, electricityRate);
    }
    return null;
  }, [location, electricityRate]);
  
  const showRecommendation = rateAnalysis && rateAnalysis.category !== 'low';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Location & Pricing
        </h2>
        <p className="text-lg text-gray-600 mb-3">
          Tell us where your project is located
        </p>
      </div>

      {/* INTELLIGENT RECOMMENDATIONS - MOVED TO TOP FOR VISIBILITY */}
      {showRecommendation && rateAnalysis && (
        <div 
          className={`border-3 rounded-2xl p-8 mb-6 animate-pulse-slow ${
            rateAnalysis.category === 'very-high' ? 'bg-red-50 border-red-500 shadow-red-200' :
            rateAnalysis.category === 'high' ? 'bg-yellow-50 border-yellow-500 shadow-yellow-200' :
            'bg-blue-50 border-blue-500 shadow-blue-200'
          } shadow-2xl`}
          style={{ 
            animation: rateAnalysis.category === 'very-high' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }}
        >
          <div className="flex items-start gap-6">
            <div className="text-6xl animate-bounce">{rateAnalysis.recommendation.icon}</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {rateAnalysis.recommendation.title}
              </h3>
              <p className="text-lg text-gray-700 mb-4">
                {rateAnalysis.recommendation.description}
              </p>
              
              <div className="bg-white rounded-xl p-6 mb-4 border-l-8 border-purple-600 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb className="w-7 h-7 text-purple-600" />
                  <span className="text-xl font-bold text-gray-900">Merlin's Recommendation:</span>
                </div>
                <p className="text-gray-800 font-semibold mb-3 text-lg">
                  {rateAnalysis.recommendation.action}
                </p>
                <div className="flex items-center gap-3 text-green-700 bg-green-100 rounded-lg p-3">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-lg font-bold">{rateAnalysis.recommendation.savings}</span>
                </div>
              </div>

              {/* Current Power Profile Status */}
              <div className="bg-white rounded-xl p-5 mb-4 shadow-md">
                <div className="text-base font-bold text-gray-700 mb-3">Your Current Power Profile:</div>
                <div className="flex gap-6 items-center">
                  <div>
                    <span className="text-sm text-gray-600">Battery:</span>
                    <span className="ml-2 font-bold text-blue-600 text-lg">{storageSizeMW.toFixed(1)} MW</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Solar:</span>
                    <span className="ml-2 font-bold text-yellow-600 text-lg">{solarMW.toFixed(1)} MW</span>
                  </div>
                  {solarMW === 0 && rateAnalysis.category !== 'low' && (
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-100 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-bold">No solar added yet</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {onEditPowerProfile && solarMW === 0 && rateAnalysis.category !== 'low' && (
                <button
                  onClick={onEditPowerProfile}
                  className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-bold text-lg shadow-xl transform hover:scale-105"
                >
                  <span>← Go Back & Add Solar to Your Power Profile</span>
                </button>
              )}
              
              {solarMW > 0 && (
                <div className="flex items-center gap-3 text-green-700 bg-green-100 rounded-xl p-4 shadow-md">
                  <span className="text-3xl">✓</span>
                  <span className="font-bold text-lg">Great! You've already added solar to optimize for high rates.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Positive feedback for low-rate states - ALSO AT TOP */}
      {rateAnalysis && rateAnalysis.category === 'low' && (
        <div className="bg-green-50 border-3 border-green-500 rounded-2xl p-8 mb-6 shadow-2xl">
          <div className="flex items-center gap-5">
            <span className="text-6xl">✅</span>
            <div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                Excellent! Your Power Profile is Well-Optimized
              </h3>
              <p className="text-green-800 text-lg">
                At ${electricityRate.toFixed(3)}/kWh, your electricity rates are favorable. 
                Your battery-focused configuration is the most cost-effective approach.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NOW: Location input section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>💡 What happens next:</strong> Once we know your location, we'll analyze your complete power profile to identify any gaps between available and required power.
        </p>
      </div>

      {/* Location */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Project Location</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            value={location || ''}
            onChange={(e) => onUpdateLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            style={{ color: location ? '#111827' : '#6B7280' }}
          >
            <option value="" disabled className="text-gray-500">Select a state...</option>
            {US_STATES.map(state => (
              <option key={state} value={state} className="text-gray-900 bg-white">{state}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Electricity Rate */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Electricity Rate</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Rate ($/kWh)
          </label>
          <input
            type="number"
            value={electricityRate || ''}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0) {
                onUpdateRate(val);
              }
            }}
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            placeholder="0.12"
          />
          <p className="mt-2 text-sm text-gray-500">
            Average commercial rate in {location}: ~$0.12-0.18/kWh
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Location and electricity rates affect equipment pricing and
          projected savings. We'll calculate the optimal configuration for your region.
        </p>
      </div>

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
            disabled={!location || electricityRate <= 0}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              location && electricityRate > 0
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next: Quote Summary →
          </button>
        </div>
      )}
    </div>
  );
};

export default Step4_LocationPricing;
