/**
 * Real World Applications Modal
 * Shows detailed case studies for Hotel, Data Center, and EV Charging
 * Reuses data from UseCaseROI carousel
 */

import React from 'react';
import { X, TrendingUp, Zap, DollarSign, Clock, ArrowRight, Building2, Database, Car, Factory, Store, Thermometer } from 'lucide-react';

export type ApplicationType = 'hotel' | 'data-center' | 'ev-charging' | 'car-wash' | 'office' | 'manufacturing' | 'retail' | 'cold-storage';

interface RealWorldApplicationModalProps {
  show: boolean;
  onClose: () => void;
  application: ApplicationType;
  onStartWizard?: () => void;
}

const applicationData: Record<ApplicationType, {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  image: string;
  facilitySize: string;
  peakPowerKW: number;
  avgPowerKW: number;
  dailyEnergyKWh: number;
  operatingHours: string;
  systemSizeMW: number;
  systemSizeMWh: number;
  duration: number;
  demandChargeBefore: number;
  demandChargeAfter: number;
  energyCostBefore: number;
  energyCostAfter: number;
  totalAnnualSavings: number;
  systemCost: number;
  paybackYears: number;
  roi25Year: string;
  benefits: string[];
  challenges: string[];
}> = {
  'office': {
    title: 'Corporate Office Building',
    subtitle: '75,000 sq ft Class A office with 500 employees',
    icon: <Building2 className="w-12 h-12" style={{ color: '#60a5fa' }} />,
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070',
    facilitySize: '75,000 sq ft',
    peakPowerKW: 350,
    avgPowerKW: 180,
    dailyEnergyKWh: 4320,
    operatingHours: 'M-F 7am-7pm, reduced weekends',
    systemSizeMW: 0.4,
    systemSizeMWh: 0.8,
    duration: 2,
    demandChargeBefore: 420000,
    demandChargeAfter: 210000,
    energyCostBefore: 890000,
    energyCostAfter: 633000,
    totalAnnualSavings: 467000,
    systemCost: 420000,
    paybackYears: 0.9,
    roi25Year: '2,680%',
    benefits: [
      'Peak shaving during business hours',
      'HVAC optimization with TOU arbitrage',
      'Backup power for critical systems',
      'Green building certification credits'
    ],
    challenges: [
      'Morning startup surge (7-9am)',
      'Afternoon HVAC peak (2-4pm)',
      'High demand charges in commercial rates',
      'Elevator and lighting loads'
    ]
  },
  'manufacturing': {
    title: 'Manufacturing Facility',
    subtitle: 'Medium-scale production plant with heavy machinery',
    icon: <Factory className="w-12 h-12" style={{ color: '#60a5fa' }} />,
    image: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?q=80&w=2070',
    facilitySize: '200,000 sq ft',
    peakPowerKW: 2800,
    avgPowerKW: 1800,
    dailyEnergyKWh: 43200,
    operatingHours: '24/7 production shifts',
    systemSizeMW: 2.5,
    systemSizeMWh: 5.0,
    duration: 2,
    demandChargeBefore: 3200000,
    demandChargeAfter: 1520000,
    energyCostBefore: 5800000,
    energyCostAfter: 4288000,
    totalAnnualSavings: 3192000,
    systemCost: 2625000,
    paybackYears: 0.82,
    roi25Year: '2,940%',
    benefits: [
      'Smooth production line startups',
      'Eliminate penalty demand charges',
      'Power quality for sensitive equipment',
      'Uninterrupted production during outages'
    ],
    challenges: [
      'Heavy motor startup surges',
      'Shift change power spikes',
      'Welding and CNC machine loads',
      'Compressed air system demand'
    ]
  },
  'retail': {
    title: 'Large Retail Store',
    subtitle: 'Big box retailer with refrigeration and high foot traffic',
    icon: <Store className="w-12 h-12" style={{ color: '#3ECF8E' }} />,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
    facilitySize: '120,000 sq ft',
    peakPowerKW: 450,
    avgPowerKW: 280,
    dailyEnergyKWh: 6720,
    operatingHours: '8am-10pm daily',
    systemSizeMW: 0.5,
    systemSizeMWh: 1.0,
    duration: 2,
    demandChargeBefore: 540000,
    demandChargeAfter: 281000,
    energyCostBefore: 1150000,
    energyCostAfter: 869000,
    totalAnnualSavings: 540000,
    systemCost: 525000,
    paybackYears: 0.97,
    roi25Year: '2,470%',
    benefits: [
      'Refrigeration load optimization',
      'Peak shaving during shopping hours',
      'Backup power for POS systems',
      'Reduced demand charges'
    ],
    challenges: [
      'Refrigeration defrost cycles',
      'Holiday and weekend peak loads',
      'HVAC for large open spaces',
      'Lighting and display power'
    ]
  },
  'cold-storage': {
    title: 'Cold Storage Warehouse',
    subtitle: 'Temperature-controlled distribution center',
    icon: <Thermometer className="w-12 h-12" style={{ color: '#60a5fa' }} />,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070',
    facilitySize: '80,000 sq ft',
    peakPowerKW: 1200,
    avgPowerKW: 850,
    dailyEnergyKWh: 20400,
    operatingHours: '24/7 critical cooling',
    systemSizeMW: 1.2,
    systemSizeMWh: 2.4,
    duration: 2,
    demandChargeBefore: 1440000,
    demandChargeAfter: 691000,
    energyCostBefore: 2750000,
    energyCostAfter: 1993000,
    totalAnnualSavings: 1506000,
    systemCost: 1260000,
    paybackYears: 0.84,
    roi25Year: '2,890%',
    benefits: [
      'Compressor load smoothing',
      'Defrost cycle optimization',
      'Critical backup for inventory',
      'Massive demand charge reduction'
    ],
    challenges: [
      'Continuous refrigeration load',
      'Defrost cycle power spikes',
      'Door opening heat infiltration',
      'Compressor cycling patterns'
    ]
  },
  'car-wash': {
    title: 'Multi-Bay Car Wash',
    subtitle: '6-tunnel express wash with vacuum stations and detail bays',
    icon: <Car className="w-12 h-12 text-[#3ECF8E]" />,
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?q=80&w=2070',
    facilitySize: '8,000 sq ft (6 tunnels + 12 vacuum stations)',
    
    // Load Profile
    peakPowerKW: 500,
    avgPowerKW: 280,
    dailyEnergyKWh: 6720,
    operatingHours: '7am-9pm daily, peak 11am-3pm',
    
    // BESS Solution
    systemSizeMW: 0.5,
    systemSizeMWh: 2.0,
    duration: 4,
    
    // Financial Data
    demandChargeBefore: 180000,
    demandChargeAfter: 72000,
    energyCostBefore: 285000,
    energyCostAfter: 158000,
    
    // ROI Metrics
    totalAnnualSavings: 235000,
    systemCost: 210000,
    paybackYears: 0.89,
    roi25Year: '2,700%',
    
    // Key Benefits
    benefits: [
      'Peak shaving during midday wash rushes',
      'Blower and dryer motor load smoothing',
      'Backup power keeps tunnels running during outages',
      'EV vacuum station power without grid upgrades'
    ],
    
    // Real-world context
    challenges: [
      'Tunnel conveyor motor startup surges',
      'High-pressure pump cycling (200+ HP)',
      'Blower/dryer banks pulling 150+ kW',
      'Weekend demand spikes 2-3x weekday'
    ]
  },

  'hotel': {
    title: 'Luxury Hotel - 300 Rooms',
    subtitle: 'Full-service property with restaurant, gym, conference center',
    icon: <Building2 className="w-12 h-12" style={{ color: '#3ECF8E' }} />,
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
    icon: <Database className="w-12 h-12" style={{ color: '#60a5fa' }} />,
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
    icon: <Car className="w-12 h-12" style={{ color: '#3ECF8E' }} />,
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
      <div className="rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Header with Hero Image */}
        <div className="relative h-64 overflow-hidden rounded-t-2xl">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-black/50 to-transparent"></div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-2">
              {data.icon}
              <div>
                <h2 className="text-4xl font-bold text-white drop-shadow-lg">{data.title}</h2>
                <p className="text-xl text-white/70 drop-shadow">{data.subtitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)' }}>
              <div className="flex items-center gap-2 text-[#3ECF8E] mb-2">
                <DollarSign className="w-5 h-5" />
                <p className="font-semibold text-sm">Annual Savings</p>
              </div>
              <p className="text-3xl font-bold text-[#3ECF8E]">
                ${(data.totalAnnualSavings / 1000).toFixed(0)}K
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Zap className="w-5 h-5" />
                <p className="font-semibold text-sm">System Size</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {data.systemSizeMW} MW
              </p>
              <p className="text-sm text-blue-400/70">{data.systemSizeMWh} MWh</p>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <Clock className="w-5 h-5" />
                <p className="font-semibold text-sm">Payback</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {(data.paybackYears * 12).toFixed(0)} mo
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.2)' }}>
              <div className="flex items-center gap-2 text-[#3ECF8E] mb-2">
                <TrendingUp className="w-5 h-5" />
                <p className="font-semibold text-sm">25-Year ROI</p>
              </div>
              <p className="text-3xl font-bold text-[#3ECF8E]">
                {data.roi25Year}
              </p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Challenges */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                ⚠️ Business Challenges
              </h3>
              <div className="rounded-xl p-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <ul className="space-y-3">
                  {data.challenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-red-400 font-bold mt-0.5">✗</span>
                      <span className="text-slate-300">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Load Profile */}
              <div className="mt-6 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 className="font-bold text-white mb-3">Load Profile</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Peak Power:</span>
                    <span className="font-semibold text-white">{data.peakPowerKW} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Average Power:</span>
                    <span className="font-semibold text-white">{data.avgPowerKW} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daily Energy:</span>
                    <span className="font-semibold text-white">{data.dailyEnergyKWh.toLocaleString()} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operating Hours:</span>
                    <span className="font-semibold text-white">{data.operatingHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - BESS Solution */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                ✅ BESS Solution Benefits
              </h3>
              <div className="rounded-xl p-6" style={{ background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.15)' }}>
                <ul className="space-y-3">
                  {data.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-[#3ECF8E] font-bold mt-0.5">✓</span>
                      <span className="text-slate-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financial Impact */}
              <div className="mt-6 rounded-xl p-6" style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)' }}>
                <h4 className="font-bold text-white mb-3">Financial Impact</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Demand Charges:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-red-400">${(data.demandChargeBefore / 1000).toFixed(0)}K</span>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                      <span className="font-bold text-[#3ECF8E]">${(data.demandChargeAfter / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-slate-500">
                        ({(((data.demandChargeBefore - data.demandChargeAfter) / data.demandChargeBefore) * 100).toFixed(0)}% ↓)
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Energy Costs:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="line-through text-red-400">${(data.energyCostBefore / 1000).toFixed(0)}K</span>
                      <ArrowRight className="w-4 h-4 text-slate-600" />
                      <span className="font-bold text-[#3ECF8E]">${(data.energyCostAfter / 1000).toFixed(0)}K</span>
                      <span className="text-xs text-slate-500">
                        ({(((data.energyCostBefore - data.energyCostAfter) / data.energyCostBefore) * 100).toFixed(0)}% ↓)
                      </span>
                    </div>
                  </div>

                  <div className="pt-3" style={{ borderTop: '1px solid rgba(96,165,250,0.15)' }}>
                    <div className="flex justify-between">
                      <span className="font-semibold text-white">Total Annual Savings:</span>
                      <span className="font-bold text-[#3ECF8E] text-lg">${(data.totalAnnualSavings / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(62,207,142,0.06)', border: '1px solid rgba(62,207,142,0.15)' }}>
            <h3 className="text-2xl font-bold text-white mb-3">
              ✨ Get Your Custom Quote
            </h3>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Merlin can calculate a personalized BESS solution for your facility in under 3 minutes
            </p>
            <button
              onClick={() => {
                onClose();
                onStartWizard?.();
              }}
              className="px-10 py-3.5 rounded-lg text-base font-bold transition-all duration-200"
              style={{ background: 'transparent', border: '1px solid rgba(62,207,142,0.35)', color: '#3ECF8E' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Build My Quote →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealWorldApplicationModal;
