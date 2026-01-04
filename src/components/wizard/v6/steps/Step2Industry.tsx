/**
 * V6 Step 2: Industry Selection with Images
 * Updated: December 30, 2025 - Larger fonts for better readability
 */
import React from 'react';
import { Check } from 'lucide-react';
import type { WizardState } from '../types';

// Industry images
import hotelImg from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import carWashImg from '@/assets/images/Car_Wash_PitStop.jpg';
import evChargingImg from '@/assets/images/ev_charging_station.jpg';
import manufacturingImg from '@/assets/images/manufacturing_1.jpg';
import dataCenterImg from '@/assets/images/data-centers/data-center-1.jpg';
import hospitalImg from '@/assets/images/hospital_1.jpg';
import retailImg from '@/assets/images/retail_1.jpg';
import officeImg from '@/assets/images/office_building1.jpg';
import collegeImg from '@/assets/images/college_1.jpg';
import warehouseImg from '@/assets/images/logistics_1.jpg';
import restaurantImg from '@/assets/images/restaurant_1.jpg';
import agricultureImg from '@/assets/images/indoor_farm1.jpeg';

const INDUSTRIES = [
  { slug: 'hotel', name: 'Hotel / Hospitality', image: hotelImg },
  { slug: 'car_wash', name: 'Car Wash', image: carWashImg },
  { slug: 'ev_charging', name: 'EV Charging Hub', image: evChargingImg },
  { slug: 'manufacturing', name: 'Manufacturing', image: manufacturingImg },
  { slug: 'data_center', name: 'Data Center', image: dataCenterImg },
  { slug: 'hospital', name: 'Hospital / Healthcare', image: hospitalImg },
  { slug: 'retail', name: 'Retail / Commercial', image: retailImg },
  { slug: 'office', name: 'Office Building', image: officeImg },
  { slug: 'college', name: 'College / University', image: collegeImg },
  { slug: 'warehouse', name: 'Warehouse / Logistics', image: warehouseImg },
  { slug: 'restaurant', name: 'Restaurant', image: restaurantImg },
  { slug: 'agriculture', name: 'Agriculture', image: agricultureImg },
];

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
}

export function Step2Industry({ state, updateState }: Props) {
  const selectIndustry = (slug: string, name: string) => {
    updateState({ industry: slug, industryName: name });
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-3">Select Your Industry</h1>
        <p className="text-purple-300 text-lg">This helps us customize your energy solution</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
        {INDUSTRIES.map((industry) => {
          const isSelected = state.industry === industry.slug;
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

      {state.industry && (
        <div className="max-w-md mx-auto p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
          <p className="text-emerald-400 font-medium text-lg">✓ Selected: <strong>{state.industryName}</strong></p>
        </div>
      )}
    </div>
  );
}
