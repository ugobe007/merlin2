/**
 * Advanced Quote Builder Constants
 *
 * Centralized constants for pricing tiers, tool definitions, and configuration defaults.
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.4 - moved early for efficiency)
 */

/**
 * BESS Market Pricing Tiers (Q4 2025)
 * Realistic installed costs including all balance of system components
 */
export const BESS_PRICING_TIERS = [
  {
    name: "Small Systems",
    pricePerKwh: 168,
    capacity: "≤ 2 MWh capacity",
    description: "Includes all BOS + installation",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-400/40",
    textColor: "text-blue-200",
    iconBg: "bg-blue-500/30",
    highlight: false,
  },
  {
    name: "Medium Systems",
    pricePerKwh: 138,
    capacity: "2-15 MWh capacity",
    description: "Commercial & C&I scale",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-400/40",
    textColor: "text-purple-200",
    iconBg: "bg-purple-500/30",
    highlight: false,
  },
  {
    name: "Utility Scale",
    pricePerKwh: 118,
    capacity: "15+ MWh capacity",
    description: "Utility-scale installed cost",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-400/40",
    textColor: "text-green-200",
    iconBg: "bg-green-500/30",
    highlight: true,
  },
] as const;

/**
 * Volume Discount Tiers
 */
export const VOLUME_DISCOUNTS = [
  { threshold: 10, discount: 2, label: "10+ MWh" },
  { threshold: 25, discount: 5, label: "25+ MWh" },
  { threshold: 50, discount: 8, label: "50+ MWh" },
  { threshold: 100, discount: 12, label: "100+ MWh" },
  { threshold: 250, discount: 15, label: "250+ MWh" },
  { threshold: 500, discount: 18, label: "500+ MWh" },
  { threshold: 1000, discount: 22, label: "1+ GWh" },
] as const;

/**
 * Tool Card Definitions
 * Configuration for all tools available in Advanced Quote Builder
 */
export interface ToolCardDefinition {
  id: string;
  title: string;
  description: string;
  color: string;
  iconType: "custom" | "lucide";
  iconName?: string; // For lucide icons
  largeFont?: boolean;
  action?:
    | "custom-config"
    | "interactive-dashboard"
    | "smart-wizard"
    | "financing"
    | "market-intel"
    | "component-library"
    | "quote-templates"
    | "quote-preview";
}

export const TOOL_CARDS: ToolCardDefinition[] = [
  {
    id: "custom-config",
    title: "Start Here",
    description:
      "Complete BESS design with electrical specs, renewables, and detailed system parameters",
    color: "from-amber-500 to-orange-500",
    iconType: "custom", // Uses Merlin image
    largeFont: true,
    action: "custom-config",
  },
  {
    id: "interactive-dashboard",
    title: "Interactive Dashboard",
    description:
      "Fine-tune your configuration with real-time sliders, see instant cost and ROI updates",
    color: "from-cyan-400 via-blue-500 to-indigo-600",
    iconType: "lucide",
    iconName: "Gauge",
    action: "interactive-dashboard",
  },
  {
    id: "ai-optimization",
    title: "Smart Wizard",
    description: "Let our AI suggest the optimal system configuration for your use case",
    color: "from-purple-400 via-pink-500 to-rose-600",
    iconType: "lucide",
    iconName: "Wand2",
    action: "smart-wizard",
  },
  {
    id: "financial-calculator",
    title: "Financial Calculator",
    description: "Calculate ROI, payback period, and financing options",
    color: "from-emerald-400 via-green-500 to-teal-600",
    iconType: "lucide",
    iconName: "PiggyBank",
    action: "financing",
  },
  {
    id: "market-analytics",
    title: "Market Analytics",
    description: "View market trends, pricing intelligence, and competitive analysis",
    color: "from-orange-400 via-red-500 to-pink-600",
    iconType: "lucide",
    iconName: "BarChart3",
    action: "market-intel",
  },
  {
    id: "component-library",
    title: "Vendor Library",
    description: "Browse available batteries, inverters, and balance of system equipment",
    color: "from-indigo-400 via-purple-500 to-violet-600",
    iconType: "lucide",
    iconName: "Box",
    action: "component-library",
  },
  {
    id: "custom-reports",
    title: "Custom Reports",
    description: "Generate detailed proposals, technical specs, and custom documentation",
    color: "from-teal-400 via-cyan-500 to-sky-600",
    iconType: "lucide",
    iconName: "ScrollText",
    action: "quote-templates",
  },
  {
    id: "quote-preview",
    title: "Quote Preview",
    description: "See what your professional quote looks like in Word and Excel formats",
    color: "from-blue-400 via-indigo-500 to-purple-600",
    iconType: "lucide",
    iconName: "Search",
    action: "quote-preview",
  },
] as const;

/**
 * Quick Access Sections
 * Sections available in the quick access buttons
 */
export const QUICK_ACCESS_SECTIONS = [
  {
    id: "electrical",
    label: "Electrical",
    icon: "Zap",
    color: "blue",
    dataSection: "electrical",
  },
  {
    id: "renewables",
    label: "Renewables",
    icon: "Sparkles",
    color: "green",
    dataSection: "renewables",
  },
  {
    id: "financial",
    label: "Financial",
    icon: "Calculator",
    color: "purple",
    dataSection: "financial",
  },
] as const;

/**
 * Preview Format Options
 */
export type PreviewFormat = "word" | "excel";

/**
 * View Mode Options
 */
export type ViewMode = "landing" | "custom-config" | "interactive-dashboard";
