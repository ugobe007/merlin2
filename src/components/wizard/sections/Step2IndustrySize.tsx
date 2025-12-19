/**
 * STEP 2: INDUSTRY + KEY SIZE
 * ============================
 * 
 * December 18, 2025 - STEVE JOBS REIMAGINATION
 * 
 * DESIGN PHILOSOPHY:
 * - "Think Different" - No categories, no expanding, everything visible
 * - Featured Verticals: Hotel, Car Wash, EV Charging with hero images
 * - Flat vibrant grid: Every industry visible with unique colors
 * - One click selection - no friction
 * 
 * FLOW:
 * 1. Featured verticals for guided experience (with images)
 * 2. OR pick any industry from vibrant flat grid
 * 3. Merlin shows insights + size slider
 * 4. "Next: Facility Details"
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, Home as HomeIcon, ArrowRight, CheckCircle, Sparkles, Zap,
  Building2, Hotel, Car, Plug, Factory, ShoppingBag, Plane,
  Warehouse, Leaf, Monitor, Droplets, Heart, GraduationCap,
  Dices, Wheat, Snowflake, Fuel, Building, Wand2, Star, ExternalLink,
  Home, Battery, Gauge
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { INDUSTRY_CATEGORIES, findIndustryById, findCategoryByIndustryId, getPopularIndustries } from '../constants/industryCategories';
import { getStepColors } from '../constants/stepColors';
import { MerlinHat } from '../MerlinHat';
import merlinImage from '@/assets/images/new_Merlin.png';
import { GlowButton } from '@/components/shared/GlowButton';

// Import vertical images
import hotelImage from '@/assets/images/hotel_motel_holidayinn_2.jpg';
import carWashImage from '@/assets/images/carwash1.jpg';
import evChargingImage from '@/assets/images/ev_charging_station.jpg';

// ============================================
// TYPES
// ============================================

interface Step2IndustrySizeProps {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  availableUseCases: any[];
  isLoadingUseCases: boolean;
  onIndustrySelect: (slug: string, name: string, useCaseId?: string) => Promise<void>;
  onBack: () => void;
  onHome?: () => void;
  onContinue: () => void;
  onOpenProQuote?: () => void;
  sectionRef?: React.RefObject<HTMLDivElement>;
  isHidden?: boolean;
}

// ============================================
// INDUSTRY DATA - Icons, sizing, educational messaging
// ============================================

interface IndustryConfig {
  icon: React.ElementType;
  sizeLabel: string;
  sizeUnit: string;
  sizeMin: number;
  sizeMax: number;
  sizeStep: number;
  sizeDefault: number;
  stateKey: string; // Key in wizardState.useCaseData
  // Educational messaging
  intro: string; // After selecting industry
  peakPowerRange: string; // e.g., "45-75 kW"
  savingsRange: string; // e.g., "$25,000-$60,000/year"
  // Dynamic estimate function
  estimatePeakKW: (size: number) => number;
  nextStepHint: string;
}

const INDUSTRY_CONFIGS: Record<string, IndustryConfig> = {
  'hotel': {
    icon: Hotel,
    sizeLabel: 'How many rooms?',
    sizeUnit: 'rooms',
    sizeMin: 25,
    sizeMax: 500,
    sizeStep: 25,
    sizeDefault: 150,
    stateKey: 'roomCount',
    intro: "Hotels are excellent candidates for energy savings! With HVAC running 24/7 and high demand charges, the right system can dramatically cut your bills.",
    peakPowerRange: "45-200 kW",
    savingsRange: "$25,000-$80,000/year",
    estimatePeakKW: (rooms) => Math.round(rooms * 0.4 + 15),
    nextStepHint: "Next, I'll ask about your amenities (pool, restaurant, EV chargers) to refine this estimate.",
  },
  'car-wash': {
    icon: Car,
    sizeLabel: 'How many wash bays?',
    sizeUnit: 'bays',
    sizeMin: 1,
    sizeMax: 20,
    sizeStep: 1,
    sizeDefault: 4,
    stateKey: 'bayCount',
    intro: "Car washes have high peak demand from pumps and blowers. Battery storage can shave 30-50% off your demand charges!",
    peakPowerRange: "50-300 kW",
    savingsRange: "$15,000-$60,000/year",
    estimatePeakKW: (bays) => Math.round(bays * 25 + 20),
    nextStepHint: "Next, I'll ask about your wash type (tunnel, in-bay, self-service) and operating hours.",
  },
  'ev-charging': {
    icon: Plug,
    sizeLabel: 'How many charging ports?',
    sizeUnit: 'ports',
    sizeMin: 2,
    sizeMax: 100,
    sizeStep: 2,
    sizeDefault: 10,
    stateKey: 'evChargerCount',
    intro: "EV charging stations have huge demand spikes. Battery storage can reduce your peak demand by 40-60% and enable faster chargers without utility upgrades!",
    peakPowerRange: "100-2,000 kW",
    savingsRange: "$30,000-$150,000/year",
    estimatePeakKW: (ports) => Math.round(ports * 50), // Assumes mix of L2 and DCFC
    nextStepHint: "Next, I'll ask about your charger types (Level 2, DC Fast, HPC) and utilization patterns.",
  },
  'manufacturing': {
    icon: Factory,
    sizeLabel: 'Facility size (sq ft)?',
    sizeUnit: 'sq ft',
    sizeMin: 10000,
    sizeMax: 500000,
    sizeStep: 10000,
    sizeDefault: 50000,
    stateKey: 'squareFootage',
    intro: "Manufacturing facilities have predictable load profiles. Peak shaving can reduce demand charges by 25-40%, plus provide backup power for critical processes.",
    peakPowerRange: "200-2,000 kW",
    savingsRange: "$40,000-$200,000/year",
    estimatePeakKW: (sqft) => Math.round(sqft * 0.015),
    nextStepHint: "Next, I'll ask about your operations (shifts, critical equipment, backup needs).",
  },
  'retail': {
    icon: ShoppingBag,
    sizeLabel: 'Store size (sq ft)?',
    sizeUnit: 'sq ft',
    sizeMin: 2000,
    sizeMax: 200000,
    sizeStep: 2000,
    sizeDefault: 15000,
    stateKey: 'squareFootage',
    intro: "Retail stores peak during business hours with HVAC and lighting. Energy storage can cut demand charges and provide backup power to keep registers running.",
    peakPowerRange: "30-500 kW",
    savingsRange: "$10,000-$75,000/year",
    estimatePeakKW: (sqft) => Math.round(sqft * 0.012),
    nextStepHint: "Next, I'll ask about your store type (big box, strip mall, standalone) and operating hours.",
  },
  'office': {
    icon: Building,
    sizeLabel: 'Office size (sq ft)?',
    sizeUnit: 'sq ft',
    sizeMin: 5000,
    sizeMax: 500000,
    sizeStep: 5000,
    sizeDefault: 25000,
    stateKey: 'squareFootage',
    intro: "Office buildings have consistent weekday demand patterns. Energy storage can shave peaks and provide backup power for elevators and critical systems.",
    peakPowerRange: "50-1,000 kW",
    savingsRange: "$15,000-$100,000/year",
    estimatePeakKW: (sqft) => Math.round(sqft * 0.008),
    nextStepHint: "Next, I'll ask about your building class, data center needs, and EV charging plans.",
  },
  'hospital': {
    icon: Heart,
    sizeLabel: 'How many beds?',
    sizeUnit: 'beds',
    sizeMin: 25,
    sizeMax: 1000,
    sizeStep: 25,
    sizeDefault: 200,
    stateKey: 'bedCount',
    intro: "Hospitals require 24/7 power reliability. Battery storage provides instant backup for critical equipment and can reduce demand charges by 20-35%.",
    peakPowerRange: "500-5,000 kW",
    savingsRange: "$75,000-$400,000/year",
    estimatePeakKW: (beds) => Math.round(beds * 5 + 200),
    nextStepHint: "Next, I'll ask about your critical care areas and backup power requirements.",
  },
  'data-center': {
    icon: Monitor,
    sizeLabel: 'IT Load (kW)?',
    sizeUnit: 'kW',
    sizeMin: 50,
    sizeMax: 10000,
    sizeStep: 50,
    sizeDefault: 500,
    stateKey: 'itLoadKW',
    intro: "Data centers need 99.999% uptime. Battery storage provides seamless backup and can participate in grid services for additional revenue.",
    peakPowerRange: "100-20,000 kW",
    savingsRange: "$50,000-$500,000/year",
    estimatePeakKW: (itLoad) => Math.round(itLoad * 1.5), // PUE ~1.5
    nextStepHint: "Next, I'll ask about your tier level, redundancy requirements, and cooling needs.",
  },
  'warehouse': {
    icon: Warehouse,
    sizeLabel: 'Warehouse size (sq ft)?',
    sizeUnit: 'sq ft',
    sizeMin: 10000,
    sizeMax: 1000000,
    sizeStep: 25000,
    sizeDefault: 100000,
    stateKey: 'squareFootage',
    intro: "Warehouses have high lighting and forklift charging loads. Battery storage can reduce demand charges and enable solar self-consumption.",
    peakPowerRange: "100-2,000 kW",
    savingsRange: "$20,000-$150,000/year",
    estimatePeakKW: (sqft) => Math.round(sqft * 0.008),
    nextStepHint: "Next, I'll ask about your refrigeration needs and automation level.",
  },
  'airport': {
    icon: Plane,
    sizeLabel: 'Annual passengers (million)?',
    sizeUnit: 'M passengers',
    sizeMin: 1,
    sizeMax: 100,
    sizeStep: 1,
    sizeDefault: 10,
    stateKey: 'annualPassengers',
    intro: "Airports have massive and complex energy needs. Battery storage can provide backup for critical systems and significant demand charge savings.",
    peakPowerRange: "5,000-50,000 kW",
    savingsRange: "$500,000-$5,000,000/year",
    estimatePeakKW: (passengers) => Math.round(passengers * 500 + 2000),
    nextStepHint: "Next, I'll ask about your terminal areas and ground support equipment.",
  },
};

// Default config for industries not in the map
const DEFAULT_CONFIG: IndustryConfig = {
  icon: Building2,
  sizeLabel: 'Facility size (sq ft)?',
  sizeUnit: 'sq ft',
  sizeMin: 5000,
  sizeMax: 200000,
  sizeStep: 5000,
  sizeDefault: 25000,
  stateKey: 'squareFootage',
  intro: "Every business can benefit from energy storage. Let me analyze your specific needs and show you the savings potential.",
  peakPowerRange: "50-500 kW",
  savingsRange: "$15,000-$100,000/year",
  estimatePeakKW: (sqft) => Math.round(sqft * 0.01),
  nextStepHint: "Next, I'll ask a few more questions to refine your quote.",
};

// Quick industry buttons (most popular) - now sourced from categories
const QUICK_INDUSTRIES = getPopularIndustries().slice(0, 6);

// ============================================
// SUBTLE ACCENT COLORS - Professional, not cartoon
// Left border accent + icon tint only
// ============================================
const INDUSTRY_ACCENTS: Record<string, string> = {
  'hotel': '#7C3AED',      // Purple
  'retail': '#EC4899',     // Pink
  'office': '#3B82F6',     // Blue
  'ev-charging': '#10B981', // Emerald
  'car-wash': '#06B6D4',   // Cyan
  'gas-station': '#F97316', // Orange
  'shopping-center': '#F43F5E', // Rose
  'casino': '#F59E0B',     // Amber
  'manufacturing': '#475569', // Slate
  'warehouse': '#6366F1',  // Indigo
  'data-center': '#8B5CF6', // Violet
  'cold-storage': '#0EA5E9', // Sky
  'residential': '#22C55E', // Green
  'apartment': '#14B8A6',  // Teal
  'hospital': '#EF4444',   // Red
  'college': '#EAB308',    // Yellow
  'government': '#2563EB', // Blue-600
  'airport': '#D946EF',    // Fuchsia
  'agricultural': '#84CC16', // Lime
  'indoor-farm': '#16A34A', // Green-600
  'microgrid': '#6B7280',  // Gray
};

// Featured verticals with dedicated landing pages
const FEATURED_VERTICALS = [
  {
    id: 'hotel',
    name: 'Hotels & Hospitality',
    description: 'Save $25K-$80K/year on energy',
    image: hotelImage,
    route: '/hotel-energy',
    accent: '#7C3AED',
    stats: '150+ hotels analyzed',
  },
  {
    id: 'car-wash',
    name: 'Car Wash',
    description: 'Cut demand charges by 40%',
    image: carWashImage,
    route: '/car-wash-energy',
    accent: '#06B6D4',
    stats: '500+ car washes served',
  },
  {
    id: 'ev-charging',
    name: 'EV Charging',
    description: 'Power more chargers, pay less',
    image: evChargingImage,
    route: '/ev-charging-energy',
    accent: '#10B981',
    stats: 'Up to 60% demand reduction',
  },
];

// Get ALL industries flattened from categories
const ALL_INDUSTRIES = INDUSTRY_CATEGORIES.flatMap(cat => cat.industries);

// ============================================
// MAIN COMPONENT
// ============================================

// ============================================
// TABBED INDUSTRY CATEGORIES (Dec 19, 2025)
// 3 tabs: Commercial, Industrial, Housing
// ============================================

interface TabCategory {
  id: string;
  name: string;
  gradient: string;      // Button gradient when selected
  bgGradient: string;    // Tab background gradient
  textColor: string;     // Tab text color
  glowVariant: 'commercial' | 'industrial' | 'housing' | 'ice' | 'fire' | 'steel' | 'violet' | 'emerald';  // GlowButton variant
  industries: { id: string; name: string; icon: React.ElementType }[];
}

const INDUSTRY_TABS: TabCategory[] = [
  {
    id: 'commercial',
    name: 'Commercial',
    // Blue theme (Hot Match palette)
    gradient: 'from-sky-400 via-blue-500 to-blue-600',
    bgGradient: 'from-sky-500 to-blue-600',
    textColor: 'text-blue-600',
    glowVariant: 'commercial',  // Blue glossy buttons
    industries: [
      // NOTE: Hotel, Car Wash, EV Charging are in Featured Verticals hero section (not duplicated here)
      { id: 'retail', name: 'Retail & Shopping', icon: ShoppingBag },
      { id: 'office', name: 'Office Buildings', icon: Building },
      { id: 'shopping-center', name: 'Shopping Center', icon: ShoppingBag },
      { id: 'casino', name: 'Casino & Gaming', icon: Dices },
      { id: 'hospital', name: 'Hospital & Healthcare', icon: Heart },
      { id: 'college', name: 'College & University', icon: GraduationCap },
      { id: 'government', name: 'Government & Public', icon: Building2 },
      { id: 'airport', name: 'Airport', icon: Plane },
    ],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    // Green theme
    gradient: 'from-emerald-400 via-green-500 to-green-600',
    bgGradient: 'from-emerald-500 to-green-600',
    textColor: 'text-green-600',
    glowVariant: 'industrial',  // Green glossy buttons
    industries: [
      { id: 'manufacturing', name: 'Manufacturing', icon: Factory },
      { id: 'warehouse', name: 'Warehouse & Logistics', icon: Warehouse },
      { id: 'data-center', name: 'Data Center', icon: Monitor },
      { id: 'cold-storage', name: 'Cold Storage', icon: Snowflake },
      { id: 'agricultural', name: 'Agricultural', icon: Wheat },
      { id: 'indoor-farm', name: 'Indoor Farm', icon: Leaf },
      { id: 'microgrid', name: 'Microgrid & Renewable', icon: Zap },
    ],
  },
  {
    id: 'housing',
    name: 'Housing',
    // Purple theme (Merlin brand)
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
    bgGradient: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-600',
    glowVariant: 'housing',  // Purple glossy buttons
    industries: [
      { id: 'residential', name: 'Residential Home', icon: Home },
      { id: 'apartment', name: 'Apartment Complex', icon: Building },
    ],
  },
];

export function Step2IndustrySize({
  wizardState,
  setWizardState,
  availableUseCases,
  isLoadingUseCases,
  onIndustrySelect,
  onBack,
  onHome,
  onContinue,
  onOpenProQuote,
  sectionRef,
  isHidden = false,
}: Step2IndustrySizeProps) {
  // Local state for size slider (before committing to wizardState)
  const [localSize, setLocalSize] = useState<number | null>(null);
  
  // Tab state for industry categories
  const [selectedTab, setSelectedTab] = useState<string>('commercial');
  
  // Navigation helper
  const navigateTo = (route: string) => {
    window.location.href = route;
  };
  
  // Get step colors for visual progression
  const stepColors = getStepColors(1); // Step 1 = Industry selection
  
  // Get config for selected industry
  const config = useMemo(() => {
    if (!wizardState.selectedIndustry) return null;
    return INDUSTRY_CONFIGS[wizardState.selectedIndustry] || DEFAULT_CONFIG;
  }, [wizardState.selectedIndustry]);
  
  // Current size value (local or from wizardState)
  const currentSize = useMemo(() => {
    if (localSize !== null) return localSize;
    if (config && wizardState.useCaseData?.[config.stateKey]) {
      return wizardState.useCaseData[config.stateKey] as number;
    }
    return config?.sizeDefault || 100;
  }, [localSize, config, wizardState.useCaseData]);
  
  // Estimated peak demand
  const estimatedPeakKW = useMemo(() => {
    if (!config) return 0;
    return config.estimatePeakKW(currentSize);
  }, [config, currentSize]);
  
  // Can continue?
  const canContinue = wizardState.selectedIndustry && currentSize > 0;
  
  // Handle industry selection
  const handleIndustryClick = async (slug: string, name: string) => {
    // CRITICAL: Look up useCaseId from availableUseCases to enable question loading
    const useCase = availableUseCases.find(uc => 
      uc.slug === slug || uc.slug?.toLowerCase() === slug.toLowerCase()
    );
    const useCaseId = useCase?.id;
    
    await onIndustrySelect(slug, name, useCaseId);
    const newConfig = INDUSTRY_CONFIGS[slug] || DEFAULT_CONFIG;
    setLocalSize(newConfig.sizeDefault);
  };
  
  // Handle size change
  const handleSizeChange = (value: number) => {
    setLocalSize(value);
    // Update wizardState immediately for responsiveness
    if (config) {
      setWizardState(prev => ({
        ...prev,
        useCaseData: {
          ...prev.useCaseData,
          [config.stateKey]: value,
        },
      }));
    }
  };
  
  // Handle continue
  const handleContinue = () => {
    // Ensure size is saved to wizardState
    if (config && localSize !== null) {
      setWizardState(prev => ({
        ...prev,
        useCaseData: {
          ...prev.useCaseData,
          [config.stateKey]: localSize,
        },
      }));
    }
    onContinue();
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
      className={`min-h-[calc(100vh-80px)] p-6 md:p-8 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN GUIDANCE PANEL - Comprehensive template (Dec 19, 2025)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-6 mb-6 shadow-xl border border-indigo-400/30">
          {/* Top Row: Avatar + Acknowledgment */}
          <div className="flex items-start gap-5 mb-5">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center overflow-hidden">
                <img src={merlinImage} alt="Merlin" className="w-16 h-16 object-contain" />
              </div>
            </div>
            <div className="flex-1">
              {/* 1. ACKNOWLEDGE PREVIOUS STEP */}
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  ✅ Great! You're in {wizardState.state || 'your selected location'}
                  {wizardState.goals.length > 0 && ` with ${wizardState.goals.length} goal${wizardState.goals.length > 1 ? 's' : ''} selected`}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What type of business are you?
              </h1>
              <p className="text-white/90 text-base leading-relaxed">
                I'll calculate your energy savings based on your industry. Different businesses have different energy profiles!
              </p>
            </div>
          </div>
          
          {/* 2. STEP BY STEP INSTRUCTIONS */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Here's what to do on this page:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <span className="text-white/90 text-sm">Choose a <strong>Guided Experience</strong> OR...</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <span className="text-white/90 text-sm">Select from <strong>All Industries</strong> below</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <span className="text-white/90 text-sm">I'll load <strong>custom questions</strong> for you</span>
              </div>
            </div>
          </div>
          
          {/* 3. RECOMMENDATION */}
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 mb-5 border border-emerald-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Battery className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-emerald-300 font-bold mb-1">💡 Merlin's Recommendation</h4>
                <p className="text-white/90 text-sm">
                  <strong>Hotels, Car Washes, and EV Charging</strong> have guided experiences with custom calculators. 
                  Other industries use our smart wizard that adapts to your specific needs!
                </p>
              </div>
            </div>
          </div>
          
          {/* 4. PRO TIP: NAV BAR */}
          <div className="bg-amber-500/20 rounded-2xl p-4 border border-amber-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Gauge className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-amber-300 font-bold text-sm mb-1">👆 Pro Tip: Check the Top Navigation Bar</h4>
                <p className="text-white/80 text-sm">
                  The <strong>Solar Opportunity</strong> rating shows how much sun your location gets. More suns = more savings from solar!
                </p>
              </div>
            </div>
          </div>
          
          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
              <span className="text-amber-300 font-bold text-sm">Step 2 of 4</span>
              <span className="text-white/50">•</span>
              <span className="text-white/80 text-sm">Your Business</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#060F76]/80 hover:bg-[#060F76] rounded-lg transition-colors border border-[#4b59f5]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#7DD3FC] hover:bg-[#060F76]/30 rounded-lg transition-colors"
            >
              <HomeIcon className="w-4 h-4" />
              Home
            </button>
          )}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            FEATURED VERTICALS - Hero Cards with Rich Images
            Professional but impactful
        ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Guided Experiences</h3>
            <span className="text-white/50 text-sm">— Custom tools for your industry</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURED_VERTICALS.map((vertical) => (
              <button
                key={vertical.id}
                onClick={() => navigateTo(vertical.route)}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 text-left"
              >
                {/* Full Image Background */}
                <div className="h-44 relative">
                  <img
                    src={vertical.image}
                    alt={vertical.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      console.log('Image failed to load:', vertical.image);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Subtle gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Stats badge - top right */}
                  <div 
                    className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm"
                    style={{ backgroundColor: `${vertical.accent}dd`, color: 'white' }}
                  >
                    {vertical.stats}
                  </div>
                  
                  {/* Content overlay - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-xl font-black text-white mb-1 drop-shadow-lg">{vertical.name}</h4>
                    <p className="text-white/90 text-sm">{vertical.description}</p>
                  </div>
                </div>
                
                {/* CTA Bar */}
                <div 
                  className="px-4 py-3 flex items-center justify-between text-white text-sm font-semibold group-hover:brightness-110 transition-all"
                  style={{ backgroundColor: vertical.accent }}
                >
                  <span>Start Guided Experience</span>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            ALL INDUSTRIES - TABBED CATEGORY VIEW
            3 Tabs: Commercial (light blue), Industrial (slate), Housing (purple)
            Professional gradient buttons with 3D effect
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 shadow-2xl mb-6 overflow-hidden">
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200">
            {INDUSTRY_TABS.map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    flex-1 py-4 px-6 text-lg font-bold transition-all relative
                    ${isActive 
                      ? 'text-white' 
                      : `${tab.textColor} hover:bg-slate-50`
                    }
                  `}
                >
                  {/* Active tab gradient background */}
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${tab.bgGradient}`} />
                  )}
                  
                  {/* Tab content */}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tab.name}
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.industries.length}
                    </span>
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Tab Content */}
          <div className="p-8">
            {INDUSTRY_TABS.map((tab) => {
              if (selectedTab !== tab.id) return null;
              
              return (
                <div key={tab.id} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                  {tab.industries.map((industry) => {
                    const Icon = industry.icon;
                    const isSelected = wizardState.selectedIndustry === industry.id;
                    
                    return (
                      <GlowButton
                        key={industry.id}
                        variant={tab.glowVariant}
                        selected={isSelected}
                        onClick={() => handleIndustryClick(industry.id, industry.name)}
                        icon={<Icon className="w-7 h-7" />}
                        size="md"
                      >
                        {industry.name}
                      </GlowButton>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            MERLIN'S INSIGHTS + SIZE SLIDER (after industry selected)
        ═══════════════════════════════════════════════════════════════ */}
        {wizardState.selectedIndustry && config && (
          <div className="bg-gradient-to-br from-[#060F76]/90 via-[#1a237e]/80 to-[#060F76]/90 rounded-3xl p-6 border-2 border-[#4b59f5] shadow-xl mb-6">
            {/* Merlin's intro message */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-[#7DD3FC] bg-gradient-to-br from-[#060F76] to-[#1a237e]">
                <img src={merlinImage} alt="Merlin" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-white text-lg leading-relaxed">
                  "{config.intro}"
                </p>
                <p className="mt-2 text-[#7DD3FC]">
                  <span className="font-semibold">Typical savings:</span> {config.savingsRange}
                </p>
              </div>
            </div>
            
            {/* Size slider */}
            <div className="bg-white/95 rounded-2xl p-5 mb-4">
              <label className="block text-lg font-bold text-gray-800 mb-4">
                {config.sizeLabel}
              </label>
              
              <div className="flex items-center gap-4 mb-2">
                <input
                  type="range"
                  min={config.sizeMin}
                  max={config.sizeMax}
                  step={config.sizeStep}
                  value={currentSize}
                  onChange={(e) => handleSizeChange(Number(e.target.value))}
                  className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#060F76]"
                  style={{
                    background: `linear-gradient(to right, #060F76 0%, #060F76 ${((currentSize - config.sizeMin) / (config.sizeMax - config.sizeMin)) * 100}%, #e5e7eb ${((currentSize - config.sizeMin) / (config.sizeMax - config.sizeMin)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="w-28 text-center">
                  <span className="text-3xl font-black text-[#060F76]">
                    {formatNumber(currentSize)}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">{config.sizeUnit}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatNumber(config.sizeMin)} {config.sizeUnit}</span>
                <span>{formatNumber(config.sizeMax)} {config.sizeUnit}</span>
              </div>
            </div>
            
            {/* Live estimate */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-400/30">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-white">
                    At <span className="font-bold text-emerald-300">{formatNumber(currentSize)} {config.sizeUnit}</span>, 
                    I estimate <span className="font-bold text-emerald-300">~{estimatedPeakKW} kW</span> peak demand.
                  </p>
                  <p className="text-emerald-200/70 text-sm mt-1">
                    {config.nextStepHint}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════
            NAVIGATION BUTTONS - CONSISTENT DESIGN
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between">
          {/* Left side: Back + Home */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-r from-slate-600 to-slate-700
                         border-2 border-slate-500
                         text-white font-bold
                         hover:from-slate-500 hover:to-slate-600
                         hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="flex items-center gap-2 px-4 py-3 rounded-xl
                           bg-slate-800/50 border-2 border-slate-600
                           text-gray-300 font-semibold
                           hover:bg-slate-700 hover:text-white transition-all"
              >
                <HomeIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Right side: Continue */}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              canContinue
                ? 'bg-gradient-to-r from-[#6700b6] via-[#060F76] to-[#6700b6] border-2 border-[#ad42ff] text-white shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105'
                : 'bg-gray-600 border-2 border-gray-500 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Wand2 className="w-5 h-5" />
            Next Step
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        
        {!canContinue && (
          <p className="text-center text-white/60 text-sm mt-3">
            Select your industry to continue
          </p>
        )}
        
        {/* ProQuote link - Merlin blue scheme */}
        {onOpenProQuote && (
          <div className="mt-6 text-center">
            <button
              onClick={onOpenProQuote}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#060F76] to-[#1a237e] text-white font-semibold rounded-xl border-2 border-[#4b59f5] hover:shadow-lg hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#7DD3FC]" />
              Need more control? Try ProQuote™
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Step2IndustrySize;
