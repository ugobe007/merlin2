/**
 * CONFIGURATION SUMMARY - Floating Sidebar
 * ========================================
 * 
 * Collapsible sidebar that shows configuration summary for each step.
 * Hidden by default with a tab indicator, expands when clicked.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Building2, Target, MapPin, Battery, Settings, Zap } from 'lucide-react';

export interface ConfigurationSummaryProps {
  // Step 1 data
  location?: {
    state?: string;
    zipCode?: string;
    utilityRate?: number;
  };
  goals?: string[];
  
  // Step 2 data
  industry?: {
    name?: string;
    id?: string;
  };
  facilitySize?: {
    rooms?: number;
    squareFootage?: number;
    bayCount?: number;
  };
  
  // Step 3 data
  amenities?: Array<{ name: string; category?: string }>;
  equipment?: Array<{ name: string; value?: string | number }>;
  
  // Step 4 data
  selectedStrategy?: {
    name: string;
    batteryKW?: number;
    batteryKWh?: number;
    solarKW?: number;
    generatorKW?: number;
    annualSavings?: number;
  };
  
  // Step 5 data
  quoteSummary?: {
    annualSavings?: number;
    paybackYears?: number;
    totalCost?: number;
  };
  
  currentStep: number;
}

export function ConfigurationSummary({
  location,
  goals,
  industry,
  facilitySize,
  amenities,
  equipment,
  selectedStrategy,
  quoteSummary,
  currentStep,
}: ConfigurationSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const goalLabels: Record<string, string> = {
    'cost-savings': 'Save Money',
    'sustainability': 'Sustainability',
    'backup-power': 'Backup Power',
    'ev-ready': 'Grid Independence',
    'demand-management': 'Peak Shaving',
    'generate-revenue': 'Generate Revenue'
  };
  
  const formatNumber = (num?: number) => {
    if (!num || num === 0) return '—';
    return num.toLocaleString();
  };
  
  return (
    <>
      {/* Tab Indicator - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-60px)]'
        }`}
        aria-label={isExpanded ? 'Collapse summary' : 'Expand summary'}
      >
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-l-2xl px-4 py-6 shadow-2xl border-2 border-purple-400/50 flex flex-col items-center gap-3 min-h-[200px] justify-center">
          {isExpanded ? (
            <ChevronRight className="w-6 h-6 text-white" />
          ) : (
            <>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="text-white text-xs font-bold text-center leading-tight">
                Your<br />Config
              </div>
            </>
          )}
        </div>
      </button>
      
      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-l-2xl shadow-2xl border-2 border-purple-300/50 w-[320px] max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Configuration Summary
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Step 1: Location & Goals - Show Numbers */}
              {currentStep >= 1 && location && location.state && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-800 font-bold text-sm">Location</span>
                  </div>
                  <div className="text-gray-900 font-bold text-base mb-1">
                    {location.state} {location.zipCode && `(${location.zipCode})`}
                  </div>
                  {location.utilityRate && (
                    <div className="text-sm text-purple-700 font-semibold">
                      ${location.utilityRate.toFixed(3)}/kWh
                    </div>
                  )}
                </div>
              )}
              
              {currentStep >= 1 && goals && goals.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-800 font-bold text-sm">Goals</span>
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {goals.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {goals.map(goal => (
                      <span key={goal} className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-700">
                        {goalLabels[goal] || goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 2: Industry & Size - Show Numbers */}
              {currentStep >= 2 && industry && industry.name && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-800 font-bold text-sm">Industry</span>
                  </div>
                  <div className="text-gray-900 font-bold text-base">{industry.name}</div>
                </div>
              )}
              
              {currentStep >= 2 && facilitySize && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <div className="text-gray-800 font-bold text-sm mb-2">Facility Size</div>
                  {facilitySize.rooms && (
                    <div className="text-gray-900 font-bold text-base mb-1">
                      {facilitySize.rooms.toLocaleString()} <span className="text-sm font-normal text-gray-600">rooms</span>
                    </div>
                  )}
                  {facilitySize.squareFootage && (
                    <div className="text-gray-900 font-bold text-base mb-1">
                      {facilitySize.squareFootage.toLocaleString()} <span className="text-sm font-normal text-gray-600">sqft</span>
                    </div>
                  )}
                  {facilitySize.bayCount && (
                    <div className="text-gray-900 font-bold text-base">
                      {facilitySize.bayCount} <span className="text-sm font-normal text-gray-600">bays</span>
                    </div>
                  )}
                  {!facilitySize.rooms && !facilitySize.squareFootage && !facilitySize.bayCount && (
                    <div className="text-xs text-gray-500">Not specified</div>
                  )}
                </div>
              )}
              
              {/* Step 3: Amenities & Equipment - Show Count */}
              {currentStep >= 3 && amenities && amenities.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-gray-800 font-bold text-sm">Amenities</span>
                    <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                      {amenities.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {amenities.slice(0, 4).map((amenity, idx) => (
                      <div key={idx} className="text-xs text-gray-700 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="truncate">{amenity.name}</span>
                      </div>
                    ))}
                    {amenities.length > 4 && (
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        +{amenities.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 4: Selected Strategy - Show All Numbers */}
              {currentStep >= 4 && selectedStrategy && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Battery className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-800 font-bold text-sm">{selectedStrategy.name}</span>
                  </div>
                  {selectedStrategy.batteryKW && (
                    <div className="text-sm text-gray-900 font-bold mb-1.5">
                      {formatNumber(selectedStrategy.batteryKW)} <span className="text-xs font-normal text-gray-600">kW battery</span>
                    </div>
                  )}
                  {selectedStrategy.batteryKWh && (
                    <div className="text-sm text-gray-900 font-bold mb-1.5">
                      {formatNumber(selectedStrategy.batteryKWh)} <span className="text-xs font-normal text-gray-600">kWh capacity</span>
                    </div>
                  )}
                  {selectedStrategy.solarKW && selectedStrategy.solarKW > 0 && (
                    <div className="text-sm text-gray-900 font-bold mb-1.5">
                      {formatNumber(selectedStrategy.solarKW)} <span className="text-xs font-normal text-gray-600">kW solar</span>
                    </div>
                  )}
                  {selectedStrategy.generatorKW && selectedStrategy.generatorKW > 0 && (
                    <div className="text-sm text-gray-900 font-bold mb-1.5">
                      {formatNumber(selectedStrategy.generatorKW)} <span className="text-xs font-normal text-gray-600">kW generator</span>
                    </div>
                  )}
                  {selectedStrategy.annualSavings && (
                    <div className="bg-emerald-100 rounded-lg p-2 mt-2">
                      <div className="text-xs text-gray-600 mb-0.5">Annual Savings</div>
                      <div className="text-base text-emerald-700 font-bold">
                        ${selectedStrategy.annualSavings.toLocaleString()}/yr
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 5: Quote Summary - Show All Numbers */}
              {currentStep >= 5 && quoteSummary && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="text-gray-800 font-bold text-sm mb-3">Quote Summary</div>
                  {quoteSummary.annualSavings && (
                    <div className="mb-2.5">
                      <div className="text-xs text-gray-600 mb-0.5">Annual Savings</div>
                      <div className="text-base text-emerald-700 font-bold">
                        ${quoteSummary.annualSavings.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {quoteSummary.paybackYears && (
                    <div className="mb-2.5">
                      <div className="text-xs text-gray-600 mb-0.5">Payback Period</div>
                      <div className="text-base text-gray-900 font-bold">
                        {quoteSummary.paybackYears.toFixed(1)} <span className="text-sm font-normal">years</span>
                      </div>
                    </div>
                  )}
                  {quoteSummary.totalCost && (
                    <div>
                      <div className="text-xs text-gray-600 mb-0.5">Total Investment</div>
                      <div className="text-base text-gray-900 font-bold">
                        ${quoteSummary.totalCost.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {currentStep < 2 && (
                <div className="text-xs text-gray-500 text-center py-4">
                  Continue through the wizard to see your configuration
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

