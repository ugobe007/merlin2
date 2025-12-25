/**
 * HOTEL ENERGY PARTNERS - White Label Vertical
 * =============================================
 * 
 * Landing page for hotelenegypartners.com
 * Targeted at hotel owners looking to reduce energy costs and improve guest experience
 * 
 * Features:
 * - Simple calculator: # rooms, amenities, state → instant savings
 * - Lead capture form
 * - Merlin-branded but hospitality-focused messaging
 * 
 * Uses: calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 * 
 * REFACTORED Dec 2025: Now uses WizardV5 with initialUseCase='hotel'
 * instead of separate HotelWizard component (10K+ lines of duplicate code removed)
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, Zap, DollarSign, CheckCircle, ArrowRight, Phone, 
  Sun, TrendingDown, Shield, Sparkles, X, Battery, ChevronDown,
  Gauge, Building2, Wifi, Car, Coffee, Waves, Dumbbell,
  Users, Briefcase, Utensils, Shirt, TreePine, Flag, Droplets, Wand2,
  Leaf, Receipt
} from 'lucide-react';
import { QuoteEngine } from '@/core/calculations';
import type { QuoteResult } from '@/services/unifiedQuoteCalculator';
import { 
  calculateHotelPowerSimple, 
  HOTEL_CLASS_PROFILES_SIMPLE, 
  HOTEL_AMENITY_POWER_SIMPLE,
  type HotelClassSimple,
  type HotelAmenitySimple
} from '@/services/useCasePowerCalculations';
import { supabase } from '@/services/supabaseClient';
import merlinImage from '@/assets/images/new_profile_merlin.png';
import hotelImage from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import hotelImage2 from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import hotelImage3 from '@/assets/images/hotel_motel_holidayinn_2.jpg';
import hotelImage4 from '@/assets/images/hotel_motel_holidayinn_3.jpg';
import hotelImage5 from '@/assets/images/hotel_motel_holidayinn_4.jpg';
import evChargingHotelImage from '@/assets/images/ev_charging_hotel.jpg';
// V5 Wizard (Clean Build Dec 21, 2025)
import { WizardV5 } from '@/components/wizard/v5';
import { TrustBadgesInline, MethodologyStatement } from '@/components/shared/IndustryComplianceBadges';
import { TrueQuoteBadge } from '@/components/shared/TrueQuoteBadge';
import { TrueQuoteModal } from '@/components/shared/TrueQuoteModal';

// ============================================
// TYPES
// ============================================

// Hotel class categories as user specified
type HotelClassCategory = 'luxury' | 'economy' | 'commercial-chain' | 'brand-hotel' | 'boutique';

interface HotelInputs {
  // STEP 1: Building basics (first inputs)
  squareFootage: number;        // Total building square footage
  hotelClass: HotelClassCategory; // User-selected from dropdown
  numberOfRooms: number;
  
  // STEP 2: Parking
  parkingLotSize: number;       // Number of parking spaces
  hasParkingCanopy: boolean;    // Solar parking canopy checkbox
  
  // STEP 3: Amenities (CHECKBOXES - not buttons)
  hasConferenceCenter: boolean; // Conference center checkbox
  hasEventCenter: boolean;      // Event center checkbox
  hasRestaurant: boolean;       // Restaurant checkbox
  restaurantCount: number;      // If yes, how many restaurants
  hasKitchens: boolean;         // Commercial kitchens
  kitchenCount: number;         // Number of kitchens
  hasPool: boolean;             // Pool checkbox
  hasIndoorPool: boolean;       // Indoor pool option
  hasOutdoorPool: boolean;      // Outdoor pool option
  
  // STEP 4: Resort-only features (shown only for Luxury)
  hasClubhouse: boolean;        // Club house (luxury/resort only)
  hasGolfCourse: boolean;       // Golf course (luxury/resort only)
  golfCartCount: number;
  
  // STEP 5: Additional amenities
  hasSpa: boolean;
  hasFitnessCenter: boolean;
  hasEVCharging: boolean;
  evChargerCount: number;       // Level 2 chargers (11kW each)
  dcfcChargerCount: number;     // DC Fast Chargers (150kW each)
  hpcChargerCount: number;      // High Power Chargers (350kW each)
  hasLaundry: boolean;
  laundryMachineCount: number;
  laundryType: 'commercial' | 'regular';
  elevatorCount: number;
  
  // STEP 6: Energy Efficiency Ratings
  hvacRating: number;           // 1-10 scale (10 = newest/most efficient)
  lightingEfficiency: number;   // 1-5 scale (5 = all LED)
  isEnergyEfficient: boolean;   // Energy Star or equivalent certification
  
  // STEP 7: Storage preferences (slider before recommendation)
  storageHours: number;         // 2, 4, 6, or 8 hours
  
  // Location & billing
  state: string;
  currentMonthlyBill: number;
}

// Helper: Map user-facing hotel class to SSOT class for calculations
function mapToSSOTClass(hotelClass: HotelClassCategory): HotelClassSimple {
  switch (hotelClass) {
    case 'luxury': return 'luxury';
    case 'economy': return 'economy';
    case 'commercial-chain': return 'midscale';
    case 'brand-hotel': return 'upscale';
    case 'boutique': return 'midscale';
    default: return 'midscale';
  }
}

// Helper: Estimate monthly utility bill from square footage
function estimateMonthlyBill(sqft: number, hotelClass: HotelClassCategory): number {
  // Industry average: $0.80-1.50 per sq ft per month for hotels
  const ratePerSqFt: Record<HotelClassCategory, number> = {
    'economy': 0.80,
    'boutique': 0.90,
    'commercial-chain': 1.00,
    'brand-hotel': 1.25,
    'luxury': 1.50,
  };
  return Math.round(sqft * ratePerSqFt[hotelClass]);
}

interface LeadInfo {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  notes: string;
}

// ============================================
// CONSTANTS (UI display only - calculations use SSOT)
// ============================================

// Hotel class descriptions for UI dropdown
const HOTEL_CLASS_OPTIONS: { value: HotelClassCategory; label: string; description: string }[] = [
  { value: 'luxury', label: 'Luxury / Resort', description: 'Premium amenities, spa, golf' },
  { value: 'economy', label: 'Economy / Budget', description: 'Basic amenities, limited service' },
  { value: 'commercial-chain', label: 'Commercial Chain', description: 'Standard chain hotels (Holiday Inn, etc.)' },
  { value: 'brand-hotel', label: 'Brand Hotel (Marriott, Hilton)', description: 'Full-service branded properties' },
  { value: 'boutique', label: 'Small / Boutique Hotel', description: 'Unique, independent properties' },
];

// Similar hotel configurations for display
const SIMILAR_HOTEL_CONFIGS = [
  { name: 'Marriott Lancaster', rooms: 133, peakKW: 384, bessKW: 192, durationHrs: 4, savingsPerYear: 52000, class: 'brand-hotel' as HotelClassCategory },
  { name: 'Hilton Hawaii Resort', rooms: 800, peakKW: 3700, bessKW: 1850, durationHrs: 4, savingsPerYear: 180000, class: 'luxury' as HotelClassCategory },
  { name: 'Holiday Inn Express', rooms: 120, peakKW: 320, bessKW: 160, durationHrs: 4, savingsPerYear: 38000, class: 'commercial-chain' as HotelClassCategory },
  { name: 'Boutique Inn Portland', rooms: 45, peakKW: 135, bessKW: 68, durationHrs: 4, savingsPerYear: 18000, class: 'boutique' as HotelClassCategory },
  { name: 'Budget Lodge Texas', rooms: 60, peakKW: 150, bessKW: 75, durationHrs: 2, savingsPerYear: 14000, class: 'economy' as HotelClassCategory },
];

// Amenity names for UI display (values from SSOT)
const AMENITY_DISPLAY = {
  pool: { name: 'Pool & Hot Tub' },
  restaurant: { name: 'Restaurant/Kitchen' },
  spa: { name: 'Spa/Sauna' },
  fitness: { name: 'Fitness Center' },
  evCharging: { name: 'EV Charging (8 L2)' },
};

// State electricity rates (for UI and calculation)
// Updated Dec 2025: Added all 50 states with regional rates
const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'Alabama': { rate: 0.13, demandCharge: 12 },
  'Alaska': { rate: 0.22, demandCharge: 16 },
  'Arizona': { rate: 0.12, demandCharge: 16 },
  'Arkansas': { rate: 0.10, demandCharge: 11 },
  'California': { rate: 0.20, demandCharge: 22 },
  'Colorado': { rate: 0.11, demandCharge: 13 },
  'Connecticut': { rate: 0.21, demandCharge: 19 },
  'Delaware': { rate: 0.12, demandCharge: 14 },
  'Florida': { rate: 0.13, demandCharge: 14 },
  'Georgia': { rate: 0.12, demandCharge: 13 },
  'Hawaii': { rate: 0.35, demandCharge: 30 },
  'Idaho': { rate: 0.10, demandCharge: 10 },
  'Illinois': { rate: 0.13, demandCharge: 14 },
  'Indiana': { rate: 0.12, demandCharge: 12 },
  'Iowa': { rate: 0.11, demandCharge: 11 },
  'Kansas': { rate: 0.12, demandCharge: 12 },
  'Kentucky': { rate: 0.10, demandCharge: 10 },
  'Louisiana': { rate: 0.10, demandCharge: 11 },
  'Maine': { rate: 0.17, demandCharge: 16 },
  'Maryland': { rate: 0.14, demandCharge: 15 },
  'Massachusetts': { rate: 0.22, demandCharge: 18 },
  'Michigan': { rate: 0.16, demandCharge: 15 },
  'Minnesota': { rate: 0.12, demandCharge: 13 },
  'Mississippi': { rate: 0.11, demandCharge: 11 },
  'Missouri': { rate: 0.11, demandCharge: 11 },
  'Montana': { rate: 0.11, demandCharge: 11 },
  'Nebraska': { rate: 0.10, demandCharge: 10 },
  'Nevada': { rate: 0.12, demandCharge: 15 },
  'New Hampshire': { rate: 0.19, demandCharge: 17 },
  'New Jersey': { rate: 0.16, demandCharge: 16 },
  'New Mexico': { rate: 0.12, demandCharge: 12 },
  'New York': { rate: 0.18, demandCharge: 20 },
  'North Carolina': { rate: 0.11, demandCharge: 12 },
  'North Dakota': { rate: 0.10, demandCharge: 10 },
  'Ohio': { rate: 0.12, demandCharge: 13 },
  'Oklahoma': { rate: 0.10, demandCharge: 10 },
  'Oregon': { rate: 0.11, demandCharge: 12 },
  'Pennsylvania': { rate: 0.14, demandCharge: 14 },
  'Rhode Island': { rate: 0.20, demandCharge: 18 },
  'South Carolina': { rate: 0.12, demandCharge: 12 },
  'South Dakota': { rate: 0.11, demandCharge: 11 },
  'Tennessee': { rate: 0.11, demandCharge: 11 },
  'Texas': { rate: 0.11, demandCharge: 12 },
  'Utah': { rate: 0.10, demandCharge: 11 },
  'Vermont': { rate: 0.18, demandCharge: 16 },
  'Virginia': { rate: 0.12, demandCharge: 13 },
  'Washington': { rate: 0.10, demandCharge: 10 },
  'West Virginia': { rate: 0.11, demandCharge: 11 },
  'Wisconsin': { rate: 0.13, demandCharge: 13 },
  'Wyoming': { rate: 0.10, demandCharge: 10 },
};

// ============================================
// IMAGE CAROUSEL COMPONENT
// ============================================

const CAROUSEL_IMAGES = [
  { src: hotelImage, alt: 'Luxury Hotel & Resort', caption: 'Premium Hospitality', subcaption: 'Save $47K+/year', savings: 47000, payback: 4.2 },
  { src: hotelImage2, alt: 'Boutique Hotel', caption: 'Mid-Scale Hotels', subcaption: 'Save $28K+/year', savings: 28000, payback: 3.8 },
  { src: hotelImage3, alt: 'Business Hotel', caption: 'Conference Centers', subcaption: 'Save $62K+/year', savings: 62000, payback: 4.5 },
  { src: hotelImage4, alt: 'Resort & Spa', caption: 'Resort Properties', subcaption: 'Save $85K+/year', savings: 85000, payback: 5.2 },
  { src: hotelImage5, alt: 'Extended Stay', caption: 'Long-Term Stays', subcaption: 'Save $35K+/year', savings: 35000, payback: 3.5 },
  { src: evChargingHotelImage, alt: 'Hotel EV Charging', caption: 'Guest Amenities', subcaption: 'EV attracts guests', savings: 52000, payback: 4.0 },
];

// ============================================
// CASE STUDY DATA (for Success Stories modal)
// ============================================

interface CaseStudyMetrics {
  roomCount: number;
  batteryKW: number;
  batteryKWh: number;
  solarKW: number;
  peakDemandReduction: string;
  demandChargeSavings: number;
  energyArbitrageSavings: number;
  incentivesReceived: number;
  totalProjectCost: number;
  netCost: number;
  roi25Year: string;
  co2ReductionTons: number;
}

interface CaseStudy {
  id: string;
  category: string;
  title: string;
  image: string;
  annualSavings: number;
  paybackYears: number;
  metrics: CaseStudyMetrics;
}

const HOTEL_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'luxury-resort',
    category: 'Premium Hospitality',
    title: 'Luxury Hotel & Resort',
    image: hotelImage,
    annualSavings: 47000,
    paybackYears: 4.2,
    metrics: {
      roomCount: 250,
      batteryKW: 400,
      batteryKWh: 1600,
      solarKW: 300,
      peakDemandReduction: '35%',
      demandChargeSavings: 28000,
      energyArbitrageSavings: 12000,
      incentivesReceived: 85000,
      totalProjectCost: 420000,
      netCost: 335000,
      roi25Year: '625%',
      co2ReductionTons: 180,
    }
  },
  {
    id: 'boutique',
    category: 'Mid-Scale Hotels',
    title: 'Boutique Hotel',
    image: hotelImage2,
    annualSavings: 28000,
    paybackYears: 3.8,
    metrics: {
      roomCount: 75,
      batteryKW: 150,
      batteryKWh: 600,
      solarKW: 100,
      peakDemandReduction: '40%',
      demandChargeSavings: 16000,
      energyArbitrageSavings: 8000,
      incentivesReceived: 45000,
      totalProjectCost: 180000,
      netCost: 135000,
      roi25Year: '720%',
      co2ReductionTons: 85,
    }
  },
  {
    id: 'business',
    category: 'Conference Centers',
    title: 'Business Hotel',
    image: hotelImage3,
    annualSavings: 62000,
    paybackYears: 4.5,
    metrics: {
      roomCount: 300,
      batteryKW: 500,
      batteryKWh: 2000,
      solarKW: 400,
      peakDemandReduction: '32%',
      demandChargeSavings: 38000,
      energyArbitrageSavings: 15000,
      incentivesReceived: 120000,
      totalProjectCost: 580000,
      netCost: 460000,
      roi25Year: '580%',
      co2ReductionTons: 240,
    }
  },
  {
    id: 'resort-spa',
    category: 'Resort Properties',
    title: 'Resort & Spa',
    image: hotelImage4,
    annualSavings: 85000,
    paybackYears: 5.2,
    metrics: {
      roomCount: 400,
      batteryKW: 650,
      batteryKWh: 2600,
      solarKW: 550,
      peakDemandReduction: '30%',
      demandChargeSavings: 52000,
      energyArbitrageSavings: 22000,
      incentivesReceived: 175000,
      totalProjectCost: 850000,
      netCost: 675000,
      roi25Year: '550%',
      co2ReductionTons: 320,
    }
  },
  {
    id: 'extended-stay',
    category: 'Long-Term Stays',
    title: 'Extended Stay Hotel',
    image: hotelImage5,
    annualSavings: 35000,
    paybackYears: 3.5,
    metrics: {
      roomCount: 120,
      batteryKW: 200,
      batteryKWh: 800,
      solarKW: 175,
      peakDemandReduction: '38%',
      demandChargeSavings: 22000,
      energyArbitrageSavings: 9000,
      incentivesReceived: 55000,
      totalProjectCost: 220000,
      netCost: 165000,
      roi25Year: '680%',
      co2ReductionTons: 110,
    }
  },
  {
    id: 'ev-amenity',
    category: 'Guest Amenities',
    title: 'Hotel with EV Charging',
    image: evChargingHotelImage,
    annualSavings: 52000,
    paybackYears: 4.0,
    metrics: {
      roomCount: 180,
      batteryKW: 350,
      batteryKWh: 1400,
      solarKW: 250,
      peakDemandReduction: '42%',
      demandChargeSavings: 32000,
      energyArbitrageSavings: 14000,
      incentivesReceived: 95000,
      totalProjectCost: 380000,
      netCost: 285000,
      roi25Year: '650%',
      co2ReductionTons: 165,
    }
  },
];

function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotate every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  
  const currentImage = CAROUSEL_IMAGES[currentIndex];
  
  return (
    <div className="relative w-full max-w-xl mx-auto mb-6">
      {/* Main Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/30 border border-indigo-400/20">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent z-10" />
        <img 
          src={currentImage.src} 
          alt={currentImage.alt} 
          className="w-full h-80 object-cover transition-opacity duration-500"
        />
        {/* Overlay badge */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
            <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
            <div className="flex-1">
              <p className="text-white font-bold">Powered by Merlin</p>
              <p className="text-indigo-300 text-sm">AI-Optimized Battery Storage</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{currentImage.caption}</p>
              <p className="text-indigo-300 text-xs">{currentImage.subcaption}</p>
            </div>
          </div>
        </div>
        {/* Energy cost callout */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-pink-500/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs font-bold text-pink-100">ENERGY COSTS</p>
            <p className="text-lg font-black text-white">6-8% Revenue</p>
          </div>
        </div>
      </div>
      
      {/* Carousel Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {CAROUSEL_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-indigo-400 w-8' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// CALCULATOR LOGIC (uses SSOT from useCasePowerCalculations)
// Dec 2025: Expanded amenities support
// ============================================

function calculateHotelPower(inputs: HotelInputs): { peakKW: number; dailyKWh: number; demandChargeImpact: number } {
  const { numberOfRooms, hotelClass, state } = inputs;
  
  // Map local amenity booleans to SSOT amenity keys
  const amenities: HotelAmenitySimple[] = [];
  if (inputs.hasPool || inputs.hasIndoorPool || inputs.hasOutdoorPool) amenities.push('pool');
  if (inputs.hasRestaurant) amenities.push('restaurant');
  if (inputs.hasSpa) amenities.push('spa');
  if (inputs.hasFitnessCenter) amenities.push('fitness');
  if (inputs.hasEVCharging) amenities.push('evCharging');
  
  const stateData = STATE_RATES[state] || STATE_RATES['Other'];
  
  // Map user-facing class to SSOT class
  const ssotClass = mapToSSOTClass(hotelClass);
  
  // Call SSOT calculator
  const result = calculateHotelPowerSimple({
    rooms: numberOfRooms,
    hotelClass: ssotClass,
    amenities,
    electricityRate: stateData.rate,
  });
  
  // Add power for expanded amenities not in SSOT
  let additionalPowerKW = 0;
  
  // Multiple restaurants (each adds ~50kW)
  if (inputs.restaurantCount > 1) {
    additionalPowerKW += (inputs.restaurantCount - 1) * 50;
  }
  
  // Conference center (100kW base)
  if (inputs.hasConferenceCenter) {
    additionalPowerKW += 100;
  }
  
  // Event center (150kW base)
  if (inputs.hasEventCenter) {
    additionalPowerKW += 150;
  }
  
  // Laundry (5kW per machine)
  if (inputs.hasLaundry && inputs.laundryMachineCount > 0) {
    additionalPowerKW += inputs.laundryMachineCount * 5;
  }
  
  // Additional EV chargers beyond base (11kW per L2)
  if (inputs.evChargerCount > 8) {
    additionalPowerKW += (inputs.evChargerCount - 8) * 11;
  }
  
  // Resort features
  if (inputs.hasClubhouse) additionalPowerKW += 75;
  if (inputs.hasGolfCourse) additionalPowerKW += 50;
  if (inputs.golfCartCount > 0) additionalPowerKW += inputs.golfCartCount * 2;
  
  const totalPeakKW = result.peakKW + additionalPowerKW;
  
  // Calculate dailyKWh based on total peak with 40% capacity factor
  const dailyKWh = Math.round(totalPeakKW * 24 * 0.4);
  
  // Demand charge impact using state-specific rates
  const demandChargeImpact = totalPeakKW * stateData.demandCharge;
  
  return { 
    peakKW: totalPeakKW, 
    dailyKWh, 
    demandChargeImpact: Math.round(demandChargeImpact) 
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HotelEnergy() {
  // Redirect to wizard with hotel pre-selected
  useEffect(() => {
    window.location.href = '/wizard?industry=hotel';
  }, []);
  // Calculator inputs - restructured per user requirements (Dec 2025)
  const [inputs, setInputs] = useState<HotelInputs>({
    // STEP 1: Building basics
    squareFootage: 75000,
    hotelClass: 'commercial-chain', // User selects from dropdown
    numberOfRooms: 150,
    
    // STEP 2: Parking
    parkingLotSize: 100,
    hasParkingCanopy: false,
    
    // STEP 3: Amenities (checkboxes)
    hasConferenceCenter: false,
    hasEventCenter: false,
    hasRestaurant: true,
    restaurantCount: 1,
    hasKitchens: false,
    kitchenCount: 0,
    hasPool: true,
    hasIndoorPool: false,
    hasOutdoorPool: true,
    
    // STEP 4: Resort-only features
    hasClubhouse: false,
    hasGolfCourse: false,
    golfCartCount: 0,
    
    // STEP 5: Additional amenities
    hasSpa: false,
    hasFitnessCenter: false,
    hasEVCharging: false,
    evChargerCount: 0,  // Default to 0, user must select
    dcfcChargerCount: 0,
    hpcChargerCount: 0,
    hasLaundry: false,
    laundryMachineCount: 6,
    laundryType: 'commercial',
    elevatorCount: 2,
    
    // STEP 6: Energy Efficiency Ratings
    hvacRating: 5,           // Default to mid-range
    lightingEfficiency: 3,   // Default to mixed
    isEnergyEfficient: false,
    
    // STEP 7: Storage preferences
    storageHours: 4,
    
    // Location & billing
    state: 'Florida',
    currentMonthlyBill: 25000,
  });
  
  // Auto-estimate utility bill from square footage if user hasn't manually set it
  const [userSetBill, setUserSetBill] = useState(false);
  useEffect(() => {
    if (!userSetBill && inputs.squareFootage > 0) {
      const estimated = estimateMonthlyBill(inputs.squareFootage, inputs.hotelClass);
      setInputs(prev => ({ ...prev, currentMonthlyBill: estimated }));
    }
  }, [inputs.squareFootage, inputs.hotelClass, userSetBill]);
  
  // Hotel class is determined by SSOT (useCasePowerCalculations.calculateHotelPowerSimple)
  // Thresholds: ≤75=economy, ≤200=midscale, ≤400=upscale, >400=luxury
  
  // Quote result
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Hero carousel state (shared between mobile and desktop views)
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  
  // Auto-rotate hero images
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);
  
  // Lead capture
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  // Wizard mode
  const [showWizard, setShowWizard] = useState(false);
  
  // Case Study Modal (Success Stories)
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  
  // TrueQuote Modal
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);
  
  // How Merlin Works Modal
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  // State for solar (moved before useMemo that uses it)
  const [hasSolar, setHasSolar] = useState(false);
  const [solarKW, setSolarKW] = useState(100);
  
  // Hero inline estimate - calculated from ALL inputs (Dec 2025 - comprehensive calculation)
  const heroEstimate = React.useMemo(() => {
    // Get state-specific rates for demand charge savings
    const stateData = STATE_RATES[inputs.state] || STATE_RATES['Other'];
    const stateMultiplier = stateData.rate / 0.12; // Normalize to Florida baseline
    
    // Derive hotel class from room count (same logic as UI display)
    const derivedClass: 'luxury' | 'upscale' | 'midscale' | 'economy' = 
      inputs.numberOfRooms > 400 ? 'luxury' :
      inputs.numberOfRooms > 200 ? 'upscale' :
      inputs.numberOfRooms > 75 ? 'midscale' : 'economy';
    
    // Base savings per room based on derived class
    const savingsPerRoom: Record<string, number> = {
      'luxury': 450,
      'upscale': 400,
      'midscale': 350,
      'economy': 250,
    };
    let baseSavings = (savingsPerRoom[derivedClass] || 350) * inputs.numberOfRooms;
    
    // Add square footage factor (~$0.15-0.25/sqft annual savings from peak shaving)
    const sqftFactor = derivedClass === 'luxury' ? 0.25 : derivedClass === 'upscale' ? 0.20 : 0.15;
    baseSavings += inputs.squareFootage * sqftFactor;
    
    // Add amenity savings (high-draw equipment benefits most from peak shaving)
    // Pool savings - indoor pools use more energy (heating), both = bonus
    if (inputs.hasIndoorPool && inputs.hasOutdoorPool) {
      baseSavings += 5500; // Both pools = more savings
    } else if (inputs.hasIndoorPool) {
      baseSavings += 4500; // Indoor pool = higher energy (heating)
    } else if (inputs.hasOutdoorPool || inputs.hasPool) {
      baseSavings += 3500; // Outdoor pool = pumps, filtration
    }
    
    if (inputs.hasRestaurant) baseSavings += 4500 + (inputs.restaurantCount - 1) * 2500; // Kitchen equipment, refrigeration
    if (inputs.hasKitchens) baseSavings += inputs.kitchenCount * 3000; // Commercial kitchens
    if (inputs.hasSpa) baseSavings += 3000; // HVAC, hot tubs
    if (inputs.hasFitnessCenter) baseSavings += 1500; // Gym equipment, HVAC
    if (inputs.hasConferenceCenter) baseSavings += 2500; // A/V equipment, HVAC
    if (inputs.hasLaundry) baseSavings += 2500; // Industrial washers/dryers
    
    // EV charger savings - based on actual charger count and type (all types)
    if (inputs.hasEVCharging) {
      const totalChargers = inputs.evChargerCount + inputs.dcfcChargerCount + inputs.hpcChargerCount;
      if (totalChargers > 0) {
        // L2 chargers (11kW each), DCFC (150kW each), HPC (350kW each)
        const l2Power = inputs.evChargerCount * 11;
        const dcfcPower = inputs.dcfcChargerCount * 150;
        const hpcPower = inputs.hpcChargerCount * 350;
        const totalEVPower = l2Power + dcfcPower + hpcPower;
        // Demand charge savings: 40% peak reduction * demand charge * 12 months
        const evDemandSavings = totalEVPower * stateData.demandCharge * 0.4 * 12;
        baseSavings += Math.round(evDemandSavings);
      }
    }
    
    // Add elevator savings (each elevator ~$800/yr in demand charge savings)
    baseSavings += inputs.elevatorCount * 800;
    
    // Adjust for backup hours (longer backup = larger system = more peak shaving capacity)
    const backupMultiplier = inputs.storageHours >= 6 ? 1.15 : inputs.storageHours >= 4 ? 1.0 : 0.9;
    baseSavings *= backupMultiplier;
    
    // Adjust for energy efficiency (Dec 2025 - HVAC/Lighting/Certification)
    // Less efficient buildings have higher baseline load = more savings opportunity
    const hvacMultiplier = 1 + (10 - inputs.hvacRating) * 0.03; // Older HVAC = 3% more savings per point
    const lightingMultiplier = 1 + (5 - inputs.lightingEfficiency) * 0.02; // Older lighting = 2% more per point
    const certificationMultiplier = inputs.isEnergyEfficient ? 0.85 : 1.0; // Certified = 15% lower baseline
    baseSavings *= hvacMultiplier * lightingMultiplier * certificationMultiplier;
    
    // Apply state multiplier (higher electricity rates = more savings)
    baseSavings *= stateMultiplier;
    
    // Adjust for laundry type (commercial = higher power = more savings)
    if (inputs.hasLaundry && inputs.laundryType === 'commercial') {
      baseSavings += inputs.laundryMachineCount * 200; // Commercial machines add more savings
    }
    
    // Add solar savings if user selected solar (Dec 2025)
    // Solar typically offsets 20-30% of hotel electricity usage
    // At 4 sun-hours/day average: solarKW * 4h * 365 * rate * 0.25 (net metering factor)
    if (hasSolar && solarKW > 0) {
      const solarAnnualKWh = solarKW * 4 * 365; // ~1,460 kWh per kW installed
      const solarSavings = solarAnnualKWh * stateData.rate * 0.25; // Net metering typically 25% effective
      baseSavings += Math.round(solarSavings);
    }
    
    const savings = Math.round(baseSavings);
    
    // Payback affected by system size and class
    let payback = derivedClass === 'luxury' ? 3.5 : derivedClass === 'upscale' ? 4.0 : derivedClass === 'midscale' ? 4.5 : 5.0;
    // Larger systems have slightly better payback (economies of scale)
    if (savings > 80000) payback -= 0.3;
    else if (savings > 50000) payback -= 0.2;
    
    return { savings, payback: Math.round(payback * 10) / 10, hotelClass: derivedClass };
  }, [inputs.numberOfRooms, inputs.squareFootage, inputs.hasPool, inputs.hasIndoorPool, inputs.hasOutdoorPool, inputs.hasRestaurant, inputs.restaurantCount, inputs.hasKitchens, inputs.kitchenCount, inputs.hasSpa, inputs.hasFitnessCenter, inputs.hasConferenceCenter, inputs.hasLaundry, inputs.hasEVCharging, inputs.evChargerCount, inputs.dcfcChargerCount, inputs.hpcChargerCount, inputs.elevatorCount, inputs.storageHours, inputs.hvacRating, inputs.lightingEfficiency, inputs.isEnergyEfficient, inputs.laundryType, inputs.laundryMachineCount, inputs.state, hasSolar, solarKW]);
  
  // Calculate quote when inputs change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCalculate();
    }, 500);
    return () => clearTimeout(timer);
  }, [inputs]);
  
  const handleCalculate = async () => {
    setIsCalculating(true);
    
    try {
      const { peakKW, dailyKWh } = calculateHotelPower(inputs);
      const stateData = STATE_RATES[inputs.state] || STATE_RATES['Other'];
      
      // Size battery: 0.50 ratio (arbitrage - balanced cost savings + backup capability)
      const bessRatio = 0.50;
      const storageSizeMW = (peakKW * bessRatio) / 1000;
      const durationHours = inputs.storageHours; // User-selected storage hours
      
      const result = await QuoteEngine.generateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: inputs.state,
        electricityRate: stateData.rate,
        useCase: 'hotel',
      });
      
      setQuoteResult(result);
      setHasCalculated(true);
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await supabase.from('leads').insert([{
        name: leadInfo.ownerName,
        email: leadInfo.email,
        company: leadInfo.businessName,
        phone: leadInfo.phone,
        source: 'hotel_vertical',
        format: 'consultation',
      }]);
      setLeadSubmitted(true);
    } catch (error) {
      console.error('Lead submission error:', error);
      setLeadSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const { peakKW, demandChargeImpact } = calculateHotelPower(inputs);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900">
      {/* ═══════════════════════════════════════════════════════════════════════
          FLOATING MERLIN BUTTON (replaces header)
          ═══════════════════════════════════════════════════════════════════════ */}
      <a 
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl hover:bg-slate-800/95 px-4 py-3 rounded-2xl border-2 border-purple-500/50 hover:border-purple-400 transition-all hover:scale-105 shadow-2xl shadow-purple-500/30 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform text-purple-300">←</span>
        <img src={merlinImage} alt="Merlin" className="w-8 h-8" />
        <span className="text-white font-bold text-sm">Back to Merlin</span>
      </a>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION - Redesigned Dec 2025
          Calculator-first hero with "Save up to 50%" headline above panels
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] overflow-hidden pt-4">
        {/* Rotating Background Images */}
        {CAROUSEL_IMAGES.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === heroImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.src}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-indigo-900/50 to-slate-900/60" />
          </div>
        ))}
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iIzgxODJmNCIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30 z-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-12">
          {/* Hero Headline - Above Calculator Panels */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-3">
              Save up to{' '}
              <span className="text-6xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                50%
              </span>
              <br />
              <span className="text-4xl md:text-5xl lg:text-6xl text-gray-300">
                on Hotel energy costs
              </span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto mb-6">
              Enter your hotel details and see instant savings estimates
            </p>
            
            {/* How Merlin Works button - Opens Popup */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setShowHowItWorks(true)}
                className="group relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-600 text-white font-black text-xl rounded-2xl border-2 border-purple-400/50 transition-all hover:scale-110 shadow-2xl shadow-purple-900/70 hover:shadow-purple-700/60"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 blur-xl opacity-40 group-hover:opacity-70 transition-opacity -z-10" />
                <img src={merlinImage} alt="" className="w-10 h-10 drop-shadow-lg" />
                <span className="drop-shadow-lg">🪄 How Merlin Works</span>
                <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
              </button>
            </div>
          </div>
          
          {/* Two-Panel Calculator Layout - LARGER & BALANCED */}
          <div id="hero-panel" className="grid lg:grid-cols-2 gap-5 items-stretch">
            
            {/* LEFT PANEL: Hotel Details - MERLIN THEMED */}
            <div className="bg-gradient-to-br from-slate-800/60 via-[#060F76]/30 to-slate-800/60 backdrop-blur-md rounded-3xl p-6 border-2 border-[#68BFFA]/40 shadow-2xl shadow-[#6700b6]/20">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6700b6] to-[#4b00a0] flex items-center justify-center shadow-lg shadow-[#6700b6]/40 border-2 border-[#ffa600]/50">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#68BFFA]">Your Hotel Details</h3>
              </div>

              {/* Location - Full Width */}
              <div className="mb-4">
                <label className="text-gray-300 text-sm font-semibold mb-1.5 block">📍 Location</label>
                <select
                  value={inputs.state}
                  onChange={(e) => setInputs({ ...inputs, state: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/80 border-2 border-slate-500/50 rounded-xl text-white text-base font-semibold focus:border-[#ffa600] transition-colors"
                >
                  {Object.keys(STATE_RATES).map((state) => (
                    <option key={state} value={state} className="bg-slate-800">{state}</option>
                  ))}
                </select>
                <p className="text-sm text-[#ffa600] mt-1.5 font-medium">
                  ${(STATE_RATES[inputs.state]?.rate || 0.12).toFixed(2)}/kWh • ${STATE_RATES[inputs.state]?.demandCharge || 12}/kW demand
                </p>
              </div>

              {/* Rooms & Square Feet - TWO COLUMNS */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-1.5 block">🛏️ Guest Rooms</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.numberOfRooms || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 3); // Max 3 digits (999)
                      setInputs({ ...inputs, numberOfRooms: parseInt(val) || 0 });
                    }}
                    className="w-full px-4 py-3 bg-slate-700/80 border-2 border-slate-500/50 rounded-xl text-white text-lg font-bold focus:border-[#ffa600] transition-colors"
                    placeholder="150"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-1.5 block">📐 Sq Footage</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputs.squareFootage ? inputs.squareFootage.toLocaleString() : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 7); // Max 7 digits
                      setUserSetBill(false);
                      setInputs({ ...inputs, squareFootage: parseInt(val) || 0 });
                    }}
                    className="w-full px-4 py-3 bg-slate-700/80 border-2 border-slate-500/50 rounded-xl text-white text-lg font-bold focus:border-[#ffa600] transition-colors"
                    placeholder="75,000"
                  />
                </div>
              </div>

              {/* Auto Class Badge */}
              <div className={`text-center py-2 px-4 rounded-xl mb-4 text-sm font-black ${
                inputs.numberOfRooms > 400 ? 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-2 border-amber-400/50 shadow-lg shadow-amber-500/20' :
                inputs.numberOfRooms > 200 ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20' :
                inputs.numberOfRooms > 75 ? 'bg-gradient-to-r from-indigo-500/30 to-blue-500/30 text-indigo-300 border-2 border-indigo-400/50 shadow-lg shadow-indigo-500/20' :
                'bg-slate-600/50 text-slate-300 border-2 border-slate-500/50'
              }`}>
                {inputs.numberOfRooms > 400 ? '✨ Luxury Class Hotel' :
                 inputs.numberOfRooms > 200 ? '⭐ Upscale Class Hotel' :
                 inputs.numberOfRooms > 75 ? '🏨 Midscale Class Hotel' :
                 '🏨 Budget Class Hotel'}
              </div>

              {/* Divider */}
              <div className="border-t-2 border-white/10 my-4"></div>

              {/* Amenities with Dropdowns - Pool, Restaurant, EV */}
              <p className="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Amenities
              </p>

              {/* Pool & Restaurants & Kitchens - THREE COLUMNS */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1 block">🏊 Pool</label>
                  <select
                    value={inputs.hasIndoorPool && inputs.hasOutdoorPool ? 'both' : inputs.hasIndoorPool ? 'indoor' : inputs.hasOutdoorPool ? 'outdoor' : 'none'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setInputs({ 
                        ...inputs, 
                        hasPool: val !== 'none',
                        hasIndoorPool: val === 'indoor' || val === 'both',
                        hasOutdoorPool: val === 'outdoor' || val === 'both'
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-700/80 border-2 border-slate-500/50 rounded-lg text-white text-sm font-semibold focus:border-[#ffa600]"
                  >
                    <option value="none">None</option>
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1 block">🍽️ Restaurants</label>
                  <select
                    value={inputs.restaurantCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value);
                      setInputs({ ...inputs, restaurantCount: count, hasRestaurant: count > 0 });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-700/80 border-2 border-slate-500/50 rounded-lg text-white text-sm font-semibold focus:border-[#ffa600]"
                  >
                    <option value={0}>None</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3+</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1 block">🍳 Kitchens</label>
                  <select
                    value={inputs.kitchenCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value);
                      setInputs({ ...inputs, kitchenCount: count, hasKitchens: count > 0 });
                    }}
                    className="w-full px-3 py-2.5 bg-slate-700/80 border-2 border-slate-500/50 rounded-lg text-white text-sm font-semibold focus:border-[#ffa600]"
                  >
                    <option value={0}>None</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3+</option>
                  </select>
                </div>
              </div>

              {/* EV Chargers - Input Fields */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-semibold flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#ffa600]" /> EV Chargers
                  </label>
                  <button
                    onClick={() => {
                      if (inputs.hasEVCharging) {
                        // Turning off - reset all charger counts
                        setInputs({ ...inputs, hasEVCharging: false, evChargerCount: 0, dcfcChargerCount: 0, hpcChargerCount: 0 });
                      } else {
                        // Turning on - don't set any defaults, user must choose
                        setInputs({ ...inputs, hasEVCharging: true });
                      }
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-black transition-all ${
                      inputs.hasEVCharging 
                        ? 'bg-[#ffa600] text-[#060F76] shadow-lg shadow-[#ffa600]/40' 
                        : 'bg-gradient-to-r from-[#ffa600] to-[#ff8c00] text-[#060F76] border-2 border-[#FED19F] hover:from-[#ffb833] hover:to-[#ffa600] shadow-lg shadow-[#ffa600]/30 animate-pulse'
                    }`}
                    style={{ animationDuration: '2s' }}
                  >
                    {inputs.hasEVCharging ? '✓ EV Enabled' : '⚡ + Add EV'}
                  </button>
                </div>
                {inputs.hasEVCharging && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-700/40 p-3 rounded-xl border border-[#ffa600]/40">
                    <div>
                      <label className="text-gray-400 text-[10px] mb-1 block">Level 2 (11kW)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={inputs.evChargerCount || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setInputs({ ...inputs, evChargerCount: parseInt(val) || 0 });
                        }}
                        className="w-full px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm font-bold text-center"
                        placeholder="0"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] mb-1 block">DCFC (150kW)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={inputs.dcfcChargerCount || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setInputs({ ...inputs, dcfcChargerCount: parseInt(val) || 0 });
                        }}
                        className="w-full px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm font-bold text-center"
                        placeholder="0"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-[10px] mb-1 block">HPC (350kW)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={inputs.hpcChargerCount || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setInputs({ ...inputs, hpcChargerCount: parseInt(val) || 0 });
                        }}
                        className="w-full px-2 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm font-bold text-center"
                        placeholder="0"
                        maxLength={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Solar Question - Yes/No with kW Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-300 text-sm font-semibold flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" /> Add Solar?
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHasSolar(true)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        hasSolar 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                          : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }`}
                    >
                      ☀️ Yes
                    </button>
                    <button
                      onClick={() => setHasSolar(false)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        !hasSolar 
                          ? 'bg-slate-600 text-white' 
                          : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                {hasSolar && (
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                    <label className="text-amber-300 text-xs mb-1 block">How much solar capacity (kW)?</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={solarKW === 0 ? '' : solarKW}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                          setSolarKW(val === '' ? 0 : Math.min(parseInt(val), 9999));
                        }}
                        maxLength={4}
                        className="flex-1 px-3 py-2 bg-slate-700 border border-amber-500/50 rounded-lg text-white text-lg font-bold"
                        placeholder="100"
                      />
                      <span className="text-amber-400 font-bold">kW</span>
                    </div>
                    <p className="text-amber-300/70 text-xs mt-1">
                      Recommended: {Math.round(peakKW * 0.3)} kW based on your hotel size
                    </p>
                  </div>
                )}
              </div>

              {/* Amenity Toggle Pills - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { key: 'hasSpa', icon: '💆', label: 'Spa & Wellness', value: inputs.hasSpa },
                  { key: 'hasFitnessCenter', icon: '🏋️', label: 'Fitness Center', value: inputs.hasFitnessCenter },
                  { key: 'hasConferenceCenter', icon: '👔', label: 'Conference Center', value: inputs.hasConferenceCenter },
                  { key: 'hasLaundry', icon: '👕', label: 'On-Site Laundry', value: inputs.hasLaundry },
                ].map((amenity) => (
                  <button
                    key={amenity.key}
                    onClick={() => setInputs({ ...inputs, [amenity.key]: !amenity.value })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      amenity.value 
                        ? 'bg-gradient-to-r from-[#ffa600] to-[#ff8c00] text-[#060F76] border-2 border-[#FED19F]/60 shadow-lg shadow-[#ffa600]/30' 
                        : 'bg-slate-700/60 text-gray-300 border-2 border-slate-500/50 hover:bg-[#6700b6]/30 hover:border-[#6700b6]/60'
                    }`}
                  >
                    <span className="text-lg">{amenity.icon}</span>
                    <span>{amenity.label}</span>
                  </button>
                ))}
              </div>

              {/* Elevators + Energy Star - TWO COLUMNS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-semibold">🛗 Elevators</span>
                    <span className="text-white font-black text-lg">{inputs.elevatorCount}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={inputs.elevatorCount}
                    onChange={(e) => setInputs({ ...inputs, elevatorCount: parseInt(e.target.value) })}
                    className="w-full h-3 accent-[#ffa600] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-2 block">⭐ Energy Star?</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setInputs({ ...inputs, isEnergyEfficient: true })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                        inputs.isEnergyEfficient 
                          ? 'bg-gradient-to-r from-[#ffa600] to-[#ff8c00] text-[#060F76] shadow-lg shadow-[#ffa600]/30' 
                          : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button
                      onClick={() => setInputs({ ...inputs, isEnergyEfficient: false })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                        !inputs.isEnergyEfficient 
                          ? 'bg-slate-600 text-white' 
                          : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT PANEL: Your Estimated Savings - MORE TRANSLUCENT */}
            <div className="bg-gradient-to-br from-[#060F76]/60 via-[#0a1a9a]/50 to-[#6700b6]/20 backdrop-blur-xl rounded-3xl p-6 border-2 border-[#ffa600]/40 shadow-2xl shadow-[#6700b6]/20 flex flex-col">
              {/* Header with TrueQuote */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6700b6] to-[#4b00a0] flex items-center justify-center shadow-lg shadow-[#6700b6]/40 border-2 border-[#ffa600]/50">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffa600] to-[#ff8c00]">Your Savings</h3>
                </div>
                <button 
                  onClick={() => setShowTrueQuoteModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-2 rounded-full border-2 border-amber-400/60 hover:border-amber-300 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-black text-amber-400">TrueQuote™</span>
                </button>
              </div>

              {/* Hero Savings Number - BIGGER & GLOWING */}
              <div className="relative text-center py-6 bg-gradient-to-br from-[#060F76]/60 to-[#0a1a9a]/60 rounded-2xl mb-5 border-2 border-[#6700b6]/40 overflow-hidden">
                {/* Glow background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#6700b6]/10 via-[#ffa600]/10 to-[#6700b6]/10 animate-pulse" />
                <p className="relative text-[#68BFFA] text-sm mb-2 font-semibold">⚡ ESTIMATED ANNUAL SAVINGS ⚡</p>
                <p className="relative text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffa600] via-[#ffb833] to-[#ffa600] drop-shadow-lg animate-pulse" style={{ animationDuration: '2s' }}>
                  ${heroEstimate.savings.toLocaleString()}
                </p>
                <p className="relative text-[#68BFFA] text-base font-medium mt-1">per year</p>
              </div>

              {/* System Specs - THREE COLUMNS with MERLIN COLORS */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gradient-to-br from-[#6700b6]/50 to-[#4b00a0]/50 rounded-xl p-3 text-center border-2 border-[#6700b6]/60 shadow-lg shadow-[#6700b6]/30">
                  <Battery className="w-5 h-5 text-[#ffa600] mx-auto mb-1" />
                  <p className="text-xl font-black text-white drop-shadow-lg">{Math.round(peakKW * 0.4 * inputs.storageHours)}</p>
                  <p className="text-[10px] text-purple-200 font-bold">kWh Battery</p>
                </div>
                <div className={`bg-gradient-to-br rounded-xl p-3 text-center border-2 shadow-lg ${hasSolar ? 'from-[#ffa600]/50 to-[#ff8c00]/50 border-[#ffa600]/60 shadow-[#ffa600]/30' : 'from-slate-600/50 to-slate-700/50 border-slate-500/60 shadow-slate-600/30'}`}>
                  <Sun className={`w-5 h-5 mx-auto mb-1 ${hasSolar ? 'text-white' : 'text-slate-400'}`} />
                  <p className={`text-xl font-black drop-shadow-lg ${hasSolar ? 'text-white' : 'text-slate-400'}`}>{hasSolar ? solarKW : '--'}</p>
                  <p className={`text-[10px] font-bold ${hasSolar ? 'text-amber-100' : 'text-slate-400'}`}>kW Solar</p>
                </div>
                <div className="bg-gradient-to-br from-[#68BFFA]/50 to-[#4ba3e8]/50 rounded-xl p-3 text-center border-2 border-[#68BFFA]/60 shadow-lg shadow-[#68BFFA]/30">
                  <DollarSign className="w-5 h-5 text-white mx-auto mb-1" />
                  <p className="text-xl font-black text-white drop-shadow-lg">${Math.round(heroEstimate.savings * heroEstimate.payback * 0.7 / 1000)}K</p>
                  <p className="text-[10px] text-cyan-100 font-bold">Net Cost</p>
                </div>
              </div>

              {/* Financial Metrics - 4 COLUMNS with MERLIN COLORS */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                <div className="text-center p-2 bg-gradient-to-br from-[#6700b6]/60 to-[#4b00a0]/60 rounded-xl border-2 border-[#6700b6]/60">
                  <p className="text-2xl font-black text-white drop-shadow-lg">{heroEstimate.payback}</p>
                  <p className="text-[9px] text-purple-200 font-bold">Yr Payback</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-[#68BFFA]/60 to-[#4ba3e8]/60 rounded-xl border-2 border-[#68BFFA]/60">
                  <p className="text-2xl font-black text-white drop-shadow-lg">{Math.round(25 / heroEstimate.payback * 100)}%</p>
                  <p className="text-[9px] text-cyan-200 font-bold">25-Yr ROI</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-[#ffa600]/60 to-[#ff8c00]/60 rounded-xl border-2 border-[#ffa600]/60">
                  <p className="text-2xl font-black text-white drop-shadow-lg">${Math.round(heroEstimate.savings * heroEstimate.payback * 0.3 / 1000)}K</p>
                  <p className="text-[9px] text-amber-100 font-bold">Incentives</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-br from-emerald-600/60 to-emerald-800/60 rounded-xl border-2 border-emerald-400/60">
                  <p className="text-2xl font-black text-white drop-shadow-lg">${Math.round(heroEstimate.savings * 25 / 1000)}K</p>
                  <p className="text-[9px] text-emerald-200 font-bold">25-Yr Save</p>
                </div>
              </div>

              {/* Guest Experience Benefits - Shows real value to hotel owners */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-xl p-4 mb-5 border border-amber-400/30">
                <p className="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Guest Experience Benefits
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                    <div className="text-xl">⚡</div>
                    <div>
                      <p className="text-white text-sm font-bold">Zero Blackouts</p>
                      <p className="text-[10px] text-gray-400">Seamless backup power</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                    <div className="text-xl">🔌</div>
                    <div>
                      <p className="text-white text-sm font-bold">EV Ready</p>
                      <p className="text-[10px] text-gray-400">Attract modern travelers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                    <div className="text-xl">🌿</div>
                    <div>
                      <p className="text-white text-sm font-bold">Green Certified</p>
                      <p className="text-[10px] text-gray-400">Boost sustainability rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                    <div className="text-xl">📈</div>
                    <div>
                      <p className="text-white text-sm font-bold">Higher ADR</p>
                      <p className="text-[10px] text-gray-400">Premium eco-conscious rates</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button - Navy Blue with Hotel Icon + Orange accent */}
              <div className="mt-auto">
                <button
                  onClick={() => setShowWizard(true)}
                  className="group relative w-full py-5 bg-gradient-to-r from-[#6700b6] to-[#4b00a0] hover:from-[#7a00d4] hover:to-[#5a00b8] text-white font-black text-2xl rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-[#6700b6]/50 hover:scale-[1.02] border-2 border-[#ffa600]"
                >
                  <Building2 className="w-8 h-8 text-[#ffa600]" />
                  <span>Build My Quote</span>
                  <ArrowRight className="w-8 h-8 text-[#ffa600] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Image indicator dots */}
          <div className="flex justify-center gap-2 mt-6">
            {CAROUSEL_IMAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setHeroImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === heroImageIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* REMOVED: Success Stories sections - per user request Dec 17 2025 */}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient background glow - MERLIN COLORS (removed floating icons per user request Dec 18) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060F76]/40 via-[#6700b6]/50 to-[#060F76]/40 blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6700b6]/40 via-[#ffa600]/20 to-[#6700b6]/40 px-5 py-2 rounded-full border-2 border-[#ffa600]/60 mb-6 shadow-lg shadow-[#6700b6]/30">
            <Sparkles className="w-5 h-5 text-[#ffa600]" />
            <span className="text-white font-black tracking-wide">🚀 LIMITED TIME OFFER</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Improve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffa600] via-[#68BFFA] to-[#ffa600]">Bottom Line?</span>
          </h2>
          <p className="text-xl text-[#68BFFA] mb-8 font-bold">
            ✅ Free consultation • ✅ No obligation • ✅ Takes 2 minutes
          </p>
          
          {/* Big CTA Button with pulse - ORANGE for maximum POP */}
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-4 bg-gradient-to-r from-[#ffa600] via-[#ff8c00] to-[#ffa600] hover:from-[#ffb833] hover:via-[#ffa600] hover:to-[#ffb833] text-[#060F76] px-14 py-6 rounded-2xl font-black text-2xl shadow-2xl shadow-[#ffa600]/50 hover:shadow-[#ffa600]/70 transition-all hover:scale-105 border-3 border-white/60 group animate-pulse"
            style={{ animationDuration: '2s' }}
          >
            <Sparkles className="w-7 h-7 text-[#060F76] group-hover:rotate-12 transition-transform" />
            Start My Free Quote
            <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform" />
          </button>
          
          {/* Trust indicators */}
          <div className="mt-6 flex flex-col items-center gap-4">
            {/* Industry Compliance Badges - Transparent, Auditable Pricing */}
            <MethodologyStatement 
              variant="compact" 
              darkMode={true}
              message="NREL ATB 2024 & DOE methodology"
            />
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-black/30 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <p className="text-white font-bold">Hotel Energy</p>
                <p className="text-indigo-200/50 text-sm">Powered by Merlin Energy</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-indigo-200/70 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="mailto:info@hotelenergypartners.com" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-indigo-200/50 text-sm">
            © {new Date().getFullYear()} Hotel Energy. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          LEAD CAPTURE MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {showLeadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
          <div 
            className="bg-gradient-to-br from-slate-900 via-indigo-900/50 to-slate-900 rounded-3xl p-8 max-w-md w-full border-3 border-indigo-400/60 shadow-2xl shadow-indigo-500/30 relative overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 16px)' }}
          >
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 text-2xl">🏨</div>
            <div className="absolute top-2 right-12 text-xl">✨</div>
            <button onClick={() => setShowLeadForm(false)} className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-indigo-500/30 rounded-xl transition-all border border-transparent hover:border-indigo-400/50">
              <X className="w-6 h-6" />
            </button>
            
            {!leadSubmitted ? (
              <>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 mb-2">Get Your Free Custom Quote</h3>
                <p className="text-indigo-200 mb-6 font-medium">Our hospitality energy experts will analyze your hotel</p>
                
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-indigo-200 mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.businessName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, businessName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Hotel Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-indigo-200 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={leadInfo.ownerName}
                      onChange={(e) => setLeadInfo({ ...leadInfo, ownerName: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-indigo-200 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="john@hotel.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-indigo-200 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={leadInfo.phone}
                        onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 border-2 border-indigo-300/50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="animate-pulse">Processing...</span>
                      </>
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Get My Free Quote <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/40 animate-pulse">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300 mb-3">🎉 Thank You!</h3>
                <p className="text-indigo-200 mb-6 font-medium">We'll send your detailed quote to <span className="text-indigo-300 font-bold">{leadInfo.email}</span> within 24 hours.</p>
                <button
                  onClick={() => { setShowLeadForm(false); setLeadSubmitted(false); }}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          WIZARD MODAL - Uses WizardV5 with hotel pre-selected
          ═══════════════════════════════════════════════════════════════════════ */}
      {showWizard && (
        <div className="fixed inset-0 z-50">
          <WizardV5
            initialUseCase="hotel"
            onComplete={(quote) => {
              console.log('Hotel quote completed:', quote);
              setShowWizard(false);
            }}
            onCancel={() => setShowWizard(false)}
          />
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          CASE STUDY MODAL - Success Stories Popup (3RD REQUEST - FINALLY ADDED!)
          ═══════════════════════════════════════════════════════════════════════ */}
      {selectedCaseStudy && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30">
            {/* Modal Header with Image */}
            <div className="relative h-48">
              <img 
                src={selectedCaseStudy.image} 
                alt={selectedCaseStudy.title} 
                className="w-full h-full object-cover rounded-t-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedCaseStudy(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Title Overlay */}
              <div className="absolute bottom-4 left-6">
                <p className="text-emerald-400 text-sm font-medium">{selectedCaseStudy.category}</p>
                <h2 className="text-3xl font-black text-white">{selectedCaseStudy.title}</h2>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* Hero Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-500/20 rounded-xl p-4 text-center border border-emerald-500/30">
                  <p className="text-3xl font-black text-emerald-400">
                    ${(selectedCaseStudy.annualSavings / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-gray-400">Annual Savings</p>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-4 text-center border border-purple-500/30">
                  <p className="text-3xl font-black text-purple-400">
                    {selectedCaseStudy.paybackYears}yr
                  </p>
                  <p className="text-sm text-gray-400">Payback Period</p>
                </div>
                <div className="bg-amber-500/20 rounded-xl p-4 text-center border border-amber-500/30">
                  <p className="text-3xl font-black text-amber-400">
                    {selectedCaseStudy.metrics.roi25Year}
                  </p>
                  <p className="text-sm text-gray-400">25-Year ROI</p>
                </div>
              </div>
              
              {/* System Configuration */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Battery className="w-5 h-5 text-cyan-400" />
                  System Configuration
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Property Size</p>
                    <p className="text-lg font-bold text-white">{selectedCaseStudy.metrics.roomCount} rooms</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Battery Storage</p>
                    <p className="text-lg font-bold text-white">
                      {selectedCaseStudy.metrics.batteryKW} kW / {selectedCaseStudy.metrics.batteryKWh} kWh
                    </p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Solar Array</p>
                    <p className="text-lg font-bold text-white">{selectedCaseStudy.metrics.solarKW} kW</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Peak Demand Reduction</p>
                    <p className="text-lg font-bold text-emerald-400">{selectedCaseStudy.metrics.peakDemandReduction}</p>
                  </div>
                </div>
              </div>
              
              {/* Financial Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Savings Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Demand Charge Savings</span>
                    <span className="text-emerald-400 font-bold">
                      ${selectedCaseStudy.metrics.demandChargeSavings.toLocaleString()}/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Energy Arbitrage Savings</span>
                    <span className="text-emerald-400 font-bold">
                      ${selectedCaseStudy.metrics.energyArbitrageSavings.toLocaleString()}/yr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-gray-400">Incentives & Tax Credits</span>
                    <span className="text-amber-400 font-bold">
                      ${selectedCaseStudy.metrics.incentivesReceived.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Project Costs */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-purple-400" />
                  Project Investment
                </h3>
                <div className="bg-slate-800/60 rounded-xl p-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Total Project Cost</span>
                    <span className="text-white font-bold">
                      ${selectedCaseStudy.metrics.totalProjectCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Less: Incentives</span>
                    <span className="text-amber-400 font-bold">
                      -${selectedCaseStudy.metrics.incentivesReceived.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-white/20 mt-2 pt-2">
                    <span className="text-white font-bold">Net Investment</span>
                    <span className="text-emerald-400 font-black text-xl">
                      ${selectedCaseStudy.metrics.netCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Environmental Impact */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-400" />
                  Environmental Impact
                </h3>
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🌍</div>
                    <div>
                      <p className="text-2xl font-black text-emerald-400">
                        {selectedCaseStudy.metrics.co2ReductionTons} tons
                      </p>
                      <p className="text-gray-400">CO₂ reduced annually</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setSelectedCaseStudy(null);
                    // Set inputs to match the case study then open wizard
                    setInputs(prev => ({
                      ...prev,
                      numberOfRooms: selectedCaseStudy.metrics.roomCount,
                    }));
                    setShowWizard(true);
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Build Similar Quote
                </button>
                <button
                  onClick={() => setSelectedCaseStudy(null)}
                  className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HOW MERLIN WORKS POPUP - Step-by-step process explanation
          ═══════════════════════════════════════════════════════════════════════ */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHowItWorks(false)}>
          <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
                <h2 className="text-3xl font-bold text-white">How Merlin Works</h2>
              </div>
              <button onClick={() => setShowHowItWorks(false)} className="text-purple-300 hover:text-white text-2xl">×</button>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Tell Us About Your Hotel</h3>
                  <p className="text-purple-200/70">Enter your hotel's room count, amenities, and location. Takes about 60 seconds.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Merlin Analyzes Your Needs</h3>
                  <p className="text-purple-200/70">Our AI uses NREL ATB 2024 pricing and DOE-aligned methodology to design the optimal energy solution for your property.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Get Your Custom Quote</h3>
                  <p className="text-purple-200/70">Receive a detailed, bank-ready proposal with ROI projections and equipment specs—all with traceable sources.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-purple-900 font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-white text-lg">Start Saving Money</h3>
                  <p className="text-purple-200/70">Connect with certified installers and start cutting your hotel's energy costs immediately.</p>
                </div>
              </div>
            </div>
            
            {/* Industry Compliance Statement */}
            <div className="mt-6 pt-4 border-t border-purple-500/30">
              <MethodologyStatement 
                variant="compact" 
                darkMode={true}
                message="NREL ATB 2024 & DOE StoreFAST aligned"
              />
            </div>
            
            <button 
              onClick={() => { setShowHowItWorks(false); setShowWizard(true); }}
              className="w-full mt-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-purple-900 py-4 rounded-full font-bold text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              🪄 Start My Free Quote →
            </button>
          </div>
        </div>
      )}
      
      {/* TrueQuote Modal */}
      <TrueQuoteModal 
        isOpen={showTrueQuoteModal} 
        onClose={() => setShowTrueQuoteModal(false)} 
      />
    </div>
  );
}
