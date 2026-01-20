/**
 * CENTRALIZED ICON MAPPING
 * =========================
 * Single source of truth for all icons used in Merlin BESS Quote Builder
 * 
 * RULES:
 * 1. Use Lucide icons for UI elements (buttons, navigation, status)
 * 2. Use industry-specific Lucide icons for use cases
 * 3. Only use emojis for very specific visual flair (sparks, celebrations)
 * 4. Never mix emoji and Lucide for the same concept
 * 
 * Last Updated: January 20, 2026
 */

import {
  // Navigation & Actions
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  
  // Location & Geography
  MapPin,
  Map,
  Globe,
  
  // Building & Infrastructure
  Building,
  Building2,
  Home,
  Hotel,
  Factory,
  Warehouse,
  School,
  Hospital,
  ShoppingCart,
  Store,
  Plane,
  Car,
  Truck,
  
  // Energy & Utilities
  Zap,
  Battery,
  BatteryCharging,
  Sun,
  Wind,
  Fuel,
  Plug,
  
  // Business & Finance
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  
  // Status & Feedback
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Loader2,
  Sparkles,
  
  // Data & Analysis
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  
  // System & Settings
  Settings,
  User,
  Users,
  Shield,
  Lock,
  Eye,
  EyeOff,
  
  // Weather & Climate
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  
  // Tools & Equipment
  Wrench,
  Hammer,
  Tool,
  
  type LucideIcon,
} from "lucide-react";

// =============================================================================
// INDUSTRY / USE CASE ICONS
// =============================================================================

export const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  // Commercial
  "car-wash": Car,
  "hotel": Hotel,
  "office": Building2,
  "retail": Store,
  "restaurant": Store,
  "shopping-center": ShoppingCart,
  "gas-station": Fuel,
  "casino": Building,
  
  // Industrial
  "manufacturing": Factory,
  "warehouse": Warehouse,
  "logistics": Truck,
  "cold-storage": Warehouse,
  "indoor-farm": Factory,
  
  // Institutional
  "hospital": Hospital,
  "college": School,
  "airport": Plane,
  "government": Building2,
  "data-center": Building2,
  
  // Residential
  "apartment": Building,
  "residential": Home,
  
  // Energy
  "ev-charging": Plug,
  "microgrid": Zap,
  
  // Agriculture
  "agricultural": Factory,
};

// =============================================================================
// FUNCTIONAL ICONS (UI Elements)
// =============================================================================

export const UI_ICONS = {
  // Navigation
  back: ChevronLeft,
  forward: ChevronRight,
  next: ArrowRight,
  previous: ArrowLeft,
  expand: ChevronDown,
  collapse: ChevronDown,
  close: X,
  
  // Actions
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  settings: Settings,
  
  // Status
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
  help: HelpCircle,
  loading: Loader2,
  verified: Check,
  
  // Energy
  electricity: Zap,
  battery: Battery,
  charging: BatteryCharging,
  solar: Sun,
  wind: Wind,
  generator: Fuel,
  
  // Location
  location: MapPin,
  map: Map,
  globe: Globe,
  
  // Finance
  savings: DollarSign,
  revenue: TrendingUp,
  cost: TrendingDown,
  chart: BarChart3,
  analytics: Activity,
  
  // Building
  building: Building2,
  facility: Building,
  home: Home,
  
  // Weather
  weather: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  temperature: Thermometer,
  
  // Special
  sparkle: Sparkles,
  shield: Shield,
  
  // Users
  user: User,
  users: Users,
} as const;

// =============================================================================
// EMOJI ICONS (Use Sparingly - Only for Visual Flair)
// =============================================================================

export const EMOJI_ICONS = {
  // Only use for celebrations, magic, special moments
  celebration: "🎉",
  magic: "✨",
  wizard: "🧙",
  fire: "🔥",
  rocket: "🚀",
  
  // Deprecate these - use Lucide instead
  // lightning: "⚡", // Use Zap from Lucide
  // location: "📍", // Use MapPin from Lucide  
  // building: "🏢", // Use Building2 from Lucide
  // checkmark: "✓", // Use Check from Lucide
  // warning: "⚠️", // Use AlertCircle from Lucide
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the appropriate Lucide icon for an industry/use case
 */
export function getIndustryIcon(industrySlug: string): LucideIcon {
  return INDUSTRY_ICONS[industrySlug] || Building2;
}

/**
 * Get a UI icon by name
 */
export function getUIIcon(iconName: keyof typeof UI_ICONS): LucideIcon {
  return UI_ICONS[iconName];
}

/**
 * Check if an industry has a specific icon defined
 */
export function hasIndustryIcon(industrySlug: string): boolean {
  return industrySlug in INDUSTRY_ICONS;
}

// =============================================================================
// ICON SIZE PRESETS
// =============================================================================

export const ICON_SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-10 h-10",
  "3xl": "w-12 h-12",
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/**
 * Get Tailwind classes for icon size
 */
export function getIconSize(size: IconSize = "md"): string {
  return ICON_SIZES[size];
}
