/**
 * USE CASE MODAL COMPONENT
 * ========================
 * 
 * December 2025 - Requirement A
 * 
 * Modal popup for use case cards that displays:
 * - Industry description and benefits
 * - Example savings scenario
 * - "Build My Quote" CTA
 * 
 * This replaces direct navigation from use case cards.
 * User flow: Card click → Modal → "Build My Quote" → Wizard
 */

import React from 'react';
import { 
  X, CheckCircle, ArrowRight, Building2, Car, Droplets, 
  Hotel, Factory, ShoppingBag, Zap, Battery, Sun, 
  Warehouse, Server, Plane, GraduationCap, Heart,
  TreePine, Fuel, Utensils
} from 'lucide-react';

// ============================================
// USE CASE CONTENT DATA STRUCTURE
// ============================================

export interface UseCaseContent {
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  benefits: string[];
  example: {
    name: string;
    savings: number;
    payback: number;
    systemSize: string;
  };
  color: {
    gradient: string;
    border: string;
    badge: string;
  };
}

export const USE_CASE_CONTENT: Record<string, UseCaseContent> = {
  hotel: {
    title: "Hotel & Hospitality",
    icon: Hotel,
    description: "Hotels face unique energy challenges: 24/7 operations, fluctuating occupancy, and guest comfort requirements. BESS helps reduce demand charges, ensure backup power, and support sustainability goals that increasingly attract eco-conscious travelers.",
    benefits: [
      "Eliminate demand charge spikes from HVAC and kitchen equipment",
      "Never lose a guest to a power outage - seamless backup power",
      "Support EV charging without costly infrastructure upgrades",
      "Meet brand sustainability requirements and ESG goals",
      "Qualify for 30% federal ITC tax credit",
    ],
    example: {
      name: "150-Room Midscale Hotel in Nevada",
      savings: 47000,
      payback: 4.2,
      systemSize: "315 kW / 1,260 kWh",
    },
    color: {
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      border: "border-indigo-400/50",
      badge: "bg-indigo-500",
    },
  },
  'car-wash': {
    title: "Car Wash",
    icon: Droplets,
    description: "Car washes have highly variable loads with major demand spikes during peak hours from high-pressure pumps, blowers, and water heating. Battery storage smooths these spikes and can reduce energy bills by 30-40%.",
    benefits: [
      "Shave peak demand from high-pressure pumps and dryers",
      "Backup power keeps you washing during outages - no lost revenue",
      "Solar + storage for near-zero energy costs",
      "Fast payback (typically 2-4 years) with high utilization",
      "Reduce noise complaints with battery-powered equipment",
    ],
    example: {
      name: "6-Bay Tunnel Wash in California",
      savings: 28000,
      payback: 3.1,
      systemSize: "200 kW / 400 kWh",
    },
    color: {
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      border: "border-cyan-400/50",
      badge: "bg-cyan-500",
    },
  },
  'ev-charging': {
    title: "EV Charging Hub",
    icon: Car,
    description: "DC fast chargers create massive demand spikes that can triple your electric bill. BESS buffers these spikes and enables profitable charging operations without expensive utility upgrades.",
    benefits: [
      "Cut demand charges from DCFC by 50-70%",
      "Add chargers without costly utility service upgrades",
      "Arbitrage cheap overnight power for daytime charging",
      "Revenue stacking with grid services and demand response",
      "Future-proof for growing EV demand",
    ],
    example: {
      name: "10-Port DCFC Station in Texas",
      savings: 62000,
      payback: 3.8,
      systemSize: "500 kW / 1,000 kWh",
    },
    color: {
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      border: "border-emerald-400/50",
      badge: "bg-emerald-500",
    },
  },
  'data-center': {
    title: "Data Center",
    icon: Server,
    description: "Data centers require 99.999% uptime and consume massive amounts of electricity. BESS provides seamless backup power, UPS bridging, and significant demand charge reduction for facilities that can't afford a single second of downtime.",
    benefits: [
      "Seamless UPS bridging - zero transfer time",
      "Reduce demand charges on 24/7 high-load facilities",
      "Meet Tier III/IV uptime requirements",
      "Support renewable energy commitments",
      "Participate in grid services for additional revenue",
    ],
    example: {
      name: "5 MW Colocation Facility in Virginia",
      savings: 180000,
      payback: 4.5,
      systemSize: "2,000 kW / 8,000 kWh",
    },
    color: {
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      border: "border-violet-400/50",
      badge: "bg-violet-500",
    },
  },
  warehouse: {
    title: "Warehouse & Distribution",
    icon: Warehouse,
    description: "Modern warehouses with automation, cold storage, and EV fleet charging face significant peak demand. Battery storage reduces demand charges and ensures operations continue during outages.",
    benefits: [
      "Peak shaving for automated material handling",
      "Cold storage protection during power outages",
      "EV forklift and fleet charging optimization",
      "Reduce demand charges by 40-60%",
      "Support solar installations on large roof areas",
    ],
    example: {
      name: "500,000 sq ft Distribution Center in Texas",
      savings: 95000,
      payback: 4.0,
      systemSize: "800 kW / 3,200 kWh",
    },
    color: {
      gradient: "from-amber-500 via-orange-500 to-red-500",
      border: "border-amber-400/50",
      badge: "bg-amber-500",
    },
  },
  retail: {
    title: "Retail & Commercial",
    icon: ShoppingBag,
    description: "Retail stores face peak demand from HVAC, lighting, and refrigeration, especially during business hours. BESS helps reduce utility costs and keeps stores operating during outages.",
    benefits: [
      "Reduce demand charges during peak shopping hours",
      "Protect refrigerated inventory during outages",
      "Support rooftop solar installations",
      "Enable EV charging for customers",
      "Meet corporate sustainability goals",
    ],
    example: {
      name: "Big Box Retail Store in Florida",
      savings: 52000,
      payback: 4.3,
      systemSize: "400 kW / 1,600 kWh",
    },
    color: {
      gradient: "from-pink-500 via-rose-500 to-red-500",
      border: "border-pink-400/50",
      badge: "bg-pink-500",
    },
  },
  manufacturing: {
    title: "Manufacturing",
    icon: Factory,
    description: "Manufacturing facilities have heavy machinery with significant startup loads and continuous operation requirements. BESS provides peak shaving, power quality improvement, and production continuity.",
    benefits: [
      "Peak shaving for heavy machinery startup loads",
      "Power quality improvement for sensitive equipment",
      "Production continuity during grid instability",
      "Reduce demand charges by 30-50%",
      "Enable on-site renewable integration",
    ],
    example: {
      name: "Auto Parts Manufacturer in Michigan",
      savings: 125000,
      payback: 3.5,
      systemSize: "1,200 kW / 4,800 kWh",
    },
    color: {
      gradient: "from-slate-500 via-gray-500 to-zinc-500",
      border: "border-slate-400/50",
      badge: "bg-slate-500",
    },
  },
  hospital: {
    title: "Healthcare Facility",
    icon: Heart,
    description: "Hospitals require uninterrupted power for life-safety systems and critical care. BESS provides seamless backup, reduces demand charges, and supports clean energy goals.",
    benefits: [
      "Life-safety backup power - zero transfer time",
      "Reduce demand charges on 24/7 operations",
      "Meet Joint Commission power requirements",
      "Support critical care during extended outages",
      "Clean energy for healthcare sustainability",
    ],
    example: {
      name: "200-Bed Regional Hospital in California",
      savings: 145000,
      payback: 4.8,
      systemSize: "1,500 kW / 6,000 kWh",
    },
    color: {
      gradient: "from-red-500 via-rose-500 to-pink-500",
      border: "border-red-400/50",
      badge: "bg-red-500",
    },
  },
  airport: {
    title: "Airport",
    icon: Plane,
    description: "Airports operate 24/7 with critical systems requiring uninterrupted power. BESS supports terminal operations, ground support equipment charging, and FAA-required backup systems.",
    benefits: [
      "Critical backup for air traffic and safety systems",
      "Peak shaving for terminal HVAC and lighting",
      "Electric ground support equipment charging",
      "Meet FAA backup power requirements",
      "Support sustainability and net-zero goals",
    ],
    example: {
      name: "Regional Airport Terminal in Arizona",
      savings: 210000,
      payback: 5.2,
      systemSize: "2,500 kW / 10,000 kWh",
    },
    color: {
      gradient: "from-sky-500 via-blue-500 to-indigo-500",
      border: "border-sky-400/50",
      badge: "bg-sky-500",
    },
  },
  college: {
    title: "College & University",
    icon: GraduationCap,
    description: "Campus microgrids with battery storage provide resilient power for research facilities, dormitories, and critical infrastructure while reducing utility costs.",
    benefits: [
      "Campus-wide peak demand management",
      "Research facility backup power",
      "Dormitory resilience during outages",
      "Support campus renewable energy goals",
      "Educational opportunities for students",
    ],
    example: {
      name: "State University Campus in Ohio",
      savings: 320000,
      payback: 5.0,
      systemSize: "4,000 kW / 16,000 kWh",
    },
    color: {
      gradient: "from-amber-500 via-yellow-500 to-orange-500",
      border: "border-amber-400/50",
      badge: "bg-amber-500",
    },
  },
  agricultural: {
    title: "Agricultural",
    icon: TreePine,
    description: "Farms and agricultural operations require reliable power for irrigation, cold storage, and processing equipment, often in areas with unreliable grid connections.",
    benefits: [
      "Irrigation pump optimization and backup",
      "Cold storage protection for produce",
      "Processing equipment power quality",
      "Solar integration for off-grid operations",
      "Reduce peak demand from equipment startups",
    ],
    example: {
      name: "Large Dairy Farm in Wisconsin",
      savings: 45000,
      payback: 4.5,
      systemSize: "300 kW / 1,200 kWh",
    },
    color: {
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      border: "border-green-400/50",
      badge: "bg-green-500",
    },
  },
  'gas-station': {
    title: "Gas Station / C-Store",
    icon: Fuel,
    description: "Gas stations and convenience stores operate 24/7 with refrigeration, lighting, and fuel pumps. Adding EV charging creates new revenue opportunities with battery storage managing demand spikes.",
    benefits: [
      "Enable profitable EV charging services",
      "Refrigeration backup during outages",
      "Fuel pump backup power",
      "Demand charge reduction",
      "Transition to EV-era revenue streams",
    ],
    example: {
      name: "Highway Travel Center with DCFC in Nevada",
      savings: 38000,
      payback: 3.2,
      systemSize: "250 kW / 500 kWh",
    },
    color: {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      border: "border-orange-400/50",
      badge: "bg-orange-500",
    },
  },
  restaurant: {
    title: "Restaurant / Food Service",
    icon: Utensils,
    description: "Restaurants have significant peak loads from commercial kitchens, HVAC, and refrigeration. Battery storage reduces demand charges and protects food inventory during outages.",
    benefits: [
      "Kitchen equipment peak shaving",
      "Walk-in cooler/freezer backup",
      "Reduce demand charges by 25-40%",
      "Enable outdoor patio heating without upgrades",
      "Support franchise sustainability requirements",
    ],
    example: {
      name: "Full-Service Restaurant in California",
      savings: 18000,
      payback: 3.8,
      systemSize: "100 kW / 400 kWh",
    },
    color: {
      gradient: "from-red-500 via-orange-500 to-amber-500",
      border: "border-red-400/50",
      badge: "bg-red-500",
    },
  },
};

// Default content for unknown industries
export const DEFAULT_USE_CASE_CONTENT: UseCaseContent = {
  title: "Commercial & Industrial",
  icon: Building2,
  description: "Battery energy storage helps commercial and industrial facilities reduce demand charges, ensure backup power, and integrate renewable energy for long-term savings.",
  benefits: [
    "Reduce demand charges by 30-50%",
    "Backup power for critical operations",
    "Enable on-site solar integration",
    "Qualify for 30% federal ITC tax credit",
    "Meet sustainability and ESG goals",
  ],
  example: {
    name: "Commercial Facility",
    savings: 50000,
    payback: 4.0,
    systemSize: "400 kW / 1,600 kWh",
  },
  color: {
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
    border: "border-indigo-400/50",
    badge: "bg-indigo-500",
  },
};

// ============================================
// MODAL COMPONENT PROPS
// ============================================

export interface UseCaseModalProps {
  industry: string;
  isOpen: boolean;
  onClose: () => void;
  onBuildQuote: () => void;
}

// ============================================
// MODAL COMPONENT
// ============================================

export function UseCaseModal({ industry, isOpen, onClose, onBuildQuote }: UseCaseModalProps) {
  const content = USE_CASE_CONTENT[industry] || DEFAULT_USE_CASE_CONTENT;
  const IconComponent = content.icon;
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className={`relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 ${content.color.border} shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all z-10"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Header with icon */}
        <div className={`p-8 pb-6 bg-gradient-to-r ${content.color.gradient} bg-opacity-20`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${content.color.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white">{content.title}</h2>
              <p className="text-white/70 text-sm font-medium">Battery Energy Storage Solution</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8 pt-6 space-y-6">
          {/* Description */}
          <p className="text-slate-300 text-lg leading-relaxed">{content.description}</p>
          
          {/* Benefits list */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Key Benefits
            </h3>
            <ul className="space-y-3">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Example savings card */}
          <div className={`bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border ${content.color.border}`}>
            <h4 className="text-sm font-bold text-white/70 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Battery className="w-4 h-4" />
              Example: {content.example.name}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-400">
                  ${content.example.savings.toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 font-medium">Annual Savings</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-amber-400">
                  {content.example.payback}
                </p>
                <p className="text-xs text-slate-400 font-medium">Year Payback</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-400">
                  {content.example.systemSize}
                </p>
                <p className="text-xs text-slate-400 font-medium">System Size</p>
              </div>
            </div>
          </div>
          
          {/* Federal tax credit callout */}
          <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4 flex items-center gap-3">
            <Sun className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-300 font-bold">30% Federal Tax Credit Available</p>
              <p className="text-emerald-200/70 text-sm">The IRA 2022 provides a 30% ITC for battery storage systems through 2032.</p>
            </div>
          </div>
          
          {/* CTA Button */}
          <button 
            onClick={onBuildQuote}
            className={`w-full py-4 bg-gradient-to-r ${content.color.gradient} hover:opacity-90 text-white font-black text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3`}
          >
            Build My Quote
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-center text-slate-500 text-sm">
            Free • No obligation • Takes 2 minutes
          </p>
        </div>
      </div>
    </div>
  );
}

export default UseCaseModal;
