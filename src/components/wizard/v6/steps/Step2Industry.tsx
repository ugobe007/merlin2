/**
 * V6 Step 2: Industry Selection with Images
 * Updated: January 14, 2026 - All 22 use cases from database
 * NOTE: MerlinAdvisor is now rendered at WizardV6 level (unified advisor)
 */
import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import type { WizardState, BusinessSizeTier, QuestionnaireDepth } from '../types';
import { INDUSTRY_NAMES } from '@/services/googlePlacesService';
import { BusinessSizePanel } from '../components/BusinessSizePanel';

// Industry images
import hotelImg from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import carWashImg from '@/assets/images/Car_Wash_PitStop.jpg';
import evChargingImg from '@/assets/images/ev_charging_hub2.jpg';
import manufacturingImg from '@/assets/images/manufacturing_1.jpg';
import dataCenterImg from '@/assets/images/data-center-1.jpg';
import hospitalImg from '@/assets/images/hospital_1.jpg';
import retailImg from '@/assets/images/retail_2.jpg';
import officeImg from '@/assets/images/office_building1.jpg';
import collegeImg from '@/assets/images/college_1.jpg';
import warehouseImg from '@/assets/images/logistics_1.jpg';
import agricultureImg from '@/assets/images/agriculture_1.jpg';
import truckStopImg from '@/assets/images/truck_stop.png';
import airportImg from '@/assets/images/airport_11.jpeg';
import indoorFarmImg from '@/assets/images/indoor_farm1.jpg';
import shoppingCenterImg from '@/assets/images/shopping_center.jpg';
import coldStorageImg from '@/assets/images/cold_storage.jpg';
import apartmentImg from '@/assets/images/apartment_building.jpg';
import residentialImg from '@/assets/images/residential.jpg';
import restaurantImg from '@/assets/images/restaurant_1.jpg';
import casinoImg from '@/assets/images/casino_gaming1.jpg';

// All 20 use cases from database - slugs must match exactly
const INDUSTRIES = [
  // Commercial
  { slug: 'hotel', name: 'Hotel / Hospitality', image: hotelImg },
  { slug: 'car-wash', name: 'Car Wash', image: carWashImg },
  { slug: 'restaurant', name: 'Restaurant', image: restaurantImg },
  { slug: 'retail', name: 'Retail / Commercial', image: retailImg },
  { slug: 'shopping-center', name: 'Shopping Center / Mall', image: shoppingCenterImg },
  { slug: 'office', name: 'Office Building', image: officeImg },
  { slug: 'casino', name: 'Casino & Gaming', image: casinoImg },
  
  // Transportation & Logistics
  { slug: 'heavy_duty_truck_stop', name: 'Truck Stop / Travel Center', image: truckStopImg },
  { slug: 'ev-charging', name: 'EV Charging Hub', image: evChargingImg },
  { slug: 'warehouse', name: 'Warehouse / Logistics', image: warehouseImg },
  { slug: 'airport', name: 'Airport', image: airportImg },
  
  // Industrial
  { slug: 'manufacturing', name: 'Manufacturing', image: manufacturingImg },
  { slug: 'data-center', name: 'Data Center', image: dataCenterImg },
  { slug: 'cold-storage', name: 'Cold Storage', image: coldStorageImg },
  
  // Institutional
  { slug: 'hospital', name: 'Hospital / Healthcare', image: hospitalImg },
  { slug: 'college', name: 'College / University', image: collegeImg },
  
  // Agricultural
  { slug: 'agricultural', name: 'Agriculture', image: agricultureImg },
  { slug: 'indoor-farm', name: 'Indoor / Vertical Farm', image: indoorFarmImg },
  
  // Residential
  { slug: 'apartment', name: 'Apartment Complex', image: apartmentImg },
  { slug: 'residential', name: 'Residential', image: residentialImg },
];

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext?: () => void;
}

export function Step2Industry({ state, updateState, onNext }: Props) {
  // Track if we should show the business size panel
  const [showSizePanel, setShowSizePanel] = useState(false);
  const [pendingIndustry, setPendingIndustry] = useState<{ slug: string; name: string } | null>(null);
  
  // If coming from Step 1 with business name (auto-detected), we already may have size info
  // Check if businessSizeTier is already set from Step 1's savings preview
  const hasPresetSize = state.businessName && state.businessSizeTier;
  
  const selectIndustry = (slug: string, name: string) => {
    // First update the industry
    updateState({ industry: slug, industryName: name });
    
    // If user came from business lookup with size already set, don't show panel
    if (hasPresetSize) {
      // Auto-proceed if onNext is provided
      if (onNext) setTimeout(onNext, 500);
      return;
    }
    
    // Show the business size panel for manual selection
    setPendingIndustry({ slug, name });
    setShowSizePanel(true);
  };
  
  const handleSizeSelect = (size: BusinessSizeTier, depth: QuestionnaireDepth) => {
    updateState({ 
      businessSizeTier: size,
      questionnaireDepth: depth
    });
    setShowSizePanel(false);
    // Auto-proceed to Step 3
    if (onNext) setTimeout(onNext, 300);
  };

  // Normalize industry slug (handle both dash and underscore formats)
  const normalizeSlug = (slug: string) => slug?.replace(/-/g, '_');
  const detectedSlug = state.detectedIndustry ? normalizeSlug(state.detectedIndustry) : null;
  
  return (
    <div className="relative space-y-8 pb-8">
      {/* NOTE: MerlinAdvisor is now rendered at WizardV6 level for all steps */}
      
      {/* Pre-detected Industry Banner */}
      {state.businessName && detectedSlug && (
        <div className="max-w-3xl mx-auto mb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border border-green-500/50 shadow-lg shadow-green-500/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 font-bold">🧙 Merlin detected your business!</span>
                </div>
                <p className="text-white">
                  <span className="font-semibold">{state.businessName}</span>
                  {state.businessAddress && (
                    <span className="text-slate-400 text-sm ml-2">• {state.businessAddress}</span>
                  )}
                </p>
                <p className="text-emerald-300 text-sm mt-1">
                  Industry: <span className="font-semibold">{INDUSTRY_NAMES[state.detectedIndustry || ''] || state.industryName || 'Unknown'}</span>
                  {' '}— Confirm below or select a different industry
                </p>
              </div>
              {state.businessPhotoUrl && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500/50 flex-shrink-0">
                  <img src={state.businessPhotoUrl} alt={state.businessName} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-3">
          {state.businessName ? 'Confirm Your Industry' : 'Select Your Industry'}
        </h1>
        <p className="text-purple-300 text-lg">This helps us customize your energy solution</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {INDUSTRIES.map((industry) => {
          const isSelected = state.industry === industry.slug || 
                             normalizeSlug(state.industry) === industry.slug ||
                             state.industry === industry.slug.replace(/_/g, '-');
          return (
            <button
              key={industry.slug}
              onClick={() => selectIndustry(industry.slug, industry.name)}
              className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                isSelected 
                  ? 'ring-4 ring-purple-500 scale-105 shadow-xl shadow-purple-500/30' 
                  : 'hover:scale-102 hover:shadow-lg'
              }`}
            >
              {/* Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={industry.image} 
                  alt={industry.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isSelected ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                />
              </div>

              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity ${
                isSelected ? 'opacity-90' : 'opacity-70 group-hover:opacity-80'
              }`} />

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Label - LARGER FONTS */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className={`font-bold text-base sm:text-lg text-center leading-tight ${
                  isSelected ? 'text-white' : 'text-white/90'
                }`}>
                  {industry.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {state.industry && !showSizePanel && (
        <div className="max-w-md mx-auto p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
          <p className="text-emerald-400 font-medium text-lg">✓ Selected: <strong>{state.industryName}</strong></p>
          {state.businessSizeTier && (
            <p className="text-emerald-300 text-sm mt-1">
              Size: <strong className="capitalize">{state.businessSizeTier.replace('_', ' ')}</strong> • 
              Questionnaire: <strong className="capitalize">{state.questionnaireDepth}</strong>
            </p>
          )}
        </div>
      )}
      
      {/* Business Size Selection Panel */}
      {showSizePanel && (
        <BusinessSizePanel
          industry={pendingIndustry?.slug || state.industry || ''}
          industryName={pendingIndustry?.name || state.industryName || ''}
          selectedSize={state.businessSizeTier}
          onSelectSize={handleSizeSelect}
          onSkip={() => {
            // Default to 'standard' questionnaire if skipped
            handleSizeSelect('medium', 'standard');
          }}
          onClose={() => setShowSizePanel(false)}
        />
      )}
    </div>
  );
}
