import { type ReactElement } from "react";
import {
  Sliders,
  Gauge,
  PiggyBank,
  Landmark,
  FileSpreadsheet,
  ScrollText,
  BarChart3,
  Box,
  Wand2,
} from "lucide-react";

/**
 * Phase 1G Part 2 - Tool Cards Configuration Hook
 * 
 * Provides the tool cards configuration for the Landing View.
 * Organized into tiers:
 * - CORE: Always available
 * - PROFESSIONAL: Premium badge
 * - PREMIUM: Locked/teased features
 */

interface UseToolCardsConfigParams {
  setViewMode: (mode: any) => void;
  setShowQuotePreview: (show: boolean) => void;
  onClose: () => void;
  onOpenFinancing?: () => void;
  onOpenQuoteTemplates?: () => void;
  onOpenMarketIntel?: () => void;
}

export interface ToolCard {
  id: string;
  icon: ReactElement;
  title: string;
  description: string;
  color: string;
  action: () => void;
  tier: "core" | "pro" | "premium";
  badge?: string;
  locked?: boolean;
  comingSoon?: boolean;
}

export function useToolCardsConfig(params: UseToolCardsConfigParams): ToolCard[] {
  const {
    setViewMode,
    setShowQuotePreview,
    onClose,
    onOpenFinancing,
    onOpenQuoteTemplates,
    onOpenMarketIntel,
  } = params;

  return [
    // ═══ CORE TOOLS (Row 1) ═══
    {
      id: "custom-config",
      icon: <Sliders className="w-8 h-8" />,
      title: "System Configuration",
      description:
        "Design your complete BESS system with electrical specs, renewables, and detailed parameters",
      color: "from-blue-500 via-teal-500 to-emerald-600",
      action: () => setViewMode("custom-config"),
      tier: "core",
    },
    {
      id: "interactive-dashboard",
      icon: <Gauge className="w-8 h-8" />,
      title: "Interactive Dashboard",
      description: "Fine-tune with real-time sliders and see instant cost & ROI updates",
      color: "from-cyan-400 via-blue-500 to-indigo-600",
      action: () => setViewMode("interactive-dashboard"),
      tier: "core",
    },
    {
      id: "financial-calculator",
      icon: <PiggyBank className="w-8 h-8" />,
      title: "Financial Calculator",
      description: "Calculate ROI, payback period, NPV, and financing options",
      color: "from-emerald-400 via-green-500 to-teal-600",
      action: () => {
        onClose();
        onOpenFinancing?.();
      },
      tier: "core",
    },

    // ═══ PROFESSIONAL TOOLS (Row 2) ═══
    {
      id: "professional-financial",
      icon: <Landmark className="w-8 h-8" />,
      title: "Bank-Ready Model",
      description: "3-Statement pro-forma with DSCR, LCOS, IRR, MACRS, and revenue stacking",
      color: "from-emerald-400 via-teal-500 to-green-600",
      action: () => setViewMode("professional-model"),
      tier: "pro",
      badge: "NEW",
    },
    {
      id: "quote-preview",
      icon: <FileSpreadsheet className="w-8 h-8" />,
      title: "Quote Export",
      description: "Generate professional quotes in Word and Excel formats",
      color: "from-blue-400 via-teal-500 to-emerald-600",
      action: () => setShowQuotePreview(true),
      tier: "pro",
    },
    {
      id: "custom-reports",
      icon: <ScrollText className="w-8 h-8" />,
      title: "Custom Reports",
      description: "Generate detailed proposals, technical specs, and documentation",
      color: "from-teal-400 via-cyan-500 to-sky-600",
      action: () => {
        onClose();
        onOpenQuoteTemplates?.();
      },
      tier: "pro",
    },

    // ═══ PREMIUM TOOLS (Row 3 - Teased/Locked) ═══
    {
      id: "market-analytics",
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Market Analytics",
      description: "Market trends, pricing intelligence, and competitive analysis",
      color: "from-blue-400 via-sky-500 to-cyan-600",
      action: () => {
        onClose();
        onOpenMarketIntel?.();
      },
      tier: "premium",
      locked: false, // Set to true to lock
    },
    {
      id: "vendor-library",
      icon: <Box className="w-8 h-8" />,
      title: "Vendor Library",
      description: "Browse batteries, inverters, solar panels, and BOS equipment",
      color: "from-teal-400 via-emerald-500 to-green-600",
      action: () => {
        alert(
          "🔧 Vendor Library\n\nBrowse and compare equipment from leading manufacturers.\n\n✨ Coming Q1 2026"
        );
      },
      tier: "premium",
      locked: true,
      comingSoon: true,
    },
    {
      id: "ai-optimization",
      icon: <Wand2 className="w-8 h-8" />,
      title: "AI Optimizer",
      description: "Let AI analyze your facility and recommend optimal configurations",
      color: "from-emerald-400 via-teal-500 to-cyan-600",
      action: () => {
        alert("🤖 AI Optimizer\n\nAdvanced AI-powered system optimization.\n\n✨ Coming Q1 2026");
      },
      tier: "premium",
      locked: true,
      comingSoon: true,
    },
  ];
}
