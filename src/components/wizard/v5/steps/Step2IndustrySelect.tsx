/**
 * STEP 2: Industry Selection
 * ===========================
 * What type of business are you?
 * 
 * Design: Grid of industry cards with IMAGES and icons
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Hotel, ShoppingCart, Factory, Warehouse, 
  Car, Zap, Hospital, GraduationCap, Plane, Home,
  Server, Leaf, UtensilsCrossed, Search, Sparkles, Sun,
  Check, ArrowRight
} from 'lucide-react';
import { COLORS, STYLES } from '../design-system';
import { useCaseService, type UseCaseWithConfiguration } from '@/services/useCaseService';

// Import images
import hotelImg from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import hospitalImg from '@/assets/images/hospital_1.jpg';
import carWashImg from '@/assets/images/car_wash_valet.jpg';
import evChargingImg from '@/assets/images/ev_charging_station.jpg';
import dataCenterImg from '@/assets/images/data-centers/data-center-3.jpg';
import airportImg from '@/assets/images/airports_1.jpg';
import carWashRobotImg from '@/assets/images/car_wash_robot.jpg';
// New industry images
import manufacturingImg from '@/assets/images/manufacturing_1.jpg';
import logisticsImg from '@/assets/images/logistics_1.jpg';
import officeBuildingImg from '@/assets/images/office_building1.jpg';
import indoorFarmImg from '@/assets/images/indoor_farm1.jpeg';
import collegeImg from '@/assets/images/college_1.jpg';

// Image mapping for industries
const INDUSTRY_IMAGES: Record<string, string> = {
  'hotel': hotelImg,
  'hospital': hospitalImg,
  'car-wash': carWashImg,
  'ev-charging': evChargingImg,
  'data-center': dataCenterImg,
  'airport': airportImg,
  'manufacturing': manufacturingImg,
  'warehouse': logisticsImg,
  'logistics': logisticsImg,
  'office': officeBuildingImg,
  'office-building': officeBuildingImg,
  'indoor-farm': indoorFarmImg,
  'indoor-agriculture': indoorFarmImg,
  'college': collegeImg,
  'university': collegeImg,
  'college-university': collegeImg,
};

// Icon mapping for industries (fallback when no image)
const INDUSTRY_ICONS: Record<string, any> = {
  'hotel': Hotel,
  'office': Building2,
  'retail': ShoppingCart,
  'manufacturing': Factory,
  'warehouse': Warehouse,
  'ev-charging': Car,
  'car-wash': Car,
  'hospital': Hospital,
  'college': GraduationCap,
  'airport': Plane,
  'residential': Home,
  'data-center': Server,
  'indoor-farm': Leaf,
  'restaurant': UtensilsCrossed,
  'default': Building2,
};

// Color mapping matching design reference
const INDUSTRY_COLORS: Record<string, { gradient: string; border: string; icon: string }> = {
  'hotel': { gradient: 'from-amber-500 to-yellow-500', border: 'amber-500', icon: '🏨' },
  'office': { gradient: 'from-blue-500 to-blue-600', border: 'blue-500', icon: '🏢' },
  'retail': { gradient: 'from-pink-500 to-pink-600', border: 'pink-500', icon: '🛍️' },
  'manufacturing': { gradient: 'from-emerald-500 to-emerald-600', border: 'emerald-500', icon: '🏭' },
  'warehouse': { gradient: 'from-orange-500 to-orange-600', border: 'orange-500', icon: '📦' },
  'ev-charging': { gradient: 'from-emerald-500 to-teal-500', border: 'emerald-500', icon: '🔌' },
  'car-wash': { gradient: 'from-cyan-500 to-blue-500', border: 'cyan-500', icon: '🚗' },
  'hospital': { gradient: 'from-rose-500 to-red-500', border: 'rose-500', icon: '🏥' },
  'college': { gradient: 'from-cyan-500 to-cyan-600', border: 'cyan-500', icon: '🎓' },
  'airport': { gradient: 'from-sky-500 to-blue-500', border: 'sky-500', icon: '✈️' },
  'residential': { gradient: 'from-purple-500 to-purple-600', border: 'purple-500', icon: '🏠' },
  'data-center': { gradient: 'from-blue-500 to-blue-600', border: 'blue-500', icon: '🖥️' },
  'indoor-farm': { gradient: 'from-lime-500 to-green-500', border: 'lime-500', icon: '🌾' },
  'casino': { gradient: 'from-amber-500 to-yellow-500', border: 'amber-500', icon: '🎰' },
  'default': { gradient: 'from-purple-500 to-purple-600', border: 'purple-500', icon: '🏢' },
};

interface Step2Props {
  selectedIndustry: string;
  onIndustrySelect: (slug: string, name: string) => void;
  solarOpportunity?: boolean; // True if location is good for solar
  onSolarClick?: () => void; // Callback when user clicks solar opportunity
  state?: string; // State for dynamic solar data
  electricityRate?: number; // Electricity rate for display
  peakSunHours?: number; // Peak sun hours for display
  solarRating?: string; // Solar rating for display
}

export const Step2IndustrySelect: React.FC<Step2Props> = ({
  selectedIndustry,
  onIndustrySelect,
  solarOpportunity = false,
  onSolarClick,
  state = '',
  electricityRate = 0.12,
  peakSunHours = 4.0,
  solarRating = 'Good',
}) => {
  const [industries, setIndustries] = useState<UseCaseWithConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch industries from database
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const useCases = await useCaseService.getAllUseCases();
        // Filter to active use cases only
        const active = useCases.filter((uc: UseCaseWithConfiguration) => uc.is_active !== false);
        setIndustries(active);
      } catch (error) {
        console.error('Failed to fetch industries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  // Filter industries by search
  const filteredIndustries = industries.filter(industry => 
    industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Popular industries to show first (ones with images) - sorted alphabetically
  const popularSlugs = ['hotel', 'car-wash', 'ev-charging', 'hospital', 'data-center', 'airport', 'manufacturing', 'warehouse', 'logistics', 'office', 'office-building', 'indoor-farm', 'indoor-agriculture', 'college', 'university', 'college-university'];
  const popularIndustries = filteredIndustries
    .filter(i => popularSlugs.includes(i.slug))
    .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical order
  const otherIndustries = filteredIndustries
    .filter(i => !popularSlugs.includes(i.slug))
    .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical order

  const getIcon = (slug: string) => INDUSTRY_ICONS[slug] || INDUSTRY_ICONS.default;
  const getColor = (slug: string) => INDUSTRY_COLORS[slug] || INDUSTRY_COLORS.default;
  const getImage = (slug: string) => INDUSTRY_IMAGES[slug] || null;
  
  // Get emoji icon for industries
  const getEmojiIcon = (slug: string) => INDUSTRY_COLORS[slug]?.icon || INDUSTRY_COLORS.default.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500">Loading industries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-4xl mx-auto px-4 py-4 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide">
      {/* Solar Opportunity Panel - Redesigned */}
      {solarOpportunity && (
        <div className="mb-8">
          <button
            onClick={onSolarClick}
            className="w-full rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 group cursor-pointer text-left"
          >
            {/* Orange Header */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sun className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Great Solar Potential in Your Area!</h3>
                    <p className="text-orange-100 text-sm flex items-center gap-2">
                      <span>📍</span> {state || 'Your Location'} • <span>⭐</span> {solarRating} for Solar
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="px-4 py-2 rounded-full bg-white/20 text-white font-semibold text-sm">
                    Top 10% in USA
                  </span>
                  <ArrowRight className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-6 py-5 grid grid-cols-3 gap-4 border-x border-slate-700">
              <div className="text-center">
                <div className="text-amber-400 text-xs font-semibold mb-1 flex items-center justify-center gap-1">
                  <span>⚡</span> Peak Sun Hours
                </div>
                <div className="text-3xl font-bold text-white">{peakSunHours.toFixed(1)}</div>
                <div className="text-xs text-gray-400">hours/day average</div>
              </div>
              <div className="text-center border-x border-slate-700">
                <div className="text-amber-400 text-xs font-semibold mb-1 flex items-center justify-center gap-1">
                  <span>🏆</span> Solar Rating
                </div>
                <div className="text-2xl font-bold text-white">{solarRating}</div>
                <div className="text-xs text-emerald-400 flex items-center justify-center gap-1">
                  <span>⭐</span> Great for solar!
                </div>
              </div>
              <div className="text-center">
                <div className="text-amber-400 text-xs font-semibold mb-1 flex items-center justify-center gap-1">
                  <span>💰</span> Avg Utility Rate
                </div>
                <div className="text-3xl font-bold text-white">${electricityRate.toFixed(2)}</div>
                <div className="text-xs text-gray-400">per kWh</div>
              </div>
            </div>
            
            {/* Bottom Message */}
            <div className="bg-slate-900 px-6 py-4 border-x border-b border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-gray-300 text-sm">
                  <span className="text-emerald-400 font-semibold">💡 Tip:</span> Adding solar panels could reduce your payback time by 2-3 years
                </p>
                <span className="text-amber-400 text-sm font-medium">Configure in Step 3 →</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search industries..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700
              hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 
              focus:outline-none transition-all duration-200"
          />
        </div>
      </div>

      {/* Featured Industries with Photos */}
      {popularIndustries.length > 0 && !searchTerm && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-300">⭐ Featured Industries</h2>
          <p className="text-gray-500 mb-6">Top industries with background images</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {popularIndustries.map((industry) => {
              const Icon = getIcon(industry.slug);
              const isSelected = selectedIndustry === industry.slug;
              const image = getImage(industry.slug);
              const colorInfo = getColor(industry.slug);
              
              return (
                <button
                  key={industry.slug}
                  onClick={() => onIndustrySelect(industry.slug, industry.name)}
                  className={`group relative h-48 rounded-2xl overflow-hidden border transition-all duration-300 ${
                    isSelected 
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-500/50 animate-pulse' 
                      : 'border-white/10 hover:border-purple-400/50'
                  }`}
                >
                  {/* Background Image */}
                  {image ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-900">
                        <img 
                          src={image} 
                          alt={industry.name}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                        />
                      </div>
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
                  )}
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-bold text-white text-xl mb-1">{industry.name}</h3>
                    {/* Description shown on hover via title attribute */}
                  </div>
                  
                  {/* Hover tooltip for description */}
                  {industry.description && industry.slug !== 'office' && industry.slug !== 'office-building' && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {industry.description}
                    </div>
                  )}
                  
                  {/* Selected Checkmark - Green for selection */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </div>
                  )}
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 ring-2 ring-transparent group-hover:ring-purple-500/50 rounded-2xl transition-all pointer-events-none"></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* More Industries - Icon Cards */}
      <div className="pb-20 flex-1">
        <h2 className="text-2xl font-bold mb-2 text-gray-300">
          {searchTerm ? 'Search Results' : '🏢 More Industries'}
        </h2>
        {!searchTerm && <p className="text-gray-500 mb-6">Additional industry options</p>}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(searchTerm ? filteredIndustries : otherIndustries).map((industry) => {
            const Icon = getIcon(industry.slug);
            const isSelected = selectedIndustry === industry.slug;
            const colorInfo = getColor(industry.slug);
            
            return (
              <button
                key={industry.slug}
                onClick={() => onIndustrySelect(industry.slug, industry.name)}
                className={`group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border text-left transition-all duration-300 ${
                  isSelected
                    ? `bg-gradient-to-br from-emerald-600/30 to-green-700/30 border-2 border-emerald-500 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-500/50 animate-pulse`
                    : 'border-white/10 hover:border-white/20 hover:shadow-lg hover:-translate-y-1'
                }`}
              >
                {/* Selected Checkmark - Green for selection */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}
                
                <h3 className="font-bold text-white text-lg mb-1">{industry.name}</h3>
                {/* Description shown on hover via title attribute */}
                {industry.description && industry.slug !== 'office' && industry.slug !== 'office-building' && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {industry.description}
                  </div>
                )}
                
                {/* Hover glow */}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-2xl bg-transparent group-hover:bg-purple-500/5 transition-colors pointer-events-none"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* No results */}
      {filteredIndustries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-white/40" />
          </div>
          <p className="text-white/60">No industries found matching "{searchTerm}"</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-purple-400 hover:text-purple-300 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default Step2IndustrySelect;
