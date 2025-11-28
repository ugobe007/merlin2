/**
 * Real World Applications Modal
 * Shows detailed case studies for Hotel, Data Center, and EV Charging
 * Reuses data from UseCaseROI carousel
 */

import React from 'react';
import { X, TrendingUp, Zap, DollarSign, Clock, ArrowRight, Building2, Database, Car } from 'lucide-react';

interface RealWorldApplicationModalProps {
  show: boolean;
  onClose: () => void;
  application: 'hotel' | 'data-center' | 'ev-charging';
  onStartWizard?: () => void;
}

const applicationData = {
  'hotel': {
    title: 'Luxury Hotel - 300 Rooms',
    subtitle: 'Full-service property with restaurant, gym, conference center',
    icon: <Building2 className="w-12 h-12 text-purple-600" />,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070',
    facilitySize: '150,000 sq ft',
    
    // Load Profile
    peakPowerKW: 900,
    avgPowerKW: 450,
    dailyEnergyKWh: 10800,
    operatingHours: '24/7 with morning/evening peaks',
    
    // BESS Solution
    systemSizeMW: 1.0,
    systemSizeMWh: 2.0,
    duration: 2,
    
    // Financial Data
    demandChargeBefore: 1200000,
    demandChargeAfter: 580000,
    energyCostBefore: 2650000,
    energyCostAfter: 1890000,
    
    // ROI Metrics
    totalAnnualSavings: 1380000,
    systemCost: 1050000,
    paybackYears: 0.76,
    roi25Year: '3,190%',
    
    // Key Benefits
    benefits: [
      'Peak shaving during check-in/out rushes',
      'Laundry & HVAC load optimization',
      'Guest experience during power outages',
      'EV charging for guests without grid upgrades'
    ],
    
    // Real-world context
    challenges: [
      'Morning check-out surge (7-10am)',
      'Evening check-in peak (4-7pm)',
      'Laundry room demand spikes',
      'High utility demand charges'
    ]
  },
  
  'data-center': {
    title: 'Cloud Data Center',
    subtitle: 'Edge colocation facility with 99.999% uptime requirement',
    icon: <Database className="w-12 h-12 text-blue-600" />,
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832',
    facilitySize: '25,000 sq ft (200-400 racks)',
    
    // Load Profile
    peakPowerKW: 2500,
    avgPowerKW: 2000,
    dailyEnergyKWh: 48000,
    operatingHours: '24/7 critical operations',
    
    // BESS Solution
    systemSizeMW: 2.5,
    systemSizeMWh: 5.0,
    duration: 2,
    
    // Financial Data
    demandChargeBefore: 3500000,
    demandChargeAfter: 1850000,
    energyCostBefore: 6800000,
    energyCostAfter: 5100000,
    
    // ROI Metrics
    totalAnnualSavings: 3350000,
    systemCost: 2625000,
    paybackYears: 0.78,
    roi25Year: '3,095%',
    
    // Key Benefits
    benefits: [
      'Replace expensive diesel backup generators',
      'Grid services revenue stacking',
      'Demand charge optimization',
      'Sustainability goals (eliminate diesel)'
    ],
    
    // Real-world context
    challenges: [
      'Constant 24/7 power consumption',
      'Expensive demand charges',
      'Diesel backup maintenance costs',
      'Environmental compliance pressure'
    ]
  },
  
  'ev-charging': {
    title: 'Fast Charging Hub',
    subtitle: 'Highway rest stop with 100 charging stations',
    icon: <Car className="w-12 h-12 text-green-600" />,
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=2072',
    facilitySize: '20 acres (50 DC fast + 50 L2 chargers)',
    
    // Load Profile
    peakPowerKW: 10000,
    avgPowerKW: 3500,
    dailyEnergyKWh: 84000,
    operatingHours: '24/7 with daytime peaks',
    
    // BESS Solution
    systemSizeMW: 5.0,
    systemSizeMWh: 10.0,
    duration: 2,
    
    // Financial Data
    demandChargeBefore: 8500000,
    demandChargeAfter: 3200000,
    energyCostBefore: 11200000,
    energyCostAfter: 7800000,
    
    // ROI Metrics
    totalAnnualSavings: 8700000,
    systemCost: 4500000,
    paybackYears: 0.52,
    roi25Year: '4,750%',
    
    // Key Benefits
    benefits: [
      'Eliminate expensive grid upgrades',
      'Charge from solar during peak hours',
      'Demand charge reduction',
      'Faster charging without waiting for grid'
    ],
    
    // Real-world context
    challenges: [
      'Extreme peak demand (10 MW)',
      'Grid connection costs: $3-5M',
      'Limited grid capacity in rural areas',
      'Customer wait times during peaks'
    ]
  }
};

const RealWorldApplicationModal: React.FC<RealWorldApplicationModalProps> = ({
  show,
  onClose,
  application,
  onStartWizard
}) => {
  if (!show) return null;

  const data = applicationData[application];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with Hero Image */}
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-2">
              {data.icon}
              <div>
                <h2 className="text-4xl font-bold text-white drop-shadow-lg">{data.title}</h2>
                <p className="text-xl text-white/90 drop-shadow">{data.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <DollarSign className="w-5 h-5" />
                <p className="font-semibold text-sm">Annual Savings</p>
              </div>
              <p className="text-3xl font-bold text-green-800">
                ${(data.totalAnnualSavings / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Zap className="w-5 h-5" />
                <p className="font-semibold text-sm">System Size</p>
              </div>
              <p className="text-3xl font-bold text-blue-800">
                {data.systemSizeMW} MW
              </p>
              <p className="text-sm text-blue-600">{data.systemSizeMWh} MWh</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Clock className="w-5 h-5" />
                <p className="font-semibold text-sm">Payback</p>
              </div>
              <p className="text-3xl font-bold text-purple-800">
                {(data.paybackYears * 12).toFixed(0)} mo
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-300 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <TrendingUp className="w-5 h-5" />
                <p className="font-semibold text-sm">25-Year ROI</p>
              </div>
              <p className="text-3xl font-bold text-orange-800">
                {data.roi25Year}
              </p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Challenges */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                ⚠️ Business Challenges
              </h3>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <ul className="space-y-3">
                  {data.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-red-500 font-bold mt-0.5">✗</span>
                      <span className="text-gray-800">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Load Profile */}
              <div className="mt-6 bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-3">Load Profile</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Power:</span>
                    <span className="font-semibold text-gray-900">{data.peakPowerKW} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Power:</span>
                    <span className="font-semibold text-gray-900">{data.avgPowerKW} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Daily Energy:</span>
                    <span className="font-semibold text-gray-900">{data.dailyEnergyKWh.toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating Hours:</span>
                    <span className="font-semibold text-gray-900">{data.operatingHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - BESS Solution */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                ✅ BESS Solution Benefits
              </h3>
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <ul className="space-y-3">
                  {data.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      <span className="text-gray-800">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Impact */}
              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-3">Financial Impact</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Demand Charges:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-red-600">${(data.demandChargeBefore / 1000).toFixed(0)}K</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-green-600">${(data.demandChargeAfter / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-gray-500">
                        ({(((data.demandChargeBefore - data.demandChargeAfter) / data.demandChargeBefore) * 100).toFixed(0)}% ↓)
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Energy Costs:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-red-600">${(data.energyCostBefore / 1000).toFixed(0)}K</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-green-600">${(data.energyCostAfter / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-gray-500">
                        ({(((data.energyCostBefore - data.energyCostAfter) / data.energyCostBefore) * 100).toFixed(0)}% ↓)
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-300">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total Annual Savings:</span>
                      <span className="font-bold text-green-600 text-lg">${(data.totalAnnualSavings / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              🧙‍♂️ Get Your Custom Quote
            </h3>
            <p className="text-gray-700 mb-6">
              Merlin can calculate a personalized BESS solution for your facility in just 3 minutes
            </p>
            <button
              onClick={() => {
                onClose();
                onStartWizard?.();
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-900 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-purple-700 hover:to-purple-950 transition-all transform hover:scale-105 shadow-lg"
            >
              Start SmartWizard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealWorldApplicationModal;
