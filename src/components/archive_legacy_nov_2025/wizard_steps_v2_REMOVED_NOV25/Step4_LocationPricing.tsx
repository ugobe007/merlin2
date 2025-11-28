import React, { useState } from 'react';
import AIStatusIndicator from '../AIStatusIndicator';

interface Step4_LocationPricingProps {
  location: string;
  setLocation: (value: string) => void;
  electricityRate: number;
  setElectricityRate: (value: number) => void;
  knowsRate: boolean;
  setKnowsRate: (value: boolean) => void;
}

const Step4_LocationPricing: React.FC<Step4_LocationPricingProps> = ({
  location,
  setLocation,
  electricityRate,
  setElectricityRate,
  knowsRate,
  setKnowsRate,
}) => {
  
  const [selectedCountry, setSelectedCountry] = useState('United States');
  const [selectedState, setSelectedState] = useState('');

  const countries = [
    'United States',
    'Canada',
    'United Kingdom',
    'Germany',
    'France',
    'Australia',
    'Japan',
    'South Korea',
    'China',
    'India',
    'Brazil',
    'Mexico',
    'Other'
  ];

  const usStates = [
    { name: 'California', avgRate: 0.23, tier: 'High' },
    { name: 'Texas', avgRate: 0.12, tier: 'Low' },
    { name: 'New York', avgRate: 0.19, tier: 'High' },
    { name: 'Florida', avgRate: 0.13, tier: 'Medium' },
    { name: 'Illinois', avgRate: 0.14, tier: 'Medium' },
    { name: 'Massachusetts', avgRate: 0.22, tier: 'High' },
    { name: 'Pennsylvania', avgRate: 0.14, tier: 'Medium' },
    { name: 'Ohio', avgRate: 0.12, tier: 'Low' },
    { name: 'Georgia', avgRate: 0.13, tier: 'Medium' },
    { name: 'North Carolina', avgRate: 0.12, tier: 'Low' },
    { name: 'Michigan', avgRate: 0.17, tier: 'Medium' },
    { name: 'New Jersey', avgRate: 0.16, tier: 'Medium' },
    { name: 'Virginia', avgRate: 0.12, tier: 'Low' },
    { name: 'Washington', avgRate: 0.10, tier: 'Low' },
    { name: 'Arizona', avgRate: 0.13, tier: 'Medium' },
    { name: 'Other', avgRate: 0.15, tier: 'Medium' }
  ];

  const handleStateSelect = (stateName: string) => {
    setSelectedState(stateName);
    setLocation(`${stateName}, United States`);
    
    const state = usStates.find(s => s.name === stateName);
    if (state && !knowsRate) {
      setElectricityRate(state.avgRate);
    }
  };

  const getRateTier = (rate: number) => {
    if (rate < 0.12) return { label: 'Low', color: 'text-green-600', bg: 'bg-green-50' };
    if (rate < 0.18) return { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'High', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const rateTier = getRateTier(electricityRate);
  const selectedStateData = usStates.find(s => s.name === selectedState);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-3">
          <h2 className="text-4xl font-bold text-gray-800">
            Location & Energy Rates
          </h2>
          <AIStatusIndicator compact={true} />
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Tell us where your project is located and what you pay for electricity
        </p>
      </div>

      {/* Country Selection */}
      <div className="bg-white rounded-xl border-2 border-blue-400 p-6 shadow-lg">
        <label className="block text-xl font-bold text-gray-800 mb-4">
          🌍 Where is this project located?
        </label>
        
        <select
          value={selectedCountry}
          onChange={(e) => {
            setSelectedCountry(e.target.value);
            setSelectedState('');
            if (e.target.value !== 'United States') {
              setLocation(e.target.value);
            }
          }}
          className="w-full p-4 border-2 border-gray-300 rounded-xl text-lg text-gray-900 font-semibold focus:border-blue-500 focus:outline-none"
        >
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        {/* US State Selection */}
        {selectedCountry === 'United States' && (
          <div className="mt-6">
            <label className="block text-lg font-bold text-gray-800 mb-3">
              Select State:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {usStates.map((state) => (
                <button
                  key={state.name}
                  onClick={() => handleStateSelect(state.name)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedState === state.name
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 text-sm">{state.name}</div>
                  <div className="text-xs text-gray-500">${state.avgRate.toFixed(2)}/kWh</div>
                  <div className={`text-xs font-semibold ${
                    state.tier === 'High' ? 'text-red-600' :
                    state.tier === 'Medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {state.tier} Cost
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCountry !== 'United States' && (
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Location set:</strong> {selectedCountry}
            </p>
          </div>
        )}
      </div>

      {/* Electricity Rate */}
      <div className="bg-white rounded-xl border-2 border-green-400 p-6 shadow-lg">
        <label className="block text-xl font-bold text-gray-800 mb-4">
          ⚡ What do you pay for electricity?
        </label>

        {/* Know rate toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setKnowsRate(false);
              if (selectedStateData) {
                setElectricityRate(selectedStateData.avgRate);
              }
            }}
            className={`flex-1 p-4 rounded-xl font-semibold transition-all ${
              !knowsRate
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            I don't know - Estimate it
          </button>
          <button
            onClick={() => setKnowsRate(true)}
            className={`flex-1 p-4 rounded-xl font-semibold transition-all ${
              knowsRate
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            I know my rate
          </button>
        </div>

        {knowsRate ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.50"
                value={electricityRate}
                onChange={(e) => setElectricityRate(parseFloat(e.target.value) || 0.15)}
                className="flex-1 p-4 border-2 border-gray-300 rounded-xl text-2xl font-bold text-gray-900 text-center focus:border-green-500 focus:outline-none"
              />
              <span className="text-gray-600 font-semibold">per kWh</span>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              Enter your commercial/industrial electricity rate
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedStateData ? (
              <div className={`p-6 rounded-xl ${rateTier.bg} border-2 ${
                rateTier.label === 'High' ? 'border-red-300' :
                rateTier.label === 'Medium' ? 'border-yellow-300' :
                'border-green-300'
              }`}>
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-600 mb-2">Estimated Rate for {selectedState}:</div>
                  <div className="text-4xl font-bold text-gray-900">
                    ${electricityRate.toFixed(3)}<span className="text-xl">/kWh</span>
                  </div>
                  <div className={`text-lg font-semibold ${rateTier.color} mt-2`}>
                    {rateTier.label} Cost State
                  </div>
                </div>
                <div className="text-sm text-gray-600 text-center">
                  Average commercial/industrial rate - Your actual rate may vary
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-300">
                <div className="text-center text-gray-600">
                  Please select your location above to see estimated rates
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick rate presets */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-700 mb-2">Common Rates:</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setElectricityRate(0.10);
                setKnowsRate(true);
              }}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm font-semibold text-green-700"
            >
              $0.10 (Low)
            </button>
            <button
              onClick={() => {
                setElectricityRate(0.15);
                setKnowsRate(true);
              }}
              className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-sm font-semibold text-yellow-700"
            >
              $0.15 (Typical)
            </button>
            <button
              onClick={() => {
                setElectricityRate(0.20);
                setKnowsRate(true);
              }}
              className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-semibold text-orange-700"
            >
              $0.20 (High)
            </button>
            <button
              onClick={() => {
                setElectricityRate(0.25);
                setKnowsRate(true);
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold text-red-700"
            >
              $0.25 (Very High)
            </button>
          </div>
        </div>
      </div>

      {/* Savings Impact Preview */}
      {electricityRate > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
            💰 How Your Rate Affects Savings
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">
                ${((electricityRate - 0.05) * 1000).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Savings per MWh shifted</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">
                {electricityRate >= 0.18 ? 'High' : electricityRate >= 0.12 ? 'Good' : 'Moderate'}
              </div>
              <div className="text-sm text-gray-600">Storage ROI potential</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">
                {electricityRate >= 0.18 ? '3-5' : electricityRate >= 0.12 ? '5-7' : '7-10'} yrs
              </div>
              <div className="text-sm text-gray-600">Estimated payback</div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Higher electricity rates = Better ROI for energy storage
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Why Location Matters</h4>
            <ul className="text-gray-700 space-y-1 text-sm">
              <li>✓ <strong>Electricity rates vary</strong> by state and utility company</li>
              <li>✓ <strong>Shipping costs</strong> depend on distance from suppliers</li>
              <li>✓ <strong>Local incentives</strong> and programs differ by region</li>
              <li>✓ <strong>Interconnection rules</strong> vary by utility and ISO</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4_LocationPricing;
