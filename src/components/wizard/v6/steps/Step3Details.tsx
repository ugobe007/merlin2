/**
 * V6 Step 3: Facility Details - Expandable Panels
 * 
 * FIXES APPLIED:
 * 1. Better color contrast (amber/orange panels, green selected buttons)
 * 2. Scroll to TOP of panel when clicked
 * 3. Active Merlin prompts to fill questionnaire
 * 4. Merlin uses new_profile_.png icon
 * 
 * Updated: January 1, 2026
 */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Building2, Loader2, AlertCircle, ChevronDown, Check, Sun,
  Layers, Dumbbell, UtensilsCrossed, Settings, Car, Zap, PlugZap,
  Factory, Server, GraduationCap, Users, Thermometer, Droplets,
  Wind, Battery, DollarSign, Leaf, Shield, Clock, Calendar,
  Square, Gauge, Target, HelpCircle, CheckCircle2, Lock,
  Building, Home, Mountain, Truck, Coffee, Fuel, Activity,
  TrendingUp, TrendingDown, Waves, Sparkles, Monitor, Lightbulb,
  TreePine, Key, Warehouse, Shirt, Store, CircleOff, Flame,
  Snowflake, Box, Bot, Award, FileText, Star, Heart, Library,
  Briefcase, Theater, FlaskConical, Wrench, Cog, Package, Cpu,
  Sofa, Wifi, Umbrella, Bath, ShoppingBag, Plus, Minus, X,
  LayoutGrid, MapPin, Ruler, Circle, CircleDot, Castle, Dog,
  Recycle, RotateCw, MessageCircle,
  Plane, Bed, Stethoscope, HeartPulse, Scan, Radio, Atom,
  ArrowUpDown, DoorOpen, Bus, Scale, Landmark, Flag, Phone,
  Archive, BarChart, Feather, Ticket, Tag, Film, Baby,
  ShoppingCart, Calculator, Milk, Apple, Carrot, Cherry, Fish,
  Wheat, Tractor, CloudRain, Cloud, Cylinder, IceCream, Pill,
  Beef, Sprout, Fan, Dice5, Wine, Beer, Music, ChefHat,
  ConciergeBell, GitBranch, Unplug, ToggleRight, Infinity,
  ArrowUpRight, ArrowLeftRight, ArrowRight
} from 'lucide-react';
import type { WizardState } from '../types';
import { supabase } from '@/services/supabaseClient';

// Import Merlin image
import merlinIcon from '@/assets/images/new_profile_.png';

// Industry images for banners
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
import agricultureImg from '@/assets/images/agriculture.jpg';
import airportImg from '@/assets/images/airport_1.jpg';
import casinoImg from '@/assets/images/hotel_motel_holidayinn_2.jpg'; // Using hotel image as fallback
import indoorFarmImg from '@/assets/images/indoor_farm2.jpg';
import apartmentImg from '@/assets/images/office_building2.jpg'; // Using office image as fallback
import coldStorageImg from '@/assets/images/logistics_2.jpeg';
import shoppingCenterImg from '@/assets/images/retail_1.jpg'; // Using retail image
import governmentImg from '@/assets/images/office_building3.jpg'; // Using office image

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState> | ((prev: WizardState) => Partial<WizardState>)) => void;
}

interface CustomQuestion {
  id: string;
  use_case_id: string;
  question_text: string;
  question_type: 'select' | 'number' | 'boolean' | 'text' | 'multiselect';
  field_name: string;
  options: Array<{ label: string; value: string; icon?: string; description?: string }> | string[] | null;
  is_required: boolean;
  min_value: string | null;
  max_value: string | null;
  default_value: string | null;
  display_order: number;
  help_text: string | null;
  placeholder: string | null;
  is_advanced: boolean;
  section_name: string | null;
  icon_name: string | null;
}

interface Section {
  name: string;
  icon: string;
  questions: CustomQuestion[];
}

// ============================================================================
// COLOR SCHEME SYSTEM
// ============================================================================

interface ColorScheme {
  // Selected button styles
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
  selectedShadow: string;
  selectedIcon: string;
  // Hover styles
  hoverBorder: string;
  // Section header styles  
  sectionExpandedBg: string;
  sectionExpandedBorder: string;
  sectionExpandedShadow: string;
  sectionIcon: string;
  sectionBadge: string;
  sectionBadgeBorder: string;
  sectionBadgeText: string;
  // Number input styles
  numberButtonBg: string;
  numberButtonBorder: string;
  numberButtonHover: string;
  numberSliderAccent: string;
  // Question icon
  questionIconBg: string;
  questionIconBorder: string;
  questionIconText: string;
  // Text input focus styles
  textFocusBorder: string;
  textFocusRing: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  // Section 0: Amber Gold (Primary - Premium warm)
  {
    selectedBg: 'bg-amber-500/30',
    selectedBorder: 'border-amber-400/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-amber-500/25',
    selectedIcon: 'text-amber-100',
    hoverBorder: 'hover:border-amber-400/40',
    sectionExpandedBg: 'bg-amber-900/15',
    sectionExpandedBorder: 'border-amber-500/40',
    sectionExpandedShadow: 'shadow-amber-500/10',
    sectionIcon: 'text-amber-400',
    sectionBadge: 'bg-amber-500/30',
    sectionBadgeBorder: 'border-amber-400/50',
    sectionBadgeText: 'text-amber-200',
    numberButtonBg: 'bg-amber-500/20',
    numberButtonBorder: 'border-amber-400/40',
    numberButtonHover: 'hover:bg-amber-500/35',
    numberSliderAccent: 'accent-amber-500',
    questionIconBg: 'bg-amber-500/20',
    questionIconBorder: 'border-amber-400/30',
    questionIconText: 'text-amber-400',
    textFocusBorder: 'focus:border-amber-400/60',
    textFocusRing: 'focus:ring-amber-500/30',
  },
  // Section 1: Warm Orange (Energetic)
  {
    selectedBg: 'bg-orange-500/30',
    selectedBorder: 'border-orange-400/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-orange-500/25',
    selectedIcon: 'text-orange-100',
    hoverBorder: 'hover:border-orange-400/40',
    sectionExpandedBg: 'bg-orange-900/15',
    sectionExpandedBorder: 'border-orange-500/40',
    sectionExpandedShadow: 'shadow-orange-500/10',
    sectionIcon: 'text-orange-400',
    sectionBadge: 'bg-orange-500/30',
    sectionBadgeBorder: 'border-orange-400/50',
    sectionBadgeText: 'text-orange-200',
    numberButtonBg: 'bg-orange-500/20',
    numberButtonBorder: 'border-orange-400/40',
    numberButtonHover: 'hover:bg-orange-500/35',
    numberSliderAccent: 'accent-orange-500',
    questionIconBg: 'bg-orange-500/20',
    questionIconBorder: 'border-orange-400/30',
    questionIconText: 'text-orange-400',
    textFocusBorder: 'focus:border-orange-400/60',
    textFocusRing: 'focus:ring-orange-500/30',
  },
  // Section 2: Deep Purple (Accent - Rich)
  {
    selectedBg: 'bg-purple-600/30',
    selectedBorder: 'border-purple-500/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-purple-600/25',
    selectedIcon: 'text-purple-100',
    hoverBorder: 'hover:border-purple-500/40',
    sectionExpandedBg: 'bg-purple-950/20',
    sectionExpandedBorder: 'border-purple-600/40',
    sectionExpandedShadow: 'shadow-purple-600/10',
    sectionIcon: 'text-purple-400',
    sectionBadge: 'bg-purple-600/30',
    sectionBadgeBorder: 'border-purple-500/50',
    sectionBadgeText: 'text-purple-200',
    numberButtonBg: 'bg-purple-600/20',
    numberButtonBorder: 'border-purple-500/40',
    numberButtonHover: 'hover:bg-purple-600/35',
    numberSliderAccent: 'accent-purple-600',
    questionIconBg: 'bg-purple-600/20',
    questionIconBorder: 'border-purple-500/30',
    questionIconText: 'text-purple-400',
    textFocusBorder: 'focus:border-purple-500/60',
    textFocusRing: 'focus:ring-purple-600/30',
  },
  // Section 3: Violet-Blue (Light, airy - gradient feel)
  {
    selectedBg: 'bg-violet-400/30',
    selectedBorder: 'border-violet-300/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-violet-400/25',
    selectedIcon: 'text-violet-100',
    hoverBorder: 'hover:border-violet-300/40',
    sectionExpandedBg: 'bg-violet-900/15',
    sectionExpandedBorder: 'border-violet-400/40',
    sectionExpandedShadow: 'shadow-violet-400/10',
    sectionIcon: 'text-violet-300',
    sectionBadge: 'bg-violet-400/30',
    sectionBadgeBorder: 'border-violet-300/50',
    sectionBadgeText: 'text-violet-100',
    numberButtonBg: 'bg-violet-400/20',
    numberButtonBorder: 'border-violet-300/40',
    numberButtonHover: 'hover:bg-violet-400/35',
    numberSliderAccent: 'accent-violet-400',
    questionIconBg: 'bg-violet-400/20',
    questionIconBorder: 'border-violet-300/30',
    questionIconText: 'text-violet-300',
    textFocusBorder: 'focus:border-violet-300/60',
    textFocusRing: 'focus:ring-violet-400/30',
  },
  // Section 4: Teal (Trustworthy, Fresh)
  {
    selectedBg: 'bg-teal-500/30',
    selectedBorder: 'border-teal-400/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-teal-500/25',
    selectedIcon: 'text-teal-100',
    hoverBorder: 'hover:border-teal-400/40',
    sectionExpandedBg: 'bg-teal-900/15',
    sectionExpandedBorder: 'border-teal-500/40',
    sectionExpandedShadow: 'shadow-teal-500/10',
    sectionIcon: 'text-teal-400',
    sectionBadge: 'bg-teal-500/30',
    sectionBadgeBorder: 'border-teal-400/50',
    sectionBadgeText: 'text-teal-200',
    numberButtonBg: 'bg-teal-500/20',
    numberButtonBorder: 'border-teal-400/40',
    numberButtonHover: 'hover:bg-teal-500/35',
    numberSliderAccent: 'accent-teal-500',
    questionIconBg: 'bg-teal-500/20',
    questionIconBorder: 'border-teal-400/30',
    questionIconText: 'text-teal-400',
    textFocusBorder: 'focus:border-teal-400/60',
    textFocusRing: 'focus:ring-teal-500/30',
  },
  // Section 5: Sky Blue (Clean, Light)
  {
    selectedBg: 'bg-sky-500/30',
    selectedBorder: 'border-sky-400/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-sky-500/25',
    selectedIcon: 'text-sky-100',
    hoverBorder: 'hover:border-sky-400/40',
    sectionExpandedBg: 'bg-sky-900/15',
    sectionExpandedBorder: 'border-sky-500/40',
    sectionExpandedShadow: 'shadow-sky-500/10',
    sectionIcon: 'text-sky-400',
    sectionBadge: 'bg-sky-500/30',
    sectionBadgeBorder: 'border-sky-400/50',
    sectionBadgeText: 'text-sky-200',
    numberButtonBg: 'bg-sky-500/20',
    numberButtonBorder: 'border-sky-400/40',
    numberButtonHover: 'hover:bg-sky-500/35',
    numberSliderAccent: 'accent-sky-500',
    questionIconBg: 'bg-sky-500/20',
    questionIconBorder: 'border-sky-400/30',
    questionIconText: 'text-sky-400',
    textFocusBorder: 'focus:border-sky-400/60',
    textFocusRing: 'focus:ring-sky-500/30',
  },
];

// Get color scheme by section index (cycles through palette)
function getColorScheme(sectionIndex: number): ColorScheme {
  return COLOR_SCHEMES[sectionIndex % COLOR_SCHEMES.length];
}

// Industry to image mapping for banners
const INDUSTRY_IMAGES: Record<string, string> = {
  'hotel': hotelImg,
  'car_wash': carWashImg,
  'car-wash': carWashImg,
  'ev_charging': evChargingImg,
  'ev-charging': evChargingImg,
  'manufacturing': manufacturingImg,
  'data_center': dataCenterImg,
  'data-center': dataCenterImg,
  'hospital': hospitalImg,
  'retail': retailImg,
  'office': officeImg,
  'college': collegeImg,
  'warehouse': warehouseImg,
  'restaurant': restaurantImg,
  'agriculture': agricultureImg,
  'agricultural': agricultureImg,
  'airport': airportImg,
  'casino': casinoImg,
  'indoor_farm': indoorFarmImg,
  'indoor-farm': indoorFarmImg,
  'apartment': apartmentImg,
  'cold_storage': coldStorageImg,
  'cold-storage': coldStorageImg,
  'shopping_center': shoppingCenterImg,
  'shopping-center': shoppingCenterImg,
  'government': governmentImg,
  'gas_station': retailImg, // Using retail image as fallback
  'gas-station': retailImg,
  'residential': apartmentImg, // Using apartment/office image as fallback
  'microgrid': officeImg, // Using office image as fallback
};

// Industry to use_case_id mapping
const INDUSTRY_TO_USE_CASE: Record<string, string> = {
  'car_wash': '4c736f5e-3d8e-44e0-8472-68a903d406d2',
  'car-wash': '4c736f5e-3d8e-44e0-8472-68a903d406d2',
  'hotel': '5c60a1ef-acb0-4ddd-83ad-8834c1e81ed9',
  'data_center': '79884210-7439-45fd-8853-b1c3978b75e7',
  'data-center': '79884210-7439-45fd-8853-b1c3978b75e7',
  'ev_charging': '19d0266d-feb9-4c6e-8f70-905b06f16e71',
  'ev-charging': '19d0266d-feb9-4c6e-8f70-905b06f16e71',
  'college': 'dd7fb36d-342e-4198-8267-c292d1155022',
  'manufacturing': '77b9da75-9805-4635-91e2-db9bfed2e5fb',
  'hospital': '0e2c2c6c-0939-41f9-b1ba-bf7d1d34eaf9',
  'warehouse': '50a119a7-99b5-4403-b6a7-18ce5816ab53',
  'airport': 'eca5965d-ce78-438a-af1b-2b1cb49dd6a8',
  'casino': '2be3845b-66f2-4e36-985d-58cc3a488e21',
  'indoor_farm': '91a73821-e782-4380-935b-56f4472c566f',
  'indoor-farm': '91a73821-e782-4380-935b-56f4472c566f',
  'apartment': '908acfe0-7ef8-4fb7-85c2-56700dc815b9',
  'retail': '67d5aa44-4f0c-49b6-af24-ba9cc6a1e368',
  'office': 'e72265cf-d87e-41cc-9676-24dc215590b5',
  'microgrid': 'ff7473e1-09b4-4a48-bcfd-c0901d124914',
  'agricultural': '3a697fd6-ed56-4ad3-b4d5-1d6f5fa0692a',
  'agriculture': '3a697fd6-ed56-4ad3-b4d5-1d6f5fa0692a', // Alias for Step2Industry
  'restaurant': '67d5aa44-4f0c-49b6-af24-ba9cc6a1e368', // Using retail use case ID as fallback - TODO: Get actual restaurant use case ID
  'shopping_center': 'f9510e02-05cd-467b-ba31-9aa54c66dd17',
  'shopping-center': 'f9510e02-05cd-467b-ba31-9aa54c66dd17',
  'government': '36e2303b-0e7f-4a26-b177-ec3e0bdb8cd3',
  'gas_station': '56ff75de-f2ef-4fb8-a9b0-4586887fbd3c',
  'gas-station': '56ff75de-f2ef-4fb8-a9b0-4586887fbd3c',
  'cold_storage': '757f3665-dade-42a3-848b-21392b4343b5',
  'cold-storage': '757f3665-dade-42a3-848b-21392b4343b5',
  'residential': '24ebfd00-562d-47e8-803b-278281f2e807',
};

// Section icon mapping
const SECTION_ICONS: Record<string, string> = {
  'Property Basics': 'Building2', 'Facility Basics': 'Building2', 'Building Basics': 'Building2',
  'Station Basics': 'Fuel', 'Store Basics': 'Store', 'Farm Basics': 'Tractor',
  'Campus Basics': 'GraduationCap', 'Airport Basics': 'Plane', 'Project Basics': 'Target',
  'Building Systems': 'Layers', 'Equipment': 'Settings', 'Equipment & Operations': 'Cog',
  'Equipment & Fleet': 'Truck', 'Refrigeration Systems': 'Snowflake', 'Growing Systems': 'Sprout',
  'Charger Mix': 'Battery', 'Guest Amenities': 'Dumbbell', 'Site Amenities': 'Coffee',
  'Amenities': 'Dumbbell', 'Amenities & Services': 'Settings', 'Food & Beverage': 'UtensilsCrossed',
  'Operations': 'Clock', 'Gaming Operations': 'Dice5', 'Occupancy': 'Users',
  'Water & Sustainability': 'Droplets', 'Power & Grid': 'Zap', 'Power Infrastructure': 'Zap',
  'Power & Equipment': 'Zap', 'Backup Power': 'Battery', 'Existing Infrastructure': 'Zap',
  'EV & Existing Infrastructure': 'PlugZap', 'Existing & EV Infrastructure': 'PlugZap',
  'Existing Assets': 'Zap', 'Cooling': 'Thermometer', 'Temperature Zones': 'Thermometer',
  'Climate Control': 'Thermometer', 'Parking & Exterior': 'Car', 'Site & Infrastructure': 'Building',
  'Facilities': 'Building2', 'Ground Transportation': 'Car', 'Solar & EV Interest': 'Sun',
  'Solar Interest': 'Sun', 'Solar & Storage Interest': 'Sun', 'Energy Profile': 'Activity',
  'Energy Costs': 'DollarSign', 'Sustainability': 'Leaf', 'Mandates & Goals': 'Target',
  'Resiliency': 'Shield', 'Resilience Requirements': 'Shield', 'Critical Systems': 'HeartPulse',
  'New Resources': 'Plus', 'Grid Services': 'TrendingUp', 'Project Requirements': 'FileText',
  'General': 'HelpCircle',
};

// Icon components map
const IconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2, Layers, Dumbbell, UtensilsCrossed, Settings, Car, Zap, PlugZap,
  Factory, Server, GraduationCap, Users, Thermometer, Droplets, Wind, Battery,
  DollarSign, Leaf, Shield, Clock, Calendar, Square, Gauge, Target, HelpCircle,
  CheckCircle2, Building, Home, Mountain, Truck, Coffee, Fuel, Activity,
  TrendingUp, TrendingDown, Waves, Sparkles, Monitor, Lightbulb, TreePine, Key,
  Warehouse, Shirt, Store, CircleOff, Flame, Snowflake, Box, Bot, Award,
  FileText, Star, Heart, Library, Briefcase, Theater, FlaskConical, Wrench,
  Cog, Package, Cpu, Sofa, Wifi, Umbrella, Bath, ShoppingBag, Sun, Check,
  LayoutGrid, MapPin, Ruler, Circle, CircleDot, Castle, Dog, Recycle, RotateCw,
  Plus, Minus, X, ChevronDown, Loader2, AlertCircle, Lock, MessageCircle,
  Plane, Bed, Stethoscope, HeartPulse, Scan, Radio, Atom,
  ArrowUpDown, DoorOpen, Bus, Scale, Landmark, Flag, Phone,
  Archive, BarChart, Feather, Ticket, Tag, Film, Baby,
  ShoppingCart, Calculator, Milk, Apple, Carrot, Cherry, Fish,
  Wheat, Tractor, CloudRain, Cloud, Cylinder, IceCream, Pill,
  Beef, Sprout, Fan, Dice5, Wine, Beer, Music, ChefHat,
  ConciergeBell, GitBranch, Unplug, ToggleRight, Infinity,
  ArrowUpRight, ArrowLeftRight, ArrowRight,
};

function LucideIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  console.log(`[LucideIcon] Looking up icon: "${name}"`);
  const Icon = IconComponents[name];
  if (!Icon) {
    console.warn(`[LucideIcon] Icon "${name}" not found in IconComponents. Available keys:`, Object.keys(IconComponents).slice(0, 30));
    return <HelpCircle className={className} />;
  }
  console.log(`[LucideIcon] Found icon component for "${name}"`);
  try {
    return <Icon className={className} />;
  } catch (error) {
    console.error(`[LucideIcon] Error rendering icon "${name}":`, error);
    return <HelpCircle className={className} />;
  }
}

// ============================================================================
// PILL SELECT COMPONENT - BETTER COLORS
// ============================================================================

interface PillSelectProps {
  question: CustomQuestion;
  value: string;
  onChange: (value: string) => void;
  colorScheme?: ColorScheme;
}

function PillSelect({ question, value, onChange, colorScheme }: PillSelectProps) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const options = Array.isArray(question.options) 
    ? question.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
    : [];

  const useGrid = options.length > 4;

  return (
    <div className={useGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-2.5" : "flex flex-wrap gap-2.5"}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        // Debug: Log ALL icon values for hotelCategory
        if (question.field_name === 'hotelCategory') {
          console.log(`[PillSelect] Option: ${opt.label}, value: ${opt.value}, icon: ${opt.icon}, icon type: ${typeof opt.icon}, full opt:`, opt);
        }
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-3 rounded-xl text-left transition-all flex items-center gap-2.5 min-w-0 flex-1 backdrop-blur-md
              ${isSelected
                ? `${scheme.selectedBg} border ${scheme.selectedBorder} ${scheme.selectedText} shadow-lg ${scheme.selectedShadow}`
                : 'bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 ' + scheme.hoverBorder
              }`}
          >
            {opt.icon && (
              <LucideIcon name={opt.icon} className={`w-4 h-4 flex-shrink-0 ${isSelected ? scheme.selectedIcon : 'text-purple-400/70'}`} />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{opt.label}</div>
              {opt.description && (
                <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                  {opt.description}
                </div>
              )}
            </div>
            {isSelected && <Check className="w-4 h-4 text-purple-200 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// NUMBER INPUT COMPONENT
// ============================================================================

function NumberInput({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: number; onChange: (v: number) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const optionsConfig = question.options && !Array.isArray(question.options) 
    ? question.options as { min?: number; max?: number; step?: number }
    : null;
  
  const min = optionsConfig?.min ?? parseFloat(question.min_value || '0');
  const max = optionsConfig?.max ?? parseFloat(question.max_value || '1000000');
  const step = optionsConfig?.step ?? 1;
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className={`w-11 h-11 rounded-xl ${scheme.numberButtonBg} backdrop-blur-md border ${scheme.numberButtonBorder} ${scheme.numberButtonHover} text-white flex items-center justify-center transition-all`}
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center px-4 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
          <span className="text-2xl font-bold text-white">{formatNumber(value)}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className={`w-11 h-11 rounded-xl ${scheme.numberButtonBg} backdrop-blur-md border ${scheme.numberButtonBorder} ${scheme.numberButtonHover} text-white flex items-center justify-center transition-all`}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer ${scheme.numberSliderAccent}`}
      />
      <div className="flex justify-between text-xs text-slate-400 px-1">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// BOOLEAN INPUT COMPONENT
// ============================================================================

function BooleanInput({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: boolean; onChange: (v: boolean) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md
          ${value === true 
            ? `${scheme.selectedBg} border ${scheme.selectedBorder} ${scheme.selectedText} shadow-md ${scheme.selectedShadow}` 
            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 ' + scheme.hoverBorder
          }`}
      >
        <Check className="w-4 h-4" />
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md
          ${value === false 
            ? 'bg-slate-500/30 border border-slate-400/50 text-white shadow-md' 
            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-purple-400/30'
          }`}
      >
        <X className="w-4 h-4" />
        No
      </button>
    </div>
  );
}

// ============================================================================
// MULTISELECT INPUT COMPONENT
// ============================================================================

function MultiselectInput({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: string[]; onChange: (v: string[]) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const options = Array.isArray(question.options) 
    ? question.options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
    : [];

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {options.map((opt) => {
        const isSelected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggleOption(opt.value)}
            className={`px-4 py-3 rounded-xl text-left transition-all flex items-center gap-2.5 backdrop-blur-md
              ${isSelected
                ? `${scheme.selectedBg} border ${scheme.selectedBorder} ${scheme.selectedText} shadow-md ${scheme.selectedShadow}`
                : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 ' + scheme.hoverBorder
              }`}
          >
            {opt.icon && <LucideIcon name={opt.icon} className={`w-4 h-4 flex-shrink-0 ${isSelected ? scheme.selectedIcon : 'text-slate-500'}`} />}
            <span className="text-sm font-medium flex-1">{opt.label}</span>
            {isSelected && <Check className={`w-4 h-4 ${scheme.selectedIcon} flex-shrink-0`} />}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// TEXT INPUT COMPONENT
// ============================================================================

function TextInput({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: string; onChange: (v: string) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || 'Enter your answer...'}
      className={`w-full px-4 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white text-sm placeholder-slate-400 ${scheme.textFocusBorder} focus:ring-1 ${scheme.textFocusRing} focus:bg-white/10 transition-all`}
    />
  );
}

// ============================================================================
// QUESTION ITEM COMPONENT
// ============================================================================

function QuestionItem({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: any; onChange: (v: any) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const iconName = question.icon_name || 'HelpCircle';
  
  return (
    <div className="py-4 border-b border-amber-500/20 last:border-b-0">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${scheme.questionIconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 border ${scheme.questionIconBorder}`}>
          <LucideIcon name={iconName} className={`w-4 h-4 ${scheme.questionIconText}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm">
            {question.question_text}
            {question.is_required && <span className="text-pink-400 ml-1">*</span>}
          </h4>
          {question.help_text && (
            <p className="text-xs text-slate-400 mt-1">{question.help_text}</p>
          )}
        </div>
      </div>
      
      <div className="ml-12">
        {question.question_type === 'select' && <PillSelect question={question} value={value || ''} onChange={onChange} colorScheme={scheme} />}
        {question.question_type === 'number' && <NumberInput question={question} value={value || 0} onChange={onChange} colorScheme={scheme} />}
        {question.question_type === 'boolean' && <BooleanInput question={question} value={value} onChange={onChange} colorScheme={scheme} />}
        {question.question_type === 'multiselect' && <MultiselectInput question={question} value={value || []} onChange={onChange} colorScheme={scheme} />}
        {question.question_type === 'text' && <TextInput question={question} value={value || ''} onChange={onChange} colorScheme={scheme} />}
      </div>
    </div>
  );
}

// ============================================================================
// EXPANDABLE SECTION - BETTER COLORS + SCROLL TO TOP
// ============================================================================

interface ExpandableSectionProps {
  section: Section;
  index: number;
  isExpanded: boolean;
  completedCount: number;
  totalRequired: number;
  onToggle: () => void;
  getValue: (q: CustomQuestion) => any;
  updateAnswer: (f: string, v: any) => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

function ExpandableSection({
  section, index, isExpanded, completedCount, totalRequired,
  onToggle, getValue, updateAnswer, sectionRef
}: ExpandableSectionProps) {
  const scheme = getColorScheme(index);
  const isComplete = totalRequired > 0 && completedCount >= totalRequired;
  const iconName = section.icon || 'HelpCircle';

  return (
    <div 
      ref={sectionRef}
      className={`rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-md ${
        isExpanded 
          ? `${scheme.sectionExpandedBg} border ${scheme.sectionExpandedBorder} shadow-lg ${scheme.sectionExpandedShadow}` 
          : isComplete
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-white/5 border border-white/10 ' + scheme.hoverBorder
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
      >
        {/* Number badge */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm backdrop-blur-md ${
          isComplete
            ? 'bg-emerald-500/30 border border-emerald-400/50 text-emerald-200'
            : isExpanded
              ? `${scheme.sectionBadge} border ${scheme.sectionBadgeBorder} ${scheme.sectionBadgeText}`
              : 'bg-white/5 border border-white/10 text-slate-300'
        }`}>
          {isComplete ? <Check className="w-4 h-4" /> : index + 1}
        </div>

        {/* Title */}
        <div className="flex items-center gap-2.5 flex-1">
          <LucideIcon 
            name={iconName} 
            className={`w-4 h-4 ${isComplete ? 'text-emerald-300' : isExpanded ? scheme.sectionIcon : 'text-slate-400'}`} 
          />
          <div className="text-left">
            <h3 className={`font-semibold text-sm ${isComplete ? 'text-emerald-300' : isExpanded ? 'text-white' : 'text-slate-200'}`}>
              {section.name}
            </h3>
            <p className="text-xs text-slate-400">{section.questions.length} questions</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {totalRequired > 0 && (
            <div className={`px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md ${
              isComplete ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-white/5 text-slate-300 border border-white/10'
            }`}>
              {completedCount}/{totalRequired}
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-amber-500/30 pt-3">
            {section.questions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                value={getValue(question)}
                onChange={(val) => updateAnswer(question.field_name, val)}
                colorScheme={scheme}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Step3Details({ state, updateState }: Props) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<number>(0);
  const [showMerlin, setShowMerlin] = useState(true);
  
  // Refs for each section to scroll to
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const useCaseId = INDUSTRY_TO_USE_CASE[state.industry] || null;

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      if (!useCaseId) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('custom_questions')
          .select('*')
          .eq('use_case_id', useCaseId)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        setQuestions(data || []);
        setExpandedSection(0);
        console.log("[Step3] Loaded questions:", data?.length, "for industry:", state.industry);
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [useCaseId, state.industry]);

  // Group by section
  const sections = useMemo(() => {
    const grouped: Record<string, CustomQuestion[]> = {};
    questions.forEach((q) => {
      const sectionName = q.section_name || 'General';
      if (!grouped[sectionName]) grouped[sectionName] = [];
      grouped[sectionName].push(q);
    });

    return Object.entries(grouped).map(([name, qs]) => ({
      name,
      icon: SECTION_ICONS[name] || 'HelpCircle',
      questions: qs.sort((a, b) => a.display_order - b.display_order),
    }));
  }, [questions]);

  // Update answer - FIXED: Use functional update to prevent race conditions
  const updateAnswer = (fieldName: string, value: any) => {
    updateState(prev => ({
      useCaseData: { ...prev.useCaseData, [fieldName]: value }
    }));
  };

  // Get value
  const getValue = (question: CustomQuestion) => {
    const stored = state.useCaseData?.[question.field_name];
    if (stored !== undefined) return stored;
    
    if (question.default_value) {
      if (question.question_type === 'number') return parseFloat(question.default_value);
      if (question.question_type === 'boolean') return question.default_value === 'true';
      return question.default_value;
    }
    
    return question.question_type === 'number' ? 0 : 
           question.question_type === 'boolean' ? false :
           question.question_type === 'multiselect' ? [] : '';
  };

  // Section completion
  const getSectionCompletion = (sectionQuestions: CustomQuestion[]) => {
    const required = sectionQuestions.filter(q => q.is_required);
    const completed = required.filter(q => {
      const val = state.useCaseData?.[q.field_name];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
    return { total: required.length, completed: completed.length };
  };

  // Toggle section with scroll to top
  const handleToggleSection = (index: number) => {
    if (expandedSection === index) {
      setExpandedSection(-1);
    } else {
      setExpandedSection(index);
      // Scroll to top of section after a small delay for animation
      setTimeout(() => {
        sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Overall progress
  const requiredQuestions = questions.filter(q => q.is_required);
  const answeredRequired = requiredQuestions.filter(q => {
    const val = state.useCaseData?.[q.field_name];
    return val !== undefined && val !== '' && val !== null && !(Array.isArray(val) && val.length === 0);
  });
  const progress = requiredQuestions.length > 0 
    ? Math.round((answeredRequired.length / requiredQuestions.length) * 100)
    : 100;

  const industryLabel = state.industryName || 'Your Facility';

  // Merlin messages based on progress
  const getMerlinMessage = () => {
    if (progress === 0) {
      return `👋 Let's customize your ${industryLabel} energy solution! Click on each section below and answer the questions. I'll calculate your optimal system as you go!`;
    } else if (progress < 50) {
      return `📝 Great start! You're ${progress}% done. Keep going - each answer helps me design a better system for you!`;
    } else if (progress < 100) {
      return `🔥 Almost there! ${progress}% complete. Just a few more questions to unlock your personalized quote!`;
    } else {
      return `✅ Excellent! All questions answered! Click "Continue" below to see your custom energy solution!`;
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <p className="text-amber-300 text-lg">Loading {industryLabel} questions...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/50 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-300 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
          Retry
        </button>
      </div>
    );
  }

  // No questions
  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-amber-500/20 border border-amber-500/50 rounded-xl text-center">
        <Building2 className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-amber-300 font-medium">No specific questions for {industryLabel}. Click Continue to proceed.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      {/* ================================================================== */}
      {/* MERLIN ADVISOR - LEFT SIDE - ACTIVE PROMPTS */}
      {/* ================================================================== */}
      {showMerlin && (
        <div 
          className="fixed z-50"
          style={{ left: '24px', bottom: '100px', maxWidth: '320px' }}
        >
          <div className="bg-slate-800 border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/20 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">Merlin</span>
                <span className="text-amber-100 text-sm">Energy Advisor</span>
              </div>
              <button onClick={() => setShowMerlin(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex gap-3">
              <img src={merlinIcon} alt="Merlin" className="w-14 h-14 rounded-full border-2 border-amber-500 flex-shrink-0" />
              <div>
                <p className="text-white text-sm leading-relaxed">{getMerlinMessage()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* BANNER - Industry Image */}
      {/* ================================================================== */}
      <div className="mb-10">
        <div style={{
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 24,
          height: 200,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
          <img
            src={INDUSTRY_IMAGES[state.industry] || INDUSTRY_IMAGES['hotel']}
            alt={industryLabel}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 32px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: 36,
              fontWeight: 700,
              margin: 0,
              color: 'white',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              {industryLabel} Energy Profile
            </h1>
            <p style={{
              color: '#94a3b8',
              marginTop: 8,
              fontSize: 16,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)'
            }}>
              Tell us about your property • {questions.length} questions
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================================== */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Tell Us About Your {industryLabel}
              {state.state && <span className="text-purple-400"> in {state.state}</span>}
            </h1>
            
            {/* Location Details Bar */}
            {(state.electricityRate || state.solarData) && (
              <div className="flex items-center justify-center gap-6 mt-3">
                {state.electricityRate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-400">Utility Rate:</span>
                    <span className="text-white font-medium">${state.electricityRate.toFixed(2)}/kWh</span>
                  </div>
                )}
                {state.solarData && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sun className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-400">Solar:</span>
                    <span className="text-white font-medium">{state.solarData.sunHours} hrs/day</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      state.solarData.rating === 'A' ? 'bg-green-500/20 text-green-400' :
                      state.solarData.rating === 'B' ? 'bg-blue-500/20 text-blue-400' :
                      state.solarData.rating === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {state.solarData.rating}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-slate-400 mt-2">
              {answeredRequired.length} of {requiredQuestions.length} required • {progress}% complete
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="max-w-md mx-auto">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => {
            const { total, completed } = getSectionCompletion(section.questions);
            return (
              <ExpandableSection
                key={section.name}
                section={section}
                index={index}
                isExpanded={expandedSection === index}
                completedCount={completed}
                totalRequired={total}
                onToggle={() => handleToggleSection(index)}
                getValue={getValue}
                updateAnswer={updateAnswer}
                sectionRef={(el) => { sectionRefs.current[index] = el; }}
              />
            );
          })}
        </div>

        {/* Completion indicator */}
        {progress >= 100 && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center">
            <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              All required questions answered. Click Continue below!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
