import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, DollarSign, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

// Import use case images with explicit extensions for Vite
import carWashImage from '../assets/images/car_wash_1.jpg?url';
import hospitalImage from '../assets/images/hospital_1.jpg?url';
import evChargingStationImage from '../assets/images/ev_charging_station.png?url';
import evChargingHotelImage from '../assets/images/ev_charging_hotel.webp?url';
import hotelImage from '../assets/images/hotel_1.avif?url';
import airportImage from '../assets/images/airports_1.jpg?url';

interface UseCaseData {
  id: string;
  industry: string;
  icon: string;
  image?: string; // Added image support
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
    image: carWashImage,
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
    image: evChargingHotelImage,
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
    image: evChargingStationImage,
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
    image: hospitalImage,
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
    image: airportImage,
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
  // Optional modal management props (for power adjustment flow)
  setShowPowerAdjustmentModal?: (show: boolean) => void;
  setSelectedUseCaseForAdjustment?: (useCase: UseCaseData) => void;
}

const UseCaseROI: React.FC<UseCaseROIProps> = ({ 
  onLoadTemplate, 
  autoRotate = true, 
  rotationInterval = 10000,
  setShowPowerAdjustmentModal,
  setSelectedUseCaseForAdjustment
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
      {/* Header - Enhanced with Image */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* Use Case Image (if available) */}
          {currentUseCase.image && (
            <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white">
              <img 
                src={currentUseCase.image} 
                alt={currentUseCase.industry}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {/* Icon and Title */}
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentUseCase.icon}</span>
            <span className="text-2xl font-bold text-gray-900">{currentUseCase.industry}</span>
          </div>
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
        {/* Left: Financial Metrics - Clean display with key numbers */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          {/* Main Annual Savings Display */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-lg mb-4">
              <div className="text-4xl font-bold">
                ${ (currentUseCase.totalAnnualSavings / 1000).toLocaleString() }K
              </div>
              <div className="text-lg font-medium opacity-90">Annual Savings</div>
            </div>
          </div>

          {/* Cost Breakdown Cards */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-900 text-center mb-4">
              Annual Cost Breakdown
            </h4>
            
            {/* Before BESS Total */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-red-700 mb-1">Before BESS</div>
                  <div className="text-xs text-red-600">Total Annual Energy Costs</div>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  ${((currentUseCase.demandChargeBefore + currentUseCase.energyCostBefore) / 1000).toFixed(0)}K
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-red-100 rounded px-3 py-2">
                  <div className="text-red-600">Demand Charges</div>
                  <div className="font-bold text-red-800">${(currentUseCase.demandChargeBefore / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-red-100 rounded px-3 py-2">
                  <div className="text-red-600">Energy (TOU)</div>
                  <div className="font-bold text-red-800">${(currentUseCase.energyCostBefore / 1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>

            {/* After BESS Total */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-green-700 mb-1">After BESS</div>
                  <div className="text-xs text-green-600">Reduced Annual Energy Costs</div>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  ${((currentUseCase.demandChargeAfter + currentUseCase.energyCostAfter) / 1000).toFixed(0)}K
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-green-100 rounded px-3 py-2">
                  <div className="text-green-600">Demand Charges</div>
                  <div className="font-bold text-green-800">${(currentUseCase.demandChargeAfter / 1000).toFixed(0)}K</div>
                </div>
                <div className="bg-green-100 rounded px-3 py-2">
                  <div className="text-green-600">Energy (TOU)</div>
                  <div className="font-bold text-green-800">${(currentUseCase.energyCostAfter / 1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>

            {/* Savings Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-700 mb-2">Net Annual Savings</div>
                <div className="text-3xl font-bold text-blue-800">
                  ${(currentUseCase.totalAnnualSavings / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {((currentUseCase.totalAnnualSavings / (currentUseCase.demandChargeBefore + currentUseCase.energyCostBefore)) * 100).toFixed(0)}% reduction in energy costs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Enhanced ROI Metrics */}
        <div className="space-y-4">
          {/* Primary ROI Metrics - Enhanced for prominence */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">Key Financial Metrics</h4>
            
            {/* Primary Metrics - Larger display */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* ROI - Most prominent */}
              <div className="text-center p-6 bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-2xl shadow-lg">
                <div className="text-5xl font-bold mb-2">
                  {currentUseCase.roi25Year}
                </div>
                <div className="text-lg font-semibold">25-Year ROI</div>
              </div>
              
              {/* Payback Period - Secondary prominence */}
              <div className="text-center p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg">
                <div className="text-4xl font-bold mb-2">
                  {currentUseCase.paybackYears < 1 
                    ? `${(currentUseCase.paybackYears * 12).toFixed(0)} mo`
                    : `${currentUseCase.paybackYears.toFixed(1)} yr`
                  }
                </div>
                <div className="text-base font-semibold">Payback Period</div>
              </div>
            </div>
            
            {/* Supporting Metrics - Grid layout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-300 shadow-sm">
                <div className="text-2xl font-bold text-green-700">
                  ${(currentUseCase.totalAnnualSavings / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">Annual Savings</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-300 shadow-sm">
                <div className="text-2xl font-bold text-indigo-700">
                  {currentUseCase.systemSizeMW < 1 
                    ? `${(currentUseCase.systemSizeMW * 1000).toFixed(0)} kW`
                    : `${currentUseCase.systemSizeMW.toFixed(1)} MW`
                  }
                </div>
                <div className="text-xs text-gray-700 font-semibold mt-1">System Size</div>
              </div>
            </div>
          </div>

          {/* Equipment Details - Show specific equipment for applicable industries */}
          {currentUseCase.industry === 'EV Charging' && (
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
              <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⚡</span>
                <span>EV Charging Infrastructure</span>
              </h5>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between items-center p-2 bg-blue-50/50 rounded-lg border border-blue-200/60">
                  <span className="text-sm text-gray-700 font-medium">DC Fast Chargers</span>
                  <span className="text-sm font-bold text-blue-600">
                    4× 150kW (600kW total)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50/50 rounded-lg border border-blue-200/60">
                  <span className="text-sm text-gray-700 font-medium">Level 2 Chargers</span>
                  <span className="text-sm font-bold text-blue-600">
                    8× 7kW (56kW total)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50/50 rounded-lg border border-blue-200/60">
                  <span className="text-sm text-gray-700 font-medium">Site Infrastructure</span>
                  <span className="text-sm font-bold text-blue-600">
                    25kW (Lighting, Payment Systems)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50/50 rounded-lg border border-purple-200/60">
                  <span className="text-sm text-gray-700 font-medium">Total Peak Load</span>
                  <span className="text-sm font-bold text-purple-600">
                    681kW
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Savings Breakdown - Strategic green for savings */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>🎯</span>
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
              onClick={() => {
                if (import.meta.env.DEV) { console.log('🎯🎯🎯 UseCaseROI Build This Quote clicked!'); }
                if (import.meta.env.DEV) { console.log('🎯 setShowPowerAdjustmentModal available:', !!setShowPowerAdjustmentModal); }
                if (import.meta.env.DEV) { console.log('🎯 setSelectedUseCaseForAdjustment available:', !!setSelectedUseCaseForAdjustment); }
                if (import.meta.env.DEV) { console.log('🎯 onLoadTemplate available:', !!onLoadTemplate); }
                
                // If power adjustment modal is available, use that flow
                if (setShowPowerAdjustmentModal && setSelectedUseCaseForAdjustment) {
                  if (import.meta.env.DEV) { console.log('🔄 Taking power adjustment modal path'); }
                  setSelectedUseCaseForAdjustment(currentUseCase);
                  setShowPowerAdjustmentModal(true);
                } else {
                  if (import.meta.env.DEV) { console.log('🚀 Taking onLoadTemplate path'); }
                  // Fallback to direct template loading
                  onLoadTemplate(currentUseCase);
                }
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <span className="text-2xl">🚀</span>
              <div className="text-left">
                <div className="text-base">Build This Quote</div>
                <div className="text-xs opacity-90">
                  {setShowPowerAdjustmentModal ? 'Customize & build' : 'Pre-filled data'}
                </div>
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
