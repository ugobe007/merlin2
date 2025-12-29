/**
 * MERLIN WIZARD V5 - DESIGN SYSTEM
 * =================================
 * Single Source of Truth for Visual Language
 * 
 * Based on: November 2025 "Steve Jobs Quality" Design
 * Created: December 21, 2025
 * 
 * KEY DESIGN ELEMENTS:
 * - White cards with subtle shadows
 * - Purple gradient icon badges
 * - Clean dropdowns and toggle buttons
 * - Context bar with location/industry/progress
 * - Floating navigation arrows
 */

import { 
  Building2, Users, ArrowUpDown, Server, Zap, Crown, 
  LayoutGrid, Ruler, Thermometer, Car, Warehouse,
  Sun, Battery, Sparkles, CheckCircle, Info,
  Waves, Dumbbell, Utensils, Coffee, Plug,
  ShoppingBag, Briefcase, Shirt, Wine, ChefHat,
  ParkingCircle, CircleOff, Award, Leaf, ShieldCheck,
  Banknote, Gauge, TrendingUp, TrendingDown, Settings,
  Presentation, Home, Target, Star, Clock
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Primary Purple (Merlin signature)
  purple: {
    gradient: 'from-purple-500 to-violet-600',
    solid: '#8B5CF6',
    dark: '#6D28D9',
    light: '#A78BFA',
  },
  
  // Secondary colors for icon variety
  blue: {
    gradient: 'from-blue-500 to-indigo-500',
    solid: '#3B82F6',
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    solid: '#06B6D4',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-500',
    solid: '#10B981',
  },
  amber: {
    gradient: 'from-amber-400 to-orange-500',
    solid: '#F59E0B',
  },
  pink: {
    gradient: 'from-pink-400 to-rose-500',
    solid: '#EC4899',
  },
  slate: {
    gradient: 'from-slate-400 to-slate-600',
    solid: '#64748B',
  },
  
  // UI Colors
  gold: '#ffa600',
  background: {
    page: 'from-purple-950 via-indigo-950 to-slate-950',
    card: '#FFFFFF',
  },
  border: {
    light: '#E5E7EB',
    purple: 'rgba(139, 92, 246, 0.3)',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ICON MAPPING - Maps field names to appropriate icons and colors
// ═══════════════════════════════════════════════════════════════════════════════

export const FIELD_ICON_MAP: Record<string, { icon: any; gradient: string }> = {
  // Building & Facility
  floors: { icon: LayoutGrid, gradient: COLORS.blue.gradient },
  numberOfFloors: { icon: LayoutGrid, gradient: COLORS.blue.gradient },
  buildingClass: { icon: Building2, gradient: COLORS.purple.gradient },
  squareFootage: { icon: Ruler, gradient: COLORS.emerald.gradient },
  buildingSquareFootage: { icon: Ruler, gradient: COLORS.emerald.gradient },
  
  // Occupancy & People
  occupancy: { icon: Users, gradient: COLORS.pink.gradient },
  averageOccupancy: { icon: Users, gradient: COLORS.pink.gradient },
  roomCount: { icon: Building2, gradient: COLORS.purple.gradient },
  bedCount: { icon: Building2, gradient: COLORS.purple.gradient },
  
  // Equipment & Infrastructure
  elevators: { icon: ArrowUpDown, gradient: COLORS.cyan.gradient },
  numberOfElevators: { icon: ArrowUpDown, gradient: COLORS.cyan.gradient },
  dataCenter: { icon: Server, gradient: COLORS.slate.gradient },
  serverRoom: { icon: Server, gradient: COLORS.slate.gradient },
  equipmentTier: { icon: Crown, gradient: COLORS.amber.gradient },
  
  // Energy & Power
  peakDemand: { icon: Zap, gradient: COLORS.amber.gradient },
  solarCapacity: { icon: Sun, gradient: COLORS.amber.gradient },
  batteryCapacity: { icon: Battery, gradient: COLORS.emerald.gradient },
  
  // Amenities
  pool: { icon: Waves, gradient: COLORS.cyan.gradient },
  fitness: { icon: Dumbbell, gradient: COLORS.pink.gradient },
  restaurant: { icon: Utensils, gradient: COLORS.amber.gradient },
  parking: { icon: ParkingCircle, gradient: COLORS.slate.gradient },
  evCharging: { icon: Plug, gradient: COLORS.emerald.gradient },
  
  // Goals & Preferences
  primaryGoal: { icon: Target, gradient: COLORS.purple.gradient },
  bessApplication: { icon: Battery, gradient: COLORS.emerald.gradient },
  
  // Default
  default: { icon: Info, gradient: COLORS.blue.gradient },
};

// Helper to get icon config for a field
export const getFieldIcon = (fieldName: string | undefined | null) => {
  if (!fieldName) return FIELD_ICON_MAP.default;
  const normalized = fieldName.toLowerCase().replace(/[-_\s]/g, '');
  
  for (const [key, value] of Object.entries(FIELD_ICON_MAP)) {
    if (normalized.includes(key.toLowerCase())) {
      return value;
    }
  }
  return FIELD_ICON_MAP.default;
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION ICONS - For toggle buttons and multi-select
// ═══════════════════════════════════════════════════════════════════════════════

export const OPTION_ICONS: Record<string, any> = {
  // Yes/No
  yes: CheckCircle,
  no: CircleOff,
  none: CircleOff,
  
  // Equipment tiers
  standard: Building2,
  premium: Star,
  basic: Home,
  
  // Building classes
  class_a: Award,
  class_b: Building2,
  class_c: Home,
  
  // Pool & Spa
  pool: Waves,
  indoor_pool: Waves,
  outdoor_pool: Waves,
  hot_tub: Waves,
  spa: Sparkles,
  
  // Fitness & Business
  fitness: Dumbbell,
  gym: Dumbbell,
  business_center: Briefcase,
  
  // F&B
  restaurant: Utensils,
  breakfast: Coffee,
  bar: Wine,
  room_service: ChefHat,
  
  // Parking & EV
  parking: ParkingCircle,
  surface: Car,
  structure: ParkingCircle,
  ev_charging: Plug,
  level2: Plug,
  dcfc: Zap,
  
  // Solar
  solar: Sun,
  solar_yes: Sun,
  solar_no: CircleOff,
  
  // Goals
  reduce_costs: Banknote,
  sustainability: Leaf,
  backup_power: ShieldCheck,
  demand_management: TrendingDown,
  peak_shaving: Gauge,
  energy_arbitrage: TrendingUp,
  
  // Default
  default: Settings,
};

// Helper to get option icon
export const getOptionIcon = (optionValue: string) => {
  const normalized = optionValue.toLowerCase().replace(/[-\s]/g, '_');
  return OPTION_ICONS[normalized] || OPTION_ICONS.default;
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAILWIND CLASS COMPOSITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const STYLES = {
  // Question Card (white, rounded, with shadow)
  questionCard: [
    'bg-white',
    'rounded-2xl',
    'p-6',
    'border',
    'border-gray-200',
    'shadow-md',
    'hover:shadow-lg',
    'transition-shadow',
    'duration-200',
  ].join(' '),
  
  // Icon Badge (purple gradient circle)
  iconBadge: (gradient: string) => [
    'w-12',
    'h-12',
    'rounded-xl',
    `bg-gradient-to-br`,
    gradient,
    'flex',
    'items-center',
    'justify-center',
    'shadow-md',
    'flex-shrink-0',
  ].join(' '),
  
  // Dropdown/Select
  select: [
    'w-full',
    'px-4',
    'py-3.5',
    'rounded-xl',
    'bg-white',
    'border',
    'border-gray-200',
    'text-gray-700',
    'appearance-none',
    'cursor-pointer',
    'hover:border-purple-300',
    'focus:border-purple-500',
    'focus:ring-2',
    'focus:ring-purple-200',
    'focus:outline-none',
    'transition-all',
    'duration-200',
  ].join(' '),
  
  // Toggle Button (unselected)
  toggleButton: [
    'px-5',
    'py-3',
    'rounded-xl',
    'border',
    'border-gray-200',
    'bg-white',
    'text-gray-700',
    'hover:border-purple-300',
    'hover:bg-purple-50',
    'transition-all',
    'duration-200',
    'text-left',
  ].join(' '),
  
  // Toggle Button (selected)
  toggleButtonSelected: [
    'px-5',
    'py-3',
    'rounded-xl',
    'border-2',
    'border-purple-500',
    'bg-gradient-to-r',
    'from-purple-500',
    'to-violet-600',
    'text-white',
    'shadow-lg',
    'shadow-purple-500/25',
  ].join(' '),
  
  // Context Bar
  contextBar: [
    'bg-gradient-to-r',
    'from-purple-600/20',
    'via-indigo-600/20',
    'to-blue-600/20',
    'rounded-2xl',
    'p-4',
    'border',
    'border-purple-400/30',
    'backdrop-blur-sm',
  ].join(' '),
  
  // Floating Nav Arrow
  navArrow: [
    'fixed',
    'top-1/2',
    '-translate-y-1/2',
    'w-12',
    'h-12',
    'rounded-full',
    'bg-white/90',
    'backdrop-blur-sm',
    'shadow-lg',
    'border',
    'border-gray-200',
    'flex',
    'items-center',
    'justify-center',
    'text-gray-600',
    'hover:bg-white',
    'hover:text-purple-600',
    'hover:border-purple-300',
    'hover:shadow-xl',
    'transition-all',
    'duration-200',
    'cursor-pointer',
    'z-50',
  ].join(' '),
  
  // Continue Button
  continueButton: [
    'flex',
    'items-center',
    'gap-3',
    'px-8',
    'py-4',
    'rounded-2xl',
    'bg-gradient-to-r',
    'from-emerald-500',
    'via-teal-500',
    'to-emerald-500',
    'text-white',
    'font-bold',
    'text-lg',
    'shadow-xl',
    'shadow-emerald-500/25',
    'hover:shadow-emerald-500/40',
    'hover:scale-105',
    'transition-all',
    'duration-200',
    'border-2',
    'border-emerald-400/50',
  ].join(' '),
  
  // Continue Button (disabled)
  continueButtonDisabled: [
    'flex',
    'items-center',
    'gap-3',
    'px-8',
    'py-4',
    'rounded-2xl',
    'bg-gray-400',
    'text-gray-200',
    'font-bold',
    'text-lg',
    'cursor-not-allowed',
    'border-2',
    'border-gray-300',
  ].join(' '),
};

// ═══════════════════════════════════════════════════════════════════════════════
// WIZARD STEP CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const WIZARD_STEPS = [
  {
    number: 1,
    title: 'Location & Goals',
    description: 'Where is your facility and what do you want to achieve?',
    estimatedTime: '1-2 min',
  },
  {
    number: 2,
    title: 'Industry Selection',
    description: 'What type of business are you?',
    estimatedTime: '1 min',
  },
  {
    number: 3,
    title: 'Facility Details',
    description: 'Tell us about your facility specifics',
    estimatedTime: '2-3 min',
  },
  {
    number: 4,
    title: 'Magic Fit',
    description: 'Choose your energy strategy',
    estimatedTime: '1 min',
  },
  {
    number: 5,
    title: 'Your Quote',
    description: 'Review your personalized TrueQuote™',
    estimatedTime: '2 min',
  },
];

export default {
  COLORS,
  FIELD_ICON_MAP,
  OPTION_ICONS,
  STYLES,
  WIZARD_STEPS,
  getFieldIcon,
  getOptionIcon,
};
