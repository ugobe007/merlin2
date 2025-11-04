import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, DollarSign, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface UseCaseData {
  id: string;
  industry: string;
  icon: string;
  description: string;
  facilitySize: string;
  
  // Load Profile
  peakPowerKW: number;
  avgPowerKW: number;
  dailyEnergyKWh: number;
  operatingHours: string;
  
  // BESS Solution
  systemSizeMW: number;
  systemSizeMWh: number;
  duration: number;
  
  // Financial Data
  demandChargeBefore: number;
  demandChargeAfter: number;
  energyCostBefore: number;
  energyCostAfter: number;
  
  // ROI Metrics
  totalAnnualSavings: number;
  systemCost: number;
  paybackYears: number;
  roi25Year: string;
  
  // Key Benefits
  keyBenefit1: string;
  keyBenefit2: string;
  keyBenefit3: string;
}

const useCases: UseCaseData[] = [
  {
    id: 'car-wash',
    industry: 'Car Wash (Express Tunnel)',
    icon: '🚗',
    description: '60-120 ft tunnel, 60-120 cars/hr, high dryer loads during peak hours',
    facilitySize: '3,000-5,000 sq ft',
    
    peakPowerKW: 225,
    avgPowerKW: 80,
    dailyEnergyKWh: 1400,
    operatingHours: '7am-9pm (14hrs)',
    
    systemSizeMW: 0.25,
    systemSizeMWh: 0.5,
    duration: 2,
    
    demandChargeBefore: 500000,
    demandChargeAfter: 230000,
    energyCostBefore: 1200000,
    energyCostAfter: 870000,
    
    totalAnnualSavings: 600000,
    systemCost: 375000,
    paybackYears: 0.625,
    roi25Year: '2,850%',
    
    keyBenefit1: 'Eliminate dryer demand spikes',
    keyBenefit2: 'Shift wash cycles to off-peak',
    keyBenefit3: '7.5-month payback period',
  },
  {
    id: 'indoor-farm',
    industry: 'Indoor Farm (Vertical CEA)',
    icon: '🌱',
    description: '20,000-40,000 sq ft, 24/7 LED grow lights, climate control systems',
    facilitySize: '30,000 sq ft',
    
    peakPowerKW: 350,
    avgPowerKW: 275,
    dailyEnergyKWh: 6600,
    operatingHours: '24/7 operations',
    
    systemSizeMW: 0.4,
    systemSizeMWh: 1.6,
    duration: 4,
    
    demandChargeBefore: 780000,
    demandChargeAfter: 340000,
    energyCostBefore: 1850000,
    energyCostAfter: 1280000,
    
    totalAnnualSavings: 1010000,
    systemCost: 720000,
    paybackYears: 0.71,
    roi25Year: '3,420%',
    
    keyBenefit1: 'Demand charge reduction (44%)',
    keyBenefit2: '24/7 load shifting to off-peak',
    keyBenefit3: 'Crop protection during outages',
  },
  {
    id: 'hotel',
    industry: 'Hotel (300 Rooms)',
    icon: '🏨',
    description: 'Full-service hotel with restaurant, gym, conference center, laundry',
    facilitySize: '150,000 sq ft',
    
    peakPowerKW: 900,
    avgPowerKW: 450,
    dailyEnergyKWh: 10800,
    operatingHours: '24/7 with morning/evening peaks',
    
    systemSizeMW: 1.0,
    systemSizeMWh: 2.0,
    duration: 2,
    
    demandChargeBefore: 1200000,
    demandChargeAfter: 580000,
    energyCostBefore: 2650000,
    energyCostAfter: 1890000,
    
    totalAnnualSavings: 1380000,
    systemCost: 1050000,
    paybackYears: 0.76,
    roi25Year: '3,190%',
    
    keyBenefit1: 'Peak shaving during check-in/out',
    keyBenefit2: 'Laundry load optimization',
    keyBenefit3: 'Guest experience during outages',
  },
  {
    id: 'data-center',
    industry: 'Edge Data Center',
    icon: '💾',
    description: 'Colocation facility, 200-400 racks, 99.999% uptime requirement',
    facilitySize: '25,000 sq ft',
    
    peakPowerKW: 2500,
    avgPowerKW: 2000,
    dailyEnergyKWh: 48000,
    operatingHours: '24/7 critical operations',
    
    systemSizeMW: 2.5,
    systemSizeMWh: 5.0,
    duration: 2,
    
    demandChargeBefore: 3500000,
    demandChargeAfter: 1850000,
    energyCostBefore: 6800000,
    energyCostAfter: 5100000,
    
    totalAnnualSavings: 3350000,
    systemCost: 2625000,
    paybackYears: 0.78,
    roi25Year: '3,095%',
    
    keyBenefit1: 'Replace diesel backup with BESS',
    keyBenefit2: 'Grid services revenue stack',
    keyBenefit3: 'Demand charge optimization',
  },
  {
    id: 'ev-charging',
    industry: 'EV Charging Hub (100 Chargers)',
    icon: '⚡',
    description: 'Highway rest stop, 50 DC fast + 50 L2 chargers, high peak demand',
    facilitySize: '20 acres',
    
    peakPowerKW: 10000,
    avgPowerKW: 3500,
    dailyEnergyKWh: 84000,
    operatingHours: '24/7 with rush hour peaks',
    
    systemSizeMW: 10.0,
    systemSizeMWh: 20.0,
    duration: 2,
    
    demandChargeBefore: 8500000,
    demandChargeAfter: 3200000,
    energyCostBefore: 12500000,
    energyCostAfter: 8900000,
    
    totalAnnualSavings: 8900000,
    systemCost: 9500000,
    paybackYears: 1.07,
    roi25Year: '2,247%',
    
    keyBenefit1: 'Load balancing across chargers',
    keyBenefit2: 'Avoid utility upgrade costs',
    keyBenefit3: 'Grid services + EV charging',
  },
  {
    id: 'university',
    industry: 'University Campus',
    icon: '🎓',
    description: '5,000-10,000 students, research labs, dorms, athletic facilities',
    facilitySize: '2 million sq ft',
    
    peakPowerKW: 12000,
    avgPowerKW: 6500,
    dailyEnergyKWh: 156000,
    operatingHours: '24/7 with class-time peaks',
    
    systemSizeMW: 12.0,
    systemSizeMWh: 24.0,
    duration: 2,
    
    demandChargeBefore: 9800000,
    demandChargeAfter: 4200000,
    energyCostBefore: 18500000,
    energyCostAfter: 13200000,
    
    totalAnnualSavings: 10900000,
    systemCost: 11400000,
    paybackYears: 1.05,
    roi25Year: '2,290%',
    
    keyBenefit1: 'Research continuity protection',
    keyBenefit2: 'Sustainability goal achievement',
    keyBenefit3: 'Microgrid + solar integration',
  },
  {
    id: 'food-processing',
    industry: 'Food Processing Plant',
    icon: '🏭',
    description: 'Cold storage, production lines, 24/7 refrigeration, packaging equipment',
    facilitySize: '100,000 sq ft',
    
    peakPowerKW: 2800,
    avgPowerKW: 2200,
    dailyEnergyKWh: 52800,
    operatingHours: '24/7 with production shifts',
    
    systemSizeMW: 3.0,
    systemSizeMWh: 6.0,
    duration: 2,
    
    demandChargeBefore: 4200000,
    demandChargeAfter: 1950000,
    energyCostBefore: 7800000,
    energyCostAfter: 5650000,
    
    totalAnnualSavings: 4400000,
    systemCost: 3150000,
    paybackYears: 0.72,
    roi25Year: '3,381%',
    
    keyBenefit1: 'Cold storage protection',
    keyBenefit2: 'Production line continuity',
    keyBenefit3: 'Peak production cost reduction',
  },
  {
    id: 'apartments',
    industry: 'Apartment Complex (400 Units)',
    icon: '🏢',
    description: 'Multi-family residential, underground parking, EV charging, amenities',
    facilitySize: '350,000 sq ft',
    
    peakPowerKW: 650,
    avgPowerKW: 325,
    dailyEnergyKWh: 7800,
    operatingHours: '24/7 with evening peaks',
    
    systemSizeMW: 0.75,
    systemSizeMWh: 1.5,
    duration: 2,
    
    demandChargeBefore: 920000,
    demandChargeAfter: 420000,
    energyCostBefore: 1950000,
    energyCostAfter: 1380000,
    
    totalAnnualSavings: 1070000,
    systemCost: 787500,
    paybackYears: 0.74,
    roi25Year: '3,298%',
    
    keyBenefit1: 'Tenant EV charging enablement',
    keyBenefit2: 'Reduce common area costs',
    keyBenefit3: 'Resilience during outages',
  },
  {
    id: 'shopping-center',
    industry: 'Shopping Center',
    icon: '🛍️',
    description: '500,000 sq ft retail, 50+ tenants, restaurants, movie theater, parking',
    facilitySize: '500,000 sq ft',
    
    peakPowerKW: 3200,
    avgPowerKW: 1800,
    dailyEnergyKWh: 43200,
    operatingHours: '10am-9pm (11hrs) + 24/7 anchor stores',
    
    systemSizeMW: 3.5,
    systemSizeMWh: 7.0,
    duration: 2,
    
    demandChargeBefore: 4800000,
    demandChargeAfter: 2100000,
    energyCostBefore: 8500000,
    energyCostAfter: 6200000,
    
    totalAnnualSavings: 5000000,
    systemCost: 3675000,
    paybackYears: 0.74,
    roi25Year: '3,298%',
    
    keyBenefit1: 'Tenant bill passthrough savings',
    keyBenefit2: 'Retail hours aligned with TOU',
    keyBenefit3: 'HVAC load optimization',
  },
  {
    id: 'airport',
    industry: 'Airport Terminal',
    icon: '✈️',
    description: 'Regional airport, 5-10 gates, baggage handling, security, retail',
    facilitySize: '250,000 sq ft',
    
    peakPowerKW: 5000,
    avgPowerKW: 3200,
    dailyEnergyKWh: 76800,
    operatingHours: '24/7 with morning/evening peaks',
    
    systemSizeMW: 5.0,
    systemSizeMWh: 10.0,
    duration: 2,
    
    demandChargeBefore: 7200000,
    demandChargeAfter: 3100000,
    energyCostBefore: 11800000,
    energyCostAfter: 8500000,
    
    totalAnnualSavings: 7400000,
    systemCost: 5250000,
    paybackYears: 0.71,
    roi25Year: '3,420%',
    
    keyBenefit1: 'Mission-critical reliability',
    keyBenefit2: 'Gate electrification support',
    keyBenefit3: 'Peak flight schedule optimization',
  },
];

interface UseCaseROIProps {
  onLoadTemplate?: (useCase: UseCaseData) => void;
  autoRotate?: boolean;
  rotationInterval?: number;
}

const UseCaseROI: React.FC<UseCaseROIProps> = ({ 
  onLoadTemplate, 
  autoRotate = true, 
  rotationInterval = 10000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnnualSavings, setShowAnnualSavings] = useState(false);
  
  const currentUseCase = useCases[currentIndex];

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate || isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % useCases.length);
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [autoRotate, isPaused, rotationInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % useCases.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume after 5s
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + useCases.length) % useCases.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  const demandSavings = currentUseCase.demandChargeBefore - currentUseCase.demandChargeAfter;
  const energySavings = currentUseCase.energyCostBefore - currentUseCase.energyCostAfter;
  const demandSavingsPct = ((demandSavings / currentUseCase.demandChargeBefore) * 100).toFixed(0);
  const energySavingsPct = ((energySavings / currentUseCase.energyCostBefore) * 100).toFixed(0);

  return (
    <div className="bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-indigo-50/40 rounded-2xl p-6 shadow-xl border-2 border-purple-200">
      {/* Header - Refined */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{currentUseCase.icon}</span>
          <span className="text-2xl font-bold text-gray-900">{currentUseCase.industry}</span>
        </div>
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-300 hover:border-purple-400"
            title="Previous use case"
          >
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div className="px-4 py-2 bg-white rounded-lg shadow-md border border-gray-300">
            <span className="text-sm font-bold text-gray-700">
              {currentIndex + 1}/{useCases.length}
            </span>
          </div>
          <button
            onClick={handleNext}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-300 hover:border-purple-400"
            title="Next use case"
          >
            <ChevronRight size={20} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chart - Professional with refined colors */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          {/* Annual Savings Badge - Strategic green for financial positive */}
          <div className="flex justify-center mb-4">
            <span
              className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold px-8 py-2.5 rounded-full shadow-lg"
            >
              Annual Savings: ${ (currentUseCase.totalAnnualSavings / 1000).toLocaleString() }K
            </span>
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-6 text-center">
            Annual Savings — Before vs After BESS
          </h4>
          
          {/* Chart - Refined color palette */}
          <div className="relative" style={{ height: '300px' }}>
            <div className="absolute inset-0 flex items-end justify-around px-4">
              {(() => {
                const maxValue = Math.max(
                  currentUseCase.demandChargeBefore,
                  currentUseCase.demandChargeAfter,
                  currentUseCase.energyCostBefore,
                  currentUseCase.energyCostAfter
                );
                const chartHeightPx = 260;
                const minBarPx = 20;
                const getBarHeight = (value: number) => {
                  if (maxValue === 0) return minBarPx;
                  const proportional = (value / maxValue) * chartHeightPx;
                  return Math.max(proportional, minBarPx);
                };
                return (
                  <>
                    {/* Demand Charges Group */}
                    <div className="flex flex-col items-center gap-3 w-40">
                      <div className="flex gap-4 items-end" style={{ height: chartHeightPx + 'px' }}>
                        {/* Before Bar - Blue */}
                        <div className="flex flex-col items-center w-20">
                          <div className="text-base font-bold text-gray-900 mb-2">
                            ${(currentUseCase.demandChargeBefore / 1000).toFixed(0)}K
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-xl shadow-lg border border-blue-700"
                            style={{ height: getBarHeight(currentUseCase.demandChargeBefore) + 'px' }}
                          ></div>
                        </div>
                        {/* After Bar - Teal (single accent color) */}
                        <div className="flex flex-col items-center w-20">
                          <div className="text-base font-bold text-gray-900 mb-2">
                            ${(currentUseCase.demandChargeAfter / 1000).toFixed(0)}K
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-teal-500 via-teal-400 to-cyan-300 rounded-t-xl shadow-lg border border-teal-600"
                            style={{ height: getBarHeight(currentUseCase.demandChargeAfter) + 'px' }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-2">Demand Charges</div>
                    </div>
                    {/* Energy (TOU) Group */}
                    <div className="flex flex-col items-center gap-3 w-40">
                      <div className="flex gap-4 items-end" style={{ height: chartHeightPx + 'px' }}>
                        {/* Before Bar - Blue */}
                        <div className="flex flex-col items-center w-20">
                          <div className="text-base font-bold text-gray-900 mb-2">
                            ${(currentUseCase.energyCostBefore / 1000).toFixed(0)}K
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-xl shadow-lg border border-blue-700"
                            style={{ height: getBarHeight(currentUseCase.energyCostBefore) + 'px' }}
                          ></div>
                        </div>
                        {/* After Bar - Teal */}
                        <div className="flex flex-col items-center w-20">
                          <div className="text-base font-bold text-gray-900 mb-2">
                            ${(currentUseCase.energyCostAfter / 1000).toFixed(0)}K
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-teal-500 via-teal-400 to-cyan-300 rounded-t-xl shadow-lg border border-teal-600"
                            style={{ height: getBarHeight(currentUseCase.energyCostAfter) + 'px' }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mt-2">Energy (TOU)</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-blue-400 rounded border border-blue-700 shadow-sm"></div>
              <span className="text-sm font-semibold text-gray-800">Before BESS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-br from-teal-500 to-cyan-300 rounded border border-teal-600 shadow-sm"></div>
              <span className="text-sm font-semibold text-gray-800">After BESS</span>
            </div>
          </div>
        </div>

        {/* Right: Metrics & Benefits - Refined palette */}
        <div className="space-y-4">
          {/* ROI Metrics - Refined colors */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-300 shadow-sm">
                <div className="text-3xl font-bold text-green-700">
                  ${(currentUseCase.totalAnnualSavings / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">Annual Savings</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-300 shadow-sm">
                <div className="text-3xl font-bold text-blue-700">
                  {currentUseCase.paybackYears < 1 
                    ? `${(currentUseCase.paybackYears * 12).toFixed(0)} mo`
                    : `${currentUseCase.paybackYears.toFixed(1)} yr`
                  }
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">Payback Period</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-300 shadow-sm">
                <div className="text-3xl font-bold text-purple-700">
                  {currentUseCase.roi25Year}
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">25-Year ROI</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-300 shadow-sm">
                <div className="text-3xl font-bold text-indigo-700">
                  {currentUseCase.systemSizeMW < 1 
                    ? `${(currentUseCase.systemSizeMW * 1000).toFixed(0)} kW`
                    : `${currentUseCase.systemSizeMW.toFixed(1)} MW`
                  }
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">System Size</div>
              </div>
            </div>
          </div>

          {/* Savings Breakdown - Strategic green for savings */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>💰</span>
              <span>Savings Breakdown</span>
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg border border-green-200/60">
                <span className="text-sm text-gray-700 font-medium">Demand Charges</span>
                <span className="text-sm font-bold text-green-600">
                  -${(demandSavings / 1000).toFixed(0)}K ({demandSavingsPct}%)
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50/50 rounded-lg border border-green-200/60">
                <span className="text-sm text-gray-700 font-medium">Energy (TOU)</span>
                <span className="text-sm font-bold text-green-600">
                  -${(energySavings / 1000).toFixed(0)}K ({energySavingsPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Key Benefits - Strategic green for positives */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>✨</span>
              <span>Key Benefits</span>
            </h5>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 bg-green-50/50 rounded-lg border border-green-200/60">
                <span className="text-green-600 font-bold text-base">✓</span>
                <span className="text-sm text-gray-700">{currentUseCase.keyBenefit1}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-green-50/50 rounded-lg border border-green-200/60">
                <span className="text-green-600 font-bold text-base">✓</span>
                <span className="text-sm text-gray-700">{currentUseCase.keyBenefit2}</span>
              </div>
              <div className="flex items-start gap-2 p-2 bg-green-50/50 rounded-lg border border-green-200/60">
                <span className="text-green-600 font-bold text-base">✓</span>
                <span className="text-sm text-gray-700">{currentUseCase.keyBenefit3}</span>
              </div>
            </div>
          </div>

          {/* CTA Button - Refined purple/blue gradient */}
          {onLoadTemplate && (
            <button
              onClick={() => onLoadTemplate(currentUseCase)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <span className="text-2xl">🚀</span>
              <div className="text-left">
                <div className="text-base">Build This Quote</div>
                <div className="text-xs opacity-90">Pre-filled data</div>
              </div>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Auto-rotation indicator - Purple/blue theme */}
      {autoRotate && (
        <div className="mt-4 flex justify-center items-center gap-3">
          <div className="flex gap-2">
            {useCases.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-8 bg-gradient-to-r from-purple-500 to-blue-500 shadow-md' 
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 ml-2">
            {isPaused ? '⏸ Paused' : '▶ Auto-play'}
          </span>
        </div>

      )}
    </div>
  );
}
export default UseCaseROI;
export { useCases };
export type { UseCaseData };
