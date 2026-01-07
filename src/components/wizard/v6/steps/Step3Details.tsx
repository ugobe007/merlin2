/**
 * V6 Step 3: Facility Details - Expandable Panels
 * 
 * FIXES APPLIED:
 * 1. Better color contrast (amber/orange panels, green selected buttons)
 * 2. Scroll to TOP of panel when clicked
 * 3. Active Merlin prompts to fill questionnaire
 * 4. Merlin uses new_profile_merlin.png icon
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
  ConciergeBell, GitBranch, Unplug, ToggleRight, Infinity as InfinityIcon,
  ArrowUpRight, ArrowLeftRight, ArrowRight
} from 'lucide-react';
import type { WizardState } from '../types';
import { supabase } from '@/services/supabaseClient';
import { industryQuestionnaires } from '@/data/industryQuestionnaires';

// Import Merlin image
import merlinIcon from '@/assets/images/new_profile_merlin.png';

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
import truckStopImg from '@/assets/images/truck_stop.png';

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
  // Section 0: Purple (Primary - Consistent with app theme)
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
  // Section 1: Cyan (Secondary - Consistent with app theme)
  {
    selectedBg: 'bg-cyan-500/30',
    selectedBorder: 'border-cyan-400/60',
    selectedText: 'text-white',
    selectedShadow: 'shadow-cyan-500/25',
    selectedIcon: 'text-cyan-100',
    hoverBorder: 'hover:border-cyan-400/40',
    sectionExpandedBg: 'bg-cyan-950/20',
    sectionExpandedBorder: 'border-cyan-500/40',
    sectionExpandedShadow: 'shadow-cyan-500/10',
    sectionIcon: 'text-cyan-400',
    sectionBadge: 'bg-cyan-500/30',
    sectionBadgeBorder: 'border-cyan-400/50',
    sectionBadgeText: 'text-cyan-200',
    numberButtonBg: 'bg-cyan-500/20',
    numberButtonBorder: 'border-cyan-400/40',
    numberButtonHover: 'hover:bg-cyan-500/35',
    numberSliderAccent: 'accent-cyan-500',
    questionIconBg: 'bg-cyan-500/20',
    questionIconBorder: 'border-cyan-400/30',
    questionIconText: 'text-cyan-400',
    textFocusBorder: 'focus:border-cyan-400/60',
    textFocusRing: 'focus:ring-cyan-500/30',
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
  'heavy_duty_truck_stop': truckStopImg,
  'truck_stop': truckStopImg,
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

function normalizeIndustryToUseCaseSlug(industry: string | null | undefined): string | null {
  if (!industry) return null;
  // Prefer DB slugs (kebab-case) where they exist; keep a minimal alias map
  // for older snake_case variants.
  const aliases: Record<string, string> = {
    car_wash: 'car-wash',
    ev_charging: 'ev-charging',
    data_center: 'data-center',
    indoor_farm: 'indoor-farm',
    shopping_center: 'shopping-center',
    gas_station: 'gas-station',
    cold_storage: 'cold-storage',
    agriculture: 'agricultural',
  };
  return aliases[industry] || industry;
}

function getSmartDefaultsForIndustry(state: WizardState): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  // Climate zone inference (hot/cold/moderate)
  const hotStates = new Set(['AZ', 'NV', 'TX', 'FL', 'CA', 'NM', 'OK', 'LA', 'MS', 'AL', 'GA', 'SC', 'HI']);
  const coldStates = new Set(['MN', 'WI', 'NY', 'ME', 'VT', 'NH', 'MA', 'MI', 'ND', 'SD', 'MT', 'WY', 'AK']);
  if (state.state) {
    defaults.climateZone = hotStates.has(state.state)
      ? 'hot'
      : coldStates.has(state.state)
        ? 'cold'
        : 'moderate';
  }

  // Industry-specific defaults
  if (state.industry === 'heavy_duty_truck_stop') {
    defaults.operatingHours = '24_7';
    defaults.mcsChargers = 2; // Typical flagship location
    defaults.dcfc350 = 10;
    defaults.level2 = 20;
    defaults.serviceBays = 6;
    defaults.truckWashBays = 1;
    defaults.restaurantSeats = 150;
    defaults.hasShowers = true;
    defaults.hasLaundry = true;
    defaults.parkingLotAcres = 5;
    defaults.gridCapacityKW = '5000-10000';
    defaults.monthlyElectricBill = '15000-30000';
    defaults.monthlyDemandCharges = '5000-10000';
    defaults.backupRequirements = 'critical';
    defaults.primaryBESSApplication = 'demand_charge_management';
  } else if (state.industry === 'hotel') {
    defaults.operatingHours = '24_7';
    // Infer from room count if available
    const roomCount = state.useCaseData?.roomCount || state.useCaseData?.rooms;
    if (typeof roomCount === 'number' && roomCount > 0) {
      defaults.squareFeet = roomCount * 400; // ~400 sqft per room average
      defaults.monthlyElectricBill = roomCount < 50 ? '2000-5000' : roomCount < 150 ? '5000-15000' : '15000-30000';
      defaults.gridCapacityKW = roomCount < 50 ? '200-500' : roomCount < 150 ? '500-1000' : '1000-2000';
    }
  } else if (state.industry === 'car_wash') {
    defaults.operatingHours = '12-16';
    defaults.numberOfTunnels = 2;
    defaults.vacuumStations = 6;
    defaults.monthlyElectricBill = '2000-5000';
  } else if (state.industry === 'data_center') {
    defaults.operatingHours = '24_7';
    defaults.backupRequirements = 'critical';
    defaults.primaryBESSApplication = 'backup_power';
  } else if (state.industry === 'office') {
    defaults.operatingHours = '8-12';
    defaults.monthlyElectricBill = '2000-10000';
  } else if (state.industry === 'retail') {
    defaults.operatingHours = '10-14';
    defaults.monthlyElectricBill = '1000-5000';
  } else if (state.industry === 'restaurant') {
    defaults.operatingHours = '10-16';
    defaults.monthlyElectricBill = '2000-8000';
  } else if (state.industry === 'hospital') {
    defaults.operatingHours = '24_7';
    defaults.backupRequirements = 'critical';
    defaults.primaryBESSApplication = 'backup_power';
  } else if (state.industry === 'manufacturing') {
    defaults.operatingHours = '16-24';
    defaults.monthlyElectricBill = '10000-50000';
  }

  // Common defaults for most industries
  if (!defaults.operatingHours) {
    defaults.operatingHours = '12-16';
  }
  if (!defaults.backupRequirements) {
    defaults.backupRequirements = 'important';
  }
  if (!defaults.primaryBESSApplication) {
    defaults.primaryBESSApplication = 'demand_charge_management';
  }

  return defaults;
}

const QUICK_REVIEW_FIELDS_BY_INDUSTRY: Record<string, string[]> = {
  heavy_duty_truck_stop: [
    'mcsChargers',
    'dcfc350',
    'serviceBays',
    'climateZone',
    'gridCapacityKW',
    'monthlyElectricBill',
    'monthlyDemandCharges',
    'backupRequirements',
  ],
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
  ConciergeBell, GitBranch, Unplug, ToggleRight, Infinity: InfinityIcon,
  ArrowUpRight, ArrowLeftRight, ArrowRight,
};

function LucideIcon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const Icon = IconComponents[name];
  if (!Icon) {
    return <HelpCircle className={className} />;
  }
  try {
    return <Icon className={className} />;
  } catch {
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
            {isSelected && (
              <div className="flex-shrink-0">
                <Check className="w-5 h-5 text-purple-200" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// NUMBER INPUT COMPONENT - Vertical stack: Input on top, buttons below
// ============================================================================

function NumberInput({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: number; onChange: (v: number) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const optionsConfig = question.options && !Array.isArray(question.options) 
    ? question.options as { min?: number; max?: number; step?: number }
    : null;
  
  const min = optionsConfig?.min ?? parseFloat(question.min_value || '0');
  const max = optionsConfig?.max ?? parseFloat(question.max_value || '1000000');
  const step = optionsConfig?.step ?? 1;

  // Vertical stack ONLY: Input on top, buttons below (NO landscape layout)
  return (
    <div className="w-full flex flex-col">
      {/* Input field - full width, on top */}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const newValue = parseFloat(e.target.value) || min;
          onChange(Math.max(min, Math.min(max, newValue)));
        }}
        className="w-full px-3 py-2.5 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 backdrop-blur-md rounded-lg border-2 border-purple-400/40 text-white text-base font-bold text-center focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 shadow-lg shadow-purple-500/20 transition-all hover:border-purple-400/60 hover:shadow-purple-500/30"
        placeholder={question.placeholder || '0'}
      />
      {/* Buttons BELOW input - centered, horizontal row */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 border-2 border-purple-400/60 text-white flex items-center justify-center transition-all hover:from-purple-400 hover:to-cyan-400 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 border-2 border-purple-400/60 text-white flex items-center justify-center transition-all hover:from-purple-400 hover:to-cyan-400 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// BOOLEAN INPUT COMPONENT
// ============================================================================

function BooleanInput({ value, onChange, colorScheme }: { question: CustomQuestion; value: boolean; onChange: (v: boolean) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md
          ${value === true 
            ? `${scheme.selectedBg} border ${scheme.selectedBorder} ${scheme.selectedText} shadow-md ${scheme.selectedShadow}` 
            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 ' + scheme.hoverBorder
          }`}
      >
        <Check className="w-3.5 h-3.5" />
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md
          ${value === false 
            ? 'bg-slate-500/30 border border-slate-400/50 text-white shadow-md' 
            : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-purple-400/30'
          }`}
      >
        <X className="w-3.5 h-3.5" />
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
// QUESTION PAIRING CONFIGURATION
// ============================================================================

// Define pairs/groups of questions that should be rendered side-by-side
// Matches by field_name or question_text keywords (case-insensitive)
const QUESTION_PAIRS: Array<[string | RegExp, string | RegExp]> = [
  // Car wash: Number of Bays/Tunnels with Tunnel Length
  [/number.*(?:wash.*tunnel|tunnel.*or.*bay|bay.*or.*tunnel)/i, /tunnel.*length/i],
  [/number.*(?:bay|tunnel)/i, /tunnel.*length/i],
  [/bay.*count/i, /tunnel.*length/i],
  // Car wash: Vacuum Stations with High-Pressure Pumps
  [/vacuum.*station/i, /(?:high.*pressure|pressure).*pump/i],
  [/number.*vacuum/i, /(?:number.*pump|high.*pressure.*pump)/i],
  [/vacuum/i, /(?:high.*pressure|pressure).*pump/i],
  // Truck stop: Chargers (MCS, DCFC, Level 2)
  [/mcs.*charger/i, /dc.*fast.*charger/i],
  [/mcs.*charger/i, /level.*2.*charger/i],
  [/dc.*fast.*charger/i, /level.*2.*charger/i],
];

// Define groups of 3+ questions that should be rendered on the same row
const QUESTION_GROUPS: Array<string[]> = [
  // Truck stop chargers: MCS, DCFC, Level 2
  ['mcsChargers', 'dcfc350', 'level2'],
];

// Check if two questions should be paired
function shouldPairQuestions(q1: CustomQuestion, q2: CustomQuestion): boolean {
  const q1Text = `${q1.field_name} ${q1.question_text}`.toLowerCase();
  const q2Text = `${q2.field_name} ${q2.question_text}`.toLowerCase();
  
  for (const [pattern1, pattern2] of QUESTION_PAIRS) {
    const match1 = typeof pattern1 === 'string' 
      ? q1Text.includes(pattern1.toLowerCase())
      : pattern1.test(q1Text);
    const match2 = typeof pattern2 === 'string'
      ? q2Text.includes(pattern2.toLowerCase())
      : pattern2.test(q2Text);
    
    if (match1 && match2) return true;
    
    // Also check reverse order
    const reverseMatch1 = typeof pattern2 === 'string'
      ? q1Text.includes(pattern2.toLowerCase())
      : pattern2.test(q1Text);
    const reverseMatch2 = typeof pattern1 === 'string'
      ? q2Text.includes(pattern1.toLowerCase())
      : pattern1.test(q2Text);
    
    if (reverseMatch1 && reverseMatch2) return true;
  }
  return false;
}

// Group questions into pairs
function groupQuestionsIntoPairs(questions: CustomQuestion[]): Array<CustomQuestion | CustomQuestion[]> {
  const result: Array<CustomQuestion | CustomQuestion[]> = [];
  const used = new Set<number>();
  
  for (let i = 0; i < questions.length; i++) {
    if (used.has(i)) continue;
    
    // Only pair number-type questions
    if (questions[i].question_type === 'number') {
      // Look for a matching pair
      for (let j = i + 1; j < questions.length; j++) {
        if (used.has(j)) continue;
        if (questions[j].question_type === 'number' && shouldPairQuestions(questions[i], questions[j])) {
          result.push([questions[i], questions[j]]);
          used.add(i);
          used.add(j);
          break;
        }
      }
      if (!used.has(i)) {
        result.push(questions[i]);
        used.add(i);
      }
    } else {
      result.push(questions[i]);
      used.add(i);
    }
  }
  
  return result;
}

// ============================================================================
// COMPACT QUESTION ITEM COMPONENT (for paired questions)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CompactQuestionItem({ question, value, onChange, colorScheme }: { question: CustomQuestion; value: any; onChange: (v: any) => void; colorScheme?: ColorScheme }) {
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const iconName = question.icon_name || 'HelpCircle';
  
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${scheme.questionIconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 border ${scheme.questionIconBorder}`}>
          <LucideIcon name={iconName} className={`w-3.5 h-3.5 ${scheme.questionIconText}`} />
        </div>
        <h4 className="text-white font-semibold text-xs flex-1">
          {question.question_text}
          {question.is_required && <span className="text-pink-400 ml-1">*</span>}
        </h4>
      </div>
      {question.help_text && (
        <p className="text-xs text-slate-400 mb-2 ml-9">{question.help_text}</p>
      )}
      <div>
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
// QUESTION ITEM COMPONENT
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function QuestionItem({ question, value, onChange, colorScheme, compact }: { question: CustomQuestion; value: any; onChange: (v: any) => void; colorScheme?: ColorScheme; compact?: boolean }) {
  if (compact) {
    return <CompactQuestionItem question={question} value={value} onChange={onChange} colorScheme={colorScheme} />;
  }
  
  const scheme = colorScheme || COLOR_SCHEMES[0];
  const iconName = question.icon_name || 'HelpCircle';
  
  return (
    <div className="py-2.5 border-b border-white/5 last:border-b-0">
      <div className="flex items-start gap-2.5 mb-2">
        <div className={`w-7 h-7 rounded-lg ${scheme.questionIconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 border ${scheme.questionIconBorder}`}>
          <LucideIcon name={iconName} className={`w-3.5 h-3.5 ${scheme.questionIconText}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">
            {question.question_text}
            {question.is_required && <span className="text-pink-400 ml-1">*</span>}
          </h4>
          {question.help_text && (
            <p className="text-xs text-slate-400 mt-1">{question.help_text}</p>
          )}
        </div>
      </div>
      
      <div className="ml-9.5">
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue: (q: CustomQuestion) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <div className="border-t border-white/10 pt-3">
            {groupQuestionsIntoPairs(section.questions).map((item, _idx) => {
              if (Array.isArray(item)) {
                // Render paired questions side-by-side
                const [q1, q2] = item;
                return (
                  <div key={`pair-${q1.id}-${q2.id}`} className="py-2.5 border-b border-white/5 last:border-b-0">
                    <div className="grid grid-cols-2 gap-4">
                      <CompactQuestionItem
                        question={q1}
                        value={getValue(q1)}
                        onChange={(val) => updateAnswer(q1.field_name, val)}
                        colorScheme={scheme}
                      />
                      <CompactQuestionItem
                        question={q2}
                        value={getValue(q2)}
                        onChange={(val) => updateAnswer(q2.field_name, val)}
                        colorScheme={scheme}
                      />
                    </div>
                  </div>
                );
              } else {
                // Render single question
                return (
                  <QuestionItem
                    key={item.id}
                    question={item}
                    value={getValue(item)}
                    onChange={(val) => updateAnswer(item.field_name, val)}
                    colorScheme={scheme}
                  />
                );
              }
            })}
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
  const [resolvedUseCaseId, setResolvedUseCaseId] = useState<string | null>(null);
  
  // Refs for each section to scroll to
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const useCaseSlug = useMemo(() => normalizeIndustryToUseCaseSlug(state.industry), [state.industry]);

  const buildFallbackQuestions = (): CustomQuestion[] => {
    const questionnaire = industryQuestionnaires[state.industry];
    if (!questionnaire) return [];

    const fallbackSection = questionnaire.title || 'Facility Details';
    return questionnaire.questions.map((q, idx) => {
      const opts = Array.isArray(q.options)
        ? q.options.map((opt: any) => {
            if (typeof opt === 'string') return { label: opt, value: opt };
            return { label: opt.label, value: opt.value, description: opt.description };
          })
        : null;

      // Normalize types (industryQuestionnaires supports multi-select variants)
      const type = (q.type === 'multi-select' || q.type === 'multiselect') ? 'multiselect' : q.type;

      return {
        id: q.id,
        use_case_id: 'fallback',
        question_text: q.label || q.question || q.id,
        question_type: type as any,
        field_name: q.id,
        options: opts,
        is_required: true,
        min_value: null,
        max_value: null,
        default_value: null,
        display_order: idx + 1,
        help_text: q.helpText || null,
        placeholder: q.placeholder || null,
        is_advanced: false,
        section_name: fallbackSection,
        icon_name: null,
      };
    });
  };

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      if (!state.industry) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let useCaseId: string | null = null;

        // 1) Preferred path: resolve use case by slug (no hard-coded UUIDs)
        if (useCaseSlug) {
          const { data: useCaseRow, error: useCaseErr } = await supabase
            .from('use_cases')
            .select('id')
            .eq('slug', useCaseSlug)
            .eq('is_active', true)
            .maybeSingle();

          if (!useCaseErr && useCaseRow?.id) {
            useCaseId = useCaseRow.id;
          }
        }

        // 2) Fallback path: legacy UUID mapping
        if (!useCaseId) {
          useCaseId = INDUSTRY_TO_USE_CASE[state.industry] || null;
        }

        setResolvedUseCaseId(useCaseId);

        if (!useCaseId) {
          const fallback = buildFallbackQuestions();
          setQuestions(fallback);
          setExpandedSection(0);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('custom_questions')
          .select('*')
          .eq('use_case_id', useCaseId)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        const dbQuestions = data || [];
        if (dbQuestions.length === 0) {
          // DB missing questions for this use case → fallback to code-based questionnaire.
          const fallback = buildFallbackQuestions();
          setQuestions(fallback);
        } else {
          setQuestions(dbQuestions);
        }
        setExpandedSection(0);
        console.log("[Step3] Loaded questions:", dbQuestions.length, "for industry:", state.industry, "use_case_slug:", useCaseSlug, "use_case_id:", useCaseId);
      } catch (err) {
        console.error('Error fetching questions:', err);
        // As a last resort, try code-based fallback before showing an error.
        const fallback = buildFallbackQuestions();
        if (fallback.length > 0) {
          setQuestions(fallback);
          setExpandedSection(0);
          setError(null);
        } else {
          setError('Failed to load questions. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [state.industry, useCaseSlug]);

  // Apply smart defaults (consultative) once questions are loaded.
  useEffect(() => {
    if (loading || questions.length === 0) return;
    const smartDefaults = getSmartDefaultsForIndustry(state);
    const keys = Object.keys(smartDefaults);
    if (keys.length === 0) return;

    updateState(prev => {
      const existing = prev.useCaseData || {};
      const next = { ...existing };
      let changed = false;
      for (const k of keys) {
        if (next[k] === undefined) {
          next[k] = smartDefaults[k];
          changed = true;
        }
      }
      return changed ? { ...prev, useCaseData: next } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length, state.industry, state.state]);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const quickReviewFields = QUICK_REVIEW_FIELDS_BY_INDUSTRY[state.industry] || [];
  const quickReviewQuestions = useMemo(() => {
    if (quickReviewFields.length === 0) return [];
    const byField = new Map(questions.map(q => [q.field_name, q]));
    return quickReviewFields.map(f => byField.get(f)).filter(Boolean) as CustomQuestion[];
  }, [questions, quickReviewFields]);

  const defaultValueMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const q of questions) {
      if (q.default_value !== null && q.default_value !== undefined && q.default_value !== '') {
        if (q.question_type === 'number') map[q.field_name] = parseFloat(q.default_value);
        else if (q.question_type === 'boolean') map[q.field_name] = q.default_value === 'true';
        else map[q.field_name] = q.default_value;
      }
    }
    const smartDefaults = getSmartDefaultsForIndustry(state);
    for (const [k, v] of Object.entries(smartDefaults)) map[k] = v;
    return map;
  }, [questions, state]);

  // Adaptive question filtering - show/hide questions based on previous answers
  const visibleQuestions = useMemo(() => {
    return questions.filter((q: CustomQuestion) => {
      // Check if question should be visible based on current answers
      const currentData = state.useCaseData || {};
      
      // Hotel-specific adaptive logic
      if (state.industry === 'hotel') {
        const hotelCategory = currentData.hotelCategory || currentData.propertyType;
        const roomCount = currentData.roomCount || currentData.rooms || 0;
        
        // Hide luxury amenities if not full-service
        if (q.field_name === 'hasSpa' || q.field_name === 'hasGym' || q.field_name === 'hasFullServiceRestaurant') {
          if (hotelCategory === 'limited' || hotelCategory === 'extended_stay') return false;
        }
        
        // Show large hotel questions only if room count > 150
        if (q.field_name === 'hasConferenceCenter' || q.field_name === 'hasBallroom') {
          if (roomCount < 150) return false;
        }
        
        // Show small hotel questions only if room count < 50
        if (q.field_name === 'hasValet' || q.field_name === 'hasConcierge') {
          if (roomCount >= 50) return false;
        }
      }
      
      // Truck stop adaptive logic
      if (state.industry === 'heavy_duty_truck_stop') {
        // Show MCS questions only if user indicates interest in truck charging
        if (q.field_name === 'mcsChargers' && currentData.wantsTruckCharging === false) {
          return false;
        }
      }
      
      // Default: show all questions
      return true;
    });
  }, [questions, state.industry, state.useCaseData]);

  // Group questions for row layout
  const groupedQuestions = useMemo(() => {
    const result: Array<CustomQuestion | CustomQuestion[]> = [];
    const used = new Set<number>();
    const questionMap = new Map(visibleQuestions.map((q, idx) => [q.field_name, { q, idx }]));
    
    // First, handle QUESTION_GROUPS (3+ questions on same row)
    for (const group of QUESTION_GROUPS) {
      const groupQuestions = group
        .map(fieldName => questionMap.get(fieldName))
        .filter(Boolean) as Array<{ q: CustomQuestion; idx: number }>;
      
      if (groupQuestions.length >= 2) {
        result.push(groupQuestions.map(item => item.q));
        groupQuestions.forEach(item => used.add(item.idx));
      }
    }
    
    // Then, handle pairs
    for (let i = 0; i < visibleQuestions.length; i++) {
      if (used.has(i)) continue;
      
      if (visibleQuestions[i].question_type === 'number') {
        for (let j = i + 1; j < visibleQuestions.length; j++) {
          if (used.has(j)) continue;
          if (visibleQuestions[j].question_type === 'number' && shouldPairQuestions(visibleQuestions[i], visibleQuestions[j])) {
            result.push([visibleQuestions[i], visibleQuestions[j]]);
            used.add(i);
            used.add(j);
            break;
          }
        }
        if (!used.has(i)) {
          result.push(visibleQuestions[i]);
          used.add(i);
        }
      } else {
        result.push(visibleQuestions[i]);
        used.add(i);
      }
    }
    
    return result;
  }, [visibleQuestions]);

  // Build contextual header message
  const contextualHeader = useMemo(() => {
    const parts: string[] = [];
    
    if (state.city && state.state) {
      parts.push(`${state.city}, ${state.state}`);
    } else if (state.state) {
      parts.push(state.state);
    }
    
    if (state.industry === 'hotel') {
      const roomCount = state.useCaseData?.roomCount || state.useCaseData?.rooms;
      if (roomCount) {
        parts.push(`${roomCount}-room hotel`);
      } else {
        parts.push(industryLabel);
      }
      
      const hotelCategory = state.useCaseData?.hotelCategory || state.useCaseData?.propertyType;
      if (hotelCategory === 'full_service' || hotelCategory === 'luxury') {
        parts.push('(Full Service)');
      } else if (hotelCategory === 'limited') {
        parts.push('(Limited Service)');
      }
    } else {
      parts.push(industryLabel);
    }
    
    return parts.join(' + ');
  }, [state.city, state.state, state.industry, state.useCaseData, industryLabel]);

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
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-purple-300 text-lg">Loading {industryLabel} questions...</p>
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
      <div className="max-w-md mx-auto p-6 bg-purple-500/20 border border-purple-500/50 rounded-xl text-center">
        <Building2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <p className="text-purple-300 font-medium">No specific questions for {industryLabel}. Click Continue to proceed.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      {/* Personalized Greeting when business is known */}
      {state.businessName && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl">🧙</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-lg">
                <span className="font-bold text-purple-300">{state.businessName}</span>, let&apos;s configure your energy system!
              </p>
              <p className="text-slate-300 text-sm">
                Fill in the details below and I&apos;ll build the perfect solution for your business.
              </p>
            </div>
            {state.businessPhotoUrl && (
              <img src={state.businessPhotoUrl} alt={state.businessName} className="w-16 h-16 rounded-lg object-cover border-2 border-purple-500/50 flex-shrink-0" />
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MERLIN ADVISOR - LEFT SIDE - ACTIVE PROMPTS */}
      {/* ================================================================== */}
      {showMerlin && (
        <div 
          className="fixed z-50"
          style={{ left: '24px', top: '100px', maxWidth: '320px' }}
        >
          <div className="bg-slate-800 border border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">Merlin</span>
                <span className="text-purple-100 text-sm">Energy Advisor</span>
              </div>
              <button onClick={() => setShowMerlin(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex gap-3">
              <img src={merlinIcon} alt="Merlin" className="w-14 h-14 rounded-full border-2 border-purple-500 flex-shrink-0" />
              <div>
                <p className="text-white text-sm leading-relaxed">{getMerlinMessage()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* CONSULTATIVE REVIEW - All Questions in One List */}
      {/* ================================================================== */}
      <div className="max-w-4xl mx-auto">
        {/* Header: "Based on [Location] + [Industry], here's what I'm assuming:" */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-2xl">🧙</span>
              </div>
              <div className="flex-1">
                <h2 className="text-white text-xl font-bold mb-2">
                  Based on {contextualHeader}, here&apos;s what I&apos;m assuming:
                </h2>
                <p className="text-slate-300 text-sm">
                  I&apos;ve pre-filled {visibleQuestions.length} estimates based on industry standards and your location. 
                  Tap any value to adjust. Only change what&apos;s wrong.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All Questions in Clean List */}
        <div className="space-y-3 mb-8">
          {groupedQuestions.map((item, groupIdx) => {
            const isGroup = Array.isArray(item);
            const questionsToRender = isGroup ? item : [item];
            
            // If it's a group of number inputs, render them side-by-side
            if (isGroup && questionsToRender.every(q => q.question_type === 'number')) {
              return (
                <div
                  key={`group-${questionsToRender.map(q => q.field_name).join('-')}`}
                  className="rounded-xl border backdrop-blur-md p-4 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border-purple-400/30 hover:border-purple-400/50 transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {questionsToRender.map((q, qIdx) => {
                      const scheme = getColorScheme(groupIdx + qIdx);
                      const current = getValue(q);
                      const def = defaultValueMap[q.field_name];
                      const isChanged = def !== undefined && current !== def;
                      const iconName = q.icon_name || 'HelpCircle';
                      
                      return (
                        <div key={q.id || q.field_name} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-lg ${scheme.questionIconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 border ${scheme.questionIconBorder}`}>
                              <LucideIcon name={iconName} className={`w-3 h-3 ${scheme.questionIconText}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-xs">
                                {q.question_text}
                                {q.is_required && <span className="text-pink-400 ml-1">*</span>}
                              </h4>
                            </div>
                            {isChanged && (
                              <div className="text-[9px] px-1 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 whitespace-nowrap">
                                ✓
                              </div>
                            )}
                          </div>
                          {q.help_text && (
                            <p className="text-[10px] text-slate-400 mb-2">{q.help_text}</p>
                          )}
                          <NumberInput
                            question={q}
                            value={typeof current === 'number' ? current : parseFloat(String(current || 0))}
                            onChange={(val) => updateAnswer(q.field_name, val)}
                            colorScheme={scheme}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            // Single question or non-number group - render normally
            return questionsToRender.map((q, qIdx) => {
              const scheme = getColorScheme(groupIdx + qIdx);
              const current = getValue(q);
              const def = defaultValueMap[q.field_name];
              const isChanged = def !== undefined && current !== def;
              const iconName = q.icon_name || 'HelpCircle';
              
              return (
                <div
                  key={q.id || q.field_name}
                  className={`rounded-xl border backdrop-blur-md p-4 transition-all ${
                    isChanged
                      ? 'bg-emerald-500/10 border-emerald-400/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 border-white/10 hover:bg-white/7 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${scheme.questionIconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 border ${scheme.questionIconBorder}`}>
                      <LucideIcon name={iconName} className={`w-4 h-4 ${scheme.questionIconText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium text-sm">
                          {q.question_text}
                          {q.is_required && <span className="text-pink-400 ml-1">*</span>}
                        </h4>
                        {isChanged && (
                          <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 whitespace-nowrap">
                            Updated
                          </div>
                        )}
                      </div>
                      {q.help_text && (
                        <p className="text-xs text-slate-400 mt-0.5">{q.help_text}</p>
                      )}
                    </div>
                  </div>

                  <div className="ml-11">
                    {q.question_type === 'select' && (
                      <PillSelect
                        question={q}
                        value={String(current || '')}
                        onChange={(val) => updateAnswer(q.field_name, val)}
                        colorScheme={scheme}
                      />
                    )}
                    {q.question_type === 'number' && (
                      <NumberInput
                        question={q}
                        value={typeof current === 'number' ? current : parseFloat(String(current || 0))}
                        onChange={(val) => updateAnswer(q.field_name, val)}
                        colorScheme={scheme}
                      />
                    )}
                    {q.question_type === 'boolean' && (
                      <BooleanInput
                        question={q}
                        value={Boolean(current)}
                        onChange={(val) => updateAnswer(q.field_name, val)}
                        colorScheme={scheme}
                      />
                    )}
                    {q.question_type === 'multiselect' && (
                      <MultiselectInput
                        question={q}
                        value={Array.isArray(current) ? current : []}
                        onChange={(val) => updateAnswer(q.field_name, val)}
                        colorScheme={scheme}
                      />
                    )}
                    {q.question_type === 'text' && (
                      <TextInput
                        question={q}
                        value={String(current || '')}
                        onChange={(val) => updateAnswer(q.field_name, val)}
                        colorScheme={scheme}
                      />
                    )}
                  </div>
                </div>
              );
            });
          })}
        </div>

        {/* "Looks good? Let's calculate your system" Message */}
        <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 rounded-xl p-6 mt-8 text-center">
          <p className="text-white font-semibold text-lg mb-2">
            {progress >= 100 ? (
              <>✅ All set! Use the &quot;Continue&quot; button below to calculate your system.</>
            ) : (
              <>Complete {requiredQuestions.length - answeredRequired.length} more required field{requiredQuestions.length - answeredRequired.length !== 1 ? 's' : ''} to continue</>
            )}
          </p>
          <p className="text-slate-300 text-sm">
            {progress >= 100 
              ? 'Review your answers above and adjust anything that looks wrong. Then click Continue in the footer.'
              : 'Tap any field above to adjust Merlin\'s estimates.'}
          </p>
        </div>
      </div>
    </div>
  );
}
