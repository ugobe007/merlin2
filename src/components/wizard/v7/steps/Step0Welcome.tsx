/**
 * Step 0: Welcome + Location + Industry Selection
 * 
 * First step of WizardV7:
 * - Welcome message
 * - State/zip code selection
 * - Industry selection
 */

import React, { useState } from 'react';
import { MapPin, Building2, ArrowRight } from 'lucide-react';

interface Step0WelcomeProps {
  location: { state: string; zipCode: string } | null;
  setLocation: (location: { state: string; zipCode: string }) => void;
  industry: string | null;
  setIndustry: (industry: string) => void;
  onNext: () => void;
  canProceed: boolean;
}

export default function Step0Welcome({
  location,
  setLocation,
  industry,
  setIndustry,
  onNext,
  canProceed,
}: Step0WelcomeProps) {
  
  const [state, setState] = useState(location?.state || '');
  const [zipCode, setZipCode] = useState(location?.zipCode || '');

  const handleLocationSubmit = () => {
    if (state && zipCode) {
      setLocation({ state, zipCode });
    }
  };

  const industries = [
    { value: 'car-wash', label: 'Car Wash', emoji: '🚗' },
    { value: 'hotel', label: 'Hotel', emoji: '🏨' },
    { value: 'truck-stop', label: 'Truck Stop', emoji: '🚛' },
    { value: 'ev-charging', label: 'EV Charging Hub', emoji: '⚡' },
    { value: 'hospital', label: 'Hospital', emoji: '🏥' },
    { value: 'data-center', label: 'Data Center', emoji: '💻' },
    { value: 'office', label: 'Office Building', emoji: '🏢' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Merlin Energy
        </h1>
        <p className="text-lg text-gray-600">
          Let's build your custom battery energy storage quote in minutes
        </p>
      </div>

      {/* Location Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Location</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                handleLocationSubmit();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select state...</option>
              <option value="CA">California</option>
              <option value="TX">Texas</option>
              <option value="NY">New York</option>
              <option value="FL">Florida</option>
              {/* Add more states */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zip Code
            </label>
            <input
              type="text"
              value={zipCode}
              onChange={(e) => {
                setZipCode(e.target.value);
                if (e.target.value.length === 5) {
                  handleLocationSubmit();
                }
              }}
              placeholder="12345"
              maxLength={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Industry Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Industry</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((ind) => (
            <button
              key={ind.value}
              onClick={() => setIndustry(ind.value)}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${industry === ind.value 
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="text-3xl mb-2">{ind.emoji}</div>
              <div className="font-medium text-gray-900">{ind.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            px-6 py-3 rounded-lg font-medium flex items-center space-x-2
            ${canProceed 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
