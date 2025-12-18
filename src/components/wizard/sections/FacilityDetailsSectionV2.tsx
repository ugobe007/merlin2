// ═══════════════════════════════════════════════════════════════════════════
// FACILITY DETAILS SECTION V2 (Section 1 for Vertical Landing Pages)
// Complete redesign - Dec 16, 2025
// 
// Features:
// 1. Smart dropdowns with conditional prompts (1M sqft → resort/casino prompt)
// 2. Pill-shaped amenity buttons (matching hero calculator style)
// 3. Pre-populated values from hero calculator
// 4. State selector visible (in case user missed it on hero)
// 5. Auto-advance when all required fields complete
// 6. Removes duplicate questions already answered on hero calculator
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react';
import { 
  MapPin, 
  Building2, 
  CheckCircle, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Waves,
  Dumbbell,
  Utensils,
  Users,
  Sparkles,
  Car,
  Sun,
  Coffee,
  Shirt,
  Wifi,
  Wind,
  TreePine,
  Star,
  Briefcase,
  Hotel,
  Castle,
  Landmark,
  Building,
  Home,
  Crown,
  Tent,
  Palmtree,
} from 'lucide-react';
import type { WizardState } from '../types/wizardTypes';
import { StepExplanation } from '../ui';

// US States for the state selector
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

// Smart property type suggestions based on size
const PROPERTY_TYPE_BY_SIZE = {
  small: { // < 100 rooms
    types: [
      { id: 'boutique', label: 'Boutique Hotel', icon: Home, description: 'Intimate, unique character' },
      { id: 'motel', label: 'Motel / Inn', icon: Hotel, description: 'Roadside or budget accommodation' },
      { id: 'bed_breakfast', label: 'Bed & Breakfast', icon: Coffee, description: 'Small, personalized service' },
    ]
  },
  medium: { // 100-300 rooms
    types: [
      { id: 'business', label: 'Business Hotel', icon: Briefcase, description: 'Meeting rooms, business center' },
      { id: 'extended_stay', label: 'Extended Stay', icon: Building, description: 'Kitchenettes, longer stays' },
      { id: 'full_service', label: 'Full-Service Hotel', icon: Hotel, description: 'Restaurant, amenities, services' },
    ]
  },
  large: { // 300-500 rooms
    types: [
      { id: 'convention', label: 'Convention Hotel', icon: Users, description: 'Large event spaces, ballrooms' },
      { id: 'resort', label: 'Resort Hotel', icon: Palmtree, description: 'Destination amenities, recreation' },
      { id: 'luxury', label: 'Luxury Hotel', icon: Star, description: 'Premium service, high-end amenities' },
    ]
  },
  mega: { // > 500 rooms OR > 500,000 sqft
    types: [
      { id: 'mega_resort', label: 'Mega Resort', icon: Castle, description: 'Multiple venues, entertainment' },
      { id: 'casino_resort', label: 'Casino Resort', icon: Crown, description: 'Gaming, entertainment complex' },
      { id: 'convention_center', label: 'Convention Center Hotel', icon: Landmark, description: 'Massive event capacity' },
      { id: 'integrated_resort', label: 'Integrated Resort', icon: Tent, description: 'Mixed-use destination' },
    ]
  }
};

// Amenity categories with pill-style buttons - MERLIN COLOR PALETTE
const AMENITY_CATEGORIES = {
  aquatics: {
    label: 'Pool & Aquatics',
    icon: Waves,
    color: 'malibu', // #68BFFA - Light blue
    options: [
      { id: 'indoor_pool', label: 'Indoor Pool', icon: Waves },
      { id: 'outdoor_pool', label: 'Outdoor Pool', icon: Waves },
      { id: 'hot_tub', label: 'Hot Tub / Jacuzzi', icon: Sparkles },
      { id: 'water_park', label: 'Water Park', icon: Waves },
    ]
  },
  wellness: {
    label: 'Wellness & Fitness',
    icon: Dumbbell,
    color: 'merlinPurple', // #6700b6 - Merlin primary
    options: [
      { id: 'fitness_center', label: 'Fitness Center', icon: Dumbbell },
      { id: 'spa', label: 'Full Spa', icon: Sparkles },
      { id: 'sauna', label: 'Sauna / Steam', icon: Wind },
      { id: 'golf', label: 'Golf Course', icon: TreePine },
    ]
  },
  dining: {
    label: 'Food & Beverage',
    icon: Utensils,
    color: 'webOrange', // #ffa600 - Orange accent
    options: [
      { id: 'restaurant', label: 'Restaurant(s)', icon: Utensils },
      { id: 'bar_lounge', label: 'Bar / Lounge', icon: Coffee },
      { id: 'room_service', label: 'Room Service', icon: Hotel },
      { id: 'banquet', label: 'Banquet Facilities', icon: Users },
    ]
  },
  business: {
    label: 'Business & Events',
    icon: Briefcase,
    color: 'arapawa', // #060F76 - Dark navy
    options: [
      { id: 'meeting_rooms', label: 'Meeting Rooms', icon: Users },
      { id: 'conference_center', label: 'Conference Center', icon: Briefcase },
      { id: 'ballroom', label: 'Ballroom', icon: Star },
      { id: 'business_center', label: 'Business Center', icon: Wifi },
    ]
  },
  services: {
    label: 'Guest Services',
    icon: Star,
    color: 'peachOrange', // #FED19F - Peach accent
    options: [
      { id: 'laundry', label: 'On-Site Laundry', icon: Shirt },
      { id: 'ev_charging', label: 'EV Charging', icon: Car },
      { id: 'parking_garage', label: 'Parking Garage', icon: Building },
      { id: 'solar_existing', label: 'Existing Solar', icon: Sun },
    ]
  }
};

// MERLIN COLOR PALETTE - Official brand colors with hex values
const AMENITY_COLORS: Record<string, { selected: string; unselected: string; border: string }> = {
  // Malibu Blue - #68BFFA
  malibu: {
    selected: 'bg-[#0893f1] text-white border-[#067ecf]',
    unselected: 'bg-[#8dcefb]/20 text-[#0569ac] border-[#68BFFA] hover:bg-[#6ac0fa]/30 hover:border-[#48b1f8]',
    border: 'border-[#68BFFA]'
  },
  // Merlin Purple - #6700b6
  merlinPurple: {
    selected: 'bg-[#6700b6] text-white border-[#50008e]',
    unselected: 'bg-[#cc89ff]/20 text-[#6500b2] border-[#ad42ff] hover:bg-[#bc66ff]/30 hover:border-[#9d1eff]',
    border: 'border-[#ad42ff]'
  },
  // Web Orange - #ffa600
  webOrange: {
    selected: 'bg-[#f9a200] text-white border-[#d68b00]',
    unselected: 'bg-[#ffd689]/20 text-[#b27400] border-[#ffbd42] hover:bg-[#ffc966]/30 hover:border-[#ffb01e]',
    border: 'border-[#ffbd42]'
  },
  // Arapawa Navy - #060F76
  arapawa: {
    selected: 'bg-[#060F76] text-white border-[#050c65]',
    unselected: 'bg-[#8f97f9]/20 text-[#0815a9] border-[#4b59f5] hover:bg-[#6d78f7]/30 hover:border-[#2939f4]',
    border: 'border-[#4b59f5]'
  },
  // Peach Orange - #FED19F
  peachOrange: {
    selected: 'bg-[#f78302] text-white border-[#d37002]',
    unselected: 'bg-[#fdc78a]/20 text-[#8d4b01] border-[#fda544] hover:bg-[#fdb667]/30 hover:border-[#fc9420]',
    border: 'border-[#fda544]'
  },
  // Keep purple as fallback
  purple: {
    selected: 'bg-[#6700b6] text-white border-[#50008e]',
    unselected: 'bg-[#cc89ff]/20 text-[#6500b2] border-[#ad42ff] hover:bg-[#bc66ff]/30 hover:border-[#9d1eff]',
    border: 'border-[#ad42ff]'
  }
};

interface FacilityDetailsSectionV2Props {
  wizardState: WizardState;
  setWizardState: React.Dispatch<React.SetStateAction<WizardState>>;
  currentSection: number;
  initializedFromVertical?: boolean;
  sectionRef?: (el: HTMLDivElement | null) => void;
  onBack: () => void;
  onContinue: () => void;
  onHome?: () => void; // Navigate to vertical landing page
}

export function FacilityDetailsSectionV2({
  wizardState,
  setWizardState,
  currentSection,
  initializedFromVertical = false,
  sectionRef,
  onBack,
  onContinue,
  onHome,
}: FacilityDetailsSectionV2Props) {
  // Local state for expanded sections
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showPropertyTypePrompt, setShowPropertyTypePrompt] = useState(false);
  
  // Get selected amenities from useCaseData
  const selectedAmenities = wizardState.useCaseData?.selectedAmenities || [];
  
  // Determine size category based on room count or square footage
  const getSizeCategory = useCallback(() => {
    const rooms = wizardState.useCaseData?.roomCount || wizardState.facilitySize || 0;
    const sqft = wizardState.useCaseData?.squareFootage || 0;
    
    // Check for mega properties first
    if (rooms > 500 || sqft > 500000) return 'mega';
    if (rooms > 300 || sqft > 300000) return 'large';
    if (rooms > 100 || sqft > 100000) return 'medium';
    return 'small';
  }, [wizardState.useCaseData?.roomCount, wizardState.useCaseData?.squareFootage, wizardState.facilitySize]);
  
  // Show property type prompt when entering large/mega territory
  useEffect(() => {
    const category = getSizeCategory();
    if ((category === 'large' || category === 'mega') && !wizardState.useCaseData?.propertyType) {
      setShowPropertyTypePrompt(true);
    }
  }, [getSizeCategory, wizardState.useCaseData?.propertyType]);
  
  // Check if form is complete for enabling Continue button
  // Dec 17, 2025 FIX: For hotels, property type is AUTO-DETERMINED from room count
  // Don't block Continue on propertyType - it's informational, not required
  const isFormComplete = useCallback(() => {
    const hasLocation = !!wizardState.state;
    const hasRoomCount = (wizardState.useCaseData?.roomCount || 0) > 0 || wizardState.facilitySize > 0;
    
    // FIXED: Property type is OPTIONAL for all industries
    // Large/mega properties get a PROMPT but it's not required
    // Hotels auto-determine class from room count anyway
    
    // Debug logging
    console.log('📋 [FacilityV2] isFormComplete check:', {
      hasLocation,
      hasRoomCount,
      state: wizardState.state,
      roomCount: wizardState.useCaseData?.roomCount || wizardState.facilitySize,
      propertyType: wizardState.useCaseData?.propertyType,
      sizeCategory: getSizeCategory(),
      result: hasLocation && hasRoomCount,
    });
    
    // Only require location + room count - propertyType is optional enhancement
    return hasLocation && hasRoomCount;
  }, [wizardState.state, wizardState.useCaseData?.roomCount, wizardState.facilitySize, getSizeCategory]);
  
  // Dec 17, 2025 - DISABLED AUTO-ADVANCE
  // Auto-advance was causing issues when user came from vertical landing page
  // with pre-populated data. User should ALWAYS click Continue to proceed.
  // This gives them a chance to review/modify their selections.
  
  // Toggle amenity selection
  const toggleAmenity = (amenityId: string) => {
    setWizardState(prev => {
      const current = prev.useCaseData?.selectedAmenities || [];
      const updated = current.includes(amenityId)
        ? current.filter((id: string) => id !== amenityId)
        : [...current, amenityId];
      
      return {
        ...prev,
        useCaseData: {
          ...prev.useCaseData,
          selectedAmenities: updated,
          // Also update individual flags for backwards compatibility
          hasPool: updated.some((id: string) => id.includes('pool')),
          hasRestaurant: updated.includes('restaurant'),
          hasSpa: updated.includes('spa'),
          hasFitnessCenter: updated.includes('fitness_center'),
          hasConferenceCenter: updated.includes('conference_center') || updated.includes('meeting_rooms'),
          hasLaundry: updated.includes('laundry'),
        }
      };
    });
  };
  
  // Update property type
  const setPropertyType = (typeId: string) => {
    setWizardState(prev => ({
      ...prev,
      useCaseData: {
        ...prev.useCaseData,
        propertyType: typeId,
      }
    }));
    setShowPropertyTypePrompt(false);
  };
  
  // Update state selection
  const updateState = (newState: string) => {
    setWizardState(prev => ({
      ...prev,
      state: newState,
    }));
  };
  
  // Update room count
  const updateRoomCount = (count: number) => {
    setWizardState(prev => ({
      ...prev,
      facilitySize: count,
      useCaseData: {
        ...prev.useCaseData,
        roomCount: count,
      }
    }));
  };
  
  // Update square footage
  const updateSquareFootage = (sqft: number) => {
    setWizardState(prev => ({
      ...prev,
      useCaseData: {
        ...prev.useCaseData,
        squareFootage: sqft,
      }
    }));
  };
  
  const sizeCategory = getSizeCategory();
  const propertyTypes = PROPERTY_TYPE_BY_SIZE[sizeCategory];
  
  // Don't render if not on this section
  if (currentSection !== 2) return null;
  
  return (
    <div 
      ref={sectionRef}
      className="min-h-[calc(100vh-120px)] p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Welcome Banner removed - was redundant */}
        
        {/* ════════════════════════════════════════════════════════════════
            STEP EXPLANATION HEADER - Enhanced with Merlin's guidance
            ════════════════════════════════════════════════════════════════ */}
        <StepExplanation
          stepNumber={initializedFromVertical ? 1 : 2}
          totalSteps={initializedFromVertical ? 4 : 5}
          title="Confirm Your Property Details"
          description="I need a few details about your property to calculate accurate power requirements. The more detail you provide, the more precise your energy quote will be!"
          estimatedTime="1-2 minutes"
          tips={[
            "Larger properties typically benefit more from battery storage",
            "Select all amenities that apply - each one affects power calculations",
            "Don't worry about exact numbers - estimates work great!"
          ]}
          outcomes={[
            "Location",
            "Property Size", 
            "Property Type",
            "Amenities"
          ]}
        />
        
        {/* MAIN FORM CARD */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-purple-200/50 shadow-2xl">
          
          {/* ════════════════════════════════════════════════════════════════
              SECTION 1: LOCATION (State Selector with Dropdown)
          ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-3">
              <MapPin className="w-5 h-5 text-purple-500" />
              Location
            </label>
            <div className="relative">
              <select
                value={wizardState.state || ''}
                onChange={(e) => updateState(e.target.value)}
                className="w-full px-5 py-4 bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-full text-purple-900 text-lg font-bold focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer appearance-none pr-12 shadow-lg hover:shadow-purple-200/50"
              >
                <option value="" disabled>Select your state...</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 pointer-events-none" />
            </div>
            {wizardState.state && (
              <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {wizardState.state} electricity rates applied
              </p>
            )}
          </div>
          
          {/* ════════════════════════════════════════════════════════════════
              SECTION 2: PROPERTY SIZE (Smart Dropdown with Conditional)
          ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-3">
              <Building2 className="w-5 h-5 text-indigo-500" />
              Property Size
            </label>
            
            {/* Room Count - Number input for pre-populated values, dropdown for selecting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm text-gray-500 mb-1.5">Guest Rooms</label>
                {/* Show number input when pre-populated, allowing direct editing */}
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={wizardState.useCaseData?.roomCount || wizardState.facilitySize || ''}
                  onChange={(e) => updateRoomCount(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 150"
                  className="w-full px-4 py-3 bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300 rounded-full text-emerald-800 font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-lg hover:shadow-emerald-200/50"
                />
                {(wizardState.useCaseData?.roomCount || wizardState.facilitySize) > 0 && (
                  <span className="absolute right-4 bottom-3.5 text-sm text-emerald-600 font-bold">
                    rooms
                  </span>
                )}
              </div>
              
              <div className="relative">
                <label className="block text-sm text-gray-500 mb-1.5">Square Footage (optional)</label>
                <input
                  type="number"
                  min="1000"
                  max="5000000"
                  step="1000"
                  value={wizardState.useCaseData?.squareFootage || ''}
                  onChange={(e) => updateSquareFootage(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 100,000"
                  className="w-full px-4 py-3 bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-full text-amber-800 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all shadow-lg hover:shadow-amber-200/50"
                />
                {wizardState.useCaseData?.squareFootage > 0 && (
                  <span className="absolute right-4 bottom-3.5 text-sm text-amber-600 font-bold">
                    sqft
                  </span>
                )}
              </div>
            </div>
            
            {/* Smart Property Type Prompt - Shows for large/mega properties */}
            {showPropertyTypePrompt && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-amber-800">
                    {sizeCategory === 'mega' ? '🏰 Mega Property Detected!' : '⭐ Large Property Detected!'}
                  </span>
                </div>
                <p className="text-sm text-amber-700 mb-4">
                  Properties this size often have unique energy needs. What type best describes your property?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {propertyTypes.types.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPropertyType(type.id)}
                      className={`p-4 rounded-xl text-left transition-all border-2 ${
                        wizardState.useCaseData?.propertyType === type.id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-lg'
                          : 'bg-white border-amber-200 hover:border-amber-400 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <type.icon className={`w-5 h-5 ${wizardState.useCaseData?.propertyType === type.id ? 'text-white' : 'text-amber-500'}`} />
                        <span className="font-bold">{type.label}</span>
                      </div>
                      <p className={`text-xs mt-1 ${wizardState.useCaseData?.propertyType === type.id ? 'text-amber-100' : 'text-gray-500'}`}>
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* ════════════════════════════════════════════════════════════════
              SECTION 3: AMENITIES (Pill-Style Buttons like Hero Calculator)
          ════════════════════════════════════════════════════════════════ */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Property Amenities
            </label>
            <p className="text-sm text-gray-500 mb-4">Select all that apply (affects energy sizing)</p>
            
            {/* Amenity Categories */}
            <div className="space-y-5">
              {Object.entries(AMENITY_CATEGORIES).map(([categoryKey, category]) => {
                const colors = AMENITY_COLORS[category.color];
                const categorySelected = category.options.some(opt => selectedAmenities.includes(opt.id));
                
                return (
                  <div key={categoryKey} className={`p-4 rounded-xl border-2 transition-all ${
                    categorySelected ? colors.border : 'border-gray-200'
                  } bg-gray-50/50`}>
                    {/* Category Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <category.icon className={`w-4 h-4 ${categorySelected ? `text-${category.color}-500` : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${categorySelected ? `text-${category.color}-700` : 'text-gray-600'}`}>
                        {category.label}
                      </span>
                    </div>
                    
                    {/* Pill Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {category.options.map((option) => {
                        const isSelected = selectedAmenities.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => toggleAmenity(option.id)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                              isSelected ? colors.selected : colors.unselected
                            }`}
                          >
                            <option.icon className="w-4 h-4" />
                            {option.label}
                            {isSelected && <CheckCircle className="w-3.5 h-3.5 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* ════════════════════════════════════════════════════════════════
              NAVIGATION - Back / Home / Next Step (Dec 17, 2025 Spec)
          ════════════════════════════════════════════════════════════════ */}
          <div className="mt-8 pt-6 border-t border-white/10">
            {/* Validation messages */}
            {!isFormComplete() && (
              <p className="text-gray-400 text-sm mb-4 text-center">
                {!wizardState.state && '📍 Select your state'}
                {wizardState.state && !(wizardState.useCaseData?.roomCount || wizardState.facilitySize) && '🏨 Enter property size'}
                {wizardState.state && (wizardState.useCaseData?.roomCount || wizardState.facilitySize > 0) && selectedAmenities.length === 0 && '✨ Select at least one amenity'}
              </p>
            )}
            
            {/* Success message when form is complete */}
            {isFormComplete() && selectedAmenities.length > 0 && (
              <p className="text-emerald-400 text-sm mb-4 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Looking good! Click Next Step when ready.
              </p>
            )}
            
            {/* Navigation buttons - Back / Home / Next Step */}
            <div className="flex items-center justify-between">
              {/* Left side - Back and Home */}
              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-6 py-3 bg-[#060F76] border-2 border-[#6700b6] hover:bg-[#0a1a9a] text-white font-bold rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                
                <button
                  onClick={onHome || onBack} // Home navigates to vertical landing page
                  className="flex items-center justify-center w-12 h-12 bg-[#060F76] border-2 border-[#6700b6] hover:bg-[#0a1a9a] text-white rounded-xl transition-all"
                >
                  <Home className="w-5 h-5" />
                </button>
              </div>
              
              {/* Right side - Next Step */}
              <button
                onClick={() => {
                  console.log('🚀 [FacilityV2] Next Step clicked!', { 
                    currentSection,
                    isFormComplete: isFormComplete(),
                    amenities: selectedAmenities.length,
                  });
                  onContinue();
                }}
                disabled={!isFormComplete()}
                className="flex items-center gap-2 px-8 py-4 bg-[#6700b6] border-2 border-[#ffa600] hover:bg-[#7a00d4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilityDetailsSectionV2;
