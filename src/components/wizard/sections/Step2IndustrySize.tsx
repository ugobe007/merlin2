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
  Home, Battery, Gauge, Check, Sun
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { INDUSTRY_CATEGORIES, findIndustryById, findCategoryByIndustryId, getPopularIndustries } from '../constants/industryCategories';
import { getStepColors } from '../constants/stepColors';
import { MerlinHat } from '../MerlinHat';
import merlinImage from '@/assets/images/new_profile_merlin.png';
import wizardIcon from '@/assets/images/wizard_icon1.png';
import { GlowButton } from '@/components/shared/GlowButton';
import { MerlinGreeting } from '../shared/MerlinGreeting';
import { FloatingNavigationArrows, FloatingSolarButton } from '../shared';
import { SolarOpportunityModal } from '../modals';

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
  // Debug logging
  console.log('🎯 [Step2IndustrySize] Rendering:', { 
    isHidden, 
    selectedIndustry: wizardState.selectedIndustry, 
    availableUseCasesCount: availableUseCases.length,
    timestamp: new Date().toISOString()
  });
  
  // Early return if hidden - but log it
  if (isHidden) {
    console.log('🎯 [Step2IndustrySize] Component is hidden, returning null');
    return null;
  }
  
  console.log('🎯 [Step2IndustrySize] Component is visible, rendering content');
  
  // Local state for size slider (before committing to wizardState)
  const [localSize, setLocalSize] = useState<number | null>(null);
  
  // Tab state for industry categories
  const [selectedTab, setSelectedTab] = useState<string>('commercial');
  
  // Local state for solar and EV (before committing to wizardState)
  const [hasSolar, setHasSolar] = useState<boolean | null>(wizardState.hasExistingSolar);
  const [solarKW, setSolarKW] = useState<number>(wizardState.existingSolarKW || 0);
  const [hasEV, setHasEV] = useState<boolean | null>(wizardState.hasExistingEV);
  const [evL1, setEvL1] = useState<number>(wizardState.existingEVL1 || 0);
  const [evL2, setEvL2] = useState<number>(wizardState.existingEVL2 || 0);
  const [evL3, setEvL3] = useState<number>(wizardState.existingEVL3 || 0);
  
  // Solar Opportunity Modal state
  const [showSolarOpportunityModal, setShowSolarOpportunityModal] = useState(false);
  
  // Handle featured vertical selection - pre-selects industry instead of navigating away
  const handleFeaturedVerticalSelect = async (verticalId: string, verticalName: string) => {
    // Use same pattern as handleIndustryClick - look up useCaseId from availableUseCases
    const useCase = availableUseCases.find(uc => 
      uc.slug === verticalId || 
      uc.id === verticalId ||
      uc.slug?.toLowerCase() === verticalId.toLowerCase() ||
      (verticalId === 'ev-charging' && (uc.slug === 'ev-charging' || uc.slug === 'ev_charging'))
    );
    
    const slug = useCase?.slug || verticalId;
    const name = useCase?.name || verticalName;
    const useCaseId = useCase?.id;
    
    if (onIndustrySelect) {
      // Pre-select the industry in the wizard (same as clicking a regular industry)
      await onIndustrySelect(slug, name, useCaseId);
      // Set default size if config exists
      const newConfig = INDUSTRY_CONFIGS[slug] || DEFAULT_CONFIG;
      setLocalSize(newConfig.sizeDefault);
    } else {
      console.warn(`[Step2IndustrySize] onIndustrySelect not available for vertical: ${verticalId}`);
    }
  };
  
  // Get step colors for visual progression
  const stepColors = getStepColors(1); // Step 1 = Industry selection
  
  // Get config for selected industry
  const config = useMemo(() => {
    if (!wizardState.selectedIndustry) return null;
    return INDUSTRY_CONFIGS[wizardState.selectedIndustry] || DEFAULT_CONFIG;
  }, [wizardState.selectedIndustry]);

  // Check if industry questionnaire already has solar/EV questions
  const hasSolarQuestion = useMemo(() => {
    if (!wizardState.customQuestions || wizardState.customQuestions.length === 0) return false;
    return wizardState.customQuestions.some((q: any) => 
      q.field_name === 'existingSolarKW' || 
      q.field_name === 'hasExistingSolar' || 
      q.field_name === 'wantsSolar' ||
      q.field_name?.toLowerCase().includes('solar')
    );
  }, [wizardState.customQuestions]);

  const hasEVQuestion = useMemo(() => {
    if (!wizardState.customQuestions || wizardState.customQuestions.length === 0) return false;
    return wizardState.customQuestions.some((q: any) => 
      q.field_name === 'hasEVCharging' || 
      q.field_name === 'evChargerCount' || 
      q.field_name === 'existingEVChargers' ||
      q.field_name === 'wantsEVCharging' ||
      q.field_name === 'level1Count' ||
      q.field_name === 'level2Count' ||
      q.field_name === 'level2Chargers' ||
      q.field_name === 'dcfc50kwChargers' ||
      q.field_name === 'dcfc150kwChargers' ||
      q.field_name?.toLowerCase().includes('ev') ||
      q.field_name?.toLowerCase().includes('charger')
    );
  }, [wizardState.customQuestions]);
  
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
  const canContinue = Boolean(wizardState.selectedIndustry && currentSize > 0);
  
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
    console.log('🎯 [Step2IndustrySize] handleContinue called');
    // Ensure size is saved to wizardState
    if (config && localSize !== null) {
      setWizardState(prev => ({
        ...prev,
        useCaseData: {
          ...prev.useCaseData,
          [config.stateKey]: localSize,
        },
        // Save solar and EV data
        hasExistingSolar: hasSolar,
        existingSolarKW: hasSolar === true ? solarKW : 0,
        hasExistingEV: hasEV,
        existingEVL1: hasEV === true ? evL1 : 0,
        existingEVL2: hasEV === true ? evL2 : 0,
        existingEVL3: hasEV === true ? evL3 : 0,
      }));
    }
    console.log('🎯 [Step2IndustrySize] Calling onContinue to advance to Step 3 (Facility Details)');
    onContinue();
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  // Industry insights map
  const industryInsightsMap: Record<string, string> = {
    retail: "Retail stores peak during business hours with HVAC and lighting. Energy storage can <strong>cut demand charges</strong> and provide backup power to keep registers running.",
    office: "Office buildings have predictable 9-5 load profiles. BESS can shift HVAC startup loads and <strong>reduce peak demand by 30-40%</strong>.",
    'shopping-center': "Shopping centers have high diversity factors. Aggregated load management creates significant <strong>demand charge reduction</strong> opportunities.",
    casino: "Casinos operate 24/7 with intensive HVAC and lighting. Battery storage provides both <strong>demand management</strong> and critical backup power.",
    hospital: "Healthcare facilities require uninterrupted power. BESS provides <strong>seamless backup</strong> while reducing demand charges during normal operation.",
    college: "Campus microgrids with BESS optimize across multiple buildings, enabling <strong>solar integration at scale</strong>.",
    government: "Public facilities often have favorable rate structures. Federal and state incentives can <strong>accelerate ROI significantly</strong>.",
    airport: "Airports have complex, 24/7 load profiles. BESS provides <strong>grid stability</strong> and backup for critical systems.",
    manufacturing: "Manufacturing loads are often predictable but high. Peak shaving can <strong>reduce demand charges by 40-60%</strong>.",
    warehouse: "Warehouses with logistics operations have variable loads. BESS can <strong>smooth demand spikes</strong> from equipment.",
    'data-center': "Data centers require five-nines uptime. BESS provides <strong>instant backup</strong> and can participate in grid services.",
    'cold-storage': "Cold storage can use thermal mass for load shifting. BESS <strong>extends this capability</strong> significantly.",
    residential: "Home storage pairs with solar for <strong>self-consumption</strong> and backup during outages.",
    apartment: "Multi-family storage serves common areas and provides <strong>tenant backup options</strong>.",
  };

  const defaultInsight = "Select an industry above and I'll show you <strong>typical energy profiles</strong> and <strong>savings opportunities</strong> for your business type.";
  const currentInsight = wizardState.selectedIndustry 
    ? (industryInsightsMap[wizardState.selectedIndustry] || config?.intro || defaultInsight)
    : defaultInsight;

  return (
    <>
      {/* Floating Navigation Arrows */}
      <FloatingNavigationArrows
        canGoBack={true}
        canGoForward={Boolean(canContinue)}
        onBack={onBack}
        onForward={handleContinue}
        backLabel="Back to Location & Goals"
        forwardLabel="Continue to Configuration"
      />

    <div 
      ref={sectionRef as React.LegacyRef<HTMLDivElement>}
        className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d] p-5"
    >
        <div className="max-w-[1000px] mx-auto">
          {/* Merlin Greeting - Consistent with Step 1 */}
          <MerlinGreeting
            stepNumber={2}
            totalSteps={5}
            stepTitle="Industry Selection"
            stepDescription="Tell me what type of facility you have and its size. Different industries have unique energy needs, so this helps me recommend the perfect solution."
            estimatedTime="2-3 min"
            actionInstructions={[
              'Select your industry type from the options below',
              'Use the size slider to specify your facility size',
              'The right arrow will light up when you\'re ready to continue'
            ]}
            nextStepPreview="Next, I'll ask about your specific facility details"
            isComplete={canContinue}
            onCompleteMessage={canContinue ? "Perfect! You've selected your industry. Use the right arrow to continue to facility details." : "Welcome to Step 2! Please select your industry type to get started. I'll show you industry-specific questions once you make your selection."}
          />
          {/* Guided Experience Hero Cards */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3.5 text-[12px] uppercase tracking-wider text-white/50">
              <Star className="w-3 h-3 text-[#FDE047]" />
              <span>Guided Experience — Custom Calculators</span>
          </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURED_VERTICALS.map((vertical) => (
              <button
                key={vertical.id}
                  onClick={() => handleFeaturedVerticalSelect(vertical.id, vertical.name)}
                  className="group relative rounded-[18px] overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] aspect-[4/3]"
              >
                  {/* Image Background */}
                  <img
                    src={vertical.image}
                    alt={vertical.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
                  
                  {/* Badge */}
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-2xl text-[10px] font-semibold ${
                    vertical.id === 'ev-charging' 
                      ? 'bg-[rgba(16,185,129,0.9)] text-white'
                      : 'bg-[rgba(139,92,246,0.9)] text-white'
                  }`}>
                    {vertical.stats}
                  </div>
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-[18px] font-bold text-white mb-1">{vertical.name}</h4>
                    <p className="text-[12px] text-white/80 mb-2.5">{vertical.description}</p>
                
                    {/* CTA Button */}
                    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white px-3.5 py-2 rounded-lg text-[12px] font-semibold group-hover:scale-[1.02] group-hover:shadow-[0_4px_16px_rgba(16,185,129,0.4)] transition-all">
                      Select Industry
                      <Check className="w-3 h-3" />
                    </div>
                </div>
              </button>
            ))}
          </div>
        </div>
          {/* Category Section - Light Panel */}
          <div className="bg-gradient-to-br from-[#E8FAF8] to-[#E0F4F1] rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-black/5 mb-6">
            {/* Category Tabs */}
            <div className="flex gap-0 mb-5 bg-black/6 rounded-xl p-1">
            {INDUSTRY_TABS.map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                    className={`flex-1 px-5 py-3 rounded-[10px] text-[14px] font-semibold transition-all flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]'
                        : 'bg-transparent text-[#64748b] hover:bg-white/50 hover:text-[#1e293b]'
                    }`}
                  >
                    {tab.name}
                    <span className={`px-2 py-0.5 rounded-[10px] text-[11px] ${
                      isActive ? 'bg-white/20' : 'bg-black/10'
                    }`}>
                      {tab.industries.length}
                    </span>
                </button>
              );
            })}
          </div>
          
            {/* Industry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {INDUSTRY_TABS.find(t => t.id === selectedTab)?.industries.map((industry) => {
                    const Icon = industry.icon;
                    const isSelected = wizardState.selectedIndustry === industry.id;
                    
                    return (
                  <button
                        key={industry.id}
                        onClick={() => handleIndustryClick(industry.id, industry.name)}
                    className={`bg-white border-2 rounded-[14px] p-4 cursor-pointer transition-all flex items-center gap-3 text-left hover:border-[#c7d2fe] hover:bg-[#faf5ff] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${
                      isSelected 
                        ? 'border-[#8B5CF6] bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] shadow-[0_0_0_2px_rgba(139,92,246,0.2)]'
                        : 'border-[#e2e8f0]'
                    }`}
                      >
                    {/* Icon */}
                    <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]'
                        : 'bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD]'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'stroke-white' : 'stroke-[#0284C7]'
                      }`} strokeWidth={1.5} />
                </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#1e293b] mb-0.5">{industry.name}</div>
                      <div className="text-[11px] text-[#64748b] truncate">
                        {industry.id === 'retail' && 'Stores, shopping centers'}
                        {industry.id === 'office' && 'Commercial offices'}
                        {industry.id === 'shopping-center' && 'Malls & plazas'}
                        {industry.id === 'casino' && 'Gaming facilities'}
                        {industry.id === 'hospital' && 'Medical facilities'}
                        {industry.id === 'college' && 'Educational campuses'}
                        {industry.id === 'government' && 'Public sector'}
                        {industry.id === 'airport' && 'Aviation facilities'}
                        {industry.id === 'manufacturing' && 'Production facilities'}
                        {industry.id === 'warehouse' && 'Distribution centers'}
                        {industry.id === 'data-center' && 'Critical IT infrastructure'}
                        {industry.id === 'cold-storage' && 'Refrigerated warehouses'}
                        {industry.id === 'residential' && 'Single-family homes'}
                        {industry.id === 'apartment' && 'Multi-unit residential'}
                      </div>
                    </div>

                    {/* Check */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected 
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]'
                        : 'border-[#d1d5db]'
                    }`}>
                      <Check className={`w-2.5 h-2.5 stroke-white stroke-[3] transition-all ${
                        isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`} />
                    </div>
                  </button>
              );
            })}
        </div>
        
            {/* Merlin Insight Bar */}
            <div className="mt-5 bg-gradient-to-r from-[rgba(99,102,241,0.1)] to-[rgba(139,92,246,0.08)] border border-[rgba(99,102,241,0.15)] rounded-[14px] px-4.5 py-3.5 flex items-center gap-3.5">
              <div className="w-11 h-[55px] flex-shrink-0">
                <img src={wizardIcon} alt="Merlin" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 text-[13px] text-[#475569] leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: currentInsight }} />
              </div>
            </div>
          </div>
          {/* Size Slider Section (shown after industry selection) */}
        {wizardState.selectedIndustry && config && (
          <div className="bg-gradient-to-br from-[#060F76]/90 via-[#1a237e]/80 to-[#060F76]/90 rounded-3xl p-6 border-2 border-[#4b59f5] shadow-xl mb-6">
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

              {/* Solar Input Section - Only show if not in questionnaire */}
              {!hasSolarQuestion && (
              <div className="bg-white/95 rounded-2xl p-5 mb-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Sun className="w-6 h-6 text-[#ffa600]" />
                    <label className="text-lg font-bold text-gray-800">
                      Do you have existing solar?
                    </label>
                  </div>
                  <button
                    onClick={() => {
                      // Import and show Solar Opportunity Modal
                      setShowSolarOpportunityModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Sun className="w-4 h-4" />
                    Explore Solar Opportunity
                  </button>
                </div>
                
                <div className="flex gap-3 mb-4">
            <button
              type="button"
                    onClick={() => {
                      setHasSolar(true);
                      if (!solarKW) setSolarKW(10);
                      setWizardState(prev => ({
                        ...prev,
                        hasExistingSolar: true,
                        existingSolarKW: solarKW || 10,
                      }));
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      hasSolar === true
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
            >
                    Yes
            </button>
              <button
                type="button"
                    onClick={() => {
                      setHasSolar(false);
                      setSolarKW(0);
                      setWizardState(prev => ({
                        ...prev,
                        hasExistingSolar: false,
                        existingSolarKW: 0,
                      }));
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      hasSolar === false
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    No
              </button>
                </div>

                {hasSolar === true && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      How much solar capacity do you have? (kW)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={1000}
                        step={1}
                        value={solarKW}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setSolarKW(value);
                          setWizardState(prev => ({
                            ...prev,
                            existingSolarKW: value,
                          }));
                        }}
                        className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#ffa600]"
                        style={{
                          background: `linear-gradient(to right, #ffa600 0%, #ffa600 ${(solarKW / 1000) * 100}%, #e5e7eb ${(solarKW / 1000) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="w-24 text-center">
                        <span className="text-2xl font-black text-[#ffa600]">
                          {solarKW}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">kW</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1 kW</span>
                      <span>1000 kW</span>
                    </div>
                  </div>
            )}
          </div>
              )}
          
              {/* EV Charger Input Section - Only show if not in questionnaire */}
              {!hasEVQuestion && (
              <div className="bg-white/95 rounded-2xl p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Plug className="w-6 h-6 text-emerald-500" />
                  <label className="text-lg font-bold text-gray-800">
                    Do you have existing EV chargers?
                  </label>
                </div>
                
                <div className="flex gap-3 mb-4">
          <button
                    type="button"
                    onClick={() => {
                      setHasEV(true);
                      if (evL1 === 0 && evL2 === 0 && evL3 === 0) setEvL2(2);
                      setWizardState(prev => ({
                        ...prev,
                        hasExistingEV: true,
                        existingEVL1: evL1,
                        existingEVL2: evL2 || 2,
                        existingEVL3: evL3,
                      }));
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      hasEV === true
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
                    Yes
          </button>
            <button
                    type="button"
                    onClick={() => {
                      setHasEV(false);
                      setEvL1(0);
                      setEvL2(0);
                      setEvL3(0);
                      setWizardState(prev => ({
                        ...prev,
                        hasExistingEV: false,
                        existingEVL1: 0,
                        existingEVL2: 0,
                        existingEVL3: 0,
                      }));
                    }}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                      hasEV === false
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    No
            </button>
                </div>

                {hasEV === true && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Level 1 Chargers (1.4 kW each) - Home/Workplace
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={1}
                          value={evL1}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setEvL1(value);
                            setWizardState(prev => ({
                              ...prev,
                              existingEVL1: value,
                            }));
                          }}
                          className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="w-20 text-center">
                          <span className="text-xl font-black text-emerald-600">
                            {evL1}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Level 2 Chargers (7-19 kW each) - Public/Commercial
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={evL2}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setEvL2(value);
                            setWizardState(prev => ({
                              ...prev,
                              existingEVL2: value,
                            }));
                          }}
                          className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="w-20 text-center">
                          <span className="text-xl font-black text-emerald-600">
                            {evL2}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Level 3 / DCFC Chargers (50-350 kW each) - Fast Charging
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={1}
                          value={evL3}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setEvL3(value);
                            setWizardState(prev => ({
                              ...prev,
                              existingEVL3: value,
                            }));
                          }}
                          className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="w-20 text-center">
                          <span className="text-xl font-black text-emerald-600">
                            {evL3}
                          </span>
                        </div>
                      </div>
                    </div>
          </div>
        )}
      </div>
              )}
    </div>
          )}
        </div>
      </div>
      
      {/* Floating Solar Button - Shows when solar opportunity exists */}
      <FloatingSolarButton
        wizardState={wizardState}
        onOpen={() => setShowSolarOpportunityModal(true)}
        position="left"
      />
      
      {/* Solar Opportunity Modal */}
      <SolarOpportunityModal
        show={showSolarOpportunityModal}
        onClose={() => setShowSolarOpportunityModal(false)}
        wizardState={wizardState}
        facilityType={wizardState.selectedIndustry || 'default'}
        facilityName={wizardState.industryName || 'facility'}
        currentSolarKW={solarKW || 0}
        onSave={(constraints) => {
          setWizardState(prev => ({
            ...prev,
            physicalConstraints: constraints,
          }));
        }}
      />
    </>
  );
}

export default Step2IndustrySize;
