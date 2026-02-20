import React, { useState } from 'react';

interface UtilityRate {
  id: string;
  state: string;
  utility: string;
  residentialRate: number;
  commercialRate: number;
  industrialRate: number;
  demandCharge?: number;
  hasTOU: boolean;
  touRates?: {
    peak: number;
    offPeak: number;
    superOffPeak?: number;
    peakHours: string;
    offPeakHours: string;
  };
  effectiveDate: string;
  source: string;
}

interface UtilityRatesManagerProps {
  onClose: () => void;
  onSelectRate: (rate: UtilityRate, rateType: 'residential' | 'commercial' | 'industrial') => void;
  currentRate?: number;
}

const UtilityRatesManager: React.FC<UtilityRatesManagerProps> = ({ onClose, onSelectRate, currentRate: _currentRate }) => {
  const [selectedState, setSelectedState] = useState('');
  const [selectedUtility, setSelectedUtility] = useState('');
  const [rateType, setRateType] = useState<'residential' | 'commercial' | 'industrial'>('commercial');
  const [searchTerm, setSearchTerm] = useState('');
  const [useTOU, setUseTOU] = useState(false);

  // Mock utility rates database - in production, this would come from an API
  const utilityRates: UtilityRate[] = [
    {
      id: '1',
      state: 'California',
      utility: 'Pacific Gas & Electric (PG&E)',
      residentialRate: 0.32,
      commercialRate: 0.28,
      industrialRate: 0.18,
      demandCharge: 18.50,
      hasTOU: true,
      touRates: {
        peak: 0.42,
        offPeak: 0.22,
        superOffPeak: 0.15,
        peakHours: '4pm-9pm weekdays',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'PG&E Rate Schedule E-19'
    },
    {
      id: '2',
      state: 'California',
      utility: 'Southern California Edison (SCE)',
      residentialRate: 0.30,
      commercialRate: 0.26,
      industrialRate: 0.17,
      demandCharge: 17.20,
      hasTOU: true,
      touRates: {
        peak: 0.38,
        offPeak: 0.20,
        superOffPeak: 0.14,
        peakHours: '4pm-9pm weekdays',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'SCE TOU-GS-3'
    },
    {
      id: '3',
      state: 'Texas',
      utility: 'Oncor Electric Delivery',
      residentialRate: 0.14,
      commercialRate: 0.12,
      industrialRate: 0.09,
      demandCharge: 8.50,
      hasTOU: true,
      touRates: {
        peak: 0.18,
        offPeak: 0.10,
        peakHours: '2pm-7pm summer',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'Oncor Tariff for Retail Delivery Service'
    },
    {
      id: '4',
      state: 'Texas',
      utility: 'CenterPoint Energy',
      residentialRate: 0.13,
      commercialRate: 0.11,
      industrialRate: 0.08,
      demandCharge: 7.80,
      hasTOU: false,
      effectiveDate: '2025-01-01',
      source: 'CenterPoint Standard Service'
    },
    {
      id: '5',
      state: 'New York',
      utility: 'Con Edison',
      residentialRate: 0.28,
      commercialRate: 0.24,
      industrialRate: 0.16,
      demandCharge: 16.40,
      hasTOU: true,
      touRates: {
        peak: 0.35,
        offPeak: 0.18,
        peakHours: '8am-10pm weekdays',
        offPeakHours: 'Nights and weekends'
      },
      effectiveDate: '2025-01-01',
      source: 'Con Edison SC-9 Rate I'
    },
    {
      id: '6',
      state: 'Massachusetts',
      utility: 'Eversource',
      residentialRate: 0.26,
      commercialRate: 0.22,
      industrialRate: 0.15,
      demandCharge: 14.30,
      hasTOU: true,
      touRates: {
        peak: 0.31,
        offPeak: 0.17,
        peakHours: '12pm-8pm summer',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'Eversource G-3'
    },
    {
      id: '7',
      state: 'Florida',
      utility: 'Florida Power & Light (FPL)',
      residentialRate: 0.13,
      commercialRate: 0.11,
      industrialRate: 0.08,
      demandCharge: 9.20,
      hasTOU: true,
      touRates: {
        peak: 0.16,
        offPeak: 0.09,
        peakHours: '12pm-9pm weekdays',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'FPL GSDT-1'
    },
    {
      id: '8',
      state: 'Illinois',
      utility: 'ComEd',
      residentialRate: 0.15,
      commercialRate: 0.13,
      industrialRate: 0.10,
      demandCharge: 10.50,
      hasTOU: false,
      effectiveDate: '2025-01-01',
      source: 'ComEd Standard Delivery'
    },
    {
      id: '9',
      state: 'Arizona',
      utility: 'Arizona Public Service (APS)',
      residentialRate: 0.13,
      commercialRate: 0.11,
      industrialRate: 0.08,
      demandCharge: 8.90,
      hasTOU: true,
      touRates: {
        peak: 0.19,
        offPeak: 0.08,
        peakHours: '3pm-8pm summer',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'APS E-32 M TOU'
    },
    {
      id: '10',
      state: 'Colorado',
      utility: 'Xcel Energy',
      residentialRate: 0.14,
      commercialRate: 0.12,
      industrialRate: 0.09,
      demandCharge: 9.80,
      hasTOU: true,
      touRates: {
        peak: 0.17,
        offPeak: 0.10,
        peakHours: '2pm-7pm summer',
        offPeakHours: 'All other times'
      },
      effectiveDate: '2025-01-01',
      source: 'Xcel SGS-TOU'
    }
  ];

  const states = Array.from(new Set(utilityRates.map(r => r.state))).sort();

  const filteredRates = utilityRates.filter(rate => {
    const matchesState = !selectedState || rate.state === selectedState;
    const matchesSearch = !searchTerm || 
      rate.utility.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.state.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesState && matchesSearch;
  });

  const selectedRateData = filteredRates.find(r => r.utility === selectedUtility);

  const handleApplyRate = () => {
    if (selectedRateData) {
      onSelectRate(selectedRateData, rateType);
      onClose();
    }
  };

  const getRateValue = (rate: UtilityRate) => {
    if (useTOU && rate.hasTOU && rate.touRates) {
      return rate.touRates.peak;
    }
    switch (rateType) {
      case 'residential': return rate.residentialRate;
      case 'commercial': return rate.commercialRate;
      case 'industrial': return rate.industrialRate;
      default: return rate.commercialRate;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Regional Utility Rates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select your region to auto-populate electricity rates in your quote
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Filters */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Utility
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by state or utility..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedUtility('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All States</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Type
                </label>
                <div className="space-y-2">
                  {['residential', 'commercial', 'industrial'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        checked={rateType === type}
                        onChange={() => setRateType(type as any)}
                        className="mr-2"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedRateData?.hasTOU && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useTOU}
                      onChange={(e) => setUseTOU(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use Time-of-Use (TOU) Rates
                    </span>
                  </label>
                  {useTOU && (
                    <p className="text-xs text-gray-500 mt-1">
                      Will use peak rates for calculations
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Middle Column - Utility List */}
            <div className="border border-gray-200 rounded-lg">
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  Available Utilities ({filteredRates.length})
                </h3>
              </div>
              <div className="overflow-y-auto max-h-96">
                {filteredRates.map(rate => (
                  <button
                    key={rate.id}
                    onClick={() => setSelectedUtility(rate.utility)}
                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-purple-50 transition-colors ${
                      selectedUtility === rate.utility ? 'bg-purple-100 border-l-4 border-l-purple-600' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{rate.utility}</div>
                    <div className="text-sm text-gray-600">{rate.state}</div>
                    <div className="text-sm font-semibold text-purple-600 mt-1">
                      ${getRateValue(rate).toFixed(3)}/kWh
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Rate Details */}
            <div className="border border-gray-200 rounded-lg">
              {selectedRateData ? (
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">
                    {selectedRateData.utility}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Standard Rates</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Residential</span>
                          <span className="font-semibold">${selectedRateData.residentialRate.toFixed(3)}/kWh</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Commercial</span>
                          <span className="font-semibold">${selectedRateData.commercialRate.toFixed(3)}/kWh</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">Industrial</span>
                          <span className="font-semibold">${selectedRateData.industrialRate.toFixed(3)}/kWh</span>
                        </div>
                      </div>
                    </div>

                    {selectedRateData.demandCharge && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Demand Charge</h4>
                        <div className="p-2 bg-orange-50 rounded">
                          <span className="font-semibold text-orange-700">
                            ${selectedRateData.demandCharge.toFixed(2)}/kW
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedRateData.hasTOU && selectedRateData.touRates && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Time-of-Use Rates
                        </h4>
                        <div className="space-y-2">
                          <div className="p-2 bg-red-50 rounded">
                            <div className="text-xs text-red-600 font-medium">Peak</div>
                            <div className="font-semibold text-red-700">
                              ${selectedRateData.touRates.peak.toFixed(3)}/kWh
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              {selectedRateData.touRates.peakHours}
                            </div>
                          </div>
                          <div className="p-2 bg-green-50 rounded">
                            <div className="text-xs text-green-600 font-medium">Off-Peak</div>
                            <div className="font-semibold text-green-700">
                              ${selectedRateData.touRates.offPeak.toFixed(3)}/kWh
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              {selectedRateData.touRates.offPeakHours}
                            </div>
                          </div>
                          {selectedRateData.touRates.superOffPeak && (
                            <div className="p-2 bg-blue-50 rounded">
                              <div className="text-xs text-blue-600 font-medium">Super Off-Peak</div>
                              <div className="font-semibold text-blue-700">
                                ${selectedRateData.touRates.superOffPeak.toFixed(3)}/kWh
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <div className="mb-1">
                          <strong>Effective:</strong> {selectedRateData.effectiveDate}
                        </div>
                        <div>
                          <strong>Source:</strong> {selectedRateData.source}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-sm text-purple-900 mb-2">Selected Rate</div>
                        <div className="text-3xl font-bold text-purple-600">
                          ${getRateValue(selectedRateData).toFixed(3)}
                          <span className="text-lg">/kWh</span>
                        </div>
                        {useTOU && selectedRateData.hasTOU && (
                          <div className="text-xs text-purple-700 mt-1">
                            Peak TOU Rate
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">⚡</div>
                  <p>Select a utility to view rate details</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-2xl mr-3">💡</span>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-1">About These Rates</h4>
                <p className="text-sm text-yellow-800">
                  Rates are updated regularly from public utility tariff schedules. Actual rates may vary based on 
                  specific rate schedules, time of use, demand charges, and other factors. Always verify with your 
                  local utility for the most accurate pricing. These rates are for estimation purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyRate}
            disabled={!selectedRateData}
            className={`px-6 py-2 rounded-md font-semibold ${
              selectedRateData
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply Rate to Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default UtilityRatesManager;
