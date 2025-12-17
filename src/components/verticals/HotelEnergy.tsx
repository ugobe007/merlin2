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
 * REFACTORED Dec 2025: Now uses StreamlinedWizard with initialUseCase='hotel'
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
import merlinImage from '@/assets/images/new_Merlin.png';
import hotelImage from '@/assets/images/hotel_1.jpg';
import hotelImage2 from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import hotelImage3 from '@/assets/images/hotel_motel_holidayinn_2.jpg';
import hotelImage4 from '@/assets/images/hotel_motel_holidayinn_3.jpg';
import hotelImage5 from '@/assets/images/hotel_motel_holidayinn_4.jpg';
import evChargingHotelImage from '@/assets/images/ev_charging_hotel.jpg';
// REFACTORED: Use StreamlinedWizard instead of HotelWizard
import StreamlinedWizard from '@/components/wizard/StreamlinedWizard';
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
  evChargerCount: number;
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
    hasPool: true,
    hasIndoorPool: false,
    hasOutdoorPool: true,
    
    // STEP 4: Resort-only features
    hasClubhouse: false,
    hasGolfCourse: false,
    golfCartCount: 0,
    
    // STEP 5: Additional amenities
    hasSpa: false,
    hasFitnessCenter: true,
    hasEVCharging: false,
    evChargerCount: 4,
    hasLaundry: true,
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
  
  // Hero inline estimate - calculated from ALL inputs (Dec 2025 - comprehensive calculation)
  const heroEstimate = React.useMemo(() => {
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
    if (inputs.hasPool) baseSavings += 3500; // Pool pumps, heating
    if (inputs.hasRestaurant) baseSavings += 4500; // Kitchen equipment, refrigeration
    if (inputs.hasSpa) baseSavings += 3000; // HVAC, hot tubs
    if (inputs.hasLaundry) baseSavings += 2500; // Industrial washers/dryers
    if (inputs.hasEVCharging) baseSavings += 2000; // EV charger demand
    
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
    
    // Adjust for laundry type (commercial = higher power = more savings)
    if (inputs.hasLaundry && inputs.laundryType === 'commercial') {
      baseSavings += inputs.laundryMachineCount * 200; // Commercial machines add more savings
    }
    
    const savings = Math.round(baseSavings);
    
    // Payback affected by system size and class
    let payback = derivedClass === 'luxury' ? 3.5 : derivedClass === 'upscale' ? 4.0 : derivedClass === 'midscale' ? 4.5 : 5.0;
    // Larger systems have slightly better payback (economies of scale)
    if (savings > 80000) payback -= 0.3;
    else if (savings > 50000) payback -= 0.2;
    
    return { savings, payback: Math.round(payback * 10) / 10, hotelClass: derivedClass };
  }, [inputs.numberOfRooms, inputs.squareFootage, inputs.hasPool, inputs.hasRestaurant, inputs.hasSpa, inputs.hasLaundry, inputs.hasEVCharging, inputs.elevatorCount, inputs.storageHours, inputs.hvacRating, inputs.lightingEfficiency, inputs.isEnergyEfficient, inputs.laundryType, inputs.laundryMachineCount]);
  
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
          HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900/50 to-slate-900 backdrop-blur-xl border-b-2 border-indigo-500/40 sticky top-0 z-40 shadow-lg shadow-indigo-500/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Back to Merlin Button */}
          <a 
            href="/"
            className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors group mr-4 bg-slate-800/50 hover:bg-slate-700/50 px-3 py-2 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <img src={merlinImage} alt="Merlin" className="w-7 h-7" />
            <span className="hidden sm:inline text-sm font-semibold">Merlin</span>
          </a>
          
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border-2 border-indigo-400/50">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Hotel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Energy</span></h1>
              <p className="text-xs text-indigo-300 font-medium">🏨 Battery Storage for Hospitality</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#calculator" className="hidden md:block text-indigo-200 hover:text-white text-sm font-semibold transition-colors hover:bg-indigo-500/20 px-4 py-2 rounded-lg">
              Calculator
            </a>
            <a href="tel:+18005551234" className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 px-5 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-500/30 border-2 border-indigo-300/50 hover:scale-105">
              <Phone className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-sm">Get Quote</span>
            </a>
          </div>
        </div>
      </header>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION - Redesigned Dec 2025
          Calculator-first hero with "Save up to 50%" headline above panels
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] overflow-hidden">
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
            
            {/* How Merlin Works button - LARGER (removed Start Building Your Quote button) */}
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold text-lg rounded-2xl border border-white/20 transition-all hover:scale-105 shadow-lg"
              >
                <img src={merlinImage} alt="" className="w-6 h-6" />
                <span>How Merlin Works</span>
              </button>
            </div>
          </div>
          
          {/* Two-Panel Calculator Layout - COMPACT & BALANCED */}
          <div id="hero-panel" className="grid lg:grid-cols-2 gap-4 items-stretch">
            
            {/* LEFT PANEL: Hotel Details - COMPACT */}
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-500/30 shadow-xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Your Hotel Details</h3>
              </div>

              {/* Location - Full Width */}
              <div className="mb-3">
                <label className="text-gray-400 text-xs mb-1 block">📍 Location</label>
                <select
                  value={inputs.state}
                  onChange={(e) => setInputs({ ...inputs, state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-medium"
                >
                  {Object.keys(STATE_RATES).map((state) => (
                    <option key={state} value={state} className="bg-slate-800">{state}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ${(STATE_RATES[inputs.state]?.rate || 0.12).toFixed(2)}/kWh • ${STATE_RATES[inputs.state]?.demandCharge || 12}/kW demand
                </p>
              </div>

              {/* Rooms & Square Feet - TWO COLUMNS */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">🛏️ Guest Rooms</label>
                  <input
                    type="number"
                    value={inputs.numberOfRooms}
                    onChange={(e) => setInputs({ ...inputs, numberOfRooms: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-medium"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">📐 Sq Footage</label>
                  <input
                    type="number"
                    value={inputs.squareFootage}
                    onChange={(e) => {
                      setUserSetBill(false);
                      setInputs({ ...inputs, squareFootage: parseInt(e.target.value) || 0 });
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm font-medium"
                    placeholder="75000"
                  />
                </div>
              </div>

              {/* Auto Class Badge */}
              <div className={`text-center py-1.5 px-3 rounded-lg mb-3 text-xs font-bold ${
                inputs.numberOfRooms > 400 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                inputs.numberOfRooms > 200 ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                inputs.numberOfRooms > 75 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' :
                'bg-slate-600/50 text-slate-300 border border-slate-500/30'
              }`}>
                {inputs.numberOfRooms > 400 ? '✨ Luxury Class' :
                 inputs.numberOfRooms > 200 ? '⭐ Upscale Class' :
                 inputs.numberOfRooms > 75 ? '🏨 Midscale Class' :
                 '🏨 Budget Class'}
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-3"></div>

              {/* Equipment Section Header */}
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Equipment & Efficiency
              </p>

              {/* HVAC & Lighting - TWO COLUMNS, COMPACT SLIDERS */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">HVAC Age</span>
                    <span className="text-white font-bold">{inputs.hvacRating}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={inputs.hvacRating}
                    onChange={(e) => setInputs({ ...inputs, hvacRating: parseInt(e.target.value) })}
                    className="w-full h-2 accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Old</span>
                    <span>New</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Lighting</span>
                    <span className="text-white font-bold">{inputs.lightingEfficiency}/5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={inputs.lightingEfficiency}
                    onChange={(e) => setInputs({ ...inputs, lightingEfficiency: parseInt(e.target.value) })}
                    className="w-full h-2 accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Bulbs</span>
                    <span>LED</span>
                  </div>
                </div>
              </div>

              {/* Laundry - TWO COLUMNS */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Laundry</span>
                    <span className="text-white font-bold">{inputs.laundryMachineCount}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={inputs.laundryMachineCount}
                    onChange={(e) => setInputs({ ...inputs, laundryMachineCount: parseInt(e.target.value), hasLaundry: parseInt(e.target.value) > 0 })}
                    className="w-full h-2 accent-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Type</label>
                  <select
                    value={inputs.laundryType}
                    onChange={(e) => setInputs({ ...inputs, laundryType: e.target.value as 'commercial' | 'regular' })}
                    className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs"
                  >
                    <option value="commercial">Commercial</option>
                    <option value="regular">Regular</option>
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-3"></div>

              {/* Amenities Section Header */}
              <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Amenities (tap to toggle)
              </p>

              {/* Amenity Pills - 3 COLUMNS, COMPACT */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {[
                  { key: 'hasPool', icon: '🏊', label: 'Pool', value: inputs.hasPool },
                  { key: 'hasRestaurant', icon: '🍽️', label: 'Restaurant', value: inputs.hasRestaurant },
                  { key: 'hasSpa', icon: '💆', label: 'Spa', value: inputs.hasSpa },
                  { key: 'hasFitnessCenter', icon: '🏋️', label: 'Gym', value: inputs.hasFitnessCenter },
                  { key: 'hasConferenceCenter', icon: '👔', label: 'Conf Ctr', value: inputs.hasConferenceCenter },
                  { key: 'hasEVCharging', icon: '⚡', label: 'EV', value: inputs.hasEVCharging },
                ].map((amenity) => (
                  <button
                    key={amenity.key}
                    onClick={() => setInputs({ ...inputs, [amenity.key]: !amenity.value })}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                      amenity.value 
                        ? 'bg-emerald-500/80 text-white border border-emerald-400/50' 
                        : 'bg-slate-700/60 text-gray-400 border border-slate-600/50 hover:bg-slate-600/80'
                    }`}
                  >
                    <span>{amenity.icon}</span>
                    <span>{amenity.label}</span>
                  </button>
                ))}
              </div>

              {/* Elevators + Energy Star - TWO COLUMNS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">🛗 Elevators</span>
                    <span className="text-white font-bold">{inputs.elevatorCount}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={inputs.elevatorCount}
                    onChange={(e) => setInputs({ ...inputs, elevatorCount: parseInt(e.target.value) })}
                    className="w-full h-2 accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Energy Star?</label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setInputs({ ...inputs, isEnergyEfficient: true })}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                        inputs.isEnergyEfficient 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-700 text-gray-400'
                      }`}
                    >
                      ✓ Yes
                    </button>
                    <button
                      onClick={() => setInputs({ ...inputs, isEnergyEfficient: false })}
                      className={`flex-1 py-1 rounded text-xs font-bold transition-all ${
                        !inputs.isEnergyEfficient 
                          ? 'bg-slate-600 text-white' 
                          : 'bg-slate-700 text-gray-400'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* RIGHT PANEL: Your Estimated Savings - EXPANDED */}
            <div className="bg-purple-900/40 backdrop-blur-sm rounded-2xl p-5 border border-purple-500/30 shadow-xl flex flex-col">
              {/* Header with TrueQuote */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-400">Your Estimated Savings</h3>
                </div>
                <button 
                  onClick={() => setShowTrueQuoteModal(true)}
                  className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-amber-400/50 hover:bg-white/20 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">TrueQuote™</span>
                </button>
              </div>

              {/* Hero Savings Number */}
              <div className="text-center py-4 bg-slate-800/40 rounded-xl mb-4">
                <p className="text-gray-400 text-xs mb-1">⚡ ANNUAL SAVINGS ⚡</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  ${heroEstimate.savings.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">per year</p>
              </div>

              {/* Battery / Solar / Net Cost - THREE COLUMNS */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <Battery className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{Math.round(peakKW * 0.4 * inputs.storageHours)}</p>
                  <p className="text-[10px] text-gray-400">kWh Battery</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <Sun className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{Math.round(peakKW * 0.3)}</p>
                  <p className="text-[10px] text-gray-400">kW Solar</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">${Math.round(heroEstimate.savings * heroEstimate.payback * 0.7 / 1000)}K</p>
                  <p className="text-[10px] text-gray-400">Net Cost</p>
                </div>
              </div>

              {/* Financial Metrics - THREE COLUMNS */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <p className="text-xl font-bold text-purple-300">{heroEstimate.payback}</p>
                  <p className="text-[10px] text-gray-400">Yr Payback</p>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <p className="text-xl font-bold text-purple-300">{Math.round(25 / heroEstimate.payback * 100)}%</p>
                  <p className="text-[10px] text-gray-400">25-Yr ROI</p>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <p className="text-xl font-bold text-amber-400">${Math.round(heroEstimate.savings * heroEstimate.payback * 0.3 / 1000)}K</p>
                  <p className="text-[10px] text-gray-400">Incentives</p>
                </div>
              </div>

              {/* Savings Breakdown - Progress Bars */}
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                  <Receipt className="w-3 h-3" /> Savings Breakdown
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Demand Charges', percent: 55, color: 'bg-emerald-500' },
                    { label: 'Energy Arbitrage', percent: 24, color: 'bg-cyan-500' },
                    { label: 'Peak Shaving', percent: 16, color: 'bg-purple-500' },
                    { label: 'TOU Optimization', percent: 5, color: 'bg-amber-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-24 truncate">{item.label}</span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full`} 
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-white font-medium w-10 text-right">
                        ${Math.round(heroEstimate.savings * item.percent / 100 / 1000)}K
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-emerald-500/10 rounded-xl p-3 mb-4 border border-emerald-500/20">
                <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-400" /> Environmental Impact
                </p>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{Math.round(heroEstimate.savings / 600)}</p>
                    <p className="text-[10px] text-gray-400">tons CO₂/yr</p>
                  </div>
                  <div className="text-gray-600">|</div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">{Math.round(heroEstimate.savings / 600 / 4.6)}</p>
                    <p className="text-[10px] text-gray-400">cars off road</p>
                  </div>
                </div>
              </div>

              {/* CTA Button - Push to Bottom */}
              <div className="mt-auto">
                <button
                  onClick={() => setShowWizard(true)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Wand2 className="w-5 h-5" />
                  Build My Custom Quote
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="w-full mt-2 py-2 bg-slate-800/70 hover:bg-slate-700/80 border border-indigo-400/40 text-indigo-100 text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Talk to Expert
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
      
      {/* ═══════════════════════════════════════════════════════════════════════
          USE CASES SHOWCASE - Expanded with larger images (Dec 2025 Redesign)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-b from-black/40 via-indigo-900/30 to-purple-900/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 rounded-full px-5 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-semibold">Success Stories</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Hotels Like Yours Are <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Saving Big</span>
            </h2>
            <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
              From boutique hotels to luxury resorts, see how properties are cutting energy costs while improving guest experience
            </p>
          </div>
          
          {/* Use Cases Grid - Large Cards - NOW USES CASE STUDY DATA */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {HOTEL_CASE_STUDIES.map((study) => (
              <div 
                key={study.id}
                className="bg-slate-800/60 rounded-3xl overflow-hidden border-2 border-purple-500/30 hover:border-emerald-400/50 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer group"
              >
                {/* Large Image with savings badge */}
                <div className="h-52 md:h-64 overflow-hidden relative">
                  <img 
                    src={study.image} 
                    alt={study.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                  
                  {/* Floating badge */}
                  <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-xs font-bold">${(study.annualSavings / 1000).toFixed(0)}K/yr Savings</span>
                  </div>
                  
                  {/* Caption overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white/80 text-sm font-medium">{study.category}</p>
                    <h3 className="text-white text-xl font-bold">{study.title}</h3>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-emerald-400">${(study.annualSavings / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-emerald-300">Annual Savings</p>
                    </div>
                    <div className="bg-purple-500/10 rounded-xl p-3 text-center">
                      <p className="text-2xl font-black text-purple-400">{study.paybackYears}yr</p>
                      <p className="text-xs text-purple-300">Payback Period</p>
                    </div>
                  </div>
                  
                  {/* THIS BUTTON OPENS THE MODAL */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCaseStudy(study);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span>See How They Did It</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Banner */}
          <div className="bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-emerald-900/50 rounded-2xl p-8 border border-indigo-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Your Hotel Could Be Next</h3>
            <p className="text-indigo-200 mb-6">Get a custom quote based on your property's specific needs</p>
            <button
              onClick={() => setShowWizard(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-700 via-violet-600 to-emerald-500 hover:from-purple-600 hover:via-violet-500 hover:to-emerald-400 text-white rounded-xl font-black text-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30 inline-flex items-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Get My Custom Quote
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
      
      {/* DELETED: Calculator section and How It Works - redundant with hero */}

      {/* ═══════════════════════════════════════════════════════════════════════
          CASE STUDIES
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-b from-black/30 via-indigo-900/20 to-black/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full border border-indigo-400/40 mb-4">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-200 text-sm font-bold">🏆 SUCCESS STORIES</span>
            </div>
            <h2 className="text-3xl font-black text-white">
              Hotels <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Saving Big</span>
            </h2>
            <p className="text-indigo-200 text-sm mt-2 font-medium">
              Example savings scenarios based on typical installations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Midscale */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-900/40 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-3 border-indigo-500/50 hover:scale-105 hover:border-indigo-400/70 transition-all shadow-2xl shadow-indigo-500/20 group">
              <div className="absolute -top-3 -right-3 text-2xl group-hover:animate-bounce">⭐</div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/40 border-2 border-indigo-300/40">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">Midscale Hotel</p>
                  <p className="text-sm text-indigo-200/80 font-medium">120 rooms • Orlando, FL</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-2xl p-5 text-center mb-4 border border-indigo-400/40">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">$38,000</p>
                <p className="text-sm text-indigo-200/80 font-semibold">💰 Annual Savings</p>
              </div>
              <p className="text-sm text-indigo-200/70 font-semibold text-center">🔋 150 kW battery • ⏱️ 4.2 year payback</p>
            </div>
            
            {/* Card 2 - Upscale (Featured) */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-3 border-purple-400/60 hover:scale-105 hover:border-purple-400/80 transition-all shadow-2xl shadow-purple-500/30 relative group">
              {/* Featured badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 px-4 py-1 rounded-full text-xs font-black text-white shadow-lg border border-purple-300/50">🏆 TOP PERFORMER</div>
              <div className="absolute -top-3 -right-3 text-2xl group-hover:animate-bounce">✨</div>
              <div className="flex items-center gap-3 mb-5 mt-2">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-purple-300/40">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">Upscale Resort</p>
                  <p className="text-sm text-purple-200/80 font-medium">250 rooms • San Diego, CA</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-2xl p-5 text-center mb-4 border border-purple-400/40">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">$72,000</p>
                <p className="text-sm text-purple-200/80 font-semibold">💰 Annual Savings</p>
              </div>
              <p className="text-sm text-purple-200/70 font-semibold text-center">🔋 300 kW battery • ⏱️ 3.8 year payback</p>
            </div>
            
            {/* Card 3 - Boutique */}
            <div className="bg-gradient-to-br from-slate-900 via-pink-900/40 to-slate-900 backdrop-blur-xl rounded-3xl p-6 border-3 border-pink-500/50 hover:scale-105 hover:border-pink-400/70 transition-all shadow-2xl shadow-pink-500/20 relative group">
              <div className="absolute -top-3 -right-3 text-2xl group-hover:animate-bounce">💎</div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/40 border-2 border-pink-300/40">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-black text-white text-lg">Boutique Hotel</p>
                  <p className="text-sm text-pink-200/80 font-medium">75 rooms • Miami, FL</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-500/30 to-rose-500/20 rounded-2xl p-5 text-center mb-4 border border-pink-400/40">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-rose-300">$28,000</p>
                <p className="text-sm text-pink-200/80 font-semibold">💰 Annual Savings</p>
              </div>
              <p className="text-sm text-pink-200/70 font-semibold text-center">🔋 100 kW battery • ⏱️ 4.5 year payback</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Decorative floating elements */}
        <div className="absolute top-12 left-12 text-6xl animate-bounce" style={{ animationDuration: '3s' }}>🏨</div>
        <div className="absolute bottom-12 right-12 text-5xl animate-pulse" style={{ animationDuration: '2s' }}>💰</div>
        <div className="absolute top-20 right-24 text-4xl animate-bounce" style={{ animationDuration: '4s' }}>⚡</div>
        <div className="absolute bottom-20 left-24 text-4xl animate-pulse" style={{ animationDuration: '3s' }}>🔋</div>
        
        {/* Gradient background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-purple-900/40 to-pink-900/30 blur-3xl" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 px-5 py-2 rounded-full border-2 border-purple-400/50 mb-6 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-purple-100 font-black tracking-wide">🚀 LIMITED TIME OFFER</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Improve Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Bottom Line?</span>
          </h2>
          <p className="text-xl text-indigo-200 mb-8 font-bold">
            ✅ Free consultation • ✅ No obligation • ✅ Takes 2 minutes
          </p>
          
          {/* Big CTA Button with pulse */}
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 text-white px-14 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 border-3 border-purple-300/50 animate-pulse group"
            style={{ animationDuration: '2s' }}
          >
            <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
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
                <p className="text-white font-bold">Hotel Energy Partners</p>
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
            © {new Date().getFullYear()} Hotel Energy Partners. All rights reserved.
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
          WIZARD MODAL - Uses StreamlinedWizard with hotel pre-selected
          ═══════════════════════════════════════════════════════════════════════ */}
      {showWizard && (
        <StreamlinedWizard
          show={showWizard}
          initialUseCase="hotel"
          initialState={inputs.state}
          initialData={{
            // Core facility data from hero calculator
            roomCount: inputs.numberOfRooms,
            squareFootage: inputs.squareFootage,
            hotelClass: inputs.hotelClass,
            
            // Amenity flags - will be mapped to selectedAmenities array by hook
            hasPool: inputs.hasPool || inputs.hasIndoorPool || inputs.hasOutdoorPool,
            hasIndoorPool: inputs.hasIndoorPool,
            hasOutdoorPool: inputs.hasOutdoorPool,
            hasRestaurant: inputs.hasRestaurant,
            hasSpa: inputs.hasSpa,
            hasFitnessCenter: inputs.hasFitnessCenter,
            hasLaundry: inputs.hasLaundry,
            hasEVCharging: inputs.hasEVCharging,
            hasConferenceCenter: inputs.hasConferenceCenter,
            hasEventCenter: inputs.hasEventCenter,
            hasClubhouse: inputs.hasClubhouse,
            hasGolfCourse: inputs.hasGolfCourse,
            
            // Counts (for detailed calculations)
            evChargerCount: inputs.evChargerCount,
            elevatorCount: inputs.elevatorCount,
            restaurantCount: inputs.restaurantCount,
            laundryMachineCount: inputs.laundryMachineCount,
            golfCartCount: inputs.golfCartCount,
            parkingLotSize: inputs.parkingLotSize,
            
            // Billing and estimates
            currentMonthlyBill: inputs.currentMonthlyBill,
            storageHours: inputs.storageHours,
            estimatedAnnualSavings: heroEstimate.savings,
            estimatedPayback: heroEstimate.payback,
          }}
          onClose={() => setShowWizard(false)}
          onFinish={() => {
            setShowWizard(false);
          }}
        />
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
      
      {/* TrueQuote Modal */}
      <TrueQuoteModal 
        isOpen={showTrueQuoteModal} 
        onClose={() => setShowTrueQuoteModal(false)} 
      />
    </div>
  );
}
